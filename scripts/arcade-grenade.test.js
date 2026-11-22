// BurgiArcade Grenade Toss (src/lib/arcade/grenade.ts): the street from the seed, the grenade's flight (gravity,
// wind, one bounce, friction, catches) and the scoring (blast radius, bullseye, combo, trick-shot bonuses).
// `node --test scripts/arcade-grenade.test.js`
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	makeLevel,
	envAt,
	stepNade,
	newNade,
	scoreBlast,
	simulateThrow,
	launch,
	aimFromPull,
	previewDots,
	targetAt,
	upAt,
	windowOpen,
	truckX,
	ORIGIN,
	GRAVITY,
	GROUND,
	NADE_R,
	FUSE,
	ROUNDS,
	BLAST_R,
	BARREL_BOOST,
	BARREL_W,
	MAX_ANGLE,
	MIN_ANGLE,
	TARGET_POINTS,
	BONUS_POINTS
} from '../src/lib/arcade/grenade.ts';

const empty = { wind: 0, solids: [], catches: [] };
const run = (n, env, secs, dt = 1 / 240) => {
	for (let i = Math.round(secs / dt); i > 0; i--) n = stepNade(n, dt, env);
	return n;
};

test('the same seed gives the same street; another seed another', () => {
	assert.deepEqual(makeLevel(12345), makeLevel(12345));
	assert.notDeepEqual(makeLevel(12345), makeLevel(12346));
});

test('every level: ten rounds, four covers that never overlap, two barrel spots, a truck later on', () => {
	for (let seed = 1; seed <= 200; seed++) {
		const L = makeLevel(seed * 7919);
		assert.equal(L.rounds.length, ROUNDS);
		assert.equal(L.covers.length, 4);
		assert.equal(L.barrelSpots.length, 2);
		const things = [...L.covers.map((c) => [c.x, c.x + c.w]), ...L.barrelSpots.map((x) => [x, x + BARREL_W])].sort((a, b) => a[0] - b[0]);
		for (let i = 1; i < things.length; i++) assert.ok(things[i][0] >= things[i - 1][1] + 4, `seed ${seed}: street pieces overlap`);
		assert.ok(L.buildingX + 190 <= 800);
		const trucks = L.rounds.map((r, i) => (r.truck ? i : -1)).filter((i) => i >= 0);
		assert.equal(trucks.length, 4);
		assert.ok(trucks.every((i) => i >= 4), 'the truck only comes later on');
		L.rounds.forEach((r, i) => {
			assert.ok(Math.abs(r.wind) <= 30 + i * 13);
			const street = r.targets.filter((t) => t.kind === 'cutout');
			assert.ok(street.length >= 2 && street.length <= 4);
			assert.equal(new Set(r.targets.map((t) => t.id)).size, r.targets.length, 'target ids are unique in a round');
			assert.ok(L.barrelSpots.includes(r.barrel));
			if (i < 2) assert.ok(r.targets.every((t) => t.motion.type === 'static'), 'the first two rounds stand still');
		});
	}
});

test('free flight is a parabola; wind pushes it sideways while it flies', () => {
	const n = run(newNade(300, -500), empty, 0.5);
	assert.ok(Math.abs(n.x - (ORIGIN.x + 150)) < 0.5);
	assert.ok(Math.abs(n.y - (ORIGIN.y - 250 + 0.5 * GRAVITY * 0.25)) < 1.5);
	const windy = run(newNade(300, -500), { ...empty, wind: 100 }, 0.5);
	assert.ok(Math.abs(windy.x - n.x - 0.5 * 100 * 0.25) < 0.5);
});

test('it bounces once off the ground, loses speed, then rolls to a stop', () => {
	let n = newNade(260, 0);
	let firstUp = null;
	let ups = 0;
	let prevVy = 0;
	for (let i = 0; i < 240 * 4; i++) {
		n = stepNade(n, 1 / 240, empty);
		if (prevVy > 0 && n.vy < 0) {
			ups++;
			if (firstUp === null) firstUp = -n.vy;
		}
		prevVy = n.vy;
	}
	assert.ok(firstUp > 100, 'the first bounce goes back up');
	assert.ok(n.bounces >= 1);
	assert.ok(Math.abs(n.y - (GROUND - NADE_R)) < 1, 'it lies on the ground');
	assert.equal(n.vx, 0, 'friction stopped it');
	assert.ok(n.y + NADE_R <= GROUND + 0.01);
});

test('walls bounce it back; the barrel catches a falling grenade', () => {
	const wall = { wind: 0, solids: [{ x: 300, y: 0, w: 40, h: 600 }], catches: [] };
	const n = run(newNade(500, -100), wall, 0.6);
	assert.ok(n.x < 300 && n.vx <= 0, 'bounced off the wall');
	const L = makeLevel(5);
	const r = L.rounds[0];
	const env = envAt(L, r, 1);
	const drop = { ...newNade(0, 0), x: r.barrel + BARREL_W / 2, y: GROUND - 120 };
	const caught = run(drop, env, 1);
	assert.equal(caught.caught?.kind, 'barrel');
});

test('motion helpers stay in range and a truck patrols its lane', () => {
	for (let t = 0; t < 20; t += 0.07) {
		const u = upAt({ type: 'pop', period: 3, phase: 0.3 }, t);
		assert.ok(u >= 0 && u <= 1);
		const o = windowOpen({ idx: 0, period: 4, phase: 0.1, open: 0.6 }, t);
		assert.ok(o >= 0 && o <= 1);
		const { x } = truckX({ x0: 206, x1: 560, period: 8, phase: 0.2 }, t);
		assert.ok(x >= 206 - 1e-9 && x <= 560 + 1e-9);
	}
	assert.equal(upAt({ type: 'static' }, 3), 1);
});

test('aiming: pull back to throw forward, angles clamped, preview follows gravity', () => {
	const a = aimFromPull(-100, 100);
	assert.ok(Math.abs(a.angle - 45) < 1e-9);
	assert.ok(a.power > 0.4 && a.power < 0.9);
	assert.equal(aimFromPull(50, 200).angle, MAX_ANGLE);
	assert.equal(aimFromPull(-100, -200).angle, MIN_ANGLE);
	assert.equal(aimFromPull(-3, 3).power, 0);
	const v = launch(30, 1);
	assert.ok(v.vx > 0 && v.vy < 0);
	const dots = previewDots(v.vx, v.vy, 5, 0.1);
	assert.equal(dots.length, 5);
	assert.ok(Math.abs(dots[4].y - (ORIGIN.y + v.vy * 0.5 + 0.5 * GRAVITY * 0.25)) < 1e-6);
});

test('scoring: blast radius, bullseye ×2, combo, window + barrel bonuses', () => {
	const L = makeLevel(12345);
	const ri = 0;
	const r = L.rounds[ri];
	const t = 5;
	const cut = r.targets.find((tg) => tg.kind === 'cutout');
	const s = targetAt(L, r, cut, t);
	// a bang right on its bullseye
	const onIt = scoreBlast(L, r, { ...newNade(0, 0), x: s.x, y: s.y }, t);
	const h = onIt.hits.find((x) => x.id === cut.id);
	assert.ok(h?.bullseye);
	assert.equal(h.points, TARGET_POINTS.cutout * 2);
	// far away: nothing
	const miss = scoreBlast(L, r, { ...newNade(0, 0), x: 60, y: 100 }, t);
	assert.equal(miss.total, 0);
	// near but not on it: a plain hit
	const near = scoreBlast(L, r, { ...newNade(0, 0), x: s.x + BLAST_R * 0.7, y: s.y }, t);
	const nh = near.hits.find((x) => x.id === cut.id);
	assert.ok(nh && !nh.bullseye && nh.points === TARGET_POINTS.cutout);
	// combo: two hits ×1.5
	const two = { ...r, targets: [cut, { ...cut, id: 'twin' }] };
	const both = scoreBlast(L, two, { ...newNade(0, 0), x: s.x, y: s.y }, t);
	assert.equal(both.mult, 1.5);
	assert.equal(both.total, Math.round(400 * 1.5));
	// the barrel: a bigger bang + the swish bonus
	const inBarrel = scoreBlast(L, r, { ...newNade(0, 0), caught: { kind: 'barrel', idx: 0, dx: 0, dy: 0 } }, t);
	assert.equal(inBarrel.radius, BLAST_R * BARREL_BOOST);
	assert.ok(inBarrel.bonus.some((b) => b.kind === 'barrel' && b.points === BONUS_POINTS.barrel));
	// through a window: its target is a bullseye, the walls keep the rest out
	const w = r.targets.find((tg) => tg.kind === 'window');
	const inWin = scoreBlast(L, r, { ...newNade(0, 0), caught: { kind: 'window', idx: w.slot, dx: 0, dy: 0 } }, t);
	assert.deepEqual(
		inWin.hits.map((x) => [x.id, x.bullseye]),
		[[w.id, true]]
	);
	assert.equal(inWin.total, TARGET_POINTS.window * 2 + BONUS_POINTS.window);
});

test('every round of a level can be scored on, and a run lasts the fuse', () => {
	const L = makeLevel(777);
	for (let ri = 0; ri < ROUNDS; ri++) {
		let best = 0;
		for (let a = 0; a <= 80 && best === 0; a += 4)
			for (let p = 0.1; p <= 1; p += 0.05) {
				const { vx, vy } = launch(a, p);
				const res = simulateThrow(L, ri, 1.2, vx, vy, 1 / 120);
				assert.ok(res.nade.t >= FUSE);
				best = Math.max(best, res.blast.total);
			}
		assert.ok(best > 0, `round ${ri} has a scoring throw`);
	}
});
