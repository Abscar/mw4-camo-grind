<!--
	Killstreak Recall's hero picture (BurgiArcade): a green radar in a metal bezel (rings, a sweep, blips) with
	a care package floating down on its red-and-white parachute. Our own chunky cartoon in the casino symbols'
	style. 64×64 viewBox, decorative.
-->
<script lang="ts">
	let { size = 64 }: { size?: number } = $props();
	const uid = $props.id();
	const u = `kra-${uid}`;
	const O = '#1a0630';
	const SWEEP = Array.from({ length: 8 }, (_, i) => {
		const a0 = ((-40 - (i + 1) * 6) * Math.PI) / 180;
		const a1 = ((-40 - i * 6) * Math.PI) / 180;
		const p = (a: number) => `${(30 + 22 * Math.cos(a)).toFixed(2)} ${(36 + 22 * Math.sin(a)).toFixed(2)}`;
		return { d: `M30 36 L${p(a0)} A22 22 0 0 1 ${p(a1)} Z`, o: +(0.5 * (1 - i / 8)).toFixed(2) };
	});
</script>

<svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false" class="kra">
	<defs>
		<linearGradient id="{u}-bezel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c4ccd8" /><stop offset="0.5" stop-color="#4a5262" /><stop offset="1" stop-color="#1c2030" /></linearGradient>
		<radialGradient id="{u}-scope" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#16803a" /><stop offset="0.7" stop-color="#073a18" /><stop offset="1" stop-color="#021408" /></radialGradient>
		<clipPath id="{u}-clip"><circle cx="30" cy="36" r="22" /></clipPath>
	</defs>
	<!-- the radar -->
	<circle cx="30" cy="36" r="27.5" fill="url(#{u}-bezel)" stroke={O} stroke-width="3" />
	<circle cx="30" cy="36" r="22" fill="url(#{u}-scope)" stroke={O} stroke-width="2" />
	<g clip-path="url(#{u}-clip)">
		<g fill="none" stroke="#46ff7a" stroke-width="1" opacity="0.45">
			<circle cx="30" cy="36" r="7" /><circle cx="30" cy="36" r="14.5" />
			<path d="M8 36 H52 M30 14 V58" />
		</g>
		{#each SWEEP as w, i (i)}<path d={w.d} fill="#3dff70" opacity={w.o} />{/each}
		<path d="M30 36 L{(30 + 22 * Math.cos((-40 * Math.PI) / 180)).toFixed(2)} {(36 + 22 * Math.sin((-40 * Math.PI) / 180)).toFixed(2)}" stroke="#c8ffd4" stroke-width="1.8" stroke-linecap="round" />
		<circle cx="40" cy="44" r="2.4" fill="#8cffa8" />
		<circle cx="19" cy="30" r="1.8" fill="#8cffa8" opacity="0.7" />
		<circle cx="24" cy="48" r="2" fill="#ff5a4a" />
		<circle cx="24" cy="48" r="4.6" fill="none" stroke="#ff5a4a" stroke-width="1.2" opacity="0.6" />
	</g>
	{#each [45, 135, 225, 315] as a (a)}
		<circle cx={30 + 25 * Math.cos((a * Math.PI) / 180)} cy={36 + 25 * Math.sin((a * Math.PI) / 180)} r="1.3" fill="#2a2e3a" />
	{/each}
	<!-- the care package floating down -->
	<path d="M33 16 Q34 3 47 2.4 Q60 3 61 16 Q57.6 13.6 54 16 Q50.6 13.6 47 16 Q43.4 13.6 40 16 Q36.4 13.6 33 16 Z" fill="#e8463a" stroke={O} stroke-width="2" stroke-linejoin="round" />
	<path d="M40 16 Q41 6 47 2.8 Q43 8 44 15.4 Z M54 16 Q53 6 47 2.8 Q51 8 50 15.4 Z" fill="#fff3dc" />
	<path d="M34 16 L42 25 M40 16 L44 25 M54 16 L50 25 M60 16 L52 25" stroke="#fff3dc" stroke-width="1" />
	<rect x="40" y="24" width="14" height="12" rx="1.6" fill="#6f7f34" stroke={O} stroke-width="2" />
	<rect x="41" y="28.2" width="12" height="3.2" fill="#ffd23a" />
	<path d="M42 31.4 L44 28.2 L45.6 28.2 L43.6 31.4 Z M46.4 31.4 L48.4 28.2 L50 28.2 L48 31.4 Z" fill={O} />
	<path d="M37 10 Q38.4 6.4 41 5.6" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity="0.7" />
</svg>

<style>
	.kra {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.35));
	}
</style>
