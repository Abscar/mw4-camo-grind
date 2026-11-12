/**
 * Apex builds: published meta classes built around each gun's Apex attachment (see apex.ts).
 * A dated SNAPSHOT like loadouts.ts (same `build` helper, same rules: source + date per build,
 * `verified: false` + `note` when something about it is doubtful).
 *
 * Researched 2026-11-12 on wzstats.gg (/best-loadouts/<gun>-mw4) and codmunity.gg
 * (/weapon/mw4/<gun>); raw notes in the session's apex-research-*.json, summary in
 * mw4-kunskap/meta.md. Where both sites had one, the build with a date of its own won.
 * codmunity shows dates day first (07/11/2026 = 7 Nov). Builds with no date of their own carry
 * the page's "last updated" date when it had one, otherwise the day we read the page, and say so
 * in `source`. wzstats writes names in capitals; they're written the way codmunity's attachment
 * lists spell them. The Apex itself is always spelled as in apex.ts (codmunity varies:
 * "Sang Breach", "APOC 338 Praetor", "Cronen Helix Mk.II", wzstats "Signal 50 Inferno").
 *
 * Only three guns have a Warzone build with the Apex (Hyeon Burst, CSG-35, and since codmunity's
 * 11 Nov update Kastov 762 with the event Apex Kastov 545): the sites put the rest of the Apex
 * parts only in Multiplayer and DMZ builds. Re-checked 2026-11-12: no other Apex build changed.
 */
import { build, type WeaponLoadouts } from './loadouts.ts';

const CM = 'codmunity.gg';
const WZS = 'wzstats.gg';
/** No date on the build itself: the date shown is the day we read the page. */
const CM_READ = 'codmunity.gg (no build date; page read)';
const WZS_READ = 'wzstats.gg (“up to date for Season 1”; page read)';
const READ = '2026-11-12';
/** codmunity's page said "last updated" on this day, the build itself had no date. */
const CM_PAGE = 'codmunity.gg (page last updated)';

const APEX_BUILD = 'Apex build';

export const APEX_BUILDS: Record<string, WeaponLoadouts> = {
	// ---------- Assault Rifles ----------
	'han-86': {
		mp: build(APEX_BUILD, CM_READ, READ, {
			Muzzle: 'FSS IS40',
			Laser: 'XRK Clutch-LS',
			'Rear Grip': 'XRK Justice II Grip',
			Ammunition: '5.56 NATO Overpressured',
			Underbarrel: 'FSS Tac90 Grip',
			Apex: 'Han X20 Skybreaker'
		})
	},
	m4: {
		mp: build(
			APEX_BUILD,
			WZS_READ,
			READ,
			{
				Optic: 'IOTA-D',
				Muzzle: 'FSS IS300',
				Underbarrel: 'FSS Fireline Grip',
				Stock: 'Hurricane Stock',
				Laser: 'SA Laz-500',
				Apex: 'M4 Hurricane'
			},
			{ note: 'codmunity’s Hurricane build swaps the stock for the Hurricane Grip with No Stock (+ ZLR Type C, FSS IS40, Schlager STB Grip).' }
		)
	},
	'hyeon-burst': {
		mp: build(
			'Versatile',
			CM,
			'2026-11-06',
			{
				Muzzle: 'FSS IS40',
				Barrel: 'Mugi Hwando-Z3 521mm',
				'Rear Grip': 'HYN-Meipeul',
				Ammunition: '6.8x43mm Overpressured',
				Underbarrel: 'FSS Tac90 Grip',
				Apex: 'Hyeon Hyperburst'
			},
			{ verified: false, note: 'The Hyeon Hyperburst was nerfed hard in Season 1 (max damage 30 → 23). The sites still list it, but nobody has re-tested it yet.' }
		),
		wz: build(
			'Long range',
			WZS,
			'2026-11-06',
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
		mp: build('Versatile', CM, '2026-11-06', {
			Muzzle: 'EXP Undertow Gen. 2',
			'Rear Grip': 'EXP TR-Wrap',
			Ammunition: '7.62 NATO Overpressured',
			Magazine: '35 Round Mag',
			Underbarrel: 'FSS Tac90 Grip',
			Apex: 'Patriot XMR Volt'
		})
	},
	'kastov-762': {
		mp: build(
			'Versatile',
			WZS_READ,
			READ,
			{
				Muzzle: 'Ivanov QR600',
				Underbarrel: 'FSS Fireline Grip',
				'Rear Grip': 'Hanbit TechGrip',
				Stock: 'Spetsnaz S10 Stock',
				Laser: 'Schlager Visiv-5',
				Apex: 'Kastov ARC'
			},
			{ note: 'codmunity’s newest builds (11 Nov) use the Season 1 event Apex Kastov 545 instead.' }
		),
		// added on the 2026-11-12 re-check: codmunity's #2 Warzone build (11 Nov)
		wz: build(
			'Sniper support',
			CM,
			'2026-11-11',
			{
				Optic: 'SZ Helios Holo',
				Barrel: 'FJX Ghostfire 16.3"',
				Magazine: '45 Round Mag 7.62',
				'Rear Grip': 'FJX Kastov Grip',
				Stock: 'Kastov Dogfighter 27',
				Apex: 'Kastov 545'
			},
			{
				note: 'Uses the Season 1 event Apex Kastov 545, which keeps the barrel slot open. codmunity rates this build average, not top tier.'
			}
		)
	},
	oden: {
		mp: build('Apex build', CM, '2026-11-09', {
			Laser: 'XRK Clutch-LS',
			Stock: 'Haebang Stal-W5',
			Comb: 'NXK-9F Comb',
			Ammunition: '12.7x55mm High Velocity',
			Underbarrel: 'FSS Tac90 Grip',
			Apex: 'Oden Sentinel'
		})
	},
	axion: {
		mp: build(
			'Hipfire',
			WZS_READ,
			READ,
			{
				Muzzle: 'FSS IS300',
				Barrel: 'XRK 09-RTAC Pro',
				Magazine: '100 Round Drum',
				Ammunition: '.300 BLK Frangible',
				Apex: 'Axion Reaver'
			},
			{ note: 'Only four attachments: the Reaver closes five slots.' }
		)
	},
	'cronen-squall': {
		mp: build(APEX_BUILD, WZS_READ, READ, {
			Optic: 'SZ Prima-4 Dot',
			Muzzle: 'Octa-63 Comp',
			Barrel: 'Bryson Longhorn 20"',
			Magazine: '30 Round Mag',
			Ammunition: '6.8 Wrath Frangible',
			Apex: 'Cronen Maelstrom'
		})
	},
	'cronen-osprey': {
		mp: build(APEX_BUILD, CM_READ, READ, {
			Muzzle: 'XRK Mil-Tac Suppressor',
			Laser: 'SA Laz-500',
			'Rear Grip': 'Cronen 56',
			Ammunition: '5.56 NATO Overpressured',
			Underbarrel: 'FSS Tac90 Grip',
			Apex: 'Cronen Helix Mk. II'
		})
	},

	// ---------- SMGs ----------
	'iso-nightshade': {
		mp: build('Versatile', CM, '2026-11-06', {
			Muzzle: 'XRK Herder 40',
			Stock: 'Demo Kilo90 Stock',
			'Rear Grip': 'ZLR Veloci Gen.2',
			Magazine: '40 Round Mag',
			Underbarrel: 'FSS Tac90 Grip',
			Apex: 'ISO Trace'
		})
	},
	'vel-46': {
		mp: build('Versatile', CM, '2026-11-06', {
			Muzzle: 'FSS Crackdown',
			Barrel: 'VB-46 Series 11',
			'Rear Grip': 'Sakin Rubber Grip',
			Ammunition: '4.6x30mm Overpressured',
			Underbarrel: 'FSS Tac90 Grip',
			Apex: 'VEL 46 Snap'
		})
	},
	'wz-55-striga': {
		mp: build('Close range', CM, '2026-11-07', {
			Muzzle: 'FTAC Silent Recon',
			Barrel: 'DS 9x18 Pro',
			Laser: 'QFL-S4.5',
			Ammunition: '9mm Makarov Overpressured',
			Magazine: '50 Round Drum Mag',
			Apex: 'Wz.55 Striga Rampage'
		})
	},
	'ppsh-41': {
		mp: build(APEX_BUILD, CM_READ, READ, {
			Muzzle: 'Haebang BAM70',
			Laser: 'XRK Clutch-LS',
			Optic: 'ZLR Type C',
			Stock: 'Hanbit Janggun-H9',
			Ammunition: '7.62 Tokarev Overpressured',
			Apex: 'PPSh-41 Ember'
		})
	},
	'x-58-nyx': {
		mp: build('Close range', CM, '2026-11-10', {
			Laser: 'Schlager Visiv-5',
			Stock: 'No Stock',
			'Rear Grip': 'Mugi-X Wrap',
			Magazine: '60 Round Mag',
			Underbarrel: 'FSS Tac90 Grip',
			Apex: 'X-58 Void'
		})
	},
	'csg-35': {
		mp: build('Close range', WZS, '2026-11-07', {
			Muzzle: 'EXP Forage-Hvy',
			Magazine: '40 Round Mag',
			'Rear Grip': 'Matuzek Fire-Pro',
			Stock: 'XRK Fury-8',
			Ammunition: '9mm Parabellum Frangible',
			Apex: 'CSG Crossfire'
		}),
		wz: build('Close range', WZS, '2026-11-07', {
			Muzzle: 'EXP Forage-Hvy',
			Magazine: '40 Round Mag',
			'Rear Grip': 'Matuzek Fire-Pro',
			Stock: 'XRK Fury-8',
			Ammunition: '9mm Parabellum Frangible',
			Apex: 'CSG Crossfire'
		})
	},

	// ---------- Shotguns ----------
	'rezi-12': {
		mp: build('Close range', CM, '2026-11-07', {
			Muzzle: 'FTAC LTS-707',
			Barrel: 'Haebang 635R-7',
			Laser: 'Schlager Visiv-5',
			Stock: 'No Stock',
			Guard: 'Demo Service-12G',
			Apex: 'Rezi 12 Enforcer'
		})
	},
	warlord: {
		mp: build('Close range', CM, '2026-11-10', {
			Muzzle: 'Mugi Kalnal-T 12G',
			Barrel: 'NK Gangta-12G',
			Bolt: 'L-Strike Bolt',
			Stock: 'Mugi Tac-717 Stock',
			'Rear Grip': 'DV3-Sinsok Grip',
			Apex: 'Warlord Lumen'
		})
	},

	// ---------- LMGs ----------
	'finn-lmg': {
		mp: build(
			APEX_BUILD,
			CM,
			'2026-11-11',
			{
				Muzzle: 'EXP V-TAC Suppressor',
				Barrel: 'TA N-VCX 18"',
				Laser: 'SZ Gen.6 PEQ',
				Stock: 'Chainsaw Grip',
				Ammunition: '5.56 NATO Overpressured',
				Apex: 'FiNN Adverse'
			},
			{ note: 'The Chainsaw Grip is an event reward, not a level unlock, so you may not have it yet.' }
		)
	},
	'type-73': {
		mp: build(APEX_BUILD, CM, '2026-11-09', {
			Optic: 'SZ SRE-7',
			Muzzle: 'Ivanov QR600',
			Underbarrel: 'Bruen Renegade Grip',
			Laser: 'Schlager Visiv-5',
			'Rear Grip': 'Assault-L9 Wood Grip',
			Apex: 'Type 73 Assault'
		})
	},
	'apoc-338': {
		mp: build(APEX_BUILD, CM, '2026-11-10', {
			Optic: 'Cronen R808',
			Muzzle: 'TV Multical-77',
			Underbarrel: 'Bruen Renegade Grip',
			'Rear Grip': 'EXP Dyna-3 Grip',
			Stock: 'No Stock',
			Apex: 'APOC-338 Praetor'
		})
	},

	// ---------- Marksman Rifles ----------
	'mar-9': {
		mp: build('Versatile', CM_PAGE, '2026-11-10', {
			Barrel: 'Bruen Reaper-X',
			Underbarrel: 'FSS Tac90 Grip',
			Laser: 'SZ Gen.6 PEQ',
			Magazine: '30 Round Mag',
			'Rear Grip': 'Schlager PLM-S9',
			Apex: 'MAR-9 Auto'
		})
	},
	'oris-8-6': {
		mp: build(
			APEX_BUILD,
			CM_READ,
			READ,
			{
				Optic: 'Cronen R808',
				Muzzle: 'EXP Undertow Gen. 2',
				Laser: 'FJX EVR7',
				'Rear Grip': 'Bruen R7-TC Grip',
				Stock: 'SA Dynamo-90 Stock',
				Apex: 'Oris 8.6 Razor'
			},
			{ note: 'codmunity rates this Apex setup below average: more for fun than for the meta.' }
		)
	},
	'mosin-nagant': {
		mp: build(APEX_BUILD, CM_READ, READ, {
			Laser: 'Schlager Visiv-5',
			Magazine: '10 Round Mag',
			Ammunition: '7.62x54mmR Overpressured',
			Stock: 'Lockwood Eagle Stock',
			Bolt: 'TV-Light 7-Bolt',
			Apex: 'Mosin Harpoon'
		})
	},

	// ---------- Sniper Rifles ----------
	'kg-7-vulcan': {
		mp: build('Sniper', CM, '2026-11-11', {
			Optic: 'Schlager 7x',
			Muzzle: 'Ivanov QR600',
			Barrel: 'TT Baem 12"',
			Stock: 'Bruen KG-7 Mk. IV',
			Comb: 'TT Type 40 Comb',
			Apex: 'KG-7 Drillcharge'
		})
	},
	'astaroth-57': {
		mp: build(APEX_BUILD, CM_PAGE, '2026-11-11', {
			Muzzle: 'FSS Moodkiller',
			Barrel: 'FTAC Crosswind 30"',
			Laser: 'XRK Clutch-LS',
			'Rear Grip': 'FJX S-TAC Grip',
			Stock: 'Cronen Strand-BG Stock',
			Apex: 'Astaroth .57 Infiltrator'
		})
	},
	'signal-50': {
		mp: build(APEX_BUILD, WZS_READ, READ, {
			Muzzle: 'FSS Moodkiller',
			Barrel: 'TV Icarus 50 24.5"',
			Laser: 'XRK Clutch-LS',
			'Rear Grip': 'GL Zero Drop 6',
			Stock: 'Cronen SN-Pad50',
			Apex: 'Signal Inferno'
		})
	},

	// ---------- Pistols ----------
	'sang-9mm': {
		mp: build('Versatile', CM, '2026-11-06', {
			Optic: 'Z-Dot 9',
			Muzzle: 'Expedite Drill L4',
			Magazine: '17 Round Mag',
			'Rear Grip': 'SANG Wood Grip',
			'Trigger Action': 'SANG Insta-F Trigger',
			Apex: 'SANG Breach'
		})
	},
	'krait-p68': {
		mp: build('Versatile', CM, '2026-11-11', {
			Muzzle: 'Expedite Drill L4',
			Barrel: 'SA Omni 5.5"',
			Ammunition: '.45 Auto Frangible',
			'Rear Grip': 'MAGTAC .45',
			'Trigger Action': 'P68 Tapper 9',
			Apex: 'Krait P68 Commando'
		})
	},
	'50-gs': {
		mp: build(
			'Close range',
			CM,
			'2026-11-11',
			{
				Muzzle: 'FTAC HVY-S50',
				Laser: 'XT-100',
				Magazine: '25 Round Drum Mag',
				Ammunition: '.50 Pistol Overpressured',
				'Rear Grip': 'TT Iron Guard Kit',
				Apex: 'GS Magna'
			},
			{ note: 'The TT Iron Guard Kit is an event reward, not a level unlock, so you may not have it yet.' }
		)
	},
	'mojave-357': {
		mp: build(APEX_BUILD, CM_READ, READ, {
			Muzzle: 'Matuzek H357-M Comp',
			Barrel: 'XRK Greywolf 7.5"',
			Laser: 'GW MDL-2',
			Ammunition: '.357 Magnum Overpressured',
			Cylinder: 'Mojave Speed Cylinder',
			Apex: 'Mojave .357 Lawless'
		})
	}
};
