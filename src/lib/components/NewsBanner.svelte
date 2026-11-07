<!--
	The news banner above the KPI tiles, styled as a CoD4-style green radar screen (the user's
	ask, 2026-11-07): one line with the latest COD headline, and a button that opens the box to
	show a few more plus a link to Charlie Intel's live posts on X. It replaced a big 8-headline
	news box ("too big and clunky") and then a 3-headline strip. Headlines come from
	news.svelte.ts (news.json, refreshed every hour). Same look in every theme.
	Titles are cut to one line (the full title is in the tooltip). The "opens in a new tab" text
	sits outside the cut-off title on purpose: inside it, it would end up past the full title's
	end and make the page wider than a phone.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import type { Headline } from '#lib/news-codec.ts';
	import { CHARLIE_INTEL_X, news, timeAgo, useNews } from '#lib/news.svelte.ts';

	/** Headlines in the opened box (the first one included). */
	const OPENED = 6;

	useNews();

	const panelId = $props.id();
	let open = $state(false);
	const first = $derived(news.items[0]);
	const more = $derived(news.items.slice(1, OPENED));
</script>

{#snippet headline(item: Headline, compact: boolean)}
	<a
		href={item.url}
		target="_blank"
		rel="noopener noreferrer"
		title={item.title}
		class={[
			'group flex min-h-11 min-w-0 flex-1 items-center gap-2.5',
			// the opened list on phones: source and time above the title, so the title gets the width
			!compact && 'max-sm:flex-col max-sm:items-stretch max-sm:justify-center max-sm:gap-0 max-sm:py-1.5'
		]}
	>
		<span class="radar-dim font-head flex-none text-[10.5px] font-semibold tracking-wider uppercase"
			><span class={compact ? 'max-sm:hidden' : ''}
				>{item.source}{#if news.now}<span aria-hidden="true">{' · '}</span>{/if}</span
			>{#if news.now}<time datetime={item.date}>{timeAgo(item.date, news.now)}</time>{/if}</span
		>
		<span class="radar-text min-w-0 truncate text-[13px] group-hover:underline">{item.title}</span>
		<span class="sr-only"> ({t.news.newTab})</span>
	</a>
{/snippet}

{#snippet xLink(extra: string)}
	<a href={CHARLIE_INTEL_X} target="_blank" rel="noopener noreferrer" class="group font-head inline-flex min-h-11 flex-none items-center {extra}">
		<span class="radar-pill inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold">
			{t.banner.charlieX}
			<svg viewBox="0 0 16 16" class="size-3 flex-none" aria-hidden="true">
				<path d="M6 3h7v7M13 3 3.5 12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</span>
		<span class="sr-only"> ({t.news.newTab})</span>
	</a>
{/snippet}

{#if first}
	<section class="radar rounded-card px-3 sm:px-4" aria-labelledby="{panelId}-heading">
		<div class="flex items-center gap-3">
			<h2 id="{panelId}-heading" class="font-head flex min-h-11 flex-none items-center gap-2.5">
				<span class="scope" aria-hidden="true"></span>
				<span class="radar-hot text-[12px] font-bold tracking-[0.14em] uppercase max-sm:sr-only">{t.banner.heading}</span>
			</h2>

			{@render headline(first, true)}

			{@render xLink('max-lg:hidden')}

			{#if more.length > 0}
				<button
					type="button"
					class="group font-head inline-flex min-h-11 min-w-11 flex-none items-center justify-end"
					aria-expanded={open}
					aria-controls="{panelId}-more"
					onclick={() => (open = !open)}
				>
					<span class="radar-pill inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold sm:px-3">
						<span class="max-sm:sr-only">{open ? t.banner.less : t.banner.more}</span>
						<svg viewBox="0 0 16 16" class={['size-3.5 flex-none transition-transform', open && 'rotate-180']} aria-hidden="true">
							<path d="m3.5 6 4.5 4.5L12.5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</span>
				</button>
			{/if}
		</div>

		<div id="{panelId}-more" hidden={!open}>
			<ol>
				{#each more as item (item.url)}
					<li class="radar-rule flex border-t">{@render headline(item, false)}</li>
				{/each}
			</ol>
			<div class="radar-rule flex justify-end border-t lg:hidden">{@render xLink('')}</div>
		</div>
	</section>
{/if}

<style>
	/* A green radar screen in the spirit of CoD4's minimap: dark phosphor-green glass with a faint
	   grid and scanlines, glowing green text and a little radar scope with a turning sweep.
	   Fixed colours on purpose: the box looks the same in every theme. */
	.radar {
		--radar-line: rgb(70 255 120 / 0.55);
		color: #c4ffcf;
		background:
			radial-gradient(120% 160% at 0% 50%, rgb(60 255 110 / 0.14), transparent 60%),
			repeating-linear-gradient(0deg, rgb(80 255 120 / 0.045) 0 1px, transparent 1px 3px),
			linear-gradient(90deg, rgb(80 255 120 / 0.07) 1px, transparent 1px) 0 0 / 28px 28px,
			linear-gradient(rgb(80 255 120 / 0.07) 1px, transparent 1px) 0 0 / 28px 28px,
			#061a0c;
		box-shadow:
			0 0 0 1px var(--radar-line),
			0 0 16px rgb(60 255 110 / 0.22),
			inset 0 0 24px rgb(0 0 0 / 0.55);
	}
	.radar-text {
		color: #c4ffcf;
		text-shadow: 0 0 6px rgb(90 255 130 / 0.35);
	}
	.radar-dim {
		color: #5fd67b;
	}
	.radar-hot {
		color: #7dff96;
		text-shadow: 0 0 8px rgb(90 255 130 / 0.6);
	}
	.radar-rule {
		border-color: rgb(70 255 120 / 0.2);
	}
	.radar-pill {
		color: #7dff96;
		border: 1px solid var(--radar-line);
		background: rgb(70 255 120 / 0.06);
	}
	.group:hover .radar-pill {
		background: rgb(70 255 120 / 0.18);
	}

	/* the radar scope: two rings, a cross and a sweep that turns (still for reduced motion) */
	.scope {
		position: relative;
		width: 24px;
		height: 24px;
		flex: none;
		overflow: hidden;
		border-radius: 50%;
		background:
			linear-gradient(rgb(70 255 120 / 0.35), rgb(70 255 120 / 0.35)) center / 1px 100% no-repeat,
			linear-gradient(rgb(70 255 120 / 0.35), rgb(70 255 120 / 0.35)) center / 100% 1px no-repeat,
			radial-gradient(circle, transparent 0 32%, rgb(70 255 120 / 0.5) 33% 37%, transparent 38%),
			#031008;
		box-shadow:
			0 0 0 1px rgb(70 255 120 / 0.75),
			0 0 8px rgb(70 255 120 / 0.45);
	}
	.scope::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: conic-gradient(from 0deg, rgb(120 255 160 / 0.9), rgb(120 255 160 / 0) 28%, transparent);
		animation: radar-sweep 2.4s linear infinite;
	}
	@keyframes radar-sweep {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.scope::after {
			animation: none;
		}
	}
</style>
