// Abscar's Fortune, the Burger Bandit slot (src/lib/casino-slots.ts): lines, wilds, the scatter, free
// spins, the bonus features (Burger Box, wheel, buy bonus) and the long-run return measured over many
// seeded spins. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	boxBonus,
	buy,
	capWin,
	cellKey,
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
	FREE_STRIPS,
	LINES,
	MAX_WIN,
	PAYS,
	PAYS2,
	REELS,
	ROWS,
	SLOT_BETS,
	STRIPS,
	SYMBOLS,
	WEED_VALUES,
	WHEEL,
	WHEEL_REELS
} from '../src/lib/casino-slots.ts';

const seeded = (seed) => () => {
	seed ^= seed << 13;
	seed ^= seed >>> 17;
	seed ^= seed << 5;
	return (seed >>> 0) / 4294967296;
};
const SPECIAL = ['scatter', 'box', 'wheel', 'weed'];

test('the machine: 5 reels × 3 rows, 10 lines, symbols on their reels, bets give whole line bets', () => {
	assert.equal(STRIPS.length, REELS);
	assert.equal(FREE_STRIPS.length, REELS);
	STRIPS.forEach((strip, r) => {
		for (const s of SYMBOLS) {
			// weeds sit only on the middle reel in normal spins
			const want = s === 'box' ? BOX_REELS.includes(r) : s === 'wheel' ? WHEEL_REELS.includes(r) : s === 'weed' ? r === 2 : true;
			assert.equal(strip.includes(s), want, `${s} on reel ${r + 1}`);
		}
	});
	// the free spins' reels: a weed on every reel, WILDs only on reels 2–4 (a sticky WILD only ever stands in)
	FREE_STRIPS.forEach((strip, r) => {
		for (const s of SYMBOLS) {
			const want = s === 'box' ? BOX_REELS.includes(r) : s === 'wheel' ? WHEEL_REELS.includes(r) : s === 'wild' ? r >= 1 && r <= 3 : true;
			assert.equal(strip.includes(s), want, `free reels: ${s} on reel ${r + 1}`);
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

test('the strips: ketchup, bonus and weed stops are spread out, so a reel never shows two of them at once', () => {
	[...STRIPS, ...FREE_STRIPS].forEach((strip, r) => {
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
	assert.equal(lineWin(['fries', 'weed', 'fries', 'fries', 'fries']), null, 'a weed breaks a line too');
	assert.equal(lineWin(['weed', 'wild', 'fries', 'fries', 'fries']), null);
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
	assert.ok(found.freeSpins >= 7 && found.scatterWin >= 200);
	const doubled = evaluate(found.stops, 100, 2);
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

/** The same on the free spins' reels. */
function findFree(want, seed = 13, tries = 400_000, opts = {}) {
	const rand = seeded(seed);
	for (let i = 0; i < tries; i++) {
		const stops = FREE_STRIPS.map((s) => Math.floor(rand() * s.length));
		const r = evaluate(stops, 100, 1, { strips: FREE_STRIPS, ...opts });
		if (want(r)) return r;
	}
	return null;
}

test('weeds: ×2 … ×100; every weed on a winning screen adds up and multiplies the line + ketchup win, no win = no effect', () => {
	assert.deepEqual(
		WEED_VALUES.map(([x]) => x),
		[2, 3, 5, 10, 25, 50, 100]
	);
	assert.ok(WEED_VALUES.every(([, w]) => w > 0));
	// a winning screen with two weeds, given ×5 and ×10: the win is raw × 15
	const two = findFree((r) => r.weeds.length >= 2 && r.raw > 0, 3, 2_000_000);
	assert.ok(two, 'a winning screen with two weeds exists on the free reels');
	const vals = [5, 10, 2, 2, 2].slice(0, two.weeds.length);
	const again = evaluate(two.stops, 100, 1, { strips: FREE_STRIPS, values: vals });
	const sum = vals.reduce((n, x) => n + x, 0);
	assert.equal(again.weedMult, sum);
	assert.deepEqual(
		again.weeds.map((w) => w.x),
		vals
	);
	assert.equal(again.win, again.raw * sum);
	assert.equal(again.lines.reduce((n, l) => n + l.win, 0) + again.scatterWin, again.raw, 'line wins are shown before the weeds');
	for (const w of again.weeds) assert.equal(again.grid[w.reel][w.row], 'weed');
	// a weed on a screen that won nothing does nothing
	const dud = findFree((r) => r.weeds.length >= 1 && r.raw === 0);
	assert.ok(dud && dud.win === 0 && dud.weedMult > 0);
	// in normal spins a weed lands only on the middle reel
	const base = findStops((r) => r.weeds.length > 0);
	assert.ok(base && base.weeds.every((w) => w.reel === 2));
});

test('sticky WILDs (free spins): held cells show a WILD and stand in, new WILDs are reported to stick, a WILD covers a weed', () => {
	// the free reels never land a WILD on reels 1 and 5
	const held = [cellKey(1, 0), cellKey(2, 1), cellKey(3, 2)];
	const r = findFree(() => true, 21, 1, { sticky: held });
	for (const k of held) {
		const [reel, row] = k.split('-').map(Number);
		assert.equal(r.grid[reel][row], 'wild');
	}
	assert.deepEqual(r.sticky, held);
	// a landed WILD that isn't held yet sticks from the next spin
	const fresh = findFree((x) => x.newSticky.length > 0, 22, 400_000, { sticky: [] });
	assert.ok(fresh);
	for (const k of fresh.newSticky) {
		const [reel, row] = k.split('-').map(Number);
		assert.ok(reel >= 1 && reel <= 3 && fresh.grid[reel][row] === 'wild');
	}
	// a weed under a sticky WILD doesn't count
	const weedy = findFree((x) => x.weeds.length > 0, 23);
	const w = weedy.weeds[0];
	const covered = evaluate(weedy.stops, 100, 1, { strips: FREE_STRIPS, sticky: [cellKey(w.reel, w.row)] });
	assert.equal(covered.weeds.length, weedy.weeds.length - 1);
	assert.equal(covered.grid[w.reel][w.row], 'wild');
	// normal spins have no sticky WILDs
	assert.deepEqual(findStops((x) => x.grid.flat().includes('wild')).newSticky, []);
});

test('a free-spins run: WILDs stick until it ends (retriggers too), on reels 2–4 only; the next run starts clean', () => {
	const rand = seeded(77);
	let runs = 0;
	let withSticky = 0;
	for (let i = 0; i < 40_000 && runs < 300; i++) {
		const p = play(10, rand);
		if (!p.free.length) continue;
		runs++;
		let held = [];
		for (const s of p.free) {
			assert.deepEqual(s.sticky, held);
			for (const k of held) {
				const [reel, row] = k.split('-').map(Number);
				assert.equal(s.grid[reel][row], 'wild');
				assert.ok(reel >= 1 && reel <= 3);
			}
			held = [...held, ...s.newSticky];
		}
		if (held.length) withSticky++;
		assert.deepEqual(p.free[0].sticky, [], 'every run starts without sticky WILDs');
	}
	assert.ok(runs >= 100, `${runs} free-spins runs`);
	assert.ok(withSticky / runs > 0.4, `sticky WILDs in ${withSticky} of ${runs} runs`);
});

test('max win: a play never pays more than MAX_WIN × the bet', () => {
	assert.equal(MAX_WIN, 5000);
	assert.equal(capWin(10_000_000, 10), 50_000);
	assert.equal(capWin(4_999, 10), 4_999);
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
	let weeds = 0;
	for (let i = 0; i < N; i++) {
		const p = play(10, rand);
		bet += p.cost;
		won += p.win;
		if (p.base.weeds.length) weeds++;
		if (p.base.win > 0) hits++;
		if (p.base.freeSpins) frees++;
		if (p.base.boxBonus) boxes++;
		if (p.base.wheelBonus) wheels++;
		assert.equal(p.net, p.win - p.bet);
		assert.equal(p.win, capWin(spinTotal(p.base) + p.free.reduce((n, s) => n + spinTotal(s), 0), p.bet));
		if (p.free.length) assert.equal(p.freeStart, p.base.freeSpins + (p.base.wheelBonus?.spins ?? 0));
	}
	const rtp = won / bet;
	assert.ok(rtp > 0.94 && rtp < 1, `RTP ${rtp}`);
	assert.ok(hits / N > 0.24 && hits / N < 0.35, `hit rate ${hits / N}`);
	assert.ok(N / frees > 40 && N / frees < 80, `free spins every ${N / frees}`);
	assert.ok(N / boxes > 150 && N / boxes < 400, `Burger Box every ${N / boxes}`);
	assert.ok(N / wheels > 150 && N / wheels < 400, `wheel every ${N / wheels}`);
	assert.ok(N / weeds > 12 && N / weeds < 35, `a weed lands every ${N / weeds} spins`);
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
