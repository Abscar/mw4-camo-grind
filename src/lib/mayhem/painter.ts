/**
 * Squad Mayhem's character painter, round 4 (2026-11-23, the user: "rita du dom … gör modellerna och spelet lite
 * snyggare, så de ser lite mindre tecknat ut"). Every character (the 7 operators and the 5 enemies) is painted on
 * the canvas from a LOOK, drawn after the user's own model sheets: realistic proportions (head ≈ 1/7 of the
 * height), soft shading with light from above / in front instead of thick outlines, a thin dark edge only for
 * definition, kit details (plate carrier, pouches, belt, holster, knee pads, boots, gloves). Our own drawings.
 * Arms and legs are posed every frame (two-bone IK), so they walk, jump, aim and ragdoll.
 * Local frame: feet at (0, 0), y up is negative, +x = the way they face (the painter flips for facing).
 */
import type { GunKind } from './guns.ts';

type Ctx = CanvasRenderingContext2D;

/** body proportions in world units (the engine's hitboxes use the same numbers) */
export const RIG = { hip: 44, knee: 22, shoulder: 69, neck: 74, head: 82, headR: 7.6, top: 91 } as const;

export type HeadKind = 'endo' | 'abscar' | 'phil' | 'lars' | 'jeeven' | 'ingman' | 'aw' | 'joker' | 'rookie' | 'sweat' | 'breacher' | 'camper' | 'jugg';

export interface Look {
	head: HeadKind;
	skin: string;
	top: string;
	vest: string;
	pouch: string;
	accent: string;
	pants: string;
	knee: string;
	boot: string;
	glove: string;
	/** armoured forearms (Abscar's bronze) */
	forearm?: string;
	/** camo blotches on jacket + trousers */
	camo?: string[];
	/** a long coat / robe: colour, trim, how far down (units above the feet) */
	coat?: { col: string; trim?: string; to: number; stars?: boolean; lapel?: string; inner?: string };
	/** a cape over one shoulder (Abscar) */
	cape?: string;
	/** chest patch */
	patch?: string;
	/** a second patch colour */
	patch2?: string;
	/** the back arm glows (Phillestar's radioactive arm) */
	glowArm?: string;
	ghillie?: string[];
	jugg?: boolean;
	/** boots trimmed in the accent colour */
	bootTrim?: boolean;
	/** heavier build */
	bulk?: number;
	/** a bare terminator-style metal endoskeleton (Abscar, the user's ask 2026-11-23) */
	endo?: boolean;
}

export const LOOKS: Record<string, Look> = {
	// ---- the squad, after the user's model sheet (2026-11-22) ----
	// Abscar = a bare terminator-style endoskeleton in chrome (the user, 2026-11-23: "gör abscar ba till ett terminator exoskeleton")
	abscar: { head: 'endo', endo: true, skin: '#a9b1ba', top: '#a9b1ba', vest: '#7a828c', pouch: '#5a616a', accent: '#ff2a1a', pants: '#a9b1ba', knee: '#a9b1ba', boot: '#8a929c', glove: '#8a929c' },
	phillestar: { head: 'phil', skin: '#c9ced6', top: '#1e1f24', vest: '#26272d', pouch: '#303138', accent: '#f2d02a', pants: '#1e1f24', knee: '#16171b', boot: '#1a1a1e', glove: '#1a1a1e', patch: '#f2c02a', patch2: '#d8322b', glowArm: '#9dff4a', bootTrim: true },
	lars: { head: 'lars', skin: '#8a5a3a', top: '#18191b', vest: '#222420', pouch: '#2c2f28', accent: '#7ee236', pants: '#1c1d1f', knee: '#141516', boot: '#17171a', glove: '#2a2c2e', patch: '#7ee236', bootTrim: true },
	jeeven: { head: 'jeeven', skin: '#e0a420', top: '#1c1c20', vest: '#26262c', pouch: '#6a5228', accent: '#e8b030', pants: '#1c1c20', knee: '#1a1a1e', boot: '#1a1a1e', glove: '#141416', coat: { col: '#1a1a1f', trim: '#e0a420', to: 34 }, bootTrim: true },
	ingman: { head: 'ingman', skin: '#f0c8a0', top: '#5a2a8a', vest: '#2a2620', pouch: '#5e4a2c', accent: '#f2c34a', pants: '#1e1a22', knee: '#1a161e', boot: '#3a2a1c', glove: '#1e1a16', coat: { col: '#5e2c90', trim: '#f2c34a', to: 26, stars: true } },
	aw: { head: 'aw', skin: '#f4ece6', top: '#d8d0bc', vest: '#2e2a24', pouch: '#3a352c', accent: '#1aa79a', pants: '#cfc6b0', knee: '#1e1e1e', boot: '#2a2420', glove: '#2a2622', camo: ['#1aa79a', '#bdb39a'] },
	joker: { head: 'joker', skin: '#ece2d6', top: '#5b2a86', vest: '#3c8a3a', pouch: '#4a3a2a', accent: '#8bc34a', pants: '#2a2230', knee: '#1e1a22', boot: '#3e2a4e', glove: '#1e1a1e', coat: { col: '#5b2a86', trim: '#3a1758', to: 30, lapel: '#4a2070', inner: '#3c8a3a' } },
	// ---- the enemies, after the user's enemy sheet (2026-11-23) ----
	random: { head: 'rookie', skin: '#c8936a', top: '#5d6136', vest: '#6a6440', pouch: '#7a7448', accent: '#7cff5a', pants: '#5a5a34', knee: '#1c1c1c', boot: '#4a3620', glove: '#2a2a20', camo: ['#3e4224', '#7d7a4e'] },
	sweat: { head: 'sweat', skin: '#c8936a', top: '#1a1b1e', vest: '#222428', pouch: '#2a2c30', accent: '#39ff6a', pants: '#1c1d20', knee: '#121314', boot: '#151517', glove: '#1a1a1c' },
	shotty: { head: 'breacher', skin: '#c8936a', top: '#2a2620', vest: '#6e5a3a', pouch: '#8a7450', accent: '#ffa020', pants: '#2c2620', knee: '#8a7450', boot: '#2a2016', glove: '#2a2420', camo: ['#1e1a16', '#4a3e2c'] },
	camper: { head: 'camper', skin: '#c8936a', top: '#4f5a2c', vest: '#4f5a2c', pouch: '#5e6634', accent: '#ff2a1a', pants: '#3a4122', knee: '#2a2e1a', boot: '#2e2618', glove: '#2a2e1a', ghillie: ['#5e6a2e', '#7a8a3a', '#3e4720', '#8a7a3a'] },
	jugg: { head: 'jugg', skin: '#3a3f47', top: '#25282d', vest: '#33373e', pouch: '#3e434a', accent: '#ff2020', pants: '#25282d', knee: '#3e434a', boot: '#1c1e22', glove: '#1c1e22', jugg: true, bulk: 1.35 }
};

// ---------- colour + shape helpers ----------

function hex(h: string): [number, number, number] {
	const n = parseInt(h.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** k > 0 lightens towards white, k < 0 darkens towards black */
export function tone(h: string, k: number): string {
	const [r, g, b] = hex(h);
	const f = (v: number) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k));
	return `rgb(${f(r)},${f(g)},${f(b)})`;
}
const EDGE = 'rgba(8,6,4,0.7)';

/** A tapered limb segment from a to b, shaded across its width (light on the upper side). */
function limb(c: Ctx, ax: number, ay: number, bx: number, by: number, ra: number, rb: number, col: string) {
	const dx = bx - ax, dy = by - ay;
	const L = Math.hypot(dx, dy) || 1;
	const nx = -dy / L, ny = dx / L;
	const a = Math.atan2(dy, dx);
	c.beginPath();
	c.moveTo(ax + nx * ra, ay + ny * ra);
	c.lineTo(bx + nx * rb, by + ny * rb);
	c.arc(bx, by, rb, a + Math.PI / 2, a - Math.PI / 2, true);
	c.lineTo(ax - nx * ra, ay - ny * ra);
	c.arc(ax, ay, ra, a - Math.PI / 2, a + Math.PI / 2, true);
	c.closePath();
	// light comes from above: the side whose normal points up is lit
	const up = ny < 0 ? 1 : -1;
	const r = Math.max(ra, rb);
	const g = c.createLinearGradient(ax + nx * r * up, ay + ny * r * up, ax - nx * r * up, ay - ny * r * up);
	g.addColorStop(0, tone(col, 0.22));
	g.addColorStop(0.45, col);
	g.addColorStop(1, tone(col, -0.45));
	c.fillStyle = g;
	c.fill();
	c.strokeStyle = EDGE;
	c.lineWidth = 0.55;
	c.stroke();
}

/** A shaded rounded box (pouches, plates). */
function box(c: Ctx, x: number, y: number, w: number, h: number, r: number, col: string, edge = true) {
	c.beginPath();
	c.roundRect(x, y, w, h, r);
	const g = c.createLinearGradient(0, y, 0, y + h);
	g.addColorStop(0, tone(col, 0.18));
	g.addColorStop(1, tone(col, -0.35));
	c.fillStyle = g;
	c.fill();
	if (edge) {
		c.strokeStyle = EDGE;
		c.lineWidth = 0.5;
		c.stroke();
	}
}

/** Fill the current path with a vertical shade + a soft side shadow. */
function shadeFill(c: Ctx, col: string, x0: number, x1: number, y0: number, y1: number) {
	const g = c.createLinearGradient(x0, y0, x1, y1);
	g.addColorStop(0, tone(col, 0.2));
	g.addColorStop(0.5, col);
	g.addColorStop(1, tone(col, -0.5));
	c.fillStyle = g;
	c.fill();
}

function blotches(c: Ctx, cols: string[], seed: number, x: number, y: number, w: number, h: number, n = 8) {
	let s = seed * 9301 + 49297;
	const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
	c.save();
	c.clip();
	for (let i = 0; i < n; i++) {
		c.fillStyle = cols[i % cols.length];
		c.globalAlpha = 0.75;
		c.beginPath();
		c.ellipse(x + r() * w, y + r() * h, 1.6 + r() * 2.6, 1 + r() * 1.6, r() * 3, 0, Math.PI * 2);
		c.fill();
	}
	c.restore();
}

// ---------- posing ----------

export interface Pose {
	facing: 1 | -1;
	aim: number;
	walk: number;
	onGround: boolean;
	vx: number;
	recoil: number;
	gun: GunKind | null;
	punch: number;
	limp?: boolean;
	t: number;
}

type P = [number, number];

/** Two-bone IK: the middle joint of a limb from root to tip, bending towards `bend` (±1). */
function ik(root: P, tip: P, l1: number, l2: number, bend: number): { mid: P; tip: P } {
	let dx = tip[0] - root[0], dy = tip[1] - root[1];
	let d = Math.hypot(dx, dy);
	const max = l1 + l2 - 0.01;
	if (d > max) {
		dx *= max / d;
		dy *= max / d;
		d = max;
	}
	const t: P = [root[0] + dx, root[1] + dy];
	const a = Math.atan2(dy, dx);
	const cos = Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * Math.max(d, 0.01))));
	const b = Math.acos(cos) * bend;
	return { mid: [root[0] + Math.cos(a + b) * l1, root[1] + Math.sin(a + b) * l1], tip: t };
}

function legTargets(p: Pose, s: 1 | -1): P {
	if (p.limp) return [s * 5 + Math.sin(p.walk + s) * 8, -2];
	if (!p.onGround) return s > 0 ? [7, -16] : [-4, -12];
	const moving = Math.min(1, Math.abs(p.vx) / 110);
	const ph = p.walk * 1.1 + (s > 0 ? 0 : Math.PI);
	const fx = Math.sin(ph) * 13 * moving + s * 6 * (1 - moving);
	const lift = Math.max(0, Math.cos(ph)) * 6 * moving;
	return [fx, -lift];
}

// ---------- parts ----------

function boot(c: Ctx, foot: P, L: Look, dim: number) {
	const [x, y] = foot;
	c.beginPath();
	c.moveTo(x - 3.4, y - 7);
	c.lineTo(x + 2.4, y - 7);
	c.quadraticCurveTo(x + 7.4, y - 5, x + 7.6, y - 1.2);
	c.lineTo(x + 7.6, y);
	c.lineTo(x - 3.8, y);
	c.closePath();
	shadeFill(c, tone(L.boot, dim), x, x, y - 7, y);
	c.strokeStyle = EDGE;
	c.lineWidth = 0.55;
	c.stroke();
	c.fillStyle = 'rgba(0,0,0,0.6)';
	c.fillRect(x - 3.8, y - 1.3, 11.4, 1.3);
	if (L.bootTrim) {
		c.fillStyle = tone(L.accent, dim * 0.6);
		c.fillRect(x - 3.4, y - 3, 10.6, 0.9);
	}
	c.fillStyle = 'rgba(255,255,255,0.14)';
	c.fillRect(x - 2, y - 6.4, 5, 0.7);
}

// ---------- the endoskeleton (chrome bones, pistons, cables, joints) ----------

const STEEL = '#aab2bc';
const STEEL_D = '#3a4048';

function joint(c: Ctx, at: P, r: number, dim: number) {
	c.beginPath();
	c.arc(at[0], at[1], r, 0, Math.PI * 2);
	const g = c.createRadialGradient(at[0] - r * 0.4, at[1] - r * 0.4, 0.2, at[0], at[1], r);
	g.addColorStop(0, tone(STEEL, 0.6 + dim));
	g.addColorStop(0.5, tone(STEEL, dim));
	g.addColorStop(1, tone(STEEL_D, dim));
	c.fillStyle = g;
	c.fill();
	c.strokeStyle = EDGE;
	c.lineWidth = 0.45;
	c.stroke();
	c.fillStyle = tone(STEEL_D, dim - 0.2);
	c.beginPath();
	c.arc(at[0], at[1], r * 0.38, 0, Math.PI * 2);
	c.fill();
}

/** a hydraulic piston next to a bone: a dark cylinder half way, a bright rod the rest */
function piston(c: Ctx, a: P, b: P, off: number, dim: number) {
	const dx = b[0] - a[0], dy = b[1] - a[1];
	const L = Math.hypot(dx, dy) || 1;
	const nx = (-dy / L) * off, ny = (dx / L) * off;
	const m: P = [a[0] + dx * 0.55 + nx, a[1] + dy * 0.55 + ny];
	limb(c, a[0] + nx, a[1] + ny, m[0], m[1], 1.25, 1.25, tone(STEEL_D, dim));
	limb(c, m[0], m[1], b[0] + nx * 0.6, b[1] + ny * 0.6, 0.65, 0.65, tone('#e8edf2', dim));
}

function bone(c: Ctx, a: P, b: P, ra: number, rb: number, dim: number) {
	limb(c, a[0], a[1], b[0], b[1], ra, rb, tone(STEEL, dim));
	// a bright specular line along the bone
	c.strokeStyle = `rgba(255,255,255,${0.35 + dim * 0.4})`;
	c.lineWidth = 0.45;
	c.beginPath();
	c.moveTo(a[0] - 0.6, a[1] + 0.4);
	c.lineTo(b[0] - 0.6, b[1] + 0.4);
	c.stroke();
}

function endoLeg(c: Ctx, hip: P, knee: P, foot: P, dim: number) {
	piston(c, hip, knee, -3, dim);
	bone(c, hip, knee, 2.6, 2.1, dim);
	piston(c, knee, foot, 2.6, dim);
	bone(c, knee, [foot[0], foot[1] - 2], 2.2, 1.8, dim);
	joint(c, hip, 3.2, dim);
	joint(c, knee, 3.1, dim);
	// a clawed metal foot
	const [x, y] = foot;
	c.beginPath();
	c.moveTo(x - 3.2, y - 3.4);
	c.lineTo(x + 3, y - 3.6);
	c.lineTo(x + 8.2, y - 0.8);
	c.lineTo(x + 8.2, y);
	c.lineTo(x - 3.6, y);
	c.closePath();
	shadeFill(c, tone(STEEL, dim - 0.08), x, x, y - 4, y);
	c.strokeStyle = EDGE;
	c.lineWidth = 0.5;
	c.stroke();
	c.strokeStyle = tone(STEEL_D, dim);
	c.lineWidth = 0.5;
	for (const tx of [3.6, 5.4, 7]) {
		c.beginPath();
		c.moveTo(x + tx, y - 2.6);
		c.lineTo(x + tx + 0.8, y);
		c.stroke();
	}
	joint(c, [x, y - 3.4], 1.7, dim);
}

function endoArm(c: Ctx, sh: P, el: P, h: P, dim: number) {
	piston(c, sh, el, 2.6, dim);
	bone(c, sh, el, 2.4, 2, dim);
	// forearm: two thin bones side by side
	const dx = h[0] - el[0], dy = h[1] - el[1];
	const L = Math.hypot(dx, dy) || 1;
	const nx = (-dy / L) * 1.1, ny = (dx / L) * 1.1;
	bone(c, [el[0] + nx, el[1] + ny], [h[0] + nx, h[1] + ny], 1.3, 1.1, dim);
	bone(c, [el[0] - nx, el[1] - ny], [h[0] - nx, h[1] - ny], 1.3, 1.1, dim);
	joint(c, el, 2.6, dim);
	joint(c, sh, 3.4, dim);
	// a metal fist: knuckle plates over a dark palm
	c.beginPath();
	c.arc(h[0], h[1], 2.9, 0, Math.PI * 2);
	shadeFill(c, tone(STEEL_D, dim), h[0] - 3, h[0] + 3, h[1] - 3, h[1] + 3);
	for (let i = 0; i < 4; i++) {
		const a = -0.9 + i * 0.6;
		joint(c, [h[0] + Math.cos(a) * 2.2, h[1] + Math.sin(a) * 2.2], 1, dim);
	}
	return h;
}

function endoTorso(c: Ctx, dim: number) {
	const top = -RIG.shoulder - 2;
	// spine
	for (let y = -RIG.hip; y > top; y -= 3.4) box(c, -1.6, y - 2.8, 3.2, 2.8, 0.8, tone(STEEL, dim - 0.1));
	// cables behind the ribs
	c.strokeStyle = '#1c1f24';
	c.lineWidth = 1.1;
	for (const x of [-4, 3.4]) {
		c.beginPath();
		c.moveTo(x, -RIG.hip);
		c.quadraticCurveTo(x * 1.6, -54, x * 0.8, top + 10);
		c.stroke();
	}
	// ribcage: curved ribs on both sides
	for (let i = 0; i < 5; i++) {
		const y = top + 6 + i * 3.6;
		const w = 10.5 - i * 0.9;
		for (const sd of [-1, 1]) {
			c.beginPath();
			c.moveTo(0, y);
			c.quadraticCurveTo(sd * w, y - 1.6, sd * (w - 1.2), y + 2.6);
			c.strokeStyle = EDGE;
			c.lineWidth = 2.4;
			c.stroke();
			c.strokeStyle = tone(STEEL, dim + (sd < 0 ? 0.1 : -0.15));
			c.lineWidth = 1.6;
			c.stroke();
		}
	}
	// sternum plate + a glowing red power core
	box(c, -2.6, top + 4, 5.2, 14, 1.4, tone(STEEL, dim + 0.05));
	c.save();
	c.shadowColor = '#ff2a1a';
	c.shadowBlur = 8;
	c.fillStyle = '#ff3a2a';
	c.beginPath();
	c.arc(0, top + 9, 1.6, 0, Math.PI * 2);
	c.fill();
	c.restore();
	// collarbones + shoulder plates
	bone(c, [-10.5, top + 1.5], [10, top + 1.5], 1.5, 1.5, dim);
	box(c, -12.5, top - 1.6, 6, 4.4, 2, tone(STEEL, dim));
	box(c, 6.5, top - 1.6, 6, 4.4, 2, tone(STEEL, dim));
}

function endoPelvis(c: Ctx, dim: number) {
	c.beginPath();
	c.moveTo(-8, -RIG.hip - 2);
	c.lineTo(8, -RIG.hip - 2);
	c.lineTo(5.6, -RIG.hip + 5);
	c.lineTo(-5.6, -RIG.hip + 5);
	c.closePath();
	shadeFill(c, tone(STEEL, dim), -8, 8, -RIG.hip - 2, -RIG.hip + 5);
	c.strokeStyle = EDGE;
	c.lineWidth = 0.5;
	c.stroke();
	c.strokeStyle = tone(STEEL_D, dim);
	c.lineWidth = 0.5;
	c.beginPath();
	c.moveTo(-5, -RIG.hip + 1);
	c.lineTo(5, -RIG.hip + 1);
	c.stroke();
}

function leg(c: Ctx, p: Pose, L: Look, s: 1 | -1, dim: number, seed: number) {
	const bulk = L.bulk ?? 1;
	const hip: P = [s * 4.4 * bulk, -RIG.hip + 1];
	const target = legTargets(p, s);
	const { mid: knee, tip: foot } = ik(hip, [target[0], target[1] - 6], 19.4, 17.4, p.limp ? 1 : -1);
	if (L.endo) return endoLeg(c, hip, knee, [foot[0], foot[1] + 3], dim);
	const pants = tone(L.pants, dim);
	limb(c, hip[0], hip[1], knee[0], knee[1], 5.6 * bulk, 4.2 * bulk, pants);
	if (L.camo) {
		c.save();
		c.beginPath();
		c.moveTo(hip[0] - 4.6 * bulk, hip[1]);
		c.lineTo(hip[0] + 4.6 * bulk, hip[1]);
		c.lineTo(knee[0] + 3.6, knee[1]);
		c.lineTo(knee[0] - 3.6, knee[1]);
		c.closePath();
		blotches(c, L.camo.map((x) => tone(x, dim)), seed + s, Math.min(hip[0], knee[0]) - 5, hip[1], 12, knee[1] - hip[1] + 2, 6);
		c.restore();
	}
	limb(c, knee[0], knee[1], foot[0], foot[1], 4.2 * bulk, 3.3 * bulk, pants);
	// cargo pocket + thigh holster on the near leg
	const mx = (hip[0] + knee[0]) / 2, my = (hip[1] + knee[1]) / 2;
	box(c, mx - 2.6 * bulk, my - 2, 5.2 * bulk, 6, 1, tone(L.pants, dim - 0.12));
	if (s > 0 && !L.coat && !L.ghillie) box(c, mx + 1.2, my - 4, 3.6, 8, 1.2, tone(L.pouch, dim - 0.2));
	// knee pad: a shaped plate on the front of the knee, along the shin
	{
		const sx = foot[0] - knee[0], sy = foot[1] - knee[1];
		const sl = Math.hypot(sx, sy) || 1;
		const ex = knee[0] + (sx / sl) * 5.5, ey = knee[1] + (sy / sl) * 5.5;
		limb(c, knee[0] + 1, knee[1] - 1, ex + 1, ey, 3.6 * bulk, 3 * bulk, tone(L.knee, dim));
	}
	boot(c, foot, L, dim);
}

function hand(c: Ctx, at: P, col: string, r = 3.1) {
	c.beginPath();
	c.arc(at[0], at[1], r, 0, Math.PI * 2);
	const g = c.createRadialGradient(at[0] - 0.8, at[1] - 1, 0.3, at[0], at[1], r);
	g.addColorStop(0, tone(col, 0.35));
	g.addColorStop(1, tone(col, -0.4));
	c.fillStyle = g;
	c.fill();
	c.strokeStyle = EDGE;
	c.lineWidth = 0.5;
	c.stroke();
}

function arm(c: Ctx, L: Look, sh: P, target: P, dim: number, glow?: string) {
	const bulk = L.bulk ?? 1;
	const { mid: el, tip: h } = ik(sh, target, 14, 13.5, 1);
	if (L.endo) return endoArm(c, sh, el, h, dim);
	c.save();
	if (glow) {
		c.shadowColor = glow;
		c.shadowBlur = 6;
	}
	limb(c, sh[0], sh[1], el[0], el[1], 4.3 * bulk, 3.5 * bulk, glow ?? tone(L.top, dim));
	limb(c, el[0], el[1], h[0], h[1], 3.5 * bulk, 2.8 * bulk, glow ?? tone(L.forearm ?? L.top, dim));
	if (L.forearm && !glow) {
		c.strokeStyle = 'rgba(40,20,4,0.6)';
		c.lineWidth = 0.5;
		const mx = (el[0] + h[0]) / 2, my = (el[1] + h[1]) / 2;
		c.beginPath();
		c.moveTo(mx - 1.5, my - 2.2);
		c.lineTo(mx + 1.5, my + 2.2);
		c.stroke();
	}
	c.restore();
	hand(c, h, glow ? tone(glow, 0.3) : tone(L.glove, dim));
	return h;
}

function torso(c: Ctx, L: Look, p: Pose, seed: number) {
	const bulk = L.bulk ?? 1;
	const sw = 11.6 * bulk, ww = 8.8 * bulk;
	const top = -RIG.shoulder - 3;
	const lean = p.limp ? 0 : Math.max(-1, Math.min(1, (p.vx * p.facing) / 300)) * 1.5;
	c.save();
	c.translate(lean, 0);
	if (L.endo) {
		endoTorso(c, 0);
		c.restore();
		return;
	}
	// jacket
	c.beginPath();
	c.moveTo(-sw, top + 3);
	c.quadraticCurveTo(-sw, top, -sw + 3, top);
	c.lineTo(sw - 3, top);
	c.quadraticCurveTo(sw, top, sw, top + 3);
	c.lineTo(ww, -RIG.hip + 1);
	c.lineTo(-ww, -RIG.hip + 1);
	c.closePath();
	shadeFill(c, L.top, -sw, sw, top, -RIG.hip);
	c.strokeStyle = EDGE;
	c.lineWidth = 0.6;
	c.stroke();
	if (L.camo) {
		c.beginPath();
		c.rect(-sw, top, sw * 2, -RIG.hip - top + 1);
		blotches(c, L.camo, seed, -sw, top, sw * 2, 30, 10);
	}
	if (!L.ghillie) {
		// plate carrier: straps, front plate, three mag pouches, admin panel
		const vw = 8 * bulk;
		box(c, -vw, top + 3, vw * 2, 20 * bulk, 2, L.vest);
		c.fillStyle = tone(L.vest, -0.3);
		c.fillRect(-vw + 1.2, top - 0.5, 2.4, 4.5);
		c.fillRect(vw - 3.6, top - 0.5, 2.4, 4.5);
		const py = top + 13 * bulk;
		for (const x of [-6.6, -2.2, 2.2]) box(c, x * bulk, py, 4.2 * bulk, 7 * bulk, 0.8, L.pouch);
		box(c, -4 * bulk, top + 5, 8 * bulk, 5 * bulk, 0.8, tone(L.pouch, -0.1));
		if (L.patch) {
			box(c, 3.2 * bulk, top + 4.5, 4 * bulk, 3.6, 0.6, L.patch, false);
			if (L.patch2) box(c, -7 * bulk, top + 4.5, 3.4, 3.4, 0.6, L.patch2, false);
		}
		if (L.head === 'lars' || L.head === 'sweat') {
			c.fillStyle = L.accent;
			c.shadowColor = L.accent;
			c.shadowBlur = 3;
			c.fillRect(-1.6, top + 6.2, 3.2, 1.2);
			c.shadowBlur = 0;
		}
	}
	// belt + side pouches
	box(c, -ww - 0.4, -RIG.hip - 2.4, (ww + 0.4) * 2, 3.4, 0.8, '#1c1814');
	box(c, -1.6, -RIG.hip - 2.2, 3.2, 3, 0.4, '#8a7a5a', false);
	if (L.jugg) {
		// heavy armour plates
		box(c, -sw - 2, top - 1, 8, 9, 2.5, tone(L.vest, 0.08));
		box(c, sw - 6, top - 1, 8, 9, 2.5, tone(L.vest, 0.08));
		box(c, -7, top + 3, 14, 10, 2, tone(L.vest, 0.1));
		c.fillStyle = L.accent;
		c.shadowColor = L.accent;
		c.shadowBlur = 4;
		c.fillRect(-3, top + 7, 6, 1.2);
		c.shadowBlur = 0;
	}
	c.restore();
}

function coatBack(c: Ctx, L: Look, p: Pose) {
	if (!L.coat) return;
	const sway = p.limp ? 0 : Math.max(-1, Math.min(1, (-p.vx * p.facing) / 250)) * 4;
	const top = -RIG.shoulder - 2;
	c.beginPath();
	c.moveTo(-10.5, top);
	c.lineTo(10.5, top);
	c.quadraticCurveTo(12, -40, 13 + sway, -L.coat.to);
	c.lineTo(-13 + sway * 1.4, -L.coat.to);
	c.quadraticCurveTo(-12, -40, -10.5, top);
	c.closePath();
	shadeFill(c, tone(L.coat.col, -0.25), -13, 13, top, -L.coat.to);
	c.strokeStyle = EDGE;
	c.lineWidth = 0.6;
	c.stroke();
}

function coatFront(c: Ctx, L: Look, p: Pose) {
	if (!L.coat) return;
	const sway = p.limp ? 0 : Math.max(-1, Math.min(1, (-p.vx * p.facing) / 250)) * 3;
	const top = -RIG.shoulder - 2.5;
	// the two front panels, open in the middle so the kit shows
	for (const side of [-1, 1]) {
		c.beginPath();
		c.moveTo(side * 10.8, top);
		c.lineTo(side * 4.5, top);
		c.lineTo(side * 5.5, -RIG.hip + 2);
		c.lineTo(side * 7 + sway * 0.6, -L.coat.to);
		c.lineTo(side * 13 + sway, -L.coat.to);
		c.quadraticCurveTo(side * 12, -46, side * 10.8, top);
		c.closePath();
		shadeFill(c, L.coat.col, side * 4, side * 13, top, -L.coat.to);
		c.strokeStyle = EDGE;
		c.lineWidth = 0.6;
		c.stroke();
		if (L.coat.trim) {
			c.strokeStyle = L.coat.trim;
			c.lineWidth = 0.9;
			c.beginPath();
			c.moveTo(side * 4.5, top);
			c.lineTo(side * 5.5, -RIG.hip + 2);
			c.lineTo(side * 7 + sway * 0.6, -L.coat.to);
			c.lineTo(side * 13 + sway, -L.coat.to);
			c.stroke();
		}
		if (L.coat.lapel) {
			c.beginPath();
			c.moveTo(side * 4.5, top);
			c.lineTo(side * 8.5, top);
			c.lineTo(side * 5.8, top + 11);
			c.closePath();
			shadeFill(c, L.coat.lapel, side * 4, side * 9, top, top + 11);
		}
	}
	if (L.coat.stars) {
		c.fillStyle = '#f2c34a';
		for (const [x, y, r] of [[-9, -40, 1.3], [9.5, -34, 1.1], [-10.5, -30, 1], [10.6, -50, 1], [-8, -55, 0.9]] as const) {
			c.beginPath();
			for (let i = 0; i < 10; i++) {
				const a = (i * Math.PI) / 5 - Math.PI / 2;
				const rr = i % 2 ? r * 0.45 : r;
				c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
			}
			c.fill();
		}
	}
}

function capeBack(c: Ctx, L: Look, p: Pose) {
	if (!L.cape) return;
	const sway = p.limp ? 0 : Math.max(-1, Math.min(1, (-p.vx * p.facing) / 250)) * 5;
	c.beginPath();
	c.moveTo(-11, -RIG.shoulder - 2);
	c.lineTo(4, -RIG.shoulder - 3);
	c.quadraticCurveTo(-4, -50, -9 + sway, -34);
	c.lineTo(-16 + sway * 1.3, -36);
	c.quadraticCurveTo(-15, -56, -11, -RIG.shoulder - 2);
	c.closePath();
	shadeFill(c, tone(L.cape, -0.15), -16, 4, -72, -34);
	c.strokeStyle = EDGE;
	c.lineWidth = 0.6;
	c.stroke();
}

function capeFront(c: Ctx, L: Look) {
	if (!L.cape) return;
	// draped over the near shoulder
	c.beginPath();
	c.moveTo(-2, -RIG.shoulder - 4);
	c.quadraticCurveTo(8, -RIG.shoulder - 6, 12, -RIG.shoulder + 1);
	c.lineTo(9, -RIG.shoulder + 6);
	c.quadraticCurveTo(3, -RIG.shoulder + 2, -2, -RIG.shoulder - 1);
	c.closePath();
	shadeFill(c, L.cape, -2, 12, -76, -63);
	c.strokeStyle = EDGE;
	c.lineWidth = 0.6;
	c.stroke();
}

function ghillie(c: Ctx, L: Look, p: Pose, seed: number) {
	if (!L.ghillie) return;
	let s = seed * 7 + 3;
	const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
	const sway = p.limp ? 0 : Math.sin(p.t * 3) * 0.8;
	c.lineCap = 'round';
	for (let i = 0; i < 70; i++) {
		const x = -11 + r() * 22;
		const y = -RIG.top + 4 + r() * 66;
		const len = 5 + r() * 9;
		c.strokeStyle = L.ghillie[i % L.ghillie.length];
		c.lineWidth = 0.9 + r() * 0.8;
		c.beginPath();
		c.moveTo(x, y);
		c.quadraticCurveTo(x + (r() - 0.5) * 4 + sway, y + len * 0.6, x + (r() - 0.5) * 5 + sway * 1.5, y + len);
		c.stroke();
	}
}

// ---------- heads ----------

function headShape(c: Ctx, cx: number, cy: number, col: string, rx = 6.4, ry = 7.6) {
	c.beginPath();
	c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
	const g = c.createRadialGradient(cx - 2, cy - 3, 1, cx, cy, ry + 1);
	g.addColorStop(0, tone(col, 0.3));
	g.addColorStop(0.6, col);
	g.addColorStop(1, tone(col, -0.5));
	c.fillStyle = g;
	c.fill();
	c.strokeStyle = EDGE;
	c.lineWidth = 0.55;
	c.stroke();
}

function glowDot(c: Ctx, x: number, y: number, r: number, col: string) {
	c.save();
	c.shadowColor = col;
	c.shadowBlur = 5;
	c.fillStyle = col;
	c.beginPath();
	c.arc(x, y, r, 0, Math.PI * 2);
	c.fill();
	c.restore();
}

/** a helmet dome over the head (FAST / standard) */
function helmet(c: Ctx, cx: number, cy: number, col: string, rail = true) {
	c.beginPath();
	c.moveTo(cx - 7.4, cy + 0.5);
	c.quadraticCurveTo(cx - 8, cy - 9.5, cx + 0.5, cy - 9.6);
	c.quadraticCurveTo(cx + 8.4, cy - 9.2, cx + 7.6, cy + 0.2);
	c.closePath();
	shadeFill(c, col, cx - 6, cx + 6, cy - 10, cy + 1);
	c.strokeStyle = EDGE;
	c.lineWidth = 0.55;
	c.stroke();
	if (rail) {
		c.fillStyle = tone(col, -0.4);
		c.fillRect(cx - 7, cy - 2.4, 3, 1.4);
		c.fillRect(cx + 2.5, cy - 9.8, 4, 2);
	}
	c.fillStyle = 'rgba(255,255,255,0.15)';
	c.beginPath();
	c.ellipse(cx - 2, cy - 7, 3, 1.2, -0.3, 0, Math.PI * 2);
	c.fill();
}

function headset(c: Ctx, cx: number, cy: number) {
	box(c, cx - 7.4, cy - 2, 3.4, 5.4, 1.4, '#1a1a1c');
}

function head(c: Ctx, L: Look, p: Pose) {
	const cx = 1.2, cy = -RIG.head;
	// neck (an endoskeleton gets steel vertebrae and cables)
	if (L.endo) {
		for (let y = -RIG.shoulder - 1; y > cy + 4; y -= 2.2) box(c, -1.4, y - 2, 2.8, 2, 0.6, '#8a929c');
		c.strokeStyle = '#1c1f24';
		c.lineWidth = 0.9;
		c.beginPath();
		c.moveTo(-2.4, -RIG.shoulder);
		c.lineTo(-1.6, cy + 5);
		c.moveTo(2.6, -RIG.shoulder);
		c.lineTo(2.2, cy + 5);
		c.stroke();
	} else limb(c, 0, -RIG.shoulder - 2, 0.6, cy + 5, 3.2, 3, L.head === 'abscar' ? '#5a4024' : L.head === 'aw' || L.head === 'joker' || L.head === 'ingman' ? L.skin : '#1c1c1c');
	switch (L.head) {
		case 'endo': {
			// a chrome terminator-style skull: cranium, deep sockets with red eyes, cheekbones, steel teeth, jaw pistons
			headShape(c, cx + 0.6, cy - 0.6, '#b8c0ca', 6.2, 7);
			c.fillStyle = 'rgba(255,255,255,0.45)';
			c.beginPath();
			c.ellipse(cx - 1.4, cy - 5, 2.6, 1.1, -0.4, 0, Math.PI * 2);
			c.fill();
			c.fillStyle = '#0c0d10';
			c.beginPath();
			c.ellipse(cx + 3.8, cy - 0.8, 2, 1.7, 0.1, 0, Math.PI * 2);
			c.ellipse(cx - 0.6, cy - 0.8, 1.8, 1.6, -0.1, 0, Math.PI * 2);
			c.fill();
			glowDot(c, cx + 3.8, cy - 0.8, 1, '#ff2a1a');
			glowDot(c, cx - 0.6, cy - 0.8, 0.9, '#ff2a1a');
			c.fillStyle = '#16181c';
			c.beginPath();
			c.moveTo(cx + 1.6, cy + 1.2);
			c.lineTo(cx + 0.6, cy + 3);
			c.lineTo(cx + 2.6, cy + 3);
			c.closePath();
			c.fill();
			// cheekbones
			c.strokeStyle = 'rgba(30,34,40,0.8)';
			c.lineWidth = 0.6;
			c.beginPath();
			c.moveTo(cx - 3.4, cy + 1.4);
			c.quadraticCurveTo(cx - 1.6, cy + 2.6, cx - 0.4, cy + 2);
			c.moveTo(cx + 6.4, cy + 1.2);
			c.quadraticCurveTo(cx + 5, cy + 2.6, cx + 3.8, cy + 2);
			c.stroke();
			// jaw + teeth
			box(c, cx - 2.6, cy + 3.2, 8.4, 4.2, 1.4, '#9aa2ac');
			c.fillStyle = '#eef2f6';
			c.fillRect(cx - 1.8, cy + 3.6, 6.8, 1.8);
			c.strokeStyle = '#4a5058';
			c.lineWidth = 0.3;
			for (let i = 0; i < 7; i++) {
				c.beginPath();
				c.moveTo(cx - 1.4 + i * 1, cy + 3.6);
				c.lineTo(cx - 1.4 + i * 1, cy + 5.4);
				c.stroke();
			}
			piston(c, [cx - 4.6, cy + 0.6], [cx - 3, cy + 5.6], 0, 0);
			break;
		}
		case 'abscar': {
			// tan hood behind, the bronze cyborg skull with red eyes and steel teeth
			c.beginPath();
			c.ellipse(cx - 1, cy + 0.5, 8.6, 9.6, 0, 0, Math.PI * 2);
			shadeFill(c, L.cape ?? '#a8803e', cx - 9, cx + 8, cy - 10, cy + 10);
			headShape(c, cx + 0.8, cy, '#b07a3a', 5.8, 7);
			c.fillStyle = '#1a0d05';
			c.beginPath();
			c.ellipse(cx + 3.6, cy - 1, 1.9, 1.6, 0, 0, Math.PI * 2);
			c.ellipse(cx - 0.6, cy - 1, 1.7, 1.5, 0, 0, Math.PI * 2);
			c.fill();
			glowDot(c, cx + 3.6, cy - 1, 0.9, '#ff3a2a');
			glowDot(c, cx - 0.6, cy - 1, 0.8, '#ff3a2a');
			c.fillStyle = '#e8e0cc';
			c.fillRect(cx - 1.4, cy + 3, 6.6, 2.2);
			c.strokeStyle = '#5e4318';
			c.lineWidth = 0.35;
			for (let i = 0; i < 6; i++) {
				c.beginPath();
				c.moveTo(cx - 0.6 + i * 1.1, cy + 3);
				c.lineTo(cx - 0.6 + i * 1.1, cy + 5.2);
				c.stroke();
			}
			break;
		}
		case 'phil': {
			// black hood, chrome skull face, yellow eyes, cyan neon arcs, yellow ear piece
			c.beginPath();
			c.ellipse(cx - 0.6, cy - 0.4, 8.2, 9.4, 0, 0, Math.PI * 2);
			shadeFill(c, '#1a1a1e', cx - 8, cx + 8, cy - 10, cy + 9);
			headShape(c, cx + 1, cy + 0.4, '#c9ced6', 5.4, 6.6);
			c.fillStyle = '#16171b';
			c.beginPath();
			c.ellipse(cx + 3.4, cy - 0.6, 1.8, 1.7, 0, 0, Math.PI * 2);
			c.ellipse(cx - 0.6, cy - 0.6, 1.6, 1.6, 0, 0, Math.PI * 2);
			c.fill();
			glowDot(c, cx + 3.4, cy - 0.6, 0.8, '#ffd23a');
			glowDot(c, cx - 0.6, cy - 0.6, 0.7, '#ffd23a');
			c.fillStyle = '#1e1f24';
			c.fillRect(cx - 1, cy + 3.6, 5.6, 1.4);
			c.save();
			c.strokeStyle = '#4ae8ff';
			c.shadowColor = '#4ae8ff';
			c.shadowBlur = 5;
			c.lineWidth = 0.8;
			c.beginPath();
			c.arc(cx, cy, 9.4, Math.PI * 0.62, Math.PI * 1.38);
			c.stroke();
			c.beginPath();
			c.arc(cx, cy, 9.4, -Math.PI * 0.38, Math.PI * 0.38);
			c.stroke();
			c.restore();
			box(c, cx - 8.6, cy - 1.6, 2.6, 4, 1, '#f2c02a', false);
			break;
		}
		case 'lars': {
			headShape(c, cx, cy + 0.6, '#1a1a1c', 6.2, 7.4);
			helmet(c, cx, cy - 0.8, '#202124');
			// lime goggles
			box(c, cx - 2.6, cy - 2.6, 9.4, 3.8, 1.6, '#0e0f10', false);
			c.save();
			c.shadowColor = '#7ee236';
			c.shadowBlur = 6;
			const g = c.createLinearGradient(0, cy - 2.2, 0, cy + 0.8);
			g.addColorStop(0, '#b8ff5a');
			g.addColorStop(1, '#4aa818');
			c.fillStyle = g;
			c.beginPath();
			c.roundRect(cx - 1.8, cy - 2, 7.8, 2.8, 1.2);
			c.fill();
			c.restore();
			headset(c, cx, cy);
			c.strokeStyle = '#1a1a1c';
			c.lineWidth = 0.8;
			c.beginPath();
			c.moveTo(cx - 5, cy + 2);
			c.quadraticCurveTo(cx, cy + 6, cx + 4, cy + 4.6);
			c.stroke();
			break;
		}
		case 'jeeven': {
			c.beginPath();
			c.ellipse(cx - 0.6, cy - 0.2, 8, 9.2, 0, 0, Math.PI * 2);
			shadeFill(c, '#1c1c20', cx - 8, cx + 8, cy - 10, cy + 9);
			headShape(c, cx + 0.8, cy + 0.3, '#e0a420', 5.6, 6.8);
			c.fillStyle = '#1a1206';
			c.beginPath();
			c.moveTo(cx + 1.8, cy - 2.4);
			c.lineTo(cx + 5.4, cy - 2.2);
			c.lineTo(cx + 4.6, cy + 0.6);
			c.closePath();
			c.moveTo(cx + 0.4, cy - 2.4);
			c.lineTo(cx - 3, cy - 2);
			c.lineTo(cx - 1.6, cy + 0.6);
			c.closePath();
			c.fill();
			c.fillRect(cx - 1.4, cy + 3.4, 6, 1.4);
			c.fillStyle = 'rgba(255,240,180,0.5)';
			c.beginPath();
			c.ellipse(cx - 1.2, cy - 4.6, 2, 0.9, -0.3, 0, Math.PI * 2);
			c.fill();
			headset(c, cx, cy);
			c.strokeStyle = '#141416';
			c.lineWidth = 1.2;
			c.beginPath();
			c.arc(cx - 0.6, cy - 1, 7.8, Math.PI * 1.08, Math.PI * 1.85);
			c.stroke();
			break;
		}
		case 'ingman': {
			headShape(c, cx + 0.4, cy, L.skin, 5.8, 6.8);
			// big white beard
			c.beginPath();
			c.moveTo(cx - 4.6, cy + 0.6);
			c.quadraticCurveTo(cx - 5.4, cy + 11, cx + 1, cy + 13.5);
			c.quadraticCurveTo(cx + 7, cy + 11, cx + 6.4, cy + 0.6);
			c.quadraticCurveTo(cx + 1, cy + 4, cx - 4.6, cy + 0.6);
			c.closePath();
			shadeFill(c, '#ece6da', cx - 5, cx + 6, cy, cy + 13);
			c.strokeStyle = 'rgba(120,110,95,0.6)';
			c.lineWidth = 0.4;
			for (let i = 0; i < 5; i++) {
				c.beginPath();
				c.moveTo(cx - 2.6 + i * 1.6, cy + 3);
				c.quadraticCurveTo(cx - 3 + i * 1.7, cy + 8, cx - 1.6 + i * 1.2, cy + 11.5);
				c.stroke();
			}
			// round lavender glasses
			c.strokeStyle = '#3a2a40';
			c.lineWidth = 0.6;
			c.fillStyle = 'rgba(190,160,230,0.55)';
			for (const x of [cx - 0.6, cx + 3.8]) {
				c.beginPath();
				c.arc(x, cy - 1, 1.9, 0, Math.PI * 2);
				c.fill();
				c.stroke();
			}
			// the wizard hat
			c.beginPath();
			c.ellipse(cx + 0.4, cy - 5.4, 12.5, 2.6, 0, 0, Math.PI * 2);
			shadeFill(c, '#5a2a8a', cx - 12, cx + 12, cy - 8, cy - 3);
			c.strokeStyle = EDGE;
			c.lineWidth = 0.5;
			c.stroke();
			c.beginPath();
			c.moveTo(cx - 6, cy - 6.4);
			c.quadraticCurveTo(cx - 2, cy - 15, cx - 6, cy - 21);
			c.quadraticCurveTo(cx + 3, cy - 15, cx + 6.6, cy - 6.4);
			c.closePath();
			shadeFill(c, '#6a32a0', cx - 6, cx + 7, cy - 21, cy - 6);
			c.stroke();
			c.fillStyle = '#e04aa8';
			c.fillRect(cx - 5.6, cy - 8.6, 12, 1.6);
			c.fillStyle = '#f2c34a';
			c.beginPath();
			c.arc(cx + 1.4, cy - 12, 0.8, 0, Math.PI * 2);
			c.arc(cx - 2, cy - 15.4, 0.6, 0, Math.PI * 2);
			c.fill();
			break;
		}
		case 'aw': {
			headShape(c, cx + 0.4, cy + 0.4, L.skin, 5.8, 7);
			// black pompadour
			c.beginPath();
			c.moveTo(cx - 5.6, cy - 1);
			c.quadraticCurveTo(cx - 6, cy - 8.4, cx + 0.6, cy - 9.2);
			c.quadraticCurveTo(cx + 7.6, cy - 9.6, cx + 6.6, cy - 4.2);
			c.quadraticCurveTo(cx + 2, cy - 6, cx - 3.6, cy - 4);
			c.lineTo(cx - 4.2, cy - 0.4);
			c.closePath();
			shadeFill(c, '#1a1614', cx - 6, cx + 7, cy - 10, cy - 1);
			// big round black-rimmed glasses + huge eyes
			for (const x of [cx - 0.4, cx + 3.8]) {
				c.fillStyle = '#ffffff';
				c.beginPath();
				c.arc(x, cy - 0.6, 1.9, 0, Math.PI * 2);
				c.fill();
				c.fillStyle = '#1a1a1a';
				c.beginPath();
				c.arc(x + 0.3, cy - 0.5, 0.8, 0, Math.PI * 2);
				c.fill();
				c.strokeStyle = '#111';
				c.lineWidth = 0.6;
				c.beginPath();
				c.arc(x, cy - 0.6, 2.1, 0, Math.PI * 2);
				c.stroke();
			}
			c.strokeStyle = '#8a3a3a';
			c.lineWidth = 0.6;
			c.beginPath();
			c.arc(cx + 1.8, cy + 3, 2.6, 0.2, Math.PI - 0.2);
			c.stroke();
			glowDot(c, cx + 5.8, cy - 3.2, 0.6, '#9ad8ff');
			break;
		}
		case 'joker': {
			headShape(c, cx + 0.4, cy + 0.4, L.skin, 5.8, 7);
			c.fillStyle = 'rgba(20,10,20,0.75)';
			c.beginPath();
			c.ellipse(cx - 0.4, cy - 0.8, 1.8, 1.6, 0, 0, Math.PI * 2);
			c.ellipse(cx + 3.8, cy - 0.8, 1.8, 1.6, 0, 0, Math.PI * 2);
			c.fill();
			c.strokeStyle = '#c8222a';
			c.lineWidth = 1;
			c.beginPath();
			c.moveTo(cx - 2, cy + 2.6);
			c.quadraticCurveTo(cx + 1.8, cy + 5, cx + 5.6, cy + 2.2);
			c.stroke();
			// messy green hair
			c.fillStyle = '#4a7a2a';
			c.beginPath();
			c.moveTo(cx - 6.4, cy + 2);
			for (let i = 0; i <= 8; i++) {
				const a = Math.PI * (1.05 + i * 0.11);
				const rr = 8 + (i % 2) * 2.4;
				c.lineTo(cx + Math.cos(a) * rr, cy - 1 + Math.sin(a) * rr);
			}
			c.lineTo(cx + 6.6, cy - 1);
			c.quadraticCurveTo(cx + 1, cy - 5.4, cx - 4.6, cy - 1.6);
			c.closePath();
			shadeFill(c, '#5a8a30', cx - 8, cx + 8, cy - 11, cy + 2);
			break;
		}
		case 'rookie': {
			headShape(c, cx, cy + 0.6, '#1a1a1a', 6, 7.2);
			helmet(c, cx, cy - 0.6, '#6e6e40');
			box(c, cx - 2.2, cy - 1.8, 8.4, 2.8, 1.2, '#1e2424', false);
			c.fillStyle = 'rgba(160,200,200,0.35)';
			c.fillRect(cx - 1.4, cy - 1.4, 3, 0.8);
			headset(c, cx, cy);
			break;
		}
		case 'sweat': {
			headShape(c, cx, cy + 0.6, '#151517', 6, 7.2);
			helmet(c, cx, cy - 0.6, '#1e2024');
			// quad night vision, down, glowing green
			box(c, cx + 0.4, cy - 3.6, 7.4, 4.2, 1, '#0c0d0e', false);
			for (const [x, y] of [[cx + 2, cy - 2.6], [cx + 4.6, cy - 2.6], [cx + 2, cy - 0.6], [cx + 4.6, cy - 0.6]] as const) glowDot(c, x, y, 0.75, '#39ff6a');
			headset(c, cx, cy);
			break;
		}
		case 'breacher': {
			headShape(c, cx, cy + 0.6, '#1a1714', 6, 7.2);
			helmet(c, cx, cy - 0.6, '#3a3226');
			// amber visor
			c.save();
			const g = c.createLinearGradient(0, cy - 3, 0, cy + 1.6);
			g.addColorStop(0, '#ffcf60');
			g.addColorStop(1, '#b85a10');
			c.fillStyle = g;
			c.shadowColor = '#ff9a20';
			c.shadowBlur = 4;
			c.beginPath();
			c.roundRect(cx - 2, cy - 3, 9, 4.2, 1.6);
			c.fill();
			c.restore();
			headset(c, cx, cy);
			break;
		}
		case 'camper': {
			c.beginPath();
			c.ellipse(cx - 0.4, cy - 0.6, 8.6, 9.6, 0, 0, Math.PI * 2);
			shadeFill(c, '#4f5a2c', cx - 9, cx + 9, cy - 10, cy + 9);
			headShape(c, cx + 0.8, cy + 0.4, '#141410', 5, 6);
			glowDot(c, cx + 4, cy - 0.4, 1.4, '#ff2a1a');
			c.fillStyle = '#0a0a08';
			c.beginPath();
			c.arc(cx + 4, cy - 0.4, 0.7, 0, Math.PI * 2);
			c.fill();
			break;
		}
		case 'jugg': {
			headShape(c, cx, cy, '#3a3f47', 8, 8.8);
			box(c, cx - 3, cy - 2.4, 11, 4, 1.4, '#121316', false);
			c.save();
			c.fillStyle = '#ff2020';
			c.shadowColor = '#ff2020';
			c.shadowBlur = 7;
			c.fillRect(cx - 1.6, cy - 1.2, 8.6, 1.6);
			c.restore();
			box(c, cx - 8, cy + 5, 16, 4, 1.4, '#30343a');
			break;
		}
	}
}

// ---------- guns (enemies; the player's gun is the WeaponIcon picture) ----------

export function gunPaint(c: Ctx, kind: GunKind) {
	const metal = (x: number, y: number, w: number, h: number, col = '#1c1d20') => box(c, x, y, w, h, Math.min(1, h / 2), col);
	if (kind === 'melee') {
		c.beginPath();
		c.moveTo(3, -1.6);
		c.quadraticCurveTo(16, -5, 22, 0);
		c.lineTo(3, 1.4);
		c.closePath();
		const g = c.createLinearGradient(0, -4, 0, 2);
		g.addColorStop(0, '#f2f4f8');
		g.addColorStop(1, '#8a9098');
		c.fillStyle = g;
		c.fill();
		metal(-5, -1.6, 8, 3.4, '#2a2420');
		return;
	}
	const len = kind === 'pistol' ? 15 : kind === 'smg' ? 24 : kind === 'shotgun' ? 32 : kind === 'sniper' ? 40 : kind === 'launcher' ? 36 : 33;
	const fat = kind === 'launcher' ? 5.6 : kind === 'lmg' ? 4.6 : 3.6;
	metal(-5, -fat - 1.4, len, fat);
	metal(len - 6, -fat - 0.6, 6, fat * 0.5, '#141416'); // barrel
	metal(-1.6, -2.2, 4, 6.4); // grip
	if (kind !== 'pistol' && kind !== 'launcher') metal(-13, -fat - 0.6, 9, fat - 0.6); // stock
	if (kind === 'ar' || kind === 'smg' || kind === 'lmg') metal(6, -1.4, 3.6, kind === 'lmg' ? 7 : 6); // mag
	if (kind === 'sniper' || kind === 'marksman') metal(3, -fat - 5.4, 12, 3, '#101114'); // scope
	c.fillStyle = 'rgba(255,255,255,0.18)';
	c.fillRect(-4, -fat - 1.2, len - 3, 0.6);
}

export interface GunPic {
	img: CanvasImageSource;
	/** picture size in world units and the fist's spot in it */
	w: number;
	h: number;
	px: number;
	py: number;
}

/** Paint a whole character at (x, y) (feet), scale s. `pic` = the player's gun picture. */
export function paintFigure(c: Ctx, L: Look, x: number, y: number, s: number, p: Pose, seed = 1, pic: GunPic | null = null) {
	c.save();
	c.translate(x, y);
	c.scale(s * p.facing, s);
	const bulk = L.bulk ?? 1;
	// local aim (+x forward)
	const dx = Math.cos(p.aim) * p.facing;
	const dy = Math.sin(p.aim);
	const back = p.recoil * 3;
	const shF: P = [6 * bulk, -RIG.shoulder + 1];
	const shB: P = [-6.5 * bulk, -RIG.shoulder + 1.6];
	let handF: P, handB: P;
	if (p.limp) {
		handF = [9, -46];
		handB = [-9, -48];
	} else if (!p.gun) {
		handF = p.punch > 0 ? [shF[0] + 25, shF[1] + 1] : [shF[0] + 9, shF[1] + 15];
		handB = [shB[0] + 4, shB[1] + 17];
	} else {
		handF = [shF[0] + dx * (13 - back), shF[1] + dy * (13 - back)];
		if (p.gun === 'melee') handB = [shB[0] - 1, shB[1] + 24];
		else if (p.gun === 'pistol') handB = [handF[0] - dx * 1.6, handF[1] + 1.8];
		else handB = [shF[0] + dx * (29 - back), shF[1] + dy * (29 - back) + 1];
	}
	capeBack(c, L, p);
	coatBack(c, L, p);
	arm(c, L, shB, handB, -0.28, L.glowArm);
	leg(c, p, L, -1, -0.3, seed);
	{
		const bulk2 = L.bulk ?? 1;
		if (L.endo) endoPelvis(c, 0);
		else {
			c.beginPath();
			c.roundRect(-8.6 * bulk2, -RIG.hip - 3, 17.2 * bulk2, 10, 4);
			shadeFill(c, L.pants, -8, 8, -RIG.hip - 3, -RIG.hip + 7);
		}
	}
	leg(c, p, L, 1, 0, seed);
	torso(c, L, p, seed);
	coatFront(c, L, p);
	ghillie(c, L, p, seed);
	head(c, L, p);
	capeFront(c, L);
	// the gun, then the front arm with its fist on the grip
	if (p.gun && !p.limp) {
		c.save();
		c.translate(handF[0], handF[1]);
		c.rotate(Math.atan2(dy, dx));
		if (pic) c.drawImage(pic.img, -pic.px, -pic.py, pic.w, pic.h);
		else {
			c.scale(1.25, 1.25); // a bit bigger than real, like the player's
			gunPaint(c, p.gun);
		}
		c.restore();
	}
	arm(c, L, shF, handF, 0);
	c.restore();
}

/** A soft contact shadow under a character. */
export function contactShadow(c: Ctx, x: number, floorY: number, s: number, lift: number) {
	const k = Math.max(0, 1 - lift / 120);
	if (k <= 0) return;
	const g = c.createRadialGradient(x, floorY, 0, x, floorY, 16 * s);
	g.addColorStop(0, `rgba(0,0,0,${0.5 * k})`);
	g.addColorStop(1, 'rgba(0,0,0,0)');
	c.fillStyle = g;
	c.beginPath();
	c.ellipse(x, floorY, 16 * s, 3.6 * s, 0, 0, Math.PI * 2);
	c.fill();
}
