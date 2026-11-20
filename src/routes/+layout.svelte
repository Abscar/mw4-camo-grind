<script lang="ts">
	import '../app.css';
	// focus list, notes, buff/nerf badges and the Abscar extras added 2026-11-07
	import '../grind.css';
	// KarmaShop's looks (auras, effects, name styles, smoke, moving parts), 2026-11-20
	import '../karma-shop.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

{@render children()}
