/**
 * Small camo pictures for the weapon card (2026-11-11, the user's ask: "instead of the tick boxes,
 * just show a picture of the camo you unlock and its challenge; find out what the 3 before-Gold
 * camos look like on every weapon and draw them").
 * Our own procedural SVG drawings in each camo's style, NOT the game's textures: every camo is
 * described in data/specialLooks.ts as a pattern family + its colours (picked from reference
 * pictures on mw4camos.com and codmunity.gg), and drawn here. Same camo = same picture every time
 * (the random numbers are seeded by the camo's name). Pure: Node runs it in the tests.
 * Drawn in a 100 × 100 box; the card shows it at about 60 px.
 * Since 2026-11-16 also the Extra camos tab's pictures (data/extraLooks.ts), which added the
 * `diamonds`, `specks` and `overlay` looks, equal-sided triangles (`trigrid` + `iso`) and seven motifs.
 */

export type Layer = [color: string, count: number, size: number];

export type Look =
	/** a single colour with a soft sheen (`metal`: brushed lines, like codmunity's renders) */
	| { k: 'solid'; c: string; metal?: boolean }
	/** woodland-style blobs in layers; `sx` stretches them sideways, `blur` softens, `rim` outlines */
	| { k: 'blobs'; z?: number; bg: string; layers: Layer[]; sx?: number; blur?: number; rim?: string; angular?: boolean; hatch?: string; dashes?: string[] }
	/** tiger stripes / streaks at an angle */
	| { k: 'stripes'; z?: number; bg: string; layers: Layer[]; angle: number; len?: number; jitter?: number; smooth?: boolean }
	/** digital pixels in clusters; layer = [colour, share of cells 0–1, cluster size] */
	| { k: 'pixels'; bg: string; layers: Layer[]; cell: number; sx?: number; round?: boolean }
	/** random triangles / shards */
	| { k: 'shards'; z?: number; bg: string; colors: string[]; n: number; size?: number; rim?: string; glow?: string }
	/**
	 * a grid of squares split into triangles; `iso` (2026-11-16, Neutral Ground) = equal-sided
	 * triangles in upright columns instead, with `line` drawn along every edge, `dots` on the corners
	 * and `blur` for a watercolour look
	 */
	| { k: 'trigrid'; colors: string[]; cell: number; iso?: boolean; line?: string; dots?: string; blur?: number }
	/** contour lines (topographic) */
	| { k: 'topo'; bg: string; line: string; width?: number; glow?: boolean; fills?: string[]; dense?: boolean }
	/** wavy bands across */
	| { k: 'waves'; bg: string; colors: string[]; n: number; amp: number; angle?: number; specks?: string }
	/** glowing energy strands: n thin wavy lines woven through a band across the middle (Pyroclast, 2026-11-15) */
	| { k: 'strands'; bg: string; colors: string[]; n: number; band: number; glow: string; falls?: string }
	/** paint splats with droplets */
	| { k: 'splats'; z?: number; bg: string; colors: string[]; n: number; size: number }
	/** small rounded spots (leopard / bean shapes), optionally with a dark rim */
	| { k: 'spots'; z?: number; bg: string; colors: string[]; n: number; size: number; rim?: string; rings?: string }
	/** reptile scales; `bands` adds diagonal bands over them */
	| { k: 'scales'; bg: string; c: string; hi: string; size: number; bands?: string[] }
	/** a colour gradient, with sprinkles or black slashes on top */
	| { k: 'gradient'; stops: string[]; angle: number; specks?: string[]; slashes?: string; squiggle?: string }
	/** a picture motif */
	| { k: 'motif'; m: Motif; bg: string; colors: string[]; blur?: boolean }
	/*
	 * Added 2026-11-16 for the Extra camos tab (data/extraLooks.ts):
	 * - diamonds: a grid of diamonds, harlequin when there are two colours; `shade` darkens each
	 *   diamond's middle, `emblem` puts little crowns in some, `seal` a laurel-and-crown seal in the middle
	 * - specks: fine specks gathered in a wavy band across the middle, over faint noise
	 * - overlay: another look with marks on top (a stencilled word, stickers, a row of dots, data lines)
	 */
	| { k: 'diamonds'; colors: string[]; size: number; rim: string; shade?: string; emblem?: string; seal?: string }
	| { k: 'specks'; bg: string; noise: string; colors: string[]; n: number; band: number; size: number }
	| { k: 'overlay'; base: Look; marks: Mark[] };

/** What an `overlay` look puts on top of its base. */
export type Mark =
	/** a word, on a sticker when `plate` is given; `hand` = handwriting instead of stencil letters */
	| { t: 'text'; s: string; x: number; y: number; size: number; c: string; rot?: number; plate?: string; hand?: boolean }
	/** a row of dots straight across */
	| { t: 'dots'; c: string; y: number; n: number; r: number }
	/** little groups of thin data lines */
	| { t: 'dashes'; c: string; n: number };

export type Motif =
	| 'flames'
	| 'palms'
	| 'planets'
	| 'galaxy'
	| 'lightning'
	| 'magma'
	| 'skulls'
	| 'plague'
	| 'oni'
	| 'stickers'
	| 'flowers'
	| 'wallpaper'
	| 'leaves'
	| 'treeline'
	| 'pine'
	| 'branches'
	| 'ferns'
	| 'chains'
	| 'grass'
	| 'web'
	| 'rods'
	| 'bark'
	| 'rind'
	| 'rocks'
	| 'mesh'
	| 'tectonic'
	// 2026-11-16, Extra camos tab
	| 'snakes'
	| 'phoenix'
	| 'zigzag'
	| 'pyro'
	| 'scroll'
	| 'kintsugi'
	| 'shields';

type Rnd = () => number;

/** small deterministic random generator (mulberry32) */
function rng(seed: number): Rnd {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** FNV-1a hash of a name, the seed of its picture */
export function seedOf(name: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x01000193) >>> 0;
	return h;
}

const f = (n: number) => (Math.round(n * 10) / 10).toString();
type P = [number, number];
const between = (r: Rnd, a: number, b: number) => a + (b - a) * r();
const pick = <T>(r: Rnd, list: readonly T[]): T => list[Math.floor(r() * list.length)];

/** zoom-out per family: the game's pictures show many small shapes, so ours are scaled down (count × z², size ÷ z) */
const Z = { blobs: 1.6, stripes: 1.35, shards: 1.35, splats: 1.8, spots: 1.5 };
const zc = (n: number, z: number) => Math.round(n * z * z);

/** a closed, smooth path through the points (Catmull-Rom as cubic Béziers) */
function smooth(pts: P[]): string {
	const n = pts.length;
	let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
	for (let i = 0; i < n; i++) {
		const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
		d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
	}
	return d + 'Z';
}
const poly = (pts: P[]) => 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') + 'Z';

/** an open, smooth line through the points (a snake's body) */
function openSmooth(pts: P[]): string {
	let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
		d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
	}
	return d;
}

/** a little crown, `w` wide, centred on (cx, cy) */
function crown(cx: number, cy: number, w: number, c: string): string {
	return `<path d="M${f(cx - w / 2)} ${f(cy + w * 0.28)}L${f(cx - w / 2)} ${f(cy - w * 0.22)}L${f(cx - w / 4)} ${f(cy + w * 0.02)}L${f(cx)} ${f(cy - w * 0.36)}L${f(cx + w / 4)} ${f(cy + w * 0.02)}L${f(cx + w / 2)} ${f(cy - w * 0.22)}L${f(cx + w / 2)} ${f(cy + w * 0.28)}Z" fill="${c}"/>`;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** a blob's outline points around (cx, cy) */
function blobPts(r: Rnd, cx: number, cy: number, rad: number, k = 8, jit = 0.38, sx = 1, sy = 1, rot = 0): P[] {
	const pts: P[] = [];
	for (let i = 0; i < k; i++) {
		const a = (i / k) * Math.PI * 2 + between(r, -0.25, 0.25);
		const rr = rad * (1 - jit + 2 * jit * r());
		const x = Math.cos(a) * rr * sx, y = Math.sin(a) * rr * sy;
		pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
	}
	return pts;
}

/** a tapered, ragged stripe (tiger stripe / brush stroke) */
function stripePts(r: Rnd, cx: number, cy: number, len: number, w: number, ang: number, jag = 0.5): P[] {
	const steps = 9, top: P[] = [], bot: P[] = [];
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const x = (t - 0.5) * len;
		const hw = (w / 2) * Math.pow(Math.sin(Math.PI * t), 0.8) * (1 - jag / 2 + jag * r());
		const bend = Math.sin(t * Math.PI * 2 + cx) * w * 0.25;
		top.push([x, bend - hw]);
		bot.push([x, bend + hw * (0.6 + 0.6 * r())]);
	}
	const c = Math.cos(ang), s = Math.sin(ang);
	return [...top, ...bot.reverse()].map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c] as P);
}

const rect = (fill: string) => `<rect width="100" height="100" fill="${fill}"/>`;
const blurDef = (id: string, sd: number) => `<defs><filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${sd}"/></filter></defs>`;

/* ---------------------------------------------------------------- pattern families */

function solid(look: Extract<Look, { k: 'solid' }>, r: Rnd, id: string): string {
	let s = rect(look.c);
	if (look.metal) {
		for (let i = 0; i < 70; i++) {
			const y = between(r, 0, 100), o = between(r, 0.04, 0.16);
			s += `<rect x="${f(between(r, -20, 80))}" y="${f(y)}" width="${f(between(r, 20, 90))}" height="0.6" fill="${r() < 0.5 ? '#fff' : '#000'}" opacity="${o.toFixed(2)}"/>`;
		}
	}
	s += `<defs><radialGradient id="${id}s" cx="0.3" cy="0.2" r="0.95"><stop offset="0" stop-color="#fff" stop-opacity="0.2"/><stop offset="0.55" stop-color="#fff" stop-opacity="0.03"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></radialGradient></defs><rect width="100" height="100" fill="url(#${id}s)"/>`;
	return s;
}

function blobs(look: Extract<Look, { k: 'blobs' }>, r: Rnd, id: string): string {
	let s = rect(look.bg);
	let body = '';
	const z = look.z ?? Z.blobs;
	for (const [c, n, size0] of look.layers) {
		let d = '';
		const size = size0 / z;
		for (let i = 0; i < zc(n, z); i++) {
			const cx = between(r, -8, 108), cy = between(r, -8, 108);
			const pts = blobPts(r, cx, cy, size * between(r, 0.6, 1.3), look.angular ? 6 : 8, look.angular ? 0.3 : 0.4, look.sx ?? 1, 1, look.sx ? between(r, -0.15, 0.15) : r() * 6);
			d += look.angular ? poly(pts) : smooth(pts);
		}
		body += `<path d="${d}" fill="${c}"${look.rim ? ` stroke="${look.rim}" stroke-width="${f(1.6 / z)}"` : ''}/>`;
	}
	s += look.blur ? `${blurDef(id + 'b', look.blur)}<g filter="url(#${id}b)">${body}</g>` : body;
	if (look.dashes) {
		for (let y = 1; y < 100; y += 4.5) {
			for (let x = between(r, 0, 3); x < 100; x += between(r, 2, 3.6)) {
				if (r() < 0.55) s += `<rect x="${f(x)}" y="${f(y)}" width="0.9" height="${f(between(r, 2, 3.4))}" fill="${pick(r, look.dashes)}" opacity="0.85"/>`;
			}
		}
	}
	if (look.hatch) {
		s += `<defs><pattern id="${id}h" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1" height="3" fill="${look.hatch}"/></pattern></defs><rect width="100" height="100" fill="url(#${id}h)" opacity="0.55"/>`;
	}
	return s;
}

function stripes(look: Extract<Look, { k: 'stripes' }>, r: Rnd): string {
	let s = rect(look.bg);
	const base = (look.angle * Math.PI) / 180;
	const z = look.z ?? Z.stripes;
	for (const [c, n, w0] of look.layers) {
		let d = '';
		const w = w0 / z;
		for (let i = 0; i < zc(n, z); i++) {
			const pts = stripePts(r, between(r, -10, 110), between(r, -10, 110), ((look.len ?? 46) / z) * between(r, 0.6, 1.25), w * between(r, 0.7, 1.3), base + (between(r, -1, 1) * (look.jitter ?? 8) * Math.PI) / 180);
			d += look.smooth ? smooth(pts) : poly(pts);
		}
		s += `<path d="${d}" fill="${c}"/>`;
	}
	return s;
}

function pixels(look: Extract<Look, { k: 'pixels' }>, r: Rnd): string {
	const cw = look.cell * (look.sx ?? 1), ch = look.cell;
	const cols = Math.ceil(100 / cw), rows = Math.ceil(100 / ch);
	let s = rect(look.bg);
	const taken = new Set<number>();
	for (const [c, share, cluster] of look.layers) {
		const want = Math.round(cols * rows * share);
		const cells: number[] = [];
		let guard = 0;
		while (cells.length < want && guard++ < 4000) {
			let x = Math.floor(r() * cols), y = Math.floor(r() * rows);
			const steps = Math.max(1, Math.round(cluster * between(r, 0.5, 1.5)));
			for (let k = 0; k < steps && cells.length < want; k++) {
				const key = y * cols + x;
				if (!taken.has(key)) {
					taken.add(key);
					cells.push(key);
				}
				if (r() < 0.5) x = (x + (r() < 0.5 ? 1 : cols - 1)) % cols;
				else y = (y + (r() < 0.5 ? 1 : rows - 1)) % rows;
			}
		}
		let d = '';
		for (const key of cells) {
			const x = (key % cols) * cw, y = Math.floor(key / cols) * ch;
			if (look.round) d += `M${f(x + cw / 2)} ${f(y + ch / 2)}m-${f(cw * 0.42)} 0a${f(cw * 0.42)} ${f(ch * 0.42)} 0 1 0 ${f(cw * 0.84)} 0a${f(cw * 0.42)} ${f(ch * 0.42)} 0 1 0 -${f(cw * 0.84)} 0`;
			else d += `M${f(x)} ${f(y)}h${f(cw)}v${f(ch)}h-${f(cw)}z`;
		}
		s += `<path d="${d}" fill="${c}"/>`;
	}
	return s;
}

function shards(look: Extract<Look, { k: 'shards' }>, r: Rnd, id: string): string {
	let s = rect(look.bg);
	let body = '';
	const z = look.z ?? Z.shards;
	const size = (look.size ?? 18) / z;
	for (let i = 0; i < zc(look.n, z); i++) {
		const cx = between(r, -5, 105), cy = between(r, -5, 105);
		const a0 = r() * Math.PI * 2;
		const pts: P[] = [0, 1, 2].map((k) => {
			const a = a0 + (k * Math.PI * 2) / 3 + between(r, -0.5, 0.5);
			const rad = size * between(r, 0.35, 1.1);
			return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
		});
		body += `<path d="${poly(pts)}" fill="${pick(r, look.colors)}"${look.rim ? ` stroke="${look.rim}" stroke-width="${f(2 / z)}" stroke-linejoin="round"` : ''}/>`;
	}
	if (look.glow) s += `${blurDef(id + 'g', 2.4)}<g filter="url(#${id}g)" opacity="0.7">${body.replace(/fill="[^"]+"/g, `fill="${look.glow}"`)}</g>`;
	return s + body;
}

function trigrid(look: Extract<Look, { k: 'trigrid' }>, r: Rnd, id: string): string {
	if (look.iso) return isoGrid(look, r, id);
	let s = '';
	const c = look.cell;
	for (let y = 0; y < 100; y += c) {
		for (let x = 0; x < 100; x += c) {
			const flip = r() < 0.5;
			const a: P[] = flip ? [[x, y], [x + c, y], [x, y + c]] : [[x, y], [x + c, y], [x + c, y + c]];
			const b: P[] = flip ? [[x + c, y], [x + c, y + c], [x, y + c]] : [[x, y], [x + c, y + c], [x, y + c]];
			s += `<path d="${poly(a)}" fill="${pick(r, look.colors)}"/><path d="${poly(b)}" fill="${pick(r, look.colors)}"/>`;
		}
	}
	return s;
}

/**
 * Equal-sided triangles (Neutral Ground). Drawn as rows pointing up / down, then turned a quarter
 * so the columns stand upright like the camo. Row k's corners sit at x = m·cell (+ cell/2 on odd rows).
 */
function isoGrid(look: Extract<Look, { k: 'trigrid' }>, r: Rnd, id: string): string {
	const c = look.cell, h = c * 0.866;
	const off = (k: number) => (Math.abs(k) % 2 ? c / 2 : 0);
	let fills = '', lines = '', dots = '';
	for (let k = -2; k * h < 100 + h; k++) {
		const y = k * h;
		for (let x = off(k + 1) - 2 * c; x < 100 + c; x += c) {
			fills += `<path d="${poly([[x, y + h], [x + c / 2, y], [x + c, y + h]])}" fill="${pick(r, look.colors)}"/>`;
			fills += `<path d="${poly([[x + c / 2, y], [x + c * 1.5, y], [x + c, y + h]])}" fill="${pick(r, look.colors)}"/>`;
		}
		lines += `M-20 ${f(y)}H120`;
		if (look.dots) for (let x = off(k) - c; x < 100 + c; x += c) dots += `<circle cx="${f(x)}" cy="${f(y)}" r="0.7"/>`;
	}
	// the slanted edges: lines through every corner of row 0, both ways
	const dx = (c / 2) * (160 / h), lead = (c / 2) * (30 / h);
	for (let x = -Math.ceil(160 / c) * c; x < 260; x += c) lines += `M${f(x - lead)} -30l${f(dx)} 160M${f(x + lead)} -30l${f(-dx)} 160`;
	let s = rect(look.colors[0]);
	s += look.blur ? `${blurDef(id + 'w', look.blur)}<g filter="url(#${id}w)">${fills}</g>` : fills;
	if (look.line) s += `<path d="${lines}" fill="none" stroke="${look.line}" stroke-width="0.55" opacity="0.85"/>`;
	if (dots) s += `<g fill="${look.dots}">${dots}</g>`;
	return `<g transform="rotate(90 50 50)">${s}</g>`;
}

function diamonds(look: Extract<Look, { k: 'diamonds' }>, r: Rnd, id: string): string {
	const sz = look.size, half = sz / 2, n = look.colors.length;
	let body = '', shade = '', rims = '', marks = '';
	for (let j = -2; j * half < 100 + sz; j++) {
		const cy = j * half;
		for (let cx = (Math.abs(j) % 2 ? half : 0) - sz; cx < 100 + sz; cx += sz) {
			const d = `M${f(cx)} ${f(cy - half)}L${f(cx + half)} ${f(cy)}L${f(cx)} ${f(cy + half)}L${f(cx - half)} ${f(cy)}Z`;
			// every neighbour is in the next row up or down, so colouring by row gives a harlequin
			body += `<path d="${d}" fill="${look.colors[((j % n) + n) % n]}"/>`;
			if (look.shade) shade += `<path d="${d}" fill="url(#${id}d)"/>`;
			rims += d;
			if (look.emblem && r() < 0.55) marks += crown(cx, cy + sz * 0.04, sz * 0.36, look.emblem);
		}
	}
	let s = body;
	if (look.shade) s += `<defs><radialGradient id="${id}d"><stop offset="0" stop-color="${look.shade}" stop-opacity="0.9"/><stop offset="0.7" stop-color="${look.shade}" stop-opacity="0.25"/><stop offset="1" stop-color="${look.shade}" stop-opacity="0"/></radialGradient></defs>${shade}`;
	if (marks) s += `<g opacity="0.6">${marks}</g>`;
	s += `<path d="${rims}" fill="none" stroke="${look.rim}" stroke-width="${f(sz * 0.07)}"/>`;
	if (look.seal) {
		// a glowing laurel wreath with a crown in it
		s += `<defs><radialGradient id="${id}g"><stop offset="0" stop-color="${look.seal}" stop-opacity="0.9"/><stop offset="0.55" stop-color="${look.seal}" stop-opacity="0.3"/><stop offset="1" stop-color="${look.seal}" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="52" r="26" fill="url(#${id}g)"/>`;
		const dark = look.shade ?? '#5a3a10';
		// each leaf and the crown get a dark copy just behind them, so they stand out from the glow
		for (const [c, o] of [[dark, 0.9], [look.seal, 0]] as const) {
			for (let k = 0; k < 6; k++) {
				const th = 80 - k * 30, a = (th * Math.PI) / 180;
				s += leaf(50 + o + Math.cos(a) * 16, 54 + o + Math.sin(a) * 16, 8, th + 18, c, dark, false);
				s += leaf(50 + o - Math.cos(a) * 16, 54 + o + Math.sin(a) * 16, 8, -th - 18, c, dark, false);
			}
			s += crown(50 + o, 51 + o, 16, c) + `<rect x="${f(42 + o)}" y="${f(55.8 + o)}" width="16" height="2.2" fill="${c}"/>`;
		}
	}
	// a metal sheen over it all
	return s + `<defs><linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.42" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.55" stop-color="#fff" stop-opacity="0.04"/><stop offset="1" stop-color="#000" stop-opacity="0.25"/></linearGradient></defs><rect width="100" height="100" fill="url(#${id}m)"/>`;
}

function specks(look: Extract<Look, { k: 'specks' }>, r: Rnd): string {
	let s = rect(look.bg);
	let d = '';
	for (let i = 0; i < 260; i++) d += `M${f(between(r, 0, 100))} ${f(between(r, 0, 100))}h0.7v0.7h-0.7z`;
	s += `<path d="${d}" fill="${look.noise}" opacity="0.55"/>`;
	for (let i = 0; i < look.n; i++) {
		const x = between(r, -2, 102), z = look.size * between(r, 0.5, 1.6);
		// most specks in the band (bunched towards its middle), a few loose ones elsewhere
		const y = r() < 0.88 ? 50 + Math.sin(x / 14) * 3 + ((r() + r() + r()) / 3 - 0.5) * look.band * 2 : between(r, 0, 100);
		s += `<rect x="${f(x)}" y="${f(y)}" width="${f(z)}" height="${f(z * between(r, 0.6, 1.2))}" fill="${pick(r, look.colors)}"/>`;
	}
	return s;
}

function overlay(look: Extract<Look, { k: 'overlay' }>, r: Rnd, id: string): string {
	let s = body(look.base, r, id + 'o');
	for (const m of look.marks) {
		if (m.t === 'dots') {
			for (let k = 0; k < m.n; k++) s += `<circle cx="${f(((k + 0.5) * 100) / m.n)}" cy="${f(m.y + between(r, -1, 1))}" r="${f(m.r)}" fill="${m.c}"/>`;
		} else if (m.t === 'dashes') {
			let d = '';
			for (let k = 0; k < m.n; k++) {
				const x = between(r, 4, 80), y = between(r, 4, 94);
				for (let l = 0; l < 3; l++) d += `M${f(x)} ${f(y + l * 2)}h${f(between(r, 5, 15))}v0.7h${f(-between(r, 5, 15))}z`;
			}
			s += `<path d="${d}" fill="${m.c}" opacity="0.8"/>`;
		} else {
			const w = m.s.length * m.size * (m.hand ? 0.52 : 0.6) + m.size * 0.8;
			const font = m.hand ? "'Segoe Print','Comic Sans MS',cursive" : "Impact,'Arial Narrow',sans-serif";
			s += `<g transform="rotate(${f(m.rot ?? 0)} ${f(m.x)} ${f(m.y)})">`;
			if (m.plate) s += `<rect x="${f(m.x - w / 2)}" y="${f(m.y - m.size * 0.75)}" width="${f(w)}" height="${f(m.size * 1.5)}" rx="0.8" fill="${m.plate}"/>`;
			s += `<text x="${f(m.x)}" y="${f(m.y)}" font-size="${f(m.size)}" font-family="${font}" font-weight="700" fill="${m.c}" text-anchor="middle" dominant-baseline="central">${esc(m.s)}</text></g>`;
		}
	}
	return s;
}

function topo(look: Extract<Look, { k: 'topo' }>, r: Rnd, id: string): string {
	let s = rect(look.bg);
	let lines = '';
	const centres = look.dense ? 10 : 7;
	for (let c = 0; c < centres; c++) {
		const cx = between(r, -5, 105), cy = between(r, -5, 105);
		const base = blobPts(r, 0, 0, 1, 9, 0.35);
		for (let rad = between(r, 18, 28); rad > 2; rad -= between(r, 2.6, 4)) {
			const pts = base.map(([x, y]) => [cx + x * rad * between(r, 0.9, 1.1), cy + y * rad * between(r, 0.9, 1.1)] as P);
			if (look.fills && rad < 12) s += `<path d="${smooth(pts)}" fill="${pick(r, look.fills)}" opacity="0.6"/>`;
			lines += smooth(pts);
		}
	}
	const w = look.width ?? 0.7;
	if (look.glow) s += `${blurDef(id + 'g', 1.4)}<path d="${lines}" fill="none" stroke="${look.line}" stroke-width="${w * 2.5}" filter="url(#${id}g)" opacity="0.55"/>`;
	return s + `<path d="${lines}" fill="none" stroke="${look.line}" stroke-width="${w}"/>`;
}

function waves(look: Extract<Look, { k: 'waves' }>, r: Rnd): string {
	let s = rect(look.bg);
	const step = 130 / look.n;
	const ph1 = r() * 6, ph2 = r() * 6;
	let g = '';
	for (let i = 0; i < look.n; i++) {
		const y0 = -15 + i * step;
		const top: P[] = [], bot: P[] = [];
		const th = step * between(r, 0.35, 0.8);
		for (let x = -10; x <= 110; x += 5) {
			const y = y0 + Math.sin(x / 13 + ph1 + i * 0.7) * look.amp + Math.sin(x / 5.5 + ph2 + i) * look.amp * 0.35;
			top.push([x, y]);
			bot.push([x, y + th + Math.sin(x / 9 + i) * look.amp * 0.3]);
		}
		g += `<path d="M${top.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}L${bot.reverse().map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z" fill="${look.colors[i % look.colors.length]}"/>`;
	}
	s += look.angle ? `<g transform="rotate(${look.angle} 50 50) scale(1.3) translate(-11.5 -11.5)">${g}</g>` : g;
	if (look.specks) for (let i = 0; i < 40; i++) s += `<circle cx="${f(between(r, 0, 100))}" cy="${f(between(r, 0, 100))}" r="${f(between(r, 0.4, 1))}" fill="${look.specks}" opacity="0.8"/>`;
	return s;
}

function strands(look: Extract<Look, { k: 'strands' }>, r: Rnd, id: string): string {
	let s = rect(look.bg);
	let lines = '';
	for (let i = 0; i < look.n; i++) {
		const amp = (look.band / 2) * between(r, 0.4, 1);
		const freq = between(r, 9, 16);
		const ph = r() * 6;
		const pts: P[] = [];
		for (let x = -10; x <= 110; x += 4) pts.push([x, 50 + Math.sin(x / freq + ph) * amp + Math.sin(x / 5 + ph * 2) * amp * 0.15]);
		lines += `<path d="M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}" fill="none" stroke="${pick(r, look.colors)}" stroke-width="${f(between(r, 0.5, 1.3))}" opacity="${f(between(r, 0.6, 1))}"/>`;
	}
	// a soft glow along the band, and (Cascade) a few falling streaks through it
	s += `<defs><radialGradient id="${id}b" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${look.glow}" stop-opacity="0.75"/><stop offset="1" stop-color="${look.glow}" stop-opacity="0"/></radialGradient></defs>`;
	s += `<ellipse cx="50" cy="50" rx="70" ry="${f(look.band * 0.75)}" fill="url(#${id}b)"/>`;
	if (look.falls) for (let i = 0; i < 9; i++) {
		const x = between(r, 4, 96);
		s += `<rect x="${f(x)}" y="0" width="${f(between(r, 0.6, 1.6))}" height="100" fill="${look.falls}" opacity="${f(between(r, 0.15, 0.4))}"/>`;
	}
	s += `${blurDef(id + 'g', 1.6)}<g filter="url(#${id}g)" opacity="0.8">${lines}</g>`;
	return s + lines;
}

function splats(look: Extract<Look, { k: 'splats' }>, r: Rnd): string {
	let s = rect(look.bg);
	const z = look.z ?? Z.splats;
	for (let i = 0; i < zc(look.n, z); i++) {
		const c = pick(r, look.colors), cx = between(r, 0, 100), cy = between(r, 0, 100), rad = (look.size / z) * between(r, 0.4, 1.4);
		s += `<path d="${smooth(blobPts(r, cx, cy, rad, 9, 0.35))}" fill="${c}"/>`;
		const drops = 3 + Math.floor(r() * 6);
		for (let k = 0; k < drops; k++) {
			const a = r() * Math.PI * 2, dist = rad * between(r, 1.2, 2.6);
			s += `<circle cx="${f(cx + Math.cos(a) * dist)}" cy="${f(cy + Math.sin(a) * dist)}" r="${f(rad * between(r, 0.08, 0.25))}" fill="${c}"/>`;
		}
	}
	return s;
}

function spots(look: Extract<Look, { k: 'spots' }>, r: Rnd): string {
	let s = rect(look.bg);
	const z = look.z ?? Z.spots;
	const size = look.size / z;
	for (let i = 0; i < zc(look.n, z); i++) {
		const cx = between(r, -4, 104), cy = between(r, -4, 104);
		const pts = blobPts(r, cx, cy, size * between(r, 0.6, 1.3), 6, 0.35, between(r, 0.8, 1.4), 1, r() * 6);
		s += `<path d="${smooth(pts)}" fill="${pick(r, look.colors)}"${look.rim ? ` stroke="${look.rim}" stroke-width="${f(size * 0.35)}"` : ''}/>`;
	}
	if (look.rings) for (let i = 0; i < 14; i++) s += `<circle cx="${f(between(r, 0, 100))}" cy="${f(between(r, 0, 100))}" r="${f(between(r, 1.2, 2.4))}" fill="none" stroke="${look.rings}" stroke-width="1"/>`;
	return s;
}

function scales(look: Extract<Look, { k: 'scales' }>, r: Rnd, id: string): string {
	const z = look.size;
	let s = rect(look.bg);
	let d = '';
	for (let row = 0, y = -z; y < 100 + z; y += z * 0.55, row++) {
		for (let x = row % 2 ? -z / 2 : 0; x < 100 + z; x += z) d += `M${f(x - z / 2)} ${f(y)}a${f(z / 2)} ${f(z * 0.55)} 0 0 0 ${f(z)} 0`;
	}
	if (look.bands) {
		for (let i = 0; i < 6; i++) {
			const pts = stripePts(r, between(r, -10, 110), between(r, 0, 100), 150, between(r, 8, 14), -0.9, 0.3);
			s += `<path d="${smooth(pts)}" fill="${pick(r, look.bands)}" opacity="0.85"/>`;
		}
	}
	s += `<path d="${d}" fill="none" stroke="${look.c}" stroke-width="${f(z * 0.16)}"/><path d="${d}" fill="none" stroke="${look.hi}" stroke-width="${f(z * 0.06)}" transform="translate(0 ${f(-z * 0.1)})" opacity="0.7"/>`;
	return s + `<defs><radialGradient id="${id}v" cx="0.5" cy="0.5" r="0.7"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></radialGradient></defs><rect width="100" height="100" fill="url(#${id}v)"/>`;
}

function gradient(look: Extract<Look, { k: 'gradient' }>, r: Rnd, id: string): string {
	const a = (look.angle * Math.PI) / 180;
	const x2 = 0.5 + Math.cos(a) / 2, y2 = 0.5 + Math.sin(a) / 2;
	let s = `<defs><linearGradient id="${id}l" x1="${f(1 - x2)}" y1="${f(1 - y2)}" x2="${f(x2)}" y2="${f(y2)}">${look.stops
		.map((c, i) => `<stop offset="${(i / (look.stops.length - 1)).toFixed(2)}" stop-color="${c}"/>`)
		.join('')}</linearGradient></defs><rect width="100" height="100" fill="url(#${id}l)"/>`;
	if (look.squiggle) {
		let d = '';
		for (let i = 0; i < 14; i++) {
			const x = between(r, 0, 100), y = between(r, 0, 100);
			d += `M${f(x)} ${f(y)}`;
			for (let k = 0; k < 5; k++) d += `q${f(between(r, -5, 5))} ${f(between(r, -5, 5))} ${f(between(r, -7, 7))} ${f(between(r, -7, 7))}`;
		}
		s += `<path d="${d}" fill="none" stroke="${look.squiggle}" stroke-width="0.6" opacity="0.55"/>`;
	}
	if (look.slashes) {
		for (let i = 0; i < 40; i++) {
			const pts = stripePts(r, between(r, -5, 105), between(r, -5, 105), between(r, 8, 26), between(r, 0.8, 2.8), -0.75, 0.6);
			s += `<path d="${poly(pts)}" fill="${look.slashes}"/>`;
		}
	}
	if (look.specks) {
		for (let i = 0; i < 110; i++) {
			const x = between(r, 0, 100), y = between(r, 0, 100), an = between(r, 0, Math.PI), l = between(r, 0.8, 2);
			s += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(an) * l)} ${f(Math.sin(an) * l)}" stroke="${pick(r, look.specks)}" stroke-width="0.8" stroke-linecap="round"/>`;
		}
	}
	return s;
}

/* ---------------------------------------------------------------- motifs */

function flame(x: number, y: number, h: number, w: number): string {
	return `M${f(x - w / 2)} ${f(y)}C${f(x - w / 2)} ${f(y - h * 0.4)} ${f(x - w * 0.1)} ${f(y - h * 0.5)} ${f(x - w * 0.25)} ${f(y - h * 0.8)}C${f(x)} ${f(y - h * 0.6)} ${f(x + w * 0.05)} ${f(y - h * 0.75)} ${f(x + w * 0.15)} ${f(y - h)}C${f(x + w * 0.3)} ${f(y - h * 0.65)} ${f(x + w * 0.55)} ${f(y - h * 0.45)} ${f(x + w / 2)} ${f(y)}Z`;
}

function skull(x: number, y: number, z: number, bone: string, shade: string, rot = 0): string {
	const u = (n: number) => f(n * z);
	return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><path d="M${u(-5)} ${u(0)}C${u(-5.5)} ${u(-6.5)} ${u(5.5)} ${u(-6.5)} ${u(5)} ${u(0)}C${u(5)} ${u(2.5)} ${u(3.5)} ${u(3)} ${u(3)} ${u(4)}L${u(-3)} ${u(4)}C${u(-3.5)} ${u(3)} ${u(-5)} ${u(2.5)} ${u(-5)} ${u(0)}Z" fill="${bone}"/><path d="M${u(-3)} ${u(4)}h${u(6)}v${u(2)}h${u(-6)}z" fill="${bone}"/><circle cx="${u(-2)}" cy="${u(0.2)}" r="${u(1.5)}" fill="${shade}"/><circle cx="${u(2)}" cy="${u(0.2)}" r="${u(1.5)}" fill="${shade}"/><path d="M0 ${u(1.8)}l${u(-0.7)} ${u(1.3)}h${u(1.4)}z" fill="${shade}"/><path d="M${u(-1.6)} ${u(4)}v${u(2)}M0 ${u(4)}v${u(2)}M${u(1.6)} ${u(4)}v${u(2)}" stroke="${shade}" stroke-width="${u(0.45)}"/></g>`;
}

function leaf(x: number, y: number, len: number, ang: number, c: string, vein: string, lobed: boolean): string {
	const w = len * 0.42;
	const body = lobed
		? `M0 0C${f(w)} ${f(-len * 0.1)} ${f(w * 1.2)} ${f(-len * 0.45)} ${f(w * 0.6)} ${f(-len * 0.5)}C${f(w * 1.1)} ${f(-len * 0.7)} ${f(w * 0.5)} ${f(-len * 0.85)} 0 ${f(-len)}C${f(-w * 0.5)} ${f(-len * 0.85)} ${f(-w * 1.1)} ${f(-len * 0.7)} ${f(-w * 0.6)} ${f(-len * 0.5)}C${f(-w * 1.2)} ${f(-len * 0.45)} ${f(-w)} ${f(-len * 0.1)} 0 0Z`
		: `M0 0C${f(w)} ${f(-len * 0.3)} ${f(w * 0.6)} ${f(-len * 0.8)} 0 ${f(-len)}C${f(-w * 0.6)} ${f(-len * 0.8)} ${f(-w)} ${f(-len * 0.3)} 0 0Z`;
	return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})"><path d="${body}" fill="${c}"/><path d="M0 ${f(len * 0.12)}V${f(-len * 0.9)}" stroke="${vein}" stroke-width="${f(len * 0.05)}" fill="none"/></g>`;
}

function motif(look: Extract<Look, { k: 'motif' }>, r: Rnd, id: string): string {
	const [c1 = '#888', c2 = c1, c3 = c2, c4 = c3, c5 = c4] = look.colors;
	let s = rect(look.bg);
	switch (look.m) {
		case 'flames': {
			for (const y of [27, 52, 77, 102]) {
				for (let x = -4; x < 110; x += 11) s += `<path d="${flame(x, y, 21, 10)}" fill="${c1}" stroke="${c2}" stroke-width="1.2"/><path d="${flame(x + 0.4, y - 1.5, 11, 5)}" fill="${c3}"/>`;
			}
			return s;
		}
		case 'palms': {
			s = `<defs><linearGradient id="${id}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="0.35" stop-color="${c2}"/><stop offset="0.62" stop-color="${c3}"/><stop offset="0.62" stop-color="${c4}"/><stop offset="1" stop-color="${c1}"/></linearGradient><linearGradient id="${id}u" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe37a"/><stop offset="1" stop-color="#ff6f61"/></linearGradient></defs><rect width="100" height="100" fill="url(#${id}k)"/>`;
			s += `<circle cx="50" cy="56" r="17" fill="url(#${id}u)"/>`;
			for (let y = 48; y < 62; y += 3.2) s += `<rect x="30" y="${f(y)}" width="40" height="${f(0.5 + (y - 48) * 0.09)}" fill="${c3}"/>`;
			s += `<rect x="0" y="62" width="100" height="38" fill="url(#${id}k)"/>`;
			for (let y = 66; y < 96; y += 4) s += `<rect x="${f(50 - (y - 60) * 0.5)}" y="${f(y)}" width="${f(y - 60)}" height="1" fill="#ffb36b" opacity="0.55"/>`;
			const palm = (x: number, lean: number) => {
				let p = `<path d="M${x} 100C${x + lean * 0.3} 78 ${x + lean * 0.8} 55 ${x + lean} 36" stroke="${c5}" stroke-width="3" fill="none"/>`;
				for (const a of [-160, -125, -95, -60, -25, 5]) {
					const rad = (a * Math.PI) / 180;
					p += `<path d="M${x + lean} 36q${f(Math.cos(rad) * 10)} ${f(Math.sin(rad) * 12 - 4)} ${f(Math.cos(rad) * 20)} ${f(Math.sin(rad) * 10 + 6)}" stroke="${c5}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
				}
				return p;
			};
			return s + palm(12, 6) + palm(88, -6) + palm(24, 10);
		}
		case 'planets': {
			s += `${blurDef(id + 'n', 5)}<g filter="url(#${id}n)" opacity="0.7"><ellipse cx="62" cy="40" rx="22" ry="12" fill="${c3}"/><ellipse cx="30" cy="62" rx="16" ry="10" fill="${c4}"/><ellipse cx="80" cy="80" rx="12" ry="8" fill="${c3}"/></g>`;
			for (let i = 0; i < 40; i++) s += `<circle cx="${f(between(r, 0, 100))}" cy="${f(between(r, 0, 100))}" r="${f(between(r, 0.3, 0.8))}" fill="#fff"/>`;
			const planet = (x: number, y: number, z: number, c: string, ring: boolean) =>
				`<circle cx="${x}" cy="${y}" r="${z}" fill="${c}" stroke="#111" stroke-width="0.9"/><path d="M${f(x - z * 0.8)} ${f(y - z * 0.2)}h${f(z * 1.6)}M${f(x - z * 0.9)} ${f(y + z * 0.3)}h${f(z * 1.8)}" stroke="#fff" stroke-opacity="0.35" stroke-width="${f(z * 0.18)}"/>` +
				(ring ? `<ellipse cx="${x}" cy="${y}" rx="${f(z * 1.7)}" ry="${f(z * 0.45)}" fill="none" stroke="${c1}" stroke-width="${f(z * 0.2)}" stroke-opacity="0.9" transform="rotate(-18 ${x} ${y})"/>` : '');
			return s + planet(22, 20, 8, c1, true) + planet(68, 18, 6, c2, false) + planet(54, 58, 10, c1, true) + planet(16, 70, 5, c3, false) + planet(86, 46, 6, c4, true) + planet(84, 88, 7, c2, false) + planet(36, 90, 4, c1, false) + planet(40, 34, 3.5, c3, false);
		}
		case 'galaxy': {
			s += `${blurDef(id + 'n', 4)}<g filter="url(#${id}n)">`;
			for (let i = 0; i < 12; i++) s += `<path d="${smooth(blobPts(r, between(r, 0, 100), between(r, 0, 100), between(r, 10, 22), 7, 0.45))}" fill="${pick(r, look.colors)}" opacity="0.85"/>`;
			s += `</g>`;
			for (let i = 0; i < 9; i++) s += `<path d="${smooth(blobPts(r, between(r, 5, 95), between(r, 5, 95), between(r, 4, 10), 7, 0.35))}" fill="none" stroke="${pick(r, [c4, c5])}" stroke-width="1.2" opacity="0.8"/>`;
			for (let i = 0; i < 50; i++) s += `<circle cx="${f(between(r, 0, 100))}" cy="${f(between(r, 0, 100))}" r="${f(between(r, 0.3, 0.8))}" fill="#fff" opacity="${between(r, 0.5, 1).toFixed(2)}"/>`;
			return s;
		}
		case 'lightning': {
			s = `<defs><linearGradient id="${id}k" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="100" height="100" fill="url(#${id}k)"/>${blurDef(id + 'g', 1.4)}`;
			let d = '';
			for (let b = 0; b < 7; b++) {
				let x = between(r, -10, 110), y = -5;
				const drift = between(r, -3, 3);
				d += `M${f(x)} ${f(y)}`;
				while (y < 105) {
					x += between(r, -5, 5) + drift;
					y += between(r, 3, 7);
					d += `L${f(x)} ${f(y)}`;
					if (r() < 0.35) {
						let bx = x, by = y;
						let sub = `M${f(bx)} ${f(by)}`;
						const dir = r() < 0.5 ? -1 : 1;
						for (let k = 0; k < 3; k++) sub += `L${f((bx += dir * between(r, 2, 6)))} ${f((by += between(r, 2, 5)))}`;
						d += sub + `M${f(x)} ${f(y)}`;
					}
				}
			}
			return s + `<path d="${d}" fill="none" stroke="${c3}" stroke-width="2.6" filter="url(#${id}g)"/><path d="${d}" fill="none" stroke="#f4fbff" stroke-width="0.7" stroke-linejoin="round"/>`;
		}
		case 'magma': {
			for (let i = 0; i < 34; i++) s += `<path d="${poly(blobPts(r, between(r, 0, 100), between(r, 0, 100), between(r, 6, 11), 6, 0.3))}" fill="${pick(r, ['#3a2a22', '#24170f', '#34211c'])}"/>`;
			let d = '';
			for (let i = 0; i < 48; i++) {
				let x = between(r, -10, 110), y = between(r, -10, 110);
				d += `M${f(x)} ${f(y)}`;
				const a0 = r() * Math.PI * 2;
				for (let k = 0; k < 5; k++) {
					const a = a0 + between(r, -0.9, 0.9);
					d += `L${f((x += Math.cos(a) * 6))} ${f((y += Math.sin(a) * 6))}`;
				}
			}
			return s + `${blurDef(id + 'g', 1.6)}<path d="${d}" fill="none" stroke="${c1}" stroke-width="3.6" filter="url(#${id}g)"/><path d="${d}" fill="none" stroke="${c2}" stroke-width="1.4" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c3}" stroke-width="0.5"/>`;
		}
		case 'skulls':
		case 'plague': {
			if (look.m === 'plague') {
				s += `${blurDef(id + 'g', 4)}<g filter="url(#${id}g)">`;
				for (let i = 0; i < 12; i++) s += `<circle cx="${f(between(r, 0, 100))}" cy="${f(between(r, 0, 100))}" r="${f(between(r, 7, 13))}" fill="${pick(r, [c3, c4, c4])}"/>`;
				s += '</g>';
			}
			for (let row = 0; row < 6; row++) {
				for (let col = 0; col < 6; col++) {
					const x = col * 18 + (row % 2) * 9 + between(r, -2, 2), y = row * 18 + 4 + between(r, -2, 2);
					s += skull(x, y, between(r, 1.15, 1.5), pick(r, [c1, c2]), look.m === 'plague' ? '#0b0f08' : c3, between(r, -15, 15));
				}
			}
			return s;
		}
		case 'oni': {
			const mask = (x: number, y: number, z: number, face: string, rot: number) => {
				const u = (n: number) => f(n * z);
				return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><path d="M${u(-4)} ${u(-3)}L${u(-6)} ${u(-8)}L${u(-2.5)} ${u(-4.5)}M${u(4)} ${u(-3)}L${u(6)} ${u(-8)}L${u(2.5)} ${u(-4.5)}" fill="${c2}" stroke="${c2}" stroke-width="${u(0.8)}" stroke-linejoin="round"/><path d="M${u(-5)} ${u(-3)}C${u(-5)} ${u(-6)} ${u(5)} ${u(-6)} ${u(5)} ${u(-3)}L${u(4)} ${u(4)}C${u(2)} ${u(6.5)} ${u(-2)} ${u(6.5)} ${u(-4)} ${u(4)}Z" fill="${face}"/><path d="M${u(-3.8)} ${u(-1.5)}l${u(2.6)} ${u(1)}l${u(-2.4)} ${u(0.6)}zM${u(3.8)} ${u(-1.5)}l${u(-2.6)} ${u(1)}l${u(2.4)} ${u(0.6)}z" fill="#000"/><path d="M${u(-2.6)} ${u(2.6)}h${u(5.2)}l${u(-0.6)} ${u(1.4)}h${u(-4)}z" fill="#000"/><path d="M${u(-2)} ${u(2.6)}l${u(0.4)} ${u(1)}l${u(0.4)} ${u(-1)}M${u(1.2)} ${u(2.6)}l${u(0.4)} ${u(1)}l${u(0.4)} ${u(-1)}" fill="${c2}"/></g>`;
			};
			for (let row = 0; row < 6; row++) for (let col = 0; col < 6; col++) s += mask(col * 18 + (row % 2) * 9 + between(r, -2, 2), row * 18 + 6 + between(r, -2, 2), between(r, 0.95, 1.2), r() < 0.75 ? c1 : c3, between(r, -20, 20));
			return s;
		}
		case 'stickers': {
			const cols = [c1, c2, c3, c4, c5, '#3aa0d0'];
			for (let i = 0; i < 48; i++) {
				const x = between(r, -4, 104), y = between(r, -4, 104), z = between(r, 4, 7), c = pick(r, cols);
				const kind = Math.floor(r() * 4);
				const rot = f(between(r, -30, 30));
				if (kind === 0) s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(z)}" fill="#f2d33a" stroke="#111" stroke-width="0.9"/><circle cx="${f(x - z * 0.35)}" cy="${f(y - z * 0.2)}" r="${f(z * 0.13)}" fill="#111"/><circle cx="${f(x + z * 0.35)}" cy="${f(y - z * 0.2)}" r="${f(z * 0.13)}" fill="#111"/><path d="M${f(x - z * 0.5)} ${f(y + z * 0.2)}q${f(z * 0.5)} ${f(z * 0.5)} ${f(z)} 0" stroke="#111" stroke-width="0.8" fill="none"/>`;
				else if (kind === 1) s += `<g transform="rotate(${rot} ${f(x)} ${f(y)})"><rect x="${f(x - z)}" y="${f(y - z)}" width="${f(z * 2)}" height="${f(z * 2)}" rx="1.5" fill="#fff" stroke="#111" stroke-width="0.9"/><path d="M${f(x - z)} ${f(y - z)}h${f(z)}v${f(z)}h${f(z)}v${f(z)}h${f(-z)}v${f(-z)}h${f(-z)}z" fill="#111"/></g>`;
				else if (kind === 2) s += `<path d="${poly([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => { const a = (k * Math.PI) / 5 - Math.PI / 2, rr = k % 2 ? z * 0.45 : z; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr] as P; }))}" fill="${c}" stroke="#111" stroke-width="0.9" stroke-linejoin="round"/>`;
				else s += `<rect x="${f(x - z * 1.2)}" y="${f(y - z * 0.6)}" width="${f(z * 2.4)}" height="${f(z * 1.2)}" rx="${f(z * 0.6)}" fill="${c}" stroke="#111" stroke-width="0.9" transform="rotate(${rot} ${f(x)} ${f(y)})"/>`;
			}
			return s;
		}
		case 'flowers':
		case 'wallpaper': {
			const wall = look.m === 'wallpaper';
			if (wall) {
				let d = '';
				for (let i = 0; i < 8; i++) {
					const x = between(r, 0, 100);
					let y = -5;
					d += `M${f(x)} ${f(y)}`;
					while (y < 105) {
						d += `q${f(between(r, -8, 8))} 6 ${f(between(r, -5, 5))} 12`;
						y += 12;
					}
				}
				s += `<path d="${d}" fill="none" stroke="${c1}" stroke-width="0.8" opacity="0.8"/>`;
				for (let i = 0; i < 40; i++) s += leaf(between(r, 0, 100), between(r, 0, 100), between(r, 3, 4.5), between(r, 0, 360), c1, c1, false);
			}
			const n = wall ? 30 : 70;
			for (let i = 0; i < n; i++) {
				const x = between(r, -2, 102), y = between(r, -2, 102), z = wall ? between(r, 1.4, 2.4) : between(r, 1.6, 2.8), c = pick(r, wall ? [c2, c2, c3] : [c1, c2, c3]);
				for (let k = 0; k < 5; k++) {
					const a = (k * Math.PI * 2) / 5 + i;
					s += `<circle cx="${f(x + Math.cos(a) * z)}" cy="${f(y + Math.sin(a) * z)}" r="${f(z * 0.75)}" fill="${c}"/>`;
				}
				s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(z * 0.45)}" fill="${c4}"/>`;
			}
			return s;
		}
		case 'leaves':
		case 'treeline': {
			const tree = look.m === 'treeline';
			for (let i = 0; i < (tree ? 22 : 10); i++) s += `<path d="M${f(between(r, 0, 100))} -5q${f(between(r, -8, 8))} 55 ${f(between(r, -6, 6))} 110" stroke="${pick(r, tree ? [c1, c2] : ['#1e140f', '#4a3222'])}" stroke-width="${f(between(r, 1.5, 4))}" fill="none" opacity="0.85"/>`;
			for (let i = 0; i < (tree ? 36 : 60); i++) s += leaf(between(r, -5, 105), between(r, -5, 105), between(r, 7, 12), between(r, 0, 360), pick(r, tree ? [c3, c4, c5, c3] : [c1, c2, c3, c4]), tree ? c1 : look.bg, true);
			return s;
		}
		case 'pine':
		case 'ferns': {
			if (look.blur) s += `${blurDef(id + 'p', 0.9)}<g filter="url(#${id}p)">`;
			const sprays = look.m === 'ferns' ? 52 : 40;
			for (let i = 0; i < sprays; i++) {
				const x = between(r, -5, 105), y = between(r, -5, 105), a0 = between(r, 0, Math.PI * 2), c = pick(r, [c1, c2, c3, c4]);
				if (look.m === 'ferns') {
					const len = between(r, 14, 24);
					let d = `M${f(x)} ${f(y)}l${f(Math.cos(a0) * len)} ${f(Math.sin(a0) * len)}`;
					for (let k = 1; k < 9; k++) {
						const px = x + Math.cos(a0) * len * (k / 9), py = y + Math.sin(a0) * len * (k / 9), ll = (1 - k / 10) * 5;
						d += `M${f(px)} ${f(py)}l${f(Math.cos(a0 + 1) * ll)} ${f(Math.sin(a0 + 1) * ll)}M${f(px)} ${f(py)}l${f(Math.cos(a0 - 1) * ll)} ${f(Math.sin(a0 - 1) * ll)}`;
					}
					s += `<path d="${d}" stroke="${c}" stroke-width="1.2" stroke-linecap="round" fill="none"/>`;
				} else {
					let d = '';
					for (let k = 0; k < 18; k++) {
						const a = a0 + between(r, -0.6, 0.6), len = between(r, 5, 10);
						d += `M${f(x)} ${f(y)}l${f(Math.cos(a) * len)} ${f(Math.sin(a) * len)}`;
					}
					s += `<path d="${d}" stroke="${c}" stroke-width="0.7" stroke-linecap="round" fill="none"/>`;
				}
			}
			if (look.blur) s += '</g>';
			else if (look.m === 'pine') for (let i = 0; i < 6; i++) s += `<ellipse cx="${f(between(r, 5, 95))}" cy="${f(between(r, 5, 95))}" rx="1.8" ry="2.8" fill="${c4}" stroke="${c1}" stroke-width="0.6"/>`;
			return s;
		}
		case 'branches': {
			let d = '';
			const grow = (x: number, y: number, a: number, len: number, depth: number) => {
				const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
				d += `M${f(x)} ${f(y)}L${f(x2)} ${f(y2)}`;
				if (depth > 0) {
					grow(x2, y2, a + between(r, 0.3, 0.8), len * 0.72, depth - 1);
					grow(x2, y2, a - between(r, 0.3, 0.8), len * 0.72, depth - 1);
				}
			};
			for (let i = 0; i < 16; i++) grow(between(r, -10, 110), between(r, -10, 110), between(r, 0, Math.PI * 2), between(r, 9, 15), 4);
			s += `<path d="${d}" stroke="${c1}" stroke-width="0.9" stroke-linecap="round" fill="none"/>`;
			for (let i = 0; i < 44; i++) s += leaf(between(r, 0, 100), between(r, 0, 100), between(r, 4, 6.5), between(r, 0, 360), pick(r, [c2, c3]), c1, true);
			return s;
		}
		case 'chains': {
			s += `<defs><linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c3}"/><stop offset="0.5" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>`;
			for (let row = 0; row < 6; row++) {
				const y0 = row * 20 - 4, ang = row % 2 ? 35 : -35;
				let g = '';
				for (let k = -2; k < 10; k++) {
					const x = k * 11;
					g += k % 2 ? `<rect x="${x - 6}" y="-1.8" width="12" height="3.6" rx="1.8" fill="none" stroke="url(#${id}c)" stroke-width="2"/>` : `<rect x="${x - 7}" y="-4.2" width="14" height="8.4" rx="4.2" fill="none" stroke="url(#${id}c)" stroke-width="2.2"/>`;
				}
				s += `<g transform="translate(0 ${y0}) rotate(${ang} 50 0)">${g}</g>`;
			}
			for (let i = 0; i < 6; i++) {
				const x = between(r, 5, 95), y = between(r, 5, 95);
				s += `<path d="M${f(x - 3)} ${f(y)}h6M${f(x)} ${f(y - 3)}v6" stroke="#fff" stroke-width="0.8"/>`;
			}
			return s;
		}
		case 'grass': {
			for (let i = 0; i < 220; i++) {
				const x = between(r, -5, 105), y = between(r, -5, 105), a = between(r, -2.6, -0.5), len = between(r, 8, 20);
				s += `<path d="M${f(x)} ${f(y)}q${f(Math.cos(a) * len * 0.5 + between(r, -5, 5))} ${f(Math.sin(a) * len * 0.5)} ${f(Math.cos(a) * len)} ${f(Math.sin(a) * len)}" stroke="${pick(r, look.colors)}" stroke-width="${f(between(r, 0.35, 0.9))}" fill="none"/>`;
			}
			return s;
		}
		case 'web': {
			let d = '';
			for (let i = 0; i < 100; i++) {
				const x = between(r, -10, 110), y = between(r, -10, 110), a = between(r, 0, Math.PI), len = between(r, 10, 40);
				d += `M${f(x)} ${f(y)}q${f(between(r, -6, 6))} ${f(between(r, -6, 6))} ${f(Math.cos(a) * len)} ${f(Math.sin(a) * len)}`;
			}
			return s + `<path d="${d}" stroke="${c1}" stroke-width="0.35" fill="none" opacity="0.9"/>`;
		}
		case 'rods': {
			for (let i = 0; i < 170; i++) {
				const x = between(r, -5, 105), y = between(r, -5, 105), a = between(r, 0, Math.PI), len = between(r, 5, 12);
				s += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a) * len)} ${f(Math.sin(a) * len)}" stroke="${pick(r, look.colors)}" stroke-width="${f(between(r, 0.9, 2))}" stroke-linecap="round"/>`;
			}
			return s;
		}
		case 'bark': {
			for (let i = 0; i < 170; i++) {
				const x = between(r, 0, 100);
				const y = between(r, -10, 95);
				let d = `M${f(x)} ${f(y)}`;
				for (let k = 0; k < 3; k++) d += `l${f(between(r, -1, 1))} ${f(between(r, 2, 4))}`;
				s += `<path d="${d}" stroke="${pick(r, look.colors)}" stroke-width="${f(between(r, 0.8, 1.8))}" fill="none" stroke-linecap="round"/>`;
			}
			return s;
		}
		case 'rind': {
			s += `<defs><filter id="${id}t"><feTurbulence type="fractalNoise" baseFrequency="0.14" numOctaves="2" seed="${Math.floor(r() * 99)}"/><feColorMatrix values="0 0 0 0 0.75  0 0 0 0 0.85  0 0 0 0 0.6  0 0 0 0.5 -0.12"/></filter></defs><rect width="100" height="100" filter="url(#${id}t)"/>`;
			let d = '';
			for (let i = 0; i < 26; i++) {
				let x = between(r, -10, 110), y = between(r, -10, 110);
				d += `M${f(x)} ${f(y)}`;
				for (let k = 0; k < 5; k++) d += `L${f((x += between(r, 2, 7)))} ${f((y += between(r, -6, 3)))}`;
			}
			return s + `<path d="${d}" stroke="${c1}" stroke-width="2.6" fill="none" stroke-linejoin="round"/><path d="${d}" stroke="${c2}" stroke-width="0.9" fill="none" transform="translate(0.6 0.6)"/>`;
		}
		case 'rocks': {
			for (let i = 0; i < 64; i++) {
				const pts = blobPts(r, between(r, -5, 105), between(r, -5, 105), between(r, 6, 11), 6, 0.3, 1.3, 1, r() * 6);
				s += `<path d="${poly(pts)}" fill="${pick(r, [c1, c2, c3, c4])}"/><path d="M${f(pts[0][0])} ${f(pts[0][1])}L${f(pts[3][0])} ${f(pts[3][1])}" stroke="${look.bg}" stroke-width="0.6" opacity="0.7"/>`;
			}
			return s;
		}
		case 'mesh': {
			s += `<defs><filter id="${id}b"><feGaussianBlur stdDeviation="4"/></filter><pattern id="${id}m" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M0 0h5M0 0v5" stroke="${c3}" stroke-width="0.6" fill="none"/></pattern></defs><g filter="url(#${id}b)">`;
			for (let i = 0; i < 16; i++) s += `<path d="${smooth(blobPts(r, between(r, 0, 100), between(r, 0, 100), between(r, 8, 16), 7, 0.4))}" fill="${pick(r, [c1, c2])}"/>`;
			return s + `</g><rect width="100" height="100" fill="url(#${id}m)" opacity="0.55"/>`;
		}
		case 'tectonic': {
			for (let i = 0; i < 40; i++) {
				const x = between(r, -10, 110), y = between(r, -10, 110), a = between(r, 0.6, 1.5), len = between(r, 18, 46);
				const c = pick(r, [c1, c1, c2, c3, c4]);
				s += `<path d="M${f(x)} ${f(y)}l${f(Math.cos(a) * len)} ${f(-Math.sin(a) * len)}" stroke="${c}" stroke-width="${f(between(r, 2.4, 5))}" stroke-linecap="square"/>`;
			}
			return s;
		}
		case 'snakes': {
			// coiled snakes, each drawn whole before the next so they lie over each other (Venom Pile)
			// colours: body, scales, outline, eyes / highlight
			for (let i = 0; i < 28; i++) {
				const pts: P[] = [];
				let x = between(r, -10, 110), y = between(r, -10, 110), a = r() * Math.PI * 2;
				const turn = between(r, 0.4, 0.9) * (r() < 0.5 ? -1 : 1);
				for (let k = 0; k < 8; k++) {
					pts.push([x, y]);
					a += turn * between(r, 0.5, 1.4);
					x += Math.cos(a) * 8;
					y += Math.sin(a) * 8;
				}
				const d = openSmooth(pts);
				s += `<path d="${d}" fill="none" stroke="${c3}" stroke-width="8.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c1}" stroke-width="6.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c2}" stroke-width="5" stroke-dasharray="0.9 1.1" opacity="0.4"/><path d="${d}" fill="none" stroke="${c4}" stroke-width="0.9" opacity="0.55" transform="translate(-1 -1.4)"/>`;
				const [hx, hy] = pts[pts.length - 1], [px, py] = pts[pts.length - 2];
				s += `<g transform="translate(${f(hx)} ${f(hy)}) rotate(${f((Math.atan2(hy - py, hx - px) * 180) / Math.PI)})"><path d="M-3 -3.6C2 -4.4 6 -2 6.6 0C6 2 2 4.4 -3 3.6Z" fill="${c1}" stroke="${c3}" stroke-width="1"/><circle cx="2.6" cy="-1.6" r="0.8" fill="${c4}"/><circle cx="2.6" cy="1.6" r="0.8" fill="${c4}"/></g>`;
			}
			return s;
		}
		case 'phoenix': {
			// one emblem: a bird with spread wings under a dripping moon (Renaissance). Colours: light feathers, dark feathers, moon
			for (const side of [1, -1]) {
				// wings raised wide: the outer feathers long and nearly upright, the inner ones short and level
				for (let k = 7; k >= 0; k--) {
					const ang = side * (28 + k * 9.5), len = 45 - k * 3.4, x = 50 + side * 6, y = 68;
					s += leaf(x, y, len, ang, k % 2 ? c2 : c1, look.bg, false) + leaf(x + side * 1.5, y, len * 0.55, ang + side * 4, c2, c2, false);
				}
			}
			for (const ang of [168, 180, 192]) s += leaf(50, 72, 12, ang, c1, look.bg, false);
			s += `<ellipse cx="50" cy="68" rx="5.5" ry="7" fill="${c1}"/><circle cx="50" cy="61" r="4.2" fill="${c1}"/><path d="M48.5 64h3L50 67.4z" fill="${c3}"/>`;
			s += `<circle cx="50" cy="36" r="6.5" fill="${c3}" opacity="0.92"/>`;
			for (const [x, h] of [[46.5, 4], [49.4, 6.5], [52.6, 3]]) s += `<rect x="${x}" y="40" width="1.3" height="${h}" rx="0.6" fill="${c3}" opacity="0.85"/>`;
			return s;
		}
		case 'zigzag': {
			// thin double zigzags like lightning-bolt outlines (Intercept)
			let d = '';
			for (let x0 = -24; x0 < 130; x0 += 34) {
				const y0 = between(r, -30, -10);
				for (const shift of [0, 5]) {
					let x = x0 + shift, y = y0;
					d += `M${f(x)} ${f(y)}`;
					while (y < 110) {
						x -= 12;
						y += 22;
						d += `L${f(x)} ${f(y)}`;
						x += 12;
						d += `L${f(x)} ${f(y)}`;
					}
				}
			}
			return s + `<path d="${d}" fill="none" stroke="${c1}" stroke-width="0.8" opacity="0.75"/>`;
		}
		case 'pyro': {
			// rows of glossy black scales with glowing edges (Pyroclast). Colours: dark, highlight, edge glow
			const scale = (x: number, y: number) => {
				const d = `M${f(x)} ${f(y)}C${f(x + 4)} ${f(y - 3.4)} ${f(x + 11)} ${f(y - 3)} ${f(x + 15)} ${f(y)}C${f(x + 11)} ${f(y + 3.6)} ${f(x + 4)} ${f(y + 4)} ${f(x)} ${f(y)}Z`;
				const edge = `M${f(x)} ${f(y)}C${f(x + 4)} ${f(y + 4)} ${f(x + 11)} ${f(y + 3.6)} ${f(x + 15)} ${f(y)}`;
				return `<path d="${d}" fill="url(#${id}s)"/><path d="${edge}" fill="none" stroke="${c3}" stroke-width="0.6"/>`;
			};
			// copies one tile over so the scales run on across the pattern's edges
			let tile = '';
			for (const dy of [-10, 0, 10]) for (const dx of [-14, 0, 14]) tile += scale(-1 + dx, 2.5 + dy) + scale(6 + dx, 7.5 + dy);
			return (
				s +
				`<defs><linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c1}"/><stop offset="0.48" stop-color="${c1}"/><stop offset="0.62" stop-color="${c2}"/><stop offset="0.74" stop-color="${c1}"/><stop offset="1" stop-color="#000"/></linearGradient><pattern id="${id}p" width="14" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-36) scale(1.7)">${tile}</pattern></defs><rect width="100" height="100" fill="url(#${id}p)"/>`
			);
		}
		case 'scroll': {
			// an ink-painting landscape: clouds, white branches, pink blossom, pale mountains, water lines, big white flowers (Moonlit Pearl)
			// colours: blossom, flowers, mountains, lines, clouds
			s += `${blurDef(id + 'c', 2.2)}<g filter="url(#${id}c)">`;
			for (let i = 0; i < 14; i++) s += `<path d="${smooth(blobPts(r, between(r, 0, 100), between(r, 0, 100), between(r, 8, 16), 7, 0.35))}" fill="${pick(r, [c5, '#29292c', '#343437'])}"/>`;
			for (let i = 0; i < 9; i++) s += `<circle cx="${f(between(r, 10, 100))}" cy="${f(between(r, -4, 26))}" r="${f(between(r, 3, 7))}" fill="${c1}" opacity="0.85"/>`;
			s += '</g>';
			let d = '';
			for (let i = 0; i < 6; i++) {
				d += `M${f(between(r, -10, 30))} ${f(between(r, 4, 34))}`;
				for (let k = 0; k < 6; k++) d += `q${f(between(r, 2, 4))} ${f(between(r, -4, 4))} ${f(between(r, 5, 8))} ${f(between(r, -3, 3))}`;
			}
			s += `<path d="${d}" fill="none" stroke="${c4}" stroke-width="1.3" stroke-linecap="round" opacity="0.85"/>`;
			s += `<path d="M0 67L14 49L20 55L30 42L46 67Z" fill="${c3}"/><path d="M14 49L17 67M30 42L27 67M30 42L36 67" stroke="${look.bg}" stroke-width="1.6" opacity="0.6"/>`;
			for (let y = 69; y < 81; y += 2.4) s += `<rect x="${f(between(r, -5, 20))}" y="${f(y)}" width="${f(between(r, 40, 90))}" height="1.1" fill="${c4}" opacity="${f(between(r, 0.5, 0.9))}"/>`;
			const flower = (x: number, y: number, z: number) => {
				let p = '';
				for (let k = 0; k < 6; k++) p += `<circle cx="${f(x + Math.cos(k * 1.05) * z * 0.7)}" cy="${f(y + Math.sin(k * 1.05) * z * 0.7)}" r="${f(z * 0.55)}" fill="${c2}"/>`;
				return p + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(z * 0.3)}" fill="${c3}"/>`;
			};
			return s + flower(30, 90, 8) + flower(62, 93, 9) + flower(86, 57, 5) + flower(10, 84, 4.5);
		}
		case 'kintsugi': {
			// broken pieces mended with gold: a dark panel, a red piece with white blossom, an art-deco line pattern (Gilded Ruin)
			// colours: gold, red, blossom, deco lines, panel
			const panel: P[] = [[40, -4], [104, -4], [104, 20], [70, 40], [52, 30]];
			const red: P[] = [[-4, 44], [22, 40], [38, 58], [30, 78], [10, 84], [-4, 76]];
			const deco: P[] = [[30, 110], [110, 30], [110, 110]];
			s += `<defs><pattern id="${id}k" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect x="1" y="1" width="8" height="8" fill="none" stroke="${c4}" stroke-width="0.6"/><rect x="3.2" y="3.2" width="3.6" height="3.6" fill="none" stroke="${c4}" stroke-width="0.6"/></pattern></defs>`;
			s += `<path d="${poly(panel)}" fill="${c5}"/><path d="${poly(red)}" fill="${c2}"/><path d="${poly(deco)}" fill="url(#${id}k)"/>`;
			for (let i = 0; i < 11; i++) {
				const x = between(r, 3, 28), y = between(r, 47, 79);
				for (let k = 0; k < 5; k++) s += `<circle cx="${f(x + between(r, -2.2, 2.2))}" cy="${f(y + between(r, -2.2, 2.2))}" r="${f(between(r, 0.8, 1.6))}" fill="${c3}"/>`;
			}
			for (let i = 0; i < 30; i++) s += `<circle cx="${f(between(r, 56, 100))}" cy="${f(between(r, 0, 22))}" r="0.5" fill="${c1}" opacity="0.6"/>`;
			let d = '';
			for (let i = 0; i < 9; i++) {
				let x = between(r, 0, 100), y = between(r, 0, 100);
				d += `M${f(x)} ${f(y)}`;
				for (let k = 0; k < 4; k++) d += `L${f((x += between(r, -9, 9)))} ${f((y += between(r, -9, 9)))}`;
			}
			return s + `<path d="${d}" fill="none" stroke="${c1}" stroke-width="0.45"/><path d="${poly(panel)}${poly(red)}M30 110L110 30" fill="none" stroke="${c1}" stroke-width="2.2" stroke-linejoin="bevel"/>`;
		}
		case 'shields': {
			// rows of shields with a keyhole over lines of code (Locked Down). Colours: shield, inner line, outline, code, red code
			let code = '', red = '';
			for (let y = 1.5; y < 100; y += 3) {
				for (let x = between(r, -5, 2); x < 100; ) {
					const w = between(r, 2, 9);
					if (r() < 0.6) {
						const bar = `M${f(x)} ${f(y)}h${f(w)}v1h${f(-w)}z`;
						if (r() < 0.1) red += bar;
						else code += bar;
					}
					x += w + between(r, 1, 4);
				}
			}
			s += `<path d="${code}" fill="${c4}" opacity="0.7"/><path d="${red}" fill="${c5}" opacity="0.8"/>`;
			const sh = (x: number, y: number, k: number) =>
				`M${f(x)} ${f(y - 11 * k)}L${f(x + 10 * k)} ${f(y - 7.5 * k)}C${f(x + 10 * k)} ${f(y + 3 * k)} ${f(x + 6 * k)} ${f(y + 9 * k)} ${f(x)} ${f(y + 12 * k)}C${f(x - 6 * k)} ${f(y + 9 * k)} ${f(x - 10 * k)} ${f(y + 3 * k)} ${f(x - 10 * k)} ${f(y - 7.5 * k)}Z`;
			for (let row = 0; row < 5; row++) {
				for (let x = (row % 2) * 15 - 15; x < 115; x += 30) {
					const y = row * 26 - 4;
					s += `<path d="${sh(x, y, 1.15)}" fill="${c1}" stroke="${c3}" stroke-width="1.6"/><path d="${sh(x, y, 0.78)}" fill="none" stroke="${c2}" stroke-width="1"/><circle cx="${f(x)}" cy="${f(y - 1.5)}" r="2.2" fill="${c2}"/><path d="M${f(x - 1.1)} ${f(y - 0.5)}L${f(x - 2)} ${f(y + 5)}H${f(x + 2)}L${f(x + 1.1)} ${f(y - 0.5)}Z" fill="${c2}"/>`;
				}
			}
			return s;
		}
	}
}

/** The inside of a look's picture (an `overlay` draws its base with this too). */
function body(look: Look, r: Rnd, id: string): string {
	switch (look.k) {
		case 'solid': return solid(look, r, id);
		case 'blobs': return blobs(look, r, id);
		case 'stripes': return stripes(look, r);
		case 'pixels': return pixels(look, r);
		case 'shards': return shards(look, r, id);
		case 'trigrid': return trigrid(look, r, id);
		case 'topo': return topo(look, r, id);
		case 'waves': return waves(look, r);
		case 'strands': return strands(look, r, id);
		case 'splats': return splats(look, r);
		case 'spots': return spots(look, r);
		case 'scales': return scales(look, r, id);
		case 'gradient': return gradient(look, r, id);
		case 'motif': return motif(look, r, id);
		case 'diamonds': return diamonds(look, r, id);
		case 'specks': return specks(look, r);
		case 'overlay': return overlay(look, r, id);
	}
}

/** The picture of a look as an SVG string (`uid` keeps gradient / filter ids unique on the page). */
export function swatchSvg(look: Look, seedName: string, uid: string): string {
	const r = rng(seedOf(seedName));
	const id = `cw${uid.replace(/[^a-zA-Z0-9]/g, '')}`;
	return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${body(look, r, id)}</svg>`;
}
