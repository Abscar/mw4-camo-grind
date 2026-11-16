<!--
	A squad member's little face (2026-11-14): their header operator's emblem if they picked one
	(`emblem`), otherwise a round badge with their initials in a colour worked out from the name.
	Decoration: the name is always written next to it.
-->
<script lang="ts">
	import { holk } from '#lib/abscarOperator.ts';
	import type { SquadOp } from '#lib/squad-codec.ts';
	import AbscarOperator from './AbscarOperator.svelte';
	import DaJeevenEmblem from './DaJeevenEmblem.svelte';
	import IngmanEmblem from './IngmanEmblem.svelte';
	import LarsAkeEmblem from './LarsAkeEmblem.svelte';
	import PhillestarEmblem from './PhillestarEmblem.svelte';

	let {
		name,
		op,
		size = 32,
		emblem = true,
		mouth = null
	}: {
		name: string;
		op?: SquadOp;
		size?: number;
		emblem?: boolean;
		/** BurgiShop's mouth slot (shop.ts): the emblem draws it at its own mouth; on initials it pokes out low right */
		mouth?: string | null;
	} = $props();
	const uid = $props.id();
	const INITIALS_HOLK = `sqa-${uid}`;

	const initials = $derived(
		name
			.split(/[\s ]+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => [...w][0]?.toUpperCase() ?? '')
			.join('') || '?'
	);
	const OP_COLOURS: Record<SquadOp, string> = { abscar: '#6f8f2e', phillestar: '#c43fd6', lars: '#7ee236', jeeven: '#e0a420', ingman: '#8a3fd0' };
	const hue = $derived([...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7));
	const colour = $derived(op ? OP_COLOURS[op] : `hsl(${hue} 55% 45%)`);
</script>

<span class="sq-avatar" style:--size="{size}px" style:--c={colour} aria-hidden="true">
	{#if emblem && op === 'abscar'}
		<AbscarOperator variant="ghillie" smoke={0} {mouth} />
	{:else if emblem && op === 'phillestar'}
		<PhillestarEmblem {mouth} />
	{:else if emblem && op === 'lars'}
		<LarsAkeEmblem {mouth} />
	{:else if emblem && op === 'jeeven'}
		<DaJeevenEmblem {mouth} />
	{:else if emblem && op === 'ingman'}
		<IngmanEmblem {mouth} />
	{:else}
		<span class="sq-initials font-head">{initials}</span>
		{#if mouth === 'mouth-goldholk'}
			<svg class="sq-mouth" viewBox="0 0 64 64" focusable="false">
				<defs><radialGradient id="{INITIALS_HOLK}-ember"><stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95" /><stop offset="1" stop-color="#ff5a00" stop-opacity="0" /></radialGradient></defs>
				<!-- trusted: built from our own constants -->
				{@html holk(INITIALS_HOLK, 40, 45, 62, 52, 3, 9, undefined, true)}
			</svg>
		{/if}
	{/if}
</span>

<style>
	.sq-avatar {
		position: relative;
		display: inline-grid;
		place-items: center;
		flex: none;
		width: var(--size);
		height: var(--size);
	}
	.sq-avatar > :global(svg) {
		width: var(--size);
		height: var(--size);
	}
	/* the Golden Holk over a member's initials (no operator to draw it at a mouth) */
	.sq-mouth {
		position: absolute;
		inset: 0;
		overflow: visible;
		pointer-events: none;
	}
	.sq-initials {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		border-radius: 999px;
		border: 1.5px solid rgb(255 255 255 / 0.85);
		background: var(--c);
		color: #fff;
		font-size: calc(var(--size) * 0.42);
		font-weight: 800;
		line-height: 1;
		letter-spacing: 0.02em;
		text-shadow: 0 1px 1px rgb(0 0 0 / 0.6);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.5);
	}
</style>
