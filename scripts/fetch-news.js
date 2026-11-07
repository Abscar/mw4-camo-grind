// Fetches the latest Call of Duty headlines from a few news sites' RSS feeds (see news-feeds.js),
// so the page can show them without any server. Writes the same file twice:
//   src/lib/data/news.json  baked into the page (shows at once, also offline; committed)
//   static/news.json        published as …/news.json, so an open page and the offline file can
//                           pick up newer headlines (made fresh by every build, not committed)
// Runs on GitHub every hour (.github/workflows/deploy.yml). Never fails: on any problem the
// headlines the website already shows are kept.
//
// It starts from the headlines the website is showing now (falling back to the local file), adds
// the new ones and keeps the newest 20 (`items`, the news box) plus the newest nerf / buff /
// movement headlines of the last 60 days (`patches`, the news buddy). On GitHub it reports
// `changed=true|false` as a step output, so an hour without news skips the rebuild.
// Usage: node scripts/fetch-news.js
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { MAX_HEADLINES, mergeHeadlines, readNews, sameHeadlines } from '#lib/news-codec.ts';
import { SITE_URL } from '#lib/site.ts';
import { SOURCES, parseFeed, pickPatches } from './news-feeds.js';

const BAKED = new URL('../src/lib/data/news.json', import.meta.url);
const PUBLISHED = new URL('../static/news.json', import.meta.url);
const LIVE = new URL('news.json', SITE_URL).href;
const UA = 'mw4-camo-grind (personal camo tracker; checks a few headlines once an hour)';

async function get(url, accept) {
	const res = await fetch(url, { headers: { 'user-agent': UA, accept }, signal: AbortSignal.timeout(20_000) });
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.text();
}

/** What the website shows now, or else the local file (first run, site unreachable). */
async function startingPoint() {
	try {
		const live = readNews(JSON.parse(await get(LIVE, 'application/json')));
		if (live) return { news: live, from: 'website' };
	} catch {
		// not published yet, or offline
	}
	try {
		return { news: readNews(JSON.parse(readFileSync(BAKED, 'utf8'))), from: 'local file' };
	} catch {
		return { news: null, from: 'nothing' };
	}
}

function save(items, patches) {
	const sources = SOURCES.map(({ name, url }) => ({ name, url }));
	const json = JSON.stringify({ fetchedAt: new Date().toISOString(), sources, items, patches }, null, '\t') + '\n';
	writeFileSync(BAKED, json);
	mkdirSync(new URL('.', PUBLISHED), { recursive: true });
	writeFileSync(PUBLISHED, json);
}

function report(changed) {
	try {
		if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
	} catch {
		// not on GitHub
	}
}

const { news: before, from } = await startingPoint();
const known = new Set(SOURCES.map((s) => s.name));
const old = (before?.items ?? []).filter((i) => known.has(i.source));
const oldPatches = (before?.patches ?? []).filter((i) => known.has(i.source));

try {
	const results = await Promise.allSettled(
		SOURCES.map(async (s) => parseFeed(await get(s.feed, 'application/rss+xml, application/xml, text/xml'), s))
	);
	const fresh = results.flatMap((r, i) => {
		const name = SOURCES[i].name;
		if (r.status === 'rejected') {
			console.warn(`news: ${name} failed (${r.reason instanceof Error ? r.reason.message : r.reason})`);
			return [];
		}
		console.log(`news: ${name}: ${r.value.length} COD headlines`);
		return r.value;
	});
	if (fresh.length === 0) throw new Error('no headlines from any site');

	const items = mergeHeadlines(fresh, old, MAX_HEADLINES);
	const patches = pickPatches(fresh, [...oldPatches, ...old]);
	const changed = !sameHeadlines(items, before?.items ?? []) || !sameHeadlines(patches, before?.patches ?? []);
	save(items, patches);
	console.log(
		`news: ${changed ? 'new headlines' : 'nothing new'} (started from the ${from}); ${items.length} kept, newest ${items[0].date}; ${patches.length} nerf/buff headlines`
	);
	report(changed);
} catch (error) {
	console.warn(`news: kept the old headlines from the ${from} (${error instanceof Error ? error.message : error})`);
	try {
		if (old.length > 0) save(old, oldPatches);
	} catch {
		// keep whatever files are there
	}
	report(false);
}
