// Kushburst, BurgiCasino's expanding-leaf slot (src/lib/kushburst.ts): strips, both-ways lines, the leaf
// that grows over its reel and gives respins, KUSHBURST ×3, buys, the cap, and the long-run return over
// many seeded spins (party odds: about 4× back). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	kushBuy,
	kushEvaluate,
	kushGridAt,
	kushLineWins,
	kushPlay,
	kushPlayWith,
	kushStep,
	kushTier,
	KUSH_BUYS,
	KUSH_BUY_PRICE,
	KUSH_MAX_WIN,
	KUSH_MULT,
	KUSH_PAYING,
	KUSH_PAYS,
	KUSH_REELS,
	KUSH_ROWS,
	KUSH_STRIPS,
	KUSH_SYMBOLS,
	LEAF_REELS,
	LINES,
	MAX_RESPINS
} from '../src/lib/kushburst.ts';
import { SLOT_BETS } from '../src/lib/casino-slots.ts';

const seeded = (seed) => () => {
	seed ^= seed << 13;
	seed ^= seed >>> 17;
	seed ^= seed << 5;
	return (seed >>> 0) / 4294967296;
};

test('the machine: 5 reels × 3 rows, leaves only on reels 2–4 and never two on screen per reel', () => {
	assert.equal(KUSH_STRIPS.length, KUSH_REELS);
	KUSH_STRIPS.forEach((strip, r) => {
		for (const s of KUSH_SYMBOLS) assert.equal(strip.includes(s), s === 'leaf' ? LEAF_REELS.includes(r) : true, `${s} on reel ${r + 1}`);
		// two leaves never within a screen's height of each other (the strip wraps round)
		const at = strip.flatMap((s, i) => (s === 'leaf' ? [i] : []));
		for (let i = 0; i < at.length; i++) {
			const gap = ((at[(i + 1) % at.length] - at[i] + strip.length) % strip.length) || strip.length;
			assert.ok(gap >= KUSH_ROWS, `reel ${r + 1}: leaves ${gap} apart`);
		}
	});
	assert.deepEqual(kushGridAt([0, 0, 0, 0, 0]).map((c) => c.length), [3, 3, 3, 3, 3]);
	for (const b of SLOT_BETS) assert.equal(b % 10, 0, 'whole line bets');
	// pays grow with the count and the rarer symbols pay more
	KUSH_PAYING.forEach((s, i) => {
		const [a, b, c] = KUSH_PAYS[s];
		assert.ok(a < b && b < c, s);
		if (i) assert.ok(KUSH_PAYS[s][2] >= KUSH_PAYS[KUSH_PAYING[i - 1]][2], `${s} pays at least ${KUSH_PAYING[i - 1]}`);
	});
});

test('lines pay both ways; five in a row once; the leaf stands in and pays nothing itself', () => {
	assert.deepEqual(kushLineWins(['bong', 'bong', 'bong', 'papers', 'lighter']), [{ dir: 'left', symbol: 'bong', count: 3, pays: KUSH_PAYS.bong[0] }]);
	assert.deepEqual(kushLineWins(['lighter', 'papers', 'holk', 'holk', 'holk']), [{ dir: 'right', symbol: 'holk', count: 3, pays: KUSH_PAYS.holk[0] }]);
	// a leaf in the middle joins both ends
	assert.deepEqual(kushLineWins(['grinder', 'grinder', 'leaf', 'x420', 'x420']), [
		{ dir: 'left', symbol: 'grinder', count: 3, pays: KUSH_PAYS.grinder[0] },
		{ dir: 'right', symbol: 'x420', count: 3, pays: KUSH_PAYS.x420[0] }
	]);
	assert.deepEqual(kushLineWins(['x420', 'leaf', 'leaf', 'leaf', 'x420']), [{ dir: 'both', symbol: 'x420', count: 5, pays: KUSH_PAYS.x420[2] }]);
	assert.deepEqual(kushLineWins(['brownie', 'leaf', 'leaf', 'leaf', 'bong']), [
		{ dir: 'left', symbol: 'brownie', count: 4, pays: KUSH_PAYS.brownie[1] },
		{ dir: 'right', symbol: 'bong', count: 4, pays: KUSH_PAYS.bong[1] }
	]);
	assert.deepEqual(kushLineWins(['lighter', 'grinder', 'leaf', 'papers', 'brownie']), []);
});

test('a screen with all three middle reels leaves is a KUSHBURST and pays ×3', () => {
	const g = [
		['lighter', 'grinder', 'papers'],
		['leaf', 'leaf', 'leaf'],
		['leaf', 'leaf', 'leaf'],
		['leaf', 'leaf', 'leaf'],
		['bong', 'holk', 'x420']
	];
	const e = kushEvaluate(g, 100);
	assert.equal(e.mult, KUSH_MULT);
	// every line pays from both ends (4 in a row), times 3
	assert.equal(e.lines.length, 20);
	const plain = LINES.reduce((n, rows) => n + kushLineWins(rows.map((row, r) => g[r][row])).reduce((m, w) => m + w.pays * 10, 0), 0);
	assert.equal(e.win, plain * KUSH_MULT);
	g[2] = ['leaf', 'papers', 'leaf'];
	assert.equal(kushEvaluate(g, 100).mult, 1);
});

test('a landed leaf grows over its reel and gives a respin; held reels stay; at most 3 respins', () => {
	const rand = seeded(91);
	let checked = 0;
	for (let i = 0; i < 30000; i++) {
		const p = kushPlay(100, rand);
		assert.ok(p.steps.length >= 1 && p.steps.length <= MAX_RESPINS + 1);
		p.steps.forEach((s, k) => {
			// a fresh leaf is on a middle reel that wasn't held, and it landed there
			for (const f of s.fresh) {
				assert.ok(LEAF_REELS.includes(f.reel) && !s.held.includes(f.reel));
				assert.equal(s.landed[f.reel][f.row], 'leaf');
			}
			// the screen: leaf reels are all leaves, the rest is what landed
			s.grid.forEach((col, r) => assert.deepEqual(col, s.wild.includes(r) ? ['leaf', 'leaf', 'leaf'] : s.landed[r]));
			if (k) assert.deepEqual(s.held, p.steps[k - 1].wild, 'held from the spin before');
			// only the last step may end without a new leaf; every step before it grew one
			if (k < p.steps.length - 1) assert.ok(s.fresh.length > 0);
			assert.equal(s.win, kushEvaluate(s.grid, 100).win);
		});
		const last = p.steps[p.steps.length - 1];
		if (p.steps.length <= MAX_RESPINS) assert.equal(last.fresh.length === 0 || last.wild.length === 3, true);
		if (p.steps.length > 1) checked++;
		assert.equal(p.win, Math.min(p.steps.reduce((n, s) => n + s.win, 0), KUSH_MAX_WIN * 100));
		assert.equal(p.net, p.win - p.cost);
	}
	assert.ok(checked > 3000, 'leaves came');
});

test('leaves blown in (rain / control room / buy) grow too', () => {
	const rand = seeded(7);
	const s = kushStep(100, rand, [1], [1, 2, 3, 4, 0]);
	assert.deepEqual(s.held, [1]);
	// reel 1 was held, reels 0 and 4 can't hold leaves
	assert.deepEqual(s.wild, [1, 2, 3]);
	assert.ok(s.rain.every((r) => r === 2 || r === 3));
	const burst = kushPlayWith(100, rand, LEAF_REELS);
	assert.equal(burst.steps[0].mult, KUSH_MULT);
	assert.equal(burst.steps.length, 2, 'one respin with everything held');
	assert.equal(burst.steps[1].mult, KUSH_MULT);
	assert.equal(kushTier(burst), 'kushburst');
	const one = kushPlayWith(100, rand, [2]);
	assert.ok(one.steps.length >= 2 && one.steps[0].wild.includes(2));
	assert.equal(one.cost, 100);
});

test('buys: priced × the bet, start with a leaf / a KUSHBURST', () => {
	const rand = seeded(55);
	for (const k of KUSH_BUYS) {
		const p = kushBuy(k, 50, rand);
		assert.equal(p.kind, k);
		assert.equal(p.cost, KUSH_BUY_PRICE[k] * 50);
		assert.ok(p.steps[0].wild.length >= (k === 'burst' ? 3 : 1));
		assert.ok(p.steps.length >= 2);
	}
});

test('the long run: party odds, about 4× back, the features come often enough', () => {
	const rand = seeded(20261120);
	const n = 200000;
	let paid = 0;
	let won = 0;
	let hits = 0;
	let leaf = 0;
	let burst = 0;
	for (let i = 0; i < n; i++) {
		const p = kushPlay(10, rand);
		paid += p.cost;
		won += p.win;
		if (p.win > 0) hits++;
		if (p.steps.length > 1) leaf++;
		if (p.steps.some((s) => s.mult > 1)) burst++;
	}
	const rtp = won / paid;
	assert.ok(rtp > 3 && rtp < 5, `RTP ${rtp.toFixed(3)}`);
	assert.ok(hits / n > 0.45 && hits / n < 0.65, `hit rate ${(hits / n).toFixed(3)}`);
	assert.ok(n / leaf > 3 && n / leaf < 7, `a leaf every ${(n / leaf).toFixed(1)} spins`);
	assert.ok(n / burst > 80 && n / burst < 260, `a KUSHBURST every ${(n / burst).toFixed(0)} spins`);
	for (const k of KUSH_BUYS) {
		let c = 0;
		let w = 0;
		for (let i = 0; i < 30000; i++) {
			const p = kushBuy(k, 10, rand);
			c += p.cost;
			w += p.win;
		}
		assert.ok(w / c > 2.8 && w / c < 5, `buy ${k} gives back ${(w / c).toFixed(3)}×`);
	}
});
