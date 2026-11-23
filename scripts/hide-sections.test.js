// The "Hide" buttons' list of parts (2026-11-20): ids, cleaning saved lists, the preset, the header grid.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HIDE_SECTIONS, HIDE_GROUPS, PARENT, cleanHidden, headerAreas, idsIn, onlyCamosMeta, KEEP_CAMOS_META } from '../src/lib/hideSections.ts';
import { t } from '../src/lib/i18n/en.ts';

test('every part has a unique id, a known group and a name in the list', () => {
	const ids = HIDE_SECTIONS.map((s) => s.id);
	assert.equal(new Set(ids).size, ids.length);
	for (const s of HIDE_SECTIONS) {
		assert.ok(HIDE_GROUPS.includes(s.group), s.id);
		assert.equal(typeof t.hide.names[s.id], 'string', `name for ${s.id}`);
	}
	for (const g of HIDE_GROUPS) assert.equal(typeof t.hide.groups[g], 'string');
	// every name in en.ts belongs to a part (no leftovers)
	assert.deepEqual(Object.keys(t.hide.names).sort(), [...ids].sort());
});

test('parents exist and come before their children', () => {
	const ids = HIDE_SECTIONS.map((s) => s.id);
	for (const [child, parent] of Object.entries(PARENT)) {
		assert.ok(ids.indexOf(parent) >= 0 && ids.indexOf(parent) < ids.indexOf(child), `${child} → ${parent}`);
	}
	assert.equal(PARENT.masteryWz, 'mastery');
	assert.equal(PARENT.classMeta, 'camos');
});

test('cleanHidden keeps only known ids, once each, in page order', () => {
	assert.deepEqual(cleanHidden(['masteryDmz', 'tv', 'nope', 'tv', 3, null, 'masteryWz']), ['tv', 'masteryWz', 'masteryDmz']);
	assert.deepEqual(cleanHidden('tv'), []);
	assert.deepEqual(cleanHidden(null), []);
	assert.deepEqual(cleanHidden({ tv: true }), []);
	assert.deepEqual(cleanHidden([]), []);
});

test('"Only camos & metas" hides everything but the camo and meta parts', () => {
	const hide = onlyCamosMeta();
	for (const id of KEEP_CAMOS_META) assert.ok(!hide.includes(id), id);
	assert.equal(hide.length + KEEP_CAMOS_META.length, HIDE_SECTIONS.length);
	assert.ok(hide.includes('tv') && hide.includes('picNuke') && hide.includes('tabCasino') && hide.includes('news'));
	assert.deepEqual(cleanHidden(hide), hide);
	assert.equal(idsIn('pictures').length, 8);
	assert.equal(idsIn('tabs').length, 6);
});

test('header grid: hidden parts leave no rows, no TV = one column', () => {
	const all = headerAreas(new Set());
	assert.equal(all.phone, "'squad' 'title' 'tv' 'buddy'");
	assert.equal(all.mid, "'squad squad' 'title tv' 'buddy tv'");
	assert.equal(all.wide, "'squad tv' 'title tv' 'buddy buddy'");
	assert.equal(all.midCols, 'minmax(0, 1fr) auto');

	const noSquad = headerAreas(new Set(['squad']));
	assert.equal(noSquad.phone, "'title' 'tv' 'buddy'");
	assert.equal(noSquad.mid, "'title tv' 'buddy tv'");
	assert.equal(noSquad.wide, "'title tv' 'buddy tv'");

	const noTv = headerAreas(new Set(['tv', 'buddy', 'whatsNew']));
	assert.equal(noTv.phone, "'squad' 'title'");
	assert.equal(noTv.mid, noTv.phone);
	assert.equal(noTv.wide, noTv.phone);
	assert.equal(noTv.wideCols, 'minmax(0, 1fr)');

	const onlyTitle = headerAreas(new Set(['squad', 'tv', 'buddy', 'whatsNew', 'hud']));
	const boardOnly = headerAreas(new Set(['buddy']));
	assert.equal(boardOnly.phone, all.phone, 'the billboard keeps the buddy row');
	assert.equal(onlyTitle.phone, "'title'");
	assert.equal(onlyTitle.wide, "'title'");
});
