/**
 * The CS2 skins in the Camo Armory's "CS2 Skins" tab (2026-11-22, the user: "en flik i Camo Armory som är
 * sist … Counter-Strike skins … de dyraste, fetaste, coolaste, ikoniska … som passar till vapen som vi har").
 * How each skin paints a CS2 gun drawn by Cs2Gun.svelte (viewBox 0 0 64 24, muzzle right).
 *
 * Our own cartoons in each skin's style, drawn after the item pictures on stash.clash.gg (CSGOStash), which
 * show the muzzle left: ours are mirrored. Never the game's textures. At this size a skin is its colours and
 * its one big motif (Howl's wolf, Dragon Lore's dragon, the Fades' gradient), not its fine print.
 *
 * Each skin = `paint` (which part gets what: a '#colour', or a name = the <pattern>/<gradient> `${uid}-name`)
 * + `defs(uid)` (the SVG for those names as a string; Cs2Gun puts it in its <defs> with {@html}). Patterns
 * are drawn in icon coordinates (64 × 24) unless they are small tiles, so a design lines up across parts.
 * Ids are scoped by `uid` (the same gun can be on screen twice). Pure strings: tested in
 * scripts/cs2-skins.test.js (every reference defined, ids scoped, well-formed).
 *
 * The first eight skins (Fire Serpent, Asiimov on the M4A4, Blaze, Printstream on the USP-S, Bloodsport,
 * Frost Borre, the Karambit's Fade, Lightning Strike) are the 2026-11-07 easter eggs and stay drawn in
 * Cs2Gun.svelte itself.
 */

/** The parts of a CS2 gun drawing that a skin can paint (Cs2Gun.svelte). */
export type Cs2Part =
	| 'stock'
	| 'tube'
	| 'body'
	| 'lower'
	| 'frame'
	| 'guard'
	| 'grip'
	| 'mag'
	| 'barrel'
	| 'muzzle'
	| 'can'
	| 'fore'
	| 'cylinder'
	| 'sights'
	| 'blade'
	| 'handle'
	| 'ring';

export interface SkinArt {
	paint: Partial<Record<Cs2Part, string>>;
	defs: (u: string) => string;
}

type Stop = [number, string];

const stops = (s: Stop[]) => s.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
/** A linear gradient in icon coordinates. */
const lin = (u: string, id: string, x1: number, y1: number, x2: number, y2: number, s: Stop[], spread = '') =>
	`<linearGradient id="${u}-${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${spread ? ` spreadMethod="${spread}"` : ''}>${stops(s)}</linearGradient>`;
/** A pattern in icon coordinates (64 × 24 = drawn once over the whole gun) or a small tile. */
const pat = (u: string, id: string, body: string, w = 64, h = 24) => `<pattern id="${u}-${id}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">${body}</pattern>`;
const ref = (u: string, id: string) => `url(#${u}-${id})`;
const full = (fill: string) => `<rect width="64" height="24" fill="${fill}"/>`;
const line = (d: string, stroke: string, w: number, extra = '') => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const shape = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}"${extra}/>`;

/** A seeded pseudo-random list (the same picture on every page). */
function rand(seed: number): () => number {
	let s = seed >>> 0;
	return () => {
		s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
		return s / 4294967296;
	};
}
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Mottled blobs (Case Hardened, Doppler swirls) over a box. */
function blobs(seed: number, n: number, [x0, y0, x1, y1]: number[], colours: string[], size: [number, number], opacity = 0.85): string {
	const r = rand(seed);
	let out = '';
	for (let i = 0; i < n; i++) {
		const cx = r1(x0 + r() * (x1 - x0));
		const cy = r1(y0 + r() * (y1 - y0));
		const rx = r1(size[0] + r() * (size[1] - size[0]));
		const ry = r1(rx * (0.35 + r() * 0.4));
		const rot = Math.round(-40 + r() * 80);
		out += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="${colours[i % colours.length]}" fill-opacity="${opacity}"/>`;
	}
	return out;
}

/** A spider web (Crimson Web): spokes and sagging rings around a centre. */
function web(cx: number, cy: number, r: number, spokes = 9, rings = 4, turn = 0.3): string {
	const pts = (rad: number) =>
		Array.from({ length: spokes }, (_, i) => {
			const a = turn + (i / spokes) * Math.PI * 2;
			return [r1(cx + Math.cos(a) * rad), r1(cy + Math.sin(a) * rad)];
		});
	const outer = pts(r);
	let d = outer.map(([x, y]) => `M${cx} ${cy} L${x} ${y}`).join(' ');
	for (let k = 1; k <= rings; k++) {
		const p = pts((r * k) / rings);
		const sag = pts((r * k) / rings - r / rings / 3);
		d += ` M${p[0][0]} ${p[0][1]}`;
		for (let i = 1; i <= spokes; i++) {
			const a = p[i % spokes];
			const m = sag[i - 1];
			const n = sag[i % spokes];
			d += ` Q${r1((m[0] + n[0]) / 2)} ${r1((m[1] + n[1]) / 2)} ${a[0]} ${a[1]}`;
		}
	}
	return d;
}

/** A small lotus flower (AK-47 Wild Lotus). */
const lotus = (x: number, y: number, s: number) =>
	`<g transform="translate(${x} ${y}) scale(${s})">${[-64, -32, 0, 32, 64]
		.map((a) => `<ellipse cx="0" cy="-1.3" rx="0.62" ry="1.35" transform="rotate(${a})" fill="#f06b98"/>`)
		.join('')}<ellipse cx="0" cy="-0.9" rx="0.35" ry="0.8" fill="#ffd0de"/><circle cy="0.1" r="0.45" fill="#ffd36b"/></g>`;

/** A thin leaf at an angle. */
const leaf = (x: number, y: number, len: number, rot: number, fill: string) =>
	`<ellipse cx="${x}" cy="${y}" rx="${len}" ry="${r1(len * 0.28)}" transform="rotate(${rot} ${x} ${y})" fill="${fill}"/>`;

/** The classic AK wood (stock, grip, handguards). */
const akWood = (u: string, id: string) =>
	pat(
		u,
		id,
		`<rect width="9" height="2.8" fill="#a5532a"/>${line('M0 1.4 Q2.2 0.5 4.5 1.4 T9 1.4', '#62290f', 0.45)}${line('M0 2.5 Q2.2 2 4.5 2.5 T9 2.5', '#c06a3c', 0.3)}`,
		9,
		2.8
	);

/** Pearl white (the Printstreams). */
const pearl = (u: string, id: string) =>
	lin(u, id, 10, 4, 60, 12, [
		[0, '#fbf4fb'],
		[0.35, '#e9f6f5'],
		[0.65, '#f8f1e4'],
		[1, '#fdfdfd']
	]);

/** The Fade gradient from the gun's front (`x1`) to its back (`x2`): gold, pink, purple. */
const fade = (u: string, id: string, x1: number, x2: number) =>
	lin(u, id, x1, 6, x2, 16, [
		[0, '#ffd040'],
		[0.22, '#ff9d3c'],
		[0.48, '#ff4f96'],
		[0.76, '#b24dff'],
		[1, '#6e5cff']
	]);

const brushedGold = (u: string, id: string) =>
	lin(
		u,
		id,
		0,
		0,
		13,
		9,
		[
			[0, '#8a5d12'],
			[0.3, '#f2cc66'],
			[0.52, '#b5852b'],
			[0.74, '#ffe7a0'],
			[1, '#7a520f']
		],
		'reflect'
	);

/** Carbon fibre weave (Redline). */
const carbon = (u: string, id: string) =>
	pat(u, id, `<rect width="1.2" height="1.2" fill="#1d1e21"/><rect width="0.6" height="0.6" fill="#2d2e33"/><rect x="0.6" y="0.6" width="0.6" height="0.6" fill="#2d2e33"/>`, 1.2, 1.2);

export const SKIN_ART = {
	// ---------------- AK-47 (Kastov 762) ----------------
	'ak-wild-lotus': {
		paint: { stock: 'lotus', body: 'lotus', guard: 'lotus', mag: 'lotus', grip: '#1c5a4b' },
		defs: (u) =>
			pat(
				u,
				'lotus',
				full('#1f6e5c') +
					line('M2 12 C8 8 12 16 18 12 S28 8 34 12 S44 16 50 11', '#2f9a7d', 1.1) +
					line('M2 16.4 C10 20 16 14 24 17.6 S34 21 38 18', '#2f9a7d', 1) +
					line('M17 9.4 C22 8.2 28 10.8 35 9', '#7ed6b8', 0.3) +
					leaf(12, 15.4, 2, -30, '#7fcf5a') +
					leaf(27.4, 12.6, 1.8, 20, '#7fcf5a') +
					leaf(44, 9.6, 1.6, -15, '#7fcf5a') +
					leaf(35, 20.4, 1.8, 50, '#62b347') +
					leaf(6, 11.4, 1.6, 25, '#62b347') +
					lotus(9, 13, 1.1) +
					lotus(23.6, 11, 1.25) +
					lotus(31.4, 11.6, 0.8) +
					lotus(41, 12.2, 1) +
					lotus(33.4, 18.2, 1.05) +
					lotus(14.6, 11.6, 0.7)
			)
	},
	'ak-gold-arabesque': {
		paint: { body: 'goldorn', mag: 'goldorn', guard: 'orn', stock: 'orn', grip: '#3b2a1e', barrel: '#d6a63c' },
		defs: (u) =>
			brushedGold(u, 'gold') +
			pat(u, 'curl', line('M0 1.5 C1 0 2 0 2 1.5 S3 3 4 1.5', '#4a3410', 0.3) + `<circle cx="2" cy="1.5" r="0.4" fill="none" stroke="#4a3410" stroke-width="0.25"/>`, 4, 3) +
			pat(u, 'goldorn', full(ref(u, 'gold')) + `<rect width="64" height="24" fill="${ref(u, 'curl')}" opacity="0.8"/>`) +
			pat(
				u,
				'rosette',
				`<rect width="3" height="3" fill="#b48f5e"/><path d="M0.4 1.1 q0.9 -0.9 1.8 0 q-0.9 1.2 -1.8 0z" fill="#5a3a1c"/><circle cx="2.4" cy="2.5" r="0.32" fill="#5a3a1c"/><circle cx="0.6" cy="2.4" r="0.2" fill="#7a5530"/>`,
				3,
				3
			) +
			pat(u, 'orn', full(ref(u, 'rosette')) + line('M3 10.6 L17.4 9.4 M35.6 8.6 H44.6 M35.6 13.2 H46', '#d6a63c', 0.35))
	},
	'ak-case-hardened': {
		paint: { body: 'ch', mag: 'ch', barrel: 'ch', guard: 'wood', stock: 'wood', grip: 'wood' },
		defs: (u) =>
			akWood(u, 'wood') +
			lin(u, 'chbase', 0, 6, 0, 22, [
				[0, '#7f9fe4'],
				[0.5, '#3a63cc'],
				[1, '#23409e']
			]) +
			pat(
				u,
				'ch',
				full(ref(u, 'chbase')) +
					blobs(661, 34, [16, 7, 60, 23], ['#1f3fa8', '#5b3fc0', '#9ab8ff', '#2c63d6', '#7a4fd0', '#b9d0ff', '#1a2f8a'], [1.2, 3.6]) +
					blobs(387, 5, [18, 8, 58, 22], ['#d6b04c', '#c99a3a'], [0.6, 1.4], 0.9) +
					line('M18 8.8 H34 M36 11 H58', '#fff', 0.35, ' stroke-opacity="0.45"')
			)
	},
	'ak-vulcan': {
		paint: { body: 'vulcan', guard: 'vulcan', mag: 'vmag', stock: 'vstock', grip: '#1b1d22' },
		defs: (u) =>
			pat(
				u,
				'vulcan',
				full('#eef2f5') +
					shape('M17 11.4 L35.6 10.6 L47 10.6 L47 14 L17 14 Z', '#1b1d22') +
					line('M17 11 L35.6 10.2 H47', '#36b4f0', 0.6) +
					shape('M27.4 7.8 H30.6 L29 11 H25.8 Z', '#1b1d22') +
					shape('M31.4 7.8 H32.6 L31 11 H29.8 Z', '#36b4f0') +
					shape('M40 7.6 H42.4 L41.4 10.4 H39 Z', '#1b1d22') +
					line('M18 8.8 H26.6', '#9fb0bf', 0.3)
			) +
			pat(u, 'vmag', full('#eef2f5') + line('M31.9 13.6 C31.9 17 33 19.8 35.4 21.8', '#1b1d22', 1.7) + line('M31.9 13.6 C31.9 17 33 19.8 35.4 21.8', '#36b4f0', 0.45)) +
			pat(u, 'vstock', full('#1b1d22') + line('M3.6 13.6 L17.4 11.4', '#eef2f5', 1.2) + line('M3.6 14.8 L17.4 12.6', '#36b4f0', 0.6) + shape('M2.6 9.8 H5 V18 H2.6 Z', '#eef2f5'))
	},
	'ak-redline': {
		paint: { stock: 'redline', body: 'redline', guard: 'redline', mag: 'redline', grip: 'carbon' },
		defs: (u) =>
			carbon(u, 'carbon') +
			pat(
				u,
				'redline',
				full(ref(u, 'carbon')) +
					line('M17.6 9.1 H34.6', '#d8202a', 0.5) +
					line('M4.2 11 L17.4 9.6', '#d8202a', 0.5) +
					line('M4 16.8 L9.6 15.5', '#d8202a', 0.45) +
					line('M35.8 12.9 H46', '#d8202a', 0.45) +
					line('M30.5 14 C30.6 17.4 31.9 20.3 34.3 22.2', '#d8202a', 0.5)
			)
	},
	'ak-hydroponic': {
		paint: { body: 'hydro', mag: 'hydro', guard: '#cfe93c', stock: 'wood', grip: 'wood' },
		defs: (u) =>
			akWood(u, 'wood') +
			pat(
				u,
				'hydro',
				full('#e8ebe4') +
					line('M19.4 14 L22.4 7.6 M25.6 14 L27.6 7.6 M32 22 L31.6 14', '#4c8f3a', 0.7) +
					line('M20.2 12.2 l0.9 0.3 M21.4 9.8 l0.9 0.3 M26.2 12 l0.9 0.2 M27 9.4 l0.9 0.2 M31.8 18 l0.9 0', '#2f6a24', 0.35) +
					leaf(23.4, 10.6, 2, -35, '#5fae3c') +
					leaf(29.6, 11.4, 1.8, 30, '#8ccf4e') +
					leaf(19.2, 9.6, 1.5, 25, '#8ccf4e') +
					leaf(33.6, 9.8, 1.4, -20, '#5fae3c') +
					leaf(33.2, 17, 1.8, 60, '#5fae3c') +
					leaf(34.6, 20.6, 1.4, 20, '#8ccf4e')
			)
	},
	'ak-asiimov': {
		paint: { body: 'aasi', guard: 'aasi', stock: 'aasi', mag: 'aasimag', grip: '#1a1b1e' },
		defs: (u) =>
			pat(
				u,
				'aasi',
				full('#eef1f2') +
					shape('M0 0 H6.4 L5.8 24 H0 Z', '#ff6c14') +
					shape('M6.4 0 H7.6 L7 24 H5.8 Z', '#1a1b1e') +
					shape('M9.6 14.6 L15 12.2 L15 14.2 Z', '#1a1b1e') +
					shape('M26 13.8 L35.4 13.8 L35.4 10.4 Z', '#1a1b1e') +
					shape('M42.4 7 H45 V14 H42.4 Z', '#ff6c14') +
					shape('M38 10.4 H40.6 V14 H38 Z', '#1a1b1e') +
					shape('M20 7.6 H22.4 V9.6 H20 Z', '#ff6c14')
			) +
			pat(u, 'aasimag', full('#1a1b1e') + shape('M29 19.6 L40 15.6 L40 24 L29 24 Z', '#ff6c14'))
	},

	// ---------------- M4A4 (M4) ----------------
	'm4-howl': {
		paint: { stock: 'howl', tube: 'howl', body: 'howl', lower: 'howl', guard: 'howl', mag: 'howl' },
		defs: (u) =>
			lin(u, 'red', 0, 6, 0, 22, [
				[0, '#d4321f'],
				[0.5, '#b0201a'],
				[1, '#7c110d']
			]) +
			pat(
				u,
				'howl',
				full(ref(u, 'red')) +
					line('M5 15.6 C7.6 13.4 10 14.6 13.6 12 M5 11.4 C7.6 10.2 10.4 11 14 9.6 M36 11 C39 9.4 42 10.4 46 8.6 M30 21 C30.4 18.6 31.4 17 33.6 16', '#5e0c09', 0.5) +
					// the howling wolf's head on the receiver, snout up toward the muzzle
					shape(
						'M22.6 14.8 C22.8 12.6 23.4 10.6 24.6 9.4 L25 7.6 L26.2 8.8 C27.6 8.4 29.2 8.2 30.2 7.6 L33.2 7.4 L31.6 9 L33 9.4 L30.6 10.6 C30 11.6 28.8 12.4 28 13.6 L27.6 14.8 Z',
						'#f2702a',
						' stroke="#5e0c09" stroke-width="0.35"'
					) +
					line('M24.2 12.6 C25.2 11.2 26.4 10.6 27.6 10.4 M24 14 C25 13 26 12.6 27 12.4', '#ffae66', 0.35) +
					line('M30.6 10.6 L29.4 10', '#3a0806', 0.35) +
					`<ellipse cx="27.6" cy="9.4" rx="0.55" ry="0.28" fill="#3a0806"/>`
			)
	},
	'm4-poseidon': {
		paint: { stock: 'pos', tube: 'pos', body: 'pos', lower: 'pos', guard: 'pos', mag: 'pos' },
		defs: (u) =>
			pat(
				u,
				'pos',
				full('#1b7d84') +
					line(
						'M2 9.4 q2 -1.6 4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 M2 13 q2 -1.6 4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 M2 16.6 q2 -1.6 4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 M2 20.2 q2 -1.6 4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0 t4 0',
						'#0e4b56',
						0.6
					) +
					line('M3 11 q2 -1.2 4 0 t4 0 t4 0 M36 9.2 q2 -1.2 4 0 t4 0', '#8ff0e2', 0.25) +
					// Poseidon's trident across the lower receiver
					line('M20.4 14.2 L30.6 8.6', '#c4ffe0', 0.55) +
					line('M29.4 8.2 L31.6 7.6 L31.4 9.6 M30.6 8.6 L32.2 8.2', '#c4ffe0', 0.45)
			)
	},
	'm4-emperor': {
		paint: { stock: 'emp', tube: 'emp', body: 'emp', lower: 'emp', guard: 'emp', mag: 'emp' },
		defs: (u) =>
			pat(
				u,
				'emp',
				full('#1d3a9e') +
					line('M5 9.6 H13.6 M5 16.4 L9 15.4 M36 8.6 H46 M36 11 H46 M29.6 16.4 L33.6 15.8', '#e2b74a', 0.4) +
					line('M5 11 H13 M36.6 9.8 H45.4', '#f1f1f1', 0.25) +
					// the gold medallion: a crowned lion
					`<circle cx="25.6" cy="11.2" r="3.3" fill="#f0c75a" stroke="#8a5d12" stroke-width="0.35"/>` +
					`<circle cx="25.6" cy="11.4" r="2.3" fill="#b5741f"/>` +
					`<ellipse cx="25.6" cy="11.7" rx="1.35" ry="1.5" fill="#f3d080"/>` +
					`<circle cx="25.1" cy="11.3" r="0.22" fill="#2a1a08"/><circle cx="26.1" cy="11.3" r="0.22" fill="#2a1a08"/>` +
					shape('M25.2 12.2 H26 L25.6 12.7 Z', '#5a3010') +
					shape('M23.8 8.6 L24.4 7.6 L25 8.3 L25.6 7.4 L26.2 8.3 L26.8 7.6 L27.4 8.6 Z', '#ffe08a', ' stroke="#8a5d12" stroke-width="0.2"')
			)
	},
	'm4-neo-noir': {
		paint: { stock: 'noir', tube: 'noir', body: 'noir', lower: 'noir', guard: 'noir', mag: 'noir' },
		defs: (u) =>
			pat(u, 'dots', `<circle cx="0.5" cy="0.5" r="0.22" fill="#e03a96"/>`, 1, 1) +
			pat(
				u,
				'noir',
				full('#17171d') +
					shape('M17.6 7.4 H23.6 L21.6 11.2 H17.6 Z M5 8.4 H9 L6 17.6 H4.2 Z', '#f0f0f0') +
					shape('M26 8 C29 7.6 32.4 9 33 12 C33.4 14 31.6 15 30 14.6 L28.6 13 C27.2 12.6 26.2 11.4 26 10 Z', '#e03a96') +
					shape('M28.6 9.4 C29.6 9.2 30.8 10 30.8 11', 'none', ' stroke="#17171d" stroke-width="0.4"') +
					`<rect x="36" y="7" width="10.6" height="5.2" fill="${ref(u, 'dots')}"/>` +
					line('M36.4 11.4 L46 8 M29.6 16 L33.8 21.6', '#59d0ff', 0.4)
			)
	},

	// ---------------- M4A1-S (M4) ----------------
	'm4s-printstream': {
		paint: { stock: 'mp', tube: 'mp', body: 'mp', lower: 'mp', guard: 'mp', mag: 'mp', can: 'mp', sights: '#e9ecef' },
		defs: (u) =>
			pearl(u, 'pearl') +
			pat(
				u,
				'mp',
				full(ref(u, 'pearl')) +
					line('M18 9.4 H34.4 M48.6 10.2 H62.6', '#16171a', 0.45) +
					line('M51.4 8.4 l1.4 1.4 M52.8 8.4 l-1.4 1.4 M53.6 8.4 l1.4 1.4 M55 8.4 l-1.4 1.4', '#16171a', 0.45) +
					line('M24.4 12 v2 M25 12 v2 M25.4 12 v2 M26.2 12 v2 M26.6 12 v2', '#16171a', 0.3) +
					`<rect x="21" y="12.2" width="1.3" height="1.3" fill="#16171a"/>` +
					line('M6 9 V17', '#16171a', 0.35) +
					line('M38 8.4 l-0.8 0.8 l0.8 0.8', '#16171a', 0.3)
			)
	},
	'm4s-hot-rod': {
		paint: { stock: 'hotrod', tube: 'hotrod', body: 'hotrod', lower: 'hotrod', guard: 'hotrod', can: 'hotrod', sights: 'hotrod', barrel: '#8e0a10' },
		defs: (u) =>
			lin(u, 'hotrod', 0, 3, 0, 19, [
				[0, '#ff7464'],
				[0.28, '#ec1c22'],
				[0.62, '#bd0d14'],
				[1, '#76060b']
			])
	},
	'm4s-knight': {
		paint: { body: 'knight', lower: 'knight', tube: 'kdark', guard: 'kgold', can: 'kcan', sights: 'kgold', stock: 'kdark', mag: '#2b2e33' },
		defs: (u) =>
			lin(u, 'kdark', 0, 4, 0, 16, [
				[0, '#5b6168'],
				[0.5, '#383c42'],
				[1, '#24272b']
			]) +
			brushedGold(u, 'kg') +
			pat(u, 'kgold', full(ref(u, 'kg')) + line('M36.4 9.8 c1 -1 2 -1 3 0 s2 1 3 0 s2 -1 3 0', '#6a4a14', 0.3)) +
			pat(
				u,
				'knight',
				full(ref(u, 'kdark')) +
					line('M18.4 9.4 c1 -1 2 -1 3 0 s2 1 3 0 s2 -1 3 0 s2 1 3 0 s2 -1 3 0', '#d9b04a', 0.35) +
					line('M18.6 12.8 c1 -0.8 2 -0.8 3 0 s2 0.8 3 0 s2 -0.8 3 0', '#d9b04a', 0.3)
			) +
			pat(u, 'kcan', full(ref(u, 'kdark')) + `<rect x="49.4" y="0" width="0.9" height="24" fill="${ref(u, 'kg')}"/><rect x="60.6" y="0" width="0.9" height="24" fill="${ref(u, 'kg')}"/>`)
	},
	'm4s-jungle': {
		paint: { stock: 'jungle', tube: 'jungle', body: 'jungle', lower: 'jungle', guard: 'jungle', can: 'jungle', mag: 'jungle' },
		defs: (u) =>
			pat(
				u,
				'jungle',
				full('#5c1420') +
					leaf(8, 12, 2.6, 40, '#2a0a0f') +
					leaf(20, 12.6, 2.2, -30, '#2a0a0f') +
					leaf(41, 9.6, 2.6, 20, '#2a0a0f') +
					leaf(54, 9.4, 2.8, -15, '#2a0a0f') +
					leaf(31.6, 18.4, 2.2, 70, '#2a0a0f') +
					line('M22.6 8 C24 9.6 24 11.6 23 13.4 M25.4 7.8 C26.8 9.6 26.8 11.8 25.8 14 M28.2 7.8 C29.6 9.6 29.4 11.6 28.6 13.6 M31 8 C32.2 9.6 32.2 11.4 31.4 13', '#f07a24', 0.6) +
					line('M38 8.6 C40 10 42 9 44 10.6 M50 9 C53 8.4 56 10.4 60 9.4 M6 14.6 C8.6 13.6 10.6 15 13 13.4', '#d8322c', 0.45)
			)
	},

	// ---------------- AWP (KG-7 Vulcan) ----------------
	'awp-dragon-lore': {
		paint: { stock: 'dlore', mag: '#7b6c41' },
		defs: (u) =>
			pat(
				u,
				'dlore',
				full('#a8985e') +
					line('M4 10 C7 8.4 9.6 12 13 10.2 S19 8.6 23 10.2 S31 12.2 39.6 10.4 M4 17 C7 18.4 10 15.4 13 17', '#5e5430', 0.35) +
					line('M5 13 C6.6 12 8 14.4 9.6 13.2 M15.6 19.6 C17 18.6 18.4 20.6 20 19.6', '#5e5430', 0.3) +
					// the dragon: tail in the butt, body along the stock, head up front
					line('M6 17.4 C8 13.4 11.6 17.6 13.6 13 S17.6 10.6 22 11.6 S29 12.2 33.4 11', '#b23a24', 1.3) +
					line('M6 17.4 C8 13.4 11.6 17.6 13.6 13 S17.6 10.6 22 11.6 S29 12.2 33.4 11', '#e3b448', 0.4) +
					shape('M33 10.2 L36.2 9.8 L38.6 10.6 L36.4 11.2 L37.8 12.2 L35 12 L33 11.8 Z', '#b23a24', ' stroke="#5e2a14" stroke-width="0.25"') +
					`<circle cx="35.4" cy="10.6" r="0.3" fill="#ffd84a"/>` +
					shape('M19.4 11.2 L21 9.8 L22.6 11.2 Z M10 15 L10.8 13 L12.4 14 Z', '#d0522c')
			)
	},
	'awp-gungnir': {
		paint: { stock: 'gung', mag: '#2a4aa0', sights: '#e5ecf5' },
		defs: (u) =>
			lin(u, 'ice', 0, 7, 0, 21, [
				[0, '#f4f8fd'],
				[1, '#bccde6']
			]) +
			pat(u, 'knot', line('M0 1.5 C1 0 3 3 4 1.5 M0 1.5 C1 3 3 0 4 1.5', '#22409a', 0.3), 4, 3) +
			pat(
				u,
				'gung',
				full(ref(u, 'ice')) +
					`<rect width="64" height="24" fill="${ref(u, 'knot')}"/>` +
					line('M4.6 11.2 H38.6', '#d9b04a', 0.55) +
					shape('M38.4 10.2 L41 11.2 L38.4 12.2 Z', '#d9b04a') +
					line('M6 14 H12 M6 15.6 H11.6 M6 17.2 H11', '#22409a', 0.5)
			)
	},
	'awp-medusa': {
		paint: { stock: 'med', mag: 'med' },
		defs: (u) =>
			pat(
				u,
				'med',
				full('#101a2a') +
					blobs(7, 9, [3, 8, 20, 19], ['#4b5a62', '#7d8b8e', '#5e6c72'], [1.4, 3.2], 0.75) +
					line('M4 10 C8 8.4 9 12.4 13 11 S19 9.6 24 11.4 S32 10 40 11', '#29d3c4', 0.5) +
					line('M5 15 C8 13 10 17 13 15 M7 18 C9 16.4 12 19 14 17.4 M16 19.6 C18 18.4 19.6 20.4 21.6 19', '#29d3c4', 0.45) +
					`<circle cx="40" cy="11" r="0.45" fill="#29d3c4"/><circle cx="13" cy="15" r="0.4" fill="#29d3c4"/><circle cx="14" cy="17.4" r="0.4" fill="#29d3c4"/>`
			)
	},
	'awp-prince': {
		paint: { stock: 'prince', mag: '#7a1a1a' },
		defs: (u) =>
			pat(
				u,
				'prince',
				full('#cdb88c') +
					line('M4 12.4 C6 10.4 8 14.4 10 12.4 S14 10.4 16 12.4 S20 14.4 22 12.4 S26 10.4 28 12.4 S32 14.4 34 12.4 S38 10.4 40 12.4', '#7a1a1a', 0.7) +
					line('M4 12.4 C6 14.4 8 10.4 10 12.4 S14 14.4 16 12.4 S20 10.4 22 12.4 S26 14.4 28 12.4 S32 10.4 34 12.4 S38 14.4 40 12.4', '#2a1a14', 0.45) +
					line('M4 9.4 H40 M4 15 L13 15', '#7a1a1a', 0.3) +
					shape('M6 16 L8 18 L6 20 L4 18 Z', '#7a1a1a')
			)
	},
	'awp-asiimov': {
		paint: { stock: 'awpasi', barrel: '#eef1f2', sights: '#eef1f2', mag: '#ff6c14' },
		defs: (u) =>
			pat(
				u,
				'awpasi',
				full('#eef1f2') +
					shape('M0 0 H10.4 L9.6 24 H0 Z', '#ff6c14') +
					shape('M10.4 0 H11.8 L11 24 H9.6 Z', '#1a1b1e') +
					shape('M23 13 L36 13 L36 9.8 Z', '#1a1b1e') +
					shape('M36.4 9.4 H41.4 V13 H36.4 Z', '#ff6c14') +
					shape('M16 19 L20 15 L21 19 Z', '#1a1b1e')
			)
	},
	'awp-fade': {
		paint: { stock: 'afade', mag: 'afade' },
		defs: (u) => fade(u, 'afade', 41, 3)
	},
	'awp-hyper-beast': {
		paint: { stock: 'hyper', mag: '#8fe04a' },
		defs: (u) =>
			pat(
				u,
				'hyper',
				full('#13302f') +
					line('M14 10.6 H40 M14 12.2 H40', '#2a8f86', 0.35) +
					// the beast's grinning mouth and eye on the butt
					shape('M3.6 11 C6 9 11 9.6 13 12.4 C11 16 6 17.6 3.6 15.4 Z', '#ff3d6b') +
					shape('M4.6 12.4 L5.4 13.4 L6.2 12.4 L7 13.4 L7.8 12.4 L8.6 13.4 L9.4 12.4 L10.2 13.4 L11 12.4', 'none', ' stroke="#fff" stroke-width="0.45"') +
					`<circle cx="8.4" cy="10" r="0.9" fill="#8fe04a"/><circle cx="8.4" cy="10" r="0.35" fill="#13302f"/>` +
					line('M14 17 C17 15 19 19 22 17 M24 11 C27 9.6 30 12.6 33 11', '#7a3cff', 0.6)
			)
	},

	// ---------------- Desert Eagle (.50 GS) ----------------
	'de-golden-koi': {
		paint: { body: 'koi', frame: 'koi', grip: '#5d5a33' },
		defs: (u) =>
			lin(u, 'gold', 0, 3, 0, 13, [
				[0, '#f0dc98'],
				[0.6, '#cdb460'],
				[1, '#a08640']
			]) +
			pat(u, 'scales', line('M0 1.4 A0.9 0.9 0 0 1 1.8 1.4 M-0.9 0 A0.9 0.9 0 0 1 0.9 0 M0.9 0 A0.9 0.9 0 0 1 2.7 0', '#7d6526', 0.22), 1.8, 1.4) +
			pat(
				u,
				'koi',
				full(ref(u, 'gold')) +
					`<rect x="13" y="3" width="34" height="11" fill="${ref(u, 'scales')}"/>` +
					shape('M46.6 4 C49 4.4 52 5.6 53.2 7.2 L53.2 10.4 L46.6 10.4 Z', '#f6e7b4') +
					`<circle cx="50.4" cy="6.6" r="1.05" fill="#1a1406"/><circle cx="50.1" cy="6.3" r="0.3" fill="#fff"/>` +
					line('M47.4 8.4 C49 9.4 51 9.6 52.6 9', '#8a6a24', 0.3)
			)
	},
	'de-printstream': {
		paint: { body: 'dprint', frame: 'dprint', grip: 'dgrip' },
		defs: (u) =>
			pearl(u, 'pearl') +
			pat(
				u,
				'dprint',
				full(ref(u, 'pearl')) +
					line('M19.6 5.6 l1.6 2 M21.2 5.6 l-1.6 2 M22 5.6 l1.6 2 M23.6 5.6 l-1.6 2', '#16171a', 0.55) +
					line('M26.6 5.6 v1.8 M27.3 5.6 v1.8 M27.8 5.6 v1.8 M28.6 5.6 v1.8 M29.1 5.6 v1.8', '#16171a', 0.35) +
					`<rect x="31" y="5.8" width="1.3" height="1.3" fill="#16171a"/>` +
					line('M14 8.8 H52.6 M14 11.6 H50', '#16171a', 0.45) +
					line('M46 5.4 l-0.8 0.8 l0.8 0.8', '#16171a', 0.35)
			) +
			pat(u, 'dgrip', full('#16171a') + line('M19 13.4 L17 22.8', '#ff4fa8', 0.7) + line('M20 13.4 L18 22.8', '#4fc3ff', 0.7))
	},
	'de-code-red': {
		paint: { body: 'codered', frame: '#1e1f23', grip: 'cgrip' },
		defs: (u) =>
			pat(
				u,
				'codered',
				full('#d4212a') +
					`<rect x="13" y="6.9" width="41" height="1" fill="#f4f4f4"/><rect x="13" y="8.2" width="41" height="0.45" fill="#16171a"/>` +
					shape('M13 4 H21 L19.6 10.6 H13 Z', '#16171a') +
					line('M40 4.6 L44 10 M42 4.6 L46 10', '#f4f4f4', 0.5)
			) +
			pat(u, 'cgrip', full('#1a1b1f') + shape('M14.2 15.6 L16 18.4 L17.8 15.6 L16 16.6 Z M16 18.8 L15.2 20.6 H16.8 Z', '#d4212a'))
	},
	'de-kumicho': {
		paint: { body: 'kum', frame: 'kum', grip: 'kgrip' },
		defs: (u) =>
			lin(u, 'chrome', 0, 3, 0, 13, [
				[0, '#f2f5f8'],
				[0.35, '#b9c1ca'],
				[0.55, '#e3e8ed'],
				[1, '#8c96a0']
			]) +
			pat(
				u,
				'kum',
				full(ref(u, 'chrome')) +
					line('M15 9 C18 5 21 9 24 6.4 S30 5.6 33 8 S40 9.6 44 6.6 S50 6 52 7.6', '#4e5864', 0.4) +
					line('M17 8 l0.6 -0.8 M20 7.6 l0.6 0.8 M23 7 l0.6 -0.8 M29 6.4 l0.6 0.8 M35 8.4 l0.6 -0.8 M41 8 l0.6 0.8 M47 6.6 l0.6 -0.8', '#4e5864', 0.3) +
					shape('M50.6 6.6 L52.8 6 L52.4 7.8 Z', '#4e5864')
			) +
			pat(u, 'kgrip', full('#4a2060') + line('M14.6 14 C17.4 14.6 17.6 17 15.6 17.8 C13.8 18.6 14 21 16.6 21.4', '#f2eef6', 0.5) + `<circle cx="15" cy="14" r="0.45" fill="#f2eef6"/>`)
	},
	'de-fennec': {
		paint: { body: 'fennec', frame: 'fennec', grip: 'fennec' },
		defs: (u) =>
			pat(
				u,
				'fennec',
				full('#f6d8b0') +
					line('M13 5.4 C20 3.6 26 8.8 34 6 S46 4 54 6.4', '#f07a2a', 0.9) +
					line('M13 8.2 C20 6.4 27 10.6 35 8.4 S46 7 54 9', '#d8402a', 0.7) +
					line('M13 11.4 C22 10 30 13 40 11 S48 10.6 52 11.6', '#3aa6a0', 0.6) +
					line('M12 14 C16 15 14 18 18 19 S16 22 20 23', '#f07a2a', 0.9) +
					line('M15 13 C19 14 17 17 21 18', '#3aa6a0', 0.5)
			)
	},

	// ---------------- USP-S (Krait P68) ----------------
	'usp-kill-confirmed': {
		paint: { body: 'kc', can: 'kc', frame: '#2a1416' },
		defs: (u) =>
			pat(
				u,
				'kc',
				full('#8e1420') +
					line('M20 9.6 C23 6 26 10 29 7 S36 9.4 40 6.6 S48 9.6 53 6.8 S59 8.4 61 7.4', '#e9b83e', 0.45) +
					line('M37 9.6 C41 8.4 44 10 48 8.8', '#5a0a12', 0.5) +
					// the skull on the slide
					`<circle cx="17" cy="7.2" r="1.7" fill="#f2efe6"/>` +
					`<rect x="16" y="8.2" width="2" height="1.6" rx="0.4" fill="#f2efe6"/>` +
					`<circle cx="16.4" cy="7.3" r="0.45" fill="#1a0a0b"/><circle cx="17.6" cy="7.3" r="0.45" fill="#1a0a0b"/>` +
					line('M16.5 9.2 V9.8 M17 9.2 V9.8 M17.5 9.2 V9.8', '#1a0a0b', 0.2)
			)
	},
	'usp-neo-noir': {
		paint: { body: 'unoir', can: 'unoir', grip: '#16161c' },
		defs: (u) =>
			pat(u, 'dots', `<circle cx="0.5" cy="0.5" r="0.2" fill="#59d0ff"/>`, 1, 1) +
			pat(
				u,
				'unoir',
				full('#16161c') +
					shape('M20 5 C24 4.6 28 6 29 8.6 C29.4 10 27.6 10.6 26 10.2 L24.6 9 C22 8.6 20.4 7.4 20 6 Z', '#e03a96') +
					shape('M13.2 5 H17 L15.4 10.6 H13.2 Z', '#f0f0f0') +
					`<rect x="38" y="5.4" width="9" height="5.2" fill="${ref(u, 'dots')}"/>` +
					shape('M48 5.4 L56 5.4 L52 10.6 L46 10.6 Z', '#59d0ff') +
					line('M56.4 6.4 L60.6 9.6', '#e03a96', 0.5)
			)
	},
	'usp-traitor': {
		paint: { body: 'traitor', can: 'traitor' },
		defs: (u) =>
			pat(
				u,
				'traitor',
				full('#1c2a6e') +
					shape('M27 0 L64 0 L64 24 L33 24 Z', '#b81d24') +
					line('M27 0 L33 24', '#e2b34a', 0.5) +
					shape('M19.6 8.6 L20.2 6.6 L21.2 7.8 L22 6.2 L22.8 7.8 L23.8 6.6 L24.4 8.6 Z', '#e2b34a') +
					line('M38 6.8 H58 M38 9.2 H58', '#e2b34a', 0.3)
			)
	},
	'usp-orion': {
		paint: { body: 'oslide', can: 'orion', frame: '#3a3f46', grip: '#1c1d21' },
		defs: (u) =>
			pat(u, 'orion', full('#1d1e22') + `<rect x="36.6" y="0" width="1.4" height="24" fill="#ff8a1f"/><rect x="58.8" y="0" width="2.6" height="24" fill="#ff8a1f"/>` + line('M42.6 8.1 H51.4', '#ffb21f', 0.9) + line('M53 8.1 H55.6', '#ffb21f', 0.5)) +
			pat(u, 'oslide', full('#1d1e22') + `<rect x="13" y="9" width="23" height="0.7" fill="#ff8a1f"/><rect x="33.6" y="4" width="2" height="7" fill="#ff8a1f"/>`)
	},

	// ---------------- R8 Revolver (Mojave .357) ----------------
	'r8-fade': {
		paint: { body: 'rfade', frame: 'rfade', cylinder: '#cfd4da' },
		defs: (u) => fade(u, 'rfade', 54, 19)
	},
	'r8-amber-fade': {
		paint: { body: 'amber', frame: 'amber', cylinder: '#bcc6c0' },
		defs: (u) =>
			lin(u, 'amber', 54, 6, 19, 14, [
				[0, '#f08c12'],
				[0.35, '#f5c43c'],
				[0.65, '#c9c98c'],
				[1, '#98bba2']
			])
	},
	'r8-crimson-web': {
		paint: { body: 'rweb', frame: 'rweb', cylinder: 'rweb' },
		defs: (u) =>
			lin(u, 'red', 0, 4, 0, 16, [
				[0, '#c81b24'],
				[1, '#7a0b12']
			]) + pat(u, 'rweb', full(ref(u, 'red')) + line(web(41, 8.4, 9, 9, 4), '#1a0a0b', 0.28) + line(web(25.6, 10.4, 6, 8, 3, 1), '#1a0a0b', 0.28))
	},

	// ---------------- MP7 (VEL 46) ----------------
	'mp7-nemesis': {
		paint: { body: 'nem', stock: 'nem', grip: 'nem', fore: 'nem', mag: '#e8c33a' },
		defs: (u) =>
			pat(
				u,
				'nem',
				full('#22252a') +
					line('M14 8.6 L22 8.6 L24 10.6 L34 10.6 L36 8.6 L44 8.6', '#e8c33a', 0.5) +
					shape('M27 11.4 L29.4 13.6 L31 11.4 L33.4 13.4 L32 10.8 L29.6 12.2 L28 10.8 Z', '#e8c33a') +
					line('M10.4 10 H13.2 M10.4 12 H13.2 M10.4 17 H13.2 M36.8 15 H40.8 M36.8 19.6 H40.8 M21.4 17 L26.8 17 M21 19 H26.4', '#e8c33a', 0.45)
			)
	},
	'mp7-fade': {
		paint: { body: 'mfade', stock: 'mfade' },
		defs: (u) => fade(u, 'mfade', 45, 10)
	},
	'mp7-smoking-kills': {
		paint: { body: 'smk', stock: 'smk', fore: '#5b33b8', grip: '#1aa3a0', mag: '#5b33b8' },
		defs: (u) =>
			pat(
				u,
				'smk',
				full('#1fb2ad') +
					blobs(42, 6, [14, 7, 44, 14], ['#ff4fb8', '#e8379f'], [1.2, 2.6], 0.9) +
					// a skull with a cigarette, smoke curling up
					`<circle cx="30" cy="9.8" r="2" fill="#f4f1ea"/><rect x="28.9" y="10.8" width="2.2" height="1.8" rx="0.4" fill="#f4f1ea"/>` +
					`<circle cx="29.3" cy="9.8" r="0.5" fill="#1a1a1d"/><circle cx="30.7" cy="9.8" r="0.5" fill="#1a1a1d"/>` +
					line('M31 12.2 L34.4 11.6', '#fff', 0.55) +
					`<circle cx="34.6" cy="11.56" r="0.32" fill="#ff7a2a"/>` +
					line('M34.8 11 C35.6 10 34.6 9.2 35.4 8.2', '#d6dde0', 0.35) +
					line('M10.4 9 V19', '#5b33b8', 0.7)
			)
	},

	// ---------------- XM1014 (Rezi 12) ----------------
	'xm-tranquility': {
		paint: { body: 'tranq', fore: 'tranq', barrel: 'tranq', mag: 'tranq', stock: 'tranq', grip: '#7a2026' },
		defs: (u) =>
			pat(
				u,
				'tranq',
				full('#d65a5c') +
					line('M18 12 C22 10.6 24 13 28 11.6 M36 12.4 C40 11.4 42 13 46 12', '#9c2c32', 0.5) +
					line('M18 9 C21 7.4 23 11.4 27 9.6 S35 8 40 10.6 S48 9.6 52 8.4', '#e9c25a', 0.45) +
					line('M20.6 8.8 l0.4 -0.7 M24.6 10.4 l0.4 -0.7 M30 9 l0.4 0.7 M36 9.4 l0.4 0.7 M44 10 l0.4 -0.7', '#e9c25a', 0.3) +
					line('M7 12 L17.4 10.4 M7 15.8 L17 12.8', '#e9c25a', 0.25)
			)
	},
	'xm-incinegator': {
		paint: { body: 'incin', fore: 'incin', stock: 'incin', mag: 'incin', grip: '#3a3a26', barrel: '#2d2f2b' },
		defs: (u) =>
			pat(
				u,
				'incin',
				full('#8d8a4e') +
					shape('M43 8.2 L43 13.8 L37 13.6 C34 13.4 31 12.6 26 13 C29 11.6 31.4 11 33.4 10.8 C29 10.2 24 10.4 19 11 C23 9.2 27.4 8.4 31.6 8.4 C35 8.2 39 8 43 8.2 Z', '#2a2a1a') +
					shape('M43 8.6 L43 13.4 L38 13.2 C35.4 13 33 12.4 29.6 12.4 C32 11.4 34 11 35.6 10.8 C32.6 10.4 29.4 10.4 26 10.8 C29 9.4 32 8.8 35.6 8.8 C38 8.6 40.6 8.6 43 8.6 Z', '#f08a1f') +
					shape('M43 9 L43 13 L40.4 13 C39.4 12.2 40.4 11.4 39 10.6 C40 10 39.4 9.4 40.4 9 Z', '#ffd23a') +
					shape('M56.4 9.8 H58 V12 H56.4 Z', '#f08a1f') +
					line('M7.4 11.8 L17 10 M7.6 15.4 L17 12.6', '#f08a1f', 0.35)
			)
	},
	'xm-entombed': {
		paint: { body: 'erecv', fore: 'ent', stock: 'ent', grip: 'ent', mag: '#8a6a3c', barrel: '#6e5230' },
		defs: (u) =>
			pat(
				u,
				'erecv',
				full('#2f3a9e') +
					line('M17 8.4 H33.6 M17 11.8 H33.6', '#e3b448', 0.45) +
					// little Egyptian signs between the bands: an eye and an ankh
					line('M21 10.1 C21.8 9.3 23 9.3 23.8 10.1 C23 10.9 21.8 10.9 21 10.1 Z M24.2 10.6 L23.6 11.4', '#e3b448', 0.3) +
					`<circle cx="22.4" cy="10.1" r="0.3" fill="#e3b448"/>` +
					line('M28 11.4 V9.6 M27.2 10.2 H28.8', '#e3b448', 0.35) +
					`<ellipse cx="28" cy="9.2" rx="0.45" ry="0.55" fill="none" stroke="#e3b448" stroke-width="0.3"/>`
			) +
			pat(u, 'ent', full('#b08a52') + line('M33.4 9.4 H43.2 M33.4 12.6 H43.2 M7 12 L17.4 10.4', '#e3b448', 0.4) + line('M34 11 h1 M36 11 h1 M38 11 h1 M40 11 h1 M42 11 h1', '#5a3c1c', 0.4))
	},

	// ---------------- ★ Karambit (FSS Carbon Edge 1095) ----------------
	'kb-ruby': {
		paint: { blade: 'ruby' },
		defs: (u) =>
			lin(u, 'rg', 36, 8, 58, 20, [
				[0, '#ff5a6a'],
				[0.45, '#e0102a'],
				[1, '#7c0014']
			]) + pat(u, 'ruby', full(ref(u, 'rg')) + blobs(9, 10, [37, 8, 57, 18], ['#ff8c98', '#a8001c', '#ff3a50'], [0.8, 2.2], 0.55))
	},
	'kb-sapphire': {
		paint: { blade: 'sapph' },
		defs: (u) =>
			lin(u, 'sg', 36, 8, 58, 20, [
				[0, '#7ab4ff'],
				[0.45, '#1f55ff'],
				[1, '#0a1a8c']
			]) + pat(u, 'sapph', full(ref(u, 'sg')) + blobs(11, 10, [37, 8, 57, 18], ['#a8ccff', '#0c2ab0', '#3d78ff'], [0.8, 2.2], 0.55))
	},
	'kb-emerald': {
		paint: { blade: 'emer' },
		defs: (u) =>
			lin(u, 'eg', 36, 8, 58, 20, [
				[0, '#6dffa6'],
				[0.45, '#10c25a'],
				[1, '#034a22']
			]) + pat(u, 'emer', full(ref(u, 'eg')) + blobs(13, 10, [37, 8, 57, 18], ['#b2ffd0', '#027a36', '#2ee07a'], [0.8, 2.2], 0.55))
	},
	'kb-lore': {
		paint: { blade: 'lore', handle: '#3e5a2c', ring: '#d9b04a' },
		defs: (u) =>
			brushedGold(u, 'lg') +
			pat(
				u,
				'lore',
				full(ref(u, 'lg')) +
					line('M38 10.6 C40 9.6 42 11.6 44 10.6 S48 9.8 50 11.4 S54 13 56 15.6', '#6a4a14', 0.35) +
					line('M38 10.6 C40 11.6 42 9.6 44 10.6 S48 11.8 50 10.8', '#6a4a14', 0.3) +
					line('M37.6 12.4 C44 11.6 50 12.6 55.4 16.6', '#fff3c4', 0.4)
			)
	},
	'kb-marble-fade': {
		paint: { blade: 'mf' },
		defs: (u) =>
			lin(u, 'mfg', 58, 20, 36, 9, [
				[0, '#2a5ae0'],
				[0.25, '#6a3ad0'],
				[0.5, '#e8202a'],
				[0.75, '#ffd23a'],
				[1, '#e8202a']
			]) + pat(u, 'mf', full(ref(u, 'mfg')) + blobs(21, 8, [37, 8, 56, 17], ['#ffd23a', '#e8202a', '#2a5ae0'], [0.8, 2], 0.6))
	},
	'kb-tiger-tooth': {
		paint: { blade: 'tt' },
		defs: (u) =>
			lin(u, 'ttg', 36, 8, 58, 20, [
				[0, '#ffd75a'],
				[0.6, '#f0a51c'],
				[1, '#c86c0c']
			]) +
			pat(
				u,
				'tt',
				full(ref(u, 'ttg')) +
					shape('M39 7 L40.4 7 L39.8 14 Z M42.6 7 L44.2 7.2 L43 14 Z M46.4 7.6 L48 8 L46 13.6 Z M50 9 L51.6 9.8 L49 14 Z M53 11 L54.6 12.2 L51.6 15.4 Z M55.4 14 L56.8 15.6 L54 17.4 Z', '#3a2208')
			)
	},
	'kb-crimson-web': {
		paint: { blade: 'kweb' },
		defs: (u) =>
			lin(u, 'kr', 36, 8, 58, 20, [
				[0, '#d4202a'],
				[1, '#7a0b12']
			]) + pat(u, 'kweb', full(ref(u, 'kr')) + line(web(47, 11.6, 8, 9, 4), '#140607', 0.3))
	},
	'kb-case-hardened': {
		paint: { blade: 'kch' },
		defs: (u) =>
			lin(u, 'kchb', 36, 8, 58, 20, [
				[0, '#8fb0f0'],
				[0.5, '#3a63cc'],
				[1, '#23409e']
			]) +
			pat(
				u,
				'kch',
				full(ref(u, 'kchb')) +
					blobs(661, 16, [36, 7, 58, 20], ['#1f3fa8', '#5b3fc0', '#9ab8ff', '#7a4fd0', '#b9d0ff'], [0.8, 2.4]) +
					blobs(387, 3, [38, 8, 56, 18], ['#d6b04c'], [0.5, 1.1], 0.9)
			)
	}
} satisfies Record<string, SkinArt>;

export type ArtSkin = keyof typeof SKIN_ART;
