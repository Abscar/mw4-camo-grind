/**
 * Cosmetics tab (the user's ask, 2026-11-12: "a tab with cosmetics where I can see all large stickers,
 * stickers and charms available in MW4"). A dated SNAPSHOT of every Large Decal ("large sticker"),
 * Weapon Sticker and Weapon Charm we could find a source for.
 *
 * Nobody publishes a complete list (codmw4.wiki says so itself), so this is put together from:
 * - Activision's own posts, read 12 Nov: the "Progression and Prestige" launch blog (Prestige 1,
 *   Prestige Master 70 / 80), the Season 1 Battle Pass + store bundles blog, the open beta guide
 *   (levels 8 / 12) and the support pages for bonus content and the Monster Energy promotions
 *   → `verified: true`
 * - Store bundles: every bundle's contents read on Activision's own store pages
 *   (callofduty.com/store/bundles/<id>, 16 Nov) and matched against itemshop.gg's store tracker
 *   → `verified: true`; a bundle only itemshop.gg shows → `verified: false`
 * - Prestige 2–10: Destructoid, GameRant and Dexerto agree on every name → `verified: true`
 * - Battle Pass tiers Activision didn't list: Detonated's and CODCentral's tier 1–100 lists agree on
 *   every name and tier (16 Nov) → `verified: true`; "free" marks are CODCentral's
 * - Wager Match: GameRant + Detonated agree → `verified: true`
 * - Boot Camp event: games.gg, Insider Gaming and gamingpromax agree → `verified: true`
 * - Twitch drops: TheGamer + several outlets for the launch drops; the beta / COD Next drops only on
 *   fan wikis (cod-mw4.wiki, mw4.fit)
 * - everything else from one outlet (mmoexp, codskins.co.uk, codmw4.wiki) → `verified: false` + note
 *
 * `added` = the day an item joined this list (2026-11-16 onwards), so the tab can tag it "New".
 *
 * Gun Screens sit in the charm slot in game, so the one known is listed with the charms.
 * Refresh when a season, event or Battle Pass changes (or when the user asks). Tested in
 * scripts/cosmetics.test.js.
 */

export const COSMETICS_CHECKED = '2026-11-16';
export const COSMETICS_SOURCES =
	'Activision (callofduty.com blogs, store pages, support pages), itemshop.gg, Destructoid, GameRant, Dexerto, Detonated, CODCentral, games.gg, Insider Gaming, TheGamer, mmoexp, codskins.co.uk, codmw4.wiki, cod-mw4.wiki';

/** How long an item keeps its "New" tag after `added`. */
export const NEW_FOR_DAYS = 14;

/** The three kinds, in the order the tab shows them. `decal` = the game's "Large Decal". */
export const COSMETIC_TYPES = ['decal', 'sticker', 'charm'] as const;
export type CosmeticType = (typeof COSMETIC_TYPES)[number];

/** Where an item comes from, in the order the groups are shown. `beta` = the open beta and Twitch drops. */
export const COSMETIC_SOURCES = ['prestige', 'battlepass', 'event', 'store', 'promo', 'beta', 'unknown'] as const;
export type CosmeticSource = (typeof COSMETIC_SOURCES)[number];

export interface Cosmetic {
	id: string;
	name: string;
	type: CosmeticType;
	source: CosmeticSource;
	/** How you get it, one short line. */
	how: string;
	/** False = one outlet only, or the sources disagree: shown as unconfirmed with the note. */
	verified: boolean;
	note?: string;
	/** Last day it can be earned ("YYYY-MM-DD"), for time-limited ones. */
	until?: string;
	/** A Gun Screen (a little display in the charm slot). */
	gunScreen?: boolean;
	/** The day it joined this list ("YYYY-MM-DD"); older items have none. */
	added?: string;
}

const slug = (s: string) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

function item(
	type: CosmeticType,
	source: CosmeticSource,
	name: string,
	how: string,
	extra: Partial<Pick<Cosmetic, 'verified' | 'note' | 'until' | 'gunScreen' | 'added'>> = {}
): Cosmetic {
	return { id: `${type}-${slug(name)}`, name, type, source, how, verified: true, ...extra };
}

// ----- Prestige: a charm at level 30 and a large decal at level 40 of every Prestige -----

const PRESTIGE_CHARMS = [
	'Engage!',
	'Beary Sorry',
	'Gas Guys',
	'Cliffhanger',
	'Eiffel Down',
	'Riley',
	'Infinite',
	'Gone Dark',
	'The Ghost',
	'Meal Prep'
];
const PRESTIGE_DECALS = [
	'Men of Service',
	'Potato Warfare',
	'Ghillie Beast',
	'Traitor',
	'Dust to Dust',
	'Spaced Out',
	'C12',
	'Keller',
	'Captain Meme',
	'The Squad'
];

const WIKI = 'Named on codmw4.wiki (23 Oct) without saying how you get it. Not found anywhere else yet.';
/** Items added in the 16 Nov refresh. */
const NEW = { added: '2026-11-16' };
/** The open beta's second weekend ended on 1 Sep. */
const BETA_END = '2026-09-01';
const BETA_NOTE = 'Named in Activision’s own open beta guide. Beta rewards carried over to the full game.';
const BOOT_CAMP_END = '2026-11-06';
const EMERALD =
	'Only itemshop.gg’s store tracker lists this bundle (in the shop since 13 Nov, sold in the console / PC platform stores rather than for COD Points). Activision’s store website doesn’t show it.';

export const COSMETICS: Cosmetic[] = [
	// ----- Large decals -----
	...PRESTIGE_DECALS.map((name, i) => item('decal', 'prestige', name, `Prestige ${i + 1}, level 40`)),
	item('decal', 'prestige', 'Prestige Master 1000', 'Prestige Master, level 1,000', {
		verified: false,
		note: 'Only Dexerto lists a large decal at level 1,000. Activision calls the final rewards “classified”.'
	}),
	item('decal', 'battlepass', 'Dokkaebi', 'Season 1 Battle Pass, tier 27'),
	item('decal', 'battlepass', 'Griiiiin', 'Season 1 Battle Pass, tier 56'),
	item('decal', 'battlepass', 'Combat Stare', 'Season 1 Battle Pass, tier 84'),
	item('decal', 'promo', 'Tagged', 'Monster Energy can codes (US): comes with your first six codes'),

	// ----- Stickers -----
	item('sticker', 'prestige', 'Containment Breach', 'Prestige Master, level 80'),
	item('sticker', 'battlepass', 'Killing Demon', 'Season 1 Battle Pass: yours at once when you buy the pass'),
	item('sticker', 'battlepass', 'Doksa', 'Season 1 Battle Pass, tier 7'),
	item('sticker', 'battlepass', 'Wired Sigil', 'Season 1 Battle Pass, tier 48'),
	item('sticker', 'battlepass', 'Growlin’ Smoke', 'Season 1 Battle Pass, tier 72 (free)'),
	item('sticker', 'battlepass', 'Bramble Hawk', 'Season 1 Battle Pass, tier 95'),
	item('sticker', 'event', 'Snake Eyes', 'Wager Match event: 45 Trophies', { until: '2026-12-02' }),
	item('sticker', 'store', 'Still Hot', 'Store: The Captain Bundle'),
	item('sticker', 'store', 'Out Rocked', 'Store: Into the Fight Bundle'),
	item('sticker', 'store', 'Masquerade', 'Store: Elite Squad: Gaksuli Bundle'),
	item('sticker', 'store', 'Steel Talon', 'Store: C.O.D.E. Valor Pack (charity pack, platform stores)'),
	item('sticker', 'store', 'No Path', 'Store: No Man’s Land Bundle', NEW),
	item('sticker', 'store', 'Cross Section', 'Store: Steadfast Bundle', NEW),
	item('sticker', 'store', 'Death Skull', 'Store: CDL Launch Pack 2027', NEW),
	item('sticker', 'store', 'Regal Snake', 'Store: Jadefire Bundle', NEW),
	item('sticker', 'store', 'Knife Way', 'Store: Northern Elite Bundle', NEW),
	item('sticker', 'store', 'Maple Patrol', 'Store: Northern Elite Bundle', NEW),
	item('sticker', 'store', 'Greens Eat You', 'Store: Emerald Reaper Bundle (platform stores)', { ...NEW, verified: false, note: EMERALD }),
	item('sticker', 'store', 'Finders Keepers', 'Store: Emerald Reaper Bundle (platform stores)', { ...NEW, verified: false, note: EMERALD }),
	item('sticker', 'promo', 'Death Grip', 'Stater Bros. Markets + Monster Energy (US stores)', {
		verified: false,
		until: '2026-10-31',
		note: 'Activision lists a sticker for this promotion without a name; “Death Grip” is from codskins.co.uk.'
	}),
	item('sticker', 'beta', 'Meonjeo', 'Open beta: reach level 12', {
		until: BETA_END,
		note: BETA_NOTE
	}),
	item('sticker', 'unknown', 'Rogue Signal', 'Not known yet', { verified: false, note: WIKI }),

	// ----- Charms -----
	...PRESTIGE_CHARMS.map((name, i) => item('charm', 'prestige', name, `Prestige ${i + 1}, level 30`)),
	item('charm', 'prestige', 'Pinnacle', 'Prestige Master, level 70'),
	item('charm', 'prestige', 'Prestige Master 1000', 'Prestige Master, level 1,000', {
		verified: false,
		note: 'Listed by GameRant and Dexerto. Activision calls the final rewards “classified”.'
	}),
	item('charm', 'battlepass', 'Deadly Emerald', 'Season 1 Battle Pass, tier 1 (free)'),
	item('charm', 'battlepass', 'Dead Fang', 'Season 1 Battle Pass, tier 13'),
	item('charm', 'battlepass', 'Operation Epic', 'Season 1 Battle Pass, tier 82'),
	item('charm', 'battlepass', 'Falcon Thorn', 'Season 1 Battle Pass, tier 93'),
	item('charm', 'event', 'Writhing Coin', 'Wager Match event: 45 Trophies', { until: '2026-12-02' }),
	item('charm', 'event', 'Hazard Ready', 'Boot Camp event: reach DMZ level 5', { ...NEW, until: BOOT_CAMP_END }),
	item('charm', 'event', 'High Voltage', 'Boot Camp event: B or better on the Intermediate Mobility Course (Proving Grounds)', {
		...NEW,
		until: BOOT_CAMP_END
	}),
	item('charm', 'store', 'Bushy', 'Store: Hollow Hunter Adaptive Camo Bundle'),
	item('charm', 'store', 'Visage', 'Store: Tracer Pack: Bone Chiller II Mastercraft Ultra Skin Bundle'),
	item('charm', 'store', 'War Crest', 'Store: The Valkyrie Mastercraft Bundle'),
	item('charm', 'store', 'High Score', 'Store: Tracer Pack: Glitched State Mastercraft Bundle'),
	item('charm', 'store', 'Seen Action', 'Store: The Captain Bundle'),
	item('charm', 'store', 'The Captain', 'Store: The Captain Bundle', { gunScreen: true }),
	item('charm', 'store', 'Chained Up', 'Store: Into the Fight Bundle'),
	item('charm', 'store', 'Pineapple Grenade', 'Store: CDL Launch Pack 2027'),
	item('charm', 'store', 'Nice Try', 'Store: C.O.D.E. Valor Pack (charity pack, platform stores)'),
	item('charm', 'store', 'Bleed Out', 'Store: Crimson Ritual Mastercraft Bundle', NEW),
	item('charm', 'store', 'Hoot', 'Store: Steadfast Bundle', NEW),
	item('charm', 'store', 'Gem Heart', 'Store: Emerald Reaper Bundle (platform stores)', { ...NEW, verified: false, note: EMERALD }),
	item('charm', 'promo', 'Ghost Tag', 'Micromania stores (France): code with MW4 merchandise', { until: '2026-12-31' }),
	item('charm', 'promo', 'Hucks charm (name not announced)', 'Hucks + Monster Energy (US stores)', {
		until: '2026-12-31',
		note: 'Activision’s promotion page lists a Weapon Charm but no name yet.'
	}),
	item('charm', 'promo', 'Yesway / Allsup’s charm (name not announced)', 'Yesway / Allsup’s + Monster Energy (US stores): three cans in one purchase', {
		until: '2026-11-03',
		note: 'Activision’s promotion page lists a Weapon Charm without a name. Codes can be redeemed until 30 Apr 2027.'
	}),
	item('charm', 'promo', 'Popped', 'Promotional code reward', {
		verified: false,
		note: 'Only codskins.co.uk (a code reseller) lists it; it may be the name of one of the store charms above.'
	}),
	item('charm', 'promo', 'Whittled Down', 'Bamboo Breach promotional bundle (EE)', {
		verified: false,
		note: 'Only codskins.co.uk (a code reseller) lists it.'
	}),
	item('charm', 'beta', 'Going Dark', 'Twitch drop at launch: watch 1 hour of Call of Duty streams with your account linked', {
		...NEW,
		until: '2026-11-05',
		note: 'From the launch drop campaign (23 Oct – 5 Nov), reported by TheGamer and several other outlets.'
	}),
	item('charm', 'beta', 'First Served', 'Open beta: reach level 8', { until: BETA_END, note: BETA_NOTE }),
	item('charm', 'beta', 'Clockwork', 'Open beta: S rank on the Expert Mobility Course (about 56 seconds or faster)', {
		until: BETA_END,
		note: 'Insider Gaming, games.gg and cod-mw4.wiki agree. The 56-second mark is what players found; Activision never gave the exact time.'
	}),
	item('charm', 'beta', 'Action Ready', 'Twitch drop during the beta: 45 minutes of watching', {
		verified: false,
		until: BETA_END,
		note: 'Only fan sites (cod-mw4.wiki, mw4.fit) list it, and they disagree on when the campaign ended (26 Aug or 1 Sep).'
	}),
	item('charm', 'beta', 'Ghost Helmet', 'Twitch drop during the COD Next stream (21 Aug): 45 minutes of watching', {
		verified: false,
		until: '2026-08-25',
		note: 'Only cod-mw4.wiki lists it (the same drops ran through the beta’s first weekend, 21–25 Aug).'
	}),
	...['Ghost Of Liberty', 'Submerged Methods', 'Flamin’ Heart'].map((name) =>
		item('charm', 'unknown', name, 'Not known yet', { verified: false, note: WIKI })
	)
];

/** Joined the list in the last `NEW_FOR_DAYS` days? `todayIso` = the viewer's "YYYY-MM-DD". */
export function cosmeticIsNew(c: Cosmetic, todayIso: string): boolean {
	if (!c.added || todayIso === '') return false;
	const days = (Date.parse(todayIso) - Date.parse(c.added)) / 86_400_000;
	return days >= 0 && days < NEW_FOR_DAYS;
}

export function cosmeticsOf(type: CosmeticType): Cosmetic[] {
	return COSMETICS.filter((c) => c.type === type);
}

/** Has its last day passed? `todayIso` = the viewer's "YYYY-MM-DD". */
export function cosmeticEnded(c: Cosmetic, todayIso: string): boolean {
	return c.until !== undefined && c.until < todayIso;
}
