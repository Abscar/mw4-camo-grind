<!--
	One piece on Abscar's Fortune II's board (fortune2.ts; 2026-11-19). Our own chunky cartoons in the Burger
	Bandit's style: the four munchies on a tile in their collector's colour (Phillestar's burger red,
	Drängen's beer amber, Da Jeeven's energy drink blue, Ingman's purple bud) with their level on a badge and
	a fancier rim the higher it is, plus the features: WILD, SUPERSIZE, SMOKE SWAP, burger coin (its value at
	your bet), FRAG, the letters M-U-N-C-H and ketchup. Decorative: the board says what's where in words.
-->
<script module lang="ts">
	import type { Crew } from '#lib/fortune2.ts';
	export const CREW_COLOUR: Record<Crew, string> = { phil: '#e23a2e', lars: '#f2a91c', jeeven: '#2d8cf0', ingman: '#9b4be6' };
	/** the rim per level 1–7: dark, bronze, silver, gold, jade, diamond, rainbow */
	export const LEVEL_RIM = ['#2a1408', '#c07a3a', '#e3e8ee', '#ffcf2e', '#4ff0b8', '#9fe6ff', 'rainbow'];
	/** burgers, short: 0.3 / 5 / 25 / 1.2k / 1.5M (bets go up to 10,000, so a coin can be worth millions) */
	export function short(n: number): string {
		if (n >= 999_500) return `${+(n / 1_000_000).toFixed(1)}M`;
		if (n >= 10_000) return `${Math.round(n / 1000)}k`;
		if (n >= 1000) return `${+(n / 1000).toFixed(1)}k`;
		if (n >= 10) return String(Math.round(n));
		return String(+n.toFixed(1));
	}
</script>

<script lang="ts">
	import { LETTERS, type Piece } from '#lib/fortune2.ts';
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';

	let { piece, level = 1, bet = 10, size }: { piece: Pick<Piece, 'kind' | 'crew' | 'coin' | 'letter'>; level?: number; bet?: number; size?: number } = $props();
	const uid = $props.id();
	const O = '#2a1408';
	const rim = $derived(LEVEL_RIM[Math.min(Math.max(level, 1), 7) - 1]);
	const crewColour = $derived(piece.crew ? CREW_COLOUR[piece.crew] : '#888');
	const coinText = $derived(short(((piece.coin ?? 0) * bet) / 100));
</script>

<svg class="f2p" data-kind={piece.kind} data-crew={piece.crew} data-level={piece.kind === 'item' ? level : undefined} viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
	<defs>
		<radialGradient id="{uid}-tile" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity="0.55" /><stop offset="0.35" stop-color={crewColour} /><stop offset="1" stop-color={crewColour} stop-opacity="0.7" /></radialGradient>
		<radialGradient id="{uid}-gold" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff6b0" /><stop offset="0.45" stop-color="#ffc928" /><stop offset="1" stop-color="#b86e00" /></radialGradient>
		<linearGradient id="{uid}-rainbow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4b4b" /><stop offset="0.25" stop-color="#ffd23a" /><stop offset="0.5" stop-color="#5cff8a" /><stop offset="0.75" stop-color="#5ce1ff" /><stop offset="1" stop-color="#c98bff" /></linearGradient>
		<linearGradient id="{uid}-bun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6b955" /><stop offset="1" stop-color="#c97a1f" /></linearGradient>
		<linearGradient id="{uid}-beer" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd25a" /><stop offset="0.5" stop-color="#ffb21a" /><stop offset="1" stop-color="#d98200" /></linearGradient>
		<linearGradient id="{uid}-can" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0a1c3e" /><stop offset="0.35" stop-color="#1d4a9a" /><stop offset="0.6" stop-color="#0f2c60" /><stop offset="1" stop-color="#06122a" /></linearGradient>
	</defs>

	{#if piece.kind === 'item'}
		<!-- the tile in the collector's colour; the rim gets fancier with the level -->
		<rect x="3.5" y="3.5" width="57" height="57" rx="12" fill="url(#{uid}-tile)" stroke={rim === 'rainbow' ? `url(#${uid}-rainbow)` : rim} stroke-width={level >= 2 ? 3.4 + level * 0.25 : 2.6} />
		<rect x="8" y="7" width="48" height="10" rx="5" fill="#fff" opacity="0.18" />
		{#if piece.crew === 'phil'}
			<!-- Phillestar's burger -->
			<g transform="translate(32 34) scale(0.7) translate(-32 -34)">
				<path d="M8 32 Q8 12 32 12 Q56 12 56 32 Z" fill="url(#{uid}-bun)" stroke={O} stroke-width="3.4" stroke-linejoin="round" />
				{#each [[22, 20], [30, 17], [38, 19], [44, 24], [17, 26], [28, 25]] as [x, y] (`${x}-${y}`)}<ellipse cx={x} cy={y} rx="2" ry="1.2" fill="#fff6d0" />{/each}
				<path d="M6 34 Q12 30 16 35 Q22 30 28 35 Q34 30 40 35 Q46 30 52 35 Q56 31 58 34 L58 37 L6 37 Z" fill="#4fb23a" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
				<path d="M8 37 L56 37 L50 43 L14 43 Z" fill="#ffc928" stroke={O} stroke-width="2.4" stroke-linejoin="round" />
				<rect x="7" y="41" width="50" height="8" rx="4" fill="#6b3a1c" stroke={O} stroke-width="3.2" />
				<path d="M9 50 L55 50 Q55 58 46 58 L18 58 Q9 58 9 50 Z" fill="url(#{uid}-bun)" stroke={O} stroke-width="3.2" stroke-linejoin="round" />
			</g>
		{:else if piece.crew === 'lars'}
			<!-- Drängen's beer: a frothy mug -->
			<path d="M42 26 h4 q7 0 7 8 v6 q0 8 -7 8 h-4" fill="none" stroke={O} stroke-width="7" stroke-linecap="round" />
			<path d="M42 26 h4 q7 0 7 8 v6 q0 8 -7 8 h-4" fill="none" stroke="#fff6e0" stroke-width="3.2" stroke-linecap="round" opacity="0.9" />
			<path d="M15 22 H43 V50 Q43 55 38 55 H20 Q15 55 15 50 Z" fill="url(#{uid}-beer)" stroke={O} stroke-width="3" stroke-linejoin="round" />
			<path d="M20 26 V50" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.45" />
			{#each [[28, 44, 1.6], [34, 36, 1.3], [37, 47, 1.1], [26, 34, 1.1]] as [x, y, r] (`${x}-${y}`)}<circle cx={x} cy={y} {r} fill="#fff6c0" opacity="0.85" />{/each}
			<path d="M12 23 Q11 15 18 16 Q20 9 28 12 Q34 8 39 13 Q47 12 46 20 Q47 25 42 25 L15 25 Q11 25 12 23 Z" fill="#fffdf4" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
			<path d="M20 25 q1 5 3 0 M33 25 q1 6 3 0" fill="#fffdf4" stroke={O} stroke-width="1.8" />
		{:else if piece.crew === 'jeeven'}
			<!-- Da Jeeven's energy drink: a dark can with a neon bolt -->
			<rect x="20" y="13" width="24" height="42" rx="4.5" fill="url(#{uid}-can)" stroke={O} stroke-width="3" />
			<path d="M20.5 18 H43.5 M20.5 50 H43.5" stroke="#c9d3dc" stroke-width="3" />
			<ellipse cx="32" cy="13.5" rx="10" ry="3" fill="#dfe6ee" stroke={O} stroke-width="2.2" />
			<path d="M29 12.6 h6" stroke={O} stroke-width="1.6" stroke-linecap="round" />
			<path d="M35 20 L25 35 H31 L28 48 L39 31 H33 L36 20 Z" fill="#7dfcff" stroke="#e8ffff" stroke-width="1.2" stroke-linejoin="round" />
			<path d="M23 20 V48" stroke="#fff" stroke-width="2" opacity="0.35" stroke-linecap="round" />
		{:else}
			<!-- Ingman's purple bud: frosty lobes, orange hairs, two little leaves -->
			<g transform="translate(9 30) scale(0.95)">
				{#each LEAF_PATHS.slice(0, 3) as d, i (i)}<path {d} fill="#3c8a2e" stroke={O} stroke-width="1" transform="rotate(-30 12 20)" />{/each}
			</g>
			<g transform="translate(32 30) scale(0.95)">
				{#each LEAF_PATHS.slice(4) as d, i (i)}<path {d} fill="#3c8a2e" stroke={O} stroke-width="1" transform="rotate(30 12 20)" />{/each}
			</g>
			<path d="M32 9 Q42 12 43 22 Q50 28 45 38 Q46 48 36 53 Q32 56 28 53 Q18 48 19 38 Q14 28 21 22 Q22 12 32 9 Z" fill="#7a3ac8" stroke={O} stroke-width="3" stroke-linejoin="round" />
			<path d="M24 24 Q30 20 36 24 M21 34 Q32 29 43 34 M23 44 Q32 40 41 44" fill="none" stroke="#b07af0" stroke-width="2.4" stroke-linecap="round" />
			<path d="M27 16 q2 3 -1 5 M37 18 q-3 2 0 5 M24 30 q3 1 2 4 M40 29 q-3 2 -1 5 M30 38 q2 2 0 4 M36 46 q-2 1 -1 4" fill="none" stroke="#ff9a2a" stroke-width="1.6" stroke-linecap="round" />
			{#each [[30, 14], [34, 27], [27, 37], [38, 39], [32, 49], [25, 25], [41, 22]] as [x, y] (`${x}-${y}`)}<circle cx={x} cy={y} r="1.1" fill="#fff" opacity="0.9" />{/each}
		{/if}
		<!-- the level badge (from level 2: at level 1 the plain rim says it) -->
		{#if level >= 2}
			<circle cx="51" cy="51" r="9" fill="#14070a" stroke={rim === 'rainbow' ? `url(#${uid}-rainbow)` : rim} stroke-width="2.2" />
			<text x="51" y="55.2" text-anchor="middle" class="f2p-num" font-size="12" fill="#fff">{level}</text>
		{/if}
	{:else if piece.kind === 'wild'}
		<!-- WILD: a gold star with a cannabis leaf, rainbow rim -->
		<rect x="3.5" y="3.5" width="57" height="57" rx="12" fill="#3a1258" stroke="url(#{uid}-rainbow)" stroke-width="3.6" />
		<path d="M32 6 L39 22 L57 23 L43 34 L48 52 L32 42 L16 52 L21 34 L7 23 L25 22 Z" fill="url(#{uid}-gold)" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
		<g transform="translate(20 15) scale(1)">
			{#each LEAF_PATHS as d, i (i)}<path {d} fill="#3fae2e" stroke={O} stroke-width="0.8" />{/each}
			<path d={LEAF_STEM} fill="none" stroke={O} stroke-width="1" />
		</g>
		<rect x="11" y="40" width="42" height="14" rx="4" fill="#e2261f" stroke={O} stroke-width="2.4" />
		<text x="32" y="51.2" text-anchor="middle" class="f2p-word" font-size="11" fill="#fff6b0">WILD</text>
	{:else if piece.kind === 'up'}
		<!-- SUPERSIZE: an XL cup with a fat arrow up -->
		<rect x="3.5" y="3.5" width="57" height="57" rx="12" fill="#ff7a1a" stroke="#ffd23a" stroke-width="3" />
		<path d="M16 24 L48 24 L44 56 L20 56 Z" fill="#e2261f" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
		<rect x="14" y="20" width="36" height="6" rx="2" fill="#fff6f0" stroke={O} stroke-width="2.2" />
		<text x="32" y="47" text-anchor="middle" class="f2p-word" font-size="14" fill="#ffd23a">XL</text>
		<path d="M32 4 L46 18 H38 V22 H26 V18 H18 Z" fill="#fff6b0" stroke={O} stroke-width="2.4" stroke-linejoin="round" />
	{:else if piece.kind === 'swap'}
		<!-- SMOKE SWAP: a smoke cloud with two arrows going round -->
		<rect x="3.5" y="3.5" width="57" height="57" rx="12" fill="#4a3a66" stroke="#c9b6ff" stroke-width="2.6" />
		<path d="M14 40 Q8 40 9 33 Q10 27 16 28 Q17 19 26 20 Q30 13 38 17 Q46 15 48 23 Q56 24 55 32 Q55 40 47 40 Z" fill="#e8e2f4" stroke={O} stroke-width="2.4" stroke-linejoin="round" />
		<path d="M20 44 A14 12 0 0 0 44 46" fill="none" stroke="#7dff6a" stroke-width="3.4" stroke-linecap="round" />
		<path d="M44 46 l-1 -7 l6 4 Z" fill="#7dff6a" stroke={O} stroke-width="1.2" />
		<path d="M44 30 A14 10 0 0 0 20 29" fill="none" stroke="#c98bff" stroke-width="3.4" stroke-linecap="round" />
		<path d="M20 29 l1 7 l-6 -4 Z" fill="#c98bff" stroke={O} stroke-width="1.2" />
	{:else if piece.kind === 'coin'}
		<!-- a burger coin, its value at your bet -->
		<circle cx="32" cy="32" r="27" fill="url(#{uid}-gold)" stroke={O} stroke-width="3" />
		<circle cx="32" cy="32" r="21" fill="none" stroke="#b86e00" stroke-width="2" stroke-dasharray="2 3" />
		<path d="M22 24 q0 -7 10 -7 q10 0 10 7 z" fill="#f0a24a" stroke={O} stroke-width="1.6" />
		<path d="M21 26 h22" stroke="#4fb23a" stroke-width="2.4" stroke-linecap="round" />
		<text x="32" y="46" text-anchor="middle" class="f2p-num" font-size={coinText.length > 3 ? 13 : 16} fill="#5a2a00">{coinText}</text>
	{:else if piece.kind === 'frag'}
		<!-- FRAG: a grenade with a lit spark on hazard stripes -->
		<rect x="3.5" y="3.5" width="57" height="57" rx="12" fill="#231a10" stroke="#ffd23a" stroke-width="2.6" stroke-dasharray="6 4" />
		<ellipse cx="30" cy="39" rx="15" ry="17" fill="#5f7a2a" stroke={O} stroke-width="3" />
		<path d="M17 34 H43 M16 42 H44 M23 23 V55 M30 22 V56 M37 23 V55" stroke="#3e5418" stroke-width="2" />
		<ellipse cx="25" cy="31" rx="4" ry="6" fill="#fff" opacity="0.25" />
		<rect x="24" y="16" width="12" height="7" rx="2" fill="#9aa6b2" stroke={O} stroke-width="2.2" />
		<path d="M36 18 Q46 14 47 24" fill="none" stroke="#9aa6b2" stroke-width="3" stroke-linecap="round" />
		<circle cx="18" cy="17" r="5" fill="none" stroke="#c9d3dc" stroke-width="2.4" />
		<path d="M30 16 Q32 9 38 8" fill="none" stroke="#c9a46a" stroke-width="2" />
		<path class="f2p-spark" d="M40 3 l1.6 3.6 l3.9 0.4 l-2.9 2.6 l0.9 3.8 l-3.5 -2 l-3.5 2 l0.9 -3.8 l-2.9 -2.6 l3.9 -0.4 Z" fill="#fff36a" stroke="#ff7a1a" stroke-width="1" />
	{:else if piece.kind === 'letter'}
		<!-- a neon letter of M-U-N-C-H -->
		<rect x="3.5" y="3.5" width="57" height="57" rx="12" fill="#12061e" stroke="#ff5ca8" stroke-width="2.6" />
		<text x="32" y="45" text-anchor="middle" class="f2p-letter" font-size="36" fill="#fff" stroke="#ff5ca8" stroke-width="1.4">{LETTERS[piece.letter ?? 0]}</text>
	{:else}
		<!-- ketchup: three on the board = free spins -->
		<path d="M27 4 L37 4 L37 12 L27 12 Z" fill="#fff6f0" stroke={O} stroke-width="2.5" stroke-linejoin="round" />
		<path d="M26 12 L38 12 L40 20 Q50 24 50 36 L50 54 Q50 60 44 60 L20 60 Q14 60 14 54 L14 36 Q14 24 24 20 Z" fill="#e2261f" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M19 30 Q19 25 25 24" fill="none" stroke="#ff8a7a" stroke-width="3" stroke-linecap="round" />
		<rect x="16" y="36" width="32" height="14" rx="3" fill="#fff6f0" stroke={O} stroke-width="2.2" />
		<text x="32" y="46.5" text-anchor="middle" class="f2p-word" font-size="9.5" fill="#e2261f">FREE</text>
	{/if}
</svg>

<style>
	.f2p {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.f2p-num,
	.f2p-word,
	.f2p-letter {
		font-family: Bahnschrift, 'Arial Black', sans-serif;
		font-weight: 900;
	}
	.f2p-word {
		letter-spacing: 0.06em;
	}
	.f2p-letter {
		paint-order: stroke;
		filter: drop-shadow(0 0 3px #ff5ca8) drop-shadow(0 0 6px #ff5ca8);
	}
	/* high levels glow */
	.f2p[data-level='5'],
	.f2p[data-level='6'] {
		filter: drop-shadow(0 0 3px rgb(160 240 255 / 0.8));
	}
	.f2p[data-level='7'] {
		filter: drop-shadow(0 0 4px rgb(255 120 220 / 0.9)) drop-shadow(0 0 2px rgb(120 255 180 / 0.9));
	}
	.f2p[data-kind='wild'] {
		filter: drop-shadow(0 0 3px rgb(255 210 58 / 0.8));
	}
	.f2p-spark {
		transform-box: fill-box;
		transform-origin: center;
		animation: f2p-spark 0.6s ease-in-out infinite alternate;
	}
	@keyframes f2p-spark {
		from {
			transform: scale(0.8) rotate(0deg);
			opacity: 0.8;
		}
		to {
			transform: scale(1.15) rotate(20deg);
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.f2p-spark {
			animation: none;
		}
	}
</style>
