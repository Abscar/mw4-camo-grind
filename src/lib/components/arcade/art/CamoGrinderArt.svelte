<!--
	Camo Grinder's hero picture (BurgiArcade, 2026-11-22): a rifle freshly ground to brushed gold on a lit pedestal,
	a big sparkle on its receiver, and under it the game's meter with the needle right in the gold zone. Our own
	cartoon in the casino symbols' style (thick dark outlines, glossy fills; the gold is the same brushed gold the
	site's weapon cartoons wear). 64×64 viewBox; decorative (aria-hidden).
-->
<script lang="ts">
	let { size = 64 }: { size?: number } = $props();
	const uid = $props.id();
	const O = '#140a06';
	const RAYS = Array.from({ length: 12 }, (_, i) => {
		const a0 = ((i * 30 - 6) * Math.PI) / 180;
		const a1 = ((i * 30 + 6) * Math.PI) / 180;
		const p = (a: number) => `${(32 + 34 * Math.cos(a)).toFixed(1)} ${(30 + 34 * Math.sin(a)).toFixed(1)}`;
		return `M32 30 L${p(a0)} L${p(a1)} Z`;
	});
</script>

<svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
	<defs>
		<radialGradient id="{uid}-bg" cx="50%" cy="46%" r="52%">
			<stop offset="0" stop-color="#5a2280" />
			<stop offset=".6" stop-color="#2a0d40" />
			<stop offset="1" stop-color="#12061e" />
		</radialGradient>
		<radialGradient id="{uid}-rays" cx="50%" cy="47%" r="50%">
			<stop offset="0" stop-color="#ffd23a" stop-opacity=".55" />
			<stop offset=".7" stop-color="#ffc928" stop-opacity=".08" />
			<stop offset="1" stop-color="#ffc928" stop-opacity="0" />
		</radialGradient>
		<linearGradient id="{uid}-gold" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="11" y2="8" spreadMethod="reflect">
			<stop offset="0" stop-color="#8a5d12" />
			<stop offset=".3" stop-color="#f2cc66" />
			<stop offset=".52" stop-color="#b5852b" />
			<stop offset=".74" stop-color="#ffe7a0" />
			<stop offset="1" stop-color="#7a520f" />
		</linearGradient>
		<linearGradient id="{uid}-zone" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#fff0b0" />
			<stop offset=".5" stop-color="#ffc928" />
			<stop offset="1" stop-color="#b5852b" />
		</linearGradient>
		<radialGradient id="{uid}-ped" cx="50%" cy="50%" r="50%">
			<stop offset="0" stop-color="#ffc928" stop-opacity=".7" />
			<stop offset="1" stop-color="#ffc928" stop-opacity="0" />
		</radialGradient>
		<clipPath id="{uid}-frame"><rect x="3" y="3" width="58" height="58" rx="13" /></clipPath>
	</defs>

	<rect x="3" y="3" width="58" height="58" rx="13" fill="url(#{uid}-bg)" />
	<g clip-path="url(#{uid}-frame)">
		<g fill="url(#{uid}-rays)">
			{#each RAYS as d, i (i)}<path {d} />{/each}
		</g>
		<!-- pedestal -->
		<ellipse cx="32" cy="43" rx="24" ry="6" fill="url(#{uid}-ped)" />
		<ellipse cx="32" cy="42" rx="19" ry="3.6" fill="#2e2040" stroke={O} stroke-width="1.4" />
		<ellipse cx="32" cy="41.4" rx="17" ry="2.4" fill="none" stroke="#ffc928" stroke-width="1" />
	</g>

	<!-- the gold rifle -->
	<g transform="rotate(-12 32 30)" stroke={O} stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round">
		<path d="M7 29 L18 27.4 L18 34.4 L9.6 37 Q7.2 37 7 35 Z" fill="url(#{uid}-gold)" />
		<rect x="17.4" y="25.6" width="21" height="8.4" rx="2.2" fill="url(#{uid}-gold)" />
		<rect x="38" y="26.8" width="12.6" height="6" rx="1.6" fill="url(#{uid}-gold)" />
		<g stroke="rgb(0 0 0 / 0.4)" stroke-width=".8">
			<path d="M41 27.8 V31.8 M44 27.8 V31.8 M47 27.8 V31.8" />
		</g>
		<rect x="50.4" y="28.6" width="7" height="2.6" fill="#3a3f46" />
		<rect x="56.8" y="27.6" width="3.6" height="4.6" rx="1" fill="#23262b" />
		<path d="M29.6 33.6 C29.6 37.6 30.6 40.2 32.8 42 L36 40.6 C34.4 38.8 33.6 36.6 33.6 33.6 Z" fill="#23262b" />
		<path d="M21.4 33.6 L19.6 41.6 L23.6 41.6 L25.6 33.6 Z" fill="url(#{uid}-gold)" />
		<path d="M25.6 33.8 Q26.2 37 28.8 37 L28.8 33.8" fill="none" stroke-width="1.1" />
		<rect x="21.4" y="20.4" width="13.6" height="3.4" rx="1.5" fill="#23262b" />
		<rect x="20" y="19.6" width="3.2" height="5" rx="1" fill="#23262b" />
		<rect x="33.6" y="19.2" width="3.4" height="5.6" rx="1" fill="#23262b" />
		<circle cx="35.6" cy="22" r="1" fill="#7fc4ff" stroke="none" />
		<path d="M24 23.8 V25.6 M31 23.8 V25.6" stroke-width="1.2" />
		<path d="M19.6 27.2 H36.4" stroke="#fff" stroke-opacity=".7" stroke-width="1" />
		<path d="M39.6 28.2 H49" stroke="#fff" stroke-opacity=".55" stroke-width=".8" />
	</g>

	<!-- sparkles -->
	<path d="M44 7.6 C44.8 13.4 46.6 15.2 52.4 16 C46.6 16.8 44.8 18.6 44 24.4 C43.2 18.6 41.4 16.8 35.6 16 C41.4 15.2 43.2 13.4 44 7.6 Z" fill="#fffbe0" stroke="#b86e00" stroke-width=".9" />
	<circle cx="44" cy="16" r="1.4" fill="#fff" />
	<path d="M12.6 14 l.9 2.4 2.4.9 -2.4.9 -.9 2.4 -.9 -2.4 -2.4 -.9 2.4 -.9 Z" fill="#ffe680" stroke="#b86e00" stroke-width=".5" />
	<path d="M55 36 l.7 1.8 1.8.7 -1.8.7 -.7 1.8 -.7 -1.8 -1.8 -.7 1.8 -.7 Z" fill="#fff6b0" stroke="#b86e00" stroke-width=".5" />

	<!-- the meter, needle in the zone -->
	<rect x="9" y="49" width="46" height="8.4" rx="4.2" fill="#2a1c38" stroke={O} stroke-width="1.6" />
	<rect x="11.4" y="50.8" width="41.2" height="4.8" rx="2.4" fill="#0b0514" />
	<rect x="28.4" y="51" width="10.6" height="4.4" rx="1.6" fill="url(#{uid}-zone)" stroke={O} stroke-width=".7" />
	<rect x="32.6" y="51" width="2.4" height="4.4" fill="#fff" />
	<rect x="32.9" y="46.6" width="1.8" height="13.2" rx=".9" fill="#fff3dc" stroke={O} stroke-width=".9" />
	<path d="M31.4 46 L36.2 46 L33.8 48.6 Z M31.4 60.4 L36.2 60.4 L33.8 57.8 Z" fill="#ffc928" stroke={O} stroke-width=".7" stroke-linejoin="round" />

	<rect x="3" y="3" width="58" height="58" rx="13" fill="none" stroke={O} stroke-width="2.6" />
</svg>
