<!--
	"Mastery camos equipped": one chip per Mastery camo with its animated texture.
	Names come from the data. Only shown in the Abscar theme (.abscar-only).
-->
<script lang="ts">
	import { MASTERY } from '#lib/data/camos.ts';
	import { t } from '#lib/i18n/en.ts';
</script>

<div class="abscar-only mt-3.5">
	<div class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
		<span class="font-hud text-[10.5px] tracking-[0.18em] text-band-muted uppercase">{t.operator.equipped}</span>
		<ul class="flex flex-wrap gap-1.5">
			{#each MASTERY as camo, i (camo.id)}
				<li
					class="equip-chip font-head flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-[11px] font-bold tracking-wider uppercase"
				>
					<span
						class="camo-skin-{i + 1} size-5 flex-none rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)]"
						aria-hidden="true"
					></span>
					{camo.name}
				</li>
			{/each}
		</ul>
	</div>
</div>
