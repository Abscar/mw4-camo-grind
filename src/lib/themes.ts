/**
 * The four looks. Colours themselves live in app.css under [data-theme="…"];
 * this list is what the theme picker shows.
 * The dark theme was "Blackout" and is now the personalised "Abscar" look; its id stays
 * `blackout` because saved preferences store the id.
 */
export const THEMES = [
	{ id: 'blackout', name: 'Abscar', swatch: ['#07080A', '#FF4418'], browserBar: '#07080A' },
	{ id: 'field', name: 'Field Manual', swatch: ['#F3EFE6', '#4E6B3A'], browserBar: '#F3EFE6' },
	{ id: 'neon', name: 'Neon Grid', swatch: ['#0E0B1F', '#FF3E9A'], browserBar: '#0E0B1F' },
	{ id: 'command', name: 'Command Center', swatch: ['#0F1B2D', '#2563EB'], browserBar: '#0F1B2D' }
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const DEFAULT_THEME: ThemeId = 'blackout';

export function isThemeId(value: unknown): value is ThemeId {
	return THEMES.some((t) => t.id === value);
}
