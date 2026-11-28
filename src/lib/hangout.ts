/**
 * The casino lobby + hanging out (2026-11-28, the user: "när man är inne på kasinot ska det finnas typ som att
 * man ser en lobby … de som är inne på kasinot, då ser man deras operators där … hälsa på varandra … ovanför
 * varje gubbe ser man vilken slot de spelar … Ogge vann så här mycket, boom, och så plingar det ovanför hans
 * huvud … collab spins", and hideouts where "man kan hänga hos varandra … spela kort … gambla … slå vad").
 *
 * One small document on the sync service (the squad's code + "-hang"), like the blackjack table and the Case
 * Battles lobbies: no server logic.
 * - `here`: who is in the casino right now and where (a game id, or `ho:<member id>` = in someone's hideout),
 *   refreshed every HELLO_MS while the casino is on screen; gone after FRESH_MS. A big win puts a `ping` on your
 *   entry (the "pling" over your head), a wave a `wave` (to someone), a quick line a `say`.
 * - `collabs`: collab spins. Someone opens one on Abscar's Fortune with a stake; others chip in until `until`
 *   (COLLAB_WAIT). Then every page spins the same machine with the whole pot as the bet, from the collab's seed
 *   (casino-slots.ts play with a seeded random), and each player gets their share of the win by stake.
 * - `duels`: games between two players in a hideout: coin flip, high card, dice, or a bet on anything (free
 *   text; settled when both say who won). Burgers go from the loser to the winner (member field `pvp`, never
 *   through the house).
 *
 * Booking: each player's own device (`dev`) books its result once it has been shown and marks itself `ok`.
 * Pure, tested in scripts/hangout.test.js.
 */
import { APP_ID } from './progress-codec.ts';
import { cleanName, isMemberId, SQUAD_OPS, type SquadOp } from './squad-codec.ts';
import { seeded } from './squad-fun.ts';
import { play, type Play } from './casino-slots.ts';

const FORMAT = 1;
export const hangCode = (squadCode: string) => `${squadCode}-hang`;

/** A hello while the casino is on screen; counted as here for FRESH_MS after the last one. */
export const HELLO_MS = 15_000;
export const FRESH_MS = 45_000;
/** A win ping / wave / line shows this long. */
export const PING_MS = 9_000;
export const WAVE_MS = 8_000;
export const SAY_MS = 8_000;
/** A collab spin takes players this long, then spins; the result shows COLLAB_SPIN after that. */
export const COLLAB_WAIT = 25_000;
export const COLLAB_SPIN = 5_500;
export const COLLAB_SEATS = 6;
export const COLLAB_STAKES = [100, 500, 1000, 5000, 10_000, 50_000, 100_000];
/** A duel's result shows this long after it's accepted (cards turn, dice roll). */
export const DUEL_SHOW = 3_200;
export const DUEL_STAKES = [100, 1000, 5000, 10_000, 50_000, 100_000, 1_000_000];
export const DUEL_KINDS = ['flip', 'high', 'dice', 'bet'] as const;
export type DuelKind = (typeof DUEL_KINDS)[number];
/** Quick lines (the words are in en.ts `t.hang.says`). */
export const SAYS = ['gg', 'lets-go', 'lol', 'rip', 'nice', 'hype', 'cmon', 'sheesh'] as const;
export type Say = (typeof SAYS)[number];
const MAX = { collabs: 10, duels: 40, here: 24 };
const TEXT_MAX = 80;

export interface Here {
	name: string;
	op?: SquadOp;
	/** Where: a casino game id, 'lobby', or `ho:<member id>`. */
	w: string;
	at: number;
	/** The last big win: burgers won, the game, when. */
	ping?: { n: number; g: string; at: number };
	wave?: { to: string; at: number };
	say?: { k: Say; at: number };
}
export interface Seat {
	id: string;
	name: string;
	op?: SquadOp;
	dev: string;
}
export interface CollabSeat extends Seat {
	stake: number;
}
export interface Collab {
	id: string;
	/** The machine (only Abscar's Fortune so far). */
	g: 'slots';
	at: number;
	/** Joining closes, and the spin starts. */
	until: number;
	seed: number;
	seats: CollabSeat[];
	ok?: Record<string, 1>;
}
export interface Duel {
	id: string;
	/** Whose hideout it's played in. */
	ho: string;
	kind: DuelKind;
	stake: number;
	at: number;
	seed: number;
	by: Seat;
	/** A bet's words ("Ogge drops a nuke tonight"). */
	text?: string;
	acc?: Seat & { at: number };
	/** A bet: who each side says won (member id). */
	v?: Record<string, string>;
	ok?: Record<string, 1>;
}
export interface HangDoc {
	here: Record<string, Here>;
	collabs: Collab[];
	duels: Duel[];
}
export const emptyHang = (): HangDoc => ({ here: {}, collabs: [], duels: [] });

// ---------- reading and writing ----------

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;
const isAmount = (x: unknown): x is number => Number.isSafeInteger(x) && (x as number) > 0;
const opOf = (x: unknown): SquadOp | undefined => ((SQUAD_OPS as readonly unknown[]).includes(x) ? (x as SquadOp) : undefined);
const DEV = /^[A-Za-z0-9_-]{4,16}$/;
const ID = /^[A-Za-z0-9_-]{6,24}$/;
const WHERE = /^(?:[a-z0-9]{2,12}|ho:[A-Za-z0-9_-]{6,24})$/;

function seatOf(x: unknown): Seat | null {
	if (!isObj(x) || typeof x.id !== 'string' || !isMemberId(x.id) || typeof x.dev !== 'string' || !DEV.test(x.dev)) return null;
	const name = cleanName(x.name);
	if (!name) return null;
	const op = opOf(x.op);
	return { id: x.id, name, ...(op ? { op } : {}), dev: x.dev };
}
function okOf(x: unknown): Record<string, 1> | undefined {
	if (!isObj(x)) return undefined;
	const out: Record<string, 1> = {};
	for (const k of Object.keys(x)) if (isMemberId(k)) out[k] = 1;
	return Object.keys(out).length ? out : undefined;
}

export function fromHangWire(raw: unknown): HangDoc | null {
	if (!isObj(raw)) return null;
	if (raw.app !== APP_ID || raw.hang !== FORMAT) return null;
	const doc = emptyHang();
	if (isObj(raw.here))
		for (const [id, h] of Object.entries(raw.here)) {
			if (!isMemberId(id) || !isObj(h) || typeof h.w !== 'string' || !WHERE.test(h.w) || !isTime(h.at)) continue;
			const name = cleanName(h.name);
			if (!name) continue;
			const op = opOf(h.op);
			const e: Here = { name, ...(op ? { op } : {}), w: h.w, at: Math.round(h.at) };
			if (isObj(h.ping) && isAmount(h.ping.n) && typeof h.ping.g === 'string' && WHERE.test(h.ping.g) && isTime(h.ping.at)) e.ping = { n: h.ping.n, g: h.ping.g, at: Math.round(h.ping.at) };
			if (isObj(h.wave) && typeof h.wave.to === 'string' && isMemberId(h.wave.to) && isTime(h.wave.at)) e.wave = { to: h.wave.to, at: Math.round(h.wave.at) };
			if (isObj(h.say) && (SAYS as readonly unknown[]).includes(h.say.k) && isTime(h.say.at)) e.say = { k: h.say.k as Say, at: Math.round(h.say.at) };
			doc.here[id] = e;
		}
	if (Array.isArray(raw.collabs))
		for (const c of raw.collabs) {
			if (!isObj(c) || typeof c.id !== 'string' || !ID.test(c.id) || c.g !== 'slots' || !isTime(c.at) || !isTime(c.until) || !Number.isInteger(c.seed) || !Array.isArray(c.seats)) continue;
			const seats: CollabSeat[] = [];
			for (const s of c.seats) {
				const seat = seatOf(s);
				if (seat && isObj(s) && isAmount(s.stake) && !seats.some((x) => x.id === seat.id)) seats.push({ ...seat, stake: s.stake });
			}
			if (!seats.length || seats.length > COLLAB_SEATS) continue;
			const ok = okOf(c.ok);
			doc.collabs.push({ id: c.id, g: 'slots', at: Math.round(c.at), until: Math.round(c.until), seed: (c.seed as number) >>> 0, seats, ...(ok ? { ok } : {}) });
		}
	if (Array.isArray(raw.duels))
		for (const d of raw.duels) {
			if (!isObj(d) || typeof d.id !== 'string' || !ID.test(d.id) || typeof d.ho !== 'string' || !isMemberId(d.ho)) continue;
			if (!(DUEL_KINDS as readonly unknown[]).includes(d.kind) || !isAmount(d.stake) || !isTime(d.at) || !Number.isInteger(d.seed)) continue;
			const by = seatOf(d.by);
			if (!by) continue;
			const duel: Duel = { id: d.id, ho: d.ho, kind: d.kind as DuelKind, stake: d.stake, at: Math.round(d.at), seed: (d.seed as number) >>> 0, by };
			if (typeof d.text === 'string' && d.text.trim()) duel.text = d.text.trim().slice(0, TEXT_MAX);
			const acc = seatOf(d.acc);
			if (acc && isObj(d.acc) && isTime(d.acc.at) && acc.id !== by.id) duel.acc = { ...acc, at: Math.round(d.acc.at) };
			if (isObj(d.v)) {
				const v: Record<string, string> = {};
				for (const [k, w] of Object.entries(d.v)) if ((k === by.id || k === duel.acc?.id) && (w === by.id || w === duel.acc?.id)) v[k] = w as string;
				if (Object.keys(v).length) duel.v = v;
			}
			const ok = okOf(d.ok);
			if (ok) duel.ok = ok;
			if (duel.kind === 'bet' && !duel.text) continue;
			doc.duels.push(duel);
		}
	return doc;
}

export function toHangWire(doc: HangDoc): unknown {
	return { app: APP_ID, hang: FORMAT, here: doc.here, collabs: doc.collabs, duels: doc.duels };
}

// ---------- who's here ----------

export const isFresh = (h: Here | undefined, now: number) => !!h && now - h.at < FRESH_MS && h.w !== '';

/** Everyone in the casino now (fresh), newest first. */
export function present(doc: HangDoc | null, now: number): [string, Here][] {
	return Object.entries(doc?.here ?? {})
		.filter(([, h]) => isFresh(h, now))
		.sort((a, b) => a[1].name.localeCompare(b[1].name));
}

/** Your hello: where you are now (keeps your ping / wave / line). `w` '' = you left. */
export function hello(doc: HangDoc, id: string, me: { name: string; op?: SquadOp }, w: string, now: number): HangDoc {
	const old = doc.here[id];
	const e: Here = { ...old, name: me.name, ...(me.op ? { op: me.op } : {}), w, at: now };
	if (!me.op) delete e.op;
	return prune({ ...doc, here: { ...doc.here, [id]: e } }, now);
}
export function withPing(doc: HangDoc, id: string, n: number, g: string, now: number): HangDoc | null {
	const old = doc.here[id];
	if (!old || !isAmount(Math.round(n))) return null;
	return { ...doc, here: { ...doc.here, [id]: { ...old, at: now, ping: { n: Math.round(n), g, at: now } } } };
}
export function withWave(doc: HangDoc, id: string, to: string, now: number): HangDoc | null {
	const old = doc.here[id];
	if (!old || to === id) return null;
	return { ...doc, here: { ...doc.here, [id]: { ...old, at: now, wave: { to, at: now } } } };
}
export function withSay(doc: HangDoc, id: string, k: Say, now: number): HangDoc | null {
	const old = doc.here[id];
	if (!old || !(SAYS as readonly string[]).includes(k)) return null;
	return { ...doc, here: { ...doc.here, [id]: { ...old, at: now, say: { k, at: now } } } };
}
export const pingOn = (h: Here, now: number) => (h.ping && now - h.ping.at < PING_MS ? h.ping : null);
export const sayOn = (h: Here, now: number) => (h.say && now - h.say.at < SAY_MS ? h.say.k : null);
export const waveOn = (h: Here, now: number) => (h.wave && now - h.wave.at < WAVE_MS ? h.wave : null);

// ---------- collab spins ----------

export type CollabPhase = 'open' | 'spin' | 'done';
export const collabPot = (c: Collab) => c.seats.reduce((n, s) => n + s.stake, 0);
export const collabReveal = (c: Collab) => c.until + COLLAB_SPIN;
export function collabPhase(c: Collab, now: number): CollabPhase {
	if (now < c.until) return 'open';
	return now < collabReveal(c) ? 'spin' : 'done';
}
/** The spin itself: Abscar's Fortune with the whole pot as the bet, from the collab's seed (same on every page). */
const PLAYS = new Map<string, Play>();
export function collabPlay(c: Collab): Play {
	const key = `${c.id}:${collabPot(c)}:${c.seed}`;
	let p = PLAYS.get(key);
	if (!p) {
		p = play(collabPot(c), seeded(c.seed));
		if (PLAYS.size > 40) PLAYS.clear();
		PLAYS.set(key, p);
	}
	return p;
}
/** Each player's part of the win, by stake (rounded down; what's left over goes to whoever opened it). */
export function collabShares(c: Collab, win = collabPlay(c).win): Record<string, number> {
	const pot = collabPot(c);
	const out: Record<string, number> = {};
	let given = 0;
	for (const s of c.seats) {
		out[s.id] = Math.floor((win * s.stake) / pot);
		given += out[s.id];
	}
	out[c.seats[0].id] += win - given;
	return out;
}
/** Your result: what you get back minus your stake (null = not in it). */
export function collabResult(c: Collab, id: string): { stake: number; share: number; net: number } | null {
	const s = c.seats.find((x) => x.id === id);
	if (!s) return null;
	const share = collabShares(c)[id] ?? 0;
	return { stake: s.stake, share, net: share - s.stake };
}

export function openCollab(doc: HangDoc, o: { id: string; seat: Seat; stake: number; seed: number; now: number }): HangDoc | null {
	if (!isAmount(o.stake)) return null;
	if (doc.collabs.some((c) => collabPhase(c, o.now) === 'open' && c.seats.some((s) => s.id === o.seat.id))) return null;
	const c: Collab = { id: o.id, g: 'slots', at: o.now, until: o.now + COLLAB_WAIT, seed: o.seed >>> 0, seats: [{ ...o.seat, stake: o.stake }] };
	return prune({ ...doc, collabs: [...doc.collabs, c] }, o.now);
}
export function joinCollab(doc: HangDoc, id: string, seat: Seat, stake: number, now: number): HangDoc | null {
	const c = doc.collabs.find((x) => x.id === id);
	if (!c || !isAmount(stake) || collabPhase(c, now) !== 'open' || c.seats.length >= COLLAB_SEATS || c.seats.some((s) => s.id === seat.id)) return null;
	return { ...doc, collabs: doc.collabs.map((x) => (x.id === id ? { ...x, seats: [...x.seats, { ...seat, stake }] } : x)) };
}
export function ackCollab(doc: HangDoc, id: string, member: string): HangDoc | null {
	const c = doc.collabs.find((x) => x.id === id);
	if (!c || c.ok?.[member] || !c.seats.some((s) => s.id === member)) return null;
	return { ...doc, collabs: doc.collabs.map((x) => (x.id === id ? { ...x, ok: { ...x.ok, [member]: 1 } } : x)) };
}

// ---------- duels in a hideout ----------

export type DuelPhase = 'open' | 'show' | 'done' | 'vote';
export function duelPhase(d: Duel, now: number): DuelPhase {
	if (!d.acc) return 'open';
	if (d.kind === 'bet') return duelWinner(d) ? 'done' : 'vote';
	return now < d.acc.at + DUEL_SHOW ? 'show' : 'done';
}
export interface Card {
	/** 2 … 14 (ace high) */
	r: number;
	/** ♠ ♥ ♦ ♣ */
	s: number;
}
export interface DuelDraw {
	/** Coin: true = heads (the opener's side). */
	coin?: boolean;
	/** High card: the opener's card, the other's (the last draw, after any ties). */
	cards?: [Card, Card];
	/** Dice: the opener's two dice, the other's. */
	dice?: [[number, number], [number, number]];
	/** Ties redrawn before the result. */
	ties: number;
	/** The opener won. */
	byWins: boolean;
}
/** The result of a coin / card / dice duel, from its seed (the same on every page). */
export function duelDraw(d: Duel): DuelDraw {
	const r = seeded(d.seed ^ 0x9e3779b9);
	if (d.kind === 'flip') {
		const coin = r() < 0.5;
		return { coin, ties: 0, byWins: coin };
	}
	let ties = 0;
	for (;;) {
		if (d.kind === 'high') {
			const a = Math.floor(r() * 52);
			let b = Math.floor(r() * 51);
			if (b >= a) b++;
			const card = (n: number): Card => ({ r: (n % 13) + 2, s: Math.floor(n / 13) });
			const cards: [Card, Card] = [card(a), card(b)];
			if (cards[0].r !== cards[1].r || ties >= 20) return { cards, ties, byWins: cards[0].r > cards[1].r || (cards[0].r === cards[1].r && cards[0].s < cards[1].s) };
		} else {
			const die = () => 1 + Math.floor(r() * 6);
			const dice: [[number, number], [number, number]] = [
				[die(), die()],
				[die(), die()]
			];
			const a = dice[0][0] + dice[0][1];
			const b = dice[1][0] + dice[1][1];
			if (a !== b || ties >= 20) return { dice, ties, byWins: a > b || (a === b && dice[0][0] > dice[1][0]) };
		}
		ties++;
	}
}
/** Who won (member id), or null (not accepted / a bet not settled yet). */
export function duelWinner(d: Duel): string | null {
	if (!d.acc) return null;
	if (d.kind === 'bet') {
		const a = d.v?.[d.by.id];
		const b = d.v?.[d.acc.id];
		return a && a === b ? a : null;
	}
	return duelDraw(d).byWins ? d.by.id : d.acc.id;
}
/** Your result once it's decided: + the stake when you won, − when you lost (null = not decided / not in it). */
export function duelNet(d: Duel, id: string): number | null {
	if (id !== d.by.id && id !== d.acc?.id) return null;
	const w = duelWinner(d);
	return w ? (w === id ? d.stake : -d.stake) : null;
}

export function openDuel(doc: HangDoc, o: { id: string; ho: string; kind: DuelKind; stake: number; seat: Seat; seed: number; now: number; text?: string }): HangDoc | null {
	if (!isAmount(o.stake) || !(DUEL_KINDS as readonly string[]).includes(o.kind)) return null;
	const text = o.text?.trim().slice(0, TEXT_MAX);
	if (o.kind === 'bet' && !text) return null;
	if (doc.duels.filter((d) => !d.acc && d.by.id === o.seat.id).length >= 3) return null;
	const d: Duel = { id: o.id, ho: o.ho, kind: o.kind, stake: o.stake, at: o.now, seed: o.seed >>> 0, by: o.seat, ...(o.kind === 'bet' && text ? { text } : {}) };
	return prune({ ...doc, duels: [...doc.duels, d] }, o.now);
}
export function acceptDuel(doc: HangDoc, id: string, seat: Seat, now: number): HangDoc | null {
	const d = doc.duels.find((x) => x.id === id);
	if (!d || d.acc || d.by.id === seat.id) return null;
	return { ...doc, duels: doc.duels.map((x) => (x.id === id ? { ...x, acc: { ...seat, at: now } } : x)) };
}
export function cancelDuel(doc: HangDoc, id: string, member: string): HangDoc | null {
	const d = doc.duels.find((x) => x.id === id);
	if (!d || d.acc || d.by.id !== member) return null;
	return { ...doc, duels: doc.duels.filter((x) => x.id !== id) };
}
/** A bet: say who won. Settled when both sides say the same. */
export function voteDuel(doc: HangDoc, id: string, member: string, winner: string): HangDoc | null {
	const d = doc.duels.find((x) => x.id === id);
	if (!d || d.kind !== 'bet' || !d.acc || duelWinner(d)) return null;
	if ((member !== d.by.id && member !== d.acc.id) || (winner !== d.by.id && winner !== d.acc.id)) return null;
	return { ...doc, duels: doc.duels.map((x) => (x.id === id ? { ...x, v: { ...x.v, [member]: winner } } : x)) };
}
export function ackDuel(doc: HangDoc, id: string, member: string): HangDoc | null {
	const d = doc.duels.find((x) => x.id === id);
	if (!d || d.ok?.[member]) return null;
	return { ...doc, duels: doc.duels.map((x) => (x.id === id ? { ...x, ok: { ...x.ok, [member]: 1 } } : x)) };
}

// ---------- tidying ----------

const GONE_MS = 10 * 60_000;
const SHOW_MS = 10 * 60_000;
const OPEN_MS = 30 * 60_000;
const KEEP_MS = 3 * 86_400_000;
/** Drop people long gone, finished collabs / duels everyone booked, offers nobody took. */
export function prune(doc: HangDoc, now: number): HangDoc {
	const here = Object.fromEntries(
		Object.entries(doc.here)
			.filter(([, h]) => now - h.at < GONE_MS)
			.sort((a, b) => b[1].at - a[1].at)
			.slice(0, MAX.here)
	);
	const collabs = doc.collabs
		.filter((c) => {
			const booked = c.seats.every((s) => c.ok?.[s.id]);
			return now - c.at < KEEP_MS && !(booked && now - collabReveal(c) > SHOW_MS);
		})
		.slice(-MAX.collabs);
	const duels = doc.duels
		.filter((d) => {
			if (!d.acc) return now - d.at < OPEN_MS;
			const w = duelWinner(d);
			if (!w) return now - d.acc.at < KEEP_MS;
			const booked = d.ok?.[d.by.id] && d.ok?.[d.acc.id];
			return now - d.at < KEEP_MS && !(booked && now - d.acc.at > SHOW_MS);
		})
		.slice(-MAX.duels);
	return { here, collabs, duels };
}
