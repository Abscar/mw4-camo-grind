<!--
	Skeddwood's symbols, each drawn once (2026-11-20): a hidden <svg> of <symbol>s that every reel cell shows
	with <use href="#…">, so a spin with ~150 cells doesn't build 150 drawings. The WANTED posters hold the
	squad's own header emblems (Ingman, Drängen Lars Åke, Da Jeeven, Phillestar); the cowboy WILD and the
	golden skull are Abscar's figure (abscarOperator.ts); the rest is skeddwoodArt.ts. Ids start with `u`.
-->
<script module lang="ts">
	/** The posters: key, name on the ribbon, ribbon colour (the operators' squad colours). */
	export const POSTERS = [
		{ key: 'ingman', name: 'INGMAN', colour: '#8a3fd0' },
		{ key: 'lars', name: 'DRÄNGEN', colour: '#4f9a22' },
		{ key: 'jeeven', name: 'DA JEEVEN', colour: '#c98a0a' },
		{ key: 'phil', name: 'PHILLESTAR', colour: '#b42fc4' }
	] as const;
</script>

<script lang="ts">
	import { cowboyFigure, goldSkull } from '#lib/abscarOperator.ts';
	import { LOWS } from '#lib/skeddwood.ts';
	import { cylinderMarkup, graveMarkup, hwildMarkup, lowMarkup, plankMarkup, posterBack, posterFront, sixgunMarkup, skeddMarkup, starMarkup } from '#lib/skeddwoodArt.ts';
	import DaJeevenEmblem from './DaJeevenEmblem.svelte';
	import IngmanEmblem from './IngmanEmblem.svelte';
	import LarsAkeEmblem from './LarsAkeEmblem.svelte';
	import PhillestarEmblem from './PhillestarEmblem.svelte';

	let { u }: { u: string } = $props();
</script>

<svg class="skw-sprite" aria-hidden="true" focusable="false" width="0" height="0">
	<defs>
		{#each LOWS as s (s)}
			<!-- trusted: built from our own constants -->
			<symbol id="{u}-{s}" viewBox="0 0 64 64">{@html lowMarkup(u, s)}</symbol>
		{/each}
		{#each POSTERS as p (p.key)}
			<symbol id="{u}-{p.key}" viewBox="0 0 64 64">
				{@html posterBack(u, p.key, p.colour)}
				<g clip-path="url(#{u}-po-{p.key}-win)">
					<svg class="poster-face" x="12" y="13.6" width="40" height="40" viewBox="0 0 64 64" overflow="hidden">
						{#if p.key === 'ingman'}<IngmanEmblem />{:else if p.key === 'lars'}<LarsAkeEmblem />{:else if p.key === 'jeeven'}<DaJeevenEmblem />{:else}<PhillestarEmblem />{/if}
					</svg>
				</g>
				{@html posterFront(u, p.key, p.name, p.colour)}
			</symbol>
		{/each}
		<symbol id="{u}-sixgun" viewBox="0 0 64 64">{@html sixgunMarkup(u)}</symbol>
		<symbol id="{u}-hwild" viewBox="0 0 64 64">{@html hwildMarkup(u)}</symbol>
		<symbol id="{u}-cylinder" viewBox="0 0 64 64">{@html cylinderMarkup(u)}</symbol>
		<symbol id="{u}-star" viewBox="0 0 64 64">{@html starMarkup(u)}</symbol>
		<symbol id="{u}-grave" viewBox="0 0 64 64">{@html graveMarkup(u)}</symbol>
		<symbol id="{u}-skull" viewBox="0 0 64 64">{@html goldSkull(`${u}s`)}</symbol>
		<symbol id="{u}-cowboy" viewBox="0 0 64 256" overflow="visible">{@html cowboyFigure(`${u}c`)}</symbol>
		<symbol id="{u}-skedd" viewBox="0 0 64 256">{@html skeddMarkup(u)}</symbol>
		<symbol id="{u}-plank" viewBox="0 0 64 128">{@html plankMarkup(u)}</symbol>
	</defs>
</svg>

<style>
	.skw-sprite {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;
		pointer-events: none;
	}
	/* the emblems size themselves with CSS (64 / 80 px): here they fill their 64-unit box */
	.poster-face :global(> svg) {
		width: 64px;
		height: 64px;
	}
</style>
