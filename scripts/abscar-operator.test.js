// Abscar's operator figures (2026-11-11): the header emblem + the three in section headings. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { operatorMarkup } from '../src/lib/abscarOperator.ts';

const VARIANTS = ['ghillie', 'lighter', 'nvg', 'sniper'];

test('operator figures: deterministic (prerendered page = hydrated page), no broken numbers', () => {
	for (const v of VARIANTS) {
		const a = operatorMarkup(v, 's1');
		assert.equal(a, operatorMarkup(v, 's1'), `${v}: same input, same drawing`);
		assert.doesNotMatch(a, /NaN|undefined|Infinity/, `${v}: a coordinate went wrong`);
		assert.ok(a.includes('op-ember-glow'), `${v}: the holk is there`);
		assert.ok(a.length < 36_000, `${v}: ${a.length} chars, keep the page light`);
	}
});

test('operator figures: every id belongs to this figure, and every reference points at one', () => {
	for (const v of VARIANTS) {
		const m = operatorMarkup(v, 'x9');
		const ids = [...m.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]);
		assert.equal(new Set(ids).size, ids.length, `${v}: duplicate id`);
		for (const id of ids) assert.ok(id.startsWith('aop-x9-'), `${v}: id ${id} isn't scoped`);
		const refs = [...m.matchAll(/url\(#([^)]+)\)|href="#([^"]+)"/g)].map((x) => x[1] ?? x[2]);
		for (const r of refs) assert.ok(ids.includes(r), `${v}: #${r} is referenced but not defined`);
	}
});

test('operator figures: smoke 0 leaves the smoke out, ghillie has its leaves and buds', () => {
	assert.doesNotMatch(operatorMarkup('lighter', 'a', 0), /op-puff/);
	assert.match(operatorMarkup('lighter', 'a', 0.45), /op-puff/);
	const g = operatorMarkup('ghillie', 'a');
	assert.ok((g.match(/href="#aop-a-bud"/g) ?? []).length >= 5, 'five buds');
	assert.ok((g.match(/href="#aop-a-leaf[57]d?"/g) ?? []).length >= 9, 'nine leaves');
});
