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
	SEASON_1_COUNTS_TOWARD_DIVERGENCE,
	type MasteryMode,
	type MasteryStatus
} from './data/camos.ts';
import { WEAPONS } from './data/weapons.ts';
import { APP_ID } from './progress-codec.ts';
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
export const SQUAD_OPS = ['abscar', 'phillestar', 'lars', 'jeeven'] as const;
export type SquadOp = (typeof SQUAD_OPS)[number];

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
	/** Fields a newer page wrote that this one doesn't know: kept as they are, never dropped. */
	more?: Record<string, unknown>;
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

const MEMBER_KEYS = new Set(['name', 'op', 'seen', 'away', 'weapons', 'mastery', 'tickAt', 'recent', 'readyAt', 'ping']);
const DOC_KEYS = new Set(['app', 'squad', 'members', 'duels']);

/** The keys of `raw` this page doesn't know (so a newer page's additions survive an older page's write). */
function unknownKeys(raw: Record<string, unknown>, known: Set<string>): Record<string, unknown> | undefined {
	const out = Object.fromEntries(Object.entries(raw).filter(([k]) => !known.has(k) && k !== 'more'));
	return Object.keys(out).length ? out : undefined;
}

const MEMBER_ID = /^[A-Za-z0-9_-]{8,32}$/;
const WEAPON_IDS = new Set(WEAPONS.map((w) => w.id));
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
	if (typeof raw.op === 'string' && (SQUAD_OPS as readonly string[]).includes(raw.op)) member.op = raw.op as SquadOp;
	if (raw.away === true) member.away = true;
	if (typeof raw.tickAt === 'number' && Number.isFinite(raw.tickAt) && raw.tickAt > 0) member.tickAt = raw.tickAt;
	const recent = cleanRecent(raw.recent, weapons);
	if (recent) member.recent = recent;
	if (isTime(raw.readyAt)) member.readyAt = raw.readyAt;
	if (isObject(raw.ping) && typeof raw.ping.to === 'string' && isMemberId(raw.ping.to) && isTime(raw.ping.at)) {
		member.ping = { to: raw.ping.to, at: raw.ping.at };
	}
	const more = unknownKeys(raw, MEMBER_KEYS);
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
	const doc: SquadDoc = { members };
	const duels = cleanDuels(raw.duels);
	if (duels.length) doc.duels = duels;
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
		lastTickAt: string | null;
		stamps?: Record<string, number[]>;
	},
	seen: number,
	away = false,
	extra: { readyAt?: number | null; ping?: { to: string; at: number } | null } = {}
): SquadMember {
	const entry = cleanMember({
		name: me.name,
		op: me.op ?? undefined,
		seen,
		away,
		weapons: progress.weapons,
		mastery: progress.mastery,
		tickAt: progress.lastTickAt ? Date.parse(progress.lastTickAt) : undefined,
		recent: progress.stamps ? recentFrom(progress.stamps, Date.now()) : undefined,
		readyAt: extra.readyAt ?? undefined,
		ping: extra.ping ?? undefined
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

/** Per member: ladder level per weapon and whether Divergence was unlocked, as last seen here. */
export type SeenSnapshot = Record<string, { w: Record<string, number>; div: boolean }>;

export interface SquadGain {
	member: string;
	name: string;
	weaponId: string;
	level: number;
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
		next[id] = { w: { ...m.weapons }, div };
		const old = before?.[id];
		if (id === myId || !old) continue;
		for (const [weaponId, level] of Object.entries(m.weapons)) {
			if (level > (old.w[weaponId] ?? 0)) gains.push({ member: id, name: m.name, weaponId, level });
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
}

export function memberStats(m: Pick<SquadMember, 'weapons' | 'mastery'>): MemberStats {
	const ladder = LADDER.map((_, i) => WEAPONS.filter((w) => (m.weapons[w.id] ?? 0) > i).length);
	const divergence = divergenceCount(m.weapons);
	const mastery = masteryStatuses(m.weapons, m.mastery);
	return {
		ladder,
		divergence,
		divergenceLeft: Math.max(0, DIVERGENCE_REQUIRED - divergence),
		mastery,
		masteryDone: Object.values(mastery).flat().filter((s) => s === 'complete').length
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
