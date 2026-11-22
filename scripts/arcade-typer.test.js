// BurgiArcade Callout Typer (src/lib/arcade/typer.ts + src/lib/i18n/arcade/typer.ts): the callout plan from the
// seed (order, timing, columns, the speed-up), matching (case and spaces ignored, the lock, switching, mistakes)
// and the scoring helpers. `node --test scripts/arcade-typer.test.js`
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	makePlan,
	posAt,
	typeChar,
	backspace,
	dropTarget,
	shownPart,
	keyOf,
	intervalAt,
	fallAt,
	comboOf,
	charPoints,
	wpmOf,
	accuracyOf,
	EMPTY,
	TOP_Y,
	LINE_Y,
	COMBO_MAX
} from '../src/lib/arcade/typer.ts';
import words from '../src/lib/i18n/arcade/typer.ts';

const CALLOUTS = words.callouts;

test('the callout list: 30 short ones, unique keys, none is the start of another', () => {
	assert.ok(CALLOUTS.length >= 30);
	const keys = CALLOUTS.map(keyOf);
	assert.equal(new Set(keys).size, keys.length);
	for (const a of keys) for (const b of keys) if (a !== b) assert.ok(!b.startsWith(a), `${a} is the start of ${b}`);
	assert.ok(CALLOUTS.every((w) => w.length <= 14));
});

test('the same seed gives the same run, another seed another', () => {
	assert.deepEqual(makePlan(12345, CALLOUTS), makePlan(12345, CALLOUTS));
	assert.notDeepEqual(makePlan(12345, CALLOUTS).slice(0, 20), makePlan(54321, CALLOUTS).slice(0, 20));
});

test('the plan: in time order, inside the map, no repeats close together, columns spread, it speeds up', () => {
	for (const seed of [1, 2, 3, 12345, 99999]) {
		const plan = makePlan(seed, CALLOUTS);
		assert.equal(plan.length, 400);
		for (let i = 0; i < plan.length; i++) {
			const p = plan[i];
			assert.ok(p.x >= 130 && p.x <= 670);
			if (i) assert.ok(p.at > plan[i - 1].at);
			const near = plan.slice(Math.max(0, i - 8), i).map((q) => q.key);
			assert.ok(!near.includes(p.key), `seed ${seed}: ${p.word} twice within 8`);
		}
		// every callout shows up in the first 30
		assert.equal(new Set(plan.slice(0, 30).map((p) => p.key)).size, 30);
		const gaps = (from, to) => (plan[to].at - plan[from].at) / (to - from);
		assert.ok(gaps(0, 10) > gaps(60, 70) * 1.6, 'callouts come faster later on');
		assert.ok(plan[80].fall < plan[0].fall);
	}
	assert.ok(intervalAt(0) > intervalAt(60) && intervalAt(1000) === 0.45);
	assert.ok(fallAt(0) === 9.5 && fallAt(1000) === 4);
});

test('a callout falls from the top to the line in its fall time', () => {
	const sp = makePlan(7, CALLOUTS)[0];
	assert.equal(posAt(sp, sp.at).y, TOP_Y);
	assert.ok(Math.abs(posAt(sp, sp.at + sp.fall).y - LINE_Y) < 1e-9);
	assert.ok(Math.abs(posAt(sp, sp.at + 1).x - sp.x) <= sp.sway + 1e-9);
});

test('typing: case and spaces ignored, the closest callout gets the lock, a wrong letter is a miss', () => {
	const live = [
		{ id: 1, key: keyOf('Back site'), y: 100 },
		{ id: 2, key: keyOf('Balcony'), y: 300 },
		{ id: 3, key: keyOf('Bridge'), y: 200 }
	];
	let r = typeChar(EMPTY, 'B', live);
	assert.equal(r.kind, 'ok');
	assert.equal(r.target, 2, 'closest to the line wins');
	r = typeChar(r.st, ' ', live);
	assert.equal(r.kind, 'ignored');
	r = typeChar(r.st, 'a', live);
	assert.equal(r.target, 2);
	r = typeChar(r.st, 'c', live);
	assert.equal(r.kind, 'ok');
	assert.equal(r.target, 1, 'the lock moves to the only callout that still fits');
	const before = r.st;
	r = typeChar(r.st, 'z', live);
	assert.equal(r.kind, 'miss');
	assert.deepEqual(r.st, before, 'a mistake types nothing');
	for (const ch of 'K SITE') r = typeChar(r.st, ch, live);
	assert.equal(r.kind, 'done');
	assert.equal(r.target, 1);
	assert.deepEqual(r.st, EMPTY);
	assert.equal(typeChar(EMPTY, 'x', live).kind, 'miss');
});

test('backspace and losing the target', () => {
	const live = [{ id: 5, key: 'pushb', y: 10 }];
	let st = typeChar(EMPTY, 'p', live).st;
	st = typeChar(st, 'u', live).st;
	assert.deepEqual(backspace(st, live), { buf: 'p', target: 5 });
	assert.deepEqual(backspace({ buf: 'p', target: 5 }, live), EMPTY);
	assert.deepEqual(dropTarget(st, 5), EMPTY);
	assert.deepEqual(dropTarget(st, 9), st);
});

test('the typed part of a callout as written', () => {
	assert.equal('Mid doors'.slice(0, shownPart('Mid doors', 4)), 'Mid d');
	assert.equal(shownPart('UAV up', 0), 0);
	assert.equal(shownPart('UAV up', 5), 6);
});

test('scoring: 10 per letter × combo, combo every two clean callouts up to ×8, WPM and accuracy', () => {
	assert.equal(comboOf(0), 1);
	assert.equal(comboOf(1), 1);
	assert.equal(comboOf(2), 2);
	assert.equal(comboOf(5), 3);
	assert.equal(comboOf(100), COMBO_MAX);
	assert.equal(charPoints(0), 10);
	assert.equal(charPoints(4), 30);
	assert.equal(wpmOf(250, 60), 50);
	assert.equal(wpmOf(10, 0), 0);
	assert.equal(accuracyOf(90, 10), 90);
	assert.equal(accuracyOf(0, 0), 100);
});
