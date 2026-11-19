// Abscar's Fortune II, the Munchie Squad (src/lib/fortune2.ts): the board and how it grows, the squad's
// walking rules, the event script the page plays back (replaying it must give the engine's own board),
// free spins that only ever go up, the coin game, buy prices and the long-run return over many seeded
// plays. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	applyEvent,
	buy,
	cellOf,
	colOf,
	isOpen,
	munchies,
	openCells,
	play,
	rowOf,
	spinPay,
	startView,
	winTier,
	BUY_KINDS,
	BUY_PRICE,
	CREW,
	FREE_SPINS,
	LETTERS,
	LEVEL_PAYS,
	LEVELS,
	MAX_OPEN,
	MAX_WIN,
	MULT_MAX,
	MUNCH_CELLS,
	MUNCH_CORNERS,
	MUNCH_RESPINS,
	MUNCH_SIDE,
	OPEN,
	SIDE,
	SUPER_LEVEL,
	SUPER_MULT
} from '../src/lib/fortune2.ts';

const seeded = (seed) => () => {
	seed ^= seed << 13;
	seed ^= seed >>> 17;
	seed ^= seed << 5;
	return (seed >>> 0) / 0x1_0000_0000;
};
const spinsOf = (p) => [...(p.base ? [p.base] : []), ...p.free];
const adjacent = (a, b) => Math.abs(rowOf(a) - rowOf(b)) + Math.abs(colOf(a) - colOf(b)) === 1;

test('the board: 6 × 6 inside an 8 × 8 frame, growing to 7 × 7 and 8 × 8', () => {
	assert.deepEqual(
		OPEN.map((_, i) => openCells(i).length),
		[36, 49, 64]
	);
	// each step only adds cells
	for (let i = 1; i < OPEN.length; i++) for (const c of openCells(i - 1)) assert.ok(isOpen(i, c));
	assert.equal(openCells(MAX_OPEN).length, SIDE * SIDE);
	assert.equal(cellOf(rowOf(27), colOf(27)), 27);
	assert.equal(LEVEL_PAYS.length, LEVELS);
	for (let i = 1; i < LEVELS; i++) assert.ok(LEVEL_PAYS[i] > LEVEL_PAYS[i - 1], 'a higher level pays more');
});

test('the same randomness gives the same play', () => {
	const a = play(50, seeded(42));
	const b = play(50, seeded(42));
	assert.deepEqual(a, b);
});

test('playing the events back gives the engine’s own board, squad, levels and pay', () => {
	const rand = seeded(7);
	let spins = 0;
	for (let i = 0; i < 400; i++) {
		const p = i % 40 === 0 ? buy(i % 80 === 0 ? 'super' : 'hotbox', 10, rand) : play(10, rand);
		for (const s of spinsOf(p)) {
			spins++;
			const v = startView(s);
			for (const ev of s.events) applyEvent(v, ev);
			assert.deepEqual(v.grid, s.board, 'board');
			assert.deepEqual(v.crew, s.end.crew, 'squad');
			assert.deepEqual(v.levels, s.end.levels, 'levels');
			assert.equal(v.open, s.end.open, 'field size');
			assert.equal(v.mult, s.end.mult, 'multiplier');
			assert.equal(v.pay, s.pay, 'pay');
			// the coin game resets the letters after the spin
			assert.deepEqual(v.letters, s.munchies ? LETTERS.map(() => true) : s.end.letters, 'letters');
			assert.equal(s.ketchups, s.board.filter((x) => x?.kind === 'ketchup').length);
		}
	}
	assert.ok(spins > 400);
});

test('the squad only steps to a neighbouring cell with their own munchie, a WILD or a feature', () => {
	const rand = seeded(11);
	let steps = 0;
	for (let i = 0; i < 300; i++) {
		for (const s of spinsOf(play(10, rand))) {
			const v = startView(s);
			for (const ev of s.events) {
				if (ev.t === 'walk') {
					steps++;
					assert.ok(adjacent(v.crew[ev.who], ev.to), 'next door');
					assert.ok(isOpen(v.open, ev.to), 'inside the field');
					assert.ok(!CREW.some((w) => v.crew[w] === ev.to), 'not onto another collector');
					const k = ev.took.kind;
					assert.notEqual(k, 'ketchup', 'nobody takes ketchup');
					if (k === 'item') assert.equal(ev.took.crew, ev.who, 'only their own munchie');
					assert.deepEqual(v.grid[ev.to], ev.took, 'the piece that was there');
				}
				applyEvent(v, ev);
			}
			// nobody can move when a spin ends
			for (const w of CREW)
				for (const n of openCells(v.open).filter((c) => adjacent(c, v.crew[w]))) {
					const q = v.grid[n];
					if (!q || CREW.some((o) => v.crew[o] === n)) continue;
					assert.ok(q.kind === 'ketchup' || (q.kind === 'item' && q.crew !== w), `${w} was stuck`);
				}
		}
	}
	assert.ok(steps > 1000);
});

test('free spins carry over: levels, field size and the multiplier only go up; Super starts big', () => {
	const rand = seeded(5);
	for (let i = 0; i < 60; i++) {
		const kind = i % 2 ? 'super' : 'hotbox';
		const p = buy(kind, 10, rand);
		assert.equal(p.bonus, kind);
		assert.ok(p.free.length >= FREE_SPINS);
		let prev = p.free[0].start;
		if (kind === 'super') {
			assert.equal(prev.open, MAX_OPEN);
			assert.equal(prev.mult, SUPER_MULT);
			for (const w of CREW) assert.ok(prev.levels[w] >= SUPER_LEVEL);
		} else assert.equal(prev.mult, 1);
		for (const s of p.free) {
			assert.ok(s.start.open >= prev.open && s.end.open >= s.start.open);
			assert.ok(s.end.mult >= s.start.mult && s.end.mult <= MULT_MAX);
			for (const w of CREW) assert.ok(s.end.levels[w] >= s.start.levels[w] && s.end.levels[w] <= LEVELS);
			// the squad stays where it stood
			assert.deepEqual(s.start.crew, prev.crew ?? s.start.crew);
			prev = s.end;
		}
		// free spins add up to what came: 10 plus any more
		assert.equal(p.free.length, FREE_SPINS + p.free.reduce((n, s) => n + (s.more ?? 0), 0));
	}
});

test('a paid spin starts free spins from where it ended', () => {
	const rand = seeded(99);
	let found = 0;
	for (let i = 0; i < 6000 && found < 5; i++) {
		const p = play(10, rand);
		if (!p.bonus) continue;
		found++;
		assert.equal(p.bonus, p.base.ketchups >= 4 ? 'super' : 'hotbox');
		assert.ok(p.base.ketchups >= 3);
		const f = p.free[0].start;
		assert.deepEqual(f.crew, p.base.end.crew);
		if (p.bonus === 'hotbox') {
			assert.deepEqual(f.levels, p.base.end.levels);
			assert.equal(f.open, p.base.end.open);
		}
	}
	assert.ok(found >= 3, 'free spins came');
});

test('The Munchies: respins start over with every new coin, squad coins take their row and column', () => {
	const rand = seeded(3);
	for (let i = 0; i < 400; i++) {
		const m = munchies(rand);
		const board = new Map();
		m.rounds.forEach((r, k) => {
			for (const [cell, coin] of r.add) {
				assert.ok(MUNCH_CELLS.includes(cell) && !MUNCH_CORNERS.includes(cell) && !board.has(cell));
				if (coin.kind === 'squad') {
					let sum = 0;
					for (const [at, o] of board)
						if (o.kind !== 'mult' && (Math.floor(at / MUNCH_SIDE) === Math.floor(cell / MUNCH_SIDE) || at % MUNCH_SIDE === cell % MUNCH_SIDE)) sum += o.value;
					assert.equal(coin.value, sum);
				}
				board.set(cell, coin);
			}
			if (k > 0) {
				const before = m.rounds[k - 1].left;
				if (board.size >= MUNCH_CELLS.length) assert.equal(r.left, 0);
				else assert.equal(r.left, r.add.length ? MUNCH_RESPINS : before - 1);
			}
		});
		assert.equal(m.rounds.at(-1).left, 0);
		const cash = [...board.values()].filter((c) => c.kind !== 'mult').reduce((n, c) => n + c.value, 0);
		const mults = [...board.values()].filter((c) => c.kind === 'mult').reduce((n, c) => n + c.value, 0);
		assert.equal(m.cash, cash);
		assert.equal(m.full, board.size === MUNCH_CELLS.length);
		assert.equal(m.mult, Math.max(1, mults) * (m.full ? 2 : 1));
		assert.equal(m.pay, cash * m.mult);
	}
});

test('a play pays its spins and coin games rounded, capped at MAX_WIN × the bet', () => {
	const rand = seeded(17);
	for (let i = 0; i < 500; i++) {
		const bet = [10, 50, 250][i % 3];
		const p = i % 50 === 0 ? buy(BUY_KINDS[i % 3], bet, rand) : play(bet, rand);
		const cents = spinsOf(p).reduce((n, s) => n + spinPay(s), 0) + (p.munchies?.pay ?? 0);
		assert.equal(p.win, Math.min(Math.round((cents * bet) / 100), MAX_WIN * bet));
		// capped only when it really hit the cap (not because of rounding)
		assert.equal(!!p.capped, (cents * bet) / 100 > MAX_WIN * bet);
		assert.equal(p.net, p.win - p.cost);
		assert.equal(p.cost, p.kind === 'spin' ? bet : BUY_PRICE[p.kind] * bet);
		assert.ok(['none', 'win', 'big', 'mega', 'epic'].includes(winTier(p)));
	}
});

test('long run: about 99 % back from spinning, each bought feature 90–100 %', () => {
	const rand = seeded(2026);
	let paid = 0;
	let won = 0;
	let bonus = 0;
	const N = 120_000;
	for (let i = 0; i < N; i++) {
		const p = play(100, rand);
		paid += p.cost;
		won += p.win;
		if (p.bonus) bonus++;
	}
	const rtp = won / paid;
	// heavy tail (free spins), so a wide range; fortune2-sim.mjs over millions of spins lands ≈ 99 %
	assert.ok(rtp > 0.9 && rtp < 1.08, `RTP ${rtp}`);
	assert.ok(N / bonus > 110 && N / bonus < 210, `free spins 1 in ${N / bonus}`);
	for (const kind of BUY_KINDS) {
		let c = 0;
		let w = 0;
		const n = kind === 'munchies' ? 20_000 : 2500;
		for (let i = 0; i < n; i++) {
			const p = buy(kind, 100, rand);
			c += p.cost;
			w += p.win;
		}
		assert.ok(w / c > 0.86 && w / c < 1.06, `${kind}: ${w / c}`);
	}
});
