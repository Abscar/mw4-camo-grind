<!--
	The news buddy (WeedCreature) with a speech bubble of the latest balance news: nerfs, buffs,
	TTK, movement and patch changes (the user's ask, 2026-11-07; all other COD news is in the news
	box). Headlines come from news.svelte.ts (`patches` in news.json, refreshed every hour on
	GitHub, kept for 60 days). "Today" is worked out in the browser after load, so the prerendered
	page and the first render match. Abscar theme only: under the header title on the left, beside
	the old TV (the user's asks, 2026-11-10; it used to sit top right).
	The buddy himself is a button: a poke makes him cough, blow smoke rings or laugh (~2 s).
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { growth, GROWTH_STAGES, type Growth } from '#lib/buddyGrowth.ts';
	import { DIVERGENCE_REQUIRED, MASTERY_TRACKS, MAX_LEVEL } from '#lib/data/camos.ts';
	import { WEAPONS } from '#lib/data/weapons.ts';
	import { feed } from '#lib/feed.svelte.ts';
	import { t } from '#lib/i18n/en.ts';
	import { news, useNews } from '#lib/news.svelte.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import WeedCreature, { REACTIONS, type BuddyMood, type BuddyReaction } from './WeedCreature.svelte';

	const SHOWN = 3;
	/** He sulks when nothing was ticked for this long. */
	const SULK_MS = 7 * 24 * 60 * 60_000;
	/** He sleeps from midnight until this hour (viewer's clock). */
	const WAKE_HOUR = 6;

	useNews();

	const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
	const dayLabel = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
	const shortDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	const clock = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

	const now = $derived(news.now);
	const todays = $derived(now ? news.patches.filter((i) => dayKey(new Date(i.date)) === dayKey(now)) : []);
	const shown = $derived((todays.length > 0 ? todays : news.patches).slice(0, SHOWN));
	const heading = $derived(
		news.patches.length === 0
			? t.news.none
			: now === null
				? t.news.latest
				: todays.length > 0
					? t.news.today(dayLabel(now))
					: t.news.noneToday(dayLabel(now))
	);
	const when = (iso: string) => {
		if (!now) return '';
		const d = new Date(iso);
		return dayKey(d) === dayKey(now) ? clock(d) : shortDate(d);
	};

	/**
	 * He grows with your grind (buddyGrowth.ts, 2026-11-11): by the share of camo steps ticked, a
	 * monster at Divergence, a legend once a Mastery camo is done. When a stage is reached while the
	 * page is open he bounces, sparkles and says so for a few seconds (not on load).
	 */
	const STEPS_TOTAL = WEAPONS.length * MAX_LEVEL;
	const GREW_MS = 6000;
	const grow = $derived.by((): Growth => {
		const steps = WEAPONS.reduce((n, w) => n + Math.min(MAX_LEVEL, progress.level(w.id)), 0);
		const mastery = MASTERY_TRACKS.reduce((n, tr) => n + progress.masteryByMode[tr.mode].filter((s) => s === 'complete').length, 0);
		return growth(steps, STEPS_TOTAL, DIVERGENCE_REQUIRED - progress.divergenceCount, mastery);
	});
	let grew = $state(false);
	let shownStage: number | null = null;
	let grewTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		if (!progress.ready) return;
		const stage = grow.stage;
		untrack(() => {
			if (shownStage !== null && stage > shownStage) {
				grew = true;
				clearTimeout(grewTimer);
				grewTimer = setTimeout(() => (grew = false), GREW_MS);
			} else if (shownStage !== null && stage < shownStage) {
				grew = false;
			}
			shownStage = stage;
		});
	});
	$effect(() => () => clearTimeout(grewTimer));
	const growthNext = $derived.by(() => {
		const n = grow.next;
		if (!n) return t.buddy.top;
		if (n.kind === 'steps') return t.buddy.toSteps(n.left);
		if (n.kind === 'divergence') return t.buddy.toDivergence(n.left);
		return t.buddy.toMastery;
	});

	/** Cheers right after you max a weapon (or he grew); otherwise sleeps after midnight, sulks after a quiet week. */
	const mood = $derived.by((): BuddyMood => {
		if (feed.cheering || grew) return 'cheer';
		if (!now) return 'normal'; // the prerendered page and the first render match
		if (now.getHours() < WAKE_HOUR) return 'sleep';
		const last = progress.ready ? progress.lastActiveAt() : null;
		if (last && now.getTime() - Date.parse(last) > SULK_MS) return 'sulk';
		return 'normal';
	});
	const greeting = $derived(
		grew
			? t.buddy.grew(t.buddy.stages[grow.name])
			: mood === 'cheer' && feed.cheering && feed.cheerFor
				? t.squad.cheer(feed.cheerFor) // a squad member maxed a weapon (2026-11-14)
				: mood === 'normal'
					? t.news.hello
					: t.news.mood[mood]
	);

	/** Just for fun: poke him and he coughs, blows smoke rings or laughs (never the same twice in a row). */
	const REACT_MS = 2100;
	let reaction = $state<BuddyReaction | null>(null);
	let run = $state(0);
	let last: BuddyReaction | null = null;
	let timer: ReturnType<typeof setTimeout> | undefined;

	function poke() {
		const options = REACTIONS.filter((r) => r !== last);
		last = options[Math.floor(Math.random() * options.length)];
		reaction = last;
		run++;
		clearTimeout(timer);
		timer = setTimeout(() => (reaction = null), REACT_MS);
	}
	$effect(() => () => clearTimeout(timer));
</script>

<div class="news-buddy flex items-start gap-1.5">
	<button type="button" class="buddy-btn flex-none" aria-label={t.buddy.poke} title={t.buddy.poke} onclick={poke}>
		<WeedCreature class="buddy block size-24 overflow-visible sm:size-28" {mood} {reaction} {run} stage={grow.stage} {grew} />
	</button>

	<div class="news-bubble relative max-w-[400px] min-w-0 rounded-xl px-3.5 pt-2 pb-2">
		<p class="font-head text-[13px] leading-snug font-bold tracking-wide">
			<span class="text-[#b6f27a]">{greeting}</span>
			{heading}
		</p>
		{#if shown.length > 0}
			<ul>
				{#each shown as item, i (item.url)}
					<li class={i >= 2 ? 'max-sm:hidden' : ''}>
						<a
							href={item.url}
							target="_blank"
							rel="noopener noreferrer"
							class="flex min-h-11 items-center gap-2 text-[12.5px] leading-snug text-band-fg hover:underline"
						>
							<span class="size-1.5 flex-none rounded-full bg-[#ffe14a]" aria-hidden="true"></span>
							<span class="min-w-0"
								>{item.title}<span class="text-[11px] whitespace-nowrap text-band-muted"
									>&nbsp;· {item.source}{#if now}&nbsp;· <time datetime={item.date}>{when(item.date)}</time>{/if}</span
								><span class="sr-only"> ({t.news.newTab})</span></span
							>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
		<!-- how grown he is, and what the next stage needs -->
		<p class="buddy-growth mt-1 flex items-start gap-1.5 border-t border-white/15 pt-1.5 text-[11.5px] leading-snug text-band-muted">
			<svg viewBox="0 0 16 16" class="mt-px size-3.5 flex-none" aria-hidden="true" focusable="false">
				<path d="M8 15V8M8 8C8 4 5 2 1.5 2 1.5 6 4 8 8 8ZM8 10c0-3.2 2.4-5 6.5-5 0 3.4-2.6 5-6.5 5Z" fill="#7ed957" stroke="#2f6522" stroke-width="0.8" stroke-linejoin="round" />
			</svg>
			<span
				><b class="font-semibold text-[#b6f27a]">{t.buddy.growth}: {t.buddy.stages[grow.name]}</b>
				({t.buddy.stageOf(grow.stage + 1, GROWTH_STAGES.length)}) · {growthNext}</span
			>
		</p>
	</div>
</div>

<style>
	.buddy-btn {
		display: block;
		padding: 0;
		border: 0;
		background: none;
		border-radius: 16px;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}
</style>
