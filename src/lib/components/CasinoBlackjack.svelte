<!--
	BurgiCasino's blackjack (squad-casino.ts; 2026-11-16): six decks, hit / stand / double, the dealer
	draws to 17 and stands on a soft 17, blackjack pays 3:2, the dealer checks for blackjack at once.
	Our own drawn cards (rank + suit). The stake is set aside while the hand is played (`hidden`) and
	the result booked when it ends (squad.recordGame). Pretend burgers.
	Boosts + side bets (2026-11-16, the user's ask: "boosts when you win several in a row, get a perfect
	pair or a straight", then "both" to free boosts and real side bets): a won hand is multiplied by its card
	boost and the win-streak boost (the streak is kept per device), and "Perfect Pairs" / "21+3" side bets
	(a chip the size of the bet each) are settled on the deal and booked with the hand.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import {
		boostedNet,
		cardBoost,
		dealerPlays,
		handNet,
		handResult,
		handValue,
		isBlackjack,
		newShoe,
		nextStreak,
		rankLabel,
		sideResult,
		streakBoost,
		BJ_BOOSTS,
		CASINO_MAX_BET,
		RESHUFFLE_AT,
		SIDE_BETS,
		SUIT_SYMBOL,
		type BjBoost,
		type Card,
		type HandResult,
		type PairKind,
		type SideBet,
		type ThreeKind
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

	/* ----- boosts + side bets ----- */
	const STREAK_KEY = 'mw4-camo-grind:bj-streak';
	const SIDES_KEY = 'mw4-camo-grind:bj-sides';
	const readNum = (k: string) => {
		try {
			const n = Number(localStorage.getItem(k));
			return Number.isInteger(n) && n > 0 ? n : 0;
		} catch {
			return 0;
		}
	};
	/** Wins in a row (kept per device, so switching games or reloading doesn't end it). */
	let streak = $state(0);
	/** Side bets switched on for the next hand (remembered per device). */
	let sides = $state<Record<SideBet, boolean>>({ pairs: false, plus3: false });
	$effect(() => {
		streak = readNum(STREAK_KEY);
		try {
			const s = JSON.parse(localStorage.getItem(SIDES_KEY) ?? '{}');
			sides = { pairs: s?.pairs === true, plus3: s?.plus3 === true };
		} catch {
			/* keep the defaults */
		}
	});
	function toggleSide(k: SideBet) {
		sides = { ...sides, [k]: !sides[k] };
		try {
			localStorage.setItem(SIDES_KEY, JSON.stringify(sides));
		} catch {
			/* only this visit then */
		}
	}
	/** The side bets on the hand being played: each its own chip the size of the bet. */
	let onTable = $state<SideBet[]>([]);
	const sideStake = $derived(onTable.length * stake);
	const nextSides = $derived(SIDE_BETS.filter((k) => sides[k]).length * stake);
	/** This hand's card boost (shown once dealt; it counts if the hand is won). */
	let boost = $state<BjBoost | null>(null);
	let sideOut = $state<{ bet: SideBet; kind: PairKind | ThreeKind | null; net: number }[]>([]);
	/** What the boosts added to a won hand. */
	let boostInfo = $state<{ mult: number; extra: number } | null>(null);

	$effect(() => {
		hidden = phase === 'play' ? stake * (doubled ? 2 : 1) + sideStake : 0;
	});
	$effect(() => () => (hidden = 0));
	const free = $derived(Math.max(0, balance - (phase === 'play' ? stake * (doubled ? 2 : 1) + sideStake : 0)));
	const mult = (m: number) => `×${+m.toFixed(2)}`;

	function draw(): Card {
		if (shoe.length < RESHUFFLE_AT) {
			shoe = newShoe(rand);
			shuffled = true;
		}
		return shoe.pop()!;
	}

	function deal() {
		if (stake + nextSides > balance || stake > CASINO_MAX_BET) {
			toast.show(t.casino.broke, undefined, 5000);
			return;
		}
		shuffled = false;
		doubled = false;
		result = null;
		net = 0;
		boostInfo = null;
		onTable = SIDE_BETS.filter((k) => sides[k]);
		player = [draw(), draw()];
		dealer = [draw(), draw()];
		boost = cardBoost(player, dealer[0]);
		// the side bets are settled on the deal (your two cards + the dealer's up card), booked with the hand
		sideOut = onTable.map((bet) => ({ bet, ...sideResult(bet, player, dealer[0], stake) }));
		if (sideOut.some((x) => x.net > 0)) sound.play('maxed');
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
		if (stake * 2 + sideStake > balance) {
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
		const base = handNet(result, stake, doubled);
		streak = nextStreak(streak, result);
		try {
			localStorage.setItem(STREAK_KEY, String(streak));
		} catch {
			/* only this visit then */
		}
		const boosted = boostedNet(base, boost, streak);
		boostInfo = boosted.mult > 1 ? { mult: boosted.mult, extra: boosted.net - base } : null;
		const sideNet = sideOut.reduce((n, x) => n + x.net, 0);
		net = boosted.net + sideNet;
		phase = 'done';
		squad.recordGame(net);
		if (net > 0) sound.play(result === 'blackjack' || net >= 100 || boostInfo ? 'maxed' : 'camo');
		const bigSide = sideOut.find((x) => x.net >= 100);
		if (bigSide) squad.casinoNews(t.casino.event.bjSide(b.sides[bigSide.bet], b.kinds[bigSide.kind!], bigSide.net));
		else if (result === 'blackjack' || Math.abs(net) >= 100) squad.casinoNews(t.casino.event.blackjack(net, result === 'blackjack'));
	}

	const cardText = (c: Card) => `${rankLabel(c.r)}${SUIT_SYMBOL[c.s]}`;
	const hideHole = $derived(phase === 'play');
	const dealerShown = $derived(hideHole ? dealer.slice(0, 1) : dealer);
	const pv = $derived(handValue(player));
	const dv = $derived(handValue(dealerShown));
	const canDouble = $derived(phase === 'play' && player.length === 2 && stake * 2 + sideStake <= balance);
	/** The streak boost the next win would get (the streak it would make). */
	const nextStreakBoost = $derived(streakBoost(streak + 1));
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

	<!-- boosts: the win streak, this hand's card boost, the side bets' results, what the boosts added -->
	<div class="bj-boosts mt-2" aria-live="polite">
		<span class="bj-streak font-head" data-hot={streak >= 2}>
			{#if streak > 0}{b.streak(streak)}{:else}{b.streakNone}{/if}
			{#if nextStreakBoost > 1}<b class="num">{b.streakNext(mult(nextStreakBoost))}</b>{/if}
		</span>
		{#if boost && phase !== 'bet'}
			<span class="bj-boost font-head" data-big={BJ_BOOSTS[boost] >= 2}>⚡ {b.boost(b.kinds[boost], mult(BJ_BOOSTS[boost]))}</span>
		{/if}
		{#each sideOut as x (x.bet)}
			<span class="bj-side font-head" data-won={x.net > 0}>
				{x.kind && x.net > 0 ? b.sideWin(b.sides[x.bet], b.kinds[x.kind], x.net) : b.sideLose(b.sides[x.bet], -x.net)}
			</span>
		{/each}
		{#if boostInfo && phase === 'done'}
			<span class="bj-boost font-head" data-big="true">{b.boostApplied(mult(boostInfo.mult), boostInfo.extra)}</span>
		{/if}
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
		<!-- side bets: a chip the size of the bet each, settled on the deal -->
		<div class="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label={b.sidesLabel}>
			<span class="bj-sides-label font-head">{b.sidesLabel}</span>
			{#each SIDE_BETS as k (k)}
				<button type="button" class="bj-side-btn font-head" aria-pressed={sides[k]} onclick={() => toggleSide(k)}>
					<span class="bj-side-tick" aria-hidden="true">{sides[k] ? '✔' : ''}</span>
					{b.sides[k]} · <span class="num">{t.casino.burgers(stake)}</span>
				</button>
			{/each}
		</div>
		<button type="button" class="btn btn-primary mt-2" disabled={stake + nextSides > balance} onclick={deal}
			>{b.deal} · {t.casino.burgers(stake + nextSides)}</button
		>
	{/if}

	<details class="mt-3 text-xs text-muted">
		<summary class="min-h-11 cursor-pointer content-center font-semibold">{t.casino.how}</summary>
		<p class="pb-1">{b.how}</p>
		<p class="pb-1">{b.boostsHow}</p>
		<p class="pb-1">{b.sidesHow}</p>
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
	/* boosts */
	.bj-boosts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		min-height: 30px;
	}
	.bj-streak,
	.bj-boost,
	.bj-side {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 3px 10px;
		border-radius: 999px;
		background: rgb(127 127 127 / 0.15);
		color: var(--t-fg);
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.04em;
	}
	.bj-streak b {
		color: #ffb02a;
	}
	.bj-streak[data-hot='true'] {
		background: linear-gradient(90deg, #ff4418, #ffb02a);
		color: #fff;
		box-shadow: 0 0 10px rgb(255 120 30 / 0.6);
		animation: bj-hot 1.2s ease-in-out infinite alternate;
	}
	.bj-streak[data-hot='true'] b {
		color: #fff6b0;
	}
	@keyframes bj-hot {
		to {
			box-shadow: 0 0 2px rgb(255 120 30 / 0.4);
		}
	}
	.bj-boost {
		background: #3a1a6a;
		color: #fff6b0;
		box-shadow: 0 0 0 1.5px #b265ff;
	}
	.bj-boost[data-big='true'] {
		background: linear-gradient(90deg, #7a3fd0, #ff5ca8);
		color: #fff;
		box-shadow: 0 0 10px rgb(255 92 168 / 0.6);
	}
	.bj-side {
		color: var(--t-muted);
	}
	.bj-side[data-won='true'] {
		background: #1d5a2a;
		color: #b8ff9a;
		box-shadow: 0 0 0 1.5px #7dff6a, 0 0 10px rgb(125 255 106 / 0.45);
	}
	.bj-sides-label {
		color: var(--t-muted);
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.bj-side-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		padding: 0 12px;
		border: 2px solid #c9a050;
		border-radius: 999px;
		background: #0b3e1d;
		color: #fff6d0;
		font-size: 12.5px;
		font-weight: 800;
	}
	.bj-side-btn[aria-pressed='true'] {
		background: #1f7a3a;
		box-shadow: 0 0 0 2px #ffd23a, 0 0 10px rgb(255 210 58 / 0.5);
	}
	.bj-side-tick {
		display: inline-grid;
		place-items: center;
		width: 18px;
		height: 18px;
		border-radius: 4px;
		background: #fffdf6;
		color: #0b3e1d;
		font-size: 12px;
	}
	@media (prefers-reduced-motion: reduce) {
		.bj-card,
		.bj-streak[data-hot='true'] {
			animation: none;
		}
	}
</style>
