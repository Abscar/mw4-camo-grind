/**
 * Abscar's control room for BurgiCasino (2026-11-19, the user's ask: "en admin meny till casinot … en
 * panel där jag kan ändra odds, vilka kort blackjack dealern ska dra, vilka symboler som ska komma upp
 * på slotsen, ändra individuell 'luck' på alla operators").
 *
 * The settings live in the squad document as `tune` (squad-codec.ts). Only Abscar's page shows the panel
 * and writes them; every player's own page reads them and applies them to its own plays (the games are
 * worked out on the player's page, CasinoSlots / CasinoFortune2 / CasinoRoulette; blackjack on the shared
 * table, bj-table.ts, where the round carries what every page needs to deal the same cards). Nothing goes
 * on the radio. Pretend burgers among friends: anyone reading the squad document could see it.
 *
 * - Odds per game and luck per member, each −100 … +100, added up for a member's game (`luckFor`).
 *   Luck draws a game more than once and keeps the best (plus) or the worst (minus): ±50 = two draws,
 *   ±100 = three, in between a chance of the extra one (`lucky`). The game itself is unchanged.
 * - Forced results (`Forced`): the next play only (marked `used` by the page that took it, and kept in
 *   that device's own list so a slow write can't give it twice) or every play until switched off; for
 *   one member or whoever plays first ('*'). Slots: the whole 5 × 3 screen. Fortune II: a feature (the
 *   page draws spins until one has it). Book Of Skedd (2026-11-20): free spins (optionally with Abscar
 *   as the special symbol), a big win or nothing, drawn the same way; its gamble follows luck too.
 *   Kushburst (2026-11-20): a leaf or a KUSHBURST from the start, a big win or nothing (kushForced).
 *   Abscar's Stash (2026-11-20): Sky High Spins, a smoke-cloud win, a big win or nothing, drawn the same
 *   way. Roulette: the number. Blackjack: the dealer's cards in order.
 *
 * No browser APIs and no runes (scripts/casino-rig.test.js).
 */

import { BOOK_FORCES, type BookForce } from './book.ts';
import { REELS, ROWS, SYMBOLS, type SlotSymbol } from './casino-slots.ts';
import type { F2Play } from './fortune2.ts';
import { kushPlay, kushPlayWith, LEAF_REELS, type KushPlay } from './kushburst.ts';
import { randInt } from './squad-casino.ts';
import type { StashPlay } from './stash.ts';

export type RigGame = 'slots' | 'fortune2' | 'book' | 'kushburst' | 'stash' | 'roulette' | 'blackjack';
export const RIG_GAMES: RigGame[] = ['slots', 'fortune2', 'book', 'kushburst', 'stash', 'roulette', 'blackjack'];
/** Luck and odds run from −LUCK_MAX to +LUCK_MAX. */
export const LUCK_MAX = 100;
/** Draws per ±50 of luck past the first: +50 = best of two, +100 = best of three. */
const PER_DRAW = 50;

/** What a Fortune II spin can be forced to have. */
export type F2Force = 'hotbox' | 'super' | 'munchies' | 'big' | 'blank';
export const F2_FORCES: F2Force[] = ['hotbox', 'super', 'munchies', 'big', 'blank'];
/** Fortune II "big win": at least this many times the bet. */
export const F2_BIG = 25;
/** Spins Fortune II draws at most looking for a forced feature (Super Hotbox ≈ 1 in 1,000, ≈ 56 µs each). */
export const F2_TRIES = 30_000;

/** What a Kushburst spin can be forced to have (2026-11-20). */
export type KushForce = 'leaf' | 'kushburst' | 'big' | 'blank';
export const KUSH_FORCES: KushForce[] = ['leaf', 'kushburst', 'big', 'blank'];
/** Kushburst "big win": at least this many times the bet (≈ 1 spin in 45). */
export const KUSH_BIG = 25;
/** Spins Kushburst draws at most looking for a big win / a blank one (each takes a few µs). */
export const KUSH_TRIES = 5000;
/** What an Abscar's Stash spin can be forced to have (stash.ts). */
export type StashForce = 'free' | 'cloud' | 'big' | 'blank';
export const STASH_FORCES: StashForce[] = ['free', 'cloud', 'big', 'blank'];
/** Spins Abscar's Stash draws at most looking for a forced result (Sky High Spins ≈ 1 in 53). */
export const STASH_TRIES = 20_000;

/** The dealer's forced cards: at most this many, ranks 1 (ace) … 13 (king), up card first. */
export const DEALER_MAX = 8;

export interface Forced<T> {
	/** New on every save, so "the next one only" can tell a new setting from one already used. */
	id: string;
	/** A member id, or '*' = whoever plays first (every play: everyone). */
	who: string;
	/** Every play until switched off (otherwise only the next one). */
	every?: 1;
	what: T;
	/** The next one only: when it was taken, and by whom (member id). */
	used?: number;
	by?: string;
}

export type ForceKind = 'slots' | 'fortune2' | 'book' | 'kushburst' | 'stash' | 'roulette' | 'blackjack';

export interface CasinoTune {
	/** Per game, added to every member's luck there. */
	odds?: Partial<Record<RigGame, number>>;
	/** Member id → luck. */
	luck?: Record<string, number>;
	/** Abscar's Fortune: the screen, grid[reel][row]. */
	slots?: Forced<SlotSymbol[][]>;
	fortune2?: Forced<F2Force>;
	/** Book Of Skedd (2026-11-20): free spins / free spins with Abscar spreading / a big win / nothing. */
	book?: Forced<BookForce>;
	/** Kushburst: a leaf (+ respin), a KUSHBURST, a big win or nothing. */
	kushburst?: Forced<KushForce>;
	/** Abscar's Stash: what the spin has (spins are drawn until one does). */
	stash?: Forced<StashForce>;
	/** Roulette: the number (0–36). */
	roulette?: Forced<number>;
	/** Blackjack: the dealer's cards in order (who is always '*': the dealer deals to everyone). */
	blackjack?: Forced<number[]>;
	/** Last change (sync service's clock). */
	at?: number;
}

// ---------------------------------------------------------------------------------------------
// Reading the settings

const MEMBER = /^[A-Za-z0-9_-]{8,32}$/;
const RIG_ID = /^[A-Za-z0-9_-]{4,32}$/;
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

/** A luck / odds value: a whole number within ±LUCK_MAX (anything else = 0). */
export const cleanLuck = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? Math.max(-LUCK_MAX, Math.min(LUCK_MAX, Math.round(x))) : 0);

function cleanForced<T>(raw: unknown, what: (x: unknown) => T | null): Forced<T> | undefined {
	if (!isObject(raw) || typeof raw.id !== 'string' || !RIG_ID.test(raw.id)) return undefined;
	if (raw.who !== '*' && (typeof raw.who !== 'string' || !MEMBER.test(raw.who))) return undefined;
	const w = what(raw.what);
	if (w === null) return undefined;
	const f: Forced<T> = { id: raw.id, who: raw.who as string, what: w };
	if (raw.every === 1) f.every = 1;
	else if (isTime(raw.used)) {
		f.used = Math.round(raw.used);
		if (typeof raw.by === 'string' && MEMBER.test(raw.by)) f.by = raw.by;
	}
	return f;
}

const SYMBOL_SET = new Set<unknown>(SYMBOLS);
/** A 5 × 3 screen of real symbols, or null. */
export function cleanScreen(x: unknown): SlotSymbol[][] | null {
	if (!Array.isArray(x) || x.length !== REELS) return null;
	for (const col of x) if (!Array.isArray(col) || col.length !== ROWS || !col.every((s) => SYMBOL_SET.has(s))) return null;
	return x.map((col: SlotSymbol[]) => [...col]);
}
const cleanF2 = (x: unknown): F2Force | null => ((F2_FORCES as unknown[]).includes(x) ? (x as F2Force) : null);
const cleanBook = (x: unknown): BookForce | null => ((BOOK_FORCES as unknown[]).includes(x) ? (x as BookForce) : null);
const cleanKush = (x: unknown): KushForce | null => ((KUSH_FORCES as unknown[]).includes(x) ? (x as KushForce) : null);
const cleanStash = (x: unknown): StashForce | null => ((STASH_FORCES as unknown[]).includes(x) ? (x as StashForce) : null);
const cleanNumber = (x: unknown): number | null => (Number.isInteger(x) && (x as number) >= 0 && (x as number) <= 36 ? (x as number) : null);
/** Dealer cards: 1 … DEALER_MAX ranks 1–13, or null. */
export function cleanDealer(x: unknown): number[] | null {
	if (!Array.isArray(x) || !x.length || x.length > DEALER_MAX) return null;
	return x.every((r) => Number.isInteger(r) && r >= 1 && r <= 13) ? [...(x as number[])] : null;
}

/** The squad document's `tune`, cleaned up (undefined = nothing set). */
export function cleanTune(raw: unknown): CasinoTune | undefined {
	if (!isObject(raw)) return undefined;
	const tune: CasinoTune = {};
	if (isObject(raw.odds)) {
		const odds: Partial<Record<RigGame, number>> = {};
		for (const g of RIG_GAMES) {
			const n = cleanLuck(raw.odds[g]);
			if (n) odds[g] = n;
		}
		if (Object.keys(odds).length) tune.odds = odds;
	}
	if (isObject(raw.luck)) {
		const luck: Record<string, number> = {};
		for (const [id, x] of Object.entries(raw.luck)) {
			const n = cleanLuck(x);
			if (MEMBER.test(id) && n) luck[id] = n;
		}
		if (Object.keys(luck).length) tune.luck = luck;
	}
	const slots = cleanForced(raw.slots, cleanScreen);
	if (slots) tune.slots = slots;
	const f2 = cleanForced(raw.fortune2, cleanF2);
	if (f2) tune.fortune2 = f2;
	const book = cleanForced(raw.book, cleanBook);
	if (book) tune.book = book;
	const kush = cleanForced(raw.kushburst, cleanKush);
	if (kush) tune.kushburst = kush;
	const stash = cleanForced(raw.stash, cleanStash);
	if (stash) tune.stash = stash;
	const roulette = cleanForced(raw.roulette, cleanNumber);
	if (roulette) tune.roulette = roulette;
	const bj = cleanForced(raw.blackjack, cleanDealer);
	if (bj) tune.blackjack = { ...bj, who: '*' };
	if (isTime(raw.at)) tune.at = Math.round(raw.at);
	return Object.keys(tune).some((k) => k !== 'at') ? tune : undefined;
}

// ---------------------------------------------------------------------------------------------
// Luck

/** A member's luck in a game: the game's odds + their own luck, within ±LUCK_MAX. */
export function luckFor(tune: CasinoTune | undefined, game: RigGame, id: string | undefined): number {
	return cleanLuck((tune?.odds?.[game] ?? 0) + (id ? (tune?.luck?.[id] ?? 0) : 0));
}

/** How many extra draws a play gets at this luck: ±50 = one, ±100 = two, in between a chance of the next. */
export function extraDraws(luck: number, rand: () => number): number {
	const x = Math.min(Math.abs(cleanLuck(luck)), LUCK_MAX) / PER_DRAW;
	const whole = Math.floor(x);
	return whole + (x > whole && rand() < x - whole ? 1 : 0);
}

/**
 * A play at a luck: drawn once, then once more per extra draw, keeping the best score (plus) or the
 * worst (minus). The first draw wins a tie.
 */
export function lucky<T>(luck: number, rand: () => number, draw: () => T, score: (x: T) => number): T {
	let best = draw();
	if (!luck) return best;
	let bestScore = score(best);
	const extra = extraDraws(luck, rand);
	for (let i = 0; i < extra; i++) {
		const next = draw();
		const s = score(next);
		if (luck > 0 ? s > bestScore : s < bestScore) {
			best = next;
			bestScore = s;
		}
	}
	return best;
}

/** What one luck setting does, in words for the panel (+50 = "best of 2"). */
export function luckWords(luck: number): { draws: number; chance: number } {
	const x = Math.abs(cleanLuck(luck)) / PER_DRAW;
	return { draws: 1 + Math.floor(x), chance: Math.round((x - Math.floor(x)) * 100) };
}

// ---------------------------------------------------------------------------------------------
// Forced results

/** The forced setting this member's next play takes, or null. `usedHere` = ids this device already took. */
export function forcedFor<T>(f: Forced<T> | undefined, me: string, usedHere: readonly string[]): Forced<T> | null {
	if (!f || (f.who !== '*' && f.who !== me)) return null;
	if (f.every) return f;
	return f.used || usedHere.includes(f.id) ? null : f;
}

/** The tune with a next-only setting marked as taken (unchanged when it was replaced or is an every-play one). */
export function withUsed(tune: CasinoTune, kind: ForceKind, id: string, by: string, at: number): CasinoTune | null {
	const f = tune[kind];
	if (!f || f.id !== id || f.every || f.used) return null;
	return { ...tune, [kind]: { ...f, used: Math.round(at), by } };
}

/** True when a Fortune II play has what was asked for. */
export function f2Matches(p: F2Play, want: F2Force): boolean {
	switch (want) {
		case 'hotbox':
			return p.bonus === 'hotbox';
		case 'super':
			return p.bonus === 'super';
		case 'munchies':
			return !!p.base?.munchies || !!p.munchies;
		case 'big':
			return p.win >= p.bet * F2_BIG;
		case 'blank':
			return p.win === 0;
	}
}

/** True when an Abscar's Stash play has what was asked for. */
export function stashMatches(p: StashPlay, want: StashForce): boolean {
	switch (want) {
		case 'free':
			return p.bonus === 'free';
		case 'cloud':
			return [...(p.base ? [p.base] : []), ...p.free].some((s) => s.mult > 1);
		case 'big':
			return p.win >= p.cost * F2_BIG;
		case 'blank':
			return p.win === 0;
	}
}

/** Draw until a play passes `ok` (at most `max` draws; the last one if none did). */
export function drawUntil<T>(draw: () => T, ok: (x: T) => boolean, max: number): T {
	let x = draw();
	for (let i = 1; i < max && !ok(x); i++) x = draw();
	return x;
}

/** True when a Kushburst play has what was asked for. */
export function kushMatches(p: KushPlay, want: KushForce): boolean {
	switch (want) {
		case 'leaf':
			return p.steps.length > 1;
		case 'kushburst':
			return p.steps.some((s) => s.mult > 1);
		case 'big':
			return p.win >= p.bet * KUSH_BIG;
		case 'blank':
			return p.win === 0;
	}
}

/**
 * A Kushburst spin with a picked result: a leaf on a random middle reel / all three (a KUSHBURST) from the
 * start, or spins drawn behind the scenes until one is a big win / pays nothing. Paid like a normal spin.
 */
export function kushForced(want: KushForce, bet: number, rand: () => number): KushPlay {
	if (want === 'leaf') return kushPlayWith(bet, rand, [LEAF_REELS[randInt(LEAF_REELS.length, rand)]]);
	if (want === 'kushburst') return kushPlayWith(bet, rand, LEAF_REELS);
	return drawUntil(
		() => kushPlay(bet, rand),
		(p) => kushMatches(p, want),
		KUSH_TRIES
	);
}

// ---------------------------------------------------------------------------------------------
// Ready-made screens for Abscar's Fortune (the panel's quick picks)

/**
 * A screen that pays nothing: reels 1 and 2 share no symbol and there's no WILD, so no line starts
 * with two alike (two in a row is the least that pays) and there are no specials.
 */
const BLANK: SlotSymbol[][] = [
	['pickle', 'onion', 'tomato'],
	['cheese', 'fries', 'shake'],
	['tomato', 'hotdog', 'pickle'],
	['onion', 'cheese', 'fries'],
	['shake', 'pickle', 'hotdog']
];

export type ScreenPreset = 'jackpot' | 'burgers' | 'free3' | 'free5' | 'box' | 'wheel' | 'blank';
export const SCREEN_PRESETS: ScreenPreset[] = ['jackpot', 'burgers', 'free5', 'free3', 'box', 'wheel', 'blank'];

/** A quick pick's screen: the blank one with the middle row (or a few cells) changed. */
export function presetScreen(p: ScreenPreset): SlotSymbol[][] {
	const g = BLANK.map((col) => [...col]);
	const mid = (reels: number[], sym: SlotSymbol) => reels.forEach((r) => (g[r][1] = sym));
	if (p === 'jackpot') mid([0, 1, 2, 3, 4], 'wild');
	else if (p === 'burgers') mid([0, 1, 2, 3, 4], 'burger');
	else if (p === 'free5') mid([0, 1, 2, 3, 4], 'scatter');
	else if (p === 'free3') mid([0, 2, 4], 'scatter');
	else if (p === 'box') mid([0, 2, 4], 'box');
	else if (p === 'wheel') mid([1, 2, 3], 'wheel');
	return g;
}

/** Quick picks for the dealer's cards. */
export type DealerPreset = 'blackjack' | 'twenty' | 'bust';
export const DEALER_PRESETS: Record<DealerPreset, number[]> = {
	blackjack: [1, 13],
	twenty: [13, 12],
	// 16, then a king: 26
	bust: [10, 6, 13]
};
