// Squad classes (src/lib/squad-classes.ts), which gun a build code is for (buildPrefix.ts) and how
// the classes travel in the squad document (squad-codec.ts `classes`). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CODE_PREFIX, knownCodes, weaponFromCode } from '../src/lib/buildPrefix.ts';
import { HARDCORE_BUILDS } from '../src/lib/data/hardcoreBuilds.ts';
import { LOADOUT_CODES } from '../src/lib/data/loadoutCodes.ts';
import { SITE_BUILDS } from '../src/lib/data/siteBuilds.ts';
import { WEAPON_BY_ID } from '../src/lib/data/weapons.ts';
import {
	CLASS_MAX,
	TOMB_MAX,
	cleanClasses,
	cleanClassName,
	liveClasses,
	mergeClasses,
	normaliseCode,
	withClass,
	withoutClass
} from '../src/lib/squad-classes.ts';
import { fromSquadWire, memberEntry, toSquadWire } from '../src/lib/squad-codec.ts';

const T = Date.UTC(2026, 10, 16, 18);

test('pasted codes are tidied and checked', () => {
	assert.equal(normaliseCode('B04-3KA95-TI247-BF11'), 'B04-3KA95-TI247-BF11');
	assert.equal(normaliseCode(' b04-3ka95-ti247-bf11 '), 'B04-3KA95-TI247-BF11');
	assert.equal(normaliseCode('B04 – 3KA95 – TI247 – BF11'), 'B04-3KA95-TI247-BF11', 'en dashes and spaces');
	assert.equal(normaliseCode('M02-3M5Z7-FMQ11'), 'M02-3M5Z7-FMQ11', 'three parts');
	assert.equal(normaliseCode('B04'), null);
	assert.equal(normaliseCode('hello world'), null);
	assert.equal(normaliseCode('B04-3KA95-TI247-BF11-AAAA-BBBB'), null, 'too many parts');
	assert.equal(normaliseCode(42), null);
});

test('every code we publish passes the check, and its prefix names exactly its gun', () => {
	const all = [];
	for (const [w, c] of Object.entries(LOADOUT_CODES)) all.push([w, c.code]);
	for (const [w, modes] of Object.entries(SITE_BUILDS)) for (const list of Object.values(modes)) for (const b of list) all.push([w, b.code]);
	for (const [w, list] of Object.entries(HARDCORE_BUILDS)) for (const h of list) if (h.code) all.push([w, h.code]);
	assert.ok(all.length > 100);
	for (const [w, code] of all) {
		assert.equal(normaliseCode(code), code, code);
		assert.equal(weaponFromCode(code), w, `${code} → ${w}`);
	}
	// one prefix per gun and one gun per prefix
	const guns = new Set(CODE_PREFIX.values());
	assert.equal(guns.size, CODE_PREFIX.size);
	for (const w of guns) assert.ok(WEAPON_BY_ID.has(w), w);
	assert.equal(weaponFromCode('Z99-AAAAA-BBBBB'), null);
	assert.equal(weaponFromCode(null), null);
});

test("a gun's known codes: META first, no duplicates", () => {
	const list = knownCodes('patriot-xmr');
	assert.ok(list.length >= 3);
	assert.equal(list[0].meta, true);
	assert.equal(list[0].code, LOADOUT_CODES['patriot-xmr'].code);
	assert.equal(new Set(list.map((k) => k.code)).size, list.length);
	assert.ok(list.some((k) => k.kind === 'hc'));
	assert.deepEqual(knownCodes('pila'), [], 'launchers have no codes');
});

test('cleaning: bad entries dropped, names tidied, tombstones kept', () => {
	assert.equal(cleanClasses('x'), undefined);
	const raw = {
		good1: { w: 'm4', code: 'a05-43qcd-d1g9c-a311', kind: 'hc', name: '  SnD   sniper  ', at: T },
		badgun: { w: 'nope', code: 'A05-43QCD-D1G9C-A311', kind: 'mp', at: T },
		badcode: { w: 'm4', code: 'nope', kind: 'mp', at: T },
		notime: { w: 'm4', code: 'A05-43QCD-D1G9C-A311', kind: 'mp' },
		'b@d': { w: 'm4', code: 'A05-43QCD-D1G9C-A311', kind: 'mp', at: T },
		oddkind: { w: 'm4', code: 'A05-43QCD-D1G9C-A311', kind: 'dmz', at: T },
		gone1: { del: 1, at: T }
	};
	const clean = cleanClasses(raw);
	assert.deepEqual(Object.keys(clean).sort(), ['gone1', 'good1', 'oddkind']);
	assert.deepEqual(clean.good1, { w: 'm4', code: 'A05-43QCD-D1G9C-A311', kind: 'hc', name: 'SnD sniper', at: T });
	assert.equal(clean.oddkind.kind, 'mp', 'unknown kind → Multiplayer');
	assert.deepEqual(clean.gone1, { del: 1, at: T });
	assert.equal(cleanClassName('x'.repeat(40)).length, 24);
	assert.deepEqual(liveClasses(clean).map((c) => c.id).sort(), ['good1', 'oddkind']);
});

test(`at most ${CLASS_MAX} classes; removing leaves a tombstone`, () => {
	let list = {};
	for (let i = 0; i < CLASS_MAX; i++) list = withClass(list, `cls${i}x`, { w: 'm4', code: 'A05-43QCD-D1G9C-A311', kind: 'mp', at: T + i });
	assert.equal(liveClasses(list).length, CLASS_MAX);
	assert.equal(withClass(list, 'onemore', { w: 'm4', code: 'A05-43QCD-D1G9C-A311', kind: 'mp', at: T + 99 }), null);
	list = withoutClass(list, 'cls0x', T + 100);
	assert.equal(liveClasses(list).length, CLASS_MAX - 1);
	assert.deepEqual(list.cls0x, { del: 1, at: T + 100 });
	assert.ok(withClass(list, 'onemore', { w: 'm4', code: 'A05-43QCD-D1G9C-A311', kind: 'mp', at: T + 101 }));
	// tombstones are capped too
	let many = {};
	for (let i = 0; i < TOMB_MAX + 5; i++) many = withoutClass(many, `gone${i}x`, T + i);
	assert.equal(Object.keys(many).length, TOMB_MAX);
});

test('two devices: the later change wins, a removal travels', () => {
	const cls = { w: 'patriot-xmr', code: 'B04-3KA95-TI247-BF11', kind: 'hc', at: T };
	const pc = withoutClass(withClass({}, 'abcd1', cls), 'abcd1', T + 10);
	const phone = withClass({}, 'abcd1', cls);
	assert.deepEqual(liveClasses(mergeClasses(phone, pc)), []);
	assert.deepEqual(liveClasses(mergeClasses(pc, phone)), []);
	const phone2 = withClass(phone, 'efgh2', { ...cls, kind: 'mp', at: T + 20 });
	assert.deepEqual(liveClasses(mergeClasses(pc, phone2)).map((c) => c.id), ['efgh2']);
});

test('classes travel in the squad document; an older entry without them reads fine', () => {
	const me = { name: 'Phillestar', op: 'phillestar' };
	const progress = { weapons: {}, mastery: {}, lastTickAt: null };
	const classes = { abcd1: { w: 'patriot-xmr', code: 'B04-3KA95-TI247-BF11', kind: 'hc', name: 'SnD', at: T } };
	const entry = memberEntry(me, progress, T, false, { classes });
	assert.deepEqual(entry.classes, classes);
	const doc = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: { abcdefgh1234: entry } }))));
	assert.deepEqual(doc.members.abcdefgh1234.classes, classes);
	assert.equal(doc.members.abcdefgh1234.more, undefined, 'classes is a known field');
	assert.equal(memberEntry(me, progress, T).classes, undefined);
});
