/**
 * The camo ladder (per weapon), Divergence (account-wide) and the Mastery camos (account-wide).
 * The ladder is Multiplayer's. Mastery has a track per mode (Multiplayer, Warzone, DMZ; the
 * Warzone and DMZ ones were added 2026-11-10 at the user's ask). Last checked 2026-11-10 — see
 * weapons.ts for sources.
 */

import type { Fact } from './weapons.ts';

/**
 * Per-weapon ladder, in unlock order. A weapon's progress is stored as a level:
 * 0 = nothing, 1 = Gold, 2 = Gold + Platinum, 3 = all three.
 * Ticking a higher camo fills in the lower ones; unticking a lower one clears the higher ones.
 */
export const LADDER = [
	{ id: 'gold', name: 'Gold', short: 'G' },
	{ id: 'platinum', name: 'Platinum', short: 'P' },
	{ id: 'harmonicBreak', name: 'Harmonic Break', short: 'HB' }
] as const;

export type LadderCamoId = (typeof LADDER)[number]['id'];
export type LadderCamo = (typeof LADDER)[number];
/** What a weapon's mini picture can wear (WeaponIcon): a ladder camo, or Divergence. */
export type IconCamo = LadderCamoId | 'divergence';

/** Highest per-weapon level (= every ladder camo done). */
export const MAX_LEVEL = LADDER.length;

/** Divergence is awarded automatically after this many Harmonic Break camos, account-wide. */
export const DIVERGENCE_REQUIRED = 33;

/**
 * OPEN QUESTION (2026-11-06): do Season 1 weapons count toward the 33 Harmonic Breaks?
 * No source says so explicitly. The requirement is worded as a count ("Complete 33 Harmonic
 * Break Camo Challenges"), not as "every launch weapon", so for now every weapon counts.
 * If it turns out only launch weapons count, set this to false — nothing else needs to change.
 */
export const SEASON_1_COUNTS_TOWARD_DIVERGENCE = true;

export const DIVERGENCE = {
	name: 'Divergence',
	how: `Awarded automatically after ${DIVERGENCE_REQUIRED} Harmonic Break camos`
} as const;

/**
 * Weapon Prestige camos per weapon (2026-11-15, the user's ask: "the prestige camos in the camo grind,
 * the last 3, the first one is pointless", ticked under the G / P / HB boxes). The four Pyroclast camos
 * are stages of one evolving camo; the first ("Pyroclast", just for entering Weapon Prestige 1) is left
 * out. Stored like the ladder, as a level per weapon: 0 = none, 1 = Terminus, 2 = + Scatter, 3 = all
 * three; ticking a later one fills the earlier ones (each needs more weapon levels than the one before).
 * Separate from the camo ladder: Gold / Platinum / Harmonic Break and Divergence don't need them, and
 * they don't need those. Challenges as in data/extraCamos.ts (Activision's Progression and Prestige
 * blog, 19 Oct; games.gg, timesaver, GameRant). Never reorder: links store the level by position.
 */
export const PRESTIGE = [
	{
		id: 'pyroclastTerminus',
		name: 'Pyroclast Terminus',
		short: 'TER',
		challenge: 'Reach max level again in Weapon Prestige 1',
		/** The matching entry in the Extra camos tab (data/extraCamos.ts). */
		extraId: 'prestige-pyroclast-terminus'
	},
	{
		id: 'pyroclastScatter',
		name: 'Pyroclast Scatter',
		short: 'SCA',
		challenge: 'Reach Weapon Prestige Master level 150',
		extraId: 'prestige-pyroclast-scatter'
	},
	{
		id: 'pyroclastCascade',
		name: 'Pyroclast Cascade',
		short: 'CAS',
		challenge: 'Reach Weapon Prestige Master level 250',
		extraId: 'prestige-pyroclast-cascade'
	}
] as const;

export type PrestigeCamo = (typeof PRESTIGE)[number];
export type PrestigeCamoId = PrestigeCamo['id'];
/** Highest Prestige level per weapon (= all three Prestige camos). */
export const PRESTIGE_MAX = PRESTIGE.length;
export const PRESTIGE_SOURCE = 'Activision (Progression and Prestige blog, 19 Oct); games.gg, timesaver, GameRant';

export interface MasteryCamo {
	/** Stable id used in saved progress. Never change. Add new ones at the end (links use the order). */
	id: string;
	name: string;
	challenge: Fact;
	/** How many times the challenge must be completed. */
	target: number;
}

const MASTERY_SOURCE = 'codmunity, games.gg, GamerFuzion and CarrySquad agree (2026-11-06)';
const WZ_SOURCE = 'codmunity, CarrySquad and mw4.gg agree (checked again on codmunity 2026-11-10)';
const DMZ_SOURCE = 'codmunity, codcentral, GamerFuzion and CarrySquad agree (checked again 2026-11-10)';

/**
 * Multiplayer Mastery camos, in the order they unlock. Each needs the previous one (the first
 * needs Divergence). Progress links store these counts by position, so never reorder them.
 */
export const MASTERY: MasteryCamo[] = [
	{
		id: 'mercurialDrift',
		name: 'Mercurial Drift',
		challenge: { text: '10 Kills in a Match', verified: true, note: MASTERY_SOURCE },
		target: 250
	},
	{
		id: 'polyatomicReforged',
		name: 'Polyatomic Reforged',
		challenge: { text: '3 Kills without Taking Damage', verified: true, note: MASTERY_SOURCE },
		target: 300
	},
	{
		id: 'orionReforged',
		name: 'Orion Reforged',
		challenge: { text: '5 Kills without Dying', verified: true, note: MASTERY_SOURCE },
		target: 500
	}
];

/**
 * Warzone Mastery camos (only Warzone matches count, any MW4 weapon). Like Multiplayer's, the
 * first needs Divergence (= 33 Harmonic Breaks) and each one needs the previous one.
 */
export const MASTERY_WZ: MasteryCamo[] = [
	{
		id: 'parallax',
		name: 'Parallax',
		challenge: { text: '5 Kills in a Match', verified: true, note: WZ_SOURCE },
		target: 300
	},
	{
		id: 'damascusReforged',
		name: 'Damascus Reforged',
		challenge: { text: '2 Kills without Plating', verified: true, note: WZ_SOURCE },
		target: 200
	},
	{
		id: 'empyros',
		name: 'Empyros',
		challenge: { text: 'Top 5 Placement with at least 6 Kills', verified: true, note: WZ_SOURCE },
		target: 75
	}
];

/** DMZ Mastery camos (AI enemies count in DMZ). Same rules: Divergence first, then in order. */
export const MASTERY_DMZ: MasteryCamo[] = [
	{
		id: 'chiral',
		name: 'Chiral',
		challenge: { text: 'Tier 3+ Enemy Kills', verified: true, note: DMZ_SOURCE },
		target: 2500
	},
	{
		id: 'rippleTide',
		name: 'Ripple Tide',
		challenge: { text: 'Exfil 2 LT Dog Tags in a Single Deployment', verified: true, note: DMZ_SOURCE },
		target: 50
	},
	{
		id: 'helio',
		name: 'Helio',
		challenge: { text: 'Kills with Legendary Weapons on a Max Level Operator', verified: true, note: DMZ_SOURCE },
		target: 25000
	}
];

export type MasteryMode = 'mp' | 'wz' | 'dmz';

/** The Mastery tracks, in the order the page shows them. Each runs on its own after Divergence. */
export const MASTERY_TRACKS: readonly { mode: MasteryMode; camos: MasteryCamo[] }[] = [
	{ mode: 'mp', camos: MASTERY },
	{ mode: 'wz', camos: MASTERY_WZ },
	{ mode: 'dmz', camos: MASTERY_DMZ }
];

/** Warzone + DMZ, in this order: the last part of a progress link ("M…") stores their counts by position. */
export const MASTERY_EXTRA: MasteryCamo[] = [...MASTERY_WZ, ...MASTERY_DMZ];

/** Every Mastery camo of every mode (saved progress is keyed by id). */
export const ALL_MASTERY: MasteryCamo[] = [...MASTERY, ...MASTERY_EXTRA];

export type MasteryStatus = 'locked' | 'active' | 'complete';
