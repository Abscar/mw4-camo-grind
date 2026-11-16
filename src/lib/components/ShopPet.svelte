<!--
	BurgiShop's sidekicks (shop.ts slot `pet`; the 420 pack 2, 2026-11-16, the user: "kör 420 paketet", the
	pack list's "a sidekick on the shoulder"). OpGear sits one on the operator's left shoulder; the shop shows
	it on its item card. Our own little cartoons in a 32×32 box, each bobbing / waving (frozen by reduced
	motion). Decoration only: the shop says in words what's worn.
	  pet-burger = Burger Buddy (a burger with a face, waving), pet-smokey = Smokey (a sleepy smoke cloud
	  with a mini holk), pet-bud = Lil' Bud (a small weed-leaf creature with a holk, in a green glow).
-->
<script lang="ts">
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';

	let { id, size = 30 }: { id: string; size?: number } = $props();
	const uid = $props.id();
	const g = (name: string) => `${uid}-${name}`;
</script>

<svg viewBox="0 0 32 32" width={size} height={size} class="shop-pet" data-pet={id} aria-hidden="true" focusable="false">
	<defs>
		<radialGradient id={g('bun')} cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#ffd896" /><stop offset=".45" stop-color="#f0a24a" /><stop offset="1" stop-color="#b0581b" /></radialGradient>
		<radialGradient id={g('cloud')} cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff" /><stop offset=".7" stop-color="#dfe6e1" /><stop offset="1" stop-color="#aeb9b2" /></radialGradient>
		<radialGradient id={g('em')}><stop offset="0" stop-color="#ff8a1a" stop-opacity=".95" /><stop offset="1" stop-color="#ff5a00" stop-opacity="0" /></radialGradient>
		<radialGradient id={g('glow')}><stop offset="0" stop-color="#7dff5a" stop-opacity=".55" /><stop offset="1" stop-color="#2aff1a" stop-opacity="0" /></radialGradient>
	</defs>

	{#if id === 'pet-burger'}
		<g class="pet-bob">
			<!-- little legs and feet -->
			<path d="M13 25.6 L12.4 29.6 M19 25.6 L19.6 29.6" stroke="#5a3200" stroke-width="1.4" stroke-linecap="round" />
			<ellipse cx="11.6" cy="30" rx="1.8" ry=".9" fill="#2a1a10" /><ellipse cx="20.4" cy="30" rx="1.8" ry=".9" fill="#2a1a10" />
			<!-- bottom bun, patty, cheese, lettuce, top bun -->
			<path d="M6 20.4 H26 Q26 25.6 21 25.6 H11 Q6 25.6 6 20.4 Z" fill={`url(#${g('bun')})`} stroke="#5a3200" stroke-width="1" />
			<rect x="5.4" y="17.4" width="21.2" height="3.6" rx="1.8" fill="#6b3a1c" stroke="#3a1a08" stroke-width=".8" />
			<path d="M5.6 16.6 H26.4 L26 17.8 H22 L20.6 20 L19.2 17.8 H10.4 L9.4 19.2 L8.4 17.8 H5.8 Z" fill="#ffc928" stroke="#a87a0c" stroke-width=".5" stroke-linejoin="round" />
			<path d="M5 15.4 H27 L27.2 16.6 Q26 17.8 24.8 16.6 Q23.6 17.8 22.4 16.6 Q21.2 17.8 20 16.6 Q18.8 17.8 17.6 16.6 Q16.4 17.8 15.2 16.6 Q14 17.8 12.8 16.6 Q11.6 17.8 10.4 16.6 Q9.2 17.8 8 16.6 Q6.8 17.8 5.4 16.6 Z" fill="#66c93c" stroke="#24561a" stroke-width=".5" />
			<path d="M5.6 15.6 C5.6 8 10.4 5 16 5 C21.6 5 26.4 8 26.4 15.6 Z" fill={`url(#${g('bun')})`} stroke="#5a3200" stroke-width="1" />
			<g fill="#fff4d6"><ellipse cx="10" cy="8.6" rx=".8" ry=".45" transform="rotate(-20 10 8.6)" /><ellipse cx="21.6" cy="8.2" rx=".8" ry=".45" transform="rotate(20 21.6 8.2)" /><ellipse cx="16" cy="6.6" rx=".8" ry=".45" /></g>
			<!-- face on the top bun -->
			<circle cx="12.6" cy="11" r="2.3" fill="#fff" stroke="#3a1a08" stroke-width=".6" /><circle cx="19.4" cy="11" r="2.3" fill="#fff" stroke="#3a1a08" stroke-width=".6" />
			<circle cx="13.1" cy="11.4" r="1.15" fill="#1a0e05" /><circle cx="19.9" cy="11.4" r="1.15" fill="#1a0e05" />
			<path d="M13.2 13.8 Q16 16 18.8 13.8" fill="none" stroke="#3a1a08" stroke-width=".9" stroke-linecap="round" />
			<!-- waving arm -->
			<g class="pet-wave">
				<path d="M26 17 L29.4 12.4" stroke="#5a3200" stroke-width="1.4" stroke-linecap="round" />
				<circle cx="29.6" cy="11.8" r="1.4" fill="#f0a24a" stroke="#5a3200" stroke-width=".7" />
			</g>
		</g>
	{:else if id === 'pet-smokey'}
		<g class="pet-float">
			<!-- a sleepy little smoke cloud with a wavy tail -->
			<path
				d="M7 21.6 C2.8 21.6 2.6 15.6 7.2 15 C6.6 9.6 12.6 7.4 15.6 10.4 C17.8 5.8 25.6 6.8 25.2 12.6 C29.8 13 30 20.6 25.4 21.6 Q24 25.6 22 22.6 Q20.4 26 18.4 22.8 Q16.6 26 14.6 22.8 Q12.8 26 10.8 22.8 Q9 25.6 7 21.6 Z"
				fill={`url(#${g('cloud')})`}
				stroke="#8a968f"
				stroke-width=".8"
				stroke-linejoin="round"
			/>
			<!-- half-shut eyes, rosy cheeks, a lazy smile -->
			<ellipse cx="12.8" cy="15.6" rx="1.5" ry="1.9" fill="#1c2420" /><ellipse cx="19.4" cy="15.6" rx="1.5" ry="1.9" fill="#1c2420" />
			<path d="M11 15.2 Q12.8 13 14.6 15.2 Z M17.6 15.2 Q19.4 13 21.2 15.2 Z" fill="#cfd7d2" stroke="#8a968f" stroke-width=".4" />
			<ellipse cx="10.4" cy="18.2" rx="1.3" ry=".7" fill="#ff9aa8" opacity=".7" /><ellipse cx="21.8" cy="18.2" rx="1.3" ry=".7" fill="#ff9aa8" opacity=".7" />
			<path d="M14 18.8 Q16 20.2 18 18.8" fill="none" stroke="#1c2420" stroke-width=".8" stroke-linecap="round" />
			<!-- a mini holk in the corner of its mouth -->
			<path d="M17.8 19.4 L24.8 21.4 L24.2 23.2 L17.6 20.4 Z" fill="#f3efe4" stroke="#b9b09a" stroke-width=".35" />
			<circle class="op-ember-glow" cx="24.9" cy="22.4" r="2.2" fill={`url(#${g('em')})`} />
			<circle cx="24.8" cy="22.3" r=".85" fill="#ff8a1a" />
			<circle class="pet-puff" cx="26" cy="19" r="1.4" fill="#e8ede9" opacity=".8" />
		</g>
	{:else if id === 'pet-bud'}
		<circle cx="16" cy="16" r="15" fill={`url(#${g('glow')})`} class="pet-glow" />
		<g class="pet-bob">
			<!-- small green body and feet -->
			<path d="M13.2 29.4 L13.6 26 M18.8 29.4 L18.4 26" stroke="#1d5a14" stroke-width="1.6" stroke-linecap="round" />
			<ellipse cx="16" cy="24.4" rx="4.6" ry="4" fill="#3e8f2a" stroke="#14501a" stroke-width=".8" />
			<!-- a leaf for a head (the shared leaf, leaf.ts) with a round face in the middle -->
			<g transform="translate(4 -1.6)">
				{#each LEAF_PATHS as d, i (i)}<path {d} fill={i % 2 ? '#2f9a26' : '#4fc23a'} stroke="#14501a" stroke-width=".7" />{/each}
				<path d={LEAF_STEM} stroke="#14501a" stroke-width="1" />
			</g>
			<circle cx="16" cy="16.4" r="5.4" fill="#7ad64a" stroke="#14501a" stroke-width=".8" />
			<!-- heavy-lidded red eyes and a big grin -->
			<ellipse cx="14" cy="15.8" rx="1.3" ry="1.2" fill="#fff" /><ellipse cx="18.2" cy="15.8" rx="1.3" ry="1.2" fill="#fff" />
			<circle cx="14.1" cy="16.1" r=".65" fill="#b8202a" /><circle cx="18.3" cy="16.1" r=".65" fill="#b8202a" />
			<path d="M12.6 15.6 Q14 14.2 15.4 15.6 Z M16.8 15.6 Q18.2 14.2 19.6 15.6 Z" fill="#4fa83a" stroke="#14501a" stroke-width=".35" />
			<path d="M13.6 18.4 Q16 20.6 18.4 18.4" fill="#5a1414" stroke="#14501a" stroke-width=".6" stroke-linecap="round" />
			<!-- left arm waves, right hand holds a holk -->
			<g class="pet-wave-l"><path d="M11.6 23 L8.4 19.6" stroke="#2f7a1e" stroke-width="1.5" stroke-linecap="round" /><circle cx="8.2" cy="19.2" r="1.1" fill="#4fc23a" stroke="#14501a" stroke-width=".5" /></g>
			<path d="M20.4 23 L23.6 21.4" stroke="#2f7a1e" stroke-width="1.5" stroke-linecap="round" />
			<path d="M23.2 21.6 L29.2 17.8 L30 19.2 L23.8 22.6 Z" fill="#f3efe4" stroke="#b9b09a" stroke-width=".35" />
			<circle class="op-ember-glow" cx="29.8" cy="18.4" r="2.2" fill={`url(#${g('em')})`} />
			<circle cx="29.7" cy="18.4" r=".8" fill="#ff8a1a" />
			<circle class="pet-puff" cx="29.6" cy="15" r="1.3" fill="#e8ede9" opacity=".8" />
			<circle cx="23.8" cy="22.2" r="1.1" fill="#4fc23a" stroke="#14501a" stroke-width=".5" />
		</g>
	{/if}
</svg>

<style>
	.shop-pet {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.65));
	}
	.pet-bob {
		animation: pet-bob 2.2s ease-in-out infinite;
	}
	@keyframes pet-bob {
		50% {
			transform: translateY(-1.2px);
		}
	}
	.pet-float {
		animation: pet-float 3.4s ease-in-out infinite;
	}
	@keyframes pet-float {
		50% {
			transform: translate(0.6px, -1.6px) rotate(-3deg);
		}
	}
	.pet-wave,
	.pet-wave-l {
		transform-box: fill-box;
		animation: pet-wave 1.1s ease-in-out infinite alternate;
	}
	.pet-wave {
		transform-origin: 0% 100%;
	}
	.pet-wave-l {
		transform-origin: 100% 100%;
		animation-direction: alternate-reverse;
	}
	@keyframes pet-wave {
		from {
			transform: rotate(-14deg);
		}
		to {
			transform: rotate(16deg);
		}
	}
	.pet-puff {
		transform-box: fill-box;
		transform-origin: center;
		animation: pet-puff 2.6s ease-out infinite;
	}
	@keyframes pet-puff {
		0% {
			transform: translate(0, 2px) scale(0.4);
			opacity: 0;
		}
		30% {
			opacity: 0.85;
		}
		100% {
			transform: translate(1px, -7px) scale(1.8);
			opacity: 0;
		}
	}
	.pet-glow {
		animation: pet-glow 2.8s ease-in-out infinite;
	}
	@keyframes pet-glow {
		50% {
			opacity: 0.55;
		}
	}
</style>
