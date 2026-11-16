/**
 * The "BANNED" stamp over a squad member's operator in the header (2026-11-16).
 *
 * Two ways onto it:
 * - a joke ban in the code (JOKE_BANS; the user's first ask: "a big 'banned' sign over Ingman as a
 *   joke because he typed in the wrong K/D"), so everyone sees it, also visitors outside the squad;
 * - a fake K/D (the user's next ask: "anything over 2.5 is a lie and then you get the sign"): whoever's
 *   latest K/D in the Combat record (squad-combat.ts, Multiplayer or Warzone) is over KD_LIMIT wears
 *   it, and it comes off by itself once they save a K/D that isn't.
 *
 * Abscar (the owner) lifts it, or puts it back, with a button in the Squad tab's Combat record ("that
 * I can easily remove after he's typed in correct K/D and W/L"); that choice is stored in the squad
 * document (`bans`, squad-codec.ts) so it changes for the whole squad at once. A choice wins over
 * whatever was there when it was made: over the joke ban's `since` and over the fake K/D's update. A
 * newer fake K/D update after a lift puts the stamp back on.
 *
 * Keys are the member's header operator ("ingman") when they picked one, otherwise their member id.
 *
 * No browser APIs and no runes, so Node tests it directly (scripts/squad-bans.test.js).
 */

import { combatView, COMBAT_MODES, type CombatLog } from './squad-combat.ts';

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

/** A K/D over this is a lie (the user, 2026-11-16: "anything over 2.5"). */
export const KD_LIMIT = 2.5;
export const FAKE_KD_REASON = 'Fake K/D';

/** Who may lift or put back a ban: the page owner's operator. */
export const BAN_OWNER = 'abscar';

export interface BanState {
	on: boolean;
	at: number;
}
/** Operator id or member id → the latest lift / ban from the squad (squad document field `bans`). */
export type Bans = Record<string, BanState>;

const BAN_KEY = /^[A-Za-z0-9_-]{2,32}$/;
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

/** A stored or published `bans`, cleaned; undefined when there's nothing in it. */
export function cleanBans(raw: unknown): Bans | undefined {
	if (!isObject(raw)) return undefined;
	const out: Bans = {};
	for (const [key, s] of Object.entries(raw)) {
		if (BAN_KEY.test(key) && isObject(s) && typeof s.on === 'boolean' && isTime(s.at)) out[key] = { on: s.on, at: Math.round(s.at) };
	}
	return Object.keys(out).length ? out : undefined;
}

/**
 * Their fake K/D: the highest latest K/D over KD_LIMIT (Multiplayer or Warzone) and when it was
 * saved; null when no latest K/D is over it. Rounded to two decimals like the board shows it, so
 * 2.501 (shown "2.50") isn't a lie.
 */
export function fakeKd(combat: CombatLog | undefined): { kd: number; at: number } | null {
	let out: { kd: number; at: number } | null = null;
	for (const mode of COMBAT_MODES) {
		const view = combatView(combat, mode);
		if (!view || view.kd === null) continue;
		const kd = Math.round(view.kd * 100) / 100;
		if (kd > KD_LIMIT && (!out || kd > out.kd)) out = { kd, at: view.latest.at };
	}
	return out;
}

export interface BanView {
	on: boolean;
	reason: string;
	/** The fake K/D behind it, when that's why. */
	fake: { kd: number; at: number } | null;
}

/** Whether this member (by key) wears the stamp right now, and why. */
export function banOf(key: string, bans: Bans | undefined, combat?: CombatLog): BanView {
	const joke = JOKE_BANS[key];
	const fake = fakeKd(combat);
	const reason = joke?.reason ?? FAKE_KD_REASON;
	const choice = bans?.[key];
	const latest = Math.max(joke?.since ?? 0, fake?.at ?? 0);
	if (choice && choice.at >= latest) return { on: choice.on, reason, fake };
	return { on: !!joke || fake !== null, reason, fake };
}

/** Whether this member (by key) wears the stamp right now. */
export function isBanned(key: string, bans: Bans | undefined, combat?: CombatLog): boolean {
	return banOf(key, bans, combat).on;
}

/** The key a member's ban is stored under: their header operator, else their member id. */
export const banKey = (memberId: string, op: string | undefined) => op ?? memberId;

/**
 * The squad's `bans` with a lift (on = false) or a ban (on = true) for one member. Written on the
 * newest copy of the squad document (a refused write is redone on the newer one), so no merge needed.
 */
export function withBan(bans: Bans | undefined, key: string, on: boolean, at: number): Bans {
	return { ...bans, [key]: { on, at } };
}
