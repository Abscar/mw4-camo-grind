<!--
	The daily bonus's gift box (2026-11-20, BurgiCasino's floor: "lots of dopamine and fun things"): a red
	present with a gold ribbon and bow whose lid hops now and then, burger coins peeking out and a few
	twinkles round it. Our own cartoon, decorative (the box beside it says the bonus in words). The hop
	and twinkles are endless animations (the page's pause button stops them; off with reduced motion).
-->
<script lang="ts">
	import FloorArt from './FloorArt.svelte';

	let { size = 64 }: { size?: number } = $props();
	const uid = $props.id();
	const u = `gift-${uid}`;
	const O = '#2a0808';
</script>

<span class="gift" style:--s="{size}px" aria-hidden="true">
	<svg viewBox="0 0 64 64" width={size} height={size} focusable="false">
		<defs>
			<linearGradient id="{u}-box" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4a5a" /><stop offset=".6" stop-color="#d0142c" /><stop offset="1" stop-color="#860818" /></linearGradient>
			<linearGradient id="{u}-rib" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b86e00" /><stop offset=".45" stop-color="#ffe680" /><stop offset="1" stop-color="#c88400" /></linearGradient>
			<radialGradient id="{u}-glow"><stop offset="0" stop-color="#ffe680" stop-opacity=".75" /><stop offset="1" stop-color="#ffb000" stop-opacity="0" /></radialGradient>
		</defs>
		<ellipse cx="32" cy="58.5" rx="22" ry="3.4" fill="#000" opacity=".35" />
		<!-- the glow and coins inside, seen when the lid lifts -->
		<ellipse class="gift-glow" cx="32" cy="30" rx="22" ry="12" fill="url(#{u}-glow)" />
		<!-- the box -->
		<rect x="11" y="30" width="42" height="27" rx="3" fill="url(#{u}-box)" stroke={O} stroke-width="1.6" />
		<rect x="28.5" y="30" width="7" height="27" fill="url(#{u}-rib)" stroke="#7a4a00" stroke-width="1" />
		<path d="M14 34 h36" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".35" />
		<!-- the lid with its bow -->
		<g class="gift-lid">
			<path d="M32 22 C24 11 15 14 18 19 C20 23 27 22 32 22 Z" fill="url(#{u}-rib)" stroke="#7a4a00" stroke-width="1.2" />
			<path d="M32 22 C40 11 49 14 46 19 C44 23 37 22 32 22 Z" fill="url(#{u}-rib)" stroke="#7a4a00" stroke-width="1.2" />
			<rect x="8" y="21" width="48" height="10" rx="2.6" fill="url(#{u}-box)" stroke={O} stroke-width="1.6" />
			<rect x="28" y="21" width="8" height="10" fill="url(#{u}-rib)" stroke="#7a4a00" stroke-width="1" />
			<circle cx="32" cy="21.6" r="3.2" fill="#ffd23a" stroke="#7a4a00" stroke-width="1" />
			<path d="M11 23.6 h42" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".4" />
		</g>
	</svg>
	<span class="gift-tw t1"><FloorArt kind="sparkle" size={12} tint="#fff6b0" /></span>
	<span class="gift-tw t2"><FloorArt kind="sparkle" size={9} tint="#ff9ad0" /></span>
	<span class="gift-tw t3"><FloorArt kind="sparkle" size={10} tint="#8ff4ff" /></span>
</span>

<style>
	.gift {
		position: relative;
		display: block;
		width: var(--s);
		height: var(--s);
		filter: drop-shadow(0 0 10px rgb(255 120 160 / 0.35));
	}
	.gift svg {
		display: block;
		overflow: visible;
	}
	/* the lid hops now and then (a little rattle, as if something inside wants out) */
	.gift-lid {
		transform-box: fill-box;
		transform-origin: 50% 100%;
		animation: lid-hop 5s ease-in-out infinite;
	}
	@keyframes lid-hop {
		0%,
		72%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		78% {
			transform: translateY(-7px) rotate(-7deg);
		}
		84% {
			transform: translateY(0) rotate(0deg);
		}
		89% {
			transform: translateY(-3px) rotate(4deg);
		}
		94% {
			transform: translateY(0) rotate(0deg);
		}
	}
	.gift-glow {
		opacity: 0;
		animation: lid-glow 5s ease-in-out infinite;
	}
	@keyframes lid-glow {
		0%,
		72%,
		90%,
		100% {
			opacity: 0;
		}
		78% {
			opacity: 1;
		}
	}
	.gift-tw {
		position: absolute;
		animation: gift-tw 2.8s ease-in-out infinite;
	}
	.gift-tw.t1 {
		left: -2px;
		top: 6%;
	}
	.gift-tw.t2 {
		right: -1px;
		top: 18%;
		animation-delay: -1s;
	}
	.gift-tw.t3 {
		right: 10%;
		bottom: 6%;
		animation-delay: -1.9s;
	}
	@keyframes gift-tw {
		0%,
		100% {
			opacity: 0.1;
			transform: scale(0.5) rotate(0deg);
		}
		50% {
			opacity: 1;
			transform: scale(1) rotate(45deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.gift-lid,
		.gift-glow,
		.gift-tw {
			animation: none;
		}
	}
</style>
