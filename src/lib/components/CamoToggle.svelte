<script lang="ts">
	import type { LadderCamo } from '#lib/data/camos.ts';
	import { t } from '#lib/i18n/en.ts';
	import { CAMO_FILL } from '#lib/ui.ts';

	let {
		camo,
		pressed,
		weaponName,
		ontoggle
	}: { camo: LadderCamo; pressed: boolean; weaponName: string; ontoggle: () => void } = $props();

	let pop = $state(false);
	const label = $derived(t.weapon.toggle(camo.name, weaponName));

	function click() {
		const ticking = !pressed;
		ontoggle();
		pop = false;
		if (ticking) requestAnimationFrame(() => (pop = true));
	}
</script>

<button
	type="button"
	class="camo-toggle font-head grid size-11 place-items-center rounded-[calc(var(--t-radius)+2px)] text-xs font-bold"
	class:just-ticked={pop}
	style:--k={CAMO_FILL[camo.id]}
	aria-pressed={pressed}
	aria-label={label}
	title={label}
	onclick={click}
	onanimationend={() => (pop = false)}
>
	{#if pressed}
		<span aria-hidden="true" class="text-base leading-none">✔</span>
	{:else}
		<span aria-hidden="true">{camo.short}</span>
	{/if}
</button>
