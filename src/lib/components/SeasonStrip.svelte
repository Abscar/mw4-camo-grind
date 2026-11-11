<!--
	The season countdown (2026-11-11, the user's pick from a brainstorm: "Season 1 ends in X days ·
	what's coming · Double XP"). A slim strip under the news radar: which day of the season it is, a
	bar, the (estimated) end, then what's coming that matters for the grind. Dates from data/season.ts
	(a dated snapshot); anything not announced is marked like every unconfirmed fact, and a fold-out
	says where each date comes from (tooltips don't work on phones). Day counts are worked out in the
	browser after load, so the prerendered page and the first render match. Hidden in compact mode.
-->
<script lang="ts">
	import { SEASON, SEASON_CHECKED, SEASON_EVENTS, dayNumber, seasonView, today, type SeasonEvent } from '#lib/data/season.ts';
	import type { Fact } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { shortDate } from '#lib/ui.ts';

	let nowDay = $state<number | null>(null);
	$effect(() => {
		const tick = () => (nowDay = today(new Date()));
		tick();
		const timer = setInterval(tick, 60_000);
		document.addEventListener('visibilitychange', tick);
		return () => {
			clearInterval(timer);
			document.removeEventListener('visibilitychange', tick);
		};
	});

	const view = $derived(nowDay === null ? null : seasonView(nowDay));
	/** "6 Jan" (no year when it's the same year as the season start). */
	const dayMonth = (iso: string) => shortDate(iso).replace(/ \d{4}$/, '');
	const tip = (f: Fact) => (f.verified ? f.note : [t.unverifiedHint, f.note].filter(Boolean).join(' '));

	function status(e: SeasonEvent): string {
		if (!e.on) return e.when ?? '';
		if (nowDay === null) return dayMonth(e.on);
		const days = dayNumber(e.on) - nowDay;
		return days <= 0 ? t.season.onNow(dayMonth(e.on)) : t.season.inDays(days, dayMonth(e.on));
	}
</script>

<section class="season-strip hud-frame rounded-card bg-panel px-4 py-2.5 shadow-card" aria-labelledby="season-heading">
	<div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px]">
		<h2 id="season-heading" class="font-head flex items-center gap-1.5 text-[12px] font-bold tracking-[0.12em] text-accent uppercase">
			<svg viewBox="0 0 16 16" class="size-3.5 flex-none" aria-hidden="true" focusable="false">
				<rect x="1.5" y="2.5" width="13" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" />
				<path d="M1.5 6.5h13M5 1v3M11 1v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
			</svg>
			{SEASON.name}
		</h2>
		{#if view && !view.ended}
			<span class="num font-semibold text-fg">{t.season.day(view.day, view.length, SEASON.endFact.verified)}</span>
			<span class="season-bar" aria-hidden="true"><i style:width="{Math.round(view.share * 100)}%"></i></span>
		{/if}
		<span class="text-muted">
			{#if view?.ended}
				<span class={SEASON.endFact.verified ? '' : 'unverified'} title={tip(SEASON.endFact)}>{t.season.ended}</span>
			{:else}
				<span class={SEASON.endFact.verified ? '' : 'unverified'} title={tip(SEASON.endFact)}
					>{t.season.ends(dayMonth(SEASON.end), SEASON.endFact.verified)}</span
				>{#if view}{' · '}<b class="num font-semibold text-fg">{t.season.daysLeft(view.daysLeft)}</b>{/if}{#if !SEASON.endFact.verified}{' '}<span
						class="text-[12px]">({t.season.estimate})</span
					>{/if}
			{/if}
		</span>
	</div>

	<ul class="season-events mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] leading-snug">
		{#each SEASON_EVENTS as e (e.id)}
			<li class="min-w-0">
				<b class="font-semibold text-fg">{e.name}:</b>
				<span class="{e.fact.verified ? '' : 'unverified'} text-muted" title={tip(e.fact)}
					>{status(e)}{#if !e.fact.verified}<span class="sr-only"> ({t.unverified})</span>{/if}</span
				>
			</li>
		{/each}
	</ul>

	<details class="season-src mt-1">
		<summary class="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-[12px] font-semibold text-muted">
			<svg viewBox="0 0 16 16" class="season-chev size-3" aria-hidden="true"
				><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg
			>{t.season.sources}
		</summary>
		<ul class="grid gap-1 pb-1 text-[12px] leading-snug text-muted">
			<li><b class="font-semibold text-fg">{t.season.endLabel}:</b> {SEASON.endFact.note}</li>
			{#each SEASON_EVENTS as e (e.id)}
				<li><b class="font-semibold text-fg">{e.name}:</b> {e.fact.note}</li>
			{/each}
			<li>{t.season.checked(shortDate(SEASON_CHECKED))}</li>
		</ul>
	</details>
</section>

<style>
	.season-bar {
		display: inline-block;
		width: clamp(70px, 14vw, 140px);
		height: 6px;
		border-radius: 999px;
		background: var(--t-track);
		overflow: hidden;
	}
	.season-bar i {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--t-accent);
	}
	.season-src summary {
		list-style: none;
	}
	.season-src summary::-webkit-details-marker {
		display: none;
	}
	.season-src[open] .season-chev {
		transform: rotate(90deg);
	}
	.season-chev {
		transition: transform 0.15s;
	}
</style>
