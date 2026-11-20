<!--
	net_graph (2026-11-20, the user's ask: "add like a net_graph on the top left of the site that shows cpu usage
	on PC"): a small readout in the top-left corner, styled after the game's console graph. Only on a PC (a mouse
	and at least 1024 px wide) and only while switched on (netGraph.svelte.ts, theme menu or the terminal's
	`net_graph 0/1`). A page can't read the real CPU %, so it shows what it can, all estimates:
	 - fps: how often the decoration is drawn now (app.html's frame cap, max 24; 0 in Battery saver) and the
	   screen's refresh rate (measured once with requestAnimationFrame)
	 - cpu: how busy the page keeps the browser's main thread (loadMeter.ts, from idle-callback time)
	 - pc: how hard the whole computer works, where the browser tells (Compute Pressure API: Chrome / Edge)
	 - anim: endless animations moving now / in total (off screen and in Battery saver they stand still)
	 - mem: memory the page's code uses (Chrome / Edge)
	A bar graph of the last 30 s of "cpu". Updated twice a second; it costs next to nothing itself (no animation
	frames of its own). Decoration for the curious: aria-hidden, clicks go through it.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '#lib/i18n/en.ts';
	import { IdleMeter, loadBand } from '#lib/loadMeter.ts';
	import { motion } from '#lib/motion.svelte.ts';
	import { netGraph } from '#lib/netGraph.svelte.ts';

	type Fx = { fps: number; held: number; moving: number; steps: number };
	const SAMPLES = 60; // 30 s at 2 a second

	let pc = $state(false);
	let fps = $state(0);
	let hz = $state(0);
	let cpu = $state<number | null>(null);
	let sys = $state<string | null>(null);
	let anim = $state('0/0');
	let mem = $state<number | null>(null);
	let history = $state<number[]>([]);

	const show = $derived(pc && netGraph.on);

	onMount(() => {
		netGraph.load();
		const query = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)');
		const onQuery = () => (pc = query.matches);
		onQuery();
		query.addEventListener('change', onQuery);
		return () => query.removeEventListener('change', onQuery);
	});

	// <html data-netgraph> while shown, so the settings row moves its first item clear of the readout
	$effect(() => {
		document.documentElement.toggleAttribute('data-netgraph', show);
		return () => document.documentElement.removeAttribute('data-netgraph');
	});

	$effect(() => {
		if (!show) return;
		const win = window as Window & { __mw4fx?: Fx };
		const meter = new IdleMeter(performance.now());
		// Safari has no idle callbacks: then "cpu" shows –
		const ric = typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback.bind(window) : null;
		let idleHandle = 0;
		const onIdle = (deadline: IdleDeadline) => {
			meter.idle(performance.now(), deadline.timeRemaining());
			idleHandle = ric!(onIdle);
		};
		if (ric) idleHandle = ric(onIdle);

		// the screen's refresh rate, measured once: the median gap between 40 frames of requestAnimationFrame
		// (a median, so a slow frame while the page loads doesn't count); shown only when it looks like a screen
		const gaps: number[] = [];
		let raf = 0;
		let prev = 0;
		const count = (at: number) => {
			if (prev) gaps.push(at - prev);
			prev = at;
			if (gaps.length < 40) raf = requestAnimationFrame(count);
			else {
				const mid = [...gaps].sort((a, b) => a - b)[gaps.length >> 1];
				const rate = Math.round(1000 / mid);
				hz = rate >= 30 && rate <= 500 ? rate : 0;
			}
		};
		raf = requestAnimationFrame(count);

		// the whole computer's load, where the browser tells (Chrome / Edge on a PC)
		type PressureRecord = { state: string };
		type PressureObserverLike = { observe(source: string, o?: object): Promise<void>; disconnect(): void };
		const PO = (window as Window & { PressureObserver?: new (cb: (r: PressureRecord[]) => void) => PressureObserverLike }).PressureObserver;
		let pressure: PressureObserverLike | null = null;
		if (PO) {
			try {
				pressure = new PO((records) => (sys = records[records.length - 1]?.state ?? null));
				pressure.observe('cpu', { sampleInterval: 1000 }).catch(() => (pressure = null));
			} catch {
				pressure = null;
			}
		}

		let lastSteps = win.__mw4fx?.steps ?? 0;
		let lastAt = performance.now();
		const sample = () => {
			const now = performance.now();
			const fx = win.__mw4fx;
			if (fx) {
				fps = Math.round(((fx.steps - lastSteps) / (now - lastAt)) * 1000);
				lastSteps = fx.steps;
				anim = `${fx.moving}/${fx.held}`;
			}
			lastAt = now;
			if (ric) {
				cpu = meter.take(now);
				history = [...history, cpu].slice(-SAMPLES);
			}
			const m = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
			if (m) mem = Math.round(m.usedJSHeapSize / 1048576);
		};
		const timer = setInterval(sample, 500);
		return () => {
			clearInterval(timer);
			cancelAnimationFrame(raf);
			if (idleHandle && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleHandle);
			pressure?.disconnect();
		};
	});

	const W = 64;
	const H = 34;
	const bars = $derived(
		history.map((v, i) => ({ x: W - (history.length - i) * (W / SAMPLES), h: Math.max(1, (v / 100) * H), band: loadBand(v) }))
	);
</script>

{#if show}
	<div class="ng" aria-hidden="true">
		<div class="ng-lines">
			<p><b>{t.netGraph.fps}</b> <span class="num">{motion.still ? 0 : fps}</span>{#if hz}<i> · {hz} Hz</i>{/if}{#if motion.still}<em>{t.netGraph.saver}</em>{/if}</p>
			<p>
				<b>{t.netGraph.cpu}</b> <span class="num" data-band={cpu === null ? 'ok' : loadBand(cpu)}>{cpu === null ? '–' : `${cpu}%`}</span>
				{#if sys}<b class="ml">{t.netGraph.sys}</b> <span data-band={sys === 'nominal' ? 'ok' : sys === 'fair' ? 'warn' : 'bad'}>{t.netGraph.pressure[sys] ?? sys}</span>{/if}
			</p>
			<p><b>{t.netGraph.anim}</b> <span class="num">{anim}</span>{#if mem !== null}<b class="ml">{t.netGraph.mem}</b> <span class="num">{mem} MB</span>{/if}</p>
		</div>
		<svg class="ng-graph" viewBox="0 0 {W} {H}" width={W} height={H} preserveAspectRatio="none">
			<path d="M0 {H * 0.3}H{W}M0 {H * 0.65}H{W}" stroke="rgb(255 255 255 / 0.12)" stroke-width="0.5" />
			{#each bars as bar, i (i)}
				<rect x={bar.x} y={H - bar.h} width={W / SAMPLES} height={bar.h} data-band={bar.band} />
			{/each}
		</svg>
	</div>
{/if}

<style>
	.ng {
		position: fixed;
		top: 6px;
		left: 6px;
		z-index: 35;
		display: flex;
		gap: 8px;
		align-items: center;
		width: 236px;
		height: 50px;
		padding: 4px 8px;
		border-radius: 6px;
		background: rgb(0 0 0 / 0.62);
		box-shadow: 0 0 0 1px rgb(255 255 255 / 0.08);
		color: #f2f2f2;
		font: 11px/1.3 ui-monospace, 'Cascadia Mono', Consolas, monospace;
		text-shadow: 0 1px 1px #000;
		pointer-events: none;
		/* its own layer and box: the twice-a-second updates never re-lay out or repaint the page */
		contain: strict;
		will-change: transform;
	}
	.ng-lines {
		flex: 1;
		min-width: 0;
		white-space: nowrap;
	}
	.ng-lines p {
		overflow: hidden;
		text-overflow: ellipsis;
	}
	b {
		color: #ffd75a;
		font-weight: 600;
	}
	.ml {
		margin-left: 8px;
	}
	i {
		color: rgb(242 242 242 / 0.6);
		font-style: normal;
	}
	em {
		margin-left: 6px;
		padding: 0 4px;
		border-radius: 3px;
		background: #3ee06a;
		color: #062010;
		font-style: normal;
		font-weight: 700;
		text-shadow: none;
	}
	[data-band='ok'] {
		color: #7dff5a;
		fill: #7dff5a;
	}
	[data-band='warn'] {
		color: #ffd75a;
		fill: #ffd75a;
	}
	[data-band='bad'] {
		color: #ff5a4a;
		fill: #ff5a4a;
	}
	.ng-graph {
		flex: none;
		border-left: 1px solid rgb(255 255 255 / 0.15);
		border-bottom: 1px solid rgb(255 255 255 / 0.15);
	}
	/* the settings row's first item (save status) moves right of the readout while it shows */
	:global(html[data-netgraph] .hdr-bar) {
		padding-left: max(1.25rem, calc(256px - max(0px, (100vw - 1240px) / 2)));
	}
</style>
