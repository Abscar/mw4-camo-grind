// The joke "BANNED" stamp (src/lib/squad-bans.ts) and how lifting it travels in the squad document
// (squad-codec.ts `bans`). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { banKey, banOf, cleanBans, fakeKd, isBanned, withBan, BAN_OWNER, JOKE_BANS, KD_LIMIT } from '../src/lib/squad-bans.ts';
import { withSnap } from '../src/lib/squad-combat.ts';
import { fromSquadWire, toSquadWire, SQUAD_OPS } from '../src/lib/squad-codec.ts';

const SINCE = JOKE_BANS.ingman.since;
const DAY = 86_400_000;
const T = SINCE + DAY;

test(`a K/D over ${KD_LIMIT} is a lie (as the board shows it, two decimals)`, () => {
	assert.equal(KD_LIMIT, 2.5);
	assert.equal(fakeKd(undefined), null);
	assert.equal(fakeKd(withSnap(undefined, 'mp', '2026-11-17', { kd: 2.5, at: T })), null, 'exactly 2.50 is fine');
	assert.equal(fakeKd(withSnap(undefined, 'mp', '2026-11-17', { kills: 2504, deaths: 1000, at: T })), null, '2.504 shows 2.50');
	assert.deepEqual(fakeKd(withSnap(undefined, 'mp', '2026-11-17', { kills: 2505, deaths: 1000, at: T })), { kd: 2.51, at: T });
	assert.deepEqual(fakeKd(withSnap(undefined, 'mp', '2026-11-17', { kd: 3.1, at: T })), { kd: 3.1, at: T });
	// Warzone counts too, and the higher lie is the one shown
	let log = withSnap(undefined, 'mp', '2026-11-17', { kd: 2.8, at: T });
	log = withSnap(log, 'wz', '2026-11-17', { kills: 400, deaths: 100, at: T + 5 });
	assert.deepEqual(fakeKd(log), { kd: 4, at: T + 5 });
	// only the latest update counts: a corrected one clears it
	const fixed = withSnap(withSnap(undefined, 'mp', '2026-11-16', { kd: 3.5, at: T - DAY }), 'mp', '2026-11-17', { kd: 1.2, at: T });
	assert.equal(fakeKd(fixed), null);
});

test('fake K/D: on by itself, Abscar can lift it, a new lie puts it back, a fix takes it off', () => {
	const key = banKey('abcdefgh1234', undefined);
	assert.equal(key, 'abcdefgh1234', 'no operator → member id');
	assert.equal(banKey('abcdefgh1234', 'lars'), 'lars');
	const lie = withSnap(undefined, 'mp', '2026-11-17', { kd: 3.2, at: T });
	assert.deepEqual(banOf(key, undefined, lie), { on: true, reason: 'Fake K/D', fake: { kd: 3.2, at: T } });
	const lifted = withBan(undefined, key, false, T + 60_000);
	assert.equal(isBanned(key, lifted, lie), false);
	const lieAgain = withSnap(lie, 'mp', '2026-11-18', { kd: 3.3, at: T + DAY });
	assert.equal(isBanned(key, lifted, lieAgain), true, 'a newer lie after the lift');
	const fixed = withSnap(lieAgain, 'mp', '2026-11-19', { kd: 1.4, at: T + 2 * DAY });
	assert.equal(isBanned(key, undefined, fixed), false, 'a corrected K/D clears it without Abscar');
	assert.equal(isBanned(key, withBan(undefined, key, true, T + 3 * DAY), fixed), true, 'Abscar can still ban by hand');
	assert.equal(isBanned('lars', undefined, withSnap(undefined, 'mp', '2026-11-17', { kd: 1.1, at: T })), false);
});

test("Ingman's joke ban stays even with an honest K/D, until Abscar lifts it", () => {
	const honest = withSnap(undefined, 'mp', '2026-11-17', { kd: 1.05, at: T });
	assert.equal(isBanned('ingman', undefined, honest), true);
	assert.equal(isBanned('ingman', withBan(undefined, 'ingman', false, T + 1), honest), false);
	// lifted, then a lie later: back on, now for the K/D
	const lie = withSnap(honest, 'mp', '2026-11-18', { kd: 2.9, at: T + DAY });
	assert.equal(banOf('ingman', withBan(undefined, 'ingman', false, T + 1), lie).on, true);
});

test('joke bans name real operators, and the owner is one', () => {
	for (const op of Object.keys(JOKE_BANS)) assert.ok(SQUAD_OPS.includes(op), op);
	assert.ok(SQUAD_OPS.includes(BAN_OWNER));
	assert.ok(!(BAN_OWNER in JOKE_BANS), 'the owner never bans himself by default');
});

test('on from the code until the owner lifts it; a later choice wins', () => {
	assert.equal(isBanned('ingman', undefined), true);
	assert.equal(isBanned('abscar', undefined), false);
	const lifted = withBan(undefined, 'ingman', false, SINCE + 60_000);
	assert.equal(isBanned('ingman', lifted), false);
	const again = withBan(lifted, 'ingman', true, SINCE + 120_000);
	assert.equal(isBanned('ingman', again), true);
	// a lift from before this joke ban started doesn't count
	assert.equal(isBanned('ingman', withBan(undefined, 'ingman', false, SINCE - 1)), true);
	// banning someone without a joke ban in the code works too
	assert.equal(isBanned('lars', withBan(undefined, 'lars', true, SINCE)), true);
});

test('cleaning drops bad entries', () => {
	assert.equal(cleanBans('x'), undefined);
	assert.equal(cleanBans({}), undefined);
	assert.deepEqual(
		cleanBans({ ingman: { on: false, at: SINCE + 0.4 }, 'Bad Op': { on: true, at: SINCE }, lars: { on: 'yes', at: SINCE }, jeeven: { on: true } }),
		{ ingman: { on: false, at: SINCE } }
	);
});

test('bans travel in the squad document; a document without them reads fine', () => {
	const doc = { members: {}, bans: { ingman: { on: false, at: SINCE + 5 } } };
	const back = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire(doc))));
	assert.deepEqual(back.bans, doc.bans);
	assert.equal(back.more, undefined, 'bans is a known field');
	const plain = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: {} }))));
	assert.equal(plain.bans, undefined);
	assert.equal(isBanned('ingman', plain.bans), true);
});
