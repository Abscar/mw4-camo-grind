<script lang="ts">
	import { DIVERGENCE, DIVERGENCE_REQUIRED, MASTERY } from '#lib/data/camos.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { percent } from '#lib/ui.ts';
	import MasteryRow from './MasteryRow.svelte';
	import StatusPill from './StatusPill.svelte';

	const shown = $derived(Math.min(progress.divergenceCount, DIVERGENCE_REQUIRED));
	const pct = $derived(percent(shown, DIVERGENCE_REQUIRED));
	const divergenceStatus = $derived(progress.divergenceUnlocked ? 'complete' : 'active');
</script>

<section
	class="class-card overflow-hidden rounded-card bg-panel shadow-card"
	style:--c="var(--t-div)"
	aria-labelledby="mastery-heading"
>
	<header class="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pt-4 pb-3 sm:px-5">
		<h2 id="mastery-heading" class="font-head text-base font-bold tracking-wide uppercase">
			{t.mastery.heading}
		</h2>
		<span class="font-head text-[11px] font-semibold tracking-widest text-muted uppercase">{t.mastery.sub}</span>
	</header>

	<div
		class="grid items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3.5 sm:px-5 md:grid-cols-[minmax(150px,1.1fr)_minmax(150px,1.3fr)_auto_minmax(110px,1fr)_96px]"
		style:--k="var(--t-div)"
	>
		<div class="flex items-center justify-between gap-3 md:block">
			<h3 class="font-head text-[15px] font-bold text-div-ink">{DIVERGENCE.name}</h3>
			<div class="md:hidden"><StatusPill status={divergenceStatus} /></div>
		</div>
		<p class="text-[13px] text-muted">{DIVERGENCE.how}. {t.mastery.fromTicks}.</p>
		<p class="font-head text-[15px] font-bold tabular-nums">
			{shown} <small class="text-[13px] font-semibold text-muted">/ {DIVERGENCE_REQUIRED}</small>
		</p>
		<div>
			<div class="bar"><i style:width="{pct}%"></i></div>
			<p class="font-head mt-1.5 text-xs font-bold text-muted tabular-nums">{pct}%</p>
		</div>
		<div class="hidden justify-self-end md:block"><StatusPill status={divergenceStatus} /></div>
	</div>

	{#each MASTERY as camo, i (camo.id)}
		<MasteryRow
			{camo}
			number={i + 1}
			status={progress.masteryStatus[i]}
			previousName={i === 0 ? DIVERGENCE.name : MASTERY[i - 1].name}
		/>
	{/each}
</section>
