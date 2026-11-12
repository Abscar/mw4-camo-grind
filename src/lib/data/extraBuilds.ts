/**
 * Stat builds per gun (2026-11-12, the user's ask: "Max Sprint Speed, Min ADS Speed … for every
 * weapon", then "all the multiplayer and warzone subclasses"): the same kinds codmunity.gg lists as
 * Premium "Additional Loadouts", but WORKED OUT by us, not copied. Shown in the weapon card's Meta tab
 * and the meta popup (MetaBuilds, "Stat builds"); they hold in Multiplayer and Warzone alike (same
 * gunsmith), and have no build code (a code is the game's own; we can't make one).
 *
 * codmunity's weapon pages publish every attachment's modifiers (ADS time, sprint speed, damage
 * range, bullet velocity …) and each gun's own attachment list with unlock levels. For every gun we
 * took, one part per slot and at most five, the parts that make the main stat best:
 *  - Min ADS: lowest ADS time (modifiers multiplied); ties by ADS-out, sprint-to-fire, movement, sprint.
 *  - Max sprint: highest sprint speed; ties by tactical sprint, sprint-to-fire, movement, ADS.
 *  - Max range: longest damage range; ties by bullet velocity, ADS, movement, sprint-to-fire.
 *  - Max velocity: fastest bullets; ties by damage range … (only listed when its parts differ from
 *    Max range; on almost every gun they're the same, so `range` says both).
 * A part is only used when it beats leaving the slot empty, so some guns get fewer than five (the
 * note says so). Never used: the Apex, Apex-only parts (Hurricane Grip …), event rewards (ChainSAW
 * Grip, TT Iron Guard Kit) and parts codmunity has no stats for. Equal parts: the lower unlock level.
 * codmunity's stat lists also carry other guns' parts (the M4's list has Han 86 barrels), which is why
 * only each gun's own attachment list counts. The MAR-9 page has no attachment list: its stat rows
 * were checked against mw4-kunskap/vapen-och-attachments.md and some unlock levels are unknown.
 * Scripts: .claude/testing/meta-codes/ (cm-fetch → cm-builds → opt → gen-site; paths point at the
 * 2026-11-12 scratchpad, adjust them). Refresh after a patch that touches attachments.
 */
import { build, type AttachmentSlot, type Loadout } from './loadouts.ts';

export type ExtraKind = 'ads' | 'sprint' | 'range' | 'velocity';
export const EXTRA_KINDS: readonly ExtraKind[] = ['ads', 'sprint', 'range', 'velocity'];

export type ExtraBuild = Loadout;

type Parts = Partial<Record<AttachmentSlot, string>>;

const READ = '2026-11-12';
const COMPUTED = 'Worked out from codmunity.gg’s attachment stats';

function notes(n: number, level: number | null, first: string[], why: string): string {
	const out = [...first];
	if (n < 5) out.push(`Only ${n} parts: ${why}`);
	out.push(level === null ? 'Unlock levels are partly unknown for this gun.' : `Needs weapon level ${level}.`);
	return out.join(' ');
}

/** `gain` = % less ADS time / % more sprint speed / % more bullet velocity; `level` = the weapon level
    its last part unlocks at (null: not all known). */
function speed(kind: 'ads' | 'sprint' | 'velocity', gain: number, level: number | null, parts: Parts, tac?: number): ExtraBuild {
	const n = Object.keys(parts).length;
	const role = kind === 'ads' ? `ADS time −${gain}%` : kind === 'sprint' ? `Sprint speed +${gain}%` : `Bullet velocity +${gain}%`;
	const why = kind === 'ads' ? 'every other slot would slow aiming down.' : 'no other slot adds to it.';
	return build(role, COMPUTED, READ, parts, {
		note: notes(n, level, kind === 'sprint' && tac ? [`Tactical sprint +${tac}% too.`] : [], why)
	});
}

/** Max damage range; `both` = its parts are also the Max velocity build. */
function reach(range: number, velocity: number, level: number | null, parts: Parts, both = false): ExtraBuild {
	const n = Object.keys(parts).length;
	const first = both ? [`Also the fastest bullets: velocity +${velocity}%.`] : [];
	return build(`Damage range +${range}%`, COMPUTED, READ, parts, { note: notes(n, level, first, 'no other slot adds range.') });
}

export const EXTRA_BUILDS: Record<string, Partial<Record<ExtraKind, ExtraBuild>>> = {
	'han-86': {
		ads: speed('ads', 28, 46, {
			Barrel: 'Hanbit Combat-S 264mm',
			Laser: 'Schlager Visiv-5',
			Stock: 'FR4 Retractable Stock',
			'Rear Grip': 'XRK Justice II Grip'
		}),
		sprint: speed(
			'sprint',
			5,
			62,
			{
				Barrel: 'SA K556 16"',
				Stock: 'Meiko L9P-Fold',
				Laser: 'Schlager Visiv-5',
				Underbarrel: 'Mire-50 Tac Grip',
				'Rear Grip': 'XRK Justice II Grip'
			},
			3
		),
		range: reach(
			52,
			67,
			70,
			{
				Barrel: 'SA H86 465mm',
				Muzzle: 'FSS IS300',
				Ammunition: '5.56 NATO High Velocity',
				Laser: 'Schlager Visiv-5',
				Stock: 'FR4 Retractable Stock'
			},
			true
		)
	},
	m4: {
		ads: speed('ads', 39, 64, {
			Stock: 'No Stock',
			Barrel: '11.5" Shortline Barrel',
			'Rear Grip': 'ZLR Phase Grip',
			Laser: 'SZ Gen.6 PEQ'
		}),
		sprint: speed(
			'sprint',
			6,
			68,
			{
				Stock: 'No Stock',
				Barrel: 'ZLR Drift 16.5"',
				Laser: 'SZ Gen.6 PEQ',
				'Rear Grip': 'ZLR Phase Grip',
				Underbarrel: 'Mire-50 Tac Grip'
			},
			5
		),
		range: reach(
			52,
			66,
			64,
			{
				Barrel: '18" LE Crosswind',
				Muzzle: 'FSS IS300',
				Ammunition: '5.56 NATO High Velocity',
				Stock: 'No Stock',
				'Rear Grip': 'ZLR Phase Grip'
			},
			true
		)
	},
	'hyeon-burst': {
		ads: speed('ads', 30, 57, {
			'Rear Grip': 'X-Vector 799 Grip',
			Barrel: 'Mugi Nullifier 482mm',
			Laser: 'SZ Gen.6 PEQ',
			Stock: 'Hyeon Stockpad Tac'
		}),
		sprint: speed(
			'sprint',
			5,
			49,
			{
				Barrel: 'Mugi Hwando-Z3 521mm',
				Stock: 'Mugi BAL-202 Stock',
				Laser: 'SZ Gen.6 PEQ',
				'Rear Grip': 'X-Vector 799 Grip',
				Underbarrel: 'Mire-50 Tac Grip'
			},
			4
		),
		range: reach(
			50,
			67,
			67,
			{
				Barrel: 'Mugi Seungri-0P 609mm',
				Muzzle: 'FSS IS300',
				Ammunition: '6.8x43mm High Velocity',
				'Rear Grip': 'X-Vector 799 Grip',
				Laser: 'SZ Gen.6 PEQ'
			},
			true
		)
	},
	'patriot-xmr': {
		ads: speed('ads', 36, 67, { Stock: 'No Stock', Barrel: 'SO Pilot-RX 11"', 'Rear Grip': 'FJX Fury IV Grip', Laser: 'SZ Gen.6 PEQ' }),
		sprint: speed(
			'sprint',
			5,
			67,
			{
				Barrel: 'EXP Haste 80L 14',
				Stock: 'No Stock',
				Laser: 'SZ Gen.6 PEQ',
				'Rear Grip': 'FJX Fury IV Grip',
				Underbarrel: 'Mire-50 Tac Grip'
			},
			7
		),
		range: reach(
			46,
			67,
			67,
			{
				Barrel: 'EXP Raid Tac 18.5"',
				Muzzle: 'EXP Undertow Gen. 2',
				Ammunition: '7.62 NATO High Velocity',
				Stock: 'No Stock',
				'Rear Grip': 'FJX Fury IV Grip'
			},
			true
		)
	},
	'kastov-762': {
		ads: speed('ads', 35, 51, {
			Stock: 'No Stock',
			'Rear Grip': 'Mugi 00-YK1 Grip',
			Laser: 'Schlager Visiv-5',
			Barrel: 'TT 414-R Hightac'
		}),
		sprint: speed(
			'sprint',
			6,
			45,
			{
				Barrel: 'TT 414-R Hightac',
				Stock: 'Kastov Combat Lite Stock',
				Laser: 'Schlager Visiv-5',
				'Rear Grip': 'Mugi 00-YK1 Grip',
				Underbarrel: 'Mire-50 Tac Grip'
			},
			4
		),
		range: reach(
			55,
			67,
			64,
			{
				Barrel: 'BCS-K 589mm Barrel',
				Muzzle: 'Gauge-12 Mono',
				Ammunition: '7.62 Soviet High Velocity',
				Stock: 'No Stock',
				'Rear Grip': 'Mugi 00-YK1 Grip'
			},
			true
		)
	},
	oden: {
		ads: speed('ads', 27, 36, { Laser: 'Schlager Visiv-5', Barrel: 'Stonewall-12 Barrel', Stock: 'VLK NVS-32 Pad', Comb: 'KV-R98 Comb' }),
		sprint: speed(
			'sprint',
			3,
			44,
			{
				Stock: 'GL HOX-20 Stock',
				Barrel: 'Stonewall-12 Barrel',
				Laser: 'Schlager Visiv-5',
				Underbarrel: 'Mire-50 Tac Grip',
				Comb: 'KV-R98 Comb'
			},
			2
		),
		range: reach(
			54,
			67,
			61,
			{
				Barrel: 'GL Block-12',
				Muzzle: 'TV Multical-77',
				Ammunition: '12.7x55mm High Velocity',
				Laser: 'Schlager Visiv-5',
				Stock: 'VLK NVS-32 Pad'
			},
			true
		)
	},
	axion: {
		ads: speed('ads', 33, 55, {
			'Rear Grip': 'GS50 Grip',
			Barrel: 'XRK 09-RTAC Pro',
			Laser: 'Schlager Visiv-5',
			Stock: 'XRK FTR-30',
			Magazine: '20 Round Mag'
		}),
		sprint: speed(
			'sprint',
			4,
			59,
			{ Stock: 'XRK Relay 7', Barrel: 'XRK 09-RTAC Pro', Magazine: '20 Round Mag', Laser: 'Schlager Visiv-5', 'Rear Grip': 'GS50 Grip' },
			2
		),
		range: reach(
			45,
			39,
			55,
			{ Barrel: 'SA DMN-L 30"', Muzzle: 'FSS IS300', 'Rear Grip': 'GS50 Grip', Laser: 'Schlager Visiv-5', Stock: 'XRK FTR-30' },
			true
		)
	},
	'cronen-squall': {
		ads: speed('ads', 29, 65, { Barrel: 'Dawnstrike OP 16.5"', Laser: 'SZ Gen.6 PEQ', 'Rear Grip': 'Cronen SQL Grip', Comb: 'FJX C-Band' }),
		sprint: speed(
			'sprint',
			3,
			65,
			{
				Barrel: 'Cronen Eaglehawk 19"',
				Laser: 'SZ Gen.6 PEQ',
				'Rear Grip': 'Cronen SQL Grip',
				Underbarrel: 'Mire-50 Tac Grip',
				Comb: 'FJX C-Band'
			},
			2
		),
		range: reach(
			49,
			63,
			63,
			{
				Muzzle: 'Cronen Viel-68 Suppressor',
				Barrel: 'FJX Sypher 27"',
				Ammunition: '6.8 Wrath High Velocity',
				Laser: 'SZ Gen.6 PEQ',
				'Rear Grip': 'Cronen SQL Grip'
			},
			true
		)
	},
	'cronen-osprey': {
		ads: speed('ads', 29, 62, { 'Rear Grip': 'Cronen Shear-56', Laser: 'SZ Gen.6 PEQ', Barrel: 'RG5 Hark 10"', Stock: 'SPAN-10 Stock' }),
		sprint: speed(
			'sprint',
			5,
			57,
			{
				Barrel: 'GKL-700 14"',
				Stock: 'Fade Tac 9L',
				Laser: 'SZ Gen.6 PEQ',
				'Rear Grip': 'Cronen Shear-56',
				Underbarrel: 'Mire-50 Tac Grip'
			},
			3
		),
		range: reach(
			47,
			67,
			68,
			{
				Barrel: 'IO-556 Tac 18"',
				Muzzle: 'FSS IS300',
				Ammunition: '5.56 NATO High Velocity',
				'Rear Grip': 'Cronen Shear-56',
				Laser: 'SZ Gen.6 PEQ'
			},
			true
		)
	},
	'iso-nightshade': {
		ads: speed('ads', 32, 43, { Stock: 'No Stock', Barrel: 'ZLR Mag-Z 9"', Laser: 'Schlager Visiv-5', 'Rear Grip': 'Demo STP-1' }),
		sprint: speed(
			'sprint',
			5,
			43,
			{
				Barrel: 'RT Outride-X 8"',
				Stock: 'No Stock',
				Laser: 'Schlager Visiv-5',
				Underbarrel: 'Mire-50 Tac Grip',
				'Rear Grip': 'Demo STP-1'
			},
			5
		),
		range: reach(
			40,
			64,
			61,
			{
				Barrel: 'ZLR Carbon-900',
				Muzzle: 'FSS Crackdown',
				Ammunition: '9mm Parabellum High Velocity',
				Stock: 'No Stock',
				Laser: 'Schlager Visiv-5'
			},
			true
		)
	},
	'vel-46': {
		ads: speed('ads', 27, 45, {
			Laser: 'Schlager Visiv-5',
			Stock: 'VEL 46 Extended',
			Barrel: 'RV-B v2 Barrel',
			'Rear Grip': 'LM Combat Grip',
			Magazine: '30 Round Mag'
		}),
		sprint: speed(
			'sprint',
			5,
			50,
			{
				Barrel: 'RV-B v2 Barrel',
				Stock: 'EXP U-Turn Stock',
				Laser: 'Schlager Visiv-5',
				Magazine: '30 Round Mag',
				Underbarrel: 'V46 Vert-Tac'
			},
			3
		),
		range: reach(
			51,
			67,
			57,
			{
				Barrel: 'VB-46 Series 11',
				Muzzle: 'FSS Crackdown',
				Ammunition: '4.6x30mm High Velocity',
				Laser: 'Schlager Visiv-5',
				Stock: 'VEL 46 Extended'
			},
			true
		)
	},
	'wz-55-striga': {
		ads: speed('ads', 20, 44, { 'Rear Grip': 'Matuzek 532-L Grip', Laser: 'Schlager Visiv-5', Barrel: 'DS 9x18 Pro' }),
		sprint: speed(
			'sprint',
			3,
			44,
			{ Barrel: 'DS 9x18 Pro', Laser: 'Schlager Visiv-5', Underbarrel: 'Mire-50 Tac Grip', 'Rear Grip': 'Matuzek 532-L Grip' },
			2
		),
		range: reach(
			46,
			39,
			32,
			{ Barrel: 'GW Sender 500', Muzzle: 'FTAC Silent Recon', 'Rear Grip': 'Matuzek 532-L Grip', Laser: 'Schlager Visiv-5' },
			true
		)
	},
	'ppsh-41': {
		ads: speed('ads', 33, 55, { Stock: 'No Stock', Laser: 'Schlager Visiv-5', Magazine: '35 Round Mag', Barrel: 'TT Banseok-24N' }),
		sprint: speed(
			'sprint',
			6,
			55,
			{ Barrel: 'TT Banseok-24N', Stock: 'No Stock', Magazine: '35 Round Mag', Laser: 'Schlager Visiv-5', Underbarrel: 'Mire-50 Tac Grip' },
			5
		),
		range: reach(
			39,
			60,
			59,
			{
				Muzzle: 'FTAC Silent Recon',
				Barrel: 'Hanbit RDR-Tiger 50-XL',
				Ammunition: '7.62 Tokarev High Velocity',
				Stock: 'No Stock',
				Laser: 'Schlager Visiv-5'
			},
			true
		)
	},
	'x-58-nyx': {
		ads: speed('ads', 35, 20, { Stock: 'No Stock', Barrel: 'Mugi HYU-90 228mm', Laser: 'Schlager Visiv-5', 'Rear Grip': 'BOK-980' }),
		sprint: speed(
			'sprint',
			5,
			37,
			{ Barrel: 'Doksa 4F 305mm', Stock: 'No Stock', Laser: 'Schlager Visiv-5', Underbarrel: 'Mire-50 Tac Grip', 'Rear Grip': 'BOK-980' },
			5
		),
		range: reach(22, 20, 44, { Barrel: 'LX3-V 409mm', Stock: 'No Stock', Laser: 'Schlager Visiv-5', 'Rear Grip': 'BOK-980' }, true)
	},
	'csg-35': {
		ads: speed('ads', 25, 30, { Laser: 'SZ Gen.6 PEQ', 'Rear Grip': 'XRK TAC Grip', Guard: 'TA Ration-424', Stock: 'XRK Slight Stock' }),
		sprint: speed(
			'sprint',
			3,
			30,
			{
				Guard: 'TA Ration-424',
				Laser: 'SZ Gen.6 PEQ',
				Underbarrel: 'IV-M Hand Stop',
				Stock: 'XRK Slight Stock',
				'Rear Grip': 'XRK TAC Grip'
			},
			2
		),
		range: reach(
			17,
			39,
			35,
			{
				Muzzle: 'EXP Forage-Hvy',
				Ammunition: '9mm Parabellum High Velocity',
				Laser: 'SZ Gen.6 PEQ',
				'Rear Grip': 'XRK TAC Grip',
				Guard: 'TA Ration-424'
			},
			true
		)
	},
	'rezi-12': {
		ads: speed('ads', 36, 51, { Stock: 'No Stock', 'Rear Grip': 'XRK Bygone-39', Laser: 'Schlager Visiv-5', Barrel: 'ZLR L48 Siege 13"' }),
		sprint: speed(
			'sprint',
			3,
			57,
			{
				Stock: 'No Stock',
				Barrel: 'ZLR L48 Siege 13"',
				Laser: 'Schlager Visiv-5',
				'Rear Grip': 'XRK Bygone-39',
				Underbarrel: 'Mire-50 Tac Grip'
			},
			4
		),
		range: reach(
			0,
			39,
			51,
			{ Barrel: 'Haebang 635R-7', Muzzle: 'EXP Firelite 12', Stock: 'No Stock', 'Rear Grip': 'XRK Bygone-39', Laser: 'Schlager Visiv-5' },
			true
		)
	},
	warlord: {
		ads: speed('ads', 24, 37, {
			Laser: 'SZ Gen.6 PEQ',
			Stock: 'Mugi Tac-717 Stock',
			Barrel: 'Mugi Chujeok-800',
			'Rear Grip': 'DV3-Sinsok Grip'
		}),
		sprint: speed(
			'sprint',
			5,
			55,
			{
				Barrel: 'Mugi Chujeok-800',
				Stock: 'Mugi D40 Stock',
				Laser: 'SZ Gen.6 PEQ',
				Underbarrel: 'Mire-50 Tac Grip',
				'Rear Grip': 'DV3-Sinsok Grip'
			},
			4
		),
		range: reach(
			10,
			39,
			40,
			{
				Muzzle: 'Mugi Kalnal-H 12G',
				Barrel: 'NK Gangta-12G',
				Laser: 'SZ Gen.6 PEQ',
				Stock: 'Mugi Tac-717 Stock',
				'Rear Grip': 'DV3-Sinsok Grip'
			},
			true
		)
	},
	'finn-lmg': {
		ads: speed('ads', 26, 50, {
			Laser: 'SZ Gen.6 PEQ',
			Stock: 'No Stock',
			'Rear Grip': 'XRK Singularity-13',
			Magazine: '75 Round Box Mag',
			Barrel: 'FTAC MOD3-LK 15"'
		}),
		sprint: speed(
			'sprint',
			6,
			50,
			{
				Barrel: 'FTAC MOD3-LK 15"',
				Stock: 'No Stock',
				Magazine: '75 Round Box Mag',
				Laser: 'SZ Gen.6 PEQ',
				'Rear Grip': 'XRK Singularity-13'
			},
			7
		),
		range: reach(
			45,
			68,
			50,
			{
				Barrel: 'TT Seongun 508mm',
				Muzzle: 'EXP V-TAC Suppressor',
				Ammunition: '5.56 NATO High Velocity',
				Stock: 'No Stock',
				Laser: 'SZ Gen.6 PEQ'
			},
			true
		)
	},
	'type-73': {
		ads: speed('ads', 29, 27, { Stock: 'No Stock', Laser: 'Schlager Visiv-5', Barrel: 'RSS-40F 12"', 'Rear Grip': 'EXP ZBR-904' }),
		sprint: speed(
			'sprint',
			5,
			27,
			{ Barrel: 'SA Firerush 23.8"', Stock: 'No Stock', Laser: 'Schlager Visiv-5', 'Rear Grip': 'EXP ZBR-904' },
			6
		),
		range: reach(
			46,
			67,
			46,
			{
				Barrel: 'Haebang ET-9D 772mm',
				Muzzle: 'Gauge-12 Mono',
				Ammunition: '7.62x54mmR High Velocity',
				Stock: 'No Stock',
				Laser: 'Schlager Visiv-5'
			},
			true
		)
	},
	'apoc-338': {
		ads: speed('ads', 35, 51, {
			Stock: 'No Stock',
			Laser: 'SZ Gen.6 PEQ',
			Barrel: 'SA Trailpoint 16.3"',
			'Rear Grip': 'SA Winder-5 Grip',
			Magazine: '30 Round Belt'
		}),
		sprint: speed(
			'sprint',
			6,
			51,
			{
				Barrel: 'SA Slipstream 14.3"',
				Stock: 'No Stock',
				Magazine: '30 Round Belt',
				Laser: 'SZ Gen.6 PEQ',
				'Rear Grip': 'SA Winder-5 Grip'
			},
			7
		),
		range: reach(
			56,
			67,
			40,
			{
				Barrel: 'EXP .388 XL 24.5"',
				Muzzle: 'TV Multical-77',
				Ammunition: '.338 Magnum High Velocity',
				Stock: 'No Stock',
				Laser: 'SZ Gen.6 PEQ'
			},
			true
		)
	},
	'mar-9': {
		ads: speed('ads', 32, 56, {
			'Rear Grip': 'Hanbit AGRS-1 Pro',
			Laser: 'SZ Gen.6 PEQ',
			Barrel: 'Bruen Ironhide 76',
			Stock: 'LM Scout VX-9',
			Magazine: '10 Round Mag'
		}),
		sprint: speed(
			'sprint',
			4,
			66,
			{
				Stock: 'Schlager HVOX-80',
				Barrel: 'Bruen Ironhide 76',
				Magazine: '10 Round Mag',
				Laser: 'SZ Gen.6 PEQ',
				'Rear Grip': 'Hanbit AGRS-1 Pro'
			},
			2
		),
		range: reach(
			33,
			56,
			null,
			{
				Muzzle: 'EXP Undertow Gen. 2',
				Barrel: 'Bruen Reaper-X',
				Ammunition: '7.62 NATO High Velocity',
				'Rear Grip': 'Hanbit AGRS-1 Pro',
				Laser: 'SZ Gen.6 PEQ'
			},
			true
		)
	},
	'oris-8-6': {
		ads: speed('ads', 40, 15, {
			Stock: 'No Stock',
			'Rear Grip': 'OPS-45 XP Grip',
			Laser: 'Schlager Visiv-5',
			Barrel: 'EXP Ripper 7.75"',
			Magazine: '6 Round Mag'
		}),
		sprint: speed(
			'sprint',
			5,
			15,
			{ Stock: 'No Stock', Barrel: 'EXP Ripper 7.75"', Magazine: '6 Round Mag', Laser: 'Schlager Visiv-5', 'Rear Grip': 'OPS-45 XP Grip' },
			4
		),
		range: reach(
			46,
			39,
			56,
			{
				Barrel: 'EXP Crosstac 22"',
				Muzzle: 'EXP Undertow Gen. 2',
				Stock: 'No Stock',
				'Rear Grip': 'OPS-45 XP Grip',
				Laser: 'Schlager Visiv-5'
			},
			true
		)
	},
	'mosin-nagant': {
		ads: speed('ads', 37, 60, { Stock: 'Mosin Pistol Stock', Laser: 'Schlager Visiv-5', Barrel: 'Mosin S762 Barrel' }),
		sprint: speed(
			'sprint',
			7,
			41,
			{ Stock: 'Mosin Pistol Stock', Barrel: '762 Dozor Barrel', Laser: 'Schlager Visiv-5', Underbarrel: 'Mire-50 Tac Grip' },
			8
		),
		range: reach(
			54,
			67,
			49,
			{
				Barrel: 'Mosin K025 Barrel',
				Muzzle: 'FTAC Silent Recon',
				Ammunition: '7.62x54mmR High Velocity',
				Stock: 'No Stock',
				Laser: 'Schlager Visiv-5'
			},
			true
		)
	},
	'kg-7-vulcan': {
		ads: speed('ads', 27, 47, {
			Barrel: 'TT Baem 12"',
			Laser: 'Schlager Visiv-5',
			Stock: 'TT G76-RP Stock',
			Comb: 'Haebang YNC-45',
			Magazine: '6 Round Mag'
		}),
		sprint: speed(
			'sprint',
			6,
			34,
			{
				Barrel: 'Haebang Naseon v.5 26"',
				Stock: 'Hanbit RTR Mk. I',
				Magazine: '6 Round Mag',
				Laser: 'Schlager Visiv-5',
				Comb: 'Haebang YNC-45'
			},
			5
		),
		range: reach(
			46,
			68,
			71,
			{
				Barrel: 'Haebang RMT762 29"',
				Muzzle: 'TT Solgae F7',
				Ammunition: '7.62x54mmR High Velocity',
				Laser: 'Schlager Visiv-5',
				Stock: 'TT G76-RP Stock'
			},
			true
		)
	},
	'astaroth-57': {
		ads: speed('ads', 19, 6, { Laser: 'Schlager Visiv-5', Barrel: 'FTAC Crosswind 30"', Stock: 'Usenko V8-LKR' }),
		sprint: speed('sprint', 1, 6, { Barrel: 'FTAC Crosswind 30"', Laser: 'Schlager Visiv-5', Stock: 'Usenko V8-LKR' }, 1),
		range: reach(
			46,
			68,
			50,
			{
				Barrel: 'FTAC Harbinger 45"',
				Muzzle: 'Usenko 900 BL-X',
				Ammunition: '.57 Cal High Velocity',
				Laser: 'Schlager Visiv-5',
				Stock: 'Usenko V8-LKR'
			},
			true
		)
	},
	'signal-50': {
		ads: speed('ads', 27, 58, {
			'Rear Grip': 'EXP Trim-54F',
			Laser: 'Schlager Visiv-5',
			Barrel: 'S50-SB Gen.2 22"',
			Stock: 'Cronen SN-Pad50',
			Magazine: '5 Round Mag'
		}),
		sprint: speed(
			'sprint',
			5,
			58,
			{
				Barrel: 'TV Icarus 50 24.5"',
				Stock: 'Lockwood Mobile-1',
				Laser: 'Schlager Visiv-5',
				'Rear Grip': 'EXP Trim-54F',
				Magazine: '5 Round Mag'
			},
			5
		),
		range: reach(
			52,
			67,
			70,
			{
				Barrel: 'MR50 Tyrant 29"',
				Muzzle: 'FSS HOC-30',
				Ammunition: '.50 Cal High Velocity',
				'Rear Grip': 'EXP Trim-54F',
				Laser: 'Schlager Visiv-5'
			},
			true
		)
	},
	'sang-9mm': {
		ads: speed('ads', 21, 28, {
			Laser: 'DCR-78 Laser',
			Barrel: 'Hanbit SK Elite 9',
			'Rear Grip': 'XRK M-Line Grip',
			'Trigger Action': 'SANG Highmatch'
		}),
		sprint: speed(
			'sprint',
			3,
			28,
			{ Barrel: 'Hanbit SK Elite 9', Laser: 'DCR-78 Laser', 'Trigger Action': 'SANG Highmatch', 'Rear Grip': 'XRK M-Line Grip' },
			2
		),
		range: reach(
			49,
			67,
			36,
			{
				Barrel: 'TT CP-9mm Barrel',
				Muzzle: 'SFO Proto-33',
				Ammunition: '9mm Parabellum High Velocity',
				Laser: 'DCR-78 Laser',
				'Rear Grip': 'XRK M-Line Grip'
			},
			true
		)
	},
	'krait-p68': {
		ads: speed('ads', 22, 35, {
			Laser: 'Corvus Aves-3',
			'Trigger Action': 'KP68 Curve-H',
			Barrel: 'SA Omni 5.5"',
			'Rear Grip': 'Shonay R-Wrap'
		}),
		sprint: speed(
			'sprint',
			3,
			35,
			{ Barrel: 'SA Omni 5.5"', Laser: 'Corvus Aves-3', 'Trigger Action': 'KP68 Curve-H', 'Rear Grip': 'Shonay R-Wrap' },
			2
		),
		range: reach(
			44,
			39,
			35,
			{
				Barrel: 'Ballistarc GMA6 6"',
				Muzzle: 'SFO Proto-33',
				Laser: 'Corvus Aves-3',
				'Trigger Action': 'KP68 Curve-H',
				'Rear Grip': 'Shonay R-Wrap'
			},
			true
		)
	},
	'50-gs': {
		ads: speed('ads', 23, 39, {
			Barrel: 'TA Warlord',
			Laser: 'Corvus Aves-3',
			'Trigger Action': 'Schlager GS Match',
			'Rear Grip': 'TT Bulkkot Grip'
		}),
		sprint: speed(
			'sprint',
			1,
			39,
			{
				Barrel: 'TA Warlord',
				Laser: 'Corvus Aves-3',
				'Trigger Action': 'Schlager GS Match',
				Underbarrel: 'Mire-50 Tac Grip',
				'Rear Grip': 'TT Bulkkot Grip'
			},
			1
		),
		range: reach(
			58,
			67,
			47,
			{
				Barrel: 'FT Reckoner',
				Muzzle: 'FTAC HVY-S50',
				Ammunition: '.50 Pistol High Velocity',
				Laser: 'Corvus Aves-3',
				'Trigger Action': 'Schlager GS Match'
			},
			true
		)
	},
	'mojave-357': {
		ads: speed('ads', 22, 41, {
			Barrel: 'Bryson Snub 2"',
			Laser: 'Corvus Aves-3',
			'Rear Grip': 'CP37 Grip',
			'Trigger Action': 'M357 Heavy'
		}),
		sprint: speed(
			'sprint',
			3,
			41,
			{ Barrel: 'Matuzek Deputy 3.5"', Laser: 'Corvus Aves-3', 'Trigger Action': 'M357 Heavy', 'Rear Grip': 'CP37 Grip' },
			2
		),
		range: reach(
			7,
			8,
			41,
			{ Barrel: 'XRK Greywolf 7.5"', Laser: 'Corvus Aves-3', 'Rear Grip': 'CP37 Grip', 'Trigger Action': 'M357 Heavy' },
			true
		)
	}
};
