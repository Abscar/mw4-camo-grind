<!--
	BurgiCasino's blackjack (squad-casino.ts; 2026-11-16): six decks, hit / stand / double, the dealer
	draws to 17 and stands on a soft 17, blackjack pays 3:2, the dealer checks for blackjack at once.
	Our own drawn cards (rank + suit). The stake is set aside while the hand is played (`hidden`) and
	the result booked when it ends (squad.recordGame). Pretend burgers.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import {
		dealerPlays,
		handNet,
		handResult,
		handValue,
		isBlackjack,
		newShoe,
		rankLabel,
		CASINO_MAX_BET,
		RESHUFFLE_AT,
		SUIT_SYMBOL,
		type Card,
		type HandResult
	} from '#lib/squad-casino.ts';
	import { toast } from '#lib/toast.svelte.ts';

	let { balance, hidden = $bindable(0) }: { balance: number; hidden?: number } = $props();
	const b = t.casino.blackjack;
	const rand = () => {
		const a = new Uint32Array(1);
		crypto.getRandomValues(a);
		return a[0] / 0x1_0000_0000;
	};

	const BETS = [5, 10, 25, 50, 100, 250, 500];
	let stake = $state(10);
	let shoe: Card[] = newShoe(rand);
	let player = $state<Card[]>([]);
	let dealer = $state<Card[]>([]);
	let phase = $state<'bet' | 'play' | 'done'>('bet');
	let doubled = $state(false);
	let result = $state<HandResult | null>(null);
	let net = $state(0);
	let shuffled = $state(false);

	$effect(() => {
		hidden = phase === 'play' ? stake * (doubled ? 2 : 1) : 0;
	});
	$effect(() => () => (hidden = 0));
	const free = $derived(Math.max(0, balance - (phase === 'play' ? stake * (doubled ? 2 : 1) : 0)));

	function draw(): Card {
		if (shoe.length < RESHUFFLE_AT) {
			shoe = newShoe(rand);
			shuffled = true;
		}
		return shoe.pop()!;
	}

	function deal() {
		if (stake > balance || stake > CASINO_MAX_BET) {
			toast.show(t.casino.broke, undefined, 5000);
			return;
		}
		shuffled = false;
		doubled = false;
		result = null;
		net = 0;
		player = [draw(), draw()];
		dealer = [draw(), draw()];
		phase = 'play';
		// a blackjack on either side ends the hand at once (the dealer checks the hole card)
		if (isBlackjack(player) || isBlackjack(dealer)) finish(false);
	}

	function hit() {
		player = [...player, draw()];
		if (handValue(player).total > 21) finish(false);
		else if (handValue(player).total === 21) stand();
	}

	function stand() {
		finish(true);
	}

	function double() {
		if (stake * 2 > balance) {
			toast.show(t.casino.broke, undefined, 5000);
			return;
		}
		doubled = true;
		player = [...player, draw()];
		finish(handValue(player).total <= 21);
	}

	function finish(dealerDraws: boolean) {
		if (dealerDraws) dealer = dealerPlays(dealer, draw);
		result = handResult(player, dealer);
		net = handNet(result, stake, doubled);
		phase = 'done';
		squad.recordGame(net);
		if (net > 0) sound.play(result === 'blackjack' || net >= 100 ? 'maxed' : 'camo');
		if (result === 'blackjack' || Math.abs(net) >= 100) squad.casinoNews(t.casino.event.blackjack(net, result === 'blackjack'));
	}

	const cardText = (c: Card) => `${rankLabel(c.r)}${SUIT_SYMBOL[c.s]}`;
	const hideHole = $derived(phase === 'play');
	const dealerShown = $derived(hideHole ? dealer.slice(0, 1) : dealer);
	const pv = $derived(handValue(player));
	const dv = $derived(handValue(dealerShown));
	const canDouble = $derived(phase === 'play' && player.length === 2 && stake * 2 <= balance);
</script>

{#snippet card(c: Card | null, i: number)}
	{#if c}
		<span class="bj-card" data-red={c.s === 'H' || c.s === 'D'} style:--i={i}>
			<span class="bj-corner">{rankLabel(c.r)}<br />{SUIT_SYMBOL[c.s]}</span>
			<span class="bj-pip">{SUIT_SYMBOL[c.s]}</span>
			<span class="bj-corner bj-flip">{rankLabel(c.r)}<br />{SUIT_SYMBOL[c.s]}</span>
		</span>
	{:else}
		<span class="bj-card bj-back" style:--i={i}></span>
	{/if}
{/snippet}

<div class="bj">
	<div class="bj-table">
		<div class="bj-hand">
			<p class="bj-who font-head">
				{b.dealer}{#if dealer.length}<span class="bj-total num">{b.total(dv.total, dv.soft)}</span>{/if}
			</p>
			<div class="bj-cards" role="img" aria-label={dealer.length ? b.handLabel(b.dealer, [...dealerShown.map(cardText), ...(hideHole ? [b.hidden] : [])].join(', '), String(dv.total)) : b.dealer}>
				{#each dealerShown as c, i (i)}{@render card(c, i)}{/each}
				{#if hideHole && dealer.length}{@render card(null, 1)}{/if}
			</div>
		</div>
		<div class="bj-mid" aria-live="polite">
			{#if result}
				<p class="bj-result font-head" data-result={result}>{b.results[result]} <span class="num">{b.net(net)}</span></p>
			{:else if shuffled}
				<p class="text-xs text-white/80">{b.shuffle}</p>
			{/if}
		</div>
		<div class="bj-hand">
			<p class="bj-who font-head">
				{b.you}{#if player.length}<span class="bj-total num">{b.total(pv.total, pv.soft)}</span>{/if}{#if doubled}<span class="bj-dbl">×2</span>{/if}
			</p>
			<div class="bj-cards" role="img" aria-label={player.length ? b.handLabel(b.you, player.map(cardText).join(', '), String(pv.total)) : b.you}>
				{#each player as c, i (i)}{@render card(c, i)}{/each}
			</div>
		</div>
	</div>

	{#if phase === 'play'}
		<div class="mt-3 flex flex-wrap gap-2">
			<button type="button" class="btn btn-primary" onclick={hit}>{b.hit}</button>
			<button type="button" class="btn" onclick={stand}>{b.stand}</button>
			<button type="button" class="btn" disabled={!canDouble} onclick={double}>{b.double}</button>
		</div>
	{:else}
		<div class="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label={t.casino.bet}>
			{#each BETS as v (v)}
				<button type="button" class="bj-bet num font-head" aria-pressed={stake === v} disabled={v > free} onclick={() => (stake = v)}>{v}</button>
			{/each}
		</div>
		<button type="button" class="btn btn-primary mt-2" disabled={stake > balance} onclick={deal}>{b.deal} · {t.casino.burgers(stake)}</button>
	{/if}

	<details class="mt-3 text-xs text-muted">
		<summary class="min-h-11 cursor-pointer content-center font-semibold">{t.casino.how}</summary>
		<p class="pb-1">{b.how}</p>
	</details>
</div>

<style>
	.bj-table {
		display: grid;
		gap: 10px;
		padding: 14px 12px;
		border-radius: 18px 18px 60px 60px / 18px 18px 40px 40px;
		background: radial-gradient(120% 100% at 50% 0%, #1f7a3a, #0b3e1d);
		box-shadow: inset 0 0 0 4px #6b3a1c, inset 0 0 0 7px #c9a050;
	}
	.bj-who {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #fff6d0;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.bj-total {
		padding: 0 8px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.35);
		color: #fff;
		letter-spacing: 0.04em;
	}
	.bj-dbl {
		color: #ffd23a;
	}
	.bj-cards {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		min-height: 92px;
		margin-top: 6px;
	}
	.bj-card {
		position: relative;
		display: grid;
		place-items: center;
		width: 62px;
		height: 88px;
		border-radius: 8px;
		background: #fffdf6;
		color: #161616;
		font-family: Bahnschrift, 'Segoe UI', sans-serif;
		font-weight: 800;
		box-shadow: 0 3px 6px rgb(0 0 0 / 0.45);
		animation: deal 0.3s ease-out both;
		animation-delay: calc(var(--i) * 0.08s);
	}
	.bj-card[data-red='true'] {
		color: #d2161e;
	}
	.bj-corner {
		position: absolute;
		top: 4px;
		left: 6px;
		font-size: 13px;
		line-height: 1;
		text-align: center;
	}
	.bj-flip {
		top: auto;
		left: auto;
		right: 6px;
		bottom: 4px;
		transform: rotate(180deg);
	}
	.bj-pip {
		font-size: 30px;
	}
	/* the face-down card: burger-red with a bun pattern */
	.bj-back {
		background:
			radial-gradient(circle at 50% 50%, #ffc928 0 9px, transparent 10px),
			repeating-linear-gradient(45deg, #b3141b 0 6px, #8a0a10 6px 12px);
		box-shadow: inset 0 0 0 3px #fffdf6, 0 3px 6px rgb(0 0 0 / 0.45);
	}
	@keyframes deal {
		from {
			opacity: 0;
			transform: translateY(-14px) rotate(-6deg);
		}
	}
	.bj-mid {
		min-height: 30px;
		display: grid;
		place-items: center;
	}
	.bj-result {
		padding: 4px 14px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.45);
		color: #fff;
		font-size: 16px;
		font-weight: 900;
		letter-spacing: 0.06em;
	}
	.bj-result[data-result='blackjack'],
	.bj-result[data-result='win'],
	.bj-result[data-result='dealerBust'] {
		color: #7dff6a;
		box-shadow: 0 0 0 2px #7dff6a;
	}
	.bj-result[data-result='lose'],
	.bj-result[data-result='bust'] {
		color: #ff8a80;
	}
	.bj-bet {
		width: 44px;
		height: 44px;
		border-radius: 999px;
		border: 3px dashed #fff;
		background: radial-gradient(circle, #1a5ad8 55%, #0b2a70);
		color: #fff;
		font-size: 13px;
		font-weight: 900;
	}
	.bj-bet[aria-pressed='true'] {
		box-shadow: 0 0 0 3px #ffd23a, 0 0 12px #ffd23a;
	}
	.bj-bet:disabled {
		opacity: 0.4;
	}
	@media (prefers-reduced-motion: reduce) {
		.bj-card {
			animation: none;
		}
	}
</style>
