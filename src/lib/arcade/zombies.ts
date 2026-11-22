/**
 * Zombie Rounds (BurgiArcade, 2026-11-22): the rules behind the top-down wave shooter
 * (components/arcade/games/ZombieRounds.svelte). Pure: the arena (a burger joint's parking lot at night),
 * each round's spawn plan from the seed, the scoring, the power-up drops and the small collision helpers.
 * No DOM and no runes, so Node tests it (scripts/arcade-zombies.test.js).
 *
 * Rounds: round N sends 6 + 3·(N−1) zombies (max 72), a little tougher and faster each round; from round 3
 * some are runners. Every 5th round also sends Brutes (1, +1 per 10 rounds) with a health bar.
 * Score: 10 per hit, 60 per kill, 100 × round for clearing a round; everything ×2 during Double Points.
 */
import { hashSeed, rng } from '#lib/arcade/rng.ts';

/** The arena in logical units (the canvas scales it). The joint's wall is above `top`: you walk below it. */
export const ARENA = { w: 720, h: 720, top: 104 } as const;

export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}
export type CoverKind = 'car' | 'crate' | 'dumpster';
export interface Cover extends Rect {
	kind: CoverKind;
	/** which look (car colour, crate style) */
	variant: number;
}

/** The cover blocks: bullets stop on them, you and the zombies walk round them. */
export const COVER: readonly Cover[] = [
	{ kind: 'dumpster', x: 30, y: 118, w: 88, h: 46, variant: 0 },
	{ kind: 'car', x: 118, y: 302, w: 138, h: 62, variant: 0 },
	{ kind: 'car', x: 550, y: 452, w: 62, h: 138, variant: 1 },
	{ kind: 'crate', x: 468, y: 214, w: 48, h: 48, variant: 0 },
	{ kind: 'crate', x: 520, y: 236, w: 40, h: 40, variant: 1 },
	{ kind: 'crate', x: 238, y: 560, w: 48, h: 48, variant: 0 }
];

/** The joint's front door (centre x, width): from round 2 zombies also shamble out of it. */
export const DOOR = { x: 360, w: 72 } as const;
export const PLAYER_START = { x: 360, y: 430 } as const;
export const PLAYER_RADIUS = 17;
export const PLAYER_HEARTS = 3;
export const PLAYER_SPEED = 178;

/** The gun: a 30-round magazine, ~9.5 shots a second, 1.25 s to reload. */
export const MAG = 30;
export const FIRE_RATE = 9.5;
export const RELOAD_TIME = 1.25;
export const BULLET_SPEED = 960;

/** At most this many zombies on the lot at once; later ones wait their turn. */
export const MAX_ALIVE = 24;

export const POINTS = { hit: 10, kill: 60, clear: 100 } as const;
/** Clearing round N: 100 × N. */
export const clearBonus = (round: number): number => POINTS.clear * round;
/** Points with Double Points on or off. */
export const award = (points: number, double: boolean): number => (double ? points * 2 : points);

export type ZombieKind = 'walker' | 'runner' | 'brute';
export type Edge = 'left' | 'right' | 'bottom' | 'door';
export interface Spawn {
	/** seconds after the round's fight starts */
	at: number;
	kind: ZombieKind;
	edge: Edge;
	/** where along that edge, 0..1 */
	pos: number;
	/** wears a burger-chef hat */
	chef: boolean;
	/** which skin / shirt colours (0..5) */
	look: number;
}
export interface RoundPlan {
	round: number;
	/** hits a walker or runner takes */
	hp: number;
	speed: number;
	runnerSpeed: number;
	bruteHp: number;
	bruteSpeed: number;
	spawns: Spawn[];
}

export const RADIUS: Record<ZombieKind, number> = { walker: 17, runner: 16, brute: 30 };
export const isBruteRound = (round: number): boolean => round > 0 && round % 5 === 0;
export const zombieHp = (round: number): number => 2 + Math.floor((round - 1) / 2);
export const zombieSpeed = (round: number): number => Math.min(44 + 5 * round, 98);
export const zombieCount = (round: number): number => Math.min(6 + 3 * (round - 1), 72);
export const bruteCount = (round: number): number => (isBruteRound(round) ? 1 + Math.floor(round / 10) : 0);

/** Which edge a zombie comes from: the lot's three open sides, plus the door from round 2. */
function edgeOf(r: () => number, round: number, door: boolean): Edge {
	const doorW = door && round >= 2 ? 1 : 0;
	const x = r() * (6 + doorW);
	return x < 2 ? 'left' : x < 4 ? 'right' : x < 6 ? 'bottom' : 'door';
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Round `round`'s plan for a seed: who comes, from where, when. The same seed and round = the same plan. */
export function roundPlan(seed: number, round: number): RoundPlan {
	const r = rng(hashSeed(`zombies:${seed >>> 0}:${round}`));
	const count = zombieCount(round);
	const runnerChance = round < 3 ? 0 : Math.min(0.12 + 0.04 * (round - 3), 0.45);
	const gap = Math.max(0.3, 1.3 - 0.07 * (round - 1));
	const spawns: Spawn[] = [];
	let t = 0.4;
	for (let i = 0; i < count; i++) {
		const kind: ZombieKind = r() < runnerChance ? 'runner' : 'walker';
		spawns.push({ at: r2(t), kind, edge: edgeOf(r, round, true), pos: r2(0.06 + 0.88 * r()), chef: r() < 0.32, look: Math.floor(r() * 6) });
		t += gap * (0.6 + 0.8 * r());
	}
	const brutes = bruteCount(round);
	for (let k = 0; k < brutes; k++) {
		spawns.push({ at: r2(0.4 + (t * (k + 1)) / (brutes + 1)), kind: 'brute', edge: edgeOf(r, round, false), pos: r2(0.25 + 0.5 * r()), chef: false, look: Math.floor(r() * 6) });
	}
	spawns.sort((a, b) => a.at - b.at);
	const speed = zombieSpeed(round);
	return {
		round,
		hp: zombieHp(round),
		speed,
		runnerSpeed: Math.min(Math.round(speed * 1.5), 142),
		bruteHp: 30 + 6 * round,
		bruteSpeed: Math.min(42 + round, 62),
		spawns
	};
}

/** Where a spawn starts: just outside its edge, or in the doorway. */
export function spawnPoint(s: Pick<Spawn, 'edge' | 'pos'>, radius = 16): { x: number; y: number } {
	const span = ARENA.h - ARENA.top - 80;
	switch (s.edge) {
		case 'left':
			return { x: -radius - 8, y: ARENA.top + 40 + s.pos * span };
		case 'right':
			return { x: ARENA.w + radius + 8, y: ARENA.top + 40 + s.pos * span };
		case 'bottom':
			return { x: 30 + s.pos * (ARENA.w - 60), y: ARENA.h + radius + 8 };
		default:
			return { x: DOOR.x + (s.pos - 0.5) * (DOOR.w - 30), y: ARENA.top - radius + 4 };
	}
}

export type PowerKind = 'nuke' | 'insta' | 'double';
/** Insta-Kill and Double Points last this many seconds. */
export const POWER_TIME = 8;
/** A dropped power-up stays this long on the ground. */
export const POWER_LIFE = 12;
export const DROP_CHANCE = 0.045;
/** At the latest every 28th kill drops one. */
export const DROP_PITY = 28;

/** The drops for a seed: call it once per kill (not for nuked zombies); it says what drops, or null. */
export function dropRoller(seed: number): () => PowerKind | null {
	const r = rng(hashSeed(`zombies-drops:${seed >>> 0}`));
	let since = 0;
	return () => {
		since++;
		const roll = r();
		const kind = r();
		if (since < DROP_PITY && roll >= DROP_CHANCE) return null;
		since = 0;
		return kind < 0.4 ? 'double' : kind < 0.75 ? 'insta' : 'nuke';
	};
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

/** A circle pushed out of a rectangle (sliding along it). `hit` = it was touching. */
export function pushOut(x: number, y: number, r: number, b: Rect): { x: number; y: number; hit: boolean } {
	const cx = clamp(x, b.x, b.x + b.w);
	const cy = clamp(y, b.y, b.y + b.h);
	const dx = x - cx;
	const dy = y - cy;
	const d2 = dx * dx + dy * dy;
	if (d2 >= r * r) return { x, y, hit: false };
	if (d2 > 1e-9) {
		const d = Math.sqrt(d2);
		return { x: cx + (dx / d) * r, y: cy + (dy / d) * r, hit: true };
	}
	// the centre is inside: out through the nearest side
	const l = x - b.x;
	const rt = b.x + b.w - x;
	const t = y - b.y;
	const bt = b.y + b.h - y;
	const m = Math.min(l, rt, t, bt);
	if (m === l) return { x: b.x - r, y, hit: true };
	if (m === rt) return { x: b.x + b.w + r, y, hit: true };
	if (m === t) return { x, y: b.y - r, hit: true };
	return { x, y: b.y + b.h + r, hit: true };
}

/** Where (0..1) the segment p → q first enters the rectangle, or −1 if it misses (slab method). */
export function segRect(px: number, py: number, qx: number, qy: number, b: Rect): number {
	const dx = qx - px;
	const dy = qy - py;
	let t0 = 0;
	let t1 = 1;
	const sides: [number, number][] = [
		[-dx, px - b.x],
		[dx, b.x + b.w - px],
		[-dy, py - b.y],
		[dy, b.y + b.h - py]
	];
	for (const [p, q] of sides) {
		if (p === 0) {
			if (q < 0) return -1;
			continue;
		}
		const t = q / p;
		if (p < 0) {
			if (t > t1) return -1;
			if (t > t0) t0 = t;
		} else {
			if (t < t0) return -1;
			if (t < t1) t1 = t;
		}
	}
	return t0;
}

/** Where (0..1) the segment p → q first touches the circle, or −1 if it misses. */
export function segCircle(px: number, py: number, qx: number, qy: number, cx: number, cy: number, r: number): number {
	const dx = qx - px;
	const dy = qy - py;
	const fx = px - cx;
	const fy = py - cy;
	const a = dx * dx + dy * dy;
	const c = fx * fx + fy * fy - r * r;
	if (c <= 0) return 0;
	if (a < 1e-9) return -1;
	const b = 2 * (fx * dx + fy * dy);
	const disc = b * b - 4 * a * c;
	if (disc < 0) return -1;
	const t = (-b - Math.sqrt(disc)) / (2 * a);
	return t >= 0 && t <= 1 ? t : -1;
}

/** Nothing (no cover block) between the two points. */
export function lineClear(px: number, py: number, qx: number, qy: number): boolean {
	return COVER.every((c) => segRect(px, py, qx, qy, c) < 0);
}
