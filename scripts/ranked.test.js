// Checks of the Ranked prep data (src/lib/data/ranked.ts): `npm test`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { MAX_ATTACHMENTS, SLOT_ORDER } from '../src/lib/data/loadouts.ts';
import {
	BANNED_ATTACHMENTS,
	BANNED_CLASSES,
	BANNED_WEAPONS,
	GEAR,
	HP_ROTATIONS,
	MODES,
	PRO_BUILDS,
	PRO_ORDER,
	SECONDARY_NOTE,
	attachmentBanned
} from '../src/lib/data/ranked.ts';
import { CLASSES, WEAPON_BY_ID } from '../src/lib/data/weapons.ts';

const gearIcon = readFileSync(new URL('../src/lib/components/GearIcon.svelte', import.meta.url), 'utf8');

test('ranked: banned classes and weapons are real, and banned weapons are in allowed classes', () => {
	const classIds = new Set(CLASSES.map((c) => c.id));
	for (const c of BANNED_CLASSES) assert.ok(classIds.has(c), `unknown class ${c}`);
	for (const id of BANNED_WEAPONS) {
		const w = WEAPON_BY_ID.get(id);
		assert.ok(w, `unknown weapon ${id}`);
		assert.ok(!BANNED_CLASSES.includes(w.classId), `${id} is already banned with its class`);
	}
});

test('ranked: every equipment item is either allowed or banned once, and every icon is drawn', () => {
	for (const g of GEAR) {
		const names = g.items.map((i) => i.name);
		assert.equal(new Set(names).size, names.length, `${g.id}: duplicate item`);
		assert.ok(g.items.some((i) => !i.banned), `${g.id}: nothing allowed`);
		for (const i of g.items) {
			if (!i.icon) continue;
			assert.ok(gearIcon.includes(`id === '${i.icon}'`), `${i.name}: GearIcon has no drawing for "${i.icon}"`);
		}
		// allowed items are the ones shown as big pictures, so they need one
		for (const i of g.items.filter((x) => !x.banned)) assert.ok(i.icon, `${i.name} is allowed but has no picture`);
	}
	// MW4's counts (mw4-kunskap/camos-och-system.md): 11 lethals, 9 tacticals, 12 field upgrades, 6 perks per slot, 17 streaks
	const count = Object.fromEntries(GEAR.map((g) => [g.id, g.items.length]));
	assert.deepEqual(count, { lethal: 11, tactical: 9, field: 12, perk1: 6, perk2: 6, perk3: 6, streak: 17 });
});

test('ranked: attachmentBanned follows the CDL list', () => {
	assert.ok(attachmentBanned({ slot: 'Laser', name: 'Anything' }));
	assert.ok(attachmentBanned({ slot: 'Apex', name: 'Hyeon Hyperburst' }));
	assert.ok(attachmentBanned({ slot: 'Muzzle', name: 'fss is40' }));
	assert.ok(!attachmentBanned({ slot: 'Muzzle', name: 'FTAC Dominion' }));
	for (const g of BANNED_ATTACHMENTS) assert.ok(SLOT_ORDER.includes(g.slot), `unknown slot ${g.slot}`);
});

test('ranked: pro builds are real guns, CDL-legal, ≤ 5 parts in slot order, with source and date', () => {
	assert.deepEqual([...PRO_ORDER].sort(), Object.keys(PRO_BUILDS).sort());
	for (const [id, p] of Object.entries(PRO_BUILDS)) {
		const w = WEAPON_BY_ID.get(id);
		assert.ok(w, `unknown weapon ${id}`);
		assert.ok(!BANNED_CLASSES.includes(w.classId) && !BANNED_WEAPONS.includes(id), `${id} is banned in ranked`);
		const parts = p.build.attachments;
		assert.ok(parts.length > 0 && parts.length <= MAX_ATTACHMENTS, `${id}: ${parts.length} parts`);
		for (const a of parts) assert.ok(!attachmentBanned(a), `${id}: ${a.name} is banned in the CDL`);
		const order = parts.map((a) => SLOT_ORDER.indexOf(a.slot));
		assert.deepEqual(order, [...order].sort((a, b) => a - b), `${id}: slot order`);
		assert.match(p.build.date, /^\d{4}-\d{2}-\d{2}$/);
		assert.ok(p.build.source.trim() && p.pros.length, `${id}: source and pros`);
	}
	assert.ok(WEAPON_BY_ID.get(SECONDARY_NOTE.weapon), 'secondary is a real gun');
});

test('ranked: modes have maps', () => {
	for (const m of MODES) assert.ok(m.maps.length >= 3 && m.rules.trim(), m.name);
});

test('ranked: a Hardpoint rotation for every Hardpoint map, with sane hill counts and runs', () => {
	const hpMaps = MODES.find((m) => m.id === 'hp').maps;
	assert.deepEqual(HP_ROTATIONS.map((r) => r.map).sort(), [...hpMaps].sort());
	for (const r of HP_ROTATIONS) {
		assert.ok(r.hills.length >= 4 && r.hills.length <= 6, `${r.map}: ${r.hills.length} hills`);
		for (const h of r.hills) assert.ok(h.name.trim(), `${r.map}: empty hill name`);
		for (const run of [r.longest, r.shortest].filter(Boolean)) {
			assert.ok(run.from >= 1 && run.from < r.hills.length, `${r.map}: run from P${run.from}`);
		}
	}
});

// point-in-polygon (ray casting)
const inside = ([x, y], poly) => {
	let hit = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const [xi, yi] = poly[i];
		const [xj, yj] = poly[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
	}
	return hit;
};

test('ranked: every minimap has an outline, every hill sits inside it and apart from the others, guide link is https', () => {
	for (const r of HP_ROTATIONS) {
		assert.ok(r.outline.length >= 4, `${r.map}: outline`);
		assert.match(r.guide, /^https:\/\//);
		for (const h of r.hills) assert.ok(inside(h.at, r.outline), `${r.map}: ${h.name} lies outside the outline`);
		for (let i = 0; i < r.hills.length; i++)
			for (let j = i + 1; j < r.hills.length; j++) {
				const [a, b] = [r.hills[i].at, r.hills[j].at];
				assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) > 40, `${r.map}: P${i + 1} and P${j + 1} overlap`);
			}
		if (r.water) for (const p of r.water) assert.ok(p.length === 2, `${r.map}: water point`);
	}
});