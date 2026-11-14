<!--
	Ingman's emblem in the header's Squad frame (2026-11-14, the user's ask: "my friend Ingman is joining too,
	make a new operator … he should have this operator", with a store picture of the "Wizard of COD" skin):
	a purple wide-brimmed wizard hat with a rainbow band and a green leaf on it, a big fluffy white beard
	and moustache, round lavender-tinted glasses, a wooden pipe with smoke, a purple robe with gold stars and
	leaves, and a black plate carrier with a small green bong, a row of cartridges and a pouch with a purple
	leaf patch. The pipe's smoke uses Abscar's `smoke` helper (abscarOperator.ts; op-puff / op-wisp in app.css).
	Same size and style as the other squad emblems: 64×64 head and shoulders, overflow visible.
	Our own cartoon, decoration only (aria-hidden; the callsign next to it is the text). No skin names.
-->
<script lang="ts">
	import { smoke } from '#lib/abscarOperator.ts';

	const uid = $props.id();
	const u = `ig-${uid}`;
	const id = (name: string) => `${u}-${name}`;
	const O = '#1b0f22';

	/** the hat's pointed crown (also the rainbow band's clip) */
	const CROWN = 'M20.5 15.6 C21.6 8.6 25.2 3.2 30 0.2 C33.4 -1.8 37.6 -0.8 40.4 1.4 C37.2 1 34.8 2.2 34.2 4.6 C37.6 7.6 42.4 11.4 43.6 15.6 Z';
	const BRIM = 'M4.5 19.2 C8.5 14 20.5 12.6 32 12.6 C43.5 12.6 55.5 14 59.5 19.2 C53.5 21.8 43 22.4 32 22.4 C21 22.4 10.5 21.8 4.5 19.2 Z';
	const BEARD =
		'M21.6 30.4 C16.4 35.4 16 45 19.6 50.6 C22.4 55 27 56.8 32 57.6 C37 56.8 41.6 55 44.4 50.6 C48 45 47.6 35.4 42.4 30.4 C40 33.6 36.4 35 32 35 C27.6 35 24 33.6 21.6 30.4 Z';
	const RAINBOW = ['#e8343a', '#f38a1f', '#f6d334', '#3fb54a', '#2f7fe0', '#8a3fd0'];
	/** a five-pointed star centred on (x, y) */
	const star = (x: number, y: number, r: number) =>
		Array.from({ length: 10 }, (_, i) => {
			const a = (Math.PI / 5) * i - Math.PI / 2;
			const rr = i % 2 ? r * 0.45 : r;
			return `${(x + rr * Math.cos(a)).toFixed(2)},${(y + rr * Math.sin(a)).toFixed(2)}`;
		}).join(' ');
	/** a small seven-fingered leaf, base at (x, y) */
	const LEAF = [-75, -45, -20, 0, 20, 45, 75].map((a, i) => ({ a, ry: [1.5, 2.3, 2.9, 3.3, 2.9, 2.3, 1.5][i] }));
	const STARS: [number, number, number][] = [
		[8.5, 56.5, 1.6],
		[13.5, 61.5, 1.2],
		[55.5, 57.5, 1.6],
		[51.5, 51.8, 1.1],
		[6.5, 62.8, 1.1]
	];
	const BULLETS = [26.2, 28.1, 30, 31.9, 33.8];
	const SMOKE = smoke(u, 44.6, 30.6, 0.6);
</script>

{#snippet leaf(x: number, y: number, s: number, fill: string)}
	<g transform="translate({x} {y}) scale({s})">
		{#each LEAF as l (l.a)}
			<ellipse cx="0" cy={-l.ry} rx=".62" ry={l.ry} transform="rotate({l.a})" {fill} />
		{/each}
		<path d="M0 0 v1.6" stroke={fill} stroke-width=".5" />
	</g>
{/snippet}

<svg viewBox="0 0 64 64" class="size-16 flex-none overflow-visible sm:size-20" aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id={id('robe')} x1="0" y1="0" x2=".25" y2="1">
			<stop offset="0" stop-color="#9a5ad8" /><stop offset=".55" stop-color="#6a2fa8" /><stop offset="1" stop-color="#3e1670" />
		</linearGradient>
		<linearGradient id={id('hat')} x1=".1" y1="0" x2=".7" y2="1">
			<stop offset="0" stop-color="#a86ae0" /><stop offset=".5" stop-color="#6d32ad" /><stop offset="1" stop-color="#40186e" />
		</linearGradient>
		<linearGradient id={id('beard')} x1="0" y1="0" x2=".2" y2="1">
			<stop offset="0" stop-color="#fbf6ec" /><stop offset=".6" stop-color="#eadfca" /><stop offset="1" stop-color="#c9b896" />
		</linearGradient>
		<radialGradient id={id('skin')} cx=".45" cy=".4" r=".7">
			<stop offset="0" stop-color="#e8b58e" /><stop offset="1" stop-color="#b97a52" />
		</radialGradient>
		<linearGradient id={id('lens')} x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#b48ad8" stop-opacity=".9" /><stop offset="1" stop-color="#3e2257" stop-opacity=".95" />
		</linearGradient>
		<clipPath id={id('crown-clip')}><path d={CROWN} /></clipPath>
		<!-- for the pipe's smoke (abscarOperator.ts) -->
		<filter id={id('puff-blur')} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.4" /></filter>
		<filter id={id('blur')} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.5" /></filter>
	</defs>

	<!-- purple robe with gold stars and leaves -->
	<path d="M1.5 64.5 C2 53.5 8.5 47.6 20 46 L44 46 C55.5 47.6 62 53.5 62.5 64.5 Z" fill="url(#{id('robe')})" stroke={O} stroke-width="1.1" stroke-linejoin="round" />
	{#each STARS as [x, y, r] (`${x},${y}`)}
		<polygon points={star(x, y, r)} fill="#f2c34a" stroke="#7a5212" stroke-width=".25" />
	{/each}
	{@render leaf(58.6, 63, 0.55, '#e0b040')}
	{@render leaf(4.2, 52.6, 0.5, '#e0b040')}

	<!-- black plate carrier: a small green bong, a row of cartridges, a pouch with a purple leaf patch -->
	<path d="M16.6 64.5 L17.6 51.6 Q32 48.4 46.4 51.6 L47.4 64.5 Z" fill="#1c1c20" stroke={O} stroke-width=".9" stroke-linejoin="round" />
	<path d="M18 55.2 Q32 52.6 46 55.2" fill="none" stroke="#33343a" stroke-width=".7" />
	<rect x="20.4" y="52.6" width="2" height="7" rx=".5" fill="#c8e8d8" fill-opacity=".55" stroke="#2c5a3c" stroke-width=".45" />
	<rect x="20.1" y="52" width="2.6" height="1.2" rx=".4" fill="#b0262d" />
	<circle cx="21.4" cy="61.4" r="2.9" fill="#2e8a3e" stroke="#123a1a" stroke-width=".55" />
	<ellipse cx="20.6" cy="60.4" rx=".9" ry=".6" fill="#9be0a8" opacity=".75" />
	<path d="M23.4 59.6 l2.2 -1.8" stroke="#8a8f96" stroke-width=".8" stroke-linecap="round" />
	{#each BULLETS as x (x)}
		<rect {x} y="55.8" width="1.3" height="4.8" rx=".35" fill="#d7dade" stroke="#55595e" stroke-width=".25" />
		<rect {x} y="55.4" width="1.3" height="1.3" rx=".6" fill="#d9a63a" />
	{/each}
	<rect x="37.2" y="55" width="7.6" height="8.6" rx="1" fill="#26272c" stroke={O} stroke-width=".6" />
	<path d="M37.2 57.2 h7.6" stroke="#3a3b42" stroke-width=".5" />
	<rect x="38.6" y="58" width="4.8" height="4.6" rx=".6" fill="#2a1438" stroke="#7d4fb0" stroke-width=".35" />
	{@render leaf(41, 61.6, 0.62, '#b07ae8')}

	<!-- face, white hair at the sides -->
	<ellipse cx="32" cy="26.6" rx="9.6" ry="10.6" fill="url(#{id('skin')})" stroke={O} stroke-width=".9" />
	{#each [[21.4, 25.6, -1], [42.6, 25.6, 1]] as [x, y, side] (x)}
		<path
			d="M{x - side * 1.4} {y - 5} C{x + side * 2.6} {y - 3} {x + side * 3} {y + 3} {x + side * 1.6} {y + 7} C{x} {y + 5} {x - side * 1.2} {y + 1} {x - side * 1.4} {y - 5} Z"
			fill="url(#{id('beard')})"
			stroke="#a8977a"
			stroke-width=".4"
		/>
	{/each}

	<!-- the big fluffy beard over the vest, with a few wavy strands, and the moustache -->
	<path d={BEARD} fill="url(#{id('beard')})" stroke="#a8977a" stroke-width=".7" stroke-linejoin="round" />
	<g fill="none" stroke="#c4b292" stroke-width=".5" stroke-linecap="round">
		<path d="M24 39 C23 43 24.5 47 23.4 51" />
		<path d="M28 40 C27.4 45 29 49 28 54" />
		<path d="M32 41 C31.4 46 33 50 32 56" />
		<path d="M36 40 C36.6 45 35 49 36 54" />
		<path d="M40 39 C41 43 39.5 47 40.6 51" />
	</g>
	<path d="M23.4 33.6 C26 31 29 30.6 32 32.2 C35 30.6 38 31 40.6 33.6 C38.6 35.6 35.6 35.8 32 34.6 C28.4 35.8 25.4 35.6 23.4 33.6 Z" fill="#f3ead8" stroke="#a8977a" stroke-width=".45" />
	<path d="M30 30.2 Q32 31.4 34 30.2 L32 27 Z" fill="#c9875e" />

	<!-- round tinted glasses -->
	{#each [27.6, 36.4] as x (x)}
		<circle cx={x} cy="25.2" r="3.3" fill="url(#{id('lens')})" stroke="#d6b34a" stroke-width=".6" />
		<path d="M{x - 1.8} {23.8} q1 -1 2.2 -.9" fill="none" stroke="#fff" stroke-width=".45" stroke-linecap="round" opacity=".7" />
	{/each}
	<path d="M30.9 25 Q32 24.2 33.1 25" fill="none" stroke="#d6b34a" stroke-width=".55" />

	<!-- the wooden pipe at the right of his mouth, smoke from the bowl -->
	<path d="M35.4 33.6 C38.4 34.4 40.8 35 42.4 35.2" fill="none" stroke="#3b1f0d" stroke-width="1.7" stroke-linecap="round" />
	<path d="M35.4 33.6 C38.4 34.4 40.8 35 42.4 35.2" fill="none" stroke="#7a4420" stroke-width=".8" stroke-linecap="round" />
	<path d="M41.6 30.4 h5 l-.6 5.6 q-1.9 1.4 -3.8 0 Z" fill="#7a4420" stroke="#2a1608" stroke-width=".6" stroke-linejoin="round" />
	<ellipse cx="44.1" cy="30.5" rx="2.5" ry=".8" fill="#2a1608" />
	<ellipse class="ig-ember" cx="44.1" cy="30.4" rx="1.5" ry=".45" fill="#ff7a1a" />

	<!-- the pipe smoke rises behind the hat's brim and comes out above it -->
	{@html SMOKE}

	<!-- the wizard hat: wide brim, pointed crown, rainbow band with a green leaf, gold stars -->
	<path d={BRIM} fill="url(#{id('hat')})" stroke={O} stroke-width="1" stroke-linejoin="round" />
	<path d="M8.5 18.6 C14 16.4 22 15.6 32 15.6 C42 15.6 50 16.4 55.5 18.6" fill="none" stroke="#b886e8" stroke-width=".5" opacity=".6" />
	<path d={CROWN} fill="url(#{id('hat')})" stroke={O} stroke-width="1" stroke-linejoin="round" />
	<g clip-path="url(#{id('crown-clip')})">
		{#each RAINBOW as c, i (c)}
			<rect x="18" y={11.6 + i * 0.68} width="28" height=".7" fill={c} />
		{/each}
	</g>
	{@render leaf(36.4, 15.2, 0.7, '#4cc24a')}
	<polygon points={star(27.2, 7.4, 1.1)} fill="#f2c34a" />
	<polygon points={star(13, 18.2, 0.9)} fill="#f2c34a" />
	<polygon points={star(51.4, 18.6, 0.9)} fill="#f2c34a" />

</svg>

<style>
	.ig-ember {
		animation: ig-ember 2.6s ease-in-out infinite;
	}
	@keyframes ig-ember {
		50% {
			fill: #ffc04a;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ig-ember {
			animation: none;
		}
	}
</style>
