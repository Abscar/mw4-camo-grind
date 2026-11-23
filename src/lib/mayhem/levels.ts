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
export type Theme = 'office' | 'diner' | 'warehouse';
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
	checkpoints: number[];
	start: number;
	exit: number;
	/** a line under the name on the level card */
	hint: string;
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
		platforms: [{ x: 1080, y: 330, w: 140 }, { x: 2350, y: 320, w: 200 }],
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
		platforms: [{ x: 700, y: 390, w: 180 }, { x: 1700, y: 380, w: 200 }, { x: 1950, y: 290, w: 180 }, { x: 3000, y: 380, w: 200 }],
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
	})
];

export const LEVEL_BY_ID = new Map(LEVELS.map((l) => [l.id, l]));

/** Per-level record on this device: cleared, everyone killed, no deaths, best time (s). */
export interface LevelRecord {
	clear?: 1;
	all?: 1;
	clean?: 1;
	best?: number;
}
export const pointsOf = (r: LevelRecord | undefined) => (r?.clear ? 2 : 0) + (r?.all ? 1 : 0) + (r?.clean ? 1 : 0);
/** A level is open when it's the first or the one before it is cleared. */
export const levelOpen = (i: number, rec: Record<string, LevelRecord>) => i === 0 || !!rec[LEVELS[i - 1].id]?.clear;
