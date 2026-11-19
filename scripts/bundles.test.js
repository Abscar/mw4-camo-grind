// Cosmetics → Bundles: every MW4 store bundle with everything in it (2026-11-20). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	BUNDLES,
	BUNDLES_CHECKED,
	BUNDLE_ITEM_KINDS,
	BUNDLE_NEW_DAYS,
	BUNDLE_RARITIES,
	bundleIsNew,
	bundleItemsInOrder,
	bundleSearchText,
	bundlesNewestFirst
} from '../src/lib/data/bundles.ts';
import { CLASSES } from '../src/lib/data/weapons.ts';
import { COSMETICS } from '../src/lib/data/cosmetics.ts';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const WEAPONS = new Map(CLASSES.flatMap((c) => c.weapons.map((w) => [w.id, w.name])));
const TAGS = ['mastercraft', 'reactive', 'tracers', 'deathfx'];

test('bundles: unique store ids and names, a price or the platform stores, dates as whole days', () => {
	assert.match(BUNDLES_CHECKED, DAY);
	assert.equal(new Set(BUNDLES.map((b) => b.id)).size, BUNDLES.length);
	assert.equal(new Set(BUNDLES.map((b) => b.name)).size, BUNDLES.length);
	for (const b of BUNDLES) {
		assert.ok(Number.isInteger(b.id) && b.id > 0, b.name);
		assert.ok(b.name.trim() === b.name && b.name.length > 0, String(b.id));
		assert.ok(b.price === null || (Number.isInteger(b.price) && b.price > 0 && b.price <= 10000), b.name);
		if (b.price === null) assert.ok(b.note, `${b.name}: a platform-store bundle says so in its note`);
		assert.match(b.from, DAY);
		assert.ok(b.from <= BUNDLES_CHECKED, `${b.name}: first day after the check date`);
		if (b.left) {
			assert.match(b.left, DAY);
			assert.ok(b.left >= b.from, b.name);
		}
		assert.ok(b.items.length > 0, b.name);
	}
});

test('bundle items: known kinds, guns that exist, rarity on skins and blueprints, no doubles', () => {
	for (const b of BUNDLES) {
		const seen = new Set();
		for (const it of b.items) {
			assert.ok(BUNDLE_ITEM_KINDS.includes(it.kind), `${b.name}: ${it.kind}`);
			assert.ok(it.name.trim() === it.name && it.name.length > 0, b.name);
			const key = `${it.kind}:${it.weapon ?? ''}:${it.name}`;
			assert.ok(!seen.has(key), `${b.name}: ${key} twice`);
			seen.add(key);
			if (it.kind === 'weapon') {
				assert.ok(WEAPONS.has(it.weapon), `${b.name}: unknown weapon ${it.weapon}`);
				assert.ok(BUNDLE_RARITIES.includes(it.rarity), `${b.name}: ${it.name} rarity`);
			} else {
				assert.equal(it.weapon, undefined, `${b.name}: ${it.name} isn't a blueprint`);
				assert.equal(it.tags, undefined, `${b.name}: ${it.name} has blueprint tags`);
			}
			if (it.kind === 'operator') assert.ok(BUNDLE_RARITIES.includes(it.rarity), `${b.name}: ${it.name} rarity`);
			for (const tag of it.tags ?? []) assert.ok(TAGS.includes(tag), `${b.name}: ${tag}`);
		}
	}
});

test('every sticker, charm and large decal in a bundle is in the Cosmetics list as a store item', () => {
	const cos = new Map(COSMETICS.map((c) => [`${c.type}:${c.name}`, c]));
	for (const b of BUNDLES) {
		for (const it of b.items.filter((i) => ['sticker', 'charm', 'decal'].includes(i.kind))) {
			const c = cos.get(`${it.kind}:${it.name}`);
			assert.ok(c, `${b.name}: ${it.kind} “${it.name}” missing from cosmetics.ts`);
			assert.equal(c.source, 'store', `${b.name}: ${it.name}`);
		}
	}
});

test('newest first, skins and blueprints first inside a bundle, "new" for a week, search finds guns and operators', () => {
	const sorted = bundlesNewestFirst();
	for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i - 1].from >= sorted[i].from);
	for (const b of BUNDLES) {
		const kinds = bundleItemsInOrder(b).map((it) => BUNDLE_ITEM_KINDS.indexOf(it.kind));
		assert.deepEqual(kinds, [...kinds].sort((p, q) => p - q), b.name);
		assert.equal(bundleItemsInOrder(b).length, b.items.length);
	}
	const b = BUNDLES.find((x) => !x.left);
	const day = (n) => new Date(Date.parse(b.from) + n * 86_400_000).toISOString().slice(0, 10);
	assert.equal(bundleIsNew(b, ''), false);
	assert.equal(bundleIsNew(b, day(-1)), false);
	assert.equal(bundleIsNew(b, day(0)), true);
	assert.equal(bundleIsNew(b, day(BUNDLE_NEW_DAYS - 1)), true);
	assert.equal(bundleIsNew(b, day(BUNDLE_NEW_DAYS)), false);
	const bone = BUNDLES.find((x) => x.name === 'Bone Chiller II');
	const text = bundleSearchText(bone, (id) => WEAPONS.get(id));
	for (const word of ['patriot xmr', 'regalis', 'ghost', 'golden wraith', 'mastercraft']) assert.ok(text.includes(word), word);
});
