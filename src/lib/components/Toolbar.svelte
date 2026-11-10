<!--
	Search and filters above the weapon list: search, "hide maxed", the class buttons, the status
	buttons (filters.ts says what each one means; the chosen one's meaning shows under the row), how
	many weapons match, and "Clear filters". Not sticky, so nothing covers the list on a phone; the
	button rows scroll sideways there instead of wrapping into a tall block.
-->
<script lang="ts">
	import { CLASSES } from '#lib/data/weapons.ts';
	import { STATUS_FILTERS } from '#lib/filters.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	// the user's own blunt picture (Abscar theme: every class button is drawn as this blunt)
	import bluntPic from '#lib/assets/blunt.webp';
	// the user's own white holk picture lying in an ashtray, end of the search row (Abscar only)
	import HolkAshtray from './HolkAshtray.svelte';

	let {
		query = $bindable(''),
		shown,
		total,
		onclear
	}: { query: string; shown: number; total: number; onclear: () => void } = $props();

	const chips = [{ id: null, label: t.toolbar.allClasses }, ...CLASSES.map((c) => ({ id: c.id, label: c.short }))];
	const filtered = $derived(
		query.trim() !== '' || progress.prefs.classFilter !== null || progress.prefs.status !== null || progress.prefs.hideMaxed
	);
	const status = $derived(progress.prefs.status);
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

		<span class="compact-hide contents"><HolkAshtray /></span>
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

	<div class="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={t.toolbar.statusFilter}>
		{#each STATUS_FILTERS as f (f)}
			{@const on = status === f}
			<button
				type="button"
				class="chip status-chip flex-none"
				aria-pressed={on}
				title={t.toolbar.statusHelp[f]}
				onclick={() => progress.setPref('status', on ? null : f)}
				>{#if f === 'focus'}<span aria-hidden="true">★</span>{/if}{t.toolbar.status[f]}</button
			>
		{/each}
	</div>

	<div class="flex flex-wrap items-center gap-x-4 gap-y-1">
		<p class="num text-[13px] font-semibold text-fg" role="status">{t.toolbar.results(shown, total)}</p>
		{#if filtered}
			<button type="button" class="btn btn-sm" onclick={onclear}>
				<svg viewBox="0 0 16 16" class="size-3" aria-hidden="true"
					><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg
				>{t.toolbar.clear}
			</button>
		{/if}
		<p class="text-[12px] text-muted sm:ml-auto">{t.toolbar.legend}</p>
	</div>
	{#if status}
		<p class="-mt-1 text-[12.5px] text-muted"><b class="font-semibold text-fg">{t.toolbar.status[status]}:</b> {t.toolbar.statusHelp[status]}</p>
	{/if}
</div>
