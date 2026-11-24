/**
 * BurgiCasino's floor (2026-11-20, the user's ask: "snygga till hela 'Burgicasino' fliken, mycket dopamin
 * och kul grejer på skärmen, den är väldigt tråkig atm"): the pure bits behind the jackpot ticker, the
 * HOT tile, the daily-bonus meter and the coin bursts on the balance. Pretend burgers, never money.
 *
 * The ticker reads the squad radio: every casino game already posts its big moments there
 * (t.casino.event: "hit a MEGA WIN on Mybots 5: +184,250 🍔 🍟", "won 3,500 🍔 on roulette (17 black) 🎡").
 * A line counts as a win when it's an automatic event line with "+n 🍔" or "won n 🍔" in it; the game it
 * came from is the emoji it ends with. Losses ("lost n 🍔 …") and admin grants ("gave … 🍔") don't match.
 */
import type { RadioMsg } from './squad-radio.ts';

export type FloorGame = 'slots' | 'fortune2' | 'book' | 'kushburst' | 'stash' | 'skeddwood' | 'cases' | 'roulette' | 'blackjack';

export interface FloorWin {
	id: string;
	name: string;
	text: string;
	/** Burgers won (from the line's own "+n 🍔" / "won n 🍔"). */
	amount: number;
	game: FloorGame | null;
	at: number;
}

/** The emoji each game ends its radio line with (t.casino.event). */
const GAME_MARK: [string, FloorGame][] = [
	['🎰', 'slots'],
	['🍟', 'fortune2'],
	['📖', 'book'],
	['🍃', 'kushburst'],
	['💨', 'stash'],
	['🤠', 'skeddwood'],
	['📦', 'cases'],
	['🎡', 'roulette'],
	['🃏', 'blackjack']
];
const AMOUNT = /(?:\+|\bwon )([\d,]+) 🍔/;
/** How far back the ticker looks. */
export const WIN_DAYS = 7;
/** How many lines the ticker runs. */
export const TICKER_MAX = 10;
const DAY = 86_400_000;

/** One radio line as a casino win, or null when it isn't one. */
export function asWin(m: RadioMsg): FloorWin | null {
	if (m.kind !== 'event') return null;
	const a = AMOUNT.exec(m.text);
	if (!a) return null;
	const amount = Number(a[1].replace(/,/g, ''));
	if (!Number.isFinite(amount) || amount <= 0) return null;
	const text = m.text.trim();
	const game = GAME_MARK.find(([mark]) => text.endsWith(mark))?.[1] ?? null;
	return { id: m.id, name: m.name, text, amount, game, at: m.at };
}

/** The ticker: the newest casino wins of the last WIN_DAYS days, and the biggest one among them. */
export function floorNews(msgs: readonly RadioMsg[] | undefined, now: number, days = WIN_DAYS): { recent: FloorWin[]; biggest: FloorWin | null } {
	const since = now - days * DAY;
	const wins = (msgs ?? [])
		.filter((m) => m.at >= since && m.at <= now + 60_000)
		.map(asWin)
		.filter((w): w is FloorWin => w !== null)
		.sort((a, b) => b.at - a.at);
	const biggest = wins.reduce<FloorWin | null>((best, w) => (!best || w.amount > best.amount ? w : best), null);
	return { recent: wins.slice(0, TICKER_MAX), biggest };
}

/** The game with the most wins on the radio in the last 24 hours (a tie goes to the newest win). */
export function hotGame(wins: readonly FloorWin[], now: number): FloorGame | null {
	const counts = new Map<FloorGame, { n: number; at: number }>();
	for (const w of wins) {
		if (!w.game || w.at < now - DAY) continue;
		const c = counts.get(w.game) ?? { n: 0, at: 0 };
		counts.set(w.game, { n: c.n + 1, at: Math.max(c.at, w.at) });
	}
	let best: FloorGame | null = null;
	let top = { n: 0, at: 0 };
	for (const [g, c] of counts) {
		if (c.n > top.n || (c.n === top.n && c.at > top.at)) {
			best = g;
			top = c;
		}
	}
	return best;
}

/** Whole minutes since a time (never below 0). */
export const minutesAgo = (at: number, now: number) => Math.max(0, Math.floor((now - at) / 60_000));

/**
 * What a balance going up shows: a burst of burger coins from the balance pill (more for a bigger gain,
 * 4–14), and confetti over the screen for a big one (at least 1,000 burgers and a tenth of what you had).
 */
export function gainFx(gain: number, before: number): { coins: number; confetti: boolean } {
	if (!(gain > 0)) return { coins: 0, confetti: false };
	const coins = Math.max(4, Math.min(14, Math.round(4 + Math.log10(gain) * 2.5)));
	return { coins, confetti: gain >= 1000 && gain >= before * 0.1 };
}

/** The daily-bonus meter: how many of the current block of days (every) are done, 1 … every. */
export function bonusMeter(days: number, every: number, toNext: number): number {
	if (days <= 0) return 0;
	return Math.max(1, Math.min(every, every - toNext + 1));
}

/** A tiny seeded random (mulberry32) so the decorations sit in the same places on every render. */
export function seeded(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
