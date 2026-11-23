// Abscars Madness' settings (src/lib/mayhem/controls.ts): key bindings, volume, toggles.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ACTIONS, bind, cleanSettings, DEFAULT_KEYS, DEFAULT_SETTINGS, keyLabel, keyMap, unbind } from '../src/lib/mayhem/controls.ts';
import { FLOOR, Mayhem, NO_INPUT } from '../src/lib/mayhem/engine.ts';

test('defaults: every action has a key, no key twice, Esc never bound', () => {
	const all = ACTIONS.flatMap(({ a }) => DEFAULT_KEYS[a].filter(Boolean));
	assert.equal(new Set(all).size, all.length);
	for (const { a } of ACTIONS) assert.ok(DEFAULT_KEYS[a][0], a);
	assert.ok(!all.includes('Escape'));
	assert.deepEqual(cleanSettings(undefined), DEFAULT_SETTINGS);
});

test('binding a key moves it from wherever it was', () => {
	let k = bind(DEFAULT_KEYS, 'jump', 0, 'KeyJ');
	assert.deepEqual(k.jump, ['KeyJ', 'KeyW']);
	k = bind(k, 'dash', 1, 'KeyW');
	assert.deepEqual(k.jump, ['KeyJ', '']);
	assert.deepEqual(k.dash, ['KeyC', 'KeyW']);
	assert.equal(keyMap(k).get('KeyW'), 'dash');
	assert.equal(keyMap(k).get('Space'), undefined);
	assert.deepEqual(bind(k, 'jump', 0, 'Escape').jump, ['KeyJ', ''], 'Esc is refused');
	assert.deepEqual(unbind(k, 'dash', 0).dash, ['', 'KeyW']);
	assert.deepEqual(DEFAULT_KEYS.jump, ['Space', 'KeyW'], 'the defaults are never changed');
});

test('a saved copy is cleaned', () => {
	const s = cleanSettings({ keys: { jump: ['KeyJ', 'KeyJ'], left: [7, 'bad key!'], dash: ['Escape', 'KeyX'] }, volume: 3, shake: 'no', hints: false });
	assert.deepEqual(s.keys.jump, ['KeyJ', '']);
	assert.deepEqual(s.keys.left, ['', '']);
	assert.deepEqual(s.keys.dash, ['', 'KeyX']);
	assert.deepEqual(s.keys.right, DEFAULT_KEYS.right, 'missing actions get their defaults');
	assert.equal(s.volume, 1);
	assert.equal(s.shake, true);
	assert.equal(s.hints, false);
});

test('key names read well', () => {
	assert.equal(keyLabel('KeyQ'), 'Q');
	assert.equal(keyLabel('Digit4'), '4');
	assert.equal(keyLabel('Space'), 'Space');
	assert.equal(keyLabel('ArrowUp'), '↑');
	assert.equal(keyLabel('ShiftLeft'), 'Left Shift');
	assert.equal(keyLabel(''), '–');
});

test('short hops off: a tapped jump goes as high as a held one', () => {
	const peak = (shortHop, hold) => {
		const g = new Mayhem('o2', undefined, [], 1);
		g.enemies = [];
		g.shortHop = shortHop;
		for (let i = 0; i < 18; i++) g.step(1 / 60, NO_INPUT);
		let top = FLOOR;
		for (let i = 0; i < 90; i++) {
			g.step(1 / 60, { ...NO_INPUT, jump: i < hold });
			top = Math.min(top, g.player.y);
		}
		return FLOOR - top;
	};
	assert.ok(peak(true, 2) < peak(true, 40) - 60);
	assert.ok(Math.abs(peak(false, 2) - peak(false, 40)) < 2);
});
