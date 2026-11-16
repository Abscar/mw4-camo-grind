<!--
	A member's BurgiShop look on their operator emblem (shop.ts; 2026-11-16, the user's ask: "cosmetics
	you can buy with burgers and then equip on your operator"): wraps the emblem with an aura behind it,
	an effect around it and a pin on its corner. The callsign styles and title plates are global classes
	here too (`og-name[data-style]`, `og-title`), used by OperatorTag and the shop. Our own drawings;
	reduced motion = still pictures. Decorative: the shop and the header say in words what's worn.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';
	import ShopPin from './ShopPin.svelte';

	let {
		aura = null,
		effect = null,
		badge = null,
		pin = 24,
		smoked = false,
		children
	}: {
		aura?: string | null;
		effect?: string | null;
		badge?: string | null;
		pin?: number;
		/** A friend's Smoke Bomb (shop.ts PRANKS): the emblem disappears in a thick cloud for an hour. */
		smoked?: boolean;
		children: Snippet;
	} = $props();

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
	{:else if effect === 'fx-leaves'}
		<!-- Leaf Storm: cannabis leaves swirling round the emblem -->
		<span class="og-fx og-leaves" aria-hidden="true">
			{#each PARTS as p, i (i)}
				<i style:left="{p.x}%" style:top="{p.y}%" style:animation-delay="-{p.d * 1.3}s"
					><svg viewBox="0 0 24 24" width="13" height="13"
						>{#each LEAF_PATHS as d, j (j)}<path {d} fill={i % 2 ? '#3fb34a' : '#6fd34a'} stroke="#14501a" stroke-width="0.8" />{/each}<path
							d={LEAF_STEM}
							stroke="#14501a"
							stroke-width="1.4"
						/></svg
					></i
				>
			{/each}
		</span>
	{:else if effect === 'fx-munchies'}
		<!-- Munchies: snacks floating round the emblem -->
		<span class="og-fx og-munchies" aria-hidden="true">
			{#each PARTS.slice(0, 6) as p, i (i)}
				<i style:left="{p.x}%" style:top="{p.y}%" style:animation-delay="-{p.d}s"
					><svg viewBox="0 0 24 24" width="14" height="14">
						{#if i % 6 === 0}
							<!-- pizza slice -->
							<path d="M4 5 Q12 1 20 5 L12 22 Z" fill="#ffcf4a" stroke="#6a3a0a" stroke-width="1.3" stroke-linejoin="round" /><path d="M4 5 Q12 1 20 5" fill="none" stroke="#c9822a" stroke-width="2.4" /><circle cx="10" cy="9" r="1.6" fill="#d8352a" /><circle cx="14" cy="12" r="1.5" fill="#d8352a" /><circle cx="12" cy="16.5" r="1.2" fill="#d8352a" />
						{:else if i % 6 === 1}
							<!-- donut -->
							<circle cx="12" cy="12" r="9" fill="#e0a050" stroke="#6a3a0a" stroke-width="1.3" /><path d="M5 10 Q6 4 12 3.6 Q18 4 19.4 10 Q17 12 15.2 10.4 Q12 13 9 10.6 Q7 12.4 5 10 Z" fill="#ff7ab8" /><circle cx="12" cy="12" r="3" fill="#1d0e05" /><path d="M8 7 l1 1 M14 6 l-1 1.2 M16.5 8.6 l1.2 .4" stroke="#fff" stroke-width="1.1" stroke-linecap="round" />
						{:else if i % 6 === 2}
							<!-- crisps packet -->
							<path d="M5 3 L19 3 L18 21 L6 21 Z" fill="#e2261f" stroke="#5a0a0a" stroke-width="1.3" stroke-linejoin="round" /><path d="M5 3 l1.4 1.6 l1.4 -1.6 l1.4 1.6 l1.4 -1.6 l1.4 1.6 l1.4 -1.6 l1.4 1.6 l1.4 -1.6 l1.4 1.6 l1.4 -1.6" fill="none" stroke="#5a0a0a" stroke-width="0.9" /><ellipse cx="12" cy="13" rx="4" ry="3" fill="#ffd23a" />
						{:else if i % 6 === 3}
							<!-- burger -->
							<path d="M3 11c0-4.4 4-7 9-7s9 2.6 9 7z" fill="#e0a040" stroke="#5a3200" stroke-width="1.4" /><path d="M2.5 12.5h19l-1.5 2h-16z" fill="#4fb23a" /><rect x="3" y="14.2" width="18" height="2.8" rx="1.2" fill="#6b3a1c" /><path d="M3.5 17.5h17c0 2-1.5 3-3.5 3H7c-2 0-3.5-1-3.5-3z" fill="#e0a040" stroke="#5a3200" stroke-width="1.4" />
						{:else if i % 6 === 4}
							<!-- fries -->
							<path d="M7 9 L8 2 M10 9 L10.5 1.5 M13 9 L13.4 2 M16 9 L16 2.5" stroke="#ffd23a" stroke-width="2.4" stroke-linecap="round" /><path d="M5 8 L19 8 L17 22 L7 22 Z" fill="#e2261f" stroke="#5a0a0a" stroke-width="1.3" stroke-linejoin="round" />
						{:else}
							<!-- chocolate bar -->
							<rect x="5" y="3" width="14" height="18" rx="1.5" fill="#5a2e14" stroke="#2a1006" stroke-width="1.3" /><path d="M5 9 H19 M5 15 H19 M12 3 V21" stroke="#3a1a08" stroke-width="1" /><path d="M5 14 L19 10 L19 21 L5 21 Z" fill="#c9d3dc" stroke="#2a1006" stroke-width="1" />
						{/if}
					</svg></i
				>
			{/each}
		</span>
	{:else if effect}
		<span class="og-fx" data-effect={effect} aria-hidden="true">
			{#each PARTS as p, i (i)}<i style:left="{p.x}%" style:top="{p.y}%" style:animation-delay="-{p.d}s"></i>{/each}
		</span>
	{/if}
	{#if badge}<span class="og-pin" aria-hidden="true"><ShopPin id={badge} size={pin} /></span>{/if}
	{#if smoked}
		<span class="og-bomb" aria-hidden="true">
			{#each [[30, 40, 0], [62, 34, -0.8], [46, 62, -1.6], [22, 66, -2.2], [74, 64, -0.4], [50, 22, -1.2], [40, 48, -2.6]] as [x, y, d], i (i)}
				<i style:left="{x}%" style:top="{y}%" style:animation-delay="{d}s"></i>
			{/each}
		</span>
	{/if}
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
	/* Kush Cloud: thick green smoke rolling round the emblem */
	.og-aura[data-aura='aura-kush'] i {
		background:
			radial-gradient(circle at 30% 40%, rgb(140 255 90 / 0.75) 0 18%, transparent 42%),
			radial-gradient(circle at 70% 35%, rgb(90 220 60 / 0.7) 0 20%, transparent 44%),
			radial-gradient(circle at 50% 70%, rgb(60 190 40 / 0.65) 0 24%, transparent 50%),
			radial-gradient(circle, rgb(40 140 30 / 0.45) 0 40%, transparent 70%);
		filter: blur(3px);
		animation: og-kush 6s ease-in-out infinite;
	}
	@keyframes og-kush {
		0%,
		100% {
			transform: rotate(0deg) scale(1);
		}
		50% {
			transform: rotate(40deg) scale(1.12);
		}
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
	/* Leaf Storm: leaves tumbling round and down */
	.og-leaves i {
		animation: og-leaf 3.4s ease-in-out infinite;
	}
	.og-leaves i :global(svg) {
		display: block;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.6));
	}
	@keyframes og-leaf {
		0% {
			transform: translate(0, -10px) rotate(0deg) scale(0.6);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		100% {
			transform: translate(8px, 16px) rotate(320deg) scale(1);
			opacity: 0;
		}
	}
	/* Munchies: snacks bobbing round the emblem */
	.og-munchies i {
		animation: og-munch 2.6s ease-in-out infinite alternate;
	}
	.og-munchies i :global(svg) {
		display: block;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.6));
	}
	@keyframes og-munch {
		from {
			transform: translateY(-4px) rotate(-14deg);
		}
		to {
			transform: translateY(4px) rotate(14deg);
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
	/* ---------- a Smoke Bomb: thick grey clouds over the whole emblem ---------- */
	.og-bomb {
		position: absolute;
		inset: -16%;
		z-index: 4;
		pointer-events: none;
	}
	.og-bomb i {
		position: absolute;
		width: 62%;
		height: 62%;
		margin: -31% 0 0 -31%;
		border-radius: 999px;
		background: radial-gradient(circle at 40% 35%, rgb(235 238 235 / 0.97), rgb(170 176 172 / 0.92) 55%, rgb(120 126 122 / 0) 72%);
		filter: blur(1.5px);
		animation: og-bomb 3.2s ease-in-out infinite alternate;
	}
	@keyframes og-bomb {
		from {
			transform: translate(-6%, 4%) scale(0.92);
		}
		to {
			transform: translate(6%, -6%) scale(1.1);
		}
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
	:global(.og-name[data-style='name-rainbow']),
	:global(.og-name[data-style='name-rasta']) {
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
	/* Rasta: red, gold and green bands across the letters */
	:global(.og-name[data-style='name-rasta']) {
		background: linear-gradient(180deg, #ff3a2a 0 34%, #ffd23a 34% 66%, #2fc85a 66%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.85)) drop-shadow(0 0 4px rgb(60 200 80 / 0.5));
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
		.og-leaves i,
		.og-munchies i,
		.og-bomb i,
		:global(.og-name[data-style='name-rainbow']) {
			animation: none !important;
		}
		.og-fx i {
			opacity: 0.8;
		}
	}
</style>
