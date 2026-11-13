/**
 * The weapon list's status filters and the "Continue grinding" suggestions, worked out only from
 * what is saved (ticks, before-Gold ticks, counters). Pure, tested in scripts/filters.test.js.
 *
 * Definitions (shown on the page too):
 * - Started:   at least one camo or before-Gold challenge done (or counted), not maxed yet.
 * - Near done: a challenge you're on is at least 75% done by its own counter, or all 3 challenges
 *              before Gold are done. Every challenge is measured against its own target only;
 *              "45/50 Headshots" and "12/15 streaks" are never compared with each other.
 * - Done:      every ladder camo (Gold, Platinum, Harmonic Break) ticked.
 * - Available: out now, with a next camo to earn (leaves out maxed guns and guns not released yet).
 */

import { DIVERGENCE_REQUIRED, MAX_LEVEL } from './data/camos.ts';
import { WEAPONS, type Weapon } from './data/weapons.ts';
import { activeSteps, countKey, isReleased, specialsComplete, type StepInfo } from './steps.ts';

export const STATUS_FILTERS = ['started', 'near', 'done', 'available'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export function isStatusFilter(x: unknown): x is StatusFilter {
	return STATUS_FILTERS.includes(x as StatusFilter);
}

/** "Near done" from 75% of a challenge's own target. */
export const NEAR_SHARE = 0.75;

export interface GrindState {
	weapons: Record<string, number>;
	specials: Record<string, number>;
	counts: Record<string, number>;
	focus: readonly string[];
}

const levelOf = (s: GrindState, id: string) => s.weapons[id] ?? 0;
const maskOf = (s: GrindState, id: string) => s.specials[id] ?? 0;

/** The counter of a step you're on that is furthest along (by its own share), or null. */
export function bestCounter(s: GrindState, w: Weapon): { step: StepInfo; count: number } | null {
	let best: { step: StepInfo; count: number } | null = null;
	for (const step of activeSteps(w.id, levelOf(s, w.id), maskOf(s, w.id))) {
		const count = s.counts[countKey(w.id, step.key)] ?? 0;
		if (step.target === 0 || count <= 0) continue;
		if (!best || count / step.target > best.count / best.step.target) best = { step, count };
	}
	return best;
}

export function goldReady(s: GrindState, w: Weapon): boolean {
	return levelOf(s, w.id) === 0 && isReleased(w) && specialsComplete(w.id, 0, maskOf(s, w.id));
}

export function matchesStatus(filter: StatusFilter, s: GrindState, w: Weapon): boolean {
	const level = levelOf(s, w.id);
	switch (filter) {
		case 'done':
			return level >= MAX_LEVEL;
		case 'available':
			return isReleased(w) && level < MAX_LEVEL;
		case 'started':
			return (
				level < MAX_LEVEL &&
				(level > 0 || maskOf(s, w.id) !== 0 || Object.keys(s.counts).some((k) => k.startsWith(`${w.id}:`) && s.counts[k] > 0))
			);
		case 'near': {
			if (level >= MAX_LEVEL) return false;
			if (goldReady(s, w)) return true;
			const best = bestCounter(s, w);
			return best !== null && best.count >= best.step.target * NEAR_SHARE;
		}
	}
}

// ---------------------------------------------------------------------------------------------
// Suggestions for the empty focus list: facts about your own progress, never a guess at which
// grind is quickest.

export type SuggestReason =
	| { kind: 'goldReady' }
	| { kind: 'counter'; step: string; count: number; target: number }
	| { kind: 'lastCamo'; divergenceLeft: number; season1: boolean }
	| { kind: 'preGold'; done: number; total: number };

export interface Suggestion {
	weaponId: string;
	reason: SuggestReason;
}

/**
 * Up to `max` weapons to pin, in this order: all 3 challenges before Gold done (Gold is next);
 * a counter you've started on (furthest along by its own target first); Platinum done, so
 * Harmonic Break is the last camo; before-Gold challenges started. Leaves out pinned, maxed and
 * unreleased guns.
 */
export function suggestions(s: GrindState, divergenceCount: number, max = 3): Suggestion[] {
	const pool = WEAPONS.filter((w) => isReleased(w) && levelOf(s, w.id) < MAX_LEVEL && !s.focus.includes(w.id));
	const out: Suggestion[] = [];
	const taken = new Set<string>();
	const add = (weaponId: string, reason: SuggestReason) => {
		if (out.length < max && !taken.has(weaponId)) {
			taken.add(weaponId);
			out.push({ weaponId, reason });
		}
	};

	for (const w of pool) if (goldReady(s, w)) add(w.id, { kind: 'goldReady' });

	const counted = pool
		.map((w) => ({ w, best: bestCounter(s, w) }))
		.filter((x): x is { w: (typeof pool)[number]; best: NonNullable<ReturnType<typeof bestCounter>> } => x.best !== null)
		.sort((a, b) => b.best.count / b.best.step.target - a.best.count / a.best.step.target);
	for (const { w, best } of counted) {
		add(w.id, { kind: 'counter', step: best.step.name, count: best.count, target: best.step.target });
	}

	const left = Math.max(0, DIVERGENCE_REQUIRED - divergenceCount);
	for (const w of pool) {
		if (levelOf(s, w.id) === MAX_LEVEL - 1) add(w.id, { kind: 'lastCamo', divergenceLeft: left, season1: w.season !== 'launch' });
	}

	for (const w of pool) {
		const mask = maskOf(s, w.id);
		if (levelOf(s, w.id) === 0 && mask !== 0) {
			const done = w.specials.filter((_, i) => ((mask >> i) & 1) === 1).length;
			add(w.id, { kind: 'preGold', done, total: w.specials.length });
		}
	}
	return out;
}
