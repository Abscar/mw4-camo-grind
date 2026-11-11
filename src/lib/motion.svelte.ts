/**
 * "Pause animations" (the user's ask 2026-11-11: a button that pauses every animation on the page
 * to save CPU). A pause button in the header's settings row (ThemePicker), per device under its own
 * key, like the sound setting: not part of the saved progress, backups or sync.
 *
 * Paused = `data-still` on <html>. The pausing itself lives in the inline script in app.html, so it
 * already works before this code has loaded (and in the offline file): every endless CSS animation
 * is frozen where it is (a still picture of the page), including ones that start later, while
 * one-off feedback (a tick's pop, the kill feed, the Divergence flash) still plays. The old TV
 * switches itself off while paused (RetroTv) and comes back on when you press play.
 * With prefers-reduced-motion nothing moves anyway, so the button is hidden there.
 */

export const STILL_KEY = 'mw4-camo-grind:still';

class Motion {
	/** Animations paused on this device. Read after the page has loaded (so prerendered HTML matches). */
	still = $state(false);
	#loaded = false;

	/** Read the saved setting once, in the browser. */
	load(): void {
		if (this.#loaded) return;
		this.#loaded = true;
		let still = false;
		try {
			still = localStorage.getItem(STILL_KEY) === '1';
		} catch {
			// no storage: animations run
		}
		this.#apply(still);
	}

	/** Pause or play (a tap). */
	set(still: boolean): void {
		this.#loaded = true;
		this.#apply(still);
		try {
			localStorage.setItem(STILL_KEY, still ? '1' : '0');
		} catch {
			// storage refused (private mode, full): the setting just lasts until reload
		}
	}

	#apply(still: boolean): void {
		this.still = still;
		// app.html watches this attribute and pauses / plays the animations
		document.documentElement.toggleAttribute('data-still', still);
	}
}

export const motion = new Motion();
