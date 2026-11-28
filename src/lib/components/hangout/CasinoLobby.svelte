<!--
	The casino lobby (2026-11-28, the user: "när man är inne på kasinot ska det finnas … en liten lobby … de som
	är inne på kasinot, då ser man deras operators … hälsa på varandra … ovanför varje gubbe … vilken slot de
	spelar … Ogge vann så här mycket, boom, och så plingar det ovanför hans huvud … collab spins").
	Everyone in the casino right now (hangout.ts `here`) stands on a strip of carpet: a sign over their head with
	the game they're on (or whose hideout they're in), a gold "+12,345 🍔" that pops up with a pling when they win
	big, quick lines in speech bubbles, and a 👋 when they wave. Tap someone to wave or visit their hideout; tap
	yourself to say something. Under them: collab spins (CollabSpin).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { hangout } from '#lib/hangout.svelte.ts';
	import { pingOn, sayOn, waveOn, SAYS, type Say } from '#lib/hangout.ts';
	import { hasHideout } from '#lib/hideout.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import HangOp from './HangOp.svelte';
	import CollabSpin from './CollabSpin.svelte';

	let { games, onVisit }: { games: Record<string, string>; onVisit: (memberId: string) => void } = $props();
	const h = t.hang;
	const meId = $derived(squad.me?.id ?? null);
	const people = $derived(hangout.people);
	const nameOf = (id: string) => squad.entries.find((e) => e.id === id)?.member.name ?? people.find(([x]) => x === id)?.[1].name ?? '?';
	function whereText(w: string): string {
		if (w.startsWith('ho:')) return h.inHideout(nameOf(w.slice(3)));
		return games[w] ?? h.inLobby;
	}
	const hasHo = (id: string) => hasHideout(squad.entries.find((e) => e.id === id)?.member.hideout);

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

	let menu = $state<string | null>(null);
	function tap(id: string) {
		menu = menu === id ? null : id;
	}
	async function wave(id: string) {
		menu = null;
		if (await hangout.wave(id)) toast.show(h.waved(nameOf(id)));
	}
	async function say(k: Say) {
		menu = null;
		await hangout.say(k);
	}
	const fmt = (n: number) => n.toLocaleString('en-US');
</script>

<section class="lobby" aria-labelledby="lobby-h">
	<header class="lobby-head">
		<h3 id="lobby-h" class="font-head">{h.heading}</h3>
		<span class="lobby-count num">{h.count(people.length)}</span>
	</header>

	{#if people.length <= 1}<p class="lobby-alone">{h.alone}</p>{/if}

	<ul class="lobby-floor" role="list">
		{#each people as [id, p] (id)}
			{@const ping = pingOn(p, hangout.now)}
			{@const line = sayOn(p, hangout.now)}
			{@const wv = waveOn(p, hangout.now)}
			<li class="lobby-op" class:me={id === meId}>
				<span class="lobby-sign font-head" title={whereText(p.w)}>{whereText(p.w)}</span>
				{#if ping}{#key ping.at}<span class="lobby-ping font-head" role="status"><span class="ring" aria-hidden="true"></span>{h.won(fmt(ping.n))}</span>{/key}{/if}
				{#if line}{#key line + p.say?.at}<span class="lobby-say font-head">{h.says[line]}</span>{/key}{/if}
				{#if wv}{#key wv.at}<span class="lobby-wave" aria-label={h.waveTo(nameOf(wv.to))}>👋<small>{nameOf(wv.to)}</small></span>{/key}{/if}
				<button type="button" class="lobby-btn" aria-expanded={menu === id} aria-label={id === meId ? h.sayLabel : h.menuFor(p.name)} onclick={() => tap(id)}>
					<HangOp {id} name={p.name} op={p.op} size={58} />
				</button>
				<span class="lobby-name font-head">{id === meId ? h.you : p.name}</span>
				{#if menu === id}
					<div class="lobby-menu" role="group" aria-label={id === meId ? h.sayLabel : h.menuFor(p.name)}>
						{#if id === meId}
							{#each SAYS as k (k)}<button type="button" class="chip" onclick={() => say(k)}>{h.says[k]}</button>{/each}
						{:else}
							<button type="button" class="btn btn-sm" onclick={() => wave(id)}>👋 {h.waveTo(p.name)}</button>
							{#if hasHo(id)}<button type="button" class="btn btn-sm" onclick={() => ((menu = null), onVisit(id))}>🏠 {h.visit(p.name)}</button>{/if}
						{/if}
					</div>
				{/if}
			</li>
		{/each}
	</ul>

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
			repeating-linear-gradient(90deg, rgb(255 255 255 / 0.025) 0 18px, transparent 18px 36px),
			linear-gradient(180deg, #2b0c2a, #170616);
		box-shadow: inset 0 0 0 3px rgb(0 0 0 / 0.25);
	}
	.lobby-head {
		display: flex;
		align-items: baseline;
		gap: 10px;
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
	.lobby-alone {
		font-size: 12.5px;
		color: var(--t-muted);
	}
	.lobby-floor {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 10px;
		padding: 34px 4px 4px;
		/* the carpet they stand on */
		background: linear-gradient(180deg, transparent 62%, rgb(140 20 60 / 0.45) 62%, rgb(80 8 40 / 0.6));
		border-radius: 10px;
	}
	.lobby-op {
		position: relative;
		flex: none;
		display: grid;
		justify-items: center;
		gap: 2px;
		width: 92px;
		padding-top: 4px;
	}
	.lobby-sign {
		max-width: 92px;
		padding: 2px 7px;
		border-radius: 6px;
		border: 1px solid rgb(255 201 40 / 0.7);
		background: #120410;
		color: #ffe9a6;
		font-size: 10.5px;
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		box-shadow: 0 0 8px rgb(255 190 40 / 0.25);
	}
	.lobby-op.me .lobby-sign {
		border-color: #5dff86;
		color: #c9ffd6;
	}
	.lobby-btn {
		display: grid;
		place-items: center;
		min-width: 64px;
		min-height: 64px;
		border-radius: 50%;
		cursor: pointer;
		transition: transform 0.15s;
	}
	.lobby-btn:hover {
		transform: translateY(-2px);
	}
	.lobby-name {
		max-width: 92px;
		font-size: 11.5px;
		font-weight: 700;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.lobby-ping {
		position: absolute;
		top: -30px;
		z-index: 3;
		padding: 3px 9px;
		border-radius: 999px;
		background: linear-gradient(180deg, #ffe066, #ffb400);
		color: #2a1400;
		font-size: 13px;
		font-weight: 900;
		white-space: nowrap;
		box-shadow: 0 0 16px rgb(255 200 40 / 0.8);
		animation: ping-pop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both, ping-float 9s ease-out both;
	}
	.lobby-ping .ring {
		position: absolute;
		inset: -6px;
		border-radius: 999px;
		border: 2px solid #ffe066;
		opacity: 0;
		animation: ping-ring 0.9s ease-out 3;
		pointer-events: none;
	}
	@keyframes ping-pop {
		from {
			transform: scale(0.2);
		}
	}
	@keyframes ping-float {
		0%,
		85% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			translate: 0 -10px;
		}
	}
	@keyframes ping-ring {
		from {
			opacity: 1;
			transform: scale(0.8);
		}
		to {
			opacity: 0;
			transform: scale(1.5);
		}
	}
	.lobby-say {
		position: absolute;
		top: 12px;
		left: 56px;
		z-index: 2;
		padding: 3px 8px;
		border-radius: 10px 10px 10px 2px;
		background: #fff;
		color: #1a0a18;
		font-size: 11px;
		font-weight: 800;
		white-space: nowrap;
		animation: ping-pop 0.35s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	.lobby-wave {
		position: absolute;
		top: 30px;
		left: 2px;
		z-index: 2;
		display: grid;
		justify-items: center;
		font-size: 22px;
		line-height: 1;
		animation: wave 0.6s ease-in-out 4;
		transform-origin: 70% 90%;
	}
	.lobby-wave small {
		font-size: 9px;
		font-weight: 700;
		color: #ffe9a6;
	}
	@keyframes wave {
		50% {
			transform: rotate(-22deg);
		}
	}
	.lobby-menu {
		position: absolute;
		top: 100%;
		z-index: 5;
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		width: max-content;
		max-width: 260px;
		padding: 6px;
		border-radius: 10px;
		border: 1px solid rgb(255 201 40 / 0.6);
		background: #1e0a1c;
		box-shadow: 0 8px 20px rgb(0 0 0 / 0.5);
	}
	.lobby-op:first-child .lobby-menu {
		left: 0;
	}
	.lobby-menu .chip,
	.lobby-menu .btn {
		min-height: 36px;
	}
	@media (prefers-reduced-motion: reduce) {
		.lobby-ping,
		.lobby-ping .ring,
		.lobby-say,
		.lobby-wave {
			animation: none;
		}
	}
</style>
