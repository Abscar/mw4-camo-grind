/**
 * The steps of a weapon's grind, in order: its 3 Special camos (the challenges before Gold), then
 * Gold, Platinum and Harmonic Break. What each one counts (challenge.ts), whether it's done, the one
 * you're on, or not open yet, and the counters' rules. Pure (no runes, no browser), tested in
 * scripts/steps.test.js.
 *
 * How counters and ticks work together (2026-11-10, the user's brief asked to decide and document it):
 * - A counter is progress toward the next tick. Only a step you're on has one: before Gold the
 *   challenges that aren't done yet (they run side by side), after that the next ladder camo.
 * - When a counter reaches its target, the step is ticked (Platinum also ticks Gold, the ladder rule),
 *   and the counter is cleared: a done step shows "Done", never a number.
 * - Ticking by hand clears that step's counter too (and the ones of the steps below it).
 * - Unticking a step starts its counter again from 0. Undo puts the old number back.
 * So a step can never be both ticked and part-way, and a counter is always below its target.
 * "In a single match" challenges have no counter (nothing adds up across matches): tick them.
 */

import { LADDER, MAX_LEVEL } from './data/camos.ts';
import { CLASSES, WEAPON_BY_ID, type Fact, type Weapon } from './data/weapons.ts';
import { parseChallenge, targetOf, type ChallengeUnit } from './challenge.ts';

export type StepKey = 's0' | 's1' | 's2' | 'g' | 'p' | 'hb';
export const LADDER_KEYS = ['g', 'p', 'hb'] as const satisfies readonly StepKey[];
export const SPECIAL_KEYS = ['s0', 's1', 's2'] as const satisfies readonly StepKey[];

export type StepStatus = 'done' | 'active' | 'locked';

export interface StepInfo {
	key: StepKey;
	kind: 'special' | 'ladder';
	/** Special: 0–2. Ladder: 0 = Gold, 1 = Platinum, 2 = Harmonic Break. */
	index: number;
	/** The camo's name (a Special camo's own name, or Gold / Platinum / Harmonic Break). */
	name: string;
	fact: Fact;
	unit: ChallengeUnit;
	/** 0 = no counter ("in a single match"). */
	target: number;
}

/** A weapon is out when its challenges are known (the unreleased event guns have none yet). */
export function isReleased(w: Weapon): boolean {
	return w.specials.length > 0;
}

const cache = new Map<string, StepInfo[]>();

/** Every step of a weapon, Special camos first. Empty for an unknown id. */
export function stepsOf(weaponId: string): StepInfo[] {
	const hit = cache.get(weaponId);
	if (hit) return hit;
	const w = WEAPON_BY_ID.get(weaponId);
	const cls = w && CLASSES.find((c) => c.id === w.classId);
	if (!w || !cls) return [];
	const steps: StepInfo[] = [
		...w.specials.map((s, i): StepInfo => {
			const unit = parseChallenge(s.challenge.text);
			return { key: SPECIAL_KEYS[i], kind: 'special', index: i, name: s.name, fact: s.challenge, unit, target: targetOf(unit) };
		}),
		...LADDER.map((camo, i): StepInfo => {
			const fact = cls.challenges[camo.id];
			const unit = parseChallenge(fact.text);
			return { key: LADDER_KEYS[i], kind: 'ladder', index: i, name: camo.name, fact, unit, target: targetOf(unit) };
		})
	];
	cache.set(weaponId, steps);
	return steps;
}

export function stepInfo(weaponId: string, key: StepKey): StepInfo | undefined {
	return stepsOf(weaponId).find((s) => s.key === key);
}

/** Where a step's counter is kept: "<weapon id>:<step>". */
export const countKey = (weaponId: string, key: StepKey) => `${weaponId}:${key}`;

const KEY = /^([a-z0-9][a-z0-9.-]*):(s[0-2]|g|p|hb)$/;

export function parseCountKey(k: string): { weaponId: string; key: StepKey } | null {
	const m = KEY.exec(k);
	return m ? { weaponId: m[1], key: m[2] as StepKey } : null;
}

const bit = (mask: number, i: number) => ((mask >> i) & 1) === 1;

/** All the weapon's Special camos are done (ticked, or the weapon has Gold). */
export function specialsComplete(weaponId: string, level: number, mask: number): boolean {
	const w = WEAPON_BY_ID.get(weaponId);
	if (!w) return false;
	return level >= 1 || w.specials.every((_, i) => bit(mask, i));
}

/**
 * Done, the one you're on, or not open yet. Before Gold, the Special camos run side by side (each
 * opens at a weapon level we don't track); Gold opens once all three are done; Platinum after Gold;
 * Harmonic Break after Platinum. A weapon that isn't out yet has nothing open.
 */
export function stepStatus(weaponId: string, step: StepInfo, level: number, mask: number): StepStatus {
	const w = WEAPON_BY_ID.get(weaponId);
	if (step.kind === 'special') return level >= 1 || bit(mask, step.index) ? 'done' : 'active';
	if (level > step.index) return 'done';
	if (!w || !isReleased(w) || level < step.index) return 'locked';
	return step.index > 0 || specialsComplete(weaponId, level, mask) ? 'active' : 'locked';
}

/** The steps you can work on right now. */
export function activeSteps(weaponId: string, level: number, mask: number): StepInfo[] {
	return stepsOf(weaponId).filter((s) => stepStatus(weaponId, s, level, mask) === 'active');
}

/**
 * Counters that fit the ticks: a done step or a step without a counter has none, and a counter is
 * below its target. Counters of weapons this version doesn't know are kept (newer data).
 */
export function pruneCounts(
	counts: Record<string, number>,
	levels: Record<string, number>,
	specials: Record<string, number>
): Record<string, number> {
	const out: Record<string, number> = {};
	for (const [k, raw] of Object.entries(counts)) {
		const parsed = parseCountKey(k);
		const value = Math.trunc(Number(raw));
		if (!parsed || !Number.isFinite(value) || value <= 0) continue;
		const w = WEAPON_BY_ID.get(parsed.weaponId);
		if (!w) {
			out[k] = value;
			continue;
		}
		const step = stepInfo(parsed.weaponId, parsed.key);
		if (!step || step.target === 0) continue;
		const level = Math.max(0, Math.min(MAX_LEVEL, levels[parsed.weaponId] ?? 0));
		if (stepStatus(parsed.weaponId, step, level, specials[parsed.weaponId] ?? 0) === 'done') continue;
		out[k] = Math.min(value, step.target - 1);
	}
	return out;
}
