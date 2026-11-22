/**
 * "What's new" billboard (2026-11-23, the user: "a What's new billboard where we tell everything new that's
 * been put on the site, on the front page next to the weed buddy"). Newest first. **Every change that goes
 * live adds an entry at the top** (date = the day it went live, in plain words, no jargon).
 *
 * `id` is stored per device (the newest one seen, for the "NEW" pills): never change or reuse one.
 * `tab` = the page tab the "Open" button jumps to (left out = nowhere to jump).
 * Pure, so the tests can run it (scripts/whats-new.test.js).
 */

export type WhatsNewTab = 'grind' | 'ranked' | 'cosmetics' | 'casino' | 'shop' | 'arcade' | 'mayhem' | 'squad';
export type WhatsNewKind = 'new' | 'update' | 'fix';

export interface WhatsNewEntry {
	id: string;
	/** YYYY-MM-DD, the day it went live */
	date: string;
	kind: WhatsNewKind;
	title: string;
	text: string;
	tab?: WhatsNewTab;
}

export const WHATS_NEW: readonly WhatsNewEntry[] = [
	{
		id: 'drip-abscar-drop',
		date: '2026-11-23',
		kind: 'new',
		title: 'BurgiDrip: the Abscar drop',
		text: '38 new pieces: cyborg skull chain, Divergence diamond, nuke pendant, chain on fire, Abscar hoodies and kicks.',
		tab: 'shop'
	},
	{
		id: 'whats-new',
		date: '2026-11-23',
		kind: 'new',
		title: 'This billboard',
		text: 'Everything new on the site shows up here first, newest at the top.'
	},
	{
		id: 'squad-mayhem',
		date: '2026-11-23',
		kind: 'new',
		title: 'Squad Mayhem',
		text: 'A new tab: a side-view brawler where you play as your own operator with your camo guns, wave after wave.',
		tab: 'mayhem'
	},
	{
		id: 'pinball',
		date: '2026-11-23',
		kind: 'new',
		title: "Abscar's Pinball",
		text: 'Game 11 in BurgiArcade: an old-school pinball table with camo lanes, a nuke ramp, multiball and tickets to win.',
		tab: 'arcade'
	},
	{
		id: 'refresh-button',
		date: '2026-11-22',
		kind: 'new',
		title: 'Refresh button',
		text: 'A round arrow at the top of the page reloads it in one tap.'
	},
	{
		id: 'big-tv',
		date: '2026-11-22',
		kind: 'update',
		title: 'Bigger TV on PC',
		text: 'The old TV with the montages and its PlayStation corner grow with big screens.'
	},
	{
		id: 'tabs-merged',
		date: '2026-11-22',
		kind: 'update',
		title: 'Cosmetics & camos in one tab',
		text: 'Cosmetics and Extra camos share a tab with a switch. The Squad tab moved last and glows green.',
		tab: 'cosmetics'
	},
	{
		id: 'steel-matrix',
		date: '2026-11-22',
		kind: 'new',
		title: 'Steel and Matrix themes',
		text: 'Two new looks in the theme menu: clean metal grey, and green Matrix with falling code.'
	},
	{
		id: 'arcade',
		date: '2026-11-22',
		kind: 'new',
		title: 'BurgiArcade',
		text: '10 arcade games to battle the squad for high scores, win tickets and spend them on pets, plushies and mounts.',
		tab: 'arcade'
	},
	{
		id: 'drip',
		date: '2026-11-22',
		kind: 'new',
		title: 'BurgiDrip clothing store',
		text: '109 pieces: hoodies, chains, kicks, hats and fantasy raid armour sets your operator can wear.',
		tab: 'shop'
	},
	{
		id: 'cs2-armory',
		date: '2026-11-22',
		kind: 'new',
		title: 'CS2 skins in Camo Armory',
		text: '57 iconic Counter-Strike skins for the guns that have a CS2 twin. The pricey ones.',
		tab: 'shop'
	},
	{
		id: 'absolute-meta',
		date: '2026-11-22',
		kind: 'new',
		title: 'Absolute meta + Sights',
		text: 'The 3 best guns right now with full classes, a tidier Meta top 5, and which sights kick the least.',
		tab: 'grind'
	},
	{
		id: 'challenge-help',
		date: '2026-11-22',
		kind: 'update',
		title: 'Challenges behind a "?"',
		text: 'Each class box has a small "?" with its camo challenges. Hover G, P or HB to see what to do.',
		tab: 'grind'
	},
	{
		id: 'gallery',
		date: '2026-11-22',
		kind: 'update',
		title: 'Photo gallery',
		text: 'The pictures at the bottom of the page are one gallery now: swipe or use the arrows.'
	},
	{
		id: 'karma-hearts',
		date: '2026-11-22',
		kind: 'fix',
		title: 'Karma gifts are hearts',
		text: "Hearts sent from Abscar's karma bank can now be spent in KarmaShop.",
		tab: 'shop'
	},
	{
		id: 'big-money',
		date: '2026-11-22',
		kind: 'update',
		title: 'Bigger loans, endless donations',
		text: 'BurgiBank lends up to 100M, and you can donate as much as you have.',
		tab: 'casino'
	},
	{
		id: 'camo-armory',
		date: '2026-11-21',
		kind: 'new',
		title: 'Camo Armory',
		text: 'Buy Gold, Platinum, Divergence and Mastery guns for your operator to hold, unlocked class by class like the game.',
		tab: 'shop'
	},
	{
		id: 'aw-joker',
		date: '2026-11-21',
		kind: 'new',
		title: 'AW and TheJoker_BPL join the squad',
		text: 'Two new operators in the squad frame and the squad link.',
		tab: 'squad'
	},
	{
		id: 'autospin-1000',
		date: '2026-11-21',
		kind: 'update',
		title: 'Auto spin up to 1,000',
		text: 'Every slot machine can auto spin 10, 25, 50, 100 or 1,000 times.',
		tab: 'casino'
	},
	{
		id: 'karma-luck',
		date: '2026-11-21',
		kind: 'new',
		title: 'Karma luck',
		text: 'The more burgers you donate, the more luck you get on the slots.',
		tab: 'casino'
	},
	{
		id: 'roulette-anim',
		date: '2026-11-21',
		kind: 'update',
		title: 'New roulette wheel',
		text: 'A real spinning wheel with a bouncing ball, and no table limit on bets.',
		tab: 'casino'
	},
	{
		id: 'battery-saver',
		date: '2026-11-20',
		kind: 'new',
		title: 'Battery saver',
		text: 'A battery button stops all the moving decoration. The page also uses far less power than before.'
	},
	{
		id: 'hide-buttons',
		date: '2026-11-20',
		kind: 'new',
		title: 'Hide anything',
		text: 'Every part of the page has a "Hide" button. "Only camos & metas" in the list keeps just the grind.'
	},
	{
		id: 'four-slots',
		date: '2026-11-20',
		kind: 'new',
		title: 'Four new slot machines',
		text: 'Book Of Skedd, Kushburst, Abscar’s Stash and Skeddwood, each with its own bonus games.',
		tab: 'casino'
	},
	{
		id: 'karmashop',
		date: '2026-11-20',
		kind: 'new',
		title: 'BurgiGives + KarmaShop',
		text: 'Donate burgers to 11 joke causes, earn hearts and spend them in a shop of their own.',
		tab: 'casino'
	}
];

/**
 * Entries newer than the one last seen. Nothing seen yet (a first visit, or an id we no longer have): the
 * newest `first` entries, if they are from the last two weeks.
 */
export function newSince(seen: string | null, now: Date, first = 3, list: readonly WhatsNewEntry[] = WHATS_NEW): Set<string> {
	if (seen !== null) {
		const at = list.findIndex((e) => e.id === seen);
		if (at >= 0) return new Set(list.slice(0, at).map((e) => e.id));
	}
	const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);
	return new Set(list.slice(0, first).filter((e) => dayOf(e.date) >= from).map((e) => e.id));
}

/** "2026-11-23" → local midnight that day */
export function dayOf(date: string): Date {
	const [y, m, d] = date.split('-').map(Number);
	return new Date(y, m - 1, d);
}
