<!--
	BurgiShop's own page tab (2026-11-16, the user: "BurgiShop can have a tab of its own instead of being
	among the casino games"). The same shop as before (ShopSection.svelte: your operator, the kinds, items,
	pranks), in its own box with the shopping bag from the casino's tab pictures and your burgers.
	Outside a squad it points to the Squad tab, like BurgiCasino.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import CasinoTabArt from './CasinoTabArt.svelte';
	import ShopSection from './ShopSection.svelte';

	let { onSquad }: { onSquad?: () => void } = $props();
	const s = t.shop;
	const balance = $derived(squad.myBank?.balance ?? 0);
</script>

<section class="class-card meta-list shop-page overflow-hidden rounded-card bg-panel shadow-card" style:--c="#b265ff" aria-labelledby="shop-h">
	<header class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
		<span class="shop-bag" aria-hidden="true"><CasinoTabArt kind="shop" size={56} /></span>
		<!-- at least 12rem, so on a phone the burgers pill goes to its own line instead of squeezing the name -->
		<div class="flex min-w-[12rem] flex-1 flex-col gap-0.5">
			<h2 id="shop-h" class="shop-title font-head text-xl font-black tracking-wide uppercase">{s.heading}</h2>
			<span class="font-head text-[11px] font-semibold tracking-widest text-muted uppercase">{s.sub}</span>
		</div>
		{#if squad.on}
			<p class="shop-bal font-head" aria-live="polite"><span>{t.casino.balance}</span><b class="num">{t.casino.burgers(balance)}</b></p>
		{/if}
	</header>
	<div class="grid gap-3 border-t border-line px-4 py-4 sm:px-5">
		{#if !squad.on}
			<p class="max-w-3xl text-sm text-fg">{s.notIn}</p>
			<div><button type="button" class="btn btn-primary" onclick={() => onSquad?.()}>{t.casino.toSquad}</button></div>
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
	.shop-bal {
		display: flex;
		align-items: baseline;
		gap: 8px;
		padding: 4px 12px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.3);
		box-shadow: inset 0 0 0 1.5px #b265ff;
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
</style>
