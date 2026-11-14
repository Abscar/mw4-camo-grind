/**
 * The squad (2026-11-14, the user's ask): see each other's grind, with Online / Offline.
 *
 * No accounts. "Create a squad" makes a long random code; the squad link (<site>#squad=<code>)
 * sent to friends lets them join with a name (and, if they like, which operator in the header
 * they are). The squad is one small document on the sync service (sync-worker/), the same one
 * that keeps a person's own devices in step, under the squad's code. Each member's page writes
 * only its own entry (squad-codec.ts): their ticks and Mastery counts a moment after every
 * change, and a hello every 2 minutes while the page is open (Online). The squad is read when the
 * page opens, every 30 seconds while it's visible and when you come back to the tab.
 *
 * "Online" = their page is open: visible, or hidden for less than 30 minutes (alt-tabbed into the
 * game). It can't see whether someone is actually in a match.
 *
 * Step 2 (same day, the user said "alla" to a list of extras): tick times of the last weeks
 * (weekly MVP, streaks, duels), Ready up, ping, duels in the squad document; the squad radio
 * (chat + automatic events + 🔥) in its own document next to it (squad-radio.ts); the friends'
 * new camos and Divergence go to the kill feed / flash / buddy (feed.svelte.ts).
 *
 * Stored per device under its own keys (code + who you are, what you last saw), not in saves,
 * backups or sync.
 */

import { goto } from '$app/navigation';
import { OFFLINE_FILE } from './browser.ts';
import { MASTERY_TRACKS } from './data/camos.ts';
import { WEAPON_BY_ID } from './data/weapons.ts';
import { feed } from './feed.svelte.ts';
import { t } from './i18n/en.ts';
import { progress } from './progress.svelte.ts';
import { SITE_URL, SYNC_URL } from './site.ts';
import {
	cleanName,
	cleanStake,
	emptySquad,
	fromSquadWire,
	isMemberId,
	isOnline,
	makeMemberId,
	makeSquadCode,
	masteryStatuses,
	memberByName,
	memberEntry,
	memberStats,
	rankMembers,
	squadCodeFromHash,
	squadGains,
	toSquadWire,
	withDuel,
	withMember,
	withoutDuel,
	withoutMember,
	SQUAD_OPS,
	type MemberStats,
	type SeenSnapshot,
	type SquadDoc,
	type SquadMember,
	type SquadOp
} from './squad-codec.ts';
import {
	emptyRadio,
	fromRadioWire,
	newMsg,
	radioCode,
	toggleFire,
	toRadioWire,
	unreadCount,
	withMsg,
	type RadioDoc
} from './squad-radio.ts';
import { isSyncCode } from './sync-codec.ts';

const KEY = 'mw4-camo-grind:squad';
/** What this device last saw of the others (for the kill feed), per squad code. */
const SEEN_KEY = 'mw4-camo-grind:squad-seen';
/** When you last looked at the radio (unread count). */
const READ_KEY = 'mw4-camo-grind:squad-read';
const ENDPOINT = (((import.meta.env.VITE_SYNC_URL as string | undefined) || SYNC_URL) ?? '').replace(/\/+$/, '');
/** Wait this long after a tick before sending it (several quick ticks go as one). */
const PUBLISH_DELAY = 1500;
/** Say hello this often while the page is open. */
const HEARTBEAT = 2 * 60_000;
/** Read the squad this often while the page is visible. */
const PULL_EVERY = 30_000;
/** Read the radio this often while the page is visible. */
const RADIO_EVERY = 20_000;
/** Keep saying hello this long after the page was last looked at (alt-tabbed into the game). */
const HIDDEN_GRACE = 30 * 60_000;
/** At most this many of a friend's camos go to the kill feed at once (after a long time away). */
const FEED_MAX = 4;

export type SquadStatus = 'off' | 'loading' | 'ok' | 'offline' | 'error' | 'full';
export type Peek = { rev: number; doc: SquadDoc } | 'not-found' | 'not-squad' | 'offline' | 'error';

export interface Me {
	id: string;
	name: string;
	op: SquadOp | null;
}

export interface SquadEntry {
	id: string;
	member: SquadMember;
	stats: MemberStats;
	mine: boolean;
	online: boolean;
}

function readJson(key: string): unknown {
	try {
		return JSON.parse(localStorage.getItem(key) ?? 'null');
	} catch {
		return null;
	}
}

function writeJson(key: string, value: unknown): void {
	try {
		if (value === null) localStorage.removeItem(key);
		else localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// storage full or blocked: works for this visit
	}
}

function readSaved(): { code: string; me: Me } | null {
	const raw = readJson(KEY) as { code?: unknown; me?: { id?: unknown; name?: unknown; op?: unknown } } | null;
	const me = raw?.me;
	if (typeof raw?.code !== 'string' || !isSyncCode(raw.code) || typeof me?.id !== 'string' || !isMemberId(me.id) || !cleanName(me.name)) return null;
	const op = (SQUAD_OPS as readonly unknown[]).includes(me.op) ? (me.op as SquadOp) : null;
	return { code: raw.code, me: { id: me.id, name: cleanName(me.name), op } };
}

async function request(code: string, init?: RequestInit): Promise<Response | 'offline'> {
	try {
		return await fetch(`${ENDPOINT}/v1/${code}`, { cache: 'no-store', ...init });
	} catch {
		return 'offline';
	}
}

/** Look at a squad before joining it. */
export async function peekSquad(code: string): Promise<Peek> {
	const response = await request(code);
	if (response === 'offline') return 'offline';
	if (response.status === 404) return 'not-found';
	if (!response.ok) return 'error';
	try {
		const body = await response.json();
		if (!Number.isInteger(body?.rev)) return 'error';
		const doc = fromSquadWire(body.data);
		return doc ? { rev: body.rev, doc } : 'not-squad';
	} catch {
		return 'error';
	}
}

type Outcome = 'ok' | 'offline' | 'error' | 'refused' | 'gone';

/**
 * One document on the sync service (the squad, or its radio): read it, or change it with
 * `change(latest) → next` (null = refuse). A refused write (someone else wrote first) is redone on
 * their newer copy; one network step at a time.
 */
class Channel<T> {
	code: string | null = null;
	rev = 0;
	doc = $state<T | null>(null);
	/** The sync service's clock minus this device's (from its answers to writes). */
	offset: number | null = null;

	#queue: Promise<unknown> = Promise.resolve();
	private parse: (raw: unknown) => T | null;
	private wire: (doc: T) => unknown;
	private empty: () => T;
	private onDoc: (doc: T) => void;

	constructor(parse: (raw: unknown) => T | null, wire: (doc: T) => unknown, empty: () => T, onDoc: (doc: T) => void = () => {}) {
		this.parse = parse;
		this.wire = wire;
		this.empty = empty;
		this.onDoc = onDoc;
	}

	use(code: string | null, rev = 0, doc: T | null = null): void {
		this.code = code;
		this.rev = rev;
		this.doc = doc;
	}

	#serial<R>(step: () => Promise<R>): Promise<R> {
		const run = this.#queue.then(step, step);
		this.#queue = run.catch(() => {});
		return run;
	}

	#take(rev: number, doc: T): void {
		this.rev = rev;
		this.doc = doc;
		this.onDoc(doc);
	}

	pull(): Promise<Outcome> {
		return this.#serial(async () => {
			const code = this.code;
			if (!code) return 'gone';
			const response = await request(code);
			if (this.code !== code) return 'gone';
			if (response === 'offline') return 'offline';
			if (response.status === 404) {
				// nothing stored (yet): the next write starts it again
				this.rev = 0;
				this.doc = this.empty();
				return 'ok';
			}
			if (!response.ok) return 'error';
			const body = await response.json().catch(() => null);
			const doc = Number.isInteger(body?.rev) ? this.parse(body.data) : null;
			if (!doc) return 'error';
			this.#take(body.rev, doc);
			return 'ok';
		});
	}

	write(change: (doc: T) => T | null): Promise<Outcome> {
		return this.#serial(async () => {
			const code = this.code;
			if (!code) return 'gone';
			for (let attempt = 0; attempt < 5 && this.code === code; attempt++) {
				const next = change(this.doc ?? this.empty());
				if (!next) return 'refused';
				const sent = Date.now();
				const response = await request(code, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ baseRev: this.rev, data: this.wire(next) })
				});
				if (this.code !== code) return 'gone';
				if (response === 'offline') return 'offline';
				if (response.ok) {
					const body = await response.json().catch(() => null);
					if (!Number.isInteger(body?.rev)) return 'error';
					const serverTime = Date.parse(body.savedAt);
					if (Number.isFinite(serverTime)) this.offset = serverTime - (sent + Date.now()) / 2;
					this.#take(body.rev, next);
					return 'ok';
				}
				if (response.status === 409) {
					const body = await response.json().catch(() => null);
					// never write over something that isn't ours (a sync code pasted by mistake)
					const doc = Number.isInteger(body?.rev) ? this.parse(body.data) : null;
					if (!doc) return 'error';
					this.#take(body.rev, doc);
				} else if (response.status === 404) {
					this.rev = 0;
					this.doc = this.empty();
				} else return 'error';
			}
			return 'error';
		});
	}

	/** The page is closing: one write, no retries (the page won't wait for them). */
	lastWrite(next: T): void {
		if (!this.code) return;
		void request(this.code, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ baseRev: this.rev, data: this.wire(next) }),
			keepalive: true
		});
	}
}

class Squad {
	/** False until the sync service is online (SYNC_URL); the app then shows nothing about the squad. */
	readonly available = ENDPOINT !== '';
	code = $state<string | null>(null);
	me = $state<Me | null>(null);
	status = $state<SquadStatus>('off');
	/** When the squad was last read or written (ms, this device's clock). */
	updatedAt = $state<number | null>(null);
	/** A squad code from the address bar, waiting for the Squad tab to ask about it. */
	offer = $state<string | null>(null);
	/** Goes up when the page should switch to the Squad tab (a squad link was opened). */
	showTab = $state(0);
	/** The sync service's clock, refreshed every 20 seconds (Online, "5 min ago"). */
	now = $state(Date.now());
	/** When you pressed Ready up (null = not ready). */
	readyAt = $state<number | null>(null);
	/** When you last read the radio (sync service's clock). */
	readAt = $state(0);
	/** Pings / ready banners you closed (by "<member>:<time>"). */
	dismissed = $state<string[]>([]);

	#squad = new Channel<SquadDoc>(fromSquadWire, toSquadWire, emptySquad, (doc) => this.#onSquad(doc));
	#radio = new Channel<RadioDoc>(fromRadioWire, toRadioWire, emptyRadio);
	#ping: { to: string; at: number } | null = null;
	#publishTimer: ReturnType<typeof setTimeout> | undefined;
	#lookedAt = Date.now();
	#saidAway = false;
	#started = false;
	/** Mastery camos already complete here (a new one goes on the radio). */
	#masteryDone = new Set<string>();

	get on(): boolean {
		return this.code !== null && this.me !== null;
	}

	get doc(): SquadDoc | null {
		return this.#squad.doc;
	}

	get radio(): RadioDoc | null {
		return this.#radio.doc;
	}

	/** Radio messages from the others since you last read it. */
	unread = $derived(unreadCount(this.#radio.doc, this.me?.id ?? null, this.readAt));

	/** Everyone in the squad, furthest along first; your own entry follows your ticks right away. */
	entries = $derived.by((): SquadEntry[] => {
		const me = this.me;
		const doc = this.#squad.doc;
		if (!doc || !me) return [];
		const members = { ...doc.members };
		members[me.id] = {
			...(members[me.id] ?? { seen: this.now }),
			name: me.name,
			op: me.op ?? undefined,
			seen: this.now,
			away: false,
			weapons: progress.weapons,
			mastery: progress.mastery,
			tickAt: progress.lastTickAt ? Date.parse(progress.lastTickAt) : undefined,
			recent: memberEntry(me, this.#progressNow(), this.now).recent,
			readyAt: this.readyAt ?? undefined
		};
		return rankMembers(
			Object.entries(members).map(([id, member]) => ({
				id,
				member,
				stats: memberStats(member),
				mine: id === me.id,
				online: id === me.id || isOnline(member, this.now)
			}))
		);
	});

	/** The squad member who is this operator in the header (you first, else whoever was seen last). */
	forOp(op: SquadOp): SquadEntry | null {
		const matches = this.entries.filter((e) => e.member.op === op);
		return matches.find((e) => e.mine) ?? [...matches].sort((a, b) => b.member.seen - a.member.seen)[0] ?? null;
	}

	byId(id: string): SquadEntry | null {
		return this.entries.find((e) => e.id === id) ?? null;
	}

	/** Call once in the browser, after progress.load(). Returns a function that stops it. */
	start(): () => void {
		if (!this.available || this.#started) return () => {};
		this.#started = true;
		const saved = readSaved();
		if (saved) this.#use(saved.code, saved.me, 0, null);
		const read = readJson(READ_KEY);
		if (typeof read === 'number') this.readAt = read;
		this.#masteryDone = this.#completeMastery();
		this.#checkAddress();

		const stopSaved = progress.onSaved(() => {
			this.#lookedAt = Date.now();
			this.#schedulePublish();
			this.#masteryNews();
		});
		const stopGain = feed.onGain((g) => this.#ownNews(g));
		const onVisible = () => {
			if (document.visibilityState !== 'visible') return;
			this.#lookedAt = Date.now();
			if (this.on) void this.#refresh();
		};
		const onOnline = () => this.on && void this.#refresh();
		const onHash = () => this.#checkAddress();
		const onHide = () => this.#goodbye();
		document.addEventListener('visibilitychange', onVisible);
		window.addEventListener('online', onOnline);
		window.addEventListener('hashchange', onHash);
		window.addEventListener('pagehide', onHide);
		const pull = setInterval(() => {
			if (this.on && document.visibilityState === 'visible') void this.#pull();
		}, PULL_EVERY);
		const radio = setInterval(() => {
			if (this.on && document.visibilityState === 'visible') void this.#radio.pull();
		}, RADIO_EVERY);
		const beat = setInterval(() => this.#heartbeat(), HEARTBEAT);
		const clock = setInterval(() => (this.now = this.serverNow()), 20_000);
		if (this.on) void this.#refresh();

		return () => {
			stopSaved();
			stopGain();
			document.removeEventListener('visibilitychange', onVisible);
			window.removeEventListener('online', onOnline);
			window.removeEventListener('hashchange', onHash);
			window.removeEventListener('pagehide', onHide);
			clearInterval(pull);
			clearInterval(radio);
			clearInterval(beat);
			clearInterval(clock);
		};
	}

	serverNow(): number {
		return Date.now() + (this.#squad.offset ?? this.#radio.offset ?? 0);
	}

	/** Start a new squad with you in it. */
	async create(name: string, op: SquadOp | null): Promise<SquadStatus> {
		this.#use(makeSquadCode(), { id: makeMemberId(), name: cleanName(name), op }, 0, emptySquad());
		await this.#publish();
		return this.status;
	}

	/**
	 * Join a squad you looked at (peekSquad). Someone with the same name already in it is taken to be
	 * you on another device, so you keep one entry.
	 */
	async join(code: string, peeked: { rev: number; doc: SquadDoc }, name: string, op: SquadOp | null): Promise<SquadStatus> {
		const id = memberByName(peeked.doc, name) ?? makeMemberId();
		// nothing from before you joined goes to the kill feed
		writeJson(SEEN_KEY, { code, seen: squadGains(null, peeked.doc, id).next });
		this.#use(code, { id, name: cleanName(name), op }, peeked.rev, peeked.doc);
		await this.#publish();
		void this.#radio.pull();
		return this.status;
	}

	/** Change your name or operator. */
	async edit(name: string, op: SquadOp | null): Promise<void> {
		if (!this.me) return;
		this.me = { ...this.me, name: cleanName(name) || this.me.name, op };
		this.#persist();
		await this.#publish();
	}

	/** Take yourself out of the squad and forget it on this device. */
	async leave(): Promise<void> {
		const me = this.me;
		if (me) await this.#squad.write((doc) => withoutMember(doc, me.id));
		this.#forget();
	}

	/** Take someone else's entry out (an old device, a test). They come back if their page is still open. */
	async remove(id: string): Promise<void> {
		if (id === this.me?.id) return;
		this.#done(await this.#squad.write((doc) => withoutMember(doc, id)));
	}

	/** Ready up / stand down: a banner on the others' pages while you're online. */
	async toggleReady(): Promise<void> {
		if (!this.me) return;
		this.readyAt = this.readyAt ? null : this.serverNow();
		await this.#publish();
		if (this.readyAt) await this.#event(t.squad.radio.readyEvent);
	}

	/** Knock on someone's door (terminal `ping <name>`). */
	async ping(id: string): Promise<boolean> {
		if (!this.me || id === this.me.id || !this.doc?.members[id]) return false;
		this.#ping = { to: id, at: this.serverNow() };
		await this.#publish();
		return this.status === 'ok';
	}

	/** Start a duel: first to `goal` on `weapon`; the loser gets the stake as a sticker. */
	async startDuel(other: string, weapon: string, goal: number, stake: string): Promise<boolean> {
		const me = this.me;
		if (!me) return false;
		const duel = { id: makeMemberId(), a: me.id, b: other, weapon, goal, stake: cleanStake(stake), at: this.serverNow() };
		const outcome = await this.#squad.write((doc) => withDuel(doc, duel));
		this.#done(outcome);
		if (outcome === 'ok') {
			const name = this.doc?.members[other]?.name ?? '';
			await this.#event(t.squad.duel.event(name, t.squad.levelLong[goal], WEAPON_BY_ID.get(weapon)?.name ?? weapon));
		}
		return outcome === 'ok';
	}

	async removeDuel(id: string): Promise<void> {
		this.#done(await this.#squad.write((doc) => withoutDuel(doc, id)));
	}

	/** Send a radio message. */
	async say(text: string): Promise<boolean> {
		const me = this.me;
		if (!me) return false;
		const msg = newMsg(me.id, me.name, text, this.serverNow());
		if (!msg) return false;
		const outcome = await this.#radio.write((doc) => withMsg(doc, msg));
		this.markRead();
		return outcome === 'ok';
	}

	/** 🔥 on / off on a message. */
	async fire(msgId: string): Promise<void> {
		const me = this.me;
		if (me) await this.#radio.write((doc) => toggleFire(doc, msgId, me.id));
	}

	/** Everything on the radio so far has been seen (not "everything until now": a line posted a moment
	 *  ago may not have arrived yet). */
	markRead(): void {
		const latest = Math.max(this.readAt, ...(this.radio?.msgs.map((m) => m.at) ?? [0]));
		if (latest === this.readAt) return;
		this.readAt = latest;
		writeJson(READ_KEY, latest);
	}

	dismiss(key: string): void {
		this.dismissed = [...this.dismissed, key];
	}

	/** The link to send to your squad, or null when you aren't in one. */
	link(): string | null {
		if (!this.code) return null;
		const base = OFFLINE_FILE ? SITE_URL : location.origin + location.pathname;
		return `${base.split('#')[0]}#squad=${this.code}`;
	}

	refreshNow(): Promise<void> {
		return this.#refresh();
	}

	#progressNow() {
		return { weapons: progress.weapons, mastery: progress.mastery, lastTickAt: progress.lastTickAt, stamps: progress.stamps };
	}

	#use(code: string, me: Me, rev: number, doc: SquadDoc | null): void {
		clearTimeout(this.#publishTimer);
		this.code = code;
		this.me = me;
		this.#squad.use(code, rev, doc);
		this.#radio.use(radioCode(code));
		this.status = 'loading';
		this.#saidAway = false;
		this.#persist();
	}

	#forget(): void {
		clearTimeout(this.#publishTimer);
		this.code = null;
		this.me = null;
		this.#squad.use(null);
		this.#radio.use(null);
		this.status = 'off';
		this.updatedAt = null;
		this.readyAt = null;
		this.#ping = null;
		writeJson(KEY, null);
		writeJson(SEEN_KEY, null);
	}

	#persist(): void {
		if (this.code && this.me) writeJson(KEY, { code: this.code, me: this.me });
	}

	/** A squad link was opened on this page (website only: the offline file routes by hash). */
	#checkAddress(): void {
		if (OFFLINE_FILE) return;
		const code = squadCodeFromHash(location.hash);
		if (!code) return;
		goto(location.pathname + location.search, { replace: true, shallow: true }).catch(() => {});
		this.offer = code;
		this.showTab++;
	}

	/** Every fresh copy of the squad: the friends' new camos go to the kill feed (only what's new since last time). */
	#onSquad(doc: SquadDoc): void {
		const me = this.me;
		if (!me || !this.code) return;
		this.updatedAt = Date.now();
		const saved = readJson(SEEN_KEY) as { code?: string; seen?: SeenSnapshot } | null;
		const before = saved?.code === this.code && saved.seen ? saved.seen : null;
		const { gains, nukes, next } = squadGains(before, doc, me.id);
		writeJson(SEEN_KEY, { code: this.code, seen: next });
		for (const g of gains.slice(-FEED_MAX)) feed.squadGain(g.name, g.weaponId, g.level, g.level >= 3);
		if (nukes.length) feed.squadNuke(nukes[nukes.length - 1]);
	}

	#schedulePublish(): void {
		if (!this.on) return;
		clearTimeout(this.#publishTimer);
		this.#publishTimer = setTimeout(() => void this.#publish(), PUBLISH_DELAY);
	}

	#heartbeat(): void {
		if (!this.on) return;
		const looking = document.visibilityState === 'visible' || Date.now() - this.#lookedAt < HIDDEN_GRACE;
		if (looking) {
			this.#saidAway = false;
			void this.#publish();
		} else if (!this.#saidAway) {
			this.#saidAway = true;
			void this.#publish(true);
		}
	}

	/** The page is closing: mark yourself away right now. */
	#goodbye(): void {
		const me = this.me;
		const doc = this.#squad.doc;
		if (!this.on || !doc || !me) return;
		clearTimeout(this.#publishTimer);
		const next = withMember(doc, me.id, this.#entry(me, true));
		if (next) this.#squad.lastWrite(next);
	}

	#entry(me: Me, away = false): SquadMember {
		const entry = memberEntry(me, this.#progressNow(), this.serverNow(), away, { readyAt: this.readyAt, ping: this.#ping });
		// what a newer page (your other device) added to your entry stays
		const more = this.#squad.doc?.members[me.id]?.more;
		return more ? { ...entry, more } : entry;
	}

	/** Read, then say hello (with your latest ticks). */
	async #refresh(): Promise<void> {
		await this.#pull();
		await this.#publish();
		await this.#radio.pull();
	}

	async #pull(): Promise<void> {
		this.#done(await this.#squad.pull());
	}

	async #publish(away = false): Promise<void> {
		clearTimeout(this.#publishTimer);
		this.#publishTimer = undefined;
		const outcome = await this.#squad.write((doc) => {
			const me = this.me;
			return me ? withMember(doc, me.id, this.#entry(me, away)) : doc;
		});
		if (outcome === 'ok') this.now = this.serverNow();
		this.#done(outcome);
	}

	#done(outcome: Outcome): void {
		if (outcome === 'gone') return;
		if (outcome === 'ok') this.status = 'ok';
		else if (outcome === 'refused') this.status = 'full';
		else this.status = outcome === 'offline' || (typeof navigator !== 'undefined' && !navigator.onLine) ? 'offline' : 'error';
	}

	/** An automatic radio line from your page. */
	async #event(text: string): Promise<void> {
		const me = this.me;
		if (!me) return;
		const msg = newMsg(me.id, me.name, text, this.serverNow(), 'event');
		if (msg) await this.#radio.write((doc) => withMsg(doc, msg));
	}

	/** Your own big moments go on the radio: a maxed weapon, Divergence. */
	#ownNews(g: { weaponId: string; maxed: boolean; divergence: boolean; who?: string }): void {
		if (!this.on || g.who) return;
		const weapon = WEAPON_BY_ID.get(g.weaponId)?.name ?? g.weaponId;
		if (g.divergence) void this.#event(t.squad.radio.nukeEvent);
		else if (g.maxed) void this.#event(t.squad.radio.maxedEvent(weapon));
	}

	#completeMastery(): Set<string> {
		const statuses = masteryStatuses(progress.weapons, progress.mastery);
		const done = new Set<string>();
		for (const track of MASTERY_TRACKS) track.camos.forEach((c, i) => statuses[track.mode][i] === 'complete' && done.add(c.id));
		return done;
	}

	/** A Mastery camo finished since the last save goes on the radio. */
	#masteryNews(): void {
		const now = this.#completeMastery();
		const fresh = [...now].filter((id) => !this.#masteryDone.has(id));
		this.#masteryDone = now;
		if (!this.on) return;
		for (const id of fresh) {
			const camo = MASTERY_TRACKS.flatMap((tr) => tr.camos).find((c) => c.id === id);
			if (camo) void this.#event(t.squad.radio.masteryEvent(camo.name));
		}
	}
}

export const squad = new Squad();
