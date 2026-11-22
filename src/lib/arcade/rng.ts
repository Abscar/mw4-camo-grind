/**
 * BurgiArcade's seeded randomness (2026-11-22): every game draws its level from a seed, so the daily
 * challenge (arcade.ts dailySeed) gives everyone in the squad the same level on the same day, and a
 * Quickscope duel gives both players the same waits. mulberry32: fast, small, good enough for games.
 * No browser APIs, so Node tests it directly.
 */

/** A random number generator from a seed: each call gives the next number in [0, 1). */
export function rng(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** A whole number in [min, max] (both included). */
export const rint = (r: () => number, min: number, max: number): number => min + Math.floor(r() * (max - min + 1));

/** One of the items. */
export const pick = <T>(r: () => number, items: readonly T[]): T => items[Math.floor(r() * items.length)];

/** The items in a random order (a new array). */
export function shuffled<T>(r: () => number, items: readonly T[]): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(r() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/** A seed from a text (FNV-1a), e.g. a game id + a day. */
export function hashSeed(text: string): number {
	let h = 2166136261;
	for (let i = 0; i < text.length; i++) {
		h ^= text.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

/** A fresh random seed (for a normal, non-daily play). */
export const freshSeed = (): number => Math.floor(Math.random() * 4294967296) >>> 0;
