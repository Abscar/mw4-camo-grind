/**
 * Which parts of the page this device hides (2026-11-20, the "Hide" buttons; the list of parts is in
 * hideSections.ts). Saved under `mw4-camo-grind:hidden` as a JSON list of ids, per device: not in saves,
 * backups, links or sync. A hidden part is only `hidden` in the page, never removed, so whatever it runs
 * (sync, the squad, news) keeps going.
 *
 * Read in +page.svelte's onMount before progress.load(), so it lands in the same update that fades the
 * page in (no flash of hidden parts) and the prerendered page still shows everything.
 */
import { SvelteSet } from 'svelte/reactivity';
import { cleanHidden, type HideId } from './hideSections.ts';

const KEY = 'mw4-camo-grind:hidden';

class Hidden {
	readonly ids = new SvelteSet<HideId>();
	/** the "What to show" list (HiddenBar), also opened from the theme menu */
	listOpen = $state(false);

	load(): void {
		try {
			const raw = localStorage.getItem(KEY);
			this.#put(raw ? cleanHidden(JSON.parse(raw)) : []);
		} catch {
			// blocked storage or junk: show everything
		}
	}

	is(id: HideId): boolean {
		return this.ids.has(id);
	}

	get count(): number {
		return this.ids.size;
	}

	set(id: HideId, hide: boolean): void {
		if (hide) this.ids.add(id);
		else this.ids.delete(id);
		this.#save();
	}

	/** Replace the whole list (a preset, "Show all", or Undo). */
	replace(ids: readonly HideId[]): void {
		this.#put(cleanHidden(ids));
		this.#save();
	}

	list(): HideId[] {
		return cleanHidden([...this.ids]);
	}

	#put(ids: HideId[]): void {
		this.ids.clear();
		for (const id of ids) this.ids.add(id);
	}

	#save(): void {
		try {
			const ids = this.list();
			if (ids.length) localStorage.setItem(KEY, JSON.stringify(ids));
			else localStorage.removeItem(KEY);
		} catch {
			// not remembered, still hidden for this visit
		}
	}
}

export const hidden = new Hidden();
