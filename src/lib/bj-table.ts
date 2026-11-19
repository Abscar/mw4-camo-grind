/**
 * BurgiCasino's shared blackjack table (2026-11-16, the user's ask: "gör så jag kan se när andra
 * spelar vid blackjack bordet, o flera kan spela samtidigt" = see who's playing at the blackjack
 * table, and let several play at the same time).
 *
 * One small document on the sync service per squad (the squad's code + "-bj", like the radio), so
 * the table never races the squad's progress writes. There's no server logic: every page works out
 * the same table from the document and changes it with a write checked against the newest copy (a
 * refused write is redone on it, squad.svelte.ts Channel). So everything here is a pure function of
 * the document and the time (the sync service's clock):
 *
 * - Seats: opening Blackjack sits you down (up to SEATS, else you watch); a hello every HELLO_EVERY
 *   while the table is on screen; a seat without one for SEAT_FRESH is gone.
 * - A round opens with the first bet. Alone at the table it deals at once; with others seated they
 *   get BET_WINDOW to put in a bet. It deals sooner once everyone seated has bet, or when someone in
 *   it presses Deal now. A bet joins only while bets are open.
 * - The cards come from a 6-deck shoe shuffled from the round's seed. Every seat draws from its own
 *   stretch of that shoe (the dealer from another), so who joins and in which order people act
 *   never changes anyone's cards, and every page deals exactly the same.
 * - Everyone plays their own hand at the same time (hit / stand / double, the solo rules: dealer
 *   stands on soft 17, blackjack 3:2, the dealer checks for blackjack at once). A hand left alone
 *   for ACT_TIME stands by itself; other pages wait GRACE longer before counting on that, so a click
 *   already on its way isn't cut off.
 * - The write that finishes the last hand (or a page noticing the time ran out) settles the round:
 *   `done`. From then nothing in it changes, the dealer's cards are worked out and every hand paid.
 *   Each player's own device (`dev`) books its result in its casino tally (squad.recordGame, so the
 *   house = Abscar rules hold), then marks the hand booked (`ok`) in its next write. Settled rounds
 *   stay until every hand in them is booked (at most PAST_MAX, PAST_AGE), so someone who closed the
 *   page mid-hand gets their result when they come back.
 *
 * - Boosts and side bets (squad-casino.ts, added the same evening for the solo game): each hand
 *   carries its side bets (Perfect Pairs / 21+3, a chip the size of the bet each, settled on the
 *   deal) and its player's win streak before it (`st`, kept per device), so every page works out
 *   the same boosted result: a won hand × its card boost × the streak boost, plus the side bets.
 *
 * Friends playing for pretend burgers: whoever opens the browser's dev tools could read the seed.
 * No browser APIs and no runes (scripts/bj-table.test.js).
 */

import { APP_ID } from './progress-codec.ts';
import { cleanName, isMemberId, SQUAD_OPS, type SquadOp } from './squad-codec.ts';
import {
	boostedNet,
	cardBoost,
	handNet,
	handResult,
	handValue,
	isBlackjack,
	newShoe,
	nextStreak,
	sideResult,
	CASINO_MAX_BET,
	SIDE_BETS,
	type BjBoost,
	type Card,
	type HandResult,
	type PairKind,
	type SideBet,
	type ThreeKind
} from './squad-casino.ts';
import { seeded } from './squad-fun.ts';
import { cleanDealer, cleanLuck, extraDraws } from './casino-rig.ts';

export const TABLE_FORMAT = 1;
/** Seats at the table (more people watch). */
export const SEATS = 5;
/** With others seated: how long bets stay open after the first one. */
export const BET_WINDOW = 10_000;
/** A hand nobody touches for this long stands by itself. */
export const ACT_TIME = 20_000;
/** Other pages wait this much longer before counting on a timeout (a click may be on its way). */
export const GRACE = 3_000;
/** The seat's hello while the table is on screen. */
export const HELLO_EVERY = 25_000;
/** A seat without a hello for this long is empty again. */
export const SEAT_FRESH = 75_000;
/** After a hand with others in it, the next one opens this much later (time to see the results). */
export const RESULT_PAUSE = 3_500;
/** Settled rounds kept for the "last hands" line (more while someone hasn't booked theirs). */
export const PAST_KEEP = 6;
const PAST_MAX = 30;
const PAST_AGE = 3 * 86_400_000;
/** Cards in each seat's (and the dealer's) stretch of the shoe: a hand can't take more without passing 21. */
const STREAM = 24;
const DEALER = SEATS;
const DEVICE = /^[A-Za-z0-9_-]{4,16}$/;
const ACTS = /^[hsd]{0,24}$/;

export interface TableSeat {
	/** Seat number 0 … SEATS−1 (also which stretch of the shoe the hand draws from). */
	n: number;
	name: string;
	op?: SquadOp;
	/** The device sitting here (the casino tally is per device). */
	dev: string;
	/** The last hello (sync service's clock). */
	seen: number;
}

export interface TableHand {
	n: number;
	name: string;
	op?: SquadOp;
	dev: string;
	bet: number;
	/** h = hit, s = stand, d = double, in order. */
	acts: string;
	/** When the bet went in or the last action (sync service's clock). */
	at: number;
	/** Side bets: p = Perfect Pairs, t = 21+3 (a chip the size of the bet each). */
	sides?: string;
	/** The player's wins in a row before this hand (the streak boost). */
	st?: number;
	/** The player's luck at this table when the bet went in (Abscar's control room, casino-rig.ts). */
	lk?: number;
	/** Booked in that device's casino tally. */
	ok?: 1;
}

const SIDE_CODE: Record<SideBet, string> = { pairs: 'p', plus3: 't' };
/** A hand's side bets. */
export const handSides = (h: Pick<TableHand, 'sides'>): SideBet[] => SIDE_BETS.filter((k) => h.sides?.includes(SIDE_CODE[k]));
const STREAK_MAX = 999;

export interface TableRound {
	id: string;
	seed: number;
	open: number;
	/** When bets close and the cards are dealt. */
	dealAt: number;
	/** Member id → hand. */
	hands: Record<string, TableHand>;
	/** Settled (sync service's clock): nothing in the round changes after this. */
	done?: number;
	/** The dealer's cards Abscar picked (ranks, up card first) and that setting's id (casino-rig.ts). */
	dc?: number[];
	di?: string;
}

export interface TableDoc {
	/** Member id → seat. */
	seats: Record<string, TableSeat>;
	round: TableRound | null;
	/** Settled rounds, newest first. */
	past: TableRound[];
}

/** Who is sitting down (or betting, acting): the squad member on this device. */
export interface Sitter {
	id: string;
	name: string;
	op: SquadOp | null;
	dev: string;
}

export const tableCode = (squadCode: string) => `${squadCode}-bj`;
/** True when a round on the table (now or settled) already dealt the dealer cards of this setting. */
export const dealerRigDealt = (doc: TableDoc | null, id: string) => !!doc && [doc.round, ...doc.past].some((r) => r?.di === id);
export const emptyTable = (): TableDoc => ({ seats: {}, round: null, past: [] });

// ---------------------------------------------------------------------------------------------
// The wire format

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;
const cleanOp = (x: unknown): SquadOp | undefined => ((SQUAD_OPS as readonly unknown[]).includes(x) ? (x as SquadOp) : undefined);
const isSeatNo = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) < SEATS;

function cleanSeat(raw: unknown): TableSeat | null {
	if (!isObject(raw) || !isSeatNo(raw.n) || typeof raw.dev !== 'string' || !DEVICE.test(raw.dev) || !isTime(raw.seen)) return null;
	const name = cleanName(raw.name);
	if (!name) return null;
	const op = cleanOp(raw.op);
	return { n: raw.n, name, ...(op ? { op } : {}), dev: raw.dev, seen: Math.round(raw.seen) };
}

function cleanHand(raw: unknown): TableHand | null {
	if (!isObject(raw) || !isSeatNo(raw.n) || typeof raw.dev !== 'string' || !DEVICE.test(raw.dev) || !isTime(raw.at)) return null;
	if (!Number.isInteger(raw.bet) || (raw.bet as number) < 1 || (raw.bet as number) > CASINO_MAX_BET) return null;
	if (typeof raw.acts !== 'string' || !ACTS.test(raw.acts)) return null;
	const name = cleanName(raw.name);
	if (!name) return null;
	const op = cleanOp(raw.op);
	const hand: TableHand = { n: raw.n, name, ...(op ? { op } : {}), dev: raw.dev, bet: raw.bet as number, acts: raw.acts, at: Math.round(raw.at) };
	if (typeof raw.sides === 'string' && /^(p|t|pt)$/.test(raw.sides)) hand.sides = raw.sides;
	if (Number.isInteger(raw.st) && (raw.st as number) > 0) hand.st = Math.min(raw.st as number, STREAK_MAX);
	const lk = cleanLuck(raw.lk);
	if (lk) hand.lk = lk;
	if (raw.ok === 1) hand.ok = 1;
	return hand;
}

function cleanRound(raw: unknown): TableRound | null {
	if (!isObject(raw) || typeof raw.id !== 'string' || !isMemberId(raw.id) || !Number.isInteger(raw.seed) || !isTime(raw.open) || !isTime(raw.dealAt)) return null;
	if (!isObject(raw.hands)) return null;
	const hands: Record<string, TableHand> = {};
	const taken = new Set<number>();
	for (const [id, h] of Object.entries(raw.hands)) {
		const hand = isMemberId(id) ? cleanHand(h) : null;
		// two hands can't share a seat's cards
		if (!hand || taken.has(hand.n)) continue;
		taken.add(hand.n);
		hands[id] = hand;
	}
	if (!Object.keys(hands).length) return null;
	const round: TableRound = { id: raw.id, seed: (raw.seed as number) >>> 0, open: Math.round(raw.open), dealAt: Math.round(raw.dealAt), hands };
	if (isTime(raw.done)) round.done = Math.round(raw.done);
	const dc = cleanDealer(raw.dc);
	if (dc && typeof raw.di === 'string' && /^[A-Za-z0-9_-]{4,32}$/.test(raw.di)) {
		round.dc = dc;
		round.di = raw.di;
	}
	return round;
}

export function fromTableWire(raw: unknown): TableDoc | null {
	if (!isObject(raw) || raw.app !== APP_ID || raw.bj !== TABLE_FORMAT) return null;
	const seats: Record<string, TableSeat> = {};
	if (isObject(raw.seats)) {
		const taken = new Set<number>();
		const list = Object.entries(raw.seats)
			.map(([id, s]) => [id, isMemberId(id) ? cleanSeat(s) : null] as const)
			.filter((x): x is readonly [string, TableSeat] => x[1] !== null)
			.sort((a, b) => b[1].seen - a[1].seen);
		// the newest hello keeps a seat number two seats somehow share
		for (const [id, s] of list) {
			if (taken.has(s.n)) continue;
			taken.add(s.n);
			seats[id] = s;
		}
	}
	const round = raw.round == null ? null : cleanRound(raw.round);
	const past = (Array.isArray(raw.past) ? raw.past : [])
		.map(cleanRound)
		.filter((r): r is TableRound => r !== null && r.done !== undefined)
		.sort((a, b) => (b.done ?? 0) - (a.done ?? 0))
		.slice(0, PAST_MAX);
	return { seats, round, past };
}

export function toTableWire(doc: TableDoc) {
	return { app: APP_ID, bj: TABLE_FORMAT, seats: doc.seats, round: doc.round, past: doc.past };
}

// ---------------------------------------------------------------------------------------------
// The cards

const shoes = new Map<number, Card[]>();

/** The round's shoe (the same for every page with the same seed). */
export function roundShoe(seed: number): Card[] {
	let shoe = shoes.get(seed);
	if (!shoe) {
		shoe = newShoe(seeded(seed));
		shoes.set(seed, shoe);
		if (shoes.size > 6) shoes.delete(shoes.keys().next().value as number);
	}
	return shoe;
}

/** The k-th card of a seat's stretch (the dealer's = SEATS). */
export const cardAt = (shoe: Card[], stream: number, k: number): Card => shoe[stream * STREAM + Math.min(k, STREAM - 1)];

/**
 * How good a seat's stretch is against the dealer's (for luck): a plain hit-to-17 hand played out
 * against the dealer drawing to 17. +1.5 blackjack, +1 win, 0 push, −1 loss; the first two cards'
 * total breaks a tie (a hand the player plays differently may still go another way: it's luck).
 */
export function stretchScore(player: Card[], dealer: Card[]): number {
	const p = player.slice(0, 2);
	const d = dealer.slice(0, 2);
	const tie = handValue(p).total / 100;
	if (isBlackjack(p)) return (isBlackjack(d) ? 0 : 1.5) + tie;
	if (isBlackjack(d)) return -1 + tie;
	for (let k = 2; handValue(p).total < 17 && k < player.length; k++) p.push(player[k]);
	const pt = handValue(p).total;
	if (pt > 21) return -1 + tie;
	for (let k = 2; handValue(d).total < 17 && k < dealer.length; k++) d.push(dealer[k]);
	const dt = handValue(d).total;
	return (dt > 21 || pt > dt ? 1 : pt === dt ? 0 : -1) + tie;
}

const rigged = new Map<string, Card[]>();

/**
 * The round's cards (Abscar's control room, casino-rig.ts): the seeded shoe, with the dealer's stretch
 * starting with the cards Abscar picked (`dc`), and each hand with luck (`lk`) choosing between its own
 * stretch and the spare stretches at the end of the shoe (one more per ±50 of luck, in seat order,
 * never two seats the same one): the best one against the dealer (plus) or the worst (minus), swapped
 * in. Worked out from the round alone, so every page deals exactly the same.
 */
export function tableShoe(r: Pick<TableRound, 'seed' | 'hands' | 'dc'>): Card[] {
	const base = roundShoe(r.seed);
	const lucky = Object.values(r.hands)
		.filter((h) => h.lk)
		.sort((a, b) => a.n - b.n);
	if (!r.dc?.length && !lucky.length) return base;
	const key = `${r.seed}|${r.dc?.join('.') ?? ''}|${lucky.map((h) => `${h.n}:${h.lk}`).join(',')}`;
	const known = rigged.get(key);
	if (known) return known;
	const shoe = base.slice();
	const at = (stream: number) => stream * STREAM;
	(r.dc ?? []).slice(0, STREAM).forEach((rank, k) => (shoe[at(DEALER) + k] = { r: rank, s: shoe[at(DEALER) + k].s }));
	const dealer = shoe.slice(at(DEALER), at(DEALER) + STREAM);
	const stretch = (stream: number) => shoe.slice(at(stream), at(stream) + STREAM);
	const streams = Math.floor(shoe.length / STREAM);
	let spare = DEALER + 1;
	for (const h of lucky) {
		const lk = h.lk ?? 0;
		const rand = seeded((r.seed ^ Math.imul(h.n + 1, 0x9e3779b1)) >>> 0);
		const extra = extraDraws(lk, rand);
		let best = h.n;
		let bestScore = stretchScore(stretch(h.n), dealer);
		for (let i = 0; i < extra && spare < streams; i++, spare++) {
			const s = stretchScore(stretch(spare), dealer);
			if (lk > 0 ? s > bestScore : s < bestScore) {
				best = spare;
				bestScore = s;
			}
		}
		if (best !== h.n) {
			const mine = stretch(h.n);
			stretch(best).forEach((c, k) => (shoe[at(h.n) + k] = c));
			mine.forEach((c, k) => (shoe[at(best) + k] = c));
		}
	}
	rigged.set(key, shoe);
	if (rigged.size > 6) rigged.delete(rigged.keys().next().value as string);
	return shoe;
}

export type HandStatus = 'playing' | 'stood' | 'bust' | 'blackjack' | 'twentyOne' | 'doubled' | 'timeout';

export interface HandPlay {
	cards: Card[];
	doubled: boolean;
	finished: boolean;
	status: HandStatus;
}

/** A seat's hand from its actions. A dealer blackjack ends every hand at once. */
export function playHand(shoe: Card[], n: number, acts: string, dealerBj: boolean): HandPlay {
	const cards = [cardAt(shoe, n, 0), cardAt(shoe, n, 1)];
	if (isBlackjack(cards)) return { cards, doubled: false, finished: true, status: 'blackjack' };
	if (dealerBj) return { cards, doubled: false, finished: true, status: 'stood' };
	for (const a of acts) {
		if (a === 's') return { cards, doubled: false, finished: true, status: 'stood' };
		if (a === 'd' && cards.length !== 2) continue;
		cards.push(cardAt(shoe, n, cards.length));
		const total = handValue(cards).total;
		if (a === 'd') return { cards, doubled: true, finished: true, status: total > 21 ? 'bust' : 'doubled' };
		if (total > 21) return { cards, doubled: false, finished: true, status: 'bust' };
		if (total === 21) return { cards, doubled: false, finished: true, status: 'twentyOne' };
	}
	return { cards, doubled: false, finished: false, status: 'playing' };
}

/** The dealer's two cards (up card first). */
export const dealerStart = (shoe: Card[]): Card[] => [cardAt(shoe, DEALER, 0), cardAt(shoe, DEALER, 1)];

/** The dealer's final hand: draws to 17 (stands on a soft 17) unless every hand is bust or a blackjack. */
export function dealerFinal(shoe: Card[], hands: HandPlay[]): Card[] {
	const out = dealerStart(shoe);
	if (isBlackjack(out) || !hands.some((h) => h.status !== 'bust' && h.status !== 'blackjack')) return out;
	while (handValue(out).total < 17 && out.length < STREAM) out.push(cardAt(shoe, DEALER, out.length));
	return out;
}

// ---------------------------------------------------------------------------------------------
// What a round looks like right now

export type Phase = 'betting' | 'play' | 'settle' | 'done';

export interface SideOut {
	bet: SideBet;
	kind: PairKind | ThreeKind | null;
	net: number;
}

export interface SeatPlay {
	id: string;
	hand: TableHand;
	/** null while bets are open (no cards yet). */
	play: HandPlay | null;
	/** When this hand stands by itself (null once it's finished). */
	deadline: number | null;
	/** The side bets, settled on the deal (empty before it). */
	sides: SideOut[];
	/** The free card boost a win would get (first two cards + the dealer's up card). */
	boost: BjBoost | null;
	result?: HandResult;
	/** Everything together: the boosted hand + the side bets. */
	net?: number;
	/** The streak after this hand, the boost multiplier and what it added to a win. */
	streak?: number;
	mult?: number;
	extra?: number;
}

export interface RoundView {
	phase: Phase;
	/** All the dealer's cards so far: the two dealt (the second face down until `done`), then the draws. */
	dealer: Card[];
	dealerBj: boolean;
	/** Seat order. */
	seats: SeatPlay[];
}

/**
 * The round at `now`. `grace` = how much longer than ACT_TIME this page waits before counting a
 * hand as timed out (0 for your own hand, GRACE for the others').
 */
export function viewRound(r: TableRound, now: number, grace = 0): RoundView {
	const entries = Object.entries(r.hands).sort((a, b) => a[1].n - b[1].n);
	if (!r.done && now < r.dealAt) {
		return { phase: 'betting', dealer: [], dealerBj: false, seats: entries.map(([id, hand]) => ({ id, hand, play: null, deadline: null, sides: [], boost: null })) };
	}
	const shoe = tableShoe(r);
	const start = dealerStart(shoe);
	const dealerBj = isBlackjack(start);
	const seats: SeatPlay[] = entries.map(([id, hand]) => {
		const played = playHand(shoe, hand.n, hand.acts, dealerBj);
		const two = played.cards.slice(0, 2);
		const sides = handSides(hand).map((bet) => ({ bet, ...sideResult(bet, two, start[0], hand.bet) }));
		const boost = cardBoost(two, start[0]);
		const timedOut = !played.finished && !!r.done;
		const play = timedOut ? { ...played, finished: true, status: 'timeout' as const } : played;
		const deadline = play.finished ? null : Math.max(r.dealAt, hand.at) + ACT_TIME;
		return { id, hand, play, deadline, sides, boost };
	});
	if (!r.done) {
		const settled = seats.every((s) => s.play!.finished || now >= (s.deadline ?? 0) + grace);
		return { phase: settled ? 'settle' : 'play', dealer: start, dealerBj, seats };
	}
	const dealer = dealerFinal(
		shoe,
		seats.map((s) => s.play!)
	);
	for (const s of seats) {
		s.result = handResult(s.play!.cards, dealer);
		const base = handNet(s.result, s.hand.bet, s.play!.doubled);
		s.streak = nextStreak(s.hand.st ?? 0, s.result);
		const boosted = boostedNet(base, s.boost, s.streak);
		s.mult = boosted.mult;
		s.extra = boosted.net - base;
		s.net = boosted.net + s.sides.reduce((n, x) => n + x.net, 0);
	}
	return { phase: 'done', dealer, dealerBj, seats };
}

/** True when the hand's own page may still act on it (finished or past its own time = no). */
export function canAct(r: TableRound | null, id: string, dev: string, now: number): boolean {
	if (!r || r.done || now < r.dealAt) return false;
	const hand = r.hands[id];
	if (!hand || hand.dev !== dev) return false;
	const seat = viewRound(r, now, 0).seats.find((s) => s.id === id);
	return !!seat?.play && !seat.play.finished && now < (seat.deadline ?? 0);
}

// ---------------------------------------------------------------------------------------------
// Seats

export const isFresh = (s: TableSeat, now: number) => now - s.seen < SEAT_FRESH;

/** Empty seats gone; settled rounds trimmed (kept while someone hasn't booked theirs). */
export function pruneTable(doc: TableDoc, now: number): TableDoc {
	const seats = Object.fromEntries(Object.entries(doc.seats).filter(([, s]) => isFresh(s, now)));
	const past = doc.past.filter((r, i) => i < PAST_KEEP || (i < PAST_MAX && now - (r.done ?? 0) < PAST_AGE && Object.values(r.hands).some((h) => !h.ok)));
	return { ...doc, seats, past };
}

/** The table's seats right now, in seat order, with the member ids. */
export function seatedNow(doc: TableDoc | null, now: number): { id: string; seat: TableSeat }[] {
	return Object.entries(doc?.seats ?? {})
		.filter(([, s]) => isFresh(s, now))
		.map(([id, seat]) => ({ id, seat }))
		.sort((a, b) => a.seat.n - b.seat.n);
}

export type SitResult = 'ok' | 'other-device' | 'full';

/** Why you can't sit (before trying): you're at the table on another device, or it's full. */
export function sitCheck(doc: TableDoc | null, me: Sitter, now: number): SitResult {
	if (!doc) return 'ok';
	const mine = doc.seats[me.id];
	if (mine && mine.dev !== me.dev && isFresh(mine, now)) return 'other-device';
	return freeSeat(doc, me.id, now) === null ? 'full' : 'ok';
}

function freeSeat(doc: TableDoc, id: string, now: number): number | null {
	const taken = new Set<number>();
	for (const [other, s] of Object.entries(doc.seats)) if (other !== id && isFresh(s, now)) taken.add(s.n);
	const live = doc.round && !doc.round.done ? doc.round : null;
	for (const [other, h] of Object.entries(live?.hands ?? {})) if (other !== id) taken.add(h.n);
	const mine = doc.seats[id] ?? live?.hands[id];
	if (mine && !taken.has(mine.n)) return mine.n;
	for (let n = 0; n < SEATS; n++) if (!taken.has(n)) return n;
	return null;
}

/** Sit down (or say hello from the seat you have). Null = can't (sitCheck says why). */
export function sit(doc: TableDoc, me: Sitter, now: number): TableDoc | null {
	const d = pruneTable(doc, now);
	if (sitCheck(d, me, now) !== 'ok') return null;
	const n = freeSeat(d, me.id, now);
	if (n === null) return null;
	const seat: TableSeat = { n, name: cleanName(me.name) || '?', ...(me.op ? { op: me.op } : {}), dev: me.dev, seen: Math.round(now) };
	return { ...d, seats: { ...d.seats, [me.id]: seat } };
}

/** Get up (only from your own device's seat). */
export function leave(doc: TableDoc, id: string, dev: string, now: number): TableDoc | null {
	const d = pruneTable(doc, now);
	if (d.seats[id]?.dev !== dev) return null;
	const { [id]: _gone, ...seats } = d.seats;
	return { ...d, seats };
}

// ---------------------------------------------------------------------------------------------
// Bets, actions, settling

/** When a settled round lets the next one open. */
export function nextOpenAt(r: TableRound): number {
	return (r.done ?? 0) + (Object.keys(r.hands).length > 1 ? RESULT_PAUSE : 0);
}

export type BetState =
	/** no seat on this device (watching) */
	| 'seat'
	/** in the round being played */
	| 'in'
	/** bets are open: you can still join */
	| 'join'
	/** a hand is being played without you */
	| 'wait'
	/** the last hand just ended (a moment to see it) */
	| 'pause'
	/** nothing going on: your bet opens a hand */
	| 'open';

export function betState(doc: TableDoc | null, id: string, dev: string, now: number): BetState {
	const seat = doc?.seats[id];
	const r = doc?.round ?? null;
	if (r && !r.done && r.hands[id]?.dev === dev) return 'in';
	if (!seat || seat.dev !== dev || !isFresh(seat, now)) return 'seat';
	if (r && !r.done) return now < r.dealAt && !r.hands[id] ? 'join' : 'wait';
	if (r?.done && now < nextOpenAt(r)) return 'pause';
	return 'open';
}

/** The round settled if it's due (every hand finished, or the others' time ran out): `done`. */
export function finish(doc: TableDoc, time: number): TableDoc | null {
	const now = Math.round(time);
	const r = doc.round;
	if (!r || r.done || viewRound(r, now, GRACE).phase !== 'settle') return null;
	return { ...doc, round: { ...r, done: now } };
}

const orFinished = (doc: TableDoc, now: number) => finish(doc, now) ?? doc;

/**
 * Put in a bet: opens a hand (alone at the table it deals at once), or joins the one whose bets are
 * open. `fresh` = id + seed for a new round; `extra` = side bets and your win streak so far. Null =
 * not now (betState says why) or a bad amount.
 */
export function placeBet(
	doc: TableDoc,
	me: Sitter,
	amount: number,
	time: number,
	fresh: { id: string; seed: number; dc?: number[]; di?: string },
	extra: { sides?: SideBet[]; streak?: number; luck?: number } = {}
): TableDoc | null {
	const now = Math.round(time);
	const d = pruneTable(doc, now);
	const seat = d.seats[me.id];
	if (!seat || seat.dev !== me.dev) return null;
	if (!Number.isInteger(amount) || amount < 1 || amount > CASINO_MAX_BET) return null;
	const at = now;
	const sides = SIDE_BETS.filter((k) => extra.sides?.includes(k))
		.map((k) => SIDE_CODE[k])
		.join('');
	const st = Number.isInteger(extra.streak) && (extra.streak as number) > 0 ? Math.min(extra.streak as number, STREAK_MAX) : 0;
	const lk = cleanLuck(extra.luck);
	const hand: TableHand = { n: seat.n, name: seat.name, ...(seat.op ? { op: seat.op } : {}), dev: me.dev, bet: amount, acts: '', at, ...(sides ? { sides } : {}), ...(st ? { st } : {}), ...(lk ? { lk } : {}) };
	const r = d.round;
	if (r && !r.done) {
		if (now >= r.dealAt || r.hands[me.id] || Object.values(r.hands).some((h) => h.n === seat.n)) return null;
		const hands = { ...r.hands, [me.id]: hand };
		// everyone seated is in: deal now
		const all = seatedNow(d, now).every((s) => hands[s.id]);
		return orFinished({ ...d, round: { ...r, hands, dealAt: all ? Math.min(r.dealAt, at) : r.dealAt } }, now);
	}
	if (r?.done && now < nextOpenAt(r)) return null;
	const others = seatedNow(d, now).some((s) => s.id !== me.id);
	const round: TableRound = { id: fresh.id, seed: fresh.seed >>> 0, open: at, dealAt: others ? at + BET_WINDOW : at, hands: { [me.id]: hand } };
	const dc = cleanDealer(fresh.dc);
	if (dc && fresh.di) {
		round.dc = dc;
		round.di = fresh.di;
	}
	return orFinished(pruneTable({ ...d, round, past: r ? [r, ...d.past] : d.past }, now), now);
}

/** Close the bets now (anyone in the hand may). */
export function dealNow(doc: TableDoc, id: string, dev: string, time: number): TableDoc | null {
	const now = Math.round(time);
	const r = doc.round;
	if (!r || r.done || now >= r.dealAt || r.hands[id]?.dev !== dev) return null;
	return orFinished({ ...doc, round: { ...r, dealAt: now } }, now);
}

export type Act = 'h' | 's' | 'd';

/** Hit, stand or double on your own hand. The write that finishes the last hand settles the round. */
export function act(doc: TableDoc, id: string, dev: string, kind: Act, time: number): TableDoc | null {
	const now = Math.round(time);
	const r = doc.round;
	if (!r || !canAct(r, id, dev, now)) return null;
	const h = r.hands[id];
	if (kind === 'd' && playHand(tableShoe(r), h.n, h.acts, false).cards.length !== 2) return null;
	const hands = { ...r.hands, [id]: { ...h, acts: h.acts + kind, at: Math.max(now, h.at) } };
	return orFinished({ ...doc, round: { ...r, hands } }, now);
}

/** Your stake still on the table (held back from the balance): the bet (twice when doubled) + side bets. */
export function liveStake(doc: TableDoc | null, id: string, dev: string, now: number): number {
	const r = doc?.round;
	const h = r?.hands[id];
	if (!r || r.done || !h || h.dev !== dev) return 0;
	const play = now >= r.dealAt ? playHand(tableShoe(r), h.n, h.acts, false) : null;
	return h.bet * ((play?.doubled ? 2 : 1) + handSides(h).length);
}

export interface MyResult {
	id: string;
	result: HandResult;
	/** Everything together (boosted hand + side bets). */
	net: number;
	doubled: boolean;
	done: number;
	/** Your win streak after this hand. */
	streak: number;
	/** The boost multiplier and what it added to a win. */
	mult: number;
	extra: number;
	sides: SideOut[];
}

/** Settled hands of yours on this device not booked yet (oldest first). */
export function unbooked(doc: TableDoc | null, id: string, dev: string): MyResult[] {
	if (!doc) return [];
	const rounds = [...(doc.round?.done ? [doc.round] : []), ...doc.past];
	const out: MyResult[] = [];
	for (const r of rounds) {
		const h = r.hands[id];
		if (!h || h.dev !== dev || h.ok) continue;
		const seat = viewRound(r, r.done ?? 0).seats.find((s) => s.id === id);
		if (seat?.result && seat.net !== undefined) {
			out.push({ id: r.id, result: seat.result, net: seat.net, doubled: !!seat.play?.doubled, done: r.done ?? 0, streak: seat.streak ?? 0, mult: seat.mult ?? 1, extra: seat.extra ?? 0, sides: seat.sides });
		}
	}
	return out.sort((a, b) => a.done - b.done);
}

/** Your booked hands marked `ok` (the round then needn't wait for you). */
export function markBooked(doc: TableDoc, id: string, roundIds: readonly string[]): TableDoc {
	if (!roundIds.length) return doc;
	const ids = new Set(roundIds);
	const mark = (r: TableRound): TableRound => (ids.has(r.id) && r.done && r.hands[id] && !r.hands[id].ok ? { ...r, hands: { ...r.hands, [id]: { ...r.hands[id], ok: 1 } } } : r);
	return { ...doc, round: doc.round ? mark(doc.round) : null, past: doc.past.map(mark) };
}
