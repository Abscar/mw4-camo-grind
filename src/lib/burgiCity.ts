/**
 * Burgi City seen from above at an angle (2026-11-23, the user: "lite mer ovanifrån, inte bara rakt 2D").
 * An isometric town: a 26 × 26 tile grid, three by three blocks of 6 × 6 tiles with 2-tile roads around and
 * between them. Every building is our own drawing built from shaded boxes, roofs and small sprites, as plain
 * SVG strings (no ids, so the same drawing can be on screen twice). BurgiCity.svelte stacks the three block
 * rows as separate SVG layers with the walking operators between them, so a walker on a road is hidden by
 * the row in front of it and drawn over the row behind.
 * Pure (no browser APIs), tested in scripts/burgi-city.test.js.
 */
import { LEAF_PATHS } from './leaf.ts';

/** half a tile's width / height on screen, and where tile (0, 0) sits */
export const TW = 23;
export const TH = 11.5;
const OX = 600;
const OY = 150;
export const VB_W = 1200;
export const VB_H = 760;
/** the grid: 4 roads of 2 tiles + 3 blocks of 6 */
export const GRID = 26;
export const BLOCK = 6;
const ROAD = 2;
/** the middle line of every road, in tiles (along both axes) */
export const LANES = [1, 9, 17, 25] as const;

export type Pt = [number, number];
/** a grid point (and height in screen px) to screen px */
export function p(gx: number, gy: number, z = 0): Pt {
	return [OX + (gx - gy) * TW, OY + (gx + gy) * TH - z];
}
const r = (n: number) => Math.round(n * 10) / 10;
const pts = (a: Pt[]) => a.map(([x, y]) => `${r(x)},${r(y)}`).join(' ');
const INK = '#0b0816';

/** lighter (f > 0, towards white) or darker (f < 0, towards black) */
export function shade(hex: string, f: number): string {
	const n = parseInt(hex.slice(1), 16);
	const to = f < 0 ? 0 : 255;
	const a = Math.min(1, Math.abs(f));
	const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (to - v) * a));
	return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

function poly(a: Pt[], fill: string, extra = ''): string {
	return `<polygon points="${pts(a)}" fill="${fill}" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"${extra ? ' ' + extra : ''}/>`;
}
function flat(a: Pt[], fill: string, extra = ''): string {
	return `<polygon points="${pts(a)}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
}
/** a quad on the plane y = const (the faces turned towards the bottom left) */
const fy = (x0: number, x1: number, y: number, za: number, zb: number): Pt[] => [p(x0, y, za), p(x1, y, za), p(x1, y, zb), p(x0, y, zb)];
/** a quad on the plane x = const (the faces turned towards the bottom right) */
const fx = (x: number, y0: number, y1: number, za: number, zb: number): Pt[] => [p(x, y0, za), p(x, y1, za), p(x, y1, zb), p(x, y0, zb)];
/** a flat quad at height z */
const fz = (x0: number, y0: number, x1: number, y1: number, z: number): Pt[] => [p(x0, y0, z), p(x1, y0, z), p(x1, y1, z), p(x0, y1, z)];

/** a shaded box: left face, right face, top */
export function box(x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, col: string, top?: string, cls = ''): string {
	const c = cls ? `class="${cls}"` : '';
	return (
		poly(fy(x0, x1, y1, z0, z1), shade(col, -0.18), c) +
		poly(fx(x1, y0, y1, z0, z1), shade(col, -0.42), c) +
		poly(fz(x0, y0, x1, y1, z1), top ?? shade(col, 0.12), c)
	);
}

/** text painted on the plane y = const, reading along +x */
function textY(x: number, y: number, z: number, s: string, size: number, fill: string, cls = ''): string {
	const [ax, ay] = p(x, y, z);
	return `<text transform="matrix(1,.5,0,1,${r(ax)},${r(ay)})" text-anchor="middle" font-size="${size}" font-weight="900" font-family="Bahnschrift, Arial Black, sans-serif" fill="${fill}"${cls ? ` class="${cls}"` : ''}>${s}</text>`;
}
/** text painted on the plane x = const, reading along −y (left to right on screen) */
function textX(x: number, y: number, z: number, s: string, size: number, fill: string, cls = ''): string {
	const [ax, ay] = p(x, y, z);
	return `<text transform="matrix(1,-.5,0,1,${r(ax)},${r(ay)})" text-anchor="middle" font-size="${size}" font-weight="900" font-family="Bahnschrift, Arial Black, sans-serif" fill="${fill}"${cls ? ` class="${cls}"` : ''}>${s}</text>`;
}
/** a group drawn in screen space at a grid point */
const at = (g: Pt, inner: string, cls = '') =>
	`<g transform="translate(${r(g[0])} ${r(g[1])})">${cls ? `<g class="${cls}">${inner}</g>` : inner}</g>`;
// (the class sits on an inner group: a CSS animation's transform would replace the placing one)
/** a flat ellipse lying on the ground at height z */
const ground = (cx: number, cy: number, z: number, rx: number, fill: string, extra = '') => {
	const [x, y] = p(cx, cy, z);
	return `<ellipse cx="${r(x)}" cy="${r(y)}" rx="${r(rx)}" ry="${r(rx / 2)}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
};

export type BlockId = 'grind' | 'ranked' | 'cosmetics' | 'casino' | 'shop' | 'arcade' | 'mayhem' | 'squad' | 'park';

export interface Block {
	id: BlockId;
	bx: number;
	by: number;
	/** the tallest thing on it, in screen px (for its tap area) */
	h: number;
	/** the slab's top colour */
	slab: string;
	art: (gx: number, gy: number) => string;
}

/** the block's corner tile */
export const origin = (b: { bx: number; by: number }) => [ROAD + b.bx * (BLOCK + ROAD), ROAD + b.by * (BLOCK + ROAD)] as const;

// ——— the buildings ———

function ranked(o: number, q: number): string {
	let s = box(o + 0.5, q + 0.5, o + 5.5, q + 5.5, 3, 12, '#1b2f5a');
	s += box(o + 1.6, q + 1.6, o + 4.4, q + 4.4, 12, 146, '#2456b0');
	for (let f = 0; f < 11; f++) {
		const z = 20 + f * 11.5;
		for (let c = 0; c < 3; c++) {
			const x = o + 1.85 + c * 0.88;
			const lit = (f * 3 + c * 5) % 7 > 2;
			s += flat(fy(x, x + 0.55, q + 4.4, z, z + 6.5), lit ? '#9cc6ff' : '#17325e', lit ? 'class="win"' : '');
			const y = q + 1.85 + c * 0.88;
			const lit2 = (f * 5 + c * 3) % 6 > 1;
			s += flat(fx(o + 4.4, y, y + 0.55, z, z + 6.5), lit2 ? '#6d9fe6' : '#10264a', lit2 ? 'class="win w2"' : '');
		}
	}
	s += box(o + 1.9, q + 1.9, o + 4.1, q + 4.1, 146, 156, '#4d8dff');
	// rank hexagon + star on the front, near the top
	const hex: Pt[] = [];
	for (let i = 0; i < 6; i++) {
		const a = (i * Math.PI) / 3 + Math.PI / 6;
		hex.push(p(o + 3 + Math.cos(a) * 0.62, q + 4.4, 138 + Math.sin(a) * 9));
	}
	s += poly(hex, '#4d8dff');
	const star: Pt[] = [];
	for (let i = 0; i < 10; i++) {
		const a = (i * Math.PI) / 5 - Math.PI / 2;
		const rr = i % 2 ? 2.4 : 5.6;
		star.push(p(o + 3 + Math.cos(a) * (rr / 14), q + 4.4, 138 - Math.sin(a) * rr));
	}
	s += flat(star, '#fff4b0');
	const [ax, ay] = p(o + 3, q + 3, 156);
	s += `<path d="M${r(ax)} ${r(ay)}V${r(ay - 36)}" stroke="${INK}" stroke-width="3"/><circle cx="${r(ax)}" cy="${r(ay - 38)}" r="4" fill="#ff4a3d" class="blink"/>`;
	return s;
}

function museum(o: number, q: number): string {
	let s = box(o + 0.4, q + 0.6, o + 5.6, q + 5.8, 3, 9, '#d9bfcd');
	s += box(o + 0.9, q + 1.1, o + 5.1, q + 4.4, 9, 46, '#f1dbe8');
	for (let i = 0; i < 6; i++) {
		const x = o + 1.0 + i * 0.76;
		s += box(x, q + 4.9, x + 0.32, q + 5.2, 9, 46, '#fff2f8');
	}
	s += box(o + 0.8, q + 1.0, o + 5.2, q + 5.4, 46, 52, '#ff8cc8');
	// roof: ridge along y, gable at the front
	const xm = o + 3;
	const [x0, x1, y0, y1, z, zr] = [o + 0.8, o + 5.2, q + 1.0, q + 5.4, 52, 76];
	s += poly([p(x0, y0, z), p(xm, y0, zr), p(xm, y1, zr), p(x0, y1, z)], '#e4559c');
	s += poly([p(xm, y0, zr), p(x1, y0, z), p(x1, y1, z), p(xm, y1, zr)], '#b83a78');
	s += poly([p(x0, y1, z), p(xm, y1, zr), p(x1, y1, z)], '#c23d86');
	const star: Pt[] = [];
	for (let i = 0; i < 10; i++) {
		const a = (i * Math.PI) / 5 - Math.PI / 2;
		const rr = i % 2 ? 3.2 : 7.4;
		star.push(p(xm + Math.cos(a) * (rr / 14), y1, 62 - Math.sin(a) * rr));
	}
	s += `<g class="sticker">${poly(star, '#ffe14a')}</g>`;
	// stickers on the side
	const [sx, sy] = p(o + 5.1, q + 2.0, 28);
	s += `<circle cx="${r(sx)}" cy="${r(sy)}" r="5" fill="#4ad3ff" stroke="${INK}" stroke-width="1.2"/>`;
	const [tx, ty] = p(o + 5.1, q + 3.3, 34);
	s += `<rect x="${r(tx - 5)}" y="${r(ty - 5)}" width="10" height="10" rx="2" fill="#9dff2e" stroke="${INK}" stroke-width="1.2" transform="rotate(-18 ${r(tx)} ${r(ty)})"/>`;
	return s;
}

function casino(o: number, q: number): string {
	const [b0, b1] = p(o + 1, q + 1, 70);
	const [c0, c1] = p(o + 5, q + 1, 70);
	let s = `<path d="M${r(b0)} ${r(b1)}l-60 -150h40zM${r(c0)} ${r(c1)}l60 -150h-40z" fill="#ffe7a0" opacity=".16" class="beam"/>`;
	s += box(o + 0.4, q + 1, o + 5.6, q + 5.4, 3, 56, '#8a1a14');
	s += box(o + 0.2, q + 0.8, o + 5.8, q + 5.6, 56, 64, '#c42a14');
	for (let i = 0; i <= 14; i++) {
		const [x, y] = p(o + 0.3 + i * 0.38, q + 5.6, 60);
		s += `<circle cx="${r(x)}" cy="${r(y)}" r="2.6" fill="#ffe27a" class="bulb" style="animation-delay:${(i % 3) * 0.25}s"/>`;
	}
	for (let i = 0; i <= 12; i++) {
		const [x, y] = p(o + 5.8, q + 0.9 + i * 0.38, 60);
		s += `<circle cx="${r(x)}" cy="${r(y)}" r="2.6" fill="#ffe27a" class="bulb" style="animation-delay:${(i % 3) * 0.25}s"/>`;
	}
	s += poly(fy(o + 2.3, o + 3.7, q + 5.4, 3, 28), '#ffcf3a');
	s += textX(o + 5.6, q + 2.0, 24, '777', 15, '#ff5c3a', 'neon n2');
	s += textX(o + 5.6, q + 4.2, 24, '777', 15, '#ff5c3a', 'neon');
	// the billboard on the roof
	s += box(o + 0.9, q + 3.0, o + 5.1, q + 3.3, 64, 100, '#200403');
	s += flat(fy(o + 1.05, o + 4.95, q + 3.3, 68, 96), 'none', `stroke="#ffcf3a" stroke-width="2"`);
	s += textY(o + 3, q + 3.3, 75, 'CASINO', 23, '#ffd54a', 'neon');
	// a giant burger on top
	s += at(
		p(o + 3, q + 2.4, 116),
		`<path d="M-34 0q34-36 68 0z" fill="#e8a33c" stroke="${INK}" stroke-width="2"/><rect x="-36" y="-1" width="72" height="6" rx="2" fill="#58c23a" stroke="${INK}" stroke-width="1.4"/><rect x="-34" y="4" width="68" height="6" rx="2" fill="#6b3416" stroke="${INK}" stroke-width="1.4"/><path d="M-34 10h68q-2 8-34 8t-34-8z" fill="#e8a33c" stroke="${INK}" stroke-width="2"/><circle cx="-10" cy="-12" r="1.6" fill="#fff6d0"/><circle cx="6" cy="-16" r="1.6" fill="#fff6d0"/><circle cx="16" cy="-8" r="1.6" fill="#fff6d0"/>`,
		'burger'
	);
	return s;
}

function arcade(o: number, q: number): string {
	let s = box(o + 0.6, q + 0.8, o + 5.4, q + 5.2, 3, 52, '#2a1240');
	// neon edges
	const e = (a: Pt, b: Pt, col: string, cls = 'neon') => `<path d="M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}" stroke="${col}" stroke-width="3" stroke-linecap="round" class="${cls}"/>`;
	s += e(p(o + 0.6, q + 5.2, 52), p(o + 5.4, q + 5.2, 52), '#ff8a2a');
	s += e(p(o + 5.4, q + 5.2, 52), p(o + 5.4, q + 0.8, 52), '#ff8a2a');
	s += e(p(o + 5.4, q + 5.2, 3), p(o + 5.4, q + 5.2, 52), '#ff3ad1', 'neon n2');
	s += e(p(o + 0.6, q + 5.2, 3), p(o + 0.6, q + 5.2, 52), '#ff3ad1', 'neon n2');
	const cols = ['#4ad3ff', '#9dff2e', '#ff8a2a'];
	for (let i = 0; i < 3; i++) {
		const x = o + 1.0 + i * 1.45;
		s += flat(fy(x, x + 1.05, q + 5.2, 8, 32), '#16081f');
		s += flat(fy(x + 0.15, x + 0.9, q + 5.2, 18, 30), cols[i], `class="win" style="animation-delay:${i * 0.5}s"`);
	}
	for (let i = 0; i < 2; i++) {
		const y = q + 1.3 + i * 2;
		s += flat(fx(o + 5.4, y, y + 1.4, 18, 32), cols[(i + 1) % 3], `class="win w2"`);
	}
	s += textY(o + 3, q + 5.2, 40, 'ARCADE', 13, '#ff8a2a', 'neon');
	// the joystick on the roof
	s += box(o + 2.3, q + 2.3, o + 3.7, q + 3.7, 52, 58, '#ff8a2a');
	const [jx, jy] = p(o + 3, q + 3, 58);
	s += `<g class="stick"><path d="M${r(jx)} ${r(jy)}V${r(jy - 26)}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><circle cx="${r(jx)}" cy="${r(jy - 30)}" r="8" fill="#ff3a3a" stroke="${INK}" stroke-width="2"/><circle cx="${r(jx - 2.5)}" cy="${r(jy - 33)}" r="2.4" fill="#fff" opacity=".7"/></g>`;
	return s;
}

function base(o: number, q: number): string {
	const W = '#6b5a23';
	const tower = (x: number, y: number) => box(x, y, x + 1, y + 1, 3, 40, '#57491c') + box(x - 0.1, y - 0.1, x + 1.1, y + 1.1, 40, 46, '#3d3313');
	let s = tower(o + 0.1, q + 0.1);
	s += box(o + 1.1, q + 0.25, o + 4.9, q + 0.85, 3, 24, W);
	s += box(o + 0.25, q + 1.1, o + 0.85, q + 4.9, 3, 24, W);
	s += tower(o + 4.9, q + 0.1);
	s += tower(o + 0.1, q + 4.9);
	// the keep, camo stripes on its faces
	s += box(o + 1.9, q + 1.9, o + 4.1, q + 4.1, 3, 70, '#7a6526');
	for (const [za, zb, col] of [
		[14, 22, '#a8892e'],
		[34, 40, '#4a3d17'],
		[50, 58, '#a8892e']
	] as const) {
		s += flat([p(o + 1.9, q + 4.1, za), p(o + 3.1, q + 4.1, za + 4), p(o + 4.1, q + 4.1, za - 2), p(o + 4.1, q + 4.1, zb - 2), p(o + 3.1, q + 4.1, zb + 4), p(o + 1.9, q + 4.1, zb)], col, 'opacity=".8"');
		s += flat([p(o + 4.1, q + 4.1, za + 2), p(o + 4.1, q + 3.0, za - 3), p(o + 4.1, q + 1.9, za + 1), p(o + 4.1, q + 1.9, zb + 1), p(o + 4.1, q + 3.0, zb - 3), p(o + 4.1, q + 4.1, zb + 2)], shade(col, -0.3), 'opacity=".8"');
	}
	s += poly(fy(o + 2.65, o + 3.35, q + 4.1, 3, 22), '#1d160a');
	// gold diamond over the keep
	s += at(p(o + 3, q + 3, 112), `<path d="M0 -16l13 16-13 16-13-16z" fill="#f2b81f" stroke="#5a4206" stroke-width="2.5"/><path d="M0 -16l5 16-5 16" fill="#ffe08a" opacity=".7"/>`, 'gem');
	// flag on the keep
	const [fxp, fyp] = p(o + 2.3, q + 2.3, 70);
	s += `<path d="M${r(fxp)} ${r(fyp)}V${r(fyp - 40)}" stroke="${INK}" stroke-width="2.5"/>` + at([fxp, fyp - 40], `<path d="M0 0h26l-5 7 5 7H0z" fill="#c42a14" stroke="${INK}" stroke-width="1.6"/><circle cx="10" cy="7" r="3.2" fill="#f4e7cf"/>`, 'flag');
	// radar dish
	s += at(p(o + 3.7, q + 2.5, 70), `<g class="dish"><path d="M-12 -4q10-20 26-4z" fill="#c9c9c9" stroke="${INK}" stroke-width="2"/><path d="M1 -6l2 6" stroke="${INK}" stroke-width="2.5"/></g>`);
	s += box(o + 5.15, q + 1.1, o + 5.75, q + 4.9, 3, 24, W);
	s += box(o + 1.1, q + 5.15, o + 2.5, q + 5.75, 3, 24, W);
	s += box(o + 3.5, q + 5.15, o + 4.9, q + 5.75, 3, 24, W);
	for (let i = 0; i < 4; i++) {
		const x = o + 1.25 + i * (i < 2 ? 0.65 : 0.65) + (i >= 2 ? 1.1 : 0);
		s += box(x, q + 5.15, x + 0.35, q + 5.75, 24, 30, shade(W, -0.1));
	}
	s += tower(o + 4.9, q + 4.9);
	// sandbags at the gate
	for (const x of [2.4, 3.6]) s += ground(o + x, q + 6.2, 3, 9, '#8c7a4c', `stroke="${INK}" stroke-width="1.2"`);
	return s;
}

function shop(o: number, q: number): string {
	let s = box(o + 0.5, q + 1.2, o + 5.5, q + 5.2, 3, 44, '#4c2a85');
	for (const [x0, x1] of [
		[0.8, 2.3],
		[3.7, 5.2]
	]) {
		s += poly(fy(o + x0, o + x1, q + 5.2, 8, 30), '#1d0f3a');
		s += flat(fy(o + x0 + 0.2, o + x0 + 0.5, q + 5.2, 10, 28), '#ffffff', 'opacity=".18"');
	}
	// a hoodie and a chain in the windows
	s += at(p(o + 1.55, q + 5.2, 22), `<path d="M-7 8V-2l7-4 7 4V8z" fill="#d23b3b" transform="skewY(26.6)"/>`);
	s += at(p(o + 4.45, q + 5.2, 24), `<path d="M-8 -6q8 14 16 0" stroke="#ffd54a" stroke-width="2.5" fill="none" transform="skewY(26.6)" class="glint"/>`);
	s += poly(fy(o + 2.6, o + 3.4, q + 5.2, 3, 30), '#a560ff');
	s += poly(fx(o + 5.5, q + 1.8, q + 4.6, 10, 30), '#1d0f3a');
	// striped awning over the front
	for (let i = 0; i < 10; i++) {
		const xa = o + 0.5 + i * 0.5;
		s += poly([p(xa, q + 5.2, 36), p(xa + 0.5, q + 5.2, 36), p(xa + 0.5, q + 5.9, 29), p(xa, q + 5.9, 29)], i % 2 ? '#f0e6ff' : '#a560ff');
	}
	s += textY(o + 3, q + 5.2, 38.5, 'BURGI SHOP', 8, '#f0e6ff');
	// the bag on the roof
	s += at(
		p(o + 3, q + 3.2, 60),
		`<path d="M-14 -22h28l4 26h-36z" fill="#a560ff" stroke="${INK}" stroke-width="2.2"/><path d="M-7 -22q7-14 14 0" stroke="${INK}" stroke-width="2.2" fill="none"/><circle cx="0" cy="-8" r="6" fill="#e8a33c" stroke="${INK}" stroke-width="1.4"/>`,
		'bag'
	);
	return s;
}

function squad(o: number, q: number): string {
	const xm = o + 3;
	const rx = 2.3;
	const rz = 46;
	const y0 = q + 0.8;
	const y1 = q + 5;
	const N = 12;
	let s = '';
	const prof = (t: number) => [xm + rx * Math.cos(t), 3 + rz * Math.sin(t)] as const;
	for (let i = N; i > 0; i--) {
		const ta = (i * Math.PI) / N;
		const tb = ((i - 1) * Math.PI) / N;
		const [xa, za] = prof(ta);
		const [xb, zb] = prof(tb);
		const light = 0.15 * Math.sin((ta + tb) / 2) - 0.25 * Math.max(0, Math.cos((ta + tb) / 2));
		s += poly([p(xa, y0, za), p(xb, y0, zb), p(xb, y1, zb), p(xa, y1, za)], shade('#3c6e3a', light));
	}
	const arch: Pt[] = [];
	for (let i = 0; i <= N; i++) {
		const [x, z] = prof((i * Math.PI) / N);
		arch.push(p(x, y1, z));
	}
	s += poly(arch, '#356233');
	s += poly(fy(xm - 0.55, xm + 0.55, y1, 3, 26), '#1b2e1a');
	s += flat(fy(o + 1.3, o + 2.0, y1, 14, 22), '#ffe27a', 'class="win"');
	s += flat(fy(o + 4.0, o + 4.7, y1, 14, 22), '#ffe27a', 'class="win w2"');
	// radio mast
	const [mx, my] = p(o + 4.6, q + 1.4, 3);
	s += `<path d="M${r(mx)} ${r(my)}V${r(my - 92)}M${r(mx - 7)} ${r(my - 84)}l7-8 7 8" stroke="${INK}" stroke-width="2.5" fill="none"/><circle cx="${r(mx)}" cy="${r(my - 94)}" r="10" fill="none" stroke="#43d35e" stroke-width="2" class="ping"/>`;
	// flag with seven dots
	const [gx, gy] = p(o + 1.2, q + 5.6, 3);
	s += `<path d="M${r(gx)} ${r(gy)}V${r(gy - 54)}" stroke="${INK}" stroke-width="2.5"/>` + at([gx, gy - 54], `<rect width="28" height="15" fill="#43d35e" stroke="${INK}" stroke-width="1.6"/>${Array.from({ length: 7 }, (_, i) => `<circle cx="${4 + (i % 4) * 6.5}" cy="${i < 4 ? 5 : 10.5}" r="1.7" fill="${INK}"/>`).join('')}`, 'flag');
	for (const x of [1.6, 4.4]) s += ground(o + x, q + 5.7, 3, 8, '#8c7a4c', `stroke="${INK}" stroke-width="1.2"`);
	return s;
}

function mayhem(o: number, q: number): string {
	let s = '';
	const pole = (x: number, y: number) => {
		const [a, b] = p(x, y, 26);
		return `<path d="M${r(a)} ${r(b)}V${r(b - 58)}" stroke="#cfd6dc" stroke-width="3"/><rect x="${r(a - 8)}" y="${r(b - 66)}" width="16" height="9" rx="2" fill="#fff6c8" stroke="${INK}" stroke-width="1.4"/>`;
	};
	s += pole(o + 0.6, q + 0.6);
	s += box(o + 0.4, q + 0.4, o + 5.6, q + 5.6, 3, 26, '#2e4416', '#46682a');
	s += flat(fz(o + 1.1, q + 1.1, o + 4.9, q + 4.9, 26), '#6b5a3a');
	s += flat(fz(o + 1.1, q + 1.1, o + 4.9, q + 1.4, 26), '#1a2a0b');
	s += flat(fz(o + 1.1, q + 1.1, o + 1.4, q + 4.9, 26), '#24360f');
	s += ground(o + 2.4, q + 3.2, 26, 9, '#d81e1e');
	s += ground(o + 3.8, q + 2.4, 26, 6, '#d81e1e');
	s += ground(o + 3.2, q + 3.9, 26, 5, '#b51515');
	// crossed guns in the middle of the pit
	s += at(p(o + 3, q + 3, 30), `<path d="M-14 -6l28 12M14 -6l-28 12" stroke="#cfd6dc" stroke-width="4" stroke-linecap="round"/>`, 'guns');
	s += pole(o + 5.4, q + 0.6);
	s += pole(o + 0.6, q + 5.4);
	s += pole(o + 5.4, q + 5.4);
	// beams from the four lamps
	for (const [x, y] of [
		[0.6, 0.6],
		[5.4, 0.6],
		[0.6, 5.4],
		[5.4, 5.4]
	]) {
		const [a, b] = p(o + x, q + y, 88);
		const [c, d] = p(o + 3, q + 3, 26);
		s += `<path d="M${r(a)} ${r(b)}L${r(c - 18)} ${r(d)}L${r(c + 18)} ${r(d)}z" fill="#e6ffb0" opacity=".12" class="beam"/>`;
	}
	s += poly(fy(o + 1.4, o + 4.6, q + 5.6, 8, 22), '#0b1404');
	s += textY(o + 3, q + 5.6, 11, 'MAYHEM', 13, '#9dff2e', 'neon');
	return s;
}

function park(o: number, q: number): string {
	let s = flat(fz(o + 2.7, q + 0.2, o + 3.3, q + 5.8, 3), '#c9b98a');
	s += flat(fz(o + 0.2, q + 2.7, o + 5.8, q + 3.3, 3), '#c9b98a');
	s += ground(o + 3, q + 3, 3, 40, '#2a6fb0', `stroke="${INK}" stroke-width="1.6"`);
	s += ground(o + 3, q + 3, 3, 30, '#4a98d8', 'opacity=".5"');
	const [fxp, fyp] = p(o + 3, q + 3, 3);
	s += `<path d="M${r(fxp)} ${r(fyp)}V${r(fyp - 22)}M${r(fxp - 8)} ${r(fyp - 12)}q8-14 16 0" stroke="#bfe6ff" stroke-width="2.5" fill="none" class="fountain"/>`;
	const leaf = LEAF_PATHS.map((d) => `<path d="${d}"/>`).join('');
	for (const [x, y] of [
		[1, 1],
		[5, 1],
		[1, 5],
		[5, 5],
		[1.2, 3.8]
	]) {
		const [tx, ty] = p(o + x, q + y, 3);
		s += `<path d="M${r(tx)} ${r(ty)}V${r(ty - 26)}" stroke="#5a3a1a" stroke-width="4"/>`;
		s += at([tx, ty - 26], `<g fill="#3ec24a" stroke="#0e3312" stroke-width=".6" transform="translate(-30 -46) scale(2.5)">${leaf}</g>`, 'tree');
	}
	// a bench, and a smoke ring drifting up
	s += box(o + 4.3, q + 3.9, o + 5.4, q + 4.2, 3, 9, '#6b4422');
	s += at(p(o + 4.6, q + 4.4, 40), `<circle r="7" fill="none" stroke="#cfd8cf" stroke-width="3" opacity=".6" class="ring"/>`);
	return s;
}

export const BLOCKS: readonly Block[] = [
	{ id: 'ranked', bx: 0, by: 0, h: 196, slab: '#4b4658', art: ranked },
	{ id: 'cosmetics', bx: 1, by: 0, h: 84, slab: '#4b4658', art: museum },
	{ id: 'casino', bx: 2, by: 0, h: 140, slab: '#4b4658', art: casino },
	{ id: 'arcade', bx: 0, by: 1, h: 98, slab: '#4b4658', art: arcade },
	{ id: 'grind', bx: 1, by: 1, h: 130, slab: '#8a7a52', art: base },
	{ id: 'shop', bx: 2, by: 1, h: 88, slab: '#4b4658', art: shop },
	{ id: 'squad', bx: 0, by: 2, h: 100, slab: '#4b4658', art: squad },
	{ id: 'mayhem', bx: 1, by: 2, h: 96, slab: '#3a5226', art: mayhem },
	{ id: 'park', bx: 2, by: 2, h: 60, slab: '#2f7a34', art: park }
];

/** a block's slab (raised sidewalk) and its drawing */
export function blockArt(b: Block): string {
	const [o, q] = origin(b);
	return box(o, q, o + BLOCK, q + BLOCK, 0, 3, '#5d586b', b.slab) + b.art(o, q);
}

/** the ground: asphalt diamond, sidewalk edges and the dashed middle lines of every road */
export function groundArt(): string {
	let s = poly([p(0, 0), p(GRID, 0), p(GRID, GRID), p(0, GRID)], '#26232f');
	s += flat([p(0, GRID), p(GRID, GRID), p(GRID, GRID, -14), p(0, GRID, -14)], '#17141f');
	s += flat([p(GRID, 0), p(GRID, GRID), p(GRID, GRID, -14), p(GRID, 0, -14)], '#100e17');
	for (const l of LANES) {
		const a = p(0, l);
		const b = p(GRID, l);
		const c = p(l, 0);
		const d = p(l, GRID);
		s += `<path d="M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}M${r(c[0])} ${r(c[1])}L${r(d[0])} ${r(d[1])}" stroke="#e8c440" stroke-width="2" stroke-dasharray="10 12" opacity=".5"/>`;
	}
	return s;
}

/** the silhouette of a block and everything on it (its tap area): a hexagon */
export function hitArea(b: Block): Pt[] {
	const [o, q] = origin(b);
	return [p(o, q, b.h), p(o + BLOCK, q, b.h), p(o + BLOCK, q, 0), p(o + BLOCK, q + BLOCK, 0), p(o, q + BLOCK, 0), p(o, q + BLOCK, b.h)];
}
