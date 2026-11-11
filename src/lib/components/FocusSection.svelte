<!--
	"Continue grinding" (2026-11-10, the user's brief): the focus list, right under the progress
	overview, full width. Per pinned weapon: name and class, the G / P / HB boxes, the challenge(s)
	you're on with their exact text, a counter where the challenge can be counted, what's left, and
	the note. With nothing pinned: what this is for, and a few weapons to pin, each with the fact from
	your own progress that put it there (filters.ts `suggestions`), never a guess at what's quickest.
	Search, class and status filters don't touch it. The Hot Rod look in Abscar, like the class boxes.
-->
<script lang="ts">
	import { tickLadder } from '#lib/actions.ts';
	import { LADDER, MAX_LEVEL } from '#lib/data/camos.ts';
	import { CLASSES, WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { suggestions, type SuggestReason } from '#lib/filters.ts';
	import { t } from '#lib/i18n/en.ts';
	import { FOCUS_MAX } from '#lib/progress-codec.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { activeSteps } from '#lib/steps.ts';
	import { weaponSheet } from '#lib/weaponSheet.svelte.ts';
	import AbscarOperator from './AbscarOperator.svelte';
	import CamoToggle from './CamoToggle.svelte';
	import StepRow from './StepRow.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	const weapons = $derived(progress.prefs.focus.flatMap((id) => WEAPON_BY_ID.get(id) ?? []));
	const className = (id: string) => CLASSES.find((c) => c.id === id)?.name ?? '';
	const ideas = $derived(
		progress.ready && weapons.length === 0
			? suggestions(
					{ weapons: progress.weapons, specials: progress.specials, counts: {}, focus: progress.prefs.focus },
					progress.divergenceCount
				)
			: []
	);

	function reasonText(r: SuggestReason): string {
		switch (r.kind) {
			case 'goldReady':
				return t.focus.reason.goldReady;
			case 'counter':
				return t.focus.reason.counter(r.step, r.count, r.target);
			case 'lastCamo':
				return t.focus.reason.lastCamo(r.divergenceLeft, r.season1);
			case 'preGold':
				return t.focus.reason.preGold(r.done, r.total);
		}
	}
</script>

<section
	id="continue"
	class="class-card weapon-class focus-card overflow-hidden rounded-card bg-panel shadow-card"
	style:--c="var(--t-accent)"
	aria-labelledby="focus-heading"
>
	<header class="class-head flex flex-wrap items-center gap-x-2.5 gap-y-1 px-4 py-3">
		<span class="focus-star-big text-lg leading-none" aria-hidden="true">★</span>
		<h2 id="focus-heading" class="class-title font-head flex-1 text-[15px] font-bold tracking-wide uppercase">
			{t.focus.heading}
		</h2>
		{#if weapons.length > 0}
			<span class="font-head num text-xs font-bold">{t.focus.sub(weapons.length, FOCUS_MAX)}</span>
		{/if}
		<!-- Abscar: his operator lighting the holk with his thumb (2026-11-11, one of three around the page) -->
		<div class="abscar-only compact-hide section-op -my-2 flex-none"><AbscarOperator variant="lighter" smoke={0.45} class="size-[68px]" /></div>
	</header>

	{#if weapons.length > 0}
		<ul class="grid grid-cols-[minmax(0,1fr)] gap-3 p-3 sm:p-4 md:grid-cols-[repeat(2,minmax(0,1fr))]">
			{#each weapons as weapon (weapon.id)}
				{@const level = progress.level(weapon.id)}
				{@const steps = activeSteps(weapon.id, level, progress.specials[weapon.id] ?? 0)}
				{@const look = WEAPON_LOOKS[weapon.id]}
				{@const note = progress.note(weapon.id)}
				<li class="grind-card grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 rounded-card p-3">
					<div class="flex flex-wrap items-start gap-2">
						<button
							type="button"
							class="weapon-open flex min-h-11 min-w-[11rem] flex-1 items-center gap-2 text-left"
							aria-haspopup="dialog"
							onclick={() => weaponSheet.show(weapon.id)}
						>
							{#if look}<span class="compact-hide flex-none"><WeaponIcon {look} /></span>{/if}
							<span class="min-w-0">
								<span class="weapon-name block truncate font-semibold">{weapon.name}</span>
								<span class="block text-[12px] text-muted">{className(weapon.classId)}</span>
							</span>
							<span class="sr-only">– {t.weapon.openHint}</span>
						</button>
						<div class="flex flex-none gap-1.5">
							{#each LADDER as camo, i (camo.id)}
								<CamoToggle
									{camo}
									pressed={progress.has(weapon.id, i)}
									weaponName={weapon.name}
									ontoggle={() => tickLadder(weapon.id, i)}
								/>
							{/each}
						</div>
					</div>

					{#if level >= MAX_LEVEL}
						<p class="text-[13px] font-semibold text-fg">{t.focus.maxed}</p>
					{:else if steps.length > 0}
						<div class="grid gap-3">
							{#each steps as step (step.key)}
								<StepRow weaponId={weapon.id} {step} compact />
							{/each}
						</div>
					{/if}

					<div class="flex flex-wrap items-center gap-2 border-t border-line pt-2">
						<button
							type="button"
							class="weapon-note flex min-h-11 min-w-0 flex-1 items-center gap-1.5 rounded-[3px] px-1 text-left text-[12.5px] leading-snug"
							aria-haspopup="dialog"
							onclick={() => weaponSheet.show(weapon.id)}
						>
							<svg viewBox="0 0 16 16" class="size-3 flex-none" aria-hidden="true" focusable="false">
								<path d="M10.6 2.2l3.2 3.2-8.3 8.3-3.9.7.7-3.9zM9.4 3.4l3.2 3.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
							</svg>
							{#if note}<span class="line-clamp-2 min-w-0 break-words"
									><span class="sr-only">{t.weapon.editNote}: </span>{note}</span
								>{:else}<span class="not-italic">{t.focus.addNote}<span class="sr-only">: {weapon.name}</span></span>{/if}
						</button>
						<button type="button" class="btn btn-sm" onclick={() => progress.toggleFocus(weapon.id)}
							>{t.focus.unpin}<span class="sr-only"> {weapon.name}</span></button
						>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="grid gap-3 p-4">
			<div>
				<h3 class="font-head text-[15px] font-bold text-fg">{t.focus.emptyTitle}</h3>
				<p class="mt-1 max-w-3xl text-[13.5px] text-muted">{t.focus.emptyBody(FOCUS_MAX)}</p>
				<p class="mt-2 text-[13.5px] text-fg">{ideas.length > 0 ? t.focus.emptyHow : t.focus.emptyNone}</p>
			</div>
			{#if ideas.length > 0}
				<ul class="grid grid-cols-[minmax(0,1fr)] gap-2 md:grid-cols-[repeat(3,minmax(0,1fr))]">
					{#each ideas as idea (idea.weaponId)}
						{@const w = WEAPON_BY_ID.get(idea.weaponId)}
						{#if w}
							<li class="grind-card flex items-center gap-3 rounded-card p-3">
								<div class="min-w-0 flex-1">
									<button
										type="button"
										class="weapon-open block min-h-11 max-w-full text-left"
										aria-haspopup="dialog"
										onclick={() => weaponSheet.show(w.id)}
									>
										<span class="weapon-name inline-block max-w-full truncate font-semibold">{w.name}</span>
										<span class="block text-[12px] text-muted">{className(w.classId)}</span>
									</button>
									<p class="mt-1 text-[12.5px] leading-snug text-fg"><span class="sr-only">{t.focus.why}: </span>{reasonText(idea.reason)}</p>
								</div>
								<button type="button" class="btn btn-primary flex-none" aria-label={t.focus.pinLabel(w.name)} onclick={() => progress.toggleFocus(w.id)}
									>★ {t.focus.pin}</button
								>
							</li>
						{/if}
					{/each}
				</ul>
				<p class="text-[12px] text-muted">{t.focus.suggestNote}</p>
			{/if}
		</div>
	{/if}
</section>
