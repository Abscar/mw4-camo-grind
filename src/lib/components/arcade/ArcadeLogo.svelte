<!--
	BurgiArcade's own sign (2026-11-22): "BURGI" in gold candy letters arched over a big "ARCADE" whose letters
	wear the games' colours, a chunky joystick on the left (its ball wobbles), a burger coin dropping into a slot
	and a strip of tickets curling out on the right, rays behind. Built with the casino logos' kit (logoGlyphs.ts,
	LogoWord, LogoShell). Moves a little; the pause button and reduced motion stop it.
-->
<script lang="ts">
	import { layoutWord, wordWidth } from '#lib/logoGlyphs.ts';
	import { ARCADE_FACES, ARCADE_TOP } from '#lib/arcade/looks.ts';
	import LogoShell from '../LogoShell.svelte';
	import LogoWord, { type WordStyle } from '../LogoWord.svelte';

	let { label = 'BurgiArcade', tile = false, live = true }: { label?: string; tile?: boolean; live?: boolean } = $props();
	const uid = $props.id();
	const u = (n: string) => `${uid}-${n}`;
	const VB = { x: 0, y: -24, w: 720, h: 290 };

	const TOP: WordStyle = { stroke: 24, outline: 5, ink: '#2a0606', rim: 4, depth: 8, dx: 2, gloss: true, shadow: true, faces: ARCADE_TOP };
	const BIG: WordStyle = { stroke: 28, outline: 5, ink: '#14041e', rim: 4, rimColour: '#fff4fb', depth: 11, dx: 2.5, gloss: true, shadow: true, faces: ARCADE_FACES };
	const bigW = wordWidth('ARCADE', { stroke: 28, scale: 1 });
	const big = layoutWord('ARCADE', { x: 160 + (430 - bigW) / 2, y: 132, stroke: 28, arch: 10, tilts: [-4, 3, -2, 4, -3, 3] });
	const topW = wordWidth('BURGI', { stroke: 24, scale: 0.72 });
	const top = layoutWord('BURGI', { x: 160 + (430 - topW) / 2, y: 30, stroke: 24, scale: 0.72, arch: -12, tilts: [-4, 3, -2, 4, -3] });

	const RAYS = Array.from({ length: 18 }, (_, i) => {
		const a0 = (i / 18) * Math.PI * 2,
			a1 = ((i + 0.5) / 18) * Math.PI * 2,
			R = 460;
		return `M0 0 L${(Math.cos(a0) * R).toFixed(1)} ${(Math.sin(a0) * R).toFixed(1)} L${(Math.cos(a1) * R).toFixed(1)} ${(Math.sin(a1) * R).toFixed(1)} Z`;
	});
	const RAY_COLS = ['#ff3b5a', '#ffc928', '#45e6ff', '#a8f03a', '#b05cff', '#ff8a2a'];
	const STAR = 'M0 -12 C1.5 -3 3 -1.5 12 0 C3 1.5 1.5 3 0 12 C-1.5 3 -3 1.5 -12 0 C-3 -1.5 -1.5 -3 0 -12 Z';
	const SPARKS = [
		{ x: 150, y: 20, s: 0.8, d: 0 },
		{ x: 600, y: 30, s: 0.7, d: -1.1 },
		{ x: 380, y: 246, s: 0.6, d: -1.9 },
		{ x: 40, y: 230, s: 0.6, d: -0.5 }
	];
</script>

<LogoShell w={VB.w} h={VB.h} {label} {tile} {live}>
	<svg class="lg-layer" viewBox="{VB.x} {VB.y} {VB.w} {VB.h}" aria-hidden="true" focusable="false">
		<defs>
			<radialGradient id={u('fade')} cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" /><stop offset=".55" stop-color="#fff" stop-opacity=".5" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></radialGradient>
			<mask id={u('rm')} maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><ellipse cx="360" cy="130" rx="370" ry="150" fill="url(#{u('fade')})" /></mask>
			<linearGradient id={u('base')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6a5a" /><stop offset=".5" stop-color="#e01c2c" /><stop offset="1" stop-color="#7a0612" /></linearGradient>
			<linearGradient id={u('top')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2a3a" /><stop offset="1" stop-color="#0c0c16" /></linearGradient>
			<radialGradient id={u('ball')} cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#ffd0dc" /><stop offset=".35" stop-color="#ff3b5a" /><stop offset="1" stop-color="#7a0620" /></radialGradient>
			<linearGradient id={u('stick')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a6a7a" /><stop offset=".45" stop-color="#f4f4fa" /><stop offset="1" stop-color="#4a4a58" /></linearGradient>
			<radialGradient id={u('coin')} cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff6b0" /><stop offset=".45" stop-color="#ffc928" /><stop offset="1" stop-color="#b86e00" /></radialGradient>
			<linearGradient id={u('tk')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd0e4" /><stop offset=".5" stop-color="#ff7ab0" /><stop offset="1" stop-color="#d0306c" /></linearGradient>
			<radialGradient id={u('btn')} cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#fff6b0" /><stop offset=".45" stop-color="#ffc928" /><stop offset="1" stop-color="#a86000" /></radialGradient>
			<radialGradient id={u('btn2')} cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#d8fbff" /><stop offset=".45" stop-color="#45e6ff" /><stop offset="1" stop-color="#0a6a8a" /></radialGradient>
		</defs>
		<!-- rays in the games' colours -->
		<g mask="url(#{u('rm')})">
			<g transform="translate(360 130)"><g class="al-rays">{#each RAYS as d, i (i)}<path {d} fill={RAY_COLS[i % RAY_COLS.length]} opacity=".14" />{/each}</g></g>
		</g>

		<!-- the joystick: a red deck with two buttons, a chrome stick, a red ball that wobbles -->
		<g transform="translate(18 96)">
			<path d="M8 96 L22 62 H124 L138 96 Z" fill="url(#{u('base')})" stroke="#2a0606" stroke-width="5" stroke-linejoin="round" />
			<path d="M8 96 H138 V112 Q138 120 130 120 H16 Q8 120 8 112 Z" fill="#5a0410" stroke="#2a0606" stroke-width="5" stroke-linejoin="round" />
			<path d="M26 66 H120" stroke="#ffb0a8" stroke-width="3" stroke-linecap="round" opacity=".7" />
			<ellipse cx="102" cy="80" rx="13" ry="7" fill="#7a5000" stroke="#2a0606" stroke-width="3.5" />
			<ellipse cx="102" cy="77" rx="13" ry="7" fill="url(#{u('btn')})" stroke="#2a0606" stroke-width="3.5" />
			<ellipse cx="124" cy="88" rx="9" ry="5" fill="url(#{u('btn2')})" stroke="#2a0606" stroke-width="3" />
			<ellipse cx="54" cy="78" rx="22" ry="9" fill="url(#{u('top')})" stroke="#2a0606" stroke-width="4" />
			<g class="al-stick">
				<path d="M50 78 L46 18 H60 L58 78 Z" fill="url(#{u('stick')})" stroke="#1a0a10" stroke-width="4" stroke-linejoin="round" />
				<circle cx="53" cy="14" r="22" fill="url(#{u('ball')})" stroke="#2a0606" stroke-width="5" />
				<ellipse cx="45" cy="5" rx="8" ry="5" fill="#fff" opacity=".75" transform="rotate(-25 45 5)" />
			</g>
		</g>

		<!-- a ticket strip curling out on the right, and a burger coin over it -->
		<g transform="translate(600 92)">
			<g class="al-tickets">
				{#each [0, 1, 2, 3] as i (i)}
					<g transform="rotate({-18 + i * 14} 0 120) translate({i * 10} {i * 26})">
						<path d="M0 0 H70 V8 a6 6 0 0 0 0 12 V36 H0 V20 a6 6 0 0 0 0 -12 Z" fill="url(#{u('tk')})" stroke="#4a0624" stroke-width="3.5" stroke-linejoin="round" />
						<rect x="10" y="7" width="50" height="22" rx="3" fill="none" stroke="#fff3f8" stroke-width="2" stroke-dasharray="4 3" opacity=".85" />
						<text x="35" y="23" text-anchor="middle" font-family="Bahnschrift, 'Segoe UI', sans-serif" font-weight="900" font-size="12" fill="#4a0624" letter-spacing="1">TICKET</text>
					</g>
				{/each}
			</g>
			<g class="al-coin" transform="translate(40 -14)">
				<circle r="26" fill="url(#{u('coin')})" stroke="#5a2a00" stroke-width="4" />
				<circle r="18" fill="none" stroke="#fff3b0" stroke-width="2" opacity=".7" />
				<path d="M-11 0 Q-11 -11 0 -11 Q11 -11 11 0 Z" fill="#c97a1f" stroke="#5a2a00" stroke-width="2" />
				<rect x="-12" y="1.2" width="24" height="4" rx="2" fill="#6b3a1c" />
				<path d="M-11 6.6 H11 Q11 11.6 5.5 11.6 H-5.5 Q-11 11.6 -11 6.6 Z" fill="#c97a1f" stroke="#5a2a00" stroke-width="2" />
			</g>
		</g>

		<LogoWord letters={top} style={TOP} />
		<LogoWord letters={big} style={BIG} anim="wave" />
		{#each SPARKS as sp, i (i)}
			<g transform="translate({sp.x} {sp.y}) scale({sp.s})"><path class="al-spark" style:--d="{sp.d}s" d={STAR} fill="#fffbe0" /></g>
		{/each}
	</svg>
</LogoShell>

<style>
	.al-rays {
		animation: al-turn 70s linear infinite;
	}
	@keyframes al-turn {
		to {
			transform: rotate(360deg);
		}
	}
	.al-stick {
		transform-box: fill-box;
		transform-origin: 50% 100%;
		animation: al-wobble 3.2s ease-in-out infinite;
	}
	@keyframes al-wobble {
		0%,
		100% {
			rotate: 0deg;
		}
		20% {
			rotate: -14deg;
		}
		45% {
			rotate: 10deg;
		}
		65% {
			rotate: -6deg;
		}
	}
	.al-coin {
		animation: al-coin 2.8s ease-in-out infinite;
	}
	@keyframes al-coin {
		0%,
		100% {
			translate: 0 0;
		}
		50% {
			translate: 0 -8px;
		}
	}
	.al-tickets {
		animation: al-tk 4s ease-in-out infinite;
		transform-box: fill-box;
		transform-origin: 0% 100%;
	}
	@keyframes al-tk {
		0%,
		100% {
			rotate: 0deg;
		}
		50% {
			rotate: 4deg;
		}
	}
	.al-spark {
		transform-box: fill-box;
		transform-origin: 50% 50%;
		animation: al-twinkle 2.4s var(--d) ease-in-out infinite;
	}
	@keyframes al-twinkle {
		0%,
		100% {
			opacity: 0;
			scale: 0.4;
		}
		50% {
			opacity: 1;
			scale: 1;
		}
	}
</style>
