/**
 * A joke "BANNED" stamp over a squad member's operator in the header (2026-11-16, the user's ask:
 * "a big 'banned' sign over Ingman as a joke because he typed in the wrong K/D", "that I can easily
 * remove after he's typed in correct K/D and W/L").
 *
 * JOKE_BANS puts the stamp on from the code (so everyone sees it, also visitors outside the squad).
 * Abscar (the owner) lifts it, or puts it back, with a button in the Squad tab's Combat record; that
 * choice is stored in the squad document (`bans`, squad-codec.ts) so it changes for the whole squad
 * at once. A choice made after the code's `since` wins over the code; an older one doesn't, so a new
 * joke ban in the code starts with the stamp on.
 *
 * No browser APIs and no runes, so Node tests it directly (scripts/squad-bans.test.js).
 */

export interface JokeBan {
	/** When the stamp went on (ms). */
	since: number;
	/** The small line under BANNED. */
	reason: string;
}

/** Operator id → the joke ban the code puts on. */
export const JOKE_BANS: Readonly<Record<string, JokeBan>> = {
	ingman: { since: Date.UTC(2026, 10, 16, 13, 0), reason: 'Fake K/D' }
};

/** Who may lift or put back a joke ban: the page owner's operator. */
export const BAN_OWNER = 'abscar';

export interface BanState {
	on: boolean;
	at: number;
}
/** Operator id → the latest lift / ban from the squad (squad document field `bans`). */
export type Bans = Record<string, BanState>;

const OP_ID = /^[a-z]{2,16}$/;
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

/** A stored or published `bans`, cleaned; undefined when there's nothing in it. */
export function cleanBans(raw: unknown): Bans | undefined {
	if (!isObject(raw)) return undefined;
	const out: Bans = {};
	for (const [op, s] of Object.entries(raw)) {
		if (OP_ID.test(op) && isObject(s) && typeof s.on === 'boolean' && isTime(s.at)) out[op] = { on: s.on, at: Math.round(s.at) };
	}
	return Object.keys(out).length ? out : undefined;
}

/** Whether this operator wears the stamp right now. */
export function isBanned(op: string, bans: Bans | undefined): boolean {
	const joke = JOKE_BANS[op];
	const choice = bans?.[op];
	if (choice && choice.at >= (joke?.since ?? 0)) return choice.on;
	return !!joke;
}

/**
 * The squad's `bans` with a lift (on = false) or a ban (on = true) for one operator. Written on the
 * newest copy of the squad document (a refused write is redone on the newer one), so no merge needed.
 */
export function withBan(bans: Bans | undefined, op: string, on: boolean, at: number): Bans {
	return { ...bans, [op]: { on, at } };
}
