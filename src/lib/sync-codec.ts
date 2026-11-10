/**
 * Pure helpers for automatic sync (sync.svelte.ts): what is shared between devices, the format
 * the sync service stores, merging two devices' changes, and sync codes/links. No browser APIs
 * and no runes, so Node tests it directly (scripts/sync.test.js).
 *
 * Shared: ticks, Mastery counts, notes, the focus list and when you last ticked.
 * Per device: theme, class filter, "hide maxed".
 */

import { ALL_MASTERY } from './data/camos.ts';
import {
	APP_ID,
	mergeStamps,
	migrate,
	normaliseFocus,
	type Notes,
	type ProgressData,
	type Stamps
} from './progress-codec.ts';

export interface SyncDoc {
	/** Includes the Special camos (before Gold) since 2026-11-08. */
	progress: ProgressData;
	notes: Notes;
	focus: string[];
	lastTickAt: string | null;
	/** When each camo was ticked (grind stats). Optional so older documents still read. */
	stamps?: Stamps;
}

/** Format of the document the sync service keeps (bump + extend fromWire if it changes). */
export const SYNC_FORMAT = 1;

export interface SyncWire {
	app: typeof APP_ID;
	sync: typeof SYNC_FORMAT;
	progress: ProgressData;
	notes: Notes;
	focus: string[];
	lastTickAt?: string;
	stamps?: Stamps;
}

export function toWire(doc: SyncDoc): SyncWire {
	const wire: SyncWire = { app: APP_ID, sync: SYNC_FORMAT, progress: doc.progress, notes: doc.notes, focus: doc.focus };
	if (doc.lastTickAt) wire.lastTickAt = doc.lastTickAt;
	if (doc.stamps && Object.keys(doc.stamps).length > 0) wire.stamps = doc.stamps;
	return wire;
}

/** Read a stored document (cleaned up the same way saves are), or null if it isn't ours. */
export function fromWire(raw: unknown): SyncDoc | null {
	const m = migrate(raw);
	if (!m) return null;
	const focus = typeof raw === 'object' && raw !== null ? normaliseFocus((raw as Record<string, unknown>).focus) : [];
	return {
		progress: m.progress,
		notes: m.notes ?? {},
		focus,
		lastTickAt: m.lastTickAt ?? null,
		stamps: mergeStamps(m.progress.weapons, m.stamps)
	};
}

const specialsOf = (d: SyncDoc) => d.progress.specials ?? {};

const keys = (...objects: Record<string, unknown>[]) => [...new Set(objects.flatMap((o) => Object.keys(o)))];
const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

function later(a: string | null, b: string | null): string | null {
	if (!a) return b;
	if (!b) return a;
	return Date.parse(a) >= Date.parse(b) ? a : b;
}

export function sameDoc(a: SyncDoc, b: SyncDoc): boolean {
	return (
		keys(a.progress.weapons, b.progress.weapons).every((id) => (a.progress.weapons[id] ?? 0) === (b.progress.weapons[id] ?? 0)) &&
		ALL_MASTERY.every((m) => (a.progress.mastery[m.id] ?? 0) === (b.progress.mastery[m.id] ?? 0)) &&
		keys(specialsOf(a), specialsOf(b)).every((id) => (specialsOf(a)[id] ?? 0) === (specialsOf(b)[id] ?? 0)) &&
		keys(a.notes, b.notes).every((id) => (a.notes[id] ?? '') === (b.notes[id] ?? '')) &&
		sameList(a.focus, b.focus) &&
		(a.lastTickAt ?? '') === (b.lastTickAt ?? '') &&
		JSON.stringify(mergeStamps(a.progress.weapons, a.stamps)) === JSON.stringify(mergeStamps(b.progress.weapons, b.stamps))
	);
}

/**
 * Three-way merge: `base` is what both devices last agreed on. Anything only one side changed
 * is taken from that side. When both changed the same thing: the higher tick / Mastery count
 * wins (a grind only goes up, so no progress is lost), and for a note this device (`local`, the
 * one in the user's hand) wins. Works per weapon, per Mastery camo and per note.
 */
export function merge3(base: SyncDoc, local: SyncDoc, remote: SyncDoc): SyncDoc {
	const pick = <T>(b: T, l: T, r: T): T => (l === b ? r : l);
	const pickCount = (b: number, l: number, r: number) => (l === b ? r : r === b ? l : Math.max(l, r));

	const weapons: Record<string, number> = {};
	for (const id of keys(base.progress.weapons, local.progress.weapons, remote.progress.weapons)) {
		weapons[id] = pickCount(base.progress.weapons[id] ?? 0, local.progress.weapons[id] ?? 0, remote.progress.weapons[id] ?? 0);
	}
	// A side without a count (a device still on the page from before Warzone/DMZ Mastery) changed nothing
	const mastery: Record<string, number> = {};
	for (const m of ALL_MASTERY) {
		const b = base.progress.mastery[m.id] ?? 0;
		mastery[m.id] = pickCount(b, local.progress.mastery[m.id] ?? b, remote.progress.mastery[m.id] ?? b);
	}
	// Special camos: one-sided changes win; both changed → every tick either side has
	const specials: Record<string, number> = {};
	const [bs, ls, rs] = [specialsOf(base), specialsOf(local), specialsOf(remote)];
	for (const id of keys(bs, ls, rs)) {
		const [b, l, r] = [bs[id] ?? 0, ls[id] ?? 0, rs[id] ?? 0];
		const mask = l === b ? r : r === b ? l : l | r;
		if (mask) specials[id] = mask;
	}
	const notes: Notes = {};
	for (const id of keys(base.notes, local.notes, remote.notes)) {
		const note = pick(base.notes[id] ?? '', local.notes[id] ?? '', remote.notes[id] ?? '');
		if (note) notes[id] = note;
	}
	const focus = sameList(local.focus, base.focus) ? [...remote.focus] : [...local.focus];
	return {
		progress: { weapons, mastery, specials },
		notes,
		focus,
		lastTickAt: later(local.lastTickAt, remote.lastTickAt),
		stamps: mergeStamps(weapons, local.stamps, remote.stamps)
	};
}

/**
 * Joining a sync link on a device that already has its own ticks (no shared history yet):
 * keep the higher tick of every weapon and the higher Mastery count, so no progress is lost.
 * Notes from both are kept (the synced one wins if both have a note for the same weapon).
 */
export function combine(local: SyncDoc, remote: SyncDoc): SyncDoc {
	const weapons: Record<string, number> = {};
	for (const id of keys(local.progress.weapons, remote.progress.weapons)) {
		weapons[id] = Math.max(local.progress.weapons[id] ?? 0, remote.progress.weapons[id] ?? 0);
	}
	const mastery: Record<string, number> = {};
	for (const m of ALL_MASTERY) mastery[m.id] = Math.max(local.progress.mastery[m.id] ?? 0, remote.progress.mastery[m.id] ?? 0);
	const specials: Record<string, number> = {};
	for (const id of keys(specialsOf(local), specialsOf(remote))) {
		const mask = (specialsOf(local)[id] ?? 0) | (specialsOf(remote)[id] ?? 0);
		if (mask) specials[id] = mask;
	}
	return {
		progress: { weapons, mastery, specials },
		notes: { ...local.notes, ...remote.notes },
		focus: remote.focus.length > 0 ? [...remote.focus] : [...local.focus],
		lastTickAt: later(local.lastTickAt, remote.lastTickAt),
		stamps: mergeStamps(weapons, local.stamps, remote.stamps)
	};
}

// ---------------------------------------------------------------------------------------------
// Sync codes and links: "<site>#sync=<code>", code = 22 base64url characters (128 random bits).

const CODE = /^[A-Za-z0-9_-]{22,64}$/;

export function isSyncCode(code: string): boolean {
	return CODE.test(code);
}

export function makeSyncCode(): string {
	const bytes = new Uint8Array(16);
	globalThis.crypto.getRandomValues(bytes);
	let binary = '';
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** The sync code in an address hash like "#sync=…" (or "…&sync=…"). */
export function syncCodeFromHash(hash: string): string | null {
	const match = /(?:^#|&)sync=([A-Za-z0-9_-]+)/.exec(hash);
	return match && isSyncCode(match[1]) ? match[1] : null;
}

/** A pasted sync link, or just its code. */
export function syncCodeFromText(text: string): string | null {
	const trimmed = text.trim();
	if (isSyncCode(trimmed)) return trimmed;
	const match = /[#&]sync=([A-Za-z0-9_-]+)/.exec(trimmed);
	return match && isSyncCode(match[1]) ? match[1] : null;
}
