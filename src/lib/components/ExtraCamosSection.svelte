<!--
	The Extra camos tab (the user's ask, 2026-11-12): every camo outside the weapon ladder — events,
	easter eggs, challenge tracks, Battle Pass, Prestige, pre-order / beta rewards, promotions — split
	into "Available now", "Upcoming" and "Expired" (can't be earned any more). Data: the dated snapshot
	in data/extraCamos.ts; which list a camo is in is worked out from its dates against today, after
	load (the prerendered page uses the snapshot's day, so the first render matches). A search and
	"where from" buttons; items grouped by where they come from; tap one for the details. The little
	tile is our own symbol for where it comes from, not a picture of the camo (no made-up looks).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import {
		EXTRA_CAMOS,
		EXTRA_CAMOS_CHECKED,
		EXTRA_CAMOS_SOURCES,
		EXTRA_KINDS,
		EXTRA_STATUSES,
		daysBetween,
		extraStatus,
		type ExtraCamo,
		type ExtraKind,
		type ExtraStatus
	} from '#lib/data/extraCamos.ts';
	import Dialog from './Dialog.svelte';
	import { t } from '#lib/i18n/en.ts';
	import { shortDate } from '#lib/ui.ts';

	const s = t.extraCamos;

	let status = $state<ExtraStatus>('now');
	let kind = $state<ExtraKind | null>(null);
	let query = $state('');
	// the snapshot's day until the page has loaded, then the viewer's own day
	let today = $state(EXTRA_CAMOS_CHECKED);

	onMount(() => {
		const d = new Date();
		today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	});

	const statusOf = $derived(new Map(EXTRA_CAMOS.map((c) => [c.id, extraStatus(c, today)])));
	const counts = $derived(
		Object.fromEntries(EXTRA_STATUSES.map((st) => [st, EXTRA_CAMOS.filter((c) => statusOf.get(c.id) === st).length])) as Record<
			ExtraStatus,
			number
		>
	);
	const needle = $derived(query.trim().toLowerCase());
	const inStatus = $derived(EXTRA_CAMOS.filter((c) => statusOf.get(c.id) === status));
	const kindsHere = $derived(EXTRA_KINDS.filter((k) => inStatus.some((c) => c.kind === k)));
	const shown = $derived(
		[...inStatus]
			.filter(
				(c) =>
					(kind === null || c.kind === kind) &&
					(needle === '' ||
						c.name.toLowerCase().includes(needle) ||
						c.how.toLowerCase().includes(needle) ||
						(c.weapon ?? '').toLowerCase().includes(needle))
			)
			// soonest first: ending soon (now), starting soon (upcoming), ended last (expired)
			.sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
	);
	const groups = $derived(
		EXTRA_KINDS.map((k) => ({ kind: k, items: shown.filter((c) => c.kind === k) })).filter((g) => g.items.length > 0)
	);

	function sortKey(c: ExtraCamo): string {
		if (status === 'now') return c.until ?? '9999';
		if (status === 'upcoming') return c.from ?? '9999';
		// expired: most recently ended first
		return c.until ? String(99999999 - Number(c.until.replaceAll('-', ''))) : '99999999';
	}

	function chooseStatus(next: ExtraStatus) {
		status = next;
		if (kind !== null && !EXTRA_CAMOS.some((c) => c.kind === kind && extraStatus(c, today) === next)) kind = null;
	}

	const dayMonth = (iso: string) => shortDate(iso).replace(/ \d{4}$/, '');
	const approx = (c: ExtraCamo) => (c.approx ? '≈ ' : '');

	/** The short date tag on a card, or nothing. */
	function tag(c: ExtraCamo): string {
		const st = statusOf.get(c.id);
		if (st === 'now' && c.until) {
			const left = daysBetween(today, c.until);
			return left === 0 ? s.lastDay : s.until(approx(c) + dayMonth(c.until), left);
		}
		if (st === 'upcoming') return c.from ? s.from(approx(c) + dayMonth(c.from)) : s.noDate;
		if (st === 'expired') return c.until ? s.ended(approx(c) + dayMonth(c.until)) : s.gone;
		return '';
	}

	/** The longer availability line in the info box. */
	function availability(c: ExtraCamo): string {
		const st = statusOf.get(c.id);
		if (st === 'expired') return c.until ? s.endedLong(approx(c) + shortDate(c.until)) : (c.gone ?? s.gone);
		if (st === 'upcoming') return c.from ? s.fromLong(approx(c) + shortDate(c.from), c.later) : (c.later ?? s.noDate);
		const since = c.from ? s.since(shortDate(c.from)) + ' ' : '';
		if (c.until) return since + s.untilLong(approx(c) + shortDate(c.until), daysBetween(today, c.until));
		return since + s.noEnd;
	}

	// the info box: which camo is open (kept while it closes, so the box doesn't empty mid-fade)
	let picked = $state<ExtraCamo | null>(null);
	let infoOpen = $state(false);
	function open(c: ExtraCamo) {
		picked = c;
		infoOpen = true;
	}
</script>

<!-- our own symbol per "where from" (not a picture of the camo) -->
{#snippet symbol(k: ExtraKind)}
	<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		{#if k === 'event'}
			<!-- a calendar page with a star -->
			<rect x="7" y="9" width="26" height="24" rx="3" />
			<path d="M7 16h26M14 6v6M26 6v6" />
			<path d="M20 19.5l1.6 3.2 3.5.5-2.5 2.4.6 3.5-3.2-1.7-3.2 1.7.6-3.5-2.5-2.4 3.5-.5z" />
		{:else if k === 'easterEgg'}
			<!-- an egg with a question mark -->
			<path d="M20 5c-6 0-11 10-11 17a11 11 0 0 0 22 0C31 15 26 5 20 5z" />
			<path d="M16.8 18.5a3.4 3.4 0 1 1 4.8 3.1c-1 .5-1.6 1.2-1.6 2.3v.8M20 29.2v.3" />
		{:else if k === 'challenge'}
			<!-- a target with a tick -->
			<circle cx="20" cy="20" r="13" />
			<circle cx="20" cy="20" r="7" />
			<path d="M16.5 20l2.5 2.5 4.5-5" />
		{:else if k === 'blackcell'}
			<!-- a hexagon cell with a key slot (the paid BlackCell tier) -->
			<path d="M20 4l13 7.5v17L20 36 7 28.5v-17z" />
			<circle cx="20" cy="17" r="3.5" />
			<path d="M20 20.5v7M20 24.5h3" />
		{:else if k === 'prestige'}
			<!-- a chevron badge -->
			<path d="M20 5l12 6v9c0 7-5 12-12 15C13 32 8 27 8 20v-9z" />
			<path d="M14 17l6 4 6-4M14 23l6 4 6-4" />
		{:else if k === 'edition'}
			<!-- a game case -->
			<rect x="9" y="5" width="22" height="30" rx="2.5" />
			<path d="M13 5v30" />
			<circle cx="22" cy="18" r="5" />
			<circle cx="22" cy="18" r="1.2" />
		{:else}
			<!-- a gift with a code tag -->
			<rect x="7" y="15" width="26" height="18" rx="2" />
			<path d="M5 11h30v4H5zM20 11v22" />
			<path d="M20 11c-2-5-8-6-8-2 0 2 4 2 8 2zM20 11c2-5 8-6 8-2 0 2-4 2-8 2z" />
		{/if}
	</svg>
{/snippet}

{#snippet modePills(c: ExtraCamo)}
	<span class="xc-modes" aria-label={s.modesLabel(c.modes.map((m) => s.modes[m]).join(', '))}>
		{#each c.modes as m (m)}<span class="xc-mode" data-mode={m} aria-hidden="true">{s.modesShort[m]}</span>{/each}
	</span>
{/snippet}

<section class="class-card meta-list xc overflow-hidden rounded-card bg-panel shadow-card" style:--c="var(--t-accent)" aria-labelledby="xc-heading">
	<header class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
		<div class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
			<h2 id="xc-heading" class="font-head text-base font-bold tracking-wide uppercase">{s.heading}</h2>
			<span class="font-head text-[11px] font-semibold tracking-widest text-muted uppercase">{s.sub(EXTRA_CAMOS.length)}</span>
		</div>
		<!-- phones: the switch gets its own row, three equal parts -->
		<div class="flex gap-1.5 max-sm:w-full" role="group" aria-label={s.statusGroup}>
			{#each EXTRA_STATUSES as st (st)}
				<button
					type="button"
					class="meta-mode xc-status font-head min-h-11 rounded-full border px-3 text-[13px] leading-tight font-semibold max-sm:flex-1 max-sm:px-1.5 sm:px-4"
					data-status={st}
					aria-pressed={status === st}
					onclick={() => chooseStatus(st)}
					><span class="xc-light" aria-hidden="true"></span>{s.statuses[st]} <span class="num font-normal opacity-80">{counts[st]}</span></button
				>
			{/each}
		</div>
	</header>

	<div class="grid gap-3 border-t border-line px-4 py-4 sm:px-5">
		<p class="text-[13px] text-fg">{s.statusHelp[status]}</p>

		<div class="flex flex-wrap items-center gap-x-4 gap-y-3">
			<label class="relative block min-w-0 flex-[1_1_220px] sm:max-w-xs">
				<span class="sr-only">{s.search}</span>
				<svg
					class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.4"
					stroke-linecap="round"
					aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg
				>
				<input
					type="search"
					bind:value={query}
					placeholder={s.searchPlaceholder}
					autocomplete="off"
					spellcheck="false"
					class="h-11 w-full rounded-full border border-line bg-panel pr-4 pl-10 text-fg outline-none placeholder:text-muted focus:border-accent"
				/>
			</label>
			<p class="num text-[13px] font-semibold text-fg" role="status">{s.results(shown.length, inStatus.length)}</p>
		</div>

		{#if kindsHere.length > 1}
			<div class="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={s.kindGroup}>
				<button type="button" class="chip flex-none" aria-pressed={kind === null} onclick={() => (kind = null)}>{s.allKinds}</button>
				{#each kindsHere as k (k)}
					<button type="button" class="chip flex-none" aria-pressed={kind === k} onclick={() => (kind = kind === k ? null : k)}>{s.kinds[k]}</button>
				{/each}
			</div>
		{/if}

		{#each groups as g (g.kind)}
			{@const headingId = `xc-${g.kind}`}
			<section class="min-w-0" aria-labelledby={headingId}>
				<h3 id={headingId} class="xc-group font-head flex items-baseline gap-2 text-[12px] font-bold tracking-[0.14em] text-fg uppercase" data-kind={g.kind}>
					<span class="xc-dot" aria-hidden="true"></span>{s.kinds[g.kind]}
					<span class="num font-normal tracking-normal text-muted">{g.items.length}</span>
				</h3>
				<ul class="mt-2 grid grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-2">
					{#each g.items as c (c.id)}
						{@const label = tag(c)}
						<li class="min-w-0">
							<button
								type="button"
								class="xc-item meta-card flex h-full w-full min-w-0 items-start gap-3 rounded-card border border-line bg-panel-2 p-2.5 text-left"
								data-kind={c.kind}
								data-status={statusOf.get(c.id)}
								aria-haspopup="dialog"
								onclick={() => open(c)}
							>
								<span class="xc-tile flex-none" aria-hidden="true">{@render symbol(c.kind)}</span>
								<span class="min-w-0 flex-1">
									<span class="flex flex-wrap items-center gap-x-2 gap-y-1">
										<b class="xc-name font-semibold break-words" class:unverified={c.trust === 'one' || c.trust === 'leak'}>{c.name}</b>
										{#if c.animated}<span class="xc-tag xc-anim">{s.animated}</span>{/if}
										{#if label}<span class="xc-tag" data-status={statusOf.get(c.id)}>{label}</span>{/if}
									</span>
									<span class="mt-1 block text-[13px] leading-snug text-fg">{c.how}</span>
									<span class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-snug text-muted">
										{@render modePills(c)}
										<span>{c.weapon ? s.onlyWeapon(c.weapon) : c.perWeapon ? s.perWeapon : s.everyWeapon}</span>
										{#if c.trust === 'one' || c.trust === 'leak'}
											<span><span class="text-accent" aria-hidden="true">⚠</span> {s.trustShort[c.trust]}</span>
										{/if}
									</span>
									<span class="sr-only"> – {s.openHint}</span>
								</span>
								<span class="xc-more flex-none self-center" aria-hidden="true">›</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{:else}
			<div class="rounded-card border border-line bg-panel-2 px-4 py-5 text-center">
				<p class="text-muted">{needle !== '' || kind !== null ? s.none : s.empty[status]}</p>
				{#if needle !== '' || kind !== null}
					<button
						type="button"
						class="btn btn-sm mt-3"
						onclick={() => {
							query = '';
							kind = null;
						}}>{s.clear}</button
					>
				{/if}
			</div>
		{/each}
	</div>

	<div class="grid gap-1 border-t border-line px-4 py-3 text-xs text-muted sm:px-5">
		<p>{s.honest}</p>
		<p>{s.snapshot(EXTRA_CAMOS_SOURCES, shortDate(EXTRA_CAMOS_CHECKED))}</p>
	</div>
</section>

<Dialog bind:open={infoOpen} title={picked?.name ?? ''}>
	{#if picked}
		{@const st = statusOf.get(picked.id) ?? 'now'}
		<div class="xc-info grid gap-3" data-kind={picked.kind}>
			<div class="flex items-center gap-3">
				<span class="xc-tile xc-tile-big flex-none" aria-hidden="true">{@render symbol(picked.kind)}</span>
				<div class="min-w-0">
					<p class="eyebrow">{s.kinds[picked.kind]}{picked.animated ? ` · ${s.animated}` : ''}</p>
					<p class="mt-1 flex flex-wrap items-center gap-2">
						<span class="xc-tag" data-status={st}>{s.statuses[st]}</span>
						{@render modePills(picked)}
					</p>
				</div>
			</div>
			<div>
				<h3 class="font-head text-[12px] font-bold tracking-[0.12em] text-fg uppercase">{s.howHeading}</h3>
				<p class="mt-1 text-[15px] leading-snug font-semibold text-fg">{picked.how}</p>
				<p class="mt-1">{picked.weapon ? s.onlyWeaponLong(picked.weapon) : picked.perWeapon ? s.perWeaponLong : s.everyWeaponLong}</p>
			</div>
			<div>
				<h3 class="font-head text-[12px] font-bold tracking-[0.12em] text-fg uppercase">{s.whenHeading}</h3>
				<p class="mt-1 font-semibold text-fg">{availability(picked)}</p>
			</div>
			{#if picked.note}<p>{picked.note}</p>{/if}
			<p class="text-xs">
				{#if picked.trust === 'one' || picked.trust === 'leak'}<span class="text-accent" aria-hidden="true">⚠</span>{' '}{/if}<b
					class="font-semibold text-fg">{s.trust[picked.trust]}</b
				>{' '}{s.sourcesLine(picked.sources)}
			</p>
		</div>
	{/if}
	{#snippet actions()}
		<button type="button" class="btn btn-primary" onclick={() => (infoOpen = false)}>{s.close}</button>
	{/snippet}
</Dialog>

<style>
	/* each "where from" has its own colour: the tile, the dot by the group's heading */
	[data-kind='event'] {
		--src: #3ecf6e;
	}
	[data-kind='easterEgg'] {
		--src: #ff6fb5;
	}
	[data-kind='challenge'] {
		--src: #ff8a3c;
	}
	[data-kind='blackcell'] {
		--src: #4aa3ff;
	}
	[data-kind='prestige'] {
		--src: #c9a227;
	}
	[data-kind='edition'] {
		--src: #5fd6d6;
	}
	[data-kind='promo'] {
		--src: #c77dff;
	}
	/* status colours: the light on the switch and the date tag */
	[data-status='now'] {
		--st: #3ee06a;
	}
	[data-status='upcoming'] {
		--st: #ffcc33;
	}
	[data-status='expired'] {
		--st: #9aa3ab;
	}
	.xc-light {
		display: inline-block;
		width: 8px;
		height: 8px;
		margin-right: 6px;
		border-radius: 50%;
		background: var(--st);
		box-shadow: 0 0 0 1.5px rgb(0 0 0 / 0.35);
		vertical-align: 1px;
	}
	.xc-dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background: var(--src);
		transform: rotate(45deg) translateY(-1px);
	}
	.xc-tile {
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 10px;
		border: 1.5px solid color-mix(in srgb, var(--src) 70%, transparent);
		background: color-mix(in srgb, var(--src) 16%, var(--t-panel));
		color: color-mix(in srgb, var(--src) 72%, var(--t-fg));
	}
	.xc-tile :global(svg) {
		width: 34px;
		height: 34px;
	}
	.xc-tile-big {
		width: 64px;
		height: 64px;
	}
	.xc-tile-big :global(svg) {
		width: 44px;
		height: 44px;
	}
	.xc-item {
		transition: border-color 0.12s;
	}
	.xc-item:hover,
	.xc-item:focus-visible {
		border-color: var(--src);
	}
	.xc-item[data-status='expired'] .xc-tile {
		opacity: 0.55;
	}
	.xc-more {
		font-size: 20px;
		line-height: 1;
		color: var(--t-muted);
	}
	.xc-name {
		font-size: 14.5px;
		color: var(--t-fg);
	}
	.xc-name.unverified {
		text-decoration: underline dotted;
		text-underline-offset: 3px;
	}
	.xc-tag {
		border: 1px solid var(--t-line);
		border-radius: 999px;
		padding: 1px 8px;
		font-family: var(--t-font-head);
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		white-space: nowrap;
		color: var(--t-fg);
		background: var(--t-panel);
	}
	.xc-tag[data-status] {
		border-color: color-mix(in srgb, var(--st) 65%, transparent);
	}
	.xc-tag[data-status='expired'] {
		color: var(--t-muted);
	}
	.xc-anim {
		border-color: color-mix(in srgb, #c77dff 60%, transparent);
	}
	.xc-modes {
		display: inline-flex;
		gap: 4px;
	}
	.xc-mode {
		border-radius: 4px;
		padding: 0 5px;
		font-family: var(--t-font-head);
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.06em;
		line-height: 16px;
		color: #111;
		background: var(--mode);
	}
	/* the same mode colours as the Mastery boxes */
	.xc-mode[data-mode='mp'] {
		--mode: #ff7a52;
	}
	.xc-mode[data-mode='wz'] {
		--mode: #ffcc33;
	}
	.xc-mode[data-mode='dmz'] {
		--mode: #3ee06a;
	}
</style>
