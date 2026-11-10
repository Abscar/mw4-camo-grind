// Checks of the meta list data (src/lib/data/metaRanks.ts): `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LOADOUTS } from '../src/lib/data/loadouts.ts';
import { META_RANKS, META_TOP, metaLists } from '../src/lib/data/metaRanks.ts';
import { CLASSES, WEAPON_BY_ID } from '../src/lib/data/weapons.ts';

const MODES = ['mp', 'wz'];
const TIERS = ['S', 'A', 'B', 'C', 'D'];
const ORDER = Object.fromEntries(TIERS.map((tier, i) => [tier, i]));

test('meta list: one board per mode, dated, with sources', () => {
	assert.deepEqual(Object.keys(META_RANKS).sort(), [...MODES].sort());
	for (const mode of MODES) {
		assert.match(META_RANKS[mode].date, /^\d{4}-\d{2}-\d{2}$/, mode);
		assert.ok(META_RANKS[mode].sources.trim() !== '', `${mode}: sources`);
	}
});

test('meta list: every class list ranks every released gun in that class exactly once', () => {
	for (const mode of MODES) {
		const { classes } = META_RANKS[mode];
		for (const id of Object.keys(classes)) assert.ok(CLASSES.some((c) => c.id === id), `${mode}: unknown class ${id}`);
		for (const cls of CLASSES) {
			// released guns that can take attachments = the ones with a meta class
			const released = cls.weapons.filter((w) => w.id in LOADOUTS).map((w) => w.id);
			const ranked = (classes[cls.id] ?? []).map((pick) => pick.id);
			assert.deepEqual([...ranked].sort(), [...released].sort(), `${mode}/${cls.id}`);
		}
	}
});

test('meta list: tiers are known and never get better further down a list', () => {
	for (const mode of MODES) {
		const board = META_RANKS[mode];
		for (const [where, picks] of [['overall', board.overall], ...Object.entries(board.classes)]) {
			for (const pick of picks) {
				assert.ok(TIERS.includes(pick.tier), `${mode}/${where}/${pick.id}: tier ${pick.tier}`);
				if (!pick.verified) assert.ok(pick.note, `${mode}/${where}/${pick.id}: unconfirmed without a note`);
			}
			const order = picks.map((pick) => ORDER[pick.tier]);
			assert.deepEqual(order, [...order].sort((a, b) => a - b), `${mode}/${where}: tiers out of order`);
		}
	}
});

test('meta list: the overall top is real guns, no repeats, each as good as its class rank says', () => {
	for (const mode of MODES) {
		const board = META_RANKS[mode];
		const ids = board.overall.map((pick) => pick.id);
		assert.ok(ids.length >= META_TOP, `${mode}: overall too short`);
		assert.equal(new Set(ids).size, ids.length, `${mode}: overall repeats a gun`);
		for (const pick of board.overall) {
			const w = WEAPON_BY_ID.get(pick.id);
			assert.ok(w, `${mode}: unknown weapon ${pick.id}`);
			const inClass = board.classes[w.classId].find((x) => x.id === pick.id);
			assert.equal(pick.tier, inClass.tier, `${mode}: ${pick.id} has a different tier overall`);
		}
		// two guns from the same class come in the same order as in the class list
		for (const cls of CLASSES) {
			const rank = (board.classes[cls.id] ?? []).map((x) => x.id);
			const inOverall = ids.filter((id) => rank.includes(id)).map((id) => rank.indexOf(id));
			assert.deepEqual(inOverall, [...inOverall].sort((a, b) => a - b), `${mode}: overall vs ${cls.id} order`);
		}
	}
});

test('meta list: Warzone picks say what they are for; the page gets at most META_TOP per list', () => {
	for (const pick of [...META_RANKS.wz.overall, ...Object.values(META_RANKS.wz.classes).flat()]) {
		assert.ok(pick.role?.trim(), `wz/${pick.id}: no role`);
	}
	for (const mode of MODES) {
		const lists = metaLists(mode);
		assert.equal(lists[0].key, 'overall');
		for (const list of lists) assert.ok(list.picks.length > 0 && list.picks.length <= META_TOP, `${mode}/${list.key}`);
	}
});
