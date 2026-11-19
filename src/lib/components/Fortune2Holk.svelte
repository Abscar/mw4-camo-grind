<!--
	THE BIG HOLK (Abscar's Fortune II; 2026-11-19, the user: "make Abscar's holk a big holk over the whole screen
	that lands WILDs everywhere, sticky WILDs"). Shown over the whole screen (moved to <body>, fixed, so it
	covers the screen wherever the page is scrolled) when Abscar's holk meter fills: a giant cone joint slides
	in, its ember flares, thick smoke rolls over everything and clears again while the sticky WILDs land on the
	board (CasinoFortune2 drops them halfway through). Taps go through it. Our own cartoon in the style of the
	other pieces. Decorative (aria-hidden): the board and its pop say what happened. `dur` = the whole show in
	seconds.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	let { n, dur }: { n: number; dur: number } = $props();
	const uid = $props.id();
	const O = '#2a1408';
	/** to <body>: an ancestor with container queries would otherwise pin a fixed element to itself */
	function toBody(node: HTMLElement) {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	}
	// smoke puffs: where they end up (x % of the width, y as a share of the height from the middle), size, delay share
	const PUFFS = [
		[86, -0.3, 1.0, 0.1],
		[72, -0.42, 1.25, 0.16],
		[58, -0.2, 1.1, 0.22],
		[44, -0.36, 1.35, 0.27],
		[30, -0.14, 1.15, 0.31],
		[16, -0.3, 1.3, 0.35],
		[8, 0.06, 1.1, 0.4],
		[24, 0.22, 1.35, 0.36],
		[40, 0.1, 1.2, 0.3],
		[56, 0.28, 1.4, 0.25],
		[70, 0.12, 1.15, 0.2],
		[84, 0.3, 1.3, 0.26],
		[94, 0.0, 1.0, 0.14],
		[50, -0.05, 1.6, 0.33],
		[20, 0.42, 1.2, 0.42],
		[64, 0.46, 1.25, 0.38]
	] as const;
	const SPECKS = [
		[150, 62],
		[205, 80],
		[262, 58],
		[318, 86],
		[372, 60],
		[426, 84],
		[470, 64],
		[240, 96],
		[350, 44],
		[455, 100]
	] as const;
</script>

<div class="hk" use:toBody style:--dur="{dur}s" aria-hidden="true">
	<div class="hk-haze"></div>
	{#each PUFFS as [x, py, size, d], i (i)}
		<span class="hk-puff" style:--x="{x}%" style:--py={py} style:--s={size} style:--d={d} style:--tint={i % 3 === 0 ? '200 255 190' : i % 3 === 1 ? '235 225 255' : '255 255 255'}></span>
	{/each}
	<div class="hk-stage">
		<svg class="hk-joint" viewBox="0 0 600 150" focusable="false">
			<defs>
				<linearGradient id="{uid}-paper" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stop-color="#ffffff" />
					<stop offset="0.45" stop-color="#f6f1e6" />
					<stop offset="1" stop-color="#c9bfa8" />
				</linearGradient>
				<linearGradient id="{uid}-crutch" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stop-color="#f1d9a8" />
					<stop offset="1" stop-color="#b98d52" />
				</linearGradient>
				<radialGradient id="{uid}-ember" cx="50%" cy="50%" r="50%">
					<stop offset="0" stop-color="#fff3a0" />
					<stop offset="0.35" stop-color="#ffb21a" />
					<stop offset="0.7" stop-color="#ff4a12" />
					<stop offset="1" stop-color="#ff2a00" stop-opacity="0" />
				</radialGradient>
				<filter id="{uid}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
			</defs>
			<!-- the glow round the ember -->
			<circle class="hk-glow" cx="548" cy="75" r="62" fill="url(#{uid}-ember)" filter="url(#{uid}-blur)" />
			<!-- the crutch (the filter end): rolled card -->
			<path d="M28 52 Q20 52 20 75 Q20 98 28 98 L96 96 L96 54 Z" fill="url(#{uid}-crutch)" stroke={O} stroke-width="5" stroke-linejoin="round" />
			<ellipse cx="26" cy="75" rx="9" ry="23" fill="#e8cf9c" stroke={O} stroke-width="4" />
			<path d="M26 58 Q34 66 26 75 Q18 84 26 92" fill="none" stroke="#9a6e36" stroke-width="2.6" stroke-linecap="round" />
			<path d="M44 55 L44 95 M62 55 L62 95 M80 55 L80 95" stroke="#9a6e36" stroke-width="2" opacity="0.6" />
			<!-- the cone: paper widening towards the burning end -->
			<path d="M94 54 Q300 40 522 30 Q530 75 522 120 Q300 110 94 96 Z" fill="url(#{uid}-paper)" stroke={O} stroke-width="5.5" stroke-linejoin="round" />
			<!-- the paper's glued seam and a twist or two -->
			<path d="M110 60 Q300 50 514 42" fill="none" stroke="#d9d0bc" stroke-width="3" />
			<path d="M170 52 Q178 75 168 98 M300 46 Q310 75 298 104 M420 40 Q432 75 418 112" fill="none" stroke="#ded5c4" stroke-width="2.4" />
			<!-- green showing through the paper -->
			{#each SPECKS as [x, sy], i (i)}<ellipse cx={x} cy={sy} rx="5" ry="3" fill="#6fae4a" opacity="0.4" transform="rotate({i * 37} {x} {sy})" />{/each}
			<!-- the burning end: ash, then the ember ring -->
			<path d="M520 30 Q560 34 566 75 Q560 116 520 120 Q530 75 520 30 Z" fill="#7d7a78" stroke={O} stroke-width="5" stroke-linejoin="round" />
			<path d="M530 44 Q548 50 552 66 M528 92 Q548 98 554 84 M534 70 Q544 74 548 80" fill="none" stroke="#b7b2ae" stroke-width="2.4" stroke-linecap="round" />
			<path class="hk-ember" d="M556 50 Q572 75 556 102" fill="none" stroke="#ff5a1a" stroke-width="9" stroke-linecap="round" />
			<path class="hk-ember" d="M557 56 Q568 75 557 96" fill="none" stroke="#ffd23a" stroke-width="3.4" stroke-linecap="round" />
			<circle cx="566" cy="66" r="2.6" fill="#ffd23a" class="hk-spark" />
			<circle cx="571" cy="84" r="2" fill="#fff3a0" class="hk-spark" style:animation-delay="-0.4s" />
		</svg>
		<p class="hk-title font-head">{t.casino.fortune2.holk.title}</p>
		<p class="hk-sub font-head">{t.casino.fortune2.holk.sub(n)}</p>
	</div>
</div>

<style>
	.hk {
		position: fixed;
		inset: 0;
		z-index: 60;
		overflow: hidden;
		pointer-events: none;
		container-type: inline-size;
	}
	.hk-haze {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(50% 35% at 78% 45%, rgb(255 120 40 / 0.3), transparent 70%),
			radial-gradient(90% 70% at 50% 50%, rgb(40 18 60 / 0.6), rgb(10 4 20 / 0.5));
		animation: hk-haze var(--dur) ease-in-out both;
	}
	.hk-puff {
		position: absolute;
		left: var(--x);
		top: calc(50% + var(--py) * 100%);
		width: calc(var(--s) * max(34cqi, 24vh));
		aspect-ratio: 1;
		border-radius: 50%;
		background: radial-gradient(circle at 45% 40%, rgb(var(--tint) / 0.95), rgb(var(--tint) / 0.55) 45%, transparent 70%);
		filter: blur(6px);
		transform: translate(-50%, -50%) scale(0.2);
		opacity: 0;
		animation: hk-puff var(--dur) ease-out both;
		animation-delay: calc(var(--d) * var(--dur));
	}
	.hk-stage {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0 12px;
		transform: translateY(-50%);
		animation: hk-in var(--dur) cubic-bezier(0.2, 0.9, 0.3, 1) both;
	}
	.hk-joint {
		width: min(104%, 980px);
		overflow: visible;
		transform: rotate(-14deg);
		filter: drop-shadow(0 12px 18px rgb(0 0 0 / 0.6));
	}
	.hk-glow {
		animation: hk-flare calc(var(--dur) * 0.25) ease-in-out infinite alternate;
		transform-box: fill-box;
		transform-origin: center;
	}
	.hk-ember {
		animation: hk-ember calc(var(--dur) * 0.12) ease-in-out infinite alternate;
	}
	.hk-spark {
		animation: hk-ember calc(var(--dur) * 0.1) ease-in-out infinite alternate;
	}
	.hk-title {
		margin-top: 2cqi;
		font-size: clamp(30px, 9cqi, 80px);
		font-weight: 900;
		letter-spacing: 0.04em;
		line-height: 1;
		text-align: center;
		color: #c6ff9a;
		-webkit-text-stroke: 1.5px #143a08;
		text-shadow:
			0 3px 0 #0b2204,
			0 0 18px #7dff6a,
			0 0 40px #ff7a1a;
	}
	.hk-sub {
		margin-top: 8px;
		padding: 4px 14px;
		border-radius: 999px;
		background: rgb(20 6 30 / 0.8);
		box-shadow: inset 0 0 0 1.5px #7dff6a;
		font-size: clamp(14px, 3.2cqi, 24px);
		font-weight: 800;
		color: #fff6e0;
	}
	@keyframes hk-haze {
		0% {
			opacity: 0;
		}
		12%,
		78% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	@keyframes hk-in {
		0% {
			opacity: 0;
			transform: translate(-60%, -50%) scale(0.75);
		}
		14% {
			opacity: 1;
			transform: translate(0, -50%) scale(1);
		}
		80% {
			opacity: 1;
			transform: translate(3%, -52%) scale(1.04);
		}
		100% {
			opacity: 0;
			transform: translate(10%, -56%) scale(1.08);
		}
	}
	@keyframes hk-puff {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.2);
		}
		25% {
			opacity: 0.85;
		}
		60% {
			opacity: 0.7;
			transform: translate(-50%, -58%) scale(1.15);
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -75%) scale(1.5);
		}
	}
	@keyframes hk-flare {
		from {
			opacity: 0.7;
			transform: scale(0.9);
		}
		to {
			opacity: 1;
			transform: scale(1.15);
		}
	}
	@keyframes hk-ember {
		from {
			opacity: 0.65;
		}
		to {
			opacity: 1;
		}
	}
	/* reduced motion: the holk and its smoke simply show, then go */
	@media (prefers-reduced-motion: reduce) {
		.hk-haze,
		.hk-stage,
		.hk-glow,
		.hk-ember,
		.hk-spark {
			animation: none;
		}
		.hk-puff {
			animation: none;
			opacity: 0.45;
			transform: translate(-50%, -50%) scale(1);
		}
	}
</style>
