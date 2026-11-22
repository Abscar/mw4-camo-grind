<!--
	Abscar's Pinball's hero picture (BurgiArcade): a little pinball table seen from above at a tilt, with three
	burger bumpers, two red-rubbered flippers, a chrome ball flying up with a spark trail and a glowing ramp.
	Our own chunky cartoon, 64×64, decorative.
-->
<script lang="ts">
	let { size = 64 }: { size?: number } = $props();
	const uid = $props.id();
	const O = '#14060a';
	const BUMPS: [number, number][] = [
		[24, 20],
		[40, 20],
		[32, 30]
	];
</script>

<svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false" class="pb-art">
	<defs>
		<linearGradient id="{uid}-field" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1a56" /><stop offset="1" stop-color="#0a0c1e" /></linearGradient>
		<linearGradient id="{uid}-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a1f0e" /><stop offset=".5" stop-color="#7a4620" /><stop offset="1" stop-color="#3a1f0e" /></linearGradient>
		<radialGradient id="{uid}-ball" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" /><stop offset=".4" stop-color="#cfd8e4" /><stop offset="1" stop-color="#3a424e" /></radialGradient>
		<radialGradient id="{uid}-cap" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ff8a7a" /><stop offset="1" stop-color="#a0101a" /></radialGradient>
		<radialGradient id="{uid}-glow"><stop offset="0" stop-color="#ffd23a" stop-opacity=".9" /><stop offset="1" stop-color="#ffd23a" stop-opacity="0" /></radialGradient>
	</defs>
	<!-- cabinet + playfield (a trapezoid: the table leans away from you) -->
	<path d="M10 6 L54 6 L60 60 L4 60 Z" fill="url(#{uid}-wood)" stroke={O} stroke-width="2.4" stroke-linejoin="round" />
	<path d="M14 12 Q32 2 50 12 L55 56 L9 56 Z" fill="url(#{uid}-field)" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
	<!-- the ramp -->
	<path d="M14 44 Q12 14 32 10 Q50 10 50 36" fill="none" stroke="#ff5a3a" stroke-opacity=".55" stroke-width="5" stroke-linecap="round" />
	<path d="M14 44 Q12 14 32 10 Q50 10 50 36" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1" stroke-dasharray="2 3" />
	<!-- burger bumpers -->
	{#each BUMPS as [x, y], i (i)}
		{#if i === 0}<circle cx={x} cy={y} r="9" fill="url(#{uid}-glow)" class="pb-flash" />{/if}
		<circle cx={x} cy={y} r="5.2" fill="#e8a046" stroke={O} stroke-width="1.4" />
		<circle cx={x} cy={y} r="3.4" fill="url(#{uid}-cap)" stroke={O} stroke-width="1" />
		<circle cx={x - 1} cy={y - 1} r=".6" fill="#fff6d0" />
	{/each}
	<!-- slings -->
	<path d="M15 40 L15 47 L21 50 Z" fill="#7a1010" stroke="#fff" stroke-width="1.1" stroke-linejoin="round" />
	<path d="M49 40 L49 47 L43 50 Z" fill="#7a1010" stroke="#fff" stroke-width="1.1" stroke-linejoin="round" />
	<!-- flippers -->
	<path d="M20 51 L30 55 Q31.5 56.5 30 57 L19 54.5 Q17 52.5 20 51 Z" fill="#f4f6fa" stroke="#d0141a" stroke-width="1.4" stroke-linejoin="round" class="pb-flip" />
	<path d="M44 51 L34 55 Q32.5 56.5 34 57 L45 54.5 Q47 52.5 44 51 Z" fill="#f4f6fa" stroke="#d0141a" stroke-width="1.4" stroke-linejoin="round" />
	<!-- the ball, flying up with a spark trail -->
	<path d="M27 50 L33 40" stroke="#ffb07a" stroke-opacity=".6" stroke-width="3.4" stroke-linecap="round" />
	<g class="pb-ball">
		<circle cx="34.5" cy="37.5" r="3.6" fill="url(#{uid}-ball)" stroke={O} stroke-width="1" />
	</g>
	<path d="M37 30 l1.2 -3 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 z" fill="#fff6b0" class="pb-spark" />
	<!-- lane letters -->
	<text x="25" y="14.5" font-size="4.2" font-weight="900" fill="#ffd23a" text-anchor="middle" font-family="Bahnschrift, Segoe UI, sans-serif">G</text>
	<text x="32" y="13" font-size="4.2" font-weight="900" fill="#dfe8f4" text-anchor="middle" font-family="Bahnschrift, Segoe UI, sans-serif">P</text>
	<text x="39" y="14.5" font-size="4.2" font-weight="900" fill="#ff3a5a" text-anchor="middle" font-family="Bahnschrift, Segoe UI, sans-serif">H</text>
</svg>

<style>
	.pb-flash {
		animation: pb-pulse 1.2s ease-in-out infinite;
	}
	.pb-spark {
		transform-box: fill-box;
		transform-origin: center;
		animation: pb-twinkle 1.6s ease-in-out infinite;
	}
	@keyframes pb-pulse {
		50% {
			opacity: 0.25;
		}
	}
	@keyframes pb-twinkle {
		50% {
			transform: scale(0.4) rotate(45deg);
			opacity: 0.5;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pb-flash,
		.pb-spark {
			animation: none;
		}
	}
</style>
