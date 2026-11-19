<!--
	Cosmetics → Bundles (the user's ask, 2026-11-20: "allt jag hade fått om jag köpte den"): every MW4
	store bundle with everything in it, newest first. Data: the dated snapshot in data/bundles.ts.
	A gun opens its weapon card; a sticker / charm / large decal we list opens its info box in the
	Cosmetics tab (onitem). The little symbols are our own, one per kind of item; no store pictures.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import {
		BUNDLES,
		BUNDLES_CHECKED,
		BUNDLES_SOURCES,
		bundleIsNew,
		bundleItemsInOrder,
		bundleSearchText,
		bundlesNewestFirst,
		type Bundle,
		type BundleItem,
		type BundleItemKind
	} from '#lib/data/bundles.ts';
	import { CLASSES } from '#lib/data/weapons.ts';
	import { COSMETICS, type Cosmetic } from '#lib/data/cosmetics.ts';
	import { cosmeticArt } from '#lib/cosmeticArt.ts';
	import { weaponSheet } from '#lib/weaponSheet.svelte.ts';
	import { t } from '#lib/i18n/en.ts';
	import { shortDate } from '#lib/ui.ts';

	let { onitem }: { onitem?: (c: Cosmetic) => void } = $props();

	const WEAPON_NAMES = new Map(CLASSES.flatMap((c) => c.weapons.map((w) => [w.id, w.name] as const)));
	const weaponName = (id: string) => WEAPON_NAMES.get(id) ?? id;

	/** A bundle's sticker / charm / large decal → its entry in the Cosmetics list (same name + kind). */
	const COSMETIC_BY_KEY = new Map(COSMETICS.map((c) => [`${c.type}:${c.name}`, c] as const));
	const cosmeticOf = (it: BundleItem) =>
		it.kind === 'sticker' || it.kind === 'charm' || it.kind === 'decal' ? COSMETIC_BY_KEY.get(`${it.kind}:${it.name}`) : undefined;

	let query = $state('');
	// worked out after load, so the prerendered page and the first render match
	let todayIso = $state('');
	onMount(() => {
		const d = new Date();
		todayIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	});

	const LIST = bundlesNewestFirst(BUNDLES).map((b) => ({ b, text: bundleSearchText(b, weaponName), items: bundleItemsInOrder(b) }));
	const needle = $derived(query.trim().toLowerCase());
	const shown = $derived(needle === '' ? LIST : LIST.filter((e) => e.text.includes(needle)));

	/** Does this row match the search (so it gets marked)? */
	const hit = (it: BundleItem) =>
		needle !== '' &&
		[it.name, it.operator ?? '', it.weapon ? weaponName(it.weapon) : ''].some((s) => s.toLowerCase().includes(needle));

	type Section = 'operator' | 'weapon' | 'other';
	const sectionOf = (k: BundleItemKind): Section => (k === 'operator' || k === 'weapon' ? k : 'other');
	function sections(items: BundleItem[]): { key: Section; items: BundleItem[] }[] {
		return (['operator', 'weapon', 'other'] as const)
			.map((key) => ({ key, items: items.filter((it) => sectionOf(it.kind) === key) }))
			.filter((s) => s.items.length > 0);
	}
	function sectionTitle(key: Section, n: number): string {
		const s = t.bundles.sections;
		return key === 'operator' ? (n === 1 ? s.operatorOne : s.operator) : key === 'weapon' ? (n === 1 ? s.weaponOne : s.weapon) : s.other;
	}

	const dayMonth = (iso: string) => shortDate(iso).replace(/ \d{4}$/, '');
	const price = (b: Bundle) => (b.price === null ? '' : b.price.toLocaleString('en-US'));
</script>

{#snippet kindIcon(k: BundleItemKind)}
	<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
		{#if k === 'operator'}
			<circle cx="10" cy="6.5" r="3.2" /><path d="M3.5 18c.6-4 3.2-6 6.5-6s5.9 2 6.5 6" />
		{:else if k === 'weapon'}
			<path d="M2 8h12l1.5-1.5H18V10h-3l-1 1H9l-1.2 4H5l1-4H2z" />
		{:else if k === 'finisher'}
			<path d="M4 16 14 6l2-3 1 1-3 2L6 18zM11 9l2 2" />
		{:else if k === 'camo'}
			<rect x="3" y="3" width="14" height="14" rx="2" /><path d="M3 9c3-2 5 2 8 0s4-3 6-1M6 17c1-3 4-4 6-2" />
		{:else if k === 'decal' || k === 'sticker'}
			<path d="M4 6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6l-4 4H6a2 2 0 0 1-2-2z" /><path d="M16 12h-2.5a1.5 1.5 0 0 0-1.5 1.5V16" />
		{:else if k === 'charm'}
			<circle cx="10" cy="3.5" r="1.6" /><path d="M10 5v2.5M10 7.5l4.5 3v4.5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2v-4.5z" />
		{:else if k === 'reticle'}
			<circle cx="10" cy="10" r="6" /><path d="M10 1.5v4M10 14.5v4M1.5 10h4M14.5 10h4" /><circle cx="10" cy="10" r=".6" fill="currentColor" />
		{:else if k === 'equipment'}
			<circle cx="10" cy="11.5" r="5.5" /><path d="M8 6V3.5h4V6M12 3.5l3-1" />
		{:else if k === 'card'}
			<rect x="2" y="5" width="16" height="10" rx="1.5" /><path d="M5 12l3-3 2 2 2-3 3 4" />
		{:else if k === 'emblem'}
			<path d="M10 2 16.5 4.5v5c0 4-3 6.6-6.5 8.5-3.5-1.9-6.5-4.5-6.5-8.5v-5z" /><path d="M7 9.5 9 11.5l4-4" />
		{:else if k === 'loading'}
			<rect x="2" y="4" width="16" height="11" rx="1.5" /><path d="M2 12l4.5-4 3.5 3 2.5-2L18 13M7 18h6" />
		{:else if k === 'spray'}
			<rect x="6" y="7" width="7" height="11" rx="1.5" /><path d="M8 7V4.5h3V7M13 4l3-1M13.5 6l3 0M13 8l3 1" />
		{:else if k === 'token'}
			<circle cx="10" cy="10" r="7" /><path d="M10 6v4.4l2.8 1.8" />
		{:else}
			<circle cx="10" cy="10" r="7" /><path d="M7.5 7.5h3.5a2 2 0 0 1 0 4H8.5m-1-4v6" />
		{/if}
	</svg>
{/snippet}

{#snippet rarity(r: BundleItem['rarity'])}
	{#if r}<span class="bnd-rarity" data-rarity={r}>{t.bundles.rarity[r]}</span>{/if}
{/snippet}

<div class="grid gap-3 border-t border-line px-4 py-4 sm:px-5">
	<p class="text-[13px] text-fg">{t.bundles.help}</p>

	<div class="flex flex-wrap items-center gap-x-4 gap-y-3">
		<label class="relative block min-w-0 flex-[1_1_220px] sm:max-w-xs">
			<span class="sr-only">{t.bundles.search}</span>
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
				placeholder={t.bundles.searchPlaceholder}
				autocomplete="off"
				spellcheck="false"
				class="h-11 w-full rounded-full border border-line bg-panel pr-4 pl-10 text-fg outline-none placeholder:text-muted focus:border-accent"
			/>
		</label>
		<p class="num text-[13px] font-semibold text-fg" role="status">{t.bundles.results(shown.length, LIST.length)}</p>
	</div>

	<details class="bnd-words rounded-card border border-line bg-panel-2">
		<summary class="font-head min-h-11 cursor-pointer px-3 py-2.5 text-[12px] font-bold tracking-[0.12em] text-fg uppercase">{t.bundles.wordsHeading}</summary>
		<dl class="grid gap-1.5 px-3 pb-3 text-[13px] leading-snug">
			{#each t.bundles.words as [word, meaning] (word)}
				<div><dt class="inline font-semibold text-fg">{word}:</dt> <dd class="inline">{meaning}</dd></div>
			{/each}
		</dl>
	</details>

	{#if shown.length > 0}
		<ul class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,330px),1fr))] items-start gap-3">
			{#each shown as { b, items } (b.id)}
				{@const isNew = bundleIsNew(b, todayIso)}
				<li class="bnd meta-card min-w-0 rounded-card border border-line bg-panel-2" class:left={!!b.left}>
					<div class="bnd-head flex items-start gap-3 px-3 pt-3">
						<div class="min-w-0 flex-1">
							<h3 class="bnd-name font-head font-bold tracking-wide uppercase">
								{b.name}{#if isNew}<span class="bnd-new">{t.bundles.newTag}</span>{/if}
							</h3>
							{#if b.labels.length}<p class="bnd-labels text-[12px] font-semibold text-muted">{b.labels.join(' · ')}</p>{/if}
						</div>
						{#if b.price === null}
							<span class="bnd-price bnd-price-platform" title={t.bundles.platformLong}>{t.bundles.platform}</span>
						{:else}
							<span class="bnd-price num" title={t.bundles.cpLong(price(b))}>{price(b)}<small>{t.bundles.cp}</small></span>
						{/if}
					</div>
					<p class="num px-3 pt-1 text-[12px] text-muted">
						{b.left ? t.bundles.left(dayMonth(b.left)) : t.bundles.since(dayMonth(b.from))} · {t.bundles.count(b.items.length)}
					</p>

					<div class="grid gap-2.5 px-3 pt-2.5 pb-3">
						{#each sections(items) as s (s.key)}
							<section class="min-w-0">
								<h4 class="bnd-sec font-head text-[11px] font-bold tracking-[0.14em] text-muted uppercase">{sectionTitle(s.key, s.items.length)}</h4>
								<ul class="mt-1 grid gap-1">
									{#each s.items as it, i (i)}
										{@const cos = cosmeticOf(it)}
										{@const art = cos ? cosmeticArt(cos.id) : undefined}
										<li class="bnd-row" class:hit={hit(it)} data-kind={it.kind}>
											{#if art}
												<span class="bnd-art flex-none" data-type={it.kind} aria-hidden="true"><svg viewBox={art.viewBox}>{@html art.svg}</svg></span>
											{:else}
												<span class="bnd-ico flex-none" aria-hidden="true">{@render kindIcon(it.kind)}</span>
											{/if}
											<span class="min-w-0 flex-1 leading-snug">
												{#if it.kind === 'weapon' && it.weapon}
													<button
														type="button"
														class="bnd-gun"
														aria-haspopup="dialog"
														aria-label={t.bundles.openWeapon(weaponName(it.weapon))}
														onclick={() => weaponSheet.show(it.weapon!)}>{weaponName(it.weapon)}</button
													>
													<b class="bnd-item">“{it.name}”</b>
												{:else if cos && onitem}
													<span class="bnd-kind">{t.bundles.kinds[it.kind]}</span>
													<button type="button" class="bnd-link" aria-haspopup="dialog" onclick={() => onitem?.(cos)}
														>{it.name}<span class="sr-only"> – {t.bundles.openItem}</span></button
													>
												{:else if it.kind === 'operator'}
													<b class="bnd-item">{it.name}</b>
													{#if it.operator}<span class="text-muted"> {t.bundles.forOperator(it.operator)}</span>{/if}
												{:else}
													<span class="bnd-kind">{t.bundles.kinds[it.kind]}</span>
													<b class="bnd-item">{it.name}</b>
												{/if}
												{#if it.rarity || it.tags || it.reactive}
													<span class="mt-0.5 flex flex-wrap gap-1">
														{@render rarity(it.rarity)}
														{#if it.reactive}<span class="cos-tag">{t.bundles.reactiveSkin}</span>{/if}
														{#each it.tags ?? [] as tag (tag)}
															<span class="cos-tag" class:bnd-mc={tag === 'mastercraft'}>{t.bundles.tags[tag]}</span>
														{/each}
													</span>
												{/if}
											</span>
										</li>
									{/each}
								</ul>
							</section>
						{/each}
						{#if b.note}<p class="text-[12.5px] leading-snug text-muted">{b.note}</p>{/if}
						<a
							class="bnd-store font-head inline-flex min-h-11 items-center gap-1.5 self-start text-[12px] font-bold tracking-wide uppercase"
							href={`https://www.callofduty.com/store/bundles/${b.id}`}
							target="_blank"
							rel="noopener noreferrer">{t.bundles.store} <span aria-hidden="true">↗</span><span class="sr-only"> {t.bundles.newTab}</span></a
						>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="rounded-card border border-line bg-panel-2 px-4 py-5 text-center">
			<p class="text-muted">{t.bundles.none}</p>
			<button type="button" class="btn btn-sm mt-3" onclick={() => (query = '')}>{t.bundles.clear}</button>
		</div>
	{/if}
</div>

<div class="grid gap-1 border-t border-line px-4 py-3 text-xs text-muted sm:px-5">
	<p>{t.bundles.honest}</p>
	<p>{t.bundles.snapshot(BUNDLES_SOURCES, shortDate(BUNDLES_CHECKED))}</p>
</div>

<style>
	.bnd {
		transition: border-color 0.12s;
	}
	.bnd.left {
		opacity: 0.7;
	}
	.bnd-name {
		font-size: 15.5px;
		line-height: 1.2;
		color: var(--t-fg);
		overflow-wrap: anywhere;
	}
	.bnd-new {
		display: inline-block;
		margin-left: 8px;
		vertical-align: 2px;
		border-radius: 999px;
		padding: 1px 8px;
		font-size: 10.5px;
		letter-spacing: 0.06em;
		background: #f5c518;
		color: #1a1405;
	}
	/* the price: a solid plate, the same in every theme so it reads on any panel */
	.bnd-price {
		flex: none;
		border-radius: 8px;
		padding: 4px 9px;
		font-family: var(--t-font-head);
		font-size: 15px;
		font-weight: 800;
		line-height: 1.1;
		white-space: nowrap;
		background: #f0a634;
		color: #1a1405;
	}
	.bnd-price small {
		margin-left: 3px;
		font-size: 10.5px;
		font-weight: 700;
	}
	.bnd-price-platform {
		font-size: 11px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		background: #3a4250;
		color: #f2f4f7;
	}
	.bnd-sec {
		border-bottom: 1px solid var(--t-line);
		padding-bottom: 3px;
	}
	.bnd-row {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		min-height: 28px;
		padding: 2px 4px 2px 2px;
		border-radius: 6px;
		font-size: 13.5px;
		color: var(--t-fg);
	}
	.bnd-row.hit {
		background: color-mix(in srgb, var(--t-accent) 18%, transparent);
		box-shadow: inset 3px 0 0 var(--t-accent);
	}
	.bnd-ico {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 6px;
		border: 1px solid var(--t-line);
		background: var(--t-panel);
		color: var(--t-muted);
	}
	.bnd-ico :global(svg) {
		width: 18px;
		height: 18px;
	}
	.bnd-row[data-kind='operator'] .bnd-ico,
	.bnd-row[data-kind='weapon'] .bnd-ico {
		color: var(--t-fg);
	}
	/* our drawing of a sticker / charm / decal we list, on the Cosmetics tab's gun-metal plate */
	.bnd-art {
		display: grid;
		place-items: center;
		height: 30px;
		border-radius: 6px;
		background:
			linear-gradient(160deg, rgb(255 255 255 / 0.08), transparent 45%),
			#2a2f34;
		overflow: hidden;
	}
	.bnd-art[data-type='sticker'],
	.bnd-art[data-type='charm'] {
		width: 30px;
	}
	.bnd-art[data-type='decal'] {
		width: 45px;
	}
	.bnd-art svg {
		width: 100%;
		height: 100%;
		padding: 1px;
	}
	.bnd-kind {
		margin-right: 5px;
		font-family: var(--t-font-head);
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--t-muted);
	}
	.bnd-item {
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	/* a gun / a listed cosmetic: tappable text, with a tap area of at least 44 px tall */
	.bnd-gun,
	.bnd-link {
		position: relative;
		margin-right: 4px;
		font-weight: 700;
		text-align: left;
		color: var(--t-fg);
		text-decoration: underline;
		text-decoration-color: color-mix(in srgb, var(--t-accent) 70%, transparent);
		text-decoration-thickness: 2px;
		text-underline-offset: 3px;
	}
	.bnd-link {
		font-weight: 600;
	}
	.bnd-gun::after,
	.bnd-link::after {
		content: '';
		position: absolute;
		inset: -13px -4px;
	}
	.bnd-gun:hover,
	.bnd-link:hover {
		text-decoration-color: var(--t-accent);
	}
	.bnd-rarity {
		border-radius: 999px;
		padding: 0 7px;
		font-family: var(--t-font-head);
		font-size: 10.5px;
		font-weight: 800;
		line-height: 17px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #15110a;
		background: var(--rc);
	}
	.bnd-rarity[data-rarity='rare'] {
		--rc: #5fb0ff;
	}
	.bnd-rarity[data-rarity='epic'] {
		--rc: #c287ee;
	}
	.bnd-rarity[data-rarity='legendary'] {
		--rc: #f0ad45;
	}
	.bnd-rarity[data-rarity='ultra'] {
		--rc: #ff6b84;
	}
	.cos-tag {
		border: 1px solid var(--t-line);
		border-radius: 999px;
		padding: 0 7px;
		font-family: var(--t-font-head);
		font-size: 10.5px;
		font-weight: 700;
		line-height: 15px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		white-space: nowrap;
		color: var(--t-fg);
		background: var(--t-panel);
	}
	.cos-tag.bnd-mc {
		border-color: #e2bd52;
		background: #e2bd52;
		color: #1a1405;
	}
	.bnd-store {
		color: var(--t-accent);
	}
	.bnd-store:hover {
		text-decoration: underline;
	}
	.bnd-words summary::marker {
		color: var(--t-muted);
	}
</style>
