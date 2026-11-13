<!--
	Da Jeeven's emblem in the header's Squad frame (2026-11-13, the user's ask: their friend "Da Jeeven" uses
	the tracker too, "he uses the golden ghost skin, he also wants a big smoking thing in his mouth like
	Abscar"). The skin is MW4's gold Ghost, "Golden Wraith" (Bone Chiller II store bundle; looked at on
	Activision's own store page, operator picture ui_rex_icon_op_ghost_5_1): a polished gold skull mask with
	black mesh panels over the temples and jaw, a raised ridge with a small mount on the forehead, angular
	black eye holes, black headset over a dark hood with a strap across the top, a gold-lined collar, a dark
	cape with gold zip trim over a grey plate carrier with a gold-framed chest patch and gold mags.
	In his teeth: a big holk (cone joint) with Abscar's smoke column, drawn by the same `holk` / `smoke`
	helpers as Abscar's figure (abscarOperator.ts; smoke classes op-puff / op-wisp / op-ember-glow in app.css).
	Same size and style as the other squad emblems: 64×64 head and shoulders, overflow visible.
	Our own cartoon, decoration only (aria-hidden; the callsign next to it is the text). No skin or operator
	names on the page, only the callsign.
-->
<script lang="ts">
	import { holk, smoke } from '#lib/abscarOperator.ts';

	const uid = $props.id(); // ids must be unique per drawing
	const u = `dj-${uid}`;
	const id = (name: string) => `${u}-${name}`;
	const O = '#1a1206';

	/** the gold skull mask's outline (also the glint's clip) */
	const MASK =
		'M32 9.5 C41.5 9.5 46 16.5 46 24.5 C46 29.5 44.5 32.5 43 34.5 L41.5 40.5 C39.8 43.6 36.5 45 32 45 C27.5 45 24.2 43.6 22.5 40.5 L21 34.5 C19.5 32.5 18 29.5 18 24.5 C18 16.5 22.5 9.5 32 9.5 Z';
	/** black mesh panels on the left temple and the left jaw (the right side is mirrored) */
	const TEMPLE = 'M19.3 21.4 C19.6 15.4 22.8 11.8 27.3 10.7 L26.6 17.4 L21.2 23.6 Z';
	const JAW = 'M21.5 33.8 L25.7 35.7 L26.1 42 C24.3 41.4 23.1 40.6 22.6 40 Z';
	const EYE = 'M21.6 23.2 L27.4 22 L29.8 24.6 L28.8 28.6 L23.6 29.2 L21.2 26.4 Z';
	const MIRROR = 'translate(64 0) scale(-1 1)';
	const TEETH_UP = [27.2, 29.1, 31, 32.9, 34.8];
	const TEETH_DOWN = [27.9, 29.8, 31.7, 33.6, 35.5];
	/** the big holk: filter tip between his teeth, burning end out to the right; smoke from its end */
	const HOLK = holk(u, 34, 38.8, 56.5, 45.4, 2.6, 8.4);
	const SMOKE = smoke(u, 57, 43.6, 0.95);
</script>

<svg viewBox="0 0 64 64" class="size-16 flex-none overflow-visible sm:size-20" aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id={id('gold')} x1=".15" y1="0" x2=".85" y2="1">
			<stop offset="0" stop-color="#fff4c2" /><stop offset=".25" stop-color="#f1c64e" /><stop offset=".55" stop-color="#b98318" /><stop offset=".76" stop-color="#f0c75a" /><stop offset="1" stop-color="#6b4708" />
		</linearGradient>
		<linearGradient id={id('gold-soft')} x1="0" y1="0" x2=".3" y2="1">
			<stop offset="0" stop-color="#f7dc8e" /><stop offset=".5" stop-color="#c8952e" /><stop offset="1" stop-color="#7a5212" />
		</linearGradient>
		<linearGradient id={id('cape')} x1="0" y1="0" x2=".2" y2="1">
			<stop offset="0" stop-color="#3a3d39" /><stop offset=".55" stop-color="#232522" /><stop offset="1" stop-color="#121311" />
		</linearGradient>
		<linearGradient id={id('hood')} x1="0" y1="0" x2=".3" y2="1">
			<stop offset="0" stop-color="#3a3c3f" /><stop offset="1" stop-color="#151617" />
		</linearGradient>
		<linearGradient id={id('cup')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#3a3d42" /><stop offset="1" stop-color="#121315" />
		</linearGradient>
		<!-- black mesh: tiny lighter diamonds on near-black -->
		<pattern id={id('mesh')} width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
			<rect width="1.6" height="1.6" fill="#141517" />
			<rect width=".7" height=".7" fill="#3a3d42" />
		</pattern>
		<clipPath id={id('mask-clip')}><path d={MASK} /></clipPath>
		<!-- for the holk and the smoke (abscarOperator.ts) -->
		<radialGradient id={id('ember')}><stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95" /><stop offset="1" stop-color="#ff5a00" stop-opacity="0" /></radialGradient>
		<filter id={id('puff-blur')} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.4" /></filter>
		<filter id={id('blur')} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.5" /></filter>
	</defs>

	<!-- dark cape over the shoulders, the grey vest in its opening: gold-framed patch, gold mags -->
	<path d="M1 64.5 C1.5 54 8 48 20 46.5 L44 46.5 C56 48 62.5 54 63 64.5 Z" fill="url(#{id('cape')})" stroke={O} stroke-width="1.1" stroke-linejoin="round" />
	<path d="M18.6 64.5 L19.4 55.6 Q32 52.6 44.6 55.6 L45.4 64.5 Z" fill="#2c2f31" stroke={O} stroke-width=".8" stroke-linejoin="round" />
	<rect x="27.2" y="54.8" width="9.6" height="6.6" rx="1.2" fill="url(#{id('gold')})" stroke={O} stroke-width=".6" />
	<rect x="28.5" y="56" width="7" height="4.2" rx=".5" fill="#c9ced2" stroke="#6b6f73" stroke-width=".4" />
	<path d="M29.4 58.1 h5.2 M32 56.6 v3" stroke="#8d9296" stroke-width=".6" />
	{#each [21.6, 28.9, 36.2] as x (x)}
		<rect {x} y="62" width="6.2" height="3" rx=".5" fill="url(#{id('gold')})" stroke={O} stroke-width=".5" />
	{/each}
	<!-- the cape's front edges hang over the vest, with gold zip trim -->
	{#each ['', MIRROR] as flip (flip)}
		<g transform={flip || undefined}>
			<path d="M10 64.5 C11.5 57 15.5 51.5 22 48.2 L26.4 48.6 C22.4 52.6 20.4 57.6 19.8 64.5 Z" fill="url(#{id('cape')})" stroke={O} stroke-width=".8" stroke-linejoin="round" />
			<path d="M26 48.9 C22.1 52.8 20.2 57.8 19.7 64.5" fill="none" stroke="url(#{id('gold-soft')})" stroke-width="1.1" stroke-linecap="round" />
			<path d="M25.4 49.7 C21.8 53.4 20 58 19.5 63.5" fill="none" stroke="#5c3d0b" stroke-width=".45" stroke-dasharray=".6 .7" />
		</g>
	{/each}

	<!-- dark hood with a strap across the top, the headset's band and ear cups -->
	<path d="M14.5 33 C13 16 21 5.5 32 5.5 C43 5.5 51 16 49.5 33 L47 42 L17 42 Z" fill="url(#{id('hood')})" stroke={O} stroke-width="1" stroke-linejoin="round" />
	<path d="M24 6.9 Q32 4.9 40 6.9 L39.4 9.7 Q32 8.1 24.6 9.7 Z" fill="#45484c" stroke={O} stroke-width=".5" />
	<path d="M15.4 24 C14.6 12 22 5 32 5 C42 5 49.4 12 48.6 24" fill="none" stroke="#141516" stroke-width="2.4" />
	<path d="M16.4 20 C16.8 11.6 23 6.2 32 6" fill="none" stroke="#50545a" stroke-width=".6" stroke-linecap="round" />
	{#each [12.4, 44.8] as x (x)}
		<rect {x} y="21.8" width="6.8" height="12.6" rx="3.2" fill="url(#{id('cup')})" stroke={O} stroke-width="1" />
		<rect x={x + 1.3} y="23.8" width="4.2" height="8.6" rx="2.1" fill="none" stroke="#4a4e55" stroke-width=".6" />
	{/each}

	<!-- gold-lined hood collar round the neck -->
	<path d="M19.6 48 C22 43 26.5 41.4 32 41.4 C37.5 41.4 42 43 44.4 48 C40.5 50.4 36.4 51.4 32 51.4 C27.6 51.4 23.5 50.4 19.6 48 Z" fill="url(#{id('gold-soft')})" stroke={O} stroke-width=".8" />
	<path d="M23.6 46.6 Q26 48.6 28.4 49.4 M40.4 46.6 Q38 48.6 35.6 49.4" fill="none" stroke="#7a5212" stroke-width=".6" stroke-linecap="round" />

	<!-- the gold skull mask: mesh panels, forehead ridge + mount, angular eyes, nose, teeth -->
	<path d={MASK} fill="url(#{id('gold')})" stroke={O} stroke-width="1.1" />
	{#each ['', MIRROR] as flip (flip)}
		<g transform={flip || undefined}>
			<path d={TEMPLE} fill="url(#{id('mesh')})" stroke={O} stroke-width=".5" stroke-linejoin="round" />
			<path d={JAW} fill="url(#{id('mesh')})" stroke={O} stroke-width=".5" stroke-linejoin="round" />
			<path d={EYE} fill="#0a0a0b" />
			<path d="M22.5 31 Q25 32 26.5 34.5" fill="none" stroke="#7a5312" stroke-width=".7" stroke-linecap="round" />
			<circle cx="26.2" cy="18.6" r=".55" fill="#3a2a0c" />
		</g>
	{/each}
	<rect x="30.6" y="9.8" width="2.8" height="10" rx=".8" fill="url(#{id('gold-soft')})" stroke="#6b4708" stroke-width=".4" />
	<rect x="29.5" y="12" width="5" height="3.6" rx=".5" fill="#2a2b2e" stroke={O} stroke-width=".5" />
	<circle cx="30.4" cy="13.8" r=".45" fill="#d9b04a" /><circle cx="33.6" cy="13.8" r=".45" fill="#d9b04a" />
	<path d="M32 29.4 L30.3 33.2 Q32 34.4 33.7 33.2 Z" fill="#0a0a0b" />
	<rect x="26.6" y="36.4" width="10.8" height="4.8" rx="1.4" fill="#0b0b0c" />
	<g fill="#f5dc8a">
		{#each TEETH_UP as x (x)}<rect {x} y="36.6" width="1.6" height="2" rx=".4" />{/each}
		{#each TEETH_DOWN as x (x)}<rect {x} y="39.2" width="1.5" height="1.8" rx=".4" />{/each}
	</g>
	<path d="M20.6 22.2 Q25 20.6 29 21.6 M43.4 22.2 Q39 20.6 35 21.6" fill="none" stroke="#fff4c2" stroke-width=".5" stroke-linecap="round" opacity=".7" />
	<!-- a glint runs over the polished gold now and then -->
	<g clip-path="url(#{id('mask-clip')})">
		<polygon class="dj-glint" points="10,6 13.6,6 9.6,48 6,48" fill="#fffbe6" opacity=".55" />
	</g>

	<!-- the big holk in his teeth, smoke rising from its end (like Abscar's) -->
	{@html HOLK}
	{@html SMOKE}
</svg>

<style>
	/* a glint sweeps across the gold mask every few seconds (out of sight left of it otherwise) */
	.dj-glint {
		animation: dj-glint 6.5s ease-in-out infinite;
	}
	@keyframes dj-glint {
		0%,
		62% {
			transform: translateX(0);
		}
		88%,
		100% {
			transform: translateX(44px);
		}
	}
</style>
