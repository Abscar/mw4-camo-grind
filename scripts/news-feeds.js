// The news sites behind the COD headlines, and how their RSS feeds are read (pure, no network).
// Used by fetch-news.js; tested by news.test.js.
//
// Picked 2026-11-07: feeds that are current, carry COD news and whose robots.txt allows normal
// clients. Charlie Intel itself isn't here: its posts are only on X (the box links there), its
// website's feed stopped in January 2025, and the site asks AI tools to stay away.
import { MAX_PATCHES, PATCH_MAX_AGE_DAYS, mergeHeadlines } from '#lib/news-codec.ts';

/**
 * `all: true` = every item in the feed is COD news (a COD-only feed);
 * otherwise only items whose title is about COD are kept.
 */
export const SOURCES = [
	{ name: 'Dexerto', url: 'https://www.dexerto.com/call-of-duty/', feed: 'https://www.dexerto.com/call-of-duty/feed/', all: true },
	{ name: 'Insider Gaming', url: 'https://insider-gaming.com/', feed: 'https://insider-gaming.com/feed/' },
	{ name: 'Windows Central', url: 'https://www.windowscentral.com/', feed: 'https://www.windowscentral.com/feeds/all' },
	{ name: 'esports.gg', url: 'https://esports.gg/', feed: 'https://esports.gg/feed/' },
	{ name: 'Pure Xbox', url: 'https://www.purexbox.com/', feed: 'https://www.purexbox.com/feeds/latest' }
];

/** A title about Call of Duty. */
export const COD_TITLE = /call of duty|warzone|modern warfare|black ops|\bmw4\b|\bcod\b|verdansk/i;

/**
 * A COD title about balance and gameplay changes: nerfs, buffs, TTK, recoil, movement, patches
 * (the news buddy shows only these, at the user's request 2026-11-07). Tuned on the real feeds.
 */
export const PATCH_TITLE =
	/\bnerf|\bbuff|patch notes|\bpatch(?:ed|es)?\b|hotfix|balanc|movement|\bslide\b|slide[ -]cancel|sprint|mantl|grappl|bunny ?hop|jump ?shot|drop ?shot|\bttk\b|time[ -]to[ -]kill|recoil|aim assist|tuning|weapon changes|\bmeta\b|overpowered|\bop\b/i;

/** The newest nerf/buff headlines from `fresh` and `old`, at most PATCH_MAX_AGE_DAYS old. */
export function pickPatches(fresh, old, now = Date.now()) {
	const cutoff = now - PATCH_MAX_AGE_DAYS * 24 * 60 * 60_000;
	const keep = (list) => list.filter((i) => PATCH_TITLE.test(i.title) && Date.parse(i.date) >= cutoff);
	return mergeHeadlines(keep(fresh), keep(old), MAX_PATCHES);
}

/** Headlines dated further ahead than this (scheduled posts) are skipped until they're out. */
const FUTURE_SLACK_MS = 10 * 60_000;

const decode = (s) =>
	s
		.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
		.replace(/<[^>]+>/g, '')
		.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
		.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.trim();

const tag = (xml, name) => {
	const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
	return m ? decode(m[1]) : '';
};

/** The site's own address, without "www.", for checking that a link really goes there. */
const host = (url) => {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return '';
	}
};

/**
 * The COD headlines in one RSS feed, as `{ title, url, date, source }`.
 * Only links back to the site itself are kept, so a feed can't point the page anywhere else.
 */
export function parseFeed(xml, source, now = Date.now()) {
	const site = host(source.url);
	return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/g)]
		.map(([, item]) => ({ title: tag(item, 'title'), url: tag(item, 'link'), ms: Date.parse(tag(item, 'pubDate')) }))
		.filter(
			(i) =>
				i.title &&
				/^https:\/\//.test(i.url) &&
				host(i.url) === site &&
				Number.isFinite(i.ms) &&
				i.ms <= now + FUTURE_SLACK_MS &&
				(source.all || COD_TITLE.test(i.title))
		)
		.map((i) => ({ title: i.title, url: i.url, date: new Date(i.ms).toISOString(), source: source.name }));
}
