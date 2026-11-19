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
import { addPlayed, burgerBank, dayKey, mergePlayed, settleDuel, spin, withBet, withoutBet, withPaid, SPIN_LEAD_MS, SQUAD_UP, type BankRow } from './squad-fun.ts';
import { cleanCombat, combatView, mergeCombat, withSnap, type CombatLog, type CombatMode, type CombatSnap } from './squad-combat.ts';
import { cleanRanked, fmtSrDelta, mergeRanked, rankedView, withRanked, type RankedLog } from './squad-ranked.ts';
import { cleanClasses, mergeClasses, withClass, withoutClass, type ClassList, type SquadClass } from './squad-classes.ts';
import { withBan, BAN_OWNER, KD_LIMIT } from './squad-bans.ts';
import { cleanCasino, cleanOnline, count420, countDay, mergeCasino, mergeOnline, seedOnline, withGame, HOUSE_OP, type CasinoLedger, type OnlineDays } from './squad-casino.ts';
import { toast } from './toast.svelte.ts';
import { buy as shopBuy, cleanShop, equip as shopEquip, mergeShop, throwPrank as shopThrow, ITEM_BY_ID, type BuyResult, type ShopSlot, type ShopState } from './shop.ts';
import { cleanLoans, mergeLoans, openLoan, owedOn, repayLoan, takeLoan, type LoanBook } from './loans.ts';
import { cleanDonations, giveTo, goalPassed, mergeDonations, squadGiving, DON_RADIO, type DonationBook, type OrgId } from './donations.ts';
import { is420 } from './four20.ts';
import { cleanTune, forcedFor, luckFor, withUsed, type CasinoTune, type ForceKind, type RigGame } from './casino-rig.ts';

const KEY = 'mw4-camo-grind:squad';
/** Your own K/D, W/L … updates (squad-combat.ts), kept on this device too so leaving a squad doesn't lose them. */
const COMBAT_KEY = 'mw4-camo-grind:combat';
/** Your own Ranked SR updates (squad-ranked.ts), kept on this device too. */
const RANKED_KEY = 'mw4-camo-grind:ranked';
/** The classes you share with the squad (squad-classes.ts), kept on this device too. */
const CLASSES_KEY = 'mw4-camo-grind:squad-classes';
/** Days online with the squad (the daily burger bonus, squad-casino.ts), kept on this device too. */
const ONLINE_KEY = 'mw4-camo-grind:online-days';
/** BurgiCasino's tally per device (squad-casino.ts), and this device's id in it. */
const CASINO_KEY = 'mw4-camo-grind:casino';
const DEVICE_KEY = 'mw4-camo-grind:device';
/** BurgiShop: what you own and wear (shop.ts), kept on this device too. */
const SHOP_KEY = 'mw4-camo-grind:shop';
/** BurgiBank loans (loans.ts), kept on this device too. */
const LOANS_KEY = 'mw4-camo-grind:loans';
/** BurgiGives: what you gave the joke causes (donations.ts), kept on this device too. */
const DONATIONS_KEY = 'mw4-camo-grind:donations';
/** Next-only casino settings this device already took (casino-rig.ts), newest last. */
const RIG_USED_KEY = 'mw4-camo-grind:casino-taken';
const RIG_USED_MAX = 30;
/** What this device last saw of the others (for the kill feed), per squad code. */
const SEEN_KEY = 'mw4-camo-grind:squad-seen';
/** When you last looked at the radio (unread count). */
const READ_KEY = 'mw4-camo-grind:squad-read';
/** Minutes with the tracker open per day on this device (step 3, "Played today"). */
const PLAYED_KEY = 'mw4-camo-grind:played';
/** Count the time with the page open this often. */
const PLAY_TICK = 60_000;
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

export type Outcome = 'ok' | 'offline' | 'error' | 'refused' | 'gone';

/**
 * One document on the sync service (the squad, its radio, the blackjack table): read it, or change it with
 * `change(latest) → next` (null = refuse). A refused write (someone else wrote first) is redone on
 * their newer copy; one network step at a time.
 */
export class Channel<T> {
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
	/** Next-only casino settings this device already took (RIG_USED_KEY). */
	#rigUsed: string[] = [];
	/** Minutes with the tracker open per day (this device; the bigger number of your devices is published). */
	played = $state<Record<string, number>>({});
	/** Your K/D, W/L … as you typed them in (merged with your other device's when the squad is read). */
	combat = $state<CombatLog>({});
	/** Your Ranked SR updates (merged with your other device's when the squad is read). */
	ranked = $state<RankedLog>({});
	/** The classes you share (merged with your other device's when the squad is read). */
	classes = $state<ClassList>({});
	/** Days online with the squad (daily bonus), merged with your other device's. */
	online = $state<OnlineDays | undefined>(undefined);
	/** BurgiCasino's tally per device, merged with your other device's. */
	casino = $state<CasinoLedger>({});
	/** BurgiShop: what you own and wear, merged with your other device's. */
	shop = $state<ShopState | undefined>(undefined);
	/** BurgiBank loans, merged with your other device's. */
	loans = $state<LoanBook | undefined>(undefined);
	/** BurgiGives: what you gave the joke causes, merged with your other device's. */
	donations = $state<DonationBook | undefined>(undefined);
	/** Today's daily bonus when this page counted it (for the casino tab's welcome line). */
	bonusToday = $state<{ amount: number; n: number } | null>(null);
	#device = '';
	#playTick = 0;
	#publishTimer: ReturnType<typeof setTimeout> | undefined;
	#lookedAt = Date.now();
	#saidAway = false;
	#started = false;
	/** Mastery camos already complete here (a new one goes on the radio). */
	#masteryDone = new Set<string>();
	/** Quarter marks reached per Mastery camo (25 / 50 / 75 %: a radio line, not every small step). */
	#masteryQuarters = new Map<string, number>();

	get on(): boolean {
		return this.code !== null && this.me !== null;
	}

	get doc(): SquadDoc | null {
		return this.#squad.doc;
	}

	get radio(): RadioDoc | null {
		return this.#radio.doc;
	}

	/** This device's id (BurgiCasino's tally is kept per device; the blackjack table books by it). */
	get device(): string {
		return this.#device;
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
			readyAt: this.readyAt ?? undefined,
			played: this.played,
			combat: this.combat,
			ranked: this.ranked,
			classes: this.classes,
			online: this.online,
			casino: this.casino,
			shop: this.shop,
			loans: this.loans,
			donations: this.donations
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

	/** How many are online right now (you included). */
	onlineCount = $derived(this.entries.filter((e) => e.online).length);
	/** Squad up: party mode while SQUAD_UP or more are online at once. */
	squadUp = $derived(this.on && this.onlineCount >= SQUAD_UP);

	/** Call once in the browser, after progress.load(). Returns a function that stops it. */
	start(): () => void {
		if (!this.available || this.#started) return () => {};
		this.#started = true;
		const saved = readSaved();
		if (saved) this.#use(saved.code, saved.me, 0, null);
		const read = readJson(READ_KEY);
		if (typeof read === 'number') this.readAt = read;
		const played = readJson(PLAYED_KEY);
		if (played && typeof played === 'object') this.played = addPlayed(played as Record<string, number>, 0, 0);
		this.combat = cleanCombat(readJson(COMBAT_KEY)) ?? {};
		this.ranked = cleanRanked(readJson(RANKED_KEY)) ?? {};
		this.classes = cleanClasses(readJson(CLASSES_KEY)) ?? {};
		this.online = cleanOnline(readJson(ONLINE_KEY));
		this.casino = cleanCasino(readJson(CASINO_KEY)) ?? {};
		this.shop = cleanShop(readJson(SHOP_KEY));
		this.loans = cleanLoans(readJson(LOANS_KEY));
		this.donations = cleanDonations(readJson(DONATIONS_KEY));
		const taken = readJson(RIG_USED_KEY);
		this.#rigUsed = Array.isArray(taken) ? taken.filter((x): x is string => typeof x === 'string').slice(-RIG_USED_MAX) : [];
		const device = readJson(DEVICE_KEY);
		this.#device = typeof device === 'string' && /^[A-Za-z0-9_-]{4,16}$/.test(device) ? device : makeMemberId().slice(0, 10);
		writeJson(DEVICE_KEY, this.#device);
		this.#playTick = Date.now();
		this.#masteryDone = this.#completeMastery();
		this.#masteryQuarters = this.#quarters();
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
		const play = setInterval(() => this.#countPlayed(), PLAY_TICK);
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
			clearInterval(play);
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

	/**
	 * Lift (on = false) or put back (on = true) a member's BANNED stamp for the whole squad
	 * (squad-bans.ts; `key` = their operator, else their member id). Only the owner's operator may: the
	 * button shows only for them, and this refuses anyone else.
	 */
	async setBan(key: string, on: boolean, name: string): Promise<boolean> {
		if (this.me?.op !== BAN_OWNER) return false;
		const at = Math.round(this.serverNow());
		const outcome = await this.#squad.write((doc) => ({ ...doc, bans: withBan(doc.bans, key, on, at) }));
		this.#done(outcome);
		if (outcome === 'ok') await this.#event(on ? t.squad.ban.bannedEvent(name) : t.squad.ban.liftedEvent(name));
		return outcome === 'ok';
	}

	/** Take a duel off the list (a finished one keeps its result for bets and IOUs). */
	async removeDuel(id: string): Promise<void> {
		this.#done(await this.#squad.write((doc) => settleDuel(doc, id, this.#members(doc))));
	}

	/** Spin tonight's roulette for everyone online (or the whole squad when you're alone). */
	async spinRoulette(mode: 'each' | 'class'): Promise<boolean> {
		const me = this.me;
		if (!me) return false;
		const online = this.entries.filter((e) => e.online).map((e) => e.id);
		const ids = online.length >= 2 ? online : this.entries.map((e) => e.id);
		const members = Object.fromEntries(this.entries.map((e) => [e.id, e.member]));
		const drawn = spin(members, ids, mode, Math.floor(Math.random() * 2 ** 31));
		if (!drawn) return false;
		const roulette = { id: makeMemberId(), by: me.id, at: this.serverNow() + SPIN_LEAD_MS, mode, ...drawn };
		const outcome = await this.#squad.write((doc) => ({ ...doc, roulette }));
		this.#done(outcome);
		if (outcome === 'ok') await this.#event(t.squad.roulette.event);
		return outcome === 'ok';
	}

	/** Bet pretend burgers on a duel or the race to Divergence. */
	async placeBet(kind: 'duel' | 'race', ref: string, pick: string, amount: number): Promise<boolean> {
		const me = this.me;
		if (!me) return false;
		const bet = { id: makeMemberId(), by: me.id, kind, ref: kind === 'race' ? '' : ref, pick, amount: Math.floor(amount), at: this.serverNow() };
		const outcome = await this.#squad.write((doc) => withBet(doc, bet, this.#members(doc)));
		this.#done(outcome === 'refused' ? 'ok' : outcome);
		return outcome === 'ok';
	}

	async withdrawBet(id: string): Promise<void> {
		this.#done(await this.#squad.write((doc) => withoutBet(doc, id)));
	}

	/** A real-burger IOU was paid. */
	async markPaid(ids: string[]): Promise<void> {
		this.#done(await this.#squad.write((doc) => withPaid(doc, ids)));
	}

	/** The squad's members with your own entry following your ticks (for bets and duels). */
	#members(doc: SquadDoc): Record<string, SquadMember> {
		const out = { ...doc.members };
		const mine = this.entries.find((e) => e.mine);
		if (mine) out[mine.id] = mine.member;
		return out;
	}

	/** One more minute with the tracker open (visible, or hidden < 30 min: alt-tabbed into the game). */
	#countPlayed(): void {
		const now = Date.now();
		const looking = document.visibilityState === 'visible' || now - this.#lookedAt < HIDDEN_GRACE;
		if (looking) {
			this.played = addPlayed(this.played, this.#playTick, now);
			writeJson(PLAYED_KEY, this.played);
		}
		this.#playTick = now;
	}

	/**
	 * Save today's numbers for a mode (a second save the same day replaces the first), publish them
	 * and say it on the radio. Returns false when the squad couldn't be reached (they're kept here
	 * and go out with the next hello).
	 */
	async saveCombat(mode: CombatMode, values: Omit<CombatSnap, 'at'>): Promise<boolean> {
		if (!this.me) return false;
		const now = Math.round(this.serverNow());
		this.combat = withSnap(this.combat, mode, dayKey(now), { ...values, at: now });
		writeJson(COMBAT_KEY, this.combat);
		await this.#publish();
		const view = combatView(this.combat, mode);
		if (view?.kd != null || view?.wl != null) {
			await this.#event(t.squad.combat.event(mode, view.kd, view.wl, view.before?.kdDelta ?? null));
		}
		// a K/D over the limit is a lie: the stamp goes on by itself (squad-bans.ts), the radio says so
		const kd = view?.kd != null ? Math.round(view.kd * 100) / 100 : null;
		if (kd !== null && kd > KD_LIMIT) await this.#event(t.squad.ban.fakeEvent(kd.toFixed(2), KD_LIMIT));
		return this.status === 'ok';
	}

	/**
	 * Save today's SR (a second save the same day replaces the first), publish it and say it on the
	 * radio. Returns false when the squad couldn't be reached (kept here, goes out with the next hello).
	 */
	async saveRanked(sr: number, top?: number): Promise<boolean> {
		if (!this.me) return false;
		const now = Math.round(this.serverNow());
		this.ranked = withRanked(this.ranked, dayKey(now), { sr, ...(top !== undefined ? { top } : {}), at: now });
		writeJson(RANKED_KEY, this.ranked);
		await this.#publish();
		const view = rankedView(this.ranked);
		if (view) await this.#event(t.squad.ranked.event(view.latest.sr, view.rank.label, view.before ? fmtSrDelta(view.before.delta) : null));
		return this.status === 'ok';
	}

	/** Share a class with the squad. 'full' = you already share the most a member can (remove one first). */
	async addClass(cls: Omit<SquadClass, 'at'>): Promise<'ok' | 'offline' | 'full'> {
		if (!this.me) return 'offline';
		const at = Math.round(this.serverNow());
		const id = makeMemberId().slice(0, 10);
		const next = withClass(this.classes, id, { ...cls, at });
		if (!next) return 'full';
		this.classes = next;
		writeJson(CLASSES_KEY, next);
		await this.#publish();
		const gun = WEAPON_BY_ID.get(cls.w)?.name ?? cls.w;
		await this.#event(t.squad.classes.event(gun, t.squad.classes.kinds[cls.kind], cls.name ?? null));
		return this.status === 'ok' ? 'ok' : 'offline';
	}

	/** Stop sharing a class (removed on your other device too). */
	async removeClass(id: string): Promise<void> {
		if (!this.me) return;
		this.classes = withoutClass(this.classes, id, Math.round(this.serverNow()));
		writeJson(CLASSES_KEY, this.classes);
		await this.#publish();
	}

	/**
	 * Today counts as a day online (once): the daily burger bonus (squad-casino.ts). Members from
	 * before the bonus start from the days the tracker was open (`played`, last 14 days).
	 */
	#countToday(): void {
		let seeded = false;
		if (!this.online) {
			this.online = seedOnline(this.played);
			seeded = !!this.online;
		}
		const { next, added } = countDay(this.online, dayKey(this.serverNow()));
		if (added > 0 || seeded) {
			this.online = next;
			writeJson(ONLINE_KEY, next);
			this.bonusToday = { amount: added, n: next.n };
			// a moment later, so "Squad created / joined" doesn't cover it
			const text = added > 0 ? t.casino.bonus.toast(added, next.n) : t.casino.bonus.seeded(next.n);
			setTimeout(() => toast.show(text, undefined, 6000), 4000);
		}
		// 4:20 (four20.ts): online during the hour = the day's bonus once more
		const now = this.serverNow();
		const f = count420(this.online, dayKey(now), is420(new Date(now)));
		if (f.added > 0 && f.next) {
			this.online = f.next;
			writeJson(ONLINE_KEY, f.next);
			setTimeout(() => toast.show(t.four20.bonus(f.added), undefined, 6000), 5000);
		}
	}

	/** Your burgers right now (the bank: grind + daily bonus + casino + bets + loans + admin), or null outside a squad. */
	get myBank(): BankRow | null {
		const me = this.me;
		const doc = this.#squad.doc;
		if (!me || !doc) return null;
		return burgerBank(doc, this.#members(doc), Math.max(this.now, Date.now()))[me.id] ?? null;
	}

	// ----- BurgiBank loans (loans.ts) -----

	/** Borrow from the bank: the burgers at once, back within a week with interest (that goes to Abscar). */
	borrow(p: number): boolean {
		if (!this.me) return false;
		const now = Math.round(this.serverNow());
		const next = takeLoan(this.loans, makeMemberId().slice(0, 10), p, now);
		if (!next) return false;
		this.loans = next;
		writeJson(LOANS_KEY, next);
		this.#schedulePublish();
		void this.#event(t.loans.takenEvent(p));
		return true;
	}

	/** Pay the open loan back (loan + interest). */
	repay(): boolean {
		const bank = this.myBank;
		if (!this.me || !bank) return false;
		const now = Math.round(this.serverNow());
		const open = openLoan(this.loans, now);
		const next = repayLoan(this.loans, bank.balance, now);
		if (!next || !open) return false;
		this.loans = next;
		writeJson(LOANS_KEY, next);
		this.#schedulePublish();
		void this.#event(t.loans.paidEvent(owedOn(open)));
		return true;
	}

	// ----- BurgiGives (donations.ts) -----

	/**
	 * Give burgers to a joke cause: off your balance for good (to nobody, not the house). Big gifts and a
	 * gift that pushes its cause past a goal go on the radio; `goal` = the goal it passed, if any.
	 */
	donate(org: OrgId, n: number): { result: 'ok'; goal: number | null } | { result: 'broke' | 'bad' | 'off' } {
		const me = this.me;
		const bank = this.myBank;
		if (!me || !bank) return { result: 'off' };
		const members = Object.fromEntries(this.entries.map((e) => [e.id, e.member]));
		const before = squadGiving(members).byOrg[org]?.total ?? 0;
		const r = giveTo(this.donations, this.#device, makeMemberId().slice(0, 10), org, n, bank.balance, Math.round(this.serverNow()));
		if (r.result !== 'ok') return r;
		this.donations = r.book;
		writeJson(DONATIONS_KEY, r.book);
		this.#schedulePublish();
		const goal = goalPassed(before, before + n);
		const name = t.donate.orgs[org].name;
		if (goal !== null) void this.#event(t.donate.goalEvent(n, name, goal));
		else if (n >= DON_RADIO) void this.#event(t.donate.event(n, name));
		return { result: 'ok', goal };
	}

	// ----- Abscar's admin menu -----

	/** Give (+) or take (−) burgers for a member, out of nothing / into nothing. Only Abscar may. */
	async grant(id: string, delta: number, name: string): Promise<boolean> {
		if (this.me?.op !== HOUSE_OP || !Number.isInteger(delta) || delta === 0) return false;
		const outcome = await this.#squad.write((doc) => {
			const grants = { ...doc.grants };
			const n = (grants[id] ?? 0) + delta;
			if (n === 0) delete grants[id];
			else grants[id] = n;
			return { ...doc, grants };
		});
		this.#done(outcome);
		if (outcome === 'ok') await this.#event(delta > 0 ? t.admin.gaveEvent(name, delta) : t.admin.tookEvent(name, -delta));
		return outcome === 'ok';
	}

	// ----- Abscar's control room (casino-rig.ts) -----

	/** The casino settings in the squad document (empty = every game as built). */
	get tune(): CasinoTune {
		return this.doc?.tune ?? {};
	}

	/** Change the casino settings. Only Abscar may; nothing goes on the radio. */
	async setTune(change: (tune: CasinoTune) => CasinoTune): Promise<boolean> {
		if (this.me?.op !== HOUSE_OP) return false;
		const at = Math.round(this.serverNow());
		const outcome = await this.#squad.write((doc) => {
			const next = cleanTune({ ...change(doc.tune ?? {}), at });
			const { tune: _old, ...rest } = doc;
			return next ? { ...rest, tune: next } : rest;
		});
		this.#done(outcome);
		return outcome === 'ok';
	}

	/** Your luck in a game: its odds + your own luck (casino-rig.ts). */
	luck(game: RigGame): number {
		return luckFor(this.doc?.tune, game, this.me?.id);
	}

	/** The forced result your next play in a game would take (without taking it), or null. */
	peekForced<K extends ForceKind>(kind: K): NonNullable<CasinoTune[K]> | null {
		const me = this.me;
		return me ? (forcedFor<unknown>(this.doc?.tune?.[kind], me.id, this.#rigUsed) as NonNullable<CasinoTune[K]> | null) : null;
	}

	/** The forced result your next play takes, or null; a next-only one is taken at once (markForced). */
	takeForced<K extends ForceKind>(kind: K): NonNullable<CasinoTune[K]> | null {
		const f = this.peekForced(kind);
		if (f && !f.every) this.markForced(kind, f.id);
		return f;
	}

	/** A next-only setting was used: kept in this device's list (never twice here) and marked in the squad. */
	markForced(kind: ForceKind, id: string): void {
		const me = this.me;
		if (!me) return;
		this.#rigUsed = [...this.#rigUsed.filter((x) => x !== id), id].slice(-RIG_USED_MAX);
		writeJson(RIG_USED_KEY, this.#rigUsed);
		const at = this.serverNow();
		void this.#squad.write((doc) => {
			const next = doc.tune ? withUsed(doc.tune, kind, id, me.id, at) : null;
			return next ? { ...doc, tune: next } : null;
		});
	}

	// ----- pranks (shop.ts PRANKS) -----

	/** Throw a prank at another member (paid with burgers, goes on the radio). */
	prank(kind: string, to: string, name: string): BuyResult | 'off' {
		const me = this.me;
		const bank = this.myBank;
		if (!me || !bank || to === me.id) return 'off';
		const r = shopThrow(this.shop, kind, to, bank.balance, Math.round(this.serverNow()), makeMemberId().slice(0, 10));
		if (r.result !== 'ok') return r.result;
		this.shop = r.state;
		writeJson(SHOP_KEY, r.state);
		this.#schedulePublish();
		void this.#event(kind === 'smoke-bomb' ? t.pranks.smokeEvent(name) : t.pranks.highEvent(name));
		return 'ok';
	}

	/**
	 * One finished casino game on this device: added to your tally, published, and (for a big one) a
	 * line on the radio. Pretend burgers, never money.
	 */
	recordGame(net: number, event?: string): void {
		if (!this.me) return;
		this.casino = withGame(this.casino, this.#device, net, Math.round(this.serverNow()));
		writeJson(CASINO_KEY, this.casino);
		this.#schedulePublish();
		if (event) void this.#event(event);
	}

	/** Buy a BurgiShop item with your burgers (worn at once); epic and legendary ones go on the radio. */
	buyItem(id: string): BuyResult | 'off' {
		const me = this.me;
		const bank = this.myBank;
		if (!me || !bank) return 'off';
		const r = shopBuy(this.shop, id, bank.balance, Math.round(this.serverNow()));
		if (r.result !== 'ok') return r.result;
		this.shop = r.state;
		writeJson(SHOP_KEY, r.state);
		this.#schedulePublish();
		const it = ITEM_BY_ID.get(id);
		if (it && (it.rarity === 'epic' || it.rarity === 'legendary')) void this.#event(t.shop.event(it.name, t.shop.rarity[it.rarity]));
		return 'ok';
	}

	/** Wear an item you own in its slot, or take the slot off (null). */
	equipItem(slot: ShopSlot, id: string | null): boolean {
		const next = shopEquip(this.shop, slot, id, Math.round(this.serverNow()));
		if (!next) return false;
		this.shop = next;
		writeJson(SHOP_KEY, next);
		this.#schedulePublish();
		return true;
	}

	/** A casino moment on the radio (posted after the game showed it, so the radio doesn't spoil it). */
	casinoNews(text: string): void {
		if (this.me) void this.#event(text);
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
		return { weapons: progress.weapons, mastery: progress.mastery, prestige: progress.prestige, lastTickAt: progress.lastTickAt, stamps: progress.stamps };
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
		for (const g of gains.slice(-FEED_MAX)) feed.squadGain(g.name, g.weaponId, g.level, !g.prestige && g.level >= 3, g.prestige);
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
		// your other device's minutes: the bigger number per day (both pages count the same evening)
		const theirs = this.#squad.doc?.members[me.id]?.played;
		if (theirs) this.played = mergePlayed(this.played, theirs);
		// your K/D updates from your other device: per day, the later one wins
		const theirCombat = this.#squad.doc?.members[me.id]?.combat;
		if (theirCombat) {
			const merged = mergeCombat(this.combat, theirCombat);
			if (JSON.stringify(merged) !== JSON.stringify(this.combat)) {
				this.combat = merged;
				writeJson(COMBAT_KEY, merged);
			}
		}
		// your SR updates and shared classes from your other device (per day / per class, the later one wins)
		const mine = this.#squad.doc?.members[me.id];
		if (mine?.ranked) {
			const merged = mergeRanked(this.ranked, mine.ranked);
			if (JSON.stringify(merged) !== JSON.stringify(this.ranked)) {
				this.ranked = merged;
				writeJson(RANKED_KEY, merged);
			}
		}
		if (mine?.classes) {
			const merged = mergeClasses(this.classes, mine.classes);
			if (JSON.stringify(merged) !== JSON.stringify(this.classes)) {
				this.classes = merged;
				writeJson(CLASSES_KEY, merged);
			}
		}
		// days online and the casino tally from your other device (most days / per device the later tally)
		if (mine?.online) {
			const merged = mergeOnline(this.online, mine.online);
			if (merged !== this.online) {
				this.online = merged;
				writeJson(ONLINE_KEY, merged);
			}
		}
		if (mine?.casino) {
			const merged = mergeCasino(this.casino, mine.casino);
			if (JSON.stringify(merged) !== JSON.stringify(this.casino)) {
				this.casino = merged;
				writeJson(CASINO_KEY, merged);
			}
		}
		if (mine?.shop) {
			const merged = mergeShop(this.shop, mine.shop);
			if (JSON.stringify(merged) !== JSON.stringify(this.shop)) {
				this.shop = merged;
				writeJson(SHOP_KEY, merged ?? null);
			}
		}
		if (mine?.loans) {
			const merged = mergeLoans(this.loans, mine.loans, this.serverNow());
			if (JSON.stringify(merged) !== JSON.stringify(this.loans)) {
				this.loans = merged;
				writeJson(LOANS_KEY, merged ?? null);
			}
		}
		if (mine?.donations) {
			const merged = mergeDonations(this.donations, mine.donations);
			if (JSON.stringify(merged) !== JSON.stringify(this.donations)) {
				this.donations = merged;
				writeJson(DONATIONS_KEY, merged ?? null);
			}
		}
		if (!away) this.#countToday();
		const entry = memberEntry(me, this.#progressNow(), this.serverNow(), away, {
			readyAt: this.readyAt,
			ping: this.#ping,
			played: this.played,
			combat: this.combat,
			ranked: this.ranked,
			classes: this.classes,
			online: this.online,
			casino: this.casino,
			shop: this.shop,
			loans: this.loans,
			donations: this.donations
		});
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

	#quarters(): Map<string, number> {
		const out = new Map<string, number>();
		for (const c of MASTERY_TRACKS.flatMap((tr) => tr.camos)) out.set(c.id, Math.floor((Math.min(progress.mastery[c.id] ?? 0, c.target) / c.target) * 4));
		return out;
	}

	/** A Mastery camo finished since the last save goes on the radio, and so does a new quarter mark. */
	#masteryNews(): void {
		const now = this.#completeMastery();
		const fresh = [...now].filter((id) => !this.#masteryDone.has(id));
		this.#masteryDone = now;
		const quarters = this.#quarters();
		const marks = MASTERY_TRACKS.flatMap((tr) => tr.camos).filter((c) => {
			const q = quarters.get(c.id) ?? 0;
			return q > (this.#masteryQuarters.get(c.id) ?? 0) && q > 0 && q < 4;
		});
		this.#masteryQuarters = quarters;
		if (!this.on) return;
		for (const c of marks) {
			const n = Math.min(progress.mastery[c.id] ?? 0, c.target);
			void this.#event(t.squad.radio.masteryMark(c.name, (quarters.get(c.id) ?? 0) * 25, n, c.target));
		}
		for (const id of fresh) {
			const camo = MASTERY_TRACKS.flatMap((tr) => tr.camos).find((c) => c.id === id);
			if (camo) void this.#event(t.squad.radio.masteryEvent(camo.name));
		}
	}
}

export const squad = new Squad();
