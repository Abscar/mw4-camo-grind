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
 * Stored per device under its own key (code + who you are), not in saves, backups or sync.
 */

import { goto } from '$app/navigation';
import { OFFLINE_FILE } from './browser.ts';
import { progress } from './progress.svelte.ts';
import { SITE_URL, SYNC_URL } from './site.ts';
import {
	emptySquad,
	fromSquadWire,
	isMemberId,
	isOnline,
	makeMemberId,
	makeSquadCode,
	memberByName,
	memberEntry,
	memberStats,
	rankMembers,
	squadCodeFromHash,
	toSquadWire,
	withMember,
	withoutMember,
	cleanName,
	SQUAD_OPS,
	type MemberStats,
	type SquadDoc,
	type SquadMember,
	type SquadOp
} from './squad-codec.ts';
import { isSyncCode } from './sync-codec.ts';

const KEY = 'mw4-camo-grind:squad';
const ENDPOINT = (((import.meta.env.VITE_SYNC_URL as string | undefined) || SYNC_URL) ?? '').replace(/\/+$/, '');
/** Wait this long after a tick before sending it (several quick ticks go as one). */
const PUBLISH_DELAY = 1500;
/** Say hello this often while the page is open. */
const HEARTBEAT = 2 * 60_000;
/** Read the squad this often while the page is visible. */
const PULL_EVERY = 30_000;
/** Keep saying hello this long after the page was last looked at (alt-tabbed into the game). */
const HIDDEN_GRACE = 30 * 60_000;

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

function readSaved(): { code: string; me: Me } | null {
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
		const me = raw?.me;
		if (
			typeof raw?.code !== 'string' ||
			!isSyncCode(raw.code) ||
			typeof me?.id !== 'string' ||
			!isMemberId(me.id) ||
			!cleanName(me.name)
		)
			return null;
		const op = (SQUAD_OPS as readonly string[]).includes(me.op) ? (me.op as SquadOp) : null;
		return { code: raw.code, me: { id: me.id, name: cleanName(me.name), op } };
	} catch {
		return null;
	}
}

async function request(code: string, init?: RequestInit): Promise<Response | 'offline'> {
	try {
		return await fetch(`${ENDPOINT}/v1/${code}`, { cache: 'no-store', ...init });
	} catch {
		return 'offline';
	}
}

/** A stored document: a squad, or something else under that code (e.g. a pasted sync code). */
async function readBody(response: Response): Promise<{ rev: number; doc: SquadDoc | null } | null> {
	try {
		const body = await response.json();
		return Number.isInteger(body?.rev) ? { rev: body.rev, doc: fromSquadWire(body.data) } : null;
	} catch {
		return null;
	}
}

/** Look at a squad before joining it. */
export async function peekSquad(code: string): Promise<Peek> {
	const response = await request(code);
	if (response === 'offline') return 'offline';
	if (response.status === 404) return 'not-found';
	if (!response.ok) return 'error';
	const body = await readBody(response);
	if (!body) return 'error';
	return body.doc ? { rev: body.rev, doc: body.doc } : 'not-squad';
}

class Squad {
	/** False until the sync service is online (SYNC_URL); the app then shows nothing about the squad. */
	readonly available = ENDPOINT !== '';
	code = $state<string | null>(null);
	me = $state<Me | null>(null);
	doc = $state<SquadDoc | null>(null);
	status = $state<SquadStatus>('off');
	/** When the squad was last read or written (ms, this device's clock). */
	updatedAt = $state<number | null>(null);
	/** A squad code from the address bar, waiting for the Squad tab to ask about it. */
	offer = $state<string | null>(null);
	/** Goes up when the page should switch to the Squad tab (a squad link was opened). */
	showTab = $state(0);
	/** The sync service's clock, refreshed every 20 seconds (Online, "5 min ago"). */
	now = $state(Date.now());

	#rev = 0;
	/** The sync service's clock minus this device's, learned from its answers. */
	#offset = 0;
	#queue: Promise<unknown> = Promise.resolve();
	#publishTimer: ReturnType<typeof setTimeout> | undefined;
	#lookedAt = Date.now();
	#saidAway = false;
	#started = false;

	get on(): boolean {
		return this.code !== null && this.me !== null;
	}

	/** Everyone in the squad, furthest along first; your own entry follows your ticks right away. */
	entries = $derived.by((): SquadEntry[] => {
		const me = this.me;
		if (!this.doc || !me) return [];
		const members = { ...this.doc.members };
		members[me.id] = {
			...(members[me.id] ?? { seen: this.now }),
			name: me.name,
			op: me.op ?? undefined,
			seen: this.now,
			away: false,
			weapons: progress.weapons,
			mastery: progress.mastery,
			tickAt: progress.lastTickAt ? Date.parse(progress.lastTickAt) : undefined
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
		return matches.find((e) => e.mine) ?? matches.sort((a, b) => b.member.seen - a.member.seen)[0] ?? null;
	}

	/** Call once in the browser, after progress.load(). Returns a function that stops it. */
	start(): () => void {
		if (!this.available || this.#started) return () => {};
		this.#started = true;
		const saved = readSaved();
		if (saved) {
			this.code = saved.code;
			this.me = saved.me;
			this.status = 'loading';
		}
		this.#checkAddress();

		const stopSaved = progress.onSaved(() => {
			this.#lookedAt = Date.now();
			this.#schedulePublish();
		});
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
		const beat = setInterval(() => this.#heartbeat(), HEARTBEAT);
		const clock = setInterval(() => (this.now = this.serverNow()), 20_000);
		if (this.on) void this.#refresh();

		return () => {
			stopSaved();
			document.removeEventListener('visibilitychange', onVisible);
			window.removeEventListener('online', onOnline);
			window.removeEventListener('hashchange', onHash);
			window.removeEventListener('pagehide', onHide);
			clearInterval(pull);
			clearInterval(beat);
			clearInterval(clock);
		};
	}

	serverNow(): number {
		return Date.now() + this.#offset;
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
		this.#use(code, { id, name: cleanName(name), op }, peeked.rev, peeked.doc);
		await this.#publish();
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
		if (me) await this.#write((doc) => withoutMember(doc, me.id));
		this.#forget();
	}

	/** Take someone else's entry out (an old device, a test). They come back if their page is still open. */
	async remove(id: string): Promise<void> {
		if (id === this.me?.id) return;
		await this.#write((doc) => withoutMember(doc, id));
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

	#use(code: string, me: Me, rev: number, doc: SquadDoc): void {
		clearTimeout(this.#publishTimer);
		this.code = code;
		this.me = me;
		this.#rev = rev;
		this.doc = doc;
		this.status = 'loading';
		this.#saidAway = false;
		this.#persist();
	}

	#forget(): void {
		clearTimeout(this.#publishTimer);
		this.code = null;
		this.me = null;
		this.doc = null;
		this.#rev = 0;
		this.status = 'off';
		this.updatedAt = null;
		try {
			localStorage.removeItem(KEY);
		} catch {
			// nothing saved
		}
	}

	#persist(): void {
		if (!this.code || !this.me) return;
		try {
			localStorage.setItem(KEY, JSON.stringify({ code: this.code, me: this.me }));
		} catch {
			// storage full or blocked: works for this visit
		}
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

	/** The page is closing: mark yourself away right now (one try, the page won't wait for retries). */
	#goodbye(): void {
		const me = this.me;
		if (!this.on || !this.doc || !me || !this.code) return;
		clearTimeout(this.#publishTimer);
		const next = withMember(this.doc, me.id, this.#entry(me, true));
		if (!next) return;
		void request(this.code, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ baseRev: this.#rev, data: toSquadWire(next) }),
			keepalive: true
		});
	}

	#entry(me: Me, away = false): SquadMember {
		const entry = memberEntry(
			me,
			{ weapons: progress.weapons, mastery: progress.mastery, lastTickAt: progress.lastTickAt },
			this.serverNow(),
			away
		);
		// what a newer page (your other device) added to your entry stays
		const more = this.doc?.members[me.id]?.more;
		return more ? { ...entry, more } : entry;
	}

	/** Read, then say hello (with your latest ticks). */
	async #refresh(): Promise<void> {
		await this.#pull();
		await this.#publish();
	}

	#publish(away = false): Promise<void> {
		clearTimeout(this.#publishTimer);
		this.#publishTimer = undefined;
		return this.#write((doc) => {
			const me = this.me;
			return me ? withMember(doc, me.id, this.#entry(me, away)) : doc;
		});
	}

	/** One network step at a time, in order. */
	#serial<T>(step: () => Promise<T>): Promise<T> {
		const run = this.#queue.then(step, step);
		this.#queue = run.catch(() => {});
		return run;
	}

	#pull(): Promise<void> {
		return this.#serial(async () => {
			const code = this.code;
			if (!code) return;
			const response = await request(code);
			if (this.code !== code) return;
			if (response === 'offline') return this.#fail('offline');
			if (response.status === 404) {
				// nothing stored (yet): the next hello starts it again
				this.#rev = 0;
				this.doc = emptySquad();
				return;
			}
			if (!response.ok) return this.#fail('error');
			const body = await readBody(response);
			if (!body?.doc) return this.#fail('error');
			this.#rev = body.rev;
			this.doc = body.doc;
			this.updatedAt = Date.now();
			if (this.status !== 'full') this.status = 'ok';
		});
	}

	/**
	 * Change the squad document: `change` gets the latest copy and returns the new one (null = the
	 * squad is full). A refused write (someone else wrote first) is redone on their version.
	 */
	#write(change: (doc: SquadDoc) => SquadDoc | null): Promise<void> {
		return this.#serial(async () => {
			const code = this.code;
			if (!code) return;
			for (let attempt = 0; attempt < 5 && this.code === code; attempt++) {
				const next = change(this.doc ?? emptySquad());
				if (!next) {
					this.status = 'full';
					return;
				}
				const sent = Date.now();
				const response = await request(code, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ baseRev: this.#rev, data: toSquadWire(next) })
				});
				if (this.code !== code) return;
				if (response === 'offline') return this.#fail('offline');
				if (response.ok) {
					const body = await response.json().catch(() => null);
					if (!Number.isInteger(body?.rev)) return this.#fail('error');
					const serverTime = Date.parse(body.savedAt);
					if (Number.isFinite(serverTime)) this.#offset = serverTime - (sent + Date.now()) / 2;
					this.now = this.serverNow();
					this.#rev = body.rev;
					this.doc = next;
					this.updatedAt = Date.now();
					this.status = 'ok';
					return;
				}
				if (response.status === 409) {
					const body = await readBody(response);
					// never write over something that isn't a squad (a sync code pasted by mistake)
					if (!body?.doc) return this.#fail('error');
					this.#rev = body.rev;
					this.doc = body.doc;
				} else if (response.status === 404) {
					this.#rev = 0;
					this.doc = emptySquad();
				} else return this.#fail('error');
			}
			this.#fail('error');
		});
	}

	#fail(why: 'offline' | 'error'): void {
		this.status = why === 'offline' || (typeof navigator !== 'undefined' && !navigator.onLine) ? 'offline' : 'error';
	}
}

export const squad = new Squad();
