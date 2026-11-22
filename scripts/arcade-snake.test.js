// Munchie Snake (src/lib/arcade/snake.ts): moves, turns, growth, collisions, food / golden burger / cone
// placement from the seed, pace and points. `node --test scripts/arcade-snake.test.js`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	SnakeGame,
	GRID,
	DIRS,
	OPPOSITE,
	MUNCHIES,
	START_LEN,
	GROW,
	GOLD_GROW,
	GOLD_POINTS,
	CONES_FROM,
	MAX_CONES,
	munchiePoints,
	stepMs,
	paceLevel
} from '../src/lib/arcade/snake.ts';

const key = (c) => `${c.x},${c.y}`;

/** A simple player: shortest path to the golden burger or the munchie, avoiding walls, cones and smoke. */
function autopilot(g) {
	const blocked = new Set([...g.cones.map(key), ...g.body.slice(0, -1).map(key)]);
	const goals = new Set([key(g.food.cell), ...(g.gold ? [key(g.gold.cell)] : [])]);
	const h = g.head;
	const parent = new Map([[key(h), null]]);
	const q = [h];
	while (q.length) {
		const c = q.shift();
		if (c !== h && goals.has(key(c))) {
			let cur = c;
			while (key(parent.get(key(cur))) !== key(h)) cur = parent.get(key(cur));
			return Object.keys(DIRS).find((d) => h.x + DIRS[d][0] === cur.x && h.y + DIRS[d][1] === cur.y);
		}
		for (const [dx, dy] of Object.values(DIRS)) {
			const n = { x: c.x + dx, y: c.y + dy };
			if (n.x < 0 || n.y < 0 || n.x >= GRID || n.y >= GRID || blocked.has(key(n)) || parent.has(key(n))) continue;
			parent.set(key(n), c);
			q.push(n);
		}
	}
	// no path: any safe way
	return Object.keys(DIRS).find((d) => {
		const n = { x: h.x + DIRS[d][0], y: h.y + DIRS[d][1] };
		return d !== OPPOSITE[g.dir] && n.x >= 0 && n.y >= 0 && n.x < GRID && n.y < GRID && !blocked.has(key(n));
	});
}

function play(seed, maxSteps = 6000) {
	const g = new SnakeGame(seed);
	const log = [];
	while (!g.dead && g.steps < maxSteps) {
		const d = autopilot(g);
		if (d && d !== g.dir) g.turn(d);
		const ev = g.step();
		log.push(ev);
		// invariants after every step
		if (!g.dead) {
			const cells = g.body.map(key);
			assert.equal(new Set(cells).size, cells.length, 'the smoke never overlaps itself');
			assert.ok(!g.onSnake(g.food.cell), 'the munchie is never on the snake');
			assert.ok(!g.isCone(g.food.cell), 'the munchie is never on a cone');
			if (g.gold) assert.ok(!g.onSnake(g.gold.cell) || key(g.gold.cell) === key(g.head));
		}
	}
	return { g, log };
}

test('same seed and same moves = the same game; another seed = other munchies', () => {
	const a = play(12345);
	const b = play(12345);
	assert.deepEqual(JSON.stringify(a.g), JSON.stringify(b.g));
	assert.deepEqual(a.log, b.log);
	const c = new SnakeGame(999);
	const d = new SnakeGame(12345);
	assert.notDeepEqual([c.food.cell, c.food.kind], [d.food.cell, d.food.kind]);
});

test('the first munchies come in the same order for everyone, however they move', () => {
	// two players with different paths eat the same first munchies at the same spots
	const seq = (turns) => {
		const g = new SnakeGame(4242);
		const seen = [`${key(g.food.cell)}:${g.food.kind}`];
		let i = 0;
		while (!g.dead && seen.length < 6 && i < 4000) {
			const d = turns(g, i++);
			if (d) g.turn(d);
			const ev = g.step();
			if (ev.ate) seen.push(`${key(g.food.cell)}:${g.food.kind}`);
		}
		return seen;
	};
	const direct = seq((g) => autopilot(g));
	const wiggly = seq((g, i) => (i % 9 === 4 && g.steps < 40 ? null : autopilot(g)));
	assert.equal(direct.length, 6);
	assert.deepEqual(direct, wiggly);
});

test('turning: no reversing into your own smoke, at most two queued turns', () => {
	const g = new SnakeGame(1);
	g.food = { cell: { x: 16, y: 16 }, kind: 'burger' };
	assert.equal(g.dir, 'right');
	assert.equal(g.turn('left'), false, 'no reverse');
	assert.equal(g.turn('right'), false, 'same way');
	assert.equal(g.turn('up'), true);
	assert.equal(g.turn('down'), false, 'reverse of the queued turn');
	assert.equal(g.turn('left'), true);
	assert.equal(g.turn('down'), false, 'queue full');
	const h = { ...g.head };
	g.step();
	assert.deepEqual(g.head, { x: h.x, y: h.y - 1 });
	g.step();
	assert.deepEqual(g.head, { x: h.x - 1, y: h.y - 1 });
	assert.equal(g.body.length, START_LEN);
});

test('walls, cones and your own smoke end the run', () => {
	const w = new SnakeGame(7);
	w.food = { cell: { x: 0, y: 0 }, kind: 'burger' };
	let ev = {};
	for (let i = 0; i < GRID && !w.dead; i++) ev = w.step();
	assert.equal(w.dead, 'wall');
	assert.equal(ev.died, 'wall');
	assert.equal(w.step().died, undefined, 'nothing happens after the end');

	const c = new SnakeGame(7);
	c.food = { cell: { x: 0, y: 0 }, kind: 'burger' };
	c.cones = [{ x: c.head.x + 1, y: c.head.y }];
	assert.equal(c.step().died, 'cone');

	const s = new SnakeGame(7);
	s.food = { cell: { x: 0, y: 0 }, kind: 'burger' };
	s.body = [
		{ x: 5, y: 5 },
		{ x: 4, y: 5 },
		{ x: 4, y: 6 },
		{ x: 5, y: 6 },
		{ x: 6, y: 6 },
		{ x: 6, y: 5 }
	];
	s.dir = 'right';
	s.turn('up');
	s.step(); // (5,4)
	s.turn('left');
	s.step(); // (4,4)
	s.turn('down'); // (4,5) is smoke
	assert.equal(s.step().died, 'self');
});

test('moving into the cell your tail just left is fine (unless you are growing)', () => {
	const g = new SnakeGame(3);
	g.food = { cell: { x: 0, y: 0 }, kind: 'burger' };
	g.body = [
		{ x: 5, y: 5 },
		{ x: 6, y: 5 },
		{ x: 6, y: 6 },
		{ x: 5, y: 6 }
	];
	g.dir = 'left';
	g.turn('down');
	assert.equal(g.step().died, undefined);
	assert.deepEqual(g.head, { x: 5, y: 6 });
	const k = new SnakeGame(3);
	k.food = { cell: { x: 0, y: 0 }, kind: 'burger' };
	k.body = [
		{ x: 5, y: 5 },
		{ x: 6, y: 5 },
		{ x: 6, y: 6 },
		{ x: 5, y: 6 }
	];
	k.dir = 'left';
	k.grow = 1;
	k.turn('down');
	assert.equal(k.step().died, 'self');
});

test('eating grows the smoke, scores 10 + the pace bonus, and places the next munchie elsewhere', () => {
	const g = new SnakeGame(11);
	const h = g.head;
	g.food = { cell: { x: h.x + 1, y: h.y }, kind: 'taco' };
	const ev = g.step();
	assert.equal(ev.ate, 'taco');
	assert.equal(ev.points, 10);
	assert.equal(g.score, 10);
	assert.equal(g.eaten, 1);
	assert.ok(MUNCHIES.includes(g.food.kind));
	assert.notDeepEqual(g.food.cell, g.head);
	for (let i = 0; i < GROW; i++) g.step();
	assert.equal(g.body.length, START_LEN + GROW);
	assert.deepEqual([0, 4, 5, 9, 10, 25].map(munchiePoints), [10, 10, 12, 12, 14, 20]);
	assert.equal(stepMs(0), 150);
	assert.equal(stepMs(5), 139);
	assert.ok(stepMs(1000) >= 68);
	for (let e = 1; e < 80; e++) assert.ok(stepMs(e) <= stepMs(e - 1));
	assert.equal(paceLevel(0), 1);
	assert.equal(paceLevel(10), 3);
});

test('a golden burger appears, pays 50 + extra smoke when eaten, or vanishes when it runs out', () => {
	let spawned = 0;
	let eaten = 0;
	let gone = 0;
	for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
		const { g, log } = play(seed, 4000);
		spawned += log.filter((e) => e.goldSpawned).length;
		eaten += log.filter((e) => e.gold).length;
		gone += log.filter((e) => e.goldGone).length;
		assert.equal(g.golds, log.filter((e) => e.gold).length);
	}
	assert.ok(spawned > 4, `golden burgers show up (${spawned})`);
	assert.ok(eaten > 0, 'and some get eaten');
	assert.ok(eaten + gone <= spawned, 'each one is eaten, vanishes or is still there');

	const g = new SnakeGame(21);
	const h = g.head;
	g.food = { cell: { x: 0, y: 0 }, kind: 'fries' };
	g.gold = { cell: { x: h.x + 1, y: h.y }, at: 0, until: 99 };
	const ev = g.step();
	assert.equal(ev.gold, true);
	assert.equal(g.score, GOLD_POINTS);
	assert.equal(g.grow, GOLD_GROW);
	const v = new SnakeGame(21);
	v.food = { cell: { x: 0, y: 0 }, kind: 'fries' };
	v.gold = { cell: { x: 16, y: 0 }, at: 0, until: 2 };
	v.step();
	assert.ok(v.gold);
	assert.equal(v.step().goldGone, true);
	assert.equal(v.gold, null);
});

test('cones only after 10 munchies, never on the edge, never next to each other, never right ahead', () => {
	let total = 0;
	for (const seed of [12345, 99, 31337, 2026, 8]) {
		const g = new SnakeGame(seed);
		while (!g.dead && g.steps < 8000) {
			const d = autopilot(g);
			if (d && d !== g.dir) g.turn(d);
			const before = g.eaten;
			const ev = g.step();
			if (ev.cone) {
				total++;
				assert.ok(before + 1 >= CONES_FROM, 'not before the 10th munchie');
				const c = ev.cone;
				assert.ok(c.x >= 1 && c.y >= 1 && c.x <= GRID - 2 && c.y <= GRID - 2, 'not on the edge');
				assert.ok(Math.max(Math.abs(c.x - g.head.x), Math.abs(c.y - g.head.y)) > 3, 'not near the head');
				for (const k of g.cones) if (k !== c) assert.ok(Math.max(Math.abs(k.x - c.x), Math.abs(k.y - c.y)) > 1, 'cones keep apart');
			}
			assert.ok(g.cones.length <= MAX_CONES);
		}
	}
	assert.ok(total > 3, `cones appear in longer runs (${total})`);
});
