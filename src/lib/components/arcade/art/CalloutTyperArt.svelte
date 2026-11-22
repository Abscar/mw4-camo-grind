<!--
	Callout Typer's hero picture (BurgiArcade): a chunky keyboard key seen a little from above, its top a dark
	tactical screen with a glowing lime crosshair locked on a red enemy marker, a typed "B" legend in the corner,
	and a tracer streaking in from below with a spark where it hits. Our own cartoon in the casino symbols'
	style. 64×64 viewBox, decorative.
-->
<script lang="ts">
	let { size = 64 }: { size?: number } = $props();
	const uid = $props.id();
	const u = `cta-${uid}`;
	const O = '#1a0630';
	/** crosshair ticks round the marker */
	const TICKS = [0, 90, 180, 270].map((deg) => {
		const a = (deg * Math.PI) / 180;
		const p = (r: number) => `${(32 + r * Math.cos(a)).toFixed(2)} ${(29 + r * Math.sin(a)).toFixed(2)}`;
		return `M${p(9)} L${p(15.5)}`;
	});
</script>

<svg class="cta" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id="{u}-side" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#2a6e74" />
			<stop offset="1" stop-color="#0c2a30" />
		</linearGradient>
		<radialGradient id="{u}-top" cx="0.4" cy="0.32" r="0.85">
			<stop offset="0" stop-color="#14525a" />
			<stop offset="0.6" stop-color="#072a30" />
			<stop offset="1" stop-color="#03151a" />
		</radialGradient>
		<linearGradient id="{u}-mark" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#ff9a7a" />
			<stop offset="0.5" stop-color="#ec3a2e" />
			<stop offset="1" stop-color="#9a1018" />
		</linearGradient>
		<radialGradient id="{u}-spark">
			<stop offset="0" stop-color="#fffbe0" />
			<stop offset="0.45" stop-color="#ffd23a" stop-opacity="0.9" />
			<stop offset="1" stop-color="#ff8a1a" stop-opacity="0" />
		</radialGradient>
	</defs>
	<!-- the key: its side, then the top -->
	<path d="M7 16 Q7 9 14 9 H50 Q57 9 57 16 V50 Q57 58 49 58 H15 Q7 58 7 50 Z" fill="url(#{u}-side)" stroke={O} stroke-width="3.2" stroke-linejoin="round" />
	<rect x="10" y="10" width="44" height="39" rx="7" fill="url(#{u}-top)" stroke={O} stroke-width="2.6" />
	<!-- a faint map grid on the key top -->
	<g stroke="#2fd0b8" stroke-width="0.7" opacity="0.35">
		<path d="M10 21 H54 M10 33 H54 M21 10 V49 M43 10 V49" />
	</g>
	<path d="M14 13.5 Q22 12 34 12.6" fill="none" stroke="#bffff0" stroke-width="2" stroke-linecap="round" opacity="0.55" />
	<!-- the typed legend -->
	<text x="15.5" y="45.5" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="9.5" fill="#8dff5a" stroke={O} stroke-width="0.6" paint-order="stroke">B</text>
	<!-- the tracer coming up from below and its spark -->
	<path d="M52 63 L35.5 32.5" stroke="#ffd23a" stroke-width="4.6" stroke-linecap="round" opacity="0.45" />
	<path d="M52 63 L35.5 32.5" stroke="#fffbe0" stroke-width="1.8" stroke-linecap="round" />
	<!-- the red enemy marker, locked -->
	<path d="M32 21.5 L39 29 L32 36.5 L25 29 Z" fill="url(#{u}-mark)" stroke={O} stroke-width="2.2" stroke-linejoin="round" />
	<path d="M28.6 29.6 A3.4 3.4 0 0 1 35.4 29.6 Z M27.6 29.4 H36.4" fill="#fff3e0" stroke="#fff3e0" stroke-width="0.9" />
	<g class="cta-lock" stroke="#8dff5a" stroke-width="2.4" stroke-linecap="round" fill="none">
		<circle cx="32" cy="29" r="12" stroke-width="1.6" opacity="0.8" />
		{#each TICKS as d, i (i)}<path {d} />{/each}
	</g>
	<circle class="cta-spark" cx="35.5" cy="32.5" r="6.5" fill="url(#{u}-spark)" />
</svg>

<style>
	.cta {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.45)) drop-shadow(0 0 6px rgb(141 255 90 / 0.45));
	}
	.cta-lock {
		transform-box: fill-box;
		transform-origin: center;
		animation: cta-lock 2.4s ease-in-out infinite;
	}
	@keyframes cta-lock {
		50% {
			transform: rotate(45deg) scale(0.9);
		}
	}
	.cta-spark {
		transform-box: fill-box;
		transform-origin: center;
		animation: cta-spark 0.6s ease-in-out infinite alternate;
	}
	@keyframes cta-spark {
		to {
			transform: scale(1.3);
			opacity: 0.7;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.cta-lock,
		.cta-spark {
			animation: none;
		}
	}
</style>
