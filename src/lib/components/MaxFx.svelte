<!--
	Your own effect when a tick maxes a weapon (BurgiShop slot `maxfx`, shop.ts; 2026-11-20, the user picked
	it from the ideas list): Fireworks, a Mini Nuke or a Rainbow Burst over the weapon row, about 2.6 s
	(WeaponCard mounts it per maxed tick, next to Abscar's usual shine). Every theme. `loop` = the shop's item
	card, playing over and over. Our own drawings; reduced motion = a still glow.
-->
<script lang="ts">
	let { kind, loop = false }: { kind: string; loop?: boolean } = $props();
	/** Firework bursts: where (% of the row), colour, delay (s). */
	const BURSTS = [
		{ x: 22, y: 40, c: '#ffd23a', d: 0 },
		{ x: 58, y: 30, c: '#ff5ca8', d: 0.45 },
		{ x: 82, y: 55, c: '#5ce1ff', d: 0.9 }
	];
	const RAYS = Array.from({ length: 12 }, (_, i) => i * 30);
</script>

<span class="maxfx" class:loop data-fx={kind} aria-hidden="true">
	{#if kind === 'maxfx-fireworks'}
		{#each BURSTS as b, i (i)}
			<span class="mf-burst" style:left="{b.x}%" style:top="{b.y}%" style:--c={b.c} style:--d="{b.d}s">
				{#each RAYS as a (a)}<i style:--a="{a}deg"></i>{/each}
			</span>
		{/each}
	{:else if kind === 'maxfx-nuke'}
		<span class="mf-flash"></span>
		<span class="mf-wave"></span>
		<span class="mf-cloud"
			><svg viewBox="0 0 60 70" width="100%" height="100%">
				<path d="M25 70 C26 52 25 40 23 30 L37 30 C35 40 34 52 35 70 Z" fill="#ffb02a" opacity="0.85" />
				<path d="M8 30 C2 30 2 20 9 18 C8 9 18 4 24 9 C27 2 37 2 39 9 C46 5 55 11 51 19 C58 21 57 31 50 30 Z" fill="#ff7a1a" stroke="#7a2410" stroke-width="1.2" />
				<path d="M14 22 C18 16 26 15 30 19 M33 14 C38 12 44 15 45 20" fill="none" stroke="#fff3a0" stroke-width="2" stroke-linecap="round" />
			</svg></span
		>
	{:else if kind === 'maxfx-rainbow'}
		<span class="mf-rainbow"></span>
		{#each [10, 30, 50, 70, 90] as x, i (x)}<i class="mf-star" style:left="{x}%" style:--d="{0.2 + i * 0.22}s"></i>{/each}
	{/if}
</span>

<style>
	.maxfx {
		position: absolute;
		inset: 0;
		z-index: 4;
		overflow: hidden;
		border-radius: inherit;
		pointer-events: none;
		--n: 1;
	}
	.maxfx.loop {
		--n: infinite;
	}
	/* ---------- Fireworks: three bursts of sparks ---------- */
	.mf-burst {
		position: absolute;
		width: 0;
		height: 0;
	}
	.mf-burst i {
		position: absolute;
		width: 5px;
		height: 5px;
		margin: -2.5px;
		border-radius: 999px;
		background: var(--c);
		box-shadow: 0 0 6px 1px var(--c);
		opacity: 0;
		animation: mf-spark 1.5s ease-out var(--d) var(--n) both;
	}
	@keyframes mf-spark {
		0% {
			transform: rotate(var(--a)) translateX(0) scale(1.3);
			opacity: 1;
		}
		70% {
			opacity: 1;
		}
		100% {
			transform: rotate(var(--a)) translateX(30px) translateY(6px) scale(0.4);
			opacity: 0;
		}
	}
	/* ---------- Mini Nuke: a white flash, a shockwave, a mushroom cloud ---------- */
	.mf-flash {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 70% 60%, #fff 0 20%, rgb(255 230 140 / 0.8) 45%, transparent 75%);
		opacity: 0;
		animation: mf-flash 2.6s ease-out var(--n) both;
	}
	@keyframes mf-flash {
		0% {
			opacity: 1;
		}
		30%,
		100% {
			opacity: 0;
		}
	}
	.mf-wave {
		position: absolute;
		left: 70%;
		top: 90%;
		width: 20px;
		height: 8px;
		margin: -4px -10px;
		border: 3px solid rgb(255 220 140 / 0.9);
		border-radius: 50%;
		opacity: 0;
		animation: mf-wave 2.6s ease-out var(--n) both;
	}
	@keyframes mf-wave {
		0% {
			transform: scale(0.2);
			opacity: 1;
		}
		60%,
		100% {
			transform: scale(14, 4);
			opacity: 0;
		}
	}
	.mf-cloud {
		position: absolute;
		left: calc(70% - 28px);
		bottom: 0;
		width: 56px;
		height: 66px;
		transform-origin: 50% 100%;
		filter: drop-shadow(0 0 6px rgb(255 140 30 / 0.9));
		opacity: 0;
		animation: mf-cloud 2.6s ease-out var(--n) both;
	}
	@keyframes mf-cloud {
		0% {
			transform: scale(0.2, 0.1);
			opacity: 0;
		}
		12% {
			opacity: 1;
		}
		45% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(1.15) translateY(-10%);
			opacity: 0;
		}
	}
	/* ---------- Rainbow Burst: a rainbow sweeps across, stars pop behind it ---------- */
	.mf-rainbow {
		position: absolute;
		top: 0;
		bottom: 0;
		left: -60%;
		width: 60%;
		background: linear-gradient(90deg, transparent, #ff5ca8, #ffd23a, #7dff6a, #5ce1ff, #b265ff, transparent);
		opacity: 0.75;
		filter: blur(2px);
		animation: mf-sweep 2s ease-in-out var(--n) both;
	}
	@keyframes mf-sweep {
		to {
			left: 110%;
		}
	}
	.mf-star {
		position: absolute;
		top: 40%;
		width: 12px;
		height: 12px;
		background: #fff6c0;
		clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
		filter: drop-shadow(0 0 4px #fff);
		opacity: 0;
		animation: mf-star 1.4s ease-out var(--d) var(--n) both;
	}
	@keyframes mf-star {
		0% {
			transform: scale(0.2) rotate(0deg);
			opacity: 0;
		}
		40% {
			transform: scale(1.3) rotate(60deg);
			opacity: 1;
		}
		100% {
			transform: scale(0.4) rotate(120deg) translateY(-14px);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.maxfx * {
			animation: none !important;
		}
		.maxfx::after {
			content: '';
			position: absolute;
			inset: 0;
			background: radial-gradient(circle at 60% 50%, rgb(255 230 140 / 0.35), transparent 70%);
		}
	}
</style>
