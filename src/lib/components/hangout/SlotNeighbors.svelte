<!--
	"You're not playing alone" (2026-11-28, the user: "när man är nere och spinnar på slottsen så hade det varit kul om
	man kanske hade sett som en silhuett av ett annat slott jämte där typ Felix sitter och spelar om han är inne på
	kasinot"). Beside the slot machine you play: everyone else in the casino right now (hangout.ts), each at a dark
	silhouette of the machine or table they're on (lit in that game's colour, its name over it) with their operator
	on a stool in front; a big win pops a "+n 🍔" over them. Same machine as you first. On wide screens they flank
	your machine (left / right); narrower, they're a row above it. Nobody else in = nothing shown.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { hangout } from '#lib/hangout.svelte.ts';
	import { pingOn, sayOn } from '#lib/hangout.ts';
	import { isSlot, zoneOf } from '#lib/floorMap.ts';
	import HangOp from './HangOp.svelte';

	let { game, side, games }: { game: string; side: 'left' | 'right' | 'row'; games: Record<string, string> } = $props();
	const n = t.hang.near;
	const meId = $derived(squad.me?.id ?? null);
	const others = $derived(
		hangout.people
			.filter(([id]) => id !== meId)
			.sort(([a, x], [b, y]) => Number(y.w === game) - Number(x.w === game) || (a < b ? -1 : 1))
	);
	/** Wide screens: every other one on each side (the first, on your machine, to your left). */
	const list = $derived(side === 'row' ? others : others.filter((_, i) => (side === 'left' ? i % 2 === 0 : i % 2 === 1)).slice(0, 3));
	const nameOf = (id: string) => squad.entries.find((e) => e.id === id)?.member.name ?? '?';
	const label = (w: string) => (w.startsWith('ho:') ? t.hang.inHideout(nameOf(w.slice(3))) : (games[w] ?? t.hang.inLobby));
	const kindOf = (w: string) => (isSlot(w) ? 'slot' : w === 'roulette' || w === 'blackjack' ? 'table' : 'stand');
	const fmt = (x: number) => x.toLocaleString('en-US');
</script>

{#if list.length}
	<aside class="sn sn-{side}" class:sn-side={side !== 'row'} class:sn-row={side === 'row'} aria-label={n.label}>
		{#if side !== 'right'}<p class="sn-title font-head">{n.title(others.length)}</p>{/if}
		<ul class="sn-list" role="list">
			{#each list as [id, p] (id)}
				{@const kind = kindOf(p.w)}
				{@const color = zoneOf(p.w).color}
				{@const ping = pingOn(p, hangout.now)}
				{@const line = sayOn(p, hangout.now)}
				<li class="sn-seat" data-kind={kind} class:same={p.w === game} style:--c={color} data-op={id}>
					<span class="sn-where font-head">{p.w === game ? n.same : label(p.w)}</span>
					{#if ping}{#key ping.at}<span class="sn-ping font-head" role="status">{t.hang.won(fmt(ping.n))}</span>{/key}{/if}
					{#if line}{#key `${line}${p.say?.at}`}<span class="sn-say font-head">{t.hang.says[line]}</span>{/key}{/if}
					<div class="sn-art" aria-hidden="true">
						{#if kind === 'slot'}
							<svg viewBox="0 0 60 92" class="sn-cab">
								<path d="M6 92 V20 Q6 6 20 6 H40 Q54 6 54 20 V92Z" fill="#0b0309" stroke={color} stroke-opacity="0.55" stroke-width="1.4" />
								<rect class="sn-marq" x="10" y="10" width="40" height="9" rx="3" fill={color} />
								<rect x="11" y="25" width="38" height="24" rx="3" fill="#000" stroke={color} stroke-opacity="0.35" />
								{#each [0, 1, 2] as r (r)}<rect class="sn-reel" style:--d="{r * 0.25}s" x={14 + r * 11.5} y="28" width="9" height="18" rx="1.5" fill={color} opacity="0.32" />{/each}
								<rect x="10" y="54" width="40" height="5" rx="2" fill={color} opacity="0.25" />
								<path d="M54 40 h4 v-14" stroke="#555" stroke-width="2" fill="none" /><circle cx="58" cy="24" r="3" fill={color} opacity="0.8" />
							</svg>
						{:else if kind === 'table'}
							<svg viewBox="0 0 92 60" class="sn-table">
								<ellipse cx="46" cy="30" rx="44" ry="24" fill="#0b0309" stroke={color} stroke-opacity="0.7" stroke-width="2" />
								<ellipse cx="46" cy="30" rx="36" ry="17" fill={color} opacity="0.3" />
							</svg>
						{/if}
					</div>
					<span class="sn-op"><HangOp {id} name={p.name} op={p.op} size={side === 'row' ? 38 : 46} /></span>
					<span class="sn-name font-head">{p.name}</span>
				</li>
			{/each}
		</ul>
	</aside>
{/if}

<style>
	.sn {
		display: grid;
		align-content: start;
		gap: 6px;
	}
	.sn-title {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #7dffcf;
	}
	.sn-right {
		padding-top: 20px;
	}
	.sn-list {
		display: grid;
		gap: 14px;
		justify-items: center;
	}
	.sn-row .sn-list {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		justify-items: start;
	}
	.sn-seat {
		position: relative;
		display: grid;
		justify-items: center;
		width: 128px;
		filter: saturate(0.85);
	}
	.sn-row .sn-seat {
		width: 96px;
	}
	.sn-seat.same {
		filter: none;
	}
	.sn-where {
		max-width: 100%;
		padding: 1px 6px;
		border-radius: 5px;
		border: 1px solid var(--c);
		background: #0b0309;
		color: #fff3dc;
		font-size: 10px;
		font-weight: 800;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		box-shadow: 0 0 8px color-mix(in srgb, var(--c) 45%, transparent);
	}
	.sn-art {
		display: grid;
		place-items: end center;
		height: 110px;
		margin-top: 2px;
	}
	.sn-row .sn-art {
		height: 78px;
	}
	.sn-cab {
		width: 72px;
		height: auto;
		filter: drop-shadow(0 0 10px color-mix(in srgb, var(--c) 35%, transparent));
	}
	.sn-row .sn-cab {
		width: 52px;
	}
	.sn-table {
		width: 104px;
		height: auto;
	}
	.sn-row .sn-table {
		width: 80px;
	}
	.sn-seat[data-kind='stand'] .sn-art {
		height: 40px;
	}
	.sn-op {
		margin-top: -38px;
		filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.6));
	}
	.sn-seat[data-kind='stand'] .sn-op {
		margin-top: -30px;
	}
	.sn-name {
		margin-top: -2px;
		padding: 0 5px;
		border-radius: 4px;
		background: rgb(0 0 0 / 0.6);
		font-size: 10.5px;
		font-weight: 700;
		white-space: nowrap;
	}
	.sn-ping {
		position: absolute;
		top: 16px;
		z-index: 2;
		padding: 2px 8px;
		border-radius: 999px;
		background: linear-gradient(180deg, #ffe066, #ffb400);
		color: #2a1400;
		font-size: 12px;
		font-weight: 900;
		white-space: nowrap;
		box-shadow: 0 0 14px rgb(255 200 40 / 0.85);
		animation: sn-pop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	.sn-say {
		position: absolute;
		top: 40px;
		right: -4px;
		z-index: 2;
		padding: 2px 7px;
		border-radius: 9px 9px 2px 9px;
		background: #fff;
		color: #1a0a18;
		font-size: 10.5px;
		font-weight: 800;
		white-space: nowrap;
		animation: sn-pop 0.35s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	.sn-marq {
		animation: sn-blink 1.2s steps(2) infinite;
	}
	.sn-reel {
		animation: sn-reel 2.6s ease-in-out infinite var(--d);
	}
	@keyframes sn-pop {
		from {
			transform: scale(0.2);
		}
	}
	@keyframes sn-blink {
		50% {
			opacity: 0.55;
		}
	}
	@keyframes sn-reel {
		0%,
		60%,
		100% {
			opacity: 0.32;
		}
		70%,
		90% {
			opacity: 0.75;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.sn-ping,
		.sn-say,
		.sn-marq,
		.sn-reel {
			animation: none;
		}
	}
</style>
