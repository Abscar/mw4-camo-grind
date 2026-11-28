// Abscars Madness ragdolls (src/lib/mayhem/ragdoll.ts + how engine.ts uses them): bodies fall in one piece, keep
// their limb lengths, bend knees and elbows only the right way, land on floors and ledges, stay out of walls, fall
// down pits, settle and sleep, and get thrown about by blasts and bullets.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FLOOR, Mayhem, NO_INPUT } from '../src/lib/mayhem/engine.ts';
import { STARTER } from '../src/lib/mayhem/guns.ts';
import { makeRag, pushRag, R, ragCenter, stepRag } from '../src/lib/mayhem/ragdoll.ts';

const seeded = (seed = 7) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const world = (over = {}) => ({ floor: FLOOR, onGround: () => true, plats: [], solids: [], gravity: 1700, ...over });
const run = (rag, w, secs) => {
	for (let i = 0; i < secs * 60; i++) stepRag(rag, 1 / 60, w);
};
const len = (rag, a, b) => Math.hypot(rag.p[a].x - rag.p[b].x, rag.p[a].y - rag.p[b].y);
const bend = (rag, a, m, b) => {
	const p = rag.p;
	return (p[m].x - p[a].x) * (p[b].y - p[m].y) - (p[m].y - p[a].y) * (p[b].x - p[m].x);
};

test('a body falls, lands on the floor and goes to sleep with its bones the same length', () => {
	for (const facing of [1, -1]) {
		const rag = makeRag(300, FLOOR, 1, facing, 0, 0, 300 * facing, -200, false, seeded());
		const rest = rag.sticks.map((k) => [k.min, k.max]);
		run(rag, world(), 5);
		assert.ok(rag.asleep, 'it settles');
		for (const q of rag.p) assert.ok(q.y <= FLOOR - q.r + 0.6 && q.y > FLOOR - 40, `every point rests on the floor (${q.y})`);
		rag.sticks.forEach((k, i) => {
			const d = len(rag, k.a, k.b);
			assert.ok(d >= rest[i][0] * 0.94 && d <= rest[i][1] * 1.06, `stick ${k.a}-${k.b} keeps its length`);
		});
		// lying down: the head is about as low as the hips
		const c = ragCenter(rag);
		assert.ok(Math.abs(rag.p[R.head].y - rag.p[R.hipF].y) < 20, 'it ends up lying, not standing');
		// and it stays where it fell (no sliding along the floor)
		assert.ok(Math.abs(c.x - 300) < 220, `it lies near where it died (${c.x.toFixed(0)})`);
	}
});

test('knees and elbows never bend the wrong way, even when thrown hard', () => {
	const r = seeded(3);
	for (let n = 0; n < 30; n++) {
		const rag = makeRag(400, FLOOR, 1, r() < 0.5 ? 1 : -1, 0, 0, (r() - 0.5) * 1600, -r() * 900, r() < 0.5, r);
		let worst = 0;
		for (let i = 0; i < 240; i++) {
			stepRag(rag, 1 / 60, world());
			for (const h of rag.hinges) worst = Math.min(worst, (bend(rag, h.a, h.m, h.b) * h.sign) / (len(rag, h.a, h.m) * len(rag, h.m, h.b)));
		}
		// sin of the wrong-way angle stays tiny (a hinge is pushed back within a step)
		assert.ok(worst > -0.35, `hinge bent backwards (${worst.toFixed(2)})`);
	}
});

test('a headshot from the left throws the body over backwards to the right', () => {
	const rag = makeRag(300, FLOOR, 1, -1, 0, 0, 260, -160, true, seeded(11));
	run(rag, world(), 4);
	const feet = (rag.p[R.footF].x + rag.p[R.footB].x) / 2;
	assert.ok(rag.p[R.head].x > feet + 20, `head lands past the feet (${rag.p[R.head].x.toFixed(0)} vs ${feet.toFixed(0)})`);
});

test('no floor = it falls down the pit; a ledge catches it from above', () => {
	const pit = makeRag(300, FLOOR, 1, 1, 0, 0, 0, 0, false, seeded());
	run(pit, world({ onGround: () => false }), 2);
	assert.ok(ragCenter(pit).y > FLOOR + 200);
	const ledge = makeRag(300, 200, 1, 1, 0, 0, 0, 0, false, seeded());
	run(ledge, world({ plats: [{ x: 200, y: 250, w: 220 }] }), 4);
	for (const q of ledge.p) if (q.x > 200 + q.r && q.x < 420 - q.r) assert.ok(q.y <= 250 - q.r + 0.6, 'stays on the ledge');
	assert.ok(ragCenter(ledge).y > 200, 'it did fall onto it');
});

test('a wall stops the body: no point ends up inside it', () => {
	const wall = { x: 340, y: FLOOR - 200, w: 30, h: 200 };
	const rag = makeRag(300, FLOOR, 1, 1, 0, 0, 900, -100, false, seeded(5));
	run(rag, world({ solids: [wall] }), 4);
	for (const q of rag.p) assert.ok(!(q.x > wall.x && q.x < wall.x + wall.w && q.y > wall.y && q.y < wall.y + wall.h), 'outside the wall');
});

test('a sleeping body wakes and flies when pushed', () => {
	const rag = makeRag(300, FLOOR, 1, 1, 0, 0, 0, 0, false, seeded());
	run(rag, world(), 5);
	assert.ok(rag.asleep);
	assert.ok(Math.abs(ragCenter(rag).x - 300) < 40, 'a body that just drops does not slide off');
	const { x: cx, y: y0 } = ragCenter(rag);
	assert.ok(pushRag(rag, cx, y0, 80, 300, -700));
	assert.ok(!rag.asleep);
	let top = y0;
	for (let i = 0; i < 30; i++) {
		stepRag(rag, 1 / 60, world());
		top = Math.min(top, ragCenter(rag).y);
	}
	assert.ok(top < y0 - 20, 'it went up');
});

test('in the game: a killed enemy becomes a ragdoll that settles on the floor; shooting it moves it', () => {
	const g = new Mayhem('o1', STARTER, [], 5);
	const e = g.enemies[0];
	g.enemies = [e];
	e.x = g.player.x + 120;
	e.y = FLOOR;
	e.held = { id: STARTER, ammo: 12 };
	e.hp = 1;
	const aim = { ...NO_INPUT, aimX: e.x, aimY: FLOOR - 40 };
	const step = (secs, inp) => {
		for (let i = 0; i < secs * 60; i++) g.step(1 / 60, inp);
	};
	step(0.05, aim);
	step(0.02, { ...aim, fire: true });
	step(0.1, aim);
	assert.equal(g.corpses.length, 1);
	const body = g.corpses[0];
	assert.ok(body.rag && body.rag.p.length === 13);
	step(5, aim);
	assert.ok(body.still, 'it has settled');
	for (const q of body.rag.p) assert.ok(q.y <= FLOOR - q.r + 0.6);
	assert.ok(Math.abs(body.y - ragCenter(body.rag).y) < 0.01, 'the corpse middle follows the ragdoll');
	// shoot the body where it lies
	const before = body.rag.p.map((q) => [q.x, q.y]);
	const low = { ...NO_INPUT, aimX: body.x, aimY: body.y };
	g.player.held = { id: STARTER, ammo: 12 };
	step(0.05, low);
	step(0.02, { ...low, fire: true });
	step(0.3, low);
	const moved = body.rag.p.some((q, i) => Math.hypot(q.x - before[i][0], q.y - before[i][1]) > 1.5);
	assert.ok(moved, 'a bullet makes the body jerk');
});
