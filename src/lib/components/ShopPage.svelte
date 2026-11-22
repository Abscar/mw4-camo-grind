<!--
	BurgiShop's own page tab (2026-11-16, the user: "BurgiShop can have a tab of its own instead of being
	among the casino games"). The shop itself is ShopSection.svelte (your operator, the kinds, items, pranks).
	Outside a squad it points to the Squad tab, like BurgiCasino.
	Since 2026-11-20 the tab holds three shops behind doors at the top: BurgiShop (burgers), the Camo Armory
	(ArmorySection.svelte, armory.ts: camo guns your operator holds) and KarmaShop (hearts from BurgiGives,
	KarmaShopSection.svelte). A switch here instead of more page tabs keeps the page tabs on one row on phones.
	The pick is remembered per device (`mw4-camo-grind:shop-tab`).

	The munchie-dispensary look (2026-11-20, the user: "snygga till burgishop sidan, få den att se riktigt
	cool, rolig, drogig och najs ut, den e väldigt tråkig atm"): its own dark trippy look in every theme (the
	theme colours are re-set on .shop-page, like the casino), a slowly turning blurred rainbow swirl and a faint
	leaf pattern behind everything, a few leaves and smoke puffs drifting up, a flickering neon sign (the open
	shop's name), a wallet with a spinning coin and a scrolling ticker. Only transform / opacity animations
	(cheap to draw), nothing moves with reduced motion, and the hidden tab costs nothing.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '#lib/i18n/en.ts';
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { camoLook } from '#lib/data/weaponLooks.ts';
	import { owns } from '#lib/shop.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import ArmorySection from './ArmorySection.svelte';
	import CasinoTabArt from './CasinoTabArt.svelte';
	import DripDoorArt from './DripDoorArt.svelte';
	import DripSection from './DripSection.svelte';
	import KarmaShopArt from './KarmaShopArt.svelte';
	import KarmaShopSection from './KarmaShopSection.svelte';
	import ShopSection from './ShopSection.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	let { onSquad }: { onSquad?: () => void } = $props();
	const s = t.shop;
	const k = t.karmaShop;
	const ar = t.armory;
	const dr = t.drip;
	const TAB_KEY = 'mw4-camo-grind:shop-tab';
	const balance = $derived(squad.myBank?.balance ?? 0);
	const hearts = $derived(squad.myHearts.balance);
	/** the armory door's picture: a gold rifle */
	const DOOR_GUN = camoLook('patriot-xmr');
	type Door = 'burgi' | 'armory' | 'karma' | 'drip';
	let shop = $state<Door>('burgi');

	const heading = $derived(shop === 'karma' ? k.heading : shop === 'armory' ? ar.heading : shop === 'drip' ? dr.heading : s.heading);
	/** the sign's letters: the second word (SHOP / ARMORY) in the second neon colour, one letter flickers */
	const sign = $derived.by(() => {
		// the letters keep their spelling (the page text says "KarmaShop"); CSS shows them in capitals
		const at = heading.includes(' ') ? heading.indexOf(' ') : heading.includes('Drip') ? heading.lastIndexOf('Drip') : heading.lastIndexOf('Shop');
		return [...heading].map((ch, i) => ({ ch, two: at > 0 && i >= at, gap: ch === ' ' }));
	});
	const FLICKER = 6;
	/** things drifting up behind the shop: leaf or smoke, where (%), how big, delay, duration */
	const DRIFT = [
		{ k: 'leaf', x: 6, s: 22, d: 0, t: 19 },
		{ k: 'puff', x: 18, s: 70, d: -6, t: 23 },
		{ k: 'leaf', x: 34, s: 16, d: -11, t: 21 },
		{ k: 'puff', x: 52, s: 90, d: -3, t: 27 },
		{ k: 'leaf', x: 68, s: 26, d: -15, t: 24 },
		{ k: 'puff', x: 82, s: 64, d: -9, t: 22 },
		{ k: 'leaf', x: 93, s: 18, d: -4, t: 20 }
	];

	// the sound pack you wear plays on your ticks (this page is always mounted, even while hidden)
	$effect(() => {
		sound.pack = squad.shop?.eq.sound && owns(squad.shop, squad.shop.eq.sound) ? squad.shop.eq.sound : null;
	});
	/** the ad running on the ticker (shop.ts adOf), shown first */
	const ad = $derived(squad.on ? squad.ad : null);

	onMount(() => {
		try {
			const saved = localStorage.getItem(TAB_KEY);
			if (saved === 'karma' || saved === 'armory' || saved === 'drip') shop = saved;
		} catch {
			/* private mode: start on BurgiShop */
		}
	});

	function pick(which: Door) {
		shop = which;
		try {
			localStorage.setItem(TAB_KEY, which);
		} catch {
			/* not remembered, still switched */
		}
	}
</script>

<section
	class="class-card shop-page relative overflow-hidden rounded-card shadow-card"
	class:karma-page={shop === 'karma'}
	data-shop={shop}
	style:--c={shop === 'karma' ? '#ff6aa8' : shop === 'drip' ? '#ff2a3a' : '#b265ff'}
	aria-labelledby="shop-h"
>
	<!-- the backdrop: a turning rainbow swirl, a faint leaf pattern, drifting leaves and smoke -->
	<div class="sp-trip" aria-hidden="true">
		<span class="sp-swirl"></span>
		<span class="sp-leaves"></span>
		{#each DRIFT as d, i (i)}
			<span class="sp-drift" data-k={d.k} style:left="{d.x}%" style:--sz="{d.s}px" style:animation-delay="{d.d}s" style:animation-duration="{d.t}s">
				{#if d.k === 'leaf'}
					<svg viewBox="0 0 24 24" width="100%" height="100%"
						>{#each LEAF_PATHS as p, j (j)}<path d={p} fill={i % 4 ? '#5fe06a' : '#c8ff5a'} />{/each}<path d={LEAF_STEM} stroke="#2c8a3a" stroke-width="1.4" /></svg
					>
				{/if}
			</span>
		{/each}
	</div>

	<header class="sp-head relative flex flex-wrap items-center gap-x-4 gap-y-3 px-4 pt-5 pb-3 sm:px-5">
		{#if shop === 'karma'}
			<span class="shop-bag" aria-hidden="true"><KarmaShopArt size={58} /></span>
		{:else if shop === 'armory' && DOOR_GUN}
			<span class="shop-bag shop-gun" aria-hidden="true"><WeaponIcon look={DOOR_GUN} camo="gold" /></span>
		{:else if shop === 'drip'}
			<span class="shop-bag shop-drip" aria-hidden="true"><DripDoorArt size={58} /></span>
		{:else}
			<span class="shop-bag" aria-hidden="true"><CasinoTabArt kind="shop" size={58} /></span>
		{/if}
		<!-- at least 13rem, so on a phone the wallet goes to its own line instead of squeezing the sign -->
		<div class="flex min-w-[13rem] flex-1 flex-col gap-1">
			<h2 id="shop-h" class="sp-sign shop-title font-head" class:karma-title={shop === 'karma'} class:armory-title={shop === 'armory'} class:drip-title={shop === 'drip'} data-shop={shop} aria-label={heading}>
				{#each sign as l, i (i)}<span class="sp-l" class:sp-two={l.two} class:sp-gap={l.gap} class:sp-flicker={i === FLICKER} aria-hidden="true"
						>{l.gap ? ' ' : l.ch}</span
					>{/each}
			</h2>
			<span class="sp-sub font-head">{shop === 'karma' ? k.sub : shop === 'armory' ? ar.sub : shop === 'drip' ? dr.sub : s.sub}</span>
			{#if shop === 'burgi'}<span class="sp-sub sp-vibe font-head">{s.vibe}</span>{/if}
		</div>
		{#if squad.on}
			{#if shop === 'karma'}
				<p class="shop-bal karma-bal font-head" aria-live="polite">
					<span class="sp-coin" aria-hidden="true">❤️</span><span class="sp-bal-word">{k.balance}</span><b class="num">{k.hearts(hearts)}</b>
				</p>
			{:else}
				<p class="shop-bal font-head" aria-live="polite">
					<span class="sp-coin" aria-hidden="true"
						><svg viewBox="0 0 24 24" width="26" height="26"
							><circle cx="12" cy="12" r="11" fill="url(#sp-gold)" stroke="#7a5208" stroke-width="1.2" /><defs
								><radialGradient id="sp-gold" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff6b0" /><stop offset="0.55" stop-color="#ffc928" /><stop offset="1" stop-color="#a8740c" /></radialGradient
								></defs
							><path d="M6.5 11c0-3 2.5-4.6 5.5-4.6s5.5 1.6 5.5 4.6z" fill="#c9822a" /><rect x="6.2" y="11.6" width="11.6" height="1.6" fill="#4fb23a" /><rect x="6.4" y="13.3" width="11.2" height="1.8" rx="0.8" fill="#6b3a1c" /><path
								d="M6.6 15.6h10.8c0 1.6-1 2.4-2.6 2.4H9.2c-1.6 0-2.6-.8-2.6-2.4z"
								fill="#c9822a"
							/></svg
						></span
					><span class="sp-bal-word">{t.casino.balance}</span><b class="num">{t.casino.burgers(balance)}</b>
				</p>
			{/if}
		{/if}
	</header>

	<!-- a ticker of what's hot (pauses under the mouse) -->
	<div class="sp-ticker font-head" aria-hidden="true">
		<div class="sp-tick-run">
			{#each [0, 1] as copy (copy)}
				<span class="sp-tick-set"
					>{#if ad}<span class="sp-tick-item sp-tick-ad">{s.ad.tag(ad.name)} {ad.t}</span>{/if}{#each s.ticker as line (line)}<span class="sp-tick-item">{line}</span>{/each}</span
				>
			{/each}
		</div>
	</div>

	<div class="sp-body relative grid gap-3 px-4 py-4 sm:px-5">
		<!-- the three shops -->
		<div class="shop-switch" role="group" aria-label={k.switchLabel}>
			<button type="button" class="shop-door" data-shop="burgi" aria-pressed={shop === 'burgi'} onclick={() => pick('burgi')}>
				<span class="shop-door-art" aria-hidden="true"><CasinoTabArt kind="shop" size={40} /></span>
				<span class="min-w-0"><b class="block font-head text-[15px] leading-tight font-black tracking-wide uppercase">{s.heading}</b><span class="door-sub block text-[11px] leading-tight">{k.burgiTile}</span></span>
			</button>
			<button type="button" class="shop-door" data-shop="armory" aria-pressed={shop === 'armory'} onclick={() => pick('armory')}>
				<span class="shop-door-art shop-door-gun" aria-hidden="true">{#if DOOR_GUN}<WeaponIcon look={DOOR_GUN} camo="gold" />{/if}</span>
				<span class="min-w-0"><b class="block font-head text-[15px] leading-tight font-black tracking-wide uppercase">{ar.heading}</b><span class="door-sub block text-[11px] leading-tight">{ar.door}</span></span>
			</button>
			<button type="button" class="shop-door" data-shop="karma" aria-pressed={shop === 'karma'} onclick={() => pick('karma')}>
				<span class="shop-door-art" aria-hidden="true"><KarmaShopArt size={40} alive={shop === 'karma'} /></span>
				<span class="min-w-0"><b class="block font-head text-[15px] leading-tight font-black tracking-wide uppercase">{k.heading}</b><span class="door-sub block text-[11px] leading-tight">{k.karmaTile}</span></span>
			</button>
			<button type="button" class="shop-door" data-shop="drip" aria-pressed={shop === 'drip'} onclick={() => pick('drip')}>
				<span class="shop-door-art" aria-hidden="true"><DripDoorArt size={40} /></span>
				<span class="min-w-0"><b class="block font-head text-[15px] leading-tight font-black tracking-wide uppercase">{dr.heading}</b><span class="door-sub block text-[11px] leading-tight">{dr.door}</span></span>
			</button>
		</div>
		{#if !squad.on}
			<p class="max-w-3xl text-sm text-fg">{s.notIn}</p>
			<div><button type="button" class="btn btn-primary" onclick={() => onSquad?.()}>{t.casino.toSquad}</button></div>
		{:else if shop === 'karma'}
			<KarmaShopSection />
		{:else if shop === 'armory'}
			<ArmorySection />
		{:else if shop === 'drip'}
			<DripSection />
		{:else}
			<ShopSection />
		{/if}
	</div>
</section>

<style>
	/* ---------- its own colours in every theme: a dark purple dispensary with neon green ---------- */
	.shop-page {
		--t-bg: #0d0518;
		--t-fg: #f6eeff;
		--t-muted: #c9b4e8;
		--t-panel: rgb(26 10 46 / 0.86);
		--t-panel-2: rgb(34 14 60 / 0.8);
		--t-line: rgb(196 150 255 / 0.3);
		--t-accent: #4dff8f;
		--t-on-accent: #05140a;
		--t-buff: #4dff8f;
		color: var(--t-fg);
		background:
			radial-gradient(90% 60% at 10% 0%, rgb(255 60 170 / 0.22), transparent 60%),
			radial-gradient(80% 60% at 100% 30%, rgb(60 255 140 / 0.14), transparent 60%),
			radial-gradient(90% 70% at 50% 110%, rgb(90 70 255 / 0.25), transparent 60%),
			linear-gradient(170deg, #1a0733 0%, #10051f 55%, #08030f 100%);
		border: 2px solid transparent;
		box-shadow:
			0 0 0 2px rgb(196 120 255 / 0.55),
			0 0 22px rgb(178 101 255 / 0.4),
			0 0 50px rgb(77 255 143 / 0.12);
	}
	.shop-page[data-shop='karma'] {
		box-shadow:
			0 0 0 2px rgb(255 106 168 / 0.6),
			0 0 22px rgb(255 106 168 / 0.4),
			0 0 50px rgb(255 210 58 / 0.12);
	}
	.shop-page[data-shop='armory'] {
		box-shadow:
			0 0 0 2px rgb(255 201 40 / 0.55),
			0 0 22px rgb(255 190 40 / 0.35),
			0 0 50px rgb(77 255 143 / 0.12);
	}
	.shop-page[data-shop='drip'] {
		box-shadow:
			0 0 0 2px rgb(255 42 58 / 0.6),
			0 0 22px rgb(255 42 58 / 0.35),
			0 0 50px rgb(255 255 255 / 0.08);
	}
	/* ---------- the backdrop ---------- */
	.sp-trip {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
	}
	/* a big blurred rainbow swirl turning very slowly (one composited layer) */
	.sp-swirl {
		position: absolute;
		left: 50%;
		top: 40%;
		width: 160vmax;
		height: 160vmax;
		margin: -80vmax 0 0 -80vmax;
		background: conic-gradient(from 0deg, #ff3cac, #ffd23a, #4dff8f, #2be0ff, #8b5cff, #ff3cac);
		filter: blur(90px);
		opacity: 0.2;
		will-change: transform;
		animation: sp-spin 80s linear infinite;
	}
	/* a faint pattern of leaves over the dark (static) */
	.sp-leaves {
		position: absolute;
		inset: 0;
		opacity: 0.07;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'%3E%3Cg fill='%23b6ff6a'%3E%3Cpath d='M20 34c-1-7 0-13 2-18 2 5 3 11 2 18zM20 34c-5-4-8-9-9-14 4 2 8 6 10 13zM20 34c5-4 8-9 9-14-4 2-8 6-10 13zM20 34c-6-1-10-4-12-7 4 0 9 2 12 6zM20 34c6-1 10-4 12-7-4 0-9 2-12 6z'/%3E%3Cpath d='M64 78c-1-7 0-13 2-18 2 5 3 11 2 18zM64 78c-5-4-8-9-9-14 4 2 8 6 10 13zM64 78c5-4 8-9 9-14-4 2-8 6-10 13zM64 78c-6-1-10-4-12-7 4 0 9 2 12 6zM64 78c6-1 10-4 12-7-4 0-9 2-12 6z'/%3E%3C/g%3E%3C/svg%3E");
		background-size: 90px 90px;
	}
	/* leaves and smoke drifting up from the bottom, swaying */
	.sp-drift {
		position: absolute;
		bottom: -12%;
		width: var(--sz);
		height: var(--sz);
		opacity: 0;
		animation: sp-up 22s linear infinite;
		will-change: transform, opacity;
	}
	.sp-drift[data-k='puff'] {
		border-radius: 50%;
		background: radial-gradient(circle, rgb(230 220 255 / 0.32), rgb(200 180 255 / 0.12) 55%, transparent 72%);
	}
	@keyframes sp-up {
		0% {
			transform: translate(0, 0) rotate(0deg);
			opacity: 0;
		}
		10% {
			opacity: 0.55;
		}
		50% {
			transform: translate(28px, -55vh) rotate(160deg);
		}
		90% {
			opacity: 0.4;
		}
		100% {
			transform: translate(-18px, -115vh) rotate(320deg);
			opacity: 0;
		}
	}
	@keyframes sp-spin {
		to {
			transform: rotate(360deg);
		}
	}
	/* ---------- the head: bag, neon sign, wallet ---------- */
	.sp-head,
	.sp-body,
	.sp-ticker {
		z-index: 1;
	}
	.shop-bag {
		display: grid;
		place-items: center;
		width: 66px;
		height: 60px;
		filter: drop-shadow(0 0 10px rgb(255 60 172 / 0.6));
		animation: sp-bob 3.2s ease-in-out infinite;
	}
	.shop-gun :global(.weapon-icon) {
		width: 64px;
		height: auto;
		transform: rotate(-14deg);
		filter: drop-shadow(0 0 4px rgb(255 196 60 / 0.6)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.7));
	}
	@keyframes sp-bob {
		50% {
			transform: translateY(-4px) rotate(-4deg);
		}
	}
	/* the neon sign: pink tubes with a white-hot core, the second word green, one letter on the blink */
	.sp-sign {
		display: flex;
		flex-wrap: wrap;
		margin: 0;
		color: #fff4fb;
		font-size: clamp(30px, 7.2vw, 46px);
		font-weight: 900;
		letter-spacing: 0.06em;
		line-height: 1;
		text-transform: uppercase;
		text-shadow:
			0 0 4px #fff,
			0 0 10px #ff4fd8,
			0 0 22px #ff2fb3,
			0 0 40px #b14dff !important;
	}
	.sp-gap {
		width: 0.35em;
	}
	.sp-two {
		color: #f2fff6;
		text-shadow:
			0 0 4px #fff,
			0 0 10px #4dff8f,
			0 0 22px #1fd86a,
			0 0 40px #12a64e;
	}
	/* KarmaShop: pink + gold; the Armory: gold + green */
	.sp-sign[data-shop='karma'] .sp-two {
		color: #fffbe8;
		text-shadow:
			0 0 4px #fff,
			0 0 10px #ffd23a,
			0 0 22px #ffb000,
			0 0 40px #ff8a00;
	}
	/* BurgiDrip: hype red + a white-hot DRIP */
	.sp-sign[data-shop='drip'] .sp-l:not(.sp-two) {
		color: #fff0f0;
		text-shadow:
			0 0 4px #fff,
			0 0 10px #ff3a4a,
			0 0 22px #ff1a2a,
			0 0 40px #b80010;
	}
	.sp-sign[data-shop='drip'] .sp-two {
		color: #ffffff;
		text-shadow:
			0 0 4px #fff,
			0 0 10px #ffffff,
			0 0 22px #9aa4ff,
			0 0 40px #5a64ff;
	}
	.sp-sign[data-shop='armory'] .sp-l:not(.sp-two) {
		color: #fffbe8;
		text-shadow:
			0 0 4px #fff,
			0 0 10px #ffd23a,
			0 0 22px #ffb000,
			0 0 40px #ff8a00;
	}
	.sp-flicker {
		animation: sp-flicker 5s steps(1) infinite;
	}
	@keyframes sp-flicker {
		0%,
		18%,
		22%,
		54%,
		57%,
		100% {
			opacity: 1;
		}
		20%,
		55% {
			opacity: 0.25;
		}
	}
	.sp-sub {
		color: #b9ffcf;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		text-shadow: 0 0 8px rgb(77 255 143 / 0.6);
	}
	.sp-vibe {
		color: #ffb3ec;
		font-size: 10px;
		text-shadow: 0 0 8px rgb(255 79 216 / 0.6);
	}
	@media (max-width: 639px) {
		.sp-sub {
			font-size: 9.5px;
			letter-spacing: 0.12em;
		}
	}
	/* the wallet: a coin spinning on its edge + your burgers (or hearts) */
	.shop-bal {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 14px 6px 8px;
		border-radius: 999px;
		background: linear-gradient(180deg, rgb(40 14 70 / 0.9), rgb(14 6 26 / 0.9));
		box-shadow:
			inset 0 0 0 1.5px #ffc928,
			0 0 14px rgb(255 201 40 / 0.35);
	}
	.shop-bal.karma-bal {
		box-shadow:
			inset 0 0 0 1.5px #ff6aa8,
			0 0 14px rgb(255 106 168 / 0.4);
	}
	.sp-coin {
		display: grid;
		place-items: center;
		font-size: 20px;
		line-height: 1;
		animation: sp-coin 3s linear infinite;
	}
	@keyframes sp-coin {
		to {
			transform: rotateY(360deg);
		}
	}
	.sp-bal-word {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--t-muted);
	}
	.shop-bal b {
		font-size: 19px;
		font-weight: 900;
		color: #ffe27a;
		text-shadow: 0 0 10px rgb(255 201 40 / 0.6);
	}
	.shop-bal.karma-bal b {
		color: #ffc2dc;
		text-shadow: 0 0 10px rgb(255 106 168 / 0.6);
	}
	/* ---------- the ticker ---------- */
	.sp-ticker {
		position: relative;
		overflow: hidden;
		border-block: 1.5px solid rgb(77 255 143 / 0.45);
		background: rgb(4 20 10 / 0.7);
		color: #b9ffcf;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		white-space: nowrap;
	}
	.sp-tick-run {
		display: flex;
		width: max-content;
		animation: sp-tick 48s linear infinite;
	}
	.sp-ticker:hover .sp-tick-run {
		animation-play-state: paused;
	}
	.sp-tick-set {
		display: flex;
	}
	.sp-tick-item {
		padding: 7px 22px;
		text-shadow: 0 0 6px rgb(77 255 143 / 0.6);
	}
	.sp-tick-item:nth-child(3n + 2) {
		color: #ffb3ec;
		text-shadow: 0 0 6px rgb(255 79 216 / 0.6);
	}
	.sp-tick-item:nth-child(3n) {
		color: #ffe27a;
		text-shadow: 0 0 6px rgb(255 201 40 / 0.6);
	}
	/* a squad member's paid ad: white on a magenta plate */
	.sp-tick-item.sp-tick-ad {
		margin: 3px 10px;
		padding: 4px 14px;
		border-radius: 999px;
		background: linear-gradient(90deg, #ff2fb3, #b14dff);
		color: #fff;
		text-shadow: 0 1px 1px rgb(0 0 0 / 0.5);
		text-transform: none;
		letter-spacing: 0.04em;
	}
	@keyframes sp-tick {
		to {
			transform: translateX(-50%);
		}
	}
	/* ---------- the switch: three shop fronts with their own colours ---------- */
	.shop-switch {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
		max-width: 1060px;
	}
	.shop-door {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 58px;
		padding: 6px 12px 6px 8px;
		border: 2px solid rgb(255 255 255 / 0.12);
		border-radius: 12px;
		color: #fff;
		text-align: left;
		opacity: 0.78;
		transition:
			opacity 0.15s,
			box-shadow 0.15s,
			border-color 0.15s;
	}
	.shop-door span span {
		color: rgb(255 255 255 / 0.82);
	}
	.shop-door[data-shop='burgi'] {
		background: linear-gradient(160deg, #4a1c7a, #1e0a34);
	}
	.shop-door[data-shop='armory'] {
		background:
			radial-gradient(80% 120% at 20% 40%, rgb(255 201 40 / 0.28), transparent 65%),
			linear-gradient(160deg, #4a3a14, #1a1408);
	}
	.shop-door-gun :global(.weapon-icon) {
		width: 46px;
		height: auto;
		transform: rotate(-14deg);
		filter: drop-shadow(0 0 3px rgb(255 196 60 / 0.55));
	}
	.shop-door[data-shop='karma'] {
		background:
			radial-gradient(80% 120% at 20% 40%, rgb(255 140 190 / 0.35), transparent 65%),
			linear-gradient(160deg, #8e2160, #3a0a2c);
	}
	.shop-door[data-shop='drip'] {
		background:
			radial-gradient(80% 120% at 20% 40%, rgb(255 42 58 / 0.32), transparent 65%),
			repeating-linear-gradient(135deg, rgb(255 255 255 / 0.04) 0 5px, transparent 5px 10px),
			linear-gradient(160deg, #2a2a30, #0c0c0e);
	}
	.shop-door:hover {
		opacity: 1;
	}
	.shop-door[aria-pressed='true'] {
		opacity: 1;
		border-color: #ffd23a;
		box-shadow:
			0 0 0 1px rgb(255 210 58 / 0.4),
			0 0 16px rgb(255 210 58 / 0.3);
	}
	.shop-door-art {
		display: grid;
		flex: none;
		place-items: center;
		width: 44px;
		height: 40px;
	}
	/* four doors: two by two until there's room for all four with their small lines */
	@media (max-width: 899px) {
		.shop-switch {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			max-width: 640px;
		}
	}
	/* narrower: the doors two by two, each with its picture above the name (no small line), so
	   "KARMASHOP" and "CAMO ARMORY" fit even in the wider theme fonts */
	@media (max-width: 639px) {
		.shop-door {
			flex-direction: column;
			justify-content: center;
			gap: 2px;
			padding: 6px 4px;
			text-align: center;
		}
		.shop-door .door-sub {
			display: none;
		}
		.shop-door-art {
			width: 44px;
			height: 34px;
		}
		.shop-door-art :global(svg) {
			max-width: 40px;
			height: auto;
		}
		.shop-door-gun :global(.weapon-icon) {
			width: 42px;
		}
		.shop-door b {
			font-size: 12px;
			letter-spacing: 0.02em;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.sp-swirl,
		.sp-drift,
		.shop-bag,
		.sp-flicker,
		.sp-coin,
		.sp-tick-run {
			animation: none;
		}
		.sp-drift {
			display: none;
		}
		/* the ticker can't scroll: let it wrap instead */
		.sp-tick-run {
			width: auto;
			flex-wrap: wrap;
			white-space: normal;
		}
		.sp-tick-set + .sp-tick-set {
			display: none;
		}
	}
</style>
