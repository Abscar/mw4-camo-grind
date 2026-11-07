<svelte:options namespace="svg" />

<!--
	The CS2 easter-egg guns (see `Cs2Look` in weaponLooks.ts): a CS2 gun's side view in the same
	cartoon style as WeaponIcon (viewBox 0 0 64 24, muzzle right), wearing the user's chosen skin.
	Shapes are drawn from the CS2 item pictures (csgoskins.gg), mirrored so the muzzle points right.
	Painted parts are filled with <pattern>s drawn in icon coordinates, so a skin's design lines up
	across parts. Rendered inside WeaponIcon's <svg>.
-->
<script lang="ts">
	import type { Cs2Model, Skin } from '#lib/data/weaponLooks.ts';

	let { model, skin }: { model: Cs2Model; skin: Skin } = $props();

	const INK = '#14110d';
	const DARK = '#23262b';
	const STEEL = '#3a3f46';
	const HI = { stroke: '#fff', 'stroke-opacity': 0.4, 'stroke-width': 0.8 }; // cartoon highlight
	const GROOVE = { stroke: INK, 'stroke-opacity': 0.55, 'stroke-width': 0.45 }; // serrations, ribs

	type Part =
		| 'stock'
		| 'tube'
		| 'body'
		| 'lower'
		| 'frame'
		| 'guard'
		| 'grip'
		| 'mag'
		| 'barrel'
		| 'muzzle'
		| 'can'
		| 'fore'
		| 'cylinder'
		| 'sights'
		| 'blade'
		| 'handle'
		| 'ring';
	const PLAIN: Record<Part, string> = {
		stock: DARK,
		tube: STEEL,
		body: DARK,
		lower: DARK,
		frame: DARK,
		guard: DARK,
		grip: DARK,
		mag: DARK,
		barrel: STEEL,
		muzzle: DARK,
		can: DARK,
		fore: DARK,
		cylinder: STEEL,
		sights: DARK,
		blade: '#c9ced4',
		handle: '#3a3d42',
		ring: '#b9bfc6'
	};
	// which part gets which paint: a pattern below, or a plain '#colour'
	const SKIN_PARTS: Record<Skin, Partial<Record<Part, string>>> = {
		'fire-serpent': { stock: 'wood', guard: 'wood', grip: 'wood', body: 'serpent', mag: 'swirl' },
		asiimov: { stock: 'asiimov', tube: 'asiimov', body: 'asiimov', lower: 'asiimov', guard: 'asiimov', mag: 'asiimov', sights: '#dfe3e6', muzzle: '#8b9199' },
		blaze: { body: 'blaze', frame: 'blaze', cylinder: '#1c1d21', grip: '#8a8e94' },
		printstream: { body: 'printstream', can: 'printstream', frame: '#a9afb6', grip: '#4c5057' },
		bloodsport: { body: 'bloodsport', stock: 'bloodsport', grip: 'bloodsport', fore: 'bloodsport', sights: '#e2b23a', muzzle: '#b8552e' },
		'frost-borre': { body: 'frost', barrel: 'frost', mag: 'frost', fore: '#6f757c', stock: '#6f757c', grip: '#c3c7cb' },
		fade: { blade: 'fade' },
		'lightning-strike': { stock: 'lightning', mag: '#8d9399' }
	};
	const uid = $props.id(); // pattern ids must be unique per icon (the same gun can be on screen twice)
	const P = $derived.by(() => {
		const out = { ...PLAIN };
		for (const [part, p] of Object.entries(SKIN_PARTS[skin]) as [Part, string][]) {
			out[part] = p.startsWith('#') ? p : `url(#${uid}-${p})`;
		}
		// the Desert Eagle keeps a black grip under Blaze (only the R8 has the grey rubber one)
		if (skin === 'blaze' && model !== 'r8') out.grip = DARK;
		return out;
	});

	// Blaze: a hot-rod flame job, solid amber at the muzzle with tongues licking back.
	// Drawn with the muzzle end at x 0 and about 10 units tall, then placed on each gun.
	const FLAME_RED =
		'M0 -1 L0 11 L-7 11 C-10 10.8 -13 10 -17 10.3 C-14 8.9 -11.5 8.4 -9.5 8.1 C-14 7.6 -19 7.8 -24 8.5 C-20 6.6 -15.5 5.7 -11.5 5.6 C-15 4.7 -19 4.5 -23 4.7 C-18.5 2.8 -14 2.3 -10 2.7 C-12.5 1.3 -15.5 0.6 -19 0.5 C-12.5 -0.7 -6 -1 0 -1 Z';
	const FLAME_ORANGE =
		'M0 -0.4 L0 10.4 L-5 10.4 C-7.5 10.1 -10 9.6 -12.5 9.5 C-10 8.6 -7.8 8.2 -5.8 8 C-8.8 7.5 -12 7.5 -15.5 7.9 C-12.6 6.3 -9.6 5.6 -6.6 5.5 C-9 4.8 -11.6 4.6 -14.4 4.7 C-11.4 3.1 -8.2 2.7 -5 3 C-6.8 1.8 -9.2 1.2 -11.6 1.1 C-7.4 0 -3.6 -0.4 0 -0.4 Z';
	const FLAME_YELLOW =
		'M0 -0.4 L0 10.4 L-2.6 10.4 C-3.8 9.2 -2.6 8.2 -4.4 7 C-3.2 6 -4 4.8 -2.8 3.8 C-4 2.6 -3.4 1.2 -2.4 -0.4 Z';
	const flameAt = $derived(model === 'r8' ? 'translate(54 5.4) scale(1.2 0.62)' : 'translate(53.2 3.6) scale(1.15 0.86)');
</script>

<defs>
	{#if skin === 'fire-serpent'}
		<!-- red-brown wood with dark wavy grain -->
		<pattern id="{uid}-wood" patternUnits="userSpaceOnUse" width="9" height="2.8">
			<rect width="9" height="2.8" fill="#9a4127" />
			<path d="M0 1.4 Q2.2 0.5 4.5 1.4 T9 1.4" fill="none" stroke="#5b1f12" stroke-width="0.5" />
			<path d="M0 2.5 Q2.2 2 4.5 2.5 T9 2.5" fill="none" stroke="#b9603a" stroke-width="0.3" />
		</pattern>
		<!-- dark teal with pale curls (magazine) -->
		<pattern id="{uid}-swirl" patternUnits="userSpaceOnUse" width="4" height="4">
			<rect width="4" height="4" fill="#1e4644" />
			<path d="M0.6 3.2 C0.4 1.2 3 1 3 2.4 C3 3.2 1.9 3.3 1.8 2.6" fill="none" stroke="#69b3a6" stroke-width="0.4" />
		</pattern>
		<!-- the green feathered serpent on the receiver: scales, a gold body, its head and jaws at the front -->
		<pattern id="{uid}-serpent" patternUnits="userSpaceOnUse" width="64" height="24">
			<rect width="64" height="24" fill="#2e9b55" />
			<path
				d="M17 13 a1.2 1.2 0 0 1 2.4 0 a1.2 1.2 0 0 1 2.4 0 a1.2 1.2 0 0 1 2.4 0 a1.2 1.2 0 0 1 2.4 0 a1.2 1.2 0 0 1 2.4 0 a1.2 1.2 0 0 1 2.4 0"
				fill="none"
				stroke="#17663a"
				stroke-width="0.45"
			/>
			<path d="M17 11.4 C20 8.6 22.6 13 25.6 10.6 S29.6 8.8 31.4 10.2" fill="none" stroke={INK} stroke-width="2" />
			<path d="M17 11.4 C20 8.6 22.6 13 25.6 10.6 S29.6 8.8 31.4 10.2" fill="none" stroke="#f3c838" stroke-width="1.2" />
			<path d="M24.6 8 L25.6 9.4 L26.4 8 L27.4 9.6 L28.4 8 L28.8 9.8 Z" fill="#e2452a" />
			<path d="M30.6 8.4 L35.6 8.4 L35.6 13.6 L31.6 12.8 Q29.6 11.2 30.6 8.4 Z" fill="#23854a" />
			<path d="M32.4 10.6 L35.6 9.4 L35.6 12.8 Z" fill="#d8352a" />
			<path d="M33 10.4 l0.5 0.9 l0.5 -1.1 l0.5 0.9 l0.5 -1.1 M33.2 12.1 l0.5 -0.7 l0.5 0.8 l0.5 -0.8 l0.5 0.8" fill="none" stroke="#fff" stroke-width="0.35" />
			<circle cx="31.9" cy="9.6" r="0.55" fill="#ffd84a" />
		</pattern>
	{:else if skin === 'asiimov'}
		<!-- white with black blocks and orange ends -->
		<pattern id="{uid}-asiimov" patternUnits="userSpaceOnUse" width="64" height="24">
			<rect width="64" height="24" fill="#eef1f2" />
			<path d="M0 0 H7 L6.2 24 H0 Z" fill="#ff6c14" />
			<path d="M7 0 H8.4 L7.6 24 H6.2 Z" fill="#1a1b1e" />
			<path d="M9.4 17.4 L13.8 12.4 L13.8 15.4 Z" fill="#1a1b1e" />
			<path d="M25.6 14.8 L34.4 14.8 L34.4 11 Z" fill="#1a1b1e" />
			<rect x="30.4" y="7" width="1.4" height="4.2" fill="#ff6c14" />
			<rect x="37.2" y="7" width="2.2" height="6" fill="#ff6c14" />
			<rect x="43.6" y="7" width="3.4" height="6" fill="#1a1b1e" />
			<path d="M29.6 17.2 L33.6 16.4 L33.7 17.6 L29.8 18.4 Z" fill="#1a1b1e" />
			<rect x="28" y="19.6" width="8" height="4" fill="#ff6c14" />
		</pattern>
	{:else if skin === 'blaze'}
		<!-- black with hot-rod flames from the muzzle end -->
		<pattern id="{uid}-blaze" patternUnits="userSpaceOnUse" width="64" height="24">
			<rect width="64" height="24" fill="#18191c" />
			<g transform={flameAt}>
				<path d={FLAME_RED} fill="#cf341b" />
				<path d={FLAME_ORANGE} fill="#f39419" />
				<path d={FLAME_YELLOW} fill="#ffc53a" />
			</g>
		</pattern>
	{:else if skin === 'printstream'}
		<!-- pearl-white slide and suppressor with black print -->
		<linearGradient id="{uid}-pearl" gradientUnits="userSpaceOnUse" x1="13" y1="5" x2="61" y2="10.6">
			<stop offset="0" stop-color="#fbf4fb" />
			<stop offset="0.35" stop-color="#e9f6f5" />
			<stop offset="0.65" stop-color="#f8f1e4" />
			<stop offset="1" stop-color="#fdfdfd" />
		</linearGradient>
		<pattern id="{uid}-printstream" patternUnits="userSpaceOnUse" width="64" height="24">
			<rect width="64" height="24" fill="url(#{uid}-pearl)" />
			<path d="M21.4 6.2 l1.6 2 M23 6.2 l-1.6 2 M23.8 6.2 l1.6 2 M25.4 6.2 l-1.6 2" stroke="#16171a" stroke-width="0.6" />
			<path d="M19.4 6.6 a0.45 0.45 0 0 1 0.8 0 a0.45 0.45 0 0 1 0.8 0 l-0.8 1 Z" fill="#16171a" />
			<path d="M26.6 6.4 v1.6 M27.3 6.4 v1.6 M27.8 6.4 v1.6 M28.6 6.4 v1.6 M29.1 6.4 v1.6" stroke="#16171a" stroke-width="0.35" />
			<rect x="30.8" y="6.5" width="1.3" height="1.3" fill="#16171a" />
			<path d="M14 9.4 H34.4" stroke="#16171a" stroke-width="0.55" />
			<path d="M39.6 5.4 V10.6" stroke="#16171a" stroke-width="0.4" />
			<path d="M57 7.2 l-0.8 0.8 l0.8 0.8" fill="none" stroke="#16171a" stroke-width="0.35" />
		</pattern>
	{:else if skin === 'bloodsport'}
		<!-- black with a red panel and white lettering, red/white stock and foregrip, gold bands on the grip -->
		<pattern id="{uid}-bloodsport" patternUnits="userSpaceOnUse" width="64" height="24">
			<rect width="64" height="24" fill="#1a1a1d" />
			<rect x="9" y="7" width="5.4" height="9.4" fill="#d3262b" />
			<rect x="9" y="16.4" width="5.4" height="3.4" fill="#f4f1ea" />
			<path d="M13.6 7 L30.4 7 L27.4 14.6 L13.6 14.6 Z" fill="#d3262b" />
			<path d="M15.6 11.2 l1 -2.2 l1 2.2 M18.4 9 v2.2 h1.4 M21 9 h2 l-2 2.2 h2 M24.2 11.2 v-2.2 l1.2 1.1 l1.2 -1.1 v2.2" fill="none" stroke="#f4f1ea" stroke-width="0.4" />
			<path d="M15.6 12.6 h7" stroke="#f4f1ea" stroke-width="0.3" />
			<circle cx="35.4" cy="10.4" r="1.4" fill="#d3262b" stroke="#f4f1ea" stroke-width="0.35" />
			<rect x="36.4" y="13.4" width="4.6" height="6.2" fill="#d3262b" />
			<rect x="36.4" y="19.6" width="4.6" height="2.6" fill="#f4f1ea" />
			<path d="M21.6 16.4 H27.2 M21.2 18 H26.8 M20.8 19.6 H26.4" stroke="#e2b23a" stroke-width="0.6" />
		</pattern>
	{:else if skin === 'frost-borre'}
		<!-- navy steel with a silver Norse ring chain -->
		<pattern id="{uid}-frost" patternUnits="userSpaceOnUse" width="3.6" height="2.8">
			<rect width="3.6" height="2.8" fill="#24344f" />
			<path d="M0 1.4 C0.9 0 2.7 0 3.6 1.4 C2.7 2.8 0.9 2.8 0 1.4 Z" fill="none" stroke="#a9c8e6" stroke-width="0.35" />
			<circle cx="1.8" cy="1.4" r="0.35" fill="#a9c8e6" />
		</pattern>
	{:else if skin === 'fade'}
		<!-- gold at the base, hot pink in the middle, purple to blue at the tip -->
		<linearGradient id="{uid}-fade" gradientUnits="userSpaceOnUse" x1="36" y1="10" x2="58" y2="19">
			<stop offset="0" stop-color="#f7b733" />
			<stop offset="0.2" stop-color="#ff5d8f" />
			<stop offset="0.5" stop-color="#ff3fb0" />
			<stop offset="0.78" stop-color="#b25cff" />
			<stop offset="1" stop-color="#7a7dff" />
		</linearGradient>
	{:else if skin === 'lightning-strike'}
		<!-- glossy violet with pale lightning bolts crackling along the stock -->
		<linearGradient id="{uid}-violet" gradientUnits="userSpaceOnUse" x1="0" y1="8" x2="0" y2="21">
			<stop offset="0" stop-color="#9d45f2" />
			<stop offset="0.4" stop-color="#7a22d2" />
			<stop offset="1" stop-color="#4c1186" />
		</linearGradient>
		<pattern id="{uid}-lightning" patternUnits="userSpaceOnUse" width="64" height="24">
			<rect width="64" height="24" fill="url(#{uid}-violet)" />
			<path d="M0 10.4 H64" stroke="#b77bff" stroke-opacity="0.6" stroke-width="0.6" />
			<g fill="none" stroke-linejoin="round" stroke-linecap="round">
				<path
					d="M40 11.4 L36 10.6 L33.6 12 L29 10.8 L26.4 12.2 L22.6 11 L18.4 12.6 L13.6 11.4 L9.6 13.4 L5.2 12 M33.6 12 L32 14 M22.6 11 L20.6 9.8 M13.6 11.4 L12.4 9.4 M9.6 13.4 L8.4 16.2 L5.6 17"
					stroke="#c79bff"
					stroke-width="1.1"
					stroke-opacity="0.7"
				/>
				<path
					d="M40 11.4 L36 10.6 L33.6 12 L29 10.8 L26.4 12.2 L22.6 11 L18.4 12.6 L13.6 11.4 L9.6 13.4 L5.2 12 M33.6 12 L32 14 M22.6 11 L20.6 9.8 M13.6 11.4 L12.4 9.4 M9.6 13.4 L8.4 16.2 L5.6 17"
					stroke="#f3eaff"
					stroke-width="0.4"
				/>
			</g>
		</pattern>
	{/if}
</defs>

<!-- a trigger guard: a thick ring with an outline (drawn as an outline stroke with the fill colour inside) -->
{#snippet guardRing(d: string, fill: string)}
	<path {d} fill="none" stroke={INK} stroke-width="2" />
	<path {d} fill="none" stroke={fill} stroke-width="0.6" />
{/snippet}

<g stroke={INK} stroke-width="0.8" stroke-linejoin="round" stroke-linecap="round">
	{#if model === 'ak47'}
		<!-- AK-47: dropped wooden stock, wooden grip and handguards, gas tube, hooded front sight, slant brake, banana mag -->
		<path d="M17.4 9 L4 10.2 Q2.6 10.4 2.6 11.8 L2.8 16.8 Q2.9 17.8 4 17.6 L9.6 16.2 L17.4 13.4 Z" fill={P.stock} />
		<path d="M3.6 10.6 L3.8 17.2" stroke-width="0.6" />
		<path d="M21.2 13.4 L19.2 20.8 Q19 21.8 20 21.8 L22.4 21.8 Q23 21.8 23.2 21.2 L24.8 13.4 Z" fill={P.grip} />
		<rect x="44.4" y="8.4" width="6" height="1.4" fill={STEEL} />
		<rect x="46.4" y="10.3" width="13" height="1.4" fill={P.barrel} />
		<path d="M46.6 12.4 H53.4" stroke-width="0.6" />
		<rect x="49.6" y="8" width="1.8" height="3.8" rx="0.3" fill={DARK} />
		<path d="M52.8 11.8 L53.4 9 L53.8 6 L55.4 6 L55.8 9 L56.4 11.8 Z" fill={DARK} />
		<path d="M54 6 V5.2 M55.2 6 V5.2" stroke-width="0.6" />
		<path d="M59.2 9.8 L61.6 9.8 L62.4 12.2 L59.2 12.2 Z" fill={DARK} />
		<path d="M17 8.6 Q17 8 17.6 8 L33.6 8 L35.4 8.8 L35.4 13.6 L17 13.6 Z" fill={P.body} />
		<path d="M33 8 L33.6 6.6 L36.4 7.2 L36.4 8.6 Z" fill={DARK} />
		<rect x="35.4" y="7.8" width="9.4" height="2.4" rx="1.1" fill={P.guard} />
		<path d="M35.4 10.2 L46.2 10.2 Q47 10.2 46.9 11 L46.6 13 Q46.4 13.8 45.6 13.8 L35.4 13.8 Z" fill={P.guard} />
		<path d="M24.8 13.6 Q25 16.6 28 16.6 L29.2 16.6 L29.4 13.6" fill="none" stroke-width="0.9" />
		<path d="M26.6 13.6 Q27 15 26.4 15.8" fill="none" stroke-width="0.6" />
		<path d="M29.8 13.6 C29.8 17.4 31.2 20.6 33.8 22.8 L37.4 20.8 C35.2 18.8 34 16.4 34 13.6 Z" fill={P.mag} />
		<line x1="18.4" y1="8.9" x2="32.8" y2="8.9" {...HI} />
		<line x1="36.6" y1="8.6" x2="43.6" y2="8.6" {...HI} />
	{:else if model === 'm4a4'}
		<!-- M4A4: block stock on a buffer tube, flat top with a small rear sight, round handguard, A-frame front sight, birdcage -->
		<rect x="12.4" y="8.8" width="5.8" height="2.4" fill={P.tube} />
		<path d="M14 8.4 L5.4 8.4 Q4.2 8.4 4.2 9.6 L4.2 16.8 Q4.2 17.6 5.2 17.4 L7.2 17 L9.4 13 L14 12 Z" fill={P.stock} />
		<path d="M5.4 8.8 V17" stroke-width="0.5" />
		<path d="M21.6 14.2 L19.8 21 Q19.6 21.8 20.6 21.8 L22.8 21.8 Q23.4 21.8 23.6 21.2 L25.2 14.2 Z" fill={DARK} />
		<rect x="46" y="9.2" width="11" height="1.3" fill={P.barrel} />
		<path d="M46.2 11 L47.6 7 L48 4.2 L49.6 4.2 L49.8 7 L51.2 11 Z" fill={P.sights} />
		<path d="M48.4 10.2 L48.9 7.8 L49.4 10.2 Z" fill={INK} stroke="none" />
		<rect x="56.8" y="8.5" width="3.9" height="2.7" rx="0.4" fill={P.muzzle} />
		<path d="M58 9 V10.7 M59.3 9 V10.7" stroke-width="0.4" />
		<path d="M17.8 11 L34.4 11 L34.2 14.4 L33.6 14.9 L28.8 14.9 L28.4 14.4 L23.4 14.4 L20 13.6 Z" fill={P.lower} />
		<path d="M17.6 7.4 L34.6 7.4 L34.6 11.2 L17.6 11.2 Z" fill={P.body} />
		<rect x="16.4" y="7.6" width="1.4" height="1.4" rx="0.3" fill={DARK} />
		<path d="M19.8 7.4 L20.2 5.4 L22.6 5.4 L23 7.4 Z" fill={DARK} />
		<rect x="25" y="9" width="4" height="1.1" rx="0.3" fill={DARK} stroke-width="0.4" />
		<circle cx="31.8" cy="9.6" r="0.7" fill={DARK} stroke-width="0.5" />
		<rect x="34.4" y="7" width="1.4" height="5" rx="0.3" fill={DARK} />
		<rect x="35.6" y="7.4" width="11" height="4.6" rx="1.4" fill={P.guard} />
		{#each [39.8, 41.4, 43] as x (x)}
			<line x1={x} y1="8.4" x2={x} y2="11" {...GROOVE} />
		{/each}
		<path d="M25.2 14.4 Q25.2 16.4 27 16.4 L28.8 16.4 L28.8 15" fill="none" stroke-width="0.9" />
		<path d="M29 14.8 C29.2 17.6 29.6 20 30.4 22.2 L34.2 21.8 C33.6 19.6 33.4 17.4 33.6 14.8 Z" fill={P.mag} />
		<line x1="19.6" y1="8.3" x2="33.8" y2="8.3" {...HI} />
		<line x1="37" y1="8.3" x2="45.4" y2="8.3" {...HI} />
	{:else if model === 'deagle'}
		<!-- Desert Eagle: long slab slide and barrel, frame running under the barrel, hammer, beavertail, big raked grip -->
		<path d="M13.6 6 L11.2 3.6 Q10.8 3.2 10.4 3.6 L10.2 4.2 L12.6 7.6 Z" fill={DARK} />
		<path
			d="M14.6 10.4 L11.6 11.2 Q10.8 11.6 11.4 12.2 L12.8 13 L10.6 22.2 Q10.4 23.2 11.4 23.2 L18.4 23.2 Q19.2 23.2 19.4 22.4 L21.8 13.2 L22.2 12.6 Z"
			fill={P.grip}
		/>
		<path d="M13.8 14.2 L12.2 21.6 M19.6 14.2 L17.8 21.6" stroke-width="0.45" stroke-opacity="0.7" />
		<rect x="10.6" y="22.6" width="8.8" height="1" rx="0.3" fill={DARK} />
		{@render guardRing('M22 13 Q22 18 25.4 18 L30 18 L30.6 16.8 L29.8 12.8', DARK)}
		<path d="M25.4 12.8 Q26.4 14.8 25.6 16.2" fill="none" stroke-width="0.8" />
		<path d="M13.8 10.4 L50.6 10.4 Q51.4 10.4 51.2 11 L50.6 12.4 Q50.4 12.9 49.8 12.9 L13.8 12.9 Z" fill={P.frame} />
		{#each [37, 39.4, 41.8, 44.2, 46.6] as x (x)}
			<rect x={x} y="11.1" width="1.3" height="1" rx="0.2" fill={INK} stroke="none" />
		{/each}
		<path d="M13.4 4.8 Q13.4 4 14.2 4 L52.4 4 Q53.2 4 53.2 4.8 L53.2 9.8 Q53.2 10.4 52.6 10.4 L13.8 10.4 Q13.4 10.4 13.4 10 Z" fill={P.body} />
		<path d="M32 4.2 V10.2" stroke-width="0.5" />
		<path d="M32.4 8.4 H52.8" stroke="#000" stroke-opacity="0.35" stroke-width="0.5" />
		{#each [15.8, 17, 18.2, 19.4, 20.6] as x (x)}
			<line x1={x} y1="5.2" x2={x} y2="9.2" {...GROOVE} />
		{/each}
		<rect x="14.4" y="3.1" width="2" height="0.9" fill={DARK} stroke-width="0.5" />
		<rect x="50" y="3.1" width="1.8" height="0.9" fill={DARK} stroke-width="0.5" />
		<line x1="15" y1="5" x2="51.6" y2="5" {...HI} />
	{:else if model === 'usps'}
		<!-- USP-S: slide with a bevelled nose, hammer, silver frame, squared trigger guard, long screwed-on suppressor -->
		<path d="M13.6 6.6 L11.8 4.8 Q11.4 4.4 11 4.9 L11 5.4 L12.8 7.8 Z" fill={DARK} />
		<path
			d="M14.6 10.4 L12.2 11 Q11.6 11.3 12 11.8 L13.4 12.6 L11.6 22.2 Q11.4 23 12.4 23 L18.6 23 Q19.4 23 19.6 22.2 L21.8 13.2 L22 12.4 Z"
			fill={P.grip}
		/>
		{#each [14.8, 16.4, 18, 19.6] as y (y)}
			<line x1={21.6 - (y - 13) * 0.24} y1={y} x2={20.2 - (y - 13) * 0.24} y2={y} {...GROOVE} />
		{/each}
		<rect x="11.6" y="22.4" width="8.4" height="1" rx="0.3" fill={DARK} />
		{@render guardRing('M21.8 13 Q21.8 17.4 25 17.4 L28.8 17.4 Q29.6 17.4 29.6 16.6 L29.4 12.8', P.frame)}
		<path d="M25 12.8 Q25.8 14.8 25 15.8" fill="none" stroke-width="0.8" />
		<path d="M14 10.4 L34.4 10.4 L34.4 12.4 Q34.4 13 33.8 13 L14 13 Z" fill={P.frame} />
		<path d="M30.4 12.2 H33.6" stroke-width="0.4" />
		<rect x="35" y="6.4" width="2.6" height="3.6" rx="0.4" fill={P.can} />
		<rect x="37.2" y="5.4" width="24" height="5.2" rx="1.8" fill={P.can} />
		<path d="M59.4 5.8 V10.2" stroke-width="0.45" />
		<path d="M13.2 5.8 Q13.2 5 14 5 L34.4 5 Q35.2 5 35.2 5.8 L35.2 9.2 L34.2 10.6 L13.6 10.6 Q13.2 10.6 13.2 10.2 Z" fill={P.body} />
		{#each [15.2, 16.2, 17.2] as x (x)}
			<line x1={x} y1="6" x2={x} y2="9.4" {...GROOVE} />
		{/each}
		<rect x="14" y="4.1" width="1.8" height="0.9" fill={DARK} stroke-width="0.5" />
		<rect x="32.8" y="4.2" width="1.1" height="0.8" fill={DARK} stroke-width="0.5" />
		<line x1="18.6" y1="5.9" x2="34.2" y2="5.9" {...HI} />
		<line x1="39" y1="6.4" x2="59.8" y2="6.4" {...HI} />
	{:else if model === 'mp7'}
		<!-- MP7: retracted stock pad, top rail with flip-up sights, stubby barrel and flash hider, folding foregrip, magazine in the grip -->
		<path d="M14 7 L11 7 Q9.8 7 9.8 8.2 L9.8 18.8 Q9.8 19.8 10.8 19.8 L12.4 19.8 Q13.2 19.8 13.2 19 L13.2 11 L14 10 Z" fill={P.stock} />
		<rect x="44.4" y="9.6" width="4.8" height="1.6" fill={P.barrel} />
		<rect x="48.8" y="9" width="3.4" height="2.8" rx="0.5" fill={P.muzzle} />
		<path d="M50 9.4 V11.4 M51.1 9.4 V11.4" stroke-width="0.35" />
		<path d="M36.8 13.2 L36.4 21.4 Q36.4 22.2 37.2 22.2 L40.2 22.2 Q41 22.2 41 21.4 L41 13.2 Z" fill={P.fore} />
		<path d="M22.4 14.2 L20.6 22 L26 22 L27.8 14.2 Z" fill={P.grip} />
		<rect x="20.2" y="21.6" width="6.2" height="1.8" rx="0.4" fill={P.mag} />
		{@render guardRing('M27.8 14.4 Q27.8 17.8 30.6 17.8 L34.6 17.8 L35 14.4', DARK)}
		<path d="M30.4 14.2 Q31 16 30.2 16.8" fill="none" stroke-width="0.7" />
		<path d="M13 7 L42.4 7 L44.8 8.8 L44.8 12.4 Q44.8 13.4 43.8 13.4 L36 13.4 L34.8 14.6 L22.4 14.6 L21 13.6 L13 13.6 Z" fill={P.body} />
		<rect x="14" y="5.6" width="28.4" height="1.4" rx="0.3" fill={DARK} />
		{#each [17.6, 19.6, 21.6, 23.6, 25.6, 27.6, 29.6, 31.6, 33.6, 35.6, 37.6] as x (x)}
			<line x1={x} y1="5.8" x2={x} y2="6.8" stroke-width="0.4" />
		{/each}
		<path d="M14.8 5.6 L15.2 3.4 L16.8 3.4 L17.2 5.6 Z M39.4 5.6 L39.8 3.4 L41.4 3.4 L41.8 5.6 Z" fill={P.sights} />
		<rect x="11.6" y="6" width="1.8" height="1.4" rx="0.3" fill={DARK} />
		<line x1="15" y1="8" x2="42" y2="8" {...HI} />
	{:else if model === 'r8'}
		<!-- R8 Revolver: full-length top rail, thick barrel with underlug, accessory rail under the muzzle,
		     fluted cylinder, hammer spur, round trigger guard, raked rubber grip with finger grooves -->
		<path d="M20.4 6.8 L17.8 3.4 Q17.3 2.9 16.8 3.4 L16.6 4 L19 8.4 Z" fill={DARK} />
		<path
			d="M19.8 10 C17.6 11.6 16 14 14.8 17 C14 19 13.4 21 13.4 22.2 Q13.4 23.2 14.6 23.2 L19.6 23.2 Q20.6 23.2 20.6 22.2 C20.4 21.4 20.8 20.8 21.4 20.4 C20.8 19.6 21 18.8 21.8 18.4 C21.2 17.6 21.4 16.8 22.4 16.4 C22 15.6 22.6 14.8 23.8 14.4 L24.2 12.8 Z"
			fill={P.grip}
		/>
		<path d="M16.4 16.2 C15.6 18.2 15.2 20 15.2 21.6" fill="none" stroke="#fff" stroke-opacity="0.3" stroke-width="0.7" />
		{@render guardRing('M22.8 14.4 C22.4 19.2 26.6 20.2 28.8 18.6 C30.2 17.6 30.8 16 30.6 14.4', DARK)}
		<path d="M25.6 14.4 Q27.2 16.4 26 18" fill="none" stroke-width="0.8" />
		<path d="M19.2 6.4 Q19.4 5.6 20.4 5.6 L32.6 5.6 L32.6 12.6 L31 14.8 L21.2 14.8 Q19.6 14.6 19.2 13 Z" fill={P.frame} />
		<path d="M32 5.8 L54 5.8 L54 11 L36.4 11 L33.8 12.6 L32 12.6 Z" fill={P.body} />
		<rect x="44.6" y="11" width="8.4" height="1.7" rx="0.3" fill="#7d848c" />
		{#each [46.6, 48.6, 50.6] as x (x)}
			<line x1={x} y1="11.3" x2={x} y2="12.4" stroke-width="0.4" />
		{/each}
		<rect x="21.6" y="6.3" width="9.8" height="8" rx="1.8" fill={P.cylinder} />
		<rect x="23" y="7.8" width="7" height="1.3" rx="0.65" fill="#000" fill-opacity="0.55" stroke="none" />
		<rect x="23" y="11.4" width="7" height="1.3" rx="0.65" fill="#000" fill-opacity="0.55" stroke="none" />
		<line x1="23.2" y1="7.3" x2="29.8" y2="7.3" stroke="#fff" stroke-opacity="0.35" stroke-width="0.6" />
		<rect x="21.8" y="4.2" width="31" height="1.6" rx="0.3" fill={DARK} />
		{#each [24, 26.2, 28.4, 30.6, 32.8, 35, 37.2, 39.4, 41.6, 43.8, 46, 48.2] as x (x)}
			<line x1={x} y1="4.4" x2={x} y2="5.6" stroke-width="0.4" />
		{/each}
		<rect x="51.4" y="3.2" width="1.4" height="1" fill={DARK} stroke-width="0.5" />
		<line x1="33.6" y1="6.9" x2="53" y2="6.9" {...HI} />
	{:else if model === 'xm1014'}
		<!-- XM1014: collapsible tube stock with cheek piece, pistol grip, ghost-ring sight, ribbed forend,
		     barrel over a long magazine tube joined by a clamp -->
		<path d="M17.6 9.4 L7 11.4 L7.2 12.8 L17.6 11.6 Z" fill={P.stock} />
		<path d="M17.2 12.2 L7.2 15.4 L7.4 16.6 L17.2 13.4 Z" fill={P.stock} />
		<path d="M9 11 L11.2 7.6 L13.4 7.8 L12.4 10.4 Z" fill={P.stock} />
		<path d="M7.8 9.4 L5.6 9.4 Q4.6 9.4 4.6 10.4 L4.4 17.8 Q4.4 18.6 5.4 18.6 L6.8 18.6 Q7.6 18.6 7.6 17.8 Z" fill={P.stock} />
		<path d="M5.6 10 V18" stroke-width="0.45" />
		<path d="M19.8 12.8 L18 20.8 Q17.8 21.6 18.8 21.6 L21.2 21.6 Q21.8 21.6 22 21 L23.6 12.8 Z" fill={P.grip} />
		{#each [15, 16.6, 18.2] as y (y)}
			<line x1={23.2 - (y - 13) * 0.22} y1={y} x2={21.6 - (y - 13) * 0.22} y2={y} {...GROOVE} />
		{/each}
		{@render guardRing('M23.6 13 Q23.8 16 26.4 16 L27.8 16 L28.2 13', DARK)}
		<path d="M25.4 13 Q26 14.4 25.4 15" fill="none" stroke-width="0.6" />
		<rect x="33" y="9.8" width="23.4" height="2.2" rx="1" fill={P.mag} />
		<rect x="33" y="7.6" width="27" height="1.8" rx="0.4" fill={P.barrel} />
		<rect x="55.6" y="9.4" width="2.4" height="3" rx="0.6" fill={STEEL} />
		<rect x="50.6" y="7.2" width="1.6" height="5.2" rx="0.4" fill={STEEL} />
		<path d="M57.8 7.6 L58.2 6 L59.2 6 L59.6 7.6 Z" fill={DARK} />
		<path d="M17 7.8 Q17 7.2 17.6 7.2 L33.6 7.2 L33.6 13 L19.8 13 L17 11.8 Z" fill={P.body} />
		<rect x="22.8" y="6" width="10.6" height="1.2" rx="0.3" fill={DARK} />
		<path d="M19 7.2 L19.4 5 L20.2 5 L20.4 6 L21.2 6 L21.4 5 L22.2 5 L22.6 7.2 Z" fill={DARK} />
		<rect x="33.4" y="8.2" width="9.8" height="5.6" rx="1.2" fill={P.fore} />
		{#each [35, 36.2, 37.4, 38.6, 39.8, 41] as x (x)}
			<line x1={x} y1="9" x2={x} y2="13" {...GROOVE} />
		{/each}
		<line x1="18.6" y1="8.2" x2="32.6" y2="8.2" {...HI} />
		<line x1="44" y1="8.2" x2="59" y2="8.2" {...HI} />
	{:else if model === 'karambit'}
		<!-- Karambit: finger ring at the back, curved handle with finger grooves and jimping, claw blade curving down -->
		<path
			d="M4.6 14.8 A3.8 3.8 0 1 0 12.2 14.8 A3.8 3.8 0 1 0 4.6 14.8 Z M6.6 14.8 A1.8 1.8 0 1 0 10.2 14.8 A1.8 1.8 0 1 0 6.6 14.8 Z"
			fill={P.ring}
			fill-rule="evenodd"
		/>
		<path
			d="M10.4 11.6 Q11.4 9.6 13.6 9.6 L33.4 8.8 L34.8 9.4 L34.8 13.2 L32.2 13.6 Q30.6 15.8 28.8 13.8 Q27 15.8 25.2 13.8 Q23.4 15.8 21.6 13.8 L14.4 14.2 Q11.4 14.6 10.4 13 Z"
			fill={P.handle}
		/>
		<path d="M14 11.8 L31.6 11.2" stroke="#000" stroke-opacity="0.35" stroke-width="0.5" />
		<path d="M25.6 9.1 l0.6 -0.9 l0.6 0.9 l0.6 -0.9 l0.6 0.9 l0.6 -0.9 l0.6 0.9 l0.6 -0.9 l0.6 0.9 l0.6 -0.9 l0.6 0.9" fill="none" stroke-width="0.5" />
		<rect x="33.8" y="8.4" width="2.4" height="5.6" rx="0.5" fill={DARK} />
		<path d="M35.8 8.8 C41 7.2 48 7.4 53 10.6 C56 12.6 57.8 16 58.8 20.6 C55.6 16.2 51.6 13.8 46.4 13.2 C42.6 12.8 39 13.2 35.8 13.8 Z" fill={P.blade} />
		<path d="M37.6 12.5 C44 11.6 51 12.6 56.2 17.4" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="0.7" />
		<line x1="12.4" y1="10.4" x2="31" y2="9.8" {...HI} />
	{:else if model === 'awp'}
		<!-- AWP: long heavy barrel with a muzzle brake, big scope on rings, thumbhole stock with a butt pad,
		     box magazine, bolt handle, bipod folded forward under the barrel -->
		<rect x="38" y="7.8" width="20.2" height="1.9" fill={P.barrel} />
		<rect x="57.6" y="7" width="3" height="3.4" rx="0.5" fill={DARK} />
		<rect x="60.4" y="7.6" width="2.4" height="2.2" rx="0.4" fill={STEEL} />
		<rect x="40" y="11.6" width="12.4" height="1.1" rx="0.5" fill={STEEL} />
		<circle cx="52.6" cy="12.15" r="0.9" fill={DARK} />
		<rect x="38.6" y="11.2" width="2.4" height="2.2" rx="0.4" fill={DARK} />
		<rect x="28.6" y="12.4" width="3.8" height="3.8" rx="0.3" fill={P.mag} />
		{@render guardRing('M23.4 13.4 Q23.6 16.4 26.4 16.4 L28.2 16.4 L28.4 13.2', DARK)}
		<path d="M25.4 13.2 Q26 14.8 25.2 15.6" fill="none" stroke-width="0.7" />
		<rect x="1.6" y="7.6" width="2.4" height="11.4" rx="0.6" fill={DARK} />
		<path
			d="M3.6 8.4 Q3.6 7.8 4.2 7.8 L12.4 7.8 L14.4 9.6 L40.4 9.6 Q41.4 9.6 41.2 10.6 L40.8 12.2 Q40.6 12.9 39.8 12.9 L27.6 12.9 L23.4 13.4 L21.4 20.6 Q21.2 21.4 20.4 21.4 L17 21.4 Q16 21.4 15.4 20.8 L13.4 19 L4.2 18.6 Q3.6 18.6 3.6 18 Z M14.6 12.4 Q14.6 11.6 15.4 11.6 L19.4 11.6 Q20.2 11.6 20 12.4 L18.8 17.4 Q18.6 18.1 17.9 18.1 L15.4 18.1 Q14.6 18.1 14.6 17.3 Z"
			fill={P.stock}
			fill-rule="evenodd"
		/>
		<rect x="5.6" y="6.6" width="6.2" height="1.3" rx="0.4" fill={DARK} />
		<rect x="23.6" y="7.8" width="15" height="1.9" fill={STEEL} />
		<path d="M26.6 9.2 L24.8 11.6" stroke-width="1.1" />
		<circle cx="24.5" cy="12" r="1.1" fill={STEEL} />
		<rect x="27" y="5.4" width="1.6" height="2.5" fill={DARK} />
		<rect x="34.6" y="5.4" width="1.6" height="2.5" fill={DARK} />
		<rect x="24.6" y="3.6" width="14" height="2" rx="0.6" fill={DARK} />
		<path d="M37.4 3.6 L41.4 2.4 Q41.9 2.3 41.9 2.8 L41.9 6.4 Q41.9 6.9 41.4 6.8 L37.4 5.6 Z" fill={DARK} />
		<rect x="22.2" y="2.9" width="3.2" height="3.4" rx="0.7" fill={DARK} />
		<rect x="30.6" y="2" width="1.8" height="1.6" rx="0.3" fill={DARK} />
		<line x1="25.6" y1="4.2" x2="37" y2="4.2" stroke="#fff" stroke-opacity="0.3" stroke-width="0.6" />
		<line x1="15.4" y1="10.4" x2="39.6" y2="10.4" {...HI} />
		<line x1="39" y1="8.4" x2="57" y2="8.4" stroke="#fff" stroke-opacity="0.3" stroke-width="0.6" />
	{/if}
</g>
