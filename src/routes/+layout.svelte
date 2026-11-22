<script lang="ts">
	import '../app.css';
	// focus list, notes, buff/nerf badges and the Abscar extras added 2026-11-07
	import '../grind.css';
	// KarmaShop's looks (auras, effects, name styles, smoke, moving parts), 2026-11-20
	import '../karma-shop.css';
	// the Steel and Matrix themes (2026-11-22): their colours and their own takes on a few parts
	import '../themes.css';
	// BurgiDrip's moving parts (2026-11-22)
	import '../drip.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

{@render children()}
