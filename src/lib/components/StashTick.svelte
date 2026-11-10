<!--
	Abscar only: what a ticked camo box shows instead of ✔ — a little cartoon from the stash, picked
	per box by tickIcon() in ui.ts (leaf, bong, blunt, papers in two looks, pipe, cone joint, grinder,
	lighter, bud, space brownie). Our own drawings, no brands. 24 × 24 units, drawn at 30 px on the
	yellow box, so everything has a dark outline. Static on purpose (111 boxes): no animation here
	apart from the wiggle on the tick itself (.tick-leaf in app.css).
-->
<script lang="ts" module>
	/** [angle in degrees, length, width] of each leaflet, fanned out from the stem. */
	type Leaflet = [number, number, number];
	const LEAF: Leaflet[] = [
		[-96, 5.6, 2.8],
		[96, 5.6, 2.8],
		[-63, 8.6, 3.7],
		[63, 8.6, 3.7],
		[-31, 11.2, 4.3],
		[31, 11.2, 4.3],
		[0, 13.4, 4.8]
	];
	/** A small five-leaflet leaf for the grinder lid and the brownie. */
	const MINI: Leaflet[] = [
		[-64, 3, 1.4],
		[64, 3, 1.4],
		[-31, 4.1, 1.7],
		[31, 4.1, 1.7],
		[0, 5, 1.9]
	];
	const leaflet = ([, l, w]: Leaflet) =>
		`M0 0 C${w / 2} ${-l * 0.3} ${w / 2} ${-l * 0.72} 0 ${-l} C${-w / 2} ${-l * 0.72} ${-w / 2} ${-l * 0.3} 0 0 Z`;

	/** The bud: lumps drawn twice, first fat and dark (the outline), then the greens on top. */
	const BUD: [number, number, number][] = [
		[12, 6.4, 3.3],
		[8.6, 10.2, 3.5],
		[15.4, 10.2, 3.5],
		[12, 11.8, 3.6],
		[9.3, 14.8, 3.5],
		[14.7, 14.8, 3.5],
		[12, 18.4, 3.1]
	];
	const BUD_GREENS = ['#63c43e', '#4fae33', '#57b838', '#6ccc45', '#48a52e', '#5cbd3a', '#4fae33'];
	const TRICHOMES: [number, number][] = [
		[11, 5.2],
		[13.6, 7.4],
		[7.4, 9.6],
		[16.6, 11.4],
		[10.6, 12.6],
		[13.8, 13.4],
		[8.4, 16],
		[15.4, 16.4],
		[12.4, 19.4]
	];

	const O = '#2b1a0a'; // outline
	const SMOKE = '#7d7a75';
</script>

<script lang="ts">
	import type { TickIcon } from '#lib/ui.ts';

	let { icon }: { icon: TickIcon } = $props();
</script>

{#snippet smoke(x: number, y: number)}
	<path
		d="M{x} {y} q-1.3 -1.2 -0.1 -2.5 t-0.1 -2.5"
		fill="none"
		stroke={SMOKE}
		stroke-width="1.1"
		stroke-linecap="round"
		opacity="0.75"
	/>
{/snippet}

{#snippet miniLeaf(x: number, y: number, sx: number, sy: number, fill = '#4fae3a', stroke = '#1f5a17')}
	<g transform="translate({x} {y}) scale({sx} {sy})">
		{#each MINI as l (l[0])}
			<path d={leaflet(l)} transform="rotate({l[0]})" {fill} {stroke} stroke-width="0.6" />
		{/each}
	</g>
{/snippet}

{#snippet papers(cover: string, sheet: string, emblem: string)}
	<!-- a long flat booklet with the thumb notch in its cover and one straight paper pulled half
	     out, gum strip along its top (no brand: just a leaf) -->
	<path d="M3.6 13 L4.4 5.6 L19.8 6.4 L20.4 13 Z" fill={sheet} stroke={O} stroke-width="0.9" stroke-linejoin="round" />
	<path d="M5.2 7.6 L19.6 8.3" stroke={O} stroke-width="0.5" opacity="0.45" />
	<path
		d="M3.8 10.6 H9.4 A2.6 2.6 0 0 0 14.6 10.6 H20.2 Q21.4 10.6 21.4 11.8 V17.8 Q21.4 19 20.2 19 H3.8 Q2.6 19 2.6 17.8 V11.8 Q2.6 10.6 3.8 10.6 Z"
		fill={cover}
		stroke={O}
		stroke-width="1.1"
		stroke-linejoin="round"
	/>
	<path d="M4 12 H8.6 M15.4 12 H20" stroke="white" stroke-width="0.6" opacity="0.3" stroke-linecap="round" />
	{@render miniLeaf(12, 17.8, 0.8, 0.8, emblem, emblem)}
{/snippet}

<svg class="tick-leaf" viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-icon={icon}>
	{#if icon === 'leaf'}
		<path d="M12 16.5 C12 19 11.6 21 10.6 22.6" class="tick-leaf-stem" />
		{#each LEAF as l (l[0])}
			<g transform="translate(12 16.5) rotate({l[0]})">
				<path d={leaflet(l)} class="tick-leaf-blade" />
				<path d="M0 -0.5 L0 {-l[1] * 0.82}" class="tick-leaf-vein" />
			</g>
		{/each}
	{:else if icon === 'bong'}
		<!-- downstem + bowl behind the glass's front -->
		<path d="M11.6 19.4 L5.3 13.4" stroke={O} stroke-width="2.6" stroke-linecap="round" />
		<path d="M11.6 19.4 L5.3 13.4" stroke="#c9f1ff" stroke-width="1.1" stroke-linecap="round" />
		<!-- the glass: mouthpiece tube flaring into a beaker -->
		<path
			d="M9.2 3.2 H13.8 V12.6 L18.4 20.4 Q19.1 22.6 16.9 22.6 H6.1 Q3.9 22.6 4.6 20.4 L9.2 12.6 Z"
			fill="#c9f1ff"
			fill-opacity="0.78"
			stroke={O}
			stroke-width="1.1"
			stroke-linejoin="round"
		/>
		<path d="M6.45 17.6 H16.55 L18 20.4 Q18.5 21.9 16.9 21.9 H6.1 Q4.5 21.9 5 20.4 Z" fill="#3fa9dc" opacity="0.88" />
		<path d="M6.45 17.6 H16.55" stroke="#1d6f99" stroke-width="0.7" />
		<circle cx="10.2" cy="19.6" r="0.7" fill="white" opacity="0.85" />
		<circle cx="13.4" cy="20.3" r="0.5" fill="white" opacity="0.85" />
		<circle cx="12" cy="18.7" r="0.45" fill="white" opacity="0.85" />
		<rect x="8.6" y="2.2" width="5.8" height="1.6" rx="0.8" fill="#c9f1ff" stroke={O} stroke-width="1" />
		<path d="M9.2 7.8 h1.3 M13.8 7.8 h-1.3" stroke={O} stroke-width="0.9" />
		<path d="M10.3 4.6 V11.6" stroke="white" stroke-width="0.9" opacity="0.8" stroke-linecap="round" />
		<!-- the stem pokes out of the glass on the left, bowl with a bud on it -->
		<path d="M8 15.5 L5.3 13.4" stroke={O} stroke-width="2.6" stroke-linecap="round" />
		<path d="M8 15.5 L5.3 13.4" stroke="#c9f1ff" stroke-width="1.1" stroke-linecap="round" />
		<path d="M2.6 11.6 H7.6 L6.6 13.9 H3.6 Z" fill="#9aa3ad" stroke={O} stroke-width="1" stroke-linejoin="round" />
		<circle cx="5.1" cy="11.1" r="1.3" fill="#4fae3a" stroke="#1f5a17" stroke-width="0.7" />
		{@render smoke(5.1, 9.4)}
	{:else if icon === 'blunt'}
		<g transform="translate(11 14) rotate(-35)">
			<rect x="-9.5" y="-2.3" width="17.5" height="4.6" rx="2.3" fill="#7b4a22" stroke={O} stroke-width="1.1" />
			<path d="M-6 -2.1 l-1.5 4.2 M-2.5 -2.1 l-1.5 4.2 M1 -2.1 l-1.5 4.2 M4.5 -2.1 l-1.5 4.2" stroke="#4e2c10" stroke-width="0.8" />
			<path d="M-8 -1.2 H5" stroke="#b07a45" stroke-width="0.8" stroke-linecap="round" />
			<!-- grey ash with the glowing tip -->
			<path d="M5.8 -2.3 H8.8 Q10.8 -2.3 10.8 0 Q10.8 2.3 8.8 2.3 H5.8 Z" fill="#a39e97" stroke={O} stroke-width="1.1" stroke-linejoin="round" />
			<path d="M7.9 -1.6 Q10.1 -1.6 10.1 0 Q10.1 1.6 7.9 1.6 Z" fill="#ff5a1f" />
		</g>
		{@render smoke(19.7, 6.6)}
	{:else if icon === 'papersBrown'}
		{@render papers('#a86a33', '#ecd6ad', '#5a3415')}
	{:else if icon === 'papersBlack'}
		{@render papers('#1f1f22', '#ffffff', '#ececec')}
	{:else if icon === 'pipe'}
		<path
			d="M2.4 15.2 Q2 13.6 3.6 13.3 L12.6 11.6 Q14.2 7.6 18.2 7.8 Q22.4 8.2 22 12.6 Q21.6 17.2 16.8 17.4 Q13.9 17.5 12.7 15.4 L3.8 16.3 Q2.6 16.4 2.4 15.2 Z"
			fill="#9b5cf0"
			stroke={O}
			stroke-width="1.1"
			stroke-linejoin="round"
		/>
		<path
			d="M4.8 14.7 Q7.5 13.2 10.6 14.3 M14.2 14.6 Q16.5 16.8 19.8 14.4 M15.4 10.6 Q18 12.4 20.8 10.8"
			stroke="#2fd3b5"
			stroke-width="1.2"
			fill="none"
			stroke-linecap="round"
		/>
		<path d="M5 13.5 L12 12.2" stroke="white" stroke-width="0.8" opacity="0.7" stroke-linecap="round" />
		<ellipse cx="17.9" cy="9" rx="2.6" ry="1" fill={O} />
		<circle cx="17.3" cy="8.7" r="0.8" fill="#4fae3a" />
		<circle cx="18.6" cy="8.8" r="0.7" fill="#3c8f2c" />
		{@render smoke(18, 7.3)}
	{:else if icon === 'joint'}
		<g transform="translate(11.5 13.5) rotate(-35)">
			<path d="M-9.8 -1.15 L7 -2.9 Q8.4 0 7 2.9 L-9.8 1.15 Q-10.4 0 -9.8 -1.15 Z" fill="#fbf8f0" stroke={O} stroke-width="1.1" stroke-linejoin="round" />
			<path d="M-9.8 -1.15 L-6 -1.55 V1.55 L-9.8 1.15 Q-10.4 0 -9.8 -1.15 Z" fill="#e2c48f" stroke={O} stroke-width="0.9" stroke-linejoin="round" />
			<path d="M-5 0.5 L6 1.5" stroke="#bdb5a3" stroke-width="0.6" />
			<path d="M6.3 -2.85 L7 -2.9 Q8.4 0 7 2.9 L6.3 2.85 Q7.6 0 6.3 -2.85 Z" fill="#a39e97" />
			<path d="M7 -2.9 Q9.7 -1.6 9.7 0 Q9.7 1.6 7 2.9 Q8.4 0 7 -2.9 Z" fill="#ff5a1f" stroke={O} stroke-width="0.9" stroke-linejoin="round" />
		</g>
		{@render smoke(19.4, 6.7)}
	{:else if icon === 'grinder'}
		<path d="M4 9 V17.6 Q4 20.6 12 20.6 Q20 20.6 20 17.6 V9 Z" fill="#a3adb7" stroke={O} stroke-width="1.1" stroke-linejoin="round" />
		<path d="M4 13.4 Q4 16.2 12 16.2 Q20 16.2 20 13.4" fill="none" stroke={O} stroke-width="0.9" />
		<path d="M4 16 Q4 18.8 12 18.8 Q20 18.8 20 16" fill="none" stroke={O} stroke-width="0.7" opacity="0.7" />
		<path
			d="M5.8 10.8 v2.6 M8.2 11.6 v2.8 M10.6 11.9 v2.9 M13.4 11.9 v2.9 M15.8 11.6 v2.8 M18.2 10.8 v2.6"
			stroke="#5f6872"
			stroke-width="0.8"
		/>
		<path d="M5.4 16.8 Q6 19.2 9 19.6" fill="none" stroke="white" stroke-width="0.8" opacity="0.6" stroke-linecap="round" />
		<ellipse cx="12" cy="9" rx="8" ry="3" fill="#cfd6dd" stroke={O} stroke-width="1.1" />
		{@render miniLeaf(12, 10.8, 1, 0.5)}
	{:else if icon === 'lighter'}
		<path d="M13 1.2 Q16.3 4.6 14.6 6.8 Q13.7 7.8 12.4 7.6 Q10.6 7.2 11 5.2 Q11.4 3.6 13 1.2 Z" fill="#ff7a1a" stroke="#8a2400" stroke-width="0.8" />
		<path d="M12.9 3.9 Q14.4 5.4 13.6 6.6 Q12.6 7.2 12.2 6.2 Q12 5.2 12.9 3.9 Z" fill="#fff1a0" />
		<rect x="8.4" y="7.4" width="7.2" height="3.6" rx="0.4" fill="#c3cad2" stroke={O} stroke-width="1" />
		<circle cx="10" cy="9.2" r="0.45" fill="#5d6670" />
		<circle cx="11.6" cy="9.2" r="0.45" fill="#5d6670" />
		<circle cx="13.2" cy="9.2" r="0.45" fill="#5d6670" />
		<rect x="15.1" y="6.5" width="2.5" height="4.2" rx="1.25" fill="#6b737c" stroke={O} stroke-width="0.8" />
		<path d="M15.5 7.6 h1.7 M15.5 8.6 h1.7 M15.5 9.6 h1.7" stroke="#3b4148" stroke-width="0.4" />
		<rect x="7.8" y="10.6" width="9" height="12" rx="2.2" fill="#e8342a" stroke={O} stroke-width="1.1" />
		<path d="M10 12.8 V20.4" stroke="#ff9a8f" stroke-width="1.1" stroke-linecap="round" opacity="0.85" />
	{:else if icon === 'nug'}
		<!-- a sugar leaf poking out behind -->
		<path d={leaflet([0, 5, 2.2])} transform="translate(7.2 13.4) rotate(-118)" fill="#3d8f28" stroke="#1f4a12" stroke-width="0.8" />
		<path d={leaflet([0, 4.4, 2])} transform="translate(16.6 13.6) rotate(112)" fill="#3d8f28" stroke="#1f4a12" stroke-width="0.8" />
		{#each BUD as [cx, cy, r], i (i)}
			<circle {cx} {cy} r={r + 1} fill="#1f4a12" />
		{/each}
		{#each BUD as [cx, cy, r], i (i)}
			<circle {cx} {cy} {r} fill={BUD_GREENS[i]} />
		{/each}
		<path d="M9.6 8.4 q1.3 0.4 1.1 1.8 M14.2 9 q-1.2 0.7 -0.6 1.9 M10.8 15.4 q1 -0.9 2 -0.2 M13.6 17.6 q-0.4 1 0.4 1.6 M7.8 12.6 q1 0.5 0.8 1.6 M16.2 13 q-1 0.6 -0.5 1.6" stroke="#ff8c2a" stroke-width="0.8" fill="none" stroke-linecap="round" />
		<path d="M12.4 4.8 q0.8 0.8 0.2 1.8" stroke="#ff8c2a" stroke-width="0.8" fill="none" stroke-linecap="round" />
		{#each TRICHOMES as [cx, cy] (cx * 100 + cy)}
			<circle {cx} {cy} r="0.38" fill="white" opacity="0.9" />
		{/each}
	{:else if icon === 'brownie'}
		<path d="M14.6 11.8 L20.6 8 V15.2 L14.6 19.2 Z" fill="#4a2810" stroke={O} stroke-width="1.1" stroke-linejoin="round" />
		<path d="M3.4 11.4 L14.6 11.8 V19.2 L3.4 18.8 Z" fill="#6a3c1c" stroke={O} stroke-width="1.1" stroke-linejoin="round" />
		<path d="M3.4 11.4 L9.6 7.6 L20.6 8 L14.6 11.8 Z" fill="#9a6236" stroke={O} stroke-width="1.1" stroke-linejoin="round" />
		<path d="M6.4 10.4 l1.8 0.3 l1.2 -0.7 M15.2 9.2 l1.5 0.4 l0.9 -0.5" stroke="#6a3c1c" stroke-width="0.6" fill="none" stroke-linecap="round" />
		<rect x="5.4" y="13.5" width="1.5" height="1.2" rx="0.3" fill="#2b1608" />
		<rect x="9.6" y="15.8" width="1.4" height="1.2" rx="0.3" fill="#2b1608" />
		<rect x="11.8" y="13.2" width="1.3" height="1.1" rx="0.3" fill="#2b1608" />
		<rect x="6.6" y="16.6" width="1.2" height="1" rx="0.3" fill="#2b1608" />
		<rect x="17.2" y="12.4" width="1.2" height="1.1" rx="0.3" fill="#24130a" />
		{@render miniLeaf(12, 10.4, 0.85, 0.85)}
	{/if}
</svg>
