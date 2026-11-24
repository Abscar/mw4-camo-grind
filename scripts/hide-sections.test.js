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
	assert.equal(all.phone, "'squad' 'tv' 'buddy' 'city'");
	assert.equal(all.mid, "'squad squad' 'buddy tv' 'city city'");
	assert.equal(all.wide, "'squad tv' 'buddy buddy'");
	assert.equal(all.midCols, 'minmax(0, 1fr) auto');

	const noSquad = headerAreas(new Set(['squad']));
	assert.equal(noSquad.phone, "'tv' 'buddy' 'city'");
	assert.equal(noSquad.mid, "'buddy tv' 'city city'");
	assert.equal(noSquad.wide, "'buddy tv'");

	const noBuddy = headerAreas(new Set(['buddy', 'whatsNew', 'city']));
	assert.equal(noBuddy.mid, "'squad squad' '. tv'", 'the TV keeps a row of its own');
	assert.equal(noBuddy.wide, "'squad tv'");

	const noTv = headerAreas(new Set(['tv', 'buddy', 'whatsNew', 'city']));
	assert.equal(noTv.phone, "'squad'");
	assert.equal(noTv.mid, noTv.phone);
	assert.equal(noTv.wide, noTv.phone);
	assert.equal(noTv.wideCols, 'minmax(0, 1fr)');

	const onlyTv = headerAreas(new Set(['squad', 'buddy', 'whatsNew', 'city']));
	assert.equal(onlyTv.wide, "'tv'");
	const boardOnly = headerAreas(new Set(['buddy']));
	assert.equal(boardOnly.phone, all.phone, 'the billboard keeps the buddy row');
	assert.equal(headerAreas(new Set(['squad', 'tv', 'buddy', 'whatsNew', 'city'])).phone, 'none');

	// Burgi City alone keeps the buddy row on wide screens and its own row below that
	const cityOnly = headerAreas(new Set(['buddy', 'whatsNew']));
	assert.equal(cityOnly.mid, "'squad squad' '. tv' 'city city'");
	assert.equal(cityOnly.wide, all.wide);
	assert.equal(cityOnly.phone, "'squad' 'tv' 'city'");
	// no TV: the town still has a row (inside the buddy row on wide screens)
	const noTvCity = headerAreas(new Set(['tv']));
	assert.equal(noTvCity.wide, "'squad' 'buddy'");
	assert.equal(noTvCity.phone, "'squad' 'buddy' 'city'");
});
