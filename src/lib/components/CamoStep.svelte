<!--
	One camo in the weapon card (2026-11-11, the user's ask: "remove the tick system for challenges
	when you tap a weapon, it's enough to see a picture of the camo you unlock and what the challenge
	is"): the camo's picture (our own drawing, camoSwatch.ts + data/specialLooks.ts), its name and its
	exact challenge, and a "✔ Done" tag once it's done (Gold / Platinum / HB from the list's boxes; the
	before-Gold ones once the weapon has Gold or they were ticked earlier). Nothing here is tappable:
	ticking happens in the weapon list (and the Continue grinding cards).
-->
<script lang="ts">
	import { swatchSvg } from '#lib/camoSwatch.ts';
	import { LADDER } from '#lib/data/camos.ts';
	import { LADDER_LOOKS, SPECIAL_LOOKS } from '#lib/data/specialLooks.ts';
	import { t } from '#lib/i18n/en.ts';
	import type { StepInfo, StepStatus } from '#lib/steps.ts';
	import FactText from './FactText.svelte';
	import StatusIcon from './StatusIcon.svelte';

	let { weaponId, step, status }: { weaponId: string; step: StepInfo; status: StepStatus } = $props();

	const look = $derived(step.kind === 'ladder' ? LADDER_LOOKS[LADDER[step.index].id] : SPECIAL_LOOKS[step.name]);
	// our own generated SVG (data from specialLooks.ts, no user text), so {@html} is safe here
	const svg = $derived(look ? swatchSvg(look, step.kind === 'ladder' ? LADDER[step.index].id : step.name, `${weaponId}-${step.key}`) : '');
</script>

<div class="camo-step grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3" data-status={status}>
	<span class="camo-pic" data-done={status === 'done' ? '' : undefined}>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html svg}
		{#if status === 'done'}<span class="camo-pic-done" aria-hidden="true">✔</span>{/if}
	</span>
	<div class="min-w-0 pt-0.5">
		<p class="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
			<span class="min-w-0 text-[14.5px] leading-snug text-fg">
				<b class="font-semibold">{step.name}</b>{#if step.kind === 'special'}<span class="text-muted">{' · '}{t.weapon.preGoldShort}</span>{/if}
			</span>
			{#if status === 'done'}<span class="status-tag" data-status="done"><StatusIcon status="done" />{t.step.done}</span>{/if}
		</p>
		<p class="text-[13.5px] leading-snug text-muted"><FactText fact={step.fact} />{#if !step.fact.verified}<span class="block text-[11.5px]">({t.unverified}: {step.fact.note ?? t.unverifiedHint})</span>{/if}</p>
	</div>
</div>

<style>
	.camo-pic {
		position: relative;
		display: block;
		width: 3.75rem;
		height: 3.75rem;
		overflow: hidden;
		border: 1.5px solid color-mix(in srgb, var(--t-line) 70%, #000);
		border-radius: 10px;
		background: var(--t-tick);
		box-shadow:
			inset 0 0 0 1px rgb(255 255 255 / 0.12),
			0 2px 6px rgb(0 0 0 / 0.35);
	}
	.camo-pic :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
	/* a small ✔ badge in the corner once it's done (not colour alone) */
	.camo-pic-done {
		position: absolute;
		right: 3px;
		bottom: 3px;
		display: grid;
		place-items: center;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--t-ok, #3ee06a);
		color: #062a10;
		font-size: 11px;
		font-weight: 900;
		line-height: 1;
		box-shadow: 0 0 0 1.5px rgb(0 0 0 / 0.6);
	}
	.camo-pic[data-done] {
		border-color: color-mix(in srgb, var(--t-ok, #3ee06a) 70%, #000);
	}
</style>
