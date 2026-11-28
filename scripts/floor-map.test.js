// The casino floor seen from above (src/lib/floorMap.ts). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DOORS, DOOR_Y, MAP_H, MAP_W, SLOT_GAMES, ZONES, doorX, spots, zoneOf } from '../src/lib/floorMap.ts';

const GAMES = ['slots', 'fortune2', 'book', 'kushburst', 'stash', 'skeddwood', 'cases', 'roulette', 'blackjack', 'bank', 'donate', 'hideout', 'admin'];

test('every casino place has a zone on the map, inside it, with seats inside the map', () => {
	for (const g of [...GAMES, 'lobby']) assert.equal(zoneOf(g).id, g, g);
	assert.equal(zoneOf('nowhere').id, 'lobby');
	assert.equal(zoneOf('ho:abcdefghijklmnopqrstuv').id, 'hideout');
	for (const z of ZONES) {
		assert.ok(z.x >= 0 && z.y >= 0 && z.x + z.w <= MAP_W && z.y + z.h <= MAP_H, z.id);
		assert.ok(z.seats.length > 0, z.id);
		for (const [x, y] of z.seats) assert.ok(x > 0 && x < MAP_W && y > 0 && y < MAP_H, `${z.id} seat`);
	}
	assert.equal(SLOT_GAMES.length, 6);
	for (let i = 0; i < DOORS; i++) assert.ok(doorX(i) + 7 < MAP_W && DOOR_Y < MAP_H);
	// slot rows don't overlap each other
	const slots = ZONES.filter((z) => z.kind === 'slot');
	for (const a of slots) for (const b of slots) if (a !== b) assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `${a.id} / ${b.id}`);
});

test('spots: the same on every page, everyone gets their own, hideout visitors at the owner’s door', () => {
	const owner = 'oooooooooooooooooooooo';
	const people = [
		{ id: 'b', w: 'slots' },
		{ id: 'a', w: 'slots' },
		{ id: 'c', w: 'slots' },
		{ id: 'd', w: 'slots' },
		{ id: 'e', w: `ho:${owner}` },
		{ id: 'f', w: 'ho:nobodyhasthisone1234' },
		{ id: 'g', w: 'roulette' }
	];
	const one = spots(people, [owner]);
	const two = spots([...people].reverse(), [owner]);
	assert.deepEqual([...one.entries()].sort(), [...two.entries()].sort());
	const at = [...one.values()].map(([x, y]) => `${x},${y}`);
	assert.equal(new Set(at).size, at.length, 'nobody on top of someone else');
	assert.deepEqual(one.get('a'), zoneOf('slots').seats[0]);
	const [ex, ey] = one.get('e');
	assert.ok(Math.abs(ex - doorX(0)) <= 8 && ey < DOOR_Y, 'at the owner’s door');
	assert.ok(zoneOf('hideout').seats.some(([x, y]) => x === one.get('f')[0] && y === one.get('f')[1]), 'no door: in the corridor');
});
