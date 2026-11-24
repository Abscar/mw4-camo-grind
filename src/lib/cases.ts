/**
 * BurgiCasino's Case Battles (2026-11-24, the user: "lägg till sådana här case battles som från Counter-Strike,
 * på alla gamblingsidorna. Lägg till jättemånga sådana", then "du har ju redan massa Counter-Strike skins
 * liggandes i en av shopparna där som du kan använda till lådorna").
 *
 * Like the case-opening sites: a case costs burgers and holds a list of items, each with a chance and a value.
 * The items are the Camo Armory's 57 drawn CS2 skins (data/cs2Skins.ts) plus MW4 guns in their camos
 * (WeaponIcon's camo paint) as the cheaper fill. A case's star skins sit at the top (rare, worth many times
 * the case), the fill at the bottom. What an item is worth is set per case (× the case price), like a site's
 * own price list: a Dragon Lore in a 1,000 🍔 case is worth less than in a 2.5M one.
 *
 * - Open: open 1–5 of a case; you get what's inside, sold back at its value at once.
 * - Battle: 2–4 seats (you + bots in the operators' names), the same cases opened round by round by everyone.
 *   Normal = highest total takes everything; Crazy = lowest total takes everything; Terminal = only the last
 *   case counts; Share = everyone splits the pot. 2v2 = teams, the winning team splits it.
 *
 * Odds: every case pays back RTP (≈ 95 %) on average; a battle is fair between the seats, so it pays back the
 * same. The house (Abscar) gets what you lose, like the other games. Never change a case id or a tier's place
 * in a profile without thinking: nothing is stored by them, but radio lines and control-room odds mention them.
 *
 * Pure (no browser APIs), tested in scripts/cases.test.js.
 */
import { CS2_SKINS, cs2Name, type Cs2Skin } from './data/cs2Skins.ts';
import { WEAPONS } from './data/weapons.ts';
import type { IconCamo } from './data/camos.ts';

/** What every case pays back on average. */
export const RTP = 0.95;
/** Most rounds in one battle. */
export const MAX_ROUNDS = 25;
/** Most cases opened at once. */
export const MAX_OPEN = 5;

/** The colour bar under an item (CS2's grades + gold for the rarest). */
export type Grade = 'consumer' | 'industrial' | 'milspec' | 'restricted' | 'classified' | 'covert' | 'gold';
export const GRADES: Record<Grade, { name: string; colour: string }> = {
	consumer: { name: 'Consumer', colour: '#b0c3d9' },
	industrial: { name: 'Industrial', colour: '#5e98d9' },
	milspec: { name: 'Mil-Spec', colour: '#4b69ff' },
	restricted: { name: 'Restricted', colour: '#8847ff' },
	classified: { name: 'Classified', colour: '#d32ce6' },
	covert: { name: 'Covert', colour: '#eb4b4b' },
	gold: { name: 'Rare Special', colour: '#e4ae39' }
};
/** An item's grade from what it's worth against the case price. */
export function gradeOf(mult: number): Grade {
	return mult < 0.5 ? 'consumer' : mult < 1 ? 'industrial' : mult < 2 ? 'milspec' : mult < 5 ? 'restricted' : mult < 20 ? 'classified' : mult < 100 ? 'covert' : 'gold';
}

/** `cs2:<key>` (data/cs2Skins.ts) or `mw:<weapon id>:<camo or 'plain'>`. */
export type ItemRef = string;
export type ItemCamo = IconCamo | 'plain';

export interface CaseItem {
	ref: ItemRef;
	/** "AK-47 | Fire Serpent" / "M4 | Gold" */
	name: string;
	grade: Grade;
	/** Burgers you get for it. */
	value: number;
	/** Chance, 0–1 (all of a case's add up to 1). */
	p: number;
}

export interface CaseDef {
	id: string;
	name: string;
	price: number;
	/** Box colours (main, dark). */
	colour: string;
	colour2: string;
	profile: Profile;
	/** The skin drawn on the box (its top item). */
	cover: ItemRef;
	items: CaseItem[];
	tag?: 'new' | 'hot' | 'budget' | 'whale' | 'squad';
}

/** How a case pays: value (× price) and chance per tier, cheap first. Scaled so the case pays back RTP. */
export type Profile = 'steady' | 'classic' | 'wild' | 'gamble' | 'coin';
const PROFILES: Record<Profile, { mult: number[]; prob: number[] }> = {
	steady: { mult: [0.3, 0.6, 0.9, 1.3, 2, 4, 10], prob: [0.3, 0.25, 0.18, 0.13, 0.08, 0.045, 0.015] },
	classic: { mult: [0.15, 0.4, 0.8, 1.5, 3, 8, 25, 100], prob: [0.38, 0.24, 0.15, 0.11, 0.065, 0.035, 0.015, 0.005] },
	wild: { mult: [0.1, 0.25, 0.5, 1.2, 3, 10, 50, 250, 1000], prob: [0.42, 0.24, 0.14, 0.095, 0.06, 0.03, 0.0115, 0.003, 0.0005] },
	gamble: { mult: [0.12, 0.4, 1, 3, 90], prob: [0.6, 0.25, 0.1, 0.04, 0.01] },
	coin: { mult: [0.4, 1.5], prob: [0.5, 0.5] }
};
export const PROFILE_NAMES: Record<Profile, string> = { steady: 'Steady', classic: 'Classic', wild: 'Wild', gamble: 'All or nothing', coin: '50 / 50' };

// ---------------------------------------------------------------------------------------------
// Items

const CS2 = new Map<string, Cs2Skin>(CS2_SKINS.map((s) => [s.key, s]));
const OUT = WEAPONS.filter((w) => w.specials.length > 0);
const WEAPON = new Map(OUT.map((w) => [w.id, w]));
const CAMO_NAME: Record<ItemCamo, string> = {
	plain: 'Standard Issue',
	gold: 'Gold',
	platinum: 'Platinum',
	harmonicBreak: 'Harmonic Break',
	divergence: 'Divergence',
	mercurialDrift: 'Mercurial Drift',
	polyatomicReforged: 'Polyatomic Reforged',
	orionReforged: 'Orion Reforged'
};
const CAMO_RANK: ItemCamo[] = ['plain', 'gold', 'platinum', 'harmonicBreak', 'divergence', 'mercurialDrift', 'polyatomicReforged', 'orionReforged'];

export type ItemLook = { kind: 'cs2'; skin: Cs2Skin } | { kind: 'mw'; weapon: string; camo: IconCamo | null };

/** How to draw an item (CaseItemArt.svelte). */
export function lookOf(ref: ItemRef): ItemLook | null {
	const [k, a, b] = ref.split(':');
	if (k === 'cs2') {
		const s = CS2.get(a);
		return s ? { kind: 'cs2', skin: s } : null;
	}
	if (k === 'mw' && WEAPON.has(a) && (CAMO_RANK as string[]).includes(b)) return { kind: 'mw', weapon: a, camo: b === 'plain' ? null : (b as IconCamo) };
	return null;
}
export function itemName(ref: ItemRef): string {
	const l = lookOf(ref);
	if (!l) return ref;
	return l.kind === 'cs2' ? cs2Name(l.skin) : `${WEAPON.get(l.weapon)!.name} | ${CAMO_NAME[l.camo ?? 'plain']}`;
}
/** How fancy an item looks (orders the fill: fancier ones go higher up the case). */
function prestige(ref: ItemRef): number {
	const l = lookOf(ref);
	if (!l) return 0;
	return l.kind === 'cs2' ? 1e12 + l.skin.price : CAMO_RANK.indexOf(l.camo ?? 'plain') * 1e6 + (WEAPON.get(l.weapon)!.slot ?? 0);
}

const cs = (...keys: string[]): ItemRef[] => keys.map((k) => `cs2:${k}`);
/** Every released MW4 gun in these camos. */
const mw = (...camos: ItemCamo[]): ItemRef[] => camos.flatMap((c) => OUT.map((w) => `mw:${w.id}:${c}`));
const model = (...models: Cs2Skin['model'][]): ItemRef[] => CS2_SKINS.filter((s) => models.includes(s.model)).map((s) => `cs2:${s.key}`);
const cheapCs2 = CS2_SKINS.filter((s) => s.price <= 100_000_000).map((s) => `cs2:${s.key}`);

// ---------------------------------------------------------------------------------------------
// Building a case

function seeded(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

interface Spec {
	id: string;
	name: string;
	price: number;
	colour: string;
	colour2: string;
	profile: Profile;
	/** Star items, dearest first: they take the top tiers. */
	stars: ItemRef[];
	/** What fills the rest (picked at random, the same every time). */
	fill: ItemRef[];
	tag?: CaseDef['tag'];
}

/** Items per tier, top tier first: one each for the top three, two each below. */
const tierCounts = (k: number) => Array.from({ length: k }, (_, i) => (k - 1 - i < 3 ? 1 : 2));

function build(s: Spec): CaseDef {
	const { mult, prob } = PROFILES[s.profile];
	const k = mult.length;
	const ev = mult.reduce((a, m, i) => a + m * prob[i], 0);
	const scale = RTP / ev;
	const counts = tierCounts(k); // index 0 = cheapest tier
	const need = counts.reduce((a, b) => a + b, 0);
	const stars = [...new Set(s.stars)].slice(0, need);
	const rand = seeded(hash(s.id));
	const pool = [...new Set(s.fill)].filter((r) => !stars.includes(r));
	const fill: ItemRef[] = [];
	while (fill.length < need - stars.length && pool.length) fill.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
	fill.sort((a, b) => prestige(b) - prestige(a));
	const ranked = [...stars, ...fill]; // fanciest first
	const items: CaseItem[] = [];
	let at = 0;
	for (let tier = k - 1; tier >= 0; tier--) {
		const n = Math.min(counts[tier], ranked.length - at);
		for (let j = 0; j < n; j++) {
			const m = mult[tier] * scale;
			// the tier's items differ a little in value; their average stays the tier's
			const wiggle = n > 1 ? (j === 0 ? 1.08 : 0.92) : 1;
			items.push({ ref: ranked[at + j], name: itemName(ranked[at + j]), grade: gradeOf(m * wiggle), value: Math.max(1, Math.round(s.price * m * wiggle)), p: prob[tier] / n });
		}
		at += n;
	}
	// a tier left without items (short fill): its chance goes to the cheapest item
	const sum = items.reduce((a, it) => a + it.p, 0);
	if (sum < 1) items[items.length - 1].p += 1 - sum;
	return { id: s.id, name: s.name, price: s.price, colour: s.colour, colour2: s.colour2, profile: s.profile, cover: items[0].ref, items, ...(s.tag ? { tag: s.tag } : {}) };
}

const K = 1000;
const M = 1_000_000;
const lowFill = mw('plain', 'gold');
const midFill = [...mw('gold', 'platinum', 'harmonicBreak'), ...cheapCs2];
const highFill = [...mw('harmonicBreak', 'divergence', 'mercurialDrift'), ...cheapCs2];
const topFill = [...mw('divergence', 'mercurialDrift', 'polyatomicReforged', 'orionReforged'), ...CS2_SKINS.map((s) => `cs2:${s.key}`)];

const SPECS: Spec[] = [
	// ---- budget
	{ id: 'starter', name: 'Starter Case', price: 50, colour: '#6b7f8f', colour2: '#2a333b', profile: 'steady', stars: cs('usp-orion', 'r8-crimson-web'), fill: lowFill, tag: 'budget' },
	{ id: 'pocket-change', name: 'Pocket Change', price: 100, colour: '#8a9a5b', colour2: '#2f3a1a', profile: 'steady', stars: cs('mp7-fade', 'r8-blaze', 'xm-frost-borre'), fill: lowFill, tag: 'budget' },
	{ id: 'burger-box', name: 'Burger Box', price: 250, colour: '#d9822b', colour2: '#5a2a08', profile: 'classic', stars: cs('de-blaze', 'de-golden-koi', 'mp7-bloodsport'), fill: lowFill, tag: 'budget' },
	{ id: 'holk', name: 'Holk Case', price: 420, colour: '#3fae4a', colour2: '#0e3a14', profile: 'classic', stars: cs('ak-hydroponic', 'mp7-smoking-kills', 'm4s-jungle', 'xm-tranquility'), fill: lowFill, tag: 'hot' },
	{ id: 'barn', name: 'Drängen’s Barn Box', price: 1 * K, colour: '#b33a2a', colour2: '#3d0f08', profile: 'classic', stars: cs('xm-incinegator', 'r8-amber-fade', 'de-fennec'), fill: lowFill, tag: 'squad' },
	// ---- by gun
	{ id: 'pistol-whip', name: 'Pistol Whip', price: 500, colour: '#4a6fa5', colour2: '#121f33', profile: 'classic', stars: cs('usp-kill-confirmed', 'de-code-red', 'de-printstream', 'usp-printstream', 'de-kumicho'), fill: lowFill },
	{ id: 'smg-spray', name: 'SMG Spray', price: 750, colour: '#c24a7a', colour2: '#3a0e22', profile: 'classic', stars: model('mp7'), fill: lowFill },
	{ id: 'buckshot', name: 'Buckshot Surgeon', price: 1.5 * K, colour: '#7a5a3a', colour2: '#2a1a0e', profile: 'steady', stars: model('xm1014'), fill: [...lowFill, ...mw('platinum')] },
	{ id: 'revolver', name: 'Revolver Roulette', price: 2 * K, colour: '#a33a3a', colour2: '#300c0c', profile: 'gamble', stars: [...model('r8'), ...cs('de-blaze')], fill: lowFill },
	{ id: 'deagle', name: 'Deagle Dynasty', price: 3 * K, colour: '#c9a227', colour2: '#3a2c06', profile: 'classic', stars: model('deagle'), fill: midFill },
	{ id: 'usp', name: 'Silent Assassin', price: 3.5 * K, colour: '#3a4a5a', colour2: '#0e1418', profile: 'classic', stars: model('usps'), fill: midFill },
	{ id: 'ak-street', name: 'AK Street', price: 20 * K, colour: '#b5462a', colour2: '#3a1208', profile: 'wild', stars: model('ak47'), fill: midFill },
	{ id: 'm4-warehouse', name: 'M4 Warehouse', price: 20 * K, colour: '#4a8ab5', colour2: '#0e2433', profile: 'wild', stars: model('m4a4', 'm4a1s'), fill: midFill },
	{ id: 'sniper-nest', name: 'Sniper’s Nest', price: 15 * K, colour: '#5a7a3a', colour2: '#18240e', profile: 'classic', stars: cs('awp-fade', 'awp-lightning-strike', 'awp-asiimov', 'awp-hyper-beast'), fill: midFill },
	{ id: 'awp-dreams', name: 'AWP Dreams', price: 50 * K, colour: '#2e8b57', colour2: '#082a18', profile: 'wild', stars: model('awp'), fill: highFill },
	// ---- by finish
	{ id: 'neo-noir', name: 'Neo-Noir', price: 2 * K, colour: '#e6e6e6', colour2: '#1a1a1a', profile: 'classic', stars: cs('m4-neo-noir', 'usp-neo-noir', 'de-kumicho', 'mp7-nemesis'), fill: lowFill },
	{ id: 'asiimov', name: 'Asiimov Collection', price: 3 * K, colour: '#f2f2f2', colour2: '#ff7a1a', profile: 'classic', stars: cs('awp-asiimov', 'ak-asiimov', 'm4-asiimov'), fill: midFill },
	{ id: 'printstream', name: 'Printstream', price: 4 * K, colour: '#f5f5f5', colour2: '#2a2a2a', profile: 'classic', stars: cs('m4s-printstream', 'de-printstream', 'usp-printstream'), fill: midFill },
	{ id: 'blaze', name: 'Blaze It', price: 4.2 * K, colour: '#ff6a1a', colour2: '#4a1204', profile: 'classic', stars: cs('ak-vulcan', 'de-blaze', 'r8-blaze', 'xm-incinegator'), fill: midFill, tag: 'hot' },
	{ id: 'lightning', name: 'Lightning Strike', price: 6 * K, colour: '#b04aff', colour2: '#22083a', profile: 'classic', stars: cs('awp-lightning-strike', 'usp-orion', 'mp7-nemesis'), fill: midFill },
	{ id: 'fade', name: 'Fade Factory', price: 7.5 * K, colour: '#ff6ac1', colour2: '#ffd23a', profile: 'wild', stars: cs('kb-fade', 'kb-marble-fade', 'awp-fade', 'mp7-fade', 'r8-fade', 'r8-amber-fade'), fill: midFill },
	{ id: 'dark-side', name: 'Dark Side', price: 8 * K, colour: '#3a2a4a', colour2: '#0a0610', profile: 'classic', stars: cs('usp-traitor', 'de-kumicho', 'mp7-nemesis', 'xm-entombed'), fill: midFill },
	{ id: 'serpent', name: 'Serpent’s Nest', price: 12 * K, colour: '#3fa34d', colour2: '#0e2a12', profile: 'classic', stars: cs('ak-fire-serpent', 'awp-medusa', 'de-golden-koi'), fill: midFill },
	{ id: 'covert', name: 'Covert Ops', price: 40 * K, colour: '#eb4b4b', colour2: '#3a0a0a', profile: 'classic', stars: cs('m4-emperor', 'de-code-red', 'ak-wild-lotus', 'awp-prince', 'm4s-knight'), fill: highFill },
	// ---- camos
	{ id: 'gold-rush', name: 'Gold Rush', price: 2.5 * K, colour: '#e4ae39', colour2: '#4a3006', profile: 'steady', stars: cs('ak-gold-arabesque', 'de-golden-koi'), fill: mw('gold') },
	{ id: 'platinum', name: 'Platinum Plus', price: 5 * K, colour: '#d8dde3', colour2: '#4a525a', profile: 'steady', stars: cs('m4s-knight'), fill: mw('platinum') },
	{ id: 'harmonic', name: 'Harmonic Break', price: 10 * K, colour: '#c21a2a', colour2: '#14040a', profile: 'classic', stars: cs('m4s-hot-rod', 'ak-redline'), fill: mw('harmonicBreak', 'platinum') },
	{ id: 'divergence', name: 'Divergence Drop', price: 25 * K, colour: '#7ad6ff', colour2: '#2a1a4a', profile: 'classic', stars: cs('kb-marble-fade', 'awp-fade'), fill: mw('divergence', 'harmonicBreak') },
	{ id: 'mastery', name: 'Mastery Vault', price: 100 * K, colour: '#ff6ad5', colour2: '#14082a', profile: 'wild', stars: cs('kb-sapphire', 'usp-orion'), fill: mw('mercurialDrift', 'polyatomicReforged', 'orionReforged', 'divergence') },
	// ---- squad
	{ id: 'abscar', name: 'Abscar’s Favourites', price: 33 * K, colour: '#ff4418', colour2: '#2a0804', profile: 'wild', stars: cs('kb-fade', 'ak-fire-serpent', 'awp-lightning-strike', 'm4-asiimov', 'de-blaze', 'usp-printstream', 'mp7-bloodsport', 'xm-frost-borre'), fill: highFill, tag: 'squad' },
	{ id: 'phillestar', name: 'Phillestar’s Nuke Crate', price: 77 * K, colour: '#c8ff3a', colour2: '#1a2a06', profile: 'wild', stars: cs('m4-howl', 'awp-hyper-beast', 'mp7-smoking-kills'), fill: highFill, tag: 'squad' },
	{ id: 'jeeven', name: 'Da Jeeven’s Gold Crate', price: 50 * K, colour: '#ffd23a', colour2: '#3a2a04', profile: 'classic', stars: cs('ak-gold-arabesque', 'de-golden-koi', 'r8-amber-fade'), fill: [...mw('gold'), ...cheapCs2], tag: 'squad' },
	{ id: 'ingman', name: 'Ingman’s Iron Case', price: 25 * K, colour: '#8a3fd0', colour2: '#1e0a33', profile: 'steady', stars: cs('xm-entombed', 'xm-tranquility', 'usp-orion'), fill: midFill, tag: 'squad' },
	{ id: 'aw', name: 'AW’s Night Shift', price: 69 * K, colour: '#1aa79a', colour2: '#04221f', profile: 'wild', stars: cs('ak-wild-lotus', 'm4-poseidon', 'usp-kill-confirmed'), fill: highFill, tag: 'squad' },
	{ id: 'joker', name: 'Joker’s Wild', price: 125 * K, colour: '#5b2a86', colour2: '#3fae4a', profile: 'gamble', stars: cs('m4-emperor', 'ak-hydroponic', 'awp-prince'), fill: highFill, tag: 'squad' },
	// ---- knives + chasers
	{ id: 'budget-knife', name: 'Budget Knife', price: 15 * K, colour: '#9aa5ad', colour2: '#22282c', profile: 'gamble', stars: cs('kb-tiger-tooth', 'kb-crimson-web'), fill: midFill },
	{ id: 'one-percent', name: '1 % Club', price: 10 * K, colour: '#111111', colour2: '#e4ae39', profile: 'gamble', stars: cs('kb-case-hardened'), fill: midFill, tag: 'hot' },
	{ id: 'fifty-fifty', name: '50 / 50', price: 5 * K, colour: '#ffffff', colour2: '#111111', profile: 'coin', stars: cs('ak-redline'), fill: midFill },
	{ id: 'karambit', name: 'Karambit Kingdom', price: 250 * K, colour: '#e4ae39', colour2: '#2a1a04', profile: 'wild', stars: model('karambit'), fill: highFill },
	{ id: 'doppler', name: 'Doppler Den', price: 500 * K, colour: '#2a6aff', colour2: '#ff2a4a', profile: 'wild', stars: cs('kb-emerald', 'kb-ruby', 'kb-sapphire'), fill: highFill },
	{ id: 'howl', name: 'Howl Case', price: 1 * M, colour: '#ff7a1a', colour2: '#2a0a04', profile: 'gamble', stars: cs('m4-howl', 'm4-poseidon'), fill: topFill },
	{ id: 'blue-gem', name: 'Blue Gem Hunt', price: 1 * M, colour: '#2a7aff', colour2: '#06183a', profile: 'wild', stars: cs('ak-case-hardened', 'kb-case-hardened'), fill: topFill, tag: 'hot' },
	{ id: 'dragon-lore', name: 'Dragon Lore', price: 2.5 * M, colour: '#d9a227', colour2: '#3a1a04', profile: 'gamble', stars: cs('awp-dragon-lore', 'awp-gungnir'), fill: topFill },
	{ id: 'daily-grind', name: 'Daily Grind', price: 1 * M, colour: '#43d35e', colour2: '#0a2a10', profile: 'classic', stars: cs('awp-medusa', 'ak-wild-lotus', 'kb-lore'), fill: topFill },
	// ---- whales
	{ id: 'high-roller', name: 'High Roller', price: 10 * M, colour: '#e4ae39', colour2: '#111111', profile: 'wild', stars: cs('ak-case-hardened', 'awp-dragon-lore', 'kb-case-hardened', 'm4-howl', 'awp-gungnir'), fill: topFill, tag: 'whale' },
	{ id: 'whale', name: 'Burger Whale', price: 50 * M, colour: '#2ad0ff', colour2: '#04223a', profile: 'wild', stars: cs('ak-case-hardened', 'kb-emerald', 'awp-dragon-lore'), fill: topFill, tag: 'whale' },
	{ id: 'billionaire', name: 'Billionaire’s Vault', price: 100 * M, colour: '#111111', colour2: '#ffd23a', profile: 'gamble', stars: cs('ak-case-hardened', 'awp-dragon-lore'), fill: topFill, tag: 'whale' }
];

/** Every case, cheapest first. */
export const CASES: readonly CaseDef[] = SPECS.map(build).sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
export const CASE_BY_ID: ReadonlyMap<string, CaseDef> = new Map(CASES.map((c) => [c.id, c]));

/** A case's average payback (should be ≈ RTP; rounding moves it a hair). */
export const caseRtp = (c: CaseDef) => c.items.reduce((a, it) => a + it.p * it.value, 0) / c.price;

/** One item out of a case: its index in `c.items`. */
export function drawItem(c: CaseDef, rand: () => number): number {
	let r = rand();
	for (let i = 0; i < c.items.length; i++) {
		r -= c.items[i].p;
		if (r < 0) return i;
	}
	return c.items.length - 1;
}

// ---------------------------------------------------------------------------------------------
// Opening

export interface OpenResult {
	caseId: string;
	pulls: number[];
	cost: number;
	won: number;
	net: number;
}
export function openCases(caseId: string, count: number, rand: () => number): OpenResult {
	const c = CASE_BY_ID.get(caseId);
	if (!c) throw new Error(`no case ${caseId}`);
	const n = Math.max(1, Math.min(MAX_OPEN, Math.floor(count)));
	const pulls = Array.from({ length: n }, () => drawItem(c, rand));
	const won = pulls.reduce((a, i) => a + c.items[i].value, 0);
	return { caseId, pulls, cost: c.price * n, won, net: won - c.price * n };
}

// ---------------------------------------------------------------------------------------------
// Battles

export type BattleSize = '1v1' | '1v1v1' | '1v1v1v1' | '2v2';
export const BATTLE_SIZES: BattleSize[] = ['1v1', '1v1v1', '1v1v1v1', '2v2'];
export const SEATS: Record<BattleSize, number> = { '1v1': 2, '1v1v1': 3, '1v1v1v1': 4, '2v2': 4 };
export type BattleMode = 'normal' | 'crazy' | 'terminal' | 'share';
export const BATTLE_MODES: BattleMode[] = ['normal', 'crazy', 'terminal', 'share'];

/** Seat → team (2v2: you + seat 1 against seats 2 + 3; else everyone alone). */
export const teamOf = (size: BattleSize, seat: number) => (size === '2v2' ? (seat < 2 ? 0 : 1) : seat);

export interface Battle {
	size: BattleSize;
	mode: BattleMode;
	cases: string[];
	/** seat → round → item index */
	pulls: number[][];
	/** seat → round → value */
	values: number[][];
	/** What each seat pays (the sum of the cases). */
	cost: number;
	/** Everything opened. */
	pot: number;
	/** Each seat's score (team totals in 2v2; last round in Terminal). */
	score: number[];
	/** The winning seats (several on a tie or a team; everyone in Share). */
	winners: number[];
	/** What each seat takes home. */
	payout: number[];
	/** Your (seat 0) result. */
	net: number;
}

export const battleCost = (cases: readonly string[]) => cases.reduce((a, id) => a + (CASE_BY_ID.get(id)?.price ?? 0), 0);

export function runBattle(cases: readonly string[], size: BattleSize, mode: BattleMode, rand: () => number): Battle {
	const list = cases.filter((id) => CASE_BY_ID.has(id)).slice(0, MAX_ROUNDS);
	if (!list.length) throw new Error('no cases');
	const seats = SEATS[size];
	const pulls: number[][] = Array.from({ length: seats }, () => []);
	// round by round, seat by seat (the order the page shows them in)
	for (const id of list) {
		const c = CASE_BY_ID.get(id)!;
		for (let s = 0; s < seats; s++) pulls[s].push(drawItem(c, rand));
	}
	const values = pulls.map((row) => row.map((i, r) => CASE_BY_ID.get(list[r])!.items[i].value));
	const own = values.map((row) => (mode === 'terminal' ? row[row.length - 1] : row.reduce((a, b) => a + b, 0)));
	const pot = values.flat().reduce((a, b) => a + b, 0);
	const team = (s: number) => teamOf(size, s);
	const score = own.map((_, s) => own.reduce((a, v, o) => (team(o) === team(s) ? a + v : a), 0));
	let winners: number[];
	if (mode === 'share') winners = own.map((_, s) => s);
	else {
		const best = mode === 'crazy' ? Math.min(...score) : Math.max(...score);
		winners = score.map((v, s) => (v === best ? s : -1)).filter((s) => s >= 0);
	}
	const each = Math.floor(pot / winners.length);
	const payout = own.map((_, s) => (winners.includes(s) ? each : 0));
	const cost = battleCost(list);
	return { size, mode, cases: list, pulls, values, cost, pot, score, winners, payout, net: payout[0] - cost };
}

/** The operators the bots play as (squad-codec SQUAD_OPS), with their names. */
export const BOTS = [
	{ op: 'phillestar', name: 'Phillestar' },
	{ op: 'lars', name: 'Drängen' },
	{ op: 'jeeven', name: 'Da Jeeven' },
	{ op: 'ingman', name: 'Ingman' },
	{ op: 'aw', name: 'AW' },
	{ op: 'joker', name: 'TheJoker_BPL' },
	{ op: 'abscar', name: 'Abscar' }
] as const;
/** The bots in a battle: never the operator you are, picked from a seed. */
export function botsFor(size: BattleSize, myOp: string | null | undefined, seed: number): (typeof BOTS)[number][] {
	const pool = BOTS.filter((b) => b.op !== myOp);
	const r = seeded(seed);
	const out: (typeof BOTS)[number][] = [];
	while (out.length < SEATS[size] - 1) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
	return out;
}
