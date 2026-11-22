/**
 * Quickscope Duel (BurgiArcade, 2026-11-22): the pure rules. Five rounds through a sniper scope: hold…,
 * an enemy sniper pops up after a seeded wait, fire as fast as you can. Some rounds first show a friendly
 * (a burger mascot, a pigeon, a squad buddy with a white flag): shooting it is a foul, and so is firing
 * before the enemy shows. No shot within 1.5 s of the enemy = too slow.
 *
 * The whole schedule (waits, feints, where they pop up) comes from the seed alone and is worked out at the
 * start, so both players in a duel get exactly the same rounds whatever either of them does.
 * No browser APIs, so Node tests it (scripts/arcade-quickscope.test.js).
 */
import { pick, rint, rng } from '#lib/arcade/rng.ts';

export const ROUNDS = 5;
/** No shot this long after the enemy appears = too slow. */
export const TOO_SLOW_MS = 1500;
/** The wait from "HOLD…" to the enemy (ms). */
export const MIN_WAIT = 1200;
export const MAX_WAIT = 4000;
/** Rounds with a friendly first wait at least this long, so the friendly fits before the enemy. */
export const FEINT_MIN_WAIT = 2400;
/** Places in the scope's town where someone can pop up (QuickscopeDuel.svelte draws them). */
export const SPOT_COUNT = 6;
/** Enemy looks (ghillie, desert ghillie, black balaclava). */
export const LOOKS = 3;

export type Friendly = 'burger' | 'pigeon' | 'buddy';
export const FRIENDLIES: readonly Friendly[] = ['burger', 'pigeon', 'buddy'];

export interface Feint {
	/** shows at this time after HOLD starts, for `dur` ms */
	at: number;
	dur: number;
	kind: Friendly;
	spot: number;
}
export interface QsRound {
	/** the enemy appears this long after HOLD starts */
	wait: number;
	spot: number;
	look: number;
	feint: Feint | null;
}

/** The five rounds from the seed. Round 1 never has a friendly; at least one later round does, at most three. */
export function schedule(seed: number): QsRound[] {
	const r = rng(seed);
	const feinty = Array.from({ length: ROUNDS }, (_, i) => i > 0 && r() < 0.4);
	const forced = rint(r, 1, ROUNDS - 1);
	if (!feinty.some(Boolean)) feinty[forced] = true;
	while (feinty.filter(Boolean).length > 3) feinty[feinty.lastIndexOf(true)] = false;
	return feinty.map((hasFeint) => {
		const wait = hasFeint ? rint(r, FEINT_MIN_WAIT, MAX_WAIT) : rint(r, MIN_WAIT, MAX_WAIT);
		const spot = rint(r, 0, SPOT_COUNT - 1);
		const look = rint(r, 0, LOOKS - 1);
		if (!hasFeint) return { wait, spot, look, feint: null };
		const at = rint(r, 600, wait - 1300);
		const dur = rint(r, 600, 900);
		const kind = pick(r, FRIENDLIES);
		const others = Array.from({ length: SPOT_COUNT }, (_, i) => i).filter((i) => i !== spot);
		return { wait, spot, look, feint: { at, dur, kind, spot: pick(r, others) } };
	});
}

export type Verdict = 'early' | 'friendly' | 'hit' | 'slow';

/** What a shot `t` ms after HOLD started counts as (the enemy is up from `wait` to `wait + TOO_SLOW_MS`). */
export function judge(round: QsRound, t: number): Verdict {
	if (t >= round.wait) return t - round.wait <= TOO_SLOW_MS ? 'hit' : 'slow';
	const f = round.feint;
	if (f && t >= f.at && t <= f.at + f.dur) return 'friendly';
	return 'early';
}

/** A round's entry in `rounds`: reaction ms (> 0) for a hit, −1 for a foul, 0 for too slow. */
export const roundEntry = (verdict: Verdict, ms: number): number =>
	verdict === 'hit' ? Math.max(1, Math.round(ms)) : verdict === 'slow' ? 0 : -1;

/** Points for one round's entry: 1000 − ms for a hit (never below 0), nothing otherwise. */
export const roundPoints = (entry: number): number => (entry > 0 ? Math.max(0, 1000 - Math.round(entry)) : 0);

/** The run's score: the sum of the rounds' points. */
export const totalScore = (rounds: readonly number[]): number => rounds.reduce((sum, e) => sum + roundPoints(e), 0);
