/**
 * Book Of Skedd: BurgiCasino's third slot machine (2026-11-20, the user's ask: "gör en till slot. den ska
 * likna 'Book Of Dead', men den ska heta 'Book Of Skedd' istället, ett majablad på boken istället. spelet
 * ska likna det riktiga book of dead med bonusen som fungerar likadant, även att man kan gambla sin vinst").
 *
 * A classic "book" slot, the genre Book of Dead belongs to, played by the same rules but drawn and themed our
 * own way (a stoner grimoire instead of an Egyptian tomb; no names, characters or art from that game):
 *  - 5 reels × 3 rows and 1–10 paylines the player picks; the bet = the bet per line × the lines played.
 *  - THE BOOK (a gold cannabis leaf on its cover) is WILD on the lines (it stands in for every symbol but
 *    pays nothing on a line by itself) and the scatter: 3, 4 or 5 anywhere pay 2×, 20×, 200× the whole bet
 *    and give 10 free spins.
 *  - Before the free spins the book opens on a random special symbol, one of the nine ordinary ones, all
 *    equally likely. In every free spin the normal wins are paid first; then, when the special symbol is on
 *    enough reels to win (2 for the four big symbols, 3 for the letters), it spreads over each whole reel it
 *    is on and pays again on every played line, whether or not those reels are next to each other.
 *    3 or more books in the free spins give 10 more with the same special symbol.
 *  - Gamble: after a win, guess the colour of a face-down card (×2) or its suit (×4); up to 5 times in a
 *    row, while what it would pay is at most GAMBLE_LIMIT × the bet. A wrong guess loses the win.
 *  - A play (a spin with its free spins) pays at most MAX_WIN × the bet.
 *
 * Real odds, not the party odds of the other two machines: in the long run it gives back about 96 % of what
 * goes in, free spins come about once in 200 spins, and most of the return sits in them (high volatility).
 * Simulated with .claude/testing/squad-casino/book-sim.mjs; scripts/book.test.js checks the ranges. Every
 * stop is equally likely (no near-miss tricks); the gamble is a fair draw from a full deck.
 *
 * Pure, the randomness passed in, so Node tests it. No browser APIs and no runes.
 */

import { LINES, REELS, ROWS } from './casino-slots.ts';
import { randInt, type Card, type Suit } from './squad-casino.ts';

export { LINES, REELS, ROWS };

export type BookSymbol = 'ten' | 'jack' | 'queen' | 'king' | 'ace' | 'lighter' | 'grinder' | 'bong' | 'abscar' | 'book';
/** The nine ordinary symbols (the ones that pay on a line, and the ones the book can pick before free spins). */
export type BookPay = Exclude<BookSymbol, 'book'>;
export const BOOK_PAYING: BookPay[] = ['ten', 'jack', 'queen', 'king', 'ace', 'lighter', 'grinder', 'bong', 'abscar'];
export const BOOK_SYMBOLS: BookSymbol[] = [...BOOK_PAYING, 'book'];

/**
 * What 2, 3, 4 and 5 in a row pay, times the line bet (0 = no pay). The four big symbols pay from 2,
 * the letters from 3.
 */
export const BOOK_PAYS: Record<BookPay, [number, number, number, number]> = {
	ten: [0, 5, 25, 100],
	jack: [0, 5, 25, 100],
	queen: [0, 5, 25, 100],
	king: [0, 5, 40, 150],
	ace: [0, 5, 40, 150],
	lighter: [5, 30, 100, 750],
	grinder: [5, 30, 100, 750],
	bong: [5, 40, 400, 2000],
	abscar: [10, 100, 1000, 5000]
};
/** The book anywhere: what 3, 4 and 5 pay, times the whole bet. */
export const BOOK_SCATTER: [number, number, number] = [2, 20, 200];
/** Free spins 3+ books give (also again in the free spins). */
export const BOOK_FREE = 10;
/** No endless free spins: at most this many in one run. */
export const BOOK_FREE_MAX = 150;
/** The most one play pays, × the bet. */
export const MAX_WIN = 5000;

/** Bet per line on offer; × 10 lines that's 10 … 10,000 like the other machines. */
export const LINE_BETS = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000];
export const MAX_LINES = LINES.length;

/** How many stops each ordinary symbol has on every reel (the virtual reel's weighting). */
const WEIGHTS: Record<BookPay, number> = {
	ten: 5,
	jack: 6,
	queen: 6,
	king: 5,
	ace: 5,
	lighter: 3,
	grinder: 3,
	bong: 2,
	abscar: 1
};
/**
 * The free spins' own reels: fewer letters, so the special symbol lands on more reels and spreads more
 * often, and Abscar has two stops instead of one.
 */
const FREE_WEIGHTS: Record<BookPay, number> = {
	ten: 4,
	jack: 4,
	queen: 4,
	king: 4,
	ace: 4,
	lighter: 3,
	grinder: 3,
	bong: 2,
	abscar: 2
};
/** Book stops per reel. */
const BOOK_STOPS = [1, 1, 1, 1, 1];

/**
 * The five reel strips: the ordinary symbols in a fixed shuffle (different per reel) so equal symbols don't
 * clump, and the books spaced evenly so a reel never shows two at once.
 */
export const BOOK_STRIPS: BookSymbol[][] = Array.from({ length: REELS }, (_, r) => strip(r, WEIGHTS, 0x2545f491));
/** The reels the free spins use. */
export const BOOK_FREE_STRIPS: BookSymbol[][] = Array.from({ length: REELS }, (_, r) => strip(r, FREE_WEIGHTS, 0x6c8e9cf5));

function strip(reel: number, weights: Record<BookPay, number>, salt: number): BookSymbol[] {
	const list: BookSymbol[] = BOOK_PAYING.flatMap((s) => Array<BookSymbol>(weights[s]).fill(s));
	// a small fixed generator (different per reel) so the strips are the same on every page
	let x = salt ^ (reel * 0x9e3779b9);
	const next = () => {
		x ^= x << 13;
		x ^= x >>> 17;
		x ^= x << 5;
		return (x >>> 0) / 0x1_0000_0000;
	};
	for (let i = list.length - 1; i > 0; i--) {
		const j = Math.floor(next() * (i + 1));
		[list[i], list[j]] = [list[j], list[i]];
	}
	const books = BOOK_STOPS[reel];
	const total = list.length + books;
	const step = total / books;
	const at = new Set(Array.from({ length: books }, (_, i) => Math.floor(((reel * 3) % Math.floor(step)) + i * step)));
	const out: BookSymbol[] = [];
	let li = 0;
	for (let i = 0; i < total; i++) out.push(at.has(i) ? 'book' : list[li++]);
	return out;
}

/* ---------- results ---------- */

/** The screen: grid[reel][row]. */
export type BookGrid = BookSymbol[][];

export interface BookLineWin {
	line: number;
	symbol: BookPay;
	count: number;
	win: number;
}

/** The special symbol spreading over its reels in a free spin. */
export interface BookExpand {
	symbol: BookPay;
	/** The reels it covers (0-based, not necessarily next to each other). */
	reels: number[];
	/** Burgers: its pay for that many reels × the line bet × the lines played. */
	win: number;
}

export interface BookSpin {
	stops: number[];
	grid: BookGrid;
	lines: BookLineWin[];
	books: number;
	scatterWin: number;
	/** Free spins this spin gives (3+ books). */
	freeSpins: number;
	/** Free spins only: the special symbol spreading, when it's on enough reels. */
	expand: BookExpand | null;
	/** Lines + books + the spreading symbol. */
	win: number;
}

export const bookGridAt = (stops: number[], strips: BookSymbol[][] = BOOK_STRIPS): BookGrid =>
	stops.map((stop, r) => Array.from({ length: ROWS }, (_, row) => strips[r][(stop + row) % strips[r].length]));

/** What a symbol pays for `count` in a row (× the line bet). */
export const paysFor = (sym: BookPay, count: number) => (count >= 2 ? BOOK_PAYS[sym][Math.min(count, 5) - 2] : 0);
/** Reels a symbol must be on to pay: 2 for the big ones, 3 for the letters. */
export const needFor = (sym: BookPay) => (BOOK_PAYS[sym][0] > 0 ? 2 : 3);

/** One payline: the first ordinary symbol and how far it runs from reel 1 (books stand in). */
export function bookLine(symbols: BookSymbol[]): { symbol: BookPay; count: number; pays: number } | null {
	const first = symbols.find((s) => s !== 'book') as BookPay | undefined;
	// a line of books only: the book pays as a scatter, not on the line
	if (!first) return null;
	let count = 0;
	while (count < symbols.length && (symbols[count] === first || symbols[count] === 'book')) count++;
	const pays = paysFor(first, count);
	return pays > 0 ? { symbol: first, count, pays } : null;
}

/** What a screen pays: `lines` paylines at `lineBet`, the books anywhere, and (free spins) the special symbol. */
export function evaluateBook(grid: BookGrid, lineBet: number, lines: number, special: BookPay | null = null, stops: number[] = grid.map(() => 0)): BookSpin {
	const bet = lineBet * lines;
	const won: BookLineWin[] = [];
	for (let i = 0; i < Math.min(lines, MAX_LINES); i++) {
		const w = bookLine(LINES[i].map((row, r) => grid[r][row]));
		if (w) won.push({ line: i, symbol: w.symbol, count: w.count, win: w.pays * lineBet });
	}
	const books = grid.flat().filter((s) => s === 'book').length;
	const k = Math.min(books, 5) - 3;
	const scatterWin = k >= 0 ? BOOK_SCATTER[k] * bet : 0;
	let expand: BookExpand | null = null;
	if (special) {
		const reels = grid.flatMap((col, r) => (col.includes(special) ? [r] : []));
		if (reels.length >= needFor(special)) expand = { symbol: special, reels, win: paysFor(special, reels.length) * lineBet * lines };
	}
	const win = won.reduce((n, l) => n + l.win, 0) + scatterWin + (expand?.win ?? 0);
	return { stops, grid, lines: won, books, scatterWin, freeSpins: k >= 0 ? BOOK_FREE : 0, expand, win };
}

export const randomBookStops = (rand: () => number, strips: BookSymbol[][] = BOOK_STRIPS) => strips.map((s) => randInt(s.length, rand));

/** One spin: the normal reels, or (special given) the free spins' reels. */
function spin(lineBet: number, lines: number, rand: () => number, special: BookPay | null): BookSpin {
	const strips = special ? BOOK_FREE_STRIPS : BOOK_STRIPS;
	const stops = randomBookStops(rand, strips);
	return evaluateBook(bookGridAt(stops, strips), lineBet, lines, special, stops);
}

/** The special symbol the book opens on: one of the nine, all equally likely. */
export const pickSpecial = (rand: () => number): BookPay => BOOK_PAYING[randInt(BOOK_PAYING.length, rand)];

export interface BookPlay {
	lineBet: number;
	lines: number;
	/** The whole bet (= what was paid). */
	bet: number;
	base: BookSpin;
	/** The book's pick for the free spins (null = no free spins). */
	special: BookPay | null;
	/** Free spins the base spin gave. */
	freeStart: number;
	free: BookSpin[];
	/** Everything won (at most MAX_WIN × the bet). */
	win: number;
	net: number;
	capped?: true;
}

export interface BookOptions {
	/** The special symbol, if free spins come (Abscar's control room). */
	special?: BookPay;
}

function finish(lineBet: number, lines: number, base: BookSpin, rand: () => number, opts: BookOptions): BookPlay {
	const bet = lineBet * lines;
	const free: BookSpin[] = [];
	let special: BookPay | null = null;
	if (base.freeSpins) {
		special = opts.special ?? pickSpecial(rand);
		let left = base.freeSpins;
		while (left > 0 && free.length < BOOK_FREE_MAX) {
			const s = spin(lineBet, lines, rand, special);
			free.push(s);
			left += s.freeSpins - 1;
		}
	}
	const all = base.win + free.reduce((n, s) => n + s.win, 0);
	const win = Math.min(all, MAX_WIN * bet);
	return { lineBet, lines, bet, base, special, freeStart: base.freeSpins, free, win, net: win - bet, ...(all > win ? { capped: true as const } : {}) };
}

/** One paid spin with its free spins, all worked out at once (so closing the page changes nothing). */
export function playBook(lineBet: number, lines: number, rand: () => number, opts: BookOptions = {}): BookPlay {
	return finish(lineBet, lines, spin(lineBet, lines, rand, null), rand, opts);
}

/** A paid spin on a screen already chosen (tests, the control room): its free spins play out as usual. */
export function playBookScreen(grid: BookGrid, lineBet: number, lines: number, rand: () => number, opts: BookOptions = {}): BookPlay {
	return finish(lineBet, lines, evaluateBook(grid, lineBet, lines), rand, opts);
}

export type BookTier = 'none' | 'win' | 'big' | 'mega' | 'epic';
/** How big a play's win reads: big ≥ 10× the bet, mega ≥ 25×, epic ≥ 100×. */
export function bookTier(p: Pick<BookPlay, 'win' | 'bet'>): BookTier {
	if (p.win >= p.bet * 100) return 'epic';
	if (p.win >= p.bet * 25) return 'mega';
	if (p.win >= p.bet * 10) return 'big';
	return p.win > 0 ? 'win' : 'none';
}

/* ---------- the gamble ---------- */

export type GambleGuess = 'red' | 'black' | Suit;
export const GAMBLE_GUESSES: GambleGuess[] = ['red', 'black', 'H', 'D', 'C', 'S'];
/** Gambles in a row at most. */
export const GAMBLE_STEPS = 5;
/** A gamble may pay at most this many times the bet. */
export const GAMBLE_LIMIT = 500;
const SUITS: Suit[] = ['H', 'D', 'C', 'S'];

export const guessPays = (g: GambleGuess) => (g === 'red' || g === 'black' ? 2 : 4);
export const isRed = (s: Suit) => s === 'H' || s === 'D';
export const guessRight = (g: GambleGuess, card: Card) => (g === 'red' ? isRed(card.s) : g === 'black' ? !isRed(card.s) : card.s === g);
/** Whether this guess may be played: something to gamble, gambles left, and within the limit. */
export const canGamble = (amount: number, bet: number, g: GambleGuess, done: number) => amount > 0 && done < GAMBLE_STEPS && amount * guessPays(g) <= GAMBLE_LIMIT * bet;
/** A card from a full deck. */
export const drawCard = (rand: () => number): Card => ({ r: randInt(13, rand) + 1, s: SUITS[randInt(4, rand)] });

export interface GambleResult {
	card: Card;
	right: boolean;
	/** What's at stake after it (0 = lost). */
	amount: number;
	/** Burgers won (+) or lost (−) by this gamble. */
	net: number;
}

/** One gamble on a card already drawn. */
export function gamble(amount: number, g: GambleGuess, card: Card): GambleResult {
	const right = guessRight(g, card);
	return { card, right, amount: right ? amount * guessPays(g) : 0, net: right ? amount * (guessPays(g) - 1) : -amount };
}

/* ---------- Abscar's control room (casino-rig.ts) ---------- */

/** What a Book Of Skedd spin can be forced to have. */
export type BookForce = 'free' | 'abscar' | 'big' | 'blank';
export const BOOK_FORCES: BookForce[] = ['free', 'abscar', 'big', 'blank'];
/** "Big win": at least this many times the bet. */
export const BOOK_BIG = 25;
/** Spins drawn at most looking for a forced result (free spins ≈ 1 in 200, a 25× win ≈ 1 in 60). */
export const BOOK_TRIES = 20_000;

export function bookMatches(p: BookPlay, want: BookForce): boolean {
	switch (want) {
		case 'free':
		case 'abscar':
			return p.free.length > 0;
		case 'big':
			return p.win >= p.bet * BOOK_BIG;
		case 'blank':
			return p.win === 0;
	}
}
