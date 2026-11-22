<!--
	A tiny cartoon of a sight kind for the Sights list (SightsSection): a slim mini reflex, a boxier
	reflex, a holo window with its ring, or a scope tube. Our own drawing, decoration only.
-->
<script lang="ts">
	import type { SightType } from '#lib/data/sights.ts';

	let { type }: { type: SightType } = $props();

	const shape = $derived(type === 'Mini Reflex' ? 'mini' : type === 'Reflex' ? 'reflex' : type === 'Holo' ? 'holo' : 'scope');
</script>

<svg class="sight-icon" viewBox="0 0 48 30" aria-hidden="true" focusable="false">
	<!-- light gunmetal with a dark outline, so it reads on dark and light themes alike -->
	<rect x="3" y="24" width="42" height="4" rx="1.5" fill="#6c7581" stroke="#101317" stroke-width="1.2" />
	{#if shape === 'mini'}
		<path d="M14 24 L16 12 Q24 8 32 12 L34 24 Z" fill="#8a94a1" stroke="#101317" stroke-width="1.6" />
		<path d="M17.5 22 L19 13.5 Q24 11 29 13.5 L30.5 22 Z" fill="#bfe3ff" opacity="0.75" />
		<circle cx="24" cy="17" r="2" fill="#ff2a1f" />
	{:else if shape === 'reflex'}
		<path d="M11 24 V11 Q11 7 15 7 H33 Q37 7 37 11 V24 Z" fill="#8a94a1" stroke="#101317" stroke-width="1.6" />
		<rect x="15" y="10.5" width="18" height="11" rx="2" fill="#bfe3ff" opacity="0.75" />
		<circle cx="24" cy="16" r="2" fill="#ff2a1f" />
	{:else if shape === 'holo'}
		<rect x="9" y="5" width="30" height="19" rx="3" fill="#8a94a1" stroke="#101317" stroke-width="1.6" />
		<rect x="12.5" y="8" width="23" height="13" rx="1.5" fill="#bfe3ff" opacity="0.75" />
		<circle cx="24" cy="14.5" r="4.6" fill="none" stroke="#ff2a1f" stroke-width="1.4" />
		<circle cx="24" cy="14.5" r="1.1" fill="#ff2a1f" />
	{:else}
		<rect x="8" y="18" width="6" height="6" fill="#6c7581" stroke="#101317" stroke-width="1.2" />
		<rect x="34" y="18" width="6" height="6" fill="#6c7581" stroke="#101317" stroke-width="1.2" />
		<path d="M4 10 Q4 6 8 6 H13 L16 9 H32 L35 6 H40 Q44 6 44 10 V15 Q44 19 40 19 H35 L32 16 H16 L13 19 H8 Q4 19 4 15 Z" fill="#8a94a1" stroke="#101317" stroke-width="1.6" />
		<ellipse cx="42" cy="12.5" rx="1.6" ry="4.5" fill="#bfe3ff" />
		<rect x="22" y="3" width="4" height="4" rx="1" fill="#8a94a1" stroke="#101317" stroke-width="1.2" />
	{/if}
</svg>

<style>
	.sight-icon {
		width: 48px;
		height: 30px;
		flex: none;
	}
</style>
