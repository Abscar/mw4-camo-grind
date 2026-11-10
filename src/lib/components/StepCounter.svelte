<!--
	A counter for a challenge you're on (steps.ts has the rules): − / + 1, a bigger step where it fits
	(running totals of 25+), direct input (saved on Enter or when you leave the box), the target and
	what's left, and Undo for this counter's last change. Reaching the target ticks the step (with a
	toast and Undo). Screen readers hear the new number once after a pause, not on every tap.
	"In a single match" challenges get a line instead of a counter: nothing adds up across matches.
-->
<script lang="ts">
	import { setStepCount } from '#lib/actions.ts';
	import { announcer } from '#lib/announce.svelte.ts';
	import { bigStep } from '#lib/challenge.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress, type WeaponState } from '#lib/progress.svelte.ts';
	import type { StepInfo } from '#lib/steps.ts';

	let { weaponId, step, compact = false }: { weaponId: string; step: StepInfo; compact?: boolean } = $props();

	const id = $props.id();
	const count = $derived(progress.count(weaponId, step.key));
	const big = $derived(bigStep(step.unit));
	const unitText = $derived(
		step.unit.kind === 'total'
			? t.counter.unitTotal(step.unit.unit)
			: step.unit.kind === 'repeat'
				? t.counter.unitRepeat(step.unit.feat)
				: ''
	);

	/** This counter's own history for Undo: the number before, or the whole weapon if it ticked. */
	let history = $state<{ value: number; ticked: WeaponState | null }[]>([]);

	function set(value: number) {
		const before = count;
		const r = setStepCount(weaponId, step.key, value);
		if (!r) return;
		history = [...history.slice(-19), { value: before, ticked: r.completed ? r.before : null }];
		if (!r.completed) announcer.say(t.counter.announce(step.name, r.value, step.target));
	}

	function undo() {
		const last = history.at(-1);
		if (!last) return;
		history = history.slice(0, -1);
		if (last.ticked) progress.restore(last.ticked);
		else progress.setCount(weaponId, step.key, last.value);
		announcer.say(t.counter.announce(step.name, last.value, step.target), 300);
	}
</script>

{#if step.target === 0}
	<p class="text-[12.5px] leading-snug text-muted">{t.counter.once}</p>
{:else}
	<div class="step-counter flex flex-wrap items-center gap-1.5" role="group" aria-labelledby="{id}-label">
		<span id="{id}-label" class="sr-only">{t.counter.value(step.name)}</span>
		<button type="button" class="step-btn" disabled={count <= 0} aria-label={t.counter.minus(1)} onclick={() => set(count - 1)}
			>−1</button
		>
		<label class="flex items-center gap-1">
			<span class="sr-only">{t.counter.value(step.name)}</span>
			<input
				type="number"
				inputmode="numeric"
				min="0"
				max={step.target}
				value={count}
				class="field num w-[4.25rem] [appearance:textfield] text-center text-[15px] font-bold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				onchange={(e) => {
					const el = e.currentTarget;
					const v = Number.parseInt(el.value, 10);
					if (Number.isFinite(v)) set(v);
					el.value = String(progress.count(weaponId, step.key));
				}}
				onkeydown={(e) => {
					if (e.key === 'Enter') e.currentTarget.blur();
				}}
			/>
			<span class="num text-[13px] whitespace-nowrap text-muted">{t.counter.of(step.target)}</span>
		</label>
		<button type="button" class="step-btn" aria-label={t.counter.plus(1)} onclick={() => set(count + 1)}>+1</button>
		{#if big}
			<button type="button" class="step-btn" aria-label={t.counter.plus(big)} onclick={() => set(count + big)}>+{big}</button>
		{/if}
		<span class="num ml-1 text-[12.5px] font-semibold whitespace-nowrap text-fg">{t.counter.left(step.target - count)}</span>
		{#if history.length > 0}
			<button type="button" class="btn btn-sm ml-auto" aria-label={t.counter.undoLabel(step.name)} onclick={undo}>
				<svg viewBox="0 0 16 16" class="size-3.5" aria-hidden="true"
					><path d="M5.5 3.5 2.5 6.5l3 3M3 6.5h6.5a4 4 0 0 1 0 8H7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg
				>{t.counter.undo}
			</button>
		{/if}
	</div>
	{#if !compact && unitText}
		<p class="mt-1 text-[12px] leading-snug text-muted">{unitText}</p>
	{/if}
{/if}
