// Abscar's Stash, the tumble slot (src/lib/stash.ts): pay-anywhere wins, tumbling (pieces keep their
// ids and order while new ones drop in on top), holks (one per reel, 4+ start Sky High Spins, 3+ in them
// give more), clouds that multiply a winning spin, Double chance, buys, the cap and the long-run return
// over many seeded plays. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	anteCost,
	buy,
	cellKey,
	finalGrid,
	payStep,
	play,
	runSpin,
	winsOn,
	winTier,
	BUY_KINDS,
	BUY_PRICE,
	CLOUD_VALUES,
	COLS,
	FREE_MAX,
	FREE_SPINS,
	HOLK_PAYS,
	HOLKS_TO_RETRIGGER,
	HOLKS_TO_START,
	MAX_WIN,
	MIN_PAY,
	PAYS,
	RETRIGGER,
	ROWS,
	STASH_BETS,
	SUPER_VALUES,
	SYMS
} from '../src/lib/stash.ts';

function seeded(seed) {
	let x = seed >>> 0 || 1;
	return () => {
		x ^= x << 13;
		x ^= x >>> 17;
		x ^= x << 5;
		return (x >>> 0) / 0x1_0000_0000;
	};
}
const spinsOf = (p) => [...(p.base ? [p.base] : []), ...p.free];

/** A screen from rows of letters (one letter per reel, top row first). */
function screen(rows, legend) {
	let id = 1;
	return Array.from({ length: COLS }, (_, c) => rows.map((row) => ({ id: id++, kind: legend[row[c]] })));
}

test('the paytable: 9 symbols, 3 steps each that only go up, and higher symbols pay more', () => {
	assert.equal(SYMS.length, 9);
	for (const s of SYMS) assert.ok(PAYS[s][0] < PAYS[s][1] && PAYS[s][1] < PAYS[s][2], s);
	for (let i = 1; i < SYMS.length; i++) for (let k = 0; k < 3; k++) assert.ok(PAYS[SYMS[i]][k] > PAYS[SYMS[i - 1]][k], `${SYMS[i]} step ${k}`);
	assert.deepEqual([7, 8, 9, 10, 11, 12, 30].map(payStep), [-1, 0, 0, 1, 1, 2, 2]);
	assert.equal(MIN_PAY, 8);
	assert.deepEqual(STASH_BETS, [10, 20, 50, 100, 250, 500, 1000, 2500, 5000, 10000]);
});

test('wins pay anywhere: 8 or more of one symbol, wherever they are; holks and clouds never form a win', () => {
	const g = screen(
		['bbbbss', 'bbbbss', 'ssshhh', 'tttttt', 'lllCHp'],
		{ b: 'bud', s: 'shroom', h: 'heart', t: 'tab', l: 'lean', C: 'cloud', H: 'holk', p: 'purple' }
	);
	const wins = winsOn(g);
	// only the 8 buds pay (7 shrooms, 6 tabs, 3 hearts and 3 lean do not)
	assert.deepEqual(
		wins.map((w) => [w.sym, w.count, w.pay]),
		[['bud', 8, PAYS.bud[0]]]
	);
	assert.deepEqual(wins[0].cells, [cellKey(0, 0), cellKey(0, 1), cellKey(1, 0), cellKey(1, 1), cellKey(2, 0), cellKey(2, 1), cellKey(3, 0), cellKey(3, 1)]);
	const all = screen(['bbbbbb', 'bbbbbb', 'hhhhhh', 'hhhhhh', 'CCCCCC'], { b: 'bud', h: 'heart', C: 'cloud' });
	assert.deepEqual(
		winsOn(all).map((w) => [w.sym, w.count, w.pay]),
		[
			['bud', 12, PAYS.bud[2]],
			['heart', 12, PAYS.heart[2]]
		]
	);
});

test('tumbling: winners go, the rest fall in order, new pieces drop in on top; the final screen has no win', () => {
	const rand = seeded(42);
	let checked = 0;
	for (let n = 0; n < 3000; n++) {
		const p = play(100, rand);
		for (const s of spinsOf(p)) {
			let grid = s.start;
			const seen = new Set(grid.flat().map((x) => x.id));
			let raw = 0;
			for (const step of s.steps) {
				assert.deepEqual(step.wins, winsOn(grid));
				raw += step.wins.reduce((a, w) => a + w.pay, 0);
				const gone = new Set(step.gone);
				assert.equal(step.gone.length, step.wins.reduce((a, w) => a + w.count, 0));
				for (let c = 0; c < COLS; c++) {
					const keep = grid[c].filter((_, r) => !gone.has(cellKey(c, r)));
					const after = step.grid[c];
					assert.equal(after.length, ROWS);
					const fresh = after.slice(0, ROWS - keep.length);
					assert.deepEqual(after.slice(ROWS - keep.length), keep, 'the survivors keep their order at the bottom');
					for (const f of fresh) {
						assert.ok(!seen.has(f.id), 'new pieces get new ids');
						seen.add(f.id);
					}
				}
				grid = step.grid;
				checked++;
			}
			assert.equal(winsOn(grid).length, 0);
			assert.equal(s.raw, raw);
			assert.equal(finalGrid(s), grid);
		}
	}
	assert.ok(checked > 500, `${checked} tumbles checked`);
});

test('a reel never holds two holks, and holks pay and start / add Sky High Spins', () => {
	const rand = seeded(7);
	let starts = 0;
	let retriggers = 0;
	for (let n = 0; n < 6000; n++) {
		const p = play(100, rand, n % 2 === 0);
		for (const s of spinsOf(p)) {
			for (const g of [s.start, ...s.steps.map((x) => x.grid)]) for (const col of g) assert.ok(col.filter((x) => x.kind === 'holk').length <= 1);
			const holks = finalGrid(s).flat().filter((x) => x.kind === 'holk').length;
			assert.equal(s.holks, holks);
			if (s.mode === 'base') {
				assert.equal(s.holkPay, (HOLK_PAYS[holks] ?? 0) * 100);
				assert.equal(s.more, holks >= HOLKS_TO_START ? FREE_SPINS : 0);
				if (s.more) starts++;
			} else {
				assert.equal(s.holkPay, 0);
				if (s.more) {
					assert.ok(holks >= HOLKS_TO_RETRIGGER && s.more <= RETRIGGER);
					retriggers++;
				}
			}
		}
		assert.equal(p.bonus, p.base?.more ? 'free' : null);
		const total = p.free.length;
		if (p.bonus) assert.equal(total, FREE_SPINS + p.free.reduce((a, s) => a + s.more, 0));
		assert.ok(total <= FREE_MAX);
	}
	assert.ok(starts > 20 && retriggers > 5, `${starts} starts, ${retriggers} retriggers`);
});

test('clouds multiply a winning spin by their sum, never a spin without a tumble win, never the holk pay', () => {
	const rand = seeded(99);
	let multiplied = 0;
	for (let n = 0; n < 400; n++) {
		const p = buy('free', 100, rand);
		for (const s of p.free) {
			const sum = finalGrid(s)
				.flat()
				.filter((x) => x.kind === 'cloud')
				.reduce((a, x) => a + x.x, 0);
			assert.equal(s.clouds, sum);
			assert.equal(s.mult, s.raw > 0 && sum > 0 ? sum : 1);
			assert.equal(s.pay, s.raw * s.mult + s.holkPay);
			if (s.mult > 1) multiplied++;
			for (const x of finalGrid(s).flat()) if (x.kind === 'cloud') assert.ok(CLOUD_VALUES.some(([v]) => v === x.x));
		}
	}
	assert.ok(multiplied > 300, `${multiplied} multiplied spins`);
	for (let n = 0; n < 200; n++) for (const s of buy('super', 100, rand).free) for (const x of s.start.flat()) if (x.kind === 'cloud') assert.ok(x.x >= 10 && SUPER_VALUES.some(([v]) => v === x.x));
});

test('costs: a spin costs the bet, Double chance +25 %, buys their price; win and net add up; tiers', () => {
	const rand = seeded(3);
	assert.equal(anteCost(100), 125);
	assert.equal(anteCost(10), 13);
	for (let n = 0; n < 500; n++) {
		const a = play(50, rand);
		assert.equal(a.cost, 50);
		const b = play(100, rand, true);
		assert.equal(b.cost, 125);
		assert.ok(b.ante);
		for (const p of [a, b]) {
			const cents = spinsOf(p).reduce((x, s) => x + s.pay, 0);
			assert.equal(p.win, Math.min(Math.round((cents * p.bet) / 100), MAX_WIN * p.bet));
			assert.equal(p.net, p.win - p.cost);
		}
	}
	for (const kind of BUY_KINDS) {
		const p = buy(kind, 20, rand);
		assert.equal(p.cost, BUY_PRICE[kind] * 20);
		assert.equal(p.base, null);
		assert.equal(p.bonus, kind);
		assert.ok(p.free.length >= FREE_SPINS);
	}
	const fake = (win, cost) => winTier({ win, cost });
	assert.deepEqual([fake(0, 10), fake(5, 10), fake(100, 10), fake(250, 10), fake(1000, 10)], ['none', 'win', 'big', 'mega', 'epic']);
});

test('a lone spin can run on its own random source', () => {
	const s = runSpin({ rand: seeded(5), id: 1 }, 'base');
	assert.equal(s.start.length, COLS);
	for (const col of s.start) assert.equal(col.length, ROWS);
});

test('the long run: normal odds (≈ 96 % back), wins on about a quarter of the spins, Sky High Spins every ~300', () => {
	const rand = seeded(2026);
	const N = 60000;
	let paid = 0;
	let won = 0;
	let hits = 0;
	let bonus = 0;
	for (let i = 0; i < N; i++) {
		const p = play(100, rand);
		paid += p.cost;
		won += p.win;
		if (p.win > 0) hits++;
		if (p.bonus) bonus++;
	}
	const rtp = won / paid;
	assert.ok(rtp > 0.75 && rtp < 1.2, `RTP ${rtp.toFixed(2)}`);
	assert.ok(hits / N > 0.2 && hits / N < 0.28, `hit ${(hits / N).toFixed(3)}`);
	assert.ok(N / bonus > 200 && N / bonus < 420, `bonus 1 in ${Math.round(N / bonus)}`);
	for (const kind of BUY_KINDS) {
		let p2 = 0;
		let w2 = 0;
		for (let i = 0; i < 3000; i++) {
			const p = buy(kind, 100, rand);
			p2 += p.cost;
			w2 += p.win;
		}
		assert.ok(w2 / p2 > 0.75 && w2 / p2 < 1.25, `${kind} ${(w2 / p2).toFixed(2)}`);
	}
});
