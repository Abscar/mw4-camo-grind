<!--
	Race to Divergence (2026-11-14, squad step 2): every member runs along their own lane toward 33
	Harmonic Breaks, their face (operator emblem or initials) where they are; a chequered flag at the end.
-->
<script lang="ts">
	import { DIVERGENCE_REQUIRED } from '#lib/data/camos.ts';
	import { t } from '#lib/i18n/en.ts';
	import type { SquadEntry } from '#lib/squad.svelte.ts';
	import SquadAvatar from './SquadAvatar.svelte';

	let { entries }: { entries: SquadEntry[] } = $props();
	const s = t.squad;
</script>

<section class="sq-race" aria-labelledby="sq-race-h">
	<h3 id="sq-race-h" class="font-head text-[13px] font-bold tracking-[0.12em] uppercase">{s.race.heading}</h3>
	<ul class="mt-2 grid gap-1.5">
		{#each entries as e (e.id)}
			{@const n = Math.min(e.stats.divergence, DIVERGENCE_REQUIRED)}
			<li class="sq-lane" aria-label={s.race.lane(e.member.name, n, DIVERGENCE_REQUIRED)}>
				<span class="sq-lane-name truncate text-[12px] font-semibold" class:mine={e.mine} aria-hidden="true">{e.member.name}</span>
				<span class="sq-track" aria-hidden="true">
					<span class="sq-trail" style:width="{(n / DIVERGENCE_REQUIRED) * 100}%"></span>
					<span class="sq-runner" class:done={n >= DIVERGENCE_REQUIRED} style:left="{(n / DIVERGENCE_REQUIRED) * 100}%">
						<SquadAvatar name={e.member.name} op={e.member.op} size={30} />
					</span>
					<span class="sq-flag"></span>
				</span>
				<span class="sq-lane-n num text-[12px]" aria-hidden="true"><b>{n}</b>/{DIVERGENCE_REQUIRED}</span>
			</li>
		{/each}
	</ul>
</section>

<style>
	.sq-lane {
		display: grid;
		grid-template-columns: minmax(3.5rem, 7.5rem) minmax(0, 1fr) 2.6rem;
		align-items: center;
		gap: 10px;
		min-height: 36px;
	}
	.sq-lane-name.mine {
		color: var(--t-accent);
	}
	.sq-lane-n {
		text-align: right;
		color: var(--t-muted);
	}
	.sq-lane-n b {
		color: var(--t-fg);
	}
	/* the lane: a track with a tick every Harmonic Break, a bright trail behind the runner */
	.sq-track {
		position: relative;
		height: 10px;
		margin: 0 16px 0 15px;
		border-radius: 999px;
		background:
			repeating-linear-gradient(90deg, transparent 0 calc(100% / 33 - 1px), rgb(255 255 255 / 0.12) calc(100% / 33 - 1px) calc(100% / 33)),
			var(--t-track, rgb(127 127 127 / 0.25));
	}
	.sq-trail {
		position: absolute;
		inset: 0 auto 0 0;
		border-radius: inherit;
		background: linear-gradient(90deg, #5a0712, #c4132f 60%, #ff5a6e);
		box-shadow: 0 0 8px rgb(255 60 80 / 0.45);
	}
	.sq-runner {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -58%);
		z-index: 1;
		transition: left 0.6s ease;
		animation: sq-run 0.9s ease-in-out infinite alternate;
	}
	.sq-runner.done {
		animation: none;
	}
	@keyframes sq-run {
		to {
			transform: translate(-50%, -70%);
		}
	}
	/* the finish: a small chequered flag */
	.sq-flag {
		position: absolute;
		right: -16px;
		top: 50%;
		width: 14px;
		height: 14px;
		transform: translateY(-50%);
		border: 1px solid rgb(255 255 255 / 0.7);
		background: conic-gradient(#fff 0 25%, #111 0 50%, #fff 0 75%, #111 0) 0 0 / 7px 7px;
	}
	@media (prefers-reduced-motion: reduce) {
		.sq-runner {
			animation: none;
			transition: none;
		}
	}
</style>
