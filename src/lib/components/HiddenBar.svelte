<!--
	Getting hidden parts back (2026-11-20, with the "Hide" buttons). A slim bar above the page tabs while
	anything is hidden ("3 parts hidden: … · Choose · Show all"), and the "What to show" list: every part
	with a switch, grouped like the page, plus "Only camos & metas" and "Show everything". The list also
	opens from the theme menu (ThemePicker), so it's there before anything is hidden.
	Abscar-only parts are listed only in that theme (the others don't draw them).
-->
<script lang="ts">
	import { hidden } from '#lib/hidden.svelte.ts';
	import { HIDE_GROUPS, HIDE_SECTIONS, PARENT, idsIn, onlyCamosMeta, type HideId } from '#lib/hideSections.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import Dialog from './Dialog.svelte';

	const NAMES_SHOWN = 3;
	const names = $derived(hidden.list().map((id) => t.hide.names[id]));
	const pictures = idsIn('pictures');
	const allPicturesHidden = $derived(pictures.every((id) => hidden.is(id)));

	/** Undo for the big changes (presets, Show all) */
	function replaceWithUndo(ids: HideId[], message: string) {
		const before = hidden.list();
		hidden.replace(ids);
		toast.show(message, { label: t.toast.undo, run: () => hidden.replace(before) });
	}

	function showAll() {
		replaceWithUndo([], t.hide.shownAllToast);
	}

	function setPictures(show: boolean) {
		for (const id of pictures) hidden.set(id, !show);
	}
</script>

{#if hidden.count > 0}
	<div class="hidden-bar mt-4 flex flex-wrap items-center gap-x-2 rounded-card border border-dashed border-line bg-panel px-3 text-[13px] text-muted" role="region" aria-label={t.hide.bar(hidden.count)}>
		<svg class="size-4 flex-none" viewBox="0 0 24 24" aria-hidden="true" focusable="false"
			><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
				><path d="M2.8 12S6.3 5.8 12 5.8 21.2 12 21.2 12 17.7 18.2 12 18.2 2.8 12 2.8 12Z" /><circle cx="12" cy="12" r="2.7" /><path
					d="M4.5 19.5 19.5 4.5"
				/></g
			></svg
		>
		<p class="min-w-0 flex-1 truncate py-1">
			<b class="font-semibold text-fg">{t.hide.bar(hidden.count)}</b><span class="max-sm:hidden"
				>: {names.slice(0, NAMES_SHOWN).join(', ')}{names.length > NAMES_SHOWN ? ` +${names.length - NAMES_SHOWN}` : ''}</span
			>
		</p>
		<div class="flex flex-none gap-1.5">
			<button id="hidden-choose" type="button" class="btn btn-sm hb-btn" aria-label={t.hide.chooseLabel} onclick={() => (hidden.listOpen = true)}
				>{t.hide.choose}</button
			>
			<button type="button" class="btn btn-sm hb-btn" onclick={showAll}>{t.hide.showAll}</button>
		</div>
	</div>
{/if}

<Dialog bind:open={hidden.listOpen} title={t.hide.title} class="hide-dlg m-auto rounded-card border border-line bg-panel p-0 text-fg shadow-2xl">
	{#snippet custom(titleId)}
		<div class="hd-head flex items-center gap-3 border-b border-line py-2 pr-2 pl-5">
			<h2 id={titleId} class="font-head flex-1 text-lg font-bold">{t.hide.title}</h2>
			<button type="button" class="icon-btn" aria-label={t.hide.close} title={t.hide.close} onclick={() => (hidden.listOpen = false)}>
				<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"
					><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" /></svg
				>
			</button>
		</div>

		<div class="hd-body px-5 pt-3 pb-4">
			<p class="text-sm text-muted">{t.hide.intro}</p>
			{#if progress.prefs.compact}<p class="mt-1.5 text-[12.5px] text-muted">{t.hide.compactNote}</p>{/if}
			<div class="mt-3 flex flex-wrap gap-2">
				<button type="button" class="btn btn-sm" onclick={() => replaceWithUndo(onlyCamosMeta(), t.hide.onlyCamosMetaToast)}
					>{t.hide.onlyCamosMeta}</button
				>
				<button type="button" class="btn btn-sm" disabled={hidden.count === 0} onclick={showAll}>{t.hide.showEverything}</button>
			</div>

			{#each HIDE_GROUPS as group (group)}
				{@const items = HIDE_SECTIONS.filter((s) => s.group === group)}
				<section class={['mt-4', items.every((s) => 'abscar' in s) && 'abscar-only']} aria-labelledby="hd-{group}">
					<h3 id="hd-{group}" class="font-head text-[12px] font-bold tracking-[0.12em] text-muted uppercase">{t.hide.groups[group]}</h3>
					<ul class="mt-1 divide-y divide-line">
						{#if group === 'pictures'}
							<li>{@render row('allPictures', t.hide.allPictures, !allPicturesHidden, (on) => setPictures(on), false, true)}</li>
						{/if}
						{#each items as s (s.id)}
							{@const parent = PARENT[s.id]}
							<li class={'abscar' in s && !items.every((x) => 'abscar' in x) ? 'abscar-only' : ''}>
								{@render row(
									s.id,
									t.hide.names[s.id],
									!hidden.is(s.id),
									(on) => hidden.set(s.id, !on),
									!!parent || group === 'pictures',
									false,
									parent ? hidden.is(parent) : false,
									t.hide.notes[s.id]
								)}
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>

		<div class="hd-foot flex justify-end border-t border-line px-5 py-3">
			<button type="button" class="btn btn-primary" onclick={() => (hidden.listOpen = false)}>{t.hide.done}</button>
		</div>
	{/snippet}
</Dialog>

{#snippet row(
	key: string,
	label: string,
	on: boolean,
	change: (on: boolean) => void,
	indent: boolean,
	strong: boolean,
	off = false,
	note?: string
)}
	<label class={['hd-row flex min-h-11 items-center gap-3 py-1.5 select-none', indent && 'pl-4', off && 'opacity-45']}>
		<span class="min-w-0 flex-1">
			<span class={['block text-[14px]', strong ? 'font-semibold text-fg' : 'text-fg']}>{label}</span>
			{#if note}<span class="block text-[12px] text-muted">{note}</span>{/if}
		</span>
		<input
			type="checkbox"
			role="switch"
			class="peer sr-only"
			data-hide={key}
			checked={on}
			disabled={off}
			onchange={(e) => change(e.currentTarget.checked)}
		/>
		<span
			class="relative h-6 w-10 flex-none rounded-full bg-track transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-panel after:shadow after:transition-transform peer-checked:after:translate-x-4"
			aria-hidden="true"
		></span>
	</label>
{/snippet}

<style>
	.hb-btn {
		margin-block: 3px;
		padding: 0 0.8rem;
	}
	/* a modal <dialog> is fixed with top/bottom 0: `fit-content` keeps it as tall as its content, the body scrolls */
	:global(dialog.hide-dlg) {
		width: min(32rem, calc(100vw - 2rem));
		height: fit-content;
		max-height: min(46rem, calc(100dvh - 2rem));
	}
	:global(dialog.hide-dlg[open]) {
		display: flex;
		flex-direction: column;
	}
	.hd-body {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
	}
</style>
