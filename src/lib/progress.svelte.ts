/**
 * Progress state (Svelte 5 runes), the ladder rules, and saving/loading.
 * Pure format helpers (migration, export file, progress link) live in progress-codec.ts.
 */

import {
	ALL_MASTERY,
	DIVERGENCE_REQUIRED,
	LADDER,
	MASTERY_TRACKS,
	MAX_LEVEL,
	SEASON_1_COUNTS_TOWARD_DIVERGENCE,
	type MasteryMode,
	type MasteryStatus
} from './data/camos.ts';
import { WEAPONS } from './data/weapons.ts';
import { feed } from './feed.svelte.ts';
import {
	CURRENT_VERSION,
	FOCUS_MAX,
	SPECIALS_ALL,
	clampCount,
	cleanNote,
	defaultPrefs,
	defaultProgress,
	mergeStamps,
	migrate,
	resetProgress,
	toExport,
	toStored,
	type Migrated,
	type Notes,
	type Prefs,
	type ProgressData,
	type Stamps
} from './progress-codec.ts';
import type { SyncDoc } from './sync-codec.ts';
import { countKey, pruneCounts, stepInfo, type StepKey } from './steps.ts';

/** Where progress lives in the browser. Bump the version (and extend `migrate`) when the shape changes. */
export const STORAGE_KEY = 'mw4-camo-grind:v2';
/** The old single-file tracker's key. Read once to bring ticks over; never written or deleted. */
export const LEGACY_KEY = 'mw4-camo-grind-v1';

function readStorage(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeStorage(key: string, value: string): boolean {
	try {
		localStorage.setItem(key, value);
		return true;
	} catch {
		return false;
	}
}

/** Keep a copy of data we couldn't use, so nothing is ever silently thrown away. */
function backup(raw: string, reason: string): void {
	writeStorage(`${STORAGE_KEY}:backup:${reason}:${Date.now()}`, raw);
}

export type LoadResult = 'fresh' | 'loaded' | 'migrated-v1' | 'unreadable';

/** Everything about one weapon a tap or a counter can change, so Undo can put all of it back. */
export interface WeaponState {
	weaponId: string;
	level: number;
	specials: number;
	stamps: number[] | undefined;
	counts: Record<string, number>;
}

/** What a tap on a ladder box did: the state before it, and which camos it took away. */
export interface ToggleResult {
	before: WeaponState;
	from: number;
	to: number;
}

/** What a counter change did. 'completed' = it reached the target and ticked the step. */
export interface CountResult {
	before: WeaponState;
	value: number;
	completed: boolean;
}

class Progress {
	weapons = $state<Record<string, number>>(defaultProgress().weapons);
	mastery = $state<Record<string, number>>(defaultProgress().mastery);
	/** Ticked Special camos (before Gold) per weapon, as bits (progress-codec.ts). */
	specials = $state<Record<string, number>>({});
	/** When each ladder camo was ticked, for the grind stats (stats.ts). */
	stamps = $state<Stamps>({});
	/** Counters toward the steps you're on ("<weapon id>:<step>" → count; rules in steps.ts). */
	counts = $state<Record<string, number>>({});
	prefs = $state<Prefs>(defaultPrefs());
	/** The user's own notes per weapon. Not part of progress links (too long), but in backups. */
	notes = $state<Notes>({});
	/** When a tick last added a camo (ISO), or null if not known. */
	lastTickAt = $state<string | null>(null);
	/** When the saved data was written, as read at load (stands in for lastTickAt on older saves). */
	#loadedSavedAt: string | null = null;

	/** True once saved progress has been read in the browser. */
	ready = $state(false);
	/** False when the browser refuses to store anything (private mode, full storage). */
	canSave = $state(true);

	/** Per ladder camo: how many weapons have it. */
	ladderCounts = $derived(
		LADDER.map((_, i) => WEAPONS.filter((w) => (this.weapons[w.id] ?? 0) > i).length)
	);

	/** Harmonic Breaks that count toward Divergence. */
	divergenceCount = $derived(
		WEAPONS.filter(
			(w) =>
				(this.weapons[w.id] ?? 0) >= MAX_LEVEL &&
				(SEASON_1_COUNTS_TOWARD_DIVERGENCE || w.season === 'launch')
		).length
	);

	divergenceUnlocked = $derived(this.divergenceCount >= DIVERGENCE_REQUIRED);

	/**
	 * Per mode (Multiplayer, Warzone, DMZ): Mastery runs in order, each one is Active only once the
	 * previous one is Complete. Divergence opens the first camo of every mode.
	 */
	masteryByMode = $derived.by(() => {
		const out = {} as Record<MasteryMode, MasteryStatus[]>;
		for (const track of MASTERY_TRACKS) {
			let previousDone = this.divergenceUnlocked;
			out[track.mode] = track.camos.map((m) => {
				const status: MasteryStatus = !previousDone
					? 'locked'
					: (this.mastery[m.id] ?? 0) >= m.target
						? 'complete'
						: 'active';
				previousDone = status === 'complete';
				return status;
			});
		}
		return out;
	});

	/** Multiplayer's Mastery statuses (the HUD's next target). */
	masteryStatus = $derived(this.masteryByMode.mp);

	level(weaponId: string): number {
		return this.weapons[weaponId] ?? 0;
	}

	has(weaponId: string, ladderIndex: number): boolean {
		return this.level(weaponId) > ladderIndex;
	}

	/**
	 * Ladder rule: ticking a camo also ticks everything below it;
	 * unticking a camo also clears everything above it.
	 */
	toggle(weaponId: string, ladderIndex: number): ToggleResult {
		const state = this.capture(weaponId);
		this.#setLevel(weaponId, this.has(weaponId, ladderIndex) ? ladderIndex : ladderIndex + 1);
		this.save();
		return { before: state, from: state.level, to: this.level(weaponId) };
	}

	/** Set a weapon's ladder level as your own tap: tick times, counters, and the kill feed on a gain. */
	#setLevel(weaponId: string, next: number): void {
		const before = this.level(weaponId);
		const divergenceBefore = this.divergenceUnlocked;
		this.weapons[weaponId] = next;
		const after = this.level(weaponId);
		this.#stamp(weaponId, before, after);
		this.counts = pruneCounts(this.counts, this.weapons, this.specials);
		if (after > before) {
			this.lastTickAt = new Date().toISOString();
			feed.gain({
				weaponId,
				level: after,
				maxed: after >= MAX_LEVEL,
				divergence: !divergenceBefore && this.divergenceUnlocked
			});
		}
	}

	/** One weapon's ticks, before-Gold ticks, tick times and counters, for Undo. */
	capture(weaponId: string): WeaponState {
		const prefix = `${weaponId}:`;
		return {
			weaponId,
			level: this.level(weaponId),
			specials: this.specials[weaponId] ?? 0,
			stamps: this.stamps[weaponId] ? [...this.stamps[weaponId]] : undefined,
			counts: Object.fromEntries(Object.entries(this.counts).filter(([k]) => k.startsWith(prefix)))
		};
	}

	/** Put one weapon back the way `capture` saw it (Undo). Never feeds the kill feed. */
	restore(state: WeaponState): void {
		const id = state.weaponId;
		this.weapons[id] = state.level;
		const specials = { ...this.specials };
		if (state.specials) specials[id] = state.specials;
		else delete specials[id];
		this.specials = specials;
		const stamps = { ...this.stamps };
		if (state.stamps) stamps[id] = [...state.stamps];
		else delete stamps[id];
		this.stamps = stamps;
		const prefix = `${id}:`;
		this.counts = {
			...Object.fromEntries(Object.entries(this.counts).filter(([k]) => !k.startsWith(prefix))),
			...state.counts
		};
		this.save();
	}

	/** How far a step's counter is (0 when it has none). */
	count(weaponId: string, key: StepKey): number {
		return this.counts[countKey(weaponId, key)] ?? 0;
	}

	/**
	 * Set a step's counter (direct input, +1 / −1, bigger steps). Reaching the target ticks the step
	 * (the ladder rule fills the camos below it) and clears the counter, see steps.ts. Returns null
	 * when nothing changed (a done step, a step without a counter, the same number).
	 */
	setCount(weaponId: string, key: StepKey, value: number): CountResult | null {
		const step = stepInfo(weaponId, key);
		if (!step || step.target === 0 || !Number.isFinite(value)) return null;
		const done = step.kind === 'special' ? this.special(weaponId, step.index) : this.has(weaponId, step.index);
		if (done) return null;
		const next = Math.max(0, Math.min(step.target, Math.trunc(value)));
		const k = countKey(weaponId, key);
		if (next === (this.counts[k] ?? 0)) return null;
		const before = this.capture(weaponId);
		if (next >= step.target) {
			const counts = { ...this.counts };
			delete counts[k];
			this.counts = counts;
			if (step.kind === 'special') this.specials = { ...this.specials, [weaponId]: ((this.specials[weaponId] ?? 0) | (1 << step.index)) & SPECIALS_ALL };
			else this.#setLevel(weaponId, step.index + 1);
		} else {
			const counts = { ...this.counts };
			if (next > 0) counts[k] = next;
			else delete counts[k];
			this.counts = counts;
		}
		this.save();
		return { before, value: next, completed: next >= step.target };
	}

	/** Note when the camos a tap added were ticked; a camo the tap took away loses its time. */
	#stamp(weaponId: string, before: number, after: number): void {
		const times = (this.stamps[weaponId] ?? []).slice(0, after);
		for (let i = 0; i < after; i++) times[i] = i >= before ? Date.now() : (times[i] ?? 0);
		const next = { ...this.stamps };
		if (times.some(Boolean)) next[weaponId] = times;
		else delete next[weaponId];
		this.stamps = next;
	}

	/** A Special camo (before Gold) is done when it is ticked, or when the weapon has Gold. */
	special(weaponId: string, index: number): boolean {
		return this.level(weaponId) >= 1 || (((this.specials[weaponId] ?? 0) >> index) & 1) === 1;
	}

	/** How many of the weapon's `total` Special camos are done. */
	specialsDone(weaponId: string, total: number): number {
		let n = 0;
		for (let i = 0; i < total; i++) if (this.special(weaponId, i)) n++;
		return n;
	}

	/**
	 * Tick or untick a Special camo. Not while the weapon has Gold (they all count as done then;
	 * untick Gold first). Returns the new state, or null when nothing changed.
	 */
	toggleSpecial(weaponId: string, index: number): boolean | null {
		if (this.level(weaponId) >= 1 || index < 0 || index > 2) return null;
		const mask = ((this.specials[weaponId] ?? 0) ^ (1 << index)) & SPECIALS_ALL;
		const next = { ...this.specials };
		if (mask) next[weaponId] = mask;
		else delete next[weaponId];
		this.specials = next;
		this.counts = pruneCounts(this.counts, this.weapons, this.specials); // a ticked one has no counter
		this.save();
		return ((mask >> index) & 1) === 1;
	}

	/** When you last added a camo, as far as we know (ISO), or null. */
	lastActiveAt(): string | null {
		return this.lastTickAt ?? this.#loadedSavedAt;
	}

	note(weaponId: string): string {
		return this.notes[weaponId] ?? '';
	}

	setNote(weaponId: string, text: string): void {
		const note = cleanNote(text);
		const next = { ...this.notes };
		if (note === '') delete next[weaponId];
		else next[weaponId] = note;
		this.notes = next;
		this.save();
	}

	/** Replace every note (import, undo). */
	setNotes(notes: Notes): void {
		this.notes = { ...notes };
		this.save();
	}

	isFocused(weaponId: string): boolean {
		return this.prefs.focus.includes(weaponId);
	}

	/** Pin or unpin a weapon on the focus list. 'full' means it holds FOCUS_MAX already. */
	toggleFocus(weaponId: string): 'added' | 'removed' | 'full' {
		const focus = this.prefs.focus;
		if (focus.includes(weaponId)) {
			this.setPref('focus', focus.filter((id) => id !== weaponId));
			return 'removed';
		}
		if (focus.length >= FOCUS_MAX) return 'full';
		this.setPref('focus', [...focus, weaponId]);
		return 'added';
	}

	setMastery(id: string, value: number): void {
		const m = ALL_MASTERY.find((x) => x.id === id);
		if (!m) return;
		this.mastery[id] = clampCount(value, m.target);
		this.save();
	}

	setPref<K extends keyof Prefs>(key: K, value: Prefs[K]): void {
		this.prefs[key] = value;
		this.save();
	}

	/** Every Mastery count of every mode (0 where nothing is saved yet). */
	#masteryCounts(): Record<string, number> {
		return Object.fromEntries(ALL_MASTERY.map((m) => [m.id, this.mastery[m.id] ?? 0]));
	}

	snapshot(): ProgressData {
		return {
			weapons: { ...this.weapons },
			mastery: this.#masteryCounts(),
			specials: { ...this.specials },
			counts: { ...this.counts }
		};
	}

	/** What automatic sync shares with your other devices (sync-codec.ts). */
	syncDoc(): SyncDoc {
		return {
			progress: this.snapshot(),
			notes: { ...this.notes },
			focus: [...this.prefs.focus],
			lastTickAt: this.lastTickAt,
			stamps: { ...this.stamps }
		};
	}

	/**
	 * Take what automatic sync brought from another device. Like import and links, this never
	 * feeds the kill feed or the Divergence flash (only your own taps do).
	 */
	applySynced(doc: SyncDoc): void {
		this.weapons = { ...doc.progress.weapons };
		this.mastery = { ...this.#masteryCounts(), ...doc.progress.mastery };
		if (doc.progress.specials) this.specials = { ...doc.progress.specials };
		this.counts = pruneCounts(doc.progress.counts ?? this.counts, this.weapons, this.specials);
		this.stamps = mergeStamps(this.weapons, doc.stamps);
		this.notes = { ...doc.notes };
		this.prefs = { ...this.prefs, focus: [...doc.focus] };
		if (doc.lastTickAt) this.lastTickAt = doc.lastTickAt;
		this.save();
	}

	/** Run `fn` after every save (automatic sync listens). Returns a function that stops it. */
	onSaved(fn: () => void): () => void {
		this.#onSaved.add(fn);
		return () => this.#onSaved.delete(fn);
	}

	#onSaved = new Set<() => void>();

	/**
	 * Replace all progress (import, link, reset, undo). Returns what was there before, for Undo.
	 * Data without Special camos or Warzone/DMZ counts (older backups and links) leaves those alone.
	 */
	replace(next: ProgressData): ProgressData {
		const before = this.snapshot();
		this.weapons = { ...next.weapons };
		this.mastery = { ...before.mastery, ...next.mastery };
		if (next.specials) this.specials = { ...next.specials };
		this.counts = pruneCounts(next.counts ?? this.counts, this.weapons, this.specials);
		this.stamps = mergeStamps(this.weapons, this.stamps);
		this.save();
		return before;
	}

	/** 'zero' = nothing at all (how a new tracker starts); 'preset' = Gold on every launch weapon. */
	reset(kind: 'preset' | 'zero' = 'zero'): ProgressData {
		return this.replace(resetProgress(kind));
	}

	isDefault(): boolean {
		const d = defaultProgress();
		return (
			WEAPONS.every((w) => this.level(w.id) === d.weapons[w.id]) &&
			ALL_MASTERY.every((m) => (this.mastery[m.id] ?? 0) === 0) &&
			Object.keys(this.specials).length === 0 &&
			Object.keys(this.counts).length === 0
		);
	}

	exportJson(): string {
		return JSON.stringify(toExport(this.snapshot(), { ...this.notes }), null, 2);
	}

	save(): void {
		if (!this.ready) return; // never overwrite saved data before it has been read
		const stored = toStored(
			this.snapshot(),
			{ ...this.prefs, focus: [...this.prefs.focus] },
			{ notes: { ...this.notes }, lastTickAt: this.lastTickAt, stamps: { ...this.stamps } }
		);
		this.canSave = writeStorage(STORAGE_KEY, JSON.stringify(stored));
		for (const fn of this.#onSaved) fn();
	}

	/** Read saved progress (or the old tracker's) from the browser. Call once, in the browser. */
	load(): LoadResult {
		const result = this.#read();
		this.ready = true;
		if (result === 'migrated-v1') this.save();
		else this.canSave = writeStorage(`${STORAGE_KEY}:probe`, '1');
		try {
			localStorage.removeItem(`${STORAGE_KEY}:probe`);
		} catch {
			// nothing to clean up
		}
		return result;
	}

	#read(): LoadResult {
		const raw = readStorage(STORAGE_KEY);
		if (raw !== null) {
			const migrated = migrate(safeParse(raw));
			if (!migrated) {
				backup(raw, 'unreadable');
				return 'unreadable';
			}
			// Saved by a newer version of the app: use what we understand, but keep the original.
			if (migrated.from > CURRENT_VERSION) backup(raw, `v${migrated.from}`);
			this.#apply(migrated);
			return 'loaded';
		}

		const legacy = readStorage(LEGACY_KEY);
		if (legacy !== null) {
			const migrated = migrate(safeParse(legacy));
			if (migrated) {
				this.#apply(migrated);
				return 'migrated-v1';
			}
		}
		return 'fresh';
	}

	#apply(m: Migrated): void {
		this.weapons = m.progress.weapons;
		this.mastery = { ...this.#masteryCounts(), ...m.progress.mastery };
		if (m.progress.specials) this.specials = m.progress.specials;
		if (m.progress.counts) this.counts = pruneCounts(m.progress.counts, m.progress.weapons, this.specials);
		if (m.stamps) this.stamps = mergeStamps(m.progress.weapons, m.stamps);
		if (m.prefs) this.prefs = m.prefs;
		if (m.notes) this.notes = m.notes;
		if (m.lastTickAt) this.lastTickAt = m.lastTickAt;
		if (m.savedAt) this.#loadedSavedAt = m.savedAt;
	}

	/** Keep several open tabs in step. Returns a function that stops listening. */
	followOtherTabs(): () => void {
		const onStorage = (e: StorageEvent) => {
			if (e.key !== STORAGE_KEY || e.newValue === null) return;
			const migrated = migrate(safeParse(e.newValue));
			if (migrated) this.#apply(migrated);
		};
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}
}

function safeParse(raw: string): unknown {
	try {
		return JSON.parse(raw);
	} catch {
		return undefined;
	}
}

export const progress = new Progress();
