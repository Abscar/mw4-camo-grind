<!--
	Theme picker, tucked away in the header's top-right corner: a small swatch button that opens a
	menu with the four looks. Closes on pick, outside click or Escape.
	The menu stays in the page while closed (just `hidden`), so its buttons always exist.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { THEMES } from '#lib/themes.ts';

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

<div class="relative" bind:this={root}>
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
