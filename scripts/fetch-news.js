// Fetches the latest Call of Duty headlines (Dexerto's COD RSS feed) into src/lib/data/news.json,
// so the page can show them without any server. Runs before the website build on GitHub (daily,
// see .github/workflows/deploy.yml). Never fails the build: on any problem the old file is kept.
// Usage: node scripts/fetch-news.js
import { writeFileSync } from 'node:fs';

const FEED = 'https://www.dexerto.com/call-of-duty/feed/';
const SITE = 'https://www.dexerto.com/';
const OUT = new URL('../src/lib/data/news.json', import.meta.url);
const MAX = 12;

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
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.trim();

const tag = (xml, name) => {
	const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
	return m ? decode(m[1]) : '';
};

try {
	const res = await fetch(FEED, {
		headers: { 'user-agent': 'mw4-camo-grind (personal camo tracker; one headline fetch per day)' },
		signal: AbortSignal.timeout(20_000)
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const xml = await res.text();

	const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
		.map(([, item]) => ({ title: tag(item, 'title'), url: tag(item, 'link'), ms: Date.parse(tag(item, 'pubDate')) }))
		// only real headlines that link back to Dexerto itself
		.filter((i) => i.title && i.url.startsWith(SITE) && Number.isFinite(i.ms))
		.sort((a, b) => b.ms - a.ms)
		.slice(0, MAX)
		.map((i) => ({ title: i.title, url: i.url, date: new Date(i.ms).toISOString() }));
	if (items.length === 0) throw new Error('no headlines in the feed');

	writeFileSync(
		OUT,
		JSON.stringify({ source: 'Dexerto', sourceUrl: `${SITE}call-of-duty/`, fetchedAt: new Date().toISOString(), items }, null, '\t') + '\n'
	);
	console.log(`news: saved ${items.length} headlines, newest ${items[0].date}`);
} catch (error) {
	console.warn(`news: kept the old headlines (${error instanceof Error ? error.message : error})`);
}
