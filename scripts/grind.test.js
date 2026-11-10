// Counters, steps, status filters and suggestions (2026-11-10): `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ALL_MASTERY } from '../src/lib/data/camos.ts';
import { CLASSES, WEAPONS } from '../src/lib/data/weapons.ts';
import { bigStep, parseChallenge } from '../src/lib/challenge.ts';
import { activeSteps, countKey, pruneCounts, stepStatus, stepsOf } from '../src/lib/steps.ts';
import { matchesStatus, suggestions } from '../src/lib/filters.ts';
import {
	defaultProgress,
	migrate,
	normaliseCounts,
	normalisePrefs,
	resetProgress,
	sameProgress,
	toExport,
	toStored,
	defaultPrefs
} from '../src/lib/progress-codec.ts';
import { combine, fromWire, merge3, sameDoc, toWire } from '../src/lib/sync-codec.ts';

test('challenge units: totals, repeated feats and single-match challenges', () => {
	assert.deepEqual(parseChallenge('50 Headshots'), { kind: 'total', target: 50, unit: 'Headshots' });
	assert.deepEqual(parseChallenge('3 Kills without Dying ×15'), { kind: 'repeat', target: 15, feat: '3 Kills without Dying' });
	assert.deepEqual(parseChallenge('10 Kills in a Match ×7'), { kind: 'repeat', target: 7, feat: '10 Kills in a Match' });
	assert.deepEqual(parseChallenge('15 Kills in a Single Match'), { kind: 'once' });
	assert.deepEqual(parseChallenge('Destroy 30 Killstreaks or Vehicles'), {
		kind: 'total',
		target: 30,
		unit: 'Killstreaks or Vehicles destroyed'
	});
	assert.equal(bigStep(parseChallenge('100 Kills while ADS')), 10);
	assert.equal(bigStep(parseChallenge('50 Headshots')), 5);
	assert.equal(bigStep(parseChallenge('20 Mounted Kills')), 0);
	assert.equal(bigStep(parseChallenge('2 Kills without Reloading ×25')), 0, 'one feat at a time');
});

test('challenge units: every challenge in the data has a sensible unit', () => {
	const texts = [
		...CLASSES.flatMap((c) => Object.values(c.challenges).map((f) => f.text)),
		...WEAPONS.flatMap((w) => w.specials.map((s) => s.challenge.text))
	];
	for (const text of texts) {
		const u = parseChallenge(text);
		if (/single match/i.test(text)) assert.equal(u.kind, 'once', text);
		else if (/×/.test(text)) assert.equal(u.kind, 'repeat', text);
		else assert.equal(u.kind, 'total', text);
		if (u.kind !== 'once') assert.ok(Number.isInteger(u.target) && u.target > 0, text);
	}
	// Mastery counters already count "times done": their texts have no ×
	assert.ok(ALL_MASTERY.every((m) => !/×/.test(m.challenge.text)));
});

test('steps: Specials first, then the ladder; who is open when', () => {
	const steps = stepsOf('m4');
	assert.deepEqual(steps.map((s) => s.key), ['s0', 's1', 's2', 'g', 'p', 'hb']);
	const st = (level, mask) => steps.map((s) => stepStatus('m4', s, level, mask));
	assert.deepEqual(st(0, 0), ['active', 'active', 'active', 'locked', 'locked', 'locked']);
	assert.deepEqual(st(0, 0b111), ['done', 'done', 'done', 'active', 'locked', 'locked']);
	assert.deepEqual(st(1, 0), ['done', 'done', 'done', 'done', 'active', 'locked']);
	assert.deepEqual(st(3, 0), ['done', 'done', 'done', 'done', 'done', 'done']);
	// not out yet: nothing open
	assert.deepEqual(stepsOf('jak-12').map((s) => stepStatus('jak-12', s, 0, 0)), ['locked', 'locked', 'locked']);
	assert.deepEqual(activeSteps('m4', 1, 0).map((s) => s.key), ['p']);
});

test('counters: pruned against the ticks, always below the target', () => {
	const counts = {
		[countKey('m4', 'p')]: 30, // M4 Platinum: on it
		[countKey('m4', 'g')]: 3, // Gold is single-match: no counter
		[countKey('han-86', 'p')]: 99, // above the target
		[countKey('oden', 'p')]: 10, // Oden has Platinum already
		[countKey('future-gun', 'hb')]: 4 // unknown weapon (newer data): kept
	};
	const levels = { ...defaultProgress().weapons, oden: 2 };
	assert.deepEqual(pruneCounts(counts, levels, {}), {
		'm4:p': 30,
		'han-86:p': 49,
		'future-gun:hb': 4
	});
	assert.deepEqual(pruneCounts({ 'mar-9:s0': 5 }, { 'mar-9': 0 }, { 'mar-9': 1 }), {}, 'a ticked special has no counter');
});

test('counters: saved, backed up and migrated; older data without them reads fine', () => {
	assert.deepEqual(normaliseCounts({ 'm4:p': 12.7, 'm4:x': 3, 'bad key': 4, 'm4:hb': 0, 'm4:s1': '5' }), { 'm4:p': 12, 'm4:s1': 5 });
	const p = { ...defaultProgress(), specials: {}, counts: { 'm4:p': 12 } };
	const stored = migrate(JSON.parse(JSON.stringify(toStored(p, defaultPrefs()))));
	assert.deepEqual(stored.progress.counts, { 'm4:p': 12 });
	const backup = migrate(JSON.parse(JSON.stringify(toExport(p))));
	assert.deepEqual(backup.progress.counts, { 'm4:p': 12 });
	const old = migrate({ app: 'mw4-camo-grind', v: 2, progress: { weapons: { m4: 2 }, mastery: {} } });
	assert.equal(old.progress.counts, undefined, 'an old backup leaves counters alone');
	assert.ok(sameProgress(p, { ...p, counts: undefined }), 'missing counters compare as "unknown", not as different');
	assert.ok(!sameProgress(p, { ...p, counts: {} }));
});

test('prefs: status filter and compact mode, with safe defaults', () => {
	assert.deepEqual(
		{ status: normalisePrefs({}).status, compact: normalisePrefs({}).compact },
		{ status: null, compact: false }
	);
	assert.equal(normalisePrefs({ status: 'near', compact: true }).status, 'near');
	assert.equal(normalisePrefs({ status: 'nonsense' }).status, null);
	assert.equal(normalisePrefs({ compact: 'yes' }).compact, false);
});

test('reset: Gold on launch weapons vs from zero (= a new tracker)', () => {
	assert.deepEqual(resetProgress('zero').weapons, defaultProgress().weapons);
	const preset = resetProgress('preset');
	const zero = resetProgress('zero');
	assert.equal(preset.weapons.m4, 1);
	assert.equal(preset.weapons['csg-35'], 0);
	assert.ok(Object.values(zero.weapons).every((l) => l === 0));
	for (const r of [preset, zero]) {
		assert.deepEqual(r.specials, {});
		assert.deepEqual(r.counts, {});
		assert.ok(Object.values(r.mastery).every((n) => n === 0));
	}
});

const doc = (weapons, counts, extra = {}) => ({
	progress: { weapons: { ...defaultProgress().weapons, ...weapons }, mastery: defaultProgress().mastery, specials: {}, ...(counts ? { counts } : {}) },
	notes: {},
	focus: [],
	lastTickAt: null,
	stamps: {},
	...extra
});

test('sync: counters merge per step, the higher wins, done steps drop theirs', () => {
	const base = doc({}, { 'm4:p': 10, 'oden:p': 5 });
	const local = doc({}, { 'm4:p': 14, 'oden:p': 5 });
	const remote = doc({ oden: 2 }, { 'm4:p': 12, 'oden:p': 8 });
	const merged = merge3(base, local, remote);
	assert.deepEqual(merged.progress.counts, { 'm4:p': 14 }, 'both changed M4 → higher; Oden got Platinum elsewhere → no counter');
	// one-sided change wins (even downwards: a correction)
	assert.deepEqual(merge3(base, doc({}, { 'm4:p': 3, 'oden:p': 5 }), base).progress.counts, { 'm4:p': 3, 'oden:p': 5 });
	// a device on an older page sends no counters: that is "no change", never "all gone"
	assert.deepEqual(merge3(base, local, doc({}, undefined)).progress.counts, { 'm4:p': 14, 'oden:p': 5 });
	assert.deepEqual(combine(doc({}, { 'm4:p': 4 }), doc({}, { 'm4:p': 9, 'han-86:p': 2 })).progress.counts, {
		'm4:p': 9,
		'han-86:p': 2
	});
	const wire = fromWire(JSON.parse(JSON.stringify(toWire(local))));
	assert.ok(sameDoc(wire, local), 'counters survive the trip to the sync service');
	assert.ok(!sameDoc(local, base));
});

test('filters: status filters and suggestions from saved progress only', () => {
	const s = {
		weapons: { ...resetProgress('preset').weapons, m4: 3, oden: 2, 'csg-35': 0 },
		specials: { 'csg-35': 0b111 },
		counts: { 'han-86:p': 40, 'axion:p': 10 },
		focus: ['mar-9']
	};
	const W = (id) => WEAPONS.find((w) => w.id === id);
	assert.ok(matchesStatus('done', s, W('m4')));
	assert.ok(!matchesStatus('available', s, W('m4')));
	assert.ok(!matchesStatus('available', s, W('jak-12')), 'not out yet');
	assert.ok(matchesStatus('near', s, W('han-86')), '40/50 headshots');
	assert.ok(!matchesStatus('near', s, W('axion')), '10/50');
	assert.ok(matchesStatus('near', s, W('csg-35')), 'all 3 before Gold done');
	assert.ok(matchesStatus('started', s, W('csg-35')));
	assert.ok(!matchesStatus('started', s, W('cronen-osprey')));
	assert.ok(matchesStatus('focus', s, W('mar-9')));
	const sug = suggestions(s, 1);
	assert.deepEqual(sug.map((x) => [x.weaponId, x.reason.kind]), [
		['csg-35', 'goldReady'],
		['han-86', 'counter'],
		['axion', 'counter']
	]);
	assert.ok(suggestions({ ...s, focus: ['csg-35', 'han-86', 'axion'] }, 1).some((x) => x.weaponId === 'oden' && x.reason.kind === 'lastCamo'));
});
