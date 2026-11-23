/**
 * Abscars Madness' skill tree (2026-11-23, the user: "skilltree med olika coola abilities man kan låsa upp").
 * Three branches; each skill needs the one before it in its branch. Points come from the levels (levels.ts:
 * 2 for the first clear, +1 for killing everyone, +1 for no deaths), so the total is worked out, never stored.
 * Everyone already has a double jump, a dash, wall jumps and a ground slam (engine.ts); the Movement branch
 * builds on them. Pure: the engine reads the unlocked set, the page draws the tree.
 */
export type SkillId = 'triple' | 'airdash' | 'dashhit' | 'quake' | 'aim' | 'frag' | 'mags' | 'head' | 'skin' | 'lungs' | 'regen' | 'wind';

export interface Skill {
	id: SkillId;
	branch: 'move' | 'gun' | 'holk';
	name: string;
	what: string;
	cost: number;
	/** the skill that has to be unlocked first */
	needs: SkillId | null;
	/** key hint for actives */
	key?: string;
}

export const SKILLS: Skill[] = [
	{ id: 'triple', branch: 'move', name: 'Triple Jump', what: 'A third jump in mid-air.', cost: 1, needs: null, key: 'Jump three times' },
	{ id: 'airdash', branch: 'move', name: 'Air Dash', what: 'Dash twice before you land, and dash again sooner.', cost: 2, needs: 'triple', key: 'C' },
	{ id: 'dashhit', branch: 'move', name: 'Dash Strike', what: 'Dash straight through enemies: they get hit and knocked away.', cost: 2, needs: 'airdash', key: 'C into enemies' },
	{ id: 'quake', branch: 'move', name: 'Earthquake Slam', what: 'Your ground slam hits twice as hard, twice as wide and stuns.', cost: 3, needs: 'dashhit', key: 'S in the air' },
	{ id: 'aim', branch: 'gun', name: 'Steady Aim', what: 'Your bullets hit 20 % harder.', cost: 1, needs: null },
	{ id: 'frag', branch: 'gun', name: 'Frag Grenades', what: '3 grenades, refilled at every checkpoint.', cost: 2, needs: 'aim', key: 'G' },
	{ id: 'mags', branch: 'gun', name: 'Extended Mags', what: '50 % more ammo in every gun you pick up.', cost: 2, needs: 'frag' },
	{ id: 'head', branch: 'gun', name: 'Headhunter', what: 'Headshots hit 2.5× and give a bullet back.', cost: 3, needs: 'mags' },
	{ id: 'skin', branch: 'holk', name: 'Thick Plating', what: '+40 max health.', cost: 1, needs: null },
	{ id: 'lungs', branch: 'holk', name: 'Holk Lungs', what: 'Holk Time lasts much longer.', cost: 2, needs: 'skin' },
	{ id: 'regen', branch: 'holk', name: 'Self Repair', what: 'Heal slowly when you haven’t been hit for a few seconds.', cost: 2, needs: 'lungs' },
	{ id: 'wind', branch: 'holk', name: 'Second Wind', what: 'Once per checkpoint, a killing hit leaves you at 1 health.', cost: 3, needs: 'regen' }
];

export const SKILL_BY_ID = new Map(SKILLS.map((s) => [s.id, s]));
export const BRANCHES = [
	{ id: 'move', name: 'Movement', colour: '#4ad8ff' },
	{ id: 'gun', name: 'Firepower', colour: '#ff7a2a' },
	{ id: 'holk', name: 'Holk & Body', colour: '#9dff2e' }
] as const;

export const skillCost = (ids: Iterable<SkillId>) => [...ids].reduce((n, id) => n + (SKILL_BY_ID.get(id)?.cost ?? 0), 0);

/** Can this skill be bought now? */
export function canBuy(id: SkillId, have: Set<SkillId>, free: number): 'ok' | 'owned' | 'locked' | 'poor' {
	const s = SKILL_BY_ID.get(id);
	if (!s) return 'locked';
	if (have.has(id)) return 'owned';
	if (s.needs && !have.has(s.needs)) return 'locked';
	return s.cost <= free ? 'ok' : 'poor';
}

/** Keep only known skills whose chain is complete (a saved list from an older page stays valid). */
export function cleanSkills(list: unknown): SkillId[] {
	if (!Array.isArray(list)) return [];
	const set = new Set(list.filter((x): x is SkillId => typeof x === 'string' && SKILL_BY_ID.has(x as SkillId)));
	const ok: SkillId[] = [];
	for (const s of SKILLS) if (set.has(s.id) && (!s.needs || ok.includes(s.needs))) ok.push(s.id);
	return ok;
}
