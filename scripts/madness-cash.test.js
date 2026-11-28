// Abscars Madness: loot cash (engine.ts `#dropCash` + the pickup loop). Killed enemies spill bundles of cash;
// walking over them (or close: they slide to you) picks them up, adds to `cash` and fires a `cash` event
// that the page banks at once.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CASH, FLOOR, Mayhem, NO_INPUT } from '../src/lib/mayhem/engine.ts';
import { STARTER } from '../src/lib/mayhem/guns.ts';

const idle = { ...NO_INPUT };
const run = (g, secs, inp = idle) => {
	for (let i = 0; i < secs * 60; i++) g.step(1 / 60, inp);
};
/** one unaware enemy at x, back turned, player just behind it */
function lone(x, facing) {
	const g = new Mayhem('o1', STARTER, [], 1);
	const e = g.enemies[0];
	g.enemies = [e];
	e.x = x;
	e.y = FLOOR;
	e.home = x;
	e.facing = facing;
	e.vx = e.vy = 0;
	g.player.x = x - 26;
	g.player.y = FLOOR;
	return { g, e };
}

test('a kill spills cash that you pick up, and every pickup is reported', () => {
	const { g, e } = lone(500, 1);
	run(g, 0.1, { ...idle, aimX: 700, aimY: FLOOR - 60 });
	assert.equal(g.canTakedown(), e);
	g.step(1 / 60, { ...idle, fire: true, aimX: 700, aimY: FLOOR - 60 });
	const bills = g.pickups.filter((k) => k.cash);
	assert.ok(bills.length >= 1 && bills.length <= 3, `${bills.length} bundles`);
	const total = bills.reduce((n, k) => n + k.cash, 0);
	const [lo, hi] = CASH[e.kind];
	// a takedown pays double
	assert.ok(total >= Math.round(lo * 2) && total <= Math.round(hi * 2), `takedown pays ${total}`);
	assert.equal(g.cash, 0);
	// stand still: they land and slide over / are walked into
	let banked = 0;
	for (let i = 0; i < 240; i++) {
		g.step(1 / 60, idle);
		for (const ev of g.events) if (ev.t === 'cash') banked += ev.n;
	}
	assert.equal(g.cash, total, 'all picked up');
	assert.equal(banked, total, 'events add up to what was picked up');
	assert.equal(g.pickups.filter((k) => k.cash).length, 0);
});

test('cash far away stays put and fades after a while', () => {
	const { g } = lone(500, 1);
	g.enemies = [];
	g.pickups.push({ uid: 9999, x: 1500, y: FLOOR - 6, vx: 0, vy: 0, gun: null, heal: 0, life: 2, spin: 0, onGround: true, cash: 40 });
	run(g, 1);
	assert.equal(g.pickups.find((k) => k.uid === 9999)?.x, 1500, 'no magnet from afar');
	run(g, 1.5);
	assert.ok(!g.pickups.some((k) => k.uid === 9999), 'gone');
	assert.equal(g.cash, 0);
});
