<!--
	A burning strip under the header in the colours of Oden's "Hot Rod" camo: candy red with
	classic hot-rod flame licks (gold outline, orange-red inside). Our own drawing, repeated as an
	SVG pattern; two layers drift sideways and the front one flickers. Sparks float up.
	Abscar theme only, decorative.
-->
<script lang="ts" module>
	const TILE = 240;
	const H = 76;

	/** One flame lick with its base at the bottom: [left x, base width, height]. */
	type Lick = [number, number, number];

	/** A slim hot-rod tongue: rises, curls its tip to the right, sweeps back down. */
	function lick([x, w, h]: Lick): string {
		const y = (f: number) => (H - f * h).toFixed(1);
		const X = (f: number) => (x + f * w).toFixed(1);
		return (
			`M${X(0)} ${H} C${X(0)} ${y(0.35)} ${X(0.2)} ${y(0.5)} ${X(0.35)} ${y(0.68)} ` +
			`C${X(0.5)} ${y(0.85)} ${X(0.42)} ${y(0.95)} ${X(0.72)} ${y(1)} ` +
			`C${X(0.6)} ${y(0.88)} ${X(0.72)} ${y(0.72)} ${X(0.86)} ${y(0.55)} ` +
			`C${X(1)} ${y(0.38)} ${X(1)} ${y(0.15)} ${X(1)} ${H} Z`
		);
	}

	/** The same lick, shrunk toward its base (for the orange-red inside and the hot core). */
	const inset = ([x, w, h]: Lick, k: number): Lick => [x + (w * (1 - k)) / 2, w * k, h * k];

	/** Every lick drawn three times (x − tile, x, x + tile) so the pattern tiles seamlessly. */
	const wrap = (licks: Lick[]): Lick[] =>
		licks.flatMap(([x, w, h]) => [-TILE, 0, TILE].map((d): Lick => [x + d, w, h]));

	const FRONT = wrap([
		[0, 34, 48],
		[38, 30, 62],
		[76, 34, 42],
		[116, 32, 58],
		[156, 30, 46],
		[194, 34, 60]
	]);
	const BACK = wrap([
		[16, 40, 66],
		[84, 44, 54],
		[148, 40, 68],
		[206, 40, 56]
	]);
</script>

<script lang="ts">
	const uid = $props.id();
	const EMBERS = [6, 17, 29, 41, 52, 63, 74, 86, 95];
</script>

<div class="hotrod-strip" aria-hidden="true">
	<svg class="hotrod-svg" height={H} focusable="false">
		<defs>
			<pattern id="{uid}-back" width={TILE} height={H} patternUnits="userSpaceOnUse">
				{#each BACK as l, i (i)}<path d={lick(l)} fill="#8e1010" />{/each}
				{#each BACK as l, i (i)}<path d={lick(inset(l, 0.7))} fill="#c0200f" />{/each}
			</pattern>
			<pattern id="{uid}-front" width={TILE} height={H} patternUnits="userSpaceOnUse">
				{#each FRONT as l, i (i)}<path d={lick(l)} fill="#f5b818" stroke="#7a0d0d" stroke-width="1" />{/each}
				{#each FRONT as l, i (i)}<path d={lick(inset(l, 0.74))} fill="#e2361a" />{/each}
				{#each FRONT as l, i (i)}<path d={lick(inset(l, 0.38))} fill="#ff7a1a" />{/each}
			</pattern>
		</defs>
		<g class="hotrod-drift hotrod-drift-back"><rect x={-TILE} width="6000" height={H} fill="url(#{uid}-back)" opacity="0.85" /></g>
		<g class="hotrod-drift">
			<g class="hotrod-flicker"><rect x={-TILE} width="6000" height={H} fill="url(#{uid}-front)" /></g>
		</g>
	</svg>
	{#each EMBERS as left, i (left)}
		<i class="hotrod-ember" style:left="{left}%" style:animation-delay="{-(i * 0.73).toFixed(2)}s"></i>
	{/each}
</div>
