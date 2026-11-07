// Checks of the meta-class data (src/lib/data/loadouts.ts): `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LOADOUTS, LOADOUTS_AS_OF, MAX_ATTACHMENTS, SLOT_ORDER } from '../src/lib/data/loadouts.ts';
import { WEAPON_BY_ID } from '../src/lib/data/weapons.ts';

const builds = Object.entries(LOADOUTS).flatMap(([id, modes]) =>
	Object.entries(modes).map(([mode, l]) => ({ where: `${id}/${mode}`, id, mode, l }))
);

test('loadouts: every key is a real weapon, and no launcher or melee weapon has one', () => {
	for (const id of Object.keys(LOADOUTS)) {
		const w = WEAPON_BY_ID.get(id);
		assert.ok(w, `unknown weapon id ${id}`);
		assert.ok(!['launchers', 'melee'].includes(w.classId), `${id} can't take attachments`);
	}
});

test('loadouts: modes are mp/wz and every weapon entry has at least one build', () => {
	for (const [id, modes] of Object.entries(LOADOUTS)) {
		assert.ok(Object.keys(modes).length > 0, id);
		for (const mode of Object.keys(modes)) assert.ok(['mp', 'wz'].includes(mode), `${id}: ${mode}`);
	}
});

test('loadouts: at most 5 attachments + 1 Apex, one per slot, known slots, in display order', () => {
	for (const { where, l } of builds) {
		const slots = l.attachments.map((a) => a.slot);
		assert.ok(slots.length > 0, where);
		assert.equal(new Set(slots).size, slots.length, `${where}: duplicate slot`);
		assert.ok(slots.filter((s) => s !== 'Apex').length <= MAX_ATTACHMENTS, `${where}: too many attachments`);
		for (const s of slots) assert.ok(SLOT_ORDER.includes(s), `${where}: unknown slot ${s}`);
		const order = slots.map((s) => SLOT_ORDER.indexOf(s));
		assert.deepEqual(order, [...order].sort((a, b) => a - b), `${where}: not in SLOT_ORDER`);
		for (const a of l.attachments) assert.ok(a.name.trim() !== '', `${where}: empty ${a.slot}`);
	}
});

test('loadouts: every build has a source and a valid date, unconfirmed ones say why', () => {
	for (const { where, l } of builds) {
		assert.ok(l.source.trim() !== '', `${where}: no source`);
		assert.match(l.date, /^\d{4}-\d{2}-\d{2}$/, `${where}: date`);
		assert.ok(l.role.trim() !== '', `${where}: no role`);
		if (!l.verified) assert.ok(l.note, `${where}: unconfirmed without a note`);
	}
	assert.match(LOADOUTS_AS_OF, /^\d{4}-\d{2}-\d{2}$/);
});
