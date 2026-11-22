<script lang="ts">
	/**
	 * The "Cosmetics & camos" page tab (2026-11-22, the user: "cosmetics och extra camos fliken kan du slå ihop
	 * till en flik"): one tab with a two-part switch, Cosmetics | Extra camos. Both lists stay mounted (only
	 * `hidden`), the pick is remembered per device.
	 */
	import CosmeticsSection from '#lib/components/CosmeticsSection.svelte';
	import ExtraCamosSection from '#lib/components/ExtraCamosSection.svelte';
	import { t } from '#lib/i18n/en.ts';

	const KEY = 'mw4-camo-grind:collections';
	type Part = 'cosmetics' | 'extras';
	const PARTS: Part[] = ['cosmetics', 'extras'];

	let part = $state<Part>('cosmetics');
	$effect(() => {
		try {
			if (localStorage.getItem(KEY) === 'extras') part = 'extras';
		} catch {
			/* no storage: start on Cosmetics */
		}
	});

	function pick(p: Part) {
		part = p;
		try {
			localStorage.setItem(KEY, p);
		} catch {
			/* not remembered, fine */
		}
	}
</script>

<div class="coll-switch" role="group" aria-label={t.pageTabs.collectionsLabel}>
	{#each PARTS as p (p)}
		<button type="button" class="coll-btn font-head" data-part={p} aria-pressed={part === p} onclick={() => pick(p)}
			>{t.pageTabs.collectionsParts[p]}</button
		>
	{/each}
</div>

<div class="mt-3" hidden={part !== 'cosmetics'}><CosmeticsSection /></div>
<div class="mt-3" hidden={part !== 'extras'}><ExtraCamosSection /></div>

<style>
	.coll-switch {
		display: flex;
		width: fit-content;
		max-width: 100%;
		padding: 3px;
		gap: 3px;
		border: 1.5px solid var(--t-line);
		border-radius: 12px;
		background: var(--t-panel);
	}
	.coll-btn {
		min-height: 2.75rem;
		padding: 0 1.1rem;
		border-radius: 9px;
		color: var(--t-muted);
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		transition:
			background-color 0.15s,
			color 0.15s;
	}
	.coll-btn:hover {
		color: var(--t-fg);
	}
	.coll-btn[aria-pressed='true'] {
		background: var(--t-accent);
		color: #120a14;
	}
	.coll-btn[data-part='cosmetics'][aria-pressed='true'] {
		--t-accent: #ff5cb8;
	}
	.coll-btn[data-part='extras'][aria-pressed='true'] {
		--t-accent: #1fcfc2;
	}
	:global([data-theme='steel']) .coll-btn[aria-pressed='true'] {
		--t-accent: #c9d1d9;
	}
	:global([data-theme='matrix']) .coll-btn[aria-pressed='true'] {
		--t-accent: #00ff41;
	}
	@media (max-width: 400px) {
		.coll-switch {
			width: 100%;
		}
		.coll-btn {
			flex: 1 1 0;
			padding: 0 0.5rem;
		}
	}
</style>
