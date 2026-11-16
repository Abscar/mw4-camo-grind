// The squad's Ranked board (src/lib/squad-ranked.ts) and how SR travels in the squad document
// (squad-codec.ts `ranked`). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	RANKED_DAYS,
	cleanRanked,
	cleanRankedSnap,
	fmtSrDelta,
	mergeRanked,
	parseWhole,
	rankedView,
	rankOf,
	rankRanked,
	toNext,
	withRanked
} from '../src/lib/squad-ranked.ts';
import { fromSquadWire, memberEntry, toSquadWire } from '../src/lib/squad-codec.ts';

const T = Date.UTC(2026, 10, 16, 18);
const DAY = 86_400_000;

test('typed SR: whole numbers with separators, in range', () => {
	assert.equal(parseWhole('', 99_999), null);
	assert.equal(parseWhole('2450', 99_999), 2450);
	assert.equal(parseWhole('2,450', 99_999), 2450);
	assert.equal(parseWhole('2 450', 99_999), 2450);
	assert.equal(parseWhole('#37', 250, 1), 37);
	assert.equal(parseWhole('0', 250, 1), 'bad');
	assert.equal(parseWhole('251', 250, 1), 'bad');
	assert.equal(parseWhole('-5', 99_999), 'bad');
	assert.equal(parseWhole('12.5k', 99_999), 'bad');
	assert.equal(parseWhole('100000', 99_999), 'bad');
});

test("rank from SR on last year's table", () => {
	assert.equal(rankOf(0).label, 'Bronze I');
	assert.equal(rankOf(299).label, 'Bronze I');
	assert.equal(rankOf(300).label, 'Bronze II');
	assert.equal(rankOf(899).label, 'Bronze III');
	assert.equal(rankOf(900).label, 'Silver I');
	assert.equal(rankOf(2450).label, 'Gold I');
	assert.equal(rankOf(2600).label, 'Gold II');
	assert.equal(rankOf(5399).label, 'Platinum III');
	assert.equal(rankOf(9100).label, 'Crimson III');
	assert.equal(rankOf(10000).label, 'Iridescent');
	assert.equal(rankOf(15000).division, null);
	assert.equal(rankOf(12000, 37).label, 'Top 250 · #37');
	assert.ok(rankOf(12000, 37).level > rankOf(12000).level);
	assert.ok(rankOf(2100).level > rankOf(2099).level);
});

test('SR to the next division / tier', () => {
	assert.deepEqual(toNext(2450), { sr: 150, label: 'Gold II' });
	assert.deepEqual(toNext(899), { sr: 1, label: 'Silver I' });
	assert.deepEqual(toNext(9500), { sr: 500, label: 'Iridescent' });
	assert.equal(toNext(10000), null);
});

test('cleaning: bad entries dropped, newest days kept', () => {
	assert.equal(cleanRankedSnap({ sr: 2450 }), null, 'needs a time');
	assert.equal(cleanRankedSnap({ sr: -1, at: T }), null);
	assert.equal(cleanRankedSnap({ sr: 2.5, at: T }), null);
	assert.deepEqual(cleanRankedSnap({ sr: 2450, top: 300, at: T }), { sr: 2450, at: T }, 'a top place over 250 is dropped');
	assert.deepEqual(cleanRankedSnap({ sr: 11000, top: 12, at: T + 0.4 }), { sr: 11000, top: 12, at: T });
	assert.equal(cleanRanked('x'), undefined);
	assert.equal(cleanRanked({ nope: { sr: 1, at: T } }), undefined);
	const many = Object.fromEntries(Array.from({ length: 14 }, (_, i) => [`2026-11-${String(i + 1).padStart(2, '0')}`, { sr: 100 * i, at: T + i }]));
	const clean = cleanRanked(many);
	assert.equal(Object.keys(clean).length, RANKED_DAYS);
	assert.ok(clean['2026-11-14'] && !clean['2026-11-04']);
});

test('same day replaces, two devices merge (later wins per day)', () => {
	let log = withRanked(undefined, '2026-11-15', { sr: 2200, at: T - DAY });
	log = withRanked(log, '2026-11-16', { sr: 2400, at: T });
	log = withRanked(log, '2026-11-16', { sr: 2450, at: T + 60_000 });
	assert.equal(Object.keys(log).length, 2);
	assert.equal(log['2026-11-16'].sr, 2450);
	const other = { '2026-11-16': { sr: 2500, at: T + 120_000 }, '2026-11-14': { sr: 2000, at: T - 2 * DAY } };
	const merged = mergeRanked(log, other);
	assert.equal(merged['2026-11-16'].sr, 2500);
	assert.equal(merged['2026-11-14'].sr, 2000);
	assert.equal(merged['2026-11-15'].sr, 2200);
	assert.deepEqual(mergeRanked(other, log), merged);
});

test('view: latest SR, rank and the change since the update before', () => {
	assert.equal(rankedView(undefined), null);
	assert.equal(rankedView({}), null);
	const one = rankedView({ '2026-11-16': { sr: 2450, at: T } });
	assert.equal(one.rank.label, 'Gold I');
	assert.equal(one.before, null);
	const two = rankedView({ '2026-11-15': { sr: 2050, at: T - DAY }, '2026-11-16': { sr: 2300, at: T } });
	assert.equal(two.before.delta, 250);
	assert.equal(two.before.rank.label, 'Silver III');
	assert.equal(two.rank.label, 'Gold I');
	assert.equal(fmtSrDelta(250), '+250');
	assert.equal(fmtSrDelta(-1200), '−1,200');
	assert.equal(fmtSrDelta(0), '±0');
});

test('board order: Top 250 place first, then SR, members without SR last', () => {
	const v = (sr, top) => rankedView({ '2026-11-16': { sr, at: T, ...(top ? { top } : {}) } });
	const rows = rankRanked([
		{ name: 'Lars', view: null },
		{ name: 'Abscar', view: v(2450) },
		{ name: 'Jeeven', view: v(10400, 180) },
		{ name: 'Phillestar', view: v(10900) },
		{ name: 'Ingman', view: null }
	]);
	assert.deepEqual(rows.map((r) => r.name), ['Jeeven', 'Phillestar', 'Abscar', 'Ingman', 'Lars']);
});

test('SR travels in the squad document and an older entry without it reads fine', () => {
	const me = { name: 'Abscar', op: 'abscar' };
	const progress = { weapons: {}, mastery: {}, lastTickAt: null };
	const ranked = { '2026-11-16': { sr: 2450, at: T } };
	const entry = memberEntry(me, progress, T, false, { ranked });
	assert.deepEqual(entry.ranked, ranked);
	const doc = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: { abcdefgh1234: entry } }))));
	assert.deepEqual(doc.members.abcdefgh1234.ranked, ranked);
	assert.equal(doc.members.abcdefgh1234.more, undefined, 'ranked is a known field');
	const old = memberEntry(me, progress, T);
	assert.equal(old.ranked, undefined);
});
