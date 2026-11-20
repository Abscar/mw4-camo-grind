<!--
	Confetti and burger coins raining over the screen for a big win in BurgiCasino (2026-11-20, the user:
	"lots of dopamine"; CasinoBalance calls it when your burgers jump, casinoFloor.ts gainFx). Each call of
	fire() drops one shower of ~44 pieces for about 3 s, then they're gone. The layer covers the screen
	(on <body>, so no container above can pin or clip it), taps go through, and it never runs with
	reduced motion. One-off animations, nothing endless.
-->
<script lang="ts" module>
	export interface ConfettiApi {
		fire: () => void;
	}
</script>

<script lang="ts">
	import FloorArt from './FloorArt.svelte';

	interface Piece {
		x: number;
		dx: number;
		r: number;
		d: number;
		t: number;
		w: number;
		h: number;
		color: string;
		coin: boolean;
	}
	interface Shower {
		id: number;
		pieces: Piece[];
	}
	const COLORS = ['#ffd23a', '#ff5ca8', '#2de2e6', '#7dff6a', '#ffffff', '#ff7a2e', '#b265ff'];
	let showers = $state<Shower[]>([]);
	let next = 1;

	export function fire() {
		if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (showers.length >= 2) return;
		const id = next++;
		const pieces = Array.from({ length: 44 }, (_, i): Piece => ({
			x: Math.random() * 96 + 1,
			dx: Math.round((Math.random() - 0.5) * 120),
			r: Math.round((Math.random() - 0.5) * 900),
			d: Math.round(Math.random() * 450),
			t: Math.round(2200 + Math.random() * 1000),
			w: Math.round(6 + Math.random() * 6),
			h: Math.round(9 + Math.random() * 8),
			color: COLORS[i % COLORS.length],
			coin: i % 6 === 0
		}));
		showers = [...showers, { id, pieces }];
		setTimeout(() => (showers = showers.filter((s) => s.id !== id)), 3900);
	}

	function toBody(node: HTMLElement) {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	}
</script>

{#each showers as s (s.id)}
	<div class="confetti" use:toBody aria-hidden="true">
		{#each s.pieces as p, i (i)}
			<span class="cf" class:coin={p.coin} style:left="{p.x}%" style:--dx="{p.dx}px" style:--r="{p.r}deg" style:--d="{p.d}ms" style:--t="{p.t}ms" style:--w="{p.w}px" style:--h="{p.h}px" style:--c={p.color}>
				{#if p.coin}<FloorArt kind="coin" size={22} />{/if}
			</span>
		{/each}
	</div>
{/each}

<style>
	.confetti {
		position: fixed;
		inset: 0;
		z-index: 70;
		overflow: hidden;
		pointer-events: none;
	}
	.cf {
		position: absolute;
		top: -30px;
		width: var(--w);
		height: var(--h);
		border-radius: 2px;
		background: var(--c);
		box-shadow: inset 0 -2px 0 rgb(0 0 0 / 0.18);
		opacity: 0;
		animation: cf-fall var(--t) cubic-bezier(0.25, 0.4, 0.55, 1) var(--d) forwards;
	}
	.cf.coin {
		width: 22px;
		height: 22px;
		background: none;
		box-shadow: none;
	}
	@keyframes cf-fall {
		0% {
			opacity: 1;
			transform: translate3d(0, 0, 0) rotate(0deg);
		}
		85% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate3d(var(--dx), 105vh, 0) rotate(var(--r));
		}
	}
</style>
