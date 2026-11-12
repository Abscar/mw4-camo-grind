// Checks of the loadout codes (src/lib/data/loadoutCodes.ts), the published subclasses
// (src/lib/data/siteBuilds.ts) and the worked-out stat builds (src/lib/data/extraBuilds.ts): `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EXTRA_BUILDS, EXTRA_KINDS } from '../src/lib/data/extraBuilds.ts';
import { LOADOUT_CODES } from '../src/lib/data/loadoutCodes.ts';
import { LOADOUTS, MAX_ATTACHMENTS, SLOT_ORDER } from '../src/lib/data/loadouts.ts';
import { SITE_BUILDS } from '../src/lib/data/siteBuilds.ts';
import { WEAPON_BY_ID } from '../src/lib/data/weapons.ts';

/** The game's build codes: a weapon prefix (A05 = M4) and 2–3 more groups. */
const CODE = /^[A-Z]\d\d(-[A-Z0-9]{1,6}){2,3}$/;

const slotsOk = (where, attachments, { apex, ordered = true }) => {
	const slots = attachments.map((x) => x.slot);
	assert.ok(slots.length > 0, `${where}: no attachments`);
	assert.equal(new Set(slots).size, slots.length, `${where}: duplicate slot`);
	assert.ok(slots.filter((s) => s !== 'Apex').length <= MAX_ATTACHMENTS, `${where}: too many attachments`);
	if (!apex) assert.ok(!slots.includes('Apex'), `${where}: has an Apex`);
	for (const s of slots) assert.ok(SLOT_ORDER.includes(s), `${where}: unknown slot ${s}`);
	for (const a of attachments) assert.ok(a.name.trim(), `${where}: empty name`);
	if (!ordered) return;
	const order = slots.map((s) => SLOT_ORDER.indexOf(s));
	assert.deepEqual(order, [...order].sort((x, y) => x - y), `${where}: not in SLOT_ORDER`);
};

test('loadout codes (META button): one per gun with a gunsmith, a real-looking code, Apex only with a note, no duplicates', () => {
	for (const id of Object.keys(LOADOUTS)) assert.ok(LOADOUT_CODES[id], `${id} has no loadout code`);
	const seen = new Map();
	const prefixes = new Map();
	for (const [id, c] of Object.entries(LOADOUT_CODES)) {
		const w = WEAPON_BY_ID.get(id);
		assert.ok(w, `unknown weapon id ${id}`);
		assert.ok(!['launchers', 'melee'].includes(w.classId), `${id} has no gunsmith`);
		assert.match(c.code, CODE, `${id}: code ${c.code}`);
		assert.ok(!seen.has(c.code), `${id}: same code as ${seen.get(c.code)}`);
		seen.set(c.code, id);
		// one weapon prefix per gun: two guns with one prefix would mean a mix-up
		const p = c.code.slice(0, 3);
		assert.ok(!prefixes.has(p), `${id} and ${prefixes.get(p)} share code prefix ${p}`);
		prefixes.set(p, id);
		assert.ok(c.role.trim(), `${id}: role`);
		assert.match(c.date, /^\d{4}-\d{2}-\d{2}$/, `${id}: date`);
		// kept in codmunity's order (not shown anywhere, only behind the code)
		slotsOk(id, c.attachments, { apex: true, ordered: false });
		// no Apex unless every Multiplayer build has one, and then the copy toast must say so
		const apex = c.attachments.find((a) => a.slot === 'Apex');
		if (apex) {
			assert.match(c.note ?? '', /Apex/, `${id}: Apex build without a note`);
			assert.ok(SITE_BUILDS[id].mp.every((b) => b.attachments.some((a) => a.slot === 'Apex')), `${id}: has an MP build without the Apex`);
		}
	}
});

test('subclasses: Multiplayer + Warzone per gun, real codes with the gun’s prefix, ranked, sourced', () => {
	for (const id of Object.keys(LOADOUTS)) assert.ok(SITE_BUILDS[id], `${id} has no subclass entry`);
	for (const [id, modes] of Object.entries(SITE_BUILDS)) {
		assert.ok(LOADOUTS[id], `${id}: subclasses for a gun without meta classes`);
		const prefix = LOADOUT_CODES[id].code.slice(0, 3);
		for (const mode of ['mp', 'wz']) {
			const list = modes[mode];
			assert.ok(Array.isArray(list), `${id}/${mode}: missing`);
			const codes = new Set();
			for (const b of list) {
				const where = `${id}/${mode}/${b.code}`;
				assert.match(b.code, CODE, where);
				assert.equal(b.code.slice(0, 3), prefix, `${where}: not this gun's code prefix`);
				assert.ok(!codes.has(b.code), `${where}: listed twice`);
				codes.add(b.code);
				assert.ok(b.rank >= 1, `${where}: rank`);
				assert.ok(b.role.trim() && b.source.trim(), `${where}: role and source`);
				assert.match(b.date, /^\d{4}-\d{2}-\d{2}$/, `${where}: date`);
				if (!b.verified) assert.ok(b.note, `${where}: unconfirmed without a note`);
				slotsOk(where, b.attachments, { apex: true });
			}
		}
	}
	const total = Object.values(SITE_BUILDS).reduce((n, m) => n + m.mp.length + m.wz.length, 0);
	assert.ok(total >= 60, `only ${total} subclasses`);
});

test('stat builds: every gun has Min ADS, Max sprint and Max range; worked out, no code, level noted', () => {
	for (const id of Object.keys(LOADOUTS)) {
		const e = EXTRA_BUILDS[id];
		assert.ok(e?.ads && e?.sprint && e?.range, `${id}: missing a stat build`);
	}
	for (const [id, kinds] of Object.entries(EXTRA_BUILDS)) {
		assert.ok(LOADOUTS[id], `${id}: stat builds for a gun without meta classes`);
		for (const [kind, l] of Object.entries(kinds)) {
			const where = `${id}/${kind}`;
			assert.ok(EXTRA_KINDS.includes(kind), where);
			slotsOk(where, l.attachments, { apex: false });
			assert.ok(l.source.trim() && l.role.trim(), `${where}: source and role`);
			assert.match(l.date, /^\d{4}-\d{2}-\d{2}$/, `${where}: date`);
			assert.ok(!('code' in l), `${where}: worked-out builds have no code`);
			assert.match(l.note ?? '', /weapon level \d+|partly unknown/, `${where}: says the level it needs`);
		}
	}
});
