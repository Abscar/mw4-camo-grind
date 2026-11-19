/**
 * The Burger Bandit: BurgiCasino's one-armed bandit (2026-11-16, the user's ask: "a one-armed bandit
 * in burger theme, fun, fat and nice with lots of different wins, like a real one-armed bandit; do a
 * bit of research on how they work").
 *
 * Built like a real video slot: 5 reels × 3 rows, each reel a weighted "virtual reel" strip (common
 * symbols have many stops, the jackpot few), a stop picked at random per reel, 10 paylines paying left
 * to right (3, 4 or 5 in a row), a WILD that stands in for any paying symbol and pays the most itself,
 * and a KETCHUP scatter that pays anywhere on the screen and gives free spins (wins ×2, can retrigger).
 *
 * Bonus features (2026-11-16, the user's "add free spins and bonus to Abscar's Fortune", then all four
 * picks: a pick bonus, a wheel, buy bonus, free spins that show more):
 *  - BURGER BOX: the bonus box sits only on reels 1, 3 and 5; one on each opens a pick game of 12 boxes
 *    with burgers in them until a box says COLLECT (the first few never do).
 *  - BONUS WHEEL: the wheel symbol sits only on reels 2, 3 and 4; one on each spins a wheel of burger
 *    prizes, free spins and a jackpot slice. Every slice is equally likely.
 *  - BUY BONUS: pay a set number of bets to start free spins, the Burger Box or the wheel at once, priced
 *    so they give back about the same share as spinning (measured in scripts/casino-slots.test.js).
 *  - Free spins come a little more often (one more ketchup on reels 1–3).
 * Bonuses can also come during free spins; they pay the same there (only line and ketchup wins double).
 * Everything, bonus picks included, is worked out the moment you pay and booked at once, so closing the
 * page changes nothing; the boxes you tap only decide the order things are shown in.
 *
 * Long-run return ≈ 97 % for spins and 95–99 % for each bought feature (simulated with
 * .claude/testing/squad-casino/slot-sim3.mjs; the test checks the ranges). Before the bonuses it was ≈ 99 %
 * from lines + ketchup alone; the line pays are unchanged, but the ketchup and bonus stops make the strips
 * longer, so lines now give ≈ 60 % and free spins ≈ 20 %, the Burger Box ≈ 9 % and the wheel ≈ 8 % (one
 * more pickle, onion and tomato per reel keep ≈ 27 % of spins winning). Pretend burgers, never money. No
 * near-miss tricks: every stop is equally likely.
 *
 * Weed multipliers + sticky wilds (2026-11-16, the user's ask: "add sticky wilds in the free spins, and
 * special weed symbols that give ×2, ×5, ×10 and so on"):
 *  - WEED: a special stop (it breaks a line like ketchup) with a multiplier on it, drawn when it lands
 *    (×2 … ×100, WEED_VALUES). When the spin wins, every weed on the screen is added up and the spin's
 *    line + ketchup win is multiplied by the sum; no win, no effect. Rare in normal spins; the free spins
 *    have their own reel set (FREE_STRIPS) with more of them.
 *  - Sticky WILDs: in free spins every WILD that lands stays where it is until the free spins end
 *    (retriggers included).
 *  - A play never pays more than MAX_WIN × the bet (real slots cap their wins too).
 *
 * PARTY ODDS (2026-11-19, the user: "more wilds, more free spins, bonus symbols, more wins, double them,
 * everyone should win, more random sticky wilds, as if the money was free", then "the jackpot more often,
 * full screens of the same symbol, lots of crazy stuff, not like boring normal slots"): every pay doubled,
 * every symbol pays from 2 in a row, more WILD / ketchup / bonus stops, random WILDs (RANDOM_WILD_REELS),
 * FULL SCREEN (FULL_CHANCE; all WILDs = the BURGER JACKPOT), two jackpot slices on the wheel, cheaper buys.
 * It now gives back about 4× what goes in on purpose (pretend burgers): ≈ 68 % of spins win, free spins
 * about every 50 spins, Burger Box / wheel about every 125, the jackpot about 1 in 15,000 (it was ≈ 1 in
 * 330,000). The ≈ 97 % notes above are history. Simulated with slot-sim4.mjs; the test checks the ranges.
 *
 * Pure, the randomness passed in, so Node tests it. No browser APIs and no runes.
 */

import { randInt } from './squad-casino.ts';

export type SlotSymbol = 'pickle' | 'onion' | 'tomato' | 'cheese' | 'fries' | 'shake' | 'hotdog' | 'burger' | 'wild' | 'weed' | 'scatter' | 'box' | 'wheel';
/** The symbols that pay on a line (the WILD stands in for these). */
export type PaySymbol = Exclude<SlotSymbol, 'scatter' | 'box' | 'wheel' | 'weed'>;
export const SYMBOLS: SlotSymbol[] = ['pickle', 'onion', 'tomato', 'cheese', 'fries', 'shake', 'hotdog', 'burger', 'wild', 'weed', 'scatter', 'box', 'wheel'];
const SPECIAL = new Set<SlotSymbol>(['scatter', 'box', 'wheel', 'weed']);

export const REELS = 5;
export const ROWS = 3;

/** How many stops each paying symbol has on every reel (the virtual reel's weighting). */
const WEIGHTS: Record<PaySymbol, number> = {
	pickle: 10,
	onion: 10,
	tomato: 9,
	cheese: 6,
	fries: 5,
	shake: 4,
	hotdog: 3,
	burger: 2,
	wild: 2
};
/** Ketchup stops per reel. */
const SCATTER_STOPS = [3, 3, 3, 2, 2];
/** The reels each bonus symbol sits on (one visible on each of them = the bonus). */
export const BOX_REELS = [0, 2, 4];
export const WHEEL_REELS = [1, 2, 3];
/** Stops per bonus symbol on each reel (0 on the reels it doesn't sit on). */
const BOX_STOPS = [4, 0, 4, 0, 4];
const WHEEL_STOPS = [0, 4, 4, 4, 0];
/**
 * Random WILDs (2026-11-19, the user: "more wilds, more random sticky wilds"): they drop onto reels 2–4
 * (never reels 1 or 5, so they always stand in for a symbol rather than making a WILD-only line). In free
 * spins some drop on every spin and stick like landed ones; in normal spins now and then a few drop in.
 */
export const RANDOM_WILD_REELS = [1, 2, 3];
export const FREE_RANDOM_WILDS: [number, number][] = [
	[0, 88],
	[1, 12]
];
export const BASE_RANDOM_CHANCE = 0.06;
export const BASE_RANDOM_WILDS: [number, number][] = [
	[1, 60],
	[2, 30],
	[3, 10]
];
/**
 * Weed stops per reel: in normal spins only on the middle reel (one lands about every 20 spins), on the
 * free spins' own reels one on every reel (one in about every 4 free spins).
 */
const WEED_STOPS = [0, 0, 1, 0, 0];
const FREE_WEED_STOPS = [1, 1, 1, 1, 1];
/**
 * WILD stops per reel on the free spins' reels: only reels 2–4, so a sticky WILD always stands in for
 * the symbol on reel 1 and never makes a WILD-only line that would pay every spin.
 */
const FREE_WILD_STOPS = [0, 1, 1, 1, 0];
/** A weed's multiplier: [×, how often]. All the weeds on a winning screen add up. */
export const WEED_VALUES: [number, number][] = [
	[2, 60],
	[3, 22],
	[5, 11],
	[10, 5],
	[25, 1.5],
	[50, 0.4],
	[100, 0.1]
];
/** The most one play (a spin with its free spins and bonuses, or a bought feature) pays: × the bet. */
export const MAX_WIN = 5000;

/**
 * The five reel strips: the paying symbols in a fixed shuffle (different per reel) so equal symbols
 * don't sit in a clump, and the ketchup / bonus / weed stops spaced evenly between them, so a reel never
 * shows two of them at once and the odds of the features stay what they're worked out to be.
 * FREE_STRIPS = the same with more weeds, used in free spins.
 */
export const STRIPS: SlotSymbol[][] = Array.from({ length: REELS }, (_, r) => spread(r, WEED_STOPS[r], WEIGHTS.wild));
export const FREE_STRIPS: SlotSymbol[][] = Array.from({ length: REELS }, (_, r) => spread(r, FREE_WEED_STOPS[r], FREE_WILD_STOPS[r]));

function spread(reel: number, weeds: number, wilds: number): SlotSymbol[] {
	const list: SlotSymbol[] = (Object.keys(WEIGHTS) as PaySymbol[]).flatMap((s) => Array<SlotSymbol>(s === 'wild' ? wilds : WEIGHTS[s]).fill(s));
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
	// the special stops, taken in turn (ketchup, box, wheel, weed, ketchup …) so equal ones are far apart
	const left: [SlotSymbol, number][] = [
		['scatter', SCATTER_STOPS[reel]],
		['box', BOX_STOPS[reel]],
		['wheel', WHEEL_STOPS[reel]],
		['weed', weeds]
	];
	const specials: SlotSymbol[] = [];
	while (left.some(([, n]) => n > 0)) for (const e of left) if (e[1]-- > 0) specials.push(e[0]);
	const total = list.length + specials.length;
	const step = total / specials.length;
	const at = new Set(specials.map((_, i) => Math.floor(((reel * 2) % Math.floor(step)) + i * step)));
	const out: SlotSymbol[] = [];
	let si = 0;
	let li = 0;
	for (let i = 0; i < total; i++) out.push(at.has(i) ? specials[si++] : list[li++]);
	return out;
}

/** What 3, 4 and 5 in a row pay, times the line bet (= the bet ÷ 10). */
export const PAYS: Record<PaySymbol, [number, number, number]> = {
	pickle: [16, 40, 140],
	onion: [16, 40, 140],
	tomato: [16, 50, 200],
	cheese: [30, 80, 300],
	fries: [40, 120, 400],
	shake: [60, 160, 700],
	hotdog: [70, 300, 1200],
	burger: [150, 600, 3000],
	wild: [300, 1500, 10000]
};
/**
 * Symbols that also pay for just 2 in a row from the first reel (times the line bet). Wild and burger
 * since 2026-11-16 ("raise the odds a bit"); every pay doubled and hot dog + shake added on 2026-11-19
 * (the user: "more wins, double them, everyone should win, as if the money was free").
 */
export const PAYS2: Partial<Record<PaySymbol, number>> = { pickle: 1, onion: 1, tomato: 1, cheese: 2, fries: 2, shake: 4, hotdog: 6, burger: 8, wild: 16 };
/** Ketchup anywhere: what 3, 4, 5 pay times the whole bet, and the free spins they give. */
export const SCATTER_PAYS: [number, number, number] = [4, 20, 100];
export const FREE_SPINS: [number, number, number] = [8, 10, 15];
/** Free spins' line and ketchup wins multiplier (×1 from 2026-11-16, ×2 again since the party odds of 2026-11-19). */
export const FREE_MULT = 1;
/**
 * FULL SCREEN (2026-11-19, the user: "the jackpot more often, full screens of the same symbol, lots of
 * crazy stuff"): now and then the whole screen turns into one paying symbol, so all 10 lines pay five in a
 * row; a screen full of WILDs is the BURGER JACKPOT. Sticky WILDs stay WILDs.
 */
export const FULL_CHANCE = 1 / 1500;
export const FULL_SYMBOLS: [PaySymbol, number][] = [
	['pickle', 25],
	['onion', 25],
	['tomato', 16],
	['cheese', 10],
	['fries', 7],
	['shake', 5],
	['hotdog', 3],
	['burger', 2],
	['wild', 7]
];
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

/**
 * Bets on offer (multiples of 10, so every line bet is a whole burger). Up to 500 until 2026-11-19, when
 * the user asked to be able to bet higher: now up to 10,000. The odds don't depend on the bet.
 */
export const SLOT_BETS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

/* ---------- the Burger Box (pick game) ---------- */

/** Boxes on the pick screen. */
export const BOX_COUNT = 12;
/** What a box can hold: [× the bet, how often]. */
export const BOX_PRIZES: [number, number][] = [
	[2, 30],
	[4, 26],
	[6, 18],
	[10, 12],
	[16, 7],
	[24, 4],
	[50, 2],
	[100, 1]
];
/** The first picks never say COLLECT. */
export const BOX_SAFE = 3;
/** After those, how often the next box says COLLECT. */
export const BOX_COLLECT = 0.3;

/* ---------- the bonus wheel ---------- */

export interface WheelSlice {
	/** Burgers, × the bet. */
	win?: number;
	/** Free spins. */
	spins?: number;
	jackpot?: true;
}
/** The wheel's 12 slices, clockwise from the top; each as likely as any other. */
export const WHEEL: WheelSlice[] = [
	{ win: 10 },
	{ spins: 8 },
	{ win: 16 },
	{ win: 200, jackpot: true },
	{ spins: 10 },
	{ win: 10 },
	{ win: 40 },
	{ win: 20 },
	{ spins: 8 },
	{ win: 16 },
	{ win: 80 },
	{ win: 200, jackpot: true }
];

/* ---------- buy bonus ---------- */

export type BuyKind = 'free' | 'box' | 'wheel';
export const BUY_KINDS: BuyKind[] = ['free', 'box', 'wheel'];
/** What a bought feature costs, × the bet. */
export const BUY_PRICE: Record<BuyKind, number> = { free: 20, box: 11, wheel: 17 };
/** Free spins you get when you buy them. */
export const BUY_FREE_SPINS = 10;

/* ---------- results ---------- */

/** The screen: grid[reel][row]. */
export type Grid = SlotSymbol[][];

export interface LineWin {
	line: number;
	symbol: PaySymbol;
	count: number;
	/** Burgers (after the free-spin multiplier). */
	win: number;
}

export interface BoxBonus {
	/** Burgers in each box picked, in order; the next pick says COLLECT. */
	picks: number[];
	win: number;
}

export interface WheelBonus {
	/** The slice it stops on (index into WHEEL). */
	slice: number;
	/** Burgers won (0 for a free-spins slice). */
	win: number;
	spins: number;
}

/** A weed on the screen: where, and its multiplier. */
export interface WeedHit {
	reel: number;
	row: number;
	x: number;
}

export interface SpinResult {
	stops: number[];
	/** What the screen shows (sticky WILDs included). */
	grid: Grid;
	lines: LineWin[];
	scatters: number;
	scatterWin: number;
	freeSpins: number;
	/** Line + ketchup burgers before the weeds. */
	raw: number;
	/** The weeds on the screen (reading order: reel by reel, top to bottom) and their sum (0 = none). */
	weeds: WeedHit[];
	weedMult: number;
	/** Line + ketchup burgers this spin won (× the free-spin multiplier, × the weeds when it won); bonuses come on top. */
	win: number;
	mult: number;
	/** Free spins: WILDs held from earlier spins / WILDs that landed now and stick from here ("reel-row"). */
	sticky: string[];
	newSticky: string[];
	/** Random WILDs that dropped in this spin ("reel-row"; in free spins they stick too). */
	drops: string[];
	/** FULL SCREEN: the symbol the whole screen turned into. */
	full?: PaySymbol;
	/** A bonus box on each of reels 1, 3, 5 / a wheel on each of reels 2, 3, 4. */
	box: boolean;
	wheel: boolean;
	/** The bonuses it opened, played out (only in a play()). */
	boxBonus?: BoxBonus;
	wheelBonus?: WheelBonus;
}

/** The screen for a set of stops (the stop is the top row; the strip wraps round). */
export function gridAt(stops: number[], strips: SlotSymbol[][] = STRIPS): Grid {
	return stops.map((stop, r) => Array.from({ length: ROWS }, (_, row) => strips[r][(stop + row) % strips[r].length]));
}

/** A cell's key: "reel-row". */
export const cellKey = (reel: number, row: number) => `${reel}-${row}`;

/** The weed cells a screen shows (reading order), sticky WILDs covering theirs. */
export function weedCells(grid: Grid, sticky: readonly string[] = []): [number, number][] {
	const out: [number, number][] = [];
	grid.forEach((col, r) => col.forEach((sym, row) => sym === 'weed' && !sticky.includes(cellKey(r, row)) && out.push([r, row])));
	return out;
}

/** One payline: the best of its wild run and its symbol run (a wild stands in for any paying symbol). */
export function lineWin(symbols: SlotSymbol[]): { symbol: PaySymbol; count: number; pays: number } | null {
	const paysFor = (sym: PaySymbol, count: number) => (count >= 3 ? PAYS[sym][count - 3] : count === 2 ? (PAYS2[sym] ?? 0) : 0);
	let wilds = 0;
	while (wilds < symbols.length && symbols[wilds] === 'wild') wilds++;
	const wildPays = paysFor('wild', wilds);
	const first = symbols.find((s) => s !== 'wild');
	let best: { symbol: PaySymbol; count: number; pays: number } | null = wildPays > 0 ? { symbol: 'wild', count: wilds, pays: wildPays } : null;
	if (first && !SPECIAL.has(first)) {
		const sym = first as PaySymbol;
		let count = 0;
		while (count < symbols.length && (symbols[count] === sym || symbols[count] === 'wild')) count++;
		const pays = paysFor(sym, count);
		if (pays > (best?.pays ?? 0)) best = { symbol: sym, count, pays };
	}
	return best;
}

export interface EvalOptions {
	/** The reel set (FREE_STRIPS in free spins). */
	strips?: SlotSymbol[][];
	/** Free spins: the WILDs held so far (given = sticky WILDs are on; new WILDs are reported to stick). */
	sticky?: readonly string[];
	/** The landed weeds' multipliers, in reading order (missing ones count ×2). */
	values?: readonly number[];
	/** Random WILDs dropping in on these cells ("reel-row"). */
	drop?: readonly string[];
	/** FULL SCREEN: every cell (but the sticky WILDs) shows this symbol. */
	full?: PaySymbol;
}

/**
 * What a screen pays for a bet (lines left to right + ketchup anywhere), with a multiplier, its weeds,
 * sticky WILDs (free spins) and its bonus triggers.
 */
export function evaluate(stops: number[], bet: number, mult = 1, opts: EvalOptions = {}): SpinResult {
	const full = opts.full;
	const landed = full ? gridAt(stops, opts.strips).map((col) => col.map((): SlotSymbol => full)) : gridAt(stops, opts.strips);
	const held = opts.sticky ?? [];
	const drops = (opts.drop ?? []).filter((k) => !held.includes(k));
	const wildAt = [...held, ...drops];
	const grid = landed.map((col, r) => col.map((sym, row) => (wildAt.includes(cellKey(r, row)) ? 'wild' : sym)));
	// only reels 2–4 hold sticky WILDs (a full screen of WILDs in free spins doesn't stick on reels 1 and 5)
	const stickable = (k: string) => RANDOM_WILD_REELS.includes(Number(k.split('-')[0]));
	const newSticky = opts.sticky ? [...new Set([...cellsOf(landed, 'wild'), ...drops])].filter((k) => !held.includes(k) && stickable(k)) : [];
	const weeds = weedCells(landed, wildAt).map(([reel, row], i) => ({ reel, row, x: opts.values?.[i] ?? 2 }));
	const weedMult = weeds.reduce((n, w) => n + w.x, 0);
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
	const raw = lines.reduce((n, l) => n + l.win, 0) + scatterWin;
	const win = raw > 0 && weedMult > 0 ? raw * weedMult : raw;
	const box = BOX_REELS.every((r) => grid[r].includes('box'));
	const wheel = WHEEL_REELS.every((r) => grid[r].includes('wheel'));
	return { stops, grid, lines, scatters, scatterWin, freeSpins, raw, weeds, weedMult, win, mult, sticky: [...held], newSticky, drops, ...(full ? { full } : {}), box, wheel };
}

function cellsOf(grid: Grid, sym: SlotSymbol): string[] {
	const out: string[] = [];
	grid.forEach((col, r) => col.forEach((s, row) => s === sym && out.push(cellKey(r, row))));
	return out;
}

export const randomStops = (rand: () => number, strips: SlotSymbol[][] = STRIPS) => strips.map((strip) => randInt(strip.length, rand));

function weighted<T>(table: [T, number][], rand: () => number): T {
	let roll = rand() * table.reduce((n, [, w]) => n + w, 0);
	for (const [value, w] of table) if ((roll -= w) < 0) return value;
	return table[table.length - 1][0];
}

/** A Burger Box game, worked out: burgers per box picked until COLLECT (at most BOX_COUNT − 1 picks). */
export function boxBonus(bet: number, rand: () => number): BoxBonus {
	const picks: number[] = [];
	while (picks.length < BOX_COUNT - 1) {
		if (picks.length >= BOX_SAFE && rand() < BOX_COLLECT) break;
		picks.push(weighted(BOX_PRIZES, rand) * bet);
	}
	return { picks, win: picks.reduce((n, p) => n + p, 0) };
}

/** A wheel spin, worked out: every slice equally likely. */
export function wheelBonus(bet: number, rand: () => number): WheelBonus {
	const slice = randInt(WHEEL.length, rand);
	const s = WHEEL[slice];
	return { slice, win: (s.win ?? 0) * bet, spins: s.spins ?? 0 };
}

/** A landed weed's multiplier. */
export const weedValue = (rand: () => number) => weighted(WEED_VALUES, rand);

/** One spin with its weeds and bonuses played out (`sticky` given = free spins: sticky WILDs). */
function spinOnce(bet: number, mult: number, rand: () => number, strips: SlotSymbol[][] = STRIPS, sticky?: readonly string[]): SpinResult {
	const stops = randomStops(rand, strips);
	const full = rand() < FULL_CHANCE ? weighted(FULL_SYMBOLS, rand) : undefined;
	// random WILDs: some on every free spin, now and then in a normal spin
	const n = sticky ? weighted(FREE_RANDOM_WILDS, rand) : rand() < BASE_RANDOM_CHANCE ? weighted(BASE_RANDOM_WILDS, rand) : 0;
	const pool = RANDOM_WILD_REELS.flatMap((r) => Array.from({ length: ROWS }, (_, row) => cellKey(r, row))).filter((k) => !sticky?.includes(k));
	const drop: string[] = [];
	for (let i = 0; i < n && pool.length; i++) drop.push(...pool.splice(randInt(pool.length, rand), 1));
	const values = full ? [] : weedCells(gridAt(stops, strips), [...(sticky ?? []), ...drop]).map(() => weedValue(rand));
	const s = evaluate(stops, bet, mult, { strips, sticky, values, drop, full });
	if (s.box) s.boxBonus = boxBonus(bet, rand);
	if (s.wheel) s.wheelBonus = wheelBonus(bet, rand);
	return s;
}

/** Free spins a spin gives: ketchup + a free-spins slice on the wheel. */
export const spinsFrom = (s: SpinResult) => s.freeSpins + (s.wheelBonus?.spins ?? 0);
/** Everything a spin won: lines, ketchup and its bonuses. */
export const spinTotal = (s: SpinResult) => s.win + (s.boxBonus?.win ?? 0) + (s.wheelBonus?.win ?? 0);

/** Free spins on their own reels; every WILD that lands sticks until they end. */
function freeRun(bet: number, start: number, rand: () => number): SpinResult[] {
	const free: SpinResult[] = [];
	let left = start;
	let sticky: string[] = [];
	while (left > 0 && free.length < FREE_MAX) {
		const s = spinOnce(bet, FREE_MULT, rand, FREE_STRIPS, sticky);
		free.push(s);
		sticky = [...sticky, ...s.newSticky];
		left += spinsFrom(s) - 1;
	}
	return free;
}

export interface Play {
	/** A paid spin, or which feature was bought. */
	kind: 'spin' | BuyKind;
	bet: number;
	/** What was paid: the bet, or the bought feature's price. */
	cost: number;
	/** The paid spin (null when a feature was bought). */
	base: SpinResult | null;
	/** A bought Burger Box / wheel. */
	box: BoxBonus | null;
	wheel: WheelBonus | null;
	/** Free spins the spin / bought feature gave (before any came again). */
	freeStart: number;
	/** The free spins, played out (line and ketchup wins doubled). */
	free: SpinResult[];
	/** Everything won (at most MAX_WIN × the bet). */
	win: number;
	/** Burgers won minus what was paid. */
	net: number;
	/** It would have paid more than MAX_WIN × the bet: the win is capped there. */
	capped?: true;
}

/** A play's burgers, capped at MAX_WIN × the bet. */
export const capWin = (all: number, bet: number) => Math.min(all, MAX_WIN * bet);

function finish(kind: Play['kind'], bet: number, cost: number, base: SpinResult | null, box: BoxBonus | null, wheel: WheelBonus | null, freeStart: number, rand: () => number): Play {
	const free = freeRun(bet, freeStart, rand);
	const all = (base ? spinTotal(base) : 0) + (box?.win ?? 0) + (wheel?.win ?? 0) + free.reduce((n, s) => n + spinTotal(s), 0);
	const win = capWin(all, bet);
	return { kind, bet, cost, base, box, wheel, freeStart, free, win, net: win - cost, ...(all > win ? { capped: true as const } : {}) };
}

/** One paid spin with its bonuses and free spins, all worked out at once (so closing the page changes nothing). */
export function play(bet: number, rand: () => number): Play {
	const base = spinOnce(bet, 1, rand);
	return finish('spin', bet, bet, base, null, null, spinsFrom(base), rand);
}

/** A bought feature at a bet: free spins, the Burger Box or the wheel, worked out at once like a spin. */
export function buy(kind: BuyKind, bet: number, rand: () => number): Play {
	const cost = BUY_PRICE[kind] * bet;
	if (kind === 'free') return finish(kind, bet, cost, null, null, null, BUY_FREE_SPINS, rand);
	if (kind === 'box') return finish(kind, bet, cost, null, boxBonus(bet, rand), null, 0, rand);
	const wheel = wheelBonus(bet, rand);
	return finish(kind, bet, cost, null, null, wheel, wheel.spins, rand);
}

export type WinTier = 'none' | 'win' | 'big' | 'mega' | 'jackpot';

/**
 * How big a win reads: jackpot = five wilds on a line (the BURGER JACKPOT; the wheel's gold slice has its
 * own "JACKPOT" on the wheel and reads as a mega win here); mega ≥ 25× what was paid; big ≥ 10×.
 */
export function winTier(p: Play): WinTier {
	const all = [...(p.base ? [p.base] : []), ...p.free];
	if (all.some((s) => s.lines.some((l) => l.symbol === 'wild' && l.count === 5))) return 'jackpot';
	if (p.win >= p.cost * 25) return 'mega';
	if (p.win >= p.cost * 10) return 'big';
	return p.win > 0 ? 'win' : 'none';
}

/**
 * A paid spin whose screen is already chosen (Abscar's control room, casino-rig.ts): the screen is read
 * like a landed one (its weeds get multipliers, its bonuses and free spins play out as usual).
 */
export function playScreen(grid: Grid, bet: number, rand: () => number): Play {
	const strips = grid.map((col) => [...col]);
	const stops = grid.map(() => 0);
	const values = weedCells(grid).map(() => weedValue(rand));
	const base = evaluate(stops, bet, 1, { strips, values });
	if (base.box) base.boxBonus = boxBonus(bet, rand);
	if (base.wheel) base.wheelBonus = wheelBonus(bet, rand);
	return finish('spin', bet, bet, base, null, null, spinsFrom(base), rand);
}
