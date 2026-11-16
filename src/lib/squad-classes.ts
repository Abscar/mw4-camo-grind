/**
 * Squad classes (2026-11-16, idea 3 of the squad-link brainstorm: "everyone saves the code of the
 * class they actually run on a gun, the others copy it in one tap"). Each member's page publishes
 * its own list in its squad entry (squad-codec.ts `classes`), kept on the device too
 * (`mw4-camo-grind:squad-classes`) so leaving a squad doesn't lose it.
 *
 * Stored as id → class. Removing one leaves a small tombstone ({ del: 1, at }) so the removal also
 * reaches your other device (merge: per id, the later `at` wins). At most CLASS_MAX live classes and
 * TOMB_MAX tombstones per member, so a member's list stays ≈ 1 KB.
 *
 * Build codes are the game's own ("B04-3KA95-TI247-BF11"): never made up here. Their first part
 * names the gun (buildPrefix.ts reads which, from the codes we know).
 *
 * No browser APIs and no runes, so Node tests it directly (scripts/squad-classes.test.js). Doesn't
 * import squad-codec.ts (which imports this file).
 */

import { WEAPONS } from './data/weapons.ts';

export const CLASS_MAX = 12;
export const TOMB_MAX = 12;
export const CLASS_NAME_MAX = 24;
/** Multiplayer, Hardcore, Warzone, Ranked: a small tag on the class. */
export const CLASS_KINDS = ['mp', 'hc', 'wz', 'rk'] as const;
export type ClassKind = (typeof CLASS_KINDS)[number];

export interface SquadClass {
	/** Weapon id (data/weapons.ts). */
	w: string;
	code: string;
	/** Optional short name ("SnD sniper"). */
	name?: string;
	kind: ClassKind;
	/** When it was saved (ms). */
	at: number;
}
export interface ClassTomb {
	del: 1;
	at: number;
}
export type ClassEntry = SquadClass | ClassTomb;
/** Class id → class (or tombstone). */
export type ClassList = Record<string, ClassEntry>;

/** A game build code: a letter + 2 digits (the gun), then 1–4 groups of letters/digits. */
const CODE_RE = /^[A-Z]\d{2}(?:-[A-Z0-9]{1,6}){1,4}$/;
const CLASS_ID = /^[A-Za-z0-9_-]{4,16}$/;
const WEAPON_IDS = new Set(WEAPONS.map((w) => w.id));

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;
export const isTomb = (e: ClassEntry): e is ClassTomb => 'del' in e;

/**
 * A pasted code tidied up: capitals, no spaces, any dash-like character → "-". null when it doesn't
 * look like a game build code.
 */
export function normaliseCode(text: unknown): string | null {
	if (typeof text !== 'string') return null;
	const code = text
		.toUpperCase()
		.replace(/[‐-―−]/g, '-')
		.replace(/\s+/g, '')
		.replace(/^-+|-+$/g, '');
	return CODE_RE.test(code) ? code : null;
}

/** A class name: no control characters, spaces tidied, at most CLASS_NAME_MAX characters. */
export function cleanClassName(raw: unknown): string {
	if (typeof raw !== 'string') return '';
	// eslint-disable-next-line no-control-regex
	return [...raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()].slice(0, CLASS_NAME_MAX).join('').trim();
}

function cleanEntry(raw: unknown): ClassEntry | null {
	if (!isObject(raw) || !isTime(raw.at)) return null;
	const at = Math.round(raw.at);
	if (raw.del === 1 || raw.del === true) return { del: 1, at };
	if (typeof raw.w !== 'string' || !WEAPON_IDS.has(raw.w)) return null;
	const code = normaliseCode(raw.code);
	if (!code) return null;
	const kind = (CLASS_KINDS as readonly string[]).includes(raw.kind as string) ? (raw.kind as ClassKind) : 'mp';
	const entry: SquadClass = { w: raw.w, code, kind, at };
	const name = cleanClassName(raw.name);
	if (name) entry.name = name;
	return entry;
}

/** Newest CLASS_MAX classes and newest TOMB_MAX tombstones. */
function prune(list: ClassList): ClassList {
	const byNewest = Object.entries(list).sort(([, a], [, b]) => b.at - a.at);
	const live = byNewest.filter(([, e]) => !isTomb(e)).slice(0, CLASS_MAX);
	const tombs = byNewest.filter(([, e]) => isTomb(e)).slice(0, TOMB_MAX);
	return Object.fromEntries([...live, ...tombs]);
}

/** A stored or published list, cleaned; undefined when there's nothing in it. */
export function cleanClasses(raw: unknown): ClassList | undefined {
	if (!isObject(raw)) return undefined;
	const out: ClassList = {};
	for (const [id, entry] of Object.entries(raw)) {
		const e = CLASS_ID.test(id) ? cleanEntry(entry) : null;
		if (e) out[id] = e;
	}
	return Object.keys(out).length ? prune(out) : undefined;
}

/** The live classes, newest first. */
export function liveClasses(list: ClassList | undefined): (SquadClass & { id: string })[] {
	return Object.entries(list ?? {})
		.filter((x): x is [string, SquadClass] => !isTomb(x[1]))
		.map(([id, c]) => ({ id, ...c }))
		.sort((a, b) => b.at - a.at);
}

/** The list with a class added; null when you already have CLASS_MAX (remove one first). */
export function withClass(list: ClassList | undefined, id: string, cls: SquadClass): ClassList | null {
	if (liveClasses(list).length >= CLASS_MAX && !(list?.[id] && !isTomb(list[id]))) return null;
	return prune({ ...list, [id]: cls });
}

/** The list with a class removed (a tombstone, so your other device removes it too). */
export function withoutClass(list: ClassList | undefined, id: string, at: number): ClassList {
	return prune({ ...list, [id]: { del: 1, at } });
}

/** Two copies of the same member's list (two devices): per id, the later change wins. */
export function mergeClasses(a: ClassList | undefined, b: ClassList | undefined): ClassList {
	const out: ClassList = { ...a };
	for (const [id, e] of Object.entries(b ?? {})) {
		if (!out[id] || e.at > out[id].at) out[id] = e;
	}
	return prune(out);
}
