/**
 * THE source of truth for weapon classes, weapons, unlock info and camo challenges.
 * Call of Duty: Modern Warfare 4 — Multiplayer only. Last checked 2026-11-06.
 *
 * Sources
 * - Challenges: codmunity.gg MW4 camo guide, cross-checked 2026-11-06 against Destructoid,
 *   games.gg, GamerFuzion, CarrySquad, warzoneloadout.games and mw4camos.com
 *   (details in mw4-kunskap/camos-och-system.md).
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

export interface Weapon {
	id: string;
	slot: number;
	name: string;
	season: Season;
	unlock: Unlock;
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

const launch = (slot: number, id: string, name: string, level: number): Weapon => ({
	id,
	slot,
	name,
	season: 'launch',
	unlock: lv(level)
});
const s1 = (slot: number, id: string, name: string, unlock: Unlock): Weapon => ({
	id,
	slot,
	name,
	season: 'season1',
	unlock
});

export const CLASSES: WeaponClass[] = [
	{
		id: 'assault-rifles',
		name: 'Assault Rifles',
		short: 'AR',
		challenges: { gold: GOLD, platinum: ok('50 Headshots'), harmonicBreak: ok('25 Double Kills') },
		weapons: [
			launch(0, 'han-86', 'Han 86', 4),
			launch(1, 'm4', 'M4', 14),
			launch(2, 'hyeon-burst', 'Hyeon Burst', 21),
			launch(3, 'patriot-xmr', 'Patriot XMR', 27),
			launch(4, 'kastov-762', 'Kastov 762', 34),
			launch(5, 'oden', 'Oden', 39),
			launch(6, 'axion', 'Axion', 52),
			launch(7, 'cronen-squall', 'Cronen Squall', 55),
			s1(8, 'cronen-osprey', 'Cronen Osprey', bp(16))
		]
	},
	{
		id: 'smgs',
		name: 'SMGs',
		short: 'SMG',
		challenges: { gold: GOLD, platinum: ok('25 Kills from Behind'), harmonicBreak: ok('50 Hipfire Kills') },
		weapons: [
			launch(9, 'iso-nightshade', 'ISO Nightshade', 4),
			launch(10, 'vel-46', 'VEL 46', 5),
			launch(11, 'wz-55-striga', 'WZ.55 Striga', 18),
			launch(12, 'ppsh-41', 'PPSh-41', 30),
			launch(13, 'x-58-nyx', 'X-58 Nyx', 46),
			s1(14, 'csg-35', 'CSG-35', bp(36))
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
			launch(15, 'rezi-12', 'Rezi 12', 4),
			launch(16, 'warlord', 'Warlord', 32),
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
			launch(18, 'finn-lmg', 'FiNN LMG', 4),
			launch(19, 'type-73', 'Type 73', 9),
			launch(20, 'apoc-338', 'APOC-338', 44)
		]
	},
	{
		id: 'marksman-rifles',
		name: 'Marksman Rifles',
		short: 'Marksman',
		challenges: { gold: GOLD, platinum: ok('75 Prone Kills'), harmonicBreak: ok('75 One-Shot Kills') },
		weapons: [
			launch(21, 'mar-9', 'MAR-9', 4),
			launch(22, 'oris-8-6', 'Oris 8.6', 11),
			launch(23, 'mosin-nagant', 'Mosin-Nagant', 36)
		]
	},
	{
		id: 'sniper-rifles',
		name: 'Sniper Rifles',
		short: 'Sniper',
		challenges: { gold: GOLD, platinum: ok('75 Prone Kills'), harmonicBreak: ok('75 One-Shot Kills') },
		weapons: [
			launch(24, 'kg-7-vulcan', 'KG-7 Vulcan', 4),
			launch(25, 'astaroth-57', 'Astaroth .57', 25),
			launch(26, 'signal-50', 'Signal 50', 50)
		]
	},
	{
		id: 'pistols',
		name: 'Pistols',
		short: 'Pistol',
		challenges: { gold: GOLD, platinum: ok('20 Kills from Behind'), harmonicBreak: ok('40 Hipfire Kills') },
		weapons: [
			launch(27, 'sang-9mm', 'SANG 9mm', 4),
			launch(28, 'krait-p68', 'Krait P68', 7),
			launch(29, '50-gs', '.50 GS', 41),
			launch(30, 'mojave-357', 'Mojave .357', 48)
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
			launch(31, 'pila', 'PILA', 4),
			launch(32, 'rpg-8', 'RPG-8', 23),
			launch(33, 'jokr', 'JOKR', 43),
			launch(34, 'pm-40-anvil', 'PM-40 Anvil', 54)
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
			launch(35, 'fss-carbon-edge-1095', 'FSS Carbon Edge 1095', 4),
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
