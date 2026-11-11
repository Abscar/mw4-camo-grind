// "Road to Divergence" and the growing news buddy (2026-11-11): `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { growth, stepMarks } from '../src/lib/buddyGrowth.ts';
import { DIVERGENCE_REQUIRED, MAX_LEVEL } from '../src/lib/data/camos.ts';
import { WEAPONS } from '../src/lib/data/weapons.ts';
import { countsTowardDivergence, roadToDivergence } from '../src/lib/road.ts';
import { countKey, isReleased } from '../src/lib/steps.ts';

const empty = () => ({ weapons: {}, specials: {}, counts: {}, focus: [] });
const released = WEAPONS.filter((w) => isReleased(w) && countsTowardDivergence(w));

test('road: nothing ticked = every released weapon, catalogue order, 33 to go', () => {
	const road = roadToDivergence(empty());
	assert.equal(road.have, 0);
	assert.equal(road.toGo, DIVERGENCE_REQUIRED);
	assert.deepEqual(
		road.rows.map((r) => r.weaponId),
		released.map((w) => w.id)
	);
	for (const r of road.rows) {
		assert.equal(r.done, 0);
		assert.equal(r.total, 6, '3 before Gold + Gold, Platinum, Harmonic Break');
		assert.equal(r.next.length, 3, 'the 3 before-Gold challenges run side by side');
	}
	assert.ok(!road.rows.some((r) => !isReleased(WEAPONS.find((w) => w.id === r.weaponId))), 'unreleased guns left out');
});

test('road: closest first, maxed weapons counted and left out', () => {
	const [a, b, c, d, e] = released;
	const s = empty();
	s.weapons[a.id] = MAX_LEVEL; // has Harmonic Break
	s.weapons[b.id] = 1; // Gold: 3 + 1 = 4 steps
	s.weapons[c.id] = 2; // Platinum: 5 steps
	s.specials[d.id] = 0b011; // 2 before-Gold challenges
	s.counts[countKey(e.id, 's0')] = 1; // a counter started, no step done
	const road = roadToDivergence(s);
	assert.equal(road.have, 1);
	assert.equal(road.toGo, DIVERGENCE_REQUIRED - 1);
	assert.ok(!road.rows.some((r) => r.weaponId === a.id));
	assert.deepEqual(
		road.rows.slice(0, 4).map((r) => [r.weaponId, r.done]),
		[
			[c.id, 5],
			[b.id, 4],
			[d.id, 2],
			[e.id, 0]
		]
	);
	assert.equal(road.rows[0].next[0].key, 'hb', 'Platinum done → Harmonic Break is next');
	assert.equal(road.rows[3].counter?.count, 1);
});

test('road: a counter breaks a tie by its own share, then the catalogue order', () => {
	const ids = released.map((w) => w.id);
	const last = ids[ids.length - 1];
	const s = empty();
	s.counts[countKey(last, 's1')] = 1;
	const road = roadToDivergence(s);
	assert.equal(road.rows[0].weaponId, last, 'the started counter goes first among the 0-step weapons');
	assert.equal(road.rows[1].weaponId, ids[0]);
});

test('buddy growth: seedling → sprout → bush → big bush by camo steps, then monster and legend', () => {
	assert.deepEqual(stepMarks(111), [6, 28, 56]);
	assert.deepEqual(growth(0, 111, 33, 0), { stage: 0, name: 'seedling', next: { kind: 'steps', left: 6 } });
	assert.equal(growth(5, 111, 33, 0).stage, 0);
	assert.equal(growth(6, 111, 33, 0).stage, 1);
	assert.deepEqual(growth(27, 111, 30, 0).next, { kind: 'steps', left: 1 });
	assert.equal(growth(28, 111, 30, 0).name, 'bush');
	assert.deepEqual(growth(80, 111, 7, 0), { stage: 3, name: 'bigBush', next: { kind: 'divergence', left: 7 } });
	assert.deepEqual(growth(99, 111, 0, 0), { stage: 4, name: 'monster', next: { kind: 'mastery' } });
	assert.deepEqual(growth(99, 111, 0, 1), { stage: 5, name: 'legend', next: null });
	assert.equal(growth(3, 111, 33, 1).stage, 5, 'a finished Mastery camo always means legend');
});

test('road: Divergence reached = nothing to go', () => {
	const s = empty();
	for (const w of released.slice(0, DIVERGENCE_REQUIRED)) s.weapons[w.id] = MAX_LEVEL;
	const road = roadToDivergence(s);
	assert.equal(road.toGo, 0);
	assert.equal(road.have, DIVERGENCE_REQUIRED);
});
