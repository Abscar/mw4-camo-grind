/**
 * THE source of truth for weapon classes, weapons, unlock info and camo challenges.
 * Call of Duty: Modern Warfare 4 — Multiplayer only. Last checked 2026-11-06.
 *
 * Sources
 * - Challenges: codmunity.gg MW4 camo guide, cross-checked 2026-11-06 against Destructoid,
 *   games.gg, GamerFuzion, CarrySquad, warzoneloadout.games and mw4camos.com
 *   (details in mw4-kunskap/camos-och-system.md). Special camos (before Gold): see `sp` below.
 * - Weapon list & unlock levels: Gfinity launch list (2026-10-20), Dexerto weapon wiki,
 *   Destructoid (Season 1, 2026-10-28).
 *
 * `verified: false` means only one source says so, or the sources disagree.
 * The UI marks those entries instead of presenting them as fact.
 *
 * Rules for editing:
 * - `id` is what saved progress is keyed by. Never change an existing id.
 * - `slot` is the weapon's permanent position in "progress links". Never change or reuse one;
 *   a new weapon gets the next unused number (see NEXT_FREE_SLOT at the bottom).
 */

import type { LadderCamoId } from './camos.ts';

export interface Fact {
	text: string;
	verified: boolean;
	/** Why it is (un)verified, or where it comes from. Shown as a tooltip. */
	note?: string;
}

export type Unlock =
	| { kind: 'level'; level: number; verified: boolean }
	| { kind: 'battlePass'; tier: number; verified: boolean }
	| { kind: 'event'; verified: boolean; note?: string };

export type Season = 'launch' | 'season1';

/**
 * One of the weapon's 3 Special camos: the challenges you do before Gold (Gold also needs the
 * 8 Military camos, which come from weapon levels alone). Each opens at a set weapon level.
 */
export interface SpecialCamo {
	name: string;
	/** The Multiplayer challenge. */
	challenge: Fact;
}

export interface Weapon {
	id: string;
	slot: number;
	name: string;
	season: Season;
	unlock: Unlock;
	/** The 3 Special camos before Gold. Empty while the weapon isn't out and nobody has listed them. */
	specials: SpecialCamo[];
}

export interface WeaponClass {
	id: string;
	name: string;
	/** Short label for filter chips. */
	short: string;
	challenges: Record<LadderCamoId, Fact>;
	weapons: Weapon[];
}

/** Shown in the page header. */
export const GAME_MODE = 'Multiplayer';
export const CURRENT_SEASON = 'Season 01';

const CROSS_CHECKED = 'codmunity.gg, confirmed by 4–6 other guides (2026-11-06)';
const LEVELS_SOURCE = 'Gfinity launch list only, not cross-checked';

const ok = (text: string): Fact => ({ text, verified: true, note: CROSS_CHECKED });

/** Gold is the same challenge for every class. */
const GOLD: Fact = ok('15 Kills in a Single Match');

const lv = (level: number): Unlock => ({ kind: 'level', level, verified: false });
const bp = (tier: number): Unlock => ({ kind: 'battlePass', tier, verified: true });
const event = (): Unlock => ({
	kind: 'event',
	verified: false,
	note: 'Season 1 event reward. Which event, and when, has not been announced yet.'
});

/**
 * Special camos (the 3 challenges before Gold), Multiplayer text. Read 2026-11-08 from codmunity.gg's
 * MW4 camo tracker and Destructoid's camo guide: they agree on every launch weapon except the two
 * marked below. Listed in Destructoid's order, which matches Activision's progression blog for the
 * Han 86 (Smoke Lv 25, Stormwave Lv 46, Red Lv 72) and SANG 9mm (Autumn 13, Snakeskin 25, Space
 * Time 38). mw4camos.com and Sportskeeda were checked too but mix up several (e.g. Snakeskin and
 * Space Time swapped), so they only count as tie-breakers.
 */
const SPECIALS_CHECKED = 'codmunity.gg and Destructoid agree (checked 2026-11-08)';
const S1_SPECIALS = 'Only codmunity.gg lists this one so far (2026-11-08)';

const sp = (name: string, text: string, fact?: Partial<Fact>): SpecialCamo => ({
	name,
	challenge: { text, verified: true, note: SPECIALS_CHECKED, ...fact }
});
const sp1 = (name: string, text: string): SpecialCamo => sp(name, text, { verified: false, note: S1_SPECIALS });

const launch = (slot: number, id: string, name: string, level: number, specials: SpecialCamo[]): Weapon => ({
	id,
	slot,
	name,
	season: 'launch',
	unlock: lv(level),
	specials
});
const s1 = (slot: number, id: string, name: string, unlock: Unlock, specials: SpecialCamo[] = []): Weapon => ({
	id,
	slot,
	name,
	season: 'season1',
	unlock,
	specials
});

export const CLASSES: WeaponClass[] = [
	{
		id: 'assault-rifles',
		name: 'Assault Rifles',
		short: 'AR',
		challenges: { gold: GOLD, platinum: ok('50 Headshots'), harmonicBreak: ok('25 Double Kills') },
		weapons: [
			launch(0, 'han-86', 'Han 86', 4, [
				sp('Smoke', '20 Mounted Kills'),
				sp('Stormwave', '50 Kills with a Silencer'),
				sp('Red', '3 Kills without Dying ×15')
			]),
			launch(1, 'm4', 'M4', 14, [
				sp('Myriad', '20 Point Blank Kills'),
				sp('Night Ops', '20 Mounted Kills'),
				sp('Green', '25 Kills from Behind')
			]),
			launch(2, 'hyeon-burst', 'Hyeon Burst', 21, [
				sp('Ponderosa', '2 Kills without Reloading ×10'),
				sp('Red Rain', '20 Longshot Kills'),
				sp('Kitty Kaos', '100 Kills with a Silencer')
			]),
			launch(3, 'patriot-xmr', 'Patriot XMR', 27, [
				sp('Dune Sea', '20 Hipfire Kills'),
				sp('Scorch', '50 Kills with a Silencer'),
				sp('Disperse', '30 Longshot Kills')
			]),
			launch(4, 'kastov-762', 'Kastov 762', 34, [
				sp('SAMNIM', '3 Kills without Dying ×10', {
					verified: false,
					note: 'Sources disagree: codmunity.gg says 4 kills ×10, Destructoid "3 kills without dying" with no count, mw4camos.com and Sportskeeda 3 kills ×10.'
				}),
				sp('Raster AUX', '20 Longshot Kills'),
				sp('Yellow', '30 Hipfire Kills')
			]),
			launch(5, 'oden', 'Oden', 39, [
				sp('Dark Moss', '25 Kills with the Miri 40MM Grenade Launcher'),
				sp('Shale', '2 Kills without Reloading ×10'),
				sp('Hot Rod', '100 Kills while ADS')
			]),
			launch(6, 'axion', 'Axion', 52, [
				sp('Splinter Rock', '20 Longshot Kills'),
				sp('Sunset Tropic', '25 Kills with the Miri 40MM Grenade Launcher'),
				sp('Cyan', '2 Kills without Reloading ×25')
			]),
			launch(7, 'cronen-squall', 'Cronen Squall', 55, [
				sp('Oni', '20 Point Blank Kills'),
				sp('Urban Smoke', '20 Mounted Kills'),
				sp('Optical Reverb', '3 Kills without Dying ×15')
			]),
			s1(8, 'cronen-osprey', 'Cronen Osprey', bp(16), [
				sp1('In the Weeds', '20 Hipfire Kills'),
				sp1('Dark Ichor', '50 Kills while ADS'),
				sp1('Chained', '2 Kills without Reloading ×25')
			])
		]
	},
	{
		id: 'smgs',
		name: 'SMGs',
		short: 'SMG',
		challenges: { gold: GOLD, platinum: ok('25 Kills from Behind'), harmonicBreak: ok('50 Hipfire Kills') },
		weapons: [
			launch(9, 'iso-nightshade', 'ISO Nightshade', 4, [
				sp('Asphalt', '50 Kills while ADS'),
				sp('Black Topo', '10 Double Kills'),
				sp('Brown', '3 Kills without Dying ×15')
			]),
			launch(10, 'vel-46', 'VEL 46', 5, [
				sp('Jungle Shadow', '50 Kills while ADS'),
				sp('Ghast', '20 Prone Kills'),
				sp('Gunmetal', '20 Headshots')
			]),
			launch(11, 'wz-55-striga', 'WZ.55 Striga', 18, [
				sp('Stellation', '50 Kills with a Silencer'),
				sp('Rattlesnake', '20 Kills while Jumping'),
				sp('Dark Tan', '40 Point Blank Kills')
			]),
			launch(12, 'ppsh-41', 'PPSh-41', 30, [
				sp('Blackwell', '10 Double Kills'),
				sp('Iron', '20 Longshot Kills'),
				sp('Currents', '100 Kills while ADS')
			]),
			launch(13, 'x-58-nyx', 'X-58 Nyx', 46, [
				sp('Sniper Veil', '20 Kills while Moving'),
				sp('Carbonated', '20 Longshot Kills'),
				sp('Lime', '40 Headshot Kills')
			]),
			s1(14, 'csg-35', 'CSG-35', bp(36), [
				sp1('Polyhedron', '3 Kills without Dying ×20'),
				sp1('Rind', '50 Kills with a Silencer'),
				sp1('Black Grip', '50 Kills while Moving')
			])
		]
	},
	{
		id: 'shotguns',
		name: 'Shotguns',
		short: 'Shotgun',
		challenges: {
			gold: GOLD,
			platinum: ok('50 Hipfire Kills'),
			harmonicBreak: ok('2 Kills without Reloading ×25')
		},
		weapons: [
			launch(15, 'rezi-12', 'Rezi 12', 4, [
				sp('Struck Oil', '20 Point Blank Kills'),
				sp('Brushstroke', '10 Longshot Kills'),
				sp('White Pine', '40 Kills while Jumping')
			]),
			launch(16, 'warlord', 'Warlord', 32, [
				sp('Redshift', '20 Kills while Moving'),
				sp('Corrupted Clay', '10 Double Kills'),
				sp('Magma Ire', '50 Prone Kills')
			]),
			s1(17, 'jak-12', 'JAK-12', event())
		]
	},
	{
		id: 'lmgs',
		name: 'LMGs',
		short: 'LMG',
		challenges: {
			gold: GOLD,
			platinum: ok('3 Kills without Dying ×15'),
			harmonicBreak: ok('2 Kills without Releasing Trigger ×25')
		},
		weapons: [
			launch(18, 'finn-lmg', 'FiNN LMG', 4, [
				sp('Desert Tactics', '20 Point Blank Kills'),
				sp('Thunderhead', '30 Longshot Kills'),
				sp('Green Tiger', '2 Kills without Reloading ×10')
			]),
			launch(19, 'type-73', 'Type 73', 9, [
				sp('Outcrop', '10 Double Kills'),
				sp('Foxtrail', '40 Headshots'),
				sp('Ash Pine', '20 Mounted Kills')
			]),
			launch(20, 'apoc-338', 'APOC-338', 44, [
				sp('Phantom Flux', '20 Hipfire Kills'),
				sp('Mineral', '20 Longshot Kills'),
				sp('Tiger Swipe', '100 Prone Kills')
			])
		]
	},
	{
		id: 'marksman-rifles',
		name: 'Marksman Rifles',
		short: 'Marksman',
		challenges: { gold: GOLD, platinum: ok('75 Prone Kills'), harmonicBreak: ok('75 One-Shot Kills') },
		weapons: [
			launch(21, 'mar-9', 'MAR-9', 4, [
				sp('Mangrove', '20 Mounted Kills'),
				sp('Fungal Grid', '25 Kills while Crouched'),
				sp('White', '30 Longshot Kills')
			]),
			launch(22, 'oris-8-6', 'Oris 8.6', 11, [
				sp('Hibiscus', '10 Quickscope Kills'),
				sp('Fire Topo', '20 Double Kills'),
				sp('Deep Space', '3 Kills without Dying ×15')
			]),
			launch(23, 'mosin-nagant', 'Mosin-Nagant', 36, [
				sp('Ice Sheer', '25 Headshots'),
				sp('Fractal Snow', '2 Kills without Reloading ×10'),
				sp('Sticker Shock', '100 Kills while Focused')
			])
		]
	},
	{
		id: 'sniper-rifles',
		name: 'Sniper Rifles',
		short: 'Sniper',
		challenges: { gold: GOLD, platinum: ok('75 Prone Kills'), harmonicBreak: ok('75 One-Shot Kills') },
		weapons: [
			launch(24, 'kg-7-vulcan', 'KG-7 Vulcan', 4, [
				sp('Treeline', '10 Hipfire Kills'),
				sp('Spidersilk', '20 Headshot Kills'),
				sp('Tension', '2 Kills without Taking Damage ×20')
			]),
			launch(25, 'astaroth-57', 'Astaroth .57', 25, [
				sp('Dry Brush', '3 Kills without Dying ×10'),
				sp('Backcountry', '20 Mounted Kills'),
				sp('Dread Plague', '2 Kills within 5 Seconds ×20')
			]),
			launch(26, 'signal-50', 'Signal 50', 50, [
				sp('Anaconda', '2 Kills within 5 Seconds ×10'),
				sp('Ripplewave', '20 Quickscope Kills'),
				sp('Sunburn', '40 Longshot Kills')
			])
		]
	},
	{
		id: 'pistols',
		name: 'Pistols',
		short: 'Pistol',
		challenges: { gold: GOLD, platinum: ok('20 Kills from Behind'), harmonicBreak: ok('40 Hipfire Kills') },
		weapons: [
			launch(27, 'sang-9mm', 'SANG 9mm', 4, [
				sp('Autumn', '25 Kills while ADS'),
				sp('Snakeskin', '3 Kills without Dying ×5', {
					note: 'codmunity.gg and Activision’s progression blog (via GamerFuzion) say “without dying”; Destructoid says “without taking damage”.'
				}),
				sp('Space Time', '50 Akimbo Kills')
			]),
			launch(28, 'krait-p68', 'Krait P68', 7, [
				sp('Off Grid', '15 Kills while Ledge Hanging'),
				sp('Urban Flamingo', '15 Point Blank Kills'),
				sp('Smokescreen', '50 Kills with a Silencer')
			]),
			launch(29, '50-gs', '.50 GS', 41, [
				sp('Frosted', '20 Headshot Kills'),
				sp('Splatter Ops', '7 Double Kills'),
				sp('Red Tiger', '30 Point Blank Kills')
			]),
			launch(30, 'mojave-357', 'Mojave .357', 48, [
				sp('Miami', '15 One-Shot Kills'),
				sp('Wallpaper', '2 Kills without Reloading ×10'),
				sp('Garland', '30 Point Blank Kills')
			])
		]
	},
	{
		id: 'launchers',
		name: 'Launchers',
		short: 'Launcher',
		challenges: {
			gold: GOLD,
			platinum: ok('2 Kills without Taking Damage ×15'),
			harmonicBreak: ok('10 Kills in a Match ×7')
		},
		weapons: [
			launch(31, 'pila', 'PILA', 4, [
				sp('Frontier', '10 Direct Shot Kills'),
				sp('Sandwash', '5 Double Kills'),
				sp('Digital Fall', 'Destroy 30 Killstreaks or Vehicles')
			]),
			launch(32, 'rpg-8', 'RPG-8', 23, [
				sp('Digi Bark', '10 Prone Kills'),
				sp('Stone Bits', '10 Longshot Kills'),
				sp('Bubblegum Ops', 'Destroy 30 Killstreaks or Vehicles')
			]),
			launch(33, 'jokr', 'JOKR', 43, [
				sp('Thicket', '5 Double Kills'),
				sp('Tectonic', '10 Longshot Kills'),
				sp('Blue Tiger', 'Destroy 30 Killstreaks or Vehicles')
			]),
			launch(34, 'pm-40-anvil', 'PM-40 Anvil', 54, [
				sp('Night Snow', '25 Direct Shot Kills'),
				sp('Recursive', '2 Kills without Reloading ×5'),
				sp('Urban Standard', '40 Kills while Moving')
			])
		]
	},
	{
		id: 'melee',
		name: 'Melee',
		short: 'Melee',
		challenges: {
			gold: GOLD,
			platinum: {
				text: '3 Kills without Dying ×15',
				verified: true,
				note: 'codmunity, games.gg and warzoneloadout agree; Destructoid says "without taking damage".'
			},
			harmonicBreak: ok('25 Kills from Behind')
		},
		weapons: [
			launch(35, 'fss-carbon-edge-1095', 'FSS Carbon Edge 1095', 4, [
				sp('Raster Lite', '25 Kills while Jumping'),
				sp('Stockpile', '25 Kills with the Heavy Melee Finisher'),
				sp('Deathbed', '2 Kills within 5 Seconds ×25')
			]),
			s1(36, 'zlr-talonhawk', 'ZLR Talonhawk', event())
		]
	}
];

/** The next unused `slot` for a new weapon. Bump it when you add one. */
export const NEXT_FREE_SLOT = 37;

/** Every weapon, in display order, with its class. */
export const WEAPONS: (Weapon & { classId: string })[] = CLASSES.flatMap((c) =>
	c.weapons.map((w) => ({ ...w, classId: c.id }))
);

export const WEAPON_BY_ID: ReadonlyMap<string, Weapon & { classId: string }> = new Map(
	WEAPONS.map((w) => [w.id, w])
);

/** Note shown next to unverified unlock levels. */
export const UNLOCK_LEVEL_NOTE = LEVELS_SOURCE;
