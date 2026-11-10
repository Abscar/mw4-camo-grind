// Abscar's ticked-box icons (tickIcon in src/lib/ui.ts, drawn by StashTick.svelte).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LADDER } from '../src/lib/data/camos.ts';
import { WEAPONS } from '../src/lib/data/weapons.ts';
import { TICK_ICONS, tickIcon } from '../src/lib/ui.ts';

test('tick icons: G, P and HB on one weapon are three different ones', () => {
	for (const w of WEAPONS) {
		const icons = LADDER.map((_, i) => tickIcon(w.name, i));
		assert.equal(new Set(icons).size, LADDER.length, `${w.name}: ${icons.join(', ')}`);
	}
});

test('tick icons: the same box always gets the same icon, and every icon is used', () => {
	const used = new Set();
	for (const w of WEAPONS) {
		for (let i = 0; i < LADDER.length; i++) {
			assert.equal(tickIcon(w.name, i), tickIcon(w.name, i));
			assert.ok(TICK_ICONS.includes(tickIcon(w.name, i)));
			used.add(tickIcon(w.name, i));
		}
	}
	assert.equal(used.size, TICK_ICONS.length);
});
