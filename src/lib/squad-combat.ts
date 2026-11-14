/**
 * K/D, W/L and the rest for the whole squad (2026-11-14, the user's ask: "kan vi inte tracka typ
 * k/d o w/l osv för ALLA GRABBARNA").
 *
 * Nothing can fetch these by itself: Activision has no open stats API for MW4, and codmunity reads
 * them with its own Windows app while you play. So each member types in their own lifetime numbers
 * from the game's Combat Record ("Update my stats" in the Squad tab), and their page publishes them
 * in its squad entry (squad-codec.ts `combat`), like the ticks.
 *
 * One update per mode per day (a second one the same day replaces it, so a typo is fixed by typing
 * again), the newest COMBAT_DAYS updates kept, so the board can show the change since the update
 * before. Totals are preferred: K/D and W/L are worked out from kills + deaths / wins + losses when
 * both are there, and the typed ratio is only used when they aren't.
 *
 * No browser APIs and no runes, so Node tests it directly (scripts/squad-combat.test.js). Doesn't
 * import squad-codec.ts (which imports this file).
 */

export const COMBAT_MODES = ['mp', 'wz'] as const;
export type CombatMode = (typeof COMBAT_MODES)[number];

export const COMBAT_FIELDS = ['kills', 'deaths', 'wins', 'losses', 'matches', 'spm', 'kd', 'wl'] as const;
export type CombatField = (typeof COMBAT_FIELDS)[number];

/** One update of someone's lifetime numbers in one mode, as typed in. Every number is optional. */
export type CombatSnap = Partial<Record<CombatField, number>> & { at: number };
/** Mode → day ("YYYY-MM-DD", the member's own clock) → that day's update. */
export type CombatLog = Partial<Record<CombatMode, Record<string, CombatSnap>>>;

/** The totals the form asks for per mode, in this order. */
export const MODE_TOTALS: Record<CombatMode, CombatField[]> = {
	mp: ['kills', 'deaths', 'wins', 'losses', 'spm'],
	wz: ['kills', 'deaths', 'wins', 'matches']
};
/** The ratios per mode: filled in from the totals when they're there, typed in when they aren't. */
export const MODE_RATIOS: Record<CombatMode, ('kd' | 'wl')[]> = { mp: ['kd', 'wl'], wz: ['kd'] };

/**
 * Updates kept per mode (one per day). ≈ 100 bytes each, so a member's log stays ≈ 2 KB at most and
 * the squad document well under the sync service's 64 KB.
 */
export const COMBAT_DAYS = 10;

const LIMITS: Record<CombatField, { max: number; decimals: number }> = {
	kills: { max: 99_999_999, decimals: 0 },
	deaths: { max: 99_999_999, decimals: 0 },
	wins: { max: 9_999_999, decimals: 0 },
	losses: { max: 9_999_999, decimals: 0 },
	matches: { max: 9_999_999, decimals: 0 },
	spm: { max: 9_999, decimals: 0 },
	kd: { max: 99, decimals: 2 },
	wl: { max: 99, decimals: 2 }
};

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

function cleanValue(field: CombatField, x: unknown): number | undefined {
	if (typeof x !== 'number' || !Number.isFinite(x) || x < 0) return undefined;
	const { max, decimals } = LIMITS[field];
	const f = 10 ** decimals;
	return Math.min(max, Math.round(x * f) / f);
}

/** One stored update, cleaned; null without a time or without any number. */
export function cleanSnap(raw: unknown): CombatSnap | null {
	if (!isObject(raw) || !isTime(raw.at)) return null;
	const snap: CombatSnap = { at: Math.round(raw.at) };
	let any = false;
	for (const field of COMBAT_FIELDS) {
		const v = cleanValue(field, raw[field]);
		if (v !== undefined) {
			snap[field] = v;
			any = true;
		}
	}
	return any ? snap : null;
}

/** Keep the newest COMBAT_DAYS days. */
function prune(days: Record<string, CombatSnap>): Record<string, CombatSnap> {
	return Object.fromEntries(
		Object.entries(days)
			.sort(([a], [b]) => (a < b ? 1 : -1))
			.slice(0, COMBAT_DAYS)
	);
}

/** A stored or published log, cleaned; undefined when there's nothing in it. */
export function cleanCombat(raw: unknown): CombatLog | undefined {
	if (!isObject(raw)) return undefined;
	const out: CombatLog = {};
	for (const mode of COMBAT_MODES) {
		const days = raw[mode];
		if (!isObject(days)) continue;
		const clean: Record<string, CombatSnap> = {};
		for (const [day, snap] of Object.entries(days)) {
			const s = DAY_KEY.test(day) ? cleanSnap(snap) : null;
			if (s) clean[day] = s;
		}
		if (Object.keys(clean).length) out[mode] = prune(clean);
	}
	return Object.keys(out).length ? out : undefined;
}

/** The log with today's update in a mode set (a second one the same day replaces the first). */
export function withSnap(log: CombatLog | undefined, mode: CombatMode, day: string, snap: CombatSnap): CombatLog {
	return { ...log, [mode]: prune({ ...log?.[mode], [day]: snap }) };
}

/** Two copies of the same member's log (two devices): per day, the later update wins. */
export function mergeCombat(a: CombatLog | undefined, b: CombatLog | undefined): CombatLog {
	const out: CombatLog = {};
	for (const mode of COMBAT_MODES) {
		const days: Record<string, CombatSnap> = { ...a?.[mode] };
		for (const [day, snap] of Object.entries(b?.[mode] ?? {})) {
			if (!days[day] || snap.at > days[day].at) days[day] = snap;
		}
		if (Object.keys(days).length) out[mode] = prune(days);
	}
	return out;
}

/**
 * What someone typed into a field: null = left empty, 'bad' = not a number. Counts allow thousands
 * separators ("12,345", "12 345", "12.345"); ratios allow a decimal comma ("1,23").
 */
export function parseField(field: CombatField, text: string): number | null | 'bad' {
	const raw = text.trim();
	if (!raw) return null;
	const { max, decimals } = LIMITS[field];
	let n: number;
	if (decimals === 0) {
		const digits = raw.replace(/[\s,.'’ ]/g, '');
		if (!/^\d+$/.test(digits)) return 'bad';
		n = Number(digits);
	} else {
		const dot = raw.replace(',', '.');
		if (!/^\d+(\.\d+)?$/.test(dot)) return 'bad';
		n = Number(dot);
	}
	if (!Number.isFinite(n) || n > max) return 'bad';
	return cleanValue(field, n) ?? 'bad';
}

/** A ratio with deaths/losses of 0 counts the kills/wins on their own, like the game does. */
const ratio = (a: number, b: number) => (b > 0 ? a / b : a);

/** K/D: from kills + deaths when both are there, else the typed ratio. */
export function kdOf(s: Partial<CombatSnap> | null | undefined): number | null {
	if (!s) return null;
	if (s.kills !== undefined && s.deaths !== undefined && (s.kills > 0 || s.deaths > 0)) return ratio(s.kills, s.deaths);
	return s.kd ?? null;
}

/** W/L (Multiplayer): from wins + losses when both are there, else the typed ratio. */
export function wlOf(s: Partial<CombatSnap> | null | undefined): number | null {
	if (!s) return null;
	if (s.wins !== undefined && s.losses !== undefined && (s.wins > 0 || s.losses > 0)) return ratio(s.wins, s.losses);
	return s.wl ?? null;
}

/** Win rate in % (Warzone: wins of matches played). */
export function winRateOf(s: Partial<CombatSnap> | null | undefined): number | null {
	if (!s || s.wins === undefined || !s.matches || s.wins > s.matches) return null;
	return (s.wins / s.matches) * 100;
}

export interface CombatView {
	day: string;
	latest: CombatSnap;
	kd: number | null;
	/** W/L in Multiplayer, win rate (%) in Warzone. */
	wl: number | null;
	kills: number | null;
	wins: number | null;
	spm: number | null;
	/** The update before the latest one (another day), and what changed since. */
	before: {
		day: string;
		kd: number | null;
		/** Change in lifetime K/D. */
		kdDelta: number | null;
		/** K/D over just the games in between (kills gained ÷ deaths gained), when both had totals. */
		form: number | null;
		kills: number | null;
		wins: number | null;
	} | null;
}

/** One member's latest numbers in a mode and the change since the update before; null without any. */
export function combatView(log: CombatLog | undefined, mode: CombatMode): CombatView | null {
	const days = Object.keys(log?.[mode] ?? {}).sort();
	if (!days.length || !log?.[mode]) return null;
	const day = days[days.length - 1];
	const latest = log[mode][day];
	const kd = kdOf(latest);
	const wl = mode === 'mp' ? wlOf(latest) : winRateOf(latest);
	const view: CombatView = { day, latest, kd, wl, kills: latest.kills ?? null, wins: latest.wins ?? null, spm: latest.spm ?? null, before: null };
	if (days.length > 1) {
		const prevDay = days[days.length - 2];
		const prev = log[mode][prevDay];
		const prevKd = kdOf(prev);
		const gain = (field: 'kills' | 'deaths' | 'wins') =>
			latest[field] !== undefined && prev[field] !== undefined && latest[field]! >= prev[field]! ? latest[field]! - prev[field]! : null;
		const kills = gain('kills');
		const deaths = gain('deaths');
		view.before = {
			day: prevDay,
			kd: prevKd,
			kdDelta: kd !== null && prevKd !== null ? kd - prevKd : null,
			form: kills !== null && deaths !== null && deaths > 0 ? kills / deaths : null,
			kills,
			wins: gain('wins')
		};
	}
	return view;
}

export type CombatSort = 'kd' | 'wl' | 'kills' | 'wins';

/** Best first by the chosen number; members without it go last, by name. */
export function rankCombat<T extends { name: string; view: CombatView | null }>(rows: T[], by: CombatSort): T[] {
	const value = (r: T) => r.view?.[by] ?? null;
	return [...rows].sort((a, b) => {
		const va = value(a);
		const vb = value(b);
		if (va === null && vb === null) return a.name.localeCompare(b.name);
		if (va === null) return 1;
		if (vb === null) return -1;
		return vb - va || a.name.localeCompare(b.name);
	});
}

/** "1.23" (two decimals, like the game). */
export const fmtRatio = (n: number) => n.toFixed(2);
/** "+0.03" / "−0.02" / "±0.00". */
export function fmtDelta(n: number): string {
	const r = Math.round(n * 100) / 100;
	if (r === 0) return '±0.00';
	return `${r > 0 ? '+' : '−'}${Math.abs(r).toFixed(2)}`;
}
