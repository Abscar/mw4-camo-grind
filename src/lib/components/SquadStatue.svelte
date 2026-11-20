<!--
	The Golden Statue (BurgiShop, shop.ts STATUE_PRICE; 2026-11-20, the user picked it from the ideas list):
	a big gold statue of the operator of whoever put one up last, on a plinth with their name, at the top of
	the Squad tab. Only one stands at a time; the next one bought knocks it down. Their worn face items
	(holk, shades, hat…) are cast in gold too. Our own drawing; reduced motion = no sparkles.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { faceOf } from '#lib/faceGear.ts';
	import { statueOf, worn } from '#lib/shop.ts';
	import { squad, type SquadEntry } from '#lib/squad.svelte.ts';
	import { agoParts } from '#lib/squad-codec.ts';
	import SquadAvatar from './SquadAvatar.svelte';

	let { entries }: { entries: SquadEntry[] } = $props();
	const s = t.shop.statue;
	const stand = $derived(statueOf(Object.fromEntries(entries.map((e) => [e.id, e.member]))));
	const who = $derived(stand ? (entries.find((e) => e.id === stand.id) ?? null) : null);
</script>

{#if stand && who}
	<figure class="statue meta-card rounded-card" aria-label={s.label(who.member.name)}>
		<div class="statue-stage" aria-hidden="true">
			<span class="statue-rays"></span>
			<span class="statue-gold"><SquadAvatar name={who.member.name} op={who.member.op} size={104} face={faceOf(worn(who.member.shop))} /></span>
			<span class="statue-plinth"><span class="statue-plate font-head">{who.member.name}</span></span>
			{#each [[14, 22, 0], [82, 18, 0.7], [24, 64, 1.4], [76, 58, 2.1], [50, 6, 1.05]] as [x, y, d], i (i)}
				<i class="statue-spark" style:left="{x}%" style:top="{y}%" style:animation-delay="{d}s"></i>
			{/each}
		</div>
		<figcaption class="min-w-0">
			<p class="font-head text-[11px] font-bold tracking-[0.22em] text-muted uppercase">🗿 {s.name}</p>
			<p class="mt-0.5 font-head text-lg leading-tight font-bold">{who.mine ? s.standing : s.theirs(who.member.name)}</p>
			<p class="mt-1 text-xs text-muted">{s.since(t.squad.ago(agoParts(stand.at, squad.now)))}</p>
		</figcaption>
	</figure>
{/if}

<style>
	.statue {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px 20px;
		padding: 12px 16px;
		border: 1.5px solid #ffc928;
		background:
			radial-gradient(60% 120% at 18% 50%, rgb(255 201 40 / 0.22), transparent 70%),
			linear-gradient(180deg, rgb(40 26 4 / 0.7), rgb(16 10 2 / 0.75));
		box-shadow: 0 0 18px rgb(255 201 40 / 0.25);
	}
	.statue-stage {
		position: relative;
		display: grid;
		justify-items: center;
		width: 150px;
		height: 168px;
		flex: none;
	}
	/* slow light rays behind the statue */
	.statue-rays {
		position: absolute;
		inset: 0 4px 30px;
		border-radius: 50%;
		background: repeating-conic-gradient(from 0deg, rgb(255 220 120 / 0.28) 0 8deg, transparent 8deg 22deg);
		mask: radial-gradient(circle, #000 30%, transparent 70%);
		animation: statue-spin 30s linear infinite;
	}
	/* the operator cast in gold: the drawing turned to one golden tone, with a hard rim light */
	.statue-gold {
		position: relative;
		margin-top: 8px;
		filter: grayscale(1) sepia(1) saturate(5.5) hue-rotate(-10deg) brightness(1.08) contrast(1.25) drop-shadow(0 0 1px #fff3b0) drop-shadow(0 3px 4px rgb(0 0 0 / 0.65));
	}
	/* a marble-and-gold plinth with the name plate */
	.statue-plinth {
		position: absolute;
		left: 14px;
		right: 14px;
		bottom: 0;
		display: grid;
		place-items: center;
		height: 40px;
		border-radius: 4px 4px 2px 2px;
		background:
			linear-gradient(180deg, #fff1a8 0 4px, #c8941a 4px 7px, transparent 7px),
			linear-gradient(100deg, #e8e2d6, #b8b0a0 40%, #f4f0e6 60%, #a49c8c);
		box-shadow: 0 3px 6px rgb(0 0 0 / 0.6);
	}
	.statue-plate {
		max-width: 100%;
		padding: 1px 8px;
		overflow: hidden;
		border: 1px solid #7a5208;
		border-radius: 3px;
		background: linear-gradient(180deg, #fff1a8, #d9a520 55%, #a8740c);
		color: #2a1a02;
		font-size: 11px;
		font-weight: 900;
		letter-spacing: 0.14em;
		text-overflow: ellipsis;
		text-transform: uppercase;
		white-space: nowrap;
	}
	.statue-spark {
		position: absolute;
		width: 10px;
		height: 10px;
		background: #fff6c0;
		clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
		filter: drop-shadow(0 0 3px #ffd23a);
		animation: statue-twinkle 2.8s ease-in-out infinite;
	}
	@keyframes statue-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes statue-twinkle {
		0%,
		100% {
			transform: scale(0.2);
			opacity: 0;
		}
		50% {
			transform: scale(1.1) rotate(45deg);
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.statue-rays,
		.statue-spark {
			animation: none;
		}
		.statue-spark {
			opacity: 0;
		}
	}
</style>
