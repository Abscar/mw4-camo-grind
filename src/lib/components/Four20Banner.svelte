<!--
	4:20 (four20.ts; 2026-11-16, the 420 pack): from 16:20 to 17:20 by the viewer's clock the page goes
	green: a banner on every tab and theme ("IT'S 4:20"), a soft green haze with cannabis leaves drifting
	down over the page (clicks go through), `data-f420` on <html> (the news buddy lights a holk, NewsBuddy),
	and anyone online with the squad gets the day's daily bonus once more (squad.svelte.ts #countToday).
	Close hides the banner; the green stays until 17:20. Reduced motion: no drifting leaves.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { four20 } from '#lib/four20.svelte.ts';
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';

	const f = t.four20;
	let closed = $state(false);

	$effect(() => four20.start());
	$effect(() => {
		if (four20.active) document.documentElement.dataset.f420 = '';
		else {
			delete document.documentElement.dataset.f420;
			closed = false;
		}
	});

	const LEAVES = Array.from({ length: 14 }, (_, i) => ({ x: (i * 53) % 100, d: (i % 7) * 1.3, dur: 9 + (i % 5) * 1.6, s: 16 + (i % 4) * 6 }));
</script>

{#if four20.active}
	<div class="f420-haze" aria-hidden="true">
		{#each LEAVES as l, i (i)}
			<span style:left="{l.x}%" style:animation-delay="-{l.d}s" style:animation-duration="{l.dur}s"
				><svg viewBox="0 0 24 24" width={l.s} height={l.s}
					>{#each LEAF_PATHS as d, j (j)}<path {d} fill={i % 3 ? '#3fb34a' : '#7ad84a'} stroke="#14501a" stroke-width="0.7" />{/each}<path
						d={LEAF_STEM}
						stroke="#14501a"
						stroke-width="1.4"
					/></svg
				></span
			>
		{/each}
	</div>
	{#if !closed}
		<div class="f420-banner mt-4" role="status">
			<svg class="f420-leaf" viewBox="0 0 24 24" aria-hidden="true"
				>{#each LEAF_PATHS as d, j (j)}<path {d} fill="#c8ff8a" stroke="#14501a" stroke-width="0.7" />{/each}<path d={LEAF_STEM} stroke="#c8ff8a" stroke-width="1.4" /></svg
			>
			<div class="min-w-0 flex-1">
				<p class="f420-title font-head">{f.banner}</p>
				<p class="f420-sub text-[13px]">{f.sub(four20.minutesLeft)}</p>
			</div>
			<button type="button" class="f420-x" aria-label={f.close} onclick={() => (closed = true)}>×</button>
		</div>
	{/if}
{/if}

<style>
	.f420-banner {
		position: relative;
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 3.25rem;
		padding: 6px 6px 6px 14px;
		border: 2px solid #7dff6a;
		border-radius: 12px;
		background: linear-gradient(90deg, #0b3d10, #1f7a2a 45%, #2fae3a);
		color: #fff;
		box-shadow: 0 0 18px rgb(80 255 80 / 0.5);
		overflow: hidden;
	}
	.f420-banner::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(100deg, transparent 30%, rgb(220 255 180 / 0.3) 50%, transparent 70%);
		transform: translateX(-100%);
		animation: f420-sweep 3.4s ease-in-out infinite;
		pointer-events: none;
	}
	@keyframes f420-sweep {
		60%,
		100% {
			transform: translateX(100%);
		}
	}
	.f420-leaf {
		flex: none;
		width: 30px;
		height: 30px;
		filter: drop-shadow(0 0 6px #7dff6a);
		animation: f420-sway 2.4s ease-in-out infinite alternate;
	}
	@keyframes f420-sway {
		from {
			transform: rotate(-12deg);
		}
		to {
			transform: rotate(12deg);
		}
	}
	.f420-title {
		font-size: 18px;
		font-weight: 900;
		letter-spacing: 0.14em;
		text-shadow: 0 2px 0 #062a08;
	}
	.f420-sub {
		color: #e2ffd0;
	}
	.f420-x {
		position: relative;
		flex: none;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 999px;
		font-size: 22px;
		line-height: 1;
	}
	.f420-x:hover {
		background: rgb(255 255 255 / 0.15);
	}
	/* the whole page goes a little green, leaves drifting down (clicks go through) */
	.f420-haze {
		position: fixed;
		inset: 0;
		z-index: 30;
		pointer-events: none;
		background: radial-gradient(120% 80% at 50% 0%, rgb(60 220 80 / 0.12), rgb(20 120 30 / 0.1) 60%, rgb(10 60 15 / 0.14));
		overflow: hidden;
	}
	.f420-haze span {
		position: absolute;
		top: -40px;
		opacity: 0.55;
		animation: f420-fall 10s linear infinite;
	}
	@keyframes f420-fall {
		0% {
			transform: translate(0, -40px) rotate(0deg);
		}
		50% {
			transform: translate(30px, 50vh) rotate(180deg);
		}
		100% {
			transform: translate(-10px, 105vh) rotate(380deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.f420-banner::before,
		.f420-leaf {
			animation: none;
		}
		.f420-haze span {
			display: none;
		}
	}
</style>
