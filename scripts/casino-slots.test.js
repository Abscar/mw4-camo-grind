// Abscar's Fortune, the Burger Bandit slot (src/lib/casino-slots.ts): lines, wilds, the scatter, free
// spins, the bonus features (Burger Box, wheel, buy bonus) and the long-run return measured over many
// seeded spins. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	boxBonus,
	buy,
	evaluate,
	lineWin,
	play,
	spinTotal,
	wheelBonus,
	winTier,
	BOX_COUNT,
	BOX_REELS,
	BOX_SAFE,
	BUY_FREE_SPINS,
	BUY_KINDS,
	BUY_PRICE,
	FREE_MULT,
	LINES,
	PAYS,
	PAYS2,
	REELS,
	ROWS,
	SLOT_BETS,
	STRIPS,
	SYMBOLS,
	WHEEL,
	WHEEL_REELS
} from '../src/lib/casino-slots.ts';

const seeded = (seed) => () => {
	seed ^= seed << 13;
	seed ^= seed >>> 17;
	seed ^= seed << 5;
	return (seed >>> 0) / 4294967296;
};
const SPECIAL = ['scatter', 'box', 'wheel'];

test('the machine: 5 reels × 3 rows, 10 lines, symbols on their reels, bets give whole line bets', () => {
	assert.equal(STRIPS.length, REELS);
	STRIPS.forEach((strip, r) => {
		for (const s of SYMBOLS) {
			const want = s === 'box' ? BOX_REELS.includes(r) : s === 'wheel' ? WHEEL_REELS.includes(r) : true;
			assert.equal(strip.includes(s), want, `${s} on reel ${r + 1}`);
		}
	});
	assert.deepEqual(BOX_REELS, [0, 2, 4]);
	assert.deepEqual(WHEEL_REELS, [1, 2, 3]);
	assert.equal(LINES.length, 10);
	for (const line of LINES) assert.ok(line.length === REELS && line.every((r) => r >= 0 && r < ROWS));
	assert.equal(new Set(LINES.map((l) => l.join())).size, 10, 'no line twice');
	for (const bet of SLOT_BETS) assert.equal(bet % 10, 0);
	// the higher the symbol, the more it pays
	const order = ['pickle', 'tomato', 'cheese', 'fries', 'shake', 'hotdog', 'burger', 'wild'];
	for (let i = 1; i < order.length; i++) for (let k = 0; k < 3; k++) assert.ok(PAYS[order[i]][k] >= PAYS[order[i - 1]][k], `${order[i]} ${k + 3}`);
});

test('the strips: ketchup and bonus stops are spread out, so a reel never shows two of them at once', () => {
	STRIPS.forEach((strip, r) => {
		const L = strip.length;
		for (let stop = 0; stop < L; stop++) {
			const view = [0, 1, 2].map((k) => strip[(stop + k) % L]);
			assert.ok(view.filter((s) => SPECIAL.includes(s)).length <= 1, `reel ${r + 1} stop ${stop}: ${view}`);
		}
	});
	// the strips are the same on every page (fixed shuffle)
	assert.deepEqual(STRIPS, JSON.parse(JSON.stringify(STRIPS)));
});

test('a payline: left to right, wilds stand in, ketchup and bonus symbols break it, the best win counts', () => {
	assert.deepEqual(lineWin(['burger', 'burger', 'burger', 'fries', 'pickle']), { symbol: 'burger', count: 3, pays: PAYS.burger[0] });
	assert.deepEqual(lineWin(['wild', 'burger', 'wild', 'burger', 'pickle']), { symbol: 'burger', count: 4, pays: PAYS.burger[1] });
	assert.equal(lineWin(['pickle', 'pickle', 'fries', 'pickle', 'pickle']), null, 'not from the first reel');
	assert.equal(lineWin(['fries', 'scatter', 'fries', 'fries', 'fries']), null);
	assert.equal(lineWin(['fries', 'box', 'fries', 'fries', 'fries']), null);
	assert.equal(lineWin(['wheel', 'fries', 'fries', 'fries', 'fries']), null);
	assert.equal(lineWin(['wild', 'box', 'box', 'pickle', 'pickle']), null, "a wild doesn't stand in for a bonus symbol");
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

/** Stops that show a wanted screen (searched with a seeded generator). */
function findStops(want, seed = 11, tries = 400_000) {
	const rand = seeded(seed);
	for (let i = 0; i < tries; i++) {
		const stops = STRIPS.map((s) => Math.floor(rand() * s.length));
		const r = evaluate(stops, 100);
		if (want(r)) return r;
	}
	return null;
}

test('evaluate: line bet = bet ÷ 10, ketchup anywhere pays and gives free spins', () => {
	const found = findStops((r) => r.scatters >= 3);
	assert.ok(found, 'a ketchup screen exists');
	assert.ok(found.freeSpins >= 8 && found.scatterWin >= 200);
	const doubled = evaluate(found.stops, 100, FREE_MULT);
	assert.equal(doubled.win, found.win * 2);
	for (const l of found.lines) assert.equal(l.win, Math.round((l.count === 2 ? PAYS2[l.symbol] : PAYS[l.symbol][l.count - 3]) * 10));
});

test('bonus triggers: a box on each of reels 1, 3, 5 opens the Burger Box; a wheel on each of reels 2, 3, 4 spins the wheel', () => {
	const box = findStops((r) => r.box);
	assert.ok(box, 'a Burger Box screen exists');
	for (const r of BOX_REELS) assert.ok(box.grid[r].includes('box'));
	const wheel = findStops((r) => r.wheel);
	assert.ok(wheel, 'a wheel screen exists');
	for (const r of WHEEL_REELS) assert.ok(wheel.grid[r].includes('wheel'));
	// two of three isn't enough
	const two = findStops((r) => !r.box && BOX_REELS.filter((x) => r.grid[x].includes('box')).length === 2);
	assert.ok(two && !two.box);
});

test('the Burger Box: at least the safe picks, never more than the boxes, prizes from the table × the bet', () => {
	const rand = seeded(7);
	let longest = 0;
	for (let i = 0; i < 20_000; i++) {
		const b = boxBonus(50, rand);
		assert.ok(b.picks.length >= BOX_SAFE && b.picks.length <= BOX_COUNT - 1, String(b.picks.length));
		assert.equal(b.win, b.picks.reduce((n, p) => n + p, 0));
		for (const p of b.picks) assert.ok(p > 0 && p % 50 === 0);
		longest = Math.max(longest, b.picks.length);
	}
	assert.ok(longest >= 9, 'long runs happen now and then');
});

test('the wheel: 12 slices, every slice comes up, wins × the bet, free-spin slices give spins', () => {
	assert.equal(WHEEL.length, 12);
	assert.equal(WHEEL.filter((s) => s.jackpot).length, 1);
	const rand = seeded(5);
	const seen = new Set();
	for (let i = 0; i < 5000; i++) {
		const w = wheelBonus(20, rand);
		seen.add(w.slice);
		assert.equal(w.win, (WHEEL[w.slice].win ?? 0) * 20);
		assert.equal(w.spins, WHEEL[w.slice].spins ?? 0);
	}
	assert.equal(seen.size, 12);
});

test('buy bonus: costs its price, gives what it says, net = win − cost', () => {
	const rand = seeded(9);
	const free = buy('free', 20, rand);
	assert.equal(free.cost, BUY_PRICE.free * 20);
	assert.equal(free.base, null);
	assert.equal(free.freeStart, BUY_FREE_SPINS);
	assert.ok(free.free.length >= BUY_FREE_SPINS);
	const box = buy('box', 20, rand);
	assert.ok(box.box && box.freeStart === 0 && box.free.length === 0);
	assert.equal(box.win, box.box.win);
	const wheel = buy('wheel', 20, rand);
	assert.ok(wheel.wheel && wheel.freeStart === wheel.wheel.spins);
	for (const p of [free, box, wheel]) assert.equal(p.net, p.win - p.cost);
});

test('long run: ≈ 97 % back (still under 100 %), about 1 in 4 spins win, the features now and then', () => {
	const rand = seeded(2026);
	const N = 300_000;
	let bet = 0;
	let won = 0;
	let hits = 0;
	let frees = 0;
	let boxes = 0;
	let wheels = 0;
	for (let i = 0; i < N; i++) {
		const p = play(10, rand);
		bet += p.cost;
		won += p.win;
		if (p.base.win > 0) hits++;
		if (p.base.freeSpins) frees++;
		if (p.base.boxBonus) boxes++;
		if (p.base.wheelBonus) wheels++;
		assert.equal(p.net, p.win - p.bet);
		assert.equal(p.win, spinTotal(p.base) + p.free.reduce((n, s) => n + spinTotal(s), 0));
		if (p.free.length) assert.equal(p.freeStart, p.base.freeSpins + (p.base.wheelBonus?.spins ?? 0));
	}
	const rtp = won / bet;
	assert.ok(rtp > 0.94 && rtp < 1, `RTP ${rtp}`);
	assert.ok(hits / N > 0.24 && hits / N < 0.35, `hit rate ${hits / N}`);
	assert.ok(N / frees > 40 && N / frees < 80, `free spins every ${N / frees}`);
	assert.ok(N / boxes > 150 && N / boxes < 400, `Burger Box every ${N / boxes}`);
	assert.ok(N / wheels > 150 && N / wheels < 400, `wheel every ${N / wheels}`);
});

test('long run, bought features: each gives back 93–100 % of its price', () => {
	for (const kind of BUY_KINDS) {
		const rand = seeded(31 + kind.length);
		const N = 60_000;
		let paid = 0;
		let won = 0;
		for (let i = 0; i < N; i++) {
			const p = buy(kind, 10, rand);
			paid += p.cost;
			won += p.win;
		}
		const rtp = won / paid;
		assert.ok(rtp > 0.93 && rtp < 1.0, `${kind}: ${rtp}`);
	}
});

test('win tiers: relative to what was paid; the BURGER JACKPOT is five wilds only', () => {
	const fake = (win, cost, extra = {}) => ({ kind: 'spin', bet: cost, cost, base: { lines: [] }, box: null, wheel: null, freeStart: 0, free: [], win, net: win - cost, ...extra });
	assert.equal(winTier(fake(0, 10)), 'none');
	assert.equal(winTier(fake(50, 10)), 'win');
	assert.equal(winTier(fake(100, 10)), 'big');
	assert.equal(winTier(fake(250, 10)), 'mega');
	assert.equal(winTier(fake(250, 210)), 'win', 'a bought feature reads against its price');
	assert.equal(winTier(fake(10, 10, { base: { lines: [{ symbol: 'wild', count: 5 }] } })), 'jackpot');
});
