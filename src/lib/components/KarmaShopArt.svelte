<!--
	KarmaShop's picture (2026-11-20; karma-shop.ts): a glossy pink heart with white angel wings and a gold halo,
	in the same chunky cartoon style and 64×56 box as the casino's tab pictures (CasinoTabArt). Used on the
	shop switch and the KarmaShop heading. The heart beats and the halo glints while `alive` (frozen by
	reduced motion). Decorative.
-->
<script lang="ts">
	import { heartPath } from '#lib/karmaShopArt.ts';

	let { size = 56, alive = true }: { size?: number; alive?: boolean } = $props();
	const uid = $props.id();
	const WING = 'M24 30 C18 18 8 12 2 14 C4 18 3 21 6 23 C3 25 4 29 8 30 C6 33 9 36 13 35 C13 38 18 40 22 38 Z';
</script>

<svg class="karma-art" class:alive viewBox="0 0 64 56" width={size} height={Math.round((size * 56) / 64)} aria-hidden="true" focusable="false">
	<defs>
		<radialGradient id="{uid}-h" cx="0.36" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffe0ee" /><stop offset="0.45" stop-color="#ff5a9e" /><stop offset="1" stop-color="#b8104a" /></radialGradient>
		<linearGradient id="{uid}-w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" /><stop offset="1" stop-color="#d6e0f8" /></linearGradient>
		<linearGradient id="{uid}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe0" /><stop offset="0.5" stop-color="#ffd23a" /><stop offset="1" stop-color="#b07400" /></linearGradient>
	</defs>
	<!-- wings -->
	<g class="ka-wing-l" fill="url(#{uid}-w)" stroke="#6d7ca4" stroke-width="1.2" stroke-linejoin="round">
		<path d={WING} />
		<path d="M7 23 Q15 25 22 31 M9 30 Q16 32 21 35" fill="none" stroke="#a4b2d4" stroke-width="1" stroke-linecap="round" />
	</g>
	<g transform="translate(64 0) scale(-1 1)">
		<g class="ka-wing-l" fill="url(#{uid}-w)" stroke="#6d7ca4" stroke-width="1.2" stroke-linejoin="round">
			<path d={WING} />
			<path d="M7 23 Q15 25 22 31 M9 30 Q16 32 21 35" fill="none" stroke="#a4b2d4" stroke-width="1" stroke-linecap="round" />
		</g>
	</g>
	<!-- halo -->
	<ellipse cx="32" cy="8" rx="11" ry="3.2" fill="none" stroke="#6a4400" stroke-width="3.4" />
	<ellipse cx="32" cy="8" rx="11" ry="3.2" fill="none" stroke="url(#{uid}-g)" stroke-width="2.2" />
	<path class="ka-glint" d="M25 5.8 Q30 4.4 35 5" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round" />
	<!-- the heart -->
	<g class="ka-heart">
		<path d={heartPath(32, 31, 32)} fill="url(#{uid}-h)" stroke="#4a0420" stroke-width="2" stroke-linejoin="round" />
		<ellipse cx="24.4" cy="22.6" rx="4" ry="2.4" transform="rotate(-32 24.4 22.6)" fill="#fff" opacity="0.7" />
		<circle cx="20.8" cy="27" r="1.1" fill="#fff" opacity="0.6" />
	</g>
	<path class="ka-sparkle" d="M52 40 l1 2.6 2.6 1 -2.6 1 -1 2.6 -1 -2.6 -2.6 -1 2.6 -1z" fill="#fff6c0" />
	<path class="ka-sparkle s2" d="M11 42 l.8 2 2 .8 -2 .8 -.8 2 -.8 -2 -2 -.8 2 -.8z" fill="#ffd0e6" />
</svg>

<style>
	.karma-art {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.55));
	}
	.alive .ka-heart {
		transform-box: fill-box;
		transform-origin: center;
		animation: ka-art-beat 1.5s ease-in-out infinite;
	}
	.alive .ka-wing-l {
		transform-box: fill-box;
		transform-origin: 100% 60%;
		animation: ka-art-flap 2.4s ease-in-out infinite;
	}
	.alive .ka-sparkle {
		transform-box: fill-box;
		transform-origin: center;
		animation: ka-art-twinkle 2.2s ease-in-out infinite;
	}
	.alive .ka-sparkle.s2 {
		animation-delay: -1.1s;
	}
	.alive .ka-glint {
		animation: ka-art-glint 3s ease-in-out infinite;
	}
	@keyframes ka-art-beat {
		0%,
		40%,
		100% {
			transform: scale(1);
		}
		15% {
			transform: scale(1.1);
		}
		28% {
			transform: scale(1.03);
		}
	}
	@keyframes ka-art-flap {
		50% {
			transform: rotate(-10deg);
		}
	}
	@keyframes ka-art-twinkle {
		0%,
		100% {
			transform: scale(0.3);
			opacity: 0.2;
		}
		50% {
			transform: scale(1.15);
			opacity: 1;
		}
	}
	@keyframes ka-art-glint {
		0%,
		60%,
		100% {
			opacity: 0.2;
		}
		75% {
			opacity: 1;
		}
	}
</style>
