/**
 * "Show codes": whether loadout codes are written out next to their copy buttons (the weapon rows'
 * META button and the builds in the weapon card). Off by default: the buttons copy without showing
 * anything (2026-11-12, the user's ask: "the code doesn't need to show, just a button that copies it,
 * and a small 'show code' tick"). Remembered per device, not part of saves or sync.
 */
const KEY = 'mw4-camo-grind:codes';

class CodeView {
	show = $state(false);

	constructor() {
		if (typeof localStorage === 'undefined') return;
		try {
			this.show = localStorage.getItem(KEY) === 'show';
		} catch {
			// private mode / blocked storage: just start hidden
		}
	}

	set(show: boolean): void {
		this.show = show;
		try {
			if (show) localStorage.setItem(KEY, 'show');
			else localStorage.removeItem(KEY);
		} catch {
			// not remembered, still works for this visit
		}
	}
}

export const codeView = new CodeView();
