<!--
	A PS3, game cases and a controller on the floor in front of the old TV (Abscar header; the user's
	ask 2026-11-11: "a PS3, games, cases scattered in front of / under the TV, just for vibes").
	Our own cartoon, no logos, titles or game art: the 2006 "fat" console (drawn after the photos on
	Wikipedia's PlayStation 3 page; a first boxy version "looked like a PS1", the user said): a big glossy
	pillow-shaped top, a black flap on the left, the silver panel with the disc slot on the right, a
	darker ribbed base it floats on; a DualShock-style pad on its cable, a loose disc and three
	cases with our own military-shooter covers in CoD4 / MW2 / MW3-ish colours (green haze, cold grey,
	fire) — one leaning on the console, one lying in front, two stacked spine-out on the right with
	a third tossed on top (four cases, three covers).
	`on` = the TV is on: its light flickers on the floor, the console's LED turns from red (standby)
	to green and the pad's player LED lights up. Decoration only: aria-hidden, clicks go through
	(the scene's top edge overlaps the TV's feet).
-->
<script lang="ts">
	let { on = false }: { on?: boolean } = $props();

	const uid = $props.id();
	const id = (name: string) => `${uid}-${name}`;
	const ref = (name: string) => `url(#${id(name)})`;

	/** The console's top: a glossy pillow whose front edge bows down a little. */
	const PS_TOP =
		'M13.6 44.4 L23.5 32.6 C25.2 31 27.4 30.3 30.5 30.3 H127.5 C130.6 30.3 132.8 31 134.5 32.6 L144.4 44.4 C120 47.6 38 47.6 13.6 44.4 Z';
	/** Vent ribs along the base. */
	const VENTS = Array.from({ length: 45 }, (_, i) => 20.5 + i * 2.6);

	/*
	 * The pad seen from straight above, 81.4 × 50.4 units, measured off the top-down DualShock 3
	 * layout drawing on Wikimedia Commons ("Dualshock3 Layout.svg", diagram px − (345, 300), ÷ 7):
	 * two big round wings (d-pad / face buttons), a lower bridge between them, the stick rings
	 * bulging out under it, and grips that point down and a little outward. Mirrored about x = 40.7.
	 */
	const MID = 40.7;
	const WING = { l: 15.7, r: 65.7, y: 21.4, rad: 13.6 };
	const STICK = { l: 27.1, r: 54.3, y: 33.6, ring: 8.6 };
	/** The left grip (the right one is its mirror image); its top hides under the wing. */
	const GRIP =
		'M2.6 24 C1.4 30 0 37 0.3 42.8 C0.6 48 4 50.6 8 50.4 C11.5 50.2 13.6 48.6 15.6 45.6 C17.4 42.8 19.4 39 21.6 35.6 L24 30 L12 22 Z';

	/** The four face buttons with their coloured shapes (top, right, bottom, left). */
	const FACE = [
		{ x: WING.r, y: WING.y - 6.8, c: '#3cc9a8', shape: 'triangle' },
		{ x: WING.r + 6.8, y: WING.y, c: '#ff5a72', shape: 'circle' },
		{ x: WING.r, y: WING.y + 6.8, c: '#7590ff', shape: 'cross' },
		{ x: WING.r - 6.8, y: WING.y, c: '#e27ad6', shape: 'square' }
	] as const;
</script>

<svg class="tv-games" class:tv-games-on={on} viewBox="0 0 304 106" aria-hidden="true">
	<defs>
		<filter id={id('blur')} x="-20%" y="-200%" width="140%" height="500%">
			<feGaussianBlur stdDeviation="2" />
		</filter>
		<filter id={id('glow')} x="-200%" y="-200%" width="500%" height="500%">
			<feGaussianBlur stdDeviation="1.6" />
		</filter>
		<clipPath id={id('floor')}><rect x="-20" y="20" width="344" height="90" /></clipPath>
		<clipPath id={id('ps-topclip')}><path d={PS_TOP} /></clipPath>
		<linearGradient id={id('chrome')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#f5f7f9" />
			<stop offset="0.42" stop-color="#c9ced4" />
			<stop offset="0.56" stop-color="#8f959c" />
			<stop offset="1" stop-color="#dde1e5" />
		</linearGradient>
		<radialGradient id={id('pool')} cx="0.5" cy="0.22" r="0.62">
			<stop offset="0" stop-color="#bcd8ff" stop-opacity="0.42" />
			<stop offset="0.55" stop-color="#9cc2ff" stop-opacity="0.13" />
			<stop offset="1" stop-color="#9cc2ff" stop-opacity="0" />
		</radialGradient>
		<linearGradient id={id('ps-body')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#26262c" />
			<stop offset="0.45" stop-color="#121215" />
			<stop offset="1" stop-color="#08080a" />
		</linearGradient>
		<linearGradient id={id('ps-top')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#5a5a64" />
			<stop offset="1" stop-color="#1a1a1f" />
		</linearGradient>
		<linearGradient id={id('silver')} x1="0" y1="0" x2="1" y2="0.4">
			<stop offset="0" stop-color="#eef1f4" />
			<stop offset="0.5" stop-color="#8d939a" />
			<stop offset="1" stop-color="#d3d8dd" />
		</linearGradient>
		<linearGradient id={id('pad')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#3a3a42" />
			<stop offset="1" stop-color="#0e0e11" />
		</linearGradient>
		<!-- one gradient in the pad's own units, so its separate pieces shade as one body -->
		<linearGradient id={id('pad-u')} gradientUnits="userSpaceOnUse" x1="0" y1="1" x2="0" y2="51">
			<stop offset="0" stop-color="#40404a" />
			<stop offset="0.45" stop-color="#1c1c21" />
			<stop offset="1" stop-color="#0b0b0e" />
		</linearGradient>
		<radialGradient id={id('stick')} cx="0.38" cy="0.32" r="0.7">
			<stop offset="0" stop-color="#55555e" />
			<stop offset="1" stop-color="#101013" />
		</radialGradient>
		<linearGradient id={id('disc')} x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#eef2f6" />
			<stop offset="0.25" stop-color="#ffd3f3" />
			<stop offset="0.42" stop-color="#c6f1ff" />
			<stop offset="0.58" stop-color="#dcffcf" />
			<stop offset="0.74" stop-color="#fff0bf" />
			<stop offset="1" stop-color="#b9c0c8" />
		</linearGradient>
		<linearGradient id={id('gloss')} x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#fff" stop-opacity="0.32" />
			<stop offset="0.35" stop-color="#fff" stop-opacity="0.06" />
			<stop offset="0.5" stop-color="#fff" stop-opacity="0" />
		</linearGradient>
		<linearGradient id={id('bg-a')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#c2bd7f" />
			<stop offset="0.35" stop-color="#76813f" />
			<stop offset="0.75" stop-color="#323d1b" />
			<stop offset="1" stop-color="#1a200f" />
		</linearGradient>
		<linearGradient id={id('bg-b')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#e2e8e5" />
			<stop offset="0.4" stop-color="#8d9d99" />
			<stop offset="0.8" stop-color="#36443f" />
			<stop offset="1" stop-color="#1d2725" />
		</linearGradient>
		<linearGradient id={id('bg-c')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#0e0c0c" />
			<stop offset="0.45" stop-color="#2c1008" />
			<stop offset="0.8" stop-color="#b0420f" />
			<stop offset="1" stop-color="#f58a2c" />
		</linearGradient>
	</defs>

	<!-- a case's cover, in 40 × 51 units: blue-tinted plastic, black header band, our own art -->
	{#snippet cover(art: 'a' | 'b' | 'c')}
		<rect width="40" height="51" rx="1.8" fill="#1d4596" />
		<rect x="1.2" y="1.2" width="37.6" height="48.6" rx="0.8" fill={ref(`bg-${art}`)} />
		{#if art === 'a'}
			<!-- hazy sun, a soldier facing you with his rifle up -->
			<circle cx="30" cy="16" r="7.5" fill="#f6edb8" opacity="0.5" />
			<path
				d="M6 46.5 L30.5 13 L32.6 14.4 L9 48.4 Z"
				fill="#12160b"
			/>
			<path
				d="M15.5 23 C15.5 17 19 14.5 22.5 14.5 C26.5 14.5 29.5 17.5 29.5 22.5 L29 24 C28.4 24.5 28 25.5 28 27 C28 29.5 26.5 31.5 25 32.5 L25.5 34 C30 35 34.5 37 37 41 L38.8 49.8 L5 49.8 L7 41 C9 37 14 35 19 34 L19.5 32.5 C17.5 31.5 16.4 29.5 16.3 27 C16 25.6 15.6 24.6 15.5 23 Z"
				fill="#161b0d"
			/>
			<path d="M16 22.6 C19 21 26 21 29.2 22.4" fill="none" stroke="#c9c58a" stroke-width="0.8" opacity="0.7" />
		{:else if art === 'b'}
			<!-- cold haze, a soldier in profile aiming left -->
			<circle cx="9" cy="14" r="1" fill="#fff" opacity="0.7" />
			<circle cx="15" cy="10.5" r="0.7" fill="#fff" opacity="0.6" />
			<circle cx="6" cy="22" r="0.6" fill="#fff" opacity="0.6" />
			<path
				d="M21 20 C21 15.5 24 13 27.5 13 C31 13 33.5 15.5 33.5 19.5 L33.2 21 C33 23.5 32 26 30 27.5 L30.5 29.5 C34 30.5 37 33 38.8 36 L38.8 49.8 L14 49.8 C14.5 42 16 36 20 32.5 L23.5 29.5 L23 27 C21.8 25.5 21 23 21 20 Z"
				fill="#111715"
			/>
			<path d="M2.5 29 L27 30 L28 33.8 L18 33.4 L17 37 L14.5 36.8 L15 33.3 L3 32.6 Z" fill="#0b100e" />
			<path d="M21.4 19.4 C24 18 30 17.6 33.4 18.8" fill="none" stroke="#e6ece9" stroke-width="0.8" opacity="0.6" />
		{:else}
			<!-- smoke and fire, a soldier with an orange rim light -->
			<ellipse cx="11" cy="18" rx="10" ry="5" fill="#3a2a24" opacity="0.6" />
			<ellipse cx="31" cy="26" rx="9" ry="4.5" fill="#3a2a24" opacity="0.5" />
			<g transform="translate(40 0) scale(-1 1)">
				<path
					d="M15.5 23 C15.5 17 19 14.5 22.5 14.5 C26.5 14.5 29.5 17.5 29.5 22.5 L29 24 C28.4 24.5 28 25.5 28 27 C28 29.5 26.5 31.5 25 32.5 L25.5 34 C30 35 34.5 37 37 41 L38.8 49.8 L5 49.8 L7 41 C9 37 14 35 19 34 L19.5 32.5 C17.5 31.5 16.4 29.5 16.3 27 C16 25.6 15.6 24.6 15.5 23 Z"
					fill="#0a0808"
					stroke="#ff8a2e"
					stroke-width="0.7"
				/>
			</g>
			<circle cx="8" cy="40" r="0.8" fill="#ffc46a" />
			<circle cx="33" cy="36" r="0.6" fill="#ffc46a" />
			<circle cx="27" cy="44" r="0.7" fill="#ffd27a" />
		{/if}
		<rect x="1.2" y="1.2" width="37.6" height="6" fill="#0b0b0d" />
		<rect x="4" y="3.5" width="10" height="1.4" rx="0.7" fill={ref('silver')} />
		<rect x="1.2" y="1.2" width="37.6" height="48.6" rx="0.8" fill={ref('gloss')} />
	{/snippet}

	<!-- a case lying flat, spine to you; (x, y) = far left corner of its top face -->
	{#snippet flatCase(x: number, y: number, art: 'a' | 'b' | 'c', spine: string)}
		<g transform="translate({x} {y})">
			<g transform="scale(1 0.4) translate(84 0) rotate(90) scale(1.65)">{@render cover(art)}</g>
			<rect y="26.4" width="84" height="6.8" rx="1" fill={spine} stroke="#1d4596" stroke-width="0.8" />
			<rect x="0.4" y="26.8" width="13" height="6" rx="0.6" fill="#0b0b0d" />
			<rect x="3" y="29.2" width="7.5" height="1.2" rx="0.6" fill={ref('silver')} />
			<rect x="20" y="29.3" width="34" height="1.1" rx="0.5" fill="#fff" opacity="0.55" />
			<rect x="0.6" y="26.9" width="83" height="1" fill="#fff" opacity="0.18" />
		</g>
	{/snippet}

	<!-- the TV's light on the floor, and the TV's own floor shadow -->
	<g clip-path={ref('floor')}>
		<ellipse class="tv-games-pool" cx="152" cy="34" rx="168" ry="40" fill={ref('pool')} />
		<ellipse cx="152" cy="21" rx="128" ry="3.5" fill="#000" opacity="0.45" filter={ref('blur')} />
	</g>

	<!-- two cases stacked spine-out (right), a third tossed on top -->
	<ellipse cx="254" cy="69" rx="48" ry="3.6" fill="#000" opacity="0.55" filter={ref('blur')} />
	{@render flatCase(208, 35.6, 'b', '#56645f')}
	{@render flatCase(213, 28.8, 'a', '#4a5729')}
	<g transform="translate(252 40) scale(1 0.4) rotate(-7) scale(1.4) translate(-20 -25.5)">
		<rect width="40" height="51" rx="1.8" fill="#0f2350" />
	</g>
	<g transform="translate(252 37) scale(1 0.4) rotate(-7) scale(1.4) translate(-20 -25.5)">
		{@render cover('c')}
		<path class="tv-games-lit" d="M1.5 1.2 H38.5" stroke="#cfe3ff" stroke-width="1.2" stroke-linecap="round" vector-effect="non-scaling-stroke" />
	</g>

	<!-- the console (left), seen from the front and a little above, after the 2006 original: a big
	     glossy pillow-shaped top, a black flap on the left, the silver panel with the disc slot on the
	     right (cut corner where they meet), all floating on a darker ribbed base -->
	<ellipse cx="79" cy="78" rx="72" ry="4" fill="#000" opacity="0.6" filter={ref('blur')} />
	<rect x="17" y="68" width="124" height="9" rx="2" fill="#141416" stroke="#000" stroke-width="0.6" />
	{#each VENTS as vx (vx)}
		<path d="M{vx} 71.6 V75.6" stroke="#2e2e34" stroke-width="0.9" />
	{/each}
	<path
		d="M8 67 V50.5 C8 46.5 9.6 44.6 13 43 L23.5 32.6 C25.2 31 27.4 30.3 30.5 30.3 H127.5 C130.6 30.3 132.8 31 134.5 32.6 L145 43 C148.4 44.6 150 46.5 150 50.5 V67 C150 69.8 148.4 71 145.5 71 H12.5 C9.6 71 8 69.8 8 67 Z"
		fill={ref('ps-body')}
		stroke="#000"
		stroke-width="1"
	/>
	<path d={PS_TOP} fill={ref('ps-top')} />
	<g clip-path={ref('ps-topclip')}>
		<ellipse cx="72" cy="35.2" rx="74" ry="2.6" fill="#fff" opacity="0.17" />
		<ellipse cx="88" cy="41.4" rx="62" ry="1.5" fill="#fff" opacity="0.12" />
	</g>
	<path class="tv-games-lit" d="M31 30.9 H127" stroke="#cfe3ff" stroke-width="1.3" stroke-linecap="round" />
	<!-- the rounded front edge catches the light -->
	<path d="M14 45.2 C38 48.4 120 48.4 144 45.2" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="1" />
	<path class="tv-games-lit" d="M16 45.6 C40 48.6 118 48.6 142 45.6" fill="none" stroke="#cfe3ff" stroke-width="1.2" stroke-linecap="round" />
	<rect x="10" y="49.5" width="138" height="2" fill="#fff" opacity="0.05" />
	<!-- the black flap on the left, USB ports under it -->
	<path d="M12 59.5 H58.5" stroke="#2f2f36" stroke-width="0.7" />
	<path d="M12 60.3 H58.5" stroke="#000" stroke-width="0.5" opacity="0.6" />
	{#each [14, 19.5, 25, 30.5] as ux (ux)}
		<rect x={ux} y="63.6" width="3.6" height="1.8" rx="0.3" fill="#050506" stroke="#3e3e46" stroke-width="0.5" />
	{/each}
	<!-- the silver panel: disc slot, the black button strip, power LED -->
	<path d="M60.5 50 H64.5 L60.5 56 Z" fill="#050506" />
	<path
		d="M64.5 50 H146 Q147.5 50 147.5 51.5 V65 Q147.5 66.5 146 66.5 H60.5 V56 Z"
		fill={ref('chrome')}
		stroke="#2a2c30"
		stroke-width="0.6"
	/>
	<path d="M70 53.4 H141" stroke="#121214" stroke-width="1.5" stroke-linecap="round" />
	<path d="M70.5 54.9 H140.5" stroke="#fff" stroke-opacity="0.8" stroke-width="0.6" />
	<rect x="66" y="60.4" width="79.5" height="4.6" rx="1" fill="#16161a" />
	<g fill="none" stroke="#8c8c95" stroke-width="0.55" stroke-linecap="round">
		<path d="M123.3 61.9 A1.5 1.5 0 1 0 125.1 61.9" />
		<path d="M124.2 61 V62.6" />
		<path d="M132.4 63.2 L134.2 61 L136 63.2 Z" />
		<path d="M132.4 64.1 H136" />
	</g>
	<circle cx="116.5" cy="62.7" r="3.2" fill={on ? '#5dff6a' : '#ff3a2c'} opacity="0.5" filter={ref('glow')} />
	<circle cx="116.5" cy="62.7" r="1.15" fill={on ? '#c9ffc9' : '#ff6a5a'} stroke={on ? '#2fd848' : '#d42416'} stroke-width="0.5" />

	<!-- the pad's cable, from the front USB port across the floor -->
	<path d="M32.3 66 C34 91 97 98 134 85 S181.2 57.5 183.4 67.5" fill="none" stroke="#0d0d10" stroke-width="2.2" stroke-linecap="round" />
	<path d="M32.3 66 C34 91 97 98 134 85 S181.2 57.5 183.4 67.5" fill="none" stroke="#4c4c55" stroke-width="0.6" stroke-linecap="round" transform="translate(-0.4 -0.6)" opacity="0.8" />
	<rect x="30.6" y="64.4" width="3.4" height="2.8" rx="0.5" fill="#8f959b" />

	<!-- a case leaning on the console's right end -->
	<g transform="translate(186 72) rotate(-8) translate(-34.4 -43.9) scale(0.86)">
		<rect x="1" y="49" width="38" height="5" rx="1" fill="#000" opacity="0.45" filter={ref('blur')} />
		<rect x="40" y="0.8" width="2.6" height="50" rx="0.8" fill="#123072" />
		{@render cover('a')}
		<path class="tv-games-lit" d="M1 0.8 H39" stroke="#cfe3ff" stroke-width="1.2" stroke-linecap="round" />
	</g>

	<!-- a case lying in front, and a loose disc -->
	<ellipse cx="66" cy="96" rx="28" ry="4.5" fill="#000" opacity="0.5" filter={ref('blur')} />
	<g transform="translate(66 91) scale(1 0.4) rotate(-14) scale(1.05) translate(-20 -25.5)">
		<rect width="40" height="51" rx="1.8" fill="#0f2350" />
	</g>
	<g transform="translate(66 88) scale(1 0.4) rotate(-14) scale(1.05) translate(-20 -25.5)">
		{@render cover('b')}
	</g>
	<ellipse cx="114" cy="97.5" rx="14" ry="3" fill="#000" opacity="0.45" filter={ref('blur')} />
	<ellipse cx="114" cy="95" rx="13.5" ry="5.4" fill={ref('disc')} stroke="#7d848c" stroke-width="0.5" />
	<ellipse cx="114" cy="95" rx="9.5" ry="3.8" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="0.6" />
	<ellipse cx="114" cy="95" rx="4.6" ry="1.85" fill="#c3cad1" stroke="#8a9199" stroke-width="0.4" />
	<ellipse cx="114" cy="95" rx="1.9" ry="0.8" fill="#140d08" />

	<!-- the pad: a DualShock 3 seen from above (outline and button places measured off the top-down
	     layout drawing on Wikimedia Commons, details after the photo on Wikipedia's DualShock page) -->
	{#snippet padShape(fill: string, stroke: string, sw: number)}
		<g {fill} {stroke} stroke-width={sw} stroke-linejoin="round">
			<path d={GRIP} />
			<path d={GRIP} transform="translate({MID * 2} 0) scale(-1 1)" />
			<rect x="24.3" y="8.6" width={MID * 2 - 48.6} height="26.8" rx="1.5" />
			<circle cx={WING.l} cy={WING.y} r={WING.rad} />
			<circle cx={WING.r} cy={WING.y} r={WING.rad} />
			<circle cx={STICK.l} cy={STICK.y} r={STICK.ring} />
			<circle cx={STICK.r} cy={STICK.y} r={STICK.ring} />
		</g>
	{/snippet}
	<ellipse cx="186" cy="97" rx="34" ry="5" fill="#000" opacity="0.55" filter={ref('blur')} />
	<g transform="translate(186 82.5) scale(1 0.86) rotate(-10) scale(0.8) translate(-40.7 -27)">
		{@render padShape('#050506', '#050506', 1.8)}
	</g>
	<g transform="translate(186 80) scale(1 0.86) rotate(-10) scale(0.8) translate(-40.7 -27)">
		<!-- L1 / R1 on top of the wings, the L2 / R2 lip behind them -->
		{#each [WING.l, WING.r] as sx (sx)}
			<path
				d="M{sx - 7.1} 10 V5 C{sx - 7.1} 2.4 {sx - 5.1} 1.1 {sx - 2.7} 1.1 H{sx + 2.7} C{sx + 5.1} 1.1 {sx + 7.1} 2.4 {sx + 7.1} 5 V10 Z"
				fill="#1f1f25"
				stroke="#000"
				stroke-width="0.6"
			/>
			<path d="M{sx - 6.4} 3.6 C{sx - 4} 2.6 {sx + 4} 2.6 {sx + 6.4} 3.6" fill="none" stroke="#000" stroke-width="0.5" />
			<path d="M{sx - 5} 2 H{sx + 5}" stroke="#fff" stroke-opacity="0.22" stroke-width="0.5" stroke-linecap="round" />
		{/each}
		<!-- the body: a black outline pass, then the fill on top, so the pieces read as one shape -->
		{@render padShape('#000', '#000', 1.8)}
		{@render padShape(ref('pad-u'), 'none', 0)}
		<path d="M3.9 17.1 A12.6 12.6 0 0 1 22 10.5" fill="none" stroke="#fff" stroke-opacity="0.26" stroke-width="0.9" stroke-linecap="round" />
		<path d="M59.4 10.5 A12.6 12.6 0 0 1 77.5 17.1" fill="none" stroke="#fff" stroke-opacity="0.2" stroke-width="0.9" stroke-linecap="round" />
		<path d="M2.4 28 C1.4 33 1 38 1.4 42" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="0.8" stroke-linecap="round" />
		<rect x="25.6" y="9.8" width={MID * 2 - 51.2} height="15" rx="1.4" fill="#0b0b0e" opacity="0.6" />
		<!-- the d-pad: four separate arrow buttons in a cross-shaped dip -->
		<g fill="#09090c">
			<rect x={WING.l - 3.4} y={WING.y - 10} width="6.8" height="20" rx="1.6" />
			<rect x={WING.l - 10} y={WING.y - 3.4} width="20" height="6.8" rx="1.6" />
		</g>
		{#each [0, 90, 180, 270] as a (a)}
			<g transform="rotate({a} {WING.l} {WING.y})">
				<path
					d="M{WING.l - 2.4} {WING.y - 2.8} V{WING.y - 7.6} Q{WING.l - 2.4} {WING.y - 8.6} {WING.l - 1.4} {WING.y - 8.6} H{WING.l + 1.4} Q{WING.l + 2.4} {WING.y - 8.6} {WING.l + 2.4} {WING.y - 7.6} V{WING.y - 2.8} L{WING.l} {WING.y - 0.8} Z"
					fill="#26262d"
					stroke="#45454f"
					stroke-width="0.35"
				/>
				<path d="M{WING.l - 0.7} {WING.y - 5.6} L{WING.l} {WING.y - 6.6} L{WING.l + 0.7} {WING.y - 5.6} Z" fill="#76767f" />
			</g>
		{/each}
		<!-- the face buttons in their cross-shaped dip -->
		<g fill="#09090c">
			<rect x={WING.r - 3.6} y={WING.y - 10.2} width="7.2" height="20.4" rx="3.2" />
			<rect x={WING.r - 10.2} y={WING.y - 3.6} width="20.4" height="7.2" rx="3.2" />
		</g>
		{#each FACE as b (b.shape)}
			<circle cx={b.x} cy={b.y} r="3" fill="#18181d" stroke="#000" stroke-width="0.4" />
			<circle cx={b.x - 0.7} cy={b.y - 0.8} r="1.2" fill="#fff" opacity="0.09" />
			<g fill="none" stroke={b.c} stroke-width="0.6" stroke-linejoin="round" stroke-linecap="round">
				{#if b.shape === 'triangle'}
					<path d="M{b.x} {b.y - 1.45} L{b.x + 1.4} {b.y + 1} H{b.x - 1.4} Z" />
				{:else if b.shape === 'circle'}
					<circle cx={b.x} cy={b.y} r="1.3" />
				{:else if b.shape === 'cross'}
					<path d="M{b.x - 1.2} {b.y - 1.2} L{b.x + 1.2} {b.y + 1.2} M{b.x + 1.2} {b.y - 1.2} L{b.x - 1.2} {b.y + 1.2}" />
				{:else}
					<rect x={b.x - 1.15} y={b.y - 1.15} width="2.3" height="2.3" />
				{/if}
			</g>
		{/each}
		<!-- select, start, the round centre button (no logo) -->
		<rect x="31.6" y="20.3" width="3" height="1.6" rx="0.5" fill="#26262d" stroke="#000" stroke-width="0.3" />
		<path d="M47.4 20 L50.2 21.1 L47.4 22.2 Z" fill="#26262d" stroke="#000" stroke-width="0.3" stroke-linejoin="round" />
		<circle cx={MID} cy="26.1" r="2.4" fill="#141418" stroke="#8f959b" stroke-width="0.45" />
		<circle cx={MID - 0.6} cy="25.5" r="0.85" fill="#fff" opacity="0.2" />
		<!-- the sticks: a raised ring, a dark well, the cap with its dished top -->
		{#each [STICK.l, STICK.r] as sx (sx)}
			<circle cx={sx} cy={STICK.y} r={STICK.ring - 0.3} fill="none" stroke="#2c2c33" stroke-width="0.5" />
			<circle cx={sx} cy={STICK.y} r="6.6" fill="#070709" />
			<circle cx={sx} cy={STICK.y} r="5.3" fill={ref('stick')} stroke="#000" stroke-width="0.5" />
			<circle cx={sx} cy={STICK.y} r="3.6" fill="none" stroke="#000" stroke-opacity="0.7" stroke-width="0.6" />
			<path d="M{sx - 3} {STICK.y - 1.6} A3.4 3.4 0 0 1 {sx + 1.2} {STICK.y - 3.2}" fill="none" stroke="#fff" stroke-opacity="0.3" stroke-width="0.5" />
		{/each}
		<!-- player LEDs on the front edge, number 1 lit while the TV is on -->
		{#each [MID - 4.5, MID - 1.5, MID + 1.5, MID + 4.5] as lx, i (lx)}
			<rect x={lx - 0.9} y="9.3" width="1.8" height="0.9" rx="0.4" fill={on && i === 0 ? '#ff4636' : '#2b1414'} />
		{/each}
		{#if on}
			<circle cx={MID - 4.5} cy="9.75" r="2.6" fill="#ff3a2c" opacity="0.55" filter={ref('glow')} />
		{/if}
	</g>
</svg>

<style>
	/* full TV width; the top 20 px reach up over the TV's feet, so the TV stands on the same floor */
	.tv-games {
		display: block;
		width: 100%;
		height: auto;
		margin-top: -20px;
		overflow: visible;
		pointer-events: none;
	}
	.tv-games-pool,
	.tv-games-lit {
		opacity: 0;
		transition: opacity 0.6s;
	}
	/* the screen's light: a soft flicker, like a picture changing */
	.tv-games-on .tv-games-pool,
	.tv-games-on .tv-games-lit {
		opacity: 1;
		animation: tv-games-flicker 3.4s steps(1) infinite;
	}
	.tv-games-on .tv-games-lit {
		stroke-opacity: 0.55;
	}
	@keyframes tv-games-flicker {
		0% {
			opacity: 0.85;
		}
		12% {
			opacity: 1;
		}
		26% {
			opacity: 0.7;
		}
		41% {
			opacity: 0.95;
		}
		55% {
			opacity: 0.78;
		}
		68% {
			opacity: 1;
		}
		83% {
			opacity: 0.66;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tv-games-on .tv-games-pool,
		.tv-games-on .tv-games-lit {
			animation: none;
			opacity: 0.9;
		}
	}
</style>
