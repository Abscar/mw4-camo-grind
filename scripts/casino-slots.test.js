// Abscar's Fortune, the Burger Bandit slot (src/lib/casino-slots.ts): lines, wilds, the scatter, free
// spins, and the long-run return measured over many seeded spins. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluate, lineWin, play, winTier, LINES, PAYS, PAYS2, REELS, ROWS, SLOT_BETS, STRIPS, SYMBOLS, FREE_MULT } from '../src/lib/casino-slots.ts';

const seeded = (seed) => () => {
	seed ^= seed << 13;
	seed ^= seed >>> 17;
	seed ^= seed << 5;
	return (seed >>> 0) / 4294967296;
};

test('the machine: 5 reels × 3 rows, 10 lines, every symbol on every reel, bets give whole line bets', () => {
	assert.equal(STRIPS.length, REELS);
	for (const strip of STRIPS) for (const s of SYMBOLS) assert.ok(strip.includes(s), s);
	assert.equal(LINES.length, 10);
	for (const line of LINES) assert.ok(line.length === REELS && line.every((r) => r >= 0 && r < ROWS));
	assert.equal(new Set(LINES.map((l) => l.join())).size, 10, 'no line twice');
	for (const bet of SLOT_BETS) assert.equal(bet % 10, 0);
	// the higher the symbol, the more it pays
	const order = ['pickle', 'tomato', 'cheese', 'fries', 'shake', 'hotdog', 'burger', 'wild'];
	for (let i = 1; i < order.length; i++) for (let k = 0; k < 3; k++) assert.ok(PAYS[order[i]][k] >= PAYS[order[i - 1]][k], `${order[i]} ${k + 3}`);
});

test('a payline: left to right, wilds stand in, the scatter breaks it, the best win counts', () => {
	assert.deepEqual(lineWin(['burger', 'burger', 'burger', 'fries', 'pickle']), { symbol: 'burger', count: 3, pays: PAYS.burger[0] });
	assert.deepEqual(lineWin(['wild', 'burger', 'wild', 'burger', 'pickle']), { symbol: 'burger', count: 4, pays: PAYS.burger[1] });
	assert.equal(lineWin(['pickle', 'pickle', 'fries', 'pickle', 'pickle']), null, 'not from the first reel');
	assert.equal(lineWin(['fries', 'scatter', 'fries', 'fries', 'fries']), null);
	// three wilds then pickles: the wild run (150) beats five pickles (70)
	assert.deepEqual(lineWin(['wild', 'wild', 'wild', 'pickle', 'pickle']), { symbol: 'wild', count: 3, pays: PAYS.wild[0] });
	assert.deepEqual(lineWin(['wild', 'wild', 'wild', 'wild', 'wild']), { symbol: 'wild', count: 5, pays: PAYS.wild[2] });
	// the top symbols pay for 2 in a row; the others don't
	assert.deepEqual(lineWin(['burger', 'burger', 'fries', 'pickle', 'pickle']), { symbol: 'burger', count: 2, pays: PAYS2.burger });
	assert.deepEqual(lineWin(['wild', 'wild', 'scatter', 'pickle', 'pickle']), { symbol: 'wild', count: 2, pays: PAYS2.wild });
	// two wilds before fries count as three fries when that pays more
	assert.deepEqual(lineWin(['wild', 'wild', 'fries', 'pickle', 'pickle']), { symbol: 'fries', count: 3, pays: PAYS.fries[0] });
	assert.equal(lineWin(['pickle', 'pickle', 'fries', 'onion', 'onion']), null);
	assert.equal(lineWin(['scatter', 'scatter', 'scatter', 'pickle', 'pickle']), null);
});

test('evaluate: line bet = bet ÷ 10, ketchup anywhere pays and gives free spins', () => {
	// find stops that show 3+ ketchup and check the scatter part
	const rand = seeded(11);
	let found = null;
	for (let i = 0; i < 200_000 && !found; i++) {
		const stops = STRIPS.map((s) => Math.floor(rand() * s.length));
		const r = evaluate(stops, 100);
		if (r.scatters >= 3) found = r;
	}
	assert.ok(found, 'a ketchup screen exists');
	assert.ok(found.freeSpins >= 8 && found.scatterWin >= 200);
	const doubled = evaluate(found.stops, 100, FREE_MULT);
	assert.equal(doubled.win, found.win * 2);
	for (const l of found.lines) assert.equal(l.win, Math.round(PAYS[l.symbol][l.count - 3] * 10));
});

test('long run: ≈ 99 % back (still under 100 %), about 3 in 10 spins win, free spins now and then', () => {
	const rand = seeded(2026);
	const N = 300_000;
	let bet = 0;
	let won = 0;
	let hits = 0;
	let features = 0;
	let jackpots = 0;
	for (let i = 0; i < N; i++) {
		const p = play(10, rand);
		bet += p.bet;
		won += p.win;
		if (p.base.win > 0) hits++;
		if (p.free.length) features++;
		if (winTier(p) === 'jackpot') jackpots++;
		assert.equal(p.net, p.win - p.bet);
	}
	const rtp = won / bet;
	assert.ok(rtp > 0.95 && rtp < 1.02, `RTP ${rtp}`);
	assert.ok(hits / N > 0.25 && hits / N < 0.35, `hit rate ${hits / N}`);
	assert.ok(N / features > 40 && N / features < 120, `free spins every ${N / features}`);
	assert.ok(jackpots < 20, 'the jackpot stays rare');
});
