// Burger Stack (src/lib/arcade/stack.ts): the filling order from the seed, the drop / cut / perfect rules,
// the speed curve and the points. `node --test scripts/arcade-stack.test.js`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	makePlan,
	dropLayer,
	speedAt,
	sideOf,
	perfectBonus,
	finishesBurger,
	FILLINGS,
	PER_BURGER,
	PERFECT,
	GROW,
	GROW_EVERY,
	BASE_W,
	LAYER_POINTS,
	MIN_KEEP
} from '../src/lib/arcade/stack.ts';

test('the plan comes from the seed: same seed = same order, another seed = another order', () => {
	const a = makePlan(12345);
	const b = makePlan(12345);
	const c = makePlan(999);
	const seq = (p) => Array.from({ length: 120 }, (_, i) => p(i));
	assert.deepEqual(seq(a), seq(b));
	assert.notDeepEqual(seq(a), seq(c));
	// asking out of order gives the same answers
	const d = makePlan(12345);
	assert.equal(d(77), seq(a)[77]);
	assert.equal(d(3), seq(a)[3]);
});

test('every burger opens with a patty, never the same filling twice in a row, all seven show up', () => {
	for (const seed of [1, 2, 3, 12345, 0xffffffff, 42424242]) {
		const p = makePlan(seed);
		const seq = Array.from({ length: 300 }, (_, i) => p(i));
		for (let i = 0; i < seq.length; i++) {
			assert.ok(FILLINGS.includes(seq[i]), `known filling ${seq[i]}`);
			if (i % PER_BURGER === 0) assert.equal(seq[i], 'patty', `burger ${i / PER_BURGER} starts with a patty`);
			else assert.notEqual(seq[i], seq[i - 1], `no repeat at ${i} (seed ${seed})`);
		}
		for (const f of FILLINGS) assert.ok(seq.slice(0, 30).includes(f), `${f} within three burgers (seed ${seed})`);
	}
});

test('a perfect drop keeps the full width; every third in a row grows it back (never past the first bun)', () => {
	const top = { l: 200, r: 360 };
	const r1 = dropLayer(top, { l: 200 + PERFECT, r: 360 + PERFECT }, 0);
	assert.equal(r1.type, 'perfect');
	assert.deepEqual(r1.keep, top);
	assert.equal(r1.streak, 1);
	assert.equal(r1.grow, 0);
	assert.equal(r1.points, LAYER_POINTS + perfectBonus(1));
	const r3 = dropLayer(top, { l: 197, r: 357 }, GROW_EVERY - 1);
	assert.equal(r3.type, 'perfect');
	assert.equal(r3.grow, GROW);
	assert.deepEqual(r3.keep, { l: 200 - GROW / 2, r: 360 + GROW / 2 });
	// already full width: nothing to grow
	const full = { l: 140, r: 140 + BASE_W };
	const r6 = dropLayer(full, full, 5);
	assert.equal(r6.type, 'perfect');
	assert.equal(r6.grow, 0);
	assert.deepEqual(r6.keep, full);
	// almost full: grows only up to the first bun's width
	const near = { l: 150, r: 150 + BASE_W - 6 };
	const r9 = dropLayer(near, near, 8);
	assert.equal(r9.grow, 6);
	assert.equal(r9.keep.r - r9.keep.l, BASE_W);
});

test('an off-centre drop cuts off what hangs over, on the right side', () => {
	const top = { l: 200, r: 360 };
	const right = dropLayer(top, { l: 240, r: 400 }, 4);
	assert.equal(right.type, 'cut');
	assert.deepEqual(right.keep, { l: 240, r: 360 });
	assert.deepEqual(right.cut, { l: 360, r: 400 });
	assert.equal(right.streak, 0);
	assert.equal(right.points, LAYER_POINTS);
	const left = dropLayer(top, { l: 150, r: 310 }, 0);
	assert.deepEqual(left.keep, { l: 200, r: 310 });
	assert.deepEqual(left.cut, { l: 150, r: 200 });
	// just outside the perfect window is a cut
	const just = dropLayer(top, { l: 200 + PERFECT + 1, r: 360 + PERFECT + 1 }, 0);
	assert.equal(just.type, 'cut');
});

test('missing the stack (or keeping only a sliver) ends the run', () => {
	const top = { l: 200, r: 360 };
	assert.equal(dropLayer(top, { l: 361, r: 521 }, 0).type, 'miss');
	assert.equal(dropLayer(top, { l: 30, r: 190 }, 0).type, 'miss');
	assert.equal(dropLayer(top, { l: 360 - MIN_KEEP + 1, r: 520 - MIN_KEEP + 1 }, 0).type, 'miss');
	assert.equal(dropLayer(top, { l: 360 - MIN_KEEP - 1, r: 520 - MIN_KEEP - 1 }, 0).type, 'cut');
});

test('speed ramps up and tops out; the sides take turns; perfect bonus grows with the streak', () => {
	assert.equal(speedAt(0), 250);
	for (let n = 1; n < 200; n++) assert.ok(speedAt(n) >= speedAt(n - 1));
	assert.equal(speedAt(500), 900);
	assert.equal(sideOf(0), -1);
	assert.equal(sideOf(1), 1);
	assert.equal(sideOf(2), -1);
	assert.deepEqual([1, 2, 3, 4, 5, 6, 9].map(perfectBonus), [10, 15, 20, 25, 30, 30, 30]);
	assert.equal(finishesBurger(PER_BURGER - 1), true);
	assert.equal(finishesBurger(PER_BURGER), false);
	assert.equal(finishesBurger(2 * PER_BURGER - 1), true);
});
