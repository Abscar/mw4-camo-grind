/**
 * "Get it as an app" (2026-11-11, the user's pick from a brainstorm: an icon on the phone's home
 * screen that opens full screen). The web app manifest + icons live in static/; this keeps track of
 * whether the browser offers its own install prompt (Chrome / Edge / Android), which kind of phone
 * this is (the steps differ), and whether the page already runs as the installed app.
 *
 * Browsers fire `beforeinstallprompt` once, possibly before the page's code has started, so app.html
 * catches it early and parks it on `window.__mw4InstallPrompt`; `start()` picks it up from there.
 */

interface InstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
	interface Window {
		__mw4InstallPrompt?: Event | null;
	}
}

export type Platform = 'ios' | 'android' | 'other';

class Install {
	/** null until the page runs in a browser (so the prerendered page and the first render match). */
	platform = $state<Platform | null>(null);
	/** Already running as the installed app (home-screen icon). */
	standalone = $state(false);
	/** The browser's own install prompt, when it offers one. */
	canPrompt = $state(false);
	/** Installed during this visit. */
	installed = $state(false);

	#event: InstallPromptEvent | null = null;

	/** Call once in the browser. Returns a function that stops listening. */
	start(): () => void {
		const nav = navigator as Navigator & { standalone?: boolean };
		const ua = nav.userAgent;
		const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && nav.maxTouchPoints > 1);
		this.platform = ios ? 'ios' : /Android/.test(ua) ? 'android' : 'other';
		const media = matchMedia('(display-mode: standalone)');
		this.standalone = media.matches || nav.standalone === true;

		const take = (e: Event) => {
			e.preventDefault(); // we show our own button instead of the browser's mini bar
			this.#event = e as InstallPromptEvent;
			this.canPrompt = true;
		};
		if (window.__mw4InstallPrompt) take(window.__mw4InstallPrompt);
		const onPrompt = (e: Event) => take(e);
		const onInstalled = () => {
			this.#event = null;
			this.canPrompt = false;
			this.installed = true;
		};
		const onMode = () => (this.standalone = media.matches);
		addEventListener('beforeinstallprompt', onPrompt);
		addEventListener('appinstalled', onInstalled);
		media.addEventListener('change', onMode);
		return () => {
			removeEventListener('beforeinstallprompt', onPrompt);
			removeEventListener('appinstalled', onInstalled);
			media.removeEventListener('change', onMode);
		};
	}

	/** Show the browser's install prompt (only after a tap). */
	async prompt(): Promise<void> {
		const e = this.#event;
		if (!e) return;
		this.#event = null;
		this.canPrompt = false;
		window.__mw4InstallPrompt = null;
		try {
			await e.prompt();
			const choice = await e.userChoice;
			if (choice.outcome === 'accepted') this.installed = true;
		} catch {
			// the browser refused (e.g. already shown): nothing to do
		}
	}
}

export const install = new Install();
