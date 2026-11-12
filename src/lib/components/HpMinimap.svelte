<!--
	Our own rough Hardpoint minimap (2026-11-12, the user's ask: "show the hardpoints on a minimap too").
	A coarse outline of the playable area + the hills as P-pills + the rotation as curved arrows: the
	longest run red, the shortest green, the loop back to P1 dashed. Spots come from ranked.ts (read off
	a guide's hill diagram); no buildings and no game art, so it's labelled "rough" next to it.
-->
<script lang="ts">
	import type { HpRotation, Pt } from '#lib/data/ranked.ts';
	import { t } from '#lib/i18n/en.ts';

	let { r }: { r: HpRotation } = $props();
	const uid = $props.id();

	const PAD = 34;
	const box = $derived.by(() => {
		const all = [...r.outline, ...r.hills.map((h) => h.at)];
		const xs = all.map((p) => p[0]);
		const ys = all.map((p) => p[1]);
		const x = Math.min(...xs) - PAD;
		const y = Math.min(...ys) - PAD;
		return { x, y, w: Math.max(...xs) + PAD - x, h: Math.max(...ys) + PAD - y };
	});
	/** Pill half-height in map units: the same on-screen size whatever the map's units. */
	const u = $derived(Math.max(box.w, box.h) / 25);

	const poly = (p: Pt[]) => p.map(([x, y]) => `${x},${y}`).join(' ');
	const f = (n: number) => Math.round(n * 10) / 10;

	type Leg = { d: string; head: string | null; kind: 'long' | 'short' | 'loop' | '' };
	const legs = $derived.by((): Leg[] => {
		const n = r.hills.length;
		return r.hills.map((h, i) => {
			const [ax, ay] = h.at;
			const [bx, by] = r.hills[(i + 1) % n].at;
			const dx = bx - ax;
			const dy = by - ay;
			const len = Math.hypot(dx, dy) || 1;
			const ux = dx / len;
			const uy = dy / len;
			// bend every leg to its right, so A → B and B → A never lie on top of each other
			const bend = Math.min(len * 0.2, u * 3.2);
			const cx = (ax + bx) / 2 - uy * bend;
			const cy = (ay + by) / 2 + ux * bend;
			// start and end just outside the pills
			const gap = u * 1.5;
			const sx = ax + ux * gap;
			const sy = ay + uy * gap;
			const ex = bx - ux * gap;
			const ey = by - uy * gap;
			// the arrowhead a bit past the middle, along the curve
			const tt = 0.56;
			const px = (1 - tt) ** 2 * sx + 2 * (1 - tt) * tt * cx + tt ** 2 * ex;
			const py = (1 - tt) ** 2 * sy + 2 * (1 - tt) * tt * cy + tt ** 2 * ey;
			const tx = 2 * (1 - tt) * (cx - sx) + 2 * tt * (ex - cx);
			const ty = 2 * (1 - tt) * (cy - sy) + 2 * tt * (ey - cy);
			const tl = Math.hypot(tx, ty) || 1;
			const hx = tx / tl;
			const hy = ty / tl;
			const a = u * 0.85;
			const head = [
				[px + hx * a, py + hy * a],
				[px - hx * a * 0.7 - hy * a * 0.75, py - hy * a * 0.7 + hx * a * 0.75],
				[px - hx * a * 0.7 + hy * a * 0.75, py - hy * a * 0.7 - hx * a * 0.75]
			]
				.map(([x, y]) => `${f(x)},${f(y)}`)
				.join(' ');
			const kind = r.longest.from === i + 1 ? 'long' : r.shortest?.from === i + 1 ? 'short' : i === n - 1 ? 'loop' : '';
			// on a very short leg the head would sit on the pills; the line alone says enough there
			return { d: `M${f(sx)} ${f(sy)} Q${f(cx)} ${f(cy)} ${f(ex)} ${f(ey)}`, head: len - 2 * gap > u * 3 ? head : null, kind };
		});
	});
</script>

<figure class="hp-map">
	<svg
		viewBox="{box.x} {box.y} {box.w} {box.h}"
		role="img"
		aria-label={t.ranked.hp.mapLabel(r.map, r.hills.length)}
		style:--u="{u}px"
	>
		<defs>
			<pattern id="{uid}-grid" width={u * 3} height={u * 3} patternUnits="userSpaceOnUse">
				<path d="M{u * 3} 0H0V{u * 3}" class="grid-line" stroke-width={u * 0.08} />
			</pattern>
			<clipPath id="{uid}-clip"><polygon points={poly(r.outline)} /></clipPath>
		</defs>

		<!-- the playable area -->
		<polygon points={poly(r.outline)} class="area" />
		<rect x={box.x} y={box.y} width={box.w} height={box.h} fill="url(#{uid}-grid)" clip-path="url(#{uid}-clip)" />
		{#if r.water}<polygon points={poly(r.water)} class="water" />{/if}
		<polygon points={poly(r.outline)} class="edge" stroke-width={u * 0.18} />

		<!-- north -->
		<g transform="translate({box.x + box.w - u * 1.6} {box.y + u * 1.4})" class="north">
			<path d="M0 {-u * 1.1} L{u * 0.6} {u * 0.5} L0 {u * 0.15} L{-u * 0.6} {u * 0.5}Z" />
			<text y={u * 1.75} font-size={u * 0.95} text-anchor="middle">N</text>
		</g>

		<!-- the rotation -->
		<!-- a dark casing under every leg first, so crossings stay readable -->
		{#each legs as l, i (i)}
			<path d={l.d} class="leg-case" stroke-width={u * (l.kind === 'long' ? 0.78 : 0.64)} />
		{/each}
		{#each legs as l, i (i)}
			<g class="leg {l.kind}">
				<path d={l.d} class="leg-line" stroke-width={u * (l.kind === 'long' ? 0.42 : 0.3)} stroke-dasharray={l.kind === 'loop' ? `${u * 0.7} ${u * 0.5}` : undefined} />
				{#if l.head}<polygon points={l.head} class="leg-head" stroke-width={u * 0.14} />{/if}
			</g>
		{/each}

		<!-- the hills -->
		{#each r.hills as h, i (i)}
			<g transform="translate({h.at[0]} {h.at[1]})" class="hill">
				<title>P{i + 1}: {h.name}</title>
				<rect x={-u * 1.35} y={-u * 0.95} width={u * 2.7} height={u * 1.9} rx={u * 0.95} stroke-width={u * 0.16} />
				<text y={u * 0.36} font-size={u * 1.02} text-anchor="middle">P{i + 1}</text>
			</g>
		{/each}
	</svg>
	<figcaption class="mt-1 flex flex-wrap items-center justify-between gap-x-3 text-[11px] text-muted">
		<span>{t.ranked.hp.mapNote}</span>
		<a class="map-link" href={r.guide} target="_blank" rel="noopener noreferrer"
			>{t.ranked.hp.mapLink}<span aria-hidden="true"> ↗</span><span class="sr-only"> {t.news.newTab}</span></a
		>
	</figcaption>
</figure>

<style>
	.hp-map {
		margin: 8px 0 4px;
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
		max-height: 260px;
		border-radius: 8px;
		background: color-mix(in srgb, var(--t-bg) 70%, #000);
	}
	.area {
		fill: color-mix(in srgb, var(--t-fg) 9%, transparent);
	}
	.grid-line {
		fill: none;
		stroke: color-mix(in srgb, var(--t-fg) 10%, transparent);
	}
	.water {
		fill: color-mix(in srgb, #3a8bd8 40%, transparent);
	}
	.edge {
		fill: none;
		stroke: color-mix(in srgb, var(--t-fg) 55%, transparent);
		stroke-linejoin: round;
	}
	.north {
		fill: color-mix(in srgb, var(--t-fg) 75%, transparent);
		font-weight: 800;
	}
	.leg {
		--leg: #ffcc33;
	}
	.leg.long {
		--leg: #ff4d3d;
	}
	.leg.short {
		--leg: #3ee06a;
	}
	.leg-line {
		fill: none;
		stroke: var(--leg);
		stroke-linecap: round;
		opacity: 0.9;
	}
	.leg.loop .leg-line {
		opacity: 0.7;
	}
	.leg.long .leg-line {
		filter: drop-shadow(0 0 3px rgb(255 77 61 / 0.7));
	}
	.leg-case {
		fill: none;
		stroke: rgb(0 0 0 / 0.55);
		stroke-linecap: round;
	}
	.leg-head {
		fill: var(--leg);
		stroke: rgb(0 0 0 / 0.55);
		stroke-linejoin: round;
		paint-order: stroke;
	}
	.hill rect {
		fill: #ffcc33;
		stroke: #1b1405;
	}
	.hill text {
		fill: #1b1405;
		font-family: var(--font-head, inherit);
		font-weight: 800;
	}
	.map-link {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		color: var(--t-accent);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
