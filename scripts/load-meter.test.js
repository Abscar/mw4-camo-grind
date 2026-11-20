// The net_graph's busy share (src/lib/loadMeter.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IdleMeter, loadBand } from '#lib/loadMeter.ts';

test('a page that is idle all the time reads 0 % busy', () => {
	const m = new IdleMeter(0);
	for (let t = 0; t < 1000; t += 50) m.idle(t, 50);
	assert.equal(m.take(1000), 0);
});

test('idle stretches of 4 ms per 16 ms frame read 75 % busy', () => {
	const m = new IdleMeter(0);
	for (let t = 12; t < 1000; t += 16) m.idle(t, 4);
	const busy = m.take(1000);
	assert.ok(busy >= 74 && busy <= 76, String(busy));
});

test('two callbacks inside one idle stretch count it once', () => {
	const m = new IdleMeter(0);
	m.idle(0, 50);
	m.idle(10, 40); // same stretch, asked again
	m.idle(30, 20);
	assert.equal(m.take(100), 50);
});

test('idle that runs past the window counts in the next one', () => {
	const m = new IdleMeter(0);
	m.idle(80, 50); // 80 → 130, window ends at 100
	assert.equal(m.take(100), 80); // 20 ms idle of 100
	assert.equal(m.take(200), 70); // 30 ms carried over, of 100
});

test('no idle callbacks at all = fully busy; nothing elapsed = 0', () => {
	const m = new IdleMeter(0);
	assert.equal(m.take(500), 100);
	assert.equal(m.take(500), 0);
});

test('colour bands', () => {
	assert.equal(loadBand(10), 'ok');
	assert.equal(loadBand(50), 'warn');
	assert.equal(loadBand(90), 'bad');
});
