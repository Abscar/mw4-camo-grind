<!--
	A little cartoon tile per gunsmith slot, shown next to each attachment in the meta builds
	(MetaBuilds). Redrawn as inline SVG after the user's own icon sheet (2026-11-11: pastel tiles
	cycling peach / blue / green / pink / lavender, flat parts with a dark outline). Decoration only:
	the slot name is written right next to it, so it's aria-hidden.
-->
<script lang="ts">
	import type { AttachmentSlot } from '#lib/data/loadouts.ts';

	let { slot }: { slot: AttachmentSlot } = $props();

	const TILE: Record<AttachmentSlot, string> = {
		Optic: '#fde3b8',
		Muzzle: '#cfe6fb',
		Barrel: '#d6eecf',
		Underbarrel: '#f7d3dc',
		Magazine: '#e1d6f7',
		Ammunition: '#fde3b8',
		'Rear Grip': '#cfe6fb',
		Stock: '#d6eecf',
		Laser: '#f7d3dc',
		Bolt: '#e1d6f7',
		'Trigger Action': '#fde3b8',
		Comb: '#cfe6fb',
		Guard: '#d6eecf',
		Cylinder: '#f7d3dc',
		Apex: '#e1d6f7'
	};

	// the six chambers of the cylinder
	const CHAMBERS = [0, 1, 2, 3, 4, 5].map((i) => {
		const a = (i * Math.PI) / 3 - Math.PI / 2;
		return { x: 50 + 11 * Math.cos(a), y: 30 + 11 * Math.sin(a) };
	});

	function star(cx: number, cy: number, outer: number, inner: number): string {
		return Array.from({ length: 10 }, (_, i) => {
			const r = i % 2 ? inner : outer;
			const a = (i * Math.PI) / 5 - Math.PI / 2;
			return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
		}).join(' ');
	}
</script>

<svg class="att-icon" viewBox="0 0 100 60" aria-hidden="true" focusable="false">
	<rect x="1.5" y="1.5" width="97" height="57" rx="9" fill={TILE[slot]} stroke="#1d2129" stroke-width="2.5" />
	<g stroke="#1d2129" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
		{#if slot === 'Optic'}
			<rect x="30" y="34" width="8" height="8" fill="#8a909b" />
			<rect x="58" y="34" width="8" height="8" fill="#8a909b" />
			<rect x="24" y="42" width="48" height="6" rx="2" fill="#4b505b" />
			<rect x="18" y="16" width="58" height="18" rx="4" fill="#4b505b" />
			<rect x="30" y="19" width="32" height="3.5" rx="1.5" fill="#d3d8df" stroke="none" />
			<rect x="11" y="13" width="12" height="24" rx="3" fill="#3c4049" />
			<rect x="71" y="12" width="12" height="26" rx="3" fill="#3c4049" />
			<ellipse cx="84" cy="25" rx="4" ry="10" fill="#5bc8f5" />
		{:else if slot === 'Muzzle'}
			<rect x="12" y="24" width="16" height="12" rx="2" fill="#4b505b" />
			<rect x="26" y="18" width="44" height="24" rx="5" fill="#4b505b" />
			<path d="M40 23v14M48 23v14M56 23v14" stroke="#9aa0aa" stroke-width="3" />
			<rect x="68" y="21" width="8" height="18" rx="2" fill="#3c4049" />
			<path d="M82 22l6-4M82 30h8M82 38l6 4" />
		{:else if slot === 'Barrel'}
			<rect x="32" y="25" width="56" height="10" rx="2" fill="#b9bec7" />
			<rect x="54" y="21" width="7" height="18" rx="2" fill="#8a909b" />
			<rect x="82" y="22" width="9" height="16" rx="2" fill="#4b505b" />
			<rect x="8" y="19" width="26" height="22" rx="4" fill="#4b505b" />
		{:else if slot === 'Underbarrel'}
			<rect x="14" y="11" width="72" height="8" rx="2" fill="#4b505b" />
			<rect x="40" y="19" width="20" height="8" fill="#8a909b" />
			<rect x="39" y="27" width="22" height="27" rx="7" fill="#b98455" />
			<path d="M43 35h14M43 41h14M43 47h14" stroke="#7a5232" />
		{:else if slot === 'Magazine'}
			<path d="M36 15Q50 11 60 13L67 49Q56 53 45 51Z" fill="#4b505b" />
			<rect x="40" y="7" width="17" height="8" rx="2" fill="#f2b632" />
			<path d="M41 26l20-3M43 36l21-3M45 46l20-3" stroke="#8a909b" stroke-width="2.5" />
		{:else if slot === 'Ammunition'}
			{#each [32, 50, 68] as x (x)}
				<path d="M{x - 6} 28V21Q{x} 6 {x + 6} 21V28Z" fill="#c8622d" />
				<rect x={x - 6} y="28" width="12" height="20" fill="#e3a338" />
				<rect x={x - 7.5} y="47" width="15" height="5" rx="1" fill="#b97a1f" />
			{/each}
		{:else if slot === 'Rear Grip'}
			<rect x="20" y="13" width="58" height="10" rx="2" fill="#4b505b" />
			<path d="M54 23Q64 26 60 40" fill="none" />
			<path d="M33 23H52L46 53Q44 57 38 56L29 54Q24 52 26 47Z" fill="#3c4049" />
			<g fill="#9aa0aa" stroke="none">
				<circle cx="42" cy="31" r="1.6" /><circle cx="46" cy="31" r="1.6" />
				<circle cx="40" cy="38" r="1.6" /><circle cx="44" cy="38" r="1.6" />
				<circle cx="38" cy="45" r="1.6" /><circle cx="42" cy="45" r="1.6" />
			</g>
		{:else if slot === 'Stock'}
			<rect x="10" y="23" width="32" height="8" rx="1.5" fill="#b9bec7" />
			<path d="M36 17H62L76 33V46H63L53 30H36Z" fill="#4b505b" />
			<rect x="74" y="13" width="9" height="38" rx="3" fill="#d9452f" />
		{:else if slot === 'Laser'}
			<rect x="34" y="13" width="10" height="8" rx="2" fill="#d9452f" />
			<rect x="34" y="41" width="20" height="6" fill="#8a909b" />
			<rect x="24" y="20" width="38" height="22" rx="5" fill="#3c4049" />
			<rect x="60" y="25" width="8" height="12" rx="2" fill="#8a909b" />
			<path d="M69 31H86" stroke="#22c55e" stroke-width="2.5" />
			<circle cx="88" cy="31" r="3.5" fill="#22c55e" />
		{:else if slot === 'Bolt'}
			<path d="M70 31L77 44" stroke="#4b505b" stroke-width="5" />
			<path d="M70 31L77 44" stroke="#1d2129" stroke-width="1" fill="none" />
			<rect x="26" y="19" width="52" height="13" rx="2" fill="#b9bec7" />
			<path d="M36 22v7M42 22v7" stroke="#8a909b" />
			<rect x="15" y="16" width="13" height="19" rx="3" fill="#b9bec7" />
			<circle cx="78" cy="46" r="6.5" fill="#3c4049" />
		{:else if slot === 'Trigger Action'}
			<path d="M30 20Q30 51 50 51Q70 51 70 20" fill="#fbf4ea" stroke-width="3" />
			<path d="M46 20Q43 34 50 46Q55 38 55 20Z" fill="#d9452f" />
			<rect x="22" y="11" width="56" height="10" rx="3" fill="#4b505b" />
		{:else if slot === 'Comb'}
			<path d="M10 35L86 30V46H40Z" fill="#4b505b" />
			<path d="M34 32Q36 19 48 19H70Q77 19 77 31Z" fill="#b07a4f" />
			<path d="M42 24H71" stroke="#6e4628" stroke-dasharray="3 3" stroke-width="1.6" />
		{:else if slot === 'Guard'}
			<rect x="78" y="25" width="11" height="10" rx="1.5" fill="#8a909b" />
			<rect x="12" y="19" width="68" height="22" rx="7" fill="#4b505b" />
			<g fill="#2b2f37">
				{#each [25, 39, 53, 67] as x (x)}
					<ellipse cx={x} cy="30" rx="5" ry="3.5" />
				{/each}
			</g>
		{:else if slot === 'Cylinder'}
			<circle cx="50" cy="30" r="21" fill="#b9bec7" />
			{#each CHAMBERS as c, i (i)}
				<circle cx={c.x} cy={c.y} r="4.6" fill="#f2b632" stroke-width="1.8" />
			{/each}
			<circle cx="50" cy="30" r="3.5" fill="#4b505b" stroke-width="1.6" />
		{:else if slot === 'Apex'}
			<polygon points={star(50, 32, 19, 8.5)} fill="#f2b632" />
			<path d="M78 11v9M73.5 15.5h9M24 41v9M19.5 45.5h9" />
		{/if}
	</g>
</svg>

<style>
	.att-icon {
		display: block;
		width: 52px;
		height: 31px;
		flex: none;
	}
</style>
