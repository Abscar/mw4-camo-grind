<!--
	The focus list: the weapons you're grinding right now (pinned from their weapon card), first in
	the grid of weapon boxes, with the next camo's challenge under each one. Not affected by search,
	class filter or "hide maxed". Looks like a weapon-class box (Hot Rod picture in Abscar).
-->
<script lang="ts">
	import { LADDER } from '#lib/data/camos.ts';
	import { WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { FOCUS_MAX } from '#lib/progress-codec.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { CAMO_INK } from '#lib/ui.ts';
	import WeaponCard from './WeaponCard.svelte';

	const columns = `minmax(0, 1fr) repeat(${LADDER.length}, 2.75rem)`;
	const weapons = $derived(progress.prefs.focus.flatMap((id) => WEAPON_BY_ID.get(id) ?? []));
</script>

<section
	class="class-card weapon-class focus-card flex flex-col overflow-hidden rounded-card bg-panel shadow-card"
	style:--c="var(--t-accent)"
	aria-labelledby="focus-heading"
>
	<header class="class-head flex items-center gap-2.5 px-4 py-3">
		<span class="focus-star-big text-lg leading-none" aria-hidden="true">★</span>
		<h2 id="focus-heading" class="class-title font-head flex-1 text-[15px] font-bold tracking-wide uppercase">
			{t.focus.heading}
		</h2>
		<span class="font-head text-xs font-bold tabular-nums">{t.focus.sub(weapons.length, FOCUS_MAX)}</span>
	</header>

	<div
		class="font-head grid items-center gap-1.5 border-t border-line px-4 pt-2 pb-1 text-[10.5px] font-bold tracking-[0.12em] text-muted uppercase"
		style:grid-template-columns={columns}
		aria-hidden="true"
	>
		<span>{t.weapon.column}</span>
		{#each LADDER as camo (camo.id)}
			<span class="text-center {CAMO_INK[camo.id]}">{camo.short}</span>
		{/each}
	</div>

	<ul class="flex-1 px-2 pb-2">
		{#each weapons as weapon (weapon.id)}
			<WeaponCard {weapon} {columns} classId={weapon.classId} showNext />
		{/each}
	</ul>

	<footer class="border-t border-line px-4 py-3 text-[13px] text-muted">{t.focus.howTo}</footer>
</section>
