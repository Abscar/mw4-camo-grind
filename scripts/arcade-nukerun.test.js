// Nuke Run (BurgiArcade, src/lib/arcade/nukerun.ts): the seeded course, the runner's physics and hit boxes.
// A bot that plays with the game's own physics proves every course can be cleared.
// `node --test scripts/arcade-nukerun.test.js`
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	makeCourse,
	newRunner,
	pressJump,
	pressSlide,
	stepRunner,
	runnerBox,
	airborne,
	hits,
	grabs,
	speedAt,
	scoreOf,
	OBSTACLES,
	PHYS,
	PX_PER_M,
	FIRST_AT,
	MAX_SPEED
} from '../src/lib/arcade/nukerun.ts';

/** The time window (after take-off) in which the runner's feet are above height y. */
function airWindow(y) {
	const t1 = (PHYS.jumpV - Math.sqrt(PHYS.jumpV ** 2 - 2 * PHYS.gUp * y)) / PHYS.gUp;
	const top = PHYS.jumpV / PHYS.gUp;
	const hMax = PHYS.jumpV ** 2 / (2 * PHYS.gUp);
	return [t1, top + Math.sqrt((2 * (hMax - y)) / PHYS.gDown)];
}

/** Plays a course perfectly (jumps centred over each obstacle, slides just before drones). */
function runBot(seed, metres, dt = 1 / 240) {
	const course = makeCourse(seed);
	const r = newRunner();
	let dist = 0;
	let oi = 0;
	let ci = 0;
	const got = new Set();
	while (dist < metres * PX_PER_M) {
		course.extend(dist + 2400);
		const v = speedAt(dist);
		while (oi < course.obstacles.length && course.obstacles[oi].x + OBSTACLES[course.obstacles[oi].kind].w < dist - 60) oi++;
		while (ci < course.coins.length && course.coins[ci].x < dist - 60) ci++;
		const next = course.obstacles.slice(oi).find((o) => o.x + OBSTACLES[o.kind].w > dist - 30);
		let held = false;
		if (next) {
			const s = OBSTACLES[next.kind];
			const front = next.x - (dist + 15);
			if (s.act === 'slide') {
				if (front < 8 + v * 0.02) {
					if (r.slide <= 0 && !r.slideQueued) pressSlide(r);
					held = true;
				}
			} else if (!airborne(r)) {
				const [t1, t2] = airWindow(s.h1 - 3);
				const span = s.w + 30;
				if (front <= (v * (t1 + t2)) / 2 - span / 2) pressJump(r);
			}
		}
		stepRunner(r, dt, held);
		dist += v * dt;
		for (let i = oi; i < course.obstacles.length; i++) {
			const o = course.obstacles[i];
			if (o.x > dist + 200) break;
			if (hits(r, dist, o)) return { dead: true, dist, kind: o.kind, at: o.x, coins: got.size };
		}
		for (let i = ci; i < course.coins.length; i++) {
			const c = course.coins[i];
			if (c.x > dist + 100) break;
			if (!got.has(c.id) && grabs(r, dist, c)) got.add(c.id);
		}
	}
	return { dead: false, dist, coins: got.size };
}

test('the same seed gives the same course, however it is extended', () => {
	const a = makeCourse(12345);
	a.extend(60000);
	const b = makeCourse(12345);
	for (let x = 0; x <= 60000; x += 777) b.extend(x);
	b.extend(60000);
	const n = Math.min(a.obstacles.length, b.obstacles.length);
	assert.ok(n > 40);
	assert.deepEqual(a.obstacles.slice(0, n), b.obstacles.slice(0, n));
	const k = Math.min(a.coins.length, b.coins.length);
	assert.deepEqual(a.coins.slice(0, k), b.coins.slice(0, k));
	const c = makeCourse(54321);
	c.extend(60000);
	assert.notDeepEqual(
		c.obstacles.slice(0, 20).map((o) => [o.kind, o.x]),
		a.obstacles.slice(0, 20).map((o) => [o.kind, o.x])
	);
});

test('obstacles come in order, start after a run-up and each kind is introduced on time', () => {
	for (const seed of [1, 2, 3, 99, 12345, 0xdeadbeef]) {
		const c = makeCourse(seed);
		c.extend(2000 * PX_PER_M);
		assert.equal(c.obstacles[0].x, FIRST_AT);
		for (let i = 1; i < c.obstacles.length; i++) assert.ok(c.obstacles[i].x > c.obstacles[i - 1].x, 'sorted');
		for (const kind of Object.keys(OBSTACLES)) {
			const first = c.obstacles.find((o) => o.kind === kind);
			assert.ok(first, `${kind} shows up by 2,000 m`);
			assert.ok(first.x / PX_PER_M >= OBSTACLES[kind].from - 1, `${kind} not before ${OBSTACLES[kind].from} m`);
		}
		// gaps (end of one obstacle → start of the next) are never tiny
		for (let i = 1; i < c.obstacles.length; i++) {
			const prev = c.obstacles[i - 1];
			const gap = c.obstacles[i].x - (prev.x + OBSTACLES[prev.kind].w);
			assert.ok(gap >= 50, `gap ${gap} at ${prev.x}`);
		}
	}
});

test('coins never sit inside an obstacle', () => {
	for (const seed of [7, 8, 9, 12345]) {
		const c = makeCourse(seed);
		c.extend(2500 * PX_PER_M);
		assert.ok(c.coins.length > 60);
		for (const coin of c.coins) {
			for (const o of c.obstacles) {
				const s = OBSTACLES[o.kind];
				const inX = coin.x > o.x - 14 && coin.x < o.x + s.w + 14;
				const inH = coin.h > s.h0 - 14 && coin.h < s.h1 + 14;
				assert.ok(!(inX && inH), `coin ${coin.x},${coin.h} inside ${o.kind} at ${o.x}`);
			}
		}
	}
});

test('the runner: jump arc, buffered jump, slam into a slide, held slide', () => {
	const r = newRunner();
	pressJump(r);
	const ev = stepRunner(r, 1 / 240);
	assert.ok(ev.jumped && airborne(r));
	let top = 0;
	let t = 0;
	let landed = false;
	while (t < 2 && !landed) {
		landed = stepRunner(r, 1 / 240).landed;
		top = Math.max(top, r.h);
		t += 1 / 240;
	}
	assert.ok(landed && top > 190 && top < 215, `apex ${top}`);
	assert.ok(t > 0.7 && t < 0.85, `air time ${t}`);
	// a jump pressed just before landing happens on landing
	pressJump(r);
	stepRunner(r, 1 / 240);
	let n = 0;
	while (airborne(r) && n++ < 1000) stepRunner(r, 1 / 240);
	pressJump(r);
	assert.ok(stepRunner(r, 1 / 240).jumped);
	// slide in the air = slam down, then slide on landing
	pressSlide(r);
	assert.ok(r.vy <= -PHYS.slamV);
	n = 0;
	while (airborne(r) && n++ < 1000) stepRunner(r, 1 / 240);
	assert.ok(r.slide > 0, 'slides after the slam');
	assert.equal(runnerBox(r).h1, 38);
	// a tap slides for slideTime; holding keeps it going longer
	const a = newRunner();
	pressSlide(a);
	let ta = 0;
	while (a.slide > 0) {
		stepRunner(a, 1 / 240, false);
		ta += 1 / 240;
	}
	const b = newRunner();
	pressSlide(b);
	let tb = 0;
	while (b.slide > 0) {
		stepRunner(b, 1 / 240, true);
		tb += 1 / 240;
	}
	assert.ok(Math.abs(ta - PHYS.slideTime) < 0.02, `tap slide ${ta}`);
	assert.ok(tb > PHYS.slideMax, `held slide ${tb}`);
});

test('hit boxes: standing hits a drone, sliding passes under it, jumping clears a car', () => {
	const drone = { id: 0, kind: 'drone', x: 100 };
	const car = { id: 1, kind: 'car', x: 100 };
	const r = newRunner();
	assert.ok(hits(r, 120, drone));
	pressSlide(r);
	stepRunner(r, 1 / 240);
	assert.ok(!hits(r, 120, drone));
	assert.ok(hits(r, 120, car), 'a slide does not get under a car');
	const j = newRunner();
	j.h = 120;
	j.vy = 10;
	assert.ok(!hits(j, 160, car));
	assert.ok(grabs(newRunner(), 100, { id: 0, x: 110, h: 24 }));
	assert.ok(!grabs(newRunner(), 100, { id: 0, x: 110, h: 200 }));
});

test('every course can be cleared: a bot with the game physics runs 5,000 m on many seeds', () => {
	for (let seed = 1; seed <= 40; seed++) {
		const res = runBot(seed * 7919, 5000);
		assert.equal(res.dead, false, `seed ${seed * 7919}: died at ${Math.round(res.dist / PX_PER_M)} m on ${res.kind} (${res.at})`);
		assert.ok(res.coins > 40, `coins ${res.coins}`);
	}
});

test('speed ramps from 9 m/s up to MAX_SPEED; the score is metres + 10 per coin', () => {
	assert.equal(speedAt(0), 9 * PX_PER_M);
	assert.ok(speedAt(500 * PX_PER_M) > speedAt(100 * PX_PER_M));
	assert.ok(speedAt(1e7) <= MAX_SPEED * PX_PER_M + 1e-9);
	assert.equal(scoreOf(1234 * PX_PER_M + 39, 12), 1234 + 120);
	assert.equal(scoreOf(0, 0), 0);
});
