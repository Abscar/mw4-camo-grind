/**
 * Progress changes made from the page that need a word to the user: an untick that also clears the
 * camos above it (the whole change can be undone), and a counter that reached its target and ticked
 * the step. Plain taps that do just what they show stay quiet.
 */

import { LADDER } from './data/camos.ts';
import { WEAPON_BY_ID } from './data/weapons.ts';
import { t } from './i18n/en.ts';
import { progress } from './progress.svelte.ts';
import { stepInfo, type StepKey } from './steps.ts';
import { toast } from './toast.svelte.ts';

/** A tap on a Gold / Platinum / Harmonic Break box (list, focus card or weapon card). */
export function tickLadder(weaponId: string, index: number): void {
	const r = progress.toggle(weaponId, index);
	const cleared = r.from - r.to - 1; // camos above the one you unticked
	if (cleared <= 0) return;
	const higher = LADDER.slice(index + 1, r.from).map((c) => c.name);
	const name = WEAPON_BY_ID.get(weaponId)?.name ?? weaponId;
	toast.show(t.tickToast.cleared(LADDER[index].name, name, higher.join(t.tickToast.and)), {
		label: t.toast.undo,
		run: () => progress.restore(r.before)
	});
}

/**
 * Set a counter. When it reaches the target the step is ticked: say so, with Undo (which puts the
 * tick and the old number back). Returns what the progress store returned, for the counter's own Undo.
 */
export function setStepCount(weaponId: string, key: StepKey, value: number) {
	const r = progress.setCount(weaponId, key, value);
	if (r?.completed) {
		const step = stepInfo(weaponId, key);
		const name = WEAPON_BY_ID.get(weaponId)?.name ?? weaponId;
		toast.show(t.counter.completed(step?.name ?? '', name), {
			label: t.toast.undo,
			run: () => progress.restore(r.before)
		});
	}
	return r;
}
