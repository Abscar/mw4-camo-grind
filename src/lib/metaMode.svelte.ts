/**
 * Multiplayer or Warzone for the meta boxes: "Absolute meta" (MetaPodium) and "Meta top 5" (MetaSection)
 * share one switch, so they never show different modes. Remembered on this device under
 * `mw4-camo-grind:meta` (the key Meta top 5 has used since 2026-11-10). The prerendered page shows
 * Multiplayer; the saved choice is read after load (`load()`, from a component's onMount).
 */
import type { LoadoutMode } from './data/loadouts.ts';

const STORE_KEY = 'mw4-camo-grind:meta';

class MetaMode {
	mode = $state<LoadoutMode>('mp');
	#loaded = false;

	load(): void {
		if (this.#loaded) return;
		this.#loaded = true;
		try {
			const saved = localStorage.getItem(STORE_KEY);
			if (saved === 'mp' || saved === 'wz') this.mode = saved;
		} catch {
			// storage blocked: start on Multiplayer every time
		}
	}

	set(m: LoadoutMode): void {
		this.mode = m;
		try {
			localStorage.setItem(STORE_KEY, m);
		} catch {
			// not remembered, still switches
		}
	}
}

export const metaMode = new MetaMode();
