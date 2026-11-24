<!--
	The case-opening reel (cases.ts): a strip of the case's items slides past a marker and slows down onto the
	item that was already drawn (and booked). Sideways for opening, top-to-bottom in a battle's seat column.
	The filler items on the strip are drawn by the case's own chances (seeded), so the rare ones flash by
	about as rarely as they drop. Reduced motion or `ms = 0` = it lands at once.
-->
<script lang="ts">
	import { CASE_BY_ID, drawItem, GRADES } from '#lib/cases.ts';
	import { seeded } from '#lib/squad-fun.ts';
	import { untrack } from 'svelte';
	import CaseItemArt from './CaseItemArt.svelte';

	let {
		caseId,
		pick,
		dir = 'x',
		ms = 5200,
		seed = 1,
		ondone
	}: { caseId: string; pick: number; dir?: 'x' | 'y'; ms?: number; seed?: number; ondone?: () => void } = $props();

	const STRIP = 44;
	const AT = 38;
	const c = $derived(CASE_BY_ID.get(caseId)!);
	const strip = $derived.by(() => {
		const r = seeded(seed);
		return Array.from({ length: STRIP }, (_, i) => (i === AT ? pick : drawItem(c, r)));
	});
	const jitter = $derived(((seeded(seed + 7)() - 0.5) * 0.7));

	let view = $state<HTMLElement>();
	let cell = $state(0);
	let offset = $state(0);
	let moving = $state(false);
	let done = $state(false);

	$effect(() => {
		if (!view) return;
		untrack(() => run(view!));
	});
	function run(view: HTMLElement) {
		const first = view.querySelector<HTMLElement>('.cr-cell');
		const size = dir === 'x' ? (first?.offsetWidth ?? 96) : (first?.offsetHeight ?? 72);
		const vp = dir === 'x' ? view.clientWidth : view.clientHeight;
		cell = size;
		const target = AT * size + size / 2 - vp / 2 + jitter * size;
		const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
		const time = reduce ? 0 : ms;
		let t1: ReturnType<typeof setTimeout> | undefined;
		let raf = 0;
		const finish = () => {
			done = true;
			ondone?.();
		};
		if (time <= 0) {
			offset = AT * size + size / 2 - vp / 2;
			t1 = setTimeout(finish, 0);
		} else {
			raf = requestAnimationFrame(() => {
				raf = requestAnimationFrame(() => {
					moving = true;
					offset = target;
				});
			});
			// a hidden tab draws no frames: land anyway
			t1 = setTimeout(() => {
				moving = false;
				offset = AT * size + size / 2 - vp / 2;
				finish();
			}, time + 120);
		}
		stop = () => {
			clearTimeout(t1);
			cancelAnimationFrame(raf);
		};
	}
	let stop = () => {};
	$effect(() => () => stop());
</script>

<div class="cr" class:y={dir === 'y'} class:done bind:this={view} style:--ms="{ms}ms" aria-hidden="true">
	<div class="cr-strip" class:moving style:transform={dir === 'x' ? `translateX(${-offset}px)` : `translateY(${-offset}px)`}>
		{#each strip as idx, i (i)}
			{@const it = c.items[idx]}
			<span class="cr-cell" class:win={done && i === AT} style:--g={GRADES[it.grade].colour}>
				<CaseItemArt ref={it.ref} grade={it.grade} glow={i === AT && done} />
			</span>
		{/each}
	</div>
	<span class="cr-mark"></span>
	{#if cell}<span class="cr-fade"></span>{/if}
</div>

<style>
	.cr {
		position: relative;
		overflow: hidden;
		height: 112px;
		border-radius: 12px;
		background:
			repeating-linear-gradient(90deg, rgb(255 255 255 / 0.025) 0 1px, transparent 1px 8px),
			linear-gradient(180deg, #1a1724, #0a0910);
		border: 1.5px solid rgb(255 255 255 / 0.12);
		box-shadow: inset 0 0 24px rgb(0 0 0 / 0.7);
	}
	.cr.y {
		height: 228px;
		background:
			repeating-linear-gradient(0deg, rgb(255 255 255 / 0.025) 0 1px, transparent 1px 8px),
			linear-gradient(90deg, #1a1724, #0a0910);
	}
	.cr-strip {
		display: flex;
		height: 100%;
		will-change: transform;
	}
	.cr.y .cr-strip {
		flex-direction: column;
		height: auto;
	}
	.cr-strip.moving {
		transition: transform var(--ms) cubic-bezier(0.08, 0.72, 0.16, 1);
	}
	/* each item = a little tile like an inventory card: dark, the grade colour rising from the bottom */
	.cr-cell {
		position: relative;
		flex: 0 0 124px;
		height: 100%;
		padding: 10px 4px;
	}
	.cr-cell::before {
		content: '';
		position: absolute;
		inset: 8px 4px;
		border-radius: 8px;
		background: linear-gradient(180deg, rgb(255 255 255 / 0.04), color-mix(in srgb, var(--g) 30%, transparent));
		border: 1px solid rgb(255 255 255 / 0.06);
		border-bottom: 3px solid var(--g);
	}
	.cr-cell > :global(.ci) {
		position: relative;
		padding: 2px 4px 6px;
	}
	.cr.y .cr-cell {
		flex: 0 0 76px;
		width: 100%;
		height: 76px;
		padding: 4px 8px;
	}
	.cr.y .cr-cell::before {
		inset: 4px 6px;
	}
	.done .cr-cell:not(.win) {
		opacity: 0.25;
		filter: saturate(0.4);
		transition:
			opacity 0.35s,
			filter 0.35s;
	}
	.cr-cell.win {
		z-index: 1;
		animation: cr-pop 0.55s cubic-bezier(0.3, 1.8, 0.5, 1);
	}
	.cr-cell.win::before {
		background: radial-gradient(closest-side, color-mix(in srgb, var(--g) 55%, transparent), color-mix(in srgb, var(--g) 18%, transparent));
		border-color: var(--g);
		box-shadow:
			0 0 18px color-mix(in srgb, var(--g) 70%, transparent),
			inset 0 0 12px color-mix(in srgb, var(--g) 50%, transparent);
	}
	@keyframes cr-pop {
		from {
			transform: scale(0.82);
		}
	}
	/* the marker: a gold line with an arrow at each end */
	.cr-mark {
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 2px;
		margin-left: -1px;
		background: linear-gradient(180deg, #ffe88a, #ffb020);
		box-shadow: 0 0 10px #ffc23a;
		z-index: 2;
	}
	.cr-mark::before,
	.cr-mark::after {
		content: '';
		position: absolute;
		left: 50%;
		border: 8px solid transparent;
		translate: -50% 0;
		filter: drop-shadow(0 0 4px #ffc23a);
	}
	.cr-mark::before {
		top: -2px;
		border-top-color: #ffd23a;
	}
	.cr-mark::after {
		bottom: -2px;
		border-bottom-color: #ffd23a;
	}
	.cr.y .cr-mark {
		left: 0;
		right: 0;
		top: 50%;
		bottom: auto;
		width: auto;
		height: 2px;
		margin: -1px 0 0;
		background: linear-gradient(90deg, #ffe88a, #ffb020);
	}
	.cr.y .cr-mark::before,
	.cr.y .cr-mark::after {
		top: 50%;
		left: auto;
		translate: 0 -50%;
		border-width: 7px;
	}
	.cr.y .cr-mark::before {
		left: -2px;
		border-color: transparent;
		border-left-color: #ffd23a;
	}
	.cr.y .cr-mark::after {
		right: -2px;
		bottom: auto;
		border-color: transparent;
		border-right-color: #ffd23a;
	}
	.cr-fade {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(90deg, #0a0910, transparent 24%, transparent 76%, #0a0910);
	}
	.cr.y .cr-fade {
		background: linear-gradient(180deg, #0a0910, transparent 28%, transparent 72%, #0a0910);
	}
	@media (prefers-reduced-motion: reduce) {
		.cr-cell.win {
			animation: none;
		}
	}
</style>
