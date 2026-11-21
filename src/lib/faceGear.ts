/**
 * BurgiShop's 420 pack 2 (2026-11-16, the user: "kör 420 paketet"; the list left over from the first 420
 * pack: mouthpieces, smoke colours, eyes, hats and a sidekick on the shoulder). Whatever sits on a face is
 * drawn by each operator's own emblem, at its own eyes, mouth and head, because the faces sit in different
 * places (a skull at 80 % in a ghillie hood, a helmet drawn at half size, a balaclava under goggles, a gold
 * mask, a bearded wizard). Every emblem has its anchors in FACES; these builders draw the item there.
 *
 * Pure, deterministic strings (no browser APIs, no runes), ids scoped by the caller's `u`, so Node tests
 * them (scripts/face-gear.test.js) and the prerendered page matches the browser. Animated parts use the
 * `fg-*` classes in grind.css (frozen by reduced motion). The Golden Holk stays each emblem's own drawing
 * (shop.ts `mouth-goldholk`). The sidekick (`pet`) needs no face: OpGear sits it on the left shoulder
 * (ShopPet.svelte). Smoke colours are CSS too: `data-smoke` on the emblem's <svg> tints its smoke.
 * Our own cartoons, no brands.
 */
import { LEAF_PATHS, LEAF_STEM } from './leaf.ts';
// KarmaShop's eyes and hats ("k-" ids, 2026-11-20) are drawn there, at the same anchors
import { karmaEyes, karmaHat } from './karmaShopArt.ts';

type P = [number, number];
const f = (n: number, d = 2) => +n.toFixed(d);

/** What an emblem gets from the shop: the ids worn in the face slots (shop.ts), or nothing. */
export interface FaceWear {
	mouth?: string | null;
	eyes?: string | null;
	hat?: string | null;
	smoke?: string | null;
}

/** A member's worn items (shop.ts `worn`) → the face slots an emblem draws. */
export function faceOf(w: Partial<Record<string, { id: string } | undefined>> | undefined): FaceWear {
	return { mouth: w?.mouth?.id ?? null, eyes: w?.eyes?.id ?? null, hat: w?.hat?.id ?? null, smoke: w?.smoke?.id ?? null };
}

export interface Mouth {
	/** where a holk's filter tip sits (the mouth corner) */
	x: number;
	y: number;
	/** which way things in the mouth point: 1 = to the right, -1 = to the left (Phillestar's burger and
	    Drängen's beer are on the right, so theirs point left) */
	dir: 1 | -1;
	/** slope down from level, degrees */
	deg: number;
	/** size: the emblem's own holk length ÷ 19 */
	k: number;
}
export interface Face {
	/** eye centres and how big a lens is there; null = no eyes to draw on */
	eyes: { l: P; r: P; rad: number } | null;
	mouth: Mouth;
	/** top of the head (where a hat sits) and the head's width there */
	head: { x: number; y: number; w: number };
	/** the emblem smokes anyway (its own holk or pipe): a smoke colour only tints that */
	smokes: boolean;
	/** where a smoke colour puffs out when nothing smokes (beside the mouth, so the face stays clear) */
	puff?: P;
}

/** A mouth from the emblem's own holk (filter tip → burning end), so everything lines up with it. */
function mouthFrom(px: number, py: number, qx: number, qy: number): Mouth {
	const dx = qx - px;
	const dy = qy - py;
	return { x: px, y: py, dir: dx < 0 ? -1 : 1, deg: f((Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI, 1), k: f(Math.hypot(dx, dy) / 19, 3) };
}

export type FaceKey = 'abscar' | 'phillestar' | 'lars' | 'jeeven' | 'ingman' | 'aw' | 'joker' | 'initials';

/** Every face's anchors in its emblem's 64×64 box (read off the drawings; holk ends = the Golden Holk's). */
export const FACES: Record<FaceKey, Face> = {
	// the skull at 80 % (abscarOperator.ts headAt): eyes 22.6/41.4, 25.4 → ×0.8 + (6.4, −2.4)
	abscar: { eyes: { l: [24.5, 17.9], r: [39.5, 17.9], rad: 4.6 }, mouth: mouthFrom(38.4, 30.08, 57.4, 34), head: { x: 32, y: 0.5, w: 36 }, smokes: true },
	// NukeOperator's head at half size (x/2 − 20, y/2 − 10): eyes 86/114, 77; helmet top 5
	phillestar: { eyes: { l: [23, 28.5], r: [37, 28.5], rad: 4.4 }, mouth: mouthFrom(25.6, 43.2, 8.4, 47.6), head: { x: 30, y: 5.5, w: 38 }, smokes: false, puff: [17.6, 45] },
	// goggles 19–45 × 22.4–31.5, FAST helmet top 3.8
	lars: { eyes: { l: [25.6, 26.8], r: [38.4, 26.8], rad: 5.2 }, mouth: mouthFrom(29.6, 38.4, 14.6, 47.6), head: { x: 32, y: 4.5, w: 36 }, smokes: false, puff: [19.6, 43.4] },
	// angular eye holes ≈ 21–30 × 22–29, hood top 5.5
	jeeven: { eyes: { l: [25.5, 25.6], r: [38.5, 25.6], rad: 4.4 }, mouth: mouthFrom(34, 38.8, 56.5, 45.4), head: { x: 32, y: 6, w: 34 }, smokes: true },
	// round glasses 27.6/36.4, 25.2 r 3.3; the face's top 16 (a hat replaces his wizard hat)
	ingman: { eyes: { l: [27.6, 25.2], r: [36.4, 25.2], rad: 3.6 }, mouth: mouthFrom(35.2, 33.9, 50.4, 38.4), head: { x: 32, y: 15.2, w: 24 }, smokes: true },
	// AW (AwEmblem): the big round eyes 26.6/37.4, 25.4 r 4.1, the grin's right corner 37.6, 36, face top 11.2
	// (a hat replaces his pompadour)
	aw: { eyes: { l: [26.6, 25.4], r: [37.4, 25.4], rad: 4.4 }, mouth: mouthFrom(37.6, 36, 54.6, 40.4), head: { x: 32, y: 10.4, w: 28 }, smokes: false, puff: [46.4, 38.6] },
	// TheJoker_BPL (JokerEmblem): eyes 27.6/36.4, 26.4 in their black paint, the red mouth's right corner 37.6, 35.2,
	// hair top 5.8 (a hat sits on the hair)
	joker: { eyes: { l: [27.6, 26.4], r: [36.4, 26.4], rad: 3.4 }, mouth: mouthFrom(37.6, 35.2, 55, 40), head: { x: 32, y: 7, w: 30 }, smokes: false, puff: [44, 36] },
	// a member without an operator: the initials badge (SquadAvatar); glasses sit just above the letters
	initials: { eyes: { l: [22.5, 17.6], r: [41.5, 17.6], rad: 5 }, mouth: mouthFrom(40, 45, 62, 52), head: { x: 32, y: 2, w: 44 }, smokes: false, puff: [58, 48] }
};

/* ---------- shared bits ---------- */

const emberDefs = (u: string) => `<radialGradient id="${u}-em"><stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient>`;
/** a burning end: soft glow (pulses with the emblems' own `op-ember-glow`), orange coal, hot middle */
const ember = (u: string, x: number, y: number, r: number) =>
	`<circle class="op-ember-glow" cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.2)}" fill="url(#${u}-em)"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#ff8a1a"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.45)}" fill="#ffe08a"/>`;

/** the shared cannabis leaf (leaf.ts, 24-unit box, stem base at 12,20) with its base at (x, y) */
const leaf = (x: number, y: number, s: number, rot: number, fill: string, stroke = '#14501a', sw = 0.8) =>
	`<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s, 3)}) translate(-12 -20)">${LEAF_PATHS.map((d) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`).join('')}<path d="${LEAF_STEM}" stroke="${stroke}" stroke-width="${sw * 1.6}"/></g>`;

/** A white cone joint from the filter tip P to the burning end Q (like abscarOperator's holk, plain). */
function cone(u: string, px: number, py: number, qx: number, qy: number, w1: number, w2: number): string {
	const dx = qx - px;
	const dy = qy - py;
	const L = Math.hypot(dx, dy);
	const ux = dx / L;
	const uy = dy / L;
	const pt = (t: number, off: number) => {
		const w = w1 + (w2 - w1) * t;
		return `${f(px + ux * L * t - (uy * off * w) / 2)} ${f(py + uy * L * t + (ux * off * w) / 2)}`;
	};
	const a = f((Math.atan2(dy, dx) * 180) / Math.PI);
	return `<path d="M${pt(0, 1)} L${pt(1, 1)} L${pt(1, -1)} L${pt(0, -1)} Z" fill="#f3efe4" stroke="#b9b09a" stroke-width="0.45" stroke-linejoin="round"/>
	<path d="M${pt(0, 1)} L${pt(0.2, 1)} L${pt(0.2, -1)} L${pt(0, -1)} Z" fill="#cdb98f"/>
	<path d="M${pt(0.32, 0.45)} L${pt(0.9, 0.45)}" stroke="#d6cfbb" stroke-width="0.5" stroke-linecap="round"/>
	<ellipse cx="${f(qx)}" cy="${f(qy)}" rx="${f(w2 * 0.22)}" ry="${f(w2 / 2)}" transform="rotate(${a} ${f(qx)} ${f(qy)})" fill="#7a7672"/>
	${ember(u, qx + ux * 0.7, qy + uy * 0.7, w2 * 0.3)}`;
}

/* ---------- in the mouth ---------- */

/** The mouth item's frame: tip at the mouth, +x along the item (mirrored for dir −1), sloping down `deg`. */
const frame = (m: Mouth) => `translate(${m.x} ${m.y}) scale(${m.dir} 1) rotate(${m.deg}) scale(${m.k})`;
/** A point of that frame in the emblem's box. */
function toBox(m: Mouth, lx: number, ly: number): P {
	const a = (m.deg * Math.PI) / 180;
	const rx = (lx * Math.cos(a) - ly * Math.sin(a)) * m.k;
	const ry = (lx * Math.sin(a) + ly * Math.cos(a)) * m.k;
	return [f(m.x + m.dir * rx), f(m.y + ry)];
}

/** A blunt in the frame: a long brown roll with spiral wrap lines, ash and an ember at the end. */
function bluntBody(u: string, len: number, w: number): string {
	const h0 = w * 0.46;
	const h1 = w * 0.54;
	const wraps: string[] = [];
	for (let x = 2.4; x < len - 1.6; x += 2.3) wraps.push(`M${f(x)} ${f(-h0 - ((h1 - h0) * x) / len)} L${f(x + 1.7)} ${f(h0 + ((h1 - h0) * (x + 1.7)) / len)}`);
	return `<linearGradient id="${u}-bl" gradientUnits="userSpaceOnUse" x1="0" y1="${f(-h1)}" x2="0" y2="${f(h1)}"><stop offset="0" stop-color="#3e2410"/><stop offset="0.3" stop-color="#8a5a2c"/><stop offset="0.45" stop-color="#b98447"/><stop offset="0.75" stop-color="#6a4220"/><stop offset="1" stop-color="#2a1608"/></linearGradient>
	<path d="M0 ${f(-h0)} L${f(len)} ${f(-h1)} L${f(len)} ${f(h1)} L0 ${f(h0)} Q-0.55 0 0 ${f(-h0)} Z" fill="url(#${u}-bl)" stroke="#24130a" stroke-width="0.45" stroke-linejoin="round"/>
	<path d="${wraps.join(' ')}" stroke="#2e1a0a" stroke-opacity="0.55" stroke-width="0.35" fill="none"/>
	<path d="M0 ${f(-h0)} L1.7 ${f(-h0)} L1.7 ${f(h0)} L0 ${f(h0)} Z" fill="#9a6838" opacity="0.8"/>
	<path d="M2.4 ${f(-h0 * 0.45)} L${f(len - 2)} ${f(-h1 * 0.45)}" stroke="#e0b070" stroke-opacity="0.45" stroke-width="0.4" stroke-linecap="round"/>
	<ellipse cx="${f(len)}" cy="0" rx="${f(w * 0.28)}" ry="${f(h1)}" fill="#8a8580"/>
	${ember(u, len + w * 0.24, 0, h1 * 0.72)}`;
}

/** Smoke rings rising from (x, y), for Cloud Nine (tinted like the smoke). */
const rings = (x: number, y: number) =>
	`<g transform="translate(${f(x)} ${f(y)})">${[0, 1.3, 2.6].map((d) => `<ellipse class="fg-ring" cx="0" cy="0" rx="2.6" ry="1.15" style="animation-delay:-${d}s"/>`).join('')}</g>`;

export interface MouthItem {
	markup: string;
	/** where the smoke leaves it (the emblem draws its own smoke column there) */
	end: P;
	/** how much bigger the smoke gets (Cloud Nine) */
	boost: number;
}

/**
 * Something in the mouth from the 420 pack, drawn at the face's mouth; null for nothing, the Golden Holk
 * (each emblem draws that itself) or an id this page doesn't know.
 */
export function mouthItem(u: string, id: string | null | undefined, m: Mouth): MouthItem | null {
	const v = `${u}-fgm`;
	if (id === 'mouth-blunt' || id === 'mouth-cloud9') {
		const big = id === 'mouth-cloud9';
		const len = big ? 22 : 20.5;
		const w = big ? 4.3 : 3.1;
		const end = toBox(m, len + w * 0.5, 0);
		return {
			markup: `<defs>${emberDefs(v)}</defs><g transform="${frame(m)}">${bluntBody(v, len, w)}</g>${big ? rings(end[0], end[1] - 2) : ''}`,
			end,
			boost: big ? 1.45 : 1
		};
	}
	if (id === 'mouth-pipe') {
		// a long churchwarden: thin wooden stem curving down, the bowl stays upright (turned back by `deg`)
		const piv: P = [17, 3.4];
		const pg = toBox(m, ...piv);
		const end: P = [f(pg[0] + m.dir * 2.6 * m.k), f(pg[1] - 7 * m.k)];
		return {
			markup: `<defs>${emberDefs(v)}<linearGradient id="${v}-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a240c"/><stop offset="0.45" stop-color="#b06a30"/><stop offset="1" stop-color="#3a1a08"/></linearGradient></defs>
			<g transform="${frame(m)}">
			<path d="M0 0 Q9 0.5 17.4 3.4" fill="none" stroke="#2a1608" stroke-width="1.8" stroke-linecap="round"/>
			<path d="M0 0 Q9 0.5 17.4 3.4" fill="none" stroke="#8a5428" stroke-width="0.8" stroke-linecap="round"/>
			<path d="M-0.4 -0.05 L2.6 0.1" stroke="#111" stroke-width="2" stroke-linecap="round"/>
			<g transform="rotate(${-m.deg} ${piv[0]} ${piv[1]})">
				<path d="M16.4 -2.8 L22.8 -2.8 L22.2 3.2 Q21.7 6.2 19.6 6.2 Q17.4 6.2 17 3.2 Z" fill="url(#${v}-wood)" stroke="#1e0f05" stroke-width="0.5" stroke-linejoin="round"/>
				<path d="M17.6 -1.6 V3.4" stroke="#e0a060" stroke-opacity="0.45" stroke-width="0.5" stroke-linecap="round"/>
				<ellipse cx="19.6" cy="-2.8" rx="3.2" ry="0.9" fill="#1e0f05"/>
				<ellipse cx="19.6" cy="-2.85" rx="2.1" ry="0.5" fill="#ff7a1a"/>
				<circle class="op-ember-glow" cx="19.6" cy="-3" r="3.6" fill="url(#${v}-em)"/>
			</g>
			</g>`,
			end,
			boost: 1
		};
	}
	if (id === 'mouth-double') {
		// two holks from the same corner of the mouth, one tipped up, one down
		const a = [18.6, -3.9];
		const b = [16.2, 5.3];
		return {
			markup: `<defs>${emberDefs(v)}</defs><g transform="${frame(m)}">${cone(v, 0, 0.5, b[0], b[1], 2, 6.2)}${cone(v, 0, -0.5, a[0], a[1], 2, 6.6)}</g>`,
			end: toBox(m, a[0] + 0.9, a[1] - 0.6),
			boost: 1.15
		};
	}
	if (id === 'mouth-bong') {
		// a glass bong upright under the mouth (never tilted), the bowl on the item side; never past y 66
		const kb = f(Math.min(m.k, (66 - m.y) / 24), 3);
		const t = `translate(${m.x} ${m.y}) scale(${f(m.dir * kb, 3)} ${kb})`;
		const FLASK = 'M-2 14 C-2 16 -6.4 17.4 -6.4 20.4 C-6.4 23 -3.6 24 0 24 C3.6 24 6.4 23 6.4 20.4 C6.4 17.4 2 16 2 14 Z';
		return {
			markup: `<defs>${emberDefs(v)}
			<linearGradient id="${v}-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8fbff" stop-opacity="0.7"/><stop offset="0.5" stop-color="#a8dcea" stop-opacity="0.32"/><stop offset="1" stop-color="#d8f4fb" stop-opacity="0.62"/></linearGradient>
			<linearGradient id="${v}-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8af0a8" stop-opacity="0.85"/><stop offset="1" stop-color="#1f8a4c" stop-opacity="0.9"/></linearGradient>
			<clipPath id="${v}-flask"><path d="${FLASK}"/></clipPath></defs>
			<g transform="${t}">
			<path d="M2.6 20.6 L8.3 12.8" stroke="#6fb8cc" stroke-width="1.7" stroke-linecap="round"/>
			<path d="M2.6 20.6 L8.3 12.8" stroke="#e2f7fc" stroke-width="0.7" stroke-linecap="round"/>
			<path d="M6.4 10.6 L10.6 10.6 L9.4 13.6 Q8.5 14.4 7.6 13.6 Z" fill="#9ad6e4" stroke="#3f7f92" stroke-width="0.45" stroke-linejoin="round"/>
			<ellipse cx="8.5" cy="10.6" rx="2.1" ry="0.6" fill="#3a2a1a"/>
			<ellipse cx="8.5" cy="10.55" rx="1.4" ry="0.38" fill="#ff7a1a"/>
			<circle class="op-ember-glow" cx="8.5" cy="10.3" r="2.8" fill="url(#${v}-em)"/>
			<path d="M-2 0.6 L-2 14 L2 14 L2 0.6 Z" fill="url(#${v}-glass)" stroke="#5fa8bc" stroke-width="0.5"/>
			<rect class="fg-bong-smoke" x="-1.45" y="2.2" width="2.9" height="11.2" rx="1.2" fill="#ffffff" opacity="0.35"/>
			<path d="M-2 6.4 l1 0.6 M2 6.4 l-1 0.6" stroke="#5fa8bc" stroke-width="0.4"/>
			<path d="${FLASK}" fill="url(#${v}-glass)" stroke="#5fa8bc" stroke-width="0.55"/>
			<g clip-path="url(#${v}-flask)">
				<rect x="-7" y="18.6" width="14" height="6" fill="url(#${v}-water)"/>
				${[[-2.2, 23, 0.55, 0], [0.9, 23.2, 0.45, 0.6], [3, 22.6, 0.6, 1.2]].map(([x, y, r, d]) => `<circle class="fg-bubble" cx="${x}" cy="${y}" r="${r}" fill="#e8fff0" style="animation-delay:-${d}s"/>`).join('')}
			</g>
			<path d="M-5.6 18.7 Q0 19.7 5.6 18.7" fill="none" stroke="#c8ffd8" stroke-width="0.45"/>
			${leaf(-0.1, 23.4, 0.2, 0, '#2fa23e', '#0f3a14', 1)}
			<rect x="-2.7" y="-1.2" width="5.4" height="2" rx="0.9" fill="#d8f4fb" fill-opacity="0.9" stroke="#3f8aa0" stroke-width="0.45"/>
			<path d="M-1.2 2 V12.6 M-4.6 18.4 Q-5.4 20.4 -4.4 22.4" stroke="#ffffff" stroke-width="0.5" stroke-linecap="round" opacity="0.7" fill="none"/>
			</g>`,
			end: [f(m.x + m.dir * 8.5 * kb), f(m.y + 9.8 * kb)],
			// a small column from the bowl: a big one would cover the face right above it
			boost: 0.55
		};
	}
	return null;
}

/** Where a smoke colour without anything in the mouth puffs out (beside the mouth corner). */
export const exhaleAt = (face: Face): P => face.puff ?? [f(face.mouth.x + face.mouth.dir * 6), f(face.mouth.y + 1)];

/** Where a friend's Clown Nose goes on an emblem (between the eyes, a little lower), in its 64-unit coordinates (OpGear). */
export const noseOf = (key: FaceKey): readonly [number, number] => {
	const face = FACES[key];
	const e = face.eyes;
	// no eyes to go by: just above the mouth
	if (!e) return [f(face.head.x), f(face.mouth.y - 6)];
	return [f((e.l[0] + e.r[0]) / 2), f(e.l[1] + e.rad * 1.6)];
};
/** How big that puff is (small: it would cover the face). */
export const EXHALE_K = 0.32;

/* ---------- eyes ---------- */

/** Glasses, eyes or lasers from the 420 pack over the face's eyes; '' for nothing or no eyes. */
export function eyesItem(u: string, id: string | null | undefined, e: Face['eyes']): string {
	if (!e || !id) return '';
	if (id.startsWith('k-')) return karmaEyes(u, id, e);
	const v = `${u}-fge`;
	const R = e.rad;
	const [[lx, ly], [rx, ry]] = [e.l, e.r];
	const sw = f(R * 0.13);
	if (id === 'eyes-shades') {
		// black wraparound shades: flat top bar, rounded bottoms, a glint on each lens
		const lens = ([cx, cy]: P) =>
			`M${f(cx - 1.25 * R)} ${f(cy - 0.72 * R)} H${f(cx + 1.25 * R)} Q${f(cx + 1.32 * R)} ${f(cy + 0.5 * R)} ${f(cx + 0.55 * R)} ${f(cy + 0.92 * R)} H${f(cx - 0.55 * R)} Q${f(cx - 1.32 * R)} ${f(cy + 0.5 * R)} ${f(cx - 1.25 * R)} ${f(cy - 0.72 * R)} Z`;
		const glint = ([cx, cy]: P) => `M${f(cx - 0.85 * R)} ${f(cy - 0.2 * R)} L${f(cx - 0.15 * R)} ${f(cy - 0.5 * R)}`;
		return `<defs><linearGradient id="${v}-sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#454b55"/><stop offset="0.5" stop-color="#14161a"/><stop offset="1" stop-color="#050607"/></linearGradient></defs>
		<path d="M${f(lx - 1.25 * R)} ${f(ly - 0.6 * R)} L${f(lx - 1.75 * R)} ${f(ly - 0.35 * R)} M${f(rx + 1.25 * R)} ${f(ry - 0.6 * R)} L${f(rx + 1.75 * R)} ${f(ry - 0.35 * R)}" stroke="#0a0b0d" stroke-width="${f(R * 0.22)}" stroke-linecap="round"/>
		<path d="${lens(e.l)} ${lens(e.r)}" fill="url(#${v}-sh)" stroke="#000" stroke-width="${sw}" stroke-linejoin="round"/>
		<path d="M${f(lx - 1.3 * R)} ${f(ly - 0.72 * R)} H${f(rx + 1.3 * R)}" stroke="#0a0b0d" stroke-width="${f(R * 0.26)}" stroke-linecap="round"/>
		<path d="${glint(e.l)} ${glint(e.r)}" stroke="#ffffff" stroke-width="${f(R * 0.14)}" stroke-linecap="round" opacity="0.75"/>`;
	}
	if (id === 'eyes-rasta') {
		// round lenses in red, gold and green bands, a thin gold frame and bridge
		const r0 = f(R * 1.04);
		return `<defs><linearGradient id="${v}-ra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8343a"/><stop offset="0.33" stop-color="#e8343a"/><stop offset="0.33" stop-color="#ffd23a"/><stop offset="0.66" stop-color="#ffd23a"/><stop offset="0.66" stop-color="#2fb84a"/><stop offset="1" stop-color="#2fb84a"/></linearGradient></defs>
		<path d="M${f(lx - r0)} ${f(ly - 0.1 * R)} L${f(lx - 1.6 * R)} ${f(ly - 0.3 * R)} M${f(rx + r0)} ${f(ry - 0.1 * R)} L${f(rx + 1.6 * R)} ${f(ry - 0.3 * R)}" stroke="#c9961e" stroke-width="${f(R * 0.18)}" stroke-linecap="round"/>
		<path d="M${f(lx + r0 * 0.92)} ${f(ly - 0.25 * R)} Q${f((lx + rx) / 2)} ${f(ly - 0.85 * R)} ${f(rx - r0 * 0.92)} ${f(ry - 0.25 * R)}" fill="none" stroke="#c9961e" stroke-width="${f(R * 0.18)}"/>
		${[e.l, e.r].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="${r0}" fill="url(#${v}-ra)" fill-opacity="0.93" stroke="#d6a92a" stroke-width="${f(R * 0.17)}"/><path d="M${f(cx - 0.6 * R)} ${f(cy - 0.35 * R)} Q${f(cx - 0.3 * R)} ${f(cy - 0.75 * R)} ${f(cx + 0.15 * R)} ${f(cy - 0.7 * R)}" fill="none" stroke="#ffffff" stroke-width="${f(R * 0.14)}" stroke-linecap="round" opacity="0.8"/>`).join('')}`;
	}
	if (id === 'eyes-baked') {
		// heavy half-shut lids with a red rim and a red glow under them; they droop a little now and then
		const lid = ([cx, cy]: P) =>
			`M${f(cx - 1.22 * R)} ${f(cy + 0.12 * R)} C${f(cx - 1.22 * R)} ${f(cy - 1.15 * R)} ${f(cx + 1.22 * R)} ${f(cy - 1.15 * R)} ${f(cx + 1.22 * R)} ${f(cy + 0.12 * R)} Q${f(cx)} ${f(cy + 0.42 * R)} ${f(cx - 1.22 * R)} ${f(cy + 0.12 * R)} Z`;
		const rim = ([cx, cy]: P) => `M${f(cx - 1.1 * R)} ${f(cy + 0.22 * R)} Q${f(cx)} ${f(cy + 0.55 * R)} ${f(cx + 1.1 * R)} ${f(cy + 0.22 * R)}`;
		return `<defs><radialGradient id="${v}-red"><stop offset="0" stop-color="#ff2a3a" stop-opacity="0.75"/><stop offset="1" stop-color="#ff2a3a" stop-opacity="0"/></radialGradient>
		<linearGradient id="${v}-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a3a34"/><stop offset="1" stop-color="#3a1712"/></linearGradient></defs>
		${[e.l, e.r].map(([cx, cy]) => `<ellipse cx="${cx}" cy="${f(cy + 0.3 * R)}" rx="${f(1.45 * R)}" ry="${f(1.05 * R)}" fill="url(#${v}-red)"/>`).join('')}
		<g class="fg-lid"><path d="${lid(e.l)} ${lid(e.r)}" fill="url(#${v}-lid)" stroke="#1a0608" stroke-width="${sw}" stroke-linejoin="round"/>
		<path d="${rim(e.l)} ${rim(e.r)}" fill="none" stroke="#ff4a4a" stroke-width="${f(R * 0.14)}" stroke-linecap="round" opacity="0.9"/></g>`;
	}
	if (id === 'eyes-laser') {
		// green laser flares: a white-hot core, a glow, long thin streaks across and a short one up and down
		return `<defs><radialGradient id="${v}-lz"><stop offset="0" stop-color="#d8ffc0" stop-opacity="1"/><stop offset="0.35" stop-color="#6dff3a" stop-opacity="0.85"/><stop offset="1" stop-color="#2aff1a" stop-opacity="0"/></radialGradient></defs>
		${[e.l, e.r].map(([cx, cy], i) => `<g class="fg-laser" style="animation-delay:-${i * 0.35}s"><circle cx="${cx}" cy="${cy}" r="${f(1.9 * R)}" fill="url(#${v}-lz)"/><ellipse cx="${cx}" cy="${cy}" rx="${f(3.3 * R)}" ry="${f(0.15 * R)}" fill="#e6ffd8"/><ellipse cx="${cx}" cy="${cy}" rx="${f(0.13 * R)}" ry="${f(1.5 * R)}" fill="#e6ffd8" opacity="0.85"/><circle cx="${cx}" cy="${cy}" r="${f(0.45 * R)}" fill="#ffffff"/></g>`).join('')}`;
	}
	return '';
}

/* ---------- hats ---------- */

/** A hat from the 420 pack on the face's head; '' for nothing. */
export function hatItem(u: string, id: string | null | undefined, h: Face['head']): string {
	if (!id) return '';
	if (id.startsWith('k-')) return karmaHat(u, id, h);
	const v = `${u}-fgh`;
	const { x, y, w } = h;
	const hw = w / 2;
	const sw = f(w * 0.022);
	if (id === 'hat-rasta') {
		// a knitted beanie: green, gold and red bands, ribbed black cuff with a leaf on it
		const DOME = `M${f(x - hw)} ${f(y + 0.16 * w)} C${f(x - hw)} ${f(y - 0.24 * w)} ${f(x - 0.5 * hw)} ${f(y - 0.38 * w)} ${f(x)} ${f(y - 0.38 * w)} C${f(x + 0.5 * hw)} ${f(y - 0.38 * w)} ${f(x + hw)} ${f(y - 0.24 * w)} ${f(x + hw)} ${f(y + 0.16 * w)} Z`;
		const ribs: string[] = [];
		for (let i = -4; i <= 4; i++) ribs.push(`M${f(x + (i * w) / 9.5)} ${f(y - 0.4 * w)} V${f(y + 0.2 * w)}`);
		const cuffRibs: string[] = [];
		for (let i = -9; i <= 9; i++) cuffRibs.push(`M${f(x + (i * w) / 18)} ${f(y + 0.1 * w)} V${f(y + 0.26 * w)}`);
		return `<defs><clipPath id="${v}-dome"><path d="${DOME}"/></clipPath></defs>
		<path d="${DOME}" fill="#2fb84a"/>
		<g clip-path="url(#${v}-dome)">
			<rect x="${f(x - hw - 1)}" y="${f(y - 0.45 * w)}" width="${f(w + 2)}" height="${f(0.25 * w)}" fill="#e8343a"/>
			<rect x="${f(x - hw - 1)}" y="${f(y - 0.2 * w)}" width="${f(w + 2)}" height="${f(0.15 * w)}" fill="#ffd23a"/>
			<path d="${ribs.join(' ')}" stroke="#000" stroke-opacity="0.2" stroke-width="${f(w * 0.014)}"/>
			<ellipse cx="${f(x - 0.4 * hw)}" cy="${f(y - 0.26 * w)}" rx="${f(0.22 * hw)}" ry="${f(0.05 * w)}" fill="#fff" opacity="0.3"/>
		</g>
		<path d="${DOME}" fill="none" stroke="#1a0f05" stroke-width="${sw}"/>
		<rect x="${f(x - 1.06 * hw)}" y="${f(y + 0.08 * w)}" width="${f(2.12 * hw)}" height="${f(0.2 * w)}" rx="${f(0.07 * w)}" fill="#1c1c1c" stroke="#000" stroke-width="${sw}"/>
		<path d="${cuffRibs.join(' ')}" stroke="#3c3c3c" stroke-width="${f(w * 0.016)}"/>
		${leaf(x, y + 0.255 * w, (w * 0.17) / 14, 0, '#3fd34a', '#0f3a14', 0.9)}`;
	}
	if (id === 'hat-bucket') {
		// a tie-dye bucket hat: swirled rainbow rings, a stitched band, a drooping brim
		const CROWN = `M${f(x - 0.78 * hw)} ${f(y + 0.14 * w)} C${f(x - 0.8 * hw)} ${f(y - 0.24 * w)} ${f(x - 0.42 * hw)} ${f(y - 0.33 * w)} ${f(x)} ${f(y - 0.33 * w)} C${f(x + 0.42 * hw)} ${f(y - 0.33 * w)} ${f(x + 0.8 * hw)} ${f(y - 0.24 * w)} ${f(x + 0.78 * hw)} ${f(y + 0.14 * w)} Z`;
		const BRIM = `M${f(x - 1.24 * hw)} ${f(y + 0.24 * w)} Q${f(x)} ${f(y + 0.02 * w)} ${f(x + 1.24 * hw)} ${f(y + 0.24 * w)} Q${f(x + 1.1 * hw)} ${f(y + 0.36 * w)} ${f(x)} ${f(y + 0.34 * w)} Q${f(x - 1.1 * hw)} ${f(y + 0.36 * w)} ${f(x - 1.24 * hw)} ${f(y + 0.24 * w)} Z`;
		return `<defs><radialGradient id="${v}-tie" gradientUnits="userSpaceOnUse" cx="${f(x + 0.18 * w)}" cy="${f(y - 0.08 * w)}" r="${f(w * 0.2)}" spreadMethod="repeat"><stop offset="0" stop-color="#ff4fa0"/><stop offset="0.25" stop-color="#ffd23a"/><stop offset="0.5" stop-color="#3fe0ff"/><stop offset="0.75" stop-color="#9b5cff"/><stop offset="1" stop-color="#ff4fa0"/></radialGradient></defs>
		<path d="${BRIM}" fill="url(#${v}-tie)" stroke="#24123a" stroke-width="${sw}" stroke-linejoin="round"/>
		<path d="${CROWN}" fill="url(#${v}-tie)" stroke="#24123a" stroke-width="${sw}" stroke-linejoin="round"/>
		<path d="M${f(x - 0.79 * hw)} ${f(y + 0.05 * w)} Q${f(x)} ${f(y - 0.02 * w)} ${f(x + 0.79 * hw)} ${f(y + 0.05 * w)}" fill="none" stroke="#24123a" stroke-width="${f(w * 0.018)}" stroke-dasharray="${f(w * 0.03)} ${f(w * 0.02)}"/>
		<ellipse cx="${f(x - 0.35 * hw)}" cy="${f(y - 0.22 * w)}" rx="${f(0.2 * hw)}" ry="${f(0.045 * w)}" fill="#fff" opacity="0.35"/>`;
	}
	if (id === 'hat-propeller') {
		// a four-colour beanie cap with a little visor and a propeller that spins
		const DOME = `M${f(x - 0.92 * hw)} ${f(y + 0.17 * w)} C${f(x - 0.92 * hw)} ${f(y - 0.2 * w)} ${f(x - 0.46 * hw)} ${f(y - 0.3 * w)} ${f(x)} ${f(y - 0.3 * w)} C${f(x + 0.46 * hw)} ${f(y - 0.3 * w)} ${f(x + 0.92 * hw)} ${f(y - 0.2 * w)} ${f(x + 0.92 * hw)} ${f(y + 0.17 * w)} Z`;
		const cols = ['#e8343a', '#ffd23a', '#2f7fe0', '#2fb84a'];
		const top = y - 0.3 * w;
		const py = top - 0.13 * w;
		return `<defs><clipPath id="${v}-cap"><path d="${DOME}"/></clipPath></defs>
		<g clip-path="url(#${v}-cap)">${cols.map((c, i) => `<rect x="${f(x - 0.92 * hw + (i * 0.92 * hw) / 2)}" y="${f(top - 1)}" width="${f((0.92 * hw) / 2 + 0.3)}" height="${f(0.5 * w)}" fill="${c}"/>`).join('')}
			<ellipse cx="${f(x - 0.38 * hw)}" cy="${f(y - 0.2 * w)}" rx="${f(0.2 * hw)}" ry="${f(0.05 * w)}" fill="#fff" opacity="0.35"/></g>
		<path d="${DOME}" fill="none" stroke="#14141a" stroke-width="${sw}"/>
		<path d="M${f(x - 0.62 * hw)} ${f(y + 0.15 * w)} Q${f(x)} ${f(y + 0.34 * w)} ${f(x + 0.62 * hw)} ${f(y + 0.15 * w)} Q${f(x)} ${f(y + 0.21 * w)} ${f(x - 0.62 * hw)} ${f(y + 0.15 * w)} Z" fill="#b8222a" stroke="#14141a" stroke-width="${sw}" stroke-linejoin="round"/>
		<path d="M${f(x)} ${f(top)} V${f(py)}" stroke="#8a929c" stroke-width="${f(w * 0.03)}" stroke-linecap="round"/>
		<g class="fg-prop"><ellipse cx="${f(x - 0.17 * w)}" cy="${f(py)}" rx="${f(0.17 * w)}" ry="${f(0.042 * w)}" fill="#ff3a3a" stroke="#14141a" stroke-width="${f(sw * 0.7)}"/><ellipse cx="${f(x + 0.17 * w)}" cy="${f(py)}" rx="${f(0.17 * w)}" ry="${f(0.042 * w)}" fill="#3a8aff" stroke="#14141a" stroke-width="${f(sw * 0.7)}"/></g>
		<circle cx="${f(x)}" cy="${f(py)}" r="${f(w * 0.035)}" fill="#ffd23a" stroke="#14141a" stroke-width="${f(sw * 0.6)}"/>`;
	}
	if (id === 'hat-leafcrown') {
		// a crown of cannabis leaves on a gold band, with gems and a twinkle or two
		const cx = x;
		const cy = y + 0.5 * w;
		const r = 0.55 * w;
		const s = (w * 0.36) / 24;
		const leaves = [-62, -41, -20, 0, 20, 41, 62]
			.map((a, i) => {
				const rad = (a * Math.PI) / 180;
				const k = s * (1 - Math.abs(a) / 210);
				// light lime, so the crown still shows on Abscar's green ghillie
				return leaf(cx + r * Math.sin(rad), cy - r * Math.cos(rad), k, a, i % 2 ? '#a6ec5a' : '#d4f77c', '#1f4a0c', 0.45);
			})
			.join('');
		const tw = (tx: number, ty: number, tr: number, d: number) =>
			`<path class="fg-twinkle" style="animation-delay:-${d}s" d="M${f(tx)} ${f(ty - tr)} L${f(tx + tr * 0.28)} ${f(ty - tr * 0.28)} L${f(tx + tr)} ${f(ty)} L${f(tx + tr * 0.28)} ${f(ty + tr * 0.28)} L${f(tx)} ${f(ty + tr)} L${f(tx - tr * 0.28)} ${f(ty + tr * 0.28)} L${f(tx - tr)} ${f(ty)} L${f(tx - tr * 0.28)} ${f(ty - tr * 0.28)} Z" fill="#fffbe0"/>`;
		return `<defs><linearGradient id="${v}-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4b0"/><stop offset="0.5" stop-color="#e0a520"/><stop offset="1" stop-color="#7a5208"/></linearGradient></defs>
		${leaves}
		<path d="M${f(x - 0.98 * hw)} ${f(y + 0.2 * w)} Q${f(x)} ${f(y + 0.03 * w)} ${f(x + 0.98 * hw)} ${f(y + 0.2 * w)}" fill="none" stroke="#5a3a06" stroke-width="${f(w * 0.085)}" stroke-linecap="round"/>
		<path d="M${f(x - 0.98 * hw)} ${f(y + 0.2 * w)} Q${f(x)} ${f(y + 0.03 * w)} ${f(x + 0.98 * hw)} ${f(y + 0.2 * w)}" fill="none" stroke="url(#${v}-gold)" stroke-width="${f(w * 0.06)}" stroke-linecap="round"/>
		${[-0.5, 0, 0.5].map((t) => `<circle cx="${f(x + t * hw)}" cy="${f(y + 0.115 * w + Math.abs(t) * 0.06 * w)}" r="${f(w * 0.028)}" fill="${t ? '#2fd36a' : '#e8343a'}" stroke="#5a3a06" stroke-width="${f(w * 0.01)}"/>`).join('')}
		${tw(x + 0.08 * w, y - 0.2 * w, w * 0.05, 0)}${tw(x - 0.36 * w, y - 0.02 * w, w * 0.04, 1.1)}`;
	}
	if (id === 'hat-santa') {
		// a floppy red Santa hat: the point droops over to the right, white fur band, a fluffy pom-pom at the tip
		const P = (a: number, b: number) => `${f(x + a * hw)} ${f(y + b * w)}`;
		const CROWN = `M${P(-0.95, 0.14)} C${P(-0.96, -0.3)} ${P(0.05, -0.5)} ${P(0.55, -0.4)} C${P(1.0, -0.3)} ${P(1.28, -0.08)} ${P(1.3, 0.12)} L${P(1.14, 0.1)} C${P(1.08, -0.06)} ${P(0.95, -0.13)} ${P(0.8, -0.12)} C${P(0.9, -0.02)} ${P(0.95, 0.06)} ${P(0.95, 0.14)} Z`;
		// the band: a fat rounded strip with bumps along both edges, like fur
		const bumps: string[] = [];
		for (let i = 0; i <= 8; i++) {
			const bx = -1.04 + (i * 2.08) / 8;
			bumps.push(`<circle cx="${f(x + bx * hw)}" cy="${f(y + (i % 2 ? 0.075 : 0.095) * w)}" r="${f(w * 0.05)}"/>`);
			bumps.push(`<circle cx="${f(x + bx * hw)}" cy="${f(y + (i % 2 ? 0.27 : 0.255) * w)}" r="${f(w * 0.045)}"/>`);
		}
		const pom = [x + 1.3 * hw, y + 0.17 * w];
		return `<defs><linearGradient id="${v}-red" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5a5a"/><stop offset="0.5" stop-color="#d8192a"/><stop offset="1" stop-color="#8a0612"/></linearGradient>
		<radialGradient id="${v}-fur" cx="0.38" cy="0.32" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#eef2f4"/><stop offset="1" stop-color="#b9c4cc"/></radialGradient></defs>
		<path d="${CROWN}" fill="url(#${v}-red)" stroke="#4a0208" stroke-width="${sw}" stroke-linejoin="round"/>
		<path d="M${P(0.55, -0.37)} C${P(0.9, -0.28)} ${P(1.1, -0.1)} ${P(1.18, 0.06)}" fill="none" stroke="#5a0410" stroke-opacity="0.45" stroke-width="${f(w * 0.02)}" stroke-linecap="round"/>
		<path d="M${P(-0.62, -0.06)} C${P(-0.55, -0.26)} ${P(-0.2, -0.38)} ${P(0.15, -0.38)}" fill="none" stroke="#ffffff" stroke-opacity="0.4" stroke-width="${f(w * 0.03)}" stroke-linecap="round"/>
		<g fill="url(#${v}-fur)" stroke="#9aa6ae" stroke-width="${f(w * 0.012)}">${bumps.join('')}
		<rect x="${f(x - 1.06 * hw)}" y="${f(y + 0.08 * w)}" width="${f(2.12 * hw)}" height="${f(0.18 * w)}" rx="${f(0.09 * w)}" stroke="none"/></g>
		<circle cx="${f(pom[0])}" cy="${f(pom[1])}" r="${f(w * 0.11)}" fill="url(#${v}-fur)" stroke="#9aa6ae" stroke-width="${f(w * 0.014)}"/>
		<circle cx="${f(pom[0] - w * 0.035)}" cy="${f(pom[1] - w * 0.035)}" r="${f(w * 0.03)}" fill="#ffffff"/>`;
	}
	return '';
}
