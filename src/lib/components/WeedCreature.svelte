<!--
	The news buddy himself: a leafy weed creature (our own drawing, in the spirit of the
	"Blunt Fingers" skin): a bush of serrated cannabis leaves in several greens around a mossy,
	textured face with deep eye sockets, glowing yellow eyes and a grin full of sharp teeth,
	a gnarled vine arm and fingertips that glow like lit blunts. Decorative, aria-hidden.
-->
<script lang="ts" module>
	type Pt = [number, number];

	/** A serrated leaflet pointing up from (0,0): lens-shaped with small teeth along both edges. */
	function serrated(l: number, w: number): string {
		const n = 9;
		const half = (t: number) => (w / 2) * Math.pow(Math.sin(Math.PI * t), 0.85);
		const side = (sgn: 1 | -1): Pt[] => {
			const pts: Pt[] = [];
			for (let i = 1; i < n; i++) {
				const t = i / n;
				pts.push([sgn * half(t), -l * t]); // tooth tip
				const t2 = (i + 0.55) / n;
				pts.push([sgn * half(t2) * 0.78, -l * t2 + l * 0.015]); // notch
			}
			return pts;
		};
		const f = ([x, y]: Pt) => `${x.toFixed(2)} ${y.toFixed(2)}`;
		const right = side(1).filter(([, y]) => y > -l);
		const left = side(-1).filter(([, y]) => y > -l).reverse();
		return `M0 0 L${right.map(f).join(' L')} L0 ${(-l).toFixed(2)} L${left.map(f).join(' L')} Z`;
	}

	/** One leaf: seven leaflets fanned out [angle, length, width], each with its centre vein. */
	const LEAF = (
		[
			[-102, 5.6, 2.3],
			[102, 5.6, 2.3],
			[-67, 8.9, 3.1],
			[67, 8.9, 3.1],
			[-33, 11.8, 3.7],
			[33, 11.8, 3.7],
			[0, 13.8, 4.1]
		] as [number, number, number][]
	).map(([a, l, w]) => ({ a, d: serrated(l, w), vein: `M0 -0.4 L0 ${(-l * 0.86).toFixed(2)}` }));

	/** Leaf colours, back (shadowed) to front (lit): [fill, vein]. */
	const TONES: [string, string][] = [
		['#1d4a16', '#4f8f38'],
		['#2f7224', '#6fb94b'],
		['#469632', '#9ad670']
	];

	type Leaf = { x: number; y: number; rot: number; s: number; tone: 0 | 1 | 2 };
	const HEAD: Pt = [46, 37];
	const around = (angles: number[], r: number, s: number, tone: 0 | 1 | 2, jitter = 0): Leaf[] =>
		angles.map((a, i) => {
			const rad = (a * Math.PI) / 180;
			return {
				x: HEAD[0] + Math.sin(rad) * r,
				y: HEAD[1] - Math.cos(rad) * r,
				rot: a,
				s: s + (i % 3) * jitter,
				tone
			};
		});

	const LEAVES: Leaf[] = [
		// back of the bush: big, dark
		...around([-150, -118, -86, -54, -22, 10, 42, 74, 106, 138], 11, 1.45, 0, 0.12),
		// middle layer
		...around([-134, -102, -70, -38, -6, 26, 58, 90, 122], 12, 1.18, 1, 0.1),
		// shoulders
		{ x: 28, y: 82, rot: -64, s: 1.15, tone: 1 },
		{ x: 38, y: 74, rot: -22, s: 0.95, tone: 2 },
		{ x: 56, y: 75, rot: 24, s: 0.95, tone: 2 },
		{ x: 66, y: 84, rot: 62, s: 1.05, tone: 1 },
		// framing the face, in front
		{ x: 33.5, y: 41, rot: -104, s: 0.72, tone: 2 },
		{ x: 58.5, y: 41, rot: 104, s: 0.72, tone: 2 },
		{ x: 46, y: 24.5, rot: 0, s: 0.62, tone: 2 },
		// a sprig on the arm
		{ x: 73, y: 62, rot: 48, s: 0.55, tone: 2 }
	];
	const BACK = LEAVES.filter((l) => l.tone === 0);
	const MID = LEAVES.filter((l) => l.tone === 1);
	const FRONT = LEAVES.filter((l) => l.tone === 2);

	/** Sharp teeth along the lips: upper lip y = 47 + 8t(1−t), lower lip y = 47 + 17t(1−t). */
	const teeth = (lip: number, dir: 1 | -1, len: number) => {
		const out: string[] = [];
		for (let t = 0.1; t < 0.9; t += 0.1) {
			const x0 = 37.5 + 17 * t;
			const x1 = 37.5 + 17 * (t + 0.1);
			const y = (u: number) => 47 + lip * u * (1 - u);
			out.push(
				`M${x0.toFixed(2)} ${y(t).toFixed(2)} L${((x0 + x1) / 2).toFixed(2)} ${(y(t + 0.05) + dir * len).toFixed(2)} L${x1.toFixed(2)} ${y(t + 0.1).toFixed(2)} Z`
			);
		}
		return out;
	};
	const UPPER_TEETH = teeth(8, 1, 2.3);
	const LOWER_TEETH = teeth(17, -1, 1.9);

	const FINGERS: { d: string; tip: Pt }[] = [
		{ d: 'M78.5 29.5 C77 25.5 75 22.5 73.5 19.5', tip: [73.5, 19.5] },
		{ d: 'M80.5 28.5 C80 24 79.5 19.5 78.8 15.8', tip: [78.8, 15.8] },
		{ d: 'M82.5 28.5 C83.5 24 84.2 19.8 84.4 16.2', tip: [84.4, 16.2] },
		{ d: 'M84.5 30 C86.5 26.5 88 23.5 89 20.6', tip: [89, 20.6] },
		{ d: 'M85 34 C87.5 33 89.5 31.5 91 29.5', tip: [91, 29.5] }
	];
</script>

<script lang="ts">
	let { class: klass = '' }: { class?: string } = $props();
	const uid = $props.id();
</script>

{#snippet leaf(l: Leaf)}
	<g transform="translate({l.x.toFixed(2)} {l.y.toFixed(2)}) rotate({l.rot}) scale({l.s.toFixed(2)})">
		{#each LEAF as p (p.a)}
			<g transform="rotate({p.a})">
				<path d={p.d} fill={TONES[l.tone][0]} stroke="#0f2a0b" stroke-width="0.35" stroke-linejoin="round" />
				<path d={p.vein} stroke={TONES[l.tone][1]} stroke-width="0.45" stroke-linecap="round" />
			</g>
		{/each}
	</g>
{/snippet}

<svg viewBox="0 0 100 100" class={klass} aria-hidden="true" focusable="false">
	<defs>
		<filter id="{uid}-moss" x="-10%" y="-10%" width="120%" height="120%">
			<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7" result="noise" />
			<feColorMatrix
				in="noise"
				type="matrix"
				values="0 0 0 0 0.05  0 0 0 0 0.16  0 0 0 0 0.03  0 0 0 1.4 -0.45"
				result="speckle"
			/>
			<feComposite in="speckle" in2="SourceGraphic" operator="in" result="texture" />
			<feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="texture" /></feMerge>
		</filter>
		<linearGradient id="{uid}-face" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#4a8a33" />
			<stop offset="0.55" stop-color="#2d6322" />
			<stop offset="1" stop-color="#173d11" />
		</linearGradient>
		<linearGradient id="{uid}-bark" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0" stop-color="#173a12" />
			<stop offset="0.45" stop-color="#3a7428" />
			<stop offset="1" stop-color="#173a12" />
		</linearGradient>
		<radialGradient id="{uid}-glow">
			<stop offset="0" stop-color="#ffe86a" stop-opacity="0.95" />
			<stop offset="0.4" stop-color="#ffd23a" stop-opacity="0.45" />
			<stop offset="1" stop-color="#ffd23a" stop-opacity="0" />
		</radialGradient>
	</defs>

	<!-- body -->
	<path
		d="M22 100 C22 80 32 66 46 64 C60 66 70 80 70 100 Z"
		fill="url(#{uid}-face)"
		filter="url(#{uid}-moss)"
	/>
	{#each BACK as l, i (i)}{@render leaf(l)}{/each}
	{#each MID as l, i (i)}{@render leaf(l)}{/each}

	<!-- gnarled vine arm -->
	<path d="M63 77 C72 71 78 57 80 36" fill="none" stroke="url(#{uid}-bark)" stroke-width="7" stroke-linecap="round" />
	<path d="M64 74 C71 69 76 57 78 41 M70 66 L74.5 63.5 M76 52 L79.5 51" fill="none" stroke="#0f2a0b" stroke-width="0.6" stroke-linecap="round" opacity="0.7" />

	<!-- face: mossy, gaunt -->
	<path
		d="M35 30 C35 20 57 20 57 30 L58.5 42 C58 52 52.5 58 46 59 C39.5 58 34 52 33.5 42 Z"
		fill="url(#{uid}-face)"
		stroke="#0f2a0b"
		stroke-width="0.6"
		filter="url(#{uid}-moss)"
	/>
	<ellipse cx="38" cy="45" rx="3.5" ry="5" fill="#0f2a0b" opacity="0.35" />
	<ellipse cx="54" cy="45" rx="3.5" ry="5" fill="#0f2a0b" opacity="0.35" />
	<!-- brows and deep eye sockets -->
	<path d="M35.8 33.2 Q41 29.6 45.2 33.6 M46.8 33.6 Q51 29.6 56.2 33.2" fill="none" stroke="#0b1f08" stroke-width="2" stroke-linecap="round" />
	<path d="M36.5 35 Q40.5 32.6 44.6 35.8 Q41 38.6 36.8 36.6 Z" fill="#050b03" />
	<path d="M55.5 35 Q51.5 32.6 47.4 35.8 Q51 38.6 55.2 36.6 Z" fill="#050b03" />
	<circle class="buddy-glow" cx="40.6" cy="35.8" r="5.5" fill="url(#{uid}-glow)" />
	<circle class="buddy-glow" cx="51.4" cy="35.8" r="5.5" fill="url(#{uid}-glow)" />
	<ellipse cx="40.6" cy="35.8" rx="2.3" ry="1.15" transform="rotate(14 40.6 35.8)" fill="#ffe86a" />
	<ellipse cx="51.4" cy="35.8" rx="2.3" ry="1.15" transform="rotate(-14 51.4 35.8)" fill="#ffe86a" />
	<ellipse cx="40.9" cy="35.9" rx="0.45" ry="1" fill="#3a2a00" />
	<ellipse cx="51.1" cy="35.9" rx="0.45" ry="1" fill="#3a2a00" />
	<!-- nostrils -->
	<path d="M44.6 41.8 L45.6 44.2 M47.4 41.8 L46.4 44.2" stroke="#071205" stroke-width="1" stroke-linecap="round" />
	<!-- grin full of sharp teeth -->
	<path d="M37.5 47 Q46 64 54.5 47 Q46 55 37.5 47 Z" fill="#060d04" />
	{#each UPPER_TEETH as d, i (i)}<path {d} fill="#ebe4b2" stroke="#6b6436" stroke-width="0.2" />{/each}
	{#each LOWER_TEETH as d, i (i)}<path {d} fill="#ddd59c" stroke="#6b6436" stroke-width="0.2" />{/each}

	{#each FRONT as l, i (i)}{@render leaf(l)}{/each}

	<!-- hand: knobbly fingers with glowing tips -->
	<ellipse cx="81.5" cy="32" rx="4.6" ry="4.2" fill="url(#{uid}-bark)" stroke="#0f2a0b" stroke-width="0.5" />
	{#each FINGERS as f, i (i)}
		<path d={f.d} fill="none" stroke="#2f6522" stroke-width="2.5" stroke-linecap="round" />
		<path d={f.d} fill="none" stroke="#0f2a0b" stroke-width="0.4" stroke-linecap="round" opacity="0.6" />
	{/each}
	{#each FINGERS as f, i (i)}
		<circle class="buddy-glow" cx={f.tip[0]} cy={f.tip[1]} r="5" fill="url(#{uid}-glow)" />
		<circle cx={f.tip[0]} cy={f.tip[1]} r="1.6" fill="#ffe86a" />
		<circle cx={f.tip[0] - 0.4} cy={f.tip[1] - 0.4} r="0.6" fill="#fffbe0" />
	{/each}
</svg>
