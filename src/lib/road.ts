/**
 * (Its "Road to Divergence" box was removed from the page 2026-11-11 at the user's ask; the secret
 * terminal's `next` command still uses this.)
 * "Road to Divergence" (2026-11-11, the user's pick from a brainstorm): which weapons are closest to
 * Harmonic Break, and how many more Harmonic Breaks Divergence needs. Worked out only from what is
 * saved (ticks, before-Gold ticks, counters), never a guess at which grind is quickest. Pure, tested
 * in scripts/road.test.js.
 *
 * A weapon's road has 6 steps: its 3 challenges before Gold, then Gold, Platinum and Harmonic Break
 * (steps.ts). Closest first = most steps done; a tie goes to the counter that is furthest along by its
 * own target (filters.ts `bestCounter`), then the catalogue order. Only weapons that are out and count
 * toward Divergence (SEASON_1_COUNTS_TOWARD_DIVERGENCE) are on it.
 */

import { DIVERGENCE_REQUIRED, MAX_LEVEL, SEASON_1_COUNTS_TOWARD_DIVERGENCE } from './data/camos.ts';
import { WEAPONS, type Weapon } from './data/weapons.ts';
import { bestCounter, type GrindState } from './filters.ts';
import { activeSteps, isReleased, type StepInfo } from './steps.ts';

export interface RoadRow {
	weaponId: string;
	/** Steps done (before-Gold challenges + ladder camos) out of `total`. */
	done: number;
	total: number;
	/** The steps you can work on now (before Gold they run side by side). */
	next: StepInfo[];
	/** The counter of a step you're on that is furthest along, or null. */
	counter: { step: StepInfo; count: number } | null;
	/** A Season 1 weapon (whether it counts toward Divergence isn't confirmed). */
	season1: boolean;
}

export interface Road {
	/** Harmonic Breaks that count toward Divergence. */
	have: number;
	needed: number;
	/** How many more Divergence needs (0 once unlocked). */
	toGo: number;
	/** Every weapon still without Harmonic Break, closest first. */
	rows: RoadRow[];
}

/** True when this weapon's Harmonic Break counts toward Divergence. */
export function countsTowardDivergence(w: Weapon): boolean {
	return SEASON_1_COUNTS_TOWARD_DIVERGENCE || w.season === 'launch';
}

export function roadToDivergence(s: GrindState): Road {
	const level = (id: string) => Math.max(0, Math.min(MAX_LEVEL, s.weapons[id] ?? 0));
	const eligible = WEAPONS.filter(countsTowardDivergence);
	const have = eligible.filter((w) => level(w.id) >= MAX_LEVEL).length;
	const order = new Map(WEAPONS.map((w, i) => [w.id, i]));

	const rows = eligible
		.filter((w) => isReleased(w) && level(w.id) < MAX_LEVEL)
		.map((w): RoadRow => {
			const lv = level(w.id);
			const mask = s.specials[w.id] ?? 0;
			const specialsDone = lv >= 1 ? w.specials.length : w.specials.filter((_, i) => ((mask >> i) & 1) === 1).length;
			return {
				weaponId: w.id,
				done: specialsDone + lv,
				total: w.specials.length + MAX_LEVEL,
				next: activeSteps(w.id, lv, mask),
				counter: bestCounter(s, w),
				season1: w.season !== 'launch'
			};
		})
		.sort((a, b) => {
			if (b.done !== a.done) return b.done - a.done;
			const share = (r: RoadRow) => (r.counter ? r.counter.count / r.counter.step.target : 0);
			if (share(b) !== share(a)) return share(b) - share(a);
			return (order.get(a.weaponId) ?? 0) - (order.get(b.weaponId) ?? 0);
		});

	return { have, needed: DIVERGENCE_REQUIRED, toGo: Math.max(0, DIVERGENCE_REQUIRED - have), rows };
}
