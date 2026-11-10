/**
 * Polite screen-reader messages that wait for a pause: a counter tapped five times in a row is read
 * out once, with the final number, instead of five times. Rendered by Toast.svelte.
 */

class Announcer {
	text = $state('');
	#timer: ReturnType<typeof setTimeout> | undefined;

	say(text: string, delay = 900): void {
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => {
			// the same words twice in a row are only read again if the region changes in between
			this.text = '';
			queueMicrotask(() => (this.text = text));
		}, delay);
	}
}

export const announcer = new Announcer();
