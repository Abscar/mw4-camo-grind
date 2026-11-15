/*
	Hardcore builds for Multiplayer (2026-11-15, the user's ask: "we need Hardcore metas in multiplayer,
	put them at the top next to the normal meta, those are the 2 we'll use most"). Nobody publishes MW4
	Hardcore builds on the web: codmunity.gg has a "Hardcore · One-Shot Kill / Two-Shot Kill" build per
	gun, but only in its app (its weapon pages name them, the parts sit behind its /api/, which its
	robots.txt bars). So these are typed in from the user's own screenshots of codmunity's phone app
	(15 Nov 2026, 25 guns in two batches), parts, loadout codes and the weapon level needed exactly as the app showed them.

	Which kind each gun has (one per gun) is on codmunity's public weapon pages, and every screenshot
	matches it. On twelve screenshots (Kastov 762, Cronen Osprey, Han 86, Axion, Type 73, Oden, Mojave .357, Oris 8.6,
	Mosin-Nagant, SANG 9mm, Apoc-338, FiNN LMG) the selected tab
	wasn't in view; their codes match none of codmunity's published subclasses and each gun has exactly
	one Hardcore build there, so they are taken as that one. The Patriot XMR's code was cut off.

	codmunity's pages say "Not Recommended for Hardcore" for the KG-7 Vulcan, Astaroth .57 and Signal 50
	(HARDCORE_NO). Not here yet (not sent): Cronen Squall, PPSh-41; add them the same way. Codes are the
	game's own: copy them exactly, never make one up.
*/
import { build, type Loadout } from './loadouts.ts';

export type HardcoreKind = 'one' | 'two';
export interface HardcoreBuild {
	kind: HardcoreKind;
	build: Loadout;
	/** The game's loadout code as the app shows it (absent when the screenshot cut it off). */
	code?: string;
}

export const HARDCORE_SOURCE = 'codmunity app (screenshots)';
export const HARDCORE_READ = '2026-11-15';

const ONE = 'One-Shot Kill';
const TWO = 'Two-Shot Kill';
const level = (n: number) => `Needs weapon level ${n}.`;
const hc = (kind: HardcoreKind, parts: Parameters<typeof build>[3], code?: string, note?: string): HardcoreBuild => ({
	kind,
	build: build(kind === 'one' ? ONE : TWO, HARDCORE_SOURCE, HARDCORE_READ, parts, note ? { note } : {}),
	...(code ? { code } : {})
});

export const HARDCORE_BUILDS: Record<string, HardcoreBuild[]> = {
	// ---------- Assault Rifles ----------
	'han-86': [
		hc('one', { Muzzle: 'FSS IS300', Barrel: 'SA H86 465mm', Optic: 'ZLR Type C', Stock: 'FR4 Retractable Stock', Underbarrel: 'FSS Tac90 Grip' }, 'A03-AV1RP-D9911-1', level(68))
	],
	m4: [
		hc('one', { Muzzle: 'FSS IS300', Barrel: '18" LE Crosswind', Optic: 'ZLR Type C', Stock: 'Demo Dozer Stock', 'Rear Grip': 'Schlager STB Grip' }, 'A05-AUY91-P9M71-1', level(52))
	],
	'hyeon-burst': [
		hc('one', { Muzzle: 'FSS IS40', Barrel: 'Mugi Hwando-Z3 521mm', Laser: 'SA Laz-500', Optic: 'ZLR Type C', Underbarrel: 'FSS Tac90 Grip' }, 'A09-B19PM-PWQ91-1')
	],
	'patriot-xmr': [
		hc(
			'one',
			{ Muzzle: 'Meiko 30CAL-SP', Laser: 'SA Laz-500', Optic: 'ZLR Type C', Ammunition: '7.62 NATO High Velocity', Underbarrel: 'FSS Tac90 Grip', Apex: 'Patriot XMR Volt' },
			undefined
		)
	],
	'kastov-762': [
		hc(
			'one',
			{ Muzzle: 'Gauge-12 Mono', Laser: 'XRK Clutch-LS', Stock: 'Hanbit 655L-M Stock', Ammunition: '7.62 Soviet High Velocity', Underbarrel: 'FSS Tac90 Grip', Apex: 'Kastov ARC' },
			'A01-3K9YA-VIYV9-KM11',
			'Need an optic? Swap out the laser.'
		)
	],
	oden: [
		hc('one', { Muzzle: 'VLK SH-S12', Laser: 'XRK Clutch-LS', Optic: 'ZLR Type C', Ammunition: '12.7x55mm High Velocity', Underbarrel: 'FSS Tac90 Grip' }, 'B01-3KCCK-5AL23-CS11', level(61))
	],
	axion: [
		hc('one', { Muzzle: 'FSS IS300', Laser: 'XRK Clutch-LS', Optic: 'ZLR Type C', Stock: 'XRK FTR-30', Underbarrel: 'FSS Tac90 Grip' }, 'A04-B19PJ-K7QY1-1', level(51))
	],
	'cronen-osprey': [
		hc(
			'one',
			{ Muzzle: 'FSS IS40', Laser: 'SA Laz-500', Optic: 'ZLR Type C', Ammunition: '5.56 NATO High Velocity', Underbarrel: 'FSS Tac90 Grip', Apex: 'Cronen Helix Mk.II' },
			'A02-3KA95-TI247-BF11'
		)
	],
	// ---------- SMGs ----------
	'iso-nightshade': [
		hc('two', { Muzzle: 'DEMO Ironshade', Laser: 'XRK Clutch-LS', Optic: 'ZLR Type C', Ammunition: '9mm Parabellum High Velocity', Underbarrel: 'FSS Tac90 Grip' }, 'S06-3KA95-TI247-BD11', level(61))
	],
	'vel-46': [
		hc('two', { Muzzle: 'DEMO Ironshade', Laser: 'XRK Clutch-LS', Optic: 'ZLR Type C', Ammunition: '4.6x30mm High Velocity', Underbarrel: 'FSS Tac90 Grip' }, 'S03-3KA95-TI247-BD11', level(57))
	],
	'wz-55-striga': [
		hc('one', { Muzzle: 'FTAC Silent Recon', Barrel: 'GW Sender 500', Laser: 'XRK Clutch-LS', Optic: 'ZLR Type C', Stock: 'EXP Calvary II Stock' }, 'S04-B16X1-KM551-1', level(48))
	],
	'x-58-nyx': [
		hc('one', { Barrel: 'LX3-V 409mm', Laser: 'XRK Clutch-LS', Optic: 'ZLR Type C', Stock: 'No Stock', Underbarrel: 'FSS Tac90 Grip' }, 'S08-B19PD-ASEF1-1', level(44))
	],
	'csg-35': [
		hc('two', { Muzzle: 'EXP Forage-LGT', Laser: 'SA Laz-500', Optic: 'Z-Dot 9', Stock: 'RASH-90 Heavy Stock', Ammunition: '9mm Parabellum High Velocity' }, 'S01-32TUX-1JXPG-7H11', level(40))
	],
	// ---------- Shotguns ----------
	'rezi-12': [
		hc(
			'one',
			{ Muzzle: 'EXP Firelite 12', Barrel: 'Haebang 635R-7', Laser: 'Expedite Squad-304', Bolt: 'ZLR Competition-B6', Stock: 'No Stock' },
			'C03-E6M8K-CG711',
			'Need an optic? Swap out the bolt.'
		)
	],
	warlord: [
		hc(
			'one',
			{ Muzzle: 'Mugi Kalnal-H 12G', Barrel: 'NK Gangta-12G', Bolt: 'L-Strike Bolt', Stock: 'Mugi Tac-717 Stock', Underbarrel: 'Mire-50 Tac Grip', Apex: 'Warlord Lumen' },
			'C04-3SKJY-9J71'
		)
	],
	// ---------- LMGs ----------
	'type-73': [
		hc(
			'one',
			{ Muzzle: 'Ivanov QR600', Laser: 'XRK Clutch-LS', Optic: 'SZ SRE-7', Stock: 'No Stock', Underbarrel: 'Bruen Renegade Grip', Apex: 'Type 73 Assault' },
			'L04-KV92U-8KD71-1'
		)
	],
	'finn-lmg': [
		hc('one', { Muzzle: 'XRK Mil-Tac Suppressor', Laser: 'SA Laz-500', Optic: 'ZLR Type C', Stock: 'No Stock', Underbarrel: 'Bruen Renegade Grip' }, 'L03-B1B3W-PPYD1-1', level(51))
	],
	'apoc-338': [
		hc('one', { Muzzle: 'EXP 450 RTL', Laser: 'SA Laz-500', Optic: 'ZLR Type C', Stock: 'No Stock', Underbarrel: 'Bruen Renegade Grip' }, 'L02-B1CH1-ZF4S1-1', level(33))
	],
	// ---------- Marksman Rifles ----------
	'mar-9': [
		hc(
			'one',
			{ Muzzle: 'Meiko 30CAL-SP', Laser: 'SA Laz-500', Ammunition: '7.62 NATO High Velocity', Underbarrel: 'FSS Tac90 Grip', 'Trigger Action': 'Mil-56.9 Heavy Trigger' },
			'M02-3K9YA-VIXDE-9D11',
			'Need an optic? Swap out the trigger action.'
		)
	],
	'oris-8-6': [
		hc('one', { Muzzle: 'EXP Undertow Gen. 2', Laser: 'XRK Clutch-LS', Optic: 'KV Corsac Holo', Stock: 'No Stock', Underbarrel: 'FSS Tac90 Grip' }, 'M01-21MLL-UL7CJ-11', level(68))
	],
	'mosin-nagant': [
		hc(
			'one',
			{ Muzzle: '330TC2 Gridlock', Barrel: '762 Dozor Barrel', Laser: 'XRK Clutch-LS', Bolt: 'TV-Light 7-Bolt', Stock: 'No Stock' },
			'M03-6982I-2P711',
			'Need an optic? Swap out the stock.'
		)
	],
	// ---------- Pistols ----------
	'sang-9mm': [
		hc(
			'one',
			{ Muzzle: 'SFO Proto-33', Barrel: 'TT CP-9mm Barrel', Optic: 'Z-Dot 9', Ammunition: '9mm Parabellum High Velocity', 'Trigger Action': 'SANG Highmatch', Apex: 'SANG Breach' },
			'P04-3KA8Z-LYHGD-RY11'
		)
	],
	'krait-p68': [
		hc('one', { Muzzle: 'SFO Proto-33', Barrel: 'Ballistarc GMA6 6"', Optic: 'Z-Dot 9', 'Rear Grip': 'MAGTAC .45', 'Trigger Action': 'P68 Tapper 9' }, 'P03-AV21E-YRD51-1', level(33))
	],
	'50-gs': [
		hc(
			'one',
			{ Muzzle: 'FTAC HVY-S50', Laser: 'GW 700-V', Optic: 'Z-Dot 9', 'Rear Grip': 'TT Iron Guard Kit', Ammunition: '.50 Pistol High Velocity' },
			'P02-3KBJG-Z1N8F-N511',
			`${level(47)} The TT Iron Guard Kit is an event reward, not a level unlock, so you may not have it yet.`
		)
	],
	'mojave-357': [
		hc(
			'one',
			{ Muzzle: 'Mojave Flash', Barrel: 'XRK Greywolf 7.5"', Laser: 'GW 700-V', Cylinder: 'Mojave Speed Cylinder', 'Trigger Action': 'M357 Light' },
			'P07-6BQKH-3BL11',
			'Need an optic? Swap out the laser.'
		)
	]
};

/** codmunity's weapon pages: "Not Recommended for Hardcore" (read 14 Nov 2026). */
export const HARDCORE_NO = ['kg-7-vulcan', 'astaroth-57', 'signal-50'];
