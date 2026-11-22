/**
 * Callout Typer (BurgiArcade, 2026-11-22): a typing race on a tactical map. Callouts (enemy markers with a word
 * tag) drift down towards the defence line; typing a callout's word shoots it. Pure (no DOM, no runes), so Node
 * tests it (scripts/arcade-typer.test.js) and CalloutTyper.svelte plays it.
 *
 * - `makePlan(seed, words)`: the whole run's spawns from rng(seed): which callout, when, where, how fast.
 *   Callouts come faster and fall faster over time (`intervalAt`, `fallAt`), so the screen fills up and
 *   every run ends; the same word never shows twice close together.
 * - `typeChar`: one typed character against the callouts on screen. Matching ignores case and spaces; the
 *   lock goes to the callout closest to the line whose word starts with what's typed, and moves to another
 *   one when the next letter only fits that one. A letter that fits nothing is a mistake (not typed).
 * - Scoring: 10 points per correct character × the combo; the combo grows by one every two callouts in a
 *   row typed without a mistake (max ×8) and drops to ×1 on a mistake or when a callout reaches the line.
 */
import { rng, shuffled } from '#lib/arcade/rng.ts';

export const W = 800;
export const H = 600;
/** where a callout's marker starts (its tag just under the HUD) and the defence line it must not reach */
export const TOP_Y = 122;
export const LINE_Y = 498;
export const LIVES = 3;
export const POINTS_PER_CHAR = 10;
export const COMBO_MAX = 8;
/** clean callouts in a row per combo step */
export const COMBO_STEP = 2;

/** what a callout's word becomes for matching: lower case, letters and digits only */
export const keyOf = (word: string): string => word.toLowerCase().replace(/[^a-z0-9]/g, '');

/** seconds between callouts at run time t (with ±18 % jitter from the seed) */
export const intervalAt = (t: number): number => Math.max(0.45, 3.4 * Math.exp(-t / 105));
/** seconds a callout takes from the top to the line, at run time t */
export const fallAt = (t: number): number => Math.max(4, 9.5 - t * 0.03);

export interface Spawn {
	i: number;
	/** run time it appears (s) */
	at: number;
	word: string;
	key: string;
	/** its centre line (logical px) */
	x: number;
	/** seconds to the line */
	fall: number;
	/** side-to-side drift */
	sway: number;
	phase: number;
}

/** The run's callouts, in order. 400 is far more than anyone survives (the last ones come every 0.45 s). */
export function makePlan(seed: number, words: readonly string[], count = 400): Spawn[] {
	const r = rng(seed);
	const plan: Spawn[] = [];
	const recent: string[] = [];
	let bag: string[] = [];
	let t = 0.8;
	for (let i = 0; i < count; i++) {
		if (!bag.length) bag = shuffled(r, words);
		let k = bag.findIndex((w) => !recent.includes(keyOf(w)));
		if (k < 0) k = 0;
		const word = bag.splice(k, 1)[0];
		const key = keyOf(word);
		recent.push(key);
		if (recent.length > 8) recent.shift();
		// keep it away from the last two callouts' columns so the tags don't stack
		let x = 0;
		for (let tries = 0; tries < 14; tries++) {
			x = 130 + r() * 540;
			if (plan.slice(-2).every((p) => Math.abs(p.x - x) > 170)) break;
		}
		plan.push({ i, at: +t.toFixed(3), word, key, x: Math.round(x), fall: +fallAt(t).toFixed(3), sway: 4 + r() * 12, phase: r() * Math.PI * 2 });
		t += intervalAt(t) * (0.82 + r() * 0.36);
	}
	return plan;
}

/** A callout's marker position at run time t (its tag floats above it). */
export function posAt(sp: Spawn, t: number): { x: number; y: number; u: number } {
	const u = Math.max(0, (t - sp.at) / sp.fall);
	return { x: sp.x + sp.sway * Math.sin(sp.phase + (t - sp.at) * 1.3), y: TOP_Y + (LINE_Y - TOP_Y) * u, u };
}

/** A callout on screen as the typing sees it: its id, matching key and how close it is to the line. */
export interface OnScreen {
	id: number;
	key: string;
	y: number;
}
export interface TypeState {
	/** what's typed so far (a key prefix) */
	buf: string;
	/** the callout it's locked on */
	target: number | null;
}
export type TypeResult =
	| { kind: 'ignored'; st: TypeState }
	| { kind: 'miss'; st: TypeState }
	| { kind: 'ok'; st: TypeState; target: number }
	| { kind: 'done'; st: TypeState; target: number };

export const EMPTY: TypeState = { buf: '', target: null };

/** One typed character. */
export function typeChar(st: TypeState, ch: string, live: readonly OnScreen[]): TypeResult {
	const c = keyOf(ch);
	if (!c) return { kind: 'ignored', st };
	const next = st.buf + c;
	const fits = live.filter((l) => l.key.startsWith(next));
	if (!fits.length) return { kind: 'miss', st };
	const cur = fits.find((l) => l.id === st.target) ?? [...fits].sort((a, b) => b.y - a.y)[0];
	if (cur.key === next) return { kind: 'done', st: EMPTY, target: cur.id };
	return { kind: 'ok', st: { buf: next, target: cur.id }, target: cur.id };
}

/** Backspace: one letter back (the lock stays while something still fits). */
export function backspace(st: TypeState, live: readonly OnScreen[]): TypeState {
	const buf = st.buf.slice(0, -1);
	if (!buf) return EMPTY;
	const still = live.find((l) => l.id === st.target && l.key.startsWith(buf)) ?? live.find((l) => l.key.startsWith(buf));
	return still ? { buf, target: still.id } : EMPTY;
}

/** The lock's callout left the screen (shot or reached the line): forget what was typed for it. */
export const dropTarget = (st: TypeState, id: number): TypeState => (st.target === id ? EMPTY : st);

/** How much of a callout's word (as written, with its spaces) `typed` key letters cover. */
export function shownPart(word: string, typed: number): number {
	let n = 0;
	for (let i = 0; i < word.length; i++) {
		if (n >= typed) return i;
		if (/[a-z0-9]/i.test(word[i])) n++;
	}
	return word.length;
}

export const comboOf = (streak: number): number => Math.min(COMBO_MAX, 1 + Math.floor(streak / COMBO_STEP));
export const charPoints = (streak: number): number => POINTS_PER_CHAR * comboOf(streak);
/** words per minute the usual way: five characters = one word */
export const wpmOf = (chars: number, seconds: number): number => (seconds > 0.5 ? Math.round(chars / 5 / (seconds / 60)) : 0);
export const accuracyOf = (ok: number, bad: number): number => (ok + bad ? Math.round((100 * ok) / (ok + bad)) : 100);
