<!--
	The news banner above the KPI tiles, styled as a CoD4-style green radar screen (the user's
	ask, 2026-11-07): one line with the latest COD headline, and a button that opens the box to
	show a few more plus a link to Charlie Intel's live posts on X. It replaced a big 8-headline
	news box ("too big and clunky") and then a 3-headline strip. On the left: a little turning
	radar with red blips and the yellow player arrow; the button slides the box open (same day:
	bigger radar, smooth opening). Headlines come from
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

	/** One turn of the radar sweep, in seconds (the blips flash in step with it). */
	const SWEEP = 2.4;
	/** Enemy blips on the little radar: angle clockwise from the top, distance from the middle (0–1).
	    Each one flashes when the sweep passes over it, like a UAV ping. */
	const BLIPS = [
		{ angle: 55, dist: 0.62 },
		{ angle: 160, dist: 0.45 },
		{ angle: 250, dist: 0.7 }
	].map(({ angle, dist }) => {
		const rad = (angle * Math.PI) / 180;
		return {
			x: 50 + 50 * dist * Math.sin(rad),
			y: 50 - 50 * dist * Math.cos(rad),
			delay: -(1 - angle / 360) * SWEEP
		};
	});

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
				<span class="scope" style="--sweep: {SWEEP}s" aria-hidden="true">
					<span class="sweep"></span>
					{#each BLIPS as blip, i (i)}
						<span class="blip" style="left: {blip.x}%; top: {blip.y}%; animation-delay: {blip.delay}s"></span>
					{/each}
					<svg viewBox="0 0 20 20" class="player">
						<path d="M10 6.6 12.7 13 10 11.6 7.3 13Z" />
					</svg>
				</span>
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

		<!-- slides open (grid rows 0fr → 1fr); `inert` keeps the closed list out of Tab and screen readers -->
		<div id="{panelId}-more" class={['more', open && 'open']} inert={!open}>
			<div class="more-inner">
				<ol>
					{#each more as item (item.url)}
						<li class="radar-rule flex border-t">{@render headline(item, false)}</li>
					{/each}
				</ol>
				<div class="radar-rule flex justify-end border-t lg:hidden">{@render xLink('')}</div>
			</div>
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

	/* The little radar on the left, like the CoD4 minimap: two rings and a cross on dark green
	   glass, a sweep with a fading trail that turns clockwise, red enemy blips that flash as the
	   sweep passes them, and the yellow player arrow in the middle. Still for reduced motion. */
	.scope {
		position: relative;
		width: 32px;
		height: 32px;
		flex: none;
		overflow: hidden;
		border-radius: 50%;
		background:
			linear-gradient(rgb(70 255 120 / 0.4), rgb(70 255 120 / 0.4)) center / 1px 100% no-repeat,
			linear-gradient(rgb(70 255 120 / 0.4), rgb(70 255 120 / 0.4)) center / 100% 1px no-repeat,
			radial-gradient(
				circle closest-side,
				transparent 0 44%,
				rgb(70 255 120 / 0.5) 45% 49%,
				transparent 50% 88%,
				rgb(70 255 120 / 0.45) 89% 93%,
				transparent 94%
			),
			radial-gradient(circle closest-side, #0b3016, #031008);
		box-shadow:
			0 0 0 1.5px rgb(70 255 120 / 0.8),
			0 0 10px rgb(70 255 120 / 0.5),
			inset 0 0 6px rgb(0 0 0 / 0.8);
	}
	@media (min-width: 640px) {
		.scope {
			width: 38px;
			height: 38px;
		}
	}
	/* the bright edge sits at 12 o'clock (the end of the gradient) with the trail behind it */
	.sweep {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: conic-gradient(
			rgb(120 255 160 / 0) 0 55%,
			rgb(120 255 160 / 0.28) 82%,
			rgb(140 255 170 / 0.8) 99.2%,
			rgb(210 255 220) 99.2% 100%
		);
		animation: radar-sweep var(--sweep) linear infinite;
	}
	.blip {
		position: absolute;
		width: 4px;
		height: 4px;
		margin: -2px 0 0 -2px;
		border-radius: 50%;
		background: #ff4b3a;
		box-shadow: 0 0 4px 1px rgb(255 60 40 / 0.85);
		opacity: 0;
		animation: radar-blip var(--sweep) linear infinite;
	}
	.player {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		fill: #ffd84a;
		stroke: #3a2c00;
		stroke-width: 0.5;
		stroke-linejoin: round;
		filter: drop-shadow(0 0 1.5px rgb(255 216 74 / 0.8));
	}
	@keyframes radar-sweep {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes radar-blip {
		0% {
			opacity: 1;
			transform: scale(1.4);
		}
		12% {
			opacity: 1;
			transform: scale(1);
		}
		70%,
		100% {
			opacity: 0;
		}
	}

	/* "More news" slides the box open instead of popping it */
	.more {
		display: grid;
		/* minmax(0, …): the long one-line titles must not widen the column (sideways scroll on phones) */
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.35s ease;
	}
	.more.open {
		grid-template-rows: 1fr;
	}
	.more-inner {
		min-height: 0;
		overflow: hidden;
		/* where supported, let the focus outline show past the edges */
		overflow: clip;
		overflow-clip-margin: 6px;
	}

	@media (prefers-reduced-motion: reduce) {
		.sweep,
		.blip {
			animation: none;
		}
		.blip {
			opacity: 0.9;
		}
		.more {
			transition: none;
		}
	}
</style>
