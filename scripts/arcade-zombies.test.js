// Zombie Rounds (src/lib/arcade/zombies.ts): the seeded round plans, scoring, power-up drops and the collision
// helpers. `node --test scripts/arcade-zombies.test.js` (also part of `npm test`).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	ARENA,
	COVER,
	DOOR,
	PLAYER_START,
	PLAYER_RADIUS,
	DROP_PITY,
	award,
	bruteCount,
	clearBonus,
	dropRoller,
	isBruteRound,
	lineClear,
	pushOut,
	roundPlan,
	segCircle,
	segRect,
	spawnPoint,
	zombieCount,
	zombieHp,
	zombieSpeed
} from '../src/lib/arcade/zombies.ts';

test('the same seed and round give the same plan; another seed a different one', () => {
	assert.deepEqual(roundPlan(12345, 4), roundPlan(12345, 4));
	assert.notDeepEqual(roundPlan(12345, 4).spawns, roundPlan(54321, 4).spawns);
	assert.notDeepEqual(roundPlan(12345, 4).spawns, roundPlan(12345, 5).spawns);
});

test('rounds get bigger, tougher and faster', () => {
	for (let r = 1; r < 40; r++) {
		assert.ok(zombieCount(r + 1) >= zombieCount(r));
		assert.ok(zombieHp(r + 1) >= zombieHp(r));
		assert.ok(zombieSpeed(r + 1) >= zombieSpeed(r));
	}
	assert.equal(zombieCount(1), 6);
	assert.equal(zombieCount(5), 18);
	assert.equal(zombieHp(1), 2);
	assert.ok(zombieCount(100) <= 72);
});

test('a plan: walkers (and runners from round 3), sorted spawn times, edges and looks in range', () => {
	for (let round = 1; round <= 25; round++) {
		const p = roundPlan(777, round);
		const walkers = p.spawns.filter((s) => s.kind !== 'brute');
		assert.equal(walkers.length, zombieCount(round));
		if (round < 3) assert.ok(walkers.every((s) => s.kind === 'walker'));
		if (round < 2) assert.ok(p.spawns.every((s) => s.edge !== 'door'), 'no door zombies in round 1');
		for (let i = 0; i < p.spawns.length; i++) {
			const s = p.spawns[i];
			assert.ok(s.at > 0);
			if (i) assert.ok(s.at >= p.spawns[i - 1].at, 'sorted');
			assert.ok(['left', 'right', 'bottom', 'door'].includes(s.edge));
			assert.ok(s.pos >= 0 && s.pos <= 1);
			assert.ok(Number.isInteger(s.look) && s.look >= 0 && s.look < 6);
		}
		assert.ok(p.runnerSpeed > p.speed && p.bruteSpeed < p.speed + 20);
	}
	const late = roundPlan(777, 12).spawns;
	assert.ok(late.some((s) => s.kind === 'runner'), 'runners show up');
	assert.ok(late.some((s) => s.chef) && late.some((s) => !s.chef), 'some wear chef hats');
});

test('Brutes come every 5th round only, more of them later, never out of the door', () => {
	for (let round = 1; round <= 30; round++) {
		const brutes = roundPlan(99, round).spawns.filter((s) => s.kind === 'brute');
		assert.equal(brutes.length, bruteCount(round));
		assert.equal(brutes.length > 0, isBruteRound(round));
		assert.ok(brutes.every((s) => s.edge !== 'door'));
	}
	assert.equal(bruteCount(5), 1);
	assert.equal(bruteCount(10), 2);
	assert.equal(bruteCount(20), 3);
	assert.ok(roundPlan(1, 10).bruteHp > roundPlan(1, 5).bruteHp);
});

test('spawn points are outside the lot, or in the doorway', () => {
	for (const edge of ['left', 'right', 'bottom', 'door']) {
		for (const pos of [0, 0.5, 1]) {
			const { x, y } = spawnPoint({ edge, pos }, 16);
			if (edge === 'left') assert.ok(x < 0);
			if (edge === 'right') assert.ok(x > ARENA.w);
			if (edge === 'bottom') assert.ok(y > ARENA.h);
			if (edge === 'door') {
				assert.ok(Math.abs(x - DOOR.x) < DOOR.w / 2);
				assert.ok(y < ARENA.top);
			}
			if (edge !== 'bottom' && edge !== 'door') assert.ok(y > ARENA.top && y < ARENA.h);
		}
	}
});

test('scoring: 10 a hit, 60 a kill, 100 × round to clear, doubled with Double Points', () => {
	assert.equal(award(10, false), 10);
	assert.equal(award(60, true), 120);
	assert.equal(clearBonus(1), 100);
	assert.equal(clearBonus(7), 700);
	assert.equal(award(clearBonus(3), true), 600);
});

test('drops: the same seed drops the same, at the latest every DROP_PITY kills, all three kinds', () => {
	const a = dropRoller(42);
	const b = dropRoller(42);
	const seen = new Set();
	let gap = 0;
	let maxGap = 0;
	for (let i = 0; i < 3000; i++) {
		const x = a();
		assert.equal(x, b());
		if (x) {
			seen.add(x);
			maxGap = Math.max(maxGap, gap);
			gap = 0;
		} else gap++;
	}
	assert.ok(maxGap < DROP_PITY);
	assert.deepEqual([...seen].sort(), ['double', 'insta', 'nuke']);
});

test('pushOut slides a circle out of a box; untouched when apart', () => {
	const box = { x: 100, y: 100, w: 50, h: 50 };
	assert.deepEqual(pushOut(40, 40, 10, box), { x: 40, y: 40, hit: false });
	const left = pushOut(95, 120, 10, box);
	assert.ok(left.hit);
	assert.equal(left.x, 90);
	assert.equal(left.y, 120);
	const inside = pushOut(104, 125, 10, box);
	assert.equal(inside.x, 90, 'out through the nearest side');
	const corner = pushOut(155, 155, 10, box);
	assert.ok(Math.hypot(corner.x - 150, corner.y - 150) > 9.99);
});

test('segRect / segCircle find the first touch along a shot', () => {
	const box = { x: 100, y: 0, w: 20, h: 100 };
	assert.ok(Math.abs(segRect(0, 50, 200, 50, box) - 0.5) < 1e-9);
	assert.equal(segRect(0, 150, 200, 150, box), -1);
	assert.equal(segRect(0, 50, 50, 50, box), -1, 'stops short');
	assert.ok(Math.abs(segCircle(0, 0, 100, 0, 60, 0, 10) - 0.5) < 1e-9);
	assert.equal(segCircle(0, 0, 100, 0, 60, 30, 10), -1);
	assert.equal(segCircle(55, 0, 100, 0, 60, 0, 10), 0, 'starts inside');
});

test('the arena: the player starts clear of every cover block, and cover sits on the lot', () => {
	for (const c of COVER) {
		assert.equal(pushOut(PLAYER_START.x, PLAYER_START.y, PLAYER_RADIUS + 20, c).hit, false);
		assert.ok(c.x >= 0 && c.x + c.w <= ARENA.w && c.y >= ARENA.top && c.y + c.h <= ARENA.h);
	}
	const car = COVER.find((c) => c.kind === 'car');
	assert.equal(lineClear(car.x - 30, car.y + car.h / 2, car.x + car.w + 30, car.y + car.h / 2), false, 'a car blocks the shot');
	assert.equal(lineClear(PLAYER_START.x, PLAYER_START.y, PLAYER_START.x, ARENA.h), true);
});
