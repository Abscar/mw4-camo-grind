<!--
	A squad member's little face (2026-11-14): their header operator's emblem if they picked one
	(`emblem`), otherwise a round badge with their initials in a colour worked out from the name.
	Decoration: the name is always written next to it.
	BurgiShop's face slots (faceGear.ts) go to the emblem, which draws them at its own eyes, mouth and head;
	on initials a hat sits on top, the thing in the mouth pokes out low right and a smoke colour puffs there.
-->
<script lang="ts">
	import { holk, smoke as smokeAt } from '#lib/abscarOperator.ts';
	import { EXHALE_K, exhaleAt, eyesItem, FACES, hatItem, mouthItem, type FaceWear } from '#lib/faceGear.ts';
	import { dripOver, dripUnder } from '#lib/dripArt.ts';
	import type { SquadOp } from '#lib/squad-codec.ts';
	import AbscarOperator from './AbscarOperator.svelte';
	import AwEmblem from './AwEmblem.svelte';
	import DaJeevenEmblem from './DaJeevenEmblem.svelte';
	import IngmanEmblem from './IngmanEmblem.svelte';
	import JokerEmblem from './JokerEmblem.svelte';
	import MeiliEmblem from './MeiliEmblem.svelte';
	import LarsAkeEmblem from './LarsAkeEmblem.svelte';
	import PhillestarEmblem from './PhillestarEmblem.svelte';

	let {
		name,
		op,
		size = 32,
		emblem = true,
		face = null
	}: {
		name: string;
		op?: SquadOp;
		size?: number;
		emblem?: boolean;
		/** BurgiShop's face slots (faceGear.ts `faceOf`) */
		face?: FaceWear | null;
	} = $props();
	const uid = $props.id();
	const U = `sqa-${uid}`;
	const F = FACES.initials;

	const initials = $derived(
		name
			.split(/[\s ]+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => [...w][0]?.toUpperCase() ?? '')
			.join('') || '?'
	);
	const OP_COLOURS: Record<SquadOp, string> = { abscar: '#6f8f2e', phillestar: '#c43fd6', lars: '#7ee236', jeeven: '#e0a420', ingman: '#8a3fd0', aw: '#1aa79a', joker: '#5b2a86', meili: '#3fb6e0' };
	const hue = $derived([...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7));
	const colour = $derived(op ? OP_COLOURS[op] : `hsl(${hue} 55% 45%)`);

	/** on the initials: glasses, hat, the thing in the mouth (or the Golden Holk) and its smoke, or a puff of colour */
	const overInitials = $derived.by(() => {
		if (!face || (!face.mouth && !face.hat && !face.smoke && !face.eyes && !face.top && !face.neck && !face.kicks && !face.shoulders)) return '';
		// BurgiDrip's clothes (dripArt.ts): a small torso low in the badge, under the letters' face items
		const under = dripUnder(U, face, 'initials');
		const over = dripOver(U, face, 'initials');
		const item = mouthItem(U, face.mouth, F.mouth);
		const gold = !item && face.mouth === 'mouth-goldholk';
		const ember = gold ? `<defs><radialGradient id="${U}-ember"><stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient></defs>` : '';
		const filters = `<defs><filter id="${U}-puff-blur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.4"/></filter><filter id="${U}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.5"/></filter></defs>`;
		const at = item ? item.end : gold ? ([62.6, 52.2] as [number, number]) : exhaleAt(F);
		const puff = face.smoke || item ? smokeAt(U, at[0], at[1], item ? 0.55 * item.boost : gold ? 0.45 : EXHALE_K) : '';
		return `${ember}${filters}${under}${eyesItem(U, face.eyes, F.eyes)}${hatItem(U, face.hat, F.head)}${over}${item ? item.markup : gold ? holk(U, 40, 45, 62, 52, 3, 9, undefined, true) : ''}${puff}`;
	});
</script>

<span class="sq-avatar" style:--size="{size}px" style:--c={colour} aria-hidden="true">
	{#if emblem && op === 'abscar'}
		<!-- no smoke column on the small faces, unless a smoke colour or something smoking was bought -->
		<AbscarOperator variant="ghillie" smoke={face?.smoke || (face?.mouth && face.mouth !== 'mouth-goldholk') ? 0.45 : 0} {face} />
	{:else if emblem && op === 'phillestar'}
		<PhillestarEmblem {face} />
	{:else if emblem && op === 'lars'}
		<LarsAkeEmblem {face} />
	{:else if emblem && op === 'jeeven'}
		<DaJeevenEmblem {face} />
	{:else if emblem && op === 'ingman'}
		<IngmanEmblem {face} />
	{:else if emblem && op === 'aw'}
		<AwEmblem {face} />
	{:else if emblem && op === 'joker'}
		<JokerEmblem {face} />
	{:else if emblem && op === 'meili'}
		<MeiliEmblem {face} />
	{:else}
		<span class="sq-initials font-head">{initials}</span>
		{#if overInitials}
			<svg class="sq-mouth" viewBox="0 0 64 64" focusable="false" data-smoke={face?.smoke || undefined}>
				<!-- trusted: built from our own constants -->
				{@html overInitials}
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
	/* BurgiShop's things over a member's initials (no operator to draw them at a mouth / head) */
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
