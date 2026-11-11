// The season countdown data and its day maths (2026-11-11): `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SEASON, SEASON_EVENTS, dayNumber, seasonView } from '../src/lib/data/season.ts';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

test('season data: whole-day dates, end after start, every guess says where it comes from', () => {
	assert.match(SEASON.start, DAY);
	assert.match(SEASON.end, DAY);
	assert.ok(dayNumber(SEASON.end) > dayNumber(SEASON.start));
	const facts = [SEASON.endFact, ...SEASON_EVENTS.map((e) => e.fact)];
	for (const f of facts) assert.ok(f.note && f.note.length > 20, `${f.text}: needs a source note`);
	for (const e of SEASON_EVENTS) {
		assert.ok(e.on || e.when, `${e.id}: needs a date or a "when"`);
		if (e.on) assert.match(e.on, DAY);
	}
	assert.equal(new Set(SEASON_EVENTS.map((e) => e.id)).size, SEASON_EVENTS.length);
});

test('season view: day 1 on the first day, last day, after the end', () => {
	const s = { name: 'S', start: '2026-11-06', end: '2026-11-15', endFact: { text: '', verified: true } };
	assert.deepEqual(seasonView(dayNumber('2026-11-06'), s), { day: 1, length: 10, daysLeft: 9, share: 0.1, ended: false });
	assert.equal(seasonView(dayNumber('2026-11-15'), s).daysLeft, 0);
	assert.equal(seasonView(dayNumber('2026-11-16'), s).ended, true);
	assert.equal(seasonView(dayNumber('2026-11-01'), s).share, 0);
});

test('day numbers ignore month lengths and leap years', () => {
	assert.equal(dayNumber('2027-01-01') - dayNumber('2026-12-31'), 1);
	assert.equal(dayNumber('2028-03-01') - dayNumber('2028-02-28'), 2);
});
