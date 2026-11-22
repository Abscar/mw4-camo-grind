<script lang="ts">
	import { onMount, untrack } from 'svelte';
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
	import MatrixRain from '#lib/components/MatrixRain.svelte';
	import ClassMeta from '#lib/components/ClassMeta.svelte';
	import ClassSection from '#lib/components/ClassSection.svelte';
	import CollectionsSection from '#lib/components/CollectionsSection.svelte';
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
	import MetaPodium from '#lib/components/MetaPodium.svelte';
	import MetaSection from '#lib/components/MetaSection.svelte';
	import SightsSection from '#lib/components/SightsSection.svelte';
	import CyborgBanner from '#lib/components/CyborgBanner.svelte';
	import SaveStatus from '#lib/components/SaveStatus.svelte';
	import BuffSearch from '#lib/components/BuffSearch.svelte';
	import NukeBanner from '#lib/components/NukeBanner.svelte';
	import LarsAkeBanner from '#lib/components/LarsAkeBanner.svelte';
	import CrownBanner from '#lib/components/CrownBanner.svelte';
	import DoomsdayBanner from '#lib/components/DoomsdayBanner.svelte';
	import WizardBanner from '#lib/components/WizardBanner.svelte';
	import ScooterBanner from '#lib/components/ScooterBanner.svelte';
	import JokerBanner from '#lib/components/JokerBanner.svelte';
	import NukeBannerPic from '#lib/assets/nuke-banner.webp';
	import LarsAkeBannerPic from '#lib/assets/lars-ake-banner.webp';
	import CyborgBannerPic from '#lib/assets/cyborg-banner.webp';
	import CrownBannerPic from '#lib/assets/crown-banner.webp';
	import DoomsdayBannerPic from '#lib/assets/doomsday-banner.webp';
	import WizardBannerPic from '#lib/assets/wizard-banner.webp';
	import ScooterBannerPic from '#lib/assets/scooter-banner.webp';
	import JokerBannerPic from '#lib/assets/joker-banner.webp';
	import PhotoGallery from '#lib/components/PhotoGallery.svelte';
	import SyncPanel from '#lib/components/SyncPanel.svelte';
	import ThemePicker from '#lib/components/ThemePicker.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import NetGraph from '#lib/components/NetGraph.svelte';
	import Toolbar from '#lib/components/Toolbar.svelte';
	import SeasonStrip from '#lib/components/SeasonStrip.svelte';
	import WeaponSheet from '#lib/components/WeaponSheet.svelte';
	import KillFeed from '#lib/components/KillFeed.svelte';
	import ShopExtras from '#lib/components/ShopExtras.svelte';
	import DivergenceUnlock from '#lib/components/DivergenceUnlock.svelte';
	import BootSequence from '#lib/components/BootSequence.svelte';
	import AbscarTerminal from '#lib/components/AbscarTerminal.svelte';
	import RankedSection from '#lib/components/RankedSection.svelte';
	import SquadSection from '#lib/components/SquadSection.svelte';
	import CasinoSection from '#lib/components/CasinoSection.svelte';
	import ShopPage from '#lib/components/ShopPage.svelte';
	import ArcadePage from '#lib/components/arcade/ArcadePage.svelte';
	import MayhemPage from '#lib/components/mayhem/MayhemPage.svelte';
	import ReadyBanner from '#lib/components/ReadyBanner.svelte';
	import SquadUpBanner from '#lib/components/SquadUpBanner.svelte';
	import Four20Banner from '#lib/components/Four20Banner.svelte';
	import SquadUpFire from '#lib/components/SquadUpFire.svelte';
	import { squad } from '#lib/squad.svelte.ts';
	import { hidden } from '#lib/hidden.svelte.ts';
	import { headerAreas, type HideId } from '#lib/hideSections.ts';
	import HideButton from '#lib/components/HideButton.svelte';
	import HiddenBar from '#lib/components/HiddenBar.svelte';
	import PageTabIcon from '#lib/components/PageTabIcon.svelte';

	/** The page tabs under the header (2026-11-12; Squad 2026-11-14; BurgiCasino + BurgiShop 2026-11-16; Ranked
	    moved up here from its own switch inside Camo grind, second place, 2026-11-20). All stay mounted; the
	    others are only hidden. Like the rest, the page always opens on Camo grind. */
	/* (2026-11-22, the user: Cosmetics + Extra camos merged into one tab, Squad last and lit up green;
	   Squad Mayhem 2026-11-23, right before Squad) */
	const PAGE_TABS = ['grind', 'ranked', 'cosmetics', 'casino', 'shop', 'arcade', 'mayhem', 'squad'] as const;
	type PageTab = (typeof PAGE_TABS)[number];
	let view = $state<PageTab>('grind');

	/** Each tab's own colour (2026-11-21, the user: "gör dom tydligt vilken som är vilken"): its picture, top edge
	    and tint, and the line under the row takes the open tab's colour. The same in every theme. */
	const TAB_COLOR: Record<PageTab, string> = {
		grind: '#f2b81f', // camo gold
		ranked: '#4d8dff',
		cosmetics: '#ff5cb8',
		squad: '#43d35e', // the radio's green
		casino: '#ff4a3d',
		shop: '#a560ff', // BurgiShop's purple bag
		arcade: '#ff8a2a', // BurgiArcade's neon orange
		mayhem: '#9dff2e' // Squad Mayhem's acid lime (2026-11-23)
	};

	/** Every tab but Camo grind can be hidden (2026-11-20, the "Hide" buttons): its tab button goes, the panel
	    stays mounted (so the squad, sync etc. keep running). */
	const TAB_HIDE: Record<Exclude<PageTab, 'grind'>, HideId> = {
		ranked: 'tabRanked',
		cosmetics: 'tabCosmetics',
		squad: 'tabSquad',
		casino: 'tabCasino',
		shop: 'tabShop',
		arcade: 'tabArcade',
		mayhem: 'tabMayhem'
	};
	const tabShown = (tab: PageTab) => tab === 'grind' || !hidden.is(TAB_HIDE[tab]);
	const shownTabs = $derived(PAGE_TABS.filter(tabShown));

	// the tab you're on was hidden (its own "Hide this tab" button, or the list): back to Camo grind
	$effect(() => {
		if (!tabShown(view)) view = 'grind';
	});

	/** to the Squad tab, bringing it back if it was hidden (a squad link, or "go to Squad" in the casino/shop) */
	function goSquad() {
		if (hidden.is('tabSquad')) hidden.set('tabSquad', false);
		view = 'squad';
	}

	// a squad link was opened: show the Squad tab, where it asks for your name
	$effect(() => {
		if (squad.showTab > 0) untrack(goSquad);
	});

	function tabKey(e: KeyboardEvent) {
		if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
		e.preventDefault();
		const step = e.key === 'ArrowRight' ? 1 : shownTabs.length - 1;
		view = shownTabs[(shownTabs.indexOf(view) + step) % shownTabs.length];
		document.getElementById(`tab-${view}`)?.focus();
	}

	/** Abscar's header grid without the parts that are hidden (no empty rows keeping their gaps) */
	const areas = $derived(headerAreas(hidden.ids));

	/** The user's own pictures under Meta top 5 (Abscar only), each with its own "Hide" */
	const BANNERS = [
		{ id: 'picNuke', C: NukeBanner, src: NukeBannerPic },
		{ id: 'picLars', C: LarsAkeBanner, src: LarsAkeBannerPic },
		{ id: 'picCyborg', C: CyborgBanner, src: CyborgBannerPic },
		{ id: 'picCrown', C: CrownBanner, src: CrownBannerPic },
		{ id: 'picWizard', C: WizardBanner, src: WizardBannerPic },
		{ id: 'picDoomsday', C: DoomsdayBanner, src: DoomsdayBannerPic },
		{ id: 'picScooter', C: ScooterBanner, src: ScooterBannerPic },
		{ id: 'picJoker', C: JokerBanner, src: JokerBannerPic }
	] as const satisfies readonly { id: HideId; C: unknown; src: string }[];

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
		// before progress.load(): what's hidden lands in the same update that fades the page in
		hidden.load();
		const result = progress.load();
		// the old "Camo list | Ranked prep" switch remembered Ranked here (until 2026-11-20); Ranked is a page
		// tab now and the page opens on Camo grind, so the leftover choice is just cleared
		try {
			localStorage.removeItem('mw4-camo-grind:tab');
		} catch {
			// storage blocked: nothing to clear
		}
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
<!-- the Matrix theme's falling green code, behind everything (only drawn in that theme) -->
<MatrixRain />

<div class="app-gate" class:ready={progress.ready}>
	<div class="relative bg-band text-band-fg">
		<div class="abscar-only compact-hide"><DamascusSteel /></div>
		<div class="abscar-only compact-hide" aria-hidden="true"><div class="hud-vision"></div></div>
		<!-- squad up: the header burns while 3+ of the squad are online -->
		<div class="abscar-only compact-hide"><SquadUpFire /></div>
		<!-- the settings row: save status on the left; Compact, theme, sound and pause animations on the right (2026-11-10/11) -->
		<div class="hdr-bar relative z-[32] mx-auto flex max-w-[1240px] items-center justify-between gap-1 px-4 pt-2 min-[421px]:gap-2 sm:px-5 sm:pt-3">
			<div class="min-w-0"><SaveStatus /></div>
			<!-- CS2 skin prices: opens BUFF163's search (2026-11-11); a magnifier with a drop-down on phones -->
			<BuffSearch />
			<ThemePicker />
		</div>
		<!-- Abscar lays this out as a grid (style block below); the other themes only show the title.
		     Squad frame, HUD + title, the news buddy, and the old TV beside them (the user's layout). -->
		<header
			class="abscar-header relative mx-auto flex max-w-[1240px] flex-wrap items-stretch justify-between gap-4 px-4 pt-3 pb-5 sm:px-5 sm:pt-4"
			style:--hdr-phone={areas.phone}
			style:--hdr-mid={areas.mid}
			style:--hdr-wide={areas.wide}
			style:--hdr-mid-cols={areas.midCols}
			style:--hdr-wide-cols={areas.wideCols}
		>
			<div class="hdr-squad abscar-only compact-hide relative z-[1] min-w-0" hidden={hidden.is('squad')}>
				<OperatorTag />
			</div>
			<div class="hdr-title relative z-[1] min-w-0">
				<div class="hdr-hud compact-hide relative mb-5" hidden={hidden.is('hud')}><HudReadout /><HideButton id="hud" abscar /></div>
				<h1 class="font-head text-[clamp(28px,7vw,42px)] leading-none font-bold tracking-wide uppercase">
					<span class="brand-glow text-brand">{t.title.game}</span><span
						class="mx-[0.3em] font-normal text-band-muted"
						aria-hidden="true">//</span
					><span class="sr-only"> </span><span class="title-skin">{t.title.app}</span>
				</h1>
			</div>
			<!-- the old TV with CoD montages; z above the fixed scanline layer (z 30), so nothing is
			     drawn over the video -->
			<div class="hdr-tv abscar-only compact-hide relative z-[31]" hidden={hidden.is('tv')}><RetroTv /></div>
			<div class="hdr-buddy abscar-only compact-hide relative z-[1]" hidden={hidden.is('buddy')}><NewsBuddy /><HideButton id="buddy" /></div>
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
		<SquadUpBanner />
		<Four20Banner />

		<!-- "n parts hidden · Choose · Show all" while anything is hidden, and the "What to show" list -->
		<HiddenBar />

		<!-- page tabs: the tracker, Ranked prep, Cosmetics & camos, BurgiCasino, BurgiShop, BurgiArcade, the Squad (last, lit green) -->
		<!-- every other tab hidden: no row for Camo grind alone (it stays in the page for the panel's label) -->
		<div
			class="page-tabs mt-4 flex gap-2"
			role="tablist"
			aria-label={t.pageTabs.label}
			hidden={shownTabs.length === 1}
			style:--sel={TAB_COLOR[view]}
		>
			{#each shownTabs as tab (tab)}
				<button
					type="button"
					id="tab-{tab}"
					role="tab"
					class="page-tab font-head"
					data-tab={tab}
					style:--tc={TAB_COLOR[tab]}
					aria-selected={view === tab}
					aria-controls="panel-{tab}"
					tabindex={view === tab ? 0 : -1}
					onclick={() => (view = tab)}
					onkeydown={tabKey}
					><PageTabIcon kind={tab} /><span class="pt-name">{t.pageTabs[tab]}</span>{#if tab === 'squad' && squad.unread > 0 && view !== 'squad'}<span
							class="tab-badge num">{squad.unread}<span class="sr-only"> ({t.squad.radio.unread(squad.unread)})</span></span
						>{/if}</button
				>
			{/each}
		</div>

		<!-- every tab but Camo grind has a "Hide this tab" button at its top right (2026-11-20) -->
		{#snippet tabHide(tab: Exclude<PageTab, 'grind'>)}
			<div class="mt-3 flex justify-end"><HideButton id={TAB_HIDE[tab]} inline label={t.hide.tabButton} /></div>
		{/snippet}

		<div id="panel-ranked" role="tabpanel" aria-labelledby="tab-ranked" hidden={view !== 'ranked'}>
			{@render tabHide('ranked')}
			<div class="mt-2"><RankedSection /></div>
		</div>

		<div id="panel-cosmetics" role="tabpanel" aria-labelledby="tab-cosmetics" hidden={view !== 'cosmetics'}>
			{@render tabHide('cosmetics')}
			<div class="mt-2"><CollectionsSection /></div>
		</div>

		<div id="panel-squad" role="tabpanel" aria-labelledby="tab-squad" hidden={view !== 'squad'}>
			{@render tabHide('squad')}
			<div class="mt-2"><SquadSection visible={view === 'squad'} /></div>
		</div>

		<div id="panel-casino" role="tabpanel" aria-labelledby="tab-casino" hidden={view !== 'casino'}>
			{@render tabHide('casino')}
			<div class="mt-2"><CasinoSection onSquad={goSquad} /></div>
		</div>

		<div id="panel-shop" role="tabpanel" aria-labelledby="tab-shop" hidden={view !== 'shop'}>
			{@render tabHide('shop')}
			<div class="mt-2"><ShopPage onSquad={goSquad} /></div>
		</div>

		<div id="panel-arcade" role="tabpanel" aria-labelledby="tab-arcade" hidden={view !== 'arcade'}>
			{@render tabHide('arcade')}
			<div class="mt-2"><ArcadePage onSquad={goSquad} /></div>
		</div>

		<div id="panel-mayhem" role="tabpanel" aria-labelledby="tab-mayhem" hidden={view !== 'mayhem'}>
			{@render tabHide('mayhem')}
			<div class="mt-2"><MayhemPage active={view === 'mayhem'} /></div>
		</div>

		<!-- Every box here has its own "Hide" (an edge tab on its top-right corner, HideButton; 2026-11-20). A hidden
		     box is only `hidden`, never removed: SyncPanel and the rest start in onMount and keep running. -->
		<div id="panel-grind" role="tabpanel" aria-labelledby="tab-grind" hidden={view !== 'grind'}>
		<!-- the green radar with the latest COD news (its Hide sits in the radar's own row) -->
		<div class="compact-hide mt-5" hidden={hidden.is('news')}><NewsBanner /></div>

		<!-- the season countdown: day of the season, its end, what's coming (2026-11-11) -->
		<div class="compact-hide relative mt-4" hidden={hidden.is('season')}><SeasonStrip /><HideButton id="season" /></div>

		<!-- overall progress and the next milestone -->
		<div class="relative mt-4" hidden={hidden.is('kpi')}><KpiBar /><HideButton id="kpi" /></div>

		<!-- the camo list: search + filters, the class meta, the weapons (its Hide is in the search row) -->
		<div hidden={hidden.is('camos')}>
		<!-- 4. search and filters (Ranked prep had a switch here until 2026-11-20; it's a page tab now) -->
		<div id="weapons" class="mt-6 scroll-mt-4">
			<Toolbar bind:query shown={shownCount} total={WEAPONS.length} onclear={clearFilters} />
		</div>

		<!-- the picked class's meta top 5, above its weapons -->
		{#if progress.prefs.classFilter}
			<div class="compact-hide mt-4" hidden={hidden.is('classMeta')}><ClassMeta classId={progress.prefs.classFilter} /></div>
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
		</div>

		<!-- 6. Divergence and Mastery (each mode's box has its own Hide inside MasterySection) -->
		<div class="mastery-wrap relative mt-7" hidden={hidden.is('mastery')}><MasterySection /><HideButton id="mastery" /></div>

		<!-- 7. news and everything else. "Absolute meta" (the top 3 with their classes, 2026-11-22) right above
		     Meta top 5; the two share their Multiplayer / Warzone switch -->
		<div class="compact-hide relative mt-7" hidden={hidden.is('metaTop')}><MetaPodium /><HideButton id="metaTop" /></div>
		<div class="compact-hide relative mt-7" hidden={hidden.is('meta')}><MetaSection /><HideButton id="meta" /></div>

		<!-- sights: least visual recoil + the best sight per gun (2026-11-22, right under Meta top 5) -->
		<div class="compact-hide relative mt-7" hidden={hidden.is('sights')}><SightsSection /><HideButton id="sights" /></div>

		<!-- the banners share one height (the user's ask: "same size so they look in proportion"); each one
		     can be hidden on its own, all of them hidden = no gap left here -->
		<div class="abscar-only compact-hide mt-7" hidden={BANNERS.every((b) => hidden.is(b.id))}>
			<PhotoGallery pics={BANNERS} />
		</div>

		<div class="relative mt-7" hidden={hidden.is('sync')}><SyncPanel /><HideButton id="sync" /></div>
		</div>

		<footer class="compact-hide mt-7 flex items-start gap-3 text-xs text-muted" hidden={hidden.is('help')}>
			<div class="grid min-w-0 flex-1 gap-1.5">
				<p>{t.help.howTo}</p>
				<p>{t.help.divergence(DIVERGENCE_REQUIRED)}</p>
				<p>{t.help.sources}</p>
			</div>
			<HideButton id="help" inline class="mt-px" />
		</footer>
	</main>
</div>

<Toast />

<!-- the net_graph: a small load readout at the top left, PC only (2026-11-20) -->
<NetGraph />

<LoadoutDialog />

<WeaponSheet />

<!-- Abscar extras: kill feed, the Divergence flash and the boot text (decoration, aria-hidden) -->
<KillFeed />
<ShopExtras />
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
	/* Abscar: the Mastery box's Hide moves left of the round nuke badge in its top-right corner */
	:global([data-theme='blackout']) .mastery-wrap {
		--hb-right: 72px;
	}

	/*
	 * The page tabs under the header. Since 2026-11-21 (the user: "snygga till flikarna … gör dom tydligt vilken
	 * som är vilken") each has its own picture (PageTabIcon) and colour (--tc, TAB_COLOR): a coloured top edge and
	 * a faint tint on every tab; the open one stands taller, filled with its colour and glowing, and the line under
	 * the row (--sel) takes its colour, so it reads as one folder with the page under it.
	 */
	.page-tabs {
		container: pagetabs / inline-size;
		align-items: flex-end;
		border-bottom: 3px solid var(--sel, var(--t-accent));
	}
	.page-tab {
		position: relative;
		display: inline-flex;
		flex: 1 1 auto; /* side by side they share the row's spare width, so the row reaches the right edge */
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		white-space: nowrap;
		min-height: 2.75rem;
		padding: 0 1rem 0 0.75rem;
		border: 1.5px solid color-mix(in srgb, var(--tc) 40%, var(--t-line));
		border-bottom: 0;
		border-radius: 10px 10px 0 0;
		background: color-mix(in srgb, var(--tc) 8%, var(--t-panel));
		box-shadow: inset 0 3px 0 color-mix(in srgb, var(--tc) 75%, transparent);
		color: var(--t-muted);
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		transition:
			background-color 0.15s,
			color 0.15s;
	}
	.page-tab :global(.pt-icon) {
		color: var(--tc);
		opacity: 0.8;
		transition:
			transform 0.15s,
			opacity 0.15s;
	}
	.page-tab:hover {
		background: color-mix(in srgb, var(--tc) 16%, var(--t-panel));
		color: var(--t-fg);
	}
	.page-tab:hover :global(.pt-icon) {
		opacity: 1;
		transform: translateY(-1px) rotate(-6deg);
	}
	.page-tab[aria-selected='true'] {
		min-height: 3.125rem; /* the open tab stands taller than the rest */
		border: 2px solid var(--tc);
		border-bottom: 0;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--tc) 34%, var(--t-panel)),
			color-mix(in srgb, var(--tc) 12%, var(--t-panel))
		);
		box-shadow:
			inset 0 4px 0 var(--tc),
			0 -3px 18px -4px color-mix(in srgb, var(--tc) 70%, transparent);
		color: var(--t-fg);
	}
	.page-tab[aria-selected='true'] :global(.pt-icon) {
		opacity: 1;
		transform: scale(1.14);
		filter: drop-shadow(0 0 5px color-mix(in srgb, var(--tc) 75%, transparent));
		animation: pt-pop 0.35s ease-out;
	}
	@keyframes pt-pop {
		0% {
			transform: scale(0.85);
		}
		60% {
			transform: scale(1.3) rotate(-8deg);
		}
		100% {
			transform: scale(1.14);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.page-tab,
		.page-tab :global(.pt-icon) {
			transition: none;
		}
		.page-tab[aria-selected='true'] :global(.pt-icon) {
			animation: none;
		}
	}
	/* The Squad tab sits last and is lit up green even when closed (2026-11-22, the user: "lys upp den grönt så
	   den syns lite mer än dom andra"). A literal green, not --tc, so Steel / Matrix (which reset --tc) get it
	   too; the breathing glow is a pseudo-element's opacity, so it stays cheap. */
	.page-tab[data-tab='squad'] {
		border-color: #43d35e;
		background: linear-gradient(180deg, rgb(67 211 94 / 0.34), rgb(67 211 94 / 0.14));
		box-shadow:
			inset 0 3px 0 #43d35e,
			0 0 14px -2px rgb(67 211 94 / 0.65);
		color: #c9ffd3;
		text-shadow: 0 0 8px rgb(67 211 94 / 0.7);
	}
	.page-tab[data-tab='squad']::after {
		content: '';
		position: absolute;
		inset: -1px;
		border-radius: inherit;
		box-shadow: 0 0 22px 2px rgb(67 211 94 / 0.55);
		opacity: 0.25;
		pointer-events: none;
		animation: squad-tab-glow 2.4s ease-in-out infinite;
	}
	@keyframes squad-tab-glow {
		50% {
			opacity: 1;
		}
	}
	.page-tab[data-tab='squad'] :global(.pt-icon) {
		color: #43d35e;
		opacity: 1;
		filter: drop-shadow(0 0 4px rgb(67 211 94 / 0.8));
	}
	.page-tab[data-tab='squad']:hover {
		background: linear-gradient(180deg, rgb(67 211 94 / 0.46), rgb(67 211 94 / 0.2));
		color: #fff;
	}
	.page-tab[data-tab='squad'][aria-selected='true'] {
		border: 2px solid #5dff7a;
		border-bottom: 0;
		background: linear-gradient(180deg, rgb(67 211 94 / 0.6), rgb(67 211 94 / 0.24));
		box-shadow:
			inset 0 4px 0 #5dff7a,
			0 -3px 22px -2px rgb(67 211 94 / 0.85);
		color: #fff;
	}
	@media (prefers-reduced-motion: reduce) {
		.page-tab[data-tab='squad']::after {
			animation: none;
			opacity: 0.6;
		}
	}
	/* new radio messages on the Squad tab (red: the Squad tab itself is green now) */
	.tab-badge {
		display: inline-grid;
		place-items: center;
		min-width: 1.25rem;
		height: 1.25rem;
		margin-left: -0.15rem;
		padding: 0 4px;
		border: 1.5px solid #1b1124;
		border-radius: 999px;
		background: #ff3d5a;
		color: #fff;
		font-size: 11px;
		letter-spacing: 0;
	}
	/* a narrower row (container query on the row itself): the seven tabs share it equally, picture on top of the
	   name; a long name wraps onto two lines (BurgiCasino / BurgiShop at their soft hyphens). Side by side with
	   their pictures they need ≈ 1045 px, so this starts below 1060 px of row (a 1024 px window has 969). A tab is
	   never narrower than its longest word ("RANKED" broke as "RANKE / D" in an equal seventh at 375 px), so a few
	   px go from the others to it; break-word, not anywhere, or that minimum would count every letter as a break */
	/* (2026-11-22: BurgiArcade made it eight tabs, ≈ 1215 px side by side: more than the row ever gets, so the
	   row is always this way now; on phones the eight go in two rows of four, below) */
	@container pagetabs (max-width: 1239px) {
		.page-tab {
			flex: 1 1 0;
			flex-direction: column;
			gap: 3px;
			min-width: min-content;
			min-height: 3.5rem;
			padding: 6px 0.3rem 5px;
			font-size: 12.5px;
			line-height: 1.1;
			letter-spacing: 0.04em;
			white-space: normal;
			hyphens: auto;
			overflow-wrap: break-word;
		}
		.page-tab[aria-selected='true'] {
			min-height: 3.875rem;
		}
		.page-tab :global(.pt-icon) {
			width: 21px;
			height: 21px;
		}
		.tab-badge {
			position: absolute;
			top: 2px;
			right: 2px;
			min-width: 1.1rem;
			height: 1.1rem;
			margin: 0;
			font-size: 10px;
		}
	}
	/* the gap between tabs: a container can't style itself from its own query */
	@media (max-width: 1114px) {
		.page-tabs {
			gap: 4px;
		}
	}
	@media (max-width: 639px) {
		.page-tabs {
			gap: 3px;
			flex-wrap: wrap;
		}
	}
	@container pagetabs (max-width: 607px) {
		.page-tab {
			/* eight tabs on a phone (Squad Mayhem 2026-11-23): two rows of four, so the names stay readable */
			flex: 1 1 calc(25% - 3px);
			padding: 5px 1px 4px;
			border-radius: 8px 8px 0 0;
			font-size: 10.5px;
			letter-spacing: 0.01em;
		}
		.page-tab :global(.pt-icon) {
			width: 19px;
			height: 19px;
		}
	}

	/*
	 * The Abscar header (the user's asks, 2026-11-10): on the left the squad frame, right under it the
	 * HUD box + title, and under those the news buddy; the old TV on the right beside them. A grid
	 * only in this theme: the others keep the plain flex row with just the title (their hidden extras
	 * would leave empty grid gaps).
	 */
	/* the areas come from headerAreas() (--hdr-*), which leaves hidden parts out (2026-11-20) */
	:global([data-theme='blackout']) .abscar-header {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-areas: var(--hdr-phone, 'squad' 'title' 'tv' 'buddy');
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
			grid-template-columns: var(--hdr-mid-cols, minmax(0, 1fr) auto);
			grid-template-areas: var(--hdr-mid, 'squad squad' 'title tv' 'buddy tv');
		}
		:global([data-theme='blackout']) .hdr-tv {
			justify-self: end;
		}
	}
	/* wide enough for the squad frame (716 px) beside the TV too: the TV reaches up to the top right,
	   its antennas into the header's top padding, clear of the theme picker */
	@media (min-width: 1140px) {
		:global([data-theme='blackout']) .abscar-header {
			grid-template-columns: var(--hdr-wide-cols, minmax(0, 1fr) auto);
			grid-template-areas: var(--hdr-wide, 'squad tv' 'title tv' 'buddy tv');
		}
		:global([data-theme='blackout']) .hdr-tv {
			margin-top: -8px;
		}
	}
	/* a bigger TV + PS3 corner on PC (the user picked "between C and D" of four drafts, 2026-11-22): it
	   grows with the screen, and the header may use more width on big screens so the squad frame keeps
	   its room. The left column is taller than the TV, so the header never gets taller. zoom scales the
	   whole TV (the YouTube player too); its Hide pill is zoomed back to its normal size. */
	@media (min-width: 1140px) {
		:global([data-theme='blackout']) .hdr-tv {
			--tvz: 1.2;
			zoom: var(--tvz);
		}
		:global([data-theme='blackout']) .hdr-tv :global(.hide-btn) {
			zoom: calc(1 / var(--tvz));
		}
		:global([data-theme='blackout']) .abscar-header {
			max-width: 1600px;
		}
	}
	@media (min-width: 1240px) {
		:global([data-theme='blackout']) .hdr-tv {
			--tvz: 1.4;
		}
	}
	@media (min-width: 1400px) {
		:global([data-theme='blackout']) .hdr-tv {
			--tvz: 1.65;
		}
	}
	@media (min-width: 1700px) {
		:global([data-theme='blackout']) .hdr-tv {
			--tvz: 1.9;
		}
	}
</style>
