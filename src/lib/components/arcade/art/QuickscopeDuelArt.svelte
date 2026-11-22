<!--
	Quickscope Duel's hero picture (BurgiArcade, 2026-11-22): looking through a sniper scope at a dusty desert
	rooftop where an enemy sniper's lens glints, crosshair reticle with a red dot, a gunmetal ring with knurling
	and side turrets, glass glare. Our own cartoon in the casino symbols' style. 64×64 viewBox; decorative.
-->
<script lang="ts">
	let { size = 64 }: { size?: number } = $props();
	const uid = $props.id();
	const O = '#1a0630';
	const KNURL = Array.from({ length: 36 }, (_, i) => {
		const a = (i * 10 * Math.PI) / 180;
		const p = (r: number) => `${(32 + r * Math.cos(a)).toFixed(2)} ${(33 + r * Math.sin(a)).toFixed(2)}`;
		return `M${p(24.6)} L${p(27.4)}`;
	});
</script>

<svg class="qs-art" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id="{uid}-sky" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#d06a48" />
			<stop offset=".55" stop-color="#f6a85e" />
			<stop offset="1" stop-color="#ffdca0" />
		</linearGradient>
		<linearGradient id="{uid}-ring" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#a49cb2" />
			<stop offset=".35" stop-color="#4f4858" />
			<stop offset=".7" stop-color="#211c28" />
			<stop offset="1" stop-color="#3e3848" />
		</linearGradient>
		<radialGradient id="{uid}-vig" cx="50%" cy="50%" r="50%">
			<stop offset=".62" stop-color="#000" stop-opacity="0" />
			<stop offset=".9" stop-color="#140810" stop-opacity=".45" />
			<stop offset="1" stop-color="#050205" stop-opacity=".9" />
		</radialGradient>
		<radialGradient id="{uid}-glint" cx="50%" cy="50%" r="50%">
			<stop offset="0" stop-color="#fffbe0" />
			<stop offset=".35" stop-color="#ffe08a" stop-opacity=".7" />
			<stop offset="1" stop-color="#ffb040" stop-opacity="0" />
		</radialGradient>
		<clipPath id="{uid}-lens"><circle cx="32" cy="33" r="24.6" /></clipPath>
	</defs>
	<!-- side turrets -->
	<rect x="1" y="27" width="8" height="12" rx="2.4" fill="#2e2836" stroke={O} stroke-width="1.6" />
	<rect x="55" y="27" width="8" height="12" rx="2.4" fill="#2e2836" stroke={O} stroke-width="1.6" />
	<rect x="26" y="1.6" width="12" height="6" rx="2" fill="#2e2836" stroke={O} stroke-width="1.6" />
	<path d="M3 30 h4 M3 33 h4 M3 36 h4 M57 30 h4 M57 33 h4 M57 36 h4 M29 3.4 v3 M32 3.4 v3 M35 3.4 v3" stroke="#6a6276" stroke-width=".8" />
	<!-- the view through the lens -->
	<g clip-path="url(#{uid}-lens)">
		<rect x="6" y="7" width="52" height="52" fill="url(#{uid}-sky)" />
		<circle cx="45" cy="16" r="4" fill="#fffbea" opacity=".9" />
		<path d="M6 40 L16 34 L24 36 L34 31 L46 34 L58 30 L58 59 L6 59 Z" fill="#b8706a" opacity=".55" />
		<!-- rooftop with the enemy sniper peeking over the parapet -->
		<path d="M18 36 Q18 26 26 25.4 L34 25.4 Q42 26 42 36 Z" fill="#557f2c" stroke={O} stroke-width="1.4" />
		<circle cx="30" cy="25" r="6.4" fill="#6f9a38" stroke={O} stroke-width="1.4" />
		<ellipse cx="29.4" cy="26" rx="3.8" ry="3" fill="#2a1a12" />
		<path d="M27.6 25.6 h1.6 M30.4 25.6 h1.6" stroke="#fffaf0" stroke-width="1" stroke-linecap="round" />
		<path d="M23.6 21 l-2 -2.4 M26 19.2 l-1 -3 M34 19.6 l1.6 -2.6 M36.4 22 l2.4 -1.6" stroke="#86b043" stroke-width="1.4" stroke-linecap="round" />
		<circle cx="35" cy="23.4" r="2.6" fill="#1e1b24" stroke={O} stroke-width=".9" />
		<circle cx="35" cy="23.4" r="1.6" fill="#5a8ae0" />
		<circle class="qs-glint" cx="35" cy="23.4" r="7" fill="url(#{uid}-glint)" />
		<path class="qs-glint" d="M35 17.6 Q35 23.4 40.8 23.4 Q35 23.4 35 29.2 Q35 23.4 29.2 23.4 Q35 23.4 35 17.6 Z" fill="#fffbe6" />
		<rect x="10" y="34" width="44" height="26" rx="2" fill="#efbf86" stroke={O} stroke-width="1.4" />
		<rect x="9" y="33" width="46" height="4.4" rx="1.6" fill="#f7d6a6" stroke={O} stroke-width="1.2" />
		<path d="M16 44 q0 -4 3 -4 q3 0 3 4 v6 h-6 Z M42 44 q0 -4 3 -4 q3 0 3 4 v6 h-6 Z" fill="#3a1c10" stroke={O} stroke-width="1" />
		<rect x="27" y="41" width="10" height="6" rx="1" fill="#d8261f" stroke={O} stroke-width=".9" />
		<path d="M29 45 q3 -3.4 6 0 Z" fill="#f0a24a" />
		<!-- reticle -->
		<path d="M7.4 33 H21 M43 33 H56.6 M32 8.4 V22 M32 44 V57.6" stroke="#120810" stroke-width="2.6" />
		<path d="M21 33 H29.6 M34.4 33 H43 M32 22 V30.6 M32 35.4 V44" stroke="#120810" stroke-width=".9" />
		<circle cx="32" cy="33" r="2.6" fill="#ff3b2a" opacity=".35" />
		<circle cx="32" cy="33" r="1.1" fill="#ff3b2a" />
		<rect x="6" y="7" width="52" height="52" fill="url(#{uid}-vig)" />
		<path d="M14 22 A20 20 0 0 1 26 11.4" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="3" stroke-linecap="round" />
	</g>
	<!-- the ring -->
	<circle cx="32" cy="33" r="26" fill="none" stroke="url(#{uid}-ring)" stroke-width="5" />
	{#each KNURL as d, i (i)}<path {d} stroke="#000" stroke-opacity=".35" stroke-width=".7" />{/each}
	<circle cx="32" cy="33" r="28.6" fill="none" stroke={O} stroke-width="1.8" />
	<circle cx="32" cy="33" r="24.4" fill="none" stroke={O} stroke-width="1.6" />
	<path d="M10.6 22.4 A24 24 0 0 1 21 10" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round" />
</svg>

<style>
	.qs-art {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.35));
	}
	.qs-glint {
		transform-box: fill-box;
		transform-origin: center;
		animation: qs-glint 2.4s ease-in-out infinite;
	}
	@keyframes qs-glint {
		0%,
		70%,
		100% {
			opacity: 0.35;
			transform: scale(0.6);
		}
		80% {
			opacity: 1;
			transform: scale(1.2);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.qs-glint {
			animation: none;
		}
	}
</style>
