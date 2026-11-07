<script lang="ts">
	import { CLASSES } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	// the user's own blunt picture (Abscar theme: every class button is drawn as this blunt)
	import bluntPic from '#lib/assets/blunt.webp';

	let { query = $bindable('') }: { query: string } = $props();

	const chips = [{ id: null, label: t.toolbar.allClasses }, ...CLASSES.map((c) => ({ id: c.id, label: c.short }))];
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-x-5 gap-y-3">
		<label class="relative block min-w-0 flex-[1_1_240px] sm:max-w-sm">
			<span class="sr-only">{t.toolbar.search}</span>
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
				placeholder={t.toolbar.searchPlaceholder}
				autocomplete="off"
				spellcheck="false"
				class="h-11 w-full rounded-full border border-line bg-panel pr-4 pl-10 text-fg outline-none placeholder:text-muted focus:border-accent"
			/>
		</label>

		<label class="flex min-h-11 items-center gap-2.5 text-sm text-muted select-none">
			<input
				type="checkbox"
				class="peer sr-only"
				checked={progress.prefs.hideMaxed}
				onchange={(e) => progress.setPref('hideMaxed', e.currentTarget.checked)}
			/>
			<span
				class="relative h-6 w-10 flex-none rounded-full bg-track transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-panel after:shadow after:transition-transform peer-checked:after:translate-x-4"
				aria-hidden="true"
			></span>
			{t.toolbar.hideMaxed}
		</label>
	</div>

	<div
		class="class-chips no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
		role="group"
		aria-label={t.toolbar.classFilter}
		style:--blunt="url({bluntPic})"
	>
		{#each chips as chip (chip.id ?? 'all')}
			{@const on = progress.prefs.classFilter === chip.id}
			<button
				type="button"
				class="class-chip font-head min-h-11 flex-none rounded-full border px-4 text-[13px] font-semibold transition-colors {on
					? 'border-accent bg-accent text-on-accent'
					: 'border-line bg-panel text-muted hover:text-fg'}"
				aria-pressed={on}
				onclick={() => progress.setPref('classFilter', chip.id)}>{chip.label}</button
			>
		{/each}
	</div>
</div>
