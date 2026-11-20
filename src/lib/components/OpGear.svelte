<!--
	A member's BurgiShop look on their operator emblem (shop.ts; 2026-11-16, the user's ask: "cosmetics
	you can buy with burgers and then equip on your operator"): wraps the emblem with an aura behind it,
	an effect around it and a pin on its corner. The callsign styles and title plates are global classes
	here too (`og-name[data-style]`, `og-title`), used by OperatorTag and the shop. Our own drawings;
	reduced motion = still pictures. Decorative: the shop and the header say in words what's worn.
-->
<script lang="ts" module>
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import type { IconCamo } from '#lib/data/camos.ts';
	/** The rifle on the back (shop.ts slot `back`): the Patriot XMR's cartoon in the item's ladder camo. */
	const BACK_LOOK = WEAPON_LOOKS['patriot-xmr'];
	const BACK_CAMO: Record<string, IconCamo> = { 'back-gold': 'gold', 'back-plat': 'platinum', 'back-hb': 'harmonicBreak', 'back-div': 'divergence' };
	/** The ideas pack's extras (2026-11-20), one object so each emblem's call stays short. */
	export interface GearExtra {
		/** a `back` item: a rifle in camo behind the shoulder */
		back?: string | null;
		/** the emote to play ({ item id, when played }); a new `at` plays it again (EMOTE_PLAY long) */
		emote?: { k: string; at: number } | null;
		/** play the emote over and over (the shop's item cards) */
		loop?: boolean;
		/** a friend's Clown Nose: a red nose at this spot (the emblem's 64-unit coordinates, faceGear noseOf) */
		nose?: readonly [number, number] | null;
		/** their own Gas Mask is on: a small mask on the corner */
		masked?: boolean;
		/** your own emblem with an emote worn: a tap plays it */
		ontap?: (() => void) | null;
		tapLabel?: string;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';
	import { EMOTE_PLAY } from '#lib/shop.ts';
	import ShopPet from './ShopPet.svelte';
	import ShopPin from './ShopPin.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	let {
		aura = null,
		effect: fx = null,
		badge = null,
		pet = null,
		pin = 24,
		smoked = false,
		extra = {},
		children
	}: {
		aura?: string | null;
		effect?: string | null;
		badge?: string | null;
		/** the 420 pack 2's sidekick (shop.ts slot `pet`): sits on the emblem's left shoulder (ShopPet) */
		pet?: string | null;
		pin?: number;
		/** A friend's Smoke Bomb (shop.ts PRANKS): the emblem disappears in a thick cloud for an hour. */
		smoked?: boolean;
		extra?: GearExtra;
		children: Snippet;
	} = $props();
	const uid = $props.id();

	/** The emote playing right now: a new `at` starts it, EMOTE_PLAY later it stops (or always, `loop`). */
	let playing = $state<{ k: string; at: number } | null>(null);
	let seenAt = 0;
	let stopTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const em = extra.emote;
		if (extra.loop || !em || em.at === seenAt) return;
		seenAt = em.at;
		playing = em;
		clearTimeout(stopTimer);
		stopTimer = setTimeout(() => (playing = null), EMOTE_PLAY);
	});
	$effect(() => () => clearTimeout(stopTimer));
	const shown = $derived(extra.loop ? (extra.emote ?? null) : playing);

	/** Particle places (% of the box) and delays, the same for every effect so they spread out. */
	const PARTS = [
		{ x: 8, y: 22, d: 0 },
		{ x: 86, y: 14, d: 0.6 },
		{ x: 92, y: 62, d: 1.2 },
		{ x: 4, y: 70, d: 1.8 },
		{ x: 50, y: 2, d: 0.9 },
		{ x: 28, y: 92, d: 2.4 },
		{ x: 72, y: 90, d: 1.5 },
		{ x: 62, y: 30, d: 2.1 }
	];
</script>

<span class="og" data-aura={aura} data-effect={fx} data-emote={shown?.k}>
	{#if aura}
		<span class="og-aura" data-aura={aura} aria-hidden="true"
			><i></i>{#if aura === 'aura-nuke'}
				<!-- Nuke: a mushroom cloud grows up behind the emblem every 10 s -->
				<span class="og-mush"
					><svg viewBox="0 0 60 70" width="100%" height="100%">
						<defs>
							<radialGradient id="{uid}-cap" cx="0.5" cy="0.65" r="0.6"><stop offset="0" stop-color="#fff6a0" /><stop offset="0.45" stop-color="#ffb02a" /><stop offset="1" stop-color="#c2341a" /></radialGradient>
							<linearGradient id="{uid}-stem" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf4a" /><stop offset="1" stop-color="#6a5a4a" stop-opacity="0.2" /></linearGradient>
						</defs>
						<path d="M25 70 C26 52 25 40 23 30 L37 30 C35 40 34 52 35 70 Z" fill="url(#{uid}-stem)" />
						<ellipse cx="30" cy="36" rx="13" ry="3.6" fill="#ffd25a" opacity="0.8" />
						<path d="M8 30 C2 30 2 20 9 18 C8 9 18 4 24 9 C27 2 37 2 39 9 C46 5 55 11 51 19 C58 21 57 31 50 30 Z" fill="url(#{uid}-cap)" stroke="#7a2410" stroke-width="1" />
						<path d="M14 22 C18 16 26 15 30 19 M33 14 C38 12 44 15 45 20" fill="none" stroke="#fff6c0" stroke-width="1.6" stroke-linecap="round" opacity="0.7" />
					</svg></span
				>
			{/if}</span
		>
	{/if}
	{#if extra.back}
		<!-- a rifle on the back, in its ladder camo, behind the right shoulder -->
		<span class="og-back" data-back={extra.back} aria-hidden="true"><WeaponIcon look={BACK_LOOK} camo={BACK_CAMO[extra.back] ?? null} /></span>
	{/if}
	<span class="og-body"
		>{@render children()}{#if extra.nose}<span class="og-nose" style:left="{(extra.nose[0] / 64) * 100}%" style:top="{(extra.nose[1] / 64) * 100}%" aria-hidden="true"></span>{/if}</span
	>
	{#if fx === 'fx-burgers'}
		<span class="og-orbit" aria-hidden="true">
			{#each [0, 120, 240] as a (a)}
				<i style:--a="{a}deg"
					><svg viewBox="0 0 24 24" width="14" height="14"
						><path d="M3 11c0-4.4 4-7 9-7s9 2.6 9 7z" fill="#e0a040" stroke="#5a3200" stroke-width="1.4" /><path d="M2.5 12.5h19l-1.5 2h-16z" fill="#4fb23a" /><rect x="3" y="14.2" width="18" height="2.8" rx="1.2" fill="#6b3a1c" /><path
							d="M3.5 17.5h17c0 2-1.5 3-3.5 3H7c-2 0-3.5-1-3.5-3z"
							fill="#e0a040"
							stroke="#5a3200"
							stroke-width="1.4"
						/></svg
					></i
				>
			{/each}
		</span>
	{:else if fx === 'fx-leaves'}
		<!-- Leaf Storm: cannabis leaves swirling round the emblem -->
		<span class="og-fx og-leaves" aria-hidden="true">
			{#each PARTS as p, i (i)}
				<i style:left="{p.x}%" style:top="{p.y}%" style:animation-delay="-{p.d * 1.3}s"
					><svg viewBox="0 0 24 24" width="13" height="13"
						>{#each LEAF_PATHS as d, j (j)}<path {d} fill={i % 2 ? '#3fb34a' : '#6fd34a'} stroke="#14501a" stroke-width="0.8" />{/each}<path
							d={LEAF_STEM}
							stroke="#14501a"
							stroke-width="1.4"
						/></svg
					></i
				>
			{/each}
		</span>
	{:else if fx === 'fx-munchies'}
		<!-- Munchies: snacks floating round the emblem -->
		<span class="og-fx og-munchies" aria-hidden="true">
			{#each PARTS.slice(0, 6) as p, i (i)}
				<i style:left="{p.x}%" style:top="{p.y}%" style:animation-delay="-{p.d}s"
					><svg viewBox="0 0 24 24" width="14" height="14">
						{#if i % 6 === 0}
							<!-- pizza slice -->
							<path d="M4 5 Q12 1 20 5 L12 22 Z" fill="#ffcf4a" stroke="#6a3a0a" stroke-width="1.3" stroke-linejoin="round" /><path d="M4 5 Q12 1 20 5" fill="none" stroke="#c9822a" stroke-width="2.4" /><circle cx="10" cy="9" r="1.6" fill="#d8352a" /><circle cx="14" cy="12" r="1.5" fill="#d8352a" /><circle cx="12" cy="16.5" r="1.2" fill="#d8352a" />
						{:else if i % 6 === 1}
							<!-- donut -->
							<circle cx="12" cy="12" r="9" fill="#e0a050" stroke="#6a3a0a" stroke-width="1.3" /><path d="M5 10 Q6 4 12 3.6 Q18 4 19.4 10 Q17 12 15.2 10.4 Q12 13 9 10.6 Q7 12.4 5 10 Z" fill="#ff7ab8" /><circle cx="12" cy="12" r="3" fill="#1d0e05" /><path d="M8 7 l1 1 M14 6 l-1 1.2 M16.5 8.6 l1.2 .4" stroke="#fff" stroke-width="1.1" stroke-linecap="round" />
						{:else if i % 6 === 2}
							<!-- crisps packet -->
							<path d="M5 3 L19 3 L18 21 L6 21 Z" fill="#e2261f" stroke="#5a0a0a" stroke-width="1.3" stroke-linejoin="round" /><path d="M5 3 l1.4 1.6 l1.4 -1.6 l1.4 1.6 l1.4 -1.6 l1.4 1.6 l1.4 -1.6 l1.4 1.6 l1.4 -1.6 l1.4 1.6 l1.4 -1.6" fill="none" stroke="#5a0a0a" stroke-width="0.9" /><ellipse cx="12" cy="13" rx="4" ry="3" fill="#ffd23a" />
						{:else if i % 6 === 3}
							<!-- burger -->
							<path d="M3 11c0-4.4 4-7 9-7s9 2.6 9 7z" fill="#e0a040" stroke="#5a3200" stroke-width="1.4" /><path d="M2.5 12.5h19l-1.5 2h-16z" fill="#4fb23a" /><rect x="3" y="14.2" width="18" height="2.8" rx="1.2" fill="#6b3a1c" /><path d="M3.5 17.5h17c0 2-1.5 3-3.5 3H7c-2 0-3.5-1-3.5-3z" fill="#e0a040" stroke="#5a3200" stroke-width="1.4" />
						{:else if i % 6 === 4}
							<!-- fries -->
							<path d="M7 9 L8 2 M10 9 L10.5 1.5 M13 9 L13.4 2 M16 9 L16 2.5" stroke="#ffd23a" stroke-width="2.4" stroke-linecap="round" /><path d="M5 8 L19 8 L17 22 L7 22 Z" fill="#e2261f" stroke="#5a0a0a" stroke-width="1.3" stroke-linejoin="round" />
						{:else}
							<!-- chocolate bar -->
							<rect x="5" y="3" width="14" height="18" rx="1.5" fill="#5a2e14" stroke="#2a1006" stroke-width="1.3" /><path d="M5 9 H19 M5 15 H19 M12 3 V21" stroke="#3a1a08" stroke-width="1" /><path d="M5 14 L19 10 L19 21 L5 21 Z" fill="#c9d3dc" stroke="#2a1006" stroke-width="1" />
						{/if}
					</svg></i
				>
			{/each}
		</span>
	{:else if fx === 'fx-glitch'}
		<!-- Glitch: torn red / cyan bars flash across while the emblem itself jumps (CSS on .og-body) -->
		<span class="og-glitch" aria-hidden="true"><i></i><i></i><i></i></span>
	{:else if fx}
		<span class="og-fx" data-effect={fx} aria-hidden="true">
			{#each PARTS as p, i (i)}<i style:left="{p.x}%" style:top="{p.y}%" style:animation-delay="-{p.d}s"></i>{/each}
		</span>
	{/if}
	{#if shown}
		{#key shown.at}
			{#if shown.k === 'emote-ring'}
				<!-- Smoke Ring: three rings blown up from the mouth -->
				<span class="og-emote og-rings" aria-hidden="true"><i></i><i></i><i></i></span>
			{:else if shown.k === 'emote-flex'}
				<!-- Flex: two big arms pop out and pump (the emblem bounces, CSS on .og-body) -->
				<span class="og-emote og-flex" aria-hidden="true">
					{#each ['l', 'r'] as side (side)}
						<!-- the left arm is the right one mirrored in its own box (shoulder on the side next to the body) -->
						<svg class="og-arm" data-side={side} viewBox="0 0 40 40"
							><g transform={side === 'l' ? 'matrix(-1 0 0 1 40 0)' : undefined}
							><path
								d="M1 28 C4 22 9 19 14 19 C17 14 23 14 25 18 L24 11 C23 5 31 2 34 7 C37 11 34 15 31 15 L31 27 C31 33 26 36 20 35 L1 35 Z"
								fill="#c98a5a"
								stroke="#3a2010"
								stroke-width="1.6"
								stroke-linejoin="round"
							/><path d="M14 19 C17 22 22 22 25 18" fill="none" stroke="#3a2010" stroke-width="1.2" stroke-linecap="round" /><path
								d="M16 24 C19 22 23 23 24 26"
								fill="none"
								stroke="#f0c090"
								stroke-width="1.4"
								stroke-linecap="round"
							/></g
						></svg
						>
					{/each}
				</span>
			{:else if shown.k === 'emote-burger'}
				<!-- Burger Bite: a big burger in front of the face, bitten twice, crumbs falling -->
				<span class="og-emote og-bite" aria-hidden="true">
					<svg viewBox="0 0 40 30" width="100%" height="100%">
						<defs>
							<mask id="{uid}-bite">
								<rect x="-5" y="-5" width="50" height="40" fill="#fff" />
								<circle class="og-b1" cx="31" cy="6" r="7" fill="#000" />
								<circle class="og-b2" cx="35" cy="14" r="6.5" fill="#000" />
							</mask>
						</defs>
						<g mask="url(#{uid}-bite)">
							<path d="M3 14c0-7.5 7-11.5 17-11.5s17 4 17 11.5z" fill="#e0a040" stroke="#5a3200" stroke-width="1.4" />
							<circle cx="12" cy="8" r="0.9" fill="#fff4d0" /><circle cx="19" cy="6" r="0.9" fill="#fff4d0" /><circle cx="26" cy="8.5" r="0.9" fill="#fff4d0" />
							<path d="M2 15.5h36l-2.5 3h-31z" fill="#4fb23a" />
							<path d="M4 18h32l-3 3.4-3-3h-3l-3 3-3-3h-3l-3 3-3-3H8l-3 3z" fill="#ffcf3a" />
							<rect x="3" y="19.5" width="34" height="4.4" rx="2" fill="#6b3a1c" />
							<path d="M4 24.5h32c0 3-2.6 4.5-6 4.5H10c-3.4 0-6-1.5-6-4.5z" fill="#e0a040" stroke="#5a3200" stroke-width="1.4" />
						</g>
					</svg>
					{#each [0, 1, 2, 3, 4] as c (c)}<i style:--c={c}></i>{/each}
				</span>
			{/if}
		{/key}
	{/if}
	{#if badge}<span class="og-pin" aria-hidden="true"><ShopPin id={badge} size={pin} /></span>{/if}
	{#if pet}<span class="og-pet" aria-hidden="true"><ShopPet id={pet} size={Math.round(pin * 1.6)} /></span>{/if}
	{#if extra.masked}
		<!-- their own Gas Mask: no pranks stick to them for a day -->
		<span class="og-mask" aria-hidden="true"
			><svg viewBox="0 0 24 24" width={pin} height={pin}
				><circle cx="12" cy="12" r="11" fill="#1f3a28" stroke="#9ff0b0" stroke-width="1.4" /><path
					d="M5.5 9.5C5.5 6 8.5 4.5 12 4.5s6.5 1.5 6.5 5c0 3-1 5-3 6.2L14 19h-4l-1.5-3.3C6.5 14.5 5.5 12.5 5.5 9.5z"
					fill="#56606a"
					stroke="#0d1410"
					stroke-width="1"
				/><circle cx="9.2" cy="9.6" r="2.1" fill="#bfe8ff" stroke="#0d1410" stroke-width="0.8" /><circle cx="14.8" cy="9.6" r="2.1" fill="#bfe8ff" stroke="#0d1410" stroke-width="0.8" /><rect
					x="9.6"
					y="14.4"
					width="4.8"
					height="5.6"
					rx="1.4"
					fill="#8a949e"
					stroke="#0d1410"
					stroke-width="0.8"
				/></svg
			></span
		>
	{/if}
	{#if smoked}
		<span class="og-bomb" aria-hidden="true">
			{#each [[30, 40, 0], [62, 34, -0.8], [46, 62, -1.6], [22, 66, -2.2], [74, 64, -0.4], [50, 22, -1.2], [40, 48, -2.6]] as [x, y, d], i (i)}
				<i style:left="{x}%" style:top="{y}%" style:animation-delay="{d}s"></i>
			{/each}
		</span>
	{/if}
	{#if extra.ontap}
		<!-- your own operator with an emote worn: tap to play it for the squad -->
		<button type="button" class="og-tap" aria-label={extra.tapLabel} title={extra.tapLabel} onclick={() => extra.ontap?.()}></button>
	{/if}
</span>

<style>
	.og {
		position: relative;
		display: inline-grid;
		place-items: center;
		flex: none;
		isolation: isolate;
	}
	.og-body {
		position: relative;
		z-index: 1;
		display: grid;
		place-items: center;
	}
	/* ---------- auras: a glow behind the emblem ---------- */
	.og-aura {
		position: absolute;
		inset: -24%;
		z-index: 0;
		border-radius: 999px;
		pointer-events: none;
	}
	.og-aura i {
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}
	.og-aura[data-aura='aura-gold'] i {
		background: radial-gradient(circle, rgb(255 214 80 / 0.85) 0 30%, rgb(255 170 20 / 0.35) 52%, transparent 70%);
		animation: og-breathe 2.6s ease-in-out infinite;
	}
	.og-aura[data-aura='aura-toxic'] i {
		background: radial-gradient(circle at 50% 55%, rgb(130 255 60 / 0.8) 0 26%, rgb(60 200 30 / 0.4) 50%, transparent 70%);
		filter: blur(2px);
		animation: og-wobble 3.4s ease-in-out infinite;
	}
	.og-aura[data-aura='aura-neon'] i {
		inset: 10%;
		box-shadow:
			0 0 0 3px #5ce1ff,
			0 0 16px 4px #5ce1ff,
			inset 0 0 14px 2px #ff5ca8;
		animation: og-neon 2s ease-in-out infinite alternate;
	}
	.og-aura[data-aura='aura-fire'] i {
		background:
			radial-gradient(ellipse 45% 60% at 50% 70%, rgb(255 240 120 / 0.95), transparent 70%),
			radial-gradient(ellipse 60% 75% at 50% 62%, rgb(255 120 20 / 0.85), transparent 72%),
			radial-gradient(ellipse 70% 90% at 50% 55%, rgb(220 30 20 / 0.6), transparent 75%);
		filter: blur(1.5px);
		transform-origin: 50% 90%;
		animation: og-flicker 0.9s ease-in-out infinite alternate;
	}
	.og-aura[data-aura='aura-iri'] i {
		inset: 6%;
		background: conic-gradient(from 0deg, #ff5ca8, #ffd23a, #7dff6a, #5ce1ff, #b265ff, #ff5ca8);
		filter: blur(7px);
		opacity: 0.85;
		animation: og-spin 5s linear infinite;
	}
	/* Kush Cloud: thick green smoke rolling round the emblem */
	.og-aura[data-aura='aura-kush'] i {
		background:
			radial-gradient(circle at 30% 40%, rgb(140 255 90 / 0.75) 0 18%, transparent 42%),
			radial-gradient(circle at 70% 35%, rgb(90 220 60 / 0.7) 0 20%, transparent 44%),
			radial-gradient(circle at 50% 70%, rgb(60 190 40 / 0.65) 0 24%, transparent 50%),
			radial-gradient(circle, rgb(40 140 30 / 0.45) 0 40%, transparent 70%);
		filter: blur(3px);
		animation: og-kush 6s ease-in-out infinite;
	}
	@keyframes og-kush {
		0%,
		100% {
			transform: rotate(0deg) scale(1);
		}
		50% {
			transform: rotate(40deg) scale(1.12);
		}
	}
	.og-aura[data-aura='aura-storm'] i {
		background: radial-gradient(circle, rgb(120 170 255 / 0.75) 0 28%, rgb(40 70 200 / 0.45) 52%, transparent 70%);
		animation: og-storm 3.2s steps(1) infinite;
	}
	.og-aura[data-aura='aura-storm']::after {
		/* a lightning bolt now and then */
		content: '';
		position: absolute;
		inset: 8% 30% 30% 38%;
		background: linear-gradient(160deg, transparent 40%, #e8f4ff 41% 47%, transparent 48%), linear-gradient(200deg, transparent 52%, #e8f4ff 53% 58%, transparent 59%);
		opacity: 0;
		filter: drop-shadow(0 0 4px #9ac8ff);
		animation: og-bolt 3.2s steps(1) infinite;
	}
	@keyframes og-breathe {
		50% {
			transform: scale(1.1);
			opacity: 0.75;
		}
	}
	@keyframes og-wobble {
		33% {
			transform: translate(3%, -2%) scale(1.06);
		}
		66% {
			transform: translate(-3%, 2%) scale(0.96);
		}
	}
	@keyframes og-neon {
		to {
			box-shadow:
				0 0 0 3px #ff5ca8,
				0 0 18px 5px #ff5ca8,
				inset 0 0 14px 2px #5ce1ff;
		}
	}
	@keyframes og-flicker {
		to {
			transform: scaleY(1.12) scaleX(0.95);
			opacity: 0.85;
		}
	}
	@keyframes og-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes og-storm {
		0%,
		30%,
		38%,
		100% {
			opacity: 0.8;
		}
		32%,
		36% {
			opacity: 1;
			filter: brightness(1.8);
		}
	}
	@keyframes og-bolt {
		0%,
		30%,
		38%,
		100% {
			opacity: 0;
		}
		32%,
		36% {
			opacity: 1;
		}
	}
	/* ---------- effects: particles around the emblem ---------- */
	.og-fx {
		position: absolute;
		inset: -14%;
		z-index: 2;
		pointer-events: none;
	}
	.og-fx i {
		position: absolute;
		display: block;
	}
	.og-fx[data-effect='fx-sparkle'] i {
		width: 9px;
		height: 9px;
		background: #fff6b0;
		clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
		filter: drop-shadow(0 0 3px #ffd23a);
		animation: og-twinkle 2.4s ease-in-out infinite;
	}
	.og-fx[data-effect='fx-embers'] i {
		width: 4px;
		height: 4px;
		border-radius: 999px;
		background: #ffb02a;
		box-shadow: 0 0 6px 2px rgb(255 100 20 / 0.8);
		animation: og-rise 2.4s ease-out infinite;
	}
	.og-fx[data-effect='fx-smoke'] i {
		width: 16px;
		height: 16px;
		border-radius: 999px;
		background: rgb(220 226 220 / 0.7);
		filter: blur(4px);
		animation: og-puff 3.6s ease-out infinite;
	}
	.og-fx[data-effect='fx-diamonds'] i {
		width: 7px;
		height: 7px;
		background: linear-gradient(135deg, #fff, #5ce1ff 60%, #1a6ad8);
		clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
		filter: drop-shadow(0 0 3px #9ae8ff);
		animation: og-dust 3s ease-in-out infinite;
	}
	@keyframes og-twinkle {
		0%,
		100% {
			transform: scale(0.2) rotate(0deg);
			opacity: 0;
		}
		50% {
			transform: scale(1.2) rotate(45deg);
			opacity: 1;
		}
	}
	@keyframes og-rise {
		0% {
			transform: translateY(8px);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		100% {
			transform: translateY(-26px);
			opacity: 0;
		}
	}
	@keyframes og-puff {
		0% {
			transform: translateY(4px) scale(0.4);
			opacity: 0;
		}
		25% {
			opacity: 0.8;
		}
		100% {
			transform: translateY(-22px) scale(1.6);
			opacity: 0;
		}
	}
	@keyframes og-dust {
		0%,
		100% {
			transform: translateY(-4px) scale(0.3);
			opacity: 0;
		}
		50% {
			transform: translateY(6px) scale(1);
			opacity: 1;
		}
	}
	/* Leaf Storm: leaves tumbling round and down */
	.og-leaves i {
		animation: og-leaf 3.4s ease-in-out infinite;
	}
	.og-leaves i :global(svg) {
		display: block;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.6));
	}
	@keyframes og-leaf {
		0% {
			transform: translate(0, -10px) rotate(0deg) scale(0.6);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		100% {
			transform: translate(8px, 16px) rotate(320deg) scale(1);
			opacity: 0;
		}
	}
	/* Munchies: snacks bobbing round the emblem */
	.og-munchies i {
		animation: og-munch 2.6s ease-in-out infinite alternate;
	}
	.og-munchies i :global(svg) {
		display: block;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.6));
	}
	@keyframes og-munch {
		from {
			transform: translateY(-4px) rotate(-14deg);
		}
		to {
			transform: translateY(4px) rotate(14deg);
		}
	}
	/* burgers circling the emblem */
	.og-orbit {
		position: absolute;
		inset: -10%;
		z-index: 2;
		container-type: size;
		pointer-events: none;
		animation: og-spin 6s linear infinite;
	}
	/* each burger sits on the circle's edge (half the box up from the middle), turned to its place */
	.og-orbit i {
		position: absolute;
		left: 50%;
		top: 50%;
		display: block;
		width: 14px;
		height: 14px;
		margin: -7px;
		transform: rotate(var(--a)) translateY(-50cqh) rotate(calc(-1 * var(--a)));
	}
	.og-orbit i :global(svg) {
		display: block;
		animation: og-spin 6s linear infinite reverse;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.6));
	}
	/* ---------- a Smoke Bomb: thick grey clouds over the whole emblem ---------- */
	.og-bomb {
		position: absolute;
		inset: -16%;
		z-index: 4;
		pointer-events: none;
	}
	.og-bomb i {
		position: absolute;
		width: 62%;
		height: 62%;
		margin: -31% 0 0 -31%;
		border-radius: 999px;
		background: radial-gradient(circle at 40% 35%, rgb(235 238 235 / 0.97), rgb(170 176 172 / 0.92) 55%, rgb(120 126 122 / 0) 72%);
		filter: blur(1.5px);
		animation: og-bomb 3.2s ease-in-out infinite alternate;
	}
	@keyframes og-bomb {
		from {
			transform: translate(-6%, 4%) scale(0.92);
		}
		to {
			transform: translate(6%, -6%) scale(1.1);
		}
	}
	/* ---------- the ideas pack (2026-11-20) ---------- */
	/* Nuke: a sick radioactive glow… */
	.og-aura[data-aura='aura-nuke'] i {
		background: radial-gradient(circle, rgb(210 255 70 / 0.9) 0 24%, rgb(120 230 40 / 0.5) 46%, rgb(60 160 20 / 0.2) 60%, transparent 72%);
		animation: og-rad 1.6s ease-in-out infinite;
	}
	@keyframes og-rad {
		50% {
			transform: scale(1.12);
			filter: brightness(1.35);
		}
	}
	/* …and a mushroom cloud that grows up behind the emblem every 10 s */
	.og-mush {
		position: absolute;
		left: 18%;
		right: 18%;
		bottom: 30%;
		height: 92%;
		transform-origin: 50% 100%;
		opacity: 0;
		animation: og-mush 10s ease-out infinite;
	}
	.og-mush svg {
		display: block;
		filter: drop-shadow(0 0 6px rgb(255 160 40 / 0.8));
	}
	@keyframes og-mush {
		0% {
			transform: scale(0.15, 0.1);
			opacity: 0;
		}
		6% {
			opacity: 1;
		}
		22% {
			transform: scale(1, 1);
			opacity: 1;
		}
		55% {
			transform: scale(1.06, 1.04);
			opacity: 0.85;
		}
		72%,
		100% {
			transform: scale(1.12, 1.06) translateY(-6%);
			opacity: 0;
		}
	}
	/* the rifle on the back: tilted behind the right shoulder, muzzle up */
	.og-back {
		position: absolute;
		z-index: 0;
		right: -46%;
		top: 4%;
		width: 118%;
		transform: rotate(-52deg);
		pointer-events: none;
	}
	.og-back :global(.weapon-icon) {
		display: block;
		width: 100%;
		height: auto;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.7));
	}
	.og-back[data-back='back-div'] :global(.weapon-icon) {
		filter: drop-shadow(0 0 4px rgb(200 170 255 / 0.8)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.7));
	}
	/* Glitch: the emblem jumps and splits red / cyan for a moment every few seconds… */
	.og[data-effect='fx-glitch'] .og-body {
		animation: og-glitch 3s steps(1) infinite;
	}
	@keyframes og-glitch {
		0%,
		70%,
		79%,
		87%,
		91%,
		100% {
			transform: none;
			filter: none;
			clip-path: none;
		}
		72% {
			transform: translate(-3px, 0);
			filter: drop-shadow(3px 0 0 rgb(255 40 70 / 0.9)) drop-shadow(-3px 0 0 rgb(40 230 255 / 0.9));
			clip-path: inset(8% 0 52% 0);
		}
		74% {
			transform: translate(4px, 0);
			filter: drop-shadow(-3px 0 0 rgb(255 40 70 / 0.9)) drop-shadow(3px 0 0 rgb(40 230 255 / 0.9));
			clip-path: inset(46% 0 14% 0);
		}
		76% {
			transform: translate(-1px, 1px);
			filter: drop-shadow(4px 0 0 rgb(255 40 70 / 0.8)) drop-shadow(-4px 0 0 rgb(40 230 255 / 0.8));
		}
		88% {
			transform: translate(2px, 0);
			filter: drop-shadow(-2px 0 0 rgb(255 40 70 / 0.9)) drop-shadow(2px 0 0 rgb(40 230 255 / 0.9));
			clip-path: inset(30% 0 38% 0);
		}
	}
	/* …while torn bars flash across it */
	.og-glitch {
		position: absolute;
		inset: -6% -14%;
		z-index: 2;
		pointer-events: none;
	}
	.og-glitch i {
		position: absolute;
		left: 0;
		right: 0;
		height: 7%;
		opacity: 0;
		mix-blend-mode: screen;
		animation: og-bar 3s steps(1) infinite;
	}
	.og-glitch i:nth-child(1) {
		top: 22%;
		background: rgb(255 40 70 / 0.85);
	}
	.og-glitch i:nth-child(2) {
		top: 55%;
		height: 4%;
		background: rgb(40 230 255 / 0.85);
		animation-delay: -0.12s;
	}
	.og-glitch i:nth-child(3) {
		top: 74%;
		height: 3%;
		background: rgb(255 255 255 / 0.7);
		animation-delay: -0.3s;
	}
	@keyframes og-bar {
		0%,
		70%,
		77%,
		87%,
		90%,
		100% {
			opacity: 0;
			transform: none;
		}
		72% {
			opacity: 1;
			transform: translateX(-10%);
		}
		75% {
			opacity: 1;
			transform: translateX(12%);
		}
		88% {
			opacity: 1;
			transform: translateX(-6%);
		}
	}
	/* ---------- emotes ---------- */
	.og-emote {
		position: absolute;
		inset: 0;
		z-index: 3;
		pointer-events: none;
	}
	/* Smoke Ring: rings blown up from the mouth, growing and fading */
	.og-rings i {
		position: absolute;
		left: 50%;
		top: 42%;
		width: 34%;
		aspect-ratio: 1.4;
		border: 3px solid rgb(232 238 232 / 0.95);
		border-radius: 50%;
		filter: blur(0.6px) drop-shadow(0 0 3px rgb(255 255 255 / 0.6));
		opacity: 0;
		animation: og-ring 2.4s ease-out infinite;
	}
	.og-rings i:nth-child(2) {
		animation-delay: 0.8s;
	}
	.og-rings i:nth-child(3) {
		animation-delay: 1.6s;
	}
	@keyframes og-ring {
		0% {
			transform: translate(-50%, 0) scale(0.25);
			opacity: 0;
		}
		15% {
			opacity: 1;
		}
		100% {
			transform: translate(-30%, -150%) scale(1.7);
			opacity: 0;
		}
	}
	/* Flex: the emblem bounces, arms pop out at the sides and pump */
	.og[data-emote='emote-flex'] .og-body {
		animation: og-bounce 0.8s ease-in-out infinite;
	}
	@keyframes og-bounce {
		50% {
			transform: translateY(-6%) scale(1.06);
		}
	}
	.og-arm {
		position: absolute;
		top: 34%;
		width: 50%;
		height: 50%;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.6));
		animation: og-pump 0.8s ease-in-out infinite;
	}
	.og-arm[data-side='l'] {
		left: -36%;
		transform-origin: 100% 80%;
		animation-name: og-pump-l;
	}
	@keyframes og-pump-l {
		0%,
		100% {
			transform: rotate(0deg) scale(0.9);
		}
		50% {
			transform: rotate(14deg) scale(1.08);
		}
	}
	.og-arm[data-side='r'] {
		right: -36%;
		transform-origin: 0% 80%;
	}
	@keyframes og-pump {
		0%,
		100% {
			transform: rotate(0deg) scale(0.9);
		}
		50% {
			transform: rotate(-14deg) scale(1.08);
		}
	}
	/* Burger Bite: the burger comes up, two bites go, crumbs fall */
	.og-bite svg {
		position: absolute;
		left: 18%;
		top: 46%;
		width: 64%;
		height: auto;
		filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.6));
		animation: og-burger 2.6s ease-in-out infinite;
	}
	@keyframes og-burger {
		0% {
			transform: translateY(40%) scale(0.6);
			opacity: 0;
		}
		12%,
		88% {
			transform: none;
			opacity: 1;
		}
		100% {
			transform: translateY(20%);
			opacity: 0;
		}
	}
	.og-b1,
	.og-b2 {
		transform-box: fill-box;
		transform-origin: center;
		transform: scale(0);
		animation: og-chomp 2.6s steps(1) infinite;
	}
	.og-b2 {
		animation-name: og-chomp2;
	}
	@keyframes og-chomp {
		0%,
		38% {
			transform: scale(0);
		}
		40%,
		100% {
			transform: scale(1);
		}
	}
	@keyframes og-chomp2 {
		0%,
		64% {
			transform: scale(0);
		}
		66%,
		100% {
			transform: scale(1);
		}
	}
	.og-bite i {
		position: absolute;
		left: calc(66% + var(--c) * 4%);
		top: 52%;
		width: 5%;
		aspect-ratio: 1;
		border-radius: 2px;
		background: #e0a040;
		opacity: 0;
		animation: og-crumb 2.6s ease-in infinite;
		animation-delay: calc(var(--c) * 0.05s);
	}
	@keyframes og-crumb {
		0%,
		40% {
			transform: none;
			opacity: 0;
		}
		42% {
			opacity: 1;
		}
		70% {
			transform: translate(calc(var(--c) * 3px - 6px), 26px) rotate(160deg);
			opacity: 0;
		}
		100% {
			opacity: 0;
		}
	}
	/* a friend's Clown Nose: red, shiny, honking */
	.og-nose {
		position: absolute;
		width: 21%;
		aspect-ratio: 1;
		translate: -50% -50%;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 32%, #fff 0 9%, #ff6a6a 16%, #e01a1a 52%, #8a0606 100%);
		box-shadow:
			0 1px 2px rgb(0 0 0 / 0.6),
			0 0 6px rgb(255 40 40 / 0.6);
		pointer-events: none;
		animation: og-honk 1.8s ease-in-out infinite;
	}
	@keyframes og-honk {
		0%,
		70%,
		100% {
			transform: scale(1);
		}
		76% {
			transform: scale(1.3, 0.8);
		}
		82% {
			transform: scale(0.88, 1.15);
		}
	}
	/* their own Gas Mask, on the top-left corner */
	.og-mask {
		position: absolute;
		left: -6%;
		top: -6%;
		z-index: 3;
		pointer-events: none;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.6));
	}
	/* your own emblem with an emote: the whole thing is a button */
	.og-tap {
		position: absolute;
		inset: 0;
		z-index: 6;
		min-width: 44px;
		min-height: 44px;
		border-radius: 12px;
		cursor: pointer;
	}
	.og-tap:hover {
		box-shadow: 0 0 0 2px rgb(255 201 40 / 0.55);
	}
	.og-tap:focus-visible {
		outline: 2px solid var(--t-accent);
		outline-offset: 2px;
	}
	/* ---------- the pin on the corner ---------- */
	.og-pin {
		position: absolute;
		right: -6%;
		bottom: -4%;
		z-index: 3;
		pointer-events: none;
	}
	/* ---------- the sidekick, sitting on the left shoulder ---------- */
	.og-pet {
		position: absolute;
		left: -10%;
		bottom: 2%;
		z-index: 3;
		pointer-events: none;
	}
	/* ---------- callsign styles + title plates (global: OperatorTag and the shop use them) ---------- */
	/* the gradient styles paint the letters with their background, which a text-shadow would cover
	   (shadows are drawn above the background): they get drop-shadow filters instead */
	:global(.og-name[data-style='name-gold']),
	:global(.og-name[data-style='name-chrome']),
	:global(.og-name[data-style='name-fire']),
	:global(.og-name[data-style='name-rainbow']),
	:global(.og-name[data-style='name-rasta']) {
		text-shadow: none !important;
		-webkit-text-stroke: 0 !important;
	}
	:global(.og-name[data-style='name-gold']) {
		background: linear-gradient(180deg, #fff6b0, #ffc928 50%, #c47a00);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.7));
	}
	:global(.og-name[data-style='name-chrome']) {
		background: linear-gradient(180deg, #ffffff 0%, #c9d3dc 40%, #5a6470 52%, #e8eef4 70%, #8a96a2 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.75));
	}
	:global(.og-name[data-style='name-toxic']) {
		color: #9dff5c;
		text-shadow:
			0 0 6px rgb(120 255 60 / 0.9),
			0 0 14px rgb(60 200 30 / 0.7);
	}
	:global(.og-name[data-style='name-fire']) {
		background: linear-gradient(0deg, #ff2a1a 0%, #ff8a1a 45%, #ffe680 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 0 4px rgb(255 100 20 / 0.8)) drop-shadow(0 1px 0 rgb(0 0 0 / 0.7));
	}
	:global(.og-name[data-style='name-rainbow']) {
		background: linear-gradient(90deg, #ff5ca8, #ffd23a, #7dff6a, #5ce1ff, #b265ff, #ff5ca8);
		background-size: 200% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.7));
		animation: og-rainbow 4s linear infinite;
	}
	/* Rasta: red, gold and green bands across the letters */
	:global(.og-name[data-style='name-rasta']) {
		background: linear-gradient(180deg, #ff3a2a 0 34%, #ffd23a 34% 66%, #2fc85a 66%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.85)) drop-shadow(0 0 4px rgb(60 200 80 / 0.5));
	}
	@keyframes og-rainbow {
		to {
			background-position: 200% 0;
		}
	}
	:global(.og-title) {
		display: inline-block;
		margin-top: 2px;
		padding: 1px 8px;
		border: 1px solid var(--og-r, #9aa3ad);
		border-radius: 4px;
		background: color-mix(in srgb, var(--og-r, #9aa3ad) 22%, rgb(0 0 0 / 0.45));
		color: #fff;
		font-family: var(--t-font-head);
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.16em;
		line-height: 1.5;
		text-transform: uppercase;
		white-space: nowrap;
		text-shadow: 0 1px 1px rgb(0 0 0 / 0.6);
	}
	:global(.og-title[data-rarity='rare']) {
		--og-r: #4f9bff;
	}
	:global(.og-title[data-rarity='epic']) {
		--og-r: #b265ff;
	}
	:global(.og-title[data-rarity='legendary']) {
		--og-r: #ffc928;
		box-shadow: 0 0 8px rgb(255 201 40 / 0.6);
	}
	@media (prefers-reduced-motion: reduce) {
		.og-aura i,
		.og-aura::after,
		.og-orbit,
		.og-orbit i :global(svg),
		.og-fx i,
		.og-leaves i,
		.og-munchies i,
		.og-bomb i,
		.og-mush,
		.og[data-effect='fx-glitch'] .og-body,
		.og-glitch i,
		.og[data-emote='emote-flex'] .og-body,
		.og-emote i,
		.og-emote svg,
		.og-arm,
		.og-b1,
		.og-b2,
		.og-nose,
		:global(.og-name[data-style='name-rainbow']) {
			animation: none !important;
		}
		.og-fx i {
			opacity: 0.8;
		}
		/* still pictures: the cloud stands, one ring, the burger with one bite */
		.og-mush {
			opacity: 0.7;
			transform: scale(0.8);
		}
		.og-rings i:first-child {
			opacity: 0.9;
			transform: translate(-40%, -70%);
		}
		.og-b1 {
			transform: scale(1);
		}
	}
</style>
