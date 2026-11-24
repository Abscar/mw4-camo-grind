<!--
	A case's box (cases.ts): our own drawing of a hard weapon case in the case's two colours. Rounded shell with
	a lid seam, carry handle, gold latches, metal corner guards and moulded ribs, and a dark glass window on the
	front showing the case's best item, lit in that item's grade colour. `open` lifts the lid and floats the item
	up. Decoration (the case's name is always written next to it).
-->
<script lang="ts">
	import { CASE_BY_ID, GRADES } from '#lib/cases.ts';
	import CaseItemArt from './CaseItemArt.svelte';

	let { id, size = 120, open = false }: { id: string; size?: number; open?: boolean } = $props();
	const c = $derived(CASE_BY_ID.get(id));
	const u = $props.id();
	const glow = $derived(c ? GRADES[c.items[0].grade].colour : '#fff');
</script>

{#if c}
	<span class="cb" class:open style:--c1={c.colour} style:--c2={c.colour2} style:--glow={glow} style:--s="{size}px" aria-hidden="true">
		<svg viewBox="0 0 120 96" class="cb-svg">
			<defs>
				<linearGradient id="{u}-shell" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" style="stop-color: color-mix(in srgb, {c.colour} 70%, white)" />
					<stop offset=".35" stop-color={c.colour} />
					<stop offset="1" stop-color={c.colour2} />
				</linearGradient>
				<linearGradient id="{u}-lid" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" style="stop-color: color-mix(in srgb, {c.colour} 55%, white)" />
					<stop offset="1" stop-color={c.colour} />
				</linearGradient>
				<linearGradient id="{u}-metal" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stop-color="#f4f7fa" />
					<stop offset=".5" stop-color="#9aa4ad" />
					<stop offset="1" stop-color="#5d6770" />
				</linearGradient>
				<linearGradient id="{u}-gold" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stop-color="#fff2b0" />
					<stop offset=".5" stop-color="#e8b23a" />
					<stop offset="1" stop-color="#8a5a10" />
				</linearGradient>
				<radialGradient id="{u}-win" cx=".5" cy=".55" r=".7">
					<stop offset="0" stop-color={glow} stop-opacity=".55" />
					<stop offset=".6" stop-color="#0b0a12" stop-opacity=".9" />
					<stop offset="1" stop-color="#050408" />
				</radialGradient>
				<pattern id="{u}-ribs" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
					<rect width="2.2" height="7" fill="#fff" opacity=".07" />
				</pattern>
			</defs>
			<!-- floor shadow -->
			<ellipse cx="60" cy="91" rx="50" ry="4" fill="#000" opacity=".45" />
			<!-- handle -->
			<path d="M44 20 v-7 a5 5 0 0 1 5 -5 h22 a5 5 0 0 1 5 5 v7" fill="none" stroke="#141218" stroke-width="5.5" stroke-linecap="round" />
			<path d="M44 20 v-7 a5 5 0 0 1 5 -5 h22 a5 5 0 0 1 5 5 v7" fill="none" stroke="#3a3842" stroke-width="2.4" stroke-linecap="round" />
			<!-- body -->
			<g class="cb-body">
				<rect x="5" y="36" width="110" height="52" rx="9" fill="url(#{u}-shell)" stroke="#0b0b0f" stroke-width="2" />
				<rect x="5" y="36" width="110" height="52" rx="9" fill="url(#{u}-ribs)" />
				<path d="M14 86 h92" stroke="#000" stroke-opacity=".35" stroke-width="2" />
				<!-- window with the best item -->
				<rect x="22" y="44" width="76" height="36" rx="6" fill="url(#{u}-win)" stroke="#0b0b0f" stroke-width="1.8" />
				<rect x="22" y="44" width="76" height="36" rx="6" fill="none" stroke={glow} stroke-opacity=".7" stroke-width="1" />
				<path d="M26 47 h30 l-8 8 h-22 z" fill="#fff" opacity=".08" />
				<!-- corner guards -->
				<path d="M5 74 v5 a9 9 0 0 0 9 9 h7 v-6 h-6 a3 3 0 0 1 -3 -3 v-5 z" fill="url(#{u}-metal)" stroke="#0b0b0f" stroke-width="1.2" />
				<path d="M115 74 v5 a9 9 0 0 1 -9 9 h-7 v-6 h6 a3 3 0 0 0 3 -3 v-5 z" fill="url(#{u}-metal)" stroke="#0b0b0f" stroke-width="1.2" />
			</g>
			<!-- lid -->
			<g class="cb-lid">
				<rect x="5" y="18" width="110" height="21" rx="8" fill="url(#{u}-lid)" stroke="#0b0b0f" stroke-width="2" />
				<rect x="5" y="18" width="110" height="21" rx="8" fill="url(#{u}-ribs)" />
				<path d="M13 22 h94" stroke="#fff" stroke-opacity=".35" stroke-width="1.5" stroke-linecap="round" />
				<rect x="40" y="25" width="40" height="7" rx="2.5" fill="#0b0b0f" opacity=".55" />
				<path d="M5 26 v-0 a8 8 0 0 1 8 -8 h7 v6 h-6 a3 3 0 0 0 -3 3 v5 h-6 z" fill="url(#{u}-metal)" stroke="#0b0b0f" stroke-width="1.2" />
				<path d="M115 26 a8 8 0 0 0 -8 -8 h-7 v6 h6 a3 3 0 0 1 3 3 v5 h6 z" fill="url(#{u}-metal)" stroke="#0b0b0f" stroke-width="1.2" />
			</g>
			<!-- latches over the seam -->
			<g class="cb-latch">
				<rect x="27" y="32" width="11" height="10" rx="2" fill="url(#{u}-gold)" stroke="#0b0b0f" stroke-width="1.3" />
				<rect x="82" y="32" width="11" height="10" rx="2" fill="url(#{u}-gold)" stroke="#0b0b0f" stroke-width="1.3" />
				<circle cx="32.5" cy="37" r="1.4" fill="#5a3a06" />
				<circle cx="87.5" cy="37" r="1.4" fill="#5a3a06" />
			</g>
		</svg>
		<span class="cb-item"><CaseItemArt ref={c.cover} grade={c.items[0].grade} /></span>
		<span class="cb-shine"></span>
	</span>
{/if}

<style>
	.cb {
		position: relative;
		display: block;
		width: var(--s);
		height: calc(var(--s) * 0.8);
	}
	.cb-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.cb-lid {
		transform-box: fill-box;
		transform-origin: 50% 100%;
		transition: transform 0.45s cubic-bezier(0.3, 1.5, 0.5, 1);
	}
	.cb-latch {
		transition: opacity 0.2s;
	}
	.open .cb-lid {
		transform: translateY(-12px) rotate(-6deg);
	}
	.open .cb-latch {
		opacity: 0;
	}
	/* the item sits in the window (x 22–98, y 44–80 of the 120 × 96 drawing) */
	.cb-item {
		position: absolute;
		left: 17%;
		width: 66%;
		top: 45%;
		height: 39%;
		transition:
			transform 0.45s cubic-bezier(0.3, 1.5, 0.5, 1),
			filter 0.45s;
	}
	.open .cb-item {
		transform: translateY(-48%) scale(1.25);
		filter: drop-shadow(0 0 10px var(--glow));
	}
	/* a soft glint over the shell (shown when a card is hovered; see CasinoCases) */
	.cb-shine {
		position: absolute;
		inset: 18% 4% 8%;
		border-radius: 9% / 12%;
		background: linear-gradient(105deg, transparent 35%, rgb(255 255 255 / 0.28) 50%, transparent 65%);
		background-size: 250% 100%;
		background-position: 130% 0;
		pointer-events: none;
		transition: background-position 0.8s ease;
	}
	:global(.cc-card:hover) .cb-shine,
	:global(.cc-card:focus-visible) .cb-shine {
		background-position: -30% 0;
	}
	@media (prefers-reduced-motion: reduce) {
		.cb-lid,
		.cb-item,
		.cb-shine {
			transition: none;
		}
	}
</style>
