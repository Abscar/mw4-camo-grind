/**
 * Abscars Madness ragdolls (2026-11-28, the user: "ett ragdoll-system till gubbarna … så att de trillar ihop lite
 * mer verkligt när de dör"). Pure: a dead body is 13 points (head, two shoulders, two hips, elbows, hands, knees,
 * feet) held together by sticks, stepped with position-based dynamics: gravity, then the sticks are pulled back to
 * length a few times, then every point is pushed out of the floor, ledges and walls. Hinges (knees, elbows) only
 * bend one way, hips have a range, the neck can tilt but not fold, the torso can slump a little. So a body hit in
 * the head snaps back, one hit in the chest folds at the waist, limbs flop over ledges and settle on the floor.
 * Coordinates are world units; the local rest pose is the painter's (feet at 0, y up negative, +x = facing).
 */

export type Pt = { x: number; y: number; px: number; py: number; vx: number; vy: number; w: number; r: number };

/** point indices */
export const R = { shF: 0, shB: 1, hipF: 2, hipB: 3, head: 4, elF: 5, handF: 6, elB: 7, handB: 8, kneeF: 9, footF: 10, kneeB: 11, footB: 12 } as const;

/** rest pose in the painter's local frame (feet at 0, facing +x) */
export const REST: [number, number][] = [
	[6, -68], // shF
	[-6.5, -67.4], // shB
	[4.4, -43], // hipF
	[-4.4, -43], // hipB
	[1.2, -82], // head
	[8.2, -54.4], // elF
	[9, -42], // handF
	[-6.8, -54], // elB
	[-9, -44], // handB
	[6.4, -24], // kneeF
	[5, -6.6], // footF
	[-3.4, -24], // kneeB
	[-5, -6.6], // footB
];

/** inverse mass (heavier torso) and collision radius per point */
const W_INV = [0.5, 0.5, 0.5, 0.5, 1, 1, 1.2, 1, 1.2, 1, 1.2, 1, 1.2];
const RAD = [4.5, 4.5, 5, 5, 7.6, 3, 3, 3, 3, 3.5, 2.5, 3.5, 2.5];

interface Stick {
	a: number;
	b: number;
	min: number;
	max: number;
}

interface Hinge {
	/** root, middle, tip; the sign the bend must keep (cross of root→mid, mid→tip) */
	a: number;
	m: number;
	b: number;
	sign: number;
}

export interface Rag {
	p: Pt[];
	sticks: Stick[];
	hinges: Hinge[];
	facing: 1 | -1;
	s: number;
	/** seconds the body has been almost still */
	calm: number;
	asleep: boolean;
}

export interface RagWorld {
	floor: number;
	onGround(x: number): boolean;
	plats: { x: number; y: number; w: number }[];
	solids: { x: number; y: number; w: number; h: number }[];
	gravity: number;
}

function stick(p: Pt[], a: number, b: number, lo = 1, hi = 1): Stick {
	const d = Math.hypot(p[a].x - p[b].x, p[a].y - p[b].y);
	return { a, b, min: d * lo, max: d * hi };
}

function cross(p: Pt[], a: number, m: number, b: number) {
	const ux = p[m].x - p[a].x, uy = p[m].y - p[a].y;
	const vx = p[b].x - p[m].x, vy = p[b].y - p[m].y;
	return ux * vy - uy * vx;
}

/**
 * A ragdoll standing where the fighter stood (feet at x, y), already moving: `vx/vy` for the whole body, plus the
 * hit's kick (`kx/ky`) mostly on the part that was hit, so the body turns the way a hit would turn it.
 * `jit` = a random number 0–1 for small differences between bodies.
 */
export function makeRag(x: number, y: number, s: number, facing: 1 | -1, vx: number, vy: number, kx: number, ky: number, head: boolean, jit: () => number): Rag {
	const p: Pt[] = REST.map(([lx, ly], i) => ({ x: x + lx * s * facing, y: y + ly * s, px: 0, py: 0, vx: 0, vy: 0, w: W_INV[i], r: RAD[i] * s }));
	// how much of the kick each part gets: the hit part most, the far end least (that's what turns the body)
	const share = head ? [1.2, 1.2, 0.55, 0.55, 2, 1.1, 1.2, 1.1, 1.2, 0.35, 0.25, 0.35, 0.25] : [1.4, 1.4, 1, 1, 1.1, 1.2, 1.3, 1.2, 1.3, 0.55, 0.4, 0.55, 0.4];
	for (let i = 0; i < p.length; i++) {
		const q = p[i];
		q.vx = vx + kx * share[i] + (jit() - 0.5) * 60;
		q.vy = vy + ky * share[i] + (jit() - 0.5) * 50;
		q.px = q.x;
		q.py = q.y;
	}
	const { shF, shB, hipF, hipB, head: hd, elF, handF, elB, handB, kneeF, footF, kneeB, footB } = R;
	const sticks: Stick[] = [
		// torso: a box that can slump a little (the diagonals give)
		stick(p, shF, shB),
		stick(p, hipF, hipB),
		stick(p, shF, hipF, 0.97, 1.02),
		stick(p, shB, hipB, 0.97, 1.02),
		stick(p, shF, hipB, 0.86, 1.04),
		stick(p, shB, hipF, 0.86, 1.04),
		// neck: the head tilts, never folds onto the chest
		stick(p, hd, shF, 0.86, 1.08),
		stick(p, hd, shB, 0.86, 1.08),
		stick(p, hd, hipF, 0.9, 1.06),
		stick(p, hd, hipB, 0.9, 1.06),
		// arms
		stick(p, shF, elF),
		stick(p, elF, handF),
		stick(p, shB, elB),
		stick(p, elB, handB),
		{ a: shF, b: handF, min: 9 * s, max: 99 * s },
		{ a: shB, b: handB, min: 9 * s, max: 99 * s },
		// legs (a knee can't fold completely)
		stick(p, hipF, kneeF),
		stick(p, kneeF, footF),
		stick(p, hipB, kneeB),
		stick(p, kneeB, footB),
		{ a: hipF, b: footF, min: 15 * s, max: 99 * s },
		{ a: hipB, b: footB, min: 15 * s, max: 99 * s },
	];
	const hinges: Hinge[] = [
		{ a: shF, m: elF, b: handF, sign: Math.sign(cross(p, shF, elF, handF)) || 1 },
		{ a: shB, m: elB, b: handB, sign: Math.sign(cross(p, shB, elB, handB)) || 1 },
		{ a: hipF, m: kneeF, b: footF, sign: Math.sign(cross(p, hipF, kneeF, footF)) || 1 },
		{ a: hipB, m: kneeB, b: footB, sign: Math.sign(cross(p, hipB, kneeB, footB)) || 1 },
	];
	return { p, sticks, hinges, facing, s, calm: 0, asleep: false };
}

function solveStick(p: Pt[], k: Stick) {
	const a = p[k.a], b = p[k.b];
	const dx = b.x - a.x, dy = b.y - a.y;
	const d = Math.hypot(dx, dy) || 1e-6;
	const want = d < k.min ? k.min : d > k.max ? k.max : d;
	if (want === d) return;
	const wsum = a.w + b.w;
	const f = (d - want) / d / wsum;
	a.x += dx * f * a.w;
	a.y += dy * f * a.w;
	b.x -= dx * f * b.w;
	b.y -= dy * f * b.w;
}

/** A knee / elbow bent the wrong way is pushed back through straight (half way per pass, so it never pops). */
function solveHinge(p: Pt[], h: Hinge) {
	const c = cross(p, h.a, h.m, h.b) * h.sign;
	if (c >= 0) return;
	const a = p[h.a], m = p[h.m], b = p[h.b];
	const lx = b.x - a.x, ly = b.y - a.y;
	const l2 = lx * lx + ly * ly || 1e-6;
	const t = ((m.x - a.x) * lx + (m.y - a.y) * ly) / l2;
	// mirror the middle joint across the root–tip line, a little past it
	const fx = a.x + lx * t, fy = a.y + ly * t;
	const dx = (fx * 2 - m.x - m.x) * 0.5, dy = (fy * 2 - m.y - m.y) * 0.5;
	// the middle moves one way, the two ends the other (so a knee pinned on the floor still straightens: the foot moves)
	const ws = m.w + (a.w + b.w) / 2;
	const km = m.w / ws, ke = 1 - km;
	m.x += dx * km;
	m.y += dy * km;
	a.x -= dx * ke * 0.5;
	a.y -= dy * ke * 0.5;
	b.x -= dx * ke * 0.5;
	b.y -= dy * ke * 0.5;
}

/** Hips: the thigh may swing forward a lot but backward only a little (in the body's own frame). */
function solveHip(rag: Rag, hip: number, knee: number) {
	const p = rag.p;
	const sx = (p[R.shF].x + p[R.shB].x) / 2, sy = (p[R.shF].y + p[R.shB].y) / 2;
	const hx = (p[R.hipF].x + p[R.hipB].x) / 2, hy = (p[R.hipF].y + p[R.hipB].y) / 2;
	const down = Math.atan2(hy - sy, hx - sx);
	const h = p[hip], k = p[knee];
	const th = Math.atan2(k.y - h.y, k.x - h.x);
	let rel = th - down;
	while (rel > Math.PI) rel -= Math.PI * 2;
	while (rel < -Math.PI) rel += Math.PI * 2;
	// forward = towards the body's facing side; in world angles that's -facing (y down)
	const fwd = -rel * rag.facing;
	const lo = -0.6, hi = 2.1;
	if (fwd >= lo && fwd <= hi) return;
	const target = down - (fwd < lo ? lo : hi) * rag.facing;
	const len = Math.hypot(k.x - h.x, k.y - h.y);
	const nx = h.x + Math.cos(target) * len, ny = h.y + Math.sin(target) * len;
	// equal and opposite (knee one way, hip the other) so the limit never pushes the whole body along
	const dx = (nx - k.x) * 0.4, dy = (ny - k.y) * 0.4;
	const kk = k.w / (k.w + h.w), kh = 1 - kk;
	k.x += dx * kk;
	k.y += dy * kk;
	h.x -= dx * kh;
	h.y -= dy * kh;
}

function collide(q: Pt, w: RagWorld): boolean {
	let hit = false;
	const r = q.r;
	// the floor (pits have none)
	if (q.y > w.floor - r && q.py <= w.floor - r + 24 && w.onGround(q.x)) {
		q.y = w.floor - r;
		hit = true;
	}
	// one-way ledges: only from above
	for (const pl of w.plats) {
		if (q.x > pl.x && q.x < pl.x + pl.w && q.py <= pl.y - r + 0.5 && q.y > pl.y - r) {
			q.y = pl.y - r;
			hit = true;
		}
	}
	// walls, crates, doors: out the way it came in
	for (const s of w.solids) {
		if (q.x <= s.x - r || q.x >= s.x + s.w + r || q.y <= s.y - r || q.y >= s.y + s.h + r) continue;
		if (q.py <= s.y - r + 0.5) {
			q.y = s.y - r;
			hit = true;
		} else if (q.py >= s.y + s.h + r - 0.5) q.y = s.y + s.h + r;
		else if (q.px <= s.x - r + 0.5 || q.x < s.x + s.w / 2) q.x = s.x - r;
		else q.x = s.x + s.w + r;
	}
	return hit;
}

const SUB = 1 / 120;

/** Move a ragdoll forward by dt. Returns true while it's still moving. */
export function stepRag(rag: Rag, dt: number, w: RagWorld): boolean {
	if (rag.asleep) return false;
	const n = Math.min(8, Math.max(1, Math.ceil(dt / SUB)));
	const h = dt / n;
	const p = rag.p;
	let moved = 0;
	for (let sub = 0; sub < n; sub++) {
		for (const q of p) {
			q.vy += w.gravity * h;
			const drag = 1 - 0.35 * h;
			q.vx *= drag;
			q.vy *= drag;
			q.px = q.x;
			q.py = q.y;
			q.x += q.vx * h;
			q.y += q.vy * h;
		}
		const ground: boolean[] = [];
		for (let it = 0; it < 6; it++) {
			for (const k of rag.sticks) solveStick(p, k);
			for (const hg of rag.hinges) solveHinge(p, hg);
			solveHip(rag, R.hipF, R.kneeF);
			solveHip(rag, R.hipB, R.kneeB);
			for (const hg of rag.hinges) solveHinge(p, hg);
			for (let i = 0; i < p.length; i++) if (collide(p[i], w)) ground[i] = true;
		}
		for (let i = 0; i < p.length; i++) {
			const q = p[i];
			let nvx = (q.x - q.px) / h, nvy = (q.y - q.py) / h;
			if (ground[i]) {
				// resting on something: a small bounce, lots of friction
				if (nvy < 0) nvy *= 0.25;
				nvx *= 0.82;
			}
			q.vx = nvx;
			q.vy = nvy;
			moved += Math.abs(q.x - q.px) + Math.abs(q.y - q.py);
		}
	}
	// asleep once it has hardly moved for a while (or fell out of the world)
	const per = moved / (p.length * n);
	rag.calm = per < 0.03 ? rag.calm + dt : 0;
	if (rag.calm > 0.6) {
		rag.asleep = true;
		for (const q of p) q.vx = q.vy = 0;
	}
	return !rag.asleep;
}

/** Push a ragdoll (a blast, a bullet): every point within `rad` of (x, y), more the closer it is. */
export function pushRag(rag: Rag, x: number, y: number, rad: number, ix: number, iy: number) {
	let any = false;
	for (const q of rag.p) {
		const d = Math.hypot(q.x - x, q.y - y);
		if (d > rad) continue;
		const k = 1 - d / rad;
		q.vx += ix * k;
		q.vy += iy * k;
		any = true;
	}
	if (any) {
		rag.asleep = false;
		rag.calm = 0;
	}
	return any;
}

/** The point a bullet segment passes closest to, if within its radius (+ slack). */
export function ragHit(rag: Rag, x0: number, y0: number, x1: number, y1: number, slack = 2): number {
	const lx = x1 - x0, ly = y1 - y0;
	const l2 = lx * lx + ly * ly || 1e-6;
	let best = -1, bd = Infinity;
	for (let i = 0; i < rag.p.length; i++) {
		const q = rag.p[i];
		const t = Math.max(0, Math.min(1, ((q.x - x0) * lx + (q.y - y0) * ly) / l2));
		const d = Math.hypot(x0 + lx * t - q.x, y0 + ly * t - q.y);
		if (d < q.r + slack && d < bd) {
			bd = d;
			best = i;
		}
	}
	return best;
}

/** Middle of the body (for the camera, fades, pickups). */
export function ragCenter(rag: Rag) {
	let x = 0, y = 0, vx = 0, vy = 0;
	for (const q of rag.p) {
		x += q.x;
		y += q.y;
		vx += q.vx;
		vy += q.vy;
	}
	const n = rag.p.length;
	return { x: x / n, y: y / n, vx: vx / n, vy: vy / n };
}
