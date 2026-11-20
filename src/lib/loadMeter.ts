/**
 * The net_graph's "cpu" number (NetGraph.svelte): how busy the page keeps the browser's main thread. A web page
 * can't read the real CPU %, so this counts the idle time the browser hands out (requestIdleCallback says how
 * long each idle stretch lasts) and calls the rest busy. Pure, so it's tested (scripts/load-meter.test.js).
 */

export class IdleMeter {
	/** idle ms counted since the last take() */
	#idle = 0;
	/** end of the latest idle stretch already counted (callbacks inside one stretch must not count it twice) */
	#until = 0;
	#since: number;

	constructor(now: number) {
		this.#since = now;
	}

	/** An idle callback ran at `now` with `remaining` ms of idle time left. */
	idle(now: number, remaining: number): void {
		const end = now + Math.max(0, remaining);
		const from = Math.max(now, this.#until);
		if (end > from) this.#idle += end - from;
		if (end > this.#until) this.#until = end;
	}

	/** Busy share of the time since the last take(), 0–100 (rounded), and start a new window. */
	take(now: number): number {
		const elapsed = now - this.#since;
		// idle counted ahead of `now` (a stretch that hasn't ended yet) belongs to the next window
		const ahead = Math.max(0, this.#until - now);
		const idle = Math.min(elapsed, Math.max(0, this.#idle - ahead));
		this.#idle = ahead;
		this.#since = now;
		return elapsed > 0 ? Math.round(Math.max(0, Math.min(100, 100 - (idle / elapsed) * 100))) : 0;
	}
}

/** The bar colour band for a busy share, like the game's net_graph (green / yellow / red). */
export function loadBand(busy: number): 'ok' | 'warn' | 'bad' {
	return busy < 35 ? 'ok' : busy < 70 ? 'warn' : 'bad';
}
