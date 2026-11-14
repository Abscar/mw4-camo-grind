<!--
	Squad up (squad step 3, 2026-11-14; the user's pick): while 3 or more of the squad have the page
	open at once (squad-fun.ts SQUAD_UP), the whole page goes into party mode. This banner (every tab,
	every theme) says who's on; it also sets `data-squadup` on <html>, which lights the header on fire
	(SquadUpFire, Abscar), makes the news buddy dance (grind.css) and has the old TV switch once to the
	hype montage (RetroTv). Close hides the banner until the next squad up; the party stays on.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';

	const s = t.squad.squadUp;
	let closed = $state(false);
	const online = $derived(squad.entries.filter((e) => e.online));

	$effect(() => {
		const on = squad.squadUp;
		if (on) document.documentElement.dataset.squadup = '';
		else {
			delete document.documentElement.dataset.squadup;
			closed = false;
		}
	});
</script>

{#if squad.squadUp && !closed}
	<div class="squadup-banner mt-4" role="status">
		<svg class="su-flame" viewBox="0 0 24 24" aria-hidden="true"
			><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 .2 2 1 3 2 3.2C11 9 10.5 5.5 12 2z" /></svg
		>
		<div class="min-w-0 flex-1">
			<p class="su-title font-head">{s.banner(online.length)}</p>
			<p class="su-names text-[13px]">{online.map((e) => e.member.name).join(' · ')}</p>
		</div>
		<button type="button" class="su-x" aria-label={s.close} onclick={() => (closed = true)}>×</button>
	</div>
{/if}

<style>
	.squadup-banner {
		position: relative;
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 3.25rem;
		padding: 6px 6px 6px 14px;
		border: 2px solid #ffcc33;
		border-radius: 12px;
		background: linear-gradient(90deg, #5a0c06, #a32108 45%, #e05a0c);
		color: #fff;
		box-shadow:
			0 0 18px rgb(255 120 20 / 0.6),
			0 -4px 18px rgb(255 40 0 / 0.35);
		overflow: hidden;
	}
	.squadup-banner::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(100deg, transparent 30%, rgb(255 230 150 / 0.35) 50%, transparent 70%);
		transform: translateX(-100%);
		animation: su-sweep 2.8s ease-in-out infinite;
		pointer-events: none;
	}
	@keyframes su-sweep {
		60%,
		100% {
			transform: translateX(100%);
		}
	}
	.su-flame {
		flex: none;
		width: 28px;
		height: 28px;
		fill: #ffe48a;
		filter: drop-shadow(0 0 6px #ff8a00);
		animation: su-flick 0.5s ease-in-out infinite alternate;
	}
	@keyframes su-flick {
		to {
			transform: scale(1.12, 0.94) rotate(-3deg);
		}
	}
	.su-title {
		font-size: 17px;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-shadow: 0 2px 0 #4a0800;
	}
	.su-names {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: #ffe7c8;
	}
	.su-x {
		position: relative;
		flex: none;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 999px;
		font-size: 22px;
		line-height: 1;
	}
	.su-x:hover {
		background: rgb(255 255 255 / 0.15);
	}
	@media (prefers-reduced-motion: reduce) {
		.squadup-banner::before,
		.su-flame {
			animation: none;
		}
	}
</style>
