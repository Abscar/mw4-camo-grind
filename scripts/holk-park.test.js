import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENE_H, SCENE_W, SEATS, SPOT, cleanLog, grassRank, nextLine, parkScene } from '../src/lib/holkPark.ts';
import { t } from '../src/lib/i18n/en.ts';

test('the park scene is plain SVG with real numbers, the same every time', () => {
	const s = parkScene();
	assert.ok(s.length > 5000);
	assert.ok(!/NaN|undefined|Infinity/.test(s));
	assert.equal(s, parkScene());
	// every url(#…) it uses is defined in it
	const used = new Set([...s.matchAll(/url\(#([\w-]+)\)/g)].map((m) => m[1]));
	for (const id of used) assert.ok(s.includes(`id="${id}"`), id);
});

test('every station sits inside the scene, every seat too', () => {
	for (const [k, sp] of Object.entries(SPOT)) {
		assert.ok(sp.x >= 0 && sp.y >= 0 && sp.x + sp.w <= SCENE_W && sp.y + sp.h <= SCENE_H, k);
		assert.ok(sp.w >= 44 && sp.h >= 44, `${k} big enough to tap`);
	}
	for (const [x, y] of SEATS) assert.ok(x > 0 && x < SCENE_W && y > 0 && y < SCENE_H);
});

test('grass titles climb with the count, one name per rank', () => {
	assert.equal(grassRank(0), 0);
	assert.equal(grassRank(1), 1);
	assert.equal(grassRank(4), 1);
	assert.equal(grassRank(5), 2);
	assert.equal(grassRank(100), 5);
	assert.equal(grassRank(10_000), 6);
	assert.equal(t.park.grassRank.length, 7);
});

test('a line is never said twice in a row', () => {
	for (let last = -1; last < 5; last++) {
		for (let k = 0; k < 50; k++) {
			const i = nextLine(5, last, k / 50);
			assert.ok(i >= 0 && i < 5);
			assert.notEqual(i, last);
		}
	}
	assert.equal(nextLine(1, 0, 0.5), 0);
});

test('the counters are cleaned: junk becomes zero, numbers are whole and capped', () => {
	assert.deepEqual(cleanLog(null), { breaks: 0, grass: 0, wishes: 0, munchies: 0, fires: 0 });
	assert.deepEqual(cleanLog({ breaks: 3.7, grass: -2, wishes: 'x', munchies: 1e20, fires: 5 }), { breaks: 3, grass: 0, wishes: 0, munchies: 1_000_000_000, fires: 5 });
});
