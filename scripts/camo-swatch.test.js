// The camo pictures in the weapon card (camoSwatch.ts + data/specialLooks.ts).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { swatchSvg } from '../src/lib/camoSwatch.ts';
import { LADDER_LOOKS, SPECIAL_LOOKS } from '../src/lib/data/specialLooks.ts';
import { WEAPONS } from '../src/lib/data/weapons.ts';

test('camo pictures: every Special camo has a look, and no look is left over', () => {
	const names = WEAPONS.flatMap((w) => w.specials.map((s) => s.name));
	for (const n of names) assert.ok(SPECIAL_LOOKS[n], `no look for ${n}`);
	for (const n of Object.keys(SPECIAL_LOOKS)) assert.ok(names.includes(n), `look for unknown camo ${n}`);
	assert.deepEqual(Object.keys(LADDER_LOOKS).sort(), ['gold', 'harmonicBreak', 'platinum']);
});

test('camo pictures: valid-looking SVG, the same every time, ids kept apart per box', () => {
	for (const [name, look] of [...Object.entries(SPECIAL_LOOKS), ...Object.entries(LADDER_LOOKS)]) {
		const a = swatchSvg(look, name, 'w-1');
		assert.match(a, /^<svg viewBox="0 0 100 100"[^>]*>.*<\/svg>$/s, name);
		assert.doesNotMatch(a, /NaN|undefined|Infinity/, `${name} has a broken number`);
		assert.equal(swatchSvg(look, name, 'w-1'), a, `${name} changes between renders`);
		assert.ok(a.length < 60000, `${name} is ${a.length} chars`);
		const ids = [...a.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
		for (const id of ids) assert.ok(id.startsWith('cww1'), `${name}: id ${id} isn't scoped`);
	}
});
