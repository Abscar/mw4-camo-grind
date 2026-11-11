<script lang="ts">
	import type { LadderCamo } from '#lib/data/camos.ts';
	import { t } from '#lib/i18n/en.ts';
	import { CAMO_FILL } from '#lib/ui.ts';

	let {
		camo,
		pressed,
		weaponName,
		ontoggle,
		pips = null,
		ready = false,
		note = '',
		unsure = false
	}: {
		camo: LadderCamo;
		pressed: boolean;
		weaponName: string;
		ontoggle: () => void;
		/** Gold box only: how many of the 3 challenges before Gold are ticked (shown as 3 little diamonds). */
		pips?: number | null;
		/** Gold box only: all 3 ticked, so Gold is next (a gold shimmer until it's ticked). */
		ready?: boolean;
		/** Added to the label: what unticking also clears, or an uncertainty about this camo. */
		note?: string;
		/** A small ? in the corner: something about this camo isn't confirmed (Season 1 weapons' HB → Divergence). */
		unsure?: boolean;
	} = $props();

	let pop = $state(false);
	const showPips = $derived(!pressed && pips !== null);
	const label = $derived(
		t.weapon.toggle(camo.name, weaponName) +
			(showPips && pips !== null ? ` (${t.weapon.preGoldPips(pips, 3)})` : '') +
			(note ? ` (${note})` : '')
	);

	function click() {
		const ticking = !pressed;
		ontoggle();
		pop = false;
		if (ticking) requestAnimationFrame(() => (pop = true));
	}
</script>

<button
	type="button"
	class="camo-toggle font-head relative grid size-11 place-items-center rounded-[calc(var(--t-radius)+2px)] text-xs font-bold"
	class:just-ticked={pop}
	class:gold-ready={ready && !pressed}
	style:--k={CAMO_FILL[camo.id]}
	data-camo={camo.id}
	aria-pressed={pressed}
	aria-label={label}
	title={label}
	onclick={click}
	onanimationend={() => (pop = false)}
>
	{#if pressed}
		<!-- Abscar: the ticked box wears its camo (brushed gold / platinum / Harmonic Break, grind.css) -->
		<span aria-hidden="true" class="tick-mark text-base leading-none">✔</span>
	{:else}
		<span aria-hidden="true" class:lift={showPips}>{camo.short}</span>
		{#if showPips && pips !== null}
			<span class="pips" aria-hidden="true">
				{#each [0, 1, 2] as i (i)}<i class:on={i < pips}></i>{/each}
			</span>
		{/if}
	{/if}
	{#if unsure}<span class="unsure-mark" aria-hidden="true">?</span>{/if}
</button>

<style>
	/* Season 1 weapons' HB box: counting toward Divergence isn't confirmed */
	.unsure-mark {
		position: absolute;
		top: 1px;
		right: 3px;
		font-size: 9.5px;
		font-weight: 900;
		line-height: 1;
		color: var(--t-muted);
		text-shadow: none;
	}
	[aria-pressed='true'] .unsure-mark {
		color: rgb(0 0 0 / 0.65);
	}
	/* three little diamonds under the G: the challenges before Gold */
	.lift {
		transform: translateY(-5px);
	}
	.pips {
		position: absolute;
		bottom: 7px;
		left: 50%;
		display: flex;
		gap: 4px;
		transform: translateX(-50%);
	}
	.pips i {
		width: 6px;
		height: 6px;
		transform: rotate(45deg);
		border: 1.5px solid var(--t-gold);
		border-radius: 1px;
	}
	.pips i.on {
		background: var(--t-gold);
		box-shadow: 0 0 4px var(--t-gold);
	}

	/* all 3 done: the Gold box shimmers until you tick it */
	.gold-ready {
		border-color: var(--t-gold);
		color: var(--t-gold);
		background:
			linear-gradient(115deg, transparent 35%, rgb(255 246 200 / 0.55) 50%, transparent 65%) no-repeat,
			color-mix(in srgb, var(--t-gold) 14%, var(--t-tick));
		background-size: 250% 100%;
		animation: gold-ready 1.8s ease-in-out infinite;
	}
	@keyframes gold-ready {
		0% {
			background-position: 130% 0, 0 0;
			box-shadow: 0 0 0 0 color-mix(in srgb, var(--t-gold) 70%, transparent);
		}
		50% {
			box-shadow: 0 0 14px 2px color-mix(in srgb, var(--t-gold) 55%, transparent);
		}
		100% {
			background-position: -30% 0, 0 0;
			box-shadow: 0 0 0 0 color-mix(in srgb, var(--t-gold) 0%, transparent);
		}
	}
</style>
