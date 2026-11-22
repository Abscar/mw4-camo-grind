/**
 * Burger Stack (BurgiArcade, 2026-11-22): the rules, without any drawing. A bottom bun sits on a plate;
 * the next layer slides left ↔ right above the stack and a tap drops it. What hangs over the edge is cut
 * off, so the next layer is narrower. A drop within PERFECT units of the stack is a perfect: no cut, and
 * every GROW_EVERY-th perfect in a row gives back GROW units of width. Missing the stack ends the run.
 * Every PER_BURGER fillings a top bun lands (a burger is complete) and the next burger starts on a fresh
 * bottom bun. All lengths are in the game's own units (the play field is 600 wide).
 * Pure: no DOM, so Node tests it (scripts/arcade-stack.test.js).
 */
import { rng, shuffled } from '#lib/arcade/rng.ts';

/** The fillings a player drops (the buns land by themselves). */
export const FILLINGS = ['patty', 'cheese', 'lettuce', 'tomato', 'onion', 'bacon', 'pickle'] as const;
export type Filling = (typeof FILLINGS)[number];
export type StackPiece = Filling | 'bunBottom' | 'bunTop';

/** How thick each piece is (units). */
export const THICK: Record<StackPiece, number> = {
	bunBottom: 40,
	bunTop: 56,
	patty: 36,
	cheese: 18,
	lettuce: 20,
	tomato: 22,
	onion: 18,
	bacon: 20,
	pickle: 18
};

/** The first bun's width; layers never grow wider than this. */
export const BASE_W = 320;
/** Fillings per burger before the top bun lands. */
export const PER_BURGER = 10;
/** A drop this close to the stack (units, centre to centre) is a perfect. */
export const PERFECT = 8;
/** Every GROW_EVERY-th perfect in a row widens the layer by GROW units (never past BASE_W). */
export const GROW_EVERY = 3;
export const GROW = 20;
/** Less overlap than this counts as a miss (a sliver can't hold a burger). */
export const MIN_KEEP = 4;

/** Points: each layer that stays, perfect bonuses (bigger in a streak) and a finished burger. */
export const LAYER_POINTS = 10;
export const BURGER_BONUS = 100;
export const perfectBonus = (streak: number): number => 10 + 5 * (Math.min(Math.max(streak, 1), 5) - 1);

/** How fast the layer slides (units per second) when `placed` fillings are already on the tower. */
export const speedAt = (placed: number): number => Math.min(250 + 8 * placed, 900);
/** The sliding layer's centre swings this far either side of the field's middle. */
export const SWING = 240;
/** A layer nobody drops falls by itself after this many seconds (so every run ends). */
export const AUTO_DROP = 7;
/** Which side the n-th filling comes from: -1 = from the left, 1 = from the right (they take turns). */
export const sideOf = (n: number): -1 | 1 => (n % 2 === 0 ? -1 : 1);

/**
 * The order of the fillings for a seed: plan(n) is the n-th filling (0-based) of the whole run. Each
 * burger opens with a patty; the rest come from shuffled bags of all seven, never the same twice in a row.
 */
export function makePlan(seed: number): (n: number) => Filling {
	const r = rng((seed ^ 0x5bd1e995) >>> 0);
	const out: Filling[] = [];
	let bag: Filling[] = [];
	/** The next filling from the bags (taken from the end) that isn't `prev`. */
	const draw = (prev: Filling): Filling => {
		if (!bag.length) bag = shuffled(r, FILLINGS);
		let i = bag.length - 1;
		while (i >= 0 && bag[i] === prev) i--;
		if (i < 0) {
			// only `prev` is left: put a fresh bag in front of it
			bag = [...shuffled(r, FILLINGS), ...bag];
			i = bag.length - 1;
			while (bag[i] === prev) i--;
		}
		return bag.splice(i, 1)[0];
	};
	return (n: number) => {
		while (out.length <= n) {
			const i = out.length;
			out.push(i % PER_BURGER === 0 ? 'patty' : draw(out[i - 1]));
		}
		return out[n];
	};
}

/** A stretch of the field from l to r (units). */
export interface Span {
	l: number;
	r: number;
}

export type DropResult =
	| { type: 'perfect'; keep: Span; streak: number; grow: number; points: number }
	| { type: 'cut'; keep: Span; cut: Span; streak: 0; points: number }
	| { type: 'miss' };

/**
 * Drop a layer spanning `mov` onto the stack's top spanning `top` (the sliding layer is as wide as the
 * top). `streak` = perfects in a row before this drop.
 */
export function dropLayer(top: Span, mov: Span, streak: number): DropResult {
	const d = (mov.l + mov.r) / 2 - (top.l + top.r) / 2;
	if (Math.abs(d) <= PERFECT) {
		const s = streak + 1;
		const w = top.r - top.l;
		const grow = s % GROW_EVERY === 0 ? Math.max(0, Math.min(GROW, BASE_W - w)) : 0;
		return { type: 'perfect', keep: { l: top.l - grow / 2, r: top.r + grow / 2 }, streak: s, grow, points: LAYER_POINTS + perfectBonus(s) };
	}
	const l = Math.max(top.l, mov.l);
	const r = Math.min(top.r, mov.r);
	if (r - l < MIN_KEEP) return { type: 'miss' };
	const cut = mov.l < top.l ? { l: mov.l, r: top.l } : { l: top.r, r: mov.r };
	return { type: 'cut', keep: { l, r }, cut, streak: 0, points: LAYER_POINTS };
}

/** Is the n-th filling (0-based) the last of its burger (a top bun lands after it)? */
export const finishesBurger = (n: number): boolean => (n + 1) % PER_BURGER === 0;
