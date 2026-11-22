/**
 * Munchie Snake (BurgiArcade, 2026-11-22): the rules on a 17 × 17 grid, without any drawing. The head is a
 * little weed-leaf stoner, the body a trail of smoke that grows as it eats munchies. Now and then a golden
 * burger shows up for a few seconds; from the 10th munchie on, traffic cones appear. The pace goes up every
 * 5 munchies. A wall, a cone or your own smoke ends the run.
 *
 * Same seed = same game: munchies, golden burgers and cones each come from their own random stream with a
 * fixed number of draws per item, and a spot that's taken is replaced by scanning the grid in a fixed order
 * (no extra draws), so the n-th munchie is the same kind at the same spot for everyone whenever it's free.
 * Pure: no DOM, so Node tests it (scripts/arcade-snake.test.js).
 */
import { rng } from '#lib/arcade/rng.ts';

export const GRID = 17;
export const CELLS = GRID * GRID;
export type Dir = 'up' | 'down' | 'left' | 'right';
export const DIRS: Record<Dir, readonly [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };
export const MUNCHIES = ['burger', 'fries', 'donut', 'pizza', 'taco'] as const;
export type Munchie = (typeof MUNCHIES)[number];
export interface Cell {
	x: number;
	y: number;
}
export type Death = 'wall' | 'cone' | 'self';

/** The snake starts this long (head + smoke). */
export const START_LEN = 4;
/** Smoke puffs added per munchie / per golden burger. */
export const GROW = 2;
export const GOLD_GROW = 3;
/** Points: 10 per munchie plus 2 per pace level, 50 for a golden burger. */
export const GOLD_POINTS = 50;
export const munchiePoints = (eatenBefore: number): number => 10 + 2 * Math.floor(eatenBefore / 5);
/** How long a step takes (ms): 150 at first, 11 ms faster every 5 munchies, never under 68. */
export const stepMs = (eaten: number): number => Math.max(68, 150 - 11 * Math.floor(eaten / 5));
/** The pace level shown in the game (1 = the start). */
export const paceLevel = (eaten: number): number => Math.floor(eaten / 5) + 1;
/** A golden burger stays about this long (ms of game time) before it's gone. */
export const GOLD_MS = 5200;
/** Cones: the first after this many munchies, then one more every CONE_EVERY, at most MAX_CONES. */
export const CONES_FROM = 10;
export const CONE_EVERY = 3;
export const MAX_CONES = 14;
/** Grid scan stride for a taken spot (coprime with 289, so it visits every cell once). */
const STRIDE = 7;

const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < GRID && y < GRID;

/** What one step did (the page uses it for effects and sounds). */
export interface StepEvents {
	ate?: Munchie;
	points?: number;
	gold?: boolean;
	goldSpawned?: boolean;
	goldGone?: boolean;
	cone?: Cell;
	paceUp?: boolean;
	died?: Death;
}

export class SnakeGame {
	/** head first */
	body: Cell[];
	dir: Dir = 'right';
	/** turns waiting for the next steps (at most 2) */
	queue: Dir[] = [];
	grow = 0;
	food: { cell: Cell; kind: Munchie };
	gold: { cell: Cell; until: number; at: number } | null = null;
	cones: Cell[] = [];
	eaten = 0;
	golds = 0;
	score = 0;
	steps = 0;
	dead: Death | null = null;
	private foodR: () => number;
	private coneR: () => number;
	private goldR: () => number;
	private nextGold: number;

	constructor(seed: number) {
		const s = seed >>> 0;
		this.foodR = rng((s ^ 0x9e3779b9) >>> 0);
		this.coneR = rng((s ^ 0x85ebca6b) >>> 0);
		this.goldR = rng((s ^ 0xc2b2ae35) >>> 0);
		const y = Math.floor(GRID / 2);
		this.body = Array.from({ length: START_LEN }, (_, i) => ({ x: START_LEN - i, y }));
		this.nextGold = 5 + Math.floor(this.goldR() * 4);
		this.food = this.placeFood();
	}

	get head(): Cell {
		return this.body[0];
	}

	/** Queue a turn; a turn back into your own smoke (or the same way) is ignored. */
	turn(d: Dir): boolean {
		if (this.dead) return false;
		const last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
		if (d === last || d === OPPOSITE[last] || this.queue.length >= 2) return false;
		this.queue.push(d);
		return true;
	}

	onSnake(c: Cell): boolean {
		return this.body.some((b) => same(b, c));
	}
	isCone(c: Cell): boolean {
		return this.cones.some((k) => same(k, c));
	}
	private taken(c: Cell): boolean {
		return this.onSnake(c) || this.isCone(c) || (!!this.food && same(this.food.cell, c)) || (!!this.gold && same(this.gold.cell, c));
	}
	/** Open sides of a cell (not a wall, not a cone). */
	private open(c: Cell): number {
		let n = 0;
		for (const [dx, dy] of Object.values(DIRS)) if (inside(c.x + dx, c.y + dy) && !this.isCone({ x: c.x + dx, y: c.y + dy })) n++;
		return n;
	}
	/** The first cell from (x, y) on that passes `ok`, scanning in a fixed order; null if none. */
	private scan(x: number, y: number, ok: (c: Cell) => boolean): Cell | null {
		const start = y * GRID + x;
		for (let i = 0; i < CELLS; i++) {
			const idx = (start + i * STRIDE) % CELLS;
			const c = { x: idx % GRID, y: Math.floor(idx / GRID) };
			if (ok(c)) return c;
		}
		return null;
	}
	private far(c: Cell, d: number): boolean {
		const h = this.head;
		return Math.abs(c.x - h.x) + Math.abs(c.y - h.y) >= d;
	}

	private placeFood(): { cell: Cell; kind: Munchie } {
		const x = Math.floor(this.foodR() * GRID);
		const y = Math.floor(this.foodR() * GRID);
		const kind = MUNCHIES[Math.floor(this.foodR() * MUNCHIES.length)];
		const cell =
			this.scan(x, y, (c) => !this.taken(c) && this.far(c, 2) && this.open(c) >= 2) ??
			this.scan(x, y, (c) => !this.taken(c)) ?? { x, y };
		return { cell, kind };
	}

	private spawnGold(ev: StepEvents) {
		// always the same draws per golden burger, placed or not
		const x = Math.floor(this.goldR() * GRID);
		const y = Math.floor(this.goldR() * GRID);
		this.nextGold += 6 + Math.floor(this.goldR() * 5);
		if (this.gold) return;
		const cell = this.scan(x, y, (c) => !this.taken(c) && this.far(c, 4) && this.open(c) >= 2);
		if (!cell) return;
		this.gold = { cell, at: this.steps, until: this.steps + Math.ceil(GOLD_MS / stepMs(this.eaten)) };
		ev.goldSpawned = true;
	}

	private spawnCone(ev: StepEvents) {
		const x = Math.floor(this.coneR() * GRID);
		const y = Math.floor(this.coneR() * GRID);
		if (this.cones.length >= MAX_CONES) return;
		const h = this.head;
		const [dx, dy] = DIRS[this.dir];
		const ahead = (c: Cell) => {
			for (let i = 1; i <= 6; i++) if (c.x === h.x + dx * i && c.y === h.y + dy * i) return true;
			return false;
		};
		const near = (a: Cell, b: Cell, d: number) => Math.abs(a.x - b.x) <= d && Math.abs(a.y - b.y) <= d;
		const cell = this.scan(x, y, (c) => {
			if (c.x < 1 || c.y < 1 || c.x > GRID - 2 || c.y > GRID - 2) return false;
			if (this.taken(c) || near(c, h, 3) || ahead(c)) return false;
			if (this.cones.some((k) => near(k, c, 1))) return false;
			if (near(c, this.food.cell, 1) || (this.gold && near(c, this.gold.cell, 1))) return false;
			return true;
		});
		if (!cell) return;
		this.cones.push(cell);
		ev.cone = cell;
	}

	/** One step forward. */
	step(): StepEvents {
		const ev: StepEvents = {};
		if (this.dead) return ev;
		const d = this.queue.shift();
		if (d && d !== OPPOSITE[this.dir]) this.dir = d;
		const [dx, dy] = DIRS[this.dir];
		const h = this.head;
		const next = { x: h.x + dx, y: h.y + dy };
		if (!inside(next.x, next.y)) return this.die(ev, 'wall');
		if (this.isCone(next)) return this.die(ev, 'cone');
		const growing = this.grow > 0;
		const check = growing ? this.body.length : this.body.length - 1;
		for (let i = 0; i < check; i++) if (same(this.body[i], next)) return this.die(ev, 'self');
		this.body.unshift(next);
		if (growing) this.grow--;
		else this.body.pop();
		this.steps++;
		if (same(next, this.food.cell)) {
			const pts = munchiePoints(this.eaten);
			ev.ate = this.food.kind;
			ev.points = pts;
			this.score += pts;
			this.eaten++;
			this.grow += GROW;
			if (this.eaten % 5 === 0) ev.paceUp = true;
			this.food = this.placeFood();
			if (this.eaten >= this.nextGold) this.spawnGold(ev);
			if (this.eaten >= CONES_FROM && (this.eaten - CONES_FROM) % CONE_EVERY === 0) this.spawnCone(ev);
		}
		if (this.gold && same(next, this.gold.cell)) {
			this.gold = null;
			this.golds++;
			this.score += GOLD_POINTS;
			this.grow += GOLD_GROW;
			ev.gold = true;
		} else if (this.gold && this.steps >= this.gold.until) {
			this.gold = null;
			ev.goldGone = true;
		}
		return ev;
	}

	private die(ev: StepEvents, why: Death): StepEvents {
		this.dead = why;
		this.queue = [];
		ev.died = why;
		return ev;
	}
}
