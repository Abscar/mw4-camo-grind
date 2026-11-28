<!--
	The casino lobby (2026-11-28, the user: "när man är inne på kasinot ska det finnas … en liten lobby … de som
	är inne på kasinot, då ser man deras operators … ovanför varje gubbe … vilken slot de spelar … Ogge vann så här
	mycket, boom, och så plingar det … collab spins"; later the same day: "lobbyn … ovanifrån, typ som gamla
	Pokémon-spel … inte bara en grön plattmark"). Everyone in the casino right now (hangout.ts `here`) stands on the
	top-down floor map (CasinoFloorMap) where they play, with a pling + "+n 🍔" over their head after a big win,
	quick lines and waves. The map folds up (remembered per device). Under it: collab spins (CollabSpin).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { hangout } from '#lib/hangout.svelte.ts';
	import { pingOn } from '#lib/hangout.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import CasinoFloorMap from './CasinoFloorMap.svelte';
	import CollabSpin from './CollabSpin.svelte';

	let { games, game, onPick, onVisit }: { games: Record<string, string>; game: string; onPick: (g: string) => void; onVisit: (memberId: string) => void } = $props();
	const h = t.hang;
	const meId = $derived(squad.me?.id ?? null);
	const people = $derived(hangout.people);

	/** A pling for a fresh win ping (once per ping). */
	const heard = new Set<string>();
	$effect(() => {
		for (const [id, p] of people) {
			const ping = pingOn(p, hangout.now);
			if (!ping) continue;
			const key = `${id}:${ping.at}`;
			if (heard.has(key)) continue;
			heard.add(key);
			if (id !== meId && hangout.now - ping.at < 4000) sound.play('maxed');
		}
	});

	const KEY = 'mw4-camo-grind:floor-map';
	let open = $state(true);
	$effect(() => {
		try {
			open = localStorage.getItem(KEY) !== 'closed';
		} catch {
			// open
		}
	});
	function toggle() {
		open = !open;
		try {
			localStorage.setItem(KEY, open ? 'open' : 'closed');
		} catch {
			// for this visit
		}
	}
</script>

<section class="lobby" aria-labelledby="lobby-h">
	<header class="lobby-head">
		<h3 id="lobby-h" class="font-head">{h.heading}</h3>
		<span class="lobby-count num">{h.count(people.length)}</span>
		<button type="button" class="btn btn-sm lobby-fold" aria-expanded={open} onclick={toggle}>{open ? h.map.fold : h.map.unfold}</button>
	</header>
	{#if people.length <= 1}<p class="lobby-alone">{h.alone}</p>{/if}
	{#if open}<CasinoFloorMap {games} {game} {onPick} {onVisit} />{/if}
	<CollabSpin />
</section>

<style>
	.lobby {
		position: relative;
		display: grid;
		gap: 8px;
		padding: 10px 12px 12px;
		border-radius: 14px;
		border: 1.5px solid rgb(255 201 40 / 0.55);
		background:
			radial-gradient(120% 80% at 50% 120%, rgb(255 60 160 / 0.22), transparent 60%),
			linear-gradient(180deg, #2b0c2a, #170616);
		box-shadow: inset 0 0 0 3px rgb(0 0 0 / 0.25);
	}
	.lobby-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 10px;
	}
	.lobby-head h3 {
		font-size: 13px;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #ffd23a;
		text-shadow: 0 0 8px rgb(255 190 40 / 0.5);
	}
	.lobby-count {
		font-size: 12px;
		color: var(--t-muted);
	}
	.lobby-fold {
		margin-left: auto;
		min-height: 36px;
	}
	.lobby-alone {
		font-size: 12.5px;
		color: var(--t-muted);
	}
</style>
