// BurgiCasino blackjack boosts (src/lib/squad-casino.ts): card boosts (pairs, flush, straight, trips …),
// the win-streak boost, and the long-run return with good play over many seeded hands. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
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
	pairKind,
	sideResult,
	streakBoost,
	threeKind,
	BJ_BOOSTS,
	PERFECT_PAIRS_PAYS,
	PLUS3_PAYS,
	RESHUFFLE_AT
} from '../src/lib/squad-casino.ts';

const seeded = (seed) => () => {
	seed ^= seed << 13;
	seed ^= seed >>> 17;
	seed ^= seed << 5;
	return (seed >>> 0) / 4294967296;
};
const c = (r, s) => ({ r, s });

test('hands: pairs from the first two cards, three-card hands with the dealer’s up card', () => {
	assert.equal(pairKind([c(8, 'S'), c(8, 'H')]), 'pair', 'black + red');
	assert.equal(pairKind([c(8, 'H'), c(8, 'D')]), 'colourPair', 'both red');
	assert.equal(pairKind([c(12, 'S'), c(12, 'S')]), 'perfectPair');
	assert.equal(pairKind([c(12, 'S'), c(13, 'S')]), null);
	assert.equal(threeKind([c(2, 'H'), c(9, 'H')], c(5, 'H')), 'flush');
	assert.equal(threeKind([c(4, 'S'), c(6, 'H')], c(5, 'C')), 'straight');
	assert.equal(threeKind([c(1, 'S'), c(13, 'H')], c(12, 'C')), 'straight', 'Q-K-A');
	assert.equal(threeKind([c(1, 'S'), c(2, 'H')], c(3, 'C')), 'straight', 'A-2-3');
	assert.equal(threeKind([c(13, 'S'), c(1, 'H')], c(2, 'C')), null, 'no straight round the corner');
	assert.equal(threeKind([c(7, 'S'), c(7, 'H')], c(7, 'C')), 'trips');
	assert.equal(threeKind([c(9, 'D'), c(10, 'D')], c(11, 'D')), 'straightFlush');
	assert.equal(threeKind([c(5, 'C'), c(5, 'C')], c(5, 'C')), 'suitedTrips');
	assert.equal(threeKind([c(10, 'S'), c(3, 'H')], c(8, 'C')), null);
	assert.equal(threeKind([c(10, 'S'), c(3, 'H')]), null);
});

test('free card boosts: the best one counts; a plain flush gets none', () => {
	assert.equal(cardBoost([c(7, 'S'), c(7, 'H')], c(7, 'C')), 'trips', 'trips beat the pair');
	assert.equal(cardBoost([c(8, 'H'), c(8, 'D')], c(9, 'C')), 'colourPair');
	assert.equal(cardBoost([c(2, 'H'), c(9, 'H')], c(5, 'H')), null, 'flush: no free boost');
	assert.equal(cardBoost([c(9, 'D'), c(10, 'D')], c(11, 'D')), 'straightFlush');
	assert.equal(cardBoost([c(10, 'S')], c(8, 'C')), null);
	for (const v of Object.values(BJ_BOOSTS)) assert.ok(v > 1 && v <= 4);
});

test('streaks: a win adds one, a push keeps it, a loss ends it; the boost from the 3rd win', () => {
	assert.equal(nextStreak(0, 'win'), 1);
	assert.equal(nextStreak(3, 'blackjack'), 4);
	assert.equal(nextStreak(3, 'dealerBust'), 4);
	assert.equal(nextStreak(3, 'push'), 3);
	assert.equal(nextStreak(3, 'lose'), 0);
	assert.equal(nextStreak(3, 'bust'), 0);
	assert.deepEqual([0, 1, 2, 3, 4, 5, 9].map(streakBoost), [1, 1, 1, 1.05, 1.1, 1.2, 1.2]);
	// boosts multiply a win only
	assert.deepEqual(boostedNet(100, 'perfectPair', 5), { net: 180, mult: 1.5 * 1.2 });
	assert.deepEqual(boostedNet(15, 'pair', 2), { net: 16, mult: 1.1 });
	assert.deepEqual(boostedNet(-100, 'suitedTrips', 5), { net: -100, mult: 1 });
	assert.deepEqual(boostedNet(0, null, 4), { net: 0, mult: 1 });
});

test('side bets: Perfect Pairs and 21+3 pay their table, a miss loses the chip', () => {
	assert.deepEqual(sideResult('pairs', [c(12, 'S'), c(12, 'S')], c(2, 'C'), 10), { kind: 'perfectPair', net: 10 * PERFECT_PAIRS_PAYS.perfectPair });
	assert.deepEqual(sideResult('pairs', [c(12, 'S'), c(13, 'S')], c(2, 'C'), 10), { kind: null, net: -10 });
	assert.deepEqual(sideResult('plus3', [c(4, 'S'), c(6, 'H')], c(5, 'C'), 25), { kind: 'straight', net: 25 * PLUS3_PAYS.straight });
	assert.deepEqual(sideResult('plus3', [c(4, 'S'), c(9, 'H')], c(5, 'C'), 25), { kind: null, net: -25 });
	assert.equal(PERFECT_PAIRS_PAYS.perfectPair, 25);
	assert.equal(PLUS3_PAYS.suitedTrips, 100);
});

/** Good play without splits (the table has none): a short basic strategy for S17, double on any two. */
function play(player, dealerUp, draw) {
	const up = dealerUp.r === 1 ? 11 : Math.min(dealerUp.r, 10);
	let hand = [...player];
	let doubled = false;
	for (;;) {
		const { total, soft } = handValue(hand);
		if (total >= 21) break;
		const first = hand.length === 2;
		if (first && !soft && (total === 11 || (total === 10 && up <= 9) || (total === 9 && up >= 3 && up <= 6))) {
			hand.push(draw());
			doubled = true;
			break;
		}
		const hitIt = soft ? total <= 17 || (total === 18 && up >= 9) : total <= 11 || (total === 12 && (up <= 3 || up >= 7)) || (total >= 13 && total <= 16 && up >= 7);
		if (!hitIt) break;
		hand.push(draw());
	}
	return { hand, doubled };
}

test('long run with good play: ≈ 100 % back with the boosts (about 1 % more than without)', () => {
	const rand = seeded(424242);
	let shoe = newShoe(rand);
	const draw = () => {
		if (shoe.length < RESHUFFLE_AT) shoe = newShoe(rand);
		return shoe.pop();
	};
	const N = 400_000;
	let base = 0;
	let boosted = 0;
	let streak = 0;
	let boostsSeen = 0;
	let longest = 0;
	let pairsNet = 0;
	let plus3Net = 0;
	for (let i = 0; i < N; i++) {
		const p = [draw(), draw()];
		const d = [draw(), draw()];
		let hand = p;
		let doubled = false;
		let dealer = d;
		if (!isBlackjack(p) && !isBlackjack(d)) {
			({ hand, doubled } = play(p, d[0], draw));
			if (handValue(hand).total <= 21) dealer = dealerPlays(d, draw);
		}
		const r = handResult(hand, dealer);
		const net = handNet(r, 10, doubled);
		streak = nextStreak(streak, r);
		longest = Math.max(longest, streak);
		const boost = cardBoost(p, d[0]);
		if (boost) boostsSeen++;
		base += net;
		boosted += boostedNet(net, boost, streak).net;
		pairsNet += sideResult('pairs', p, d[0], 10).net;
		plus3Net += sideResult('plus3', p, d[0], 10).net;
	}
	const rtpBase = 1 + base / (N * 10);
	const rtp = 1 + boosted / (N * 10);
	assert.ok(rtpBase > 0.97 && rtpBase < 1.0, `without boosts ${rtpBase}`);
	assert.ok(rtp > 0.995 && rtp < 1.015, `with boosts ${rtp}`);
	assert.ok(boostsSeen / N > 0.06 && boostsSeen / N < 0.15, `a card boost on ${boostsSeen / N} of hands`);
	assert.ok(longest >= 8, 'long streaks happen');
	// the side bets: the house keeps a few percent, like at a real table
	const pairsRtp = 1 + pairsNet / (N * 10);
	const plus3Rtp = 1 + plus3Net / (N * 10);
	assert.ok(pairsRtp > 0.92 && pairsRtp < 0.99, `Perfect Pairs ${pairsRtp}`);
	assert.ok(plus3Rtp > 0.92 && plus3Rtp < 0.99, `21+3 ${plus3Rtp}`);
	console.log({ rtpBase, rtp, pairsRtp, plus3Rtp, boosts: boostsSeen / N });
});
