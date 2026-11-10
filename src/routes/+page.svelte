<script lang="ts">
	import { onMount } from 'svelte';
	import { clearLinkFromAddress, linkCodeInAddress } from '#lib/browser.ts';
	import { DIVERGENCE_REQUIRED, LADDER, MAX_LEVEL } from '#lib/data/camos.ts';
	import { CLASSES, WEAPONS } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { decodeLink, sameProgress, type ProgressData } from '#lib/progress-codec.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { THEMES } from '#lib/themes.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import AbscarFx from '#lib/components/AbscarFx.svelte';
	import ClassSection from '#lib/components/ClassSection.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import HudReadout from '#lib/components/HudReadout.svelte';
	import DamascusSteel from '#lib/components/DamascusSteel.svelte';
	import NewsBuddy from '#lib/components/NewsBuddy.svelte';
	import NewsBanner from '#lib/components/NewsBanner.svelte';
	import hotrodCamo from '#lib/assets/hotrod-camo.webp';
	import KpiBar from '#lib/components/KpiBar.svelte';
	import LoadoutDialog from '#lib/components/LoadoutDialog.svelte';
	import OperatorTag from '#lib/components/OperatorTag.svelte';
	import MasterySection from '#lib/components/MasterySection.svelte';
	import CyborgBanner from '#lib/components/CyborgBanner.svelte';
	import SquadBanner from '#lib/components/SquadBanner.svelte';
	import SyncPanel from '#lib/components/SyncPanel.svelte';
	import ThemePicker from '#lib/components/ThemePicker.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import Toolbar from '#lib/components/Toolbar.svelte';
	import FocusSection from '#lib/components/FocusSection.svelte';
	import WeaponSheet from '#lib/components/WeaponSheet.svelte';
	import KillFeed from '#lib/components/KillFeed.svelte';
	import DivergenceUnlock from '#lib/components/DivergenceUnlock.svelte';
	import BootSequence from '#lib/components/BootSequence.svelte';

	let query = $state('');
	const needle = $derived(query.trim().toLowerCase());

	const sections = $derived(
		CLASSES.map((cls, i) => {
			const classHit =
				needle !== '' &&
				(cls.name.toLowerCase().includes(needle) || cls.short.toLowerCase() === needle);
			const visible = cls.weapons.filter(
				(w) =>
					(needle === '' || classHit || w.name.toLowerCase().includes(needle)) &&
					!(progress.prefs.hideMaxed && progress.level(w.id) >= MAX_LEVEL)
			);
			return { cls, number: i + 1, visible };
		}).filter(
			(s) =>
				(progress.prefs.classFilter === null || s.cls.id === progress.prefs.classFilter) &&
				(needle === '' || s.visible.length > 0)
		)
	);

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

	// ----- theme on <html> -----

	$effect(() => {
		if (!progress.ready) return; // keep the theme app.html applied until saved prefs are read
		const theme = THEMES.find((x) => x.id === progress.prefs.theme) ?? THEMES[0];
		document.documentElement.setAttribute('data-theme', theme.id);
		document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.browserBar);
	});
</script>

<svelte:head>
	<title>{t.pageTitle}</title>
	<noscript><style>.app-gate { opacity: 1 !important; }</style></noscript>
</svelte:head>

<AbscarFx />

<div class="app-gate" class:ready={progress.ready}>
	<div class="relative bg-band text-band-fg">
		<div class="abscar-only"><DamascusSteel /></div>
		<div class="abscar-only" aria-hidden="true"><div class="hud-vision"></div></div>
		<header
			class="relative mx-auto flex max-w-[1240px] flex-wrap items-stretch justify-between gap-4 px-4 pt-6 pb-5 sm:px-5 sm:pt-8"
		>
			<div class="absolute top-2 right-2 z-[3] sm:top-3 sm:right-3"><ThemePicker /></div>
			<div class="relative z-[1] flex min-w-0 flex-col justify-between pr-10 sm:pr-0">
				<div>
					<OperatorTag />
					<div class="mb-5"><HudReadout /></div>
				</div>
				<div>
				<h1 class="font-head text-[clamp(28px,7vw,42px)] leading-none font-bold tracking-wide uppercase">
					<span class="brand-glow text-brand">{t.title.game}</span><span
						class="mx-[0.3em] font-normal text-band-muted"
						aria-hidden="true">//</span
					><span class="sr-only"> </span><span class="title-skin">{t.title.app}</span>
				</h1>
				</div>
			</div>
			<div class="relative z-[1] flex flex-col items-start justify-between gap-4 sm:items-end">
				<div class="abscar-only sm:pr-12"><NewsBuddy /></div>
			</div>
		</header>
		<div class="abscar-only"><div class="damascus-floor"></div></div>
	</div>

	<main class="mx-auto max-w-[1240px] px-4 pb-8 sm:px-5" style:--hotrod-tile="url({hotrodCamo})">
		<div class="mt-5"><NewsBanner /></div>

		<div class="mt-4"><KpiBar /></div>

		<div class="mt-6"><Toolbar bind:query /></div>

		{#if progress.ready && progress.prefs.focus.length === 0 && Object.keys(progress.notes).length === 0}
			<p class="mt-3 text-[13px] text-muted">{t.focus.tip}</p>
		{/if}

		{#if sections.length > 0 || progress.prefs.focus.length > 0}
			<!-- the focus list is the first box; search, class filter and "hide maxed" don't touch it -->
			<div class="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4">
				{#if progress.prefs.focus.length > 0}<FocusSection />{/if}
				{#each sections as s (s.cls.id)}
					<ClassSection cls={s.cls} number={s.number} visible={s.visible} />
				{/each}
			</div>
		{/if}
		{#if sections.length === 0}
			{@const cls = CLASSES.find((c) => c.id === progress.prefs.classFilter)}
			<div class="mt-4 rounded-card bg-panel px-4 py-6 text-center shadow-card">
				<p class="text-muted">
					{cls ? t.empty.noMatchInClass(query.trim(), cls.name) : t.empty.noMatch(query.trim())}
				</p>
				<button
					type="button"
					class="font-head mt-3 min-h-11 rounded-full border border-accent px-4 text-[13px] font-semibold text-fg"
					onclick={() => {
						query = '';
						progress.setPref('classFilter', null);
					}}>{t.empty.showAll}</button
				>
			</div>
		{/if}

		<div class="mt-7"><MasterySection /></div>

		<div class="abscar-only mt-7">
			<div class="overflow-hidden rounded-card shadow-card"><SquadBanner /></div>
			<div class="mt-4 h-[clamp(190px,38vw,470px)] overflow-hidden rounded-card shadow-card"><CyborgBanner /></div>
		</div>

		<div class="mt-7"><SyncPanel /></div>

		<footer class="mt-7 grid gap-1.5 text-xs text-muted">
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

<Dialog bind:open={linkDialogOpen} title={t.linkImport.title}>
	{#if linkOffer}
		<p>{t.linkImport.body(summary(linkOffer), summary(progress.snapshot()))}</p>
	{/if}
	{#snippet actions()}
		<button
			type="button"
			class="font-head min-h-11 rounded-full border border-line bg-panel-2 px-4 text-[13px] font-semibold"
			onclick={() => (linkDialogOpen = false)}>{t.linkImport.keep}</button
		>
		<button
			type="button"
			class="font-head min-h-11 rounded-full border border-accent bg-accent px-4 text-[13px] font-semibold text-on-accent"
			onclick={() => linkOffer && applyLink(linkOffer)}>{t.linkImport.use}</button
		>
	{/snippet}
</Dialog>
