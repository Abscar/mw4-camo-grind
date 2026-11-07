// Checks of the COD headlines: feed reading, the news.json shape and merging. `npm test`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { mergeHeadlines, readNews, sameHeadlines } from '../src/lib/news-codec.ts';
import { PATCH_TITLE, SOURCES, parseFeed, pickPatches } from './news-feeds.js';

const NOW = Date.parse('2026-11-07T12:00:00Z');
const codOnly = { name: 'Dexerto', url: 'https://www.dexerto.com/call-of-duty/', all: true };
const general = { name: 'Windows Central', url: 'https://www.windowscentral.com/' };

const rss = (...items) =>
	`<?xml version="1.0"?><rss><channel><title>Feed</title>${items
		.map(
			([title, link, date]) =>
				`<item><title><![CDATA[${title}]]></title><link>${link}</link><pubDate>${date}</pubDate></item>`
		)
		.join('')}</channel></rss>`;

test('news feeds: COD-only feeds keep every item, general feeds only COD titles', () => {
	const xml = rss(
		['Warzone Season 1 is live', 'https://www.windowscentral.com/gaming/warzone-s1', 'Sat, 07 Nov 2026 10:00:00 GMT'],
		['Best Xbox headsets', 'https://www.windowscentral.com/gaming/headsets', 'Sat, 07 Nov 2026 09:00:00 GMT'],
		['MW4 ranked play changes', 'https://www.windowscentral.com/gaming/mw4-ranked', 'Sat, 07 Nov 2026 08:00:00 GMT']
	);
	assert.deepEqual(
		parseFeed(xml, general, NOW).map((i) => i.title),
		['Warzone Season 1 is live', 'MW4 ranked play changes']
	);
	const dexerto = rss(['Some Activision story', 'https://www.dexerto.com/call-of-duty/story', 'Sat, 07 Nov 2026 10:00:00 GMT']);
	assert.equal(parseFeed(dexerto, codOnly, NOW).length, 1);
});

test('news feeds: entities are decoded, dates become ISO, the source name is attached', () => {
	const xml = rss(['Black Ops &amp; Warzone &#8211; what&#039;s new', 'https://www.dexerto.com/call-of-duty/x', 'Sat, 07 Nov 2026 10:00:00 GMT']);
	assert.deepEqual(parseFeed(xml, codOnly, NOW), [
		{
			title: "Black Ops & Warzone – what's new",
			url: 'https://www.dexerto.com/call-of-duty/x',
			date: '2026-11-07T10:00:00.000Z',
			source: 'Dexerto'
		}
	]);
});

test('news feeds: links to other sites, plain http, bad dates and future posts are dropped', () => {
	const xml = rss(
		['Call of Duty elsewhere', 'https://evil.example/cod', 'Sat, 07 Nov 2026 10:00:00 GMT'],
		['Call of Duty on http', 'http://www.dexerto.com/call-of-duty/a', 'Sat, 07 Nov 2026 10:00:00 GMT'],
		['Call of Duty no date', 'https://www.dexerto.com/call-of-duty/b', 'soon'],
		['Call of Duty tomorrow', 'https://www.dexerto.com/call-of-duty/c', 'Sun, 08 Nov 2026 10:00:00 GMT'],
		['Call of Duty ok', 'https://dexerto.com/call-of-duty/d', 'Sat, 07 Nov 2026 10:00:00 GMT']
	);
	assert.deepEqual(
		parseFeed(xml, codOnly, NOW).map((i) => i.title),
		['Call of Duty ok']
	);
});

test('news file: the old one-source format still reads, broken entries are dropped', () => {
	const old = readNews({
		source: 'Dexerto',
		sourceUrl: 'https://www.dexerto.com/call-of-duty/',
		items: [
			{ title: 'A', url: 'https://www.dexerto.com/a', date: '2026-11-06T10:00:00.000Z' },
			{ title: 'B', url: 'javascript:alert(1)', date: '2026-11-06T10:00:00.000Z' },
			{ title: '', url: 'https://www.dexerto.com/c', date: '2026-11-06T10:00:00.000Z' },
			{ title: 'D', url: 'https://www.dexerto.com/d', date: 'yesterday' },
			null
		]
	});
	assert.deepEqual(old?.sources, [{ name: 'Dexerto', url: 'https://www.dexerto.com/call-of-duty/' }]);
	assert.deepEqual(old?.items, [{ title: 'A', url: 'https://www.dexerto.com/a', date: '2026-11-06T10:00:00.000Z', source: 'Dexerto' }]);
	assert.deepEqual(old?.patches, []);
	assert.equal(readNews(null), null);
	assert.equal(readNews({ items: 'nope' }), null);
});

test('news file: merging keeps the newest first, one per link, fresh copies win, capped', () => {
	const h = (url, date, title = url) => ({ title, url, date, source: 'Dexerto' });
	const old = [h('https://x.test/2', '2026-11-05T00:00:00.000Z', 'old title'), h('https://x.test/1', '2026-11-04T00:00:00.000Z')];
	const fresh = [h('https://x.test/3', '2026-11-06T00:00:00.000Z'), h('https://x.test/2', '2026-11-05T00:00:00.000Z', 'new title')];
	const merged = mergeHeadlines(fresh, old, 2);
	assert.deepEqual(
		merged.map((i) => [i.url, i.title]),
		[
			['https://x.test/3', 'https://x.test/3'],
			['https://x.test/2', 'new title']
		]
	);
	assert.ok(sameHeadlines(merged, mergeHeadlines(fresh, old, 2)));
	assert.ok(!sameHeadlines(merged, old));
});

test('news buddy: nerf / buff / TTK / movement titles count, other COD news does not', () => {
	for (const title of [
		'All weapon buffs and nerfs in Modern Warfare 4 & Warzone Season 1',
		'Modern Warfare 4 devs increase TTK by nerfing meta weapons following backlash',
		'New Warzone Assault Rifle has fastest TTK in the game with no recoil',
		'Warzone devs confirm divisive Grappling Hooks are being removed',
		'MW4 Season 1 patch notes: slide cancel is back',
		'One-shot Modern Warfare 4 rifle is a throwback to one of CoD’s most OP weapons'
	])
		assert.ok(PATCH_TITLE.test(title), title);
	for (const title of [
		'Modern Warfare 4 Season 1 adds terrifying new DMZ map and missions',
		'OpTic Gaming win Black Ops 7 EWC 2026: Full results',
		'Call of Duty: Modern Warfare 4 review – A few maps short of a classic',
		'Modern Warfare 4 boss responds to SBMM backlash as players call it “miserable”'
	])
		assert.ok(!PATCH_TITLE.test(title), title);
});

test('news buddy: nerf/buff headlines are newest first, at most 60 days old, old ones kept', () => {
	const h = (title, date, url = `https://www.dexerto.com/${date}`) => ({ title, url, date, source: 'Dexerto' });
	const fresh = [h('Map pack out now', '2026-11-06T00:00:00.000Z'), h('Sniper nerfs are live', '2026-11-05T00:00:00.000Z')];
	const old = [h('SMG buffs coming', '2026-10-20T00:00:00.000Z'), h('Recoil patch notes', '2026-08-01T00:00:00.000Z')];
	assert.deepEqual(
		pickPatches(fresh, old, NOW).map((i) => i.title),
		['Sniper nerfs are live', 'SMG buffs coming']
	);
});

test('news file: the committed news.json is readable and only uses the listed sites', () => {
	const file = readNews(JSON.parse(readFileSync(new URL('../src/lib/data/news.json', import.meta.url), 'utf8')));
	assert.ok(file && file.items.length > 0, 'news.json has headlines');
	const names = new Set(SOURCES.map((s) => s.name));
	for (const item of [...file.items, ...file.patches]) assert.ok(names.has(item.source), `unknown source ${item.source}`);
	for (const item of file.patches) assert.ok(PATCH_TITLE.test(item.title), `not a nerf/buff headline: ${item.title}`);
});

test('news feeds: every source has a name, a site address and an https feed', () => {
	for (const s of SOURCES) {
		assert.ok(s.name && /^https:\/\//.test(s.url) && /^https:\/\//.test(s.feed), s.name);
		assert.equal(new URL(s.feed).hostname.replace(/^www\./, ''), new URL(s.url).hostname.replace(/^www\./, ''), s.name);
	}
});
