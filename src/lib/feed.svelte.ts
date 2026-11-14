/**
 * What just happened when you ticked a box: the Abscar theme's kill-feed rows, the shine over a
 * weapon that just got maxed, the "Divergence unlocked" flash and the news buddy cheering.
 * Only your own ticks get here (progress.toggle), never loading, importing or another tab.
 * Also plays the tick's sound effect (if sound is on).
 *
 * Since 2026-11-14 the squad's news comes here too (squad.svelte.ts, squadGain / squadNuke): a
 * friend's new camo gets a kill-feed row with their name, a maxed weapon makes the buddy cheer
 * for them, and their Divergence gets the big flash ("<name> dropped a nuke"). Never your own old
 * ticks: only what's new since this device last looked at the squad.
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
	/** A squad member's name (their camo), or absent for your own tick. */
	who?: string;
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
	/** Whose Divergence the flash is for: null = yours. */
	nukeBy = $state<string | null>(null);
	cheering = $state(false);
	/** Who the buddy cheers for: null = you. */
	cheerFor = $state<string | null>(null);

	#nextId = 1;
	#cheerTimer: ReturnType<typeof setTimeout> | undefined;
	#listeners = new Set<(g: Gain) => void>();

	gain(g: Omit<Gain, 'id'>): void {
		const row = this.#row(g);
		if (row.maxed) {
			this.lastMaxed = row;
			this.#cheer(null);
		}
		if (row.divergence) {
			this.nukeBy = null;
			this.divergence = row;
		}
		sound.play(row.divergence ? 'divergence' : row.maxed ? 'maxed' : 'camo');
		for (const fn of this.#listeners) fn(row);
	}

	/** A squad member's new camo (no shine on your own weapon row, no sound for each one). */
	squadGain(who: string, weaponId: string, level: number, maxed: boolean): void {
		this.#row({ weaponId, level, maxed, divergence: false, who });
		if (maxed) this.#cheer(who);
	}

	/** A squad member unlocked Divergence: the big flash, with their name. */
	squadNuke(who: string): void {
		this.nukeBy = who;
		this.divergence = { id: this.#nextId++, weaponId: '', level: 3, maxed: true, divergence: true, who };
		this.#cheer(who);
		sound.play('divergence');
	}

	/** Your own ticks as they happen (the squad radio posts the big ones). */
	onGain(fn: (g: Gain) => void): () => void {
		this.#listeners.add(fn);
		return () => this.#listeners.delete(fn);
	}

	#row(g: Omit<Gain, 'id'>): Gain {
		const row: Gain = { ...g, id: this.#nextId++ };
		this.rows = [...this.rows, row].slice(-MAX_ROWS);
		setTimeout(() => (this.rows = this.rows.filter((r) => r.id !== row.id)), ROW_MS);
		return row;
	}

	#cheer(who: string | null): void {
		this.cheerFor = who;
		this.cheering = true;
		clearTimeout(this.#cheerTimer);
		this.#cheerTimer = setTimeout(() => (this.cheering = false), CHEER_MS);
	}
}

export const feed = new Feed();
