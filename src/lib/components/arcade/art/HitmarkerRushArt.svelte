<!--
	Hitmarker Rush's hero picture (BurgiArcade, 2026-11-22): a plywood bullseye dummy popping up from behind
	sandbags, a white hitmarker X on the bullseye, splinters and sparks flying. Our own cartoon in the casino
	symbols' style (thick dark outlines, glossy fills). 64×64 viewBox; decorative (aria-hidden).
-->
<script lang="ts">
	let { size = 64 }: { size?: number } = $props();
	const uid = $props.id();
	const O = '#1a0630';
	const SPLINTERS = [
		[50, 30, 20],
		[54, 40, -30],
		[13, 31, -15],
		[9, 42, 35],
		[46, 22, 60]
	];
</script>

<svg class="hm-art" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
	<defs>
		<radialGradient id="{uid}-glow" cx="50%" cy="50%" r="50%">
			<stop offset="0" stop-color="#ff6a3a" stop-opacity=".55" />
			<stop offset=".6" stop-color="#d8245a" stop-opacity=".22" />
			<stop offset="1" stop-color="#7a1f5e" stop-opacity="0" />
		</radialGradient>
		<linearGradient id="{uid}-wood" x1="0" y1="0" x2=".6" y2="1">
			<stop offset="0" stop-color="#f8d596" />
			<stop offset=".5" stop-color="#dda55f" />
			<stop offset="1" stop-color="#a7672e" />
		</linearGradient>
		<linearGradient id="{uid}-bag" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#e6c88a" />
			<stop offset="1" stop-color="#8f6a36" />
		</linearGradient>
		<clipPath id="{uid}-body">
			<path d="M11 58 L11 41 Q11 30.5 21.5 30 L27 30 L27 26 L37 26 L37 30 L42.5 30 Q53 30.5 53 41 L53 58 Z" />
			<circle cx="32" cy="16.5" r="10" />
		</clipPath>
	</defs>
	<circle cx="32" cy="33" r="30" fill="url(#{uid}-glow)" />
	<!-- the dummy -->
	<g>
		<path d="M11 58 L11 41 Q11 30.5 21.5 30 L27 30 L27 26 L37 26 L37 30 L42.5 30 Q53 30.5 53 41 L53 58 Z" fill="url(#{uid}-wood)" />
		<circle cx="32" cy="16.5" r="10" fill="url(#{uid}-wood)" />
		<g clip-path="url(#{uid}-body)" stroke="#7a3e14" stroke-opacity=".35" stroke-width=".8" fill="none">
			<path d="M15 6 C17 24 13 40 16 60" /><path d="M22 6 C24 24 20 40 23 60" /><path d="M41 6 C43 24 39 40 42 60" /><path d="M48 6 C50 24 46 40 49 60" />
		</g>
		<path d="M11 58 L11 41 Q11 30.5 21.5 30 L27 30 L27 26 L37 26 L37 30 L42.5 30 Q53 30.5 53 41 L53 58 Z" fill="none" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
		<circle cx="32" cy="16.5" r="10" fill="none" stroke={O} stroke-width="2.6" />
		<path d="M14.5 41 Q14.5 34 21.5 33.4" fill="none" stroke="#fff5d8" stroke-opacity=".7" stroke-width="1.4" stroke-linecap="round" />
		<path d="M25.5 11.5 Q28 8.6 31.5 8.4" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round" />
		<circle cx="32" cy="16.5" r="4" fill="#e2261f" stroke={O} stroke-width="1" />
		<circle cx="32" cy="16.5" r="1.6" fill="#fff6ea" />
		<!-- bullseye -->
		<circle cx="32" cy="43" r="10" fill="#fff6ea" stroke={O} stroke-width="1.6" />
		<circle cx="32" cy="43" r="7.6" fill="#e2261f" />
		<circle cx="32" cy="43" r="5.2" fill="#fff6ea" />
		<circle cx="32" cy="43" r="2.8" fill="#e2261f" />
		<circle cx="18" cy="36" r="1.4" fill="#c9c4cf" stroke={O} stroke-width=".6" />
		<circle cx="46" cy="36" r="1.4" fill="#c9c4cf" stroke={O} stroke-width=".6" />
	</g>
	<!-- splinters + sparks -->
	{#each SPLINTERS as [x, y, r], i (i)}
		<path d="M{x - 3} {y - 1} L{x + 2.6} {y - 1.8} L{x + 1.6} {y + 1.6} L{x - 2.2} {y + 1.4} Z" fill={i % 2 ? '#dda55f' : '#f8d596'} stroke={O} stroke-width=".8" transform="rotate({r} {x} {y})" />
	{/each}
	<path d="M8 22 l1 2.4 l2.4 1 l-2.4 1 l-1 2.4 l-1 -2.4 l-2.4 -1 l2.4 -1 Z M56 48 l.8 2 l2 .8 l-2 .8 l-.8 2 l-.8 -2 l-2 -.8 l2 -.8 Z" fill="#fff3a0" stroke="#b86e00" stroke-width=".5" />
	<!-- the hitmarker -->
	<g class="hm-x" stroke-linecap="round">
		<path d="M27 38 L22.6 33.6 M37 38 L41.4 33.6 M27 48 L22.6 52.4 M37 48 L41.4 52.4" stroke={O} stroke-width="4.6" />
		<path d="M27 38 L22.6 33.6 M37 38 L41.4 33.6 M27 48 L22.6 52.4 M37 48 L41.4 52.4" stroke="#ffffff" stroke-width="2.2" />
	</g>
	<!-- sandbags in front -->
	{#each [[4, 53], [18, 53], [32, 53], [46, 53]] as [x, y], i (i)}
		<rect x={x} y={y} width="15" height="8.6" rx="4" fill="url(#{uid}-bag)" stroke={O} stroke-width="1.6" />
		<path d="M{x + 3} {y + 2.4} Q{x + 7.5} {y + 1} {x + 12} {y + 2.4}" fill="none" stroke="#fff5d8" stroke-opacity=".6" stroke-width=".9" stroke-linecap="round" />
	{/each}
</svg>

<style>
	.hm-art {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.35));
	}
	.hm-x {
		transform-box: fill-box;
		transform-origin: center;
		animation: hm-x-pop 1.6s ease-out infinite;
	}
	@keyframes hm-x-pop {
		0%,
		60%,
		100% {
			transform: scale(1);
		}
		8% {
			transform: scale(1.25);
		}
		20% {
			transform: scale(0.95);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.hm-x {
			animation: none;
		}
	}
</style>
