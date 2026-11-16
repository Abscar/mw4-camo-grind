/**
 * A cannabis leaf as SVG paths in a 24×24 box (the 420 pack, 2026-11-16): seven pointed leaflets fanned
 * out from the stem at (12, 20), longest in the middle, plus the stem. Our own drawing, shared by the
 * BurgiShop pin (ShopPin), the Leaf Storm effect (OpGear) and the 4:20 page (Four20Banner).
 * Pure (no browser APIs), so it's just numbers.
 */

const f = (n: number) => +n.toFixed(2);

/** One pointed leaflet from the stem base, `len` long, turned `deg` from straight up, `w` wide. */
function leaflet(deg: number, len: number, w: number): string {
	const a = (deg * Math.PI) / 180;
	const ux = Math.sin(a);
	const uy = -Math.cos(a);
	const tx = 12 + ux * len;
	const ty = 20 + uy * len;
	const mx = 12 + ux * len * 0.5;
	const my = 20 + uy * len * 0.5;
	const px = -uy * w;
	const py = ux * w;
	return `M12 20 Q${f(mx + px)} ${f(my + py)} ${f(tx)} ${f(ty)} Q${f(mx - px)} ${f(my - py)} 12 20 Z`;
}

/** The seven leaflets (left to right). */
export const LEAF_PATHS: string[] = [
	[-80, 6, 1.5],
	[-52, 8.5, 1.9],
	[-26, 10.5, 2.2],
	[0, 12.5, 2.4],
	[26, 10.5, 2.2],
	[52, 8.5, 1.9],
	[80, 6, 1.5]
].map(([deg, len, w]) => leaflet(deg, len, w));

/** The stem under the leaflets. */
export const LEAF_STEM = 'M12 20 L12 23.4';
