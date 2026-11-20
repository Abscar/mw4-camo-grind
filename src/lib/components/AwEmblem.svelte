<!--
	AW's emblem in the header's Squad frame (2026-11-20, the user's ask: "lägg till AW som operator", then mid-way
	"draw him like a cocaine maniac, white skin and big eyes, sexy"). Our own cartoon caricature, no game skin:
	chalk-white skin, huge wide-open bloodshot eyes with blown pupils and dark bags under them, raised brows, a
	clenched, manic ear-to-ear grin, a raw pink nose with a dusting of white under one nostril, a bead of sweat,
	and for the "sexy" part a glossy slicked-back pompadour, a square jaw with a cleft chin, a white suit jacket
	over an open teal shirt and a gold chain. Teal is his colour (SquadAvatar). Kept cartoony on purpose: no lines,
	bags or straws, just the look.
	Same size and style as the other squad emblems: 64×64 head and shoulders, overflow visible. The head twitches in
	short jittery bursts, the pupils throb, the sweat runs (all endless, so the frame cap / Battery saver / calm
	operators / reduced motion handle them like the others).
	BurgiShop's face slots (faceGear.ts FACES.aw): no holk of his own, so the Golden Holk / 420 pack 2 items go in
	the right corner of his grin, a hat replaces the pompadour (slick sides under it), glasses over the big eyes; a
	smoke colour puffs out beside the grin.
	Decoration only (aria-hidden; the callsign next to it is the text).
-->
<script lang="ts">
	import { holk, smoke } from '#lib/abscarOperator.ts';
	import { EXHALE_K, exhaleAt, eyesItem, FACES, hatItem, mouthItem, type FaceWear } from '#lib/faceGear.ts';

	let { face = null }: { face?: FaceWear | null } = $props();
	const mouth = $derived(face?.mouth ?? null);

	const uid = $props.id(); // ids must be unique per drawing
	const u = (name: string) => `${uid}-${name}`;
	const O = '#14100e';
	const TEAL = '#1aa79a';
	const F = FACES.aw;
	/** the Golden Holk in the right corner of his grin, smoke from its burning end */
	const GOLD_HOLK = holk(uid, F.mouth.x, F.mouth.y, 54.6, 40.4, 2.2, 6.6, undefined, true);
	const HOLK_SMOKE = smoke(uid, 55, 38.4, 0.6);
	const ITEM = $derived(mouthItem(uid, mouth, F.mouth));
	/** a smoke colour with nothing to smoke: he blows it out of the corner of his grin */
	const EXHALE = $derived(face?.smoke && !ITEM && mouth !== 'mouth-goldholk' ? smoke(uid, ...exhaleAt(F), EXHALE_K) : '');
	const HAT = $derived(hatItem(uid, face?.hat, F.head));
	const EYES = [F.eyes?.l ?? [26.6, 25.4], F.eyes?.r ?? [37.4, 25.4]] as const;
	/** red veins from the rim of each eye towards the pupil: [angle in degrees, length] */
	const VEINS: [number, number][] = [
		[200, 1.6],
		[160, 1.3],
		[-20, 1.5],
		[25, 1.2],
		[110, 1.1]
	];
	const TEETH = [28.6, 30.4, 32.2, 34, 35.8];
	const vein = (cx: number, cy: number, deg: number, len: number) => {
		const a = (deg * Math.PI) / 180;
		const r0 = 4;
		const x0 = cx + Math.cos(a) * r0;
		const y0 = cy + Math.sin(a) * r0;
		const x1 = cx + Math.cos(a) * (r0 - len);
		const y1 = cy + Math.sin(a) * (r0 - len);
		// a small kink halfway, so it reads as a vein, not a spoke
		const mx = (x0 + x1) / 2 + Math.sin(a) * 0.35;
		const my = (y0 + y1) / 2 - Math.cos(a) * 0.35;
		return `M${x0.toFixed(2)} ${y0.toFixed(2)} Q${mx.toFixed(2)} ${my.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
	};
</script>

<svg viewBox="0 0 64 64" class="size-16 flex-none overflow-visible sm:size-20" data-smoke={face?.smoke || undefined} aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id={u('suit')} x1="0" y1="0" x2=".25" y2="1">
			<stop offset="0" stop-color="#fbfaf6" /><stop offset=".6" stop-color="#dcd8cf" /><stop offset="1" stop-color="#aaa498" />
		</linearGradient>
		<radialGradient id={u('skin')} cx=".46" cy=".36" r=".74">
			<stop offset="0" stop-color="#fbf9f6" /><stop offset=".65" stop-color="#e9e3de" /><stop offset="1" stop-color="#c9bfb8" />
		</radialGradient>
		<linearGradient id={u('hair')} x1="0" y1="0" x2=".3" y2="1">
			<stop offset="0" stop-color="#3a2c22" /><stop offset=".5" stop-color="#1c1410" /><stop offset="1" stop-color="#0c0806" />
		</linearGradient>
		<radialGradient id={u('iris')} cx=".5" cy=".5" r=".5">
			<stop offset=".55" stop-color="#7fd0ff" /><stop offset="1" stop-color="#1f6fb0" />
		</radialGradient>
		<linearGradient id={u('gold')} x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#fff0a8" /><stop offset=".5" stop-color="#e8b830" /><stop offset="1" stop-color="#8a5a08" />
		</linearGradient>
		<!-- for the Golden Holk's ember and BurgiShop's smoke (abscarOperator.ts) -->
		<radialGradient id={u('ember')}><stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95" /><stop offset="1" stop-color="#ff5a00" stop-opacity="0" /></radialGradient>
		<filter id={u('blur')} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.5" /></filter>
	</defs>

	<!-- a white suit jacket over an open teal shirt, bare chest, a gold chain, a teal pocket square -->
	<path d="M1.5 64.5 C2.5 54 9 48.4 20 47 L44 47 C55 48.4 61.5 54 62.5 64.5 Z" fill="url(#{u('suit')})" stroke={O} stroke-width="1.1" stroke-linejoin="round" />
	<path d="M8.4 55.6 C11.4 52.2 15.2 50.6 19.4 50 M55.6 55.6 C52.6 52.2 48.8 50.6 44.6 50" fill="none" stroke="#b8b2a6" stroke-width=".6" stroke-linecap="round" />
	<path d="M23.6 47.2 L32 64.5 L40.4 47.2 Z" fill={TEAL} stroke={O} stroke-width=".7" stroke-linejoin="round" />
	<path d="M26.6 47.4 L32 58 L37.4 47.4 Z" fill="url(#{u('skin')})" />
	<path d="M23.6 47 L21.2 54 L27.6 51.8 Z M40.4 47 L42.8 54 L36.4 51.8 Z" fill="#3fd1c2" stroke={O} stroke-width=".6" stroke-linejoin="round" />
	<path d="M21.2 54 L29.6 64.5 M42.8 54 L34.4 64.5" stroke="#9a9488" stroke-width=".8" stroke-linecap="round" />
	<path d="M12.2 56.4 l2.4 -2.8 l2.2 2.6 Z" fill={TEAL} stroke="#0b4a44" stroke-width=".4" stroke-linejoin="round" />
	<path d="M27.4 48.2 Q32 55.6 36.6 48.2" fill="none" stroke="url(#{u('gold')})" stroke-width="1.15" stroke-dasharray="1 .45" stroke-linecap="round" />
	<circle cx="32" cy="54.6" r="1.4" fill="url(#{u('gold')})" stroke="#6a4206" stroke-width=".35" />

	<!-- pale neck -->
	<path d="M26.4 39.6 L25.8 47.8 L38.2 47.8 L37.6 39.6 Z" fill="#d9d1ca" stroke={O} stroke-width=".6" />

	<g class="aw-twitch">
		<!-- ears, then the face: square jaw, cleft chin, chalk white -->
		<ellipse cx="20.6" cy="27.4" rx="1.9" ry="3.1" fill="#ddd4cd" stroke={O} stroke-width=".6" />
		<ellipse cx="43.4" cy="27.4" rx="1.9" ry="3.1" fill="#ddd4cd" stroke={O} stroke-width=".6" />
		<path d="M21 22 C21 30 21.6 35.6 23.6 38.6 L27.4 42.6 Q32 45 36.6 42.6 L40.4 38.6 C42.4 35.6 43 30 43 22 C43 15.4 38.4 11.2 32 11.2 C25.6 11.2 21 15.4 21 22 Z" fill="url(#{u('skin')})" stroke={O} stroke-width="1" stroke-linejoin="round" />
		<!-- cheekbones and the cleft chin -->
		<path d="M22.8 31.4 Q24.6 34.4 26 34.8 M41.2 31.4 Q39.4 34.4 38 34.8" fill="none" stroke="#bdb1a8" stroke-width=".6" stroke-linecap="round" />
		<path d="M32 42.4 V44" stroke="#a89c93" stroke-width=".55" stroke-linecap="round" />

		<!-- dark bags under the eyes, then the huge eyes: bloodshot whites, icy irises, blown pupils that throb -->
		{#each EYES as e, i (i)}
			<path d="M{e[0] - 4.2} {e[1] + 2.2} Q{e[0]} {e[1] + 6.4} {e[0] + 4.2} {e[1] + 2.2}" fill="none" stroke="#b58aa0" stroke-width="1.1" stroke-linecap="round" opacity=".75" />
			<circle cx={e[0]} cy={e[1]} r="4.1" fill="#fffdf8" stroke={O} stroke-width=".6" />
			<g stroke="#e0353f" stroke-width=".32" fill="none" stroke-linecap="round">
				{#each VEINS as [deg, len] (deg)}<path d={vein(e[0], e[1], i ? 180 - deg : deg, len)} />{/each}
			</g>
			<circle cx={e[0] + (i ? -0.25 : 0.25)} cy={e[1] + 0.2} r="2.5" fill="url(#{u('iris')})" stroke="#103a5c" stroke-width=".3" />
			<circle class="aw-pupil" cx={e[0] + (i ? -0.25 : 0.25)} cy={e[1] + 0.2} r="1.95" fill="#050404" />
			<circle cx={e[0] - 0.9} cy={e[1] - 0.8} r=".62" fill="#fff" />
			<circle cx={e[0] + 0.7} cy={e[1] + 0.9} r=".28" fill="#fff" opacity=".85" />
		{/each}
		<!-- brows raised high in surprise -->
		<path d="M22.6 19.6 Q26.4 16.8 30 18.8 M34 18.8 Q37.6 16.8 41.4 19.6" fill="none" stroke="#1c1410" stroke-width="1.2" stroke-linecap="round" />

		<!-- a raw pink nose, with a dusting of white under the left nostril -->
		<path d="M32.4 26.6 L31.2 31.4" fill="none" stroke="#b2a29a" stroke-width=".6" stroke-linecap="round" />
		<path d="M29.4 31.8 Q30.4 30.4 31.4 31.8 M32.6 31.8 Q33.6 30.4 34.6 31.8" fill="none" stroke="#e07a82" stroke-width=".8" stroke-linecap="round" />
		<ellipse cx="32" cy="31.4" rx="2.8" ry="1.4" fill="#f2a0a6" opacity=".35" />
		<g fill="#fff" stroke="#c9c1bb" stroke-width=".15">
			<circle cx="29.8" cy="33" r=".55" /><circle cx="30.9" cy="33.4" r=".4" /><circle cx="29.2" cy="33.8" r=".32" /><circle cx="30.4" cy="34.2" r=".25" />
		</g>

		<!-- the clenched, manic ear-to-ear grin -->
		<path d="M26.2 35.6 Q32 37.4 37.6 35.8 Q32 43 26.2 35.6 Z" fill="#fffef7" stroke={O} stroke-width=".7" stroke-linejoin="round" />
		<path d="M26.9 36.4 Q32 39 37 36.5" fill="none" stroke="#7a6a5e" stroke-width=".4" />
		<g stroke="#9a8a7e" stroke-width=".3">
			{#each TEETH as x (x)}<path d="M{x} {36.6 + Math.abs(x - 32) * 0.05} V{39.8 - Math.abs(x - 32) * 0.42}" />{/each}
		</g>
		<path d="M25.2 34.8 Q25.6 36.2 26.6 36.6 M38.6 35 Q38.2 36.4 37.2 36.7" fill="none" stroke="#a89c93" stroke-width=".55" stroke-linecap="round" />

		{#if HAT}
			<!-- BurgiShop's hat replaces the pompadour: slick dark sides under it -->
			<path d="M20.8 23.4 C20.2 15.4 24.6 11 32 11 C39.4 11 43.8 15.4 43.2 23.4 C41.8 17.4 37.4 14.6 32 14.6 C26.6 14.6 22.2 17.4 20.8 23.4 Z" fill="url(#{u('hair')})" stroke={O} stroke-width=".6" />
		{:else}
			<!-- the glossy slicked-back pompadour with a loose curl falling on the forehead -->
			<path d="M20.4 23.8 C19 14 23 6.8 31 5.4 C38.8 4.2 45 9.4 44.2 18 C44 20.6 43.6 22.6 43.2 23.8 C42 18.8 39.6 15.8 35.6 15 C31 14 26 14.6 23.4 17.2 C22 18.8 21.2 21.2 20.4 23.8 Z" fill="url(#{u('hair')})" stroke={O} stroke-width=".9" stroke-linejoin="round" />
			<path d="M24.4 13.4 C27 9.4 32 7.6 37.4 8.6 M23.4 16 C26.4 12.4 31.4 10.8 36.8 11.6 M38.8 9.6 C41.2 11 42.6 13.6 42.8 16.4" fill="none" stroke="#fff" stroke-width=".55" stroke-linecap="round" opacity=".38" />
			<path d="M30.6 14.6 C28.2 16.2 28.4 19.2 30.6 19.8 C29.6 18.6 29.6 16.8 31.4 15.6" fill="url(#{u('hair')})" stroke={O} stroke-width=".5" stroke-linejoin="round" />
		{/if}

		<!-- a bead of sweat runs down his temple -->
		<path class="aw-sweat" d="M41.4 15.8 C40.6 17.4 40.2 18.2 40.2 18.9 C40.2 19.7 40.8 20.2 41.4 20.2 C42 20.2 42.6 19.7 42.6 18.9 C42.6 18.2 42.2 17.4 41.4 15.8 Z" fill="#bfeaff" stroke="#4a8fb4" stroke-width=".35" />

		<!-- BurgiShop: glasses over his eyes, a hat on his head (the 420 pack 2) -->
		{@html eyesItem(uid, face?.eyes, F.eyes)}
		{@html HAT}

		{#if ITEM}
			<!-- BurgiShop's 420 pack 2: something in the right corner of his grin -->
			{@html ITEM.markup}
			{@html smoke(uid, ITEM.end[0], ITEM.end[1], 0.7 * ITEM.boost)}
		{:else if mouth === 'mouth-goldholk'}
			<!-- BurgiShop's Golden Holk -->
			{@html GOLD_HOLK}
			{@html HOLK_SMOKE}
		{:else if EXHALE}
			{@html EXHALE}
		{/if}
	</g>
</svg>

<style>
	/* the head twitches in a short jittery burst now and then, the pupils throb, a bead of sweat runs */
	.aw-twitch {
		animation: aw-twitch 3.6s linear infinite;
	}
	@keyframes aw-twitch {
		0%,
		80%,
		94%,
		100% {
			transform: translate(0, 0) rotate(0deg);
		}
		82% {
			transform: translate(0.6px, -0.3px) rotate(0.8deg);
		}
		84% {
			transform: translate(-0.6px, 0.2px) rotate(-0.8deg);
		}
		86% {
			transform: translate(0.5px, 0.3px) rotate(0.6deg);
		}
		88% {
			transform: translate(-0.4px, -0.3px) rotate(-0.5deg);
		}
		90% {
			transform: translate(0.3px, 0.2px) rotate(0.3deg);
		}
	}
	.aw-pupil {
		transform-box: fill-box;
		transform-origin: 50% 50%;
		animation: aw-pupil 1.3s ease-in-out infinite;
	}
	@keyframes aw-pupil {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.14);
		}
	}
	.aw-sweat {
		animation: aw-sweat 3.2s ease-in infinite;
	}
	@keyframes aw-sweat {
		0% {
			transform: translateY(-1px);
			opacity: 0;
		}
		15% {
			opacity: 1;
		}
		80% {
			opacity: 1;
		}
		100% {
			transform: translateY(5px);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.aw-twitch,
		.aw-pupil,
		.aw-sweat {
			animation: none;
		}
	}
</style>
