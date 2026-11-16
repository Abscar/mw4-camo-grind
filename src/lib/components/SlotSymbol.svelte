<!--
	One reel symbol of the Burger Bandit (casino-slots.ts): our own chunky cartoon drawings, thick dark
	outlines and bright fills so they read at 44 px. Decorative: the reel's label says the symbols.
-->
<script lang="ts">
	import type { SlotSymbol } from '#lib/casino-slots.ts';

	let { symbol, size = 56 }: { symbol: SlotSymbol; size?: number } = $props();
	const uid = $props.id();
	const O = '#2a1408';
	/** the bonus wheel symbol's 8 slices (radius 21 round 32,33), red / gold / purple / gold … */
	const WEDGES = Array.from({ length: 8 }, (_, i) => {
		const a0 = ((i * 45 - 22.5) * Math.PI) / 180;
		const a1 = ((i * 45 + 22.5) * Math.PI) / 180;
		const p = (a: number) => `${(32 + 21 * Math.sin(a)).toFixed(2)} ${(33 - 21 * Math.cos(a)).toFixed(2)}`;
		return { d: `M32 33 L${p(a0)} A21 21 0 0 1 ${p(a1)} Z`, fill: ['#e2261f', '#ffc928', '#7a3fd0', '#ffc928'][i % 4] };
	});
	const BULBS = Array.from({ length: 12 }, (_, i) => {
		const a = (i * 30 * Math.PI) / 180;
		return { x: +(32 + 24.5 * Math.sin(a)).toFixed(2), y: +(33 - 24.5 * Math.cos(a)).toFixed(2) };
	});
</script>

<svg class="slot-sym" data-sym={symbol} viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
	<defs>
		<radialGradient id="{uid}-gold" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff6b0" /><stop offset="0.45" stop-color="#ffc928" /><stop offset="1" stop-color="#b86e00" /></radialGradient>
		<linearGradient id="{uid}-bun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6b955" /><stop offset="1" stop-color="#c97a1f" /></linearGradient>
	</defs>
	{#if symbol === 'pickle'}
		<!-- a pickle slice: ridged green rim, pale flesh, seeds -->
		<circle cx="32" cy="32" r="24" fill="#3f8f2a" stroke={O} stroke-width="3" />
		<circle cx="32" cy="32" r="18" fill="#b9de6a" />
		<circle cx="32" cy="32" r="18" fill="none" stroke="#86b544" stroke-width="2" stroke-dasharray="3 4" />
		{#each [0, 60, 120, 180, 240, 300] as a (a)}
			<ellipse cx="32" cy="22" rx="2.2" ry="3.6" fill="#f2f7c8" stroke="#6d9a33" stroke-width="1" transform="rotate({a} 32 32)" />
		{/each}
		<circle cx="32" cy="32" r="3" fill="#e9f3b0" />
	{:else if symbol === 'onion'}
		<!-- a golden onion ring -->
		<circle cx="32" cy="32" r="24" fill="#e8a63a" stroke={O} stroke-width="3" />
		<circle cx="32" cy="32" r="11" fill="#1d0e05" stroke={O} stroke-width="3" />
		<circle cx="32" cy="32" r="17.5" fill="none" stroke="#f7d27a" stroke-width="5" opacity="0.55" />
		{#each [[20, 18], [44, 22], [46, 40], [22, 46], [33, 12], [14, 34]] as [x, y] (`${x}-${y}`)}
			<circle cx={x} cy={y} r="1.6" fill="#b5701c" />
		{/each}
	{:else if symbol === 'tomato'}
		<!-- a tomato slice -->
		<circle cx="32" cy="32" r="24" fill="#e2261f" stroke={O} stroke-width="3" />
		<circle cx="32" cy="32" r="19" fill="#ff5b45" />
		{#each [0, 72, 144, 216, 288] as a (a)}
			<path d="M32 32 L28 17 Q32 14 36 17 Z" fill="#ffb199" stroke="#d93a2b" stroke-width="1" transform="rotate({a} 32 32)" />
			<circle cx="32" cy="20" r="1.4" fill="#fff1a8" transform="rotate({a} 32 32)" />
		{/each}
		<circle cx="32" cy="32" r="4" fill="#ff8a70" />
	{:else if symbol === 'cheese'}
		<!-- a cheese wedge with holes -->
		<path d="M8 46 L54 46 L54 30 L18 14 Z" fill="#ffc928" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M8 46 L54 46 L54 52 L8 52 Z" fill="#e8a600" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<circle cx="26" cy="34" r="4" fill="#e8a600" /><circle cx="41" cy="39" r="3" fill="#e8a600" /><circle cx="40" cy="28" r="2.2" fill="#e8a600" /><circle cx="18" cy="42" r="2" fill="#e8a600" />
	{:else if symbol === 'fries'}
		<!-- fries in a red carton -->
		{#each [[18, 10, -8], [24, 6, -3], [30, 4, 0], [36, 6, 4], [42, 9, 8], [27, 9, -1], [34, 10, 3]] as [x, y, r] (`${x}-${y}`)}
			<rect x={x} y={y} width="6" height="30" rx="1.5" fill="#ffd23a" stroke={O} stroke-width="2.2" transform="rotate({r} {x + 3} {y + 30})" />
		{/each}
		<path d="M12 28 L52 28 L46 58 L18 58 Z" fill="#e2261f" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M24 38 q8 8 16 0" fill="none" stroke="#ffd23a" stroke-width="3.5" stroke-linecap="round" />
	{:else if symbol === 'shake'}
		<!-- a milkshake: cup, whipped cream, cherry, straw -->
		<path d="M40 4 L35 22" stroke={O} stroke-width="6" stroke-linecap="round" /><path d="M40 4 L35 22" stroke="#ff5ca8" stroke-width="3" stroke-linecap="round" />
		<path d="M16 26 Q14 16 24 18 Q26 10 34 13 Q42 9 44 18 Q52 18 48 26 Z" fill="#fff6f0" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<circle cx="33" cy="12" r="4" fill="#e2261f" stroke={O} stroke-width="2" />
		<path d="M15 26 L49 26 L44 58 L20 58 Z" fill="#ff8ec4" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M17.5 36 L46.5 36" stroke="#fff6f0" stroke-width="4" />
	{:else if symbol === 'hotdog'}
		<!-- a hot dog with a mustard zigzag -->
		<rect x="4" y="22" width="56" height="18" rx="9" fill="#c0452b" stroke={O} stroke-width="3" transform="rotate(-18 32 32)" />
		<path d="M8 38 Q32 56 56 30 L58 38 Q32 64 6 46 Z" fill="url(#{uid}-bun)" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M10 26 Q32 14 54 18" fill="none" stroke="url(#{uid}-bun)" stroke-width="7" stroke-linecap="round" />
		<path d="M14 34 l5 -6 l5 5 l5 -6 l5 5 l5 -6 l5 5 l4 -5" fill="none" stroke="#ffd800" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-18 32 32)" />
	{:else if symbol === 'burger' || symbol === 'wild'}
		<!-- the burger (the WILD wears gold and a crown) -->
		{@const gold = symbol === 'wild'}
		{#if gold}
			<path d="M18 13 L22 4 L28 10 L32 2 L36 10 L42 4 L46 13 Z" fill="url(#{uid}-gold)" stroke={O} stroke-width="2.5" stroke-linejoin="round" />
			<circle cx="32" cy="8" r="1.8" fill="#e2261f" />
		{/if}
		<path d="M8 32 Q8 12 32 12 Q56 12 56 32 Z" fill={gold ? `url(#${uid}-gold)` : `url(#${uid}-bun)`} stroke={O} stroke-width="3" stroke-linejoin="round" />
		{#each [[22, 20], [30, 17], [38, 19], [44, 24], [17, 26], [28, 25]] as [x, y] (`${x}-${y}`)}
			<ellipse cx={x} cy={y} rx="1.8" ry="1.1" fill="#fff6d0" />
		{/each}
		<path d="M6 34 Q12 30 16 35 Q22 30 28 35 Q34 30 40 35 Q46 30 52 35 Q56 31 58 34 L58 37 L6 37 Z" fill="#4fb23a" stroke={O} stroke-width="2.4" stroke-linejoin="round" />
		<path d="M8 37 L56 37 L50 43 L14 43 Z" fill="#ffc928" stroke={O} stroke-width="2.2" stroke-linejoin="round" />
		<rect x="7" y="41" width="50" height="8" rx="4" fill="#6b3a1c" stroke={O} stroke-width="3" />
		<path d="M9 50 L55 50 Q55 58 46 58 L18 58 Q9 58 9 50 Z" fill={gold ? `url(#${uid}-gold)` : `url(#${uid}-bun)`} stroke={O} stroke-width="3" stroke-linejoin="round" />
		{#if gold}
			<rect x="12" y="26" width="40" height="13" rx="4" fill="#e2261f" stroke={O} stroke-width="2.5" />
			<text x="32" y="36.5" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="11" fill="#fff6b0" letter-spacing="1">WILD</text>
		{/if}
	{:else if symbol === 'scatter'}
		<!-- the ketchup bottle (scatter) -->
		<path d="M27 4 L37 4 L37 12 L27 12 Z" fill="#fff6f0" stroke={O} stroke-width="2.5" stroke-linejoin="round" />
		<path d="M26 12 L38 12 L40 20 Q50 24 50 36 L50 54 Q50 60 44 60 L20 60 Q14 60 14 54 L14 36 Q14 24 24 20 Z" fill="#e2261f" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M19 30 Q19 25 25 24" fill="none" stroke="#ff8a7a" stroke-width="3" stroke-linecap="round" />
		<rect x="16" y="36" width="32" height="14" rx="3" fill="#fff6f0" stroke={O} stroke-width="2.2" />
		<text x="32" y="46.5" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="9.5" fill="#e2261f" letter-spacing="0.6">FREE</text>
		<path d="M54 10 q3 5 0 7 q-3 -2 0 -7 Z M9 14 q2.5 4 0 6 q-2.5 -2 0 -6 Z" fill="#e2261f" stroke={O} stroke-width="1.2" />
	{:else if symbol === 'box'}
		<!-- the BONUS box: a red takeaway burger box, lid ajar with burger peeking out, a gold BONUS band -->
		<path d="M10 28 Q11 10 32 9 Q53 10 54 28 Z" fill="#e2261f" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M18 20 Q32 12 46 20" fill="none" stroke="#ff8a7a" stroke-width="2.6" stroke-linecap="round" />
		<path d="M12 29 Q32 24 52 29 L52 32 L12 32 Z" fill="url(#{uid}-bun)" stroke={O} stroke-width="2" stroke-linejoin="round" />
		<path d="M11 33 Q16 30 21 34 Q27 30 32 34 Q37 30 43 34 Q48 30 53 33" fill="none" stroke="#4fb23a" stroke-width="2.6" stroke-linecap="round" />
		<path d="M7 34 L57 34 L53 57 Q52.5 59 50.5 59 L13.5 59 Q11.5 59 11 57 Z" fill="#e2261f" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<rect x="9" y="39" width="46" height="13" rx="3" fill="url(#{uid}-gold)" stroke={O} stroke-width="2.4" />
		<text x="32" y="49.4" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="10.5" fill="#b3141b" letter-spacing="0.8">BONUS</text>
		<path d="M56 6 l1.4 3.6 l3.6 1.4 l-3.6 1.4 l-1.4 3.6 l-1.4 -3.6 l-3.6 -1.4 l3.6 -1.4 Z M7 8 l1 2.4 l2.4 1 l-2.4 1 l-1 2.4 l-1 -2.4 l-2.4 -1 l2.4 -1 Z" fill="#fff6b0" stroke="#b86e00" stroke-width="0.8" />
	{:else if symbol === 'wheel'}
		<!-- the bonus wheel: coloured slices in a gold rim with bulbs, a pointer on top -->
		<circle cx="32" cy="33" r="27" fill="url(#{uid}-gold)" stroke={O} stroke-width="3" />
		{#each WEDGES as w, i (i)}<path d={w.d} fill={w.fill} stroke={O} stroke-width="1.2" />{/each}
		{#each BULBS as b, i (i)}<circle cx={b.x} cy={b.y} r="1.5" fill={i % 2 ? '#fff6b0' : '#ffffff'} stroke="#b86e00" stroke-width="0.6" />{/each}
		<circle cx="32" cy="33" r="6.5" fill="url(#{uid}-gold)" stroke={O} stroke-width="2.2" />
		<path d="M28.6 31.4 Q32 28 35.4 31.4" fill="none" stroke="#fff6d0" stroke-width="1.4" stroke-linecap="round" />
		<path d="M26 1.5 L38 1.5 L32 12 Z" fill="#e2261f" stroke={O} stroke-width="2.4" stroke-linejoin="round" />
	{/if}
</svg>

<style>
	.slot-sym {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.35));
	}
</style>
