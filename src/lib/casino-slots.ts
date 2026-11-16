/**
 * The Burger Bandit: BurgiCasino's one-armed bandit (2026-11-16, the user's ask: "a one-armed bandit
 * in burger theme, fun, fat and nice with lots of different wins, like a real one-armed bandit; do a
 * bit of research on how they work").
 *
 * Built like a real video slot: 5 reels × 3 rows, each reel a weighted "virtual reel" strip (common
 * symbols have many stops, the jackpot few), a stop picked at random per reel, 10 paylines paying left
 * to right (3, 4 or 5 in a row), a WILD that stands in for any symbol but the scatter and pays the
 * most itself, and a KETCHUP scatter that pays anywhere on the screen and gives free spins (wins ×2,
 * can retrigger). Long-run return to player ≈ 95 % (measured in scripts/casino-slots.test.js).
 * Pretend burgers, never money. No near-miss tricks: every stop is equally likely.
 *
 * Pure, the randomness passed in, so Node tests it. No browser APIs and no runes.
 */

import { randInt } from './squad-casino.ts';

export type SlotSymbol = 'pickle' | 'onion' | 'tomato' | 'cheese' | 'fries' | 'shake' | 'hotdog' | 'burger' | 'wild' | 'scatter';
export const SYMBOLS: SlotSymbol[] = ['pickle', 'onion', 'tomato', 'cheese', 'fries', 'shake', 'hotdog', 'burger', 'wild', 'scatter'];

export const REELS = 5;
export const ROWS = 3;

/** How many stops each symbol has on a reel (the virtual reel's weighting). */
const WEIGHTS: Record<SlotSymbol, number> = {
	pickle: 9,
	onion: 9,
	tomato: 8,
	cheese: 6,
	fries: 5,
	shake: 4,
	hotdog: 3,
	burger: 2,
	wild: 2,
	scatter: 2
};

/**
 * The five reel strips: the same stops on each reel, spread out (a fixed shuffle) so equal symbols
 * don't sit in a clump.
 */
export const STRIPS: SlotSymbol[][] = Array.from({ length: REELS }, (_, r) => spread(r));

function spread(reel: number): SlotSymbol[] {
	const list = SYMBOLS.flatMap((s) => Array<SlotSymbol>(WEIGHTS[s]).fill(s));
	// a small fixed generator (different per reel) so the strips are the same on every page
	let x = 0x9e3779b9 ^ (reel * 0x85ebca6b);
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
	return list;
}

/** What 3, 4 and 5 in a row pay, times the line bet (= the bet ÷ 10). */
export const PAYS: Record<Exclude<SlotSymbol, 'scatter'>, [number, number, number]> = {
	pickle: [7, 20, 70],
	onion: [7, 20, 70],
	tomato: [8, 25, 100],
	cheese: [15, 40, 150],
	fries: [20, 60, 200],
	shake: [30, 80, 350],
	hotdog: [35, 150, 600],
	burger: [75, 300, 1500],
	wild: [150, 750, 5000]
};
/** Ketchup anywhere: what 3, 4, 5 pay times the whole bet, and the free spins they give. */
export const SCATTER_PAYS: [number, number, number] = [2, 10, 50];
export const FREE_SPINS: [number, number, number] = [8, 12, 20];
/** Every win in free spins is doubled. */
export const FREE_MULT = 2;
/** No endless free spins: at most this many in one feature. */
export const FREE_MAX = 100;
export const LINES_COUNT = 10;

/** The 10 paylines: the row (0 top, 1 middle, 2 bottom) on each reel. */
export const LINES: number[][] = [
	[1, 1, 1, 1, 1],
	[0, 0, 0, 0, 0],
	[2, 2, 2, 2, 2],
	[0, 1, 2, 1, 0],
	[2, 1, 0, 1, 2],
	[0, 0, 1, 2, 2],
	[2, 2, 1, 0, 0],
	[1, 0, 0, 0, 1],
	[1, 2, 2, 2, 1],
	[0, 1, 0, 1, 0]
];

/** Bets on offer (multiples of 10, so every line bet is a whole burger). */
export const SLOT_BETS = [10, 20, 50, 100, 250, 500];

/** The screen: grid[reel][row]. */
export type Grid = SlotSymbol[][];

export interface LineWin {
	line: number;
	symbol: Exclude<SlotSymbol, 'scatter'>;
	count: number;
	/** Burgers (after the free-spin multiplier). */
	win: number;
}

export interface SpinResult {
	stops: number[];
	grid: Grid;
	lines: LineWin[];
	scatters: number;
	scatterWin: number;
	freeSpins: number;
	/** All burgers this spin won (lines + scatter, × the multiplier). */
	win: number;
	mult: number;
}

/** The screen for a set of stops (the stop is the top row; the strip wraps round). */
export function gridAt(stops: number[]): Grid {
	return stops.map((stop, r) => Array.from({ length: ROWS }, (_, row) => STRIPS[r][(stop + row) % STRIPS[r].length]));
}

/** One payline: the best of its wild run and its symbol run (a wild stands in for any symbol but the scatter). */
export function lineWin(symbols: SlotSymbol[]): { symbol: Exclude<SlotSymbol, 'scatter'>; count: number; pays: number } | null {
	let wilds = 0;
	while (wilds < symbols.length && symbols[wilds] === 'wild') wilds++;
	const wildPays = wilds >= 3 ? PAYS.wild[wilds - 3] : 0;
	const first = symbols.find((s) => s !== 'wild');
	let best: { symbol: Exclude<SlotSymbol, 'scatter'>; count: number; pays: number } | null =
		wildPays > 0 ? { symbol: 'wild', count: wilds, pays: wildPays } : null;
	if (first && first !== 'scatter') {
		let count = 0;
		while (count < symbols.length && (symbols[count] === first || symbols[count] === 'wild')) count++;
		const pays = count >= 3 ? PAYS[first][count - 3] : 0;
		if (pays > (best?.pays ?? 0)) best = { symbol: first, count, pays };
	}
	return best;
}

/** What a screen pays for a bet (lines left to right + ketchup anywhere), with a multiplier. */
export function evaluate(stops: number[], bet: number, mult = 1): SpinResult {
	const grid = gridAt(stops);
	const lineBet = bet / LINES_COUNT;
	const lines: LineWin[] = [];
	LINES.forEach((rows, i) => {
		const w = lineWin(rows.map((row, r) => grid[r][row]));
		if (w) lines.push({ line: i, symbol: w.symbol, count: w.count, win: Math.round(w.pays * lineBet * mult) });
	});
	const scatters = grid.flat().filter((s) => s === 'scatter').length;
	const k = Math.min(scatters, 5) - 3;
	const scatterWin = k >= 0 ? Math.round(SCATTER_PAYS[k] * bet * mult) : 0;
	const freeSpins = k >= 0 ? FREE_SPINS[k] : 0;
	const win = lines.reduce((n, l) => n + l.win, 0) + scatterWin;
	return { stops, grid, lines, scatters, scatterWin, freeSpins, win, mult };
}

export const randomStops = (rand: () => number) => STRIPS.map((strip) => randInt(strip.length, rand));

export interface Play {
	bet: number;
	base: SpinResult;
	/** The free spins this spin gave, played out (wins doubled). */
	free: SpinResult[];
	/** Everything won: the spin plus its free spins. */
	win: number;
	/** Burgers won minus the bet. */
	net: number;
}

/** One paid spin and the free spins it gives, all worked out at once (so closing the page changes nothing). */
export function play(bet: number, rand: () => number): Play {
	const base = evaluate(randomStops(rand), bet);
	const free: SpinResult[] = [];
	let left = base.freeSpins;
	while (left > 0 && free.length < FREE_MAX) {
		const s = evaluate(randomStops(rand), bet, FREE_MULT);
		free.push(s);
		left += s.freeSpins - 1;
	}
	const win = base.win + free.reduce((n, s) => n + s.win, 0);
	return { bet, base, free, win, net: win - bet };
}

export type WinTier = 'none' | 'win' | 'big' | 'mega' | 'jackpot';

/** How big a win reads: jackpot = five wilds on a line; mega ≥ 25× the bet; big ≥ 10×. */
export function winTier(p: Play): WinTier {
	const all = [p.base, ...p.free];
	if (all.some((s) => s.lines.some((l) => l.symbol === 'wild' && l.count === 5))) return 'jackpot';
	if (p.win >= p.bet * 25) return 'mega';
	if (p.win >= p.bet * 10) return 'big';
	return p.win > 0 ? 'win' : 'none';
}
