/**
 * The news buddy grows with your grind (2026-11-11, the user's pick from a brainstorm: "starts as a
 * little sprout, grows bigger, thicker and glows more the more you grind; a monster at Divergence, an
 * aura at Mastery"). Pure, tested in scripts/road.test.js. WeedCreature draws each stage.
 *
 * 0 Seedling → 1 Sprout → 2 Bush (the look he had before) → 3 Big bush: by the share of all camo
 * steps ticked (Gold / Platinum / Harmonic Break on every weapon), worked out from the data so new
 * weapons move the marks. 4 Monster once Divergence is unlocked, 5 Legend once any Mastery camo is
 * complete (any mode).
 */

export const GROWTH_STAGES = ['seedling', 'sprout', 'bush', 'bigBush', 'monster', 'legend'] as const;
export type GrowthName = (typeof GROWTH_STAGES)[number];
export type GrowthStage = 0 | 1 | 2 | 3 | 4 | 5;

/** Where each step-based stage starts, as a share of all camo steps. */
const SHARES = [0, 0.05, 0.25, 0.5] as const;

export interface Growth {
	stage: GrowthStage;
	name: GrowthName;
	/** What the next stage needs, or null at the top. */
	next: { kind: 'steps'; left: number } | { kind: 'divergence'; left: number } | { kind: 'mastery' } | null;
}

/** The camo-step marks for stages 1–3 (e.g. 6, 28, 56 of 111). */
export function stepMarks(stepsTotal: number): number[] {
	return SHARES.slice(1).map((s) => Math.ceil(s * stepsTotal));
}

export function growth(
	stepsDone: number,
	stepsTotal: number,
	divergenceLeft: number,
	masteryComplete: number
): Growth {
	if (masteryComplete > 0) return { stage: 5, name: 'legend', next: null };
	if (divergenceLeft <= 0) return { stage: 4, name: 'monster', next: { kind: 'mastery' } };
	const marks = stepMarks(stepsTotal);
	let stage = 0;
	while (stage < marks.length && stepsDone >= marks[stage]) stage++;
	const next: Growth['next'] =
		stage < marks.length ? { kind: 'steps', left: marks[stage] - stepsDone } : { kind: 'divergence', left: divergenceLeft };
	return { stage: stage as GrowthStage, name: GROWTH_STAGES[stage], next };
}
