/**
 * "Extra camos" tab (the user's ask, 2026-11-12: "research every camo that isn't base game — easter egg
 * camos, event camos, camos from challenges etc — and make a tab with available now, upcoming and
 * expired (for the ones you can't get any more)").
 *
 * A dated SNAPSHOT. "Base game" = the weapon ladder the tracker already has (Military, the 3 Special
 * camos per weapon, Gold, Platinum, Harmonic Break, Divergence, the Mastery camos of every mode); this
 * is everything else that puts a camo on a gun: events, hidden challenges, challenge tracks, BlackCell,
 * Prestige, pre-order / beta rewards and account / promotion rewards. Paid store bundles are left out
 * (e.g. the CDL Launch Pack's "Blooming Skulls"). Checked and found WITHOUT camos (13 Nov): the Season 1
 * Battle Pass (all 100 tiers), the campaign, DMZ easter eggs / Orders, Hajin BR secrets, Twitch drops,
 * Discord, Monster Energy (its 6th item is still hidden), the other partner promotions, Boot Camp,
 * Joint Fire, the DMZ Threat Briefings and Resupply Run.
 *
 * Sources: Activision's own pages were read in the browser pane (the Season 1, Warzone Season 1,
 * BlackCell, Progression and pre-order blogs; the Warzone Season 1, Season 1 and launch patch notes);
 * requirements Activision doesn't give come from guides quoting the game (trust "guides" / "one").
 *
 * Status (available now / upcoming / expired) is worked out from the dates against the viewer's day
 * (`extraStatus`), so the tab moves things along by itself: an event drops into "Expired" the day
 * after its last day. Items with no date at all stay where `later` / `gone` put them.
 *
 * Research notes: mw4-kunskap/camos-och-system.md "A7. Extra camos utanför stegen (koll 2026-11-13)". Refresh with the
 * season data (season.ts) or when the user asks. Tested in scripts/extra-camos.test.js.
 */

export const EXTRA_CAMOS_CHECKED = '2026-11-13';

/** The three lists, in the order the switch shows them. */
export const EXTRA_STATUSES = ['now', 'upcoming', 'expired'] as const;
export type ExtraStatus = (typeof EXTRA_STATUSES)[number];

/** Where a camo comes from, in the order the groups are shown. */
export const EXTRA_KINDS = ['event', 'easterEgg', 'challenge', 'blackcell', 'prestige', 'edition', 'promo'] as const;
export type ExtraKind = (typeof EXTRA_KINDS)[number];

export const EXTRA_MODES = ['mp', 'dmz', 'wz'] as const;
export type ExtraMode = (typeof EXTRA_MODES)[number];

/**
 * How sure we are. official = Activision / Infinity Ward said so; guides = several guides agree;
 * one = only one outlet; leak = datamined or leaked, not announced.
 */
export const EXTRA_TRUST = ['official', 'guides', 'one', 'leak'] as const;
export type ExtraTrust = (typeof EXTRA_TRUST)[number];

export interface ExtraCamo {
	/**
	 * What the "Got it" ticks are saved (and synced) by, since 2026-11-13. Made from kind + name
	 * (+ weapon) by `camo()`: never change an existing entry's id. When an entry is renamed (real
	 * camo names came out), pass its old id as `id` so nobody's tick is lost.
	 */
	id: string;
	name: string;
	kind: ExtraKind;
	modes: ExtraMode[];
	/** How you get it, one short line (the exact challenge where known). */
	how: string;
	/** Only for this weapon (a blueprint's camo, a weapon reward). Missing = every weapon. */
	weapon?: string;
	/** Earned on each weapon separately (Weapon Prestige, War Spoils), not once for all. */
	perWeapon?: boolean;
	animated?: boolean;
	/** First day it can be earned ("YYYY-MM-DD"). Missing = from launch, or before this snapshot. */
	from?: string;
	/** Last day it can be earned ("YYYY-MM-DD"). */
	until?: string;
	/** `from` / `until` is an estimate (shown with ≈). */
	approx?: boolean;
	/** Announced or leaked but not out, and no date: shown under Upcoming with this text. */
	later?: string;
	/** Can't be earned any more and no exact last day: shown under Expired with this text. */
	gone?: string;
	trust: ExtraTrust;
	/** Where this comes from, short ("Activision, Dexerto, codmunity"). */
	sources: string;
	note?: string;
}

/** Whole days from `a` to `b` (both "YYYY-MM-DD"); negative when b is before a. */
export function daysBetween(a: string, b: string): number {
	const t = (iso: string) => {
		const [y, m, d] = iso.split('-').map(Number);
		return Date.UTC(y, m - 1, d);
	};
	return Math.round((t(b) - t(a)) / 86_400_000);
}

/** Which list a camo is in on `today` ("YYYY-MM-DD"). The last day still counts as available. */
export function extraStatus(c: ExtraCamo, today: string): ExtraStatus {
	if (c.until && today > c.until) return 'expired';
	if (c.gone) return 'expired';
	if (c.from && today < c.from) return 'upcoming';
	if (c.later && !c.from) return 'upcoming';
	return 'now';
}

const slug = (s: string) =>
	s
		.toLowerCase()
		.replace(/[’']/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

function camo(
	kind: ExtraKind,
	name: string,
	modes: ExtraMode[],
	how: string,
	trust: ExtraTrust,
	sources: string,
	extra: Partial<Omit<ExtraCamo, 'name' | 'kind' | 'modes' | 'how' | 'trust' | 'sources'>> = {}
): ExtraCamo {
	const { id, ...rest } = extra;
	return { id: id ?? slug(`${kind}-${name}${extra.weapon ? `-${extra.weapon}` : ''}`), name, kind, modes, how, trust, sources, ...rest };
}

const ALL: ExtraMode[] = ['mp', 'dmz', 'wz'];

/** Season 1's estimated last day (season.ts): season-long things end with it. */
const S1_END = '2027-01-06';
const WAGER = { from: '2026-11-11', until: '2026-12-02' };

const AV_WZ_BLOG = 'Activision (Warzone Season 1 blog, 2 Nov)';
const AV_BLACKCELL = 'Activision (Season 1 Battle Pass + BlackCell blog, 5 Nov)';
const AV_PROGRESSION = 'Activision (Progression and Prestige blog, 19 Oct)';
const AV_PREORDER = 'Activision (pre-order serialized camo blog, 20 Jul; support page “MW4 Bonus Content”)';
const RETURN_TO_WZ =
	'Activision lists it under the “Return to Call of Duty: Warzone” event without the requirement; the challenge text comes from guides quoting the game. No end date announced, and Rally Point is a limited-time mode, so don’t leave it too late.';
const ANIMATED_WHICH = 'Activision marks one of Renaissance and Violet Striker as animated, and guides disagree which.';
const BLACKCELL_NOTE =
	'Needs BlackCell, the paid upgrade of the Season 1 Battle Pass (Activision: “for BlackCell users”; GameRant says progress counts before you buy). One of the three mode challenges is enough. No end date announced: it is Season 1’s track, so the date shown is the season’s estimated end.';
const BLACKCELL_SOURCES = `${AV_BLACKCELL}; GameRant, timesaver, estnn, lfcarry`;

export const EXTRA_CAMOS: ExtraCamo[] = [
	// ----- Events -----
	camo('event', 'Venom Pile', ALL, 'Wager Match event: 1,000 Trophies on the event’s reward board (Trophies from Gauntlet 1v1 in MP, DMZ and Warzone)', 'guides', 'GameRant, DETONATED, GamerFuzion, gamer.org (11–12 Nov)', {
		...WAGER,
		note: 'Shown on the Han 86 in the event’s preview; no source says whether it fits every weapon, but event camos usually do.'
	}),
	camo('event', 'Wager Match Mastery camo', ALL, 'Wager Match event: claim enough rewards on the event’s Mastery track (the count isn’t revealed yet)', 'official', 'Activision (Season 1 blog, 28 Oct, via Worthplaying); GameRant, GamerFuzion (11 Nov)', {
		from: '2026-11-18',
		until: WAGER.until,
		approx: true,
		note: 'Activision promises a weapon camo among the Mastery rewards, but it isn’t on the board yet and has no name. Six more rewards unlock about a week into the event (≈ 18 Nov); it may be one of them, or Venom Pile itself.'
	}),
	camo('event', 'Renaissance', ['wz'], 'Return to Warzone event: win 4 Resurgence matches (Casual counts, not in a row). Hidden in the camo menu until you have it', 'guides', `${AV_WZ_BLOG}; GameRant (6 Nov), upblazed, timesaver`, {
		from: '2026-11-06',
		note: `Activision names the camo and the event; the 4 wins come from guides only. ${ANIMATED_WHICH} No end date announced.`
	}),
	camo('event', 'Violet Striker', ['wz'], 'Return to Warzone event: on Rally Point, kill 300 players and hostiles (bots count, adds up over matches)', 'guides', `${AV_WZ_BLOG}; timesaver, GameRant, DETONATED (8–10 Nov)`, {
		from: '2026-11-06',
		note: `${RETURN_TO_WZ} ${ANIMATED_WHICH}`
	}),
	camo('event', 'Neutral Ground', ['wz'], 'Return to Warzone event: on Rally Point, grab the camo case from the Special Delivery Drone and hold it for 3 minutes; the whole squad gets it', 'guides', `${AV_WZ_BLOG}; timesaver, GameRant, DETONATED (8–10 Nov)`, {
		from: '2026-11-06',
		note: `${RETURN_TO_WZ} Guides disagree whether dropping the case restarts the 3 minutes.`
	}),
	camo('event', 'Gold Mosaic', ['wz'], 'Grind for Royalty (Events tab): complete 10 of your personal challenges in Battle Royale or Resurgence (Casual counts; limited-time modes don’t)', 'guides', 'Raven (Warzone Season 1 patch notes: 10 and 25 challenges); lfcarry, bosslobbies, GameRant', {
		from: '2026-11-06',
		until: S1_END,
		approx: true,
		note: 'Activision gives two camos per season (one static, one animated) at 10 and 25 challenges; which name goes with which count comes from guides reading the in-game preview. The challenges reset when Season 2 starts; Season 1’s end is an estimate.'
	}),
	camo('event', 'Gold Excellence', ['wz'], 'Grind for Royalty (Events tab): complete 25 of your personal challenges in Battle Royale or Resurgence (Casual counts; limited-time modes don’t)', 'guides', 'Raven (Warzone Season 1 patch notes: 10 and 25 challenges); lfcarry, bosslobbies, GameRant', {
		from: '2026-11-06',
		until: S1_END,
		approx: true,
		note: 'The 25-challenge reward according to guides (one source had the two the other way round). Each finished challenge makes the next one harder. Resets when Season 2 starts.'
	}),
	camo('event', 'Dusted Chevron', ALL, 'Event Mastery: complete several events (how many isn’t known)', 'one', 'Activision (launch + Season 1 patch notes: camo rewards for completing several events); two YouTube videos; mw4.gg', {
		note: 'Activision confirms Event Mastery camos for finishing several events (Boot Camp, which ended 6 Nov, should count), but has named none. “Dusted Chevron” comes only from two YouTube videos and the mw4.gg camo list; an animated second camo is mentioned there without a name.'
	}),
	camo('event', 'Camo Challenge event camos', ALL, '“Camo Challenge” event: play matches to earn XP and get weapon camos (names not revealed)', 'one', 'Activision (Season 1 blog: “Weapon Camo Events”); GamerFuzion (in-game Upcoming list, 11 Nov)', {
		from: '2026-11-16',
		approx: true,
		note: 'Activision promises Weapon Camo Events during Season 1. The date is worked out from the countdown GamerFuzion saw in the game’s Upcoming list on 11 Nov; which camos it gives isn’t known.'
	}),
	camo('event', 'Season 1 Reloaded camo events', ALL, 'More camo events in the mid-season update (names not revealed)', 'official', 'Activision (Season 1 patch notes, 5 Nov; Season 1 blog)', {
		later: 'Season 1 Reloaded (expected early December, not announced).',
		note: 'Activision: more events, “including camo events”, arrive through Season 1 and Season 1 Reloaded. Details come with the Reloaded blog.'
	}),

	// ----- Secrets & hidden challenges -----
	camo('easterEgg', 'Classified', ['wz'], 'Hidden challenge: get 10 kills with a Classified Weapon (from the Classified Weapon crate in Battle Royale or Resurgence, or Rally Point’s purple drop)', 'guides', 'Raven (Warzone Season 1 patch notes: the hidden challenge); DETONATED, timesaver, GameRant, TechStory', {
		from: '2026-11-06',
		note: 'Raven: “completing a hidden challenge with a Classified Weapon unlocks its corresponding Weapon Camo for use on other weapons” — there are four Classified Weapons, so this may be up to four camos (one per gun); guides only name “Classified”. The 10 kills come from guides and players’ screenshots; some say animated.'
	}),

	// ----- Challenges -----
	camo('challenge', 'War Spoils', ['dmz'], 'Exfil with 3 Weapon Manuals for the weapon (manuals for other weapons and failed exfils don’t count)', 'guides', 'GameRant (6 Nov), conquestcapped, bosslobbies, DETONATED (on X)', {
		perWeapon: true,
		animated: true,
		note: 'Earned on each weapon separately. Players’ screenshots show it unlocked; Activision hasn’t described it.'
	}),
	camo('challenge', 'Hajin', ['dmz'], 'Prestige your DMZ Operators 100 times (Operator Prestige at the FOB, not player Prestige)', 'guides', 'GameRant (6 Nov), conquestcapped, bosslobbies', {
		note: 'Whether it then fits every weapon isn’t said. A separate “HAJIN 2” in camo databases has no known unlock.'
	}),
	camo('challenge', 'Flashpoint', ALL, 'Complete all 9 Mastery camos: Multiplayer, Warzone and DMZ (the three per mode on the Camo grind tab)', 'one', 'Players’ in-game screenshots (9 Nov); DETONATED', {
		animated: true,
		note: 'A “Global Mastery” camo first seen unlocked on 9 Nov in players’ screenshots. Activision hasn’t announced it.'
	}),

	// ----- BlackCell (paid) -----
	camo('blackcell', 'Infiltrator', ALL, 'Any assault rifle, one of: MP 10 double kills · DMZ 20 triple kills · WZ 25 kills with ground loot', 'official', BLACKCELL_SOURCES, {
		until: S1_END,
		approx: true,
		note: BLACKCELL_NOTE
	}),
	camo('blackcell', 'Cell Ops', ALL, 'Any SMG, one of: MP 20 point-blank kills · DMZ 200 kills · WZ 10 hipfire kills', 'official', BLACKCELL_SOURCES, {
		until: S1_END,
		approx: true,
		note: BLACKCELL_NOTE
	}),
	camo('blackcell', 'Gold Tiger', ALL, 'Any sniper rifle, one of: MP 3 kills without dying 5 times · DMZ 100 headshot kills · WZ 10 headshot kills', 'official', BLACKCELL_SOURCES, {
		until: S1_END,
		approx: true,
		note: BLACKCELL_NOTE
	}),
	camo('blackcell', 'Whirlpool', ALL, 'Any LMG, one of: MP 30 longshot kills · DMZ 5 kills without reloading 10 times · WZ 2 kills without dying 10 times', 'official', BLACKCELL_SOURCES, {
		until: S1_END,
		approx: true,
		note: BLACKCELL_NOTE
	}),
	camo('blackcell', 'Intercept', ALL, 'Any melee weapon, one of: MP 3 kills in a single match 3 times · DMZ 50 kills while undetected · WZ 5 eliminations while in the top 10', 'official', BLACKCELL_SOURCES, {
		until: S1_END,
		approx: true,
		note: BLACKCELL_NOTE
	}),
	camo('blackcell', 'Spinal Verge', ALL, 'After the five BlackCell class camos, one of: MP place 1st on the scoreboard 3 times · DMZ exfil with over 150 kills 5 times · WZ 2 kills within 10 seconds 10 times', 'official', BLACKCELL_SOURCES, {
		until: S1_END,
		approx: true,
		note: `The BlackCell mastery camo. ${BLACKCELL_NOTE}`
	}),

	// ----- Prestige -----
	camo('prestige', 'Pyroclast', ALL, 'Enter Weapon Prestige 1 with the weapon (level 1)', 'official', `${AV_PROGRESSION}; games.gg, timesaver, GameRant`, {
		perWeapon: true,
		note: 'Weapon Prestige resets the gun to level 1 (Apex attachments, camos and blueprints stay). The four Pyroclast camos are stages of one evolving camo.'
	}),
	camo('prestige', 'Pyroclast Terminus', ALL, 'Reach max level again in Weapon Prestige 1 (max level differs per weapon, e.g. 72 on the Han 86)', 'official', `${AV_PROGRESSION}; games.gg, timesaver, GameRant`, {
		perWeapon: true,
		animated: true,
		note: 'Shown as “Pyroclast Verge” before launch. Animated according to guides.'
	}),
	camo('prestige', 'Pyroclast Scatter', ALL, 'Reach Weapon Prestige Master level 150 with the weapon', 'official', `${AV_PROGRESSION}; games.gg, timesaver, GameRant`, {
		perWeapon: true,
		animated: true,
		note: 'Activision says level 150; codmunity alone says 160.'
	}),
	camo('prestige', 'Pyroclast Cascade', ALL, 'Reach Weapon Prestige Master level 250 with the weapon', 'official', `${AV_PROGRESSION}; games.gg, timesaver, GameRant`, {
		perWeapon: true,
		animated: true
	}),
	camo('prestige', 'Prestige Master camo', ALL, 'Reach Prestige Master level 1,000 (player Prestige, after Prestige 10)', 'guides', 'GameRant (22 Oct), Dexerto, bosslobbies (in-game screenshot)', {
		note: 'GameRant, Dexerto and a screenshot of the in-game list show a camo at level 1,000; mw4camos and DETONATED don’t list one, and Activision calls the final rewards classified. GameRant alone says the first 100,000 get a numbered copy.'
	}),

	// ----- Pre-order & beta -----
	camo('edition', 'Moonlit Pearl', ALL, 'Digital pre-order of MW4 (Standard or Vault): the Gilded Pearl Camo Pack, unlocked at once', 'official', AV_PREORDER, {
		until: '2026-10-22',
		note: 'Pre-orders closed when the game came out on 23 Oct. Activision says some bonus items may be sold separately later. Also works on Black Ops 7 weapons.'
	}),
	camo('edition', 'Gilded Ruin', ALL, 'With the Gilded Pearl pre-order pack: earn 5,000 Skulls in Black Ops 7 (Warzone kill 30, MP 10, Endgame 5, Zombies 1). The first 100,000 got a numbered copy', 'official', AV_PREORDER, {
		until: '2026-10-22',
		note: 'The challenge started 23 Jul in Black Ops 7 Season 05 and needs the pre-order pack, which closed at launch. Activision says both pack camos unlock in MW4 at launch; one guide says Gilded Ruin still needs the Skull challenge done.'
	}),
	camo('edition', 'Litmus', ['mp', 'wz'], 'MW4 beta (21 Aug – 1 Sep 2026): reportedly 1,500 kills on players', 'one', 'DETONATED (on X, 21 Aug); NME; upblazed (beta screenshots)', {
		until: '2026-09-01',
		note: 'Activision never named it: its beta reward list had only a hidden “[CLASSIFIED] Challenge Reward”. The kill count is from DETONATED alone, and nobody has confirmed it showing up in the full game.'
	}),

	// ----- Account & promotions -----
	camo('promo', 'Locked Down', ALL, 'Verify the email on your Activision account (callofduty.com/verify-email), then restart the game. Accounts verified earlier got it automatically', 'official', 'Activision support (“Activision account email verification”); timesaver (30 Oct)', {
		note: 'Activision’s page gives no end date; some guides say the offer ran until Season 1 (6 Nov), so it may or may not still work. Verifying turns on email codes when you sign in. MW4 weapons only.'
	})
];

/** The sources line under the tab. */
export const EXTRA_CAMOS_SOURCES =
	'Activision (callofduty.com blogs + patch notes, support pages), Raven, GameRant, DETONATED, timesaver, GamerFuzion, games.gg, lfcarry, bosslobbies, conquestcapped';
