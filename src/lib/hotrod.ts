/**
 * A repeating background tile styled after Oden's "Hot Rod" camo, used behind the weapon-class
 * boxes in the Abscar theme: candy red, with a band of slim flame licks (round root at the bottom,
 * long curling tip) outlined twice, orange-red outside and gold inside, around a darker red middle.
 * Our own drawing in that style, not the game's texture. Built once as an SVG data URL.
 */

const W = 220;
const H = 170;
/** Bottom of the flames' round roots inside the tile. */
const BASE = 120;

/** [centre x, root width, height, lean (1 = tip curls right, -1 = left)] */
type Lick = [number, number, number, 1 | -1];

function lick([cx, w, h, s]: Lick): string {
	const r = w / 2;
	const cy = BASE - r;
	const x = (dx: number) => (cx + s * dx).toFixed(1);
	const y = (v: number) => v.toFixed(1);
	const tipY = BASE - h;
	return (
		`M${x(0.7 * w)} ${y(tipY)} ` +
		`C${x(0.05 * w)} ${y(BASE - 0.8 * h)} ${x(0.95 * w)} ${y(cy - 1.8 * r)} ${x(r)} ${y(cy)} ` +
		`A${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${s === 1 ? 1 : 0} ${x(-r)} ${y(cy)} ` +
		`C${x(-r)} ${y(cy - 2 * r)} ${x(-0.3 * w)} ${y(BASE - 0.62 * h)} ${x(0.1 * w)} ${y(BASE - 0.8 * h)} ` +
		`C${x(0.32 * w)} ${y(BASE - 0.9 * h)} ${x(0.5 * w)} ${y(BASE - 0.95 * h)} ${x(0.7 * w)} ${y(tipY)} Z`
	);
}

// tall licks behind, short ones in front, in little clusters like the camo
const LICKS: Lick[] = [
	[30, 17, 62, 1],
	[76, 16, 56, -1],
	[122, 18, 64, 1],
	[170, 16, 58, 1],
	[212, 17, 60, -1],
	[12, 14, 42, 1],
	[52, 15, 46, -1],
	[98, 14, 40, 1],
	[146, 15, 46, -1],
	[190, 14, 42, 1]
].flatMap(([cx, w, h, s]) => [-W, 0, W].map((d): Lick => [cx + d, w, h, s as 1 | -1]));

const svg =
	`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
	`<defs><linearGradient id="r" x1="0" y1="0" x2="0" y2="1">` +
	`<stop offset="0" stop-color="#a11515"/><stop offset="0.6" stop-color="#7a0e0e"/><stop offset="1" stop-color="#a11515"/>` +
	`</linearGradient></defs>` +
	`<rect width="${W}" height="${H}" fill="url(#r)"/>` +
	LICKS.map(
		(l) =>
			`<path d="${lick(l)}" fill="#6c0b0b" stroke="#e8461b" stroke-width="6" stroke-linejoin="round"/>` +
			`<path d="${lick(l)}" fill="none" stroke="#f6b91c" stroke-width="2.6" stroke-linejoin="round"/>`
	).join('') +
	`</svg>`;

/** CSS `url(...)` value of the tile, for `background-image`. */
export const HOTROD_TILE = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
