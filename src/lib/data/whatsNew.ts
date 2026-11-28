/**
 * "What's new" billboard (2026-11-23, the user: "a What's new billboard where we tell everything new that's
 * been put on the site, on the front page next to the weed buddy"). Newest first. **Every change that goes
 * live adds an entry at the top** (date = the day it went live, in plain words, no jargon).
 *
 * `id` is stored per device (the newest one seen, for the "NEW" pills): never change or reuse one.
 * `tab` = the page tab the "Open" button jumps to (left out = nowhere to jump); 'madness' = the game's button.
 * Pure, so the tests can run it (scripts/whats-new.test.js).
 */

export type WhatsNewTab = 'grind' | 'ranked' | 'cosmetics' | 'casino' | 'shop' | 'arcade' | 'squad' | 'madness';
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
		id: 'casino-map',
		date: '2026-11-28',
		kind: 'update',
		title: 'Casino floor map',
		text: 'The lobby is a top-down map with everyone at their machine, and the squad’s machines now show up beside yours while you spin.',
		tab: 'casino'
	},
	{
		id: 'madness-grab-bodies',
		date: '2026-11-28',
		kind: 'update',
		title: 'Madness: grab and throw bodies',
		text: 'Press E by a body to drag it along as a shield, then Q (or click with empty hands) to throw it and bowl enemies over. 🎳',
		tab: 'madness'
	},
	{
		id: 'madness-ragdolls',
		date: '2026-11-28',
		kind: 'update',
		title: 'Abscars Madness: real ragdolls',
		text: 'Enemies now crumple when they die: knees buckle, arms flop, bodies slide off ledges, and blasts and bullets throw them around.',
		tab: 'madness'
	},
	{
		id: 'madness-armory-cash',
		date: '2026-11-28',
		kind: 'update',
		title: 'Madness: attachments cost cash',
		text: 'Spend the cash you loot from enemies on attachments in your Armory. Headshots and takedowns pay more. 💵',
		tab: 'madness'
	},
	{
		id: 'madness-hq',
		date: '2026-11-28',
		kind: 'new',
		title: 'Madness: walk your own HQ',
		text: 'No more menu: walk around your headquarters to pick missions, gun and skills. Two secret vents hide bonus levels. Jump twice. 🕵️',
		tab: 'madness'
	},
	{
		id: 'madness-cash',
		date: '2026-11-28',
		kind: 'new',
		title: 'Madness: loot cash',
		text: 'Enemies you kill in Abscars Madness drop cash. Walk over it to grab it: headshots and takedowns pay more. 💵',
		tab: 'madness'
	},
	{
		id: 'madness-dive-stamina',
		date: '2026-11-28',
		kind: 'update',
		title: 'Madness: dives, takedowns, stamina',
		text: 'Press Z to dive in slow motion and shoot as you fly, backwards too. Dive into an enemy for a wrestling takedown. Sprinting uses stamina.',
		tab: 'madness'
	},
	{
		id: 'madness-sprint-slide',
		date: '2026-11-28',
		kind: 'update',
		title: 'Madness: sprint, slide and crouch',
		text: 'Hold Shift to sprint, S while sprinting to slide under bullets, hold S to crouch and sneak. Holk Time moved to V.',
		tab: 'madness'
	},
	{
		id: 'madness-armory',
		date: '2026-11-28',
		kind: 'new',
		title: 'Abscars Madness: your own Armory',
		text: 'Finish a level holding a gun and it goes in your Armory. Earn gun parts, bolt on attachments and start levels with it.',
		tab: 'madness'
	},
	{
		id: 'hideouts-lobby',
		date: '2026-11-28',
		kind: 'new',
		title: 'Casino lobby, collab spins + hideouts',
		text: 'See who’s in the casino and what they play, chip in on collab spins, and buy a hideout to hang out, play cards and bet with the squad.',
		tab: 'casino'
	},
	{
		id: 'meili-joins',
		date: '2026-11-28',
		kind: 'new',
		title: 'Meili joins the squad',
		text: 'Meili is the eighth operator in the squad frame, with his own pick in the squad link. Welcome to the grind! 🛡️',
		tab: 'squad'
	},
	{
		id: 'prestige-only',
		date: '2026-11-28',
		kind: 'update',
		title: 'Only Prestige boxes after Divergence',
		text: 'Weapons with G, P and HB done now show just the Prestige boxes once Divergence is unlocked. Gun pictures are plain again.',
		tab: 'grind'
	},
	{
		id: 'city-gone',
		date: '2026-11-28',
		kind: 'update',
		title: 'Burgi City has left town',
		text: 'The town map is gone from the front page. Holk Park is still open… if you can find it. 🌿'
	},
	{
		id: 'case-battles-look',
		date: '2026-11-24',
		kind: 'update',
		title: 'Case Battles got a makeover',
		text: 'New cases with a glass window, a lit stage, CS2-style reel and item cards, and tidier battles and lobbies.',
		tab: 'casino'
	},
	{
		id: 'case-battles',
		date: '2026-11-24',
		kind: 'new',
		title: 'Case Battles in BurgiCasino',
		text: '47 CS2 cases: open them, or open a lobby the squad can join (1v1 up to 2v2). All cases open at once; the best total takes it all.',
		tab: 'casino'
	},
	{
		id: 'madness-speed',
		date: '2026-11-24',
		kind: 'update',
		title: 'Madness: calmer pace + game speed',
		text: 'Abscars Madness runs about a third slower now. Pick Slow, Calm or Fast under Settings; jumps reach just as far.',
		tab: 'madness'
	},
	{
		id: 'title-removed',
		date: '2026-11-24',
		kind: 'update',
		title: 'Even cleaner header',
		text: 'The big MW4 // CAMO GRIND title is gone too, so the squad, the TV and the news sit closer together.',
		tab: 'grind'
	},
	{
		id: 'hud-box-removed',
		date: '2026-11-24',
		kind: 'update',
		title: 'Tidier header',
		text: 'The little red “Status: Grinding” box above the title is gone, so the header is cleaner.',
		tab: 'grind'
	},
	{
		id: 'madness-death-sounds',
		date: '2026-11-24',
		kind: 'update',
		title: 'Madness: oof and wasted',
		text: 'Enemies go “oof” when they drop, and you get the classic “wasted” sting when you die yourself.',
		tab: 'madness'
	},
	{
		id: 'madness-hitmarkers',
		date: '2026-11-24',
		kind: 'update',
		title: 'Hitmarkers in Abscars Madness',
		text: 'An X flashes on your crosshair with a crisp tick every time a shot lands, and turns red on a kill.',
		tab: 'madness'
	},
	{
		id: 'madness-stealth',
		date: '2026-11-24',
		kind: 'update',
		title: 'Madness: slower, sneakier, knives',
		text: 'Calmer pace and a closer camera. Sneak up behind enemies for silent takedowns, or throw knives (F) and pick them back up.',
		tab: 'madness'
	},
	{
		id: 'madness-chapter-2',
		date: '2026-11-24',
		kind: 'new',
		title: 'Abscars Madness: Chapter 2',
		text: '8 new levels: climb a skyscraper, fall into the depths, wall-jump up shafts, ride lifts, outrun rising sludge. Open now.',
		tab: 'madness'
	},
	{
		id: 'casino-stats-reset',
		date: '2026-11-24',
		kind: 'update',
		title: 'Casino leaderboard can start over',
		text: 'Abscar can now put everyone’s casino stats back at 0 for a fresh race. Nobody loses a single burger.',
		tab: 'casino'
	},
	{
		id: 'madness-real-guns',
		date: '2026-11-24',
		kind: 'update',
		title: 'Real gunshots in Abscars Madness',
		text: 'Pistols, SMGs, rifles, shotguns, LMGs and snipers now sound like real recorded guns, each kind its own.',
		tab: 'madness'
	},
	{
		id: 'madness-settings',
		date: '2026-11-24',
		kind: 'update',
		title: 'Abscars Madness settings',
		text: 'Pick your own keys for jump, dash and the rest, plus volume, screen shake and short hops, in the game’s Settings tab.',
		tab: 'madness'
	},
	{
		id: 'abscars-madness',
		date: '2026-11-23',
		kind: 'new',
		title: 'Abscars Madness',
		text: 'Squad Mayhem grew up: 12 levels with puzzles and bosses, a skill tree, double jump + dash, new gun sounds, a big button up top.',
		tab: 'madness'
	},
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
		tab: 'madness'
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
