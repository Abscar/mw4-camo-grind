<!--
	Grenade Toss's hero picture (BurgiArcade): a glossy olive frag grenade tumbling through the air, its pin
	ring flying off on the left, the spoon popping free and a fizzing spark at the fuse, with speed lines
	behind it. Our own chunky cartoon in the casino symbols' style. 64×64 viewBox, decorative.
-->
<script lang="ts">
	let { size = 64 }: { size?: number } = $props();
	const uid = $props.id();
	const u = `gta-${uid}`;
	const O = '#1a0630';
	/** the spark's rays round the fuse */
	const RAYS = Array.from({ length: 8 }, (_, i) => {
		const a = (i * 45 * Math.PI) / 180;
		const r1 = i % 2 ? 4.5 : 3.2;
		const r2 = i % 2 ? 8.5 : 11;
		const p = (r: number) => `${(43.5 + r * Math.cos(a)).toFixed(2)} ${(12 + r * Math.sin(a)).toFixed(2)}`;
		return `M${p(r1)} L${p(r2)}`;
	});
</script>

<svg class="gta" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
	<defs>
		<radialGradient id="{u}-body" cx="0.36" cy="0.32" r="0.8">
			<stop offset="0" stop-color="#d6ec8e" />
			<stop offset="0.35" stop-color="#7e9c3a" />
			<stop offset="0.75" stop-color="#3f5418" />
			<stop offset="1" stop-color="#1f2c0a" />
		</radialGradient>
		<linearGradient id="{u}-steel" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0" stop-color="#6a727c" />
			<stop offset="0.45" stop-color="#f4f7fa" />
			<stop offset="1" stop-color="#535a63" />
		</linearGradient>
		<radialGradient id="{u}-spark">
			<stop offset="0" stop-color="#fffbe0" />
			<stop offset="0.4" stop-color="#ffd23a" stop-opacity="0.95" />
			<stop offset="1" stop-color="#ff6a1a" stop-opacity="0" />
		</radialGradient>
	</defs>
	<!-- speed lines -->
	<g stroke="#ffd9a0" stroke-width="2.6" stroke-linecap="round" opacity="0.75">
		<path d="M4 44 H14" />
		<path d="M2 51 H15" />
		<path d="M7 58 H18" />
	</g>
	<!-- the pin ring flying off -->
	<g class="gta-pin">
		<circle cx="12" cy="17" r="6.2" fill="none" stroke={O} stroke-width="4.4" />
		<circle cx="12" cy="17" r="6.2" fill="none" stroke="#ffc928" stroke-width="2.2" />
		<path d="M17.6 19.4 L24 22" stroke={O} stroke-width="4" stroke-linecap="round" />
		<path d="M17.6 19.4 L24 22" stroke="#ffe38a" stroke-width="1.8" stroke-linecap="round" />
	</g>
	<g transform="rotate(-24 34 38)">
		<!-- the spoon lifting off -->
		<path d="M38 18 Q50 16 49 33" fill="none" stroke={O} stroke-width="5.4" stroke-linecap="round" />
		<path d="M38 18 Q50 16 49 33" fill="none" stroke="url(#{u}-steel)" stroke-width="2.8" stroke-linecap="round" />
		<!-- fuse cap -->
		<rect x="28.5" y="15" width="11" height="8" rx="2" fill="url(#{u}-steel)" stroke={O} stroke-width="2.8" />
		<!-- body -->
		<ellipse cx="34" cy="38" rx="15" ry="17" fill="url(#{u}-body)" stroke={O} stroke-width="3.4" />
		<g fill="none" stroke="#1f2c0a" stroke-width="1.8" opacity="0.7">
			<path d="M19.5 38 H48.5" />
			<path d="M21.5 29 Q34 26.6 46.5 29" />
			<path d="M21.5 47 Q34 49.4 46.5 47" />
			<path d="M34 21.5 V54.5" />
			<path d="M26 22.8 Q23 38 26 53.2" />
			<path d="M42 22.8 Q45 38 42 53.2" />
		</g>
		<ellipse cx="28" cy="29" rx="4.6" ry="3" fill="#fbffe6" opacity="0.7" transform="rotate(-30 28 29)" />
	</g>
	<!-- fizzing spark at the fuse -->
	<circle class="gta-glow" cx="43.5" cy="12" r="9" fill="url(#{u}-spark)" />
	<g stroke="#fff3a0" stroke-width="1.8" stroke-linecap="round">
		{#each RAYS as d, i (i)}<path {d} />{/each}
	</g>
	<circle cx="43.5" cy="12" r="2.4" fill="#fffbe0" />
</svg>

<style>
	.gta {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.45)) drop-shadow(0 0 5px rgb(255 190 80 / 0.45));
	}
	.gta-glow {
		transform-box: fill-box;
		transform-origin: center;
		animation: gta-fizz 0.5s ease-in-out infinite alternate;
	}
	@keyframes gta-fizz {
		to {
			transform: scale(1.25);
			opacity: 0.75;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.gta-glow {
			animation: none;
		}
	}
</style>
