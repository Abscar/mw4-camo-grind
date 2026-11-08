/**
 * Pure helpers for automatic sync (sync.svelte.ts): what is shared between devices, the format
 * the sync service stores, merging two devices' changes, and sync codes/links. No browser APIs
 * and no runes, so Node tests it directly (scripts/sync.test.js).
 *
 * Shared: ticks, Mastery counts, notes, the focus list and when you last ticked.
 * Per device: theme, class filter, "hide maxed".
 */

import { MASTERY } from './data/camos.ts';
import { APP_ID, migrate, normaliseFocus, type Notes, type ProgressData } from './progress-codec.ts';

export interface SyncDoc {
	progress: ProgressData;
	notes: Notes;
	focus: string[];
	lastTickAt: string | null;
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
}

export function toWire(doc: SyncDoc): SyncWire {
	const wire: SyncWire = { app: APP_ID, sync: SYNC_FORMAT, progress: doc.progress, notes: doc.notes, focus: doc.focus };
	if (doc.lastTickAt) wire.lastTickAt = doc.lastTickAt;
	return wire;
}

/** Read a stored document (cleaned up the same way saves are), or null if it isn't ours. */
export function fromWire(raw: unknown): SyncDoc | null {
	const m = migrate(raw);
	if (!m) return null;
	const focus = typeof raw === 'object' && raw !== null ? normaliseFocus((raw as Record<string, unknown>).focus) : [];
	return { progress: m.progress, notes: m.notes ?? {}, focus, lastTickAt: m.lastTickAt ?? null };
}

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
		MASTERY.every((m) => (a.progress.mastery[m.id] ?? 0) === (b.progress.mastery[m.id] ?? 0)) &&
		keys(a.notes, b.notes).every((id) => (a.notes[id] ?? '') === (b.notes[id] ?? '')) &&
		sameList(a.focus, b.focus) &&
		(a.lastTickAt ?? '') === (b.lastTickAt ?? '')
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
	const mastery: Record<string, number> = {};
	for (const m of MASTERY) {
		mastery[m.id] = pickCount(base.progress.mastery[m.id] ?? 0, local.progress.mastery[m.id] ?? 0, remote.progress.mastery[m.id] ?? 0);
	}
	const notes: Notes = {};
	for (const id of keys(base.notes, local.notes, remote.notes)) {
		const note = pick(base.notes[id] ?? '', local.notes[id] ?? '', remote.notes[id] ?? '');
		if (note) notes[id] = note;
	}
	const focus = sameList(local.focus, base.focus) ? [...remote.focus] : [...local.focus];
	return { progress: { weapons, mastery }, notes, focus, lastTickAt: later(local.lastTickAt, remote.lastTickAt) };
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
	for (const m of MASTERY) mastery[m.id] = Math.max(local.progress.mastery[m.id] ?? 0, remote.progress.mastery[m.id] ?? 0);
	return {
		progress: { weapons, mastery },
		notes: { ...local.notes, ...remote.notes },
		focus: remote.focus.length > 0 ? [...remote.focus] : [...local.focus],
		lastTickAt: later(local.lastTickAt, remote.lastTickAt)
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
