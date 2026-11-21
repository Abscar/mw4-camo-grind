<!--
	The auto spin row, the same on every slot machine (2026-11-21, the user: "höj autospinsen … på alla slotsen",
	then "ba lägg till 1000"): AUTO · n (STOP · n left while a run goes on) and the counts 10 · 25 · 50 · 100 · 1,000.
	The run itself is autoSpin.svelte.ts. Colours come from the machine, set on a parent: --auto-accent, --auto-bg,
	--auto-ink, --auto-on-ink, --auto-chip-bg, --auto-chip-ink, --auto-line. `extra` = the machine's own buttons at
	the end of the row (turbo, skip).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AUTO_COUNTS } from '#lib/autoSpin.ts';
	import type { AutoSpin } from '#lib/autoSpin.svelte.ts';
	import { t } from '#lib/i18n/en.ts';

	let {
		auto,
		blocked,
		onstart,
		btnClass = '',
		extra
	}: {
		auto: AutoSpin;
		/** a run can't start now (a spin going on, not enough burgers …) */
		blocked: boolean;
		/** AUTO / STOP tapped */
		onstart: () => void;
		/** another class on the AUTO button (older check scripts look for it) */
		btnClass?: string;
		extra?: Snippet;
	} = $props();

	const a = t.casino.autoSpin;
</script>

<div class="as" role="group" aria-label={a.label}>
	<button type="button" class="auto-btn as-go font-head {btnClass}" aria-pressed={auto.running} disabled={!auto.running && blocked} onclick={onstart}>
		{auto.running ? a.stop(auto.left) : a.start(auto.count)}
	</button>
	{#if !auto.running}
		{#each AUTO_COUNTS as n (n)}
			<button type="button" class="auto-n as-chip num font-head" aria-pressed={auto.count === n} aria-label={a.count(n)} onclick={() => auto.setCount(n)}
				>{n.toLocaleString('en-US')}</button
			>
		{/each}
	{/if}
	{#if extra}
		<span class="as-push"></span>
		{@render extra()}
	{/if}
</div>

<style>
	.as {
		--a-accent: var(--auto-accent, #ffc928);
		--a-on: var(--auto-on-ink, #3d0508);
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		min-width: 0;
		margin-top: 8px;
	}
	.as-push {
		flex: 1 1 0;
	}
	.as-go {
		min-height: 44px;
		padding: 0 16px;
		border: 2px solid var(--a-accent);
		border-radius: 999px;
		background: var(--auto-bg, #3d0508);
		color: var(--auto-ink, #ffd23a);
		font-size: 13px;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		white-space: nowrap;
	}
	.as-go[aria-pressed='true'] {
		background: var(--a-accent);
		color: var(--a-on);
		box-shadow: 0 0 12px color-mix(in srgb, var(--a-accent) 70%, transparent);
		animation: as-pulse 1.2s ease-in-out infinite alternate;
	}
	.as-go:disabled {
		opacity: 0.45;
	}
	@keyframes as-pulse {
		to {
			box-shadow: 0 0 4px color-mix(in srgb, var(--a-accent) 40%, transparent);
		}
	}
	.as-chip {
		min-width: 44px;
		height: 44px;
		padding: 0 9px;
		border-radius: 999px;
		background: var(--auto-chip-bg, #0c0201);
		color: var(--auto-chip-ink, #ffb27a);
		box-shadow: inset 0 0 0 2px var(--auto-line, #5a1a0a);
		font-size: 13px;
		font-weight: 800;
	}
	.as-chip[aria-pressed='true'] {
		color: var(--auto-ink, #ffd23a);
		box-shadow: inset 0 0 0 2px var(--a-accent);
	}
	@media (prefers-reduced-motion: reduce) {
		.as-go[aria-pressed='true'] {
			animation: none;
		}
	}
</style>
