/**
 * BurgiArcade (2026-11-22, the user: "Börja med ett arcade, kom på 10 ideer till olika arcade modes vi kan
 * spela mot varandra, battle om high score", then "bygg alla 10", then "gör så att man kan vinna tickets av
 * alla arcades, och så bygger du en shop där också … pets och gosedjur och mounts"). Ten small games
 * (arcade/game.ts ARCADE_GAMES, the games themselves in components/arcade/games/), a high-score hall per game
 * for the squad, a daily challenge (the same level for everyone that day), live-ish Quickscope duels, and
 * tickets won in every game that buy prizes at the prize counter (arcade-prizes.ts).
 *
 * Stored as member field `arcade` (squad-codec.ts), written only by the member's own page:
 *   g  = per game: best score + when, plays, this week's best (week key), today's daily-challenge best (day key)
 *   tk = tickets won, per device (two devices never overwrite each other; like the casino tally)
 *   own = prize id → tickets paid (the prizes themselves sit in `shop.own` at 0 burgers, like KarmaShop's)
 *   du = Quickscope duels this member is in: who against, the seed, whether they challenged, their rounds
 * Kept on the device too (`mw4-camo-grind:arcade`), so the games and personal bests work outside a squad.
 * Two devices merge: the higher best per game, the later week / day mark (the higher score on the same key),
 * the later tally per device, everything owned on either, duels joined (rounds kept from whichever has them).
 *
 * Pretend tickets, never money; nothing here touches the burger bank.
 * No browser APIs and no runes, so Node tests it directly (scripts/arcade.test.js).
 */
import { ARCADE_GAMES, type ArcadeGame } from './arcade/game.ts';
import { hashSeed } from './arcade/rng.ts';

export { ARCADE_GAMES, type ArcadeGame };

/**
 * Per game: `per` = score per ticket, `max` = most tickets one play can win. Tuned so an average play wins
 * about 20–40 tickets and a great one up to `max`, whatever the game's own score range.
 */
export const GAME_META: Record<ArcadeGame, { per: number; max: number }> = {
	hitmarker: { per: 120, max: 120 },
	quickscope: { per: 40, max: 120 },
	nukerun: { per: 25, max: 120 },
	stack: { per: 6, max: 120 },
	grinder: { per: 60, max: 120 },
	zombies: { per: 150, max: 120 },
	grenade: { per: 100, max: 120 },
	recall: { per: 20, max: 120 },
	snake: { per: 6, max: 120 },
	typer: { per: 40, max: 120 },
	pinball: { per: 12_000, max: 120 }
};
/** Every play wins at least this many (for showing up). */
export const TICKETS_MIN = 2;
/** A new personal best wins this many on top. */
export const TICKETS_PB = 15;
/** Taking the squad's #1 spot (all time) in a game wins this many on top. */
export const TICKETS_RECORD = 40;
/** The first daily-challenge play of a day in a game wins this many on top. */
export const TICKETS_DAILY = 10;

export const SCORE_MAX = 100_000_000;
const TICKETS_MAX = 1_000_000_000;
export const DUEL_KEEP = 12;
/** An unanswered duel stays open this long. */
export const DUEL_DAYS = 3;
const DAY = 86_400_000;

export interface Mark {
	/** The week / day it's for (weekKey / dayKey). */
	k: string;
	s: number;
	at: number;
}
export interface GameRec {
	/** Best score ever, and when. */
	b: number;
	at: number;
	/** Plays. */
	n: number;
	/** Best this week. */
	w?: Mark;
	/** Best daily-challenge score today. */
	d?: Mark;
}
export interface TicketTally {
	/** Tickets won on this device. */
	e: number;
	/** Plays on this device. */
	n: number;
	at: number;
}
export interface Duel {
	/** The other player's member id. */
	o: string;
	/** The seed both play (arcade/rng.ts). */
	s: number;
	/** When it was made. */
	at: number;
	/** 1 = this member challenged, 0 = this member was challenged. */
	c: 0 | 1;
	/** This member's rounds (ms; -1 foul, 0 too slow) once played, and when. */
	r?: number[];
	ra?: number;
}
export interface ArcadeState {
	g: Partial<Record<ArcadeGame, GameRec>>;
	tk?: Record<string, TicketTally>;
	own?: Record<string, number>;
	du?: Record<string, Duel>;
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;
const isCount = (x: unknown, max: number): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= max;
const KEY = /^\d{4}-\d{2}-\d{2}$/;
const GAME_ID = /^[a-z0-9]{2,16}$/;
const DEVICE = /^[A-Za-z0-9_-]{4,16}$/;
const MEMBER_ID = /^[A-Za-z0-9_-]{8,32}$/;
const DUEL_ID = /^[A-Za-z0-9_-]{4,16}$/;
const PRIZE_ID = /^a-[a-z0-9-]{2,22}$/;

/* ---------- days and weeks (the viewer's own clock, like the rest of the squad features) ---------- */

export function dayKey(at: number): string {
	const d = new Date(at);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The week's Monday (local time), as a day key. */
export function weekKey(at: number): string {
	const d = new Date(at);
	d.setHours(12, 0, 0, 0);
	d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
	return dayKey(d.getTime());
}

/** Today's daily-challenge seed for a game: the same for everyone on that day. */
export const dailySeed = (game: ArcadeGame, day: string): number => hashSeed(`burgi-arcade:${game}:${day}`);

/* ---------- cleaning, merging ---------- */

function cleanMark(raw: unknown): Mark | undefined {
	if (!isObject(raw) || typeof raw.k !== 'string' || !KEY.test(raw.k) || !isCount(raw.s, SCORE_MAX) || !isTime(raw.at)) return undefined;
	return { k: raw.k, s: raw.s, at: Math.round(raw.at) };
}

function cleanRounds(raw: unknown): number[] | undefined {
	if (!Array.isArray(raw) || raw.length !== 5) return undefined;
	return raw.every((x) => Number.isInteger(x) && x >= -1 && x <= 60_000) ? (raw as number[]).slice() : undefined;
}

/** A stored or published arcade state, cleaned; undefined when there's nothing in it. */
export function cleanArcade(raw: unknown): ArcadeState | undefined {
	if (!isObject(raw)) return undefined;
	const g: Partial<Record<ArcadeGame, GameRec>> = {};
	for (const [id, r] of Object.entries(isObject(raw.g) ? raw.g : {})) {
		// unknown game ids are kept (a newer page's games)
		if (!GAME_ID.test(id) || !isObject(r) || !isCount(r.b, SCORE_MAX) || !isTime(r.at) || !isCount(r.n, 10_000_000)) continue;
		const rec: GameRec = { b: r.b, at: Math.round(r.at), n: r.n };
		const w = cleanMark(r.w);
		const d = cleanMark(r.d);
		if (w) rec.w = w;
		if (d) rec.d = d;
		g[id as ArcadeGame] = rec;
	}
	const tk: Record<string, TicketTally> = {};
	for (const [dev, x] of Object.entries(isObject(raw.tk) ? raw.tk : {})) {
		if (DEVICE.test(dev) && isObject(x) && isCount(x.e, TICKETS_MAX) && isCount(x.n, 10_000_000) && isTime(x.at)) tk[dev] = { e: x.e, n: x.n, at: Math.round(x.at) };
	}
	const own: Record<string, number> = {};
	for (const [id, p] of Object.entries(isObject(raw.own) ? raw.own : {})) if (PRIZE_ID.test(id) && isCount(p, TICKETS_MAX)) own[id] = p;
	const du: Record<string, Duel> = {};
	for (const [id, x] of Object.entries(isObject(raw.du) ? raw.du : {})) {
		if (!DUEL_ID.test(id) || !isObject(x) || typeof x.o !== 'string' || !MEMBER_ID.test(x.o) || !isCount(x.s, 4294967295) || !isTime(x.at) || (x.c !== 0 && x.c !== 1)) continue;
		const duel: Duel = { o: x.o, s: x.s, at: Math.round(x.at), c: x.c };
		const r = cleanRounds(x.r);
		if (r && isTime(x.ra)) {
			duel.r = r;
			duel.ra = Math.round(x.ra);
		}
		du[id] = duel;
	}
	const out: ArcadeState = { g };
	if (Object.keys(tk).length) out.tk = tk;
	if (Object.keys(own).length) out.own = own;
	if (Object.keys(du).length) out.du = pruneDuels(du);
	return Object.keys(g).length || out.tk || out.own || out.du ? out : undefined;
}

/** The newest DUEL_KEEP duels. */
function pruneDuels(du: Record<string, Duel>): Record<string, Duel> {
	return Object.fromEntries(
		Object.entries(du)
			.sort(([, a], [, b]) => b.at - a.at)
			.slice(0, DUEL_KEEP)
	);
}

const laterMark = (a: Mark | undefined, b: Mark | undefined): Mark | undefined => {
	if (!a || !b) return a ?? b;
	if (a.k !== b.k) return a.k > b.k ? a : b;
	return b.s > a.s ? b : a;
};

/** Two copies of your arcade (two devices). */
export function mergeArcade(a: ArcadeState | undefined, b: ArcadeState | undefined): ArcadeState | undefined {
	if (!a || !b) return a ?? b;
	const g: Partial<Record<ArcadeGame, GameRec>> = { ...a.g };
	for (const [id, rb] of Object.entries(b.g) as [ArcadeGame, GameRec][]) {
		const ra = g[id];
		if (!ra) {
			g[id] = rb;
			continue;
		}
		const best = rb.b > ra.b ? rb : ra;
		const rec: GameRec = { b: best.b, at: best.at, n: Math.max(ra.n, rb.n) };
		const w = laterMark(ra.w, rb.w);
		const d = laterMark(ra.d, rb.d);
		if (w) rec.w = w;
		if (d) rec.d = d;
		g[id] = rec;
	}
	const out: ArcadeState = { g };
	const tk = { ...a.tk };
	for (const [dev, x] of Object.entries(b.tk ?? {})) if (!tk[dev] || x.at > tk[dev].at || (x.at === tk[dev].at && x.e > tk[dev].e)) tk[dev] = x;
	if (Object.keys(tk).length) out.tk = tk;
	const own = { ...a.own };
	for (const [id, p] of Object.entries(b.own ?? {})) own[id] = Math.max(own[id] ?? 0, p);
	if (Object.keys(own).length) out.own = own;
	const du = { ...a.du };
	for (const [id, x] of Object.entries(b.du ?? {})) {
		const y = du[id];
		du[id] = !y ? x : y.r ? y : x.r ? x : y;
	}
	if (Object.keys(du).length) out.du = pruneDuels(du);
	return out;
}

/* ---------- tickets ---------- */

/** Tickets a score wins (before the bonuses). */
export function ticketsFor(game: ArcadeGame, score: number): number {
	const m = GAME_META[game];
	return Math.max(TICKETS_MIN, Math.min(m.max, TICKETS_MIN + Math.floor(Math.max(0, score) / m.per)));
}

export interface Tickets {
	earned: number;
	spent: number;
	balance: number;
}
export function ticketsOf(s: ArcadeState | undefined): Tickets {
	const earned = Object.values(s?.tk ?? {}).reduce((n, x) => n + x.e, 0);
	const spent = Object.values(s?.own ?? {}).reduce((n, p) => n + p, 0);
	return { earned, spent, balance: Math.max(0, earned - spent) };
}

/* ---------- a play ---------- */

export interface PlayResult {
	state: ArcadeState;
	/** Tickets this play won, and what they were for. */
	tickets: number;
	parts: { base: number; pb: number; record: number; daily: number };
	/** It beat your best (or was your first play). */
	pb: boolean;
	/** Your best before it (0 = first play). */
	prev: number;
	/** It took the squad's #1 spot (someone else held it, or nobody had played). */
	record: boolean;
}

/**
 * Book a finished play: best / week / day marks, plays, tickets on this device. `squadBest` = the best score
 * any OTHER squad member has in this game (0 = none), for the record bonus (null = not in a squad: no bonus).
 */
export function recordPlay(
	s: ArcadeState | undefined,
	game: ArcadeGame,
	score: number,
	o: { at: number; device: string; daily: boolean; squadBest: number | null }
): PlayResult {
	const sc = Math.max(0, Math.min(SCORE_MAX, Math.floor(score)));
	const base: ArcadeState = s ?? { g: {} };
	const old = base.g[game];
	const prev = old?.b ?? 0;
	const pb = !old || sc > old.b;
	const week = weekKey(o.at);
	const day = dayKey(o.at);
	const rec: GameRec = { b: pb ? sc : old!.b, at: pb ? o.at : old!.at, n: (old?.n ?? 0) + 1 };
	const w = old?.w?.k === week ? old.w : undefined;
	rec.w = !w || sc > w.s ? { k: week, s: sc, at: o.at } : w;
	const d = old?.d?.k === day ? old.d : undefined;
	if (o.daily) rec.d = !d || sc > d.s ? { k: day, s: sc, at: o.at } : d;
	else if (d) rec.d = d;
	const record = o.squadBest !== null && sc > 0 && sc > o.squadBest && sc > prev;
	const parts = {
		base: ticketsFor(game, sc),
		pb: pb && sc > 0 ? TICKETS_PB : 0,
		record: record ? TICKETS_RECORD : 0,
		daily: o.daily && !d ? TICKETS_DAILY : 0
	};
	const tickets = parts.base + parts.pb + parts.record + parts.daily;
	const tally = base.tk?.[o.device];
	const tk = { ...base.tk, [o.device]: { e: Math.min(TICKETS_MAX, (tally?.e ?? 0) + tickets), n: (tally?.n ?? 0) + 1, at: Math.max(o.at, (tally?.at ?? 0) + 1) } };
	return { state: { ...base, g: { ...base.g, [game]: rec }, tk }, tickets, parts, pb, prev, record };
}

/* ---------- the hall of fame ---------- */

export type Board = 'all' | 'week' | 'day';
export interface HallRow {
	id: string;
	score: number;
	at: number;
}
type WithArcade = { arcade?: ArcadeState };

/** A game's board: everyone's score on it, best first (ties: who got there first). */
export function hallOf(members: Record<string, WithArcade>, game: ArcadeGame, board: Board, now: number): HallRow[] {
	const week = weekKey(now);
	const day = dayKey(now);
	const rows: HallRow[] = [];
	for (const [id, m] of Object.entries(members)) {
		const r = m.arcade?.g[game];
		if (!r) continue;
		if (board === 'all') rows.push({ id, score: r.b, at: r.at });
		else if (board === 'week' && r.w?.k === week) rows.push({ id, score: r.w.s, at: r.w.at });
		else if (board === 'day' && r.d?.k === day) rows.push({ id, score: r.d.s, at: r.d.at });
	}
	return rows.sort((a, b) => b.score - a.score || a.at - b.at);
}

/** The best score anyone but `me` has in a game (0 = nobody played it). */
export function bestOfOthers(members: Record<string, WithArcade>, game: ArcadeGame, me: string): number {
	let best = 0;
	for (const [id, m] of Object.entries(members)) if (id !== me) best = Math.max(best, m.arcade?.g[game]?.b ?? 0);
	return best;
}

/** Points for a place on a week board: 1st 5, 2nd 3, 3rd 1. */
const PLACE_POINTS = [5, 3, 1];

export interface Champ {
	id: string;
	points: number;
	/** Games they lead this week. */
	firsts: number;
}

/** This week's arcade standings over all games (week boards: 5 / 3 / 1 points), best first. */
export function weekStandings(members: Record<string, WithArcade>, now: number): Champ[] {
	const pts = new Map<string, Champ>();
	for (const game of ARCADE_GAMES) {
		hallOf(members, game, 'week', now)
			.filter((r) => r.score > 0)
			.slice(0, PLACE_POINTS.length)
			.forEach((r, i) => {
				const c = pts.get(r.id) ?? { id: r.id, points: 0, firsts: 0 };
				c.points += PLACE_POINTS[i];
				if (i === 0) c.firsts++;
				pts.set(r.id, c);
			});
	}
	return [...pts.values()].sort((a, b) => b.points - a.points || b.firsts - a.firsts || (a.id < b.id ? -1 : 1));
}

/** This week's arcade champion(s): the most points (shared on a tie), or nobody. */
export function weekChampions(members: Record<string, WithArcade>, now: number): Champ[] {
	const all = weekStandings(members, now);
	return all.length ? all.filter((c) => c.points === all[0].points && c.firsts === all[0].firsts) : [];
}

export interface Rematch {
	game: ArcadeGame;
	/** Who beat you, their score, when. */
	by: string;
	score: number;
	at: number;
	/** Your best. */
	mine: number;
}

/** Games where someone beat your best after you set it (the newest first; one per game, the top one). */
export function rematches(members: Record<string, WithArcade>, me: string): Rematch[] {
	const mine = members[me]?.arcade?.g ?? {};
	const out: Rematch[] = [];
	for (const game of ARCADE_GAMES) {
		const my = mine[game];
		if (!my) continue;
		let top: Rematch | null = null;
		for (const [id, m] of Object.entries(members)) {
			const r = m.arcade?.g[game];
			if (id === me || !r || r.b <= my.b || r.at <= my.at) continue;
			if (!top || r.b > top.score) top = { game, by: id, score: r.b, at: r.at, mine: my.b };
		}
		if (top) out.push(top);
	}
	return out.sort((a, b) => b.at - a.at);
}

/* ---------- Quickscope duels ---------- */

/** Challenge someone: a new duel in your list (you play it at once; they answer from theirs). */
export function addDuel(s: ArcadeState | undefined, id: string, opponent: string, seed: number, at: number, challenged: boolean): ArcadeState {
	const base = s ?? { g: {} };
	return { ...base, du: pruneDuels({ ...base.du, [id]: { o: opponent, s: seed >>> 0, at, c: challenged ? 0 : 1 } }) };
}

/** Your rounds in a duel (once). */
export function playDuel(s: ArcadeState | undefined, id: string, rounds: number[], at: number): ArcadeState | null {
	const d = s?.du?.[id];
	if (!s || !d || d.r || rounds.length !== 5) return null;
	return { ...s, du: { ...s.du, [id]: { ...d, r: rounds.map((x) => Math.max(-1, Math.min(60_000, Math.round(x)))), ra: at } } };
}

export interface DuelView {
	id: string;
	/** The other player. */
	other: string;
	seed: number;
	at: number;
	/** You challenged them. */
	mine: boolean;
	you?: number[];
	them?: number[];
	/** Waiting for: you, them, or nobody (done). */
	waiting: 'you' | 'them' | null;
	result: DuelOutcome | null;
}

export interface DuelOutcome {
	/** Rounds won by you / them. */
	you: number;
	them: number;
	winner: 'you' | 'them' | 'draw';
	/** Per round: who took it. */
	per: ('you' | 'them' | 'draw')[];
}

/** One round: a hit beats a miss / foul, the faster hit wins, a foul loses to "too slow". */
function roundWinner(a: number, b: number): 'you' | 'them' | 'draw' {
	const rank = (x: number) => (x > 0 ? 2 : x === 0 ? 1 : 0);
	if (rank(a) !== rank(b)) return rank(a) > rank(b) ? 'you' : 'them';
	if (a > 0 && a !== b) return a < b ? 'you' : 'them';
	return 'draw';
}

export function duelOutcome(you: number[], them: number[]): DuelOutcome {
	const per = you.map((x, i) => roundWinner(x, them[i] ?? -1));
	const y = per.filter((p) => p === 'you').length;
	const t = per.filter((p) => p === 'them').length;
	return { you: y, them: t, winner: y > t ? 'you' : t > y ? 'them' : 'draw', per };
}

/**
 * Every duel you're in or are invited to, newest first: your own list, plus challenges in others' lists that
 * name you and that you haven't taken up yet (those are `mine: false`, `you` undefined). Unanswered ones older
 * than DUEL_DAYS are left out.
 */
export function duelsFor(members: Record<string, WithArcade>, me: string, now: number): DuelView[] {
	const mineList = members[me]?.arcade?.du ?? {};
	const out = new Map<string, DuelView>();
	const view = (id: string, other: string, seed: number, at: number, challenger: boolean, you: number[] | undefined, them: number[] | undefined): DuelView => ({
		id,
		other,
		seed,
		at,
		mine: challenger,
		you,
		them,
		waiting: !you ? 'you' : !them ? 'them' : null,
		result: you && them ? duelOutcome(you, them) : null
	});
	for (const [id, d] of Object.entries(mineList)) {
		const theirs = members[d.o]?.arcade?.du?.[id];
		out.set(id, view(id, d.o, d.s, d.at, d.c === 1, d.r, theirs?.o === me ? theirs.r : undefined));
	}
	for (const [other, m] of Object.entries(members)) {
		if (other === me) continue;
		for (const [id, d] of Object.entries(m.arcade?.du ?? {})) {
			if (out.has(id) || d.o !== me || d.c !== 1) continue;
			if (now - d.at > DUEL_DAYS * DAY) continue;
			out.set(id, view(id, other, d.s, d.at, false, undefined, d.r));
		}
	}
	return [...out.values()].filter((v) => v.result || now - v.at <= DUEL_DAYS * DAY).sort((a, b) => b.at - a.at);
}
