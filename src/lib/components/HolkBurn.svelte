<!--
	Abscar theme: the Divergence tile's progress bar drawn as a cone joint ("holk") that burns down
	as you get closer to the 33 Harmonic Breaks: ash grows from the wide end, the glowing ember sits
	where the paper starts, smoke rises from it. Unlit (twisted tip) at 0; all ash at 33.
	Our own cartoon. Decorative: the tile's text says the same.
-->
<script lang="ts">
	let { done, total }: { done: number; total: number } = $props();

	const uid = $props.id();
	/** wide (lit) end, narrow end where the crutch starts */
	const X0 = 8;
	const X1 = 172;
	const p = $derived(total > 0 ? Math.max(0, Math.min(1, done / total)) : 0);
	const lit = $derived(done > 0);
	/** where the ember is */
	const xb = $derived(X0 + p * (X1 - X0 - 4));
	/** top edge of the cone at x (for the smoke) */
	const topAt = (x: number) => 3 + ((x - X0) / (X1 - X0)) * 5;
	const CONE = `M${X0} 3 Q90 4.6 ${X1} 8 L${X1} 16 Q90 19.4 ${X0} 21 Q${X0 - 1.6} 12 ${X0} 3 Z`;
</script>

<svg class="holk-burn" viewBox="0 0 200 24" aria-hidden="true" focusable="false">
	<defs>
		<clipPath id="{uid}-cone"><path d={CONE} /></clipPath>
		<linearGradient id="{uid}-paper" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#fffdf7" />
			<stop offset="0.55" stop-color="#efe8da" />
			<stop offset="1" stop-color="#c9bfae" />
		</linearGradient>
		<linearGradient id="{uid}-ash" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#d4d1ca" />
			<stop offset="0.6" stop-color="#9b978f" />
			<stop offset="1" stop-color="#5d5a55" />
		</linearGradient>
		<linearGradient id="{uid}-ember" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0" stop-color="#7a1600" />
			<stop offset="0.35" stop-color="#ff3a00" />
			<stop offset="0.7" stop-color="#ffb21a" />
			<stop offset="1" stop-color="#3a1a08" />
		</linearGradient>
		<radialGradient id="{uid}-glow">
			<stop offset="0" stop-color="#ffcf4a" stop-opacity="0.95" />
			<stop offset="0.45" stop-color="#ff5a12" stop-opacity="0.5" />
			<stop offset="1" stop-color="#ff3000" stop-opacity="0" />
		</radialGradient>
		<pattern id="{uid}-cracks" width="7" height="24" patternUnits="userSpaceOnUse">
			<path d="M3 2 L4.5 9 L2.5 15 L4 22" fill="none" stroke="#45423e" stroke-width="0.7" opacity="0.65" />
		</pattern>
		<pattern id="{uid}-folds" width="14" height="24" patternUnits="userSpaceOnUse" patternTransform="skewX(-35)">
			<path d="M7 0 L7 24" stroke="#b8ad99" stroke-width="0.6" opacity="0.55" />
		</pattern>
	</defs>

	<!-- the crutch (rolled card filter) at the narrow end -->
	<rect x={X1 - 1} y="8" width="25" height="8" rx="1.6" fill="#caa46c" stroke="#3a2412" stroke-width="0.8" />
	<path d="M{X1 + 5} 8 v8 M{X1 + 11} 8 v8 M{X1 + 17} 8 v8" stroke="#9a7442" stroke-width="0.7" />

	<!-- the cone: paper, then (once lit) ash up to the ember -->
	<g clip-path="url(#{uid}-cone)">
		<rect x="0" y="0" width={X1} height="24" fill="url(#{uid}-paper)" />
		<rect x="0" y="0" width={X1} height="24" fill="url(#{uid}-folds)" />
		{#if lit}
			<rect x="0" y="0" width={xb} height="24" fill="url(#{uid}-ash)" />
			<rect x="0" y="0" width={xb} height="24" fill="url(#{uid}-cracks)" />
			<rect class="holk-ember" x={xb - 3} y="0" width="5" height="24" fill="url(#{uid}-ember)" />
		{/if}
	</g>
	<path d={CONE} fill="none" stroke="#2a1a0e" stroke-width="0.9" />

	{#if lit}
		<circle class="holk-glow" cx={xb} cy="12" r="9" fill="url(#{uid}-glow)" />
		<g class="holk-smoke" transform="translate({xb.toFixed(1)} {topAt(xb).toFixed(1)})">
			<circle r="2.4" /><circle r="2" /><circle r="2.8" />
		</g>
	{:else}
		<!-- unlit: the paper twisted shut into a little knot -->
		<path
			d="M{X0} 6 C{X0 - 2} 8 {X0 - 3} 9.6 {X0 - 4.2} 10 C{X0 - 6.4} 9 {X0 - 7.8} 10.4 {X0 - 6.2} 12 C{X0 - 7.8} 13.6 {X0 - 6.4} 15 {X0 - 4.2} 14 C{X0 - 3} 14.4 {X0 - 2} 16 {X0} 18 Z"
			fill="#f6f1e6"
			stroke="#2a1a0e"
			stroke-width="0.8"
			stroke-linejoin="round"
		/>
		<path d="M{X0 - 4.4} 10.4 Q{X0 - 2.6} 12 {X0 - 4.4} 13.6 M{X0 - 1.6} 9 Q{X0 + 0.6} 12 {X0 - 1.6} 15" fill="none" stroke="#b8ad99" stroke-width="0.6" />
	{/if}
</svg>
