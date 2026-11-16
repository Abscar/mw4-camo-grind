/**
 * The squad's Ranked board (2026-11-16, idea 5 of the squad-link brainstorm: "everyone types in
 * their SR, see who's climbing, '+250 since yesterday'"). Like the Combat record (squad-combat.ts):
 * nothing can fetch SR by itself, so each member types in their own and their page publishes it in
 * its squad entry (squad-codec.ts `ranked`).
 *
 * One update per day (saving again the same day replaces it), the newest RANKED_DAYS kept, so the
 * board shows the change since the update before. The rank (Gold II …) is worked out from the SR
 * with last year's (BO7's) table, data/ranked.ts LAST_YEAR_RANKS, until MW4 publishes its own;
 * a Top 250 place can be typed in on its own.
 *
 * No browser APIs and no runes, so Node tests it directly (scripts/squad-ranked.test.js). Doesn't
 * import squad-codec.ts (which imports this file).
 */

import { LAST_YEAR_RANKS } from './data/ranked.ts';

/** Updates kept (one per day). ≈ 40 bytes each, so a member's log stays well under 1 KB. */
export const RANKED_DAYS = 10;
export const SR_MAX = 99_999;
export const TOP_MAX = 250;

/** One update as typed in: the SR, and the Top 250 place when they're in it. */
export interface RankedSnap {
	sr: number;
	top?: number;
	at: number;
}
/** Day ("YYYY-MM-DD", the member's own clock) → that day's update. */
export type RankedLog = Record<string, RankedSnap>;

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;
const whole = (x: unknown, min: number, max: number) => (Number.isInteger(x) && (x as number) >= min && (x as number) <= max ? (x as number) : undefined);

/** One stored update, cleaned; null without a time or a valid SR. */
export function cleanRankedSnap(raw: unknown): RankedSnap | null {
	if (!isObject(raw) || !isTime(raw.at)) return null;
	const sr = whole(raw.sr, 0, SR_MAX);
	if (sr === undefined) return null;
	const snap: RankedSnap = { sr, at: Math.round(raw.at) };
	const top = whole(raw.top, 1, TOP_MAX);
	if (top !== undefined) snap.top = top;
	return snap;
}

/** Keep the newest RANKED_DAYS days. */
function prune(days: RankedLog): RankedLog {
	return Object.fromEntries(
		Object.entries(days)
			.sort(([a], [b]) => (a < b ? 1 : -1))
			.slice(0, RANKED_DAYS)
	);
}

/** A stored or published log, cleaned; undefined when there's nothing in it. */
export function cleanRanked(raw: unknown): RankedLog | undefined {
	if (!isObject(raw)) return undefined;
	const out: RankedLog = {};
	for (const [day, snap] of Object.entries(raw)) {
		const s = DAY_KEY.test(day) ? cleanRankedSnap(snap) : null;
		if (s) out[day] = s;
	}
	return Object.keys(out).length ? prune(out) : undefined;
}

/** The log with today's update set (a second one the same day replaces the first). */
export function withRanked(log: RankedLog | undefined, day: string, snap: RankedSnap): RankedLog {
	return prune({ ...log, [day]: snap });
}

/** Two copies of the same member's log (two devices): per day, the later update wins. */
export function mergeRanked(a: RankedLog | undefined, b: RankedLog | undefined): RankedLog {
	const days: RankedLog = { ...a };
	for (const [day, snap] of Object.entries(b ?? {})) {
		if (!days[day] || snap.at > days[day].at) days[day] = snap;
	}
	return prune(days);
}

/** What someone typed: null = empty, 'bad' = not a whole number in range. Allows "2,450" / "2 450". */
export function parseWhole(text: string, max: number, min = 0): number | null | 'bad' {
	const raw = text.trim();
	if (!raw) return null;
	const digits = raw.replace(/^#/, '').replace(/[\s,.'’ ]/g, '');
	if (!/^\d+$/.test(digits)) return 'bad';
	const n = Number(digits);
	return n >= min && n <= max ? n : 'bad';
}

export interface Rank {
	/** "Gold" */
	tier: string;
	/** 1–3 inside a tier, null for Iridescent / Top 250. */
	division: number | null;
	/** "Gold II", "Iridescent", "Top 250 · #37" */
	label: string;
	color: string;
	/** Index in LAST_YEAR_RANKS (higher = better), for sorting and the badge. */
	level: number;
}

const ROMAN = ['I', 'II', 'III'];
const TOP = LAST_YEAR_RANKS.length - 1;

/** The rank an SR gives on last year's table (a Top 250 place wins over the SR). */
export function rankOf(sr: number, top?: number): Rank {
	if (top !== undefined) {
		const r = LAST_YEAR_RANKS[TOP];
		return { tier: r.name, division: null, label: `${r.name} · #${top}`, color: r.color, level: TOP };
	}
	for (let i = TOP - 1; i >= 0; i--) {
		const r = LAST_YEAR_RANKS[i];
		const starts = r.sr;
		if (!starts.length || sr < starts[0]) continue;
		let division: number | null = null;
		if (starts.length > 1) {
			division = 1;
			for (let d = starts.length - 1; d > 0; d--) if (sr >= starts[d]) { division = d + 1; break; }
		}
		return { tier: r.name, division, label: division ? `${r.name} ${ROMAN[division - 1]}` : r.name, color: r.color, level: i };
	}
	const r = LAST_YEAR_RANKS[0];
	return { tier: r.name, division: 1, label: `${r.name} I`, color: r.color, level: 0 };
}

/** SR still needed for the next division or tier on last year's table; null at Iridescent and up. */
export function toNext(sr: number): { sr: number; label: string } | null {
	const all = LAST_YEAR_RANKS.slice(0, TOP).flatMap((r) =>
		r.sr.map((start, d) => ({ start, label: r.sr.length > 1 ? `${r.name} ${ROMAN[d]}` : r.name }))
	);
	const next = all.find((x) => x.start > sr);
	return next ? { sr: next.start - sr, label: next.label } : null;
}

export interface RankedView {
	day: string;
	latest: RankedSnap;
	rank: Rank;
	/** The update before the latest one (another day) and the SR change since. */
	before: { day: string; sr: number; delta: number; rank: Rank } | null;
}

/** A member's latest SR and the change since the update before; null without any. */
export function rankedView(log: RankedLog | undefined): RankedView | null {
	const days = Object.keys(log ?? {}).sort();
	if (!days.length || !log) return null;
	const day = days[days.length - 1];
	const latest = log[day];
	const view: RankedView = { day, latest, rank: rankOf(latest.sr, latest.top), before: null };
	if (days.length > 1) {
		const prevDay = days[days.length - 2];
		const prev = log[prevDay];
		view.before = { day: prevDay, sr: prev.sr, delta: latest.sr - prev.sr, rank: rankOf(prev.sr, prev.top) };
	}
	return view;
}

/**
 * Best first: a Top 250 place first (lower place = better), then by SR; members without an update
 * go last, by name.
 */
export function rankRanked<T extends { name: string; view: RankedView | null }>(rows: T[]): T[] {
	const key = (v: RankedView) => (v.latest.top !== undefined ? 1_000_000 - v.latest.top : v.latest.sr);
	return [...rows].sort((a, b) => {
		if (!a.view && !b.view) return a.name.localeCompare(b.name);
		if (!a.view) return 1;
		if (!b.view) return -1;
		return key(b.view) - key(a.view) || a.name.localeCompare(b.name);
	});
}

/** "+250" / "−75" / "±0". */
export function fmtSrDelta(n: number): string {
	if (n === 0) return '±0';
	return `${n > 0 ? '+' : '−'}${Math.abs(n).toLocaleString('en-US')}`;
}
