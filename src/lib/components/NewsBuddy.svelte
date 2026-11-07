<!--
	The news buddy (WeedCreature) with a speech bubble of today's Call of Duty headlines.
	Headlines come from news.json, refreshed daily by scripts/fetch-news.js on GitHub.
	"Today" is worked out in the browser after load, so the prerendered page and the first
	render match. Placed in the header's right column, Abscar theme only.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import news from '#lib/data/news.json';
	import { t } from '#lib/i18n/en.ts';
	import WeedCreature from './WeedCreature.svelte';

	const SHOWN = 3;

	type Item = { title: string; url: string; date: string };
	const items: Item[] = news.items;

	/** The viewer's local date, set after the page has loaded. */
	let now = $state<Date | null>(null);
	onMount(() => {
		now = new Date();
	});

	const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
	const dayLabel = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
	const shortDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	const clock = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

	const todays = $derived(now ? items.filter((i) => dayKey(new Date(i.date)) === dayKey(now!)) : []);
	const shown = $derived((todays.length > 0 ? todays : items).slice(0, SHOWN));
	const heading = $derived(
		now === null ? t.news.latest : todays.length > 0 ? t.news.today(dayLabel(now)) : t.news.noneToday(dayLabel(now))
	);
	const when = (i: Item) => {
		if (!now) return '';
		const d = new Date(i.date);
		return dayKey(d) === dayKey(now) ? clock(d) : shortDate(d);
	};
</script>

{#if items.length > 0}
	<div class="news-buddy flex items-start gap-1.5">
		<WeedCreature class="buddy size-24 flex-none overflow-visible sm:size-28" />

		<div class="news-bubble relative max-w-[400px] min-w-0 rounded-xl px-3.5 pt-2 pb-2">
			<p class="font-head text-[13px] leading-snug font-bold tracking-wide">
				<span class="text-[#b6f27a]">{t.news.hello}</span>
				{heading}
			</p>
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
								>{item.title}{#if now}<time class="text-[11px] whitespace-nowrap text-band-muted" datetime={item.date}
										>&nbsp;· {when(item)}</time
									>{/if}<span class="sr-only"> ({t.news.newTab})</span></span
							>
						</a>
					</li>
				{/each}
			</ul>
			<p class="text-[10.5px] text-band-muted">
				{t.news.via}
				<a href={news.sourceUrl} target="_blank" rel="noopener noreferrer" class="underline"
					>{news.source}<span class="sr-only"> ({t.news.newTab})</span></a
				>
			</p>
		</div>
	</div>
{/if}
