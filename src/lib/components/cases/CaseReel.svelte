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
		height: 92px;
		border-radius: 10px;
		background: linear-gradient(180deg, #14121c, #08070c);
		border: 1.5px solid rgb(255 255 255 / 0.12);
	}
	.cr.y {
		height: 216px;
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
	.cr-cell {
		position: relative;
		flex: 0 0 96px;
		height: 100%;
		padding: 8px 6px 10px;
		border-right: 1px solid rgb(255 255 255 / 0.05);
		background: linear-gradient(180deg, transparent 60%, color-mix(in srgb, var(--g) 22%, transparent));
	}
	.cr-cell::after {
		content: '';
		position: absolute;
		left: 8%;
		right: 8%;
		bottom: 3px;
		height: 3px;
		border-radius: 2px;
		background: var(--g);
	}
	.cr.y .cr-cell {
		flex: 0 0 72px;
		width: 100%;
		height: 72px;
		border-right: 0;
		border-bottom: 1px solid rgb(255 255 255 / 0.05);
	}
	.done .cr-cell:not(.win) {
		opacity: 0.28;
		transition: opacity 0.3s;
	}
	.cr-cell.win {
		background: radial-gradient(closest-side, color-mix(in srgb, var(--g) 40%, transparent), transparent);
		animation: cr-pop 0.5s cubic-bezier(0.3, 1.8, 0.5, 1);
	}
	@keyframes cr-pop {
		from {
			transform: scale(0.85);
		}
	}
	.cr-mark {
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 2px;
		margin-left: -1px;
		background: #ffd23a;
		box-shadow: 0 0 8px #ffd23a;
	}
	.cr.y .cr-mark {
		left: 0;
		right: 0;
		top: 50%;
		bottom: auto;
		width: auto;
		height: 2px;
		margin: -1px 0 0;
	}
	.cr-fade {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(90deg, #08070c, transparent 22%, transparent 78%, #08070c);
	}
	.cr.y .cr-fade {
		background: linear-gradient(180deg, #08070c, transparent 26%, transparent 74%, #08070c);
	}
	@media (prefers-reduced-motion: reduce) {
		.cr-cell.win {
			animation: none;
		}
	}
</style>
