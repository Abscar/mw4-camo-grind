<!--
	Ranked board (2026-11-16, idea 5 of the squad-link brainstorm: "everyone types in their SR, see
	who's climbing, '+250 since yesterday'"). Each member types in their own SR ("Update my SR");
	their page publishes it in the squad document (squad-ranked.ts). Best first; the rank is worked
	out from the SR with last year's (BO7) table until MW4 publishes its own, and a Top 250 place
	can be typed in. Same row look as the Combat record (SquadCombat.svelte).
	A member whose operator has a locked SR (squad-ranked.ts LOCKED_SR; Drängen at 1,000 since the user's ask,
	2026-11-16) shows that SR with a lock on every page, and their own "Update my SR" button is locked.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad, type SquadEntry } from '#lib/squad.svelte.ts';
	import { agoParts } from '#lib/squad-codec.ts';
	import { boardView, fmtSrDelta, lockedSr, parseWhole, rankedView, rankOf, rankRanked, toNext, SR_MAX, TOP_MAX, type Rank } from '#lib/squad-ranked.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import Dialog from './Dialog.svelte';
	import SquadAvatar from './SquadAvatar.svelte';

	let { entries }: { entries: SquadEntry[] } = $props();
	const r = t.squad.ranked;

	const rows = $derived(rankRanked(entries.map((e) => ({ e, name: e.member.name, view: boardView(e.member.op, e.member.ranked) }))));
	/** Your own SR is locked (your operator has a LOCKED_SR). */
	const myLock = $derived(lockedSr(squad.me?.op));
	const anySr = $derived(rows.some((x) => x.view));

	/** "7 Nov" for a "YYYY-MM-DD" day. */
	const dateOf = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	const ago = (ms: number) => t.squad.ago(agoParts(ms, squad.now));
	const fmt = (n: number) => n.toLocaleString('en-US');

	// ----- the form -----

	let open = $state(false);
	let srText = $state('');
	let topText = $state('');
	let tried = $state(false);
	let busy = $state(false);

	function openForm() {
		if (myLock) return;
		const latest = rankedView(squad.ranked)?.latest;
		srText = latest ? String(latest.sr) : '';
		topText = latest?.top !== undefined ? String(latest.top) : '';
		tried = false;
		open = true;
	}

	const sr = $derived(parseWhole(srText, SR_MAX));
	const top = $derived(parseWhole(topText, TOP_MAX, 1));
	const preview = $derived(typeof sr === 'number' ? rankOf(sr, typeof top === 'number' ? top : undefined) : null);

	async function save() {
		tried = true;
		if (typeof sr !== 'number' || top === 'bad') return;
		busy = true;
		const ok = await squad.saveRanked(sr, typeof top === 'number' ? top : undefined);
		busy = false;
		open = false;
		toast.show(ok ? r.saved : r.savedOffline);
	}
</script>

{#snippet badge(rank: Rank)}
	<span class="sq-rbadge font-head" style:--rk={rank.color} data-tier={rank.tier}>
		<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"
			><path d="M8 1.2 14 4.6v6.8L8 14.8 2 11.4V4.6Z" fill="var(--rk)" stroke="rgb(0 0 0 / 0.45)" stroke-width="1" /><path
				d="M8 4.2 11 6v4L8 11.8 5 10V6Z"
				fill="rgb(255 255 255 / 0.35)"
			/></svg
		>{rank.label}
	</span>
{/snippet}

<section class="sq-ranked" aria-labelledby="sq-ranked-h">
	<div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
		<h3 id="sq-ranked-h" class="font-head text-[13px] font-bold tracking-[0.12em] uppercase">{r.heading}</h3>
		{#if myLock}
			<button type="button" class="btn btn-sm" disabled title={r.lockedMine(fmt(myLock.sr))}>{r.lockedBtn}</button>
		{:else}
			<button type="button" class="btn btn-sm btn-primary" onclick={openForm}>{r.update}</button>
		{/if}
	</div>
	<p class="mt-1 max-w-3xl text-xs text-muted">{r.note}</p>

	{#if !anySr}
		<p class="mt-3 text-sm text-muted">{r.empty} {r.launch}</p>
	{/if}
	<ol class="mt-2 grid gap-1.5">
		{#each rows as { e, view }, i (e.id)}
			{@const lock = lockedSr(e.member.op)}
			{@const next = view && !lock && view.latest.top === undefined ? toNext(view.latest.sr) : null}
			<li class="sq-rrow rounded-lg border border-line bg-panel-2" class:mine={e.mine} class:locked={!!lock} data-empty={!view}>
				<span class="sr-only"
					>{view
						? `${r.rowLabel(i + 1, e.member.name, view.latest.sr, view.rank.label)}${view.before ? `, ${r.delta(fmtSrDelta(view.before.delta), dateOf(view.before.day))}` : ''}. ${lock ? r.locked(fmt(lock.sr)) : r.updated(ago(view.latest.at))}`
						: `${e.member.name}: ${r.none}`}</span
				>
				<span class="sq-rrank num font-head" aria-hidden="true">{view ? `#${i + 1}` : '–'}</span>
				<span class="sq-rface" aria-hidden="true"><SquadAvatar name={e.member.name} op={e.member.op} size={34} /></span>
				<p class="sq-rname flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1" aria-hidden="true">
					<b class="min-w-0 truncate font-head text-[15px] font-bold tracking-wide" title={e.member.name}>{e.member.name}</b>
					{#if e.mine}<span class="sq-ryou font-head">{t.squad.you}</span>{/if}
					{#if view}{@render badge(view.rank)}{/if}
					{#if lock}<span class="sq-rlock font-head">🔒 {r.lockedTag}</span>{/if}
				</p>
				<div class="sq-rinfo min-w-0" aria-hidden="true">
					{#if view}
						{#if view.before}
							{@const b = view.before}
							<p class="sq-rtrend flex flex-wrap gap-x-2 text-[11.5px]">
								<span data-dir={b.delta > 0 ? 'up' : b.delta < 0 ? 'down' : 'flat'}
									>{b.delta > 0 ? '▲' : b.delta < 0 ? '▼' : '•'} {r.delta(fmtSrDelta(b.delta), dateOf(b.day))}</span
								>
								{#if b.rank.label !== view.rank.label}
									<span class="text-muted">{b.rank.level < view.rank.level || (b.rank.level === view.rank.level && (b.rank.division ?? 0) < (view.rank.division ?? 0)) ? r.rankUp(b.rank.label) : r.rankDown(b.rank.label)}</span>
								{/if}
							</p>
						{/if}
						{#if lock}
							<p class="text-[11px] text-muted">{r.locked(fmt(lock.sr))}</p>
						{:else}
							<p class="text-[11px] text-muted">
								{#if next}<span class="whitespace-nowrap">{r.toNext(next.sr, next.label)}</span>{' · '}{/if}<span class="whitespace-nowrap">{r.updated(ago(view.latest.at))}</span>
							</p>
						{/if}
					{:else}
						<p class="text-[11.5px] text-muted">{e.mine ? r.noneMine : r.none}</p>
					{/if}
				</div>
				<p class="sq-rstat" aria-hidden="true">
					<b class="num">{view ? fmt(view.latest.sr) : '–'}</b><span>{r.sr}</span>
				</p>
			</li>
		{/each}
	</ol>
</section>

<Dialog bind:open title={r.title}>
	<p>{r.where}</p>
	<form
		id="sq-ranked-form"
		class="mt-3 grid gap-3"
		novalidate
		onsubmit={(ev) => {
			ev.preventDefault();
			void save();
		}}
	>
		<div class="grid grid-cols-2 gap-x-3 gap-y-2.5">
			<label class="grid min-w-0 content-start gap-1">
				<span class="text-[13px] font-semibold text-fg">{r.srField}</span>
				<input
					bind:value={srText}
					inputmode="numeric"
					autocomplete="off"
					spellcheck="false"
					aria-invalid={sr === 'bad'}
					class="sq-rin h-11 w-full min-w-0 rounded-lg border border-line bg-panel-2 px-3 text-base text-fg outline-none focus:border-accent"
				/>
				{#if sr === 'bad'}<span class="text-xs text-fg" role="alert">{r.bad}</span>{/if}
			</label>
			<label class="grid min-w-0 content-start gap-1">
				<span class="text-[13px] font-semibold text-fg">{r.topField}</span>
				<input
					bind:value={topText}
					inputmode="numeric"
					autocomplete="off"
					spellcheck="false"
					aria-invalid={top === 'bad'}
					class="sq-rin h-11 w-full min-w-0 rounded-lg border border-line bg-panel-2 px-3 text-base text-fg outline-none focus:border-accent"
				/>
				{#if top === 'bad'}<span class="text-xs text-fg" role="alert">{r.badTop}</span>{:else}<span class="text-[11px]">{r.topHint}</span>{/if}
			</label>
		</div>
		{#if preview}
			<p class="flex flex-wrap items-center gap-1.5 text-[13px]" aria-live="polite">{@render badge(preview)}<span>{r.rankPreview(preview.label)}</span></p>
		{/if}
		<p class="text-xs">{r.sameDay}</p>
		{#if tried && sr === null}<p class="text-xs font-semibold text-fg" role="alert">{r.nothing}</p>{/if}
	</form>
	{#snippet actions()}
		<button type="button" class="btn" onclick={() => (open = false)}>{t.squad.cancel}</button>
		<button type="submit" form="sq-ranked-form" class="btn btn-primary" disabled={busy}>{r.save}</button>
	{/snippet}
</Dialog>

<style>
	/* a row: rank, face, name + rank badge with the change under it, then the SR */
	.sq-rrow {
		display: grid;
		grid-template-columns: 1.9rem auto minmax(0, 1fr) 4.4rem;
		grid-template-areas:
			'rank face name sr'
			'rank face info sr';
		align-items: center;
		column-gap: 10px;
		padding: 7px 10px;
	}
	.sq-rrank {
		grid-area: rank;
		color: var(--t-accent);
		font-size: 14px;
		font-weight: 800;
	}
	.sq-rface {
		grid-area: face;
		display: flex;
	}
	.sq-rname {
		grid-area: name;
		align-self: end;
	}
	.sq-rinfo {
		grid-area: info;
		align-self: start;
	}
	.sq-rstat {
		grid-area: sr;
		display: grid;
		justify-items: end;
		line-height: 1.1;
	}
	.sq-rstat b {
		font-size: 18px;
		font-weight: 800;
		color: var(--t-accent);
	}
	.sq-rstat span {
		font-family: var(--t-font-head);
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--t-muted);
	}
	.sq-rrow.mine {
		border-color: var(--t-accent);
	}
	.sq-rrow[data-empty='true'] {
		opacity: 0.7;
	}
	.sq-rrow[data-empty='true'] .sq-rstat b,
	.sq-rrow[data-empty='true'] .sq-rrank {
		color: var(--t-muted);
	}
	.sq-ryou {
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
	/* the rank: a small hexagon in the tier's colour + its name */
	.sq-rbadge {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 4px;
		padding: 1px 7px 1px 4px;
		border: 1px solid color-mix(in srgb, var(--rk) 70%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, var(--rk) 24%, transparent);
		color: var(--t-fg);
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		white-space: nowrap;
	}
	/* a locked SR (LOCKED_SR): a grey padlock pill, the SR in grey */
	.sq-rlock {
		flex: none;
		padding: 1px 7px;
		border: 1px solid var(--t-line);
		border-radius: 999px;
		background: rgb(127 127 127 / 0.18);
		color: var(--t-fg);
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		white-space: nowrap;
	}
	.sq-rrow.locked .sq-rstat b {
		color: var(--t-muted);
	}
	.sq-rtrend [data-dir='up'] {
		color: var(--t-buff, #3ee06a);
	}
	.sq-rtrend [data-dir='down'] {
		color: var(--t-nerf, #ff5a5a);
	}
	.sq-rtrend [data-dir='flat'] {
		color: var(--t-muted);
	}
	.sq-rin[aria-invalid='true'] {
		border-color: var(--t-nerf, #ff5a5a);
	}
	/* phones: the SR stays on the name's line, the change under it gets the whole width */
	@media (max-width: 519px) {
		.sq-rrow {
			grid-template-columns: 1.5rem auto minmax(0, 1fr) 3.8rem;
			grid-template-areas:
				'rank face name sr'
				'rank face info info';
			column-gap: 8px;
			padding: 7px 8px;
		}
		.sq-rinfo {
			margin-top: 2px;
		}
		.sq-rstat b {
			font-size: 16px;
		}
	}
</style>
