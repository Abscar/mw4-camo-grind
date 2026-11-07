/**
 * Textures for the Abscar theme's KPI tiles, so each tile looks like its camo: brushed noise
 * (for the Gold / Platinum / Harmonic Break metal) and low-poly chrome facets (Divergence).
 * Our own procedural SVGs, built once as data URLs; colours are layered on top in app.css.
 */

const url = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** Fine brushed-metal streaks: dark, semi-transparent, tiles seamlessly. */
export const BRUSHED = url(
	`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">` +
		`<filter id="n" x="0" y="0" width="100%" height="100%">` +
		`<feTurbulence type="fractalNoise" baseFrequency="0.75 0.04" numOctaves="3" seed="3" stitchTiles="stitch"/>` +
		`<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 -0.25"/>` +
		`</filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`
);

// small deterministic random generator, so the facets look the same on every load
let seed = 4242;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/** Crumpled chrome: a jittered grid split into triangles, each a different shade of grey. */
function facets(): string {
	const W = 320;
	const H = 160;
	const COLS = 9;
	const ROWS = 5;
	const pts: [number, number][][] = [];
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
	const tri = (a: [number, number], b: [number, number], c: [number, number]) =>
		`<path d="M${a.map((n) => n.toFixed(1)).join(' ')} L${b.map((n) => n.toFixed(1)).join(' ')} L${c.map((n) => n.toFixed(1)).join(' ')} Z" fill="${shade()}"/>`;
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
