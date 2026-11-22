<!--
	Munchie Snake's hero picture (BurgiArcade): the little weed-leaf stoner's head (leaf fan, round green face,
	heavy-lidded red eyes, a lit holk with smoke) with his smoke-puff trail curling up behind him, heading for
	a golden burger. Our own chunky cartoon, 64×64, decorative.
-->
<script lang="ts">
	import { LEAF_PATHS } from '#lib/leaf.ts';

	let { size = 64 }: { size?: number } = $props();
	const uid = $props.id();
	const O = '#1a0630';
	const PUFFS: [number, number, number][] = [
		[7, 57, 3.6],
		[11.5, 54.5, 4.4],
		[16, 50, 5],
		[19, 44.5, 5.4],
		[20.5, 38.5, 5.8],
		[24, 33.5, 6.2]
	];
</script>

<svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false" class="ms-art">
	<defs>
		<radialGradient id="{uid}-puff" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff" /><stop offset=".55" stop-color="#e9e4f6" /><stop offset="1" stop-color="#aca2cc" /></radialGradient>
		<radialGradient id="{uid}-face" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#b4f27a" /><stop offset=".55" stop-color="#62c641" /><stop offset="1" stop-color="#2d8424" /></radialGradient>
		<linearGradient id="{uid}-leaf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6f06a" /><stop offset="1" stop-color="#2f9a26" /></linearGradient>
		<linearGradient id="{uid}-leafb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fae36" /><stop offset="1" stop-color="#1d5a14" /></linearGradient>
		<radialGradient id="{uid}-gold" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#fff6b0" /><stop offset=".45" stop-color="#ffc928" /><stop offset="1" stop-color="#b86e00" /></radialGradient>
		<radialGradient id="{uid}-glow"><stop offset="0" stop-color="#ffd23a" stop-opacity=".7" /><stop offset="1" stop-color="#ffd23a" stop-opacity="0" /></radialGradient>
		<radialGradient id="{uid}-ember"><stop offset="0" stop-color="#ffd27a" /><stop offset=".4" stop-color="#ff5a14" stop-opacity=".8" /><stop offset="1" stop-color="#ff3c00" stop-opacity="0" /></radialGradient>
	</defs>
	<!-- the golden burger he's after -->
	<circle cx="52" cy="53" r="12" fill="url(#{uid}-glow)" />
	<g transform="translate(43.5 45) scale(0.27)">
		<path d="M18 14 L22 4 L28 10 L32 1 L36 10 L42 4 L46 14 Z" fill="url(#{uid}-gold)" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M8 32 Q8 12 32 12 Q56 12 56 32 Z" fill="url(#{uid}-gold)" stroke={O} stroke-width="3.6" stroke-linejoin="round" />
		<path d="M6 34 Q12 30 16 35 Q22 30 28 35 Q34 30 40 35 Q46 30 52 35 Q56 31 58 34 L58 37 L6 37 Z" fill="#4fb23a" stroke={O} stroke-width="3" />
		<rect x="7" y="40" width="50" height="9" rx="4.5" fill="#6b3a1c" stroke={O} stroke-width="3.6" />
		<path d="M9 50 L55 50 Q55 58 46 58 L18 58 Q9 58 9 50 Z" fill="url(#{uid}-gold)" stroke={O} stroke-width="3.6" stroke-linejoin="round" />
	</g>
	<path d="M60 40 l.9 2.2 l2.2 .9 l-2.2 .9 l-.9 2.2 l-.9 -2.2 l-2.2 -.9 l2.2 -.9 Z" fill="#fff6b0" stroke="#b86e00" stroke-width=".5" />
	<!-- the smoke trail -->
	{#each PUFFS as [x, y, r], i (i)}
		<circle cx={x} cy={y} r={r + 0.9} fill="#46386c" />
	{/each}
	{#each PUFFS as [x, y, r], i (i)}
		<circle cx={x} cy={y} {r} fill="url(#{uid}-puff)" />
		<ellipse cx={x - r * 0.3} cy={y - r * 0.35} rx={r * 0.32} ry={r * 0.18} fill="#fff" opacity=".8" transform="rotate(-25 {x - r * 0.3} {y - r * 0.35})" />
	{/each}
	<!-- the leaf fan behind his head -->
	{#each [[-17, '#1d5a14', 'leafb', 1.5], [17, '#1d5a14', 'leafb', 1.5], [0, '#0c3412', 'leaf', 1.72]] as [rot, line, fill, k] (rot)}
		<g transform="translate(34 30) rotate({rot}) scale({k}) translate(-12 -20)">
			{#each LEAF_PATHS as d, j (j)}<path {d} fill="none" stroke="#0c3412" stroke-width="2.2" stroke-linejoin="round" />{/each}
			{#each LEAF_PATHS as d, j (j)}<path {d} fill="url(#{uid}-{fill})" stroke="url(#{uid}-{fill})" stroke-width="1.1" stroke-linejoin="round" />{/each}
			<path d="M12 20 L12 8.5 M12 20 L7.2 11.4 M12 20 L16.8 11.4" stroke="#dcffb4" stroke-width=".35" opacity={line === '#0c3412' ? 0.8 : 0.4} />
		</g>
	{/each}
	<!-- face -->
	<ellipse cx="35" cy="30" rx="10.6" ry="10" fill="url(#{uid}-face)" stroke={O} stroke-width="1.8" />
	<ellipse cx="31" cy="23.6" rx="3.6" ry="1.6" fill="#fff" opacity=".25" transform="rotate(-25 31 23.6)" />
	<!-- heavy-lidded red eyes -->
	{#each [31.4, 38.6] as ex (ex)}
		<ellipse cx={ex} cy="28.6" rx="3.1" ry="2.9" fill="#ffe1e1" />
		<circle cx={ex + 0.8} cy="29.3" r="1.6" fill="#d0202a" /><circle cx={ex + 0.8} cy="29.3" r=".8" fill="#1a0606" />
		<path d="M{ex - 3.2} 28.4 A3.1 2.9 0 0 1 {ex + 3.2} 28.4 Q{ex} 29.4 {ex - 3.2} 28.4 Z" fill="#4fae36" />
		<ellipse cx={ex} cy="28.6" rx="3.1" ry="2.9" fill="none" stroke={O} stroke-width=".8" />
		<path d="M{ex - 3.1} 28.4 Q{ex} 29.5 {ex + 3.1} 28.4" fill="none" stroke={O} stroke-width=".8" />
	{/each}
	<ellipse cx="29" cy="33" rx="1.8" ry="1" fill="#ff7a8c" opacity=".5" /><ellipse cx="42" cy="32.6" rx="1.8" ry="1" fill="#ff7a8c" opacity=".5" />
	<!-- grin + holk -->
	<path d="M33 33.4 Q37 37.4 41.6 33.6 Q37.4 35 33 33.4 Z" fill="#5a1414" stroke={O} stroke-width="1" stroke-linejoin="round" />
	<path d="M40.4 33.6 L52.6 36.4 Q53.8 37.6 52.9 38.8 L40.6 35.6 Z" fill="#fbf8f0" stroke={O} stroke-width="1" stroke-linejoin="round" />
	<path d="M40.4 33.6 L43.4 34.3 L43.5 36.4 L40.6 35.6 Z" fill="#d9b27a" stroke={O} stroke-width=".7" />
	<circle cx="53.4" cy="37.6" r="4.2" fill="url(#{uid}-ember)" />
	<circle cx="53.3" cy="37.6" r="1.1" fill="#ff8a1a" />
	<!-- a wisp off the ember -->
	<path d="M54 34 q-2 -3 0.6 -5.6 q2.4 -2.4 0.4 -5.2" fill="none" stroke="#e9e4f6" stroke-width="1.6" stroke-linecap="round" opacity=".85" />
	<circle cx="56.5" cy="20" r="2.2" fill="url(#{uid}-puff)" stroke="#46386c" stroke-width=".7" />
</svg>

<style>
	.ms-art {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.35));
	}
</style>
