<!--
	Theme picker, tucked away in the header's top-right corner: a small swatch button that opens a
	menu with the four looks. Closes on pick, outside click or Escape.
	The menu stays in the page while closed (just `hidden`), so its buttons always exist.
	In one row with it (2026-11-10): the Compact mode button and the sound-effects on/off button
	(sound.svelte.ts; sound never starts by itself).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { THEMES } from '#lib/themes.ts';

	// the on/off setting is read after load, so the prerendered page and the first render match
	$effect(() => sound.load());

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

<div class="relative flex items-center gap-0.5" bind:this={root}>
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
		<span class="max-[420px]:sr-only">{t.compact.short}</span>
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

	<div
		id={menuId}
		class="absolute top-12 right-0 z-40 grid min-w-44 gap-1 rounded-card border border-line bg-panel p-1.5 text-fg shadow-[0_14px_34px_rgb(0_0_0/0.4)]"
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
	</div>
</div>

<style>
	/* Abscar: a dark halo so the speaker stays readable on the busy Damascus header */
	:global([data-theme='blackout']) .sound-icon {
		filter: drop-shadow(0 0 1.5px rgb(0 0 0 / 0.9)) drop-shadow(0 1px 2px rgb(0 0 0 / 0.6));
	}
</style>
