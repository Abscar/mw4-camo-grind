<script lang="ts" module>
	/**
	 * Abscar theme: a ticked box shows a little cartoon leaf instead of ✔ (still a clear shape
	 * change, so colour isn't the only signal). Seven leaflets fanned out from the stem:
	 * [angle in degrees, length, width].
	 */
	const LEAFLETS: [number, number, number][] = [
		[-96, 5.6, 2.8],
		[96, 5.6, 2.8],
		[-63, 8.6, 3.7],
		[63, 8.6, 3.7],
		[-31, 11.2, 4.3],
		[31, 11.2, 4.3],
		[0, 13.4, 4.8]
	];
	const leaflet = ([, l, w]: [number, number, number]) =>
		`M0 0 C${w / 2} ${-l * 0.3} ${w / 2} ${-l * 0.72} 0 ${-l} C${-w / 2} ${-l * 0.72} ${-w / 2} ${-l * 0.3} 0 0 Z`;
</script>

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
		<span aria-hidden="true" class="tick-mark text-base leading-none">✔</span>
		<svg class="tick-leaf" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
			<path d="M12 16.5 C12 19 11.6 21 10.6 22.6" class="tick-leaf-stem" />
			{#each LEAFLETS as l (l[0])}
				<g transform="translate(12 16.5) rotate({l[0]})">
					<path d={leaflet(l)} class="tick-leaf-blade" />
					<path d="M0 -0.5 L0 {-l[1] * 0.82}" class="tick-leaf-vein" />
				</g>
			{/each}
		</svg>
	{:else}
		<span aria-hidden="true">{camo.short}</span>
	{/if}
</button>
