<script lang="ts">
	import { announcer } from '#lib/announce.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';
</script>

<div
	class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
	role="status"
	aria-live="polite"
>
	{#if toast.current}
		{@const msg = toast.current}
		<div
			class="pointer-events-auto flex max-w-xl items-center gap-3 rounded-2xl bg-fg py-2 pr-2 pl-4 text-sm font-semibold text-bg shadow-xl"
		>
			<span class="py-1.5">{msg.text}</span>
			{#if msg.action}
				<button
					type="button"
					class="min-h-11 flex-none rounded-xl px-3 font-bold underline underline-offset-2"
					onclick={() => {
						msg.action?.run();
						toast.dismiss();
					}}>{msg.action.label}</button
				>
			{:else}
				<span class="w-2"></span>
			{/if}
		</div>
	{/if}
</div>

<!-- counters: read out once after a pause, not on every tap -->
<div class="sr-only" role="status" aria-live="polite">{announcer.text}</div>
