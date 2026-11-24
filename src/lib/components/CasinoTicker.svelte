<!--
	BurgiCasino's jackpot ticker (2026-11-20, the user: "lots of dopamine"): an LED board under the sign.
	On the left the biggest win in the squad this week; on the right the newest wins flip by one at a time
	like a departures board ("★ Ingman hit a MEGA WIN on Mybots 5: +184,250 🍔 🍟 · 2 min ago"), a new one
	every 4 s. It reads the squad radio, where every game already posts its big moments (casinoFloor.ts
	floorNews); with no wins yet it shows a few lines about the floor instead. One line at a time, cut
	to the board's width, so nothing ever sticks out of the casino box. The flipping stops while the
	page's pause button is on, while the tab isn't visible, and with reduced motion (the newest line stays).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { motion } from '#lib/motion.svelte.ts';
	import { floorNews, minutesAgo, type FloorGame } from '#lib/casinoFloor.ts';

	const f = t.casino.floor;
	const news = $derived(floorNews(squad.radio?.msgs, squad.now));
	/** a squad member's ad from BurgiShop (shop.ts AD_*, 2026-11-21) flips by between the wins */
	const ad = $derived(squad.on ? squad.ad : null);
	const items = $derived.by(() => {
		const list = news.recent.length
			? news.recent.map((w) => ({ key: w.id, who: w.name, text: w.text, when: f.ago(minutesAgo(w.at, squad.now)), game: w.game as FloorGame | null }))
			: f.promo.map((p, i) => ({ key: `p${i}`, who: '', text: p, when: '', game: null as FloorGame | null }));
		if (!ad) return list;
		const line = { key: `ad${ad.at}`, who: t.shop.ad.tag(ad.name), text: ad.t, when: '', game: null as FloorGame | null };
		return [list[0], line, ...list.slice(1)].filter(Boolean);
	});
	const best = $derived(news.biggest);
	let at = $state(0);
	const shownIdx = $derived(items.length ? at % items.length : 0);
	const item = $derived(items[shownIdx]);
	// a newer win jumps to the front
	let firstKey = '';
	$effect(() => {
		const k = items[0]?.key ?? '';
		if (k !== firstKey) {
			firstKey = k;
			at = 0;
		}
	});
	let box = $state<HTMLElement>();
	$effect(() => {
		if (!box) return;
		const reduce = matchMedia('(prefers-reduced-motion: reduce)');
		const id = setInterval(() => {
			if (motion.still || document.hidden || reduce.matches || !box?.offsetParent || items.length < 2) return;
			at++;
		}, 4000);
		return () => clearInterval(id);
	});
</script>

<div class="ticker" role="region" aria-label={f.ticker} bind:this={box}>
	<div class="tk-best">
		<span class="tk-trophy" aria-hidden="true">🏆</span>
		<span class="tk-best-text">
			<span class="tk-best-label">{f.biggest} <span class="tk-best-sub">{f.biggestSub}</span></span>
			{#if best}
				<span class="tk-best-who"><b>{best.name}</b> <b class="tk-best-amount num">{f.gain(best.amount)} 🍔</b></span>
			{:else}
				<span class="tk-best-who"><b>{f.noBiggest}</b></span>
			{/if}
		</span>
	</div>
	<div class="tk-window">
		{#if item}
			{#key item.key}
				<p class="tk-item" data-game={item.game ?? undefined}>
					<span class="tk-star" aria-hidden="true">★</span>
					<span class="tk-line">{#if item.who}<b class="tk-who">{item.who}</b>{' '}{/if}{item.text}</span>
					{#if item.when}<span class="tk-when">· {item.when}</span>{/if}
				</p>
			{/key}
		{/if}
		{#if items.length > 1}
			<span class="tk-dots" aria-hidden="true">
				{#each items as it, i (it.key)}<span class:on={i === shownIdx}></span>{/each}
			</span>
		{/if}
	</div>
</div>

<style>
	.ticker {
		display: flex;
		flex-wrap: wrap;
		align-items: stretch;
		gap: 8px;
		padding: 7px;
		border-radius: 12px;
		background: linear-gradient(180deg, #2a1a08, #120a02);
		box-shadow:
			inset 0 0 0 1.5px rgb(255 201 40 / 0.7),
			inset 0 0 0 3px rgb(0 0 0 / 0.6),
			0 4px 10px rgb(0 0 0 / 0.35);
		color: #ffd76a;
	}
	/* the dot-matrix LED glass both parts sit on */
	.tk-best,
	.tk-window {
		border-radius: 8px;
		background:
			radial-gradient(circle, rgb(255 190 60 / 0.09) 0 1px, transparent 1.6px) 0 0 / 4px 4px,
			linear-gradient(180deg, #0b0602, #050200);
		box-shadow: inset 0 1px 6px rgb(0 0 0 / 0.9);
	}
	.tk-best {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 6px 14px 6px 10px;
		flex: 1 1 100%;
		min-width: 0;
	}
	@media (min-width: 720px) {
		.tk-best {
			flex: 0 1 auto;
			max-width: 44%;
		}
	}
	.tk-trophy {
		font-size: 22px;
		line-height: 1;
		filter: drop-shadow(0 0 6px rgb(255 200 60 / 0.7));
	}
	.tk-best-text {
		display: grid;
		min-width: 0;
		line-height: 1.2;
	}
	.tk-best-label {
		font-family: var(--t-font-head);
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #ff9a3c;
	}
	.tk-best-sub {
		color: #b98a4a;
	}
	.tk-best-who {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-family: var(--t-font-head);
		font-size: 15px;
		color: #fff3c4;
		text-shadow: 0 0 8px rgb(255 190 60 / 0.55);
	}
	.tk-best-amount {
		color: #7dff6a;
		text-shadow: 0 0 8px rgb(125 255 106 / 0.6);
	}
	.tk-window {
		position: relative;
		flex: 1 1 14rem;
		min-width: 0;
		min-height: 44px;
		overflow: hidden;
		display: flex;
		align-items: center;
		padding: 4px 12px 8px;
	}
	.tk-item {
		display: flex;
		align-items: baseline;
		gap: 7px;
		min-width: 0;
		width: 100%;
		margin: 0;
		font-family: var(--t-font-head);
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: #ffd76a;
		text-shadow: 0 0 6px rgb(255 180 40 / 0.55);
		animation: tk-flip 0.5s cubic-bezier(0.2, 0.8, 0.3, 1.15);
	}
	@keyframes tk-flip {
		from {
			opacity: 0;
			transform: translateY(70%);
			filter: brightness(2.2);
		}
		to {
			opacity: 1;
			transform: translateY(0);
			filter: brightness(1);
		}
	}
	.tk-line {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tk-star {
		flex: none;
		color: #ff5ca8;
		text-shadow: 0 0 6px rgb(255 92 168 / 0.8);
	}
	.tk-who {
		color: #fff6d0;
	}
	/* the time stays whole after the line (the line is what gets cut on a narrow screen) */
	.tk-when {
		flex: none;
		white-space: nowrap;
		color: #b98a4a;
		font-weight: 600;
	}
	.tk-item[data-game='slots'] .tk-star {
		color: #ff4b3a;
		text-shadow: 0 0 6px rgb(255 75 58 / 0.8);
	}
	.tk-item[data-game='fortune2'] .tk-star {
		color: #7dff6a;
		text-shadow: 0 0 6px rgb(125 255 106 / 0.8);
	}
	.tk-item[data-game='stash'] .tk-star {
		color: #d6a8ff;
		text-shadow: 0 0 6px rgb(190 130 255 / 0.8);
	}
	.tk-item[data-game='skeddwood'] .tk-star {
		color: #ffb347;
		text-shadow: 0 0 6px rgb(255 160 60 / 0.8);
	}
	.tk-item[data-game='cases'] .tk-star {
		color: #ffd23a;
		text-shadow: 0 0 6px rgb(255 210 58 / 0.8);
	}
	.tk-item[data-game='roulette'] .tk-star {
		color: #3ee06a;
	}
	.tk-item[data-game='blackjack'] .tk-star {
		color: #2de2e6;
		text-shadow: 0 0 6px rgb(45 226 230 / 0.8);
	}
	/* which line is up: small LEDs along the bottom */
	.tk-dots {
		position: absolute;
		left: 12px;
		bottom: 4px;
		display: flex;
		gap: 4px;
	}
	.tk-dots span {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: rgb(255 190 60 / 0.25);
	}
	.tk-dots span.on {
		background: #ffd76a;
		box-shadow: 0 0 5px #ffb000;
	}
	@media (prefers-reduced-motion: reduce) {
		.tk-item {
			animation: none;
		}
	}
</style>
