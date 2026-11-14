<script lang="ts">
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import { OFFLINE_FILE, clearLinkFromAddress, linkCodeInAddress } from '#lib/browser.ts';
	import { DIVERGENCE_REQUIRED, LADDER, MAX_LEVEL } from '#lib/data/camos.ts';
	import { CLASSES, WEAPONS } from '#lib/data/weapons.ts';
	import { matchesStatus } from '#lib/filters.ts';
	import { t } from '#lib/i18n/en.ts';
	import { decodeLink, sameProgress, type ProgressData } from '#lib/progress-codec.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { THEMES } from '#lib/themes.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import AbscarFx from '#lib/components/AbscarFx.svelte';
	import ClassMeta from '#lib/components/ClassMeta.svelte';
	import ClassSection from '#lib/components/ClassSection.svelte';
	import CosmeticsSection from '#lib/components/CosmeticsSection.svelte';
	import ExtraCamosSection from '#lib/components/ExtraCamosSection.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import HudReadout from '#lib/components/HudReadout.svelte';
	import DamascusSteel from '#lib/components/DamascusSteel.svelte';
	import NewsBanner from '#lib/components/NewsBanner.svelte';
	import NewsBuddy from '#lib/components/NewsBuddy.svelte';
	import RetroTv from '#lib/components/RetroTv.svelte';
	import hotrodCamo from '#lib/assets/hotrod-camo.webp';
	import { WORN_METAL } from '#lib/kpiCamos.ts';
	import KpiBar from '#lib/components/KpiBar.svelte';
	import LoadoutDialog from '#lib/components/LoadoutDialog.svelte';
	import OperatorTag from '#lib/components/OperatorTag.svelte';
	import MasterySection from '#lib/components/MasterySection.svelte';
	import MetaSection from '#lib/components/MetaSection.svelte';
	import CyborgBanner from '#lib/components/CyborgBanner.svelte';
	import SaveStatus from '#lib/components/SaveStatus.svelte';
	import BuffSearch from '#lib/components/BuffSearch.svelte';
	import NukeBanner from '#lib/components/NukeBanner.svelte';
	import LarsAkeBanner from '#lib/components/LarsAkeBanner.svelte';
	import CrownBanner from '#lib/components/CrownBanner.svelte';
	import DoomsdayBanner from '#lib/components/DoomsdayBanner.svelte';
	import SyncPanel from '#lib/components/SyncPanel.svelte';
	import ThemePicker from '#lib/components/ThemePicker.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import Toolbar from '#lib/components/Toolbar.svelte';
	import SeasonStrip from '#lib/components/SeasonStrip.svelte';
	import WeaponSheet from '#lib/components/WeaponSheet.svelte';
	import KillFeed from '#lib/components/KillFeed.svelte';
	import DivergenceUnlock from '#lib/components/DivergenceUnlock.svelte';
	import BootSequence from '#lib/components/BootSequence.svelte';
	import AbscarTerminal from '#lib/components/AbscarTerminal.svelte';
	import PageTabs from '#lib/components/PageTabs.svelte';
	import RankedSection from '#lib/components/RankedSection.svelte';
	import { pageTab } from '#lib/pageTab.svelte.ts';
	import SquadSection from '#lib/components/SquadSection.svelte';
	import ReadyBanner from '#lib/components/ReadyBanner.svelte';
	import { squad } from '#lib/squad.svelte.ts';

	/** The page tabs under the header (2026-11-12; Squad 2026-11-14). All stay mounted; the others are only hidden. */
	const PAGE_TABS = ['grind', 'cosmetics', 'extras', 'squad'] as const;
	let view = $state<(typeof PAGE_TABS)[number]>('grind');

	// a squad link was opened: show the Squad tab, where it asks for your name
	$effect(() => {
		if (squad.showTab > 0) view = 'squad';
	});

	function tabKey(e: KeyboardEvent) {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		e.preventDefault();
		const step = e.key === 'ArrowRight' ? 1 : PAGE_TABS.length - 1;
		view = PAGE_TABS[(PAGE_TABS.indexOf(view) + step) % PAGE_TABS.length];
		document.getElementById(`tab-${view}`)?.focus();
	}

	let query = $state('');
	const needle = $derived(query.trim().toLowerCase());

	/** What saved progress the status filters look at (filters.ts). */
	const grind = $derived({
		weapons: progress.weapons,
		specials: progress.specials,
		counts: {}, // counters are no longer shown (2026-11-11), so old saved ones don't steer the filters
		focus: progress.prefs.focus
	});

	const sections = $derived(
		CLASSES.map((cls, i) => {
			const classHit =
				needle !== '' &&
				(cls.name.toLowerCase().includes(needle) || cls.short.toLowerCase() === needle);
			const status = progress.prefs.status;
			const visible = cls.weapons.filter(
				(w) =>
					(needle === '' || classHit || w.name.toLowerCase().includes(needle)) &&
					!(progress.prefs.hideMaxed && progress.level(w.id) >= MAX_LEVEL) &&
					(status === null || matchesStatus(status, grind, w))
			);
			return { cls, number: i + 1, visible };
		}).filter(
			(s) =>
				(progress.prefs.classFilter === null || s.cls.id === progress.prefs.classFilter) &&
				((needle === '' && progress.prefs.status === null) || s.visible.length > 0)
		)
	);
	const shownCount = $derived(sections.reduce((n, s) => n + s.visible.length, 0));

	function clearFilters() {
		query = '';
		progress.setPref('classFilter', null);
		progress.setPref('status', null);
		progress.setPref('hideMaxed', false);
	}

	// ----- progress links (#p=…) -----

	let linkOffer = $state<ProgressData | null>(null);
	let linkDialogOpen = $state(false);

	function summary(p: ProgressData): string {
		const [gold, plat, hb] = LADDER.map(
			(_, i) => WEAPONS.filter((w) => (p.weapons[w.id] ?? 0) > i).length
		);
		return t.summary(gold, plat, hb);
	}

	function applyLink(incoming: ProgressData) {
		linkDialogOpen = false;
		linkOffer = null;
		const before = progress.replace(incoming);
		toast.show(t.toast.linkLoaded, { label: t.toast.undo, run: () => progress.replace(before) });
	}

	function checkAddressForLink() {
		const code = linkCodeInAddress();
		if (code === null) return;
		clearLinkFromAddress();
		const incoming = decodeLink(code);
		if (!incoming) {
			toast.show(t.toast.badLink, undefined, 7000);
		} else if (sameProgress(incoming, progress.snapshot())) {
			toast.show(t.toast.linkLoaded);
		} else if (progress.isDefault()) {
			applyLink(incoming);
		} else {
			linkOffer = incoming;
			linkDialogOpen = true;
		}
	}

	onMount(() => {
		const result = progress.load();
		pageTab.load();
		if (result === 'migrated-v1') toast.show(t.toast.importedOld, undefined, 7000);
		else if (result === 'unreadable') toast.show(t.toast.corruptSave, undefined, 10000);
		if (!progress.canSave) toast.show(t.toast.notSaving, undefined, 10000);

		checkAddressForLink();
		const stopFollowing = progress.followOtherTabs();
		window.addEventListener('hashchange', checkAddressForLink);
		return () => {
			stopFollowing();
			window.removeEventListener('hashchange', checkAddressForLink);
		};
	});

	// ----- theme and compact mode on <html> -----

	$effect(() => {
		if (!progress.ready) return; // keep what app.html applied until saved prefs are read
		const theme = THEMES.find((x) => x.id === progress.prefs.theme) ?? THEMES[0];
		document.documentElement.setAttribute('data-theme', theme.id);
		document.documentElement.toggleAttribute('data-compact', progress.prefs.compact);
		document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.browserBar);
	});
</script>

<svelte:head>
	<title>{t.pageTitle}</title>
	<!-- "Get it as an app": the home-screen icon (not in the offline file, which can't be installed) -->
	{#if !OFFLINE_FILE}
		<link rel="manifest" href={asset('manifest.webmanifest')} />
		<link rel="apple-touch-icon" href={asset('icons/apple-touch-icon.png')} />
		<meta name="apple-mobile-web-app-title" content={t.installApp.appName} />
	{/if}
	<noscript><style>.app-gate { opacity: 1 !important; }</style></noscript>
</svelte:head>

<a
	href="#weapons"
	class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[90] focus:rounded-full focus:bg-panel focus:px-4 focus:py-3 focus:text-fg"
	>{t.nav.skip}</a
>

<AbscarFx />

<div class="app-gate" class:ready={progress.ready}>
	<div class="relative bg-band text-band-fg">
		<div class="abscar-only compact-hide"><DamascusSteel /></div>
		<div class="abscar-only compact-hide" aria-hidden="true"><div class="hud-vision"></div></div>
		<!-- the settings row: save status on the left; Compact, theme, sound and pause animations on the right (2026-11-10/11) -->
		<div class="hdr-bar relative z-[32] mx-auto flex max-w-[1240px] items-center justify-between gap-2 px-4 pt-2 sm:px-5 sm:pt-3">
			<div class="min-w-0"><SaveStatus /></div>
			<!-- CS2 skin prices: opens BUFF163's search (2026-11-11); a magnifier with a drop-down on phones -->
			<BuffSearch />
			<ThemePicker />
		</div>
		<!-- Abscar lays this out as a grid (style block below); the other themes only show the title.
		     Squad frame, HUD + title, the news buddy, and the old TV beside them (the user's layout). -->
		<header
			class="abscar-header relative mx-auto flex max-w-[1240px] flex-wrap items-stretch justify-between gap-4 px-4 pt-3 pb-5 sm:px-5 sm:pt-4"
		>
			<div class="hdr-squad abscar-only compact-hide relative z-[1] min-w-0"><OperatorTag /></div>
			<div class="hdr-title relative z-[1] min-w-0">
				<div class="compact-hide mb-5"><HudReadout /></div>
				<h1 class="font-head text-[clamp(28px,7vw,42px)] leading-none font-bold tracking-wide uppercase">
					<span class="brand-glow text-brand">{t.title.game}</span><span
						class="mx-[0.3em] font-normal text-band-muted"
						aria-hidden="true">//</span
					><span class="sr-only"> </span><span class="title-skin">{t.title.app}</span>
				</h1>
			</div>
			<!-- the old TV with CoD montages; z above the fixed scanline layer (z 30), so nothing is
			     drawn over the video -->
			<div class="hdr-tv abscar-only compact-hide relative z-[31]"><RetroTv /></div>
			<div class="hdr-buddy abscar-only compact-hide relative z-[1]"><NewsBuddy /></div>
		</header>
		<div class="abscar-only compact-hide"><div class="damascus-floor"></div></div>
	</div>

	<main
		class="mx-auto max-w-[1240px] px-4 pb-8 sm:px-5"
		style:--hotrod-tile="url({hotrodCamo})"
		style:--worn-metal={WORN_METAL}
	>
		<!-- the squad's Ready up / ping banners (every tab; nothing outside a squad) -->
		<ReadyBanner />

		<!-- page tabs: the tracker, the Cosmetics list, Extra camos or the Squad -->
		<div class="page-tabs mt-4 flex gap-2" role="tablist" aria-label={t.pageTabs.label}>
			{#each PAGE_TABS as tab (tab)}
				<button
					type="button"
					id="tab-{tab}"
					role="tab"
					class="page-tab font-head"
					aria-selected={view === tab}
					aria-controls="panel-{tab}"
					tabindex={view === tab ? 0 : -1}
					onclick={() => (view = tab)}
					onkeydown={tabKey}>{t.pageTabs[tab]}{#if tab === 'squad' && squad.unread > 0 && view !== 'squad'}<span class="tab-badge num">{squad.unread}<span class="sr-only"> ({t.squad.radio.unread(squad.unread)})</span></span>{/if}</button
				>
			{/each}
		</div>

		<div id="panel-cosmetics" role="tabpanel" aria-labelledby="tab-cosmetics" hidden={view !== 'cosmetics'}>
			<div class="mt-5"><CosmeticsSection /></div>
		</div>

		<div id="panel-extras" role="tabpanel" aria-labelledby="tab-extras" hidden={view !== 'extras'}>
			<div class="mt-5"><ExtraCamosSection /></div>
		</div>

		<div id="panel-squad" role="tabpanel" aria-labelledby="tab-squad" hidden={view !== 'squad'}>
			<div class="mt-5"><SquadSection visible={view === 'squad'} /></div>
		</div>

		<div id="panel-grind" role="tabpanel" aria-labelledby="tab-grind" hidden={view !== 'grind'}>
		<!-- the green radar with the latest COD news -->
		<div class="compact-hide mt-5"><NewsBanner /></div>

		<!-- the season countdown: day of the season, its end, what's coming (2026-11-11) -->
		<div class="compact-hide mt-3"><SeasonStrip /></div>

		<!-- overall progress and the next milestone -->
		<div class="mt-4"><KpiBar /></div>

		<!-- the two big tabs right above the weapon list (2026-11-12, the user's ask): the camo
		     checklist or Ranked prep -->
		<div class="mt-6"><PageTabs panelId="page-panel" /></div>

		<div id="page-panel" role="tabpanel" aria-labelledby="page-tab-{pageTab.current}">
		{#if pageTab.current === 'ranked'}
			<div class="mt-4"><RankedSection /></div>
		{:else}
		<!-- 4. search and filters -->
		<div id="weapons" class="mt-4 scroll-mt-4">
			<Toolbar bind:query shown={shownCount} total={WEAPONS.length} onclear={clearFilters} />
		</div>

		<!-- the picked class's meta top 5, above its weapons -->
		{#if progress.prefs.classFilter}
			<div class="compact-hide mt-4"><ClassMeta classId={progress.prefs.classFilter} /></div>
		{/if}

		<!-- 5. the weapon list -->
		{#if sections.length > 0}
			<div class="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4">
				{#each sections as s (s.cls.id)}
					<ClassSection cls={s.cls} number={s.number} visible={s.visible} />
				{/each}
			</div>
		{:else}
			{@const cls = CLASSES.find((c) => c.id === progress.prefs.classFilter)}
			<div class="mt-4 rounded-card bg-panel px-4 py-6 text-center shadow-card">
				<p class="text-muted">
					{#if needle !== ''}
						{cls ? t.empty.noMatchInClass(query.trim(), cls.name) : t.empty.noMatch(query.trim())}
					{:else}
						{t.empty.noMatchFilters}
					{/if}
					{#if progress.prefs.hideMaxed}{' '}{t.empty.hideMaxedOn}{/if}
				</p>
				<button type="button" class="btn mt-3 border-accent" onclick={clearFilters}>{t.toolbar.clear}</button>
			</div>
		{/if}

		<!-- 6. Divergence and Mastery -->
		<div class="mt-7"><MasterySection /></div>

		<!-- 7. news and everything else -->
		<div class="compact-hide mt-7"><MetaSection /></div>
		{/if}
		</div>

		<div class="abscar-only compact-hide mt-7">
			<!-- the five banners share one height (the user's ask: "same size so they look in proportion");
			     Drängen Lars Åke's in the middle (2026-11-13), the crowned skull (2026-11-13), and the squad in
			     front of the mushroom cloud last (2026-11-14) -->
			<div class="h-[clamp(190px,38vw,470px)] overflow-hidden rounded-card shadow-card"><NukeBanner /></div>
			<div class="mt-4 h-[clamp(190px,38vw,470px)] overflow-hidden rounded-card shadow-card"><LarsAkeBanner /></div>
			<div class="mt-4 h-[clamp(190px,38vw,470px)] overflow-hidden rounded-card shadow-card"><CyborgBanner /></div>
			<div class="mt-4 h-[clamp(190px,38vw,470px)] overflow-hidden rounded-card shadow-card"><CrownBanner /></div>
			<div class="mt-4 h-[clamp(190px,38vw,470px)] overflow-hidden rounded-card shadow-card"><DoomsdayBanner /></div>
		</div>

		<div class="mt-7"><SyncPanel /></div>
		</div>

		<footer class="compact-hide mt-7 grid gap-1.5 text-xs text-muted">
			<p>{t.help.howTo}</p>
			<p>{t.help.divergence(DIVERGENCE_REQUIRED)}</p>
			<p>{t.help.sources}</p>
		</footer>
	</main>
</div>

<Toast />

<LoadoutDialog />

<WeaponSheet />

<!-- Abscar extras: kill feed, the Divergence flash and the boot text (decoration, aria-hidden) -->
<KillFeed />
<DivergenceUnlock />
<BootSequence />
<!-- Abscar: the secret terminal (type "abscar", press §, or tap the red HUD box 5 times) -->
<AbscarTerminal />

<Dialog bind:open={linkDialogOpen} title={t.linkImport.title}>
	{#if linkOffer}
		<p>{t.linkImport.body(summary(linkOffer), summary(progress.snapshot()))}</p>
	{/if}
	{#snippet actions()}
		<button type="button" class="btn" onclick={() => (linkDialogOpen = false)}>{t.linkImport.keep}</button>
		<button type="button" class="btn btn-primary" onclick={() => linkOffer && applyLink(linkOffer)}>{t.linkImport.use}</button>
	{/snippet}
</Dialog>

<style>
	/* the two page tabs under the header */
	.page-tabs {
		border-bottom: 2px solid var(--t-line);
	}
	.page-tab {
		min-height: 2.75rem;
		margin-bottom: -2px;
		padding: 0 1.1rem;
		border: 2px solid transparent;
		border-bottom-color: var(--t-line);
		border-radius: 10px 10px 0 0;
		color: var(--t-muted);
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	/* new radio messages on the Squad tab */
	.tab-badge {
		display: inline-grid;
		place-items: center;
		min-width: 1.25rem;
		height: 1.25rem;
		margin-left: 0.35rem;
		padding: 0 4px;
		border-radius: 999px;
		background: #3ee06a;
		color: #062010;
		font-size: 11px;
		letter-spacing: 0;
		vertical-align: 1px;
	}
	.page-tab:hover {
		color: var(--t-fg);
	}
	/* phones: the four tabs share the row equally; a long name wraps onto two lines */
	@media (max-width: 639px) {
		.page-tabs {
			gap: 4px;
		}
		.page-tab {
			flex: 1 1 0;
			min-width: 0;
			padding: 0 0.25rem;
			font-size: 12px;
			line-height: 1.1;
			letter-spacing: 0.03em;
		}
	}
	.page-tab[aria-selected='true'] {
		border-color: var(--t-accent);
		border-bottom-color: var(--t-bg);
		background: var(--t-panel);
		color: var(--t-fg);
		box-shadow: inset 0 3px 0 var(--t-accent);
	}

	/*
	 * The Abscar header (the user's asks, 2026-11-10): on the left the squad frame, right under it the
	 * HUD box + title, and under those the news buddy; the old TV on the right beside them. A grid
	 * only in this theme: the others keep the plain flex row with just the title (their hidden extras
	 * would leave empty grid gaps).
	 */
	:global([data-theme='blackout']) .abscar-header {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-areas: 'squad' 'title' 'tv' 'buddy';
		gap: 20px 24px;
		align-items: start;
	}
	:global([data-theme='blackout']) .hdr-squad {
		grid-area: squad;
	}
	:global([data-theme='blackout']) .hdr-title {
		grid-area: title;
		justify-self: start; /* as wide as its content, so the HUD box keeps its own width */
	}
	:global([data-theme='blackout']) .hdr-tv {
		grid-area: tv;
		justify-self: center;
	}
	:global([data-theme='blackout']) .hdr-buddy {
		grid-area: buddy;
		justify-self: start;
		max-width: 100%;
	}
	/* two columns once the title (≈ 425 px) and the TV (304 px) fit side by side */
	@media (min-width: 820px) {
		:global([data-theme='blackout']) .abscar-header {
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-areas: 'squad squad' 'title tv' 'buddy tv';
		}
		:global([data-theme='blackout']) .hdr-tv {
			justify-self: end;
		}
	}
	/* wide enough for the squad frame (716 px) beside the TV too: the TV reaches up to the top right,
	   its antennas into the header's top padding, clear of the theme picker */
	@media (min-width: 1140px) {
		:global([data-theme='blackout']) .abscar-header {
			grid-template-areas: 'squad tv' 'title tv' 'buddy tv';
		}
		:global([data-theme='blackout']) .hdr-tv {
			margin-top: -8px;
		}
	}
</style>
