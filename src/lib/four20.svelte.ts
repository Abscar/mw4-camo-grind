/**
 * The 4:20 clock for the page (four20.ts has the rule): ticks every 20 s in the browser, so the banner,
 * the green page and the news buddy's holk come and go by themselves at 16:20 and 17:20.
 * `?f420=1` in the address forces it on (to look at it any time of day).
 */
import { is420, minutesLeft420 } from './four20.ts';

class Four20 {
	now = $state(Date.now());
	#forced = false;
	#started = false;

	get active(): boolean {
		return this.#forced || is420(new Date(this.now));
	}

	get minutesLeft(): number {
		return this.#forced && !is420(new Date(this.now)) ? 60 : minutesLeft420(new Date(this.now));
	}

	start(): () => void {
		if (this.#started || typeof window === 'undefined') return () => {};
		this.#started = true;
		this.#forced = new URLSearchParams(location.search).get('f420') === '1';
		const id = setInterval(() => (this.now = Date.now()), 20_000);
		return () => {
			clearInterval(id);
			this.#started = false;
		};
	}
}

export const four20 = new Four20();
