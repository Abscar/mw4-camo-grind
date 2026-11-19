// Book Of Skedd (src/lib/book.ts, 2026-11-20): the book as WILD + scatter, free spins with the special
// symbol spreading over whole reels (not necessarily next to each other), lines 1–10, the max win, the
// gamble, the control room's forced results, and the long-run return over many seeded spins. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	bookLine,
	bookMatches,
	bookTier,
	canGamble,
	drawCard,
	evaluateBook,
	gamble,
	guessPays,
	needFor,
	playBook,
	playBookScreen,
	BOOK_FORCES,
	BOOK_FREE,
	BOOK_FREE_STRIPS,
	BOOK_PAYING,
	BOOK_PAYS,
	BOOK_SCATTER,
	BOOK_STRIPS,
	BOOK_SYMBOLS,
	GAMBLE_LIMIT,
	GAMBLE_STEPS,
	LINE_BETS,
	LINES,
	MAX_LINES,
	MAX_WIN,
	REELS,
	ROWS
} from '../src/lib/book.ts';
import { cleanTune } from '../src/lib/casino-rig.ts';

const seeded = (seed) => () => {
	seed ^= seed << 13;
	seed ^= seed >>> 17;
	seed ^= seed << 5;
	return (seed >>> 0) / 0x1_0000_0000;
};

/** A screen that pays nothing on any line: reels 1 and 2 share no symbol, no books. */
const BLANK = [
	['ten', 'jack', 'queen'],
	['king', 'ace', 'lighter'],
	['ten', 'grinder', 'bong'],
	['jack', 'queen', 'king'],
	['ace', 'ten', 'jack']
];
const copy = (g) => g.map((c) => [...c]);

test('strips: every reel has every symbol, one book, never two books in view', () => {
	for (const strips of [BOOK_STRIPS, BOOK_FREE_STRIPS]) {
		assert.equal(strips.length, REELS);
		for (const s of strips) {
			for (const sym of BOOK_SYMBOLS) assert.ok(s.includes(sym), `${sym} on every reel`);
			assert.equal(s.filter((x) => x === 'book').length, 1);
			for (let i = 0; i < s.length; i++) {
				const view = [0, 1, 2].map((k) => s[(i + k) % s.length]);
				assert.ok(view.filter((x) => x === 'book').length <= 1);
			}
		}
	}
	assert.equal(MAX_LINES, 10);
	assert.deepEqual(LINE_BETS.map((b) => b * 10), [10, 20, 50, 100, 250, 500, 1000, 2500, 5000, 10000]);
});

test('lines: books stand in, a line of books alone pays nothing, letters need 3', () => {
	assert.deepEqual(bookLine(['abscar', 'abscar', 'ten', 'ten', 'ten']), { symbol: 'abscar', count: 2, pays: 10 });
	assert.deepEqual(bookLine(['book', 'bong', 'book', 'bong', 'jack']), { symbol: 'bong', count: 4, pays: 400 });
	assert.deepEqual(bookLine(['book', 'book', 'book', 'book', 'abscar']), { symbol: 'abscar', count: 5, pays: 5000 });
	assert.equal(bookLine(['book', 'book', 'book', 'book', 'book']), null);
	assert.equal(bookLine(['ten', 'ten', 'jack', 'jack', 'jack']), null, 'two letters pay nothing');
	assert.deepEqual(bookLine(['ace', 'book', 'ace', 'king', 'ace']), { symbol: 'ace', count: 3, pays: 5 });
	assert.equal(needFor('lighter'), 2);
	assert.equal(needFor('queen'), 3);
});

test('evaluate: only the lines played pay, books pay anywhere × the whole bet and give 10 free spins', () => {
	const g = copy(BLANK);
	// the bottom row (line 3) five abscars
	for (let r = 0; r < 5; r++) g[r][2] = 'abscar';
	const all = evaluateBook(g, 2, 10);
	assert.equal(all.lines.find((l) => l.line === 2)?.win, 5000 * 2);
	// line 7 (bottom, bottom, middle, top, top) starts with two abscars too
	assert.equal(all.win, 5000 * 2 + 10 * 2);
	assert.equal(evaluateBook(g, 2, 2).win, 0, 'line 3 not played');
	assert.equal(evaluateBook(BLANK, 1, 10).win, 0);
	const b = copy(BLANK);
	b[0][0] = 'book';
	b[2][1] = 'book';
	b[4][2] = 'book';
	const s = evaluateBook(b, 5, 4);
	assert.equal(s.books, 3);
	assert.equal(s.scatterWin, BOOK_SCATTER[0] * 20);
	assert.equal(s.freeSpins, BOOK_FREE);
	assert.equal(s.expand, null, 'no expanding outside free spins');
});

test('free spins: the special symbol spreads over its reels (not next to each other) and pays every played line on top', () => {
	const g = copy(BLANK);
	g[0][1] = 'grinder';
	g[4][0] = 'grinder';
	// grinder is already on reel 3 (row 1): reels 1, 3, 5
	const s = evaluateBook(g, 3, 10, 'grinder');
	assert.deepEqual(s.expand, { symbol: 'grinder', reels: [0, 2, 4], win: BOOK_PAYS.grinder[1] * 3 * 10 });
	assert.equal(s.win, s.lines.reduce((n, l) => n + l.win, 0) + s.expand.win);
	// fewer lines played = fewer lines paid
	assert.equal(evaluateBook(g, 3, 4, 'grinder').expand.win, BOOK_PAYS.grinder[1] * 3 * 4);
	// a letter needs 3 reels
	const q = copy(BLANK);
	q[4][0] = 'queen';
	assert.equal(evaluateBook(q, 1, 10, 'queen').expand.reels.length, 3, 'queen on reels 1, 4, 5');
	q[3][1] = 'ace';
	q[3][0] = 'ace';
	q[3][2] = 'ace';
	assert.equal(evaluateBook(q, 1, 10, 'queen').expand, null, 'only 2 reels with a queen');
	// the book isn't the special symbol
	const bk = copy(BLANK);
	bk[0][0] = 'book';
	assert.equal(evaluateBook(bk, 1, 10, 'lighter').expand, null, 'lighter only on reel 2; the book on reel 1 doesn’t count');
});

test('a play: free spins follow 3 books, the special symbol stays for the whole run, retriggers add 10, wins capped', () => {
	const rand = seeded(42);
	let runs = 0;
	let retriggers = 0;
	for (let i = 0; i < 30_000 && runs < 60; i++) {
		const p = playBook(1, 10, rand);
		assert.equal(p.bet, 10);
		assert.equal(p.net, p.win - p.bet);
		assert.ok(p.win <= MAX_WIN * p.bet);
		if (!p.base.freeSpins) {
			assert.equal(p.free.length, 0);
			assert.equal(p.special, null);
			continue;
		}
		runs++;
		assert.ok(BOOK_PAYING.includes(p.special));
		const extra = p.free.reduce((n, s) => n + s.freeSpins, 0);
		assert.equal(p.free.length, BOOK_FREE + extra);
		if (extra) retriggers++;
		for (const s of p.free) if (s.expand) assert.equal(s.expand.symbol, p.special);
		const all = p.base.win + p.free.reduce((n, s) => n + s.win, 0);
		assert.equal(p.win, Math.min(all, MAX_WIN * p.bet));
	}
	assert.ok(runs >= 60, 'free spins came');
	const forced = playBookScreen(
		BLANK.map((c, r) => (r % 2 === 0 ? ['book', ...c.slice(1)] : c)),
		1,
		10,
		seeded(7),
		{ special: 'abscar' }
	);
	assert.equal(forced.special, 'abscar');
	assert.ok(forced.free.length >= BOOK_FREE);
	assert.equal(bookTier({ win: 0, bet: 10 }), 'none');
	assert.equal(bookTier({ win: 100, bet: 10 }), 'big');
	assert.equal(bookTier({ win: 250, bet: 10 }), 'mega');
	assert.equal(bookTier({ win: 1000, bet: 10 }), 'epic');
});

test('long run: ≈ 96 % back, free spins ≈ 1 in 200, about a third of spins win', () => {
	const rand = seeded(20261120);
	const N = 300_000;
	let paid = 0;
	let won = 0;
	let hits = 0;
	let frees = 0;
	for (let i = 0; i < N; i++) {
		const p = playBook(1, 10, rand);
		paid += p.bet;
		won += p.win;
		if (p.base.win > 0) hits++;
		if (p.free.length) frees++;
	}
	const rtp = won / paid;
	assert.ok(rtp > 0.88 && rtp < 1.05, `rtp ${rtp.toFixed(3)}`);
	assert.ok(hits / N > 0.3 && hits / N < 0.42, `hit ${(hits / N).toFixed(3)}`);
	const every = N / frees;
	assert.ok(every > 160 && every < 270, `free spins every ${every.toFixed(0)}`);
});

test('gamble: colour ×2, suit ×4, fair, at most 5 in a row and within the limit', () => {
	assert.equal(guessPays('red'), 2);
	assert.equal(guessPays('S'), 4);
	assert.deepEqual(gamble(50, 'red', { r: 5, s: 'H' }), { card: { r: 5, s: 'H' }, right: true, amount: 100, net: 50 });
	assert.deepEqual(gamble(50, 'black', { r: 5, s: 'D' }), { card: { r: 5, s: 'D' }, right: false, amount: 0, net: -50 });
	assert.deepEqual(gamble(50, 'C', { r: 1, s: 'C' }), { card: { r: 1, s: 'C' }, right: true, amount: 200, net: 150 });
	assert.equal(gamble(50, 'C', { r: 1, s: 'S' }).net, -50);
	assert.ok(canGamble(10, 10, 'H', 0));
	assert.ok(!canGamble(10, 10, 'H', GAMBLE_STEPS), 'five done');
	assert.ok(!canGamble(0, 10, 'red', 0), 'nothing to gamble');
	assert.ok(canGamble((GAMBLE_LIMIT * 10) / 2, 10, 'red', 0));
	assert.ok(!canGamble((GAMBLE_LIMIT * 10) / 2, 10, 'S', 0), 'a suit would pay over the limit');
	const rand = seeded(99);
	const N = 100_000;
	let red = 0;
	const suits = { H: 0, D: 0, C: 0, S: 0 };
	for (let i = 0; i < N; i++) {
		const c = drawCard(rand);
		assert.ok(c.r >= 1 && c.r <= 13);
		suits[c.s]++;
		if (c.s === 'H' || c.s === 'D') red++;
	}
	assert.ok(Math.abs(red / N - 0.5) < 0.01);
	for (const n of Object.values(suits)) assert.ok(Math.abs(n / N - 0.25) < 0.01);
});

test('control room: forced results are read and matched', () => {
	const A = 'abcdefgh1234';
	const tune = cleanTune({ book: { id: 'bk1234', who: A, what: 'abscar' }, odds: { book: 30 } });
	assert.equal(tune.book.what, 'abscar');
	assert.equal(tune.odds.book, 30);
	assert.equal(cleanTune({ book: { id: 'bk1234', who: A, what: 'jackpot' } }), undefined);
	const rand = seeded(5);
	for (const want of BOOK_FORCES) {
		let p = playBook(1, 10, rand, want === 'abscar' ? { special: 'abscar' } : {});
		for (let i = 0; i < 20_000 && !bookMatches(p, want); i++) p = playBook(1, 10, rand, want === 'abscar' ? { special: 'abscar' } : {});
		assert.ok(bookMatches(p, want), want);
		if (want === 'abscar') assert.equal(p.special, 'abscar');
	}
	assert.ok(LINES.every((l) => l.length === REELS && l.every((row) => row >= 0 && row < ROWS)));
});
