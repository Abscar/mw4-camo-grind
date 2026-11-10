<!--
	One step of a weapon's grind (a challenge before Gold, or Gold / Platinum / Harmonic Break) in the
	weapon card and the "Continue grinding" cards: a tick box, its name and exact challenge, its status
	as icon + word (Done / On it / Locked, never colour alone), and a counter while you're on it.
	Ladder ticks follow the ladder rule (an untick that clears camos above says so, with Undo).
	Before-Gold ticks are locked while the weapon has Gold (untick Gold first; the ticks are kept).
-->
<script lang="ts">
	import { tickLadder } from '#lib/actions.ts';
	import { LADDER } from '#lib/data/camos.ts';
	import { WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { stepStatus, type StepInfo } from '#lib/steps.ts';
	import { CAMO_FILL } from '#lib/ui.ts';
	import FactText from './FactText.svelte';
	import StepCounter from './StepCounter.svelte';
	import StatusIcon from './StatusIcon.svelte';

	let {
		weaponId,
		step,
		compact = false
	}: { weaponId: string; step: StepInfo; compact?: boolean } = $props();

	const weapon = $derived(WEAPON_BY_ID.get(weaponId));
	const level = $derived(progress.level(weaponId));
	const mask = $derived(progress.specials[weaponId] ?? 0);
	const status = $derived(stepStatus(weaponId, step, level, mask));
	const pressed = $derived(status === 'done');
	/** Before-Gold ticks can't change while the weapon has Gold. */
	const locked = $derived(step.kind === 'special' && level >= 1);
	const fill = $derived(step.kind === 'ladder' ? CAMO_FILL[LADDER[step.index].id] : 'var(--t-gold)');

	const lockedWhy = $derived(
		status !== 'locked'
			? ''
			: !weapon?.specials.length
				? t.step.lockedUnreleased
				: step.kind === 'ladder' && step.index === 0
					? t.step.lockedGold
					: step.kind === 'ladder'
						? t.step.lockedLadder(LADDER[step.index - 1].name)
						: ''
	);

	const label = $derived.by(() => {
		let s = t.weapon.toggle(step.name, weapon?.name ?? weaponId);
		if (step.kind === 'ladder' && pressed && step.index < LADDER.length - 1 && level > step.index + 1) {
			s += ` (${t.weapon.untickClears(LADDER.slice(step.index + 1, level).map((c) => c.name).join(t.tickToast.and))})`;
		}
		if (locked) s += ` (${t.sheet.preGoldLocked})`;
		return s;
	});

	function tick() {
		if (step.kind === 'ladder') tickLadder(weaponId, step.index);
		else progress.toggleSpecial(weaponId, step.index);
	}
</script>

<div class="step-row grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 gap-y-1.5" data-status={status}>
	<button
		type="button"
		class="step-tick"
		style:--k={fill}
		aria-pressed={pressed}
		aria-label={label}
		title={locked ? t.sheet.preGoldLocked : label}
		disabled={locked}
		onclick={tick}
	>
		{#if pressed}<span aria-hidden="true">✔</span>{/if}
	</button>
	<div class="min-w-0 pt-0.5">
		<p class="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
			<span class="min-w-0 text-[14px] leading-snug text-fg">
				<b class="font-semibold">{step.name}</b>{#if step.kind === 'special'}<span class="text-muted">{' · '}{t.weapon.preGoldShort}</span>{/if}
			</span>
			<span class="status-tag" data-status={status}><StatusIcon {status} />{t.step[status]}</span>
		</p>
		<p class="text-[13px] leading-snug text-muted"><FactText fact={step.fact} />{#if !step.fact.verified && !compact}<span class="block text-[11.5px]">({t.unverified}: {step.fact.note ?? t.unverifiedHint})</span>{/if}</p>
		{#if lockedWhy && !compact}<p class="mt-0.5 text-[12px] text-muted">{lockedWhy}</p>{/if}
	</div>
	{#if status === 'active'}
		<div class="col-start-2 -mt-0.5"><StepCounter {weaponId} {step} {compact} /></div>
	{/if}
</div>

<style>
	.step-tick {
		position: relative;
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 2px solid color-mix(in srgb, var(--k) 70%, var(--t-tick-line));
		border-radius: 8px;
		background: var(--t-tick);
		color: var(--t-on-accent);
		font-size: 17px;
		font-weight: 900;
		line-height: 1;
		transition:
			background-color 0.15s,
			border-color 0.15s;
	}
	.step-tick:hover:not(:disabled) {
		border-color: var(--k);
	}
	.step-tick[aria-pressed='true'] {
		border-color: var(--k);
		background: var(--k);
	}
	.step-tick:disabled {
		cursor: default;
		opacity: 0.7;
	}
	.step-row[data-status='locked'] {
		opacity: 0.85;
	}
</style>
