/**
 * Ranked prep (the page's second tab; 2026-11-12, the user's ask: "a Ranked tab: everything that's
 * allowed and banned under the CDL rules, the banned attachments, the meta classes of the guns that
 * are in ranked, and general ranked info, to prepare before ranked launches").
 *
 * A dated SNAPSHOT. Refresh when the CDL posts a new Competitive Settings version (V 1.1 …), when
 * Activision announces Ranked Play's date or rules, or when the user asks ("uppdatera").
 *
 * Sources (research notes: mw4-kunskap/meta.md "Ranked-förberedelse (koll 2026-11-12)"):
 * - OFFICIAL: the Call of Duty League's "Competitive Settings V 1.0" for the 2027 season (CDL +
 *   Challengers events), callofdutyleague.com/en-us/competitive-settings, published 11 Nov 2026,
 *   read in the browser 12 Nov (the page builds itself with JavaScript, so plain fetches only see the
 *   title). It lists only RESTRICTED items; everything else is allowed.
 * - Ranked Play itself: "coming in Season 2" (Infinity Ward, 11 Nov, via Insider Gaming). No rules
 *   yet. Earlier CoDs ran Ranked on the CDL ruleset; that MW4 will too is an expectation, said so.
 * - Pro builds: launch-week community tournaments (22–25 Oct), from Breaking Point, the pros' own
 *   codmunity profiles and ggranked (which embeds the pros' posts). All from before Season 1.
 * - Last year's game (Black Ops 7) only as a labelled reference: Activision Support's BO7 Ranked
 *   page (17 Sep 2026) and G FUEL's BO7 Season 2 rank list.
 */

import { build, type Attachment, type AttachmentSlot, type Loadout } from './loadouts.ts';

export const RANKED_CHECKED = '2026-11-12';

/** How sure a line is, shown as a small tag next to it. */
export type Trust = 'official' | 'pro' | 'guide' | 'community' | 'estimate' | 'lastYear';

export const CDL_RULES = {
	name: 'CDL Competitive Settings V 1.0',
	url: 'https://callofdutyleague.com/en-us/competitive-settings',
	published: '2026-11-11'
};

export const CDL_START = '2026-12-04';

// ---------------------------------------------------------------------------------------------
// Weapons: the CDL restricts whole classes plus two snipers. Class ids are weapons.ts's.

export const BANNED_CLASSES: readonly string[] = ['lmgs', 'marksman-rifles', 'shotguns', 'launchers'];
export const BANNED_WEAPONS: readonly string[] = ['astaroth-57', 'signal-50'];

// ---------------------------------------------------------------------------------------------
// Attachments

/** Slots the CDL bans outright ("APEX (ALL)", "Lasers (All)"). */
export const BANNED_SLOTS: readonly AttachmentSlot[] = ['Apex', 'Laser'];

/** Named attachments the CDL bans, by slot, as the CDL page spells them. */
export const BANNED_ATTACHMENTS: readonly { slot: AttachmentSlot; names: readonly string[] }[] = [
	{
		slot: 'Muzzle',
		names: [
			'FTAC Lonestar',
			'Expedite Drill L4',
			'SFO Proto-33',
			'Demo Ironshade',
			'XRK Herder 40',
			'FSS Crackdown',
			'FSS IS40',
			'XRK Mil-Tac Suppressor',
			'FSS IS300',
			'Ivanov QR600',
			'DS RKT-90',
			'Gauge-12 Mono',
			'TT Solgae F7'
		]
	},
	{ slot: 'Optic', names: ['Bruen THRM-60 Optic', 'Schlager Night View Pro', 'RVX9 Thermo', 'Luca Stormwatch', 'Bruen Maestro'] },
	{ slot: 'Underbarrel', names: ['Miri 40mm', 'TV Judicator'] },
	{ slot: 'Rear Grip', names: ['Akimbo'] },
	{ slot: 'Barrel', names: ['Han 86 Silenced 413mm'] }
];

const BANNED_NAMES = new Set(BANNED_ATTACHMENTS.flatMap((g) => g.names.map((n) => n.toLowerCase())));

/** Is this attachment restricted by the CDL rules? */
export function attachmentBanned(a: Attachment): boolean {
	return BANNED_SLOTS.includes(a.slot) || BANNED_NAMES.has(a.name.toLowerCase());
}

// ---------------------------------------------------------------------------------------------
// Equipment, perks, streaks. `icon` = GearIcon's id (drawn for every lethal, tactical, field
// upgrade, the allowed perks and the allowed streak). Every item MW4 has is listed, with `banned`.

export interface GearItem {
	name: string;
	icon?: string;
	banned: boolean;
	/** A short line under an allowed item. */
	note?: string;
}

export interface GearGroup {
	id: 'lethal' | 'tactical' | 'field' | 'perk1' | 'perk2' | 'perk3' | 'streak';
	name: string;
	items: GearItem[];
}

const ok = (name: string, icon?: string, note?: string): GearItem => ({ name, icon, banned: false, ...(note ? { note } : {}) });
const no = (name: string, icon?: string): GearItem => ({ name, icon, banned: true });

export const GEAR: GearGroup[] = [
	{
		id: 'lethal',
		name: 'Lethals',
		items: [
			ok('Frag Grenade', 'frag'),
			ok('Sticky Grenade', 'sticky', 'The semtex'),
			no('Drill Charge', 'drill'),
			no('Proximity Mine', 'proxMine'),
			no('Zip Gun', 'zipGun'),
			no('Trip Wire', 'tripWire'),
			no('Thermite', 'thermite'),
			no('Molotov Cocktail', 'molotov'),
			no('Claymore', 'claymore'),
			no('C4', 'c4'),
			no('Throwing Knife', 'throwingKnife')
		]
	},
	{
		id: 'tactical',
		name: 'Tacticals',
		items: [
			ok('Smoke Grenade', 'smoke'),
			ok('Concussion Grenade', 'concussion', 'The stun'),
			no('Flash Grenade', 'flash'),
			no('Snapshot Grenade', 'snapshot'),
			no('Heartbeat Sensor', 'heartbeat'),
			no('Shock Stick', 'shockStick'),
			no('Decoy Grenade', 'decoy'),
			no('Stim', 'stim'),
			no('Screamer Mine', 'screamer')
		]
	},
	{
		id: 'field',
		name: 'Field upgrades',
		items: [
			ok('Trophy System', 'trophy'),
			ok('Smoke Wall', 'smokeWall'),
			no('Portable Radar', 'portableRadar'),
			no('DDOS', 'ddos'),
			no('Munitions Box', 'munitions'),
			no('SAM Airburst Turret', 'samTurret'),
			no('Riot Shield', 'riotShield'),
			no('Seeker Drone', 'seekerDrone'),
			no('Inflatable Decoy', 'inflatableDecoy'),
			no('Recon Drone', 'reconDrone'),
			no('Razor Wire Trap', 'razorWire'),
			no('Tactical Insertion', 'tacInsert')
		]
	},
	{
		id: 'perk1',
		name: 'Perk 1',
		items: [ok('Kill Chain', 'killChain'), no('Quick Fix'), no('Overkill'), no('High Alert'), no('Ghost'), no('Resupply')]
	},
	{
		id: 'perk2',
		name: 'Perk 2',
		items: [
			ok('Blood Rush', 'bloodRush'),
			ok('Bomb Squad', 'bombSquad'),
			ok('Fast Hands', 'fastHands'),
			ok('Ninja', 'ninja'),
			no('Hardline'),
			no('Birdseye')
		]
	},
	{
		id: 'perk3',
		name: 'Perk 3',
		items: [ok('Battle Hardened', 'battleHardened'), no('Lethal Reach'), no('Combat Grid'), no('Scavenger'), no('Tracker'), no('Cold-Blooded')]
	},
	{
		id: 'streak',
		name: 'Killstreaks',
		items: [
			ok('Missile Salvo', 'missileSalvo', 'The only one not restricted'),
			no('UAV', 'uav'),
			no('Bomb Glider'),
			no('Care Package'),
			no('Impact Warhead'),
			no('Artillery Beacon'),
			no('Crossfire'),
			no('Combat Drone'),
			no('Counter UAV', 'counterUav'),
			no('Wheelson'),
			no('Railgun Sentry'),
			no('Attack Helicopter'),
			no('Deathstalker'),
			no('Advanced UAV'),
			no('Argonaut'),
			no('Gunship'),
			no('Air Lockdown')
		]
	}
];

// ---------------------------------------------------------------------------------------------
// Modes, maps and the key match settings (official, same page)

export interface RankedMode {
	id: string;
	name: string;
	/** The match settings that matter, short. */
	rules: string;
	maps: string[];
}

export const MODES: RankedMode[] = [
	{ id: 'hp', name: 'Hardpoint', rules: '5 minutes or 250 points · zone moves every 60 s · 2.5 s respawn', maps: ['Lotus', 'Lithium', 'Munition', 'Reactor U92', 'Rooftops', 'Sentry'] },
	{ id: 'snd', name: 'Search and Destroy', rules: 'First to 6 rounds · 1:30 rounds · one life · 5 s plant, 7.5 s defuse', maps: ['Coal', 'Lotus', 'Munition', 'Reactor U92', 'Rooftops', 'Silkworm'] },
	{ id: 'hijack', name: 'Hijack', rules: '4 minutes or 150 points · 4 s respawn · replaces Overload', maps: ['Lotus', 'Lithium', 'Munition'] }
];

// ---------------------------------------------------------------------------------------------
// Hardpoint rotations (2026-11-12, the user's ask: "where are the hardpoints on the maps and in what
// order"). The CDL runs a fixed order (Random Zone Order off) and every map loops back to P1 after
// the last hill. NOT official: Activision and the CDL publish no hill names. Two guide sites agree on
// count, order and names for every map except Lithium's P3: Scout Drop Coaching's map pages (updated
// 7 Nov, from pro scrims, with sprint times) and GamesAtlas (22 Oct). RankKD (6 Nov) gives the longest
// run's direction. Nobody says which side spawns nearer P1, so that isn't shown.

export interface Hill {
	name: string;
	/** A short "which one" note, as the guides give it (GamesAtlas's brackets). */
	note?: string;
	/** Set when the guides disagree about the name. */
	disputed?: string;
	/** Rough spot on our minimap, in the same units as the rotation's `outline` (north up). */
	at: Pt;
}

/** A point on a minimap: [x, y], x to the east, y to the south. */
export type Pt = [number, number];

export interface HpRotation {
	map: string;
	hills: Hill[];
	/**
	 * Our own very rough minimap (2026-11-12, the user's ask: "show the hardpoints on a minimap too"):
	 * the playable area's outline as a coarse polygon and the hills' rough spots, read off Scout Drop
	 * Coaching's hill diagrams (scoutdropcoaching.com/assets/maps/guides/<map>-hills-phone.webp, north
	 * up; the directions agree with RankKD's). Units are arbitrary per map; no buildings, no game art.
	 * Not 1:1 with the game's minimap and labelled "approximate" on the page.
	 */
	outline: Pt[];
	/** Water inside the map, when it is a big landmark (Lotus's harbour). */
	water?: Pt[];
	/** The guide page with the real map picture. */
	guide: string;
	/** The longest run between two hills: from P(n) to P(n+1), seconds when a guide timed it, and the direction. */
	longest: { from: number; seconds?: number; way?: string };
	/** The shortest run, when a guide gave it. */
	shortest?: { from: number; seconds: number };
}

export const HP_SOURCES = {
	text: 'Scout Drop Coaching map pages (7 Nov, from pro scrims) + GamesAtlas (22 Oct); directions from RankKD (6 Nov)',
	date: '2026-11-07'
};

const SD = 'https://scoutdropcoaching.com/maps/';

export const HP_ROTATIONS: HpRotation[] = [
	{
		map: 'Lotus',
		hills: [
			{ name: 'Fish Market', note: 'first floor', at: [455, 285] },
			{ name: 'Hostel', note: 'first floor', at: [283, 355] },
			{ name: 'Boathouse', note: 'first floor', at: [583, 228] },
			{ name: 'Garden', at: [345, 413] },
			{ name: 'Restaurant', at: [348, 205] },
			{ name: 'Market', note: 'squid statue', at: [568, 440] }
		],
		longest: { from: 5, seconds: 11 },
		outline: [
			[78, 265], [150, 175], [135, 70], [160, 62], [230, 110], [230, 135], [290, 80], [400, 135], [470, 100],
			[612, 100], [612, 195], [625, 240], [715, 245], [718, 345], [690, 352], [690, 430], [600, 490],
			[520, 540], [380, 480], [260, 420], [265, 400], [180, 350], [78, 300]
		],
		water: [[435, 135], [470, 100], [612, 100], [612, 195], [560, 195], [480, 200], [435, 225]],
		guide: SD + 'lotus'
	},
	{
		map: 'Lithium',
		hills: [
			{ name: 'Refinery', at: [403, 177] },
			{ name: 'Packaging', at: [452, 435] },
			{ name: 'Overpass', disputed: 'Scout Drop calls it Overpass, GamesAtlas calls it Decontamination', at: [580, 250] },
			{ name: 'Warehouse', at: [318, 435] },
			{ name: 'Road', at: [568, 357] },
			{ name: 'Silos', at: [297, 297] }
		],
		longest: { from: 3, way: 'east side → south-west' },
		outline: [
			[65, 232], [165, 232], [165, 115], [190, 115], [190, 135], [220, 135], [220, 70], [330, 70], [345, 90],
			[500, 85], [600, 105], [655, 100], [655, 215], [620, 240], [740, 240], [740, 348], [655, 350],
			[655, 470], [490, 470], [490, 500], [320, 500], [320, 470], [290, 470], [290, 375], [210, 375],
			[210, 325], [65, 325]
		],
		guide: SD + 'lithium'
	},
	{
		map: 'Munition',
		hills: [
			{ name: 'Convoy', note: 'side road', at: [430, 158] },
			{ name: 'Missile Cache', at: [432, 370] },
			{ name: 'Main Gate', at: [655, 293] },
			{ name: 'Sky Bridge', at: [435, 258] },
			{ name: 'Side Road', note: 'courtyard', at: [580, 215] },
			{ name: 'Water Tower', at: [272, 395] }
		],
		longest: { from: 5, seconds: 13.5, way: 'north-east → south-west' },
		shortest: { from: 4, seconds: 5.5 },
		outline: [
			[128, 130], [640, 150], [705, 195], [722, 265], [745, 268], [745, 468], [618, 468], [618, 440],
			[180, 450], [180, 390], [60, 390], [60, 195], [128, 195]
		],
		guide: SD + 'munition'
	},
	{
		map: 'Reactor U92',
		hills: [
			{ name: 'Reactor Hall', at: [347, 270] },
			{ name: 'Waste Treatment', note: 'yellow barrels', at: [481, 407] },
			{ name: 'Loading Dock', at: [408, 243] },
			{ name: 'Pump Station', at: [323, 412] },
			{ name: 'Transformers', at: [492, 245] }
		],
		longest: { from: 4, seconds: 12.5, way: 'south-west → east side' },
		outline: [
			[265, 190], [290, 160], [340, 152], [375, 165], [375, 125], [388, 125], [388, 45], [540, 72],
			[540, 160], [530, 165], [530, 350], [500, 380], [500, 430], [462, 455], [462, 555], [370, 555],
			[345, 545], [342, 460], [305, 460], [305, 385], [262, 385]
		],
		guide: SD + 'reactor'
	},
	{
		map: 'Rooftops',
		hills: [
			{ name: 'Laundry Room', at: [340, 310] },
			{ name: 'Fans', at: [200, 250] },
			{ name: 'Greenhouse', at: [620, 258] },
			{ name: 'Center', at: [415, 385] },
			{ name: 'Patio', at: [365, 220] },
			{ name: 'Pigeon Coop', at: [530, 342] }
		],
		longest: { from: 2, seconds: 16, way: 'north-west across the roof → east side' },
		shortest: { from: 1, seconds: 5.5 },
		outline: [
			[52, 198], [300, 198], [303, 180], [390, 180], [390, 170], [515, 170], [515, 192], [570, 192],
			[570, 214], [655, 214], [655, 262], [737, 262], [737, 358], [748, 362], [748, 392], [660, 392],
			[660, 410], [515, 410], [515, 430], [300, 430], [300, 425], [165, 425], [165, 392], [52, 392]
		],
		guide: SD + 'rooftops'
	},
	{
		map: 'Sentry',
		hills: [
			{ name: 'Control Center', at: [410, 288] },
			{ name: 'Barracks', at: [510, 153] },
			{ name: 'Dome', at: [430, 438] },
			{ name: 'Driveway', note: 'white jeeps', at: [250, 292] },
			{ name: 'Utility', note: 'fuel depot', at: [562, 302] }
		],
		longest: { from: 4, seconds: 8.5, way: 'west side → east side' },
		outline: [
			[147, 118], [742, 118], [742, 483], [275, 483], [275, 470], [122, 470], [122, 398], [108, 398],
			[108, 365], [60, 365], [60, 348], [97, 348], [97, 205], [147, 180]
		],
		guide: SD + 'sentry'
	}
];

/** Settings every mode shares (official). */
export const SHARED_SETTINGS = ['Friendly fire on', 'Killcam off', 'Tactical sprint on', 'Killstreaks on, 10 s delay, kept between rounds'];

// ---------------------------------------------------------------------------------------------
// Ranked meta classes. Pro builds where pros published one (launch-week tournaments); every other
// ranked-legal gun falls back to its public Multiplayer build (loadouts.ts), with any CDL-banned
// part flagged on the page (attachmentBanned).

const BP = 'Breaking Point';
const CM = 'codmunity.gg';
const GG = 'ggranked.com';

export interface ProBuild {
	/** "Main comp AR" etc. */
	pick: string;
	build: Loadout;
	/** Pros seen running this build or one close to it. */
	pros: string[];
}

export const PRO_BUILDS: Record<string, ProBuild> = {
	'han-86': {
		pick: 'Main comp AR',
		pros: ['Dashy', 'Alluka', 'Beans', 'Shotzzy'],
		build: build('Pro tournament build', `Dashy's posted class, via ${GG} + ${CM}`, '2026-10-24', {
			Optic: 'ZLR Type C',
			Muzzle: 'FTAC Dominion',
			Underbarrel: 'FSS Fireline Grip',
			Stock: 'Meiko L9P-Fold',
			Ammunition: '5.56 NATO High Velocity'
		}, { note: 'The most common pro Han 86 at the launch-week tournaments. Variants swap the optic for a Slimline Elite or SZ Prima-4 Dot, or the grip for an SA H86 465mm barrel (Scrap, Simp, Drazah).' })
	},
	'vel-46': {
		pick: 'Main comp SMG',
		pros: ['HyDra', 'Shotzzy', 'Afro', 'Simp'],
		build: build('Pro tournament build', `${CM} (HyDra, Shotzzy) + ${BP}`, '2026-11-01', {
			Muzzle: 'TA TacPro-56',
			Barrel: 'VB-46 Series 11',
			Underbarrel: 'FSS Tac90 Grip',
			'Rear Grip': 'LM Combat Grip',
			Stock: 'VEL 46 Extended'
		}, { note: 'Nearly every pro runs these five; Simp uses the FSS Fireline Grip instead. Season 1 cut its range a little (10.13 → 9.65 m), after these builds.' })
	},
	'iso-nightshade': {
		pick: 'Comp SMG, close second',
		pros: ['Shotzzy', 'Simp', 'HyDra'],
		build: build('Pro tournament build', `${BP} + ${CM} (Shotzzy)`, '2026-10-23', {
			Muzzle: 'Haebang ORC70',
			Barrel: 'ZLR Carbon-900',
			Underbarrel: 'FSS TAC90 Grip',
			'Rear Grip': 'Bruen MOD 3',
			Stock: 'EXP G2-44 Stock'
		}, { note: 'Season 1 buffed it (longer range, more damage at range), after these builds.' })
	},
	m4: {
		pick: 'Comp AR, alternative',
		pros: ['Dashy'],
		build: build('Pro tournament build', `Dashy's class, shared by Spawn Up, via ${GG}`, '2026-10-23', {
			Muzzle: 'ZLR Reverb90',
			Underbarrel: 'FSS Tac90 Grip',
			'Rear Grip': 'ZLR Phase Grip',
			Stock: 'Demo Dozer Stock',
			Ammunition: '5.56 NATO High Velocity'
		}, { note: 'Dashy also ran an M4 with the SZ Gen.6 PEQ laser before the rules came out; lasers are now banned, so that one isn’t shown.' })
	}
};

/** The order of the class list: the pro meta first, then the rest in catalogue order. */
export const PRO_ORDER: readonly string[] = ['han-86', 'vel-46', 'iso-nightshade', 'm4'];

/** The usual comp secondary (no attachments in comp, as a rule). */
export const SECONDARY_NOTE = { weapon: 'sang-9mm', source: 'esports.gg competitive loadout guide' };

// ---------------------------------------------------------------------------------------------
// Ranked Play: what's known, and last year's game for reference

export interface InfoLine {
	text: string;
	trust: Trust;
	source: string;
}

export const RANKED_STATUS: InfoLine[] = [
	{ text: 'Ranked Play for Multiplayer and Warzone comes in Season 2 (made with Treyarch and Raven).', trust: 'official', source: 'Infinity Ward, 11 Nov (via Insider Gaming)' },
	{ text: 'Season 2 has no date. Season 1 should end around early January.', trust: 'estimate', source: 'Esportstales 9 Nov, ggseason.com 7 Nov' },
	{ text: 'Expected on the CDL ruleset: 4v4 Hardpoint, Search and Destroy and Hijack, ranks Bronze → Iridescent → Top 250.', trust: 'estimate', source: 'Dexerto ranked wiki; past Ranked modes used the CDL rules' },
	{ text: 'Hijack is getting overtime or another way to stop ties.', trust: 'official', source: 'Infinity Ward, 11 Nov (via Insider Gaming)' }
];

/** Black Ops 7's Ranked, as a guide to what MW4's will probably look like. */
export const LAST_YEAR: InfoLine[] = [
	{ text: 'Unlock: 50 wins in normal matchmade Multiplayer (party games and limited modes don’t count).', trust: 'lastYear', source: 'Activision Support, BO7 Ranked Play' },
	{ text: 'Placement: 3 wins to get your starting rank.', trust: 'lastYear', source: 'Activision Support' },
	{ text: 'No SR lost for: your first loss each day, the first 3 losses of a season or after a new rank, and a teammate quitting.', trust: 'lastYear', source: 'Activision Support' },
	{ text: 'Parties: anything goes up to Platinum; Diamond within 2 ranks; Crimson and up only solo or duo, within 1 rank.', trust: 'lastYear', source: 'Activision Support' },
	{ text: 'Rewards: calling cards from Silver, camos from Gold, animated card + camo at Iridescent and Top 250; rank camos are new every season.', trust: 'lastYear', source: 'Activision Support' }
];

/** BO7's skill divisions and the SR each tier starts at (G FUEL's BO7 Season 2 list; Activision doesn't publish them). */
export const LAST_YEAR_RANKS: { name: string; color: string; sr: number[] }[] = [
	{ name: 'Bronze', color: '#c47a45', sr: [0, 300, 600] },
	{ name: 'Silver', color: '#c6ccd3', sr: [900, 1300, 1700] },
	{ name: 'Gold', color: '#f2c14e', sr: [2100, 2600, 3100] },
	{ name: 'Platinum', color: '#7fd6d1', sr: [3600, 4200, 4800] },
	{ name: 'Diamond', color: '#6fa8ff', sr: [5400, 6100, 6800] },
	{ name: 'Crimson', color: '#e0424f', sr: [7500, 8300, 9100] },
	{ name: 'Iridescent', color: '#c98bff', sr: [10000] },
	{ name: 'Top 250', color: '#ffd65a', sr: [] }
];

/** Things to do now, each from a source (or plainly marked as a guess from last year). */
export const PREP: InfoLine[] = [
	{ text: 'Get your wins in normal Multiplayer now: last year Ranked needed 50 matchmade wins to unlock.', trust: 'lastYear', source: 'Activision Support (BO7 rule)' },
	{ text: 'Level the Han 86, VEL 46 and ISO Nightshade: they’re the pros’ picks so far, and their builds need the attachments unlocked.', trust: 'pro', source: 'Breaking Point, esports.gg' },
	{ text: 'Learn Lotus and Munition first: they’re in all three modes. Then Reactor U92 and Rooftops (HP + S&D) and Lithium (HP + Hijack).', trust: 'official', source: 'CDL map pool' },
	{ text: 'Build your classes without lasers, Apex parts or the restricted muzzles and optics, so nothing changes when ranked opens.', trust: 'official', source: 'CDL restricted list' },
	{ text: 'Practise with friendly fire on: your own grenades hurt your team in comp.', trust: 'official', source: 'CDL game settings' },
	{ text: 'Watch the CDL Kickoff Classic (from 4 Dec) to see the pros’ classes and Hijack in action.', trust: 'official', source: 'CDL 2027 schedule' }
];

/** Stricter community ladders (not official): extra bans they add on top. */
export const COMMUNITY_EXTRA = {
	source: 'CMG Arena (6 Nov) + eSports Agent (7 Nov) ladder rules',
	lines: [
		'All snipers, plus Cronen Squall, Oden and X-58 Nyx; .50 GS and Mojave .357 as secondaries',
		'Optics above 1.0x, every suppressor, headshot-multiplier barrels, rapid-fire parts, all pistol attachments',
		'Armor Piercing, Frangible, Hollow Point and Overpressured ammo',
		'Only the Flash, Concussion and Smoke as tacticals (the CDL bans the Flash); no killstreaks, or only Missile Salvo'
	]
};
