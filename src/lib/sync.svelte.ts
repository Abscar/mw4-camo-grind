/**
 * Automatic sync between the user's devices, through the small sync service in sync-worker/.
 * No account: turning sync on makes a long random code; the "sync link" (<site>#sync=<code>)
 * opened once on another device joins it. After that, every change is sent a moment later, and
 * changes from the other devices are fetched when the page opens, when you come back to the
 * tab, when the connection returns and every minute while it's visible. When both devices
 * changed things, they are merged (sync-codec.ts) instead of one overwriting the other.
 *
 * The sync state lives under its own storage key, so saved progress didn't change shape.
 */

import { goto } from '$app/navigation';
import { OFFLINE_FILE } from './browser.ts';
import { progress } from './progress.svelte.ts';
import { SITE_URL, SYNC_URL } from './site.ts';
import {
	combine,
	fromWire,
	makeSyncCode,
	merge3,
	sameDoc,
	syncCodeFromHash,
	toWire,
	type SyncDoc
} from './sync-codec.ts';

const KEY = 'mw4-camo-grind:sync';
const ENDPOINT = (((import.meta.env.VITE_SYNC_URL as string | undefined) || SYNC_URL) ?? '').replace(/\/+$/, '');
/** Wait this long after a change before sending it (several quick ticks go as one). */
const PUSH_DELAY = 1200;
/** Look for changes from the other devices this often while the page is visible. */
const PULL_EVERY = 60_000;

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'offline' | 'error';

interface Remote {
	rev: number;
	doc: SyncDoc;
}

type Fetched = Remote | 'not-found' | 'offline' | 'error';

interface Saved {
	code: string;
	rev: number;
	base: unknown;
	syncedAt: string | null;
}

function readSaved(): Saved | null {
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
		return raw && typeof raw.code === 'string' && Number.isInteger(raw.rev) ? raw : null;
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

async function readRemote(response: Response): Promise<Remote | null> {
	try {
		const body = await response.json();
		const doc = fromWire(body?.data);
		return doc && Number.isInteger(body.rev) ? { rev: body.rev, doc } : null;
	} catch {
		return null;
	}
}

/** Fetch what the sync service has for a code (also used to look at a link before joining it). */
export async function fetchRemote(code: string): Promise<Fetched> {
	const response = await request(code);
	if (response === 'offline') return 'offline';
	if (response.status === 404) return 'not-found';
	if (!response.ok) return 'error';
	return (await readRemote(response)) ?? 'error';
}

class Sync {
	/** False until the sync service is online (SYNC_URL); the app then shows nothing about sync. */
	readonly available = ENDPOINT !== '';
	code = $state<string | null>(null);
	status = $state<SyncStatus>('off');
	/** When this device last agreed with the sync service (ISO). */
	syncedAt = $state<string | null>(null);
	/** A sync code from the address bar, waiting for SyncPanel to ask about it. */
	offer = $state<string | null>(null);

	#rev = 0;
	#base: SyncDoc | null = null;
	#busy = false;
	#again: 'push' | 'pull' | null = null;
	#pushTimer: ReturnType<typeof setTimeout> | undefined;
	#started = false;

	get on(): boolean {
		return this.code !== null;
	}

	/** Call once in the browser, after progress.load(). Returns a function that stops it. */
	start(): () => void {
		if (!this.available || this.#started) return () => {};
		this.#started = true;
		const saved = readSaved();
		if (saved) {
			this.code = saved.code;
			this.#rev = saved.rev;
			this.#base = saved.base ? fromWire(saved.base) : null;
			this.syncedAt = saved.syncedAt;
			this.status = 'syncing';
		}
		this.#checkAddress();

		const stopSaved = progress.onSaved(() => this.#schedulePush());
		const onVisible = () => {
			if (document.visibilityState === 'visible') void this.#run('pull');
			else this.#flush();
		};
		const onOnline = () => void this.#run('pull');
		const onHash = () => this.#checkAddress();
		const onHide = () => this.#flush();
		document.addEventListener('visibilitychange', onVisible);
		window.addEventListener('online', onOnline);
		window.addEventListener('hashchange', onHash);
		window.addEventListener('pagehide', onHide);
		const timer = setInterval(() => {
			if (document.visibilityState === 'visible') void this.#run('pull');
		}, PULL_EVERY);
		if (this.on) void this.#run('pull');

		return () => {
			stopSaved();
			document.removeEventListener('visibilitychange', onVisible);
			window.removeEventListener('online', onOnline);
			window.removeEventListener('hashchange', onHash);
			window.removeEventListener('pagehide', onHide);
			clearInterval(timer);
		};
	}

	/** Turn sync on with a new code; this device's ticks become the synced ones. */
	async turnOn(): Promise<boolean> {
		this.#use(makeSyncCode(), 0, null);
		await this.#run('push');
		return this.status === 'synced';
	}

	/**
	 * Join a sync link. `how`: 'use' takes the synced ticks as they are; 'combine' keeps the
	 * higher tick of each weapon from both. Returns what this device had, for Undo.
	 */
	async join(code: string, remote: Remote, how: 'use' | 'combine'): Promise<SyncDoc> {
		const before = progress.syncDoc();
		this.#use(code, remote.rev, remote.doc);
		const next = how === 'combine' ? combine(before, remote.doc) : remote.doc;
		progress.applySynced(next); // its save schedules a push if anything differs from the synced copy
		this.syncedAt = new Date().toISOString();
		this.#persist();
		await this.#run('push');
		return before;
	}

	/** Stop syncing on this device. The ticks here stay; the other devices keep syncing. */
	turnOff(): void {
		clearTimeout(this.#pushTimer);
		this.code = null;
		this.#rev = 0;
		this.#base = null;
		this.syncedAt = null;
		this.status = 'off';
		try {
			localStorage.removeItem(KEY);
		} catch {
			// nothing saved
		}
	}

	/** The link to open on another device, or null when sync is off. */
	link(): string | null {
		if (!this.code) return null;
		const base = OFFLINE_FILE ? SITE_URL : location.origin + location.pathname;
		return `${base.split('#')[0]}#sync=${this.code}`;
	}

	syncNow(): Promise<void> {
		return this.#run('pull');
	}

	#use(code: string, rev: number, base: SyncDoc | null): void {
		clearTimeout(this.#pushTimer);
		this.code = code;
		this.#rev = rev;
		this.#base = base;
		this.status = 'syncing';
		this.#persist();
	}

	#persist(): void {
		if (!this.code) return;
		const saved: Saved = {
			code: this.code,
			rev: this.#rev,
			base: this.#base ? toWire(this.#base) : null,
			syncedAt: this.syncedAt
		};
		try {
			localStorage.setItem(KEY, JSON.stringify(saved));
		} catch {
			// storage full or blocked: sync still works for this visit
		}
	}

	/** A sync link was opened on this page (website only: the offline file routes by hash). */
	#checkAddress(): void {
		if (OFFLINE_FILE) return;
		const code = syncCodeFromHash(location.hash);
		if (!code) return;
		// take the code out of the address bar (a reload shouldn't ask again), the Kit way
		goto(location.pathname + location.search, { replace: true, shallow: true }).catch(() => {});
		this.offer = code;
	}

	#schedulePush(): void {
		if (!this.on) return;
		// not "Synced" while a change is waiting to be sent: the status only says Synced once the
		// sync service has confirmed it (#ok)
		this.status = 'syncing';
		clearTimeout(this.#pushTimer);
		this.#pushTimer = setTimeout(() => void this.#run('push'), PUSH_DELAY);
	}

	/** The page is being hidden or closed: send a waiting change now instead of in a moment. */
	#flush(): void {
		if (!this.on || this.#pushTimer === undefined) return;
		clearTimeout(this.#pushTimer);
		this.#pushTimer = undefined;
		void this.#run('push');
	}

	/**
	 * One sync round. 'pull' first asks the service for news; 'push' only sends local changes.
	 * Changes from both sides are merged; a refused write (someone else wrote first) is merged
	 * and retried. Only one round runs at a time; a request during a round runs right after it.
	 */
	async #run(mode: 'push' | 'pull'): Promise<void> {
		if (!this.code) return;
		if (this.#busy) {
			if (this.#again !== 'pull') this.#again = mode;
			return;
		}
		this.#busy = true;
		clearTimeout(this.#pushTimer); // this round sends the latest state anyway
		this.#pushTimer = undefined;
		const code = this.code;
		try {
			let remote: Fetched | null = null;
			if (mode === 'pull') {
				remote = await fetchRemote(code);
				if (remote === 'offline' || remote === 'error') return this.#fail(remote);
			}
			for (let attempt = 0; attempt < 4 && this.code === code; attempt++) {
				if (remote === 'not-found') {
					// the service has nothing (yet) for this code: start it again from this device
					this.#rev = 0;
					this.#base = null;
				} else if (remote && remote.rev !== this.#rev) {
					const local = progress.syncDoc();
					const merged = this.#base ? merge3(this.#base, local, remote.doc) : combine(local, remote.doc);
					this.#base = remote.doc;
					this.#rev = remote.rev;
					if (!sameDoc(merged, local)) progress.applySynced(merged);
				}

				const local = progress.syncDoc();
				if (this.#base && sameDoc(local, this.#base)) return this.#ok();

				const response = await request(code, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ baseRev: this.#rev, data: toWire(local) }),
					keepalive: true
				});
				if (response === 'offline') return this.#fail('offline');
				if (response.ok) {
					const body = await response.json().catch(() => null);
					if (!Number.isInteger(body?.rev)) return this.#fail('error');
					this.#rev = body.rev;
					this.#base = local;
					return this.#ok();
				}
				if (response.status === 409) remote = (await readRemote(response)) ?? 'not-found';
				else if (response.status === 404) remote = 'not-found';
				else return this.#fail('error');
			}
			this.#fail('error');
		} finally {
			this.#busy = false;
			const again = this.#again;
			this.#again = null;
			if (again && this.code) void this.#run(again);
		}
	}

	#ok(): void {
		this.status = 'synced';
		this.syncedAt = new Date().toISOString();
		this.#persist();
	}

	#fail(why: 'offline' | 'error'): void {
		this.status = why === 'offline' || (typeof navigator !== 'undefined' && !navigator.onLine) ? 'offline' : 'error';
		this.#persist();
	}
}

export const sync = new Sync();
