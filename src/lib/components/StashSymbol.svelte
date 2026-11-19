<!--
	One symbol of Abscar's Stash (stash.ts): our own chunky cartoons with thick dark outlines, drawn to read
	at 44 px. The five "low" ones (weed bud, magic mushroom, pot brownie, acid tab, lean cup), the four
	stamped pills (blue star, green leaf, purple bolt, red heart), THE HOLK (the scatter: Abscar's golden
	cone joint, `holk()` from abscarOperator.ts, on a purple badge with rays) and the smoke cloud with its
	×value (green ×2–×5, purple ×6–×15, gold from ×20). Decorative: the board's label says what's on it.
-->
<script lang="ts">
	import type { Kind } from '#lib/stash.ts';
	import { holk } from '#lib/abscarOperator.ts';
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';

	let { kind, value, size }: { kind: Kind; value?: number; size?: number } = $props();
	const uid = $props.id();
	const O = '#1d0f24';
	const tierOf = (x: number) => (x >= 20 ? 'gold' : x >= 6 ? 'purple' : 'green');
	const tier = $derived(value ? tierOf(value) : 'green');
	/** a pill's colours: face, light edge, dark edge, stamp */
	const PILL = {
		blue: ['#3d8bff', '#9cc8ff', '#1747a8', '#dbeaff'],
		green: ['#33c26a', '#9df0b4', '#127a3a', '#e2ffe9'],
		purple: ['#9b4dff', '#d3a8ff', '#5a1fb0', '#f1e4ff'],
		heart: ['#ff3b5c', '#ffa3b3', '#b0102e', '#ffe3e9']
	} as const;
	/** the bud's lumps: x, y, rx, ry, colour (bottom up) */
	const BUD: [number, number, number, number, string][] = [
		[32, 50, 15, 10, '#2f8f35'],
		[22, 41, 11, 10, '#3fa63f'],
		[42, 41, 11, 10, '#3fa63f'],
		[32, 35, 13, 11, '#58c24c'],
		[25, 26, 9, 9, '#4fb846'],
		[39, 26, 9, 9, '#4fb846'],
		[32, 17, 8, 9, '#6fd65a']
	];
	/** rays behind the holk badge */
	const RAYS = Array.from({ length: 12 }, (_, i) => {
		const a = ((i * 30 + 15) * Math.PI) / 180;
		const b = ((i * 30 + 25) * Math.PI) / 180;
		const p = (t: number, r: number) => `${(32 + r * Math.cos(t)).toFixed(1)} ${(32 + r * Math.sin(t)).toFixed(1)}`;
		return `M32 32 L${p(a, 31)} L${p(b, 31)} Z`;
	});
</script>

<svg class="st-sym" data-kind={kind} viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
	<defs>
		<radialGradient id="{uid}-ember"><stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95" /><stop offset="1" stop-color="#ff5a00" stop-opacity="0" /></radialGradient>
		<radialGradient id="{uid}-gold" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff6b0" /><stop offset="0.45" stop-color="#ffc928" /><stop offset="1" stop-color="#b86e00" /></radialGradient>
	</defs>
	{#if kind === 'bud'}
		<!-- a dense weed bud on a fan leaf: stacked green lumps, orange hairs, frosty dots -->
		<g transform="translate(4.4 13) scale(2.3)">
			{#each LEAF_PATHS as d, i (i)}<path {d} fill="#3c9e3c" stroke={O} stroke-width="0.55" stroke-linejoin="round" />{/each}
		</g>
		{#each BUD as [x, y, rx, ry, fill], i (i)}
			<ellipse cx={x} cy={y} rx={rx} ry={ry} fill={fill} stroke={O} stroke-width="2.6" />
		{/each}
		{#each [[24, 44], [38, 47], [31, 36], [27, 27], [40, 39], [34, 20], [21, 37]] as [x, y], i (i)}
			<path d="M{x} {y} q2.4 -1.6 1.6 -4" fill="none" stroke="#e8822a" stroke-width="1.3" stroke-linecap="round" />
		{/each}
		{#each [[28, 48], [35, 43], [41, 30], [24, 33], [31, 27], [37, 18], [43, 45], [20, 44], [33, 37], [27, 40], [38, 52], [29, 19]] as [x, y], i (i)}
			<circle cx={x} cy={y} r="1.2" fill="#f4fff0" />
		{/each}
	{:else if kind === 'shroom'}
		<!-- a magic mushroom: red cap with white spots, gills, a cream stem -->
		<path d="M25 36 Q23 50 21 58 L43 58 Q41 50 39 36 Z" fill="#fff3dc" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M27 46 Q32 48 37 46" fill="none" stroke="#e3cfa8" stroke-width="2" stroke-linecap="round" />
		<path d="M8 36 Q8 8 32 7 Q56 8 56 36 Q32 42 8 36 Z" fill="#e6262e" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M12 36 Q32 41 52 36 Q32 46 12 36 Z" fill="#f2d2a6" stroke={O} stroke-width="2" stroke-linejoin="round" />
		{#each [[22, 18, 4.2], [38, 15, 3.4], [46, 26, 3.6], [16, 28, 3], [31, 27, 4.6], [27, 11, 2.2]] as [x, y, r], i (i)}
			<ellipse cx={x} cy={y} rx={r} ry={r * 0.8} fill="#fffaf0" stroke="#b81620" stroke-width="0.8" />
		{/each}
		<path d="M16 20 Q20 12 28 10" fill="none" stroke="#ff8a8a" stroke-width="2.4" stroke-linecap="round" opacity="0.8" />
	{:else if kind === 'brownie'}
		<!-- a pot brownie: a fudgy square, crackly top, a little leaf on top -->
		<path d="M8 30 L32 20 L56 30 L56 48 L32 58 L8 48 Z" fill="#5a3218" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M8 30 L32 40 L56 30 L32 20 Z" fill="#7a4a26" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M32 40 L32 58" stroke={O} stroke-width="2.4" />
		<path d="M15 31 l5 1 l2 -2 M26 25 l4 2 l3 -1 M37 33 l4 -1 l3 2 M44 28 l-3 -1" fill="none" stroke="#3e200c" stroke-width="1.4" stroke-linecap="round" />
		{#each [[14, 40], [22, 46], [42, 46], [49, 40], [36, 52]] as [x, y], i (i)}<circle cx={x} cy={y} r="1.4" fill="#3a1d0a" />{/each}
		<g transform="translate(22.5 12) scale(0.8)">
			<path d={LEAF_STEM} stroke="#0e4a1c" stroke-width="1.4" />
			{#each LEAF_PATHS as d, i (i)}<path {d} fill="#5fe36a" stroke={O} stroke-width="0.9" stroke-linejoin="round" />{/each}
		</g>
	{:else if kind === 'tab'}
		<!-- an acid tab: a perforated paper square with a rainbow swirl and a smiley -->
		<g transform="rotate(-8 32 32)">
			<rect x="9" y="9" width="46" height="46" rx="3" fill="url(#{uid}-tab)" stroke={O} stroke-width="3" />
			<rect x="9" y="9" width="46" height="46" rx="3" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="2 2.6" opacity="0.85" />
			<circle cx="32" cy="32" r="13" fill="#ffe14a" stroke={O} stroke-width="2.6" />
			<ellipse cx="27.5" cy="29" rx="1.8" ry="2.6" fill={O} /><ellipse cx="36.5" cy="29" rx="1.8" ry="2.6" fill={O} />
			<path d="M25 35 Q32 42 39 35" fill="none" stroke={O} stroke-width="2.4" stroke-linecap="round" />
		</g>
		<defs>
			<linearGradient id="{uid}-tab" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#ff4fa3" /><stop offset="0.3" stop-color="#ffb13b" /><stop offset="0.55" stop-color="#5ee06a" /><stop offset="0.8" stop-color="#39b6ff" /><stop offset="1" stop-color="#9b4dff" />
			</linearGradient>
		</defs>
	{:else if kind === 'lean'}
		<!-- lean: a double white foam cup seen a little from above, full of purple drink, a drip, a straw -->
		<path d="M11 17 L53 17 L46 60 L18 60 Z" fill="#f4f1fa" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M13.6 25 L50.4 25" stroke="#d2cbe2" stroke-width="2.2" />
		<path d="M18 31 L19.6 53" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.85" />
		<path d="M20 60 Q32 63 44 60" fill="none" stroke="#c6bfd6" stroke-width="2" />
		<ellipse cx="32" cy="17" rx="21" ry="6.5" fill="#fbf9ff" stroke={O} stroke-width="2.6" />
		<ellipse cx="32" cy="17.4" rx="17.6" ry="4.6" fill="#8b3fd9" />
		<ellipse cx="27" cy="16" rx="6" ry="1.5" fill="#c49bff" />
		<path d="M45 19.5 Q47.5 26 46 31 Q44 33 43.4 29.5 Q43 24.5 45 19.5 Z" fill="#8b3fd9" stroke={O} stroke-width="1.2" stroke-linejoin="round" />
		<path d="M41 2 L36 17" stroke={O} stroke-width="5.5" stroke-linecap="round" /><path d="M41 2 L36 17" stroke="#ff4fa3" stroke-width="2.6" stroke-linecap="round" />
	{:else if kind === 'blue' || kind === 'green' || kind === 'purple'}
		<!-- a stamped pill: round (blue), rounded hexagon (green) or rounded shield (purple) -->
		{@const [face, light, dark, ink] = PILL[kind]}
		{#if kind === 'blue'}
			<circle cx="32" cy="33" r="25" fill={dark} stroke={O} stroke-width="3" />
			<circle cx="32" cy="31" r="22" fill={face} />
		{:else if kind === 'green'}
			<path d="M32 7 L54 19.5 L54 45.5 L32 58 L10 45.5 L10 19.5 Z" fill={dark} stroke={O} stroke-width="3" stroke-linejoin="round" />
			<path d="M32 9.5 L51.5 20.7 L51.5 43 L32 54.5 L12.5 43 L12.5 20.7 Z" fill={face} stroke-linejoin="round" />
		{:else}
			<path d="M10 12 Q32 4 54 12 Q55 40 32 59 Q9 40 10 12 Z" fill={dark} stroke={O} stroke-width="3" stroke-linejoin="round" />
			<path d="M13 14 Q32 7.5 51 14 Q51.5 38 32 55 Q12.5 38 13 14 Z" fill={face} />
		{/if}
		<path d="M19 18 Q26 12 36 13" fill="none" stroke={light} stroke-width="3.4" stroke-linecap="round" opacity="0.9" />
		{#if kind === 'blue'}
			<path d="M32 18 L35.6 27.5 L45.7 27.9 L37.8 34.2 L40.5 44 L32 38.3 L23.5 44 L26.2 34.2 L18.3 27.9 L28.4 27.5 Z" fill={ink} stroke={dark} stroke-width="1.6" stroke-linejoin="round" />
		{:else if kind === 'green'}
			<g transform="translate(17.6 13.5) scale(1.2)">
				<path d={LEAF_STEM} stroke={dark} stroke-width="1.4" />
				{#each LEAF_PATHS as d, i (i)}<path {d} fill={ink} stroke={dark} stroke-width="0.9" stroke-linejoin="round" />{/each}
			</g>
		{:else}
			<path d="M36 14 L22 35 L31 35 L27 50 L43 27 L33.5 27 Z" fill={ink} stroke={dark} stroke-width="1.6" stroke-linejoin="round" />
		{/if}
	{:else if kind === 'heart'}
		<!-- the top pill: a glossy red heart, a little crown stamp -->
		{@const [face, light, dark, ink] = PILL.heart}
		<path d="M32 58 Q6 40 6 23 Q6 9 19 9 Q28 9 32 18 Q36 9 45 9 Q58 9 58 23 Q58 40 32 58 Z" fill={dark} stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M32 54.5 Q9 38.5 9 23.5 Q9 12 19.5 12 Q27.5 12 32 21 Q36.5 12 44.5 12 Q55 12 55 23.5 Q55 38.5 32 54.5 Z" fill={face} />
		<path d="M14 21 Q15 14 22 14" fill="none" stroke={light} stroke-width="3.4" stroke-linecap="round" />
		<path d="M23 38 L23 29 L27.5 33 L32 26 L36.5 33 L41 29 L41 38 Z" fill={ink} stroke={dark} stroke-width="1.6" stroke-linejoin="round" />
		<path d="M50 6 l1.4 3.6 l3.6 1.4 l-3.6 1.4 l-1.4 3.6 l-1.4 -3.6 l-3.6 -1.4 l3.6 -1.4 Z" fill="#fff6b0" stroke="#b86e00" stroke-width="0.8" />
	{:else if kind === 'holk'}
		<!-- THE HOLK (scatter): a purple badge with gold rays, Abscar's golden cone joint across it, a ribbon -->
		<g class="st-rays">{#each RAYS as d, i (i)}<path {d} fill="#ffd23a" opacity="0.55" />{/each}</g>
		<circle cx="32" cy="30" r="22" fill="url(#{uid}-badge)" stroke="url(#{uid}-gold)" stroke-width="4" />
		<circle cx="32" cy="30" r="22" fill="none" stroke={O} stroke-width="1.2" />
		{@html holk(uid, 15, 42, 47, 18, 4, 11, 12, true)}
		<path class="st-wisp" d="M49 15 C46 10 52 7 49 2" fill="none" stroke="#e8f8ff" stroke-width="2" stroke-linecap="round" opacity="0.75" />
		<path d="M10 48 L54 48 L50 54 L54 60 L10 60 L14 54 Z" fill="#e6262e" stroke={O} stroke-width="2.4" stroke-linejoin="round" />
		<text x="32" y="57.6" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="9.5" fill="#fff6b0" letter-spacing="1.2">HOLK</text>
		<defs>
			<radialGradient id="{uid}-badge" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#7c3fd6" /><stop offset="1" stop-color="#2b0a5a" /></radialGradient>
		</defs>
	{:else if kind === 'cloud'}
		<!-- a smoke cloud with its multiplier -->
		<path
			class="st-cloud"
			data-tier={tier}
			d="M14 46 Q4 46 5 37 Q6 29 15 30 Q14 18 26 18 Q31 9 41 13 Q52 13 52 25 Q60 27 59 37 Q58 46 49 46 Z"
			fill="url(#{uid}-cloud)"
			stroke={O}
			stroke-width="3"
			stroke-linejoin="round"
		/>
		<path d="M18 27 Q20 22 26 22 M36 17 Q42 16 45 20" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity="0.7" />
		{#if value}
			<text
				x="32"
				y="40.5"
				text-anchor="middle"
				font-family="Bahnschrift, 'Arial Black', sans-serif"
				font-weight="900"
				font-size={value >= 100 ? 15 : value >= 10 ? 17 : 19}
				fill={tier === 'gold' ? '#7a1a00' : '#ffffff'}
				stroke={tier === 'gold' ? '#fff6b0' : O}
				stroke-width="0.9"
				paint-order="stroke">×{value}</text
			>
		{/if}
		<defs>
			<radialGradient id="{uid}-cloud" cx="40%" cy="30%" r="80%">
				{#if tier === 'gold'}
					<stop offset="0" stop-color="#fff6c0" /><stop offset="0.5" stop-color="#ffd23a" /><stop offset="1" stop-color="#d48a00" />
				{:else if tier === 'purple'}
					<stop offset="0" stop-color="#f0dcff" /><stop offset="0.5" stop-color="#b57cff" /><stop offset="1" stop-color="#6a2fc4" />
				{:else}
					<stop offset="0" stop-color="#f2fff0" /><stop offset="0.5" stop-color="#9fe8a4" /><stop offset="1" stop-color="#3fae5a" />
				{/if}
			</radialGradient>
		</defs>
	{/if}
</svg>

<style>
	.st-sym {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.35));
	}
	.st-rays {
		transform-box: fill-box;
		transform-origin: center;
		animation: st-rays 14s linear infinite;
	}
	.st-wisp {
		animation: st-wisp 2.6s ease-in-out infinite;
	}
	@keyframes st-rays {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes st-wisp {
		0%,
		100% {
			opacity: 0.2;
			transform: translateY(2px);
		}
		50% {
			opacity: 0.8;
			transform: translateY(-2px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.st-rays,
		.st-wisp {
			animation: none;
		}
	}
</style>
