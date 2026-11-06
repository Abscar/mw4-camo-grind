/**
 * The camo ladder (per weapon), Divergence (account-wide) and the Mastery camos (account-wide).
 * Multiplayer only. Last checked 2026-11-06 — see weapons.ts for sources.
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

export interface MasteryCamo {
	/** Stable id used in saved progress. Never change. Add new ones at the end (links use the order). */
	id: string;
	name: string;
	challenge: Fact;
	/** How many times the challenge must be completed. */
	target: number;
}

const MASTERY_SOURCE = 'codmunity, games.gg, GamerFuzion and CarrySquad agree (2026-11-06)';

/** Mastery camos, in the order they unlock. Each needs the previous one (the first needs Divergence). */
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

export type MasteryStatus = 'locked' | 'active' | 'complete';
