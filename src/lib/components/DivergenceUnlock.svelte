<!--
	Abscar theme: when your own tick makes the 33rd Harmonic Break, a big red HUD "DIVERGENCE
	UNLOCKED" flashes over the page for a few seconds (never on load or import). It never blocks
	the page (clicks go through) and the KPI tile shows the same thing, so it's aria-hidden.
-->
<script lang="ts">
	import { DIVERGENCE, DIVERGENCE_REQUIRED, MASTERY } from '#lib/data/camos.ts';
	import { feed } from '#lib/feed.svelte.ts';
	import { t } from '#lib/i18n/en.ts';

	const id = $derived(feed.divergence?.id ?? 0);
</script>

<div class="abscar-only" aria-hidden="true">
	{#key id}
		{#if id}
			<div class="div-unlock" onanimationend={(e) => e.target === e.currentTarget && (feed.divergence = null)}>
				<div class="div-unlock-box">
					<p class="div-unlock-kicker">▸ {DIVERGENCE.name.toUpperCase()} // {DIVERGENCE_REQUIRED}/{DIVERGENCE_REQUIRED}</p>
					<p class="div-unlock-title">{t.unlock.title}</p>
					<p class="div-unlock-sub">{t.unlock.sub(DIVERGENCE_REQUIRED, MASTERY[0].name)}</p>
				</div>
			</div>
		{/if}
	{/key}
</div>
