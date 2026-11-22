/**
 * Sights (the user's ask, 2026-11-22: "research which sights have the least visual recoil, and a little list
 * of which sights are best for which weapons, under the top 5 meta, a little tab of its own"). SightsSection.
 *
 * Dated SNAPSHOT. Nobody has published a measured visual-recoil test for MW4 yet (checked 22 Nov: the guides
 * only say "slide the sight to Near" and raise the FOV, and no site ranks the optics). What we do have is the
 * game's own optic stats, which ggranked.com lists per weapon (read 22 Nov from its 30 MW4 weapon pages,
 * "Last updated: 20 November 2026"): the zoom level, ADS Gun Kick (how far the view kicks per shot) and ADS
 * Recoil Control (the real recoil), as multipliers against the gun's own sights. 1x sights (mini reflex and
 * reflex) and the 2x/3x holos carry no multipliers at all; the magnified scopes cut kick and recoil.
 *
 * "On-screen kick" is OUR ESTIMATE: zoom × gun kick, against a red dot = 1. A 2x sight makes everything twice
 * as big, the kick too, so a holo (no kick cut) shows twice the jump of a red dot, while a 4x scope with kick
 * ×0.7 shows 2.8×. It only compares sights on normal guns: on the three sniper rifles the multipliers are
 * measured against their own 11.2x scope (a red dot there has kick ×2.5), so the snipers and their own scopes
 * are left out here; their row in the per-weapon list only shows what the meta builds use.
 *
 * Research notes: mw4-kunskap/meta.md "Sikten och visuell rekyl (koll 2026-11-22)". Refresh together with
 * loadouts.ts. Pure (no Svelte), tested in scripts/sights.test.js.
 */

import { LOADOUTS, type LoadoutMode } from './loadouts.ts';

export const SIGHTS_DATE = '2026-11-22';
/** When ggranked.com last updated the pages the numbers come from. */
export const SIGHTS_SOURCE_DATE = '2026-11-20';
export const SIGHTS_SOURCE = 'ggranked.com';

/** The game's own label for the optic. */
export type SightType = 'Mini Reflex' | 'Reflex' | 'Holo' | '4x Scope' | 'Rifle Scope' | 'Shotgun Scope' | 'Marksman Scope';

export interface Sight {
	name: string;
	type: SightType;
	/** Zoom on most guns (assault rifles, LMGs, marksman rifles). */
	zoom: number;
	/** ADS Gun Kick multiplier: how far the view kicks per shot (1 = like iron sights). */
	kick: number;
	/** ADS Recoil Control multiplier: the real recoil (1 = no change). */
	recoil: number;
	/** The (non-sniper) guns it fits, weapon ids. */
	guns: readonly string[];
	/** Guns where the zoom differs (the holos are 3x on SMGs, most 4x scopes 5x). */
	zoomOn?: Readonly<Record<string, number>>;
	thermal?: boolean;
}

// ---------- gun groups (weapon ids from weapons.ts) ----------
const AR8 = ['han-86', 'm4', 'hyeon-burst', 'patriot-xmr', 'oden', 'axion', 'cronen-squall', 'cronen-osprey'];
/** The Kastov 762 takes the pistol mini reflexes instead of the four slim ones. */
const AR = [...AR8, 'kastov-762'];
const SMG = ['iso-nightshade', 'vel-46', 'wz-55-striga', 'ppsh-41', 'x-58-nyx'];
/** The Wz.55 Striga has neither the Corio Bisect nor the SZ Lonewolf Flip. */
const SMG4 = SMG.filter((g) => g !== 'wz-55-striga');
const SG = ['rezi-12', 'warlord'];
const LMG2 = ['type-73', 'apoc-338'];
const MR = ['mar-9', 'oris-8-6', 'mosin-nagant'];
const MR2 = ['mar-9', 'oris-8-6'];
const BIG_PISTOLS = ['50-gs', 'mojave-357'];

const at = (zoom: number, guns: readonly string[]) => Object.fromEntries(guns.map((g) => [g, zoom]));

const sight = (name: string, type: SightType, zoom: number, kick: number, recoil: number, guns: readonly string[], extra: Partial<Sight> = {}): Sight => ({
	name,
	type,
	zoom,
	kick,
	recoil,
	guns,
	...extra
});

const MINI_GUNS = [...AR8, ...SMG, ...SG, 'finn-lmg', ...LMG2, ...MR];
const PISTOL_DOT_GUNS = ['kastov-762', 'csg-35', 'sang-9mm', 'krait-p68', ...BIG_PISTOLS];
const REFLEX_GUNS = [...AR, ...SMG, 'csg-35', ...SG, 'finn-lmg', ...LMG2, ...MR, ...BIG_PISTOLS];
const HOLO_GUNS = [...AR, 'finn-lmg', ...LMG2, ...MR, ...SMG, ...SG, ...BIG_PISTOLS];
const HOLO_3X = at(3, [...SMG, ...SG, ...BIG_PISTOLS]);
const RIFLE_GUNS = [...AR, ...LMG2, ...MR];

/**
 * Every sight on the non-sniper guns, in the order picks prefer them when the numbers tie (the most used
 * first: Slimline Elite and ZLR Type C in the pros' builds, Cronen R808 in the meta builds).
 */
export const SIGHTS: readonly Sight[] = [
	// 1x mini reflex: "A slim dot optic that provides a clear sight picture" (IOTA-D: "low-profile frame")
	sight('Slimline Elite', 'Mini Reflex', 1, 1, 1, MINI_GUNS),
	sight('ZLR Type C', 'Mini Reflex', 1, 1, 1, MINI_GUNS),
	sight('SZ Prima-4 Dot', 'Mini Reflex', 1, 1, 1, MINI_GUNS),
	sight('IOTA-D', 'Mini Reflex', 1, 1, 1, MINI_GUNS),
	// the pistol mini reflexes (pistols, CSG-35, Kastov 762)
	sight('Z-Dot 9', 'Mini Reflex', 1, 1, 1, PISTOL_DOT_GUNS),
	sight('Cronen Zero-K', 'Mini Reflex', 1, 1, 1, PISTOL_DOT_GUNS),
	sight('Bruen Clash-40', 'Mini Reflex', 1, 1, 1, PISTOL_DOT_GUNS),
	// 1x reflex: "snappy" dot sights with a bigger frame
	sight('SZ Micro D-3', 'Reflex', 1, 1, 1, REFLEX_GUNS),
	sight('FJX 708 PRO', 'Reflex', 1, 1, 1, REFLEX_GUNS),
	sight(
		'SZ SRE-7',
		'Reflex',
		1,
		1,
		1,
		REFLEX_GUNS.filter((g) => g !== 'finn-lmg')
	),
	sight('VLK Trimmer', 'Reflex', 1, 1, 1, REFLEX_GUNS),
	// holos: 2x (3x on SMGs, shotguns and the big pistols), no kick or recoil change
	sight('SZ Lonewolf Holo', 'Holo', 2, 1, 1, HOLO_GUNS, { zoomOn: HOLO_3X }),
	sight('SZ Helios Holo', 'Holo', 2, 1, 1, HOLO_GUNS, { zoomOn: HOLO_3X }),
	sight('SZ Echelon Holo', 'Holo', 2, 1, 1, HOLO_GUNS, { zoomOn: HOLO_3X }),
	sight('KV Corsac Holo', 'Holo', 2, 1, 1, HOLO_GUNS, { zoomOn: HOLO_3X }),
	sight('Bruen THRM-60 Optic', 'Holo', 2, 1, 1, [...AR, ...MR, ...SMG, ...SG, ...BIG_PISTOLS], { zoomOn: HOLO_3X, thermal: true }),
	// the steadiest scope for rifles: kick ×0.6 and recoil ×0.7 at 4x, with a canted dot on the side
	sight('Locus PX3 Canted', 'Rifle Scope', 4, 0.6, 0.7, [...AR, ...LMG2, ...MR2]),
	// the pistol 4x: same numbers, but ADS Idle Sway ×3
	sight('Bruen Field-Op', '4x Scope', 4, 0.6, 0.7, BIG_PISTOLS),
	// 4x scopes: kick ×0.7, recoil ×0.9 (5x on most SMGs, shotguns and the .50 GS; the R808 stays 4x on SMGs)
	sight('Cronen R808', '4x Scope', 4, 0.7, 0.9, [...AR, ...SMG, 'finn-lmg', ...LMG2, ...MR, ...SG, '50-gs'], { zoomOn: at(5, [...SG, '50-gs']) }),
	sight('GL K230', '4x Scope', 4, 0.7, 0.9, [...AR, ...SMG, 'finn-lmg', ...LMG2, ...MR, ...SG, '50-gs'], { zoomOn: at(5, [...SMG, ...SG, '50-gs']) }),
	sight('SZ Lonewolf Flip', '4x Scope', 4, 0.7, 0.9, [...AR, ...SMG4, 'finn-lmg', ...LMG2, ...MR, ...SG], { zoomOn: at(5, [...SMG4, ...SG]) }),
	sight('Corio Bisect', '4x Scope', 4, 0.7, 0.9, [...AR, ...SMG4, 'finn-lmg', ...LMG2, ...MR2, ...SG], { zoomOn: at(5, [...SMG4, ...SG]) }),
	sight('Schlager Night View Pro', '4x Scope', 4, 0.7, 0.9, [...AR, ...SMG, 'finn-lmg', ...LMG2, ...MR, ...SG, '50-gs'], {
		zoomOn: at(5, [...SMG, ...SG, '50-gs']),
		thermal: true
	}),
	// the shotgun scope (for slugs)
	sight('ZLR Swordfish', 'Shotgun Scope', 5, 0.6, 0.7, SG),
	// marksman scopes: the biggest kick cut in the game (×0.5)
	sight('GW Löwe-55', 'Marksman Scope', 8, 0.5, 0.6, MR),
	sight('Luca Stormwatch', 'Marksman Scope', 8, 0.5, 0.6, MR, { thermal: true }),
	// 7x rifle scopes
	sight('Schlager 7x', 'Rifle Scope', 7, 0.6, 0.7, RIFLE_GUNS),
	sight('Schlager Dogfight GI', 'Rifle Scope', 7, 0.6, 0.7, RIFLE_GUNS),
	sight('RVX9 Thermo', 'Rifle Scope', 7, 0.6, 0.7, RIFLE_GUNS, { thermal: true }),
	sight('Corvus Avis-0', 'Marksman Scope', 9, 0.5, 0.6, MR2),
	sight('Corio D51 Scope', 'Marksman Scope', 9, 0.5, 0.6, MR),
	sight('SZ CNT-R6 Optic', 'Marksman Scope', 9, 0.5, 0.6, ['oris-8-6']),
	sight('VLK 1940-R 9x', 'Marksman Scope', 9, 0.5, 0.6, ['mosin-nagant']),
	sight('SZ MN-Scout 9x', 'Marksman Scope', 9, 0.5, 0.6, ['mosin-nagant']),
	sight('Schlager Indigo-RF', 'Marksman Scope', 10, 0.5, 0.6, MR),
	sight('VLK Rize-40', 'Rifle Scope', 8, 0.7, 0.9, RIFLE_GUNS),
	sight('Expedite 308 DR2', 'Marksman Scope', 9, 0.7, 0.9, MR)
];

export const SIGHT_BY_NAME: ReadonlyMap<string, Sight> = new Map(SIGHTS.map((s) => [s.name, s]));

/** The sniper rifles: their optic numbers are against their own 11.2x scope, so they're not compared here. */
export const SNIPERS: readonly string[] = ['kg-7-vulcan', 'astaroth-57', 'signal-50'];

/** One row of the "least visual recoil" list: sights with the same numbers. */
export interface SightTier {
	id: string;
	title: string;
	/** Names from SIGHTS, best first. */
	sights: readonly string[];
	zoom: number;
	kick: number;
	recoil: number;
	/** Where the zoom differs, in words. */
	zoomNote?: string;
	note: string;
}

export const SIGHT_TIERS: readonly SightTier[] = [
	{
		id: 'mini',
		title: '1x mini reflex',
		sights: ['Slimline Elite', 'ZLR Type C', 'SZ Prima-4 Dot', 'IOTA-D', 'Z-Dot 9', 'Cronen Zero-K', 'Bruen Clash-40'],
		zoom: 1,
		kick: 1,
		recoil: 1,
		note: 'The steadiest picture: no zoom, so the kick looks as small as it gets, and the game calls these slim, low-profile frames, so the least sight shakes in view. Z-Dot 9, Cronen Zero-K and Bruen Clash-40 are the versions for pistols, the CSG-35 and the Kastov 762.'
	},
	{
		id: 'reflex',
		title: '1x reflex',
		sights: ['SZ Micro D-3', 'FJX 708 PRO', 'SZ SRE-7', 'VLK Trimmer'],
		zoom: 1,
		kick: 1,
		recoil: 1,
		note: 'The same kick as the mini reflexes (no zoom), but a bigger frame around the dot.'
	},
	{
		id: 'holo',
		title: 'Holo sights',
		sights: ['SZ Lonewolf Holo', 'SZ Helios Holo', 'SZ Echelon Holo', 'KV Corsac Holo', 'Bruen THRM-60 Optic'],
		zoom: 2,
		kick: 1,
		recoil: 1,
		zoomNote: '3x on SMGs, shotguns, the .50 GS and the Mojave (3× on screen)',
		note: 'The game gives holos no kick cut, so the zoom makes every jump look twice as big as on a red dot, and the real recoil stays the same. Bruen THRM-60 is thermal.'
	},
	{
		id: 'locus',
		title: 'Locus PX3 Canted',
		sights: ['Locus PX3 Canted', 'Bruen Field-Op'],
		zoom: 4,
		kick: 0.6,
		recoil: 0.7,
		note: 'The steadiest scope: kick ×0.6 and 30% less real recoil at 4x, plus a canted dot on the side for close range. Fits assault rifles, the Type 73, APOC-338, MAR-9 and Oris 8.6. Bruen Field-Op is the 4x for the .50 GS and Mojave with the same numbers, but it sways three times as much while aiming.'
	},
	{
		id: 'scope4',
		title: '4x scopes',
		sights: ['Cronen R808', 'GL K230', 'SZ Lonewolf Flip', 'Corio Bisect', 'Schlager Night View Pro'],
		zoom: 4,
		kick: 0.7,
		recoil: 0.9,
		zoomNote: '5x on most SMGs, the shotguns and the .50 GS (3.5× on screen); the Cronen R808 stays 4x on SMGs',
		note: 'Kick ×0.7 and 10% less real recoil. The Cronen R808 is what most meta builds use. Lonewolf Flip flips to a close holo, Corio Bisect has an angled dot, Night View Pro is thermal.'
	},
	{
		id: 'swordfish',
		title: 'ZLR Swordfish (shotguns)',
		sights: ['ZLR Swordfish'],
		zoom: 5,
		kick: 0.6,
		recoil: 0.7,
		note: 'The shotgun scope, for slug builds on the Rezi 12 and Warlord.'
	},
	{
		id: 'marksman8',
		title: '8x marksman scopes',
		sights: ['GW Löwe-55', 'Luca Stormwatch'],
		zoom: 8,
		kick: 0.5,
		recoil: 0.6,
		note: 'Marksman rifles only. They have the biggest kick cut in the game (×0.5), so 8x still looks steadier than a 7x rifle scope. Stormwatch is thermal.'
	},
	{
		id: 'rifle7',
		title: '7x rifle scopes',
		sights: ['Schlager 7x', 'Schlager Dogfight GI', 'RVX9 Thermo'],
		zoom: 7,
		kick: 0.6,
		recoil: 0.7,
		note: 'Assault rifles, the Type 73, APOC-338 and marksman rifles. Dogfight GI has a range finder, RVX9 Thermo is thermal.'
	},
	{
		id: 'marksman9',
		title: '9x marksman scopes',
		sights: ['Corvus Avis-0', 'Corio D51 Scope', 'SZ CNT-R6 Optic', 'VLK 1940-R 9x', 'SZ MN-Scout 9x'],
		zoom: 9,
		kick: 0.5,
		recoil: 0.6,
		note: 'Marksman rifles. Corvus Avis-0 aims in about twice as fast as the others. CNT-R6 is Oris 8.6 only, the two 9x ones Mosin-Nagant only.'
	},
	{
		id: 'indigo',
		title: 'Schlager Indigo-RF',
		sights: ['Schlager Indigo-RF'],
		zoom: 10,
		kick: 0.5,
		recoil: 0.6,
		note: 'Marksman rifles, 10x.'
	},
	{
		id: 'rize',
		title: 'VLK Rize-40',
		sights: ['VLK Rize-40'],
		zoom: 8,
		kick: 0.7,
		recoil: 0.9,
		note: 'The shakiest rifle scope: 8x, but only kick ×0.7 and recoil ×0.9.'
	},
	{
		id: 'dr2',
		title: 'Expedite 308 DR2',
		sights: ['Expedite 308 DR2'],
		zoom: 9,
		kick: 0.7,
		recoil: 0.9,
		note: 'Marksman rifles: 9x with only kick ×0.7, the most jump of any sight here.'
	}
];

/** zoom × kick, rounded to one decimal (floating point would give 2.8000000000000003). */
export const screenKickOf = (zoom: number, kick: number): number => Math.round(zoom * kick * 10) / 10;

export const zoomOn = (s: Sight, gun: string): number => s.zoomOn?.[gun] ?? s.zoom;

/** How much the picture jumps with this sight on this gun, against a red dot = 1 (our estimate). */
export const screenKick = (s: Sight, gun: string): number => screenKickOf(zoomOn(s, gun), s.kick);

export const sightsFor = (gun: string): Sight[] => SIGHTS.filter((s) => s.guns.includes(gun));

/** The optic each meta build of the gun uses (loadouts.ts); null = the build has no optic. */
export function metaOptics(gun: string): Partial<Record<LoadoutMode, string | null>> {
	const out: Partial<Record<LoadoutMode, string | null>> = {};
	const builds = LOADOUTS[gun] ?? {};
	for (const mode of ['mp', 'wz'] as const) {
		const b = builds[mode];
		if (b) out[mode] = b.attachments.find((a) => a.slot === 'Optic')?.name ?? null;
	}
	return out;
}

export interface SightPicks {
	/** The steadiest 1x sight (a mini reflex where the gun has one; the one its meta build uses if so). */
	close?: Sight;
	/** The magnified sight (4x or more) with the least on-screen kick; ties go to more recoil cut. */
	range?: Sight;
}

export function picksFor(gun: string): SightPicks {
	if (SNIPERS.includes(gun)) return {};
	const fits = sightsFor(gun);
	const used = Object.values(metaOptics(gun));
	const minis = fits.filter((s) => s.type === 'Mini Reflex');
	const close = minis.find((s) => used.includes(s.name)) ?? minis[0] ?? fits.find((s) => s.type === 'Reflex');
	let range: Sight | undefined;
	for (const s of fits) {
		if (zoomOn(s, gun) < 4) continue;
		if (!range) {
			range = s;
			continue;
		}
		const a = screenKick(s, gun);
		const b = screenKick(range, gun);
		if (a < b || (a === b && s.recoil < range.recoil)) range = s;
	}
	return { close, range };
}
