/**
 * Abscar's Fortune II: Munchie Squad, BurgiCasino's second slot (2026-11-19, the user's ask: "build a new
 * Abscar's Fortune but like Pirots 5, with our own symbols; you know the theme, come up with crazy bonuses
 * and free spins like the Pirots games"). Same kind of game as ELK's collector slots (a grid, characters
 * that walk around collecting their own colour, features that upgrade, swap and blow things up, free spins
 * where everything carries over, a coin game), but every symbol, rule detail and name here is our own:
 *
 *  - THE BOARD: an 8 × 8 frame; a 6 × 6 field is open at the start, the ring around it is walled off.
 *  - THE MUNCHIE SQUAD: four collectors, each a squad operator with their own munchie: Phillestar
 *    (burgers, red), Drängen Lars Åke (beer, amber), Da Jeeven (energy drinks, blue) and Ingman (purple
 *    buds). Each stands on a cell; one at a time they walk to a neighbouring cell (up, down, left, right)
 *    that holds their own munchie, a WILD or a feature, take it and go on until nothing next to them is
 *    theirs. Then everything falls down into the holes (the squad stays put, things fall past them), new
 *    munchies drop in from the top, and they walk again, until nobody can move. That ends the spin.
 *  - LEVELS: a munchie pays by its colour's level (1–7, LEVEL_PAYS). SUPERSIZE raises the level of the
 *    colour of whoever takes it.
 *  - FEATURES: WILD (counts as anybody's munchie), SUPERSIZE (+1 level), SMOKE SWAP (every munchie of
 *    another colour on the board turns into the taker's), BURGER COIN (burgers at once), FRAG (blows up
 *    the 3 × 3 round it and pays everything in it, chains into other frags, and blows a wall open: the
 *    field grows 6 × 6 → 7 × 7 → 8 × 8), the letters M-U-N-C-H (all five = THE MUNCHIES coin game) and
 *    KETCHUP (nobody can take it; 3 on the board when the spin ends = free spins).
 *  - ABSCAR'S HOLK METER: every munchie taken fills it; full = THE BIG HOLK: a giant holk smokes out the
 *    whole board and sticky WILDs land all over it. A sticky WILD holds its cell (everything falls past it,
 *    like past the squad) until somebody takes it, and in Hotbox Spins the ones nobody took stay put into
 *    the next spin.
 *  - HOTBOX SPINS (3 ketchups): 10 free spins that start from where the spin ended (field size, levels,
 *    where the squad stands) and keep everything between spins: levels only go up, the field only grows,
 *    letters and the meter carry over. SUPER HOTBOX (4+ ketchups): the same on the full 8 × 8 with every
 *    level at least 3. 3 ketchups in a free spin = +3 spins, 4+ = +5.
 *  - THE MUNCHIES: a hold-and-spin coin game on its own 6 × 6 board with the squad in the corners: burger
 *    coins land and stay, 3 respins that start over with every new coin; ×2 / ×3 coins multiply the total
 *    at the end (they add up), SQUAD coins take the value of every coin in their row and column, and a full
 *    board doubles it all.
 *  - BUY BONUS: Hotbox Spins, Super Hotbox or The Munchies at once, priced to give back about what
 *    spinning does (scripts/fortune2.test.js measures it).
 *
 * Wins are counted in hundredths of the bet ("cents") and rounded to whole burgers once per play; one play
 * pays at most MAX_WIN × the bet. Everything is worked out the moment you pay and comes back as a script
 * of events that the page plays back. Pure, the randomness passed in, so Node tests it.
 */

import { randInt } from './squad-casino.ts';

export type Crew = 'phil' | 'lars' | 'jeeven' | 'ingman';
/** The order they walk in. */
export const CREW: Crew[] = ['phil', 'lars', 'jeeven', 'ingman'];
/** The squad operator each collector is (squad-codec SquadOp), for their faces. */
export const CREW_OP = { phil: 'phillestar', lars: 'lars', jeeven: 'jeeven', ingman: 'ingman' } as const;

export type Kind = 'item' | 'wild' | 'up' | 'swap' | 'coin' | 'frag' | 'letter' | 'ketchup';
export const FEATURES: Kind[] = ['wild', 'up', 'swap', 'coin', 'frag', 'letter', 'ketchup'];
export interface Piece {
	id: number;
	kind: Kind;
	/** item: whose munchie it is */
	crew?: Crew;
	/** coin: hundredths of the bet */
	coin?: number;
	/** letter: 0–4 (M U N C H) */
	letter?: number;
	/** wild: a sticky WILD from the big holk (holds its cell, carries over between free spins) */
	sticky?: true;
}

/** A cell = row × SIDE + column on the 8 × 8 frame. */
export type Cell = number;
export const SIDE = 8;
export const cellOf = (r: number, c: number): Cell => r * SIDE + c;
export const rowOf = (cell: Cell) => Math.floor(cell / SIDE);
export const colOf = (cell: Cell) => cell % SIDE;

export interface Rect {
	r0: number;
	r1: number;
	c0: number;
	c1: number;
}
/** The open field by size step: 6 × 6 in the middle, then 7 × 7 (top row + left column), then all 8 × 8. */
export const OPEN: Rect[] = [
	{ r0: 1, r1: 6, c0: 1, c1: 6 },
	{ r0: 0, r1: 6, c0: 0, c1: 6 },
	{ r0: 0, r1: 7, c0: 0, c1: 7 }
];
export const MAX_OPEN = OPEN.length - 1;
export const isOpen = (open: number, cell: Cell) => {
	const o = OPEN[open];
	const r = rowOf(cell);
	const c = colOf(cell);
	return r >= o.r0 && r <= o.r1 && c >= o.c0 && c <= o.c1;
};
export const openCells = (open: number): Cell[] => Array.from({ length: SIDE * SIDE }, (_, i) => i).filter((i) => isOpen(open, i));
export const fieldSize = (open: number) => OPEN[open].r1 - OPEN[open].r0 + 1;

export const LEVELS = 7;
/** What one munchie pays at its colour's level 1–7, in hundredths of the bet. */
export const LEVEL_PAYS = [2, 5, 10, 16, 26, 42, 70];
export const LETTERS = ['M', 'U', 'N', 'C', 'H'];
/** Munchies taken to fill Abscar's holk meter. */
export const METER_MAX = 30;
/**
 * THE BIG HOLK (2026-11-19, the user: "make Abscar's holk a big holk over the whole screen that lands WILDs
 * everywhere, sticky WILDs"; until then a full meter dropped 3 random features next to the squad): sticky
 * WILDs on this many munchies all over the field (fewer in free spins, where they carry over).
 */
export const HOLK_WILDS = 10;
export const HOLK_WILDS_FREE = 6;

/** Burger coins on the board: [hundredths of the bet, how often]. */
export const COIN_VALUES: [number, number][] = [
	[10, 38],
	[20, 30],
	[50, 17],
	[100, 10],
	[250, 4],
	[500, 1]
];

/** What a new cell holds: [kind, weight] (items are split evenly over the four colours). */
type Table = [Kind, number][];
/**
 * A spin's first drop and what falls in later have their own tables: ketchup comes almost only with the
 * first drop, so a long chain of falls doesn't pile them up (the free-spin odds stay the same however long
 * a spin runs).
 */
export interface Tables {
	fill: Table;
	fall: Table;
}
const table = (ketchup: number, f: Partial<Record<Kind, number>>): Table => [
	['item', 100],
	['wild', f.wild ?? 0],
	['up', f.up ?? 0],
	['swap', f.swap ?? 0],
	['coin', f.coin ?? 0],
	['frag', f.frag ?? 0],
	['letter', f.letter ?? 0],
	['ketchup', ketchup]
];
/*
 * PARTY ODDS (2026-11-19, the user, after a first raise to ≈ 99 %: "more wilds, more free spins, bonus
 * symbols, more wins, double them, everyone should win, more random sticky wilds, as if the money was free",
 * then "the jackpot more often, full screens of the same symbol, lots of crazy stuff, not like normal boring
 * slots"): every pay doubled (levels, coins, coin game), far more WILDs, features, letters and ketchup,
 * Abscar drops WILDs next to the squad on every free spin (and now and then in a normal one), and a MUNCHIE
 * STORM now and then turns every munchie on the board into one squad member's. It gives back far more than
 * it takes on purpose (pretend burgers); fortune2-sim.mjs has the numbers.
 *
 * NORMAL ODDS AGAIN (2026-11-20, the user: "gör så att abscars fortune och mybots 5 får vanliga odds igen, så
 * att jag styr all odds, tur osv genom admin panelen"): the pays, features, ketchup, retriggers, coin game and
 * Hotbox cap are back at the values from before the party odds; the storm and Abscar's WILD drops stay but
 * rarely (STORM_CHANCE, BASE_WILD_CHANCE; no WILD drop on every free spin), the big holk drops 6 sticky WILDs in
 * free spins (was 8), the Hotbox multiplier stops at ×8 (MULT_MAX; ×15 ran away with the big holk) and the buys are
 * priced for ≈ 96 %. Simulated (fortune2-sim.mjs): RTP ≈ 99 %, Hotbox ≈ 1 in 150 worth ≈ 53× the bet. Abscar's control room (casino-rig.ts) does the rest.
 */
const BASE_FEATURES = { wild: 2.2, up: 2.2, swap: 0.7, coin: 1.35, frag: 1.0, letter: 4.2 };
const FREE_FEATURES = { wild: 2.0, up: 1.5, swap: 0.8, coin: 1.2, frag: 1.0, letter: 1.4 };
export const BASE_TABLES: Tables = { fill: table(1.38, BASE_FEATURES), fall: table(0.05, BASE_FEATURES) };
export const FREE_TABLES: Tables = { fill: table(1.23, FREE_FEATURES), fall: table(0.05, FREE_FEATURES) };
/** MUNCHIE STORM: chance per spin (normal and free) that every munchie turns into one squad member's. */
export const STORM_CHANCE = 1 / 600;
/** Abscar's WILD drop: WILDs next to the squad on every free spin; in a normal spin now and then. */
export const FREE_WILD_DROPS = 0;
export const BASE_WILD_CHANCE = 0.03;
export const BASE_WILD_DROPS = 1;

export const FREE_SPINS = 10;
/** Ketchups in a free spin → more spins. */
export const RETRIGGER: [number, number][] = [
	[4, 5],
	[3, 3]
];
export const FREE_MAX = 60;
export const SUPER_LEVEL = 3;
/**
 * The Hotbox multiplier: free spins start at ×1 (Super ×2), and every time Abscar's holk meter fills there
 * (it carries over between free spins) the room gets smokier: +1, up to MULT_MAX. Every burger taken in
 * free spins is multiplied by it (the coin game isn't).
 */
export const SUPER_MULT = 2;
export const MULT_MAX = 8;
/** Safety nets: walking rounds per spin, steps per walk. */
const MAX_ROUNDS = 120;
const MAX_STEPS = 64;

/* ---------- The Munchies (coin game) ---------- */

export const MUNCH_SIDE = 6;
/** The squad stands in the corners of the coin board. */
export const MUNCH_CORNERS = [0, 5, 30, 35];
export const MUNCH_CELLS = Array.from({ length: 36 }, (_, i) => i).filter((i) => !MUNCH_CORNERS.includes(i));
export const MUNCH_START = 5;
export const MUNCH_RESPINS = 3;
/** Chance per empty cell per respin that a coin lands there. */
export const MUNCH_CHANCE = 0.04;
export const MUNCH_CASH: [number, number][] = [
	[12, 34],
	[25, 30],
	[50, 18],
	[120, 11],
	[280, 5],
	[600, 1.5],
	[1500, 0.5]
];
/** What kind a landing coin is: [kind, weight]. */
const MUNCH_KINDS: ['cash' | 'mult' | 'squad', number][] = [
	['cash', 86],
	['mult', 6],
	['squad', 8]
];
/** A multiplier coin's ×: [×, how often]. */
const MUNCH_MULTS: [number, number][] = [
	[2, 75],
	[3, 25]
];
export const MUNCH_FULL_MULT = 2;

export interface MunchCoin {
	kind: 'cash' | 'mult' | 'squad';
	/** cash / squad: hundredths of the bet; mult: the × */
	value: number;
	/** squad coins wear a squad member's face */
	crew?: Crew;
}
export interface MunchRound {
	/** coins that landed this round (cell 0–35, coin) */
	add: [number, MunchCoin][];
	/** respins left after it */
	left: number;
}
export interface Munchies {
	rounds: MunchRound[];
	/** cash + squad coins, hundredths of the bet */
	cash: number;
	/** the total multiplier (1 = none) */
	mult: number;
	full: boolean;
	/** what it pays, hundredths of the bet */
	pay: number;
}

/* ---------- events (what the page plays back) ---------- */

export type Ev =
	/** new pieces drop into these cells (a whole board at the start of a spin) */
	| { t: 'fill'; add: [Piece, Cell][] }
	/** a collector walks onto a cell and takes what's there (pay: hundredths of the bet, 0 for features) */
	| { t: 'walk'; who: Crew; to: Cell; took: Piece; pay: number }
	| { t: 'level'; who: Crew; level: number }
	/** every munchie of `from` turns into `who`'s */
	/** storm: a MUNCHIE STORM turned every munchie on the board (from = who then) */
	| { t: 'swap'; who: Crew; from: Crew; ids: number[]; storm?: true }
	/** a frag goes off: what it took (pay per piece, hundredths of the bet) */
	| { t: 'boom'; at: Cell; who: Crew; took: { piece: Piece; pay: number }[] }
	| { t: 'grow'; open: number }
	| { t: 'letter'; i: number }
	| { t: 'meter'; n: number }
	/** free spins: the Hotbox multiplier went up */
	| { t: 'mult'; mult: number }
	/** Abscar drops pieces next to the squad: they replace these pieces */
	| { t: 'drop'; add: [Piece, Cell][]; gone: number[] }
	/** THE BIG HOLK: Abscar's holk meter is full; sticky WILDs replace these munchies all over the board */
	| { t: 'holk'; add: [Piece, Cell][]; gone: number[] }
	/** everything falls: pieces that moved, and new ones from the top */
	| { t: 'fall'; moves: [number, Cell][]; add: [Piece, Cell][] }
	/** the squad goes to its places for a new spin */
	| { t: 'place'; crew: Record<Crew, Cell> };

export interface SpinStart {
	/** the Hotbox multiplier (1 outside free spins) */
	mult: number;
	open: number;
	levels: Record<Crew, number>;
	crew: Record<Crew, Cell>;
	letters: boolean[];
	meter: number;
}

export interface F2Spin {
	start: SpinStart;
	events: Ev[];
	/** burgers this spin's collecting paid, hundredths of the bet (the coin game not counted) */
	pay: number;
	/** ketchups on the board when it ended */
	ketchups: number;
	/** after the spin */
	end: SpinStart;
	/** all five letters → the coin game, played right after */
	munchies?: Munchies;
	/** free spins only: spins it added */
	more?: number;
	/** the board when it ended (cell → piece) */
	board: (Piece | null)[];
}

export type F2Buy = 'hotbox' | 'super' | 'munchies';
export const BUY_KINDS: F2Buy[] = ['hotbox', 'super', 'munchies'];
/** What a bought feature costs, × the bet. */
export const BUY_PRICE: Record<F2Buy, number> = { hotbox: 47, super: 173, munchies: 26 };
export type Bonus = 'hotbox' | 'super';

export interface F2Play {
	kind: 'spin' | F2Buy;
	bet: number;
	cost: number;
	/** the paid spin (null when a feature was bought) */
	base: F2Spin | null;
	/** a bought coin game */
	munchies: Munchies | null;
	/** free spins it started */
	bonus: Bonus | null;
	freeStart: number;
	free: F2Spin[];
	/** burgers won (capped) */
	win: number;
	net: number;
	capped?: true;
}

/**
 * Bets on offer. Up to 500 at launch; on 2026-11-19 the user asked to be able to bet higher, like on the first
 * Abscar's Fortune: now up to 10,000. The odds don't depend on the bet.
 */
export const F2_BETS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
/** The most one play pays: × the bet. */
export const MAX_WIN = 10_000;

/* ---------- the machinery ---------- */

interface Ctx {
	rand: () => number;
	id: number;
}

function weighted<T>(table: [T, number][], rand: () => number): T {
	let roll = rand() * table.reduce((n, [, w]) => n + w, 0);
	for (const [value, w] of table) if ((roll -= w) < 0) return value;
	return table[table.length - 1][0];
}

function makePiece(ctx: Ctx, kind: Kind): Piece {
	const p: Piece = { id: ctx.id++, kind };
	if (kind === 'item') p.crew = CREW[randInt(CREW.length, ctx.rand)];
	if (kind === 'coin') p.coin = weighted(COIN_VALUES, ctx.rand);
	if (kind === 'letter') p.letter = randInt(LETTERS.length, ctx.rand);
	return p;
}
const drawPiece = (ctx: Ctx, table: Table) => makePiece(ctx, weighted(table, ctx.rand));

interface State {
	/** free spins: the Hotbox multiplier grows */
	free: boolean;
	mult: number;
	open: number;
	levels: Record<Crew, number>;
	crew: Record<Crew, Cell>;
	letters: boolean[];
	meter: number;
	grid: (Piece | null)[];
}

const snap = (st: State): SpinStart => ({ mult: st.mult, open: st.open, levels: { ...st.levels }, crew: { ...st.crew }, letters: [...st.letters], meter: st.meter });
const crewAt = (st: Pick<State, 'crew'>, cell: Cell) => CREW.some((w) => st.crew[w] === cell);
const levelPay = (level: number) => LEVEL_PAYS[Math.min(Math.max(level, 1), LEVELS) - 1];

function neighbours(open: number, cell: Cell): Cell[] {
	const r = rowOf(cell);
	const c = colOf(cell);
	const out: Cell[] = [];
	for (const [dr, dc] of [
		[-1, 0],
		[0, 1],
		[1, 0],
		[0, -1]
	]) {
		const nr = r + dr;
		const nc = c + dc;
		if (nr < 0 || nc < 0 || nr >= SIDE || nc >= SIDE) continue;
		const n = cellOf(nr, nc);
		if (isOpen(open, n)) out.push(n);
	}
	return out;
}

/** Can `who` walk onto this cell: a feature, a WILD or their own munchie, nobody standing there. */
function walkable(st: Pick<State, 'open' | 'crew' | 'grid'>, who: Crew, cell: Cell): boolean {
	if (crewAt(st, cell)) return false;
	const p = st.grid[cell];
	if (!p || p.kind === 'ketchup') return false;
	return p.kind !== 'item' || p.crew === who;
}

/** How many pieces `who` could go on to take from `from`: the patch of walkable cells joined to it (the cell they leave is empty by then). */
function patch(st: Pick<State, 'open' | 'crew' | 'grid'>, who: Crew, from: Cell): number {
	const leaving = st.crew[who];
	const seen = new Set<Cell>([leaving, from]);
	const todo = [from];
	while (todo.length) {
		const cell = todo.pop()!;
		for (const n of neighbours(st.open, cell))
			if (!seen.has(n) && walkable(st, who, n)) {
				seen.add(n);
				todo.push(n);
			}
	}
	return seen.size - 1;
}

/**
 * Where a collector goes next; −1 = stuck. SMARTER SQUAD (2026-11-19, the user: "make the squad smarter, so
 * they go more where they get more symbols"): they look ahead and step towards the biggest patch of things
 * they can take (their own munchies, WILDs and features joined together), so nobody walks into a one-piece
 * dead end with a big pile on the other side. Between equal patches: features first, then their own munchies,
 * then WILDs, then at random. (Until then: features, own munchies, WILDs next door, at random.) Exported for
 * the tests.
 */
export function nextStep(st: Pick<State, 'open' | 'crew' | 'grid'>, who: Crew, rand: () => number): Cell {
	let best: Cell[] = [];
	let bestScore = -1;
	for (const n of neighbours(st.open, st.crew[who])) {
		if (!walkable(st, who, n)) continue;
		const p = st.grid[n]!;
		const score = patch(st, who, n) * 4 + (p.kind === 'item' ? 2 : p.kind === 'wild' ? 1 : 3);
		if (score > bestScore) {
			bestScore = score;
			best = [n];
		} else if (score === bestScore) best.push(n);
	}
	return best.length ? best[randInt(best.length, rand)] : -1;
}

/** Random free cells for the squad. */
function placeCrew(st: State, rand: () => number): Record<Crew, Cell> {
	const cells = openCells(st.open);
	const out = {} as Record<Crew, Cell>;
	for (const w of CREW) {
		const i = randInt(cells.length, rand);
		out[w] = cells[i];
		cells.splice(i, 1);
	}
	return out;
}

/** Everything falls down past the squad and the sticky WILDs; new pieces fill the empty cells from the top. */
function fall(ctx: Ctx, st: State, table: Table): Ev {
	const moves: [number, Cell][] = [];
	const add: [Piece, Cell][] = [];
	const o = OPEN[st.open];
	const held = (cell: Cell) => crewAt(st, cell) || !!st.grid[cell]?.sticky;
	for (let c = o.c0; c <= o.c1; c++) {
		const cells: Cell[] = [];
		for (let r = o.r1; r >= o.r0; r--) if (!held(cellOf(r, c))) cells.push(cellOf(r, c));
		const pieces = cells.map((cell) => st.grid[cell]).filter((p): p is Piece => !!p);
		cells.forEach((cell, i) => {
			const p = pieces[i] ?? null;
			if (p && st.grid[cell] !== p) moves.push([p.id, cell]);
			st.grid[cell] = p;
		});
		for (let i = pieces.length; i < cells.length; i++) {
			const p = drawPiece(ctx, table);
			st.grid[cells[i]] = p;
			add.push([{ ...p }, cells[i]]);
		}
	}
	return { t: 'fall', moves, add };
}

/** One spin: fill the board, walk / take / fall until nobody can move. */
function runSpin(ctx: Ctx, st: State, tables: Tables, place: boolean): F2Spin {
	const events: Ev[] = [];
	if (place) {
		st.crew = placeCrew(st, ctx.rand);
		events.push({ t: 'place', crew: { ...st.crew } });
	}
	const start = snap(st);
	// sticky WILDs nobody took stay where they are (free spins carry the board over); the rest is new
	const before = st.grid;
	st.grid = Array(SIDE * SIDE).fill(null);
	const fill: [Piece, Cell][] = [];
	for (const cell of openCells(st.open)) {
		if (crewAt(st, cell)) continue;
		const kept = before[cell];
		const p = kept?.sticky ? kept : drawPiece(ctx, tables.fill);
		st.grid[cell] = p;
		fill.push([{ ...p }, cell]);
	}
	events.push({ t: 'fill', add: fill });
	let pay = 0;

	/** Abscar drops pieces next to the squad (on munchies), else anywhere on munchies. */
	const abscarDrops = (kinds: Kind[]) => {
		const near = new Set(CREW.flatMap((w) => neighbours(st.open, st.crew[w])));
		const spots = (pool: Cell[]) => pool.filter((cell) => st.grid[cell]?.kind === 'item');
		const add: [Piece, Cell][] = [];
		const gone: number[] = [];
		for (const kind of kinds) {
			let pool = spots([...near]);
			if (!pool.length) pool = spots(openCells(st.open));
			if (!pool.length) break;
			const cell = pool[randInt(pool.length, ctx.rand)];
			gone.push(st.grid[cell]!.id);
			const p = makePiece(ctx, kind);
			st.grid[cell] = p;
			add.push([{ ...p }, cell]);
		}
		if (add.length) events.push({ t: 'drop', add, gone });
	};

	// MUNCHIE STORM: now and then every munchie on the board turns into one squad member's
	if (ctx.rand() < STORM_CHANCE) {
		const who = CREW[randInt(CREW.length, ctx.rand)];
		const ids: number[] = [];
		for (const q of st.grid)
			if (q?.kind === 'item' && q.crew !== who) {
				q.crew = who;
				ids.push(q.id);
			}
		if (ids.length) events.push({ t: 'swap', who, from: who, ids, storm: true });
	}
	// Abscar's WILD drop: on every free spin, now and then in a normal one
	const wilds = st.free ? FREE_WILD_DROPS : ctx.rand() < BASE_WILD_CHANCE ? BASE_WILD_DROPS : 0;
	if (wilds) abscarDrops(Array<Kind>(wilds).fill('wild'));

	/** THE BIG HOLK: sticky WILDs replace munchies all over the field. */
	const bigHolk = () => {
		const pool = openCells(st.open).filter((cell) => st.grid[cell]?.kind === 'item');
		const add: [Piece, Cell][] = [];
		const gone: number[] = [];
		for (let i = st.free ? HOLK_WILDS_FREE : HOLK_WILDS; i > 0 && pool.length; i--) {
			const cell = pool.splice(randInt(pool.length, ctx.rand), 1)[0];
			gone.push(st.grid[cell]!.id);
			const p: Piece = { id: ctx.id++, kind: 'wild', sticky: true };
			st.grid[cell] = p;
			add.push([{ ...p }, cell]);
		}
		events.push({ t: 'holk', add, gone });
	};

	const meterUp = (n: number) => {
		if (!n) return;
		st.meter += n;
		events.push({ t: 'meter', n: Math.min(st.meter, METER_MAX) });
		while (st.meter >= METER_MAX) {
			st.meter -= METER_MAX;
			bigHolk();
			events.push({ t: 'meter', n: st.meter });
			if (st.free && st.mult < MULT_MAX) {
				st.mult += 1;
				events.push({ t: 'mult', mult: st.mult });
			}
		}
	};

	/** What taking a piece pays and does (the taker is `who`; `at` = where it was). */
	const take = (who: Crew, p: Piece, at: Cell, frags: Cell[]): number => {
		if (p.kind === 'item') return levelPay(st.levels[p.crew!]);
		if (p.kind === 'wild') return levelPay(st.levels[who]);
		if (p.kind === 'coin') return p.coin ?? 0;
		if (p.kind === 'up') {
			if (st.levels[who] < LEVELS) {
				st.levels[who] += 1;
				events.push({ t: 'level', who, level: st.levels[who] });
			}
		} else if (p.kind === 'swap') {
			const others = CREW.filter((w) => w !== who && st.grid.some((q) => q?.kind === 'item' && q.crew === w));
			if (others.length) {
				const from = others[randInt(others.length, ctx.rand)];
				const ids: number[] = [];
				for (const q of st.grid)
					if (q?.kind === 'item' && q.crew === from) {
						q.crew = who;
						ids.push(q.id);
					}
				events.push({ t: 'swap', who, from, ids });
			}
		} else if (p.kind === 'letter') {
			const i = p.letter ?? 0;
			if (!st.letters[i]) {
				st.letters[i] = true;
				events.push({ t: 'letter', i });
			}
		} else if (p.kind === 'frag') frags.push(at);
		return 0;
	};

	/** Frags go off one after another (a frag in a blast goes off too); each blows a wall open. */
	const blasts = (who: Crew, frags: Cell[]) => {
		while (frags.length) {
			const at = frags.shift()!;
			const r = rowOf(at);
			const c = colOf(at);
			const took: { piece: Piece; pay: number }[] = [];
			let munched = 0;
			for (let dr = -1; dr <= 1; dr++)
				for (let dc = -1; dc <= 1; dc++) {
					const nr = r + dr;
					const nc = c + dc;
					if (nr < 0 || nc < 0 || nr >= SIDE || nc >= SIDE) continue;
					const cell = cellOf(nr, nc);
					const p = st.grid[cell];
					if (!isOpen(st.open, cell) || crewAt(st, cell) || !p || p.kind === 'ketchup') continue;
					st.grid[cell] = null;
					const got = take(who, p, cell, frags) * st.mult;
					if (p.kind === 'item' || p.kind === 'wild') munched++;
					took.push({ piece: { ...p }, pay: got });
					pay += got;
				}
			events.push({ t: 'boom', at, who, took });
			if (st.open < MAX_OPEN) {
				st.open += 1;
				events.push({ t: 'grow', open: st.open });
			}
			meterUp(munched);
		}
	};

	for (let round = 0; round < MAX_ROUNDS; round++) {
		let moved = false;
		for (const who of CREW) {
			for (let step = 0; step < MAX_STEPS; step++) {
				const to = nextStep(st, who, ctx.rand);
				if (to < 0) break;
				moved = true;
				const p = st.grid[to]!;
				st.grid[to] = null;
				st.crew[who] = to;
				const frags: Cell[] = [];
				// the walk event first, so the page shows the step before what the piece does
				const ev = { t: 'walk' as const, who, to, took: { ...p }, pay: 0 };
				events.push(ev);
				const got = take(who, p, to, frags) * st.mult;
				ev.pay = got;
				pay += got;
				if (frags.length) blasts(who, frags);
				meterUp(p.kind === 'item' || p.kind === 'wild' ? 1 : 0);
			}
		}
		if (!moved) break;
		events.push(fall(ctx, st, tables.fall));
	}
	const ketchups = st.grid.filter((p) => p?.kind === 'ketchup').length;
	return { start, events, pay, ketchups, end: snap(st), board: st.grid.map((p) => (p ? { ...p } : null)) };
}

/* ---------- The Munchies ---------- */

const munchRow = (cell: number) => Math.floor(cell / MUNCH_SIDE);
const munchCol = (cell: number) => cell % MUNCH_SIDE;

function munchCoin(rand: () => number): MunchCoin {
	const kind = weighted(MUNCH_KINDS, rand);
	if (kind === 'mult') return { kind, value: weighted(MUNCH_MULTS, rand) };
	if (kind === 'squad') return { kind, value: 0, crew: CREW[randInt(CREW.length, rand)] };
	return { kind, value: weighted(MUNCH_CASH, rand) };
}

/** The coin game, worked out: coins land and stay, 3 respins that start over with every new coin. */
export function munchies(rand: () => number): Munchies {
	const board = new Map<number, MunchCoin>();
	const rounds: MunchRound[] = [];
	const land = (cell: number, coin: MunchCoin) => {
		if (coin.kind === 'squad') {
			// a SQUAD coin takes the value of every coin in its row and column (they keep theirs)
			let sum = 0;
			for (const [at, other] of board) if (other.kind !== 'mult' && (munchRow(at) === munchRow(cell) || munchCol(at) === munchCol(cell))) sum += other.value;
			coin.value = sum;
		}
		board.set(cell, coin);
	};
	// the start: a few burger coins
	const first: [number, MunchCoin][] = [];
	const free = [...MUNCH_CELLS];
	for (let i = 0; i < MUNCH_START; i++) {
		const cell = free.splice(randInt(free.length, rand), 1)[0];
		const coin: MunchCoin = { kind: 'cash', value: weighted(MUNCH_CASH, rand) };
		land(cell, coin);
		first.push([cell, coin]);
	}
	let left = MUNCH_RESPINS;
	rounds.push({ add: first, left });
	while (left > 0 && board.size < MUNCH_CELLS.length) {
		const add: [number, MunchCoin][] = [];
		for (const cell of MUNCH_CELLS) {
			if (board.has(cell) || rand() >= MUNCH_CHANCE) continue;
			const coin = munchCoin(rand);
			land(cell, coin);
			add.push([cell, coin]);
		}
		left = add.length ? MUNCH_RESPINS : left - 1;
		if (board.size >= MUNCH_CELLS.length) left = 0;
		rounds.push({ add, left });
	}
	let cash = 0;
	let mult = 0;
	for (const coin of board.values()) if (coin.kind === 'mult') mult += coin.value;
	else cash += coin.value;
	const full = board.size >= MUNCH_CELLS.length;
	const total = Math.max(1, mult) * (full ? MUNCH_FULL_MULT : 1);
	return { rounds, cash, mult: total, full, pay: cash * total };
}

/* ---------- plays ---------- */

function newState(rand: () => number, open = 0, level = 1): State {
	const st: State = {
		free: false,
		mult: 1,
		open,
		levels: { phil: level, lars: level, jeeven: level, ingman: level },
		crew: { phil: 0, lars: 0, jeeven: 0, ingman: 0 },
		letters: LETTERS.map(() => false),
		meter: 0,
		grid: Array(SIDE * SIDE).fill(null)
	};
	st.crew = placeCrew(st, rand);
	return st;
}

/** Free spins from a state: everything carries over between spins. */
function freeRun(ctx: Ctx, st: State, start: number): F2Spin[] {
	const out: F2Spin[] = [];
	let left = start;
	let total = start;
	while (left > 0 && out.length < FREE_MAX) {
		const s = runSpin(ctx, st, FREE_TABLES, false);
		if (st.letters.every(Boolean)) {
			s.munchies = munchies(ctx.rand);
			st.letters = LETTERS.map(() => false);
			s.end = snap(st);
		}
		const more = Math.min(RETRIGGER.find(([n]) => s.ketchups >= n)?.[1] ?? 0, FREE_MAX - total);
		if (more > 0) {
			s.more = more;
			total += more;
			left += more;
		}
		left -= 1;
		out.push(s);
	}
	return out;
}

/** What a spin is worth in hundredths of the bet, with its coin game. */
export const spinPay = (s: F2Spin) => s.pay + (s.munchies?.pay ?? 0);

function finish(kind: F2Play['kind'], bet: number, cost: number, base: F2Spin | null, munch: Munchies | null, bonus: Bonus | null, free: F2Spin[]): F2Play {
	const cents = (base ? spinPay(base) : 0) + (munch?.pay ?? 0) + free.reduce((n, s) => n + spinPay(s), 0);
	const all = (cents * bet) / 100;
	const win = Math.min(Math.round(all), MAX_WIN * bet);
	return { kind, bet, cost, base, munchies: munch, bonus, freeStart: bonus ? FREE_SPINS : 0, free, win, net: win - cost, ...(all > MAX_WIN * bet ? { capped: true as const } : {}) };
}

/** A free-spins state as a bonus starts it (a Super Hotbox opens the whole board and lifts every level to 3). */
function bonusState(st: State, bonus: Bonus): State {
	const next: State = { ...st, free: true, mult: 1, levels: { ...st.levels }, crew: { ...st.crew }, letters: [...st.letters], meter: 0 };
	if (bonus === 'super') {
		next.mult = SUPER_MULT;
		next.open = MAX_OPEN;
		for (const w of CREW) next.levels[w] = Math.max(next.levels[w], SUPER_LEVEL);
	}
	return next;
}

/** One paid spin with its coin game and free spins, all worked out at once (closing the page changes nothing). */
export function play(bet: number, rand: () => number): F2Play {
	const ctx: Ctx = { rand, id: 1 };
	const st = newState(rand);
	const base = runSpin(ctx, st, BASE_TABLES, true);
	if (st.letters.every(Boolean)) base.munchies = munchies(rand);
	const bonus: Bonus | null = base.ketchups >= 4 ? 'super' : base.ketchups >= 3 ? 'hotbox' : null;
	const free = bonus ? freeRun(ctx, bonusState({ ...st, letters: LETTERS.map(() => false) }, bonus), FREE_SPINS) : [];
	return finish('spin', bet, bet, base, null, bonus, free);
}

/** A bought feature at a bet, worked out at once like a spin. */
export function buy(kind: F2Buy, bet: number, rand: () => number): F2Play {
	const cost = BUY_PRICE[kind] * bet;
	if (kind === 'munchies') return finish(kind, bet, cost, null, munchies(rand), null, []);
	const ctx: Ctx = { rand, id: 1 };
	const st = bonusState(newState(rand), kind);
	if (kind === 'super') st.crew = placeCrew(st, rand);
	return finish(kind, bet, cost, null, null, kind, freeRun(ctx, st, FREE_SPINS));
}

export type WinTier = 'none' | 'win' | 'big' | 'mega' | 'epic';
/** How big a win reads: epic ≥ 100× what was paid, mega ≥ 25×, big ≥ 10×. */
export function winTier(p: F2Play): WinTier {
	if (p.win >= p.cost * 100) return 'epic';
	if (p.win >= p.cost * 25) return 'mega';
	if (p.win >= p.cost * 10) return 'big';
	return p.win > 0 ? 'win' : 'none';
}

/* ---------- playing it back (the page and the tests share this) ---------- */

/** What the machine shows while a spin plays back. */
export interface View extends SpinStart {
	grid: (Piece | null)[];
	/** hundredths of the bet taken so far this spin */
	pay: number;
}

/** A spin's starting view: its start state on an empty board. */
export const startView = (s: F2Spin): View => ({ ...s.start, levels: { ...s.start.levels }, crew: { ...s.start.crew }, letters: [...s.start.letters], grid: Array(SIDE * SIDE).fill(null), pay: 0 });

/** One event applied to a view (changes it in place). */
export function applyEvent(v: View, ev: Ev): void {
	const where = (id: number) => v.grid.findIndex((p) => p?.id === id);
	switch (ev.t) {
		case 'place':
			v.crew = { ...ev.crew };
			break;
		case 'fill':
		case 'drop':
		case 'holk':
			for (const [p, cell] of ev.add) v.grid[cell] = { ...p };
			break;
		case 'walk':
			v.grid[ev.to] = null;
			v.crew[ev.who] = ev.to;
			v.pay += ev.pay;
			break;
		case 'level':
			v.levels[ev.who] = ev.level;
			break;
		case 'swap':
			for (const id of ev.ids) {
				const at = where(id);
				if (at >= 0) v.grid[at] = { ...v.grid[at]!, crew: ev.who };
			}
			break;
		case 'boom':
			for (const { piece, pay } of ev.took) {
				const at = where(piece.id);
				if (at >= 0) v.grid[at] = null;
				v.pay += pay;
			}
			break;
		case 'grow':
			v.open = ev.open;
			break;
		case 'letter':
			v.letters[ev.i] = true;
			break;
		case 'meter':
			v.meter = ev.n;
			break;
		case 'mult':
			v.mult = ev.mult;
			break;
		case 'fall': {
			// all at once: lift every moving piece, then set them down
			const lifted = ev.moves.map(([id, cell]) => {
				const at = where(id);
				const p = at >= 0 ? v.grid[at] : null;
				if (at >= 0) v.grid[at] = null;
				return [p, cell] as const;
			});
			for (const [p, cell] of lifted) if (p) v.grid[cell] = p;
			for (const [p, cell] of ev.add) v.grid[cell] = { ...p };
			break;
		}
	}
}

/** Burgers for an amount in hundredths of the bet. */
export const burgersOf = (cents: number, bet: number) => (cents * bet) / 100;
