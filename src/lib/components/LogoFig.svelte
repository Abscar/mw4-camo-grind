<!--
	A figure in a casino logo (2026-11-20): an emblem or a game symbol placed in drawing units of the logo's box
	(x, y = its top-left, size = its width; it's square), tilted `r` degrees from its bottom middle. `peek` = it
	pops up a little now and then and ducks back (delay staggers them), `bob` = it floats up and down.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		x,
		y,
		size,
		box,
		r = 0,
		delay = 0,
		move = 'none',
		children
	}: {
		x: number;
		y: number;
		size: number;
		/** the logo's drawing box (its viewBox) */
		box: { x: number; y: number; w: number; h: number };
		r?: number;
		delay?: number;
		move?: 'none' | 'peek' | 'bob';
		children: Snippet;
	} = $props();
	const pct = (v: number, of: number) => `${(v / of) * 100}%`;
</script>

<span class="lg-fig" style:left={pct(x - box.x, box.w)} style:top={pct(y - box.y, box.h)} style:width={pct(size, box.w)} style:--r="{r}deg" style:--delay="{delay}s">
	<span class="lg-fig-in" data-move={move}>{@render children()}</span>
</span>

<style>
	.lg-fig {
		position: absolute;
		aspect-ratio: 1;
		transform: rotate(var(--r));
		transform-origin: 50% 100%;
	}
	.lg-fig-in {
		display: block;
		width: 100%;
		height: 100%;
	}
	.lg-fig-in > :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.lg-fig-in[data-move='peek'] {
		animation: lg-peek 6.5s var(--delay) ease-in-out infinite;
	}
	@keyframes lg-peek {
		0%,
		62%,
		100% {
			transform: translateY(0);
		}
		70% {
			transform: translateY(-9%) rotate(-3deg);
		}
		76% {
			transform: translateY(-6%) rotate(2deg);
		}
		84% {
			transform: translateY(0);
		}
	}
	.lg-fig-in[data-move='bob'] {
		animation: lg-bob 3.4s var(--delay) ease-in-out infinite;
	}
	@keyframes lg-bob {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		50% {
			transform: translateY(-5%) rotate(-4deg);
		}
	}
</style>
