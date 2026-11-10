<!--
	A modal dialog on the browser's own <dialog>: the page behind is inert (focus stays inside),
	Escape closes it, a click on the backdrop closes it, and focus goes back to whatever opened it.
-->
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
	/** What had focus when the dialog opened, to hand it back on close. */
	let opener: HTMLElement | null = null;

	$effect(() => {
		if (!el) return;
		if (open && !el.open) {
			opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			el.showModal();
		}
		if (!open && el.open) el.close();
	});

	function returnFocus() {
		const target = opener;
		opener = null;
		// after the browser's own focus fix-up; never scroll the page to it
		if (target && target.isConnected) requestAnimationFrame(() => target.focus({ preventScroll: true }));
	}
</script>

<dialog
	bind:this={el}
	class="sheet m-auto {wide
		? 'w-[min(44rem,calc(100vw-2rem))]'
		: 'w-[min(30rem,calc(100vw-2rem))]'} rounded-card border border-line bg-panel p-0 text-fg shadow-2xl"
	aria-labelledby="{id}-title"
	onclose={() => {
		open = false;
		returnFocus();
	}}
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
