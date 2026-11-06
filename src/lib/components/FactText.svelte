<script lang="ts">
	import type { Fact } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';

	let { fact }: { fact: Fact } = $props();

	const tooltip = $derived(
		fact.verified ? fact.note : [t.unverifiedHint, fact.note].filter(Boolean).join(' ')
	);
</script>

{#if fact.verified}
	<span title={tooltip}>{fact.text}</span>
{:else}
	<span class="unverified" title={tooltip}
		>{fact.text}<span class="sr-only"> ({t.unverified})</span></span
	>
{/if}
