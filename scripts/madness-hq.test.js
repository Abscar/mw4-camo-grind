// Abscars Madness' headquarters (src/lib/mayhem/hq.ts): walking, rooms, stations, ladders, auto-walk, fast travel,
// the secret vent.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FLOORS, Hq, HQ_NO_INPUT, HQ_W, LADDERS, LEDGES, ROOMS, SECRET_LEDGE, roomAt } from '../src/lib/mayhem/hq.ts';

const run = (hq, secs, inp = HQ_NO_INPUT) => {
	const ev = [];
	for (let i = 0; i < secs * 60; i++) {
		hq.step(1 / 60, typeof inp === 'function' ? inp(i) : inp);
		ev.push(...hq.events);
	}
	return ev;
};

test('six rooms, one station each, the stations inside their rooms and clear of the ladders', () => {
	assert.equal(ROOMS.length, 6);
	assert.deepEqual(ROOMS.map((r) => r.station).sort(), ['deploy', 'gun', 'levels', 'operator', 'settings', 'skills']);
	for (const r of ROOMS) {
		assert.ok(r.sx > r.x0 + 40 && r.sx < r.x1 - 40, r.id);
		for (const lx of LADDERS) assert.ok(Math.abs(lx - r.sx) > 100, `${r.id} too near a ladder`);
	}
	for (const lx of LADDERS) assert.ok(lx > 0 && lx < HQ_W);
});

test('starts in the locker room on the floor, walks right into the war room', () => {
	const hq = new Hq('locker');
	assert.equal(hq.room, 'locker');
	assert.equal(hq.p.y, FLOORS[0]);
	const ev = run(hq, 3.5, { ...HQ_NO_INPUT, right: true });
	assert.equal(hq.room, 'war');
	assert.ok(ev.some((e) => e.t === 'room' && e.id === 'war'));
	assert.ok(ev.some((e) => e.t === 'step'));
});

test('jump and double jump go higher than one jump, and you land again', () => {
	const one = new Hq('war');
	one.p.x = 520;
	let top1 = FLOORS[0];
	for (let i = 0; i < 90; i++) {
		one.step(1 / 60, { ...HQ_NO_INPUT, jump: i < 30 });
		top1 = Math.min(top1, one.p.y);
	}
	const two = new Hq('war');
	two.p.x = 520;
	let top2 = FLOORS[0];
	for (let i = 0; i < 120; i++) {
		two.step(1 / 60, { ...HQ_NO_INPUT, jump: i < 20 || (i > 24 && i < 50) });
		top2 = Math.min(top2, two.p.y);
	}
	assert.ok(FLOORS[0] - top1 > 60, `one jump ${FLOORS[0] - top1}`);
	assert.ok(top2 < top1 - 40, `double ${FLOORS[0] - top2} vs ${FLOORS[0] - top1}`);
	run(two, 2);
	assert.ok(two.p.onGround);
});

test('the secret vent ledge needs a double jump and is found once', () => {
	const l = LEDGES[SECRET_LEDGE];
	const one = new Hq('war');
	one.p.x = l.x + l.w / 2;
	run(one, 1.2, (i) => ({ ...HQ_NO_INPUT, jump: i < 40 }));
	assert.equal(one.secretFound, false, 'one jump is not enough');
	const hq = new Hq('war');
	hq.p.x = l.x + l.w / 2;
	const ev = run(hq, 1.5, (i) => ({ ...HQ_NO_INPUT, jump: i < 18 || (i > 22 && i < 45) }));
	assert.equal(hq.secretFound, true);
	assert.equal(ev.filter((e) => e.t === 'secret').length, 1);
	assert.equal(hq.p.y, l.y);
	// down drops through the ledge back to the floor
	run(hq, 1, (i) => ({ ...HQ_NO_INPUT, down: i < 3 }));
	assert.equal(hq.p.y, FLOORS[0]);
});

test('ladders: down at the top climbs to the basement, up at the foot climbs back', () => {
	const hq = new Hq('locker');
	hq.p.x = LADDERS[0];
	run(hq, 3, (i) => ({ ...HQ_NO_INPUT, down: true }));
	assert.equal(hq.p.y, FLOORS[1]);
	assert.equal(hq.room, 'armory');
	run(hq, 0.2);
	run(hq, 3, () => ({ ...HQ_NO_INPUT, jump: true }));
	assert.equal(hq.p.y, FLOORS[0]);
	assert.equal(hq.room, 'locker');
});

test('a tap on a station on the other floor walks there by the ladder and opens it', () => {
	const hq = new Hq('locker');
	hq.goTo('settings');
	const ev = run(hq, 20);
	const arrive = ev.find((e) => e.t === 'arrive');
	assert.ok(arrive, 'arrived');
	assert.equal(arrive.station, 'settings');
	assert.equal(roomAt(hq.p.x, hq.p.y).id, 'comms');
	assert.equal(hq.near()?.station, 'settings');
	// and back up to the helipad
	hq.goTo('deploy');
	const ev2 = run(hq, 20);
	assert.ok(ev2.some((e) => e.t === 'arrive' && e.station === 'deploy'));
	assert.equal(hq.room, 'heli');
});

test('walking cancels an auto-walk; fast travel stands you at the station', () => {
	const hq = new Hq('locker');
	hq.goTo('levels');
	run(hq, 0.3);
	run(hq, 0.1, { ...HQ_NO_INPUT, left: true });
	assert.equal(hq.target, null);
	hq.teleport('lab');
	assert.equal(hq.room, 'lab');
	assert.equal(hq.near()?.station, 'skills');
});

test('the walls of the HQ hold you in', () => {
	const hq = new Hq('locker');
	run(hq, 4, { ...HQ_NO_INPUT, left: true });
	assert.ok(hq.p.x >= 14);
	hq.teleport('heli');
	run(hq, 6, { ...HQ_NO_INPUT, right: true });
	assert.ok(hq.p.x <= HQ_W - 14);
});
