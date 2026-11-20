<!--
	BurgiShop's own page tab (2026-11-16, the user: "BurgiShop can have a tab of its own instead of being
	among the casino games"). The same shop as before (ShopSection.svelte: your operator, the kinds, items,
	pranks), in its own box with the shopping bag from the casino's tab pictures and your burgers.
	Outside a squad it points to the Squad tab, like BurgiCasino.
	Since 2026-11-20 the tab holds two shops (the user: "gör en till shop som är karmashop, där man kommer
	kunna köpa saker med hjärtan"): a switch at the top picks BurgiShop (burgers) or KarmaShop (hearts from
	BurgiGives, KarmaShopSection.svelte). A switch here instead of an eighth page tab keeps the page tabs on one
	row on phones. The pick is remembered per device (`mw4-camo-grind:shop-tab`).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import CasinoTabArt from './CasinoTabArt.svelte';
	import KarmaShopArt from './KarmaShopArt.svelte';
	import KarmaShopSection from './KarmaShopSection.svelte';
	import ShopSection from './ShopSection.svelte';

	let { onSquad }: { onSquad?: () => void } = $props();
	const s = t.shop;
	const k = t.karmaShop;
	const TAB_KEY = 'mw4-camo-grind:shop-tab';
	const balance = $derived(squad.myBank?.balance ?? 0);
	const hearts = $derived(squad.myHearts.balance);
	let shop = $state<'burgi' | 'karma'>('burgi');

	onMount(() => {
		try {
			if (localStorage.getItem(TAB_KEY) === 'karma') shop = 'karma';
		} catch {
			/* private mode: start on BurgiShop */
		}
	});

	function pick(which: 'burgi' | 'karma') {
		shop = which;
		try {
			localStorage.setItem(TAB_KEY, which);
		} catch {
			/* not remembered, still switched */
		}
	}
</script>

<section
	class="class-card meta-list shop-page overflow-hidden rounded-card bg-panel shadow-card"
	class:karma-page={shop === 'karma'}
	style:--c={shop === 'karma' ? '#ff6aa8' : '#b265ff'}
	aria-labelledby="shop-h"
>
	<header class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
		{#if shop === 'karma'}
			<span class="shop-bag" aria-hidden="true"><KarmaShopArt size={56} /></span>
		{:else}
			<span class="shop-bag" aria-hidden="true"><CasinoTabArt kind="shop" size={56} /></span>
		{/if}
		<!-- at least 12rem, so on a phone the burgers pill goes to its own line instead of squeezing the name -->
		<div class="flex min-w-[12rem] flex-1 flex-col gap-0.5">
			<h2 id="shop-h" class="shop-title font-head text-xl font-black tracking-wide uppercase" class:karma-title={shop === 'karma'}>{shop === 'karma' ? k.heading : s.heading}</h2>
			<span class="font-head text-[11px] font-semibold tracking-widest text-muted uppercase">{shop === 'karma' ? k.sub : s.sub}</span>
		</div>
		{#if squad.on}
			{#if shop === 'karma'}
				<p class="shop-bal karma-bal font-head" aria-live="polite"><span>{k.balance}</span><b class="num">{k.hearts(hearts)}</b></p>
			{:else}
				<p class="shop-bal font-head" aria-live="polite"><span>{t.casino.balance}</span><b class="num">{t.casino.burgers(balance)}</b></p>
			{/if}
		{/if}
	</header>
	<div class="grid gap-3 border-t border-line px-4 py-4 sm:px-5">
		<!-- the two shops -->
		<div class="shop-switch" role="group" aria-label={k.switchLabel}>
			<button type="button" class="shop-door" data-shop="burgi" aria-pressed={shop === 'burgi'} onclick={() => pick('burgi')}>
				<span class="shop-door-art" aria-hidden="true"><CasinoTabArt kind="shop" size={40} /></span>
				<span class="min-w-0"><b class="block font-head text-[15px] leading-tight font-black tracking-wide uppercase">{s.heading}</b><span class="block text-[11px] leading-tight">{k.burgiTile}</span></span>
			</button>
			<button type="button" class="shop-door" data-shop="karma" aria-pressed={shop === 'karma'} onclick={() => pick('karma')}>
				<span class="shop-door-art" aria-hidden="true"><KarmaShopArt size={40} alive={shop === 'karma'} /></span>
				<span class="min-w-0"><b class="block font-head text-[15px] leading-tight font-black tracking-wide uppercase">{k.heading}</b><span class="block text-[11px] leading-tight">{k.karmaTile}</span></span>
			</button>
		</div>
		{#if !squad.on}
			<p class="max-w-3xl text-sm text-fg">{s.notIn}</p>
			<div><button type="button" class="btn btn-primary" onclick={() => onSquad?.()}>{t.casino.toSquad}</button></div>
		{:else if shop === 'karma'}
			<KarmaShopSection />
		{:else}
			<ShopSection />
		{/if}
	</div>
</section>

<style>
	.shop-bag {
		display: grid;
		place-items: center;
		width: 64px;
		height: 56px;
	}
	/* the gradient paints the letters; the Abscar theme's heading shadow would cover it (see CasinoSection) */
	.shop-title {
		text-shadow: none !important;
		background: linear-gradient(180deg, #ffffff, #ecd2ff 45%, #c98bff 75%, #ffd23a);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.7)) drop-shadow(0 0 8px rgb(178 101 255 / 0.45));
	}
	.shop-title.karma-title {
		background: linear-gradient(180deg, #ffffff, #ffd6e8 40%, #ff7ab4 70%, #ffd23a);
		-webkit-background-clip: text;
		background-clip: text;
		filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.7)) drop-shadow(0 0 8px rgb(255 106 168 / 0.55));
	}
	.shop-bal {
		display: flex;
		align-items: baseline;
		gap: 8px;
		padding: 4px 12px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.3);
		box-shadow: inset 0 0 0 1.5px #b265ff;
	}
	.shop-bal.karma-bal {
		box-shadow: inset 0 0 0 1.5px #ff6aa8;
	}
	.shop-bal span {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--t-muted);
	}
	.shop-bal b {
		font-size: 18px;
		font-weight: 900;
		color: var(--t-fg);
	}
	/* the switch: two shop fronts with their own colours in every theme */
	.shop-switch {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
		max-width: 560px;
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
	.shop-door[data-shop='karma'] {
		background:
			radial-gradient(80% 120% at 20% 40%, rgb(255 140 190 / 0.35), transparent 65%),
			linear-gradient(160deg, #8e2160, #3a0a2c);
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
	/* phones: a smaller picture and tighter letters, so "KARMASHOP" fits even in the wider theme fonts */
	@media (max-width: 400px) {
		.shop-door {
			gap: 5px;
			padding-inline: 5px 6px;
		}
		.shop-door-art {
			width: 30px;
		}
		.shop-door-art :global(svg) {
			width: 30px;
			height: auto;
		}
		.shop-door b {
			font-size: 13px;
			letter-spacing: 0;
		}
	}
</style>
