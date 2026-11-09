/**
 * Grind stats under the KPI tiles: camos ticked today and this week, and roughly when Divergence
 * unlocks at your current pace. Worked out from the tick times (Stamps, progress-codec.ts), which
 * only your own taps write. Pure (the time is passed in), so Node tests it (scripts/stats.test.js).
 */

import { DIVERGENCE_REQUIRED, MAX_LEVEL, SEASON_1_COUNTS_TOWARD_DIVERGENCE } from './data/camos.ts';
import { WEAPONS } from './data/weapons.ts';
import type { Stamps } from './progress-codec.ts';

const DAY = 86_400_000;
/** The pace is the Harmonic Breaks of the last this-many days … */
export const PACE_WINDOW_DAYS = 14;
/** … and only shown once your first known tick is at least this many days old. */
export const PACE_MIN_DAYS = 2;

export interface GrindStats {
	/** Ladder camos (Gold, Platinum, Harmonic Break) ticked since midnight. */
	today: number;
	/** … since Monday 00:00. */
	week: number;
	/** Days until Divergence and that day (ms, local midnight), or why there is no estimate. */
	divergence:
		| { kind: 'eta'; days: number; date: number }
		| { kind: 'unlocked' }
		| { kind: 'tooSoon' }
		| { kind: 'noPace' };
}

function startOfDay(ms: number): number {
	const d = new Date(ms);
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}

/** Monday 00:00 of the week `ms` is in (local time). */
function startOfWeek(ms: number): number {
	const d = new Date(startOfDay(ms));
	d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
	return d.getTime();
}

const countsTowardDivergence = (season: string) => SEASON_1_COUNTS_TOWARD_DIVERGENCE || season === 'launch';

export function grindStats(stamps: Stamps, levels: Record<string, number>, now: number): GrindStats {
	const all: number[] = [];
	const hb: number[] = [];
	let hbCount = 0;
	for (const w of WEAPONS) {
		const level = Math.min(levels[w.id] ?? 0, MAX_LEVEL);
		if (level >= MAX_LEVEL && countsTowardDivergence(w.season)) hbCount++;
		for (let i = 0; i < level; i++) {
			const t = stamps[w.id]?.[i] ?? 0;
			if (t <= 0 || t > now + DAY) continue; // a clock that was far off: ignore
			all.push(t);
			if (i === MAX_LEVEL - 1 && countsTowardDivergence(w.season)) hb.push(t);
		}
	}
	const today = all.filter((t) => t >= startOfDay(now)).length;
	const week = all.filter((t) => t >= startOfWeek(now)).length;

	const remaining = DIVERGENCE_REQUIRED - hbCount;
	if (remaining <= 0) return { today, week, divergence: { kind: 'unlocked' } };
	const first = all.length ? Math.min(...all) : now;
	if (now - first < PACE_MIN_DAYS * DAY) return { today, week, divergence: { kind: 'tooSoon' } };
	const from = Math.max(first, now - PACE_WINDOW_DAYS * DAY);
	const recent = hb.filter((t) => t >= from).length;
	if (recent === 0) return { today, week, divergence: { kind: 'noPace' } };
	const perDay = recent / ((now - from) / DAY);
	const days = Math.max(1, Math.ceil(remaining / perDay));
	return { today, week, divergence: { kind: 'eta', days, date: startOfDay(now + days * DAY) } };
}
