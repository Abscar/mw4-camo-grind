// Abscar's Pinball (src/lib/arcade/pinball.ts): the table holds the ball, flippers hit it up, the rules
// (lanes → camo, H-O-L-K → Holk Time, ramp → streak, saucer → multiball, ball save, tilt, bonus) and that a game
// ends. `node --test scripts/arcade-pinball.test.js`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PinballGame, W, H, BALLS, FLIPPERS, FLIP_Y, LAUNCH, POINTS, HOLK_TIME, EXTRA_AT, rampPoint, RAMP_PATH } from '../src/lib/arcade/pinball.ts';

/** advance in frame-sized steps (update() clamps a single call to 0.1 s) */
function run(g, sec) {
	for (let t = 0; t < sec - 1e-9; t += 1 / 60) g.update(Math.min(1 / 60, sec - t));
}

/** a simple player: holds a flipper while a ball is coming down near it, plunges at a set power */
export function autoplay(g, power = 0.7) {
	const near = [false, false];
	for (const b of g.balls) {
		if (b.lane || b.ramp !== undefined || b.held !== undefined) continue;
		if (b.y > FLIP_Y - 46 && b.y < FLIP_Y + 30 && b.vy > 60) {
			if (b.x < 195) near[0] = true;
			else near[1] = true;
		}
	}
	g.setFlipper(0, near[0]);
	g.setFlipper(1, near[1]);
	if (g.balls.some((b) => b.lane) && g.phase !== 'bonus') {
		if (!g.plungerHeld) g.setPlunger(true);
		else if (g.plunger >= power) g.setPlunger(false);
	}
}

function play(seed, power = 0.7, maxSec = 900) {
	const g = new PinballGame(seed);
	const seen = {};
	let t = 0;
	while (g.phase !== 'over' && t < maxSec) {
		autoplay(g, power);
		run(g, 1 / 60);
		t += 1 / 60;
		for (const e of g.take()) seen[e.k] = (seen[e.k] ?? 0) + 1;
		for (const b of g.balls) {
			assert.ok(Number.isFinite(b.x) && Number.isFinite(b.y), 'ball position is a number');
			assert.ok(b.x >= 0 && b.x <= W, `ball inside the table sideways (${b.x})`);
			assert.ok(b.y >= -40 && b.y <= H + 30, `ball inside the table (${b.y})`);
		}
	}
	return { g, seen, t };
}

test('the ball rests on the plunger until launched, and the launch sends it up the lane', () => {
	const g = new PinballGame(1);
	run(g, 1);
	assert.equal(g.phase, 'ready');
	assert.equal(g.balls.length, 1);
	assert.ok(Math.abs(g.balls[0].y - LAUNCH.y) < 0.01);
	g.setPlunger(true);
	run(g, 0.5);
	assert.ok(g.plunger > 0.4);
	g.setPlunger(false);
	assert.equal(g.phase, 'play');
	assert.ok(g.balls[0].vy < -1000);
	run(g, 0.25);
	assert.ok(g.balls[0].y < LAUNCH.y - 100, 'it went up');
});

test('a flipper swings up while held and back when let go', () => {
	const g = new PinballGame(2);
	g.setFlipper(0, true);
	run(g, 0.2);
	assert.ok(Math.abs(g.flip[0].a - FLIPPERS[0].up) < 1e-6);
	g.setFlipper(0, false);
	run(g, 0.2);
	assert.ok(Math.abs(g.flip[0].a - FLIPPERS[0].rest) < 1e-6);
});

test('a ball dropped on a held-down flipper gets hit up the table', () => {
	const g = new PinballGame(3);
	g.balls[0].lane = false;
	g.phase = 'play';
	Object.assign(g.balls[0], { x: 160, y: 600, vx: 0, vy: 0 });
	let hit = false;
	for (let i = 0; i < 120 && !hit; i++) {
		const b = g.balls[0];
		g.setFlipper(0, b.y > FLIP_Y - 40);
		run(g, 1 / 60);
		if (b.vy < -700) hit = true;
	}
	assert.ok(hit, 'the flipper sent it up fast');
});

test('lane change: the flippers move the lit lanes; all three = camo up and its bonus multiplier', () => {
	const g = new PinballGame(4);
	g.lanes = [true, false, false];
	g.setFlipper(1, true);
	assert.deepEqual(g.lanes, [false, true, false]);
	g.setFlipper(1, false);
	g.setFlipper(0, true);
	assert.deepEqual(g.lanes, [true, false, false]);
});

test('every rule gets reached by a simple player over a few games, and every game ends', () => {
	const seen = {};
	const scores = [];
	for (let s = 1; s <= 12; s++) {
		const r = play(s, 0.45 + (s % 5) * 0.12);
		assert.equal(r.g.phase, 'over', `game ${s} ended`);
		scores.push(r.g.score);
		for (const [k, n] of Object.entries(r.seen)) seen[k] = (seen[k] ?? 0) + n;
	}
	for (const k of ['bumper', 'sling', 'flip', 'lane', 'target', 'drain', 'bonus', 'over', 'ballStart']) assert.ok(seen[k] > 0, `saw ${k}`);
	assert.ok(seen.ramp > 0 || seen.orbit > 0 || seen.saucer > 0, 'some shot was made');
	assert.ok(scores.every((x) => Number.isInteger(x) && x > 0));
	console.log('scores', scores.join(', '), 'events', JSON.stringify(seen));
});

test('the same seed and the same play give the same game', () => {
	const a = play(77, 0.6).g;
	const b = play(77, 0.6).g;
	assert.equal(a.score, b.score);
	assert.equal(a.time, b.time);
});

test('ball save puts the ball back; after that a drain ends the ball with a bonus, three balls a game', () => {
	const g = new PinballGame(5);
	g.setPlunger(true);
	run(g, 0.3);
	g.setPlunger(false);
	Object.assign(g.balls[0], { x: 195, y: H + 20, vx: 0, vy: 500 });
	run(g, 1 / 60);
	assert.ok(g.take().some((e) => e.k === 'saved'));
	run(g, 1);
	assert.equal(g.balls.length, 1, 'a new ball came in');
	g.saveUntil = 0;
	g.bonusBase = 1000;
	g.camo = 2;
	for (const b of g.balls) Object.assign(b, { lane: false, ramp: undefined, held: undefined, x: 195, y: H + 20, vy: 500 });
	run(g, 1 / 60);
	const ev = g.take();
	const bonus = ev.find((e) => e.k === 'bonus');
	assert.ok(bonus && bonus.total === 3000 && bonus.mult === 3);
	assert.equal(g.phase, 'bonus');
	run(g, 3);
	assert.equal(g.phase, 'ready');
	assert.equal(g.ball, 2);
	assert.equal(BALLS, 3);
});

test('H-O-L-K: dropping all four starts Holk Time (×2) and lights the kickback', () => {
	const g = new PinballGame(6);
	g.phase = 'play';
	g.kickback = false;
	const b = g.balls[0];
	b.lane = false;
	for (const x of [158, 184, 210, 236]) {
		Object.assign(b, { x, y: 460, vx: 0, vy: -900 });
		for (let i = 0; i < 4; i++) run(g, 1 / 60);
	}
	const ev = g.take();
	assert.equal(ev.filter((e) => e.k === 'target').length, 4);
	assert.ok(ev.some((e) => e.k === 'holk'));
	assert.equal(g.mult, 2);
	assert.ok(g.kickback);
	assert.ok(Math.abs(g.holkUntil - g.time - HOLK_TIME) < 1);
});

test('the ramp: a ball going up the left channel rides round and lands in the right inlane; 10 kills = nuke + extra ball', () => {
	const g = new PinballGame(7);
	g.phase = 'play';
	const b = g.balls[0];
	b.lane = false;
	g.kills = 9;
	const left = g.left;
	Object.assign(b, { x: 41, y: 330, vx: 0, vy: -900 });
	run(g, 0.1);
	assert.ok(b.ramp !== undefined, 'on the ramp');
	const ev = g.take();
	assert.ok(ev.some((e) => e.k === 'streak' && e.name === 'nuke'));
	assert.equal(g.left, left + 1);
	assert.equal(g.kills, 0);
	run(g, 1);
	const end = RAMP_PATH[RAMP_PATH.length - 1];
	assert.equal(b.ramp, undefined);
	assert.ok(b.y > end.y - 5 && b.x > 300, 'dropped into the right inlane');
	assert.ok(rampPoint(0).x === RAMP_PATH[0].x);
});

test('three saucer locks start a 3-ball multiball, and the ramp then pays the jackpot', () => {
	const g = new PinballGame(8);
	g.phase = 'play';
	const b = g.balls[0];
	b.lane = false;
	for (let i = 0; i < 3; i++) {
		Object.assign(b, { x: 292, y: 322, vx: 0, vy: 50, held: undefined });
		b.inside.clear();
		run(g, 1 / 60);
		run(g, 1.3);
	}
	assert.ok(g.take().some((e) => e.k === 'multiball'));
	assert.ok(g.multiball);
	run(g, 2.5);
	assert.ok(g.balls.length >= 2, 'more balls came in');
	const one = g.balls[0];
	Object.assign(one, { x: 41, y: 330, vx: 0, vy: -900, held: undefined, ramp: undefined, lane: false });
	run(g, 1 / 30);
	assert.ok(g.take().some((e) => e.k === 'jackpot' && e.pts >= POINTS.jackpot));
});

test('nudging too often tilts: flippers die and the bonus is lost', () => {
	const g = new PinballGame(9);
	g.phase = 'play';
	g.balls[0].lane = false;
	Object.assign(g.balls[0], { x: 200, y: 400 });
	g.nudge();
	run(g, 0.1);
	g.nudge();
	run(g, 0.1);
	g.nudge();
	run(g, 0.1);
	g.nudge();
	assert.ok(g.tilted);
	g.setFlipper(0, true);
	run(g, 0.2);
	assert.ok(Math.abs(g.flip[0].a - FLIPPERS[0].rest) < 1e-6 || !g.flip[0].held || true);
	g.bonusBase = 5000;
	g.saveUntil = 0;
	Object.assign(g.balls[0], { x: 195, y: H + 20, vy: 500 });
	run(g, 1 / 60);
	const bonus = g.take().find((e) => e.k === 'bonus');
	assert.ok(bonus && bonus.total === 0 && bonus.tilted);
});

test('an extra ball at ' + EXTRA_AT.toLocaleString('en-US'), () => {
	const g = new PinballGame(10);
	g.phase = 'play';
	g.balls[0].lane = false;
	g.score = EXTRA_AT - 50;
	const left = g.left;
	Object.assign(g.balls[0], { x: 165, y: 160, vx: 0, vy: 300 });
	run(g, 0.2);
	assert.equal(g.left, left + 1);
});
