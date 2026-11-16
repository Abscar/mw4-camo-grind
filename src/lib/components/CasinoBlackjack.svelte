<!--
	BurgiCasino's blackjack (2026-11-16): one shared table for the whole squad (bj-table.ts has the
	rules, bjTable.svelte.ts the table's document and your moves). Opening it sits you down (5 seats,
	else you watch); everyone at the table sees the others' cards, bets and moves, and plays their own
	hand against the same dealer at the same time (the user: "see when others play at the blackjack
	table, and several can play at once"). Alone it plays like before: the cards come at once.
	Six decks, hit / stand / double, the dealer stands on a soft 17, blackjack pays 3:2. Our own drawn
	cards. Your stake is held back from the balance while the hand is played (`hidden`); the result is
	booked in your tally when the hand is settled (squad.recordGame). Pretend burgers.
	Boosts + side bets (2026-11-16, the user's ask: "boosts when you win several in a row, get a perfect
	pair or a straight", then "both" to free boosts and real side bets): a won hand is multiplied by its card
	boost and the win-streak boost (the streak is kept per device and goes with each bet), and "Perfect
	Pairs" / "21+3" side bets (a chip the size of the bet each) are settled on the deal, booked with the hand.
-->
<script lang="ts">
	import { canAct, handSides, viewRound, GRACE, type HandPlay, type SeatPlay } from '#lib/bj-table.ts';
	import { bjTable } from '#lib/bjTable.svelte.ts';
	import { t } from '#lib/i18n/en.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { handValue, rankLabel, streakBoost, BJ_BOOSTS, CASINO_MAX_BET, SIDE_BETS, SUIT_SYMBOL, type Card, type SideBet } from '#lib/squad-casino.ts';
	import type { SquadOp } from '#lib/squad-codec.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import SquadAvatar from './SquadAvatar.svelte';

	let { balance, hidden = $bindable(0) }: { balance: number; hidden?: number } = $props();
	const b = t.casino.blackjack;

	let root: HTMLElement;
	$effect(() => bjTable.open(root));
	$effect(() => {
		hidden = bjTable.stake;
	});
	$effect(() => () => (hidden = 0));

	const BETS = [5, 10, 25, 50, 100, 250, 500];
	let stake = $state(10);
	const free = $derived(Math.max(0, balance - bjTable.stake));

	/** Side bets switched on for your next hand (remembered per device, the solo game's key). */
	const SIDES_KEY = 'mw4-camo-grind:bj-sides';
	let sides = $state<Record<SideBet, boolean>>({ pairs: false, plus3: false });
	$effect(() => {
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
	const picked = $derived(SIDE_BETS.filter((k) => sides[k]));
	/** What your next hand costs: the bet + a chip per side bet. */
	const cost = $derived(stake * (1 + picked.length));
	const mult = (m: number) => `×${+m.toFixed(2)}`;

	const meId = $derived(squad.me?.id ?? '');
	const now = $derived(bjTable.now);
	const round = $derived(bjTable.doc?.round ?? null);
	const view = $derived(round ? viewRound(round, now, GRACE) : null);
	const myState = $derived(bjTable.state);
	const seatedIds = $derived(new Set(bjTable.seated.map((s) => s.id)));

	interface Spot {
		id: string;
		name: string;
		op?: SquadOp;
		n: number;
		sp: SeatPlay | null;
		away: boolean;
	}
	/** Everyone at the table or in the hand, seat order. */
	const spots = $derived.by((): Spot[] => {
		const out = new Map<number, Spot>();
		for (const { id, seat } of bjTable.seated) out.set(seat.n, { id, name: seat.name, op: seat.op, n: seat.n, sp: null, away: false });
		for (const sp of view?.seats ?? []) out.set(sp.hand.n, { id: sp.id, name: sp.hand.name, op: sp.hand.op, n: sp.hand.n, sp, away: !seatedIds.has(sp.id) });
		return [...out.values()].sort((a, b) => a.n - b.n);
	});
	/** You only watch (full table, or you're playing on another device: your seat shows like the others'). */
	const watching = $derived(myState === 'seat' && bjTable.sitState !== 'ok');
	const mine = $derived(watching ? null : (spots.find((s) => s.id === meId) ?? null));
	const others = $derived(spots.filter((s) => watching || s.id !== meId));
	const myPlay = $derived(mine?.sp ?? null);
	const myTurn = $derived(!!round && canAct(round, meId, squad.device, now) && !bjTable.busy);
	const secs = (deadline: number | null) => Math.max(0, Math.ceil(((deadline ?? now) - now) / 1000));
	const phase = $derived(view?.phase ?? null);
	const opener = $derived(round ? (view?.seats.find((s) => s.hand.at === round.open)?.hand.name ?? view?.seats[0]?.hand.name ?? '') : '');

	// the dealer: nothing while bets are open, the up card + a face-down card during play, all at the end
	const hideHole = $derived(phase === 'play' || phase === 'settle');
	const dealerShown = $derived(!view || phase === 'betting' ? [] : hideHole ? view.dealer.slice(0, 1) : view.dealer);
	const dv = $derived(handValue(dealerShown));
	const cardText = (c: Card) => `${rankLabel(c.r)}${SUIT_SYMBOL[c.s]}`;

	/** Doubling puts in one more bet: the bet twice + the side chips must fit your burgers. */
	const canDouble = $derived(myTurn && myPlay?.play?.cards.length === 2 && (myPlay?.hand.bet ?? 0) * (2 + (myPlay ? handSides(myPlay.hand).length : 0)) <= balance);
	const othersSeated = $derived(bjTable.seated.some((s) => s.id !== meId));
	/** The streak boost your next win would get. */
	const nextStreakBoost = $derived(streakBoost(bjTable.streak + 1));

	// a side bet that won on the deal: a sound, once per hand
	let sideSound = '';
	$effect(() => {
		if (round && (phase === 'play' || phase === 'settle') && myPlay?.sides.some((x) => x.net > 0) && sideSound !== round.id) {
			sideSound = round.id;
			sound.play('maxed');
		}
	});

	async function bet() {
		if (cost > free || stake > CASINO_MAX_BET) {
			toast.show(t.casino.broke, undefined, 5000);
			return;
		}
		if (!(await bjTable.bet(stake, picked))) toast.show(b.failed, undefined, 5000);
	}
	async function move(kind: 'h' | 's' | 'd') {
		if (kind === 'd' && !canDouble) {
			toast.show(t.casino.broke, undefined, 5000);
			return;
		}
		if (!(await bjTable.move(kind))) toast.show(b.failed, undefined, 5000);
	}
	async function dealNow() {
		if (!(await bjTable.dealNow())) toast.show(b.failed, undefined, 5000);
	}

	/** A seat's status line: waiting / bet in / thinking 12 s / stands / bust … / the result. */
	function status(s: Spot): { text: string; tone: string } {
		const sp = s.sp;
		if (!sp) return { text: b.seatStatus.waiting, tone: 'idle' };
		if (sp.result !== undefined && sp.net !== undefined) return { text: `${b.othersResult[sp.result]} ${b.net(sp.net)}`, tone: sp.net > 0 ? 'win' : sp.net < 0 ? 'lose' : 'push' };
		if (!sp.play) return { text: `${b.seatStatus.betting} · ${t.casino.burgers(sp.hand.bet)}`, tone: 'idle' };
		if (sp.play.finished) return { text: b.seatStatus[sp.play.status as Exclude<HandPlay['status'], 'playing'>], tone: sp.play.status === 'bust' ? 'lose' : 'done' };
		if (now >= (sp.deadline ?? 0)) return { text: b.seatStatus.late, tone: 'late' };
		return { text: b.seatStatus.playing(secs(sp.deadline)), tone: 'think' };
	}
	const total = (p: HandPlay | null | undefined) => (p ? handValue(p.cards) : null);
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

{#snippet hand(who: string, p: HandPlay | null)}
	<div class="bj-cards" role="img" aria-label={p ? b.handLabel(who, p.cards.map(cardText).join(', '), String(handValue(p.cards).total)) : who}>
		{#each p?.cards ?? [] as c, i (i)}{@render card(c, i)}{/each}
	</div>
{/snippet}

<div class="bj" bind:this={root}>
	<div class="bj-table">
		<!-- the dealer -->
		<div class="bj-hand">
			<p class="bj-who font-head">
				{b.dealer}{#if dealerShown.length}<span class="bj-total num">{b.total(dv.total, dv.soft)}</span>{/if}
			</p>
			<div
				class="bj-cards"
				role="img"
				aria-label={dealerShown.length ? b.handLabel(b.dealer, [...dealerShown.map(cardText), ...(hideHole ? [b.hidden] : [])].join(', '), String(dv.total)) : b.dealer}
			>
				{#each dealerShown as c, i (i)}{@render card(c, i)}{/each}
				{#if hideHole}{@render card(null, 1)}{/if}
			</div>
		</div>

		<!-- what's happening -->
		<div class="bj-mid" aria-live="polite">
			{#if bjTable.trouble}
				<p class="bj-note">{b.trouble}</p>
			{:else if phase === 'betting' && round}
				<p class="bj-note bj-clock">{myState === 'join' ? b.betsCloseJoin(opener, secs(round.dealAt)) : b.betsClose(secs(round.dealAt))}</p>
			{:else if phase === 'settle'}
				<p class="bj-note">{b.dealerTurn}</p>
			{:else if phase === 'done' && myPlay?.result && myPlay.net !== undefined}
				<p class="bj-result font-head" data-result={myPlay.result}>{b.results[myPlay.result]} <span class="num">{b.net(myPlay.net)}</span></p>
			{:else if myTurn}
				<p class="bj-note bj-clock">{b.yourMove(secs(myPlay?.deadline ?? null))}</p>
			{:else if myState === 'in' && phase === 'play'}
				<p class="bj-note">{b.waitingOthers}</p>
			{:else if bjTable.last && !myPlay}
				<p class="bj-note">{b.lastHand(b.results[bjTable.last.result], b.net(bjTable.last.net))}</p>
			{/if}
		</div>

		<!-- the others -->
		{#if others.length}
			<ul class="bj-seats" aria-label={b.seatsLabel}>
				{#each others as s (s.id)}
					{@const st = status(s)}
					{@const v = total(s.sp?.play)}
					<li class="bj-seat" data-tone={st.tone} class:away={s.away}>
						<div class="bj-seat-head">
							<SquadAvatar name={s.name} op={s.op} size={28} />
							<b class="min-w-0 flex-1 truncate font-head">{s.name}</b>
							{#if s.sp}<span class="bj-chip num" title={b.betChip(s.sp.hand.bet)}>{s.sp.hand.bet * (s.sp.play?.doubled ? 2 : 1)}</span>{/if}
						</div>
						<div class="bj-small">{@render hand(s.name, s.sp?.play ?? null)}</div>
						<p class="bj-seat-status">
							{#if v}<span class="bj-total num">{b.total(v.total, v.soft)}</span>{/if}
							<span class="bj-st">{st.text}</span>
							{#if s.away}<span class="bj-left">{b.seatStatus.away}</span>{/if}
						</p>
						{#each s.sp?.sides.filter((x) => x.net > 0 && x.kind) ?? [] as x (x.bet)}
							<p class="bj-seat-side font-head">{b.sideWin(b.sides[x.bet], b.kinds[x.kind!], x.net)}</p>
						{/each}
					</li>
				{/each}
			</ul>
		{:else if bjTable.sitState === 'ok'}
			<p class="bj-alone">{b.alone}</p>
		{/if}

		<!-- you (not while you only watch) -->
		<div class="bj-hand bj-me" hidden={watching}>
			<p class="bj-who font-head">
				{b.you}{#if myPlay?.play}{@const v = handValue(myPlay.play.cards)}<span class="bj-total num">{b.total(v.total, v.soft)}</span>{/if}{#if myPlay?.play?.doubled}<span class="bj-dbl">×2</span>{/if}
				{#if myPlay}<span class="bj-chip num" title={b.betChip(myPlay.hand.bet)}>{myPlay.hand.bet * (myPlay.play?.doubled ? 2 : 1)}</span>{/if}
			</p>
			{@render hand(b.you, myPlay?.play ?? null)}
		</div>
	</div>

	<!-- boosts: your win streak, this hand's card boost, your side bets' results, what the boosts added -->
	{#if !watching}
		<div class="bj-boosts mt-2" aria-live="polite">
			<span class="bj-streak font-head" data-hot={bjTable.streak >= 2}>
				{#if bjTable.streak > 0}{b.streak(bjTable.streak)}{:else}{b.streakNone}{/if}
				{#if nextStreakBoost > 1}<b class="num">{b.streakNext(mult(nextStreakBoost))}</b>{/if}
			</span>
			{#if myPlay?.boost && phase !== 'done'}
				<span class="bj-boost font-head" data-big={BJ_BOOSTS[myPlay.boost] >= 2}>⚡ {b.boost(b.kinds[myPlay.boost], mult(BJ_BOOSTS[myPlay.boost]))}</span>
			{/if}
			{#each myPlay?.sides ?? [] as x (x.bet)}
				<span class="bj-side font-head" data-won={x.net > 0}>
					{x.kind && x.net > 0 ? b.sideWin(b.sides[x.bet], b.kinds[x.kind], x.net) : b.sideLose(b.sides[x.bet], -x.net)}
				</span>
			{/each}
			{#if phase === 'done' && myPlay?.mult && myPlay.mult > 1 && myPlay.extra}
				<span class="bj-boost font-head" data-big="true">{b.boostApplied(mult(myPlay.mult), myPlay.extra)}</span>
			{/if}
		</div>
	{/if}

	{#if watching}
		<p class="mt-3 text-sm text-fg">{bjTable.sitState === 'full' ? b.full : b.otherDevice}</p>
	{:else if myTurn}
		<div class="mt-3 flex flex-wrap gap-2">
			<button type="button" class="btn btn-primary" onclick={() => move('h')}>{b.hit}</button>
			<button type="button" class="btn" onclick={() => move('s')}>{b.stand}</button>
			<button type="button" class="btn" disabled={!canDouble} onclick={() => move('d')}>{b.double}</button>
		</div>
	{:else if myState === 'in'}
		{#if phase === 'betting'}
			<button type="button" class="btn mt-3" disabled={bjTable.busy} onclick={dealNow}>{b.dealNow}</button>
		{/if}
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
		{#if myState === 'wait' || myState === 'pause'}
			<button type="button" class="btn btn-primary mt-2" disabled>{myState === 'wait' ? b.inProgress : b.pause}</button>
		{:else}
			<button type="button" class="btn btn-primary mt-2" disabled={cost > free || bjTable.busy} onclick={bet}>
				{myState === 'join' ? b.join : othersSeated ? b.openHand : b.deal} · {t.casino.burgers(cost)}
			</button>
		{/if}
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
		flex-wrap: wrap;
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
	/* a chip with the bet on it */
	.bj-chip {
		display: inline-grid;
		place-items: center;
		min-width: 26px;
		height: 26px;
		padding: 0 5px;
		border-radius: 999px;
		border: 2px dashed #fff;
		background: radial-gradient(circle, #d2161e 55%, #7a0a10);
		color: #fff;
		font-size: 11px;
		font-weight: 900;
		letter-spacing: 0;
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
		text-align: center;
	}
	.bj-note {
		color: #fff6d0;
		font-size: 13px;
		font-weight: 700;
	}
	.bj-clock {
		padding: 3px 12px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.4);
		box-shadow: 0 0 0 1.5px #ffd23a;
		color: #ffd23a;
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

	/* the other players: a small box each, side by side */
	.bj-seats {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 148px), 1fr));
		gap: 8px;
	}
	.bj-seat {
		min-width: 0;
		padding: 6px 8px 7px;
		border-radius: 12px;
		background: rgb(0 0 0 / 0.22);
		box-shadow: inset 0 0 0 1.5px rgb(255 246 208 / 0.25);
		color: #fff6d0;
	}
	.bj-seat[data-tone='think'] {
		box-shadow: inset 0 0 0 2px #ffd23a, 0 0 10px rgb(255 210 58 / 0.35);
	}
	.bj-seat[data-tone='win'] {
		box-shadow: inset 0 0 0 2px #7dff6a;
	}
	.bj-seat[data-tone='lose'] {
		box-shadow: inset 0 0 0 2px #ff8a80;
	}
	.bj-seat.away {
		opacity: 0.7;
	}
	.bj-seat-head {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
		font-size: 13px;
	}
	.bj-small .bj-cards {
		min-height: 52px;
		margin-top: 4px;
		gap: 0;
	}
	.bj-small .bj-card {
		width: 36px;
		height: 50px;
		border-radius: 5px;
	}
	.bj-small .bj-card + .bj-card {
		margin-left: -12px;
	}
	.bj-small .bj-corner {
		top: 2px;
		left: 3px;
		font-size: 10px;
	}
	.bj-small .bj-flip {
		display: none;
	}
	.bj-small .bj-pip {
		font-size: 17px;
		transform: translate(4px, 5px);
	}
	.bj-seat-status {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		margin-top: 4px;
		font-size: 12px;
		font-weight: 700;
	}
	.bj-seat[data-tone='think'] .bj-st,
	.bj-seat[data-tone='late'] .bj-st {
		color: #ffd23a;
	}
	.bj-seat[data-tone='win'] .bj-st {
		color: #7dff6a;
	}
	.bj-seat[data-tone='lose'] .bj-st {
		color: #ff8a80;
	}
	.bj-left {
		color: rgb(255 246 208 / 0.7);
		font-size: 11px;
		font-weight: 600;
	}
	.bj-alone {
		color: rgb(255 246 208 / 0.8);
		font-size: 12px;
		text-align: center;
	}
	.bj-me {
		padding-top: 8px;
		border-top: 1px dashed rgb(255 246 208 / 0.3);
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
	/* a side bet that won, on another player's seat */
	.bj-seat-side {
		margin-top: 4px;
		padding: 2px 8px;
		border-radius: 999px;
		background: #1d5a2a;
		box-shadow: 0 0 0 1.5px #7dff6a;
		color: #b8ff9a;
		font-size: 11px;
		font-weight: 800;
	}
	/* boosts + side bets (2026-11-16, the solo game's look) */
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
