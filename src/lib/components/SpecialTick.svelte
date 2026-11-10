<!--
	One Special camo (a challenge before Gold) as a tick row in the weapon card: a gold diamond that
	fills when ticked, with a burst of gold sparks; when it was the last of the three, "Gold ready!"
	floats up. Locked (shown done) while the weapon has Gold. (Chips under each weapon in the list
	were removed 2026-11-10 at the user's ask: the card is enough.)
-->
<script lang="ts">
	import type { Fact } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import FactText from './FactText.svelte';

	let {
		weaponId,
		index,
		total,
		name,
		challenge
	}: {
		weaponId: string;
		index: number;
		total: number;
		name: string;
		challenge: Fact;
	} = $props();

	const pressed = $derived(progress.special(weaponId, index));
	const locked = $derived(progress.level(weaponId) >= 1);
	let burst = $state(0);
	let ready = $state(0);

	function click() {
		if (progress.toggleSpecial(weaponId, index) !== true) return;
		burst++;
		if (progress.specialsDone(weaponId, total) === total) ready++;
	}
</script>

<button
	type="button"
	class="special-tick st-row"
	aria-pressed={pressed}
	disabled={locked}
	title={locked ? t.sheet.preGoldLocked : undefined}
	onclick={click}
>
	<span class="st-box" aria-hidden="true">
		<span class="st-diamond"></span>
		{#if pressed}<span class="st-check">✔</span>{/if}
		{#key burst}
			{#if burst}
				<span class="st-burst"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
			{/if}
		{/key}
	</span>
	<span class="min-w-0 flex-1 text-left"><b class="font-semibold">{name}:</b> <FactText fact={challenge} /></span>
	{#key ready}
		{#if ready}<span class="st-ready" aria-hidden="true">{t.weapon.goldReady}</span>{/if}
	{/key}
</button>

<style>
	.special-tick {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.55rem;
		min-height: 2.75rem;
		border-radius: 8px;
		color: var(--t-fg);
		transition:
			background-color 0.15s,
			border-color 0.15s;
	}
	.st-row {
		padding: 0.3rem 0.4rem 0.3rem 0.3rem;
		margin-inline: -0.3rem;
		width: calc(100% + 0.6rem);
		text-align: left;
	}
	.st-row:hover:not(:disabled) {
		background: color-mix(in srgb, var(--t-gold) 10%, transparent);
	}
	.special-tick:disabled {
		cursor: default;
		opacity: 0.85;
	}

	/* the gold diamond */
	.st-box {
		position: relative;
		display: grid;
		flex: none;
		place-items: center;
		width: 22px;
		height: 22px;
	}
	.st-diamond {
		position: absolute;
		inset: 3px;
		transform: rotate(45deg);
		border: 2px solid var(--t-gold);
		border-radius: 3px;
		background: color-mix(in srgb, var(--t-gold) 8%, transparent);
		transition:
			background-color 0.15s,
			box-shadow 0.2s;
	}
	[aria-pressed='true'] .st-diamond {
		background: var(--t-gold);
		box-shadow: 0 0 10px color-mix(in srgb, var(--t-gold) 60%, transparent);
	}
	.st-check {
		position: relative;
		font-size: 11px;
		font-weight: 900;
		line-height: 1;
		color: #2a1a00;
	}
	.special-tick:not(:disabled):active .st-box {
		transform: scale(0.88);
	}
	[aria-pressed='true']:not(:disabled) .st-box {
		animation: st-pop 0.3s ease-out;
	}
	@keyframes st-pop {
		0% {
			transform: scale(0.6) rotate(-20deg);
		}
		60% {
			transform: scale(1.25) rotate(6deg);
		}
		100% {
			transform: none;
		}
	}

	/* gold sparks flying out of the diamond */
	.st-burst {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.st-burst i {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 4px;
		height: 9px;
		margin: -4.5px 0 0 -2px;
		border-radius: 2px;
		background: linear-gradient(#fff6c8, var(--t-gold));
		box-shadow: 0 0 6px var(--t-gold);
		opacity: 0;
		animation: st-spark 0.6s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
	}
	.st-burst i:nth-child(1) { --a: 0deg; }
	.st-burst i:nth-child(2) { --a: 45deg; animation-delay: 0.03s; }
	.st-burst i:nth-child(3) { --a: 90deg; }
	.st-burst i:nth-child(4) { --a: 135deg; animation-delay: 0.03s; }
	.st-burst i:nth-child(5) { --a: 180deg; }
	.st-burst i:nth-child(6) { --a: 225deg; animation-delay: 0.03s; }
	.st-burst i:nth-child(7) { --a: 270deg; }
	.st-burst i:nth-child(8) { --a: 315deg; animation-delay: 0.03s; }
	@keyframes st-spark {
		0% {
			opacity: 1;
			transform: rotate(var(--a)) translateY(-4px) scaleY(0.6);
		}
		100% {
			opacity: 0;
			transform: rotate(var(--a)) translateY(-22px) scaleY(1.1);
		}
	}

	/* "Gold ready!" floats up from the last tick */
	.st-ready {
		position: absolute;
		left: 0;
		bottom: 100%;
		z-index: 5;
		padding: 2px 8px;
		border-radius: 999px;
		background: linear-gradient(180deg, #fff1a8, var(--t-gold));
		color: #2a1a00;
		font-family: var(--font-head, inherit);
		font-size: 12px;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		white-space: nowrap;
		box-shadow:
			0 0 0 1px #6b4a00,
			0 0 16px color-mix(in srgb, var(--t-gold) 80%, transparent);
		pointer-events: none;
		opacity: 0;
		animation: st-ready 1.6s ease-out forwards;
	}
	@keyframes st-ready {
		0% {
			opacity: 0;
			transform: translateY(8px) scale(0.6);
		}
		15% {
			opacity: 1;
			transform: translateY(0) scale(1.12);
		}
		25% {
			transform: scale(1);
		}
		75% {
			opacity: 1;
			transform: translateY(-10px);
		}
		100% {
			opacity: 0;
			transform: translateY(-22px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.st-burst,
		.st-ready {
			display: none;
		}
	}
</style>
