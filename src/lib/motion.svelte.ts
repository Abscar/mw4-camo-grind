/**
 * Battery saver (2026-11-20, the user's ask: "battery save mode, cpu save mode?" after a friend's phone
 * battery ran out fast). It grew out of the "Pause animations" button (2026-11-11) and sits in its place in
 * the header's settings row (ThemePicker). Per device under its own key, like the sound setting: not part
 * of the saved progress, backups or sync. The old pause button's saved "1" counts as on.
 *
 * On = `data-still` + `data-saver` on <html>:
 *  - app.html's inline script stops moving the endless animations (a still picture of the page, nothing
 *    hidden; one-off feedback like a tick's pop still plays). It reads the saved setting before the first
 *    paint and skips the welcome screen too.
 *  - the old TV switches itself off (RetroTv, `still`) and comes back when saver goes off
 *  - CSS hides the full-screen haze / scanline layers and the header's moving glint (app.css)
 *  - the squad, its radio and the blackjack lobby check for news less often (`saverOn()`)
 *
 * Turns on by itself, without being saved, when the browser says the battery is low (≤ 20 % and not
 * charging), Data Saver is on or reduced motion is asked for, as long as nobody chose on/off here. A tap
 * saves the choice, so it never switches by itself again on this device.
 */

export const SAVER_KEY = 'mw4-camo-grind:saver';
/** The old pause button's key (2026-11-11): "1" = paused. Read once, then replaced by SAVER_KEY. */
export const STILL_KEY = 'mw4-camo-grind:still';
const TOLD_KEY = 'mw4-camo-grind:saver-told';

export type SaverReason = 'battery' | 'data' | 'motion';
type BatteryLike = EventTarget & { level: number; charging: boolean };

/** Battery saver is on right now (plain DOM read, for code that runs on timers). */
export function saverOn(): boolean {
	return typeof document !== 'undefined' && document.documentElement.hasAttribute('data-saver');
}

function read(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}
function write(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {
		// storage refused (private mode, full): the setting just lasts until reload
	}
}

class Motion {
	/** Battery saver on (animations stand still). Read after the page has loaded (so prerendered HTML matches). */
	still = $state(false);
	/** Why it switched on by itself this visit (null = it didn't), for a one-time toast. */
	auto = $state<SaverReason | null>(null);
	#loaded = false;
	#chosen = false;

	/** Read the saved setting once, in the browser, and look at battery / data saver / reduced motion. */
	load(): void {
		if (this.#loaded) return;
		this.#loaded = true;
		const saved = read(SAVER_KEY);
		const old = read(STILL_KEY);
		if (saved === 'on' || saved === 'off') this.#chosen = true;
		else if (old === '1' || old === '0') {
			this.#chosen = true;
			write(SAVER_KEY, old === '1' ? 'on' : 'off');
		}
		const on = saved === 'on' || (saved === null && old === '1');
		this.#apply(on);
		if (this.#chosen) return;
		const nav = navigator as Navigator & { connection?: { saveData?: boolean }; getBattery?: () => Promise<BatteryLike> };
		if (nav.connection?.saveData === true) return this.#autoOn('data');
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return this.#autoOn('motion');
		nav.getBattery?.()
			.then((battery) => {
				const check = () => {
					if (!this.#chosen && !this.still && !battery.charging && battery.level <= 0.2) this.#autoOn('battery');
				};
				check();
				battery.addEventListener('levelchange', check);
				battery.addEventListener('chargingchange', check);
			})
			.catch(() => {
				// no battery information: nothing to do
			});
	}

	/** On or off (a tap): saved, so it never switches by itself again on this device. */
	set(on: boolean): void {
		this.#loaded = true;
		this.#chosen = true;
		this.auto = null;
		this.#apply(on);
		write(SAVER_KEY, on ? 'on' : 'off');
	}

	#autoOn(reason: SaverReason): void {
		this.#apply(true);
		// say so once per reason on this device, not on every visit
		const told = read(TOLD_KEY) ?? '';
		if (!told.split(',').includes(reason)) {
			this.auto = reason;
			write(TOLD_KEY, told ? `${told},${reason}` : reason);
		}
	}

	#apply(on: boolean): void {
		this.still = on;
		const html = document.documentElement;
		// app.html's frame cap looks at data-still; CSS and the timers at data-saver
		html.toggleAttribute('data-still', on);
		html.toggleAttribute('data-saver', on);
	}
}

export const motion = new Motion();
