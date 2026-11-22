<!--
	The photo gallery at the bottom of the Camo grind tab (Abscar only; 2026-11-22, the user: "gör längst ner på
	sidan till ett fotogalleri istället för alla bilder efter varandra"). One big stage shows the picked picture
	with its own light effects (the banner component), ‹ › buttons, arrow keys and swipe step through, and a row
	of thumbnails (the plain pictures) picks one. Pictures hidden with "Hide" are left out; the stage's Hide
	hides the picture on show.
-->
<script lang="ts">
	import type { Component } from 'svelte';
	import HideButton from './HideButton.svelte';
	import { hidden } from '#lib/hidden.svelte.ts';
	import type { HideId } from '#lib/hideSections.ts';
	import { t } from '#lib/i18n/en.ts';

	let { pics }: { pics: readonly { id: HideId; C: Component; src: string }[] } = $props();

	const shown = $derived(pics.filter((p) => !hidden.is(p.id)));
	let at = $state(0);
	const i = $derived(shown.length ? Math.min(at, shown.length - 1) : 0);
	const cur = $derived(shown[i]);
	const name = (id: HideId) => t.hide.names[id].replace(/ picture$/, '');

	let strip: HTMLElement | undefined = $state();
	function go(n: number) {
		if (!shown.length) return;
		at = (n + shown.length) % shown.length;
		strip?.querySelectorAll('button')[at]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
	}
	function key(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') (go(i - 1), e.preventDefault());
		if (e.key === 'ArrowRight') (go(i + 1), e.preventDefault());
	}
	let x0: number | null = null;
	function down(e: PointerEvent) {
		if (e.pointerType !== 'mouse') x0 = e.clientX;
	}
	function up(e: PointerEvent) {
		if (x0 === null) return;
		const dx = e.clientX - x0;
		x0 = null;
		if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
	}
</script>

{#if cur}
	<section class="gallery" aria-roledescription="carousel" aria-label="Photo gallery">
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<div
			class="stage relative h-[clamp(190px,38vw,470px)] overflow-hidden rounded-card shadow-card"
			tabindex="0"
			role="group"
			aria-label="{name(cur.id)}, {i + 1} of {shown.length}"
			onkeydown={key}
			onpointerdown={down}
			onpointerup={up}
			onpointercancel={() => (x0 = null)}
		>
			{#key cur.id}<div class="pic h-full"><cur.C /></div>{/key}
			{#if shown.length > 1}
				<button class="nav left-2" aria-label="Previous picture" onclick={() => go(i - 1)}>‹</button>
				<button class="nav right-2" aria-label="Next picture" onclick={() => go(i + 1)}>›</button>
			{/if}
			<div class="cap"><span>{name(cur.id)}</span><b>{i + 1} / {shown.length}</b></div>
		</div>
		<HideButton id={cur.id} />
		{#if shown.length > 1}
			<div class="strip" bind:this={strip}>
				{#each shown as p, n (p.id)}
					<button class="thumb" class:on={n === i} aria-label={name(p.id)} aria-current={n === i} onclick={() => go(n)}>
						<img src={p.src} alt="" loading="lazy" decoding="async" />
					</button>
				{/each}
			</div>
		{/if}
	</section>
{/if}

<style>
	.gallery { position: relative; }
	.stage { touch-action: pan-y; outline-offset: 3px; }
	.pic { animation: fade 0.35s ease; }
	@keyframes fade { from { opacity: 0; } }
	.nav {
		position: absolute; top: 50%; translate: 0 -50%; z-index: 3;
		width: 44px; height: 44px; border-radius: 999px; border: 1.5px solid rgb(255 255 255 / 0.55);
		background: rgb(0 0 0 / 0.55); color: #fff; font-size: 30px; line-height: 1; padding-bottom: 4px;
		box-shadow: 0 0 12px rgb(255 120 30 / 0.45); transition: background 0.15s, transform 0.15s;
	}
	.nav:hover { background: rgb(255 68 24 / 0.75); }
	.nav:active { transform: scale(0.92); }
	.cap {
		position: absolute; left: 0; right: 0; bottom: 0; z-index: 2; pointer-events: none;
		display: flex; justify-content: space-between; gap: 8px; padding: 22px 14px 9px;
		background: linear-gradient(transparent, rgb(0 0 0 / 0.7)); color: #fff; font-size: 14px;
		text-shadow: 0 1px 2px #000;
	}
	.cap b { font-variant-numeric: tabular-nums; opacity: 0.85; }
	.strip {
		display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; padding: 4px 2px 6px;
		scrollbar-width: thin; scroll-snap-type: x proximity;
	}
	.thumb {
		flex: 1 0 96px; max-width: 160px; aspect-ratio: 16 / 9; border-radius: 8px; overflow: hidden;
		border: 2px solid rgb(255 255 255 / 0.18); opacity: 0.6; scroll-snap-align: start;
		transition: opacity 0.15s, border-color 0.15s, transform 0.15s;
	}
	.thumb img { width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block; }
	.thumb:hover { opacity: 0.9; }
	.thumb.on { opacity: 1; border-color: #ffcc33; box-shadow: 0 0 10px rgb(255 140 30 / 0.7); transform: translateY(-2px); }
	@media (prefers-reduced-motion: reduce) { .pic { animation: none; } }
</style>
