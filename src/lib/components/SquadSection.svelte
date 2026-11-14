<!--
	The Squad tab (2026-11-14, the user's ask: "how can we see each other's progress … some kind of
	login?" + "online/offline status?"): friends' grind side by side, no accounts. A private squad
	link connects you (squad.svelte.ts). Each member gets a card (Gold / Platinum / Harmonic Break,
	Divergence, Mastery per mode, Online or "Seen 2 h ago", last camo), furthest along first, then a
	weapon-by-weapon table. Gunmetal `.meta-list` look in Abscar like the other tabs.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { copyText } from '#lib/browser.ts';
	import { LADDER, MASTERY_TRACKS } from '#lib/data/camos.ts';
	import { CLASSES, WEAPONS } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { peekSquad, squad } from '#lib/squad.svelte.ts';
	import { agoParts, camosThisWeek, cleanName, duelResult, squadCodeFromText, streakDays, weeklyMvps, SQUAD_OPS, type SquadDoc, type SquadOp } from '#lib/squad-codec.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import Dialog from './Dialog.svelte';
	import SquadAvatar from './SquadAvatar.svelte';
	import SquadDuels from './SquadDuels.svelte';
	import SquadRace from './SquadRace.svelte';
	import SquadRadio from './SquadRadio.svelte';

	/** Whether the Squad tab is the one shown (the radio counts as read then). */
	let { visible = false }: { visible?: boolean } = $props();

	const s = t.squad;
	const MASTERY_TOTAL = MASTERY_TRACKS.reduce((n, tr) => n + tr.camos.length, 0);
	const OP_NAMES: Record<SquadOp, string> = {
		abscar: t.operator.callsign,
		phillestar: t.operator.mate,
		lars: t.operator.lars,
		jeeven: t.operator.jeeven
	};
	const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

	// The squad starts once saved progress has been read (+page.svelte's onMount sets progress.ready).
	$effect(() => {
		if (!progress.ready) return;
		return untrack(() => squad.start());
	});

	// A squad link was opened on this page: look at it, then ask for a name.
	$effect(() => {
		const code = squad.offer;
		if (!code) return;
		untrack(() => {
			squad.offer = null;
			void considerCode(code);
		});
	});

	const ago = (ms: number) => s.ago(agoParts(ms, squad.now));
	const statusText = $derived(
		squad.status === 'ok' && squad.updatedAt
			? s.updatedAt(new Date(squad.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
			: s.status[squad.status]
	);
	const entries = $derived(squad.entries);
	const members = $derived(Object.fromEntries(entries.map((e) => [e.id, e.member])));
	const mvps = $derived(weeklyMvps(members, squad.now));
	/** Stickers from lost duels, per member. */
	const stakes = $derived.by(() => {
		const out: Record<string, string[]> = {};
		for (const duel of squad.doc?.duels ?? []) {
			const res = duelResult(duel, members);
			if (res?.loser && duel.stake) (out[res.loser] ??= []).push(duel.stake);
		}
		return out;
	});

	// ----- the name + operator form (create, join, change name) -----

	let formOpen = $state(false);
	let formMode = $state<'create' | 'join' | 'edit'>('create');
	let formName = $state('');
	let formOp = $state<SquadOp | null>(null);
	let formError = $state(false);
	let busy = $state(false);
	/** The squad you're about to join (looked at first). */
	let joining = $state<{ code: string; rev: number; doc: SquadDoc } | null>(null);

	/** Who already picked each operator (shown next to the choice). */
	const opTakenBy = $derived.by(() => {
		const out: Partial<Record<SquadOp, string>> = {};
		const members =
			formMode === 'join' && joining
				? Object.values(joining.doc.members)
				: entries.filter((e) => !e.mine).map((e) => e.member);
		for (const m of members) if (m.op && !out[m.op]) out[m.op] = m.name;
		return out;
	});

	function openForm(mode: 'create' | 'join' | 'edit') {
		formMode = mode;
		formName = mode === 'edit' ? (squad.me?.name ?? '') : '';
		formOp = mode === 'edit' ? (squad.me?.op ?? null) : null;
		formError = false;
		formOpen = true;
	}

	function pickOp(op: SquadOp | null) {
		// an empty name takes the operator's callsign (it stays editable)
		const before = formOp ? OP_NAMES[formOp] : '';
		if (op && (cleanName(formName) === '' || formName === before)) formName = OP_NAMES[op];
		formOp = op;
	}

	async function submitForm() {
		const name = cleanName(formName) || (formOp ? OP_NAMES[formOp] : '');
		if (!name) {
			formError = true;
			return;
		}
		busy = true;
		if (formMode === 'edit') {
			await squad.edit(name, formOp);
			busy = false;
			formOpen = false;
			toast.show(s.toast.saved);
			return;
		}
		const result =
			formMode === 'join' && joining
				? await squad.join(joining.code, joining, name, formOp)
				: await squad.create(name, formOp);
		busy = false;
		formOpen = false;
		joining = null;
		if (result === 'full') toast.show(s.toast.full, undefined, 7000);
		else if (formMode === 'create') {
			toast.show(s.toast.created);
			showLink();
		} else toast.show(s.toast.joined);
	}

	// ----- squad links -----

	let pasteOpen = $state(false);
	let pasteText = $state('');
	let pasteBad = $state(false);

	function usePasted() {
		const code = squadCodeFromText(pasteText);
		pasteBad = code === null;
		if (!code) return;
		pasteOpen = false;
		pasteText = '';
		void considerCode(code);
	}

	async function considerCode(code: string) {
		if (code === squad.code) {
			toast.show(s.toast.already);
			return;
		}
		busy = true;
		const peeked = await peekSquad(code);
		busy = false;
		if (peeked === 'not-found') toast.show(s.toast.notFound, undefined, 7000);
		else if (peeked === 'not-squad') toast.show(s.toast.notSquad, undefined, 7000);
		else if (peeked === 'offline') toast.show(s.toast.offline, undefined, 7000);
		else if (peeked === 'error') toast.show(s.toast.error, undefined, 7000);
		else {
			joining = { code, ...peeked };
			openForm('join');
		}
	}

	let linkOpen = $state(false);
	let linkInput = $state<HTMLInputElement>();
	let copied = $state<boolean | null>(null);
	const link = $derived(squad.code ? squad.link() : null);

	function showLink() {
		copied = null;
		linkOpen = true;
	}

	async function copyLink() {
		if (!link) return;
		copied = await copyText(link);
		if (!copied) {
			linkInput?.focus();
			linkInput?.select();
		}
	}

	async function shareLink() {
		if (!link) return;
		try {
			await navigator.share({ title: s.linkTitle, url: link });
		} catch {
			// share sheet closed
		}
	}

	// ----- leaving and removing -----

	let leaveOpen = $state(false);
	let removing = $state<{ id: string; name: string } | null>(null);
	let removeOpen = $state(false);

	async function leave() {
		leaveOpen = false;
		await squad.leave();
		toast.show(s.toast.left);
	}

	async function remove() {
		const who = removing;
		removeOpen = false;
		removing = null;
		if (!who) return;
		await squad.remove(who.id);
		toast.show(s.toast.removed(who.name));
	}

	/** "120", "2,500", "12.3k", "25k": short enough for three counters side by side on a phone. */
	const shortCount = (n: number) =>
		n >= 10_000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : n.toLocaleString('en-US');
</script>

{#snippet presence(online: boolean, seen: number, mine: boolean)}
	<span class="sq-presence font-hud" data-online={online}>
		<span class="sq-light" aria-hidden="true"></span>{online || mine ? s.online : s.seen(ago(seen))}
	</span>
{/snippet}

<section class="class-card meta-list sq overflow-hidden rounded-card bg-panel shadow-card" style:--c="var(--t-accent)" aria-labelledby="sq-heading">
	<header class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
		<div class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
			<h2 id="sq-heading" class="font-head text-base font-bold tracking-wide uppercase">{s.heading}</h2>
			<span class="font-head text-[11px] font-semibold tracking-widest text-muted uppercase">
				{squad.on ? s.sub(entries.length) : s.subOff}
			</span>
		</div>
		{#if squad.on && statusText}
			<p class="sq-status text-[13px] text-muted" role="status" data-status={squad.status}>{statusText}</p>
		{/if}
	</header>

	{#if !squad.available}
		<p class="border-t border-line px-4 py-4 text-sm text-muted sm:px-5">{s.status.error}</p>
	{:else if !squad.on}
		<div class="grid gap-3 border-t border-line px-4 py-4 sm:px-5">
			<p class="max-w-3xl text-sm text-fg">{s.intro}</p>
			<ol class="sq-steps grid max-w-3xl gap-1.5 text-sm text-muted">
				{#each s.steps as step, i (step)}
					<li class="flex gap-2.5"><span class="sq-step-n num" aria-hidden="true">{i + 1}</span><span>{step}</span></li>
				{/each}
			</ol>
			<div class="mt-1 flex flex-wrap gap-2">
				<button type="button" class="btn btn-primary" disabled={busy} onclick={() => openForm('create')}>{s.create}</button>
				<button type="button" class="btn" disabled={busy} onclick={() => {
						pasteBad = false;
						pasteOpen = true;
					}}>{s.haveLink}</button>
			</div>
		</div>
	{:else}
		<div class="grid gap-4 border-t border-line px-4 py-4 sm:px-5">
			<div class="flex flex-wrap gap-2">
				<!-- Ready up: a banner on the others' pages while yours is open -->
				<button type="button" class="btn sq-ready" aria-pressed={!!squad.readyAt} title={squad.readyAt ? s.ready.onHint : undefined} onclick={() => void squad.toggleReady()}
					>{squad.readyAt ? s.ready.on : s.ready.button}</button
				>
				<button type="button" class="btn btn-primary" onclick={showLink}>{s.invite}</button>
				<button type="button" class="btn" onclick={() => void squad.refreshNow()}>{s.refresh}</button>
				<button type="button" class="btn" onclick={() => openForm('edit')}>{s.edit}</button>
				<button type="button" class="btn" onclick={() => (leaveOpen = true)}>{s.leave}</button>
			</div>

			<SquadRace {entries} />

			<!-- one card per member, furthest along first -->
			<ul class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3">
				{#each entries as e, i (e.id)}
					{@const st = e.stats}
					{@const week = camosThisWeek(e.member, squad.now)}
					{@const streak = streakDays(e.member, squad.now)}
					<li class="sq-card meta-card relative flex min-w-0 flex-col gap-2.5 rounded-card border border-line bg-panel-2 p-3" class:sq-mine={e.mine}>
						<div class="flex min-w-0 items-center gap-2">
							<!-- their operator from the header (or initials), the user's ask 2026-11-14 -->
							<SquadAvatar name={e.member.name} op={e.member.op} size={44} />
							<span class="sq-rank num font-head" aria-label={s.rank(i + 1)}>{s.rank(i + 1)}</span>
							<b class="sq-name min-w-0 truncate font-head text-[17px] font-bold tracking-wide" title={e.member.name}>{e.member.name}</b>
							{#if e.mine}<span class="sq-you font-head">{s.you}</span>{/if}
							<span class="ml-auto flex-none">{@render presence(e.online, e.member.seen, e.mine)}</span>
						</div>
						{#if e.member.op && OP_NAMES[e.member.op] !== e.member.name}
							<p class="-mt-1.5 text-xs text-muted">{s.asOp(OP_NAMES[e.member.op])}</p>
						{/if}
						<!-- this week's camos, the MVP crown, the streak, stickers from lost duels -->
						<div class="flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
							{#if mvps.includes(e.id)}<span class="sq-mvp font-head" title={s.mvp}><svg viewBox="0 0 16 12" aria-hidden="true"><path d="M1 10 2.5 2.5l3.5 4 2-5.5 2 5.5 3.5-4L15 10z" /></svg>{s.mvp}</span>{/if}
							<span class="text-muted">{s.week(week)}</span>
							{#if streak >= 2}<span class="sq-streak font-head" title={s.streak(streak)}>🔥 {s.streak(streak)}</span>{/if}
							{#if e.member.readyAt && squad.now - e.member.readyAt < 45 * 60_000 && e.online}<span class="sq-ready-tag font-head">{s.ready.on}</span>{/if}
						</div>
						{#if stakes[e.id]?.length}
							<div class="flex flex-wrap gap-1.5">
								{#each stakes[e.id] as stake, si (si)}<span class="sq-loser font-head">{stake}</span>{/each}
							</div>
						{/if}

						<!-- Gold / Platinum / Harmonic Break -->
						<div class="grid grid-cols-3 gap-2">
							{#each LADDER as camo, li (camo.id)}
								<div class="min-w-0" aria-label={s.ladderOf(camo.name, st.ladder[li], WEAPONS.length)} role="group">
									<p class="flex items-baseline justify-between gap-1 text-[11px] text-muted" aria-hidden="true">
										<span class="font-head font-semibold tracking-wider uppercase">{camo.short}</span>
										<span class="num text-fg"><b class="text-[15px]">{st.ladder[li]}</b>/{WEAPONS.length}</span>
									</p>
									<div class="sq-bar mt-1" aria-hidden="true">
										<span data-camo={camo.id} style:width="{(st.ladder[li] / WEAPONS.length) * 100}%"></span>
									</div>
								</div>
							{/each}
						</div>

						<p class="sq-div text-[13px]" class:done={st.divergenceLeft === 0}>
							<span aria-hidden="true">{st.divergenceLeft === 0 ? '✔' : '◆'}</span>
							{st.divergenceLeft === 0 ? s.divergenceDone : s.divergenceLeft(st.divergenceLeft)}
						</p>

						<!-- Mastery camos (the 3 per mode after the camo grind): how many done, then three boxes per mode -->
						<div class="sq-mastery grid gap-1">
							<p class="flex items-baseline justify-between text-[11px] text-muted">
								<span class="font-head font-semibold tracking-wider uppercase">{s.masteryLabel}</span>
								<span class="num text-fg" aria-label={s.masteryDone(st.masteryDone, MASTERY_TOTAL)}><b class="text-[15px]">{st.masteryDone}</b>/{MASTERY_TOTAL}</span>
							</p>
							{#each MASTERY_TRACKS as track (track.mode)}
								{@const done = st.mastery[track.mode].filter((x) => x === 'complete').length}
								<div class="sq-mtrack" role="group" aria-label={s.masteryOf(s.modeNames[track.mode])}>
									<p class="flex items-baseline justify-between">
										<span class="sq-mode font-head" data-mode={track.mode} aria-hidden="true">{s.modes[track.mode]}</span>
										<span class="sq-mcount num text-[12px]" class:done={done > 0}><b>{done}</b>/{track.camos.length}</span>
									</p>
									<!-- each camo with its counter (what that member typed in on their own page), 2026-11-14 -->
									<div class="mt-0.5 grid grid-cols-3 gap-1.5">
										{#each track.camos as camo, mi (camo.id)}
											{@const status = st.mastery[track.mode][mi]}
											{@const n = Math.min(e.member.mastery[camo.id] ?? 0, camo.target)}
											<div class="sq-mcell min-w-0" data-status={status} title="{camo.name}: {n.toLocaleString('en-US')} / {camo.target.toLocaleString('en-US')} ({s.masteryStatus[status]})">
												<p class="flex min-w-0 items-center gap-1">
													<span class="sq-mbox" data-status={status} data-mode={track.mode} aria-hidden="true"></span>
													<span class="truncate text-[11px]">{camo.name.replace(' Reforged', '')}</span>
												</p>
												<p class="sq-mnum num text-[12px]"><b>{shortCount(n)}</b>/{shortCount(camo.target)}</p>
												<span class="sq-mbar" data-mode={track.mode} aria-hidden="true"><span style:width="{(n / camo.target) * 100}%"></span></span>
												<span class="sr-only">{camo.name}: {n} of {camo.target}, {s.masteryStatus[status]}</span>
											</div>
										{/each}
									</div>
								</div>
							{/each}
						</div>

						<div class="mt-auto flex min-h-6 items-center justify-between gap-2">
							<p class="text-xs text-muted">{e.member.tickAt ? s.lastCamo(ago(e.member.tickAt)) : s.noCamo}</p>
							{#if !e.mine && !e.online}
								<button type="button" class="sq-remove -my-2.5 min-h-11 px-1 text-xs text-muted underline-offset-2 hover:text-fg hover:underline" onclick={() => {
										removing = { id: e.id, name: e.member.name };
										removeOpen = true;
									}}>{s.remove}</button>
							{/if}
						</div>
					</li>
				{/each}
			</ul>

			<!-- the radio and the duels, side by side on wide screens -->
			<div class="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
				<SquadRadio {visible} />
				<SquadDuels />
			</div>

			<!-- weapon by weapon -->
			<details class="sq-compare" open>
				<summary class="font-head min-h-11 cursor-pointer text-[13px] font-bold tracking-[0.12em] uppercase">{s.compareHeading}</summary>
				<p class="mt-1 text-xs text-muted">{s.compareHint}</p>
				<div class="sq-table-wrap mt-2">
					<table class="sq-table">
						<thead>
							<tr>
								<th scope="col" class="sq-wcol">{s.compareWeapon}</th>
								{#each entries as e (e.id)}
									<th scope="col"><span class="sq-th-name" title={e.member.name}>{e.member.name}</span></th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each CLASSES as cls (cls.id)}
								<tr class="sq-class-row"><th scope="colgroup" colspan={entries.length + 1}>{cls.name}</th></tr>
								{#each cls.weapons as w (w.id)}
									<tr>
										<th scope="row" class="sq-wcol">{w.name}</th>
										{#each entries as e (e.id)}
											{@const lvl = e.member.weapons[w.id] ?? 0}
											<td><span class="sq-lvl font-head" data-level={lvl} title={s.levelLong[lvl]}>{s.levelShort[lvl]}<span class="sr-only"> ({s.levelLong[lvl]})</span></span></td>
										{/each}
									</tr>
								{/each}
							{/each}
						</tbody>
					</table>
				</div>
			</details>
		</div>
	{/if}
</section>

<Dialog bind:open={formOpen} title={formMode === 'edit' ? s.editTitle : formMode === 'join' ? s.joinTitle : s.createTitle}>
	{#if formMode === 'join' && joining}
		{@const names = Object.values(joining.doc.members).map((m) => m.name)}
		<p>{names.length ? s.joinWho(names.join(', ')) : s.joinEmpty}</p>
		{#if squad.on}<p class="mt-1 font-semibold text-fg">{s.joinSwitch}</p>{/if}
	{/if}
	<form
		id="sq-form"
		class="mt-3 grid gap-3"
		onsubmit={(e) => {
			e.preventDefault();
			void submitForm();
		}}
	>
		<label class="grid gap-1">
			<span class="font-semibold text-fg">{s.nameLabel}</span>
			<input
				bind:value={formName}
				maxlength="24"
				autocomplete="nickname"
				spellcheck="false"
				class="h-11 w-full rounded-lg border border-line bg-panel-2 px-3 text-base text-fg outline-none focus:border-accent"
				oninput={() => (formError = false)}
			/>
			<span class="text-xs">{s.nameHint}</span>
		</label>
		{#if formError}<p class="text-xs text-fg" role="alert">{s.nameMissing}</p>{/if}
		<fieldset class="grid gap-1.5">
			<legend class="font-semibold text-fg">{s.opLegend}</legend>
			<p class="text-xs">{s.opHint}</p>
			<div class="mt-1 grid grid-cols-2 gap-1.5">
				{#each [...SQUAD_OPS, null] as op (op ?? 'none')}
					<label class="sq-op flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-panel-2 px-2.5 py-1.5" class:col-span-2={op === null}>
						<input type="radio" name="sq-op" class="size-4 flex-none accent-(--t-accent)" checked={formOp === op} onchange={() => pickOp(op)} />
						<span class="min-w-0 leading-tight">
							<span class="block text-fg">{op ? OP_NAMES[op] : s.opNone}</span>
							{#if op && opTakenBy[op]}<span class="block text-[11px]">{s.opTaken(opTakenBy[op] ?? '')}</span>{/if}
						</span>
					</label>
				{/each}
			</div>
		</fieldset>
	</form>
	{#snippet actions()}
		<button type="button" class="btn" onclick={() => (formOpen = false)}>{s.cancel}</button>
		<button type="submit" form="sq-form" class="btn btn-primary" disabled={busy}
			>{formMode === 'edit' ? s.editGo : formMode === 'join' ? s.joinGo : s.createGo}</button
		>
	{/snippet}
</Dialog>

<Dialog bind:open={linkOpen} title={s.linkTitle}>
	<p>{s.linkBody}</p>
	{#if link}
		<input
			bind:this={linkInput}
			readonly
			value={link}
			aria-label={s.linkTitle}
			class="mt-3 h-11 w-full rounded-lg border border-line bg-panel-2 px-3 font-mono text-xs text-fg"
			onfocus={(e) => e.currentTarget.select()}
		/>
		{#if copied === false}<p class="mt-2 text-xs" role="alert">{t.sync.linkCopyManual}</p>{/if}
	{/if}
	{#snippet actions()}
		{#if link && canShare}<button type="button" class="btn" onclick={shareLink}>{t.sync.linkShare}</button>{/if}
		{#if link}
			<button type="button" class="btn btn-primary" onclick={copyLink} aria-live="polite"
				>{copied === true ? `✔ ${t.sync.linkCopied}` : t.sync.linkCopy}</button
			>
		{/if}
		<button type="button" class="btn" onclick={() => (linkOpen = false)}>{t.sync.close}</button>
	{/snippet}
</Dialog>

<Dialog bind:open={pasteOpen} title={s.pasteTitle}>
	<form
		id="sq-paste"
		onsubmit={(e) => {
			e.preventDefault();
			usePasted();
		}}
	>
		<label for="sq-paste-input">{s.pasteBody}</label>
		<input
			id="sq-paste-input"
			bind:value={pasteText}
			autocomplete="off"
			spellcheck="false"
			placeholder="https://…#squad=…"
			aria-label={s.pasteLabel}
			class="mt-3 h-11 w-full rounded-lg border border-line bg-panel-2 px-3 font-mono text-base text-fg outline-none focus:border-accent sm:text-xs"
			oninput={() => (pasteBad = false)}
		/>
		{#if pasteBad}<p class="mt-2 text-xs text-fg" role="alert">{s.pasteBad}</p>{/if}
	</form>
	{#snippet actions()}
		<button type="button" class="btn" onclick={() => (pasteOpen = false)}>{s.cancel}</button>
		<button type="submit" form="sq-paste" class="btn btn-primary" disabled={busy}>{s.pasteUse}</button>
	{/snippet}
</Dialog>

<Dialog bind:open={leaveOpen} title={s.leaveTitle}>
	<p>{s.leaveBody}</p>
	{#snippet actions()}
		<button type="button" class="btn" onclick={() => (leaveOpen = false)}>{s.cancel}</button>
		<button type="button" class="btn btn-danger-solid" onclick={() => void leave()}>{s.leaveGo}</button>
	{/snippet}
</Dialog>

<Dialog bind:open={removeOpen} title={removing ? s.removeTitle(removing.name) : s.remove}>
	<p>{s.removeBody}</p>
	{#snippet actions()}
		<button type="button" class="btn" onclick={() => (removeOpen = false)}>{s.cancel}</button>
		<button type="button" class="btn btn-danger-solid" onclick={() => void remove()}>{s.removeGo}</button>
	{/snippet}
</Dialog>

<style>
	.sq-step-n {
		display: inline-grid;
		place-items: center;
		flex: none;
		width: 1.4rem;
		height: 1.4rem;
		border-radius: 999px;
		background: var(--t-accent);
		color: var(--t-bg);
		font-size: 12px;
		font-weight: 700;
	}
	.sq-status[data-status='error'],
	.sq-status[data-status='full'] {
		color: var(--t-fg);
	}

	/* a member card */
	.sq-mine {
		border-color: var(--t-accent);
		box-shadow: inset 0 0 0 1px var(--t-accent);
	}
	.sq-rank {
		flex: none;
		color: var(--t-accent);
		font-size: 14px;
		font-weight: 800;
	}
	.sq-you {
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
	/* Online = green light, otherwise grey + "Seen 2 h ago" */
	.sq-presence {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--t-muted);
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		white-space: nowrap;
	}
	.sq-light {
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: #7c818a;
	}
	/* the theme's own green (readable on the light Field Manual paper too) */
	.sq-presence[data-online='true'] {
		color: var(--t-buff, #3ee06a);
	}
	.sq-presence[data-online='true'] .sq-light {
		background: var(--t-buff, #3ee06a);
		box-shadow: 0 0 7px var(--t-buff, #3ee06a);
		animation: sq-blink 2.4s ease-in-out infinite;
	}
	@keyframes sq-blink {
		50% {
			opacity: 0.45;
		}
	}

	.sq-ready[aria-pressed='true'] {
		border-color: #3ee06a;
		background: rgb(62 224 106 / 0.18);
		color: var(--t-fg);
		box-shadow: 0 0 10px rgb(62 224 106 / 0.4);
	}
	.sq-mvp {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 1px 7px 1px 5px;
		border-radius: 999px;
		background: linear-gradient(180deg, #ffe48a, #e0a420 60%, #b57a0c);
		color: #3a2400;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.sq-mvp svg {
		width: 14px;
		height: 11px;
		fill: #fff6c8;
		stroke: #7a4e00;
		stroke-width: 1;
	}
	.sq-streak,
	.sq-ready-tag {
		padding: 1px 7px;
		border-radius: 999px;
		border: 1px solid currentColor;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.sq-streak {
		color: #ff8a3c;
	}
	.sq-ready-tag {
		color: var(--t-buff, #3ee06a);
	}
	/* stickers from lost duels */
	.sq-loser {
		padding: 2px 7px 1px;
		border: 2px solid #fff;
		border-radius: 5px;
		background: linear-gradient(180deg, #ff3b30, #c4111a);
		color: #fff;
		font-size: 10.5px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		transform: rotate(-3deg);
		box-shadow: 0 2px 4px rgb(0 0 0 / 0.5);
	}
	.sq-bar {
		height: 6px;
		border-radius: 999px;
		background: var(--t-track, rgb(127 127 127 / 0.25));
		overflow: hidden;
	}
	.sq-bar > span {
		display: block;
		height: 100%;
		border-radius: inherit;
	}
	.sq-bar > [data-camo='gold'] {
		background: linear-gradient(90deg, #a8730c, #f1c23a 60%, #fff1a8);
	}
	.sq-bar > [data-camo='platinum'] {
		background: linear-gradient(90deg, #8d99a8, #dfe6ee 60%, #ffffff);
	}
	.sq-bar > [data-camo='harmonicBreak'] {
		background: linear-gradient(90deg, #5a0712, #c4132f 60%, #ff5a6e);
	}
	.sq-div {
		color: var(--t-muted);
	}
	.sq-div.done {
		color: var(--t-fg);
		font-weight: 600;
	}

	/* Mastery: a small label per mode + three boxes */
	/* a Mastery counter cell: box + short name, "120/250", a thin bar in the mode's colour */
	.sq-mcell {
		padding: 4px 5px 5px;
		border-radius: 6px;
		background: rgb(127 127 127 / 0.1);
	}
	.sq-mcell[data-status='locked'] {
		opacity: 0.55;
	}
	.sq-mnum {
		color: var(--t-muted);
		line-height: 1.3;
	}
	.sq-mnum b {
		color: var(--t-fg);
	}
	.sq-mcell .sq-mbox {
		flex: none;
		width: 12px;
		height: 12px;
		border-radius: 3px;
	}
	.sq-mcell .sq-mbox[data-status='complete']::after {
		font-size: 9px;
	}
	.sq-mbar {
		display: block;
		height: 4px;
		margin-top: 2px;
		border-radius: 999px;
		background: rgb(127 127 127 / 0.25);
		overflow: hidden;
	}
	.sq-mbar > span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: #ff4418;
	}
	.sq-mbar[data-mode='wz'] > span {
		background: #ffcc33;
	}
	.sq-mbar[data-mode='dmz'] > span {
		background: #3ee06a;
	}
	.sq-mcount {
		color: var(--t-muted);
	}
	.sq-mcount.done b {
		color: var(--t-fg);
	}
	.sq-mode {
		width: 2.4rem;
		color: var(--t-muted);
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.1em;
	}
	.sq-mbox {
		--m: #ff4418;
		width: 16px;
		height: 16px;
		border-radius: 4px;
		border: 1px solid rgb(160 160 170 / 0.55);
		background: rgb(120 120 130 / 0.25);
		position: relative;
		overflow: hidden;
	}
	.sq-mbox[data-mode='wz'] {
		--m: #ffcc33;
	}
	.sq-mbox[data-mode='dmz'] {
		--m: #3ee06a;
	}
	.sq-mbox[data-status='active'] {
		border-color: var(--m);
	}
	.sq-mbox[data-status='active']::before {
		content: '';
		position: absolute;
		inset: 50% 0 0;
		background: var(--m);
		opacity: 0.8;
	}
	.sq-mbox[data-status='complete'] {
		border-color: var(--m);
		background: var(--m);
		box-shadow: 0 0 6px var(--m);
	}
	.sq-mbox[data-status='complete']::after {
		content: '✔';
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		color: #111;
		font-size: 11px;
		font-weight: 800;
		line-height: 1;
	}

	/* the weapon-by-weapon table: scrolls sideways inside its box when the squad is big */
	.sq-compare summary {
		display: flex;
		align-items: center;
	}
	/* as wide as it needs (not stretched across a wide screen), scrolls inside itself if wider */
	.sq-table-wrap {
		width: fit-content;
		max-width: 100%;
		overflow-x: auto;
		border: 1px solid var(--t-line);
		border-radius: 10px;
	}
	.sq-table {
		border-collapse: collapse;
		font-size: 13px;
	}
	.sq-table thead th:not(.sq-wcol),
	.sq-table td {
		min-width: 4.5rem;
	}
	@media (max-width: 639px) {
		.sq-table-wrap {
			width: 100%;
		}
		.sq-table {
			width: 100%;
		}
		.sq-table thead th:not(.sq-wcol),
		.sq-table td {
			min-width: 3.4rem;
		}
	}
	.sq-table th,
	.sq-table td {
		padding: 5px 6px;
		border-bottom: 1px solid var(--t-line);
		text-align: center;
	}
	.sq-table thead th {
		font-size: 11px;
		color: var(--t-muted);
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		vertical-align: bottom;
	}
	.sq-th-name {
		display: block;
		max-width: 6.5rem;
		margin-inline: auto;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.sq-table .sq-wcol {
		position: sticky;
		left: 0;
		z-index: 1;
		min-width: 7.5rem;
		max-width: 10rem;
		text-align: left;
		font-weight: 600;
		background: var(--t-panel-2, var(--t-panel));
	}
	.sq-class-row th {
		padding-top: 9px;
		text-align: left;
		color: var(--t-accent);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		background: var(--t-panel-2, var(--t-panel));
		position: sticky;
		left: 0;
	}
	.sq-lvl {
		display: inline-grid;
		place-items: center;
		min-width: 2.1rem;
		height: 1.5rem;
		padding: 0 4px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.04em;
		color: var(--t-muted);
	}
	.sq-lvl[data-level='1'] {
		background: linear-gradient(135deg, #fff1a8, #f1c23a 50%, #a8730c);
		color: #3a2400;
	}
	.sq-lvl[data-level='2'] {
		background: linear-gradient(135deg, #ffffff, #dfe6ee 50%, #8d99a8);
		color: #1e2630;
	}
	.sq-lvl[data-level='3'] {
		background: linear-gradient(135deg, #ff5a6e, #c4132f 50%, #5a0712);
		color: #fff;
	}
	@media (prefers-reduced-motion: reduce) {
		.sq-presence[data-online='true'] .sq-light {
			animation: none;
		}
	}
</style>
