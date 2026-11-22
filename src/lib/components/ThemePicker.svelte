<!--
	Theme picker, tucked away in the header's top-right corner: a small swatch button that opens a
	menu with the four looks. Closes on pick, outside click or Escape.
	The menu stays in the page while closed (just `hidden`), so its buttons always exist.
	In one row with it (2026-11-10): the Compact mode button and the sound-effects on/off button
	(sound.svelte.ts; sound never starts by itself). Since 2026-11-20 the Battery saver button
	(motion.svelte.ts) in the old pause button's place: a battery, with a leaf while on. The menu also
	switches the net_graph (NetGraph.svelte, PC only).
-->
<script lang="ts">
	import { hidden } from '#lib/hidden.svelte.ts';
	import { t } from '#lib/i18n/en.ts';
	import { motion } from '#lib/motion.svelte.ts';
	import { netGraph } from '#lib/netGraph.svelte.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { THEMES } from '#lib/themes.ts';
	import { toast } from '#lib/toast.svelte.ts';

	// the on/off settings are read after load, so the prerendered page and the first render match
	$effect(() => sound.load());
	$effect(() => motion.load());
	// Battery saver turned itself on (low battery, Data Saver, reduced motion): say so once
	$effect(() => {
		if (motion.auto) toast.show(t.saver.auto[motion.auto], undefined, 9000);
	});

	const menuId = $props.id();
	let open = $state(false);
	let root: HTMLDivElement | undefined = $state();
	let toggle: HTMLButtonElement | undefined = $state();

	const current = $derived(THEMES.find((x) => x.id === progress.prefs.theme) ?? THEMES[0]);
	const swatch = (s: readonly [string, string]) => `linear-gradient(135deg, ${s[0]} 50%, ${s[1]} 50%)`;

	$effect(() => {
		if (!open) return;
		const onPointer = (e: PointerEvent) => {
			if (root && !root.contains(e.target as Node)) open = false;
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				open = false;
				toggle?.focus();
			}
		};
		document.addEventListener('pointerdown', onPointer);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('pointerdown', onPointer);
			document.removeEventListener('keydown', onKey);
		};
	});
</script>

<div class="relative flex items-center min-[421px]:gap-0.5" bind:this={root}>
	<!-- refresh: loads the page again (the user's ask, 2026-11-22); ticks are already saved -->
	<button
		type="button"
		class="refresh-btn grid size-11 place-items-center rounded-full text-band-muted opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100"
		aria-label={t.refresh.label}
		title={t.refresh.title}
		onclick={() => location.reload()}
	>
		<svg class="sound-icon size-5" viewBox="0 0 24 24" aria-hidden="true">
			<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
				<path d="M19.8 4.2v4.6h-4.6" />
			</g>
		</svg>
	</button>

	<!-- compact mode between matches (saved per device; app.html applies it before the first paint) -->
	<button
		type="button"
		class="font-head inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold text-band-muted opacity-75 transition-opacity hover:opacity-100 focus-visible:opacity-100 aria-pressed:text-band-fg aria-pressed:opacity-100"
		aria-pressed={progress.prefs.compact}
		title={progress.prefs.compact ? t.compact.on : t.compact.off}
		onclick={() => progress.setPref('compact', !progress.prefs.compact)}
	>
		<svg viewBox="0 0 16 16" class="size-4 flex-none" aria-hidden="true" focusable="false">
			<path d="M2.5 4h11M2.5 8h11M2.5 12h11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
			{#if progress.prefs.compact}<path d="M2.5 4h11" stroke="currentColor" stroke-width="3" stroke-linecap="round" />{/if}
		</svg>
		<!-- the word only from 768 px: below that the row needs the room (icon + tooltip + label stay) -->
		<span class="max-md:sr-only">{t.compact.short}</span>
	</button>

	<button
		bind:this={toggle}
		type="button"
		class="grid size-11 place-items-center rounded-full text-band-muted opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
		aria-expanded={open}
		aria-controls={menuId}
		aria-label={t.theme.current(current.name)}
		title={t.theme.label}
		onclick={() => (open = !open)}
	>
		<span
			class="size-[18px] rounded-full shadow-[0_0_0_1.5px_currentColor]"
			style:background={swatch(current.swatch)}
			aria-hidden="true"
		></span>
	</button>

	<button
		type="button"
		class="grid size-11 place-items-center rounded-full text-band-muted opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 aria-pressed:opacity-100"
		aria-pressed={sound.on}
		aria-label={t.sound.label}
		title={sound.on ? t.sound.on : t.sound.off}
		onclick={() => sound.set(!sound.on)}
	>
		<svg class="sound-icon size-5" viewBox="0 0 24 24" aria-hidden="true">
			<path d="M3.5 9.2h3.8L12.6 5v14l-5.3-4.2H3.5z" fill="currentColor" />
			<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				{#if sound.on}
					<path d="M15.6 9.4a3.7 3.7 0 0 1 0 5.2" />
					<path d="M18.2 6.8a7.4 7.4 0 0 1 0 10.4" />
				{:else}
					<path d="M16 9.5l5 5M21 9.5l-5 5" />
				{/if}
			</g>
		</svg>
	</button>

	<!-- Battery saver (motion.svelte.ts; the old pause button's place): a battery, green with a leaf while on -->
	<button
		type="button"
		class="saver-btn grid size-11 place-items-center rounded-full text-band-muted opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 aria-pressed:opacity-100"
		aria-pressed={motion.still}
		aria-label={t.saver.label}
		title={motion.still ? t.saver.on : t.saver.off}
		onclick={() => {
			motion.set(!motion.still);
			toast.show(motion.still ? t.saver.onToast : t.saver.offToast);
		}}
	>
		<svg class="sound-icon size-5" viewBox="0 0 24 24" aria-hidden="true">
			<rect x="2.5" y="7" width="17" height="10" rx="2.2" fill="none" stroke="currentColor" stroke-width="2" />
			<rect x="20.2" y="10" width="2" height="4" rx="0.8" fill="currentColor" />
			{#if motion.still}
				<path d="M6 14.6c0-3.6 2.6-5.6 8.6-5.6-.2 4.8-2.6 6.4-5.2 6.4-1.1 0-2-.3-2.6-.8M7.2 14.2c1.6-1.6 3.4-2.6 5.4-3.2" fill="currentColor" stroke="currentColor" stroke-width="0.6" stroke-linecap="round" />
			{:else}
				<rect x="5" y="9.5" width="3" height="5" rx="0.6" fill="currentColor" />
				<rect x="9.5" y="9.5" width="3" height="5" rx="0.6" fill="currentColor" />
				<rect x="14" y="9.5" width="3" height="5" rx="0.6" fill="currentColor" />
			{/if}
		</svg>
	</button>

	<div
		id={menuId}
		class="absolute top-12 right-0 z-40 grid min-w-52 gap-1 rounded-card border border-line bg-panel p-1.5 text-fg shadow-[0_14px_34px_rgb(0_0_0/0.4)]"
		role="group"
		aria-label={t.theme.label}
		hidden={!open}
	>
		{#each THEMES as theme (theme.id)}
			{@const on = progress.prefs.theme === theme.id}
			<button
				type="button"
				class="font-head flex min-h-11 items-center gap-2.5 rounded-[calc(var(--t-radius)+2px)] px-3 text-left text-[13px] font-semibold transition-colors {on
					? 'bg-accent text-on-accent'
					: 'hover:bg-panel-2'}"
				aria-pressed={on}
				title={theme.name}
				onclick={() => {
					progress.setPref('theme', theme.id);
					open = false;
				}}
			>
				<span
					class="size-4 flex-none rounded-full shadow-[inset_0_0_0_1px_rgb(127_127_127/0.4)]"
					style:background={swatch(theme.swatch)}
					aria-hidden="true"
				></span>
				{theme.name}
			</button>
		{/each}
		<!-- the "What to show" list (HiddenBar, 2026-11-20): reachable here before anything is hidden -->
		<hr class="mx-1 my-0.5 border-line" />
		<button
			type="button"
			class="font-head flex min-h-11 items-center gap-2.5 rounded-[calc(var(--t-radius)+2px)] px-3 text-left text-[13px] font-semibold transition-colors hover:bg-panel-2"
			onclick={() => {
				open = false;
				toggle?.focus();
				hidden.listOpen = true;
			}}
		>
			<svg viewBox="0 0 24 24" class="size-4 flex-none" aria-hidden="true" focusable="false"
				><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
					><path d="M2.8 12S6.3 5.8 12 5.8 21.2 12 21.2 12 17.7 18.2 12 18.2 2.8 12 2.8 12Z" /><circle cx="12" cy="12" r="2.7" /><path
						d="M4.5 19.5 19.5 4.5"
					/></g
				></svg
			>
			{t.hide.menuEntry}
		</button>
		<!-- the net_graph (NetGraph.svelte): only on a PC (a mouse and a wide screen), like the readout itself -->
		<button
			type="button"
			class="ng-entry font-head min-h-11 items-center gap-2.5 rounded-[calc(var(--t-radius)+2px)] px-3 text-left text-[13px] font-semibold transition-colors hover:bg-panel-2"
			aria-pressed={netGraph.on}
			onclick={() => netGraph.set(!netGraph.on)}
		>
			<svg viewBox="0 0 24 24" class="size-4 flex-none" aria-hidden="true" focusable="false"
				><path d="M3 20V4M3 20h18M6 15l4-5 3 3 5-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg
			>
			<span class="flex-1">{t.netGraph.menu}</span>
			<span class="text-[11px] opacity-75">{netGraph.on ? 'ON' : 'OFF'}</span>
		</button>
	</div>
</div>

<style>
	/* Abscar: a dark halo so the speaker and pause icons stay readable on the busy Damascus header */
	:global([data-theme='blackout']) .sound-icon {
		filter: drop-shadow(0 0 1.5px rgb(0 0 0 / 0.9)) drop-shadow(0 1px 2px rgb(0 0 0 / 0.6));
	}
	/* Battery saver on: the battery turns green (the leaf + the word in the tooltip say it too) */
	.saver-btn[aria-pressed='true'] {
		color: var(--t-ok);
	}
	/* the net_graph row only where the readout can show: a mouse and at least 1024 px */
	.ng-entry {
		display: none;
	}
	@media (hover: hover) and (pointer: fine) and (min-width: 1024px) {
		.ng-entry {
			display: flex;
		}
	}
</style>
