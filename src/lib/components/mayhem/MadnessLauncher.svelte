<!--
	Abscars Madness' own title button (2026-11-23, the user: "make it a button of its own somewhere high up on the
	page", "a damn good-looking button / title for the game with explosions and other cool stuff", "start the game
	in full screen"). Sits above the page tabs in every theme. A tap opens the game over the whole page and asks the
	browser for full screen in the same tap (browsers only allow it from a click); phones also try to turn sideways.
	All drawings are our own: blasts, sparks, smoke, a burning title. The game itself is MayhemPage.svelte.
-->
<script lang="ts">
	import { mayhemText as M } from '#lib/i18n/mayhem.ts';
	import { LEVELS } from '#lib/mayhem/levels.ts';
	import MayhemPage from './MayhemPage.svelte';

	let open = $state(false);
	let launcher: HTMLButtonElement | undefined = $state();

	function toBody(node: HTMLElement) {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	}

	function start() {
		open = true;
		const el = document.documentElement;
		if (el.requestFullscreen && !document.fullscreenElement) {
			el.requestFullscreen({ navigationUI: 'hide' })
				.then(() => {
					const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
					if (matchMedia('(pointer: coarse)').matches) o?.lock?.('landscape').catch(() => {});
				})
				.catch(() => {});
		}
	}
	function close() {
		open = false;
		if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
		launcher?.focus();
	}
	$effect(() => {
		if (!open) return;
		const html = document.documentElement;
		const was = html.style.overflow;
		html.style.overflow = 'hidden';
		return () => {
			html.style.overflow = was;
		};
	});

	/* seeded decoration so the prerendered page and the browser draw the same */
	const BLASTS = [
		{ x: 6, y: 58, s: 1.1, d: 0 },
		{ x: 30, y: 22, s: 0.7, d: 1.3 },
		{ x: 63, y: 70, s: 0.9, d: 2.1 },
		{ x: 88, y: 30, s: 1.2, d: 0.7 },
		{ x: 47, y: 12, s: 0.55, d: 2.8 },
		{ x: 76, y: 82, s: 0.65, d: 1.8 }
	];
	const SPARKS = Array.from({ length: 18 }, (_, i) => ({ x: (i * 37 + 11) % 100, d: (i * 0.53) % 3.2, t: 1.8 + ((i * 7) % 10) / 6, s: 2 + (i % 3) }));
	const SMOKE = Array.from({ length: 7 }, (_, i) => ({ x: (i * 17 + 4) % 100, d: i * 1.1, s: 60 + ((i * 29) % 70) }));
	const spikes = (n: number, r1: number, r2: number) =>
		Array.from({ length: n * 2 }, (_, i) => {
			const a = (i / (n * 2)) * Math.PI * 2;
			const r = i % 2 ? r2 * (0.8 + ((i * 13) % 5) / 12) : r1;
			return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`;
		}).join(' ');
	const STAR = spikes(11, 46, 22);
	const STAR2 = spikes(9, 34, 16);
</script>

<button type="button" class="mx-launch" bind:this={launcher} onclick={start} aria-label={M.launch.label}>
	<span class="mx-bg" aria-hidden="true"></span>
	<span class="mx-fx" aria-hidden="true">
		{#each SMOKE as p, i (i)}<i class="mx-smoke" style:left="{p.x}%" style:--d="{p.d}s" style:width="{p.s}px" style:height="{p.s}px"></i>{/each}
		{#each BLASTS as b, i (i)}
			<svg class="mx-blast" viewBox="0 0 100 100" style:left="{b.x}%" style:top="{b.y}%" style:--s={b.s} style:--d="{b.d}s">
				<polygon points={STAR} fill="url(#mx-fire)" />
				<polygon points={STAR2} fill="#fff3b0" />
				<circle cx="50" cy="50" r="10" fill="#fff" />
			</svg>
		{/each}
		{#each SPARKS as p, i (i)}<i class="mx-spark" style:left="{p.x}%" style:--d="{p.d}s" style:--t="{p.t}s" style:width="{p.s}px" style:height="{p.s}px"></i>{/each}
		<svg class="mx-defs" width="0" height="0">
			<defs>
				<radialGradient id="mx-fire">
					<stop offset="0" stop-color="#fff6c8" />
					<stop offset="0.35" stop-color="#ffc23a" />
					<stop offset="0.7" stop-color="#ff5a14" />
					<stop offset="1" stop-color="#b3120a" />
				</radialGradient>
				<linearGradient id="mx-hot" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stop-color="#fffbe6" />
					<stop offset="0.3" stop-color="#ffd23a" />
					<stop offset="0.62" stop-color="#ff6a14" />
					<stop offset="1" stop-color="#9c0e08" />
				</linearGradient>
				<linearGradient id="mx-steel" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stop-color="#ffffff" />
					<stop offset="0.5" stop-color="#b9c2c8" />
					<stop offset="0.52" stop-color="#5d666c" />
					<stop offset="1" stop-color="#d4dadd" />
				</linearGradient>
			</defs>
		</svg>
	</span>
	<span class="mx-title" aria-hidden="true">
		<svg viewBox="0 0 640 150" preserveAspectRatio="xMidYMid meet">
			<!-- bullet holes in the steel -->
			<g fill="#0b0b0b" stroke="#6d757a" stroke-width="1.5">
				<circle cx="34" cy="40" r="5" /><circle cx="604" cy="118" r="4" /><circle cx="580" cy="26" r="3.5" />
			</g>
			<text class="mx-t1" x="320" y="44" text-anchor="middle">ABSCARS</text>
			<g class="mx-shake">
				<text class="mx-t2 mx-t2-back" x="320" y="128" text-anchor="middle">MADNESS</text>
				<text class="mx-t2" x="320" y="128" text-anchor="middle">MADNESS</text>
				<text class="mx-t2 mx-t2-glint" x="320" y="128" text-anchor="middle">MADNESS</text>
			</g>
		</svg>
	</span>
	<span class="mx-side" aria-hidden="true">
		<span class="mx-play font-head">{M.launch.play} <b>▶</b></span>
		<span class="mx-sub">{M.launch.sub(LEVELS.length)}</span>
	</span>
</button>

{#if open}
	<div class="mx-overlay" use:toBody role="dialog" aria-modal="true" aria-label={M.title}>
		<MayhemPage active={open} onclose={close} />
	</div>
{/if}

<style>
	.mx-launch {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: clamp(118px, 15vw, 176px);
		padding: 0 clamp(10px, 3vw, 28px);
		border-radius: 14px;
		overflow: hidden;
		isolation: isolate;
		border: 2px solid #ff6a1a;
		box-shadow:
			0 0 0 1px #000 inset,
			0 0 24px rgba(255, 90, 20, 0.45),
			0 6px 18px rgba(0, 0, 0, 0.5);
		background: #0d0705;
		color: #fff;
		cursor: pointer;
		transition: transform 0.15s, box-shadow 0.2s;
		text-shadow: none !important;
	}
	.mx-launch:hover {
		transform: translateY(-2px) scale(1.005);
		box-shadow:
			0 0 0 1px #000 inset,
			0 0 40px rgba(255, 110, 30, 0.75),
			0 10px 24px rgba(0, 0, 0, 0.55);
	}
	.mx-launch:active {
		transform: translateY(1px) scale(0.995);
	}
	.mx-launch:focus-visible {
		outline: 3px solid #ffd23a;
		outline-offset: 3px;
	}
	.mx-bg {
		position: absolute;
		inset: 0;
		z-index: -2;
		background:
			radial-gradient(60% 90% at 50% 120%, rgba(255, 90, 20, 0.85), rgba(160, 20, 8, 0.4) 45%, transparent 70%),
			radial-gradient(40% 70% at 8% 110%, rgba(255, 140, 30, 0.6), transparent 70%),
			radial-gradient(40% 70% at 92% 110%, rgba(255, 140, 30, 0.6), transparent 70%),
			repeating-linear-gradient(115deg, rgba(255, 255, 255, 0.025) 0 10px, transparent 10px 22px),
			linear-gradient(180deg, #1a0d08, #0b0604 55%, #2a0a04);
		animation: mx-heat 2.6s ease-in-out infinite alternate;
	}
	@keyframes mx-heat {
		to {
			filter: brightness(1.18) saturate(1.15);
		}
	}
	.mx-fx {
		position: absolute;
		inset: 0;
		z-index: -1;
		pointer-events: none;
	}
	.mx-defs {
		position: absolute;
	}
	.mx-blast {
		position: absolute;
		width: calc(120px * var(--s));
		height: calc(120px * var(--s));
		margin: calc(-60px * var(--s)) 0 0 calc(-60px * var(--s));
		mix-blend-mode: screen;
		opacity: 0;
		animation: mx-boom 3.4s ease-out var(--d) infinite;
	}
	@keyframes mx-boom {
		0% {
			opacity: 0;
			transform: scale(0.15) rotate(0deg);
		}
		6% {
			opacity: 1;
		}
		22% {
			opacity: 0.85;
			transform: scale(1.15) rotate(18deg);
		}
		38%,
		100% {
			opacity: 0;
			transform: scale(1.5) rotate(26deg);
		}
	}
	.mx-spark {
		position: absolute;
		bottom: -6px;
		border-radius: 50%;
		background: #ffd76a;
		box-shadow: 0 0 6px #ff8a1a;
		opacity: 0;
		animation: mx-rise var(--t) linear var(--d) infinite;
	}
	@keyframes mx-rise {
		0% {
			opacity: 0;
			transform: translate(0, 0);
		}
		10% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(18px, -170px);
		}
	}
	.mx-smoke {
		position: absolute;
		bottom: -40px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(70, 60, 55, 0.55), rgba(40, 30, 28, 0) 70%);
		animation: mx-puff 7.5s linear var(--d) infinite;
	}
	@keyframes mx-puff {
		0% {
			transform: translate(0, 0) scale(0.6);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		100% {
			transform: translate(-30px, -200px) scale(1.8);
			opacity: 0;
		}
	}
	.mx-title {
		position: relative;
		flex: 1 1 auto;
		height: 100%;
		min-width: 0;
		max-width: 760px;
	}
	.mx-title svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.mx-t1 {
		font:
			900 40px Bahnschrift,
			'Arial Black',
			Impact,
			sans-serif;
		letter-spacing: 0.42em;
		fill: url(#mx-steel);
		stroke: #000;
		stroke-width: 5px;
		paint-order: stroke;
	}
	.mx-t2 {
		font:
			900 italic 100px Impact,
			'Arial Black',
			Bahnschrift,
			sans-serif;
		letter-spacing: 0.03em;
		fill: url(#mx-hot);
		stroke: #1a0402;
		stroke-width: 7px;
		paint-order: stroke;
	}
	.mx-t2-back {
		fill: #3a0704;
		stroke: #000;
		stroke-width: 12px;
		transform: translate(5px, 6px);
		filter: drop-shadow(0 0 14px rgba(255, 80, 20, 0.9));
	}
	.mx-t2-glint {
		fill: none;
		stroke: rgba(255, 255, 255, 0.95);
		stroke-width: 2px;
		stroke-dasharray: 60 900;
		animation: mx-glint 3.2s linear infinite;
	}
	@keyframes mx-glint {
		from {
			stroke-dashoffset: 960;
		}
		to {
			stroke-dashoffset: 0;
		}
	}
	.mx-shake {
		transform-origin: 320px 100px;
		transform-box: view-box;
		animation: mx-shake 3.4s steps(1) infinite;
	}
	@keyframes mx-shake {
		0%,
		20%,
		100% {
			transform: none;
		}
		2% {
			transform: translate(-3px, 2px) rotate(-0.6deg);
		}
		4% {
			transform: translate(3px, -2px) rotate(0.5deg);
		}
		6% {
			transform: translate(-2px, -1px);
		}
		8% {
			transform: translate(2px, 1px);
		}
	}
	.mx-side {
		position: relative;
		flex: none;
		display: grid;
		justify-items: center;
		gap: 6px;
	}
	.mx-play {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		border-radius: 12px;
		background: linear-gradient(180deg, #ffe066, #ff8a1a 55%, #e0300f);
		color: #2a0800;
		font-weight: 900;
		font-size: clamp(16px, 2.2vw, 24px);
		letter-spacing: 0.12em;
		border: 2px solid #fff3c4;
		box-shadow:
			0 0 0 2px #000,
			0 0 22px rgba(255, 150, 30, 0.85);
		animation: mx-pulse 1.4s ease-in-out infinite;
	}
	.mx-play b {
		font-size: 0.9em;
	}
	@keyframes mx-pulse {
		50% {
			transform: scale(1.06);
			box-shadow:
				0 0 0 2px #000,
				0 0 36px rgba(255, 170, 40, 1);
		}
	}
	.mx-sub {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #ffd9a8;
		text-shadow: 0 1px 2px #000;
		white-space: nowrap;
	}
	@media (max-width: 639px) {
		.mx-launch {
			flex-direction: column;
			gap: 0;
			height: 150px;
			padding: 6px 10px 10px;
		}
		.mx-title {
			width: 100%;
			flex: 1 1 0;
			min-height: 0;
		}
		.mx-side {
			grid-auto-flow: column;
			align-items: center;
			gap: 10px;
		}
		.mx-play {
			padding: 6px 14px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.mx-bg,
		.mx-blast,
		.mx-spark,
		.mx-smoke,
		.mx-t2-glint,
		.mx-shake,
		.mx-play {
			animation: none;
		}
		.mx-blast:nth-child(-n + 10) {
			opacity: 0.55;
		}
	}

	.mx-overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		overflow: auto;
		overscroll-behavior: contain;
		background: #0a0c09;
	}
</style>
