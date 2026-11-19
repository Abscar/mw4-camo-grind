/**
 * BurgiGives, BurgiCasino's donations tab (2026-11-20, the user's ask: "add a 'donations' page where you
 * can donate burgers; come up with 5 different organisations just for fun, a tab of its own next to
 * BurgiBank with its own logo, draw fun pictures for all the orgs", then "a list of who donated to which").
 * Pretend burgers to five made-up joke causes (names and lines in i18n/en.ts `t.donate.orgs`), never
 * money, never a real charity.
 *
 * Donated burgers leave the economy: they come off the giver's balance and go to nobody, not to the
 * house (squad-fun.ts burgerBank `donated`).
 *
 * Stored as member field `donations` (squad-codec.ts):
 *   - `dev`: per device, the burgers given per cause. A device only ever adds to its own numbers, so
 *     two devices merge by taking the bigger number per device and cause: nothing is lost or counted
 *     twice (the casino tally works the same way, squad-casino.ts).
 *   - `log`: the newest DON_LOG gifts (id → { o, n, at }) for the "latest gifts" list, merged by id.
 *     No total comes from the log, so gifts dropping off it change no number.
 * Kept on the device too (`mw4-camo-grind:donations`). No browser APIs and no runes, so Node tests it
 * directly (scripts/donations.test.js).
 */

/** The causes, in the order the page shows them. Never change or reuse an id: totals are keyed by it. */
export const ORG_IDS = ['holk', 'barn', 'campaign', 'hardcore', 'wrists'] as const;
export type OrgId = (typeof ORG_IDS)[number];

export interface Org {
	id: OrgId;
	/** The card's colours (the same in every theme, like the casino tiles). */
	tile: string;
	deep: string;
	/** Edge, bars and the thank-you sticker. */
	accent: string;
}

export const ORGS: readonly Org[] = [
	{ id: 'holk', tile: '#1f5a2a', deep: '#0a2410', accent: '#8dff5a' },
	{ id: 'barn', tile: '#7a2418', deep: '#2e0a06', accent: '#ffcf4a' },
	{ id: 'campaign', tile: '#4a4256', deep: '#1a1622', accent: '#c9b8ff' },
	{ id: 'hardcore', tile: '#6a1020', deep: '#24040a', accent: '#ff6a6a' },
	{ id: 'wrists', tile: '#164a6e', deep: '#06192a', accent: '#6ad8ff' }
];
export const ORG_BY_ID = new Map(ORGS.map((o) => [o.id, o]));

/** Quick amounts on the page (any other amount can be typed in). */
export const DON_AMOUNTS = [100, 1_000, 10_000, 100_000];
/** The most one gift can be. */
export const DON_MAX = 100_000_000;
/** Gifts this big go on the squad radio. */
export const DON_RADIO = 1_000;
/** Gifts kept in a member's log (the "latest gifts" list). */
export const DON_LOG = 20;
/** Devices kept per member (the newest): far more than anyone has. */
export const DON_DEVICES = 12;
/** A cause's goals, then each one twice the last. */
const GOAL_STEPS = [10_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

export interface Gift {
	o: OrgId;
	n: number;
	/** When (ms, the sync service's clock). */
	at: number;
}
export interface DeviceGifts {
	/** Burgers given per cause from this device (only ever grows). */
	s: Partial<Record<OrgId, number>>;
	/** When this device last gave. */
	at: number;
}
export interface DonationBook {
	dev: Record<string, DeviceGifts>;
	log?: Record<string, Gift>;
}

const DEVICE_ID = /^[A-Za-z0-9_-]{4,16}$/;
const GIFT_ID = /^[A-Za-z0-9_-]{1,16}$/;
const ORG_SET = new Set<string>(ORG_IDS);
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;
const isAmount = (x: unknown): x is number => Number.isInteger(x) && (x as number) > 0;
/** A whole device's total can't be more than this (sanity, like the casino's NET_MAX). */
const SUM_MAX = 10_000_000_000;

export const isOrg = (x: unknown): x is OrgId => typeof x === 'string' && ORG_SET.has(x);

function pruneDevices(dev: Record<string, DeviceGifts>): Record<string, DeviceGifts> {
	const list = Object.entries(dev);
	if (list.length <= DON_DEVICES) return dev;
	return Object.fromEntries(list.sort(([, a], [, b]) => b.at - a.at).slice(0, DON_DEVICES));
}

function pruneLog(log: Record<string, Gift> | undefined): Record<string, Gift> | undefined {
	if (!log) return undefined;
	const list = Object.entries(log).sort(([ia, a], [ib, b]) => b.at - a.at || (ia < ib ? -1 : 1));
	return list.length ? Object.fromEntries(list.slice(0, DON_LOG)) : undefined;
}

function book(dev: Record<string, DeviceGifts>, log: Record<string, Gift> | undefined): DonationBook | undefined {
	const d = pruneDevices(dev);
	const l = pruneLog(log);
	if (!Object.keys(d).length && !l) return undefined;
	return l ? { dev: d, log: l } : { dev: d };
}

export function cleanDonations(raw: unknown): DonationBook | undefined {
	if (!isObject(raw) || !isObject(raw.dev)) return undefined;
	const dev: Record<string, DeviceGifts> = {};
	for (const [id, d] of Object.entries(raw.dev)) {
		if (!DEVICE_ID.test(id) || !isObject(d) || !isObject(d.s) || !isTime(d.at)) continue;
		const s: Partial<Record<OrgId, number>> = {};
		let sum = 0;
		for (const [o, n] of Object.entries(d.s)) {
			if (!isOrg(o) || !isAmount(n)) continue;
			s[o] = n;
			sum += n;
		}
		if (!Object.keys(s).length || sum > SUM_MAX) continue;
		dev[id] = { s, at: Math.round(d.at) };
	}
	let log: Record<string, Gift> | undefined;
	if (isObject(raw.log)) {
		for (const [id, g] of Object.entries(raw.log)) {
			if (!GIFT_ID.test(id) || !isObject(g) || !isOrg(g.o) || !isAmount(g.n) || (g.n as number) > DON_MAX || !isTime(g.at)) continue;
			(log ??= {})[id] = { o: g.o, n: g.n as number, at: Math.round(g.at as number) };
		}
	}
	return book(dev, log);
}

/** Burgers given per cause (all devices). */
export function donationsByOrg(b: DonationBook | undefined): Record<OrgId, number> {
	const out = Object.fromEntries(ORG_IDS.map((o) => [o, 0])) as Record<OrgId, number>;
	for (const d of Object.values(b?.dev ?? {})) for (const o of ORG_IDS) out[o] += d.s[o] ?? 0;
	return out;
}

/** Everything a member has given (what comes off their balance). */
export function donationTotal(b: DonationBook | undefined): number {
	return Object.values(donationsByOrg(b)).reduce((a, n) => a + n, 0);
}

export type GiveResult = { result: 'ok'; book: DonationBook } | { result: 'broke' | 'bad' };

/** Give `n` burgers to a cause from this device: 'broke' = more than you have, 'bad' = not a gift. */
export function giveTo(b: DonationBook | undefined, device: string, id: string, org: string, n: number, balance: number, now: number): GiveResult {
	if (!DEVICE_ID.test(device) || !GIFT_ID.test(id) || !isOrg(org) || !isAmount(n) || n > DON_MAX || !isTime(now)) return { result: 'bad' };
	if (n > balance) return { result: 'broke' };
	const mine = b?.dev[device];
	const s = { ...mine?.s, [org]: (mine?.s[org] ?? 0) + n };
	const at = Math.round(now);
	const next = book({ ...b?.dev, [device]: { s, at: Math.max(at, mine?.at ?? 0) } }, { ...b?.log, [id]: { o: org, n, at } });
	return next ? { result: 'ok', book: next } : { result: 'bad' };
}

/** Two copies of your gifts (two devices): per device and cause the bigger number, the logs joined. */
export function mergeDonations(a: DonationBook | undefined, b: DonationBook | undefined): DonationBook | undefined {
	if (!a || !b) return a ?? b;
	const dev: Record<string, DeviceGifts> = { ...a.dev };
	for (const [id, d] of Object.entries(b.dev)) {
		const mine = dev[id];
		if (!mine) {
			dev[id] = d;
			continue;
		}
		const s: Partial<Record<OrgId, number>> = { ...mine.s };
		for (const o of ORG_IDS) {
			const n = Math.max(mine.s[o] ?? 0, d.s[o] ?? 0);
			if (n) s[o] = n;
		}
		dev[id] = { s, at: Math.max(mine.at, d.at) };
	}
	const log = a.log || b.log ? { ...a.log, ...b.log } : undefined;
	return book(dev, log);
}

/** Where a total stands on its cause's goals: goals reached, the last one, the next one, how far along. */
export function goalOf(total: number): { reached: number; from: number; to: number; frac: number } {
	let reached = 0;
	let from = 0;
	let to = GOAL_STEPS[0];
	while (total >= to) {
		reached++;
		from = to;
		to = reached < GOAL_STEPS.length ? GOAL_STEPS[reached] : to * 2;
	}
	return { reached, from, to, frac: Math.min(1, Math.max(0, (total - from) / (to - from))) };
}

/** The goal a gift pushed its cause past (the highest one), or null. */
export function goalPassed(before: number, after: number): number | null {
	const a = goalOf(before).reached;
	const b = goalOf(after);
	return b.reached > a ? b.from : null;
}

type Giver = { name: string; donations?: DonationBook };

export interface DonorRow {
	id: string;
	total: number;
	/** What they gave each cause, biggest first (only causes they gave to). */
	per: { o: OrgId; n: number }[];
}
export interface OrgStanding {
	total: number;
	donors: number;
	/** The biggest giver (the lowest id if two gave the same), or null. */
	top: { id: string; n: number } | null;
}
export interface SquadGiving {
	total: number;
	byOrg: Record<OrgId, OrgStanding>;
	/** Everyone who gave something, most first. */
	donors: DonorRow[];
	/** The latest gifts in the squad, newest first. */
	recent: (Gift & { by: string; id: string })[];
}

/** The whole squad's giving: per cause, per member (who gave to which), the latest gifts. */
export function squadGiving(members: Record<string, Giver>, recent = 12): SquadGiving {
	const byOrg = Object.fromEntries(ORG_IDS.map((o) => [o, { total: 0, donors: 0, top: null }])) as Record<OrgId, OrgStanding>;
	const donors: DonorRow[] = [];
	const gifts: (Gift & { by: string; id: string })[] = [];
	for (const id of Object.keys(members).sort()) {
		const m = members[id];
		const per = donationsByOrg(m.donations);
		let total = 0;
		for (const o of ORG_IDS) {
			const n = per[o];
			if (!n) continue;
			total += n;
			const s = byOrg[o];
			s.total += n;
			s.donors++;
			if (!s.top || n > s.top.n) s.top = { id, n };
		}
		if (total) {
			donors.push({
				id,
				total,
				per: ORG_IDS.filter((o) => per[o])
					.map((o) => ({ o, n: per[o] }))
					.sort((a, b) => b.n - a.n)
			});
		}
		for (const [gid, g] of Object.entries(m.donations?.log ?? {})) gifts.push({ ...g, by: id, id: gid });
	}
	donors.sort((a, b) => b.total - a.total || (members[a.id].name < members[b.id].name ? -1 : 1));
	gifts.sort((a, b) => b.at - a.at || (a.id < b.id ? -1 : 1));
	return { total: donors.reduce((a, d) => a + d.total, 0), byOrg, donors, recent: gifts.slice(0, recent) };
}

/**
 * A typed amount: "1500", "1,500", "1 500", "10k", "2.5m" → whole burgers, or null.
 * (k = thousand, m = million; decimals only with a suffix.)
 */
export function parseAmount(text: string): number | null {
	const s = text.trim().toLowerCase().replace(/[\s,_  ]/g, '');
	const m = /^(\d+(?:\.\d+)?)([km]?)$/.exec(s);
	if (!m) return null;
	if (m[1].includes('.') && !m[2]) return null;
	const n = Math.round(Number(m[1]) * (m[2] === 'k' ? 1_000 : m[2] === 'm' ? 1_000_000 : 1));
	return Number.isSafeInteger(n) && n > 0 ? n : null;
}
