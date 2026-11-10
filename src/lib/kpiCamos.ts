/**
 * Camo textures for the Abscar theme. KPI tiles: brushed noise (Gold / Platinum / Harmonic Break
 * metal) and low-poly chrome facets (Divergence). Divergence & Mastery rows: Divergence's rainbow
 * oil-slick contours, Polyatomic Reforged's crystal shards and Orion Reforged's galaxy, plus the
 * Warzone and DMZ Mastery camos (2026-11-10, further down).
 * Our own procedural SVGs drawn in the style of the in-game camos (looked up 2026-11-07 on the
 * official renders), built once as data URLs; colours and motion are layered on top in app.css.
 */

const url = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const n1 = (n: number) => n.toFixed(1);
const n2 = (n: number) => n.toFixed(2);

/** small deterministic random generator, so a texture looks the same on every load */
function random(seed: number) {
	return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

/** Fine brushed-metal streaks: dark, semi-transparent, tiles seamlessly. */
export const BRUSHED = url(
	`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">` +
		`<filter id="n" x="0" y="0" width="100%" height="100%">` +
		`<feTurbulence type="fractalNoise" baseFrequency="0.75 0.04" numOctaves="3" seed="3" stitchTiles="stitch"/>` +
		`<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 -0.25"/>` +
		`</filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`
);

type Pt = [number, number];

/** Crumpled chrome: a jittered grid split into triangles, each a different shade of grey. */
function facets(): string {
	const rand = random(4242);
	const W = 320;
	const H = 160;
	const COLS = 9;
	const ROWS = 5;
	const pts: Pt[][] = [];
	for (let r = 0; r <= ROWS; r++) {
		pts.push([]);
		for (let c = 0; c <= COLS; c++) {
			const edgeX = c === 0 || c === COLS;
			const edgeY = r === 0 || r === ROWS;
			pts[r].push([
				(c / COLS) * W + (edgeX ? 0 : (rand() - 0.5) * (W / COLS) * 0.8),
				(r / ROWS) * H + (edgeY ? 0 : (rand() - 0.5) * (H / ROWS) * 0.8)
			]);
		}
	}
	const shade = () => {
		const v = Math.round(40 + Math.pow(rand(), 0.6) * 210);
		return `rgb(${v},${v + 2},${Math.min(255, v + 8)})`;
	};
	const tri = (a: Pt, b: Pt, c: Pt) =>
		`<path d="M${a.map(n1).join(' ')} L${b.map(n1).join(' ')} L${c.map(n1).join(' ')} Z" fill="${shade()}"/>`;
	let out = '';
	for (let r = 0; r < ROWS; r++) {
		for (let c = 0; c < COLS; c++) {
			const [a, b, d, e] = [pts[r][c], pts[r][c + 1], pts[r + 1][c], pts[r + 1][c + 1]];
			out += rand() < 0.5 ? tri(a, b, e) + tri(a, e, d) : tri(a, b, d) + tri(b, e, d);
		}
	}
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" shape-rendering="crispEdges">${out}</svg>`;
}

export const FACETS = url(facets());

/** HSL → RGB, all 0–1 except hue in degrees */
function hsl(h: number, s: number, l: number): [number, number, number] {
	const a = s * Math.min(l, 1 - l);
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
	};
	return [f(0), f(8), f(4)];
}

/**
 * Divergence: thin rainbow bands (red → yellow → green → cyan → blue → violet) following the
 * contour lines of smooth noise, transparent in between, like the camo's oil-slick swirls.
 * The noise value is mapped through lookup tables: every 1/BANDS of it starts a new band.
 */
function rainbowBands(): string {
	const STEPS = 193;
	const BANDS = 6;
	const WIDTH = 0.42; // share of each period that is coloured
	const ch: number[][] = [[], [], [], []];
	for (let i = 0; i < STEPS; i++) {
		const p = ((i / (STEPS - 1)) * BANDS) % 1;
		const t = Math.min(p / WIDTH, 1);
		const [r, g, b] = hsl(t * 285, 1, 0.6);
		ch[0].push(r);
		ch[1].push(g);
		ch[2].push(b);
		ch[3].push(p < WIDTH ? Math.pow(Math.sin(Math.PI * t), 0.55) * 0.92 : 0);
	}
	const func = (c: string, v: number[]) => `<feFunc${c} type="table" tableValues="${v.map(n2).join(' ')}"/>`;
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="520" height="260">` +
		`<filter id="r" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
		`<feTurbulence type="fractalNoise" baseFrequency="0.0058 0.0115" numOctaves="2" seed="11" stitchTiles="stitch"/>` +
		`<feColorMatrix values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  1 0 0 0 0"/>` +
		`<feComponentTransfer>${func('R', ch[0])}${func('G', ch[1])}${func('B', ch[2])}${func('A', ch[3])}</feComponentTransfer>` +
		`</filter><rect width="100%" height="100%" filter="url(#r)"/></svg>`
	);
}

export const RAINBOW = url(rainbowBands());

/**
 * Polyatomic Reforged: overlapping sharp crystal shards in blue, violet and lilac. Shards that
 * cross an edge are drawn again on the opposite side, so the tile repeats without seams.
 */
function shards(): string {
	const rand = random(1717);
	const W = 360;
	const H = 200;
	const COLOURS = ['#0b4fd6', '#2f8fe0', '#7ea6ec', '#3a12d8', '#6522e0', '#9450e6', '#ab92ea', '#2333c9', '#5a7df0'];
	let out = '';
	for (let i = 0; i < 64; i++) {
		const a: Pt = [rand() * W, rand() * H];
		const angle = rand() * Math.PI * 2;
		const len = 45 + rand() * 120;
		const spread = 0.18 + rand() * 0.55;
		const len2 = len * (0.45 + rand() * 0.55);
		const b: Pt = [a[0] + Math.cos(angle) * len, a[1] + Math.sin(angle) * len];
		const c: Pt = [a[0] + Math.cos(angle + spread) * len2, a[1] + Math.sin(angle + spread) * len2];
		const fill = COLOURS[Math.floor(rand() * COLOURS.length)];
		const xs = [a[0], b[0], c[0]];
		const ys = [a[1], b[1], c[1]];
		for (const dx of [-W, 0, W]) {
			for (const dy of [-H, 0, H]) {
				// only draw the copies that actually reach into the tile
				if (Math.max(...xs) + dx < 0 || Math.min(...xs) + dx > W) continue;
				if (Math.max(...ys) + dy < 0 || Math.min(...ys) + dy > H) continue;
				const d = [a, b, c].map(([x, y]) => `${n1(x + dx)} ${n1(y + dy)}`).join(' L');
				out += `<path d="M${d} Z" fill="${fill}"/>`;
			}
		}
	}
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#1d3fd0"/>${out}</svg>`;
}

export const SHARDS = url(shards());

/**
 * Orion Reforged: deep space with purple, crimson and faint teal nebula clouds and a star field.
 * `GALAXY` is the sky; `TWINKLE` is a sparse layer of bright stars that app.css fades in and out.
 */
function nebula(id: string, seed: number, freq: string, [r, g, b]: [number, number, number], gain: number, cut: number) {
	return (
		`<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
		`<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="4" seed="${seed}" stitchTiles="stitch"/>` +
		`<feColorMatrix values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  ${gain} 0 0 0 ${-cut}"/>` +
		`</filter>`
	);
}

const SKY_W = 600;
const SKY_H = 300;

function stars(seed: number, count: number, rMin: number, rMax: number): string {
	const rand = random(seed);
	const TINTS = ['#ffffff', '#ffffff', '#ffd9f2', '#d4e4ff'];
	let out = '';
	for (let i = 0; i < count; i++) {
		const x = 3 + rand() * (SKY_W - 6);
		const y = 3 + rand() * (SKY_H - 6);
		const r = rMin + Math.pow(rand(), 3) * (rMax - rMin);
		const tint = TINTS[Math.floor(rand() * TINTS.length)];
		out += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n2(r)}" fill="${tint}" opacity="${n2(0.45 + rand() * 0.55)}"/>`;
	}
	return out;
}

function galaxy(): string {
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${SKY_W}" height="${SKY_H}">` +
		nebula('p', 5, '0.0042 0.0075', [0.4, 0.11, 0.6], 2.7, 1.3) +
		nebula('c', 9, '0.005 0.009', [0.9, 0.04, 0.2], 3.3, 1.55) +
		nebula('t', 23, '0.007 0.012', [0.25, 0.66, 0.8], 2.8, 1.62) +
		nebula('d', 31, '0.016 0.026', [1, 0.5, 0.75], 2.6, 1.72) +
		`<rect width="100%" height="100%" fill="#030208"/>` +
		['p', 'c', 't', 'd'].map((id) => `<rect width="100%" height="100%" filter="url(#${id})"/>`).join('') +
		stars(77, 230, 0.3, 1.2) +
		`</svg>`
	);
}

export const GALAXY = url(galaxy());

export const TWINKLE = url(
	`<svg xmlns="http://www.w3.org/2000/svg" width="${SKY_W}" height="${SKY_H}">` +
		`<filter id="g" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="2.2"/></filter>` +
		`<g filter="url(#g)">${stars(303, 9, 2.2, 3.2)}</g>${stars(303, 9, 0.9, 1.6)}</svg>`
);

// -------------------------------------------------------------------------------------------------
// Warzone and DMZ Mastery rows (2026-11-10), drawn after codmunity's HD renders and mw4camos.com /
// codcentral's swatches: Parallax = rainbow tiger stripes, Damascus Reforged = liquid blue / violet /
// pink / copper swirls, Empyros = rounded blue digital blocks, Chiral = black with glowing red veins,
// Ripple Tide = glossy black liquid with molten gold, Helio = red fire clouds with white-hot seams.

/** [position 0–1, '#rrggbb', alpha?] colour stops */
type Stop = [number, string, number?];

const rgb = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);

/** Lookup tables (R, G, B, A) that run through `stops` `repeat` times from noise value 0 to 1. */
function tables(stops: Stop[], repeat = 1, steps = Math.max(193, repeat * 64 + 1)): string {
	const ch: number[][] = [[], [], [], []];
	for (let i = 0; i < steps; i++) {
		const p = ((i / (steps - 1)) * repeat) % 1 || (i === steps - 1 ? 1 : 0);
		let k = 0;
		while (k < stops.length - 2 && p > stops[k + 1][0]) k++;
		const [p0, c0, a0 = 1] = stops[k];
		const [p1, c1, a1 = 1] = stops[k + 1];
		const t = p1 > p0 ? Math.min(1, Math.max(0, (p - p0) / (p1 - p0))) : 0;
		const [r0, g0, b0] = rgb(c0);
		const [r1, g1, b1] = rgb(c1);
		[r0 + (r1 - r0) * t, g0 + (g1 - g0) * t, b0 + (b1 - b0) * t, a0 + (a1 - a0) * t].forEach((v, c) => ch[c].push(v));
	}
	const func = (c: string, v: number[]) => `<feFunc${c} type="table" tableValues="${v.map(n2).join(' ')}"/>`;
	return `<feComponentTransfer>${func('R', ch[0])}${func('G', ch[1])}${func('B', ch[2])}${func('A', ch[3])}</feComponentTransfer>`;
}

/** A tile filled with noise coloured through `stops` (seamless: stitchTiles). */
function noiseTile(
	w: number,
	h: number,
	o: { type?: 'fractalNoise' | 'turbulence'; freq: string; octaves: number; seed: number; stops: Stop[]; repeat?: number },
	extra = ''
): string {
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
		`<filter id="f" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
		`<feTurbulence type="${o.type ?? 'fractalNoise'}" baseFrequency="${o.freq}" numOctaves="${o.octaves}" seed="${o.seed}" stitchTiles="stitch"/>` +
		`<feColorMatrix values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  1 0 0 0 0"/>` +
		tables(o.stops, o.repeat) +
		`</filter><rect width="100%" height="100%" filter="url(#f)"/>${extra}</svg>`
	);
}

/**
 * Parallax: tiger-stripe streaks rising to the right. Only the dark gaps between the stripes are
 * drawn here (navy, see-through); app.css puts the drifting rainbow underneath. Not a tile: one
 * wide picture (rotated noise doesn't repeat cleanly), wider than any row.
 */
export const PARALLAX = url(
	`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="420">` +
		`<filter id="f" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
		`<feTurbulence type="fractalNoise" baseFrequency="0.0042 0.052" numOctaves="4" seed="8"/>` +
		`<feColorMatrix values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  1 0 0 0 0"/>` +
		tables([
			[0, '#ffffff', 0.3],
			[0.38, '#ffffff', 0.06],
			[0.45, '#ffffff', 0],
			[0.48, '#120850', 0],
			[0.51, '#120850', 0.78],
			[1, '#08033a', 0.85]
		]) +
		`</filter><rect x="-300" y="-500" width="2200" height="1420" filter="url(#f)" transform="rotate(-17 800 210)"/></svg>`
);

/** Damascus Reforged: contour bands of smooth noise, blue → cyan rim → violet → hot pink → copper. */
export const DAMASCUS = url(
	noiseTile(480, 240, {
		freq: '0.0075 0.0125',
		octaves: 3,
		seed: 14,
		repeat: 5,
		stops: [
			[0, '#1530c8'],
			[0.13, '#2b6bff'],
			[0.19, '#78e6ff'],
			[0.25, '#2b4bf0'],
			[0.37, '#6a2cf0'],
			[0.48, '#ff3cc4'],
			[0.55, '#ffa0ea'],
			[0.61, '#ff3cc4'],
			[0.72, '#ec7a2e'],
			[0.82, '#b9452a'],
			[0.91, '#5a2ce0'],
			[1, '#1530c8']
		]
	})
);

/** Value noise on a wrapped lattice (cols × rows), smooth, 0–1: tiles without seams. */
function latticeNoise(rand: () => number, cols: number, rows: number) {
	const v = Array.from({ length: rows }, () => Array.from({ length: cols }, rand));
	const s = (t: number) => t * t * (3 - 2 * t);
	return (x: number, y: number) => {
		const gx = x * cols;
		const gy = y * rows;
		const x0 = Math.floor(gx);
		const y0 = Math.floor(gy);
		const tx = s(gx - x0);
		const ty = s(gy - y0);
		const at = (cx: number, cy: number) => v[((cy % rows) + rows) % rows][((cx % cols) + cols) % cols];
		const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
		const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
		return top + (bottom - top) * ty;
	};
}

/**
 * Empyros: digital camo of rounded blocks in navy, royal blue, cyan, teal and a little white.
 * A grid of cells coloured from smooth noise; runs of one colour become one rounded rectangle.
 */
function empyros(): string {
	const rand = random(5151);
	const CELL = 14;
	const COLS = 40;
	const ROWS = 18;
	const COLOURS = ['#0b2378', '#14409f', '#1f63d0', '#2c97e3', '#30c6e8', '#4fe3d2', '#dcefff'];
	const LIMITS = [0.36, 0.44, 0.51, 0.58, 0.65, 0.79];
	const coarse = latticeNoise(rand, 7, 3);
	const fine = latticeNoise(rand, 14, 6);
	const grid = Array.from({ length: ROWS }, (_, r) =>
		Array.from({ length: COLS }, (_, c) => {
			const x = (c + 0.5) / COLS;
			const y = (r + 0.5) / ROWS;
			const v = 0.55 * coarse(x, y) + 0.35 * fine(x, y) + 0.1 * rand();
			const i = LIMITS.findIndex((l) => v < l);
			return i === -1 ? LIMITS.length : i;
		})
	);
	const byColour: string[] = COLOURS.map(() => '');
	for (let r = 0; r < ROWS; r++) {
		for (let c = 0; c < COLS; ) {
			const colour = grid[r][c];
			let len = 1;
			while (c + len < COLS && grid[r][c + len] === colour) len++;
			if (colour > 0) {
				byColour[colour] += `<rect x='${c * CELL}' y='${r * CELL}' width='${len * CELL}' height='${CELL}' rx='5'/>`;
			}
			c += len;
		}
	}
	const groups = byColour.map((rects, i) => (rects ? `<g fill='${COLOURS[i]}'>${rects}</g>` : '')).join('');
	return `<svg xmlns='http://www.w3.org/2000/svg' width='${COLS * CELL}' height='${ROWS * CELL}'><rect width='100%' height='100%' fill='${COLOURS[0]}'/>${groups}</svg>`;
}

export const EMPYROS = url(empyros());

/**
 * Chiral: thin glowing red veins (the creases of turbulence noise) and a few embers, on nothing:
 * app.css puts the black-red smoke underneath and a blurred copy on top that pulses.
 */
function chiralVeins(): string {
	const rand = random(909);
	let specks = '';
	for (let i = 0; i < 28; i++) {
		const r = 0.6 + Math.pow(rand(), 2) * 2.2;
		specks += `<circle cx="${n1(4 + rand() * 512)}" cy="${n1(4 + rand() * 252)}" r="${n2(r)}" fill="#ff3020" opacity="${n2(0.5 + rand() * 0.5)}"/>`;
	}
	return noiseTile(
		520,
		260,
		{
			type: 'turbulence',
			freq: '0.009 0.014',
			octaves: 4,
			seed: 21,
			stops: [
				[0, '#ffd0c0', 1],
				[0.025, '#ff3a22', 1],
				[0.07, '#c00d06', 0.75],
				[0.13, '#5a0000', 0.25],
				[0.2, '#2a0000', 0],
				[1, '#000000', 0]
			]
		},
		specks
	);
}

export const CHIRAL = url(chiralVeins());

/** Ripple Tide: glossy black liquid with molten gold-orange streams (contour bands again). */
export const RIPPLE = url(
	noiseTile(520, 260, {
		freq: '0.0055 0.014',
		octaves: 4,
		seed: 33,
		repeat: 3,
		stops: [
			[0, '#050505'],
			[0.26, '#111111'],
			[0.34, '#3c3c3c'],
			[0.41, '#0b0b0b'],
			[0.6, '#070707'],
			[0.66, '#6a1e00'],
			[0.71, '#ff8400'],
			[0.76, '#ffd447'],
			[0.81, '#ff7400'],
			[0.87, '#4a1400'],
			[0.92, '#050505'],
			[1, '#050505']
		]
	})
);

/** Helio: billowing red fire clouds; the creases between them glow white-hot. */
export const HELIO = url(
	noiseTile(520, 260, {
		type: 'turbulence',
		freq: '0.0065 0.018',
		octaves: 4,
		seed: 47,
		stops: [
			[0, '#fff3cc'],
			[0.05, '#ffbe5c'],
			[0.1, '#ff6412'],
			[0.18, '#ef2700'],
			[0.3, '#c41000'],
			[0.45, '#8a0500'],
			[0.62, '#5a0000'],
			[1, '#3a0000']
		]
	})
);
