<!--
	A hideout's room (hideout.ts), our own cartoon: the room style's walls, floor and window view, the furniture
	in each spot, the neon sign's words, the display wall with the owner's guns / skins / clothes (HTML on top),
	and whoever is here standing on the floor (HangOp). Decoration: everything is also said in words around it.
-->
<script lang="ts">
	import { ROOM_BY_ID, showSlots, type Hideout } from '#lib/hideout.ts';
	import { pingOn, sayOn } from '#lib/hangout.ts';
	import { hangout } from '#lib/hangout.svelte.ts';
	import { t } from '#lib/i18n/en.ts';
	import type { SquadOp } from '#lib/squad-codec.ts';
	import ShowItem from './ShowItem.svelte';
	import HangOp from './HangOp.svelte';

	let {
		ho,
		owned,
		people = [],
		preview = null
	}: {
		ho: Hideout;
		/** The owner's shop items (only owned things go on the wall). */
		owned: (id: string) => boolean;
		people?: { id: string; name: string; op?: SquadOp; me?: boolean }[];
		/** Try a room style / piece of furniture before buying it. */
		preview?: { th?: string; id?: string; spot?: string } | null;
	} = $props();
	const uid = $props.id();
	const room = $derived(ROOM_BY_ID.get(preview?.th ?? ho.th) ?? ROOM_BY_ID.get('den')!);
	const sp = $derived(preview?.id && preview.spot ? { ...ho.sp, [preview.spot]: preview.id } : ho.sp);
	const [wTop, wBot, fNear, fFar, trim, light] = $derived(room.c);
	const wall = $derived(ho.show.filter(owned).slice(0, showSlots({ ...ho, sp })));
	const slots = $derived(showSlots({ ...ho, sp }));
	const sign = $derived(ho.sign || 'HIDEOUT');
	const h = t.hang;
	/** Operators grow with the room (about a sixth of its height). */
	let width = $state(640);
	const opSize = $derived(Math.round(Math.max(40, Math.min(120, width * 0.095))));
</script>

<div class="scene" data-room={room.id} bind:clientWidth={width}>
	<svg class="room" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
		<defs>
			<linearGradient id="{uid}-w" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color={wTop} /><stop offset="1" stop-color={wBot} /></linearGradient>
			<linearGradient id="{uid}-f" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color={fFar} /><stop offset="1" stop-color={fNear} /></linearGradient>
			<radialGradient id="{uid}-l" cx="0.5" cy="0.15" r="0.7"><stop offset="0" stop-color={light} stop-opacity="0.35" /><stop offset="1" stop-color={light} stop-opacity="0" /></radialGradient>
			<linearGradient id="{uid}-gold" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff2a8" /><stop offset="0.45" stop-color="#e8b52a" /><stop offset="1" stop-color="#8a5a10" /></linearGradient>
			<clipPath id="{uid}-win"><rect x="36" y="36" width="140" height="104" rx="6" /></clipPath>
		</defs>
		<!-- walls + floor -->
		<rect width="640" height="230" fill="url(#{uid}-w)" />
		{#if room.id === 'den' || room.id === 'saloon'}{#each Array.from({ length: 16 }, (_, i) => i) as i (i)}<rect x={i * 40} y="0" width="2" height="230" fill="#000" opacity="0.12" />{/each}{/if}
		{#if room.id === 'bunker'}{#each Array.from({ length: 6 }, (_, i) => i) as i (i)}<rect x="0" y={i * 38} width="640" height="2" fill="#000" opacity="0.2" />{/each}{/if}
		{#if room.id === 'vault'}{#each Array.from({ length: 9 }, (_, i) => i) as i (i)}<circle cx={36 + i * 72} cy="210" r="5" fill="url(#{uid}-gold)" />{/each}{/if}
		{#if room.id === 'neon'}<rect y="196" width="640" height="3" fill={trim} opacity="0.9" /><rect y="196" width="640" height="10" fill={trim} opacity="0.2" />{/if}
		<path d="M0 230 H640 V360 H0Z" fill="url(#{uid}-f)" />
		{#each Array.from({ length: 9 }, (_, i) => i) as i (i)}<path d="M{320 + (i - 4) * 40} 230 L{320 + (i - 4) * 150} 360" stroke="#000" stroke-opacity="0.13" stroke-width="2" />{/each}
		<rect y="226" width="640" height="6" fill={trim} opacity="0.7" />
		<rect width="640" height="360" fill="url(#{uid}-l)" />

		<!-- window -->
		{#if room.view !== 'none'}
			<g clip-path="url(#{uid}-win)">
				{#if room.view === 'city'}
					<rect x="36" y="36" width="140" height="104" fill="#0d1840" />
					{#each [[44, 80, 18], [64, 60, 22], [90, 74, 16], [108, 54, 24], [134, 70, 18], [154, 62, 20]] as [x, y, w] (x)}<rect {x} {y} width={w} height={140 - y} fill="#1a2350" />{#each [0, 1, 2, 3, 4] as k (k)}<rect x={x + 4} y={y + 6 + k * 12} width="4" height="4" fill="#ffd86b" opacity={(x + k) % 3 ? 0.9 : 0.25} />{/each}{/each}
					<circle cx="150" cy="50" r="7" fill="#fff4c8" />
				{:else if room.view === 'jungle'}
					<rect x="36" y="36" width="140" height="104" fill="#2d6b3a" />
					{#each [50, 80, 112, 146] as x (x)}<path d="M{x} 140 Q{x - 14} 90 {x} 60 Q{x + 14} 90 {x} 140" fill="#3fa04f" /><path d="M{x} 70 l-18 14 M{x} 80 l18 12" stroke="#7fdc6a" stroke-width="5" stroke-linecap="round" />{/each}
				{:else if room.view === 'sea'}
					<rect x="36" y="36" width="140" height="64" fill="#7fd8ff" /><rect x="36" y="96" width="140" height="44" fill="#1f8fc9" />
					<circle cx="146" cy="60" r="12" fill="#fff1a0" /><path d="M40 104 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#fff" stroke-width="2" fill="none" opacity="0.7" />
				{:else if room.view === 'stars'}
					<rect x="36" y="36" width="140" height="104" fill="#05061a" />
					{#each Array.from({ length: 22 }, (_, i) => i) as i (i)}<circle class="twinkle" style:--d="{(i % 7) * 0.4}s" cx={40 + ((i * 53) % 132)} cy={40 + ((i * 37) % 96)} r={i % 4 ? 1 : 1.8} fill="#fff" />{/each}
					<circle cx="130" cy="104" r="22" fill="#5a6bd6" /><path d="M104 104 q26 -8 52 0" stroke="#c9d1ff" stroke-width="3" fill="none" />
				{:else if room.view === 'vault'}
					<rect x="36" y="36" width="140" height="104" fill="#4a3a0c" />
					<circle cx="106" cy="88" r="40" fill="url(#{uid}-gold)" stroke="#5a4210" stroke-width="4" />
					{#each [0, 60, 120, 180, 240, 300] as a (a)}<rect x="104" y="52" width="4" height="18" fill="#5a4210" transform="rotate({a} 106 88)" />{/each}
					<circle cx="106" cy="88" r="10" fill="#5a4210" />
				{:else if room.view === 'desert'}
					<rect x="36" y="36" width="140" height="70" fill="#ffb36b" /><rect x="36" y="104" width="140" height="36" fill="#d9883e" />
					<circle cx="106" cy="98" r="18" fill="#ff6a2a" /><path d="M60 140 v-26 m0 10 h-8 v-8 m8 4 h8 v-10" stroke="#3c7a3c" stroke-width="5" fill="none" stroke-linecap="round" />
				{/if}
			</g>
			<rect x="36" y="36" width="140" height="104" rx="6" fill="none" stroke={trim} stroke-width="6" />
			<path d="M106 36 V140 M36 88 H176" stroke={trim} stroke-width="3" />
		{:else}
			<!-- the bunker's map board -->
			<rect x="40" y="40" width="132" height="96" rx="4" fill="#c9b98a" stroke="#5a5030" stroke-width="4" />
			<path d="M54 60 l30 18 l26 -10 l34 24 M64 112 l40 -12" stroke="#a03020" stroke-width="2" fill="none" stroke-dasharray="5 4" />
			<circle cx="144" cy="92" r="6" fill="none" stroke="#a03020" stroke-width="2" />
		{/if}

		<!-- on the wall -->
		{#if sp.wall === 'wall-poster'}
			<rect x="270" y="36" width="96" height="120" fill="#1a1020" stroke="#fff" stroke-width="3" transform="rotate(-2 318 96)" />
			<g transform="rotate(-2 318 96)"><circle cx="318" cy="84" r="24" fill="#c08a4a" /><circle cx="310" cy="80" r="4" fill="#ff2a2a" /><circle cx="326" cy="80" r="4" fill="#ff2a2a" /><text x="318" y="138" text-anchor="middle" font-size="15" font-weight="900" fill="#ffd23a" font-family="Impact, sans-serif">SQUAD</text></g>
		{:else if sp.wall === 'wall-neon'}
			<rect x="236" y="54" width="170" height="66" rx="12" fill="#12040f" stroke="#ff3fd8" stroke-width="3" />
			<text class="neon" x="321" y="98" text-anchor="middle" font-size={sign.length > 12 ? 17 : 24} font-weight="900" fill="#ffe6ff" stroke="#ff3fd8" stroke-width="1" font-family="'Segoe Script', 'Brush Script MT', cursive">{sign}</text>
		{:else if sp.wall === 'wall-tv'}
			<rect x="226" y="38" width="190" height="112" rx="6" fill="#0a0a0a" stroke="#333" stroke-width="5" />
			<rect class="tv" x="234" y="46" width="174" height="96" fill="#1d4f9a" />
			<path d="M240 130 l40 -40 l30 22 l46 -50 l46 60" stroke="#ffd23a" stroke-width="5" fill="none" />
			<rect x="300" y="150" width="42" height="8" fill="#222" />
		{:else if sp.wall === 'wall-aquarium'}
			<rect x="226" y="38" width="190" height="112" rx="8" fill="#1d7fc0" stroke="#9adfff" stroke-width="5" />
			<rect x="230" y="128" width="182" height="18" fill="#d9c27a" />
			{#each [[262, 80, '#ff8a2a'], [326, 66, '#ffd23a'], [372, 100, '#ff3f6a']] as [x, y, c], i (i)}<g class="fish" style:--d="{i * 1.3}s"><ellipse cx={x} cy={y} rx="14" ry="8" fill={String(c)} /><path d="M{+x + 13} {y} l10 -7 v14z" fill={String(c)} /><circle cx={+x - 6} cy={+y - 2} r="2" fill="#000" /></g>{/each}
			<path d="M250 146 q4 -26 -4 -46 M396 146 q6 -30 0 -50" stroke="#2fa04a" stroke-width="5" fill="none" />
		{/if}

		<!-- display stand frame (the things are HTML on top) -->
		{#if sp.display === 'display-case'}
			<rect x="452" y="26" width="172" height="176" rx="6" fill="#ffffff" fill-opacity="0.08" stroke="url(#{uid}-gold)" stroke-width="5" />
			<path d="M452 86 H624 M452 144 H624" stroke="url(#{uid}-gold)" stroke-width="3" />
		{:else if sp.display === 'display-rack'}
			<rect x="452" y="34" width="172" height="150" rx="4" fill="#5a3a20" stroke="#2a1a0c" stroke-width="4" />
			<path d="M452 72 H624 M452 110 H624 M452 148 H624" stroke="#2a1a0c" stroke-width="3" />
		{:else}
			<rect x="470" y="40" width="136" height="70" rx="4" fill="#000" fill-opacity="0.2" stroke={trim} stroke-width="3" />
		{/if}

		<!-- rug -->
		{#if sp.rug === 'rug-leaf'}
			<ellipse cx="320" cy="300" rx="150" ry="36" fill="#2f7a2f" stroke="#1d4f1d" stroke-width="4" />
			<path d="M320 284 l-14 18 l14 -4 l14 4z M320 284 v26" fill="#7fdc4a" stroke="#7fdc4a" stroke-width="3" />
		{:else if sp.rug === 'rug-tiger'}
			<path d="M190 300 q20 -30 130 -32 q110 2 130 32 q-20 26 -130 28 q-110 -2 -130 -28z" fill="#f29a2a" stroke="#7a4210" stroke-width="3" />
			{#each [220, 260, 300, 340, 380, 420] as x (x)}<path d="M{x} 280 q6 20 -2 40" stroke="#2a1404" stroke-width="5" fill="none" />{/each}
		{:else if sp.rug === 'rug-gold'}
			<rect x="170" y="270" width="300" height="64" rx="6" fill="#a8121e" stroke="url(#{uid}-gold)" stroke-width="6" />
			<rect x="186" y="280" width="268" height="44" rx="4" fill="none" stroke="url(#{uid}-gold)" stroke-width="2" />
		{/if}

		<!-- seating -->
		{#if sp.couch === 'couch-old'}
			<rect x="66" y="196" width="190" height="56" rx="14" fill="#7a5a3a" /><rect x="60" y="226" width="202" height="42" rx="12" fill="#8f6a44" />
			<rect x="56" y="214" width="22" height="58" rx="8" fill="#6a4a2c" /><rect x="244" y="214" width="22" height="58" rx="8" fill="#6a4a2c" />
			<path d="M120 236 l10 8 M190 232 l-8 10" stroke="#4a3018" stroke-width="3" />
		{:else if sp.couch === 'couch-beanbag'}
			<path d="M70 268 q-6 -50 46 -56 q52 6 46 56z" fill="#ff3f6a" /><path d="M160 270 q-4 -46 46 -52 q50 6 44 52z" fill="#3fb0ff" />
		{:else if sp.couch === 'couch-leather'}
			<rect x="62" y="190" width="200" height="60" rx="10" fill="#2a1a12" /><rect x="56" y="226" width="212" height="44" rx="10" fill="#3a2418" />
			{#each [110, 160, 210] as x (x)}<circle cx={x} cy="214" r="2.5" fill="#1a0e08" />{/each}
			<rect x="50" y="210" width="24" height="62" rx="9" fill="#24150e" /><rect x="250" y="210" width="24" height="62" rx="9" fill="#24150e" />
		{:else if sp.couch === 'couch-gold'}
			<path d="M60 270 V200 q0 -30 30 -30 h144 q30 0 30 30 V270z" fill="url(#{uid}-gold)" stroke="#6a4208" stroke-width="3" />
			<rect x="74" y="216" width="176" height="48" rx="10" fill="#8a1020" /><rect x="84" y="186" width="156" height="34" rx="10" fill="#a8121e" />
			<circle cx="162" cy="172" r="9" fill="#ff2a5a" stroke="url(#{uid}-gold)" stroke-width="3" />
		{/if}

		<!-- lamp -->
		{#if sp.lamp === 'lamp-lava'}
			<path d="M286 270 l8 -60 h20 l8 60z" fill="#3a2a5a" /><path d="M294 210 q-2 -30 10 -46 q12 16 10 46z" fill="#ff5a2a" opacity="0.85" />
			<circle class="blob" cx="304" cy="196" r="5" fill="#ffd23a" /><circle class="blob b2" cx="302" cy="182" r="3.5" fill="#ffd23a" />
		{:else if sp.lamp === 'lamp-disco'}
			<path d="M320 0 V22" stroke="#999" stroke-width="2" />
			<g class="disco"><circle cx="320" cy="40" r="20" fill="#c9d1d9" />{#each Array.from({ length: 12 }, (_, i) => i) as i (i)}<rect x={306 + (i % 4) * 7} y={28 + Math.floor(i / 4) * 8} width="5" height="5" fill={['#fff', '#7ff', '#f7f', '#ff7'][i % 4]} />{/each}</g>
			<path class="beams" d="M320 40 L200 230 M320 40 L440 230 M320 40 L300 260" stroke="#fff" stroke-opacity="0.14" stroke-width="12" />
		{/if}

		<!-- bar -->
		{#if sp.bar === 'bar-fridge'}
			<rect x="520" y="200" width="70" height="86" rx="8" fill="#e8eef2" stroke="#9aa6ae" stroke-width="3" /><rect x="580" y="214" width="4" height="26" fill="#9aa6ae" />
			<circle cx="540" cy="226" r="7" fill="#ff3f3f" /><text x="555" y="270" font-size="11" font-weight="900" fill="#2a3a46" text-anchor="middle">COLD</text>
		{:else if sp.bar === 'bar-tiki'}
			<rect x="480" y="214" width="140" height="70" fill="#8a5a2a" /><path d="M470 214 h160 l-14 -34 h-132z" fill="#d9b04a" />
			{#each [490, 520, 550, 580, 610] as x (x)}<path d="M{x} 182 l-6 32" stroke="#a87a2a" stroke-width="3" />{/each}
			<path d="M510 206 v-16 h12 v16z M560 206 l-4 -18 h14 l-4 18z" fill="#ff7a3a" />
		{:else if sp.bar === 'bar-neon'}
			<rect x="476" y="210" width="148" height="76" rx="6" fill="#140a24" stroke="#5ff0ff" stroke-width="3" />
			<rect x="476" y="200" width="148" height="12" rx="4" fill="#2a1446" stroke="#ff3fd8" stroke-width="2" />
			<text class="neon" x="550" y="256" text-anchor="middle" font-size={sign.length > 10 ? 12 : 17} font-weight="900" fill="#e6ffff" stroke="#5ff0ff" stroke-width="0.8">{sign}</text>
			<path d="M500 198 v-14 h10 v14z M590 198 v-20 h8 v20z" fill="#7dffcf" opacity="0.8" />
		{/if}

		<!-- trophy -->
		{#if sp.trophy === 'trophy-cup'}
			<rect x="426" y="200" width="30" height="20" fill="#3a2a20" /><path d="M428 168 h26 q0 26 -13 30 q-13 -4 -13 -30z" fill="url(#{uid}-gold)" /><rect x="436" y="196" width="10" height="6" fill="url(#{uid}-gold)" />
		{:else if sp.trophy === 'trophy-statue'}
			<rect x="414" y="214" width="52" height="16" fill="#2a2a2a" /><g fill="url(#{uid}-gold)"><circle cx="440" cy="150" r="14" /><path d="M424 214 q-2 -40 16 -50 q18 10 16 50z" /><path d="M452 168 l14 -20" stroke="url(#{uid}-gold)" stroke-width="6" stroke-linecap="round" /></g>
			<circle cx="435" cy="148" r="2" fill="#ff2a2a" /><circle cx="445" cy="148" r="2" fill="#ff2a2a" />
		{/if}

		<!-- table -->
		{#if sp.table === 'table-cards'}
			<ellipse cx="320" cy="276" rx="96" ry="26" fill="#1d6b3a" stroke="#5a3a1a" stroke-width="7" /><path d="M260 296 v30 M380 296 v30" stroke="#5a3a1a" stroke-width="8" />
			<rect x="300" y="266" width="14" height="19" rx="2" fill="#fff" transform="rotate(-12 307 275)" /><rect x="318" y="264" width="14" height="19" rx="2" fill="#fff" transform="rotate(10 325 273)" />
		{:else if sp.table === 'table-pool'}
			<rect x="214" y="256" width="212" height="52" rx="8" fill="#1d7a3a" stroke="#6a3a14" stroke-width="9" /><path d="M234 308 v24 M406 308 v24" stroke="#4a2a0c" stroke-width="10" />
			{#each [[300, 276, '#ffd23a'], [314, 270, '#ff3f3f'], [314, 284, '#3f7fff'], [360, 278, '#fff']] as [x, y, c] (x + '' + y)}<circle cx={x} cy={y} r="5" fill={String(c)} />{/each}
		{:else if sp.table === 'table-poker'}
			<ellipse cx="320" cy="278" rx="110" ry="30" fill="#0f5a2a" stroke="#2a1408" stroke-width="10" /><ellipse cx="320" cy="278" rx="92" ry="22" fill="none" stroke="#ffd23a" stroke-width="1.5" opacity="0.6" />
			{#each [[290, 272, '#ff3f3f'], [300, 270, '#3f7fff'], [346, 274, '#111'], [356, 272, '#ffd23a']] as [x, y, c] (x)}<ellipse cx={x} cy={y} rx="7" ry="3" fill={String(c)} stroke="#fff" stroke-width="1" />{/each}
			<path d="M244 300 v26 M396 300 v26" stroke="#2a1408" stroke-width="10" />
		{/if}

		<!-- plant -->
		{#if sp.plant === 'plant-weed'}
			<path d="M14 330 l6 -40 h32 l6 40z" fill="#a0522d" />
			{#each [-50, -25, 0, 25, 50] as a (a)}<path d="M36 290 q-6 -34 0 -58 q6 24 0 58" fill="#3fa04f" transform="rotate({a} 36 290)" />{/each}
		{:else if sp.plant === 'plant-palm'}
			<path d="M14 330 l6 -40 h32 l6 40z" fill="#c98a4a" /><path d="M36 290 q-4 -60 4 -110" stroke="#7a5a2a" stroke-width="7" fill="none" />
			{#each [-70, -30, 20, 60] as a (a)}<path d="M40 182 q30 -10 56 14 q-30 -4 -56 -14" fill="#2f9a3f" transform="rotate({a} 40 182)" />{/each}
		{:else if sp.plant === 'plant-bonsai'}
			<rect x="8" y="300" width="60" height="22" rx="4" fill="#3a3a5a" /><path d="M38 300 q-8 -20 6 -30 q-14 -6 -4 -20" stroke="#5a3a1a" stroke-width="6" fill="none" />
			{#each [[22, 250], [44, 238], [58, 262], [30, 270]] as [x, y] (x)}<g transform="translate({x} {y}) scale(0.5)">{#each [-40, 0, 40] as a (a)}<path d="M0 0 q-6 -30 0 -48 q6 18 0 48" fill="#7fdc4a" transform="rotate({a})" />{/each}</g>{/each}
		{/if}

		<!-- corner -->
		{#if sp.corner === 'corner-arcade'}
			<path d="M570 330 V200 l14 -22 h46 l10 22 V330z" fill="#2a1a6a" stroke="#ff3fd8" stroke-width="3" /><rect x="584" y="200" width="44" height="34" fill="#5ff0ff" class="tv" />
			<circle cx="596" cy="252" r="5" fill="#ff3f3f" /><circle cx="614" cy="252" r="5" fill="#ffd23a" />
		{:else if sp.corner === 'corner-jukebox'}
			<path d="M568 330 V214 q0 -40 36 -40 q36 0 36 40 V330z" fill="#8a1a2a" stroke="url(#{uid}-gold)" stroke-width="4" />
			<path d="M582 214 q0 -24 22 -24 q22 0 22 24" fill="none" stroke="#ffd23a" stroke-width="3" class="tv" /><rect x="582" y="226" width="44" height="40" rx="4" fill="#ffd8a0" />
		{:else if sp.corner === 'corner-safe'}
			<rect x="566" y="238" width="70" height="90" rx="6" fill="#4a5058" stroke="#2a2e34" stroke-width="4" /><circle cx="600" cy="282" r="16" fill="#9aa6ae" stroke="#2a2e34" stroke-width="3" />
			<circle cx="600" cy="282" r="5" fill="#2a2e34" /><text x="600" y="256" text-anchor="middle" font-size="12">🍔</text>
		{/if}
	</svg>

	<!-- the display wall: the owner's best things -->
	<div class="wall" style:--n={slots} aria-label={t.hideout.show}>
		{#each Array.from({ length: slots }, (_, i) => i) as i (i)}
			<span class="wall-slot">{#if wall[i]}<ShowItem id={wall[i]} size={slots > 4 ? 44 : 50} />{/if}</span>
		{/each}
	</div>

	<!-- whoever is here -->
	<ul class="crowd" role="list" aria-label={t.hideout.visitors}>
		{#each people as p (p.id)}
			{@const here = hangout.doc?.here[p.id]}
			{@const ping = here ? pingOn(here, hangout.now) : null}
			{@const line = here ? sayOn(here, hangout.now) : null}
			<li class="crowd-op" class:me={p.me}>
				{#if ping}{#key ping.at}<span class="crowd-ping font-head">{h.won(ping.n.toLocaleString('en-US'))}</span>{/key}{/if}
				{#if line}{#key here?.say?.at}<span class="crowd-say font-head">{h.says[line]}</span>{/key}{/if}
				<HangOp id={p.id} name={p.name} op={p.op} size={opSize} />
				<span class="crowd-name font-head">{p.me ? h.you : p.name}</span>
			</li>
		{/each}
	</ul>
</div>

<style>
	.scene {
		position: relative;
		aspect-ratio: 16 / 9;
		width: 100%;
		min-height: 220px;
		overflow: hidden;
		border-radius: 14px;
		border: 2px solid rgb(255 201 40 / 0.6);
		box-shadow: inset 0 0 40px rgb(0 0 0 / 0.5);
		container-type: inline-size;
		max-width: 980px;
		margin-inline: auto;
	}
	.room {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.wall {
		position: absolute;
		left: 70.6%;
		top: 9%;
		width: 26.9%;
		height: 46%;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-auto-rows: 1fr;
		gap: 2px;
		place-items: center;
	}
	.wall-slot {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
	}
	.crowd {
		position: absolute;
		left: 12%;
		right: 12%;
		bottom: 3%;
		display: flex;
		justify-content: center;
		align-items: flex-end;
		gap: 2%;
	}
	.crowd-op {
		position: relative;
		display: grid;
		justify-items: center;
		filter: drop-shadow(0 6px 4px rgb(0 0 0 / 0.5));
	}
	.crowd-name {
		margin-top: -2px;
		padding: 1px 6px;
		border-radius: 6px;
		background: rgb(0 0 0 / 0.6);
		color: #fff;
		font-size: 11px;
		font-weight: 700;
		white-space: nowrap;
	}
	.crowd-op.me .crowd-name {
		color: #7dffcf;
	}
	.crowd-ping,
	.crowd-say {
		position: absolute;
		bottom: 100%;
		z-index: 2;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 900;
		white-space: nowrap;
		animation: pop 0.4s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	.crowd-ping {
		background: linear-gradient(180deg, #ffe066, #ffb400);
		color: #2a1400;
		box-shadow: 0 0 14px rgb(255 200 40 / 0.8);
	}
	.crowd-say {
		background: #fff;
		color: #1a0a18;
		border-radius: 10px 10px 10px 2px;
	}
	@keyframes pop {
		from {
			transform: scale(0.2);
		}
	}
	@container (max-width: 520px) {
		.crowd-name {
			font-size: 9.5px;
		}
	}
	.neon {
		filter: drop-shadow(0 0 4px currentColor);
		animation: flick 6s infinite;
	}
	@keyframes flick {
		0%,
		92%,
		96%,
		100% {
			opacity: 1;
		}
		94% {
			opacity: 0.5;
		}
	}
	.twinkle {
		animation: tw 2.4s ease-in-out infinite var(--d);
	}
	@keyframes tw {
		50% {
			opacity: 0.2;
		}
	}
	.fish {
		animation: swim 6s ease-in-out infinite var(--d);
	}
	@keyframes swim {
		50% {
			transform: translateX(-16px);
		}
	}
	.disco {
		transform-box: fill-box;
		transform-origin: center;
		animation: spin 6s linear infinite;
	}
	.beams {
		animation: tw 3s ease-in-out infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.blob {
		animation: blob 4s ease-in-out infinite;
	}
	.blob.b2 {
		animation-delay: -2s;
	}
	@keyframes blob {
		50% {
			transform: translateY(-12px);
		}
	}
	.tv {
		animation: tw 3.5s ease-in-out infinite;
	}
	@media (prefers-reduced-motion: reduce) {
		.neon,
		.twinkle,
		.fish,
		.disco,
		.beams,
		.blob,
		.tv,
		.crowd-ping,
		.crowd-say {
			animation: none;
		}
	}
</style>
