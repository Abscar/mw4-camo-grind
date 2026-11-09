/**
 * What just happened when you ticked a box: the Abscar theme's kill-feed rows, the shine over a
 * weapon that just got maxed, the "Divergence unlocked" flash and the news buddy cheering.
 * Only your own ticks get here (progress.toggle), never loading, importing or another tab.
 * Also plays the tick's sound effect (if sound is on).
 */

import { sound } from './sound.svelte.ts';

export interface Gain {
	id: number;
	weaponId: string;
	/** The weapon's new ladder level (1 = Gold … 3 = Harmonic Break). */
	level: number;
	/** This tick maxed the weapon. */
	maxed: boolean;
	/** This tick unlocked Divergence. */
	divergence: boolean;
}

/** How long a kill-feed row stays, and how many show at once. */
const ROW_MS = 4500;
const MAX_ROWS = 4;
/** How long the buddy cheers after a weapon is maxed. */
const CHEER_MS = 6000;

class Feed {
	/** Kill-feed rows, oldest first. */
	rows = $state<Gain[]>([]);
	/** The latest tick that maxed a weapon (its id restarts the shine on that weapon). */
	lastMaxed = $state<Gain | null>(null);
	/** The tick that unlocked Divergence, while its flash is due. */
	divergence = $state<Gain | null>(null);
	cheering = $state(false);

	#nextId = 1;
	#cheerTimer: ReturnType<typeof setTimeout> | undefined;

	gain(g: Omit<Gain, 'id'>): void {
		const row: Gain = { ...g, id: this.#nextId++ };
		this.rows = [...this.rows, row].slice(-MAX_ROWS);
		setTimeout(() => (this.rows = this.rows.filter((r) => r.id !== row.id)), ROW_MS);
		if (row.maxed) {
			this.lastMaxed = row;
			this.cheering = true;
			clearTimeout(this.#cheerTimer);
			this.#cheerTimer = setTimeout(() => (this.cheering = false), CHEER_MS);
		}
		if (row.divergence) this.divergence = row;
		sound.play(row.divergence ? 'divergence' : row.maxed ? 'maxed' : 'camo');
	}
}

export const feed = new Feed();
