<!--
	Holk Park (2026-11-24, the user: "Gör Holkpark till en riktig destination. Låt fantasin flöda."). Tapping
	the park in Burgi City opens this: a night scene of the park (holkPark.ts draws the parts that never
	change) with things to do. Stoke the campfire and the squad round it tells a story, light the Golden
	Holk monument (smoke rings, always lit at 4:20), toss a wish in the leaf pond, order from the Munchie
	Truck, put the boombox on (a lo-fi loop made on the spot, parkRadio.ts), poke the weed buddy asleep in
	the hammock, and touch grass (a counter with titles). Every action is also a button under the scene,
	so phones (where the scene scrolls sideways) reach all of it. Counters per device only
	(`mw4-camo-grind:park`), never synced. Purely for fun: nothing here changes progress or burgers.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { SQUAD_OPS, type SquadOp } from '#lib/squad-codec.ts';
	import { four20 } from '#lib/four20.svelte.ts';
	import { SCENE_H, SCENE_W, SEATS, SPOT, EMPTY_LOG, cleanLog, grassRank, nextLine, parkScene, seeded, type ParkLog, type Station } from '#lib/holkPark.ts';
	import { ParkRadio } from '#lib/parkRadio.ts';
	import Dialog from './Dialog.svelte';
	import SquadAvatar from './SquadAvatar.svelte';
	import WeedCreature, { REACTIONS, type BuddyReaction } from './WeedCreature.svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	const SCENE = parkScene();
	const KEY = 'mw4-camo-grind:park';

	const OP_NAME: Record<SquadOp, string> = {
		abscar: 'Abscar',
		phillestar: 'Phillestar',
		lars: 'Drängen',
		jeeven: 'Da Jeeven',
		ingman: 'Ingman',
		aw: 'AW',
		joker: 'TheJoker_BPL'
	};
	/** round the fire: the squad's online members, or the header crew for visitors */
	const crew = $derived.by(() => {
		const list =
			squad.on && squad.entries.length
				? squad.entries.filter((e) => e.online).map((e) => ({ key: e.id, name: e.member.name, op: e.member.op ?? undefined }))
				: SQUAD_OPS.map((op) => ({ key: op, name: OP_NAME[op], op: op as SquadOp | undefined }));
		return list.slice(0, SEATS.length);
	});

	// ——— counters (per device) ———
	let log = $state<ParkLog>({ ...EMPTY_LOG });
	let loaded = false;
	function load() {
		if (loaded) return;
		loaded = true;
		try {
			log = cleanLog(JSON.parse(localStorage.getItem(KEY) ?? '{}'));
		} catch {
			/* private mode: start at zero */
		}
	}
	function bump(k: keyof ParkLog) {
		log = { ...log, [k]: log[k] + 1 };
		try {
			localStorage.setItem(KEY, JSON.stringify(log));
		} catch {
			/* not saved */
		}
	}

	// ——— what was just said ———
	let say = $state('');
	let sayAt = $state<Station | null>(null);
	let sayKey = $state(0);
	let sayTimer: ReturnType<typeof setTimeout> | undefined;
	function speak(text: string, at: Station | null) {
		say = text;
		sayAt = at;
		sayKey++;
		clearTimeout(sayTimer);
		sayTimer = setTimeout(() => (sayAt = null), 5200);
	}
	const last: Record<string, number> = {};
	function pick<T>(list: readonly T[], k: string): T {
		const i = nextLine(list.length, last[k] ?? -1, Math.random());
		last[k] = i;
		return list[i];
	}

	// ——— the stations ———
	let fireHot = $state(0);
	let litRun = $state(0);
	let lit = $state(false);
	let wishRun = $state(0);
	let truckRun = $state(0);
	let munchie = $state('');
	let grassRun = $state(0);
	let flowers = $state<{ id: number; x: number; y: number; c: string }[]>([]);
	let reaction = $state<BuddyReaction | null>(null);
	let buddyRun = $state(0);
	const timers = new Set<ReturnType<typeof setTimeout>>();
	const later = (ms: number, fn: () => void) => {
		const id = setTimeout(() => {
			timers.delete(id);
			fn();
		}, ms);
		timers.add(id);
	};

	const radio = new ParkRadio();
	let playing = $state(false);

	const lit420 = $derived(four20.active);

	function act(s: Station) {
		focusOn(s);
		if (s === 'fire') {
			fireHot++;
			bump('fires');
			const who = crew.length ? crew[Math.floor(Math.random() * crew.length)].name : t.park.someone;
			speak(t.park.fireSay(who, pick(t.park.stories, 'story')), 'fire');
		} else if (s === 'monument') {
			litRun++;
			lit = true;
			bump('breaks');
			later(6500, () => (lit = false));
			speak(pick(t.park.monumentSay, 'mon'), 'monument');
		} else if (s === 'pond') {
			wishRun++;
			bump('wishes');
			later(900, () => speak(pick(t.park.wishSay, 'wish'), 'pond'));
		} else if (s === 'truck') {
			truckRun++;
			bump('munchies');
			const line = pick(t.park.munchies, 'munch');
			munchie = [...line].at(-1) ?? '🍔';
			speak(line, 'truck');
		} else if (s === 'radio') {
			if (playing) {
				radio.stop();
				playing = false;
				speak(t.park.radioOffSay, 'radio');
			} else {
				playing = radio.start();
				if (playing) speak(t.park.radioOnSay, 'radio');
			}
		} else if (s === 'grass') {
			grassRun++;
			bump('grass');
			const rnd = seeded(log.grass * 7919 + 13);
			const add = Array.from({ length: 3 }, (_, i) => ({
				id: log.grass * 10 + i,
				x: SPOT.grass.x + 20 + rnd() * (SPOT.grass.w - 40),
				y: SPOT.grass.y + 10 + rnd() * 34,
				c: ['#ff5cb8', '#ffd54a', '#fff', '#a560ff', '#4d8dff'][Math.floor(rnd() * 5)]
			}));
			flowers = [...flowers, ...add].slice(-18);
			speak(`${pick(t.park.grassSay, 'grass')} (${t.park.grassRank[grassRank(log.grass)]})`, 'grass');
		} else if (s === 'hammock') {
			reaction = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
			buddyRun++;
			later(2200, () => (reaction = null));
			speak(lit420 ? t.park.buddyAwake : pick(t.park.buddySay, 'buddy'), 'hammock');
		}
	}

	// phones: the scene scrolls sideways; bring the station into view when its button below is used
	let scroller = $state<HTMLDivElement>();
	let stage = $state<HTMLDivElement>();
	let k = $state(1);
	function focusOn(s: Station) {
		const sc = scroller;
		if (!sc || sc.scrollWidth <= sc.clientWidth) return;
		const sp = SPOT[s];
		const mid = (sp.x + sp.w / 2) * k;
		sc.scrollTo({ left: mid - sc.clientWidth / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
	}
	$effect(() => {
		const el = stage;
		if (!el) return;
		const ro = new ResizeObserver(() => (k = el.clientWidth / SCENE_W || 1));
		ro.observe(el);
		k = el.clientWidth / SCENE_W || 1;
		const sc = scroller;
		if (sc && sc.scrollWidth > sc.clientWidth) sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2;
		return () => ro.disconnect();
	});

	// opening: read the counters and say hello; closing: the radio stops, timers go
	$effect(() => {
		const on = open;
		untrack(() => {
		if (on) {
			load();
			speak(lit420 ? t.park.monument420 : t.park.welcome, null);
		} else {
			radio.stop();
			playing = false;
			for (const id of timers) clearTimeout(id);
			timers.clear();
			lit = false;
			reaction = null;
		}
		});
	});
	$effect(() => () => radio.stop());

	const STATIONS: { s: Station; icon: string; label: () => string }[] = [
		{ s: 'truck', icon: '🍔', label: () => t.park.act.truck },
		{ s: 'radio', icon: '📻', label: () => (playing ? t.park.act.radioOff : t.park.act.radioOn) },
		{ s: 'fire', icon: '🔥', label: () => t.park.act.fire },
		{ s: 'monument', icon: '🌿', label: () => t.park.act.monument },
		{ s: 'pond', icon: '🪙', label: () => t.park.act.pond },
		{ s: 'hammock', icon: '😴', label: () => t.park.act.buddy },
		{ s: 'grass', icon: '🌱', label: () => t.park.act.grass }
	];
	const bubbleAt = (s: Station) => {
		const sp = SPOT[s];
		return [Math.min(SCENE_W - 170, Math.max(170, sp.x + sp.w / 2)), sp.y - 6] as const;
	};
	const FLIES = Array.from({ length: 16 }, (_, i) => {
		const r = seeded(i * 31 + 5);
		return { x: r() * SCENE_W, y: 330 + r() * 260, d: 6 + r() * 6, dl: -r() * 8 };
	});
	const [ex, ey] = SPOT.monument.ember;
</script>

<Dialog bind:open title={t.park.title} class="hp-dlg">
	{#snippet custom(tid)}
		<div class="hp-head">
			<div class="min-w-0">
				<h2 id={tid} class="hp-title font-head">{t.park.title}</h2>
				<p class="hp-kicker">{t.park.kicker}<span class="hp-swipe"> · {t.park.swipe}</span></p>
			</div>
			<button type="button" class="hp-x" aria-label={t.park.close} onclick={() => (open = false)}>
				<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9m0-9l-9 9" /></svg>
			</button>
		</div>

		<div class="hp-body">
			<div class="hp-scroll" bind:this={scroller}>
				<div class="hp-stage" bind:this={stage} style:--k={k} style:--ik={1 / k} role="img" aria-label={t.park.scene}>
					<svg class="hp-lay" viewBox="0 0 {SCENE_W} {SCENE_H}" aria-hidden="true">{@html SCENE}</svg>

					<!-- the moving parts -->
					<svg class="hp-lay" viewBox="0 0 {SCENE_W} {SCENE_H}" aria-hidden="true">
						<!-- a shooting star now and then -->
						<path class="hp-shoot" d="M180 60 l-90 40" stroke="#fff" stroke-width="2.5" stroke-linecap="round" />
						<!-- the fountain -->
						<g class="hp-water">
							<path d="M860 518 q-26 -40 -52 18 M860 518 q26 -40 52 18 M860 518 v-24" stroke="#bfe6ff" stroke-width="3" fill="none" stroke-linecap="round" />
						</g>
						{#key wishRun}
							{#if wishRun}
								<circle class="hp-coin" cx="760" cy="420" r="8" fill="#ffd54a" stroke="#8a5a06" stroke-width="2" />
								{#each [0, 1, 2] as i (i)}
									<ellipse class="hp-ripple" style:animation-delay="{0.75 + i * 0.25}s" cx={SPOT.pond.cx + 30} cy={SPOT.pond.cy + 4} rx="30" ry="9" fill="none" stroke="#e6f7ff" stroke-width="2" />
								{/each}
							{/if}
						{/key}
						<!-- the campfire -->
						<g class="hp-flames" class:hot={fireHot > 0} style="transform-origin: {SPOT.fire.cx}px {SPOT.fire.cy}px">
							{#key fireHot}
								<g class:hp-stoke={fireHot > 0} style="transform-origin: {SPOT.fire.cx}px {SPOT.fire.cy}px">
									<path class="hp-f1" d="M{SPOT.fire.cx - 30} {SPOT.fire.cy} q-6 -40 18 -70 q2 30 14 36 q6 -30 24 -50 q10 44 -2 84z" fill="#ff5a1a" />
									<path class="hp-f2" d="M{SPOT.fire.cx - 18} {SPOT.fire.cy} q-2 -30 14 -48 q4 22 12 24 q4 -16 12 -26 q8 32 -4 50z" fill="#ffb347" />
									<path class="hp-f3" d="M{SPOT.fire.cx - 8} {SPOT.fire.cy} q0 -16 8 -26 q8 12 6 26z" fill="#fff3a0" />
								</g>
								{#if fireHot}
									{#each { length: 12 } as _, i (i)}
										<circle class="hp-spark" style:--dx="{(i - 5.5) * 9}px" style:--dy="{-90 - (i % 4) * 30}px" style:animation-delay="{(i % 3) * 0.08}s" cx={SPOT.fire.cx} cy={SPOT.fire.cy - 30} r="2.5" fill="#ffd54a" />
									{/each}
								{/if}
							{/key}
						</g>
						<!-- the monument's smoke (more and bigger while lit, always lit at 4:20) -->
						<g class="hp-mon" class:lit={lit || lit420}>
							<circle cx={ex} cy={ey} r="34" fill="url(#hp-ember)" class="hp-emberglow" />
							{#each { length: 9 } as _, i (i)}
								<circle class="hp-puff" style:animation-delay="-{i * 0.7}s" style:--sw="{(i % 2 ? -1 : 1) * (10 + i * 3)}px" cx={ex + 4} cy={ey - 10} r="14" fill="#e2e7e2" />
							{/each}
							{#key litRun}
								{#if litRun}
									{#each [0, 1, 2] as i (i)}
										<ellipse class="hp-ring" style:animation-delay="{i * 0.55}s" cx={ex} cy={ey - 30} rx="20" ry="8" fill="none" stroke="#f3f3f3" stroke-width="5" />
									{/each}
								{/if}
							{/key}
						</g>
						<!-- the truck's window flashes on an order -->
						{#key truckRun}
							{#if truckRun}
								<rect class="hp-flash" x={SPOT.truck.x + 24} y={SPOT.truck.y + 100} width="134" height="58" rx="6" fill="#fff" />
							{/if}
						{/key}
						<!-- notes from the boombox -->
						{#if playing}
							{#each [0, 1, 2, 3] as i (i)}
								<text class="hp-note" style:animation-delay="{i * 0.6}s" x={SPOT.radio.x + 40 + (i % 2) * 18} y={SPOT.radio.y + 10} font-size="20" fill={i % 2 ? '#ff8a2a' : '#9dff2e'}>{i % 2 ? '♫' : '♪'}</text>
							{/each}
						{/if}
						<!-- flowers popped up from touching grass -->
						{#each flowers as fl (fl.id)}
							<g class="hp-flower" style="transform-origin: {fl.x}px {fl.y}px">
								<path d="M{fl.x} {fl.y} v-10" stroke="#3ec24a" stroke-width="2" />
								{#each [0, 72, 144, 216, 288] as a (a)}
									<circle cx={fl.x + Math.cos((a * Math.PI) / 180) * 4} cy={fl.y - 12 + Math.sin((a * Math.PI) / 180) * 4} r="3" fill={fl.c} />
								{/each}
								<circle cx={fl.x} cy={fl.y - 12} r="2.2" fill="#ffd54a" />
							</g>
						{/each}
						{#key grassRun}
							{#if grassRun}
								<rect class="hp-rustle" x={SPOT.grass.x} y={SPOT.grass.y} width={SPOT.grass.w} height={SPOT.grass.h} rx="20" fill="#9dff2e" />
							{/if}
						{/key}
					</svg>

					<!-- people, the buddy, fireflies, bubbles and the tap areas (HTML, scaled with the scene) -->
					<div class="hp-html">
						{#each FLIES as fl, i (i)}
							<i class="hp-fly" style:left="{fl.x}px" style:top="{fl.y}px" style:animation-duration="{fl.d}s" style:animation-delay="{fl.dl}s"></i>
						{/each}
						{#each crew as c, i (c.key)}
							<span class="hp-seat" style:left="{SEATS[i][0]}px" style:top="{SEATS[i][1]}px" aria-hidden="true">
								<SquadAvatar name={c.name} op={c.op} size={46} />
								<span class="hp-name">{c.name}</span>
							</span>
						{/each}
						<span class="hp-buddy" aria-hidden="true">
							<WeedCreature class="w-full" mood={lit420 ? 'normal' : 'sleep'} blazing={lit420} {reaction} run={buddyRun} stage={3} />
						</span>
						{#key truckRun}
							{#if truckRun}
								<span class="hp-munchie" style:left="{SPOT.truck.x + 90}px" style:top="{SPOT.truck.y + 100}px" aria-hidden="true">{munchie}</span>
							{/if}
						{/key}
						{#if sayAt}
							{@const [bx, by] = bubbleAt(sayAt)}
							{#key sayKey}
								<span class="hp-bubble" style:left="{bx}px" style:top="{by}px" aria-hidden="true">{say}</span>
							{/key}
						{/if}
						{#each STATIONS as st (st.s)}
							{@const sp = SPOT[st.s]}
							<button
								type="button"
								class="hp-hit"
								data-s={st.s}
								tabindex="-1"
								aria-hidden="true"
								style:left="{sp.x}px"
								style:top="{sp.y}px"
								style:width="{sp.w}px"
								style:height="{sp.h}px"
								onclick={() => act(st.s)}
							></button>
						{/each}
					</div>
				</div>
			</div>

			<p class="hp-say" aria-live="polite">{say}</p>

			<div class="hp-acts">
				{#each STATIONS as st (st.s)}
					<button type="button" class="hp-act" data-act={st.s} aria-pressed={st.s === 'radio' ? playing : undefined} onclick={() => act(st.s)}>
						<span aria-hidden="true">{st.icon}</span>{st.label()}
					</button>
				{/each}
			</div>

			<div class="hp-log">
				<b>{t.park.log}</b>
				<span>🌿 {t.park.breaks}: <em>{log.breaks}</em></span>
				<span>🌱 {t.park.grass}: <em>{log.grass}</em> · {t.park.grassRank[grassRank(log.grass)]}</span>
				<span>🪙 {t.park.wishes}: <em>{log.wishes}</em></span>
				<span>🍔 {t.park.munchiesN}: <em>{log.munchies}</em></span>
				<span>🔥 {t.park.fires}: <em>{log.fires}</em></span>
				<small>{t.park.logNote}</small>
			</div>
		</div>
	{/snippet}
</Dialog>

<style>
	:global(dialog.hp-dlg) {
		margin: auto;
		padding: 0;
		width: min(1180px, calc(100vw - 16px));
		max-height: calc(100dvh - 16px);
		height: fit-content;
		border-radius: 16px;
		border: 2px solid #43d35e;
		background: #0b0a1c;
		color: #f4efff;
		box-shadow:
			0 0 40px -6px #43d35e88,
			0 30px 80px -20px #000;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	:global(dialog.hp-dlg:not([open])) {
		display: none;
	}
	:global(dialog.hp-dlg::backdrop) {
		background: #05040fcc;
		backdrop-filter: blur(3px);
	}
	.hp-head {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 10px 10px 18px;
		background: linear-gradient(90deg, #0f2a16, #1b1236 60%, #2a0f2a);
		border-bottom: 1px solid #2c4a33;
	}
	.hp-head > div {
		flex: 1;
	}
	.hp-title {
		margin: 0;
		font-size: 22px;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		background: linear-gradient(90deg, #d9ffd6, #43d35e 50%, #ffd54a);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		text-shadow: none !important;
	}
	.hp-kicker {
		margin: 2px 0 0;
		font-size: 13px;
		color: #b8d8bd;
	}
	.hp-swipe {
		display: none;
	}
	@media (max-width: 800px) {
		.hp-swipe {
			display: inline;
		}
	}
	.hp-x {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		flex: none;
		border-radius: 999px;
		border: 1px solid #43d35e88;
		background: #0b1a10;
		color: #d9ffd6;
	}
	.hp-x:hover {
		border-color: #ffd54a;
	}
	.hp-x svg {
		width: 16px;
		height: 16px;
		stroke: currentColor;
		stroke-width: 2.4;
		stroke-linecap: round;
	}
	.hp-x:focus-visible,
	.hp-act:focus-visible {
		outline: 3px solid #ffd54a;
		outline-offset: 2px;
	}
	.hp-body {
		overflow-y: auto;
		overscroll-behavior: contain;
	}
	.hp-scroll {
		overflow-x: auto;
		overflow-y: hidden;
		overscroll-behavior-x: contain;
		scrollbar-width: thin;
		scrollbar-color: #2c4a33 transparent;
	}
	.hp-stage {
		position: relative;
		width: 100%;
		min-width: 760px;
		aspect-ratio: 1200 / 640;
		overflow: hidden;
	}
	.hp-lay {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.hp-html {
		position: absolute;
		left: 0;
		top: 0;
		width: 1200px;
		height: 640px;
		transform: scale(var(--k));
		transform-origin: 0 0;
		pointer-events: none;
	}
	.hp-hit {
		position: absolute;
		padding: 0;
		border: 0;
		border-radius: 18px;
		background: transparent;
		cursor: pointer;
		pointer-events: auto;
		transition: background 0.15s;
	}
	@media (hover: hover) {
		.hp-hit:hover {
			background: radial-gradient(closest-side, #ffffff1c, transparent);
		}
	}
	.hp-seat {
		position: absolute;
		transform: translate(-23px, -46px);
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.hp-name {
		margin-top: -2px;
		padding: 0 5px;
		border-radius: 999px;
		background: #0a0814cc;
		font-size: max(10px, calc(8px * var(--ik)));
		font-weight: 700;
		white-space: nowrap;
	}
	.hp-buddy {
		position: absolute;
		left: 1022px;
		top: 400px;
		width: 112px;
		animation: hp-swing 4s ease-in-out infinite alternate;
		transform-origin: 56px -40px;
	}
	.hp-fly {
		position: absolute;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #eaff7a;
		box-shadow: 0 0 8px 3px #d4ff3a88;
		animation: hp-fly ease-in-out infinite alternate;
	}
	.hp-munchie {
		position: absolute;
		font-size: 40px;
		line-height: 1;
		transform: translate(-50%, -50%);
		animation: hp-munch 1.6s ease-out forwards;
	}
	.hp-bubble {
		position: absolute;
		max-width: 320px;
		width: max-content;
		transform: translate(-50%, -100%);
		padding: 8px 12px;
		border-radius: 14px;
		background: #fffdf2;
		color: #1a1230;
		border: 2px solid #1a1230;
		box-shadow: 0 6px 0 -1px #0007;
		font-size: max(14px, calc(11px * var(--ik)));
		font-weight: 650;
		line-height: 1.3;
		text-align: center;
		animation: hp-pop 0.25s ease-out;
	}
	.hp-bubble::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: -9px;
		width: 14px;
		height: 14px;
		background: #fffdf2;
		border: 2px solid #1a1230;
		border-top: 0;
		border-left: 0;
		transform: translateX(-50%) rotate(45deg);
	}
	.hp-say {
		margin: 0;
		padding: 10px 16px;
		min-height: 2.6em;
		background: #0f1a12;
		border-top: 1px solid #2c4a33;
		border-bottom: 1px solid #2c4a33;
		color: #d9ffd6;
		font-size: 14px;
	}
	.hp-acts {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 12px 16px;
	}
	.hp-act {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		min-height: 44px;
		padding: 0 14px;
		border-radius: 999px;
		border: 1.5px solid #2f6a3a;
		background: #10241a;
		color: #e8ffe6;
		font-size: 14px;
		font-weight: 700;
		transition:
			transform 0.1s,
			border-color 0.15s;
	}
	.hp-act:hover {
		border-color: #9dff2e;
	}
	.hp-act:active {
		transform: scale(0.96);
	}
	.hp-act[aria-pressed='true'] {
		background: #2a5a1a;
		border-color: #9dff2e;
		box-shadow: 0 0 14px -2px #9dff2e;
	}
	.hp-act span {
		font-size: 18px;
	}
	.hp-log {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 6px 16px;
		padding: 0 16px 14px;
		font-size: 13px;
		color: #b8d8bd;
	}
	.hp-log b {
		color: #ffd54a;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: 12px;
	}
	.hp-log em {
		font-style: normal;
		font-weight: 800;
		color: #fff;
	}
	.hp-log small {
		flex-basis: 100%;
		font-size: 11.5px;
		opacity: 0.75;
	}
	@media (max-width: 520px) {
		.hp-acts {
			display: grid;
			grid-template-columns: 1fr 1fr;
			padding: 10px 12px;
		}
		.hp-act {
			padding: 0 10px;
			font-size: 13px;
		}
		.hp-title {
			font-size: 19px;
		}
	}

	/* the scene's moving bits (classes in holkPark.ts and above) */
	.hp-lay :global(.hp-star) {
		animation: hp-twinkle 3.4s ease-in-out infinite;
	}
	.hp-lay :global(.hp-neon) {
		animation: hp-neon 4s infinite;
	}
	.hp-lay :global(.hp-win) {
		animation: hp-twinkle 5s steps(1) infinite;
	}
	.hp-lay :global(.hp-beacon) {
		animation: hp-twinkle 1.2s steps(1) infinite;
	}
	.hp-lay :global(.hp-glow) {
		animation: hp-breathe 1.8s ease-in-out infinite alternate;
		transform-box: fill-box;
		transform-origin: center;
	}
	.hp-lay :global(.hp-window) {
		animation: hp-breathe 3s ease-in-out infinite alternate;
	}
	.hp-shoot {
		opacity: 0;
		animation: hp-shoot 11s linear infinite;
	}
	.hp-water {
		animation: hp-twinkle 0.6s steps(2) infinite;
	}
	.hp-flames {
		transition: transform 0.4s ease;
	}
	.hp-flames.hot {
		transform: scale(1.08);
	}
	.hp-f1,
	.hp-f2,
	.hp-f3 {
		transform-box: fill-box;
		transform-origin: center bottom;
		animation: hp-flicker 0.5s ease-in-out infinite alternate;
	}
	.hp-f2 {
		animation-delay: -0.2s;
		animation-duration: 0.4s;
	}
	.hp-f3 {
		animation-delay: -0.1s;
		animation-duration: 0.3s;
	}
	.hp-stoke {
		animation: hp-stoke 2.4s ease-out;
	}
	.hp-spark {
		animation: hp-spark 1.3s ease-out forwards;
	}
	.hp-puff {
		opacity: 0;
		filter: blur(3px);
		animation: hp-puff 6.3s ease-out infinite;
	}
	.hp-mon:not(.lit) .hp-puff:nth-child(n + 6) {
		display: none;
	}
	.hp-mon.lit .hp-puff {
		animation-duration: 3.6s;
	}
	.hp-emberglow {
		opacity: 0.5;
		transform-box: fill-box;
		transform-origin: center;
		transition: opacity 0.4s;
	}
	.hp-mon.lit .hp-emberglow {
		opacity: 1;
		animation: hp-breathe 0.9s ease-in-out infinite alternate;
	}
	.hp-mon.lit :global(.hp-statue) {
		filter: drop-shadow(0 0 14px #ffd23a);
	}
	.hp-ring {
		opacity: 0;
		animation: hp-ring 2.6s ease-out forwards;
		transform-box: fill-box;
		transform-origin: center;
	}
	.hp-coin {
		animation: hp-coin 0.85s cubic-bezier(0.3, 0, 0.7, 1) forwards;
	}
	.hp-ripple {
		opacity: 0;
		transform-box: fill-box;
		transform-origin: center;
		animation: hp-ripple 1.4s ease-out forwards;
	}
	.hp-flash {
		opacity: 0;
		animation: hp-flash 0.6s ease-out;
	}
	.hp-note {
		opacity: 0;
		animation: hp-note 2.4s ease-out infinite;
	}
	.hp-flower {
		animation: hp-bloom 0.5s cubic-bezier(0.3, 1.6, 0.5, 1);
	}
	.hp-rustle {
		opacity: 0;
		animation: hp-rustle 0.6s ease-out;
	}

	@keyframes hp-twinkle {
		50% {
			opacity: 0.25;
		}
	}
	@keyframes hp-neon {
		0%,
		88%,
		100% {
			opacity: 1;
		}
		90% {
			opacity: 0.4;
		}
		93% {
			opacity: 1;
		}
		96% {
			opacity: 0.6;
		}
	}
	@keyframes hp-breathe {
		to {
			opacity: 0.6;
			transform: scale(1.06);
		}
	}
	@keyframes hp-shoot {
		0%,
		90% {
			opacity: 0;
			transform: translate(0, 0);
		}
		92% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(-260px, 116px);
		}
	}
	@keyframes hp-flicker {
		to {
			transform: scale(0.88, 1.12) skewX(3deg);
		}
	}
	@keyframes hp-stoke {
		0% {
			transform: scale(1);
		}
		15% {
			transform: scale(1.7);
		}
		100% {
			transform: scale(1);
		}
	}
	@keyframes hp-spark {
		from {
			transform: translate(0, 0);
			opacity: 1;
		}
		to {
			transform: translate(var(--dx), var(--dy));
			opacity: 0;
		}
	}
	@keyframes hp-puff {
		0% {
			opacity: 0;
			transform: translate(0, 0) scale(0.5);
		}
		15% {
			opacity: 0.75;
		}
		100% {
			opacity: 0;
			transform: translate(var(--sw), -170px) scale(3.2);
		}
	}
	@keyframes hp-ring {
		0% {
			opacity: 0.9;
			transform: translateY(0) scale(0.6);
		}
		100% {
			opacity: 0;
			transform: translateY(-150px) scale(2.6);
		}
	}
	@keyframes hp-coin {
		0% {
			transform: translate(0, 0);
		}
		60% {
			transform: translate(80px, -40px);
		}
		100% {
			transform: translate(130px, 140px) scale(0.6);
			opacity: 0;
		}
	}
	@keyframes hp-ripple {
		0% {
			opacity: 0.9;
			transform: scale(0.2);
		}
		100% {
			opacity: 0;
			transform: scale(1.6);
		}
	}
	@keyframes hp-flash {
		30% {
			opacity: 0.85;
		}
	}
	@keyframes hp-note {
		0% {
			opacity: 0;
			transform: translate(0, 0);
		}
		20% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(20px, -70px) rotate(20deg);
		}
	}
	@keyframes hp-bloom {
		from {
			transform: scale(0);
		}
	}
	@keyframes hp-rustle {
		30% {
			opacity: 0.18;
		}
	}
	@keyframes hp-swing {
		from {
			transform: rotate(-3deg);
		}
		to {
			transform: rotate(3deg);
		}
	}
	@keyframes hp-fly {
		from {
			transform: translate(0, 0);
			opacity: 0.2;
		}
		50% {
			opacity: 1;
		}
		to {
			transform: translate(40px, -30px);
			opacity: 0.3;
		}
	}
	@keyframes hp-munch {
		0% {
			transform: translate(-50%, -50%) scale(0.3);
			opacity: 0;
		}
		25% {
			transform: translate(-50%, -120%) scale(1.2);
			opacity: 1;
		}
		100% {
			transform: translate(-50%, -260%) scale(1);
			opacity: 0;
		}
	}
	@keyframes hp-pop {
		from {
			transform: translate(-50%, -90%) scale(0.85);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(dialog.hp-dlg) *,
		:global(dialog.hp-dlg) :global(*) {
			animation: none !important;
			transition: none !important;
		}
		.hp-puff,
		.hp-shoot,
		.hp-ring,
		.hp-coin,
		.hp-note,
		.hp-flash,
		.hp-rustle,
		.hp-spark,
		.hp-munchie {
			display: none;
		}
		.hp-ripple {
			opacity: 0.5;
		}
	}
</style>
