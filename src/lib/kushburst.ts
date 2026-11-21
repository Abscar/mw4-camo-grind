/**
 * Kushburst: BurgiCasino's third slot machine (2026-11-20, the user's ask: "make another slot that's like
 * Starburst, come up with a fun name for what Abscar's version would be called; it should look like
 * Starburst but the stars can be weed leaves instead").
 *
 * The same KIND of game as the classic neon "expanding wild + respin" slots, with our own name, symbols and
 * look (a blacklight stoner den, not space and gems):
 *  - 5 reels × 3 rows, 10 paylines that pay BOTH WAYS: 3, 4 or 5 in a row from the left reel or from the
 *    right reel (five in a row is paid once).
 *  - The LEAF is the WILD. It only lands on reels 2, 3 and 4. When one lands it grows over the whole reel
 *    (an expanding wild), the leaf reels hold and the other reels spin again for free (a respin). A new leaf
 *    in the respin grows too and gives one more respin, so at most three respins.
 *  - KUSHBURST: all three middle reels leaves at once = that screen pays ×3 (KUSH_MULT).
 *  - Leaf rain: once in a while (rare) a paid spin gets one to three leaves blown onto the middle reels.
 *  - Buy: a spin that starts with a leaf on a middle reel, or one that starts as a KUSHBURST.
 *  - A play (a spin with its respins, or a bought one) pays at most MAX_WIN × the bet.
 *
 * NORMAL CASINO ODDS (2026-11-21, the user: "make the odds on all the slots completely normal"; the party
 * odds of 2026-11-20 gave back ≈ 3.9×). Abscar's control room adds luck on top (casino-rig.ts), so the base
 * game is a fair machine: simulated over 1.5M spins (.claude/testing/squad-casino/kush-sim.mjs) it gives back
 * ≈ 97 % (base screens ≈ 45 %, respins ≈ 52 % of which KUSHBURST screens ≈ 18 %), ≈ 27 % of spins win, a leaf
 * (respin) ≈ 1 spin in 9, a KUSHBURST ≈ 1 in 1,300, leaf rain ≈ 1 in 500, ≥ 25× the bet ≈ 1 in 250; the buys
 * give back ≈ 96–98 % (a leaf 8×, a KUSHBURST 250× the bet). scripts/kushburst.test.js checks the ranges.
 * Every stop is equally likely (no near-miss tricks).
 *
 * Everything is worked out the moment you pay (play / buy return every step), then the page shows it.
 * Pure, the randomness passed in, so Node tests it. No browser APIs and no runes.
 */

import { randInt } from './squad-casino.ts';
import { LINES } from './casino-slots.ts';

export { LINES };

export type KushSymbol = 'lighter' | 'grinder' | 'papers' | 'brownie' | 'bong' | 'holk' | 'x420' | 'leaf';
/** The symbols that pay on a line (the leaf stands in for these and pays nothing itself). */
export type KushPay = Exclude<KushSymbol, 'leaf'>;
export const KUSH_PAYING: KushPay[] = ['lighter', 'grinder', 'papers', 'brownie', 'bong', 'holk', 'x420'];
export const KUSH_SYMBOLS: KushSymbol[] = [...KUSH_PAYING, 'leaf'];

export const KUSH_REELS = 5;
export const KUSH_ROWS = 3;
/** The reels a leaf lands on (and grows over). */
export const LEAF_REELS = [1, 2, 3];

/**
 * Stops per paying symbol on each reel (reel 1 … reel 5; 80 per reel). The outer four reels lean on the
 * cheap symbols (lighters common, 420s rare), the middle reel on the dear ones, so three in a row doesn't
 * come too easily (about one spin in four wins, like a real machine of this kind).
 */
const WEIGHTS: Record<KushPay, [number, number, number, number, number]> = {
	lighter: [18, 18, 2, 18, 18],
	grinder: [18, 18, 2, 18, 18],
	papers: [15, 15, 4, 15, 15],
	brownie: [12, 12, 10, 12, 12],
	bong: [8, 8, 20, 8, 8],
	holk: [6, 6, 22, 6, 6],
	x420: [3, 3, 20, 3, 3]
};
/** Leaf stops per reel (only on reels 2–4). */
const LEAF_STOPS = [0, 1, 1, 1, 0];

/** The five reel strips: every symbol in a fixed shuffle per reel, so every page has the same strips. */
export const KUSH_STRIPS: KushSymbol[][] = Array.from({ length: KUSH_REELS }, (_, r) => shuffled(r));

function shuffled(reel: number): KushSymbol[] {
	const list: KushSymbol[] = KUSH_PAYING.flatMap((s) => Array<KushSymbol>(WEIGHTS[s][reel]).fill(s));
	const leaves = LEAF_STOPS[reel];
	let x = 0x2545f491 ^ (reel * 0x9e3779b1);
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
	// the leaves spaced evenly, so a reel never shows two of them at once
	if (!leaves) return list;
	const total = list.length + leaves;
	const at = new Set(Array.from({ length: leaves }, (_, i) => Math.floor(reel + (i * total) / leaves)));
	const out: KushSymbol[] = [];
	let li = 0;
	for (let i = 0; i < total; i++) out.push(at.has(i) ? 'leaf' : list[li++]);
	return out;
}

/** What 3, 4 and 5 in a row pay, times the line bet (= the bet ÷ 10). */
export const KUSH_PAYS: Record<KushPay, [number, number, number]> = {
	lighter: [4, 10, 25],
	grinder: [4, 10, 25],
	papers: [5, 12, 35],
	brownie: [6, 15, 50],
	bong: [10, 25, 90],
	holk: [15, 50, 200],
	x420: [25, 100, 500]
};
/** A screen with all three middle reels leaves (a KUSHBURST) pays this many times over. */
export const KUSH_MULT = 3;
/** Leaf rain: the chance a paid spin gets leaves blown in (rare: about 1 spin in 500), and how many ([leaves, how often]). */
export const LEAF_RAIN = 0.002;
export const RAIN_LEAVES: [number, number][] = [
	[1, 70],
	[2, 25],
	[3, 5]
];
/** At most this many respins (one per middle reel). */
export const MAX_RESPINS = 3;
/** The most one play pays: × the bet. */
export const KUSH_MAX_WIN = 5000;
export const KUSH_LINES = 10;

/* ---------- buy ---------- */

export type KushBuy = 'leaf' | 'burst';
export const KUSH_BUYS: KushBuy[] = ['leaf', 'burst'];
/** What a bought spin costs, × the bet. */
export const KUSH_BUY_PRICE: Record<KushBuy, number> = { leaf: 8, burst: 250 };

/* ---------- results ---------- */

/** A screen: grid[reel][row]. */
export type KushGrid = KushSymbol[][];

export interface KushLine {
	line: number;
	/** From the left reel, from the right reel, or five in a row (paid once). */
	dir: 'left' | 'right' | 'both';
	symbol: KushPay;
	count: number;
	/** Burgers (× the KUSHBURST multiplier when it's one). */
	win: number;
}

/** One spin or respin. */
export interface KushStep {
	stops: number[];
	/** What landed (before the leaves grew). */
	landed: KushGrid;
	/** What the screen shows once the leaves have grown (leaf reels full of leaves). */
	grid: KushGrid;
	/** Leaf reels held from the spin before. */
	held: number[];
	/** Reels a leaf landed on this time (they grow now and give a respin), with the row it landed on. */
	fresh: { reel: number; row: number }[];
	/** Of those, the ones leaf rain blew in / a bought leaf. */
	rain: number[];
	/** Every leaf reel on this screen (held + fresh). */
	wild: number[];
	lines: KushLine[];
	/** KUSH_MULT on a KUSHBURST screen, else 1. */
	mult: number;
	win: number;
}

export interface KushPlay {
	kind: 'spin' | KushBuy;
	bet: number;
	cost: number;
	/** The paid spin, then its respins. */
	steps: KushStep[];
	win: number;
	net: number;
	capped?: true;
}

/** The screen for a set of stops (the stop is the top row; the strip wraps round). */
export function kushGridAt(stops: number[]): KushGrid {
	return stops.map((stop, r) => Array.from({ length: KUSH_ROWS }, (_, row) => KUSH_STRIPS[r][(stop + row) % KUSH_STRIPS[r].length]));
}

/** One run of a line read from one end: the first paying symbol and how far it (or leaves) goes. */
function run(seq: KushSymbol[]): { symbol: KushPay; count: number } {
	// a line of nothing but leaves can't land (reels 1 and 5 have none); read it as 420s
	const symbol = (seq.find((s) => s !== 'leaf') ?? 'x420') as KushPay;
	let count = 0;
	while (count < seq.length && (seq[count] === symbol || seq[count] === 'leaf')) count++;
	return { symbol, count };
}

/** What one payline pays both ways (pays × line bet, before any multiplier). */
export function kushLineWins(symbols: KushSymbol[]): { dir: KushLine['dir']; symbol: KushPay; count: number; pays: number }[] {
	const left = run(symbols);
	if (left.count >= KUSH_REELS) return [{ dir: 'both', ...left, pays: KUSH_PAYS[left.symbol][2] }];
	const right = run([...symbols].reverse());
	const out: { dir: KushLine['dir']; symbol: KushPay; count: number; pays: number }[] = [];
	if (left.count >= 3) out.push({ dir: 'left', ...left, pays: KUSH_PAYS[left.symbol][left.count - 3] });
	if (right.count >= 3) out.push({ dir: 'right', ...right, pays: KUSH_PAYS[right.symbol][right.count - 3] });
	return out;
}

/** What a screen pays at a bet (all 10 lines both ways), and the multiplier when it's a KUSHBURST. */
export function kushEvaluate(grid: KushGrid, bet: number): { lines: KushLine[]; mult: number; win: number } {
	const mult = LEAF_REELS.every((r) => grid[r].every((s) => s === 'leaf')) ? KUSH_MULT : 1;
	const lineBet = bet / KUSH_LINES;
	const lines: KushLine[] = [];
	LINES.forEach((rows, i) => {
		for (const w of kushLineWins(rows.map((row, r) => grid[r][row]))) lines.push({ line: i, dir: w.dir, symbol: w.symbol, count: w.count, win: Math.round(w.pays * lineBet * mult) });
	});
	return { lines, mult, win: lines.reduce((n, l) => n + l.win, 0) };
}

function weighted<T>(table: [T, number][], rand: () => number): T {
	let roll = rand() * table.reduce((n, [, w]) => n + w, 0);
	for (const [value, w] of table) if ((roll -= w) < 0) return value;
	return table[table.length - 1][0];
}

/**
 * One spin or respin. `held` = leaf reels from before (they stay leaves); `extra` = middle reels that get a
 * leaf blown in on top of what lands (leaf rain, a bought leaf, Abscar's control room).
 */
export function kushStep(bet: number, rand: () => number, held: readonly number[] = [], extra: readonly number[] = []): KushStep {
	const stops = KUSH_STRIPS.map((strip) => randInt(strip.length, rand));
	const landed = kushGridAt(stops);
	const fresh: { reel: number; row: number }[] = [];
	for (const r of LEAF_REELS) {
		if (held.includes(r)) continue;
		const row = landed[r].indexOf('leaf');
		if (row >= 0) fresh.push({ reel: r, row });
	}
	const rain: number[] = [];
	for (const r of extra) {
		if (!LEAF_REELS.includes(r) || held.includes(r) || fresh.some((f) => f.reel === r)) continue;
		const row = randInt(KUSH_ROWS, rand);
		landed[r][row] = 'leaf';
		fresh.push({ reel: r, row });
		rain.push(r);
	}
	fresh.sort((a, b) => a.reel - b.reel);
	const wild = [...held, ...fresh.map((f) => f.reel)].sort((a, b) => a - b);
	const grid = landed.map((col, r) => (wild.includes(r) ? col.map((): KushSymbol => 'leaf') : [...col]));
	const { lines, mult, win } = kushEvaluate(grid, bet);
	return { stops, landed, grid, held: [...held], fresh, rain, wild, lines, mult, win };
}

/** The middle reels leaf rain blows leaves onto (none most spins). */
function rainReels(rand: () => number): number[] {
	if (rand() >= LEAF_RAIN) return [];
	const pool = [...LEAF_REELS];
	const n = weighted(RAIN_LEAVES, rand);
	const out: number[] = [];
	for (let i = 0; i < n && pool.length; i++) out.push(...pool.splice(randInt(pool.length, rand), 1));
	return out;
}

/** A first spin, then a respin for every spin that grew a new leaf (at most MAX_RESPINS). */
function playOut(kind: KushPlay['kind'], bet: number, cost: number, rand: () => number, extra: readonly number[]): KushPlay {
	const steps = [kushStep(bet, rand, [], extra)];
	while (steps[steps.length - 1].fresh.length && steps.length <= MAX_RESPINS) steps.push(kushStep(bet, rand, steps[steps.length - 1].wild));
	const all = steps.reduce((n, s) => n + s.win, 0);
	const win = Math.min(all, KUSH_MAX_WIN * bet);
	return { kind, bet, cost, steps, win, net: win - cost, ...(all > win ? { capped: true as const } : {}) };
}

/** One paid spin with its respins, all worked out at once (so closing the page changes nothing). */
export function kushPlay(bet: number, rand: () => number): KushPlay {
	return playOut('spin', bet, bet, rand, rainReels(rand));
}

/**
 * A spin that starts with leaves on these middle reels (Abscar's control room: one leaf or a KUSHBURST),
 * paid like a normal spin.
 */
export function kushPlayWith(bet: number, rand: () => number, leaves: readonly number[]): KushPlay {
	return playOut('spin', bet, bet, rand, leaves);
}

/** A bought spin: one leaf on a random middle reel, or all three (a KUSHBURST from the start). */
export function kushBuy(kind: KushBuy, bet: number, rand: () => number): KushPlay {
	const leaves = kind === 'burst' ? [...LEAF_REELS] : [LEAF_REELS[randInt(LEAF_REELS.length, rand)]];
	return playOut(kind, bet, KUSH_BUY_PRICE[kind] * bet, rand, leaves);
}

export type KushTier = 'none' | 'win' | 'big' | 'mega' | 'kushburst';

/** How big a play reads: a KUSHBURST screen in it, mega ≥ 25× what was paid, big ≥ 10×. */
export function kushTier(p: KushPlay): KushTier {
	if (p.steps.some((s) => s.mult > 1) && p.win > 0) return 'kushburst';
	if (p.win >= p.cost * 25) return 'mega';
	if (p.win >= p.cost * 10) return 'big';
	return p.win > 0 ? 'win' : 'none';
}
