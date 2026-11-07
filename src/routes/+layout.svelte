<script lang="ts">
	import '../app.css';
	// focus list, notes, buff/nerf badges and the Abscar extras added 2026-11-07
	import '../grind.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

{@render children()}
