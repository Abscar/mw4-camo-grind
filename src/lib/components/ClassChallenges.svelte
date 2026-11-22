<!--
	The class's camo challenges behind a small "?" in the class box's header (2026-11-22, the user: "hide that text
	behind a little tab, show it when you hover over a small question mark"; until then they were a footer in every
	class box). Hover (mouse) or keyboard focus shows it; a tap or click pins it open until you tap it again, tap
	somewhere else or press Esc. The box is a top-layer popover (popover="manual"), so the class box's rounded,
	clipped corners never cut it off, and it's placed under the "?" (or above it when there's no room below).
-->
<script lang="ts">
	import { LADDER, PRESTIGE } from '#lib/data/camos.ts';
	import type { WeaponClass } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { CAMO_INK } from '#lib/ui.ts';
	import { onMount } from 'svelte';
	import FactText from './FactText.svelte';

	let { cls }: { cls: WeaponClass } = $props();

	const uid = $props.id();
	const tipId = `cc-tip-${uid}`;

	let btn = $state<HTMLButtonElement>();
	let tip = $state<HTMLDivElement>();
	/** null = closed; 'peek' = open while hovered / focused; 'pinned' = opened by a tap or click */
	let mode = $state<null | 'peek' | 'pinned'>(null);
	let above = $state(false);
	let closeTimer: ReturnType<typeof setTimeout> | undefined;
	/** assumed until mounted (the prerendered box is hidden by the popover attribute itself) */
	let popoverOk = $state(true);
	onMount(() => {
		popoverOk = canPopover();
	});

	const canPopover = () => typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;
	const canHover = () => typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;

	function place() {
		if (!btn || !tip) return;
		const r = btn.getBoundingClientRect();
		const vw = document.documentElement.clientWidth;
		const vh = window.innerHeight;
		const w = Math.min(380, vw - 24);
		tip.style.width = `${w}px`;
		const left = Math.max(12, Math.min(r.right + 6 - w, vw - 12 - w));
		const h = tip.offsetHeight;
		let top = r.bottom + 4;
		above = top + h > vh - 8 && r.top - 4 - h >= 8;
		if (above) top = r.top - 4 - h;
		tip.style.left = `${left}px`;
		tip.style.top = `${top}px`;
		tip.style.setProperty('--arrow-x', `${Math.round(r.left + r.width / 2 - left)}px`);
	}

	function open(next: 'peek' | 'pinned') {
		clearTimeout(closeTimer);
		if (mode === 'pinned' && next === 'peek') return;
		const wasOpen = mode !== null;
		mode = next;
		if (wasOpen || !tip) return;
		if (canPopover()) tip.showPopover();
		place();
	}

	function close() {
		clearTimeout(closeTimer);
		if (mode === null) return;
		mode = null;
		if (tip && canPopover() && tip.matches(':popover-open')) tip.hidePopover();
	}

	/** a short grace period so the mouse can move from the "?" into the box */
	function closeSoon() {
		if (mode !== 'peek') return;
		clearTimeout(closeTimer);
		closeTimer = setTimeout(close, 220);
	}

	function onClick() {
		if (mode === 'pinned') close();
		else open('pinned');
	}

	function onFocus() {
		// keyboard focus shows it; a tap focuses the button too, but then the click pins it
		if (btn?.matches(':focus-visible')) open('peek');
	}

	// while open: follow scrolling / resizing, close on Esc or a tap outside
	$effect(() => {
		if (mode === null) return;
		let raf = 0;
		const follow = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(place);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			const hadFocus = tip?.contains(document.activeElement) || document.activeElement === btn;
			close();
			if (hadFocus) btn?.focus();
		};
		const onDown = (e: PointerEvent) => {
			const target = e.target as Node | null;
			if (target && (btn?.contains(target) || tip?.contains(target))) return;
			close();
		};
		window.addEventListener('scroll', follow, { capture: true, passive: true });
		window.addEventListener('resize', follow);
		document.addEventListener('keydown', onKey);
		document.addEventListener('pointerdown', onDown, true);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('scroll', follow, { capture: true });
			window.removeEventListener('resize', follow);
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('pointerdown', onDown, true);
		};
	});

	$effect(() => () => clearTimeout(closeTimer));
</script>

<button
	bind:this={btn}
	type="button"
	class="cc-btn"
	aria-expanded={mode !== null}
	aria-controls={tipId}
	aria-label={t.cls.challengesFor(cls.name)}
	onclick={onClick}
	onpointerenter={(e) => e.pointerType === 'mouse' && canHover() && open('peek')}
	onpointerleave={closeSoon}
	onfocus={onFocus}
	onblur={(e) => {
		if (tip?.contains(e.relatedTarget as Node | null)) return;
		if (mode === 'peek') closeSoon();
		else close();
	}}
>
	<span class="cc-q" aria-hidden="true">?</span>
</button>

<div
	bind:this={tip}
	id={tipId}
	popover="manual"
	class="cc-tip"
	class:above
	class:cc-fallback={!popoverOk}
	hidden={!popoverOk && mode === null}
	role="group"
	tabindex="-1"
	aria-label={t.cls.challengesFor(cls.name)}
	onfocusout={(e) => {
		const to = e.relatedTarget as Node | null;
		if (!to || (to !== btn && !tip?.contains(to))) close();
	}}
	onpointerenter={() => mode === 'peek' && clearTimeout(closeTimer)}
	onpointerleave={closeSoon}
>
	<p class="cc-head font-head">{t.cls.challenges}</p>
	<ul class="cc-list">
		{#each LADDER as camo (camo.id)}
			<li>
				<b class="cc-camo font-head {CAMO_INK[camo.id]}">{camo.name}</b><FactText fact={cls.challenges[camo.id]} />
			</li>
		{/each}
		<li>
			<b class="cc-camo font-head text-pyro-ink">{t.weapon.prestigeColumn}</b>
			<ul class="cc-sub">
				{#each PRESTIGE as camo (camo.id)}
					<li><span class="cc-sub-name">{camo.name.replace('Pyroclast ', '')}:</span> {camo.challenge}</li>
				{/each}
			</ul>
		</li>
	</ul>
</div>

<style>
	/* 44 px to tap, a 22 px ring to see; the negative margins keep the header as tall as before */
	.cc-btn {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		margin: -12px -10px -12px -6px;
		flex: none;
		border-radius: 999px;
		color: inherit;
		cursor: help;
	}
	.cc-q {
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border-radius: 999px;
		border: 1.5px solid currentColor;
		font-family: var(--font-head, inherit);
		font-size: 13px;
		font-weight: 800;
		line-height: 1;
		opacity: 0.75;
		transition:
			opacity 0.15s,
			background-color 0.15s,
			color 0.15s;
	}
	.cc-btn:hover .cc-q,
	.cc-btn[aria-expanded='true'] .cc-q {
		opacity: 1;
		background: var(--c, var(--t-accent));
		border-color: var(--c, var(--t-accent));
		color: #fff;
		text-shadow: 0 1px 1px rgb(0 0 0 / 0.5);
	}
	/* Field Manual fills the header with the class colour: a white disc instead */
	:global([data-theme='field']) .cc-btn:hover .cc-q,
	:global([data-theme='field']) .cc-btn[aria-expanded='true'] .cc-q {
		background: #fff;
		border-color: #fff;
		color: var(--c, var(--t-accent));
		text-shadow: none;
	}
	.cc-btn:focus-visible {
		outline: 2px solid var(--t-accent);
		outline-offset: -6px;
	}

	.cc-tip {
		position: fixed;
		inset: auto;
		margin: 0;
		padding: 12px 14px 13px;
		width: min(380px, calc(100vw - 24px));
		max-height: calc(100vh - 16px);
		overflow: visible;
		border: 1px solid var(--t-line);
		border-top: 2px solid var(--c, var(--t-accent));
		border-radius: 10px;
		background: var(--t-panel);
		color: var(--t-fg);
		box-shadow: 0 12px 28px rgb(0 0 0 / 0.45);
		text-align: left;
		text-transform: none;
		letter-spacing: normal;
		font-size: 13px;
		font-weight: 400;
		line-height: 1.45;
		text-shadow: none;
		z-index: 60;
	}
	/* browsers without the popover API: a plain fixed box (hidden while closed) */
	.cc-fallback[hidden] {
		display: none;
	}
	/* the little arrow pointing at the "?" */
	.cc-tip::before {
		content: '';
		position: absolute;
		top: -7px;
		left: calc(var(--arrow-x, calc(100% - 22px)) - 6px);
		width: 12px;
		height: 12px;
		background: inherit;
		border-left: 2px solid var(--c, var(--t-accent));
		border-top: 2px solid var(--c, var(--t-accent));
		transform: rotate(45deg);
		border-radius: 2px 0 0 0;
	}
	.cc-tip.above::before {
		top: auto;
		bottom: -7px;
		border: 0;
		border-right: 1px solid var(--t-line);
		border-bottom: 1px solid var(--t-line);
	}
	.cc-head {
		margin-bottom: 6px;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--t-muted);
	}
	.cc-list {
		display: grid;
		gap: 4px;
	}
	.cc-camo {
		margin-right: 6px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.cc-sub {
		display: grid;
		gap: 1px;
		margin-top: 2px;
		padding-left: 12px;
		color: var(--t-muted);
	}
	.cc-sub-name {
		color: var(--t-fg);
		font-weight: 600;
	}

	/* Abscar: the class box's worn gunmetal, a fire edge like the boxes */
	:global([data-theme='blackout']) .cc-tip {
		background:
			linear-gradient(rgb(6 9 12 / 0.25), rgb(6 9 12 / 0.25)),
			linear-gradient(165deg, #4b555d 0%, #3a4248 40%, #2c3338 75%, #242a2e 100%),
			#2f363b;
		border-color: rgb(255 210 120 / 0.55);
		border-top-color: #ffcf4a;
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.5),
			0 0 18px rgb(255 120 30 / 0.4),
			0 14px 30px rgb(0 0 0 / 0.6);
		color: #f3f6f8;
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.9);
	}
	:global([data-theme='blackout']) .cc-tip::before {
		background: #4b555d;
		border-color: #ffcf4a;
	}
	:global([data-theme='blackout']) .cc-tip.above::before {
		background: #262c30;
		border-color: rgb(255 210 120 / 0.55);
	}
	:global([data-theme='blackout']) .cc-head,
	:global([data-theme='blackout']) .cc-sub {
		color: #d3dbe1;
	}
	:global([data-theme='blackout']) .cc-sub-name {
		color: #f3f6f8;
	}
</style>
