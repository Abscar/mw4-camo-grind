/**
 * BurgiDrip's drawings (drip.ts, 2026-11-22): the clothes on an operator. Like faceGear.ts for the face, each
 * emblem draws them on itself, at its own body: `dripUnder` right after its own torso and before its head (the
 * top, the hood behind the neck, a chain and the kicks hung round the neck), `dripOver` after the head and
 * face items but before anything held in a hand (the raid pauldrons + the set-bonus sparkle). Hats are
 * faceGear's `hatItem` ("d-" ids come here, `dripHat`). The store's item pictures (`dripCard`) put the same
 * drawings on a plain dress-form mannequin.
 *
 * Every emblem's torso is nearly the same dome (shoulders 1.5–62.5 wide, top at y ≈ 46–47, cut at the box's
 * bottom); BODY_AT holds each one's centre, top, half width and how low a pendant hangs (under Ingman's beard).
 * The clothes are drawn over the emblem's own shirt / vest / robe, so they show clearly at 64 px.
 *
 * Pure, deterministic strings (no browser APIs, no runes), ids scoped by the caller's `u`, so Node tests them
 * (scripts/drip.test.js) and the prerendered page matches the browser. Moving parts use the `dr-*` classes in
 * src/drip.css (the page's frame cap steps them; reduced motion stops them). Our own cartoons: no brands, no
 * logos, no game art; the raid gear is our own armour in a fantasy-MMO style.
 */
import type { Face, FaceKey, FaceWear } from './faceGear.ts';
import { DRIP_BY_ID, RAID_SETS, setBonus, type Fill, type HatLook, type KickLook, type NeckLook, type Pendant, type Print, type ShoulderLook, type TopLook } from './drip.ts';
import { LEAF_PATHS, LEAF_STEM } from './leaf.ts';

type P = [number, number];
const f = (n: number, d = 2) => +n.toFixed(d);
const O = '#100c10';

/* ---------- where each body is ---------- */

export type BodyKey = FaceKey | 'mannequin';
export interface BodyAt {
	/** the torso's centre line, its top (collar line), half its width at the bottom, its bottom */
	cx: number;
	ty: number;
	hw: number;
	by: number;
	/** how far below the collar line a chain's lowest point hangs */
	drop: number;
	/** the clothes are drawn after this emblem's head (Abscar: over his ghillie poncho), so nothing may reach up
	    past the collar line: no hood behind the neck (it covered his face) */
	overHead?: boolean;
}
/** Read off each emblem's own torso path (they share one dome; Phillestar's is narrower and sits lower). */
export const BODY_AT: Record<BodyKey, BodyAt> = {
	abscar: { cx: 32, ty: 47, hw: 31.5, by: 64.5, drop: 9, overHead: true },
	phillestar: { cx: 30, ty: 50, hw: 25, by: 64.5, drop: 8 },
	lars: { cx: 32, ty: 46.8, hw: 30.5, by: 64.5, drop: 9 },
	jeeven: { cx: 32, ty: 46.5, hw: 31, by: 64.5, drop: 9.5 },
	// his beard covers the chest down to y 56: the chain hangs lower so its pendant shows under it
	ingman: { cx: 32, ty: 46, hw: 30.5, by: 64.5, drop: 13.2 },
	aw: { cx: 32, ty: 47, hw: 30.5, by: 64.5, drop: 9 },
	joker: { cx: 32, ty: 46.2, hw: 31, by: 64.5, drop: 9 },
	// the round initials badge: a smaller torso low in the circle, under the letters
	initials: { cx: 32, ty: 50, hw: 24, by: 64.5, drop: 7.5 },
	mannequin: { cx: 32, ty: 46.5, hw: 30.5, by: 64.5, drop: 9.5 }
};
/** The mannequin's head, for hats on the store's item pictures. */
export const MANNEQUIN_HEAD: Face['head'] = { x: 32, y: 10, w: 26 };

/** The torso's dome: the same curve every emblem uses, `w` wider and `r` higher for puffy coats. */
function torsoD(B: BodyAt, k: number, w = 0, r = 0): string {
	const { cx: c, by: b } = B;
	const hw = B.hw + w;
	const t = B.ty - r;
	return `M${f(c - hw)} ${b} C${f(c - hw + 0.5)} ${f(t + 7.7)} ${f(c - hw + 7)} ${f(t + 1.8)} ${f(c - 11.5 * k)} ${f(t)} L${f(c + 11.5 * k)} ${f(t)} C${f(c + hw - 7)} ${f(t + 1.8)} ${f(c + hw - 0.5)} ${f(t + 7.7)} ${f(c + hw)} ${b} Z`;
}
const mirror = (c: number) => `matrix(-1 0 0 1 ${f(2 * c)} 0)`;

/* ---------- fills ---------- */

interface Paint {
	defs: string;
	fill: string;
	/** drawn over the shape, clipped to it (patterns that aren't a tile: flames, splatter, galaxy, blocks) */
	over: string;
}
interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
}

function seeded(text: string): () => number {
	let h = 2166136261;
	for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
	let s = h >>> 0;
	return () => {
		s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

const lin = (id: string, stops: [number, string][], x2 = 0.3, y2 = 1) =>
	`<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

/** A fill's paint: a colour, or a gradient / pattern (in defs) plus anything drawn over the shape. */
function paint(id: string, fl: Fill, bb: Box): Paint {
	if (typeof fl === 'string') return { defs: '', fill: fl, over: '' };
	const c = fl.c;
	const url = `url(#${id})`;
	const pat = (w: number, h: number, inner: string, tr = '') =>
		`<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${tr ? ` patternTransform="${tr}"` : ''}>${inner}</pattern>`;
	switch (fl.p) {
		case 'heather':
			return { defs: pat(2.4, 2.4, `<rect width="2.4" height="2.4" fill="${c[0]}"/><rect x="0.3" y="0.4" width="0.7" height="0.35" fill="${c[1]}"/><rect x="1.5" y="1.6" width="0.6" height="0.3" fill="${c[1]}"/>`), fill: url, over: '' };
		case 'camo':
			return {
				defs: pat(
					13,
					13,
					`<rect width="13" height="13" fill="${c[0]}"/><path d="M0.6 1.6 C3 0 5.6 2 5 4.4 C4.4 6.8 1 6.2 0.2 4.6 Z M7.6 7.4 C10 5.8 12.8 7.8 12.2 10.2 C11.6 12.6 8.2 12 7.4 10.4 Z" fill="${c[1]}"/><path d="M6 0.4 C8.4 -0.4 10 1.8 8.6 3.4 C7.2 5 5 2.6 6 0.4 Z M1.4 8.8 C3.8 8 5.6 10.4 4 12 C2.4 13.4 0.2 10.8 1.4 8.8 Z M10.4 2.4 C12 2 13.2 3.4 12.4 4.6 C11.4 5.6 9.8 4 10.4 2.4 Z" fill="${c[2]}"/><path d="M4.4 5.6 C5.6 5.2 6.6 6.2 6 7.2 C5.2 8 4 7 4.4 5.6 Z M9.6 0.2 C10.6 0 11 0.8 10.4 1.4 C9.8 1.8 9.2 1 9.6 0.2 Z M2.6 3 C3.2 2.8 3.6 3.4 3.2 3.8 C2.8 4.2 2.2 3.6 2.6 3 Z" fill="${c[3]}"/>`,
					'rotate(-8)'
				),
				fill: url,
				over: ''
			};
		case 'tiedye':
			return {
				defs: `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f(bb.x + bb.w * 0.56)}" cy="${f(bb.y + bb.h * 0.42)}" r="${f(bb.w * 0.11)}" spreadMethod="repeat">${[...c, c[0]].map((col, i) => `<stop offset="${f(i / c.length)}" stop-color="${col}"/>`).join('')}</radialGradient>`,
				fill: url,
				over: ''
			};
		case 'check':
			return { defs: pat(4, 4, `<rect width="4" height="4" fill="${c[0]}"/><rect width="2" height="2" fill="${c[1]}"/><rect x="2" y="2" width="2" height="2" fill="${c[1]}"/>`), fill: url, over: '' };
		case 'plaid':
			return {
				defs: pat(
					7,
					7,
					`<rect width="7" height="7" fill="${c[0]}"/><rect width="2.6" height="7" fill="${c[1]}" opacity="0.55"/><rect width="7" height="2.6" fill="${c[1]}" opacity="0.55"/><path d="M5 0 V7 M0 5 H7" stroke="${c[2]}" stroke-width="0.5"/>`
				),
				fill: url,
				over: ''
			};
		case 'leopard':
			return {
				defs: pat(
					8,
					8,
					`<rect width="8" height="8" fill="${c[0]}"/><path d="M1 1.4 q1.2 -0.8 2 0.4 M0.8 2.6 q1 0.8 2.2 0 M5 4.6 q1.2 -1 2.2 0.2 M4.8 6 q1.2 0.6 2.2 -0.2 M5.6 0.6 q0.8 0.6 1.4 0 M1.2 5.6 q0.8 -0.6 1.6 0.2" fill="none" stroke="${c[1]}" stroke-width="0.7" stroke-linecap="round"/><circle cx="1.9" cy="2" r="0.55" fill="${c[2]}"/><circle cx="6" cy="5.3" r="0.6" fill="${c[2]}"/>`
				),
				fill: url,
				over: ''
			};
		case 'zebra':
			return {
				defs: pat(6, 6, `<rect width="6" height="6" fill="${c[0]}"/><path d="M0 0.6 Q1.6 1.6 3 0.8 Q4.4 0 6 1 L6 2 Q4.4 1.2 3 2 Q1.4 2.8 0 1.8 Z M0 3.6 Q1.8 4.8 3.2 3.8 Q4.6 2.8 6 4 L6 4.8 Q4.4 4 3 5 Q1.4 5.8 0 4.6 Z" fill="${c[1]}"/>`, 'rotate(25)'),
				fill: url,
				over: ''
			};
		case 'galaxy': {
			const r = seeded(id);
			const stars = Array.from({ length: 14 }, () => `<circle cx="${f(bb.x + r() * bb.w)}" cy="${f(bb.y + r() * bb.h)}" r="${f(0.18 + r() * 0.32)}" fill="#ffffff" opacity="${f(0.55 + r() * 0.45)}"/>`).join('');
			return {
				defs: `<radialGradient id="${id}-n1"><stop offset="0" stop-color="${c[1]}" stop-opacity="0.9"/><stop offset="1" stop-color="${c[1]}" stop-opacity="0"/></radialGradient><radialGradient id="${id}-n2"><stop offset="0" stop-color="${c[2]}" stop-opacity="0.75"/><stop offset="1" stop-color="${c[2]}" stop-opacity="0"/></radialGradient><radialGradient id="${id}-n3"><stop offset="0" stop-color="${c[3]}" stop-opacity="0.6"/><stop offset="1" stop-color="${c[3]}" stop-opacity="0"/></radialGradient>`,
				fill: c[0],
				over: `<ellipse cx="${f(bb.x + bb.w * 0.3)}" cy="${f(bb.y + bb.h * 0.55)}" rx="${f(bb.w * 0.3)}" ry="${f(bb.h * 0.45)}" fill="url(#${id}-n1)"/><ellipse cx="${f(bb.x + bb.w * 0.68)}" cy="${f(bb.y + bb.h * 0.4)}" rx="${f(bb.w * 0.25)}" ry="${f(bb.h * 0.38)}" fill="url(#${id}-n2)"/><ellipse cx="${f(bb.x + bb.w * 0.52)}" cy="${f(bb.y + bb.h * 0.8)}" rx="${f(bb.w * 0.2)}" ry="${f(bb.h * 0.3)}" fill="url(#${id}-n3)"/>${stars}`
			};
		}
		case 'money':
			return {
				defs: pat(
					8.4,
					5,
					`<rect width="8.4" height="5" fill="${c[0]}"/><rect x="0.3" y="0.3" width="7.8" height="4.4" rx="0.4" fill="${c[1]}" stroke="${c[2]}" stroke-width="0.3"/><ellipse cx="4.2" cy="2.5" rx="1.3" ry="1.5" fill="none" stroke="${c[2]}" stroke-width="0.35"/><circle cx="1.4" cy="1.3" r="0.4" fill="${c[2]}"/><circle cx="7" cy="3.7" r="0.4" fill="${c[2]}"/>`,
					'rotate(-12)'
				),
				fill: url,
				over: ''
			};
		case 'iri':
			return {
				defs: lin(id, [[0, c[0]], [0.3, c[1]], [0.58, c[2]], [0.82, c[3]], [1, c[0]]], 1, 1),
				fill: url,
				over: `<ellipse cx="${f(bb.x + bb.w * 0.3)}" cy="${f(bb.y + bb.h * 0.25)}" rx="${f(bb.w * 0.18)}" ry="${f(bb.h * 0.12)}" fill="#ffffff" opacity="0.3"/>`
			};
		case 'chrome':
			return { defs: lin(id, [[0, c[0]], [0.3, c[1]], [0.44, c[0]], [0.56, c[1]], [0.8, c[2]], [1, c[1]]]), fill: url, over: '' };
		case 'gold':
			return { defs: lin(id, [[0, c[0]], [0.28, c[1]], [0.45, c[0]], [0.6, c[1]], [0.85, c[2]], [1, c[1]]]), fill: url, over: '' };
		case 'satin':
			return { defs: lin(id, [[0, c[0]], [0.4, c[1]], [0.62, c[0]], [1, c[1]]], 1, 1), fill: url, over: '' };
		case 'splatter': {
			const r = seeded(id);
			const blobs = Array.from({ length: 16 }, (_, i) => {
				const x = bb.x + r() * bb.w;
				const y = bb.y + r() * bb.h;
				const col = c[1 + (i % (c.length - 1))];
				const big = 0.7 + r() * 1.5;
				return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(big)}" fill="${col}"/><circle cx="${f(x + big * 1.4)}" cy="${f(y + big * 0.6)}" r="${f(big * 0.32)}" fill="${col}"/><circle cx="${f(x - big * 0.9)}" cy="${f(y + big * 1.3)}" r="${f(big * 0.22)}" fill="${col}"/>`;
			}).join('');
			return { defs: '', fill: c[0], over: blobs };
		}
		case 'flames': {
			// tongues of fire rising from the bottom edge: three layers, outer to inner
			const layer = (col: string, top: number, n: number, off: number) => {
				let d = `M${f(bb.x - 1)} ${f(bb.y + bb.h + 1)}`;
				const step = (bb.w + 2) / n;
				for (let i = 0; i < n; i++) {
					const x0 = bb.x - 1 + i * step;
					const tip = bb.y + bb.h * (top + (((i * 7 + off) % 5) / 5) * 0.18);
					d += ` C${f(x0 + step * 0.1)} ${f(tip + bb.h * 0.25)} ${f(x0 + step * 0.2)} ${f(tip + bb.h * 0.1)} ${f(x0 + step * 0.55)} ${f(tip)} C${f(x0 + step * 0.5)} ${f(tip + bb.h * 0.16)} ${f(x0 + step * 0.85)} ${f(tip + bb.h * 0.2)} ${f(x0 + step)} ${f(bb.y + bb.h * (top + 0.32))}`;
				}
				return `<path d="${d} L${f(bb.x + bb.w + 1)} ${f(bb.y + bb.h + 1)} Z" fill="${col}"/>`;
			};
			return { defs: '', fill: c[0], over: layer(c[1], 0.32, 7, 0) + layer(c[2], 0.5, 8, 2) + layer(c[3], 0.7, 9, 4) };
		}
		case 'stripes': {
			const h = 1.5;
			return { defs: pat(4, h * c.length, c.map((col, i) => `<rect y="${f(i * h)}" width="4" height="${h}" fill="${col}"/>`).join('')), fill: url, over: '' };
		}
		case 'blocks':
			return {
				defs: '',
				fill: c[0],
				over: `<path d="M${f(bb.x)} ${f(bb.y + bb.h * 0.45)} L${f(bb.x + bb.w * 0.5)} ${f(bb.y + bb.h * 0.75)} L${f(bb.x + bb.w)} ${f(bb.y + bb.h * 0.42)} L${f(bb.x + bb.w)} ${f(bb.y + bb.h)} L${f(bb.x)} ${f(bb.y + bb.h)} Z" fill="${c[1]}"/><path d="M${f(bb.x)} ${f(bb.y + bb.h * 0.45)} L${f(bb.x + bb.w * 0.5)} ${f(bb.y + bb.h * 0.75)} L${f(bb.x + bb.w)} ${f(bb.y + bb.h * 0.42)}" fill="none" stroke="${c[3]}" stroke-width="0.7"/><path d="M${f(bb.x)} ${f(bb.y + bb.h * 0.18)} L${f(bb.x + bb.w * 0.22)} ${f(bb.y)} L${f(bb.x + bb.w * 0.36)} ${f(bb.y)} L${f(bb.x)} ${f(bb.y + bb.h * 0.32)} Z M${f(bb.x + bb.w)} ${f(bb.y + bb.h * 0.18)} L${f(bb.x + bb.w * 0.78)} ${f(bb.y)} L${f(bb.x + bb.w * 0.64)} ${f(bb.y)} L${f(bb.x + bb.w)} ${f(bb.y + bb.h * 0.32)} Z" fill="${c[2]}"/>`
			};
		case 'floral':
			return {
				defs: pat(
					9,
					9,
					`<rect width="9" height="9" fill="${c[0]}"/><ellipse cx="6.8" cy="2.4" rx="1.6" ry="0.6" fill="${c[3]}" transform="rotate(-30 6.8 2.4)"/><ellipse cx="1.6" cy="7" rx="1.4" ry="0.5" fill="${c[3]}" transform="rotate(40 1.6 7)"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${f(2.6 + Math.cos((a * Math.PI) / 180) * 0.95)}" cy="${f(2.6 + Math.sin((a * Math.PI) / 180) * 0.95)}" r="0.8" fill="${c[1]}"/>`).join('')}<circle cx="2.6" cy="2.6" r="0.5" fill="${c[2]}"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${f(6.6 + Math.cos((a * Math.PI) / 180) * 0.8)}" cy="${f(6.4 + Math.sin((a * Math.PI) / 180) * 0.8)}" r="0.65" fill="${c[2]}"/>`).join('')}<circle cx="6.6" cy="6.4" r="0.4" fill="${c[1]}"/>`
				),
				fill: url,
				over: ''
			};
	}
	return { defs: '', fill: '#888', over: '' };
}
/** The first colour of a fill (for strokes and small parts). */
const solid = (fl: Fill) => (typeof fl === 'string' ? fl : fl.c[0]);

/** A shape in a paint: the fill, what's drawn over it (clipped), then its outline. */
function filled(d: string, p: Paint, clip: string, stroke = '', sw = 0): string {
	return `${p.defs}<path d="${d}" fill="${p.fill}"/>${p.over ? `<clipPath id="${clip}"><path d="${d}"/></clipPath><g clip-path="url(#${clip})">${p.over}</g>` : ''}${stroke ? `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${f(sw)}" stroke-linejoin="round"/>` : ''}`;
}
const line = (d: string, col: string, w: number, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const star4 = (x: number, y: number, r: number) => {
	const s = r * 0.28;
	return `M${f(x)} ${f(y - r)} L${f(x + s)} ${f(y - s)} L${f(x + r)} ${f(y)} L${f(x + s)} ${f(y + s)} L${f(x)} ${f(y + r)} L${f(x - s)} ${f(y + s)} L${f(x - r)} ${f(y)} L${f(x - s)} ${f(y - s)} Z`;
};
const FONT = `font-family="'Arial Black', Bahnschrift, 'Segoe UI', sans-serif" font-weight="900"`;

/* ---------- prints on the chest ---------- */

function printMarkup(v: string, pr: Print, x: number, y: number, k: number): string {
	switch (pr.k) {
		case 'box': {
			const w = 11.6 * k;
			const h = 4.2 * k;
			return `<rect x="${f(x - w / 2)}" y="${f(y - h / 2)}" width="${f(w)}" height="${f(h)}" fill="${pr.bg}"/><text x="${f(x)}" y="${f(y + 0.15 * k)}" text-anchor="middle" dominant-baseline="central" ${FONT} font-style="italic" font-size="${f(3.2 * k)}" textLength="${f(w * 0.84)}" lengthAdjust="spacingAndGlyphs" fill="${pr.fg}">${pr.t}</text>`;
		}
		case 'text':
			return pr.t
				.map((s, i) => {
					const fs = 2.3 * k;
					const yy = y + (i - (pr.t.length - 1) / 2) * fs * 1.15;
					return `<text x="${f(x)}" y="${f(yy)}" text-anchor="middle" dominant-baseline="central" ${FONT} font-size="${f(fs)}" textLength="${f(Math.min(14 * k, s.length * fs * 0.72))}" lengthAdjust="spacingAndGlyphs" fill="${pr.c}">${s}</text>`;
				})
				.join('');
		case 'big': {
			const fs = 5.2 * k;
			const id = `${v}-bg`;
			const fill = pr.c.length > 1 ? `url(#${id})` : pr.c[0];
			return `${pr.c.length > 1 ? `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${pr.c.map((c, i) => `<stop offset="${f(i / (pr.c.length - 1))}" stop-color="${c}"/>`).join('')}</linearGradient>` : ''}<text x="${f(x)}" y="${f(y)}" text-anchor="middle" dominant-baseline="central" ${FONT} font-size="${f(fs)}" textLength="${f(Math.min(16 * k, pr.t.length * fs * 0.62))}" lengthAdjust="spacingAndGlyphs" fill="${fill}" stroke="#000" stroke-opacity="0.55" stroke-width="${f(0.35 * k)}" paint-order="stroke">${pr.t}</text>`;
		}
		case 'num': {
			const fs = (pr.t.length > 2 ? 6 : 8) * k;
			return `<text x="${f(x)}" y="${f(y)}" text-anchor="middle" dominant-baseline="central" ${FONT} font-size="${f(fs)}" textLength="${f(Math.min(15 * k, pr.t.length * fs * 0.6))}" lengthAdjust="spacingAndGlyphs" fill="${pr.c}" stroke="${pr.o}" stroke-width="${f(1.1 * k)}" paint-order="stroke" stroke-linejoin="round">${pr.t}</text>`;
		}
		case 'letter': {
			const fs = 7.4 * k;
			return `<text x="${f(x)}" y="${f(y)}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, 'Times New Roman', serif" font-weight="900" font-size="${f(fs)}" fill="${pr.c}" stroke="${pr.o}" stroke-width="${f(1.4 * k)}" paint-order="stroke" stroke-linejoin="round">${pr.t}</text><text x="${f(x)}" y="${f(y)}" text-anchor="middle" dominant-baseline="central" font-family="Georgia, 'Times New Roman', serif" font-weight="900" font-size="${f(fs)}" fill="none" stroke="${pr.c}" stroke-width="${f(0.3 * k)}" stroke-dasharray="${f(0.4 * k)} ${f(0.3 * k)}">${pr.t}</text>`;
		}
		case 'smiley': {
			const r = 3.8 * k;
			return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#ffe23a" stroke="#1a1a1a" stroke-width="${f(0.45 * k)}"/><ellipse cx="${f(x - 1.3 * k)}" cy="${f(y - 1 * k)}" rx="${f(0.45 * k)}" ry="${f(0.8 * k)}" fill="#1a1a1a"/><ellipse cx="${f(x + 1.3 * k)}" cy="${f(y - 1 * k)}" rx="${f(0.45 * k)}" ry="${f(0.8 * k)}" fill="#1a1a1a"/><path d="M${f(x - 2.3 * k)} ${f(y + 0.7 * k)} Q${f(x)} ${f(y + 3.1 * k)} ${f(x + 2.3 * k)} ${f(y + 0.7 * k)}" fill="none" stroke="#1a1a1a" stroke-width="${f(0.5 * k)}" stroke-linecap="round"/>`;
		}
		case 'skull':
			return skullMarkup(x, y, 0.95 * k, pr.c ?? '#e8e4da', '#1a1a1c');
		case 'flame':
			return `<path d="M${f(x)} ${f(y - 4.4 * k)} C${f(x + 3.6 * k)} ${f(y - 1.4 * k)} ${f(x + 3.2 * k)} ${f(y + 3.6 * k)} ${f(x)} ${f(y + 3.6 * k)} C${f(x - 3.4 * k)} ${f(y + 3.6 * k)} ${f(x - 3.4 * k)} ${f(y - 0.4 * k)} ${f(x - 1.2 * k)} ${f(y - 2 * k)} C${f(x - 1 * k)} ${f(y - 0.4 * k)} ${f(x + 0.4 * k)} ${f(y - 0.8 * k)} ${f(x)} ${f(y - 4.4 * k)} Z" fill="#ff6a1a"/><path d="M${f(x)} ${f(y - 1.2 * k)} C${f(x + 1.8 * k)} ${f(y + 0.6 * k)} ${f(x + 1.6 * k)} ${f(y + 3 * k)} ${f(x)} ${f(y + 3 * k)} C${f(x - 1.6 * k)} ${f(y + 3 * k)} ${f(x - 1.6 * k)} ${f(y + 1 * k)} ${f(x)} ${f(y - 1.2 * k)} Z" fill="#ffe23a"/>`;
		case 'leaf':
			return `<g transform="translate(${f(x)} ${f(y + 3.2 * k)}) scale(${f(0.42 * k, 3)}) translate(-12 -20)">${LEAF_PATHS.map((d) => `<path d="${d}" fill="${pr.c ?? '#c8ff5a'}" stroke="#0f3a14" stroke-width="0.8"/>`).join('')}<path d="${LEAF_STEM}" stroke="#0f3a14" stroke-width="1.2"/></g>`;
		case 'burger':
			return burgerMarkup(v, x, y, 0.9 * k);
		case 'bolt':
			return `<path d="M${f(x + 1 * k)} ${f(y - 4.4 * k)} L${f(x - 2.8 * k)} ${f(y + 0.6 * k)} L${f(x - 0.2 * k)} ${f(y + 0.6 * k)} L${f(x - 1.2 * k)} ${f(y + 4.4 * k)} L${f(x + 2.8 * k)} ${f(y - 0.8 * k)} L${f(x + 0.2 * k)} ${f(y - 0.8 * k)} Z" fill="${pr.c ?? '#ffe23a'}" stroke="#1a1a1a" stroke-width="${f(0.4 * k)}" stroke-linejoin="round"/>`;
		case 'star': {
			const pts = Array.from({ length: 10 }, (_, i) => {
				const a = -Math.PI / 2 + (i * Math.PI) / 5;
				const r = (i % 2 ? 1.6 : 3.8) * k;
				return `${f(x + Math.cos(a) * r)},${f(y + Math.sin(a) * r)}`;
			}).join(' ');
			return `<polygon points="${pts}" fill="${pr.c ?? '#ffe23a'}" stroke="#1a1a1a" stroke-width="${f(0.4 * k)}" stroke-linejoin="round"/>`;
		}
		case 'web': {
			const R = 11 * k;
			const spokes = Array.from({ length: 8 }, (_, i) => {
				const a = (i * Math.PI) / 4 + 0.2;
				return `M${f(x)} ${f(y)} L${f(x + Math.cos(a) * R)} ${f(y + Math.sin(a) * R)}`;
			}).join(' ');
			const ring = (r: number) =>
				Array.from({ length: 8 }, (_, i) => {
					const a0 = (i * Math.PI) / 4 + 0.2;
					const a1 = ((i + 1) * Math.PI) / 4 + 0.2;
					const mid = (a0 + a1) / 2;
					return `${i ? '' : `M${f(x + Math.cos(a0) * r)} ${f(y + Math.sin(a0) * r)}`} Q${f(x + Math.cos(mid) * r * 0.8)} ${f(y + Math.sin(mid) * r * 0.8)} ${f(x + Math.cos(a1) * r)} ${f(y + Math.sin(a1) * r)}`;
				}).join('');
			return line(`${spokes} ${ring(R * 0.3)} ${ring(R * 0.55)} ${ring(R * 0.8)}`, pr.c ?? '#fff', 0.4 * k, ' opacity="0.9"');
		}
		case 'dragon': {
			// an embroidered gold dragon coiling across the chest
			const col = pr.c ?? '#e8b830';
			const body = `M${f(x - 9 * k)} ${f(y + 5 * k)} C${f(x - 6 * k)} ${f(y - 4 * k)} ${f(x - 1 * k)} ${f(y + 6 * k)} ${f(x + 2 * k)} ${f(y - 1 * k)} C${f(x + 4 * k)} ${f(y - 5 * k)} ${f(x + 7 * k)} ${f(y - 3 * k)} ${f(x + 8 * k)} ${f(y - 5.4 * k)}`;
			return `${line(body, '#5a3a06', 2.4 * k)}${line(body, col, 1.6 * k)}${line(body, '#fff4b0', 0.4 * k, ` stroke-dasharray="${f(0.4 * k)} ${f(0.6 * k)}"`)}<path d="M${f(x + 7 * k)} ${f(y - 4.6 * k)} L${f(x + 10.6 * k)} ${f(y - 6.4 * k)} L${f(x + 9 * k)} ${f(y - 4 * k)} L${f(x + 10.8 * k)} ${f(y - 3 * k)} L${f(x + 7.4 * k)} ${f(y - 3.4 * k)} Z" fill="${col}" stroke="#5a3a06" stroke-width="${f(0.35 * k)}" stroke-linejoin="round"/><path d="M${f(x + 8.2 * k)} ${f(y - 5.6 * k)} L${f(x + 8.4 * k)} ${f(y - 7.8 * k)} M${f(x + 9 * k)} ${f(y - 5.6 * k)} L${f(x + 10 * k)} ${f(y - 7.4 * k)}" stroke="${col}" stroke-width="${f(0.4 * k)}" stroke-linecap="round"/><circle cx="${f(x + 8.6 * k)}" cy="${f(y - 4.8 * k)}" r="${f(0.3 * k)}" fill="#c8102e"/>${[-6.2, -2.4, 1.4].map((dx) => `<path d="M${f(x + dx * k)} ${f(y + 0.8 * k)} l${f(-0.6 * k)} ${f(1.4 * k)} M${f(x + (dx + 0.6) * k)} ${f(y + 0.8 * k)} l${f(0.6 * k)} ${f(1.4 * k)}" stroke="${col}" stroke-width="${f(0.4 * k)}" stroke-linecap="round"/>`).join('')}`;
		}
		case 'cyborg':
			// Abscar's own cyborg skull in bronze: glowing red eyes, a holk in the grin with an ember
			return `<defs><radialGradient id="${v}-cy"><stop offset="0" stop-color="#ff2a1a" stop-opacity="0.9"/><stop offset="1" stop-color="#ff2a1a" stop-opacity="0"/></radialGradient></defs>${skullMarkup(x, y, 1.15 * k, '#c08a4a', '#2a1608', '#ff2a1a')}${[-1, 1].map((s) => `<circle class="dr-glow" cx="${f(x + s * 1.5 * k)}" cy="${f(y - 0.7 * k)}" r="${f(2.2 * k)}" fill="url(#${v}-cy)"/>`).join('')}${line(`M${f(x + 1.4 * k)} ${f(y + 2.6 * k)} L${f(x + 6 * k)} ${f(y + 3.8 * k)}`, '#2a1608', 1.3 * k)}${line(`M${f(x + 1.4 * k)} ${f(y + 2.6 * k)} L${f(x + 6 * k)} ${f(y + 3.8 * k)}`, '#f3efe4', 0.9 * k)}<circle class="dr-glow" cx="${f(x + 6.1 * k)}" cy="${f(y + 3.8 * k)}" r="${f(0.6 * k)}" fill="#ff8a1a"/>`;
		case 'nuke':
			return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(4.6 * k)}" fill="#ffd21a" stroke="#1a1a1a" stroke-width="${f(0.45 * k)}"/>${trefoil(x, y, 4 * k, '#1a1a1a')}`;
		case 'patches':
			return `<g transform="translate(${f(x - 8.6 * k)} ${f(y - 4.4 * k)})"><rect width="${f(3.4 * k)}" height="${f(3.4 * k)}" fill="#f4f1e8" stroke="#1a1a1a" stroke-width="${f(0.3 * k)}"/><rect width="${f(1.7 * k)}" height="${f(1.7 * k)}" fill="#1a1a1a"/><rect x="${f(1.7 * k)}" y="${f(1.7 * k)}" width="${f(1.7 * k)}" height="${f(1.7 * k)}" fill="#1a1a1a"/></g><circle cx="${f(x + 8.4 * k)}" cy="${f(y - 2.6 * k)}" r="${f(2 * k)}" fill="#2a5ad8" stroke="#f4f1e8" stroke-width="${f(0.4 * k)}"/><path d="${star4(x + 8.4 * k, y - 2.6 * k, 1.3 * k)}" fill="#ffe23a"/><rect x="${f(x + 6.2 * k)}" y="${f(y + 3.2 * k)}" width="${f(4.6 * k)}" height="${f(2 * k)}" rx="${f(0.4 * k)}" fill="#ffd23a" stroke="#1a1a1a" stroke-width="${f(0.3 * k)}"/>`;
	}
	return '';
}

function skullMarkup(x: number, y: number, s: number, bone: string, ink: string, glow = ''): string {
	return `<path d="M${f(x)} ${f(y - 3.6 * s)} C${f(x + 3.4 * s)} ${f(y - 3.6 * s)} ${f(x + 3.6 * s)} ${f(y - 0.4 * s)} ${f(x + 3 * s)} ${f(y + 0.8 * s)} L${f(x + 2.2 * s)} ${f(y + 1.4 * s)} L${f(x + 2 * s)} ${f(y + 3.2 * s)} L${f(x - 2 * s)} ${f(y + 3.2 * s)} L${f(x - 2.2 * s)} ${f(y + 1.4 * s)} L${f(x - 3 * s)} ${f(y + 0.8 * s)} C${f(x - 3.6 * s)} ${f(y - 0.4 * s)} ${f(x - 3.4 * s)} ${f(y - 3.6 * s)} ${f(x)} ${f(y - 3.6 * s)} Z" fill="${bone}" stroke="${ink}" stroke-width="${f(0.35 * s)}"/><ellipse cx="${f(x - 1.3 * s)}" cy="${f(y - 0.6 * s)}" rx="${f(1 * s)}" ry="${f(1.15 * s)}" fill="${glow || ink}"/><ellipse cx="${f(x + 1.3 * s)}" cy="${f(y - 0.6 * s)}" rx="${f(1 * s)}" ry="${f(1.15 * s)}" fill="${glow || ink}"/><path d="M${f(x)} ${f(y + 0.6 * s)} l${f(-0.5 * s)} ${f(0.9 * s)} h${f(1 * s)} Z M${f(x - 1 * s)} ${f(y + 2.2 * s)} v${f(1 * s)} M${f(x)} ${f(y + 2.2 * s)} v${f(1 * s)} M${f(x + 1 * s)} ${f(y + 2.2 * s)} v${f(1 * s)}" fill="${ink}" stroke="${ink}" stroke-width="${f(0.3 * s)}"/>`;
}

/** The radiation sign: three blades (down, up-left, up-right) round a dot. */
function trefoil(x: number, y: number, r: number, col: string): string {
	const r0 = r * 0.3;
	const at = (a: number, rr: number) => `${f(x + Math.cos((a * Math.PI) / 180) * rr)} ${f(y + Math.sin((a * Math.PI) / 180) * rr)}`;
	const blades = [90, 210, 330]
		.map((a) => `M${at(a - 30, r0)} L${at(a - 30, r)} A${f(r)} ${f(r)} 0 0 1 ${at(a + 30, r)} L${at(a + 30, r0)} A${f(r0)} ${f(r0)} 0 0 0 ${at(a - 30, r0)} Z`)
		.join(' ');
	return `<path d="${blades}" fill="${col}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.2)}" fill="${col}"/>`;
}

/** A tiny burger (bun, cheese, patty, bun) for the lei: a few shapes, so a dozen of them stay small. */
function miniBurger(x: number, y: number, s: number): string {
	return `<path d="M${f(x - 1.6 * s)} ${f(y)} Q${f(x - 1.6 * s)} ${f(y - 1.7 * s)} ${f(x)} ${f(y - 1.7 * s)} Q${f(x + 1.6 * s)} ${f(y - 1.7 * s)} ${f(x + 1.6 * s)} ${f(y)} Z" fill="#f0a24a" stroke="#3a1a08" stroke-width="${f(0.2 * s)}"/><rect x="${f(x - 1.75 * s)}" y="${f(y - 0.05 * s)}" width="${f(3.5 * s)}" height="${f(0.5 * s)}" fill="#ffc928"/><rect x="${f(x - 1.7 * s)}" y="${f(y + 0.4 * s)}" width="${f(3.4 * s)}" height="${f(0.7 * s)}" rx="${f(0.3 * s)}" fill="#5c2f18"/><path d="M${f(x - 1.5 * s)} ${f(y + 1.1 * s)} H${f(x + 1.5 * s)} L${f(x + 1.3 * s)} ${f(y + 1.8 * s)} H${f(x - 1.3 * s)} Z" fill="#e8a050" stroke="#3a1a08" stroke-width="${f(0.2 * s)}"/><circle cx="${f(x - 0.5 * s)}" cy="${f(y - 1.1 * s)}" r="${f(0.18 * s)}" fill="#fff4d6"/><circle cx="${f(x + 0.6 * s)}" cy="${f(y - 0.9 * s)}" r="${f(0.18 * s)}" fill="#fff4d6"/>`;
}

function burgerMarkup(v: string, x: number, y: number, s: number): string {
	return `<defs><radialGradient id="${v}-bun" cx="0.38" cy="0.3" r="0.85"><stop offset="0" stop-color="#ffd896"/><stop offset="0.5" stop-color="#f0a24a"/><stop offset="1" stop-color="#b0581b"/></radialGradient></defs><path d="M${f(x - 4 * s)} ${f(y + 1.6 * s)} H${f(x + 4 * s)} L${f(x + 3.6 * s)} ${f(y + 3.2 * s)} Q${f(x + 3.4 * s)} ${f(y + 3.6 * s)} ${f(x + 2.8 * s)} ${f(y + 3.6 * s)} H${f(x - 2.8 * s)} Q${f(x - 3.4 * s)} ${f(y + 3.6 * s)} ${f(x - 3.6 * s)} ${f(y + 3.2 * s)} Z" fill="#e8a050" stroke="#3a1a08" stroke-width="${f(0.35 * s)}"/><rect x="${f(x - 4.3 * s)}" y="${f(y + 0.2 * s)}" width="${f(8.6 * s)}" height="${f(1.6 * s)}" rx="${f(0.8 * s)}" fill="#5c2f18"/><path d="M${f(x - 4.2 * s)} ${f(y)} H${f(x + 4.2 * s)} L${f(x + 3 * s)} ${f(y + 1.2 * s)} L${f(x + 1.6 * s)} ${f(y + 0.4 * s)} L${f(x)} ${f(y + 1.3 * s)} L${f(x - 1.6 * s)} ${f(y + 0.4 * s)} L${f(x - 3 * s)} ${f(y + 1.2 * s)} Z" fill="#ffc928"/><path d="M${f(x - 4.4 * s)} ${f(y - 0.3 * s)} Q${f(x - 3.3 * s)} ${f(y + 0.5 * s)} ${f(x - 2.2 * s)} ${f(y - 0.3 * s)} Q${f(x - 1.1 * s)} ${f(y + 0.5 * s)} ${f(x)} ${f(y - 0.3 * s)} Q${f(x + 1.1 * s)} ${f(y + 0.5 * s)} ${f(x + 2.2 * s)} ${f(y - 0.3 * s)} Q${f(x + 3.3 * s)} ${f(y + 0.5 * s)} ${f(x + 4.4 * s)} ${f(y - 0.3 * s)}" fill="none" stroke="#66c93c" stroke-width="${f(0.7 * s)}"/><path d="M${f(x - 4.2 * s)} ${f(y - 0.5 * s)} C${f(x - 4.2 * s)} ${f(y - 3.6 * s)} ${f(x - 2 * s)} ${f(y - 4.2 * s)} ${f(x)} ${f(y - 4.2 * s)} C${f(x + 2 * s)} ${f(y - 4.2 * s)} ${f(x + 4.2 * s)} ${f(y - 3.6 * s)} ${f(x + 4.2 * s)} ${f(y - 0.5 * s)} Z" fill="url(#${v}-bun)" stroke="#3a1a08" stroke-width="${f(0.35 * s)}"/>${[
		[-1.8, -2.6],
		[0.4, -3.2],
		[2.2, -2.2],
		[-0.6, -1.6]
	]
		.map(([dx, dy]) => `<ellipse cx="${f(x + dx * s)}" cy="${f(y + dy * s)}" rx="${f(0.45 * s)}" ry="${f(0.25 * s)}" fill="#fff4d6"/>`)
		.join('')}`;
}

/* ---------- tops ---------- */

/** A top on a body: the hood behind the neck (if it has one), the garment, its details, its print. */
export function topMarkup(u: string, L: TopLook, B: BodyAt): string {
	const v = `${u}-dt`;
	const k = B.hw / 30.5;
	const { cx: c, ty: t, by: b } = B;
	const X = (n: number) => f(c + n * k);
	const Y = (n: number) => f(t + n * k);
	const E = c - B.hw;
	const mir = mirror(c);
	const puffy = L.kind === 'puffer' || L.kind === 'fur';
	const D = torsoD(B, k, puffy ? 2.2 * k : 0, puffy ? 1.2 * k : 0);
	const bb: Box = { x: c - B.hw - 3, y: t - 3, w: 2 * B.hw + 6, h: b - t + 3 };
	const body = paint(`${v}-b`, L.body, bb);
	const T = L.trim;
	const out: string[] = [];
	const sleeveD = `M${f(E - 3)} ${f(t - 3)} L${f(E + 10.5 * k)} ${f(t + 0.6)} Q${f(E + 8.2 * k)} ${f(t + 8)} ${f(E + 9 * k)} ${f(b + 1)} L${f(E - 3)} ${f(b + 1)} Z`;
	const seamD = `M${f(E + 10.5 * k)} ${f(t + 0.9)} Q${f(E + 8.2 * k)} ${f(t + 8)} ${f(E + 9 * k)} ${f(b)}`;
	const both = (s: string) => `${s}<g transform="${mir}">${s}</g>`;
	const inTorso = (s: string, id: string) => `<clipPath id="${v}-${id}"><path d="${D}"/></clipPath><g clip-path="url(#${v}-${id})">${s}</g>`;

	// behind the neck: a hood (hoodies, the raid harness)
	if (!B.overHead && (L.kind === 'hoodie' || L.kind === 'zip' || L.kind === 'harness')) {
		const hood = `M${X(-13)} ${f(t + 2.5)} C${X(-15.6)} ${Y(-4.6)} ${X(-8.6)} ${Y(-8.2)} ${f(c)} ${Y(-8.2)} C${X(8.6)} ${Y(-8.2)} ${X(15.6)} ${Y(-4.6)} ${X(13)} ${f(t + 2.5)} Z`;
		const hp = paint(`${v}-h`, L.body, bb);
		out.push(filled(hood, hp, `${v}-hc`), `<path d="${hood}" fill="#000" opacity="0.28"/>`, `<path d="M${X(-9)} ${f(t + 1)} C${X(-10)} ${Y(-3.6)} ${X(-5)} ${Y(-5.6)} ${f(c)} ${Y(-5.6)} C${X(5)} ${Y(-5.6)} ${X(10)} ${Y(-3.6)} ${X(9)} ${f(t + 1)} Z" fill="#000" opacity="0.35"/>`, line(hood, O, 0.8));
	}

	// the garment
	out.push(filled(D, body, `${v}-c`));
	if (L.sleeve) {
		const sp = paint(`${v}-s`, L.sleeve, bb);
		out.push(sp.defs, inTorso(`<path d="${sleeveD}" fill="${sp.fill}"/><path d="${sleeveD}" transform="${mir}" fill="${sp.fill}"/>`, 'sl'));
	}

	switch (L.kind) {
		case 'tee':
			out.push(
				line(`M${X(-6.4)} ${Y(0.2)} Q${f(c)} ${Y(5.2)} ${X(6.4)} ${Y(0.2)}`, T, 1.7 * k),
				line(`M${X(-5.5)} ${Y(1.3)} Q${f(c)} ${Y(5.6)} ${X(5.5)} ${Y(1.3)}`, 'rgba(0,0,0,.3)', 0.4 * k),
				both(line(`M${f(E + 0.7)} ${Y(13)} Q${f(E + 5 * k)} ${Y(11.6)} ${f(E + 9.6 * k)} ${Y(13)}`, T, 1.1 * k)),
				both(line(`M${X(-14)} ${Y(4)} Q${X(-12)} ${Y(10)} ${X(-13)} ${f(b)}`, 'rgba(0,0,0,.16)', 0.6 * k))
			);
			break;
		case 'hoodie':
		case 'zip':
			out.push(
				line(`M${X(-10.4)} ${Y(0.6)} Q${f(c)} ${Y(6.8)} ${X(10.4)} ${Y(0.6)}`, T, 2.3 * k),
				line(`M${X(-10.4)} ${Y(0.6)} Q${f(c)} ${Y(6.8)} ${X(10.4)} ${Y(0.6)}`, 'rgba(0,0,0,.35)', 0.4 * k, ` transform="translate(0 ${f(1 * k)})"`)
			);
			if (L.kind === 'zip') {
				out.push(
					line(`M${f(c)} ${Y(5.4)} V${f(b)}`, '#2a2c30', 1.4 * k),
					line(`M${f(c)} ${Y(5.4)} V${f(b)}`, '#c8ccd2', 0.8 * k, ` stroke-dasharray="${f(0.35 * k)} ${f(0.35 * k)}" stroke-linecap="butt"`),
					`<rect x="${X(0.3)}" y="${Y(5.6)}" width="${f(0.9 * k)}" height="${f(2.2 * k)}" rx="${f(0.3 * k)}" fill="#c8ccd2" stroke="${O}" stroke-width="0.2"/>`,
					both(line(`M${X(-11.4)} ${Y(9.6)} L${X(-8.4)} ${Y(14.6)}`, 'rgba(0,0,0,.45)', 0.6 * k))
				);
			} else {
				out.push(line(`M${X(-9.4)} ${f(b)} L${X(-7.8)} ${Y(13.2)} Q${f(c)} ${Y(12.2)} ${X(7.8)} ${Y(13.2)} L${X(9.4)} ${f(b)}`, 'rgba(0,0,0,.42)', 0.75 * k));
			}
			out.push(
				both(
					`${line(`M${X(-2.7)} ${Y(3.8)} Q${X(-3.5)} ${Y(7)} ${X(-3)} ${Y(10.4)}`, '#f4f1e8', 0.75 * k)}${line(`M${X(-3)} ${Y(10.2)} L${X(-3)} ${Y(11.6)}`, '#c8ccd2', 1 * k, ' stroke-linecap="butt"')}`
				)
			);
			break;
		case 'puffer': {
			const baff = [1, 2, 3]
				.map((i) => {
					const y = t - 1.2 * k + i * 5.1 * k;
					return `${line(`M${f(c - B.hw - 3)} ${f(y)} Q${f(c)} ${f(y + 2.4 * k)} ${f(c + B.hw + 3)} ${f(y)}`, 'rgba(0,0,0,.45)', 0.9 * k)}${line(`M${f(c - B.hw - 3)} ${f(y + 1.3 * k)} Q${f(c)} ${f(y + 3.7 * k)} ${f(c + B.hw + 3)} ${f(y + 1.3 * k)}`, 'rgba(255,255,255,.3)', 1.1 * k)}`;
				})
				.join('');
			out.push(
				inTorso(baff, 'pc'),
				both(`<ellipse cx="${X(-17)}" cy="${Y(3.6)}" rx="${f(4.2 * k)}" ry="${f(1.5 * k)}" fill="#ffffff" opacity="0.28" transform="rotate(-18 ${X(-17)} ${Y(3.6)})"/>`),
				line(`M${f(c)} ${Y(3)} V${f(b)}`, 'rgba(0,0,0,.5)', 0.7 * k)
			);
			const collar = `M${X(-9.8)} ${Y(1.8)} C${X(-10.6)} ${Y(-4.8)} ${X(10.6)} ${Y(-4.8)} ${X(9.8)} ${Y(1.8)} Q${f(c)} ${Y(4.2)} ${X(-9.8)} ${Y(1.8)} Z`;
			out.push(`<path d="${collar}" fill="${body.fill}"/>`, `<path d="${collar}" fill="#000" opacity="0.12"/>`, line(`M${X(-8.6)} ${Y(-1.6)} Q${f(c)} ${Y(-4)} ${X(8.6)} ${Y(-1.6)}`, 'rgba(255,255,255,.35)', 0.8 * k), line(collar, O, 0.8));
			break;
		}
		case 'varsity':
			out.push(
				both(line(seamD, 'rgba(0,0,0,.4)', 0.6 * k)),
				line(`M${X(-9)} ${Y(0.4)} Q${f(c)} ${Y(7.4)} ${X(9)} ${Y(0.4)}`, T, 2.6 * k),
				line(`M${X(-9)} ${Y(1.1)} Q${f(c)} ${Y(8.1)} ${X(9)} ${Y(1.1)}`, solid(L.body), 0.45 * k),
				line(`M${X(-9)} ${Y(-0.3)} Q${f(c)} ${Y(6.7)} ${X(9)} ${Y(-0.3)}`, solid(L.body), 0.45 * k),
				line(`M${f(c)} ${Y(4.8)} V${f(b)}`, 'rgba(0,0,0,.45)', 0.5 * k),
				[6.6, 10.6, 14.6].map((n) => `<circle cx="${X(0.9)}" cy="${Y(n)}" r="${f(0.7 * k)}" fill="${T}" stroke="${O}" stroke-width="0.3"/>`).join('')
			);
			break;
		case 'bomber':
			out.push(
				`<path d="M${X(-3.2)} ${Y(2.2)} L${f(c)} ${Y(7.8)} L${X(3.2)} ${Y(2.2)} Z" fill="${T}"/>`,
				line(`M${X(-9.6)} ${Y(0.8)} Q${f(c)} ${Y(5.8)} ${X(9.6)} ${Y(0.8)}`, '#1c1c1e', 2.6 * k),
				line(`M${X(-9.6)} ${Y(0.8)} Q${f(c)} ${Y(5.8)} ${X(9.6)} ${Y(0.8)}`, T, 0.45 * k),
				line(`M${f(c)} ${Y(7.4)} V${f(b)}`, '#2a2c30', 1.3 * k),
				line(`M${f(c)} ${Y(7.4)} V${f(b)}`, '#c8ccd2', 0.7 * k, ` stroke-dasharray="${f(0.3 * k)} ${f(0.3 * k)}" stroke-linecap="butt"`),
				`<g transform="translate(${X(-21.5)} ${Y(6.4)}) rotate(-14)"><rect x="${f(-2.4 * k)}" y="${f(-1.6 * k)}" width="${f(4.8 * k)}" height="${f(3.2 * k)}" rx="${f(0.5 * k)}" fill="${body.fill}" stroke="${O}" stroke-width="0.4"/><path d="M${f(-1.8 * k)} ${f(-0.6 * k)} H${f(1.8 * k)}" stroke="#c8ccd2" stroke-width="${f(0.45 * k)}"/></g>`,
				both(line(`M${f(E + 1)} ${Y(14.6)} Q${f(E + 5 * k)} ${Y(13.4)} ${f(E + 9.4 * k)} ${Y(14.8)}`, '#1c1c1e', 1.4 * k))
			);
			if (typeof L.body !== 'string' && (L.body.p === 'chrome' || L.body.p === 'satin')) out.push(both(line(`M${X(-23)} ${Y(4)} Q${X(-19)} ${Y(1.6)} ${X(-14)} ${Y(2.2)}`, 'rgba(255,255,255,.55)', 0.9 * k)));
			break;
		case 'track': {
			const st = solid(L.sleeve ?? T);
			out.push(
				both(
					`${line(`M${f(E + 6.6 * k)} ${f(t + 1.8)} Q${f(E + 4.6 * k)} ${f(t + 9)} ${f(E + 5.2 * k)} ${f(b + 1)}`, st, 0.95 * k)}${line(`M${f(E + 8.6 * k)} ${f(t + 1.4)} Q${f(E + 6.6 * k)} ${f(t + 9)} ${f(E + 7.2 * k)} ${f(b + 1)}`, st, 0.95 * k)}`
				)
			);
			const collar = `M${X(-8.6)} ${Y(1.4)} C${X(-9.2)} ${Y(-3.4)} ${X(9.2)} ${Y(-3.4)} ${X(8.6)} ${Y(1.4)} Q${f(c)} ${Y(3.4)} ${X(-8.6)} ${Y(1.4)} Z`;
			out.push(`<path d="${collar}" fill="${T}" stroke="${O}" stroke-width="0.6"/>`, line(`M${f(c)} ${Y(2.6)} V${f(b)}`, '#c8ccd2', 0.8 * k, ` stroke-dasharray="${f(0.3 * k)} ${f(0.3 * k)}" stroke-linecap="butt"`));
			break;
		}
		case 'jersey':
			out.push(
				both(line(seamD, T, 1.6 * k)),
				`<path d="M${X(-6.2)} ${Y(-0.2)} L${f(c)} ${Y(7.4)} L${X(6.2)} ${Y(-0.2)} Z" fill="${solid(L.sleeve ?? '#f6f5f1')}"/>`,
				line(`M${X(-6.2)} ${Y(-0.2)} L${f(c)} ${Y(7.4)} L${X(6.2)} ${Y(-0.2)}`, T, 1.6 * k)
			);
			break;
		case 'denim':
		case 'flannel': {
			const collar = `M${X(-10.6)} ${Y(0.4)} L${X(-3.2)} ${Y(1.6)} L${X(-6.6)} ${Y(7)} Z`;
			const btn = L.kind === 'denim' ? T : '#f4f1e8';
			out.push(
				both(`<path d="${collar}" fill="${body.fill}"/><path d="${collar}" fill="#000" opacity="0.2"/>${line(collar, O, 0.5)}`),
				line(`M${f(c)} ${Y(2)} V${f(b)}`, 'rgba(0,0,0,.35)', 0.5 * k),
				[5.2, 9.6, 14].map((n) => `<circle cx="${X(0.9)}" cy="${Y(n)}" r="${f(0.6 * k)}" fill="${btn}" stroke="${O}" stroke-width="0.25"/>`).join('')
			);
			const flap = `M${X(-10.8)} ${Y(5.8)} L${X(-4.8)} ${Y(5.8)} L${X(-4.8)} ${Y(7.4)} L${X(-7.8)} ${Y(8.6)} L${X(-10.8)} ${Y(7.4)} Z`;
			const pocket = `<rect x="${X(-10.6)}" y="${Y(6.4)}" width="${f(5.6 * k)}" height="${f(4.6 * k)}" fill="${body.fill}" stroke="rgba(0,0,0,.4)" stroke-width="0.4"/>${line(flap, 'rgba(0,0,0,.45)', 0.4)}<path d="${flap}" fill="#000" opacity="0.12"/><circle cx="${X(-7.8)}" cy="${Y(7.6)}" r="${f(0.5 * k)}" fill="${btn}"/>`;
			out.push(L.kind === 'denim' ? both(pocket) : pocket);
			if (L.kind === 'denim') out.push(both(line(seamD, T, 0.35 * k, ` stroke-dasharray="${f(0.5 * k)} ${f(0.4 * k)}"`)), both(line(flap, T, 0.3 * k, ` stroke-dasharray="${f(0.4 * k)} ${f(0.35 * k)}"`)));
			break;
		}
		case 'leather':
			out.push(
				`<path d="M${X(-9.6)} ${Y(0.3)} L${X(-3)} ${Y(1)} L${X(-5)} ${Y(10.5)} L${X(-11.6)} ${Y(5.4)} Z" fill="#26262a" stroke="${O}" stroke-width="0.5"/>`,
				`<path d="M${X(9.6)} ${Y(0.3)} L${X(3)} ${Y(1)} L${X(1.2)} ${Y(9)} L${X(12)} ${Y(5)} Z" fill="#26262a" stroke="${O}" stroke-width="0.5"/>`,
				line(`M${X(5.4)} ${Y(4.4)} Q${X(2)} ${Y(9)} ${X(-3)} ${f(b)}`, '#2a2c30', 1.3 * k),
				line(`M${X(5.4)} ${Y(4.4)} Q${X(2)} ${Y(9)} ${X(-3)} ${f(b)}`, T, 0.7 * k, ` stroke-dasharray="${f(0.3 * k)} ${f(0.3 * k)}" stroke-linecap="butt"`),
				`<circle cx="${X(-10.6)}" cy="${Y(5)}" r="${f(0.6 * k)}" fill="${T}"/><circle cx="${X(10.9)}" cy="${Y(4.8)}" r="${f(0.6 * k)}" fill="${T}"/>`,
				both(line(`M${X(-22)} ${Y(4)} Q${X(-18)} ${Y(1.8)} ${X(-14)} ${Y(2.4)}`, 'rgba(255,255,255,.35)', 0.8 * k)),
				both(line(`M${X(-12.6)} ${Y(10)} L${X(-9.4)} ${Y(15)}`, T, 0.6 * k))
			);
			break;
		case 'hawaii':
			out.push(
				`<path d="M${X(-3.4)} ${Y(1.2)} L${f(c)} ${Y(8.2)} L${X(3.4)} ${Y(1.2)} Z" fill="#f4f1e8"/>`,
				both(`<path d="M${X(-11.6)} ${Y(0.6)} L${X(-3.4)} ${Y(1.2)} L${X(-3.8)} ${Y(8.4)} L${X(-12.4)} ${Y(4.8)} Z" fill="${body.fill}"/><path d="M${X(-11.6)} ${Y(0.6)} L${X(-3.4)} ${Y(1.2)} L${X(-3.8)} ${Y(8.4)} L${X(-12.4)} ${Y(4.8)} Z" fill="#000" opacity="0.18" stroke="${O}" stroke-width="0.5"/>`),
				[11, 15].map((n) => `<circle cx="${X(0.5)}" cy="${Y(n)}" r="${f(0.55 * k)}" fill="#f4f1e8" stroke="${O}" stroke-width="0.25"/>`).join(''),
				line(`M${f(c)} ${Y(8.2)} V${f(b)}`, 'rgba(0,0,0,.3)', 0.45 * k)
			);
			break;
		case 'fur': {
			const r = seeded(`${v}-fur`);
			const strands = Array.from({ length: 34 }, () => {
				const x = bb.x + r() * bb.w;
				const y = bb.y + r() * bb.h;
				return `M${f(x)} ${f(y)} q${f(0.6 * k)} ${f(1.1 * k)} ${f(-0.2 * k)} ${f(2.2 * k)}`;
			}).join(' ');
			out.push(inTorso(`${line(strands, T, 0.55 * k, ' opacity="0.85"')}${line(strands, 'rgba(0,0,0,.25)', 0.35 * k, ` transform="translate(${f(0.5 * k)} ${f(0.3 * k)})"`)}`, 'fc'));
			out.push(`<path d="M${X(-4.6)} ${Y(1)} L${X(-2.6)} ${f(b)} L${X(2.6)} ${f(b)} L${X(4.6)} ${Y(1)} Z" fill="${solid(L.sleeve ?? '#16171a')}"/>`);
			const puffs: string[] = [];
			for (let i = 0; i <= 10; i++) {
				const a = Math.PI + (i / 10) * Math.PI;
				puffs.push(`<circle cx="${f(c + Math.cos(a) * 12.4 * k)}" cy="${f(t + 3.4 * k + Math.sin(a) * 4.6 * k)}" r="${f(2.5 * k)}"/>`);
			}
			for (let i = 0; i < 5; i++) {
				const yy = t + 3.6 * k + i * 3.4 * k;
				const xx = 4.4 - i * 0.4;
				puffs.push(`<circle cx="${X(-xx)}" cy="${f(yy)}" r="${f(1.9 * k)}"/><circle cx="${X(xx)}" cy="${f(yy)}" r="${f(1.9 * k)}"/>`);
			}
			out.push(`<g fill="${T}" stroke="rgba(0,0,0,.25)" stroke-width="${f(0.3 * k)}">${puffs.join('')}</g>`);
			break;
		}
		case 'wind':
		case 'moto': {
			if (L.kind === 'moto') {
				out.push(inTorso(`<rect x="${f(E - 2)}" y="${Y(9)}" width="${f(2 * B.hw + 4)}" height="${f(3 * k)}" fill="${T}"/><rect x="${f(E - 2)}" y="${Y(12.6)}" width="${f(2 * B.hw + 4)}" height="${f(0.8 * k)}" fill="#16171a"/>`, 'mc'));
				out.push(both(line(`M${f(E + 6.6 * k)} ${f(t + 1.8)} Q${f(E + 4.6 * k)} ${f(t + 9)} ${f(E + 5.2 * k)} ${f(b + 1)}`, T, 1.4 * k)));
			}
			const collar = `M${X(-8.6)} ${Y(1.4)} C${X(-9.2)} ${Y(-3.6)} ${X(9.2)} ${Y(-3.6)} ${X(8.6)} ${Y(1.4)} Q${f(c)} ${Y(3.4)} ${X(-8.6)} ${Y(1.4)} Z`;
			const zx = L.kind === 'moto' ? -2.4 : 0;
			out.push(
				`<path d="${collar}" fill="${T}" stroke="${O}" stroke-width="0.6"/>`,
				line(`M${X(zx)} ${Y(2.4)} V${L.kind === 'moto' ? f(b) : Y(10)}`, '#c8ccd2', 0.8 * k, ` stroke-dasharray="${f(0.3 * k)} ${f(0.3 * k)}" stroke-linecap="butt"`),
				`<rect x="${X(zx - 0.4)}" y="${L.kind === 'moto' ? Y(3) : Y(9.4)}" width="${f(0.9 * k)}" height="${f(2 * k)}" rx="${f(0.3 * k)}" fill="#c8ccd2"/>`
			);
			if (L.kind === 'wind') out.push(`<rect x="${X(6.4)}" y="${Y(5.6)}" width="${f(3.6 * k)}" height="${f(1.6 * k)}" rx="${f(0.4 * k)}" fill="#f4f1e8" stroke="${O}" stroke-width="0.25"/>`);
			break;
		}
		case 'plate': {
			const G = L.glow ?? '#fff';
			out.push(
				inTorso([0, 1, 2].map((i) => both(`${line(`M${f(E - 1)} ${Y(4.6 + i * 3.6)} Q${f(E + 5 * k)} ${Y(2.8 + i * 3.6)} ${f(E + 10.4 * k)} ${Y(5 + i * 3.6)}`, O, 1.3 * k)}${line(`M${f(E - 1)} ${Y(4.6 + i * 3.6)} Q${f(E + 5 * k)} ${Y(2.8 + i * 3.6)} ${f(E + 10.4 * k)} ${Y(5 + i * 3.6)}`, T, 0.6 * k)}`)).join(''), 'pl')
			);
			const gorget = `M${X(-11)} ${Y(0.8)} Q${f(c)} ${Y(7.4)} ${X(11)} ${Y(0.8)} L${X(12.6)} ${Y(3.8)} Q${f(c)} ${Y(10.4)} ${X(-12.6)} ${Y(3.8)} Z`;
			const shield = `M${X(-8.2)} ${Y(5.4)} Q${f(c)} ${Y(3.6)} ${X(8.2)} ${Y(5.4)} L${X(7.2)} ${Y(13.4)} Q${f(c)} ${Y(18)} ${X(-7.2)} ${Y(13.4)} Z`;
			out.push(
				`<path d="${shield}" fill="${body.fill}"/>`,
				`<path d="${shield}" fill="#fff" opacity="0.08"/>`,
				line(shield, O, 1.6 * k),
				line(shield, T, 0.9 * k),
				line(`M${X(-6.6)} ${Y(6.6)} Q${f(c)} ${Y(5.2)} ${X(6.6)} ${Y(6.6)}`, 'rgba(255,255,255,.4)', 0.5 * k),
				`<path d="${gorget}" fill="${body.fill}"/>`,
				line(gorget, O, 1.2 * k),
				line(gorget, T, 0.55 * k),
				line(`M${X(-9.4)} ${Y(16.6)} Q${f(c)} ${Y(19.4)} ${X(9.4)} ${Y(16.6)}`, T, 0.7 * k),
				[
					[-7.4, 6.4],
					[7.4, 6.4],
					[-6.4, 12.8],
					[6.4, 12.8]
				]
					.map(([x, y]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="${f(0.45 * k)}" fill="${T}" stroke="${O}" stroke-width="0.2"/>`)
					.join(''),
				emblemMarkup(v, L.emblem ?? 'rune', c, t + 10 * k, k, G)
			);
			break;
		}
		case 'robe': {
			const G = L.glow ?? '#7dff3a';
			out.push(
				`<path d="M${X(-4.4)} ${Y(0.4)} L${f(c)} ${Y(12.4)} L${X(4.4)} ${Y(0.4)} Z" fill="#070a05"/>`,
				both(`${line(`M${X(-4.8)} ${Y(0.6)} L${f(c - 0.4)} ${Y(12.6)} L${X(-1.6)} ${f(b)}`, O, 2.2 * k)}${line(`M${X(-4.8)} ${Y(0.6)} L${f(c - 0.4)} ${Y(12.6)} L${X(-1.6)} ${f(b)}`, '#c9961e', 1.3 * k)}`),
				both(
					`<g class="dr-glow" fill="none" stroke="${G}" stroke-width="${f(0.45 * k)}" stroke-linecap="round">${[3, 7, 14.4]
						.map((n) => `<path d="M${X(-9.6)} ${Y(n)} l${f(0.9 * k)} ${f(-1.3 * k)} l${f(0.9 * k)} ${f(1.3 * k)} m${f(-0.9 * k)} ${f(-1.3 * k)} v${f(2.4 * k)}"/>`)
						.join('')}</g>`
				),
				both(line(seamD, '#c9961e', 0.7 * k)),
				emblemMarkup(v, L.emblem ?? 'eye', c, t + 15.6 * k, 0.8 * k, G)
			);
			break;
		}
		case 'harness': {
			const strap = (d: string) => `${line(d, '#120e0a', 2.8 * k)}${line(d, T, 1.9 * k)}${line(d, '#e0c890', 0.25 * k, ` stroke-dasharray="${f(0.4 * k)} ${f(0.4 * k)}"`)}`;
			out.push(
				line(`M${X(-10.4)} ${Y(0.6)} Q${f(c)} ${Y(6.6)} ${X(10.4)} ${Y(0.6)}`, '#16121e', 2.4 * k),
				strap(`M${X(-15)} ${Y(1.4)} L${X(11)} ${f(b + 1)}`),
				strap(`M${X(15)} ${Y(1.4)} L${X(-11)} ${f(b + 1)}`),
				`<rect x="${X(-1.6)}" y="${Y(7.4)}" width="${f(3.2 * k)}" height="${f(3.2 * k)}" rx="${f(0.5 * k)}" fill="none" stroke="#c8ccd2" stroke-width="${f(0.7 * k)}"/>`,
				`<g transform="translate(${X(-9.4)} ${Y(5.6)}) rotate(36)"><path d="M0 ${f(-0.8 * k)} L${f(5.4 * k)} 0 L0 ${f(0.8 * k)} Z" fill="#d8dde2" stroke="${O}" stroke-width="0.25"/><rect x="${f(-2.6 * k)}" y="${f(-0.6 * k)}" width="${f(2.4 * k)}" height="${f(1.2 * k)}" fill="#3a2a1a"/><rect x="${f(-0.4 * k)}" y="${f(-1.3 * k)}" width="${f(0.5 * k)}" height="${f(2.6 * k)}" fill="#c8ccd2"/></g>`,
				`<circle class="dr-glow" cx="${X(0)}" cy="${Y(9)}" r="${f(0.6 * k)}" fill="${L.glow ?? '#9a8cff'}"/>`
			);
			break;
		}
	}

	if (L.print) {
		const px = L.print.k === 'letter' ? c + 10.6 * k : c;
		const py = L.kind === 'hoodie' || L.kind === 'zip' ? t + 8.4 * k : L.print.k === 'num' ? t + 11 * k : L.print.k === 'web' ? t + 8 * k : t + 9.4 * k;
		const pm = printMarkup(v, L.print, px, py, k);
		out.push(L.print.k === 'web' || L.print.k === 'dragon' ? inTorso(pm, 'pr') : pm);
	}
	out.push(line(D, O, 1.05));
	return `<g class="dr-top">${out.join('')}</g>`;
}

/** The emblem on a raid breastplate, glowing. */
function emblemMarkup(v: string, kind: NonNullable<TopLook['emblem']>, x: number, y: number, k: number, G: string): string {
	const glow = `<circle class="dr-glow" cx="${f(x)}" cy="${f(y)}" r="${f(3.6 * k)}" fill="url(#${v}-eg)"/>`;
	const defs = `<radialGradient id="${v}-eg"><stop offset="0" stop-color="${G}" stop-opacity="0.85"/><stop offset="1" stop-color="${G}" stop-opacity="0"/></radialGradient>`;
	let mark = '';
	if (kind === 'sun') {
		const rays = Array.from({ length: 8 }, (_, i) => {
			const a = (i * Math.PI) / 4;
			return `M${f(x + Math.cos(a) * 1.9 * k)} ${f(y + Math.sin(a) * 1.9 * k)} L${f(x + Math.cos(a) * 3.1 * k)} ${f(y + Math.sin(a) * 3.1 * k)}`;
		}).join(' ');
		mark = `${line(rays, G, 0.6 * k)}<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.6 * k)}" fill="${G}" stroke="#7a5208" stroke-width="${f(0.3 * k)}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(0.7 * k)}" fill="#fff"/>`;
	} else if (kind === 'skull') mark = skullMarkup(x, y, 0.62 * k, '#e8e0c8', '#120a18', G);
	else if (kind === 'eye') mark = `<path d="M${f(x - 2.8 * k)} ${f(y)} Q${f(x)} ${f(y - 2.2 * k)} ${f(x + 2.8 * k)} ${f(y)} Q${f(x)} ${f(y + 2.2 * k)} ${f(x - 2.8 * k)} ${f(y)} Z" fill="${G}" stroke="#0a1206" stroke-width="${f(0.3 * k)}"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(0.45 * k)}" ry="${f(1.3 * k)}" fill="#0a1206"/>`;
	else if (kind === 'flame')
		mark = `<path d="M${f(x)} ${f(y - 3 * k)} C${f(x + 2.4 * k)} ${f(y - 1 * k)} ${f(x + 2.2 * k)} ${f(y + 2.4 * k)} ${f(x)} ${f(y + 2.4 * k)} C${f(x - 2.3 * k)} ${f(y + 2.4 * k)} ${f(x - 2.3 * k)} ${f(y - 0.2 * k)} ${f(x - 0.8 * k)} ${f(y - 1.3 * k)} C${f(x - 0.6 * k)} ${f(y - 0.2 * k)} ${f(x + 0.3 * k)} ${f(y - 0.5 * k)} ${f(x)} ${f(y - 3 * k)} Z" fill="${G}"/><path d="M${f(x)} ${f(y - 0.6 * k)} C${f(x + 1.2 * k)} ${f(y + 0.4 * k)} ${f(x + 1.1 * k)} ${f(y + 2 * k)} ${f(x)} ${f(y + 2 * k)} C${f(x - 1.1 * k)} ${f(y + 2 * k)} ${f(x - 1.1 * k)} ${f(y + 0.6 * k)} ${f(x)} ${f(y - 0.6 * k)} Z" fill="#fff2a0"/>`;
	else if (kind === 'claw') mark = line(`M${f(x - 2 * k)} ${f(y - 2.4 * k)} L${f(x - 0.8 * k)} ${f(y + 2.4 * k)} M${f(x)} ${f(y - 2.8 * k)} L${f(x + 0.4 * k)} ${f(y + 2.6 * k)} M${f(x + 2 * k)} ${f(y - 2.4 * k)} L${f(x + 1.6 * k)} ${f(y + 2.4 * k)}`, G, 0.7 * k);
	else mark = `<path d="M${f(x)} ${f(y - 2.6 * k)} L${f(x + 2.3 * k)} ${f(y + 1.6 * k)} L${f(x - 2.3 * k)} ${f(y + 1.6 * k)} Z" fill="none" stroke="${G}" stroke-width="${f(0.5 * k)}"/><circle cx="${f(x)}" cy="${f(y + 0.3 * k)}" r="${f(0.8 * k)}" fill="${G}"/>`;
	return `<defs>${defs}</defs>${glow}${mark}`;
}

/* ---------- round the neck ---------- */

const METAL: Record<NeckLook['metal'], [string, string, string]> = {
	gold: ['#fff4b0', '#e0a520', '#6b4306'],
	silver: ['#ffffff', '#b8c0c8', '#4a525a'],
	iced: ['#ffffff', '#dff4ff', '#7a8a9a'],
	black: ['#4a4a50', '#1a1a1e', '#000000'],
	red: ['#ff6a5a', '#c8102e', '#5a0610'],
	// Abscar's weathered bronze (his emblem's skin) and the Iridescent rank's pink → cyan → violet
	bronze: ['#f6d29a', '#b07a3c', '#4a2a0e'],
	iri: ['#ffb4ec', '#8af2ff', '#7a4ad8']
};

function cubicPts(p0: P, p1: P, p2: P, p3: P, n: number): P[] {
	return Array.from({ length: n + 1 }, (_, i) => {
		const s = i / n;
		const m = 1 - s;
		return [f(m * m * m * p0[0] + 3 * m * m * s * p1[0] + 3 * m * s * s * p2[0] + s * s * s * p3[0]), f(m * m * m * p0[1] + 3 * m * m * s * p1[1] + 3 * m * s * s * p2[1] + s * s * s * p3[1])] as P;
	});
}

export function neckMarkup(u: string, L: NeckLook, B: BodyAt): string {
	const v = `${u}-dn`;
	const k = B.hw / 30.5;
	const { cx: c, ty: t, drop } = B;
	const [hi, mid, lo] = METAL[L.metal];
	const g = `${v}-m`;
	const defs = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset="0.45" stop-color="${mid}"/><stop offset="1" stop-color="${lo}"/></linearGradient></defs>`;
	const L0: P = [c - 7.2 * k, t + 0.4];
	const L1: P = [c - 7.2 * k, t + drop * 0.72];
	const L2: P = [c - 3.4 * k, t + drop];
	const M: P = [c, t + drop];
	const chain = `M${f(L0[0])} ${f(L0[1])} C${f(L1[0])} ${f(L1[1])} ${f(L2[0])} ${f(L2[1])} ${f(c)} ${f(M[1])} C${f(c + 3.4 * k)} ${f(M[1])} ${f(c + 7.2 * k)} ${f(L1[1])} ${f(c + 7.2 * k)} ${f(L0[1])}`;
	const ptsN = (n: number) => [...cubicPts(L0, L1, L2, M, n), ...cubicPts(M, [c + 3.4 * k, M[1]], [c + 7.2 * k, L1[1]], [c + 7.2 * k, L0[1]], n).slice(1)];
	const pts = () => ptsN(7);
	/** the chain's direction at point i, in degrees */
	const tangent = (P: P[], i: number) => {
		const a = P[Math.max(0, i - 1)];
		const b = P[Math.min(P.length - 1, i + 1)];
		return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
	};
	const out: string[] = [defs];
	switch (L.kind) {
		case 'cuban':
		case 'iced':
			out.push(line(chain, lo, 2.3 * k), line(chain, `url(#${g})`, 1.6 * k), line(chain, lo, 1.6 * k, ` stroke-dasharray="${f(0.32 * k)} ${f(0.7 * k)}" stroke-linecap="butt" opacity="0.7"`), line(chain, '#ffffff', 0.4 * k, ` stroke-dasharray="${f(0.5 * k)} ${f(0.55 * k)}" opacity="0.6"`));
			if (L.kind === 'iced') out.push(...[2, 6, 10].map((i, j) => `<path class="dr-twinkle" style="animation-delay:-${j * 0.7}s" d="${star4(pts()[i][0], pts()[i][1], 1.3 * k)}" fill="#ffffff"/>`));
			break;
		case 'rope':
			out.push(line(chain, lo, 1.9 * k), line(chain, `url(#${g})`, 1.3 * k), line(chain, lo, 1.3 * k, ` stroke-dasharray="${f(0.22 * k)} ${f(0.42 * k)}" stroke-linecap="butt" opacity="0.6"`), line(chain, hi, 0.35 * k, ` stroke-dasharray="${f(0.3 * k)} ${f(0.35 * k)}"`));
			break;
		case 'tennis':
			out.push(line(chain, '#3a4048', 1 * k), ...pts().map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${f(0.62 * k)}" fill="#ffffff" stroke="#8aa0b4" stroke-width="${f(0.18 * k)}"/>`), `<path class="dr-twinkle" d="${star4(pts()[4][0], pts()[4][1], 1.2 * k)}" fill="#ffffff"/>`);
			break;
		case 'pearls':
			out.push(`<defs><radialGradient id="${v}-pe" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="0.6" stop-color="#ece4d8"/><stop offset="1" stop-color="#a89c8c"/></radialGradient></defs>`, ...pts().map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${f(0.82 * k)}" fill="url(#${v}-pe)" stroke="#7a7066" stroke-width="${f(0.15 * k)}"/>`));
			break;
		case 'tags': {
			out.push(...pts().map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${f(0.3 * k)}" fill="#c8ccd2"/>`));
			const tag = (dx: number, rot: number) =>
				`<g transform="translate(${f(c + dx * k)} ${f(t + drop + 2.4 * k)}) rotate(${rot})"><rect x="${f(-1.6 * k)}" y="${f(-2.2 * k)}" width="${f(3.2 * k)}" height="${f(4.6 * k)}" rx="${f(0.9 * k)}" fill="url(#${g})" stroke="${lo}" stroke-width="${f(0.25 * k)}"/><path d="M${f(-0.9 * k)} ${f(-0.6 * k)} h${f(1.8 * k)} M${f(-0.9 * k)} ${f(0.4 * k)} h${f(1.4 * k)} M${f(-0.9 * k)} ${f(1.4 * k)} h${f(1.6 * k)}" stroke="${lo}" stroke-width="${f(0.22 * k)}"/></g>`;
			out.push(tag(-0.8, -10), tag(0.9, 12));
			break;
		}
		case 'bandana': {
			const tri = `M${f(c - 9 * k)} ${f(t + 0.3)} L${f(c + 9 * k)} ${f(t + 0.3)} L${f(c)} ${f(t + 9.4 * k)} Z`;
			out.push(`<path d="${tri}" fill="url(#${g})" stroke="${O}" stroke-width="0.5" stroke-linejoin="round"/>`, line(`M${f(c - 7.4 * k)} ${f(t + 1.4 * k)} L${f(c)} ${f(t + 8 * k)} L${f(c + 7.4 * k)} ${f(t + 1.4 * k)}`, '#ffffff', 0.3 * k, ` stroke-dasharray="${f(0.4 * k)} ${f(0.5 * k)}"`), ...[[-3, 2.6], [2.4, 3], [0, 5.4], [-1.4, 3.8], [1.6, 1.6]].map(([dx, dy]) => `<circle cx="${f(c + dx * k)}" cy="${f(t + dy * k)}" r="${f(0.45 * k)}" fill="#ffffff"/>`));
			break;
		}
		case 'choker': {
			const arc = `M${f(c - 7 * k)} ${f(t + 0.2)} Q${f(c)} ${f(t + 3.6 * k)} ${f(c + 7 * k)} ${f(t + 0.2)}`;
			const spikes = cubicPts([c - 6 * k, t + 0.9], [c - 3 * k, t + 2.6 * k], [c + 3 * k, t + 2.6 * k], [c + 6 * k, t + 0.9], 6)
				.map(([x, y]) => `<path d="M${f(x - 0.55 * k)} ${f(y)} L${f(x)} ${f(y + 1.8 * k)} L${f(x + 0.55 * k)} ${f(y)} Z" fill="#d8dde2" stroke="#4a525a" stroke-width="${f(0.15 * k)}"/>`)
				.join('');
			out.push(spikes, line(arc, '#000', 2 * k), line(arc, '#2a2a30', 1.4 * k));
			break;
		}
		// ----- the Abscar drop (2026-11-23) -----
		case 'ammo': {
			// a leather strap with brass rounds standing out from it, tips outward
			out.push(line(chain, '#2a1608', 2 * k), line(chain, '#6a4220', 1.4 * k));
			const P = ptsN(6);
			out.push(
				...P.slice(1, -1).map(([x, y], i) => {
					const a = tangent(P, i + 1);
					return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a, 1)})"><rect x="${f(-0.55 * k)}" y="${f(-0.4 * k)}" width="${f(1.1 * k)}" height="${f(2.2 * k)}" rx="${f(0.15 * k)}" fill="url(#${g})" stroke="${lo}" stroke-width="${f(0.15 * k)}"/><path d="M${f(-0.55 * k)} ${f(1.8 * k)} Q${f(-0.55 * k)} ${f(3.2 * k)} 0 ${f(3.5 * k)} Q${f(0.55 * k)} ${f(3.2 * k)} ${f(0.55 * k)} ${f(1.8 * k)} Z" fill="#c87a3a" stroke="#5a2a0a" stroke-width="${f(0.15 * k)}"/></g>`;
				})
			);
			break;
		}
		case 'beads': {
			const cols = ['#e8241a', '#ffd21a', '#2fb84a'];
			out.push(line(chain, '#3a2a1a', 0.4 * k), ...ptsN(11).map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${f(0.72 * k)}" fill="${cols[i % 3]}" stroke="#1a1208" stroke-width="${f(0.15 * k)}"/><circle cx="${f(x - 0.25 * k)}" cy="${f(y - 0.25 * k)}" r="${f(0.22 * k)}" fill="#fff" opacity="0.55"/>`));
			break;
		}
		case 'kushlei': {
			// a lei of weed leaves, alternating greens, each turned along the string
			const greens = ['#2f8a3e', '#5ac84a', '#1c6a2a', '#8ae05a'];
			const P = ptsN(8);
			out.push(
				line(chain, '#1c6a2a', 0.5 * k),
				...P.map(([x, y], i) => {
					const a = tangent(P, i) + (i % 2 ? 150 : 210);
					return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a, 1)}) scale(${f(0.2 * k, 3)}) translate(-12 -20)">${LEAF_PATHS.map((d) => `<path d="${d}" fill="${greens[i % 4]}" stroke="#0f3a14" stroke-width="1.4"/>`).join('')}</g>`;
				}),
				...[2, 5, 8, 11, 14].map((i) => `<circle cx="${P[i][0]}" cy="${P[i][1]}" r="${f(0.65 * k)}" fill="#ff7ad8" stroke="#a83a8a" stroke-width="${f(0.15 * k)}"/>`)
			);
			break;
		}
		case 'burgerlei': {
			const P = ptsN(6);
			out.push(line(chain, '#ffd21a', 0.5 * k), ...P.map(([x, y]) => miniBurger(x, y, 0.62 * k)));
			break;
		}
		case 'cable': {
			// a thick neural cable plugged in at both ends, pulsing red, with chrome junctions and LEDs
			out.push(line(chain, '#000', 2.6 * k), line(chain, '#1e1e24', 2 * k), `<path class="dr-glow" d="${chain}" fill="none" stroke="#ff2a1a" stroke-width="${f(0.5 * k)}" stroke-dasharray="${f(1.2 * k)} ${f(0.8 * k)}" stroke-linecap="round"/>`);
			const P = ptsN(4);
			out.push(...[1, 3, 5, 7].map((i, j) => `<rect x="${f(P[i][0] - 1 * k)}" y="${f(P[i][1] - 0.9 * k)}" width="${f(2 * k)}" height="${f(1.8 * k)}" rx="${f(0.4 * k)}" fill="#9aa4ae" stroke="#2a3038" stroke-width="${f(0.2 * k)}"/><circle class="dr-glow" style="animation-delay:-${j * 0.6}s" cx="${P[i][0]}" cy="${P[i][1]}" r="${f(0.45 * k)}" fill="#ff2a1a"/>`));
			out.push(`<path d="M${f(c - 2.4 * k)} ${f(t + drop - 0.6 * k)} h${f(4.8 * k)} v${f(3.4 * k)} h${f(-4.8 * k)} Z" fill="#2a3038" stroke="#000" stroke-width="${f(0.25 * k)}"/><path d="M${f(c - 1.4 * k)} ${f(t + drop + 2.8 * k)} v${f(1.2 * k)} M${f(c)} ${f(t + drop + 2.8 * k)} v${f(1.2 * k)} M${f(c + 1.4 * k)} ${f(t + drop + 2.8 * k)} v${f(1.2 * k)}" stroke="#e0a520" stroke-width="${f(0.4 * k)}"/><rect class="dr-glow" x="${f(c - 1.6 * k)}" y="${f(t + drop + 0.1 * k)}" width="${f(3.2 * k)}" height="${f(0.7 * k)}" fill="#ff2a1a"/>`);
			break;
		}
		case 'rgb': {
			// a gamer's LED chain: rainbow links that cycle through every colour (.dr-rgb)
			const id = `${v}-rgb`;
			out.push(
				`<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(c - 7.2 * k)}" y1="0" x2="${f(c + 7.2 * k)}" y2="0">${['#ff2a2a', '#ffb01a', '#f4ff2a', '#2aff6a', '#2ac8ff', '#9a3aff', '#ff2ad8'].map((col, i) => `<stop offset="${f(i / 6)}" stop-color="${col}"/>`).join('')}</linearGradient></defs>`,
				`<g class="dr-rgb">${line(chain, '#0c0c10', 2.3 * k)}${line(chain, `url(#${id})`, 1.5 * k)}<path d="${chain}" fill="none" stroke="#0c0c10" stroke-width="${f(1.5 * k)}" stroke-dasharray="${f(0.12 * k)} ${f(0.9 * k)}" opacity="0.8"/>${pts()
					.filter((_, i) => i % 3 === 1)
					.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${f(0.5 * k)}" fill="#fff" opacity="0.85"/>`)
					.join('')}</g>`
			);
			break;
		}
		case 'double': {
			// a cuban on top and a long rope under it, the stacked flex
			const d2 = drop * 1.45;
			const chain2 = `M${f(c - 7.6 * k)} ${f(t + 0.6)} C${f(c - 7.6 * k)} ${f(t + d2 * 0.72)} ${f(c - 3.6 * k)} ${f(t + d2)} ${f(c)} ${f(t + d2)} C${f(c + 3.6 * k)} ${f(t + d2)} ${f(c + 7.6 * k)} ${f(t + d2 * 0.72)} ${f(c + 7.6 * k)} ${f(t + 0.6)}`;
			out.push(line(chain2, lo, 1.9 * k), line(chain2, `url(#${g})`, 1.3 * k), line(chain2, lo, 1.3 * k, ` stroke-dasharray="${f(0.22 * k)} ${f(0.42 * k)}" stroke-linecap="butt" opacity="0.6"`), line(chain2, hi, 0.35 * k, ` stroke-dasharray="${f(0.3 * k)} ${f(0.35 * k)}"`));
			out.push(line(chain, lo, 2.5 * k), line(chain, `url(#${g})`, 1.8 * k), line(chain, lo, 1.8 * k, ` stroke-dasharray="${f(0.32 * k)} ${f(0.7 * k)}" stroke-linecap="butt" opacity="0.7"`), line(chain, '#ffffff', 0.4 * k, ` stroke-dasharray="${f(0.5 * k)} ${f(0.55 * k)}" opacity="0.6"`));
			out.push(`<path class="dr-twinkle" d="${star4(c + 3 * k, t + d2 - 0.4 * k, 1.1 * k)}" fill="#fffbe6"/>`, `<path class="dr-twinkle" style="animation-delay:-1.2s" d="${star4(c - 4 * k, t + drop * 0.8, 1 * k)}" fill="#fffbe6"/>`);
			break;
		}
		case 'skulls': {
			const P = ptsN(6);
			out.push(line(chain, lo, 1 * k), line(chain, `url(#${g})`, 0.6 * k), ...P.slice(1, -1).map(([x, y]) => skullMarkup(x, y + 0.4 * k, 0.36 * k, `url(#${g})`, lo)));
			break;
		}
		case 'fire': {
			// a blackened iron chain with flames licking up off every other link
			out.push(line(chain, '#000', 2.2 * k), line(chain, '#3a3436', 1.5 * k), line(chain, '#000', 1.5 * k, ` stroke-dasharray="${f(0.3 * k)} ${f(0.6 * k)}" stroke-linecap="butt" opacity="0.8"`));
			const P = ptsN(6);
			out.push(
				...P.slice(1, -1).map(([x, y], i) => {
					const h = (i % 2 ? 2.6 : 3.6) * k;
					return `<g class="dr-flicker" style="animation-delay:-${f(i * 0.23, 2)}s"><path d="M${f(x - 1.1 * k)} ${f(y)} C${f(x - 1.4 * k)} ${f(y - h * 0.5)} ${f(x - 0.2 * k)} ${f(y - h * 0.6)} ${f(x)} ${f(y - h)} C${f(x + 0.3 * k)} ${f(y - h * 0.6)} ${f(x + 1.4 * k)} ${f(y - h * 0.5)} ${f(x + 1.1 * k)} ${f(y)} Z" fill="#ff5a1a" opacity="0.9"/><path d="M${f(x - 0.5 * k)} ${f(y)} C${f(x - 0.6 * k)} ${f(y - h * 0.3)} ${f(x)} ${f(y - h * 0.4)} ${f(x)} ${f(y - h * 0.6)} C${f(x + 0.1 * k)} ${f(y - h * 0.4)} ${f(x + 0.6 * k)} ${f(y - h * 0.3)} ${f(x + 0.5 * k)} ${f(y)} Z" fill="#ffe23a"/></g>`;
				}),
				...[2, 6, 10].map((i) => `<circle class="dr-glow" cx="${pts()[i][0]}" cy="${pts()[i][1]}" r="${f(0.5 * k)}" fill="#ff8a1a"/>`)
			);
			break;
		}
		case 'headset': {
			// a gaming headset hung round the neck: the band behind, a cup on each collarbone, the mic sticking out
			const cup = (s: number) => {
				const x = c + s * 6.6 * k;
				const y = t + 2.6 * k;
				return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(2.6 * k)}" ry="${f(3 * k)}" fill="#1a1a1e" stroke="#000" stroke-width="${f(0.35 * k)}"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1.7 * k)}" ry="${f(2.1 * k)}" fill="#2c2c32"/><ellipse class="dr-glow" cx="${f(x)}" cy="${f(y)}" rx="${f(2.1 * k)}" ry="${f(2.5 * k)}" fill="none" stroke="#ff2a1a" stroke-width="${f(0.35 * k)}"/><text x="${f(x)}" y="${f(y + 0.1 * k)}" text-anchor="middle" dominant-baseline="central" ${FONT} font-size="${f(1.6 * k)}" fill="#ff2a1a">A</text>`;
			};
			out.push(
				line(`M${f(c - 7.4 * k)} ${f(t + 1.4 * k)} Q${f(c - 6 * k)} ${f(t - 1.6 * k)} ${f(c - 3.6 * k)} ${f(t - 0.2)}`, '#26262c', 1.2 * k),
				line(`M${f(c + 7.4 * k)} ${f(t + 1.4 * k)} Q${f(c + 6 * k)} ${f(t - 1.6 * k)} ${f(c + 3.6 * k)} ${f(t - 0.2)}`, '#26262c', 1.2 * k),
				line(`M${f(c - 6.6 * k)} ${f(t + 5.2 * k)} Q${f(c - 5 * k)} ${f(t + 8.4 * k)} ${f(c - 1.6 * k)} ${f(t + 7.8 * k)}`, '#1a1a1e', 0.7 * k),
				`<rect x="${f(c - 2.2 * k)}" y="${f(t + 7.1 * k)}" width="${f(1.6 * k)}" height="${f(1.3 * k)}" rx="${f(0.5 * k)}" fill="#3a3a40"/>`,
				cup(-1),
				cup(1)
			);
			break;
		}
	}
	if (L.pendant) out.push(pendantMarkup(v, L.pendant, c, t + drop + 0.4, k, g, lo));
	return `<g class="dr-neck">${out.join('')}</g>`;
}

function pendantMarkup(v: string, p: Pendant, x: number, y: number, k: number, g: string, lo: string): string {
	const bail = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.6 * k)}" fill="none" stroke="url(#${g})" stroke-width="${f(0.45 * k)}"/>`;
	const cy = y + 3 * k;
	switch (p) {
		case 'burger':
			return bail + burgerMarkup(`${v}-p`, x, cy, 0.62 * k);
		case 'holk':
			return `${bail}<path d="M${f(x - 0.6 * k)} ${f(y + 0.6 * k)} L${f(x + 0.6 * k)} ${f(y + 0.6 * k)} L${f(x + 1.7 * k)} ${f(y + 5.8 * k)} L${f(x - 1.7 * k)} ${f(y + 5.8 * k)} Z" fill="url(#${g})" stroke="${lo}" stroke-width="${f(0.25 * k)}" stroke-linejoin="round"/><ellipse cx="${f(x)}" cy="${f(y + 5.8 * k)}" rx="${f(1.7 * k)}" ry="${f(0.55 * k)}" fill="#ff8a1a"/><path class="dr-twinkle" d="${star4(x + 1.2 * k, y + 3 * k, 1 * k)}" fill="#fffbe6"/>`;
		case 'leaf':
			return `${bail}<g transform="translate(${f(x)} ${f(y + 5.4 * k)}) scale(${f(0.24 * k, 3)}) translate(-12 -20)">${LEAF_PATHS.map((d) => `<path d="${d}" fill="#f4fbff" stroke="#8aa0b4" stroke-width="1"/>`).join('')}<path d="${LEAF_STEM}" stroke="#8aa0b4" stroke-width="1.4"/></g><path class="dr-twinkle" d="${star4(x + 1.6 * k, y + 1.8 * k, 1.1 * k)}" fill="#ffffff"/>`;
		case 'ab':
			return `${bail}<text x="${f(x)}" y="${f(cy)}" text-anchor="middle" dominant-baseline="central" ${FONT} font-size="${f(4.4 * k)}" fill="#f4fbff" stroke="#7a8a9a" stroke-width="${f(0.35 * k)}" paint-order="stroke">AB</text><path class="dr-twinkle" d="${star4(x - 1.8 * k, cy - 1.4 * k, 1.1 * k)}" fill="#ffffff"/><path class="dr-twinkle" style="animation-delay:-1s" d="${star4(x + 2 * k, cy + 0.8 * k, 0.9 * k)}" fill="#ffffff"/>`;
		case 'skull':
			return bail + skullMarkup(x, cy, 0.7 * k, '#e8ecf0', '#3a4048');
		case 'dollar':
			return `${bail}<text x="${f(x)}" y="${f(cy + 0.2 * k)}" text-anchor="middle" dominant-baseline="central" ${FONT} font-size="${f(5.6 * k)}" fill="url(#${g})" stroke="${lo}" stroke-width="${f(0.35 * k)}" paint-order="stroke">$</text>`;
		case 'crown':
			return `${bail}<path d="M${f(x - 2.8 * k)} ${f(cy + 1.6 * k)} L${f(x - 3 * k)} ${f(cy - 1.8 * k)} L${f(x - 1.4 * k)} ${f(cy - 0.2 * k)} L${f(x)} ${f(cy - 2.4 * k)} L${f(x + 1.4 * k)} ${f(cy - 0.2 * k)} L${f(x + 3 * k)} ${f(cy - 1.8 * k)} L${f(x + 2.8 * k)} ${f(cy + 1.6 * k)} Z" fill="url(#${g})" stroke="${lo}" stroke-width="${f(0.3 * k)}" stroke-linejoin="round"/><circle cx="${f(x)}" cy="${f(cy + 0.6 * k)}" r="${f(0.55 * k)}" fill="#d8192a"/><circle cx="${f(x - 1.6 * k)}" cy="${f(cy + 0.8 * k)}" r="${f(0.4 * k)}" fill="#2a8aff"/><circle cx="${f(x + 1.6 * k)}" cy="${f(cy + 0.8 * k)}" r="${f(0.4 * k)}" fill="#2fd36a"/><path class="dr-twinkle" d="${star4(x + 2.6 * k, cy - 2.4 * k, 1 * k)}" fill="#fffbe6"/>`;
		// ----- the Abscar drop (2026-11-23) -----
		case 'cyborg':
			// Abscar's cyborg skull in his bronze: red eyes that glow, a white holk in the grin, smoke rising
			return `${bail}<defs><radialGradient id="${v}-ce"><stop offset="0" stop-color="#ff2a1a" stop-opacity="0.95"/><stop offset="1" stop-color="#ff2a1a" stop-opacity="0"/></radialGradient></defs>${skullMarkup(x, cy + 0.6 * k, 1.1 * k, `url(#${g})`, lo, '#ff2a1a')}${[-1, 1].map((s) => `<circle class="dr-glow" cx="${f(x + s * 1.43 * k)}" cy="${f(cy - 0.06 * k)}" r="${f(1.9 * k)}" fill="url(#${v}-ce)"/>`).join('')}${line(`M${f(x + 1 * k)} ${f(cy + 3 * k)} L${f(x + 4.4 * k)} ${f(cy + 3.6 * k)}`, '#2a1608', 1 * k)}${line(`M${f(x + 1 * k)} ${f(cy + 3 * k)} L${f(x + 4.4 * k)} ${f(cy + 3.6 * k)}`, '#f3efe4', 0.65 * k)}<circle class="dr-glow" cx="${f(x + 4.5 * k)}" cy="${f(cy + 3.6 * k)}" r="${f(0.45 * k)}" fill="#ff8a1a"/>${[0, 1, 2].map((i) => `<circle class="dr-spark" style="animation-delay:-${f(i * 0.7, 1)}s" cx="${f(x + (4.8 + i * 0.4) * k)}" cy="${f(cy + (2.4 - i * 0.6) * k)}" r="${f((0.5 + i * 0.15) * k)}" fill="#e8e8ea" opacity="0.7"/>`).join('')}<path class="dr-twinkle" d="${star4(x - 2.6 * k, cy - 2 * k, 1 * k)}" fill="#fffbe6"/>`;
		case 'iri': {
			// the Iridescent rank: a bevelled hexagon in shifting purple-cyan with a cyan bolt and a gold rim
			const hex = (r: number) =>
				Array.from({ length: 6 }, (_, i) => {
					const a = (i * Math.PI) / 3 - Math.PI / 2;
					return `${f(x + Math.cos(a) * r)},${f(cy + 0.4 * k + Math.sin(a) * r)}`;
				}).join(' ');
			return `${bail}<defs>${lin(`${v}-ih`, [[0, '#ff7ad8'], [0.5, '#7a4ad8'], [1, '#7af0ff']], 1, 1)}</defs><polygon points="${hex(3.6 * k)}" fill="#e0a520" stroke="#6b4306" stroke-width="${f(0.25 * k)}"/><polygon points="${hex(2.9 * k)}" fill="url(#${v}-ih)"/><path d="M${f(x + 0.6 * k)} ${f(cy - 2 * k)} L${f(x - 1.3 * k)} ${f(cy + 0.7 * k)} L${f(x - 0.1 * k)} ${f(cy + 0.7 * k)} L${f(x - 0.6 * k)} ${f(cy + 2.8 * k)} L${f(x + 1.4 * k)} ${f(cy)} L${f(x + 0.2 * k)} ${f(cy)} Z" fill="#c8faff" stroke="#1a6a8a" stroke-width="${f(0.15 * k)}"/><path class="dr-twinkle" d="${star4(x + 2.4 * k, cy - 2 * k, 1.1 * k)}" fill="#ffffff"/><path class="dr-twinkle" style="animation-delay:-1.2s" d="${star4(x - 2.4 * k, cy + 2 * k, 0.9 * k)}" fill="#ffffff"/>`;
		}
		case 'nuke':
			return `${bail}<defs><radialGradient id="${v}-ng"><stop offset="0" stop-color="#7dff3a" stop-opacity="0.8"/><stop offset="1" stop-color="#7dff3a" stop-opacity="0"/></radialGradient></defs><circle class="dr-glow" cx="${f(x)}" cy="${f(cy + 0.4 * k)}" r="${f(5.2 * k)}" fill="url(#${v}-ng)"/><circle cx="${f(x)}" cy="${f(cy + 0.4 * k)}" r="${f(3.2 * k)}" fill="#ffd21a" stroke="url(#${g})" stroke-width="${f(0.6 * k)}"/>${trefoil(x, cy + 0.4 * k, 2.7 * k, '#1a1a1a')}`;
		case 'divergence': {
			// a brilliant-cut diamond in Divergence's chrome rainbow
			const top = cy - 1.8 * k;
			const mid = cy - 0.2 * k;
			const bot = cy + 4 * k;
			const w = 3.4 * k;
			return `${bail}<defs>${lin(`${v}-dv`, [[0, '#ff6a8a'], [0.25, '#ffe27a'], [0.5, '#7aff9a'], [0.75, '#7ad8ff'], [1, '#c08aff']], 1, 0.6)}</defs><path d="M${f(x - w * 0.55)} ${f(top)} H${f(x + w * 0.55)} L${f(x + w)} ${f(mid)} L${f(x)} ${f(bot)} L${f(x - w)} ${f(mid)} Z" fill="url(#${v}-dv)" stroke="#5a6a7a" stroke-width="${f(0.25 * k)}" stroke-linejoin="round"/><path d="M${f(x - w)} ${f(mid)} H${f(x + w)} M${f(x - w * 0.55)} ${f(top)} L${f(x - w * 0.2)} ${f(mid)} L${f(x)} ${f(bot)} L${f(x + w * 0.2)} ${f(mid)} L${f(x + w * 0.55)} ${f(top)} M${f(x - w * 0.2)} ${f(mid)} L${f(x)} ${f(top)} L${f(x + w * 0.2)} ${f(mid)}" fill="none" stroke="#ffffff" stroke-width="${f(0.18 * k)}" opacity="0.75"/><path class="dr-twinkle" d="${star4(x - 1.6 * k, top + 0.4 * k, 1.3 * k)}" fill="#ffffff"/><path class="dr-twinkle" style="animation-delay:-0.8s" d="${star4(x + 2.2 * k, mid + 0.8 * k, 1 * k)}" fill="#ffffff"/><path class="dr-twinkle" style="animation-delay:-1.6s" d="${star4(x + 0.4 * k, bot - 1 * k, 0.8 * k)}" fill="#ffffff"/>`;
		}
		case 'slacker':
			return `${bail}<g transform="rotate(-9 ${f(x)} ${f(cy)})"><rect x="${f(x - 4.2 * k)}" y="${f(cy - 1.1 * k)}" width="${f(8.4 * k)}" height="${f(2.8 * k)}" rx="${f(0.5 * k)}" fill="#d8192a" stroke="#ffffff" stroke-width="${f(0.35 * k)}"/><text x="${f(x)}" y="${f(cy + 0.32 * k)}" text-anchor="middle" dominant-baseline="central" ${FONT} font-size="${f(1.7 * k)}" textLength="${f(7 * k)}" lengthAdjust="spacingAndGlyphs" fill="#ffffff">SLACKER</text></g>`;
		case 'banned':
			return `${bail}<g transform="rotate(-12 ${f(x)} ${f(cy)})"><rect x="${f(x - 4.4 * k)}" y="${f(cy - 1.3 * k)}" width="${f(8.8 * k)}" height="${f(3.2 * k)}" rx="${f(0.3 * k)}" fill="#1a0a0a" stroke="#ff2a2a" stroke-width="${f(0.5 * k)}"/><text x="${f(x)}" y="${f(cy + 0.32 * k)}" text-anchor="middle" dominant-baseline="central" ${FONT} font-size="${f(2 * k)}" textLength="${f(7.2 * k)}" lengthAdjust="spacingAndGlyphs" fill="#ff2a2a">BANNED</text></g>`;
		case 'controller': {
			// an iced-out game pad: a flat body with two grips, the face buttons in colour, a d-pad, sticks
			const yy = cy + 0.6 * k;
			return `${bail}<path d="M${f(x - 3.6 * k)} ${f(yy - 1.6 * k)} H${f(x + 3.6 * k)} Q${f(x + 5 * k)} ${f(yy - 1.6 * k)} ${f(x + 5.2 * k)} ${f(yy + 1 * k)} Q${f(x + 5.4 * k)} ${f(yy + 3 * k)} ${f(x + 4 * k)} ${f(yy + 3 * k)} Q${f(x + 3 * k)} ${f(yy + 3 * k)} ${f(x + 2.4 * k)} ${f(yy + 1.4 * k)} H${f(x - 2.4 * k)} Q${f(x - 3 * k)} ${f(yy + 3 * k)} ${f(x - 4 * k)} ${f(yy + 3 * k)} Q${f(x - 5.4 * k)} ${f(yy + 3 * k)} ${f(x - 5.2 * k)} ${f(yy + 1 * k)} Q${f(x - 5 * k)} ${f(yy - 1.6 * k)} ${f(x - 3.6 * k)} ${f(yy - 1.6 * k)} Z" fill="url(#${g})" stroke="#7a8a9a" stroke-width="${f(0.25 * k)}"/><path d="M${f(x - 3.6 * k)} ${f(yy - 0.3 * k)} h${f(1.6 * k)} M${f(x - 2.8 * k)} ${f(yy - 1.1 * k)} v${f(1.6 * k)}" stroke="#4a525a" stroke-width="${f(0.5 * k)}"/>${[
				[3, -1, '#2fd36a'],
				[3.9, -0.2, '#d8192a'],
				[3, 0.6, '#2a8aff'],
				[2.1, -0.2, '#ff7ad8']
			]
				.map(([dx, dy, col]) => `<circle cx="${f(x + (dx as number) * k)}" cy="${f(yy + (dy as number) * k)}" r="${f(0.4 * k)}" fill="${col}"/>`)
				.join('')}<circle cx="${f(x - 1 * k)}" cy="${f(yy + 0.8 * k)}" r="${f(0.6 * k)}" fill="#4a525a"/><circle cx="${f(x + 1 * k)}" cy="${f(yy + 0.8 * k)}" r="${f(0.6 * k)}" fill="#4a525a"/><path class="dr-twinkle" d="${star4(x - 3.8 * k, yy - 1.8 * k, 1.1 * k)}" fill="#ffffff"/><path class="dr-twinkle" style="animation-delay:-1.1s" d="${star4(x + 4.4 * k, yy + 2.4 * k, 0.9 * k)}" fill="#ffffff"/>`;
		}
		case 'fries':
			return `${bail}${[-1.8, -0.9, 0, 0.9, 1.8, -1.3, 1.3]
				.map((dx, i) => `<rect x="${f(x + dx * k - 0.35 * k)}" y="${f(cy - (2.4 + (i % 3) * 0.6) * k)}" width="${f(0.7 * k)}" height="${f(3.4 * k)}" fill="#ffd23a" stroke="#b07a10" stroke-width="${f(0.12 * k)}" transform="rotate(${(dx * 6).toFixed(1)} ${f(x + dx * k)} ${f(cy)})"/>`)
				.join('')}<path d="M${f(x - 2.8 * k)} ${f(cy - 0.4 * k)} H${f(x + 2.8 * k)} L${f(x + 2.1 * k)} ${f(cy + 3.6 * k)} H${f(x - 2.1 * k)} Z" fill="#d8192a" stroke="#5a0610" stroke-width="${f(0.25 * k)}" stroke-linejoin="round"/><path d="M${f(x - 1.6 * k)} ${f(cy + 1.4 * k)} Q${f(x)} ${f(cy + 2.6 * k)} ${f(x + 1.6 * k)} ${f(cy + 1.4 * k)}" fill="none" stroke="#ffd23a" stroke-width="${f(0.45 * k)}" stroke-linecap="round"/>`;
		case 'ketchup':
			return `${bail}<rect x="${f(x - 0.7 * k)}" y="${f(y + 0.6 * k)}" width="${f(1.4 * k)}" height="${f(1.4 * k)}" fill="#f4f1e8" stroke="#6a6a6a" stroke-width="${f(0.15 * k)}"/><path d="M${f(x - 0.9 * k)} ${f(y + 2 * k)} H${f(x + 0.9 * k)} Q${f(x + 2.2 * k)} ${f(y + 2.6 * k)} ${f(x + 2.2 * k)} ${f(y + 4.4 * k)} V${f(y + 7.4 * k)} Q${f(x + 2.2 * k)} ${f(y + 8 * k)} ${f(x + 1.6 * k)} ${f(y + 8 * k)} H${f(x - 1.6 * k)} Q${f(x - 2.2 * k)} ${f(y + 8 * k)} ${f(x - 2.2 * k)} ${f(y + 7.4 * k)} V${f(y + 4.4 * k)} Q${f(x - 2.2 * k)} ${f(y + 2.6 * k)} ${f(x - 0.9 * k)} ${f(y + 2 * k)} Z" fill="#d8192a" stroke="#5a0610" stroke-width="${f(0.22 * k)}"/><rect x="${f(x - 1.6 * k)}" y="${f(y + 4.6 * k)}" width="${f(3.2 * k)}" height="${f(1.8 * k)}" rx="${f(0.3 * k)}" fill="#f4f1e8"/><circle cx="${f(x)}" cy="${f(y + 5.6 * k)}" r="${f(0.65 * k)}" fill="#e8241a"/><path d="M${f(x - 0.5 * k)} ${f(y + 5 * k)} L${f(x)} ${f(y + 5.2 * k)} L${f(x + 0.5 * k)} ${f(y + 5 * k)}" fill="none" stroke="#2fb84a" stroke-width="${f(0.25 * k)}" stroke-linecap="round"/><path d="M${f(x - 1.3 * k)} ${f(y + 2.8 * k)} v${f(1.4 * k)}" stroke="#ffffff" stroke-width="${f(0.35 * k)}" stroke-linecap="round" opacity="0.6"/>`;
		case 'seven':
			return `${bail}<rect x="${f(x - 4 * k)}" y="${f(cy - 1.8 * k)}" width="${f(8 * k)}" height="${f(3.8 * k)}" rx="${f(0.8 * k)}" fill="url(#${g})" stroke="${lo}" stroke-width="${f(0.3 * k)}"/><rect x="${f(x - 3.3 * k)}" y="${f(cy - 1.2 * k)}" width="${f(6.6 * k)}" height="${f(2.6 * k)}" rx="${f(0.3 * k)}" fill="#fff8e6"/><text x="${f(x)}" y="${f(cy + 0.15 * k)}" text-anchor="middle" dominant-baseline="central" ${FONT} font-size="${f(2.4 * k)}" textLength="${f(5.8 * k)}" lengthAdjust="spacingAndGlyphs" fill="#d8192a" stroke="#5a0610" stroke-width="${f(0.12 * k)}">777</text><path class="dr-twinkle" d="${star4(x + 3.8 * k, cy - 1.8 * k, 1.1 * k)}" fill="#fffbe6"/>`;
		case 'grinder': {
			// a herb grinder from above: knurled rim, a leaf on the lid
			const yy = cy + 0.4 * k;
			return `${bail}<circle cx="${f(x)}" cy="${f(yy)}" r="${f(3 * k)}" fill="url(#${g})" stroke="${lo}" stroke-width="${f(0.25 * k)}"/><circle cx="${f(x)}" cy="${f(yy)}" r="${f(2.75 * k)}" fill="none" stroke="${lo}" stroke-width="${f(0.4 * k)}" stroke-dasharray="${f(0.25 * k)} ${f(0.35 * k)}"/><circle cx="${f(x)}" cy="${f(yy)}" r="${f(2.1 * k)}" fill="#4a525a"/><g transform="translate(${f(x)} ${f(yy + 1.5 * k)}) scale(${f(0.14 * k, 3)}) translate(-12 -20)">${LEAF_PATHS.map((d) => `<path d="${d}" fill="#7dff3a"/>`).join('')}</g>`;
		}
		case 'eye':
			// a single red cyborg eye in a black chrome socket, glowing
			return `${bail}<defs><radialGradient id="${v}-ey"><stop offset="0" stop-color="#ffffff"/><stop offset="0.25" stop-color="#ff5a3a"/><stop offset="0.7" stop-color="#c80a0a"/><stop offset="1" stop-color="#3a0000"/></radialGradient><radialGradient id="${v}-eg"><stop offset="0" stop-color="#ff2a1a" stop-opacity="0.85"/><stop offset="1" stop-color="#ff2a1a" stop-opacity="0"/></radialGradient></defs><circle class="dr-glow" cx="${f(x)}" cy="${f(cy + 0.4 * k)}" r="${f(5 * k)}" fill="url(#${v}-eg)"/><circle cx="${f(x)}" cy="${f(cy + 0.4 * k)}" r="${f(3 * k)}" fill="url(#${g})" stroke="#000" stroke-width="${f(0.3 * k)}"/><circle cx="${f(x)}" cy="${f(cy + 0.4 * k)}" r="${f(2 * k)}" fill="url(#${v}-ey)"/><circle cx="${f(x - 0.6 * k)}" cy="${f(cy - 0.3 * k)}" r="${f(0.4 * k)}" fill="#fff" opacity="0.9"/>`;
		case 'gg':
			return `${bail}<text x="${f(x)}" y="${f(cy)}" text-anchor="middle" dominant-baseline="central" ${FONT} font-size="${f(4.6 * k)}" fill="#f4fbff" stroke="#7a8a9a" stroke-width="${f(0.35 * k)}" paint-order="stroke">GG</text><path class="dr-twinkle" d="${star4(x - 2 * k, cy - 1.4 * k, 1.1 * k)}" fill="#ffffff"/><path class="dr-twinkle" style="animation-delay:-1s" d="${star4(x + 2.2 * k, cy + 0.9 * k, 0.9 * k)}" fill="#ffffff"/>`;
	}
	return '';
}

/* ---------- kicks ---------- */

/** One sneaker from the side in its own box: heel at x 0, toe at x ≈ 12.6, sole bottom at y ≈ 5. */
export function shoeMarkup(v: string, L: KickLook): string {
	const bb: Box = { x: -1, y: -7, w: 15, h: 13 };
	const up = paint(`${v}-u`, L.upper, bb);
	const A = L.accent;
	const S = L.sole;
	const lace = (x0: number, y0: number, x1: number, y1: number, n: number) =>
		Array.from({ length: n }, (_, i) => {
			const x = x0 + ((x1 - x0) * (i + 0.5)) / n;
			const y = y0 + ((y1 - y0) * (i + 0.5)) / n;
			return `M${f(x - 0.55)} ${f(y - 0.35)} L${f(x + 0.55)} ${f(y + 0.35)} M${f(x - 0.55)} ${f(y + 0.35)} L${f(x + 0.55)} ${f(y - 0.35)}`;
		}).join(' ');
	const sole = (top: number, bot: number, wavy = false) =>
		`<path d="M-0.2 ${top} L12.8 ${top} Q13.3 ${f(top + 0.2)} 13.1 ${f((top + bot) / 2)} Q12.9 ${bot} 12 ${bot} L0.6 ${bot} Q-0.4 ${bot} -0.4 ${f((top + bot) / 2)} Z" fill="${S}" stroke="${O}" stroke-width="0.4" stroke-linejoin="round"/>${wavy ? line(`M0 ${f(top + 1.2)} Q2 ${f(top + 0.4)} 4 ${f(top + 1.2)} T8 ${f(top + 1.2)} T12.4 ${f(top + 1.1)}`, 'rgba(0,0,0,.3)', 0.4) : ''}${line(`M0.2 ${f(bot - 0.5)} L12.6 ${f(bot - 0.5)}`, 'rgba(0,0,0,.35)', 0.35)}`;
	switch (L.kind) {
		case 'high': {
			const U = 'M0.7 3.4 L0.2 -3.6 Q0.3 -4.6 1.6 -4.6 L4.3 -4.4 Q4.8 -1.4 6.4 0.4 L10.4 1.4 Q12.6 2 12.6 3.4 Z';
			return `${filled(U, up, `${v}-uc`)}<path d="M0.4 -1 Q2.4 -0.4 4.7 -1.8 L4.4 -4.4 L1.6 -4.6 Q0.3 -4.6 0.2 -3.6 Z" fill="${A}"/><path d="M9.6 1.2 Q12.6 1.8 12.6 3.4 L9 3.4 Q8.6 2.2 9.6 1.2 Z" fill="${A}"/><path d="M0.6 3.4 L0.5 0.6 Q1.8 0.4 3 1 L3.6 3.4 Z" fill="${A}"/><path d="M3.8 2.6 L5.4 0.9 L5.8 1.8 L8.4 0.8 L7.4 2.2 L7 1.7 L4.8 2.9 Z" fill="${A === L.upper ? O : A}" opacity="0.95"/>${line(lace(4.4, -3.6, 7.6, 0.8, 4), '#ffffff', 0.32)}${line(U, O, 0.45)}${sole(3.3, 5.2)}`;
		}
		case 'low': {
			const U = 'M0.6 3.4 L0.4 0.2 Q0.5 -1 1.9 -1 L4.6 -0.9 Q5.6 0.6 7.2 1 L10.4 1.6 Q12.6 2.1 12.6 3.4 Z';
			return `${filled(U, up, `${v}-uc`)}<path d="M0.5 3.4 L0.4 0.2 Q0.5 -1 1.9 -1 L2.6 -0.9 L3.2 3.4 Z" fill="${A}"/><path d="M9.6 1.5 Q12.6 2 12.6 3.4 L9 3.4 Q8.6 2.4 9.6 1.5 Z" fill="${A}"/><path d="M3.6 2.8 L5.4 1.4 L5.8 2.2 L8.2 1.2 L7.2 2.5 L6.8 2 L4.6 3.1 Z" fill="${A === L.upper ? O : A}" opacity="0.95"/>${line('M1 -0.4 Q2.8 -0.1 4.4 -0.6', O, 0.5)}${line(lace(4.8, -0.4, 7.6, 1.1, 3), '#ffffff', 0.3)}${line(U, O, 0.45)}${sole(3.3, 5)}`;
		}
		case 'chunky': {
			const U = 'M0.6 2.6 L0.4 -1 Q0.6 -2.4 2.2 -2.4 L4.6 -2.2 Q5.8 -0.4 7.6 0 L10.6 0.8 Q12.8 1.4 12.6 2.6 Z';
			return `${filled(U, up, `${v}-uc`)}<path d="M0.5 2.6 L0.4 -0.4 Q2.4 -0.6 3.6 0.6 L3.2 2.6 Z M7 0 Q9.6 0.4 10.4 2.6 L6.4 2.6 Z M9.6 0.9 Q12.6 1.4 12.6 2.6 L10.8 2.6 Z" fill="${A}"/>${line('M1 -1.8 Q2.6 -1.2 4.4 -1.9', O, 0.5)}${line(lace(4.6, -1.8, 7.4, 0.2, 3), '#ffffff', 0.3)}${line(U, O, 0.45)}<path d="M-0.4 2.4 L13 2.4 Q13.6 2.8 13.3 4 Q13.6 5.4 12.6 6.2 L0.6 6.2 Q-0.6 6 -0.5 4.6 Q-0.9 3.2 -0.4 2.4 Z" fill="${S}" stroke="${O}" stroke-width="0.4"/>${line('M-0.2 4 Q2 3.2 4 4 T8 4 T12.8 3.8', 'rgba(0,0,0,.35)', 0.45)}${line('M0.6 5.4 L12.4 5.4', A, 0.6)}`;
		}
		case 'knit': {
			const U = 'M0.8 3.2 L0.6 -2.6 Q1 -3.6 2.6 -3.4 Q4 -2 5.6 -0.6 Q8.6 0.6 11 1.4 Q12.8 2.2 12.6 3.2 Z';
			const bumps = Array.from({ length: 9 }, (_, i) => `<circle cx="${f(0.6 + i * 1.5)}" cy="${f(4.3)}" r="0.85" fill="${S}" stroke="rgba(0,0,0,.2)" stroke-width="0.2"/>`).join('');
			return `${filled(U, up, `${v}-uc`)}${line('M0.8 -2.6 Q1.6 -3.2 2.6 -3.4', A, 0.8)}<path d="M-0.2 -1.6 Q0.2 -3 1.2 -3 L1.2 -0.6 Z" fill="${A}"/>${line(U, O, 0.45)}<path d="M-0.4 3.1 L12.9 3.1 Q13.4 3.6 13 4.6 Q12.6 5.3 11.8 5.3 L0.4 5.3 Q-0.6 5.2 -0.6 4.2 Z" fill="${S}" stroke="${O}" stroke-width="0.4"/>${bumps}`;
		}
		case 'foam': {
			const U = 'M0.4 4.6 C0 1 1.5 -1.6 4 -1.7 C6 -1.7 7 0.6 9 1 C12 1.6 13.2 3 12.8 4.6 Q6.5 5.6 0.4 4.6 Z';
			const holes = [[3, 0.4, 1, 0.55], [5.6, 1.6, 1.1, 0.6], [8.4, 2.4, 1, 0.5], [10.8, 3, 0.8, 0.45], [2.6, 2.6, 0.9, 0.5], [7, 3.6, 1.2, 0.45]]
				.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="rgba(0,0,0,.45)" transform="rotate(-18 ${x} ${y})"/>`)
				.join('');
			return `${filled(U, up, `${v}-uc`)}${holes}${line('M0.6 3.8 Q6.4 4.8 12.6 3.8', A, 0.5)}${line(U, O, 0.45)}`;
		}
		case 'moon': {
			const U = 'M0.6 3.6 L0.4 -4.4 Q0.6 -6.4 3 -6.4 L5.6 -6.2 Q6.6 -2 8 -0.4 Q12.6 0.2 12.8 2.6 L12.8 3.6 Z';
			return `${filled(U, up, `${v}-uc`)}${line('M0.6 -3.6 Q3 -3 5.4 -3.8 M0.6 -1 Q3.6 -0.2 6.6 -1.2 M0.8 1.6 Q5.4 2.4 11.6 1.4', 'rgba(0,0,0,.25)', 0.5)}${line('M1 -5.8 Q3 -5.2 5.2 -5.8', A, 1)}${line(lace(5.4, -5.2, 7.8, -1, 3), A, 0.35)}${line(U, O, 0.45)}${sole(3.4, 5.8, true)}`;
		}
	}
	return '';
}

/** The pair tied together and hung round the neck by the laces (drawn before the head, so the laces go behind it). */
export function kicksMarkup(u: string, L: KickLook, B: BodyAt): string {
	const v = `${u}-dk`;
	const k = B.hw / 30.5;
	const { cx: c, ty: t } = B;
	const s = 0.94 * k;
	// the laces are tied at the top of the tongue; each shoe hangs from there, toe down and out, sole inward
	const pivot: P = [5, -2];
	const one = (side: -1 | 1, id: string) => {
		const px = c + side * 11.6 * k;
		const py = t + 4.8 * k;
		const tf = `translate(${f(px)} ${f(py)}) ${side < 0 ? 'scale(-1 1) ' : ''}rotate(${side < 0 ? 40 : 36}) scale(${f(s, 3)}) translate(${-pivot[0]} ${-pivot[1]})`;
		return `${line(`M${f(px)} ${f(py)} Q${f(c + side * 7 * k)} ${f(t + 0.6)} ${f(c + side * 3.6 * k)} ${f(t - 4)}`, '#f4f1e8', 0.55 * k)}<g transform="${tf}">${shoeMarkup(`${v}-${id}`, L)}</g>`;
	};
	return `<g class="dr-kicks">${one(-1, 'l')}${one(1, 'r')}</g>`;
}

/* ---------- pauldrons ---------- */

/** A pair of pauldrons (each drawn for the left shoulder at its own origin, the right one mirrored). */
export function shouldersMarkup(u: string, L: ShoulderLook, B: BodyAt, set: string | null = null): string {
	const v = `${u}-ds`;
	const k = B.hw / 30.5;
	const s = 0.9 * k;
	const S: P = [B.cx - B.hw + 9.4 * k, B.ty + 3.8 * k];
	const one = pauldron(v, L);
	const left = `<g transform="translate(${f(S[0])} ${f(S[1])}) scale(${f(s, 3)})">${one}</g>`;
	const right = `<g transform="${mirror(B.cx)}">${left}</g>`;
	let sparkle = '';
	if (set) {
		const G = RAID_SETS[set as keyof typeof RAID_SETS]?.glow ?? '#fff';
		const spots: P[] = [
			[-15, -4],
			[-8, -15],
			[3, -12],
			[-17, 6]
		];
		const one = spots.map(([x, y], i) => `<path class="dr-spark" style="animation-delay:-${f(i * 0.55)}s" d="${star4(S[0] + x * s, S[1] + y * s, 1.5 * s)}" fill="${G}"/>`).join('');
		sparkle = `<g class="dr-set" style="--g:${G}">${one}<g transform="${mirror(B.cx)}">${one}</g></g>`;
	}
	return `<defs>${pauldronDefs(v, L)}</defs><g class="dr-pauldrons${set ? ' dr-setglow" style="--g:' + (RAID_SETS[set as keyof typeof RAID_SETS]?.glow ?? '#fff') : ''}">${left}${right}</g>${sparkle}`;
}

function pauldronDefs(v: string, L: ShoulderLook): string {
	const metal = (id: string, a: string, b: string, c: string) => lin(id, [[0, a], [0.4, b], [0.55, a], [1, c]], 0.4, 1);
	switch (L.kind) {
		case 'judge':
			return metal(`${v}-a`, '#fff4b0', '#e0a520', '#7a5208');
		case 'frost':
			return `${metal(`${v}-a`, '#eaf8ff', '#7a9ab8', '#1c2a3a')}${lin(`${v}-i`, [[0, '#ffffff'], [0.45, '#bff4ff'], [1, '#3a8ab8']], 0.2, 1)}`;
		case 'fel':
			return `${metal(`${v}-a`, '#6a7060', '#2a2e26', '#0a0c08')}${lin(`${v}-f`, [[0, '#f2ffb0'], [0.4, L.glow], [1, '#0a6a1a']], 0, 1)}`;
		case 'dread':
			return `${metal(`${v}-a`, '#5a5a66', '#26262e', '#08080a')}${lin(`${v}-b`, [[0, '#fffaf0'], [0.6, '#e8e0c8'], [1, '#9a8e72']], 0.3, 1)}`;
		case 'wrath':
			return metal(`${v}-a`, '#ff7a6a', '#a8141e', '#3a0408');
		case 'shadow':
			return metal(`${v}-a`, '#4a3e5e', '#2a2238', '#120e1a');
		case 'doom':
			return `${metal(`${v}-a`, '#5a5048', '#1a1410', '#050302')}${lin(`${v}-f`, [[0, '#fff6a0'], [0.4, '#ffb02a'], [1, '#c2341a']], 0, 1)}`;
		case 'arcane':
			return `${metal(`${v}-a`, '#8a6ad8', '#3a2a6a', '#140a2a')}<radialGradient id="${v}-o" cx="0.4" cy="0.35" r="0.65"><stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="${L.glow}"/><stop offset="1" stop-color="${L.glow}" stop-opacity="0"/></radialGradient>`;
		case 'totem':
			return `${metal(`${v}-a`, '#d8dde2', '#8a8f96', '#3a3e44')}${lin(`${v}-w`, [[0, '#e8e8ea'], [0.5, '#9aa0a6'], [1, '#4a4e54']], 0.3, 1)}`;
		case 'burger':
			return `<radialGradient id="${v}-a" cx="0.38" cy="0.3" r="0.85"><stop offset="0" stop-color="#ffd896"/><stop offset="0.45" stop-color="#f0a24a"/><stop offset="1" stop-color="#b0581b"/></radialGradient>`;
	}
	return '';
}

/** One pauldron for the left shoulder, around (0, 0). */
function pauldron(v: string, L: ShoulderLook): string {
	const A = `url(#${v}-a)`;
	const T = L.trim;
	const G = L.glow;
	const lames = (fill: string) =>
		`<path d="M-12 5 Q-3 0.8 8 3.4 L8.4 6.6 Q-3 3.8 -12.4 8.6 Z" fill="${fill}" stroke="${O}" stroke-width="0.6"/><path d="M-11.6 8.4 Q-3 4.6 8 6.8 L8.2 9.6 Q-3 7.4 -11.8 11.6 Z" fill="${fill}" stroke="${O}" stroke-width="0.6"/>`;
	const DOME = 'M-13 4.6 C-14 -5 -6 -10.6 2 -10.2 C7.4 -9.8 10.6 -6.4 10 0.6 Q-1.4 -2 -13 4.6 Z';
	const dome = (fill: string) => `<path d="${DOME}" fill="${fill}" stroke="${O}" stroke-width="0.8"/>${line('M-10 -1.6 C-9 -6 -4 -8.6 1 -8.4', 'rgba(255,255,255,.4)', 0.8)}`;
	switch (L.kind) {
		case 'judge': {
			const feathers = [
				'M-2.6 -8.4 C-5.4 -12.6 -9.6 -15.6 -14.6 -16.4 C-11.4 -12.6 -8.4 -9.6 -4.6 -7 Z',
				'M-1.2 -9 C-2.8 -13.6 -5.6 -17.4 -9.8 -19.6 C-8 -15.2 -6 -11.4 -3.2 -8.2 Z',
				'M0.4 -9.4 C0 -13.8 -1.2 -17.6 -4 -20.6 C-3.6 -16 -2.8 -12.4 -1.4 -9 Z'
			];
			return `${lames(A)}${line('M-11.8 7 Q-3 3 8.2 5.2', T, 0.9)}${feathers.map((d) => `<path d="${d}" fill="${A}" stroke="#5a3a04" stroke-width="0.45" stroke-linejoin="round"/>`).join('')}${dome(A)}${line('M-12.4 3 Q-1.4 -3 9.8 -0.8', T, 1.9)}${[[-9, 0.4], [-4, -1.4], [1.5, -2], [6.5, -1.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.55" fill="#fff4b0"/>`).join('')}<circle class="dr-glow" cx="-1.4" cy="-4.4" r="3" fill="${G}" opacity="0.5"/><circle cx="-1.4" cy="-4.4" r="1.9" fill="${T}" stroke="#7a5208" stroke-width="0.5"/><circle cx="-2" cy="-5" r="0.6" fill="#fff"/>`;
		}
		case 'frost': {
			const spikes = ['M-11 -2 L-17.6 -13.6 L-7.8 -5.4 Z', 'M-6 -7 L-8.8 -20 L-2.4 -8.6 Z', 'M0.6 -9.2 L1.8 -18.6 L4.8 -8.2 Z'];
			return `${lames(A)}${line('M-10 8.6 l3 -1 l3 0.6 l3 -0.8', G, 0.5, ' class="dr-glow"')}${spikes.map((d) => `<path d="${d}" fill="url(#${v}-i)" stroke="#1c2a3a" stroke-width="0.5" stroke-linejoin="round"/>`).join('')}${dome(A)}${skullMarkup(-1.6, -3.6, 0.82, '#dff4ff', '#1c2a3a', G)}<ellipse class="dr-glow" cx="-1.6" cy="-4" rx="5" ry="3.6" fill="${G}" opacity="0.18"/>`;
		}
		case 'fel': {
			const spikes = ['M-12 -0.6 Q-17 -6 -19 -14.6 Q-13 -8.6 -9 -4 Z', 'M-6.4 -7 Q-9 -13 -8.4 -20.4 Q-5.4 -14 -2.6 -8.6 Z', 'M1.2 -9 Q2 -15 6 -18.6 Q4.6 -13.4 5 -8.4 Z'];
			const flames = '<path d="M-14 -6 C-15 -12 -10 -13 -11 -18 C-7 -14 -6 -10 -8.6 -6 Z M-5 -10 C-6.4 -16 -2 -17 -2.6 -22 C1 -17 1.6 -13 -1 -9.6 Z M2 -9.6 C2.4 -14 5.6 -14.4 6.2 -18 C8 -14 7.4 -11 5 -8.6 Z"';
			return `${lames(A)}${spikes.map((d) => `<path d="${d}" fill="#1a1c16" stroke="${O}" stroke-width="0.5"/>`).join('')}<g class="dr-flicker">${flames} fill="url(#${v}-f)" opacity="0.92"/></g>${dome(A)}${line('M-12.4 3 Q-1.4 -3 9.8 -0.8', T, 1.4)}<path d="M-4.4 -4 Q-1.6 -6.2 1.2 -4 Q-1.6 -1.8 -4.4 -4 Z" fill="${G}" class="dr-glow"/><ellipse cx="-1.6" cy="-4" rx="0.4" ry="1.1" fill="#0a1206"/>`;
		}
		case 'dread': {
			const horn = 'M-8 -7.6 C-14.6 -9.6 -18 -14.6 -17 -21 C-15 -16 -12 -13 -6.6 -11.2 Z';
			const skull = 'M-10 -2.4 C-11 -11.4 -4 -14.4 1 -14 C6 -13.4 9 -9.4 8.4 -3.4 C8 -1 6.6 0.6 5 1.2 L4.6 3.6 L-6 3.6 L-6.6 1.2 C-9 0.4 -10 -0.8 -10 -2.4 Z';
			return `${lames(A)}${line('M-11.8 7 Q-3 3 8.2 5.2', T, 0.7)}<path d="${horn}" fill="url(#${v}-b)" stroke="${O}" stroke-width="0.6"/>${line('M-15 -16 l1.6 0.6 M-13 -13.4 l1.4 0.8 M-10.6 -11.4 l1.2 0.8', '#6a604a', 0.5)}<path d="${skull}" fill="url(#${v}-b)" stroke="${O}" stroke-width="0.8"/><path d="M-6.6 -7 C-5 -9 -2.2 -8.6 -2 -6 C-2 -3.6 -5.6 -3.4 -6.6 -5 Z M5.6 -7 C4 -9 1.2 -8.6 1 -6 C1 -3.6 4.6 -3.4 5.6 -5 Z" fill="#160a20"/><g class="dr-glow" fill="${G}"><circle cx="-4.2" cy="-5.8" r="1.1"/><circle cx="3.2" cy="-5.8" r="1.1"/></g><path d="M-0.6 -2.6 L-1.6 -0.4 L0.4 -0.4 Z" fill="#160a20"/><rect x="-5" y="0.8" width="9" height="2.8" rx="0.6" fill="#160a20"/>${line('M-3.4 0.8 v2.8 M-1.4 0.8 v2.8 M0.6 0.8 v2.8 M2.6 0.8 v2.8', '#e8e0c8', 0.55)}`;
		}
		case 'wrath': {
			const claws = ['M-12 1 C-17 -3 -19.4 -9 -18.4 -15.6 C-15.4 -9.4 -12.4 -5.4 -8 -2 Z', 'M-6 -7 C-9 -12 -9.6 -17.4 -7.6 -21.4 C-6.4 -15.8 -4.6 -11.8 -2 -8.6 Z', 'M1 -9 C1 -13.6 2.6 -17.2 5.8 -19.2 C4.8 -14.8 4.8 -11.4 5.2 -8 Z'];
			return `${lames(A)}${line('M-11.8 7 Q-3 3 8.2 5.2', T, 1)}${claws.map((d) => `<path d="${d}" fill="#1a1a1e" stroke="${O}" stroke-width="0.5"/><path d="${d}" fill="none" stroke="#ff4a4a" stroke-width="0.35" opacity="0.6"/>`).join('')}${dome(A)}${line('M-12.4 3 Q-1.4 -3 9.8 -0.8', T, 1.8)}<circle class="dr-glow" cx="-1.6" cy="-4.4" r="2.8" fill="${G}" opacity="0.45"/><path d="M-1.6 -6.4 L0 -4.4 L-1.6 -2.4 L-3.2 -4.4 Z" fill="${G}" stroke="#3a0408" stroke-width="0.4"/>`;
		}
		case 'shadow':
			return `<path d="M-6 -6 L-9.8 -17.4 L-7.8 -17.8 L-4.6 -6.6 Z" fill="#d8dde2" stroke="${O}" stroke-width="0.4"/><rect x="-8.6" y="-7.4" width="5.4" height="1.2" rx="0.4" fill="#6a5a3a" transform="rotate(-18 -6 -6.8)"/><path d="M-12 6 C-13 -2 -6 -7 1 -6.6 C6 -6.2 9 -3 8.6 2.4 Q-1 0.4 -12 6 Z" fill="${A}" stroke="${O}" stroke-width="0.7"/>${line('M-10.6 3.4 C-11 -1.6 -6 -5 0.6 -4.8 C5 -4.6 7.4 -2 7.2 1.6', T, 0.35, ' stroke-dasharray="0.6 0.5"')}${line('M-11 2.4 Q-1 -1.8 8 0', '#14100c', 1.8)}<rect x="-2.2" y="-1.8" width="2.6" height="2.4" rx="0.4" fill="none" stroke="#c8ccd2" stroke-width="0.6"/><circle cx="4.4" cy="-3.2" r="0.6" fill="${G}" class="dr-glow"/>`;
		case 'doom': {
			const big = 'M-15 6 C-17 -6 -8 -13.6 2 -13 C9 -12.6 13 -8 12 1.4 Q-1.4 -2 -15 6 Z';
			const flames = '<path d="M-12 -6 C-14 -13 -8 -14 -9.4 -20 C-4.6 -15 -3.6 -11 -6.4 -6.6 Z M-3 -11 C-4.6 -18 0.4 -19 -0.6 -25 C3.6 -19 4 -15 1.4 -10.4 Z M4.6 -10 C5 -15 8.6 -15.4 9.4 -19.6 C11.4 -15 10.6 -11.4 7.6 -9 Z"';
			return `${lames(A)}${line('M-11.6 7.2 Q-3 3.2 8.2 5.4 M-11.6 10.4 Q-3 6.6 8 8.6', G, 0.45, ' class="dr-glow"')}<g class="dr-flicker">${flames} fill="url(#${v}-f)" opacity="0.95"/></g><path d="M-6 -11.6 L-4 -24 L-0.4 -12.2 Z" fill="#0a0806" stroke="${O}" stroke-width="0.5"/><path d="${big}" fill="${A}" stroke="${O}" stroke-width="0.9"/>${line('M-11 1 L-7 -3 L-8 -6.6 M-7 -3 L-2.6 -4 L0 -8.4 M-2.6 -4 L2.6 -1.6 L6.6 -5.6', G, 0.7, ' class="dr-glow"')}${line('M-12.4 3.4 Q-1.4 -2.6 11.6 -0.4', T, 1.4)}`;
		}
		case 'arcane':
			return `${lames(A)}${dome(A)}${line('M-12.4 3 Q-1.4 -3 9.8 -0.8', T, 1.6)}${line('M-9 -5.6 L-6.6 -3 M-3 -8.2 L-2 -4.6 M3 -7.6 L2 -4', T, 0.6)}<g class="dr-bob"><circle cx="-3" cy="-17" r="5.2" fill="url(#${v}-o)"/><circle cx="-3" cy="-17" r="2.2" fill="#ffffff" opacity="0.9"/><ellipse cx="-3" cy="-17" rx="5.4" ry="1.6" fill="none" stroke="${G}" stroke-width="0.5" transform="rotate(-18 -3 -17)"/><circle cx="-7.4" cy="-20" r="0.5" fill="#fff"/><circle cx="1.4" cy="-13.6" r="0.4" fill="#fff"/></g>`;
		case 'totem': {
			const head = 'M-6 -1 C-8 -8 -4 -12 1 -11.6 C6 -11 8 -7 7 -2 Q0 0 -6 -1 Z';
			const snout = 'M-4 -6.4 L-15 -4.8 Q-16.6 -3.8 -15.4 -2.6 L-5.6 -1 Z';
			return `${lames(A)}${line('M-11.8 7 Q-3 3 8.2 5.2', T, 0.9)}<path d="M-1 -10.6 L1 -16.4 L3.4 -10.8 Z M3.6 -10.4 L6.6 -15 L6.8 -9.2 Z" fill="url(#${v}-w)" stroke="${O}" stroke-width="0.5"/><path d="${head}" fill="url(#${v}-w)" stroke="${O}" stroke-width="0.7"/><path d="${snout}" fill="url(#${v}-w)" stroke="${O}" stroke-width="0.6"/><circle cx="-15.4" cy="-4.2" r="0.7" fill="${O}"/><path d="M-13 -2.8 l0.5 1.6 l0.5 -1.5 M-10.4 -2.3 l0.5 1.6 l0.5 -1.5" fill="#fff" stroke="#fff" stroke-width="0.3"/><circle class="dr-glow" cx="-4.4" cy="-6.2" r="1" fill="${G}"/>${line('M-2 -9 q1 1.4 0 3 M2 -9.4 q1.2 1.2 0.4 3', '#5a5e64', 0.45)}<path class="dr-zap" d="M-14 -9 L-16.4 -12.6 L-15 -12.8 L-18.6 -17.4" fill="none" stroke="${G}" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>`;
		}
		case 'burger':
			return `<g transform="rotate(-10)"><path d="M-12.4 4 Q-12.4 7.6 -9 7.6 L6.4 7.6 Q9.6 7.6 9.6 4 Z" fill="#e8a050" stroke="${O}" stroke-width="0.6"/><rect x="-13" y="0.6" width="23.4" height="3.8" rx="1.8" fill="#5c2f18" stroke="${O}" stroke-width="0.5"/><path d="M-13 0.2 H10.4 L8 2.8 L5.6 1 L2.4 3.2 L-0.6 1 L-4 3 L-7 1 L-10 2.8 Z" fill="#ffc928"/><path d="M-13.4 -0.4 Q-11 1 -8.8 -0.4 Q-6.4 1 -4.2 -0.4 Q-2 1 0.4 -0.4 Q2.6 1 5 -0.4 Q7.4 1 10.8 -0.4" fill="none" stroke="#66c93c" stroke-width="1.2"/><path d="M-12.8 -0.6 C-12.8 -9.4 -5 -11.4 -1.6 -11.4 C2 -11.4 9.8 -9.4 9.8 -0.6 Z" fill="${A}" stroke="${O}" stroke-width="0.7"/>${[[-7, -6.6], [-3, -8.6], [1.4, -8], [5, -5.6], [-4.4, -4.4], [0.6, -5]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="0.8" ry="0.42" fill="#fff4d6"/>`).join('')}<ellipse cx="-6" cy="-7.8" rx="2.6" ry="0.9" fill="#fff3c8" opacity="0.5"/></g>`;
	}
	return '';
}

/* ---------- hats ---------- */

/** A BurgiDrip hat on a head (faceGear's hatItem hands "d-" ids here); '' for an id this page doesn't know. */
export function dripHat(u: string, id: string, h: Face['head']): string {
	const def = DRIP_BY_ID.get(id);
	if (!def || def.draw.slot !== 'hat') return '';
	return hatMarkup(`${u}-dh`, def.draw.look, h);
}

function hatMarkup(v: string, L: HatLook, h: Face['head']): string {
	const { x, y, w } = h;
	const hw = w / 2;
	const sw = f(w * 0.022);
	const P = (a: number, b: number) => `${f(x + a * hw)} ${f(y + b * w)}`;
	const bb: Box = { x: x - hw * 1.3, y: y - w * 0.6, w: w * 1.3, h: w * 0.9 };
	const body = paint(`${v}-b`, L.body, bb);
	const A = L.accent;
	const G = L.glow ?? '#fff';
	const dome = (r = 0.98, top = -0.36) => `M${P(-r, 0.2)} C${P(-r - 0.02, -0.25)} ${P(-0.5, top)} ${P(0, top)} C${P(0.5, top)} ${P(r + 0.02, -0.25)} ${P(r, 0.2)} Z`;
	const letter = (t?: string, col = A, dy = 0.05) => (t ? `<text x="${f(x)}" y="${f(y + dy * w)}" text-anchor="middle" dominant-baseline="central" ${FONT} font-size="${f(0.24 * w)}" fill="${col}">${t}</text>` : '');
	const shine = `<ellipse cx="${f(x - 0.42 * hw)}" cy="${f(y - 0.2 * w)}" rx="${f(0.2 * hw)}" ry="${f(0.05 * w)}" fill="#fff" opacity="0.3"/>`;
	switch (L.kind) {
		case 'cap':
		case 'fitted':
		case 'trucker': {
			const D = L.kind === 'fitted' ? `M${P(-0.98, 0.2)} C${P(-1, -0.18)} ${P(-0.62, -0.38)} ${P(0, -0.38)} C${P(0.62, -0.38)} ${P(1, -0.18)} ${P(0.98, 0.2)} Z` : dome();
			const brim =
				L.kind === 'fitted'
					? `M${P(-1.18, 0.19)} L${P(1.18, 0.19)} L${P(1.06, 0.28)} L${P(-1.06, 0.28)} Z`
					: `M${P(-1.02, 0.17)} Q${P(0, 0.44)} ${P(1.02, 0.17)} Q${P(0, 0.27)} ${P(-1.02, 0.17)} Z`;
			const seams = `M${P(0, -0.36)} L${P(0, 0.2)} M${P(-0.5, -0.3)} Q${P(-0.62, 0)} ${P(-0.58, 0.2)} M${P(0.5, -0.3)} Q${P(0.62, 0)} ${P(0.58, 0.2)}`;
			let front = '';
			if (L.kind === 'trucker') {
				const mesh = paint(`${v}-mesh`, { p: 'check', c: ['#1a1c20', '#3a3e44'] }, bb);
				front = `${mesh.defs}<path d="${D}" fill="${mesh.fill}"/><path d="M${P(-0.62, 0.2)} C${P(-0.66, -0.22)} ${P(-0.34, -0.36)} ${P(0, -0.36)} C${P(0.34, -0.36)} ${P(0.66, -0.22)} ${P(0.62, 0.2)} Z" fill="${body.fill}"/>`;
			}
			return `${body.defs}${front || `<path d="${D}" fill="${body.fill}"/>`}${body.over && !front ? `<clipPath id="${v}-cc"><path d="${D}"/></clipPath><g clip-path="url(#${v}-cc)">${body.over}</g>` : ''}${line(seams, 'rgba(0,0,0,.3)', w * 0.012)}${shine}<path d="${D}" fill="none" stroke="${O}" stroke-width="${sw}"/><circle cx="${f(x)}" cy="${f(y - 0.37 * w)}" r="${f(w * 0.03)}" fill="${solid(L.body)}" stroke="${O}" stroke-width="${f(w * 0.01)}"/>${letter(L.t, A, L.kind === 'trucker' ? 0 : 0.03)}${L.kind === 'trucker' ? `<rect x="${f(x - 0.36 * hw)}" y="${f(y - 0.12 * w)}" width="${f(0.72 * hw)}" height="${f(0.12 * w)}" rx="${f(0.02 * w)}" fill="${A}" stroke="${O}" stroke-width="${f(w * 0.008)}"/>` : ''}<path d="${brim}" fill="${solid(L.body)}" stroke="${O}" stroke-width="${sw}" stroke-linejoin="round"/><path d="${brim}" fill="#000" opacity="0.18"/>${L.kind === 'fitted' ? `<circle cx="${f(x + 0.6 * hw)}" cy="${f(y + 0.235 * w)}" r="${f(0.05 * w)}" fill="#e8c25a" stroke="#7a5208" stroke-width="${f(w * 0.008)}"/><circle cx="${f(x + 0.6 * hw)}" cy="${f(y + 0.235 * w)}" r="${f(0.025 * w)}" fill="#fff4b0"/>` : ''}`;
		}
		case 'back': {
			const D = dome();
			return `<path d="M${P(0.1, -0.32)} Q${P(0.8, -0.56)} ${P(1.3, -0.4)} Q${P(1.05, -0.26)} ${P(0.2, -0.24)} Z" fill="${solid(L.body)}" stroke="${O}" stroke-width="${sw}"/><path d="M${P(0.1, -0.32)} Q${P(0.8, -0.56)} ${P(1.3, -0.4)} Q${P(1.05, -0.26)} ${P(0.2, -0.24)} Z" fill="#000" opacity="0.25"/>${body.defs}<path d="${D}" fill="${body.fill}"/>${line(`M${P(0, -0.36)} L${P(0, 0.2)} M${P(-0.5, -0.3)} Q${P(-0.62, 0)} ${P(-0.58, 0.2)} M${P(0.5, -0.3)} Q${P(0.62, 0)} ${P(0.58, 0.2)}`, 'rgba(0,0,0,.3)', w * 0.012)}<path d="M${P(-0.3, 0.2)} Q${P(-0.3, 0.02)} ${P(0, 0.02)} Q${P(0.3, 0.02)} ${P(0.3, 0.2)} Z" fill="#1a1410"/>${line(`M${P(-0.3, 0.08)} L${P(0.3, 0.08)}`, A, w * 0.03)}${shine}<path d="${D}" fill="none" stroke="${O}" stroke-width="${sw}"/>`;
		}
		case 'bucket': {
			const CROWN = `M${P(-0.78, 0.14)} C${P(-0.8, -0.24)} ${P(-0.42, -0.33)} ${P(0, -0.33)} C${P(0.42, -0.33)} ${P(0.8, -0.24)} ${P(0.78, 0.14)} Z`;
			const BRIM = `M${P(-1.26, 0.25)} Q${P(0, 0.02)} ${P(1.26, 0.25)} Q${P(1.1, 0.37)} ${P(0, 0.35)} Q${P(-1.1, 0.37)} ${P(-1.26, 0.25)} Z`;
			const fuzzy = typeof L.body === 'string';
			const fuzz = fuzzy
				? Array.from({ length: 22 }, (_, i) => {
						const a = Math.PI + (i / 21) * Math.PI;
						return `<circle cx="${f(x + Math.cos(a) * 0.8 * hw)}" cy="${f(y + 0.05 * w + Math.sin(a) * 0.36 * w)}" r="${f(0.055 * w)}"/>`;
					}).join('') +
					Array.from({ length: 16 }, (_, i) => `<circle cx="${f(x + (-1.2 + (i * 2.4) / 15) * hw)}" cy="${f(y + 0.3 * w + Math.abs(i - 7.5) * 0.004 * w)}" r="${f(0.06 * w)}"/>`).join('')
				: '';
			return `${body.defs}<path d="${BRIM}" fill="${body.fill}" stroke="${O}" stroke-width="${sw}" stroke-linejoin="round"/><path d="${CROWN}" fill="${body.fill}" stroke="${O}" stroke-width="${sw}"/>${fuzzy ? `<g fill="${body.fill}" stroke="${A}" stroke-width="${f(w * 0.012)}">${fuzz}</g>` : ''}${line(`M${P(-0.79, 0.05)} Q${P(0, -0.02)} ${P(0.79, 0.05)}`, fuzzy ? A : 'rgba(0,0,0,.4)', w * 0.02, ` stroke-dasharray="${f(w * 0.03)} ${f(w * 0.02)}"`)}${shine}`;
		}
		case 'skully':
		case 'watch': {
			const high = L.kind === 'watch';
			const D = high
				? `M${P(-0.9, 0.02)} C${P(-0.9, -0.3)} ${P(-0.45, -0.42)} ${P(0, -0.42)} C${P(0.45, -0.42)} ${P(0.9, -0.3)} ${P(0.9, 0.02)} Z`
				: `M${P(-1, 0.18)} C${P(-1, -0.2)} ${P(-0.5, -0.33)} ${P(0, -0.33)} C${P(0.5, -0.33)} ${P(1, -0.2)} ${P(1, 0.18)} Z`;
			const cy0 = high ? -0.06 : 0.06;
			const cuffH = high ? 0.17 : 0.17;
			const ribs = Array.from({ length: 19 }, (_, i) => `M${f(x + ((i - 9) * w) / 18)} ${f(y + cy0 * w)} V${f(y + (cy0 + cuffH) * w)}`).join(' ');
			return `<path d="${D}" fill="${solid(L.body)}" stroke="${O}" stroke-width="${sw}"/>${line(Array.from({ length: 9 }, (_, i) => `M${f(x + ((i - 4) * w) / 9.5)} ${f(y - 0.38 * w)} V${f(y + cy0 * w)}`).join(' '), 'rgba(0,0,0,.18)', w * 0.012)}${shine}<rect x="${f(x - 1.04 * hw)}" y="${f(y + cy0 * w)}" width="${f(2.08 * hw)}" height="${f(cuffH * w)}" rx="${f(0.06 * w)}" fill="${solid(L.body)}" stroke="${O}" stroke-width="${sw}"/>${line(ribs, 'rgba(0,0,0,.25)', w * 0.014)}${high ? `<rect x="${f(x - 0.16 * hw)}" y="${f(y + (cy0 + 0.035) * w)}" width="${f(0.32 * hw)}" height="${f(0.1 * w)}" rx="${f(0.01 * w)}" fill="${A}" stroke="${O}" stroke-width="${f(w * 0.006)}"/>` : ''}`;
		}
		case 'durag': {
			const D = `M${P(-1.02, 0.24)} C${P(-1.04, -0.22)} ${P(-0.5, -0.36)} ${P(0, -0.36)} C${P(0.5, -0.36)} ${P(1.04, -0.22)} ${P(1.02, 0.24)} Q${P(0, 0.12)} ${P(-1.02, 0.24)} Z`;
			return `${body.defs}<path d="M${P(0.9, 0.04)} C${P(1.3, 0.2)} ${P(1.2, 0.6)} ${P(1.36, 0.92)} L${P(1.2, 0.96)} C${P(1.04, 0.62)} ${P(1.1, 0.3)} ${P(0.8, 0.14)} Z M${P(0.98, 0.1)} C${P(1.5, 0.3)} ${P(1.5, 0.66)} ${P(1.66, 0.86)} L${P(1.52, 0.92)} C${P(1.34, 0.66)} ${P(1.34, 0.38)} ${P(0.9, 0.2)} Z" fill="${body.fill}" stroke="${O}" stroke-width="${f(w * 0.014)}"/><path d="${D}" fill="${body.fill}" stroke="${O}" stroke-width="${sw}"/>${line(`M${P(0, -0.36)} L${P(0, 0.17)}`, A, w * 0.025)}${line(`M${P(-0.6, -0.22)} Q${P(-0.2, -0.32)} ${P(0.3, -0.28)}`, 'rgba(255,255,255,.55)', w * 0.03)}`;
		}
		case 'ushanka': {
			const DOME = `M${P(-1.02, 0.12)} C${P(-1.06, -0.32)} ${P(-0.5, -0.46)} ${P(0, -0.46)} C${P(0.5, -0.46)} ${P(1.06, -0.32)} ${P(1.02, 0.12)} Z`;
			const flap = `M${P(-1.02, 0.02)} Q${P(-1.24, 0.3)} ${P(-1.08, 0.66)} Q${P(-0.86, 0.72)} ${P(-0.76, 0.5)} L${P(-0.78, 0.04)} Z`;
			const r = seeded(v);
			const furl = Array.from({ length: 18 }, () => `M${f(x + (r() * 2 - 1) * hw)} ${f(y + (-0.4 + r() * 0.5) * w)} q${f(w * 0.02)} ${f(w * 0.03)} 0 ${f(w * 0.06)}`).join(' ');
			return `<path d="${flap}" fill="${A}" stroke="${O}" stroke-width="${sw}"/><path d="${flap}" transform="${mirror(x)}" fill="${A}" stroke="${O}" stroke-width="${sw}"/><path d="${DOME}" fill="${solid(L.body)}" stroke="${O}" stroke-width="${sw}"/>${line(furl, 'rgba(0,0,0,.25)', w * 0.014)}<path d="M${P(-1.06, 0.06)} C${P(-1.06, -0.12)} ${P(-0.5, -0.18)} ${P(0, -0.18)} C${P(0.5, -0.18)} ${P(1.06, -0.12)} ${P(1.06, 0.06)} L${P(1.04, 0.24)} Q${P(0, 0.12)} ${P(-1.04, 0.24)} Z" fill="${A}" stroke="${O}" stroke-width="${sw}"/>${line(furl.replace(/M(\S+) (\S+)/g, (_, a, b) => `M${a} ${f(+b + 0.32 * w)}`), 'rgba(255,255,255,.18)', w * 0.012)}`;
		}
		case 'crown': {
			const D = `M${P(-0.92, 0.22)} L${P(-1.02, -0.3)} L${P(-0.5, -0.06)} L${P(0, -0.46)} L${P(0.5, -0.06)} L${P(1.02, -0.3)} L${P(0.92, 0.22)} Z`;
			return `${body.defs}<path d="${D}" fill="${body.fill}" stroke="#5a3a04" stroke-width="${sw}" stroke-linejoin="round"/><rect x="${f(x - 0.94 * hw)}" y="${f(y + 0.06 * w)}" width="${f(1.88 * hw)}" height="${f(0.16 * w)}" rx="${f(0.03 * w)}" fill="${body.fill}" stroke="#5a3a04" stroke-width="${sw}"/>${[[-1.02, -0.3], [0, -0.46], [1.02, -0.3]].map(([a, b]) => `<circle cx="${f(x + a * hw)}" cy="${f(y + b * w)}" r="${f(0.045 * w)}" fill="#fff4b0" stroke="#5a3a04" stroke-width="${f(w * 0.008)}"/>`).join('')}${[[-0.55, '#2a8aff'], [0, A], [0.55, '#2fd36a']].map(([a, col]) => `<circle cx="${f(x + (a as number) * hw)}" cy="${f(y + 0.14 * w)}" r="${f(0.05 * w)}" fill="${col}" stroke="#5a3a04" stroke-width="${f(w * 0.008)}"/>`).join('')}<path class="dr-twinkle" d="${star4(x + 0.3 * hw, y - 0.18 * w, 0.06 * w)}" fill="#fffbe6"/><path class="dr-twinkle" style="animation-delay:-1.2s" d="${star4(x - 0.7 * hw, y + 0.02 * w, 0.045 * w)}" fill="#fffbe6"/>`;
		}
		case 'helm-judge': {
			const D = dome(1.02, -0.4);
			const wing = `M${P(-0.95, 0.06)} C${P(-1.4, -0.1)} ${P(-1.7, -0.5)} ${P(-1.6, -0.86)} C${P(-1.4, -0.6)} ${P(-1.2, -0.5)} ${P(-1.06, -0.48)} C${P(-1.3, -0.62)} ${P(-1.3, -0.8)} ${P(-1.16, -1)} C${P(-1.02, -0.72)} ${P(-0.86, -0.6)} ${P(-0.76, -0.56)} Q${P(-0.8, -0.2)} ${P(-0.95, 0.06)} Z`;
			return `${body.defs}<path d="${wing}" fill="${body.fill}" stroke="#5a3a04" stroke-width="${sw}" stroke-linejoin="round"/><path d="${wing}" transform="${mirror(x)}" fill="${body.fill}" stroke="#5a3a04" stroke-width="${sw}" stroke-linejoin="round"/><path d="${D}" fill="${body.fill}" stroke="#5a3a04" stroke-width="${sw}"/>${line(`M${P(0, -0.4)} L${P(0, 0.12)}`, '#fff4b0', w * 0.04)}${line(`M${P(-0.96, 0.12)} Q${P(0, 0)} ${P(0.96, 0.12)}`, A, w * 0.07)}<circle class="dr-glow" cx="${f(x)}" cy="${f(y + 0.07 * w)}" r="${f(0.08 * w)}" fill="${G}" opacity="0.6"/><circle cx="${f(x)}" cy="${f(y + 0.07 * w)}" r="${f(0.045 * w)}" fill="#fff"/>${shine}`;
		}
		case 'helm-frost': {
			const D = dome(1.02, -0.36);
			const spikes = [-0.86, -0.56, -0.28, 0, 0.28, 0.56, 0.86]
				.map((a, i) => {
					const hgt = [0.62, 0.78, 0.9, 1.06, 0.9, 0.78, 0.62][i];
					return `<path d="M${P(a - 0.11, -0.12 - Math.abs(a) * 0.1)} L${P(a * 1.12, -0.24 - hgt * 0.6)} L${P(a + 0.11, -0.12 - Math.abs(a) * 0.1)} Z" fill="${body.fill}" stroke="${A}" stroke-width="${f(w * 0.014)}" stroke-linejoin="round"/>`;
				})
				.join('');
			return `${body.defs}${spikes}<path d="${D}" fill="${body.fill}" stroke="${A}" stroke-width="${sw}"/>${line(`M${P(-0.9, 0.05)} Q${P(0, -0.1)} ${P(0.9, 0.05)}`, G, w * 0.03, ' class="dr-glow"')}<path class="dr-glow" d="M${P(0, -0.24)} L${P(0.1, -0.08)} L${P(0, 0.04)} L${P(-0.1, -0.08)} Z" fill="${G}"/>${shine}`;
		}
		case 'helm-fel': {
			const horn = `M${P(-0.7, 0.04)} C${P(-1.3, -0.04)} ${P(-1.5, -0.5)} ${P(-1.2, -0.92)} C${P(-1.1, -0.6)} ${P(-0.9, -0.3)} ${P(-0.5, -0.12)} Z`;
			const fire = `M${P(-1.2, -0.9)} C${P(-1.36, -1.14)} ${P(-1.1, -1.24)} ${P(-1.2, -1.46)} C${P(-0.96, -1.22)} ${P(-0.94, -1.06)} ${P(-1.08, -0.86)} Z`;
			return `<path d="${horn}" fill="${solid(L.body)}" stroke="${O}" stroke-width="${sw}"/><path d="${horn}" transform="${mirror(x)}" fill="${solid(L.body)}" stroke="${O}" stroke-width="${sw}"/>${line(`M${P(-1.1, -0.5)} l${f(w * 0.06)} ${f(w * 0.02)} M${P(-1.0, -0.3)} l${f(w * 0.06)} ${f(w * 0.02)}`, '#5a604a', w * 0.014)}<g class="dr-flicker"><path d="${fire}" fill="${G}"/><path d="${fire}" transform="${mirror(x)}" fill="${G}"/></g><rect x="${f(x - 0.98 * hw)}" y="${f(y + 0.02 * w)}" width="${f(1.96 * hw)}" height="${f(0.14 * w)}" rx="${f(0.04 * w)}" fill="${solid(L.body)}" stroke="${A}" stroke-width="${sw}"/><path class="dr-glow" d="M${P(0, 0.0)} L${P(0.12, 0.09)} L${P(0, 0.18)} L${P(-0.12, 0.09)} Z" fill="${G}"/>`;
		}
		case 'helm-dread': {
			const horn = `M${P(-0.86, -0.1)} C${P(-1.4, -0.2)} ${P(-1.56, 0.2)} ${P(-1.34, 0.56)} C${P(-1.28, 0.26)} ${P(-1.06, 0.08)} ${P(-0.74, 0.08)} Z`;
			const D = `M${P(-0.92, 0.2)} C${P(-1, -0.3)} ${P(-0.5, -0.46)} ${P(0, -0.46)} C${P(0.5, -0.46)} ${P(1, -0.3)} ${P(0.92, 0.2)} Z`;
			return `<path d="${horn}" fill="${A}" stroke="${O}" stroke-width="${sw}"/><path d="${horn}" transform="${mirror(x)}" fill="${A}" stroke="${O}" stroke-width="${sw}"/><path d="${D}" fill="${solid(L.body)}" stroke="${O}" stroke-width="${sw}"/><path d="M${P(-0.6, -0.14)} C${P(-0.5, -0.3)} ${P(-0.16, -0.28)} ${P(-0.14, -0.1)} C${P(-0.14, 0.04)} ${P(-0.5, 0.06)} ${P(-0.6, -0.14)} Z M${P(0.6, -0.14)} C${P(0.5, -0.3)} ${P(0.16, -0.28)} ${P(0.14, -0.1)} C${P(0.14, 0.04)} ${P(0.5, 0.06)} ${P(0.6, -0.14)} Z" fill="#160a20"/><g class="dr-glow" fill="${G}"><circle cx="${f(x - 0.36 * hw)}" cy="${f(y - 0.12 * w)}" r="${f(0.05 * w)}"/><circle cx="${f(x + 0.36 * hw)}" cy="${f(y - 0.12 * w)}" r="${f(0.05 * w)}"/></g>${line(`M${P(-0.84, 0.18)} Q${P(0, 0.1)} ${P(0.84, 0.18)}`, A, w * 0.04)}${line(`M${P(-0.3, 0.1)} v${f(0.07 * w)} M${P(0, 0.08)} v${f(0.08 * w)} M${P(0.3, 0.1)} v${f(0.07 * w)}`, '#160a20', w * 0.02)}`;
		}
		case 'helm-wrath': {
			const horn = `M${P(-0.84, -0.04)} C${P(-1.3, -0.16)} ${P(-1.42, -0.58)} ${P(-1.1, -0.98)} C${P(-1.1, -0.64)} ${P(-0.9, -0.36)} ${P(-0.58, -0.22)} Z`;
			const D = dome(1, -0.4);
			return `<path d="${horn}" fill="${A}" stroke="${O}" stroke-width="${sw}"/><path d="${horn}" transform="${mirror(x)}" fill="${A}" stroke="${O}" stroke-width="${sw}"/>${line(`M${P(-1.1, -0.96)} C${P(-1.32, -0.6)} ${P(-1.26, -0.2)} ${P(-0.84, -0.04)}`, '#ff4a4a', w * 0.012, ' opacity="0.6"')}${body.defs}<path d="${D}" fill="${body.fill}" stroke="${O}" stroke-width="${sw}"/><path d="M${P(-0.98, 0.04)} L${P(-0.2, 0.14)} L${P(0, 0.04)} L${P(0.2, 0.14)} L${P(0.98, 0.04)} L${P(0.98, 0.22)} L${P(-0.98, 0.22)} Z" fill="${A}" stroke="${O}" stroke-width="${f(w * 0.012)}"/><path class="dr-glow" d="M${P(0, -0.3)} L${P(0.1, -0.16)} L${P(0, -0.02)} L${P(-0.1, -0.16)} Z" fill="${G}" stroke="#3a0408" stroke-width="${f(w * 0.01)}"/>${shine}`;
		}
		case 'hood-shadow': {
			const outer = `M${P(-1.36, 0.95)} C${P(-1.46, 0.3)} ${P(-1.2, -0.3)} ${P(-0.7, -0.46)} C${P(-0.3, -0.58)} ${P(0, -0.6)} ${P(0.16, -0.66)} C${P(0.3, -0.56)} ${P(0.9, -0.42)} ${P(1.24, -0.12)} C${P(1.46, 0.2)} ${P(1.44, 0.6)} ${P(1.36, 0.95)} Z`;
			const inner = `M${P(-0.98, 0.95)} C${P(-1.04, 0.4)} ${P(-0.9, -0.12)} ${P(0, -0.16)} C${P(0.9, -0.12)} ${P(1.04, 0.4)} ${P(0.98, 0.95)} Z`;
			return `<path d="${outer} ${inner}" fill-rule="evenodd" fill="${solid(L.body)}" stroke="${O}" stroke-width="${sw}"/><path d="${inner}" fill="none" stroke="${A}" stroke-width="${f(w * 0.05)}" opacity="0.8"/>${line(`M${P(-1.1, 0.2)} Q${P(-1.2, -0.2)} ${P(-0.7, -0.36)} M${P(1.1, 0.2)} Q${P(1.2, -0.1)} ${P(0.86, -0.3)}`, 'rgba(255,255,255,.12)', w * 0.03)}<circle class="dr-glow" cx="${f(x)}" cy="${f(y - 0.3 * w)}" r="${f(0.03 * w)}" fill="${G}"/>`;
		}
		case 'helm-doom': {
			const D = dome(1.02, -0.42);
			const fire = `M${P(-0.3, -0.32)} C${P(-0.42, -0.62)} ${P(-0.12, -0.7)} ${P(-0.2, -1)} C${P(0.06, -0.78)} ${P(0.16, -0.92)} ${P(0.1, -1.16)} C${P(0.4, -0.86)} ${P(0.44, -0.56)} ${P(0.3, -0.32)} Z`;
			return `<defs>${lin(`${v}-f`, [[0, '#fff6a0'], [0.4, '#ffb02a'], [1, '#c2341a']], 0, 1)}</defs><g class="dr-flicker"><path d="${fire}" fill="url(#${v}-f)"/></g><path d="M${P(-0.9, -0.1)} L${P(-1.3, -0.62)} L${P(-0.66, -0.3)} Z" fill="#0a0806" stroke="${O}" stroke-width="${f(w * 0.012)}"/><path d="M${P(-0.9, -0.1)} L${P(-1.3, -0.62)} L${P(-0.66, -0.3)} Z" transform="${mirror(x)}" fill="#0a0806" stroke="${O}" stroke-width="${f(w * 0.012)}"/>${body.defs}<path d="${D}" fill="${body.fill}" stroke="${O}" stroke-width="${sw}"/>${line(`M${P(-0.7, 0.06)} L${P(-0.4, -0.14)} L${P(-0.5, -0.3)} M${P(-0.4, -0.14)} L${P(0, -0.2)} L${P(0.2, -0.36)} M${P(0, -0.2)} L${P(0.5, -0.06)} L${P(0.7, -0.24)}`, G, w * 0.022, ' class="dr-glow"')}${line(`M${P(-0.98, 0.14)} Q${P(0, 0.02)} ${P(0.98, 0.14)}`, A, w * 0.05)}`;
		}
	}
	return '';
}

/* ---------- on an emblem ---------- */

/**
 * What goes under an emblem's head: the top (with a hood behind the neck), a chain, the kicks round the neck.
 * '' when none is worn (so emblems without clothes draw exactly as before).
 */
export function dripUnder(u: string, w: FaceWear | null | undefined, key: BodyKey): string {
	if (!w || (!w.top && !w.neck && !w.kicks)) return '';
	const B = BODY_AT[key];
	const top = w.top ? DRIP_BY_ID.get(w.top) : undefined;
	const neck = w.neck ? DRIP_BY_ID.get(w.neck) : undefined;
	const kicks = w.kicks ? DRIP_BY_ID.get(w.kicks) : undefined;
	return (
		(top?.draw.slot === 'top' ? topMarkup(u, top.draw.look, B) : '') +
		(neck?.draw.slot === 'neck' ? neckMarkup(u, neck.draw.look, B) : '') +
		(kicks?.draw.slot === 'kicks' ? kicksMarkup(u, kicks.draw.look, B) : '')
	);
}
/** What goes over it (after the face, before anything held): the pauldrons, sparkling with a full raid set. */
export function dripOver(u: string, w: FaceWear | null | undefined, key: BodyKey): string {
	const id = w?.shoulders;
	const def = id ? DRIP_BY_ID.get(id) : undefined;
	if (!def || def.draw.slot !== 'shoulders') return '';
	return shouldersMarkup(u, def.draw.look, BODY_AT[key], setBonus({ top: w?.top, shoulders: id, hat: w?.hat }));
}

/* ---------- the store's item pictures ---------- */

/** The plain dress-form mannequin: torso, neck stand, head (each a separate part so clothes go between them). */
function mannequin(u: string): { torso: string; neck: string; stub: string; defs: string } {
	const B = BODY_AT.mannequin;
	const g = `${u}-mq`;
	const defs = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a8290"/><stop offset="1" stop-color="#2a2f38"/></linearGradient></defs>`;
	return {
		torso: `${defs}<path d="${torsoD(B, 1)}" fill="url(#${g})" stroke="#14161a" stroke-width="1"/>`,
		// the neck stand + head (with its own copy of the gradient when there's no torso, for hats)
		neck: `<path d="M27.6 28 L27.2 47 Q32 49 36.8 47 L36.4 28 Z" fill="url(#${g})" stroke="#14161a" stroke-width="0.8"/><ellipse cx="32" cy="21" rx="11" ry="13" fill="url(#${g})" stroke="#14161a" stroke-width="0.9"/><ellipse cx="28" cy="15" rx="3.4" ry="5" fill="#fff" opacity="0.2"/>`,
		// a short neck with a rounded cap and no head (the tops' pictures)
		stub: `<path d="M28 38 L27.4 47 Q32 49 36.6 47 L36 38 Z" fill="url(#${g})" stroke="#14161a" stroke-width="0.8"/><ellipse cx="32" cy="38" rx="4" ry="1.4" fill="#9aa2ae" stroke="#14161a" stroke-width="0.6"/>`,
		defs
	};
}

/** An item's picture for the store: the piece on a mannequin (or the kicks on their own), and the box to show. */
export function dripCard(u: string, id: string): { vb: string; markup: string } | null {
	const def = DRIP_BY_ID.get(id);
	if (!def) return null;
	const B = BODY_AT.mannequin;
	const m = mannequin(u);
	const d = def.draw;
	switch (d.slot) {
		case 'top':
			return { vb: '-2 35 68 30', markup: m.torso + topMarkup(u, d.look, B) + m.stub };
		case 'neck':
			return { vb: '11 37 42 28', markup: m.torso + m.stub + neckMarkup(u, d.look, B) };
		case 'kicks':
			return {
				vb: '-1 -9 64 32',
				markup: `<g transform="translate(2 4) scale(2.05)">${shoeMarkup(`${u}-a`, d.look)}</g><g transform="translate(34 9) scale(2.05)">${shoeMarkup(`${u}-b`, d.look)}</g>`
			};
		case 'hat':
			return { vb: '-4 -12 72 40', markup: m.defs + m.neck + hatMarkup(`${u}-dh`, d.look, MANNEQUIN_HEAD) };
		case 'shoulders':
			return { vb: '-14 22 92 43', markup: m.torso + m.stub + shouldersMarkup(u, d.look, B) };
	}
}
