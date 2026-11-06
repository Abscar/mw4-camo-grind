import { version } from '$app/env';
import { OFFLINE_FILE } from '#lib/browser.ts';

/**
 * The offline file has no server next to it, but SvelteKit still looks for `_app/version.json`
 * (to detect new deployments) whenever the tab regains focus. On file:// that request fails and
 * prints errors in the console, so the offline file answers it itself: "no new version".
 */
if (OFFLINE_FILE) {
	const realFetch = window.fetch.bind(window);
	window.fetch = (input, init) => {
		const url = input instanceof Request ? input.url : String(input);
		return url.endsWith('/_app/version.json')
			? Promise.resolve(Response.json({ version }))
			: realFetch(input, init);
	};
}
