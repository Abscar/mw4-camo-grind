// Resetting the casino stats (casino-zero.ts): numbers at the reset, shown as now − then.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { casinoSince, cleanZero, grantSince, houseSince, makeZero } from '../src/lib/casino-zero.ts';
import { fromSquadWire, toSquadWire } from '../src/lib/squad-codec.ts';

const A = 'memberAAAA1', B = 'memberBBBB2', C = 'memberCCCC3';
const ledA = { dev1: { net: 5000, games: 12, at: 1 } };
const ledB = { dev1: { net: -300, games: 4, at: 1, lost: 900 } };

test('a reset takes everyone’s numbers and shows only what comes after', () => {
	const z = makeZero(1000, { [A]: { casino: ledA }, [B]: { casino: ledB }, [C]: {} }, { [A]: 200 }, { [A]: 900, [B]: 0 });
	assert.deepEqual(z.casino, { [A]: { net: 5000, games: 12 }, [B]: { net: -300, games: 4 } });
	assert.deepEqual(z.grants, { [A]: 200 });
	assert.deepEqual(z.house, { [A]: 900 });
	assert.deepEqual(casinoSince(A, ledA, z), { net: 0, games: 0 });
	assert.deepEqual(casinoSince(A, { dev1: { net: 5400, games: 14, at: 2 } }, z), { net: 400, games: 2 });
	assert.deepEqual(casinoSince(C, { d: { net: 50, games: 1, at: 2 } }, z), { net: 50, games: 1 });
	assert.equal(grantSince(A, 250, z), 50);
	assert.equal(houseSince(A, 1000, z), 100);
	assert.deepEqual(casinoSince(A, ledA, undefined), { net: 5000, games: 12 });
});

test('the reset survives the squad document and junk is dropped', () => {
	assert.equal(cleanZero({ at: 0 }), undefined);
	assert.deepEqual(cleanZero({ at: 5, casino: { bad: { net: 1, games: 1 }, [A]: { net: 'x', games: 1 } }, grants: { [A]: 1.5 } }), { at: 5 });
	const z = makeZero(1000, { [A]: { casino: ledA } }, undefined, {});
	const doc = fromSquadWire(toSquadWire({ members: {}, zero: z }));
	assert.deepEqual(doc?.zero, z);
});
