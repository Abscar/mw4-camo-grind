<!--
	One game's arcade cabinet in BurgiArcade's hall (2026-11-22): an upright machine in the game's colours, its
	sign lit on the marquee (GameLogo), the hero picture on a glowing CRT with "INSERT COIN", a control deck with
	a joystick and buttons, the coin door, the game's name and your best / the squad's top under it. A button:
	opens the game. Our own drawing; the picked one glows and its sign moves.
-->
<script lang="ts">
	import type { ArcadeGame } from '#lib/arcade/game.ts';
	import { GAME_LOOKS } from '#lib/arcade/looks.ts';
	import { GAME_ART } from './registry.ts';
	import { GAME_WORDS } from '#lib/i18n/arcade/index.ts';
	import { t } from '#lib/i18n/en.ts';
	import GameLogo from './GameLogo.svelte';

	let {
		game,
		picked = false,
		best = 0,
		top = null,
		crown = false,
		onpick
	}: { game: ArcadeGame; picked?: boolean; best?: number; top?: { name: string; score: number } | null; crown?: boolean; onpick: () => void } = $props();
	const a = t.arcade;
	const L = $derived(GAME_LOOKS[game]);
	const Art = $derived(GAME_ART[game]);
</script>

<button type="button" class="cab" data-game={game} aria-pressed={picked} aria-label={a.cabinet(GAME_WORDS[game].name)} style:--c1={L.c1} style:--c2={L.c2} style:--glow={L.glow} onclick={onpick}>
	<span class="cab-side" aria-hidden="true"></span>
	<span class="cab-marquee"><GameLogo {game} tile live={picked} /></span>
	<span class="cab-screen" aria-hidden="true">
		<span class="cab-art"><Art size={96} /></span>
		<span class="cab-coin font-head">{a.insertCoin}</span>
	</span>
	<span class="cab-deck" aria-hidden="true">
		<svg viewBox="0 0 100 26" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
			<ellipse cx="30" cy="17" rx="9" ry="3.6" fill="#0a0a12" />
			<path d="M28.8 17 28 6h3l-.6 11Z" fill="#d8d8e4" stroke="#14141e" stroke-width="1" />
			<circle cx="29.6" cy="5.6" r="5" fill="#ff3b5a" stroke="#1a0a10" stroke-width="1.6" />
			<circle cx="28" cy="4" r="1.5" fill="#fff" opacity=".8" />
			<ellipse cx="58" cy="15" rx="5.6" ry="3" fill="#ffc93c" stroke="#1a0a10" stroke-width="1.3" />
			<ellipse cx="72" cy="13" rx="5.6" ry="3" fill="#45e6ff" stroke="#1a0a10" stroke-width="1.3" />
			<ellipse cx="86" cy="15" rx="5.6" ry="3" fill="#a8f03a" stroke="#1a0a10" stroke-width="1.3" />
		</svg>
	</span>
	<span class="cab-door" aria-hidden="true"><i></i><i></i></span>
	<span class="cab-name font-head">{GAME_WORDS[game].name}{#if crown}<span class="cab-crown" aria-hidden="true">👑</span>{/if}</span>
	<span class="cab-best num">{best ? a.yourBest(best) : a.noBest}</span>
	{#if top}<span class="cab-top">{a.topIs(top.name, top.score)}</span>{/if}
</button>

<style>
	.cab {
		position: relative;
		isolation: isolate;
		display: grid;
		justify-items: stretch;
		gap: 6px;
		padding: 8px 8px 10px;
		border-radius: 18px 18px 12px 12px;
		border: 2px solid color-mix(in srgb, var(--glow) 55%, transparent);
		background:
			radial-gradient(120% 60% at 50% 0%, rgb(255 255 255 / 0.14), transparent 60%),
			repeating-linear-gradient(115deg, transparent 0 14px, rgb(255 255 255 / 0.05) 14px 18px),
			linear-gradient(180deg, var(--c1), var(--c2));
		color: #fff6e6;
		text-align: center;
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.2),
			inset 0 -6px 12px rgb(0 0 0 / 0.4),
			0 4px 10px rgb(0 0 0 / 0.45);
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease,
			border-color 0.18s ease;
	}
	/* the cabinet's side art: two neon stripes running down the edges */
	.cab-side {
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: inherit;
		background:
			linear-gradient(90deg, var(--glow) 0 3px, transparent 3px calc(100% - 3px), var(--glow) calc(100% - 3px)) 0 0 / 100% 100% no-repeat;
		opacity: 0.35;
		pointer-events: none;
	}
	/* the lit marquee: a backlit panel holding the game's sign */
	.cab-marquee {
		display: grid;
		place-items: center;
		min-height: 58px;
		padding: 4px 4px;
		border-radius: 10px;
		background:
			radial-gradient(80% 90% at 50% 50%, color-mix(in srgb, var(--glow) 40%, #fff 10%), transparent 75%),
			linear-gradient(180deg, #1a0a1e, #0a0410);
		box-shadow:
			inset 0 0 0 2px rgb(0 0 0 / 0.6),
			inset 0 0 14px color-mix(in srgb, var(--glow) 55%, transparent),
			0 0 10px color-mix(in srgb, var(--glow) 35%, transparent);
	}
	.cab-marquee :global(.lg-wrap.tile) {
		height: 52px;
	}
	.cab-marquee :global(.lg-logo.tile) {
		width: min(100%, calc(52px * var(--ar)));
	}
	/* the CRT: dark glass, a glow in the game's colour, scanlines, the picture bobbing */
	.cab-screen {
		position: relative;
		display: grid;
		justify-items: center;
		align-content: center;
		gap: 2px;
		aspect-ratio: 4 / 3;
		overflow: hidden;
		border-radius: 14px / 18px;
		background:
			radial-gradient(80% 70% at 50% 45%, color-mix(in srgb, var(--glow) 38%, transparent), transparent 75%),
			radial-gradient(120% 120% at 50% 50%, #0c0816 40%, #000 100%);
		box-shadow:
			0 0 0 4px #07050c,
			0 0 0 6px rgb(255 255 255 / 0.08),
			inset 0 0 18px rgb(0 0 0 / 0.85);
	}
	.cab-screen::after {
		content: '';
		position: absolute;
		inset: 0;
		background:
			repeating-linear-gradient(180deg, rgb(0 0 0 / 0.28) 0 1px, transparent 1px 3px),
			radial-gradient(90% 60% at 30% 10%, rgb(255 255 255 / 0.12), transparent 60%);
		pointer-events: none;
	}
	.cab-art {
		display: block;
		filter: drop-shadow(0 0 10px color-mix(in srgb, var(--glow) 60%, transparent));
	}
	.cab[aria-pressed='true'] .cab-art,
	.cab:hover .cab-art {
		animation: cab-bob 1.8s ease-in-out infinite;
	}
	@keyframes cab-bob {
		0%,
		100% {
			transform: translateY(0) rotate(-3deg);
		}
		50% {
			transform: translateY(-5px) rotate(3deg);
		}
	}
	.cab-coin {
		text-transform: uppercase;
		font-size: 10px;
		font-weight: 900;
		letter-spacing: 0.18em;
		color: #fffbe0;
		text-shadow:
			0 0 6px var(--glow),
			0 1px 0 #000;
		animation: cab-blink 1.2s steps(1) infinite;
	}
	@keyframes cab-blink {
		50% {
			opacity: 0.15;
		}
	}
	/* the control deck: a slanted panel with the joystick and three buttons */
	.cab-deck {
		display: block;
		height: 26px;
		margin-inline: -4px;
		border-radius: 6px;
		background: linear-gradient(180deg, color-mix(in srgb, var(--c1) 70%, #000), color-mix(in srgb, var(--c2) 80%, #000));
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.18),
			0 3px 4px rgb(0 0 0 / 0.5);
		clip-path: polygon(4% 0, 96% 0, 100% 100%, 0 100%);
	}
	/* the coin door: two glowing slots */
	.cab-door {
		display: flex;
		justify-content: center;
		gap: 10px;
		padding: 3px 0;
	}
	.cab-door i {
		width: 14px;
		height: 18px;
		border-radius: 3px;
		background: linear-gradient(180deg, #2a2a34, #0a0a10);
		box-shadow:
			inset 0 0 0 1px rgb(255 255 255 / 0.15),
			inset 0 6px 0 -4px #ffb02a,
			0 0 6px rgb(255 150 40 / 0.5);
	}
	.cab-name {
		font-size: 14px;
		font-weight: 900;
		line-height: 1.1;
		letter-spacing: 0.02em;
		text-wrap: balance;
		text-shadow: 0 1px 1px rgb(0 0 0 / 0.8);
	}
	.cab-crown {
		margin-left: 4px;
	}
	.cab-best {
		font-size: 11.5px;
		font-weight: 700;
		color: #ffe9a8;
	}
	.cab-top {
		font-size: 10.5px;
		line-height: 1.2;
		color: rgb(255 246 230 / 0.78);
		overflow-wrap: anywhere;
	}
	.cab:hover {
		border-color: var(--glow);
	}
	.cab[aria-pressed='true'] {
		border-color: #ffd23a;
		transform: translateY(-3px);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.25),
			0 0 0 2px rgb(255 210 58 / 0.3),
			0 0 22px color-mix(in srgb, var(--glow) 70%, transparent),
			0 8px 14px rgb(0 0 0 / 0.5);
	}
	@media (hover: hover) {
		.cab:hover {
			transform: translateY(-4px) rotate(-1deg);
		}
		.cab:nth-child(even):hover {
			transform: translateY(-4px) rotate(1deg);
		}
	}
	.cab:active {
		transform: translateY(0) scale(0.97);
	}
	.cab:focus-visible {
		outline: 3px solid #ffd23a;
		outline-offset: 3px;
	}
	@media (prefers-reduced-motion: reduce) {
		.cab,
		.cab:hover,
		.cab:nth-child(even):hover,
		.cab[aria-pressed='true'] {
			transition: none;
			transform: none;
		}
		.cab-art,
		.cab-coin {
			animation: none !important;
		}
	}
</style>
