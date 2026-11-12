// Checks of the Apex data (src/lib/data/apex.ts + apexBuilds.ts): `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { APEX } from '../src/lib/data/apex.ts';
import { APEX_BUILDS } from '../src/lib/data/apexBuilds.ts';
import { LOADOUTS, MAX_ATTACHMENTS, SLOT_ORDER } from '../src/lib/data/loadouts.ts';
import { WEAPON_BY_ID } from '../src/lib/data/weapons.ts';

test('apex: every gun with meta classes has its Apex, and only real guns with a gunsmith do', () => {
	for (const id of Object.keys(LOADOUTS)) assert.ok(APEX[id], `${id} has no Apex entry`);
	for (const [id, a] of Object.entries(APEX)) {
		const w = WEAPON_BY_ID.get(id);
		assert.ok(w, `unknown weapon id ${id}`);
		assert.ok(!['launchers', 'melee'].includes(w.classId), `${id} has no gunsmith`);
		assert.ok(a.name.trim() && a.effect.trim(), `${id}: name and effect`);
		for (const s of a.blocks) assert.ok(SLOT_ORDER.includes(s) && s !== 'Apex', `${id}: blocks ${s}`);
	}
});

test('apex builds: use the gun’s own Apex, skip the slots it closes, 5 + Apex, sourced and dated', () => {
	for (const [id, modes] of Object.entries(APEX_BUILDS)) {
		const a = APEX[id];
		assert.ok(a, `${id}: Apex build for a gun without an Apex entry`);
		for (const [mode, l] of Object.entries(modes)) {
			const where = `${id}/${mode}`;
			assert.ok(['mp', 'wz'].includes(mode), where);
			const slots = l.attachments.map((x) => x.slot);
			const apexPart = l.attachments.find((x) => x.slot === 'Apex');
			assert.ok(apexPart, `${where}: no Apex in an Apex build`);
			assert.ok([a.name, ...(a.alt ?? [])].includes(apexPart.name), `${where}: Apex ${apexPart.name} isn't ${a.name}`);
			assert.equal(new Set(slots).size, slots.length, `${where}: duplicate slot`);
			assert.ok(slots.length - 1 <= MAX_ATTACHMENTS, `${where}: too many attachments`);
			// `blocks` belongs to the main Apex; an event Apex (alt) may leave those slots open
			// (Kastov 545 keeps the barrel the Kastov ARC closes)
			if (apexPart.name === a.name) for (const s of a.blocks) assert.ok(!slots.includes(s), `${where}: ${s} is closed by the Apex`);
			const order = slots.map((s) => SLOT_ORDER.indexOf(s));
			assert.ok(!order.includes(-1), `${where}: unknown slot`);
			assert.deepEqual(order, [...order].sort((x, y) => x - y), `${where}: not in SLOT_ORDER`);
			assert.ok(l.source.trim() && l.role.trim(), `${where}: source and role`);
			assert.match(l.date, /^\d{4}-\d{2}-\d{2}$/, `${where}: date`);
			if (!l.verified) assert.ok(l.note, `${where}: unconfirmed without a note`);
		}
	}
});
