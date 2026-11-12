/**
 * Cosmetics tab (the user's ask, 2026-11-12: "a tab with cosmetics where I can see all large stickers,
 * stickers and charms available in MW4"). A dated SNAPSHOT of every Large Decal ("large sticker"),
 * Weapon Sticker and Weapon Charm we could find a source for.
 *
 * Nobody publishes a complete list (codmw4.wiki says so itself), so this is put together from:
 * - Activision's own posts, read 12 Nov: the "Progression and Prestige" launch blog (Prestige 1,
 *   Prestige Master 70 / 80), the Season 1 Battle Pass + store bundles blog, and the support pages
 *   for bonus content and the Monster Energy promotions → `verified: true`
 * - Prestige 2–10: Destructoid, GameRant and Dexerto agree on every name → `verified: true`
 * - Battle Pass tiers Activision didn't list: Detonated's tier 1–100 list only → `verified: false`
 * - Wager Match: GameRant + Detonated agree → `verified: true`
 * - everything else from one outlet (mmoexp, codskins.co.uk, codmw4.wiki) → `verified: false` + note
 *
 * Gun Screens sit in the charm slot in game, so the one known is listed with the charms.
 * Refresh when a season, event or Battle Pass changes (or when the user asks). Tested in
 * scripts/cosmetics.test.js.
 */

export const COSMETICS_CHECKED = '2026-11-12';
export const COSMETICS_SOURCES =
	'Activision (callofduty.com blogs, support pages), Destructoid, GameRant, Dexerto, Detonated, mmoexp, codskins.co.uk, codmw4.wiki';

/** The three kinds, in the order the tab shows them. `decal` = the game's "Large Decal". */
export const COSMETIC_TYPES = ['decal', 'sticker', 'charm'] as const;
export type CosmeticType = (typeof COSMETIC_TYPES)[number];

/** Where an item comes from, in the order the groups are shown. */
export const COSMETIC_SOURCES = ['prestige', 'battlepass', 'event', 'store', 'promo', 'unknown'] as const;
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
	extra: Partial<Pick<Cosmetic, 'verified' | 'note' | 'until' | 'gunScreen'>> = {}
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

const DETONATED = 'Only Detonated’s tier list (6 Nov) names this one; Activision’s blog shows just some of the 100 tiers.';
const WIKI = 'Named on codmw4.wiki (23 Oct) without saying how you get it. Not found anywhere else yet.';

export const COSMETICS: Cosmetic[] = [
	// ----- Large decals -----
	...PRESTIGE_DECALS.map((name, i) => item('decal', 'prestige', name, `Prestige ${i + 1}, level 40`)),
	item('decal', 'prestige', 'Prestige Master 1000', 'Prestige Master, level 1,000', {
		verified: false,
		note: 'Only Dexerto lists a large decal at level 1,000. Activision calls the final rewards “classified”.'
	}),
	item('decal', 'battlepass', 'Dokkaebi', 'Season 1 Battle Pass, tier 27'),
	item('decal', 'battlepass', 'Griiiiin', 'Season 1 Battle Pass, tier 56', { verified: false, note: DETONATED }),
	item('decal', 'battlepass', 'Combat Stare', 'Season 1 Battle Pass, tier 84', { verified: false, note: DETONATED }),
	item('decal', 'promo', 'Tagged', 'Monster Energy can codes (US): comes with your first six codes'),

	// ----- Stickers -----
	item('sticker', 'prestige', 'Containment Breach', 'Prestige Master, level 80'),
	item('sticker', 'battlepass', 'Killing Demon', 'Season 1 Battle Pass: yours at once when you buy the pass'),
	item('sticker', 'battlepass', 'Doksa', 'Season 1 Battle Pass, tier 7', { verified: false, note: DETONATED }),
	item('sticker', 'battlepass', 'Wired Sigil', 'Season 1 Battle Pass, tier 48', { verified: false, note: DETONATED }),
	item('sticker', 'battlepass', 'Growlin’ Smoke', 'Season 1 Battle Pass, tier 72', { verified: false, note: DETONATED }),
	item('sticker', 'battlepass', 'Bramble Hawk', 'Season 1 Battle Pass, tier 95', { verified: false, note: DETONATED }),
	item('sticker', 'event', 'Snake Eyes', 'Wager Match event: 45 Trophies', { until: '2026-12-02' }),
	item('sticker', 'store', 'Still Hot', 'Store: The Captain Bundle'),
	item('sticker', 'store', 'Out Rocked', 'Store: Into the Fight Bundle'),
	item('sticker', 'store', 'Masquerade', 'Store: Elite Squad: Gaksuli Bundle'),
	item('sticker', 'store', 'Steel Talon', 'Store: C.O.D.E. Valor Pack (charity pack)', {
		verified: false,
		note: 'Pack contents from codmw4.wiki only.'
	}),
	item('sticker', 'promo', 'Death Grip', 'Stater Bros. Markets + Monster Energy (US stores)', {
		verified: false,
		until: '2026-10-31',
		note: 'Activision lists a sticker for this promotion without a name; “Death Grip” is from codskins.co.uk.'
	}),
	item('sticker', 'unknown', 'Rogue Signal', 'Not known yet', { verified: false, note: WIKI }),
	item('sticker', 'unknown', 'Meonjeo', 'Not known yet', { verified: false, note: WIKI }),

	// ----- Charms -----
	...PRESTIGE_CHARMS.map((name, i) => item('charm', 'prestige', name, `Prestige ${i + 1}, level 30`)),
	item('charm', 'prestige', 'Pinnacle', 'Prestige Master, level 70'),
	item('charm', 'prestige', 'Prestige Master 1000', 'Prestige Master, level 1,000', {
		verified: false,
		note: 'Listed by GameRant and Dexerto. Activision calls the final rewards “classified”.'
	}),
	item('charm', 'battlepass', 'Deadly Emerald', 'Season 1 Battle Pass, tier 1', { verified: false, note: DETONATED }),
	item('charm', 'battlepass', 'Dead Fang', 'Season 1 Battle Pass, tier 13', { verified: false, note: DETONATED }),
	item('charm', 'battlepass', 'Operation Epic', 'Season 1 Battle Pass, tier 82', { verified: false, note: DETONATED }),
	item('charm', 'battlepass', 'Falcon Thorn', 'Season 1 Battle Pass, tier 93'),
	item('charm', 'event', 'Writhing Coin', 'Wager Match event: 45 Trophies', { until: '2026-12-02' }),
	item('charm', 'store', 'Bushy', 'Store: Hollow Hunter Adaptive Camo Bundle'),
	item('charm', 'store', 'Visage', 'Store: Tracer Pack: Bone Chiller II Mastercraft Ultra Skin Bundle'),
	item('charm', 'store', 'War Crest', 'Store: The Valkyrie Mastercraft Bundle'),
	item('charm', 'store', 'High Score', 'Store: Tracer Pack: Glitched State Mastercraft Bundle'),
	item('charm', 'store', 'Seen Action', 'Store: The Captain Bundle'),
	item('charm', 'store', 'The Captain', 'Store: The Captain Bundle', { gunScreen: true }),
	item('charm', 'store', 'Chained Up', 'Store: Into the Fight Bundle'),
	item('charm', 'store', 'Pineapple Grenade', 'Store: CDL Operator Bundle', {
		verified: false,
		note: 'Only mmoexp’s store round-up names it.'
	}),
	item('charm', 'store', 'Nice Try', 'Store: C.O.D.E. Valor Pack (charity pack)', {
		verified: false,
		note: 'Pack contents from codmw4.wiki only.'
	}),
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
	...['Ghost Of Liberty', 'Submerged Methods', 'Flamin’ Heart', 'Ghost Helmet', 'First Served', 'Clockwork', 'Action Ready'].map(
		(name) => item('charm', 'unknown', name, 'Not known yet', { verified: false, note: WIKI })
	)
];

export function cosmeticsOf(type: CosmeticType): Cosmetic[] {
	return COSMETICS.filter((c) => c.type === type);
}

/** Has its last day passed? `todayIso` = the viewer's "YYYY-MM-DD". */
export function cosmeticEnded(c: Cosmetic, todayIso: string): boolean {
	return c.until !== undefined && c.until < todayIso;
}
