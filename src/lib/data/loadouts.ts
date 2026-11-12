/**
 * Meta classes ("loadouts"): one Multiplayer and one Warzone build per weapon, shown in the
 * popup behind the little crosshair button on each weapon. Attachments only: the user asked
 * for no perk / equipment / killstreak tips (2026-11-07).
 *
 * This is a SNAPSHOT of what the meta sites recommended, not live data. The meta shifts with
 * every balance patch, so every build carries its source and date, and the popup shows them.
 *
 * Sources: wzstats.gg, codmunity.gg, Dexerto (MW4 tier list 2026-10-30, Warzone Season 1
 * loadouts 2026-11-06) and lfcarry.com. Season 1 started 2026-11-06. "A + B" in `source` means
 * those sites list exactly the same attachments. Attachment names are spelled as on each
 * weapon's attachment list (codmunity.gg).
 *
 * Re-checked 2026-11-12 (no weapon patch since Season 1): new MP build for .50 GS; new WZ builds
 * for Han 86, Cronen Osprey and VEL 46 (wzstats); where one site moved on and another still lists
 * our build (WZ M4, Kastov, Striga, Astaroth, Signal 50), the source now names only the sites that
 * still list it. Dates updated where a site re-confirmed a build.
 *
 * `verified: false` = the build is built around something that was nerfed after it was
 * published, or the sites disagree about whether the gun is any good. The `note` says why, and
 * the popup shows it as text. A build from a single site is normal and is not flagged.
 *
 * Launchers and melee weapons have no attachments, so they have no meta class.
 */

export type LoadoutMode = 'mp' | 'wz';

export type AttachmentSlot =
	| 'Optic'
	| 'Muzzle'
	| 'Barrel'
	| 'Underbarrel'
	| 'Laser'
	| 'Magazine'
	| 'Ammunition'
	| 'Rear Grip'
	| 'Stock'
	| 'Comb'
	| 'Bolt'
	| 'Guard'
	| 'Trigger Action'
	| 'Cylinder'
	| 'Apex';

/** The order the popup lists attachments in, whatever order the source used. */
export const SLOT_ORDER: readonly AttachmentSlot[] = [
	'Optic',
	'Muzzle',
	'Barrel',
	'Underbarrel',
	'Laser',
	'Magazine',
	'Ammunition',
	'Rear Grip',
	'Stock',
	'Comb',
	'Bolt',
	'Guard',
	'Trigger Action',
	'Cylinder',
	'Apex'
];

/** MW4's gunsmith: five attachments plus the separate Apex slot. */
export const MAX_ATTACHMENTS = 5;

export interface Attachment {
	slot: AttachmentSlot;
	name: string;
}

export interface Loadout {
	/** What the build is for, e.g. "Close range". */
	role: string;
	attachments: Attachment[];
	/** Where the build comes from, e.g. "codmunity.gg". */
	source: string;
	/** When the source published or last updated it (YYYY-MM-DD). */
	date: string;
	verified: boolean;
	note?: string;
}

export type WeaponLoadouts = Partial<Record<LoadoutMode, Loadout>>;

type Parts = Partial<Record<AttachmentSlot, string>>;
type Extras = { note?: string; verified?: boolean };

export const build = (role: string, source: string, date: string, parts: Parts, extras: Extras = {}): Loadout => {
	const { verified = true, note } = extras;
	return {
		role,
		attachments: SLOT_ORDER.filter((slot) => parts[slot]).map((slot) => ({ slot, name: parts[slot]! })),
		source,
		date,
		verified,
		...(note ? { note } : {})
	};
};

const DEXERTO = 'Dexerto';
const DEX_DATE = '2026-10-30';
const CODMUNITY = 'codmunity.gg';
const WZSTATS = 'wzstats.gg';
/** wzstats and codmunity list the identical build. */
const WZ2 = `${WZSTATS} + ${CODMUNITY}`;
/** ...and Dexerto's Warzone Season 1 page too. */
const WZ3 = `${WZSTATS} + ${CODMUNITY} + ${DEXERTO}`;
const S1 = '2026-11-06';
const DEFAULT_SCOPE = 'No optic attachment: it uses the default scope.';
const WEAK_IN_WZ = 'Weak in Warzone right now (bottom tier on wzstats and codmunity).';
const WEAK_ON_WZSTATS = 'Bottom tier in Warzone on wzstats; codmunity rates it average.';

export const LOADOUTS: Record<string, WeaponLoadouts> = {
	// ---------- Assault Rifles ----------
	'han-86': {
		mp: build('Versatile', WZSTATS, S1, {
			Optic: 'SZ Prima-4 Dot',
			Barrel: 'HAN 86 Silenced 413mm',
			Underbarrel: 'FSS Tac90 Grip',
			Stock: 'Meiko L9P-Fold',
			Laser: 'Schlager Visiv-5'
		}),
		wz: build('Long range', WZSTATS, '2026-11-10', {
			Optic: 'Locus PX3 Canted',
			Muzzle: 'FSS IS300',
			Barrel: 'Hanbit Lightning-7 465mm',
			Magazine: '60 Round Drum',
			Ammunition: '5.56 NATO High Velocity'
		})
	},
	m4: {
		mp: build('Versatile', CODMUNITY, '2026-11-10', {
			Muzzle: 'FSS IS300',
			Barrel: 'FT Cannonade 7"',
			'Rear Grip': 'Schlager STB Grip',
			Ammunition: '5.56 NATO Overpressured',
			Underbarrel: 'FSS Tac90 Grip'
		}),
		// wzstats moved to another build on 7 Nov; codmunity (11 Nov) still lists this one
		wz: build('Long range', CODMUNITY, '2026-11-11', {
			Optic: 'Cronen R808',
			Muzzle: 'FSS IS300',
			Barrel: '16" Highmark Barrel',
			Magazine: '45 Round Mag',
			Ammunition: '5.56 NATO High Velocity'
		})
	},
	'hyeon-burst': {
		mp: build(
			'Versatile',
			CODMUNITY,
			'2026-11-07',
			{
				Muzzle: 'FSS IS40',
				Barrel: 'Mugi Hwando-Z3 521mm',
				'Rear Grip': 'HYN-Meipeul',
				Ammunition: '6.8x43mm Overpressured',
				Underbarrel: 'FSS Tac90 Grip',
				Apex: 'Hyeon Hyperburst'
			},
			{
				verified: false,
				note: 'Uses the Hyeon Hyperburst, which was nerfed hard in Season 1. codmunity still rates it top tier, but nobody has re-tested it yet.'
			}
		),
		wz: build(
			'Long range',
			CODMUNITY,
			S1,
			{
				Optic: 'Cronen R808',
				Muzzle: 'FSS IS300',
				Barrel: 'Mugi Seungri-0P 609mm',
				'Rear Grip': 'HYN-Meipeul',
				Ammunition: '6.8x43mm High Velocity',
				Apex: 'Hyeon Hyperburst'
			},
			{ verified: false, note: 'Uses the Hyeon Hyperburst, which was nerfed in Season 1.' }
		)
	},
	'patriot-xmr': {
		mp: build('Versatile', DEXERTO, DEX_DATE, {
			Muzzle: 'Meiko 30CAL-SP',
			Laser: 'SA Laz-500',
			Optic: 'SZ Prima-4 Dot',
			'Rear Grip': 'Schlager Attack-7 Grip',
			Magazine: '35 Round Mag'
		}),
		wz: build('Long range', WZ2, S1, {
			Optic: 'Cronen R808',
			Muzzle: 'EXP Undertow Gen. 2',
			Barrel: 'SO 898F 19"',
			Magazine: '50 Round Drum Mag',
			Stock: 'Hanbit B56T-L9'
		})
	},
	'kastov-762': {
		mp: build('Versatile', CODMUNITY, '2026-11-10', {
			Barrel: 'FJX Ghostfire 16.3"',
			'Rear Grip': 'Hanbit TechGrip',
			Ammunition: '7.62 Soviet Overpressured',
			Magazine: '45 Round Mag 7.62',
			Underbarrel: 'FSS Tac90 Grip'
		}),
		// wzstats moved to another build on 7 Nov; codmunity (11 Nov) and Dexerto still list this one
		wz: build('Long range', `${CODMUNITY} + ${DEXERTO}`, '2026-11-11', {
			Optic: 'Cronen R808',
			Muzzle: 'Gauge-12 Mono',
			Barrel: 'BCS-K 589mm Barrel',
			Magazine: '45 Round Mag 7.62',
			Stock: 'Hanbit Blitz v.9'
		})
	},
	oden: {
		mp: build('Long range', DEXERTO, DEX_DATE, {
			Muzzle: 'Bryson Bullhide 90',
			Laser: 'XRK Clutch-LS',
			Optic: 'SZ Micro D-3',
			Stock: 'Haebang Stal-W5',
			Underbarrel: 'FSS Fireline Grip'
		}),
		wz: build('Long range', WZ3, S1, {
			Optic: 'SZ Lonewolf Holo',
			Muzzle: 'TV Multical-77',
			Barrel: 'Rockfall-900 Barrel',
			Magazine: '30 Round Mag',
			Ammunition: '12.7x55mm High Velocity'
		})
	},
	axion: {
		mp: build('Versatile', DEXERTO, DEX_DATE, {
			Muzzle: 'FSS IS40',
			Barrel: 'SA DMN-L 30"',
			Laser: 'XRK Clutch-LS',
			'Rear Grip': 'GS50 Grip',
			Underbarrel: 'FSS Fireline Grip'
		}),
		wz: build('Long range', CODMUNITY, S1, {
			Optic: 'Cronen R808',
			Muzzle: 'FSS IS300',
			Barrel: 'SA DMN-L 30"',
			Magazine: '40 Round Mag',
			Stock: 'TA Harrow Stock'
		})
	},
	'cronen-squall': {
		mp: build('Versatile', DEXERTO, DEX_DATE, {
			Muzzle: 'HET-S6 Comp',
			Underbarrel: 'FSS Fireline Grip',
			Magazine: '30 Round Mag',
			'Rear Grip': 'FSS Grip 50',
			Optic: 'Slimline Elite'
		}),
		wz: build('Long range', WZ2, S1, {
			Optic: 'Cronen R808',
			Muzzle: 'EXP Undertow Gen. 2',
			Barrel: 'FJX Sypher 27"',
			Magazine: '30 Round Mag',
			Ammunition: '6.8 Wrath High Velocity'
		})
	},
	'cronen-osprey': {
		mp: build(
			'Versatile',
			CODMUNITY,
			S1,
			{
				Muzzle: 'XRK Mil-Tac Suppressor',
				Magazine: '60 Round Mag',
				Underbarrel: 'FSS Tac90 Grip',
				'Rear Grip': 'Cronen 56',
				Ammunition: '5.56 NATO Overpressured'
			},
			{
				verified: false,
				note: 'Brand new gun: codmunity rates it top tier in Multiplayer, wzstats near the bottom.'
			}
		),
		wz: build('Long range', WZSTATS, '2026-11-09', {
			Optic: 'Locus PX3 Canted',
			Muzzle: 'FSS IS300',
			Barrel: 'IO-556 Tac 18"',
			Magazine: '60 Round Mag',
			Stock: 'XR-9 Tac V2'
		})
	},

	// ---------- SMGs ----------
	'iso-nightshade': {
		mp: build('Close range', `${WZSTATS} + ${DEXERTO}`, S1, {
			Muzzle: 'XRK Herder 40',
			Barrel: 'ZLR Carbon-900',
			Underbarrel: 'FSS Tac90 Grip',
			'Rear Grip': 'Demo STP-1',
			Laser: 'Schlager Visiv-5'
		}),
		wz: build('Close range', CODMUNITY, S1, {
			Barrel: 'ZLR Mag-Z 9"',
			Magazine: '40 Round Mag',
			'Rear Grip': 'Demo STP-1',
			Stock: 'EXP G2-44 Stock',
			Ammunition: '9mm Parabellum High Velocity'
		})
	},
	'vel-46': {
		mp: build('Close range', `${WZSTATS} + ${DEXERTO}`, S1, {
			Muzzle: 'XRK Herder 40',
			Barrel: 'VB-46 Series 11',
			Underbarrel: 'FSS Fireline Grip',
			Laser: 'Schlager Visiv-5',
			Stock: 'VEL 46 Extended'
		}),
		wz: build('Close range', WZSTATS, '2026-11-10', {
			Muzzle: 'TA Lightning R3M',
			Underbarrel: 'FSS Tac90 Grip',
			Laser: 'XRK Clutch-LS',
			Magazine: '60 Round Drum',
			Stock: 'EXP U-Turn Stock'
		})
	},
	'wz-55-striga': {
		mp: build('Close range', DEXERTO, DEX_DATE, {
			Muzzle: '330TC2 Gridlock',
			Barrel: 'GW Sender 500',
			Laser: 'XRK Clutch-LS',
			'Rear Grip': 'Matuzek 532-L Grip',
			Magazine: '35 Round Mag'
		}),
		// codmunity swapped the grip for an optic on 11 Nov; wzstats and Dexerto still list this one
		wz: build('Close range', `${WZSTATS} + ${DEXERTO}`, S1, {
			Muzzle: 'Full Port Comp',
			Barrel: 'GW Sender 500',
			Magazine: '50 Round Drum Mag',
			'Rear Grip': 'Matuzek 532-L Grip',
			Stock: 'Wire Stock'
		})
	},
	'ppsh-41': {
		mp: build('Close range', DEXERTO, DEX_DATE, {
			Muzzle: 'Haebang BAM70',
			Barrel: 'Hanbit RDR-Tiger 50',
			Underbarrel: 'FSS Fireline Grip',
			Laser: 'Schlager Visiv-5',
			Stock: 'MT-L5 Jinhwa'
		}),
		wz: build('Close range', WZ3, S1, {
			Optic: 'ZLR Type C',
			Muzzle: 'Full Port Comp',
			Barrel: 'TT Banseok-24N',
			Underbarrel: 'Mire-50 Tac Grip',
			Stock: 'MT-L5 Jinhwa'
		})
	},
	'x-58-nyx': {
		mp: build('Close range', CODMUNITY, S1, {
			Barrel: 'Mugi HYU-90 228mm',
			Stock: 'No Stock',
			'Rear Grip': 'Mugi-X Wrap',
			Ammunition: '5.8x21mm Overpressured',
			Underbarrel: 'FSS Tac90 Grip'
		}),
		wz: build('Close range', CODMUNITY, S1, {
			Barrel: 'Doksa 4F 305mm',
			Underbarrel: 'Mire-50 Tac Grip',
			Magazine: '60 Round Mag',
			'Rear Grip': 'BOK-980',
			Stock: 'Mugi HUL-73.M Stock'
		})
	},
	'csg-35': {
		mp: build('Close range', WZSTATS, '2026-11-07', {
			Muzzle: 'EXP Forage-Hvy',
			Underbarrel: 'CQC Stop',
			Laser: 'SA Laz-500',
			Magazine: '40 Round Mag',
			Stock: 'XRK Slight Stock'
		}),
		wz: build('Close range', WZSTATS, '2026-11-07', {
			Muzzle: 'EXP Forage-Hvy',
			Underbarrel: 'CQC Stop',
			Laser: 'SA Laz-500',
			Magazine: '40 Round Mag',
			Stock: 'XRK Slight Stock'
		})
	},

	// ---------- Shotguns ----------
	'rezi-12': {
		mp: build('Close range', DEXERTO, DEX_DATE, {
			Barrel: 'ZLR Rogue 90 25"',
			Laser: 'Schlager Visiv-5',
			Bolt: 'XRK Quad-80',
			Stock: 'No Stock',
			'Rear Grip': 'XRK Bygone-39'
		}),
		wz: build('Slugs', WZ2, S1, {
			Muzzle: 'Haebang Bulsae-10',
			Barrel: 'Haebang 635R-7',
			Laser: 'Pulse-MW Laser',
			Ammunition: '12 Gauge Slug',
			Stock: 'No Stock'
		})
	},
	warlord: {
		mp: build('Close range', DEXERTO, DEX_DATE, {
			Muzzle: 'WX-600 Choke',
			Barrel: 'NK Gangta-12G',
			Bolt: 'L-Strike Bolt',
			Stock: 'Mugi D40 Stock',
			'Rear Grip': 'DV3-Sinsok Grip',
			Apex: 'Warlord Lumen'
		}),
		wz: build('Slugs', WZ2, S1, {
			Muzzle: 'WX-600 Choke',
			Barrel: 'NK Gangta-12G',
			Underbarrel: 'Mire-50 Tac Grip',
			Laser: 'Bruen 22-LPW',
			Ammunition: '12 Gauge Slug'
		})
	},

	// ---------- LMGs ----------
	'finn-lmg': {
		mp: build('Long range', DEXERTO, DEX_DATE, {
			Muzzle: 'XRK Mil-Tac Suppressor',
			Barrel: 'TA Sustain-99 20"',
			Optic: 'SZ Lonewolf Holo',
			'Rear Grip': 'XRK Singularity-13',
			Magazine: '75 Round Box Mag'
		}),
		wz: build('Long range', WZ3, S1, {
			Optic: 'SZ Helios Holo',
			Muzzle: 'FSS IS300',
			Barrel: 'TA Sustain-99 20"',
			Ammunition: '5.56 NATO High Velocity',
			'Rear Grip': 'Schlager KM60-G'
		})
	},
	'type-73': {
		mp: build('Versatile', DEXERTO, DEX_DATE, {
			Muzzle: 'Ivanov QR600',
			Barrel: 'RSS-40F 12',
			Laser: 'XRK Clutch-LS',
			Stock: 'FTAC RZR0 Stock',
			'Rear Grip': 'Assault-L5 Grip'
		}),
		wz: build(
			'Long range',
			WZ2,
			S1,
			{
				Optic: 'SZ Helios Holo',
				Muzzle: 'Gauge-12 Mono',
				Barrel: 'Haebang ET-9D 772mm',
				'Rear Grip': 'Assault-L5 Grip',
				Stock: 'FTAC RZR0 Stock'
			},
			{ note: WEAK_ON_WZSTATS }
		)
	},
	'apoc-338': {
		mp: build(
			'Long range',
			DEXERTO,
			DEX_DATE,
			{
				Muzzle: 'EXP 450 RTL',
				Laser: 'SA Laz-500',
				Optic: 'ZLR Type C',
				Stock: 'EXP Arc-7 Stock',
				'Rear Grip': 'FSS TCB-1 Grip'
			},
			{ note: 'The APOC-338 itself was nerfed on 28 Oct and again in Season 1.' }
		),
		wz: build('Long range', WZ3, S1, {
			Optic: 'SZ Helios Holo',
			Muzzle: 'TV Multical-77',
			Barrel: 'SA Trident 24.5',
			'Rear Grip': 'FSS TCB-1 Grip',
			Stock: 'EXP Arc-7 Stock'
		})
	},

	// ---------- Marksman Rifles ----------
	'mar-9': {
		mp: build('Long range', DEXERTO, DEX_DATE, {
			Barrel: 'Bruen Reaper-X',
			Laser: 'SA Laz-500',
			Optic: 'SZ Lonewolf Holo',
			'Rear Grip': 'Schlager PLM-S9',
			Underbarrel: 'FSS Tac90 Grip'
		}),
		wz: build(
			'Long range',
			CODMUNITY,
			S1,
			{
				Optic: 'SZ Echelon Holo',
				Barrel: 'Bruen Reaper-X',
				Ammunition: '7.62 NATO High Velocity',
				'Rear Grip': 'Hanbit Wrap 76',
				'Trigger Action': 'MG-Tac Trigger'
			},
			{ note: WEAK_IN_WZ }
		)
	},
	'oris-8-6': {
		mp: build('Long range', DEXERTO, DEX_DATE, {
			Barrel: 'EXP Crosstac 22"',
			Laser: 'Schlager Visiv-5',
			Optic: 'Cronen R808',
			'Rear Grip': 'OPS-45 XP Grip',
			Bolt: 'Lightfire-5 Quick Bolt'
		}),
		wz: build(
			'Long range',
			WZ2,
			S1,
			{
				Optic: 'SZ Helios Holo',
				Barrel: 'EXP Shadow-70 14',
				Magazine: '20 Round Mag',
				'Rear Grip': 'Bruen C-Wrap 60',
				Bolt: 'Lightfire-5 Quick Bolt'
			},
			{ note: WEAK_ON_WZSTATS }
		)
	},
	'mosin-nagant': {
		mp: build('Long range', WZSTATS, '2026-11-04', {
			Optic: 'Cronen R808',
			Muzzle: 'DS RKT-90',
			Barrel: '762 Dozor Barrel',
			Stock: 'Lockwood Eagle Stock',
			Bolt: 'TV-Light 7-Bolt'
		}),
		wz: build('Long range', WZSTATS, S1, {
			Optic: 'Schlager 7x',
			Muzzle: 'FTAC Silent Recon',
			Barrel: 'Mosin K025 Barrel',
			Laser: 'XRK Clutch-LS',
			Ammunition: '7.62x54mmR High Velocity'
		})
	},

	// ---------- Sniper Rifles ----------
	'kg-7-vulcan': {
		mp: build('Sniper', CODMUNITY, '2026-11-11', {
			Muzzle: 'Ivanov QR600',
			Barrel: 'TT Baem 12"',
			Stock: 'Bruen KG-7 Mk. IV',
			Optic: 'Schlager 7x',
			Comb: 'TT Type 40 Comb',
			Apex: 'KG-7 Drillcharge'
		}),
		wz: build(
			'Sniper',
			WZ2,
			S1,
			{
				Muzzle: 'Gauge-12 Mono',
				Barrel: 'Haebang RMT762 29',
				Stock: 'TT G76-RP Stock',
				Ammunition: '7.62x54mmR High Velocity',
				Bolt: 'KT76 Light Bolt'
			},
			{ note: DEFAULT_SCOPE }
		)
	},
	'astaroth-57': {
		mp: build('Sniper', DEXERTO, DEX_DATE, {
			Muzzle: 'FSS Moodkiller',
			Barrel: 'FTAC Crosswind 30',
			Optic: 'Schlager 7x',
			Stock: 'Usenko V8-LKR',
			'Rear Grip': 'FJX S-TAC Grip'
		}),
		// codmunity swapped the laser on 11 Nov; wzstats and Dexerto still list this one
		wz: build(
			'Sniper',
			`${WZSTATS} + ${DEXERTO}`,
			S1,
			{
				Muzzle: 'Usenko 900 BL-X',
				Barrel: 'FTAC Harbinger 45',
				Laser: 'XRK Clutch-LS',
				Ammunition: '.57 Cal High Velocity',
				Stock: 'Usenko V8-LKR'
			},
			{ note: DEFAULT_SCOPE }
		)
	},
	'signal-50': {
		mp: build('Sniper', DEXERTO, DEX_DATE, {
			Barrel: 'S50-SB Gen.2 22"',
			Laser: 'Schlager Visiv-5',
			Optic: 'Cronen R808',
			Stock: 'Cronen SN-Pad50',
			'Rear Grip': 'GL Zero Drop 6'
		}),
		// codmunity swapped the rear grip for a scope on 11 Nov; wzstats still lists this one
		wz: build(
			'Sniper',
			WZSTATS,
			S1,
			{
				Muzzle: 'FSS HOC-30',
				Barrel: 'MR50 Tyrant 29',
				Ammunition: '.50 Cal High Velocity',
				'Rear Grip': 'EXP Trim-54F',
				Stock: 'Cronen SN-Pad50'
			},
			{ note: DEFAULT_SCOPE }
		)
	},

	// ---------- Pistols ----------
	'sang-9mm': {
		mp: build('Secondary', DEXERTO, DEX_DATE, {
			Muzzle: 'FTAC Lonestar',
			Barrel: 'TT CP-9mm Barrel',
			Optic: 'Z-Dot 9',
			'Rear Grip': 'XRK M-Line Grip',
			Magazine: '17 Round Mag',
			Apex: 'SANG Breach'
		}),
		wz: build('Secondary', WZ2, S1, {
			Muzzle: 'SFO Proto-33',
			Barrel: 'TT CP-9mm Barrel',
			Magazine: '17 Round Mag',
			Ammunition: '9mm Parabellum High Velocity',
			'Rear Grip': 'XRK M-Line Grip'
		})
	},
	'krait-p68': {
		mp: build('Secondary', DEXERTO, DEX_DATE, {
			Muzzle: 'FTAC Lonestar',
			Barrel: 'XRK Doc-40 6"',
			Laser: 'GW 700-V',
			Optic: 'Z-Dot 9',
			'Trigger Action': 'P68 Tapper 9',
			Apex: 'Krait P68 Commando'
		}),
		wz: build('Secondary', WZ2, S1, {
			Muzzle: 'SFO Proto-33',
			Barrel: 'XRK Doc-40 6"',
			Magazine: '20 Round Mag',
			'Rear Grip': 'Shonay R-Wrap',
			'Trigger Action': 'P68 Tapper 9'
		})
	},
	'50-gs': {
		// codmunity's #1 MP build changed on 11 Nov (re-check 2026-11-12); the 6 Nov one was
		// TA SVG-50K / 14 Round Mag / .50 Pistol Overpressured / ZLR Tact-99 Grip / Corio Lightning N6
		mp: build(
			'Versatile',
			CODMUNITY,
			'2026-11-11',
			{
				Optic: 'FJX 708 PRO',
				Muzzle: 'FTAC HVY-S50',
				Laser: 'XT-100',
				'Rear Grip': 'TT Iron Guard Kit',
				'Trigger Action': 'Corio Lightning N6'
			},
			{ note: 'The TT Iron Guard Kit is an event reward, not a level unlock, so you may not have it yet.' }
		),
		wz: build(
			'Secondary',
			WZ2,
			S1,
			{
				Muzzle: 'FTAC HVY-S50',
				Barrel: 'Matuzek Monarch',
				Magazine: '14 Round Mag',
				Ammunition: '.50 Pistol High Velocity',
				'Trigger Action': 'Corio Lightning N6'
			},
			{ note: WEAK_IN_WZ }
		)
	},
	'mojave-357': {
		mp: build('Secondary', CODMUNITY, '2026-11-11', {
			Barrel: 'Bryson Snub 2"',
			Ammunition: '.357 Magnum Overpressured',
			'Rear Grip': 'SA Tyrant Grip',
			'Trigger Action': 'M357 Light',
			Cylinder: 'Mojave Speed Cylinder'
		}),
		wz: build(
			'Secondary',
			WZ2,
			S1,
			{
				Muzzle: 'Matuzek H357-M Comp',
				Barrel: 'XRK Greywolf 7.5"',
				Laser: 'GW MDL-2',
				Ammunition: '.357 Magnum Snake Shot',
				Cylinder: 'Mojave Speed Cylinder'
			},
			{ note: WEAK_IN_WZ }
		)
	}
};

/** The most recent build date, for the "snapshot from" line. */
export const LOADOUTS_AS_OF: string = Object.values(LOADOUTS)
	.flatMap((w) => Object.values(w))
	.reduce((latest, l) => (l.date > latest ? l.date : latest), '');
