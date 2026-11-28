/**
 * The casino floor seen from above (2026-11-28, the user: "lobbyn till så man ser den ovanifrån. Typ som man ser på
 * gamla Pokémon-spel … en stor lobby och visualisera kasino-lobbyn"). Our own top-down map in the old handheld-RPG
 * style (not any game's map or tiles): every casino game has its place on the floor (slot machine rows, the
 * roulette and blackjack tables, the Case Battles crates, the bank counter, the donation jar, Abscar's back office),
 * the lobby with its fountain in the middle, and a corridor of hideout doors (one per squad member who owns one).
 * Each player stands at the place they're at (hangout.ts `w`) and walks there when it changes.
 *
 * Map units: MAP_W × MAP_H, feet positions. Pure, tested in scripts/floor-map.test.js.
 */

export const MAP_W = 320;
export const MAP_H = 176;
export const SLOT_GAMES = ['slots', 'fortune2', 'book', 'kushburst', 'stash', 'skeddwood'] as const;
export type SlotGame = (typeof SLOT_GAMES)[number];
export const isSlot = (g: string): g is SlotGame => (SLOT_GAMES as readonly string[]).includes(g);

export type ZoneKind = 'slot' | 'roulette' | 'blackjack' | 'cases' | 'bank' | 'donate' | 'admin' | 'lobby' | 'hideout';
export interface Zone {
	/** The casino game id it stands for (what a tap on it opens), or 'lobby' / 'hideout'. */
	id: string;
	kind: ZoneKind;
	/** The area it covers (map units). */
	x: number;
	y: number;
	w: number;
	h: number;
	/** Where people stand (feet). */
	seats: [number, number][];
	/** Its colour on the map (marquee lights, table felt). */
	color: string;
}

/** A row of three slot cabinets: x = left edge, y = cabinet top. */
function island(id: SlotGame, x: number, y: number, color: string): Zone {
	return { id, kind: 'slot', x, y, w: 46, h: 30, color, seats: [0, 1, 2].map((i) => [x + 7 + i * 16, y + 37] as [number, number]) };
}

export const ZONES: readonly Zone[] = [
	island('slots', 14, 26, '#ff4a3d'),
	island('fortune2', 68, 26, '#43d35e'),
	island('book', 122, 26, '#e0b83a'),
	island('kushburst', 14, 74, '#ff4fd8'),
	island('stash', 68, 74, '#a560ff'),
	island('skeddwood', 122, 74, '#e08a3a'),
	{ id: 'roulette', kind: 'roulette', x: 186, y: 24, w: 58, h: 38, color: '#1f8a4a', seats: [[190, 64], [204, 70], [218, 72], [232, 70], [246, 64]] },
	{ id: 'blackjack', kind: 'blackjack', x: 258, y: 24, w: 54, h: 34, color: '#167a6a', seats: [[262, 62], [274, 68], [286, 70], [298, 68], [310, 62]] },
	{ id: 'cases', kind: 'cases', x: 186, y: 86, w: 58, h: 30, color: '#e0a03a', seats: [[194, 122], [208, 124], [222, 124], [236, 122]] },
	{ id: 'bank', kind: 'bank', x: 258, y: 86, w: 54, h: 24, color: '#3a7bd5', seats: [[266, 120], [280, 122], [294, 122], [306, 120]] },
	{ id: 'donate', kind: 'donate', x: 284, y: 132, w: 28, h: 26, color: '#ff5c9a', seats: [[280, 162], [296, 164]] },
	{ id: 'admin', kind: 'admin', x: 286, y: 2, w: 26, h: 18, color: '#ff3030', seats: [[299, 22]] },
	{ id: 'lobby', kind: 'lobby', x: 172, y: 128, w: 96, h: 40, color: '#5ff0ff', seats: [[184, 146], [194, 162], [256, 146], [254, 162], [206, 134], [236, 134], [178, 132], [262, 132]] },
	{ id: 'hideout', kind: 'hideout', x: 8, y: 120, w: 156, h: 50, color: '#ff9a3a', seats: [[40, 140], [64, 146], [88, 140], [112, 146], [136, 140]] }
];
export const ZONE_BY_ID = new Map(ZONES.map((z) => [z.id, z]));

/** Hideout doors along the bottom wall: x centre of door i (up to DOORS). */
export const DOORS = 6;
export const doorX = (i: number) => 22 + i * 26;
export const DOOR_Y = 166;

/** The zone a place (`hangout.ts` `w`) belongs to; `ho:<id>` = the hideout corridor. */
export function zoneOf(where: string): Zone {
	if (where.startsWith('ho:')) return ZONE_BY_ID.get('hideout')!;
	return ZONE_BY_ID.get(where) ?? ZONE_BY_ID.get('lobby')!;
}

/**
 * Where each person stands: grouped by place, in a fixed order (by id) so every page puts them in the same spot.
 * In someone's hideout = in front of that owner's door; more people than seats stand a little behind.
 */
export function spots(people: readonly { id: string; w: string }[], doors: readonly string[]): Map<string, [number, number]> {
	const out = new Map<string, [number, number]>();
	const groups = new Map<string, string[]>();
	for (const p of [...people].sort((a, b) => (a.id < b.id ? -1 : 1))) {
		const door = p.w.startsWith('ho:') ? doors.indexOf(p.w.slice(3)) : -1;
		const key = door >= 0 ? `door:${door}` : zoneOf(p.w).id;
		const list = groups.get(key) ?? [];
		list.push(p.id);
		groups.set(key, list);
	}
	for (const [key, ids] of groups) {
		ids.forEach((id, i) => {
			if (key.startsWith('door:')) {
				const d = Number(key.slice(5));
				out.set(id, [doorX(d) + (i % 3) * 7 - 7, DOOR_Y - 10 - Math.floor(i / 3) * 6]);
				return;
			}
			const z = ZONE_BY_ID.get(key)!;
			const [x, y] = z.seats[i % z.seats.length];
			const row = Math.floor(i / z.seats.length);
			out.set(id, [x + row * 4, y + row * 7]);
		});
	}
	return out;
}
