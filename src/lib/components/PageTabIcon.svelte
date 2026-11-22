<!--
	The little picture on each page tab (2026-11-21, the user: "snygga till flikarna … gör dom tydligt vilken som är
	vilken"). Our own cartoons in the site's style: filled with the tab's own colour (currentColor, set by the tab's
	--tc), a dark outline so they read on the light themes too. Decoration only: the tab's name is the label.
-->
<script lang="ts">
	type Kind = 'grind' | 'ranked' | 'cosmetics' | 'extras' | 'squad' | 'casino' | 'shop' | 'arcade' | 'mayhem';
	let { kind }: { kind: Kind } = $props();

	const INK = '#1b1124';
	/** the chip's six edge notches */
	const NOTCHES = [0, 60, 120, 180, 240, 300];
</script>

<svg class="pt-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
	{#if kind === 'grind'}
		<!-- a crosshair around a gold camo diamond -->
		<g fill="none" stroke-linecap="round">
			<circle cx="12" cy="12" r="8.6" stroke={INK} stroke-width="4" />
			<path d="M12 1.6v4.2M12 18.2v4.2M1.6 12h4.2M18.2 12h4.2" stroke={INK} stroke-width="4" />
			<circle cx="12" cy="12" r="8.6" stroke="currentColor" stroke-width="2" />
			<path d="M12 1.6v4.2M12 18.2v4.2M1.6 12h4.2M18.2 12h4.2" stroke="currentColor" stroke-width="2" />
		</g>
		<path d="M12 6.6 17.4 12 12 17.4 6.6 12Z" fill="currentColor" stroke={INK} stroke-width="1.4" stroke-linejoin="round" />
		<path d="M12 8.6 9.6 11" stroke="#fff" stroke-opacity="0.85" stroke-width="1.3" stroke-linecap="round" />
	{:else if kind === 'ranked'}
		<!-- a rank badge: hexagon with two chevrons and a star -->
		<path d="M12 1.8 20.6 6.8v10.4L12 22.2 3.4 17.2V6.8Z" fill="currentColor" stroke={INK} stroke-width="1.6" stroke-linejoin="round" />
		<path d="M12 4.4 18.4 8.1v7.8L12 19.6 5.6 15.9V8.1Z" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="1" />
		<path
			d="M7.6 14.2 12 11l4.4 3.2M7.6 17.4 12 14.2l4.4 3.2"
			fill="none"
			stroke="#fff"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<path d="m12 4.9.85 1.7 1.9.28-1.37 1.33.32 1.88L12 9.2l-1.7.89.32-1.88-1.37-1.33 1.9-.28Z" fill="#fff" />
	{:else if kind === 'cosmetics'}
		<!-- a die-cut star sticker: dark edge, white rim, a shine -->
		<path
			d="M12 3.3 14.53 9.32 21.04 9.86 16.09 14.13 17.58 20.49 12 17.1 6.42 20.49 7.91 14.13 2.97 9.86 9.47 9.32Z"
			fill="none"
			stroke={INK}
			stroke-width="4.4"
			stroke-linejoin="round"
		/>
		<path
			d="M12 3.3 14.53 9.32 21.04 9.86 16.09 14.13 17.58 20.49 12 17.1 6.42 20.49 7.91 14.13 2.97 9.86 9.47 9.32Z"
			fill="currentColor"
			stroke="#fff"
			stroke-width="2"
			stroke-linejoin="round"
		/>
		<path d="M10.1 10.6c.5-1 1.1-1.9 1.6-2.6" stroke="#fff" stroke-opacity="0.9" stroke-width="1.3" stroke-linecap="round" />
		<circle cx="15.2" cy="14.6" r="0.9" fill={INK} fill-opacity="0.45" />
	{:else if kind === 'extras'}
		<!-- a camo swatch with a sparkle: the special camos -->
		<rect x="2.8" y="5.6" width="14.8" height="14.8" rx="3.2" fill="currentColor" stroke={INK} stroke-width="1.6" />
		<g fill={INK} fill-opacity="0.38">
			<path d="M4.6 9.4c1.3-1.8 3.7-.9 4.6.4.9 1.4-.3 2.9-2.2 2.8-1.8-.1-3.4-1.8-2.4-3.2Z" />
			<path d="M10.8 14.2c1.1-1.4 3.6-1.2 4.6.2.8 1.2.2 3.4-1.8 3.7-1.9.3-4-2.2-2.8-3.9Z" />
			<path d="M4.4 16.6c.8-.9 2.2-.6 2.6.3.4.9-.4 1.9-1.5 1.8-1 0-1.8-1.2-1.1-2.1Z" />
		</g>
		<g fill="#fff" fill-opacity="0.5">
			<path d="M10.2 7.8c.9-.7 2.4-.4 2.8.5.5.9-.3 1.9-1.5 1.9-1.2 0-2.1-1.6-1.3-2.4Z" />
			<path d="M6.6 13.6c.6-.4 1.5-.2 1.7.4.2.6-.3 1.2-1 1.2-.7 0-1.2-1-.7-1.6Z" />
		</g>
		<path
			d="m19 1.4 1.05 2.85 2.85 1.05-2.85 1.05L19 9.2l-1.05-2.85L15.1 5.3l2.85-1.05Z"
			fill="#fff"
			stroke={INK}
			stroke-width="1.1"
			stroke-linejoin="round"
		/>
	{:else if kind === 'squad'}
		<!-- three operators side by side -->
		<g fill="currentColor" stroke={INK} stroke-width="1.4" stroke-linejoin="round">
			<circle cx="5.9" cy="9.2" r="2.9" />
			<path d="M1.3 19.6c0-3.3 2-5.6 4.6-5.6s4.6 2.3 4.6 5.6Z" />
			<circle cx="18.1" cy="9.2" r="2.9" />
			<path d="M13.5 19.6c0-3.3 2-5.6 4.6-5.6s4.6 2.3 4.6 5.6Z" />
		</g>
		<g fill={INK} fill-opacity="0.28">
			<circle cx="5.9" cy="9.2" r="2.9" />
			<path d="M1.3 19.6c0-3.3 2-5.6 4.6-5.6s4.6 2.3 4.6 5.6Z" />
			<circle cx="18.1" cy="9.2" r="2.9" />
			<path d="M13.5 19.6c0-3.3 2-5.6 4.6-5.6s4.6 2.3 4.6 5.6Z" />
		</g>
		<g fill="currentColor" stroke={INK} stroke-width="1.5" stroke-linejoin="round">
			<path d="M5.6 22c0-4.2 2.8-7 6.4-7s6.4 2.8 6.4 7Z" />
			<circle cx="12" cy="8.2" r="3.7" />
		</g>
		<path d="M10.2 6.6c.4-.6 1-.9 1.6-1" stroke="#fff" stroke-opacity="0.8" stroke-width="1.1" stroke-linecap="round" />
	{:else if kind === 'casino'}
		<!-- a casino chip with a little burger in the middle -->
		<circle cx="12" cy="12" r="9.8" fill="currentColor" stroke={INK} stroke-width="1.6" />
		<g fill="#fff">
			{#each NOTCHES as a (a)}
				<rect x="10.5" y="2.6" width="3" height="3.2" rx="0.7" transform="rotate({a} 12 12)" />
			{/each}
		</g>
		<circle cx="12" cy="12" r="5.7" fill={INK} fill-opacity="0.25" stroke="#fff" stroke-width="1.2" stroke-dasharray="2.2 1.5" />
		<g stroke={INK} stroke-width="0.6" stroke-linejoin="round">
			<path d="M8.7 11.7a3.3 2.6 0 0 1 6.6 0Z" fill="#ffb347" />
			<rect x="8.4" y="12.1" width="7.2" height="1.4" rx="0.6" fill="#7a3f1d" />
			<path d="M8.7 13.9h6.6a1 1 0 0 1-1 1.3h-4.6a1 1 0 0 1-1-1.3Z" fill="#ffb347" />
		</g>
	{:else if kind === 'arcade'}
		<!-- an arcade joystick: a deck in the tab's colour, a chrome stick, a red ball, two buttons -->
		<path d="M2.4 16.2 4.6 11.6h14.8l2.2 4.6v2.6a1.8 1.8 0 0 1-1.8 1.8H4.2a1.8 1.8 0 0 1-1.8-1.8Z" fill="currentColor" stroke={INK} stroke-width="1.6" stroke-linejoin="round" />
		<path d="M2.6 16.4h18.8" stroke={INK} stroke-opacity="0.35" stroke-width="1.1" />
		<path d="M8.2 13.6 8 5.8h1.9l-.2 7.8Z" fill="#e8e8f0" stroke={INK} stroke-width="1.1" stroke-linejoin="round" />
		<ellipse cx="8.9" cy="13.6" rx="2.9" ry="1.2" fill={INK} />
		<circle cx="9" cy="5" r="3.4" fill="#ff3b5a" stroke={INK} stroke-width="1.4" />
		<path d="M7.6 3.7c.4-.4.9-.6 1.4-.6" stroke="#fff" stroke-opacity="0.9" stroke-width="1.1" stroke-linecap="round" />
		<ellipse cx="15.2" cy="13.8" rx="1.9" ry="1.1" fill="#ffc93c" stroke={INK} stroke-width="1" />
		<ellipse cx="18.4" cy="14.6" rx="1.5" ry="0.9" fill="#45e6ff" stroke={INK} stroke-width="1" />
	{:else if kind === 'mayhem'}
		<!-- Squad Mayhem: a pistol in the tab's colour with a muzzle flash and a ketchup splat -->
		<path d="M14.6 4.2 17.4 2.1l.9 2.8 2.9-.4-1.9 2.2 2 2.1-2.9.1-.6 2.9-2-2.1" fill="#ffd23a" stroke={INK} stroke-width="1.1" stroke-linejoin="round" />
		<path d="M2.8 7.6h12.6a1.2 1.2 0 0 1 1.2 1.2v2.4a1.2 1.2 0 0 1-1.2 1.2H9.6l-1.2 7.4a1.3 1.3 0 0 1-1.3 1.1H4.6a1 1 0 0 1-1-1.2l1.3-7.3H2.8a1 1 0 0 1-1-1V8.6a1 1 0 0 1 1-1Z" fill="currentColor" stroke={INK} stroke-width="1.6" stroke-linejoin="round" />
		<path d="M9.4 12.4c.2 1.4 1 2.2 2.4 2.2" fill="none" stroke={INK} stroke-width="1.3" stroke-linecap="round" />
		<circle cx="18.6" cy="17.6" r="2.6" fill="#e0213a" stroke={INK} stroke-width="1" />
		<circle cx="21.2" cy="20.6" r="1" fill="#e0213a" />
	{:else}
		<!-- a shopping bag with a burger coin on it -->
		<path d="M8.4 8.4V6.6a3.6 3.6 0 0 1 7.2 0v1.8" fill="none" stroke={INK} stroke-width="2.1" stroke-linecap="round" />
		<path
			d="M4.3 8.2h15.4l-1.25 12.2a1.7 1.7 0 0 1-1.7 1.5H7.25a1.7 1.7 0 0 1-1.7-1.5Z"
			fill="currentColor"
			stroke={INK}
			stroke-width="1.6"
			stroke-linejoin="round"
		/>
		<path d="M4.6 10.6h14.8" stroke={INK} stroke-opacity="0.3" stroke-width="1.2" />
		<circle cx="12" cy="15.6" r="3.4" fill="#ffc93c" stroke={INK} stroke-width="1" />
		<path d="M10.3 15h3.4M10.3 16.6h3.4" stroke="#8a4a12" stroke-width="1.1" stroke-linecap="round" />
		<circle cx="8.4" cy="8.4" r="0.9" fill={INK} />
		<circle cx="15.6" cy="8.4" r="0.9" fill={INK} />
	{/if}
</svg>

<style>
	.pt-icon {
		display: block;
		flex: none;
		width: 22px;
		height: 22px;
		overflow: visible;
	}
</style>
