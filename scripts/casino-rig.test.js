// Abscar's control room for BurgiCasino (src/lib/casino-rig.ts): reading the settings, luck, forced
// results, the ready-made screens, and how the blackjack table deals with them (bj-table.ts). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	cleanTune,
	drawUntil,
	extraDraws,
	f2Matches,
	forcedFor,
	karmaCounts,
	karmaLuck,
	kushForced,
	kushMatches,
	KARMA_MAX,
	KUSH_BIG,
	lucky,
	luckFor,
	luckWords,
	presetScreen,
	withUsed,
	F2_TRIES,
	SCREEN_PRESETS
} from '../src/lib/casino-rig.ts';
import { evaluate, play, playScreen, FREE_SPINS } from '../src/lib/casino-slots.ts';
import { play as f2play } from '../src/lib/fortune2.ts';
import { playBook } from '../src/lib/book.ts';
import { ORG_IDS } from '../src/lib/donations.ts';
import { heartsEarned } from '../src/lib/karma-shop.ts';
import { dealerStart, emptyTable, fromTableWire, placeBet, playHand, roundShoe, sit, stretchScore, tableShoe, toTableWire, viewRound } from '../src/lib/bj-table.ts';
import { rouletteNet, spinNumber } from '../src/lib/squad-casino.ts';
import { seeded } from '../src/lib/squad-fun.ts';
import { fromSquadWire, toSquadWire } from '../src/lib/squad-codec.ts';

const A = 'memberAAAA01';
const B = 'memberBBBB02';
const screenOf = (g) => evaluate(
	g.map(() => 0),
	100,
	1,
	{ strips: g.map((c) => [...c]) }
);

test('cleanTune keeps good settings, drops junk and zeros, clamps luck', () => {
	assert.equal(cleanTune(null), undefined);
	assert.equal(cleanTune({ odds: { slots: 0 }, luck: { [A]: 0 }, at: 5 }), undefined, 'nothing set');
	const t = cleanTune({
		odds: { slots: 40, roulette: -250, poker: 50, blackjack: 'x' },
		luck: { [A]: 33.4, 'bad id': 50, [B]: -10 },
		slots: { id: 'rig0001', who: B, what: presetScreen('jackpot') },
		fortune2: { id: 'rig0002', who: '*', what: 'super', every: 1, used: 5 },
		roulette: { id: 'rig0003', who: A, what: 37 },
		blackjack: { id: 'rig0004', who: B, what: [1, 13], used: 1_800_000_000_000, by: A },
		at: 1_800_000_000_000
	});
	assert.deepEqual(t.odds, { slots: 40, roulette: -100 });
	assert.deepEqual(t.luck, { [A]: 33, [B]: -10 });
	assert.equal(t.slots.who, B);
	assert.deepEqual(t.fortune2, { id: 'rig0002', who: '*', what: 'super', every: 1 }, 'every-play settings are never used up');
	assert.equal(t.roulette, undefined, 'no number 37');
	assert.deepEqual(t.blackjack, { id: 'rig0004', who: '*', what: [1, 13], used: 1_800_000_000_000, by: A }, 'the dealer deals to everyone');
	assert.equal(cleanTune({ slots: { id: 'rg1', who: '*', what: presetScreen('blank') } }), undefined, 'id too short');
	assert.equal(cleanTune({ slots: { id: 'rig0001', who: '*', what: [['wild']] } }), undefined, 'not a 5 × 3 screen');
	assert.equal(cleanTune({ blackjack: { id: 'rig0001', who: '*', what: [1, 14] } }), undefined, 'no rank 14');
});

test('the squad document keeps its tune through the wire', () => {
	const doc = { members: {}, tune: cleanTune({ odds: { slots: 20 }, luck: { [A]: -30 } }) };
	const back = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire(doc))));
	assert.deepEqual(back.tune, doc.tune);
	assert.equal(back.more, undefined);
});

test('luck = odds + own luck, clamped; extra draws per ±50', () => {
	const t = { odds: { slots: 60 }, luck: { [A]: 70, [B]: -30 } };
	assert.equal(luckFor(t, 'slots', A), 100);
	assert.equal(luckFor(t, 'slots', B), 30);
	assert.equal(luckFor(t, 'roulette', B), -30);
	assert.equal(luckFor(undefined, 'slots', A), 0);
	const r = seeded(7);
	assert.equal(extraDraws(0, r), 0);
	assert.equal(extraDraws(50, r), 1);
	assert.equal(extraDraws(-100, r), 2);
	let n = 0;
	for (let i = 0; i < 10_000; i++) n += extraDraws(25, r);
	assert.ok(n > 4_500 && n < 5_500, `25 = an extra draw half the time (${n})`);
	assert.deepEqual(luckWords(80), { draws: 2, chance: 60 });
});

test('lucky keeps the best (plus) or the worst (minus) of its draws', () => {
	const seq = (xs) => {
		let i = 0;
		return () => xs[i++];
	};
	assert.equal(lucky(0, Math.random, seq([5, 9, 1]), (x) => x), 5, 'no luck: one draw');
	assert.equal(lucky(100, Math.random, seq([5, 9, 1]), (x) => x), 9);
	assert.equal(lucky(-100, Math.random, seq([5, 9, 1]), (x) => x), 1);
	assert.equal(lucky(50, Math.random, seq([5, 5, 9]), (x) => x), 5, 'a tie keeps the first');
});

test('luck moves what the slots and roulette pay back', () => {
	const rtp = (luck, seed) => {
		const r = seeded(seed);
		let paid = 0;
		let won = 0;
		for (let i = 0; i < 30_000; i++) {
			const p = lucky(luck, r, () => play(10, r), (x) => x.net);
			paid += p.cost;
			won += p.win;
		}
		return won / paid;
	};
	const [lo, mid, hi] = [rtp(-100, 11), rtp(0, 11), rtp(100, 11)];
	assert.ok(lo < mid - 0.3 && hi > mid + 0.3, `slots −100 ${lo.toFixed(2)} · 0 ${mid.toFixed(2)} · +100 ${hi.toFixed(2)}`);
	const r = seeded(3);
	let wins = 0;
	const N = 40_000;
	for (let i = 0; i < N; i++) if (rouletteNet({ red: 10 }, lucky(50, r, () => spinNumber(r), (n) => rouletteNet({ red: 10 }, n))) > 0) wins++;
	const want = 1 - (19 / 37) ** 2;
	assert.ok(Math.abs(wins / N - want) < 0.012, `red at +50 wins ${(wins / N).toFixed(3)} (best of two ≈ ${want.toFixed(3)})`);
});

test('a forced setting: who gets it, once or every play, marked used', () => {
	const once = { id: 'rig0001', who: B, what: 7 };
	assert.equal(forcedFor(once, A, []), null, 'someone else');
	assert.equal(forcedFor(once, B, []), once);
	assert.equal(forcedFor(once, B, ['rig0001']), null, 'this device took it already');
	assert.equal(forcedFor({ ...once, used: 5 }, B, []), null, 'taken on another device');
	assert.equal(forcedFor({ ...once, who: '*' }, A, []).what, 7, 'anyone');
	assert.equal(forcedFor({ ...once, every: 1 }, B, ['rig0001']).what, 7, 'every play');
	const tune = { roulette: once };
	assert.deepEqual(withUsed(tune, 'roulette', 'rig0001', B, 1234.6).roulette, { ...once, used: 1235, by: B });
	assert.equal(withUsed(tune, 'roulette', 'rig9999', B, 1), null, 'a newer setting replaced it');
	assert.equal(withUsed({ roulette: { ...once, every: 1 } }, 'roulette', 'rig0001', B, 1), null, 'every play stays on');
});

test('the ready-made screens do what they say, and a picked screen plays out', () => {
	for (const p of SCREEN_PRESETS) assert.equal(presetScreen(p).length, 5);
	const blank = screenOf(presetScreen('blank'));
	assert.equal(blank.raw, 0);
	assert.equal(blank.freeSpins + Number(blank.box) + Number(blank.wheel), 0);
	assert.ok(screenOf(presetScreen('jackpot')).lines.some((l) => l.symbol === 'wild' && l.count === 5));
	assert.ok(screenOf(presetScreen('burgers')).lines.some((l) => l.symbol === 'burger' && l.count === 5));
	assert.equal(screenOf(presetScreen('free3')).freeSpins, FREE_SPINS[0]);
	assert.equal(screenOf(presetScreen('free5')).freeSpins, FREE_SPINS[2]);
	assert.ok(screenOf(presetScreen('box')).box);
	assert.ok(screenOf(presetScreen('wheel')).wheel);
	const r = seeded(5);
	const jp = playScreen(presetScreen('jackpot'), 100, r);
	assert.deepEqual(jp.base.grid, presetScreen('jackpot'));
	assert.equal(jp.cost, 100);
	assert.ok(jp.win >= 100 * 500, 'a jackpot pays');
	const fs = playScreen(presetScreen('free3'), 10, r);
	assert.ok(fs.free.length >= FREE_SPINS[0], 'its free spins are played');
	assert.equal(playScreen(presetScreen('blank'), 10, r).win, 0);
	const box = playScreen(presetScreen('box'), 10, r);
	assert.ok(box.base.boxBonus && box.win === box.base.boxBonus.win);
});

test('Fortune II: drawing until a spin has the picked feature', () => {
	const r = seeded(9);
	for (const want of ['hotbox', 'super', 'munchies', 'big', 'blank']) {
		const p = drawUntil(() => f2play(10, r), (x) => f2Matches(x, want), F2_TRIES);
		assert.ok(f2Matches(p, want), want);
		assert.equal(p.kind, 'spin');
		assert.equal(p.cost, 10);
	}
});

// --- the blackjack table ---

const T0 = 1_800_000_000_000;
const PA = { id: A, name: 'Abscar', op: 'abscar', dev: 'devA0001' };
const PB = { id: B, name: 'Ingman', op: 'ingman', dev: 'devB0002' };
const wire = (doc) => fromTableWire(JSON.parse(JSON.stringify(toTableWire(doc))));
const key = (c) => `${c.r}${c.s}`;

test('the dealer gets the picked cards, on every page, and the shoe stays one shoe', () => {
	let doc = sit(emptyTable(), PA, T0);
	doc = placeBet(doc, PA, 25, T0 + 1000, { id: 'round0000001', seed: 42, dc: [10, 6, 13], di: 'rig0001' });
	const again = wire(doc);
	assert.deepEqual(again.round.dc, [10, 6, 13]);
	assert.equal(again.round.di, 'rig0001');
	const v = viewRound(again.round, T0 + 2000);
	assert.deepEqual(
		v.dealer.map((c) => c.r),
		[10, 6]
	);
	const shoe = tableShoe(again.round);
	assert.deepEqual(
		shoe.slice(5 * 24, 5 * 24 + 3).map((c) => c.r),
		[10, 6, 13]
	);
	// a dealer blackjack ends everyone's hand at once
	let bj = sit(emptyTable(), PA, T0);
	bj = placeBet(bj, PA, 25, T0 + 1000, { id: 'round0000002', seed: 43, dc: [1, 13], di: 'rig0002' });
	const vb = viewRound(bj.round, T0 + 2000);
	assert.ok(vb.dealerBj);
	assert.ok(vb.seats[0].play.finished);
});

test('luck at the table: better or worse cards, the same on every page, no card twice', () => {
	const score = (lk, seed) => {
		let doc = sit(sit(emptyTable(), PA, T0), PB, T0);
		doc = placeBet(doc, PA, 25, T0 + 1000, { id: 'round0000001', seed }, { luck: lk });
		doc = placeBet(doc, PB, 25, T0 + 1500, { id: 'round0000001', seed }, { luck: lk });
		const r = wire(doc).round;
		assert.equal(r.hands[A].lk, lk || undefined);
		const shoe = tableShoe(r);
		assert.deepEqual(shoe.map(key).sort(), roundShoe(seed).map(key).sort(), 'the same cards, moved');
		const dealer = shoe.slice(5 * 24, 6 * 24);
		const a = stretchScore(shoe.slice(0, 24), dealer);
		const b = stretchScore(shoe.slice(24, 48), dealer);
		if (lk) assert.notDeepEqual(shoe.slice(0, 24), shoe.slice(24, 48), 'two seats never get the same stretch');
		assert.deepEqual(tableShoe(wire(doc).round), shoe, 'every page works out the same');
		return Math.round(a) + Math.round(b);
	};
	const sum = (lk) => {
		let n = 0;
		for (let s = 1; s <= 600; s++) n += score(lk, s);
		return n / 1200;
	};
	const [lo, mid, hi] = [sum(-100), sum(0), sum(100)];
	assert.ok(lo < mid - 0.25 && hi > mid + 0.25, `average hand −100 ${lo.toFixed(2)} · 0 ${mid.toFixed(2)} · +100 ${hi.toFixed(2)}`);
});

test('a round without settings deals exactly as before', () => {
	let doc = sit(emptyTable(), PA, T0);
	doc = placeBet(doc, PA, 25, T0 + 1000, { id: 'round0000001', seed: 77 });
	assert.equal(tableShoe(doc.round), roundShoe(77));
	assert.deepEqual(viewRound(doc.round, T0 + 2000).dealer, dealerStart(roundShoe(77)));
	assert.deepEqual(viewRound(doc.round, T0 + 2000).seats[0].play.cards, playHand(roundShoe(77), 0, '', false).cards);
});

test('Kushburst: a picked result is read back, and each kind gives what it says', () => {
	const t = cleanTune({ kushburst: { id: 'rig0001', who: A, what: 'kushburst', every: 1 }, odds: { kushburst: 30 } });
	assert.deepEqual(t.kushburst, { id: 'rig0001', who: A, what: 'kushburst', every: 1 });
	assert.deepEqual(t.odds, { kushburst: 30 });
	assert.equal(cleanTune({ kushburst: { id: 'rig0001', who: A, what: 'jackpot' } }), undefined, 'not a Kushburst kind');
	assert.equal(luckFor(t, 'kushburst', A), 30);
	const rand = seeded(42);
	for (let i = 0; i < 20; i++) {
		const burst = kushForced('kushburst', 100, rand);
		assert.ok(burst.steps[0].mult > 1 && kushMatches(burst, 'kushburst'));
		assert.equal(burst.cost, 100, 'paid like a normal spin');
		assert.ok(kushMatches(kushForced('leaf', 100, rand), 'leaf'));
		const big = kushForced('big', 100, rand);
		assert.ok(big.win >= 100 * KUSH_BIG);
		assert.equal(kushForced('blank', 100, rand).win, 0);
	}
});

// ---------------------------------------------------------------------------------------------
// Karma luck (2026-11-20): hearts earned in BurgiGives → luck on the slot machines

test('karma luck: +5 per step of hearts earned, up to +40', () => {
	assert.equal(KARMA_MAX, 40);
	assert.deepEqual(karmaLuck(0), { luck: 0, step: 0, steps: 8, hearts: 0, next: 10, need: 10, nextLuck: 5 });
	assert.equal(karmaLuck(9).luck, 0);
	assert.equal(karmaLuck(9).need, 1);
	assert.equal(karmaLuck(10).luck, 5, 'the first step at 10 hearts');
	const k = karmaLuck(11);
	assert.equal(k.next, 25);
	assert.equal(k.need, 14);
	assert.equal(k.nextLuck, 10);
	assert.equal(karmaLuck(120).luck, 20);
	assert.equal(karmaLuck(2499).luck, 35);
	const top = karmaLuck(2500);
	assert.equal(top.luck, 40);
	assert.equal(top.next, null);
	assert.equal(top.need, 0);
	assert.equal(top.nextLuck, null);
	assert.equal(karmaLuck(1e9).luck, 40, 'never past the top');
	for (const junk of [-5, NaN, Infinity]) assert.equal(karmaLuck(junk).luck, 0);
	// it only grows with more hearts
	let last = 0;
	for (let h = 0; h <= 3000; h += 7) {
		const l = karmaLuck(h).luck;
		assert.ok(l >= last);
		last = l;
	}
	// a first gift: 1,000 🍔 to one cause = 1 + 10 hearts = the first step
	const once = { dev: { devA: { s: { holk: 1000 }, at: 5 } } };
	assert.equal(heartsEarned(once).earned, 11);
	assert.equal(karmaLuck(heartsEarned(once).earned).luck, 5);
	// 1,000 🍔 to every cause = 11 + 110 = 121 hearts = +20
	const all = { dev: { devA: { s: Object.fromEntries(ORG_IDS.map((o) => [o, 1000])), at: 5 } } };
	assert.equal(karmaLuck(heartsEarned(all).earned).luck, 20);
});

test('karma luck counts on the slot machines only, and adds to the control room’s settings', () => {
	for (const g of ['slots', 'fortune2', 'book', 'kushburst', 'stash', 'skeddwood']) {
		assert.ok(karmaCounts(g), g);
		assert.equal(luckFor(undefined, g, A, 25), 25);
	}
	for (const g of ['roulette', 'blackjack', 'bank', 'donate', 'admin']) assert.ok(!karmaCounts(g), g);
	assert.equal(luckFor(undefined, 'roulette', A, 40), 0);
	assert.equal(luckFor(undefined, 'blackjack', A, 40), 0);
	const t = { odds: { slots: 20, book: -10 }, luck: { [A]: 30, [B]: -100 } };
	assert.equal(luckFor(t, 'slots', A, 15), 65, 'odds + luck + karma');
	assert.equal(luckFor(t, 'book', A, 15), 35);
	assert.equal(luckFor(t, 'slots', A, 80), 100, 'clamped at +100');
	assert.equal(luckFor(t, 'fortune2', B, 40), -60, 'karma eases a minus setting');
	assert.equal(luckFor({ odds: { stash: -100 }, luck: { [B]: -100 } }, 'stash', B, 40), -100, 'still −100 with the game’s odds down too');
	assert.equal(luckFor(t, 'roulette', A, 40), 30, 'roulette: Abscar’s luck only');
	assert.equal(luckFor(t, 'slots', undefined, 15), 35, 'a visitor: odds + karma');
});

test('karma luck makes the slot machines pay back more', () => {
	const run = (luck, seed, draw) => {
		const r = seeded(seed);
		let staked = 0;
		let won = 0;
		let hits = 0;
		const N = 20_000;
		for (let i = 0; i < N; i++) {
			const p = lucky(luck, r, () => draw(r), (x) => x.net);
			staked += p.win - p.net;
			won += p.win;
			if (p.win > 0) hits++;
		}
		return { rtp: won / staked, hit: hits / N };
	};
	// Book Of Skedd runs on real odds (≈ 96 % back); the party-odds machines move the same way from ≈ 4×.
	// Payback jumps around with the rare big wins, so the steps are checked on how often a spin wins.
	const book = (r) => playBook(10, 10, r);
	const [b0, b20, b40] = [run(0, 5, book), run(20, 5, book), run(KARMA_MAX, 5, book)];
	const say = (x) => `${x.rtp.toFixed(2)}× / ${(x.hit * 100).toFixed(0)} %`;
	assert.ok(b20.hit > b0.hit + 0.04 && b40.hit > b20.hit + 0.04, `Book Of Skedd: 0 ${say(b0)} · +20 ${say(b20)} · +40 ${say(b40)}`);
	assert.ok(b40.rtp > b0.rtp + 0.3, `Book Of Skedd pays back more: 0 ${say(b0)} · +40 ${say(b40)}`);
	const [s0, s40] = [run(0, 9, (r) => play(10, r)), run(KARMA_MAX, 9, (r) => play(10, r))];
	assert.ok(s40.hit > s0.hit + 0.08 && s40.rtp > s0.rtp + 0.3, `Abscar’s Fortune: 0 ${say(s0)} · +40 ${say(s40)}`);
});