/**
 * Camo textures for the Abscar theme. KPI tiles: brushed noise (Gold / Platinum / Harmonic Break
 * metal) and low-poly chrome facets (Divergence). Divergence & Mastery rows: Divergence's rainbow
 * oil-slick contours, Polyatomic Reforged's crystal shards and Orion Reforged's galaxy.
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
