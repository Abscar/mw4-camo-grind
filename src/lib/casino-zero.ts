/**
 * Resetting the casino stats (2026-11-24, the user: "resetta allas stats i casino leaderboarden, du kan
 * resetta i admin loggen också hur mycket alla fått"; asked whether burgers should change, they said
 * "Bara siffrorna"). So nothing is deleted and no balance moves: Abscar's reset stores, per member, the
 * numbers as they were at that moment (squad-doc field `zero`), and the leaderboard, the house line and
 * the admin menu show what came AFTER it (now − then). A member who joins later has no row = counts
 * from zero. Pure, no browser APIs (scripts/casino-zero.test.js).
 */
import { casinoTotal, NET_MAX, type CasinoLedger } from './squad-casino.ts';

export interface CasinoZero {
	/** When the reset was made (server time, ms). */
	at: number;
	/** Member id → their casino result and games at the reset. */
	casino?: Record<string, { net: number; games: number }>;
	/** Member id → their admin give/take total at the reset. */
	grants?: Record<string, number>;
	/** Member id → their house income at the reset (only the house has one). */
	house?: Record<string, number>;
}

const MEMBER_ID = /^[A-Za-z0-9_-]{8,32}$/;
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const int = (x: unknown) => Number.isInteger(x) && Math.abs(x as number) <= NET_MAX;

function cleanNums(raw: unknown): Record<string, number> | undefined {
	if (!isObject(raw)) return undefined;
	const out: Record<string, number> = {};
	for (const [id, n] of Object.entries(raw)) if (MEMBER_ID.test(id) && int(n) && n !== 0) out[id] = n as number;
	return Object.keys(out).length ? out : undefined;
}

export function cleanZero(raw: unknown): CasinoZero | undefined {
	if (!isObject(raw) || !Number.isInteger(raw.at) || (raw.at as number) <= 0) return undefined;
	const out: CasinoZero = { at: raw.at as number };
	if (isObject(raw.casino)) {
		const casino: Record<string, { net: number; games: number }> = {};
		for (const [id, v] of Object.entries(raw.casino)) {
			if (!MEMBER_ID.test(id) || !isObject(v) || !int(v.net) || !Number.isInteger(v.games) || (v.games as number) < 0) continue;
			casino[id] = { net: v.net as number, games: v.games as number };
		}
		if (Object.keys(casino).length) out.casino = casino;
	}
	const grants = cleanNums(raw.grants);
	if (grants) out.grants = grants;
	const house = cleanNums(raw.house);
	if (house) out.house = house;
	return out;
}

/** The reset itself: everyone's numbers right now. `house` = member id → house income (burgerBank). */
export function makeZero(at: number, members: Record<string, { casino?: CasinoLedger }>, grants: Record<string, number> | undefined, house: Record<string, number>): CasinoZero {
	const casino: Record<string, { net: number; games: number }> = {};
	for (const [id, m] of Object.entries(members)) {
		const t = casinoTotal(m.casino);
		if (t.games || t.net) casino[id] = { net: t.net, games: t.games };
	}
	return cleanZero({ at, casino, grants: { ...grants }, house }) ?? { at };
}

/** A member's leaderboard numbers since the reset. */
export function casinoSince(id: string, ledger: CasinoLedger | undefined, zero: CasinoZero | undefined): { net: number; games: number } {
	const t = casinoTotal(ledger);
	const z = zero?.casino?.[id];
	return { net: t.net - (z?.net ?? 0), games: Math.max(0, t.games - (z?.games ?? 0)) };
}

/** A member's admin give/take total since the reset. */
export function grantSince(id: string, total: number, zero: CasinoZero | undefined): number {
	return total - (zero?.grants?.[id] ?? 0);
}

/** The house's income since the reset. */
export function houseSince(id: string, total: number, zero: CasinoZero | undefined): number {
	return total - (zero?.house?.[id] ?? 0);
}
