<!--
	The pictures on BurgiCasino's game tabs (2026-11-16, the user's ask: "tidy up the tabs in the casino,
	e.g. BurgiBank can have a big bank, so everything shows what it is beyond text"): Abscar's Fortune =
	a little red slot machine with burgers on its reels and a holk for a lever, roulette = the wheel seen
	from above, blackjack = an ace and a king fanned out with a chip stack, BurgiShop = a shopping bag
	with a burger on it, BurgiBank = a big bank with columns and a burger coin in its gable.
	Our own chunky cartoons in the Burger Bandit's style (SlotSymbol.svelte). Decorative: the tab says
	its name in words. The selected tab's picture moves a little (the wheel turns, the bulbs blink …).
-->
<script module lang="ts">
	export type CasinoTab = 'slots' | 'roulette' | 'blackjack' | 'shop' | 'bank';
</script>

<script lang="ts">
	import { holk } from '#lib/abscarOperator.ts';

	let { kind, size = 64 }: { kind: CasinoTab; size?: number } = $props();
	const uid = $props.id();
	const u = `cta-${uid}`;
	const O = '#2a1408';

	/** Roulette: 13 pockets round the wheel, the first green, then red / black. */
	const POCKETS = Array.from({ length: 13 }, (_, i) => {
		const a0 = ((i * 360) / 13 - 90) * (Math.PI / 180);
		const a1 = (((i + 1) * 360) / 13 - 90) * (Math.PI / 180);
		const p = (r: number, a: number) => `${(32 + r * Math.cos(a)).toFixed(2)} ${(28 + r * Math.sin(a)).toFixed(2)}`;
		return { d: `M${p(11, a0)} L${p(20, a0)} A20 20 0 0 1 ${p(20, a1)} L${p(11, a1)} A11 11 0 0 0 ${p(11, a0)} Z`, fill: i === 0 ? '#1f9a4a' : i % 2 ? '#d8261f' : '#151515' };
	});
	/** A tiny burger for the slot machine's reels, centred on (x, y). */
	const burger = (x: number, y: number, gold = false) => {
		const bun = gold ? '#ffc928' : '#f0a24a';
		return `<path d="M${x - 3.4} ${y - 0.4} q0 -3.6 3.4 -3.6 q3.4 0 3.4 3.6 z" fill="${bun}" stroke="${O}" stroke-width=".7"/><rect x="${x - 3.6}" y="${y - 0.2}" width="7.2" height="1.1" fill="#4fb23a"/><rect x="${x - 3.4}" y="${y + 0.9}" width="6.8" height="1.5" rx=".6" fill="#6b3a1c"/><path d="M${x - 3.2} ${y + 2.5} h6.4 q0 1.8 -1.8 1.8 h-2.8 q-1.8 0 -1.8 -1.8 z" fill="${bun}" stroke="${O}" stroke-width=".7"/>`;
	};
</script>

<svg class="ta" data-kind={kind} viewBox="0 0 64 56" width={size} height={size * (56 / 64)} aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id="{u}-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6b0" /><stop offset=".45" stop-color="#ffc928" /><stop offset="1" stop-color="#b86e00" /></linearGradient>
		<linearGradient id="{u}-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2343a" /><stop offset=".7" stop-color="#9a0d14" /><stop offset="1" stop-color="#5a060b" /></linearGradient>
		<linearGradient id="{u}-marble" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9b2a4" /><stop offset=".35" stop-color="#fffaf0" /><stop offset=".7" stop-color="#e2dccd" /><stop offset="1" stop-color="#9a9384" /></linearGradient>
		<linearGradient id="{u}-bag" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#b265ff" /><stop offset=".6" stop-color="#7a2fc8" /><stop offset="1" stop-color="#4a1580" /></linearGradient>
		<radialGradient id="{u}-wood" cx=".5" cy=".5" r=".5"><stop offset=".78" stop-color="#8a4a1c" /><stop offset=".9" stop-color="#5a2a0c" /><stop offset="1" stop-color="#3a1806" /></radialGradient>
		<radialGradient id="{u}-ember"><stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95" /><stop offset="1" stop-color="#ff5a00" stop-opacity="0" /></radialGradient>
	</defs>

	{#if kind === 'slots'}
		<!-- the lever: a small holk on a chrome knuckle, glowing end up -->
		<rect x="49.5" y="34" width="6" height="7" rx="2" fill="#c9d3dc" stroke={O} stroke-width="1" />
		{@html holk(u, 52.6, 36, 55.8, 10.5, 2.6, 6.4)}
		<!-- cabinet, marquee with bulbs, reel window with burgers (a gold WILD in the middle), tray -->
		<rect x="7" y="13" width="43" height="40" rx="5" fill="url(#{u}-red)" stroke={O} stroke-width="1.6" />
		<path d="M7 16 Q7 4 28.5 4 Q50 4 50 16 Z" fill="url(#{u}-gold)" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
		<g class="ta-bulbs">
			{#each [12, 18.5, 25, 32, 38.5, 45] as x, i (x)}<circle cx={x} cy={i === 0 || i === 5 ? 12.4 : 9.4} r="1.5" fill="#fff6d0" stroke="#7a4a00" stroke-width=".5" />{/each}
		</g>
		<rect x="10.5" y="18.5" width="36" height="17" rx="2.5" fill="#120302" stroke="#e0a400" stroke-width="1.2" />
		{#each [12.2, 24, 35.8] as x (x)}<rect {x} y="20" width="9.6" height="14" rx="1.4" fill="#fffaf0" />{/each}
		{@html burger(17, 27.6) + burger(28.8, 27.6, true) + burger(40.6, 27.6)}
		<path d="M10.5 27 H46.5" stroke="#ff4b2b" stroke-width=".8" opacity=".7" />
		<circle cx="17" cy="41" r="2.6" fill="#ffd23a" stroke={O} stroke-width="1" /><circle cx="25" cy="41" r="2.6" fill="#ff5ca8" stroke={O} stroke-width="1" />
		<rect x="34" y="39.6" width="9" height="2.6" rx="1.3" fill="#120302" />
		<rect x="12" y="45.5" width="33" height="5" rx="1.6" fill="#3d0508" stroke={O} stroke-width="1" />
		<ellipse cx="22" cy="47.6" rx="2.4" ry="1" fill="url(#{u}-gold)" /><ellipse cx="27" cy="48" rx="2.4" ry="1" fill="url(#{u}-gold)" />
	{:else if kind === 'roulette'}
		<!-- the wheel from above: wooden bowl, red / black pockets with one green, gold turret, the ball -->
		<ellipse cx="32" cy="50" rx="22" ry="3.4" fill="#000" opacity=".35" />
		<circle cx="32" cy="28" r="25" fill="url(#{u}-wood)" stroke={O} stroke-width="1.6" />
		<g class="ta-wheel">
			{#each POCKETS as p, i (i)}<path d={p.d} fill={p.fill} stroke="#e6c35a" stroke-width=".6" />{/each}
			<circle cx="32" cy="28" r="11" fill="#5a2a0c" stroke="#e6c35a" stroke-width=".8" />
			<circle cx="32" cy="28" r="7" fill="url(#{u}-gold)" stroke={O} stroke-width="1" />
			<path d="M32 19.5 V36.5 M23.5 28 H40.5" stroke="url(#{u}-gold)" stroke-width="2.4" stroke-linecap="round" />
			<circle cx="32" cy="28" r="2.4" fill="#fff6b0" stroke={O} stroke-width=".8" />
		</g>
		<circle cx="45.6" cy="16.6" r="2.4" fill="#fff" stroke={O} stroke-width=".8" />
		<circle cx="45" cy="16" r=".8" fill="#fff" opacity=".9" />
	{:else if kind === 'blackjack'}
		<!-- a king of hearts and the ace of spades fanned out: 21; a stack of chips beside them -->
		<g transform="rotate(-13 27 30)">
			<rect x="15" y="11" width="21" height="30" rx="2.6" fill="#fffaf0" stroke={O} stroke-width="1.4" />
			<text x="17.6" y="19" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="7" fill="#d8261f">K</text>
			<path d="M25.5 33 C21 29.6 20.4 27.4 20.4 25.8 C20.4 24 21.8 22.8 23.2 22.8 C24.4 22.8 25.1 23.6 25.5 24.4 C25.9 23.6 26.6 22.8 27.8 22.8 C29.2 22.8 30.6 24 30.6 25.8 C30.6 27.4 30 29.6 25.5 33 Z" fill="#d8261f" />
		</g>
		<!-- (the rotation sits on an outer group: a CSS animation on the same element would replace it) -->
		<g transform="rotate(11 38 28)">
			<g class="ta-card">
				<rect x="27" y="9" width="21" height="30" rx="2.6" fill="#fffaf0" stroke={O} stroke-width="1.4" />
				<text x="29.6" y="17" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="7" fill="#151515">A</text>
				<path d="M37.5 18.5 C34 22.4 31.8 24.4 31.8 27 C31.8 29 33.4 30.2 35 30.2 C35.9 30.2 36.6 29.8 37 29.2 C36.8 31 36.2 32.4 35 33.4 H40 C38.8 32.4 38.2 31 38 29.2 C38.4 29.8 39.1 30.2 40 30.2 C41.6 30.2 43.2 29 43.2 27 C43.2 24.4 41 22.4 37.5 18.5 Z" fill="#151515" />
			</g>
		</g>
		{#each [50, 46.4, 42.8] as y, i (y)}
			<ellipse cx="13" cy={y} rx="9" ry="3.4" fill={i === 2 ? '#2f7fe0' : '#d8261f'} stroke={O} stroke-width="1.1" />
			<ellipse cx="13" cy={y} rx="9" ry="3.4" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="2.4 3.2" />
		{/each}
		<ellipse cx="13" cy="42.8" rx="5" ry="1.8" fill="none" stroke="#fff" stroke-width=".6" opacity=".7" />
		<text x="55" y="50" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="9" fill="#ffd23a" stroke={O} stroke-width=".6" paint-order="stroke">21</text>
	{:else if kind === 'shop'}
		<!-- a shopping bag with gold handles and a burger badge, a price tag, sparkles -->
		<path d="M24 19 C24 9 40 9 40 19" fill="none" stroke={O} stroke-width="4.4" stroke-linecap="round" />
		<path d="M24 19 C24 9 40 9 40 19" fill="none" stroke="url(#{u}-gold)" stroke-width="2.4" stroke-linecap="round" />
		<path d="M14 18 H50 L53 52 H11 Z" fill="url(#{u}-bag)" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
		<path d="M14 18 H50 L50.5 23 H13.5 Z" fill="#4a1580" opacity=".55" />
		<circle cx="24" cy="21" r="1.4" fill="#2a0a40" /><circle cx="40" cy="21" r="1.4" fill="#2a0a40" />
		<circle cx="32" cy="36" r="9" fill="#fffaf0" stroke={O} stroke-width="1.2" />
		<g transform="translate(32 35) scale(1.5) translate(-32 -35)">{@html burger(32, 35)}</g>
		<path d="M7 26 L15 22 L18.4 28.6 L10.4 32.6 Z" fill="#ffd23a" stroke={O} stroke-width="1" stroke-linejoin="round" />
		<circle cx="10.4" cy="27.8" r=".9" fill={O} />
		<g class="ta-spark" fill="#fff6b0">
			<path d="M52 8 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 l3 -1 z" />
			<path d="M57 22 l.7 2 l2 .7 l-2 .7 l-.7 2 l-.7 -2 l-2 -.7 l2 -.7 z" />
		</g>
	{:else}
		<!-- BurgiBank: a big bank with a gold gable (a burger coin in it), BANK on the frieze, four marble
		     columns in front of the dark hall, wide steps, and a stack of burger coins by the door -->
		<path d="M5 18.6 L32 3.6 L59 18.6 Z" fill="url(#{u}-gold)" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
		<path d="M12 16.6 L32 6.6 L52 16.6 Z" fill="#c98a12" opacity=".55" />
		<g class="ta-coin">
			<circle cx="32" cy="12.4" r="4.4" fill="url(#{u}-gold)" stroke={O} stroke-width="1" />
			<g transform="translate(32 12.6) scale(.8) translate(-32 -12.6)">{@html burger(32, 12.6)}</g>
		</g>
		<rect x="7" y="18.6" width="50" height="5.4" fill="url(#{u}-gold)" stroke={O} stroke-width="1.3" />
		<text x="32" y="22.9" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="4.6" letter-spacing=".9" fill="#5a2a00">BANK</text>
		<rect x="9" y="24" width="46" height="18.4" fill="#2a1a10" stroke={O} stroke-width="1.2" />
		<path d="M28 42.4 V31 Q32 27.4 36 31 V42.4 Z" fill="#120a05" stroke="#7a5a2a" stroke-width=".7" />
		{#each [10.6, 21.2, 37.8, 48.4] as x (x)}
			<rect x={x - 0.8} y="24" width="6.6" height="2" fill="url(#{u}-marble)" stroke={O} stroke-width=".7" />
			<rect {x} y="26" width="5" height="15" fill="url(#{u}-marble)" stroke={O} stroke-width=".7" />
			<path d="M{x + 1.7} 26.6 V40.4 M{x + 3.3} 26.6 V40.4" stroke="#9a9384" stroke-width=".45" />
			<rect x={x - 0.8} y="41" width="6.6" height="1.6" fill="url(#{u}-marble)" stroke={O} stroke-width=".7" />
		{/each}
		<rect x="6" y="42.6" width="52" height="3" fill="url(#{u}-marble)" stroke={O} stroke-width="1" />
		<rect x="3.5" y="45.6" width="57" height="3" fill="url(#{u}-marble)" stroke={O} stroke-width="1" />
		<rect x="1" y="48.6" width="62" height="3.4" fill="url(#{u}-marble)" stroke={O} stroke-width="1" />
		{#each [44, 41.8, 39.6] as y (y)}<ellipse cx="54.6" cy={y} rx="3.6" ry="1.3" fill="url(#{u}-gold)" stroke={O} stroke-width=".6" />{/each}
	{/if}
</svg>

<style>
	.ta {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 2px 1px rgb(0 0 0 / 0.45));
	}
	/* the picture on the selected tab moves a little (frozen by reduced motion / the pause button) */
	:global([aria-pressed='true']) > .ta .ta-wheel {
		transform-box: fill-box;
		transform-origin: center;
		animation: ta-turn 9s linear infinite;
	}
	:global([aria-pressed='true']) > .ta .ta-bulbs circle:nth-child(odd) {
		animation: ta-blink 0.9s steps(1) infinite;
	}
	:global([aria-pressed='true']) > .ta .ta-bulbs circle:nth-child(even) {
		animation: ta-blink 0.9s steps(1) infinite -0.45s;
	}
	:global([aria-pressed='true']) > .ta .ta-spark path {
		transform-box: fill-box;
		transform-origin: center;
		animation: ta-twinkle 1.8s ease-in-out infinite;
	}
	:global([aria-pressed='true']) > .ta .ta-spark path:nth-child(2) {
		animation-delay: -0.9s;
	}
	:global([aria-pressed='true']) > .ta .ta-coin {
		transform-box: fill-box;
		transform-origin: center;
		animation: ta-coin 2.4s ease-in-out infinite;
	}
	:global([aria-pressed='true']) > .ta .ta-card {
		transform-box: fill-box;
		transform-origin: 50% 100%;
		animation: ta-card 2.2s ease-in-out infinite;
	}
	@keyframes ta-turn {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes ta-blink {
		50% {
			fill: #7a4a10;
		}
	}
	@keyframes ta-twinkle {
		0%,
		100% {
			opacity: 0.2;
			transform: scale(0.5);
		}
		50% {
			opacity: 1;
			transform: scale(1.15);
		}
	}
	@keyframes ta-coin {
		0%,
		100% {
			transform: scaleX(1);
		}
		50% {
			transform: scaleX(0.2);
		}
	}
	@keyframes ta-card {
		0%,
		100% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(5deg);
		}
	}
</style>
