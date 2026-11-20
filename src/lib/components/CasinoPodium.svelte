<!--
	BurgiCasino's leaderboard as a podium (2026-11-20, the user: "lots of dopamine and fun things"): the top
	three stand on gold, silver and bronze blocks (2nd left, 1st in the middle with a crown and a spotlight,
	3rd right; the list itself stays in rank order for screen readers), everyone else in rows under it.
	Places nobody has taken yet show an empty block. Every player is a .casino-row with their name, net and
	games (the checks read those). Rows: CasinoSection's board (net = what they won or lost, games played).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import type { SquadEntry } from '#lib/squad.svelte.ts';
	import SquadAvatar from './SquadAvatar.svelte';
	import FloorArt from './FloorArt.svelte';

	let { rows }: { rows: { e: SquadEntry; net: number; games: number }[] } = $props();
	const c = t.casino;
	const f = c.floor;
	const top = $derived(rows.slice(0, 3));
	const rest = $derived(rows.slice(3));
	const empty = $derived([1, 2, 3].filter((p) => p > top.length));
	const signed = (n: number) => (n > 0 ? `+${n.toLocaleString('en-US')}` : n < 0 ? `−${(-n).toLocaleString('en-US')}` : '±0');
	const dir = (n: number) => (n > 0 ? 'up' : n < 0 ? 'down' : 'flat');
</script>

<section class="podium-wrap" aria-labelledby="casino-board-h">
	<h3 id="casino-board-h" class="podium-h font-head">{c.board.heading}</h3>
	{#if !rows.length}
		<p class="mt-1 text-sm text-muted">{c.board.none}</p>
	{/if}
	<div class="podium-stage">
		<ol class="podium">
			{#each top as row, i (row.e.id)}
				<li class="casino-row spot" data-place={i + 1} class:mine={row.e.mine}>
					<span class="sr-only">{f.place(i + 1)}:</span>
					<div class="spot-who">
						{#if i === 0}
							<span class="spot-crown" aria-hidden="true"><FloorArt kind="crown" size={34} /></span>
							<span class="spot-twinkles" aria-hidden="true">
								<FloorArt kind="sparkle" size={14} tint="#fff6b0" class="tw tw1" /><FloorArt kind="sparkle" size={10} tint="#ffd23a" class="tw tw2" /><FloorArt kind="sparkle" size={12} tint="#ffffff" class="tw tw3" />
							</span>
						{/if}
						<span class="spot-face"><SquadAvatar name={row.e.member.name} op={row.e.member.op} size={i === 0 ? 54 : 44} /></span>
						<b class="spot-name font-head">{row.e.member.name}</b>
						<span class="casino-net num font-head" data-dir={dir(row.net)}>{signed(row.net)} 🍔</span>
						<span class="spot-games">{f.games(row.games)}</span>
					</div>
					<div class="spot-block" aria-hidden="true"><span class="font-head">{i + 1}</span></div>
				</li>
			{/each}
			{#each empty as p (p)}
				<li class="spot ghost" data-place={p} aria-hidden="true">
					<div class="spot-who"><span class="spot-face ghost-face">?</span><span class="spot-games">{f.emptySeat}</span></div>
					<div class="spot-block"><span class="font-head">{p}</span></div>
				</li>
			{/each}
		</ol>
	</div>
	{#if rest.length}
		<ol class="rest mt-2 grid gap-1.5" start="4">
			{#each rest as row, i (row.e.id)}
				<li class="casino-row rest-row flex min-w-0 items-center gap-2.5 rounded-lg px-2.5 py-1.5" class:mine={row.e.mine}>
					<span class="num w-7 flex-none font-head text-[13px] font-bold">#{i + 4}</span>
					<SquadAvatar name={row.e.member.name} op={row.e.member.op} size={30} />
					<b class="min-w-0 flex-1 truncate font-head text-[14px]">{row.e.member.name}</b>
					<span class="casino-net num font-head" data-dir={dir(row.net)}>{c.board.row(signed(row.net), row.games)}</span>
				</li>
			{/each}
		</ol>
	{/if}
</section>

<style>
	.podium-h {
		font-size: 15px;
		font-weight: 900;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #ffd23a;
		text-shadow:
			0 0 10px rgb(255 190 40 / 0.45),
			0 1px 0 rgb(0 0 0 / 0.7) !important;
	}
	/* the stage: a dark floor with a spotlight from above */
	.podium-stage {
		margin-top: 10px;
		padding: 18px 10px 0;
		border-radius: 14px;
		background:
			radial-gradient(40% 70% at 50% 0%, rgb(255 236 170 / 0.22), transparent 70%),
			radial-gradient(70% 60% at 50% 100%, rgb(255 60 160 / 0.18), transparent 70%),
			linear-gradient(180deg, #1d0a22, #0c0410);
		box-shadow:
			inset 0 0 0 1.5px rgb(255 201 40 / 0.45),
			inset 0 -18px 30px rgb(0 0 0 / 0.5);
		overflow: hidden;
	}
	.podium {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		align-items: end;
		gap: 8px;
		max-width: 560px;
		margin: 0 auto;
		padding: 0;
		list-style: none;
	}
	.spot {
		display: grid;
		justify-items: center;
		min-width: 0;
		color: #fff3dc;
	}
	.spot[data-place='1'] {
		grid-column: 2;
		grid-row: 1;
	}
	.spot[data-place='2'] {
		grid-column: 1;
		grid-row: 1;
	}
	.spot[data-place='3'] {
		grid-column: 3;
		grid-row: 1;
	}
	.spot-who {
		position: relative;
		display: grid;
		justify-items: center;
		gap: 2px;
		width: 100%;
		min-width: 0;
		padding-bottom: 8px;
		text-align: center;
	}
	.spot-crown {
		margin-bottom: -6px;
		filter: drop-shadow(0 0 8px rgb(255 200 60 / 0.7));
		animation: crown-bob 3.2s ease-in-out infinite alternate;
	}
	@keyframes crown-bob {
		from {
			transform: translateY(0) rotate(-6deg);
		}
		to {
			transform: translateY(-4px) rotate(6deg);
		}
	}
	.spot-twinkles :global(.tw) {
		position: absolute;
		animation: twinkle 2.6s ease-in-out infinite;
	}
	.spot-twinkles :global(.tw1) {
		left: calc(50% - 46px);
		top: 6px;
	}
	.spot-twinkles :global(.tw2) {
		left: calc(50% + 34px);
		top: 2px;
		animation-delay: -0.9s;
	}
	.spot-twinkles :global(.tw3) {
		left: calc(50% + 26px);
		top: 40px;
		animation-delay: -1.7s;
	}
	@keyframes twinkle {
		0%,
		100% {
			opacity: 0.15;
			transform: scale(0.6) rotate(0deg);
		}
		50% {
			opacity: 1;
			transform: scale(1) rotate(45deg);
		}
	}
	.spot-face {
		display: grid;
		place-items: center;
		border-radius: 50%;
		box-shadow: 0 0 0 2px rgb(255 255 255 / 0.25);
	}
	.spot[data-place='1'] .spot-face {
		box-shadow:
			0 0 0 2.5px #ffd23a,
			0 0 16px rgb(255 200 60 / 0.6);
	}
	.spot[data-place='2'] .spot-face {
		box-shadow: 0 0 0 2px #dfe6ef;
	}
	.spot[data-place='3'] .spot-face {
		box-shadow: 0 0 0 2px #e0955a;
	}
	.spot-name {
		max-width: 100%;
		margin-top: 4px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 14px;
		font-weight: 800;
	}
	.spot.mine .spot-name {
		color: #ffd23a;
	}
	.spot .casino-net {
		font-size: 14px;
		font-weight: 900;
	}
	.spot-games {
		font-size: 11px;
		color: #d8c39a;
	}
	/* the blocks: metal, with the place number cut in */
	.spot-block {
		display: grid;
		place-items: start center;
		width: 100%;
		padding-top: 6px;
		border-radius: 8px 8px 0 0;
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.55),
			inset 0 -10px 16px rgb(0 0 0 / 0.25);
	}
	.spot-block span {
		font-size: 22px;
		font-weight: 900;
		line-height: 1;
		color: rgb(0 0 0 / 0.45);
		text-shadow: 0 1px 0 rgb(255 255 255 / 0.5);
	}
	.spot[data-place='1'] .spot-block {
		height: 70px;
		background: linear-gradient(180deg, #fff3a6 0%, #ffcf2e 30%, #e09a00 75%, #a86400 100%);
	}
	.spot[data-place='2'] .spot-block {
		height: 50px;
		background: linear-gradient(180deg, #ffffff 0%, #d9e0ea 35%, #9aa6b6 80%, #6d7888 100%);
	}
	.spot[data-place='3'] .spot-block {
		height: 36px;
		background: linear-gradient(180deg, #ffd2a8 0%, #e0955a 35%, #a55a26 80%, #6e3612 100%);
	}
	.spot.ghost {
		opacity: 0.45;
	}
	.ghost-face {
		width: 44px;
		height: 44px;
		border: 2px dashed rgb(255 255 255 / 0.4);
		box-shadow: none;
		font-family: var(--t-font-head);
		font-size: 20px;
		font-weight: 900;
		color: rgb(255 255 255 / 0.6);
	}
	.spot.ghost .spot-block {
		filter: grayscale(1) brightness(0.55);
	}
	.rest-row {
		border: 1px solid var(--t-line);
		background: rgb(0 0 0 / 0.3);
		color: #fff3dc;
	}
	.rest-row.mine {
		border-color: #ffd23a;
	}
	.rest-row > .num:first-child {
		color: #ffd23a;
	}
	.rest .casino-net {
		flex: none;
		font-size: 13px;
		font-weight: 800;
	}
	.casino-net[data-dir='up'] {
		color: #5dff86;
	}
	.casino-net[data-dir='down'] {
		color: #ff6b6b;
	}
	.casino-net[data-dir='flat'] {
		color: #e8d6b0;
	}
	@media (max-width: 420px) {
		.spot .casino-net {
			font-size: 12px;
		}
		.spot-name {
			font-size: 13px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spot-crown,
		.spot-twinkles :global(.tw) {
			animation: none;
		}
	}
</style>
