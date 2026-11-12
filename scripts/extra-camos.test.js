// The Extra camos tab's data (2026-11-12): `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	EXTRA_CAMOS,
	EXTRA_CAMOS_CHECKED,
	EXTRA_KINDS,
	EXTRA_MODES,
	EXTRA_STATUSES,
	EXTRA_TRUST,
	daysBetween,
	extraStatus
} from '../src/lib/data/extraCamos.ts';
import { WEAPONS } from '../src/lib/data/weapons.ts';
import { ALL_MASTERY, DIVERGENCE } from '../src/lib/data/camos.ts';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

test('extra camos: unique ids, known kind / modes / trust, a "how" line, sources, dates as whole days', () => {
	assert.match(EXTRA_CAMOS_CHECKED, DAY);
	assert.ok(EXTRA_CAMOS.length >= 20, `only ${EXTRA_CAMOS.length}`);
	assert.equal(new Set(EXTRA_CAMOS.map((c) => c.id)).size, EXTRA_CAMOS.length);
	for (const c of EXTRA_CAMOS) {
		assert.ok(EXTRA_KINDS.includes(c.kind), c.id);
		assert.ok(EXTRA_TRUST.includes(c.trust), c.id);
		assert.ok(c.modes.length > 0 && c.modes.every((m) => EXTRA_MODES.includes(m)), c.id);
		assert.equal(new Set(c.modes).size, c.modes.length, `${c.id}: a mode twice`);
		assert.ok(c.name.trim() === c.name && c.name.length > 0, c.id);
		assert.ok(c.how.length > 5, c.id);
		assert.ok(c.sources.length > 3, c.id);
		for (const d of [c.from, c.until]) if (d) assert.match(d, DAY, c.id);
		if (c.from && c.until) assert.ok(c.from <= c.until, `${c.id}: starts after it ends`);
		assert.ok(!(c.later && c.gone), `${c.id}: both later and gone`);
	}
});

test('extra camos: a weapon-only camo names a weapon we know', () => {
	const names = new Set(WEAPONS.map((w) => w.name));
	for (const c of EXTRA_CAMOS) if (c.weapon) assert.ok(names.has(c.weapon), `${c.id}: unknown weapon ${c.weapon}`);
});

test('extra camos: nothing from the weapon ladder (that lives on the Camo grind tab)', () => {
	const ladder = new Set(
		[
			'Gold',
			'Platinum',
			'Harmonic Break',
			DIVERGENCE?.name,
			...ALL_MASTERY.map((m) => m.name),
			...WEAPONS.flatMap((w) => (w.specials ?? []).map((s) => s.name))
		].filter(Boolean)
	);
	for (const c of EXTRA_CAMOS) assert.ok(!ladder.has(c.name), `${c.id}: ${c.name} is a ladder camo`);
});

test('extra camos: unconfirmed and leaked ones say why; leaks are never "available now" on the snapshot day', () => {
	for (const c of EXTRA_CAMOS) {
		if (c.trust === 'leak' || c.trust === 'one') assert.ok(c.note && c.note.length > 15, `${c.id}: needs a note`);
		if (c.trust === 'leak') assert.notEqual(extraStatus(c, EXTRA_CAMOS_CHECKED), 'now', c.id);
	}
});

test('extra camos: every list has something on the snapshot day', () => {
	for (const st of EXTRA_STATUSES) {
		assert.ok(
			EXTRA_CAMOS.some((c) => extraStatus(c, EXTRA_CAMOS_CHECKED) === st),
			`nothing ${st} on ${EXTRA_CAMOS_CHECKED}`
		);
	}
});

test('extraStatus: the last day still counts, the first day counts, later/gone without dates', () => {
	const base = { id: 'x', name: 'X', kind: 'event', modes: ['mp'], how: 'Play the event', trust: 'official', sources: 'test' };
	const ev = { ...base, from: '2026-11-11', until: '2026-12-02' };
	assert.equal(extraStatus(ev, '2026-11-10'), 'upcoming');
	assert.equal(extraStatus(ev, '2026-11-11'), 'now');
	assert.equal(extraStatus(ev, '2026-12-02'), 'now');
	assert.equal(extraStatus(ev, '2026-12-03'), 'expired');
	assert.equal(extraStatus({ ...base, later: 'Season 1 Reloaded' }, '2026-11-12'), 'upcoming');
	assert.equal(extraStatus({ ...base, later: 'Season 1 Reloaded', from: '2026-12-04' }, '2026-12-05'), 'now');
	assert.equal(extraStatus({ ...base, gone: 'Beta only' }, '2026-11-12'), 'expired');
	assert.equal(extraStatus(base, '2030-01-01'), 'now');
});

test('daysBetween: whole days, across a month and a clock change', () => {
	assert.equal(daysBetween('2026-11-12', '2026-12-02'), 20);
	assert.equal(daysBetween('2026-10-24', '2026-10-26'), 2);
	assert.equal(daysBetween('2026-11-12', '2026-11-12'), 0);
	assert.equal(daysBetween('2026-11-12', '2026-11-11'), -1);
});
