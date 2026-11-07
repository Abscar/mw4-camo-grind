<svelte:options namespace="svg" />

<!--
	The CS2 easter-egg guns (see `Cs2Look` in weaponLooks.ts): a CS2 gun's silhouette in the same
	cartoon style as WeaponIcon (viewBox 0 0 64 24, muzzle right), wearing the user's chosen skin.
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

	type Part = 'stock' | 'body' | 'guard' | 'grip' | 'mag' | 'barrel' | 'can' | 'fore' | 'cylinder' | 'sights';
	const PLAIN: Record<Part, string> = {
		stock: DARK,
		body: DARK,
		guard: DARK,
		grip: DARK,
		mag: DARK,
		barrel: STEEL,
		can: DARK,
		fore: DARK,
		cylinder: STEEL,
		sights: DARK
	};
	// which part gets which paint: a pattern below, or a plain '#colour'
	const SKIN_PARTS: Record<Skin, Partial<Record<Part, string>>> = {
		'fire-serpent': { stock: 'wood', guard: 'wood', grip: 'wood', body: 'serpent', mag: 'scales' },
		asiimov: { stock: 'asiimov', body: 'asiimov', guard: 'asiimov', mag: 'asiimov' },
		blaze: { body: 'blaze', cylinder: '#1c1d21' },
		printstream: { body: 'printstream', can: 'printstream' },
		bloodsport: { body: 'bloodsport', stock: 'bloodsport', grip: 'bloodsport', fore: 'bloodsport', sights: '#e2b23a' },
		'frost-borre': { body: 'frost', barrel: 'frost', mag: 'frost', guard: '#4a5059' }
	};
	const uid = $props.id(); // pattern ids must be unique per icon (the same gun can be on screen twice)
	const P = $derived.by(() => {
		const out = { ...PLAIN };
		for (const [part, p] of Object.entries(SKIN_PARTS[skin]) as [Part, string][]) {
			out[part] = p.startsWith('#') ? p : `url(#${uid}-${p})`;
		}
		return out;
	});

	// Blaze flames, drawn with the muzzle end at x 0 and 8 units tall, then placed on each gun
	const FLAME_RED =
		'M0 -1 L0 9 L-6 9 C-9 8.8 -12 8.2 -15 8.4 C-12.5 7.2 -10 6.8 -8 6.6 C-12 6.2 -16 6.4 -20 7 C-17 5.4 -13.5 4.6 -10 4.6 C-13 3.8 -16 3.6 -19 3.8 C-15.5 2.2 -12 1.8 -8.5 2.2 C-10.5 1 -13 0.4 -16 0.4 C-11 -0.6 -6 -1 0 -1 Z';
	const FLAME_ORANGE =
		'M0 -0.5 L0 8.5 L-4 8.5 C-6 8.3 -8 7.9 -10 7.8 C-8 7 -6 6.6 -4.6 6.4 C-7 6.1 -9.5 6.1 -12 6.4 C-10 5 -7.5 4.4 -5 4.4 C-7 3.8 -9 3.6 -11.5 3.7 C-9 2.4 -6.5 2.1 -4 2.4 C-5.5 1.4 -7.5 0.9 -9.5 0.8 C-6 -0.2 -3 -0.5 0 -0.5 Z';
	const FLAME_YELLOW = 'M0 -0.5 L0 8.5 L-2.6 8.5 C-3.6 7.4 -2.6 6.4 -4 5.4 C-3 4.4 -3.6 3.4 -2.6 2.6 C-3.6 1.6 -3.2 0.4 -2.4 -0.5 Z';
	const flameAt = $derived(model === 'r8' ? 'translate(48.4 5.6) scale(1 0.9)' : 'translate(47.2 5) scale(1 0.85)');
</script>

<defs>
	{#if skin === 'fire-serpent'}
		<!-- red-brown wood with dark wavy grain -->
		<pattern id="{uid}-wood" patternUnits="userSpaceOnUse" width="8" height="2.6">
			<rect width="8" height="2.6" fill="#a8482a" />
			<path d="M0 1.3 Q2 0.4 4 1.3 T8 1.3" fill="none" stroke="#5b2012" stroke-width="0.45" />
		</pattern>
		<!-- dark teal with green scales (magazine) -->
		<pattern id="{uid}-scales" patternUnits="userSpaceOnUse" width="2.4" height="2.4">
			<rect width="2.4" height="2.4" fill="#1d3a38" />
			<path
				d="M0 2.4 A1.2 1.2 0 0 1 2.4 2.4 M-1.2 1.2 A1.2 1.2 0 0 1 1.2 1.2 M1.2 1.2 A1.2 1.2 0 0 1 3.6 1.2"
				fill="none"
				stroke="#45b56d"
				stroke-width="0.35"
			/>
		</pattern>
		<!-- the green serpent on the receiver: scales, a gold body and a red feather crest -->
		<pattern id="{uid}-serpent" patternUnits="userSpaceOnUse" width="64" height="24">
			<rect width="64" height="24" fill="#2b9a52" />
			<path
				d="M17 13.8 a1.2 1.2 0 0 1 2.4 0 a1.2 1.2 0 0 1 2.4 0 a1.2 1.2 0 0 1 2.4 0 a1.2 1.2 0 0 1 2.4 0 a1.2 1.2 0 0 1 2.4 0 a1.2 1.2 0 0 1 2.4 0 a1.2 1.2 0 0 1 2.4 0 a1.2 1.2 0 0 1 2.4 0"
				fill="none"
				stroke="#17663a"
				stroke-width="0.45"
			/>
			<path d="M16 11.8 C20 8.6 23 13.6 27 10.8 S33 8.6 36 10.8" fill="none" stroke={INK} stroke-width="2.1" />
			<path d="M16 11.8 C20 8.6 23 13.6 27 10.8 S33 8.6 36 10.8" fill="none" stroke="#f3c838" stroke-width="1.3" />
			<path d="M29.4 8 L31 9.8 L31.8 8 L33.2 10 L34.2 8 L35.4 10.2 L35.6 8 Z" fill="#e2452a" />
		</pattern>
	{:else if skin === 'asiimov'}
		<!-- white with black blocks and orange ends -->
		<pattern id="{uid}-asiimov" patternUnits="userSpaceOnUse" width="64" height="24">
			<rect width="64" height="24" fill="#eef1f2" />
			<path d="M0 0 H7.4 L6.6 24 H0 Z" fill="#ff6c14" />
			<path d="M7.4 0 H8.8 L8 24 H6.6 Z" fill="#1a1b1e" />
			<path d="M26 14.8 L34.8 14.8 L34.8 10 Z" fill="#1a1b1e" />
			<rect x="34.6" y="10.6" width="12.4" height="2.2" fill="#1a1b1e" />
			<rect x="43.8" y="7.6" width="3.4" height="5.2" fill="#ff6c14" />
			<rect x="17.6" y="7.6" width="1.8" height="4.8" fill="#ff6c14" />
			<rect x="28" y="19.2" width="7" height="3" fill="#ff6c14" />
		</pattern>
	{:else if skin === 'blaze'}
		<!-- black with hot-rod flames from the muzzle end -->
		<pattern id="{uid}-blaze" patternUnits="userSpaceOnUse" width="64" height="24">
			<rect width="64" height="24" fill="#18191c" />
			<g transform={flameAt}>
				<path d={FLAME_RED} fill="#e2401b" />
				<path d={FLAME_ORANGE} fill="#ff9a1a" />
				<path d={FLAME_YELLOW} fill="#ffd84a" />
			</g>
		</pattern>
	{:else if skin === 'printstream'}
		<!-- pearl-white slide and suppressor with black print -->
		<linearGradient id="{uid}-pearl" gradientUnits="userSpaceOnUse" x1="15" y1="6" x2="59" y2="11.6">
			<stop offset="0" stop-color="#fbf4fb" />
			<stop offset="0.35" stop-color="#e9f6f5" />
			<stop offset="0.65" stop-color="#f8f1e4" />
			<stop offset="1" stop-color="#fdfdfd" />
		</linearGradient>
		<pattern id="{uid}-printstream" patternUnits="userSpaceOnUse" width="64" height="24">
			<rect width="64" height="24" fill="url(#{uid}-pearl)" />
			<path
				d="M25 7.6 l1.6 2.2 M26.6 7.6 l-1.6 2.2 M27.4 7.6 l1.6 2.2 M29 7.6 l-1.6 2.2"
				stroke="#16171a"
				stroke-width="0.6"
			/>
			<path d="M30.6 8.7 h3.4 M20.8 8.7 h3" stroke="#16171a" stroke-width="0.5" />
			<rect x="34.8" y="8" width="1.4" height="1.4" fill="#16171a" />
			<path d="M15 10.6 H38" stroke="#16171a" stroke-width="0.6" />
		</pattern>
	{:else if skin === 'bloodsport'}
		<!-- black with red panels, white decals, white bases and gold sights -->
		<pattern id="{uid}-bloodsport" patternUnits="userSpaceOnUse" width="64" height="24">
			<rect width="64" height="24" fill="#1a1a1d" />
			<rect x="9" y="8" width="5.6" height="7.4" fill="#d3262b" />
			<rect x="9" y="15.4" width="5.6" height="3.4" fill="#f4f1ea" />
			<path d="M14 8 L21 8 L18 15 L14 15 Z" fill="#d3262b" />
			<path d="M35.6 8 L43 8 L43 13.8 L33.4 13.8 Z" fill="#d3262b" />
			<rect x="35.6" y="13.8" width="4.6" height="4.6" fill="#d3262b" />
			<rect x="35.6" y="18.4" width="4.6" height="3" fill="#f4f1ea" />
			<path d="M23 10.2 h6 M23 11.6 h3.6 M29.4 12.8 h2.6" stroke="#f4f1ea" stroke-width="0.55" />
			<rect x="20" y="17" width="8" height="1.2" fill="#d3262b" />
			<rect x="20" y="21.2" width="8" height="2.4" fill="#f4f1ea" />
		</pattern>
	{:else if skin === 'frost-borre'}
		<!-- steel blue with a silver Norse ring chain -->
		<pattern id="{uid}-frost" patternUnits="userSpaceOnUse" width="3.2" height="2.6">
			<rect width="3.2" height="2.6" fill="#2b3a52" />
			<path d="M0 1.3 C0.8 0.1 2.4 0.1 3.2 1.3 C2.4 2.5 0.8 2.5 0 1.3 Z" fill="none" stroke="#a9c8e6" stroke-width="0.35" />
		</pattern>
	{/if}
</defs>

<g stroke={INK} stroke-width="0.8" stroke-linejoin="round" stroke-linecap="round">
	{#if model === 'ak47'}
		<!-- AK-47: wooden stock and handguards, gas tube, tall front sight, slant brake, banana mag -->
		<path d="M17.5 9.2 L3 10.8 Q1.8 11 1.9 12.2 L2.4 17 Q2.6 17.8 3.6 17.5 L17.5 13.8 Z" fill={P.stock} />
		<path d="M21.6 13.6 L19.4 21 Q19.2 21.8 20.2 21.8 L22.6 21.8 L24.8 13.6 Z" fill={P.grip} />
		<path d="M17 9 Q17 8.4 17.8 8.4 L33.6 8.4 L35.2 9.4 L35.2 13.8 L17 13.8 Z" fill={P.body} />
		<rect x="33" y="6.8" width="2.6" height="1.8" rx="0.4" fill={DARK} />
		<rect x="44.4" y="8.8" width="4.6" height="1.4" fill={STEEL} />
		<rect x="35.2" y="8.5" width="9.6" height="2" rx="0.9" fill={P.guard} />
		<rect x="35.2" y="10.5" width="10.6" height="3.6" rx="1.3" fill={P.guard} />
		<rect x="45.8" y="10.8" width="12.4" height="1.3" fill={P.barrel} />
		<rect x="48.4" y="8.6" width="1.8" height="3.6" rx="0.4" fill={DARK} />
		<path d="M53.2 10.8 L53.8 7 L55 7 L55.6 10.8 Z" fill={DARK} />
		<path d="M58.2 10.3 L61.2 10.3 L61.8 12.5 L58.2 12.5 Z" fill={DARK} />
		<path d="M24.8 13.8 Q25.2 16.6 28.2 16.6 L29.2 13.8" fill="none" stroke-width="0.9" />
		<path d="M29.6 13.8 C29.8 17.5 31.4 20.6 34.2 22.6 L37.6 20.6 C35.4 19 34 16.6 33.8 13.8 Z" fill={P.mag} />
		<line x1="18.6" y1="9.3" x2="33" y2="9.3" {...HI} />
	{:else if model === 'm4a4'}
		<!-- M4A4: collapsible stock on a buffer tube, flat top with rear sight, quad rail, A-frame front sight, birdcage -->
		<rect x="13" y="9.2" width="5.4" height="2.4" fill={STEEL} />
		<path d="M14.6 8.8 L5.4 8.8 Q4.2 8.8 4.2 10 L4.2 16.6 Q4.2 17.4 5.2 17.2 L9.4 15.6 L14.6 12.2 Z" fill={P.stock} />
		<path d="M21.8 14.4 L20 21 Q19.8 21.8 20.8 21.8 L23 21.8 L25 14.4 Z" fill={P.grip} />
		<path d="M17.6 7.8 L34.6 7.8 L34.6 11.8 L32.6 14.6 L20.4 14.6 L18.2 12.4 L17.6 12.4 Z" fill={P.body} />
		<path d="M19.6 7.8 L20 5.4 L22 5.4 L22.4 7.8 Z" fill={DARK} />
		<rect x="47" y="9.6" width="10.4" height="1.3" fill={P.barrel} />
		<rect x="34.6" y="7.8" width="12.4" height="4.8" rx="0.8" fill={P.guard} />
		{#each [36.8, 39.4, 42] as x (x)}
			<line x1={x} y1="8.6" x2={x} y2="11.8" stroke="rgb(0 0 0 / 0.45)" stroke-width="0.6" />
		{/each}
		<path d="M47 11.2 L48.2 7 L48.2 5.4 L49.4 5.4 L49.4 7 L50.6 11.2 Z" fill={DARK} />
		<rect x="57.2" y="8.9" width="3.6" height="2.7" rx="0.4" fill={DARK} />
		<path d="M58.4 9.4 V11.1 M59.6 9.4 V11.1" stroke="#5a616b" stroke-width="0.4" />
		<path d="M25 14.4 Q25.4 16.8 28.4 16.8 L29 14.6" fill="none" stroke-width="0.9" />
		<path d="M29.2 14.4 L29.8 21.2 L33.8 21.6 L33.2 14.4 Z" fill={P.mag} />
		<line x1="23" y1="8.7" x2="33.6" y2="8.7" {...HI} />
	{:else if model === 'deagle'}
		<!-- Desert Eagle: long slab slide, hammer, big squared trigger guard, chunky angled grip -->
		<path d="M17 5.4 L15.2 3.6 L14.4 4.4 L16 6.6 Z" fill={DARK} />
		<rect x="19.4" y="11.4" width="17.4" height="2.6" fill={DARK} />
		<path d="M20.2 13.6 L17.2 22.4 Q17 23.2 18 23.2 L24.4 23.2 L27.6 13.6 Z" fill={P.grip} />
		<path
			d="M16.4 5.6 Q16.4 5 17 5 L46.6 5 Q47.2 5 47.2 5.6 L47.2 10.8 L36.8 10.8 L36.8 11.8 L17 11.8 Q16.4 11.8 16.4 11.2 Z"
			fill={P.body}
		/>
		<path d="M18.4 6.6 V10.6 M19.6 6.6 V10.6 M20.8 6.6 V10.6" stroke-width="0.5" />
		<rect x="17.8" y="4.2" width="1.4" height="0.9" fill={DARK} />
		<rect x="45" y="4.1" width="1.3" height="1" fill={DARK} />
		<path d="M27.6 13.8 L27.6 17 Q27.6 18.2 28.8 18.2 L33.4 18.2 Q34.4 18.2 34.6 17.2 L35.6 14" fill="none" stroke-width="0.9" />
		<line x1="22" y1="6" x2="45" y2="6" {...HI} />
	{:else if model === 'usps'}
		<!-- USP-S: slide with hammer, long screwed-on suppressor -->
		<path d="M15.6 7.6 L13.8 6.2 L13.4 7.2 L15 8.6 Z" fill={DARK} />
		<rect x="17.6" y="11" width="19.6" height="2.8" rx="0.6" fill={DARK} />
		<path d="M19.4 13.6 L17.2 22.2 Q17 23 18 23 L23.6 23 L26.2 13.6 Z" fill={P.grip} />
		<rect x="37.6" y="6.6" width="21.4" height="4.8" rx="1.8" fill={P.can} />
		<path d="M40.4 6.8 V11.2" stroke-width="0.5" />
		<rect x="15" y="6.4" width="23" height="5" rx="1" fill={P.body} />
		<path d="M16.8 7.4 V10.4 M18 7.4 V10.4 M19.2 7.4 V10.4" stroke-width="0.5" />
		<rect x="15.8" y="5.5" width="1.4" height="0.9" fill={DARK} />
		<rect x="35.6" y="5.6" width="1.2" height="0.8" fill={DARK} />
		<path d="M26.2 13.8 Q26.6 17 29.8 16.8 L30.6 13.8" fill="none" stroke-width="0.9" />
		<line x1="20.4" y1="7.3" x2="36.6" y2="7.3" {...HI} />
		<line x1="41.4" y1="7.5" x2="57.4" y2="7.5" {...HI} />
	{:else if model === 'mp7'}
		<!-- MP7: retracted stock pad, top rail with flip-up sights, magazine in the grip, folding foregrip -->
		<path d="M14.4 9 L11 9 Q10 9 10 10 L10 17.4 Q10 18.2 10.8 18.2 L12.4 18.2 L14.4 13.6 Z" fill={P.stock} />
		<rect x="15" y="7" width="25" height="1.8" rx="0.4" fill={DARK} />
		<path d="M16.4 7 L16.8 4.6 L18.4 4.6 L18.8 7 Z M37.4 7 L37.8 4.6 L39.4 4.6 L39.8 7 Z" fill={P.sights} />
		<rect x="41.6" y="10.4" width="6" height="1.4" fill={P.barrel} />
		<rect x="47.2" y="9.9" width="2" height="2.4" rx="0.4" fill={DARK} />
		<path d="M36.8 13.2 L36.4 20.4 Q36.4 21 37 21 L39 21 Q39.6 21 39.6 20.4 L39.6 13.2 Z" fill={P.fore} />
		<path d="M22.4 14.2 L20.8 23.2 L25.4 23.2 L27 14.2 Z" fill={P.grip} />
		<path d="M14 8.6 L40.6 8.6 L42.2 10 L42.2 13.6 L32 13.6 L30.6 14.6 L19.6 14.6 L14 13 Z" fill={P.body} />
		<path d="M27 14.6 Q27.4 17 30.2 17 L30.8 14.6" fill="none" stroke-width="0.9" />
		<line x1="16" y1="9.5" x2="40" y2="9.5" {...HI} />
	{:else if model === 'r8'}
		<!-- R8 Revolver: top rail, full-length underlug, cylinder, hammer, finger-groove rubber grip -->
		<path d="M19.8 7.2 L17.4 4.4 L16.6 5.2 L18.8 8.4 Z" fill={DARK} />
		<path
			d="M20.6 14.6 C19.2 17 18.4 19.4 18.8 22.8 L24.8 22.8 C24.6 21.8 25 21.2 25.4 20.6 C24.8 19.9 24.8 19.2 25.6 18.6 C25 17.9 25.2 17.2 26 16.6 L27 15 Z"
			fill="#55585d"
		/>
		<path d="M26.8 15.2 Q26.8 18.6 29.6 18.4 Q31.6 18.2 31.6 15.4" fill="none" stroke-width="0.9" />
		<path d="M19.4 6.8 L30 6.8 L30 13.6 L27.6 15.6 L21 15.6 L19.4 13.8 Z" fill={P.body} />
		<path d="M29.6 7.6 L48.4 7.6 L48.4 12.8 L32.6 12.8 L29.6 11.6 Z" fill={P.body} />
		<rect x="20.6" y="5.6" width="27.4" height="2" rx="0.4" fill={P.body} />
		{#each [23, 25.4, 27.8, 30.2, 32.6, 35, 37.4, 39.8, 42.2, 44.6] as x (x)}
			<line x1={x} y1="5.9" x2={x} y2="7.3" stroke-width="0.45" />
		{/each}
		<rect x="41.6" y="12.8" width="5.8" height="1.3" fill={DARK} />
		<rect x="21.6" y="7.8" width="8.6" height="6.4" rx="1.8" fill={P.cylinder} />
		<path d="M24.4 8.2 V13.8 M27.4 8.2 V13.8" stroke-width="0.5" />
		<rect x="46.6" y="4.7" width="1.2" height="0.9" fill={DARK} />
		<line x1="31.4" y1="8.6" x2="47" y2="8.6" {...HI} />
	{:else if model === 'xm1014'}
		<!-- XM1014: skeleton stock, pistol grip, ghost-ring sight, ribbed forend, barrel over a long magazine tube -->
		<path
			d="M18 8.8 L5 9.6 Q4 9.7 4 10.8 L4 16.6 Q4 17.4 5 17.2 L9 16.4 L18 12.8 Z M15 10.6 L8.6 11.1 L8.6 14.4 L15 12.1 Z"
			fill={P.stock}
			fill-rule="evenodd"
		/>
		<rect x="34" y="11" width="21.6" height="1.8" rx="0.8" fill={P.mag} />
		<rect x="34" y="8.8" width="25.4" height="1.8" fill={P.barrel} />
		<rect x="50.6" y="8.4" width="2.2" height="4.8" rx="0.5" fill={DARK} />
		<path d="M56.8 8.8 L57.2 7 L58.4 7 L58.8 8.8 Z" fill={DARK} />
		<path d="M20.6 13.2 L18.8 20.8 Q18.6 21.6 19.6 21.6 L22 21.6 L24 13.2 Z" fill={P.grip} />
		<path d="M24 13.2 Q24.4 16 27.2 16 L27.8 13.2" fill="none" stroke-width="0.9" />
		<rect x="17.4" y="8" width="17.2" height="5.4" rx="1.2" fill={P.body} />
		<path d="M29.6 8 L30 5.8 L30.9 5.8 L31.3 7 L32.3 7 L32.7 5.8 L33.6 5.8 L34 8 Z" fill={DARK} />
		<rect x="34.4" y="8.2" width="11" height="5.2" rx="1.2" fill={P.guard} />
		{#each [36.4, 38, 39.6, 41.2, 42.8] as x (x)}
			<line x1={x} y1="9" x2={x} y2="12.6" stroke="rgb(0 0 0 / 0.5)" stroke-width="0.5" />
		{/each}
		<line x1="19" y1="8.9" x2="29" y2="8.9" {...HI} />
	{/if}
</g>
