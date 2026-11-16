/**
 * Pictures for the Extra camos tab (2026-11-16, the user's ask: "pictures for all stickers, decals
 * and also camos where they're missing"). Keyed by the extra camo's id (data/extraCamos.ts), drawn
 * by camoSwatch.ts in our own style, NEVER the game's textures. Only camos we have actually seen a
 * picture of get one; `after` says which picture (shown in the info box). The rest keep the tab's
 * symbol: Dusted Chevron (no picture anywhere, 16 Nov) and the three entries without a camo name yet.
 *
 * Pictures looked at (all 16 Nov, the copies stay private in the session's scratchpad):
 * - Activision: the BlackCell camo panel (Season 1 blog, labelled, with a swatch per camo), the
 *   Warzone "Event camos" panel (4 rifles, unlabelled), the pre-order panel (Moonlit Pearl top,
 *   Gilded Ruin bottom, named in the caption) and the Pyroclast panel (Progression blog).
 * - In-game screenshots that name the camo: timesaver.gg (Violet Striker, Neutral Ground, the
 *   Classified Weapon camo) and GameRant (Gold Mosaic, Gold Excellence in the Grind for Royalty
 *   preview). They settle the Warzone panel: gold lattice = Gold Excellence, purple streaks = Violet
 *   Striker, lilac triangles = Neutral Ground, so the teal one is Renaissance (also bosslobbies'
 *   Renaissance picture: the same teal bird).
 * - Camo pictures on bosslobbies.com (every one we could compare matches Activision's or an
 *   in-game screenshot), codmunity.gg's renders (the Pyroclast stages) and mw4camos.com.
 *
 * Pyroclast Terminus / Scatter / Cascade are drawn here after codmunity's renders + bosslobbies'
 * pictures (dark shards → green streaks → bright green-white streaks). The weapon card's
 * PRESTIGE_LOOKS (specialLooks.ts) use these same three looks since 2026-11-16 (they had been drawn
 * after mw4camos.com, whose Terminus and Cascade pictures are the same file as its Prestige Master one).
 *
 * Tested in scripts/extra-camos.test.js (every key is a real extra camo, every look draws).
 */
import type { Look } from '#lib/camoSwatch.ts';

export interface ExtraLook {
	look: Look;
	/** What the picture was drawn after, finishing the sentence "made after …". */
	after: string;
}

const BLACKCELL = 'Activision’s BlackCell camo picture (Season 1 blog), which names each camo and shows its swatch';
const WZ_PANEL = 'Activision’s Warzone event-camo picture';

export const EXTRA_LOOKS: Record<string, ExtraLook> = {
	// ----- Events -----
	'event-venom-pile': {
		look: { k: 'motif', m: 'snakes', bg: '#151515', colors: ['#393937', '#6a6a64', '#0b0b0b', '#8e8e86'] },
		after: 'bosslobbies.com’s picture of the camo (grey snakes coiled over each other); we found no second picture to compare'
	},
	'event-renaissance': {
		look: { k: 'motif', m: 'phoenix', bg: '#172a46', colors: ['#6fc8d6', '#2f8a9e', '#aee0e8'] },
		after: `bosslobbies.com’s picture of the camo (a teal bird with spread wings on navy). It matches the teal rifle in ${WZ_PANEL}, which doesn’t label its camos: the other three there are named in in-game screenshots, so the teal one is Renaissance`
	},
	'event-violet-striker': {
		look: { k: 'stripes', bg: '#1d1c28', layers: [['#2b2750', 10, 3], ['#3f3674', 20, 2.6], ['#5146a4', 16, 1.8]], angle: -62, len: 40, jitter: 4 },
		after: `an in-game screenshot on timesaver.gg that names it, and the purple rifle in ${WZ_PANEL}`
	},
	'event-neutral-ground': {
		look: { k: 'trigrid', iso: true, colors: ['#62d6ee', '#86c6f2', '#a993ea', '#c89de8', '#70e4e2', '#a0b8f4'], cell: 17, line: '#f6f8ff', dots: '#2a2a44', blur: 1.3 },
		after: `an in-game screenshot on timesaver.gg that names it, and the lilac rifle in ${WZ_PANEL}`
	},
	'event-gold-mosaic': {
		look: { k: 'diamonds', colors: ['#b97a76', '#d0a43e'], size: 22, rim: '#ecca6a', emblem: '#6a4614' },
		after: 'GameRant’s in-game screenshot of the Grind for Royalty preview that names it (rose and gold diamonds with little crowns)'
	},
	'event-gold-excellence': {
		look: { k: 'diamonds', colors: ['#d4a236'], size: 15, rim: '#f4cf50', shade: '#24120c', seal: '#f2c23e' },
		after: `GameRant’s in-game screenshot of the Grind for Royalty preview that names it; the same gold lattice is the gold rifle in ${WZ_PANEL}`
	},

	// ----- Secrets & hidden challenges -----
	'easteregg-classified': {
		look: { k: 'stripes', bg: '#c8161a', layers: [['#8e0c10', 12, 8], ['#e02a24', 8, 6], ['#140304', 36, 4.5]], angle: -52, len: 32, jitter: 6 },
		after: 'an in-game screenshot on timesaver.gg of the Classified Weapon event camo (red with black stripes), and bosslobbies.com’s picture of it'
	},

	// ----- Challenges -----
	'challenge-war-spoils': {
		look: { k: 'pixels', bg: '#7a3e0e', layers: [['#c0661a', 0.26, 7], ['#e89a3a', 0.12, 5], ['#3a1a06', 0.1, 4], ['#aaa59d', 0.14, 9], ['#f4c070', 0.04, 3]], cell: 1.2, sx: 7 },
		after: 'the pictures of it on mw4camos.com and bosslobbies.com (orange glitch streaks)'
	},
	'challenge-hajin': {
		look: {
			k: 'overlay',
			base: { k: 'pixels', bg: '#15210e', layers: [['#24381a', 0.3, 7], ['#3c5a26', 0.18, 5], ['#6f9844', 0.1, 3], ['#0b1208', 0.12, 5]], cell: 2.4 },
			marks: [
				{ t: 'dashes', c: '#d8b820', n: 6 },
				{ t: 'text', s: 'HAJIN', x: 50, y: 51, size: 15, c: '#e4c41e' }
			]
		},
		after: 'bosslobbies.com’s picture of the camo (green camo with a yellow HAJIN stencil); we found no second picture to compare'
	},
	'challenge-flashpoint': {
		look: { k: 'waves', bg: '#120a22', colors: ['#f08a3a', '#e8506a', '#3a5ad8', '#1c1440', '#9a5ae0', '#5ad8e8', '#f0c060', '#28287a', '#d860b0', '#f4b0c0', '#2a1838'], n: 36, amp: 0.12 },
		after: 'bosslobbies.com’s picture of the camo (thin neon stripes); Activision hasn’t shown it and we found no second picture'
	},

	// ----- BlackCell -----
	'blackcell-infiltrator': {
		look: { k: 'specks', bg: '#1b1b1b', noise: '#3c3c3c', colors: ['#e0a030', '#c88420', '#f2c040', '#e8e0d0'], n: 90, band: 13, size: 1.1 },
		after: BLACKCELL
	},
	'blackcell-cell-ops': {
		look: {
			k: 'overlay',
			base: { k: 'pixels', bg: '#4c4c4c', layers: [['#2e2e2e', 0.22, 6], ['#6c6c6c', 0.2, 5], ['#141414', 0.07, 3], ['#d2d2d2', 0.05, 2]], cell: 3.2, sx: 1.4 },
			marks: [{ t: 'dots', c: '#d0282c', y: 50, n: 8, r: 1.5 }]
		},
		after: BLACKCELL
	},
	'blackcell-gold-tiger': {
		look: { k: 'stripes', bg: '#625e4a', layers: [['#2e2c22', 30, 2], ['#1e1d16', 50, 2.6]], angle: -28, len: 50, jitter: 10 },
		after: BLACKCELL
	},
	'blackcell-whirlpool': {
		look: { k: 'topo', bg: '#545454', line: '#b6b6b6', width: 0.55, dense: true },
		after: BLACKCELL
	},
	'blackcell-intercept': {
		look: { k: 'motif', m: 'zigzag', bg: '#151515', colors: ['#94742a'] },
		after: BLACKCELL
	},
	'blackcell-spinal-verge': {
		look: { k: 'gradient', stops: ['#c43a2c', '#a82c24', '#7a1a16', '#4a0a0a'], angle: 0, specks: ['#d24a38', '#8a1c16', '#b8342a'] },
		after: BLACKCELL
	},

	// ----- Prestige -----
	'prestige-pyroclast': {
		look: { k: 'motif', m: 'pyro', bg: '#060606', colors: ['#0b0b0b', '#c4c4c4', '#86d82c'] },
		after: 'Activision’s Pyroclast picture (Progression blog) and codmunity.gg’s render (black glossy scales with green edges)'
	},
	'prestige-pyroclast-terminus': {
		look: { k: 'stripes', bg: '#0c0c0c', layers: [['#2a2a26', 14, 5], ['#55554f', 22, 5], ['#7c7c74', 18, 4], ['#6c9a24', 14, 2.6], ['#9cc43a', 18, 2.2]], angle: -58, len: 22, jitter: 6 },
		after: 'codmunity.gg’s render and bosslobbies.com’s picture (dark shards with green flecks)'
	},
	'prestige-pyroclast-scatter': {
		look: { k: 'stripes', bg: '#0a0b06', layers: [['#2e3a14', 16, 5], ['#8a766c', 20, 4.5], ['#7ab03a', 26, 2.6], ['#b8e04a', 18, 2], ['#e4ecc8', 6, 1.6]], angle: -58, len: 24, jitter: 6 },
		after: 'codmunity.gg’s render and bosslobbies.com’s picture (green and rose-brown streaks)'
	},
	'prestige-pyroclast-cascade': {
		look: { k: 'stripes', bg: '#0e120c', layers: [['#2c3a22', 10, 6], ['#5aa82a', 16, 4], ['#9ee050', 16, 3], ['#e6f0dc', 14, 3.4], ['#c8f08a', 8, 2]], angle: -40, len: 34, jitter: 5 },
		after: 'codmunity.gg’s render and bosslobbies.com’s picture (bright green and white streaks)'
	},
	'prestige-prestige-master-camo': {
		look: { k: 'shards', bg: '#010601', colors: ['#041404', '#062006', '#0b3d0b', '#0f5a10', '#178a1a', '#36c832', '#a6ff70'], n: 90, size: 18, glow: '#56ff3a' },
		after: 'bosslobbies.com’s picture of the camo (glowing green crystal); the same look shows as a locked camo in players’ screenshots, but nothing official names it'
	},

	// ----- Pre-order & beta -----
	'edition-moonlit-pearl': {
		look: { k: 'motif', m: 'scroll', bg: '#1d1d20', colors: ['#c0609a', '#ebe9e4', '#c6d29a', '#d9d9d6', '#2c2c30'] },
		after: 'Activision’s pre-order picture, which names it (the top rifle), and bosslobbies.com’s picture'
	},
	'edition-gilded-ruin': {
		look: { k: 'motif', m: 'kintsugi', bg: '#15110d', colors: ['#d6ae4c', '#b01e1c', '#e6d9c4', '#5c5448', '#251e17'] },
		after: 'Activision’s pre-order picture, which names it (the bottom rifle), and bosslobbies.com’s picture'
	},
	'edition-litmus': {
		look: {
			k: 'overlay',
			base: { k: 'pixels', bg: '#3e4434', layers: [['#2e3326', 0.25, 6], ['#575e48', 0.2, 6], ['#6c7258', 0.1, 4], ['#1c2018', 0.08, 3]], cell: 1.8, sx: 4 },
			marks: [
				{ t: 'text', s: 'BETA TEST', x: 28, y: 53, size: 8, c: '#f2f2f2', plate: '#141414', rot: -7 },
				{ t: 'text', s: 'I WAS THERE', x: 72, y: 50, size: 6.5, c: '#2a2418', plate: '#d8c8a0', rot: -3, hand: true }
			]
		},
		after: 'bosslobbies.com’s picture of the camo (BETA TEST and I WAS THERE stickers on grey-green camo); the same camo shows in a player’s Warzone camo list on timesaver.gg'
	},

	// ----- Account & promotions -----
	'promo-locked-down': {
		look: { k: 'motif', m: 'shields', bg: '#0a110d', colors: ['#12402b', '#33d07c', '#e6efe9', '#1d7a4a', '#b0303a'] },
		after: 'the pictures of it on mw4camos.com and bosslobbies.com (green shields with keyholes over code)'
	}
};
