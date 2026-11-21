/*
	Auto spin, one copy for every slot machine (2026-11-21, the user: "höj autospinsen … på alla slotsen", then
	"ba lägg till 1000"). Each machine makes its own `new AutoSpin()` while it's set up (the constructor registers
	an effect) and shows it with AutoSpinControls.svelte.

	A run stops when you tap Stop, when the burgers run out, when the page is hidden or when the machine goes away
	(another game picked). A big win gets its moment before the next spin (the machine's `wait`). The count you
	picked is remembered per device under `mw4-camo-grind:autospin` (one setting for every machine).
*/
import { cleanCount, AUTO_DEFAULT } from '#lib/autoSpin.ts';
import { t } from '#lib/i18n/en.ts';
import { toast } from '#lib/toast.svelte.ts';

const KEY = 'mw4-camo-grind:autospin';

export interface AutoRun {
	/** one paid spin at the current bet (resolves when it has been shown) */
	spin: () => Promise<void>;
	/** whether the next spin can be paid for */
	ready: () => boolean;
	/** ms to wait before the next spin (longer while a big win is celebrated) */
	wait: () => number;
	/** tidy up between two spins (e.g. Book Of Skedd's gamble offer) */
	between?: () => void;
}
/** How a run ended: all spins done, Stop tapped, out of burgers, or the machine went away. */
export type AutoEnd = 'done' | 'stopped' | 'broke' | 'gone';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class AutoSpin {
	/** Spins left in the run going on (0 = off). */
	left = $state(0);
	/** How many spins a run has (remembered per device). */
	count = $state(AUTO_DEFAULT);
	#alive = true;
	#run = 0;

	constructor() {
		$effect(() => {
			// read after the first render, so the prerendered page and the page in the browser agree
			try {
				this.count = cleanCount(localStorage.getItem(KEY));
			} catch {
				// storage blocked: the default
			}
			const hide = () => document.visibilityState === 'hidden' && this.stop();
			document.addEventListener('visibilitychange', hide);
			return () => {
				this.#alive = false;
				this.left = 0;
				document.removeEventListener('visibilitychange', hide);
			};
		});
	}

	/** A run is going on: bonus screens close by themselves, picks are made for you. */
	get running() {
		return this.left > 0;
	}

	setCount(n: number) {
		this.count = cleanCount(n);
		try {
			localStorage.setItem(KEY, String(this.count));
		} catch {
			// this visit only
		}
	}

	/** Stop the run (after the spin going on); `text` = a toast saying why. */
	stop(text?: string) {
		if (this.left > 0 && text) toast.show(text, undefined, 4000);
		this.left = 0;
	}

	/** Start a run of `count` spins, or stop the one going on. */
	async run(o: AutoRun): Promise<AutoEnd> {
		if (this.left > 0) {
			this.stop();
			return 'stopped';
		}
		const id = ++this.#run;
		this.left = this.count;
		let end: AutoEnd = 'done';
		for (;;) {
			if (!this.#alive || id !== this.#run) return 'gone';
			if (this.left === 0) {
				end = 'stopped';
				break;
			}
			if (!o.ready()) {
				this.stop(t.casino.broke);
				end = 'broke';
				break;
			}
			await o.spin();
			if (!this.#alive || id !== this.#run) return 'gone';
			if (this.left === 0) {
				end = 'stopped';
				break;
			}
			this.left -= 1;
			if (this.left === 0) break;
			o.between?.();
			await sleep(o.wait());
		}
		this.left = 0;
		return end;
	}
}
