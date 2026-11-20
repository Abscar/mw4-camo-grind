<!--
	BurgiCasino's head (2026-11-20, the user: "snygga till hela 'Burgicasino' fliken, mycket dopamin och kul
	grejer på skärmen"): a marquee sign. A velvet board with a gold rim, a row of light bulbs round its edge
	that chase (two sets taking turns, slowly), two soft spotlights sweeping across it, a burger coin that
	turns now and then, the name in gold neon with a slow shine, the games under it, and your burgers on
	the balance pill (CasinoBalance). Keeps #casino-h + the line after it (the checks look for them).
	The bulbs, beams and shine are endless animations: app.html's pause button stops them, reduced motion
	switches them off.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import CasinoBalance from './CasinoBalance.svelte';
	import FloorArt from './FloorArt.svelte';

	let { on, value, snapKey, onbig }: { on: boolean; value: number; snapKey: string; onbig?: (gain: number) => void } = $props();
	const c = t.casino;
</script>

<header class="sign">
	<div class="sign-board">
		<span class="sign-fx" aria-hidden="true"></span>
		<span class="sign-bulbs" aria-hidden="true"></span>
		<div class="sign-row">
			<div class="sign-name">
				<span class="sign-coin" aria-hidden="true"><FloorArt kind="coin" size={50} /></span>
				<div class="min-w-0">
					<h2 id="casino-h" class="casino-title font-head">{c.heading}</h2>
					<span class="sign-sub font-head">{c.sub}</span>
				</div>
			</div>
			{#if on}
				<div class="sign-bal"><CasinoBalance {value} {snapKey} {onbig} /></div>
			{/if}
		</div>
	</div>
</header>

<style>
	.sign {
		padding: 14px 14px 4px;
	}
	@media (min-width: 640px) {
		.sign {
			padding: 18px 20px 6px;
		}
	}
	.sign-board {
		position: relative;
		border-radius: 18px;
		padding: 22px 20px;
		background:
			radial-gradient(90% 120% at 50% -10%, rgb(255 80 170 / 0.32), transparent 60%),
			radial-gradient(60% 90% at 100% 100%, rgb(45 226 230 / 0.16), transparent 60%),
			linear-gradient(180deg, #4a0c3c 0%, #2a0726 55%, #160416 100%);
		box-shadow:
			inset 0 0 0 2px #ffd23a,
			inset 0 0 0 5px #3a1200,
			inset 0 0 0 6.5px rgb(255 201 40 / 0.55),
			inset 0 0 30px rgb(0 0 0 / 0.55),
			0 0 22px rgb(255 60 160 / 0.32),
			0 6px 16px rgb(0 0 0 / 0.45);
		color: #fff3dc;
	}
	@media (min-width: 640px) {
		.sign-board {
			padding: 26px 30px;
		}
	}
	/* the spotlights (the two pseudo-elements), clipped to the board; the board itself doesn't clip, so the
	   coins from the balance may spill over its edge */
	.sign-fx {
		position: absolute;
		inset: 0;
		overflow: hidden;
		border-radius: inherit;
		pointer-events: none;
	}
	.sign-fx::before,
	.sign-fx::after {
		content: '';
		position: absolute;
		top: -40%;
		width: 34%;
		height: 190%;
		transform-origin: 50% 0;
		clip-path: polygon(42% 0, 58% 0, 100% 100%, 0 100%);
		mix-blend-mode: screen;
		animation: beam-sweep 11s ease-in-out infinite alternate;
	}
	.sign-fx::before {
		left: 6%;
		background: linear-gradient(180deg, rgb(255 120 200 / 0.3), rgb(255 120 200 / 0) 80%);
	}
	.sign-fx::after {
		right: 6%;
		background: linear-gradient(180deg, rgb(120 240 255 / 0.26), rgb(120 240 255 / 0) 80%);
		animation-delay: -5.5s;
		animation-direction: alternate-reverse;
	}
	@keyframes beam-sweep {
		from {
			transform: rotate(-24deg);
		}
		to {
			transform: rotate(24deg);
		}
	}
	/* marquee bulbs on all four edges: two sets half a bulb apart that take turns (a slow chase) */
	.sign-bulbs {
		position: absolute;
		inset: 8px;
		pointer-events: none;
	}
	.sign-bulbs::before,
	.sign-bulbs::after {
		--bulb: radial-gradient(circle, #fffdf0 0 1.5px, #ffe066 2.3px, rgb(255 170 0 / 0.55) 3.3px, transparent 4.6px);
		content: '';
		position: absolute;
		inset: 0;
		background:
			var(--bulb) 0 0 / 18px 10px repeat-x,
			var(--bulb) 0 100% / 18px 10px repeat-x,
			var(--bulb) 0 0 / 10px 18px repeat-y,
			var(--bulb) 100% 0 / 10px 18px repeat-y;
		animation: bulbs 1.6s ease-in-out infinite alternate;
	}
	.sign-bulbs::after {
		background-position:
			9px 0,
			9px 100%,
			0 9px,
			100% 9px;
		animation-delay: -1.6s;
	}
	@keyframes bulbs {
		from {
			opacity: 1;
		}
		to {
			opacity: 0.22;
		}
	}
	.sign-row {
		position: relative;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px 18px;
	}
	.sign-name {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 13rem;
		flex: 1 1 18rem;
	}
	.sign-coin {
		flex: none;
		perspective: 160px;
	}
	.sign-coin :global(svg) {
		animation: sign-coin 7s ease-in-out infinite;
		filter: drop-shadow(0 0 10px rgb(255 200 60 / 0.55));
	}
	@keyframes sign-coin {
		0%,
		70% {
			transform: rotateY(0deg) translateY(0);
		}
		80% {
			transform: rotateY(180deg) translateY(-5px);
		}
		90%,
		100% {
			transform: rotateY(360deg) translateY(0);
		}
	}
	/* the name: gold neon letters with a pink glow and a slow shine running across now and then. The
	   gradient paints the letters with their background; the Abscar theme's heading shadow would be drawn
	   on top of it and turn them dark, so it's switched off here (the drop-shadow filters give the glow) */
	.casino-title {
		text-shadow: none !important;
		font-size: clamp(27px, 6.4vw, 42px);
		font-weight: 900;
		line-height: 1;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		background: linear-gradient(100deg, #ffae00 0%, #ffd23a 30%, #fffbe0 42%, #ffd23a 54%, #ffae00 100%) 0 0 / 250% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 2px 0 rgb(80 10 0 / 0.9)) drop-shadow(0 0 10px rgb(255 70 170 / 0.55)) drop-shadow(0 0 2px rgb(255 220 120 / 0.7));
		animation: title-shine 7s ease-in-out infinite;
	}
	@keyframes title-shine {
		0%,
		55% {
			background-position: 100% 0;
		}
		85%,
		100% {
			background-position: 0% 0;
		}
	}
	.sign-sub {
		display: block;
		margin-top: 6px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #8ff4ff;
		text-shadow: 0 0 8px rgb(45 226 230 / 0.6);
	}
	@media (max-width: 480px) {
		.sign-name {
			gap: 10px;
		}
		.sign-coin :global(svg) {
			width: 40px;
			height: 40px;
		}
		.sign-sub {
			font-size: 10px;
			letter-spacing: 0.08em;
		}
	}
	/* the balance pill sits on the right, also when it wraps under the name on a phone */
	.sign-bal {
		position: relative;
		z-index: 3;
		margin-left: auto;
	}
	@media (prefers-reduced-motion: reduce) {
		.sign-fx::before,
		.sign-fx::after,
		.sign-bulbs::before,
		.sign-bulbs::after,
		.sign-coin :global(svg),
		.casino-title {
			animation: none;
		}
	}
</style>
