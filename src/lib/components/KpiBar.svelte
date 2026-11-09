<script lang="ts">
	import { DIVERGENCE, DIVERGENCE_REQUIRED, LADDER, SEASON_1_COUNTS_TOWARD_DIVERGENCE } from '#lib/data/camos.ts';
	import { WEAPONS } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { BRUSHED, FACETS } from '#lib/kpiCamos.ts';
	import { grindStats } from '#lib/stats.ts';
	import { CAMO_FILL, CAMO_INK, dayMonth, percent } from '#lib/ui.ts';

	const total = WEAPONS.length;
	const divergenceShown = $derived(Math.min(progress.divergenceCount, DIVERGENCE_REQUIRED));
	const divergencePct = $derived(percent(divergenceShown, DIVERGENCE_REQUIRED));
	const toGo = $derived(DIVERGENCE_REQUIRED - progress.divergenceCount);

	/** Grind stats: worked out in the browser once saved progress is read (so the prerendered page
	    and the first render match), again on every tick and once a minute (midnight rolls over). */
	let clock = $state(0);
	$effect(() => {
		const tick = () => (clock = Date.now());
		tick();
		const timer = setInterval(tick, 60_000);
		document.addEventListener('visibilitychange', tick);
		return () => {
			clearInterval(timer);
			document.removeEventListener('visibilitychange', tick);
		};
	});
	const stats = $derived.by(() => {
		if (!progress.ready || !clock) return null;
		return grindStats(progress.stamps, progress.weapons, Math.max(clock, Date.now()));
	});
	const head = 'font-head mr-0.5 text-[10.5px] font-bold tracking-[0.12em] uppercase';
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

{#if stats}
	<section
		aria-label={t.stats.label}
		class="grind-stats hud-frame mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-card bg-panel px-4 py-2.5 text-[13px] text-muted shadow-card"
	>
		<span><b class={head}>{t.stats.today}</b> <b class="font-semibold text-fg tabular-nums">{t.stats.camos(stats.today)}</b></span>
		<span><b class={head}>{t.stats.week}</b> <b class="font-semibold text-fg tabular-nums">{t.stats.camos(stats.week)}</b></span>
		<span title={stats.divergence.kind === 'eta' ? t.stats.etaLong : undefined}
			><b class="{head} text-div-ink">{t.stats.divergence}</b> {#if stats.divergence.kind === 'eta'}<b
					class="font-semibold text-fg tabular-nums">{t.stats.eta(stats.divergence.days, dayMonth(stats.divergence.date))}</b
				>{:else if stats.divergence.kind === 'unlocked'}<b class="font-semibold text-div-ink"
					><span aria-hidden="true">✔ </span>{t.stats.unlocked}</b
				>{:else if stats.divergence.kind === 'tooSoon'}{t.stats.tooSoon}{:else}{t.stats.noPace}{/if}</span
		>
	</section>
{/if}
