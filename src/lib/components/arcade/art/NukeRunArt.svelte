<!--
	Nuke Run's hero picture (BurgiArcade, 2026-11-22): the game's operator (ghillie-tufted helmet, plate carrier,
	rifle on the back) sprinting past a ruined skyline, a mushroom cloud glowing behind him, a burger coin in the
	air, dust kicked up. Our own cartoon in the casino symbols' style (thick dark outlines, glossy fills).
	64×64 viewBox; decorative (aria-hidden).
-->
<script lang="ts">
	let { size = 64 }: { size?: number } = $props();
	const uid = $props.id();
	const O = '#140a06';
	/** the cloud: stem puffs then cap puffs [x, y, r]; drawn as one outline pass then one fill pass */
	const STEM = [
		[45, 47, 5.2],
		[44, 41, 4.4],
		[45.5, 35, 3.8],
		[44.5, 30, 3.6]
	];
	const COLLAR = [
		[38.5, 36, 2.6],
		[51, 35.5, 2.6]
	];
	const CAP = [
		[35.5, 22, 5.2],
		[40, 17, 6],
		[47, 15.5, 6.6],
		[53.5, 18.5, 5.6],
		[55, 24, 4.4],
		[46, 23.5, 6],
		[38.5, 25, 4.4]
	];
	const SKY = [
		[4, 52, 4, 42, 9, 44, 9, 52],
		[9, 52, 9, 38, 12, 40, 15, 37, 15, 52],
		[17, 52, 17, 44, 22, 44, 22, 52],
		[31, 52, 31, 41, 34, 43, 37, 40, 37, 52],
		[52, 52, 52, 39, 55, 41, 58, 38, 58, 52],
		[58, 52, 58, 45, 61, 45, 61, 52]
	];
</script>

<svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
	<defs>
		<radialGradient id="{uid}-sky" cx="62%" cy="74%" r="78%">
			<stop offset="0" stop-color="#ffd27a" />
			<stop offset=".3" stop-color="#ff8a36" />
			<stop offset=".62" stop-color="#a8283a" />
			<stop offset="1" stop-color="#2a0d34" />
		</radialGradient>
		<linearGradient id="{uid}-cap" x1="0" y1="1" x2="0" y2="0">
			<stop offset="0" stop-color="#ffbe5a" />
			<stop offset=".5" stop-color="#d0603c" />
			<stop offset="1" stop-color="#5a2238" />
		</linearGradient>
		<linearGradient id="{uid}-stem" x1="0" y1="1" x2="0" y2="0">
			<stop offset="0" stop-color="#fff2b0" />
			<stop offset=".55" stop-color="#ffa646" />
			<stop offset="1" stop-color="#c8583a" />
		</linearGradient>
		<linearGradient id="{uid}-vest" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0" stop-color="#6b5832" />
			<stop offset=".6" stop-color="#a08a56" />
			<stop offset="1" stop-color="#7a6640" />
		</linearGradient>
		<linearGradient id="{uid}-helm" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#7d8c4c" />
			<stop offset="1" stop-color="#3b4626" />
		</linearGradient>
		<radialGradient id="{uid}-coin" cx="38%" cy="32%" r="72%">
			<stop offset="0" stop-color="#fff6b0" />
			<stop offset=".5" stop-color="#ffc928" />
			<stop offset="1" stop-color="#b86e00" />
		</radialGradient>
		<radialGradient id="{uid}-fire" cx="50%" cy="50%" r="50%">
			<stop offset="0" stop-color="#ffe7a0" stop-opacity=".9" />
			<stop offset="1" stop-color="#ff7a2a" stop-opacity="0" />
		</radialGradient>
		<clipPath id="{uid}-frame"><rect x="3" y="3" width="58" height="58" rx="13" /></clipPath>
	</defs>

	<rect x="3" y="3" width="58" height="58" rx="13" fill="url(#{uid}-sky)" />
	<g clip-path="url(#{uid}-frame)">
		<!-- stars -->
		<g fill="#fff3dc">
			<circle cx="9" cy="9" r=".6" /><circle cx="17" cy="7" r=".45" /><circle cx="25" cy="11" r=".5" /><circle cx="58" cy="8" r=".45" />
		</g>
		<!-- the mushroom cloud: outline pass, then fills -->
		<ellipse cx="45" cy="50" rx="14" ry="7" fill="url(#{uid}-fire)" />
		<g fill="none" stroke="#2a0a1e" stroke-width="3.2" stroke-opacity=".75">
			{#each [...STEM, ...COLLAR, ...CAP] as [x, y, r] (`${x}-${y}`)}<circle cx={x} cy={y} {r} />{/each}
		</g>
		{#each STEM as [x, y, r] (`${x}-${y}`)}<circle cx={x} cy={y} {r} fill="url(#{uid}-stem)" />{/each}
		{#each COLLAR as [x, y, r] (`${x}-${y}`)}<circle cx={x} cy={y} {r} fill="#f6b56a" />{/each}
		{#each CAP as [x, y, r] (`${x}-${y}`)}<circle cx={x} cy={y} {r} fill="url(#{uid}-cap)" />{/each}
		<ellipse cx="46" cy="27" rx="9" ry="2.6" fill="#ffd27a" opacity=".55" />
		<path d="M41 14 Q44 11.6 48 12" fill="none" stroke="#ffe0b0" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round" />
		<!-- ruined skyline -->
		<g fill="#1d0a18" stroke="#ff8a46" stroke-opacity=".45" stroke-width=".7" stroke-linejoin="round">
			{#each SKY as pts, i (i)}<polygon points={pts.join(' ')} />{/each}
		</g>
		<g fill="#ffb04a">
			<rect x="11" y="43" width="1.6" height="2" /><rect x="33" y="45" width="1.6" height="2" /><rect x="54" y="43" width="1.6" height="2" /><rect x="5.5" y="46" width="1.6" height="2" />
		</g>
		<!-- a fire on a rooftop -->
		<path d="M33 41 Q31.6 37.6 33.6 35.4 Q33.6 37.6 35 38 Q35.4 36 37 35 Q36 38 36.8 41 Z" fill="#ff6a1f" stroke="#6a1206" stroke-width=".7" stroke-linejoin="round" />
		<path d="M33.8 41 Q33.4 39 34.6 37.8 Q35 39.4 36 39.8 L36 41 Z" fill="#ffd27a" />
		<!-- ground -->
		<path d="M3 52 Q12 50.6 22 52 Q34 50.8 46 52 Q55 51 61 52 L61 61 L3 61 Z" fill="#3a2216" />
		<path d="M3 52 Q12 50.6 22 52 Q34 50.8 46 52 Q55 51 61 52" fill="none" stroke="#ffa060" stroke-opacity=".7" stroke-width="1" />
		<g fill="#7a3d26" stroke={O} stroke-width=".6">
			<rect x="38" y="55" width="5" height="2.4" rx=".6" transform="rotate(-12 40 56)" />
			<rect x="50" y="56.5" width="4" height="2" rx=".5" transform="rotate(10 52 57)" />
		</g>
		<path d="M8 57.5 L12 55.6 L15 57.6 Z" fill="#5d545c" stroke={O} stroke-width=".6" stroke-linejoin="round" />
	</g>
	<rect x="3" y="3" width="58" height="58" rx="13" fill="none" stroke={O} stroke-width="2.6" />

	<!-- speed lines + dust -->
	<g stroke="#fff3dc" stroke-width="1.3" stroke-linecap="round" opacity=".75">
		<path d="M6 25 H12" /><path d="M4.5 31 H11" /><path d="M7 37 H11.5" />
	</g>
	<g stroke={O} stroke-width=".7">
		<circle cx="11" cy="50" r="2.6" fill="#a5825c" />
		<circle cx="7.4" cy="48.4" r="1.9" fill="#8a6a4a" />
		<circle cx="14.4" cy="51.4" r="1.6" fill="#b8956a" />
	</g>

	<!-- the operator, sprinting right -->
	<g stroke-linecap="round" stroke-linejoin="round">
		<!-- back arm + back leg -->
		<path d="M23.4 29.5 L19.6 33.6 L18 30.4" fill="none" stroke={O} stroke-width="4.6" />
		<path d="M23.4 29.5 L19.6 33.6 L18 30.4" fill="none" stroke="#434f2b" stroke-width="2.6" />
		<path d="M21 38.5 L16 43.6 L12.6 46.6" fill="none" stroke={O} stroke-width="5.4" />
		<path d="M21 38.5 L16 43.6 L12.6 46.6" fill="none" stroke="#323b20" stroke-width="3.3" />
		<rect x="9.4" y="45.4" width="5" height="2.8" rx="1.1" fill="#1e140b" stroke={O} stroke-width=".8" transform="rotate(38 12 46.8)" />
		<!-- ghillie strands streaming back -->
		<g fill="none">
			{#each [[23, 28.6, '#4e7d2a'], [22.4, 30.6, '#857a3c'], [21.8, 32.6, '#6b9334']] as [x, y, c] (`${x}`)}
				<path d="M{x} {y} q-3 1.4 -6.4 2.6" stroke={O} stroke-width="2.6" />
				<path d="M{x} {y} q-3 1.4 -6.4 2.6" stroke={String(c)} stroke-width="1.4" />
			{/each}
		</g>
		<!-- rifle on the back -->
		<path d="M15.6 40 L22.6 21.4" fill="none" stroke={O} stroke-width="4" />
		<path d="M15.6 40 L22.6 21.4" fill="none" stroke="#2b2f36" stroke-width="2.2" />
		<path d="M15.6 40 L17.4 35.2" fill="none" stroke="#9a7a4a" stroke-width="2.4" />
		<!-- plate carrier -->
		<rect x="18.4" y="27.4" width="8.6" height="12.4" rx="2.6" fill="url(#{uid}-vest)" stroke={O} stroke-width="1.3" transform="rotate(14 22.7 33.6)" />
		<rect x="22.4" y="31" width="3.2" height="2.8" rx=".6" fill="#6a5634" stroke={O} stroke-width=".7" transform="rotate(14 24 32.4)" />
		<rect x="18.6" y="37.6" width="8.4" height="2.6" rx="1" fill="#3a3a2a" stroke={O} stroke-width=".8" transform="rotate(14 22.8 38.9)" />
		<!-- front leg + boot -->
		<path d="M21.6 38.8 L27.6 42.4 L27.4 50.6" fill="none" stroke={O} stroke-width="5.6" />
		<path d="M21.6 38.8 L27.6 42.4 L27.4 50.6" fill="none" stroke="#46512e" stroke-width="3.5" />
		<rect x="25.6" y="49.6" width="6" height="3" rx="1.2" fill="#2a1b10" stroke={O} stroke-width=".8" />
		<!-- head: face, eye, helmet, goggles, tufts -->
		<circle cx="27.4" cy="23.2" r="4.2" fill="#e9b48c" stroke={O} stroke-width="1.1" />
		<path d="M26.6 24.8 L31 24.4" stroke="#2f4a1e" stroke-width="1.1" stroke-opacity=".85" />
		<circle cx="29.4" cy="23" r="1" fill="#fff" />
		<circle cx="29.8" cy="23.1" r=".55" fill={O} />
		<path d="M28.2 21.6 L30.8 22.1" stroke={O} stroke-width=".8" />
		<path d="M22.4 22.4 A5.2 4.6 0 0 1 32.8 22.4 L33.6 22.8 L21.8 22.8 Z" fill="url(#{uid}-helm)" stroke={O} stroke-width="1.1" />
		<rect x="28.4" y="19.4" width="4" height="2.2" rx="1" fill="#ffb02e" stroke={O} stroke-width=".6" />
		<g stroke={O} stroke-width=".55">
			<path d="M24 18.6 q-1.4 -2.2 0 -3.8 q1.2 1.8 0 3.8 Z" fill="#4e7d2a" />
			<path d="M26.6 17.8 q-.8 -2.6 1 -3.8 q.6 2.2 -1 3.8 Z" fill="#6b9334" />
			<path d="M22.2 21 q-2.6 -.8 -3.4 -2.6 q2.4 0 3.4 2.6 Z" fill="#857a3c" />
		</g>
		<!-- front arm swinging forward -->
		<path d="M24.6 29.4 L28.6 33.2 L31.4 30" fill="none" stroke={O} stroke-width="4.8" />
		<path d="M24.6 29.4 L28.6 33.2 L31.4 30" fill="none" stroke="#5a6a3a" stroke-width="2.8" />
		<circle cx="31.6" cy="29.8" r="1.7" fill="#221d18" stroke={O} stroke-width=".7" />
	</g>

	<!-- a burger coin in the air -->
	<g transform="translate(14 14) rotate(-14)">
		<circle r="6.2" fill="url(#{uid}-coin)" stroke="#5a3200" stroke-width="1.2" />
		<circle r="4.6" fill="none" stroke="#fff3b0" stroke-width=".6" stroke-dasharray="1 1" />
		<path d="M-3 -.2 Q-3 -3.2 0 -3.2 Q3 -3.2 3 -.2 Z" fill="#f0a24a" stroke="#2a1408" stroke-width=".6" />
		<rect x="-3.2" y="-.2" width="6.4" height="1" fill="#4fb23a" />
		<rect x="-3" y=".8" width="6" height="1.3" rx=".5" fill="#6b3a1c" />
		<path d="M-2.8 2.2 H2.8 Q2.8 3.6 1.4 3.6 H-1.4 Q-2.8 3.6 -2.8 2.2 Z" fill="#f0a24a" stroke="#2a1408" stroke-width=".6" />
		<path d="M-4.6 -2.4 Q-3.4 -4.8 -1 -5.4" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".9" stroke-linecap="round" />
	</g>
	<path d="M23 8 l.9 2.2 2.2.9 -2.2.9 -.9 2.2 -.9 -2.2 -2.2 -.9 2.2 -.9 Z" fill="#fff6b0" stroke="#b86e00" stroke-width=".5" />
</svg>
