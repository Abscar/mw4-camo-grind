<!--
	The casino floor from above (floorMap.ts; 2026-11-28, the user: "lobbyn … så man ser den ovanifrån. Typ som man
	ser på gamla Pokémon-spel … visualisera kasino-lobbyn. Inte bara en grön plattmark"). Our own top-down map in
	the old handheld-RPG style: carpet, marble aisles, a neon sign, the six slot machine rows, the roulette and
	blackjack tables, the Case Battles crates, the bank counter, the donation jar, the staff door, the lobby
	fountain and a corridor of hideout doors. Everyone in the casino stands where they play and walks there when
	they switch; tap a place to go there, a door to visit that hideout, a person to wave (or yourself to say
	something). Phones scroll it sideways.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { hangout } from '#lib/hangout.svelte.ts';
	import { pingOn, sayOn, waveOn, SAYS, type Say } from '#lib/hangout.ts';
	import { hasHideout } from '#lib/hideout.ts';
	import { DOORS, DOOR_Y, MAP_H, MAP_W, ZONES, doorX, spots, type Zone } from '#lib/floorMap.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import HangOp from './HangOp.svelte';

	let { games, game, onPick, onVisit }: { games: Record<string, string>; game: string; onPick: (g: string) => void; onVisit: (memberId: string) => void } = $props();
	const h = t.hang;
	const m = t.hang.map;
	const uid = $props.id();
	const meId = $derived(squad.me?.id ?? null);
	const people = $derived(hangout.people);
	const isAdmin = $derived(squad.entries.find((e) => e.id === meId)?.member.op === 'abscar');
	const zones = $derived(ZONES.filter((z) => z.id !== 'admin' || isAdmin || people.some(([, p]) => p.w === 'admin')));
	/** Hideout doors: squad members who own one (you first). */
	const doors = $derived(
		squad.entries
			.filter((e) => hasHideout(e.mine ? squad.hideout : e.member.hideout))
			.sort((a, b) => (a.mine ? -1 : b.mine ? 1 : a.member.name.localeCompare(b.member.name)))
			.slice(0, DOORS)
			.map((e) => ({ id: e.id, name: e.mine ? h.you : e.member.name }))
	);
	const where = $derived(spots(people.map(([id, p]) => ({ id, w: p.w })), doors.map((d) => d.id)));
	const nameOf = (id: string) => squad.entries.find((e) => e.id === id)?.member.name ?? people.find(([x]) => x === id)?.[1].name ?? '?';
	function whereText(w: string): string {
		if (w.startsWith('ho:')) return h.inHideout(nameOf(w.slice(3)));
		return games[w] ?? h.inLobby;
	}
	const hasHo = (id: string) => hasHideout(squad.entries.find((e) => e.id === id)?.member.hideout);
	const pct = (x: number, y: number) => `left:${(x / MAP_W) * 100}%;top:${(y / MAP_H) * 100}%`;
	const box = (z: Pick<Zone, 'x' | 'y' | 'w' | 'h'>) => `left:${(z.x / MAP_W) * 100}%;top:${(z.y / MAP_H) * 100}%;width:${(z.w / MAP_W) * 100}%;height:${(z.h / MAP_H) * 100}%`;

	let width = $state(800);
	const sz = $derived(Math.round(Math.max(28, Math.min(58, width * 0.052))));

	/** Walking: a little bob while someone moves to a new place. */
	let walking = $state<Record<string, boolean>>({});
	const last = new Map<string, string>();
	$effect(() => {
		for (const [id, [x, y]] of where) {
			const key = `${x},${y}`;
			const was = last.get(id);
			last.set(id, key);
			if (was && was !== key) {
				walking = { ...walking, [id]: true };
				setTimeout(() => (walking = { ...walking, [id]: false }), 1500);
			}
		}
	});

	let menu = $state<string | null>(null);
	async function wave(id: string) {
		menu = null;
		if (await hangout.wave(id)) toast.show(h.waved(nameOf(id)));
	}
	async function say(k: Say) {
		menu = null;
		await hangout.say(k);
	}
	const fmt = (n: number) => n.toLocaleString('en-US');

	/** Phones: scroll the map so you are in view. */
	let scroller = $state<HTMLElement>();
	let scrolled = false;
	$effect(() => {
		const me = meId ? where.get(meId) : null;
		if (!scroller || !me || scrolled || scroller.scrollWidth <= scroller.clientWidth) return;
		scrolled = true;
		scroller.scrollLeft = (me[0] / MAP_W) * scroller.scrollWidth - scroller.clientWidth / 2;
	});
	const CARPET = ['#4a0f3a', '#5a1446'];
</script>

<div class="fm-scroll" bind:this={scroller}>
	<div class="fm" bind:clientWidth={width} style:--sz="{sz}px">
		<svg class="fm-art" viewBox="0 0 {MAP_W} {MAP_H}" aria-hidden="true" focusable="false">
			<defs>
				<pattern id="{uid}-carpet" width="8" height="8" patternUnits="userSpaceOnUse">
					<rect width="8" height="8" fill={CARPET[0]} />
					<path d="M4 0 L8 4 L4 8 L0 4Z" fill={CARPET[1]} />
					<rect x="3.5" y="3.5" width="1" height="1" fill="#ffc928" opacity="0.6" />
				</pattern>
				<pattern id="{uid}-marble" width="10" height="10" patternUnits="userSpaceOnUse">
					<rect width="10" height="10" fill="#d9d2c4" />
					<rect width="5" height="5" fill="#cfc6b6" /><rect x="5" y="5" width="5" height="5" fill="#cfc6b6" />
				</pattern>
				<pattern id="{uid}-brick" width="12" height="6" patternUnits="userSpaceOnUse">
					<rect width="12" height="6" fill="#2a0c22" />
					<path d="M0 0.5 H12 M0 3.5 H12 M3 0.5 V3.5 M9 3.5 V6.5" stroke="#16040f" stroke-width="1" />
				</pattern>
				<pattern id="{uid}-plank" width="16" height="6" patternUnits="userSpaceOnUse">
					<rect width="16" height="6" fill="#6a3f1f" /><path d="M0 5.5 H16 M10 0 V5.5" stroke="#4a2a12" stroke-width="1" />
				</pattern>
			</defs>
			<g shape-rendering="crispEdges">
				<!-- floor: carpet, marble aisles, the hideout corridor's planks -->
				<rect width={MAP_W} height={MAP_H} fill="url(#{uid}-carpet)" />
				<rect x="168" y="16" width="14" height="152" fill="url(#{uid}-marble)" />
				<rect x="4" y="112" width="312" height="10" fill="url(#{uid}-marble)" />
				<rect x="4" y="122" width="164" height="46" fill="url(#{uid}-plank)" />
				<!-- walls -->
				<rect width={MAP_W} height="16" fill="url(#{uid}-brick)" />
				<rect y="15" width={MAP_W} height="2" fill="#ffc928" opacity="0.8" />
				<rect width="4" height={MAP_H} fill="#16040f" /><rect x={MAP_W - 4} width="4" height={MAP_H} fill="#16040f" />
				<rect y="168" width={MAP_W} height="8" fill="url(#{uid}-brick)" />
			</g>
			<!-- the neon sign over the entrance -->
			<rect x="118" y="2" width="84" height="12" rx="2" fill="#12040f" stroke="#ff3fd8" stroke-width="0.8" />
			<text class="fm-neon" x="160" y="10.6" text-anchor="middle" font-size="7.5" font-weight="900" fill="#ffe6ff" font-family="ui-monospace, Consolas, monospace" letter-spacing="0.6">BURGICASINO</text>

			{#each zones as z (z.id)}
				{#if z.kind === 'slot'}
					<!-- three cabinets from above, a stool in front of each -->
					{#each [0, 1, 2] as i (i)}
						{@const cx = z.x + i * 16}
						<g shape-rendering="crispEdges">
							<rect x={cx} y={z.y} width="14" height="18" fill="#1a0a16" />
							<rect x={cx} y={z.y} width="14" height="4" fill={z.color} class="fm-lights" style:--d="{i * 0.3}s" />
							<rect x={cx + 2} y={z.y + 6} width="10" height="6" fill="#fff8e0" />
							<rect x={cx + 3} y={z.y + 8} width="2" height="2" fill={z.color} /><rect x={cx + 6} y={z.y + 8} width="2" height="2" fill="#ffc928" /><rect x={cx + 9} y={z.y + 8} width="2" height="2" fill={z.color} />
							<rect x={cx + 13} y={z.y + 7} width="2" height="6" fill="#c9c9c9" />
						</g>
						<circle cx={cx + 7} cy={z.y + 30} r="2.6" fill="#c0283a" stroke="#3a0a14" stroke-width="0.6" />
					{/each}
				{:else if z.kind === 'roulette'}
					<ellipse cx={z.x + 26} cy={z.y + 19} rx="26" ry="16" fill="#5a2a12" />
					<ellipse cx={z.x + 26} cy={z.y + 19} rx="23" ry="13" fill={z.color} />
					<rect x={z.x + 8} y={z.y + 13} width="22" height="12" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.6" />
					<g class="fm-spin" style:transform-origin="{z.x + 40}px {z.y + 19}px">
						<circle cx={z.x + 40} cy={z.y + 19} r="8" fill="#3a1a0a" />
						{#each Array.from({ length: 8 }, (_, i) => i) as i (i)}<path d="M{z.x + 40} {z.y + 19} L{z.x + 40 + 7 * Math.cos((i * Math.PI) / 4)} {z.y + 19 + 7 * Math.sin((i * Math.PI) / 4)}" stroke={i % 2 ? '#d0142c' : '#111'} stroke-width="2.4" />{/each}
						<circle cx={z.x + 40} cy={z.y + 19} r="2" fill="#ffc928" />
					</g>
					{#each [[z.x + 14, z.y + 16, '#ff3f3f'], [z.x + 20, z.y + 21, '#3f7fff'], [z.x + 25, z.y + 15, '#ffc928']] as [x, y, c] (x)}<circle cx={x} cy={y} r="1.6" fill={String(c)} stroke="#fff" stroke-width="0.4" />{/each}
				{:else if z.kind === 'blackjack'}
					<path d="M{z.x} {z.y + 4} H{z.x + z.w} V{z.y + 12} A{z.w / 2} 20 0 0 1 {z.x} {z.y + 12} Z" fill="#4a2410" />
					<path d="M{z.x + 3} {z.y + 6} H{z.x + z.w - 3} V{z.y + 12} A{z.w / 2 - 3} 17 0 0 1 {z.x + 3} {z.y + 12} Z" fill={z.color} />
					<rect x={z.x + 22} y={z.y + 6} width="10" height="4" fill="#111" opacity="0.7" />
					{#each [0, 1, 2, 3, 4] as i (i)}<rect x={z.x + 6 + i * 9} y={z.y + 18 + (i === 2 ? 4 : i % 2 ? 3 : 0)} width="5" height="7" fill="#fff" stroke="#999" stroke-width="0.3" />{/each}
				{:else if z.kind === 'cases'}
					<ellipse cx={z.x + 29} cy={z.y + 16} rx="30" ry="14" fill="#ffd27a" opacity="0.14" class="fm-glow" />
					{#each [[0, 6], [16, 2], [32, 6], [8, 14], [24, 14]] as [dx, dy], i (i)}
						<g shape-rendering="crispEdges">
							<rect x={z.x + 6 + dx} y={z.y + dy} width="14" height="12" fill={i % 2 ? '#c97a1a' : '#e0a03a'} stroke="#5a3008" stroke-width="0.8" />
							<path d="M{z.x + 6 + dx} {z.y + dy + 6} H{z.x + 20 + dx} M{z.x + 13 + dx} {z.y + dy} V{z.y + dy + 12}" stroke="#5a3008" stroke-width="0.8" />
						</g>
					{/each}
				{:else if z.kind === 'bank'}
					<circle cx={z.x + 27} cy={z.y + 4} r="8" fill="#9aa6ae" stroke="#4a5058" stroke-width="1.4" />
					<circle cx={z.x + 27} cy={z.y + 4} r="2.4" fill="#4a5058" />
					<g shape-rendering="crispEdges"><rect x={z.x} y={z.y + 12} width={z.w} height="10" fill={z.color} /><rect x={z.x} y={z.y + 12} width={z.w} height="2" fill="#ffc928" /></g>
					{#each [8, 22, 36] as dx (dx)}<rect x={z.x + dx} y={z.y + 16} width="8" height="3" fill="#bfe0ff" opacity="0.7" />{/each}
				{:else if z.kind === 'donate'}
					<rect x={z.x + 6} y={z.y + 4} width="16" height="18" rx="4" fill="#bfe8ff" fill-opacity="0.35" stroke="#e8f8ff" stroke-width="0.8" />
					<rect x={z.x + 5} y={z.y + 2} width="18" height="3" fill="#c9c9c9" />
					{#each [[10, 18], [16, 16], [12, 13]] as [dx, dy] (dx + '' + dy)}<circle cx={z.x + dx} cy={z.y + dy} r="2.6" fill="#e8a23a" stroke="#7a3a10" stroke-width="0.5" />{/each}
					<path d="M{z.x + 14} {z.y + 10} l-2 -2 a1.4 1.4 0 0 1 2 -2 a1.4 1.4 0 0 1 2 2z" fill="#ff5c9a" />
				{:else if z.kind === 'admin'}
					<g shape-rendering="crispEdges"><rect x={z.x + 4} y={z.y + 2} width="18" height="14" fill="#5a0a10" /><rect x={z.x + 5} y={z.y + 3} width="16" height="12" fill="#8a1420" /></g>
					<text x={z.x + 13} y={z.y + 11} text-anchor="middle" font-size="3.6" font-weight="900" fill="#ffd0d0" font-family="ui-monospace, Consolas, monospace">STAFF</text>
				{:else if z.kind === 'lobby'}
					<!-- the burger fountain with sofas round it -->
					<path d="M{z.x + 36} {z.y + 8} h24 l8 8 v12 l-8 8 h-24 l-8 -8 v-12z" fill="#9aa6ae" stroke="#4a5058" stroke-width="1" />
					<path d="M{z.x + 38} {z.y + 11} h20 l6 6 v10 l-6 6 h-20 l-6 -6 v-10z" fill="#3fb8ff" />
					<ellipse class="fm-ripple" cx={z.x + 48} cy={z.y + 22} rx="9" ry="6" fill="none" stroke="#bfefff" stroke-width="0.8" />
					<circle cx={z.x + 48} cy={z.y + 22} r="4" fill="#e8a23a" stroke="#7a3a10" stroke-width="0.6" /><rect x={z.x + 44} y={z.y + 21.4} width="8" height="1.4" fill="#5a2a0a" />
					<g shape-rendering="crispEdges">
						<rect x={z.x + 6} y={z.y + 8} width="10" height="22" fill="#7a1430" /><rect x={z.x + 6} y={z.y + 8} width="3" height="22" fill="#5a0a20" />
						<rect x={z.x + 80} y={z.y + 8} width="10" height="22" fill="#7a1430" /><rect x={z.x + 87} y={z.y + 8} width="3" height="22" fill="#5a0a20" />
					</g>
					<circle cx={z.x + 4} cy={z.y + 4} r="4" fill="#2f9a3f" /><circle cx={z.x + 92} cy={z.y + 4} r="4" fill="#2f9a3f" />
				{/if}
				{#if z.kind !== 'lobby' && z.kind !== 'hideout' && z.kind !== 'admin'}
					<!-- the name plate -->
					<text class="fm-label" x={z.x + z.w / 2} y={z.y - 2.2} text-anchor="middle" font-size="5" font-weight="800" font-family="ui-monospace, Consolas, monospace">{games[z.id] ?? z.id}</text>
				{/if}
			{/each}
			<text class="fm-label" x="220" y="126" text-anchor="middle" font-size="5" font-weight="800" font-family="ui-monospace, Consolas, monospace">{m.lobby}</text>
			<text class="fm-label" x="86" y="129" text-anchor="middle" font-size="5" font-weight="800" font-family="ui-monospace, Consolas, monospace">{m.hideouts}</text>

			<!-- hideout doors -->
			{#each Array.from({ length: DOORS }, (_, i) => i) as i (i)}
				{@const d = doors[i]}
				<g shape-rendering="crispEdges">
					<rect x={doorX(i) - 7} y={DOOR_Y - 8} width="14" height="16" fill={d ? '#7a4a22' : '#3a2416'} stroke="#2a1408" stroke-width="0.8" />
					<rect x={doorX(i) + 3} y={DOOR_Y - 1} width="2" height="2" fill="#ffc928" />
				</g>
				{#if d}
					<rect x={doorX(i) - 11} y={DOOR_Y - 14} width="22" height="5" rx="1" fill="#12040f" stroke="#ff9a3a" stroke-width="0.5" />
					<text x={doorX(i)} y={DOOR_Y - 10.4} text-anchor="middle" font-size="3.4" font-weight="800" fill="#ffd8a0" font-family="ui-monospace, Consolas, monospace">{d.name.slice(0, 9)}</text>
				{/if}
			{/each}
		</svg>

		<!-- places you can tap -->
		{#each zones as z (z.id)}
			{#if z.id !== 'lobby' && z.id !== 'hideout'}
				<button type="button" class="fm-zone" class:here={game === z.id} style={box(z)} aria-label={m.goTo(games[z.id] ?? z.id)} title={games[z.id]} onclick={() => onPick(z.id)}></button>
			{/if}
		{/each}
		<button type="button" class="fm-zone" class:here={game === 'hideout'} style={box({ x: 8, y: 124, w: 156, h: 26 })} aria-label={m.goTo(games.hideout)} onclick={() => onPick('hideout')}></button>
		{#each doors as d, i (d.id)}
			<button type="button" class="fm-zone fm-door" style={box({ x: doorX(i) - 9, y: DOOR_Y - 15, w: 18, h: 25 })} aria-label={t.hang.visit(d.name)} onclick={() => onVisit(d.id)}></button>
		{/each}

		<!-- the people -->
		{#each people as [id, p] (id)}
			{@const at = where.get(id) ?? [220, 150]}
			{@const ping = pingOn(p, hangout.now)}
			{@const line = sayOn(p, hangout.now)}
			{@const wv = waveOn(p, hangout.now)}
			<div class="fm-op" class:me={id === meId} class:walking={walking[id]} class:low={at[1] > MAP_H * 0.6} style={pct(at[0], at[1])} data-op={id}>
				{#if ping}{#key ping.at}<span class="fm-ping font-head" role="status"><span class="ring" aria-hidden="true"></span>{h.won(fmt(ping.n))}</span>{/key}{/if}
				{#if line}{#key `${line}${p.say?.at}`}<span class="fm-say font-head">{h.says[line]}</span>{/key}{/if}
				{#if wv}{#key wv.at}<span class="fm-wave" aria-label={h.waveTo(nameOf(wv.to))}>👋</span>{/key}{/if}
				<span class="fm-sign font-head" title={whereText(p.w)}>{whereText(p.w)}</span>
				<button type="button" class="fm-who" aria-expanded={menu === id} aria-label={id === meId ? h.sayLabel : h.menuFor(p.name)} onclick={() => (menu = menu === id ? null : id)}>
					<span class="fm-shadow" aria-hidden="true"></span>
					<HangOp {id} name={p.name} op={p.op} size={sz} />
				</button>
				<span class="fm-name font-head">{id === meId ? h.you : p.name}</span>
				{#if menu === id}
					<div class="fm-menu" role="group" aria-label={id === meId ? h.sayLabel : h.menuFor(p.name)}>
						{#if id === meId}
							{#each SAYS as k (k)}<button type="button" class="chip" onclick={() => say(k)}>{h.says[k]}</button>{/each}
						{:else}
							<button type="button" class="btn btn-sm" onclick={() => wave(id)}>👋 {h.waveTo(p.name)}</button>
							{#if hasHo(id)}<button type="button" class="btn btn-sm" onclick={() => ((menu = null), onVisit(id))}>🏠 {h.visit(p.name)}</button>{/if}
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.fm-scroll {
		overflow-x: auto;
		overflow-y: hidden;
		border-radius: 12px;
		border: 2px solid #12040f;
		box-shadow: 0 0 0 1.5px rgb(255 201 40 / 0.5);
		scrollbar-width: thin;
	}
	.fm {
		position: relative;
		width: 100%;
		min-width: 640px;
		max-width: 1080px;
		margin-inline: auto;
		aspect-ratio: 320 / 176;
	}
	.fm-art {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
	.fm-label {
		fill: #fff3dc;
		stroke: #12040f;
		stroke-width: 1.4px;
		paint-order: stroke;
	}
	.fm-neon {
		filter: drop-shadow(0 0 1.5px #ff3fd8);
		animation: fm-flick 5s infinite;
	}
	.fm-lights {
		animation: fm-blink 1.4s steps(2) infinite var(--d);
	}
	.fm-spin {
		animation: fm-spin 6s linear infinite;
	}
	.fm-ripple {
		transform-box: fill-box;
		transform-origin: center;
		animation: fm-ripple 2.4s ease-out infinite;
	}
	.fm-glow {
		animation: fm-blink 3s ease-in-out infinite;
	}
	@keyframes fm-flick {
		0%,
		90%,
		94%,
		100% {
			opacity: 1;
		}
		92% {
			opacity: 0.45;
		}
	}
	@keyframes fm-blink {
		50% {
			opacity: 0.55;
		}
	}
	@keyframes fm-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes fm-ripple {
		from {
			transform: scale(0.5);
			opacity: 1;
		}
		to {
			transform: scale(1.3);
			opacity: 0;
		}
	}
	.fm-zone {
		position: absolute;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.15s, box-shadow 0.15s;
	}
	.fm-zone:hover,
	.fm-zone:focus-visible {
		background: rgb(255 255 255 / 0.1);
		box-shadow: inset 0 0 0 1.5px rgb(255 230 140 / 0.8);
	}
	.fm-zone.here {
		box-shadow: inset 0 0 0 2px #5dff86;
		background: rgb(93 255 134 / 0.08);
	}
	.fm-op {
		position: absolute;
		z-index: 2;
		display: grid;
		justify-items: center;
		transform: translate(-50%, -88%);
		transition:
			left 1.4s linear,
			top 1.4s linear;
		pointer-events: none;
	}
	.fm-op.me {
		z-index: 3;
	}
	.fm-op > * {
		pointer-events: auto;
	}
	.fm-op.walking .fm-who {
		animation: fm-walk 0.28s steps(2) infinite;
	}
	@keyframes fm-walk {
		50% {
			transform: translateY(-2px);
		}
	}
	.fm-who {
		position: relative;
		display: grid;
		place-items: center;
		min-width: 36px;
		min-height: 36px;
		cursor: pointer;
	}
	.fm-shadow {
		position: absolute;
		left: 18%;
		right: 18%;
		bottom: 1px;
		height: 18%;
		border-radius: 50%;
		background: rgb(0 0 0 / 0.45);
	}
	.fm-sign {
		max-width: 96px;
		padding: 0 4px;
		border-radius: 3px;
		border: 1px solid rgb(255 201 40 / 0.7);
		background: #120410;
		color: #ffe9a6;
		font-size: 9px;
		font-weight: 700;
		line-height: 1.5;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.fm-op.me .fm-sign {
		border-color: #5dff86;
		color: #c9ffd6;
	}
	.fm-name {
		margin-top: -3px;
		padding: 0 4px;
		border-radius: 3px;
		background: rgb(0 0 0 / 0.65);
		color: #fff;
		font-size: 9.5px;
		font-weight: 700;
		line-height: 1.4;
		white-space: nowrap;
	}
	.fm-op.me .fm-name {
		color: #7dffcf;
	}
	.fm-ping {
		position: absolute;
		bottom: calc(100% + 2px);
		z-index: 4;
		padding: 2px 8px;
		border-radius: 999px;
		background: linear-gradient(180deg, #ffe066, #ffb400);
		color: #2a1400;
		font-size: 12px;
		font-weight: 900;
		white-space: nowrap;
		box-shadow: 0 0 14px rgb(255 200 40 / 0.85);
		animation:
			fm-pop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both,
			fm-float 9s ease-out both;
	}
	.fm-ping .ring {
		position: absolute;
		inset: -5px;
		border-radius: 999px;
		border: 2px solid #ffe066;
		opacity: 0;
		animation: fm-ring 0.9s ease-out 3;
	}
	.fm-say {
		position: absolute;
		bottom: 72%;
		left: 70%;
		z-index: 4;
		padding: 2px 7px;
		border-radius: 9px 9px 9px 2px;
		background: #fff;
		color: #1a0a18;
		font-size: 10.5px;
		font-weight: 800;
		white-space: nowrap;
		animation: fm-pop 0.35s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	.fm-wave {
		position: absolute;
		top: 30%;
		right: 76%;
		z-index: 4;
		font-size: 18px;
		line-height: 1;
		animation: fm-wave 0.6s ease-in-out 4;
		transform-origin: 70% 90%;
	}
	@keyframes fm-pop {
		from {
			transform: scale(0.2);
		}
	}
	@keyframes fm-float {
		0%,
		85% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			translate: 0 -8px;
		}
	}
	@keyframes fm-ring {
		from {
			opacity: 1;
			transform: scale(0.8);
		}
		to {
			opacity: 0;
			transform: scale(1.5);
		}
	}
	@keyframes fm-wave {
		50% {
			transform: rotate(-22deg);
		}
	}
	.fm-menu {
		position: absolute;
		top: 100%;
		z-index: 6;
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		width: max-content;
		max-width: 240px;
		padding: 6px;
		border-radius: 10px;
		border: 1px solid rgb(255 201 40 / 0.6);
		background: #1e0a1c;
		box-shadow: 0 8px 20px rgb(0 0 0 / 0.5);
	}
	.fm-op.low .fm-menu {
		top: auto;
		bottom: 100%;
	}
	.fm-menu .chip,
	.fm-menu .btn {
		min-height: 36px;
	}
	@media (prefers-reduced-motion: reduce) {
		.fm-neon,
		.fm-lights,
		.fm-spin,
		.fm-ripple,
		.fm-glow,
		.fm-op.walking .fm-who,
		.fm-ping,
		.fm-ping .ring,
		.fm-say,
		.fm-wave {
			animation: none;
		}
		.fm-op {
			transition: none;
		}
	}
</style>
