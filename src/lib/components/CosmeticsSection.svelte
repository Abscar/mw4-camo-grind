<!--
	The Cosmetics tab (the user's ask, 2026-11-12): every Large Decal ("large sticker"), Weapon Sticker
	and Weapon Charm we have a source for, with how you get it. Data: the dated snapshot in
	data/cosmetics.ts. A switch for the three kinds, "where from" buttons and a search; items are
	grouped by where they come from. The little tile is our own symbol for the kind of item, not a
	picture of the item (the game's pictures aren't ours to publish).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import {
		COSMETICS,
		COSMETICS_CHECKED,
		COSMETICS_SOURCES,
		COSMETIC_SOURCES,
		COSMETIC_TYPES,
		cosmeticEnded,
		type Cosmetic,
		type CosmeticSource,
		type CosmeticType
	} from '#lib/data/cosmetics.ts';
	import { cosmeticArt } from '#lib/cosmeticArt.ts';
	import Dialog from './Dialog.svelte';
	import { t } from '#lib/i18n/en.ts';
	import { shortDate } from '#lib/ui.ts';

	let type = $state<CosmeticType>('decal');
	let source = $state<CosmeticSource | null>(null);
	let query = $state('');
	// worked out after load, so the prerendered page and the first render match
	let todayIso = $state('');

	onMount(() => {
		const d = new Date();
		todayIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	});

	const needle = $derived(query.trim().toLowerCase());
	const ofType = $derived(COSMETICS.filter((c) => c.type === type));
	const sourcesHere = $derived(COSMETIC_SOURCES.filter((s) => ofType.some((c) => c.source === s)));
	const shown = $derived(
		ofType.filter(
			(c) =>
				(source === null || c.source === source) &&
				(needle === '' || c.name.toLowerCase().includes(needle) || c.how.toLowerCase().includes(needle))
		)
	);
	const groups = $derived(
		COSMETIC_SOURCES.map((s) => ({ source: s, items: shown.filter((c) => c.source === s) })).filter((g) => g.items.length > 0)
	);

	function chooseType(next: CosmeticType) {
		type = next;
		// a "where from" that this kind doesn't have would show an empty list
		if (source !== null && !COSMETICS.some((c) => c.type === next && c.source === source)) source = null;
	}

	const dayMonth = (iso: string) => shortDate(iso).replace(/ \d{4}$/, '');

	// the info box: which item is open (kept while it closes, so the box doesn't empty mid-fade)
	let picked = $state<Cosmetic | null>(null);
	let infoOpen = $state(false);
	const pickedArt = $derived(picked ? cosmeticArt(picked.id) : undefined);
	const pickedEnded = $derived(picked !== null && todayIso !== '' && cosmeticEnded(picked, todayIso));

	function show(c: Cosmetic) {
		picked = c;
		infoOpen = true;
	}
</script>

{#snippet symbol(c: Cosmetic)}
	<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		{#if c.gunScreen}
			<!-- a little display on a mount -->
			<rect x="8" y="9" width="24" height="16" rx="2.5" />
			<path d="M13 20l4-5 3 3 3-4 4 6M17 31h6M20 25v6" />
		{:else if c.type === 'charm'}
			<!-- a tag hanging on a chain -->
			<circle cx="20" cy="8" r="3" />
			<path d="M20 11v4" />
			<ellipse cx="20" cy="17.5" rx="2" ry="2.5" />
			<path d="M20 20l8 5v6a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3v-6z" />
			<circle cx="20" cy="28" r="1.6" />
		{:else if c.type === 'decal'}
			<!-- a big sticker along the gun's side, one corner peeling -->
			<path d="M5 13a3 3 0 0 1 3-3h24a3 3 0 0 1 3 3v9l-7 8H8a3 3 0 0 1-3-3z" />
			<path d="M35 22h-4a3 3 0 0 0-3 3v5" />
			<path d="M14 15.5l1.5 3 3.3.4-2.4 2.3.6 3.3-3-1.6-3 1.6.6-3.3-2.4-2.3 3.3-.4z" />
			<path d="M22 17h7M22 21h4" />
		{:else}
			<!-- a small square sticker with a star, one corner peeling -->
			<path d="M9 12a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v11l-8 8H12a3 3 0 0 1-3-3z" />
			<path d="M31 23h-5a3 3 0 0 0-3 3v5" />
			<path d="M19 13.5l1.7 3.5 3.8.5-2.8 2.6.7 3.800-3.400-1.900-3.400 1.900.7-3.800-2.800-2.600 3.800-.5z" />
		{/if}
	</svg>
{/snippet}

<section class="class-card meta-list cos overflow-hidden rounded-card bg-panel shadow-card" style:--c="var(--t-accent)" aria-labelledby="cos-heading">
	<header class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
		<div class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
			<h2 id="cos-heading" class="font-head text-base font-bold tracking-wide uppercase">{t.cosmetics.heading}</h2>
			<span class="font-head text-[11px] font-semibold tracking-widest text-muted uppercase">{t.cosmetics.sub(COSMETICS.length)}</span>
		</div>
		<!-- phones: the switch gets its own row, three equal parts -->
		<div class="flex gap-1.5 max-sm:w-full" role="group" aria-label={t.cosmetics.typeGroup}>
			{#each COSMETIC_TYPES as k (k)}
				<button
					type="button"
					class="meta-mode font-head min-h-11 rounded-full border px-3 text-[13px] leading-tight font-semibold max-sm:flex-1 sm:px-4"
					aria-pressed={type === k}
					onclick={() => chooseType(k)}
					>{t.cosmetics.types[k]} <span class="num font-normal opacity-80">{COSMETICS.filter((c) => c.type === k).length}</span></button
				>
			{/each}
		</div>
	</header>

	<div class="grid gap-3 border-t border-line px-4 py-4 sm:px-5">
		<p class="text-[13px] text-fg">{t.cosmetics.typeHelp[type]}</p>

		<div class="flex flex-wrap items-center gap-x-4 gap-y-3">
			<label class="relative block min-w-0 flex-[1_1_220px] sm:max-w-xs">
				<span class="sr-only">{t.cosmetics.search}</span>
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
					placeholder={t.cosmetics.searchPlaceholder}
					autocomplete="off"
					spellcheck="false"
					class="h-11 w-full rounded-full border border-line bg-panel pr-4 pl-10 text-fg outline-none placeholder:text-muted focus:border-accent"
				/>
			</label>
			<p class="num text-[13px] font-semibold text-fg" role="status">{t.cosmetics.results(shown.length, ofType.length)}</p>
		</div>

		<div class="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={t.cosmetics.sourceGroup}>
			<button type="button" class="chip flex-none" aria-pressed={source === null} onclick={() => (source = null)}>{t.cosmetics.allSources}</button>
			{#each sourcesHere as s (s)}
				<button type="button" class="chip flex-none" aria-pressed={source === s} onclick={() => (source = source === s ? null : s)}
					>{t.cosmetics.sources[s]}</button
				>
			{/each}
		</div>

		{#each groups as g (g.source)}
			{@const headingId = `cos-${g.source}`}
			<section class="min-w-0" aria-labelledby={headingId}>
				<h3 id={headingId} class="cos-group font-head flex items-baseline gap-2 text-[12px] font-bold tracking-[0.14em] text-fg uppercase" data-source={g.source}>
					<span class="cos-dot" aria-hidden="true"></span>{t.cosmetics.sources[g.source]}
					<span class="num font-normal tracking-normal text-muted">{g.items.length}</span>
				</h3>
				<ul class="mt-2 grid grid-cols-[repeat(auto-fill,minmax(min(100%,270px),1fr))] gap-2">
					{#each g.items as c (c.id)}
						{@const ended = todayIso !== '' && cosmeticEnded(c, todayIso)}
						{@const art = cosmeticArt(c.id)}
						<li class="min-w-0">
							<button
								type="button"
								class="cos-item meta-card flex h-full w-full min-w-0 items-start gap-3 rounded-card border border-line bg-panel-2 p-2.5 text-left"
								data-source={c.source}
								class:ended
								aria-haspopup="dialog"
								onclick={() => show(c)}
							>
								{#if art}
									<span class="cos-art flex-none" data-type={c.type} aria-hidden="true">
										<svg viewBox={art.viewBox}>{@html art.svg}</svg>
									</span>
								{:else}
									<span class="cos-tile flex-none" aria-hidden="true">{@render symbol(c)}</span>
								{/if}
								<span class="min-w-0 flex-1">
									<span class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
										<b class="cos-name font-semibold break-words" class:unverified={!c.verified}>{c.name}</b>
										{#if c.gunScreen}<span class="cos-tag">{t.cosmetics.gunScreen}</span>{/if}
										{#if c.until}
											<span class="cos-tag" class:cos-tag-ended={ended}
												>{ended ? t.cosmetics.ended(dayMonth(c.until)) : t.cosmetics.until(dayMonth(c.until))}</span
											>
										{/if}
									</span>
									<span class="mt-0.5 block text-[13px] leading-snug text-fg">{c.how}</span>
									{#if !c.verified}
										<span class="mt-1 block text-[12px] leading-snug text-muted"
											><span class="text-accent" aria-hidden="true">⚠</span> {t.cosmetics.unconfirmedShort}</span
										>
									{/if}
									<span class="sr-only"> – {t.cosmetics.openHint}</span>
								</span>
								<span class="cos-more flex-none self-center" aria-hidden="true">›</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{:else}
			<div class="rounded-card border border-line bg-panel-2 px-4 py-5 text-center">
				<p class="text-muted">{t.cosmetics.none}</p>
				<button
					type="button"
					class="btn btn-sm mt-3"
					onclick={() => {
						query = '';
						source = null;
					}}>{t.cosmetics.clear}</button
				>
			</div>
		{/each}
	</div>

	<div class="grid gap-1 border-t border-line px-4 py-3 text-xs text-muted sm:px-5">
		<p>{t.cosmetics.honest}</p>
		<p>{t.cosmetics.snapshot(COSMETICS_SOURCES, shortDate(COSMETICS_CHECKED))}</p>
	</div>
</section>

<Dialog bind:open={infoOpen} title={picked?.name ?? ''}>
	{#if picked}
		<div class="cos-info grid gap-3" data-source={picked.source}>
			{#if pickedArt}
				<div class="cos-art cos-art-big" data-type={picked.type} aria-hidden="true">
					<svg viewBox={pickedArt.viewBox}>{@html pickedArt.svg}</svg>
				</div>
			{:else}
				<div class="cos-tile cos-tile-big" aria-hidden="true">{@render symbol(picked)}</div>
			{/if}
			<p class="eyebrow">
				{picked.gunScreen ? t.cosmetics.gunScreen : t.cosmetics.kind[picked.type]} · {t.cosmetics.sources[picked.source]}
			</p>
			<div>
				<h3 class="font-head text-[12px] font-bold tracking-[0.12em] text-fg uppercase">{t.cosmetics.whereHeading}</h3>
				<p class="mt-1 text-[15px] leading-snug font-semibold text-fg">{picked.how}</p>
				<p class="mt-1">{t.cosmetics.sourceHelp[picked.source]}</p>
				{#if picked.until}
					<p class="mt-1 font-semibold text-fg">
						{pickedEnded ? t.cosmetics.endedLong(shortDate(picked.until)) : t.cosmetics.untilLong(shortDate(picked.until))}
					</p>
				{/if}
			</div>
			{#if !picked.verified || picked.note}
				<p>
					{#if !picked.verified}<span class="text-accent" aria-hidden="true">⚠</span> <b class="font-semibold text-fg">{t.cosmetics.unconfirmed}</b>{' '}{/if}{picked.note}
				</p>
			{/if}
			<p class="text-xs">
				{#if pickedArt}{t.cosmetics.drawnAfter(pickedArt.after)}{:else if picked.type === 'charm'}{t.cosmetics.noCharmArt}{:else}{t.cosmetics.noArt}{/if}
			</p>
		</div>
	{/if}
	{#snippet actions()}
		<button type="button" class="btn btn-primary" onclick={() => (infoOpen = false)}>{t.cosmetics.close}</button>
	{/snippet}
</Dialog>

<style>
	/* each "where from" has its own colour: the tile, the dot by the group's heading */
	[data-source='prestige'] {
		--src: #c9a227;
	}
	[data-source='battlepass'] {
		--src: #4aa3ff;
	}
	[data-source='event'] {
		--src: #3ecf6e;
	}
	[data-source='store'] {
		--src: #ff8a3c;
	}
	[data-source='promo'] {
		--src: #c77dff;
	}
	[data-source='unknown'] {
		--src: #9aa3ab;
	}
	.cos-dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background: var(--src);
		transform: rotate(45deg) translateY(-1px);
	}
	.cos-tile {
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 10px;
		border: 1.5px solid color-mix(in srgb, var(--src) 70%, transparent);
		background: color-mix(in srgb, var(--src) 16%, var(--t-panel));
		color: color-mix(in srgb, var(--src) 72%, var(--t-fg));
	}
	.cos-tile :global(svg) {
		width: 34px;
		height: 34px;
	}
	/* our drawing of the item, lying on a dark gun-metal plate */
	.cos-art {
		display: grid;
		place-items: center;
		border-radius: 10px;
		border: 1.5px solid color-mix(in srgb, var(--src) 60%, transparent);
		background:
			linear-gradient(160deg, rgb(255 255 255 / 0.08), transparent 45%),
			repeating-linear-gradient(0deg, rgb(255 255 255 / 0.025) 0 1px, transparent 1px 3px),
			#2a2f34;
		overflow: hidden;
	}
	.cos-art[data-type='decal'] {
		width: 102px;
		height: 68px;
	}
	.cos-art[data-type='sticker'] {
		width: 68px;
		height: 68px;
	}
	.cos-art svg {
		width: 100%;
		height: 100%;
		padding: 3px;
		filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.55));
	}
	.cos-art-big[data-type='decal'] {
		width: min(100%, 360px);
		height: auto;
		aspect-ratio: 3 / 2;
		justify-self: center;
	}
	.cos-art-big[data-type='sticker'] {
		width: min(100%, 220px);
		height: auto;
		aspect-ratio: 1;
		justify-self: center;
	}
	.cos-art-big svg {
		padding: 10px;
	}
	.cos-tile-big {
		width: 96px;
		height: 96px;
		justify-self: center;
	}
	.cos-tile-big :global(svg) {
		width: 64px;
		height: 64px;
	}
	.cos-item {
		transition: border-color 0.12s;
	}
	.cos-item:hover,
	.cos-item:focus-visible {
		border-color: var(--src);
	}
	.cos-more {
		font-size: 20px;
		line-height: 1;
		color: var(--t-muted);
	}
	.cos-item.ended .cos-art {
		opacity: 0.6;
	}
	.cos-name {
		font-size: 14.5px;
		color: var(--t-fg);
	}
	.cos-name.unverified {
		text-decoration: underline dotted;
		text-underline-offset: 3px;
	}
	.cos-tag {
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
	.cos-tag-ended {
		color: var(--t-muted);
		text-decoration: line-through;
	}
	.cos-item.ended .cos-tile {
		opacity: 0.55;
	}
</style>
