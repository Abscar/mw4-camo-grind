/**
 * Pure helpers for the squad's step 3 (2026-11-14; the user picked five more ideas from the
 * "Squad link features brainstorm" session, then asked for "hours played today"):
 *
 * - Time with the tracker open per day ("Played today"), counted by each member's own page.
 * - Squad up: 3 or more online at once → party mode; when the squad usually plays (tick times).
 * - Tonight's roulette: one spin, the same result on every page (the spinner's page draws the
 *   guns and stores them; the wheel starts a little later so everyone has it by then).
 * - The burger bank: pretend burgers, never money. Earned from camos, bet on duels and the race
 *   to Divergence; a real-burger IOU per lost duel.
 * - Squad TV (channel 99): squad events for the old TV's news screen.
 * - Squad Wrapped: the week in numbers (Monday 00:00 to Sunday, like the grind stats).
 *
 * No browser APIs and no runes, so Node tests it directly (scripts/squad.test.js).
 */

import { DIVERGENCE_REQUIRED, MAX_LEVEL } from './data/camos.ts';
import { CLASSES, WEAPONS, WEAPON_BY_ID } from './data/weapons.ts';
import {
	camosThisWeek,
	cleanPlayed,
	divergenceCount,
	duelResult,
	isOnline,
	masteryStatuses,
	weeklyMvps,
	BET_MAX,
	MAX_BETS,
	SETTLED_MAX,
	type Bet,
	type SquadDoc,
	type SquadMember
} from './squad-codec.ts';
import { startOfDay, startOfWeek } from './stats.ts';
import { isReleased } from './steps.ts';
import { casinoTotal, dailyTotal, HOUSE_OP } from './squad-casino.ts';

const DAY = 86_400_000;
const HOUR = 3_600_000;

// ---------------------------------------------------------------------------------------------
// Played today: minutes with the tracker open.

/** Two page checks further apart than this mean the page was closed or the computer slept: not counted. */
export const PLAY_GAP_MS = 3 * 60_000;

/** "YYYY-MM-DD" in this device's own time. */
export function dayKey(ms: number): string {
	const d = new Date(ms);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Add the time between two checks of an open page (`last` → `now`) to the day it ended on.
 * A gap over PLAY_GAP_MS (closed page, sleeping computer) adds nothing.
 */
export function addPlayed(played: Record<string, number> | undefined, last: number, now: number): Record<string, number> {
	const gap = now - last;
	const out = { ...played };
	if (gap > 0 && gap <= PLAY_GAP_MS) {
		const key = dayKey(now);
		out[key] = (out[key] ?? 0) + gap / 60_000;
	}
	return Object.fromEntries(
		Object.entries(out)
			.sort(([a], [b]) => (a < b ? 1 : -1))
			.slice(0, 14)
			.map(([k, v]) => [k, Math.min(1440, v)])
	);
}

/** Two copies of the same member's minutes (two devices): the bigger number per day. */
export function mergePlayed(a: Record<string, number> | undefined, b: Record<string, number> | undefined): Record<string, number> {
	const out: Record<string, number> = { ...a };
	for (const [k, v] of Object.entries(b ?? {})) out[k] = Math.max(out[k] ?? 0, v);
	return out;
}

/** Whole minutes played on a day ("YYYY-MM-DD"). */
export function playedOn(m: Pick<SquadMember, 'played'>, key: string): number {
	return Math.floor(m.played?.[key] ?? 0);
}

/** Minutes played Monday 00:00 → `to` (for Wrapped). */
export function playedBetween(m: Pick<SquadMember, 'played'>, from: number, to: number): number {
	let n = 0;
	for (let day = startOfDay(from); day < to; day = startOfDay(day + DAY + 2 * HOUR)) n += m.played?.[dayKey(day)] ?? 0;
	return Math.floor(n);
}

export { cleanPlayed };

// ---------------------------------------------------------------------------------------------
// Squad up + when the squad usually plays.

/** Party mode from this many online at once (you included). */
export const SQUAD_UP = 3;

/** The time slot with the most ticks: a weekday (0 = Monday) and a two-hour window. */
export interface Slot {
	day: number;
	from: number;
	ticks: number;
}

/**
 * When the squad usually plays, from everyone's tick times of the last weeks (this device's time):
 * the weekday + two-hour window with the most camos, if there's enough to go on (at least 8 ticks
 * there, on at least 2 different dates). The windows start at even hours.
 */
export function usualSlot(members: Pick<SquadMember, 'recent'>[]): Slot | null {
	const buckets = new Map<string, { ticks: number; dates: Set<string> }>();
	for (const m of members) {
		for (const ms of Object.values(m.recent ?? {}).flat()) {
			if (!(ms > 0)) continue;
			const d = new Date(ms);
			const key = `${(d.getDay() + 6) % 7}:${d.getHours() - (d.getHours() % 2)}`;
			const b = buckets.get(key) ?? { ticks: 0, dates: new Set() };
			b.ticks++;
			b.dates.add(dayKey(ms));
			buckets.set(key, b);
		}
	}
	let best: Slot | null = null;
	for (const [key, b] of buckets) {
		if (b.ticks < 8 || b.dates.size < 2) continue;
		const [day, from] = key.split(':').map(Number);
		if (!best || b.ticks > best.ticks || (b.ticks === best.ticks && day * 24 + from < best.day * 24 + best.from)) best = { day, from, ticks: b.ticks };
	}
	return best;
}

// ---------------------------------------------------------------------------------------------
// Tonight's roulette.

/** The wheel starts this long after the spin was pressed, so every open page has it by then (they read every 30 s). */
export const SPIN_LEAD_MS = 40_000;
/** How long the wheel spins. */
export const SPIN_MS = 6_000;
/** A roulette counts as tonight's for this long. */
export const ROULETTE_MS = 12 * HOUR;

/** A small seeded random number generator (mulberry32): the same seed gives the same draws. */
export function seeded(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let x = a;
		x = Math.imul(x ^ (x >>> 15), x | 1);
		x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
	};
}

/** Guns that are out and that none of these members has maxed. */
export function roulettePool(members: Pick<SquadMember, 'weapons'>[]): string[] {
	return WEAPONS.filter((w) => isReleased(w) && members.every((m) => (m.weapons[w.id] ?? 0) < MAX_LEVEL)).map((w) => w.id);
}

function shuffled<T>(list: T[], rand: () => number): T[] {
	const out = [...list];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/**
 * Draw tonight's guns for `ids` (in that order): 'each' gives everyone a different gun nobody in
 * the group has maxed (the same one again only if there are too few); 'class' first draws a class
 * that has such guns, then a gun of it each. null when every gun is maxed by someone.
 */
export function spin(
	members: Record<string, Pick<SquadMember, 'weapons'>>,
	ids: string[],
	mode: 'each' | 'class',
	seed: number
): { cls?: string; picks: Record<string, string> } | null {
	const rand = seeded(seed);
	const group = ids.map((id) => members[id]).filter(Boolean);
	let pool = roulettePool(group);
	if (!pool.length || !ids.length) return null;
	let cls: string | undefined;
	if (mode === 'class') {
		const classes = CLASSES.filter((c) => c.weapons.some((w) => pool.includes(w.id)));
		cls = classes[Math.floor(rand() * classes.length)].id;
		pool = pool.filter((id) => WEAPON_BY_ID.get(id)?.classId === cls);
	}
	const picks: Record<string, string> = {};
	let bag: string[] = [];
	for (const id of ids) {
		if (!bag.length) bag = shuffled(pool, rand);
		picks[id] = bag.pop()!;
	}
	return cls ? { cls, picks } : { picks };
}

/** Classes the wheel shows (in catalogue order) for a 'class' spin, or the drawn guns for 'each'. */
export function wheelSegments(r: { mode: 'each' | 'class'; picks: Record<string, string> }, pool: string[]): string[] {
	if (r.mode === 'class') return CLASSES.filter((c) => c.weapons.some((w) => pool.includes(w.id) || Object.values(r.picks).includes(w.id))).map((c) => c.id);
	return [...new Set(Object.values(r.picks))];
}

/** How far into the spin we are: 'wait' (counting down), 0–1 while it spins, 'done'. */
export function spinPhase(at: number, now: number): 'wait' | 'done' | number {
	if (now < at) return 'wait';
	if (now >= at + SPIN_MS) return 'done';
	return (now - at) / SPIN_MS;
}

// ---------------------------------------------------------------------------------------------
// The burger bank (pretend burgers, never money).

export const BURGERS = { start: 10, gold: 1, platinum: 2, harmonicBreak: 3, mastery: 10, divergence: 25 } as const;
const LEVEL_BURGERS = [0, BURGERS.gold, BURGERS.gold + BURGERS.platinum, BURGERS.gold + BURGERS.platinum + BURGERS.harmonicBreak];

/** Burgers a member earned from the grind (the start gift included). */
export function burgersEarned(m: Pick<SquadMember, 'weapons' | 'mastery'>): number {
	let n: number = BURGERS.start;
	for (const level of Object.values(m.weapons)) n += LEVEL_BURGERS[level] ?? 0;
	if (divergenceCount(m.weapons) >= DIVERGENCE_REQUIRED) n += BURGERS.divergence;
	const statuses = masteryStatuses(m.weapons, m.mastery);
	n += Object.values(statuses).flat().filter((s) => s === 'complete').length * BURGERS.mastery;
	return n;
}

type Members = Record<string, Pick<SquadMember, 'weapons' | 'recent' | 'name'>>;
/** What the bank needs of a member: the grind, the daily bonus, the casino and who's the house (2026-11-16). */
type BankMember = Pick<SquadMember, 'weapons' | 'mastery' | 'recent' | 'name' | 'online' | 'casino'> & Partial<Pick<SquadMember, 'op'>>;

/** The member who is the house (squad-casino.ts HOUSE_OP), the lowest id if two picked that operator; null without one. */
export function houseOf(members: Record<string, Partial<Pick<SquadMember, 'op'>>>): string | null {
	return Object.keys(members).filter((id) => members[id].op === HOUSE_OP).sort()[0] ?? null;
}

/** A duel's result, still on the list or taken off it: null while on, 'gone' if nobody knows any more. */
export function duelOutcome(id: string, doc: SquadDoc, members: Members): { winner: string | null; loser: string | null; draw: boolean } | null | 'gone' {
	const duel = doc.duels?.find((d) => d.id === id);
	if (duel) return duelResult(duel, members);
	const s = doc.settled?.find((x) => x.id === id);
	return s ? { winner: s.w, loser: s.l, draw: false } : 'gone';
}

/** When a member got their 33rd Harmonic Break (by their tick times), if known. */
function divergenceAt(m: Pick<SquadMember, 'weapons' | 'recent'>): number | null {
	if (divergenceCount(m.weapons) < DIVERGENCE_REQUIRED) return null;
	const times = WEAPONS.filter((w) => (m.weapons[w.id] ?? 0) >= MAX_LEVEL).map((w) => m.recent?.[w.id]?.[MAX_LEVEL - 1] ?? 0);
	// an unknown time (older than the published weeks) = can't tell when: 0
	if (times.some((x) => !x)) return 0;
	return times.sort((a, b) => a - b)[DIVERGENCE_REQUIRED - 1] ?? 0;
}

/** The race to Divergence: null while nobody has it; the winner; 'draw' when it can't be told apart. */
export function raceWinner(members: Members): string | 'draw' | null {
	const done = Object.entries(members)
		.map(([id, m]) => [id, divergenceAt(m)] as const)
		.filter(([, at]) => at !== null) as [string, number][];
	if (!done.length) return null;
	if (done.length === 1) return done[0][0];
	if (done.some(([, at]) => !at)) return 'draw';
	done.sort((a, b) => a[1] - b[1]);
	return done[0][1] === done[1][1] ? 'draw' : done[0][0];
}

export type BetState = 'open' | 'won' | 'lost' | 'void';

export function betOutcome(bet: Bet, doc: SquadDoc, members: Members): BetState {
	if (bet.kind === 'race') {
		const w = raceWinner(members);
		return w === null ? 'open' : w === 'draw' ? 'void' : w === bet.pick ? 'won' : 'lost';
	}
	const res = duelOutcome(bet.ref, doc, members);
	if (res === null) return 'open';
	if (res === 'gone' || res.draw) return 'void';
	return res.winner === bet.pick ? 'won' : 'lost';
}

export interface BankRow {
	/** From the grind (camos, the start gift). */
	earned: number;
	/** The daily bonus so far (squad-casino.ts). */
	daily: number;
	/** BurgiCasino: won minus lost (can be below zero). */
	casino: number;
	/** The house only: what everyone else lost in BurgiCasino and on bets. */
	house: number;
	won: number;
	lost: number;
	/** Burgers on open bets. */
	held: number;
	balance: number;
}

/**
 * Everyone's burgers: earned + daily bonus + casino + bets won − bets lost − burgers on open bets, and
 * for the house (Abscar) everything the others lost in the casino and on bets. Never below zero on show.
 */
export function burgerBank(doc: SquadDoc, members: Record<string, BankMember>): Record<string, BankRow> {
	const out: Record<string, BankRow> = {};
	for (const [id, m] of Object.entries(members)) {
		out[id] = { earned: burgersEarned(m), daily: dailyTotal(m.online?.n ?? 0), casino: casinoTotal(m.casino).net, house: 0, won: 0, lost: 0, held: 0, balance: 0 };
	}
	for (const bet of doc.bets ?? []) {
		const row = out[bet.by];
		if (!row) continue;
		const state = betOutcome(bet, doc, members);
		if (state === 'won') row.won += bet.amount;
		else if (state === 'lost') row.lost += bet.amount;
		else if (state === 'open') row.held += bet.amount;
	}
	const house = houseOf(members);
	if (house && out[house]) {
		for (const [id, m] of Object.entries(members)) if (id !== house) out[house].house += casinoTotal(m.casino).lost + out[id].lost;
	}
	for (const row of Object.values(out)) row.balance = Math.max(0, row.earned + row.daily + row.casino + row.house + row.won - row.lost - row.held);
	return out;
}

/** A new bet, or null (too many, not enough burgers, already decided, same bet twice). */
export function withBet(doc: SquadDoc, bet: Bet, members: Record<string, BankMember>): SquadDoc | null {
	const bets = doc.bets ?? [];
	if (bets.length >= MAX_BETS || bet.amount < 1 || bet.amount > BET_MAX) return null;
	if (betOutcome(bet, doc, members) !== 'open') return null;
	if (bets.some((b) => b.by === bet.by && b.kind === bet.kind && b.ref === bet.ref && betOutcome(b, doc, members) === 'open')) return null;
	if ((burgerBank(doc, members)[bet.by]?.balance ?? 0) < bet.amount) return null;
	return { ...doc, bets: [...bets, bet] };
}

/** Take back an open bet. */
export function withoutBet(doc: SquadDoc, id: string): SquadDoc {
	return { ...doc, bets: (doc.bets ?? []).filter((b) => b.id !== id) };
}

/** Drop decided bets nobody needs any more when the list is full (keeps the newest). */
function trimBets(doc: SquadDoc, members: Members): SquadDoc {
	const bets = doc.bets ?? [];
	if (bets.length < MAX_BETS) return doc;
	const open = bets.filter((b) => betOutcome(b, doc, members) === 'open');
	return { ...doc, bets: [...bets.filter((b) => !open.includes(b)).slice(-(MAX_BETS - open.length - 1)), ...open] };
}

/** Take a duel off the list; a finished one keeps its result (bets, IOUs). */
export function settleDuel(doc: SquadDoc, id: string, members: Members): SquadDoc {
	const duel = doc.duels?.find((d) => d.id === id);
	const next: SquadDoc = { ...doc, duels: (doc.duels ?? []).filter((d) => d.id !== id) };
	const res = duel ? duelResult(duel, members) : null;
	if (res?.winner && res.loser) next.settled = [...(doc.settled ?? []), { id, w: res.winner, l: res.loser }].slice(-SETTLED_MAX);
	return trimBets(next, members);
}

export interface Debt {
	from: string;
	to: string;
	n: number;
	/** The duels behind it (marked paid together). */
	ids: string[];
}

/** Real-burger IOUs: one per lost duel not marked paid, netted between each pair. */
export function debts(doc: SquadDoc, members: Members): Debt[] {
	const paid = new Set(doc.paid ?? []);
	const lost: { id: string; w: string; l: string }[] = [];
	for (const d of doc.duels ?? []) {
		const res = duelResult(d, members);
		if (res?.winner && res.loser && !paid.has(d.id)) lost.push({ id: d.id, w: res.winner, l: res.loser });
	}
	for (const s of doc.settled ?? []) if (!paid.has(s.id) && !lost.some((x) => x.id === s.id)) lost.push(s);
	const pairs = new Map<string, { a: string; b: string; n: number; ids: string[] }>();
	for (const x of lost) {
		const [a, b] = [x.w, x.l].sort();
		const p = pairs.get(`${a}|${b}`) ?? { a, b, n: 0, ids: [] };
		// positive: b owes a
		p.n += x.l === b ? 1 : -1;
		p.ids.push(x.id);
		pairs.set(`${a}|${b}`, p);
	}
	return [...pairs.values()]
		.filter((p) => p.n !== 0)
		.map((p) => (p.n > 0 ? { from: p.b, to: p.a, n: p.n, ids: p.ids } : { from: p.a, to: p.b, n: -p.n, ids: p.ids }));
}

export function withPaid(doc: SquadDoc, ids: string[]): SquadDoc {
	return { ...doc, paid: [...new Set([...(doc.paid ?? []), ...ids])].slice(-SETTLED_MAX * 2) };
}

// ---------------------------------------------------------------------------------------------
// Squad TV, channel 99: what happened in the squad, for the old TV's news screen.

export type SquadEvent =
	| { kind: 'maxed'; who: string; weapon: string; at: number }
	| { kind: 'nuke'; who: string; at: number }
	| { kind: 'duelWon'; who: string; loser: string; weapon: string; at: number }
	| { kind: 'mvp'; who: string; n: number; at: number }
	| { kind: 'mastery'; who: string; n: number; at: number }
	| { kind: 'played'; who: string; min: number; at: number }
	| { kind: 'asleep'; who: string; at: number }
	| { kind: 'missing'; who: string; days: number; at: number }
	| { kind: 'slacker'; who: string; at: number };

/** Kinds that are real news (a fresh one interrupts the TV once); the rest is filler for the ticker. */
export const NEWS_KINDS = new Set<SquadEvent['kind']>(['maxed', 'nuke', 'duelWon']);

/**
 * The squad's headlines, newest news first, then the teasing: maxed weapons and Divergence of the
 * last 2 days, duels won, the week's MVP, most time with the tracker open today, who's asleep while
 * others grind, who's been gone for days, the week's slacker. Names, not ids.
 */
export function squadEvents(entries: { id: string; member: SquadMember }[], doc: SquadDoc | null, now: number): SquadEvent[] {
	const news: SquadEvent[] = [];
	const teasing: SquadEvent[] = [];
	const byId = Object.fromEntries(entries.map((e) => [e.id, e.member]));
	const today = startOfDay(now);
	const tickedToday = new Set<string>();
	for (const { id, member: m } of entries) {
		for (const [weapon, times] of Object.entries(m.recent ?? {})) {
			if (times.some((x) => x >= today)) tickedToday.add(id);
			const hb = times[MAX_LEVEL - 1];
			if (hb && now - hb < 2 * DAY && hb <= now + 60_000) news.push({ kind: 'maxed', who: m.name, weapon, at: hb });
		}
		const div = divergenceAt(m);
		if (div && now - div < 7 * DAY) news.push({ kind: 'nuke', who: m.name, at: div });
		const done = Object.values(masteryStatuses(m.weapons, m.mastery)).flat().filter((s) => s === 'complete').length;
		if (done > 0) teasing.push({ kind: 'mastery', who: m.name, n: done, at: 0 });
	}
	for (const d of doc?.duels ?? []) {
		const res = duelResult(d, byId);
		if (!res?.winner || !res.loser) continue;
		const at = byId[res.winner]?.recent?.[d.weapon]?.[d.goal - 1] ?? 0;
		if (at && now - at < 7 * DAY) news.push({ kind: 'duelWon', who: byId[res.winner].name, loser: byId[res.loser].name, weapon: d.weapon, at });
	}
	const mvps = weeklyMvps(byId, now);
	if (mvps.length === 1) teasing.push({ kind: 'mvp', who: byId[mvps[0]].name, n: camosThisWeek(byId[mvps[0]], now), at: startOfWeek(now) });
	const key = dayKey(now);
	const hours = entries.map((e) => [e.member, playedOn(e.member, key)] as const).sort((a, b) => b[1] - a[1]);
	if (hours[0] && hours[0][1] >= 60) teasing.push({ kind: 'played', who: hours[0][0].name, min: hours[0][1], at: today });
	if (tickedToday.size) {
		for (const { id, member: m } of entries) {
			if (!tickedToday.has(id) && !isOnline(m, now) && now - m.seen < 2 * DAY) teasing.push({ kind: 'asleep', who: m.name, at: today });
		}
	}
	for (const { member: m } of entries) {
		const days = Math.floor((now - m.seen) / DAY);
		if (days >= 2) teasing.push({ kind: 'missing', who: m.name, days, at: m.seen });
	}
	if (entries.length >= 2 && now - startOfWeek(now) >= 2 * DAY) {
		const weeks = entries.map((e) => [e.member, camosThisWeek(e.member, now)] as const).sort((a, b) => a[1] - b[1]);
		if (weeks[0][1] < weeks[1][1] && weeks[weeks.length - 1][1] >= 3) teasing.push({ kind: 'slacker', who: weeks[0][0].name, at: startOfWeek(now) });
	}
	news.sort((a, b) => b.at - a.at);
	return [...news.slice(0, 6), ...teasing];
}

/** A key for the newest real news (the TV shows channel 99 by itself once per new one). */
export function newsKey(events: SquadEvent[]): string | null {
	const e = events.find((x) => NEWS_KINDS.has(x.kind));
	if (!e) return null;
	return `${e.kind}:${e.who}:${'weapon' in e ? e.weapon : ''}:${e.at}`;
}

// ---------------------------------------------------------------------------------------------
// Squad Wrapped: the week in numbers.

/** The week Wrapped is about: on Sundays this week, otherwise last week (Monday 00:00 → next Monday). */
export function wrappedWeek(now: number): { from: number; to: number } {
	const thisWeek = startOfWeek(now);
	const from = new Date(now).getDay() === 0 ? thisWeek : startOfWeek(thisWeek - 12 * HOUR);
	return { from, to: startOfWeek(from + 7 * DAY + 12 * HOUR) };
}

export interface WrappedMember {
	id: string;
	name: string;
	camos: number;
	maxed: string[];
	/** Camos ticked 02:00–06:00. */
	night: number;
	bestDay: { day: number; n: number } | null;
	topClass: { cls: string; n: number } | null;
	minutes: number;
}

export interface Wrapped {
	from: number;
	to: number;
	total: number;
	members: WrappedMember[];
	/** Most camos (shared on a tie). */
	mvps: string[];
	topClass: { cls: string; n: number } | null;
	nightOwl: string | null;
	bestDay: { id: string; day: number; n: number } | null;
	slacker: string | null;
	mostHours: string | null;
}

export function wrapped(members: Record<string, Pick<SquadMember, 'name' | 'recent' | 'played'>>, from: number, to: number): Wrapped {
	const rows: WrappedMember[] = [];
	const squadClasses = new Map<string, number>();
	for (const [id, m] of Object.entries(members)) {
		const days = new Map<number, number>();
		const classes = new Map<string, number>();
		const maxed: string[] = [];
		let camos = 0;
		let night = 0;
		for (const [weapon, times] of Object.entries(m.recent ?? {})) {
			times.forEach((ms, level) => {
				if (!(ms >= from && ms < to)) return;
				camos++;
				if (level === MAX_LEVEL - 1) maxed.push(weapon);
				const h = new Date(ms).getHours();
				if (h >= 2 && h < 6) night++;
				const day = startOfDay(ms);
				days.set(day, (days.get(day) ?? 0) + 1);
				const cls = WEAPON_BY_ID.get(weapon)?.classId;
				if (cls) {
					classes.set(cls, (classes.get(cls) ?? 0) + 1);
					squadClasses.set(cls, (squadClasses.get(cls) ?? 0) + 1);
				}
			});
		}
		const top = <K>(map: Map<K, number>) => [...map].sort((a, b) => b[1] - a[1])[0] ?? null;
		const bd = top(days);
		const tc = top(classes);
		rows.push({
			id,
			name: m.name,
			camos,
			maxed,
			night,
			bestDay: bd ? { day: bd[0], n: bd[1] } : null,
			topClass: tc ? { cls: tc[0], n: tc[1] } : null,
			minutes: playedBetween(m, from, to)
		});
	}
	rows.sort((a, b) => b.camos - a.camos || a.name.localeCompare(b.name));
	const best = rows[0]?.camos ?? 0;
	const owl = [...rows].sort((a, b) => b.night - a.night)[0];
	const day = [...rows].filter((r) => r.bestDay).sort((a, b) => b.bestDay!.n - a.bestDay!.n)[0];
	const hours = [...rows].sort((a, b) => b.minutes - a.minutes)[0];
	const last = rows[rows.length - 1];
	const sq = [...squadClasses].sort((a, b) => b[1] - a[1])[0];
	return {
		from,
		to,
		total: rows.reduce((n, r) => n + r.camos, 0),
		members: rows,
		mvps: best > 0 ? rows.filter((r) => r.camos === best).map((r) => r.id) : [],
		topClass: sq ? { cls: sq[0], n: sq[1] } : null,
		nightOwl: owl && owl.night > 0 ? owl.id : null,
		bestDay: day ? { id: day.id, ...day.bestDay! } : null,
		slacker: rows.length >= 2 && last.camos < rows[rows.length - 2].camos ? last.id : null,
		mostHours: hours && hours.minutes >= 30 ? hours.id : null
	};
}
