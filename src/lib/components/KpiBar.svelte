<!--
	The progress overview under the header: a tile per ladder camo (how many weapons have it) and
	Divergence (Harmonic Breaks toward the account-wide goal). Every number comes from the data.
	The box under the tiles (next milestone, camo steps, grind stats, "What do the numbers mean?")
	was removed 2026-11-11 at the user's ask; it's in git history if it's ever wanted back.
-->
<script lang="ts">
	import { DIVERGENCE, DIVERGENCE_REQUIRED, LADDER } from '#lib/data/camos.ts';
	import { WEAPONS } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { BRUSHED, FACETS } from '#lib/kpiCamos.ts';
	import { CAMO_FILL, CAMO_INK, percent } from '#lib/ui.ts';

	const total = WEAPONS.length;
	const divergenceShown = $derived(Math.min(progress.divergenceCount, DIVERGENCE_REQUIRED));
	const divergencePct = $derived(percent(divergenceShown, DIVERGENCE_REQUIRED));
</script>

<section aria-labelledby="overview-heading">
	<h2 id="overview-heading" class="sr-only">{t.kpi.label}</h2>
	<div class="grid grid-cols-2 gap-3 lg:grid-cols-4" style:--brushed={BRUSHED} style:--facets={FACETS}>
		{#each LADDER as camo, i (camo.id)}
			{@const count = progress.ladderCounts[i]}
			{@const pct = percent(count, total)}
			<div
				class="kpi-tile hud-frame rounded-card border-t-[3px] bg-panel px-3.5 py-3 shadow-card sm:px-4"
				style:border-top-color={CAMO_FILL[camo.id]}
				style:--k={CAMO_FILL[camo.id]}
				data-camo={camo.id}
			>
				<h3 class="font-head text-[11px] font-bold tracking-[0.12em] uppercase {CAMO_INK[camo.id]}">{camo.name}</h3>
				<p class="font-head num mt-0.5 text-[24px] leading-tight font-bold sm:text-[28px]">
					{count}<small class="text-[15px] font-semibold text-muted"> / {total}</small>
				</p>
				<p class="mb-2 text-[11.5px] text-muted">{t.kpi.weaponsUnit}</p>
				<div class="bar"><i style:width="{pct}%"></i></div>
			</div>
		{/each}

		<div
			class="kpi-tile hud-frame rounded-card border-t-[3px] bg-panel px-3.5 py-3 shadow-card sm:px-4"
			style:border-top-color="var(--t-div)"
			style:--k="var(--t-div)"
			data-camo="divergence"
		>
			<h3 class="font-head text-[11px] font-bold tracking-[0.12em] text-div-ink uppercase">{DIVERGENCE.name}</h3>
			<p class="font-head num mt-0.5 text-[24px] leading-tight font-bold sm:text-[28px]">
				{divergenceShown}<small class="text-[15px] font-semibold text-muted"> / {DIVERGENCE_REQUIRED}</small>
			</p>
			<p class="mb-2 text-[11.5px] text-muted">
				{#if progress.divergenceUnlocked}
					<span class="font-bold text-div-ink"><span aria-hidden="true">✔ </span>{t.kpi.divergenceUnlocked}</span>
				{:else}
					{t.kpi.divergenceUnit}
				{/if}
			</p>
			<div class="bar"><i style:width="{divergencePct}%"></i></div>
		</div>
	</div>
</section>
