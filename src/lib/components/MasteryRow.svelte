<script lang="ts">
	import type { MasteryCamo, MasteryStatus } from '#lib/data/camos.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { percent } from '#lib/ui.ts';
	import FactText from './FactText.svelte';
	import StatusPill from './StatusPill.svelte';

	let {
		camo,
		number,
		status,
		previousName
	}: { camo: MasteryCamo; number: number; status: MasteryStatus; previousName: string } = $props();

	const count = $derived(progress.mastery[camo.id] ?? 0);
	const pct = $derived(percent(count, camo.target));
	const locked = $derived(status === 'locked');

	function step(by: number) {
		progress.setMastery(camo.id, count + by);
	}
</script>

<div
	class="camo-row grid items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3.5 sm:px-5 md:grid-cols-[minmax(150px,1.1fr)_minmax(150px,1.3fr)_auto_minmax(110px,1fr)_96px]"
	style:--k="var(--mastery-{number}, var(--t-accent))"
	data-camo={number}
>
	<div class="flex items-center justify-between gap-3 md:block">
		<h3 class="camo-row-name font-head text-[15px] font-bold text-(--k)">{camo.name}</h3>
		<div class="md:hidden"><StatusPill {status} /></div>
	</div>
	<p class="text-[13px] text-muted">
		<FactText fact={camo.challenge} /> ×{camo.target}
		{#if locked}<br /><span class="text-xs">{t.mastery.lockedBy(previousName)}</span>{/if}
	</p>
	<div class="flex items-center gap-1.5 tabular-nums">
		<button
			type="button"
			class="grid size-11 place-items-center rounded-lg border border-tick-line bg-tick text-lg font-bold text-muted hover:text-fg disabled:opacity-40"
			disabled={locked || count <= 0}
			aria-label={t.mastery.decrease(camo.name)}
			onclick={() => step(-1)}>−</button
		>
		<input
			type="number"
			inputmode="numeric"
			min="0"
			max={camo.target}
			value={count}
			disabled={locked}
			aria-label={t.mastery.count(camo.name)}
			class="h-11 w-16 [appearance:textfield] rounded-lg border border-tick-line bg-tick text-center font-bold text-fg disabled:opacity-40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
			oninput={(e) => {
				const el = e.currentTarget;
				if (el.value === '') return; // let people clear the box while typing
				progress.setMastery(camo.id, Number(el.value));
				const stored = String(progress.mastery[camo.id] ?? 0);
				if (el.value !== stored) el.value = stored; // e.g. 999 → 250
			}}
			onblur={(e) => (e.currentTarget.value = String(count))}
		/>
		<button
			type="button"
			class="grid size-11 place-items-center rounded-lg border border-tick-line bg-tick text-lg font-bold text-muted hover:text-fg disabled:opacity-40"
			disabled={locked || count >= camo.target}
			aria-label={t.mastery.increase(camo.name)}
			onclick={() => step(1)}>+</button
		>
		<span class="ml-1 text-[13px] whitespace-nowrap text-muted">{t.mastery.of(camo.target)}</span>
	</div>
	<div>
		<div class="bar"><i style:width="{pct}%"></i></div>
		<p class="font-head mt-1.5 text-xs font-bold text-muted tabular-nums">{pct}%</p>
	</div>
	<div class="hidden justify-self-end md:block"><StatusPill {status} /></div>
</div>
