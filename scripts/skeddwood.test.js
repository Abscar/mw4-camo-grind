// Skeddwood (src/lib/skeddwood.ts), BurgiCasino's third slot: the reel strips, the cowboy's nudge, the ways
// maths with splits, shots and cowboy multipliers, High Noon, the Skedd, free spins with sticky cowboys and
// the upgrade, buy prices and the long-run return over many seeded plays. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	buy,
	freeRun,
	play,
	playStops,
	skwMatches,
	skwTier,
	spinOnce,
	waysWins,
	windowAt,
	ALLOWED,
	BUY_PRICE,
	COWBOY_REELS,
	FREE_ALLOWED,
	FREE_MAX,
	FREE_START,
	FREE_STRIPS,
	LOWS,
	MAX_WIN,
	PAYS,
	PAY_SYMBOLS,
	REELS,
	RETRIGGER,
	ROWS,
	SKEDD_REEL,
	SKEDD_STOP,
	SKW_BUYS,
	SKW_FORCES,
	STACK,
	STRIPS,
	UPGRADE_SPINS
} from '../src/lib/skeddwood.ts';

/** A small seeded generator (xorshift), so every run gives the same plays. */
function seeded(seed) {
	let x = seed >>> 0 || 1;
	return () => {
		x ^= x << 13;
		x ^= x >>> 17;
		x ^= x << 5;
		return (x >>> 0) / 0x1_0000_0000;
	};
}
const cell = (s, more = {}) => ({ s, ...more });
const col = (n, s = 'star') => Array.from({ length: n }, () => cell(s));
/** A screen of non-paying fillers (stars break every way), to fill in by hand. */
const blank = () => ROWS.map((n) => col(n, 'grave'));

test('reel strips: the right symbols on the right reels, the same on every page', () => {
	for (const [name, strips] of [
		['normal', STRIPS],
		['free', FREE_STRIPS]
	]) {
		assert.equal(strips.length, REELS);
		strips.forEach((strip, r) => {
			const has = (s) => strip.some((x) => x.s === s);
			assert.ok(strip.length > 30, `${name} reel ${r + 1}: long enough`);
			if (r === SKEDD_REEL) for (const low of LOWS) assert.ok(!has(low), `no ${low} on reel 5`);
			assert.equal(has('cowboy'), COWBOY_REELS.includes(r), `${name} reel ${r + 1}: cowboy only on reels 2–4`);
			assert.equal(has('cylinder'), r === 0, `${name} reel ${r + 1}: cylinder only on reel 1`);
			assert.equal(has('skedd'), r === SKEDD_REEL, `${name} reel ${r + 1}: Skedd only on reel 5`);
			if (has('star')) assert.ok(r === 1 || r === 3, `${name}: stars only on reels 2 and 4`);
			if (has('skull')) assert.ok(name === 'normal' && COWBOY_REELS.includes(r), 'skulls only on reels 2–4 of the normal reels');
			if (has('grave')) assert.ok(name === 'free' && r < 4, 'tombstones only in free spins, reels 1–4');
			// every cowboy is whole: parts 0, 1, 2, 3 in a row
			strip.forEach((x, i) => {
				if (x.s === 'cowboy' && x.p === 0) for (let k = 0; k < STACK; k++) assert.deepEqual(strip[(i + k) % strip.length], { s: 'cowboy', p: k });
			});
		});
	}
	assert.deepEqual(STRIPS, STRIPS.map((s) => s.map((x) => ({ ...x }))), 'plain data');
});

test('reel strips: a window with part of a cowboy shows no other special; the Skedd never lands halfway', () => {
	for (const [strips, allowed] of [
		[STRIPS, ALLOWED],
		[FREE_STRIPS, FREE_ALLOWED]
	]) {
		for (const r of COWBOY_REELS) {
			const strip = strips[r];
			for (let st = 0; st < strip.length; st++) {
				const w = windowAt(strip, st, ROWS[r]);
				if (w.some((x) => x.s === 'cowboy')) assert.ok(w.every((x) => x.s === 'cowboy' || PAY_SYMBOLS.includes(x.s)), `reel ${r + 1} stop ${st}: a special next to the cowboy`);
			}
		}
		const strip = strips[SKEDD_REEL];
		for (const st of allowed[SKEDD_REEL]) {
			const n = windowAt(strip, st, 2).filter((x) => x.s === 'skedd').length;
			assert.ok(n === 0 || n === 2, `reel 5 stop ${st}: half a Skedd`);
		}
	}
	assert.deepEqual(
		windowAt(FREE_STRIPS[SKEDD_REEL], SKEDD_STOP, 2).map((x) => x.s),
		['skedd', 'skedd']
	);
});

test('the cowboy nudges into his reel: +1 to his multiplier per step', () => {
	const strip = STRIPS[1];
	const top = strip.findIndex((x) => x.s === 'cowboy' && x.p === 0);
	const L = strip.length;
	const base = STRIPS.map((s, r) => ALLOWED[r].find((st) => windowAt(s, st, ROWS[r]).every((x) => PAY_SYMBOLS.includes(x.s))));
	for (const [stop, steps, dir] of [
		[top, 0, 0],
		[(top + 2) % L, 2, -1],
		[(top + 3) % L, 3, -1],
		[(top - 1 + L) % L, 1, 1],
		[(top - 3 + L) % L, 3, 1]
	]) {
		const stops = [...base];
		stops[1] = stop;
		const s = spinOnce(100, seeded(1), null, {}, stops);
		assert.equal(s.cowboys[1], 1 + steps, `stop ${stop}: multiplier`);
		assert.deepEqual(
			s.grid[1].map((c) => [c.s, c.p]),
			[0, 1, 2, 3].map((p) => ['cowboy', p]),
			'he fills the reel'
		);
		if (steps) assert.deepEqual(s.nudges, [{ reel: 1, from: stop, to: top, steps, dir, mult: 1 + steps }]);
		else assert.deepEqual(s.nudges, []);
	}
});

test('ways: matching symbols on reels in a row from reel 1, counts multiplied', () => {
	const g = blank();
	g[0][0] = cell('ten');
	g[1][0] = cell('ten');
	g[1][3] = cell('ten');
	g[2][2] = cell('ten');
	let r = waysWins(g, {}, false, 100);
	assert.deepEqual(r.wins, [{ sym: 'ten', reels: 3, ways: 2, mult: 1, win: PAYS.ten[0] * 2 }]);
	// a split symbol counts twice, a shot one doubles
	g[2][2] = cell('ten', { split: true, x: 2 });
	r = waysWins(g, {}, false, 100);
	assert.equal(r.wins[0].ways, 8);
	// reel 4 continues it, a wild on reel 5 makes it five
	g[3][1] = cell('hwild');
	g[4] = [cell('skedd', { p: 0 }), cell('skedd', { p: 1 })];
	r = waysWins(g, {}, false, 100);
	assert.equal(r.wins.find((w) => w.sym === 'ten').reels, 5);
	assert.equal(r.wins.find((w) => w.sym === 'ten').ways, 2 * 4 * 1 * 2);
	// no win on a reel 1 symbol that stops at reel 2
	const h = blank();
	h[0][0] = cell('ace');
	h[1][0] = cell('ace');
	assert.deepEqual(waysWins(h, {}, false, 100).wins, []);
});

test('ways: a cowboy is one WILD with his multiplier: added up in normal spins, multiplied in free spins', () => {
	const g = blank();
	g[0][1] = cell('king');
	g[1] = [0, 1, 2, 3].map((p) => cell('cowboy', { p }));
	g[2] = [0, 1, 2, 3].map((p) => cell('cowboy', { p }));
	g[3][0] = cell('king');
	const base = waysWins(g, { 1: 2, 2: 3 }, false, 100).wins.find((w) => w.sym === 'king');
	assert.deepEqual(base, { sym: 'king', reels: 4, ways: 1, mult: 5, win: PAYS.king[1] * 5 });
	const free = waysWins(g, { 1: 2, 2: 3 }, true, 100).wins.find((w) => w.sym === 'king');
	assert.equal(free.mult, 6);
	// ways made only of wilds go to the six-gun, not to every symbol
	const w = blank();
	w[0][0] = cell('cylinder');
	w[1] = [0, 1, 2, 3].map((p) => cell('cowboy', { p }));
	w[2][0] = cell('hwild');
	const r = waysWins(w, { 1: 1 }, false, 100);
	assert.deepEqual(
		r.wins.map((x) => x.sym),
		['sixgun']
	);
	assert.equal(r.win, PAYS.sixgun[0]);
});

test('High Noon, the Skedd and Quick Draw change the screen as the rules say', () => {
	const rand = seeded(7);
	let noon = null;
	let skedd = null;
	let quick = null;
	for (let i = 0; i < 200_000 && !(noon && skedd && quick); i++) {
		const s = spinOnce(100, rand);
		if (!noon && s.highNoon && !Object.keys(s.cowboys).length) noon = s;
		if (!skedd && s.skedd) skedd = s;
		if (!quick && s.shots.length) quick = s;
	}
	assert.ok(noon && skedd && quick, 'all three come up');
	// High Noon: no low symbol or star left on reels 2–4, the flipped ones are WILD
	for (const r of COWBOY_REELS) for (const c of noon.grid[r]) assert.ok(!LOWS.includes(c.s) && c.s !== 'star');
	assert.ok(noon.grid.slice(1, 4).flat().some((c) => c.s === 'hwild' && c.flip));
	// the Skedd: reel 1's middle row and reels 2–4's two middle rows split (paying symbols / wilds)
	assert.ok(skedd.grid[0][1].split || !PAY_SYMBOLS.includes(skedd.grid[0][1].s));
	for (const r of [1, 2, 3]) if (!skedd.cowboys[r]) for (const row of [1, 2]) if (PAY_SYMBOLS.includes(skedd.grid[r][row].s)) assert.ok(skedd.grid[r][row].split);
	assert.ok(!skedd.grid[0][0].split && !skedd.grid[1][0].split, 'top rows stay whole');
	// Quick Draw: 3–6 shots at reels 2–5
	assert.ok(quick.shots.length >= 3 && quick.shots.length <= 6);
	for (const sh of quick.shots) assert.ok(sh.reel >= 1 && sh.reel < REELS && sh.row < ROWS[sh.reel]);
	const doubled = quick.grid.flat().reduce((n, c) => n + Math.log2(c.x ?? 1), 0);
	const onCowboys = quick.shots.filter((sh) => quick.cowboys[sh.reel]).length;
	assert.equal(doubled + onCowboys, quick.shots.length, 'every shot doubled something');
});

test('free spins: cowboys stick and grow, tombstones add spins, Gold Rush upgrades to Divergence', () => {
	const rand = seeded(99);
	let upgraded = 0;
	let retrig = 0;
	for (let i = 0; i < 3000; i++) {
		const mode = i % 4 ? 'gold' : 'divergence';
		const run = freeRun(100, mode, FREE_START[mode], rand);
		assert.ok(run.length >= FREE_START[mode] && run.length <= FREE_MAX);
		const held = {};
		let m = mode;
		let left = FREE_START[mode];
		for (const s of run) {
			assert.equal(s.mode, m, 'played in the right mode');
			assert.deepEqual(s.held, held, 'sticky cowboys carried over');
			for (const r of Object.keys(held)) assert.ok(s.cowboys[r] >= held[r], 'a sticky cowboy never goes down');
			if (m === 'divergence') assert.ok(s.skedd, 'Divergence: the Skedd on every spin');
			for (const [r, g] of Object.entries(s.grow)) held[r] = (held[r] ?? 0) + g;
			left -= 1;
			let more = s.graves >= 3 ? RETRIGGER[m] : 0;
			if (s.graves >= 3) retrig++;
			if (s.upgrade) {
				assert.equal(m, 'gold');
				upgraded++;
				m = 'divergence';
				more += UPGRADE_SPINS;
			}
			assert.equal(s.more ?? 0, more);
			left += more;
		}
		if (run.length < FREE_MAX) assert.equal(left, 0, 'every spin played');
	}
	assert.ok(upgraded > 20, `upgrades happen (${upgraded})`);
	assert.ok(retrig > 20, `tombstones retrigger (${retrig})`);
});

test('buy prices, the cap, tiers and the control room picks', () => {
	const rand = seeded(5);
	for (const k of SKW_BUYS) {
		const p = buy(k, 50, rand);
		assert.equal(p.cost, BUY_PRICE[k] * 50);
		assert.ok(p.base === null && p.free.length >= 8);
		assert.equal(p.net, p.win - p.cost);
		assert.ok(p.win <= MAX_WIN * 50);
	}
	assert.equal(skwTier({ win: 0, cost: 10 }), 'none');
	assert.equal(skwTier({ win: 100, cost: 10 }), 'big');
	assert.equal(skwTier({ win: 300, cost: 10 }), 'mega');
	assert.equal(skwTier({ win: 1000, cost: 10 }), 'legend');
	const seen = new Set();
	for (let i = 0; i < 40_000 && seen.size < SKW_FORCES.length; i++) {
		const p = play(10, rand);
		for (const f of SKW_FORCES) if (skwMatches(p, f)) seen.add(f);
	}
	assert.deepEqual([...seen].sort(), [...SKW_FORCES].sort(), 'every control-room pick can come up');
	// a picked screen plays like a landed one
	const stops = STRIPS.map((s, r) => ALLOWED[r][3]);
	const a = playStops(stops, 100, seeded(3));
	assert.deepEqual(a.base.stops, stops);
});

test('long run: normal casino odds (about 96–97 % back), about a quarter of the spins win', () => {
	const rand = seeded(2026);
	const N = 120_000;
	let paid = 0;
	let won = 0;
	let hits = 0;
	let gold = 0;
	let div = 0;
	for (let i = 0; i < N; i++) {
		const p = play(10, rand);
		paid += p.cost;
		won += p.win;
		if (p.win > 0) hits++;
		if (p.mode === 'gold') gold++;
		if (p.mode === 'divergence') div++;
	}
	const rtp = won / paid;
	assert.ok(rtp > 0.75 && rtp < 1.25, `return ${rtp.toFixed(2)}×`);
	assert.ok(hits / N > 0.22 && hits / N < 0.32, `hit rate ${(hits / N).toFixed(3)}`);
	assert.ok(N / gold > 200 && N / gold < 400, `Gold Rush 1 in ${(N / gold).toFixed(0)}`);
	assert.ok(div >= 2 && N / div > 4000, `Divergence 1 in ${(N / div).toFixed(0)}`);
	for (const k of SKW_BUYS) {
		let w = 0;
		let c = 0;
		const n = k === 'divergence' ? 6000 : 4000;
		for (let i = 0; i < n; i++) {
			const p = buy(k, 10, rand);
			w += p.win;
			c += p.cost;
		}
		assert.ok(w / c > 0.6 && w / c < 1.5, `buy ${k}: ${(w / c).toFixed(2)}×`);
	}
});
