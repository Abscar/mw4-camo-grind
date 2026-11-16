/**
 * More drawings for the Cosmetics tab (the user's ask, 2026-11-16: "draw pictures for all the
 * stickers and decals where they're missing"). Same rules as cosmeticArt.ts: our own cartoon vector
 * redraws made while looking at a picture of the real item, never the game's files; plain SVG
 * without ids. Stickers 0 0 80 80, large decals 0 0 120 80.
 *
 * References (kept out of the repo): Activision's store pages (each bundle's item pictures,
 * callofduty.com/store/bundles/<id>, 16 Nov), itemshop.gg's pictures of the Emerald Reaper and
 * C.O.D.E. Valor Pack items, Activision's open beta rewards picture (Meonjeo) and codskins.co.uk's
 * promo picture of the Monster Energy rewards (Tagged, Death Grip; a code seller's graphic).
 *
 * `guess: true` = nobody has published a picture of the real item yet (Battle Pass tiers Activision
 * didn't show, the codmw4.wiki-only name). The user asked for a picture on everything, so these are
 * our idea from the name only, and the info box says so plainly.
 */
import type { CosmeticArt } from './cosmeticArt.ts';

const DECAL = '0 0 120 80';
const STICKER = '0 0 80 80';
const INK = '#16181a';

/** A sticker's die-cut: a grey hairline, a white border, then the sticker's own fill. */
const CUT = (d: string, fill = '#f4f2ec') =>
	`<path d="${d}" fill="#f4f2ec" stroke="#c2bcb0" stroke-width="7" stroke-linejoin="round"/>` +
	`<path d="${d}" fill="${fill}" stroke="#f4f2ec" stroke-width="4.4" stroke-linejoin="round"/>`;

/** The Canadian maple leaf, in a 100 × 90 box. */
const MAPLE =
	'M50 4L57 17L64 13L61 33L73 21L76 28L90 26L85 41L92 44L73 58L76 67L54 63L55 86H45L46 63L24 67L27 58L8 44L15 41L10 26L24 28L27 21L39 33L36 13L43 17Z';

/** Chain links along a line of points (Out Rocked). */
function chain(pts: [number, number][], c = '#2a2a33'): string {
	let s = '';
	for (let i = 0; i < pts.length - 1; i++) {
		const [x1, y1] = pts[i];
		const [x2, y2] = pts[i + 1];
		const cx = ((x1 + x2) / 2).toFixed(1);
		const cy = ((y1 + y2) / 2).toFixed(1);
		const a = ((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI).toFixed(0);
		const rx = (Math.hypot(x2 - x1, y2 - y1) / 2 + 0.9).toFixed(1);
		s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${i % 2 ? 1.1 : 2}" transform="rotate(${a} ${cx} ${cy})" fill="none" stroke="${c}" stroke-width="1.5"/>`;
	}
	return s;
}

/** A field of halftone dots (No Path, Greens Eat You). */
function dots(x0: number, y0: number, w: number, h: number, step: number, r: number, color: string): string {
	let s = `<g fill="${color}">`;
	for (let y = y0; y <= y0 + h; y += step) {
		const shift = Math.round((y - y0) / step) % 2 ? step / 2 : 0;
		for (let x = x0 + shift; x <= x0 + w; x += step) s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`;
	}
	return s + '</g>';
}

/** One finger or arm bone: a dark outline under a coloured core. */
const bone = (d: string, w: number, core: string, edge: string) =>
	`<path d="${d}" fill="none" stroke="${edge}" stroke-width="${w + 2.4}" stroke-linecap="round" stroke-linejoin="round"/>` +
	`<path d="${d}" fill="none" stroke="${core}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

export const MORE_ART: Record<string, CosmeticArt> = {
	// ===== Large decals =====

	// Monster Energy codes: "TAGGED" in lime graffiti letters with a black outline, a dark green 3D
	// edge, drips and spray dots
	'decal-tagged': {
		viewBox: DECAL,
		after: 'codskins.co.uk’s promo picture of the Monster Energy rewards (a code seller’s graphic, not Activision’s)',
		svg:
			`<g fill="#9be22c" opacity=".85"><circle cx="10" cy="20" r="2.4"/><circle cx="16" cy="12" r="1.4"/><circle cx="108" cy="16" r="2"/><circle cx="114" cy="26" r="1.2"/><circle cx="104" cy="66" r="1.8"/><circle cx="12" cy="62" r="1.6"/><circle cx="20" cy="70" r="1"/><circle cx="98" cy="8" r="1"/></g>` +
			`<g transform="rotate(-7 60 40)" font-family="Impact, 'Arial Black', sans-serif" font-size="34" font-weight="700" font-style="italic">` +
			`<path d="M22 52v9M37 52v14M57 52v7M74 52v12M92 52v8" stroke="#0e1a06" stroke-width="5.4" stroke-linecap="round"/>` +
			`<path d="M22 52v9M37 52v14M57 52v7M74 52v12M92 52v8" stroke="#b8f03a" stroke-width="3" stroke-linecap="round"/>` +
			`<text x="13" y="54" textLength="94" lengthAdjust="spacingAndGlyphs" fill="#2f5a0e" stroke="#0e1a06" stroke-width="5" stroke-linejoin="round">TAGGED</text>` +
			`<text x="11" y="52" textLength="94" lengthAdjust="spacingAndGlyphs" fill="#b8f03a" stroke="#0e1a06" stroke-width="1.6" stroke-linejoin="round">TAGGED</text>` +
			`<path d="M16 34l10-1M44 33l8 0M78 33l8 1" stroke="#eaffb8" stroke-width="1.6" stroke-linecap="round"/>` +
			`</g>` +
			`<path d="M10 70c34 8 70 6 100-8" fill="none" stroke="#0e1a06" stroke-width="4.6" stroke-linecap="round"/><path d="M10 70c34 8 70 6 100-8" fill="none" stroke="#b8f03a" stroke-width="2.4" stroke-linecap="round"/>` +
			`<path d="M104 58l8 3-7 5" fill="none" stroke="#0e1a06" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M104 58l8 3-7 5" fill="none" stroke="#b8f03a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
	},

	// Battle Pass tier 56, no picture published: a huge toothy grin on a dark slab
	'decal-griiiiin': {
		viewBox: DECAL,
		guess: true,
		after: 'the name only',
		svg:
			`<path d="M8 22c10-10 30-14 52-14s42 4 52 14l-4 34c-10 12-30 18-48 18S22 68 12 56z" fill="#1d1f24" stroke="#f4f2ec" stroke-width="3"/>` +
			`<path d="M16 30c14 8 30 12 44 12s30-4 44-12c-2 16-8 28-18 34-8 4-18 6-26 6s-18-2-26-6c-10-6-16-18-18-34z" fill="#5a0f16" stroke="${INK}" stroke-width="1.6"/>` +
			// upper teeth, then lower teeth
			`<path d="M18 32l6 9 5-7 5 8 5-7 5 8 5-7 5 8 6-7 6 7 5-8 5 7 5-8 5 7 5-8 5 7 5-9c-14 7-30 11-44 11S32 39 18 32z" fill="#f4efdc" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>` +
			`<path d="M28 60l5-9 4 8 5-9 5 9 5-9 5 9 6-9 5 9 5-9 5 9 5-9 4 9c-8 4-17 6-25 6s-17-2-24-6z" fill="#f4efdc" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>` +
			`<path d="M16 30c-4-2-6-6-4-10M104 30c4-2 6-6 4-10" fill="none" stroke="#e8463a" stroke-width="2" stroke-linecap="round"/>` +
			`<path d="M24 16q36-8 72 0" fill="none" stroke="#3a3d44" stroke-width="2" stroke-linecap="round"/>`
	},

	// Battle Pass tier 84, no picture published: an operator's hard stare between helmet brim and
	// balaclava, eyes lit red
	'decal-combat-stare': {
		viewBox: DECAL,
		guess: true,
		after: 'the name only',
		svg:
			`<path d="M6 18c18-10 90-10 108 0v44c-18 10-90 10-108 0z" fill="#f4f2ec"/>` +
			`<path d="M9 20c18-9 84-9 102 0v40c-18 9-84 9-102 0z" fill="#262a2c" stroke="${INK}" stroke-width="1.4"/>` +
			// helmet brim and balaclava edge
			`<path d="M9 20c18-9 84-9 102 0l-2 10c-20-6-78-6-98 0z" fill="#4b5240" stroke="${INK}" stroke-width="1.2"/><path d="M14 27c20-5 72-5 92 0" stroke="#6a7258" stroke-width="1.4" fill="none"/>` +
			`<path d="M11 50c20 6 78 6 98 0v10c-18 9-80 9-98 0z" fill="#17191b" stroke="${INK}" stroke-width="1.2"/>` +
			// skin strip, brows pulled down
			`<path d="M11 31c20-5 78-5 98 0v19c-20 6-78 6-98 0z" fill="#b98a68"/>` +
			`<path d="M26 34l20 5M94 34l-20 5" stroke="#2a1c12" stroke-width="3.4" stroke-linecap="round"/>` +
			`<path d="M27 42c6-5 16-5 21 1-5 4-15 4-21-1zM72 43c5-6 15-6 21-1-6 5-16 5-21 1z" fill="#f2ece2" stroke="${INK}" stroke-width="1.2"/>` +
			`<circle cx="38" cy="42.6" r="3.2" fill="#3a2a1e"/><circle cx="82" cy="42.6" r="3.2" fill="#3a2a1e"/><circle cx="38" cy="42.6" r="1.4" fill="#e8302a"/><circle cx="82" cy="42.6" r="1.4" fill="#e8302a"/>` +
			`<path d="M58 40v8" stroke="#8a6248" stroke-width="1.4" stroke-linecap="round"/><path d="M20 46q8 3 16 3M84 49q8 0 16-3" stroke="#8a6248" stroke-width="1" fill="none"/>` +
			`<path d="M100 36l6-3M104 42l7 0M100 48l6 3M14 33l-6-3M10 42H3M14 48l-6 3" stroke="#e8302a" stroke-width="1.4" stroke-linecap="round"/>`
	},

	// ===== Stickers from the store =====

	// Into the Fight: a green skeleton hand throwing horns, wrapped in a black chain, on a scratchy
	// hot-pink burst
	'sticker-out-rocked': {
		viewBox: STICKER,
		after: 'Activision’s store picture of the Into the Fight bundle',
		svg:
			`<g transform="rotate(-6 40 40)">` +
			CUT('M8 20L30 22L36 5L46 22L68 8L60 28L76 32L60 42L72 66L50 54L44 76L34 56L10 70L22 48L4 42L20 32Z', '#dc46b4') +
			`<path d="M14 40l14-12M22 50l24-22M30 60l28-26M40 64l22-18M26 30l10-8M50 48l14-10" stroke="#f79ae0" stroke-width="1.1" stroke-linecap="round"/>` +
			`<path d="M18 46l20-18M36 58l20-16" stroke="#9c2a80" stroke-width="1" stroke-linecap="round"/>` +
			`</g>` +
			`<g transform="rotate(-30 44 48)">` +
			bone('M37 80V57M45 80V57', 3.4, '#a6d65a', '#1d2a12') +
			`<path d="M33 50h16v7H33z" fill="#a6d65a" stroke="#1d2a12" stroke-width="1.5" stroke-linejoin="round"/>` +
			`<path d="M33 40h14a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H33a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3z" fill="#a6d65a" stroke="#1d2a12" stroke-width="1.5"/><path d="M38 41v8M43 41v8" stroke="#1d2a12" stroke-width="1.1"/>` +
			bone('M33 41L32 30L31 19M48 41L49 32L50 24', 3.2, '#a6d65a', '#1d2a12') +
			`<circle cx="32" cy="30" r="2" fill="#c8ec8a" stroke="#1d2a12" stroke-width="1"/><circle cx="49" cy="32" r="1.8" fill="#c8ec8a" stroke="#1d2a12" stroke-width="1"/>` +
			bone('M29 47l8-3', 2.8, '#a6d65a', '#1d2a12') +
			`<path d="M36 76V61M31.6 27l-.4-6M48.6 30l.6-4" stroke="#dcf7b0" stroke-width="1" stroke-linecap="round"/>` +
			`</g>` +
			chain([[56, 26], [60, 32], [59, 39], [54, 44], [51, 51], [55, 57], [62, 59], [67, 54], [66, 48], [60, 48], [55, 54], [54, 62], [59, 68], [66, 71], [70, 76]])
	},

	// Northern Elite: a red-and-cyan "x-ray" operator aiming a scoped rifle to the right, his ribs and
	// teeth showing through, in front of a red maple leaf
	'sticker-maple-patrol': {
		viewBox: STICKER,
		after: 'Activision’s store picture of the Northern Elite bundle',
		svg:
			`<g transform="translate(5 0) scale(.72 .68)"><path d="${MAPLE}" fill="#7a1a18" transform="translate(5 4)"/><path d="${MAPLE}" fill="#e3241f" stroke="#7a1a18" stroke-width="2"/></g>` +
			`<g stroke="#1a1a1a" stroke-width="1.1" stroke-linejoin="round">` +
			// torso, cut off at a slant
			`<path d="M12 66l1-26c1-7 7-11 14-11h15c7 0 12 4 13 11l1 26-14-3z" fill="#d8262a"/>` +
			`<path d="M22 60l12-2 12 2v6l-12-3-12 3z" fill="#9e1c1e" stroke="none"/>` +
			// x-ray ribs, spine and hips
			`<path d="M24 41q6 4 9 1M43 41q-6 4-9 1M24 45.4q6 4 9 1M43 45.4q-6 4-9 1M25 49.8q5 3 8 1M42 49.8q-5 3-8 1M26 54q4 2 7 .6M41 54q-4 2-7 .6" fill="none" stroke="#2a8ab8" stroke-width="2.4"/>` +
			`<path d="M24 41q6 4 9 1M43 41q-6 4-9 1M24 45.4q6 4 9 1M43 45.4q-6 4-9 1M25 49.8q5 3 8 1M42 49.8q-5 3-8 1M26 54q4 2 7 .6M41 54q-4 2-7 .6" fill="none" stroke="#6ae2f2" stroke-width="1.2"/>` +
			`<path d="M33.5 39v24" stroke="#6ae2f2" stroke-width="2" stroke-dasharray="2 1"/><path d="M26 63c2-4 6-4 7.5-1 1.5-3 5.5-3 7.5 1" fill="none" stroke="#6ae2f2" stroke-width="1.4"/>` +
			// arms
			`<path d="M16 33c-6 4-8 12-6 18 1 3 4 4 7 2l10-9-3-5-6 4c0-4 1-7 3-9z" fill="#d8262a"/><path d="M13 40l-1 10 12-7" fill="none" stroke="#6ae2f2" stroke-width="1.1"/>` +
			`<path d="M53 34c4 6 3 11-3 14l-6 1-1-5c4-1 6-3 6-6z" fill="#d8262a"/>` +
			// helmet, face, round goggles
			`<path d="M20 21c0-8 5-14 11-14s10 5 10 12l-1 4H21z" fill="#e3241f"/><path d="M27 10h5v5h-5z" fill="#b81e1e"/><path d="M27.6 5.6h3.6v4.4h-3.6z" fill="#e3241f"/><path d="M38 11v10" stroke="#7a1a18" stroke-width="2"/>` +
			`<path d="M22 21h17c0 5-3 9-8.5 9S22 26 22 21z" fill="#f4bcbc"/>` +
			`<circle cx="26" cy="23" r="3.2" fill="#6ae2f2"/><circle cx="33" cy="22.8" r="3.2" fill="#6ae2f2"/><path d="M24.4 24.4a2 2 0 0 0 3.2 0M31.4 24.2a2 2 0 0 0 3.2 0" fill="none" stroke="#2a8ab8" stroke-width="1" stroke-linecap="round"/>` +
			`</g>` +
			`<path d="M23 12c2-3 5-4 8-4M14 38c2-5 6-7 10-7" fill="none" stroke="#f8c6c6" stroke-width="1.2" stroke-linecap="round"/>` +
			// the scoped, suppressed rifle on a slant, muzzle low right
			`<g transform="translate(18 26) rotate(27)" stroke="#1a1a1a" stroke-width="1" stroke-linejoin="round">` +
			`<path d="M-6-3h14v7H2l-2 3h-6z" fill="#c2201f"/><path d="M8-3.4h20v6.4H8z" fill="#e3241f"/><path d="M15 3h5l1 12h-5z" fill="#c2201f"/>` +
			`<path d="M28-2.8h20v5.6H28z" fill="#e3241f"/><path d="M30-1h16" stroke="#7a1a18" stroke-width="1.2" stroke-dasharray="1.4 1"/>` +
			`<path d="M48-2.6h11a2.6 2.6 0 0 1 0 5.2H48z" fill="#e3241f"/><path d="M50 0h8" stroke="#f8c6c6" stroke-width="1.2" stroke-dasharray=".8 1.2"/>` +
			`<path d="M42 3l-2 9M46 3l2 9" fill="none" stroke-width="1.4"/>` +
			`<path d="M6-8.6h16v4H6z" fill="#e3241f"/><path d="M10-4.6v1.4M18-4.6v1.4" fill="none"/><circle cx="23" cy="-6.6" r="3.6" fill="#e3241f"/><circle cx="23.6" cy="-6.6" r="2.2" fill="#1a1a1a" stroke="none"/>` +
			`<path d="M9-2.2h18M29-1.8h18" stroke="#f8c6c6" stroke-width=".8"/>` +
			`</g>` +
			// hands on the grip and under the handguard
			`<g stroke="#1a1a1a" stroke-width="1" fill="#f4bcbc"><path d="M24 34c3-2 7-1 8 2l-1 5c-3 2-7 1-8-2z"/><path d="M40 42c3-2 7-1 8 2l-1 5c-3 2-7 1-8-2z"/></g>` +
			`<path d="M25 37h6M25.4 39.4h5M41 45h6M41.4 47.4h5" stroke="#2a8ab8" stroke-width="1"/>`
	},

	// Jadefire: an ornate bronze dragon face (round staring eyes, flared nose, tusks) with a curling
	// jade-green beard
	'sticker-regal-snake': {
		viewBox: STICKER,
		after: 'Activision’s store picture of the Jadefire bundle',
		svg:
			CUT('M12 20c2-8 8-12 14-10l4-6 10 3 10-3 4 6c6-2 12 2 14 10 4 6 4 14 0 20 2 10 0 18-6 24l-4 8c-6 8-30 8-36 0l-4-8c-6-6-8-14-6-24-4-6-4-14 0-20z') +
			`<g stroke="#3a2210" stroke-linejoin="round">` +
			`<path d="M21 17l-7-9 11 4zM59 17l7-9-11 4zM31 13l1-8 5 7zM49 13l-1-8-5 7zM40 11l-3-7h6z" fill="#c8873f" stroke-width="1.1"/>` +
			`<path d="M16 23c4-8 14-12 24-12s20 4 24 12c3 7 2 16-2 22l-4 9H22l-4-9c-4-6-5-15-2-22z" fill="#b5743c" stroke-width="1.4"/>` +
			`<path d="M16 25c-2 8 0 15 4 20l3 7c-5-8-6-18-1-27z" fill="#7a4a22" stroke="none"/><path d="M64 25c2 8 0 15-4 20l-3 7c5-8 6-18 1-27z" fill="#7a4a22" stroke="none"/>` +
			`<path d="M15 25c-6 2-9 8-7 14 2-2 4-3 7-3M65 25c6 2 9 8 7 14-2-2-4-3-7-3" fill="#c8873f" stroke-width="1"/>` +
			`<path d="M34 16q6-4 12 0l-2 6h-8z" fill="#e0a865" stroke-width="1"/>` +
			`<path d="M27 21q2-2 4 0M51 21q-2-2-4 0M30 24.4q2-2 4 0M50 24.4q-2-2-4 0M37 25q3-2 6 0" fill="none" stroke="#7a4a22" stroke-width=".9"/>` +
			`<path d="M19 27c5-6 12-6 16-1l-2 2c-4-3-9-3-13 1zM61 27c-5-6-12-6-16-1l2 2c4-3 9-3 13 1z" fill="#e0a865" stroke-width="1.1"/>` +
			`<circle cx="29" cy="31.6" r="5" fill="#fbf4e2" stroke-width="1.2"/><circle cx="51" cy="31.6" r="5" fill="#fbf4e2" stroke-width="1.2"/><circle cx="29.6" cy="31.6" r="2" fill="#1e1208" stroke="none"/><circle cx="50.4" cy="31.6" r="2" fill="#1e1208" stroke="none"/>` +
			`<path d="M23.6 29.4c3-3.4 8-3.4 11 0M45.4 29.4c3-3.4 8-3.4 11 0" fill="none" stroke-width="2"/>` +
			`<path d="M18 37c4 0 6 3 5 6M62 37c-4 0-6 3-5 6" fill="none" stroke-width="1.2"/>` +
			`<path d="M33 39c2-4 12-4 14 0 2 4-1 8-7 8s-9-4-7-8z" fill="#d89a5a" stroke-width="1.2"/><ellipse cx="36.4" cy="42.6" rx="1.8" ry="1.3" fill="#3a2210" stroke="none"/><ellipse cx="43.6" cy="42.6" rx="1.8" ry="1.3" fill="#3a2210" stroke="none"/>` +
			`<path d="M24 50c6 3 26 3 32 0l-2 7c-6 3-22 3-28 0z" fill="#4a1a10" stroke-width="1.2"/><path d="M27 51l26 0-1 2.4H28z" fill="#f4ecd6" stroke="none"/>` +
			`<path d="M28 50l2 8 2-8zM48 50l2 8 2-8z" fill="#f4ecd6" stroke-width=".9"/>` +
			`</g>` +
			`<g stroke="#1f5a50" stroke-linejoin="round" stroke-linecap="round">` +
			`<path d="M22 55c4 8 10 14 18 16 8-2 14-8 18-16l-3 9c-4 7-26 7-30 0z" fill="#57b8a0" stroke-width="1.2"/>` +
			`<path d="M22 57c-6 2-10 8-8 14 2-4 5-6 8-6M58 57c6 2 10 8 8 14-2-4-5-6-8-6" fill="none" stroke-width="4.4"/><path d="M22 57c-6 2-10 8-8 14 2-4 5-6 8-6M58 57c6 2 10 8 8 14-2-4-5-6-8-6" fill="none" stroke="#57b8a0" stroke-width="2.4"/>` +
			`<path d="M34 62q6 4 12 0M37 66q3 2 6 0" fill="none" stroke-width="1"/>` +
			`</g>` +
			`<path d="M24 20q16-8 32 0" fill="none" stroke="#e8b878" stroke-width="1.2" stroke-linecap="round"/>`
	},

	// The Captain: a grinning grey skull with a dark beard, glowing red eyes, an olive boonie hat and a
	// lit cigar
	'sticker-still-hot': {
		viewBox: STICKER,
		after: 'Activision’s store picture of The Captain bundle',
		svg:
			`<g transform="rotate(-6 40 40)">` +
			CUT('M8 30c0-14 14-24 32-24s34 8 34 22c0 6-4 10-10 12 2 14-4 30-18 34-12 4-26-2-30-14-2-6-2-12 0-16-6-4-8-10-8-14z') +
			`<g stroke="${INK}" stroke-linejoin="round">` +
			`<path d="M24 34c0-8 7-12 16-12s16 4 16 12v10c0 8-4 16-16 18-12-2-16-10-16-18z" fill="#cfcec8" stroke-width="1.3"/>` +
			`<path d="M24 40c0 8 4 16 12 20-8-2-12-10-12-20z" fill="#8f8e88" stroke="none"/>` +
			`<path d="M27 36c2-3 9-3 11 1l-2 6h-7zM42 37c2-4 9-4 11-1l-2 7h-7z" fill="#1a1a1a" stroke-width="1"/>` +
			`<circle cx="33" cy="39.6" r="3.4" fill="#ff3b2a" opacity=".35" stroke="none"/><circle cx="47" cy="39.6" r="3.4" fill="#ff3b2a" opacity=".35" stroke="none"/><circle cx="33" cy="39.6" r="1.6" fill="#ff5a3a" stroke="none"/><circle cx="47" cy="39.6" r="1.6" fill="#ff5a3a" stroke="none"/>` +
			`<path d="M39.6 44l-2 5h4.6z" fill="#1a1a1a" stroke="none"/>` +
			`<path d="M22 44c2 12 8 20 18 22 10-2 16-10 18-22l-4 6c-2 4-6 6-14 6s-12-2-14-6z" fill="#3a2a1c" stroke-width="1.2"/>` +
			`<path d="M30 50c4-2 16-2 20 0l-2 3c-4-1-12-1-16 0z" fill="#2a1e14" stroke="none"/>` +
			`<path d="M32 53h16l-1 5H33z" fill="#ece8dc" stroke-width=".9"/><path d="M36 53v5M40 53v5M44 53v5" stroke-width=".7"/>` +
			`<path d="M20 28c0-10 8-16 20-16s20 6 20 16z" fill="#4f5a3a" stroke-width="1.3"/><path d="M50 17h6v6h-6z" fill="#3f4830" stroke-width=".8"/>` +
			`<path d="M10 30c8-6 52-8 62 0l-6 6c-12-4-38-4-50 0z" fill="#5a6644" stroke-width="1.3"/><path d="M20 29c10-3 30-3 40 0" fill="none" stroke="#2c331f" stroke-width="1.6"/>` +
			`<path d="M31 55l-17 9 2 3 17-9z" fill="#b8874a" stroke-width="1"/><path d="M26.4 57.6l1.6 3" stroke="#a82820" stroke-width="1.4"/>` +
			`<path d="M14 64l-3 2 2 3 3-2z" fill="#ffb03a" stroke-width=".8"/>` +
			`</g>` +
			`<path d="M10 64c-3-3-2-7 1-9M8 60c-2-2-1-5 1-6" fill="none" stroke="#b9b6ae" stroke-width="1.2" stroke-linecap="round"/>` +
			`<path d="M16 32q24-6 48-2" fill="none" stroke="#7d8a62" stroke-width="1" stroke-linecap="round"/>` +
			`</g>`
	},

	// No Man's Land: a purple-haired fighter in a teal gas mask, a red halftone patch behind, the red
	// word 죽음 ("death") along the bottom, on a dark tilted die-cut
	'sticker-no-path': {
		viewBox: STICKER,
		after: 'Activision’s store picture of the No Man’s Land bundle',
		svg:
			CUT('M10 26L44 8L74 20L70 54L60 76L14 70L6 46Z', '#18191e') +
			dots(10, 36, 30, 20, 2.6, 0.8, '#c8282a') +
			`<g stroke="${INK}" stroke-linejoin="round">` +
			`<path d="M30 10c10-6 26-4 32 6 4 8 2 18-2 24l-6-12c-6 2-14 0-18-4-4 4-6 8-6 14l-4-8c-2-8 0-16 4-20z" fill="#5e3f86" stroke-width="1.2"/>` +
			`<path d="M36 12c6-2 14-1 18 3M44 16c4 0 8 2 10 6" fill="none" stroke="#9a7ac8" stroke-width="1"/>` +
			`<path d="M34 22c8-2 18 2 20 10l-2 12c-2 6-8 10-14 10s-10-6-10-12z" fill="#e9d7cf" stroke-width="1.2"/>` +
			`<path d="M43 30c3-2 7-1 8 2-3 2-6 2-8-2z" fill="#f2c0d8" stroke-width=".9"/><circle cx="47" cy="31" r="1.2" fill="#d0307a" stroke="none"/><path d="M42 28l9-1" stroke-width="1.2"/>` +
			`<path d="M20 38c0-8 8-12 16-10l6 4v10c0 8-6 14-14 14s-10-8-8-18z" fill="#2f6e72" stroke-width="1.3"/>` +
			`<circle cx="30" cy="34" r="5.4" fill="#123236" stroke-width="1"/><path d="M27 32a3.6 3.6 0 0 1 4-2" fill="none" stroke="#9ee6e8" stroke-width="1" stroke-linecap="round"/>` +
			`<circle cx="31" cy="47" r="6" fill="#23585c" stroke-width="1.1"/><circle cx="31" cy="47" r="3.6" fill="none" stroke="#123236" stroke-width="1"/><path d="M28 47h6M31 44v6" stroke="#123236" stroke-width=".9"/>` +
			`<path d="M42 36l12 4" stroke="#123236" stroke-width="2"/>` +
			`</g>` +
			`<g transform="translate(22 54) skewX(-14)" fill="#e5392f" stroke="#7a1410" stroke-width=".6">` +
			`<path d="M2 0h12v3H9.4l4.6 5-2.4 2-4.4-4.4L2.8 10 .4 8 5 3H2z"/><path d="M0 11h17v3h-7v4H7v-4H0z"/><path d="M1 18h15v6h-3v-3H1z"/>` +
			`<circle cx="28" cy="4" r="3.4" fill="none" stroke="#e5392f" stroke-width="2.6"/><path d="M20 10h17v3H20z"/><rect x="23.4" y="16.4" width="10.2" height="6.2" fill="none" stroke="#e5392f" stroke-width="2.8"/>` +
			`</g>`
	},

	// Elite Squad: Gaksuli: a red opera-style face mask with white panels, sweeping black eye marks and
	// three dots down the forehead
	'sticker-masquerade': {
		viewBox: STICKER,
		after: 'Activision’s store picture of the Elite Squad: Gaksuli bundle',
		svg:
			CUT('M16 22c2-12 12-18 24-18s22 6 24 18c2 14 0 30-6 40-4 8-10 14-18 14s-14-6-18-14c-6-10-8-26-6-40z', '#c8202a') +
			`<path d="M17 24c-2 14 0 28 6 38 4 7 8 11 12 13-6-8-10-20-10-34 0-8 2-14 4-19zM63 24c2 14 0 28-6 38-4 7-8 11-12 13 6-8 10-20 10-34 0-8-2-14-4-19z" fill="#8f1519"/>` +
			`<g fill="#f2eeea">` +
			`<path d="M32 8l8-4 8 4-4 15h-8z"/>` +
			`<path d="M18 30c6-4 14-2 18 4l-2 10c-6 0-12-4-16-8zM62 30c-6-4-14-2-18 4l2 10c6 0 12-4 16-8z"/>` +
			`<path d="M38 22h4l2 40-4 6-4-6z"/>` +
			`<path d="M30 58c4 4 16 4 20 0l-2 8c-4 3-12 3-16 0z"/>` +
			`</g>` +
			`<circle cx="40" cy="10" r="2.2" fill="#c8202a"/><circle cx="40" cy="15.4" r="1.8" fill="#c8202a"/><circle cx="40" cy="20" r="1.4" fill="#c8202a"/>` +
			`<path d="M19 32l15 6-2 3-13-5zM61 32l-15 6 2 3 13-5z" fill="#1a1416"/>` +
			`<path d="M22 26l12 4M58 26l-12 4" stroke="#1a1416" stroke-width="2.6" stroke-linecap="round"/>` +
			`<path d="M26 38q5 2 9 1M54 38q-5 2-9 1" stroke="#1a1416" stroke-width="1.4" fill="none" stroke-linecap="round"/>` +
			`<path d="M35 48c-2 2-2 4 0 5M45 48c2 2 2 4 0 5M34 61h12" stroke="#8f1519" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
			`<path d="M24 14c6-6 14-8 22-6" stroke="#ff9a9a" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
	},

	// CDL Launch Pack 2027: a pale cracked skull over two crossed katanas, handles up
	'sticker-death-skull': {
		viewBox: STICKER,
		after: 'Activision’s store picture of the CDL Launch Pack 2027',
		svg:
			(
				[
					['M26 26L69 71', 'M9 9L22 22', 24],
					['M54 26L11 71', 'M71 9L58 22', 56]
				] as const
			)
				.map(
					([blade, grip, gx]) =>
						`<path d="${blade}" stroke="#2c3550" stroke-width="7.4" stroke-linecap="square"/><path d="${blade}" stroke="#8fa8e0" stroke-width="5" stroke-linecap="square"/>` +
						`<path d="${grip}" stroke="#15161c" stroke-width="6.4" stroke-linecap="round"/><path d="${grip}" stroke="#6a7088" stroke-width="4" stroke-dasharray="2 2"/>` +
						`<circle cx="${gx}" cy="24" r="4.4" fill="#c4c6d0" stroke="#2c3550" stroke-width="1.2"/>`
				)
				.join('') +
			`<path d="M27 25L70 69M53 25L10 69" stroke="#e4ecff" stroke-width="1.1"/>` +
			`<g stroke="#3a3850" stroke-linejoin="round">` +
			`<path d="M24 32c0-12 7-20 16-20s16 8 16 20c0 6-2 10-5 12v8c-3 4-19 4-22 0v-8c-3-2-5-6-5-12z" fill="#e6e3f0" stroke-width="1.4"/>` +
			`<path d="M24 32c0 6 2 10 5 12v8c-3-6-4-14-1-22z" fill="#b2aed0" stroke="none"/>` +
			`<path d="M40 12l-2 6 4 4-3 6 2 4M38 18l-5 2M42 22l5 1" fill="none" stroke-width="1.1"/>` +
			`<path d="M28 34c2-4 8-4 10 0 0 4-2 6-5 6s-5-2-5-6zM42 34c2-4 8-4 10 0 0 4-2 6-5 6s-5-2-5-6z" fill="#2a2840" stroke="none"/>` +
			`<path d="M38 45l2-4 2 4-2 2z" fill="#2a2840" stroke="none"/>` +
			`<path d="M31 50h18M34 47.6v6M38 47.6v6.4M42 47.6v6.4M46 47.6v6" fill="none" stroke-width="1"/>` +
			`</g>`
	},

	// Steadfast: a screaming man's head cut into slices, a black mohawk on top, tongue out
	'sticker-cross-section': {
		viewBox: STICKER,
		after: 'Activision’s store picture of the Steadfast bundle',
		svg:
			CUT('M8 30c2-14 14-24 32-24 16 0 28 10 30 26 2 14-4 26-14 32-6 10-18 14-28 10-12-4-18-16-20-28-2-6-2-12 0-16z') +
			`<path d="M24 15l2-12 4 7 3-9 3 8 5-8 1 9 6-6-1 9 6-3-4 9z" fill="#1a1a1a"/>` +
			`<g stroke="${INK}" stroke-linejoin="round">` +
			`<path d="M11 32c2-12 12-20 28-20 14 0 26 8 28 22 2 12-2 22-12 28-6 8-16 12-26 8-10-4-16-14-18-26-1-4-1-8 0-12z" fill="#e3ad84" stroke-width="1.3"/>` +
			`<path d="M52 16c10 4 16 12 16 20 0 10-4 18-10 22 2-14 0-28-6-42z" fill="#c98e66" stroke="none"/>` +
			`<path d="M58 40c5-2 9 2 8 8-1 4-4 6-7 5z" fill="#d99c74" stroke-width="1.1"/><path d="M60 43c2 0 3 2 2 4" fill="none" stroke-width=".8"/>` +
			`<path d="M10 27l9 1.4M27 27l11 2" stroke-width="2.2" stroke-linecap="round"/>` +
			`<path d="M11 31c2-2 6-2 7 1-2 1-5 1-7-1zM28 31c2-3 8-3 10 1-3 2-7 2-10-1z" fill="#fff" stroke-width=".9"/><circle cx="15" cy="31.4" r="1.1" fill="#3a7ad0" stroke="none"/><circle cx="33" cy="31.4" r="1.4" fill="#3a7ad0" stroke="none"/>` +
			`<path d="M15 22q8-2 16 0M17 18.6q7-2 13 0" fill="none" stroke="#a8724e" stroke-width="1"/>` +
			`<path d="M19 31c-2 4-4 7-3 9 2 1 5 1 7-1" fill="#d49a72" stroke-width="1"/>` +
			`<path d="M12 44c4-2 22-2 27 1l-3 18c-4 6-16 6-20 2z" fill="#4a1414" stroke-width="1.3"/>` +
			`<path d="M13 45l2 4 2-3.6 2 4 2-3.6 2 4 2-3.6 2 4 2-3.6 2 4 2-3.6 2 3.6 2-3" fill="#f2eedd" stroke-width=".8"/>` +
			`<path d="M18 63l2-3.6 2 3.4 2-3.6 2 3.4 2-3.6 2 3.4 2-3.6 2 3" fill="#f2eedd" stroke-width=".8"/>` +
			`<path d="M14 46l1 10 2-9zM36 47l-1 9-2-8z" fill="#f2eedd" stroke-width=".8"/>` +
			`<path d="M12 56c4-4 15-6 23-2 1 3-2 6-8 6-6 0-11-1-15-4zM12 56c-3 1-4 3-3 5 2 0 4-1 5-3" fill="#e06a84" stroke-width=".9"/><path d="M18 57q6-1 10 1" fill="none" stroke="#a83a52" stroke-width=".8"/>` +
			`</g>` +
			// the cuts: dark gap, pale cut face, a darker layer line inside
			['M12 26c-2 10-1 24 4 40', 'M25 13c-3 14-2 34 4 53', 'M44 12c-2 16-2 34 3 50', 'M56 20c2 12 2 24-1 36']
				.map(
					(d) =>
						`<path d="${d}" fill="none" stroke="${INK}" stroke-width="4.4"/><path d="${d}" fill="none" stroke="#cfc0a4" stroke-width="2.8"/><path d="${d}" fill="none" stroke="#8a7a62" stroke-width=".6"/>`
				)
				.join('') +
			`<path d="M30 16c6-3 12-3 18-1" stroke="#f6d2b4" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
	},

	// Emerald Reaper (platform stores): a neon-green broccoli monster with a purple screaming mouth,
	// orange halftone behind
	'sticker-greens-eat-you': {
		viewBox: STICKER,
		after: 'itemshop.gg’s picture of the Emerald Reaper bundle’s sticker',
		svg:
			CUT('M8 40c-4-12 4-26 16-30 6-8 22-10 32-4 12 2 18 14 16 24 6 8 4 22-4 28l-2 10c-14 6-40 6-54 0l-2-10c-6-6-6-14-2-18z') +
			`<path d="M10 42h20v22H10zM50 42h20v22H50z" fill="#f0a028"/>` +
			dots(11, 43, 18, 20, 2.6, 0.7, '#b8640c') +
			dots(51, 43, 18, 20, 2.6, 0.7, '#b8640c') +
			`<g fill="#7fdc3a" stroke="#1e4a14" stroke-width="1.2">` +
			[[22, 26, 10], [34, 16, 10], [48, 16, 10], [58, 27, 10], [26, 37, 8], [54, 38, 8], [40, 27, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('') +
			`</g>` +
			`<g fill="#3ae0d4">` +
			[[36, 13, 4], [47, 11, 3.4], [29, 20, 3], [57, 22, 2.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('') +
			`</g>` +
			`<g fill="#1e5418">` +
			[[22, 30, 1.6], [30, 24, 1.2], [44, 22, 1.4], [52, 30, 1.6], [60, 34, 1.2], [18, 22, 1.2], [40, 34, 1.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('') +
			`</g>` +
			`<g stroke="#173a10" stroke-linejoin="round">` +
			`<path d="M28 40c4 4 20 4 24 0l2 26c-6 6-22 6-28 0z" fill="#4fae2e" stroke-width="1.2"/>` +
			`<path d="M28 51c-6 0-10 4-12 10l4-2 2 4 3-5 3 3zM52 51c6 0 10 4 12 10l-4-2-2 4-3-5-3 3z" fill="#4fae2e" stroke-width="1.1"/>` +
			`<path d="M32 46c4-2 12-2 16 0l-1 14c-4 3-10 3-14 0z" fill="#c43ee0" stroke="#3a0e48" stroke-width="1.2"/>` +
			`</g>` +
			`<path d="M32 46l2 3 2-3 2 3 2-3 2 3 2-3 2 3 2-3" fill="none" stroke="#3a0e48" stroke-width="1"/>` +
			`<path d="M30 41l7 2-1 2-6-2zM50 41l-7 2 1 2 6-2z" fill="#e070ff" stroke="#3a0e48" stroke-width=".7"/>` +
			`<path d="M30 70l4-4M40 72v-5M50 70l-4-4" stroke="#173a10" stroke-width="1.6" stroke-linecap="round"/>`
	},

	// Emerald Reaper (platform stores): a green snake coiled round a dark green skull, yellow venom
	// dripping down it
	'sticker-finders-keepers': {
		viewBox: STICKER,
		after: 'itemshop.gg’s picture of the Emerald Reaper bundle’s sticker',
		svg:
			// the coil behind the skull (right side), then the skull, then the coils in front
			`${['M56 18c8 6 10 18 6 30'].map((d) => `<path d="${d}" fill="none" stroke="#0e2a20" stroke-width="9" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#24885a" stroke-width="6.4" stroke-linecap="round"/>`).join('')}` +
			`<g stroke="#0e2a20" stroke-linejoin="round">` +
			`<path d="M20 34c0-14 9-24 20-24s20 10 20 24c0 8-3 12-6 15v11c-4 6-24 6-28 0V49c-3-3-6-7-6-15z" fill="#2d7a5c" stroke-width="1.4"/>` +
			`<path d="M52 18c5 5 8 11 8 17 0 6-2 10-5 13 0-10 0-20-3-30z" fill="#e2806c" stroke="none"/>` +
			`<path d="M25 36c3-5 10-5 13 0 0 5-3 8-6.5 8S25 41 25 36zM42 36c3-5 10-5 13 0 0 5-3 8-6.5 8S42 41 42 36z" fill="#0e2a20" stroke="none"/>` +
			`<path d="M37.6 49l2.4-5 2.4 5-2.4 2z" fill="#0e2a20" stroke="none"/><path d="M29 56h22M33 53.6v6M37 53.6v6.4M41 53.6v6.4M45 53.6v6.4M49 53.6v5.6" fill="none" stroke-width=".9"/>` +
			`</g>` +
			['M24 16c10-8 26-8 34 2', 'M62 46c-6 4-20 4-34 10', 'M22 58c8 8 26 10 38 4']
				.map(
					(d) =>
						`<path d="${d}" fill="none" stroke="#0e2a20" stroke-width="9.4" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#2fae6a" stroke-width="6.8" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#7ae4a6" stroke-width="2.2" stroke-dasharray="1.6 2.2"/>`
				)
				.join('') +
			`<path d="M60 62c4 2 6 6 4 10" fill="none" stroke="#0e2a20" stroke-width="5" stroke-linecap="round"/><path d="M60 62c4 2 6 6 4 10" fill="none" stroke="#2fae6a" stroke-width="3" stroke-linecap="round"/>` +
			// the head, top left, venom running down over the skull
			`<path d="M12 18c1-7 9-10 15-6l-1 7c-4 3-11 3-14-1z" fill="#2fae6a" stroke="#0e2a20" stroke-width="1.2" stroke-linejoin="round"/>` +
			`<circle cx="21" cy="14" r="1.8" fill="#f2d23c" stroke="#0e2a20" stroke-width=".7"/><path d="M21 12.6v2.8" stroke="#0e2a20" stroke-width=".9"/><path d="M12 18.6l6 .8" stroke="#0e2a20" stroke-width="1"/>` +
			`<path d="M18 20c1 8 3 14 2 22-1 6 0 12 0 22M23 21c3 6 3 12 6 18 1 3 0 7 1 10M15 21c-1 4 0 8-1 13" fill="none" stroke="#e8e030" stroke-width="2.2" stroke-linecap="round"/>` +
			`<circle cx="20" cy="65" r="1.9" fill="#e8e030"/><circle cx="30" cy="50" r="1.6" fill="#e8e030"/><circle cx="14" cy="35" r="1.4" fill="#e8e030"/>`
	},

	// C.O.D.E. Valor Pack: a bronze crest, an eagle with spread wings over a shield marked "WK",
	// laurels and a "FORGED IN GRIT" ribbon
	'sticker-steel-talon': {
		viewBox: STICKER,
		after: 'itemshop.gg’s picture of the C.O.D.E. Valor Pack’s sticker',
		svg:
			`<path d="M8 14c8 3 16 1 22-6h20c6 7 14 9 22 6l-2 20c0 22-12 34-30 42C22 68 10 56 10 34z" fill="#a19d95" stroke="#77736b" stroke-width="2.4" stroke-linejoin="round"/>` +
			`<g stroke="#3e2f1e" stroke-linejoin="round">` +
			`<path d="M36 21c-8-6-18-8-28-6 4 2 6 4 7 6-3 0-6 1-8 3 4 1 7 2 9 4-2 1-4 3-5 5 6 0 12-2 16-6 4 0 7-2 9-6z" fill="#a5845a" stroke-width="1.1"/>` +
			`<path d="M44 21c8-6 18-8 28-6-4 2-6 4-7 6 3 0 6 1 8 3-4 1-7 2-9 4 2 1 4 3 5 5-6 0-12-2-16-6-4 0-7-2-9-6z" fill="#a5845a" stroke-width="1.1"/>` +
			`<path d="M14 17l12 4M12 22l13 2M14 27l11 0M66 17l-12 4M68 22l-13 2M66 27l-11 0" fill="none" stroke="#5e4a30" stroke-width=".8"/>` +
			`<path d="M36 15c0-4 3-6 6-6 2 0 4 2 4 4l-2 3c2 2 2 6-2 8h-4c-3-2-4-6-2-9z" fill="#c4a274" stroke-width="1"/><path d="M45 13l3 1-3 1" fill="#d8b066" stroke-width=".7"/>` +
			`<path d="M22 30h36v16c0 14-8 22-18 26-10-4-18-12-18-26z" fill="#5a4a36" stroke-width="1.5"/>` +
			`<path d="M25 33h30v13c0 12-7 19-15 22-8-3-15-10-15-22z" fill="#8a7050" stroke="#c8a878" stroke-width="1"/>` +
			`</g>` +
			`<text x="40" y="57" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="17" font-weight="700" fill="#d8b888" stroke="#3e2f1e" stroke-width=".8">WK</text>` +
			`<path d="M17 36c-3 10-1 22 7 30M63 36c3 10 1 22-7 30" fill="none" stroke="#8a7050" stroke-width="1.8"/>` +
			`<g fill="#a5845a" stroke="#3e2f1e" stroke-width=".6">` +
			[[16, 40], [16, 47], [18, 54], [21, 60]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="3" transform="rotate(-30 ${x} ${y})"/><ellipse cx="${80 - x}" cy="${y}" rx="1.6" ry="3" transform="rotate(30 ${80 - x} ${y})"/>`).join('') +
			`</g>` +
			`<path d="M13 61c8 5 46 5 54 0l-2 7c-8 5-42 5-50 0z" fill="#8a7050" stroke="#3e2f1e" stroke-width="1" stroke-linejoin="round"/>` +
			`<text x="40" y="67.4" text-anchor="middle" font-family="Georgia, serif" font-size="4" fill="#efdcbc" textLength="40" lengthAdjust="spacingAndGlyphs">FORGED IN GRIT</text>` +
			`<path d="M22 31h12M14 14c4 1 8 1 12-1" stroke="#e2c89e" stroke-width=".9" fill="none" stroke-linecap="round"/>`
	},

	// Northern Elite: a black-clad operator with red goggles and a half-white mask, knife raised in one
	// hand, fist thrown with the other, red smoke, a red maple leaf behind
	'sticker-knife-way': {
		viewBox: STICKER,
		after: 'Activision’s store picture of the Northern Elite bundle',
		svg:
			`<g transform="translate(4 2) scale(.72)">${CUT(MAPLE, '#e3241f')}</g>` +
			`<g fill="#ff3a3a" opacity=".55"><circle cx="58" cy="50" r="12"/><circle cx="50" cy="62" r="10"/><circle cx="62" cy="64" r="8"/></g>` +
			`<g stroke="#0a0a0c" stroke-linejoin="round" stroke-width="1.1">` +
			// body, cut off at a slant; plate carrier with a flag patch
			`<path d="M13 68l1-24c1-7 7-11 14-11h15c7 0 12 4 13 11l1 24-14-3z" fill="#26262a"/>` +
			`<path d="M25 40h21l1 24-11-2-11 2z" fill="#5a5a62"/><path d="M27 50h18M27 56h18" stroke="#3a3a40"/>` +
			`<path d="M32.4 42.6h7v4.4h-7z" fill="#f2f2f2" stroke-width=".6"/><path d="M34.8 42.6h2.2v4.4h-2.2z" fill="#e3241f" stroke="none"/>` +
			// head: round helmet, red goggles, half-white mask
			`<path d="M24 22c0-8 5-14 12-14s11 5 11 13l-1 3H25z" fill="#2c2c30"/><path d="M33 8.6h5V5h-5z" fill="#3a3a3e" stroke-width=".8"/><path d="M44 12v10" stroke="#5a5a62" stroke-width="1.6"/>` +
			`<path d="M26 26h19c0 6-4 10-9.5 10S26 32 26 26z" fill="#f2f2f2"/><path d="M35.5 26H45c0 6-4 10-9.5 10z" fill="#1a1a1c" stroke="none"/>` +
			`<path d="M25 21.6h21v5H25z" fill="#ff2a2a"/><path d="M27.4 23.2h6M37.4 23.2h6" stroke="#ffc0c0" stroke-width=".9"/>` +
			// left arm bent up, knife held point-up by the face
			`<path d="M16 34c-6 4-8 12-6 18 1 3 4 4 7 2l6-6-3-4c0-4 0-7 2-9z" fill="#26262a"/>` +
			`<path d="M20 36L12 22l5 2 6 11z" fill="#dcdce0" stroke-width="1"/><path d="M14.4 24.6l6.6 10.6" stroke="#fff" stroke-width=".6"/>` +
			`<path d="M18 36h7l1 6c-2 2-6 2-8 0z" fill="#3a3a3e"/><path d="M19 38.6h6" stroke-width=".8"/>` +
			// right fist thrown at you, red smoke round it
			`<path d="M53 35c5 4 7 10 5 15l-6-1c1-3 0-6-3-9z" fill="#26262a"/>` +
			`<circle cx="57" cy="50" r="7.6" fill="#3a3a3e" stroke-width="1.2"/><path d="M53 46.6l1.6 7.2M57 45.6l1 8M61 47l-.4 6M52 51h10" stroke-width=".8"/>` +
			`</g>` +
			`<path d="M28 13q6-4 13-1M15 40c1-3 3-5 6-6" stroke="#8a8a90" stroke-width="1" fill="none" stroke-linecap="round"/>`
	},

	// ===== Beta and promotions =====

	// Open beta level 12: a golden oni mask wreathed in orange flames, teal eyes, fangs, a black 사 on
	// its forehead
	'sticker-meonjeo': {
		viewBox: STICKER,
		after: 'Activision’s open beta rewards picture',
		svg:
			CUT('M14 30c-6-8-2-18 6-22 0 6 4 8 8 8 0-6 6-12 12-12s12 6 12 12c4 0 8-2 8-8 8 4 12 14 6 22 6 4 8 14 2 20l-4 12c-6 12-42 12-48 0l-4-12c-6-6-4-16 2-20z') +
			`<g stroke="#5a300a" stroke-linejoin="round">` +
			`<path d="M17 36c-6-8-2-18 5-21-1 6 3 9 7 9M63 36c6-8 2-18-5-21 1 6-3 9-7 9" fill="#f29a1e" stroke-width="1.1"/>` +
			`<path d="M14 52c-4-6-2-12 3-14 0 4 2 6 5 6M66 52c4-6 2-12-3-14 0 4-2 6-5 6" fill="#ffc43a" stroke-width="1"/>` +
			`<path d="M20 30c4-10 12-14 20-14s16 4 20 14c3 8 2 18-2 24l-6 10c-4 6-20 6-24 0l-6-10c-4-6-5-16-2-24z" fill="#eaa22a" stroke-width="1.4"/>` +
			`<path d="M20 32c-2 8-1 16 3 22l5 9c-6-8-9-20-8-31z" fill="#b8701a" stroke="none"/><path d="M60 32c2 8 1 16-3 22l-5 9c6-8 9-20 8-31z" fill="#b8701a" stroke="none"/>` +
			`<path d="M24 21l-7-8 11 4zM56 21l7-8-11 4z" fill="#ffc43a" stroke-width="1"/>` +
			`</g>` +
			`<path d="M35 19l-3 9 2 1 3-6 3 6 2-1-3-9zM43 17h3v13h-3zM46 23h3v2.4h-3z" fill="#1a1208"/>` +
			`<path d="M22 33l12 3M58 33l-12 3" stroke="#1a1208" stroke-width="2.4" stroke-linecap="round"/>` +
			`<path d="M24 38c3-4 9-4 12 0-3 3-9 3-12 0zM44 38c3-4 9-4 12 0-3 3-9 3-12 0z" fill="#3ad4c4" stroke="#1a1208" stroke-width="1.1"/><circle cx="30" cy="38" r="1.3" fill="#0e3a36"/><circle cx="50" cy="38" r="1.3" fill="#0e3a36"/>` +
			`<path d="M35 45c2-3 8-3 10 0-1 3-9 3-10 0z" fill="#b8701a" stroke="#5a300a" stroke-width="1"/>` +
			`<path d="M26 52c6 3 22 3 28 0l-3 8c-6 3-16 3-22 0z" fill="#4a1208" stroke="#1a1208" stroke-width="1.2"/>` +
			`<path d="M30 52l2 8 2-8zM46 52l2 8 2-8z" fill="#fff4dc" stroke="#1a1208" stroke-width=".8"/><path d="M35 53.6h10" stroke="#fff4dc" stroke-width="1.6"/>` +
			`<path d="M22 44c3 2 6 2 8 1M58 44c-3 2-6 2-8 1" stroke="#3ad4c4" stroke-width="1.1" fill="none" stroke-linecap="round"/>`
	},

	// Stater Bros. + Monster Energy (name from codskins.co.uk): a skeleton hand clawing round an
	// energy-drink can, white line art on a black die-cut
	'sticker-death-grip': {
		viewBox: STICKER,
		after: 'codskins.co.uk’s promo picture of the Monster Energy rewards (a code seller’s graphic, not Activision’s)',
		svg:
			CUT('M16 8h48c5 0 8 3 8 8v48c0 5-3 8-8 8H16c-5 0-8-3-8-8V16c0-5 3-8 8-8z', '#141518') +
			`<g fill="none" stroke="#f4f4f0" stroke-linecap="round" stroke-linejoin="round">` +
			`<path d="M34 18h18l2 4v40l-2 4H34l-2-4V22z" stroke-width="1.8"/><ellipse cx="43" cy="20" rx="9" ry="2.4" stroke-width="1.4"/><path d="M41 19.6l5-1.2" stroke-width="1.4"/>` +
			`<path d="M36 28l8 6-8 6M46 30l4 4-4 4" stroke-width="1.2"/>` +
			`</g>` +
			[30, 37, 44, 51]
				.map(
					(y, i) =>
						bone(`M18 ${y + 4}L28 ${y}L38 ${y + 1}L48 ${y + 3}`, 2, '#141518', '#f4f4f0') +
						`<path d="M48 ${y + 3}l6 ${i % 2 ? 2 : 1}" stroke="#f4f4f0" stroke-width="1.4" stroke-linecap="round"/>`
				)
				.join('') +
			bone('M20 28L28 22L34 24', 2.2, '#141518', '#f4f4f0') +
			bone('M14 70L18 56M22 70L24 58', 2.4, '#141518', '#f4f4f0') +
			`<path d="M60 26l4-3M62 34h5M60 42l4 3" stroke="#f4f4f0" stroke-width="1.2" stroke-linecap="round"/>`
	},

	// ===== Guesses: no picture published yet =====

	// Battle Pass tier 7: 독사 means "viper": a green viper striking, 독사 in yellow underneath
	'sticker-doksa': {
		viewBox: STICKER,
		guess: true,
		after: 'the name only (독사 is Korean for “viper”)',
		svg:
			CUT('M40 6c18 0 32 13 32 32 0 12-6 22-14 28l-2 8H24l-2-8C14 60 8 50 8 38 8 19 22 6 40 6z', '#1c2a20') +
			`<path d="M22 58c-8-6-8-18 0-24 8-6 20-4 24 4" fill="none" stroke="#0e1a10" stroke-width="9" stroke-linecap="round"/><path d="M22 58c-8-6-8-18 0-24 8-6 20-4 24 4" fill="none" stroke="#3c9a3a" stroke-width="6.4" stroke-linecap="round"/>` +
			`<path d="M22 58c-8-6-8-18 0-24 8-6 20-4 24 4" fill="none" stroke="#a8d84a" stroke-width="2" stroke-dasharray="2 2.4"/>` +
			`<g stroke="#0e1a10" stroke-linejoin="round">` +
			`<path d="M44 34c4-10 16-14 24-8 4 3 4 8 0 11l-10 6c-6 2-12 0-14-4z" fill="#3c9a3a" stroke-width="1.4"/>` +
			`<path d="M47 41l12-3 9 2c-2 5-8 8-14 8-4 0-6-3-7-7z" fill="#5a1a1a" stroke-width="1.1"/>` +
			`<path d="M52 40l1 5 2-5.6M62 39l1 4 1.6-4.4" fill="#f4efe2" stroke-width=".7"/>` +
			`<circle cx="58" cy="29" r="2.2" fill="#f2d23c" stroke-width=".8"/><path d="M58 27.4v3.2" stroke-width="1"/>` +
			`</g>` +
			`<path d="M68 40l6 1M68 40l5 3" stroke="#d8323a" stroke-width="1.2" stroke-linecap="round"/>` +
			`<g fill="#f2d23c" transform="translate(27 56)"><path d="M0 0h10v2.4H2.6v3.2H10V8H0z"/><path d="M4 8.4h2v2h5v2H-1v-2h5z"/><path d="M1 14.4h9v4H7.6v-1.8H1z"/><path d="M16 0l-3 8 2 1 2.4-5 2.4 5 2-1-3-8z"/><path d="M23 -1h2.4v15H23zM25 6h3v2h-3z"/></g>`
	},

	// Battle Pass tier 48: a glowing sigil made of circuit traces on a dark hexagon
	'sticker-wired-sigil': {
		viewBox: STICKER,
		guess: true,
		after: 'the name only',
		svg:
			CUT('M40 6l29 17v34L40 74 11 57V23z', '#121a2a') +
			`<path d="M40 14l22 13v26L40 66 18 53V27z" fill="none" stroke="#2a4a6a" stroke-width="1.4"/>` +
			`<g fill="none" stroke="#3ae0ff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">` +
			`<path d="M40 22l14 24H26z"/><circle cx="40" cy="38" r="12"/>` +
			`<path d="M40 22V12M54 46l9 5M26 46l-9 5M28 32l-8-4M52 32l8-4M40 50v12"/>` +
			`<path d="M20 28v-6h6M60 28v-6h-6M17 51l-1 8M63 51l1 8"/>` +
			`</g>` +
			`<g fill="#3ae0ff"><circle cx="40" cy="12" r="2"/><circle cx="26" cy="22" r="1.6"/><circle cx="54" cy="22" r="1.6"/><circle cx="16" cy="59" r="1.6"/><circle cx="64" cy="59" r="1.6"/><circle cx="40" cy="62" r="2"/></g>` +
			`<circle cx="40" cy="38" r="4.4" fill="#e8304a" stroke="#ff9aa8" stroke-width="1"/><circle cx="40" cy="38" r="1.6" fill="#ffe0e4"/>`
	},

	// Battle Pass tier 72 (free): a snarling wolf's head rising out of grey smoke
	'sticker-growlin-smoke': {
		viewBox: STICKER,
		guess: true,
		after: 'the name only',
		svg:
			CUT('M10 44c-4-10 2-22 12-24 2-10 14-16 24-12 10-2 20 6 20 16 8 4 10 16 4 24 2 10-6 20-16 20-6 6-20 6-26 0-10 0-18-10-18-24z', '#2a2d32') +
			`<g fill="#7d838b"><circle cx="18" cy="56" r="8"/><circle cx="30" cy="64" r="9"/><circle cx="50" cy="64" r="9"/><circle cx="62" cy="54" r="8"/></g><g fill="#a5abb2"><circle cx="22" cy="60" r="4"/><circle cx="58" cy="60" r="4.6"/><circle cx="40" cy="66" r="5"/></g>` +
			`<g stroke="${INK}" stroke-linejoin="round">` +
			`<path d="M20 12l10 14h20l10-14 2 18c2 6 2 12-2 16l-8 10c-4 4-16 4-20 0l-8-10c-4-4-4-10-2-16z" fill="#8a8f96" stroke-width="1.4"/>` +
			`<path d="M24 18l4 8M56 18l-4 8" stroke="#5a5f66" stroke-width="2"/>` +
			`<path d="M26 34l9 3M54 34l-9 3" stroke-width="2.4" stroke-linecap="round"/>` +
			`<path d="M27 38c2-2 6-2 8 1-3 1-6 1-8-1zM53 38c-2-2-6-2-8 1 3 1 6 1 8-1z" fill="#f2c41e" stroke-width=".8"/>` +
			`<path d="M34 42h12l-2 4h-8z" fill="#1a1a1a" stroke-width=".8"/>` +
			`<path d="M28 48c4 4 20 4 24 0l-2 8c-4 3-16 3-20 0z" fill="#5a1418" stroke-width="1.1"/>` +
			`<path d="M30 49l2 5 2-4 2 4 2-4 2 4 2-4 2 4 2-4 2 5" fill="#f4efe2" stroke-width=".7"/>` +
			`</g>` +
			`<path d="M8 40c-3-4-2-9 2-11M72 40c3-4 2-9-2-11" fill="none" stroke="#a5abb2" stroke-width="1.6" stroke-linecap="round"/>`
	},

	// Battle Pass tier 95: a hawk's head with a hooked yellow beak, a thorny bramble wound round it
	'sticker-bramble-hawk': {
		viewBox: STICKER,
		guess: true,
		after: 'the name only',
		svg:
			CUT('M40 6c18 0 32 14 32 32S58 74 40 74 8 58 8 40 22 6 40 6z', '#efe4cc') +
			`<g stroke="${INK}" stroke-linejoin="round">` +
			// head in profile facing right, white throat, hooked yellow-and-black beak
			`<path d="M26 40c0-12 9-20 20-20 9 0 15 5 17 12l-6 6c-1 7-6 12-12 13l-2 3c-1 6 0 11 2 16H32c2-6 2-12 0-16-4-3-6-8-6-14z" fill="#7a4e2a" stroke-width="1.4"/>` +
			`<path d="M40 44c5 0 10 1 13 4-3 3-8 5-13 5-2-3-2-6 0-9z" fill="#efe6d4" stroke-width="1"/>` +
			`<path d="M56 27c6-1 11 3 12 9l-1 7c-2-3-4-5-7-5l-6 1z" fill="#f2c41e" stroke-width="1.2"/><path d="M66 42l2 5-4-3z" fill="#2a2a2a" stroke-width=".8"/><path d="M54 27c2-1 4 0 5 2l-4 3z" fill="#e8a01a" stroke-width=".8"/>` +
			`<circle cx="50" cy="30" r="3.4" fill="#f2a01e" stroke-width="1"/><circle cx="50.6" cy="30" r="1.6" fill="#1a1208" stroke="none"/><path d="M44 26.6l10-1.6" stroke-width="2" stroke-linecap="round"/>` +
			`<path d="M30 36l5 2M29 43l6 2M33 56l6 1M33 62l6 0M36 29l5 1" fill="none" stroke="#4a2e18" stroke-width="1.2"/>` +
			`<path d="M32 26c5-4 12-5 18-3" fill="none" stroke="#a8764a" stroke-width="1.2" stroke-linecap="round"/>` +
			`</g>` +
			`<path d="M10 52c10-6 18 2 26-4s14-14 26-8 10 18 4 22" fill="none" stroke="#2e5a20" stroke-width="2.6" stroke-linecap="round"/>` +
			`<path d="M16 48l-2-4M26 50l1-4M34 46l-3-3M44 40l1-4M54 40l3-3M62 46l4-1M66 56l4 1" stroke="#2e5a20" stroke-width="1.4" stroke-linecap="round"/>` +
			`<g fill="#c8283a"><circle cx="20" cy="52" r="1.8"/><circle cx="48" cy="44" r="1.8"/><circle cx="64" cy="50" r="1.8"/></g>`
	},

	// Name from codmw4.wiki only: a red radio mast sending broken signal arcs, glitch bars across
	'sticker-rogue-signal': {
		viewBox: STICKER,
		guess: true,
		after: 'the name only',
		svg:
			CUT('M14 10h52l6 8v44l-6 8H14l-6-8V18z', '#18191c') +
			`<g fill="none" stroke="#e8303a" stroke-width="2.2" stroke-linecap="round">` +
			`<path d="M28 30a16 16 0 0 1 24 0M22 24a24 24 0 0 1 36 0M16 18a32 32 0 0 1 48 0" stroke-dasharray="7 3"/>` +
			`</g>` +
			`<g stroke="#e8303a" stroke-width="2" stroke-linejoin="round" fill="none"><path d="M40 36l-10 30h20zM34 50h12M32 58h16M37 44h6"/></g>` +
			`<circle cx="40" cy="36" r="3" fill="#ff6a70"/>` +
			`<g fill="#e8303a" opacity=".85"><rect x="12" y="40" width="14" height="2.4"/><rect x="54" y="46" width="16" height="2"/><rect x="18" y="62" width="10" height="1.8"/><rect x="50" y="24" width="8" height="1.6"/></g>` +
			`<g fill="#3ae0ff" opacity=".7"><rect x="14" y="43" width="9" height="1.2"/><rect x="57" y="49" width="10" height="1.2"/></g>`
	}
};
