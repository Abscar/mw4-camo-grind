/** One small message at the bottom of the screen, optionally with an action such as Undo. */

export interface ToastAction {
	label: string;
	run: () => void;
}

interface ToastMessage {
	id: number;
	text: string;
	action?: ToastAction;
}

class Toaster {
	current = $state<ToastMessage | null>(null);
	#timer: ReturnType<typeof setTimeout> | undefined;
	#nextId = 1;

	show(text: string, action?: ToastAction, ms = action ? 7000 : 3500): void {
		clearTimeout(this.#timer);
		this.current = { id: this.#nextId++, text, action };
		this.#timer = setTimeout(() => this.dismiss(), ms);
	}

	dismiss(): void {
		clearTimeout(this.#timer);
		this.current = null;
	}
}

export const toast = new Toaster();
