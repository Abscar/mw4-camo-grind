/**
 * Hitmarker Rush (BurgiArcade, 2026-11-22): the pure rules. A 30-second aim trainer on a ruined street at
 * dusk: targets pop up from behind cover (windows, crates, a burger-joint counter, sandbag walls) at seeded
 * spots on a seeded schedule, so the same seed gives the same targets at the same moments whatever the
 * player does (the schedule never looks at hits). Points per hit with a headshot bonus and a combo
 * multiplier; shooting a civilian costs points and breaks the combo; the final score is weighted by
 * accuracy. No browser APIs, so Node tests it (scripts/arcade-hitmarker.test.js).
 *
 * Coordinates are the game's logical 800 × 600 field. A target's own coordinates ("local") have their
 * origin at the top of its cover, y down, at scale 1: a fully risen target reaches up to y ≈ −150.
 */
import { pick, rint, rng } from '#lib/arcade/rng.ts';

/** The run's length (game clock, ms). */
export const DURATION = 30_000;
/** How long a target takes to pop up / to duck back. */
export const RISE_MS = 180;
export const DUCK_MS = 150;
/** How far a target rises above its cover at scale 1 (logical px). */
export const RISE_H = 150;

export type TargetKind = 'soldier' | 'dummy' | 'burger' | 'hvt' | 'mascot' | 'duck';
/** Don't shoot these. */
export const isCivilian = (k: TargetKind): boolean => k === 'mascot' || k === 'duck';

export type Cover = 'window' | 'crate' | 'counter' | 'sandbag';
export interface Spot {
	id: string;
	/** draw order: 0 = windows at the back, 1 = crates + counter, 2 = sandbags in front */
	row: 0 | 1 | 2;
	cover: Cover;
	/** centre of the cover's top edge */
	x: number;
	base: number;
	scale: number;
	/** windows: the opening (a target only shows and only counts inside it) */
	clip?: { x0: number; x1: number; y0: number };
	/** an HVT may stand here and moves this far left and right (0 = no HVT here) */
	hvt: number;
}

/** The eleven spots, back to front (the cover drawings in HitmarkerRush.svelte follow these numbers). */
export const SPOTS: readonly Spot[] = [
	{ id: 'w0', row: 0, cover: 'window', x: 86, base: 222, scale: 0.62, clip: { x0: 38, x1: 134, y0: 108 }, hvt: 0 },
	{ id: 'w1', row: 0, cover: 'window', x: 204, base: 222, scale: 0.62, clip: { x0: 158, x1: 250, y0: 114 }, hvt: 0 },
	{ id: 'w2', row: 0, cover: 'window', x: 620, base: 222, scale: 0.62, clip: { x0: 574, x1: 666, y0: 112 }, hvt: 0 },
	{ id: 'w3', row: 0, cover: 'window', x: 738, base: 222, scale: 0.62, clip: { x0: 692, x1: 784, y0: 108 }, hvt: 0 },
	{ id: 'k0', row: 1, cover: 'crate', x: 150, base: 374, scale: 0.82, hvt: 0 },
	{ id: 'c0', row: 1, cover: 'counter', x: 346, base: 384, scale: 0.82, hvt: 0 },
	{ id: 'c1', row: 1, cover: 'counter', x: 454, base: 384, scale: 0.82, hvt: 0 },
	{ id: 'k1', row: 1, cover: 'crate', x: 664, base: 366, scale: 0.82, hvt: 0 },
	{ id: 's0', row: 2, cover: 'sandbag', x: 146, base: 496, scale: 1, hvt: 52 },
	{ id: 's1', row: 2, cover: 'sandbag', x: 400, base: 496, scale: 1, hvt: 0 },
	{ id: 's2', row: 2, cover: 'sandbag', x: 654, base: 496, scale: 1, hvt: 52 }
];

/** One target popping up: when (game clock), where, what, how long it stays up before ducking. */
export interface Spawn {
	t: number;
	spot: number;
	kind: TargetKind;
	stay: number;
	/** HVT: which way it starts moving */
	dir: 1 | -1;
}

/** How long a normal target stays up at game time t (shrinks as the run goes on). */
export const stayAt = (t: number): number => Math.round(1450 - 720 * Math.min(1, t / DURATION));
/** The gap to the next pop-up at game time t (before the seeded ±25 %). */
export const gapAt = (t: number): number => 720 - 360 * Math.min(1, t / DURATION);

/** The whole run's pop-ups from the seed. Spots never overlap in time (a spot is busy until its target has ducked). */
export function schedule(seed: number): Spawn[] {
	const r = rng(seed);
	const out: Spawn[] = [];
	const busyUntil = SPOTS.map(() => 0);
	const hvtAt = [rint(r, 6500, 9500), rint(r, 14500, 18000), rint(r, 22000, 25000)];
	let hvtDone = 0;
	let last = -1;
	let t = 450;
	while (t < DURATION - 900) {
		const p = t / DURATION;
		const count = r() < 0.06 + 0.3 * p ? 2 : 1;
		for (let k = 0; k < count; k++) {
			const wantHvt = hvtDone < hvtAt.length && t >= hvtAt[hvtDone];
			const roll = r() * 100;
			const civ = t > 2500 && roll < 11;
			const kind: TargetKind = wantHvt ? 'hvt' : civ ? (r() < 0.5 ? 'mascot' : 'duck') : roll < 50 ? 'soldier' : roll < 75 ? 'dummy' : 'burger';
			let free = SPOTS.map((_, i) => i).filter((i) => busyUntil[i] <= t && (kind !== 'hvt' || SPOTS[i].hvt > 0));
			if (free.length > 1) free = free.filter((i) => i !== last);
			if (!free.length) continue;
			const spot = pick(r, free);
			const stay = kind === 'hvt' ? 2100 : isCivilian(kind) ? stayAt(t) + 250 : stayAt(t);
			const dir: 1 | -1 = r() < 0.5 ? -1 : 1;
			out.push({ t, spot, kind, stay, dir });
			busyUntil[spot] = t + RISE_MS + stay + DUCK_MS + 260;
			last = spot;
			if (kind === 'hvt') hvtDone++;
		}
		t += Math.round(gapAt(t) * (0.75 + r() * 0.5));
	}
	return out;
}

/** Where on a target a shot at local (x, y) lands: the head / bullseye zone, the body, or nothing. */
export function hitZone(kind: TargetKind, x: number, y: number): 'head' | 'body' | null {
	const inCircle = (cx: number, cy: number, rr: number) => (x - cx) ** 2 + (y - cy) ** 2 <= rr * rr;
	const inRect = (x0: number, y0: number, x1: number, y1: number) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
	switch (kind) {
		case 'soldier':
		case 'hvt':
			if (inCircle(0, -108, 40)) return 'head';
			return inRect(-64, -68, 64, 60) ? 'body' : null;
		case 'dummy':
			if (inCircle(0, -118, 30) || inCircle(0, -40, 15)) return 'head';
			return inRect(-62, -84, 62, 60) || inRect(-14, -96, 14, -84) ? 'body' : null;
		case 'burger':
			if (inCircle(0, -106, 40)) return 'head';
			return inRect(-56, -68, 56, 60) ? 'body' : null;
		case 'mascot':
			return inCircle(0, -80, 66) || inRect(-50, -40, 50, 60) || inCircle(0, -158, 22) ? 'body' : null;
		case 'duck':
			return inCircle(0, -40, 54) || inCircle(16, -98, 30) ? 'body' : null;
	}
}

export const HIT_POINTS = 100;
export const HEAD_BONUS = 50;
export const HVT_POINTS = 1000;
export const HVT_HEAD_BONUS = 500;
export const CIVILIAN_PENALTY = 300;

/** The combo multiplier for the `combo`-th hit in a row: ×1 for hits 1–5, ×1.5 for 6–10 … up to ×4. */
export const comboMult = (combo: number): number => Math.min(4, 1 + Math.floor(Math.max(0, combo - 1) / 5) * 0.5);

/** Points for a hit (combo = hits in a row including this one). */
export function hitPoints(kind: TargetKind, head: boolean, combo: number): number {
	const base = kind === 'hvt' ? HVT_POINTS + (head ? HVT_HEAD_BONUS : 0) : HIT_POINTS + (head ? HEAD_BONUS : 0);
	return Math.round(base * comboMult(combo));
}

/** Hits ÷ shots (0 without shots). */
export const accuracy = (hits: number, shots: number): number => (shots > 0 ? Math.min(1, hits / shots) : 0);

/** The final score: points × (0.5 + 0.5 × accuracy), a whole number ≥ 0. */
export const finalScore = (points: number, hits: number, shots: number): number =>
	Math.max(0, Math.round(Math.max(0, points) * (0.5 + 0.5 * accuracy(hits, shots))));
