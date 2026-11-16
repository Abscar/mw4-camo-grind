/**
 * The daily burger bonus and BurgiCasino (2026-11-16, the user's ask: "in the burger system you should
 * also get 25 for every day you go online, after 5 days it goes up to 50 and so on, like a welcome
 * bonus; add a roulette and a blackjack mode, a whole new tab called 'BurgiCasino'").
 *
 * Pretend burgers, never money (the burger bank in squad-fun.ts). Both add to a member's balance:
 * - the daily bonus: every day you're online with the squad counts (they don't have to be in a row);
 *   days 1–5 give 25 burgers each, days 6–10 50, days 11–15 75 and so on. Stored as how many days
 *   and the last one (member field `online`), so the total is worked out, not stored;
 * - the casino: what you won or lost, kept per device (member field `casino`, device id → tally) so
 *   two of your devices playing at once never overwrite each other.
 * The games (European roulette, blackjack) are pure functions here with the randomness passed in,
 * so Node tests them (scripts/squad-casino.test.js). No browser APIs and no runes; doesn't import
 * squad-codec.ts (which imports this file).
 */

// ---------------------------------------------------------------------------------------------
// The daily bonus

export const DAILY = { base: 25, step: 25, every: 5 } as const;
/** How many days you've been online with the squad, and the last one ("YYYY-MM-DD", your own clock). */
export interface OnlineDays {
	n: number;
	last: string;
	/** Extra burgers from 4:20 hours (the day's bonus once more, four20.ts). */
	b420?: number;
	/** The last day that got the 4:20 extra. */
	d420?: string;
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const DAYS_MAX = 100_000;
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

export function cleanOnline(raw: unknown): OnlineDays | undefined {
	if (!isObject(raw) || !Number.isInteger(raw.n) || (raw.n as number) < 1 || typeof raw.last !== 'string' || !DAY_KEY.test(raw.last)) return undefined;
	const o: OnlineDays = { n: Math.min(raw.n as number, DAYS_MAX), last: raw.last };
	if (Number.isInteger(raw.b420) && (raw.b420 as number) > 0 && typeof raw.d420 === 'string' && DAY_KEY.test(raw.d420)) {
		o.b420 = Math.min(raw.b420 as number, 100_000_000);
		o.d420 = raw.d420;
	}
	return o;
}

/** During the 4:20 hour: the day's bonus once more (once a day); `added` 0 when not now or already had. */
export function count420(o: OnlineDays | undefined, today: string, active: boolean): { next: OnlineDays | undefined; added: number } {
	if (!active || !o || o.last !== today || (o.d420 ?? '') >= today) return { next: o, added: 0 };
	const added = dailyRate(o.n);
	return { next: { ...o, b420: (o.b420 ?? 0) + added, d420: today }, added };
}

/** Burgers for your n-th day online: 25 for days 1–5, 50 for 6–10, 75 for 11–15 … */
export function dailyRate(n: number): number {
	return n < 1 ? 0 : DAILY.base + DAILY.step * (Math.ceil(n / DAILY.every) - 1);
}

/** All the daily bonus burgers for n days online. */
export function dailyTotal(n: number): number {
	if (n < 1) return 0;
	const full = Math.floor(n / DAILY.every);
	const rest = n % DAILY.every;
	// full blocks of 5 days at 25, 50, 75 …, then the days of the next block
	return DAILY.every * (DAILY.base * full + (DAILY.step * full * (full - 1)) / 2) + rest * dailyRate(n);
}

/** Days from day n until the rate goes up (1–5): from day 31 (175) it's 5 days to day 36 (200). */
export const daysToNextRate = (n: number) => DAILY.every - ((Math.max(n, 1) - 1) % DAILY.every);

/** Two copies of your days (two devices): the one with more days; the later last day on a tie. */
export function mergeOnline(a: OnlineDays | undefined, b: OnlineDays | undefined): OnlineDays | undefined {
	if (!a || !b) return a ?? b;
	const base = a.n !== b.n ? (a.n > b.n ? a : b) : a.last >= b.last ? a : b;
	// the 4:20 extras: the bigger total and the later day (both devices may have counted the same hour)
	const b420 = Math.max(a.b420 ?? 0, b.b420 ?? 0);
	const d420 = [a.d420 ?? '', b.d420 ?? ''].sort().pop() ?? '';
	if (!b420 || !d420) return base;
	if (base.b420 === b420 && base.d420 === d420) return base;
	return { ...base, b420, d420 };
}

/** Today counted (once): the new days and the burgers it gave (0 when today was already counted). */
export function countDay(o: OnlineDays | undefined, today: string): { next: OnlineDays; added: number } {
	if (o && o.last >= today) return { next: o, added: 0 };
	const n = (o?.n ?? 0) + 1;
	return { next: { n: Math.min(n, DAYS_MAX), last: today }, added: dailyRate(n) };
}

/** A start for members from before the bonus: the days the tracker was open (`played`, last 14 days). */
export function seedOnline(played: Record<string, number> | undefined): OnlineDays | undefined {
	const days = Object.entries(played ?? {})
		.filter(([day, min]) => DAY_KEY.test(day) && min > 0)
		.map(([day]) => day)
		.sort();
	return days.length ? { n: days.length, last: days[days.length - 1] } : undefined;
}

// ---------------------------------------------------------------------------------------------
// The casino tally

export interface CasinoTally {
	/** Burgers won minus burgers lost. */
	net: number;
	games: number;
	at: number;
	/**
	 * All the burgers lost in lost games (they go to the house, HOUSE_OP). Missing on tallies from
	 * before 2026-11-16 evening: then what's below zero of `net` counts.
	 */
	lost?: number;
}

/**
 * The house: everything other members lose in BurgiCasino or on bets goes to the member who is this
 * header operator (the user's ask 2026-11-16: "make all losses go to Abscar's burger account").
 * Their own losses don't come back to them.
 */
export const HOUSE_OP = 'abscar';
/** Device id → that device's tally. */
export type CasinoLedger = Record<string, CasinoTally>;
/** Devices kept per member (the newest). */
export const CASINO_DEVICES = 8;
/** The most one game can take (like a bet in the bank). */
export const CASINO_MAX_BET = 10_000;
const NET_MAX = 100_000_000;
const DEVICE_ID = /^[A-Za-z0-9_-]{4,16}$/;

function pruneLedger(l: CasinoLedger): CasinoLedger {
	return Object.fromEntries(
		Object.entries(l)
			.sort(([, a], [, b]) => b.at - a.at)
			.slice(0, CASINO_DEVICES)
	);
}

export function cleanCasino(raw: unknown): CasinoLedger | undefined {
	if (!isObject(raw)) return undefined;
	const out: CasinoLedger = {};
	for (const [dev, t] of Object.entries(raw)) {
		if (!DEVICE_ID.test(dev) || !isObject(t) || !Number.isInteger(t.net) || !Number.isInteger(t.games) || !isTime(t.at)) continue;
		if ((t.games as number) < 0 || Math.abs(t.net as number) > NET_MAX) continue;
		const tally: CasinoTally = { net: t.net as number, games: t.games as number, at: Math.round(t.at) };
		if (Number.isInteger(t.lost) && (t.lost as number) >= 0 && (t.lost as number) <= NET_MAX) tally.lost = t.lost as number;
		out[dev] = tally;
	}
	return Object.keys(out).length ? pruneLedger(out) : undefined;
}

/** Two copies of your ledger: per device, the later tally wins. */
export function mergeCasino(a: CasinoLedger | undefined, b: CasinoLedger | undefined): CasinoLedger {
	const out: CasinoLedger = { ...a };
	for (const [dev, t] of Object.entries(b ?? {})) if (!out[dev] || t.at > out[dev].at) out[dev] = t;
	return pruneLedger(out);
}

/** All your devices together: net result, games, and the burgers lost in lost games. */
export function casinoTotal(l: CasinoLedger | undefined): { net: number; games: number; lost: number } {
	let net = 0;
	let games = 0;
	let lost = 0;
	for (const t of Object.values(l ?? {})) {
		net += t.net;
		games += t.games;
		lost += t.lost ?? Math.max(0, -t.net);
	}
	return { net, games, lost };
}

/** One finished game on this device (a lost one adds to `lost`). */
export function withGame(l: CasinoLedger | undefined, device: string, net: number, at: number): CasinoLedger {
	const t = l?.[device] ?? { net: 0, games: 0, at: 0 };
	const n = Math.round(net);
	const lost = (t.lost ?? Math.max(0, -t.net)) + Math.max(0, -n);
	return pruneLedger({ ...l, [device]: { net: t.net + n, games: t.games + 1, at: Math.max(at, t.at + 1), lost } });
}

/** A random whole number 0 … n−1 from a [0, 1) source. */
export const randInt = (n: number, rand: () => number) => Math.min(n - 1, Math.floor(rand() * n));

// ---------------------------------------------------------------------------------------------
// Roulette (European: one zero, 37 pockets)

/** The pockets in wheel order, clockwise from the zero. */
export const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26] as const;
export const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export type OutsideBet = 'red' | 'black' | 'odd' | 'even' | 'low' | 'high' | 'd1' | 'd2' | 'd3' | 'c1' | 'c2' | 'c3';
export const OUTSIDE_BETS: OutsideBet[] = ['low', 'even', 'red', 'black', 'odd', 'high', 'd1', 'd2', 'd3', 'c1', 'c2', 'c3'];
/** A spot on the table: an outside bet, or a single number "n0" … "n36". */
export type RouletteSpot = OutsideBet | `n${number}`;

export function colorOf(n: number): 'green' | 'red' | 'black' {
	return n === 0 ? 'green' : RED.has(n) ? 'red' : 'black';
}

export function isSpot(s: string): s is RouletteSpot {
	if ((OUTSIDE_BETS as string[]).includes(s)) return true;
	const m = /^n(\d{1,2})$/.exec(s);
	return !!m && Number(m[1]) <= 36;
}

/** What a 1-burger bet on a spot pays when n comes up: the profit (35, 2 or 1), or −1 when it loses. */
export function spotPays(spot: RouletteSpot, n: number): number {
	if (spot.startsWith('n')) return Number(spot.slice(1)) === n ? 35 : -1;
	if (n === 0) return -1;
	const win = (() => {
		switch (spot) {
			case 'red': return RED.has(n);
			case 'black': return !RED.has(n);
			case 'odd': return n % 2 === 1;
			case 'even': return n % 2 === 0;
			case 'low': return n <= 18;
			case 'high': return n >= 19;
			case 'd1': return n <= 12;
			case 'd2': return n >= 13 && n <= 24;
			case 'd3': return n >= 25;
			case 'c1': return n % 3 === 1;
			case 'c2': return n % 3 === 2;
			case 'c3': return n % 3 === 0;
		}
		return false;
	})();
	if (!win) return -1;
	return spot.startsWith('d') || spot.startsWith('c') ? 2 : 1;
}

/** All the bets on the table for one spin: burgers won minus burgers lost. */
export function rouletteNet(bets: Partial<Record<RouletteSpot, number>>, n: number): number {
	let net = 0;
	for (const [spot, stake] of Object.entries(bets)) if (stake && stake > 0) net += stake * spotPays(spot as RouletteSpot, n);
	return net;
}

export const spinNumber = (rand: () => number) => randInt(37, rand);

// ---------------------------------------------------------------------------------------------
// Blackjack (6 decks, dealer stands on soft 17, blackjack pays 3:2, double on the first two cards)

export type Suit = 'S' | 'H' | 'D' | 'C';
export interface Card {
	/** 1 = ace … 11 jack, 12 queen, 13 king */
	r: number;
	s: Suit;
}
export const DECKS = 6;
/** Shuffle a new shoe when fewer cards than this are left. */
export const RESHUFFLE_AT = 78;

/** A shuffled shoe (Fisher–Yates). */
export function newShoe(rand: () => number, decks = DECKS): Card[] {
	const shoe: Card[] = [];
	for (let d = 0; d < decks; d++) for (const s of ['S', 'H', 'D', 'C'] as Suit[]) for (let r = 1; r <= 13; r++) shoe.push({ r, s });
	for (let i = shoe.length - 1; i > 0; i--) {
		const j = randInt(i + 1, rand);
		[shoe[i], shoe[j]] = [shoe[j], shoe[i]];
	}
	return shoe;
}

/** A hand's total, aces counted as 11 while that doesn't bust it (then "soft"). */
export function handValue(cards: Card[]): { total: number; soft: boolean } {
	let total = 0;
	let aces = 0;
	for (const c of cards) {
		total += c.r === 1 ? 1 : Math.min(c.r, 10);
		if (c.r === 1) aces++;
	}
	const soft = aces > 0 && total + 10 <= 21;
	return { total: soft ? total + 10 : total, soft };
}

export const isBlackjack = (cards: Card[]) => cards.length === 2 && handValue(cards).total === 21;

/** The dealer draws from the shoe until 17 or more (and stands on a soft 17). Returns the new hand. */
export function dealerPlays(hand: Card[], draw: () => Card): Card[] {
	const out = [...hand];
	while (handValue(out).total < 17) out.push(draw());
	return out;
}

export type HandResult = 'blackjack' | 'win' | 'push' | 'lose' | 'bust' | 'dealerBust';

/** How a finished hand went. */
export function handResult(player: Card[], dealer: Card[]): HandResult {
	const p = handValue(player).total;
	const d = handValue(dealer).total;
	const pBj = isBlackjack(player);
	const dBj = isBlackjack(dealer);
	if (pBj && dBj) return 'push';
	if (pBj) return 'blackjack';
	if (dBj) return 'lose';
	if (p > 21) return 'bust';
	if (d > 21) return 'dealerBust';
	return p > d ? 'win' : p < d ? 'lose' : 'push';
}

/** Burgers won (or lost, negative) for a hand: blackjack pays 3:2 (rounded down), a double doubles the stake. */
export function handNet(result: HandResult, stake: number, doubled = false): number {
	const s = doubled ? stake * 2 : stake;
	switch (result) {
		case 'blackjack': return Math.floor((stake * 3) / 2);
		case 'win':
		case 'dealerBust': return s;
		case 'push': return 0;
		default: return -s;
	}
}

/** "A", "2" … "10", "J", "Q", "K" */
export const rankLabel = (r: number) => (r === 1 ? 'A' : r === 11 ? 'J' : r === 12 ? 'Q' : r === 13 ? 'K' : String(r));
export const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
