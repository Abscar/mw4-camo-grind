<!--
	Abscars Madness (2026-11-23; it started as the Squad Mayhem tab of 2026-11-22). The user: "rename it Abscars
	Madness, lots of levels, not stuck in one room with waves, move forward by killing, a bit of puzzle to get on,
	a skill tree with cool abilities to unlock". Our own side-scrolling brawler-shooter: engine.ts = the rules,
	levels.ts = the 12 levels, skills.ts = the skill tree, render.ts + painter.ts = the canvas.
	It opens full screen from its own title button (MadnessLauncher.svelte). Menu: levels (each opens when the one
	before is cleared; up to 4 skill points each: 2 for clearing, 1 for killing everyone, 1 for no deaths), the
	skill tree, your operator, your starting gun (the guns you have a camo on). Progress is kept on this device.
-->
<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import { ARMORY_CAMOS, bestCamo, heldGun } from '#lib/armory.ts';
	import { camoLook } from '#lib/data/weaponLooks.ts';
	import type { IconCamo } from '#lib/data/camos.ts';
	import { mayhemText as M } from '#lib/i18n/mayhem.ts';
	import { t } from '#lib/i18n/en.ts';
	import { H, Mayhem, NO_INPUT, VH, VW, W, type GameEvent, type Input } from '#lib/mayhem/engine.ts';
	import { gunOf, OUT_WEAPONS, STARTER } from '#lib/mayhem/guns.ts';
	import { CHAPTERS, chapterOf, LEVEL_BY_ID, LEVELS, levelOpen, pointsOf, type LevelRecord } from '#lib/mayhem/levels.ts';
	import { BRANCHES, canBuy, cleanSkills, SKILLS, skillCost, type SkillId } from '#lib/mayhem/skills.ts';
	import { render } from '#lib/mayhem/render.ts';
	import { ACTIONS, bind, cleanSettings, DEFAULT_KEYS, DEFAULT_SETTINGS, inputOf, keyLabel, keyMap, PACE, SPEEDS, unbind, type Action, type Settings } from '#lib/mayhem/controls.ts';
	import { LOOKS, paintFigure, type GunPic } from '#lib/mayhem/painter.ts';
	import { MayhemSound } from '#lib/mayhem/sound.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { SQUAD_OPS, type SquadOp } from '#lib/squad-codec.ts';
	import SquadAvatar from '../SquadAvatar.svelte';
	import WeaponIcon from '../WeaponIcon.svelte';

	let { active = false, onclose }: { active?: boolean; onclose?: () => void } = $props();

	const KEY = 'mw4-camo-grind:mayhem';
	type Camp = { done?: Record<string, LevelRecord>; skills?: SkillId[] };
	type Saved = { op?: SquadOp; gun?: string; mute?: boolean; level?: string; camp?: Camp; settings?: unknown };
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
		joker: t.operator.joker,
		meili: t.operator.meili
	};

	// ---------- the campaign: levels + skills ----------
	const camp = $derived<Camp>(saved.camp ?? {});
	const done = $derived<Record<string, LevelRecord>>(camp.done && typeof camp.done === 'object' ? camp.done : {});
	const skills = $derived(cleanSkills(camp.skills));
	const skillSet = $derived(new Set<SkillId>(skills));
	const earned = $derived(LEVELS.reduce((n, l) => n + pointsOf(done[l.id]), 0));
	const free = $derived(earned - skillCost(skills));
	const cleared = $derived(LEVELS.filter((l) => done[l.id]?.clear).length);
	let levelId = $state(LEVELS[0].id);
	const level = $derived(LEVEL_BY_ID.get(levelId) ?? LEVELS[0]);
	const chapterLevels = $derived(LEVELS.filter((l) => chapterOf(l) === chapterOf(level)));
	const levelNo = $derived(chapterLevels.indexOf(level) + 1);
	/** a level's number inside its chapter (chapter 2 shows "2-3") */
	const shortNo = (i: number) => {
		const l = LEVELS[i];
		const n = LEVELS.filter((x, j) => j <= i && chapterOf(x) === chapterOf(l)).length;
		return chapterOf(l) === 1 ? String(n) : `${chapterOf(l)}-${n}`;
	};
	function setCamp(c: Camp) {
		saved = { ...saved, camp: { ...camp, ...c } };
		writeSaved(saved);
	}
	function buySkill(id: SkillId) {
		if (canBuy(id, skillSet, free) !== 'ok') return;
		setCamp({ skills: [...skills, id] });
	}
	function pickLevel(id: string) {
		const i = LEVELS.findIndex((l) => l.id === id);
		if (i < 0 || !levelOpen(i, done)) return;
		levelId = id;
		saved = { ...saved, level: id };
		writeSaved(saved);
	}
	const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

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

	/** starting guns: the starter pistol, your held Camo Armory gun, and every gun you have a camo on */
	const gunChoices = $derived.by(() => {
		const out = OUT_WEAPONS.map((w) => ({ id: w.id, name: w.name, camo: camoFor(w.id) })).filter((g) => g.camo || g.id === STARTER);
		out.sort((a, b) => (b.camo ? CAMO_RANK.indexOf(b.camo) : -1) - (a.camo ? CAMO_RANK.indexOf(a.camo) : -1));
		return out;
	});

	onMount(() => {
		saved = readSaved();
		op = saved.op && SQUAD_OPS.includes(saved.op) ? saved.op : (squad.me?.op ?? 'abscar');
		settings = cleanSettings(saved.settings);
		sfx.volume = settings.volume;
		sfx.muted = !!saved.mute;
		muted = sfx.muted;
		const rec = saved.camp?.done ?? {};
		const i = LEVELS.findIndex((l) => l.id === saved.level);
		const firstNew = LEVELS.findIndex((l, j) => levelOpen(j, rec) && !rec[l.id]?.clear);
		levelId = i >= 0 && levelOpen(i, rec) ? LEVELS[i].id : LEVELS[Math.max(0, firstNew)].id;
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
	type Screen = 'menu' | 'play' | 'done';
	let screen = $state<Screen>('menu');
	let paused = $state(false);
	let game: Mayhem | null = null;
	const sfx = new MayhemSound();
	let muted = $state(false);
	/** the menu's panels */
	let panel = $state<'levels' | 'skills' | 'loadout' | 'settings'>('levels');

	// ---------- settings (controls.ts): keys, volume, shake, hints, short hop ----------
	let settings = $state<Settings>(DEFAULT_SETTINGS);
	/** waiting for a key press to bind */
	let listening = $state<{ a: Action; slot: 0 | 1 } | null>(null);
	/** the settings opened from the pause screen */
	let pauseSettings = $state(false);
	function saveSettings(s: Settings) {
		settings = s;
		saved = { ...saved, settings: s };
		writeSaved(saved);
		sfx.volume = s.volume;
		if (game) {
			game.shortHop = s.shortHop;
			game.pace = PACE[s.speed];
		}
	}
	const keysChanged = $derived(JSON.stringify(settings.keys) !== JSON.stringify(DEFAULT_KEYS));

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
	let hud = $state({
		hp: 100,
		maxHp: 100,
		ammo: 0,
		mag: 0,
		gun: '',
		gunId: '',
		melee: false,
		score: 0,
		combo: 0,
		holk: 0,
		holkOn: false,
		kills: 0,
		total: 0,
		keys: '',
		nades: 0,
		knives: 0,
		cp: 0,
		dead: false,
		hint: ''
	});
	let drops = $state<{ uid: number; id: string; empty: boolean }[]>([]);
	let dropKey = '';
	const dropEls = new Map<number, HTMLElement>();
	type Result = {
		name: string;
		no: string;
		time: number;
		kills: number;
		total: number;
		deaths: number;
		score: number;
		heads: number;
		acc: number;
		combo: number;
		gained: number;
		all: boolean;
		clean: boolean;
		bestTime: boolean;
		next: string | null;
	};
	let result = $state<Result | null>(null);

	function place(node: HTMLElement, uid: number) {
		dropEls.set(uid, node);
		return { destroy: () => dropEls.delete(uid) };
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

	function begin(id: string = levelId) {
		levelId = id;
		saved = { ...saved, op, gun: start, level: id };
		writeSaved(saved);
		game = new Mayhem(id, start, skills, Date.now());
		game.shortHop = settings.shortHop;
		game.pace = PACE[settings.speed];
		pauseSettings = false;
		// for the check scripts (read only; like the frame cap's window.__mw4fx)
		(window as unknown as { __mayhem: Mayhem }).__mayhem = game;
		result = null;
		drops = [];
		dropKey = '';
		screen = 'play';
		paused = false;
		Object.assign(input, NO_INPUT, { aimX: game.player.x + 200, aimY: game.player.y - 60 });
		mfx = 0.75;
		mfy = 0.6;
		sfx.unlock();
		last = 0;
		loop();
		stage?.focus();
	}

	function toMenu() {
		screen = 'menu';
		paused = false;
		cancelAnimationFrame(raf);
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

	/** the hitmarker: an X at the crosshair when your shot lands (white), red on a kill (2026-11-24, the user's ask) */
	let hm = $state<{ n: number; x: number; y: number; kind: 'hit' | 'head' | 'kill' } | null>(null);
	let hmTimer = 0;
	function hitmark(kind: 'hit' | 'head' | 'kill') {
		// a kill keeps its red X even if a hit lands in the same frame
		if (hm && hm.kind === 'kill' && kind !== 'kill' && performance.now() - hm.n < 120) return;
		hm = { n: performance.now(), x: mfx * 100, y: mfy * 100, kind };
		clearTimeout(hmTimer);
		hmTimer = window.setTimeout(() => (hm = null), kind === 'kill' ? 420 : 300);
	}

	function onEvent(e: GameEvent) {
		sfx.play(e);
		if (e.t === 'hit' && e.mine) hitmark(e.head ? 'head' : 'hit');
		else if (e.t === 'kill') hitmark('kill');
		if (e.t === 'complete') setTimeout(finish, 1500);
	}

	function finish() {
		if (!game || screen !== 'play') return;
		const g = game;
		const id = g.level.id;
		const old = done[id] ?? {};
		const all = g.stats.kills >= g.totalEnemies;
		const clean = g.deaths === 0;
		const time = Math.round(g.time);
		const rec: LevelRecord = { ...old, clear: 1 };
		if (all) rec.all = 1;
		if (clean) rec.clean = 1;
		const bestTime = !old.best || time < old.best;
		if (bestTime) rec.best = time;
		const i = LEVELS.findIndex((l) => l.id === id);
		result = {
			name: g.level.name,
			no: shortNo(i),
			time,
			kills: g.stats.kills,
			total: g.totalEnemies,
			deaths: g.deaths,
			score: g.score,
			heads: g.stats.heads,
			acc: g.stats.shots ? Math.round((g.stats.hits / g.stats.shots) * 100) : 0,
			combo: g.stats.bestCombo,
			gained: pointsOf(rec) - pointsOf(old),
			all,
			clean,
			bestTime: bestTime && !!old.best,
			next: LEVELS[i + 1]?.id ?? null
		};
		setCamp({ done: { ...done, [id]: rec } });
		screen = 'done';
	}

	function draw() {
		if (!game || !ctx || !canvas) return;
		const g = game;
		if (reduce || !settings.shake) g.shake = 0;
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
			maxHp: p.maxHp,
			ammo: p.held?.ammo ?? 0,
			mag: gun ? Math.round(gun.mag * (skillSet.has('mags') ? 1.5 : 1)) : 0,
			gun: gun?.name ?? M.hud.fists,
			gunId: p.held?.id ?? '',
			melee: gun?.kind === 'melee',
			score: g.score,
			combo: g.combo,
			holk: Math.round(g.holk),
			holkOn: g.holkOn,
			kills: g.stats.kills,
			total: g.totalEnemies,
			keys: [...g.have].sort().join(','),
			nades: g.grenades,
			knives: g.knives,
			cp: g.checkpoint,
			dead: p.hp <= 0,
			hint: settings.hints && g.time < (g.level.id === LEVELS[0].id ? 12 : 8) ? (g.level.id === LEVELS[0].id ? `${g.level.hint} ${M.hud.stealthTip}` : g.level.hint) : ''
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
		canvas.height = Math.round(((cssW * VH) / VW) * dpr);
		ctx = canvas.getContext('2d');
		if (game) draw();
	}

	let ro: ResizeObserver | null = null;
	onMount(() => {
		reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		heroK = innerWidth < 640 ? 1.2 : 1.8;
		touchy = matchMedia('(pointer: coarse)').matches;
		full = !!document.fullscreenElement;
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

	// closing the game pauses
	$effect(() => {
		if (!active) untrack(() => pause(true));
	});

	function pause(on: boolean) {
		if (screen !== 'play' || game?.over) return;
		paused = on;
		if (on) Object.assign(input, { left: false, right: false, jump: false, down: false, fire: false, pick: false, throw: false, holk: false, dash: false, nade: false, knife: false });
		else {
			last = 0;
			stage?.focus();
		}
	}

	// ---------- input ----------
	/** the key bindings from the settings: key code → action */
	const keymap = $derived(keyMap(settings.keys));
	function typing(e: Event) {
		const el = e.target as HTMLElement | null;
		return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
	}
	function keydown(e: KeyboardEvent) {
		if (!active) return;
		// waiting for a new key in the settings
		if (listening) {
			e.preventDefault();
			e.stopPropagation();
			if (e.code !== 'Escape') saveSettings({ ...settings, keys: bind(settings.keys, listening.a, listening.slot, e.code) });
			listening = null;
			return;
		}
		if (typing(e)) return;
		if (screen !== 'play') {
			if (e.code === 'Escape' && onclose) {
				e.preventDefault();
				onclose();
			}
			return;
		}
		const act = keymap.get(e.code);
		if (e.code === 'Escape' || act === 'pause') {
			e.preventDefault();
			if (paused && pauseSettings) pauseSettings = false;
			else pause(!paused);
			return;
		}
		const k = act ? inputOf(act) : null;
		if (!k || paused) return;
		e.preventDefault();
		(input as unknown as Record<string, boolean>)[k] = true;
	}
	function keyup(e: KeyboardEvent) {
		const act = keymap.get(e.code);
		const k = act ? inputOf(act) : null;
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
	function toggleFull() {
		if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
		else document.documentElement.requestFullscreen?.().catch(() => {});
	}
	function toggleMute() {
		sfx.muted = !sfx.muted;
		muted = sfx.muted;
		saved = { ...saved, mute: muted };
		writeSaved(saved);
	}

	const fmt = (n: number) => n.toLocaleString('en-US');
	const hpTone = $derived(hud.hp > hud.maxHp * 0.6 ? 'ok' : hud.hp > hud.maxHp * 0.3 ? 'mid' : 'low');
	const KEY_COL: Record<string, string> = { red: '#ff3b3b', blue: '#3b8bff', yellow: '#ffd23b' };
	const THEME_NAME = { office: 'Office', diner: 'Diner', warehouse: 'Warehouse', tower: 'Skyscraper', depths: 'The Depths' } as const;
	const chapterName = (n: number) => CHAPTERS.find((c) => c.n === n)?.name ?? '';
</script>

{#snippet settingsUi()}
	<div class="mh-set">
		<div class="mh-set-keys">
			<div class="mh-set-head">
				<h3 class="mh-h3 font-head">{M.set.keys}</h3>
				{#if keysChanged}<button type="button" class="mh-btn sm" onclick={() => saveSettings({ ...settings, keys: DEFAULT_KEYS })}>{M.set.resetKeys}</button>{/if}
			</div>
			<p class="mh-note">{M.set.keysHelp}</p>
			<div class="mh-binds" role="list">
				{#each ACTIONS as act (act.a)}
					<div class="mh-bind" role="listitem">
						<span class="mh-bind-name">{act.name}</span>
						{#each [0, 1] as const as slot (slot)}
							{@const k = settings.keys[act.a][slot]}
							{@const wait = listening?.a === act.a && listening.slot === slot}
							<span class="mh-keycell">
								<button
									type="button"
									class="mh-keybtn"
									class:wait
									class:empty={!k}
									aria-label={M.set.bindLabel(act.name, slot + 1, keyLabel(k))}
									onclick={() => (listening = wait ? null : { a: act.a, slot })}
								>
									{wait ? M.set.press : keyLabel(k)}
								</button>
								{#if k && !wait}
									<button type="button" class="mh-keyx" aria-label={M.set.clearLabel(act.name, keyLabel(k))} onclick={() => saveSettings({ ...settings, keys: unbind(settings.keys, act.a, slot) })}>×</button>
								{/if}
							</span>
						{/each}
					</div>
				{/each}
				<div class="mh-bind locked" role="listitem"><span class="mh-bind-name">{M.set.mouse}</span><span class="mh-fixed">{M.set.mouseKeys}</span></div>
				<div class="mh-bind locked" role="listitem"><span class="mh-bind-name">{M.set.escName}</span><span class="mh-fixed">Esc</span></div>
			</div>
		</div>
		<div class="mh-set-opts">
			<h3 class="mh-h3 font-head">{M.set.game}</h3>
			<label class="mh-range">
				<span>{M.set.volume} <b class="num">{Math.round(settings.volume * 100)}%</b></span>
				<input type="range" min="0" max="100" step="5" value={Math.round(settings.volume * 100)} oninput={(e) => saveSettings({ ...settings, volume: Number(e.currentTarget.value) / 100 })} />
			</label>
			<label class="mh-check">
				<input type="checkbox" checked={!muted} onchange={toggleMute} />
				<span>{M.set.sound}</span>
			</label>
			<div class="mh-speed" role="radiogroup" aria-label={M.set.speed}>
				<span class="mh-speed-l">{M.set.speed}<small>{M.set.speedHelp}</small></span>
				<div class="mh-speed-b">
					{#each SPEEDS as sp (sp)}
						<button type="button" role="radio" aria-checked={settings.speed === sp} class:on={settings.speed === sp} onclick={() => saveSettings({ ...settings, speed: sp })}>{M.set.speeds[sp]}</button>
					{/each}
				</div>
			</div>
			<label class="mh-check">
				<input type="checkbox" checked={settings.shake} onchange={(e) => saveSettings({ ...settings, shake: e.currentTarget.checked })} />
				<span>{M.set.shake}</span>
			</label>
			<label class="mh-check">
				<input type="checkbox" checked={settings.shortHop} onchange={(e) => saveSettings({ ...settings, shortHop: e.currentTarget.checked })} />
				<span>{M.set.shortHop}<small>{M.set.shortHopHelp}</small></span>
			</label>
			<label class="mh-check">
				<input type="checkbox" checked={settings.hints} onchange={(e) => saveSettings({ ...settings, hints: e.currentTarget.checked })} />
				<span>{M.set.hints}</span>
			</label>
			<p class="mh-note">{M.set.saved}</p>
		</div>
	</div>
{/snippet}

<svelte:window onkeydown={keydown} onkeyup={keyup} onpointerup={up} />

<section class="mh" class:immersive={screen !== 'menu'} aria-labelledby="mh-h">
	<header class="mh-head">
		<div>
			<p class="mh-kicker font-head">{M.kicker(LEVELS.length)}</p>
			<h2 id="mh-h" class="mh-logo font-head" aria-label={M.title}><span>ABSCARS</span><b>MADNESS</b></h2>
		</div>
		<p class="mh-best num">{M.progress(cleared, LEVELS.length, earned, LEVELS.length * 4)}</p>
		{#if onclose}<button type="button" class="mh-close" onclick={onclose} aria-label={M.close}>✕ <span>{M.close}</span></button>{/if}
	</header>

	<div class="mh-shell">
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

			<!-- the SVG layer: world units, scaled to the stage and moved with the camera -->
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

			{#if screen === 'play' && hm}
				{#key hm.n}
					<svg class="mh-hitmark" data-kind={hm.kind} style:left="{hm.x}%" style:top="{hm.y}%" viewBox="-20 -20 40 40" aria-hidden="true">
						<g>
							<path d="M-14-14L-5-5M14-14L5-5M-14 14L-5 5M14 14L5 5" />
						</g>
					</svg>
				{/key}
			{/if}
			{#if screen === 'play'}
				<!-- HUD -->
				<div class="mh-hud" aria-hidden="true">
					<div class="mh-hud-l">
						<span class="mh-wave-sm font-head">{shortNo(LEVELS.indexOf(level))}. {level.name}</span>
						<div class="mh-hp" data-tone={hpTone}><i style:width="{(hud.hp / hud.maxHp) * 100}%"></i><span class="num">{hud.hp} HP</span></div>
						<div class="mh-holk" class:on={hud.holkOn} class:ready={hud.holk >= 20}>
							<i style:width="{hud.holk}%"></i><span>{M.hud.holk}{#if !touchy}<em> · {M.hud.holkReady}</em>{/if}</span>
						</div>
						<div class="mh-inv">
							{#each hud.keys ? hud.keys.split(',') : [] as k (k)}<span class="mh-key" style:background={KEY_COL[k]} title="{k} key"></span>{/each}
							<span class="mh-knives num" title={M.hud.knives} aria-label="{M.hud.knives}: {hud.knives}">🔪 {hud.knives}</span>{#if skillSet.has('frag')}<span class="mh-nades num">💣 {hud.nades}</span>{/if}
						</div>
					</div>
					<div class="mh-hud-c">
						<span class="mh-wave font-head">{shortNo(LEVELS.indexOf(level))}. {level.name}</span>
						<span class="mh-left num">{M.hud.kills(hud.kills, hud.total)} · {M.hud.cp(hud.cp, level.checkpoints.length)}</span>
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
				{#if hud.hint}<p class="mh-hint" aria-live="polite">{hud.hint}</p>{/if}
				{#if hud.dead}<p class="mh-respawn font-head" aria-live="polite">{M.respawn}</p>{/if}

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
							<button type="button" class="mh-tb sm" aria-label={M.touch.pick} {...hold('pick')}>USE</button>
							<button type="button" class="mh-tb sm" aria-label={M.touch.throw} {...hold('throw')}>THROW</button>
							<button type="button" class="mh-tb sm" aria-label={M.touch.dash} {...hold('dash')}>DASH</button>
							<button type="button" class="mh-tb sm" aria-label={M.touch.knife} {...hold('knife')}>KNIFE</button>
							{#if skillSet.has('frag')}<button type="button" class="mh-tb sm" aria-label={M.touch.nade} {...hold('nade')}>NADE</button>{/if}
							<button type="button" class="mh-tb sm holk" aria-label={M.touch.holk} {...hold('holk')}>HOLK</button>
						</div>
					</div>
				{/if}

				{#if paused}
					<div class="mh-cover" class:settings={pauseSettings}>
						{#if pauseSettings}
							<div class="mh-pause-set">
								{@render settingsUi()}
								<button type="button" class="mh-btn primary" onclick={() => (pauseSettings = false)}>{M.set.back}</button>
							</div>
						{:else}
						<p class="mh-cover-t font-head">{M.paused}</p>
						<p class="mh-cover-s">{M.pausedHint}</p>
						<div class="mh-row">
							<button type="button" class="mh-btn primary" onclick={() => pause(false)}>{M.resume}</button>
							<button type="button" class="mh-btn" onclick={() => (pauseSettings = true)}>⚙ {M.tabs.settings}</button>
							<button type="button" class="mh-btn" onclick={() => begin(levelId)}>{M.restart}</button>
							<button type="button" class="mh-btn" onclick={toMenu}>{M.menu}</button>
						</div>
						{/if}
					</div>
				{/if}
			{/if}

			{#if screen === 'done' && result}
				<div class="mh-cover over">
					<p class="mh-cover-k font-head">{M.done.kicker(result.no)}</p>
					<p class="mh-cover-t font-head lime">{M.done.title}</p>
					<p class="mh-cover-s">{result.name}</p>
					{#if result.gained > 0}<p class="mh-newbest font-head">{M.done.points(result.gained)}</p>{/if}
					<dl class="mh-stats">
						<div><dt>{M.done.time}</dt><dd class="num">{fmtTime(result.time)}{#if result.bestTime}<small> ★</small>{/if}</dd></div>
						<div><dt>{M.done.kills}</dt><dd class="num" class:ok={result.all}>{result.kills}/{result.total}</dd></div>
						<div><dt>{M.done.deaths}</dt><dd class="num" class:ok={result.clean}>{result.deaths}</dd></div>
						<div><dt>{M.done.score}</dt><dd class="num">{fmt(result.score)}</dd></div>
						<div><dt>{M.done.heads}</dt><dd class="num">{result.heads}</dd></div>
						<div><dt>{M.done.acc}</dt><dd class="num">{result.acc}%</dd></div>
					</dl>
					<div class="mh-row">
						{#if result.next}
							{@const nx = result.next}
							<button type="button" class="mh-btn primary" onclick={() => begin(nx)}>{M.done.next}</button>
						{:else}
							<p class="mh-newbest font-head">{M.done.allDone}</p>
						{/if}
						<button type="button" class="mh-btn" onclick={() => begin(levelId)}>{M.done.again}</button>
						<button
							type="button"
							class="mh-btn"
							onclick={() => {
								panel = 'skills';
								if (result?.next) levelId = result.next;
								toMenu();
							}}>{M.done.skills(free)}</button
						>
					</div>
				</div>
			{/if}

			{#if screen === 'menu'}
				<div class="mh-menu">
					<!-- your operator, whole body, holding the starting gun: the same drawing as in the game -->
					<canvas class="mh-menu-hero" bind:this={heroCanvas} aria-hidden="true" style:width="{70 * heroK}px" style:height="{104 * heroK}px"></canvas>
					<div class="mh-menu-info">
						<p class="mh-cover-k font-head">{#if chapterOf(level) > 1}{M.chapter(chapterOf(level), chapterName(chapterOf(level)))} · {/if}{M.levelNo(levelNo, chapterLevels.length)} · {THEME_NAME[level.theme]}</p>
						<p class="mh-menu-name font-head">{level.name}</p>
						<p class="mh-intro">{level.hint}</p>
						<button type="button" class="mh-btn primary big" onclick={() => begin()}>{done[level.id]?.clear ? M.playAgain : M.play}</button>
					</div>
				</div>
			{/if}
		</div>
	</div>

	{#if screen === 'menu'}
		<div class="mh-tabs" role="tablist" aria-label={M.menuLabel}>
			<button type="button" role="tab" class="mh-tab" aria-selected={panel === 'levels'} onclick={() => (panel = 'levels')}>{M.tabs.levels}</button>
			<button type="button" role="tab" class="mh-tab" aria-selected={panel === 'skills'} onclick={() => (panel = 'skills')}>
				{M.tabs.skills}{#if free > 0}<span class="mh-pill num">{free}</span>{/if}
			</button>
			<button type="button" role="tab" class="mh-tab" aria-selected={panel === 'loadout'} onclick={() => (panel = 'loadout')}>{M.tabs.loadout}</button>
			<button type="button" role="tab" class="mh-tab" aria-selected={panel === 'settings'} onclick={() => (panel = 'settings')}>⚙ {M.tabs.settings}</button>
		</div>

		{#if panel === 'levels'}
			<div class="mh-levels">
				{#each LEVELS as l, i (l.id)}
					{@const open = levelOpen(i, done)}
					{@const r = done[l.id]}
					{#if i === 0 || chapterOf(LEVELS[i - 1]) !== chapterOf(l)}
						<div class="mh-chapter" data-ch={chapterOf(l)}>
							<h3 class="font-head">{M.chapter(chapterOf(l), chapterName(chapterOf(l)))}</h3>
							<p>{M.chapterNote[chapterOf(l)] ?? ''}</p>
						</div>
					{/if}
					<button type="button" class="mh-level" data-theme-l={l.theme} aria-pressed={levelId === l.id} disabled={!open} onclick={() => pickLevel(l.id)}>
						<span class="mh-lv-no num">{shortNo(i)}</span>
						<span class="mh-lv-name font-head">{l.name}</span>
						<span class="mh-lv-hint">{open ? l.hint : M.locked}</span>
						<span class="mh-lv-stars" aria-label={M.starsLabel(pointsOf(r))}>
							<i class:on={!!r?.clear} title={M.star.clear}>★</i><i class:on={!!r?.clear} title={M.star.clear}>★</i><i class:on={!!r?.all} title={M.star.all}>☠</i><i class:on={!!r?.clean} title={M.star.clean}>♥</i>
							{#if r?.best}<em class="num">{fmtTime(r.best)}</em>{/if}
						</span>
						{#if !open}<span class="mh-lv-lock" aria-hidden="true">🔒</span>{/if}
					</button>
				{/each}
			</div>
			<p class="mh-note">{M.levelsNote}</p>
		{:else if panel === 'skills'}
			<div class="mh-skillhead">
				<p><b class="num">{free}</b> {M.skillPoints(free)} · {M.earned(earned, LEVELS.length * 4)}</p>
				{#if skills.length}<button type="button" class="mh-btn sm" onclick={() => setCamp({ skills: [] })}>{M.refund}</button>{/if}
			</div>
			<div class="mh-tree">
				{#each BRANCHES as b (b.id)}
					<div class="mh-branch" style:--bc={b.colour}>
						<h3 class="mh-h3 font-head">{b.name}</h3>
						{#each SKILLS.filter((s) => s.branch === b.id) as s (s.id)}
							{@const st = canBuy(s.id, skillSet, free)}
							<button type="button" class="mh-skill" data-state={st} disabled={st !== 'ok'} onclick={() => buySkill(s.id)}>
								<span class="mh-sk-name font-head">{s.name}</span>
								<span class="mh-sk-what">{s.what}</span>
								{#if s.key}<span class="mh-sk-key"><kbd>{s.key}</kbd></span>{/if}
								<span class="mh-sk-cost">{st === 'owned' ? M.owned : st === 'locked' ? M.needsFirst : M.cost(s.cost)}</span>
							</button>
						{/each}
					</div>
				{/each}
			</div>
		{:else if panel === 'settings'}
			<div class="mh-setwrap">{@render settingsUi()}</div>
		{:else}
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
						{#each ACTIONS as act (act.a)}
							<div><dt><kbd>{settings.keys[act.a].filter(Boolean).map(keyLabel).join(' / ') || '–'}</kbd></dt><dd>{act.name}</dd></div>
						{/each}
						<div><dt><kbd>{M.set.mouseKeys}</kbd></dt><dd>{M.set.mouse}</dd></div>
					</dl>
					<p class="mh-note">{M.touchHint}</p>
				</div>
			</div>
		{/if}
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
	/* the hitmarker: four short diagonal strokes round the crosshair, a dark edge so it reads on light walls */
	.mh-hitmark {
		position: absolute;
		z-index: 6;
		width: 34px;
		height: 34px;
		margin: -17px 0 0 -17px;
		pointer-events: none;
		overflow: visible;
		animation: mh-hm 0.3s ease-out forwards;
	}
	.mh-hitmark path {
		fill: none;
		stroke: #fff;
		stroke-width: 3.2;
		stroke-linecap: square;
		filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 2px rgba(0, 0, 0, 0.6));
	}
	.mh-hitmark[data-kind='head'] {
		width: 40px;
		height: 40px;
		margin: -20px 0 0 -20px;
	}
	.mh-hitmark[data-kind='kill'] {
		width: 42px;
		height: 42px;
		margin: -21px 0 0 -21px;
		animation-duration: 0.42s;
	}
	.mh-hitmark[data-kind='kill'] path {
		stroke: #ff2a2a;
		stroke-width: 3.6;
	}
	@keyframes mh-hm {
		0% {
			transform: scale(1.35);
			opacity: 1;
		}
		25% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(1);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.mh-hitmark {
			animation-name: mh-hm-still;
		}
		@keyframes mh-hm-still {
			0%,
			40% {
				opacity: 1;
			}
			100% {
				opacity: 0;
			}
		}
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

	/* ---------- settings (2026-11-24) ---------- */
	.mh-setwrap {
		max-width: 1100px;
		margin: 10px auto 0;
	}
	.mh-set {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 12px;
		text-align: left;
	}
	@media (min-width: 820px) {
		.mh-set {
			grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
		}
	}
	.mh-set-keys,
	.mh-set-opts {
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 10px;
		padding: 10px;
		min-width: 0;
	}
	.mh-set-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}
	.mh-set-head .mh-h3 {
		margin: 0;
	}
	.mh-binds {
		display: grid;
		gap: 4px;
		margin-top: 8px;
	}
	.mh-bind {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 118px 118px;
		gap: 6px;
		align-items: center;
		font-size: 13px;
	}
	.mh-bind.locked {
		grid-template-columns: minmax(0, 1fr) auto;
		opacity: 0.75;
	}
	.mh-bind-name {
		min-width: 0;
	}
	.mh-keycell {
		position: relative;
		display: flex;
	}
	.mh-keybtn {
		flex: 1;
		min-height: 44px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.28);
		background: rgba(255, 255, 255, 0.07);
		color: #fff;
		font: 700 13px/1 'Cascadia Mono', Consolas, monospace;
		padding: 0 22px 0 8px;
	}
	.mh-keybtn.empty {
		color: rgba(255, 255, 255, 0.35);
		padding-right: 8px;
	}
	.mh-keybtn:hover {
		border-color: #ff6a1a;
	}
	.mh-keybtn.wait {
		border-color: #ffd23a;
		background: rgba(255, 210, 58, 0.18);
		color: #ffd23a;
		padding-right: 8px;
		animation: mh-blink 0.8s steps(2) infinite;
	}
	@keyframes mh-blink {
		50% {
			border-color: transparent;
		}
	}
	.mh-keyx {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 26px;
		color: rgba(255, 255, 255, 0.55);
		font-size: 16px;
	}
	.mh-keyx:hover {
		color: #ff6a5a;
	}
	.mh-fixed {
		font: 600 12px/1.4 'Cascadia Mono', Consolas, monospace;
		opacity: 0.85;
	}
	.mh-range {
		display: grid;
		gap: 4px;
		font-size: 13px;
		margin-bottom: 6px;
	}
	.mh-range input {
		width: 100%;
		min-height: 32px;
		accent-color: #ff6a1a;
	}
	.mh-check {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 44px;
		font-size: 13px;
		cursor: pointer;
	}
	.mh-check input {
		width: 20px;
		height: 20px;
		accent-color: #ff6a1a;
		flex: none;
	}
	.mh-speed {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin: 4px 0 6px;
		font-size: 13px;
	}
	.mh-speed-l small {
		display: block;
		font-size: 11px;
		opacity: 0.65;
	}
	.mh-speed-b {
		display: flex;
		border: 1px solid rgba(255, 106, 26, 0.6);
		border-radius: 8px;
		overflow: hidden;
	}
	.mh-speed-b button {
		min-width: 64px;
		min-height: 44px;
		padding: 0 12px;
		font-size: 13px;
		font-weight: 700;
		color: inherit;
		background: transparent;
	}
	.mh-speed-b button + button {
		border-left: 1px solid rgba(255, 106, 26, 0.35);
	}
	.mh-speed-b button.on {
		background: #ff6a1a;
		color: #160a02;
	}
	.mh-check small {
		display: block;
		font-size: 11px;
		opacity: 0.65;
	}
	.mh-cover.settings {
		justify-content: flex-start;
		overflow-y: auto;
		background: rgba(5, 7, 5, 0.92);
	}
	.mh-pause-set {
		display: grid;
		gap: 10px;
		justify-items: center;
		width: min(100%, 900px);
		margin: auto;
	}
	/* phones: the menu stage (operator + level + Play) needs more height than a 16:9 strip */
	@media (max-width: 639px) {
		.mh:not(.immersive) .mh-stage {
			aspect-ratio: 9 / 10;
		}
	}
	@media (max-width: 519px) {
		.mh-bind {
			grid-template-columns: minmax(0, 1fr) 84px 84px;
			font-size: 12px;
		}
	}

	/* ---------- Abscars Madness (2026-11-23): full screen game, levels, skill tree ---------- */
	.mh {
		min-height: 100%;
		border-radius: 0;
		border: 0;
		position: relative;
	}
	.mh-head {
		max-width: 1100px;
		margin-inline: auto;
	}
	.mh-close {
		min-height: 44px;
		padding: 0 14px;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: rgba(0, 0, 0, 0.5);
		color: #fff;
		font-weight: 800;
		margin-left: auto;
	}
	.mh-close:hover {
		border-color: var(--mh-red);
	}
	.mh-shell {
		max-width: 1100px;
		margin-inline: auto;
	}
	/* while playing: only the game, as big as the screen allows */
	.mh.immersive {
		padding: 0;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #000;
	}
	.mh.immersive .mh-head {
		display: none;
	}
	.mh.immersive .mh-shell {
		max-width: none;
		width: min(100%, calc(100dvh * 16 / 9));
	}
	.mh.immersive .mh-stage {
		border-radius: 0;
	}
	.mh-logo b {
		color: #ff6a1a;
		text-shadow:
			0 0 18px rgba(255, 106, 26, 0.6),
			3px 3px 0 #2a0a08 !important;
	}
	.mh-inv {
		display: flex;
		gap: 4px;
		align-items: center;
		min-height: 12px;
	}
	.mh-key {
		width: 16px;
		height: 11px;
		border-radius: 2px;
		box-shadow: 0 0 6px currentColor;
		border: 1px solid rgba(0, 0, 0, 0.6);
	}
	.mh-nades,
	.mh-knives {
		font-size: 11px;
		font-weight: 700;
	}
	.mh-hint {
		position: absolute;
		left: 50%;
		bottom: 14%;
		transform: translateX(-50%);
		max-width: min(90%, 520px);
		padding: 6px 12px;
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.65);
		border: 1px solid rgba(255, 210, 59, 0.5);
		color: #ffe69a;
		font-size: 13px;
		text-align: center;
		pointer-events: none;
	}
	.mh-respawn {
		position: absolute;
		inset: 40% 0 auto;
		text-align: center;
		font-size: clamp(18px, 4vw, 34px);
		font-weight: 900;
		color: var(--mh-red);
		text-shadow: 0 0 18px rgba(255, 59, 47, 0.6), 0 2px 0 #000;
		pointer-events: none;
	}
	.mh-cover-k {
		font-size: 11px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		opacity: 0.75;
	}
	.mh-cover-t.lime {
		color: var(--mh-lime);
		text-shadow: 0 0 22px rgba(157, 255, 46, 0.5);
	}
	.mh-stats dd.ok {
		color: var(--mh-lime);
	}
	.mh-stats small {
		color: #ffd23a;
	}
	.mh-menu {
		flex-direction: row;
		gap: clamp(10px, 4vw, 40px);
	}
	.mh-menu-info {
		display: grid;
		justify-items: start;
		gap: 8px;
		text-align: left;
		max-width: 420px;
	}
	.mh-menu-name {
		font-size: clamp(24px, 4.4vw, 44px);
		font-weight: 900;
		line-height: 1;
		color: #fff;
		text-shadow: 0 0 20px rgba(255, 106, 26, 0.5), 3px 3px 0 #2a0a08;
	}
	.mh-tabs {
		display: flex;
		gap: 6px;
		max-width: 1100px;
		margin: 12px auto 0;
		flex-wrap: wrap;
	}
	.mh-tab {
		min-height: 44px;
		padding: 0 16px;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.05);
		color: inherit;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		font-size: 13px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.mh-tab[aria-selected='true'] {
		border-color: #ff6a1a;
		background: rgba(255, 106, 26, 0.16);
		box-shadow: 0 0 12px rgba(255, 106, 26, 0.35);
	}
	.mh-pill {
		min-width: 20px;
		padding: 1px 6px;
		border-radius: 99px;
		background: #ffd23a;
		color: #2a1600;
		font-size: 11px;
	}
	.mh-levels {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 8px;
		max-width: 1100px;
		margin: 10px auto 0;
	}
	.mh-level {
		position: relative;
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 2px 8px;
		min-height: 44px;
		padding: 10px;
		text-align: left;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.2));
		color: inherit;
	}
	.mh-level[data-theme-l='office'] {
		border-left: 4px solid #6a8aa0;
	}
	.mh-level[data-theme-l='diner'] {
		border-left: 4px solid #e0302a;
	}
	.mh-level[data-theme-l='warehouse'] {
		border-left: 4px solid #c48a3a;
	}
	.mh-level[data-theme-l='tower'] {
		border-left: 4px solid #3b8bff;
	}
	.mh-level[data-theme-l='depths'] {
		border-left: 4px solid #4ad62a;
	}
	.mh-chapter {
		grid-column: 1 / -1;
		margin-top: 8px;
		padding: 6px 2px 2px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.15);
	}
	.mh-chapter:first-child {
		margin-top: 0;
	}
	.mh-chapter h3 {
		margin: 0;
		font-size: 15px;
		font-weight: 900;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #ffb27a;
	}
	.mh-chapter[data-ch='2'] h3 {
		background: linear-gradient(90deg, #6ab8ff, #8aff6a);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	.mh-chapter p {
		margin: 2px 0 4px;
		font-size: 12px;
		opacity: 0.75;
	}
	.mh-level[aria-pressed='true'] {
		border-color: #ff6a1a;
		box-shadow: 0 0 14px rgba(255, 106, 26, 0.4);
		background: linear-gradient(135deg, rgba(255, 106, 26, 0.18), rgba(0, 0, 0, 0.2));
	}
	.mh-level:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.mh-lv-no {
		grid-row: span 3;
		font-size: 22px;
		font-weight: 900;
		color: rgba(255, 255, 255, 0.5);
		min-width: 26px;
		text-align: center;
	}
	.mh-lv-name {
		font-weight: 800;
		font-size: 15px;
	}
	.mh-lv-hint {
		font-size: 11px;
		line-height: 1.3;
		opacity: 0.75;
	}
	.mh-lv-stars {
		display: flex;
		gap: 3px;
		align-items: center;
		font-size: 13px;
	}
	.mh-lv-stars i {
		font-style: normal;
		color: rgba(255, 255, 255, 0.2);
	}
	.mh-lv-stars i.on {
		color: #ffd23a;
		text-shadow: 0 0 6px rgba(255, 210, 58, 0.6);
	}
	.mh-lv-stars em {
		font-style: normal;
		font-size: 11px;
		opacity: 0.7;
		margin-left: 6px;
	}
	.mh-lv-lock {
		position: absolute;
		top: 8px;
		right: 10px;
	}
	.mh-levels + .mh-note,
	.mh-skillhead,
	.mh-tree,
	.mh-setup {
		max-width: 1100px;
		margin-inline: auto;
	}
	.mh-skillhead {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		margin-top: 10px;
		font-size: 13px;
	}
	.mh-skillhead b {
		font-size: 22px;
		color: #ffd23a;
	}
	.mh-btn.sm {
		min-height: 44px;
		padding: 0 12px;
		font-size: 12px;
	}
	.mh-tree {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 10px;
		margin-top: 8px;
	}
	@media (min-width: 760px) {
		.mh-tree {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	.mh-branch {
		display: grid;
		gap: 0;
		padding: 10px;
		border-radius: 12px;
		border: 1px solid color-mix(in srgb, var(--bc) 40%, transparent);
		background: linear-gradient(180deg, color-mix(in srgb, var(--bc) 12%, transparent), rgba(0, 0, 0, 0.3));
	}
	.mh-branch .mh-h3 {
		color: var(--bc);
	}
	.mh-skill {
		position: relative;
		display: grid;
		gap: 3px;
		min-height: 44px;
		padding: 9px 10px;
		text-align: left;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(0, 0, 0, 0.35);
		color: inherit;
		margin-bottom: 14px;
	}
	.mh-skill:not(:last-child)::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: -15px;
		width: 2px;
		height: 14px;
		background: color-mix(in srgb, var(--bc) 50%, transparent);
	}
	.mh-skill:last-child {
		margin-bottom: 0;
	}
	.mh-skill[data-state='owned'] {
		border-color: var(--bc);
		background: color-mix(in srgb, var(--bc) 18%, rgba(0, 0, 0, 0.4));
		box-shadow: 0 0 12px color-mix(in srgb, var(--bc) 40%, transparent);
	}
	.mh-skill[data-state='ok'] {
		border-color: #ffd23a;
		cursor: pointer;
	}
	.mh-skill[data-state='ok']:hover {
		background: rgba(255, 210, 58, 0.12);
	}
	.mh-skill[data-state='locked'],
	.mh-skill[data-state='poor'] {
		opacity: 0.6;
	}
	.mh-skill:disabled {
		cursor: default;
	}
	.mh-sk-name {
		font-weight: 800;
		font-size: 14px;
	}
	.mh-sk-what {
		font-size: 11.5px;
		line-height: 1.35;
		opacity: 0.85;
	}
	.mh-sk-key kbd {
		font-size: 10px;
	}
	.mh-sk-cost {
		font-size: 11px;
		font-weight: 800;
		color: #ffd23a;
	}
	.mh-skill[data-state='owned'] .mh-sk-cost {
		color: var(--bc);
	}
	.mh-holk {
		height: 14px !important;
	}
	.mh-holk span {
		display: block;
		font-size: 9px !important;
		line-height: 12px !important;
		white-space: nowrap;
	}
	@media (pointer: coarse) {
		.mh-hint {
			bottom: auto;
			top: 24%;
		}
	}
	/* a phone held upright: the game is a thin strip, so ask to turn it */
	@media (orientation: portrait) and (pointer: coarse) {
		.mh.immersive::before {
			content: '↻ Turn your phone sideways for a bigger game';
			position: absolute;
			top: 16px;
			left: 50%;
			transform: translateX(-50%);
			white-space: nowrap;
			padding: 8px 14px;
			border-radius: 99px;
			background: rgba(255, 106, 26, 0.18);
			border: 1px solid #ff6a1a;
			color: #ffd9a8;
			font-size: 13px;
			font-weight: 700;
		}
	}
	@media (max-width: 639px) {
		.mh-menu {
			flex-direction: column;
		}
		.mh-menu-info {
			justify-items: center;
			text-align: center;
		}
		.mh-close span {
			display: none;
		}
		.mh-hint {
			font-size: 11px;
		}
	}
</style>
