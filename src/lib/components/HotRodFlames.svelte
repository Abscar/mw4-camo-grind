<!--
	A strip under the header drawn like Oden's "Hot Rod" camo, cartoon-flat: candy red, with slim
	flame licks that have a round root at the bottom and a long curling tip, each outlined twice
	(orange-red outside, gold inside) around a darker red middle, packed so they overlap.
	Our own drawing in that style (not the game's texture), repeated as an SVG pattern that drifts
	slowly; sparks float up. Abscar theme only, decorative.
-->
<script lang="ts" module>
	const TILE = 220;
	const H = 80;
	/** Bottom of the flames' round roots. */
	const BASE = 70;

	/** [centre x, root width, height, lean (1 = tip curls right, -1 = left)] */
	type Lick = [number, number, number, 1 | -1];

	function lick([cx, w, h, s]: Lick): string {
		const r = w / 2;
		const cy = BASE - r;
		const x = (dx: number) => (cx + s * dx).toFixed(1);
		const y = (v: number) => v.toFixed(1);
		const tipY = BASE - h;
		// tip → down the outer side (an S-curve) → round root → up the inner side (a wave) → tip
		return (
			`M${x(0.7 * w)} ${y(tipY)} ` +
			`C${x(0.05 * w)} ${y(BASE - 0.8 * h)} ${x(0.95 * w)} ${y(cy - 1.8 * r)} ${x(r)} ${y(cy)} ` +
			`A${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${s === 1 ? 1 : 0} ${x(-r)} ${y(cy)} ` +
			`C${x(-r)} ${y(cy - 2 * r)} ${x(-0.3 * w)} ${y(BASE - 0.62 * h)} ${x(0.1 * w)} ${y(BASE - 0.8 * h)} ` +
			`C${x(0.32 * w)} ${y(BASE - 0.9 * h)} ${x(0.5 * w)} ${y(BASE - 0.95 * h)} ${x(0.7 * w)} ${y(tipY)} Z`
		);
	}

	/** Every lick drawn three times (x − tile, x, x + tile) so the pattern tiles seamlessly. */
	const wrap = (licks: Lick[]): Lick[] =>
		licks.flatMap(([cx, w, h, s]) => [-TILE, 0, TILE].map((d): Lick => [cx + d, w, h, s]));

	// tall licks behind, short ones in front, in little clusters like the camo
	const LICKS = wrap([
		[30, 17, 62, 1],
		[76, 16, 56, -1],
		[122, 18, 64, 1],
		[170, 16, 58, 1],
		[212, 17, 60, -1],
		[12, 14, 42, 1],
		[52, 15, 46, -1],
		[98, 14, 40, 1],
		[146, 15, 46, -1],
		[190, 14, 42, 1]
	]);
</script>

<script lang="ts">
	const uid = $props.id();
	const EMBERS = [6, 17, 29, 41, 52, 63, 74, 86, 95];
</script>

<div class="hotrod-strip" aria-hidden="true">
	<svg class="hotrod-svg" height={H} focusable="false">
		<defs>
			<pattern id="{uid}-flames" width={TILE} height={H} patternUnits="userSpaceOnUse">
				{#each LICKS as l, i (i)}
					<path d={lick(l)} fill="#8a0f0e" stroke="#e8461b" stroke-width="6" stroke-linejoin="round" />
					<path d={lick(l)} fill="none" stroke="#f6b91c" stroke-width="2.6" stroke-linejoin="round" />
				{/each}
			</pattern>
		</defs>
		<g class="hotrod-drift"><rect x={-TILE} width="6000" height={H} fill="url(#{uid}-flames)" /></g>
	</svg>
	{#each EMBERS as left, i (left)}
		<i class="hotrod-ember" style:left="{left}%" style:animation-delay="{-(i * 0.73).toFixed(2)}s"></i>
	{/each}
</div>
