/**
 * Small camo pictures for the weapon card (2026-11-11, the user's ask: "instead of the tick boxes,
 * just show a picture of the camo you unlock and its challenge; find out what the 3 before-Gold
 * camos look like on every weapon and draw them").
 * Our own procedural SVG drawings in each camo's style, NOT the game's textures: every camo is
 * described in data/specialLooks.ts as a pattern family + its colours (picked from reference
 * pictures on mw4camos.com and codmunity.gg), and drawn here. Same camo = same picture every time
 * (the random numbers are seeded by the camo's name). Pure: Node runs it in the tests.
 * Drawn in a 100 × 100 box; the card shows it at about 60 px.
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
	/** a grid of squares split into triangles */
	| { k: 'trigrid'; colors: string[]; cell: number }
	/** contour lines (topographic) */
	| { k: 'topo'; bg: string; line: string; width?: number; glow?: boolean; fills?: string[]; dense?: boolean }
	/** wavy bands across */
	| { k: 'waves'; bg: string; colors: string[]; n: number; amp: number; angle?: number; specks?: string }
	/** paint splats with droplets */
	| { k: 'splats'; z?: number; bg: string; colors: string[]; n: number; size: number }
	/** small rounded spots (leopard / bean shapes), optionally with a dark rim */
	| { k: 'spots'; z?: number; bg: string; colors: string[]; n: number; size: number; rim?: string; rings?: string }
	/** reptile scales; `bands` adds diagonal bands over them */
	| { k: 'scales'; bg: string; c: string; hi: string; size: number; bands?: string[] }
	/** a colour gradient, with sprinkles or black slashes on top */
	| { k: 'gradient'; stops: string[]; angle: number; specks?: string[]; slashes?: string; squiggle?: string }
	/** a picture motif */
	| { k: 'motif'; m: Motif; bg: string; colors: string[]; blur?: boolean };

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
	| 'tectonic';

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

function trigrid(look: Extract<Look, { k: 'trigrid' }>, r: Rnd): string {
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
	}
}

/** The picture of a look as an SVG string (`uid` keeps gradient / filter ids unique on the page). */
export function swatchSvg(look: Look, seedName: string, uid: string): string {
	const r = rng(seedOf(seedName));
	const id = `cw${uid.replace(/[^a-zA-Z0-9]/g, '')}`;
	let body: string;
	switch (look.k) {
		case 'solid': body = solid(look, r, id); break;
		case 'blobs': body = blobs(look, r, id); break;
		case 'stripes': body = stripes(look, r); break;
		case 'pixels': body = pixels(look, r); break;
		case 'shards': body = shards(look, r, id); break;
		case 'trigrid': body = trigrid(look, r); break;
		case 'topo': body = topo(look, r, id); break;
		case 'waves': body = waves(look, r); break;
		case 'splats': body = splats(look, r); break;
		case 'spots': body = spots(look, r); break;
		case 'scales': body = scales(look, r, id); break;
		case 'gradient': body = gradient(look, r, id); break;
		case 'motif': body = motif(look, r, id); break;
	}
	return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${body}</svg>`;
}
