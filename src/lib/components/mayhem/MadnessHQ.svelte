<!--
	Abscars Madness: the headquarters you walk around instead of a menu (2026-11-28, the user: "remove the main menu,
	you walk around your own headquarters and picking things takes you to different places in it", "a bit
	Metroidvania"). hq.ts = the rules, hqRender.ts = the drawing. Walk (A/D), jump and double jump (Space), dash (C),
	ladders (W/S), use a station (E or Enter, or tap the prompt). Tap anywhere to walk there; tap a station to walk to
	it and open it. The map (top right) fast-travels to rooms you have seen.
-->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { Hq, HQ_NO_INPUT, FLOORS, HQ_W, ROOMS, ROOM_BY_ID, VIEW_H, floorOf, type HqEvent, type HqInput, type RoomId, type Station } from '#lib/mayhem/hq.ts';
	import { drawHq } from '#lib/mayhem/hqRender.ts';
	import type { GunKind } from '#lib/mayhem/guns.ts';
	import type { GunPic, Look } from '#lib/mayhem/painter.ts';
	import type { Action } from '#lib/mayhem/controls.ts';
	import { mayhemText as M } from '#lib/i18n/mayhem.ts';

	let {
		active = true,
		look,
		gun,
		gunKind,
		keys,
		pickLabel = 'E',
		stats,
		startAt = 'locker',
		seen = [],
		secret = false,
		onuse,
		onseen,
		onsound
	}: {
		active?: boolean;
		look: Look;
		gun: GunPic | null;
		gunKind: GunKind | null;
		keys: Map<string, Action>;
		pickLabel?: string;
		stats: { cleared: number; total: number; free: number; levelName: string };
		startAt?: RoomId;
		seen?: string[];
		secret?: boolean;
		onuse: (s: Station) => void;
		onseen?: (seen: RoomId[], secret: boolean) => void;
		onsound?: (e: HqEvent) => void;
	} = $props();

	const hq = new Hq(untrack(() => startAt));
	hq.secretFound = untrack(() => secret);
	const seenSet = new Set<RoomId>(untrack(() => seen.filter((s): s is RoomId => ROOM_BY_ID.has(s as RoomId))));
	seenSet.add(hq.room);
	let seenList = $state<RoomId[]>([...seenSet]);
	let room = $state<RoomId>(hq.room);
	let near = $state<Station | null>(null);
	let banner = $state<{ n: number; id: RoomId } | null>({ n: 0, id: hq.room });
	let found = $state(false);
	let touchy = $state(false);
	let box: HTMLDivElement | undefined = $state();
	let canvas: HTMLCanvasElement | undefined = $state();
	let w = $state(960);
	let h = $state(540);
	const viewW = $derived(Math.min(HQ_W, (VIEW_H * w) / Math.max(1, h)));
	const cam = { x: 0, y: 0 };
	let camX = $state(0);
	let camY = $state(0);
	let reduce = false;
	const input: HqInput = { ...HQ_NO_INPUT };

	const STATION_NAME = $derived<Record<Station, string>>({ ...M.hq.stations, deploy: M.hq.deployTo(stats.levelName) });

	function camTarget() {
		const p = hq.p;
		const tx = Math.max(0, Math.min(HQ_W - viewW, p.x - viewW / 2));
		const ty = Math.max(0, Math.min(VIEW_H, ((p.y - FLOORS[0]) * VIEW_H) / (FLOORS[1] - FLOORS[0])));
		return { tx, ty };
	}

	let raf = 0;
	let last = 0;
	let bannerTimer = 0;
	function frame(now: number) {
		const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
		last = now;
		hq.step(dt, active ? input : HQ_NO_INPUT);
		for (const e of hq.events) handle(e);
		const { tx, ty } = camTarget();
		const k = reduce ? 1 : Math.min(1, dt * 6);
		cam.x += (tx - cam.x) * k;
		cam.y += (ty - cam.y) * k;
		const n = hq.near();
		const ns = n?.station ?? null;
		if (ns !== near) near = ns;
		camX = cam.x;
		camY = cam.y;
		draw();
		raf = requestAnimationFrame(frame);
	}

	function handle(e: HqEvent) {
		onsound?.(e);
		if (e.t === 'room') {
			room = e.id;
			banner = { n: performance.now(), id: e.id };
			clearTimeout(bannerTimer);
			bannerTimer = window.setTimeout(() => (banner = null), 2200);
			if (!seenSet.has(e.id)) {
				seenSet.add(e.id);
				seenList = [...seenSet];
				onseen?.(seenList, hq.secretFound);
			}
		} else if (e.t === 'arrive') onuse(e.station);
		else if (e.t === 'secret') {
			found = true;
			onseen?.(seenList, true);
			window.setTimeout(() => (found = false), 4500);
		}
	}

	function draw() {
		const c = canvas?.getContext('2d');
		if (!c || !canvas) return;
		drawHq(c, hq, {
			scale: canvas.width / viewW,
			pw: canvas.width,
			ph: canvas.height,
			cam,
			look,
			gun,
			gunKind,
			near: hq.near(),
			seen: seenSet,
			stats: { cleared: stats.cleared, total: stats.total, free: stats.free, secret: hq.secretFound },
			reduce
		});
	}

	function resize() {
		if (!box || !canvas) return;
		const r = box.getBoundingClientRect();
		w = Math.max(100, r.width);
		h = Math.max(60, r.height);
		const d = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.round(w * d);
		canvas.height = Math.round(h * d);
		const { tx, ty } = camTarget();
		cam.x = tx;
		cam.y = ty;
	}

	onMount(() => {
		reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		touchy = matchMedia('(pointer: coarse)').matches;
		const ro = new ResizeObserver(resize);
		if (box) ro.observe(box);
		resize();
		bannerTimer = window.setTimeout(() => (banner = null), 2200);
		raf = requestAnimationFrame(frame);
		// for the check scripts (read only)
		(window as unknown as { __hq: Hq }).__hq = hq;
		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(bannerTimer);
			ro.disconnect();
		};
	});

	// ---------- input ----------
	function typing(e: Event) {
		const el = e.target as HTMLElement | null;
		return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
	}
	function use() {
		const n = hq.near();
		if (n?.station) onuse(n.station);
	}
	function keydown(e: KeyboardEvent) {
		if (!active || typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
		const a = keys.get(e.code);
		if (e.code === 'Enter' || a === 'pick') {
			if (e.repeat) return;
			e.preventDefault();
			use();
			return;
		}
		if (a === 'left' || a === 'right' || a === 'jump' || a === 'down' || a === 'dash') {
			e.preventDefault();
			input[a] = true;
		}
	}
	function keyup(e: KeyboardEvent) {
		const a = keys.get(e.code);
		if (a === 'left' || a === 'right' || a === 'jump' || a === 'down' || a === 'dash') input[a] = false;
	}
	$effect(() => {
		if (!active) untrack(() => Object.assign(input, HQ_NO_INPUT));
	});

	/** tap / click: walk there (a station: walk to it and open it) */
	function tap(e: PointerEvent) {
		if (!active || !box || (e.target as HTMLElement).closest('button')) return;
		const r = box.getBoundingClientRect();
		const wx = cam.x + ((e.clientX - r.left) / r.width) * viewW;
		const wy = cam.y + ((e.clientY - r.top) / r.height) * VIEW_H;
		const f = floorOf(wy);
		const st = ROOMS.find((x) => x.station && x.floor === f && Math.abs(x.sx - wx) < 64);
		if (st?.station) {
			if (hq.near()?.id === st.id) onuse(st.station);
			else hq.goTo(st.station);
		} else hq.target = { x: Math.max(14, Math.min(HQ_W - 14, wx)), floor: f, station: null };
	}

	function hold(k: keyof HqInput) {
		return {
			onpointerdown: (e: PointerEvent) => {
				e.preventDefault();
				e.stopPropagation();
				touchy = true;
				input[k] = true;
			},
			onpointerup: () => (input[k] = false),
			onpointercancel: () => (input[k] = false),
			onpointerleave: () => (input[k] = false)
		};
	}

	/** where the "use" prompt sits on screen (% of the box) */
	const promptAt = $derived.by(() => {
		if (!near) return null;
		const r = ROOMS.find((x) => x.station === near)!;
		return { left: ((r.sx - camX) / viewW) * 100, top: ((FLOORS[r.floor] - 150 - camY) / VIEW_H) * 100 };
	});
</script>

<svelte:window onkeydown={keydown} onkeyup={keyup} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="hq" bind:this={box} onpointerdown={tap}>
	<canvas bind:this={canvas} aria-hidden="true"></canvas>

	{#if banner}
		{#key banner.n}
			<p class="hq-banner font-head" aria-live="polite">
				<small>{M.hq.floorName[ROOM_BY_ID.get(banner.id)!.floor]}</small>{M.hq.rooms[banner.id]}
			</p>
		{/key}
	{/if}
	{#if found}<p class="hq-found font-head" aria-live="polite">{M.hq.secret}</p>{/if}

	{#if near && promptAt}
		<button type="button" class="hq-use" style:left="{promptAt.left}%" style:top="{promptAt.top}%" onclick={use}>
			{#if !touchy}<kbd>{pickLabel}</kbd>{/if}{STATION_NAME[near]}
		</button>
	{/if}

	<nav class="hq-map" aria-label={M.hq.mapLabel}>
		<span class="hq-map-t font-head">{M.hq.map}</span>
		<div class="hq-map-g">
			{#each ROOMS as r (r.id)}
				{@const known = seenList.includes(r.id)}
				<button
					type="button"
					class="hq-cell"
					class:here={room === r.id}
					class:known
					data-room={r.id}
					disabled={!known}
					aria-label={known ? M.hq.travel(M.hq.rooms[r.id], r.station ? M.hq.stations[r.station] : '') : M.hq.unknown}
					title={known ? M.hq.rooms[r.id] : M.hq.unknown}
					onclick={() => hq.teleport(r.id)}
				>
					{known ? M.hq.icon[r.id] : '?'}
					{#if r.station === 'skills' && stats.free > 0 && known}<i class="num">{stats.free}</i>{/if}
				</button>
			{/each}
		</div>
	</nav>

	{#if touchy}
		<div class="hq-touch">
			<div class="hq-pad">
				<button type="button" class="hq-tb" aria-label={M.touch.left} {...hold('left')}>◀</button>
				<button type="button" class="hq-tb" aria-label={M.touch.right} {...hold('right')}>▶</button>
			</div>
			<div class="hq-pad">
				<button type="button" class="hq-tb" aria-label={M.hq.down} {...hold('down')}>▼</button>
				<button type="button" class="hq-tb" aria-label={M.touch.jump} {...hold('jump')}>▲</button>
			</div>
		</div>
	{:else}
		<p class="hq-hint">{M.hq.hint(pickLabel)}</p>
	{/if}
</div>

<style>
	.hq {
		position: absolute;
		inset: 0;
		cursor: pointer;
		touch-action: manipulation;
	}
	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
	.hq-banner {
		position: absolute;
		left: 50%;
		top: 9%;
		transform: translateX(-50%);
		margin: 0;
		display: grid;
		justify-items: center;
		pointer-events: none;
		font-size: clamp(18px, 4.2vw, 40px);
		letter-spacing: 0.08em;
		color: #e9fbd8;
		text-shadow:
			0 2px 0 #000,
			0 0 18px rgba(157, 255, 46, 0.55);
		white-space: nowrap;
		animation: hq-banner 2.2s ease-out both;
	}
	.hq-banner small {
		font-size: 0.32em;
		letter-spacing: 0.3em;
		color: #9dff2e;
	}
	@keyframes hq-banner {
		0% {
			opacity: 0;
			transform: translate(-50%, 8px);
		}
		15%,
		75% {
			opacity: 1;
			transform: translate(-50%, 0);
		}
		100% {
			opacity: 0;
		}
	}
	.hq-found {
		position: absolute;
		left: 50%;
		top: 30%;
		transform: translateX(-50%);
		margin: 0;
		padding: 8px 14px;
		border-radius: 8px;
		background: rgba(30, 22, 0, 0.85);
		border: 1.5px solid #ffcf40;
		color: #ffe28a;
		font-size: clamp(13px, 2.2vw, 20px);
		text-align: center;
		pointer-events: none;
		max-width: 90%;
	}
	.hq-use {
		position: absolute;
		transform: translate(-50%, -100%);
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		padding: 6px 12px;
		border-radius: 999px;
		border: 1.5px solid #9dff2e;
		background: rgba(8, 14, 6, 0.88);
		color: #e9fbd8;
		font-weight: 700;
		font-size: 13px;
		white-space: nowrap;
		cursor: pointer;
		box-shadow: 0 0 14px rgba(157, 255, 46, 0.35);
	}
	.hq-use:hover,
	.hq-use:focus-visible {
		background: #1c3a0a;
	}
	.hq-use kbd {
		display: inline-grid;
		place-items: center;
		min-width: 22px;
		height: 22px;
		padding: 0 4px;
		border-radius: 4px;
		background: #9dff2e;
		color: #0b1206;
		font: inherit;
		font-size: 12px;
	}
	.hq-map {
		position: absolute;
		right: 8px;
		top: 8px;
		padding: 4px 6px 6px;
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.6);
		border: 1px solid rgba(157, 255, 46, 0.35);
	}
	.hq-map-t {
		display: block;
		font-size: 10px;
		letter-spacing: 0.18em;
		color: #9dff2e;
		text-align: center;
	}
	.hq-map-g {
		display: grid;
		grid-template-columns: repeat(3, 44px);
		gap: 3px;
	}
	.hq-cell {
		position: relative;
		width: 44px;
		height: 44px;
		border-radius: 5px;
		border: 1px solid #2a3a24;
		background: #0c120a;
		color: #5a6a54;
		font-size: 18px;
		cursor: pointer;
	}
	.hq-cell.known {
		background: #172414;
		color: #e9fbd8;
	}
	.hq-cell.here {
		border-color: #9dff2e;
		box-shadow: inset 0 0 0 1px #9dff2e;
	}
	.hq-cell:disabled {
		cursor: default;
	}
	.hq-cell i {
		position: absolute;
		top: -5px;
		right: -5px;
		min-width: 16px;
		height: 16px;
		border-radius: 8px;
		background: #ff6a1a;
		color: #fff;
		font-size: 10px;
		font-style: normal;
		line-height: 16px;
	}
	.hq-hint {
		position: absolute;
		left: 8px;
		bottom: 6px;
		margin: 0;
		padding: 3px 8px;
		border-radius: 6px;
		background: rgba(0, 0, 0, 0.55);
		font-size: 11px;
		color: #c8dcb8;
		pointer-events: none;
	}
	.hq-touch {
		position: absolute;
		inset: auto 8px 8px;
		display: flex;
		justify-content: space-between;
		pointer-events: none;
	}
	.hq-pad {
		display: flex;
		gap: 8px;
	}
	.hq-tb {
		pointer-events: auto;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: 1.5px solid rgba(157, 255, 46, 0.6);
		background: rgba(0, 0, 0, 0.5);
		color: #e9fbd8;
		font-size: 18px;
		touch-action: none;
	}
	/* narrow: the room name goes top left, clear of the map */
	.hq {
		container-type: inline-size;
	}
	@container (max-width: 560px) {
		.hq-banner {
			left: 10px;
			top: 8px;
			transform: none;
			justify-items: start;
			font-size: 18px;
			max-width: calc(100% - 175px);
			white-space: normal;
			animation-name: hq-banner-l;
		}
		.hq-found {
			top: auto;
			bottom: 68px;
		}
	}
	@keyframes hq-banner-l {
		0% {
			opacity: 0;
		}
		15%,
		75% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.hq-banner {
			animation: none;
		}
	}
</style>
