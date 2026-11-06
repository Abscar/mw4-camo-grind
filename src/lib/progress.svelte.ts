/**
 * Progress state (Svelte 5 runes), the ladder rules, and saving/loading.
 * Pure format helpers (migration, export file, progress link) live in progress-codec.ts.
 */

import {
	DIVERGENCE_REQUIRED,
	LADDER,
	MASTERY,
	MAX_LEVEL,
	SEASON_1_COUNTS_TOWARD_DIVERGENCE,
	type MasteryStatus
} from './data/camos.ts';
import { WEAPONS } from './data/weapons.ts';
import {
	CURRENT_VERSION,
	clampCount,
	defaultPrefs,
	defaultProgress,
	migrate,
	toExport,
	toStored,
	type Migrated,
	type Prefs,
	type ProgressData
} from './progress-codec.ts';

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

class Progress {
	weapons = $state<Record<string, number>>(defaultProgress().weapons);
	mastery = $state<Record<string, number>>(defaultProgress().mastery);
	prefs = $state<Prefs>(defaultPrefs());

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

	/** Mastery runs in order: each one is Active only once the previous one is Complete. */
	masteryStatus = $derived.by((): MasteryStatus[] => {
		let previousDone = this.divergenceUnlocked;
		return MASTERY.map((m) => {
			const status: MasteryStatus = !previousDone
				? 'locked'
				: (this.mastery[m.id] ?? 0) >= m.target
					? 'complete'
					: 'active';
			previousDone = status === 'complete';
			return status;
		});
	});

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
	toggle(weaponId: string, ladderIndex: number): void {
		this.weapons[weaponId] = this.has(weaponId, ladderIndex) ? ladderIndex : ladderIndex + 1;
		this.save();
	}

	setMastery(id: string, value: number): void {
		const m = MASTERY.find((x) => x.id === id);
		if (!m) return;
		this.mastery[id] = clampCount(value, m.target);
		this.save();
	}

	setPref<K extends keyof Prefs>(key: K, value: Prefs[K]): void {
		this.prefs[key] = value;
		this.save();
	}

	snapshot(): ProgressData {
		return { weapons: { ...this.weapons }, mastery: { ...this.mastery } };
	}

	/** Replace all progress (import, link, reset, undo). Returns what was there before, for Undo. */
	replace(next: ProgressData): ProgressData {
		const before = this.snapshot();
		this.weapons = { ...next.weapons };
		this.mastery = { ...next.mastery };
		this.save();
		return before;
	}

	reset(): ProgressData {
		return this.replace(defaultProgress());
	}

	isDefault(): boolean {
		const d = defaultProgress();
		return (
			WEAPONS.every((w) => this.level(w.id) === d.weapons[w.id]) &&
			MASTERY.every((m) => (this.mastery[m.id] ?? 0) === 0)
		);
	}

	exportJson(): string {
		return JSON.stringify(toExport(this.snapshot()), null, 2);
	}

	save(): void {
		if (!this.ready) return; // never overwrite saved data before it has been read
		const stored = toStored(this.snapshot(), { ...this.prefs });
		this.canSave = writeStorage(STORAGE_KEY, JSON.stringify(stored));
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
		this.mastery = m.progress.mastery;
		if (m.prefs) this.prefs = m.prefs;
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
