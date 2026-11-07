<script lang="ts">
	import { DIVERGENCE, DIVERGENCE_REQUIRED, LADDER, SEASON_1_COUNTS_TOWARD_DIVERGENCE } from '#lib/data/camos.ts';
	import { WEAPONS } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { BRUSHED, FACETS } from '#lib/kpiCamos.ts';
	import { CAMO_FILL, CAMO_INK, percent } from '#lib/ui.ts';
	import HolkBurn from './HolkBurn.svelte';

	const total = WEAPONS.length;
	const divergenceShown = $derived(Math.min(progress.divergenceCount, DIVERGENCE_REQUIRED));
	const divergencePct = $derived(percent(divergenceShown, DIVERGENCE_REQUIRED));
	const toGo = $derived(DIVERGENCE_REQUIRED - progress.divergenceCount);
</script>

<section
	aria-label={t.kpi.label}
	class="grid grid-cols-2 gap-3 lg:grid-cols-4"
	style:--brushed={BRUSHED}
	style:--facets={FACETS}
>
	{#each LADDER as camo, i (camo.id)}
		{@const count = progress.ladderCounts[i]}
		{@const pct = percent(count, total)}
		<div
			class="kpi-tile hud-frame rounded-card border-t-[3px] bg-panel px-4 py-3.5 shadow-card"
			style:border-top-color={CAMO_FILL[camo.id]}
			style:--k={CAMO_FILL[camo.id]}
			data-camo={camo.id}
		>
			<h2 class="font-head text-[11px] font-bold tracking-[0.12em] uppercase {CAMO_INK[camo.id]}">
				{camo.name}
			</h2>
			<p class="font-head mt-1 mb-2.5 text-[26px] leading-tight font-bold tabular-nums sm:text-3xl">
				{count} <small class="text-base font-semibold text-muted">/ {total}</small>
			</p>
			<div class="bar"><i style:width="{pct}%"></i></div>
			<p class="mt-2 text-xs text-muted">{t.kpi.percentDone(pct)}</p>
		</div>
	{/each}

	<div
		class="kpi-tile hud-frame rounded-card border-t-[3px] bg-panel px-4 py-3.5 shadow-card"
		style:border-top-color="var(--t-div)"
		style:--k="var(--t-div)"
		data-camo="divergence"
	>
		<h2 class="font-head text-[11px] font-bold tracking-[0.12em] text-div-ink uppercase">
			{DIVERGENCE.name}
		</h2>
		<p class="font-head mt-1 mb-2.5 text-[26px] leading-tight font-bold tabular-nums sm:text-3xl">
			{divergenceShown} <small class="text-base font-semibold text-muted">/ {DIVERGENCE_REQUIRED}</small>
		</p>
		<div class="bar"><i style:width="{divergencePct}%"></i></div>
		<!-- Abscar: the bar is a cone joint that burns down toward 33 -->
		<div class="abscar-only"><HolkBurn done={divergenceShown} total={DIVERGENCE_REQUIRED} /></div>
		<p class="mt-2 text-xs text-muted">
			{#if progress.divergenceUnlocked}
				<span class="font-bold text-div-ink">✔ {t.kpi.divergenceUnlocked}</span>
			{:else}
				{t.kpi.divergenceToGo(toGo)}
			{/if}
			{#if !SEASON_1_COUNTS_TOWARD_DIVERGENCE}
				<br />{t.kpi.divergenceLaunchOnly}
			{/if}
		</p>
	</div>
</section>
