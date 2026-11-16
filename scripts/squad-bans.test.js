// The joke "BANNED" stamp (src/lib/squad-bans.ts) and how lifting it travels in the squad document
// (squad-codec.ts `bans`). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanBans, isBanned, withBan, BAN_OWNER, JOKE_BANS } from '../src/lib/squad-bans.ts';
import { fromSquadWire, toSquadWire, SQUAD_OPS } from '../src/lib/squad-codec.ts';

const SINCE = JOKE_BANS.ingman.since;

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
