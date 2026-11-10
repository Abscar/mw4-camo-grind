/**
 * The meta list ("Meta top 5", MetaSection): the best guns per weapon class right now, in
 * Multiplayer and in Warzone, plus an overall top 5. The user's ask, 2026-11-10.
 *
 * A dated SNAPSHOT like loadouts.ts and balance.ts: refresh it with them (the meta moves with
 * every balance patch). Research notes: mw4-kunskap/meta.md ("Topp 5 per klass").
 *
 * Each class list ranks EVERY released MW4 gun in that class (a test checks it), best first; the
 * page shows the first META_TOP. Only MW4 guns: Warzone's legacy Black Ops 7 guns are preset builds
 * that can't be changed in the Gunsmith, and all of them sit in B tier or lower. Launchers and melee
 * have no meta class, so they have no list.
 *
 * The ranking is our own weighing of the cited sites (their tiers, ranks and pick rates), not one
 * site's list copied. `verified: false` = the sites disagree a lot about that gun; `note` says how.
 */
import type { LoadoutMode } from './loadouts.ts';
import { CLASSES, WEAPON_BY_ID } from './weapons.ts';

export type MetaTier = 'S' | 'A' | 'B' | 'C' | 'D';

export interface MetaPick {
	/** Weapon id (weapons.ts). */
	id: string;
	tier: MetaTier;
	/** Warzone: what the gun is used for ("Long range", "Close range", "Sniper"). */
	role?: string;
	verified: boolean;
	/** Why it's unconfirmed, or a short caveat. */
	note?: string;
}

export interface MetaBoard {
	/** When the snapshot was taken (YYYY-MM-DD). */
	date: string;
	/** The sites it's weighed from, as shown on the page. */
	sources: string;
	/** The best guns across every class. */
	overall: MetaPick[];
	/** Keyed by class id (weapons.ts); every released gun in the class, best first. */
	classes: Record<string, MetaPick[]>;
}

/** How many guns each list shows. */
export const META_TOP = 5;

type Extras = { role?: string; note?: string; verified?: boolean };

const p = (id: string, tier: MetaTier, extras: Extras = {}): MetaPick => {
	const { verified = true, role, note } = extras;
	return { id, tier, verified, ...(role ? { role } : {}), ...(note ? { note } : {}) };
};

const LR = { role: 'Long range' };
const CR = { role: 'Close range' };
const SN = { role: 'Sniper' };
const SEC = { role: 'Secondary' };

export const META_RANKS: Record<LoadoutMode, MetaBoard> = {
	// Multiplayer, 2026-11-10: codmunity.gg/mw4 (updated 10 Nov, tiers + pick rates), wzstats.gg/mw4/meta
	// (10 Nov, tier + rank per class), Dexerto's tier list (9 Nov). Tie-breakers: GameRant's AR ranking
	// (6 Nov) and metaradar.gg (10 Nov). Scored S/META 3, A 2, B 1 per site; pick rate breaks ties.
	mp: {
		date: '2026-11-10',
		sources: 'codmunity.gg, wzstats.gg and Dexerto',
		overall: [
			p('cronen-osprey', 'S'),
			p('iso-nightshade', 'S'),
			p('hyeon-burst', 'S'),
			p('m4', 'S'),
			p('kg-7-vulcan', 'S')
		],
		classes: {
			'assault-rifles': [
				p('cronen-osprey', 'S'),
				p('hyeon-burst', 'S'),
				p('m4', 'S'),
				p('axion', 'S'),
				p('kastov-762', 'A'),
				p('patriot-xmr', 'A'),
				p('oden', 'A'),
				p('han-86', 'B'),
				p('cronen-squall', 'B', { verified: false, note: 'codmunity rates it A, the other sites B or last.' })
			],
			smgs: [
				p('iso-nightshade', 'S'),
				p('vel-46', 'S'),
				p('ppsh-41', 'A'),
				p('x-58-nyx', 'A', { verified: false, note: 'wzstats and Dexerto rate it A, codmunity only C.' }),
				p('wz-55-striga', 'B'),
				p('csg-35', 'B')
			],
			shotguns: [p('rezi-12', 'B'), p('warlord', 'C')],
			lmgs: [
				p('finn-lmg', 'B'),
				p('type-73', 'B'),
				p('apoc-338', 'C', {
					verified: false,
					note: 'Nerfed in Season 1: codmunity rates it D, but wzstats still puts it first among LMGs.'
				})
			],
			'marksman-rifles': [p('mosin-nagant', 'A'), p('oris-8-6', 'A'), p('mar-9', 'B')],
			'sniper-rifles': [
				p('kg-7-vulcan', 'S'),
				p('astaroth-57', 'B', {
					verified: false,
					note: 'The sites split on the second-best sniper: wzstats puts the Astaroth .57 ahead, codmunity the Signal 50.'
				}),
				p('signal-50', 'B')
			],
			pistols: [p('krait-p68', 'B'), p('sang-9mm', 'C'), p('50-gs', 'C'), p('mojave-357', 'C')]
		}
	},
	// Warzone (Battle Royale; Resurgence is nearly the same on wzstats), 2026-11-10: wzstats.gg (10 Nov,
	// tier + rank per role), codmunity.gg/warzone (10 Nov, tiers + pick rates), wzhub.gg (8 Nov, its two
	// top tiers). Dexerto's Season 1 list (6 Nov, day one) only breaks ties. Same scoring as above;
	// "unconfirmed" where the sites are 3 tiers or more apart. No Warzone weapon tuning since 6 Nov.
	wz: {
		date: '2026-11-10',
		sources: 'wzstats.gg, codmunity.gg and wzhub.gg',
		overall: [
			p('cronen-osprey', 'S', LR),
			p('iso-nightshade', 'S', CR),
			p('vel-46', 'S', CR),
			p('han-86', 'A', LR),
			p('kg-7-vulcan', 'A', SN)
		],
		classes: {
			'assault-rifles': [
				p('cronen-osprey', 'S', LR),
				p('han-86', 'A', LR),
				p('m4', 'A', LR),
				p('kastov-762', 'B', LR),
				p('axion', 'B', LR),
				p('hyeon-burst', 'B', LR),
				p('patriot-xmr', 'B', LR),
				p('cronen-squall', 'C', LR),
				p('oden', 'C', LR)
			],
			smgs: [
				p('iso-nightshade', 'S', CR),
				p('vel-46', 'S', CR),
				p('wz-55-striga', 'A', CR),
				p('x-58-nyx', 'A', CR),
				p('csg-35', 'B', CR),
				p('ppsh-41', 'B', CR)
			],
			shotguns: [p('rezi-12', 'B', CR), p('warlord', 'C', CR)],
			lmgs: [
				p('finn-lmg', 'B', { ...LR, verified: false, note: 'wzstats rates it A, codmunity only D.' }),
				p('apoc-338', 'C', {
					...LR,
					verified: false,
					note: 'wzstats rates it A, codmunity only D (it was nerfed in Season 1).'
				}),
				p('type-73', 'D', LR)
			],
			'marksman-rifles': [p('mosin-nagant', 'A', SN), p('oris-8-6', 'C', LR), p('mar-9', 'D', LR)],
			'sniper-rifles': [
				p('kg-7-vulcan', 'A', SN),
				p('astaroth-57', 'A', {
					...SN,
					verified: false,
					note: 'wzhub rates it top tier and wzstats A, but codmunity only C.'
				}),
				p('signal-50', 'C', { ...SN, verified: false, note: 'wzstats rates it A, codmunity only D.' })
			],
			pistols: [p('krait-p68', 'B', SEC), p('sang-9mm', 'C', SEC), p('mojave-357', 'D', SEC), p('50-gs', 'D', SEC)]
		}
	}
};

export interface MetaList {
	/** 'overall' or a class id. */
	key: string;
	/** The class name, or null for the overall list. */
	className: string | null;
	/** The first META_TOP picks. */
	picks: MetaPick[];
}

/** The lists the page shows for one mode: overall first, then the classes in weapons.ts order. */
export function metaLists(mode: LoadoutMode): MetaList[] {
	const board = META_RANKS[mode];
	return [
		{ key: 'overall', className: null, picks: board.overall.slice(0, META_TOP) },
		...CLASSES.filter((c) => board.classes[c.id]?.length).map((c) => ({
			key: c.id,
			className: c.name,
			picks: board.classes[c.id].slice(0, META_TOP)
		}))
	];
}

/** The weapon's name, for the page (the data only holds ids). */
export const metaName = (id: string): string => WEAPON_BY_ID.get(id)?.name ?? id;
