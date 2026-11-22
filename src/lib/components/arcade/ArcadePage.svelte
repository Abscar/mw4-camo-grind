<!--
	BurgiArcade, its own page tab (2026-11-22, the user: "Börja med ett arcade … battle om high score", "bygg alla
	10, men se till att loggorna och allt det här blir lite snyggare så att det ser ut som resten av hemsidan",
	then "gör så att man kan vinna tickets av alla arcades, och så bygger du en shop där också … pets och
	gosedjur och mounts"). A neon arcade hall in every theme: the BurgiArcade sign with your tickets and this
	week's champ, rematches when someone beat your best, the ten cabinets (ArcadeCabinet), the machine of the
	picked game (ArcadeMachine: play / daily challenge / result / high scores), Quickscope duels, the champ race,
	how tickets work, and the prize counter (PrizeCounter) behind its own door. Games and personal bests work
	outside a squad (kept on this device); the boards, duels and prizes need the squad.
-->
<script lang="ts">
	import { ARCADE_GAMES, type ArcadeGame } from '#lib/arcade/game.ts';
	import { hallOf, rematches, weekChampions, weekStandings, TICKETS_DAILY, TICKETS_PB, TICKETS_RECORD } from '#lib/arcade.ts';
	import { GAME_WORDS } from '#lib/i18n/arcade/index.ts';
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import SquadAvatar from '../SquadAvatar.svelte';
	import ArcadeLogo from './ArcadeLogo.svelte';
	import ArcadeCabinet from './ArcadeCabinet.svelte';
	import ArcadeMachine, { type DuelPlay } from './ArcadeMachine.svelte';
	import ArcadeDuels from './ArcadeDuels.svelte';
	import PrizeCounter from './PrizeCounter.svelte';

	let { onSquad }: { onSquad?: () => void } = $props();
	const a = t.arcade;
	const DOOR_KEY = 'mw4-camo-grind:arcade-door';

	let door = $state<'games' | 'prizes'>('games');
	let picked = $state<ArcadeGame | null>(null);
	let duel = $state<DuelPlay | null>(null);
	let machineEl = $state<HTMLElement>();
	$effect(() => {
		try {
			if (localStorage.getItem(DOOR_KEY) === 'prizes') door = 'prizes';
		} catch {
			// storage blocked: start at the games
		}
	});
	function openDoor(d: 'games' | 'prizes') {
		door = d;
		try {
			localStorage.setItem(DOOR_KEY, d);
		} catch {
			// works for this visit
		}
	}

	const me = $derived(squad.me?.id ?? null);
	const members = $derived(squad.arcadeMembers);
	const now = $derived(squad.on ? squad.now : Date.now());
	const tickets = $derived(squad.myTickets);
	const champs = $derived(squad.on ? weekChampions(members, now) : []);
	const standings = $derived(squad.on ? weekStandings(members, now).slice(0, 5) : []);
	const rematchList = $derived(squad.on && me ? rematches(members, me).slice(0, 3) : []);
	const nameOf = (id: string) => members[id]?.name ?? '?';
	/** the squad's #1 per game (for the cabinets) */
	const tops = $derived(Object.fromEntries(ARCADE_GAMES.map((g) => [g, squad.on ? (hallOf(members, g, 'all', now)[0] ?? null) : null])));

	async function pick(g: ArcadeGame, d: DuelPlay | null = null) {
		picked = g;
		duel = d;
		openDoor('games');
		await Promise.resolve();
		requestAnimationFrame(() => machineEl?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
	}
	function close() {
		picked = null;
		duel = null;
	}
	/** Keep the duels list fresh while the arcade is open (answers land in the squad document). */
	$effect(() => {
		if (!squad.on) return;
		const id = setInterval(() => {
			if (document.visibilityState === 'visible' && squad.duels.some((v) => v.waiting === 'them')) void squad.refreshNow();
		}, 12_000);
		return () => clearInterval(id);
	});
</script>

<section class="arcade class-card overflow-hidden rounded-card shadow-card" aria-labelledby="arcade-h">
	<span class="arc-floor" aria-hidden="true"></span>
	<span class="arc-stars" aria-hidden="true"></span>

	<!-- the sign -->
	<header class="arc-sign">
		<h2 id="arcade-h" class="sr-only">{a.heading}</h2>
		<div class="arc-logo"><ArcadeLogo label={a.heading} /></div>
		<p class="arc-sub font-head">{a.sub}</p>
		<div class="arc-pills">
			<span class="arc-pill tickets font-head" title={a.ticketsTitle(tickets.balance)}><span aria-hidden="true">🎟️</span> <b class="num">{tickets.balance.toLocaleString('en-US')}</b><span class="sr-only"> {a.ticketsLabel}</span></span>
			{#if squad.on}
				<span class="arc-pill champ font-head">
					<span aria-hidden="true">👑</span>
					{#if champs.length}
						<span class="arc-champ-l">{a.champ}:</span>
						{#each champs as c (c.id)}<SquadAvatar name={nameOf(c.id)} op={members[c.id]?.op} size={22} /><b>{nameOf(c.id)}</b>{/each}
					{:else}<span>{a.champNone}</span>{/if}
				</span>
			{/if}
		</div>
	</header>

	<div class="arc-body">
		{#if !squad.on}
			<div class="arc-out">
				<p>{a.outside}</p>
				<button type="button" class="btn btn-primary" onclick={() => onSquad?.()}>{a.toSquad}</button>
			</div>
		{/if}

		<!-- the two doors: the games, the prize counter -->
		<div class="arc-doors" role="group" aria-label={a.doors.label}>
			<button type="button" class="arc-door font-head" aria-pressed={door === 'games'} onclick={() => openDoor('games')}>🕹️ {a.doors.games}</button>
			<button type="button" class="arc-door prize font-head" aria-pressed={door === 'prizes'} onclick={() => openDoor('prizes')}>🎟️ {a.doors.prizes}</button>
		</div>

		{#if door === 'prizes'}
			<div class="arc-prizes">
				<div class="arc-prize-head">
					<p class="arc-h font-head">{a.prizes.heading}</p>
					<p class="arc-dim">{a.prizes.sub}</p>
				</div>
				{#if squad.on}<PrizeCounter />{:else}<p class="arc-dim">{a.prizes.notIn}</p>{/if}
			</div>
		{:else}
			{#if rematchList.length}
				<ul class="arc-rematch">
					{#each rematchList as r (r.game)}
						<li>
							<span class="arc-rm-tag font-head">⚔️ {a.rematch.heading}</span>
							<SquadAvatar name={nameOf(r.by)} op={members[r.by]?.op} size={26} />
							<span class="arc-rm-line">{a.rematch.line(nameOf(r.by), GAME_WORDS[r.game].name, r.score, r.mine)}</span>
							<button type="button" class="arc-rm-go font-head" onclick={() => pick(r.game)}>{a.rematch.go}</button>
						</li>
					{/each}
				</ul>
			{/if}

			{#if picked}
				<div bind:this={machineEl} class="arc-machine">
					{#key `${picked}-${duel?.id ?? ''}`}
						<ArcadeMachine game={picked} {duel} onclose={close} />
					{/key}
				</div>
			{/if}

			<!-- the cabinets -->
			<div class="arc-cabs" role="group" aria-label={a.gamesLabel}>
				{#each ARCADE_GAMES as g (g)}
					{@const top = tops[g]}
					<ArcadeCabinet
						game={g}
						picked={picked === g}
						best={squad.arcade?.g[g]?.b ?? 0}
						top={top ? { name: nameOf(top.id), score: top.score } : null}
						crown={!!top && top.id === me}
						onpick={() => pick(g)}
					/>
				{/each}
			</div>

			{#if squad.on}
				<div class="arc-two">
					<ArcadeDuels onplay={(d) => pick('quickscope', d)} />
					<div class="arc-race">
						<p class="arc-h font-head">🏆 {a.race.heading}</p>
						<p class="arc-dim">{a.race.how}</p>
						{#if !standings.length}
							<p class="arc-dim">{a.race.empty}</p>
						{:else}
							<ol class="arc-race-rows">
								{#each standings as c, i (c.id)}
									<li class:mine={c.id === me}>
										<span class="arc-race-rank font-head num">{i + 1}</span>
										<SquadAvatar name={nameOf(c.id)} op={members[c.id]?.op} size={30} />
										<b class="font-head">{nameOf(c.id)}{#if i === 0}{' '}<span aria-hidden="true">👑</span>{/if}</b>
										<span class="arc-dim">{a.race.firsts(c.firsts)}</span>
										<span class="arc-race-pts font-head num">{a.champPts(c.points)}</span>
									</li>
								{/each}
							</ol>
						{/if}
					</div>
				</div>
			{/if}

			<details class="arc-how">
				<summary class="font-head">🎟️ {a.ticketsHow}</summary>
				<ul>
					{#each a.ticketRules(TICKETS_PB, TICKETS_RECORD, TICKETS_DAILY) as rule, i (i)}<li>{rule}</li>{/each}
				</ul>
			</details>
		{/if}
	</div>
</section>

<style>
	/* a neon arcade hall in every theme: the theme's colours re-tuned inside so buttons and text stay readable */
	.arcade {
		position: relative;
		isolation: isolate;
		color: #f4ecff;
	}
	:global([data-theme]) .arcade {
		--t-fg: #f4ecff;
		--t-muted: #cbbde8;
		--t-panel: #140a24;
		--t-line: rgb(170 120 255 / 0.3);
		--t-accent: #ffc928;
		--t-on-accent: #1d0d00;
		background:
			radial-gradient(90% 40% at 50% 0%, rgb(255 60 180 / 0.28), transparent 70%),
			radial-gradient(70% 40% at 0% 30%, rgb(69 230 255 / 0.14), transparent 70%),
			linear-gradient(180deg, #1a0838 0%, #0d0420 45%, #06020f 100%);
	}
	/* a synthwave grid floor at the bottom, in perspective */
	.arc-floor {
		position: absolute;
		left: -20%;
		right: -20%;
		bottom: 0;
		height: 340px;
		z-index: -1;
		background:
			linear-gradient(180deg, #06020f 0%, transparent 40%),
			repeating-linear-gradient(90deg, rgb(255 60 200 / 0.45) 0 2px, transparent 2px 70px),
			repeating-linear-gradient(0deg, rgb(255 60 200 / 0.45) 0 2px, transparent 2px 46px);
		transform: perspective(300px) rotateX(58deg);
		transform-origin: 50% 100%;
		opacity: 0.45;
		pointer-events: none;
	}
	.arc-stars {
		position: absolute;
		inset: 0;
		z-index: -1;
		background:
			radial-gradient(circle, rgb(255 255 255 / 0.7) 0 1px, transparent 1.6px) 0 0 / 97px 83px,
			radial-gradient(circle, rgb(255 210 255 / 0.5) 0 1px, transparent 1.6px) 40px 30px / 131px 109px;
		opacity: 0.5;
		pointer-events: none;
	}
	.arc-sign {
		display: grid;
		justify-items: center;
		gap: 6px;
		padding: 16px 14px 6px;
	}
	.arc-logo {
		width: min(100%, 560px);
	}
	.arc-sub {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		text-align: center;
		color: #8ff4ff;
		text-shadow: 0 0 8px rgb(69 230 255 / 0.6);
	}
	.arc-pills {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		margin-top: 4px;
	}
	.arc-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 36px;
		max-width: 100%;
		padding: 4px 14px;
		border-radius: 999px;
		font-size: 14px;
		font-weight: 900;
	}
	.arc-pill.tickets {
		background: linear-gradient(180deg, #ff7ab0, #c0287c);
		color: #fff;
		box-shadow:
			0 0 0 2px #ffd0e4,
			0 0 16px rgb(255 63 176 / 0.55);
	}
	.arc-pill.champ {
		flex-wrap: wrap;
		background: rgb(0 0 0 / 0.45);
		box-shadow: inset 0 0 0 1.5px #ffd23a;
		color: #ffe9a8;
		font-size: 12.5px;
	}
	.arc-champ-l {
		color: #ffd23a;
	}
	.arc-body {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 14px;
		padding: 10px 14px 18px;
	}
	@media (min-width: 640px) {
		.arc-body {
			padding: 12px 20px 22px;
		}
	}
	.arc-out {
		display: grid;
		justify-items: start;
		gap: 8px;
		padding: 12px;
		border-radius: 14px;
		background: rgb(0 0 0 / 0.35);
		box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.15);
		font-size: 13px;
	}
	.arc-doors {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		max-width: 520px;
		width: 100%;
		margin-inline: auto;
	}
	.arc-door {
		min-height: 48px;
		border-radius: 14px;
		border: 2px solid rgb(255 255 255 / 0.18);
		background: rgb(255 255 255 / 0.06);
		color: #f4ecff;
		font-size: 15px;
		font-weight: 900;
		letter-spacing: 0.04em;
	}
	.arc-door[aria-pressed='true'] {
		border-color: #ffd23a;
		background: linear-gradient(180deg, #ffd23a, #e08a00);
		color: #2a1200;
		box-shadow: 0 0 16px rgb(255 200 60 / 0.5);
	}
	.arc-door.prize[aria-pressed='true'] {
		border-color: #ff7ac8;
		background: linear-gradient(180deg, #ff7ac8, #c0287c);
		color: #fff;
		box-shadow: 0 0 16px rgb(255 63 176 / 0.55);
	}
	.arc-h {
		font-size: 15px;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #ffd23a;
	}
	.arc-dim {
		font-size: 12.5px;
		color: #cbbde8;
	}
	.arc-prizes {
		display: grid;
		gap: 10px;
	}
	.arc-rematch {
		display: grid;
		gap: 6px;
	}
	.arc-rematch li {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		border-radius: 14px;
		background: linear-gradient(90deg, rgb(220 30 60 / 0.45), rgb(80 10 30 / 0.4));
		box-shadow: inset 0 0 0 1.5px rgb(255 90 110 / 0.7);
		font-size: 13px;
	}
	.arc-rm-tag {
		padding: 2px 8px;
		border-radius: 6px;
		background: #ff3b5a;
		color: #fff;
		font-size: 11px;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.arc-rm-line {
		flex: 1 1 12rem;
		min-width: 0;
	}
	.arc-rm-go {
		min-height: 44px;
		padding: 0 16px;
		border-radius: 999px;
		border: 2px solid #3a1a00;
		background: linear-gradient(180deg, #fff6b0, #ffc928 50%, #e07a00);
		color: #3a1a00;
		font-size: 13px;
		font-weight: 900;
	}
	.arc-machine {
		scroll-margin-top: 12px;
	}
	.arc-cabs {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}
	@media (min-width: 560px) {
		.arc-cabs {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	@media (min-width: 820px) {
		.arc-cabs {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
	@media (min-width: 1100px) {
		.arc-cabs {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}
		/* a lone cabinet on the last row (11 games) sits in the middle */
		.arc-cabs > :global(.cab:last-child:nth-child(5n + 1)) {
			grid-column: 3;
		}
	}
	@media (max-width: 559px) {
		.arc-cabs > :global(.cab:last-child:nth-child(odd)) {
			grid-column: 1 / -1;
			justify-self: center;
			width: calc(50% - 5px);
		}
	}
	.arc-two {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 12px;
		align-items: start;
	}
	@media (min-width: 900px) {
		.arc-two {
			grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
		}
	}
	.arc-race {
		display: grid;
		gap: 8px;
		padding: 12px;
		border-radius: 16px;
		background:
			radial-gradient(90% 120% at 100% 0%, rgb(255 201 40 / 0.16), transparent 60%),
			linear-gradient(180deg, #221030, #0c0414);
		box-shadow: inset 0 0 0 1.5px rgb(255 201 40 / 0.5);
	}
	.arc-race-rows {
		display: grid;
		gap: 4px;
	}
	.arc-race-rows li {
		display: grid;
		grid-template-columns: 24px 30px minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 8px;
		padding: 5px 8px;
		border-radius: 10px;
		background: rgb(255 255 255 / 0.05);
		font-size: 13px;
	}
	.arc-race-rows li.mine {
		background: rgb(255 210 58 / 0.13);
		box-shadow: inset 0 0 0 1px rgb(255 210 58 / 0.5);
	}
	.arc-race-rows b {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.arc-race-rank {
		font-weight: 900;
		color: #ffd23a;
	}
	.arc-race-pts {
		font-weight: 900;
		color: #ffd23a;
	}
	.arc-how {
		padding: 10px 12px;
		border-radius: 14px;
		background: rgb(0 0 0 / 0.3);
		box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
		font-size: 13px;
	}
	.arc-how summary {
		min-height: 32px;
		cursor: pointer;
		font-weight: 900;
		color: #ff8ac0;
	}
	.arc-how ul {
		display: grid;
		gap: 3px;
		margin-top: 6px;
		padding-left: 18px;
		list-style: disc;
	}
</style>
