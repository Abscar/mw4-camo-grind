<!--
	The news buddy (WeedCreature) with a speech bubble of the latest balance news: nerfs, buffs,
	TTK, movement and patch changes (the user's ask, 2026-11-07; all other COD news is in the news
	box). Headlines come from news.svelte.ts (`patches` in news.json, refreshed every hour on
	GitHub, kept for 60 days). "Today" is worked out in the browser after load, so the prerendered
	page and the first render match. Placed in the header's right column, Abscar theme only.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { news, useNews } from '#lib/news.svelte.ts';
	import WeedCreature from './WeedCreature.svelte';

	const SHOWN = 3;

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
</script>

<div class="news-buddy flex items-start gap-1.5">
	<WeedCreature class="buddy size-24 flex-none overflow-visible sm:size-28" />

	<div class="news-bubble relative max-w-[400px] min-w-0 rounded-xl px-3.5 pt-2 pb-2">
		<p class="font-head text-[13px] leading-snug font-bold tracking-wide">
			<span class="text-[#b6f27a]">{t.news.hello}</span>
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
