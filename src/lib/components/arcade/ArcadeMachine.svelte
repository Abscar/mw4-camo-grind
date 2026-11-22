<!--
	The big arcade machine a BurgiArcade game is played on (2026-11-22): the game's lit sign on top (GameLogo),
	then the screen: the attract screen (the hero picture, INSERT COIN, Play / Daily challenge, your best and
	the squad's top), a 3-2-1-GO count, the game itself (components/arcade/games/, arcade/game.ts), and the
	result (the score counting up, NEW BEST / SQUAD RECORD, the tickets won and what for, your place). Beside
	it on wide screens (under it on phones) the game's high scores (ArcadeHall). A play is booked with
	squad.recordArcade (on this device too outside a squad). In a Quickscope duel the seed is the duel's and the
	rounds go to squad.finishDuel.
-->
<script module lang="ts">
	export interface DuelPlay {
		id: string;
		seed: number;
		/** the other player's member id and name */
		other: string;
		name: string;
		/** taking up their challenge (not yet in your own list): when they made it */
		accept?: number;
	}
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { dailySeed, dayKey, hallOf, TICKETS_DAILY, TICKETS_PB, TICKETS_RECORD, type Board, type PlayResult } from '#lib/arcade.ts';
	import type { ArcadeDetail, ArcadeGame } from '#lib/arcade/game.ts';
	import { freshSeed } from '#lib/arcade/rng.ts';
	import { GAME_LOOKS } from '#lib/arcade/looks.ts';
	import { GAME_ART, GAME_VIEWS } from './registry.ts';
	import { GAME_WORDS } from '#lib/i18n/arcade/index.ts';
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import GameLogo from './GameLogo.svelte';
	import ArcadeHall from './ArcadeHall.svelte';

	let { game, duel = null, onclose }: { game: ArcadeGame; duel?: DuelPlay | null; onclose: () => void } = $props();
	const a = t.arcade;
	const W = $derived(GAME_WORDS[game]);
	const L = $derived(GAME_LOOKS[game]);
	const View = $derived(GAME_VIEWS[game]);
	const Art = $derived(GAME_ART[game]);

	type Phase = 'attract' | 'count' | 'play' | 'result';
	let phase = $state<Phase>('attract');
	let seed = $state(0);
	let daily = $state(false);
	let run = $state(0);
	let count = $state(3);
	let board = $state<Board>('all');
	let result = $state<(PlayResult & { score: number; place: number; of: number; detail?: ArcadeDetail }) | null>(null);
	let shown = $state(0);
	let againBtn = $state<HTMLButtonElement>();
	let screenEl = $state<HTMLElement>();
	const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	const me = $derived(squad.me?.id ?? null);
	const members = $derived(squad.on ? squad.arcadeMembers : me ? {} : { local: { name: a.hall.you, arcade: squad.arcade } });
	const hallMe = $derived(squad.on ? me : 'local');
	const now = $derived(squad.on ? squad.now : Date.now());
	const mine = $derived(squad.arcade?.g[game]);
	const today = $derived(dayKey(Date.now()));
	const todayBest = $derived(mine?.d?.k === today ? mine.d.s : 0);
	const topRow = $derived(squad.on ? hallOf(squad.arcadeMembers, game, 'all', now)[0] : undefined);

	let timers: ReturnType<typeof setTimeout>[] = [];
	const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));
	$effect(() => () => timers.forEach(clearTimeout));

	function start(isDaily: boolean) {
		daily = !duel && isDaily;
		seed = duel ? duel.seed : daily ? dailySeed(game, dayKey(Date.now())) : freshSeed();
		if (duel?.accept) squad.acceptDuel(duel.id, duel.other, duel.seed, duel.accept);
		result = null;
		screenEl?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
		if (reduce) {
			go();
			return;
		}
		phase = 'count';
		count = 3;
		later(() => (count = 2), 650);
		later(() => (count = 1), 1300);
		later(() => (count = 0), 1950);
		later(go, 2450);
	}
	function go() {
		run++;
		phase = 'play';
	}
	function quit() {
		phase = 'attract';
	}

	async function end(score: number, detail?: ArcadeDetail) {
		if (phase !== 'play') return;
		const r = squad.recordArcade(game, score, daily);
		if (duel && detail?.rounds?.length === 5) squad.finishDuel(duel.id, detail.rounds);
		const rows = squad.on ? hallOf(squad.arcadeMembers, game, 'all', squad.now) : [];
		const place = rows.findIndex((x) => x.id === me) + 1;
		result = { ...r, score: Math.floor(score), place, of: rows.length, detail };
		phase = 'result';
		countUp(Math.floor(score));
		await tick();
		againBtn?.focus({ preventScroll: true });
	}

	function countUp(to: number) {
		if (reduce || to <= 0) {
			shown = to;
			return;
		}
		const t0 = performance.now();
		const step = (now: number) => {
			const k = Math.min(1, (now - t0) / 900);
			shown = Math.round(to * (1 - (1 - k) ** 3));
			if (k < 1 && phase === 'result') requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	}
</script>

<section class="am" style:--c1={L.c1} style:--c2={L.c2} style:--glow={L.glow} aria-labelledby="am-h">
	<h3 id="am-h" class="sr-only">{duel ? a.duel.playing(duel.name) : W.name}</h3>
	<div class="am-top">
		<button type="button" class="am-back font-head" onclick={onclose}><span aria-hidden="true">‹</span> {a.close}</button>
		{#if phase === 'play'}<button type="button" class="am-quit font-head" onclick={quit}>{a.quit}</button>{/if}
	</div>
	<div class="am-marquee"><GameLogo {game} /></div>

	<div class="am-body">
		<div class="am-screen-wrap" bind:this={screenEl}>
			{#if phase === 'play'}
				<div class="am-play">
					{#key run}<View {seed} onend={end} />{/key}
				</div>
			{:else}
				<div class="am-screen">
					<span class="am-scan" aria-hidden="true"></span>
					{#if phase === 'attract'}
						<div class="am-attract">
							<span class="am-hero" aria-hidden="true"><Art size={120} /></span>
							{#if duel}<p class="am-duel font-head">🎯 {a.duel.playing(duel.name)}</p>{/if}
							<p class="am-tag">{W.tagline}</p>
							<p class="am-coin font-head" aria-hidden="true">{a.insertCoin}</p>
							<div class="am-btns">
								<button type="button" class="am-play-btn font-head" onclick={() => start(false)}>{a.play}</button>
								{#if !duel}<button type="button" class="am-daily-btn font-head" title={a.dailyHint} onclick={() => start(true)}>📅 {a.daily}</button>{/if}
							</div>
							<p class="am-meta">
								{#if mine}{a.yourBest(mine.b)}{:else}{a.noBest}{/if}{#if todayBest}{' · '}{a.dailyDone(todayBest)}{/if}{#if topRow}{' · '}{a.topIs(squad.arcadeMembers[topRow.id]?.name ?? '?', topRow.score)}{/if}
							</p>
						</div>
					{:else if phase === 'count'}
						<div class="am-count" aria-live="assertive">
							{#key count}<span class="am-count-n font-head">{count > 0 ? count : a.go}</span>{/key}
							<span class="am-count-sub font-head">{a.ready}</span>
						</div>
					{:else if phase === 'result' && result}
						<div class="am-result" aria-live="polite">
							<p class="am-over font-head">{a.result.heading}</p>
							<p class="am-score-l font-head">{a.result.score}</p>
							<p class="am-score num">{shown.toLocaleString('en-US')}</p>
							{#if result.record}<p class="am-banner rec font-head">👑 {a.result.record}</p>{:else if result.pb}<p class="am-banner pb font-head">⭐ {a.result.newBest}</p>{:else}<p class="am-prev">{a.result.prev(result.prev)}</p>{/if}
							<p class="am-tickets font-head">{a.result.won(result.tickets)}</p>
							<ul class="am-parts">
								<li>{a.result.parts.base} <b>+{result.parts.base}</b></li>
								{#if result.parts.pb}<li>{a.result.parts.pb} <b>+{TICKETS_PB}</b></li>{/if}
								{#if result.parts.record}<li>{a.result.parts.record} <b>+{TICKETS_RECORD}</b></li>{/if}
								{#if result.parts.daily}<li>{a.result.parts.daily} <b>+{TICKETS_DAILY}</b></li>{/if}
							</ul>
							{#if result.place}<p class="am-place">{a.result.place(result.place, result.of)}</p>{/if}
							{#if duel}<p class="am-place">{a.duel.done}</p>{/if}
							<div class="am-btns">
								{#if !duel}
									<button type="button" class="am-play-btn font-head" bind:this={againBtn} onclick={() => start(daily)}>{daily ? a.result.dailyAgain : a.result.again}</button>
								{:else}
									<button type="button" class="am-play-btn font-head" bind:this={againBtn} onclick={onclose}>{a.close}</button>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="am-side">
			<ArcadeHall {game} {members} me={hallMe} {now} bind:board flash={phase === 'result' ? hallMe : null} />
			<div class="am-how">
				<p class="am-how-h font-head">{a.howHeading}</p>
				<p>{W.how}</p>
				<p class="am-controls">🎮 {W.controls}</p>
			</div>
		</div>
	</div>
</section>

<style>
	.am {
		display: grid;
		gap: 10px;
		padding: 12px;
		border-radius: 20px;
		border: 2px solid color-mix(in srgb, var(--glow) 60%, transparent);
		background:
			radial-gradient(120% 50% at 50% 0%, rgb(255 255 255 / 0.12), transparent 60%),
			repeating-linear-gradient(115deg, transparent 0 22px, rgb(255 255 255 / 0.04) 22px 28px),
			linear-gradient(180deg, var(--c1), var(--c2) 70%);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.2),
			0 0 30px color-mix(in srgb, var(--glow) 35%, transparent),
			0 10px 24px rgb(0 0 0 / 0.5);
		color: #fff6e6;
	}
	@media (min-width: 640px) {
		.am {
			padding: 16px 18px 18px;
		}
	}
	.am-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.am-back,
	.am-quit {
		min-height: 44px;
		padding: 0 14px;
		border-radius: 999px;
		border: 1.5px solid rgb(255 255 255 / 0.3);
		background: rgb(0 0 0 / 0.35);
		color: #fff6e6;
		font-size: 13px;
		font-weight: 800;
		letter-spacing: 0.04em;
	}
	.am-quit {
		border-color: rgb(255 120 120 / 0.6);
	}
	.am-back:hover,
	.am-quit:hover {
		border-color: #ffd23a;
	}
	.am-marquee {
		max-width: 520px;
		width: 100%;
		margin: -6px auto 0;
		padding: 6px 12px;
		border-radius: 14px;
		background:
			radial-gradient(80% 90% at 50% 50%, color-mix(in srgb, var(--glow) 35%, transparent), transparent 75%),
			linear-gradient(180deg, #1a0a1e, #070310);
		box-shadow:
			inset 0 0 0 2px rgb(0 0 0 / 0.6),
			inset 0 0 22px color-mix(in srgb, var(--glow) 50%, transparent),
			0 0 16px color-mix(in srgb, var(--glow) 40%, transparent);
	}
	.am-body {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 12px;
		align-items: start;
	}
	@media (min-width: 1024px) {
		.am-body {
			grid-template-columns: minmax(0, 1fr) 300px;
		}
	}
	.am-screen-wrap {
		min-width: 0;
		scroll-margin: 70px;
	}
	.am-play {
		padding: 8px;
		border-radius: 18px;
		background: #05030a;
		box-shadow:
			0 0 0 3px #07050c,
			0 0 0 5px rgb(255 255 255 / 0.08),
			inset 0 0 20px rgb(0 0 0 / 0.9);
	}
	/* the screen outside play: a CRT in the game's glow */
	.am-screen {
		position: relative;
		display: grid;
		place-items: center;
		width: min(100%, calc(min(72vh, 640px) * 4 / 3));
		aspect-ratio: 4 / 3;
		min-height: 300px;
		margin-inline: auto;
		overflow: hidden;
		border-radius: 18px / 22px;
		background:
			radial-gradient(70% 60% at 50% 40%, color-mix(in srgb, var(--glow) 32%, transparent), transparent 75%),
			radial-gradient(120% 120% at 50% 50%, #0c0816 40%, #000 100%);
		box-shadow:
			0 0 0 5px #07050c,
			0 0 0 7px rgb(255 255 255 / 0.1),
			inset 0 0 40px rgb(0 0 0 / 0.9);
		text-align: center;
	}
	.am-scan {
		position: absolute;
		inset: 0;
		background:
			repeating-linear-gradient(180deg, rgb(0 0 0 / 0.25) 0 1px, transparent 1px 3px),
			radial-gradient(80% 50% at 30% 8%, rgb(255 255 255 / 0.1), transparent 60%);
		pointer-events: none;
		z-index: 1;
	}
	.am-attract,
	.am-count,
	.am-result {
		position: relative;
		z-index: 2;
		display: grid;
		justify-items: center;
		gap: 8px;
		padding: 16px;
	}
	.am-hero {
		filter: drop-shadow(0 0 16px color-mix(in srgb, var(--glow) 70%, transparent));
		animation: am-bob 2.2s ease-in-out infinite;
	}
	@keyframes am-bob {
		0%,
		100% {
			transform: translateY(0) rotate(-4deg);
		}
		50% {
			transform: translateY(-8px) rotate(4deg);
		}
	}
	.am-duel {
		font-size: 15px;
		font-weight: 900;
		color: #ffd23a;
	}
	.am-tag {
		max-width: 30ch;
		font-size: 14px;
		color: #f1e6ff;
	}
	.am-coin {
		text-transform: uppercase;
		font-size: 13px;
		font-weight: 900;
		letter-spacing: 0.28em;
		color: #fffbe0;
		text-shadow: 0 0 8px var(--glow);
		animation: am-blink 1.1s steps(1) infinite;
	}
	@keyframes am-blink {
		50% {
			opacity: 0.12;
		}
	}
	.am-btns {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
	}
	/* chunky arcade buttons */
	.am-play-btn,
	.am-daily-btn {
		min-height: 48px;
		padding: 0 22px;
		border-radius: 999px;
		font-size: 16px;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		transition: transform 0.1s ease;
	}
	.am-play-btn {
		border: 3px solid #3a1a00;
		background: radial-gradient(120% 120% at 35% 25%, #fff6b0, #ffc928 45%, #e07a00);
		color: #3a1a00;
		box-shadow:
			0 5px 0 #8a4400,
			0 0 18px rgb(255 200 60 / 0.6);
	}
	.am-daily-btn {
		border: 3px solid #0a1a3a;
		background: radial-gradient(120% 120% at 35% 25%, #e0f6ff, #45c6ff 45%, #1a6ad0);
		color: #06142e;
		font-size: 14px;
		box-shadow:
			0 5px 0 #0a3a7a,
			0 0 14px rgb(70 200 255 / 0.5);
	}
	.am-play-btn:active,
	.am-daily-btn:active {
		transform: translateY(4px);
		box-shadow: 0 1px 0 #000;
	}
	.am-play-btn:focus-visible,
	.am-daily-btn:focus-visible {
		outline: 3px solid #fff;
		outline-offset: 3px;
	}
	.am-meta {
		font-size: 12px;
		color: #d8cbee;
	}
	.am-count-n {
		font-size: clamp(64px, 18vw, 140px);
		font-weight: 900;
		line-height: 1;
		color: #fffbe0;
		text-shadow:
			0 0 24px var(--glow),
			0 6px 0 rgb(0 0 0 / 0.6);
		animation: am-pop 0.6s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	@keyframes am-pop {
		from {
			transform: scale(2.4);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
	.am-count-sub {
		font-size: 13px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #d8cbee;
	}
	.am-over {
		font-size: 22px;
		font-weight: 900;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #ff5a4a;
		text-shadow: 0 0 10px rgb(255 80 60 / 0.7);
	}
	.am-score-l {
		font-size: 11px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #d8cbee;
	}
	.am-score {
		font-family: 'Cascadia Mono', Consolas, monospace;
		font-size: clamp(40px, 11vw, 72px);
		font-weight: 900;
		line-height: 1;
		color: #ffd23a;
		text-shadow:
			0 0 18px rgb(255 200 60 / 0.8),
			0 4px 0 rgb(0 0 0 / 0.6);
	}
	.am-banner {
		padding: 4px 14px;
		border-radius: 999px;
		font-size: 15px;
		font-weight: 900;
		letter-spacing: 0.06em;
		animation: am-pop 0.6s cubic-bezier(0.2, 1.6, 0.4, 1) 0.5s both;
	}
	.am-banner.pb {
		background: linear-gradient(180deg, #a8f03a, #3f9a12);
		color: #0e2a02;
		box-shadow: 0 0 16px rgb(168 240 58 / 0.6);
	}
	.am-banner.rec {
		background: linear-gradient(180deg, #fff6b0, #ffc928 50%, #e07a00);
		color: #3a1a00;
		box-shadow: 0 0 22px rgb(255 200 60 / 0.8);
	}
	.am-prev,
	.am-place {
		font-size: 12.5px;
		color: #d8cbee;
	}
	.am-tickets {
		font-size: 22px;
		font-weight: 900;
		color: #ff8ac0;
		text-shadow: 0 0 10px rgb(255 100 170 / 0.6);
	}
	.am-parts {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 4px 12px;
		font-size: 12px;
		color: #e8dcff;
	}
	.am-parts b {
		color: #ffd23a;
	}
	.am-side {
		display: grid;
		gap: 10px;
		min-width: 0;
	}
	.am-how {
		display: grid;
		gap: 4px;
		padding: 10px 12px;
		border-radius: 14px;
		background: rgb(0 0 0 / 0.35);
		box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
		font-size: 13px;
		color: #f1e6ff;
	}
	.am-how-h {
		font-size: 12px;
		font-weight: 900;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #ffd23a;
	}
	.am-controls {
		color: #d8cbee;
	}
	@media (max-width: 480px) {
		.am-screen {
			min-height: 330px;
			aspect-ratio: auto;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.am-hero,
		.am-coin,
		.am-count-n,
		.am-banner {
			animation: none !important;
		}
	}
</style>
