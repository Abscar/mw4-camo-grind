<!--
	The news buddy himself: a leafy weed creature (our own drawing, in the spirit of the
	"Blunt Fingers" skin): a bush of serrated cannabis leaves in several greens around a mossy,
	textured face with deep eye sockets, glowing yellow eyes and a grin full of sharp teeth,
	a gnarled vine arm and fingertips that glow like lit blunts. Decorative, aria-hidden: in the
	header, NewsBuddy wraps him in a button and passes `reaction` when he's poked.
-->
<script lang="ts" module>
	/**
	 * His mood (NewsBuddy picks it): cheers (waving, sparkles) right after you max a weapon, sleeps
	 * (closed eyes, Zzz) after midnight, sulks (heavy lids, frown, a little rain cloud) when nothing
	 * was ticked for a week.
	 */
	export type BuddyMood = 'normal' | 'cheer' | 'sleep' | 'sulk';

	/**
	 * What he does when you poke him (NewsBuddy picks one, never the same twice in a row; about 2 s):
	 * coughs out smoke puffs, blows smoke rings, or laughs with "HA"s popping up. Drawn over any mood.
	 */
	export type BuddyReaction = 'cough' | 'ring' | 'laugh';
	export const REACTIONS: BuddyReaction[] = ['cough', 'ring', 'laugh'];

	import type { GrowthStage } from '#lib/buddyGrowth.ts';

	type Pt = [number, number];

	/** Cough puffs from the mouth: [dx, dy, final scale, delay s] (in step with the three coughs). */
	const PUFFS: [number, number, number, number][] = [
		[-36, -14, 3.2, 0.09],
		[-38, 8, 3, 0.59],
		[-10, -36, 3.2, 0.63],
		[-30, -30, 3.6, 1.09]
	];
	/** Smoke rings: [dx, dy, final scale, delay s] (in step with the two blows). */
	const RINGS: [number, number, number, number][] = [
		[-8, -48, 3.3, 0.36],
		[7, -44, 2.9, 0.86]
	];
	/** "HA"s popping up while he laughs: [x, y, font size, tilt deg, delay s]. */
	const HAS: [number, number, number, number, number][] = [
		[0, 32, 14, -16, 0.05],
		[8, 8, 16, -8, 0.38],
		[60, 4, 14, 12, 0.66],
		[33, -4, 13, 6, 0.92],
		[-6, 18, 12, -20, 1.18]
	];
	/** Upper teeth along the wide-open laughing mouth. */
	const LAUGH_TEETH = Array.from({ length: 8 }, (_, i) => {
		const x = 38.2 + i * 2;
		return `M${x} 46.4 L${x + 1} 49 L${x + 2} 46.4 Z`;
	});

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

	/*
	 * Growth (buddyGrowth.ts, 2026-11-11): he grows with your grind. Stage 2 is the look he always had.
	 * 0 seedling: small, only the leaves on top, in a mound of soil; 1 sprout: bigger, half the back
	 * leaves, still in the soil; 3 big bush: an outer ring of big dark leaves, brighter glow; 4 monster
	 * (Divergence): bigger still, a tall crown, glowing veins, a green glow round him; 5 legend
	 * (a Mastery camo done): the glow turns iridescent and twinkles.
	 */
	/** How big he is per stage (scaled from his feet, the bottom middle). */
	const STAGE_SCALE = [0.58, 0.8, 1, 1.07, 1.13, 1.13];
	/** Stage 0: the middle leaves a seedling has (the three on top of his head). */
	const SEEDLING_MID = new Set([-38, -6, 26]);
	/** Stage 3+: an outer ring of big dark leaves ("thicker"). */
	const EXTRA = around([-160, -128, -96, -64, -32, 0, 32, 64, 96, 128, 160], 17, 1.5, 0, 0.1);
	/** Stage 4+: a tall crown of leaves (the monster). */
	const CROWN = around([-52, -26, 0, 26, 52], 21, 1.8, 1, 0.08);

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
	let {
		class: klass = '',
		mood = 'normal',
		reaction = null,
		run = 0,
		stage = 2,
		grew = false
	}: {
		class?: string;
		mood?: BuddyMood;
		/** Plays while set (NewsBuddy clears it after ~2 s). */
		reaction?: BuddyReaction | null;
		/** Bumped on every poke, so the smoke and "HA"s start over. */
		run?: number;
		/** How grown he is (buddyGrowth.ts); 2 = the classic look. */
		stage?: GrowthStage;
		/** He just grew a stage: a bounce and a burst of sparkles. */
		grew?: boolean;
	} = $props();
	const uid = $props.id();
	/** A poke wakes him up for the reaction. */
	const awake = $derived(mood !== 'sleep' || reaction !== null);
	const eye = $derived(mood === 'cheer' ? { rx: 2.9, ry: 1.7 } : { rx: 2.3, ry: 1.15 });
	const back = $derived(stage === 0 ? [] : stage === 1 ? BACK.filter((_, i) => i % 2 === 0) : BACK);
	const mid = $derived(stage === 0 ? MID.filter((l) => SEEDLING_MID.has(l.rot)) : MID);
	const glowR = $derived(stage >= 4 ? 7.6 : stage >= 3 ? 6.5 : 5.5);
	const tipR = $derived(stage >= 3 ? 6.2 : 5);
	/** The monster's veins glow lime and his eyes burn orange. */
	const veinGlow = $derived(stage >= 4);
	const eyeGlow = $derived(stage >= 4 ? 'hot' : 'glow');
	const eyeFill = $derived(stage >= 4 ? '#ffb347' : '#ffe86a');
</script>

{#snippet leaf(l: Leaf)}
	<g transform="translate({l.x.toFixed(2)} {l.y.toFixed(2)}) rotate({l.rot}) scale({l.s.toFixed(2)})">
		{#each LEAF as p (p.a)}
			<g transform="rotate({p.a})">
				<path d={p.d} fill={TONES[l.tone][0]} stroke="#0f2a0b" stroke-width="0.35" stroke-linejoin="round" />
				<path d={p.vein} stroke={veinGlow ? '#e4ff7a' : TONES[l.tone][1]} stroke-width={veinGlow ? 0.6 : 0.45} stroke-linecap="round" />
			</g>
		{/each}
	</g>
{/snippet}

<svg viewBox="0 0 100 100" class="{klass} mood-{mood}" aria-hidden="true" focusable="false">
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
		<radialGradient id="{uid}-smoke">
			<stop offset="0" stop-color="#f4f6f1" />
			<stop offset="0.55" stop-color="#d3d8cf" stop-opacity="0.9" />
			<stop offset="0.8" stop-color="#9ba196" stop-opacity="0.55" />
			<stop offset="1" stop-color="#8a9086" stop-opacity="0" />
		</radialGradient>
		<radialGradient id="{uid}-cheek" cx="0.42" cy="0.38">
			<stop offset="0" stop-color="#6fb24f" />
			<stop offset="1" stop-color="#2d6322" />
		</radialGradient>
		<radialGradient id="{uid}-hot">
			<stop offset="0" stop-color="#ffb347" stop-opacity="1" />
			<stop offset="0.4" stop-color="#ff6a1a" stop-opacity="0.6" />
			<stop offset="1" stop-color="#ff4a00" stop-opacity="0" />
		</radialGradient>
		<radialGradient id="{uid}-aura">
			<stop offset="0" stop-color="#c8ff6a" stop-opacity="0.9" />
			<stop offset="0.6" stop-color="#5fd13a" stop-opacity="0.5" />
			<stop offset="1" stop-color="#5fd13a" stop-opacity="0" />
		</radialGradient>
		<radialGradient id="{uid}-aura-iri">
			<stop offset="0" stop-color="#ffffff" stop-opacity="0.55" />
			<stop offset="0.3" stop-color="#ff6ad5" stop-opacity="0.6" />
			<stop offset="0.62" stop-color="#4fe6ff" stop-opacity="0.42" />
			<stop offset="1" stop-color="#b265ff" stop-opacity="0" />
		</radialGradient>
		<radialGradient id="{uid}-soil" cx="0.5" cy="0.15" r="0.9">
			<stop offset="0" stop-color="#7a5532" />
			<stop offset="1" stop-color="#3a2614" />
		</radialGradient>
	</defs>

	{#if stage >= 4}
		<!-- monster: a green glow round him; legend: iridescent, slowly shifting colour -->
		<circle class="buddy-aura" class:legend={stage >= 5} cx="46" cy="54" r="52" fill="url(#{uid}-{stage >= 5 ? 'aura-iri' : 'aura'})" />
	{/if}

	<!-- growth: the pop when he grows a stage (CSS), and his size per stage (attribute) -->
	<g class="buddy-grow" class:grow-pop={grew}>
	<g transform="translate(46 100) scale({STAGE_SCALE[stage]}) translate(-46 -100)">
	<!-- everything that shakes, bounces or leans when he's poked -->
	<g
		class="buddy-body"
		class:react-cough={reaction === 'cough'}
		class:react-ring={reaction === 'ring'}
		class:react-laugh={reaction === 'laugh'}
	>
	<!-- body -->
	<path
		d="M22 100 C22 80 32 66 46 64 C60 66 70 80 70 100 Z"
		fill="url(#{uid}-face)"
		filter="url(#{uid}-moss)"
	/>
	{#if stage >= 4}{#each CROWN as l, i (i)}{@render leaf(l)}{/each}{/if}
	{#if stage >= 3}{#each EXTRA as l, i (i)}{@render leaf(l)}{/each}{/if}
	{#each back as l, i (i)}{@render leaf(l)}{/each}
	{#each mid as l, i (i)}{@render leaf(l)}{/each}

	<!-- gnarled vine arm (with the hand, drawn further down) waves when he cheers -->
	<g class="buddy-arm">
		<path d="M63 77 C72 71 78 57 80 36" fill="none" stroke="url(#{uid}-bark)" stroke-width="7" stroke-linecap="round" />
		<path d="M64 74 C71 69 76 57 78 41 M70 66 L74.5 63.5 M76 52 L79.5 51" fill="none" stroke="#0f2a0b" stroke-width="0.6" stroke-linecap="round" opacity="0.7" />
	</g>

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
	<!-- brows (sad and tilted when he sulks) and deep eye sockets -->
	{#if mood === 'sulk' && !reaction}
		<path d="M35.8 31.6 Q40.6 32.4 45 30.4 M47 30.4 Q51.4 32.4 56.2 31.6" fill="none" stroke="#0b1f08" stroke-width="2" stroke-linecap="round" />
	{:else if reaction === 'laugh'}
		<path d="M35.8 32 Q41 27.8 45.2 31.6 M46.8 31.6 Q51 27.8 56.2 32" fill="none" stroke="#0b1f08" stroke-width="2" stroke-linecap="round" />
	{:else}
		<path d="M35.8 33.2 Q41 29.6 45.2 33.6 M46.8 33.6 Q51 29.6 56.2 33.2" fill="none" stroke="#0b1f08" stroke-width="2" stroke-linecap="round" />
	{/if}
	<path d="M36.5 35 Q40.5 32.6 44.6 35.8 Q41 38.6 36.8 36.6 Z" fill="#050b03" />
	<path d="M55.5 35 Q51.5 32.6 47.4 35.8 Q51 38.6 55.2 36.6 Z" fill="#050b03" />
	{#if reaction === 'cough'}
		<!-- coughing: eyes squeezed shut -->
		<path d="M38 34.2 L43 35.9 L38 37.6 M54 34.2 L49 35.9 L54 37.6" fill="none" stroke="#ffe86a" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" />
	{:else if reaction === 'laugh'}
		<!-- laughing: glowing eyes squinted into happy arcs -->
		<circle class="buddy-glow" cx="40.6" cy="35.8" r={glowR} fill="url(#{uid}-{eyeGlow})" />
		<circle class="buddy-glow" cx="51.4" cy="35.8" r={glowR} fill="url(#{uid}-{eyeGlow})" />
		<path d="M37.8 37.4 Q40.6 32.6 43.6 37.4 M48.4 37.4 Q51.4 32.6 54.2 37.4" fill="none" stroke="#ffe86a" stroke-width="1.5" stroke-linecap="round" />
	{:else if awake}
		<circle class="buddy-glow" cx="40.6" cy="35.8" r={glowR} fill="url(#{uid}-{eyeGlow})" />
		<circle class="buddy-glow" cx="51.4" cy="35.8" r={glowR} fill="url(#{uid}-{eyeGlow})" />
		<ellipse cx="40.6" cy="35.8" rx={eye.rx} ry={eye.ry} transform="rotate(14 40.6 35.8)" fill={eyeFill} />
		<ellipse cx="51.4" cy="35.8" rx={eye.rx} ry={eye.ry} transform="rotate(-14 51.4 35.8)" fill={eyeFill} />
		<ellipse cx="40.9" cy="35.9" rx="0.45" ry="1" fill="#3a2a00" />
		<ellipse cx="51.1" cy="35.9" rx="0.45" ry="1" fill="#3a2a00" />
		{#if mood === 'sulk' || reaction === 'ring'}
			<!-- heavy (sulking) or relaxed (blowing rings) lids over the top half of the eyes -->
			<path d="M37.4 34.6 Q40.6 33.4 43.9 35.6 L43.9 36 Q40.6 35.2 37.4 35.9 Z" fill="#173d11" stroke="#0b1f08" stroke-width="0.4" />
			<path d="M54.6 34.6 Q51.4 33.4 48.1 35.6 L48.1 36 Q51.4 35.2 54.6 35.9 Z" fill="#173d11" stroke="#0b1f08" stroke-width="0.4" />
		{/if}
	{:else}
		<!-- asleep: closed eyes -->
		<path d="M37.8 35.6 Q40.6 37.8 43.6 35.8 M48.4 35.8 Q51.4 37.8 54.2 35.6" fill="none" stroke="#ffe86a" stroke-width="0.9" stroke-linecap="round" opacity="0.75" />
	{/if}
	<!-- nostrils -->
	<path d="M44.6 41.8 L45.6 44.2 M47.4 41.8 L46.4 44.2" stroke="#071205" stroke-width="1" stroke-linecap="round" />
	{#if reaction === 'cough' || reaction === 'ring'}
		<!-- puffed cheeks (they swell before each cough / blow) -->
		{#each [38.4, 53.6] as cx (cx)}
			<ellipse class="buddy-cheek" {cx} cy="48.8" rx="3.9" ry="3.4" fill="url(#{uid}-cheek)" stroke="#0f2a0b" stroke-width="0.4" />
		{/each}
	{/if}
	{#if reaction === 'cough'}
		<!-- coughing: a small round open mouth -->
		<ellipse class="buddy-cough-mouth" cx="46" cy="51.2" rx="2.7" ry="2.3" fill="#060d04" stroke="#0b1f08" stroke-width="0.5" />
	{:else if reaction === 'ring'}
		<!-- blowing rings: pursed lips -->
		<g class="buddy-purse">
			<ellipse cx="46" cy="51.4" rx="2.8" ry="2.4" fill="#3a7428" stroke="#0b1f08" stroke-width="0.6" />
			<ellipse cx="46" cy="51.4" rx="1.2" ry="1" fill="#060d04" />
		</g>
	{:else if reaction === 'laugh'}
		<!-- laughing: mouth wide open, teeth on top, tongue at the bottom -->
		<g class="buddy-jaw">
			<path d="M36.8 46.6 Q46 45.4 55.2 46.6 Q54.6 60.5 46 61 Q37.4 60.5 36.8 46.6 Z" fill="#060d04" stroke="#0b1f08" stroke-width="0.5" />
			<path d="M40.5 58.8 Q46 53.6 51.5 58.8 Q46 61 40.5 58.8 Z" fill="#a8344a" />
			{#each LAUGH_TEETH as d, i (i)}<path {d} fill="#ebe4b2" stroke="#6b6436" stroke-width="0.2" />{/each}
		</g>
	{:else if mood === 'sulk'}
		<!-- a sulky frown with a few teeth showing -->
		<path d="M38.5 53.4 Q46 45.6 53.5 53.4 Q46 50.4 38.5 53.4 Z" fill="#060d04" />
		<path d="M42.5 50.6 L43.4 52.2 L44.4 50.1 Z M47.6 50.1 L48.6 52.2 L49.5 50.6 Z" fill="#ebe4b2" />
	{:else if mood === 'sleep'}
		<!-- snoring: a small round mouth -->
		<ellipse cx="46" cy="51" rx="2.6" ry="3.2" fill="#060d04" />
	{:else}
		<!-- grin full of sharp teeth -->
		<path d="M37.5 47 Q46 64 54.5 47 Q46 55 37.5 47 Z" fill="#060d04" />
		{#each UPPER_TEETH as d, i (i)}<path {d} fill="#ebe4b2" stroke="#6b6436" stroke-width="0.2" />{/each}
		{#each LOWER_TEETH as d, i (i)}<path {d} fill="#ddd59c" stroke="#6b6436" stroke-width="0.2" />{/each}
	{/if}

	{#each FRONT as l, i (i)}{@render leaf(l)}{/each}

	<!-- hand: knobbly fingers with glowing tips (dimmed while he sleeps) -->
	<g class="buddy-arm">
		<ellipse cx="81.5" cy="32" rx="4.6" ry="4.2" fill="url(#{uid}-bark)" stroke="#0f2a0b" stroke-width="0.5" />
		{#each FINGERS as f, i (i)}
			<path d={f.d} fill="none" stroke="#2f6522" stroke-width="2.5" stroke-linecap="round" />
			<path d={f.d} fill="none" stroke="#0f2a0b" stroke-width="0.4" stroke-linecap="round" opacity="0.6" />
		{/each}
		<g opacity={awake ? 1 : 0.35}>
			{#each FINGERS as f, i (i)}
				<circle class="buddy-glow" cx={f.tip[0]} cy={f.tip[1]} r={tipR} fill="url(#{uid}-glow)" />
				<circle cx={f.tip[0]} cy={f.tip[1]} r="1.6" fill="#ffe86a" />
				<circle cx={f.tip[0] - 0.4} cy={f.tip[1] - 0.4} r="0.6" fill="#fffbe0" />
			{/each}
		</g>
	</g>
	</g>

	{#if mood === 'cheer'}
		<!-- sparkles popping around him -->
		{#each [[18, 22, 0], [70, 8, 0.25], [12, 52, 0.5], [92, 46, 0.12], [30, 6, 0.38]] as [x, y, delay], i (i)}
			<path
				class="buddy-sparkle"
				style:animation-delay="{delay}s"
				transform="translate({x} {y})"
				d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z"
				fill="#ffe86a"
			/>
		{/each}
	{:else if mood === 'sleep' && !reaction}
		<!-- Zzz drifting up -->
		{#each [[22, 24, 10, 0], [12, 13, 13, 0.9], [0, 0, 16, 1.8]] as [x, y, size, delay], i (i)}
			<text
				class="buddy-z"
				{x}
				{y}
				font-size={size}
				style:animation-delay="{delay}s"
				fill="#eaffd8"
				stroke="#0f2a0b"
				stroke-width="0.9"
				paint-order="stroke"
				font-weight="800"
				font-family="Bahnschrift, 'Segoe UI', sans-serif">Z</text
			>
		{/each}
	{:else if mood === 'sulk'}
		<!-- a little rain cloud over his head -->
		<g class="buddy-cloud">
			<path d="M33 4 Q33 -1.5 38.5 -1 Q41 -5.5 46.5 -4 Q51.5 -6.5 54.5 -1.5 Q60 -1.5 59.5 4 Z" fill="#7b8794" stroke="#3b4450" stroke-width="0.6" />
			{#each [38, 44, 50, 56] as x, i (x)}
				<path class="buddy-drop" style:animation-delay="{i * 0.22}s" d="M{x} 6 l-0.9 2.6 a0.95 0.95 0 1 0 1.8 0 z" fill="#8fd3ff" />
			{/each}
		</g>
	{/if}

	<!-- what a poke sets off: drawn on top, started over on every poke -->
	{#key run}
		{#if reaction === 'cough'}
			<g transform="translate(46 51)">
				{#each PUFFS as [dx, dy, s, delay], i (i)}
					<circle
						class="buddy-puff"
						r="4.6"
						fill="url(#{uid}-smoke)"
						style:--dx="{dx}px"
						style:--dy="{dy}px"
						style:--s={s}
						style:animation-delay="{delay}s"
					/>
				{/each}
			</g>
		{:else if reaction === 'ring'}
			<g transform="translate(46 51)">
				{#each RINGS as [dx, dy, s, delay], i (i)}
					<g class="buddy-ring" style:--dx="{dx}px" style:--dy="{dy}px" style:--s={s} style:animation-delay="{delay}s">
						<ellipse rx="3.4" ry="1.7" fill="none" stroke="#dfe4da" stroke-width="2.6" opacity="0.4" />
						<ellipse rx="3.4" ry="1.7" fill="none" stroke="#ffffff" stroke-width="1.1" />
					</g>
				{/each}
			</g>
		{:else if reaction === 'laugh'}
			{#each HAS as [x, y, size, r, delay], i (i)}
				<text
					class="buddy-ha"
					{x}
					{y}
					font-size={size}
					style:--r="{r}deg"
					style:animation-delay="{delay}s"
					fill="#ffe86a"
					stroke="#0f2a0b"
					stroke-width="1"
					paint-order="stroke"
					font-weight="900"
					font-family="Bahnschrift, 'Segoe UI', sans-serif">HA</text
				>
			{/each}
		{/if}
	{/key}
	</g>
	</g>

	{#if stage <= 1}
		<!-- seedling and sprout: still coming up out of a mound of soil -->
		<g class="buddy-soil">
			<path d="M10 101 Q17 88.5 46 87.5 Q75 88.5 82 101 Z" fill="url(#{uid}-soil)" stroke="#24170b" stroke-width="0.6" />
			<path d="M20 92.5 Q32 89.6 44 89.4" fill="none" stroke="#a07a52" stroke-width="0.8" stroke-linecap="round" opacity="0.6" />
			<ellipse cx="29" cy="96" rx="2.3" ry="1.4" fill="#8a6a48" />
			<ellipse cx="61" cy="94.4" rx="1.7" ry="1.1" fill="#7a5c3c" />
			<ellipse cx="52" cy="98.2" rx="2.7" ry="1.5" fill="#5a4028" />
			<path d="M19 94.5 q1.4 -3.6 2.4 0 M21.5 94.2 q1.6 -2.8 3 0.2 M67 93 q1.3 -3 2.3 0 M69.4 93 q1.4 -2.4 2.8 0.3" fill="none" stroke="#5aa83f" stroke-width="0.8" stroke-linecap="round" />
		</g>
	{/if}

	{#if grew || stage >= 5}
		<!-- sparkles: a burst when he grows a stage, and the legend's twinkle -->
		{#each [[14, 24, 0], [78, 12, 0.2], [8, 60, 0.45], [88, 52, 0.1], [40, 4, 0.33], [62, 30, 0.55]] as [x, y, delay], i (i)}
			<!-- the position sits on a wrapper: the sparkle's own CSS animation replaces its transform -->
			<g transform="translate({x} {y})">
				<path
					class="buddy-sparkle"
					class:slow={!grew}
					style:animation-delay="{delay}s"
					d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z"
					fill={grew ? '#ffe86a' : '#f3e6ff'}
				/>
			</g>
		{/each}
	{/if}
</svg>

<style>
	/* cheering: waves the arm from the shoulder and bobs higher */
	.mood-cheer :global(.buddy-arm) {
		transform-box: view-box;
		transform-origin: 63px 77px;
		animation: buddy-wave 0.42s ease-in-out infinite alternate;
	}
	.buddy-sparkle {
		transform-box: fill-box;
		transform-origin: center;
		animation: buddy-pop 0.9s ease-out infinite;
	}
	.buddy-sparkle.slow {
		animation-duration: 2.6s;
	}
	/* growth (2026-11-11): a bounce from his feet when he grows a stage, the monster's / legend's glow */
	.buddy-grow {
		transform-box: view-box;
		transform-origin: 46px 100px;
	}
	.grow-pop {
		animation: buddy-grow-pop 1.1s cubic-bezier(0.3, 1.5, 0.5, 1) both;
	}
	.buddy-aura {
		transform-box: fill-box;
		transform-origin: center;
		animation: buddy-aura 3.2s ease-in-out infinite alternate;
	}
	.buddy-aura.legend {
		animation:
			buddy-aura 3.2s ease-in-out infinite alternate,
			buddy-iri 9s linear infinite;
	}
	@keyframes buddy-grow-pop {
		0% {
			transform: scale(0.82);
		}
		45% {
			transform: scale(1.16);
		}
		70% {
			transform: scale(0.96);
		}
		100% {
			transform: none;
		}
	}
	@keyframes buddy-aura {
		from {
			opacity: 0.6;
			transform: scale(0.93);
		}
		to {
			opacity: 1;
			transform: scale(1.04);
		}
	}
	@keyframes buddy-iri {
		to {
			filter: hue-rotate(360deg);
		}
	}
	.buddy-z {
		animation: buddy-zzz 2.7s ease-in-out infinite;
		opacity: 0;
	}
	.mood-sleep {
		filter: drop-shadow(0 6px 10px rgb(0 0 0 / 0.5)) brightness(0.82);
	}
	.mood-sulk {
		filter: drop-shadow(0 6px 10px rgb(0 0 0 / 0.5)) saturate(0.6) brightness(0.85);
	}
	.buddy-drop {
		animation: buddy-rain 0.9s linear infinite;
	}
	/* ---- poked (NewsBuddy): every part is a CSS animation, so reduced motion freezes it. The
	   resting styles are a still "mid-reaction" pose, which is what reduced motion shows. ---- */
	.buddy-body {
		transform-box: view-box;
		transform-origin: 46px 98px;
	}
	.react-cough {
		animation: buddy-cough-body 1.8s ease-in-out both;
	}
	.react-laugh {
		animation: buddy-laugh-body 1.8s ease-in-out both;
	}
	.react-ring {
		animation: buddy-ring-body 2s ease-in-out both;
	}
	.buddy-cheek,
	.buddy-cough-mouth,
	.buddy-purse,
	.buddy-puff,
	.buddy-ring,
	.buddy-ha {
		transform-box: fill-box;
		transform-origin: center;
	}
	.react-cough .buddy-cheek {
		animation: buddy-cheek-cough 1.8s ease-in-out both;
	}
	.react-ring .buddy-cheek {
		animation: buddy-cheek-ring 2s ease-in-out both;
	}
	.buddy-cough-mouth {
		animation: buddy-cough-mouth 1.8s ease-in-out both;
	}
	.buddy-purse {
		animation: buddy-purse 2s ease-in-out both;
	}
	.buddy-jaw {
		transform-box: fill-box;
		transform-origin: 50% 0;
		animation: buddy-jaw 1.8s ease-in-out both;
	}
	.buddy-puff {
		opacity: 0.6;
		transform: translate(calc(var(--dx) * 0.5), calc(var(--dy) * 0.5)) scale(calc(var(--s) * 0.6));
		animation: buddy-puff 0.95s cubic-bezier(0.2, 0.7, 0.4, 1) both;
	}
	.buddy-ring {
		opacity: 0.75;
		transform: translate(calc(var(--dx) * 0.5), calc(var(--dy) * 0.5)) scale(calc(var(--s) * 0.6));
		animation: buddy-ring 1.15s cubic-bezier(0.2, 0.6, 0.4, 1) both;
	}
	.buddy-ha {
		transform: rotate(var(--r));
		animation: buddy-ha 0.95s ease-out both;
	}
	@keyframes buddy-cough-body {
		0%,
		18%,
		46%,
		74%,
		100% {
			transform: none;
		}
		5%,
		33%,
		61% {
			transform: translateY(1.8px) scale(1.035, 0.95);
		}
		9%,
		37%,
		65% {
			transform: translate(-1.4px, -0.6px) rotate(-1.6deg);
		}
		13%,
		41%,
		69% {
			transform: translate(1.2px, 0) rotate(1.3deg);
		}
	}
	@keyframes buddy-cheek-cough {
		0% {
			transform: scale(1.1);
		}
		3%,
		29%,
		57% {
			transform: scale(1.3);
		}
		8%,
		36%,
		64% {
			transform: scale(0.85);
		}
		16%,
		44%,
		72%,
		100% {
			transform: none;
		}
	}
	@keyframes buddy-cough-mouth {
		0%,
		100% {
			transform: scale(0.6);
		}
		5%,
		33%,
		61% {
			transform: scale(1.4);
		}
		14%,
		42%,
		70% {
			transform: scale(0.7);
		}
	}
	@keyframes buddy-puff {
		0% {
			opacity: 0;
			transform: scale(0.25);
		}
		15% {
			opacity: 0.95;
			transform: translate(calc(var(--dx) * 0.15), calc(var(--dy) * 0.15)) scale(calc(var(--s) * 0.45));
		}
		55% {
			opacity: 0.8;
		}
		100% {
			opacity: 0;
			transform: translate(var(--dx), var(--dy)) scale(var(--s));
		}
	}
	@keyframes buddy-ring-body {
		0%,
		30%,
		55%,
		100% {
			transform: none;
		}
		12%,
		36% {
			transform: translateY(-1px) rotate(-2deg) scale(1.02);
		}
		19%,
		44% {
			transform: translateY(0.6px) rotate(1.5deg);
		}
	}
	@keyframes buddy-cheek-ring {
		0% {
			transform: scale(0.9);
		}
		12%,
		34% {
			transform: scale(1.3);
		}
		19%,
		44% {
			transform: scale(0.9);
		}
		60%,
		100% {
			transform: none;
		}
	}
	@keyframes buddy-purse {
		0% {
			transform: scale(0.8);
		}
		18%,
		43% {
			transform: scale(1.35);
		}
		26%,
		50% {
			transform: scale(0.9);
		}
		100% {
			transform: none;
		}
	}
	@keyframes buddy-ring {
		0% {
			opacity: 0;
			transform: scale(0.35);
		}
		10% {
			opacity: 0.95;
			transform: translate(calc(var(--dx) * 0.08), calc(var(--dy) * 0.08)) scale(calc(var(--s) * 0.3));
		}
		60% {
			opacity: 0.85;
		}
		100% {
			opacity: 0;
			transform: translate(var(--dx), var(--dy)) scale(var(--s));
		}
	}
	@keyframes buddy-laugh-body {
		0%,
		76%,
		100% {
			transform: none;
		}
		9% {
			transform: translateY(-4.5px) rotate(-3deg);
		}
		18%,
		36% {
			transform: translateY(0) scale(1.04, 0.95);
		}
		27% {
			transform: translateY(-4.5px) rotate(3deg);
		}
		46% {
			transform: translateY(-3.5px) rotate(-2deg);
		}
		56% {
			transform: translateY(0) scale(1.03, 0.96);
		}
		66% {
			transform: translateY(-2.5px) rotate(2deg);
		}
	}
	@keyframes buddy-jaw {
		0%,
		18%,
		36%,
		56%,
		76%,
		100% {
			transform: none;
		}
		9%,
		27%,
		46%,
		66% {
			transform: scaleY(0.68);
		}
	}
	@keyframes buddy-ha {
		0% {
			opacity: 0;
			transform: rotate(var(--r)) scale(0.2);
		}
		25% {
			opacity: 1;
			transform: rotate(var(--r)) scale(1.25);
		}
		40% {
			opacity: 1;
			transform: rotate(var(--r)) scale(1);
		}
		100% {
			opacity: 0;
			transform: translateY(-9px) rotate(var(--r)) scale(1);
		}
	}
	@keyframes buddy-wave {
		from {
			transform: rotate(-9deg);
		}
		to {
			transform: rotate(8deg);
		}
	}
	@keyframes buddy-pop {
		0% {
			opacity: 0;
			transform: scale(0.2) rotate(0deg);
		}
		40% {
			opacity: 1;
			transform: scale(1.2) rotate(45deg);
		}
		100% {
			opacity: 0;
			transform: scale(0.4) rotate(90deg);
		}
	}
	@keyframes buddy-zzz {
		0% {
			opacity: 0;
			transform: translate(3px, 4px);
		}
		30% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(-4px, -6px);
		}
	}
	@keyframes buddy-rain {
		from {
			opacity: 1;
			transform: translateY(0);
		}
		to {
			opacity: 0;
			transform: translateY(9px);
		}
	}
</style>
