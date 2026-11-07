<!--
	A leafy weed-creature buddy (our own cartoon: a bush of leaves for a head, glowing yellow eyes
	and fingertips, a big grin) with a speech bubble of today's Call of Duty headlines.
	Headlines come from news.json, refreshed daily by scripts/fetch-news.js on GitHub.
	"Today" is worked out in the browser after load, so the prerendered page and the first
	render match. Lives inside OperatorTag, so it only shows in the Abscar theme.
-->
<script lang="ts" module>
	/** One cartoon leaf: [angle, length, width] per leaflet, same shape as the tick leaves. */
	const LEAFLETS: [number, number, number][] = [
		[-96, 5.6, 2.8],
		[96, 5.6, 2.8],
		[-63, 8.6, 3.7],
		[63, 8.6, 3.7],
		[-31, 11.2, 4.3],
		[31, 11.2, 4.3],
		[0, 13.4, 4.8]
	];
	const leaflet = ([, l, w]: [number, number, number]) =>
		`M0 0 C${w / 2} ${-l * 0.3} ${w / 2} ${-l * 0.72} 0 ${-l} C${-w / 2} ${-l * 0.72} ${-w / 2} ${-l * 0.3} 0 0 Z`;

	/** Leaves sticking out of the head: [direction in degrees (0 = up), size]. */
	const CROWN: [number, number][] = [
		[-112, 1.05],
		[-78, 1.25],
		[-44, 1.35],
		[-10, 1.45],
		[24, 1.35],
		[58, 1.2],
		[96, 1]
	];
	const FINGERS: [number, number][] = [
		[63.5, 20.5],
		[68, 17.5],
		[73, 18],
		[77.5, 21.5]
	];
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import news from '#lib/data/news.json';
	import { t } from '#lib/i18n/en.ts';

	const uid = $props.id();
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
		<svg viewBox="0 0 84 84" class="buddy size-20 flex-none overflow-visible sm:size-24" aria-hidden="true" focusable="false">
			<defs>
				<radialGradient id="{uid}-head" cx="0.4" cy="0.35" r="0.75">
					<stop offset="0" stop-color="#6cc94a" />
					<stop offset="1" stop-color="#25601c" />
				</radialGradient>
				<radialGradient id="{uid}-glow">
					<stop offset="0" stop-color="#ffe14a" stop-opacity="0.9" />
					<stop offset="1" stop-color="#ffe14a" stop-opacity="0" />
				</radialGradient>
			</defs>

			<!-- shoulders -->
			<path d="M22 84 C22 66 31 58 42 58 C53 58 62 66 62 84 Z" fill="#2c7023" stroke="#123a0e" stroke-width="1.2" />
			<path d="M30 70 L36 64 M48 66 L53 72 M38 76 L44 70" stroke="#5fb544" stroke-width="1.2" stroke-linecap="round" />

			<!-- leaves bursting out of the head -->
			{#each CROWN as [dir, size] (dir)}
				<g transform="translate(42 39) rotate({dir}) translate(0 -14) scale({size})">
					{#each LEAFLETS as l (l[0])}
						<g transform="rotate({l[0]})"><path d={leaflet(l)} fill="#3f9a2f" stroke="#123a0e" stroke-width="0.7" /></g>
					{/each}
				</g>
			{/each}

			<!-- head -->
			<circle cx="42" cy="40" r="17" fill="url(#{uid}-head)" stroke="#123a0e" stroke-width="1.2" />
			<!-- glowing eyes, angled for mischief -->
			<circle class="buddy-glow" cx="35" cy="37" r="7" fill="url(#{uid}-glow)" />
			<circle class="buddy-glow" cx="49" cy="37" r="7" fill="url(#{uid}-glow)" />
			<ellipse cx="35" cy="37.5" rx="4.2" ry="2.5" transform="rotate(16 35 37.5)" fill="#ffe14a" />
			<ellipse cx="49" cy="37.5" rx="4.2" ry="2.5" transform="rotate(-16 49 37.5)" fill="#ffe14a" />
			<ellipse cx="35.6" cy="37.7" rx="0.9" ry="1.9" fill="#3a2a00" />
			<ellipse cx="48.4" cy="37.7" rx="0.9" ry="1.9" fill="#3a2a00" />
			<path d="M29.5 32.5 L39 35.5 M54.5 32.5 L45 35.5" stroke="#123a0e" stroke-width="1.6" stroke-linecap="round" />
			<!-- big grin -->
			<path d="M31 45 Q42 57 53 45 Q42 49 31 45 Z" fill="#0d2309" />
			<path d="M33 46.2 Q42 49.8 51 46.2 L50.3 48 Q42 51.6 33.7 48 Z" fill="#f4f0c4" />

			<!-- waving hand with glowing fingertips -->
			<path d="M57 67 C65 61 69 49 70 37" fill="none" stroke="#3b8a2c" stroke-width="6" stroke-linecap="round" />
			<path d="M57 67 C65 61 69 49 70 37" fill="none" stroke="#123a0e" stroke-width="1" stroke-linecap="round" opacity="0.5" />
			<circle cx="70.5" cy="32.5" r="5.5" fill="#3b8a2c" stroke="#123a0e" stroke-width="1" />
			<path d="M74.5 35 L79.5 32" stroke="#3b8a2c" stroke-width="3" stroke-linecap="round" />
			{#each FINGERS as [fx, fy] (fx)}
				<path d="M70.5 31 L{fx} {fy}" stroke="#3b8a2c" stroke-width="3" stroke-linecap="round" />
				<circle class="buddy-glow" cx={fx} cy={fy} r="4.5" fill="url(#{uid}-glow)" />
				<circle cx={fx} cy={fy} r="1.9" fill="#ffe14a" />
			{/each}
			<circle class="buddy-glow" cx="79.5" cy="32" r="4.5" fill="url(#{uid}-glow)" />
			<circle cx="79.5" cy="32" r="1.9" fill="#ffe14a" />
		</svg>

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
