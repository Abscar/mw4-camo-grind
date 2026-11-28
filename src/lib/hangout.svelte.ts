/**
 * The page side of the casino lobby + hideouts (hangout.ts): the squad's hangout document on the sync service
 * (squad code + "-hang"). While the casino is on screen it's read every READ_MS and you say hello every HELLO_MS
 * with where you are (the game you play, or the hideout you're in); a big win (squad.recordGame sends
 * `mw4:casino-win`) puts a "pling" over your head for the others. Collab spins and hideout duels are booked by
 * the player's own device once their result has shown (remembered under `mw4-camo-grind:hang-booked`).
 * Nothing runs while the casino isn't on screen.
 */
import { squad, Channel } from './squad.svelte.ts';
import { makeMemberId } from './squad-codec.ts';
import { toast } from './toast.svelte.ts';
import { t } from './i18n/en.ts';
import { saverOn } from './motion.svelte.ts';
import {
	ackCollab,
	ackDuel,
	acceptDuel,
	cancelDuel,
	collabPhase,
	collabPlay,
	collabResult,
	collabReveal,
	duelNet,
	duelPhase,
	emptyHang,
	fromHangWire,
	hangCode,
	hello,
	joinCollab,
	openCollab,
	openDuel,
	present,
	toHangWire,
	voteDuel,
	withPing,
	withSay,
	withWave,
	DUEL_SHOW,
	HELLO_MS,
	type Collab,
	type Duel,
	type DuelKind,
	type HangDoc,
	type Say,
	type Seat
} from './hangout.ts';

const READ_MS = 3500;
/** A casino win this big pings over your head in the lobby. */
export const PING_MIN = 1000;
const BOOKED_KEY = 'mw4-camo-grind:hang-booked';

function readBooked(): string[] {
	try {
		const raw = JSON.parse(localStorage.getItem(BOOKED_KEY) ?? '[]');
		return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string').slice(-80) : [];
	} catch {
		return [];
	}
}

class Hangout {
	#ch = new Channel<HangDoc>(fromHangWire, toHangWire, emptyHang, () => this.#settle());
	#code: string | null = null;
	#users = 0;
	#timer: ReturnType<typeof setInterval> | undefined;
	#clock: ReturnType<typeof setInterval> | undefined;
	#lastHello = 0;
	#sentWhere = '';
	#acking = new Set<string>();
	#booked: string[] = [];
	#seenWaves = new Set<string>();
	/** Where you are: a casino game id, or `ho:<member id>`; '' = not in the casino. */
	where = $state('');
	now = $state(Date.now());
	readonly doc = $derived(this.#ch.doc);
	readonly people = $derived(present(this.#ch.doc, this.now));
	readonly collabs = $derived(this.#ch.doc?.collabs ?? []);
	readonly duels = $derived(this.#ch.doc?.duels ?? []);

	constructor() {
		if (typeof window !== 'undefined')
			window.addEventListener('mw4:casino-win', (e) => {
				const net = (e as CustomEvent<{ net: number }>).detail?.net ?? 0;
				if (net >= PING_MIN) void this.ping(net);
			});
	}

	time(): number {
		return Date.now() + (this.#ch.offset ?? squad.serverNow() - Date.now());
	}
	#follow(): boolean {
		const code = squad.on && squad.code ? hangCode(squad.code) : null;
		if (code !== this.#code) {
			this.#code = code;
			this.#ch.use(code);
			this.#sentWhere = '';
		}
		return code !== null;
	}

	get me(): Seat | null {
		const m = squad.me;
		return m ? { id: m.id, name: m.name, ...(m.op ? { op: m.op } : {}), dev: squad.device } : null;
	}

	/** The casino (or a hideout) is on screen: read + say hello until the returned function is called. */
	watch(): () => void {
		this.#users++;
		this.#booked = readBooked();
		if (this.#users === 1) {
			const step = () => {
				this.now = this.time();
				if (!this.#follow() || document.visibilityState === 'hidden') return;
				void this.#ch.pull().then(() => this.#hello());
			};
			step();
			this.#timer = setInterval(step, saverOn() ? READ_MS * 3 : READ_MS);
			this.#clock = setInterval(() => {
				this.now = this.time();
				this.#settle();
			}, 500);
		}
		return () => {
			this.#users--;
			if (this.#users > 0) return;
			clearInterval(this.#timer);
			clearInterval(this.#clock);
			this.#timer = undefined;
			// say you left (one write; nothing waits for it)
			const me = this.me;
			if (me && this.#follow() && this.#ch.doc?.here[me.id]) void this.#ch.write((d) => hello(d, me.id, me, '', this.time()));
			this.#sentWhere = '';
		};
	}

	/** Where you are now (the casino page calls this when the game changes / a hideout opens). */
	at(where: string): void {
		this.where = where;
		void this.#hello();
	}

	async #hello(): Promise<void> {
		const me = this.me;
		if (!me || !this.#users || !this.#follow() || !this.where) return;
		const now = this.time();
		if (this.where === this.#sentWhere && now - this.#lastHello < HELLO_MS) return;
		this.#lastHello = now;
		this.#sentWhere = this.where;
		await this.#ch.write((d) => hello(d, me.id, me, this.where, now));
	}

	async ping(net: number): Promise<void> {
		const me = this.me;
		if (!me || !this.#users || !this.#follow()) return;
		const g = this.where.startsWith('ho:') ? 'hideout' : this.where || 'lobby';
		await this.#ch.write((d) => withPing(d.here[me.id] ? d : hello(d, me.id, me, this.where || 'lobby', this.time()), me.id, net, g, this.time()));
	}
	async wave(to: string): Promise<boolean> {
		const me = this.me;
		if (!me || !this.#follow()) return false;
		return (await this.#ch.write((d) => withWave(d, me.id, to, this.time()))) === 'ok';
	}
	async say(k: Say): Promise<boolean> {
		const me = this.me;
		if (!me || !this.#follow()) return false;
		return (await this.#ch.write((d) => withSay(d, me.id, k, this.time()))) === 'ok';
	}

	// ----- collab spins -----
	async openCollab(stake: number): Promise<boolean> {
		const me = this.me;
		if (!me || !this.#follow() || (squad.myBank?.balance ?? 0) < stake) return false;
		const seed = crypto.getRandomValues(new Uint32Array(1))[0];
		const ok = (await this.#ch.write((d) => openCollab(d, { id: makeMemberId(), seat: me, stake, seed, now: this.time() }))) === 'ok';
		if (ok) squad.casinoNews(t.hang.collab.event(stake.toLocaleString('en-US')));
		return ok;
	}
	async joinCollab(id: string, stake: number): Promise<boolean> {
		const me = this.me;
		if (!me || !this.#follow() || (squad.myBank?.balance ?? 0) < stake) return false;
		return (await this.#ch.write((d) => joinCollab(d, id, me, stake, this.time()))) === 'ok';
	}
	/** Your stakes in collabs that haven't been booked yet (held back from what you can spend). */
	get held(): number {
		const me = this.me;
		if (!me) return 0;
		let n = 0;
		for (const c of this.collabs) {
			const s = c.seats.find((x) => x.id === me.id);
			if (s && s.dev === me.dev && !this.#booked.includes(`c:${c.id}`)) n += s.stake;
		}
		return n;
	}

	// ----- duels in a hideout -----
	async openDuel(ho: string, kind: DuelKind, stake: number, text?: string): Promise<'ok' | 'broke' | 'refused'> {
		const me = this.me;
		if (!me || !this.#follow()) return 'refused';
		if ((squad.myBank?.balance ?? 0) < stake) return 'broke';
		const seed = crypto.getRandomValues(new Uint32Array(1))[0];
		return (await this.#ch.write((d) => openDuel(d, { id: makeMemberId(), ho, kind, stake, seat: me, seed, now: this.time(), text }))) === 'ok' ? 'ok' : 'refused';
	}
	async acceptDuel(id: string): Promise<'ok' | 'broke' | 'refused'> {
		const me = this.me;
		const d = this.duels.find((x) => x.id === id);
		if (!me || !d || !this.#follow()) return 'refused';
		if ((squad.myBank?.balance ?? 0) < d.stake) return 'broke';
		return (await this.#ch.write((x) => acceptDuel(x, id, me, this.time()))) === 'ok' ? 'ok' : 'refused';
	}
	async cancelDuel(id: string): Promise<boolean> {
		const me = this.me;
		return !!me && (await this.#ch.write((d) => cancelDuel(d, id, me.id))) === 'ok';
	}
	async vote(id: string, winner: string): Promise<boolean> {
		const me = this.me;
		return !!me && (await this.#ch.write((d) => voteDuel(d, id, me.id, winner))) === 'ok';
	}

	#remember(key: string): void {
		this.#booked = [...this.#booked, key].slice(-80);
		try {
			localStorage.setItem(BOOKED_KEY, JSON.stringify(this.#booked));
		} catch {
			// remembered for this visit
		}
	}

	/** Book what has shown: your collab shares and your duels (once, on the device you joined from). */
	#settle(): void {
		const me = this.me;
		const doc = this.#ch.doc;
		if (!me || !doc) return;
		const now = this.time();
		for (const c of doc.collabs) {
			const s = c.seats.find((x) => x.id === me.id);
			if (!s || s.dev !== me.dev || collabPhase(c, now) !== 'done') continue;
			if (!this.#booked.includes(`c:${c.id}`)) {
				const r = collabResult(c, me.id);
				if (!r) continue;
				this.#remember(`c:${c.id}`);
				squad.recordGame(r.net);
				if (r.share > 0) void this.ping(r.share);
			}
			this.#ack(`c:${c.id}`, c.ok?.[me.id], (d) => ackCollab(d, c.id, me.id));
		}
		for (const d of doc.duels) {
			const mine = d.by.id === me.id ? d.by : d.acc?.id === me.id ? d.acc : null;
			if (!mine || mine.dev !== me.dev || duelPhase(d, now) !== 'done') continue;
			if (!this.#booked.includes(`d:${d.id}`)) {
				const net = duelNet(d, me.id);
				if (net === null) continue;
				this.#remember(`d:${d.id}`);
				squad.recordPvp(net);
			}
			this.#ack(`d:${d.id}`, d.ok?.[me.id], (x) => ackDuel(x, d.id, me.id));
		}
		// a wave to you: a toast once
		for (const [id, h] of Object.entries(doc.here)) {
			if (h.wave?.to !== me.id || now - h.wave.at > 20_000) continue;
			const key = `${id}:${h.wave.at}`;
			if (this.#seenWaves.has(key)) continue;
			this.#seenWaves.add(key);
			toast.show(t.hang.wavedAtYou(h.name));
		}
	}
	#ack(key: string, done: 1 | undefined, change: (d: HangDoc) => HangDoc | null): void {
		if (done || this.#acking.has(key)) return;
		this.#acking.add(key);
		void this.#ch.write(change).finally(() => this.#acking.delete(key));
	}

	collab(id: string | null): Collab | null {
		return id ? (this.collabs.find((c) => c.id === id) ?? null) : null;
	}
	/** A collab spin you're in that is spinning or showing right now (for the big overlay). */
	liveCollab(): Collab | null {
		const me = this.me;
		const now = this.now;
		return this.collabs.find((c) => c.seats.some((s) => s.id === me?.id) && now >= c.until && now < collabReveal(c) + 6000) ?? null;
	}
	/** Duels in a hideout, newest first. */
	duelsIn(ho: string): Duel[] {
		return this.duels.filter((d) => d.ho === ho).sort((a, b) => b.at - a.at);
	}
	revealAt = (d: Duel) => (d.acc ? d.acc.at + DUEL_SHOW : Infinity);
	playOf = collabPlay;
}

export const hangout = new Hangout();
