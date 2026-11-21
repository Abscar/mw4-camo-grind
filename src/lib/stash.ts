/**
 * Abscar's Stash, BurgiCasino's tumble slot (2026-11-20, the user's ask: "gör en slot som fungerar som
 * 'sweet bonanza' men kom på ett namn som är abscar vänligt, gör temat till olika droger istället för
 * godisar!"). The same kind of game as the well-known "pay anywhere" tumble slots, with our own name,
 * symbols, numbers and drawings:
 *
 * - 6 reels × 5 rows. Nine paying symbols (five "low" ones: bud, shroom, brownie, acid tab, lean; four
 *   stamped pills: blue star, green leaf, purple bolt, red heart) pay ANYWHERE on the screen: 8 or more
 *   of one symbol, three steps (8–9, 10–11, 12+).
 * - Tumble: the winning symbols go, everything above falls down, new symbols drop in from the top, and
 *   that goes on as long as something wins.
 * - THE HOLK (Abscar's lit cone joint) is the scatter: at most one per reel. 4 or more on the screen when
 *   the tumbling stops pay (`HOLK_PAYS`) and start SKY HIGH SPINS (`FREE_SPINS`); 3 or more in them give
 *   more (`RETRIGGER`).
 * - Smoke clouds carry a multiplier (×2 … ×100, `CLOUD_VALUES`). They never tumble away; when a spin's
 *   tumbling stops with a win, every cloud on the screen adds up and multiplies the spin's tumble win
 *   (not the holk pay). Mostly in Sky High Spins; now and then in a normal spin too.
 * - Double chance (ante): the spin costs +25 % and holks land twice as often. Buying a bonus is off while
 *   it's on, like the real ones.
 * - Buy: Sky High Spins, or Super Sky High (every cloud at least ×10, `SUPER_VALUES`).
 *
 * NORMAL CASINO ODDS (2026-11-21, the user: "make the odds on all the slots completely normal"; until then
 * it had "party odds" that gave back ≈ 4.1×). Abscar sets luck by hand in the control room (casino-rig.ts
 * adds it on top), so the base game is a fair, real-casino machine. Simulated over 4M seeded spins
 * (`.claude/testing/squad-casino/stash-sim.mjs`): RTP ≈ 96.3 % (tumbles ≈ 71.7 %, holk pays ≈ 1.5 %, Sky
 * High Spins ≈ 23 %), a win on ≈ 24 % of spins, Sky High Spins ≈ 1 in 295 (a run is worth ≈ 68× the bet).
 * Double chance: RTP ≈ 96.3 % of its cost, Sky High Spins ≈ 1 in 157. Buys: Sky High Spins 70× ≈ 96.8 %,
 * Super Sky High 175× ≈ 97 %. The ranges are checked in scripts/stash.test.js.
 *
 * The whole play (a spin with its free spins, or a bought bonus) is worked out at once and booked before
 * anything shows; the page only plays back `StashSpin.steps`. No browser APIs, no runes.
 */

export type Sym = 'bud' | 'shroom' | 'brownie' | 'tab' | 'lean' | 'blue' | 'green' | 'purple' | 'heart';
/** Paying symbols, lowest first. */
export const SYMS: Sym[] = ['bud', 'shroom', 'brownie', 'tab', 'lean', 'blue', 'green', 'purple', 'heart'];
export type Kind = Sym | 'holk' | 'cloud';
export interface Piece {
	/** unique within a play (the page keys pieces by it, so a piece keeps its place while others fall) */
	id: number;
	kind: Kind;
	/** a cloud's multiplier */
	x?: number;
}
/** grid[col][row], row 0 at the top. */
export type Grid = Piece[][];
export const COLS = 6;
export const ROWS = 5;
/** A cell's key: col × ROWS + row. */
export const cellKey = (col: number, row: number) => col * ROWS + row;
export const colOfKey = (k: number) => Math.floor(k / ROWS);
export const rowOfKey = (k: number) => k % ROWS;

/** The fewest of one symbol that pays. */
export const MIN_PAY = 8;
/** Pays in hundredths of the bet for 8–9, 10–11 and 12+ of a symbol (normal odds, see the header). */
export const PAYS: Record<Sym, [number, number, number]> = {
	bud: [60, 160, 525],
	shroom: [90, 215, 790],
	brownie: [110, 265, 1050],
	tab: [170, 335, 1580],
	lean: [225, 445, 2105],
	blue: [335, 650, 3155],
	green: [475, 1050, 4210],
	purple: [650, 2105, 6525],
	heart: [2105, 5260, 11575]
};
/** Which pay step a count falls in (−1 = doesn't pay). */
export const payStep = (n: number) => (n >= 12 ? 2 : n >= 10 ? 1 : n >= MIN_PAY ? 0 : -1);

/** Symbol weights per drawn cell: lows a bit more common, the red heart rarest (fairly flat, so 8+ of one
 * symbol lands on about a quarter of the spins). */
export const WEIGHTS: Record<Sym, number> = {
	bud: 16,
	shroom: 15,
	brownie: 14,
	tab: 13,
	lean: 12,
	blue: 9,
	green: 8,
	purple: 7,
	heart: 6
};

/** The holk (scatter): its chance per drawn cell (a reel never holds two). Double chance doubles it. */
export const HOLK_CHANCE = { base: 0.025, free: 0.026 };
export const ANTE_HOLK = 1.2;
/** Holk pays (× the bet) for 4, 5, 6 on the screen when the tumbling stops. */
export const HOLK_PAYS: Record<number, number> = { 4: 4, 5: 8, 6: 120 };
/** Holks that start Sky High Spins (normal spin) / give more in them. */
export const HOLKS_TO_START = 4;
export const HOLKS_TO_RETRIGGER = 3;
export const FREE_SPINS = 12;
export const RETRIGGER = 5;
/** Free spins at most in one run. */
export const FREE_MAX = 100;

/** A smoke cloud's chance per drawn cell. */
export const CLOUD_CHANCE = { base: 0.0012, free: 0.11 };
/** Cloud multipliers and their weights. */
export const CLOUD_VALUES: [number, number][] = [
	[2, 13],
	[3, 12],
	[4, 13],
	[5, 10],
	[6, 7],
	[8, 6],
	[10, 5],
	[12, 3],
	[15, 2.2],
	[20, 1.6],
	[25, 1.1],
	[50, 0.45],
	[100, 0.12]
];
/** Super Sky High: every cloud at least ×10. */
export const SUPER_VALUES: [number, number][] = CLOUD_VALUES.filter(([x]) => x >= 10);

/** Double chance costs this much more than the bet. */
export const ANTE_COST = 1.25;
export const anteCost = (bet: number) => Math.round(bet * ANTE_COST);

export type StashBuy = 'free' | 'super';
export const BUY_KINDS: StashBuy[] = ['free', 'super'];
/** Buy prices, × the bet. */
export const BUY_PRICE: Record<StashBuy, number> = { free: 70, super: 175 };

export const STASH_BETS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
/** One play pays at most this many times the bet. */
export const MAX_WIN = 10_000;

/* ---------- the play ---------- */

export interface Win {
	sym: Sym;
	count: number;
	/** hundredths of the bet */
	pay: number;
	cells: number[];
}
/** One tumble: what won, which cells went, the screen after everything fell and refilled. */
export interface Step {
	wins: Win[];
	gone: number[];
	grid: Grid;
}
export type Mode = 'base' | 'free' | 'super';
export interface StashSpin {
	mode: Mode;
	start: Grid;
	steps: Step[];
	/** the tumble wins added up (hundredths of the bet) */
	raw: number;
	/** the clouds on the final screen, added up (0 = none) */
	clouds: number;
	/** what multiplied the tumble win (1 = nothing) */
	mult: number;
	holks: number;
	/** the holk pay, hundredths of the bet */
	holkPay: number;
	/** the whole spin: raw × mult + holk pay (hundredths of the bet) */
	pay: number;
	/** free spins this spin started or added */
	more: number;
}
export interface StashPlay {
	kind: 'spin' | StashBuy;
	bet: number;
	cost: number;
	ante: boolean;
	base: StashSpin | null;
	/** 'free' or 'super' when Sky High Spins run */
	bonus: 'free' | 'super' | null;
	free: StashSpin[];
	/** burgers won (whole, capped) */
	win: number;
	net: number;
	capped?: true;
}

interface Ctx {
	rand: () => number;
	id: number;
}

const SYM_TOTAL = SYMS.reduce((n, s) => n + WEIGHTS[s], 0);
function drawSym(rand: () => number): Sym {
	let x = rand() * SYM_TOTAL;
	for (const s of SYMS) {
		x -= WEIGHTS[s];
		if (x < 0) return s;
	}
	return SYMS[0];
}
function drawValue(rand: () => number, table: [number, number][]): number {
	const total = table.reduce((n, [, w]) => n + w, 0);
	let x = rand() * total;
	for (const [v, w] of table) {
		x -= w;
		if (x < 0) return v;
	}
	return table[0][0];
}

/** A new piece for a cell (a column that already has a holk gets none). */
function draw(ctx: Ctx, mode: Mode, ante: boolean, holkInCol: boolean): Piece {
	const id = ctx.id++;
	const free = mode !== 'base';
	const h = (free ? HOLK_CHANCE.free : HOLK_CHANCE.base) * (ante && !free ? ANTE_HOLK : 1);
	const x = ctx.rand();
	if (!holkInCol && x < h) return { id, kind: 'holk' };
	const c = free ? CLOUD_CHANCE.free : CLOUD_CHANCE.base;
	if (x < h + c) return { id, kind: 'cloud', x: drawValue(ctx.rand, mode === 'super' ? SUPER_VALUES : CLOUD_VALUES) };
	return { id, kind: drawSym(ctx.rand) };
}

/** Fill `n` new pieces on top of a column that keeps `keep` (fresh ones listed top first). */
function refill(ctx: Ctx, keep: Piece[], mode: Mode, ante: boolean): Piece[] {
	let holk = keep.some((p) => p.kind === 'holk');
	const fresh: Piece[] = [];
	for (let i = keep.length; i < ROWS; i++) {
		const p = draw(ctx, mode, ante, holk);
		if (p.kind === 'holk') holk = true;
		fresh.push(p);
	}
	return [...fresh, ...keep];
}

/** What pays on a screen right now (each paying symbol with 8 or more). */
export function winsOn(grid: Grid): Win[] {
	const cells = new Map<Sym, number[]>();
	grid.forEach((col, c) =>
		col.forEach((p, r) => {
			if (p.kind === 'holk' || p.kind === 'cloud') return;
			const list = cells.get(p.kind) ?? [];
			list.push(cellKey(c, r));
			cells.set(p.kind, list);
		})
	);
	const out: Win[] = [];
	for (const s of SYMS) {
		const list = cells.get(s);
		if (!list) continue;
		const step = payStep(list.length);
		if (step >= 0) out.push({ sym: s, count: list.length, pay: PAYS[s][step as 0 | 1 | 2], cells: list });
	}
	return out;
}

/** The screen after the winning cells go and everything falls + refills. */
function tumble(ctx: Ctx, grid: Grid, gone: Set<number>, mode: Mode, ante: boolean): Grid {
	return grid.map((col, c) =>
		refill(
			ctx,
			col.filter((_, r) => !gone.has(cellKey(c, r))),
			mode,
			ante
		)
	);
}

export const countKind = (grid: Grid, kind: Kind) => grid.reduce((n, col) => n + col.filter((p) => p.kind === kind).length, 0);
export const cloudSum = (grid: Grid) => grid.reduce((n, col) => n + col.reduce((m, p) => m + (p.kind === 'cloud' ? (p.x ?? 0) : 0), 0), 0);
/** The screen a spin ends on. */
export const finalGrid = (s: StashSpin): Grid => (s.steps.length ? s.steps[s.steps.length - 1].grid : s.start);

/** One spin: a fresh screen, then tumble until nothing wins. */
export function runSpin(ctx: Ctx, mode: Mode, ante = false): StashSpin {
	let grid: Grid = Array.from({ length: COLS }, () => refill(ctx, [], mode, ante));
	const start = grid;
	const steps: Step[] = [];
	let raw = 0;
	for (let guard = 0; guard < 60; guard++) {
		const wins = winsOn(grid);
		if (!wins.length) break;
		const gone = wins.flatMap((w) => w.cells).sort((a, b) => a - b);
		raw += wins.reduce((n, w) => n + w.pay, 0);
		grid = tumble(ctx, grid, new Set(gone), mode, ante);
		steps.push({ wins, gone, grid });
	}
	const clouds = cloudSum(grid);
	const mult = raw > 0 && clouds > 0 ? clouds : 1;
	const holks = countKind(grid, 'holk');
	const holkPay = mode === 'base' ? (HOLK_PAYS[Math.min(holks, 6)] ?? 0) * 100 : 0;
	const more = mode === 'base' ? (holks >= HOLKS_TO_START ? FREE_SPINS : 0) : holks >= HOLKS_TO_RETRIGGER ? RETRIGGER : 0;
	return { mode, start, steps, raw, clouds, mult, holks, holkPay, pay: raw * mult + holkPay, more };
}

/** Sky High Spins: `n` to start with, more on a retrigger (at most FREE_MAX). */
function freeRun(ctx: Ctx, n: number, mode: 'free' | 'super'): StashSpin[] {
	const out: StashSpin[] = [];
	let left = n;
	let total = n;
	while (left > 0) {
		left -= 1;
		const s = runSpin(ctx, mode);
		const add = Math.min(s.more, FREE_MAX - total);
		s.more = add;
		left += add;
		total += add;
		out.push(s);
	}
	return out;
}

function finish(kind: StashPlay['kind'], bet: number, cost: number, ante: boolean, base: StashSpin | null, bonus: StashPlay['bonus'], free: StashSpin[]): StashPlay {
	const cents = (base?.pay ?? 0) + free.reduce((n, s) => n + s.pay, 0);
	const all = (cents * bet) / 100;
	const win = Math.min(Math.round(all), MAX_WIN * bet);
	return { kind, bet, cost, ante, base, bonus, free, win, net: win - cost, ...(all > MAX_WIN * bet ? { capped: true as const } : {}) };
}

/** One paid spin (with Double chance if `ante`) and the Sky High Spins it starts, all worked out at once. */
export function play(bet: number, rand: () => number, ante = false): StashPlay {
	const ctx: Ctx = { rand, id: 1 };
	const base = runSpin(ctx, 'base', ante);
	const free = base.more ? freeRun(ctx, base.more, 'free') : [];
	return finish('spin', bet, ante ? anteCost(bet) : bet, ante, base, base.more ? 'free' : null, free);
}

/** A bought bonus at a bet. */
export function buy(kind: StashBuy, bet: number, rand: () => number): StashPlay {
	const ctx: Ctx = { rand, id: 1 };
	return finish(kind, bet, BUY_PRICE[kind] * bet, false, null, kind, freeRun(ctx, FREE_SPINS, kind));
}

export type WinTier = 'none' | 'win' | 'big' | 'mega' | 'epic';
/** How big a win reads: epic ("SKY HIGH") ≥ 100× what was paid, mega ≥ 25×, big ≥ 10×. */
export function winTier(p: StashPlay): WinTier {
	if (p.win >= p.cost * 100) return 'epic';
	if (p.win >= p.cost * 25) return 'mega';
	if (p.win >= p.cost * 10) return 'big';
	return p.win > 0 ? 'win' : 'none';
}

/** Hundredths of the bet → burgers (not rounded: the play rounds once at the end). */
export const burgersOf = (cents: number, bet: number) => (cents * bet) / 100;
