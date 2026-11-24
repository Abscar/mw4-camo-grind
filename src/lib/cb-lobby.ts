/**
 * Case Battles against each other (2026-11-24, the user: "gör så att man kan göra case battles mot varandra.
 * Att man gör en lobby och så joinar man och sen öppnas alla cases samtidigt. Den som får mest vinner alltihop.
 * Och så finns det olika modes, 2v2, 1v1 och så vidare").
 *
 * The squad's lobbies are one small document on the sync service (the squad's code + "-cb"), like the shared
 * blackjack table: no server logic. Someone opens a lobby (cases, players, mode) and sits in seat 0; others take a
 * free seat (in 2v2 the seat picks the team); the creator can fill the empty seats with bots. The write that fills
 * the last seat sets `start` = now + COUNTDOWN on the service's clock. From then on every page works out the same
 * battle from the lobby's seed (cases.ts runBattle with a seeded random) and plays it on the same clock: round r
 * spins from start + r × ROUND_MS. So everyone sees the cases open at the same time, with the same results.
 *
 * Booking: each player's own device (`dev` in the seat) books its result (payout − cost) once the battle has
 * started (squad.recordGame), remembers it, and marks the seat `ok` in the lobby; the page holds the win back until
 * the battle has played out. Someone who closed the page books when they open Case Battles again. A finished lobby
 * stays until every player has booked (or KEEP_MS). No control-room luck here: every page has to deal the same.
 *
 * Pure, tested in scripts/cb-lobby.test.js.
 */
import { APP_ID } from './progress-codec.ts';
import { cleanName, isMemberId, SQUAD_OPS, type SquadOp } from './squad-codec.ts';
import { seeded } from './squad-fun.ts';
import { battleCost, runBattle, BATTLE_MODES, BATTLE_SIZES, BOTS, CASE_BY_ID, MAX_ROUNDS, SEATS, type Battle, type BattleMode, type BattleSize } from './cases.ts';

const FORMAT = 1;
/** Lobbies kept at most (older finished ones go first). */
export const LOBBY_MAX = 12;
/** An open lobby nobody filled goes away after this. */
export const WAIT_MS = 30 * 60_000;
/** A finished lobby stays at most this long (even if someone never came back to book it). */
export const KEEP_MS = 3 * 86_400_000;
/** A finished lobby everyone booked stays this long after its end (so people can still see the result). */
export const SHOW_MS = 15 * 60_000;
/** Full → the first case spins after this. */
export const COUNTDOWN = 4000;
/** One round: the reels spin SPIN_MS, then a short pause. */
export const ROUND_MS = 4200;
export const SPIN_MS = 3400;

export const lobbyCode = (squadCode: string) => `${squadCode}-cb`;

export interface LobbySeat {
	/** A member id, or `bot-<op>`. */
	id: string;
	name: string;
	op?: SquadOp;
	/** The device that books this seat (players only). */
	dev?: string;
	bot?: true;
}
export interface Lobby {
	id: string;
	/** The member who opened it. */
	by: string;
	at: number;
	cases: string[];
	size: BattleSize;
	mode: BattleMode;
	seats: (LobbySeat | null)[];
	seed: number;
	/** When round 1 spins (service clock); set when the last seat fills. */
	start?: number;
	/** Players who have booked their result. */
	ok?: Record<string, 1>;
}
export interface LobbyDoc {
	lobbies: Lobby[];
}
export const emptyLobbies = (): LobbyDoc => ({ lobbies: [] });

export type LobbyPhase = 'open' | 'countdown' | 'live' | 'done';
export const lobbyEnd = (l: Lobby) => (l.start ?? Infinity) + l.cases.length * ROUND_MS;
export function phaseOf(l: Lobby, now: number): LobbyPhase {
	if (!l.start) return 'open';
	if (now < l.start) return 'countdown';
	return now < lobbyEnd(l) ? 'live' : 'done';
}
export const lobbyCost = (l: Pick<Lobby, 'cases'>) => battleCost(l.cases);
export const isBot = (s: LobbySeat | null) => !!s?.bot;
export const humans = (l: Lobby) => l.seats.filter((s): s is LobbySeat => !!s && !s.bot);
export const seatOf = (l: Lobby, memberId: string) => l.seats.findIndex((s) => s?.id === memberId);

const battles = new Map<string, Battle>();
/** The battle every page works out from the lobby (cached by id + seed). */
export function battleOf(l: Lobby): Battle {
	const key = `${l.id}:${l.seed}`;
	let b = battles.get(key);
	if (!b) {
		b = runBattle(l.cases, l.size, l.mode, seeded(l.seed));
		battles.set(key, b);
	}
	return b;
}

// ---------------------------------------------------------------------------------------------
// Changes (each returns a new doc, or null = refused; the page writes it with a retry on conflicts)

const copy = (d: LobbyDoc): LobbyDoc => ({ lobbies: d.lobbies.map((l) => ({ ...l, seats: [...l.seats], ...(l.ok ? { ok: { ...l.ok } } : {}) })) });
const full = (l: Lobby) => l.seats.every((s) => s !== null);
function maybeStart(l: Lobby, now: number) {
	if (!l.start && full(l)) l.start = now + COUNTDOWN;
}

/** Drops open lobbies nobody filled and finished ones everyone booked (or too old). */
export function pruneLobbies(doc: LobbyDoc, now: number): LobbyDoc {
	const keep = doc.lobbies.filter((l) => {
		if (!l.start) return now - l.at < WAIT_MS;
		const end = lobbyEnd(l);
		if (now - end > KEEP_MS) return false;
		const booked = humans(l).every((s) => l.ok?.[s.id]);
		return !(booked && now - end > SHOW_MS);
	});
	return { lobbies: keep };
}

export interface NewLobby {
	id: string;
	me: LobbySeat;
	cases: string[];
	size: BattleSize;
	mode: BattleMode;
	seed: number;
	now: number;
}
export function createLobby(doc: LobbyDoc, n: NewLobby): LobbyDoc | null {
	const cases = n.cases.filter((c) => CASE_BY_ID.has(c)).slice(0, MAX_ROUNDS);
	if (!cases.length || !BATTLE_SIZES.includes(n.size) || !BATTLE_MODES.includes(n.mode)) return null;
	const d = pruneLobbies(copy(doc), n.now);
	if (d.lobbies.some((l) => l.id === n.id)) return null;
	// one open lobby per player at a time
	if (d.lobbies.some((l) => !l.start && l.by === n.me.id)) return null;
	while (d.lobbies.length >= LOBBY_MAX) {
		const old = d.lobbies.findIndex((l) => l.start && n.now > lobbyEnd(l));
		if (old < 0) return null;
		d.lobbies.splice(old, 1);
	}
	const seats: (LobbySeat | null)[] = Array.from({ length: SEATS[n.size] }, (_, i) => (i === 0 ? { ...n.me } : null));
	d.lobbies.push({ id: n.id, by: n.me.id, at: n.now, cases, size: n.size, mode: n.mode, seats, seed: n.seed >>> 0 });
	return d;
}

export function joinLobby(doc: LobbyDoc, lobbyId: string, seat: number, me: LobbySeat, now: number): LobbyDoc | null {
	const d = copy(doc);
	const l = d.lobbies.find((x) => x.id === lobbyId);
	if (!l || l.start || seat < 0 || seat >= l.seats.length || l.seats[seat] || seatOf(l, me.id) >= 0) return null;
	l.seats[seat] = { ...me };
	maybeStart(l, now);
	return d;
}

/** Leave before it starts; the one who opened it leaving = the lobby closes. */
export function leaveLobby(doc: LobbyDoc, lobbyId: string, memberId: string): LobbyDoc | null {
	const d = copy(doc);
	const i = d.lobbies.findIndex((x) => x.id === lobbyId);
	const l = d.lobbies[i];
	if (!l || l.start) return null;
	if (l.by === memberId) {
		d.lobbies.splice(i, 1);
		return d;
	}
	const s = seatOf(l, memberId);
	if (s < 0) return null;
	l.seats[s] = null;
	return d;
}

/** The one who opened it fills the empty seats with bots (the operators nobody sits as) and it starts. */
export function fillBots(doc: LobbyDoc, lobbyId: string, memberId: string, now: number): LobbyDoc | null {
	const d = copy(doc);
	const l = d.lobbies.find((x) => x.id === lobbyId);
	if (!l || l.start || l.by !== memberId || full(l)) return null;
	const used = new Set(l.seats.map((s) => s?.op).filter(Boolean));
	const pool = BOTS.filter((b) => !used.has(b.op));
	const r = seeded(l.seed ^ 0x5bd1e995);
	l.seats = l.seats.map((s) => {
		if (s) return s;
		const b = pool.splice(Math.floor(r() * pool.length), 1)[0] ?? BOTS[0];
		return { id: `bot-${b.op}`, name: b.name, op: b.op as SquadOp, bot: true };
	});
	maybeStart(l, now);
	return d;
}

export function ackLobby(doc: LobbyDoc, lobbyId: string, memberId: string): LobbyDoc | null {
	const d = copy(doc);
	const l = d.lobbies.find((x) => x.id === lobbyId);
	if (!l || !l.start || seatOf(l, memberId) < 0 || l.ok?.[memberId]) return null;
	l.ok = { ...(l.ok ?? {}), [memberId]: 1 };
	return d;
}

/** Your result in a started lobby: what you pay, take home and net (null if you don't sit in it). */
export function resultFor(l: Lobby, memberId: string): { seat: number; cost: number; payout: number; net: number } | null {
	const seat = seatOf(l, memberId);
	if (seat < 0 || !l.start) return null;
	const b = battleOf(l);
	return { seat, cost: b.cost, payout: b.payout[seat], net: b.payout[seat] - b.cost };
}

// ---------------------------------------------------------------------------------------------
// The wire format

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;
const DEVICE = /^[A-Za-z0-9_-]{4,16}$/;
const LOBBY_ID = /^[A-Za-z0-9_-]{6,24}$/;
const BOT_ID = /^bot-[a-z]+$/;

function cleanSeat(raw: unknown): LobbySeat | null {
	if (!isObject(raw) || typeof raw.id !== 'string') return null;
	const bot = raw.bot === true;
	if (bot ? !BOT_ID.test(raw.id) : !isMemberId(raw.id)) return null;
	const name = cleanName(raw.name);
	if (!name) return null;
	const op = (SQUAD_OPS as readonly unknown[]).includes(raw.op) ? (raw.op as SquadOp) : undefined;
	const dev = typeof raw.dev === 'string' && DEVICE.test(raw.dev) ? raw.dev : undefined;
	return { id: raw.id, name, ...(op ? { op } : {}), ...(dev && !bot ? { dev } : {}), ...(bot ? { bot: true as const } : {}) };
}
function cleanLobby(raw: unknown): Lobby | null {
	if (!isObject(raw) || typeof raw.id !== 'string' || !LOBBY_ID.test(raw.id) || typeof raw.by !== 'string' || !isMemberId(raw.by) || !isTime(raw.at)) return null;
	if (!BATTLE_SIZES.includes(raw.size as BattleSize) || !BATTLE_MODES.includes(raw.mode as BattleMode)) return null;
	const size = raw.size as BattleSize;
	if (!Array.isArray(raw.cases) || !raw.cases.length || raw.cases.length > MAX_ROUNDS || !raw.cases.every((c) => typeof c === 'string' && CASE_BY_ID.has(c))) return null;
	if (!Array.isArray(raw.seats) || raw.seats.length !== SEATS[size]) return null;
	const seats = raw.seats.map((s) => (s === null ? null : cleanSeat(s)));
	if (raw.seats.some((s, i) => s !== null && seats[i] === null)) return null;
	const ids = seats.filter(Boolean).map((s) => s!.id);
	if (new Set(ids).size !== ids.length) return null;
	if (!Number.isInteger(raw.seed)) return null;
	const l: Lobby = { id: raw.id, by: raw.by, at: raw.at, cases: raw.cases as string[], size, mode: raw.mode as BattleMode, seats, seed: (raw.seed as number) >>> 0 };
	if (isTime(raw.start) && seats.every(Boolean)) l.start = raw.start;
	if (isObject(raw.ok)) {
		const ok = Object.fromEntries(Object.keys(raw.ok).filter((id) => ids.includes(id)).map((id) => [id, 1 as const]));
		if (Object.keys(ok).length) l.ok = ok;
	}
	return l;
}
export function fromLobbyWire(raw: unknown): LobbyDoc | null {
	if (!isObject(raw) || raw.app !== APP_ID || raw.cb !== FORMAT) return null;
	const list = Array.isArray(raw.lobbies) ? raw.lobbies.map(cleanLobby).filter((l): l is Lobby => l !== null) : [];
	const seen = new Set<string>();
	return { lobbies: list.filter((l) => !seen.has(l.id) && seen.add(l.id)).slice(-LOBBY_MAX * 2) };
}
export function toLobbyWire(doc: LobbyDoc) {
	return { app: APP_ID, cb: FORMAT, lobbies: doc.lobbies };
}
