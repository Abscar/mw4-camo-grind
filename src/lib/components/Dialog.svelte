<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title,
		wide = false,
		children,
		actions
	}: {
		open: boolean;
		title: string;
		/** Room for two columns on wide screens. */
		wide?: boolean;
		children: Snippet;
		actions: Snippet;
	} = $props();

	const id = $props.id();
	let el = $state<HTMLDialogElement>();

	$effect(() => {
		if (!el) return;
		if (open && !el.open) el.showModal();
		if (!open && el.open) el.close();
	});
</script>

<dialog
	bind:this={el}
	class="sheet m-auto {wide
		? 'w-[min(44rem,calc(100vw-2rem))]'
		: 'w-[min(30rem,calc(100vw-2rem))]'} rounded-card border border-line bg-panel p-0 text-fg shadow-2xl"
	aria-labelledby="{id}-title"
	onclose={() => (open = false)}
	onclick={(e) => {
		if (e.target === el) open = false;
	}}
>
	<div class="p-5">
		<h2 id="{id}-title" class="font-head text-lg font-bold">{title}</h2>
		<div class="mt-2 text-sm text-muted">{@render children()}</div>
		<div class="mt-5 flex flex-wrap justify-end gap-2">{@render actions()}</div>
	</div>
</dialog>
