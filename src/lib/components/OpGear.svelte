<!--
	A member's BurgiShop look on their operator emblem (shop.ts; 2026-11-16, the user's ask: "cosmetics
	you can buy with burgers and then equip on your operator"): wraps the emblem with an aura behind it,
	an effect around it and a pin on its corner. The callsign styles and title plates are global classes
	here too (`og-name[data-style]`, `og-title`), used by OperatorTag and the shop. Our own drawings;
	reduced motion = still pictures. Decorative: the shop and the header say in words what's worn.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import ShopPin from './ShopPin.svelte';

	let {
		aura = null,
		effect = null,
		badge = null,
		pin = 24,
		children
	}: { aura?: string | null; effect?: string | null; badge?: string | null; pin?: number; children: Snippet } = $props();

	/** Particle places (% of the box) and delays, the same for every effect so they spread out. */
	const PARTS = [
		{ x: 8, y: 22, d: 0 },
		{ x: 86, y: 14, d: 0.6 },
		{ x: 92, y: 62, d: 1.2 },
		{ x: 4, y: 70, d: 1.8 },
		{ x: 50, y: 2, d: 0.9 },
		{ x: 28, y: 92, d: 2.4 },
		{ x: 72, y: 90, d: 1.5 },
		{ x: 62, y: 30, d: 2.1 }
	];
</script>

<span class="og" data-aura={aura} data-effect={effect}>
	{#if aura}<span class="og-aura" data-aura={aura} aria-hidden="true"><i></i></span>{/if}
	<span class="og-body">{@render children()}</span>
	{#if effect === 'fx-burgers'}
		<span class="og-orbit" aria-hidden="true">
			{#each [0, 120, 240] as a (a)}
				<i style:--a="{a}deg"
					><svg viewBox="0 0 24 24" width="14" height="14"
						><path d="M3 11c0-4.4 4-7 9-7s9 2.6 9 7z" fill="#e0a040" stroke="#5a3200" stroke-width="1.4" /><path d="M2.5 12.5h19l-1.5 2h-16z" fill="#4fb23a" /><rect x="3" y="14.2" width="18" height="2.8" rx="1.2" fill="#6b3a1c" /><path
							d="M3.5 17.5h17c0 2-1.5 3-3.5 3H7c-2 0-3.5-1-3.5-3z"
							fill="#e0a040"
							stroke="#5a3200"
							stroke-width="1.4"
						/></svg
					></i
				>
			{/each}
		</span>
	{:else if effect}
		<span class="og-fx" data-effect={effect} aria-hidden="true">
			{#each PARTS as p, i (i)}<i style:left="{p.x}%" style:top="{p.y}%" style:animation-delay="-{p.d}s"></i>{/each}
		</span>
	{/if}
	{#if badge}<span class="og-pin" aria-hidden="true"><ShopPin id={badge} size={pin} /></span>{/if}
</span>

<style>
	.og {
		position: relative;
		display: inline-grid;
		place-items: center;
		flex: none;
		isolation: isolate;
	}
	.og-body {
		position: relative;
		z-index: 1;
		display: grid;
		place-items: center;
	}
	/* ---------- auras: a glow behind the emblem ---------- */
	.og-aura {
		position: absolute;
		inset: -24%;
		z-index: 0;
		border-radius: 999px;
		pointer-events: none;
	}
	.og-aura i {
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}
	.og-aura[data-aura='aura-gold'] i {
		background: radial-gradient(circle, rgb(255 214 80 / 0.85) 0 30%, rgb(255 170 20 / 0.35) 52%, transparent 70%);
		animation: og-breathe 2.6s ease-in-out infinite;
	}
	.og-aura[data-aura='aura-toxic'] i {
		background: radial-gradient(circle at 50% 55%, rgb(130 255 60 / 0.8) 0 26%, rgb(60 200 30 / 0.4) 50%, transparent 70%);
		filter: blur(2px);
		animation: og-wobble 3.4s ease-in-out infinite;
	}
	.og-aura[data-aura='aura-neon'] i {
		inset: 10%;
		box-shadow:
			0 0 0 3px #5ce1ff,
			0 0 16px 4px #5ce1ff,
			inset 0 0 14px 2px #ff5ca8;
		animation: og-neon 2s ease-in-out infinite alternate;
	}
	.og-aura[data-aura='aura-fire'] i {
		background:
			radial-gradient(ellipse 45% 60% at 50% 70%, rgb(255 240 120 / 0.95), transparent 70%),
			radial-gradient(ellipse 60% 75% at 50% 62%, rgb(255 120 20 / 0.85), transparent 72%),
			radial-gradient(ellipse 70% 90% at 50% 55%, rgb(220 30 20 / 0.6), transparent 75%);
		filter: blur(1.5px);
		transform-origin: 50% 90%;
		animation: og-flicker 0.9s ease-in-out infinite alternate;
	}
	.og-aura[data-aura='aura-iri'] i {
		inset: 6%;
		background: conic-gradient(from 0deg, #ff5ca8, #ffd23a, #7dff6a, #5ce1ff, #b265ff, #ff5ca8);
		filter: blur(7px);
		opacity: 0.85;
		animation: og-spin 5s linear infinite;
	}
	.og-aura[data-aura='aura-storm'] i {
		background: radial-gradient(circle, rgb(120 170 255 / 0.75) 0 28%, rgb(40 70 200 / 0.45) 52%, transparent 70%);
		animation: og-storm 3.2s steps(1) infinite;
	}
	.og-aura[data-aura='aura-storm']::after {
		/* a lightning bolt now and then */
		content: '';
		position: absolute;
		inset: 8% 30% 30% 38%;
		background: linear-gradient(160deg, transparent 40%, #e8f4ff 41% 47%, transparent 48%), linear-gradient(200deg, transparent 52%, #e8f4ff 53% 58%, transparent 59%);
		opacity: 0;
		filter: drop-shadow(0 0 4px #9ac8ff);
		animation: og-bolt 3.2s steps(1) infinite;
	}
	@keyframes og-breathe {
		50% {
			transform: scale(1.1);
			opacity: 0.75;
		}
	}
	@keyframes og-wobble {
		33% {
			transform: translate(3%, -2%) scale(1.06);
		}
		66% {
			transform: translate(-3%, 2%) scale(0.96);
		}
	}
	@keyframes og-neon {
		to {
			box-shadow:
				0 0 0 3px #ff5ca8,
				0 0 18px 5px #ff5ca8,
				inset 0 0 14px 2px #5ce1ff;
		}
	}
	@keyframes og-flicker {
		to {
			transform: scaleY(1.12) scaleX(0.95);
			opacity: 0.85;
		}
	}
	@keyframes og-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes og-storm {
		0%,
		30%,
		38%,
		100% {
			opacity: 0.8;
		}
		32%,
		36% {
			opacity: 1;
			filter: brightness(1.8);
		}
	}
	@keyframes og-bolt {
		0%,
		30%,
		38%,
		100% {
			opacity: 0;
		}
		32%,
		36% {
			opacity: 1;
		}
	}
	/* ---------- effects: particles around the emblem ---------- */
	.og-fx {
		position: absolute;
		inset: -14%;
		z-index: 2;
		pointer-events: none;
	}
	.og-fx i {
		position: absolute;
		display: block;
	}
	.og-fx[data-effect='fx-sparkle'] i {
		width: 9px;
		height: 9px;
		background: #fff6b0;
		clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
		filter: drop-shadow(0 0 3px #ffd23a);
		animation: og-twinkle 2.4s ease-in-out infinite;
	}
	.og-fx[data-effect='fx-embers'] i {
		width: 4px;
		height: 4px;
		border-radius: 999px;
		background: #ffb02a;
		box-shadow: 0 0 6px 2px rgb(255 100 20 / 0.8);
		animation: og-rise 2.4s ease-out infinite;
	}
	.og-fx[data-effect='fx-smoke'] i {
		width: 16px;
		height: 16px;
		border-radius: 999px;
		background: rgb(220 226 220 / 0.7);
		filter: blur(4px);
		animation: og-puff 3.6s ease-out infinite;
	}
	.og-fx[data-effect='fx-diamonds'] i {
		width: 7px;
		height: 7px;
		background: linear-gradient(135deg, #fff, #5ce1ff 60%, #1a6ad8);
		clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
		filter: drop-shadow(0 0 3px #9ae8ff);
		animation: og-dust 3s ease-in-out infinite;
	}
	@keyframes og-twinkle {
		0%,
		100% {
			transform: scale(0.2) rotate(0deg);
			opacity: 0;
		}
		50% {
			transform: scale(1.2) rotate(45deg);
			opacity: 1;
		}
	}
	@keyframes og-rise {
		0% {
			transform: translateY(8px);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		100% {
			transform: translateY(-26px);
			opacity: 0;
		}
	}
	@keyframes og-puff {
		0% {
			transform: translateY(4px) scale(0.4);
			opacity: 0;
		}
		25% {
			opacity: 0.8;
		}
		100% {
			transform: translateY(-22px) scale(1.6);
			opacity: 0;
		}
	}
	@keyframes og-dust {
		0%,
		100% {
			transform: translateY(-4px) scale(0.3);
			opacity: 0;
		}
		50% {
			transform: translateY(6px) scale(1);
			opacity: 1;
		}
	}
	/* burgers circling the emblem */
	.og-orbit {
		position: absolute;
		inset: -10%;
		z-index: 2;
		container-type: size;
		pointer-events: none;
		animation: og-spin 6s linear infinite;
	}
	/* each burger sits on the circle's edge (half the box up from the middle), turned to its place */
	.og-orbit i {
		position: absolute;
		left: 50%;
		top: 50%;
		display: block;
		width: 14px;
		height: 14px;
		margin: -7px;
		transform: rotate(var(--a)) translateY(-50cqh) rotate(calc(-1 * var(--a)));
	}
	.og-orbit i :global(svg) {
		display: block;
		animation: og-spin 6s linear infinite reverse;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.6));
	}
	/* ---------- the pin on the corner ---------- */
	.og-pin {
		position: absolute;
		right: -6%;
		bottom: -4%;
		z-index: 3;
		pointer-events: none;
	}
	/* ---------- callsign styles + title plates (global: OperatorTag and the shop use them) ---------- */
	/* the gradient styles paint the letters with their background, which a text-shadow would cover
	   (shadows are drawn above the background): they get drop-shadow filters instead */
	:global(.og-name[data-style='name-gold']),
	:global(.og-name[data-style='name-chrome']),
	:global(.og-name[data-style='name-fire']),
	:global(.og-name[data-style='name-rainbow']) {
		text-shadow: none !important;
		-webkit-text-stroke: 0 !important;
	}
	:global(.og-name[data-style='name-gold']) {
		background: linear-gradient(180deg, #fff6b0, #ffc928 50%, #c47a00);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.7));
	}
	:global(.og-name[data-style='name-chrome']) {
		background: linear-gradient(180deg, #ffffff 0%, #c9d3dc 40%, #5a6470 52%, #e8eef4 70%, #8a96a2 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.75));
	}
	:global(.og-name[data-style='name-toxic']) {
		color: #9dff5c;
		text-shadow:
			0 0 6px rgb(120 255 60 / 0.9),
			0 0 14px rgb(60 200 30 / 0.7);
	}
	:global(.og-name[data-style='name-fire']) {
		background: linear-gradient(0deg, #ff2a1a 0%, #ff8a1a 45%, #ffe680 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 0 4px rgb(255 100 20 / 0.8)) drop-shadow(0 1px 0 rgb(0 0 0 / 0.7));
	}
	:global(.og-name[data-style='name-rainbow']) {
		background: linear-gradient(90deg, #ff5ca8, #ffd23a, #7dff6a, #5ce1ff, #b265ff, #ff5ca8);
		background-size: 200% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.7));
		animation: og-rainbow 4s linear infinite;
	}
	@keyframes og-rainbow {
		to {
			background-position: 200% 0;
		}
	}
	:global(.og-title) {
		display: inline-block;
		margin-top: 2px;
		padding: 1px 8px;
		border: 1px solid var(--og-r, #9aa3ad);
		border-radius: 4px;
		background: color-mix(in srgb, var(--og-r, #9aa3ad) 22%, rgb(0 0 0 / 0.45));
		color: #fff;
		font-family: var(--t-font-head);
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.16em;
		line-height: 1.5;
		text-transform: uppercase;
		white-space: nowrap;
		text-shadow: 0 1px 1px rgb(0 0 0 / 0.6);
	}
	:global(.og-title[data-rarity='rare']) {
		--og-r: #4f9bff;
	}
	:global(.og-title[data-rarity='epic']) {
		--og-r: #b265ff;
	}
	:global(.og-title[data-rarity='legendary']) {
		--og-r: #ffc928;
		box-shadow: 0 0 8px rgb(255 201 40 / 0.6);
	}
	@media (prefers-reduced-motion: reduce) {
		.og-aura i,
		.og-aura::after,
		.og-orbit,
		.og-orbit i :global(svg),
		.og-fx i,
		:global(.og-name[data-style='name-rainbow']) {
			animation: none !important;
		}
		.og-fx i {
			opacity: 0.8;
		}
	}
</style>
