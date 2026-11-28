<!--
	Combat record (2026-11-14, the user's ask: "kan vi inte tracka typ k/d o w/l osv för ALLA
	GRABBARNA"): K/D, W/L and the rest for everyone in the squad, best first. Nothing can fetch MW4
	stats by itself (no open Activision API), so each member types in their own lifetime numbers
	from the game's Combat Record ("Update my stats"); their page publishes them in the squad
	document (squad-combat.ts). Multiplayer or Warzone, sorted by K/D, W/L (win % in Warzone),
	kills or wins; the change since each member's update before shows under their name.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad, type SquadEntry } from '#lib/squad.svelte.ts';
	import { agoParts } from '#lib/squad-codec.ts';
	import {
		combatView,
		fmtDelta,
		fmtRatio,
		kdOf,
		parseField,
		rankCombat,
		COMBAT_MODES,
		MODE_RATIOS,
		MODE_TOTALS,
		type CombatField,
		type CombatMode,
		type CombatSort
	} from '#lib/squad-combat.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import { banKey, banOf, isBanned, BAN_OWNER, JOKE_BANS, KD_LIMIT, type BanView } from '#lib/squad-bans.ts';
	import Dialog from './Dialog.svelte';
	import SquadAvatar from './SquadAvatar.svelte';

	let { entries }: { entries: SquadEntry[] } = $props();
	const c = t.squad.combat;

	let mode = $state<CombatMode>('mp');
	let sort = $state<CombatSort>('kd');
	const SORTS: CombatSort[] = ['kd', 'wl', 'kills', 'wins'];
	const secondLabel = $derived(mode === 'mp' ? c.sorts.wl : c.winRate);
	const sortLabel = (key: CombatSort) => (key === 'wl' ? secondLabel : c.sorts[key]);

	const rows = $derived(
		rankCombat(
			entries.map((e) => ({ e, name: e.member.name, view: combatView(e.member.combat, mode) })),
			sort
		)
	);
	const anyStats = $derived(rows.some((r) => r.view));

	/** "7 Nov" for a "YYYY-MM-DD" day. */
	const dateOf = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	const ago = (ms: number) => t.squad.ago(agoParts(ms, squad.now));
	/** W/L as "1.06"; Warzone's win rate as "6.7%" (rates there are small, so one decimal). */
	const second = (v: number | null) => (v === null ? '–' : mode === 'mp' ? fmtRatio(v) : `${v.toFixed(1)}%`);

	// ----- the form -----

	let open = $state(false);
	let formMode = $state<CombatMode>('mp');
	let text = $state<Partial<Record<CombatField, string>>>({});
	let tried = $state(false);
	let busy = $state(false);

	/** Your latest numbers in a mode as the form's starting text (so an update only changes what moved). */
	function fill(m: CombatMode) {
		const latest = combatView(squad.combat, m)?.latest;
		const next: Partial<Record<CombatField, string>> = {};
		for (const f of [...MODE_TOTALS[m], ...MODE_RATIOS[m]]) {
			const v = latest?.[f];
			if (v !== undefined) next[f] = f === 'kd' || f === 'wl' ? fmtRatio(v) : String(v);
		}
		text = next;
		tried = false;
	}

	function openForm() {
		formMode = mode;
		fill(formMode);
		open = true;
	}

	const parsed = $derived(
		Object.fromEntries([...MODE_TOTALS[formMode], ...MODE_RATIOS[formMode]].map((f) => [f, parseField(f, text[f] ?? '')])) as Partial<
			Record<CombatField, number | null | 'bad'>
		>
	);
	const num = (f: CombatField) => (typeof parsed[f] === 'number' ? (parsed[f] as number) : undefined);
	/** A ratio worked out from the totals typed above it (the ratio field then shows it, read-only). */
	const autoRatio = $derived({
		kd: num('kills') !== undefined && num('deaths') !== undefined ? kdOf({ kills: num('kills'), deaths: num('deaths') }) : null,
		wl:
			formMode === 'mp' && num('wins') !== undefined && num('losses') !== undefined
				? (num('losses')! > 0 ? num('wins')! / num('losses')! : num('wins')!)
				: null
	});
	const anyBad = $derived(Object.entries(parsed).some(([f, v]) => v === 'bad' && !(f in autoRatio && autoRatio[f as 'kd' | 'wl'] !== null)));
	const values = $derived.by(() => {
		const out: Partial<Record<CombatField, number>> = {};
		for (const f of MODE_TOTALS[formMode]) if (num(f) !== undefined) out[f] = num(f);
		for (const f of MODE_RATIOS[formMode]) if (autoRatio[f] === null && num(f) !== undefined) out[f] = num(f);
		return out;
	});
	const empty = $derived(Object.keys(values).length === 0);
	const winsOver = $derived(formMode === 'wz' && num('wins') !== undefined && num('matches') !== undefined && num('wins')! > num('matches')!);

	/** The K/D the form would save: worked out from kills + deaths, else the typed ratio. */
	const formKd = $derived(autoRatio.kd ?? num('kd') ?? null);
	/** Over the limit = a lie, and saving it gets you the BANNED stamp (squad-bans.ts). */
	const lieKd = $derived(formKd !== null && Math.round(formKd * 100) / 100 > KD_LIMIT);

	// ----- the BANNED stamp (squad-bans.ts) -----

	const b = t.squad.ban;
	const OP_NAMES: Record<string, string> = {
		abscar: t.operator.callsign,
		phillestar: t.operator.mate,
		lars: t.operator.lars,
		jeeven: t.operator.jeeven,
		ingman: t.operator.ingman,
		aw: t.operator.aw,
		joker: t.operator.joker,
		meili: t.operator.meili
	};
	/**
	 * For Abscar's box: the code's joke bans, plus everyone whose latest K/D is over the limit or who
	 * wears the stamp by Abscar's own choice, one row each with Lift / Ban again.
	 */
	const banRows = $derived.by(() => {
		const out = new Map<string, { key: string; name: string; view: BanView }>();
		for (const key of Object.keys(JOKE_BANS)) {
			const e = entries.find((x) => x.member.op === key);
			out.set(key, { key, name: OP_NAMES[key] ?? key, view: banOf(key, squad.doc?.bans, e?.member.combat) });
		}
		for (const e of entries) {
			const key = banKey(e.id, e.member.op);
			if (out.has(key)) continue;
			const view = banOf(key, squad.doc?.bans, e.member.combat);
			if (view.fake || view.on) out.set(key, { key, name: (e.member.op && OP_NAMES[e.member.op]) || e.member.name, view });
		}
		return [...out.values()];
	});
	let banBusy = $state(false);
	async function toggleBan(key: string, on: boolean, name: string) {
		banBusy = true;
		const ok = await squad.setBan(key, on, name);
		banBusy = false;
		toast.show(ok ? (on ? b.banned(name) : b.lifted(name)) : b.failed);
	}

	async function save() {
		tried = true;
		if (anyBad || empty || winsOver) return;
		busy = true;
		const ok = await squad.saveCombat(formMode, values);
		busy = false;
		open = false;
		mode = formMode;
		toast.show(ok ? c.saved : c.savedOffline);
	}
</script>

<section class="sq-combat" aria-labelledby="sq-combat-h">
	<div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
		<h3 id="sq-combat-h" class="font-head text-[13px] font-bold tracking-[0.12em] uppercase">{c.heading}</h3>
		<button type="button" class="btn btn-sm btn-primary" onclick={openForm}>{c.update}</button>
	</div>
	<p class="mt-1 max-w-3xl text-xs text-muted">{c.note}</p>

	<!-- the BANNED stamp (squad-bans.ts): only Abscar sees this and can lift or put back the stamp -->
	{#if squad.me?.op === BAN_OWNER}
		{#each banRows as { key, name, view } (key)}
			<div class="sq-banbox mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg px-3 py-2" data-on={view.on}>
				<p class="min-w-0 flex-1 text-xs text-fg">
					{#if view.on}{view.fake ? b.fakeHint(name, fmtRatio(view.fake.kd), KD_LIMIT) : b.hint(name, view.reason)}{:else if view.fake}{b.liftedFakeHint(name, KD_LIMIT)}{:else}{b.liftedHint(name)}{/if}
				</p>
				<button type="button" class="btn btn-sm" class:btn-primary={view.on} disabled={banBusy} onclick={() => void toggleBan(key, !view.on, name)}>
					{view.on ? b.lift(name) : b.again(name)}
				</button>
			</div>
		{/each}
	{/if}

	<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
		<div class="flex flex-wrap gap-1.5" role="group" aria-label={c.modeLabel}>
			{#each COMBAT_MODES as m (m)}
				<button type="button" class="chip" aria-pressed={mode === m} onclick={() => (mode = m)}>{c.modes[m]}</button>
			{/each}
		</div>
		<div class="flex flex-wrap items-center gap-1.5" role="group" aria-label={c.sortLabel}>
			<span class="text-[11px] font-semibold tracking-wider text-muted uppercase" aria-hidden="true">{c.sortLabel}</span>
			{#each SORTS as key (key)}
				<button type="button" class="chip sq-sort" aria-pressed={sort === key} onclick={() => (sort = key)}>{sortLabel(key)}</button>
			{/each}
		</div>
	</div>

	{#if !anyStats}
		<p class="mt-3 text-sm text-muted">{c.empty}</p>
	{/if}
	<ol class="mt-2 grid gap-1.5">
		{#each rows as { e, view }, i (e.id)}
			<li class="sq-crow rounded-lg border border-line bg-panel-2" class:mine={e.mine} data-empty={!view}>
				<span class="sr-only"
					>{view
						? `${c.rowLabel(i + 1, e.member.name, view.kd === null ? '–' : fmtRatio(view.kd), `${secondLabel} ${second(view.wl)}`)}${view.before?.kdDelta != null ? `, ${c.delta(fmtDelta(view.before.kdDelta), dateOf(view.before.day))}` : ''}. ${c.updated(ago(view.latest.at))}`
						: `${e.member.name}: ${c.none}`}</span
				>
				<span class="sq-crank num font-head" aria-hidden="true">{view ? `#${i + 1}` : '–'}</span>
				<span class="sq-cface" aria-hidden="true"><SquadAvatar name={e.member.name} op={e.member.op} size={34} /></span>
				<p class="sq-cname flex min-w-0 items-center gap-1.5" aria-hidden="true">
					<b class="truncate font-head text-[15px] font-bold tracking-wide" title={e.member.name}>{e.member.name}</b>
					{#if e.mine}<span class="sq-cyou font-head">{t.squad.you}</span>{/if}
					{#if isBanned(banKey(e.id, e.member.op), squad.doc?.bans, e.member.combat)}<span class="sq-cbanned font-head">{b.tag}</span>{/if}
				</p>
				<div class="sq-cinfo min-w-0" aria-hidden="true">
					{#if view}
						{@const totals = [
							view.kills !== null ? c.kills(view.kills) : '',
							view.wins !== null ? c.wins(view.wins) : '',
							mode === 'mp' && view.spm !== null ? c.spm(view.spm) : ''
						].filter(Boolean)}
						{#if totals.length}
							<p class="sq-cline text-[11.5px] text-muted">
								<!-- the separators stay plain text: the line can break there, never inside a number -->
								{#each totals as part, ti (part)}{#if ti}{' · '}{/if}<span>{part}</span>{/each}
							</p>
						{/if}
						{#if view.before && (view.before.kdDelta !== null || view.before.form !== null || view.before.kills !== null)}
							{@const b = view.before}
							<p class="sq-ctrend sq-cline flex flex-wrap gap-x-2 text-[11.5px]">
								{#if b.kdDelta !== null}
									<span data-dir={Math.round(b.kdDelta * 100) > 0 ? 'up' : Math.round(b.kdDelta * 100) < 0 ? 'down' : 'flat'}
										>{Math.round(b.kdDelta * 100) > 0 ? '▲' : Math.round(b.kdDelta * 100) < 0 ? '▼' : '•'} {c.delta(fmtDelta(b.kdDelta), dateOf(b.day))}</span
									>
								{/if}
								{#if b.form !== null}<span class="sq-cform" title={c.formHint(dateOf(b.day))}>{c.form(fmtRatio(b.form))}</span>{/if}
								{#if b.kills !== null && b.kills > 0}<span class="text-muted">{c.plusKills(b.kills)}</span>{/if}
							</p>
						{/if}
						<p class="text-[11px] text-muted">{c.updated(ago(view.latest.at))}</p>
					{:else}
						<p class="text-[11.5px] text-muted">{e.mine ? c.noneMine : c.none}</p>
					{/if}
				</div>
				<p class="sq-cstat sq-ckd" class:lead={sort === 'kd'} aria-hidden="true">
					<b class="num">{view?.kd != null ? fmtRatio(view.kd) : '–'}</b><span>{c.sorts.kd}</span>
				</p>
				<p class="sq-cstat sq-cwl" class:lead={sort === 'wl'} aria-hidden="true">
					<b class="num">{view ? second(view.wl) : '–'}</b><span>{secondLabel}</span>
				</p>
			</li>
		{/each}
	</ol>
</section>

<Dialog bind:open title={c.title}>
	<p>{c.where}</p>
	<form
		id="sq-combat-form"
		class="mt-3 grid gap-3"
		novalidate
		onsubmit={(ev) => {
			ev.preventDefault();
			void save();
		}}
	>
		<div class="flex flex-wrap gap-1.5" role="group" aria-label={c.modeLabel}>
			{#each COMBAT_MODES as m (m)}
				<button
					type="button"
					class="chip"
					aria-pressed={formMode === m}
					onclick={() => {
						formMode = m;
						fill(m);
					}}>{c.modes[m]}</button
				>
			{/each}
		</div>
		<div class="grid grid-cols-2 gap-x-3 gap-y-2.5">
			{#each MODE_TOTALS[formMode] as f (formMode + f)}
				{@const bad = parsed[f] === 'bad'}
				<label class="grid min-w-0 gap-1">
					<span class="text-[13px] font-semibold text-fg">{c.fields[f]}</span>
					<input
						bind:value={text[f]}
						inputmode="numeric"
						autocomplete="off"
						spellcheck="false"
						aria-invalid={bad}
						class="sq-cin h-11 w-full min-w-0 rounded-lg border border-line bg-panel-2 px-3 text-base text-fg outline-none focus:border-accent"
					/>
					{#if bad}<span class="text-xs text-fg" role="alert">{c.bad}</span>{/if}
				</label>
			{/each}
		</div>
		<div class="sq-cratios grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-lg p-2.5">
			{#each MODE_RATIOS[formMode] as f (formMode + f)}
				{@const auto = autoRatio[f]}
				{@const bad = auto === null && parsed[f] === 'bad'}
				<label class="grid min-w-0 gap-1">
					<span class="text-[13px] font-semibold text-fg">{c.fields[f]}</span>
					<input
						value={auto !== null ? fmtRatio(auto) : (text[f] ?? '')}
						oninput={(ev) => (text[f] = ev.currentTarget.value)}
						readonly={auto !== null}
						inputmode="decimal"
						autocomplete="off"
						spellcheck="false"
						aria-invalid={bad}
						class="sq-cin h-11 w-full min-w-0 rounded-lg border border-line bg-panel-2 px-3 text-base text-fg outline-none focus:border-accent"
						class:auto={auto !== null}
					/>
					<span class="text-[11px]">{auto !== null ? c.ratioAuto : c.ratioHint}</span>
					{#if bad}<span class="text-xs text-fg" role="alert">{c.bad}</span>{/if}
				</label>
			{/each}
		</div>
		<p class="text-xs">{c.sameDay}</p>
		{#if tried && empty && !anyBad}<p class="text-xs font-semibold text-fg" role="alert">{c.nothing}</p>{/if}
		{#if winsOver}<p class="text-xs font-semibold text-fg" role="alert">{c.winsOver}</p>{/if}
		{#if lieKd && formKd !== null}<p class="sq-cwarn font-head" role="status">{b.formWarn(fmtRatio(formKd), KD_LIMIT)}</p>{/if}
	</form>
	{#snippet actions()}
		<button type="button" class="btn" onclick={() => (open = false)}>{t.squad.cancel}</button>
		<button type="submit" form="sq-combat-form" class="btn btn-primary" disabled={busy}>{c.save}</button>
	{/snippet}
</Dialog>

<style>
	/* a row: rank, face, name with its numbers under it, then the two big ratios */
	.sq-crow {
		display: grid;
		grid-template-columns: 1.9rem auto minmax(0, 1fr) 3.4rem 3.4rem;
		grid-template-areas:
			'rank face name kd wl'
			'rank face info kd wl';
		align-items: center;
		column-gap: 10px;
		padding: 7px 10px;
	}
	.sq-crank {
		grid-area: rank;
	}
	.sq-cface {
		grid-area: face;
		display: flex;
	}
	.sq-cname {
		grid-area: name;
		align-self: end;
	}
	.sq-cinfo {
		grid-area: info;
		align-self: start;
	}
	.sq-ckd {
		grid-area: kd;
	}
	.sq-cwl {
		grid-area: wl;
	}
	/* each number or change wraps as a whole ("+0.02 since 8 Nov" never splits) */
	.sq-cline > span {
		white-space: nowrap;
	}
	.sq-crow.mine {
		border-color: var(--t-accent);
	}
	/* the joke ban: a red tag on the banned member's row, and Abscar's lift / ban-again box */
	.sq-cbanned {
		flex: none;
		padding: 0 6px;
		border: 2px double #ff2a2a;
		border-radius: 4px;
		color: #ff3030;
		font-size: 10px;
		font-weight: 900;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		transform: rotate(-4deg);
	}
	.sq-banbox {
		border: 1px dashed #ff2a2a;
		background: rgb(255 42 42 / 0.1);
	}
	/* the form's warning when the K/D is over the limit */
	.sq-cwarn {
		padding: 6px 10px;
		border: 3px double #ff2a2a;
		border-radius: 6px;
		background: rgb(255 42 42 / 0.12);
		color: var(--t-fg);
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.sq-banbox[data-on='false'] {
		border-color: var(--t-line);
		background: transparent;
	}
	.sq-crow[data-empty='true'] {
		opacity: 0.7;
	}
	.sq-crow[data-empty='true'] .sq-cstat b,
	.sq-crow[data-empty='true'] .sq-crank {
		color: var(--t-muted);
	}
	.sq-crank {
		color: var(--t-accent);
		font-size: 14px;
		font-weight: 800;
	}
	.sq-cyou {
		flex: none;
		padding: 1px 7px;
		border-radius: 999px;
		background: var(--t-accent);
		color: var(--t-bg);
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.sq-cstat {
		display: grid;
		justify-items: end;
		line-height: 1.1;
	}
	.sq-cstat b {
		font-size: 18px;
		font-weight: 800;
		color: var(--t-fg);
	}
	.sq-cstat span {
		font-family: var(--t-font-head);
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--t-muted);
	}
	/* the number the list is sorted by */
	.sq-cstat.lead b {
		color: var(--t-accent);
	}
	.sq-ctrend [data-dir='up'] {
		color: var(--t-buff, #3ee06a);
	}
	.sq-ctrend [data-dir='down'] {
		color: var(--t-nerf, #ff5a5a);
	}
	.sq-ctrend [data-dir='flat'] {
		color: var(--t-muted);
	}
	.sq-cform {
		color: var(--t-fg);
		text-decoration: underline dotted;
		text-underline-offset: 2px;
	}
	/* the form: ratios in their own tinted box */
	.sq-cratios {
		background: rgb(127 127 127 / 0.1);
	}
	.sq-cin.auto {
		color: var(--t-muted);
		border-style: dashed;
	}
	.sq-cin[aria-invalid='true'] {
		border-color: var(--t-nerf, #ff5a5a);
	}
	/* phones: the ratios stay on the name's line, the numbers under it get the whole width */
	@media (max-width: 519px) {
		.sq-crow {
			grid-template-columns: 1.5rem auto minmax(0, 1fr) 3rem 3rem;
			grid-template-areas:
				'rank face name kd wl'
				'rank face info info info';
			column-gap: 8px;
			padding: 7px 8px;
		}
		.sq-cinfo {
			margin-top: 2px;
		}
		.sq-cstat b {
			font-size: 16px;
		}
	}
</style>
