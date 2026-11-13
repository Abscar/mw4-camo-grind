<!--
	Drängen Lars Åke's emblem in the header's Squad frame (2026-11-13, the user's ask: their friend Robin uses
	the tracker too, callsign "Drängen Lars Åke", and wants this operator skin). Drawn after the user's in-game
	screenshot of the skin he picked: black FAST helmet with side rails and an NVG mount, black headset with a
	mic boom, big lime-green goggles in a black frame, black balaclava, grey hood collar, black T-shirt with
	grey sleeve hems over muscular brown arms with dark tattoos, black plate carrier with lime buckles on the
	shoulder straps and sides, three mag pouches with silver mags poking up and lime bands. The real vest has
	a drinks brand's claw logo on the chest: NOT drawn, a plain lime patch instead (no brand logos on the page).
	Where Abscar has his holk and Phillestar his hamburger, he holds up a big cold beer (the user's ask, same
	day): a glass mug with a foam head, bubbles rising, condensation drops, in his grey-gloved fist with the
	skin's lime wristband; it tilts now and then like a "cheers". A plain beer, no brand.
	Same size and style as PhillestarEmblem / AbscarOperator: 64×64 head and shoulders, overflow visible.
	Our own cartoon, decoration only (aria-hidden; the callsign next to it is the text). No skin or operator
	names on the page, only the callsign.
-->
<script lang="ts">
	const uid = $props.id(); // ids must be unique per drawing
	const u = (name: string) => `${uid}-${name}`;
	const O = '#0f0d0b';

	/** the goggles: black frame and the lime lens inside it (also the glow and the glint's clip) */
	const FRAME =
		'M17.4 24.6 C17.4 22.1 19.2 21 21.8 21 L42.2 21 C44.8 21 46.6 22.1 46.6 24.6 L46.2 29.4 C45.9 31.9 44.1 33 41.6 33 L37.2 33 C35.5 33 34.6 31 32 31 C29.4 31 28.5 33 26.8 33 L22.4 33 C19.9 33 18.1 31.9 17.8 29.4 Z';
	const LENS =
		'M19 24.9 C19 23.2 20.3 22.4 22.2 22.4 L41.8 22.4 C43.7 22.4 45 23.2 45 24.9 L44.7 29.1 C44.5 30.7 43.3 31.5 41.5 31.5 L37.6 31.5 C36.2 31.5 35 29.6 32 29.6 C29 29.6 27.8 31.5 26.4 31.5 L22.5 31.5 C20.7 31.5 19.5 30.7 19.3 29.1 Z';
	/** the three mag pouches on the vest: left x of each */
	const POUCHES = [20.8, 28.6, 36.4];
	/** the arm below each sleeve, the sleeve's grey hem and the tattoo lines (left side; the right is mirrored) */
	const ARM = 'M2 64.5 C2.1 61 2.6 58.4 3.6 56.4 L11.8 58.6 C11.4 60.6 11.3 62.6 11.5 64.5 Z';
	const HEM = 'M3.1 55 L12.6 57.3 L12.1 59.4 L2.6 57.1 Z';
	const INK = 'M4.4 61 q2 -1.6 4.2 -.4 M5 63.6 q1.6 -.9 3.2 .2 M8.8 60.4 l1.4 1.9 M3.6 59.2 q1.2 .6 2.4 .1';
	const MIRROR = 'translate(64 0) scale(-1 1)';

	/** the beer mug's glass (filled with beer); also the clip for the rising bubbles */
	const MUG = 'M45.6 37.4 L58.4 37.4 L58 56.2 Q57.9 57.8 56.3 57.8 L47.7 57.8 Q46.1 57.8 46 56.2 Z';
	const HANDLE = 'M58.2 40.4 C63.4 40.2 64.4 41.8 64.4 46.6 C64.4 51.4 63.4 53 58 52.8';
	/** bubbles rising in the beer: [x, r] */
	const BUBBLES = [
		[48.6, 0.5],
		[51.4, 0.65],
		[54, 0.45],
		[56.4, 0.6]
	];
	/** condensation drops on the cold glass: [x, y, rx, ry] */
	const DROPS = [
		[55.6, 47.8, 0.5, 0.75],
		[52.2, 52.6, 0.45, 0.65],
		[57, 43.4, 0.4, 0.6],
		[47.6, 49.6, 0.4, 0.6]
	];
</script>

<svg viewBox="0 0 64 64" class="size-16 flex-none overflow-visible sm:size-20" aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id={u('shirt')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#2d3035" /><stop offset="1" stop-color="#15171a" />
		</linearGradient>
		<linearGradient id={u('skin')} x1=".1" y1="0" x2=".9" y2="1">
			<stop offset="0" stop-color="#a06a48" /><stop offset=".55" stop-color="#7a4a30" /><stop offset="1" stop-color="#55311d" />
		</linearGradient>
		<linearGradient id={u('vest')} x1="0" y1="0" x2=".4" y2="1">
			<stop offset="0" stop-color="#2a2d32" /><stop offset="1" stop-color="#0e0f11" />
		</linearGradient>
		<linearGradient id={u('lime')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#c8ff80" /><stop offset=".5" stop-color="#7ee236" /><stop offset="1" stop-color="#3e9f1a" />
		</linearGradient>
		<linearGradient id={u('mag')} x1="0" y1="0" x2="1" y2="0">
			<stop offset="0" stop-color="#f2f4f6" /><stop offset=".4" stop-color="#b8bec5" /><stop offset=".75" stop-color="#7b828a" /><stop offset="1" stop-color="#d7dce1" />
		</linearGradient>
		<linearGradient id={u('bala')} x1="0" y1="0" x2=".3" y2="1">
			<stop offset="0" stop-color="#363a3f" /><stop offset="1" stop-color="#141618" />
		</linearGradient>
		<linearGradient id={u('helmet')} x1=".2" y1="0" x2=".8" y2="1">
			<stop offset="0" stop-color="#4c5057" /><stop offset=".45" stop-color="#25272b" /><stop offset="1" stop-color="#101113" />
		</linearGradient>
		<linearGradient id={u('cup')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#363a3f" /><stop offset="1" stop-color="#131416" />
		</linearGradient>
		<linearGradient id={u('lens')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#dcffa0" /><stop offset=".35" stop-color="#8cf03e" /><stop offset=".72" stop-color="#45c41f" /><stop offset="1" stop-color="#1f7d12" />
		</linearGradient>
		<filter id={u('glow')} x="-50%" y="-80%" width="200%" height="260%">
			<feGaussianBlur stdDeviation="1.8" />
		</filter>
		<filter id={u('led')} x="-200%" y="-200%" width="500%" height="500%">
			<feGaussianBlur in="SourceGraphic" stdDeviation=".7" result="b" />
			<feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
		</filter>
		<clipPath id={u('lens-clip')}><path d={LENS} /></clipPath>
		<linearGradient id={u('beer')} x1="0" y1="0" x2=".25" y2="1">
			<stop offset="0" stop-color="#ffe066" /><stop offset=".45" stop-color="#f5b02a" /><stop offset="1" stop-color="#c46a0c" />
		</linearGradient>
		<linearGradient id={u('glove')} x1="0" y1="0" x2=".6" y2="1">
			<stop offset="0" stop-color="#c3c8cd" /><stop offset=".6" stop-color="#959ca2" /><stop offset="1" stop-color="#6c7379" />
		</linearGradient>
		<clipPath id={u('mug-clip')}><path d={MUG} /></clipPath>
	</defs>

	<!-- broad shoulders in a black T-shirt, brown tattooed arms under grey sleeve hems -->
	<path d="M1.5 64.5 C2 54.5 8.5 48.6 20.5 46.8 L43.5 46.8 C55.5 48.6 62 54.5 62.5 64.5 Z" fill="url(#{u('shirt')})" stroke={O} stroke-width="1.1" stroke-linejoin="round" />
	{#each ['', MIRROR] as flip (flip)}
		<g transform={flip || undefined}>
			<path d={ARM} fill="url(#{u('skin')})" stroke={O} stroke-width=".8" stroke-linejoin="round" />
			<path d={INK} fill="none" stroke="#2a170e" stroke-width=".55" stroke-linecap="round" />
			<path d={HEM} fill="#8e949b" stroke={O} stroke-width=".6" stroke-linejoin="round" />
		</g>
	{/each}

	<!-- grey hood collar round the neck, the black balaclava neck going into it -->
	<path d="M19.5 47.8 C22 43.5 26 42.5 32 42.5 C38 42.5 42 43.5 44.5 47.8 C40.5 50.2 36.5 51 32 51 C27.5 51 23.5 50.2 19.5 47.8 Z" fill="#7f858b" stroke={O} stroke-width=".8" />
	<path d="M26 37 L38 37 L38.6 46 Q32 48.6 25.4 46 Z" fill="url(#{u('bala')})" stroke={O} stroke-width=".9" stroke-linejoin="round" />
	<path d="M24.5 46.3 Q32 50 39.5 46.3 L40.6 48.4 Q32 52.6 23.4 48.4 Z" fill="#a2a8ae" stroke={O} stroke-width=".6" stroke-linejoin="round" />

	<!-- plate carrier: shoulder straps with lime buckles, vest, plain lime chest patch, side buckles -->
	<path d="M17.2 51.6 L19.6 45.4 L25.6 45.6 L24.6 49.6 Z M46.8 51.6 L44.4 45.4 L38.4 45.6 L39.4 49.6 Z" fill="#1a1c1f" stroke={O} stroke-width=".8" stroke-linejoin="round" />
	<g fill="url(#{u('lime')})" stroke="#1d4a0c" stroke-width=".5">
		<rect x="19.8" y="46.4" width="4.8" height="2.6" rx=".6" transform="rotate(-14 22.2 47.7)" />
		<rect x="39.4" y="46.4" width="4.8" height="2.6" rx=".6" transform="rotate(14 41.8 47.7)" />
	</g>
	<path d="M21 47.6 h2.6 M40.4 47.6 h2.6" stroke="#1d4a0c" stroke-width=".45" />
	<path d="M16 64.5 L16.4 53.2 C16.6 50.6 18 49.4 20.4 49.2 L43.6 49.2 C46 49.4 47.4 50.6 47.6 53.2 L48 64.5 Z" fill="url(#{u('vest')})" stroke={O} stroke-width="1" stroke-linejoin="round" />
	<path d="M18.6 51.6 Q32 50.4 45.4 51.6" fill="none" stroke="#3a3e44" stroke-width=".6" />
	<rect x="28.6" y="50.8" width="6.8" height="4.4" rx=".9" fill="url(#{u('lime')})" stroke="#1d4a0c" stroke-width=".6" />
	<rect x="29.5" y="51.6" width="5" height="2.8" rx=".5" fill="none" stroke="#1d4a0c" stroke-width=".35" stroke-dasharray=".7 .5" />
	<g fill="url(#{u('lime')})" stroke="#1d4a0c" stroke-width=".45">
		<rect x="16.6" y="56.2" width="2.4" height="3.4" rx=".5" />
		<rect x="45" y="56.2" width="2.4" height="3.4" rx=".5" />
	</g>

	<!-- three mag pouches: silver mags poking up, lime bands -->
	{#each POUCHES as x (x)}
		<rect x={x + 1} y="55.6" width="4.8" height="4" rx=".5" fill="url(#{u('mag')})" stroke={O} stroke-width=".5" />
		<path d="M{x + 1.6} 56.6 h3.6" stroke="#5f666e" stroke-width=".4" />
		<rect {x} y="58.6" width="6.8" height="6" rx=".7" fill="#141518" stroke={O} stroke-width=".7" />
		<rect x={x + 0.35} y="62.3" width="6.1" height="2.3" fill="url(#{u('lime')})" />
	{/each}

	<!-- the head: black balaclava face under the helmet -->
	<path d="M19.6 24 C19.6 19 24.5 16.8 32 16.8 C39.5 16.8 44.4 19 44.4 24 L44.4 32.5 C44.4 40 39.5 44.5 32 44.5 C24.5 44.5 19.6 40 19.6 32.5 Z" fill="url(#{u('bala')})" stroke={O} stroke-width="1.1" />
	<path d="M30.2 34.8 Q32 36 33.8 34.8 M23.6 37.4 Q32 40.6 40.4 37.4 M26 41.4 Q32 43.2 38 41.4" fill="none" stroke="#454a50" stroke-width=".7" stroke-linecap="round" />

	<!-- black FAST helmet: highlight, side rails, NVG mount on the front -->
	<path d="M13.8 26.5 C12.6 12.5 20.5 3.8 32 3.8 C43.5 3.8 51.4 12.5 50.2 26.5 L46.4 26.5 C46.2 22.5 44.6 20.6 41.6 20.2 L22.4 20.2 C19.4 20.6 17.8 22.5 17.6 26.5 Z" fill="url(#{u('helmet')})" stroke={O} stroke-width="1.2" stroke-linejoin="round" />
	<path d="M19.5 13 Q24.5 7.4 32 7" fill="none" stroke="#5f646c" stroke-width="1.5" stroke-linecap="round" />
	<g stroke-linecap="round">
		<path d="M15.8 22.8 L18.6 14.6 M48.2 22.8 L45.4 14.6" stroke="#50555d" stroke-width="2" />
		<path d="M15.8 22.8 L18.6 14.6 M48.2 22.8 L45.4 14.6" stroke="#15161a" stroke-width=".8" stroke-dasharray=".7 .9" />
	</g>
	<path d="M28.2 5.6 L35.8 5.6 L35.2 10.6 Q32 11.4 28.8 10.6 Z" fill="#2a2d32" stroke={O} stroke-width=".7" stroke-linejoin="round" />
	<circle cx="32" cy="8.2" r=".95" fill="#6a6f77" />

	<!-- big lime goggles in a black frame: soft glow behind, gloss, a glint sweeping across now and then -->
	<path class="la-glow" d={LENS} fill="#7dff3a" filter="url(#{u('glow')})" />
	<path d={FRAME} fill="#0c0d0f" stroke={O} stroke-width=".8" stroke-linejoin="round" />
	<path d={LENS} fill="url(#{u('lens')})" />
	<g clip-path="url(#{u('lens-clip')})">
		<path d="M19 30.4 Q32 28.6 45 30.4 L45 32 L19 32 Z" fill="#14520c" opacity=".45" />
		<polygon class="la-glint" points="12,20 15.6,20 11.6,34 8,34" fill="#f6ffe6" opacity=".75" />
	</g>
	<path d="M21 24.1 Q32 22.9 43 24.1" fill="none" stroke="#f2ffd8" stroke-width=".9" stroke-linecap="round" opacity=".8" />
	<ellipse cx="23.6" cy="25.7" rx="1.7" ry=".7" fill="#fff" opacity=".5" />

	<!-- headset: ear cups over the goggle strap, mic boom to his mouth, a lime LED -->
	{#each [11.6, 45.6] as x (x)}
		<rect {x} y="22.6" width="6.8" height="12.4" rx="3.2" fill="url(#{u('cup')})" stroke={O} stroke-width="1" />
		<rect x={x + 1.3} y="24.6" width="4.2" height="8.4" rx="2.1" fill="none" stroke="#454a51" stroke-width=".6" />
	{/each}
	<path d="M14.6 34.4 C15 39.6 19.6 41.6 25.4 40.6" fill="none" stroke={O} stroke-width="1.7" stroke-linecap="round" />
	<path d="M14.6 34.4 C15 39.6 19.6 41.6 25.4 40.6" fill="none" stroke="#3d4146" stroke-width=".6" stroke-linecap="round" />
	<ellipse cx="26.4" cy="40.4" rx="1.9" ry="1.3" fill="#26282c" stroke={O} stroke-width=".6" />
	<circle class="la-led" cx="49" cy="25.6" r=".8" fill="#a6ff52" filter="url(#{u('led')})" />

	<!-- a big cold beer, held up in his grey-gloved fist (lime wristband, tattooed forearm) -->
	<g class="la-beer">
		<path d="M58.4 53.2 L64.6 53.2 C65.2 57 65.6 60.6 66 64.5 L57.6 64.5 C57.8 60.6 58 57 58.4 53.2 Z" fill="url(#{u('skin')})" stroke={O} stroke-width=".8" stroke-linejoin="round" />
		<path d="M59.4 57 q2 -1 4 .2 M59 60.6 q2.2 -1.2 4.6 0 M61.4 62.2 l1.4 1.6" fill="none" stroke="#2a170e" stroke-width=".5" stroke-linecap="round" />

		<!-- the glass mug: beer, bubbles, thick glass base, dimples, gloss, cold drops -->
		<path d={MUG} fill="url(#{u('beer')})" stroke={O} stroke-width="1" stroke-linejoin="round" />
		<g clip-path="url(#{u('mug-clip')})">
			{#each BUBBLES as [x, r], i (i)}<circle class="la-bubble" cx={x} cy="54" {r} fill="#fff6cf" opacity=".85" />{/each}
		</g>
		<path d="M46.2 54.4 L57.8 54.4 L58 56.2 Q57.9 57.8 56.3 57.8 L47.7 57.8 Q46.1 57.8 46 56.2 Z" fill="#fff4cc" opacity=".45" />
		<g fill="none" stroke="#fff4cc" stroke-width=".5" opacity=".45">
			<ellipse cx="50" cy="45.2" rx="1.5" ry="2.2" /><ellipse cx="54.2" cy="45.2" rx="1.5" ry="2.2" />
			<ellipse cx="50" cy="50.4" rx="1.5" ry="2.2" /><ellipse cx="54.2" cy="50.4" rx="1.5" ry="2.2" />
		</g>
		<rect x="47.2" y="39.8" width="1.3" height="13.6" rx=".65" fill="#fff" opacity=".55" />
		<rect x="56.5" y="40.4" width=".6" height="11.6" rx=".3" fill="#fff" opacity=".35" />
		{#each DROPS as [x, y, rx, ry], i (i)}<ellipse cx={x} cy={y} {rx} {ry} fill="#fff" opacity=".75" />{/each}
		<ellipse class="la-drop" cx="50.8" cy="42.2" rx=".55" ry=".8" fill="#fff" opacity=".8" />

		<!-- foam head spilling over the rim -->
		<path d="M56.4 39.2 C56.6 41 57 42.6 57.9 42.6 C58.7 42.6 58.6 41 58.4 39.2 Z" fill="#fffaf0" stroke={O} stroke-width=".6" />
		<path d="M45 38.6 C44.2 35.8 46.2 34 48.6 34.6 C49.4 32.4 52.8 32 54.2 33.8 C56 32.7 59.3 33.4 59.4 36 C60.9 36.6 60.6 39 59 39.4 L46.4 39.6 C45.2 39.6 44.5 39.2 45 38.6 Z" fill="#fffaf0" stroke={O} stroke-width=".8" stroke-linejoin="round" />
		<path d="M46 38.4 Q52 39.4 58.6 38.2" fill="none" stroke="#e3d6b8" stroke-width=".8" stroke-linecap="round" />
		<g fill="#ece0c6"><circle cx="48.6" cy="36.4" r=".5" /><circle cx="52.4" cy="35.2" r=".4" /><circle cx="56.2" cy="36.2" r=".45" /></g>

		<!-- glass handle, the fist round it, thumb on top, lime wristband with a small watch -->
		<path d={HANDLE} fill="none" stroke={O} stroke-width="3.9" stroke-linecap="round" />
		<path d={HANDLE} fill="none" stroke="#d8ecf8" stroke-width="2.3" stroke-linecap="round" opacity=".9" />
		<rect x="57.4" y="42.4" width="7.6" height="9" rx="3.2" fill="url(#{u('glove')})" stroke={O} stroke-width=".8" />
		<path d="M58.4 44.8 h4.6 M58.4 47 h4.8 M58.4 49.2 h4.6" stroke="#5d646a" stroke-width=".5" stroke-linecap="round" />
		<path d="M58.2 43.4 C57.9 41.5 59.4 40.6 61.6 40.8 C63.4 41 63.8 42.6 62.8 43.6 Z" fill="url(#{u('glove')})" stroke={O} stroke-width=".7" stroke-linejoin="round" />
		<rect x="58" y="51.2" width="6.8" height="2.3" rx=".5" fill="url(#{u('lime')})" stroke="#1d4a0c" stroke-width=".5" />
		<rect x="60.5" y="51.1" width="1.9" height="2.5" rx=".4" fill="#1b1d20" stroke={O} stroke-width=".35" />
	</g>
</svg>

<style>
	/* the goggles glow softly, a bit stronger now and then */
	.la-glow {
		opacity: 0.5;
		animation: la-glow 3.4s ease-in-out infinite;
	}
	@keyframes la-glow {
		0%,
		100% {
			opacity: 0.35;
		}
		50% {
			opacity: 0.75;
		}
	}
	/* a glint sweeps across the lens every few seconds (out of sight left of the lens otherwise) */
	.la-glint {
		animation: la-glint 5.5s ease-in-out infinite;
	}
	@keyframes la-glint {
		0%,
		55% {
			transform: translateX(0);
		}
		85%,
		100% {
			transform: translateX(42px);
		}
	}
	/* the beer lifts in a little "cheers" and back (round the bottom of his forearm) */
	.la-beer {
		transform-box: fill-box;
		transform-origin: 70% 100%;
		animation: la-cheers 4.2s ease-in-out infinite;
	}
	@keyframes la-cheers {
		0%,
		60%,
		100% {
			transform: translate(0, 0) rotate(0deg);
		}
		75% {
			transform: translate(-0.6px, -1.4px) rotate(-6deg);
		}
	}
	/* bubbles rise through the beer (they stay put at the bottom with reduced motion) */
	.la-bubble {
		animation: la-bubble 2.6s linear infinite;
	}
	.la-bubble:nth-child(2) {
		animation-delay: -0.7s;
	}
	.la-bubble:nth-child(3) {
		animation-delay: -1.5s;
	}
	.la-bubble:nth-child(4) {
		animation-delay: -2.1s;
	}
	@keyframes la-bubble {
		0% {
			transform: translateY(0);
			opacity: 0;
		}
		15% {
			opacity: 0.85;
		}
		100% {
			transform: translateY(-15px);
			opacity: 0.4;
		}
	}
	/* a condensation drop runs down the cold glass */
	.la-drop {
		animation: la-drop 3.8s ease-in infinite;
	}
	@keyframes la-drop {
		0%,
		30% {
			transform: translateY(0);
			opacity: 0.8;
		}
		90% {
			transform: translateY(8px);
			opacity: 0.6;
		}
		100% {
			transform: translateY(9px);
			opacity: 0;
		}
	}
	/* the headset's LED blinks: radio on */
	.la-led {
		animation: la-led 2.4s steps(1, end) infinite;
	}
	@keyframes la-led {
		0%,
		70% {
			opacity: 1;
		}
		71%,
		100% {
			opacity: 0.25;
		}
	}
</style>
