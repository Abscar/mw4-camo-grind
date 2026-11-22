<!--
	Tonight's roulette (squad step 3, 2026-11-14; the user's pick from the brainstorm): one spin that
	looks the same on every squad page. The spinner's page draws the guns (squad-fun.ts `spin`: only
	guns nobody in the group has maxed) and stores them with a start time ~40 s ahead, so every open
	page (they read the squad every 30 s) has it before it spins; the spin then runs off the sync
	service's clock. "One class for all" spins a wheel of classes, then everyone's gun; "a gun each"
	rolls one reel per member. Reduced motion / paused animations: straight to the result.
-->
<script lang="ts">
	import { CLASSES, WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { motion } from '#lib/motion.svelte.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { roulettePool, spinPhase, wheelSegments, ROULETTE_MS, SPIN_MS } from '#lib/squad-fun.ts';
	import { toast } from '#lib/toast.svelte.ts';

	const s = t.squad.roulette;
	const CLASS_NAME = Object.fromEntries(CLASSES.map((c) => [c.id, c.name]));
	const CLASS_SHORT = Object.fromEntries(CLASSES.map((c) => [c.id, c.short]));
	const COLORS = ['#c4132f', '#1f2a36', '#e0a420', '#2b3a48', '#ff4418', '#33414f', '#8d1622', '#26313c', '#d98c1a', '#3a4856'];

	let now = $state(Date.now());
	let busy = $state(false);
	let reduced = $state(false);

	$effect(() => {
		reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
	});

	const r = $derived.by(() => {
		const x = squad.doc?.roulette;
		return x && squad.serverNow() - x.at < ROULETTE_MS ? x : null;
	});
	const names = $derived(Object.fromEntries(squad.entries.map((e) => [e.id, e.member.name])));
	const pool = $derived(r ? roulettePool(Object.keys(r.picks).map((id) => squad.byId(id)?.member ?? { weapons: {} })) : []);
	const segments = $derived(r ? wheelSegments(r, pool) : []);
	const instant = $derived(reduced || motion.still);
	const phase = $derived(r ? (instant && now >= r.at ? 'done' : spinPhase(r.at, now)) : 'done');
	const online = $derived(squad.entries.filter((e) => e.online).length);

	// a clock that runs fast only while something is about to spin or spinning
	$effect(() => {
		if (!r) return;
		let raf = 0;
		let timer: ReturnType<typeof setInterval> | undefined;
		const tick = () => {
			now = squad.serverNow();
			if (now < r.at + SPIN_MS + 200) raf = requestAnimationFrame(tick);
		};
		if (squad.serverNow() < r.at + SPIN_MS + 200) raf = requestAnimationFrame(tick);
		else {
			now = squad.serverNow();
			timer = setInterval(() => (now = squad.serverNow()), 30_000);
		}
		return () => {
			cancelAnimationFrame(raf);
			clearInterval(timer);
		};
	});

	/** A number from the roulette's id, so the wheel's extra turn is the same on every page. */
	const jitter = (id: string) => [...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 997, 7) / 997;
	const ease = (p: number) => 1 - Math.pow(1 - p, 4);

	const target = $derived(r ? (r.mode === 'class' ? r.cls ?? '' : '') : '');
	const seg = $derived(segments.length ? 360 / segments.length : 360);
	const finalAngle = $derived.by(() => {
		if (!r || r.mode !== 'class') return 0;
		const i = Math.max(0, segments.indexOf(target));
		// the pointer is at the top: turn so the middle of the target's slice ends there (+ a nudge inside it)
		return 360 * 6 + (360 - (i + 0.5) * seg) + (jitter(r.id) - 0.5) * seg * 0.6;
	});
	const angle = $derived(phase === 'wait' ? 0 : phase === 'done' ? finalAngle : finalAngle * ease(phase as number));
	/** Reels ("a gun each") stop one after the other. */
	const reelStop = (i: number, n: number) => (0.45 + (0.5 * (i + 1)) / Math.max(1, n)) * SPIN_MS;
	function reelText(i: number, id: string, n: number): string {
		if (!r) return '';
		const elapsed = now - r.at;
		if (phase === 'done' || elapsed >= reelStop(i, n) || phase === 'wait') return phase === 'wait' ? '?' : (WEAPON_BY_ID.get(r.picks[id])?.name ?? '');
		const list = pool.length ? pool : Object.values(r.picks);
		return WEAPON_BY_ID.get(list[(Math.floor(elapsed / 70) + i * 7) % list.length])?.name ?? '';
	}

	function arc(i: number): string {
		const a0 = ((i * seg - 90) * Math.PI) / 180;
		const a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
		const R = 96;
		const large = seg > 180 ? 1 : 0;
		return `M100 100 L${100 + R * Math.cos(a0)} ${100 + R * Math.sin(a0)} A${R} ${R} 0 ${large} 1 ${100 + R * Math.cos(a1)} ${100 + R * Math.sin(a1)} Z`;
	}
	const labelAt = (i: number) => (i + 0.5) * seg;

	async function go(mode: 'each' | 'class') {
		busy = true;
		const ok = await squad.spinRoulette(mode);
		busy = false;
		if (!ok) toast.show(s.allMaxed, undefined, 6000);
	}
	const left = $derived(r && phase === 'wait' ? Math.max(1, Math.ceil((r.at - now) / 1000)) : 0);
</script>

<section class="sq-box sq-roulette rounded-card border border-line bg-panel-2 p-3" aria-labelledby="sq-roulette-h">
	<div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
		<h3 id="sq-roulette-h" class="font-head text-[13px] font-bold tracking-[0.12em] uppercase">{s.heading}</h3>
		<p class="text-[11px] text-muted">{online >= 2 ? s.who(online) : s.whoAll}</p>
	</div>
	<p class="mt-1 text-xs text-muted">{s.note}</p>

	{#if r}
		<div class="mt-3 grid items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
			{#if r.mode === 'class'}
				<div class="rl-wheel-wrap" role="img" aria-label={s.wheel}>
					<svg class="rl-wheel" viewBox="0 0 200 200" aria-hidden="true">
						<g style:transform="rotate({angle}deg)" style:transform-origin="100px 100px">
							{#each segments as id, i (id)}
								<path d={arc(i)} fill={COLORS[i % COLORS.length]} stroke="#0d0f12" stroke-width="1.5" />
								<text
									x="100"
									y="22"
									transform="rotate({labelAt(i)} 100 100)"
									text-anchor="middle"
									class="rl-label"
									class:rl-hit={phase === 'done' && id === target}>{CLASS_SHORT[id] ?? id}</text
								>
							{/each}
						</g>
						<circle cx="100" cy="100" r="15" fill="#15181c" stroke="#e0a420" stroke-width="3" />
						<circle cx="100" cy="100" r="96" fill="none" stroke="#e0a420" stroke-width="3" />
					</svg>
					<svg class="rl-pointer" viewBox="0 0 20 22" aria-hidden="true"><path d="M2 2h16L10 20z" /></svg>
				</div>
			{/if}
			<div class="min-w-0" aria-live="polite">
				{#if phase === 'wait'}
					<p class="rl-count font-head">{s.startsIn(left)}</p>
				{:else if phase !== 'done'}
					<p class="rl-count font-head">{s.spinning}</p>
				{:else}
					<p class="rl-result font-head">{r.mode === 'class' && r.cls ? s.tonightClass(CLASS_NAME[r.cls] ?? r.cls) : s.tonightEach}</p>
				{/if}
				<ul class="mt-2 grid gap-1.5">
					{#each Object.keys(r.picks) as id, i (id)}
						<li class="rl-reel flex min-w-0 items-center gap-2" class:rl-mine={id === squad.me?.id}>
							<b class="w-24 flex-none truncate text-[13px]" title={names[id] ?? ''}>{names[id] ?? '?'}</b>
							<span class="rl-gun num min-w-0 flex-1 truncate font-head" class:rl-rolling={phase !== 'done' && phase !== 'wait'}
								>{reelText(i, id, Object.keys(r.picks).length)}</span
							>
						</li>
					{/each}
				</ul>
				{#if phase === 'done'}<p class="mt-2 text-[11px] text-muted">{s.by(names[r.by] ?? '?')}</p>{/if}
			</div>
		</div>
	{:else}
		<p class="mt-3 text-sm text-muted">{s.none}</p>
	{/if}

	<div class="mt-3 flex flex-wrap gap-2">
		<button type="button" class="btn btn-primary" disabled={busy || phase === 'wait' || (typeof phase === 'number')} onclick={() => void go('class')}>{s.cls}</button>
		<button type="button" class="btn" disabled={busy || phase === 'wait' || (typeof phase === 'number')} onclick={() => void go('each')}>{s.each}</button>
	</div>
</section>

<style>
	.rl-wheel-wrap {
		position: relative;
		width: min(220px, 70vw);
		margin-inline: auto;
	}
	.rl-wheel {
		display: block;
		width: 100%;
		filter: drop-shadow(0 4px 10px rgb(0 0 0 / 0.5));
	}
	.rl-label {
		fill: #fff;
		font: 700 10px var(--font-head, system-ui);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.rl-hit {
		fill: #ffe48a;
	}
	.rl-pointer {
		position: absolute;
		top: -6px;
		left: 50%;
		width: 20px;
		transform: translateX(-50%);
		fill: #ffe48a;
		stroke: #3a2400;
		stroke-width: 1.5;
		filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.6));
	}
	.rl-count {
		color: var(--t-accent);
		font-size: 14px;
		font-weight: 700;
	}
	.rl-result {
		font-size: 17px;
		font-weight: 800;
		letter-spacing: 0.04em;
	}
	.rl-reel {
		padding: 6px 8px;
		border-radius: 8px;
		background: rgb(0 0 0 / 0.25);
		border: 1px solid var(--t-line);
	}
	.rl-mine {
		border-color: var(--t-accent);
	}
	.rl-gun {
		color: #ffe48a;
		font-size: 14px;
		font-weight: 700;
	}
	.rl-rolling {
		filter: blur(0.6px);
		opacity: 0.85;
	}
</style>
