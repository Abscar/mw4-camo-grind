<!--
	Red cyborg-vision readout for the Abscar theme: what you're grinding toward right now,
	worked out from your progress. Decorative duplicate of the KPI/Mastery data, so aria-hidden.
-->
<script lang="ts">
	import { DIVERGENCE, DIVERGENCE_REQUIRED, LADDER, MASTERY, MAX_LEVEL } from '#lib/data/camos.ts';
	import { WEAPONS } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';

	const HB = LADDER[LADDER.length - 1].short;

	/** The next thing to unlock: Divergence first, then the active Mastery camo. */
	const target = $derived.by(() => {
		if (!progress.divergenceUnlocked) {
			return `${DIVERGENCE.name} ${Math.min(progress.divergenceCount, DIVERGENCE_REQUIRED)}/${DIVERGENCE_REQUIRED} ${HB}`;
		}
		const i = progress.masteryStatus.indexOf('active');
		if (i === -1) return null;
		const camo = MASTERY[i];
		return `${camo.name} ${progress.mastery[camo.id] ?? 0}/${camo.target}`;
	});
	const maxed = $derived(WEAPONS.filter((w) => progress.level(w.id) >= MAX_LEVEL).length);
</script>

<div class="abscar-only">
	<div class="hud-readout font-hud text-[10.5px] leading-[1.7] tracking-[0.14em] uppercase" aria-hidden="true">
		<p class="hud-line">▸ {t.hud.mode}</p>
		<p class="hud-line">▸ {t.hud.target}: {target ?? t.hud.allDone}</p>
		<p class="hud-line">▸ {t.hud.maxed}: {maxed}/{WEAPONS.length}</p>
		<p class="hud-line">
			▸ {t.hud.status}: {target ? t.hud.grinding : t.hud.complete}<span class="hud-cursor">█</span>
		</p>
	</div>
</div>
