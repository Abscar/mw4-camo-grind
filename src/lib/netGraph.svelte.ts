/**
 * The net_graph on/off setting (NetGraph.svelte; 2026-11-20, the user's ask: "a net_graph on the top left that
 * shows cpu usage on PC"). Per device, not in saves/backups/sync. On by default; only drawn on a PC (a mouse
 * and at least 1024 px), so phones never pay for it. Switched in the theme menu or with the secret terminal's
 * `net_graph 0` / `net_graph 1`, like the game's console.
 */

export const NETGRAPH_KEY = 'mw4-camo-grind:netgraph';

class NetGraphSetting {
	/** Read after the page has loaded, so the prerendered page (no readout) and the first render match. */
	on = $state(false);
	#loaded = false;

	load(): void {
		if (this.#loaded) return;
		this.#loaded = true;
		let saved: string | null = null;
		try {
			saved = localStorage.getItem(NETGRAPH_KEY);
		} catch {
			// no storage: the default
		}
		this.on = saved !== 'off';
	}

	set(on: boolean): void {
		this.#loaded = true;
		this.on = on;
		try {
			localStorage.setItem(NETGRAPH_KEY, on ? 'on' : 'off');
		} catch {
			// storage refused: lasts until reload
		}
	}
}

export const netGraph = new NetGraphSetting();
