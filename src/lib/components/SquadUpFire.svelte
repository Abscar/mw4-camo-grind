<!--
	The header on fire during squad up (squad step 3; Abscar only, aria-hidden, no clicks): a row of
	our own drawn flames licking up from the header's bottom edge, an orange glow and rising embers.
	Shown only while `squad.squadUp`. Reduced motion: still flames, no embers; "Pause animations"
	freezes it like everything else (app.html pauses endless animations).
-->
<script lang="ts">
	import { squad } from '#lib/squad.svelte.ts';

	const FLAMES = Array.from({ length: 22 }, (_, i) => ({
		x: (i / 21) * 100,
		h: 50 + ((i * 37) % 45),
		d: 0.55 + ((i * 13) % 7) / 10,
		delay: -((i * 0.17) % 1.1)
	}));
	const EMBERS = Array.from({ length: 16 }, (_, i) => ({ x: (i * 61) % 100, delay: -((i * 0.53) % 4), d: 3 + (i % 4) * 0.6 }));
</script>

{#if squad.squadUp}
	<div class="su-fire" aria-hidden="true">
		<div class="su-glow"></div>
		{#each FLAMES as f, i (i)}
			<span class="su-tongue" style:left="{f.x}%" style:height="{f.h}px" style:animation-duration="{f.d}s" style:animation-delay="{f.delay}s"></span>
		{/each}
		{#each EMBERS as e, i (i)}
			<span class="su-ember" style:left="{e.x}%" style:animation-duration="{e.d}s" style:animation-delay="{e.delay}s"></span>
		{/each}
	</div>
{/if}

<style>
	.su-fire {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
	}
	.su-glow {
		position: absolute;
		inset: auto 0 0;
		height: 55%;
		background: linear-gradient(0deg, rgb(255 90 10 / 0.55), rgb(255 40 0 / 0.18) 55%, transparent);
	}
	.su-tongue {
		position: absolute;
		bottom: -10px;
		width: 70px;
		margin-left: -35px;
		border-radius: 50% 50% 35% 35% / 70% 70% 30% 30%;
		background: radial-gradient(ellipse at 50% 85%, #fff6c0 0%, #ffcc33 22%, #ff6a10 52%, rgb(200 20 0 / 0.6) 75%, transparent 78%);
		filter: blur(2px);
		mix-blend-mode: screen;
		transform-origin: 50% 100%;
		animation: su-lick 0.8s ease-in-out infinite alternate;
	}
	@keyframes su-lick {
		0% {
			transform: scale(0.85, 0.75) skewX(4deg);
			opacity: 0.75;
		}
		100% {
			transform: scale(1.1, 1.15) skewX(-6deg);
			opacity: 1;
		}
	}
	.su-ember {
		position: absolute;
		bottom: 0;
		width: 4px;
		height: 4px;
		border-radius: 999px;
		background: #ffd36a;
		box-shadow: 0 0 6px #ff8a00;
		animation: su-rise 3.5s linear infinite;
	}
	@keyframes su-rise {
		0% {
			transform: translate(0, 0);
			opacity: 0;
		}
		15% {
			opacity: 1;
		}
		100% {
			transform: translate(-30px, -260px);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.su-tongue {
			animation: none;
		}
		.su-ember {
			display: none;
		}
	}
</style>
