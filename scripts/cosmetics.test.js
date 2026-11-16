// The Cosmetics tab's data (2026-11-12): `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	COSMETICS,
	COSMETICS_CHECKED,
	COSMETIC_SOURCES,
	COSMETIC_TYPES,
	NEW_FOR_DAYS,
	cosmeticEnded,
	cosmeticIsNew,
	cosmeticsOf
} from '../src/lib/data/cosmetics.ts';

import { COSMETIC_ART } from '../src/lib/cosmeticArt.ts';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

test('cosmetics: unique ids, known type and source, a "how" line, dates as whole days', () => {
	assert.match(COSMETICS_CHECKED, DAY);
	assert.equal(new Set(COSMETICS.map((c) => c.id)).size, COSMETICS.length);
	for (const c of COSMETICS) {
		assert.ok(COSMETIC_TYPES.includes(c.type), c.id);
		assert.ok(COSMETIC_SOURCES.includes(c.source), c.id);
		assert.ok(c.name.trim() === c.name && c.name.length > 0, c.id);
		assert.ok(c.how.length > 3, c.id);
		if (c.until) assert.match(c.until, DAY);
		if (c.added) {
			assert.match(c.added, DAY);
			assert.ok(c.added <= COSMETICS_CHECKED, `${c.id}: added after the check date`);
		}
	}
});

test('cosmeticIsNew: tagged for NEW_FOR_DAYS days from `added`, never before load or for old items', () => {
	const c = COSMETICS.find((x) => x.added);
	assert.ok(c, 'some item has an added date');
	const day = (n) => new Date(Date.parse(c.added) + n * 86_400_000).toISOString().slice(0, 10);
	assert.equal(cosmeticIsNew(c, day(0)), true);
	assert.equal(cosmeticIsNew(c, day(NEW_FOR_DAYS - 1)), true);
	assert.equal(cosmeticIsNew(c, day(NEW_FOR_DAYS)), false);
	assert.equal(cosmeticIsNew(c, day(-1)), false);
	assert.equal(cosmeticIsNew(c, ''), false);
	assert.equal(cosmeticIsNew(COSMETICS[0], day(0)), false);
});

test('cosmetics: beta and Twitch drop items all have an end date', () => {
	const beta = COSMETICS.filter((c) => c.source === 'beta');
	assert.ok(beta.length > 0);
	for (const c of beta) assert.ok(c.until, `${c.id}: needs until`);
});

test('cosmetics: anything unconfirmed says why, and nothing of unknown origin is shown as fact', () => {
	for (const c of COSMETICS) {
		if (!c.verified) assert.ok(c.note && c.note.length > 15, `${c.id}: needs a note`);
		if (c.source === 'unknown') assert.equal(c.verified, false, c.id);
	}
});

test('cosmetics: every type has items; each Prestige gives one charm (30) and one large decal (40)', () => {
	for (const type of COSMETIC_TYPES) assert.ok(cosmeticsOf(type).length > 0, type);
	for (let p = 1; p <= 10; p++) {
		assert.equal(COSMETICS.filter((c) => c.how === `Prestige ${p}, level 30` && c.type === 'charm').length, 1);
		assert.equal(COSMETICS.filter((c) => c.how === `Prestige ${p}, level 40` && c.type === 'decal').length, 1);
	}
	assert.equal(COSMETICS.filter((c) => c.gunScreen).every((c) => c.type === 'charm'), true);
});

test('cosmeticEnded: the last day still counts', () => {
	const c = COSMETICS.find((x) => x.id === 'sticker-snake-eyes');
	assert.equal(cosmeticEnded(c, '2026-12-02'), false);
	assert.equal(cosmeticEnded(c, '2026-12-03'), true);
	assert.equal(cosmeticEnded(COSMETICS[0], '2030-01-01'), false);
});

test('cosmetic drawings: only for cosmetics that exist, plain SVG without ids, says what it was drawn after', () => {
	const byId = new Map(COSMETICS.map((c) => [c.id, c]));
	for (const [id, art] of Object.entries(COSMETIC_ART)) {
		const c = byId.get(id);
		assert.ok(c, `${id}: no such cosmetic`);
		assert.equal(art.viewBox, c.type === 'decal' ? '0 0 120 80' : '0 0 80 80', id);
		assert.ok(art.after.length > 10, id);
		assert.ok(!/\sid=|url\(|<script|href=|NaN|undefined/.test(art.svg), `${id}: ids, links or broken numbers in the markup`);
		assert.ok(art.svg.length < 9000, `${id}: ${art.svg.length} chars`);
		// every tag that opens is closed
		const open = (art.svg.match(/<(g|text)\b/g) ?? []).length;
		const close = (art.svg.match(/<\/(g|text)>/g) ?? []).length;
		assert.equal(open, close, id);
	}
	assert.ok(Object.keys(COSMETIC_ART).length >= 29);
});

test('cosmetic drawings: every sticker and large decal has one (2026-11-16); guesses say so', () => {
	for (const c of COSMETICS.filter((x) => x.type !== 'charm')) assert.ok(COSMETIC_ART[c.id], `${c.id}: no drawing`);
	for (const [id, art] of Object.entries(COSMETIC_ART)) {
		if (art.guess) assert.match(art.after, /name only/, `${id}: a guess must say it was drawn from the name`);
	}
});
