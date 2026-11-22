/**
 * Killstreak Recall (BurgiArcade, 2026-11-22): the rules behind the memory game
 * (components/arcade/games/KillstreakRecall.svelte). Pure: the call-in sequence from the seed, how fast it's
 * played back each round, and the score. No DOM and no runes, so Node tests it (scripts/arcade-recall.test.js).
 *
 * Round 1 plays 3 call-ins; each round adds one more at the end (the same sequence grows) and plays a bit
 * faster. Four killstreaks to start; the Missile joins in round 8 and the Nuke in round 14 (each debuts as that
 * round's new step). Score = 100 × the longest sequence repeated + a speed bonus (0–10 per quick tap).
 */
import { rng } from '#lib/arcade/rng.ts';

/** The killstreaks in button order (keys 1–6). */
export const RECALL_STREAKS = ['uav', 'care', 'air', 'chopper', 'missile', 'nuke'] as const;
export type RecallStreak = (typeof RECALL_STREAKS)[number];

/** Round 1's sequence length. */
export const START_LENGTH = 3;
/** The round the 5th button (Missile) joins, and the 6th (Nuke). */
export const FIFTH_AT = 8;
export const SIXTH_AT = 14;
/** How many steps the game draws up front (round 238: nobody gets there). */
export const MAX_STEPS = 240;
/** Points per step of the longest sequence repeated. */
export const STEP_POINTS = 100;
/** No tap for this long (ms of game time) during your turn = signal lost. */
export const INPUT_TIMEOUT = 6000;

/** How many call-ins round `round` plays. */
export const lengthOf = (round: number): number => START_LENGTH + round - 1;
/** How many buttons are in play in round `round`. */
export const buttonsAt = (round: number): number => (round >= SIXTH_AT ? 6 : round >= FIFTH_AT ? 5 : 4);
/** The round in which step `i` (0-based) is first played. */
export const firstRound = (i: number): number => Math.max(1, i - START_LENGTH + 2);

/** The whole call-in sequence for a seed (button indexes 0–5). Never three of the same in a row. */
export function recallSequence(seed: number, steps = MAX_STEPS): number[] {
	const r = rng(seed >>> 0);
	const out: number[] = [];
	for (let i = 0; i < steps; i++) {
		const round = firstRound(i);
		const n = buttonsAt(round);
		const newest = i === lengthOf(round) - 1;
		let b: number;
		if (newest && round === FIFTH_AT) b = 4;
		else if (newest && round === SIXTH_AT) b = 5;
		else {
			do b = Math.floor(r() * n);
			while (i >= 2 && out[i - 1] === b && out[i - 2] === b);
		}
		out.push(b);
	}
	return out;
}

/** How long each call-in is lit and the gap after it (ms) in round `round`: a bit faster every round. */
export function playbackTiming(round: number): { on: number; gap: number } {
	const k = Math.max(0, round - 1);
	return { on: Math.max(260, 600 - 22 * k), gap: Math.max(80, 190 - 7 * k) };
}

/** The speed bonus for one correct tap, `ms` after the previous one (or after your turn began): 0–10. */
export const stepBonus = (ms: number): number => Math.max(0, Math.min(10, Math.floor((1000 - ms) / 50)));

/** The score: 100 per step of the longest sequence repeated + the speed bonus of the rounds completed. */
export const recallScore = (longest: number, bonus: number): number => Math.max(0, Math.round(STEP_POINTS * longest + bonus));
