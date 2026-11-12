<!--
	A little cartoon tile per piece of equipment (lethals, tacticals, field upgrades, a few streaks),
	for the Ranked prep tab (2026-11-12, the user's ask: "draw small pictures of the tacticals,
	lethals etc that are allowed in ranked"). Our own drawings in the same style as AttachmentIcon
	(pastel tile, flat parts, dark outline). `banned` greys it out and lays a red slash over it.
	Decoration only: the item's name is always written next to it, so it's aria-hidden.
-->
<script lang="ts">
	let { id, banned = false, size = 44 }: { id: string; banned?: boolean; size?: number } = $props();

	const PASTELS = ['#fde3b8', '#cfe6fb', '#d6eecf', '#f7d3dc', '#e1d6f7'];
	/** Same tile colour for the same item everywhere, cycling the pastels. */
	const tile = $derived(PASTELS[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % PASTELS.length]);

	const INK = '#1d2129';
	const DARK = '#3c4049';
	const MID = '#4b505b';
	const STEEL = '#8a909b';
	const LIGHT = '#b9bec7';
	const OLIVE = '#6b7a3a';
	const RED = '#d9452f';
	const AMBER = '#f2b632';
	const CYAN = '#5bc8f5';
	const GREEN = '#22c55e';
</script>

<svg class="gear-icon" class:banned viewBox="0 0 60 60" width={size} height={size} aria-hidden="true" focusable="false">
	<rect x="1.5" y="1.5" width="57" height="57" rx="10" fill={tile} stroke={INK} stroke-width="2.5" />
	<g class="art" stroke={INK} stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
		{#if id === 'frag'}
			<rect x="25" y="9" width="10" height="7" rx="1.5" fill={STEEL} />
			<path d="M34 11q10-1 9 12" fill="none" stroke-width="3" />
			<circle cx="22" cy="12" r="4" fill="none" stroke={AMBER} stroke-width="2.2" />
			<ellipse cx="30" cy="34" rx="14" ry="17" fill={OLIVE} />
			<path d="M17 28h26M16 36h28M18 44h24M25 18v32M35 18v32" stroke="#4b5826" stroke-width="1.6" />
		{:else if id === 'sticky'}
			<rect x="19" y="18" width="22" height="30" rx="6" fill={MID} />
			<path d="M17 22q3-9 13-9t13 9q-4 5-13 4t-13-4z" fill={GREEN} />
			<path d="M22 24q-1 6 1 9M38 24q2 5 0 8" stroke={GREEN} stroke-width="2.5" fill="none" />
			<circle cx="30" cy="38" r="3.5" fill={RED} />
		{:else if id === 'drill'}
			<path d="M30 52L23 38h14z" fill={LIGHT} />
			<path d="M25 42l10 2M27 47l6 1" stroke={STEEL} />
			<rect x="19" y="14" width="22" height="24" rx="4" fill={AMBER} />
			<rect x="19" y="22" width="22" height="6" fill={DARK} />
			<circle cx="30" cy="10" r="3" fill={RED} />
		{:else if id === 'proxMine'}
			<path d="M17 46l-4 6M43 46l4 6M30 48v6" />
			<ellipse cx="30" cy="40" rx="18" ry="8" fill={OLIVE} />
			<path d="M12 34q18 10 36 0v6q-18 10-36 0z" fill="#4b5826" />
			<ellipse cx="30" cy="33" rx="18" ry="8" fill={OLIVE} />
			<circle cx="30" cy="32" r="4" fill={RED} />
		{:else if id === 'zipGun'}
			<rect x="10" y="20" width="38" height="9" rx="2" fill={STEEL} />
			<path d="M14 24h30" stroke={MID} stroke-width="1.5" />
			<path d="M20 29h12l-3 20h-9z" fill="#a0703f" />
			<path d="M20 34h12M20 40h11" stroke="#6e4628" stroke-width="2.5" />
			<path d="M33 29q4 8-2 10" fill="none" />
		{:else if id === 'tripWire'}
			<rect x="10" y="24" width="8" height="24" rx="2" fill={MID} />
			<rect x="42" y="24" width="8" height="24" rx="2" fill={MID} />
			<path d="M18 33H42" stroke={RED} stroke-width="2.6" />
			<circle cx="14" cy="21" r="3.5" fill={RED} />
			<circle cx="46" cy="21" r="3.5" fill={RED} />
		{:else if id === 'thermite'}
			<path d="M30 6q8 8 3 14q6-2 5-8q8 10-2 16h-12q-8-8 6-22z" fill="#ff8a1e" />
			<path d="M29 14q4 5 0 10" fill="none" stroke={AMBER} />
			<rect x="21" y="25" width="18" height="26" rx="3" fill={RED} />
			<rect x="21" y="32" width="18" height="6" fill={DARK} />
		{:else if id === 'molotov'}
			<path d="M26 4q8 6 2 12q6 0 5-6q6 8-3 12z" fill="#ff8a1e" />
			<path d="M26 18q-2-4 0-6l6 0q2 3 0 6" fill="#e9d8b8" />
			<rect x="26" y="18" width="8" height="8" fill="#7fb07a" />
			<path d="M26 26q-10 4-10 14v8q0 4 4 4h20q4 0 4-4v-8q0-10-10-14z" fill="#7fb07a" />
			<path d="M18 40h24v8q0 4-4 4H22q-4 0-4-4z" fill="#d97a2f" stroke="none" />
			<path d="M23 31q-2 5-1 10" stroke="#ffffff" stroke-width="2" opacity="0.7" />
		{:else if id === 'claymore'}
			<path d="M20 44l-4 9M40 44l4 9" />
			<path d="M10 22q20-8 40 0v20q-20-8-40 0z" fill={OLIVE} />
			<path d="M16 30h28" stroke="#4b5826" stroke-width="3" />
			<rect x="27" y="14" width="6" height="6" fill={STEEL} />
		{:else if id === 'c4'}
			<rect x="10" y="22" width="40" height="26" rx="3" fill="#e9d8b8" />
			<path d="M10 30h40M10 40h40" stroke="#b8a37f" />
			<rect x="22" y="15" width="16" height="10" rx="2" fill={DARK} />
			<circle cx="34" cy="20" r="2.4" fill={RED} stroke="none" />
			<path d="M15 26q-5-10 7-11" fill="none" stroke={RED} stroke-width="2" />
		{:else if id === 'throwingKnife'}
			<path d="M10 50L36 14q6-6 10-2q4 4-2 10L18 52z" fill={LIGHT} />
			<path d="M24 34l8 8" stroke={STEEL} stroke-width="1.6" />
			<path d="M10 50l8 2-4-8z" fill={DARK} />
			<circle cx="40" cy="20" r="2.5" fill={INK} stroke="none" />
		{:else if id === 'flash'}
			<path d="M44 4l1.8 5.2 5.2-1.8-1.8 5.2 5.2 1.8-5.2 1.8 1.8 5.2-5.2-1.8-1.8 5.2-1.8-5.2-5.2 1.8 1.8-5.2-5.2-1.8 5.2-1.8-1.8-5.2 5.2 1.8z" fill="#fff2a0" stroke={AMBER} stroke-width="1.4" />
			<rect x="21" y="16" width="18" height="34" rx="4" fill={LIGHT} />
			<g fill={INK} stroke="none">
				<circle cx="26" cy="25" r="1.8" /><circle cx="34" cy="25" r="1.8" /><circle cx="26" cy="33" r="1.8" />
				<circle cx="34" cy="33" r="1.8" /><circle cx="26" cy="41" r="1.8" /><circle cx="34" cy="41" r="1.8" />
			</g>
			<rect x="24" y="10" width="12" height="6" rx="1.5" fill={STEEL} />
		{:else if id === 'smoke'}
			<g fill="#eef0f3">
				<circle cx="20" cy="18" r="8" /><circle cx="32" cy="12" r="9" /><circle cx="43" cy="20" r="7" />
			</g>
			<rect x="20" y="26" width="20" height="26" rx="4" fill={GREEN} />
			<rect x="20" y="34" width="20" height="5" fill={INK} stroke="none" />
		{:else if id === 'snapshot'}
			<path d="M8 30q22-14 44 0" fill="none" stroke={CYAN} stroke-width="1.6" stroke-dasharray="3 3" />
			<rect x="20" y="22" width="20" height="28" rx="5" fill={MID} />
			<circle cx="30" cy="33" r="6" fill={CYAN} />
			<circle cx="30" cy="33" r="2.4" fill={INK} stroke="none" />
			<rect x="24" y="15" width="12" height="7" rx="1.5" fill={STEEL} />
		{:else if id === 'concussion'}
			<rect x="21" y="16" width="18" height="34" rx="4" fill={DARK} />
			<path d="M21 26h18M21 40h18" stroke={AMBER} stroke-width="4" />
			<rect x="24" y="10" width="12" height="6" rx="1.5" fill={STEEL} />
			<path d="M11 12l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1zM49 10l1.5 3 3 .5-2 2 .5 3-3-1.5-3 1.5.5-3-2-2 3-.5z" fill={AMBER} stroke-width="1.4" />
		{:else if id === 'heartbeat'}
			<rect x="15" y="10" width="30" height="42" rx="5" fill={MID} />
			<rect x="19" y="15" width="22" height="20" rx="2" fill="#0d2a1a" />
			<path d="M20 26h6l2-6 3 11 2-5h7" fill="none" stroke={GREEN} stroke-width="2" />
			<circle cx="30" cy="44" r="3.5" fill={RED} />
		{:else if id === 'shockStick'}
			<path d="M16 48L40 16" stroke={DARK} stroke-width="8" />
			<path d="M16 48L40 16" stroke={STEEL} stroke-width="3" />
			<path d="M42 6l-6 9h6l-7 10M50 14l-5 4 4 2-5 4" fill="none" stroke={CYAN} stroke-width="2.4" />
		{:else if id === 'decoy'}
			<rect x="18" y="18" width="18" height="32" rx="4" fill={OLIVE} />
			<rect x="21" y="12" width="12" height="6" rx="1.5" fill={STEEL} />
			<path d="M41 24q4 6 0 12M46 20q7 10 0 20M51 16q10 14 0 28" fill="none" stroke={MID} stroke-width="2.2" />
		{:else if id === 'stim'}
			<path d="M14 46l6-6" stroke={STEEL} stroke-width="3" />
			<rect x="19" y="20" width="12" height="28" rx="2" transform="rotate(45 25 34)" fill="#eef0f3" />
			<rect x="22" y="24" width="6" height="16" transform="rotate(45 25 34)" fill={RED} stroke="none" />
			<path d="M38 14l10 10M43 19l6-6" stroke-width="3" />
		{:else if id === 'screamer'}
			<ellipse cx="30" cy="40" rx="16" ry="7" fill={DARK} />
			<ellipse cx="30" cy="36" rx="16" ry="7" fill={MID} />
			<circle cx="30" cy="35" r="3.5" fill="#b07cff" />
			<path d="M20 22q10-8 20 0M15 16q15-12 30 0" fill="none" stroke="#b07cff" stroke-width="2.4" />
		{:else if id === 'portableRadar'}
			<path d="M18 52l9-16M36 52l-9-16" stroke-width="3" />
			<rect x="20" y="32" width="14" height="6" rx="2" fill={MID} />
			<path d="M10 30q4-20 26-22q-4 22-26 22z" fill={LIGHT} />
			<path d="M14 27q4-12 18-15" fill="none" stroke={STEEL} stroke-width="1.6" />
			<path d="M23 19l10-9" stroke-width="2" />
			<circle cx="34" cy="9" r="2.8" fill={RED} />
			<path d="M42 18q5 3 5 9M47 13q8 5 7 15" fill="none" stroke={GREEN} stroke-width="2.2" />
		{:else if id === 'ddos'}
			<rect x="12" y="18" width="36" height="26" rx="4" fill={DARK} />
			<path d="M17 25h8M17 31h14M17 37h6" stroke={RED} stroke-width="2.4" />
			<path d="M36 24l6 6-6 6" fill="none" stroke={RED} stroke-width="2.4" />
			<path d="M24 8l-3 8M36 8l3 8" stroke={RED} />
		{:else if id === 'munitions'}
			<rect x="10" y="22" width="40" height="28" rx="2" fill={OLIVE} />
			<rect x="10" y="22" width="40" height="8" fill="#4b5826" />
			<path d="M22 14v9M30 12v11M38 14v9" stroke={AMBER} stroke-width="4" />
			<text x="30" y="44" text-anchor="middle" font-size="10" font-weight="800" fill={AMBER} stroke="none">AMMO</text>
		{:else if id === 'samTurret'}
			<path d="M20 52l10-14 10 14" stroke-width="3" fill="none" />
			<rect x="14" y="20" width="32" height="18" rx="3" fill={MID} transform="rotate(-18 30 29)" />
			<g fill={RED}>
				<circle cx="22" cy="28" r="3" /><circle cx="30" cy="25.5" r="3" /><circle cx="38" cy="23" r="3" />
			</g>
		{:else if id === 'riotShield'}
			<path d="M14 8h32v30q0 12-16 16-16-4-16-16z" fill={DARK} />
			<rect x="21" y="14" width="18" height="8" rx="2" fill={CYAN} />
			<path d="M20 30h20" stroke={STEEL} stroke-width="2.4" />
		{:else if id === 'trophy'}
			<path d="M18 52l12-16 12 16M30 36v16" stroke-width="2.6" fill="none" />
			<path d="M16 34q0-18 14-18t14 18z" fill={LIGHT} />
			<circle cx="30" cy="26" r="4" fill={RED} />
			<path d="M10 14l5 4M50 14l-5 4M30 4v6" stroke={CYAN} stroke-width="2.2" />
		{:else if id === 'seekerDrone'}
			<path d="M10 22h14M36 22h14" stroke-width="3" />
			<ellipse cx="17" cy="19" rx="8" ry="2.5" fill={STEEL} />
			<ellipse cx="43" cy="19" rx="8" ry="2.5" fill={STEEL} />
			<path d="M22 22h16l-3 18h-10z" fill={MID} />
			<circle cx="30" cy="31" r="4" fill={RED} />
			<path d="M30 44v8" stroke={RED} stroke-dasharray="2 2" />
		{:else if id === 'inflatableDecoy'}
			<circle cx="30" cy="14" r="7" fill={OLIVE} />
			<path d="M18 24h24l-2 16h-4v12h-12V40h-4z" fill={OLIVE} />
			<path d="M24 30q6 3 12 0" fill="none" stroke="#4b5826" />
			<path d="M46 12q4 2 2 6" fill="none" stroke={STEEL} />
		{:else if id === 'smokeWall'}
			<g fill="#eef0f3">
				<circle cx="12" cy="36" r="8" /><circle cx="24" cy="30" r="10" /><circle cx="38" cy="32" r="9" /><circle cx="49" cy="37" r="7" />
				<circle cx="18" cy="22" r="7" /><circle cx="33" cy="18" r="8" /><circle cx="45" cy="24" r="6" />
			</g>
			<rect x="8" y="44" width="44" height="6" rx="2" fill={MID} />
		{:else if id === 'reconDrone'}
			<path d="M16 16l28 28M44 16L16 44" stroke-width="3" />
			<g fill={STEEL}>
				<circle cx="16" cy="16" r="6" /><circle cx="44" cy="16" r="6" /><circle cx="16" cy="44" r="6" /><circle cx="44" cy="44" r="6" />
			</g>
			<rect x="23" y="23" width="14" height="14" rx="3" fill={MID} />
			<circle cx="30" cy="30" r="3" fill={CYAN} />
		{:else if id === 'razorWire'}
			<g fill="none" stroke={STEEL} stroke-width="2.2">
				<ellipse cx="16" cy="36" rx="8" ry="11" /><ellipse cx="26" cy="36" rx="8" ry="11" /><ellipse cx="36" cy="36" rx="8" ry="11" /><ellipse cx="46" cy="36" rx="8" ry="11" />
			</g>
			<path d="M12 25l-2-3M24 25l-1-4M34 25l1-4M46 25l2-3" stroke={INK} />
			<path d="M6 50h48" stroke={MID} stroke-width="3" />
		{:else if id === 'tacInsert'}
			<path d="M30 20v28" stroke={DARK} stroke-width="8" />
			<rect x="25" y="44" width="10" height="8" rx="2" fill={STEEL} />
			<circle cx="30" cy="16" r="8" fill={RED} stroke="none" opacity="0.4" />
			<circle cx="30" cy="16" r="4.5" fill={RED} />
			<path d="M20 8l3 3M40 8l-3 3M30 3v4" stroke={RED} />
		{:else if id === 'uav'}
			<path d="M8 30h44" stroke-width="3" />
			<path d="M22 22h18q6 0 6 6v2H18z" fill={LIGHT} />
			<path d="M24 30l-4 14M36 30l4 14" stroke-width="2.4" />
			<path d="M10 16l6 6M50 16l-6 6" stroke={STEEL} />
			<circle cx="30" cy="38" r="3" fill={RED} />
		{:else if id === 'counterUav'}
			<rect x="22" y="30" width="16" height="20" rx="2" fill={MID} />
			<path d="M30 30V12" stroke-width="3" />
			<path d="M18 18q12-10 24 0M14 12q16-12 32 0" fill="none" stroke={RED} stroke-width="2.2" />
			<path d="M24 36l12 8M36 36l-12 8" stroke={RED} stroke-width="2" />
		{:else if id === 'missileSalvo'}
			<path d="M8 52h44" stroke-width="3" />
			{#each [16, 30, 44] as x, i (x)}
				<path d="M{x - 4} {44 - i * 3}V{20 - i * 3}l4-9 4 9V{44 - i * 3}z" fill={LIGHT} />
				<path d="M{x - 4} {44 - i * 3}l-3 5h14l-3-5" fill={RED} />
				<path d="M{x - 4} {24 - i * 3}h8" stroke={RED} stroke-width="2" />
			{/each}
		{:else if id === 'killChain'}
			<!-- three chain links -->
			<g fill="none" stroke-width="5">
				<rect x="6" y="22" width="20" height="14" rx="7" stroke={INK} />
				<rect x="20" y="22" width="20" height="14" rx="7" stroke={INK} />
				<rect x="34" y="22" width="20" height="14" rx="7" stroke={INK} />
			</g>
			<g fill="none" stroke-width="2.6">
				<rect x="6" y="22" width="20" height="14" rx="7" stroke={LIGHT} />
				<rect x="20" y="22" width="20" height="14" rx="7" stroke={AMBER} />
				<rect x="34" y="22" width="20" height="14" rx="7" stroke={LIGHT} />
			</g>
		{:else if id === 'bloodRush'}
			<!-- a blood drop with a speed arrow -->
			<path d="M26 8q14 18 14 28a14 14 0 0 1-28 0q0-10 14-28z" fill={RED} />
			<path d="M20 34q0 6 5 8" fill="none" stroke="#ffb3a8" stroke-width="2.4" />
			<path d="M40 22h14M44 30h10M40 38h14" stroke={INK} stroke-width="2.6" />
		{:else if id === 'bombSquad'}
			<!-- a bomb with a shield -->
			<circle cx="24" cy="34" r="14" fill={DARK} />
			<path d="M32 22l5-6" stroke-width="3" />
			<path d="M37 16l3-3M40 18l3 0M38 12l1-3" stroke={AMBER} stroke-width="2" />
			<path d="M34 30h18v10q0 8-9 12-9-4-9-12z" fill={CYAN} />
			<path d="M39 40l3 3 6-6" fill="none" stroke-width="2.4" />
		{:else if id === 'fastHands'}
			<!-- a hand with motion lines -->
			<path d="M24 50q-10 0-10-12V26q0-3 3-3t3 3v8V14q0-3 3-3t3 3v18V12q0-3 3-3t3 3v20V16q0-3 3-3t3 3v24q0 10-10 10z" fill="#f2c9a0" />
			<path d="M44 18h10M46 26h8M44 34h10" stroke={INK} stroke-width="2.6" />
		{:else if id === 'ninja'}
			<!-- a masked face with quiet footsteps -->
			<circle cx="30" cy="26" r="16" fill={DARK} />
			<rect x="15" y="21" width="30" height="9" rx="4" fill="#f2c9a0" />
			<path d="M20 25.5h7M33 25.5h7" stroke-width="2.6" />
			<path d="M44 14l8-4" stroke={RED} stroke-width="3" />
			<ellipse cx="20" cy="50" rx="4" ry="2.6" fill={MID} />
			<ellipse cx="34" cy="53" rx="4" ry="2.6" fill={MID} />
		{:else if id === 'battleHardened'}
			<!-- a cracked shield with a star -->
			<path d="M30 6l20 7v14q0 16-20 26-20-10-20-26V13z" fill={STEEL} />
			<path d="M30 12l14 5v10q0 11-14 19-14-8-14-19V17z" fill={LIGHT} stroke-width="1.6" />
			<path d="M30 18l3 7h7l-5.5 4.5 2 7L30 32l-6.5 4.5 2-7L20 25h7z" fill={AMBER} stroke-width="1.6" />
		{:else}
			<!-- not drawn yet: a plain box -->
			<rect x="16" y="16" width="28" height="28" rx="4" fill={STEEL} />
		{/if}
	</g>
	{#if banned}
		<path d="M10 50L50 10" stroke="#e11d2a" stroke-width="5" stroke-linecap="round" />
	{/if}
</svg>

<style>
	.gear-icon {
		display: block;
		flex: none;
	}
	.banned .art {
		filter: grayscale(1);
		opacity: 0.55;
	}
	.banned rect:first-child {
		filter: grayscale(0.85);
	}
</style>
