<!--
	Burger Stack's hero picture (BurgiArcade): a tall, wobbly burger tower on a plate (bun, patty, cheese
	with drips, lettuce, tomato, onion, bacon, another patty, a sesame top bun leaning over), a cut-off tomato
	slice tumbling away and a PERFECT sparkle. Our own chunky cartoon, 64×64, decorative.
-->
<script lang="ts">
	let { size = 64 }: { size?: number } = $props();
	const uid = $props.id();
	const O = '#140a06';
</script>

<svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false" class="bs-art">
	<defs>
		<linearGradient id="{uid}-bun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f9c56a" /><stop offset=".5" stop-color="#e8a046" /><stop offset="1" stop-color="#a4531a" /></linearGradient>
		<radialGradient id="{uid}-top" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#ffe6ad" /><stop offset=".5" stop-color="#f2a64c" /><stop offset="1" stop-color="#ad571b" /></radialGradient>
		<linearGradient id="{uid}-pat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8622f" /><stop offset="1" stop-color="#3a1a08" /></linearGradient>
		<linearGradient id="{uid}-che" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066" /><stop offset="1" stop-color="#e89a00" /></linearGradient>
		<linearGradient id="{uid}-tom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6d55" /><stop offset="1" stop-color="#9a110b" /></linearGradient>
		<linearGradient id="{uid}-plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" /><stop offset="1" stop-color="#aab6c8" /></linearGradient>
		<radialGradient id="{uid}-glow"><stop offset="0" stop-color="#ffd23a" stop-opacity=".55" /><stop offset="1" stop-color="#ffd23a" stop-opacity="0" /></radialGradient>
	</defs>
	<circle cx="32" cy="30" r="30" fill="url(#{uid}-glow)" />
	<!-- plate -->
	<ellipse cx="32" cy="59" rx="25" ry="3.6" fill="url(#{uid}-plate)" stroke={O} stroke-width="1.6" />
	<ellipse cx="32" cy="58.6" rx="19" ry="2" fill="#dde5f0" />
	<!-- bottom bun -->
	<path d="M13 51 H51 V54 Q51 58 47 58 H17 Q13 58 13 54 Z" fill="url(#{uid}-bun)" stroke={O} stroke-width="1.8" stroke-linejoin="round" />
	<rect x="13.8" y="51.6" width="36.4" height="1.6" fill="#fde4b4" />
	<!-- patty -->
	<rect x="12" y="45.6" width="39" height="5.8" rx="2.9" fill="url(#{uid}-pat)" stroke={O} stroke-width="1.8" />
	<circle cx="19" cy="48.2" r=".8" fill="#2a0d03" /><circle cx="30" cy="47.6" r=".7" fill="#2a0d03" /><circle cx="42" cy="48.6" r=".8" fill="#2a0d03" />
	<!-- cheese with drips -->
	<path d="M14 42.6 H52 V45.6 H47 V48.4 Q45.8 49.6 44.6 48.4 V45.6 H30 V47.6 Q28.8 48.8 27.6 47.6 V45.6 H14 Z" fill="url(#{uid}-che)" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
	<!-- lettuce -->
	<path d="M11.6 39.4 Q14 37.6 16.4 39.4 Q18.8 37.6 21.2 39.4 Q23.6 37.6 26 39.4 Q28.4 37.6 30.8 39.4 Q33.2 37.6 35.6 39.4 Q38 37.6 40.4 39.4 Q42.8 37.6 45.2 39.4 Q47.6 37.6 50 39.4 L50.4 42.8 Q48 44.6 45.6 42.8 Q43.2 44.6 40.8 42.8 Q38.4 44.6 36 42.8 Q33.6 44.6 31.2 42.8 Q28.8 44.6 26.4 42.8 Q24 44.6 21.6 42.8 Q19.2 44.6 16.8 42.8 Q14.4 44.6 12 42.8 Z" fill="#5cc23e" stroke={O} stroke-width="1.5" stroke-linejoin="round" />
	<!-- tomato -->
	<rect x="15" y="35" width="37" height="4.6" rx="2.3" fill="url(#{uid}-tom)" stroke={O} stroke-width="1.6" />
	<path d="M33 35.4 V39.2" stroke="#6e0804" stroke-width="1" />
	<ellipse cx="22" cy="37.3" rx="1.6" ry=".9" fill="#ffd896" /><ellipse cx="42" cy="37.3" rx="1.6" ry=".9" fill="#ffd896" />
	<!-- onion -->
	<rect x="13" y="31.4" width="36" height="3.8" rx="1.9" fill="#ead8f5" stroke={O} stroke-width="1.5" />
	<path d="M15 33.3 H47" stroke="#a46cc8" stroke-width=".8" />
	<!-- bacon -->
	<path d="M15 27.6 Q20 26 25 27.6 T35 27.6 T45 27.6 T52 27.4 L52 30.8 Q47 32.4 42 30.8 T32 30.8 T22 30.8 T15 31 Z" fill="#b8301f" stroke={O} stroke-width="1.5" stroke-linejoin="round" />
	<path d="M16 29.2 Q21 27.8 26 29.2 T36 29.2 T46 29.2 T51 29" fill="none" stroke="#ffcdb8" stroke-width="1.1" />
	<!-- second patty -->
	<rect x="16" y="21.6" width="37" height="6" rx="3" fill="url(#{uid}-pat)" stroke={O} stroke-width="1.8" />
	<circle cx="24" cy="24.4" r=".8" fill="#2a0d03" /><circle cx="37" cy="24" r=".7" fill="#2a0d03" /><circle cx="47" cy="25" r=".8" fill="#2a0d03" />
	<!-- top bun, leaning a little -->
	<g transform="rotate(-6 34 16)">
		<path d="M16 21.6 Q16 7 34 7 Q52 7 52 21.6 Z" fill="url(#{uid}-top)" stroke={O} stroke-width="1.9" stroke-linejoin="round" />
		<path d="M21 13.6 Q24 9.6 30 9.2" fill="none" stroke="#fff6dc" stroke-width="1.6" stroke-linecap="round" opacity=".8" />
		{#each [[26, 12.4, -20], [33, 10.6, 0], [40, 12, 18], [45, 16, 30], [22, 17, -30], [36, 15.6, 6]] as [x, y, r] (`${x}-${y}`)}
			<ellipse cx={x} cy={y} rx="1.5" ry=".8" fill="#fff5da" stroke="#a8641e" stroke-width=".4" transform="rotate({r} {x} {y})" />
		{/each}
	</g>
	<!-- a cut-off tomato slice tumbling away -->
	<g transform="rotate(38 57 40)">
		<rect x="52" y="38" width="10" height="4.4" rx="2.2" fill="url(#{uid}-tom)" stroke={O} stroke-width="1.5" />
	</g>
	<path d="M53 30 q2 2 1 5 M57.6 31.4 q1.6 2.4 .4 5" fill="none" stroke="#fff6dc" stroke-width="1.1" stroke-linecap="round" opacity=".7" />
	<!-- sparkles -->
	<path d="M9 14 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 l3 -1.2 Z" fill="#fff6b0" stroke="#b86e00" stroke-width=".6" />
	<path d="M56 6 l.9 2.2 l2.2 .9 l-2.2 .9 l-.9 2.2 l-.9 -2.2 l-2.2 -.9 l2.2 -.9 Z" fill="#fff6b0" stroke="#b86e00" stroke-width=".5" />
</svg>

<style>
	.bs-art {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.35));
	}
</style>
