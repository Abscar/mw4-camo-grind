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
 * "n at the table" count on the Blackjack button. Off screen for AWAY_LEAVE = you get up.
 *
 * Kept on this device: the hands it already booked (`mw4-camo-grind:bj-booked`), your win streak
 * (`mw4-camo-grind:bj-streak`, the solo game's key) and when the radio last heard you sit down
 * (`mw4-camo-grind:bj-sat`).
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

	/**
	 * The table is on screen (CasinoBlackjack). Returns the function that takes it off. Called from an
	 * $effect: the first step runs untracked, so the table's state doesn't become that effect's.
	 */
	open(el: HTMLElement): () => void {
		this.#table = el;
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
		addEventListener('pagehide', () => this.#goodbye());
	}

	#start(): void {
		if (this.#timer) return;
		this.#timer = setInterval(() => this.#step(), 250);
		this.#step();
	}

	#maybeStop(): void {
		if (this.#table || this.#lobby || !this.#timer) return;
		clearInterval(this.#timer);
		this.#timer = undefined;
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
			this.last = null;
		}
		return code !== null;
	}

	#step(): void {
		if (!this.#follow()) return;
		const real = Date.now();
		const atTable = shown(this.#table);
		// the clock only ticks for someone looking (it ran 4× a second whenever you were in a squad, 2026-11-20)
		if (atTable || shown(this.#lobby)) this.now = this.#time();
		if (!atTable) {
			if (this.#seated) {
				this.#offSince ??= real;
				if (real - this.#offSince > AWAY_LEAVE) void this.#getUp();
			}
			// Battery saver: the lobby's "n at the table" count three times less often
			if (shown(this.#lobby) && real - this.#pulled > POLL_LOBBY * (saverOn() ? 3 : 1)) this.#pull();
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
		// a hand whose time ran out: settle it (staggered by seat so the pages don't all try at once)
		const r = doc?.round;
		const tried = this.#finishing?.id === r?.id && real - (this.#finishing?.at ?? 0) < 2_000;
		if (r && !r.done && !tried && viewRound(r, this.now, GRACE).phase === 'settle') {
			const lag = (doc?.seats[me.id]?.n ?? 0) * 400;
			if (viewRound(r, this.now - lag, GRACE).phase === 'settle') void this.#finish(r.id);
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
