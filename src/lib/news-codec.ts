/**
 * Pure helpers for the COD headlines (static/news.json): checking the file's shape and merging
 * new headlines into old ones. Shared by scripts/fetch-news.js (Node) and the page.
 */

export interface Headline {
	title: string;
	url: string;
	/** ISO date the article was published. */
	date: string;
	/** Name of the news site, e.g. "Dexerto". */
	source: string;
}

export interface NewsSource {
	name: string;
	url: string;
}

export interface NewsFile {
	fetchedAt: string;
	sources: NewsSource[];
	/** The newest COD headlines (the news box). */
	items: Headline[];
	/** The newest nerf / buff / movement / patch headlines (the news buddy), kept longer. */
	patches: Headline[];
}

/** How many headlines news.json keeps. */
export const MAX_HEADLINES = 20;
/** How many nerf/buff headlines news.json keeps, and for how long. */
export const MAX_PATCHES = 8;
export const PATCH_MAX_AGE_DAYS = 60;

const isText = (x: unknown): x is string => typeof x === 'string' && x.trim() !== '';
const isWebLink = (x: unknown): x is string => isText(x) && /^https:\/\/[^\s"<>]+$/.test(x);

/** The usable headlines in a list: missing title, a link that isn't https:// or a bad date are dropped. */
function readHeadlines(list: unknown, fallbackSource: string): Headline[] {
	if (!Array.isArray(list)) return [];
	return list.flatMap((i): Headline[] => {
		if (typeof i !== 'object' || i === null) return [];
		const { title, url, date, source = fallbackSource } = i as Record<string, unknown>;
		if (!isText(title) || !isWebLink(url) || !isText(date) || !isText(source)) return [];
		const ms = Date.parse(date);
		if (!Number.isFinite(ms)) return [];
		return [{ title: title.trim(), url, date: new Date(ms).toISOString(), source }];
	});
}

/**
 * The news file in a known-good shape, or null if it is unusable. Files from before 2026-11-07
 * had one source for all headlines (`{ source, sourceUrl, items }`) and no `patches`; those
 * still read fine.
 */
export function readNews(raw: unknown): NewsFile | null {
	if (typeof raw !== 'object' || raw === null) return null;
	const r = raw as Record<string, unknown>;
	if (!Array.isArray(r.items)) return null;

	const sources: NewsSource[] = Array.isArray(r.sources)
		? r.sources.filter(
				(s): s is NewsSource => typeof s === 'object' && s !== null && isText(s.name) && isWebLink(s.url)
			)
		: isText(r.source) && isWebLink(r.sourceUrl)
			? [{ name: r.source, url: r.sourceUrl }]
			: [];
	const fallbackSource = isText(r.source) ? r.source : '';

	return {
		fetchedAt: isText(r.fetchedAt) ? r.fetchedAt : '',
		sources,
		items: readHeadlines(r.items, fallbackSource),
		patches: readHeadlines(r.patches, fallbackSource)
	};
}

/** Newest first, one entry per link (when a link is in both lists, the fresh copy wins), at most `max`. */
export function mergeHeadlines(fresh: Headline[], old: Headline[], max = MAX_HEADLINES): Headline[] {
	const byUrl = new Map<string, Headline>();
	for (const item of [...fresh, ...old]) if (!byUrl.has(item.url)) byUrl.set(item.url, item);
	return [...byUrl.values()].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, max);
}

/** True when two lists show the same headlines in the same order. */
export function sameHeadlines(a: Headline[], b: Headline[]): boolean {
	return a.length === b.length && a.every((x, i) => x.url === b[i].url && x.title === b[i].title && x.date === b[i].date);
}
