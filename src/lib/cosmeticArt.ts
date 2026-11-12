/**
 * Our own drawings of the stickers, large decals and (since the user's next ask the same day) charms on the Cosmetics tab (the user's ask,
 * 2026-11-12: "draw the stickers and decals as carefully and close to the real ones as you can").
 * Cartoon vector redraws made while looking at pictures of the real items; never the game's files.
 * References (kept out of the repo): Activision's Progression/Prestige blog (Prestige 1 + Prestige
 * Master reward boards), Activision's Season 1 Battle Pass blog (Dokkaebi, Killing Demon), Dexerto's
 * in-game screenshots of every Prestige reward row and of Prestige Master 1000, and Detonated's
 * picture of the Wager Match reward board (Snake Eyes).
 *
 * Only items we have SEEN a picture of get a drawing. The rest show the plain symbol and say "no
 * picture found yet": a made-up look would pass for the real thing.
 *
 * Plain SVG markup without ids (no gradients, patterns or filters), so the same drawing can be on
 * screen twice. Large decals: viewBox 0 0 120 80. Stickers and charms: 0 0 80 80.
 */

export interface CosmeticArt {
	viewBox: string;
	svg: string;
	/** Whose picture it was drawn after (shown in the item's info box). */
	after: string;
}

const DECAL = '0 0 120 80';
const STICKER = '0 0 80 80';
const INK = '#16181a';
const SKIN = '#e0b48c';

/** The ring and chain link a charm hangs from; x = where the charm's top is. */
const HANG = (x: number) =>
	`<circle cx="${x}" cy="4.600" r="3" fill="none" stroke="#c9ced4" stroke-width="1.700"/><path d="M${x} 7.600v4.400" stroke="#8d939a" stroke-width="2.600" stroke-linecap="round"/>`;

/** A cartoon soldier bust for "Men of Service": x = centre, hat = helmet | beret | cap. */
function serviceman(x: number, hat: 'helmet' | 'beret' | 'cap', tunic: string, hair: string): string {
	const head =
		`<path d="M${x - 9} 62c0-9 4-13 9-13s9 4 9 13l3 12h-24z" fill="${tunic}" stroke="${INK}" stroke-width="1.4"/>` +
		`<path d="M${x - 3} 50l3 5 3-5" fill="none" stroke="${INK}" stroke-width="1.1"/>` +
		`<ellipse cx="${x}" cy="40" rx="7.2" ry="8.6" fill="${SKIN}" stroke="${INK}" stroke-width="1.4"/>` +
		`<path d="M${x - 4} 39.5h2.6M${x + 1.4} 39.5h2.6" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>` +
		`<path d="M${x - 2.6} 44.6q2.6 1.6 5.2 0" fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round"/>` +
		`<path d="M${x - 5.4} 36.6l3.4-.8M${x + 2} 35.8l3.4.8" stroke="${hair}" stroke-width="1.3" stroke-linecap="round"/>`;
	const top =
		hat === 'helmet'
			? `<path d="M${x - 9.4} 37c-.6-9 3.6-13.6 9.4-13.6s10 4.6 9.4 13.6z" fill="#5d6b3a" stroke="${INK}" stroke-width="1.4"/><path d="M${x - 9.4} 37h18.8" stroke="${INK}" stroke-width="1.6"/><path d="M${x - 5} 28q5-3 10 0" fill="none" stroke="#7d8b55" stroke-width="1.2"/>`
			: hat === 'beret'
				? `<path d="M${x - 8.6} 34.6c-2-7 4-11.4 9.6-11 6.4.4 10.6 3.6 9 9.6-5 1.6-12 2-18.6 1.4z" fill="#a8322c" stroke="${INK}" stroke-width="1.4"/><circle cx="${x - 3.6}" cy="29.6" r="1.7" fill="#e6d28a" stroke="${INK}" stroke-width=".7"/>`
				: `<path d="M${x - 8.4} 35c-1-7 3-11 8.4-11s9.4 4 8.4 11z" fill="${hair}" stroke="${INK}" stroke-width="1.4"/><path d="M${x - 9.6} 35.4h14l5 2.2" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`;
	return head + top;
}

/** A helmeted trooper silhouette for "The Squad". */
function trooper(x: number, y: number, s: number, body: string, light: string): string {
	return (
		`<g transform="translate(${x} ${y}) scale(${s})">` +
		`<path d="M-11 34c0-11 4-17 11-17s11 6 11 17z" fill="${body}" stroke="#ff7a3c" stroke-width="1.3"/>` +
		`<ellipse cx="0" cy="8" rx="6.6" ry="7.6" fill="${light}" stroke="${INK}" stroke-width="1"/>` +
		`<path d="M-8.4 5.6c-.6-8 3.2-12 8.4-12s9 4 8.4 12z" fill="${body}" stroke="#ff7a3c" stroke-width="1.3"/>` +
		`<path d="M-8.4 5.6h16.8" stroke="${INK}" stroke-width="1.3"/>` +
		`<path d="M-4.4 8.6h8.8" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>` +
		`<path d="M-4.6 20h9.2v8h-9.2z" fill="${light}" opacity=".45"/>` +
		`</g>`
	);
}

/** Honeycomb cells for the "C12" plate. */
function hexRow(y: number, x0: number, n: number): string {
	let out = '';
	for (let i = 0; i < n; i++) {
		const x = x0 + i * 11;
		out += `<path d="M${x} ${y - 6.4}l5.5 3.2v6.4l-5.5 3.2-5.5-3.2v-6.4z"/>`;
	}
	return out;
}

const QUESTION = (x: number, y: number, s: number) =>
	`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="#f4efe4" stroke-width="2.6" stroke-linecap="round"><path d="M-3.4-5.4c0-5 8-5 8 0 0 3.4-4 3.6-4 7"/><path d="M.6 6.4v.4"/></g>`;

const STAR = (x: number, y: number, r: number, rot = 0) => {
	let d = '';
	for (let i = 0; i < 10; i++) {
		const a = ((i * 36 - 90 + rot) * Math.PI) / 180;
		const rr = i % 2 === 0 ? r : r * 0.42;
		d += `${i === 0 ? 'M' : 'L'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`;
	}
	return `<path d="${d}z"/>`;
};

/** The dokkaebi (goblin) mask shared by "Dokkaebi" and the Prestige Master 1000 decal. */
function goblinMask(face: string, shade: string, horn: string, hair: string, accent: string): string {
	return (
		// horns and hair
		`<path d="M-17-13c-5-7-5-14-1-19 1 7 5 11 10 13z" fill="${horn}" stroke="${INK}" stroke-width="1.3"/>` +
		`<path d="M17-13c5-7 5-14 1-19-1 7-5 11-10 13z" fill="${horn}" stroke="${INK}" stroke-width="1.3"/>` +
		`<path d="M-12-17c-1-8 4-13 12-13s13 5 12 13c-3-4-6-5-8-2-2-4-6-4-8 0-2-3-5-2-8 2z" fill="${hair}" stroke="${INK}" stroke-width="1.3"/>` +
		// face
		`<path d="M-19-12c2-6 10-9 19-9s17 3 19 9c2 7 1 15-3 21l-5 12c-3 5-19 5-22 0l-5-12c-4-6-5-14-3-21z" fill="${face}" stroke="${INK}" stroke-width="1.5"/>` +
		`<path d="M-16 6c3 3 6 4 9 3M16 6c-3 3-6 4-9 3M-9-15q9-5 18 0" fill="none" stroke="${shade}" stroke-width="1.6" stroke-linecap="round"/>` +
		// brows and three eyes
		`<path d="M-17-8c4-5 9-5 13-1M17-8c-4-5-9-5-13-1" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>` +
		`<ellipse cx="-9.6" cy="-2.6" rx="4.4" ry="3.6" fill="#fff6d8" stroke="${INK}" stroke-width="1.1"/><ellipse cx="9.6" cy="-2.6" rx="4.4" ry="3.6" fill="#fff6d8" stroke="${INK}" stroke-width="1.1"/>` +
		`<circle cx="-9" cy="-2.4" r="2" fill="${accent}" stroke="${INK}" stroke-width=".8"/><circle cx="9" cy="-2.4" r="2" fill="${accent}" stroke="${INK}" stroke-width=".8"/>` +
		`<ellipse cx="0" cy="-13.4" rx="2.6" ry="3.4" fill="#fff6d8" stroke="${INK}" stroke-width="1"/><circle cx="0" cy="-13.2" r="1.3" fill="${accent}"/>` +
		// nose, ring, mouth, teeth, tusks
		`<path d="M-4 5c1-4 7-4 8 0-1 2-7 2-8 0z" fill="${shade}" stroke="${INK}" stroke-width="1.1"/>` +
		`<path d="M-12 12c4-3 20-3 24 0l-2 11c-4 4-16 4-20 0z" fill="#3a0f12" stroke="${INK}" stroke-width="1.4"/>` +
		`<path d="M-9 12.6l1.6 3.4 1.8-3.6 1.8 3.6 1.8-3.6 1.8 3.6 1.8-3.6 1.8 3.6 1.8-3.6 1.8 3.6 1.4-3.4" fill="#fff6d8" stroke="${INK}" stroke-width=".8" stroke-linejoin="round"/>` +
		`<path d="M-8 23.4l2-3 2 3 2-3 2 3 2-3 2 3 2-3 2 3" fill="#fff6d8" stroke="${INK}" stroke-width=".8" stroke-linejoin="round"/>` +
		`<path d="M-13 12c-4 1-6 5-5 10 3-2 6-5 7-9zM13 12c4 1 6 5 5 10-3-2-6-5-7-9z" fill="#fff6d8" stroke="${INK}" stroke-width="1.2"/>`
	);
}

export const COSMETIC_ART: Record<string, CosmeticArt> = {
	// ===== Large decals =====

	// Prestige 1: three cartoon WW2 servicemen side by side (US helmet, British red beret, Soviet cap + PPSh)
	'decal-men-of-service': {
		viewBox: DECAL,
		after: 'Activision’s Prestige 1 reward picture',
		svg:
			`<path d="M10 76c-3-22 6-52 22-56 8-3 16-2 22 2 6-5 16-6 24-2 7-4 16-3 22 3 12 10 14 34 10 53z" fill="#efe6cf" stroke="${INK}" stroke-width="1.6"/>` +
			// rifles behind
			`<path d="M44 74l14-50 2.4.8-12 49.6z" fill="#7a5632" stroke="${INK}" stroke-width="1"/>` +
			`<path d="M70 74l10-40 2.4.6-8.6 39.6z" fill="#7a5632" stroke="${INK}" stroke-width="1"/>` +
			serviceman(33, 'helmet', '#6f7d45', '#4a3a26') +
			serviceman(60, 'beret', '#8a7f52', '#7a4a22') +
			serviceman(88, 'cap', '#59663a', '#3c2f20') +
			// the Soviet's drum-fed SMG
			`<path d="M72 66l26-5 .6 3-26 5z" fill="#3a3a3a" stroke="${INK}" stroke-width="1"/><circle cx="86" cy="68" r="4.4" fill="#4a4a4a" stroke="${INK}" stroke-width="1.1"/><path d="M73 68l-6 5 3 1 6-4z" fill="#7a5632" stroke="${INK}" stroke-width=".9"/>`
	},

	// Prestige 2: a red slanted sign with mock-Cyrillic shouting, a grumpy officer with crossed arms
	'decal-potato-warfare': {
		viewBox: DECAL,
		after: 'Dexerto’s screenshot of the Prestige 2 rewards',
		svg:
			`<path d="M3 30l64-16 6 36-62 15z" fill="#f1e7d2"/>` +
			`<path d="M6 31l59-14.6 5 31L12 62z" fill="#8f2f2a" stroke="${INK}" stroke-width="1.4"/>` +
			`<g transform="rotate(-13.6 38 39)" font-family="Impact, 'Arial Narrow', sans-serif" font-size="9.6" font-weight="700" fill="#f3e3c2"><text x="12" y="33" textLength="40" lengthAdjust="spacingAndGlyphs">NФЩ ҮФЦ</text><text x="12" y="44" textLength="52" lengthAdjust="spacingAndGlyphs">THЯФЩ THДT</text><text x="12" y="55" textLength="46" lengthAdjust="spacingAndGlyphs">PФTДTФ!!!</text></g>` +
			// the officer, greyscale
			`<path d="M64 76c-2-14 4-27 16-30h16c12 3 20 14 20 30z" fill="#efe6cf" stroke="${INK}" stroke-width="1.5"/>` +
			`<path d="M68 76c0-12 5-22 14-25l8 4 8-4c9 3 14 12 14 25z" fill="#8d8a84" stroke="${INK}" stroke-width="1.4"/>` +
			`<path d="M76 51c2-5 8-7 14-7s12 2 14 7c-4 5-9 8-14 8s-10-3-14-8z" fill="#c9c4b8" stroke="${INK}" stroke-width="1.2"/>` +
			`<path d="M79 49l3 4M84 47l2 5M96 47l-2 5M101 49l-3 4" stroke="#8d8a84" stroke-width="1.1" stroke-linecap="round"/>` +
			`<ellipse cx="90" cy="35" rx="8" ry="9.4" fill="#d6d1c6" stroke="${INK}" stroke-width="1.4"/>` +
			`<path d="M79 29c0-7 5-10 11-10s11 3 11 10z" fill="#6f6c66" stroke="${INK}" stroke-width="1.4"/><path d="M77 29.4h20l7 2.6" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M82 23h16" stroke="#8f2f2a" stroke-width="2.2"/>` +
			`<path d="M84.4 33l4 1.4M95.6 33l-4 1.4" stroke="${INK}" stroke-width="1.7" stroke-linecap="round"/><path d="M85.6 36.4h2.4M92 36.4h2.4" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>` +
			`<path d="M86 41.6q4-2.6 8 0" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/><path d="M85 40c2-1.4 8-1.4 10 0" fill="none" stroke="#6f6c66" stroke-width="2" stroke-linecap="round"/>` +
			// crossed arms
			`<path d="M70 62c6-4 16-4 22 0l14-2c3 2 3 8 0 10l-18 2c-6 2-14 2-18-2z" fill="#7b7872" stroke="${INK}" stroke-width="1.4"/><path d="M78 66l22-3" stroke="${INK}" stroke-width="1.2"/><path d="M100 59l7 1-1 6-7 1z" fill="#d6d1c6" stroke="${INK}" stroke-width="1"/>`
	},

	// Prestige 3: a shaggy yellow-green ghillie sniper on the right, his purple-grey suppressed rifle
	// reaching left over dripping red letters
	'decal-ghillie-beast': {
		viewBox: DECAL,
		after: 'Dexerto’s screenshot of the Prestige 3 rewards',
		svg:
			`<path d="M4 22c8-6 26-6 40-2l22 3c8-10 30-12 42-2 10 8 10 30 0 40-12 8-34 8-44-2l-12 2-6 6-40-2z" fill="#dfe6ef"/>` +
			// rifle + suppressor
			`<path d="M8 26c0-5 10-6 36-3l6 1.2v9L44 34c-26 2-36 1-36-8z" fill="#7b7396" stroke="#2a2740" stroke-width="1.4"/>` +
			`<circle cx="15" cy="27.4" r="1.6" fill="#2a2740"/><circle cx="22" cy="31" r="1.2" fill="#2a2740"/>` +
			`<path d="M49 26h26l3 2v6l-3 2H49z" fill="#5c5676" stroke="#2a2740" stroke-width="1.3"/><path d="M56 26v-4h12v4" fill="none" stroke="#2a2740" stroke-width="1.6"/>` +
			// dripping red letters
			`<g font-family="Impact, 'Arial Narrow', sans-serif" font-size="13" font-weight="700" fill="#c8324a" stroke="#6b1626" stroke-width=".5" transform="skewX(-8)"><text x="12" y="52" textLength="54" lengthAdjust="spacingAndGlyphs">ALL GHILLIED</text></g>` +
			`<path d="M10 52v7M17 52v10M25 52v6M33 52v11M41 52v7M50 52v9M58 52v6M64 52v8" stroke="#c8324a" stroke-width="2.2" stroke-linecap="round"/>` +
			// the ghillie suit: a heap of leafy tufts
			`<path d="M70 44c-4-8 0-18 8-20 2-6 12-8 18-4 8-2 16 4 16 12 4 6 2 16-4 20-4 8-16 10-24 6-8 2-14-6-14-14z" fill="#9aa83a" stroke="#3b4a18" stroke-width="1.4"/>` +
			`<path d="M76 28l4 6M84 22l2 8M94 22l-1 8M103 28l-4 6M108 38l-6 3M106 50l-6-3M96 60l-2-7M84 60l2-7M74 50l6-3M90 34l1 8M98 40l-5 5M82 40l5 5" stroke="#5c6e20" stroke-width="1.6" stroke-linecap="round"/>` +
			`<path d="M80 30l3 3M100 32l-3 3M104 44l-4 1M92 52l-1-4M78 44l4 1" stroke="#d6dc7a" stroke-width="1.3" stroke-linecap="round"/>` +
			// the face in the hood + red goggles, arm on the rifle
			`<path d="M72 28c4-5 12-5 15 0l-1 8c-4 3-10 3-13 0z" fill="#2d2b3c" stroke="#16151f" stroke-width="1.2"/><path d="M75 30.6h9" stroke="#e23a4a" stroke-width="3" stroke-linecap="round"/>` +
			`<path d="M66 34l12-1 2 6-13 2z" fill="#5c6e20" stroke="#3b4a18" stroke-width="1.2"/>`
	},

	// Prestige 4: a stencilled general in a peaked cap, eyes struck out with a red bar, a splattered
	// flag behind him, loose stars bottom left
	'decal-traitor': {
		viewBox: DECAL,
		after: 'Dexerto’s screenshot of the Prestige 4 rewards',
		svg:
			// blue brush strokes on the left
			`<path d="M22 8l8 2-4 40-9-3zM14 22l6 1-3 26-6-2zM33 6l6 3-3 14-6-1z" fill="#2c3f9e"/>` +
			`<path d="M24 14c2 0 2 3 0 3M24 22c2 0 2 3 0 3M24 30c2 0 2 3 0 3M24 38c2 0 2 3 0 3" stroke="#8ea0e6" stroke-width="1.6" fill="none"/>` +
			// red and white stripes splattered to the right
			`<path d="M62 16l40-4-3 6-37 3zM62 26l46-2-2 5-44 2zM62 36l42 0-2 5-40 0zM62 46l38 3-4 5-34-3zM62 56l30 5-6 4-24-4z" fill="#c63b3b"/>` +
			`<path d="M62 21l38-3-2 4-36 3zM62 31l44-1-2 4-42 1zM62 41l40 1-2 4-38-1zM62 51l34 4-4 3-30-3z" fill="#f2efe8"/>` +
			`<circle cx="108" cy="14" r="1.6" fill="#c63b3b"/><circle cx="112" cy="34" r="1.2" fill="#c63b3b"/><circle cx="100" cy="60" r="1.8" fill="#c63b3b"/><circle cx="96" cy="8" r="1.1" fill="#c63b3b"/>` +
			// the general: cap, face, collar (blue-white stencil)
			`<path d="M36 76c0-12 8-18 18-20h14c10 2 18 8 18 20z" fill="#dfe5f2"/>` +
			`<path d="M52 56l9 12 9-12 8 4-10 16H54L44 60z" fill="#3a4c8e"/>` +
			`<path d="M47 30c0-4 6-6 14-6s14 2 14 6l1 14c0 9-7 14-15 14s-15-5-15-14z" fill="#e8ecf6"/>` +
			`<path d="M50 44c3 5 7 8 11 8s8-3 11-8c-1 8-5 12-11 12s-10-4-11-12z" fill="#8ea0d6"/>` +
			`<path d="M56 46.600q5-2.400 10 0M58.600 50h4.800M61 40v3" stroke="#3a4c8e" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M50 43l4 3M72 43l-4 3" stroke="#8ea0d6" stroke-width="1.4" stroke-linecap="round"/>` +
			`<path d="M42 28c2-10 10-14 19-14s17 4 19 14l-6 3c-8-3-18-3-26 0z" fill="#b9c4e4"/><path d="M40 29c7-4 35-4 42 0l-2 4c-8-3-30-3-38 0z" fill="#3a4c8e"/><circle cx="61" cy="20" r="3" fill="#f2efe8" stroke="#3a4c8e" stroke-width="1"/>` +
			// the red bar over the eyes
			`<path d="M40 35.4h44v6.4H40z" fill="#c63b3b"/>` +
			// stars
			`<g fill="none" stroke="#f2efe8" stroke-width="1.4" stroke-linejoin="round">${STAR(30, 58, 6.4, 8)}${STAR(42, 52, 5.4, -10)}${STAR(38, 66, 6, 20)}${STAR(50, 70, 5, 0)}${STAR(26, 70, 4.6, -16)}</g>`
	},

	// Prestige 5: a heavy armoured trooper with a round helmet aiming an AK to the right, red shadow
	// outline, white speed slashes
	'decal-dust-to-dust': {
		viewBox: DECAL,
		after: 'Dexerto’s screenshot of the Prestige 5 rewards',
		svg:
			`<path d="M12 66c-6-10 0-26 12-30 0-12 12-20 26-18 10 2 16 8 18 16l40 2 4 6-6 4-30 4c2 8-2 16-10 18-16 6-44 6-54-2z" fill="#a8323a"/>` +
			`<path d="M20 20l8 6M14 30l8 3M72 14l-5 8M84 20l-7 6M24 12l5 8" stroke="#f2efe8" stroke-width="2.2" stroke-linecap="round"/>` +
			// body armour
			`<path d="M18 62c-2-12 4-22 16-24l22-2c10 2 16 10 14 22-6 6-42 10-52 4z" fill="#6a705c" stroke="${INK}" stroke-width="1.5"/>` +
			`<path d="M30 42l22-3 4 16-24 4z" fill="#8a9078" stroke="${INK}" stroke-width="1.2"/><path d="M34 46l16-2M35 51l16-2" stroke="${INK}" stroke-width="1"/>` +
			`<path d="M18 50c-4 2-6 8-2 12l10 2 2-10z" fill="#565c4a" stroke="${INK}" stroke-width="1.3"/>` +
			// round helmet with visor
			`<circle cx="46" cy="27" r="11.6" fill="#7c826c" stroke="${INK}" stroke-width="1.6"/><path d="M38 24c4-4 12-4 16 0l-1 8c-4 3-10 3-14 0z" fill="#23282a" stroke="${INK}" stroke-width="1.2"/><path d="M41 26c3-2 7-2 10 0" stroke="#9fb0b4" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M36 20c3-5 9-7 15-6" stroke="#a9b096" stroke-width="1.4" fill="none" stroke-linecap="round"/>` +
			// the rifle
			`<path d="M40 44l48-5 1 4 16-1v3l-16 2-1 3-22 3-2 10-5 1-1-10-17 2z" fill="#34383a" stroke="${INK}" stroke-width="1.3"/>` +
			`<path d="M66 50c4 4 8 10 8 16l-6 1c-1-6-4-11-8-14z" fill="#7a5632" stroke="${INK}" stroke-width="1.2"/><path d="M88 39l-1-4h3l1 4" fill="#34383a" stroke="${INK}" stroke-width="1"/>` +
			`<path d="M46 48c4-3 10-3 13 0l-1 7c-4 2-9 2-12 0z" fill="#565c4a" stroke="${INK}" stroke-width="1.3"/>`
	},

	// Prestige 6: an astronaut drifting on the left, a space station and blue-grey brush strokes on
	// the right, a red glow behind his shoulder
	'decal-spaced-out': {
		viewBox: DECAL,
		after: 'Dexerto’s screenshot of the Prestige 6 rewards',
		svg:
			`<circle cx="22" cy="30" r="12" fill="#a8463c" opacity=".85"/>` +
			`<path d="M48 22l62-8-4 8-56 8zM50 34l64-4-6 9-56 4zM56 48l46-4-8 9-36 2zM66 58l22-2-8 7-12 1z" fill="#8fb0c8"/>` +
			`<path d="M56 28l48-6-3 4-44 6zM60 42l42-3-4 5-36 2z" fill="#e8eef2"/>` +
			// the station
			`<path d="M70 22l5-1 3 22-5 1z" fill="#c9ccd0" stroke="${INK}" stroke-width="1.1"/><path d="M62 28l22-4 1 5-22 4zM64 38l22-4 1 5-22 4z" fill="#5b7fa6" stroke="${INK}" stroke-width="1"/><path d="M66 27.4l1 5M72 26.2l1 5M78 25l1 5M68 37.4l1 5M74 36.2l1 5M80 35l1 5" stroke="${INK}" stroke-width=".8"/><circle cx="73" cy="20" r="2.6" fill="#e8eef2" stroke="${INK}" stroke-width="1"/>` +
			// the astronaut, tilted
			`<g transform="rotate(-24 38 42)">` +
			`<path d="M28 34h18l3 16-4 4H29l-4-4z" fill="#eef0f2" stroke="${INK}" stroke-width="1.5"/>` +
			`<path d="M26 36l-9 8 3 6 9-6zM48 36l10 5-2 6-10-3z" fill="#dfe2e6" stroke="${INK}" stroke-width="1.4"/>` +
			`<path d="M30 54l-4 14 6 2 5-13zM44 54l5 13-6 3-6-13z" fill="#dfe2e6" stroke="${INK}" stroke-width="1.4"/>` +
			`<path d="M24 66l8 3-1 4-9-2zM50 66l-8 4 2 4 8-4z" fill="#b9bdc4" stroke="${INK}" stroke-width="1.2"/>` +
			`<circle cx="37" cy="26" r="9.4" fill="#f4f5f6" stroke="${INK}" stroke-width="1.6"/><path d="M31 23c3-4 9-4 12 0v6c-3 3-9 3-12 0z" fill="#26323e" stroke="${INK}" stroke-width="1.2"/><path d="M33 24c2-1.6 5-1.6 7 0" stroke="#7fb6e0" stroke-width="1.3" fill="none" stroke-linecap="round"/>` +
			`<path d="M32 40h10v6H32z" fill="#b9bdc4" stroke="${INK}" stroke-width="1"/><circle cx="35" cy="43" r="1" fill="#c63b3b"/><circle cx="39" cy="43" r="1" fill="#3f7fc6"/>` +
			`</g>`
	},

	// Prestige 7: a salmon-red honeycomb plate with "C12" in slanted dark letters and an olive combat
	// robot standing at its left end
	'decal-c12': {
		viewBox: DECAL,
		after: 'Dexerto’s screenshot of the Prestige 7 rewards',
		svg:
			`<g fill="#d0655a" stroke="#8f3a34" stroke-width=".7">${hexRow(22, 32, 8)}${hexRow(31.6, 26.5, 9)}${hexRow(41.2, 32, 8)}${hexRow(50.8, 26.5, 9)}${hexRow(60.4, 32, 8)}</g>` +
			`<g font-family="'Arial Black', Impact, sans-serif" font-size="24" font-weight="900" font-style="italic" fill="#2a1c1c"><text x="58" y="48" textLength="50" lengthAdjust="spacingAndGlyphs">C12</text></g>` +
			`<path d="M58 54h44" stroke="#f3e6da" stroke-width="1.6"/><path d="M58 58h20M82 58h6M92 58h10" stroke="#8f3a34" stroke-width="1.2"/>` +
			// the robot
			`<path d="M22 30l16-4 6 10-4 12-16 2-6-10z" fill="#8c8a5a" stroke="${INK}" stroke-width="1.5"/>` +
			`<path d="M26 34l10-2 3 6-2 6-10 1-3-5z" fill="#a9a774" stroke="${INK}" stroke-width="1"/>` +
			`<path d="M27 18l10-2 2 8-11 3z" fill="#77754a" stroke="${INK}" stroke-width="1.4"/><path d="M30 20.6l5-1" stroke="#e85a4a" stroke-width="2.2" stroke-linecap="round"/><path d="M33 16l1-6" stroke="${INK}" stroke-width="1.2"/>` +
			// arms: a gun arm forward, a shoulder launcher
			`<path d="M42 30l14-6 2 4-13 8z" fill="#77754a" stroke="${INK}" stroke-width="1.3"/><path d="M54 22l10-3 1 4-10 4z" fill="#3a3a34" stroke="${INK}" stroke-width="1.1"/>` +
			`<path d="M10 22l12-3 2 9-12 3z" fill="#77754a" stroke="${INK}" stroke-width="1.3"/><path d="M12 24l2-.5M16 23l2-.5M13 28l2-.5M17 27l2-.5" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>` +
			`<path d="M16 34l6 2-4 12-6-1z" fill="#8c8a5a" stroke="${INK}" stroke-width="1.3"/>` +
			// legs
			`<path d="M24 50l8-1 2 12-8 4zM36 48l7 1 5 12-7 3z" fill="#77754a" stroke="${INK}" stroke-width="1.4"/><path d="M20 66l14-4 2 6-16 4zM38 64l14-2 2 6-15 3z" fill="#5e5c3c" stroke="${INK}" stroke-width="1.3"/>`
	},

	// Prestige 8: a bearded operator on the left aiming a long sniper rifle to the right across a torn
	// banner (dark, red band, white stripe) with a round red-and-white rosette
	'decal-keller': {
		viewBox: DECAL,
		after: 'Dexerto’s screenshot of the Prestige 8 rewards',
		svg:
			// the torn banner
			`<path d="M14 18l20-2 14 3 18-4 22 3 26-2-2 12 4 10-6 8 2 12-14 6-16-4-20 4-22-6-16 2-10-6z" fill="#2b3230" stroke="${INK}" stroke-width="1.2"/>` +
			`<path d="M12 22l100-3 1 9-101 3z" fill="#f1ece2"/><path d="M12 30l102-3 0 14-102 3z" fill="#9e2f3a"/><path d="M12 45l98-2 0 4-98 2z" fill="#f1ece2"/>` +
			// rosette
			`<circle cx="86" cy="36" r="12.4" fill="#f1ece2" stroke="#9e2f3a" stroke-width="1.6"/><g fill="#9e2f3a">${STAR(86, 36, 9.6)}</g><circle cx="86" cy="36" r="3" fill="#f1ece2"/>` +
			`<path d="M86 23.6v3M86 45.4v3M73.6 36h3M95.4 36h3M77.4 27.4l2 2M92.6 42.6l2 2M94.6 27.4l-2 2M79.4 42.6l-2 2" stroke="#9e2f3a" stroke-width="1.5" stroke-linecap="round"/>` +
			// the operator
			`<path d="M8 74c-2-14 2-26 12-30l14-1c8 3 12 12 10 24l-4 8z" fill="#7c7550" stroke="${INK}" stroke-width="1.5"/>` +
			`<path d="M14 52l20-2 3 18-22 3z" fill="#a39a6a" stroke="${INK}" stroke-width="1.2"/><path d="M17 56l6-.6v5l-6 .6zM26 55l6-.6v5l-6 .6zM18 64l14-1.4" stroke="${INK}" stroke-width="1" fill="#8a8258"/>` +
			`<ellipse cx="27" cy="30" rx="8" ry="9.4" fill="${SKIN}" stroke="${INK}" stroke-width="1.4"/>` +
			`<path d="M18.6 28c-1-8 4-12 9-12s10 3 8.6 10c-4-4-12-4-17.6 2z" fill="#5a3d24" stroke="${INK}" stroke-width="1.3"/>` +
			`<path d="M20 32c1 8 4 11 8 11s7-3 7.4-9c-2 3-4 3-7 3s-6-1-8.4-5z" fill="#5a3d24" stroke="${INK}" stroke-width="1.2"/>` +
			`<path d="M28.6 29h3.4" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>` +
			// the rifle: stock at the shoulder, scope, long barrel + suppressor
			`<path d="M22 40l12-3 2 5 26-4 1 3 26-3 1 3 22-2v3l-22 3-27 4-2 8-5 1v-8l-10 2-2 6-12 3z" fill="#2d3134" stroke="${INK}" stroke-width="1.3"/>` +
			`<path d="M40 32l22-3 1 5-22 3z" fill="#3c4246" stroke="${INK}" stroke-width="1.2"/><circle cx="63" cy="31.4" r="3" fill="#3c4246" stroke="${INK}" stroke-width="1.1"/><path d="M46 36l1 3M56 34.6l1 3" stroke="${INK}" stroke-width="1.4"/>` +
			`<path d="M40 44c4-3 9-3 12 0l-1 6c-4 2-8 2-11 0z" fill="${SKIN}" stroke="${INK}" stroke-width="1.2"/>`
	},

	// Prestige 9: a skull-masked, hooded operator in sepia with white question marks by his head and
	// a halftone dot shadow
	'decal-captain-meme': {
		viewBox: DECAL,
		after: 'Dexerto’s screenshot of the Prestige 9 rewards',
		svg:
			(() => {
				let dots = '';
				for (let r = 0; r < 7; r++) for (let c = 0; c < 9; c++) dots += `<circle cx="${70 + c * 4.4 + (r % 2) * 2.2}" cy="${34 + r * 4.4}" r="${(1.5 - c * 0.12).toFixed(2)}"/>`;
				return `<g fill="#7a5a40" opacity=".8">${dots}</g>`;
			})() +
			`<path d="M34 78c-6-14 0-30 12-36-4-16 6-34 22-34s24 14 22 30c10 6 16 22 10 38z" fill="#efe6d4" stroke="${INK}" stroke-width="1.4"/>` +
			// jacket and hood
			`<path d="M38 78c-4-12 2-26 14-30l30-1c12 4 18 16 14 31z" fill="#5c4634" stroke="${INK}" stroke-width="1.5"/>` +
			`<path d="M56 50l10 14 12-14 8 6-14 22H60L48 56z" fill="#3e2f24" stroke="${INK}" stroke-width="1.2"/>` +
			`<path d="M48 40c-4-16 6-28 20-28s22 12 18 28c-2 8-8 12-10 12H58c-4 0-8-4-10-12z" fill="#6f5642" stroke="${INK}" stroke-width="1.5"/>` +
			// the skull face
			`<path d="M54 30c0-9 6-13 14-13s14 4 14 13c0 6-2 10-4 12l-2 8c-4 2-12 2-16 0l-2-8c-2-2-4-6-4-12z" fill="#ece4d2" stroke="${INK}" stroke-width="1.4"/>` +
			`<path d="M57.6 29.4c2-3 7-3 8 1-1 4-6 5-8 2zM78.400 29.400c-2-3-7-3-8 1 1 4 6 5 8 2z" fill="#231c18"/>` +
			`<path d="M66.400 36.600l1.600-4 1.600 4-1.600 1.800z" fill="#231c18"/>` +
			`<path d="M59 42h18M61 42v7M64.400 42v8M68 42v8M71.600 42v8M75 42v7" stroke="#231c18" stroke-width="1.2"/>` +
			`<path d="M56 24c3-3 8-4 12-4s9 1 12 4" stroke="#b9ad96" stroke-width="1.4" fill="none"/>` +
			// arms folded with a hand at the chin height
			`<path d="M40 68c8-6 22-8 34-4l6 6-4 6H44z" fill="#4a382b" stroke="${INK}" stroke-width="1.4"/><path d="M46 62l8-2 2 6-8 3z" fill="#d6c9ae" stroke="${INK}" stroke-width="1.1"/>` +
			QUESTION(36, 22, 1.5) +
			QUESTION(26, 34, 1.1) +
			QUESTION(44, 36, 0.9)
	},

	// Prestige 10: four helmeted soldiers shoulder to shoulder in purple-navy with a hot orange
	// outline, rifles low, a yellow brushed "사" (four) top right
	'decal-the-squad': {
		viewBox: DECAL,
		after: 'Dexerto’s screenshot of the Prestige 10 rewards',
		svg:
			`<path d="M6 70c-4-16 2-34 14-40 8-10 22-12 30-6 8-6 22-6 30 2 12 0 22 10 24 24l10 6-4 8-12-2-6 8z" fill="#1c1830" stroke="#ff7a3c" stroke-width="1.6"/>` +
			trooper(24, 36, 0.95, '#3a3166', '#8f86c8') +
			trooper(84, 36, 0.9, '#2e2a58', '#7c75b4') +
			trooper(44, 28, 1.12, '#4a3f86', '#a69ee0') +
			trooper(66, 30, 1.08, '#40377a', '#9890d4') +
			// rifles across the front
			`<path d="M30 60l40-8 1 3 20-3 1 3-20 5-2 8-5 1v-7l-34 7z" fill="#17142a" stroke="#ff7a3c" stroke-width="1.2"/>` +
			`<path d="M70 62l34 8-1 4-34-7z" fill="#17142a" stroke="#ff7a3c" stroke-width="1.2"/>` +
			// 사, brushed in yellow
			`<g fill="none" stroke="#f2d03c" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M96 8c-1 8-5 14-11 18M97 12c2 6 6 10 11 12"/><path d="M112 4v26M112 16h6"/></g>`
	},

	// Prestige Master 1000: a blue-grey goblin mask with red accents and a big salmon "1000"
	'decal-prestige-master-1000': {
		viewBox: DECAL,
		after: 'Dexerto’s screenshot of the Prestige Master rewards',
		svg:
			`<g font-family="Impact, 'Arial Black', sans-serif" font-size="34" font-weight="900" fill="#d86a55" stroke="#6e2a20" stroke-width="1.2"><text x="56" y="55" textLength="61" lengthAdjust="spacingAndGlyphs">1000</text></g>` +
			`<path d="M56 60h61" stroke="#6e2a20" stroke-width="1.4"/>` +
			`<g transform="translate(28 43) scale(1.04)">${goblinMask('#7f8ea4', '#56637a', '#d8dce4', '#c63b3b', '#c63b3b')}</g>`
	},

	// Battle Pass tier 27: a red three-eyed goblin mask with white hair, cream horns and tusks, a gold
	// nose ring, blue flames with yellow edges curling behind it, on a white die-cut
	'decal-dokkaebi': {
		viewBox: DECAL,
		after: 'Activision’s Season 1 Battle Pass picture',
		svg:
			`<path d="M4 34c-2-14 8-26 24-24 6-6 16-8 24-6 8-2 18 0 24 6 16-4 30 8 28 22 6 12 2 26-10 30-6 10-18 14-28 10-8 6-22 6-30 0-12 4-24-2-28-12-6-8-6-18-4-26z" fill="#f6f3ec" stroke="#b9b4a8" stroke-width="1"/>` +
			// blue flames with yellow rims, licking out behind the mask on both sides
			`<g fill="#2f66b8" stroke="#f0c63a" stroke-width="1.700" stroke-linejoin="round">` +
			`<path d="M74 12c8-2 14 2 14 8 6-4 14 0 14 8-3-2-6-1-7 2 6 0 10 6 6 12-2-3-5-3-7-1 5 4 4 12-2 14-1-4-4-5-6-3 2 6-2 12-9 11-6-10-8-36-3-51z"/>` +
			`<path d="M30 14c-8-2-13 3-12 9-6-3-12 2-11 9 3-2 6-1 7 2-6 1-9 8-4 13 1-3 4-4 6-2-4 5-2 12 4 13 1-4 3-5 6-3-1 5 3 10 9 8 5-10 3-36-5-49z"/>` +
			`</g>` +
			`<g fill="#6aa8ea"><path d="M84 24c4 2 5 8 1 11 5 3 4 10-1 12-2-6-3-16 0-23zM22 26c-4 2-5 8-1 11-5 3-4 10 1 12 2-6 3-16 0-23z"/></g>` +
			`<g transform="translate(52 42) scale(1.16)">${goblinMask('#d23a30', '#8f1f1c', '#f3ead2', '#f4f2ee', '#e8a020')}` +
			// gold nose ring and cheek studs
			`<circle cx="0" cy="9" r="3.4" fill="none" stroke="#e8b830" stroke-width="1.6"/><circle cx="-15" cy="6" r="1.3" fill="#e8b830"/><circle cx="15" cy="6" r="1.3" fill="#e8b830"/><path d="M-4-19q4-2 8 0" stroke="#e8b830" stroke-width="1.4" fill="none"/></g>`
	},

	// ===== Stickers =====

	// Battle Pass (yours on purchase): a black shield-shaped sticker with a white edge, blocky yellow
	// Korean letters top left, a teal horned demon skull bottom right
	'sticker-killing-demon': {
		viewBox: STICKER,
		after: 'Activision’s Season 1 Battle Pass picture',
		svg:
			`<g transform="rotate(-8 40 40)">` +
			`<path d="M12 12h56l4 6v30c-4 12-16 20-32 22-16-2-28-10-32-22V18z" fill="#f4f2ec" stroke="#b9b4a8" stroke-width=".8"/>` +
			`<path d="M15 15h50l3 4.600v27.400c-3.600 10.400-14 17.400-28 19.400-14-2-24.400-9-28-19.400V19.600z" fill="#15171a"/>` +
			// 킬 (kill) in chunky yellow blocks
			`<g fill="#f2c81e"><path d="M19 19h17v4.400H23.400v3H36v4.400H23.400V36H19zM39 19h4.600v17H39zM19 39h24.600v4.400H23.400v2.600h20.200v4.400H23.400v2.800h20.200v4.400H19v-9.600h0z"/></g>` +
			`<path d="M23.400 43.400h15.800v2.600H23.400zM23.400 50.400h15.800v2.800H23.400z" fill="#15171a"/>` +
			// the teal demon skull
			`<g fill="#2fc4b0" stroke="#0d5a52" stroke-width=".9" stroke-linejoin="round">` +
			`<path d="M43 30c2-6 4-9 8-11-1 5 0 8 3 10zM67 30c-2-6-4-9-8-11 1 5 0 8-3 10z"/>` +
			`<path d="M44 38c0-7 5-11 11-11s11 4 11 11c0 4-1 6-3 8l-1 8c-3 3-11 3-14 0l-1-8c-2-2-3-4-3-8z"/>` +
			`</g>` +
			`<path d="M47 37c2-2 5-2 6 1-1 3-4 3-6 1zM63 37c-2-2-5-2-6 1 1 3 4 3 6 1z" fill="#15171a"/><path d="M53.800 43l1.200-3 1.200 3-1.200 1.400z" fill="#15171a"/>` +
			`<path d="M49 48h12M51 48v5M53.600 48v6M56.400 48v6M59 48v5" stroke="#0d5a52" stroke-width="1"/>` +
			`<path d="M46 33l4 2M64 33l-4 2" stroke="#0d5a52" stroke-width="1.3" stroke-linecap="round"/>` +
			`</g>`
	},

	// Prestige Master level 80: a teal-and-purple gas mask with big magenta lenses and a grey filter
	// can at the lower right, dark die-cut edge
	'sticker-containment-breach': {
		viewBox: STICKER,
		after: 'Activision’s Prestige Master reward picture',
		svg:
			`<g transform="rotate(-10 40 40)">` +
			`<path d="M16 34c0-16 10-26 24-26s24 10 24 26c0 6-1 10-3 14l9 6c4 3 4 9 1 12l-6 6c-3 3-8 3-11 0l-6-6c-3 2-5 3-8 3-12 0-24-12-24-35z" fill="#121418" stroke="#2a2d34" stroke-width="1"/>` +
			`<path d="M19 34c0-14 9-23 21-23s21 9 21 23c0 7-2 13-5 18-4 6-10 10-16 10-11 0-21-10-21-28z" fill="#1f7f78"/>` +
			`<path d="M19 34c0-9 4-16 10-20-3 6-4 14-3 22 1 10 6 20 14 26-11 0-21-10-21-28z" fill="#5a2f86"/>` +
			`<path d="M52 13c5 4 9 11 9 21 0 7-2 13-5 18-2-10-2-26-4-39z" fill="#17605c"/>` +
			`<path d="M28 14q12-6 24 0" stroke="#7fe0d6" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
			// lenses
			`<circle cx="30" cy="32" r="9" fill="#121418"/><circle cx="50" cy="32" r="9" fill="#121418"/>` +
			`<circle cx="30" cy="32" r="6.800" fill="#e23aa6"/><circle cx="50" cy="32" r="6.800" fill="#e23aa6"/>` +
			`<path d="M25.600 30c1-3 4-4.600 7-3.600M45.600 30c1-3 4-4.600 7-3.600" stroke="#ffc2ea" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
			`<circle cx="33" cy="35" r="1.600" fill="#8a1f6a"/><circle cx="53" cy="35" r="1.600" fill="#8a1f6a"/>` +
			// nose piece and mouth grille
			`<path d="M36 42h8l3 8c-2 4-12 4-14 0z" fill="#121418"/><path d="M36.600 45h6.800M36 48h8M36.600 51h6.800" stroke="#7fe0d6" stroke-width="1.1" stroke-linecap="round"/>` +
			// the filter can
			`<g transform="rotate(38 58 58)"><path d="M49 52h18v13H49z" fill="#8a9098" stroke="#121418" stroke-width="1.4"/><path d="M49 55.600h18M49 61.400h18" stroke="#121418" stroke-width="1.1"/><path d="M52 52v13M64 52v13" stroke="#c6ccd4" stroke-width="1"/></g>` +
			`</g>`
	},

	// Wager Match event: a striking snake head, jaws wide, long fangs, forked tongue curling down to
	// the left, in bone and grey with a white die-cut edge
	'sticker-snake-eyes': {
		viewBox: STICKER,
		after: 'Detonated’s picture of the Wager Match reward board',
		svg:
			// white die-cut
			`<path d="M22 20c8-12 28-16 42-8 10 6 12 18 6 28-2 10-8 20-18 24-6 4-14 2-18-2l-8 6c-6 6-16 6-20 0-4-6 0-12 6-12l8-6c-4-10-4-22 2-30z" fill="#f6f4ee" stroke="#b9b4a8" stroke-width=".9"/>` +
			// upper head
			`<path d="M26 24c8-10 24-12 36-6 8 4 9 13 4 20l-14-2-10-10-12 6c-4-2-6-5-4-8z" fill="#9a968e" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>` +
			`<path d="M34 20c6-4 16-4 24 0M30 25c4-3 8-4 12-4M48 22c5 0 10 2 13 6" stroke="#6b6862" stroke-width="1.2" fill="none" stroke-linecap="round"/>` +
			`<path d="M36 22l3 3 3-3M44 21l3 3 3-3M52 23l3 3 3-2" stroke="#d8d4c8" stroke-width="1" fill="none"/>` +
			// eye
			`<path d="M50 26c3-3 8-2 9 2-3 2-7 1-9-2z" fill="#e8d44a" stroke="${INK}" stroke-width="1.1"/><path d="M54.600 25v4" stroke="${INK}" stroke-width="1.5"/>` +
			`<path d="M47 24c4-3 10-3 14 1" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
			// open mouth interior
			`<path d="M30 32l12-6 10 10 14 2c-2 8-7 16-14 20-6 3-13 1-16-4-2-8-4-16-6-22z" fill="#3c2a2c" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>` +
			`<path d="M40 40c4 2 10 6 12 12" stroke="#7a4a4e" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
			// lower jaw
			`<path d="M34 46c2 8 8 14 16 14 8-2 14-10 16-20-4 8-10 14-18 14-6 0-11-3-14-8z" fill="#b8b4aa" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>` +
			`<path d="M42 56l1.600-4 2 3.600M49 58l1.400-4.400 2 3.800M56 54l.6-4 2.400 2.800" fill="#f4f1e6" stroke="${INK}" stroke-width=".8" stroke-linejoin="round"/>` +
			// fangs
			`<path d="M36 30c0 8 2 15 5 20 2-6 2-13 0-21z" fill="#f4f1e6" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>` +
			`<path d="M46 34c1 6 3 11 6 14 1-5 0-10-2-15z" fill="#f4f1e6" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>` +
			`<path d="M56 37l1.400 5 1.800-4.400M61 38l.8 4.400 1.800-4" fill="#f4f1e6" stroke="${INK}" stroke-width=".8" stroke-linejoin="round"/>` +
			// forked tongue curling down-left
			`<path d="M40 52c-6 4-12 8-16 12-3 3-8 3-10 0" stroke="#8f2f3a" stroke-width="3" fill="none" stroke-linecap="round"/>` +
			`<path d="M14 64c-3-1-5-3-5-6M14 64c-2 2-2 5 0 7" stroke="#8f2f3a" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
	},

	// ===== Charms (viewBox 0 0 80 80; a ring and a chain link on top, the charm hanging under it) =====

	// Prestige 1: a tan plastic toy soldier, kneeling with a bazooka on his shoulder
	'charm-engage': {
		viewBox: STICKER,
		after: 'Activision’s Prestige 1 reward picture',
		svg:
			HANG(40) +
			'<g stroke="#7a5326" stroke-width="1.4" stroke-linejoin="round" fill="#dba25c">' +
			'<path d="M22 70h38l3 5H19z" fill="#c98f4a"/>' +
			'<path d="M34 44l12-2 4 12-2 8 8 4-1 5-13-2-3-10-6 2-3 10h-7l2-14z"/>' +
			'<path d="M35 30c0-5 4-8 8-8s8 3 8 8l-1 6c-4 3-10 3-14 0z"/>' +
			'<path d="M33 30c1-7 6-10 10-10s9 3 10 10z" fill="#c98f4a"/>' +
			'<path d="M12 34l42-9 2 6-42 10z" fill="#c98f4a"/><path d="M52 24l8-3 3 8-8 3z" fill="#c98f4a"/><path d="M12 33l-4 2 1 5 5-1z" fill="#b57c3c"/>' +
			'<path d="M36 40l-8 4 2 6 9-4zM46 40l6-8 5 3-5 10z"/>' +
			'</g>' +
			'<path d="M40 30h7M38 48l8-1M30 62l6-2" stroke="#7a5326" stroke-width="1.1" stroke-linecap="round" fill="none"/>'
	},

	// Prestige 2: a shabby golden-brown teddy bear, arms out
	'charm-beary-sorry': {
		viewBox: STICKER,
		after: 'Dexerto’s screenshot of the Prestige 2 rewards',
		svg:
			HANG(44) +
			'<g transform="rotate(-8 40 44)" stroke="#5e4320" stroke-width="1.5" stroke-linejoin="round" fill="#b98c48">' +
			'<circle cx="30" cy="16" r="5"/><circle cx="50" cy="16" r="5"/>' +
			'<path d="M22 42l-8 10c-2 4 3 7 6 4l8-8zM58 42l8 10c2 4-3 7-6 4l-8-8z"/>' +
			'<path d="M30 60l-3 12c0 5 9 5 10 0l1-10zM50 60l3 12c0 5-9 5-10 0l-1-10z"/>' +
			'<ellipse cx="40" cy="48" rx="14" ry="16"/>' +
			'<circle cx="40" cy="24" r="12.600"/>' +
			'<ellipse cx="40" cy="28" rx="5.600" ry="4.400" fill="#d6b272"/>' +
			'</g>' +
			'<g transform="rotate(-8 40 44)"><circle cx="35" cy="21.600" r="1.700" fill="#2a1c0c"/><path d="M43.600 20l3 3M46.600 20l-3 3" stroke="#2a1c0c" stroke-width="1.400" stroke-linecap="round"/><path d="M38.600 26.600h2.800l-1.400 2z" fill="#2a1c0c"/><path d="M37 31q3 1.600 6 0" stroke="#2a1c0c" stroke-width="1.100" fill="none" stroke-linecap="round"/>' +
			'<path d="M40 36v22M34 42l3 2M44 50l3-2M33 54l4 1" stroke="#8a6630" stroke-width="1.200" stroke-linecap="round" stroke-dasharray="2 2.400"/><path d="M28 30l4 3M50 60l4-2" stroke="#d6b272" stroke-width="1.600" stroke-linecap="round"/></g>'
	},

	// Prestige 3: a steel helmet over a gas mask, two round lenses, a filter in front and one on the side
	'charm-gas-guys': {
		viewBox: STICKER,
		after: 'Dexerto’s screenshot of the Prestige 3 rewards',
		svg:
			HANG(40) +
			'<g stroke="#1e2124" stroke-width="1.5" stroke-linejoin="round">' +
			'<path d="M22 44c0-10 8-16 18-16s18 6 18 16c0 10-4 20-10 24H32c-6-4-10-14-10-24z" fill="#8f959b"/>' +
			'<path d="M16 34c0-13 10-21 24-21s24 8 24 21l2 5H14z" fill="#b4babf"/>' +
			'<path d="M14 39h52" stroke-width="2"/>' +
			'<circle cx="31" cy="44" r="7.600" fill="#2a2e32"/><circle cx="49" cy="44" r="7.600" fill="#2a2e32"/>' +
			'<circle cx="31" cy="44" r="5" fill="#cfd6dc"/><circle cx="49" cy="44" r="5" fill="#cfd6dc"/>' +
			'<circle cx="40" cy="60" r="8.400" fill="#a3a9af"/><circle cx="40" cy="60" r="4.600" fill="#5b6066"/>' +
			'<g transform="rotate(-24 58 60)"><path d="M50 54h14v12H50z" fill="#a3a9af"/><path d="M53 54v12M57 54v12M61 54v12" stroke-width="1"/></g>' +
			'</g>' +
			'<path d="M24 22c5-5 12-7 20-6" stroke="#e6eaee" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M28.600 42c1-2 3-3 5-2.600M46.600 42c1-2 3-3 5-2.600" stroke="#fff" stroke-width="1.400" fill="none" stroke-linecap="round"/><path d="M40 55.400v9.200M35.400 60h9.200" stroke="#1e2124" stroke-width="1.100"/>'
	},

	// Prestige 4: a rider on a red-and-white snowmobile with packs on the back
	'charm-cliffhanger': {
		viewBox: STICKER,
		after: 'Dexerto’s screenshot of the Prestige 4 rewards',
		svg:
			HANG(38) +
			'<g transform="rotate(14 40 46)" stroke="#1e2124" stroke-width="1.400" stroke-linejoin="round">' +
			// track and ski
			'<path d="M10 54h34l4 5-4 5H12c-5 0-6-10-2-10z" fill="#34383c"/><path d="M14 59h28" stroke="#6b7076" stroke-width="2" stroke-dasharray="2 3"/>' +
			'<path d="M50 68h22l4-3" fill="none" stroke-width="2.400" stroke-linecap="round"/><path d="M60 58l2 10" stroke-width="2"/>' +
			// body: seat, red hood, white panel
			'<path d="M12 44h26l6 10H12z" fill="#4a4f55"/>' +
			'<path d="M38 44l14-4 16 12 2 8H46l-6-8z" fill="#b8382f"/><path d="M48 46l12 8H48z" fill="#f0ece4"/><path d="M52 40l4-8 3 1-2 9z" fill="#2a2e32"/>' +
			// packs
			'<path d="M8 34h14v10H8z" fill="#8a8f6a"/><path d="M10 28h10v6H10z" fill="#a39a6a"/><circle cx="13" cy="31" r="1.400" fill="#1e2124"/>' +
			// rider
			'<path d="M26 44l2-14 10-2 4 10-4 6z" fill="#c9ccd0"/><circle cx="34" cy="22" r="5.600" fill="#e6e8ea"/><path d="M31 21h7v3h-7z" fill="#2a2e32"/>' +
			'<path d="M38 32l12 2 4 4-2 2-14-2z" fill="#aeb2b6"/><path d="M30 44l8 2 2 8h-6z" fill="#8f949a"/>' +
			'</g>'
	},

	// Prestige 5: a silver Eiffel Tower with a dusty pink blast cloud behind its middle
	'charm-eiffel-down': {
		viewBox: STICKER,
		after: 'Dexerto’s screenshot of the Prestige 5 rewards',
		svg:
			HANG(40) +
			'<g fill="#e8b8a4" stroke="#b07e6c" stroke-width="1.200"><circle cx="50" cy="34" r="9"/><circle cx="58" cy="44" r="8"/><circle cx="30" cy="42" r="9"/><circle cx="24" cy="50" r="6"/><circle cx="46" cy="46" r="9"/><circle cx="36" cy="34" r="6"/></g>' +
			'<path d="M52 30c3-1 6 1 6 4M28 38c2-2 5-2 7 0" stroke="#f6dcd0" stroke-width="1.600" fill="none" stroke-linecap="round"/>' +
			'<g stroke="#3a3e44" stroke-width="1.300" stroke-linejoin="round" fill="#c4c8ce">' +
			'<path d="M38.600 12h2.800l1.600 20h-6z"/><path d="M36 32h8l3 14H33z"/><path d="M32 46h16l8 26h-8c0-8-3-12-8-12s-8 4-8 12h-8z"/>' +
			'<path d="M34 32h12v2.600H34zM30 46h20v3H30z" fill="#9a9ea6"/>' +
			'</g>' +
			'<path d="M37 36l6 8M43 36l-6 8M34 52l12 6M46 52l-12 6M39 16h2M38.600 22h2.800M38 27h4" stroke="#3a3e44" stroke-width=".9"/>'
	},

	// Prestige 6: a German shepherd sitting upright in a tactical harness, goggles pushed up on his head
	'charm-riley': {
		viewBox: STICKER,
		after: 'Dexerto’s screenshot of the Prestige 6 rewards',
		svg:
			HANG(40) +
			'<g stroke="#2a1e14" stroke-width="1.400" stroke-linejoin="round">' +
			'<path d="M52 66c8 0 12-4 12-9" fill="none" stroke="#3a2a1c" stroke-width="4" stroke-linecap="round"/>' +
			'<path d="M28 42c0-8 5-12 12-12s12 4 12 12l2 22c0 6-4 8-8 8H34c-4 0-8-2-8-8z" fill="#c9a06a"/>' +
			'<path d="M30 44c3 4 17 4 20 0l2 14c-6 4-18 4-24 0z" fill="#6b6a4a"/><path d="M34 48h12M33 54h14" stroke-width="1"/><path d="M38 46h4v10h-4z" fill="#8a8960"/>' +
			'<path d="M30 60l-2 12h8l1-10zM50 60l2 12h-8l-1-10z" fill="#d6b07a"/>' +
			'<path d="M30 14l-3-9 8 5zM50 14l3-9-8 5z" fill="#3a2a1c"/>' +
			'<path d="M28 22c0-7 5-11 12-11s12 4 12 11c0 5-3 9-6 11l-2 6h-8l-2-6c-3-2-6-6-6-11z" fill="#c9a06a"/>' +
			'<path d="M30 16c3-4 17-4 20 0l-2 5c-4-2-12-2-16 0z" fill="#3a2a1c"/>' +
			'<path d="M35 28c1-3 9-3 10 0l-1 9c-2 2-6 2-8 0z" fill="#3a2a1c"/>' +
			'</g>' +
			'<path d="M30 13h20" stroke="#1e2124" stroke-width="3.400" stroke-linecap="round"/><path d="M33 13h5M42 13h5" stroke="#7fb6e0" stroke-width="1.800" stroke-linecap="round"/>' +
			'<circle cx="34.600" cy="24" r="1.500" fill="#1e1410"/><circle cx="45.400" cy="24" r="1.500" fill="#1e1410"/><path d="M38.400 30h3.200l-1.600 2z" fill="#0e0a08"/><path d="M38 35q2 1.400 4 0" stroke="#e08a8a" stroke-width="1.600" fill="none" stroke-linecap="round"/>'
	},

	// Prestige 7: a little trooper in a navy and tan space-combat suit with a blue visor
	'charm-infinite': {
		viewBox: STICKER,
		after: 'Dexerto’s screenshot of the Prestige 7 rewards',
		svg:
			HANG(40) +
			'<g stroke="#14181e" stroke-width="1.400" stroke-linejoin="round">' +
			'<path d="M30 28l-9 16 5 3 8-11zM50 28l9 16-5 3-8-11z" fill="#2c3a55"/><path d="M19 43l7 4-1 4-7-3zM61 43l-7 4 1 4 7-3z" fill="#b89a6a"/>' +
			'<path d="M33 50l-3 20h8l2-16 2 16h8l-3-20z" fill="#2c3a55"/><path d="M29 68h10v5H29zM41 68h10v5H41z" fill="#b89a6a"/><path d="M31 56h7v6h-7zM42 56h7v6h-7z" fill="#b89a6a"/>' +
			'<path d="M30 28c2-3 18-3 20 0l1 22c-6 3-16 3-22 0z" fill="#33435f"/><path d="M33 31h14l-1 11H34z" fill="#b89a6a"/><path d="M30 47h20v4H30z" fill="#8a744e"/>' +
			'<path d="M32 18c0-6 4-9 8-9s8 3 8 9c0 5-3 8-8 8s-8-3-8-8z" fill="#2c3a55"/><path d="M34 17c1-3 11-3 12 0l-1 5c-3 2-7 2-10 0z" fill="#5fb0ea"/>' +
			'</g>' +
			'<path d="M36 17.600c1-1 3-1.400 5-1" stroke="#d6efff" stroke-width="1.300" fill="none" stroke-linecap="round"/><path d="M36 35h8M36 38h8" stroke="#8a744e" stroke-width="1.100"/>'
	},

	// Prestige 8: a milky jade pendant carved as a helmet with four night-vision tubes
	'charm-gone-dark': {
		viewBox: STICKER,
		after: 'Dexerto’s screenshot of the Prestige 8 rewards',
		svg:
			HANG(40) +
			'<g stroke="#3f8a4c" stroke-width="1.500" stroke-linejoin="round" fill="#9fdca4">' +
			'<path d="M14 40c0-16 11-26 26-26s26 10 26 26c0 6-2 10-4 12l-6 16c-6 6-26 6-32 0l-6-16c-2-2-4-6-4-12z"/>' +
			'<path d="M28 22h24l-4 6H32zM26 30h28l-3 5H29z" fill="#c4eec6"/><path d="M40 22v13" />' +
			'<path d="M16 44h48v6H16z" fill="#86cf8e"/>' +
			'<circle cx="23" cy="56" r="6.400"/><circle cx="35" cy="58" r="6.400"/><circle cx="47" cy="58" r="6.400"/><circle cx="59" cy="56" r="6.400"/>' +
			'</g>' +
			'<g fill="#5fb06c"><circle cx="23" cy="56" r="3"/><circle cx="35" cy="58" r="3"/><circle cx="47" cy="58" r="3"/><circle cx="59" cy="56" r="3"/></g>' +
			'<path d="M20 28c4-7 10-10 18-11" stroke="#e8fbe8" stroke-width="2.200" fill="none" stroke-linecap="round"/><path d="M21 54c1-1.600 2.600-2 4-1.600M33 56c1-1.600 2.600-2 4-1.600" stroke="#e8fbe8" stroke-width="1.200" fill="none" stroke-linecap="round"/>'
	},

	// Prestige 9: a polished steel skull with dark straps over the crown
	'charm-the-ghost': {
		viewBox: STICKER,
		after: 'Dexerto’s screenshot of the Prestige 9 rewards',
		svg:
			HANG(40) +
			'<g stroke="#1a1c1f" stroke-width="1.500" stroke-linejoin="round">' +
			'<path d="M16 38c0-16 10-25 24-25s24 9 24 25c0 8-3 13-7 16l-1 8-6 2-2 8H32l-2-8-6-2-1-8c-4-3-7-8-7-16z" fill="#b9bec4"/>' +
			'<path d="M29 14l3 16h-6l-4-12zM51 14l-3 16h6l4-12z" fill="#2a2d31"/>' +
			'<path d="M22 40c2-5 12-5 14 1 0 6-10 8-14 4zM58 40c-2-5-12-5-14 1 0 6 10 8 14 4z" fill="#15171a"/>' +
			'<path d="M37 54l3-8 3 8-3 3z" fill="#15171a"/>' +
			'<path d="M30 62h20v10H30z" fill="#d6dade"/>' +
			'</g>' +
			'<path d="M34 62v10M38 62v10M42 62v10M46 62v10M30 67h20" stroke="#1a1c1f" stroke-width="1.100"/>' +
			'<path d="M36 18c2-1 6-1 8 0M22 30c1-5 4-9 8-11" stroke="#eef1f4" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M24 50c2 3 4 4 7 5M56 50c-2 3-4 4-7 5" stroke="#7d838a" stroke-width="1.500" fill="none" stroke-linecap="round"/>'
	},

	// Prestige 10: a cup of instant noodles, cream-yellow with bold black Korean lettering, a red
	// chilli and a bowl of noodles printed on it
	'charm-meal-prep': {
		viewBox: STICKER,
		after: 'Dexerto’s screenshot of the Prestige 10 rewards',
		svg:
			HANG(40) +
			'<g stroke="#3a2c14" stroke-width="1.500" stroke-linejoin="round">' +
			'<path d="M18 18h44l-6 54H24z" fill="#f0d68a"/>' +
			'<path d="M15 14h50v6H15z" fill="#f6e6b0"/>' +
			'<path d="M25 52c6-6 24-6 30 0l-1.600 14H26.600z" fill="#3a2c14"/><path d="M28 54c5-4 19-4 24 0l-1 8H29z" fill="#e8b25a"/>' +
			'</g>' +
			'<path d="M31 57c3-2 5 2 8 0s5 2 8 0M31 60c3-2 5 2 8 0s5 2 8 0" stroke="#fbe9b6" stroke-width="1.300" fill="none" stroke-linecap="round"/><circle cx="46" cy="56" r="1.600" fill="#c63b2e"/><path d="M33 55l3 1" stroke="#4f8a3a" stroke-width="1.600" stroke-linecap="round"/>' +
			'<g font-family="\'Malgun Gothic\', \'Apple SD Gothic Neo\', \'Noto Sans KR\', sans-serif" font-weight="900" fill="#1e1608"><text x="24" y="30" font-size="6.400" textLength="26" lengthAdjust="spacingAndGlyphs">극한의 매운맛</text><text x="24" y="46" font-size="15" textLength="27" lengthAdjust="spacingAndGlyphs">매운!</text></g>' +
			'<path d="M53 30c3 4 3 10-1 15-1-5-2-10 1-15z" fill="#c63b2e" stroke="#7a1f18" stroke-width=".9"/><path d="M53 30l1.600-3" stroke="#4f8a3a" stroke-width="1.600" stroke-linecap="round"/>'
	},

	// Prestige Master level 70: a red star-burst medal with a gold rim and a round red gem
	'charm-pinnacle': {
		viewBox: STICKER,
		after: 'Activision’s Prestige Master reward picture',
		svg:
			HANG(40) +
			'<g transform="translate(40 46)">' +
			'<g fill="#e3b53c" stroke="#7a5a12" stroke-width="1.300" stroke-linejoin="round">' + STAR(0, 0, 27, 0) + STAR(0, 0, 27, 36) + '</g>' +
			'<g fill="#c22e2a" stroke="#6e1512" stroke-width="1" stroke-linejoin="round">' + STAR(0, 0, 21, 0) + STAR(0, 0, 21, 36) + '</g>' +
			'<circle r="11" fill="#e3b53c" stroke="#7a5a12" stroke-width="1.300"/><circle r="7.600" fill="#d8322c" stroke="#6e1512" stroke-width="1.100"/>' +
			'<path d="M-4-3c1.600-2.600 5-3 7-1" stroke="#ffb4a8" stroke-width="1.700" fill="none" stroke-linecap="round"/>' +
			'</g>'
	},

	// Prestige Master level 1,000: a pale lilac demon mask with tall ivory horns, a carved gold brow,
	// glowing red eyes and long tusks curling outwards
	'charm-prestige-master-1000': {
		viewBox: STICKER,
		after: 'Dexerto’s screenshot of the Prestige Master rewards',
		svg:
			HANG(40) +
			'<g stroke="#2a2433" stroke-width="1.400" stroke-linejoin="round">' +
			'<path d="M24 30c-9-5-12-12-10-20 3 7 8 10 16 12zM56 30c9-5 12-12 10-20-3 7-8 10-16 12z" fill="#e8e2d0"/>' +
			'<path d="M26 26c2-8 8-12 14-12s12 4 14 12c-4-2-9-3-14-3s-10 1-14 3z" fill="#c9a04e"/>' +
			'<path d="M22 34c2-7 10-10 18-10s16 3 18 10c1 8-1 16-5 22l-5 12c-3 4-13 4-16 0l-5-12c-4-6-6-14-5-22z" fill="#a79bc0"/>' +
			'<path d="M25 37c4-4 9-4 13 0-2 4-9 5-13 0zM55 37c-4-4-9-4-13 0 2 4 9 5 13 0z" fill="#2a1418"/>' +
			'<path d="M36 44c1-3 7-3 8 0l1 5c-3 2-7 2-10 0z" fill="#8a7ea6"/>' +
			'<path d="M28 54c4-3 20-3 24 0l-2 9c-4 3-16 3-20 0z" fill="#3a1418"/>' +
			'<path d="M27 52c-8 2-14 0-17-6-1 9 6 16 17 13zM53 52c8 2 14 0 17-6 1 9-6 16-17 13z" fill="#e8e2d0"/>' +
			'</g>' +
			'<circle cx="31.600" cy="38" r="2.200" fill="#ff5a3c"/><circle cx="48.400" cy="38" r="2.200" fill="#ff5a3c"/>' +
			'<path d="M31 54.600l2 5 2.400-5 2.400 5 2.200-5 2.200 5 2.400-5 2.400 5 2-5" fill="#f2ecdc" stroke="#2a2433" stroke-width=".8" stroke-linejoin="round"/>' +
			'<path d="M30 20c3-3 6-4 10-4s7 1 10 4M34 18.600q6 3 12 0" stroke="#7a5a1e" stroke-width="1.100" fill="none"/><path d="M24 34c4-5 10-6 15-3M56 34c-4-5-10-6-15-3" stroke="#2a2433" stroke-width="2.200" fill="none" stroke-linecap="round"/>' +
			'<path d="M30 68c3 5 17 5 20 0M34 72q6 3 12 0" stroke="#6f6490" stroke-width="1.300" fill="none" stroke-linecap="round"/>'
	},

	// Battle Pass tier 93: a bronze falcon, wings spread, on a blue-green ring of thorns with a spear
	// point hanging below
	'charm-falcon-thorn': {
		viewBox: STICKER,
		after: 'Activision’s Season 1 Battle Pass picture',
		svg:
			HANG(40) +
			'<g fill="none" stroke="#2f8f86" stroke-width="3.200"><circle cx="40" cy="50" r="18"/></g>' +
			'<g stroke="#1f6a62" stroke-width="1.600" stroke-linecap="round"><path d="M22 46l-5-3M24 60l-5 3M34 67l-2 6M46 67l2 6M56 60l5 3M58 46l5-3M28 36l-3-5M52 36l3-5"/></g>' +
			'<path d="M40 44v30l-4-6M40 74l4-6" stroke="#8a8f96" stroke-width="2.200" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
			'<g stroke="#4a3210" stroke-width="1.300" stroke-linejoin="round" fill="#b8843a">' +
			'<path d="M36 34C28 24 16 22 6 26c6 2 8 5 9 9 4-1 7 0 9 3 3-2 7-2 10 1zM44 34c8-10 20-12 30-8-6 2-8 5-9 9-4-1-7 0-9 3-3-2-7-2-10 1z"/>' +
			'<path d="M34 34c0-6 3-10 6-10s6 4 6 10l-2 14c-2 3-6 3-8 0z"/>' +
			'<path d="M36 22c0-4 2-6 4-6s5 2 5 5l4 2-5 2c-1 2-3 3-5 2s-3-3-3-5z" fill="#d6a04e"/>' +
			'<path d="M36 48l-3 8M40 49v8M44 48l3 8" fill="none"/>' +
			'</g>' +
			'<circle cx="41" cy="20.600" r="1" fill="#1a1206"/><path d="M12 28l8 4M68 28l-8 4M20 30l6 5M60 30l-6 5" stroke="#4a3210" stroke-width="1" stroke-linecap="round"/>'
	},

	// Wager Match event: a pale bronze coin with a ridged rim and a coiled snake
	'charm-writhing-coin': {
		viewBox: STICKER,
		after: 'Detonated’s picture of the Wager Match reward board',
		svg:
			HANG(40) +
			'<circle cx="40" cy="47" r="27" fill="#cdbb94" stroke="#5e5234" stroke-width="1.600"/>' +
			'<circle cx="40" cy="47" r="23" fill="none" stroke="#8a7a52" stroke-width="1.200" stroke-dasharray="1.600 2"/>' +
			'<circle cx="40" cy="47" r="20" fill="#bfae86" stroke="#5e5234" stroke-width="1.100"/>' +
			'<path d="M46 34c-8-4-18 1-18 9 0 9 18 6 18 13 0 4-6 6-11 3" fill="none" stroke="#5e5234" stroke-width="6.400" stroke-linecap="round"/>' +
			'<path d="M46 34c-8-4-18 1-18 9 0 9 18 6 18 13 0 4-6 6-11 3" fill="none" stroke="#e6d8b4" stroke-width="3.800" stroke-linecap="round"/>' +
			'<path d="M44 31c4-1 8 1 9 4-2 3-7 3-10 0z" fill="#e6d8b4" stroke="#5e5234" stroke-width="1.300" stroke-linejoin="round"/><circle cx="48.600" cy="33.600" r=".9" fill="#5e5234"/><path d="M53 35l4 1M53 35l3 3" stroke="#8f2f3a" stroke-width="1.100" stroke-linecap="round"/>' +
			'<path d="M33 40l2 2M36 49l3 1M44 53l1 3M40 59l-2 2" stroke="#8a7a52" stroke-width="1.100" stroke-linecap="round"/>' +
			'<path d="M22 36c3-6 8-10 14-11" stroke="#efe6cc" stroke-width="1.800" fill="none" stroke-linecap="round"/>'
	}
};

export function cosmeticArt(id: string): CosmeticArt | undefined {
	return COSMETIC_ART[id];
}
