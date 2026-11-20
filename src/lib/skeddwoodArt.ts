/**
 * Skeddwood's reel symbols (2026-11-20), our own drawings as plain SVG strings: the card letters on brass-
 * riveted tiles, the Divergence six-gun (chrome with a rainbow sheen, the top symbol), the High Noon WILD
 * (a gold hat), the Quick Draw cylinder, the sheriff star with Abscar's skull, the GG tombstone, the Skedd
 * (a giant glass spoon pipe, 4 symbols tall, the whole of reel 5) and the WANTED poster frame the squad's
 * emblems go into (SkeddSprite.svelte). The cowboy WILD and the golden skull are Abscar's own figure
 * (abscarOperator.ts). Square symbols are for <svg viewBox="0 0 64 64">, the Skedd for 0 0 64 256.
 * Every id starts with the `u` passed in, so two machines on a page never share one. Pure, deterministic.
 */

const O = '#2a1408';

/** The card letters' colours: [light, dark]. */
export const LOW_COLOURS: Record<string, [string, string]> = {
	ten: ['#3fd08a', '#14663c'],
	jack: ['#4aa6ff', '#14468a'],
	queen: ['#b97aff', '#4a1a86'],
	king: ['#ffad4a', '#9a4a06'],
	ace: ['#ff5a5a', '#8a0d14']
};
const LETTER: Record<string, string> = { ten: '10', jack: 'J', queen: 'Q', king: 'K', ace: 'A' };

/** A card letter on a riveted brass-edged tile. */
export function lowMarkup(u: string, sym: string): string {
	const [a, b] = LOW_COLOURS[sym];
	const id = `${u}-${sym}`;
	const txt = LETTER[sym];
	const size = txt.length > 1 ? 27 : 36;
	return `<defs><linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
	<linearGradient id="${id}-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe6"/><stop offset="0.55" stop-color="#ffe9b0"/><stop offset="1" stop-color="#e8c06a"/></linearGradient></defs>
	<rect x="7" y="7" width="50" height="50" rx="11" fill="#e8c06a" stroke="${O}" stroke-width="2.4"/>
	<rect x="10.4" y="10.4" width="43.2" height="43.2" rx="8.4" fill="url(#${id}-g)"/>
	<path d="M12 22 C24 16 40 16 52 22" stroke="#fff" stroke-opacity="0.22" stroke-width="3" fill="none" stroke-linecap="round"/>
	${[
		[13.6, 13.6],
		[50.4, 13.6],
		[13.6, 50.4],
		[50.4, 50.4]
	]
		.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff0c4" stroke="#6b4306" stroke-width="0.6"/>`)
		.join('')}
	<text x="32" y="${txt.length > 1 ? 42.4 : 45.6}" text-anchor="middle" font-family="Rockwell, 'Rockwell Extra Bold', Bahnschrift, 'Arial Black', serif" font-weight="900" font-size="${size}" letter-spacing="${txt.length > 1 ? -1.5 : 0}" fill="url(#${id}-t)" stroke="${O}" stroke-width="3.2" paint-order="stroke">${txt}</text>`;
}

/** The Divergence six-gun: a chrome revolver with a drifting rainbow sheen and a pearl grip. */
export function sixgunMarkup(u: string): string {
	const id = `${u}-six`;
	return `<defs><linearGradient id="${id}-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#c9d2dc"/><stop offset="0.55" stop-color="#5a6470"/><stop offset="0.8" stop-color="#e2e8ee"/><stop offset="1" stop-color="#3a424c"/></linearGradient>
	<linearGradient id="${id}-r" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0" stop-color="#ff4b8a"/><stop offset="0.2" stop-color="#ffb84a"/><stop offset="0.4" stop-color="#e8ff5a"/><stop offset="0.6" stop-color="#4affc0"/><stop offset="0.8" stop-color="#4a8aff"/><stop offset="1" stop-color="#c84aff"/></linearGradient>
	<linearGradient id="${id}-p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ff0e0"/><stop offset="0.35" stop-color="#7a5ad0"/><stop offset="0.7" stop-color="#d85aa8"/><stop offset="1" stop-color="#3a2a80"/></linearGradient>
	<radialGradient id="${id}-h"><stop offset="0" stop-color="#c84aff" stop-opacity="0.45"/><stop offset="0.5" stop-color="#4affc0" stop-opacity="0.18"/><stop offset="1" stop-color="#4affc0" stop-opacity="0"/></radialGradient></defs>
	<circle cx="32" cy="32" r="30" fill="url(#${id}-h)"/>
	<g transform="translate(35 29) rotate(-16)" stroke="${O}" stroke-width="1.4" stroke-linejoin="round">
		<path d="M-21 2 C-25 9 -28 17 -29 24 C-29 26 -27 27 -25 27 L-17 27 C-15 27 -14 26 -14 24 C-13 17 -11 11 -8 6 Z" fill="url(#${id}-p)"/>
		<path d="M-23 9 L-15 19 M-25 14 L-17 24 M-19 6 L-27 17 M-17 11 L-25 22" stroke="#2a1a50" stroke-opacity="0.45" stroke-width="0.7" fill="none"/>
		<circle cx="-20" cy="15" r="2" fill="#ffd23a" stroke="${O}" stroke-width="0.7"/>
		<path d="M-22 -9 H2 V5 H-6 L-9 9 H-21 Z" fill="url(#${id}-c)"/>
		<rect x="-1" y="-9" width="29" height="6.4" rx="1.6" fill="url(#${id}-c)"/>
		<rect x="2" y="-3.4" width="23" height="4.2" rx="1.6" fill="url(#${id}-c)"/>
		<path d="M24.6 -9 L26 -12.4 H28 V-9 Z" fill="url(#${id}-c)"/>
		<rect x="-18" y="-11.4" width="15" height="15" rx="3.6" fill="url(#${id}-c)"/>
		<path d="M-15 -11 V3.4 M-10.5 -11.2 V3.6 M-6 -11 V3.4" stroke="#3a424c" stroke-width="1"/>
		<path d="M-21 -9 L-26 -15 L-23 -16.4 L-18 -10.6 Z" fill="url(#${id}-c)"/>
		<path d="M-9 5 C-9 13 -3 15 1 12 C3 10 2 7 0 5" fill="none" stroke-width="1.8"/>
		<path d="M-5 5 C-4 8 -3 10 -1 11" fill="none" stroke-width="1.6"/>
		<g stroke="none" opacity="0.55"><rect x="-1" y="-8.4" width="29" height="2.4" rx="1.2" fill="url(#${id}-r)"/><rect x="-17.4" y="-10.6" width="14" height="5" rx="2" fill="url(#${id}-r)"/><path d="M-21.4 -8.4 H1.4 V-5 H-21.4 Z" fill="url(#${id}-r)"/></g>
		<path d="M0 -8 H26" stroke="#fff" stroke-width="0.8" stroke-opacity="0.85"/>
	</g>
	<path d="M50 12 l1.2 2.8 l2.8 1.2 l-2.8 1.2 l-1.2 2.8 l-1.2 -2.8 l-2.8 -1.2 l2.8 -1.2 Z" fill="#fffbe6"/>`;
}

/** High Noon's WILD: a gold cowboy hat over a red WILD ribbon. */
export function hwildMarkup(u: string): string {
	const id = `${u}-hw`;
	return `<defs><linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.45" stop-color="#ffd23a"/><stop offset="1" stop-color="#b86e00"/></linearGradient></defs>
	<circle cx="32" cy="32" r="28" fill="#5a0a10" stroke="#ffd23a" stroke-width="2.4"/>
	<path d="M20 31 C19 22 22 13 26 11 C28 10 30 12 32 12 C34 12 36 10 38 11 C42 13 45 22 44 31 Z" fill="url(#${id}-g)" stroke="${O}" stroke-width="1.6"/>
	<path d="M20.4 26 C27 28 37 28 43.6 26 L44 30.6 C37 32.6 27 32.6 20 30.6 Z" fill="#b3141b" stroke="${O}" stroke-width="1"/>
	<path d="M6 32 C9 27 15 29 21 30 C27 31.6 37 31.6 43 30 C49 29 55 27 58 32 C55 37 47 35.6 42 36 C37 36.6 27 36.6 22 36 C17 35.6 9 37 6 32 Z" fill="url(#${id}-g)" stroke="${O}" stroke-width="1.6"/>
	<rect x="11" y="39" width="42" height="14" rx="4" fill="#e2261f" stroke="${O}" stroke-width="1.6"/>
	<text x="32" y="50.4" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="12.6" letter-spacing="1" fill="#fff6b0" stroke="#5a0508" stroke-width="1.6" paint-order="stroke">WILD</text>`;
}

/** Quick Draw: a revolver cylinder seen end-on, six brass cartridges in it. */
export function cylinderMarkup(u: string): string {
	const id = `${u}-cyl`;
	const ch = Array.from({ length: 6 }, (_, i) => {
		const a = ((i * 60 - 90) * Math.PI) / 180;
		const x = +(32 + 14 * Math.cos(a)).toFixed(2);
		const y = +(32 + 14 * Math.sin(a)).toFixed(2);
		const nx = +(32 + 24.4 * Math.cos(a + Math.PI / 6)).toFixed(2);
		const ny = +(32 + 24.4 * Math.sin(a + Math.PI / 6)).toFixed(2);
		return `<circle cx="${x}" cy="${y}" r="6.4" fill="#1a1c1e" stroke="${O}" stroke-width="1"/><circle cx="${x}" cy="${y}" r="5" fill="url(#${id}-b)"/><circle cx="${x}" cy="${y}" r="1.7" fill="#b86e00" stroke="#6b4306" stroke-width="0.5"/><circle cx="${nx}" cy="${ny}" r="3.4" fill="#2a2016" stroke="${O}" stroke-width="0.8"/>`;
	}).join('');
	return `<defs><radialGradient id="${id}-s" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="0.4" stop-color="#b9c3cd"/><stop offset="1" stop-color="#3a424c"/></radialGradient>
	<radialGradient id="${id}-b" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff6b0"/><stop offset="0.5" stop-color="#ffc928"/><stop offset="1" stop-color="#9a5a00"/></radialGradient>
	<radialGradient id="${id}-f"><stop offset="0" stop-color="#ff8a1a" stop-opacity="0.6"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient></defs>
	<circle cx="32" cy="32" r="31" fill="url(#${id}-f)"/>
	<circle cx="32" cy="32" r="26" fill="url(#${id}-s)" stroke="${O}" stroke-width="2.4"/>
	${ch}
	<circle cx="32" cy="32" r="4.4" fill="url(#${id}-s)" stroke="${O}" stroke-width="1.2"/><circle cx="32" cy="32" r="1.6" fill="#1a1c1e"/>
	<path d="M14 20 C18 13 26 9 34 9" stroke="#fff" stroke-width="2" stroke-opacity="0.6" fill="none" stroke-linecap="round"/>`;
}

/** HIGH NOON: a six-pointed sheriff star with ball tips, Abscar's red-eyed skull in the middle. */
export function starMarkup(u: string): string {
	const id = `${u}-st`;
	const pts = Array.from({ length: 12 }, (_, i) => {
		const r = i % 2 ? 12.4 : 26;
		const a = ((i * 30 - 90) * Math.PI) / 180;
		return `${(32 + r * Math.cos(a)).toFixed(2)} ${(33 + r * Math.sin(a)).toFixed(2)}`;
	}).join(' L');
	const balls = Array.from({ length: 6 }, (_, i) => {
		const a = ((i * 60 - 90) * Math.PI) / 180;
		return `<circle cx="${(32 + 27 * Math.cos(a)).toFixed(2)}" cy="${(33 + 27 * Math.sin(a)).toFixed(2)}" r="3.4" fill="url(#${id}-g)" stroke="${O}" stroke-width="1.2"/>`;
	}).join('');
	return `<defs><linearGradient id="${id}-g" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.4" stop-color="#ffd23a"/><stop offset="0.75" stop-color="#c98a0a"/><stop offset="1" stop-color="#7a5204"/></linearGradient></defs>
	<path d="M${pts} Z" fill="url(#${id}-g)" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>${balls}
	<circle cx="32" cy="33" r="11.6" fill="#7a5204" stroke="${O}" stroke-width="1.2"/><circle cx="32" cy="33" r="10" fill="url(#${id}-g)"/>
	<path d="M25.4 32 C25 26 28 23 32 23 C36 23 39 26 38.6 32 L37.6 35 C37 36.4 36 37 35 37 L35 40 H29 L29 37 C28 37 27 36.4 26.4 35 Z" fill="#3a2604"/>
	<circle cx="29" cy="31" r="1.9" fill="#ff3a3a"/><circle cx="35" cy="31" r="1.9" fill="#ff3a3a"/>
	<path d="M30.4 38 V40 M32 38 V40 M33.6 38 V40" stroke="#ffd23a" stroke-width="0.7"/>`;
}

/** A GG tombstone (free spins: three of them = more spins). */
export function graveMarkup(u: string): string {
	const id = `${u}-gr`;
	return `<defs><linearGradient id="${id}-g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#c9cfd4"/><stop offset="0.5" stop-color="#8a939b"/><stop offset="1" stop-color="#4a5258"/></linearGradient></defs>
	<path d="M8 59 C14 55 50 55 56 59 Z" fill="#3a2a12"/>
	<path d="M14 58 V27 C14 13 22 6 32 6 C42 6 50 13 50 27 V58 Z" fill="url(#${id}-g)" stroke="${O}" stroke-width="2"/>
	<path d="M17.4 56 V28 C17.4 16 24 10 32 10" stroke="#e8ecef" stroke-opacity="0.45" stroke-width="1.6" fill="none"/>
	<text x="32" y="38.6" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="17" fill="#3a4248" stroke="#e2e6e9" stroke-width="0.8" paint-order="stroke">GG</text>
	<path d="M24 44 H40 M26 48.6 H38" stroke="#4a5258" stroke-width="1.4" stroke-linecap="round"/>
	<path d="M42 14 L39 21 L42 25 L39.6 31" stroke="${O}" stroke-width="0.9" fill="none"/>
	<path d="M10 59 C11 54 12 52 13 50 C13.6 53 14 55 14.4 58 M50 58 C50.6 54 52 51 53.6 49 C53.6 52 54 55 54.6 59 M18 58 C18.6 55 19.6 53.6 21 52.6" stroke="#4fb23a" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
}

/**
 * THE SKEDD: a giant glass spoon pipe standing up, 4 symbols tall (viewBox 0 0 64 256): the bowl up top with
 * a packed green load and a glowing ember, swirled rainbow glass down the stem to the mouthpiece, a WILD plate.
 */
export function skeddMarkup(u: string): string {
	const id = `${u}-sk`;
	return `<defs><linearGradient id="${id}-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7affd8"/><stop offset="0.25" stop-color="#4a8aff"/><stop offset="0.5" stop-color="#c84aff"/><stop offset="0.75" stop-color="#ff5ca8"/><stop offset="1" stop-color="#ffd23a"/></linearGradient>
	<linearGradient id="${id}-shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.3" stop-color="#ffffff" stop-opacity="0.65"/><stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
	<radialGradient id="${id}-herb" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stop-color="#9fe05a"/><stop offset="0.6" stop-color="#3f8a22"/><stop offset="1" stop-color="#1d4510"/></radialGradient>
	<radialGradient id="${id}-ember"><stop offset="0" stop-color="#ffe9a0"/><stop offset="0.35" stop-color="#ff8a1a" stop-opacity="0.95"/><stop offset="1" stop-color="#ff3a00" stop-opacity="0"/></radialGradient>
	<radialGradient id="${id}-aura" cx="0.5" cy="0.25" r="0.75"><stop offset="0" stop-color="#c84aff" stop-opacity="0.45"/><stop offset="1" stop-color="#4affc0" stop-opacity="0"/></radialGradient>
	<filter id="${id}-blur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6"/></filter></defs>
	<rect x="0" y="0" width="64" height="256" fill="url(#${id}-aura)"/>
	<g filter="url(#${id}-blur)" fill="#e8ece8" opacity="0.8"><circle class="skw-puff" cx="30" cy="12" r="8"/><circle class="skw-puff" cx="38" cy="6" r="6" style="animation-delay:-1.2s"/><circle class="skw-puff" cx="24" cy="4" r="5" style="animation-delay:-2.1s"/></g>
	<path d="M24 96 C22 140 25 190 27 240 C27.4 248 36.6 248 37 240 C39 190 42 140 40 96 Z" fill="url(#${id}-glass)" stroke="${O}" stroke-width="2"/>
	<path d="M27 104 C26 140 28 190 29.6 238" stroke="url(#${id}-shine)" stroke-width="6" fill="none"/>
	<path d="M30 110 C36 124 26 136 34 150 C40 162 28 176 34 190 C38 200 30 212 33 226" stroke="#fff" stroke-opacity="0.35" stroke-width="1.6" fill="none"/>
	<path d="M37 108 C31 122 39 138 33 154 C29 166 38 182 31 196" stroke="#2a0a4a" stroke-opacity="0.35" stroke-width="1.4" fill="none"/>
	<ellipse cx="32" cy="242" rx="4.6" ry="2.4" fill="#1a0a2a" stroke="${O}" stroke-width="1.2"/>
	<path d="M6 52 C6 26 18 16 32 16 C46 16 58 26 58 52 C58 78 46 96 32 100 C18 96 6 78 6 52 Z" fill="url(#${id}-glass)" stroke="${O}" stroke-width="2.2"/>
	<path d="M12 46 C12 32 20 24 30 22" stroke="#fff" stroke-opacity="0.7" stroke-width="3" fill="none" stroke-linecap="round"/>
	<path d="M14 70 C22 62 20 50 30 46 C40 42 44 56 52 52" stroke="#fff" stroke-opacity="0.3" stroke-width="2" fill="none"/>
	<path d="M10 62 C18 74 30 70 34 82 C38 92 48 86 54 74" stroke="#2a0a4a" stroke-opacity="0.3" stroke-width="2" fill="none"/>
	<ellipse cx="32" cy="38" rx="15" ry="11" fill="#1a0a2a" stroke="${O}" stroke-width="1.6"/>
	<ellipse cx="32" cy="37" rx="12.6" ry="8.6" fill="url(#${id}-herb)"/>
	${[
		[26, 34],
		[33, 32],
		[38, 37],
		[29, 40],
		[35, 41]
	]
		.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#c9f07a" opacity="0.8"/>`)
		.join('')}
	<circle class="skw-ember" cx="31" cy="35" r="9" fill="url(#${id}-ember)"/>
	<circle cx="31" cy="35" r="2.6" fill="#ffd23a"/>
	<rect x="14" y="150" width="36" height="17" rx="4" fill="#e2261f" stroke="${O}" stroke-width="1.8"/>
	<text x="32" y="163" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="13" letter-spacing="1" fill="#fff6b0" stroke="#5a0508" stroke-width="1.6" paint-order="stroke">WILD</text>
	<path d="M50 112 l1.4 3.4 l3.4 1.4 l-3.4 1.4 l-1.4 3.4 l-1.4 -3.4 l-3.4 -1.4 l3.4 -1.4 Z" fill="#fffbe6"/>
	<path d="M12 200 l1 2.4 l2.4 1 l-2.4 1 l-1 2.4 l-1 -2.4 l-2.4 -1 l2.4 -1 Z" fill="#fffbe6"/>`;
}

/** The WANTED poster around a squad member's emblem (the emblem goes in the window at x 13–51, y 16–48). */
export function posterBack(u: string, key: string, colour: string): string {
	const id = `${u}-po-${key}`;
	return `<defs><linearGradient id="${id}-p" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#fbeac4"/><stop offset="0.6" stop-color="#e8cc8e"/><stop offset="1" stop-color="#c9a160"/></linearGradient>
	<clipPath id="${id}-win"><rect x="13" y="15.4" width="38" height="31.6" rx="2"/></clipPath></defs>
	<path d="M7.4 4 L56.6 4.6 L57.4 30 L56.4 59.6 L44 58.6 L40 60 L8 59.4 L6.6 34 Z" fill="url(#${id}-p)" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>
	<path d="M10 7 L54 7.6" stroke="#fff6dc" stroke-opacity="0.6" stroke-width="1"/>
	<text x="32" y="13.4" text-anchor="middle" font-family="Rockwell, Bahnschrift, 'Arial Black', serif" font-weight="900" font-size="8.6" letter-spacing="0.6" fill="#3a1c08">WANTED</text>
	<rect x="13" y="15.4" width="38" height="31.6" rx="2" fill="${colour}" fill-opacity="0.35" stroke="#3a1c08" stroke-width="1.2"/>`;
}
export function posterFront(u: string, key: string, name: string, colour: string): string {
	const len = name.length;
	const size = len > 9 ? 5.2 : len > 7 ? 5.8 : 6.4;
	return `<rect x="13" y="15.4" width="38" height="31.6" rx="2" fill="none" stroke="#3a1c08" stroke-width="1.2"/>
	<rect x="10" y="49" width="44" height="8.4" rx="1.6" fill="${colour}" stroke="#3a1c08" stroke-width="1"/>
	<text x="32" y="55.4" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="${size}" letter-spacing="0.3" fill="#fffbe6" stroke="#2a1408" stroke-width="1.1" paint-order="stroke">${name}</text>
	<circle cx="32" cy="5.4" r="1.6" fill="#8a939b" stroke="${O}" stroke-width="0.6"/>`;
}

/** A tall reel-5 cell's backing: a weathered plank with nails, the square symbol goes on it (viewBox 0 0 64 128). */
export function plankMarkup(u: string): string {
	const id = `${u}-pl`;
	return `<defs><linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a2c14"/><stop offset="0.5" stop-color="#6b4325"/><stop offset="1" stop-color="#3a2210"/></linearGradient></defs>
	<rect x="5" y="3" width="54" height="122" rx="5" fill="url(#${id}-g)" stroke="${O}" stroke-width="2"/>
	<path d="M14 8 C16 40 12 80 15 120 M48 8 C46 44 50 84 47 120 M30 6 C32 30 28 50 31 70" stroke="#2a170a" stroke-opacity="0.5" stroke-width="1" fill="none"/>
	${[
		[12, 10],
		[52, 10],
		[12, 118],
		[52, 118]
	]
		.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#c9cfd4" stroke="${O}" stroke-width="0.6"/>`)
		.join('')}`;
}
