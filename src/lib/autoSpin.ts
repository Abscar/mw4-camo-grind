/*
	Auto spin on every slot machine (2026-11-21, the user: "höj autospinsen … på alla slotsen", then "ba lägg till
	1000"): the counts you can pick and cleaning the one remembered per device. The run itself lives in
	autoSpin.svelte.ts, the buttons in AutoSpinControls.svelte.
*/

/** The counts you can pick (1,000 added 2026-11-21). */
export const AUTO_COUNTS = [10, 25, 50, 100, 1000] as const;
export const AUTO_DEFAULT = 25;

/** A remembered count: one of AUTO_COUNTS, anything else = the default. */
export function cleanCount(raw: unknown): number {
	const n = typeof raw === 'string' ? Number(raw) : raw;
	return typeof n === 'number' && (AUTO_COUNTS as readonly number[]).includes(n) ? n : AUTO_DEFAULT;
}
