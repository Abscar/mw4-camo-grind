<!--
	TheJoker_BPL's emblem in the header's Squad frame (2026-11-17, the user's ask: "förbered att lägga till en
	till operator i squaden, 'TheJoker_BPL'"; 2026-11-21 they sent a picture of the look they want: the clown
	villain from the film). Our own cartoon in the squad emblems' style, not the picture: a greasy green-blond
	mop of hair with strands over the forehead, white face paint smeared thin at the jaw, black smudged eye
	sockets that run, eyes looking up from under the brows, a red smeared mouth with scars curling up both
	cheeks, a purple coat with wide lapels over a green waistcoat, dark shirt and a dark patterned tie, and a
	playing card in his breast pocket (his callsign). No names or logos.
	Same size and style as the other squad emblems: 64×64 head and shoulders, overflow visible. The head tilts
	a little now and then and a strand of hair sways (held still with reduced motion).
	BurgiShop's face slots (faceGear.ts FACES.joker): no holk of his own, so the Golden Holk / 420 pack 2 items go
	in the right corner of his mouth, a hat sits on the hair, glasses over the eyes; they tilt with his head.
	Decoration only (aria-hidden; the callsign next to it is the text).
-->
<script lang="ts">
	import { holk, smoke } from '#lib/abscarOperator.ts';
	import { EXHALE_K, exhaleAt, eyesItem, FACES, hatItem, mouthItem, type FaceWear } from '#lib/faceGear.ts';

	let { face = null }: { face?: FaceWear | null } = $props();
	const mouth = $derived(face?.mouth ?? null);

	const uid = $props.id(); // ids must be unique per drawing
	const u = (name: string) => `${uid}-${name}`;
	const O = '#120a14';
	const F = FACES.joker;
	const M = F.mouth;
	/** the Golden Holk in the right corner of his mouth, smoke from its burning end */
	const GOLD_HOLK = holk(uid, M.x, M.y, 55, 40, 2.2, 6.8, undefined, true);
	const HOLK_SMOKE = smoke(uid, 55.4, 37.8, 0.7);
	const ITEM = $derived(mouthItem(uid, mouth, M));
	/** a smoke colour with nothing to smoke: he blows it out of the corner of his mouth */
	const EXHALE = $derived(face?.smoke && !ITEM && mouth !== 'mouth-goldholk' ? smoke(uid, ...exhaleAt(F), EXHALE_K) : '');

	/** the mop of hair behind his head and down to the collar */
	const HAIR_BACK =
		'M17.2 44 L18.8 38.8 L15.4 41.2 C14.2 35.4 13.8 28.6 14.8 22.4 L12.2 20.6 L15.8 18.8 C17.2 13.2 20.4 9 24.6 6.8 L23.4 3.4 L27.8 5.2 C29.4 4.8 31 4.6 32.6 4.6 L35.6 1.8 L36.8 5 C39.8 5.8 42.4 7.6 44.2 10.2 L48.4 9.4 L46.8 13.4 C48.6 17.6 49.4 22.8 49 28.2 L51.4 31 L48.6 32 C48.2 36.2 47.2 39.8 45.6 42.8 L44.4 39 L43.4 42.4 C42.6 39.8 42.2 37 42.2 34 L21.8 34 C21.8 37 21.2 40.2 20.2 42.8 L19.6 39.8 Z';
	/** loose greasy strands sticking out of the mop */
	const WISPS = [
		'M15.2 24 C12.8 23 11 24.4 10 26.4',
		'M48.8 22.6 C51.2 21.6 53 22.8 53.8 24.8',
		'M46.2 35.6 C48.4 38.2 48.8 40.8 48.2 43.8',
		'M17.6 35.8 C15.6 38.4 15.2 41.2 15.8 44.2',
		'M29.6 5 C28.4 2.8 26.4 1.6 24.4 1.4',
		'M38.2 6.4 C40 4.4 42.4 3.8 44.4 4.2'
	];
	/** the face: a long oval with a strong jaw */
	const FACE =
		'M22.4 25 C22.4 18.6 26.6 14.6 32 14.6 C37.4 14.6 41.6 18.6 41.6 25 C41.6 31 40.6 35.4 38.6 38.6 C36.8 41.2 34.6 42.4 32 42.4 C29.4 42.4 27.2 41.2 25.4 38.6 C23.4 35.4 22.4 31 22.4 25 Z';
	/** greasy strands falling over the forehead and the sides of the face (left part, right part) */
	const STRANDS = [
		'M31.6 7.6 C27.4 10.6 24.6 14.8 23.6 20.6 C24.8 18.4 26.4 16.2 28.4 14.8 C27.6 17.6 27.6 20 28 22.4 C29 18.4 30.4 14.6 32.6 11.8 Z',
		'M32.2 8 C35.4 10.2 38 13.6 39.2 18.4 C37.8 16.6 36.2 15.4 34.6 14.8 C35.8 17.4 36.4 20.2 36.2 22.6 C35 19 33.4 15.6 31 13 Z',
		'M22.8 15.6 C20.6 19.6 20 25.4 20.8 31.4 C21.4 28.4 22 26.2 23 24.4 C22.8 27.4 23 30.4 23.8 33 C24 27 24.6 21 26.4 16.6 Z',
		'M41.4 15.6 C43.6 19.6 44.2 25.4 43.4 31.4 C42.8 28.4 42.2 26.2 41.2 24.4 C41.4 27.4 41.2 30.4 40.4 33 C40.2 27 39.6 21 37.8 16.6 Z'
	];
	/** the black paint round each eye, smudged and running down a little */
	const SOCKET = (x: number, y: number, s: 1 | -1) =>
		`M${x - 4.4 * s} ${y - 1.4} C${x - 3.4 * s} ${y - 4} ${x + 2.6 * s} ${y - 4.2} ${x + 4 * s} ${y - 1.6} C${x + 4.4 * s} ${y + 0.6} ${x + 3 * s} ${y + 2.6} ${x + 1.8 * s} ${y + 2.8} L${x + 1.4 * s} ${y + 5.2} L${x + 0.6 * s} ${y + 3} C${x - 1 * s} ${y + 3.4} ${x - 2.2 * s} ${y + 3} ${x - 2.8 * s} ${y + 2.6} L${x - 3.2 * s} ${y + 4.4} L${x - 3.6 * s} ${y + 2} C${x - 4.4 * s} ${y + 1.2} ${x - 4.8 * s} ${y} ${x - 4.4 * s} ${y - 1.4} Z`;
	const E = F.eyes ?? { l: [27.6, 26.4] as [number, number], r: [36.4, 26.4] as [number, number], rad: 3.4 };
</script>

<svg viewBox="0 0 64 64" class="size-16 flex-none overflow-visible sm:size-20" data-smoke={face?.smoke || undefined} aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id={u('coat')} x1="0" y1="0" x2=".25" y2="1">
			<stop offset="0" stop-color="#7a45a6" /><stop offset=".55" stop-color="#4b2470" /><stop offset="1" stop-color="#26113a" />
		</linearGradient>
		<linearGradient id={u('lapel')} x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#8d58ba" /><stop offset="1" stop-color="#3c1b5a" />
		</linearGradient>
		<linearGradient id={u('vest')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#5b8a4a" /><stop offset="1" stop-color="#2c4a26" />
		</linearGradient>
		<linearGradient id={u('hair')} x1=".2" y1="0" x2=".6" y2="1">
			<stop offset="0" stop-color="#a6a64e" /><stop offset=".5" stop-color="#76822e" /><stop offset="1" stop-color="#46521c" />
		</linearGradient>
		<radialGradient id={u('paint')} cx=".45" cy=".38" r=".72">
			<stop offset="0" stop-color="#f6f3ea" /><stop offset=".72" stop-color="#e2ddd0" /><stop offset="1" stop-color="#c9b8a6" />
		</radialGradient>
		<filter id={u('soft')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".45" /></filter>
		<!-- for the Golden Holk's ember and BurgiShop's smoke (abscarOperator.ts) -->
		<radialGradient id={u('ember')}><stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95" /><stop offset="1" stop-color="#ff5a00" stop-opacity="0" /></radialGradient>
		<filter id={u('puff-blur')} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.4" /></filter>
		<filter id={u('blur')} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.5" /></filter>
	</defs>

	<!-- purple coat with wide lapels over a green waistcoat, dark shirt and a dark patterned tie -->
	<path d="M1 64.5 C2 53.4 8.6 47.8 20.2 46.2 L43.8 46.2 C55.4 47.8 62 53.4 63 64.5 Z" fill="url(#{u('coat')})" stroke={O} stroke-width="1.1" stroke-linejoin="round" />
	<path d="M21.6 46.4 L42.4 46.4 L36 64.5 L28 64.5 Z" fill="url(#{u('vest')})" stroke={O} stroke-width=".7" stroke-linejoin="round" />
	<path d="M27 46.4 L37 46.4 L32 58.6 Z" fill="#26384a" stroke={O} stroke-width=".55" stroke-linejoin="round" />
	<path d="M27 46.4 L30.2 50.4 L32 46.8 L33.8 50.4 L37 46.4" fill="#33495e" stroke={O} stroke-width=".45" stroke-linejoin="round" />
	<path d="M30.9 48.2 L33.1 48.2 L33.7 55.8 L32 58.2 L30.3 55.8 Z" fill="#1b1d28" stroke={O} stroke-width=".4" />
	<path d="M30.6 46.8 H33.4 L33 48.6 H31 Z" fill="#23263a" stroke={O} stroke-width=".35" />
	<g fill="#4a5a8a" opacity=".85"><circle cx="31.6" cy="50.6" r=".32" /><circle cx="32.5" cy="52.4" r=".32" /><circle cx="31.5" cy="54.2" r=".32" /><circle cx="32.4" cy="56" r=".3" /></g>
	<g fill="#1a2a16" stroke="#0d160b" stroke-width=".25"><circle cx="32" cy="60.6" r=".75" /><circle cx="32" cy="63.4" r=".75" /></g>
	<path d="M28.4 58.2 Q32 60 35.6 58.2" fill="none" stroke="#21391d" stroke-width=".5" />
	{#each ['', 'translate(64 0) scale(-1 1)'] as flip (flip)}
		<g transform={flip || undefined}>
			<path d="M21.2 46.2 L29 64.5 L22.4 64.5 L15.6 52.4 L19.8 50.6 L17.6 48.6 Z" fill="url(#{u('lapel')})" stroke={O} stroke-width=".8" stroke-linejoin="round" />
			<path d="M20.6 48.4 L26.4 62.4" stroke="#a477d0" stroke-width=".5" stroke-linecap="round" opacity=".6" />
		</g>
	{/each}
	<!-- a playing card in his breast pocket -->
	<g transform="rotate(10 48.4 54)">
		<rect x="45.4" y="49.6" width="6.2" height="8.6" rx=".8" fill="#fbf7ee" stroke="#2a1a1a" stroke-width=".4" />
		<text x="46.1" y="52.6" font-size="2.6" font-weight="800" fill="#c8202c" font-family="Bahnschrift, 'Segoe UI', sans-serif">J</text>
		<path d="M47.4 55.6 L48.1 54 L48.8 55 L49.5 53.6 L50.2 55 L50.9 54 L51.1 55.8 Z" fill="#c8202c" />
	</g>
	<path d="M43.6 55.2 L53.8 56.6" stroke="#2a1240" stroke-width="1.1" stroke-linecap="round" />
	<path d="M43.6 55.2 L53.8 56.6" stroke="#8d58ba" stroke-width=".4" stroke-linecap="round" opacity=".6" />

	<g class="jk-head">
		<!-- the mop of hair behind his head -->
		<g fill="none" stroke-linecap="round">
			{#each WISPS as d (d)}
				<path {d} stroke={O} stroke-width="1.5" />
				<path {d} stroke="#8a9440" stroke-width=".7" />
			{/each}
		</g>
		<path d={HAIR_BACK} fill="url(#{u('hair')})" stroke={O} stroke-width=".9" stroke-linejoin="round" />
		<path d="M17.6 24 C17.8 30 18.8 35 20.6 38.6 M46.4 24 C46.2 30 45.2 35 43.4 38.6 M20.4 12.6 C18.4 16 17.4 20 17.2 24 M43.6 12.6 C45.6 16 46.6 20 46.8 24" fill="none" stroke="#3c4618" stroke-width=".6" stroke-linecap="round" />
		<path d="M24.4 8.6 C22 10.6 20.4 13 19.6 15.6 M39.4 8.4 C41.8 10 43.4 12.2 44.2 14.6" fill="none" stroke="#c9c46a" stroke-width=".5" stroke-linecap="round" opacity=".7" />

		<!-- neck, then the face in smeared white paint, thin at the jaw so skin shows through -->
		<path d="M27.6 39.6 L36.4 39.6 L37.2 46.8 L26.8 46.8 Z" fill="#d9c9b6" stroke={O} stroke-width=".7" />
		<path d="M27.8 43.6 Q32 45 36.2 43.6" fill="none" stroke="#a89280" stroke-width=".5" />
		<path d={FACE} fill="url(#{u('paint')})" stroke={O} stroke-width=".9" stroke-linejoin="round" />
		<path d="M24.6 35.8 C26 39.4 28.6 41.6 32 41.8 C35.4 41.6 38 39.4 39.4 35.8 C37.6 38.2 35 39.4 32 39.4 C29 39.4 26.4 38.2 24.6 35.8 Z" fill="#c8a68e" opacity=".55" />

		<!-- black smudged paint round the eyes, running, the brows drawn down -->
		<g filter="url(#{u('soft')})" opacity=".92">
			<path d={SOCKET(E.l[0], E.l[1], 1)} fill="#14100f" />
			<path d={SOCKET(E.r[0], E.r[1], -1)} fill="#14100f" />
		</g>
		<path d="M23.6 22.4 Q26.6 21.4 30 23.4 M40.4 22.4 Q37.4 21.4 34 23.4" fill="none" stroke="#1a1410" stroke-width="1" stroke-linecap="round" />
		<!-- eyes looking up from under the brows -->
		{#each [E.l, E.r] as [x, y] (x)}
			<ellipse cx={x} cy={y - 0.2} rx="1.7" ry="1" fill="#e8e2d6" />
			<circle cx={x} cy={y - 0.55} r=".72" fill="#1d1712" />
			<circle cx={x - 0.25} cy={y - 0.8} r=".22" fill="#fff" />
		{/each}
		<!-- the nose, a little shadow under it -->
		<path d="M32 26.6 L31 31.6 Q32 32.4 33.2 31.8" fill="none" stroke="#9a8a7c" stroke-width=".6" stroke-linecap="round" stroke-linejoin="round" />

		<!-- the red smeared mouth and the scars curling up both cheeks -->
		<path d="M25.8 34.6 C27.6 33.4 29.8 33 32 33.4 C34.2 33 36.4 33.4 38.2 34.6 C36.8 37.4 34.6 38.6 32 38.6 C29.4 38.6 27.2 37.4 25.8 34.6 Z" fill="#b5161f" opacity=".85" filter="url(#{u('soft')})" />
		<path d="M26.6 34.9 C28.6 34.4 30.4 34.5 32 34.9 C33.6 34.5 35.4 34.4 37.4 34.9 C36 36.8 34.2 37.4 32 37.4 C29.8 37.4 28 36.8 26.6 34.9 Z" fill="#d8303a" stroke="#5a0a0e" stroke-width=".4" stroke-linejoin="round" />
		<path d="M27.2 35.2 Q32 36.3 36.8 35.2" fill="none" stroke="#5a0a0e" stroke-width=".55" stroke-linecap="round" />
		<g fill="#c4202a" opacity=".85" filter="url(#{u('soft')})">
			<path d="M26.6 34.8 C24.8 33.8 23.8 31.8 23.6 29.2 C24.8 30.6 25.8 32.2 27.4 33.6 Z" />
			<path d="M37.4 34.8 C39.2 33.8 40.2 31.8 40.4 29.2 C39.2 30.6 38.2 32.2 36.6 33.6 Z" />
		</g>
		<path d="M26.4 34.6 C25 33.6 24.2 31.8 23.9 29.6 M37.6 34.6 C39 33.6 39.8 31.8 40.1 29.6" fill="none" stroke="#5a0a0e" stroke-width=".5" stroke-linecap="round" />
		<path d="M24.4 31.4 l1 -.5 M24.9 32.7 l1 -.4 M39.6 31.4 l-1 -.5 M39.1 32.7 l-1 -.4" stroke="#5a0a0e" stroke-width=".35" stroke-linecap="round" />

		<!-- greasy strands over the forehead and the sides of the face -->
		<g class="jk-strand">
			{#each STRANDS as d (d)}
				<path {d} fill="url(#{u('hair')})" stroke={O} stroke-width=".6" stroke-linejoin="round" />
			{/each}
		</g>
		<path d="M30 9.4 C27.6 11.6 26 14.4 25.4 17.6 M34 9.8 C36 11.6 37.2 13.8 37.8 16.4" fill="none" stroke="#c9c46a" stroke-width=".5" stroke-linecap="round" opacity=".8" />

		<!-- BurgiShop: eyes over his eyes, a hat on the hair (the 420 pack 2) -->
		{@html eyesItem(uid, face?.eyes, F.eyes)}
		{@html hatItem(uid, face?.hat, F.head)}

		{#if ITEM}
			<!-- BurgiShop's 420 pack 2: something in the right corner of his mouth -->
			{@html ITEM.markup}
			{@html smoke(uid, ITEM.end[0], ITEM.end[1], 0.7 * ITEM.boost)}
		{:else if mouth === 'mouth-goldholk'}
			<!-- BurgiShop's Golden Holk -->
			{@html GOLD_HOLK}
			{@html HOLK_SMOKE}
		{:else if EXHALE}
			{@html EXHALE}
		{/if}
	</g>
</svg>

<style>
	/* the head tilts a little now and then, a strand of hair sways with it */
	.jk-head {
		transform-box: fill-box;
		transform-origin: 50% 92%;
		animation: jk-tilt 5s ease-in-out infinite;
	}
	@keyframes jk-tilt {
		0%,
		55%,
		100% {
			transform: rotate(0deg);
		}
		68%,
		82% {
			transform: rotate(-4deg);
		}
	}
	.jk-strand {
		transform-box: fill-box;
		transform-origin: 50% 0%;
		animation: jk-strand 5s ease-in-out infinite;
	}
	@keyframes jk-strand {
		0%,
		55%,
		100% {
			transform: rotate(0deg);
		}
		72% {
			transform: rotate(2.5deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.jk-head,
		.jk-strand {
			animation: none;
		}
	}
</style>
