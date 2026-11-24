/**
 * The page side of Case Battles against each other (cb-lobby.ts): the squad's lobby document on the sync
 * service (squad code + "-cb"), read every few seconds while Case Battles is open (more often in the battle
 * view), your actions (open, join, leave, fill with bots), and booking your result once a battle you sit in
 * has started (on the device you joined from; remembered under `mw4-camo-grind:cb-booked`, then marked `ok` in
 * the lobby). Nothing runs while Case Battles isn't on screen; a battle you missed is booked when you come back.
 */
import { squad, Channel } from './squad.svelte.ts';
import { makeMemberId } from './squad-codec.ts';
import { t } from './i18n/en.ts';
import {
	ackLobby,
	createLobby,
	emptyLobbies,
	fillBots,
	fromLobbyWire,
	joinLobby,
	leaveLobby,
	lobbyCode,
	lobbyEnd,
	resultFor,
	toLobbyWire,
	type Lobby,
	type LobbyDoc,
	type LobbySeat
} from './cb-lobby.ts';
import type { BattleMode, BattleSize } from './cases.ts';

const BOOKED_KEY = 'mw4-camo-grind:cb-booked';
export interface Booked {
	id: string;
	end: number;
	payout: number;
	net: number;
}
const readBooked = (): Booked[] => {
	try {
		const raw = JSON.parse(localStorage.getItem(BOOKED_KEY) ?? '[]');
		return Array.isArray(raw) ? raw.filter((b) => b && typeof b.id === 'string' && Number.isFinite(b.end)).slice(-40) : [];
	} catch {
		return [];
	}
};

class CaseLobbies {
	#ch = new Channel<LobbyDoc>(fromLobbyWire, toLobbyWire, emptyLobbies, () => this.#settle());
	#code: string | null = null;
	#timer: ReturnType<typeof setInterval> | undefined;
	#rate = 0;
	#acking = new Set<string>();
	booked = $state<Booked[]>([]);
	/** A clock on the service's time, ticking while someone watches. */
	now = $state(Date.now());

	readonly lobbies = $derived(this.#ch.doc?.lobbies ?? []);
	/** True once the lobbies have been read at least once. */
	readonly ready = $derived(this.#ch.doc !== null);

	time(): number {
		return Date.now() + (this.#ch.offset ?? squad.serverNow() - Date.now());
	}

	#follow(): boolean {
		const code = squad.on && squad.code ? lobbyCode(squad.code) : null;
		if (code !== this.#code) {
			this.#code = code;
			this.#ch.use(code);
		}
		return code !== null;
	}

	/** Read the lobbies every `ms` (0 = stop). The Case Battles page calls this while it's on screen. */
	watch(ms: number): () => void {
		this.booked = readBooked();
		this.#rate = ms;
		clearInterval(this.#timer);
		if (!ms) return () => {};
		const step = () => {
			this.now = this.time();
			if (!this.#follow() || document.visibilityState === 'hidden') return;
			void this.#ch.pull();
		};
		step();
		this.#timer = setInterval(step, ms);
		const tick = setInterval(() => (this.now = this.time()), 200);
		return () => {
			clearInterval(this.#timer);
			clearInterval(tick);
			this.#timer = undefined;
		};
	}

	get me(): LobbySeat | null {
		const m = squad.me;
		return m ? { id: m.id, name: m.name, ...(m.op ? { op: m.op } : {}), dev: squad.device } : null;
	}

	async create(cases: string[], size: BattleSize, mode: BattleMode, cost: number): Promise<string | null> {
		const me = this.me;
		if (!me || !this.#follow()) return null;
		const id = makeMemberId();
		const seed = crypto.getRandomValues(new Uint32Array(1))[0];
		const out = await this.#ch.write((d) => createLobby(d, { id, me, cases, size, mode, seed, now: this.time() }));
		if (out !== 'ok') return null;
		squad.casinoNews(t.casino.cases.lobbyEvent(t.casino.cases.sizes[size], t.casino.cases.modes[mode], cases.length, cost.toLocaleString('en-US')));
		return id;
	}
	async join(id: string, seat: number): Promise<boolean> {
		const me = this.me;
		if (!me || !this.#follow()) return false;
		return (await this.#ch.write((d) => joinLobby(d, id, seat, me, this.time()))) === 'ok';
	}
	async leave(id: string): Promise<boolean> {
		const me = this.me;
		if (!me) return false;
		return (await this.#ch.write((d) => leaveLobby(d, id, me.id))) === 'ok';
	}
	async fill(id: string): Promise<boolean> {
		const me = this.me;
		if (!me) return false;
		return (await this.#ch.write((d) => fillBots(d, id, me.id, this.time()))) === 'ok';
	}

	/** Book every started battle you sit in from this device (once), then mark it in the lobby. */
	#settle(): void {
		const me = this.me;
		if (!me) return;
		const now = this.time();
		let changed = false;
		for (const l of this.lobbies) {
			const s = l.seats.find((x) => x?.id === me.id);
			if (!l.start || l.start > now || !s || s.dev !== me.dev) continue;
			if (!this.booked.some((b) => b.id === l.id)) {
				const r = resultFor(l, me.id);
				if (!r) continue;
				squad.recordGame(r.net);
				this.booked = [...this.booked, { id: l.id, end: lobbyEnd(l), payout: r.payout, net: r.net }].slice(-40);
				changed = true;
			}
			if (!l.ok?.[me.id] && !this.#acking.has(l.id)) {
				this.#acking.add(l.id);
				void this.#ch.write((d) => ackLobby(d, l.id, me.id)).finally(() => this.#acking.delete(l.id));
			}
		}
		if (changed)
			try {
				localStorage.setItem(BOOKED_KEY, JSON.stringify(this.booked));
			} catch {
				// remembered for this visit
			}
	}

	/** Called by the page's clock: a battle may have started since the last read. */
	settle(): void {
		if (this.#rate) this.#settle();
	}

	lobby(id: string | null): Lobby | null {
		return id ? (this.lobbies.find((l) => l.id === id) ?? null) : null;
	}
}

export const caseLobbies = new CaseLobbies();
