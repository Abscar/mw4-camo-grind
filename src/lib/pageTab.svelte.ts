/**
 * Which big tab the page shows: the camo grind (everything that was there before) or Ranked prep
 * (2026-11-12, the user's ask: "a Ranked tab with the CDL rules, bans and meta classes, to prepare
 * before ranked launches"). Remembered per device, not in saves, backups or sync. The prerendered
 * page always starts on the grind; the saved choice is read once the page has loaded.
 */

export type PageTab = 'grind' | 'ranked';
export const PAGE_TABS: PageTab[] = ['grind', 'ranked'];
const STORE_KEY = 'mw4-camo-grind:tab';

class PageTabState {
	current = $state<PageTab>('grind');

	load() {
		try {
			if (localStorage.getItem(STORE_KEY) === 'ranked') this.current = 'ranked';
		} catch {
			// storage blocked: start on the grind every time
		}
	}

	set(tab: PageTab) {
		this.current = tab;
		try {
			if (tab === 'ranked') localStorage.setItem(STORE_KEY, tab);
			else localStorage.removeItem(STORE_KEY);
		} catch {
			// not remembered, still switches
		}
	}
}

export const pageTab = new PageTabState();
