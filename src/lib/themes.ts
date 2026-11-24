/**
 * The looks. Colours themselves live in app.css (Abscar) and themes.css (Steel, Matrix) under [data-theme="…"];
 * this list is what the theme picker shows.
 * The dark theme was "Blackout" and is now the personalised "Abscar" look; its id stays
 * `blackout` because saved preferences store the id.
 * Steel (2026-11-22, the user: "superstilrent … bara info och snyggt upplagt, metallgrått") replaced the
 * three old looks Field Manual, Neon Grid and Command Center (the user: "de används inte"); Matrix came the
 * same day ("mycket grönt och coolt och nice").
 */
export const THEMES = [
	{ id: 'blackout', name: 'Abscar', swatch: ['#23160D', '#FF4418'], browserBar: '#23160D' },
	{ id: 'steel', name: 'Steel', swatch: ['#1D2126', '#C9D1D9'], browserBar: '#15181C' },
	{ id: 'matrix', name: 'Matrix', swatch: ['#010603', '#00FF41'], browserBar: '#010603' }
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const DEFAULT_THEME: ThemeId = 'blackout';

/** the removed looks' ids: a save that still names one of them opens in Steel, the other calm look */
export const RETIRED_THEMES: readonly string[] = ['field', 'neon', 'command'];

export function isThemeId(value: unknown): value is ThemeId {
	return THEMES.some((t) => t.id === value);
}

/** a saved theme id → one that exists (a removed look → Steel, anything else unknown → the default) */
export function themeFrom(value: unknown): ThemeId {
	if (isThemeId(value)) return value;
	if (typeof value === 'string' && RETIRED_THEMES.includes(value)) return 'steel';
	return DEFAULT_THEME;
}
