/**
 * Abscars Madness' own settings (2026-11-24, the user: "let me change the game's settings myself, which key I have
 * on jump and all that"): key bindings (two keys per action), volume, screen shake, the level hints and a short hop.
 * Kept per device inside the game's own storage (`mw4-camo-grind:mayhem` → `settings`). Pure, tested in
 * scripts/madness-controls.test.js. Esc always pauses (it also leaves full screen), so it can't be bound.
 */
import type { Input } from './engine.ts';

export type Action = 'left' | 'right' | 'jump' | 'down' | 'pick' | 'throw' | 'dash' | 'nade' | 'holk' | 'pause';
export const ACTIONS: { a: Action; name: string }[] = [
	{ a: 'left', name: 'Run left' },
	{ a: 'right', name: 'Run right' },
	{ a: 'jump', name: 'Jump' },
	{ a: 'down', name: 'Drop down · ground slam' },
	{ a: 'dash', name: 'Dash' },
	{ a: 'pick', name: 'Pick up · use' },
	{ a: 'throw', name: 'Throw gun' },
	{ a: 'nade', name: 'Grenade' },
	{ a: 'holk', name: 'Holk Time' },
	{ a: 'pause', name: 'Pause' }
];
export type Keys = Record<Action, [string, string]>;
export const DEFAULT_KEYS: Keys = {
	left: ['KeyA', 'ArrowLeft'],
	right: ['KeyD', 'ArrowRight'],
	jump: ['Space', 'KeyW'],
	down: ['KeyS', 'ArrowDown'],
	dash: ['KeyC', ''],
	pick: ['KeyE', ''],
	throw: ['KeyQ', ''],
	nade: ['KeyG', ''],
	holk: ['ShiftLeft', 'ShiftRight'],
	pause: ['KeyP', '']
};

export interface Settings {
	keys: Keys;
	/** 0 … 1 */
	volume: number;
	shake: boolean;
	hints: boolean;
	/** let go of jump early for a short hop (off = every jump is a full jump) */
	shortHop: boolean;
}
export const DEFAULT_SETTINGS: Settings = { keys: DEFAULT_KEYS, volume: 0.8, shake: true, hints: true, shortHop: true };

const CODE = /^[A-Za-z0-9]{1,24}$/;
/** a saved copy, checked: unknown bits fall back to the defaults, a key used twice keeps its first place */
export function cleanSettings(v: unknown): Settings {
	const o = (v && typeof v === 'object' ? v : {}) as Partial<Record<keyof Settings, unknown>>;
	const raw = (o.keys && typeof o.keys === 'object' ? o.keys : {}) as Record<string, unknown>;
	const keys = {} as Keys;
	const used = new Set<string>(['Escape']);
	for (const { a } of ACTIONS) {
		const pair = Array.isArray(raw[a]) ? (raw[a] as unknown[]) : DEFAULT_KEYS[a];
		const two = [0, 1].map((i) => {
			const k = typeof pair[i] === 'string' && CODE.test(pair[i] as string) ? (pair[i] as string) : '';
			if (!k || used.has(k)) return '';
			used.add(k);
			return k;
		});
		keys[a] = [two[0], two[1]];
	}
	const vol = typeof o.volume === 'number' && Number.isFinite(o.volume) ? Math.min(1, Math.max(0, o.volume)) : DEFAULT_SETTINGS.volume;
	const flag = (k: 'shake' | 'hints' | 'shortHop') => (typeof o[k] === 'boolean' ? (o[k] as boolean) : DEFAULT_SETTINGS[k]);
	return { keys, volume: vol, shake: flag('shake'), hints: flag('hints'), shortHop: flag('shortHop') };
}

/** put `code` on an action's slot; the key leaves any other place it had */
export function bind(keys: Keys, a: Action, slot: 0 | 1, code: string): Keys {
	const out = {} as Keys;
	for (const { a: b } of ACTIONS) out[b] = keys[b].map((k) => (k === code ? '' : k)) as [string, string];
	if (code === 'Escape' || !CODE.test(code)) return out;
	out[a][slot] = code;
	return out;
}

export function unbind(keys: Keys, a: Action, slot: 0 | 1): Keys {
	const out = { ...keys, [a]: [...keys[a]] as [string, string] };
	out[a][slot] = '';
	return out;
}

/** key code → what it does in the game */
export function keyMap(keys: Keys): Map<string, Action> {
	const m = new Map<string, Action>();
	for (const { a } of ACTIONS) for (const k of keys[a]) if (k) m.set(k, a);
	return m;
}

/** the actions that are Input fields (pause isn't) */
export const inputOf = (a: Action): keyof Input | null => (a === 'pause' ? null : a);

const NAMES: Record<string, string> = {
	Space: 'Space',
	ArrowLeft: '←',
	ArrowRight: '→',
	ArrowUp: '↑',
	ArrowDown: '↓',
	ShiftLeft: 'Left Shift',
	ShiftRight: 'Right Shift',
	ControlLeft: 'Left Ctrl',
	ControlRight: 'Right Ctrl',
	AltLeft: 'Left Alt',
	AltRight: 'Right Alt',
	Enter: 'Enter',
	Tab: 'Tab',
	Backspace: 'Backspace',
	CapsLock: 'Caps Lock',
	Backquote: '§ / `',
	Minus: '-',
	Equal: '=',
	BracketLeft: '[',
	BracketRight: ']',
	Semicolon: ';',
	Quote: "'",
	Backslash: '\\',
	Comma: ',',
	Period: '.',
	Slash: '/',
	IntlBackslash: '<'
};
/** how a key code reads on the screen */
export function keyLabel(code: string): string {
	if (!code) return '–';
	if (NAMES[code]) return NAMES[code];
	if (/^Key[A-Z]$/.test(code)) return code.slice(3);
	if (/^Digit\d$/.test(code)) return code.slice(5);
	if (/^Numpad/.test(code)) return 'Num ' + code.slice(6);
	return code;
}
