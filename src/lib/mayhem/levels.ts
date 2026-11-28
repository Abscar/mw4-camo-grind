/**
 * Abscars Madness' levels (2026-11-23, the user: "bygg massor med banor … ta mig framåt i spelet genom att döda,
 * men också lite pussel för att ta sig vidare"). Each level is a long side-scrolling stage: you fight your way to
 * the EXIT on the right. Puzzles: doors that open when an area is cleared, key cards (red / blue / yellow),
 * switches (press E or shoot them) that open doors and switch lasers off, pushable crates to climb up to ledges,
 * explosive barrels that blow up cracked walls, and pits. Checkpoints along the way.
 * Units: world px, y down, the ground at FLOOR (500). A jump reaches 150 up and ≈ 200 across.
 * Pure data, built with small helpers so the levels stay readable. Never change a level id (records use it).
 */
import type { EnemyKind } from './engine.ts';
import type { GunKind } from './guns.ts';

export const FLOOR = 500;
export type Theme = 'office' | 'diner' | 'warehouse' | 'tower' | 'depths';
export type KeyColour = 'red' | 'blue' | 'yellow';

export interface Block {
	id: string;
	x: number;
	y: number;
	w: number;
	h: number;
	kind: 'wall' | 'door' | 'cracked' | 'shelf';
	/** doors: what opens them */
	lock?: { kill: string } | { key: KeyColour } | { sw: string };
}
export interface Spawn {
	kind: EnemyKind;
	x: number;
	y?: number;
	/** the area this enemy belongs to (doors with { kill: zone } wait for it) */
	zone?: string;
	gun?: GunKind | 'none';
}
export interface Level {
	id: string;
	name: string;
	theme: Theme;
	w: number;
	/** the ground, as [from, to] stretches; the gaps between are pits */
	ground: [number, number][];
	platforms: { x: number; y: number; w: number }[];
	blocks: Block[];
	crates: { x: number; y?: number }[];
	barrels: { x: number; y?: number }[];
	lasers: { id: string; x: number; top: number; bottom?: number }[];
	switches: { id: string; x: number; y: number; opens: string[] }[];
	keys: { colour: KeyColour; x: number; y: number }[];
	guns: { kind: GunKind; x: number; y?: number }[];
	burgers: { x: number; y?: number }[];
	enemies: Spawn[];
	/** chapter 1: x lines you pass; chapter 2 also [x, y] spots you stand on */
	checkpoints: (number | [number, number])[];
	start: number;
	exit: number;
	/** chapter (default 1); each chapter's first level is open from the start */
	chapter?: 1 | 2;
	/** tall levels: the world's top edge (negative = above the usual screen) */
	top?: number;
	/** where you start / where the EXIT stands, when not on the ground */
	startY?: number;
	exitY?: number;
	/** moving platforms: go back and forth between (x, y) and (x + dx, y + dy) every `period` seconds */
	movers?: { x: number; y: number; w: number; dx: number; dy: number; period: number; phase?: number }[];
	/** jump pads (44 wide) that throw you up; power ≈ px/s up (1450 ≈ 500 px high) */
	pads?: { x: number; y?: number; power?: number }[];
	/** spikes on a surface (y = the surface, default the ground) */
	spikes?: { x: number; w: number; y?: number }[];
	/** rising sludge: climbs `speed` px/s after `delay` s; touching it kills */
	flood?: { speed: number; delay?: number };
	/** a line under the name on the level card */
	hint: string;
	/** a hidden entrance to a bonus level (2026-11-28, the user: easter eggs, "on level 3 you'd need a double jump to
	 * reach a special entrance that takes you to a bonus level you couldn't see at first"): a vent on a high ledge;
	 * (x, y) = the spot on that ledge you stand on (the ledge itself is in `platforms`), `to` = the bonus level */
	secret?: { x: number; y: number; to: string };
	/** a bonus level: not in the campaign order, opens when its secret entrance is found */
	bonus?: true;
}

// ---------- helpers ----------
const wall = (id: string, x: number, h: number, w = 26): Block => ({ id, x, y: FLOOR - h, w, h, kind: 'wall' });
const shelf = (id: string, x: number, y: number, w: number, h: number): Block => ({ id, x, y, w, h, kind: 'shelf' });
/** doors and cracked walls go from the ceiling (y 40) to the floor, so nobody jumps over them */
export const CEIL = 40;
const door = (id: string, x: number, lock: Block['lock'], ..._ignored: number[]): Block => ({ id, x, y: CEIL, w: 22, h: FLOOR - CEIL, kind: 'door', lock });
const cracked = (id: string, x: number, ..._ignored: number[]): Block => ({ id, x, y: CEIL, w: 34, h: FLOOR - CEIL, kind: 'cracked' });
const e = (kind: EnemyKind, x: number, zone?: string, y?: number, gun?: Spawn['gun']): Spawn => ({ kind, x, zone, y, gun });
const lvl = (l: Partial<Level> & Pick<Level, 'id' | 'name' | 'theme' | 'w' | 'hint'>): Level => ({
	ground: [[0, l.w]],
	platforms: [],
	blocks: [],
	crates: [],
	barrels: [],
	lasers: [],
	switches: [],
	keys: [],
	guns: [],
	burgers: [],
	enemies: [],
	checkpoints: [],
	start: 80,
	exit: l.w - 90,
	...l
});

export const LEVELS: Level[] = [
	// ===================== THE OFFICE =====================
	lvl({
		id: 'o1',
		name: 'Clock In',
		theme: 'office',
		w: 2600,
		hint: 'Fight to the exit. Clear the room and the door opens.',
		ground: [[0, 900], [1060, 2600]],
		platforms: [{ x: 520, y: 380, w: 200 }, { x: 1500, y: 382, w: 220 }],
		guns: [{ kind: 'smg', x: 300 }],
		burgers: [{ x: 1200 }],
		enemies: [e('random', 600, undefined, undefined, 'none'), e('random', 760), e('random', 1300, 'a'), e('random', 1560, 'a', 382), e('random', 1700, 'a'), e('random', 2200)],
		blocks: [door('d1', 1900, { kill: 'a' })],
		checkpoints: [1100]
	}),
	lvl({
		id: 'o2',
		name: 'Cubicle Hell',
		theme: 'office',
		w: 3000,
		hint: 'A red key card opens red doors. Look up.',
		platforms: [
			{ x: 600, y: 390, w: 160 },
			{ x: 800, y: 290, w: 180 },
			{ x: 1020, y: 190, w: 160 },
			{ x: 1700, y: 380, w: 240 }
		],
		keys: [{ colour: 'red', x: 1100, y: 150 }],
		blocks: [door('dr', 1450, { key: 'red' }), wall('w1', 2200, 60), door('d2', 2650, { kill: 'b' })],
		guns: [{ kind: 'ar', x: 250 }],
		burgers: [{ x: 1550 }],
		enemies: [e('random', 500), e('sweat', 900, undefined, 290), e('random', 1250), e('sweat', 1800, 'b', 380), e('random', 1900, 'b'), e('sweat', 2350, 'b'), e('random', 2500, 'b')],
		checkpoints: [1500]
	}),
	lvl({
		id: 'o3',
		name: 'Server Room',
		theme: 'office',
		w: 3200,
		hint: 'Lasers burn. Shoot the switch to turn them off. Crates can be pushed.',
		ground: [[0, 1300], [1450, 3200]],
		lasers: [{ id: 'l1', x: 900, top: 40 }, { id: 'l2', x: 960, top: 40 }],
		switches: [{ id: 's1', x: 1150, y: 300, opens: ['l1', 'l2'] }],
		// the secret: a vent high above the start, only a double jump reaches it (one jump ≈ 180 up, this is 250)
		platforms: [{ x: 1080, y: 330, w: 140 }, { x: 2350, y: 320, w: 200 }, { x: 300, y: 250, w: 70 }],
		secret: { x: 335, y: 250, to: 'b1' },
		crates: [{ x: 2050 }],
		keys: [{ colour: 'blue', x: 2440, y: 280 }],
		blocks: [shelf('sh', 1480, 380, 120, 120), door('db', 2750, { key: 'blue' })],
		guns: [{ kind: 'shotgun', x: 400 }],
		burgers: [{ x: 1700 }],
		enemies: [e('random', 600), e('sweat', 780), e('sweat', 1150, undefined, 330), e('shotty', 1700), e('random', 1900), e('sweat', 2450, undefined, 320), e('shotty', 2900)],
		checkpoints: [1460]
	}),
	lvl({
		id: 'o4',
		name: 'Corner Office',
		theme: 'office',
		w: 2600,
		hint: 'BOSS: the Juggernaut. Clear the office to get out.',
		platforms: [{ x: 900, y: 380, w: 220 }, { x: 1400, y: 380, w: 220 }, { x: 1150, y: 260, w: 220 }],
		burgers: [{ x: 1250, y: 260 }, { x: 700 }],
		guns: [{ kind: 'lmg', x: 500 }, { kind: 'launcher', x: 1260, y: 260 }],
		barrels: [{ x: 1050 }, { x: 1700 }],
		enemies: [e('sweat', 600), e('jugg', 1500, 'boss'), e('sweat', 1250, 'boss', 260), e('random', 1800, 'boss'), e('shotty', 1900, 'boss')],
		blocks: [door('d1', 2200, { kill: 'boss' }, FLOOR - 160, 160)],
		checkpoints: [800]
	}),
	// ===================== THE DINER =====================
	lvl({
		id: 'd1',
		name: 'Drive-Thru',
		theme: 'diner',
		w: 3000,
		hint: 'Red barrels explode. Cracked walls don’t like explosions.',
		ground: [[0, 1500], [1640, 3000]],
		barrels: [{ x: 1080 }, { x: 2280 }],
		blocks: [cracked('c1', 1120), cracked('c2', 2320, 160)],
		platforms: [{ x: 1900, y: 380, w: 200 }],
		guns: [{ kind: 'pistol', x: 250 }, { kind: 'smg', x: 1750 }],
		burgers: [{ x: 1300 }, { x: 2600 }],
		enemies: [e('random', 600), e('random', 800), e('shotty', 1350), e('random', 1450), e('sweat', 2000, undefined, 380), e('shotty', 2500), e('random', 2700)],
		checkpoints: [1660]
	}),
	lvl({
		id: 'd2',
		name: 'Grease Fire',
		theme: 'diner',
		w: 3300,
		hint: 'Push a crate under a ledge to reach higher. Keys hide up high.',
		ground: [[0, 700], [860, 1600], [1740, 3300]],
		platforms: [{ x: 1250, y: 320, w: 180 }, { x: 2200, y: 390, w: 160 }, { x: 2400, y: 290, w: 160 }],
		crates: [{ x: 1000 }],
		keys: [{ colour: 'yellow', x: 1340, y: 280 }],
		blocks: [door('dy', 1520, { key: 'yellow' }), door('d2', 2950, { kill: 'c' })],
		guns: [{ kind: 'ar', x: 400 }, { kind: 'marksman', x: 2480, y: 290 }],
		burgers: [{ x: 1900 }],
		enemies: [e('random', 500), e('shotty', 1100), e('sweat', 1500), e('sweat', 2280, 'c', 390), e('camper', 2480, 'c', 290), e('shotty', 2700, 'c'), e('random', 2800, 'c')],
		checkpoints: [880, 1760]
	}),
	lvl({
		id: 'd3',
		name: 'Walk-in Freezer',
		theme: 'diner',
		w: 3400,
		hint: 'Two switches, two laser gates. Campers watch from above.',
		lasers: [{ id: 'l1', x: 1000, top: 40 }, { id: 'l2', x: 2100, top: 40 }],
		switches: [
			{ id: 's1', x: 860, y: 240, opens: ['l1'] },
			{ id: 's2', x: 1950, y: 210, opens: ['l2'] }
		],
		platforms: [
			{ x: 650, y: 390, w: 160 },
			{ x: 800, y: 290, w: 160 },
			{ x: 1500, y: 360, w: 200 },
			{ x: 1780, y: 360, w: 120 },
			{ x: 1880, y: 260, w: 140 },
			{ x: 2600, y: 330, w: 220 }
		],
		guns: [{ kind: 'smg', x: 300 }, { kind: 'sniper', x: 1600, y: 360 }],
		burgers: [{ x: 1300 }, { x: 2400 }],
		enemies: [e('random', 600), e('camper', 880, undefined, 290), e('sweat', 1300), e('camper', 1600, undefined, 360), e('shotty', 1700), e('sweat', 2400), e('camper', 2700, undefined, 330), e('shotty', 3000)],
		checkpoints: [1100, 2200]
	}),
	lvl({
		id: 'd4',
		name: 'Burger Boss',
		theme: 'diner',
		w: 2800,
		hint: 'BOSS: two Juggernauts guard the kitchen.',
		platforms: [{ x: 700, y: 380, w: 200 }, { x: 1250, y: 300, w: 300 }, { x: 1900, y: 380, w: 200 }],
		barrels: [{ x: 1100 }, { x: 1650 }, { x: 2050 }],
		guns: [{ kind: 'launcher', x: 1400, y: 300 }, { kind: 'shotgun', x: 400 }],
		burgers: [{ x: 1000 }, { x: 1400, y: 300 }, { x: 2200 }],
		enemies: [e('shotty', 650), e('jugg', 1300, 'boss'), e('jugg', 2000, 'boss'), e('sweat', 1350, 'boss', 300), e('shotty', 1750, 'boss')],
		blocks: [door('d1', 2400, { kill: 'boss' }, FLOOR - 160, 160)],
		checkpoints: [900]
	}),
	// ===================== THE WAREHOUSE =====================
	lvl({
		id: 'w1',
		name: 'Loading Dock',
		theme: 'warehouse',
		w: 3600,
		hint: 'Three areas, three locked doors. Clear them all.',
		ground: [[0, 1150], [1300, 2500], [2650, 3600]],
		// the secret: a vent high up by the first door, a double jump from the ledge before it (220 up, 210 across); the ground is too far below (330)
		platforms: [{ x: 700, y: 390, w: 180 }, { x: 1700, y: 380, w: 200 }, { x: 1950, y: 290, w: 180 }, { x: 3000, y: 380, w: 200 }, { x: 1090, y: 170, w: 60 }],
		secret: { x: 1120, y: 170, to: 'b2' },
		blocks: [door('da', 1000, { kill: 'a' }), door('db', 2300, { kill: 'b' }), door('dc', 3300, { kill: 'c' })],
		guns: [{ kind: 'ar', x: 300 }, { kind: 'lmg', x: 2000, y: 290 }],
		burgers: [{ x: 1400 }, { x: 2750 }],
		enemies: [
			e('random', 500, 'a'), e('sweat', 760, 'a', 390), e('shotty', 900, 'a'),
			e('sweat', 1500, 'b'), e('sweat', 1780, 'b', 380), e('camper', 2020, 'b', 290), e('random', 2150, 'b'),
			e('shotty', 2800, 'c'), e('sweat', 3080, 'c', 380), e('random', 3150, 'c'), e('shotty', 3200, 'c')
		],
		checkpoints: [1320, 2680]
	}),
	lvl({
		id: 'w2',
		name: 'Forklift Alley',
		theme: 'warehouse',
		w: 3600,
		hint: 'Chain the barrels. The switch opens the gate.',
		barrels: [{ x: 900 }, { x: 960 }, { x: 2350 }],
		blocks: [cracked('c1', 1010, 160), cracked('c2', 2400, 160), door('dg', 3000, { sw: 'g' }, FLOOR - 160, 160)],
		switches: [{ id: 'g', x: 2750, y: 250, opens: ['dg'] }],
		platforms: [{ x: 1500, y: 380, w: 200 }, { x: 2600, y: 380, w: 140 }, { x: 2700, y: 290, w: 120 }],
		crates: [{ x: 1800 }],
		guns: [{ kind: 'smg', x: 300 }, { kind: 'launcher', x: 1600, y: 380 }],
		burgers: [{ x: 1300 }, { x: 2900 }],
		enemies: [e('random', 600), e('sweat', 800), e('shotty', 1200), e('sweat', 1580, undefined, 380), e('random', 1900), e('camper', 2760, undefined, 290), e('shotty', 2550), e('sweat', 3200), e('random', 3350)],
		checkpoints: [1150, 2500]
	}),
	lvl({
		id: 'w3',
		name: 'High Shelves',
		theme: 'warehouse',
		w: 3400,
		hint: 'Climb the shelves. The blue key opens the way down.',
		ground: [[0, 800], [1000, 1500], [1700, 3400]],
		platforms: [
			{ x: 820, y: 410, w: 160 },
			{ x: 1050, y: 380, w: 160 },
			{ x: 1250, y: 280, w: 160 },
			{ x: 1450, y: 190, w: 200 },
			{ x: 1700, y: 280, w: 160 },
			{ x: 2500, y: 380, w: 200 }
		],
		keys: [{ colour: 'blue', x: 1550, y: 150 }],
		lasers: [{ id: 'l1', x: 2100, top: 40 }],
		switches: [{ id: 's1', x: 2620, y: 330, opens: ['l1'] }],
		blocks: [door('db', 1950, { key: 'blue' }), door('d2', 3050, { kill: 'z' })],
		guns: [{ kind: 'marksman', x: 400 }],
		burgers: [{ x: 1300, y: 280 }, { x: 2300 }],
		enemies: [e('random', 500), e('camper', 1120, undefined, 380), e('sweat', 1320, undefined, 280), e('camper', 1560, undefined, 190), e('shotty', 1850), e('sweat', 2300, 'z'), e('camper', 2580, 'z', 380), e('shotty', 2800, 'z'), e('sweat', 2900, 'z')],
		checkpoints: [1020, 1980]
	}),
	lvl({
		id: 'w4',
		name: 'Abscar’s Last Stand',
		theme: 'warehouse',
		w: 4000,
		hint: 'FINAL BOSS. Everything you’ve learned, then three Juggernauts.',
		ground: [[0, 1200], [1340, 4000]],
		lasers: [{ id: 'l1', x: 900, top: 40 }],
		switches: [{ id: 's1', x: 700, y: 250, opens: ['l1'] }],
		barrels: [{ x: 1650 }],
		crates: [{ x: 2200 }],
		keys: [{ colour: 'red', x: 2560, y: 280 }],
		platforms: [{ x: 450, y: 400, w: 140 }, { x: 600, y: 300, w: 160 }, { x: 2450, y: 320, w: 200 }, { x: 3200, y: 380, w: 240 }, { x: 3500, y: 290, w: 220 }],
		blocks: [cracked('c1', 1700, 160), door('dr', 2900, { key: 'red' }), door('dz', 3850, { kill: 'boss' }, FLOOR - 160, 160)],
		guns: [{ kind: 'ar', x: 300 }, { kind: 'launcher', x: 2000 }, { kind: 'lmg', x: 3300, y: 380 }],
		burgers: [{ x: 1500 }, { x: 2700 }, { x: 3600, y: 290 }],
		enemies: [
			e('sweat', 500), e('camper', 680, undefined, 300), e('shotty', 1100),
			e('sweat', 1900), e('random', 2100), e('sweat', 2550, undefined, 320),
			e('jugg', 3150, 'boss'), e('jugg', 3450, 'boss'), e('jugg', 3700, 'boss'), e('camper', 3600, 'boss', 290), e('shotty', 3300, 'boss')
		],
		checkpoints: [1360, 3000]
	}),

	// ===================== CHAPTER 2: GOING VERTICAL =====================
	// (2026-11-23, the user: "banorna är väldigt enformiga, bara från vänster till höger … fler banor där man använder
	// movement … uppåt eller neråt … mer fantasi"). Gaps that need the double jump and the dash, moving platforms,
	// jump pads, wall-jump shafts, climbs up a tower, a fall down into the depths, rising sludge.
	// Reach (measured on the engine, scripts/madness-levels.test.js): one jump ≈ 180 up / 240 across, the double
	// jump ≈ 300 up / 390 across, double jump + dash ≈ 550 across. The levels stay well inside those.
	lvl({
		id: 'v1',
		chapter: 2,
		name: 'Double Trouble',
		theme: 'tower',
		w: 3200,
		hint: 'Too wide for one jump? Jump again in the air.',
		ground: [[0, 700], [960, 1500], [1800, 2300], [2620, 3200]],
		platforms: [{ x: 1220, y: 380, w: 160 }, { x: 2020, y: 370, w: 180 }, { x: 2700, y: 360, w: 160 }],
		spikes: [{ x: 1080, w: 90 }],
		guns: [{ kind: 'smg', x: 300 }],
		burgers: [{ x: 1900 }],
		enemies: [e('random', 520), e('sweat', 1300, undefined, 380), e('random', 1420), e('sweat', 2100, undefined, 370), e('shotty', 2250), e('random', 2780, 'a', 360), e('sweat', 2850, 'a')],
		blocks: [door('d1', 2980, { kill: 'a' })],
		checkpoints: [980, 1820, 2640]
	}),
	lvl({
		id: 'v2',
		chapter: 2,
		name: 'Mind the Gap',
		theme: 'tower',
		w: 3600,
		hint: 'Jump, jump again, then dash (C) to fly across. Moving platforms carry you.',
		ground: [[0, 600], [1040, 1500], [1950, 2300], [2800, 3600]],
		movers: [
			{ x: 1505, y: 420, w: 120, dx: 325, dy: 0, period: 4.5 },
			{ x: 2490, y: 450, w: 120, dx: 0, dy: -150, period: 3 }
		],
		spikes: [{ x: 1200, w: 100 }, { x: 3000, w: 120 }],
		platforms: [{ x: 1320, y: 380, w: 160 }, { x: 3150, y: 370, w: 200 }],
		guns: [{ kind: 'ar', x: 300 }],
		burgers: [{ x: 2100 }],
		enemies: [e('random', 450), e('sweat', 1100), e('camper', 1400, undefined, 380), e('random', 2100), e('shotty', 2200), e('sweat', 2900), e('sweat', 3250, undefined, 370), e('shotty', 3400)],
		checkpoints: [1060, 1970, 2820]
	}),
	lvl({
		id: 'v3',
		chapter: 2,
		name: 'The Climb',
		theme: 'tower',
		w: 1400,
		top: -1700,
		hint: 'Up is the way out. Springs throw you high.',
		exit: 1220,
		exitY: -1420,
		platforms: [
			{ x: 300, y: 380, w: 200 },
			{ x: 620, y: 260, w: 180 },
			{ x: 300, y: 140, w: 200 },
			{ x: 380, y: -200, w: 220 },
			{ x: 760, y: -330, w: 200 },
			{ x: 1180, y: -450, w: 200 },
			{ x: 820, y: -590, w: 180 },
			{ x: 450, y: -720, w: 200 },
			{ x: 120, y: -860, w: 200 },
			{ x: 260, y: -1280, w: 240 },
			{ x: 640, y: -1420, w: 760 }
		],
		pads: [{ x: 330, y: 140, power: 1350 }, { x: 150, y: -860, power: 1500 }],
		guns: [{ kind: 'smg', x: 180 }],
		burgers: [{ x: 900, y: -590 }, { x: 380, y: -1280 }],
		enemies: [
			e('random', 700, undefined, 260),
			e('sweat', 880, undefined, -330),
			e('camper', 1250, undefined, -450),
			e('sweat', 560, undefined, -720),
			e('random', 440, undefined, -1280),
			e('sweat', 900, undefined, -1420),
			e('camper', 1300, undefined, -1420)
		],
		checkpoints: [[480, -200], [860, -330], [550, -720], [360, -1280]]
	}),
	lvl({
		id: 'v4',
		chapter: 2,
		name: 'Elevator Shaft',
		theme: 'tower',
		w: 1500,
		top: -1900,
		hint: 'Ride the lifts. Jump from wall to wall to climb the shaft.',
		exit: 1300,
		exitY: -1700,
		movers: [
			{ x: 400, y: 470, w: 140, dx: 0, dy: -560, period: 7 },
			{ x: 300, y: -1000, w: 140, dx: 0, dy: -500, period: 6 }
		],
		platforms: [
			{ x: 545, y: -90, w: 475 },
			{ x: 560, y: -960, w: 300 },
			{ x: 0, y: -1540, w: 295 },
			{ x: 480, y: -1620, w: 200 },
			{ x: 880, y: -1700, w: 620 }
		],
		blocks: [
			// the shaft: walk in under the left wall, then wall-jump up between the two
			{ id: 'sl', x: 860, y: -900, w: 40, h: 710, kind: 'wall' },
			{ id: 'sr', x: 1020, y: -1040, w: 40, h: 950, kind: 'wall' }
		],
		spikes: [{ x: 700, w: 60, y: -960 }],
		guns: [{ kind: 'ar', x: 200 }],
		burgers: [{ x: 640, y: -960 }, { x: 1000, y: -1700 }],
		enemies: [
			e('random', 900),
			e('sweat', 760, undefined, -90),
			e('camper', 600, undefined, -960),
			e('sweat', 150, undefined, -1540),
			e('random', 580, undefined, -1620),
			e('shotty', 1100, undefined, -1700),
			e('sweat', 1250, undefined, -1700)
		],
		checkpoints: [[660, -90], [620, -960], [100, -1540]]
	}),
	lvl({
		id: 'v5',
		chapter: 2,
		name: 'Free Fall',
		theme: 'depths',
		w: 1600,
		top: -1800,
		startY: -1500,
		hint: 'Down is the way out. Press S on a ledge to drop. Shoot the barrel on the cracked floor.',
		ground: [[0, 600], [800, 1600]],
		platforms: [
			{ x: 0, y: -1500, w: 500 },
			{ x: 600, y: -1380, w: 200 },
			{ x: 900, y: -1250, w: 240 },
			{ x: 1200, y: -860, w: 200 },
			{ x: 800, y: -760, w: 240 },
			{ x: 350, y: -640, w: 240 },
			{ x: 150, y: -300, w: 260 },
			{ x: 500, y: -140, w: 200 },
			{ x: 850, y: 40, w: 220 },
			{ x: 1150, y: 220, w: 200 }
		],
		blocks: [
			// floor 1: a cracked patch in a solid slab
			{ id: 'f1a', x: 0, y: -1000, w: 1100, h: 30, kind: 'wall' },
			{ id: 'c1', x: 1100, y: -1000, w: 160, h: 30, kind: 'cracked' },
			{ id: 'f1b', x: 1260, y: -1000, w: 340, h: 30, kind: 'wall' },
			// floor 2: a hatch that opens when the floor above it is cleared
			{ id: 'f2a', x: 0, y: -500, w: 200, h: 26, kind: 'wall' },
			{ id: 'h1', x: 200, y: -500, w: 160, h: 26, kind: 'door', lock: { kill: 'b' } },
			{ id: 'f2b', x: 360, y: -500, w: 1240, h: 26, kind: 'wall' }
		],
		barrels: [{ x: 1060, y: -1000 }],
		spikes: [{ x: 1000, w: 140 }],
		guns: [{ kind: 'shotgun', x: 300, y: -1500 }],
		burgers: [{ x: 700, y: -1380 }, { x: 600, y: -140 }],
		enemies: [
			e('random', 1000, undefined, -1250),
			e('sweat', 1300, 'b', -860),
			e('random', 900, 'b', -760),
			e('shotty', 460, 'b', -640),
			e('sweat', 270, undefined, -300),
			e('camper', 950, undefined, 40),
			e('sweat', 1250),
			e('shotty', 1400)
		],
		checkpoints: [[1000, -1250], [450, -640], [280, -300]]
	}),
	lvl({
		id: 'v6',
		chapter: 2,
		name: 'Slam Dunk',
		theme: 'depths',
		w: 3400,
		hint: 'Ground slam (S in the air) knocks everyone flat. Don’t touch the spikes.',
		spikes: [{ x: 500, w: 200 }, { x: 1320, w: 280 }, { x: 2200, w: 360 }],
		movers: [{ x: 2190, y: 400, w: 120, dx: 260, dy: 0, period: 4 }],
		pads: [{ x: 880 }],
		platforms: [{ x: 980, y: 150, w: 300 }, { x: 1750, y: 380, w: 180 }],
		barrels: [{ x: 2640 }],
		blocks: [cracked('c1', 2700), door('d1', 3150, { kill: 'z' })],
		guns: [{ kind: 'pistol', x: 250 }, { kind: 'shotgun', x: 1200, y: 150 }],
		burgers: [{ x: 1080, y: 150 }, { x: 2000 }],
		enemies: [
			e('random', 1000),
			e('random', 1060),
			e('random', 1120),
			e('sweat', 1700),
			e('camper', 1840, undefined, 380),
			e('shotty', 1950),
			e('jugg', 2950, 'z'),
			e('sweat', 3050, 'z')
		],
		checkpoints: [800, 1680, 2620]
	}),
	lvl({
		id: 'v7',
		chapter: 2,
		name: 'Rising Sludge',
		theme: 'depths',
		w: 1300,
		top: -2000,
		hint: 'The sludge is rising. Climb, and don’t stop.',
		exit: 1150,
		exitY: -1750,
		flood: { speed: 42, delay: 4 },
		movers: [{ x: 70, y: -500, w: 150, dx: 0, dy: -400, period: 5 }],
		pads: [{ x: 980, y: 140, power: 1400 }],
		platforms: [
			{ x: 250, y: 380, w: 200 },
			{ x: 550, y: 260, w: 200 },
			{ x: 850, y: 140, w: 200 },
			{ x: 900, y: -200, w: 250 },
			{ x: 560, y: -330, w: 200 },
			{ x: 220, y: -460, w: 200 },
			{ x: 240, y: -960, w: 200 },
			{ x: 560, y: -1080, w: 200 },
			{ x: 900, y: -1200, w: 250 },
			{ x: 520, y: -1440, w: 200 },
			{ x: 160, y: -1560, w: 220 },
			{ x: 450, y: -1750, w: 850 }
		],
		guns: [{ kind: 'smg', x: 150 }],
		burgers: [{ x: 1050, y: -200 }, { x: 1000, y: -1200 }],
		enemies: [
			e('random', 650, undefined, 260),
			e('sweat', 640, undefined, -330),
			e('camper', 660, undefined, -1080),
			e('random', 600, undefined, -1440),
			e('sweat', 900, undefined, -1750)
		],
		checkpoints: [[1000, -200], [320, -960], [1000, -1200]]
	}),
	lvl({
		id: 'v8',
		chapter: 2,
		name: 'Penthouse',
		theme: 'tower',
		w: 2200,
		top: -1500,
		hint: 'BOSS: climb the tower. Two Juggernauts own the roof.',
		exit: 2090,
		exitY: -1200,
		pads: [{ x: 120, power: 1550 }],
		movers: [{ x: 505, y: -1000, w: 140, dx: 400, dy: -150, period: 5 }],
		platforms: [
			{ x: 150, y: 0, w: 450 },
			{ x: 150, y: -820, w: 240 },
			{ x: 300, y: -960, w: 200 },
			{ x: 1050, y: -1200, w: 1150 },
			{ x: 1600, y: -1330, w: 180 }
		],
		blocks: [
			// the shaft up the side of the tower
			{ id: 'sl', x: 440, y: -760, w: 40, h: 660, kind: 'wall' },
			{ id: 'sr', x: 600, y: -860, w: 40, h: 860, kind: 'wall' },
			{ id: 'd1', x: 1980, y: -1460, w: 22, h: 260, kind: 'door', lock: { kill: 'boss' } }
		],
		barrels: [{ x: 1420, y: -1200 }],
		guns: [{ kind: 'lmg', x: 900 }, { kind: 'launcher', x: 1680, y: -1330 }],
		burgers: [{ x: 250, y: -820 }, { x: 1150, y: -1200 }],
		enemies: [
			e('random', 900),
			e('sweat', 1200),
			e('sweat', 1300, 'boss', -1200),
			e('jugg', 1550, 'boss', -1200),
			e('jugg', 1850, 'boss', -1200),
			e('camper', 1700, 'boss', -1330)
		],
		checkpoints: [[300, 0], [250, -820], [1150, -1200]]
	})
];

/** the bonus levels behind the secret entrances: short, silly, full of loot. Never change an id (records use it). */
export const BONUS: Level[] = [
	lvl({
		id: 'b1',
		name: 'The Burger Vault',
		theme: 'diner',
		w: 2400,
		bonus: true,
		hint: 'SECRET: Abscar’s hidden burger vault. Big guns, bigger barrels. Go nuts.',
		platforms: [{ x: 500, y: 380, w: 200 }, { x: 900, y: 300, w: 220 }, { x: 1400, y: 380, w: 200 }, { x: 1700, y: 290, w: 200 }],
		guns: [{ kind: 'launcher', x: 250 }, { kind: 'lmg', x: 1000, y: 300 }, { kind: 'shotgun', x: 1500, y: 380 }],
		burgers: [{ x: 600, y: 380 }, { x: 1010, y: 300 }, { x: 1300 }, { x: 1800, y: 290 }, { x: 2000 }],
		barrels: [{ x: 760 }, { x: 800 }, { x: 1250 }, { x: 1290 }, { x: 1950 }],
		enemies: [e('random', 650), e('random', 820), e('shotty', 1000, undefined, 300), e('random', 1200), e('random', 1330), e('sweat', 1500, undefined, 380), e('shotty', 1800, undefined, 290), e('random', 1900), e('random', 2050)],
		checkpoints: [1150]
	}),
	lvl({
		id: 'b2',
		name: 'Holk Heaven',
		theme: 'warehouse',
		w: 2600,
		bonus: true,
		hint: 'SECRET: a party in the rafters. Springs, barrels and a rocket launcher.',
		ground: [[0, 1100], [1300, 2600]],
		pads: [{ x: 800 }, { x: 1700 }],
		platforms: [{ x: 700, y: 200, w: 220 }, { x: 1000, y: 150, w: 260 }, { x: 1600, y: 210, w: 240 }, { x: 2000, y: 340, w: 200 }],
		guns: [{ kind: 'launcher', x: 300 }, { kind: 'sniper', x: 1100, y: 150 }],
		burgers: [{ x: 800, y: 200 }, { x: 1150, y: 150 }, { x: 1700, y: 210 }, { x: 2100, y: 340 }],
		barrels: [{ x: 1450 }, { x: 1490 }, { x: 2300 }],
		enemies: [e('random', 600), e('camper', 820, undefined, 200), e('sweat', 1150, undefined, 150), e('random', 1450), e('shotty', 1550), e('camper', 1720, undefined, 210), e('sweat', 2100, undefined, 340), e('random', 2350)],
		checkpoints: [1320]
	})
];
/** every level, campaign and bonus */
export const ALL_LEVELS = [...LEVELS, ...BONUS];
export const LEVEL_BY_ID = new Map(ALL_LEVELS.map((l) => [l.id, l]));
/** the campaign level that hides a bonus level's entrance */
export const secretOf = (bonusId: string) => LEVELS.find((l) => l.secret?.to === bonusId) ?? null;

/** Per-level record on this device: cleared, everyone killed, no deaths, best time (s). */
export interface LevelRecord {
	clear?: 1;
	all?: 1;
	clean?: 1;
	best?: number;
}
export const pointsOf = (r: LevelRecord | undefined) => (r?.clear ? 2 : 0) + (r?.all ? 1 : 0) + (r?.clean ? 1 : 0);
/** A level is open when it starts its chapter or the one before it is cleared. */
export const levelOpen = (i: number, rec: Record<string, LevelRecord>) =>
	i === 0 || (LEVELS[i - 1].chapter ?? 1) !== (LEVELS[i]?.chapter ?? 1) || !!rec[LEVELS[i - 1].id]?.clear;
/** the chapter a level belongs to */
export const chapterOf = (l: Level) => l.chapter ?? 1;
export const CHAPTERS = [
	{ n: 1, name: 'Clocking In' },
	{ n: 2, name: 'Going Vertical' }
] as const;
