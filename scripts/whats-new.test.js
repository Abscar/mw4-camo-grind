// The "What's new" billboard's list (2026-11-23): ids unique, newest first, valid dates and tabs, "new" pills.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WHATS_NEW, newSince } from '../src/lib/data/whatsNew.ts';

const TABS = new Set(['grind', 'ranked', 'cosmetics', 'casino', 'shop', 'arcade', 'squad', 'madness']);

test('entries: unique ids, real dates, newest first, short texts', () => {
	assert.ok(WHATS_NEW.length > 0);
	assert.equal(new Set(WHATS_NEW.map((e) => e.id)).size, WHATS_NEW.length);
	let prev = '9999-99-99';
	for (const e of WHATS_NEW) {
		assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/, e.id);
		assert.ok(!Number.isNaN(Date.parse(e.date)), e.id);
		assert.ok(e.date <= prev, `${e.id} is out of order`);
		prev = e.date;
		assert.ok(['new', 'update', 'fix'].includes(e.kind), e.id);
		assert.ok(e.title.length > 0 && e.title.length <= 40, `${e.id} title length`);
		assert.ok(e.text.length > 0 && e.text.length <= 140, `${e.id} text length`);
		if (e.tab) assert.ok(TABS.has(e.tab), e.id);
	}
});

test('new since: after the last seen one; first visit = the last days', () => {
	const list = [
		{ id: 'c', date: '2026-11-23', kind: 'new', title: 'c', text: 'c' },
		{ id: 'b', date: '2026-11-22', kind: 'new', title: 'b', text: 'b' },
		{ id: 'a', date: '2026-11-01', kind: 'new', title: 'a', text: 'a' }
	];
	const now = new Date(2026, 10, 23, 12);
	assert.deepEqual([...newSince('b', now, 3, list)], ['c']);
	assert.deepEqual([...newSince('c', now, 3, list)], []);
	assert.deepEqual([...newSince(null, now, 2, list)], ['c', 'b']);
	assert.deepEqual([...newSince('gone', now, 3, list)], ['c', 'b'], 'the 1 Nov one is over two weeks old');
	assert.deepEqual([...newSince(null, new Date(2027, 0, 1), 3, list)], [], 'nothing recent: nothing new');
});
