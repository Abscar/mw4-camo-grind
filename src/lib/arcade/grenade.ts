/**
 * Grenade Toss (BurgiArcade, 2026-11-22): the street, the ten rounds, the grenade's flight and the scoring.
 * Pure (no DOM, no runes), so Node tests it (scripts/arcade-grenade.test.js) and GrenadeToss.svelte draws it.
 *
 * The world is 800 × 600 logical px, y pointing down, the street at GROUND. Side view: the operator crouches
 * behind sandbags on the left and throws from ORIGIN; to the right the street with four pieces of cover, two
 * spots where the burn barrel can stand, and a building whose front is the backdrop (grenades fly in front of
 * it): its open windows catch a grenade, its closed shutters, window ledges and roof are solid.
 *
 * Every round (one grenade each) comes from rng(seed): the wind, which plywood targets stand behind which
 * cover and how they move (still, popping up and down, sliding), which windows open and when, where the
 * barrel stands and, later on, a truck driving back and forth with a target in its bed. A round's things move
 * on the round's own clock, so `targetAt` / `windowOpen` / `truckX` are pure functions of that time.
 */
import { rng, rint, shuffled } from '#lib/arcade/rng.ts';

export const W = 800;
export const H = 600;
export const GROUND = 520;
/** where the grenade leaves the operator's hand */
export const ORIGIN = { x: 144, y: 368 };
export const GRAVITY = 980;
export const NADE_R = 7;
/** seconds from release to the bang (also in the air) */
export const FUSE = 2.2;
export const BLAST_R = 82;
/** a grenade that drops into the burn barrel goes off bigger */
export const BARREL_BOOST = 1.5;
/** blast centre this close to a target's bullseye = BULLSEYE */
export const BULLSEYE_R = 26;
/** a target's own size: the blast reaches it when it's within BLAST_R + this */
export const TARGET_R = 16;
export const ROUNDS = 10;
/** seconds to throw each grenade (game clock), then it's lost */
export const AIM_TIME = 12;
export const MIN_SPEED = 240;
export const MAX_SPEED = 980;
export const MIN_ANGLE = -20;
export const MAX_ANGLE = 88;
/** how far (logical px) you pull back for full power */
export const PULL_FULL = 170;
export const ROOF_Y = 150;
export const BUILDING_W = 190;
/** the building's windows: two floors of two */
export const WIN_W = 52;
export const WIN_H = 66;

export const TARGET_POINTS = { cutout: 100, window: 150, roof: 150, truck: 250 } as const;
export const BONUS_POINTS = { window: 400, barrel: 250, truck: 400 } as const;
/** combo multiplier by how many targets one blast takes out (index = count; 5+ = the last) */
export const COMBO = [1, 1, 1.5, 2, 2.5, 3] as const;

export type CoverKind = 'sandbags' | 'crates' | 'barrier' | 'car' | 'dumpster';
export type TargetKind = keyof typeof TARGET_POINTS;
export type BonusKind = keyof typeof BONUS_POINTS;

export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}
export interface Cover extends Rect {
	kind: CoverKind;
}
export type Motion =
	| { type: 'static' }
	| { type: 'pop'; period: number; phase: number }
	| { type: 'slide'; span: number; period: number; phase: number };
export interface Target {
	id: string;
	kind: TargetKind;
	/** the board's centre line (slide moves around it) */
	x: number;
	/** street targets: index of the cover they stand behind; window targets: the window */
	slot: number;
	motion: Motion;
}
export interface WindowPlan {
	idx: number;
	period: number;
	phase: number;
	/** share of each cycle it stands open */
	open: number;
}
export interface Truck {
	x0: number;
	x1: number;
	period: number;
	phase: number;
}
export interface Round {
	/** sideways push on the grenade in the air, px/s² (+ = to the right) */
	wind: number;
	targets: Target[];
	windows: WindowPlan[];
	/** the burn barrel's left edge */
	barrel: number;
	truck: Truck | null;
}
export interface Level {
	buildingX: number;
	covers: Cover[];
	/** the window openings, index = WindowPlan.idx */
	windows: Rect[];
	barrelSpots: number[];
	rounds: Round[];
}

const COVER_SIZE: Record<CoverKind, [number, number]> = {
	sandbags: [74, 42],
	crates: [62, 46],
	barrier: [70, 40],
	car: [86, 46],
	dumpster: [74, 46]
};
export const BARREL_W = 44;
export const BARREL_H = 58;
export const TRUCK_W = 196;

/** The whole run from a seed. */
export function makeLevel(seed: number): Level {
	const r = rng(seed);
	const buildingX = rint(r, 568, 596);
	const windows: Rect[] = [];
	for (const y of [196, 300]) for (const dx of [26, 112]) windows.push({ x: buildingX + dx, y, w: WIN_W, h: WIN_H });

	// six spots along the street: four covers and two places for the barrel
	const centres = Array.from({ length: 6 }, (_, i) => 262 + i * 95.6 + (r() * 2 - 1) * 5);
	const roles = shuffled(r, ['c', 'c', 'c', 'c', 'b', 'b']);
	const kinds = shuffled(r, ['sandbags', 'crates', 'barrier', 'car', 'dumpster'] as CoverKind[]);
	const covers: Cover[] = [];
	const barrelSpots: number[] = [];
	centres.forEach((cx, i) => {
		if (roles[i] === 'b') {
			barrelSpots.push(Math.round(cx - BARREL_W / 2));
			return;
		}
		const kind = kinds[covers.length];
		const [w, h] = COVER_SIZE[kind];
		covers.push({ kind, x: Math.round(cx - w / 2), y: GROUND - h, w, h });
	});

	// the truck turns up in four of the last six rounds
	const truckRounds = new Set(shuffled(r, [4, 5, 6, 7, 8, 9]).slice(0, 4));
	const rounds: Round[] = [];
	for (let i = 0; i < ROUNDS; i++) {
		const d = i / (ROUNDS - 1);
		const windMax = 30 + i * 13;
		const wind = Math.round((r() * 2 - 1) * windMax);
		const targets: Target[] = [];
		const nStreet = Math.min(4, 2 + Math.floor((i + 1) / 3));
		for (const ci of shuffled(r, [0, 1, 2, 3]).slice(0, nStreet)) {
			const c = covers[ci];
			const roll = r();
			let motion: Motion = { type: 'static' };
			if (i >= 2) {
				const wPop = 0.8 + d * 1.6;
				const wSlide = c.w >= 70 ? d * 1.6 : 0;
				const sum = 1 + wPop + wSlide;
				if (roll * sum > 1 + wPop) motion = { type: 'slide', span: 30 + r() * 16, period: 3.4 + r() * 2.2, phase: r() };
				else if (roll * sum > 1) motion = { type: 'pop', period: 2.6 + r() * 1.6 - d * 0.5, phase: r() };
			}
			targets.push({ id: `c${ci}`, kind: 'cutout', x: c.x + c.w / 2, slot: ci, motion });
		}
		if (i >= 2 && r() < 0.55) targets.push({ id: 'roof', kind: 'roof', x: buildingX + 36 + r() * 118, slot: -1, motion: { type: 'pop', period: 3 + r() * 1.4, phase: r() } });
		const nWin = Math.min(4, 1 + Math.floor(i / 3));
		const plans: WindowPlan[] = shuffled(r, [0, 1, 2, 3])
			.slice(0, nWin)
			.map((idx) => ({ idx, period: 3.4 + r() * 1.8 - d * 0.6, phase: r(), open: 0.62 - d * 0.14 + r() * 0.06 }));
		for (const p of plans) {
			const wr = windows[p.idx];
			targets.push({ id: `w${p.idx}`, kind: 'window', x: wr.x + wr.w / 2, slot: p.idx, motion: { type: 'static' } });
		}
		const barrel = barrelSpots[rint(r, 0, barrelSpots.length - 1)];
		let truck: Truck | null = null;
		if (truckRounds.has(i)) {
			truck = { x0: 206, x1: 560, period: 8.4 + r() * 1.6 - d * 1.8, phase: r() };
			targets.push({ id: 'truck', kind: 'truck', x: 0, slot: -1, motion: { type: 'static' } });
		}
		rounds.push({ wind, targets, windows: plans, barrel, truck });
	}
	return { buildingX, covers, windows, barrelSpots, rounds };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smooth = (v: number) => {
	const c = clamp(v, 0, 1);
	return c * c * (3 - 2 * c);
};
const frac = (v: number) => v - Math.floor(v);

/** How far up a target is (0 = hidden behind its cover, 1 = fully up). */
export function upAt(m: Motion, t: number): number {
	if (m.type !== 'pop') return 1;
	const u = frac(t / m.period + m.phase);
	if (u < 0.58) return 1;
	if (u < 0.66) return 1 - smooth((u - 0.58) / 0.08);
	if (u < 0.9) return 0;
	return smooth((u - 0.9) / 0.1);
}

/** How far a window's shutters stand open (0 closed … 1 open). */
export function windowOpen(p: WindowPlan, t: number): number {
	const tc = frac(t / p.period + p.phase) * p.period;
	const openFor = p.open * p.period;
	if (tc >= openFor) return 0;
	return clamp(Math.min(tc / 0.25, (openFor - tc) / 0.25), 0, 1);
}

/** The truck's left edge, and which way it's going (+1 right, −1 left). */
export function truckX(tr: Truck, t: number): { x: number; dir: 1 | -1 } {
	const s = frac(t / tr.period + tr.phase);
	const tri = s < 0.5 ? s * 2 : 2 - s * 2;
	return { x: tr.x0 + (tr.x1 - tr.x0) * smoothTri(tri), dir: s < 0.5 ? 1 : -1 };
}
/** eases the turn at each end so the truck slows down, stops and reverses */
const smoothTri = (v: number) => 0.5 - 0.5 * Math.cos(v * Math.PI);

/** A cut-out's board: it stands on a post, `drop` px lower while ducked. */
export const BOARD = { h: 76, w: 46, post: 22, drop: 74, eye: 58 } as const;
/** the truck's rider is a smaller board standing on the bed's floor */
export const TRUCK_SCALE = 0.8;

/** Where a target is at round time t: its bullseye centre, how far up it is, and whether a blast can reach it. */
export function targetAt(level: Level, round: Round, tg: Target, t: number): { x: number; y: number; up: number; live: boolean } {
	if (tg.kind === 'window') {
		const p = round.windows.find((w) => w.idx === tg.slot);
		const wr = level.windows[tg.slot];
		const o = p ? windowOpen(p, t) : 0;
		return { x: wr.x + wr.w / 2, y: wr.y + wr.h * 0.58, up: o, live: o >= 0.5 };
	}
	if (tg.kind === 'truck') {
		const tr = round.truck;
		if (!tr) return { x: -999, y: -999, up: 0, live: false };
		const { x } = truckX(tr, t);
		const bed = truckParts(x).bed;
		return { x: bed.x + bed.w / 2, y: bed.y - BOARD.eye * TRUCK_SCALE, up: 1, live: true };
	}
	const up = upAt(tg.motion, t);
	const x = tg.motion.type === 'slide' ? tg.x + tg.motion.span * Math.sin(2 * Math.PI * (t / tg.motion.period + tg.motion.phase)) : tg.x;
	const base = tg.kind === 'roof' ? ROOF_Y + BOARD.post : GROUND;
	return { x, y: base - BOARD.eye + (1 - up) * BOARD.drop, up, live: up >= 0.45 };
}

/** The truck's pieces at left edge x: cab on the right, an open bed on the left. */
export function truckParts(x: number) {
	return {
		cab: { x: x + 136, y: GROUND - 104, w: 60, h: 82 },
		floor: { x, y: GROUND - 40, w: 138, h: 18 },
		back: { x, y: GROUND - 72, w: 8, h: 34 },
		front: { x: x + 128, y: GROUND - 72, w: 8, h: 34 },
		bed: { x: x + 8, y: GROUND - 40, w: 120, h: 0 }
	};
}

export type CatchKind = 'window' | 'barrel' | 'truck';
export interface CatchZone extends Rect {
	kind: CatchKind;
	idx: number;
	/** only catches a grenade that's falling */
	down: boolean;
}
export interface Env {
	wind: number;
	solids: Rect[];
	catches: CatchZone[];
}

/** What a grenade can hit or fall into at round time t. */
export function envAt(level: Level, round: Round, t: number): Env {
	const solids: Rect[] = [];
	const catches: CatchZone[] = [];
	const bx = level.buildingX;
	solids.push({ x: bx - 6, y: ROOF_Y - 18, w: BUILDING_W + 12, h: 30 });
	level.windows.forEach((wr, idx) => {
		solids.push({ x: wr.x - 6, y: wr.y + wr.h, w: wr.w + 12, h: 8 });
		const p = round.windows.find((w) => w.idx === idx);
		const o = p ? windowOpen(p, t) : 0;
		if (o >= 0.5) catches.push({ x: wr.x + 3, y: wr.y + 3, w: wr.w - 6, h: wr.h - 6, kind: 'window', idx, down: false });
		else solids.push({ ...wr });
	});
	for (const c of level.covers) solids.push({ x: c.x, y: c.y, w: c.w, h: c.h });
	const b = round.barrel;
	solids.push({ x: b, y: GROUND - BARREL_H, w: 6, h: BARREL_H }, { x: b + BARREL_W - 6, y: GROUND - BARREL_H, w: 6, h: BARREL_H });
	catches.push({ x: b + 6, y: GROUND - BARREL_H, w: BARREL_W - 12, h: 30, kind: 'barrel', idx: 0, down: true });
	if (round.truck) {
		const p = truckParts(truckX(round.truck, t).x);
		solids.push(p.cab, p.floor, p.back, p.front);
		catches.push({ x: p.back.x + 8, y: p.back.y, w: p.front.x - p.back.x - 8, h: 30, kind: 'truck', idx: 0, down: true });
	}
	return { wind: round.wind, solids, catches };
}

export interface Nade {
	x: number;
	y: number;
	vx: number;
	vy: number;
	/** seconds since release */
	t: number;
	/** hard hits so far: the first one bounces, after that it's nearly dead */
	bounces: number;
	/** spin for drawing (radians) */
	spin: number;
	/** fell into a window / the barrel / the truck's bed: stays there (dx/dy = offset in the truck's bed) */
	caught: { kind: CatchKind; idx: number; dx: number; dy: number } | null;
}

export const newNade = (vx: number, vy: number): Nade => ({ x: ORIGIN.x, y: ORIGIN.y, vx, vy, t: 0, bounces: 0, spin: 0, caught: null });

/** One physics step (use small dt, e.g. 1/240 s): gravity, wind while in the air, catches, one bounce, friction. */
export function stepNade(n: Nade, dt: number, env: Env): Nade {
	if (n.caught) return { ...n, t: n.t + dt, vx: 0, vy: 0 };
	let { x, y, vx, vy, bounces, spin } = n;
	const air = !touching(x, y, env);
	if (air) vx += env.wind * dt;
	vy += GRAVITY * dt;
	x += vx * dt;
	y += vy * dt;
	for (const c of env.catches) {
		if (x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h && (!c.down || vy > 0)) {
			const dx = c.kind === 'truck' ? x - (c.x - 8) : 0;
			return { x, y, vx: 0, vy: 0, t: n.t + dt, bounces, spin, caught: { kind: c.kind, idx: c.idx, dx, dy: 0 } };
		}
	}
	let support = false;
	const surfaces: Rect[] = [...env.solids, { x: -1e4, y: GROUND, w: 2e4, h: 400 }];
	for (const s of surfaces) {
		const cx = clamp(x, s.x, s.x + s.w);
		const cy = clamp(y, s.y, s.y + s.h);
		let nx = x - cx;
		let ny = y - cy;
		let d = Math.hypot(nx, ny);
		if (d >= NADE_R) continue;
		if (d < 1e-6) {
			// the centre got inside: push out the shortest way
			const opts = [
				[x - s.x, -1, 0],
				[s.x + s.w - x, 1, 0],
				[y - s.y, 0, -1],
				[s.y + s.h - y, 0, 1]
			].sort((a, b) => a[0] - b[0]);
			nx = opts[0][1];
			ny = opts[0][2];
			x += nx * (opts[0][0] + NADE_R);
			y += ny * (opts[0][0] + NADE_R);
		} else {
			nx /= d;
			ny /= d;
			x += nx * (NADE_R - d);
			y += ny * (NADE_R - d);
		}
		const vn = vx * nx + vy * ny;
		if (ny < -0.5) support = true;
		if (vn >= 0) continue;
		const hard = vn < -70;
		const e = hard && bounces === 0 ? 0.45 : 0.08;
		const keep = hard ? (bounces === 0 ? 0.78 : 0.55) : 1;
		const tx = vx - vn * nx;
		const ty = vy - vn * ny;
		vx = tx * keep - e * vn * nx;
		vy = ty * keep - e * vn * ny;
		if (hard) bounces++;
	}
	if (support) {
		const k = Math.exp(-3.2 * dt);
		vx *= k;
		if (Math.abs(vx) < 4 && Math.abs(vy) < 30) vx = 0;
		spin += (vx / NADE_R) * dt;
	} else spin += 9 * dt * Math.sign(vx || 1);
	return { x, y, vx, vy, t: n.t + dt, bounces, spin, caught: null };
}

/** resting on or rubbing against something (then the wind doesn't push it) */
function touching(x: number, y: number, env: Env): boolean {
	if (y + NADE_R >= GROUND - 0.5) return true;
	for (const s of env.solids) {
		const cx = clamp(x, s.x, s.x + s.w);
		const cy = clamp(y, s.y, s.y + s.h);
		if (Math.hypot(x - cx, y - cy) < NADE_R + 0.5) return true;
	}
	return false;
}

/** Where a caught grenade sits at round time t. */
export function caughtPos(level: Level, round: Round, n: Nade, t: number): { x: number; y: number } {
	const c = n.caught;
	if (!c) return { x: n.x, y: n.y };
	if (c.kind === 'window') {
		const wr = level.windows[c.idx];
		return { x: wr.x + wr.w / 2, y: wr.y + wr.h - NADE_R - 4 };
	}
	if (c.kind === 'barrel') return { x: round.barrel + BARREL_W / 2, y: GROUND - 16 };
	const tx = round.truck ? truckX(round.truck, t).x : 0;
	return { x: tx + clamp(c.dx, 14, 122), y: GROUND - 40 - NADE_R };
}

/** Aim from a pull (logical px, screen y down): the throw goes the opposite way. */
export function aimFromPull(px: number, py: number): { angle: number; power: number } {
	const power = clamp((Math.hypot(px, py) - 10) / PULL_FULL, 0, 1);
	// atan2 gives (−180°, 180°]: anything pointing back over the operator's head becomes a straight-up lob,
	// anything pointing down past −20° a flat throw
	const deg = (Math.atan2(py, -px) * 180) / Math.PI;
	return { angle: clamp(deg, MIN_ANGLE, MAX_ANGLE), power };
}

/** The launch velocity (screen coordinates, vy < 0 = up). */
export function launch(angle: number, power: number): { vx: number; vy: number } {
	const v = MIN_SPEED + clamp(power, 0, 1) * (MAX_SPEED - MIN_SPEED);
	const a = (clamp(angle, MIN_ANGLE, MAX_ANGLE) * Math.PI) / 180;
	return { vx: v * Math.cos(a), vy: -v * Math.sin(a) };
}

/** The aiming dots: the start of the arc only (gravity, no wind, no walls). */
export function previewDots(vx: number, vy: number, count = 11, gap = 0.04): { x: number; y: number }[] {
	return Array.from({ length: count }, (_, i) => {
		const t = (i + 1) * gap;
		return { x: ORIGIN.x + vx * t, y: ORIGIN.y + vy * t + 0.5 * GRAVITY * t * t };
	});
}

export interface Hit {
	id: string;
	kind: TargetKind;
	x: number;
	y: number;
	bullseye: boolean;
	points: number;
}
export interface Blast {
	x: number;
	y: number;
	radius: number;
	hits: Hit[];
	mult: number;
	bonus: { kind: BonusKind; points: number }[];
	total: number;
}

/** The bang: which live targets it reaches, bullseyes, the combo and the trick-shot bonuses. */
export function scoreBlast(level: Level, round: Round, n: Nade, t: number, gone: ReadonlySet<string> = new Set()): Blast {
	const p = caughtPos(level, round, n, t);
	const c = n.caught;
	const radius = c?.kind === 'barrel' ? BLAST_R * BARREL_BOOST : BLAST_R;
	const hits: Hit[] = [];
	for (const tg of round.targets) {
		if (gone.has(tg.id)) continue;
		const s = targetAt(level, round, tg, t);
		let bull: boolean;
		if (c?.kind === 'window') {
			// inside a room the walls hold the blast: only that window's target, shutters shut or not
			if (tg.kind !== 'window' || tg.slot !== c.idx) continue;
			bull = true;
		} else {
			if (!s.live) continue;
			const d = Math.hypot(s.x - p.x, s.y - p.y);
			if (d > radius + TARGET_R) continue;
			bull = (c?.kind === 'truck' && tg.kind === 'truck') || d <= BULLSEYE_R;
		}
		const base = TARGET_POINTS[tg.kind];
		hits.push({ id: tg.id, kind: tg.kind, x: s.x, y: s.y, bullseye: bull, points: bull ? base * 2 : base });
	}
	const mult = COMBO[Math.min(hits.length, COMBO.length - 1)];
	const bonus: Blast['bonus'] = [];
	if (c) bonus.push({ kind: c.kind, points: BONUS_POINTS[c.kind] });
	const sum = hits.reduce((a, h) => a + h.points, 0);
	const total = Math.round(sum * mult) + bonus.reduce((a, b) => a + b.points, 0);
	return { x: p.x, y: p.y, radius, hits, mult, bonus, total };
}

/** A whole throw at once (tests and score estimates): release at round time t0, fly until the fuse, score it. */
export function simulateThrow(level: Level, ri: number, t0: number, vx: number, vy: number, dt = 1 / 240): { nade: Nade; blast: Blast; t: number } {
	const round = level.rounds[ri];
	let n = newNade(vx, vy);
	let t = t0;
	while (n.t < FUSE) {
		n = stepNade(n, dt, envAt(level, round, t));
		t += dt;
	}
	return { nade: n, blast: scoreBlast(level, round, n, t), t };
}
