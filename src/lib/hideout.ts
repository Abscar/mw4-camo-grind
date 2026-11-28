/**
 * Hideouts (2026-11-28, the user: "alla har sin personliga egna hideout … man behöver köpa den … customisa den …
 * typ som ett eget hus … på kasinot … hänga hos varandra … spela kort … gambla … slå vad … displaya feta skins").
 *
 * Buy the hideout (HIDEOUT_PRICE), then a room style and furniture for each spot, a display wall for guns, CS2
 * skins and clothes you own, and the words on your neon sign. Member field `hideout` (squad-codec MEMBER_KEYS):
 * { own: item id → burgers paid, th: room style, sp: spot → item, show: shop item ids on the wall, sign, at };
 * kept per device under `mw4-camo-grind:hideout` and merged (owned on either, the later layout). What's spent
 * comes off your burgers and goes to the house like BurgiShop (squad-fun.ts burgerBank). The games played there
 * (hangout.ts duels) go from player to player: member field `pvp` (a casino-style ledger, never the house).
 *
 * Never change or reuse an item id: owned items are kept by id. Pure, tested in scripts/hideout.test.js.
 */
import { ITEM_BY_ID } from './shop.ts';

export const HIDEOUT_ID = 'ho-base';
export const HIDEOUT_PRICE = 250_000;
export const SIGN_MAX = 18;

export interface RoomStyle {
	id: string;
	price: number;
	/** wall top, wall bottom, floor near, floor far, trim, light */
	c: [string, string, string, string, string, string];
	/** What's outside the window. */
	view: 'city' | 'none' | 'jungle' | 'sea' | 'stars' | 'vault' | 'desert';
}
/** Room styles; 'den' comes with the hideout. */
export const ROOMS: readonly RoomStyle[] = [
	{ id: 'den', price: 0, c: ['#4a2f1f', '#2e1c12', '#5b3a22', '#3b2415', '#c98a4a', '#ffcf8a'], view: 'city' },
	{ id: 'neon', price: 150_000, c: ['#1d0b38', '#120626', '#241046', '#140828', '#ff3fd8', '#5ff0ff'], view: 'city' },
	{ id: 'bunker', price: 300_000, c: ['#3c4236', '#252a20', '#4a4e44', '#2c2f28', '#c7b04a', '#e8f0b0'], view: 'none' },
	{ id: 'grow', price: 420_000, c: ['#163f24', '#0b2614', '#2d4a1f', '#1a2e12', '#8dff5a', '#d9ff9a'], view: 'jungle' },
	{ id: 'beach', price: 1_200_000, c: ['#f2d8a8', '#d9b87e', '#e8c98a', '#caa767', '#2fb8c9', '#fff4d0'], view: 'sea' },
	{ id: 'penthouse', price: 2_500_000, c: ['#22262e', '#15181d', '#3a3f48', '#262a31', '#d9b75a', '#fff1c4'], view: 'city' },
	{ id: 'saloon', price: 4_200_000, c: ['#6b3a1c', '#45230f', '#7a4a24', '#53301a', '#e0a040', '#ffd27a'], view: 'desert' },
	{ id: 'vault', price: 10_000_000, c: ['#5a4613', '#3a2c08', '#7a6220', '#4f3e12', '#ffe066', '#fff6c0'], view: 'vault' },
	{ id: 'space', price: 25_000_000, c: ['#141a33', '#0a0d1f', '#2a3050', '#181c33', '#7affea', '#c9fff7'], view: 'stars' }
];
export const ROOM_BY_ID = new Map(ROOMS.map((r) => [r.id, r]));

export const SPOTS = ['wall', 'couch', 'table', 'bar', 'rug', 'plant', 'lamp', 'trophy', 'corner', 'display'] as const;
export type Spot = (typeof SPOTS)[number];
export interface Furniture {
	id: string;
	spot: Spot;
	price: number;
	/** The display wall: how many things it shows. */
	holds?: number;
}
/** Furniture, cheapest first per spot. */
export const FURNITURE: readonly Furniture[] = [
	{ id: 'wall-poster', spot: 'wall', price: 15_000 },
	{ id: 'wall-neon', spot: 'wall', price: 200_000 },
	{ id: 'wall-tv', spot: 'wall', price: 600_000 },
	{ id: 'wall-aquarium', spot: 'wall', price: 2_000_000 },
	{ id: 'couch-old', spot: 'couch', price: 20_000 },
	{ id: 'couch-beanbag', spot: 'couch', price: 60_000 },
	{ id: 'couch-leather', spot: 'couch', price: 250_000 },
	{ id: 'couch-gold', spot: 'couch', price: 3_000_000 },
	{ id: 'table-cards', spot: 'table', price: 100_000 },
	{ id: 'table-pool', spot: 'table', price: 400_000 },
	{ id: 'table-poker', spot: 'table', price: 1_500_000 },
	{ id: 'bar-fridge', spot: 'bar', price: 50_000 },
	{ id: 'bar-tiki', spot: 'bar', price: 250_000 },
	{ id: 'bar-neon', spot: 'bar', price: 1_000_000 },
	{ id: 'rug-leaf', spot: 'rug', price: 30_000 },
	{ id: 'rug-tiger', spot: 'rug', price: 300_000 },
	{ id: 'rug-gold', spot: 'rug', price: 1_000_000 },
	{ id: 'plant-weed', spot: 'plant', price: 42_000 },
	{ id: 'plant-palm', spot: 'plant', price: 60_000 },
	{ id: 'plant-bonsai', spot: 'plant', price: 420_000 },
	{ id: 'lamp-lava', spot: 'lamp', price: 25_000 },
	{ id: 'lamp-disco', spot: 'lamp', price: 500_000 },
	{ id: 'trophy-cup', spot: 'trophy', price: 100_000 },
	{ id: 'trophy-statue', spot: 'trophy', price: 5_000_000 },
	{ id: 'corner-arcade', spot: 'corner', price: 750_000 },
	{ id: 'corner-jukebox', spot: 'corner', price: 900_000 },
	{ id: 'corner-safe', spot: 'corner', price: 2_000_000 },
	{ id: 'display-rack', spot: 'display', price: 200_000, holds: 4 },
	{ id: 'display-case', spot: 'display', price: 1_500_000, holds: 6 }
];
export const FURNITURE_BY_ID = new Map(FURNITURE.map((f) => [f.id, f]));
/** Things on the wall without a display stand. */
export const SHOW_BASE = 2;

export interface Hideout {
	own: Record<string, number>;
	th: string;
	sp: Partial<Record<Spot, string>>;
	show: string[];
	sign: string;
	at: number;
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
/** What an id costs (the hideout, a room style or a piece of furniture); 0 = not for sale. */
export function priceOfHideout(id: string): number {
	if (id === HIDEOUT_ID) return HIDEOUT_PRICE;
	if (id.startsWith('room-')) return ROOM_BY_ID.get(id.slice(5))?.price ?? 0;
	return FURNITURE_BY_ID.get(id)?.price ?? 0;
}
const known = (id: string) => id === HIDEOUT_ID || (id.startsWith('room-') && ROOM_BY_ID.has(id.slice(5))) || FURNITURE_BY_ID.has(id);
export const hasHideout = (h: Hideout | undefined) => !!h?.own[HIDEOUT_ID];
export const ownsRoom = (h: Hideout | undefined, room: string) => room === 'den' ? hasHideout(h) : !!h?.own[`room-${room}`];
export const showSlots = (h: Hideout | undefined) => (h?.sp.display ? (FURNITURE_BY_ID.get(h.sp.display)?.holds ?? SHOW_BASE) : SHOW_BASE);
/** Can this shop item go on the display wall? Guns, CS2 skins, clothes, plushies. */
export function showable(id: string): boolean {
	const it = ITEM_BY_ID.get(id);
	return !!it && (!!it.gun || !!it.cs2 || !!it.drip || it.slot === 'plush');
}
export const cleanSign = (raw: unknown) =>
	typeof raw === 'string'
		? raw
				.replace(/[\u0000-\u001f<>]/g, '')
				.trim()
				.slice(0, SIGN_MAX)
		: '';

export function cleanHideout(raw: unknown): Hideout | undefined {
	if (!isObj(raw) || !isObj(raw.own)) return undefined;
	const own: Record<string, number> = {};
	for (const [id, n] of Object.entries(raw.own)) if (known(id) && Number.isSafeInteger(n) && (n as number) >= 0) own[id] = n as number;
	if (!own[HIDEOUT_ID]) return undefined;
	const th = typeof raw.th === 'string' && ownsRoomIn(own, raw.th) ? raw.th : 'den';
	const sp: Partial<Record<Spot, string>> = {};
	if (isObj(raw.sp))
		for (const s of SPOTS) {
			const id = raw.sp[s];
			if (typeof id === 'string' && own[id] !== undefined && FURNITURE_BY_ID.get(id)?.spot === s) sp[s] = id;
		}
	const show = Array.isArray(raw.show) ? [...new Set(raw.show.filter((x): x is string => typeof x === 'string' && showable(x)))].slice(0, 6) : [];
	const at = typeof raw.at === 'number' && Number.isFinite(raw.at) && raw.at > 0 ? Math.round(raw.at) : 1;
	return { own, th, sp, show, sign: cleanSign(raw.sign), at };
}
const ownsRoomIn = (own: Record<string, number>, room: string) => ROOM_BY_ID.has(room) && (room === 'den' || own[`room-${room}`] !== undefined);

/** Two copies of your hideout: owned on either (the higher price paid), the later layout. */
export function mergeHideout(a: Hideout | undefined, b: Hideout | undefined): Hideout | undefined {
	if (!a) return b;
	if (!b) return a;
	const own = { ...a.own };
	for (const [id, n] of Object.entries(b.own)) own[id] = Math.max(own[id] ?? 0, n);
	const late = b.at > a.at ? b : a;
	return cleanHideout({ ...late, own });
}

export const hideoutSpent = (h: Hideout | undefined) => Object.values(h?.own ?? {}).reduce((n, x) => n + x, 0);

export type HideoutBuy = 'ok' | 'broke' | 'owned' | 'unknown' | 'first';
/** Buy the hideout, a room style (`room-<id>`) or a piece of furniture; a room / furniture is put up at once. */
export function buyHideout(h: Hideout | undefined, id: string, balance: number, at: number): { result: 'ok'; state: Hideout } | { result: Exclude<HideoutBuy, 'ok'> } {
	if (!known(id) || id === 'room-den') return { result: 'unknown' };
	if (id !== HIDEOUT_ID && !hasHideout(h)) return { result: 'first' };
	if (h?.own[id] !== undefined) return { result: 'owned' };
	const price = priceOfHideout(id);
	if (balance < price) return { result: 'broke' };
	const base: Hideout = h ?? { own: {}, th: 'den', sp: {}, show: [], sign: '', at: 0 };
	const next: Hideout = { ...base, own: { ...base.own, [id]: price }, at: Math.max(at, base.at + 1) };
	if (id.startsWith('room-')) next.th = id.slice(5);
	const f = FURNITURE_BY_ID.get(id);
	if (f) next.sp = { ...base.sp, [f.spot]: id };
	return { result: 'ok', state: next };
}
/** Change the layout (only owned things). */
export function arrange(h: Hideout | undefined, change: { th?: string; spot?: [Spot, string | null]; show?: string[]; sign?: string }, at: number): Hideout | null {
	if (!h || !hasHideout(h)) return null;
	const next: Hideout = { ...h, sp: { ...h.sp }, at: Math.max(at, h.at + 1) };
	if (change.th !== undefined) {
		if (!ownsRoomIn(h.own, change.th)) return null;
		next.th = change.th;
	}
	if (change.spot) {
		const [s, id] = change.spot;
		if (id === null) delete next.sp[s];
		else if (h.own[id] !== undefined && FURNITURE_BY_ID.get(id)?.spot === s) next.sp[s] = id;
		else return null;
	}
	if (change.show) next.show = [...new Set(change.show.filter(showable))].slice(0, showSlots(next));
	if (change.sign !== undefined) next.sign = cleanSign(change.sign);
	return next;
}
