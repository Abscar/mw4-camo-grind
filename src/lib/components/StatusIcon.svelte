<!-- The icon that goes with a status word: ✔ done, ▶ on it, a padlock for locked (decoration; the word is the text). -->
<script lang="ts">
	let { status }: { status: 'done' | 'active' | 'locked' | 'complete' } = $props();
</script>

<svg viewBox="0 0 16 16" class="size-3.5 flex-none" aria-hidden="true" focusable="false">
	{#if status === 'done' || status === 'complete'}
		<path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
	{:else if status === 'active'}
		<path d="M5 3.2v9.6L12.6 8z" fill="currentColor" />
	{:else}
		<rect x="3.5" y="7" width="9" height="6.5" rx="1.4" fill="currentColor" />
		<path d="M5.6 7V5.3a2.4 2.4 0 0 1 4.8 0V7" fill="none" stroke="currentColor" stroke-width="1.7" />
	{/if}
</svg>
