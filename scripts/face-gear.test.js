// BurgiShop's 420 pack 2 (src/lib/faceGear.ts): mouthpieces, eyes and hats drawn on each operator's face,
// and Abscar's figure wearing them (abscarOperator.ts operatorMarkup). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { operatorMarkup } from '../src/lib/abscarOperator.ts';
import { eyesItem, exhaleAt, faceOf, FACES, hatItem, mouthItem } from '../src/lib/faceGear.ts';
import { ITEM_BY_ID, SHOP_ITEMS } from '../src/lib/shop.ts';

const KEYS = Object.keys(FACES);
const of = (slot) => SHOP_ITEMS.filter((i) => i.slot === slot).map((i) => i.id);

/** ids unique + scoped to `u`, every url(#…) points at one of them, no broken numbers */
function sound(m, u, what) {
	assert.doesNotMatch(m, /NaN|undefined|Infinity|null/, `${what}: a coordinate went wrong`);
	const ids = [...m.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]);
	assert.equal(new Set(ids).size, ids.length, `${what}: duplicate id`);
	for (const id of ids) assert.ok(id.startsWith(`${u}-`), `${what}: id ${id} isn't scoped`);
	for (const r of [...m.matchAll(/url\(#([^)]+)\)/g)].map((x) => x[1])) assert.ok(ids.includes(r), `${what}: #${r} isn't defined`);
	assert.equal((m.match(/<g[\s>]/g) ?? []).length, (m.match(/<\/g>/g) ?? []).length, `${what}: <g> left open`);
}

test('the catalogue: every new face item has a drawing, the Golden Holk stays the emblems’ own', () => {
	for (const id of of('mouth')) {
		const it = mouthItem('t', id, FACES.abscar.mouth);
		if (id === 'mouth-goldholk') assert.equal(it, null, 'drawn by each emblem itself');
		else assert.ok(it?.markup, id);
	}
	for (const id of of('eyes')) assert.ok(eyesItem('t', id, FACES.abscar.eyes), id);
	for (const id of of('hat')) assert.ok(hatItem('t', id, FACES.abscar.head), id);
	assert.equal(mouthItem('t', 'mouth-from-the-future', FACES.abscar.mouth), null, 'an unknown id draws nothing');
	assert.equal(eyesItem('t', 'eyes-shades', null), '', 'no eyes: nothing');
	assert.ok(eyesItem('t', 'eyes-shades', FACES.initials.eyes), 'glasses above the initials');
	assert.equal(hatItem('t', null, FACES.abscar.head), '');
	assert.ok(of('smoke').length >= 3 && of('pet').length >= 3);
});

test('every face × every item: deterministic, ids scoped, references defined, small', () => {
	for (const key of KEYS) {
		const F = FACES[key];
		for (const id of of('mouth')) {
			const a = mouthItem(`u-${key}`, id, F.mouth);
			if (!a) continue;
			assert.deepEqual(a, mouthItem(`u-${key}`, id, F.mouth), `${key} ${id}: same input, same drawing`);
			sound(a.markup, `u-${key}`, `${key} ${id}`);
			assert.ok(a.markup.length < 6000, `${key} ${id}: ${a.markup.length} chars`);
			assert.ok(a.boost > 0 && a.end.every(Number.isFinite), `${key} ${id}: smoke start`);
		}
		for (const id of of('eyes')) {
			const m = eyesItem(`u-${key}`, id, F.eyes);
			if (F.eyes) sound(m, `u-${key}`, `${key} ${id}`);
		}
		for (const id of of('hat')) {
			const m = hatItem(`u-${key}`, id, F.head);
			sound(m, `u-${key}`, `${key} ${id}`);
			assert.ok(m.length < 9000, `${key} ${id}: ${m.length} chars`);
		}
	}
});

test('things in the mouth point the emblem’s way and start at its mouth', () => {
	for (const key of KEYS) {
		const m = FACES[key].mouth;
		for (const id of ['mouth-blunt', 'mouth-pipe', 'mouth-double', 'mouth-cloud9', 'mouth-bong']) {
			const { end } = mouthItem('t', id, m);
			assert.ok(Math.sign(end[0] - m.x) === m.dir, `${key} ${id}: the burning end is on the ${m.dir > 0 ? 'right' : 'left'}`);
			assert.ok(Math.abs(end[0] - m.x) < 30 && Math.abs(end[1] - m.y) < 26, `${key} ${id}: smoke starts near the face (${end})`);
		}
		// the bong stands under the mouth and never hangs far below the 64-unit box
		const bong = mouthItem('t', 'mouth-bong', m).markup;
		const [, sy] = bong.match(/scale\(-?[\d.]+ ([\d.]+)\)/);
		assert.ok(m.y + 24 * Number(sy) <= 66.01, `${key}: bong bottom ${m.y + 24 * Number(sy)}`);
		const ex = exhaleAt(FACES[key]);
		assert.ok(Math.sign(ex[0] - m.x) === m.dir && Math.abs(ex[0] - m.x) < 20 && Math.abs(ex[1] - m.y) < 8, `${key}: a puff comes out beside the mouth`);
	}
	// Phillestar's burger and Drängen's beer are on the right, so theirs point left
	assert.equal(FACES.phillestar.mouth.dir, -1);
	assert.equal(FACES.lars.mouth.dir, -1);
	assert.equal(FACES.abscar.mouth.dir, 1);
});

test('hats sit on the head and eyes on the eyes (anchors inside the box, lenses not overlapping much)', () => {
	for (const key of KEYS) {
		const { head, eyes } = FACES[key];
		assert.ok(head.x > 20 && head.x < 44 && head.y > -2 && head.y < 20 && head.w > 18 && head.w < 48, `${key}: head`);
		if (!eyes) continue;
		assert.ok(eyes.l[0] < eyes.r[0] && Math.abs(eyes.l[1] - eyes.r[1]) < 0.01, `${key}: left eye left of the right one, level`);
		assert.ok(eyes.r[0] - eyes.l[0] >= 2.3 * eyes.rad, `${key}: lenses fit side by side`);
		assert.ok(eyes.l[1] > head.y + head.w * 0.27, `${key}: the eyes are under a hat's cuff`);
	}
});

test('faceOf: a member’s worn items → the face slots', () => {
	assert.deepEqual(faceOf(undefined), { mouth: null, eyes: null, hat: null, smoke: null });
	const w = { mouth: ITEM_BY_ID.get('mouth-bong'), hat: ITEM_BY_ID.get('hat-rasta'), aura: ITEM_BY_ID.get('aura-gold') };
	assert.deepEqual(faceOf(w), { mouth: 'mouth-bong', eyes: null, hat: 'hat-rasta', smoke: null });
});

test('Abscar wearing the pack: no holk in his teeth, the item instead, smoke from its end, eyes + hat on top', () => {
	const u = 'aop-w1';
	const m = mouthItem(u, 'mouth-blunt', FACES.abscar.mouth);
	const extra = m.markup + eyesItem(u, 'eyes-shades', FACES.abscar.eyes) + hatItem(u, 'hat-rasta', FACES.abscar.head);
	const worn = operatorMarkup('ghillie', 'w1', 0.9, { holk: 'none', extra, smokeAt: m.end, smokeBoost: m.boost });
	const plain = operatorMarkup('ghillie', 'w1');
	assert.doesNotMatch(worn, /fill="#f3efe4"/, 'his white holk is gone');
	assert.match(plain, /fill="#f3efe4"/);
	assert.ok(worn.includes(`translate(${m.end[0]} ${m.end[1]})`), 'the smoke rises from the blunt');
	sound(worn, u, 'ghillie + pack');
	assert.ok(worn.length < 50_000, `${worn.length} chars`);
	// the old boolean still means the Golden Holk
	assert.equal(operatorMarkup('ghillie', 'w1', 0.9, true), operatorMarkup('ghillie', 'w1', 0.9, { holk: 'gold' }));
	// every figure can drop its holk
	for (const v of ['ghillie', 'lighter', 'nvg', 'sniper']) assert.doesNotMatch(operatorMarkup(v, 'n', 0.9, { holk: 'none' }), /fill="#f3efe4"/, v);
});
