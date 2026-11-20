<!--
	A BurgiShop pin (shop.ts slot "badge"): our own small drawings on a round enamel pin, worn on the
	corner of a member's operator emblem (OpGear.svelte) and shown in the shop. Decorative.
-->
<script lang="ts">
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';
	import { karmaPin } from '#lib/karmaShopArt.ts';

	let { id, size = 24 }: { id: string; size?: number } = $props();
	const uid = $props.id();
	const O = '#1d0e05';
</script>

<svg class="shop-pin" viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
	<defs>
		<radialGradient id="{uid}-gold" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff6b0" /><stop offset="0.5" stop-color="#ffc928" /><stop offset="1" stop-color="#a86200" /></radialGradient>
		<linearGradient id="{uid}-gem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8fdff" /><stop offset="0.45" stop-color="#5ce1ff" /><stop offset="1" stop-color="#1a6ad8" /></linearGradient>
	</defs>
	<!-- the pin's rim -->
	<circle cx="16" cy="16" r="14.5" fill={id === 'pin-holk' || id === 'pin-crown' ? '#2a0a06' : id === 'pin-leaf' || id === 'pin-420' ? '#0b2a10' : id.startsWith('k-') ? '#3a0a26' : '#12161c'} stroke="url(#{uid}-gold)" stroke-width="2.5" />
	{#if id === 'pin-burger'}
		<path d="M7 15c0-4.4 4-7 9-7s9 2.6 9 7z" fill="#e0a040" stroke={O} stroke-width="1.2" />
		<path d="M6.5 16.5h19l-1.5 2h-16z" fill="#4fb23a" />
		<rect x="7" y="18.2" width="18" height="2.8" rx="1.2" fill="#6b3a1c" />
		<path d="M7.5 21.5h17c0 2-1.5 3-3.5 3H11c-2 0-3.5-1-3.5-3z" fill="#e0a040" stroke={O} stroke-width="1.2" />
	{:else if id === 'pin-skull'}
		<path d="M16 6c-5.5 0-9 3.6-9 8.4 0 2.8 1.3 4.6 3 5.6V24h12v-4c1.7-1 3-2.8 3-5.6C25 9.6 21.5 6 16 6z" fill="#f2f2ea" stroke={O} stroke-width="1.2" />
		<circle cx="12.4" cy="14.6" r="2.6" fill="#e2261f" /><circle cx="19.6" cy="14.6" r="2.6" fill="#e2261f" />
		<path d="M16 17l-1.4 2.6h2.8z" fill={O} />
		<path d="M12.5 22v2M15 22v2M17.5 22v2M20 22v2" stroke={O} stroke-width="1" />
	{:else if id === 'pin-7s'}
		{#each [9.5, 16, 22.5] as x (x)}
			<text x={x} y="21.5" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="12" fill="#e2261f" stroke="#fff6b0" stroke-width="0.8" paint-order="stroke">7</text>
		{/each}
	{:else if id === 'pin-crown'}
		<path d="M6.5 21 L8 10 L12.5 15 L16 8 L19.5 15 L24 10 L25.5 21 Z" fill="url(#{uid}-gold)" stroke={O} stroke-width="1.2" stroke-linejoin="round" />
		<rect x="6.5" y="21" width="19" height="3.4" rx="1" fill="url(#{uid}-gold)" stroke={O} stroke-width="1.2" />
		<circle cx="16" cy="18" r="1.6" fill="#e2261f" /><circle cx="11" cy="19" r="1.1" fill="#5ce1ff" /><circle cx="21" cy="19" r="1.1" fill="#5ce1ff" />
	{:else if id === 'pin-diamond'}
		<path d="M9 13 L12.5 8.5 H19.5 L23 13 L16 24 Z" fill="url(#{uid}-gem)" stroke={O} stroke-width="1.2" stroke-linejoin="round" />
		<path d="M9 13 H23 M12.5 8.5 L14.5 13 L16 24 L17.5 13 L19.5 8.5" fill="none" stroke="#e8fdff" stroke-width="0.8" opacity="0.8" />
	{:else if id === 'pin-leaf'}
		<g transform="translate(4 3.5) scale(1)">
			{#each LEAF_PATHS as d, i (i)}<path {d} fill="#3fb34a" stroke="#14501a" stroke-width="0.7" stroke-linejoin="round" />{/each}
			<path d={LEAF_STEM} stroke="#14501a" stroke-width="1.4" stroke-linecap="round" />
		</g>
	{:else if id === 'pin-brownie'}
		<!-- a space brownie: a fudgy square, white frosting dripping, a little leaf on top -->
		<rect x="8" y="11" width="16" height="13" rx="2" fill="#5a2e14" stroke={O} stroke-width="1.2" />
		<path d="M8 13 Q8 10.5 10.5 10.5 H21.5 Q24 10.5 24 13 V14 Q22.6 16.4 21.4 14.2 Q20 17 18.6 14.4 Q17.2 16.8 15.8 14.3 Q14.2 17.2 12.8 14.4 Q11 16.6 9.6 14.3 Q8.6 15.6 8 14 Z" fill="#fff6f0" stroke={O} stroke-width="1" stroke-linejoin="round" />
		<g transform="translate(11.4 2.6) scale(0.4)">{#each LEAF_PATHS as d, i (i)}<path {d} fill="#3fb34a" stroke="#14501a" stroke-width="1.2" />{/each}</g>
		<circle cx="12" cy="19.5" r="0.9" fill="#3a1a08" /><circle cx="19" cy="21" r="0.9" fill="#3a1a08" /><circle cx="16" cy="18" r="0.7" fill="#3a1a08" />
	{:else if id === 'pin-grinder'}
		<!-- a grinder seen from above: a metal ring with teeth and a leaf on the lid -->
		<circle cx="16" cy="16" r="10.5" fill="#9aa6b2" stroke={O} stroke-width="1.2" />
		{#each Array.from({ length: 16 }) as _, i (i)}
			<rect x="15.2" y="5.3" width="1.6" height="2.4" fill="#5a6470" transform="rotate({i * 22.5} 16 16)" />
		{/each}
		<circle cx="16" cy="16" r="7.4" fill="#2fa84f" stroke={O} stroke-width="1" />
		<g transform="translate(9.6 8.6) scale(0.55)">{#each LEAF_PATHS as d, i (i)}<path {d} fill="#c8f5a0" />{/each}</g>
	{:else if id === 'pin-420'}
		<text x="16" y="20.5" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="12.5" fill="#7dff6a" stroke="#0b3d10" stroke-width="1" paint-order="stroke" letter-spacing="0.3">420</text>
		<g transform="translate(11.8 1.6) scale(0.36)">{#each LEAF_PATHS as d, i (i)}<path {d} fill="#3fb34a" />{/each}</g>
	{:else if id === 'pin-holk'}
		<!-- a golden cone joint with a glowing tip -->
		<path d="M8 22 L23 10.5 L25.2 13.6 L9.6 23.6 Z" fill="url(#{uid}-gold)" stroke={O} stroke-width="1.1" stroke-linejoin="round" />
		<path d="M8 22 L10.4 20.2 L11.6 22 L9.6 23.6 Z" fill="#a86200" />
		<ellipse cx="24.3" cy="11.9" rx="1.6" ry="2.1" transform="rotate(-37 24.3 11.9)" fill="#ff8a1a" />
		<circle cx="25" cy="11" r="3.4" fill="#ff8a1a" opacity="0.35" />
		<path d="M25 8 q-1.5 -2 0.5 -3.5 q1.5 -1.2 0 -2.8" fill="none" stroke="#e8e8e0" stroke-width="1.1" stroke-linecap="round" opacity="0.85" />
	{:else if id.startsWith('k-')}
		<!-- KarmaShop's pins (karmaShopArt.ts) -->
		{@html karmaPin(uid, id)}
	{/if}
	<!-- enamel shine -->
	<path d="M6 11 A11 11 0 0 1 14 5" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity="0.45" />
</svg>

<style>
	.shop-pin {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.6));
	}
</style>
