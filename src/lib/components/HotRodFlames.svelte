<!--
	A strip under the header styled like Oden's "Hot Rod" camo: candy red, with teardrop flame
	licks (round root, long flicked tip) in orange-red with a gold outline, tall ones behind and
	short ones in front. Our own drawing in that style (not the game's texture), repeated as an
	SVG pattern that drifts slowly; sparks float up. Abscar theme only, decorative.
-->
<script lang="ts" module>
	const TILE = 300;
	const H = 80;
	/** Bottom of the flames' round roots. */
	const BASE = 68;

	/** [centre x, root width, height, lean (1 = tip flicks right, -1 = left)] */
	type Lick = [number, number, number, 1 | -1];

	function lick([cx, w, h, s]: Lick): string {
		const r = w / 2;
		const cy = BASE - r;
		const x = (dx: number) => (cx + s * dx).toFixed(1);
		const y = (v: number) => v.toFixed(1);
		const tipY = BASE - h;
		// tip → down the outer side (an S-curve) → round root → up the inner side (a wave) → tip
		return (
			`M${x(0.52 * w)} ${y(tipY)} ` +
			`C${x(0.12 * w)} ${y(BASE - 0.84 * h)} ${x(0.8 * w)} ${y(cy - 1.4 * r)} ${x(r)} ${y(cy)} ` +
			`A${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${s === 1 ? 1 : 0} ${x(-r)} ${y(cy)} ` +
			`C${x(-r)} ${y(cy - 1.5 * r)} ${x(-0.18 * w)} ${y(BASE - 0.6 * h)} ${x(0.08 * w)} ${y(BASE - 0.8 * h)} ` +
			`C${x(0.26 * w)} ${y(BASE - 0.92 * h)} ${x(0.36 * w)} ${y(BASE - 0.96 * h)} ${x(0.52 * w)} ${y(tipY)} Z`
		);
	}

	/** Every lick drawn three times (x − tile, x, x + tile) so the pattern tiles seamlessly. */
	const wrap = (licks: Lick[]): Lick[] =>
		licks.flatMap(([cx, w, h, s]) => [-TILE, 0, TILE].map((d): Lick => [cx + d, w, h, s]));

	const TALL = wrap([
		[18, 24, 62, 1],
		[78, 22, 66, 1],
		[140, 24, 58, -1],
		[200, 22, 64, 1],
		[260, 24, 60, -1]
	]);
	const SHORT = wrap([
		[48, 20, 44, -1],
		[108, 19, 40, 1],
		[170, 20, 46, 1],
		[230, 19, 38, -1],
		[290, 20, 42, 1]
	]);
</script>

<script lang="ts">
	const uid = $props.id();
	const EMBERS = [6, 17, 29, 41, 52, 63, 74, 86, 95];
</script>

<div class="hotrod-strip" aria-hidden="true">
	<svg class="hotrod-svg" height={H} focusable="false">
		<defs>
			<linearGradient id="{uid}-body" x1="0" y1="1" x2="0" y2="0">
				<stop offset="0" stop-color="#ec4a1c" />
				<stop offset="1" stop-color="#d02a14" />
			</linearGradient>
			<pattern id="{uid}-flames" width={TILE} height={H} patternUnits="userSpaceOnUse">
				{#each [TALL, SHORT] as row, r (r)}
					{#each row as l, i (i)}
						<path
							d={lick(l)}
							fill="url(#{uid}-body)"
							stroke="#f4b51a"
							stroke-width="3.2"
							stroke-linejoin="round"
						/>
						<path d={lick(l)} fill="none" stroke="#7c0c0a" stroke-width="0.8" opacity="0.6" />
					{/each}
				{/each}
			</pattern>
		</defs>
		<g class="hotrod-drift"><rect x={-TILE} width="6000" height={H} fill="url(#{uid}-flames)" /></g>
	</svg>
	{#each EMBERS as left, i (left)}
		<i class="hotrod-ember" style:left="{left}%" style:animation-delay="{-(i * 0.73).toFixed(2)}s"></i>
	{/each}
</div>
