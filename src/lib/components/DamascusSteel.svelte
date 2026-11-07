<!--
	The header's backdrop in the Abscar theme, styled after the Damascus mastery camo: folded steel,
	black with flowing gold and bronze layers and a glossy sheen. Our own procedural drawing (not the
	game's texture): thin metal bands bent into Damascus swirls by an SVG turbulence displacement,
	plus a slow moving glint. Decorative, aria-hidden.
-->
<script lang="ts" module>
	/** The folded layers, top to bottom within one repeat: [colour, thickness in px]. */
	const BANDS: [string, number][] = [
		['#0d0803', 1.3],
		['#6e4616', 0.8],
		['#c9922f', 1.2],
		['#f6cf6a', 1.4],
		['#fff3c4', 0.5],
		['#e6b34f', 1.2],
		['#a06c22', 0.9],
		['#140c04', 1.5],
		['#8a5a1c', 0.8],
		['#e3b04f', 1.3],
		['#ffe6a0', 0.5],
		['#b98330', 1],
		['#1a1006', 1.2]
	];
	const PERIOD = BANDS.reduce((sum, [, h]) => sum + h, 0);
	const STRIPES = BANDS.reduce<{ y: number; h: number; c: string }[]>((acc, [c, h]) => {
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
