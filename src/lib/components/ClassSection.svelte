<script lang="ts">
	import { LADDER, MAX_LEVEL } from '#lib/data/camos.ts';
	import type { Weapon, WeaponClass } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { CAMO_INK, percent } from '#lib/ui.ts';
	import FactText from './FactText.svelte';
	import WeaponCard from './WeaponCard.svelte';

	let {
		cls,
		number,
		visible
	}: {
		cls: WeaponClass;
		/** 1-based position of the class in the data (drives its accent colour). */
		number: number;
		/** The weapons left after search / "hide maxed". */
		visible: Weapon[];
	} = $props();

	const columns = `minmax(0, 1fr) repeat(${LADDER.length}, 2.75rem)`;
	const total = $derived(cls.weapons.length);
	const counts = $derived(LADDER.map((_, i) => cls.weapons.filter((w) => progress.has(w.id, i)).length));
	const done = $derived(cls.weapons.reduce((sum, w) => sum + progress.level(w.id), 0));
	const pct = $derived(percent(done, total * MAX_LEVEL));
	const maxed = $derived(done === total * MAX_LEVEL);
	const headingId = $derived(`class-${cls.id}`);
</script>

<section
	class="class-card weapon-class flex flex-col overflow-hidden rounded-card bg-panel shadow-card"
	style:--c="var(--class-{number}, var(--t-accent))"
	aria-labelledby={headingId}
>
	<header class="class-head flex items-center gap-2.5 px-4 py-3">
		<span class="class-no font-head text-xs font-bold tracking-wider" aria-hidden="true"
			>{t.cls.number(number)}</span
		>
		<h2 id={headingId} class="class-title font-head flex-1 text-[15px] font-bold tracking-wide uppercase">
			{cls.name}
		</h2>
		<span class="font-head font-bold tabular-nums">{pct}%</span>
	</header>

	<div class="px-4 pt-1 pb-3">
		<div class="bar" style:--k="var(--c)"><i style:width="{pct}%"></i></div>
		<div class="font-head mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-xs font-semibold text-muted tabular-nums">
			{#each LADDER as camo, i (camo.id)}
				<span title={camo.name}
					>{camo.short} <b class="font-bold {CAMO_INK[camo.id]}">{counts[i]}/{total}</b></span
				>
			{/each}
			{#if maxed}
				<span class="ml-auto text-[11px] font-bold tracking-wider text-div-ink uppercase">{t.cls.maxed}</span>
			{/if}
		</div>
	</div>

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

	{#if visible.length > 0}
		<!-- flex-1: boxes in a row are equally tall; the list takes the extra room so the challenges sit at the bottom -->
		<ul class="flex-1 px-2 pb-2">
			{#each visible as weapon (weapon.id)}
				<WeaponCard {weapon} {columns} />
			{/each}
		</ul>
	{:else}
		<p class="flex-1 px-4 pt-1 pb-3 text-sm text-muted">{t.cls.allHidden}</p>
	{/if}

	<footer class="grid gap-1 border-t border-line px-4 py-3 text-[13px] text-muted">
		<h3 class="sr-only">{t.cls.challenges}</h3>
		{#each LADDER as camo (camo.id)}
			<div>
				<b class="font-head mr-1.5 text-[11px] font-bold tracking-wider uppercase {CAMO_INK[camo.id]}"
					>{camo.name}</b
				><FactText fact={cls.challenges[camo.id]} />
			</div>
		{/each}
	</footer>
</section>
