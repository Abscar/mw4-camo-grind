<!--
	The Matrix theme's digital rain (2026-11-22, the user: "Matrix-tema … mycket grönt och coolt och nice"):
	columns of green glyphs falling behind the page, each ending in a bright head. Only drawn in that theme
	(the rest have display: none), aria-hidden, clicks go through. Not in compact mode or Battery saver.
	The columns come from a fixed seed, so the prerendered page and the browser draw the same ones.
	Their falling is a plain transform, which the browser moves on its own graphics thread; data-fx-smooth
	keeps app.html's 24 fps frame cap away from them, because that cap holds animations whose element is off
	screen, and a column that starts above the screen would then never come down.
-->
<script lang="ts">
	/** half-width katakana, digits and a few signs, like the film's rain */
	const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ0123456789ZΞ:・."=*+-<>¦';
	const COLUMNS = 36;

	function seeded(seed: number) {
		return () => {
			seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
			return seed / 4294967296;
		};
	}

	const random = seeded(1999);
	const glyph = () => GLYPHS[Math.floor(random() * GLYPHS.length)];
	const columns = Array.from({ length: COLUMNS }, (_, i) => {
		const depth = random(); // 0 = far away (small, dim, slow), 1 = close
		const length = 10 + Math.floor(random() * 22);
		return {
			left: ((i + 0.15 + random() * 0.7) / COLUMNS) * 100,
			size: Math.round(11 + depth * 9),
			duration: (15 - depth * 8 + random() * 4).toFixed(2),
			delay: (-random() * 20).toFixed(2),
			opacity: (0.16 + depth * 0.4).toFixed(2),
			tail: Array.from({ length }, glyph).join('\n'),
			head: glyph()
		};
	});
</script>

<div class="matrix-rain compact-hide" aria-hidden="true" data-fx-smooth>
	{#each columns as c, i (i)}
		<span
			class="mr-col"
			style:left="{c.left}%"
			style:font-size="{c.size}px"
			style:opacity={c.opacity}
			style:animation-duration="{c.duration}s"
			style:animation-delay="{c.delay}s">{c.tail}{'\n'}<b>{c.head}</b></span
		>
	{/each}
</div>

<style>
	.matrix-rain {
		display: none;
		position: fixed;
		inset: 0;
		z-index: -1;
		overflow: hidden;
		pointer-events: none;
	}
	:global(html[data-theme='matrix']) .matrix-rain {
		display: block;
	}
	/* Battery saver: no full-screen layers (like Abscar's haze and scanlines) */
	:global(html[data-saver]) .matrix-rain {
		display: none;
	}
	.mr-col {
		position: absolute;
		top: 0;
		white-space: pre;
		line-height: 1.12;
		font-family: 'Cascadia Mono', Consolas, 'MS Gothic', monospace;
		color: #00ff41;
		text-shadow: 0 0 6px rgb(0 255 65 / 0.75);
		/* the tail fades out towards the top */
		-webkit-mask-image: linear-gradient(to bottom, transparent, #000 72%);
		mask-image: linear-gradient(to bottom, transparent, #000 72%);
		transform: translateY(-100%);
		animation: mr-fall linear infinite;
		will-change: transform;
	}
	.mr-col b {
		font-weight: 400;
		color: #eaffee;
		text-shadow:
			0 0 6px #b6ffc7,
			0 0 14px rgb(0 255 65 / 0.9);
	}
	@keyframes mr-fall {
		from {
			transform: translateY(-100%);
		}
		to {
			transform: translateY(100vh);
		}
	}
	/* phones: half the columns */
	@media (max-width: 639px) {
		.mr-col:nth-child(even) {
			display: none;
		}
	}
</style>
