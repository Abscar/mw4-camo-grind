<!--
	Abscar decoration at the right end of the search row: the user's own white holk picture
	(assets/holk.webp) turned around (burning end left) and resting in a rest of a heavy glass
	ashtray, the way you put it down for a second (the user's ask, 2026-11-07). The burning end
	hangs over the bowl above a little ash pile that glows faintly; the filter end leans down
	towards the table. The ashtray is our own drawing, cartoon style with a dark outline to match
	the picture. One SVG so the joint can sit between the ashtray and the near lip of its rest.
	Just for fun it is a button (2026-11-08, the user's ask): a tap flicks the joint twice, ash
	breaks off the burning end and falls into the bowl with a few sparks and a puff of ash dust,
	the ember flares, and the ash pile grows a little (up to PILE_MAX taps, until the page reloads).
	Nothing is saved. With reduced motion only the pile grows.
-->
<script lang="ts">
	import holkPic from '#lib/assets/holk.webp';
	import { t } from '#lib/i18n/en.ts';

	const id = $props.id();

	const PILE_MAX = 8;
	/** the joint group (the picture + its ember flare), turned around its rest by the tap animation */
	let joint = $state<SVGGElement>();
	let flick: Animation | undefined;
	/** restarts the falling ash on every tap */
	let run = $state(0);
	/** ash tapped off since the page opened: the pile grows a little each time */
	let taps = $state(0);
	const pileScale = $derived(`scale(${1 + 0.06 * taps}, ${1 + 0.045 * taps})`);

	function tap() {
		taps = Math.min(taps + 1, PILE_MAX);
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		run++;
		flick?.cancel();
		// two quick flicks, burning end down (negative = anticlockwise); the ash breaks off on the second
		const turn = (deg: number, offset: number) => ({ transform: `rotate(${deg}deg)`, offset, easing: 'ease-in-out' });
		flick = joint?.animate([turn(0, 0), turn(-6, 0.16), turn(0.8, 0.3), turn(-7, 0.48), turn(1, 0.64), turn(-0.5, 0.8), turn(0, 1)], {
			duration: 750
		});
	}

	// The ashtray, seen a little from above: rim plane centre (CX, CY), outer rim radii, wall height.
	const CX = 210;
	const CY = 150;
	const RX = 180;
	const RY = 62;
	const WALL = 46;
	// The picture (560 × 146) mirrored, then turned so the point (210, 111) on the joint (in the
	// mirrored picture's own pixels) lies in the right-hand rest at (364, 151).
	const holkTransform = 'translate(364 151) rotate(9) translate(-210 -111) matrix(-1 0 0 1 560 0)';
</script>

<button type="button" class="toolbar-holk holk-btn abscar-only" aria-label={t.toolbar.holkTap} title={t.toolbar.holkTap} onclick={tap}>
<svg viewBox="24 8 692 256" width="692" height="256" aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id="{id}-wall" x1="0" x2="1">
			<stop offset="0" stop-color="#3d5560" />
			<stop offset="0.12" stop-color="#6f8d99" />
			<stop offset="0.32" stop-color="#b4cdd6" />
			<stop offset="0.43" stop-color="#eef7f9" />
			<stop offset="0.5" stop-color="#a9c3cd" />
			<stop offset="0.8" stop-color="#6e8b97" />
			<stop offset="1" stop-color="#3f5762" />
		</linearGradient>
		<linearGradient id="{id}-rim" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#93acb7" />
			<stop offset="0.55" stop-color="#cfe1e7" />
			<stop offset="1" stop-color="#eef7f9" />
		</linearGradient>
		<linearGradient id="{id}-bowl" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#2f444e" />
			<stop offset="1" stop-color="#5f7a86" />
		</linearGradient>
		<radialGradient id="{id}-floor" cx="0.5" cy="0.45" r="0.6">
			<stop offset="0" stop-color="#94aeb8" />
			<stop offset="1" stop-color="#5c7783" />
		</radialGradient>
		<radialGradient id="{id}-ash" cx="0.45" cy="0.3" r="0.75">
			<stop offset="0" stop-color="#d2cdc5" />
			<stop offset="0.5" stop-color="#9c968f" />
			<stop offset="1" stop-color="#6b6661" />
		</radialGradient>
		<radialGradient id="{id}-glow">
			<stop offset="0" stop-color="#ff8a2a" stop-opacity="0.9" />
			<stop offset="0.5" stop-color="#ff5a14" stop-opacity="0.35" />
			<stop offset="1" stop-color="#ff5a14" stop-opacity="0" />
		</radialGradient>
		<!-- tap: the ember flaring up, and soft grey ash dust -->
		<radialGradient id="{id}-flare">
			<stop offset="0" stop-color="#fff3b8" />
			<stop offset="0.3" stop-color="#ffb43c" stop-opacity="0.95" />
			<stop offset="0.65" stop-color="#ff5a14" stop-opacity="0.45" />
			<stop offset="1" stop-color="#ff5a14" stop-opacity="0" />
		</radialGradient>
		<radialGradient id="{id}-dust">
			<stop offset="0" stop-color="#e6e1d9" stop-opacity="0.95" />
			<stop offset="0.55" stop-color="#bdb7ae" stop-opacity="0.7" />
			<stop offset="1" stop-color="#9a958e" stop-opacity="0" />
		</radialGradient>
		<clipPath id="{id}-inside">
			<ellipse cx={CX} cy={CY + 1} rx={RX - 32} ry={RY - 12} />
		</clipPath>
		<filter id="{id}-soft" x="-20%" y="-50%" width="140%" height="200%">
			<feGaussianBlur stdDeviation="5" />
		</filter>
	</defs>

	<!-- shadows on the table: the ashtray's, and the joint's running out to the filter end -->
	<ellipse cx={CX + 14} cy={CY + WALL + 6} rx={RX + 4} ry={RY - 6} fill="#000" opacity="0.5" filter="url(#{id}-soft)" />
	<path d="M386 200 L690 226 L694 236 L386 206 Z" fill="#000" opacity="0.4" filter="url(#{id}-soft)" />
	<ellipse cx="686" cy="234" rx="34" ry="6" fill="#000" opacity="0.5" filter="url(#{id}-soft)" />

	<g stroke="#1a120b" stroke-width="3" stroke-linejoin="round">
		<!-- outer wall (front half) -->
		<path
			d="M{CX - RX} {CY} L{CX - RX + 10} {CY + WALL} A{RX - 10} {RY - 4} 0 0 0 {CX + RX - 10} {CY + WALL} L{CX + RX} {CY} A{RX} {RY} 0 0 1 {CX - RX} {CY} Z"
			fill="url(#{id}-wall)"
		/>
		<!-- rim top -->
		<ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="url(#{id}-rim)" />
		<!-- the bowl: inner wall, then the floor -->
		<ellipse cx={CX} cy={CY + 1} rx={RX - 32} ry={RY - 12} fill="url(#{id}-bowl)" />
	</g>
	<g clip-path="url(#{id}-inside)">
		<ellipse cx={CX} cy={CY + 19} rx={RX - 56} ry={RY - 20} fill="url(#{id}-floor)" />
		<!-- an old roach and loose ash flakes -->
		<g transform="rotate(12 128 180)" stroke="#1a120b" stroke-width="2">
			<rect x="110" y="174" width="30" height="12" rx="4" fill="#efe8d6" />
			<rect x="104" y="174" width="9" height="12" rx="3" fill="#2a2420" />
			<path d="M120 176 L122 184 M128 175 L130 185" stroke="#b9ad92" stroke-width="1.4" />
		</g>
		<g fill="#a8a39c" stroke="#3b3632" stroke-width="1.2">
			<ellipse cx="262" cy="184" rx="7" ry="3" /><ellipse cx="150" cy="158" rx="6" ry="2.6" />
			<ellipse cx="284" cy="160" rx="5" ry="2.2" /><ellipse cx="236" cy="190" rx="4.5" ry="2" />
		</g>
		<!-- soft shadow of the joint on the floor -->
		<path d="M196 146 L352 172 L350 186 L194 158 Z" fill="#000" opacity="0.35" filter="url(#{id}-soft)" />
		<!-- glow from the ember, on the ash pile right under it -->
		<ellipse class="ember-glow" cx="208" cy="156" rx="58" ry="20" fill="url(#{id}-glow)" />
		<!-- the ash pile, a little bigger after every tap (grows from its foot) -->
		<g class="ash-pile" style:transform={pileScale}>
			<path d="M168 164 C172 152 186 145 204 146 C222 144 240 151 246 162 C236 170 186 172 168 164 Z" fill="url(#{id}-ash)" stroke="#3b3632" stroke-width="2" />
			<g fill="#4a4541">
				<circle cx="186" cy="160" r="2.2" /><circle cx="204" cy="153" r="1.6" /><circle cx="226" cy="160" r="2" />
				<circle cx="212" cy="164" r="1.4" /><circle cx="236" cy="157" r="1.3" />
			</g>
		</g>
	</g>

	<!-- a tap: the ember lights up the bowl (the falling ash is drawn on top of the joint, further down) -->
	{#key run}
		{#if run}
			<ellipse class="ash-fx fx-floor" cx="208" cy="156" rx="70" ry="26" fill="url(#{id}-glow)" />
		{/if}
	{/key}

	<!-- glass shine: streaks on the wall, a bright line along the front of the rim -->
	<g fill="none" stroke-linecap="round">
		<path d="M118 196 L114 222" stroke="#fff" stroke-opacity="0.75" stroke-width="5" />
		<path d="M134 200 L131 222" stroke="#fff" stroke-opacity="0.45" stroke-width="2.5" />
		<path d="M300 200 L302 224" stroke="#fff" stroke-opacity="0.35" stroke-width="3" />
		<path d="M84 186 Q160 212 262 206" stroke="#fff" stroke-opacity="0.7" stroke-width="2.5" />
		<path d="M92 112 Q140 96 196 93" stroke="#fff" stroke-opacity="0.35" stroke-width="2" />
	</g>

	<!-- the two empty rests: dips in the rim, dark inside with a lit near edge -->
	<g stroke="#1a120b" stroke-width="2">
		<ellipse cx="67" cy="178" rx="17" ry="6.5" transform="rotate(-12 67 178)" fill="#2c4049" />
		<ellipse cx="210" cy="94.5" rx="13" ry="5.5" fill="#2c4049" />
	</g>
	<g fill="none" stroke="#f4fbfd" stroke-width="2" stroke-linecap="round">
		<path d="M54 184 Q67 187 80 178" />
		<path d="M200 98 Q210 101 220 98" />
	</g>
	<!-- the rest the joint lies in (hidden under it apart from its edges) -->
	<ellipse cx="364" cy="170" rx="19" ry="7" transform="rotate(8 364 170)" fill="#2c4049" stroke="#1a120b" stroke-width="2" />

	<g class="holk-joint" bind:this={joint}>
		<image href={holkPic} width="560" height="146" transform={holkTransform} />
		{#key run}
			{#if run}
				<!-- the burning end flares up after the ash breaks off -->
				<circle class="fx-tip" cx="207" cy="127" r="30" fill="url(#{id}-flare)" />
			{/if}
		{/key}
	</g>

	<!-- near lip of the rest, over the underside of the joint so it sits down in the dip -->
	<path
		d="M344 174 Q358 180 378 178 L380 185 Q360 189 345 182 Z"
		fill="url(#{id}-rim)"
		stroke="#1a120b"
		stroke-width="2.2"
		stroke-linejoin="round"
	/>

	<!-- a tap, on top of everything so it shows at this small size: a chunk of ash, flakes and sparks
	     break off the burning end (where it is at the second flick) and drop onto the pile, and ash
	     dust puffs up where they land -->
	{#key run}
		{#if run}
			<g class="ash-fx">
				<g transform="translate(198 166)" fill="url(#{id}-dust)">
					<circle class="fx-dust" style:--dx="-30px" style:--dy="-26px" r="16" />
					<circle class="fx-dust" style:--dx="22px" style:--dy="-34px" r="14" style:animation-delay="0.69s" />
					<circle class="fx-dust" style:--dx="-6px" style:--dy="-50px" r="17" style:animation-delay="0.72s" />
					<circle class="fx-dust" style:--dx="36px" style:--dy="-14px" r="12" style:animation-delay="0.75s" />
					<circle class="fx-dust" style:--dx="-40px" style:--dy="-6px" r="11" style:animation-delay="0.78s" />
				</g>
				<g transform="translate(192 146)">
					<g fill="#d6d0c7" stroke="#2e2a27" stroke-width="1.4">
						<path class="fx-flake" style:--dx="-16px" style:--dy="26px" style:--r="-90deg" d="M-5 -3 L5 -3 L3 3 L-5 2 Z" />
						<path class="fx-flake" style:--dx="16px" style:--dy="28px" style:--r="120deg" d="M-3 -4 L5 -1 L2 4 L-4 2 Z" style:animation-delay="0.42s" />
						<path class="fx-flake" style:--dx="-4px" style:--dy="32px" style:--r="200deg" d="M-4 -2 L3 -4 L4 3 L-2 3 Z" style:animation-delay="0.4s" />
						<path class="fx-flake" style:--dx="24px" style:--dy="20px" style:--r="-140deg" d="M-3 -3 L3 -3 L3 3 L-3 3 Z" style:animation-delay="0.45s" />
						<path class="fx-flake" style:--dx="-24px" style:--dy="18px" style:--r="160deg" d="M-3 -2 L4 -2 L2 3 L-3 2 Z" style:animation-delay="0.44s" />
					</g>
					<g fill="#ffd36a" stroke="#ff5a14" stroke-width="1.4">
						<circle class="fx-spark" style:--dx="-14px" style:--dy="18px" r="3.2" />
						<circle class="fx-spark" style:--dx="14px" style:--dy="22px" r="2.6" style:animation-delay="0.39s" />
						<circle class="fx-spark" style:--dx="-2px" style:--dy="28px" r="3" style:animation-delay="0.42s" />
						<circle class="fx-spark" style:--dx="26px" style:--dy="10px" r="2.2" style:animation-delay="0.4s" />
					</g>
					<g class="fx-chunk">
						<path
							d="M-17 -5 Q-19 5 -9 8.5 L12 7.5 Q19.5 1 14.5 -7 L-5 -9.5 Q-14.5 -9.5 -17 -5 Z"
							fill="url(#{id}-ash)"
							stroke="#2e2a27"
							stroke-width="2.2"
						/>
						<path d="M-5 -8.5 L-2.5 7.5 M6 -7.5 L4.5 7" fill="none" stroke="#5f5a55" stroke-width="1.6" />
					</g>
				</g>
			</g>
		{/if}
	{/key}
</svg>
</button>

<style>
	/* the whole picture is the button (a big target on phones); no button look of its own */
	.holk-btn {
		pointer-events: auto;
		cursor: pointer;
		padding: 0;
		border-radius: 12px;
		-webkit-tap-highlight-color: transparent;
	}
	.holk-btn svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.ember-glow {
		animation: ember 2.8s ease-in-out infinite;
	}
	@keyframes ember {
		50% {
			opacity: 0.55;
		}
	}

	/* SVG elements turn around the user-space origin, so these origins are in viewBox units */
	.holk-joint {
		transform-origin: 364px 151px;
	}
	.ash-pile {
		transform-origin: 207px 170px;
		transition: transform 0.35s cubic-bezier(0.3, 1.6, 0.5, 1) 0.68s;
	}

	/* one-shot effects of a tap (times from the click; the second flick is at 0.36 s) */
	.fx-floor {
		opacity: 0;
		animation: fx-flare 1.1s ease-out 0.36s both;
	}
	.fx-tip {
		opacity: 0;
		mix-blend-mode: screen;
		animation: fx-flare 1.3s ease-out 0.3s both;
	}
	@keyframes fx-flare {
		0% {
			opacity: 0;
		}
		22% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	.fx-chunk,
	.fx-flake,
	.fx-spark,
	.fx-dust {
		transform-box: fill-box;
		transform-origin: center;
	}
	.fx-chunk {
		animation: fx-chunk 0.52s cubic-bezier(0.5, 0, 0.9, 0.6) 0.36s both;
	}
	@keyframes fx-chunk {
		0% {
			transform: translate(0, 0) rotate(0);
			opacity: 1;
		}
		72% {
			transform: translate(6px, 22px) rotate(40deg);
			opacity: 1;
		}
		86% {
			transform: translate(7px, 24px) rotate(46deg) scale(1.35, 0.55);
			opacity: 0.85;
		}
		100% {
			transform: translate(8px, 25px) rotate(46deg) scale(1.7, 0.2);
			opacity: 0;
		}
	}
	.fx-flake {
		animation: fx-fall 0.62s cubic-bezier(0.5, 0, 0.9, 0.7) 0.38s both;
	}
	.fx-spark {
		animation: fx-fall 0.45s ease-in 0.36s both;
	}
	@keyframes fx-fall {
		0% {
			transform: translate(0, 0) rotate(0);
			opacity: 1;
		}
		75% {
			opacity: 1;
		}
		100% {
			transform: translate(var(--dx), var(--dy)) rotate(var(--r, 0deg));
			opacity: 0;
		}
	}
	.fx-dust {
		animation: fx-dust 1.15s ease-out 0.66s both;
	}
	@keyframes fx-dust {
		0% {
			transform: translate(0, 0) scale(0.3);
			opacity: 0;
		}
		25% {
			opacity: 0.9;
		}
		100% {
			transform: translate(var(--dx), var(--dy)) scale(2.4);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ember-glow {
			animation: none;
		}
		/* never shown without their animation (the pile still grows) */
		.ash-fx,
		.fx-tip {
			display: none;
		}
	}
</style>
