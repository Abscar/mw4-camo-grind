<!--
	The slim news banner above the KPI tiles: the 3 latest COD headlines in one strip, plus a
	small link to Charlie Intel's live posts on X. It replaced a big 8-headline news box that the
	user found "too big and clunky" (2026-11-07). Headlines come from news.svelte.ts (news.json,
	refreshed every hour). All themes.
	≥1024 px: one row (label, 3 headlines side by side, X link). Smaller: label + X link on top,
	one headline per line. Titles are cut to one line (the full title is in the tooltip).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { CHARLIE_INTEL_X, news, timeAgo, useNews } from '#lib/news.svelte.ts';

	const SHOWN = 3;

	useNews();

	const shown = $derived(news.items.slice(0, SHOWN));
</script>

{#if shown.length > 0}
	<section
		class="flex flex-col gap-x-5 rounded-card bg-panel px-3 shadow-card sm:px-4 lg:flex-row lg:items-center"
		aria-labelledby="news-banner-heading"
	>
		<div class="flex items-center justify-between gap-3 lg:contents">
			<h2
				id="news-banner-heading"
				class="font-head flex min-h-11 flex-none items-center gap-2 text-[12px] font-bold tracking-[0.14em] uppercase lg:order-1"
			>
				<span class="news-dot" aria-hidden="true"></span>{t.banner.heading}
			</h2>
			<a
				href={CHARLIE_INTEL_X}
				target="_blank"
				rel="noopener noreferrer"
				class="group font-head inline-flex min-h-11 flex-none items-center lg:order-3"
			>
				<span
					class="inline-flex h-8 items-center gap-1.5 rounded-full border border-accent px-3 text-[12px] font-semibold text-fg group-hover:bg-accent group-hover:text-on-accent"
				>
					{t.banner.charlieX}
					<svg viewBox="0 0 16 16" class="size-3 flex-none" aria-hidden="true">
						<path
							d="M6 3h7v7M13 3 3.5 12.5"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</span>
				<span class="sr-only"> ({t.news.newTab})</span>
			</a>
		</div>

		<ol
			class="min-w-0 flex-1 divide-y divide-line border-t border-line lg:order-2 lg:grid lg:grid-cols-3 lg:divide-x lg:divide-y-0 lg:border-t-0"
		>
			{#each shown as item (item.url)}
				<li class="min-w-0 lg:not-first:pl-4 lg:not-last:pr-4">
					<a
						href={item.url}
						target="_blank"
						rel="noopener noreferrer"
						title={item.title}
						class="group flex min-h-11 min-w-0 flex-col justify-center py-1.5"
					>
						<span class="font-head truncate text-[10.5px] font-semibold tracking-wider text-muted uppercase"
							>{item.source}{#if news.now}<span aria-hidden="true">{' · '}</span><time datetime={item.date}
									>{timeAgo(item.date, news.now)}</time
								>{/if}</span
						>
						<span class="truncate text-[13px] leading-snug text-fg group-hover:underline"
							>{item.title}<span class="sr-only"> ({t.news.newTab})</span></span
						>
					</a>
				</li>
			{/each}
		</ol>
	</section>
{/if}

<style>
	/* a small red "on air" dot that pulses (stays still for reduced motion) */
	.news-dot {
		width: 8px;
		height: 8px;
		flex: none;
		border-radius: 9999px;
		background: var(--t-accent);
		box-shadow: 0 0 0 0 color-mix(in srgb, var(--t-accent) 55%, transparent);
		animation: news-pulse 2s ease-out infinite;
	}
	@keyframes news-pulse {
		to {
			box-shadow: 0 0 0 7px transparent;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.news-dot {
			animation: none;
		}
	}
</style>
