<!--
	Killstreak Recall (BurgiArcade, 2026-11-22): a memory-sequence game. A green radar sits in the middle of a
	metal console, with big round killstreak buttons in sockets around it: UAV, Care Package, Airstrike,
	Chopper, then the Missile (round 8) and the Nuke (round 14). Each round the radar calls the sequence in
	(each button lights up with a glow and the radar says "UAV ONLINE"…); then you tap it back (or keys 1–6).
	Each round adds a call-in and plays a bit faster; one wrong tap (or 6 s without one) = SIGNAL LOST.
	The sequence, speed and score come from recall.ts (seeded). Our own drawings throughout.
-->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { ArcadeGameProps } from '#lib/arcade/game.ts';
	import { rng } from '#lib/arcade/rng.ts';
	import s from '#lib/i18n/arcade/recall.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { FIFTH_AT, INPUT_TIMEOUT, SIXTH_AT, buttonsAt, lengthOf, playbackTiming, recallScore, recallSequence, stepBonus, type RecallStreak } from '#lib/arcade/recall.ts';

	let { seed, onend }: ArcadeGameProps = $props();
	const uid = $props.id();
	const u = `kr-${uid}`;
	const O = '#1a0630';

	// the console's layout in viewBox units (600 × 660): the radar at (CX, CY), buttons on a ring
	const VW = 600;
	const VH = 660;
	const CX = 300;
	const CY = 364;
	const RING = 214;
	const BTN = 142;
	const RADAR = 116;
	interface Slot {
		k: RecallStreak;
		a: number;
		c: string;
		hi: string;
		mid: string;
		dark: string;
		joins: number;
	}
	const SLOTS: Slot[] = [
		{ k: 'uav', a: -120, c: '#2ad4ff', hi: '#9ff4ff', mid: '#156c8e', dark: '#06243a', joins: 1 },
		{ k: 'care', a: -60, c: '#ffb12e', hi: '#ffe6a0', mid: '#8a5410', dark: '#3a1e02', joins: 1 },
		{ k: 'air', a: 60, c: '#ff4a3d', hi: '#ffb0a4', mid: '#8a1a16', dark: '#3a0606', joins: 1 },
		{ k: 'chopper', a: 120, c: '#58e05a', hi: '#c4ffa8', mid: '#1f6e24', dark: '#08280a', joins: 1 },
		{ k: 'missile', a: 0, c: '#b36bff', hi: '#e6c8ff', mid: '#4a2290', dark: '#1a0838', joins: FIFTH_AT },
		{ k: 'nuke', a: 180, c: '#d8ff3a', hi: '#f6ffb8', mid: '#5a6c0a', dark: '#1e2602', joins: SIXTH_AT }
	];
	const at = (i: number) => {
		const a = (SLOTS[i].a * Math.PI) / 180;
		return { x: CX + RING * Math.cos(a), y: CY + RING * Math.sin(a) };
	};
	const POS = SLOTS.map((_, i) => {
		const p = at(i);
		return { ...p, left: ((p.x - BTN / 2) / VW) * 100, top: ((p.y - BTN / 2) / VH) * 100 };
	});
	const LEDS = Array.from({ length: 12 }, (_, i) => {
		const a = (i / 12) * Math.PI * 2;
		return { x: +(70 + 57 * Math.cos(a)).toFixed(2), y: +(70 + 57 * Math.sin(a)).toFixed(2) };
	});
	const RIVETS = Array.from({ length: 28 }, (_, i) => {
		const a = (i / 28) * Math.PI * 2;
		return { x: +(CX + 282 * Math.cos(a)).toFixed(1), y: +(CY + 282 * Math.sin(a)).toFixed(1) };
	});
	const TICKS = Array.from({ length: 36 }, (_, i) => {
		const a = (i / 36) * Math.PI * 2;
		const r1 = i % 3 === 0 ? RADAR - 12 : RADAR - 6;
		return `M${(CX + r1 * Math.cos(a)).toFixed(1)} ${(CY + r1 * Math.sin(a)).toFixed(1)} L${(CX + RADAR * Math.cos(a)).toFixed(1)} ${(CY + RADAR * Math.sin(a)).toFixed(1)}`;
	});
	/** the sweep's fading tail: thin slices, brighter towards the leading edge */
	const SWEEP = Array.from({ length: 14 }, (_, i) => {
		const a0 = (-(i + 1) * 4 * Math.PI) / 180;
		const a1 = (-i * 4 * Math.PI) / 180;
		const p = (a: number) => `${(CX + RADAR * Math.cos(a)).toFixed(1)} ${(CY + RADAR * Math.sin(a)).toFixed(1)}`;
		return { d: `M${CX} ${CY} L${p(a0)} A${RADAR} ${RADAR} 0 0 1 ${p(a1)} Z`, o: +(0.42 * (1 - i / 14) ** 1.6).toFixed(3) };
	});
	const TIMER_LEN = 2 * Math.PI * (RADAR + 19);

	// ---- the game
	const seq = untrack(() => recallSequence(seed));
	const blipR = untrack(() => rng((seed ^ 0x2545f491) >>> 0));
	const BLIPS = Array.from({ length: 8 }, () => {
		const a = blipR() * 360;
		const d = 24 + blipR() * (RADAR - 34);
		return { a, x: CX + d * Math.cos((a * Math.PI) / 180), y: CY + d * Math.sin((a * Math.PI) / 180), r: 2.6 + blipR() * 2 };
	});
	const READY_MS = 900;
	const LEAD = 650;
	const LEAD_NEW = 1700;
	const CLEAR_MS = 1050;
	const LOST_MS = 1150;

	let root = $state<HTMLDivElement>();
	let now = $state(0);
	let paused = $state(false);
	let phase = $state<'ready' | 'watch' | 'input' | 'clear' | 'lost'>('ready');
	let phaseAt = $state(0);
	let round = $state(1);
	let typed = $state(0);
	let longest = $state(0);
	let bonus = $state(0);
	let roundBonus = $state(0);
	let lastInput = $state(0);
	let wrong = $state(-1);
	let lostWhy = $state<'wrong' | 'slow'>('wrong');
	let pressed = $state<{ slot: number; at: number } | null>(null);
	let pops = $state<{ id: number; slot: number; text: string; at: number }[]>([]);
	let reduce = $state(false);
	let popId = 0;
	let lastBeep = -1;
	let lastPointer = 0;
	let ended = false;

	const timing = $derived(playbackTiming(round));
	const per = $derived(timing.on + timing.gap);
	const len = $derived(lengthOf(round));
	const avail = $derived(buttonsAt(round));
	const lead = $derived(round === FIFTH_AT || round === SIXTH_AT ? LEAD_NEW : LEAD);
	const newSlot = $derived(round === FIFTH_AT ? 4 : round === SIXTH_AT ? 5 : -1);
	const watchT = $derived(phase === 'watch' ? now - phaseAt - lead : -1);
	const watchK = $derived(watchT >= 0 ? Math.floor(watchT / per) : -1);
	const litSlot = $derived.by(() => {
		if (phase === 'watch') return watchK >= 0 && watchK < len && watchT - watchK * per < timing.on ? seq[watchK] : -1;
		if (pressed && now - pressed.at < 190) return pressed.slot;
		return -1;
	});
	/** what the radar says: the streak being called in (playback or your last tap) */
	const callSlot = $derived.by(() => {
		if (phase === 'watch' && watchK >= 0 && watchK < len) return seq[watchK];
		if ((phase === 'input' || phase === 'clear') && pressed && now - pressed.at < 650) return pressed.slot;
		return -1;
	});
	const score = $derived(recallScore(longest, bonus));
	const sweep = $derived(reduce ? -40 : ((now / 1000) * 140) % 360);
	const timeLeft = $derived(phase === 'input' ? Math.max(0, 1 - (now - lastInput) / INPUT_TIMEOUT) : 0);
	const expected = $derived(phase === 'lost' ? seq[typed] : -1);

	function begin(p: typeof phase) {
		phase = p;
		phaseAt = now;
		lastBeep = -1;
	}
	function advance() {
		if (phase === 'ready') {
			if (now - phaseAt >= READY_MS) begin('watch');
		} else if (phase === 'watch') {
			const t = now - phaseAt - lead;
			if (t >= 0) {
				const k = Math.floor(t / per);
				if (k < len && k !== lastBeep) {
					lastBeep = k;
					sound.play('clack');
				}
			}
			if (t >= (len - 1) * per + timing.on + 60) {
				begin('input');
				lastInput = now;
				typed = 0;
				roundBonus = 0;
			}
		} else if (phase === 'input') {
			if (now - lastInput > INPUT_TIMEOUT) lose('slow');
		} else if (phase === 'clear') {
			if (now - phaseAt >= CLEAR_MS) {
				round++;
				pressed = null;
				begin('watch');
			}
		} else if (phase === 'lost' && now - phaseAt >= LOST_MS) finish();
		if (pops.length && now - pops[0].at > 800) pops = pops.filter((p) => now - p.at <= 800);
	}
	function lose(why: 'wrong' | 'slow') {
		lostWhy = why;
		begin('lost');
		sound.play('divergence');
	}
	function finish() {
		if (ended) return;
		ended = true;
		onend(recallScore(longest, bonus));
	}
	function press(slot: number) {
		if (ended) return;
		if (paused) {
			resume();
			return;
		}
		if (phase !== 'input' || slot >= avail) return;
		const dt = now - lastInput;
		lastInput = now;
		pressed = { slot, at: now };
		if (seq[typed] === slot) {
			const b = stepBonus(dt);
			roundBonus += b;
			typed++;
			sound.play('camo');
			if (b > 0) pops = [...pops, { id: ++popId, slot, text: `+${b}`, at: now }];
			if (typed >= len) {
				longest = len;
				bonus += roundBonus;
				begin('clear');
				sound.play('maxed');
			}
		} else {
			wrong = slot;
			lose('wrong');
		}
	}
	function onPointer(e: PointerEvent, slot: number) {
		lastPointer = performance.now();
		root?.focus({ preventScroll: true });
		e.preventDefault();
		press(slot);
	}
	function onClick(e: MouseEvent, slot: number) {
		// keyboard activation (Enter / Space on a focused button); taps were handled on pointerdown
		if (performance.now() - lastPointer < 600) return;
		if (e.detail === 0) press(slot);
	}
	function resume() {
		paused = false;
	}

	onMount(() => {
		const el = root as HTMLDivElement;
		reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.focus({ preventScroll: true });
		let last = performance.now();
		let raf = 0;
		let clock = 0;
		phaseAt = 0;
		const tick = (t: number) => {
			raf = requestAnimationFrame(tick);
			const dt = Math.min(50, t - last);
			last = t;
			if (!paused && !ended) {
				clock += dt;
				now = clock;
				advance();
			}
			if (ended) cancelAnimationFrame(raf);
		};
		raf = requestAnimationFrame(tick);
		const onKey = (e: KeyboardEvent) => {
			if (ended || e.repeat) return;
			if (paused) {
				resume();
				e.preventDefault();
				return;
			}
			const n = Number(e.key);
			if (Number.isInteger(n) && n >= 1 && n <= 6) {
				e.preventDefault();
				press(n - 1);
			}
		};
		const onDownCapture = (e: PointerEvent) => {
			if (!paused) return;
			e.preventDefault();
			e.stopPropagation();
			lastPointer = performance.now();
			resume();
		};
		const onVis = () => {
			if (document.hidden && !ended) paused = true;
		};
		el.addEventListener('keydown', onKey);
		el.addEventListener('pointerdown', onDownCapture, true);
		document.addEventListener('visibilitychange', onVis);
		if (document.hidden) paused = true;
		return () => {
			ended = true;
			cancelAnimationFrame(raf);
			el.removeEventListener('keydown', onKey);
			el.removeEventListener('pointerdown', onDownCapture, true);
			document.removeEventListener('visibilitychange', onVis);
		};
	});

	const blipAlpha = (a: number) => {
		if (reduce) return 0.55;
		const d = (((sweep - a) % 360) + 360) % 360;
		return d < 280 ? 1 - d / 280 : 0;
	};
	const radarWords = $derived.by((): { top: string; big: string; small: string; tone: 'ok' | 'bad' | 'gold' | 'dim' } => {
		if (phase === 'ready') return { top: `${s.round} ${round}`, big: s.ready, small: '', tone: 'dim' };
		if (phase === 'lost') return { top: `${s.round} ${round}`, big: s.lost, small: lostWhy === 'slow' ? s.slow : s.wrong, tone: 'bad' };
		if (phase === 'clear') return { top: `${s.round} ${round}`, big: s.confirmed, small: roundBonus > 0 ? s.speed(roundBonus) : '', tone: 'gold' };
		if (callSlot >= 0) {
			const [a, b] = s.callins[SLOTS[callSlot].k];
			return { top: phase === 'watch' ? s.watch : s.yourTurn, big: a, small: b, tone: 'ok' };
		}
		if (phase === 'watch' && newSlot >= 0 && watchT < 0) return { top: s.newStreak, big: s.streaks[SLOTS[newSlot].k].toUpperCase(), small: s.joined(round), tone: 'gold' };
		if (phase === 'watch') return { top: `${s.round} ${round}`, big: s.watch, small: '', tone: 'dim' };
		return { top: `${s.round} ${round}`, big: s.yourTurn, small: s.repeat, tone: 'dim' };
	});
	const progress = $derived(phase === 'watch' ? Math.max(0, Math.min(len, watchK + 1)) : phase === 'ready' ? 0 : typed);
</script>

{#snippet icon(k: RecallStreak)}
	<svg x="25" y="24" width="90" height="90" viewBox="0 0 64 64" class="kr-face" overflow="visible">
		<defs>
			<linearGradient id="{u}-i-{k}-m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" /><stop offset="0.5" stop-color="#c4ccd8" /><stop offset="1" stop-color="#6a7484" /></linearGradient>
		</defs>
		{#if k === 'uav'}
			<path d="M17 13 Q32 2 47 13" fill="none" stroke="#e8fbff" stroke-width="3" stroke-linecap="round" />
			<path d="M22 17 Q32 10 42 17" fill="none" stroke="#e8fbff" stroke-width="2.6" stroke-linecap="round" opacity="0.8" />
			<g stroke={O} stroke-width="2.6" stroke-linejoin="round">
				<path d="M3 34 Q32 29 61 34 L61 39 Q32 36 3 39 Z" fill="url(#{u}-i-{k}-m)" />
				<path d="M21 53 L43 53 L41 58 L23 58 Z" fill="url(#{u}-i-{k}-m)" />
				<path d="M32 19 Q38.5 21 38 32 L35.6 56 Q32 60 28.4 56 L26 32 Q25.5 21 32 19 Z" fill="url(#{u}-i-{k}-m)" />
				<circle cx="32" cy="28" r="4.6" fill={O} />
			</g>
			<circle cx="30.8" cy="26.8" r="1.7" fill="#7ff0ff" />
			<path d="M8 35.5 L20 35 M44 35 L56 35.5" stroke="#2ad4ff" stroke-width="1.6" stroke-linecap="round" />
		{:else if k === 'care'}
			<path d="M7 25 Q9 5 32 4 Q55 5 57 25 Q51 21 44.5 25 Q38 21 32 25 Q26 21 19.5 25 Q13 21 7 25 Z" fill="#e8463a" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
			<path d="M19.5 25 Q21 9 32 4.6 Q24 12 26 24 Z M44.5 25 Q43 9 32 4.6 Q40 12 38 24 Z" fill="#fff3dc" />
			<path d="M15 9 Q20 6 25 6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.7" />
			<path d="M8 25 L21 38 M19.5 25 L26 38 M44.5 25 L38 38 M56 25 L43 38" stroke="#fff3dc" stroke-width="1.4" />
			<rect x="17" y="37" width="30" height="23" rx="3" fill="#6f7f34" stroke={O} stroke-width="2.6" />
			<rect x="19" y="45" width="26" height="6" fill="#ffd23a" />
			<path d="M21 51 L25 45 L28 45 L24 51 Z M29 51 L33 45 L36 45 L32 51 Z M37 51 L41 45 L44 45 L40 51 Z" fill={O} />
			<path d="M17 45 H47 M17 51 H47" stroke={O} stroke-width="1.6" />
			<path d="M32 38.6 l1.3 2.7 l3 .4 l-2.2 2 l.6 3 l-2.7 -1.5 l-2.7 1.5 l.6 -3 l-2.2 -2 l3 -.4 Z" fill="#fff3dc" />
			<path d="M19.5 40 H25" stroke="#a8bc5a" stroke-width="1.6" stroke-linecap="round" />
		{:else if k === 'air'}
			<path d="M28 56 Q32 66 36 56 Z" fill="#ffd23a" stroke="#ff6a1a" stroke-width="1.6" stroke-linejoin="round" />
			<path
				d="M32 3 L36 18 L36 26 L60 41 L60 46 L36 40.5 L35 49 L44 55 L44 59 L32 56.5 L20 59 L20 55 L29 49 L28 40.5 L4 46 L4 41 L28 26 L28 18 Z"
				fill="url(#{u}-i-{k}-m)"
				stroke={O}
				stroke-width="2.6"
				stroke-linejoin="round"
			/>
			<path d="M10 42 L22 38 M54 42 L42 38" stroke="#ff4a3d" stroke-width="2.6" stroke-linecap="round" />
			<path d="M32 9 Q35.4 14.5 35 23 L29 23 Q28.6 14.5 32 9 Z" fill="#7ff0ff" stroke={O} stroke-width="1.6" />
			<path d="M31 12 Q30 16 30.4 20" stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none" />
		{:else if k === 'chopper'}
			<path d="M47 27 L61 22 L61 29 L47 34 Z" fill="#3f9a3a" stroke={O} stroke-width="2.4" stroke-linejoin="round" />
			<circle cx="59.5" cy="25.5" r="5.5" fill="none" stroke="#e8fbff" stroke-width="1.6" opacity="0.8" />
			<path d="M28 12 L28 20" stroke={O} stroke-width="3.4" />
			<rect x="5" y="8" width="46" height="5" rx="2.5" fill="#3a3f48" stroke={O} stroke-width="2.2" />
			<path d="M11 31 Q11 19 26 19 L40 19 Q50 20 50 30 L50 34 Q50 41 42 41 L20 41 Q11 41 11 31 Z" fill="#58c050" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
			<path d="M12.5 30 Q13 21.5 24 21.2 L26.5 31 Z" fill="#7ff0ff" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
			<path d="M30 24 H45" stroke="#b0ff9a" stroke-width="2" stroke-linecap="round" opacity="0.8" />
			<path d="M15 48 H47 M22 41 L20 48 M40 41 L42 48" fill="none" stroke={O} stroke-width="3" stroke-linecap="round" />
			<path d="M15 48 H47" stroke="#8a93a3" stroke-width="1.2" stroke-linecap="round" />
		{:else if k === 'missile'}
			<g transform="rotate(45 32 32)">
				<path d="M27 45 Q32 64 37 45 Z" fill="#ffd23a" stroke="#ff6a1a" stroke-width="1.6" stroke-linejoin="round" />
				<path d="M25 33 L16 47 L25 45 Z M39 33 L48 47 L39 45 Z" fill="#ff4a3d" stroke={O} stroke-width="2.2" stroke-linejoin="round" />
				<path d="M32 2 Q39.5 10 39.5 20 L39.5 45 L24.5 45 L24.5 20 Q24.5 10 32 2 Z" fill="url(#{u}-i-{k}-m)" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
				<path d="M32 2.6 Q37.4 7.6 38.6 14 L25.4 14 Q26.6 7.6 32 2.6 Z" fill="#ff4a3d" stroke={O} stroke-width="2" stroke-linejoin="round" />
				<rect x="24.5" y="25" width="15" height="4.5" fill="#b36bff" stroke={O} stroke-width="1.6" />
				<path d="M28 17 V40" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.7" />
			</g>
		{:else}
			<g transform="rotate(-24 32 34)">
				<path d="M24 46 L18 60 L46 60 L40 46 Z" fill="#3a3f48" stroke={O} stroke-width="2.4" stroke-linejoin="round" />
				<path d="M32 46 V60" stroke={O} stroke-width="2" />
				<ellipse cx="32" cy="30" rx="18" ry="21" fill="url(#{u}-nk)" stroke={O} stroke-width="2.8" />
				<circle cx="32" cy="31" r="11.5" fill={O} />
				<circle cx="32" cy="31" r="10" fill="#d8ff3a" />
				{#each [0, 1, 2] as t (t)}
					<path d="M32 31 L{(32 + 9 * Math.cos(((-90 + t * 120 - 30) * Math.PI) / 180)).toFixed(2)} {(31 + 9 * Math.sin(((-90 + t * 120 - 30) * Math.PI) / 180)).toFixed(2)} A9 9 0 0 1 {(32 + 9 * Math.cos(((-90 + t * 120 + 30) * Math.PI) / 180)).toFixed(2)} {(31 + 9 * Math.sin(((-90 + t * 120 + 30) * Math.PI) / 180)).toFixed(2)} Z" fill={O} />
				{/each}
				<circle cx="32" cy="31" r="3.4" fill="#d8ff3a" stroke={O} stroke-width="1.6" />
				<path d="M20 20 Q24 13 31 12" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="0.6" />
			</g>
			<defs>
				<radialGradient id="{u}-nk" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#fffbd0" /><stop offset="0.45" stop-color="#ffd23a" /><stop offset="1" stop-color="#a86e00" /></radialGradient>
			</defs>
		{/if}
	</svg>
{/snippet}

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div bind:this={root} class="kr" tabindex="0" role="application" aria-label={s.label} data-phase={phase} data-round={round}>
	<svg class="kr-svg" viewBox="0 0 {VW} {VH}" aria-hidden="true">
		<defs>
			<radialGradient id="{u}-bg" cx="50%" cy="56%" r="72%"><stop offset="0" stop-color="#2a1446" /><stop offset="0.55" stop-color="#120822" /><stop offset="1" stop-color="#05020a" /></radialGradient>
			<radialGradient id="{u}-plate" cx="44%" cy="38%" r="70%"><stop offset="0" stop-color="#3a3350" /><stop offset="0.7" stop-color="#1e1930" /><stop offset="1" stop-color="#120e1e" /></radialGradient>
			<radialGradient id="{u}-scope" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#0f5a2a" /><stop offset="0.7" stop-color="#062e14" /><stop offset="1" stop-color="#021408" /></radialGradient>
			<radialGradient id="{u}-bad" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff3040" stop-opacity="0.15" /><stop offset="1" stop-color="#ff1020" stop-opacity="0.65" /></radialGradient>
			<linearGradient id="{u}-bezel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b4bccb" /><stop offset="0.45" stop-color="#4a5262" /><stop offset="1" stop-color="#1c2030" /></linearGradient>
			<linearGradient id="{u}-pill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2460" /><stop offset="1" stop-color="#160a2a" /></linearGradient>
			<pattern id="{u}-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0 H0 V32" fill="none" stroke="#7a5aff" stroke-width="1" opacity="0.18" /></pattern>
			<clipPath id="{u}-clip"><circle cx={CX} cy={CY} r={RADAR} /></clipPath>
			<filter id="{u}-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
		</defs>
		<rect width={VW} height={VH} fill="url(#{u}-bg)" />
		<rect width={VW} height={VH} fill="url(#{u}-grid)" />
		<!-- the console plate, rivets, sockets -->
		<circle cx={CX} cy={CY} r="292" fill="url(#{u}-plate)" stroke={O} stroke-width="6" />
		<circle cx={CX} cy={CY} r="270" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="2" />
		{#each RIVETS as r, i (i)}<circle cx={r.x} cy={r.y} r="3.2" fill="#5a5470" stroke={O} stroke-width="1.4" />{/each}
		{#each POS as p, i (i)}
			<circle cx={p.x} cy={p.y} r="80" fill="#0a0614" stroke={O} stroke-width="4" />
			<circle cx={p.x} cy={p.y} r="76" fill="none" stroke={i < avail ? SLOTS[i].c : '#ffffff'} stroke-opacity={litSlot === i ? 0.9 : i < avail ? 0.28 : 0.06} stroke-width="3" />
		{/each}
		<!-- the radar: bezel, screen, grid, blips, sweep -->
		<circle cx={CX} cy={CY} r={RADAR + 26} fill="url(#{u}-bezel)" stroke={O} stroke-width="5" />
		{#each [45, 135, 225, 315] as a (a)}
			<circle cx={CX + (RADAR + 15) * Math.cos((a * Math.PI) / 180)} cy={CY + (RADAR + 15) * Math.sin((a * Math.PI) / 180)} r="3.6" fill="#2a2e3a" stroke={O} stroke-width="1.4" />
		{/each}
		<circle cx={CX} cy={CY} r={RADAR + 7} fill="#04140a" stroke={O} stroke-width="3" />
		{#if phase === 'input'}
			<circle
				class="kr-timer"
				cx={CX}
				cy={CY}
				r={RADAR + 19}
				fill="none"
				stroke={timeLeft < 0.34 ? '#ff4a3d' : '#ffd23a'}
				stroke-width="5"
				stroke-linecap="round"
				stroke-dasharray={TIMER_LEN}
				stroke-dashoffset={TIMER_LEN * (1 - timeLeft)}
				transform="rotate(-90 {CX} {CY})"
			/>
		{/if}
		<circle cx={CX} cy={CY} r={RADAR} fill="url(#{u}-scope)" />
		<g clip-path="url(#{u}-clip)">
			<g stroke="#46ff7a" fill="none" opacity="0.32">
				{#each [0.28, 0.56, 0.84] as k (k)}<circle cx={CX} cy={CY} r={RADAR * k} stroke-width="1.4" />{/each}
				<path d="M{CX - RADAR} {CY} H{CX + RADAR} M{CX} {CY - RADAR} V{CY + RADAR}" stroke-width="1.2" />
				{#each TICKS as d, i (i)}<path {d} stroke-width="1.4" />{/each}
			</g>
			{#each BLIPS as b, i (i)}
				<circle cx={b.x} cy={b.y} r={b.r} fill="#8cffa8" opacity={blipAlpha(b.a)} />
			{/each}
			{#if callSlot >= 0 && phase !== 'lost'}
				{@const ca = (SLOTS[callSlot].a * Math.PI) / 180}
				{@const bx = CX + 84 * Math.cos(ca)}
				{@const by = CY + 84 * Math.sin(ca)}
				{@const age = phase === 'watch' ? (watchT - watchK * per) / timing.on : (now - (pressed?.at ?? now)) / 400}
				<circle cx={bx} cy={by} r={6 + Math.min(1, age) * 22} fill="none" stroke={SLOTS[callSlot].c} stroke-width="3" opacity={Math.max(0, 1 - age)} />
				<circle cx={bx} cy={by} r="7" fill={SLOTS[callSlot].hi} stroke={SLOTS[callSlot].c} stroke-width="3" filter="url(#{u}-glow)" />
			{/if}
			<g transform="rotate({sweep} {CX} {CY})">
				{#each SWEEP as w, i (i)}<path d={w.d} fill="#3dff70" opacity={w.o} />{/each}
				<path d="M{CX} {CY} L{CX + RADAR} {CY}" stroke="#b8ffc8" stroke-width="2.4" filter="url(#{u}-glow)" />
			</g>
			{#if phase === 'lost'}
				<circle cx={CX} cy={CY} r={RADAR} fill="url(#{u}-bad)" class="kr-badflash" />
				{#each Array.from({ length: 9 }, (_, i) => i) as i (i)}
					<rect x={CX - RADAR} y={CY - RADAR + ((i * 53 + Math.floor(now / 45) * 29) % (RADAR * 2))} width={RADAR * 2} height={1.5 + (i % 3)} fill="#ffd0d4" opacity="0.35" />
				{/each}
			{:else if phase === 'clear'}
				<circle cx={CX} cy={CY} r={RADAR * Math.min(1, (now - phaseAt) / 450)} fill="none" stroke="#ffd23a" stroke-width="5" opacity={Math.max(0, 1 - (now - phaseAt) / 700)} />
			{/if}
			<circle cx={CX} cy={CY} r={RADAR} fill="none" stroke="#000" stroke-opacity="0.55" stroke-width="16" />
		</g>
		<!-- the radar's words -->
		<g class="kr-words tone-{radarWords.tone}" filter="url(#{u}-glow)" font-family="Bahnschrift, 'Segoe UI', sans-serif" text-anchor="middle" font-weight="700">
			<text x={CX} y={CY - 58} font-size="17" letter-spacing="3" class="kr-top">{radarWords.top}</text>
			{#key `${radarWords.big}|${callSlot}|${watchK}|${pressed?.at ?? 0}`}
				<text x={CX} y={CY + 4} font-size={radarWords.big.length > 10 ? 25 : 31} class="kr-big">{radarWords.big}</text>
			{/key}
			<text x={CX} y={CY + 32} font-size="16" letter-spacing="1.5" class="kr-small">{radarWords.small}</text>
			{#if phase !== 'ready'}
				<text x={CX} y={CY + 74} font-size="15" letter-spacing="1" class="kr-steps">{s.step(progress, len)}</text>
			{/if}
		</g>
		<!-- HUD -->
		<g font-family="Bahnschrift, 'Segoe UI', sans-serif" font-weight="700">
			<rect x="14" y="14" width="150" height="44" rx="22" fill="url(#{u}-pill)" stroke={O} stroke-width="3" />
			<rect x="18" y="17" width="142" height="14" rx="7" fill="#ffffff" opacity="0.08" />
			<text x="34" y="43" font-size="15" fill="#c8b8ff" letter-spacing="2" class="kr-hud">{s.round}</text>
			<text x="148" y="45" font-size="26" fill="#ffffff" text-anchor="end" class="kr-hud">{round}</text>
			<rect x={VW - 214} y="14" width="200" height="44" rx="22" fill="url(#{u}-pill)" stroke={O} stroke-width="3" />
			<rect x={VW - 210} y="17" width="192" height="14" rx="7" fill="#ffffff" opacity="0.08" />
			<text x={VW - 196} y="43" font-size="15" fill="#c8b8ff" letter-spacing="2" class="kr-hud">{s.score}</text>
			{#key score}
				<text x={VW - 30} y="45" font-size="26" fill="#ffd23a" text-anchor="end" class="kr-hud kr-score">{score.toLocaleString('en-US')}</text>
			{/key}
		</g>
		{#each pops as p (p.id)}
			{@const k = Math.min(1, (now - p.at) / 800)}
			<text
				x={POS[p.slot].x}
				y={POS[p.slot].y - 76 - k * 34}
				text-anchor="middle"
				font-family="Bahnschrift, 'Segoe UI', sans-serif"
				font-weight="800"
				font-size="24"
				fill="#ffd23a"
				opacity={1 - k * k}
				class="kr-hud">{p.text}</text
			>
		{/each}
	</svg>

	{#each SLOTS as slot, i (slot.k)}
		{@const locked = i >= avail}
		{@const lit = litSlot === i}
		<button
			type="button"
			class="kr-btn"
			class:lit
			class:locked
			class:bad={wrong === i && phase === 'lost'}
			class:hint={expected === i && wrong !== i}
			class:fresh={i === newSlot && phase === 'watch' && watchT < 0}
			style:left="{POS[i].left}%"
			style:top="{POS[i].top}%"
			style:width="{(BTN / VW) * 100}%"
			style:--c={slot.c}
			data-slot={i}
			data-lit={lit ? '1' : undefined}
			disabled={locked}
			aria-label="{i + 1}: {s.streaks[slot.k]}{locked ? ` (${s.locked(slot.joins)})` : ''}"
			onpointerdown={(e) => onPointer(e, i)}
			onclick={(e) => onClick(e, i)}
		>
			<svg viewBox="0 0 140 140" aria-hidden="true">
				<defs>
					<radialGradient id="{u}-b{i}" cx="38%" cy="30%" r="78%">
						{#if lit}
							<stop offset="0" stop-color="#ffffff" /><stop offset="0.35" stop-color={slot.hi} /><stop offset="1" stop-color={slot.c} />
						{:else if locked}
							<stop offset="0" stop-color="#4a4658" /><stop offset="1" stop-color="#18141f" />
						{:else}
							<stop offset="0" stop-color={slot.mid} /><stop offset="1" stop-color={slot.dark} />
						{/if}
					</radialGradient>
					<linearGradient id="{u}-r{i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4dae4" /><stop offset="0.5" stop-color="#5a6272" /><stop offset="1" stop-color="#22262f" /></linearGradient>
				</defs>
				<circle cx="70" cy="70" r="68" fill={O} />
				<circle cx="70" cy="70" r="63" fill="url(#{u}-r{i})" />
				{#each LEDS as l, j (j)}
					<circle cx={l.x} cy={l.y} r="3" fill={lit ? '#ffffff' : locked ? '#2a2632' : slot.dark} stroke={lit ? slot.c : O} stroke-width="1.4" />
				{/each}
				<circle cx="70" cy="70" r="50" fill="url(#{u}-b{i})" stroke={O} stroke-width="4" />
				{@render icon(slot.k)}
				<path d="M34 54 Q70 16 106 54 Q70 34 34 54 Z" fill="#ffffff" opacity={lit ? 0.5 : 0.22} />
				{#if locked}
					<g transform="translate(70 66)">
						<path d="M-10 -4 V-12 A10 10 0 0 1 10 -12 V-4" fill="none" stroke={O} stroke-width="8" />
						<path d="M-10 -4 V-12 A10 10 0 0 1 10 -12 V-4" fill="none" stroke="#c8cdd6" stroke-width="4.5" />
						<rect x="-15" y="-6" width="30" height="24" rx="5" fill="#ffc928" stroke={O} stroke-width="3" />
						<circle cy="3" r="3.4" fill={O} />
						<path d="M0 4 V11" stroke={O} stroke-width="3" stroke-linecap="round" />
					</g>
					<rect x="44" y="104" width="52" height="24" rx="12" fill={O} stroke="#ffffff" stroke-opacity="0.3" stroke-width="2" />
					<text x="70" y="121.5" text-anchor="middle" font-family="Bahnschrift, 'Segoe UI', sans-serif" font-weight="800" font-size="16" fill="#ffffff">{s.lockedShort(slot.joins)}</text>
				{:else}
					<circle cx="114" cy="114" r="15" fill={O} stroke={slot.c} stroke-width="2.5" />
					<text x="114" y="120" text-anchor="middle" font-family="Bahnschrift, 'Segoe UI', sans-serif" font-weight="800" font-size="17" fill="#ffffff">{i + 1}</text>
				{/if}
				{#if wrong === i && phase === 'lost'}
					<circle cx="70" cy="70" r="50" fill="#ff1a2a" opacity="0.45" />
					<path d="M50 50 L90 90 M90 50 L50 90" stroke={O} stroke-width="14" stroke-linecap="round" />
					<path d="M50 50 L90 90 M90 50 L50 90" stroke="#ff4a5a" stroke-width="8" stroke-linecap="round" />
				{/if}
			</svg>
		</button>
	{/each}

	{#if paused}
		<div class="kr-pause"><span>{s.paused}</span></div>
	{/if}
</div>

<style>
	.kr {
		position: relative;
		width: min(100%, calc(min(72vh, 640px) * 10 / 11));
		aspect-ratio: 10 / 11;
		margin-inline: auto;
		border-radius: 14px;
		overflow: hidden;
		background: #05020a;
		outline: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
		box-shadow:
			0 0 0 2px #1a0630,
			0 10px 30px rgb(0 0 0 / 0.5);
	}
	.kr:focus-visible {
		box-shadow:
			0 0 0 3px #ffc928,
			0 10px 30px rgb(0 0 0 / 0.5);
	}
	.kr::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 3;
		pointer-events: none;
		border-radius: inherit;
		background: repeating-linear-gradient(to bottom, rgb(0 0 0 / 0.1) 0 1px, transparent 1px 3px);
		box-shadow:
			inset 0 0 0 3px rgb(0 0 0 / 0.6),
			inset 0 0 50px rgb(0 0 0 / 0.55);
	}
	.kr-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
	.kr-words text {
		paint-order: stroke;
		stroke: #021408;
		stroke-width: 4px;
	}
	.kr-words.tone-ok text,
	.kr-words.tone-dim text {
		fill: #8cffa8;
	}
	.kr-words.tone-dim .kr-big {
		fill: #5fe07e;
		opacity: 0.85;
	}
	.kr-words.tone-bad text {
		fill: #ff6a72;
	}
	.kr-words.tone-gold text {
		fill: #ffe066;
	}
	.kr-top,
	.kr-small,
	.kr-steps {
		opacity: 0.85;
	}
	.kr-big {
		transform-box: fill-box;
		transform-origin: center;
		animation: kr-type 0.18s ease-out;
	}
	.kr-hud {
		paint-order: stroke;
		stroke: #140a06;
		stroke-width: 4px;
	}
	.kr-score {
		transform-box: fill-box;
		transform-origin: right center;
		animation: kr-bump 0.25s ease-out;
	}
	.kr-badflash {
		animation: kr-flash 0.25s steps(2) 3;
	}
	.kr-btn {
		position: absolute;
		z-index: 1;
		aspect-ratio: 1;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: none;
		cursor: pointer;
		touch-action: manipulation;
		transition:
			transform 0.12s ease-out,
			filter 0.12s ease-out;
		filter: drop-shadow(0 4px 0 rgb(0 0 0 / 0.45));
	}
	.kr-btn svg {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.kr-btn:focus-visible {
		outline: 3px solid #ffc928;
		outline-offset: 2px;
	}
	.kr-btn:not(.locked):hover {
		transform: scale(1.03);
	}
	.kr-btn:not(.locked):active {
		transform: scale(0.96);
	}
	.kr-btn.lit {
		transform: scale(1.09);
		filter: drop-shadow(0 0 10px var(--c)) drop-shadow(0 0 26px var(--c)) brightness(1.08);
		transition-duration: 0.05s;
	}
	.kr-btn.lit::before {
		content: '';
		position: absolute;
		inset: -6%;
		border-radius: 50%;
		border: 5px solid var(--c);
		pointer-events: none;
		animation: kr-ping 0.42s ease-out forwards;
	}
	.kr-btn.locked {
		cursor: default;
	}
	.kr-btn.locked :global(.kr-face) {
		filter: grayscale(1) brightness(0.45);
		opacity: 0.55;
	}
	.kr-btn.bad {
		animation: kr-shake 0.42s ease-in-out;
		filter: drop-shadow(0 0 16px #ff2030);
	}
	.kr-btn.hint::after {
		content: '';
		position: absolute;
		inset: -7%;
		border-radius: 50%;
		border: 4px dashed #ffffff;
		pointer-events: none;
		animation: kr-hint 0.5s ease-in-out infinite alternate;
	}
	.kr-btn.fresh {
		animation: kr-unlock 0.7s ease-out;
		filter: drop-shadow(0 0 18px var(--c));
	}
	.kr-pause {
		position: absolute;
		inset: 0;
		z-index: 4;
		display: grid;
		place-items: center;
		background: rgb(8 4 14 / 0.62);
		cursor: pointer;
	}
	.kr-pause span {
		padding: 12px 22px;
		border-radius: 999px;
		background: #140a1e;
		border: 2px solid #ffc928;
		color: #fff3d0;
		font: 700 clamp(15px, 3.4vw, 20px) / 1.2 Bahnschrift, 'Segoe UI', sans-serif;
		text-shadow: 0 2px 0 #000;
	}
	@keyframes kr-ping {
		from {
			opacity: 0.95;
			transform: scale(0.92);
		}
		to {
			opacity: 0;
			transform: scale(1.32);
		}
	}
	@keyframes kr-shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20% {
			transform: translateX(-7%);
		}
		40% {
			transform: translateX(6%);
		}
		60% {
			transform: translateX(-4%);
		}
		80% {
			transform: translateX(3%);
		}
	}
	@keyframes kr-hint {
		from {
			opacity: 0.35;
			transform: scale(1);
		}
		to {
			opacity: 1;
			transform: scale(1.06);
		}
	}
	@keyframes kr-unlock {
		0% {
			transform: scale(0.5) rotate(-20deg);
		}
		60% {
			transform: scale(1.15) rotate(6deg);
		}
		100% {
			transform: scale(1) rotate(0);
		}
	}
	@keyframes kr-type {
		from {
			transform: scale(1.25);
			opacity: 0.4;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
	@keyframes kr-bump {
		from {
			transform: scale(1.18);
		}
		to {
			transform: scale(1);
		}
	}
	@keyframes kr-flash {
		from {
			opacity: 1;
		}
		to {
			opacity: 0.3;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.kr-btn,
		.kr-btn.lit {
			transition: none;
		}
		.kr-btn.lit::before,
		.kr-btn.bad,
		.kr-btn.fresh,
		.kr-big,
		.kr-score,
		.kr-badflash {
			animation: none;
		}
		.kr-btn.hint::after {
			animation: none;
			opacity: 1;
		}
	}
</style>
