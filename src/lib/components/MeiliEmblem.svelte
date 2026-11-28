<!--
	Meili's emblem in the header's Squad frame (2026-11-28, the user's ask: "lägg till Meili som operator på en
	gång", then a picture of the look: a purple-skinned warrior elf in a fantasy MMO). Our own cartoon in the
	squad emblems' style, not the picture: purple skin, long pointed ears sweeping up out of a boxy dark-brown
	closed helm with a T-shaped visor and two glowing yellow eyes, big blue pauldrons with spikes and a brown
	band, a yellow fur-trimmed yoke laced up the middle over a bare, muscled purple chest. No names or logos.
	Same size and style as the other squad emblems: 64×64 head and shoulders, overflow visible. The eyes glow
	and an ear twitches now and then (still with reduced motion).
	BurgiShop's face slots (faceGear.ts FACES.meili): no holk of his own, so mouth items sit at the helm's lower
	right corner, glasses go over the visor, a hat sits on the helm.
	Decoration only (aria-hidden; the callsign next to it is the text).
-->
<script lang="ts">
	import { holk, smoke } from '#lib/abscarOperator.ts';
	import { EXHALE_K, exhaleAt, eyesItem, FACES, hatItem, mouthItem, type FaceWear } from '#lib/faceGear.ts';
	import { dripOver, dripUnder } from '#lib/dripArt.ts';

	let { face = null }: { face?: FaceWear | null } = $props();
	const mouth = $derived(face?.mouth ?? null);

	const uid = $props.id(); // ids must be unique per drawing
	const u = (name: string) => `${uid}-${name}`;
	const O = '#140c1c';
	const F = FACES.meili;
	const M = F.mouth;
	const E = F.eyes ?? { l: [27.6, 25] as [number, number], r: [36.4, 25] as [number, number], rad: 3.4 };
	/** the Golden Holk at the helm's lower right corner, smoke from its burning end */
	const GOLD_HOLK = holk(uid, M.x, M.y, 55.4, 43.2, 2.2, 6.8, undefined, true);
	const HOLK_SMOKE = smoke(uid, 55.8, 41, 0.7);
	const ITEM = $derived(mouthItem(uid, mouth, M));
	/** a smoke colour with nothing to smoke: it puffs out under the helm */
	const EXHALE = $derived(face?.smoke && !ITEM && mouth !== 'mouth-goldholk' ? smoke(uid, ...exhaleAt(F), EXHALE_K) : '');

	/** the boxy closed helm, a little peaked on top */
	const HELM = 'M22 19 C22.6 14 24.6 10.2 27.6 8.6 L32 7.4 L36.4 8.6 C39.4 10.2 41.4 14 42 19 L42.6 37.6 L38.6 42.6 L25.4 42.6 L21.4 37.6 Z';
	/** a long pointed ear, sweeping up and out (left; the right one is mirrored) */
	const EAR = 'M23 24.6 C17.6 22 11.6 17.4 4.6 9.2 C9.6 18.4 14.4 25.4 22.4 30.4 Z';
	/** a blue pauldron with two spikes (left; the right one is mirrored) */
	const PAULDRON = 'M4.4 55.4 C3.4 48.6 7.4 43.2 14.4 41.6 C19.4 40.6 23.6 42 25.2 45.6 C25.8 48.6 24 51.4 20.4 52.8 C14.6 55 9 56.4 4.4 55.4 Z';
	const SPIKES = 'M10.4 43.6 L8.4 35.4 L13.8 42 Z M17.4 41.4 L17.6 33.2 L21 41.6 Z';
</script>

<svg viewBox="0 0 64 64" class="size-16 flex-none overflow-visible sm:size-20" data-smoke={face?.smoke || undefined} aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id={u('skin')} x1="0" y1="0" x2=".2" y2="1">
			<stop offset="0" stop-color="#8a74c0" /><stop offset=".6" stop-color="#6a5498" /><stop offset="1" stop-color="#47366e" />
		</linearGradient>
		<linearGradient id={u('helm')} x1=".2" y1="0" x2=".7" y2="1">
			<stop offset="0" stop-color="#8a7268" /><stop offset=".5" stop-color="#5e4c45" /><stop offset="1" stop-color="#33282a" />
		</linearGradient>
		<linearGradient id={u('pauldron')} x1="0" y1="0" x2=".3" y2="1">
			<stop offset="0" stop-color="#7cb4dc" /><stop offset=".5" stop-color="#3a78ac" /><stop offset="1" stop-color="#1e4670" />
		</linearGradient>
		<linearGradient id={u('fur')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#f2d47a" /><stop offset=".7" stop-color="#d6ad48" /><stop offset="1" stop-color="#a87e2c" />
		</linearGradient>
		<radialGradient id={u('eye')}><stop offset="0" stop-color="#fff6c0" /><stop offset=".45" stop-color="#ffcf3a" stop-opacity=".9" /><stop offset="1" stop-color="#ff9a10" stop-opacity="0" /></radialGradient>
		<!-- for the Golden Holk's ember and BurgiShop's smoke (abscarOperator.ts) -->
		<radialGradient id={u('ember')}><stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95" /><stop offset="1" stop-color="#ff5a00" stop-opacity="0" /></radialGradient>
		<filter id={u('puff-blur')} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.4" /></filter>
		<filter id={u('blur')} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.5" /></filter>
	</defs>

	<!-- bare purple chest and shoulders, muscles drawn in -->
	<path d="M1 64.5 C2 53.4 8.6 47.6 20.2 46 L43.8 46 C55.4 47.6 62 53.4 63 64.5 Z" fill="url(#{u('skin')})" stroke={O} stroke-width="1.1" stroke-linejoin="round" />
	<path d="M32 54 V64.5 M22.6 57.4 Q27 60.4 31.4 58.6 M41.4 57.4 Q37 60.4 32.6 58.6 M28.4 61.6 Q30.4 62.6 31.6 62 M35.6 61.6 Q33.6 62.6 32.4 62" fill="none" stroke="#3a2a5c" stroke-width=".6" stroke-linecap="round" />
	<path d="M24 58.6 Q27.4 59.6 30 58.8 M40 58.6 Q36.6 59.6 34 58.8" fill="none" stroke="#a894dc" stroke-width=".45" stroke-linecap="round" opacity=".6" />

	<!-- yellow fur yoke over the chest, laced up the middle -->
	<path d="M17.4 46.2 L46.6 46.2 C46 50.6 43 54 38.4 55.4 L32 56.2 L25.6 55.4 C21 54 18 50.6 17.4 46.2 Z" fill="url(#{u('fur')})" stroke={O} stroke-width=".8" stroke-linejoin="round" />
	<path d="M19 50.6 L20.6 52.6 L21.4 51 L23 53.8 L24 52.2 L25.4 55 L27 53.6 L28.4 55.8 L30 54.6 L32 56.4 L34 54.6 L35.6 55.8 L37 53.6 L38.6 55 L40 52.2 L41 53.8 L42.6 51 L43.4 52.6 L45 50.6" fill="none" stroke="#8a6420" stroke-width=".55" stroke-linejoin="round" />
	<path d="M32 46.4 V55.6" stroke="#6a4c18" stroke-width=".6" />
	<path d="M30.4 47.8 L33.6 50.2 M33.6 47.8 L30.4 50.2 M30.4 51 L33.6 53.4 M33.6 51 L30.4 53.4" stroke="#5a3a10" stroke-width=".7" stroke-linecap="round" />

	<!-- BurgiDrip: clothes over the chest (dripArt.ts); his pauldrons are drawn over them, pauldron items after -->
	{@html dripUnder(uid, face, 'meili')}

	<!-- big blue spiked pauldrons with a brown band -->
	{#each ['', 'translate(64 0) scale(-1 1)'] as flip (flip)}
		<g transform={flip || undefined}>
			<path d={SPIKES} fill="#b8c2cc" stroke={O} stroke-width=".6" stroke-linejoin="round" />
			<path d="M9.4 38.8 L10.8 42.4 M17.6 36 L18.8 41.4" stroke="#eef2f6" stroke-width=".4" stroke-linecap="round" opacity=".7" />
			<path d={PAULDRON} fill="url(#{u('pauldron')})" stroke={O} stroke-width=".9" stroke-linejoin="round" />
			<path d="M6 51.6 C11 51.8 17.4 49.6 23.4 46.2 L24.6 48.4 C18.6 52 11.6 54.2 5.2 54 Z" fill="#5a3e2c" stroke={O} stroke-width=".45" stroke-linejoin="round" />
			<path d="M9.6 52.4 L10 50.4 M14.4 51.4 L14.6 49.4 M19 49.6 L19 47.6" stroke="#c9a46a" stroke-width=".55" stroke-linecap="round" />
			<path d="M8 46 C10.6 43.6 14.6 42.4 18.6 42.6" fill="none" stroke="#bde0f6" stroke-width=".6" stroke-linecap="round" opacity=".8" />
		</g>
	{/each}
	{@html dripOver(uid, face, 'meili')}

	<!-- purple neck, then the long ears, then the helm -->
	<path d="M27 40 L37 40 L37.8 46.6 L26.2 46.6 Z" fill="#5c4888" stroke={O} stroke-width=".7" />
	{#each ['', 'translate(64 0) scale(-1 1)'] as flip (flip)}
		<g transform={flip || undefined} class={flip ? 'ml-ear-r' : undefined}>
			<path d={EAR} fill="url(#{u('skin')})" stroke={O} stroke-width=".8" stroke-linejoin="round" />
			<path d="M20.8 25.8 C16.6 23.4 12.4 19.8 8.6 14.6" fill="none" stroke="#3e2c62" stroke-width=".6" stroke-linecap="round" />
			<path d="M21.6 27.6 C17 25.4 12.6 21.6 8.4 16" fill="none" stroke="#b6a2e6" stroke-width=".4" stroke-linecap="round" opacity=".6" />
		</g>
	{/each}
	<path d={HELM} fill="url(#{u('helm')})" stroke={O} stroke-width=".9" stroke-linejoin="round" />
	<path d="M32 7.6 V21.6" stroke="#2a2022" stroke-width=".8" />
	<path d="M32.4 8 V21" stroke="#a48c80" stroke-width=".35" opacity=".7" />
	<path d="M24.2 13.6 C24 18 24 30 24.4 37 M39.8 13.6 C40 18 40 30 39.6 37" fill="none" stroke="#a48c80" stroke-width=".45" stroke-linecap="round" opacity=".6" />
	<path d="M22.4 37.2 L25.8 41.4 H38.2 L41.6 37.2" fill="none" stroke="#2a2022" stroke-width=".7" />
	<g fill="#2a2022"><circle cx="24.6" cy="20" r=".55" /><circle cx="39.4" cy="20" r=".55" /><circle cx="24.6" cy="33" r=".55" /><circle cx="39.4" cy="33" r=".55" /></g>
	<!-- the T-shaped visor, eyes glowing yellow in the slit -->
	<path d="M24.8 22.6 H39.2 L38.6 27.4 H34 V38.4 H30 V27.4 H25.4 Z" fill="#0c0810" stroke="#1e1418" stroke-width=".5" stroke-linejoin="round" />
	<g class="ml-eyes">
		{#each [E.l, E.r] as [x, y] (x)}
			<circle cx={x} cy={y} r="3.4" fill="url(#{u('eye')})" />
			<ellipse cx={x} cy={y} rx="1.6" ry=".9" fill="#fff3b0" />
		{/each}
	</g>

	<!-- BurgiShop: eyes over the visor, a hat on the helm (the 420 pack 2) -->
	{@html eyesItem(uid, face?.eyes, F.eyes)}
	{@html hatItem(uid, face?.hat, F.head)}

	{#if ITEM}
		<!-- BurgiShop's 420 pack 2: something at the helm's lower right corner -->
		{@html ITEM.markup}
		{@html smoke(uid, ITEM.end[0], ITEM.end[1], 0.7 * ITEM.boost)}
	{:else if mouth === 'mouth-goldholk'}
		<!-- BurgiShop's Golden Holk -->
		{@html GOLD_HOLK}
		{@html HOLK_SMOKE}
	{:else if EXHALE}
		{@html EXHALE}
	{/if}
</svg>

<style>
	/* the eyes glow brighter and dimmer */
	.ml-eyes {
		animation: ml-glow 2.8s ease-in-out infinite;
	}
	@keyframes ml-glow {
		0%,
		100% {
			opacity: 0.75;
		}
		50% {
			opacity: 1;
		}
	}
	/* now and then the right ear twitches */
	.ml-ear-r :global(path) {
		transform-box: view-box;
		transform-origin: 41px 27px;
		animation: ml-ear 6s ease-in-out infinite;
	}
	@keyframes ml-ear {
		0%,
		80%,
		100% {
			transform: rotate(0deg);
		}
		84% {
			transform: rotate(-9deg);
		}
		88% {
			transform: rotate(3deg);
		}
		92% {
			transform: rotate(-4deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ml-eyes,
		.ml-ear-r :global(path) {
			animation: none;
		}
	}
</style>
