/**
 * The shared blackjack table on this page (2026-11-16; the rules live in bj-table.ts): the table's
 * own document on the sync service (the squad's code + "-bj"), your seat, your bets and moves, and
 * booking your settled hands in your casino tally.
 *
 * Polling costs the sync service requests (free plan), so the table is read often only while it's
 * on screen and the page is visible: every POLL_HAND while a hand with others is going on,
 * POLL_COMPANY with others at the table between hands, POLL_ALONE when you're alone (to notice
 * someone sitting down), and only every POLL_LOBBY once nothing has happened for QUIET (a page
 * left open on a screen). With BurgiCasino open on another game, every POLL_LOBBY for the
 * "n at the table" count on the Blackjack button. Off screen for AWAY_LEAVE = you get up. Nothing is
 * read on the other tabs; with nothing of the table on screen it only looks again once a second
 * (IDLE_LOOK: checking whether an element shows makes the browser work out its styles).
 *
 * On / off per device (2026-11-20, the user: "an on/off button for the blackjack online mode so I can
 * turn it off when it's not used"): off = this device doesn't read or write the table at all (no seat,
 * no "n at the table" count, no timer). It can only be switched off once the table has been read with
 * nothing of yours on it (no hand being played, nothing waiting to be booked), and switching off gets
 * you up and marks your booked hands. Should a hand of yours still be out there (a second tab of this
 * browser played it), the first look at BurgiCasino while off reads the table once, books it, and
 * keeps reading (and settles it when due) until it's booked: nobody's burgers get lost.
 *
 * Kept on this device: the hands it already booked (`mw4-camo-grind:bj-booked`), your win streak
 * (`mw4-camo-grind:bj-streak`, the solo game's key), when the radio last heard you sit down
 * (`mw4-camo-grind:bj-sat`) and on / off (`mw4-camo-grind:bj-online` = `off`; missing = on).
 */

import {
	act,
	betState,
	dealNow,
	dealerRigDealt,
	emptyTable,
	finish,
	fromTableWire,
	leave,
	liveStake,
	markBooked,
	placeBet,
	seatedNow,
	sit,
	sitCheck,
	tableCode,
	toTableWire,
	unbooked,
	viewRound,
	GRACE,
	HELLO_EVERY,
	type Act,
	type BetState,
	type MyResult,
	type SitResult,
	type TableDoc
} from './bj-table.ts';
import { untrack } from 'svelte';
import { t } from './i18n/en.ts';
import { saverOn } from './motion.svelte.ts';
import type { SideBet } from './squad-casino.ts';
import { makeMemberId } from './squad-codec.ts';
import { Channel, squad, type Outcome } from './squad.svelte.ts';
import { sound } from './sound.svelte.ts';

const BOOKED_KEY = 'mw4-camo-grind:bj-booked';
/** Wins in a row (the streak boost), kept per device like the solo game did. */
const STREAK_KEY = 'mw4-camo-grind:bj-streak';
const SAT_KEY = 'mw4-camo-grind:bj-sat';
const ONLINE_KEY = 'mw4-camo-grind:bj-online';
/** Rounds this device has a hand in that isn't booked yet (off: the only reason to read the table). */
const PENDING_KEY = 'mw4-camo-grind:bj-pending';
const PENDING_MAX = 10;
/** With nothing of the table on screen, look again this often (not 4× a second). */
const IDLE_LOOK = 1_000;
/** Off with a hand of yours still out there: read it this often until it's booked. */
const POLL_LEFTOVER = 5_000;
/** The radio hears that you sat down at most this often. */
const SAT_NEWS_EVERY = 45 * 60_000;
const POLL_HAND = 2_000;
const POLL_COMPANY = 5_000;
const POLL_ALONE = 12_000;
const POLL_LOBBY = 20_000;
/** Nothing happening at the table for this long (no hand, nobody betting): read it at the lobby pace. */
const QUIET = 10 * 60_000;
const AWAY_LEAVE = 10_000;
/** A failed sit is tried again after this long. */
const SIT_RETRY = 8_000;
const BOOKED_MAX = 80;
/** A settled hand this recent gets the sound and the radio line (older = booked on coming back). */
const FRESH_RESULT = 60_000;

function readJson(key: string): unknown {
	try {
		return JSON.parse(localStorage.getItem(key) ?? 'null');
	} catch {
		return null;
	}
}

function writeJson(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// storage full or blocked: works for this visit
	}
}

const shown = (el: HTMLElement | null) => !!el && document.visibilityState === 'visible' && (el.checkVisibility ? el.checkVisibility() : el.offsetParent !== null);

/** On unless this device switched it off (read when the module loads: the table's screens aren't prerendered). */
function readOnline(): boolean {
	try {
		return localStorage.getItem(ONLINE_KEY) !== 'off';
	} catch {
		return true;
	}
}

/** Why the table can't be switched off right now: it hasn't been read yet, or a hand of yours is on it. */
export type OffBlock = 'reading' | 'hand' | null;

function randomSeed(): number {
	const a = new Uint32Array(1);
	crypto.getRandomValues(a);
	return a[0];
}

class BjTable {
	#ch = new Channel<TableDoc>(fromTableWire, toTableWire, emptyTable, () => this.#book());
	/** The sync service's clock, ticking while the table is on screen (countdowns). */
	now = $state(Date.now());
	/** Can you sit: 'ok', at the table on another device, or full (you watch). */
	sitState = $state<SitResult>('ok');
	/** A write of yours is on its way (the buttons wait). */
	busy = $state(false);
	/** The table couldn't be reached last time. */
	trouble = $state(false);
	/** Your last settled hand (shown until the next one). */
	last = $state<MyResult | null>(null);
	/** Your wins in a row on this device (the streak boost). */
	streak = $state(0);
	/** The online table is on on this device (off = nothing read or written, see the header). */
	online = $state(readOnline());

	#code: string | null = null;
	#booked: string[] = [];
	#acks: string[] = [];
	#table: HTMLElement | null = null;
	#lobby: HTMLElement | null = null;
	#timer: ReturnType<typeof setInterval> | undefined;
	#seated = false;
	#sitTried = 0;
	#hello = 0;
	/** When this page last sat down. */
	#seatedAt = 0;
	#pulled = 0;
	#offSince: number | null = null;
	/** The last try at settling a round (tried again 2 s later if it's still due). */
	#finishing: { id: string; at: number } | null = null;
	#loaded = false;
	/** Something of the table was on screen at the last look, and when that look was. */
	#looking = false;
	#lookedAt = 0;
	/** Rounds with a hand of yours from this device that isn't booked yet (`mw4-camo-grind:bj-pending`). */
	#pending: string[] = [];
	/** The last try at writing your booked hands' marks while off. */
	#ackedAt = 0;

	get doc(): TableDoc | null {
		return this.#ch.doc;
	}

	#me() {
		const me = squad.me;
		return me && squad.device ? { id: me.id, name: me.name, op: me.op, dev: squad.device } : null;
	}

	/** Everyone at the table right now (you included), seat order. */
	get seated() {
		return seatedNow(this.#ch.doc, this.now);
	}

	/** Your stake on the table right now (held back from the balance). */
	get stake(): number {
		const me = this.#me();
		return me ? liveStake(this.#ch.doc, me.id, me.dev, this.now) : 0;
	}

	get state(): BetState {
		const me = this.#me();
		return me ? betState(this.#ch.doc, me.id, me.dev, this.now) : 'seat';
	}

	/** Why switching the table off has to wait (null = it can go off now). */
	get offBlock(): OffBlock {
		const me = this.#me();
		if (!me || !this.#code) return null;
		const doc = this.#ch.doc;
		// not read yet (unless it can't be reached: then a hand of yours is booked when you come back, see #stepOff)
		if (!doc) return this.trouble ? null : 'reading';
		return this.busy || this.#yours(doc, me).length ? 'hand' : null;
	}

	/** Round ids with a hand of yours from this device still being played, or settled but not booked here. */
	#yours(doc: TableDoc, me: { id: string; dev: string }): string[] {
		const r = doc.round;
		const out = r && !r.done && r.hands[me.id]?.dev === me.dev ? [r.id] : [];
		for (const x of unbooked(doc, me.id, me.dev)) if (!this.#booked.includes(x.id)) out.push(x.id);
		return out;
	}

	/**
	 * Switch the online table on or off on this device. False = not now (`offBlock` says why). Off gets
	 * you up and marks your booked hands on the table first, then nothing more is read or written.
	 */
	async setOnline(on: boolean): Promise<boolean> {
		if (on === this.online) return true;
		if (!on && this.offBlock) return false;
		this.online = on;
		try {
			if (on) localStorage.removeItem(ONLINE_KEY);
			else localStorage.setItem(ONLINE_KEY, 'off');
		} catch {
			// storage blocked: for this visit only
		}
		if (on) {
			this.#pulled = 0;
			this.#sitTried = 0;
			this.#lookedAt = 0;
			if (this.#table || this.#lobby) this.#start();
			return true;
		}
		this.sitState = 'ok';
		this.busy = true;
		try {
			await this.#getUp();
			if (this.#acks.length && this.#ch.doc) await this.#write((d) => d);
		} finally {
			this.busy = false;
		}
		return true;
	}

	/**
	 * The table is on screen (CasinoBlackjack). Returns the function that takes it off. Called from an
	 * $effect: the first step runs untracked, so the table's state doesn't become that effect's.
	 */
	open(el: HTMLElement): () => void {
		this.#table = el;
		this.#lookedAt = 0;
		untrack(() => {
			this.#load();
			this.#start();
		});
		return () => {
			if (this.#table === el) this.#table = null;
			void this.#getUp();
			this.#maybeStop();
		};
	}

	/** BurgiCasino is on screen (for the count on the Blackjack button). */
	lobby(el: HTMLElement): () => void {
		this.#lobby = el;
		this.#lookedAt = 0;
		untrack(() => {
			this.#load();
			this.#start();
		});
		return () => {
			if (this.#lobby === el) this.#lobby = null;
			this.#maybeStop();
		};
	}

	#load(): void {
		if (this.#loaded) return;
		this.#loaded = true;
		const booked = readJson(BOOKED_KEY);
		if (Array.isArray(booked)) this.#booked = booked.filter((x): x is string => typeof x === 'string').slice(-BOOKED_MAX);
		const streak = Number(readJson(STREAK_KEY));
		this.streak = Number.isInteger(streak) && streak > 0 ? streak : 0;
		const pending = readJson(PENDING_KEY);
		if (Array.isArray(pending)) this.#pending = pending.filter((x): x is string => typeof x === 'string').slice(-PENDING_MAX);
		addEventListener('pagehide', () => this.#goodbye());
	}

	#setPending(ids: string[]): void {
		if (ids.length === this.#pending.length && ids.every((id, i) => id === this.#pending[i])) return;
		this.#pending = ids.slice(-PENDING_MAX);
		if (this.#pending.length) writeJson(PENDING_KEY, this.#pending);
		else
			try {
				localStorage.removeItem(PENDING_KEY);
			} catch {
				// storage blocked: nothing kept anyway
			}
	}

	#start(): void {
		if (this.#timer) return;
		this.#timer = setInterval(() => this.#step(), 250);
		this.#step();
	}

	#halt(): void {
		clearInterval(this.#timer);
		this.#timer = undefined;
	}

	#maybeStop(): void {
		if (this.#table || this.#lobby || !this.#timer) return;
		this.#halt();
	}

	#time(): number {
		return Date.now() + (this.#ch.offset ?? squad.serverNow() - Date.now());
	}

	/** Follow the squad: another squad (or none) = another table. */
	#follow(): boolean {
		const code = squad.on && squad.code ? tableCode(squad.code) : null;
		if (code !== this.#code) {
			this.#code = code;
			this.#ch.use(code);
			this.#seated = false;
			this.#pulled = 0;
			this.#sitTried = 0;
			this.#acks = [];
			this.last = null;
		}
		return code !== null;
	}

	#step(): void {
		if (!this.#follow()) return;
		const real = Date.now();
		// nothing of the table on screen at the last look: look again only once a second
		if (!this.#looking && real - this.#lookedAt < IDLE_LOOK) return;
		this.#lookedAt = real;
		const atTable = shown(this.#table);
		this.#looking = atTable || shown(this.#lobby);
		if (!this.online) return this.#stepOff(real);
		// the clock only ticks for someone looking (it ran 4× a second whenever you were in a squad, 2026-11-20)
		if (this.#looking) this.now = this.#time();
		if (!atTable) {
			if (this.#seated) {
				this.#offSince ??= real;
				if (real - this.#offSince > AWAY_LEAVE) void this.#getUp();
			}
			// Battery saver: the lobby's "n at the table" count three times less often
			if (this.#looking && real - this.#pulled > POLL_LOBBY * (saverOn() ? 3 : 1)) this.#pull();
			return;
		}
		this.#offSince = null;
		const me = this.#me();
		if (!me) return;
		const doc = this.#ch.doc;
		// sit down / hello
		if (!this.#seated && real - this.#sitTried > SIT_RETRY && !this.busy) void this.#sit();
		else if (this.#seated && real - this.#hello > HELLO_EVERY) void this.#sayHello();
		// read the table
		const others = this.seated.some((s) => s.id !== me.id) || Object.keys(doc?.round?.hands ?? {}).some((id) => id !== me.id);
		const live = !!doc?.round && !doc.round.done;
		const lastHand = Math.max(doc?.round?.open ?? 0, doc?.round?.done ?? 0);
		const quiet = !live && this.now - lastHand > QUIET && real - this.#seatedAt > QUIET;
		const every = quiet ? POLL_LOBBY : others ? (live ? POLL_HAND : POLL_COMPANY) : POLL_ALONE;
		if (real - this.#pulled > every) this.#pull();
		if (doc) this.#settleDue(doc, me.id, real, this.now);
	}

	/** A hand whose time ran out: settle it (staggered by seat so the pages don't all try at once). */
	#settleDue(doc: TableDoc, id: string, real: number, now: number): void {
		const r = doc.round;
		const tried = this.#finishing?.id === r?.id && real - (this.#finishing?.at ?? 0) < 2_000;
		if (r && !r.done && !tried && viewRound(r, now, GRACE).phase === 'settle') {
			const lag = (doc.seats[id]?.n ?? r.hands[id]?.n ?? 0) * 400;
			if (viewRound(r, now - lag, GRACE).phase === 'settle') void this.#finish(r.id);
		}
	}

	/**
	 * Off: nothing is read or written and the timer stops, unless a hand of yours from this device is
	 * still out there (`#pending`): then the table is read while BurgiCasino shows until it's settled and
	 * booked, and your booked hands are marked on it (see the header).
	 */
	#stepOff(real: number): void {
		const me = this.#me();
		if (!me || (!this.#pending.length && !this.#acks.length)) return this.#halt();
		if (!this.#looking || this.busy) return;
		const doc = this.#ch.doc;
		if (this.#pending.length) {
			if (real - this.#pulled > POLL_LEFTOVER) this.#pull();
			if (doc) this.#settleDue(doc, me.id, real, this.#time());
		} else if (doc && real - this.#ackedAt > SIT_RETRY) {
			this.#ackedAt = real;
			void this.#write((d) => d);
		}
	}

	#pull(): void {
		this.#pulled = Date.now();
		void this.#ch.pull().then((o) => this.#outcome(o));
	}

	#outcome(o: Outcome): void {
		if (o !== 'gone') this.trouble = o === 'offline' || o === 'error';
	}

	/** A write with your booked hands riding along; refused on a stale copy = read and try once more. */
	async #write(change: (d: TableDoc) => TableDoc | null): Promise<Outcome> {
		const me = this.#me();
		const acks = [...this.#acks];
		const withAcks = (d: TableDoc) => {
			const next = change(d);
			return next && me && acks.length ? markBooked(next, me.id, acks) : next;
		};
		let o = await this.#ch.write(withAcks);
		if (o === 'refused') {
			await this.#ch.pull();
			o = await this.#ch.write(withAcks);
		}
		if (o === 'ok') this.#acks = this.#acks.filter((id) => !acks.includes(id));
		this.#outcome(o);
		return o;
	}

	async #sit(): Promise<void> {
		const me = this.#me();
		if (!me) return;
		this.#sitTried = Date.now();
		if (!this.#ch.doc) await this.#ch.pull();
		this.sitState = sitCheck(this.#ch.doc, me, this.#time());
		if (this.sitState !== 'ok') return;
		const o = await this.#write((d) => sit(d, me, this.#time()));
		if (o !== 'ok') {
			this.sitState = sitCheck(this.#ch.doc, me, this.#time());
			return;
		}
		this.#seated = true;
		// switched off while sitting down: up again at once
		if (!this.online) return void (await this.#getUp());
		this.#hello = Date.now();
		this.#seatedAt = Date.now();
		// the radio hears it (now and then), so the others know someone's at the table
		const last = readJson(SAT_KEY);
		const now = this.#time();
		if (typeof last !== 'number' || now - last > SAT_NEWS_EVERY) {
			writeJson(SAT_KEY, now);
			squad.casinoNews(t.casino.blackjack.satEvent);
		}
	}

	async #sayHello(): Promise<void> {
		const me = this.#me();
		if (!me) return;
		this.#hello = Date.now();
		const o = await this.#write((d) => sit(d, me, this.#time()));
		// someone took the seat over (your other device): watch
		if (o === 'refused' || o === 'error') {
			this.#seated = false;
			this.sitState = sitCheck(this.#ch.doc, me, this.#time());
		}
	}

	async #getUp(): Promise<void> {
		const me = this.#me();
		if (!this.#seated || !me) return;
		this.#seated = false;
		this.#offSince = null;
		this.#sitTried = 0;
		await this.#write((d) => leave(d, me.id, me.dev, this.#time()));
	}

	/** The page is closing: one last write (get up, booked hands marked), no retries. */
	#goodbye(): void {
		const me = this.#me();
		const doc = this.#ch.doc;
		if (!me || !doc || (!this.#seated && !this.#acks.length)) return;
		const up = (this.#seated ? leave(doc, me.id, me.dev, this.#time()) : null) ?? doc;
		this.#ch.lastWrite(markBooked(up, me.id, this.#acks));
	}

	async #finish(roundId: string): Promise<void> {
		this.#finishing = { id: roundId, at: Date.now() };
		await this.#write((d) => (d.round?.id === roundId ? finish(d, this.#time()) : null));
		this.#finishing = { id: roundId, at: Date.now() };
	}

	/** Book your settled hands (each once, on the device that played it); runs on every fresh copy. */
	#book(): void {
		const me = this.#me();
		const doc = this.#ch.doc;
		if (!me || !doc) return;
		const open = unbooked(doc, me.id, me.dev);
		let changed = false;
		for (const r of open) {
			if (!this.#acks.includes(r.id)) this.#acks.push(r.id);
			if (this.#booked.includes(r.id)) continue;
			this.#booked.push(r.id);
			changed = true;
			squad.recordGame(r.net);
			this.last = r;
			this.streak = r.streak;
			if (this.#time() - r.done < FRESH_RESULT) {
				if (r.net > 0) sound.play(r.result === 'blackjack' || r.net >= 100 || r.mult > 1 ? 'maxed' : 'camo');
				const bigSide = r.sides.find((x) => x.net >= 100 && x.kind);
				if (bigSide?.kind) squad.casinoNews(t.casino.event.bjSide(t.casino.blackjack.sides[bigSide.bet], t.casino.blackjack.kinds[bigSide.kind], bigSide.net));
				else if (r.result === 'blackjack' || Math.abs(r.net) >= 100) squad.casinoNews(t.casino.event.blackjack(r.net, r.result === 'blackjack'));
			}
		}
		if (changed) {
			this.#booked = this.#booked.slice(-BOOKED_MAX);
			writeJson(BOOKED_KEY, this.#booked);
			writeJson(STREAK_KEY, this.streak);
		}
		// rounds of yours that are booked now (or gone from the table) no longer need reading while off
		if (this.#pending.length) {
			const still = new Set(this.#yours(doc, me));
			this.#setPending(this.#pending.filter((id) => still.has(id)));
		}
	}

	// ----- your moves -----

	/** Put in a bet with its side bets (opens a hand, or joins the one whose bets are open). */
	async bet(amount: number, sides: SideBet[] = []): Promise<boolean> {
		const me = this.#me();
		if (!me || this.busy) return false;
		this.busy = true;
		try {
			if (!this.#seated) await this.#sit();
			if (!this.#seated) return false;
			// Abscar's control room (casino-rig.ts): the dealer's picked cards go into a round this bet opens
			// (a next-only setting once: not again if a round already dealt it), your luck into your hand
			const forced = squad.peekForced('blackjack');
			const dealer = forced && (forced.every || !dealerRigDealt(this.doc, forced.id)) ? { dc: forced.what, di: forced.id } : {};
			const fresh = { id: makeMemberId(), seed: randomSeed(), ...dealer };
			const extra = { sides, streak: this.streak, luck: squad.luck('blackjack') };
			const o = await this.#write((d) => placeBet(d, me, amount, this.#time(), fresh, extra));
			if (o === 'ok') this.#hello = Date.now();
			// remembered until it's booked (off can't lose it, see #stepOff)
			const rid = this.doc?.round?.id;
			if (o === 'ok' && rid && this.doc?.round?.hands[me.id]?.dev === me.dev && !this.#pending.includes(rid)) this.#setPending([...this.#pending, rid]);
			if (o === 'ok' && forced && !forced.every && this.doc?.round?.id === fresh.id && this.doc.round.di === forced.id) squad.markForced('blackjack', forced.id);
			return o === 'ok';
		} finally {
			this.busy = false;
		}
	}

	/** Close the bets now. */
	async dealNow(): Promise<boolean> {
		const me = this.#me();
		if (!me || this.busy) return false;
		this.busy = true;
		try {
			return (await this.#write((d) => dealNow(d, me.id, me.dev, this.#time()))) === 'ok';
		} finally {
			this.busy = false;
		}
	}

	/** Hit, stand or double. */
	async move(kind: Act): Promise<boolean> {
		const me = this.#me();
		if (!me || this.busy) return false;
		this.busy = true;
		try {
			return (await this.#write((d) => act(d, me.id, me.dev, kind, this.#time()))) === 'ok';
		} finally {
			this.busy = false;
		}
	}
}

export const bjTable = new BjTable();
