/**
 * Nuke Run (BurgiArcade, 2026-11-22): the pure rules of the side-scrolling runner. An operator sprints right
 * through a burning city; the course (obstacles + burger coins) comes from the seed and the distance only, so
 * the daily challenge gives everyone the same run. The runner's jump / slide physics and the hit boxes live
 * here too, so the game (NukeRun.svelte) and the test (scripts/arcade-nukerun.test.js, whose bot proves every
 * course can be cleared) use the very same numbers. No DOM, no runes.
 *
 * Units: logical pixels of the game's 800 × 600 screen. World x grows to the right; `dist` = the runner's
 * world x. Heights (`h`) are measured upwards from the ground surface.
 */
import { rng } from '#lib/arcade/rng.ts';

/** The game's logical screen. */
export const W = 800;
export const H = 600;
/** Screen y of the ground surface. */
export const GROUND_Y = 472;
/** Screen x of the runner's centre. */
export const PLAYER_X = 190;
/** World pixels per metre (the score counts metres). */
export const PX_PER_M = 40;
/** Points per burger coin. */
export const COIN_POINTS = 10;
/** Where the first obstacle starts (world px): ≈ 3.9 s of running to read the controls. */
export const FIRST_AT = 1400;

/** Jump / slide physics (px, s). Falling is a bit heavier than rising: the jump feels punchy, not floaty. */
export const PHYS = {
	gUp: 2400,
	gDown: 3200,
	jumpV: 990,
	/** A slide pressed in the air slams the runner down this fast, then slides on landing. */
	slamV: 1600,
	slideTime: 0.64,
	/** Holding slide keeps it going up to this long. */
	slideMax: 1.15,
	/** A jump pressed this long before landing still happens on landing. */
	buffer: 0.13
} as const;

/** Top speed (m/s): reached around 5,000 m, where only the best are still running. */
export const MAX_SPEED = 25;

/** Running speed (px/s) at world distance x: 9 m/s at the start, ≈ 17.6 at 1,400 m, then still creeping up. */
export function speedAt(x: number): number {
	const m = Math.max(0, x) / PX_PER_M;
	return PX_PER_M * Math.min(MAX_SPEED, 9 + 8 * (1 - Math.exp(-m / 700)) + 0.0012 * m);
}

/** 0 at the start → 1 at 1,400 m: shorter gaps, more combos. */
export const difficultyAt = (x: number): number => Math.min(1, Math.max(0, x / PX_PER_M / 1400));

export type ObstacleKind = 'wire' | 'sandbags' | 'mine' | 'drone' | 'car' | 'strike';

/**
 * Hit boxes (a little smaller than the drawings, so a near miss feels fair). `w` = width from the left edge,
 * `h0`–`h1` = the deadly heights. `act` = what gets you past: jump over, or slide under. `from` = the first
 * metre it can show up (each kind is introduced once, on its own, the first time it's allowed).
 */
export const OBSTACLES: Record<ObstacleKind, { w: number; h0: number; h1: number; act: 'jump' | 'slide'; from: number }> = {
	wire: { w: 66, h0: 0, h1: 32, act: 'jump', from: 0 },
	sandbags: { w: 72, h0: 0, h1: 56, act: 'jump', from: 0 },
	mine: { w: 36, h0: 0, h1: 12, act: 'jump', from: 50 },
	drone: { w: 54, h0: 52, h1: 98, act: 'slide', from: 90 },
	car: { w: 136, h0: 0, h1: 60, act: 'jump', from: 150 },
	strike: { w: 100, h0: 0, h1: 26, act: 'jump', from: 240 }
};

/** An air strike blows up when its crater's left edge is this far in front of the runner (world px). */
export const STRIKE_BLAST_AHEAD = 340;

export interface Obstacle {
	id: number;
	kind: ObstacleKind;
	/** World x of the left edge. */
	x: number;
}
export interface Coin {
	id: number;
	/** World x of the centre. */
	x: number;
	/** Height of the centre above the ground. */
	h: number;
}
/** A box: x relative to its owner (runner: its centre; obstacle: world), h above the ground. */
export interface Box {
	x0: number;
	x1: number;
	h0: number;
	h1: number;
}

export interface Course {
	obstacles: Obstacle[];
	coins: Coin[];
	/** Generate the course up to world x `to` (call it as the runner goes; the result never depends on how). */
	extend(to: number): void;
}

type Pattern = ObstacleKind | 'mines2' | 'jumpSlide' | 'slideJump' | 'strike2';

/** The course for a seed: the same seed always gives the same obstacles and coins. */
export function makeCourse(seed: number): Course {
	const r = rng(seed ^ 0x6e756b65);
	const obstacles: Obstacle[] = [];
	const coins: Coin[] = [];
	let cursor = FIRST_AT;
	let oid = 0;
	let cid = 0;
	const introduced = new Set<ObstacleKind>(['wire', 'sandbags']);
	const recent: Pattern[] = [];

	const add = (kind: ObstacleKind, x: number): Obstacle => {
		const o = { id: oid++, kind, x: Math.round(x) };
		obstacles.push(o);
		return o;
	};
	const coin = (x: number, h: number) => coins.push({ id: cid++, x: Math.round(x), h: Math.round(h) });
	const end = (o: Obstacle) => o.x + OBSTACLES[o.kind].w;

	/** An arc of 5 coins over a jump (the path a normal jump takes). */
	const arc = (from: number, to: number) => {
		const mid = (from + to) / 2;
		const span = Math.max(150, to - from + 110);
		for (let i = 0; i < 5; i++) {
			const f = i / 4;
			coin(mid + (f - 0.5) * span, 106 + 74 * (1 - (2 * f - 1) ** 2));
		}
	};

	function choose(m: number, d: number): Pattern {
		// a kind's first appearance comes alone, so everyone meets it (the game labels it)
		for (const k of ['mine', 'drone', 'car', 'strike'] as const) {
			if (!introduced.has(k) && m >= OBSTACLES[k].from) {
				introduced.add(k);
				return k;
			}
		}
		const opts: [Pattern, number][] = [
			['wire', 1],
			['sandbags', 1]
		];
		if (m >= OBSTACLES.mine.from) opts.push(['mine', 0.9]);
		if (m >= OBSTACLES.drone.from) opts.push(['drone', 1.1]);
		if (m >= OBSTACLES.car.from) opts.push(['car', 0.8]);
		if (m >= OBSTACLES.strike.from) opts.push(['strike', 0.6 + 0.5 * d]);
		if (m >= 320) opts.push(['mines2', 0.45]);
		if (m >= 420) opts.push(['jumpSlide', 0.2 + 0.6 * d]);
		if (m >= 520) opts.push(['slideJump', 0.2 + 0.6 * d]);
		if (m >= 650) opts.push(['strike2', 0.1 + 0.35 * d]);
		// never the same pattern three times in a row
		const banned = recent.length >= 2 && recent[0] === recent[1] ? recent[0] : null;
		const pool = opts.filter(([p]) => p !== banned);
		const total = pool.reduce((s, [, w]) => s + w, 0);
		let x = r() * total;
		for (const [p, w] of pool) {
			x -= w;
			if (x < 0) return p;
		}
		return pool[pool.length - 1][0];
	}

	function segment() {
		const v = speedAt(cursor);
		const d = difficultyAt(cursor);
		const m = cursor / PX_PER_M;
		const p = choose(m, d);
		recent.unshift(p);
		recent.length = Math.min(recent.length, 2);
		const jumpKinds: ObstacleKind[] = ['wire', 'sandbags'];
		let last: Obstacle;

		if (p === 'mines2') {
			const a = add('mine', cursor);
			last = add('mine', end(a) + 56);
			if (r() < 0.3) arc(a.x, end(last));
		} else if (p === 'jumpSlide') {
			// jump a low wall, land and slide straight under a drone
			const a = add(jumpKinds[Math.floor(r() * 2)], cursor);
			last = add('drone', end(a) + v * 0.98 + 40);
		} else if (p === 'slideJump') {
			// slide under a drone, then hop a wall
			const a = add('drone', cursor);
			last = add(jumpKinds[Math.floor(r() * 2)], end(a) + v * 0.56 + 50);
		} else if (p === 'strike2') {
			const a = add('strike', cursor);
			last = add('strike', end(a) + v * 1.15 + 60);
		} else {
			last = add(p, cursor);
			const spec = OBSTACLES[p];
			if (spec.act === 'jump' && r() < 0.2) arc(last.x, end(last));
			if (p === 'drone' && r() < 0.24) for (let i = 0; i < 3; i++) coin(last.x + 3 + i * 24, 18);
		}

		// the gap to the next pattern: time to land + react, plus some air (less as it gets harder)
		const react = 0.55 - 0.25 * d;
		let gap = v * (0.8 + react) + r() * (300 - 180 * d);
		if (r() < 0.16) gap += v * 0.8; // a breather now and then
		const from = end(last);
		// coins in the gap: a line on the ground, or a high line you jump for
		const room = gap - 220;
		const roll = r();
		if (room > 150 && roll < 0.13) {
			const n = Math.min(5, Math.floor(room / 46) + 1);
			const x0 = from + 110 + (room - (n - 1) * 46) / 2;
			for (let i = 0; i < n; i++) coin(x0 + i * 46, 24);
		} else if (room > 120 && roll < 0.19) {
			const x0 = from + 110 + (room - 92) / 2;
			for (let i = 0; i < 3; i++) coin(x0 + i * 46, 168);
		}
		cursor = from + gap;
	}

	return {
		obstacles,
		coins,
		extend(to: number) {
			while (cursor < to) segment();
		}
	};
}

/** The runner's state (the game keeps one; the test's bot too). */
export interface Runner {
	h: number;
	vy: number;
	/** Seconds of slide left (> 0 = sliding). */
	slide: number;
	/** How long the current slide has lasted. */
	slideFor: number;
	jumpBuf: number;
	slideQueued: boolean;
}
export const newRunner = (): Runner => ({ h: 0, vy: 0, slide: 0, slideFor: 0, jumpBuf: 0, slideQueued: false });
export const airborne = (r: Runner): boolean => r.h > 0 || r.vy > 0;

/** Jump pressed (happens now on the ground, or on landing if pressed just before). */
export function pressJump(r: Runner): void {
	r.jumpBuf = PHYS.buffer;
}
/** Slide pressed: slide now, or slam down and slide on landing. */
export function pressSlide(r: Runner): void {
	if (airborne(r)) {
		r.vy = Math.min(r.vy, -PHYS.slamV);
		r.slideQueued = true;
		r.jumpBuf = 0;
	} else {
		r.slide = PHYS.slideTime;
		r.slideFor = 0;
	}
}

/** Advance the runner by dt seconds. Returns what happened (for dust, squash and sound). */
export function stepRunner(r: Runner, dt: number, slideHeld = false): { jumped: boolean; landed: boolean } {
	const ev = { jumped: false, landed: false };
	if (r.jumpBuf > 0 && !airborne(r)) {
		r.vy = PHYS.jumpV;
		r.slide = 0;
		r.slideQueued = false;
		r.jumpBuf = 0;
		ev.jumped = true;
	}
	r.jumpBuf = Math.max(0, r.jumpBuf - dt);
	if (airborne(r)) {
		r.vy -= (r.vy > 0 ? PHYS.gUp : PHYS.gDown) * dt;
		r.h += r.vy * dt;
		if (r.h <= 0) {
			r.h = 0;
			r.vy = 0;
			ev.landed = true;
			if (r.slideQueued) {
				r.slide = PHYS.slideTime;
				r.slideFor = 0;
				r.slideQueued = false;
			}
		}
	}
	if (r.slide > 0) {
		r.slideFor += dt;
		r.slide = slideHeld && r.slideFor < PHYS.slideMax ? Math.max(r.slide - dt, 0.1) : Math.max(0, r.slide - dt);
	}
	return ev;
}

/** The runner's hit box (x relative to its centre). */
export function runnerBox(r: Runner): Box {
	if (r.slide > 0 && !airborne(r)) return { x0: -27, x1: 23, h0: 0, h1: 38 };
	if (airborne(r)) return { x0: -15, x1: 15, h0: r.h + 4, h1: r.h + 80 };
	return { x0: -15, x1: 15, h0: 0, h1: 86 };
}

export const obstacleBox = (o: Obstacle): Box => {
	const s = OBSTACLES[o.kind];
	return { x0: o.x, x1: o.x + s.w, h0: s.h0, h1: s.h1 };
};

/** Does the runner at world x `dist` touch the obstacle? */
export function hits(r: Runner, dist: number, o: Obstacle): boolean {
	const a = runnerBox(r);
	const b = obstacleBox(o);
	return dist + a.x1 > b.x0 && dist + a.x0 < b.x1 && a.h1 > b.h0 && a.h0 < b.h1;
}

/** Does the runner at world x `dist` pick up the coin? (A generous reach: coins should feel easy to grab.) */
export function grabs(r: Runner, dist: number, c: Coin): boolean {
	const a = runnerBox(r);
	const reach = 16;
	return c.x > dist + a.x0 - reach && c.x < dist + a.x1 + reach && c.h > a.h0 - reach && c.h < a.h1 + reach;
}

/** The score: whole metres run + 10 per burger coin. */
export const scoreOf = (dist: number, coins: number): number => Math.max(0, Math.floor(dist / PX_PER_M)) + COIN_POINTS * coins;
