/**
 * Pure helpers for the squad (squad.svelte.ts, the Squad tab and the header's squad frame;
 * 2026-11-14, the user's ask: "now that a few people use the page, how can we see each other's
 * progress, some kind of login?" + "online/offline status?").
 *
 * No accounts: a squad is one small document on the same sync service that keeps a person's own
 * devices in step (sync-worker/), under its own long random code. The squad link
 * (<site>#squad=<code>) is the key: whoever has it can see the squad and join it. Each member's
 * page writes only its own entry: name, which operator in the header they are (optional), their
 * ticks and Mastery counts, and when it was last open ("seen", for Online / Offline).
 *
 * No browser APIs and no runes, so Node tests it directly (scripts/squad.test.js).
 */

import {
	DIVERGENCE_REQUIRED,
	LADDER,
	MASTERY,
	MASTERY_TRACKS,
	MAX_LEVEL,
	PRESTIGE,
	PRESTIGE_MAX,
	SEASON_1_COUNTS_TOWARD_DIVERGENCE,
	type MasteryMode,
	type MasteryStatus
} from './data/camos.ts';
import { CLASSES, WEAPONS } from './data/weapons.ts';
import { APP_ID } from './progress-codec.ts';
import { cleanBans, type Bans } from './squad-bans.ts';
import { cleanTune, type CasinoTune } from './casino-rig.ts';
import { cleanZero, type CasinoZero } from './casino-zero.ts';
import { cleanCasino, cleanOnline, NET_MAX, type CasinoLedger, type OnlineDays } from './squad-casino.ts';
import { cleanShop, type ShopState } from './shop.ts';
import { cleanLoans, type LoanBook } from './loans.ts';
import { cleanDonations, cleanKarma, type DonationBook, type Karma } from './donations.ts';
import { cleanKarmaShop, type KarmaShopState } from './karma-shop.ts';
import { cleanArcade, type ArcadeState } from './arcade.ts';
import { cleanClasses, type ClassList } from './squad-classes.ts';
import { cleanCombat, type CombatLog } from './squad-combat.ts';
import { cleanRanked, type RankedLog } from './squad-ranked.ts';
import { startOfDay, startOfWeek } from './stats.ts';
import { isSyncCode, makeSyncCode } from './sync-codec.ts';

/** Format of the squad document (bump + extend fromSquadWire if it changes). */
export const SQUAD_FORMAT = 1;
/** Keeps the document well under the sync service's 64 KB (one member ≈ 1 KB). */
export const MAX_MEMBERS = 20;
export const NAME_MAX = 24;
/** A member counts as online while their page said hello this recently (it does every 2 min). */
export const ONLINE_MS = 5 * 60_000;

/** The operators in the header's squad frame a member can say they are (OperatorTag). */
export const SQUAD_OPS = ['abscar', 'phillestar', 'lars', 'jeeven', 'ingman', 'aw', 'joker', 'meili'] as const;
export type SquadOp = (typeof SQUAD_OPS)[number];

/**
 * A member whose name is an operator's callsign but who never picked that operator gets it anyway (2026-11-22: the
 * user saw TheJoker_BPL with initials instead of his emblem in the Squad tab; he most likely joined before his
 * operator was in the list, or on an old copy of the page). Names are compared without case, accents, spaces or
 * punctuation ("TheJoker_BPL" = "thejokerbpl"). Only callsigns, never real first names.
 */
const OP_CALLSIGNS: Record<SquadOp, readonly string[]> = {
	abscar: ['abscar'],
	phillestar: ['phillestar', 'philestar'],
	lars: ['drangenlarsake', 'drangen', 'larsake'],
	jeeven: ['dajeeven', 'jeeven'],
	ingman: ['ingman'],
	aw: ['aw'],
	joker: ['thejokerbpl', 'thejoker', 'jokerbpl', 'joker'],
	meili: ['meili']
};
const callsignKey = (name: string) =>
	name
		.normalize('NFD')
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '');

/** The operator whose callsign this name is, if any. */
export function opFromName(name: string): SquadOp | null {
	const key = callsignKey(name);
	return key ? (SQUAD_OPS.find((op) => OP_CALLSIGNS[op].includes(key)) ?? null) : null;
}

/** An operator id from a newer page (one this page doesn't know yet): kept and written back untouched. */
const FUTURE_OP = /^[a-z][a-z0-9]{0,15}$/;

/**
 * Members without an operator whose name is a callsign get that operator, unless someone else already is it (or
 * their entry carries a newer page's operator). Changes `members` in place.
 */
export function guessOps(members: Record<string, SquadMember>): void {
	const taken = new Set(Object.values(members).flatMap((m) => (m.op ? [m.op] : [])));
	for (const id of Object.keys(members).sort()) {
		const m = members[id];
		if (m.op || m.more?.op !== undefined) continue;
		const op = opFromName(m.name);
		if (op && !taken.has(op)) {
			m.op = op;
			taken.add(op);
		}
	}
}

export interface SquadMember {
	name: string;
	op?: SquadOp;
	/** When their page last said hello (ms, the sync service's clock). */
	seen: number;
	/** Their page said goodbye (closed or hidden for a long time). */
	away?: boolean;
	/** Ladder level per weapon, 0–3 (only weapons above 0 are stored). */
	weapons: Record<string, number>;
	/** Mastery counts per camo id (only counts above 0). */
	mastery: Record<string, number>;
	/**
	 * Prestige level per weapon, 1–3 (data/camos.ts PRESTIGE: Pyroclast Terminus / Scatter / Cascade;
	 * only weapons above 0). Added 2026-11-15: a page from before then publishes none.
	 */
	prestige?: Record<string, number>;
	/** When they last ticked a camo (ms), if known. */
	tickAt?: number;
	/**
	 * When each camo was ticked, for the last RECENT_DAYS days only (weapon id → [ms per level],
	 * 0 = not in the window): weekly MVP, streaks, duels (2026-11-14, step 2).
	 */
	recent?: Record<string, number[]>;
	/** "Ready up": when they pressed it (ms, the sync service's clock). */
	readyAt?: number;
	/** A knock on someone's door (terminal `ping <name>`): who and when. */
	ping?: { to: string; at: number };
	/**
	 * Minutes with the tracker open per day ("YYYY-MM-DD" by their own clock → minutes), the last
	 * PLAYED_DAYS days (step 3: "hours played today"). Time with the page open, not time in the game.
	 */
	played?: Record<string, number>;
	/**
	 * Their K/D, W/L and the rest as they typed it in from the game, one update per mode per day
	 * (squad-combat.ts; the user's ask 2026-11-14: "track k/d and w/l for all the guys").
	 */
	combat?: CombatLog;
	/** Their Ranked SR as they typed it in, one update per day (squad-ranked.ts; 2026-11-16). */
	ranked?: RankedLog;
	/** The classes they run, with the game's build codes, for the others to copy (squad-classes.ts; 2026-11-16). */
	classes?: ClassList;
	/** How many days they've been online with the squad (the daily burger bonus, squad-casino.ts; 2026-11-16). */
	online?: OnlineDays;
	/** What they won or lost in BurgiCasino, per device (squad-casino.ts; 2026-11-16). */
	casino?: CasinoLedger;
	/** BurgiShop: what they bought and wear on their operator (shop.ts; 2026-11-16). */
	shop?: ShopState;
	/** BurgiBank loans (loans.ts; 2026-11-16). */
	loans?: LoanBook;
	/** BurgiGives: burgers given to the joke causes (donations.ts; 2026-11-20). */
	donations?: DonationBook;
	/** KarmaShop: hearts paid per item (karma-shop.ts; 2026-11-20). The items themselves are in `shop`. */
	karmaShop?: KarmaShopState;
	/** BurgiArcade: high scores, tickets, prizes bought, Quickscope duels (arcade.ts; 2026-11-22). */
	arcade?: ArcadeState;
	/** Fields a newer page wrote that this one doesn't know: kept as they are, never dropped. */
	more?: Record<string, unknown>;
}

/** Tonight's roulette (step 3): who spun, when the wheel spins, and what everyone got. */
export interface Roulette {
	id: string;
	by: string;
	/** When the wheel starts spinning (ms, the sync service's clock; a little ahead so every page has it). */
	at: number;
	/** 'each' = everyone their own gun; 'class' = one class for everyone, a gun of it each. */
	mode: 'each' | 'class';
	cls?: string;
	/** Member id → weapon id. */
	picks: Record<string, string>;
}

/** A burger bet (step 3; pretend burgers, never money): on who wins a duel, or the race to Divergence. */
export interface Bet {
	id: string;
	by: string;
	kind: 'duel' | 'race';
	/** The duel's id ('' for the race). */
	ref: string;
	/** The member they bet on. */
	pick: string;
	amount: number;
	at: number;
}

/** A finished duel that was taken off the list: its result stays for bets and the IOU list. */
export interface Settled {
	id: string;
	w: string;
	l: string;
}

/** "First to <camo> on <weapon>" between two members; the loser gets the stake as a sticker. */
export interface Duel {
	id: string;
	a: string;
	b: string;
	weapon: string;
	/** Ladder level to reach: 1 Gold, 2 Platinum, 3 Harmonic Break. */
	goal: number;
	stake: string;
	/** When it started (ms, the sync service's clock). */
	at: number;
}

export interface SquadDoc {
	members: Record<string, SquadMember>;
	duels?: Duel[];
	roulette?: Roulette;
	bets?: Bet[];
	/** Finished duels taken off the list (newest SETTLED_MAX). */
	settled?: Settled[];
	/** Duel ids whose real-burger IOU was paid. */
	paid?: string[];
	/** Joke bans lifted or put back by the owner (squad-bans.ts; 2026-11-16). */
	bans?: Bans;
	/**
	 * Abscar's casino admin menu (2026-11-16): burgers given (+) or taken (−) per member, as a running
	 * total (member id → burgers). Made out of nothing / gone into nothing, not from anyone's account.
	 */
	grants?: Record<string, number>;
	/** Abscar's casino control room (casino-rig.ts; 2026-11-19): odds, luck and forced results. */
	tune?: CasinoTune;
	/** Abscar's reset of the casino stats (casino-zero.ts; 2026-11-24): numbers at the reset, shown as now − then. */
	zero?: CasinoZero;
	/**
	 * BurgiGives' karma bank (donations.ts; 2026-11-21): every donated burger becomes a heart only Abscar
	 * sees. What Abscar sent back until 2026-11-22 (it arrived as burgers; member id → total), with a log of
	 * the latest gifts. Nothing writes to it any more: see `karmaHearts`.
	 */
	karma?: Karma;
	/** The karma bank's gifts since 2026-11-22: KarmaShop hearts (member id → total + log; donations.ts). */
	karmaHearts?: Karma;
	/** Document fields a newer page wrote that this one doesn't know: kept as they are. */
	more?: Record<string, unknown>;
}

/** Tick times older than this aren't published. */
export const RECENT_DAYS = 35;
const RECENT_MAX = 150;
export const MAX_DUELS = 8;
export const STAKE_MAX = 40;
/** "Ready up" shows on the others' pages this long (while you're online). */
export const READY_MS = 45 * 60_000;
/** A ping shows this long. */
export const PING_MS = 15 * 60_000;

export interface SquadWire {
	app: typeof APP_ID;
	squad: typeof SQUAD_FORMAT;
	members: Record<string, Record<string, unknown>>;
	[key: string]: unknown;
}

export const PLAYED_DAYS = 14;
export const MAX_BETS = 40;
export const BET_MAX = 10_000;
export const SETTLED_MAX = 40;

const MEMBER_KEYS = new Set(['name', 'op', 'seen', 'away', 'weapons', 'mastery', 'prestige', 'tickAt', 'recent', 'readyAt', 'ping', 'played', 'combat', 'ranked', 'classes', 'online', 'casino', 'shop', 'loans', 'donations', 'karmaShop', 'arcade']);
const DOC_KEYS = new Set(['app', 'squad', 'members', 'duels', 'roulette', 'bets', 'settled', 'paid', 'bans', 'grants', 'tune', 'karma', 'karmaHearts', 'zero']);

/** Admin grants: member id → whole burgers (±), within a sane range. */
export function cleanGrants(raw: unknown): Record<string, number> | undefined {
	if (!isObject(raw)) return undefined;
	const out: Record<string, number> = {};
	for (const [id, n] of Object.entries(raw)) {
		// held at the limit, never dropped: a total past the old 100M limit used to vanish whole
		if (isMemberId(id) && Number.isInteger(n) && n !== 0) out[id] = Math.max(-NET_MAX, Math.min(NET_MAX, n as number));
	}
	return Object.keys(out).length ? out : undefined;
}
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** The keys of `raw` this page doesn't know (so a newer page's additions survive an older page's write). */
function unknownKeys(raw: Record<string, unknown>, known: Set<string>): Record<string, unknown> | undefined {
	const out = Object.fromEntries(Object.entries(raw).filter(([k]) => !known.has(k) && k !== 'more'));
	return Object.keys(out).length ? out : undefined;
}

const MEMBER_ID = /^[A-Za-z0-9_-]{8,32}$/;
const WEAPON_IDS = new Set(WEAPONS.map((w) => w.id));
const CLASS_IDS = new Set(CLASSES.map((c) => c.id));
const MASTERY_IDS = new Map(MASTERY_TRACKS.flatMap((t) => t.camos.map((c) => [c.id, c.target] as const)));

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const count = (x: unknown, max: number) => (Number.isInteger(x) && (x as number) > 0 ? Math.min(x as number, max) : 0);

/** A display name: no control characters, spaces tidied, at most NAME_MAX characters. */
export function cleanName(raw: unknown): string {
	if (typeof raw !== 'string') return '';
	// eslint-disable-next-line no-control-regex
	return [...raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()].slice(0, NAME_MAX).join('').trim();
}

export function isMemberId(id: string): boolean {
	return MEMBER_ID.test(id);
}

/** A new member id (12 random base64url characters). */
export function makeMemberId(): string {
	return makeSyncCode().slice(0, 12);
}

function cleanMember(raw: unknown): SquadMember | null {
	if (!isObject(raw)) return null;
	const name = cleanName(raw.name);
	if (!name || typeof raw.seen !== 'number' || !Number.isFinite(raw.seen) || raw.seen < 0) return null;
	const weapons: Record<string, number> = {};
	if (isObject(raw.weapons)) {
		for (const [id, level] of Object.entries(raw.weapons)) {
			const n = count(level, MAX_LEVEL);
			if (n > 0 && WEAPON_IDS.has(id)) weapons[id] = n;
		}
	}
	const mastery: Record<string, number> = {};
	if (isObject(raw.mastery)) {
		for (const [id, n] of Object.entries(raw.mastery)) {
			const target = MASTERY_IDS.get(id);
			const c = target ? count(n, target * 10) : 0;
			if (c > 0) mastery[id] = c;
		}
	}
	const member: SquadMember = { name, seen: raw.seen, weapons, mastery };
	if (isObject(raw.prestige)) {
		const prestige: Record<string, number> = {};
		for (const [id, level] of Object.entries(raw.prestige)) {
			const n = count(level, PRESTIGE_MAX);
			if (n > 0 && WEAPON_IDS.has(id)) prestige[id] = n;
		}
		if (Object.keys(prestige).length) member.prestige = prestige;
	}
	if (typeof raw.op === 'string' && (SQUAD_OPS as readonly string[]).includes(raw.op)) member.op = raw.op as SquadOp;
	if (raw.away === true) member.away = true;
	if (typeof raw.tickAt === 'number' && Number.isFinite(raw.tickAt) && raw.tickAt > 0) member.tickAt = raw.tickAt;
	const recent = cleanRecent(raw.recent, weapons);
	if (recent) member.recent = recent;
	if (isTime(raw.readyAt)) member.readyAt = raw.readyAt;
	if (isObject(raw.ping) && typeof raw.ping.to === 'string' && isMemberId(raw.ping.to) && isTime(raw.ping.at)) {
		member.ping = { to: raw.ping.to, at: raw.ping.at };
	}
	const played = cleanPlayed(raw.played);
	if (played) member.played = played;
	const combat = cleanCombat(raw.combat);
	if (combat) member.combat = combat;
	const ranked = cleanRanked(raw.ranked);
	if (ranked) member.ranked = ranked;
	const classes = cleanClasses(raw.classes);
	if (classes) member.classes = classes;
	const online = cleanOnline(raw.online);
	if (online) member.online = online;
	const casino = cleanCasino(raw.casino);
	if (casino) member.casino = casino;
	const shop = cleanShop(raw.shop);
	if (shop) member.shop = shop;
	const loans = cleanLoans(raw.loans);
	if (loans) member.loans = loans;
	const donations = cleanDonations(raw.donations);
	if (donations) member.donations = donations;
	const karmaShop = cleanKarmaShop(raw.karmaShop);
	if (karmaShop) member.karmaShop = karmaShop;
	const arcade = cleanArcade(raw.arcade);
	if (arcade) member.arcade = arcade;
	let more = unknownKeys(raw, MEMBER_KEYS);
	// an operator added after this page was built: keep it (in `more`, written back as `op`), so this page's next
	// write doesn't turn the newer page's operator back into initials (what a page from before TheJoker_BPL does
	// to his entry until it's reloaded)
	if (!member.op && typeof raw.op === 'string' && FUTURE_OP.test(raw.op)) more = { ...more, op: raw.op };
	if (more) member.more = more;
	return member;
}

const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

/** Tick times for weapons the member has, at most 3 per weapon, newest RECENT_MAX kept. */
function cleanRecent(raw: unknown, weapons: Record<string, number>): Record<string, number[]> | undefined {
	if (!isObject(raw)) return undefined;
	const out: Record<string, number[]> = {};
	for (const [id, times] of Object.entries(raw)) {
		if (!WEAPON_IDS.has(id) || !Array.isArray(times)) continue;
		const level = weapons[id] ?? 0;
		const list = times.slice(0, MAX_LEVEL).map((x, i) => (i < level && isTime(x) ? Math.round(x) : 0));
		while (list.length && !list[list.length - 1]) list.pop();
		if (list.some(Boolean)) out[id] = list;
	}
	return Object.keys(out).length ? out : undefined;
}

/** Minutes per day, the newest PLAYED_DAYS days, at most a whole day each. */
export function cleanPlayed(raw: unknown): Record<string, number> | undefined {
	if (!isObject(raw)) return undefined;
	const days = Object.entries(raw)
		.filter(([k, v]) => DAY_KEY.test(k) && Number.isFinite(v) && (v as number) > 0)
		.sort(([a], [b]) => (a < b ? 1 : -1))
		.slice(0, PLAYED_DAYS)
		.map(([k, v]) => [k, Math.min(1440, Math.round(v as number))] as const);
	return days.length ? Object.fromEntries(days) : undefined;
}

function cleanRoulette(raw: unknown): Roulette | undefined {
	if (!isObject(raw) || typeof raw.id !== 'string' || !isMemberId(raw.id) || typeof raw.by !== 'string' || !isMemberId(raw.by) || !isTime(raw.at)) return undefined;
	if (raw.mode !== 'each' && raw.mode !== 'class') return undefined;
	const picks: Record<string, string> = {};
	if (isObject(raw.picks)) {
		for (const [id, w] of Object.entries(raw.picks)) if (isMemberId(id) && typeof w === 'string' && WEAPON_IDS.has(w)) picks[id] = w;
	}
	if (!Object.keys(picks).length) return undefined;
	const out: Roulette = { id: raw.id, by: raw.by, at: raw.at, mode: raw.mode, picks };
	if (raw.mode === 'class' && typeof raw.cls === 'string' && CLASS_IDS.has(raw.cls)) out.cls = raw.cls;
	return out;
}

function cleanBets(raw: unknown): Bet[] {
	if (!Array.isArray(raw)) return [];
	const out: Bet[] = [];
	for (const b of raw) {
		if (!isObject(b)) continue;
		const amount = count(b.amount, BET_MAX);
		if (
			typeof b.id !== 'string' ||
			!isMemberId(b.id) ||
			typeof b.by !== 'string' ||
			!isMemberId(b.by) ||
			typeof b.pick !== 'string' ||
			!isMemberId(b.pick) ||
			(b.kind !== 'duel' && b.kind !== 'race') ||
			typeof b.ref !== 'string' ||
			(b.kind === 'duel' && !isMemberId(b.ref)) ||
			!amount ||
			!isTime(b.at)
		)
			continue;
		out.push({ id: b.id, by: b.by, kind: b.kind, ref: b.kind === 'race' ? '' : b.ref, pick: b.pick, amount, at: b.at });
	}
	return out.slice(-MAX_BETS);
}

function cleanSettled(raw: unknown): Settled[] {
	if (!Array.isArray(raw)) return [];
	return raw
		.filter((s): s is Settled => isObject(s) && [s.id, s.w, s.l].every((x) => typeof x === 'string' && isMemberId(x as string)) && s.w !== s.l)
		.map((s) => ({ id: s.id, w: s.w, l: s.l }))
		.slice(-SETTLED_MAX);
}

function cleanPaid(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [];
	return [...new Set(raw.filter((x): x is string => typeof x === 'string' && isMemberId(x)))].slice(-SETTLED_MAX * 2);
}

export function cleanStake(raw: unknown): string {
	return cleanName(raw).slice(0, STAKE_MAX) || '';
}

function cleanDuels(raw: unknown): Duel[] {
	if (!Array.isArray(raw)) return [];
	const out: Duel[] = [];
	for (const d of raw) {
		if (!isObject(d)) continue;
		const goal = count(d.goal, MAX_LEVEL);
		if (
			typeof d.id !== 'string' ||
			!isMemberId(d.id) ||
			typeof d.a !== 'string' ||
			typeof d.b !== 'string' ||
			!isMemberId(d.a) ||
			!isMemberId(d.b) ||
			d.a === d.b ||
			typeof d.weapon !== 'string' ||
			!WEAPON_IDS.has(d.weapon) ||
			!goal ||
			!isTime(d.at)
		)
			continue;
		out.push({ id: d.id, a: d.a, b: d.b, weapon: d.weapon, goal, stake: cleanStake(d.stake), at: d.at });
	}
	return out.slice(-MAX_DUELS);
}

/** Read a stored squad document (cleaned up), or null if it isn't one. */
export function fromSquadWire(raw: unknown): SquadDoc | null {
	if (!isObject(raw) || raw.app !== APP_ID || raw.squad !== SQUAD_FORMAT || !isObject(raw.members)) return null;
	const members: Record<string, SquadMember> = {};
	for (const [id, m] of Object.entries(raw.members)) {
		const member = isMemberId(id) ? cleanMember(m) : null;
		if (member) members[id] = member;
	}
	guessOps(members);
	const doc: SquadDoc = { members };
	const duels = cleanDuels(raw.duels);
	if (duels.length) doc.duels = duels;
	const roulette = cleanRoulette(raw.roulette);
	if (roulette) doc.roulette = roulette;
	const bets = cleanBets(raw.bets);
	if (bets.length) doc.bets = bets;
	const settled = cleanSettled(raw.settled);
	if (settled.length) doc.settled = settled;
	const paid = cleanPaid(raw.paid);
	if (paid.length) doc.paid = paid;
	const bans = cleanBans(raw.bans);
	if (bans) doc.bans = bans;
	const grants = cleanGrants(raw.grants);
	if (grants) doc.grants = grants;
	const tune = cleanTune(raw.tune);
	if (tune) doc.tune = tune;
	const zero = cleanZero(raw.zero);
	if (zero) doc.zero = zero;
	const karma = cleanKarma(raw.karma);
	if (karma) doc.karma = karma;
	const karmaHearts = cleanKarma(raw.karmaHearts);
	if (karmaHearts) doc.karmaHearts = karmaHearts;
	const more = unknownKeys(raw, DOC_KEYS);
	if (more) doc.more = more;
	return doc;
}

export function toSquadWire(doc: SquadDoc): SquadWire {
	const members = Object.fromEntries(
		Object.entries(doc.members).map(([id, { more, ...known }]) => [id, { ...more, ...known }])
	);
	const wire: SquadWire = { ...doc.more, app: APP_ID, squad: SQUAD_FORMAT, members };
	if (doc.duels?.length) wire.duels = doc.duels;
	if (doc.roulette) wire.roulette = doc.roulette;
	if (doc.bets?.length) wire.bets = doc.bets;
	if (doc.settled?.length) wire.settled = doc.settled;
	if (doc.paid?.length) wire.paid = doc.paid;
	if (doc.bans) wire.bans = doc.bans;
	if (doc.grants) wire.grants = doc.grants;
	if (doc.tune) wire.tune = doc.tune;
	if (doc.zero) wire.zero = doc.zero;
	if (doc.karma) wire.karma = doc.karma;
	if (doc.karmaHearts) wire.karmaHearts = doc.karmaHearts;
	return wire;
}

export function emptySquad(): SquadDoc {
	return { members: {} };
}

/** What one member's page publishes about itself. */
export function memberEntry(
	me: { name: string; op: SquadOp | null },
	progress: {
		weapons: Record<string, number>;
		mastery: Record<string, number>;
		prestige?: Record<string, number>;
		lastTickAt: string | null;
		stamps?: Record<string, number[]>;
	},
	seen: number,
	away = false,
	extra: {
		readyAt?: number | null;
		ping?: { to: string; at: number } | null;
		played?: Record<string, number> | null;
		combat?: CombatLog | null;
		ranked?: RankedLog | null;
		classes?: ClassList | null;
		online?: OnlineDays | null;
		casino?: CasinoLedger | null;
		shop?: ShopState | null;
		loans?: LoanBook | null;
		donations?: DonationBook | null;
		karmaShop?: KarmaShopState | null;
		arcade?: ArcadeState | null;
	} = {}
): SquadMember {
	const entry = cleanMember({
		name: me.name,
		op: me.op ?? undefined,
		seen,
		away,
		weapons: progress.weapons,
		mastery: progress.mastery,
		prestige: progress.prestige,
		tickAt: progress.lastTickAt ? Date.parse(progress.lastTickAt) : undefined,
		recent: progress.stamps ? recentFrom(progress.stamps, Date.now()) : undefined,
		readyAt: extra.readyAt ?? undefined,
		ping: extra.ping ?? undefined,
		played: extra.played ?? undefined,
		combat: extra.combat ?? undefined,
		ranked: extra.ranked ?? undefined,
		classes: extra.classes ?? undefined,
		online: extra.online ?? undefined,
		casino: extra.casino ?? undefined,
		shop: extra.shop ?? undefined,
		loans: extra.loans ?? undefined,
		donations: extra.donations ?? undefined,
		karmaShop: extra.karmaShop ?? undefined,
		arcade: extra.arcade ?? undefined
	});
	if (!entry) throw new Error('bad squad entry');
	return entry;
}

/** Your tick times from the last RECENT_DAYS days (newest RECENT_MAX), for the squad. */
export function recentFrom(stamps: Record<string, number[]>, now: number): Record<string, number[]> {
	const from = now - RECENT_DAYS * 86_400_000;
	const all = Object.entries(stamps)
		.flatMap(([id, times]) => (Array.isArray(times) ? times.map((ms, i) => ({ id, i, ms })) : []))
		.filter((x) => isTime(x.ms) && x.ms >= from && x.i < MAX_LEVEL)
		.sort((a, b) => b.ms - a.ms)
		.slice(0, RECENT_MAX);
	const out: Record<string, number[]> = {};
	for (const { id, i, ms } of all) {
		const list = (out[id] ??= []);
		while (list.length <= i) list.push(0);
		list[i] = ms;
	}
	return out;
}

/** All of a member's known tick times (ms). */
const tickTimes = (m: Pick<SquadMember, 'recent'>) => Object.values(m.recent ?? {}).flat().filter((x) => x > 0);

/** Camos ticked since Monday 00:00 (the viewer's local time, like the grind stats). */
export function camosThisWeek(m: Pick<SquadMember, 'recent'>, now: number): number {
	const from = startOfWeek(now);
	return tickTimes(m).filter((x) => x >= from && x <= now + 60_000).length;
}

/** Days in a row with at least one camo, ending today (or yesterday, while today has none yet). */
export function streakDays(m: Pick<SquadMember, 'recent'>, now: number): number {
	const days = new Set(tickTimes(m).map((x) => startOfDay(x)));
	let day = startOfDay(now);
	if (!days.has(day)) day = startOfDay(day - 12 * 3_600_000);
	let n = 0;
	while (days.has(day)) {
		n++;
		day = startOfDay(day - 12 * 3_600_000);
	}
	return n;
}

/** This week's MVP(s): the most camos since Monday (at least one); a shared top spot shares the crown. */
export function weeklyMvps(members: Record<string, Pick<SquadMember, 'recent'>>, now: number): string[] {
	const counts = Object.entries(members).map(([id, m]) => [id, camosThisWeek(m, now)] as const);
	const best = Math.max(0, ...counts.map(([, n]) => n));
	return best > 0 ? counts.filter(([, n]) => n === best).map(([id]) => id) : [];
}

export function isReady(m: SquadMember, now: number): boolean {
	return !!m.readyAt && now - m.readyAt < READY_MS && m.readyAt - now < READY_MS && isOnline(m, now);
}

/** Who knocked on `myId`'s door in the last PING_MS, newest first. */
export function pingsFor(doc: SquadDoc, myId: string, now: number): { from: string; at: number }[] {
	return Object.entries(doc.members)
		.filter(([id, m]) => id !== myId && m.ping?.to === myId && now - m.ping.at < PING_MS && m.ping.at - now < PING_MS)
		.map(([id, m]) => ({ from: id, at: m.ping!.at }))
		.sort((a, b) => b.at - a.at);
}

// ---------------------------------------------------------------------------------------------
// Duels: "first to <camo> on <weapon>".

export function withDuel(doc: SquadDoc, duel: Duel): SquadDoc | null {
	const duels = doc.duels ?? [];
	if (duels.length >= MAX_DUELS) return null;
	return { ...doc, duels: [...duels, duel] };
}

export function withoutDuel(doc: SquadDoc, id: string): SquadDoc {
	return { ...doc, duels: (doc.duels ?? []).filter((d) => d.id !== id) };
}

/**
 * Who won: the one who has the goal camo (if both do, whoever ticked it first by their tick times;
 * without times, nobody can tell, so it's a draw). null while it's still on.
 */
export function duelResult(duel: Duel, members: Record<string, Pick<SquadMember, 'weapons' | 'recent'>>): { winner: string | null; loser: string | null; draw: boolean } | null {
	const a = members[duel.a];
	const b = members[duel.b];
	const has = (m: typeof a) => !!m && (m.weapons[duel.weapon] ?? 0) >= duel.goal;
	const when = (m: typeof a) => m?.recent?.[duel.weapon]?.[duel.goal - 1] || 0;
	if (!has(a) && !has(b)) return null;
	if (has(a) && !has(b)) return { winner: duel.a, loser: duel.b, draw: false };
	if (has(b) && !has(a)) return { winner: duel.b, loser: duel.a, draw: false };
	const ta = when(a);
	const tb = when(b);
	if (ta && tb && ta !== tb) return ta < tb ? { winner: duel.a, loser: duel.b, draw: false } : { winner: duel.b, loser: duel.a, draw: false };
	return { winner: null, loser: null, draw: true };
}

// ---------------------------------------------------------------------------------------------
// What changed for the others since this device last looked (the squad kill feed).

/**
 * Per member: ladder level per weapon, Prestige level per weapon (`p`, since 2026-11-15; a snapshot
 * from before has none, and then their Prestige camos aren't news yet) and whether Divergence was
 * unlocked, as last seen here.
 */
export type SeenSnapshot = Record<string, { w: Record<string, number>; p?: Record<string, number>; div: boolean }>;

export interface SquadGain {
	member: string;
	name: string;
	weaponId: string;
	/** The weapon's ladder level (for a Prestige gain: its ladder level, for the picture). */
	level: number;
	/** A Prestige camo gained (1 = Pyroclast Terminus … 3 = Cascade) instead of a ladder camo. */
	prestige?: number;
}

/**
 * New camos the other members got since `before` (a member seen for the first time brings none:
 * their old progress isn't news), and the snapshot to keep.
 */
export function squadGains(before: SeenSnapshot | null, doc: SquadDoc, myId: string): { gains: SquadGain[]; nukes: string[]; next: SeenSnapshot } {
	const next: SeenSnapshot = {};
	const gains: SquadGain[] = [];
	const nukes: string[] = [];
	for (const [id, m] of Object.entries(doc.members)) {
		const div = divergenceCount(m.weapons) >= DIVERGENCE_REQUIRED;
		next[id] = { w: { ...m.weapons }, p: { ...(m.prestige ?? {}) }, div };
		const old = before?.[id];
		if (id === myId || !old) continue;
		for (const [weaponId, level] of Object.entries(m.weapons)) {
			if (level > (old.w[weaponId] ?? 0)) gains.push({ member: id, name: m.name, weaponId, level });
		}
		if (old.p) {
			for (const [weaponId, p] of Object.entries(m.prestige ?? {})) {
				if (p > (old.p[weaponId] ?? 0)) gains.push({ member: id, name: m.name, weaponId, level: m.weapons[weaponId] ?? 0, prestige: p });
			}
		}
		if (div && !old.div) nukes.push(m.name);
	}
	return { gains, nukes, next };
}

/** The document with one member's entry set. null when the squad is full and this is a new member. */
export function withMember(doc: SquadDoc, id: string, member: SquadMember): SquadDoc | null {
	if (!(id in doc.members) && Object.keys(doc.members).length >= MAX_MEMBERS) return null;
	return { ...doc, members: { ...doc.members, [id]: member } };
}

export function withoutMember(doc: SquadDoc, id: string): SquadDoc {
	const members = { ...doc.members };
	delete members[id];
	return { ...doc, members };
}

/** Someone with this name already in the squad (the same person on another device), if any. */
export function memberByName(doc: SquadDoc, name: string): string | null {
	const wanted = cleanName(name).toLocaleLowerCase();
	return Object.entries(doc.members).find(([, m]) => m.name.toLocaleLowerCase() === wanted)?.[0] ?? null;
}

export function isOnline(m: SquadMember, now: number): boolean {
	return !m.away && now - m.seen < ONLINE_MS && m.seen - now < ONLINE_MS;
}

/**
 * Mastery statuses per mode, by the tracker's own rules (progress.svelte.ts masteryByMode):
 * Divergence opens the first camo of every mode, each next one needs the previous one complete.
 */
export function masteryStatuses(
	weapons: Record<string, number>,
	mastery: Record<string, number>
): Record<MasteryMode, MasteryStatus[]> {
	let previousDone = divergenceCount(weapons) >= DIVERGENCE_REQUIRED;
	const unlocked = previousDone;
	const out = {} as Record<MasteryMode, MasteryStatus[]>;
	for (const track of MASTERY_TRACKS) {
		previousDone = unlocked;
		out[track.mode] = track.camos.map((c) => {
			const status: MasteryStatus = !previousDone ? 'locked' : (mastery[c.id] ?? 0) >= c.target ? 'complete' : 'active';
			previousDone = status === 'complete';
			return status;
		});
	}
	return out;
}

export function divergenceCount(weapons: Record<string, number>): number {
	return WEAPONS.filter(
		(w) => (weapons[w.id] ?? 0) >= MAX_LEVEL && (SEASON_1_COUNTS_TOWARD_DIVERGENCE || w.season === 'launch')
	).length;
}

export interface MemberStats {
	/** Weapons with Gold / Platinum / Harmonic Break. */
	ladder: number[];
	divergence: number;
	divergenceLeft: number;
	mastery: Record<MasteryMode, MasteryStatus[]>;
	/** Mastery camos complete, all modes. */
	masteryDone: number;
	/** Weapons with Pyroclast Terminus / Scatter / Cascade (2026-11-15). */
	prestige: number[];
}

export function memberStats(m: Pick<SquadMember, 'weapons' | 'mastery' | 'prestige'>): MemberStats {
	const ladder = LADDER.map((_, i) => WEAPONS.filter((w) => (m.weapons[w.id] ?? 0) > i).length);
	const prestige = PRESTIGE.map((_, i) => WEAPONS.filter((w) => (m.prestige?.[w.id] ?? 0) > i).length);
	const divergence = divergenceCount(m.weapons);
	const mastery = masteryStatuses(m.weapons, m.mastery);
	return {
		ladder,
		divergence,
		divergenceLeft: Math.max(0, DIVERGENCE_REQUIRED - divergence),
		mastery,
		masteryDone: Object.values(mastery).flat().filter((s) => s === 'complete').length,
		prestige
	};
}

/** Furthest along first: Mastery camos done, then Harmonic Breaks, Platinum, Gold, then name. */
export function rankMembers<T extends { member: SquadMember; stats: MemberStats }>(list: T[]): T[] {
	return [...list].sort(
		(a, b) =>
			b.stats.masteryDone - a.stats.masteryDone ||
			b.stats.ladder[2] - a.stats.ladder[2] ||
			b.stats.ladder[1] - a.stats.ladder[1] ||
			b.stats.ladder[0] - a.stats.ladder[0] ||
			a.member.name.localeCompare(b.member.name)
	);
}

/** The header's three Mastery boxes: done / in progress / not started (OperatorTag). */
export type HeaderStatus = 'done' | 'active' | 'todo';
const RANK: Record<HeaderStatus, number> = { todo: 0, active: 1, done: 2 };

/**
 * The header's boxes for an operator who has joined the squad: the higher of what the user typed in
 * by hand (OperatorTag's SQUAD_MASTERY) and what that member's own ticks say, so a box never goes
 * back because someone hasn't entered their Mastery counts in the tracker.
 */
export function headerStatuses(hand: readonly HeaderStatus[], live: readonly MasteryStatus[] | null): HeaderStatus[] {
	return hand.map((h, i) => {
		const l: HeaderStatus = live?.[i] === 'complete' ? 'done' : live?.[i] === 'active' ? 'active' : 'todo';
		return RANK[l] > RANK[h] ? l : h;
	});
}

// ---------------------------------------------------------------------------------------------
// Squad codes and links: "<site>#squad=<code>", same kind of code as a sync code.

export const makeSquadCode = makeSyncCode;

/** The squad code in an address hash like "#squad=…" (or "…&squad=…"). */
export function squadCodeFromHash(hash: string): string | null {
	const match = /(?:^#|&)squad=([A-Za-z0-9_-]+)/.exec(hash);
	return match && isSyncCode(match[1]) ? match[1] : null;
}

/** A pasted squad link, or just its code. */
export function squadCodeFromText(text: string): string | null {
	const trimmed = text.trim();
	if (isSyncCode(trimmed)) return trimmed;
	const match = /[#&]squad=([A-Za-z0-9_-]+)/.exec(trimmed);
	return match && isSyncCode(match[1]) ? match[1] : null;
}

export type Ago = { unit: 'now' } | { unit: 'min' | 'h' | 'd'; n: number };

/** How long ago, rounded for "5 min ago" / "3 h ago" / "2 days ago" (the words are in en.ts). */
export function agoParts(ms: number, now: number): Ago {
	const min = Math.max(0, Math.round((now - ms) / 60_000));
	if (min < 1) return { unit: 'now' };
	if (min < 60) return { unit: 'min', n: min };
	const h = Math.round(min / 60);
	if (h < 24) return { unit: 'h', n: h };
	return { unit: 'd', n: Math.round(h / 24) };
}
