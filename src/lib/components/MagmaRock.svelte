<!--
	The header's backdrop in the Abscar theme, styled after Warlord's "Magma Ire" camo: dark
	charcoal rock split by a network of glowing lava cracks (yellow core, orange edges, red glow),
	plus fine red hairline cracks. Our own procedural drawing (not the game's texture): a jittered,
	wrap-around grid of points joined into cracked cells, tiled as an SVG pattern.
	The glow slowly "breathes" and a few sparks drift up. Decorative, aria-hidden.
-->
<script lang="ts" module>
	type Pt = [number, number];

	const W = 420;
	const H = 260;
	const COLS = 6;
	const ROWS = 4;
	const CW = W / COLS;
	const CH = H / ROWS;

	// small deterministic random generator, so the cracks look the same on every load
	let seed = 20261107;
	const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

	const V: Pt[][] = Array.from({ length: ROWS }, (_, r) =>
		Array.from({ length: COLS }, (_, c): Pt => [
			c * CW + CW / 2 + (rand() - 0.5) * CW * 0.75,
			r * CH + CH / 2 + (rand() - 0.5) * CH * 0.75
		])
	);
	/** Grid point, wrapping around the tile (points past the edge are shifted by a tile). */
	const at = (r: number, c: number): Pt => {
		const [x, y] = V[((r % ROWS) + ROWS) % ROWS][((c % COLS) + COLS) % COLS];
		return [x + Math.floor(c / COLS) * W, y + Math.floor(r / ROWS) * H];
	};

	/** A slightly bent crack between two points. */
	function crack([ax, ay]: Pt, [bx, by]: Pt, bend = 0.28): string {
		const dx = bx - ax;
		const dy = by - ay;
		const len = Math.hypot(dx, dy) || 1;
		const off = (rand() - 0.5) * len * bend;
		const mx = (ax + bx) / 2 - (dy / len) * off;
		const my = (ay + by) / 2 + (dx / len) * off;
		const f = (n: number) => n.toFixed(1);
		return `M${f(ax)} ${f(ay)} Q${f(mx)} ${f(my)} ${f(bx)} ${f(by)}`;
	}

	/** A crack path plus how thick it is (cracks vary, like real lava fissures). */
	type Crack = { d: string; k: number };
	const MAIN: Crack[] = [];
	const MINOR: Crack[] = [];
	const HAIR: string[] = [];
	for (let r = 0; r < ROWS; r++) {
		for (let c = 0; c < COLS; c++) {
			MAIN.push(
				{ d: crack(at(r, c), at(r, c + 1)), k: 0.55 + rand() * 0.9 },
				{ d: crack(at(r, c), at(r + 1, c)), k: 0.55 + rand() * 0.9 }
			);
			// split some cells corner to corner, so the cells become irregular
			if (rand() < 0.4) {
				const d = rand() < 0.5 ? crack(at(r, c), at(r + 1, c + 1)) : crack(at(r, c + 1), at(r + 1, c));
				MINOR.push({ d, k: 0.5 + rand() * 0.5 });
			}
			// fine hairline cracks from a corner part-way into the cell
			const [x, y] = at(r, c);
			const [x2, y2] = at(r + 1, c + 1);
			const k = 0.3 + rand() * 0.35;
			HAIR.push(crack([x, y], [x + (x2 - x) * k + (rand() - 0.5) * 20, y + (y2 - y) * (1 - k)], 0.7));
		}
	}

	/** Draw the network four times (shifted left/up by a tile) so it repeats seamlessly. */
	const SHIFTS = [
		[0, 0],
		[-W, 0],
		[0, -H],
		[-W, -H]
	];
</script>

<script lang="ts">
	const uid = $props.id();
	const SPARKS = [8, 19, 31, 44, 57, 69, 81, 93];
</script>

<div class="magma" aria-hidden="true">
	<svg class="magma-svg" focusable="false">
		<defs>
			<pattern id="{uid}-glow" width={W} height={H} patternUnits="userSpaceOnUse">
				{#each SHIFTS as [dx, dy] (`${dx},${dy}`)}
					<g transform="translate({dx} {dy})" fill="none" stroke="#ff4a12" stroke-linecap="round">
						{#each MAIN as c, i (i)}<path d={c.d} stroke-width={7 * c.k} />{/each}
						{#each MINOR as c, i (i)}<path d={c.d} stroke-width={5 * c.k} />{/each}
					</g>
				{/each}
			</pattern>
			<pattern id="{uid}-core" width={W} height={H} patternUnits="userSpaceOnUse">
				{#each SHIFTS as [dx, dy] (`${dx},${dy}`)}
					<g transform="translate({dx} {dy})" fill="none" stroke-linecap="round">
						{#each HAIR as d, i (i)}<path {d} stroke="#8c220d" stroke-width="1" />{/each}
						{#each MINOR as c, i (i)}<path d={c.d} stroke="#e8561a" stroke-width={2 * c.k} />{/each}
						{#each MAIN as c, i (i)}<path d={c.d} stroke="#ff8a1a" stroke-width={3 * c.k} />{/each}
						{#each MAIN as c, i (i)}<path d={c.d} stroke="#ffe066" stroke-width={1.2 * c.k} />{/each}
						{#each MINOR as c, i (i)}<path d={c.d} stroke="#ffc23a" stroke-width={0.7 * c.k} />{/each}
					</g>
				{/each}
			</pattern>
		</defs>
		<rect class="magma-glow" width="100%" height="100%" fill="url(#{uid}-glow)" />
		<rect width="100%" height="100%" fill="url(#{uid}-core)" />
	</svg>
	{#each SPARKS as left, i (left)}
		<i class="magma-spark" style:left="{left}%" style:animation-delay="{-(i * 0.81).toFixed(2)}s"></i>
	{/each}
</div>
