/**
 * A repeating background tile drawn to look like Oden's "Hot Rod" camo, used behind the
 * weapon-class boxes in the Abscar theme. Matched against the camo's preview image:
 * candy red, darker around the flames; big S-curved flame tongues rising in clusters from
 * round roots; each tongue outlined with a thick gold line, an orange-red band outside it
 * (offset down-left, like the camo) and a dark red inside. Our own drawing, not the game's
 * texture. Built once as an SVG data URL.
 */

const W = 440;
const H = 320;
/** Bottom of the round roots inside the tile (the camo's flames sit in a band in the middle). */
const BASE = 262;

/** [centre x, root width, height, lean (1 = tip curls right, -1 = left), root drop in px] */
type Lick = [number, number, number, 1 | -1, number];

/** A tall S-curved tongue: fat round root at the bottom, waving up to a thin curled tip. */
function lick([cx, w, h, s, drop]: Lick): string {
	const base = BASE + drop;
	const r = w / 2;
	const cy = base - r;
	const x = (dx: number) => (cx + s * dx).toFixed(1);
	const y = (v: number) => v.toFixed(1);
	const top = base - h;
	return (
		`M${x(0.6 * w)} ${y(top)} ` +
		// outer side: waves out, in, and swells into the fat root
		`C${x(-0.3 * w)} ${y(base - 0.84 * h)} ${x(1 * w)} ${y(base - 0.62 * h)} ${x(0.62 * w)} ${y(base - 0.45 * h)} ` +
		`C${x(0.36 * w)} ${y(base - 0.33 * h)} ${x(1.12 * r)} ${y(cy - 1.35 * r)} ${x(r)} ${y(cy)} ` +
		`A${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${s === 1 ? 1 : 0} ${x(-r)} ${y(cy)} ` +
		// inner side: rises from the root with a matching wave back to the tip
		`C${x(-r)} ${y(cy - 1.7 * r)} ${x(-0.32 * w)} ${y(base - 0.42 * h)} ${x(0.04 * w)} ${y(base - 0.57 * h)} ` +
		`C${x(0.42 * w)} ${y(base - 0.73 * h)} ${x(-0.08 * w)} ${y(base - 0.9 * h)} ${x(0.6 * w)} ${y(top)} Z`
	);
}

// Two clusters per tile (a tall middle tongue with shorter ones beside it), plus fillers,
// drawn back to front so the front tongues' outlines sit on top, like the camo.
const BACK: Lick[] = [
	[96, 46, 200, 1, -6],
	[322, 46, 192, -1, -4],
	[208, 40, 132, -1, 6],
	[424, 38, 124, 1, 4]
];
const FRONT: Lick[] = [
	[58, 42, 146, -1, 10],
	[136, 42, 156, 1, 2],
	[176, 36, 98, 1, 16],
	[286, 42, 150, 1, 8],
	[362, 42, 140, -1, 0],
	[246, 36, 92, -1, 18],
	[14, 34, 88, 1, 14],
	[400, 34, 96, -1, 20]
];
/** Each tongue drawn at x − W, x and x + W, so the tile repeats seamlessly. */
const wrap = (licks: Lick[]): Lick[] =>
	licks.flatMap(([cx, w, h, s, drop]) => [-W, 0, W].map((d): Lick => [cx + d, w, h, s, drop]));

const tongue = (l: Lick) => {
	const d = lick(l);
	return (
		// thick orange-red band outside the gold line, offset down-left like the camo
		`<path d="${d}" transform="translate(-4 6)" fill="#e2401b" stroke="#e2401b" stroke-width="16" stroke-linejoin="round"/>` +
		// dark red inside, thick gold outline
		`<path d="${d}" fill="#5c0909" stroke="#f2b51f" stroke-width="6.5" stroke-linejoin="round"/>` +
		// a lighter gold highlight along the line
		`<path d="${d}" fill="none" stroke="#ffd35a" stroke-width="1.6" stroke-linejoin="round" opacity="0.7"/>`
	);
};

const svg =
	`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
	`<defs>` +
	`<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">` +
	`<stop offset="0" stop-color="#981616"/><stop offset="0.45" stop-color="#8c1313"/>` +
	`<stop offset="0.78" stop-color="#5f0a0a"/><stop offset="1" stop-color="#8e1313"/></linearGradient>` +
	`<radialGradient id="shade" cx="0.5" cy="0.62" r="0.55"><stop offset="0" stop-color="#4a0606" stop-opacity="0.55"/>` +
	`<stop offset="1" stop-color="#4a0606" stop-opacity="0"/></radialGradient>` +
	`</defs>` +
	`<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
	`<rect width="${W}" height="${H}" fill="url(#shade)"/>` +
	wrap(BACK).map(tongue).join('') +
	wrap(FRONT).map(tongue).join('') +
	`</svg>`;

/** CSS `url(...)` value of the tile, for `background-image`. */
export const HOTROD_TILE = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
