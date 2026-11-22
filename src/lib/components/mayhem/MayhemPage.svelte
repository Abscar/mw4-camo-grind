<!--
	Squad Mayhem (2026-11-22, the user: "a game connected to my camo grinder, our own operators, gun camos,
	skins, cosmetics"): our own side-view arena brawler-shooter (engine.ts = the rules, render.ts = the canvas).
	On top of the canvas sits the operator's real emblem (SquadAvatar, with your BurgiShop gear via OpGear) and
	the weapon's real cartoon (WeaponIcon) in the camo you've earned on it: best of the tracker's ladder camo
	and the Camo Armory. Guns lying on the floor are drawn the same way, so you see your Gold Kastov waiting.
	The panel stays mounted like every tab: the loop only runs while a game is on and the tab is open.
-->
<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import { ARMORY_CAMOS, bestCamo, heldGun } from '#lib/armory.ts';
	import { camoLook } from '#lib/data/weaponLooks.ts';
	import type { IconCamo } from '#lib/data/camos.ts';
	import { faceOf } from '#lib/faceGear.ts';
	import { mayhemText as M } from '#lib/i18n/mayhem.ts';
	import { t } from '#lib/i18n/en.ts';
	import { FLOOR, H, Mayhem, NO_INPUT, VH, VW, W, type GameEvent, type Input } from '#lib/mayhem/engine.ts';
	import { gunOf, OUT_WEAPONS, STARTER } from '#lib/mayhem/guns.ts';
	import { render } from '#lib/mayhem/render.ts';
	import { LOOKS, paintFigure, type GunPic } from '#lib/mayhem/painter.ts';
	import { MayhemSound } from '#lib/mayhem/sound.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { worn } from '#lib/shop.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { SQUAD_OPS, type SquadOp } from '#lib/squad-codec.ts';
	import OpGear from '../OpGear.svelte';
	import SquadAvatar from '../SquadAvatar.svelte';
	import WeaponIcon from '../WeaponIcon.svelte';

	let { active = false }: { active?: boolean } = $props();

	const KEY = 'mw4-camo-grind:mayhem';
	type Saved = { op?: SquadOp; gun?: string; mute?: boolean; best?: { score: number; wave: number; kills: number; op: string; at: number } };
	function readSaved(): Saved {
		try {
			const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
			return v && typeof v === 'object' ? v : {};
		} catch {
			return {};
		}
	}
	function writeSaved(s: Saved) {
		try {
			localStorage.setItem(KEY, JSON.stringify(s));
		} catch {
			/* private mode: fine */
		}
	}
	let saved = $state<Saved>({});

	const OP_NAMES: Record<SquadOp, string> = {
		abscar: t.operator.callsign,
		phillestar: t.operator.mate,
		lars: t.operator.lars,
		jeeven: t.operator.jeeven,
		ingman: t.operator.ingman,
		aw: t.operator.aw,
		joker: t.operator.joker
	};

	// ---------- your look and your camos ----------
	const CAMO_RANK: IconCamo[] = ['gold', 'platinum', 'harmonicBreak', 'divergence', 'mercurialDrift', 'polyatomicReforged', 'orionReforged'];
	const CAMO_NAME: Record<IconCamo, string> = {
		gold: 'Gold',
		platinum: 'Platinum',
		harmonicBreak: 'Harmonic Break',
		divergence: 'Divergence',
		mercurialDrift: 'Mercurial Drift',
		polyatomicReforged: 'Polyatomic',
		orionReforged: 'Orion'
	};
	/** the camo a weapon wears for you: the better of the tracker and the Camo Armory */
	function camoFor(id: string): IconCamo | null {
		const a = progress.ready ? progress.wears(id) : null;
		const i = bestCamo(squad.shop?.own ?? {}, id);
		const b = i >= 0 ? ARMORY_CAMOS[i].id : null;
		if (!a) return b;
		if (!b) return a;
		return CAMO_RANK.indexOf(b) > CAMO_RANK.indexOf(a) ? b : a;
	}

	let op = $state<SquadOp>('abscar');
	let start = $state<string>(STARTER);
	const look = $derived(worn(squad.shop));
	const face = $derived(faceOf(look));
	const gearCount = $derived(Object.keys(look).length);
	const myName = $derived(squad.me?.name ?? OP_NAMES[op]);

	/** starting guns: the starter pistol, your held Camo Armory gun, and every gun you have a camo on */
	const gunChoices = $derived.by(() => {
		const out = OUT_WEAPONS.map((w) => ({ id: w.id, name: w.name, camo: camoFor(w.id) })).filter((g) => g.camo || g.id === STARTER);
		out.sort((a, b) => (b.camo ? CAMO_RANK.indexOf(b.camo) : -1) - (a.camo ? CAMO_RANK.indexOf(a.camo) : -1));
		return out;
	});

	onMount(() => {
		saved = readSaved();
		op = saved.op && SQUAD_OPS.includes(saved.op) ? saved.op : (squad.me?.op ?? 'abscar');
		sfx.muted = !!saved.mute;
		muted = sfx.muted;
	});
	// pick a sensible starting gun once the tracker and shop are read
	let gunPicked = false;
	$effect(() => {
		const choices = gunChoices;
		if (gunPicked && choices.some((c) => c.id === start)) return;
		untrack(() => {
			const held = heldGun(squad.shop);
			const pref = saved.gun && choices.some((c) => c.id === saved.gun) ? saved.gun : held && choices.some((c) => c.id === held.w) ? held.w : choices[0]?.id;
			if (pref) start = pref;
		});
	});

	// ---------- the game ----------
	type Screen = 'menu' | 'play' | 'over';
	let screen = $state<Screen>('menu');
	let paused = $state(false);
	let game: Mayhem | null = null;
	const sfx = new MayhemSound();
	let muted = $state(false);

	let stage: HTMLDivElement | undefined = $state();
	let canvas: HTMLCanvasElement | undefined = $state();
	let ctx: CanvasRenderingContext2D | null = null;
	let cssW = $state(960);
	let dpr = 1;
	const layerScale = $derived(cssW / VW);
	let layerEl: HTMLDivElement | undefined = $state();
	/** where the mouse is on the stage (0–1), so the aim follows the camera even when the mouse stands still */
	let mfx = 0.75;
	let mfy = 0.6;
	let reduce = false;

	// HUD (copied from the game a few times a second)
	let hud = $state({ hp: 100, ammo: 0, mag: 0, gun: '', gunId: '', melee: false, wave: 0, score: 0, combo: 0, holk: 0, holkOn: false, left: 0 });
	let drops = $state<{ uid: number; id: string; empty: boolean }[]>([]);
	let dropKey = '';
	const dropEls = new Map<number, HTMLElement>();
	let result = $state<{ score: number; wave: number; kills: number; heads: number; acc: number; combo: number; best: boolean } | null>(null);

	function place(node: HTMLElement, uid: number) {
		dropEls.set(uid, node);
		return { destroy: () => dropEls.delete(uid) };
	}

	/** where the fist holds each kind of cartoon (WeaponIcon's 64 × 24 units → the 44 × 16.5 px gun box) */
	function pivot(id: string): [number, number] {
		const l = camoLook(id);
		const k = 44 / 64;
		if (!l) return [24 * k, 17 * k];
		if (l.kind === 'rifle') return [((l.bullpup ? 29 : 25) + 2.2) * k, 17.4 * k];
		if (l.kind === 'pistol') return [24 * k, 18 * k];
		if (l.kind === 'launcher') return [24.6 * k, 16.8 * k];
		return [14 * k, 12.6 * k];
	}

	const input: Input = { ...NO_INPUT };

	// ---------- the gun in their hands: the WeaponIcon (in your camo) as a picture for the painter ----------
	/** where the fist holds each kind of cartoon, in WeaponIcon's 64 × 24 units */
	function grip(id: string): [number, number] {
		const l = camoLook(id);
		if (!l) return [24, 17];
		if (l.kind === 'rifle') return [(l.bullpup ? 29 : 25) + 2.2, 17.4];
		if (l.kind === 'pistol') return [24, 18];
		if (l.kind === 'launcher') return [24.6, 16.8];
		return [14, 12.6];
	}
	const GUN_W = 54; // world units for the 64-unit picture (a bit bigger than real, the user: "större … lite större än vanligt")
	const pics = new Map<string, GunPic | 'loading'>();
	let gunSrc: HTMLDivElement | undefined = $state();
	let picTick = $state(0);
	const picKey = (id: string) => `${id}:${camoFor(id) ?? '-'}`;
	/** the picture for a gun (null until it's ready; the painter draws a plain gun meanwhile) */
	function gunPic(id: string): GunPic | null {
		if (!id) return null;
		const key = picKey(id);
		const hit = pics.get(key);
		if (hit && hit !== 'loading') return hit;
		if (!hit && gunSrc) {
			const svg = gunSrc.querySelector(`[data-pic="${CSS.escape(key)}"] svg`);
			if (svg) {
				pics.set(key, 'loading');
				const clone = svg.cloneNode(true) as SVGSVGElement;
				clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
				clone.setAttribute('width', '256');
				clone.setAttribute('height', '96');
				const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
				const img = new Image();
				img.onload = () => {
					const [gx, gy] = grip(id);
					pics.set(key, { img, w: GUN_W, h: (GUN_W * 24) / 64, px: (gx * GUN_W) / 64, py: (gy * GUN_W) / 64 });
					picTick++;
				};
				img.onerror = () => pics.delete(key);
				img.src = url;
			}
		}
		return null;
	}
	/** the guns whose pictures we need: the one in hand + the starting gun */
	const picIds = $derived([...new Set([hud.gunId, start].filter(Boolean))]);

	// ---------- the menu's figure: the same painting as in the game ----------
	let heroCanvas: HTMLCanvasElement | undefined = $state();
	let heroK = $state(2);
	$effect(() => {
		void picTick;
		const cv = heroCanvas;
		const o = op;
		const k = heroK;
		const id = start;
		if (!cv || screen !== 'menu') return;
		requestAnimationFrame(() => {
			const d = Math.min(window.devicePixelRatio || 1, 2);
			cv.width = Math.round(70 * k * d);
			cv.height = Math.round(104 * k * d);
			const c = cv.getContext('2d');
			if (!c) return;
			c.setTransform(k * d, 0, 0, k * d, 0, 0);
			c.clearRect(0, 0, 70, 104);
			const sh = c.createRadialGradient(32, 100, 0, 32, 100, 18);
			sh.addColorStop(0, 'rgba(0,0,0,0.55)');
			sh.addColorStop(1, 'rgba(0,0,0,0)');
			c.fillStyle = sh;
			c.fillRect(10, 94, 44, 10);
			paintFigure(c, LOOKS[o] ?? LOOKS.abscar, 30, 100, 1, { facing: 1, aim: 0.12, walk: 0, onGround: true, vx: 0, recoil: 0, gun: gunOf(id).kind, punch: 0, t: 0 }, 7, gunPic(id));
		});
	});

	function begin() {
		saved = { ...saved, op, gun: start };
		writeSaved(saved);
		game = new Mayhem(start);
		// for the check scripts (read only; like the frame cap's window.__mw4fx)
		(window as unknown as { __mayhem: Mayhem }).__mayhem = game;
		result = null;
		drops = [];
		dropKey = '';
		screen = 'play';
		paused = false;
		Object.assign(input, NO_INPUT, { aimX: W * 0.75, aimY: FLOOR - 60 });
		mfx = 0.75;
		mfy = 0.6;
		sfx.unlock();
		last = 0;
		loop();
		stage?.focus();
	}

	let raf = 0;
	let last = 0;
	function loop() {
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(frame);
	}

	function frame(now: number) {
		if (!game || screen === 'menu') return;
		const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
		last = now;
		if (!paused) {
			input.aimX = game.cam.x + mfx * VW;
			input.aimY = game.cam.y + mfy * VH;
			game.step(dt, input);
			for (const e of game.events) onEvent(e);
		}
		draw();
		raf = requestAnimationFrame(frame);
	}

	function onEvent(e: GameEvent) {
		sfx.play(e);
		if (e.t === 'dead') setTimeout(finish, 1400);
	}

	function finish() {
		if (!game || screen !== 'play') return;
		const g = game;
		const best = g.score > 0 && (!saved.best || g.score > saved.best.score);
		result = {
			score: g.score,
			wave: g.wave,
			kills: g.stats.kills,
			heads: g.stats.heads,
			acc: g.stats.shots ? Math.round((g.stats.hits / g.stats.shots) * 100) : 0,
			combo: g.stats.bestCombo,
			best
		};
		if (best) {
			saved = { ...saved, best: { score: g.score, wave: g.wave, kills: g.stats.kills, op, at: Date.now() } };
			writeSaved(saved);
		}
		screen = 'over';
	}

	function draw() {
		if (!game || !ctx || !canvas) return;
		const g = game;
		if (reduce) g.shake = 0;
		render(ctx, g, { op, scale: (cssW * dpr) / VW, pw: canvas.width, ph: canvas.height, gun: g.player.held ? gunPic(g.player.held.id) : null });
		if (layerEl) layerEl.style.transform = `scale(${layerScale}) translate(${-g.cam.x}px, ${-g.cam.y}px)`;
		const p = g.player;

		// guns on the floor
		const key = g.pickups
			.filter((k) => k.gun)
			.map((k) => `${k.uid}:${k.heal < 0 ? 'e' : ''}`)
			.join(',');
		if (key !== dropKey) {
			dropKey = key;
			drops = g.pickups.filter((k) => k.gun).map((k) => ({ uid: k.uid, id: k.gun!.id, empty: k.heal < 0 }));
		}
		for (const k of g.pickups) {
			const el = dropEls.get(k.uid);
			if (!el) continue;
			const fade = k.life < 3 ? (Math.floor(k.life * 6) % 2 ? 0.35 : 1) : 1;
			el.style.opacity = String(k.heal < 0 ? Math.max(0, k.life) : fade);
			el.style.transform = `translate(${k.x - 21}px, ${k.y - 10}px) rotate(${k.onGround ? 0 : g.t * k.spin}rad)`;
		}

		// HUD
		const gun = p.held ? gunOf(p.held.id) : null;
		const h = hud;
		const next = {
			hp: Math.max(0, Math.ceil(p.hp)),
			ammo: p.held?.ammo ?? 0,
			mag: gun?.mag ?? 0,
			gun: gun?.name ?? M.hud.fists,
			gunId: p.held?.id ?? '',
			melee: gun?.kind === 'melee',
			wave: g.wave,
			score: g.score,
			combo: g.combo,
			holk: Math.round(g.holk),
			holkOn: g.holkOn,
			left: g.alive + g.toSpawn
		};
		for (const k of Object.keys(next) as (keyof typeof next)[]) if (h[k] !== next[k]) (h as Record<string, unknown>)[k] = next[k];
	}

	// ---------- size ----------
	function resize() {
		if (!stage || !canvas) return;
		const r = stage.getBoundingClientRect();
		cssW = Math.max(200, r.width);
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.round(cssW * dpr);
		canvas.height = Math.round(((cssW * H) / W) * dpr);
		ctx = canvas.getContext('2d');
		if (game) draw();
	}

	let ro: ResizeObserver | null = null;
	onMount(() => {
		reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		heroK = innerWidth < 640 ? 1.2 : 2;
		touchy = matchMedia('(pointer: coarse)').matches;
		ro = new ResizeObserver(resize);
		if (stage) ro.observe(stage);
		const onVis = () => {
			if (document.hidden) pause(true);
		};
		const onBlur = () => pause(true);
		const onFs = () => (full = !!document.fullscreenElement);
		document.addEventListener('visibilitychange', onVis);
		window.addEventListener('blur', onBlur);
		document.addEventListener('fullscreenchange', onFs);
		return () => {
			document.removeEventListener('visibilitychange', onVis);
			window.removeEventListener('blur', onBlur);
			document.removeEventListener('fullscreenchange', onFs);
		};
	});
	$effect(() => {
		if (stage && ro) {
			ro.observe(stage);
			resize();
		}
	});
	onDestroy(() => {
		// (onDestroy also runs while prerendering, where there are no frames)
		if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
		ro?.disconnect();
	});

	// leaving the tab pauses
	$effect(() => {
		if (!active) untrack(() => pause(true));
	});

	function pause(on: boolean) {
		if (screen !== 'play' || game?.over) return;
		paused = on;
		if (on) Object.assign(input, { left: false, right: false, jump: false, down: false, fire: false, pick: false, throw: false, holk: false });
		else {
			last = 0;
			stage?.focus();
		}
	}

	// ---------- input ----------
	const KEYS: Record<string, keyof Input> = {
		KeyA: 'left',
		ArrowLeft: 'left',
		KeyD: 'right',
		ArrowRight: 'right',
		KeyW: 'jump',
		ArrowUp: 'jump',
		Space: 'jump',
		KeyS: 'down',
		ArrowDown: 'down',
		KeyE: 'pick',
		KeyQ: 'throw',
		ShiftLeft: 'holk',
		ShiftRight: 'holk'
	};
	function typing(e: Event) {
		const el = e.target as HTMLElement | null;
		return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
	}
	function keydown(e: KeyboardEvent) {
		if (!active || screen !== 'play' || typing(e)) return;
		if (e.code === 'Escape' || e.code === 'KeyP') {
			e.preventDefault();
			pause(!paused);
			return;
		}
		const k = KEYS[e.code];
		if (!k || paused) return;
		e.preventDefault();
		(input as unknown as Record<string, boolean>)[k] = true;
	}
	function keyup(e: KeyboardEvent) {
		const k = KEYS[e.code];
		if (k) (input as unknown as Record<string, boolean>)[k] = false;
	}

	function aimAt(e: PointerEvent) {
		if (!stage) return;
		const r = stage.getBoundingClientRect();
		mfx = (e.clientX - r.left) / r.width;
		mfy = (e.clientY - r.top) / r.height;
		if (game) {
			input.aimX = game.cam.x + mfx * VW;
			input.aimY = game.cam.y + mfy * VH;
		}
	}
	let firePointer: number | null = null;
	function down(e: PointerEvent) {
		if (screen !== 'play' || paused) return;
		if ((e.target as HTMLElement).closest('button')) return;
		e.preventDefault();
		aimAt(e);
		if (e.button === 2) {
			input.pick = true;
			setTimeout(() => (input.pick = false), 60);
			return;
		}
		firePointer = e.pointerId;
		input.fire = true;
		try {
			stage?.setPointerCapture(e.pointerId);
		} catch {
			/* a pointer the browser no longer knows */
		}
	}
	function move(e: PointerEvent) {
		if (screen !== 'play') return;
		if (e.pointerType === 'mouse' || e.pointerId === firePointer) aimAt(e);
	}
	function up(e: PointerEvent) {
		if (e.pointerId === firePointer) {
			firePointer = null;
			input.fire = false;
		}
	}

	// touch buttons
	let touchy = $state(false);
	function hold(k: keyof Input) {
		return {
			onpointerdown: (e: PointerEvent) => {
				e.preventDefault();
				e.stopPropagation();
				touchy = true;
				(input as unknown as Record<string, boolean>)[k] = true;
			},
			onpointerup: () => ((input as unknown as Record<string, boolean>)[k] = false),
			onpointercancel: () => ((input as unknown as Record<string, boolean>)[k] = false),
			onpointerleave: () => ((input as unknown as Record<string, boolean>)[k] = false)
		};
	}

	// ---------- full screen + sound ----------
	let full = $state(false);
	let shell: HTMLDivElement | undefined = $state();
	function toggleFull() {
		if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
		else shell?.requestFullscreen?.().catch(() => {});
	}
	function toggleMute() {
		sfx.muted = !sfx.muted;
		muted = sfx.muted;
		saved = { ...saved, mute: muted };
		writeSaved(saved);
	}

	const fmt = (n: number) => n.toLocaleString('en-US');
	const hpTone = $derived(hud.hp > 60 ? 'ok' : hud.hp > 30 ? 'mid' : 'low');
</script>

<svelte:window onkeydown={keydown} onkeyup={keyup} onpointerup={up} />

<section class="mh" aria-labelledby="mh-h">
	<header class="mh-head">
		<div>
			<p class="mh-kicker font-head">{M.kicker}</p>
			<h2 id="mh-h" class="mh-logo font-head" aria-label={M.title}><span>SQUAD</span><b>MAYHEM</b></h2>
		</div>
		<p class="mh-best num">{saved.best ? M.best(fmt(saved.best.score), saved.best.wave) : M.noBest}</p>
	</header>

	<div class="mh-shell" class:full bind:this={shell}>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			class="mh-stage"
			class:playing={screen === 'play'}
			bind:this={stage}
			role="application"
			aria-label={M.stageLabel}
			tabindex="0"
			onpointerdown={down}
			onpointermove={move}
			oncontextmenu={(e) => screen === 'play' && e.preventDefault()}
		>
			<canvas bind:this={canvas} class="mh-canvas" aria-hidden="true"></canvas>

			<!-- the SVG layer: 960 × 540 world units, scaled to the stage -->
			<div class="mh-layer" bind:this={layerEl} style:transform="scale({layerScale})" aria-hidden="true" hidden={screen === 'menu'}>
				{#each drops as d (d.uid)}
					{@const l = camoLook(d.id)}
					<div class="mh-drop" class:empty={d.empty} use:place={d.uid}>
						{#if l}<WeaponIcon look={l} camo={camoFor(d.id)} />{/if}
					</div>
				{/each}
			</div>
			<!-- the weapon pictures the painter turns into images (hidden) -->
			<div class="mh-gunsrc" bind:this={gunSrc} aria-hidden="true">
				{#each picIds as id (picKey(id))}
					{@const l = camoLook(id)}
					{#if l}<div data-pic={picKey(id)}><WeaponIcon look={l} camo={camoFor(id)} /></div>{/if}
				{/each}
			</div>

			{#if screen === 'play'}
				<!-- HUD -->
				<div class="mh-hud" aria-hidden="true">
					<div class="mh-hud-l">
						<span class="mh-wave-sm font-head">{M.hud.wave} {hud.wave} · {hud.left} {M.hud.left}</span>
						<div class="mh-hp" data-tone={hpTone}><i style:width="{hud.hp}%"></i><span class="num">{hud.hp} HP</span></div>
						<div class="mh-holk" class:on={hud.holkOn} class:ready={hud.holk >= 20}>
							<i style:width="{hud.holk}%"></i><span>{M.hud.holk}{#if !touchy}<em> · {M.hud.holkReady}</em>{/if}</span>
						</div>
					</div>
					<div class="mh-hud-c">
						<span class="mh-wave font-head">{M.hud.wave} {hud.wave}</span>
						<span class="mh-left num">{hud.left} {M.hud.left}</span>
					</div>
					<div class="mh-hud-r">
						<span class="mh-score num">{fmt(hud.score)}</span>
						{#if hud.combo >= 2}<span class="mh-combo font-head">×{Math.min(hud.combo, 6)} COMBO</span>{/if}
						<span class="mh-ammo">
							<b>{hud.gun}</b>
							{#if hud.gunId && !hud.melee}
								<span class="num" class:out={hud.ammo === 0}>{hud.ammo === 0 ? M.hud.empty : `${hud.ammo} / ${hud.mag}`}</span>
							{/if}
						</span>
					</div>
				</div>

				<div class="mh-tools">
					<button type="button" class="mh-tool" onclick={() => pause(true)} aria-label={M.pause} title={M.pause}>❚❚</button>
					<button type="button" class="mh-tool" onclick={toggleMute} aria-pressed={!muted} aria-label={M.sound} title={M.sound}>{muted ? '🔇' : '🔊'}</button>
					<button type="button" class="mh-tool" onclick={toggleFull} aria-label={full ? M.exitFull : M.fullscreen} title={full ? M.exitFull : M.fullscreen}>⛶</button>
				</div>

				{#if touchy}
					<div class="mh-touch">
						<div class="mh-pad">
							<button type="button" class="mh-tb" aria-label={M.touch.left} {...hold('left')}>◀</button>
							<button type="button" class="mh-tb" aria-label={M.touch.right} {...hold('right')}>▶</button>
							<button type="button" class="mh-tb" aria-label={M.touch.down} {...hold('down')}>▼</button>
							<button type="button" class="mh-tb" aria-label={M.touch.jump} {...hold('jump')}>▲</button>
						</div>
						<div class="mh-pad">
							<button type="button" class="mh-tb sm" aria-label={M.touch.pick} {...hold('pick')}>PICK</button>
							<button type="button" class="mh-tb sm" aria-label={M.touch.throw} {...hold('throw')}>THROW</button>
							<button type="button" class="mh-tb sm holk" aria-label={M.touch.holk} {...hold('holk')}>HOLK</button>
						</div>
					</div>
				{/if}

				{#if paused}
					<div class="mh-cover">
						<p class="mh-cover-t font-head">{M.paused}</p>
						<p class="mh-cover-s">{M.pausedHint}</p>
						<div class="mh-row">
							<button type="button" class="mh-btn primary" onclick={() => pause(false)}>{M.resume}</button>
							<button type="button" class="mh-btn" onclick={() => ((screen = 'menu'), cancelAnimationFrame(raf))}>{M.menu}</button>
						</div>
					</div>
				{/if}
			{/if}

			{#if screen === 'over' && result}
				<div class="mh-cover over">
					<p class="mh-cover-t font-head red">{M.over.title}</p>
					{#if result.best}<p class="mh-newbest font-head">{M.over.newBest}</p>{/if}
					<dl class="mh-stats">
						<div><dt>{M.over.score}</dt><dd class="num">{fmt(result.score)}</dd></div>
						<div><dt>{M.over.wave}</dt><dd class="num">{result.wave}</dd></div>
						<div><dt>{M.over.kills}</dt><dd class="num">{result.kills}</dd></div>
						<div><dt>{M.over.heads}</dt><dd class="num">{result.heads}</dd></div>
						<div><dt>{M.over.acc}</dt><dd class="num">{result.acc}%</dd></div>
						<div><dt>{M.over.combo}</dt><dd class="num">×{result.combo}</dd></div>
					</dl>
					<div class="mh-row">
						<button type="button" class="mh-btn primary" onclick={begin}>{M.again}</button>
						<button type="button" class="mh-btn" onclick={() => ((screen = 'menu'), cancelAnimationFrame(raf))}>{M.menu}</button>
					</div>
				</div>
			{/if}

			{#if screen === 'menu'}
				<div class="mh-menu">
					<!-- your operator, whole body, holding the starting gun: the same drawing as in the game -->
					<canvas class="mh-menu-hero" bind:this={heroCanvas} aria-hidden="true" style:width="{70 * heroK}px" style:height="{104 * heroK}px"></canvas>
					<p class="mh-intro">{M.intro}</p>
					<button type="button" class="mh-btn primary big" onclick={begin}>{M.play}</button>
				</div>
			{/if}
		</div>
	</div>

	{#if screen === 'menu'}
		<div class="mh-setup">
			<div class="mh-box">
				<h3 class="mh-h3 font-head">{M.pickOp}</h3>
				<div class="mh-ops" role="radiogroup" aria-label={M.pickOp}>
					{#each SQUAD_OPS as o (o)}
						<button type="button" class="mh-op" role="radio" aria-checked={op === o} onclick={() => (op = o)}>
							<SquadAvatar name={OP_NAMES[o]} op={o} size={44} />
							<span>{OP_NAMES[o]}</span>
						</button>
					{/each}
				</div>
				<p class="mh-note">{M.gear(gearCount)}</p>
			</div>
			<div class="mh-box">
				<h3 class="mh-h3 font-head">{M.pickGun}</h3>
				<div class="mh-guns" role="radiogroup" aria-label={M.pickGun}>
					{#each gunChoices as g (g.id)}
						{@const l = camoLook(g.id)}
						<button
							type="button"
							class="mh-gunpick"
							role="radio"
							aria-checked={start === g.id}
							onclick={() => {
								start = g.id;
								gunPicked = true;
							}}
						>
							{#if l}<WeaponIcon look={l} camo={g.camo} />{/if}
							<span class="mh-gn">{g.name}</span>
							<span class="mh-gc" data-camo={g.camo}>{g.camo ? CAMO_NAME[g.camo] : g.id === STARTER ? M.starter : M.noCamo}</span>
						</button>
					{/each}
				</div>
				<p class="mh-note">{M.gunHint}</p>
			</div>
			<div class="mh-box">
				<h3 class="mh-h3 font-head">{M.controlsTitle}</h3>
				<dl class="mh-keys">
					{#each M.controls as [k, what] (k)}
						<div><dt><kbd>{k}</kbd></dt><dd>{what}</dd></div>
					{/each}
				</dl>
				<p class="mh-note">{M.touchHint}</p>
			</div>
		</div>
	{/if}
</section>

<style>
	.mh {
		--mh-ink: #e9fbd8;
		--mh-lime: #9dff2e;
		--mh-red: #ff3b2f;
		color: var(--mh-ink);
		background:
			radial-gradient(120% 80% at 50% 0%, rgba(157, 255, 46, 0.1), transparent 60%),
			linear-gradient(180deg, #121510, #0a0c09);
		border: 1px solid rgba(157, 255, 46, 0.35);
		border-radius: 14px;
		padding: 14px;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.6) inset;
	}
	.mh-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		margin-bottom: 10px;
	}
	.mh-kicker {
		font-size: 11px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: rgba(233, 251, 216, 0.6);
	}
	.mh-logo {
		display: flex;
		align-items: baseline;
		gap: 8px;
		line-height: 1;
		font-size: clamp(26px, 5vw, 40px);
		font-weight: 900;
		letter-spacing: 0.02em;
		text-shadow: none !important;
	}
	.mh-logo span {
		color: #fff;
		-webkit-text-stroke: 1px #000;
	}
	.mh-logo b {
		color: var(--mh-lime);
		text-shadow:
			0 0 18px rgba(157, 255, 46, 0.55),
			3px 3px 0 #2a0a08 !important;
		transform: skewX(-8deg);
		display: inline-block;
	}
	.mh-best {
		font-size: 13px;
		color: rgba(233, 251, 216, 0.75);
	}

	.mh-shell {
		position: relative;
	}
	.mh-shell.full {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #000;
		width: 100vw;
		height: 100vh;
	}
	.mh-shell.full .mh-stage {
		width: min(100vw, calc(100vh * 16 / 9));
		border-radius: 0;
	}
	.mh-stage {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-radius: 10px;
		background: #0b0d0a;
		outline: none;
		touch-action: manipulation;
		user-select: none;
		-webkit-user-select: none;
	}
	.mh-stage.playing {
		cursor: crosshair;
		touch-action: none;
	}
	.mh-stage:focus-visible {
		box-shadow: 0 0 0 2px var(--mh-lime);
	}
	.mh-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
	.mh-layer {
		position: absolute;
		left: 0;
		top: 0;
		width: 960px;
		height: 540px;
		transform-origin: 0 0;
		pointer-events: none;
	}
	.mh-gunsrc {
		position: absolute;
		width: 64px;
		height: 24px;
		left: -9999px;
		top: 0;
		overflow: hidden;
	}
	.mh-drop {
		position: absolute;
		left: 0;
		top: 0;
		will-change: transform;
	}
	.mh-drop :global(.weapon-icon) {
		display: block;
		width: 100%;
		height: 100%;
	}
	.mh-drop {
		width: 42px;
		height: 16px;
		transform-origin: 21px 8px;
		filter: drop-shadow(0 0 4px rgba(157, 255, 46, 0.85));
	}
	.mh-drop.empty {
		filter: grayscale(1) brightness(0.6);
	}

	/* HUD */
	.mh-hud {
		position: absolute;
		inset: 0 0 auto 0;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 8px;
		padding: 8px 10px;
		pointer-events: none;
		font-size: 12px;
		text-shadow: 0 1px 2px #000;
	}
	.mh-hud-l {
		display: grid;
		gap: 4px;
		align-content: start;
		max-width: 210px;
	}
	.mh-hp,
	.mh-holk {
		position: relative;
		height: 16px;
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.55);
		border: 1px solid rgba(255, 255, 255, 0.25);
		overflow: hidden;
	}
	.mh-hp i,
	.mh-holk i {
		position: absolute;
		inset: 0 auto 0 0;
		background: #3ee06a;
		transition: width 0.12s;
	}
	.mh-hp[data-tone='mid'] i {
		background: #ffc233;
	}
	.mh-hp[data-tone='low'] i {
		background: #ff3b2f;
	}
	.mh-hp span,
	.mh-holk span {
		position: relative;
		padding-left: 6px;
		font-size: 11px;
		font-weight: 700;
		line-height: 14px;
		color: #fff;
	}
	.mh-holk {
		height: 13px;
	}
	.mh-holk span {
		font-size: 9.5px;
		line-height: 11px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.mh-holk em {
		font-style: normal;
		opacity: 0.7;
	}
	.mh-holk i {
		background: linear-gradient(90deg, #2c8a3a, #9dff2e);
	}
	.mh-holk:not(.ready) i {
		filter: saturate(0.4) brightness(0.7);
	}
	.mh-holk.on {
		box-shadow: 0 0 10px #9dff2e;
	}
	.mh-wave-sm {
		display: none;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.mh-hud-c {
		display: grid;
		justify-items: center;
		align-content: start;
	}
	.mh-wave {
		font-size: 16px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.mh-left {
		font-size: 11px;
		opacity: 0.8;
	}
	.mh-hud-r {
		display: grid;
		justify-items: end;
		align-content: start;
		gap: 1px;
		padding-right: 150px;
	}
	.mh-score {
		font-size: 20px;
		font-weight: 800;
	}
	.mh-combo {
		color: #ffd23a;
		font-weight: 800;
		font-size: 12px;
	}
	.mh-ammo {
		display: grid;
		justify-items: end;
		font-size: 11px;
	}
	.mh-ammo b {
		color: #a0dcff;
	}
	.mh-ammo .out {
		color: #ff6a5a;
		font-weight: 700;
	}
	.mh-tools {
		position: absolute;
		top: 6px;
		right: 6px;
		display: flex;
		gap: 4px;
	}
	.mh-tool {
		width: 44px;
		height: 44px;
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.55);
		border: 1px solid rgba(255, 255, 255, 0.25);
		color: #fff;
		font-size: 14px;
	}
	.mh-tool:hover {
		border-color: var(--mh-lime);
	}

	/* touch controls */
	.mh-touch {
		position: absolute;
		inset: auto 0 0 0;
		display: flex;
		justify-content: space-between;
		padding: 6px;
		pointer-events: none;
	}
	.mh-pad {
		display: flex;
		gap: 5px;
		pointer-events: auto;
	}
	.mh-tb {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		background: rgba(0, 0, 0, 0.45);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: #fff;
		font-size: 15px;
		touch-action: none;
	}
	.mh-tb.sm {
		width: auto;
		min-width: 44px;
		padding: 0 6px;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.04em;
	}
	.mh-tb.holk {
		border-color: var(--mh-lime);
		color: var(--mh-lime);
	}
	.mh-tb:active {
		background: rgba(157, 255, 46, 0.3);
	}

	/* covers: paused, game over, the menu's play screen */
	.mh-cover,
	.mh-menu {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 16px;
		text-align: center;
		background: rgba(5, 7, 5, 0.72);
		backdrop-filter: blur(2px);
	}
	.mh-menu {
		background:
			radial-gradient(60% 70% at 50% 40%, rgba(157, 255, 46, 0.18), transparent 70%),
			repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.025) 0 12px, transparent 12px 24px),
			#0c0f0b;
	}
	.mh-menu-hero {
		position: relative;
		flex: none;
	}
	/* no held props on the emblems in the game, only the weapon (the user, 2026-11-22): Phillestar's burger
	   and its steam, Drängen's beer, Ingman's raised arms with the dumbbell. Things in the mouth stay. */
	.mh :global(.pe-burger),
	.mh :global(.pe-steam),
	.mh :global(.la-beer),
	.mh :global(.ig-lift) {
		display: none;
	}
	.mh-intro {
		max-width: 560px;
		font-size: 13px;
		line-height: 1.45;
		color: rgba(233, 251, 216, 0.85);
	}
	.mh-cover-t {
		font-size: clamp(22px, 4vw, 40px);
		font-weight: 900;
		letter-spacing: 0.04em;
	}
	.mh-cover-t.red {
		color: var(--mh-red);
		text-shadow: 0 0 20px rgba(255, 59, 47, 0.5);
	}
	.mh-cover-s {
		font-size: 13px;
		opacity: 0.8;
	}
	.mh-newbest {
		color: #ffd23a;
		font-weight: 800;
	}
	.mh-stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 6px 18px;
	}
	.mh-stats dt {
		font-size: 10px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.7;
	}
	.mh-stats dd {
		font-size: 18px;
		font-weight: 800;
	}
	.mh-row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.mh-btn {
		min-height: 44px;
		padding: 0 18px;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: rgba(0, 0, 0, 0.5);
		color: #fff;
		font-weight: 700;
	}
	.mh-btn.primary {
		background: var(--mh-lime);
		color: #102003;
		border-color: #d4ff9a;
		box-shadow: 0 0 18px rgba(157, 255, 46, 0.45);
	}
	.mh-btn.big {
		min-height: 50px;
		padding: 0 34px;
		font-size: 18px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.mh-btn:hover {
		filter: brightness(1.1);
	}

	/* setup boxes under the stage */
	.mh-setup {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 10px;
		margin-top: 12px;
	}
	@media (min-width: 900px) {
		.mh-setup {
			grid-template-columns: 1.1fr 1.3fr 1fr;
		}
	}
	.mh-box {
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(157, 255, 46, 0.2);
		border-radius: 10px;
		padding: 10px;
		min-width: 0;
	}
	.mh-h3 {
		font-size: 13px;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--mh-lime);
		margin-bottom: 8px;
	}
	.mh-ops {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
		gap: 6px;
	}
	.mh-op {
		display: grid;
		justify-items: center;
		gap: 4px;
		min-height: 44px;
		padding: 6px 4px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(255, 255, 255, 0.04);
		font-size: 11px;
		line-height: 1.15;
		color: inherit;
	}
	.mh-op[aria-checked='true'] {
		border-color: var(--mh-lime);
		background: rgba(157, 255, 46, 0.14);
		box-shadow: 0 0 10px rgba(157, 255, 46, 0.3);
	}
	.mh-guns {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 6px;
		max-height: 260px;
		overflow-y: auto;
	}
	.mh-gunpick {
		display: grid;
		justify-items: center;
		gap: 2px;
		min-height: 44px;
		padding: 6px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(255, 255, 255, 0.04);
		color: inherit;
	}
	.mh-gunpick :global(.weapon-icon) {
		width: 72px;
		height: 27px;
	}
	.mh-gunpick[aria-checked='true'] {
		border-color: var(--mh-lime);
		background: rgba(157, 255, 46, 0.14);
	}
	.mh-gn {
		font-size: 11.5px;
		font-weight: 700;
	}
	.mh-gc {
		font-size: 10px;
		opacity: 0.75;
	}
	.mh-gc[data-camo='gold'] {
		color: #f2cc66;
		opacity: 1;
	}
	.mh-gc[data-camo='platinum'] {
		color: #dfe5ea;
		opacity: 1;
	}
	.mh-gc[data-camo='harmonicBreak'] {
		color: #ff5a5a;
		opacity: 1;
	}
	.mh-gc[data-camo='divergence'],
	.mh-gc[data-camo='mercurialDrift'],
	.mh-gc[data-camo='polyatomicReforged'],
	.mh-gc[data-camo='orionReforged'] {
		color: #c9a0ff;
		opacity: 1;
	}
	.mh-note {
		margin-top: 8px;
		font-size: 11.5px;
		line-height: 1.4;
		color: rgba(233, 251, 216, 0.65);
	}
	.mh-keys {
		display: grid;
		gap: 4px;
	}
	.mh-keys div {
		display: flex;
		gap: 8px;
		align-items: baseline;
		font-size: 12px;
	}
	.mh-keys dt {
		min-width: 108px;
	}
	kbd {
		display: inline-block;
		padding: 1px 6px;
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.07);
		font: 600 11px/1.5 'Cascadia Mono', Consolas, monospace;
	}

	@media (max-width: 639px) {
		.mh {
			padding: 8px;
		}
		.mh-hud {
			font-size: 10px;
			padding: 4px 6px;
		}
		.mh-hud {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
		.mh-hud-l {
			max-width: 130px;
		}
		.mh-hud-c {
			display: none;
		}
		.mh-wave-sm {
			display: block !important;
		}
		.mh-hud-r {
			padding-right: 0;
			padding-top: 46px;
		}
		/* phones: a 2 × 2 cross on the left, a column on the right, so they fit a 330 px wide game */
		.mh-pad:first-child {
			display: grid;
			grid-template-columns: 44px 44px;
			gap: 4px;
		}
		.mh-pad:last-child {
			gap: 4px;
		}
		.mh-touch {
			align-items: flex-end;
			padding: 4px;
		}
		.mh-score {
			font-size: 14px;
		}
		.mh-wave {
			font-size: 12px;
		}
		.mh-hp {
			height: 13px;
		}
		.mh-hp span {
			font-size: 9px;
			line-height: 11px;
		}
		.mh-menu {
			gap: 6px;
			padding: 8px;
		}
		.mh-intro {
			display: none;
		}
		.mh-stats {
			gap: 2px 10px;
		}
		.mh-stats dd {
			font-size: 14px;
		}
		.mh-cover {
			gap: 4px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.mh-hp i,
		.mh-holk i {
			transition: none;
		}
	}
</style>
