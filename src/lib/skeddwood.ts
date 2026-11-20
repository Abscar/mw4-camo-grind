/**
 * Skeddwood: BurgiCasino's third slot machine (2026-11-20, the user's ask: "another slot, like the
 * 'Deadwood 2' slot but called Skeddwood; the cowboy can be Abscar's terminator exoskeleton with a cowboy
 * hat; bonus and free spins like it; the camo grinder's theme, but keep how the game plays").
 *
 * The same KIND of game as Nolimit City's Deadwood R.I.P. (researched 2026-11-20 on casinos.com and
 * olbg.com: 5 reels of 3-4-4-4-2 rows, 384 ways, nudging wilds that gain a multiplier per nudge, symbols
 * split in two, a revolver shooting multipliers, sheriff badges turning low symbols wild, two tiers of free
 * spins with sticky wilds and an upgrade between them, tombstones for more spins), but every name, symbol
 * and drawing is our own:
 *  - Reels 1–5 show 3, 4, 4, 4 and 2 symbols (every reel the same height, so the cells differ in size).
 *    Wins pay ways: the same symbol on reels next to each other from reel 1, anywhere on each reel, 3, 4 or
 *    5 reels; ways = how many symbols match on each reel, multiplied. Low symbols (10 J Q K A) sit on reels
 *    1–4 only; the WANTED posters of the squad and the Divergence six-gun on every reel.
 *  - COWBOY WILD: Abscar's terminator exoskeleton in a cowboy hat, 4 symbols tall, on reels 2–4. When part
 *    of him lands he NUDGES until he fills the reel, +1 to his multiplier per step (×1 … ×4). In normal spins
 *    the cowboys' multipliers add up; in free spins they multiply each other, and he stays (sticky): every
 *    cowboy that lands on his reel again adds its multiplier to his.
 *  - THE SKEDD (a giant glass spoon pipe, the game's namesake), the whole of reel 5: it counts as WILD there
 *    and blows a big puff, so the middle symbols to its left are seen double: reel 1's middle row and the
 *    two middle rows of reels 2–4 split in two (each counts as two). A cowboy it hits doubles his multiplier.
 *  - QUICK DRAW: a revolver cylinder on reel 1 counts as WILD and fires 3–6 shots at reels 2–5. Every symbol
 *    hit doubles (×2, ×4 …) for every way through it; a cowboy hit doubles his multiplier.
 *  - HIGH NOON: a sheriff star on both reel 2 and reel 4: every low symbol on reels 2–4 (and the stars)
 *    turns WILD.
 *  - GOLDEN SKULL: one on each of reels 2, 3 and 4 = GOLD RUSH SPINS; with the Skedd on reel 5 at the same
 *    time = DIVERGENCE SPINS. In Gold Rush the Skedd landing upgrades it to Divergence (+2 spins). In
 *    Divergence the Skedd stands on reel 5 on every spin. Three GG tombstones in free spins = more spins.
 *  - Buy bonus: Gold Rush, Divergence, or the Lucky Draw (4 in 5 Gold Rush, 1 in 5 Divergence).
 *
 * PARTY ODDS like the other two machines (the user, 2026-11-19: "everyone should win, as if the money was
 * free"): more free spins than the original (8 + 8 instead of 5 + 6), bigger pays, more cowboys. Simulated
 * with .claude/testing/squad-casino/skeddwood-sim.mjs; scripts/skeddwood.test.js checks the ranges.
 *
 * Everything is worked out the moment you pay (play / buy), so closing the page changes nothing. Pure, the
 * randomness passed in, so Node tests it. No browser APIs and no runes.
 */

import { randInt } from './squad-casino.ts';

export type SkwPay = 'ten' | 'jack' | 'queen' | 'king' | 'ace' | 'ingman' | 'lars' | 'jeeven' | 'phil' | 'sixgun';
export type SkwSym = SkwPay | 'cowboy' | 'hwild' | 'skull' | 'skedd' | 'cylinder' | 'star' | 'grave';
export type SkwMode = 'gold' | 'divergence';

export const LOWS: SkwPay[] = ['ten', 'jack', 'queen', 'king', 'ace'];
export const HIGHS: SkwPay[] = ['ingman', 'lars', 'jeeven', 'phil', 'sixgun'];
export const PAY_SYMBOLS: SkwPay[] = [...LOWS, ...HIGHS];
/** Every symbol, in paytable order. */
export const SKW_SYMBOLS: SkwSym[] = [...PAY_SYMBOLS, 'cowboy', 'hwild', 'skedd', 'cylinder', 'star', 'skull', 'grave'];

export const REELS = 5;
/** Symbols shown on each reel (every reel is as tall as the others). */
export const ROWS = [3, 4, 4, 4, 2];
/** The cowboy stands 4 symbols tall on reels 2–4. */
export const STACK = 4;
export const COWBOY_REELS = [1, 2, 3];
export const SKEDD_REEL = 4;
export const STAR_REELS = [1, 3];
export const SKULL_REELS = [1, 2, 3];
/** The rows the Skedd's puff splits, per reel (reel 5 is the Skedd itself). */
export const SPLIT_ROWS: number[][] = [[1], [1, 2], [1, 2], [1, 2], []];
/** Symbols that count as WILD (stand in for every paying symbol). */
export const WILDISH = new Set<SkwSym>(['cowboy', 'hwild', 'cylinder', 'skedd']);
const PAYING = new Set<SkwSym>(PAY_SYMBOLS);
const LOW_SET = new Set<SkwSym>(LOWS);

/**
 * What 3, 4 and 5 reels pay per way, in hundredths of the bet (8 = 0.08 × the bet). The original's
 * paytable × 2.5 (party odds). Reel 5 has no low symbols, so five low symbols need the Skedd.
 */
export const PAYS: Record<SkwPay, [number, number, number]> = {
	ten: [28, 40, 120],
	jack: [28, 40, 120],
	queen: [28, 40, 120],
	king: [40, 64, 144],
	ace: [40, 64, 144],
	ingman: [48, 72, 180],
	lars: [48, 84, 240],
	jeeven: [60, 96, 300],
	phil: [60, 108, 360],
	sixgun: [72, 120, 420]
};

/** Free spins: how many each mode starts with, and what 3+ tombstones / the upgrade add. */
export const FREE_START: Record<SkwMode, number> = { gold: 8, divergence: 8 };
export const RETRIGGER: Record<SkwMode, number> = { gold: 5, divergence: 6 };
export const UPGRADE_SPINS = 2;
export const FREE_MAX = 100;
/** Quick Draw: how many shots, how often. */
export const SHOTS: [number, number][] = [
	[3, 40],
	[4, 30],
	[5, 20],
	[6, 10]
];
/** The most one play pays: × the bet. */
export const MAX_WIN = 10_000;
/** Bets on offer (the same as the other machines). The odds don't depend on the bet. */
export const SKW_BETS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

export type SkwBuy = 'gold' | 'lucky' | 'divergence';
export const SKW_BUYS: SkwBuy[] = ['gold', 'lucky', 'divergence'];
/** What a bought feature costs, × the bet. */
export const BUY_PRICE: Record<SkwBuy, number> = { gold: 38, lucky: 80, divergence: 250 };
/** The Lucky Draw: the chance it's Divergence (otherwise Gold Rush). */
export const LUCKY_DIVERGENCE = 0.2;

/* ---------- the reel strips ---------- */

/** One stop on a reel strip; `p` = which part of a tall symbol (cowboy 0–3 from his hat down, Skedd 0–1). */
export interface Stop {
	s: SkwSym;
	p?: number;
}

interface StripSpec {
	pays: Partial<Record<SkwPay, number>>;
	cowboys?: number;
	skulls?: number;
	stars?: number;
	cylinders?: number;
	graves?: number;
	skedds?: number;
}

const PAYS_1_4: Partial<Record<SkwPay, number>> = { ten: 12, jack: 12, queen: 11, king: 11, ace: 10, ingman: 5, lars: 4, jeeven: 4, phil: 3, sixgun: 3 };
const PAYS_5: Partial<Record<SkwPay, number>> = { ingman: 9, lars: 8, jeeven: 7, phil: 6, sixgun: 4 };
const FREE_PAYS_1_4: Partial<Record<SkwPay, number>> = { ten: 18, jack: 18, queen: 17, king: 16, ace: 15, ingman: 8, lars: 6, jeeven: 6, phil: 5, sixgun: 4 };
const FREE_PAYS_5: Partial<Record<SkwPay, number>> = { ingman: 30, lars: 28, jeeven: 25, phil: 22, sixgun: 15 };

const BASE_SPECS: StripSpec[] = [
	{ pays: PAYS_1_4, cylinders: 1 },
	{ pays: PAYS_1_4, cowboys: 1, skulls: 5, stars: 1 },
	{ pays: PAYS_1_4, cowboys: 1, skulls: 5 },
	{ pays: PAYS_1_4, cowboys: 1, skulls: 5, stars: 1 },
	{ pays: PAYS_5, skedds: 1 }
];
/** Free spins' reels: tombstones on reels 1–4, no skulls, the Skedd rarer on reel 5. */
const FREE_SPECS: StripSpec[] = [
	{ pays: FREE_PAYS_1_4, cylinders: 1, graves: 4 },
	{ pays: FREE_PAYS_1_4, cowboys: 1, stars: 1, graves: 4 },
	{ pays: FREE_PAYS_1_4, cowboys: 1, graves: 4 },
	{ pays: FREE_PAYS_1_4, cowboys: 1, stars: 1, graves: 4 },
	{ pays: FREE_PAYS_5, skedds: 1 }
];

/**
 * A reel strip: the paying symbols in a fixed shuffle (different per reel, the same on every page), with
 * the special blocks spaced evenly between them, so a window that shows part of a cowboy never shows
 * another special too (a nudge never covers a skull or a star).
 */
function buildStrip(reel: number, spec: StripSpec, salt: number): Stop[] {
	const list: Stop[] = (Object.keys(spec.pays) as SkwPay[]).flatMap((s) => Array.from({ length: spec.pays[s] ?? 0 }, () => ({ s })));
	let x = (0x9e3779b9 ^ (reel * 0x85ebca6b) ^ (salt * 0xc2b2ae35)) >>> 0 || 1;
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
	const kinds: [Stop[], number][] = [
		[Array.from({ length: STACK }, (_, p) => ({ s: 'cowboy' as SkwSym, p })), spec.cowboys ?? 0],
		[[{ s: 'skull' }], spec.skulls ?? 0],
		[[{ s: 'star' }], spec.stars ?? 0],
		[[{ s: 'cylinder' }], spec.cylinders ?? 0],
		[[{ s: 'grave' }], spec.graves ?? 0],
		[
			[
				{ s: 'skedd', p: 0 },
				{ s: 'skedd', p: 1 }
			],
			spec.skedds ?? 0
		]
	];
	const blocks: Stop[][] = [];
	while (kinds.some(([, n]) => n > 0)) for (const k of kinds) if (k[1]-- > 0) blocks.push(k[0]);
	if (!blocks.length) return list;
	const out: Stop[] = [];
	const seg = list.length / blocks.length;
	let li = 0;
	blocks.forEach((b, i) => {
		const until = Math.round((i + 1) * seg);
		while (li < until) out.push(list[li++]);
		out.push(...b.map((s) => ({ ...s })));
	});
	while (li < list.length) out.push(list[li++]);
	return out;
}

export const STRIPS: Stop[][] = BASE_SPECS.map((spec, r) => buildStrip(r, spec, 1));
export const FREE_STRIPS: Stop[][] = FREE_SPECS.map((spec, r) => buildStrip(r, spec, 2));

/** Where a reel may stop: never with half the Skedd showing (it always lands whole). */
function allowedStops(strip: Stop[], rows: number): number[] {
	const L = strip.length;
	return strip.map((_, i) => i).filter((st) => {
		const parts = Array.from({ length: rows }, (_, k) => strip[(st + k) % L]).filter((x) => x.s === 'skedd').length;
		return parts === 0 || parts === 2;
	});
}
export const ALLOWED: number[][] = STRIPS.map((s, r) => allowedStops(s, ROWS[r]));
export const FREE_ALLOWED: number[][] = FREE_STRIPS.map((s, r) => allowedStops(s, ROWS[r]));
/** Divergence: reel 5 always stops on the Skedd. */
export const SKEDD_STOP = FREE_STRIPS[SKEDD_REEL].findIndex((x) => x.s === 'skedd' && x.p === 0);

/** The window a reel shows from a stop (top to bottom; the strip wraps round). */
export const windowAt = (strip: Stop[], stop: number, rows: number): Stop[] => Array.from({ length: rows }, (_, k) => ({ ...strip[(stop + k) % strip.length] }));

/* ---------- a spin ---------- */

/** A cell on the screen after everything: split in two, doubled by shots (x), turned WILD at High Noon. */
export interface Cell extends Stop {
	split?: true;
	x?: number;
	flip?: true;
}
export interface Nudge {
	reel: number;
	/** The stop it landed on and the stop it nudged to. */
	from: number;
	to: number;
	steps: number;
	/** +1 = the cowboy was above the window and comes down … the reel moves on towards later stops. */
	dir: 1 | -1;
	/** His multiplier from the nudge: 1 + steps. */
	mult: number;
}
export interface Shot {
	reel: number;
	row: number;
}
export interface WayWin {
	sym: SkwPay;
	/** How many reels from reel 1 (3–5). */
	reels: number;
	ways: number;
	/** The cowboys' multiplier on it (1 = none). */
	mult: number;
	win: number;
}

export interface SkwSpin {
	/** null = a paid spin; otherwise the free spins' mode it was played in. */
	mode: SkwMode | null;
	stops: number[];
	/** What each reel showed as it landed (before the nudges). */
	landed: Stop[][];
	nudges: Nudge[];
	/** Free spins: the sticky cowboys held before this spin (reel → his multiplier). */
	held: Record<number, number>;
	/** What this spin adds to the stored multipliers (new cowboys, and cowboys landing on a sticky one). */
	grow: Record<number, number>;
	/** The cowboy reels in play this spin and their multiplier (doubled by the Skedd / shots). */
	cowboys: Record<number, number>;
	skedd: boolean;
	highNoon: boolean;
	shots: Shot[];
	/** The screen after everything. */
	grid: Cell[][];
	skulls: number;
	graves: number;
	wins: WayWin[];
	/** Burgers this spin won. */
	win: number;
	/** A paid spin: the free spins it starts. */
	trigger: SkwMode | null;
	/** Free spins: spins added by tombstones / the upgrade to Divergence on this spin. */
	more?: number;
	upgrade?: true;
}

function weighted<T>(table: [T, number][], rand: () => number): T {
	let roll = rand() * table.reduce((n, [, w]) => n + w, 0);
	for (const [value, w] of table) if ((roll -= w) < 0) return value;
	return table[table.length - 1][0];
}

const cellWeight = (c: Cell) => (c.split ? 2 : 1) * (c.x ?? 1);

/**
 * The ways wins of a screen. Per paying symbol: each reel counts its matching symbols and wilds (a split
 * one counts twice, a shot one doubles per shot; a cowboy reel counts as one WILD); the reels in a row from
 * reel 1 that have any make the win (3+), ways = the counts multiplied. Ways made of wilds alone go to the top symbol (the six-gun), not
 * to every symbol. The cowboys on those reels multiply it: added up in normal spins, multiplied in free spins.
 */
export function waysWins(grid: Cell[][], cowboys: Record<number, number>, free: boolean, bet: number): { wins: WayWin[]; win: number } {
	const wins: WayWin[] = [];
	let units = 0;
	for (const sym of PAY_SYMBOLS) {
		let total = 1;
		let wild = 1;
		let k = 0;
		for (let r = 0; r < REELS; r++) {
			let m = 0;
			let u = 0;
			// a cowboy is one big WILD on his reel (his multiplier does the rest)
			if (cowboys[r]) u = 1;
			else
				for (const c of grid[r]) {
					if (c.s === sym) m += cellWeight(c);
					else if (WILDISH.has(c.s)) u += cellWeight(c);
				}
			if (m + u === 0) break;
			total *= m + u;
			wild *= u;
			k++;
		}
		if (k < 3) continue;
		const ways = total - (sym === 'sixgun' ? 0 : wild);
		if (ways <= 0) continue;
		const on = Object.keys(cowboys)
			.map(Number)
			.filter((r) => r < k)
			.map((r) => cowboys[r]);
		const mult = on.length ? (free ? on.reduce((a, b) => a * b, 1) : on.reduce((a, b) => a + b, 0)) : 1;
		const u = PAYS[sym][k - 3] * ways * mult;
		units += u;
		wins.push({ sym, reels: k, ways, mult, win: Math.round((u * bet) / 100) });
	}
	return { wins, win: Math.round((units * bet) / 100) };
}

/** Where on the strip a cowboy's top is, if part of him shows in this window (or -1). */
function cowboyAt(strip: Stop[], stop: number): number {
	const L = strip.length;
	for (let k = 0; k < STACK; k++) {
		const x = strip[(stop + k) % L];
		if (x.s === 'cowboy') return (((stop + k - (x.p ?? 0)) % L) + L) % L;
	}
	return -1;
}

/**
 * One spin. `mode` = free spins (their reels, multiplying cowboys, sticky ones in `held`); `stops` = a
 * screen already picked (Abscar's control room), otherwise drawn.
 */
export function spinOnce(bet: number, rand: () => number, mode: SkwMode | null = null, held: Record<number, number> = {}, stops?: number[]): SkwSpin {
	const strips = mode ? FREE_STRIPS : STRIPS;
	const allowed = mode ? FREE_ALLOWED : ALLOWED;
	const at =
		stops ??
		strips.map((_, r) => {
			if (mode === 'divergence' && r === SKEDD_REEL) return SKEDD_STOP;
			const a = allowed[r];
			return a[randInt(a.length, rand)];
		});
	const landed = strips.map((strip, r) => windowAt(strip, at[r], ROWS[r]));
	const grid: Cell[][] = landed.map((col) => col.map((c) => ({ ...c })));
	const nudges: Nudge[] = [];
	const cowboys: Record<number, number> = {};
	const grow: Record<number, number> = {};
	const free = mode !== null;

	// the cowboys nudge into place (a sticky one holds his reel whatever lands under him)
	for (const r of COWBOY_REELS) {
		const strip = strips[r];
		const L = strip.length;
		const top = cowboyAt(strip, at[r]);
		let mult = 0;
		if (top >= 0) {
			let d = (((top - at[r]) % L) + L) % L;
			if (d > L / 2) d -= L;
			const steps = Math.abs(d);
			mult = 1 + steps;
			if (steps) nudges.push({ reel: r, from: at[r], to: top, steps, dir: d > 0 ? 1 : -1, mult });
		}
		if (free && held[r]) {
			cowboys[r] = held[r] + mult;
			if (mult) grow[r] = mult;
		} else if (mult) {
			cowboys[r] = mult;
			if (free) grow[r] = mult;
		}
		if (cowboys[r]) grid[r] = Array.from({ length: STACK }, (_, p) => ({ s: 'cowboy' as SkwSym, p }));
	}

	// High Noon: a star on reels 2 and 4 turns the low symbols on reels 2–4 WILD
	const highNoon = STAR_REELS.every((r) => grid[r].some((c) => c.s === 'star'));
	if (highNoon) for (const r of COWBOY_REELS) if (!cowboys[r]) grid[r] = grid[r].map((c) => (LOW_SET.has(c.s) || c.s === 'star' ? { s: 'hwild', flip: true } : c));

	// the Skedd: wild on reel 5, its puff splits the middle rows to its left (a cowboy doubles instead)
	const skedd = grid[SKEDD_REEL].every((c) => c.s === 'skedd');
	if (skedd)
		SPLIT_ROWS.forEach((rows, r) => {
			if (cowboys[r]) cowboys[r] *= 2;
			else for (const row of rows) if (PAYING.has(grid[r][row].s) || WILDISH.has(grid[r][row].s)) grid[r][row].split = true;
		});

	// Quick Draw: the cylinder on reel 1 fires at reels 2–5; each hit doubles that symbol (or that cowboy)
	const shots: Shot[] = [];
	if (grid[0].some((c) => c.s === 'cylinder')) {
		const cells: Shot[] = [];
		for (let r = 1; r < REELS; r++) for (let row = 0; row < grid[r].length; row++) cells.push({ reel: r, row });
		const n = weighted(SHOTS, rand);
		for (let i = 0; i < n; i++) {
			const s = cells[randInt(cells.length, rand)];
			shots.push(s);
			if (cowboys[s.reel]) cowboys[s.reel] *= 2;
			else grid[s.reel][s.row].x = (grid[s.reel][s.row].x ?? 1) * 2;
		}
	}

	const skulls = free ? 0 : SKULL_REELS.filter((r) => grid[r].some((c) => c.s === 'skull')).length;
	const graves = free ? grid.slice(0, 4).filter((col) => col.some((c) => c.s === 'grave')).length : 0;
	const { wins, win } = waysWins(grid, cowboys, free, bet);
	const trigger: SkwMode | null = skulls >= 3 ? (skedd ? 'divergence' : 'gold') : null;
	return { mode, stops: at, landed, nudges, held: { ...held }, grow, cowboys, skedd, highNoon, shots, grid, skulls, graves, wins, win, trigger };
}

/** Free spins, played out: sticky cowboys, tombstones, Gold Rush upgrading to Divergence when the Skedd lands. */
export function freeRun(bet: number, mode: SkwMode, start: number, rand: () => number): SkwSpin[] {
	const out: SkwSpin[] = [];
	const held: Record<number, number> = {};
	let left = start;
	let m = mode;
	while (left > 0 && out.length < FREE_MAX) {
		const s = spinOnce(bet, rand, m, held);
		out.push(s);
		left -= 1;
		for (const [r, g] of Object.entries(s.grow)) held[Number(r)] = (held[Number(r)] ?? 0) + g;
		let more = 0;
		if (s.graves >= 3) more += RETRIGGER[m];
		if (m === 'gold' && s.skedd) {
			s.upgrade = true;
			m = 'divergence';
			more += UPGRADE_SPINS;
		}
		if (more) {
			s.more = more;
			left += more;
		}
	}
	return out;
}

export interface SkwPlay {
	kind: 'spin' | SkwBuy;
	bet: number;
	cost: number;
	base: SkwSpin | null;
	/** The free spins' mode it started with (null = none). */
	mode: SkwMode | null;
	freeStart: number;
	free: SkwSpin[];
	/** Everything won (at most MAX_WIN × the bet). */
	win: number;
	net: number;
	capped?: true;
}

function finish(kind: SkwPlay['kind'], bet: number, cost: number, base: SkwSpin | null, mode: SkwMode | null, rand: () => number): SkwPlay {
	const freeStart = mode ? FREE_START[mode] : 0;
	const free = mode ? freeRun(bet, mode, freeStart, rand) : [];
	const all = (base?.win ?? 0) + free.reduce((n, s) => n + s.win, 0);
	const win = Math.min(all, MAX_WIN * bet);
	return { kind, bet, cost, base, mode, freeStart, free, win, net: win - cost, ...(all > win ? { capped: true as const } : {}) };
}

/** One paid spin with its free spins, all worked out at once. */
export function play(bet: number, rand: () => number): SkwPlay {
	const base = spinOnce(bet, rand);
	return finish('spin', bet, bet, base, base.trigger, rand);
}

/** A paid spin on a screen already picked (stops per reel), played out as usual. */
export function playStops(stops: number[], bet: number, rand: () => number): SkwPlay {
	const base = spinOnce(bet, rand, null, {}, stops);
	return finish('spin', bet, bet, base, base.trigger, rand);
}

/** A bought feature at a bet. */
export function buy(kind: SkwBuy, bet: number, rand: () => number): SkwPlay {
	const mode: SkwMode = kind === 'lucky' ? (rand() < LUCKY_DIVERGENCE ? 'divergence' : 'gold') : kind;
	return finish(kind, bet, BUY_PRICE[kind] * bet, null, mode, rand);
}

export type SkwTier = 'none' | 'win' | 'big' | 'mega' | 'legend';
/** How big a win reads, against what was paid: big ≥ 10×, mega ≥ 30×, legendary ≥ 100×. */
export function skwTier(p: SkwPlay): SkwTier {
	if (p.win >= p.cost * 100) return 'legend';
	if (p.win >= p.cost * 30) return 'mega';
	if (p.win >= p.cost * 10) return 'big';
	return p.win > 0 ? 'win' : 'none';
}

/* ---------- Abscar's control room ---------- */

export type SkwForce = 'gold' | 'divergence' | 'highnoon' | 'quickdraw' | 'big' | 'blank';
export const SKW_FORCES: SkwForce[] = ['gold', 'divergence', 'highnoon', 'quickdraw', 'big', 'blank'];
/** A "big win": at least this many times the bet. */
export const SKW_BIG = 25;

/** True when a paid spin has what was asked for. */
export function skwMatches(p: SkwPlay, want: SkwForce): boolean {
	switch (want) {
		case 'gold':
			return p.base?.trigger === 'gold';
		case 'divergence':
			return p.base?.trigger === 'divergence';
		case 'highnoon':
			return !!p.base?.highNoon;
		case 'quickdraw':
			return (p.base?.shots.length ?? 0) > 0;
		case 'big':
			return p.win >= p.bet * SKW_BIG;
		case 'blank':
			return p.win === 0;
	}
}
