// Auto spin on every slot machine (src/lib/autoSpin.ts): the counts you can pick (1,000 added 2026-11-21) and the
// one remembered per device. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanCount, AUTO_COUNTS, AUTO_DEFAULT } from '../src/lib/autoSpin.ts';
import { t } from '../src/lib/i18n/en.ts';

test('the counts: 10, 25, 50, 100 and 1,000, default 25', () => {
	assert.deepEqual([...AUTO_COUNTS], [10, 25, 50, 100, 1000]);
	assert.ok(AUTO_COUNTS.includes(AUTO_DEFAULT));
});

test('a remembered count is one of the counts, anything else is the default', () => {
	for (const n of AUTO_COUNTS) {
		assert.equal(cleanCount(n), n);
		assert.equal(cleanCount(String(n)), n);
	}
	for (const bad of [null, undefined, '', 'abc', 0, 37, 5000, -10, '1,000', {}, Number.NaN]) assert.equal(cleanCount(bad), AUTO_DEFAULT, String(bad));
});

test('the button texts read right with big numbers', () => {
	const a = t.casino.autoSpin;
	assert.equal(a.start(1000), 'Auto · 1,000');
	assert.equal(a.stop(999), 'Stop · 999 left');
	assert.equal(a.stop(1000), 'Stop · 1,000 left');
	assert.equal(a.count(1000), '1,000 auto spins');
});
