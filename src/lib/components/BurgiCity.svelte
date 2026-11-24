<!--
	Burgi City (2026-11-23, the user: "bygg en burgi city", after seeing a sketch of the page as a town map;
	then "lite mer ovanifrån, inte bara rakt 2D"). An isometric cartoon town at night over the page tabs: one
	building per tab (tap = go in, via `ongo`, same as the "What's new" board), a park, and the squad's online
	operators walking the roads. Outside a squad the whole crew from the header takes a walk as decoration. The
	page tabs stay under it, so nothing is lost. Its own colours in every theme (like the casino). Can be folded
	up (remembered per device) or hidden.

	Drawing: burgiCity.ts. The scene is stacked layers of the same 1200 × 760 size: the ground, then for each
	block row an SVG with its three blocks, with an HTML layer of walkers on the road between rows, so a
	walker passes behind the row in front of it. The HTML layers are 1200 × 760 px scaled by --k (measured).
	Phones get a wider map inside a box that scrolls sideways (the page itself never does).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { progress } from '#lib/progress.svelte.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { SQUAD_OPS, type SquadOp } from '#lib/squad-codec.ts';
	import { DIVERGENCE_REQUIRED } from '#lib/data/camos.ts';
	import { t } from '#lib/i18n/en.ts';
	import { BLOCKS, BLOCK, GRID, LANES, TH, TW, VB_H, VB_W, blockArt, groundArt, hitArea, origin, p, type Block } from '#lib/burgiCity.ts';
	import SquadAvatar from './SquadAvatar.svelte';
	import HideButton from './HideButton.svelte';
	import HolkPark from './HolkPark.svelte';

	type Tab = 'grind' | 'ranked' | 'cosmetics' | 'casino' | 'shop' | 'arcade' | 'mayhem' | 'squad';
	let {
		view,
		shown,
		ongo
	}: { view: string; shown: readonly string[]; ongo: (tab: Exclude<Tab, 'mayhem'> | 'madness') => void } = $props();
	/** the arena is the Abscars Madness game (its own button since the Mayhem tab went away) */
	const go = (b: Tab) => ongo(b === 'mayhem' ? 'madness' : b);

	const KEY = 'mw4-camo-grind:city';
	let open = $state(true);
	onMount(() => {
		try {
			open = localStorage.getItem(KEY) !== 'closed';
		} catch {
			/* private mode: open */
		}
	});
	function toggle() {
		open = !open;
		try {
			if (open) localStorage.removeItem(KEY);
			else localStorage.setItem(KEY, 'closed');
		} catch {
			/* not saved */
		}
	}

	const COLOR: Record<Tab, string> = {
		grind: '#f2b81f',
		ranked: '#4d8dff',
		cosmetics: '#ff5cb8',
		casino: '#ff4a3d',
		shop: '#a560ff',
		arcade: '#ff8a2a',
		mayhem: '#9dff2e',
		squad: '#43d35e'
	};

	const OP_NAME: Record<SquadOp, string> = {
		abscar: 'Abscar',
		phillestar: 'Phillestar',
		lars: 'Drängen',
		jeeven: 'Da Jeeven',
		ingman: 'Ingman',
		aw: 'AW',
		joker: 'TheJoker_BPL'
	};

	/** who walks: the squad's online members, or the header crew for visitors */
	const walkers = $derived.by(() => {
		if (squad.on && squad.entries.length) {
			return squad.entries.filter((e) => e.online).map((e) => ({ key: e.id, name: e.member.name, op: e.member.op, mine: e.mine }));
		}
		return SQUAD_OPS.map((op) => ({ key: op, name: OP_NAME[op], op, mine: false }));
	});
	/** the roads walkers use: between the rows and in front (the back road stays empty) */
	const WALK_LANES = [LANES[1], LANES[2], LANES[3]];
	const lane = (l: number) => walkers.filter((_, i) => WALK_LANES[i % WALK_LANES.length] === l);

	const hbLeft = $derived(DIVERGENCE_REQUIRED - Math.min(progress.divergenceCount, DIVERGENCE_REQUIRED));
	const live = $derived<Partial<Record<Tab, string>>>({
		grind: progress.ready ? t.city.hbLeft(hbLeft) : undefined,
		squad: squad.on ? t.city.inSquad(squad.onlineCount) : undefined,
		casino: squad.on && squad.myBank ? t.city.burgers(Math.max(0, squad.myBank.balance).toLocaleString('en-US')) : undefined
	});

	const GROUND = groundArt();
	const ROWS = [0, 1, 2].map((by) => BLOCKS.filter((b) => b.by === by).map((b) => ({ b, svg: blockArt(b) })));
	const isTab = (b: Block): b is Block & { id: Tab } => b.id !== 'park';

	/** a block's tap area: the bounding box of its hexagon + the hexagon as a clip path inside it */
	function hit(b: Block) {
		const h = hitArea(b);
		const xs = h.map((q) => q[0]);
		const ys = h.map((q) => q[1]);
		const x = Math.min(...xs);
		const y = Math.min(...ys);
		return {
			x,
			y,
			w: Math.max(...xs) - x,
			h: Math.max(...ys) - y,
			clip: `polygon(${h.map(([px, py]) => `${(px - x).toFixed(1)}px ${(py - y).toFixed(1)}px`).join(',')})`
		};
	}
	/** where a block's sign floats: over the middle of the block, above its tallest part */
	function signAt(b: Block) {
		const [o, q] = origin(b);
		return p(o + BLOCK / 2, q + BLOCK / 2, b.h + 6);
	}

	let hot = $state<string | null>(null);
	/** Holk Park opens as a place of its own (HolkPark.svelte) */
	let parkOpen = $state(false);

	// scale of the HTML layers = stage width / 1200
	let stage = $state<HTMLDivElement>();
	let k = $state(1);
	let scroller = $state<HTMLDivElement>();
	$effect(() => {
		const el = stage;
		if (!el) return;
		const ro = new ResizeObserver(() => (k = el.clientWidth / VB_W || 1));
		ro.observe(el);
		k = el.clientWidth / VB_W || 1;
		// phones: start with the middle of town in view
		const sc = scroller;
		if (sc && sc.scrollWidth > sc.clientWidth) sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2;
		return () => ro.disconnect();
	});

	const start = (l: number) => p(-1.5, l);
	const STEP_X = (GRID + 3) * TW;
	const STEP_Y = (GRID + 3) * TH;
</script>

<section class="city" aria-label={t.city.label} data-open={open}>
	<div class="city-bar">
		<div class="min-w-0">
			<h2 class="city-title font-head">{t.city.title}</h2>
			<p class="city-kicker">
				{t.city.kicker} ·
				{squad.on ? t.city.online(walkers.length) : t.city.visitors}<span class="swipe"> · {t.city.swipe}</span>
			</p>
		</div>
		<button type="button" class="city-fold" aria-expanded={open} onclick={toggle}>
			<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6l5 5 5-5" /></svg>
			<span>{open ? t.city.fold : t.city.unfold}</span>
		</button>
		<HideButton id="city" inline short />
	</div>

	{#if open}
		<div class="city-scroll" bind:this={scroller}>
			<div class="stage" bind:this={stage} style:--k={k} style:--ik={1 / k} style:--sx="{STEP_X}px" style:--sy="{STEP_Y}px">
				<div class="sky" aria-hidden="true">
					{#each { length: 40 } as _, i (i)}
						<i style:left="{(i * 37 + 11) % 100}%" style:top="{(i * 53) % 46}%" style:animation-delay="{-(i % 7) * 0.6}s"></i>
					{/each}
				</div>
				<svg class="lay" viewBox="0 0 {VB_W} {VB_H}" aria-hidden="true">{@html GROUND}</svg>
				{#each ROWS as row, ri (ri)}
					{@render walkLane(LANES[ri])}
					<svg class="lay" viewBox="0 0 {VB_W} {VB_H}" aria-hidden="true">
						{#each row as { b, svg } (b.id)}
							<g class="blk" class:hot={hot === b.id} class:here={b.id === view} style:--c={isTab(b) ? COLOR[b.id] : '#6fd27a'}>{@html svg}</g>
						{/each}
					</svg>
				{/each}
				{@render walkLane(LANES[3])}

				<!-- tap areas, signs and the "you are here" pin -->
				<div class="layer top">
					{#each BLOCKS as b (b.id)}
						{@const a = hit(b)}
						{@const s = signAt(b)}
						{#if isTab(b) && (b.id === 'mayhem' || shown.includes(b.id))}
							<button
								type="button"
								class="bld"
								data-b={b.id}
								style:left="{a.x}px"
								style:top="{a.y}px"
								style:width="{a.w}px"
								style:height="{a.h}px"
								style:clip-path={a.clip}
								aria-current={view === b.id ? 'page' : undefined}
								aria-label={t.city.go(t.city.b[b.id].name)}
								onclick={() => go(b.id)}
								onpointerenter={() => (hot = b.id)}
								onpointerleave={() => (hot = hot === b.id ? null : hot)}
								onfocus={() => (hot = b.id)}
								onblur={() => (hot = hot === b.id ? null : hot)}
							></button>
							<span class="sign" class:on={hot === b.id} class:cur={view === b.id} style:left="{s[0]}px" style:top="{s[1]}px" style:--c={COLOR[b.id]} aria-hidden="true">
								{#if view === b.id}<em>{t.city.here}</em>{/if}
								<b>{t.city.b[b.id].name}</b>
								<small>{live[b.id] ?? t.city.b[b.id].sub}</small>
							</span>
						{:else if b.id === 'park'}
							<button
								type="button"
								class="bld"
								data-b="park"
								style:left="{a.x}px"
								style:top="{a.y}px"
								style:width="{a.w}px"
								style:height="{a.h}px"
								style:clip-path={a.clip}
								aria-haspopup="dialog"
								aria-label={t.city.go(t.city.park)}
								onclick={() => (parkOpen = true)}
								onpointerenter={() => (hot = 'park')}
								onpointerleave={() => (hot = hot === 'park' ? null : hot)}
								onfocus={() => (hot = 'park')}
								onblur={() => (hot = hot === 'park' ? null : hot)}
							></button>
							<span class="sign park" class:on={hot === 'park'} style:left="{s[0]}px" style:top="{s[1]}px" aria-hidden="true">
								<b>{t.city.park}</b>
								<small>{t.city.parkSub}</small>
							</span>
						{/if}
					{/each}
				</div>
			</div>
		</div>
	{/if}
</section>

<HolkPark bind:open={parkOpen} />

{#snippet walkLane(l: number)}
	{@const [sx, sy] = start(l)}
	<div class="layer" aria-hidden="true">
		{#each lane(l) as w, wi (w.key)}
			<span
				class="mover"
				class:back={(l + wi) % 2 === 1}
				style:left="{sx}px"
				style:top="{sy}px"
				style:animation-duration="{34 + ((l * 7 + wi * 11) % 18)}s"
				style:animation-delay="{-((wi * 13 + l * 5) % 34)}s"
				style:--at="{0.2 + ((wi * 0.31 + l * 0.07) % 0.6)}"
			>
				<span class="walker" class:mine={w.mine}>
					<span class="shadow"></span>
					<span class="bob"><SquadAvatar name={w.name} op={w.op} size={40} /></span>
					<span class="tag">{w.name}</span>
				</span>
			</span>
		{/each}
	</div>
{/snippet}

<style>
	.city {
		--city-bg: #0d0b1a;
		--city-ink: #f4efff;
		--city-muted: #b3a9cf;
		margin-top: 16px;
		border-radius: 14px;
		background: var(--city-bg);
		color: var(--city-ink);
		border: 1px solid #2c2550;
		box-shadow:
			0 0 0 1px #000 inset,
			0 10px 30px -18px #000;
		overflow: hidden;
		isolation: isolate;
	}
	.city-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px 10px 16px;
		background: linear-gradient(90deg, #1b1236, #2a0f2a);
		border-bottom: 1px solid #2c2550;
	}
	.city[data-open='false'] .city-bar {
		border-bottom: 0;
	}
	.city-bar > div {
		flex: 1;
	}
	.city-title {
		margin: 0;
		font-size: 20px;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		background: linear-gradient(90deg, #ffd54a, #ff8a2a 45%, #ff3ad1);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		text-shadow: none !important;
	}
	.city-kicker {
		margin: 2px 0 0;
		font-size: 12.5px;
		color: var(--city-muted);
	}
	.swipe {
		display: none;
	}
	@media (max-width: 860px) {
		.swipe {
			display: inline;
		}
	}
	.city-fold {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		padding: 0 12px;
		border-radius: 999px;
		border: 1px solid #4a3f7a;
		background: #1a1530;
		color: var(--city-ink);
		font-size: 13px;
		font-weight: 600;
		white-space: nowrap;
	}
	.city-fold:hover {
		border-color: #ffd54a;
	}
	.city-fold:focus-visible {
		outline: 3px solid #ffd54a;
		outline-offset: 2px;
	}
	.city-fold svg {
		width: 14px;
		height: 14px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.4;
		stroke-linecap: round;
		transition: transform 0.2s;
	}
	.city[data-open='true'] .city-fold svg {
		transform: rotate(180deg);
	}

	/* the map: a box that scrolls sideways on phones, the stage keeps the drawing's shape */
	.city-scroll {
		overflow-x: auto;
		overflow-y: hidden;
		overscroll-behavior-x: contain;
		background:
			radial-gradient(90% 60% at 50% 0%, #2b1d5c 0%, transparent 70%),
			linear-gradient(#141030, #0d0b1a 55%);
		scrollbar-width: thin;
		scrollbar-color: #4a3f7a transparent;
	}
	.stage {
		position: relative;
		width: 100%;
		min-width: 820px;
		aspect-ratio: 1200 / 760;
		overflow: hidden;
	}
	.lay {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}
	.layer {
		position: absolute;
		left: 0;
		top: 0;
		width: 1200px;
		height: 760px;
		transform: scale(var(--k));
		transform-origin: 0 0;
		pointer-events: none;
	}
	.sky {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.sky i {
		position: absolute;
		width: 2px;
		height: 2px;
		border-radius: 50%;
		background: #fff;
		animation: twinkle 3.2s ease-in-out infinite;
	}

	/* buildings: lift on hover, the one you're on glows */
	.blk {
		transition:
			transform 0.18s ease,
			filter 0.18s ease;
	}
	.blk.hot {
		transform: translateY(-7px);
		filter: brightness(1.18) drop-shadow(0 0 10px var(--c));
	}
	.blk.here {
		filter: drop-shadow(0 0 7px var(--c));
	}
	.blk.here.hot {
		filter: brightness(1.18) drop-shadow(0 0 12px var(--c));
	}

	.bld {
		position: absolute;
		padding: 0;
		border: 0;
		background: transparent;
		cursor: pointer;
		pointer-events: auto;
	}
	.bld:focus-visible {
		background: color-mix(in srgb, #ffd54a 22%, transparent);
		outline: none;
	}
	.sign {
		position: absolute;
		transform: translate(-50%, -100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 4px 10px 5px;
		border-radius: 9px;
		background: #0a0814e6;
		border: 1.5px solid color-mix(in srgb, var(--c, #6c6290) 70%, transparent);
		box-shadow: 0 0 14px -4px var(--c, transparent);
		white-space: nowrap;
		text-align: center;
		pointer-events: none;
		transition: transform 0.18s ease;
	}
	.sign.on {
		transform: translate(-50%, calc(-100% - 7px));
	}
	.sign b {
		font-size: max(17px, calc(12px * var(--ik)));
		font-weight: 800;
		line-height: 1.15;
		color: var(--c, var(--city-ink));
		text-shadow: 0 0 8px color-mix(in srgb, var(--c, #fff) 55%, transparent);
	}
	.sign small {
		font-size: max(12.5px, calc(9.5px * var(--ik)));
		color: var(--city-muted);
		line-height: 1.25;
	}
	.sign.park {
		--c: #6fd27a;
	}
	.sign.cur {
		background: color-mix(in srgb, var(--c) 24%, #0a0814);
		border-color: var(--c);
		box-shadow: 0 0 20px -2px var(--c);
	}
	.sign em {
		margin: -14px 0 3px;
		padding: 2px 8px;
		border-radius: 999px;
		background: var(--c);
		color: #0a0814;
		font-style: normal;
		font-size: max(11px, calc(8.5px * var(--ik)));
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		box-shadow: 0 0 12px var(--c);
	}

	/* walkers: each moves along its road (one tile = 23 × 11.5 px), feet on the middle line */
	.mover {
		position: absolute;
		width: 0;
		height: 0;
		animation: walk linear infinite;
	}
	.mover.back {
		animation-direction: reverse;
	}
	.walker {
		position: absolute;
		left: 0;
		top: 0;
		transform: translate(-20px, -44px);
		display: flex;
		align-items: center;
		gap: 3px;
	}
	.shadow {
		position: absolute;
		left: 6px;
		top: 38px;
		width: 28px;
		height: 10px;
		border-radius: 50%;
		background: #000a;
	}
	.bob {
		position: relative;
		display: block;
		animation: bob 0.6s ease-in-out infinite;
	}
	.tag {
		position: relative;
		padding: 1px 6px;
		border-radius: 999px;
		background: #0a0814d9;
		border: 1px solid #4a3f7a;
		font-size: max(11px, calc(8.5px * var(--ik)));
		font-weight: 700;
		white-space: nowrap;
	}
	.walker.mine .tag {
		border-color: #ffd54a;
		color: #ffd54a;
	}

	/* small moving bits on the buildings (classes from burgiCity.ts) */
	.lay :global(.win) {
		animation: flick 4s steps(1) infinite;
	}
	.lay :global(.w2) {
		animation-delay: -2s;
	}
	.lay :global(.blink),
	.lay :global(.bulb) {
		animation: blink 0.9s steps(1) infinite;
	}
	.lay :global(.neon) {
		animation: neon 3s infinite;
	}
	.lay :global(.n2) {
		animation-delay: -1.3s;
	}
	.lay :global(.beam) {
		animation: beam 4s ease-in-out infinite alternate;
	}
	.lay :global(.ping),
	.lay :global(.ring),
	.lay :global(.flag),
	.lay :global(.burger),
	.lay :global(.bag),
	.lay :global(.sticker),
	.lay :global(.gem),
	.lay :global(.tree),
	.lay :global(.stick) {
		transform-box: fill-box;
	}
	.lay :global(.ping) {
		transform-origin: center;
		animation: ping 2s ease-out infinite;
	}
	.lay :global(.flag) {
		transform-origin: left center;
		animation: flag 1.6s ease-in-out infinite;
	}
	.lay :global(.burger),
	.lay :global(.bag),
	.lay :global(.gem) {
		transform-origin: center;
		animation: hover 2.6s ease-in-out infinite;
	}
	.lay :global(.sticker) {
		transform-origin: center;
		animation: hover 3.4s ease-in-out infinite;
	}
	.lay :global(.ring) {
		transform-origin: center;
		animation: ring 5s ease-out infinite;
	}
	.lay :global(.tree) {
		transform-origin: center bottom;
		animation: sway 4s ease-in-out infinite alternate;
	}
	.lay :global(.fire) {
		transform-box: fill-box;
		transform-origin: center bottom;
		animation: fire 0.45s ease-in-out infinite alternate;
	}

	@keyframes walk {
		from {
			transform: translate(0, 0);
		}
		to {
			transform: translate(var(--sx), var(--sy));
		}
	}
	@keyframes fire {
		to {
			transform: scale(0.85, 1.15);
		}
	}
	@keyframes bob {
		50% {
			transform: translateY(-3px);
		}
	}
	@keyframes twinkle {
		50% {
			opacity: 0.2;
		}
	}
	@keyframes flick {
		0%,
		70% {
			opacity: 1;
		}
		71%,
		80% {
			opacity: 0.35;
		}
	}
	@keyframes blink {
		50% {
			opacity: 0.25;
		}
	}
	@keyframes neon {
		0%,
		90%,
		100% {
			opacity: 1;
		}
		92% {
			opacity: 0.3;
		}
		94% {
			opacity: 1;
		}
		96% {
			opacity: 0.5;
		}
	}
	@keyframes beam {
		to {
			opacity: 0.04;
		}
	}
	@keyframes ping {
		from {
			transform: scale(0.4);
			opacity: 1;
		}
		to {
			transform: scale(1.6);
			opacity: 0;
		}
	}
	@keyframes flag {
		50% {
			transform: skewY(-6deg) scaleX(0.92);
		}
	}
	@keyframes hover {
		50% {
			transform: translateY(-4px);
		}
	}
	@keyframes ring {
		from {
			transform: translateY(20px) scale(0.6);
			opacity: 0.7;
		}
		to {
			transform: translateY(-30px) scale(1.6);
			opacity: 0;
		}
	}
	@keyframes sway {
		from {
			transform: rotate(-3deg);
		}
		to {
			transform: rotate(3deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.city *,
		.city :global(*) {
			animation: none !important;
			transition: none !important;
		}
		.mover {
			transform: translate(calc(var(--sx) * var(--at)), calc(var(--sy) * var(--at)));
		}
	}
</style>
