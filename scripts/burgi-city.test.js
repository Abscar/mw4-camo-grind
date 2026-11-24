import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLOCKS, VB_H, VB_W, blockArt, groundArt, hitArea, p } from '../src/lib/burgiCity.ts';

const TABS = ['grind', 'ranked', 'cosmetics', 'casino', 'shop', 'arcade', 'mayhem', 'squad'];

test('one block per page tab + the park, each on its own spot of the 3 × 3 grid', () => {
	const ids = BLOCKS.map((b) => b.id);
	assert.equal(new Set(ids).size, 9);
	for (const t of TABS) assert.ok(ids.includes(t), t);
	assert.ok(ids.includes('park'));
	assert.equal(new Set(BLOCKS.map((b) => `${b.bx},${b.by}`)).size, 9);
});

test('drawings are plain SVG with real numbers and no ids', () => {
	for (const s of [groundArt(), ...BLOCKS.map(blockArt)]) {
		assert.ok(s.length > 200);
		assert.ok(!/NaN|undefined|Infinity/.test(s));
		assert.ok(!/\sid="/.test(s));
	}
});

test('every block and its tap area fit the drawing', () => {
	for (const b of BLOCKS) {
		for (const [x, y] of hitArea(b)) {
			assert.ok(x >= 0 && x <= VB_W && y >= 0 && y <= VB_H, `${b.id} ${x},${y}`);
		}
	}
	const [x, y] = p(26, 26);
	assert.ok(x <= VB_W && y <= VB_H);
});
