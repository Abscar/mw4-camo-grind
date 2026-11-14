// K/D, W/L … typed in by each squad member (src/lib/squad-combat.ts) and how they travel in the
// squad document (squad-codec.ts `combat`). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	COMBAT_DAYS,
	cleanCombat,
	cleanSnap,
	combatView,
	fmtDelta,
	fmtRatio,
	kdOf,
	mergeCombat,
	parseField,
	rankCombat,
	winRateOf,
	withSnap,
	wlOf
} from '../src/lib/squad-combat.ts';
import { fromSquadWire, memberEntry, toSquadWire } from '../src/lib/squad-codec.ts';

const T = Date.UTC(2026, 10, 14, 18);
const DAY = 86_400_000;

test('typed numbers: counts with separators, ratios with a decimal comma', () => {
	assert.equal(parseField('kills', ''), null);
	assert.equal(parseField('kills', '  '), null);
	assert.equal(parseField('kills', '12345'), 12345);
	assert.equal(parseField('kills', '12,345'), 12345);
	assert.equal(parseField('kills', '12 345'), 12345);
	assert.equal(parseField('kills', '12.345'), 12345);
	assert.equal(parseField('kills', '12 345'), 12345);
	assert.equal(parseField('kills', '-5'), 'bad');
	assert.equal(parseField('kills', 'abc'), 'bad');
	assert.equal(parseField('kills', '1e5'), 'bad');
	assert.equal(parseField('kills', '999999999999'), 'bad');
	assert.equal(parseField('kd', '1.23'), 1.23);
	assert.equal(parseField('kd', '1,23'), 1.23);
	assert.equal(parseField('kd', '0.987'), 0.99);
	assert.equal(parseField('kd', '2'), 2);
	assert.equal(parseField('kd', '1.2.3'), 'bad');
	assert.equal(parseField('kd', '150'), 'bad');
	assert.equal(parseField('wl', 'x'), 'bad');
});

test('ratios come from the totals when both are there, else from the typed ratio', () => {
	assert.equal(kdOf({ kills: 1230, deaths: 1000 }), 1.23);
	assert.equal(kdOf({ kills: 1230, deaths: 1000, kd: 9 }), 1.23);
	assert.equal(kdOf({ kills: 50, deaths: 0 }), 50, 'no deaths: the kills on their own, like the game');
	assert.equal(kdOf({ kills: 1230, kd: 1.5 }), 1.5, 'deaths missing: the typed ratio');
	assert.equal(kdOf({ kd: 0.8 }), 0.8);
	assert.equal(kdOf({ kills: 0, deaths: 0, kd: 1.1 }), 1.1);
	assert.equal(kdOf({ wins: 3 }), null);
	assert.equal(kdOf(null), null);
	assert.equal(wlOf({ wins: 300, losses: 200 }), 1.5);
	assert.equal(wlOf({ wins: 300, wl: 1.1 }), 1.1);
	assert.equal(wlOf({ wins: 4, losses: 0 }), 4);
	assert.equal(winRateOf({ wins: 25, matches: 100 }), 25);
	assert.equal(winRateOf({ wins: 25 }), null);
	assert.equal(winRateOf({ wins: 120, matches: 100 }), null, 'more wins than matches: not shown');
});

test('stored logs are cleaned: bad days, bad numbers, nothing typed', () => {
	assert.equal(cleanSnap({ kills: 5 }), null, 'needs a time');
	assert.equal(cleanSnap({ at: T }), null, 'needs a number');
	assert.deepEqual(cleanSnap({ at: T, kills: 5.6, kd: 1.234, deaths: -1, junk: 3 }), { at: T, kills: 6, kd: 1.23 });
	assert.deepEqual(cleanSnap({ at: T, kills: 1e12 }), { at: T, kills: 99_999_999 });
	assert.equal(cleanCombat(null), undefined);
	assert.equal(cleanCombat({ mp: { '2026-11-14': { at: T } } }), undefined);
	const log = cleanCombat({
		mp: { '2026-11-14': { at: T, kills: 10 }, 'not-a-day': { at: T, kills: 1 }, '2026-11-13': 'x' },
		wz: [],
		dmz: { '2026-11-14': { at: T, kills: 1 } }
	});
	assert.deepEqual(log, { mp: { '2026-11-14': { at: T, kills: 10 } } });
});

test('one update per day (the same day replaces it), the newest COMBAT_DAYS kept', () => {
	let log = withSnap(undefined, 'mp', '2026-11-14', { at: T, kills: 100 });
	log = withSnap(log, 'mp', '2026-11-14', { at: T + 60_000, kills: 120 });
	assert.deepEqual(log.mp, { '2026-11-14': { at: T + 60_000, kills: 120 } });
	for (let i = 1; i <= COMBAT_DAYS + 3; i++) log = withSnap(log, 'mp', `2026-10-${String(i).padStart(2, '0')}`, { at: T - (40 - i) * DAY, kills: i });
	assert.equal(Object.keys(log.mp).length, COMBAT_DAYS);
	assert.ok(log.mp['2026-11-14'], 'the newest day stays');
	assert.ok(!log.mp['2026-10-01'], 'the oldest days go');
	log = withSnap(log, 'wz', '2026-11-14', { at: T, wins: 2 });
	assert.equal(Object.keys(log.mp).length, COMBAT_DAYS, 'modes are kept apart');
});

test('two devices: per day the later update wins', () => {
	const a = { mp: { '2026-11-13': { at: T - DAY, kills: 90 }, '2026-11-14': { at: T, kills: 100 } } };
	const b = { mp: { '2026-11-14': { at: T + 5, kills: 105 } }, wz: { '2026-11-12': { at: T - 2 * DAY, wins: 1 } } };
	assert.deepEqual(mergeCombat(a, b), {
		mp: { '2026-11-14': { at: T + 5, kills: 105 }, '2026-11-13': { at: T - DAY, kills: 90 } },
		wz: { '2026-11-12': { at: T - 2 * DAY, wins: 1 } }
	});
	assert.deepEqual(mergeCombat(b, a).mp['2026-11-14'], { at: T + 5, kills: 105 });
	assert.deepEqual(mergeCombat(undefined, undefined), {});
});

test('the board: latest numbers and the change since the update before', () => {
	assert.equal(combatView(undefined, 'mp'), null);
	assert.equal(combatView({ wz: { '2026-11-14': { at: T, kills: 1 } } }, 'mp'), null);
	const log = {
		mp: {
			'2026-11-07': { at: T - 7 * DAY, kills: 1000, deaths: 900, wins: 50, losses: 50 },
			'2026-11-14': { at: T, kills: 1450, deaths: 1200, wins: 80, losses: 60, spm: 310 }
		}
	};
	const v = combatView(log, 'mp');
	assert.equal(v.day, '2026-11-14');
	assert.equal(fmtRatio(v.kd), '1.21');
	assert.equal(fmtRatio(v.wl), '1.33');
	assert.equal(v.kills, 1450);
	assert.equal(v.spm, 310);
	assert.equal(v.before.day, '2026-11-07');
	assert.equal(fmtDelta(v.before.kdDelta), '+0.10');
	assert.equal(v.before.form, 1.5, '450 kills ÷ 300 deaths between the updates');
	assert.equal(v.before.kills, 450);
	assert.equal(v.before.wins, 30);

	// only ratios typed: a change, but no form (no totals)
	const ratios = combatView({ mp: { '2026-11-01': { at: T - DAY, kd: 1.3 }, '2026-11-02': { at: T, kd: 1.25, wl: 0.9 } } }, 'mp');
	assert.equal(fmtDelta(ratios.before.kdDelta), '−0.05');
	assert.equal(ratios.before.form, null);
	assert.equal(ratios.wl, 0.9);

	// Warzone: the second number is the win rate
	const wz = combatView({ wz: { '2026-11-14': { at: T, kills: 300, deaths: 200, wins: 5, matches: 50 } } }, 'wz');
	assert.equal(wz.kd, 1.5);
	assert.equal(wz.wl, 10);
	assert.equal(wz.before, null);

	// totals that went down (a typo before): no gains, no form
	const typo = combatView({ mp: { '2026-11-01': { at: T - DAY, kills: 5000, deaths: 10 }, '2026-11-02': { at: T, kills: 500, deaths: 400 } } }, 'mp');
	assert.equal(typo.before.kills, null);
	assert.equal(typo.before.form, null);
});

test('ranking: best first, members without the number last by name', () => {
	const row = (name, kd, kills) => ({ name, view: kd === null ? null : { kd, wl: null, kills, wins: null } });
	const order = (by) => rankCombat([row('Zed', null), row('Bo', 1.1, 900), row('Al', 1.4, 100), row('Cy', 1.1, 2000), row('Ax', null)], by).map((r) => r.name);
	assert.deepEqual(order('kd'), ['Al', 'Bo', 'Cy', 'Ax', 'Zed']);
	assert.deepEqual(order('kills'), ['Cy', 'Bo', 'Al', 'Ax', 'Zed']);
	assert.deepEqual(order('wl'), ['Al', 'Ax', 'Bo', 'Cy', 'Zed']);
});

test('formatting', () => {
	assert.equal(fmtRatio(1), '1.00');
	assert.equal(fmtRatio(1.235), '1.24');
	assert.equal(fmtDelta(0.001), '±0.00');
	assert.equal(fmtDelta(0.034), '+0.03');
	assert.equal(fmtDelta(-0.2), '−0.20');
});

test('the squad document carries combat and drops junk in it', () => {
	const combat = { mp: { '2026-11-14': { at: T, kills: 1450, deaths: 1200 } } };
	const entry = memberEntry(
		{ name: 'Abscar', op: 'abscar' },
		{ weapons: {}, mastery: {}, lastTickAt: null },
		T,
		false,
		{ combat }
	);
	assert.deepEqual(entry.combat, combat);
	const id = 'abcdefgh1234';
	const wire = toSquadWire({ members: { [id]: entry } });
	const back = fromSquadWire(JSON.parse(JSON.stringify(wire)));
	assert.deepEqual(back.members[id].combat, combat);

	// junk is dropped, the rest of the member survives
	const dirty = JSON.parse(JSON.stringify(wire));
	dirty.members[id].combat = { mp: { '2026-11-14': { at: T, kills: 'many' } } };
	const cleaned = fromSquadWire(dirty);
	assert.equal(cleaned.members[id].combat, undefined);
	assert.equal(cleaned.members[id].name, 'Abscar');

	// no combat: no field at all (older documents look the same as before)
	const plain = memberEntry({ name: 'Bo', op: null }, { weapons: {}, mastery: {}, lastTickAt: null }, T);
	assert.equal('combat' in plain, false);
});
