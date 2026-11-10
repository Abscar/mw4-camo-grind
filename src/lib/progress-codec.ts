/**
 * Pure helpers for progress data: defaults, migration from older formats, the JSON backup
 * format and the compact "progress link" format. No browser APIs and no runes here, so this
 * file can be tested directly with Node (`npm test`).
 */

import { ALL_MASTERY, MASTERY, MASTERY_EXTRA, MASTERY_TRACKS, MAX_LEVEL } from './data/camos.ts';
import { CLASSES, WEAPONS } from './data/weapons.ts';
import { DEFAULT_THEME, isThemeId, type ThemeId } from './themes.ts';

export interface ProgressData {
	/** Weapon id → ladder level (0 = nothing … 3 = Harmonic Break). Unknown ids are kept, never dropped. */
	weapons: Record<string, number>;
	/**
	 * Mastery id → how many times the challenge is done. Warzone and DMZ (2026-11-10) can be
	 * missing: data from before then (saves, backups, links) has none, and leaves yours alone.
	 */
	mastery: Record<string, number>;
	/**
	 * Weapon id → which of its 3 Special camos (the challenges before Gold) are ticked, as bits
	 * (1 = first, 2 = second, 4 = third). Added 2026-11-08 as an optional field: data without it
	 * (older saves, backups and links) leaves your ticks alone. A weapon with Gold counts as all 3 done.
	 */
	specials?: Record<string, number>;
}

/** All 3 Special camos ticked. */
export const SPECIALS_ALL = 0b111;

/**
 * Weapon id → when each ladder camo was ticked (ms since 1970; index 0 = Gold, 1 = Platinum,
 * 2 = Harmonic Break; 0 = not known). Only your own taps write one. Feeds the grind stats
 * (stats.ts). Saved and synced, not in backups or progress links.
 */
export type Stamps = Record<string, number[]>;

export interface Prefs {
	theme: ThemeId;
	hideMaxed: boolean;
	/** Class id to show, or null for all classes. */
	classFilter: string | null;
	/** The weapons pinned to the focus list (ids, in the order they were pinned, at most FOCUS_MAX). */
	focus: string[];
}

/** Weapon id → the user's own note about that weapon. */
export type Notes = Record<string, string>;

/** How many weapons the focus list holds. */
export const FOCUS_MAX = 4;
/** Longest note we keep, in characters. */
export const NOTE_MAX = 300;

export const CURRENT_VERSION = 2;
export const APP_ID = 'mw4-camo-grind';

/**
 * What we keep in localStorage. `notes` and `lastTickAt` were added on 2026-11-07 as optional
 * fields, so older saves (without them) still read fine and nothing needed a new version.
 */
export interface StoredV2 {
	v: 2;
	progress: ProgressData;
	prefs: Prefs;
	notes?: Notes;
	/** When a tick last added a camo (ISO), for the news buddy's mood. */
	lastTickAt?: string;
	/** When each camo was ticked (2026-11-08, optional like notes). */
	stamps?: Stamps;
	savedAt: string;
}

/** What "Export backup" writes. `notes` is left out when there are none (and older files have none). */
export interface ExportV2 {
	app: typeof APP_ID;
	v: 2;
	exported: string;
	progress: ProgressData;
	notes?: Notes;
}

const OLD_MASTERY_IDS: Record<string, string> = {
	md: 'mercurialDrift',
	pr: 'polyatomicReforged',
	or: 'orionReforged'
};

/** Launch weapons start with Gold ticked; Season 1 weapons start empty. */
export function defaultLevel(weaponId: string): number {
	const w = WEAPONS.find((x) => x.id === weaponId);
	return w && w.season === 'launch' ? 1 : 0;
}

export function defaultProgress(): ProgressData {
	return {
		weapons: Object.fromEntries(WEAPONS.map((w) => [w.id, defaultLevel(w.id)])),
		mastery: Object.fromEntries(ALL_MASTERY.map((m) => [m.id, 0]))
	};
}

/**
 * A Warzone or DMZ track the source knows nothing about (none of its ids) is taken out, so
 * applying the source leaves those counts alone (`Progress.replace` keeps what it doesn't get).
 */
function dropUnknownTracks(mastery: Record<string, number>, source: Record<string, unknown>): void {
	for (const track of MASTERY_TRACKS) {
		if (track.mode === 'mp' || track.camos.some((m) => m.id in source)) continue;
		for (const m of track.camos) delete mastery[m.id];
	}
}

export function defaultPrefs(): Prefs {
	return { theme: DEFAULT_THEME, hideMaxed: false, classFilter: null, focus: [] };
}

function isObject(x: unknown): x is Record<string, unknown> {
	return typeof x === 'object' && x !== null && !Array.isArray(x);
}

export function clampLevel(x: unknown): number {
	const n = typeof x === 'number' ? x : Number(x);
	if (!Number.isFinite(n)) return 0;
	return Math.max(0, Math.min(MAX_LEVEL, Math.trunc(n)));
}

export function clampCount(x: unknown, target: number): number {
	const n = typeof x === 'number' ? x : Number.parseInt(String(x), 10);
	if (!Number.isFinite(n)) return 0;
	return Math.max(0, Math.min(target, Math.trunc(n)));
}

/** Old tracker stored [gold, plat, hb] flags; the highest ticked one wins (ticking higher fills lower). */
function levelFromOldTicks(t: unknown): number | null {
	if (!Array.isArray(t)) return null;
	let level = 0;
	t.slice(0, MAX_LEVEL).forEach((on, i) => {
		if (on) level = i + 1;
	});
	return level;
}

/**
 * Fill in anything missing with defaults and clamp values, without dropping unknown weapon ids
 * (they might belong to a newer version of the data).
 */
function normaliseProgress(weapons: Record<string, unknown>, mastery: Record<string, unknown>): ProgressData {
	const out = defaultProgress();
	for (const [id, value] of Object.entries(weapons)) out.weapons[id] = clampLevel(value);
	for (const m of ALL_MASTERY) {
		if (m.id in mastery) out.mastery[m.id] = clampCount(mastery[m.id], m.target);
	}
	dropUnknownTracks(out.mastery, mastery);
	return out;
}

/** A Special-camo bit set we can use (0 … SPECIALS_ALL). */
export function cleanMask(x: unknown): number {
	const n = typeof x === 'number' ? x : Number(x);
	return Number.isInteger(n) ? n & SPECIALS_ALL : 0;
}

/** Keep the ticked Special camos (empty ones dropped). Unknown weapon ids are kept (newer data). */
export function normaliseSpecials(raw: Record<string, unknown>): Record<string, number> {
	const out: Record<string, number> = {};
	for (const [id, value] of Object.entries(raw).slice(0, 500)) {
		const mask = cleanMask(value);
		if (mask) out[id] = mask;
	}
	return out;
}

/** Usable tick times only: up to 3 per weapon, whole ms, 0 where unknown. */
export function normaliseStamps(raw: Record<string, unknown>): Stamps {
	const out: Stamps = {};
	for (const [id, value] of Object.entries(raw).slice(0, 500)) {
		if (!Array.isArray(value)) continue;
		const times = value.slice(0, MAX_LEVEL).map((x) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? Math.trunc(x) : 0));
		if (times.some(Boolean)) out[id] = times;
	}
	return out;
}

/**
 * Tick times that still match the weapons' levels: a camo you no longer have has no time. When
 * several sources know a time for the same camo (sync), the earliest wins.
 */
export function mergeStamps(levels: Record<string, number>, ...sources: (Stamps | undefined)[]): Stamps {
	const out: Stamps = {};
	for (const [id, level] of Object.entries(levels)) {
		const times: number[] = [];
		for (let i = 0; i < Math.min(level, MAX_LEVEL); i++) {
			const known = sources.map((s) => s?.[id]?.[i] ?? 0).filter((x) => x > 0);
			times.push(known.length ? Math.min(...known) : 0);
		}
		if (times.some(Boolean)) out[id] = times;
	}
	return out;
}

export interface Migrated {
	progress: ProgressData;
	/** Only present when the source had preferences (localStorage, not export files). */
	prefs?: Prefs;
	/** Only present when the source had notes (saves and backups from 2026-11-07 on). */
	notes?: Notes;
	lastTickAt?: string;
	stamps?: Stamps;
	savedAt?: string;
	/** Version of the source format, for messages. */
	from: number;
}

/** A note as we keep it: plain text, trimmed, at most NOTE_MAX characters. */
export function cleanNote(x: unknown): string {
	return typeof x === 'string' ? x.trim().slice(0, NOTE_MAX) : '';
}

/** Keep the usable notes. Unknown weapon ids are kept (they might belong to newer data). */
export function normaliseNotes(raw: Record<string, unknown>): Notes {
	const out: Notes = {};
	for (const [id, value] of Object.entries(raw).slice(0, 500)) {
		const note = cleanNote(value);
		if (note !== '') out[id] = note;
	}
	return out;
}

/** An ISO date string we can read, or undefined. */
function readDate(x: unknown): string | undefined {
	if (typeof x !== 'string') return undefined;
	const ms = Date.parse(x);
	return Number.isFinite(ms) ? new Date(ms).toISOString() : undefined;
}

/** Optional extras next to the progress: notes, and when the last tick / save happened. */
function addExtras(migrated: Migrated, raw: Record<string, unknown>): Migrated {
	if (isObject(raw.notes)) migrated.notes = normaliseNotes(raw.notes);
	if (isObject(raw.stamps)) migrated.stamps = normaliseStamps(raw.stamps);
	const lastTickAt = readDate(raw.lastTickAt);
	if (lastTickAt) migrated.lastTickAt = lastTickAt;
	const savedAt = readDate(raw.savedAt);
	if (savedAt) migrated.savedAt = savedAt;
	return migrated;
}

/**
 * Turn anything we have ever written (localStorage of v1 or v2, export files of v1 or v2)
 * into the current shape. Returns null if it doesn't look like our data at all.
 */
export function migrate(raw: unknown): Migrated | null {
	if (!isObject(raw)) return null;

	// v2: { v: 2, progress: {...}, prefs?: {...} } (localStorage) or { app, v: 2, progress } (export)
	if (isObject(raw.progress)) {
		const p = raw.progress;
		const progress = normaliseProgress(
			isObject(p.weapons) ? p.weapons : {},
			isObject(p.mastery) ? p.mastery : {}
		);
		if (isObject(p.specials)) progress.specials = normaliseSpecials(p.specials);
		const migrated: Migrated = { progress, from: typeof raw.v === 'number' ? raw.v : CURRENT_VERSION };
		if (isObject(raw.prefs)) migrated.prefs = normalisePrefs(raw.prefs);
		return addExtras(migrated, raw);
	}

	// v1 (the old single-file tracker): { v: 1, ticks: { id: [g, p, h] }, mastery: { md, pr, or }, theme, hideMaxed }
	// Its export file has the same ticks/mastery plus { app, exported }.
	if (isObject(raw.ticks)) {
		const weapons: Record<string, unknown> = {};
		for (const [id, t] of Object.entries(raw.ticks)) {
			const level = levelFromOldTicks(t);
			if (level !== null) weapons[id] = level;
		}
		const mastery: Record<string, unknown> = {};
		if (isObject(raw.mastery)) {
			for (const [oldId, value] of Object.entries(raw.mastery)) {
				mastery[OLD_MASTERY_IDS[oldId] ?? oldId] = value;
			}
		}
		const migrated: Migrated = { progress: normaliseProgress(weapons, mastery), from: 1 };
		if ('theme' in raw || 'hideMaxed' in raw) {
			migrated.prefs = normalisePrefs({ theme: raw.theme, hideMaxed: raw.hideMaxed });
		}
		return migrated;
	}

	return null;
}

export function normalisePrefs(raw: Record<string, unknown>): Prefs {
	const d = defaultPrefs();
	return {
		theme: isThemeId(raw.theme) ? raw.theme : d.theme,
		hideMaxed: typeof raw.hideMaxed === 'boolean' ? raw.hideMaxed : d.hideMaxed,
		classFilter:
			typeof raw.classFilter === 'string' && CLASSES.some((c) => c.id === raw.classFilter)
				? raw.classFilter
				: null,
		focus: normaliseFocus(raw.focus)
	};
}

/** Known weapon ids only, no duplicates, at most FOCUS_MAX. */
export function normaliseFocus(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [];
	const known = new Set(WEAPONS.map((w) => w.id));
	return [...new Set(raw.filter((id): id is string => typeof id === 'string' && known.has(id)))].slice(0, FOCUS_MAX);
}

export function toStored(
	progress: ProgressData,
	prefs: Prefs,
	extras: { notes: Notes; lastTickAt: string | null; stamps?: Stamps } = { notes: {}, lastTickAt: null }
): StoredV2 {
	const stored: StoredV2 = { v: 2, progress, prefs, notes: extras.notes, savedAt: new Date().toISOString() };
	if (extras.lastTickAt) stored.lastTickAt = extras.lastTickAt;
	if (extras.stamps && Object.keys(extras.stamps).length > 0) stored.stamps = extras.stamps;
	return stored;
}

export function toExport(progress: ProgressData, notes: Notes = {}): ExportV2 {
	const file: ExportV2 = { app: APP_ID, v: 2, exported: new Date().toISOString(), progress };
	if (Object.keys(notes).length > 0) file.notes = notes;
	return file;
}

/** Same ticks and Mastery counts (Special camos and Warzone/DMZ counts too, when both sides have them). */
export function sameProgress(a: ProgressData, b: ProgressData): boolean {
	const sa = a.specials;
	const sb = b.specials;
	const known = (p: ProgressData, id: string) => MASTERY.some((m) => m.id === id) || id in p.mastery;
	return (
		WEAPONS.every((w) => (a.weapons[w.id] ?? 0) === (b.weapons[w.id] ?? 0)) &&
		ALL_MASTERY.every(
			(m) => !known(a, m.id) || !known(b, m.id) || (a.mastery[m.id] ?? 0) === (b.mastery[m.id] ?? 0)
		) &&
		(!sa || !sb || WEAPONS.every((w) => (sa[w.id] ?? 0) === (sb[w.id] ?? 0)))
	);
}

// ---------------------------------------------------------------------------------------------
// Progress link: "#p=1.<levels>.<mastery counts>.S<specials>.M<warzone + dmz counts>"
//   levels   = base64url, 3 weapons per character (2 bits each), indexed by weapon `slot`
//   mastery  = one base-36 number per Multiplayer Mastery camo, in MASTERY order
//   specials = "S" + base64url, 2 weapons per character (3 bits each), trailing zeros ("A") cut;
//              added 2026-11-08, so older links don't have it (and then leave the ticks alone)
//   extra    = "M" + base-36 counts joined by "-", in MASTERY_EXTRA order (Warzone, then DMZ),
//              trailing zeros cut ("M" alone = all zero); added 2026-11-10, older links don't
//              have it and then leave those counts alone. Older pages ignore it.
// e.g. 37 weapons + 3 mastery counts ≈ 30 characters.

const LINK_FORMAT = '1';
const SPECIALS_TAG = 'S';
const EXTRA_TAG = 'M';
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function encodeLink(progress: ProgressData): string {
	const slots = Math.max(0, ...WEAPONS.map((w) => w.slot + 1));
	const values = new Array<number>(slots).fill(0);
	for (const w of WEAPONS) values[w.slot] = clampLevel(progress.weapons[w.id]);
	let levels = '';
	for (let i = 0; i < slots; i += 3) {
		const n = ((values[i] ?? 0) << 4) | ((values[i + 1] ?? 0) << 2) | (values[i + 2] ?? 0);
		levels += B64[n];
	}
	const mastery = MASTERY.map((m) => clampCount(progress.mastery[m.id], m.target).toString(36));
	const masks = new Array<number>(slots).fill(0);
	for (const w of WEAPONS) masks[w.slot] = cleanMask(progress.specials?.[w.id]);
	let specials = '';
	for (let i = 0; i < slots; i += 2) specials += B64[(masks[i] << 3) | (masks[i + 1] ?? 0)];
	const extra = MASTERY_EXTRA.map((m) => clampCount(progress.mastery[m.id], m.target));
	while (extra.length > 0 && extra[extra.length - 1] === 0) extra.pop();
	return [
		LINK_FORMAT,
		levels,
		...mastery,
		SPECIALS_TAG + specials.replace(/A+$/, ''),
		EXTRA_TAG + extra.map((n) => n.toString(36)).join('-')
	].join('.');
}

/** Returns null when the code is not a valid progress link. Missing weapons get their defaults. */
export function decodeLink(code: string): ProgressData | null {
	const parts = code.trim().split('.');
	if (parts[0] !== LINK_FORMAT || parts.length < 2) return null;
	const levels = parts[1];
	if (!/^[A-Za-z0-9_-]*$/.test(levels)) return null;

	const out = defaultProgress();
	for (const w of WEAPONS) {
		const ch = levels[Math.floor(w.slot / 3)];
		if (ch === undefined) continue;
		const n = B64.indexOf(ch);
		out.weapons[w.id] = clampLevel((n >> (4 - 2 * (w.slot % 3))) & 3);
	}
	for (const [i, m] of MASTERY.entries()) {
		const part = parts[2 + i];
		if (part === undefined) continue;
		if (!/^[0-9a-z]+$/.test(part)) return null;
		out.mastery[m.id] = clampCount(Number.parseInt(part, 36), m.target);
	}
	const specials = parts[2 + MASTERY.length];
	if (specials !== undefined) {
		if (!/^S[A-Za-z0-9_-]*$/.test(specials)) return null;
		out.specials = {};
		for (const w of WEAPONS) {
			const n = Math.max(0, B64.indexOf(specials[1 + Math.floor(w.slot / 2)] ?? 'A'));
			const mask = w.slot % 2 === 0 ? n >> 3 : n & SPECIALS_ALL;
			if (mask) out.specials[w.id] = mask;
		}
	}
	const extra = parts[3 + MASTERY.length];
	if (extra === undefined) {
		for (const m of MASTERY_EXTRA) delete out.mastery[m.id]; // older link: leave these alone
	} else {
		if (!/^M(?:[0-9a-z]+(?:-[0-9a-z]+)*)?$/.test(extra)) return null;
		const counts = extra.length > 1 ? extra.slice(1).split('-') : [];
		for (const [i, m] of MASTERY_EXTRA.entries()) {
			out.mastery[m.id] = clampCount(Number.parseInt(counts[i] ?? '0', 36), m.target);
		}
	}
	return out;
}

/** Pull the code out of a URL hash like "#p=1.xxx". */
export function linkCodeFromHash(hash: string): string | null {
	const match = /(?:^#|&)p=([^&]+)/.exec(hash);
	return match ? decodeURIComponent(match[1]) : null;
}
