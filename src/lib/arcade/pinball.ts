/**
 * Abscar's Pinball (BurgiArcade, 2026-11-22, the user: "gör ett 'Abscars Pinball' ett flipperspel med massa kul
 * bonusar och dopamingivande effekter. bygg de ba likadant som gamla windows"). A classic single-table pinball in
 * the spirit of the old desktop pinball games: a tilted table, two flippers, a plunger, three pop bumpers,
 * slingshots, rollover lanes, a drop-target bank, a ramp, an orbit with a spinner, a saucer that starts
 * multiball, a kickback, ball save, skill shot, tilt and an end-of-ball bonus count. Our own table, rules and
 * names (no other game's layout, art or sounds), themed on the camo grind:
 *
 *   G / P / H lanes  light all three = the camo goes up (Gold → Platinum → Harmonic Break → Divergence), and the
 *                    end-of-ball bonus multiplier with it (×1 … ×5); the flippers move the lit lanes (lane change)
 *   H-O-L-K targets  drop all four = HOLK TIME (every score ×2 for 20 s) + the kickback lights again
 *   Nuke ramp        a kill on your streak: 3 UAV, 5 Airstrike, 7 Chopper Gunner (bumpers ×5), 10 TACTICAL NUKE
 *                    (+ an extra ball once a game); during multiball the ramp is the JACKPOT
 *   Orbit            the spinner spins, a full loop is a kill too; shots within 4 s of each other = COMBO
 *   Stash saucer     three locks = 3-ball MULTIBALL
 * The streak resets when a ball drains (like dying in the game).
 *
 * Coordinates: the table is W × H units, y down (down = towards the flippers). Fixed physics steps, so the same
 * inputs give the same game; the seed only picks the skill-shot lane and small random kicks.
 * Pure: no DOM, so Node tests it (scripts/arcade-pinball.test.js).
 */
import { rng } from '#lib/arcade/rng.ts';

export const W = 420;
export const H = 760;
export const R = 10;
const G = 1300;
const SUB = 12;
const VMAX = 2600;
export const BALLS = 3;

export type V = { x: number; y: number };
type Seg = { a: V; b: V; e: number; r?: number; oneWay?: boolean; kind?: 'wall' | 'sling' | 'post' };

/* ---------- the table ---------- */

const ARC_C = { x: 210, y: 210 };
const ARC_R = 190;
/** the top arch, as a polyline from the left wall over the top to the right wall */
export const ARCH: V[] = Array.from({ length: 33 }, (_, i) => {
	const a = Math.PI + (i / 32) * Math.PI;
	return { x: ARC_C.x + ARC_R * Math.cos(a), y: ARC_C.y + ARC_R * Math.sin(a) };
});

export const LANE_X = 372; // plunger lane's inner wall
export const PLUNGER_Y = 730;
export const LAUNCH = { x: 386, y: PLUNGER_Y - R - 0.5 };
export const ORBIT_X = 330; // right orbit's inner guide
export const RAMP_X = 62; // left ramp channel's guide
export const FLIP_Y = 668;
export const FLIP_LEN = 62;

/** walls the page draws as rails too */
export const WALLS: [V, V][] = [
	[{ x: 20, y: 210 }, { x: 20, y: 780 }],
	[{ x: 400, y: 210 }, { x: 400, y: 780 }],
	[{ x: LANE_X, y: 250 }, { x: LANE_X, y: 780 }],
	[{ x: LANE_X, y: PLUNGER_Y }, { x: 400, y: PLUNGER_Y }],
	// right orbit guide, left ramp channel guide
	[{ x: ORBIT_X, y: 262 }, { x: ORBIT_X, y: 425 }],
	[{ x: RAMP_X, y: 282 }, { x: RAMP_X, y: 430 }],
	// the diverter at the top left: a ball coming round the arch rolls off it into the bumpers
	[{ x: 24, y: 171 }, { x: 80, y: 206 }],
	// inlane guides down to the flippers
	[{ x: 60, y: 540 }, { x: 60, y: 610 }],
	[{ x: 60, y: 610 }, { x: 119, y: 651 }],
	[{ x: ORBIT_X, y: 540 }, { x: ORBIT_X, y: 610 }],
	[{ x: ORBIT_X, y: 610 }, { x: 271, y: 651 }]
];
/** one-way gate at the top of the plunger lane: lets the ball out, not back in */
export const GATE: [V, V] = [{ x: LANE_X, y: 250 }, { x: 400, y: 212 }];
/** lane dividers above the bumpers (G / P / H lanes between them) */
export const DIVIDERS = [150, 190, 230, 270];
export const LANE_TOP = 78;
export const LANE_BOT = 122;
export const LANE_NAMES = ['G', 'P', 'H'] as const;

/** slingshots: three corners, the kicking face is a → c */
export const SLINGS: { a: V; b: V; c: V }[] = [
	{ a: { x: 88, y: 545 }, b: { x: 88, y: 597 }, c: { x: 122, y: 621 } },
	{ a: { x: 302, y: 545 }, b: { x: 302, y: 597 }, c: { x: 268, y: 621 } }
];
export const BUMPERS: (V & { r: number })[] = [
	{ x: 165, y: 192, r: 22 },
	{ x: 255, y: 192, r: 22 },
	{ x: 210, y: 258, r: 22 }
];
export const TARGET_Y = 420;
export const TARGET_W = 26;
export const TARGET_X = [158, 184, 210, 236] as const; // centres
export const TARGET_NAMES = ['H', 'O', 'L', 'K'] as const;
export const SAUCER = { x: 292, y: 322, r: 14 };
/** the Nuke ramp: entered from the left channel going up, the ball rides it round to the right inlane */
export const RAMP_PATH: V[] = [
	{ x: 41, y: 300 },
	{ x: 44, y: 150 },
	{ x: 106, y: 56 },
	{ x: 210, y: 40 },
	{ x: 300, y: 66 },
	{ x: 322, y: 160 },
	{ x: 316, y: 330 },
	{ x: 316, y: 522 }
];
export const RAMP_TIME = 0.95;
export const FLIPPERS = [
	{ p: { x: 122, y: FLIP_Y }, rest: (28 * Math.PI) / 180, up: (-32 * Math.PI) / 180 },
	{ p: { x: 268, y: FLIP_Y }, rest: Math.PI - (28 * Math.PI) / 180, up: Math.PI + (32 * Math.PI) / 180 }
] as const;
const FLIP_R1 = 11;
const FLIP_R2 = 6;
const FLIP_UP_SPEED = 24;
const FLIP_DOWN_SPEED = 15;

/* ---------- rules ---------- */

export const CAMO_LEVELS = ['NONE', 'GOLD', 'PLATINUM', 'HARMONIC BREAK', 'DIVERGENCE'] as const;
export const STREAKS: { at: number; name: 'uav' | 'airstrike' | 'chopper' | 'nuke'; points: number }[] = [
	{ at: 3, name: 'uav', points: 5_000 },
	{ at: 5, name: 'airstrike', points: 15_000 },
	{ at: 7, name: 'chopper', points: 30_000 },
	{ at: 10, name: 'nuke', points: 100_000 }
];
export const POINTS = {
	bumper: 100,
	sling: 10,
	spin: 25,
	lane: 500,
	target: 750,
	holk: 10_000,
	ramp: 2_500,
	orbit: 5_000,
	saucer: 1_000,
	skill: 15_000,
	camo: 25_000,
	jackpot: 50_000,
	combo: 5_000
};
export const HOLK_TIME = 20;
export const CHOPPER_TIME = 12;
export const BALL_SAVE = 8;
export const MB_SAVE = 12;
export const EXTRA_AT = 300_000;
const COMBO_TIME = 4;

export interface Ball {
	id: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
	/** riding the ramp: 0 → 1 */
	ramp?: number;
	/** held in the saucer: seconds left */
	held?: number;
	/** sitting on the plunger */
	lane?: boolean;
	/** sensors it's inside right now (to fire on entering only) */
	inside: Set<string>;
	/** the last time it moved (for the stuck check) */
	still: number;
	/** when it passed the spinner (an orbit needs the top within 1.4 s) */
	orbitAt: number;
	/** the plunger launched it and it hasn't reached a lane yet (skill shot) */
	skill: boolean;
}

export type PinEvent =
	| { k: 'bumper'; i: number; x: number; y: number; pts: number }
	| { k: 'sling'; i: number; x: number; y: number }
	| { k: 'flip'; i: number }
	| { k: 'launch'; power: number }
	| { k: 'lane'; i: number; x: number; y: number; pts: number }
	| { k: 'camo'; level: number; pts: number }
	| { k: 'target'; i: number; x: number; y: number; pts: number }
	| { k: 'holk'; pts: number }
	| { k: 'ramp'; pts: number; x: number; y: number }
	| { k: 'jackpot'; pts: number; x: number; y: number }
	| { k: 'streak'; name: 'uav' | 'airstrike' | 'chopper' | 'nuke'; pts: number; kills: number }
	| { k: 'kill'; kills: number }
	| { k: 'spinner'; n: number; pts: number; x: number; y: number }
	| { k: 'orbit'; pts: number; x: number; y: number }
	| { k: 'combo'; n: number; pts: number }
	| { k: 'saucer'; locks: number; pts: number; x: number; y: number }
	| { k: 'multiball' }
	| { k: 'eject' }
	| { k: 'kickback' }
	| { k: 'skill'; pts: number; x: number; y: number }
	| { k: 'saved' }
	| { k: 'drain'; last: boolean }
	| { k: 'bonus'; base: number; mult: number; total: number; tilted: boolean }
	| { k: 'extra' }
	| { k: 'warn'; n: number }
	| { k: 'tilt' }
	| { k: 'ballStart'; ball: number }
	| { k: 'over'; score: number }
	| { k: 'wall'; speed: number };

export type Phase = 'ready' | 'play' | 'bonus' | 'over';

/* ---------- geometry ---------- */

function closest(p: V, a: V, b: V): { x: number; y: number; t: number } {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const l2 = dx * dx + dy * dy || 1;
	const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
	return { x: a.x + t * dx, y: a.y + t * dy, t };
}

/** push the ball out of a capsule (point c, radius rad) and bounce; returns the speed into it, or 0 */
function bounce(b: Ball, cx: number, cy: number, rad: number, e: number, fallback?: V, surf?: V): number {
	let nx = b.x - cx;
	let ny = b.y - cy;
	let d = Math.hypot(nx, ny);
	const min = R + rad;
	if (d >= min) return 0;
	if (d < 1e-6) {
		nx = fallback?.x ?? 0;
		ny = fallback?.y ?? -1;
		d = 1;
	} else {
		nx /= d;
		ny /= d;
	}
	b.x = cx + nx * min;
	b.y = cy + ny * min;
	const sx = surf?.x ?? 0;
	const sy = surf?.y ?? 0;
	let rx = b.vx - sx;
	let ry = b.vy - sy;
	const vn = rx * nx + ry * ny;
	if (vn >= 0) return 0;
	rx -= (1 + e) * vn * nx;
	ry -= (1 + e) * vn * ny;
	// a little rolling friction along the surface
	const tn = rx * -ny + ry * nx;
	rx -= tn * 0.004 * -ny;
	ry -= tn * 0.004 * nx;
	b.vx = rx + sx;
	b.vy = ry + sy;
	return -vn;
}

const STATIC: Seg[] = [
	...ARCH.slice(1).map((p, i) => ({ a: ARCH[i], b: p, e: 0.3 })),
	...WALLS.map(([a, b]) => ({ a, b, e: 0.35 })),
	...DIVIDERS.map((x) => ({ a: { x, y: LANE_TOP }, b: { x, y: LANE_BOT }, e: 0.4, r: 3, kind: 'post' as const })),
	...SLINGS.flatMap((s) => [
		{ a: s.a, b: s.b, e: 0.35 },
		{ a: s.b, b: s.c, e: 0.35 }
	])
];

/** a catmull-rom point on the ramp path at t ∈ [0, 1] */
export function rampPoint(t: number): V {
	const n = RAMP_PATH.length - 1;
	const f = Math.max(0, Math.min(0.99999, t)) * n;
	const i = Math.floor(f);
	const u = f - i;
	const p0 = RAMP_PATH[Math.max(0, i - 1)];
	const p1 = RAMP_PATH[i];
	const p2 = RAMP_PATH[i + 1];
	const p3 = RAMP_PATH[Math.min(n, i + 2)];
	const c = (a: number, b: number, c2: number, d: number) =>
		0.5 * (2 * b + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d) * u * u + (-a + 3 * b - 3 * c2 + d) * u * u * u);
	return { x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y) };
}

export function flipperTip(i: number, angle: number): V {
	const f = FLIPPERS[i];
	return { x: f.p.x + FLIP_LEN * Math.cos(angle), y: f.p.y + FLIP_LEN * Math.sin(angle) };
}

/* ---------- the game ---------- */

export class PinballGame {
	readonly rnd: () => number;
	phase: Phase = 'ready';
	balls: Ball[] = [];
	time = 0;
	score = 0;
	/** ball number (1-based) and balls still to play after this one */
	ball = 1;
	left = BALLS - 1;
	/** the flippers: angle, angular speed, held */
	flip = FLIPPERS.map((f) => ({ a: f.rest, w: 0, held: false }));
	plunger = 0;
	plungerHeld = false;

	lanes = [false, false, false];
	camo = 0;
	targets = [true, true, true, true];
	targetsBackAt = 0;
	holkUntil = 0;
	chopperUntil = 0;
	kickback = true;
	kills = 0;
	nuked = false;
	locks = 0;
	multiball = false;
	jackpot = POINTS.jackpot;
	saveUntil = 0;
	skillLane: number;
	comboN = 0;
	lastShot = -99;
	bonusBase = 0;
	extraGiven = false;
	warnings = 0;
	lastNudge = -99;
	tilted = false;
	/** the end-of-ball bonus being shown */
	bonus: { base: number; mult: number; total: number; until: number } | null = null;
	/** balls waiting to be auto-launched (multiball / ball save), with when */
	queue: number[] = [];
	spins = 0;

	events: PinEvent[] = [];
	#nextId = 1;
	#acc = 0;

	constructor(seed: number) {
		this.rnd = rng(seed);
		this.skillLane = Math.floor(this.rnd() * 3);
		this.#newBallInLane();
		this.events.push({ k: 'ballStart', ball: 1 });
	}

	/** the score multiplier right now (Holk Time) */
	get mult(): number {
		return this.time < this.holkUntil ? 2 : 1;
	}
	get bonusMult(): number {
		return this.camo + 1;
	}
	get live(): Ball[] {
		return this.balls;
	}

	take(): PinEvent[] {
		const e = this.events;
		this.events = [];
		return e;
	}

	#add(p: number): number {
		if (this.tilted) return 0;
		const pts = Math.round(p * this.mult);
		const before = this.score;
		this.score += pts;
		if (!this.extraGiven && before < EXTRA_AT && this.score >= EXTRA_AT) {
			this.extraGiven = true;
			this.left++;
			this.events.push({ k: 'extra' });
		}
		return pts;
	}

	#newBallInLane(): Ball {
		const b: Ball = { id: this.#nextId++, x: LAUNCH.x, y: LAUNCH.y, vx: 0, vy: 0, lane: true, inside: new Set(), still: 0, orbitAt: -99, skill: false };
		this.balls.push(b);
		return b;
	}

	/* ---------- input ---------- */

	setFlipper(i: 0 | 1, down: boolean): void {
		const f = this.flip[i];
		if (down && !f.held && !this.tilted && this.phase !== 'over' && this.phase !== 'bonus') {
			this.events.push({ k: 'flip', i });
			// lane change: the lit lanes move with the flipper
			if (i === 0) this.lanes.push(this.lanes.shift()!);
			else this.lanes.unshift(this.lanes.pop()!);
		}
		f.held = down;
	}
	setPlunger(down: boolean): void {
		if (this.plungerHeld && !down) this.#release(this.plunger);
		this.plungerHeld = down;
		if (!down) this.plunger = 0;
	}
	/** shake the table: helps a ball out of trouble; too much = TILT */
	nudge(): void {
		if (this.phase === 'over' || this.phase === 'bonus' || this.tilted) return;
		const dir = this.rnd() < 0.5 ? -1 : 1;
		for (const b of this.balls) {
			if (b.lane || b.ramp !== undefined || b.held !== undefined) continue;
			b.vx += dir * 110;
			b.vy -= 150;
		}
		if (this.time - this.lastNudge < 2.5) {
			this.warnings++;
			if (this.warnings >= 3) {
				this.tilted = true;
				this.flip.forEach((f) => (f.held = false));
				this.events.push({ k: 'tilt' });
			} else this.events.push({ k: 'warn', n: this.warnings });
		}
		this.lastNudge = this.time;
	}

	#release(power: number): void {
		const b = this.balls.find((x) => x.lane);
		if (!b) return;
		this.#launch(b, power);
	}
	#launch(b: Ball, power: number): void {
		b.lane = false;
		b.vy = -(950 + 1550 * Math.max(0.08, Math.min(1, power)));
		b.vx = 0;
		b.skill = this.phase === 'ready';
		if (this.phase === 'ready') {
			this.phase = 'play';
			this.saveUntil = this.time + BALL_SAVE;
		}
		this.events.push({ k: 'launch', power });
	}

	/* ---------- time ---------- */

	/** advance by dt seconds (the page calls it every frame) */
	update(dt: number): void {
		this.#acc += Math.min(0.1, Math.max(0, dt));
		const step = 1 / 60;
		while (this.#acc >= step) {
			this.#acc -= step;
			this.#tick(step);
		}
	}

	#tick(dt: number): void {
		this.time += dt;
		if (this.phase === 'over') return;
		if (this.phase === 'bonus') {
			if (this.bonus && this.time >= this.bonus.until) this.#afterBonus();
			return;
		}
		if (this.plungerHeld) this.plunger = Math.min(1, this.plunger + dt / 0.9);
		if (this.time - this.lastNudge > 5 && this.warnings > 0) this.warnings = 0;
		if (!this.targets.some(Boolean) && this.targetsBackAt && this.time >= this.targetsBackAt) {
			this.targets = [true, true, true, true];
			this.targetsBackAt = 0;
		}
		// queued auto-launches
		for (let i = this.queue.length - 1; i >= 0; i--) {
			if (this.time >= this.queue[i] && !this.balls.some((b) => b.lane)) {
				this.queue.splice(i, 1);
				const b = this.#newBallInLane();
				this.#launch(b, 0.72 + this.rnd() * 0.12);
			}
		}
		const h = dt / SUB;
		for (let s = 0; s < SUB; s++) {
			this.#moveFlippers(h);
			for (const b of [...this.balls]) this.#moveBall(b, h);
		}
		this.#checkDrains();
	}

	#moveFlippers(h: number): void {
		FLIPPERS.forEach((f, i) => {
			const st = this.flip[i];
			const target = st.held ? f.up : f.rest;
			const dir = Math.sign(target - st.a);
			const speed = st.held ? FLIP_UP_SPEED : FLIP_DOWN_SPEED;
			let na = st.a + dir * speed * h;
			if ((dir > 0 && na > target) || (dir < 0 && na < target)) na = target;
			st.w = (na - st.a) / h;
			st.a = na;
		});
	}

	#moveBall(b: Ball, h: number): void {
		if (b.ramp !== undefined) {
			b.ramp += h / RAMP_TIME;
			const p = rampPoint(b.ramp);
			b.x = p.x;
			b.y = p.y;
			if (b.ramp >= 1) {
				b.ramp = undefined;
				const end = RAMP_PATH[RAMP_PATH.length - 1];
				b.x = end.x;
				b.y = end.y;
				b.vx = 0;
				b.vy = 260;
			}
			return;
		}
		if (b.held !== undefined) {
			b.held -= h;
			b.x = SAUCER.x;
			b.y = SAUCER.y;
			if (b.held <= 0) {
				b.held = undefined;
				b.inside.add('saucer');
				b.vx = -430 - this.rnd() * 120;
				b.vy = 360 + this.rnd() * 80;
				this.events.push({ k: 'eject' });
			}
			return;
		}
		if (b.lane) {
			// resting on the plunger, which pulls it down a little while held
			b.x = LAUNCH.x;
			b.y = LAUNCH.y + this.plunger * 22;
			b.vx = 0;
			b.vy = 0;
			return;
		}
		b.vy += G * h;
		const sp = Math.hypot(b.vx, b.vy);
		if (sp > VMAX) {
			b.vx *= VMAX / sp;
			b.vy *= VMAX / sp;
		}
		b.x += b.vx * h;
		b.y += b.vy * h;
		this.#collide(b);
		this.#sensors(b);
		if (Math.hypot(b.vx, b.vy) > 25) b.still = this.time;
		else if (this.time - b.still > 2.5) {
			// stuck somewhere: a little kick
			b.vx += (this.rnd() - 0.5) * 300;
			b.vy -= 200;
			b.still = this.time;
		}
		if (b.x < 0 || b.x > W || b.y < -40 || !Number.isFinite(b.x) || !Number.isFinite(b.y)) {
			// never lose a ball off the table: back on the plunger
			Object.assign(b, { x: LAUNCH.x, y: LAUNCH.y, vx: 0, vy: 0, lane: true });
		}
	}

	#collide(b: Ball): void {
		for (const s of STATIC) {
			const c = closest(b, s.a, s.b);
			const hit = bounce(b, c.x, c.y, s.r ?? 0, s.e);
			if (hit > 600) this.events.push({ k: 'wall', speed: hit });
		}
		// the gate: only from the table side
		{
			const [a, c2] = GATE;
			const nx = a.y - c2.y;
			const ny = c2.x - a.x;
			if ((b.x - a.x) * nx + (b.y - a.y) * ny < 0) {
				const c = closest(b, a, c2);
				bounce(b, c.x, c.y, 0, 0.35);
			}
		}
		// slingshot faces kick
		SLINGS.forEach((s, i) => {
			const c = closest(b, s.a, s.c);
			const nx = s.c.y - s.a.y;
			const ny = -(s.c.x - s.a.x);
			const l = Math.hypot(nx, ny);
			const sign = i === 0 ? 1 : -1;
			const hit = bounce(b, c.x, c.y, 0, 0.3, { x: (sign * nx) / l, y: (sign * ny) / l });
			if (hit > 90 && !this.tilted) {
				const kx = (sign * nx) / l;
				const ky = (sign * ny) / l;
				b.vx += kx * 620;
				b.vy += ky * 620;
				this.#add(POINTS.sling);
				this.bonusBase += 10;
				this.events.push({ k: 'sling', i, x: c.x, y: c.y });
			}
		});
		// bumpers
		BUMPERS.forEach((p, i) => {
			const hit = bounce(b, p.x, p.y, p.r, 0.5);
			if (hit > 0) {
				if (!this.tilted) {
					const nx = (b.x - p.x) / (p.r + R);
					const ny = (b.y - p.y) / (p.r + R);
					const vn = b.vx * nx + b.vy * ny;
					const kick = 760;
					if (vn < kick) {
						b.vx += nx * (kick - vn);
						b.vy += ny * (kick - vn);
					}
				}
				const base = POINTS.bumper * (this.time < this.chopperUntil ? 5 : 1);
				const pts = this.#add(base);
				this.bonusBase += 50;
				this.events.push({ k: 'bumper', i, x: p.x, y: p.y, pts });
			}
		});
		// drop targets (the face blocks from both sides while it's up)
		TARGET_X.forEach((x, i) => {
			if (!this.targets[i]) return;
			const c = closest(b, { x: x - TARGET_W / 2 + 2, y: TARGET_Y }, { x: x + TARGET_W / 2 - 2, y: TARGET_Y });
			const hit = bounce(b, c.x, c.y, 3, 0.45);
			if (hit > 120) {
				this.targets[i] = false;
				const pts = this.#add(POINTS.target);
				this.bonusBase += 500;
				this.events.push({ k: 'target', i, x, y: TARGET_Y, pts });
				if (!this.targets.some(Boolean)) this.#holk();
			}
		});
		// flippers
		FLIPPERS.forEach((f, i) => {
			const st = this.flip[i];
			const tip = flipperTip(i, st.a);
			const c = closest(b, f.p, tip);
			const rad = FLIP_R1 + (FLIP_R2 - FLIP_R1) * c.t;
			const qx = c.x - f.p.x;
			const qy = c.y - f.p.y;
			bounce(b, c.x, c.y, rad, 0.32, { x: 0, y: -1 }, { x: -st.w * qy, y: st.w * qx });
		});
	}

	#sensors(b: Ball): void {
		const enter = (key: string, inside: boolean): boolean => {
			if (inside) {
				if (b.inside.has(key)) return false;
				b.inside.add(key);
				return true;
			}
			b.inside.delete(key);
			return false;
		};
		// G / P / H lanes
		for (let i = 0; i < 3; i++) {
			const x0 = DIVIDERS[i];
			const x1 = DIVIDERS[i + 1];
			if (enter(`lane${i}`, b.x > x0 && b.x < x1 && b.y > LANE_TOP + 4 && b.y < LANE_BOT - 4)) this.#lane(b, i, (x0 + x1) / 2);
		}
		if (b.skill && b.y > 330) b.skill = false;
		// the Nuke ramp's mouth
		if (enter('ramp', b.x < RAMP_X && b.y > 285 && b.y < 312) && b.vy < -200 && !this.tilted) {
			b.ramp = 0;
			b.inside.clear();
			this.#ramp();
			return;
		}
		// the spinner in the orbit
		if (enter('spin', b.x > ORBIT_X && b.x < LANE_X && b.y > 372 && b.y < 392) && b.vy < -120) {
			const n = Math.max(1, Math.min(12, Math.floor(-b.vy / 140)));
			this.spins += n;
			const pts = this.#add(POINTS.spin * n);
			this.bonusBase += 10 * n;
			b.orbitAt = this.time;
			this.events.push({ k: 'spinner', n, pts, x: (ORBIT_X + LANE_X) / 2, y: 382 });
		}
		// the top of the arch on the left: a full orbit
		if (enter('orbit', b.x > 40 && b.x < 110 && b.y > 55 && b.y < 135) && b.vx < 0 && this.time - b.orbitAt < 1.6) {
			b.orbitAt = -99;
			const pts = this.#add(POINTS.orbit);
			this.bonusBase += 1000;
			this.events.push({ k: 'orbit', pts, x: 75, y: 95 });
			this.#shot();
		}
		// the stash saucer
		const sd = Math.hypot(b.x - SAUCER.x, b.y - SAUCER.y);
		if (enter('saucer', sd < SAUCER.r - 2) && Math.hypot(b.vx, b.vy) < 1150 && !this.tilted) this.#saucer(b);
		// kickback in the left outlane
		if (enter('kick', b.x < RAMP_X - 2 && b.y > 690 && b.y < 722) && b.vy > 0 && this.kickback && !this.tilted) {
			this.kickback = false;
			b.vx = 0;
			b.vy = -1750;
			this.events.push({ k: 'kickback' });
		}
	}

	#lane(b: Ball, i: number, x: number): void {
		if (this.tilted) return;
		if (b.skill) {
			b.skill = false;
			if (i === this.skillLane) {
				const pts = this.#add(POINTS.skill);
				this.events.push({ k: 'skill', pts, x, y: 100 });
			}
		}
		const pts = this.#add(POINTS.lane);
		this.bonusBase += 250;
		this.lanes[i] = true;
		this.events.push({ k: 'lane', i, x, y: 100, pts });
		if (this.lanes.every(Boolean)) {
			this.lanes = [false, false, false];
			if (this.camo < 4) this.camo++;
			const pts2 = this.#add(POINTS.camo * this.camo);
			this.events.push({ k: 'camo', level: this.camo, pts: pts2 });
		}
	}

	#holk(): void {
		const pts = this.#add(POINTS.holk);
		this.holkUntil = this.time + HOLK_TIME;
		this.kickback = true;
		this.targetsBackAt = this.time + 1.2;
		this.events.push({ k: 'holk', pts });
		this.#kill();
	}

	#ramp(): void {
		if (this.multiball) {
			const pts = this.#add(this.jackpot);
			this.events.push({ k: 'jackpot', pts, x: 41, y: 300 });
			this.jackpot += 25_000;
		} else {
			const pts = this.#add(POINTS.ramp);
			this.events.push({ k: 'ramp', pts, x: 41, y: 300 });
		}
		this.bonusBase += 1000;
		this.#shot();
		this.#kill();
	}

	#kill(): void {
		this.kills++;
		const s = STREAKS.find((x) => x.at === this.kills);
		if (s) {
			let pts = this.#add(s.points);
			if (s.name === 'chopper') this.chopperUntil = this.time + CHOPPER_TIME;
			if (s.name === 'nuke') {
				this.kills = 0;
				if (!this.nuked) {
					this.nuked = true;
					this.left++;
					this.events.push({ k: 'extra' });
				}
			}
			this.events.push({ k: 'streak', name: s.name, pts, kills: s.at });
		} else this.events.push({ k: 'kill', kills: this.kills });
	}

	#shot(): void {
		if (this.time - this.lastShot < COMBO_TIME) {
			this.comboN++;
			const pts = this.#add(POINTS.combo * this.comboN);
			this.events.push({ k: 'combo', n: this.comboN + 1, pts });
		} else this.comboN = 0;
		this.lastShot = this.time;
	}

	#saucer(b: Ball): void {
		b.held = 1.1;
		b.vx = 0;
		b.vy = 0;
		const pts = this.#add(POINTS.saucer * (this.multiball ? 25 : 1));
		this.bonusBase += 1000;
		if (!this.multiball) this.locks++;
		this.events.push({ k: 'saucer', locks: this.locks, pts, x: SAUCER.x, y: SAUCER.y });
		if (!this.multiball && this.locks >= 3) {
			this.locks = 0;
			this.multiball = true;
			this.jackpot = POINTS.jackpot;
			this.saveUntil = this.time + MB_SAVE;
			this.queue.push(this.time + 0.6, this.time + 1.4);
			this.events.push({ k: 'multiball' });
		}
	}

	#checkDrains(): void {
		for (let i = this.balls.length - 1; i >= 0; i--) {
			const b = this.balls[i];
			if (b.y <= H + 14 || b.ramp !== undefined) continue;
			this.balls.splice(i, 1);
			if (this.time < this.saveUntil && !this.tilted) {
				this.events.push({ k: 'saved' });
				this.queue.push(this.time + 0.5);
				continue;
			}
			const last = this.balls.length === 0 && this.queue.length === 0;
			this.events.push({ k: 'drain', last });
			if (this.multiball && this.balls.length + this.queue.length <= 1) this.multiball = false;
			if (last) this.#endBall();
		}
	}

	#endBall(): void {
		this.multiball = false;
		this.kills = 0;
		this.holkUntil = 0;
		this.chopperUntil = 0;
		const base = this.tilted ? 0 : this.bonusBase;
		const mult = this.bonusMult;
		const total = base * mult;
		this.score += total;
		this.bonus = { base, mult, total, until: this.time + 2.6 };
		this.events.push({ k: 'bonus', base, mult, total, tilted: this.tilted });
		this.phase = 'bonus';
		this.flip.forEach((f) => (f.held = false));
	}

	#afterBonus(): void {
		this.bonus = null;
		this.bonusBase = 0;
		this.tilted = false;
		this.warnings = 0;
		this.comboN = 0;
		if (this.left <= 0) {
			this.phase = 'over';
			this.events.push({ k: 'over', score: this.score });
			return;
		}
		this.left--;
		this.ball++;
		this.phase = 'ready';
		this.skillLane = Math.floor(this.rnd() * 3);
		this.kickback = this.kickback || this.ball === 2;
		this.#newBallInLane();
		this.events.push({ k: 'ballStart', ball: this.ball });
	}
}
