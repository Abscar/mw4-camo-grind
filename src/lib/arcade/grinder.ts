/**
 * Camo Grinder (BurgiArcade, 2026-11-22): the pure rules of the timing game. A weapon waits for its camos
 * (Gold → Platinum → Harmonic Break → Divergence); a needle bounces across a meter and every tap inside the
 * target zone earns the next camo. Each new weapon is faster with a smaller zone. Three strikes (a tap outside
 * the zone, or letting a target run out) end the run. The weapon order and every zone's place come from the
 * seed, so the daily challenge is the same for everyone. Used by CamoGrinder.svelte and
 * scripts/arcade-grinder.test.js. No DOM, no runes.
 */
import { rng, shuffled } from '#lib/arcade/rng.ts';

/** The camos a weapon earns, in order. The last one maxes it. */
export const GRIND_CAMOS = ['gold', 'platinum', 'harmonicBreak', 'divergence'] as const;
export type GrindCamo = (typeof GRIND_CAMOS)[number];

export const STRIKES = 3;
export const HIT_POINTS = 100;
/** A perfect hit (the bright core of the zone) is worth double. */
export const PERFECT_POINTS = 200;
/** Bonus for every weapon that gets all four camos. */
export const MAX_BONUS = 500;
/** Seconds a target waits before it counts as a strike ("too slow"). */
export const TARGET_TIME = 6;

/**
 * How hard a target is: the needle's speed (meter widths per second) and the zone / perfect-core widths
 * (fractions of the meter) for weapon number `weapon` (0 = the first) and camo `step` (0 = Gold … 3 =
 * Divergence). Within a weapon each camo is a little harder; each weapon is clearly harder than the last.
 */
export function difficulty(weapon: number, step: number): { speed: number; zone: number; perfect: number } {
	const n = Math.max(0, weapon) + Math.max(0, Math.min(3, step)) * 0.25;
	const speed = Math.min(2.4, 0.78 + 0.12 * n);
	const zone = Math.max(0.07, 0.25 * Math.pow(0.9, n));
	const perfect = Math.max(0.022, zone * 0.28);
	return { speed, zone, perfect };
}

/** Where a zone sits: its centre (0–1), kept clear of the meter's ends. `u` is the seeded draw (0–1). */
export function zoneCentre(u: number, zone: number): number {
	const margin = zone / 2 + 0.06;
	return margin + u * (1 - 2 * margin);
}

/** A new target's needle starts at the end farther from the zone, heading towards it. */
export function needleStart(centre: number): { pos: number; dir: 1 | -1 } {
	return centre >= 0.5 ? { pos: 0, dir: 1 } : { pos: 1, dir: -1 };
}

/** Move the needle `delta` meter widths, bouncing off both ends. */
export function moveNeedle(pos: number, dir: 1 | -1, delta: number): { pos: number; dir: 1 | -1 } {
	let x = pos + dir * delta;
	let d = dir;
	for (let i = 0; i < 64 && (x > 1 || x < 0); i++) {
		if (x > 1) {
			x = 2 - x;
			d = d === 1 ? -1 : 1;
		} else {
			x = -x;
			d = d === 1 ? -1 : 1;
		}
	}
	return { pos: Math.min(1, Math.max(0, x)), dir: d };
}

export type Judgement = 'perfect' | 'hit' | 'miss';

/** How good a tap is at needle position `pos` for a zone centred on `centre`. */
export function judge(pos: number, centre: number, zone: number, perfect: number): Judgement {
	const off = Math.abs(pos - centre);
	if (off <= perfect / 2) return 'perfect';
	if (off <= zone / 2) return 'hit';
	return 'miss';
}

export const pointsFor = (j: Judgement): number => (j === 'perfect' ? PERFECT_POINTS : j === 'hit' ? HIT_POINTS : 0);

/** The run's seeded parts: the weapon order and one draw per target shown (in the order they're shown). */
export interface Grind {
	/** The weapon for weapon number n (the shuffled list, repeated if a legend ever gets through it all). */
	weapon(n: number): string;
	/** The next target's zone draw (0–1); call it once per target shown. */
	nextZone(): number;
}

export function makeGrind(seed: number, weaponIds: readonly string[]): Grind {
	const order = shuffled(rng(seed ^ 0x67726e64), weaponIds);
	const zones = rng(seed ^ 0x7a6f6e65);
	return {
		weapon: (n: number) => order[((n % order.length) + order.length) % order.length],
		nextZone: () => zones()
	};
}
