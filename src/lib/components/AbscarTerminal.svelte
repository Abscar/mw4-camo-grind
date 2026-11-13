<!--
	The secret Abscar OS terminal (2026-11-11, the user's pick from a brainstorm: "a secret key combo
	opens a red terminal where you can type commands like status, nuke, holk, phillestar … with fun
	answers"). Abscar theme only. Opens when you type "abscar" (or press § / `, the classic console key)
	anywhere outside a text field, or tap the red HUD box in the header 5 times (phones). Commands read
	your real progress (status, next, weapon, season, buddy); the rest is just for fun and changes
	nothing. A modal dialog: Esc, "exit" or the × closes it and focus goes back where it was.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { growth, GROWTH_STAGES } from '#lib/buddyGrowth.ts';
	import { DIVERGENCE_REQUIRED, LADDER, MASTERY_TRACKS, MAX_LEVEL } from '#lib/data/camos.ts';
	import { SEASON, seasonView, today } from '#lib/data/season.ts';
	import { CLASSES, WEAPONS } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { roadToDivergence } from '#lib/road.ts';
	import { activeSteps, isReleased, stepStatus, stepsOf } from '#lib/steps.ts';
	import { shortDate } from '#lib/ui.ts';

	type Kind = 'in' | 'out' | 'sys' | 'err' | 'big';
	let open = $state(false);
	let lines = $state<{ id: number; kind: Kind; text: string }[]>([]);
	let input = $state('');
	let busy = $state(false);
	let flash = $state(false);
	let inputEl = $state<HTMLInputElement>();
	let logEl = $state<HTMLElement>();
	let dialogEl = $state<HTMLElement>();
	let returnFocus: HTMLElement | null = null;
	let nextId = 0;
	const history: string[] = [];
	let historyAt = 0;
	const timers = new Set<ReturnType<typeof setTimeout>>();

	const COMMANDS = ['help', 'status', 'next', 'weapon', 'season', 'buddy', 'whoami', 'squad', 'phillestar', 'lars', 'jeeven', 'nuke', 'hack', 'holk', 'clear', 'exit'];
	const QUICK = ['status', 'next', 'buddy', 'nuke', 'holk', 'help'];

	const abscar = () => document.documentElement.getAttribute('data-theme') === 'blackout';
	const inField = (el: EventTarget | null) =>
		el instanceof Element && el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]') !== null;

	function later(ms: number, fn: () => void) {
		const id = setTimeout(() => {
			timers.delete(id);
			fn();
		}, ms);
		timers.add(id);
	}

	function print(kind: Kind, ...texts: string[]) {
		lines = [...lines, ...texts.map((text) => ({ id: nextId++, kind, text }))].slice(-200);
		void tick().then(() => logEl?.scrollTo({ top: logEl.scrollHeight }));
	}

	async function show() {
		if (open) return;
		returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		open = true;
		if (lines.length === 0) print('sys', ...t.terminal.boot);
		await tick();
		inputEl?.focus();
	}

	function hide() {
		open = false;
		returnFocus?.focus();
	}

	// the secret ways in
	$effect(() => {
		let typed = '';
		let taps: number[] = [];
		const onKey = (e: KeyboardEvent) => {
			if (open || e.ctrlKey || e.metaKey || e.altKey || !abscar() || inField(e.target)) return;
			if (e.key === '§' || e.key === '`') {
				e.preventDefault();
				void show();
				return;
			}
			if (e.key.length !== 1) return;
			typed = (typed + e.key.toLowerCase()).slice(-6);
			if (typed === 'abscar') {
				e.preventDefault(); // or the last "r" lands in the terminal's input once it has focus
				typed = '';
				void show();
			}
		};
		const onClick = (e: MouseEvent) => {
			if (open || !abscar() || !(e.target instanceof Element) || !e.target.closest('.hud-readout')) return;
			const now = Date.now();
			taps = [...taps.filter((x) => now - x < 3000), now];
			if (taps.length >= 5) {
				taps = [];
				void show();
			}
		};
		addEventListener('keydown', onKey);
		addEventListener('click', onClick);
		return () => {
			removeEventListener('keydown', onKey);
			removeEventListener('click', onClick);
			for (const id of timers) clearTimeout(id);
			timers.clear();
		};
	});

	// ----- what the commands say -----

	const className = (id: string) => CLASSES.find((c) => c.id === id)?.name ?? '';

	function stepText(weaponId: string): string {
		const steps = activeSteps(weaponId, progress.level(weaponId), progress.specials[weaponId] ?? 0);
		const s = steps[0];
		if (!s) return '';
		return s.kind === 'ladder' ? `${s.name}: ${s.fact.text}` : `${s.name} (before Gold): ${s.fact.text}`;
	}

	function buddyNow() {
		const steps = WEAPONS.reduce((n, w) => n + Math.min(MAX_LEVEL, progress.level(w.id)), 0);
		const mastery = MASTERY_TRACKS.reduce((n, tr) => n + progress.masteryByMode[tr.mode].filter((s) => s === 'complete').length, 0);
		return growth(steps, WEAPONS.length * MAX_LEVEL, DIVERGENCE_REQUIRED - progress.divergenceCount, mastery);
	}

	function status() {
		const row = t.terminal.statusRow;
		const g = buddyNow();
		print(
			'out',
			...LADDER.map((camo, i) => row(camo.name.toUpperCase(), `${progress.ladderCounts[i]}/${WEAPONS.length}`)),
			row(
				'DIVERGENCE',
				`${Math.min(progress.divergenceCount, DIVERGENCE_REQUIRED)}/${DIVERGENCE_REQUIRED} ${t.terminal.divergenceLeft(DIVERGENCE_REQUIRED - progress.divergenceCount)}`
			),
			row('WEED BUDDY', t.terminal.buddyValue(t.buddy.stages[g.name], g.stage + 1, GROWTH_STAGES.length))
		);
	}

	function next() {
		const road = roadToDivergence({ weapons: progress.weapons, specials: progress.specials, counts: progress.counts, focus: progress.prefs.focus });
		if (road.toGo > 0) print('out', t.terminal.nextMilestone(t.kpi.nextDivergence(road.toGo)));
		const rows = road.rows.slice(0, 3);
		if (rows.length === 0) return print('out', t.terminal.nextNone);
		print('out', t.terminal.nextRoad, ...rows.map((r, i) => t.terminal.nextRow(i + 1, WEAPONS.find((w) => w.id === r.weaponId)?.name ?? r.weaponId, stepText(r.weaponId))));
	}

	function weapon(query: string) {
		const q = query.toLowerCase().replace(/[^a-z0-9]/g, '');
		if (!q) return print('err', t.terminal.weaponUsage);
		const w =
			WEAPONS.find((x) => x.name.toLowerCase().replace(/[^a-z0-9]/g, '') === q) ??
			WEAPONS.find((x) => x.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(q));
		if (!w) return print('err', t.terminal.weaponNotFound(query));
		const level = progress.level(w.id);
		const mask = progress.specials[w.id] ?? 0;
		const marks = stepsOf(w.id)
			.map((s) => `${s.kind === 'special' ? `#${s.index + 1}` : LADDER[s.index].short} ${stepStatus(w.id, s, level, mask) === 'done' ? '✔' : '·'}`)
			.join('  ');
		print('out', t.terminal.weaponLine(w.name.toUpperCase(), className(w.classId)));
		if (!isReleased(w)) return print('out', t.terminal.weaponNotOut);
		print('out', t.terminal.weaponSteps(marks), level >= MAX_LEVEL ? t.terminal.weaponMaxed : t.terminal.weaponNext(stepText(w.id)));
	}

	function season() {
		const v = seasonView(today(new Date()));
		print('out', t.terminal.seasonLine(SEASON.name, v.day, v.length), t.terminal.seasonEnds(shortDate(SEASON.end), v.daysLeft));
	}

	function buddy() {
		const g = buddyNow();
		const n = g.next;
		const nextText = !n ? t.buddy.top : n.kind === 'steps' ? t.buddy.toSteps(n.left) : n.kind === 'divergence' ? t.buddy.toDivergence(n.left) : t.buddy.toMastery;
		print('out', t.terminal.buddyLine(t.buddy.stages[g.name], g.stage + 1, GROWTH_STAGES.length, nextText));
	}

	function nuke() {
		busy = true;
		print('big', ...t.terminal.nuke);
		[3, 2, 1].forEach((n, i) => later(650 * (i + 1), () => print('err', t.terminal.nukeCount(n))));
		later(650 * 4, () => (flash = true));
		later(650 * 4 + 1000, () => {
			flash = false;
			print('out', ...t.terminal.nukeAfter);
			busy = false;
			void tick().then(() => inputEl?.focus());
		});
	}

	function hack() {
		busy = true;
		const hex = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')).join(' ');
		for (let i = 0; i < 14; i++) later(70 * i, () => print('sys', `0x${(0x4a00 + i * 16).toString(16)}  ${hex()}`));
		later(70 * 14 + 200, () => {
			print('big', t.terminal.hackDone[0]);
			print('out', ...t.terminal.hackDone.slice(1));
			busy = false;
			void tick().then(() => inputEl?.focus());
		});
	}

	function run(raw: string) {
		const text = raw.trim();
		print('in', text);
		if (!text) return;
		if (history[history.length - 1] !== text) history.push(text);
		historyAt = history.length;
		const [word, ...rest] = text.split(/\s+/);
		const arg = rest.join(' ');
		switch (word.toLowerCase()) {
			case 'help':
			case '?':
				return print('out', ...t.terminal.help);
			case 'status':
				return status();
			case 'next':
				return next();
			case 'weapon':
			case 'gun':
				return weapon(arg);
			case 'season':
				return season();
			case 'buddy':
				return buddy();
			case 'whoami':
				return print('out', ...t.terminal.whoami);
			case 'squad':
			case 'phillestar':
			case 'lars':
			case 'drängen':
			case 'drangen':
			case 'jeeven':
				return print('out', ...t.terminal.squad);
			case 'nuke':
				return nuke();
			case 'hack':
				return hack();
			case 'holk':
			case 'smoke':
				return print('out', ...t.terminal.holk);
			case '420':
				return print('out', t.terminal.blaze);
			case 'gg':
				return print('out', t.terminal.gg);
			case 'sudo':
				return print('err', t.terminal.sudo);
			case 'rm':
				return print('err', t.terminal.rm);
			case 'date':
			case 'time':
				return print('out', t.terminal.date(new Date().toLocaleString('en-GB')));
			case 'clear':
			case 'cls':
				lines = [];
				return;
			case 'exit':
			case 'quit':
			case 'q':
				return hide();
			default:
				return print('err', t.terminal.notFound(word));
		}
	}

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (busy) return;
		run(input);
		input = '';
	}

	function quick(cmd: string) {
		if (busy) return;
		run(cmd);
		inputEl?.focus();
	}

	function onInputKey(e: KeyboardEvent) {
		if (e.key === 'ArrowUp' && history.length > 0) {
			e.preventDefault();
			historyAt = Math.max(0, historyAt - 1);
			input = history[historyAt] ?? '';
		} else if (e.key === 'ArrowDown' && history.length > 0) {
			e.preventDefault();
			historyAt = Math.min(history.length, historyAt + 1);
			input = history[historyAt] ?? '';
		} else if (e.key === 'Tab' && input.trim() !== '' && !input.includes(' ')) {
			const hits = COMMANDS.filter((c) => c.startsWith(input.trim().toLowerCase()));
			if (hits.length === 1) {
				e.preventDefault();
				input = hits[0] + (hits[0] === 'weapon' ? ' ' : '');
			}
		}
	}

	/** Esc closes; Tab stays inside the terminal. */
	function onDialogKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			hide();
		} else if (e.key === 'Tab' && !e.defaultPrevented && dialogEl) {
			const items = [...dialogEl.querySelectorAll<HTMLElement>('button, input')].filter((el) => !el.hasAttribute('disabled'));
			const first = items[0];
			const last = items[items.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last?.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first?.focus();
			}
		}
	}
</script>

{#if open}
	<div class="term-backdrop" role="presentation" onclick={(e) => e.target === e.currentTarget && hide()}>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			bind:this={dialogEl}
			class="term"
			role="dialog"
			aria-modal="true"
			aria-label={t.terminal.label}
			tabindex="-1"
			onkeydown={onDialogKey}
		>
			<div class="term-bar">
				<span class="term-dot" aria-hidden="true"></span>
				<span class="term-title">{t.terminal.title}</span>
				<button type="button" class="term-close" aria-label={t.terminal.close} onclick={hide}>
					<svg viewBox="0 0 16 16" class="size-4" aria-hidden="true"><path d="M3.5 3.5l9 9m0-9-9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
				</button>
			</div>
			<div bind:this={logEl} class="term-log" role="log" aria-live="polite">
				{#each lines as line (line.id)}
					<p class="ln ln-{line.kind}">{#if line.kind === 'in'}<span class="term-prompt" aria-hidden="true">abscar@os:~$&nbsp;</span>{/if}{line.text}</p>
				{/each}
			</div>
			<div class="term-quick" role="group" aria-label={t.terminal.quick}>
				{#each QUICK as cmd (cmd)}
					<button type="button" disabled={busy} onclick={() => quick(cmd)}>{cmd}</button>
				{/each}
			</div>
			<form class="term-input" onsubmit={submit}>
				<span class="term-prompt" aria-hidden="true">abscar@os:~$</span>
				<input
					bind:this={inputEl}
					bind:value={input}
					onkeydown={onInputKey}
					aria-label={t.terminal.input}
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
					enterkeyhint="send"
				/>
			</form>
			{#if flash}<div class="term-flash" aria-hidden="true"></div>{/if}
		</div>
	</div>
{/if}

<style>
	.term-backdrop {
		position: fixed;
		inset: 0;
		z-index: 95;
		display: grid;
		place-items: center;
		padding: 16px;
		background: rgb(0 0 0 / 0.62);
		backdrop-filter: blur(2px);
	}
	.term {
		position: relative;
		display: flex;
		flex-direction: column;
		width: min(720px, 100%);
		height: min(540px, calc(100dvh - 32px));
		overflow: hidden;
		border: 1.5px solid #ff4418;
		border-radius: 10px;
		background:
			repeating-linear-gradient(0deg, rgb(255 40 20 / 0.05) 0 1px, transparent 1px 3px),
			radial-gradient(ellipse at 50% 40%, #1d0605, #070202 75%);
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.6),
			0 0 28px rgb(255 50 20 / 0.45),
			inset 0 0 40px rgb(255 30 10 / 0.12);
		color: #ff5a44;
		font-family: var(--font-hud);
		font-size: 13.5px;
		line-height: 1.5;
		text-shadow: 0 0 6px rgb(255 60 30 / 0.55);
		animation: term-in 0.22s ease-out both;
	}
	.term:focus {
		outline: none;
	}
	.term-bar {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 4px 0 14px;
		border-bottom: 1px solid rgb(255 68 24 / 0.45);
		background: rgb(255 40 20 / 0.08);
	}
	.term-dot {
		width: 9px;
		height: 9px;
		border-radius: 999px;
		background: #ff3a1a;
		box-shadow: 0 0 8px #ff3a1a;
		animation: term-blink 1.6s steps(2) infinite;
	}
	.term-title {
		flex: 1;
		font-size: 11.5px;
		letter-spacing: 0.22em;
	}
	.term-close {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 0;
		border-radius: 8px;
		background: none;
		color: #ff8a70;
		cursor: pointer;
	}
	.term-close:hover {
		background: rgb(255 60 30 / 0.15);
	}
	.term-log {
		flex: 1;
		overflow-y: auto;
		padding: 12px 14px 6px;
		overscroll-behavior: contain;
	}
	.ln {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.ln-in {
		color: #ffd2c8;
	}
	.ln-sys {
		color: #c4483a;
	}
	.ln-err {
		color: #ffb000;
		text-shadow: 0 0 6px rgb(255 170 0 / 0.5);
	}
	.ln-big {
		color: #fff;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-shadow:
			0 0 6px #ff3a1a,
			0 0 18px #ff3a1a;
		animation: term-blink 0.5s steps(2) 4;
	}
	.term-prompt {
		color: #ff7a5a;
	}
	.term-quick {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 6px 12px;
		border-top: 1px dashed rgb(255 68 24 / 0.3);
	}
	.term-quick button {
		min-height: 44px;
		padding: 0 10px;
		border: 1px solid rgb(255 68 24 / 0.55);
		border-radius: 999px;
		background: rgb(255 40 20 / 0.08);
		color: #ffb4a4;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	.term-quick button:hover:not(:disabled) {
		background: rgb(255 40 20 / 0.2);
	}
	.term-quick button:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.term-input {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 14px;
		min-height: 48px;
		border-top: 1px solid rgb(255 68 24 / 0.45);
		background: rgb(0 0 0 / 0.35);
	}
	.term-input input {
		flex: 1;
		min-width: 0;
		min-height: 44px;
		border: 0;
		background: none;
		color: #ffe1d9;
		font: inherit;
		font-size: 16px; /* 16 px: phones don't zoom in on focus */
		caret-color: #ff3a1a;
		outline: none;
	}
	.term-flash {
		position: absolute;
		inset: 0;
		background: #fff;
		animation: term-flash 1s ease-out both;
		pointer-events: none;
	}
	@keyframes term-in {
		from {
			opacity: 0;
			transform: scale(0.97);
		}
	}
	@keyframes term-blink {
		50% {
			opacity: 0.35;
		}
	}
	@keyframes term-flash {
		0% {
			opacity: 0;
		}
		12% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.term-flash {
			display: none;
		}
	}
</style>
