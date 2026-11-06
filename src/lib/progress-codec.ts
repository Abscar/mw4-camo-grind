/**
 * Pure helpers for progress data: defaults, migration from older formats, the JSON backup
 * format and the compact "progress link" format. No browser APIs and no runes here, so this
 * file can be tested directly with Node (`npm test`).
 */

import { MAX_LEVEL, MASTERY } from './data/camos.ts';
import { CLASSES, WEAPONS } from './data/weapons.ts';
import { DEFAULT_THEME, isThemeId, type ThemeId } from './themes.ts';

export interface ProgressData {
	/** Weapon id → ladder level (0 = nothing … 3 = Harmonic Break). Unknown ids are kept, never dropped. */
	weapons: Record<string, number>;
	/** Mastery id → how many times the challenge is done. */
	mastery: Record<string, number>;
}

export interface Prefs {
	theme: ThemeId;
	hideMaxed: boolean;
	/** Class id to show, or null for all classes. */
	classFilter: string | null;
}

export const CURRENT_VERSION = 2;
export const APP_ID = 'mw4-camo-grind';

/** What we keep in localStorage. */
export interface StoredV2 {
	v: 2;
	progress: ProgressData;
	prefs: Prefs;
	savedAt: string;
}

/** What "Export backup" writes. */
export interface ExportV2 {
	app: typeof APP_ID;
	v: 2;
	exported: string;
	progress: ProgressData;
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
		mastery: Object.fromEntries(MASTERY.map((m) => [m.id, 0]))
	};
}

export function defaultPrefs(): Prefs {
	return { theme: DEFAULT_THEME, hideMaxed: false, classFilter: null };
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
	for (const m of MASTERY) {
		if (m.id in mastery) out.mastery[m.id] = clampCount(mastery[m.id], m.target);
	}
	return out;
}

export interface Migrated {
	progress: ProgressData;
	/** Only present when the source had preferences (localStorage, not export files). */
	prefs?: Prefs;
	/** Version of the source format, for messages. */
	from: number;
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
		const migrated: Migrated = { progress, from: typeof raw.v === 'number' ? raw.v : CURRENT_VERSION };
		if (isObject(raw.prefs)) migrated.prefs = normalisePrefs(raw.prefs);
		return migrated;
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
				: null
	};
}

export function toStored(progress: ProgressData, prefs: Prefs): StoredV2 {
	return { v: 2, progress, prefs, savedAt: new Date().toISOString() };
}

export function toExport(progress: ProgressData): ExportV2 {
	return { app: APP_ID, v: 2, exported: new Date().toISOString(), progress };
}

export function sameProgress(a: ProgressData, b: ProgressData): boolean {
	return (
		WEAPONS.every((w) => (a.weapons[w.id] ?? 0) === (b.weapons[w.id] ?? 0)) &&
		MASTERY.every((m) => (a.mastery[m.id] ?? 0) === (b.mastery[m.id] ?? 0))
	);
}

// ---------------------------------------------------------------------------------------------
// Progress link: "#p=1.<levels>.<mastery counts>"
//   levels  = base64url, 3 weapons per character (2 bits each), indexed by weapon `slot`
//   mastery = one base-36 number per Mastery camo, in MASTERY order
// e.g. 37 weapons + 3 mastery counts ≈ 25 characters.

const LINK_FORMAT = '1';
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
	return [LINK_FORMAT, levels, ...mastery].join('.');
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
	return out;
}

/** Pull the code out of a URL hash like "#p=1.xxx". */
export function linkCodeFromHash(hash: string): string | null {
	const match = /(?:^#|&)p=([^&]+)/.exec(hash);
	return match ? decodeURIComponent(match[1]) : null;
}
