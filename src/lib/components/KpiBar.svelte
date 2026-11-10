<!--
	The progress overview under the header: a tile per ladder camo (how many weapons have it) and
	Divergence (Harmonic Breaks toward the account-wide goal), the next milestone, the camo steps in
	all, the grind stats, and a fold-out that says what each number counts (2026-11-10, the user's
	brief: "make the denominators understandable, don't hardcode them"). Every number comes from the data.
-->
<script lang="ts">
	import {
		DIVERGENCE,
		DIVERGENCE_REQUIRED,
		LADDER,
		MASTERY_TRACKS,
		MAX_LEVEL,
		SEASON_1_COUNTS_TOWARD_DIVERGENCE
	} from '#lib/data/camos.ts';
	import { WEAPONS } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { BRUSHED, FACETS } from '#lib/kpiCamos.ts';
	import { grindStats } from '#lib/stats.ts';
	import { CAMO_FILL, CAMO_INK, dayMonth, percent } from '#lib/ui.ts';

	const total = WEAPONS.length;
	const launchCount = WEAPONS.filter((w) => w.season === 'launch').length;
	const s1Count = total - launchCount;
	const stepsTotal = total * MAX_LEVEL;
	const stepsDone = $derived(WEAPONS.reduce((sum, w) => sum + Math.min(MAX_LEVEL, progress.level(w.id)), 0));
	const divergenceShown = $derived(Math.min(progress.divergenceCount, DIVERGENCE_REQUIRED));
	const divergencePct = $derived(percent(divergenceShown, DIVERGENCE_REQUIRED));
	const toGo = $derived(DIVERGENCE_REQUIRED - progress.divergenceCount);

	/** The next account-wide milestone: Divergence, then the first open Mastery camo (Multiplayer first). */
	const next = $derived.by(() => {
		if (!progress.divergenceUnlocked) return t.kpi.nextDivergence(toGo);
		for (const track of MASTERY_TRACKS) {
			const i = progress.masteryByMode[track.mode].indexOf('active');
			if (i >= 0) {
				const m = track.camos[i];
				return t.kpi.nextMastery(
					m.name,
					t.mastery.modes[track.mode].name,
					(progress.mastery[m.id] ?? 0).toLocaleString('en-US'),
					m.target.toLocaleString('en-US')
				);
			}
		}
		return t.kpi.nextAllDone;
	});

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
	const head = 'eyebrow mr-0.5 text-[10.5px]';
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

	<div
		class="grind-stats hud-frame mt-3 grid gap-2 rounded-card bg-panel px-4 py-3 text-[13px] text-muted shadow-card"
	>
		<p class="flex flex-wrap items-baseline gap-x-2">
			<b class="{head} text-accent">{t.kpi.next}</b>
			<b class="num font-semibold text-fg">{next}</b>
		</p>
		{#if SEASON_1_COUNTS_TOWARD_DIVERGENCE && !progress.divergenceUnlocked && s1Count > 0}
			<p class="text-[12px]"><span class="unverified" title={t.unverifiedHint}>{t.kpi.season1Note}</span></p>
		{:else if !SEASON_1_COUNTS_TOWARD_DIVERGENCE}
			<p class="text-[12px]">{t.kpi.divergenceLaunchOnly}</p>
		{/if}
		<p class="num flex flex-wrap gap-x-5 gap-y-1">
			<span><b class={head}>{t.kpi.steps(stepsDone, stepsTotal)}</b> <span class="text-[12px]">({t.kpi.catalogue(total, MAX_LEVEL)})</span></span>
			{#if stats}
				<span><b class={head}>{t.stats.today}</b> <b class="font-semibold text-fg">{t.stats.camos(stats.today)}</b></span>
				<span><b class={head}>{t.stats.week}</b> <b class="font-semibold text-fg">{t.stats.camos(stats.week)}</b></span>
				<span title={stats.divergence.kind === 'eta' ? t.stats.etaLong : undefined}
					><b class="{head} text-div-ink">{t.stats.divergence}</b> {#if stats.divergence.kind === 'eta'}<b class="font-semibold text-fg"
							>{t.stats.eta(stats.divergence.days, dayMonth(stats.divergence.date))}</b
						>{:else if stats.divergence.kind === 'unlocked'}<b class="font-semibold text-div-ink"
							><span aria-hidden="true">✔ </span>{t.stats.unlocked}</b
						>{:else if stats.divergence.kind === 'tooSoon'}{t.stats.tooSoon}{:else}{t.stats.noPace}{/if}</span
				>
			{/if}
		</p>
		<details class="compact-hide explain">
			<summary class="inline-flex min-h-11 items-center gap-1.5 text-[12.5px] font-semibold text-fg">
				<svg viewBox="0 0 16 16" class="explain-chev size-3.5" aria-hidden="true"
					><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg
				>{t.kpi.explain}
			</summary>
			<ul class="grid gap-1 pb-1 text-[12.5px] leading-snug">
				<li>{t.kpi.explainCatalogue(total, launchCount, s1Count)}</li>
				<li>{t.kpi.explainSteps(MAX_LEVEL, stepsTotal)}</li>
				<li>
					{t.kpi.explainDivergence(DIVERGENCE_REQUIRED, total)}
					{#if SEASON_1_COUNTS_TOWARD_DIVERGENCE}<span class="unverified" title={t.unverifiedHint}>{t.kpi.season1Note}</span>{/if}
				</li>
				<li>{t.kpi.explainMastery}</li>
			</ul>
		</details>
	</div>
</section>

<style>
	.explain summary {
		list-style: none;
		cursor: pointer;
	}
	.explain summary::-webkit-details-marker {
		display: none;
	}
	.explain[open] .explain-chev {
		transform: rotate(90deg);
	}
	.explain-chev {
		transition: transform 0.15s;
	}
</style>
