<!--
	Zombie Rounds's hero picture (BurgiArcade): a zombie's head in a burger-chef hat (with a ketchup stain),
	one glowing eye, a jagged grin with a fry hanging out, in front of a neon-pink night glow. Our own chunky
	cartoon in the casino symbols' style. 64×64 viewBox, decorative.
-->
<script lang="ts">
	let { size = 64 }: { size?: number } = $props();
	const uid = $props.id();
	const u = `zra-${uid}`;
	const O = '#140a06';
</script>

<svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false" class="zra">
	<defs>
		<radialGradient id="{u}-glow" cx="50%" cy="58%" r="55%"><stop offset="0" stop-color="#ff3fb4" stop-opacity="0.75" /><stop offset="0.6" stop-color="#7a1a8a" stop-opacity="0.35" /><stop offset="1" stop-color="#1a0630" stop-opacity="0" /></radialGradient>
		<radialGradient id="{u}-skin" cx="38%" cy="35%" r="75%"><stop offset="0" stop-color="#d8ff9a" /><stop offset="0.5" stop-color="#8fcf52" /><stop offset="1" stop-color="#3f7a24" /></radialGradient>
		<linearGradient id="{u}-hat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" /><stop offset="1" stop-color="#c4ccd6" /></linearGradient>
		<radialGradient id="{u}-eye"><stop offset="0" stop-color="#fffbe0" /><stop offset="0.5" stop-color="#ffe14a" /><stop offset="1" stop-color="#ff9a1a" /></radialGradient>
	</defs>
	<circle cx="32" cy="36" r="30" fill="url(#{u}-glow)" />
	<!-- torn shirt collar -->
	<path d="M10 64 Q12 52 22 50 L42 50 Q52 52 54 64 Z" fill="#8a3fa0" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
	<path d="M22 50 L26 57 L29 51 L32 58 L35 51 L38 57 L42 50 Z" fill="#55236a" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
	<!-- head -->
	<path d="M15 33 Q14 21 24 18 L41 18 Q51 21 50 34 Q50 44 44 49 Q38 54 31 53 Q22 53 18 47 Q14 42 15 33 Z" fill="url(#{u}-skin)" stroke={O} stroke-width="3" stroke-linejoin="round" />
	<path d="M15 34 Q10 34 11 39 Q12 43 16 42" fill="#7cbf4c" stroke={O} stroke-width="2.4" stroke-linejoin="round" />
	<path d="M50 34 Q55 33 54 39 Q53 42 49 42" fill="#7cbf4c" stroke={O} stroke-width="2.4" stroke-linejoin="round" />
	<ellipse cx="22" cy="44" rx="3.4" ry="2.2" fill="#4f8a2a" opacity="0.7" />
	<ellipse cx="45" cy="28" rx="2.4" ry="1.6" fill="#4f8a2a" opacity="0.7" />
	<!-- stitches on the cheek -->
	<path d="M41 40 L47 45 M42 44 L44 40 M44.5 46 L46.5 42" stroke={O} stroke-width="1.4" stroke-linecap="round" />
	<!-- eyes: one big glowing, one droopy -->
	<ellipse cx="25" cy="33" rx="6.4" ry="6.8" fill={O} />
	<circle cx="25" cy="33" r="4.8" fill="url(#{u}-eye)" />
	<circle cx="25.6" cy="33.4" r="1.6" fill="#c81e1e" />
	<circle cx="23.6" cy="31.4" r="1.2" fill="#ffffff" />
	<ellipse cx="40" cy="34" rx="5" ry="4.4" fill={O} />
	<circle cx="40" cy="34.8" r="3.2" fill="url(#{u}-eye)" />
	<path d="M34.5 31 Q40 28.4 45.5 31.6 L45.5 33 Q40 31 34.5 33.4 Z" fill="#6aa83c" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
	<path d="M19 27 L29 29 M36 29.5 L45 27.5" stroke={O} stroke-width="2.4" stroke-linecap="round" />
	<!-- jagged grin, a fry hanging out -->
	<path d="M23 43 Q32 48 42 42 Q41 49 32 50 Q24 49.5 23 43 Z" fill="#3a0a14" stroke={O} stroke-width="2.4" stroke-linejoin="round" />
	<path d="M25 44 L27 47 L29 45 L31 47.6 L33 45.4 L35 47.4 L37 45 L39 46.6 L40.6 43.6" fill="#fff6d8" stroke={O} stroke-width="1.2" stroke-linejoin="round" />
	<g transform="rotate(18 36 47)">
		<rect x="34.4" y="44" width="4" height="15" rx="1.2" fill="#ffd23a" stroke={O} stroke-width="1.8" />
		<path d="M35.4 46 V56" stroke="#fff3a0" stroke-width="1" stroke-linecap="round" />
	</g>
	<!-- the burger-chef hat -->
	<path d="M17 22 Q14 13 20 10 Q21 3 29 4 Q32 0 37 3.4 Q44 2 45.6 9 Q51 11 48 21 Z" fill="url(#{u}-hat)" stroke={O} stroke-width="2.8" stroke-linejoin="round" />
	<path d="M24 10 Q25 15 24 20 M32 7 Q33 13 32 20 M40 9 Q41 15 40 20" fill="none" stroke="#9aa4b0" stroke-width="1.4" stroke-linecap="round" />
	<rect x="15.5" y="18.5" width="34" height="7" rx="3" fill="url(#{u}-hat)" stroke={O} stroke-width="2.6" />
	<path d="M40 8 q2.6 -0.6 3.4 1.6 q0.4 2.4 -2 2.6 q-1.4 1.6 -2.6 0.2 q-1.6 -1.4 1.2 -4.4 Z" fill="#d8263a" />
	<path d="M20 11 Q22 7 26 6.4" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
	<circle cx="56" cy="10" r="1.6" fill="#ffe066" />
	<circle cx="8" cy="18" r="1.2" fill="#ff9adf" />
</svg>

<style>
	.zra {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.35));
	}
</style>
