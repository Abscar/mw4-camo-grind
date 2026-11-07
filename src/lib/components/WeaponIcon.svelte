<!--
	A miniature cartoon of one weapon (thick dark outline, flat colours, a highlight), built from
	parts described in weaponLooks.ts. Muzzle points right. Decorative: the name is next to it.
	The CS2 easter eggs are drawn by Cs2Gun.svelte in the same style.
-->
<script lang="ts">
	import type { GunLook } from '#lib/data/weaponLooks.ts';
	import Cs2Gun from './Cs2Gun.svelte';

	let { look }: { look: GunLook } = $props();

	const INK = '#14110d';
	const DARK = '#23262b';
	const STEEL = '#3a3f46';

	// rifle geometry (viewBox 0 0 64 24)
	const r = $derived(look.kind === 'rifle' ? look : null);
	const gs = $derived(r?.bullpup ? 34 : 36); // where the handguard starts
	const gl = $derived(r ? 8 + 4 * r.barrel : 0); // handguard length
	const ge = $derived(gs + gl); // handguard end
	const bl = $derived(r ? (r.muzzle === 'can' ? 1 + 3 * r.barrel : 2 + 5 * r.barrel) : 0); // barrel length
	const be = $derived(ge + bl); // barrel end
	const gripX = $derived(r?.bullpup ? 29 : 25); // grip and magazine positions
	const magX = $derived(r?.bullpup ? 12 : 32.5);
</script>

<svg viewBox="0 0 64 24" class="weapon-icon" aria-hidden="true" focusable="false">
	{#if look.kind === 'cs2'}
		<Cs2Gun model={look.model} skin={look.skin} />
	{:else}
		<g stroke={INK} stroke-width="0.8" stroke-linejoin="round" stroke-linecap="round">
			{#if r}
				<!-- stock -->
				{#if r.bullpup}
					<rect x="5" y="8" width="3" height="8.5" rx="1" fill={DARK} />
				{:else if r.stock === 'fixed'}
					<path d="M18 9 L6 9.6 L5 16.2 L9.2 16.2 L18 13.6 Z" fill={r.furniture} />
				{:else if r.stock === 'skeleton'}
					<path
						d="M18 9 L6 9.5 L5.5 16 L9.5 16 L18 13.5 Z M15 10.6 L8 10.9 L7.8 14.2 L9.4 14.2 L15 12.6 Z"
						fill={r.furniture}
						fill-rule="evenodd"
					/>
				{:else if r.stock === 'wood'}
					<path d="M18 9 C12 9.2 6 9.6 2 10.4 L2 16.8 C6 16.1 11 14.9 18 13.7 Z" fill={r.furniture} />
				{:else}
					<rect x="15" y="9" width="3" height="4" rx="0.6" fill={DARK} />
				{/if}

				<!-- receiver -->
				{#if r.bullpup}
					<rect x="7.5" y="8" width="27" height="7.5" rx="2" fill={r.body} />
				{:else}
					<rect x="17" y="8" width="19.5" height="6" rx="1.5" fill={r.body} />
				{/if}

				<!-- carry handle (Type 73) -->
				{#if r.carry}
					<path d="M21 8 L22 5 L31 5 L32 8" fill="none" stroke={INK} stroke-width="1.6" />
				{/if}

				<!-- handguard -->
				{#if r.guard === 'rail'}
					<rect x={gs} y="8.5" width={gl} height="5" rx="0.8" fill={r.body} />
					{#each Array.from({ length: Math.floor(gl / 3) }, (_, i) => gs + 2 + i * 3) as x (x)}
						<line x1={x} y1="9.4" x2={x} y2="12.6" stroke="rgb(0 0 0 / 0.45)" stroke-width="0.6" />
					{/each}
				{:else if r.guard === 'wood'}
					<rect x={gs} y="9" width={gl} height="4.2" rx="1.6" fill={r.furniture} />
				{:else if r.guard === 'shroud'}
					<rect x={gs} y="9" width={gl} height="4" rx="1" fill={r.body} />
					{#each Array.from({ length: Math.floor(gl / 2.6) }, (_, i) => gs + 1.6 + i * 2.6) as x (x)}
						<circle cx={x} cy="11" r="0.6" fill={INK} stroke="none" />
					{/each}
				{:else}
					<rect x={gs} y="9.4" width={gl} height="3.6" rx="1" fill={r.body} />
				{/if}

				<!-- barrel + muzzle -->
				<rect x={ge} y="10.2" width={bl} height="1.6" fill={STEEL} />
				{#if r.muzzle === 'brake'}
					<rect x={be} y="9.5" width="2.6" height="3" rx="0.5" fill={DARK} />
				{:else if r.muzzle === 'can'}
					<rect x={be} y="9.3" width="8" height="3.4" rx="1.2" fill={DARK} />
				{:else if r.muzzle === 'cone'}
					<path d="M{be} 10.2 L{be + 2.6} 9.4 L{be + 2.6} 12.6 L{be} 11.8 Z" fill={DARK} />
				{/if}

				<!-- under-barrel bits -->
				{#if r.mag === 'tube'}
					<rect x={gs + 1} y="13" width={gl + bl - 3} height="1.8" rx="0.8" fill={STEEL} />
				{/if}
				{#if r.pump}
					<rect x={gs + 2} y="12.6" width="8" height="2.8" rx="1" fill={r.furniture} />
				{/if}
				{#if r.bipod}
					<path d="M{ge - 1.5} 13 L{ge - 4.5} 21.5 M{ge - 1.5} 13 L{ge + 1.5} 21.5" fill="none" stroke={INK} stroke-width="1.1" />
				{/if}

				<!-- grip -->
				{#if r.mag === 'grip'}
					<path d="M{gripX + 1} 14 L{gripX - 1} 21.8 L{gripX + 2.8} 21.8 L{gripX + 4.6} 14 Z" fill={r.furniture} />
					<rect x={gripX - 1.4} y="21.2" width="4.6" height="1.4" rx="0.4" fill={DARK} />
				{:else}
					<path d="M{gripX + 1} 14 L{gripX - 0.8} 20.5 L{gripX + 2.6} 20.5 L{gripX + 4.4} 14 Z" fill={r.furniture} />
				{/if}
				<path d="M{gripX + 4.4} 14 Q{gripX + 4.9} 17 {gripX + 7.4} 17 L{gripX + 7.4} 14" fill="none" stroke={INK} stroke-width="0.9" />

				<!-- magazine -->
				{#if r.mag === 'straight'}
					<path d="M{magX + 0.6} 14 L{magX} 20.6 L{magX + 3.4} 20.6 L{magX + 4} 14 Z" fill={DARK} />
				{:else if r.mag === 'curved'}
					<path d="M{magX + 0.5} 14 C{magX + 0.5} 18 {magX + 1.5} 20.4 {magX + 3.6} 22 L{magX + 6.6} 20.6 C{magX + 5} 19 {magX + 4.2} 17 {magX + 4.2} 14 Z" fill={r.furniture === '#9a5f2e' ? '#b8742f' : DARK} />
				{:else if r.mag === 'drum'}
					<circle cx={magX + 2.2} cy="17.6" r="4" fill={DARK} />
					<circle cx={magX + 2.2} cy="17.6" r="1.4" fill={STEEL} />
				{:else if r.mag === 'box'}
					<rect x={magX - 1.5} y="14" width="7.5" height="5.6" rx="0.8" fill={r.furniture} />
				{/if}

				<!-- bolt handle -->
				{#if r.bolt}
					<path d="M21 13 L20 15.6" fill="none" stroke={INK} stroke-width="1" />
					<circle cx="19.8" cy="16" r="1.1" fill={STEEL} />
				{/if}

				<!-- sights / optics -->
				{#if r.optic === 'irons'}
					<rect x={ge - 1.8} y="7" width="1.2" height="2" fill={DARK} />
					<rect x={r.bullpup ? 10 : 19.5} y="6.6" width="1.8" height="1.6" fill={DARK} />
				{:else if r.optic === 'red'}
					<rect x="22.5" y="4.6" width="7" height="3.4" rx="0.9" fill={DARK} />
					<circle cx="28.6" cy="6.3" r="0.8" fill="#ff4a4a" stroke="none" />
				{:else if r.optic === 'scope'}
					<rect x="20" y="4.6" width="13" height="2.4" rx="1.1" fill={DARK} />
					<rect x="18.4" y="3.9" width="3" height="3.8" rx="0.9" fill={DARK} />
					<rect x="31.4" y="3.6" width="3.4" height="4.4" rx="0.9" fill={DARK} />
					<rect x="23" y="7" width="1.4" height="1.1" fill={DARK} />
					<rect x="29" y="7" width="1.4" height="1.1" fill={DARK} />
				{:else if r.optic === 'big'}
					<rect x="17.5" y="4.2" width="17" height="2.8" rx="1.3" fill={DARK} />
					<rect x="15.8" y="3.3" width="3.4" height="4.6" rx="1" fill={DARK} />
					<rect x="32.6" y="2.6" width="4.2" height="6" rx="1" fill={DARK} />
					<circle cx="35.6" cy="5.6" r="1" fill="#7fc4ff" stroke="none" />
					<rect x="22" y="7" width="1.4" height="1.1" fill={DARK} />
					<rect x="29" y="7" width="1.4" height="1.1" fill={DARK} />
				{/if}

				<!-- cartoon highlight on top of the receiver -->
				<line
					x1={r.bullpup ? 9.5 : 18.5}
					y1="9.1"
					x2={r.bullpup ? 32.5 : 34.5}
					y2="9.1"
					stroke="#fff"
					stroke-opacity="0.35"
					stroke-width="0.8"
				/>
			{:else if look.kind === 'pistol'}
				{#if look.style === 'revolver'}
					<rect x="30" y="7.4" width="17" height="3" rx="0.6" fill={look.body} />
					<rect x="30" y="10.4" width="13" height="2" rx="0.6" fill={look.body} />
					<rect x="20" y="6.5" width="11" height="8.5" rx="1.5" fill={look.body} />
					<rect x="22.5" y="7.2" width="7.5" height="6.8" rx="2" fill={STEEL} />
					<path d="M24.5 7.6 V13.6 M27.5 7.6 V13.6" stroke={INK} stroke-width="0.5" />
					<path d="M20 7 L18 4.6 L20.6 5" fill={DARK} />
					<path d="M21.5 14 C19.5 17 18.5 20 19.2 22.6 L24.8 22.6 C24.6 19.4 25.2 16.6 27 14.6 Z" fill={look.grip} />
					<path d="M27 15 Q27.5 18 30.5 17.6 L31 15" fill="none" stroke={INK} stroke-width="0.9" />
				{:else}
					{@const big = look.style === 'deagle'}
					<rect x="17" y={big ? 5.2 : 6} width={big ? 29 : 26} height={big ? 6.8 : 5.6} rx="1.2" fill={look.body} />
					{#if big}
						<rect x="36" y="4.4" width="9" height="1.2" fill={look.body} />
					{/if}
					<rect x="20.5" y="11.6" width={big ? 21 : 19} height="2.4" fill={DARK} />
					<path d="M22.5 13.8 L19.5 22.4 L26 22.4 L28.4 13.8 Z" fill={look.grip} />
					<path d="M28.4 14 Q28.9 17.6 32.6 17.2 L33.4 14" fill="none" stroke={INK} stroke-width="0.9" />
					<path d="M19 7.4 V10.8 M20.4 7.4 V10.8 M21.8 7.4 V10.8" stroke={INK} stroke-width="0.5" />
					<rect x={big ? 43.5 : 40.5} y={big ? 4.4 : 5.2} width="1.2" height="1" fill={DARK} />
				{/if}
				<line x1="18.5" y1="6.9" x2="40" y2="6.9" stroke="#fff" stroke-opacity="0.4" stroke-width="0.8" />
			{:else if look.kind === 'launcher'}
				{#if look.style === 'rpg'}
					<rect x="6" y="9.6" width="40" height="4" rx="1" fill={look.body} />
					<rect x="16" y="9.1" width="10" height="5" rx="1.2" fill="#9a5f2e" />
					<path d="M46 8.6 L52 6.6 L60.5 11.6 L52 16.6 L46 14.6 Z" fill="#5d6a3e" />
					<path d="M24 13.6 L22.5 19.5 L25.5 19.5 L27 13.6 Z M31 13.6 L29.5 18.5 L32.5 18.5 L34 13.6 Z" fill={DARK} />
					<rect x="21" y="6" width="4" height="3.6" rx="0.6" fill={DARK} />
				{:else if look.style === 'javelin'}
					<rect x="4" y="8" width="54" height="7" rx="3.5" fill={look.body} />
					<rect x="14" y="2.6" width="13" height="6" rx="1" fill={DARK} />
					<circle cx="25" cy="5.6" r="1.3" fill="#7fc4ff" stroke="none" />
					<path d="M19 15 L18 19.5 L21 19.5 L22 15 Z" fill={DARK} />
					<path d="M8 8 V15 M54 8 V15" stroke={INK} stroke-width="0.6" />
				{:else if look.style === 'manpads'}
					<rect x="4" y="9" width="52" height="5" rx="2.5" fill={look.body} />
					<rect x="26" y="3.4" width="9" height="5.6" rx="1" fill={DARK} />
					<circle cx="34" cy="6.2" r="1.1" fill="#ff4a4a" stroke="none" />
					<path d="M21 14 L19.6 20 L22.6 20 L24 14 Z" fill={DARK} />
					<rect x="13" y="14" width="5" height="4.4" rx="1" fill={STEEL} />
				{:else}
					<path d="M18 10 L6 10.4 L5.5 15.6 L9 15.6 L18 13.4 Z M15 11.4 L8 11.6 L7.9 14.2 L9.3 14.2 L15 12.8 Z" fill={DARK} fill-rule="evenodd" />
					<rect x="17" y="8.4" width="14" height="6" rx="1.4" fill={look.body} />
					<rect x="30" y="7" width="26" height="6" rx="2.6" fill={look.body} />
					<circle cx="56" cy="10" r="2.2" fill={INK} />
					<rect x="34" y="12.6" width="11" height="3.2" rx="1.2" fill={STEEL} />
					<path d="M24 14.4 L22.4 20.5 L25.6 20.5 L27.2 14.4 Z" fill={DARK} />
				{/if}
				<line x1="8" y1="10.4" x2="44" y2="10.4" stroke="#fff" stroke-opacity="0.3" stroke-width="0.8" />
			{:else if look.kind === 'melee'}
				{#if look.style === 'knife'}
					<rect x="6" y="10.4" width="16" height="4.2" rx="1.8" fill={look.handle} />
					<path d="M9 10.6 V14.4 M12 10.6 V14.4 M15 10.6 V14.4 M18 10.6 V14.4" stroke={INK} stroke-width="0.5" />
					<rect x="21.5" y="8.4" width="2.2" height="8.2" rx="0.6" fill={DARK} />
					<path d="M23.7 10 L49 10 Q55 11 59 12.6 Q52 14.9 23.7 14.8 Z" fill={look.body} />
					<path d="M25 13.6 L50 13.6" stroke="#fff" stroke-opacity="0.6" stroke-width="0.6" />
				{:else}
					<path d="M10 21.4 L44 6.4 L45.6 9 L11.8 23 Z" fill={look.handle} />
					<path d="M37.5 4.2 L50 2.4 Q54 7.4 51 12.6 L42 10.4 Z" fill={look.body} />
					<path d="M37.6 5.4 L31 4 L37 9.4 Z" fill={look.body} />
					<path d="M49.8 3.4 Q52.6 7.4 50.4 11.4" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="0.6" />
				{/if}
			{/if}
		</g>
	{/if}
</svg>
