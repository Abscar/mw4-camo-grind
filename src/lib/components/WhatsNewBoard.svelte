<!--
	"What's new" billboard (2026-11-23, the user: "a What's new billboard where we tell everything new that's been
	put on the site, on the front page next to the weed buddy"). A lit sign board with the newest updates from
	data/whatsNew.ts; "All updates" opens the rest in a scrolling list. Entries newer than the one this device last
	saw get a "NEW" pill (`mw4-camo-grind:whats-new` = newest id seen, written after the board was on screen for a
	while, so a quick reload doesn't clear them). "Open" jumps to the tab the update lives in (`ongo`).
	All themes: bulbs + fire glow in Abscar, plain panels in Steel, green in Matrix (theme variables).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { WHATS_NEW, dayOf, newSince, type WhatsNewTab } from '#lib/data/whatsNew.ts';
	import { t } from '#lib/i18n/en.ts';

	let { ongo }: { ongo?: (tab: WhatsNewTab) => void } = $props();

	const KEY = 'mw4-camo-grind:whats-new';
	const SHOWN = 4;
	/** how long the board must be on screen before its updates count as seen */
	const SEEN_MS = 8000;

	let fresh = $state<Set<string>>(new Set());
	let all = $state(false);
	let root: HTMLElement;

	const list = $derived(all ? WHATS_NEW : WHATS_NEW.slice(0, SHOWN));
	const date = (d: string) => dayOf(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

	onMount(() => {
		let seen: string | null = null;
		try {
			seen = localStorage.getItem(KEY);
		} catch {}
		fresh = newSince(seen, new Date());
		if (fresh.size === 0) return;

		let timer: ReturnType<typeof setTimeout> | undefined;
		const mark = () => {
			try {
				localStorage.setItem(KEY, WHATS_NEW[0].id);
			} catch {}
		};
		const io = new IntersectionObserver(([e]) => {
			clearTimeout(timer);
			if (e.isIntersecting && document.visibilityState === 'visible') timer = setTimeout(mark, SEEN_MS);
		});
		io.observe(root);
		return () => {
			io.disconnect();
			clearTimeout(timer);
		};
	});
</script>

<section class="wn" bind:this={root} aria-labelledby="wn-h">
	<span class="wn-bulbs" aria-hidden="true"></span>
	<div class="wn-board">
		<header class="wn-top">
			<svg class="wn-horn" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
				<path d="M5 13h5l12-7v20l-12-7H5z" />
				<path d="M10 19l2 7h4l-2-7" />
				<path class="wn-wave" d="M25.5 11.5a6 6 0 0 1 0 9" />
				<path class="wn-wave wn-wave2" d="M28 9a10 10 0 0 1 0 14" />
			</svg>
			<div class="min-w-0">
				<p class="wn-kicker font-head">{t.whatsNew.kicker}</p>
				<h2 id="wn-h" class="wn-title font-head">{t.whatsNew.title}</h2>
			</div>
			{#if fresh.size > 0}
				<span class="wn-count font-head" title={t.whatsNew.fresh}>{t.whatsNew.newCount(fresh.size)}</span>
			{/if}
		</header>

		<ol class={['wn-list', all && 'open']}>
			{#each list as e (e.id)}
				<li class="wn-item" data-kind={e.kind}>
					<div class="wn-meta">
						<span class="wn-kind font-head">{t.whatsNew.kind[e.kind]}</span>
						<time datetime={e.date}>{date(e.date)}</time>
						{#if fresh.has(e.id)}<span class="wn-new font-head" title={t.whatsNew.fresh}>NEW</span>{/if}
					</div>
					<div class="wn-body">
						<div class="min-w-0">
							<h3 class="wn-name">{e.title}</h3>
							<p class="wn-text">{e.text}</p>
						</div>
						{#if e.tab && ongo}
							{@const tab = e.tab}
							<button
								type="button"
								class="wn-go font-head"
								aria-label={t.whatsNew.openLabel(e.title, t.whatsNew.tabs[tab])}
								onclick={() => ongo(tab)}
							>
								{t.whatsNew.open}<span aria-hidden="true"> ›</span>
							</button>
						{/if}
					</div>
				</li>
			{/each}
		</ol>

		{#if WHATS_NEW.length > SHOWN}
			<button type="button" class="wn-more font-head" aria-expanded={all} onclick={() => (all = !all)}>
				{all ? t.whatsNew.less : t.whatsNew.all(WHATS_NEW.length)}
			</button>
		{/if}
	</div>
</section>

<style>
	.wn {
		--wn-c: var(--t-accent);
		position: relative;
		width: 100%;
		max-width: 460px;
		padding: 7px;
		border-radius: calc(var(--t-radius, 10px) + 6px);
		background: var(--t-panel);
		border: 1px solid var(--t-line);
		box-shadow: var(--t-shadow);
		color: var(--t-fg);
	}
	.wn-board {
		position: relative;
		border-radius: var(--t-radius, 10px);
		border: 1px solid var(--t-line);
		background: color-mix(in srgb, var(--t-bg) 70%, transparent);
		padding: 12px 12px 8px;
	}
	.wn-top {
		display: flex;
		align-items: center;
		gap: 10px;
		padding-bottom: 8px;
		border-bottom: 1px dashed var(--t-line);
	}
	.wn-horn {
		flex: none;
		width: 34px;
		height: 34px;
		fill: none;
		stroke: var(--wn-c);
		stroke-width: 2.2;
		stroke-linejoin: round;
		stroke-linecap: round;
		transform: rotate(-10deg);
	}
	.wn-horn path:first-child {
		fill: color-mix(in srgb, var(--wn-c) 25%, transparent);
	}
	.wn-kicker {
		font-size: 10.5px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--t-muted);
		line-height: 1.1;
	}
	.wn-title {
		font-size: 22px;
		line-height: 1.05;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.wn-count {
		margin-left: auto;
		flex: none;
		padding: 3px 9px;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 700;
		background: var(--t-new, var(--wn-c));
		color: var(--t-new-ink, var(--t-on-accent));
	}
	.wn-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.wn-list.open {
		max-height: 420px;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding-right: 4px;
	}
	.wn-item {
		padding: 8px 0;
		border-bottom: 1px solid color-mix(in srgb, var(--t-line) 60%, transparent);
	}
	.wn-item:last-child {
		border-bottom: 0;
	}
	.wn-meta {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 11.5px;
		color: var(--t-muted);
	}
	.wn-kind {
		padding: 1px 7px;
		border-radius: 4px;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border: 1px solid currentColor;
		color: var(--wn-c);
	}
	.wn-item[data-kind='update'] .wn-kind {
		color: var(--t-plat, var(--t-fg));
	}
	.wn-item[data-kind='fix'] .wn-kind {
		color: var(--t-ok, var(--t-fg));
	}
	.wn-new {
		padding: 1px 6px;
		border-radius: 4px;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.08em;
		background: var(--t-new, var(--wn-c));
		color: var(--t-new-ink, var(--t-on-accent));
	}
	.wn-body {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		margin-top: 3px;
	}
	.wn-body > .min-w-0 {
		flex: 1;
	}
	.wn-name {
		font-size: 15px;
		font-weight: 700;
		line-height: 1.25;
	}
	.wn-text {
		margin-top: 1px;
		font-size: 13px;
		line-height: 1.35;
		color: var(--t-muted);
	}
	/* 44 px tap area around a smaller pill */
	.wn-go {
		white-space: nowrap;
		white-space: nowrap;
		flex: none;
		min-height: 44px;
		min-width: 60px;
		margin: -6px -4px -8px 0;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0 4px;
		background: none;
		border: 0;
		color: var(--wn-c);
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		cursor: pointer;
		position: relative;
	}
	.wn-go::before {
		content: '';
		position: absolute;
		inset: 10px 2px;
		border-radius: 999px;
		border: 1px solid currentColor;
		opacity: 0.7;
	}
	.wn-go:hover::before {
		background: color-mix(in srgb, var(--wn-c) 18%, transparent);
	}
	.wn-more {
		display: block;
		width: 100%;
		min-height: 44px;
		margin-top: 2px;
		border: 0;
		border-top: 1px dashed var(--t-line);
		background: none;
		color: var(--wn-c);
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		cursor: pointer;
	}
	.wn-more:hover {
		text-decoration: underline;
	}
	.wn-go:focus-visible,
	.wn-more:focus-visible {
		outline: 2px solid var(--wn-c);
		outline-offset: 2px;
	}
	.wn-bulbs {
		display: none;
	}

	/* ── Abscar: a lit billboard (bulbs chasing round the frame, fire-glow edge like the boxes) ── */
	:global([data-theme='blackout']) .wn {
		--wn-c: #ffb32e;
		padding: 11px;
		background: linear-gradient(160deg, #3a2414, #1c110a 55%, #2a170c);
		border: 2px solid #6b4321;
	}
	:global([data-theme='blackout']) .wn-board {
		background:
			repeating-linear-gradient(0deg, rgb(255 255 255 / 0.025) 0 1px, transparent 1px 3px),
			linear-gradient(180deg, #120b07, #0b0705);
		border-color: #4d3018;
		box-shadow: inset 0 0 18px rgb(0 0 0 / 0.7);
	}
	:global([data-theme='blackout']) .wn-title {
		color: #ffe7a8;
		text-shadow:
			0 0 6px rgb(255 160 40 / 0.85),
			0 0 16px rgb(255 90 20 / 0.55);
	}
	:global([data-theme='blackout']) .wn-bulbs {
		display: block;
		position: absolute;
		inset: 3px;
		border-radius: calc(var(--t-radius, 10px) + 4px);
		pointer-events: none;
		/* a dashed ring of bulbs: two layers take turns, so the light chases */
		background:
			radial-gradient(circle, #fff2c0 0 1.6px, #ffb32e 2.2px, transparent 3.2px) -4.5px -4.5px / 14px 14px;
		-webkit-mask:
			linear-gradient(#000 0 0) content-box exclude,
			linear-gradient(#000 0 0);
		mask:
			linear-gradient(#000 0 0) content-box exclude,
			linear-gradient(#000 0 0);
		padding: 5px;
		filter: drop-shadow(0 0 3px rgb(255 170 40 / 0.9));
		animation: wn-chase 1.4s steps(2) infinite;
	}
	@keyframes wn-chase {
		to {
			background-position: 9.5px -4.5px;
		}
	}
	:global([data-theme='blackout']) .wn-horn .wn-wave {
		animation: wn-wave 1.8s ease-in-out infinite;
	}
	:global([data-theme='blackout']) .wn-horn .wn-wave2 {
		animation-delay: 0.3s;
	}
	@keyframes wn-wave {
		0%,
		100% {
			opacity: 0.25;
		}
		50% {
			opacity: 1;
		}
	}

	/* ── Matrix: phosphor green ── */
	:global([data-theme='matrix']) .wn-title {
		text-shadow: 0 0 8px color-mix(in srgb, var(--t-accent) 70%, transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.wn-bulbs,
		.wn-horn .wn-wave {
			animation: none !important;
		}
	}
	@media (max-width: 420px) {
		.wn-title {
			font-size: 19px;
		}
	}
</style>
