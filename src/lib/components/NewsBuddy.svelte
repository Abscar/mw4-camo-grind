<!--
	The news buddy (WeedCreature) with a speech bubble of the latest balance news: nerfs, buffs,
	TTK, movement and patch changes (the user's ask, 2026-11-07; all other COD news is in the news
	box). Headlines come from news.svelte.ts (`patches` in news.json, refreshed every hour on
	GitHub, kept for 60 days). "Today" is worked out in the browser after load, so the prerendered
	page and the first render match. Placed in the header's right column, Abscar theme only.
	The buddy himself is a button: a poke makes him cough, blow smoke rings or laugh (~2 s).
-->
<script lang="ts">
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

	/** Cheers right after you max a weapon; otherwise sleeps after midnight, sulks after a quiet week. */
	const mood = $derived.by((): BuddyMood => {
		if (feed.cheering) return 'cheer';
		if (!now) return 'normal'; // the prerendered page and the first render match
		if (now.getHours() < WAKE_HOUR) return 'sleep';
		const last = progress.ready ? progress.lastActiveAt() : null;
		if (last && now.getTime() - Date.parse(last) > SULK_MS) return 'sulk';
		return 'normal';
	});
	const greeting = $derived(mood === 'normal' ? t.news.hello : t.news.mood[mood]);

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
		<WeedCreature class="buddy block size-24 overflow-visible sm:size-28" {mood} {reaction} {run} />
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
