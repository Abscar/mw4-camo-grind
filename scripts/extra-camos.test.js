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
import { EXTRA_LOOKS } from '../src/lib/data/extraLooks.ts';
import { swatchSvg } from '../src/lib/camoSwatch.ts';

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

test('extra camo pictures (2026-11-16): only for real entries, each says what it was drawn after', () => {
	const ids = new Set(EXTRA_CAMOS.map((c) => c.id));
	for (const [id, art] of Object.entries(EXTRA_LOOKS)) {
		assert.ok(ids.has(id), `picture for unknown extra camo ${id}`);
		assert.ok(typeof art.after === 'string' && art.after.trim().length > 15, `${id}: says what it was drawn after`);
		assert.doesNotMatch(art.after, /\.$/, `${id}: "after" finishes a sentence, so no full stop of its own`);
	}
	// no camo name or picture yet: these must keep the symbol (no made-up looks)
	for (const id of ['event-wager-match-mastery-camo', 'event-camo-challenge-event-camos', 'event-season-1-reloaded-camo-events']) {
		assert.ok(ids.has(id), `${id} is still an entry`);
		assert.equal(EXTRA_LOOKS[id], undefined, `${id} has no camo to draw`);
	}
});

test('extra camo pictures: valid-looking SVG, the same every time, ids kept apart per tile', () => {
	for (const [id, { look }] of Object.entries(EXTRA_LOOKS)) {
		const a = swatchSvg(look, id, `xcc-${id}`);
		assert.match(a, /^<svg viewBox="0 0 100 100"[^>]*>.*<\/svg>$/s, id);
		assert.doesNotMatch(a, /NaN|undefined|Infinity/, `${id} has a broken number`);
		assert.equal(swatchSvg(look, id, `xcc-${id}`), a, `${id} changes between renders`);
		assert.ok(a.length < 60000, `${id} is ${a.length} chars`);
		const scope = `cwxcc${id.replace(/[^a-zA-Z0-9]/g, '')}`;
		const defined = [...a.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
		for (const d of defined) assert.ok(d.startsWith(scope), `${id}: id ${d} isn't scoped`);
		for (const m of a.matchAll(/url\(#([^)]+)\)/g)) assert.ok(defined.includes(m[1]), `${id}: url(#${m[1]}) points at nothing`);
		// the card and the info box draw the same camo side by side: their ids must differ
		const b = swatchSvg(look, id, `xcd-${id}`);
		const other = [...b.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
		for (const d of other) assert.ok(!defined.includes(d), `${id}: id ${d} used by both copies`);
	}
});

test('daysBetween: whole days, across a month and a clock change', () => {
	assert.equal(daysBetween('2026-11-12', '2026-12-02'), 20);
	assert.equal(daysBetween('2026-10-24', '2026-10-26'), 2);
	assert.equal(daysBetween('2026-11-12', '2026-11-12'), 0);
	assert.equal(daysBetween('2026-11-12', '2026-11-11'), -1);
});
