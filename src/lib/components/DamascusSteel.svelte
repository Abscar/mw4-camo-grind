<!--
	The header's backdrop in the Abscar theme, styled after MW4's Damascus Reforged mastery camo:
	glossy blue-violet metal with flowing Damascus contour lines alternating hot pink and light blue,
	with thin deep-blue lines between. Our own procedural drawing (not the game's texture): thin
	bands bent into Damascus swirls by an SVG turbulence displacement, plus a slow moving glint.
	Decorative, aria-hidden.
-->
<script lang="ts" module>
	/** The folded layers, top to bottom within one repeat: [colour, thickness in px]. */
	const BANDS: [string, number][] = [
		['#2a22b5', 1.4],
		['#5a3cf0', 1.6],
		['#ff6fd2', 0.9],
		['#ffc6ef', 0.35],
		['#8a5cff', 1.5],
		['#3d4de6', 1.1],
		['#7fd8ff', 0.9],
		['#dff6ff', 0.35],
		['#6a48f5', 1.6],
		['#2f2ac6', 1.2]
	];
	/** How chunky the layers are drawn (1 = the thicknesses above). */
	const SCALE = 1.8;
	const PERIOD = BANDS.reduce((sum, [, h]) => sum + h * SCALE, 0);
	const STRIPES = BANDS.map(([c, h]): [string, number] => [c, h * SCALE]).reduce<{ y: number; h: number; c: string }[]>((acc, [c, h]) => {
		const y = acc.length ? acc[acc.length - 1].y + acc[acc.length - 1].h : 0;
		return [...acc, { y, h, c }];
	}, []);
</script>

<script lang="ts">
	const uid = $props.id();
</script>

<div class="damascus" aria-hidden="true">
	<svg class="damascus-svg" focusable="false">
		<defs>
			<pattern
				id="{uid}-layers"
				width="400"
				height={PERIOD}
				patternUnits="userSpaceOnUse"
				patternTransform="rotate(-9)"
			>
				{#each STRIPES as s (s.y)}
					<rect y={s.y} width="400" height={s.h + 0.05} fill={s.c} />
				{/each}
			</pattern>
			<filter id="{uid}-fold" x="-10%" y="-10%" width="120%" height="120%">
				<feTurbulence type="fractalNoise" baseFrequency="0.004 0.007" numOctaves="4" seed="17" result="flow" />
				<feDisplacementMap in="SourceGraphic" in2="flow" scale="150" xChannelSelector="R" yChannelSelector="G" />
			</filter>
		</defs>
		<rect x="-10%" y="-10%" width="120%" height="120%" fill="url(#{uid}-layers)" filter="url(#{uid}-fold)" />
	</svg>
	<i class="damascus-sheen"></i>
	<b class="damascus-shade"></b>
</div>
