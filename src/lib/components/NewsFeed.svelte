<!--
	The news box under the KPI bar: the latest COD headlines from a few news sites (news.json,
	refreshed every hour, see news.svelte.ts) and a button to Charlie Intel's live posts on X.
	Shown in every theme. Phones show 3 headlines until "Show more".
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { CHARLIE_INTEL_X, news, timeAgo, useNews } from '#lib/news.svelte.ts';

	const SHOWN = 8;
	const ON_PHONES = 3;
	/** Headlines younger than this get a "New" tag. */
	const FRESH_MS = 3 * 60 * 60_000;

	useNews();

	let expanded = $state(false);
	const shown = $derived(news.items.slice(0, SHOWN));
	const sourceList = $derived(
		new Intl.ListFormat('en-GB', { type: 'conjunction' }).format(news.sources.map((s) => s.name))
	);
	const isFresh = (iso: string) => news.now !== null && news.now.getTime() - Date.parse(iso) < FRESH_MS;
</script>

{#if shown.length > 0}
	<section class="rounded-card bg-panel px-4 py-4 shadow-card sm:px-5" aria-labelledby="feed-heading">
		<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
			<h2 id="feed-heading" class="font-head flex items-center gap-2.5 text-base font-bold tracking-wide uppercase">
				<span class="feed-dot" aria-hidden="true"></span>{t.feed.heading}
			</h2>
			<a
				href={CHARLIE_INTEL_X}
				target="_blank"
				rel="noopener noreferrer"
				class="font-head inline-flex min-h-11 items-center gap-2 rounded-full border border-accent bg-accent px-4 text-[13px] font-semibold text-on-accent"
			>
				{t.feed.charlieX}
				<svg viewBox="0 0 16 16" class="size-3.5 flex-none" aria-hidden="true">
					<path
						d="M6 3h7v7M13 3 3.5 12.5"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span class="sr-only"> ({t.news.newTab})</span>
			</a>
		</div>

		<ol class="mt-3 grid gap-x-6 md:grid-cols-2">
			{#each shown as item, i (item.url)}
				<li class={['border-t border-line', !expanded && i >= ON_PHONES && 'max-sm:hidden']}>
					<a
						href={item.url}
						target="_blank"
						rel="noopener noreferrer"
						class="group flex min-h-11 flex-col justify-center gap-0.5 py-2"
					>
						<span class="font-head text-[11px] font-semibold tracking-wider text-muted uppercase"
							>{#if isFresh(item.date)}<span class="text-new-ink">{t.feed.fresh}</span><span aria-hidden="true"
									>{' · '}</span
								>{/if}{item.source}{#if news.now}<span aria-hidden="true">{' · '}</span><time datetime={item.date}
									>{timeAgo(item.date, news.now)}</time
								>{/if}</span
						>
						<span class="text-sm leading-snug text-fg group-hover:underline"
							>{item.title}<span class="sr-only"> ({t.news.newTab})</span></span
						>
					</a>
				</li>
			{/each}
		</ol>

		{#if shown.length > ON_PHONES}
			<button
				type="button"
				class="font-head min-h-11 text-[13px] font-semibold text-accent underline-offset-2 hover:underline sm:hidden"
				aria-expanded={expanded}
				onclick={() => (expanded = !expanded)}
				>{expanded ? t.feed.fewer : t.feed.more(shown.length - ON_PHONES)}</button
			>
		{/if}

		<p class="mt-2 text-xs text-muted">{t.feed.footer(sourceList)}</p>
	</section>
{/if}

<style>
	/* a small red "on air" dot that pulses (stays still for reduced motion) */
	.feed-dot {
		width: 9px;
		height: 9px;
		flex: none;
		border-radius: 9999px;
		background: var(--t-accent);
		box-shadow: 0 0 0 0 color-mix(in srgb, var(--t-accent) 55%, transparent);
		animation: feed-pulse 2s ease-out infinite;
	}
	@keyframes feed-pulse {
		to {
			box-shadow: 0 0 0 8px transparent;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.feed-dot {
			animation: none;
		}
	}
</style>
