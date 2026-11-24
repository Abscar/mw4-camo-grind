/**
 * "Hide" buttons (2026-11-20, the user: "give every section a way to hide … if people only want to see metas
 * and camos and nothing else they should"). Every part of the page that can be hidden, in page order, with
 * the group it's listed under in the "What to show" list (HiddenBar). Remembered per device
 * (hidden.svelte.ts), never in saves, backups, links or sync.
 *
 * The ids are stored: never rename or reuse one (an unknown saved id is just dropped by cleanHidden).
 * Pure, so the tests can run it (scripts/hide-sections.test.js).
 */

export type HideGroup = 'header' | 'grind' | 'pictures' | 'tabs';

export const HIDE_SECTIONS = [
	// the top of the page (Abscar's header extras; the title itself always stays)
	{ id: 'squad', group: 'header', abscar: true },
	{ id: 'tv', group: 'header', abscar: true },
	{ id: 'buddy', group: 'header', abscar: true },
	{ id: 'whatsNew', group: 'header' },
	{ id: 'madness', group: 'header' },
	// Burgi City, the map over the page tabs (2026-11-23)
	{ id: 'city', group: 'header' },
	// the Camo grind tab, top to bottom
	{ id: 'news', group: 'grind' },
	{ id: 'season', group: 'grind' },
	{ id: 'kpi', group: 'grind' },
	{ id: 'camos', group: 'grind' },
	{ id: 'classMeta', group: 'grind', parent: 'camos' },
	{ id: 'mastery', group: 'grind' },
	{ id: 'masteryMp', group: 'grind', parent: 'mastery' },
	{ id: 'masteryWz', group: 'grind', parent: 'mastery' },
	{ id: 'masteryDmz', group: 'grind', parent: 'mastery' },
	{ id: 'metaTop', group: 'grind' },
	{ id: 'meta', group: 'grind' },
	{ id: 'sights', group: 'grind' },
	{ id: 'sync', group: 'grind' },
	{ id: 'help', group: 'grind' },
	// the user's own pictures under Meta top 5 (Abscar only), in page order
	{ id: 'picNuke', group: 'pictures', abscar: true },
	{ id: 'picLars', group: 'pictures', abscar: true },
	{ id: 'picCyborg', group: 'pictures', abscar: true },
	{ id: 'picCrown', group: 'pictures', abscar: true },
	{ id: 'picWizard', group: 'pictures', abscar: true },
	{ id: 'picDoomsday', group: 'pictures', abscar: true },
	{ id: 'picScooter', group: 'pictures', abscar: true },
	{ id: 'picJoker', group: 'pictures', abscar: true },
	// whole page tabs (Camo grind itself can't be hidden: it's where the page opens)
	{ id: 'tabRanked', group: 'tabs' },
	{ id: 'tabCosmetics', group: 'tabs' },
	{ id: 'tabSquad', group: 'tabs' },
	{ id: 'tabCasino', group: 'tabs' },
	{ id: 'tabShop', group: 'tabs' },
	{ id: 'tabArcade', group: 'tabs' }
] as const satisfies readonly { id: string; group: HideGroup; abscar?: boolean; parent?: string }[];

/** A part that lives inside another one (listed under it; hiding the outer one hides it too). */
export const PARENT: Partial<Record<string, HideId>> = Object.fromEntries(
	HIDE_SECTIONS.flatMap((s) => ('parent' in s ? [[s.id, s.parent]] : []))
);

export type HideId = (typeof HIDE_SECTIONS)[number]['id'];

export const HIDE_GROUPS: readonly HideGroup[] = ['header', 'grind', 'pictures', 'tabs'];

const KNOWN = new Set<string>(HIDE_SECTIONS.map((s) => s.id));

export const isHideId = (x: unknown): x is HideId => typeof x === 'string' && KNOWN.has(x);

/** The ids of one group, in page order. */
export const idsIn = (group: HideGroup): HideId[] => HIDE_SECTIONS.filter((s) => s.group === group).map((s) => s.id);

/** Only known ids, each once, in page order. Anything else (old ids, junk, not a list) is dropped. */
export function cleanHidden(raw: unknown): HideId[] {
	if (!Array.isArray(raw)) return [];
	const want = new Set(raw.filter(isHideId));
	return HIDE_SECTIONS.map((s) => s.id).filter((id) => want.has(id));
}

/**
 * "Only camos & metas": the progress tiles, the camo list (+ the class meta above it), Divergence & all
 * three Mastery tracks, Absolute meta and Meta top 5 stay; everything else goes, the other tabs too.
 */
export const KEEP_CAMOS_META: readonly HideId[] = [
	'kpi',
	'camos',
	'classMeta',
	'mastery',
	'masteryMp',
	'masteryWz',
	'masteryDmz',
	'metaTop',
	'meta',
	'sights'
];

export const onlyCamosMeta = (): HideId[] => HIDE_SECTIONS.map((s) => s.id).filter((id) => !KEEP_CAMOS_META.includes(id));

export type HeaderPart = 'squad' | 'title' | 'tv' | 'buddy';

/**
 * Abscar's header grid without the hidden parts (the title always stays), as grid-template-areas for its
 * three layouts: phones (one column), 820–1139 px (TV beside title + buddy) and ≥ 1140 px (TV beside
 * everything). An empty grid row would still keep its 20 px gap, so hidden parts' rows are left out, and
 * without the TV the wide layouts drop to one column.
 */
export function headerAreas(hidden: ReadonlySet<string>) {
	// the buddy's row also holds the "What's new" billboard (2026-11-23): it stays while either is shown
	const on = (p: HeaderPart) => p === 'title' || !hidden.has(p) || (p === 'buddy' && !hidden.has('whatsNew'));
	const left = (['squad', 'title', 'buddy'] as const).filter(on);
	const quote = (row: string[]) => `'${row.join(' ')}'`;
	const phone = (['squad', 'title', 'tv', 'buddy'] as const).filter(on).map((p) => quote([p])).join(' ');
	if (!on('tv')) return { phone, mid: phone, wide: phone, midCols: 'minmax(0, 1fr)', wideCols: 'minmax(0, 1fr)' };
	// 820–1139: the squad frame needs the full width, the TV sits beside the title (+ buddy)
	const mid = [...(on('squad') ? [quote(['squad', 'squad'])] : []), ...left.filter((p) => p !== 'squad').map((p) => quote([p, 'tv']))].join(' ');
	// ≥ 1140: with the squad frame on, the TV ends above the buddy's row, so that row takes the full width
	// (room for the "What's new" billboard beside the buddy, 2026-11-23)
	const wide = left.map((p) => quote(p === 'buddy' && on('squad') ? ['buddy', 'buddy'] : [p, 'tv'])).join(' ');
	return { phone, mid, wide, midCols: 'minmax(0, 1fr) auto', wideCols: 'minmax(0, 1fr) auto' };
}
