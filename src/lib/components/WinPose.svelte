<!--
	Win Pose (BurgiShop slot `win`, shop.ts; 2026-11-20, the user picked it from the ideas list): your own
	operator, wearing your look, dances in a spotlight on the BIG / MEGA WIN screens of Abscar's Fortune and
	Mybots 5. Only on your page (nobody else sees your slot screen). `force` = the shop's item card.
-->
<script lang="ts">
	import { faceOf } from '#lib/faceGear.ts';
	import { worn } from '#lib/shop.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import OpGear from './OpGear.svelte';
	import SquadAvatar from './SquadAvatar.svelte';

	let { size = 72, force = false }: { size?: number; force?: boolean } = $props();
	const look = $derived(worn(squad.shop));
	const me = $derived(squad.me);
	const on = $derived(force || look.win?.id === 'win-pose');
</script>

{#if on}
	<span class="win-pose" style:--s="{size}px" aria-hidden="true">
		<span class="wp-light"></span>
		<span class="wp-dancer">
			<OpGear aura={look.aura?.id} effect={look.effect?.id} badge={look.badge?.id} pet={look.pet?.id} pin={Math.round(size / 4)} extra={{ back: look.back?.id, hold: look.hold?.id, mount: look.mount?.id, plush: look.plush?.id }}>
				<SquadAvatar name={me?.name ?? '?'} op={me?.op ?? undefined} {size} face={faceOf(look)} />
			</OpGear>
		</span>
	</span>
{/if}

<style>
	.win-pose {
		position: relative;
		display: grid;
		place-items: end center;
		width: calc(var(--s) * 1.7);
		height: calc(var(--s) * 1.25);
		margin: 0 auto;
		pointer-events: none;
	}
	/* a spotlight from above */
	.wp-light {
		position: absolute;
		inset: -30% 10% 0;
		background: radial-gradient(50% 16% at 50% 94%, rgb(255 240 180 / 0.55), transparent 70%), linear-gradient(180deg, rgb(255 240 180 / 0), rgb(255 240 180 / 0.28));
		clip-path: polygon(40% 0, 60% 0, 100% 100%, 0 100%);
		animation: wp-sweep 1.4s ease-in-out infinite alternate;
	}
	.wp-dancer {
		position: relative;
		transform-origin: 50% 100%;
		animation: wp-dance 1.2s ease-in-out infinite;
	}
	@keyframes wp-sweep {
		from {
			transform: rotate(-6deg);
		}
		to {
			transform: rotate(6deg);
		}
	}
	@keyframes wp-dance {
		0%,
		100% {
			transform: translateY(0) rotate(-8deg) scale(1, 1);
		}
		25% {
			transform: translateY(-16%) rotate(0deg) scale(0.96, 1.06);
		}
		50% {
			transform: translateY(0) rotate(8deg) scale(1.06, 0.94);
		}
		75% {
			transform: translateY(-16%) rotate(0deg) scale(0.96, 1.06);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.wp-light,
		.wp-dancer {
			animation: none;
		}
	}
</style>
