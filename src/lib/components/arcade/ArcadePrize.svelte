<!--
	BurgiArcade's prize counter drawings (arcade-prizes.ts, 2026-11-22): the pets, plushies and mounts players
	trade their tickets for, worn on their operator emblem. Our own cartoons (no real brand or character):
	  pets   (a-pet-*)   32 × 32, sitting on the shoulder like ShopPet's sidekicks;
	  plush  (a-plush-*) 32 × 32, soft toys hugged in front of the chest: stitch seams, button / embroidered eyes,
	                     a felt texture and a sewn-on tag;
	  mounts (a-mount-*) 96 × 64 (width = size × 1.5), side view facing right. OpGear draws the 64 × 64 emblem on
	                     top, centred (x 16–80) with its bottom at y ≈ 52, so each mount reads from what sticks out:
	                     its head / front at the right, its rear / tail at the left, wheels / legs below y 48.
	Each has a gentle endless idle animation (scoped CSS below), switched off by prefers-reduced-motion.
	Gradient / pattern ids come from $props.id(), so the same prize can be on screen many times. Unknown id →
	nothing. Animated elements never carry a transform attribute (a CSS transform would replace it).
-->
<script module lang="ts">
	/** Every prize id this component draws (scripts test that each one draws something). */
	export const PRIZE_IDS: string[] = [
		'a-pet-ghost',
		'a-pet-ufo',
		'a-pet-duck',
		'a-pet-hamster',
		'a-pet-robo',
		'a-pet-bat',
		'a-pet-fox',
		'a-pet-dragon',
		'a-plush-teddy',
		'a-plush-burger',
		'a-plush-bunny',
		'a-plush-dino',
		'a-plush-shark',
		'a-plush-octo',
		'a-plush-uni',
		'a-plush-gold',
		'a-mount-cart',
		'a-mount-board',
		'a-mount-pony',
		'a-mount-quad',
		'a-mount-couch',
		'a-mount-duck',
		'a-mount-dragon',
		'a-mount-unicorn'
	];
</script>

<script lang="ts">
	import { heartPath } from '#lib/karmaShopArt.ts';

	let { id, size }: { id: string; size?: number } = $props();
	const uid = $props.id();
	const g = (n: string) => `${uid}-${n}`;
	const u = (n: string) => `url(#${uid}-${n})`;
	const known = $derived(PRIZE_IDS.includes(id));
	const mount = $derived(id.startsWith('a-mount-'));
	const h = $derived(size ?? (mount ? 64 : 32));

	const O = '#1a0630';
	const B = '#2a1408';
	const f = (n: number) => +n.toFixed(2);
	/** a four-point twinkle centred on (x, y), arms r long */
	const star = (x: number, y: number, r: number) => {
		const k = r * 0.22;
		return `M${f(x)} ${f(y - r)} Q${f(x + k)} ${f(y - k)} ${f(x + r)} ${f(y)} Q${f(x + k)} ${f(y + k)} ${f(x)} ${f(y + r)} Q${f(x - k)} ${f(y + k)} ${f(x - r)} ${f(y)} Q${f(x - k)} ${f(y - k)} ${f(x)} ${f(y - r)} Z`;
	};
	/** a sewn seam on a plushie */
	const STITCH = { fill: 'none', 'stroke-width': 0.42, 'stroke-dasharray': '1 .7', 'stroke-linecap': 'round' } as const;

	/* ---------- shapes reused below ---------- */
	const DUCK_BODY = 'M4.4 13.6 C6.4 15 7.8 17 10.2 17.4 C12.8 17.8 14.6 16.8 17 17 C22 17.4 28 18.2 28 22.8 C28 27 23.2 28.8 16 28.8 C8.8 28.8 4.4 26.6 3.8 21.8 C3.5 19.2 3.6 16 4.4 13.6 Z';
	const BAT_WING = 'M12.4 14.2 C10.2 9.4 5.2 8 1.4 10.4 C1.2 13.2 2 15.6 3.4 17 C4.4 16 5.8 16 6.6 17.4 C7.6 16.6 9 16.8 9.8 18 C10.6 17.2 11.6 17.2 12.6 17.6 Z';
	const BAT_LETTUCE = 'M2.8 17.6 Q3.6 18.9 4.7 18.1 Q5.7 17.5 6.7 18.6 Q7.7 17.8 8.8 18.9 Q9.8 18.2 10.8 18.9 Q11.8 18.3 12.6 18.7';
	const DRAGON_WING = 'M13.8 17 C11.6 12.2 7.8 10.6 5.2 11.8 C6.4 12.8 6.4 14.2 5.8 15.2 C7 15 8.2 15.6 8.4 16.8 C9.6 16.2 10.8 16.6 11.2 17.8 Z';
	const DINO_BODY = 'M2 23.4 C5 22.6 7.6 19.4 9.6 16.4 C11.6 13.4 14.4 12 17 12.6 C20.4 13.4 22.4 16.4 22.4 20.6 C22.4 24.8 20.4 28.4 15.6 28.6 H11.4 C8.6 28.6 7.4 27 6.4 26 C5 24.6 3.6 24.2 2 23.4 Z';
	const DINO_HEAD = 'M15.4 8.6 C15.4 4.6 18.6 2.6 22.6 2.6 C27.6 2.6 30.8 4.8 30.8 8.8 C30.8 12 28.6 13.4 24.6 13.4 H20.4 C17.4 13.4 15.4 11.6 15.4 8.6 Z';
	/** dino spikes [x, y, angle] along the head and back */
	const DINO_SPIKES = [
		[18.6, 3.4, -28],
		[22.4, 2.4, -6],
		[15.6, 10.2, -42],
		[12.6, 12.6, -46],
		[9.6, 15.8, -50],
		[6.6, 19.4, -56],
		[3.8, 22, -62]
	];
	/** the dino's felt teeth hang under its smile */
	const DINO_TEETH = [
		[22.2, 11.25],
		[24.2, 11.55],
		[26.2, 11.5],
		[28.2, 11.05]
	];
	const OCTO_ARMS_L = ['M9.4 20 C6.4 22 3.6 22.6 2.8 25.2 C2.2 27.4 4.6 28.4 5.6 26.6', 'M11.8 22 C10.4 25 9 27.4 9.8 29.2 C10.6 30.6 12.4 29.6 11.8 28.4'];
	const OCTO_ARMS_M = ['M14.6 22.8 C14.2 25.6 14 28 15.2 29.6', 'M17.4 22.8 C17.8 25.6 18 28 16.8 29.6'];
	const OCTO_ARMS_R = ['M20.2 22 C21.6 25 23 27.4 22.2 29.2 C21.4 30.6 19.6 29.6 20.2 28.4', 'M22.6 20 C25.6 22 28.4 22.6 29.2 25.2 C29.8 27.4 27.4 28.4 26.4 26.6'];
	const OCTO_ARMS: [string[], string][] = [
		[OCTO_ARMS_L, 'ap-arm-l'],
		[OCTO_ARMS_M, ''],
		[OCTO_ARMS_R, 'ap-arm-r']
	];
	/** the UFO's rim lights [x, y, colour] */
	const UFO_LIGHTS: [number, number, string][] = [
		[5.6, 18.6, '#ff4f7a'],
		[10.6, 19.7, '#ffe14a'],
		[16, 20.1, '#4fe8ff'],
		[21.4, 19.7, '#ffe14a'],
		[26.4, 18.6, '#ff4f7a']
	];
	const ROBO_LEDS: [number, string][] = [
		[11.6, '#4fff8a'],
		[13.2, '#ffe14a'],
		[14.8, '#4fe8ff']
	];
	/** the unicorn plush's little yarn tail [x, y, colour] */
	const UNI_TAIL: [number, number, string][] = [
		[9.2, 25.4, '#7ab8ff'],
		[7.8, 23.4, '#c48aff'],
		[7.6, 26.8, '#ff8ac8']
	];
	const RAINBOW = ['#ff5a7a', '#ffa63a', '#ffe14a', '#5ad86a', '#4ab0ff', '#a46aff'];
	/** rainbow strands, drawn bottom (5) to top (0) */
	const STRANDS = [5, 4, 3, 2, 1, 0];
	/** the unicorn plush's yarn mane: [x, y, colour] curls down the left side of its head, then the forelock */
	const UNI_MANE = [
		[12.6, 4.6, '#ff8ac8'],
		[10.2, 5.8, '#c48aff'],
		[8.8, 8.2, '#7ab8ff'],
		[8.3, 10.9, '#6ae0b0'],
		[8.5, 13.6, '#ffe27a'],
		[9.4, 16.2, '#ff8ac8'],
		[19.4, 4.7, '#7ab8ff']
	] as const;

	/* ---------- mounts ---------- */
	/** the shopping cart's wire grid inside the basket (rear top 11,25 → front top 91,22 → front bottom 82,47 → rear bottom 16,47) */
	const CART_WIRES = (() => {
		const top = (x: number) => 25 - (3 * (x - 11)) / 80;
		const d: string[] = [];
		for (let x = 18; x <= 88; x += 5.8) {
			const y1 = x <= 82 ? 47 : 22 + (25 * (91 - x)) / 9;
			d.push(`M${f(x)} ${f(top(x))} V${f(y1)}`);
		}
		for (const t of [0.3, 0.56, 0.8]) d.push(`M${f(11 + 5 * t)} ${f(25 + 22 * t)} L${f(91 - 9 * t)} ${f(22 + 25 * t)}`);
		return d.join(' ');
	})();
	/** the giant duck's water: a wave 16 long, drawn wider than the box so it can slide one wave length */
	const WAVE = (() => {
		let d = 'M-16 55.4 Q-12 52.8 -8 55.4';
		for (let x = 0; x <= 112; x += 8) d += ` T${x} 55.4`;
		return `${d} V64 H-16 Z`;
	})();
	const DUCK_MOUNT = 'M5 20 C8.4 22.4 11 27 16 28.4 C23 30.2 31 28 41 28 C57 28 71 30 79 36 C85 40.6 85.4 48.4 81 52.6 C76.6 56.8 64 58.6 46 58.6 C26 58.6 12.4 56.4 8.4 48.4 C5.4 42.2 4 30 5 20 Z';
	const DRAGON_HEAD = 'M70 13.4 C70 8 74.6 5 80.6 5.4 C85.6 5.8 88.6 8.4 91.6 11.8 C94.4 14.8 95.6 17.8 94 19.8 C92.4 21.6 89 21.4 86 21.8 C82 22.4 78 24.2 74.6 22.8 C71.6 21.6 70 18 70 13.4 Z';
	const UNI_HEAD = 'M71.6 13.2 C71.6 7.6 75.8 4.6 80.6 4.8 C84.8 5 87.8 7.2 89.8 10.6 L94.8 18.4 C96.4 21.2 95.2 24.6 92.2 25 C89.6 25.4 87.4 24 84.8 23.6 C80.8 23 77.2 23.6 74.8 21.4 C72.6 19.4 71.6 16.6 71.6 13.2 Z';
	const HORSE_HEAD = 'M68.6 17.6 C68.6 11.8 72.6 8.4 78 8.4 C82.4 8.4 84.6 9.8 87 12.8 L93.4 20.2 C95.4 22.6 94.6 26 91.4 26.4 C88.8 26.8 86.8 25.2 84.2 24.6 C80.8 23.8 76.8 24.4 73.8 22.4 C70.8 20.6 68.6 20.4 68.6 17.6 Z';
	/** a mane / tail strand of the golden unicorn, i = 0 (on top) … 5 */
	const uniMane = (i: number) =>
		`M${f(74.4 - i * 0.5)} ${f(5.6 + i * 0.7)} C${f(68.6 - i * 0.9)} ${f(9 + i)} ${f(63.6 - i * 0.9)} ${f(16.6 + i * 0.7)} ${f(59.4 - i * 0.8)} ${f(26 + i * 0.5)} S${f(54.4 - i * 0.6)} ${f(34.6 + i * 0.4)} ${f(57 - i * 0.6)} ${f(37.8 + i * 0.4)}`;
	const uniTail = (i: number) =>
		`M28.6 ${f(35 + i * 0.9)} C20.6 ${f(32.4 + i * 1.5)} ${f(12.6 - i * 0.4)} ${f(37 + i * 1.8)} ${f(7.4 + i * 0.5)} ${f(45 + i * 1.3)} S${f(4.6 + i * 0.8)} ${f(53.4 + i * 0.7)} ${f(8.6 + i * 0.7)} ${f(55.4 + i * 0.5)}`;
	const SPOKES16 = Array.from({ length: 16 }, (_, i) => i * 22.5);
</script>

{#if known}
	<svg
		viewBox={mount ? '0 0 96 64' : '0 0 32 32'}
		width={mount ? h * 1.5 : h}
		height={h}
		class="ap"
		class:ap-pet={id.startsWith('a-pet-')}
		data-prize={id}
		aria-hidden="true"
		focusable="false"
	>
		{#snippet felt()}
			<pattern id={g('felt')} width="1.9" height="1.9" patternUnits="userSpaceOnUse" patternTransform="rotate(24)">
				<circle cx=".45" cy=".5" r=".26" fill="#fff" opacity=".2" />
				<circle cx="1.4" cy="1.35" r=".22" fill="#000" opacity=".12" />
			</pattern>
		{/snippet}
		{#snippet tag(x: number, y: number, a: number)}
			<!-- a sewn-on label: a white tab with a little red heart, stitched along its top -->
			<g transform="rotate({a} {x} {y})">
				<rect x={x - 1.5} y={y - 0.4} width="3" height="3.8" rx=".45" fill="#fffaf2" stroke={O} stroke-width=".45" />
				<path d="M{x - 1.05} {y + 0.35} H{x + 1.05}" fill="none" stroke="#b8a898" stroke-width=".3" stroke-dasharray=".45 .35" />
				<path d={heartPath(x, y + 2.05, 1.6)} fill="#ff4f7a" />
			</g>
		{/snippet}
		{#snippet twinkle(x: number, y: number, r: number, d: number, fill: string)}
			<path class="ap-twinkle" d={star(x, y, r)} {fill} stroke="#b8860b" stroke-width={f(r * 0.16)} stroke-linejoin="round" style="animation-delay:-{d}s" />
		{/snippet}
		{#snippet eye(x: number, y: number, r: number)}
			<!-- a shiny black button eye with two thread holes -->
			<circle cx={x} cy={y} r={r} fill="#120a10" stroke="#4a3a40" stroke-width=".35" />
			<circle cx={x - r * 0.25} cy={y + r * 0.35} r={r * 0.13} fill="#5a4a50" /><circle cx={x + r * 0.25} cy={y + r * 0.35} r={r * 0.13} fill="#5a4a50" />
			<circle cx={x - r * 0.36} cy={y - r * 0.36} r={r * 0.32} fill="#fff" opacity=".92" />
		{/snippet}
		{#snippet teddy(gold: boolean)}
			{@const line = gold ? '#5a3a04' : B}
			{@const seam = gold ? '#a8740a' : '#5a2e10'}
			<defs>
				<radialGradient id={g('fur')} gradientUnits="userSpaceOnUse" cx="12.4" cy="8.4" r="23">
					{#if gold}
						<stop offset="0" stop-color="#fffbe0" /><stop offset=".35" stop-color="#ffd84a" /><stop offset=".7" stop-color="#e0a420" /><stop offset="1" stop-color="#9a6206" />
					{:else}
						<stop offset="0" stop-color="#e8b070" /><stop offset=".55" stop-color="#b06a2c" /><stop offset="1" stop-color="#6a3610" />
					{/if}
				</radialGradient>
				<radialGradient id={g('lt')} cx=".4" cy=".35" r=".8">
					{#if gold}
						<stop offset="0" stop-color="#fffdf0" /><stop offset="1" stop-color="#f6d870" />
					{:else}
						<stop offset="0" stop-color="#fae0b4" /><stop offset="1" stop-color="#d8a062" />
					{/if}
				</radialGradient>
				<radialGradient id={g('glow')}><stop offset="0" stop-color="#fff3a0" stop-opacity=".7" /><stop offset="1" stop-color="#ffd23a" stop-opacity="0" /></radialGradient>
				<linearGradient id={g('crown')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8c8" /><stop offset=".5" stop-color="#ffcf2a" /><stop offset="1" stop-color="#b87a00" /></linearGradient>
				{@render felt()}
			</defs>
			{#if gold}<circle class="ap-glow" cx="16" cy="16" r="16" fill={u('glow')} />{/if}
			<g class="ap-squish">
				<!-- arms behind, legs with paw pads -->
				<ellipse cx="7.4" cy="19.4" rx="2.5" ry="3.9" transform="rotate(32 7.4 19.4)" fill={u('fur')} stroke={line} stroke-width=".9" />
				<ellipse cx="24.6" cy="19.4" rx="2.5" ry="3.9" transform="rotate(-32 24.6 19.4)" fill={u('fur')} stroke={line} stroke-width=".9" />
				<ellipse cx="10.8" cy="26.6" rx="3.7" ry="3.1" fill={u('fur')} stroke={line} stroke-width=".9" />
				<ellipse cx="21.2" cy="26.6" rx="3.7" ry="3.1" fill={u('fur')} stroke={line} stroke-width=".9" />
				<ellipse cx="10.4" cy="27.1" rx="2.1" ry="1.8" fill={u('lt')} />
				<ellipse cx="21.6" cy="27.1" rx="2.1" ry="1.8" fill={u('lt')} />
				<ellipse cx="10.4" cy="27.1" rx="1.6" ry="1.3" {...STITCH} stroke={seam} stroke-width=".3" />
				<ellipse cx="21.6" cy="27.1" rx="1.6" ry="1.3" {...STITCH} stroke={seam} stroke-width=".3" />
				<!-- body -->
				<ellipse cx="16" cy="21.2" rx="6.5" ry="6.3" fill={u('fur')} stroke={line} stroke-width=".9" />
				<ellipse cx="16" cy="21.2" rx="6.5" ry="6.3" fill={u('felt')} />
				<path d="M16 16.6 V27.2" {...STITCH} stroke={seam} />
				<!-- ears + head -->
				<circle cx="9.4" cy="6.4" r="3.3" fill={u('fur')} stroke={line} stroke-width=".9" />
				<circle cx="22.6" cy="6.4" r="3.3" fill={u('fur')} stroke={line} stroke-width=".9" />
				<circle cx="9.7" cy="6.7" r="1.8" fill={u('lt')} />
				<circle cx="22.3" cy="6.7" r="1.8" fill={u('lt')} />
				<circle cx="16" cy="11.6" r="7.2" fill={u('fur')} stroke={line} stroke-width=".9" />
				<circle cx="16" cy="11.6" r="7.2" fill={u('felt')} />
				<path d="M16 4.7 V8.6" {...STITCH} stroke={seam} />
				<path d="M11.2 6.8 Q13 5.4 15 5.2" fill="none" stroke="#fff" stroke-width=".7" stroke-linecap="round" opacity={gold ? 0.85 : 0.4} />
				<!-- muzzle, satin-stitched nose, smile, button eyes -->
				<ellipse cx="16" cy="14.3" rx="3.4" ry="2.6" fill={u('lt')} stroke={line} stroke-width=".45" />
				<path d="M14.6 13.1 Q16 12.5 17.4 13.1 Q16.7 14.5 16 14.7 Q15.3 14.5 14.6 13.1 Z" fill="#2a1408" />
				<path d="M15.3 13.2 L15.7 14.1 M16 13 V14.3 M16.7 13.2 L16.3 14.1" stroke="#6a4a3a" stroke-width=".22" />
				<path d="M16 14.7 V15.3 M14.8 15.4 Q16 16.4 17.2 15.4" fill="none" stroke="#2a1408" stroke-width=".5" stroke-linecap="round" />
				{@render eye(12.8, 10.6, 1.4)}
				{@render eye(19.2, 10.6, 1.4)}
				{#if gold}
					<!-- an embroidered red heart on the tummy, a little crown with gems -->
					<path d={heartPath(17.8, 22, 3.8)} fill="#e2263f" stroke="#8a0a1e" stroke-width=".3" stroke-linejoin="round" />
					<path d={heartPath(17.8, 22, 2.7)} {...STITCH} stroke="#ffb0c0" stroke-width=".25" stroke-dasharray=".5 .4" />
					<g transform="rotate(-9 16 4)">
						<path d="M12.4 6 L12 2.1 L14.2 3.8 L16 1.1 L17.8 3.8 L20 2.1 L19.6 6 Z" fill={u('crown')} stroke="#5a3a04" stroke-width=".55" stroke-linejoin="round" />
						<path d="M12.5 5.1 H19.5" stroke="#b87a00" stroke-width=".4" />
						<circle cx="16" cy="4.5" r=".75" fill="#e2263f" stroke="#7a0a14" stroke-width=".25" />
						<circle cx="13.8" cy="4.8" r=".45" fill="#3a8aff" /><circle cx="18.2" cy="4.8" r=".45" fill="#3a8aff" />
						<circle cx="12" cy="2.1" r=".55" fill="#fff8c8" stroke="#5a3a04" stroke-width=".25" />
						<circle cx="16" cy="1.1" r=".55" fill="#fff8c8" stroke="#5a3a04" stroke-width=".25" />
						<circle cx="20" cy="2.1" r=".55" fill="#fff8c8" stroke="#5a3a04" stroke-width=".25" />
					</g>
				{:else}
					<!-- a blue checked patch sewn onto the tummy -->
					<g transform="rotate(9 19 21.6)">
						<rect x="16.9" y="19.6" width="4.4" height="4.2" rx=".6" fill="#5aa6f0" stroke="#1a3a7a" stroke-width=".4" />
						<path d="M18.4 19.6 V23.8 M19.9 19.6 V23.8 M16.9 21 H21.3 M16.9 22.4 H21.3" stroke="#d8ecff" stroke-width=".3" opacity=".6" />
						<rect x="17.35" y="20.05" width="3.5" height="3.3" rx=".35" {...STITCH} stroke="#fff" stroke-width=".3" stroke-dasharray=".55 .4" />
					</g>
				{/if}
				{@render tag(9.4, 24.4, 28)}
			</g>
			{#if gold}
				{@render twinkle(3.6, 4.4, 1.9, 0, '#fffbe0')}
				{@render twinkle(28.6, 10, 1.5, 0.8, '#fffbe0')}
				{@render twinkle(27.4, 25.6, 1.3, 1.5, '#fffbe0')}
				{@render twinkle(3.8, 22, 1.2, 1.1, '#fffbe0')}
			{/if}
		{/snippet}

		{#if id === 'a-pet-ghost'}
			<!-- Pixel Ghost: a round cyan arcade ghost, big eyes glancing about, a scalloped hem, floating -->
			<defs>
				<radialGradient id={g('gh')} cx=".36" cy=".28" r=".9"><stop offset="0" stop-color="#eafeff" /><stop offset=".45" stop-color="#5ff0ff" /><stop offset="1" stop-color="#1190c4" /></radialGradient>
			</defs>
			<ellipse class="ap-shadow" cx="16" cy="30.9" rx="6.6" ry="1.1" fill="#000" opacity=".28" />
			<path class="ap-twinkle" d="M27.2 2.6 h1.1 v1.1 h1.1 v1.1 h-1.1 v1.1 h-1.1 v-1.1 h-1.1 v-1.1 h1.1 Z" fill="#c8fdff" stroke="#0e7aa6" stroke-width=".3" style="animation-delay:-.4s" />
			<path class="ap-twinkle" d="M3 7.6 h.9 v.9 h.9 v.9 h-.9 v.9 h-.9 v-.9 h-.9 v-.9 h.9 Z" fill="#c8fdff" stroke="#0e7aa6" stroke-width=".3" style="animation-delay:-1.5s" />
			<g class="ap-float">
				<path
					d="M5.6 27.6 V15.4 C5.6 8.6 10.2 4.2 16 4.2 C21.8 4.2 26.4 8.6 26.4 15.4 V27.6 Q23.8 30.8 21.2 27.4 Q18.6 30.8 16 27.4 Q13.4 30.8 10.8 27.4 Q8.2 30.8 5.6 27.6 Z"
					fill={u('gh')}
					stroke={O}
					stroke-width="1.1"
					stroke-linejoin="round"
				/>
				<path d="M7 25 Q16 26.8 25 25" fill="none" stroke="#0a6c96" stroke-width=".7" opacity=".45" stroke-linecap="round" />
				<path d="M8.4 14.4 C8.4 10.4 10.8 7.6 14 6.8" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".75" />
				<rect x="8.2" y="16.4" width="1.1" height="1.1" fill="#fff" opacity=".7" />
				<g class="ap-blink">
					<ellipse cx="12" cy="14.6" rx="3" ry="3.7" fill="#fff" stroke={O} stroke-width=".7" />
					<ellipse cx="20.2" cy="14.6" rx="3" ry="3.7" fill="#fff" stroke={O} stroke-width=".7" />
					<g class="ap-look">
						<circle cx="13" cy="15.3" r="1.8" fill="#2340c8" /><circle cx="21.2" cy="15.3" r="1.8" fill="#2340c8" />
						<circle cx="13" cy="15.3" r=".95" fill="#0a1450" /><circle cx="21.2" cy="15.3" r=".95" fill="#0a1450" />
						<circle cx="13.6" cy="14.5" r=".55" fill="#fff" /><circle cx="21.8" cy="14.5" r=".55" fill="#fff" />
					</g>
				</g>
				<ellipse cx="8.8" cy="19.6" rx="1.3" ry=".7" fill="#ff6ab0" opacity=".55" /><ellipse cx="23.4" cy="19.6" rx="1.3" ry=".7" fill="#ff6ab0" opacity=".55" />
				<path d="M14.4 19.7 Q16.1 21.9 17.8 19.7 Z" fill="#7a1a4a" stroke={O} stroke-width=".6" stroke-linejoin="round" />
			</g>
		{:else if id === 'a-pet-ufo'}
			<!-- Mini UFO: a chrome saucer, a little green alien in the dome, rim lights chasing, a flickering beam -->
			<defs>
				<linearGradient id={g('beam')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4ff8a" stop-opacity=".85" /><stop offset="1" stop-color="#7aff5a" stop-opacity="0" /></linearGradient>
				<linearGradient id={g('chr')} x1="0" y1="0" x2="0" y2="1"
					><stop offset="0" stop-color="#ffffff" /><stop offset=".36" stop-color="#d6dee9" /><stop offset=".6" stop-color="#7d8ba0" /><stop offset=".78" stop-color="#c3cdda" /><stop offset="1" stop-color="#58667a" /></linearGradient
				>
				<radialGradient id={g('dome')} cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff" stop-opacity=".7" /><stop offset=".5" stop-color="#bff4ff" stop-opacity=".22" /><stop offset="1" stop-color="#6fd8f0" stop-opacity=".5" /></radialGradient>
				<radialGradient id={g('al')} cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#d8ff9e" /><stop offset=".55" stop-color="#7ce04a" /><stop offset="1" stop-color="#3a9a22" /></radialGradient>
			</defs>
			<path class="ap-beam" d="M12.6 21.6 L6.6 31.6 H25.4 L19.4 21.6 Z" fill={u('beam')} />
			<g class="ap-hover">
				<path d="M8.4 20.2 Q16 25.6 23.6 20.2 Z" fill="#4d5a6c" stroke={O} stroke-width=".9" stroke-linejoin="round" />
				<ellipse class="ap-beam" cx="16" cy="22.2" rx="2.8" ry=".85" fill="#e0ffa0" />
				<ellipse cx="16" cy="17.6" rx="13.2" ry="4.4" fill={u('chr')} stroke={O} stroke-width="1" />
				<path d="M3.4 17.4 Q16 21.4 28.6 17.4" fill="none" stroke="#56647a" stroke-width=".55" />
				<ellipse cx="10.4" cy="15.7" rx="3.2" ry=".6" fill="#fff" opacity=".85" />
				<ellipse cx="16" cy="15.4" rx="7.8" ry="1.9" fill="#aeb9c8" stroke={O} stroke-width=".7" />
				<!-- the alien -->
				<path d="M14.8 10.6 L13.9 8.6 M17.2 10.6 L18.1 8.6" stroke="#2a6a14" stroke-width=".55" stroke-linecap="round" />
				<circle cx="13.8" cy="8.4" r=".7" fill="#ffe14a" stroke={O} stroke-width=".3" /><circle cx="18.2" cy="8.4" r=".7" fill="#ffe14a" stroke={O} stroke-width=".3" />
				<path d="M12.8 15.6 C12.8 14 14 13.9 16 13.9 C18 13.9 19.2 14 19.2 15.6 Z" fill="#5cbf36" stroke="#1f5a12" stroke-width=".45" />
				<ellipse cx="16" cy="12.2" rx="3.2" ry="2.9" fill={u('al')} stroke="#1f5a12" stroke-width=".5" />
				<ellipse cx="14.7" cy="12.5" rx="1.1" ry=".68" transform="rotate(28 14.7 12.5)" fill="#0d1a08" />
				<ellipse cx="17.3" cy="12.5" rx="1.1" ry=".68" transform="rotate(-28 17.3 12.5)" fill="#0d1a08" />
				<circle cx="14.4" cy="12.2" r=".28" fill="#fff" /><circle cx="17" cy="12.2" r=".28" fill="#fff" />
				<path d="M15.3 14 Q16 14.5 16.7 14" stroke="#1f5a12" stroke-width=".38" fill="none" stroke-linecap="round" />
				<!-- the glass dome over him -->
				<path d="M8.4 15.4 C8.4 4.8 23.6 4.8 23.6 15.4 Z" fill={u('dome')} stroke={O} stroke-width=".9" />
				<path d="M10.4 12.8 C10.6 10.2 12.4 8.6 14.6 8.2" fill="none" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".9" />
				{#each UFO_LIGHTS as [x, y, c], i (i)}
					<circle class="ap-chase" cx={x} cy={y} r=".95" fill={c} stroke={O} stroke-width=".35" style="animation-delay:{i * 0.25}s" />
				{/each}
			</g>
		{:else if id === 'a-pet-duck'}
			<!-- Rubber Ducky: a yellow rubber duck in a tiny army helmet, rocking on a ripple -->
			<defs>
				<radialGradient id={g('dk')} gradientUnits="userSpaceOnUse" cx="13" cy="11" r="20"><stop offset="0" stop-color="#fff8b8" /><stop offset=".45" stop-color="#ffd83a" /><stop offset="1" stop-color="#e8920a" /></radialGradient>
				<linearGradient id={g('bk')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb24a" /><stop offset="1" stop-color="#e85a0a" /></linearGradient>
				<linearGradient id={g('hm')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8ba5c" /><stop offset=".6" stop-color="#5f7028" /><stop offset="1" stop-color="#3a4614" /></linearGradient>
			</defs>
			<ellipse cx="16" cy="29.7" rx="12.4" ry="1.8" fill="#6fd0ff" opacity=".4" />
			<path class="ap-ripple" d="M4.4 29.5 Q7.6 28.4 10.8 29.5 M21.2 29.5 Q24.4 28.4 27.6 29.5" fill="none" stroke="#d8f6ff" stroke-width=".6" stroke-linecap="round" />
			<g class="ap-rock">
				<g fill={O} stroke={O} stroke-width="2" stroke-linejoin="round"><path d={DUCK_BODY} /><circle cx="19.4" cy="12" r="6.2" /></g>
				<g fill={u('dk')}><path d={DUCK_BODY} /><circle cx="19.4" cy="12" r="6.2" /></g>
				<path d="M5.4 24.8 C7.8 27.6 12 28.2 16 28.2 C21.4 28.2 25.8 27 27.2 24.2" fill="none" stroke="#e0860a" stroke-width="1" opacity=".5" stroke-linecap="round" />
				<ellipse cx="8.6" cy="19.4" rx="2.3" ry="1" transform="rotate(-24 8.6 19.4)" fill="#fff" opacity=".6" />
				<path d="M10.4 21.4 C12.2 19.2 17.4 19.4 19.6 22 C17.6 25 12.6 25.4 10.4 21.4 Z" fill="#ffc82a" stroke="#a86a00" stroke-width=".6" stroke-linejoin="round" />
				<path d="M12.8 22.4 Q15 23.4 17.4 22.6" fill="none" stroke="#c88a10" stroke-width=".45" stroke-linecap="round" />
				<!-- chin strap, beak, eye, blush -->
				<path d="M14.8 10.2 C15.4 14.4 17.6 16.8 21 17.2" fill="none" stroke="#3a4614" stroke-width=".75" stroke-linecap="round" />
				<path d="M24.4 11.4 C26.8 10.4 30 10.8 30.8 12.4 C30 13.8 27.6 14 25 13.8 Z" fill={u('bk')} stroke={O} stroke-width=".8" stroke-linejoin="round" />
				<path d="M25.2 12.8 Q27.8 13.1 30.4 12.5" fill="none" stroke={O} stroke-width=".45" />
				<ellipse cx="22.6" cy="14.7" rx="1.2" ry=".7" fill="#ff7a4a" opacity=".55" />
				<g class="ap-blink">
					<ellipse cx="21.8" cy="11" rx="1.25" ry="1.55" fill="#1a0e05" />
					<circle cx="22.2" cy="10.4" r=".45" fill="#fff" />
				</g>
				<!-- the helmet: olive dome with a net, a brim and a little star -->
				<path d="M13.4 9.4 C13.2 4 16.4 2 19.8 2 C23.2 2 26.4 4 25.8 9.4 Z" fill={u('hm')} stroke={O} stroke-width=".9" stroke-linejoin="round" />
				<path d="M14.2 6.4 Q19.8 4 25.4 6.4 M13.8 8.2 Q19.8 6 25.8 8.2" fill="none" stroke="#2a3410" stroke-width=".4" stroke-dasharray=".7 .5" />
				<path d={star(20.6, 5.6, 1.1)} fill="#f4f0d8" opacity=".9" />
				<path d="M15.6 4.6 Q17.6 3 20 3" fill="none" stroke="#fff" stroke-width=".7" stroke-linecap="round" opacity=".55" />
				<path d="M12.2 9.2 Q19.8 7.4 27.4 9.2 Q27.6 10.6 26.4 10.6 Q19.8 9 13 10.6 Q12 10.6 12.2 9.2 Z" fill="#4a5a1c" stroke={O} stroke-width=".7" stroke-linejoin="round" />
			</g>
		{:else if id === 'a-pet-hamster'}
			<!-- Hamster Ball: a hamster running in a clear ball that rolls -->
			<defs>
				<radialGradient id={g('ball')} cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#e6f8ff" stop-opacity=".06" /><stop offset=".9" stop-color="#8fd2f4" stop-opacity=".3" /><stop offset="1" stop-color="#4a9ad0" stop-opacity=".55" /></radialGradient>
				<radialGradient id={g('fur')} gradientUnits="userSpaceOnUse" cx="18.6" cy="19" r="9"><stop offset="0" stop-color="#ffe2b4" /><stop offset=".55" stop-color="#f2a452" /><stop offset="1" stop-color="#b8622a" /></radialGradient>
			</defs>
			<ellipse class="ap-shadow" cx="16" cy="30.7" rx="8.4" ry="1.1" fill="#000" opacity=".28" />
			<g class="ap-bob">
				<circle cx="16" cy="16.4" r="13" fill={u('ball')} />
				<g class="ap-run-b"><ellipse cx="13.8" cy="27.7" rx="1.35" ry=".8" fill="#f0a49a" stroke="#4a2408" stroke-width=".45" /></g>
				<g class="ap-run-a"><ellipse cx="21.6" cy="27.5" rx="1.3" ry=".8" fill="#f0a49a" stroke="#4a2408" stroke-width=".45" /></g>
				<circle cx="9.6" cy="22.4" r=".8" fill="#f2a452" stroke="#4a2408" stroke-width=".45" />
				<circle cx="19.4" cy="17.9" r="1.4" fill="#f2a452" stroke="#4a2408" stroke-width=".6" /><circle cx="19.4" cy="17.9" r=".7" fill="#ffb0b0" />
				<circle cx="22.6" cy="17.6" r="1.25" fill="#f2a452" stroke="#4a2408" stroke-width=".6" /><circle cx="22.6" cy="17.6" r=".6" fill="#ffb0b0" />
				<g fill="#4a2408" stroke="#4a2408" stroke-width="1.5"><ellipse cx="15.6" cy="23" rx="6.2" ry="4.4" /><ellipse cx="21.4" cy="21" rx="3.8" ry="3.4" /></g>
				<g fill={u('fur')}><ellipse cx="15.6" cy="23" rx="6.2" ry="4.4" /><ellipse cx="21.4" cy="21" rx="3.8" ry="3.4" /></g>
				<ellipse cx="17.4" cy="25.2" rx="3.8" ry="1.8" fill="#fff2dc" />
				<path d="M10.6 20.8 Q13 19.2 15.6 19.4" fill="none" stroke="#fff" stroke-width=".6" stroke-linecap="round" opacity=".55" />
				<ellipse cx="23.8" cy="22" rx="1.8" ry="1.4" fill="#fff4e4" />
				<ellipse cx="22" cy="22.7" rx="1.3" ry=".85" fill="#ff8a7a" opacity=".5" />
				<circle cx="22.6" cy="20.2" r=".85" fill="#1a0e05" /><circle cx="22.9" cy="19.9" r=".3" fill="#fff" />
				<circle cx="25.4" cy="21.4" r=".55" fill="#ff7a8a" stroke="#4a2408" stroke-width=".25" />
				<path d="M24.6 22.4 L26.6 22 M24.6 22.9 L26.6 23.3" stroke="#4a2408" stroke-width=".25" stroke-linecap="round" opacity=".7" />
				<g class="ap-run-a"><ellipse cx="11.6" cy="27.5" rx="1.5" ry=".85" fill="#ffb4a8" stroke="#4a2408" stroke-width=".45" /></g>
				<g class="ap-run-b"><ellipse cx="19.6" cy="27.5" rx="1.45" ry=".85" fill="#ffb4a8" stroke="#4a2408" stroke-width=".45" /></g>
				<!-- the ball's seam and air holes roll round; the shine stays put -->
				<g class="ap-roll">
					<ellipse cx="16" cy="16.4" rx="4.2" ry="12.6" fill="none" stroke="#ffffff" stroke-width=".55" opacity=".5" />
					{#each [0, 60, 120, 180, 240, 300] as a (a)}<rect x="15.1" y="5.1" width="1.8" height=".8" rx=".4" fill="#3a80b8" opacity=".55" transform="rotate({a} 16 16.4)" />{/each}
				</g>
				<path d="M6.4 12.4 A10.6 10.6 0 0 1 12.6 5.6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8" />
				<circle cx="22.2" cy="6.8" r=".9" fill="#fff" opacity=".7" />
				<circle cx="16" cy="16.4" r="11.9" fill="none" stroke="#fff" stroke-width=".45" opacity=".4" />
				<circle cx="16" cy="16.4" r="13" fill="none" stroke={O} stroke-width="1" />
			</g>
		{:else if id === 'a-pet-robo'}
			<!-- Robo Pup: a little chrome robot dog, a red visor eye scanning, an antenna light, a spring tail wagging -->
			<defs>
				<linearGradient id={g('chr')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" /><stop offset=".45" stop-color="#c9d3e0" /><stop offset="1" stop-color="#7d8aa0" /></linearGradient>
				<radialGradient id={g('eye')}><stop offset="0" stop-color="#ff5a5a" stop-opacity=".85" /><stop offset="1" stop-color="#ff1a2a" stop-opacity="0" /></radialGradient>
			</defs>
			<g class="ap-bob">
				<g class="ap-wag">
					<path d="M7.6 17.2 L6.2 16.4 L7.2 15.2 L5.6 14.6 L6.6 13.4 L5 12.8 L5.8 11.6" fill="none" stroke="#56647a" stroke-width=".9" stroke-linejoin="round" stroke-linecap="round" />
					<circle cx="4.9" cy="11" r="1.5" fill="#ff8a1a" stroke={O} stroke-width=".6" />
					<circle cx="4.5" cy="10.5" r=".45" fill="#fff" opacity=".8" />
				</g>
				<rect x="11.2" y="21" width="2.4" height="6.4" rx="1.1" fill="#7a889c" stroke={O} stroke-width=".7" />
				<rect x="19.8" y="21" width="2.4" height="6.4" rx="1.1" fill="#7a889c" stroke={O} stroke-width=".7" />
				<ellipse cx="12.8" cy="27.6" rx="1.7" ry=".9" fill="#3a4456" stroke={O} stroke-width=".55" />
				<ellipse cx="21.4" cy="27.6" rx="1.7" ry=".9" fill="#3a4456" stroke={O} stroke-width=".55" />
				<rect x="6.4" y="14.4" width="16.6" height="8.6" rx="4.3" fill={u('chr')} stroke={O} stroke-width="1" />
				<path d="M9 15.6 Q12.6 14.9 16.4 15.1" fill="none" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".85" />
				<rect x="10" y="17.2" width="6.4" height="3.6" rx="1.2" fill="#1c2433" stroke={O} stroke-width=".5" />
				{#each ROBO_LEDS as [x, c], i (i)}<circle class="ap-chase" cx={x} cy="19" r=".55" fill={c} style="animation-delay:{i * 0.3}s" />{/each}
				<circle cx="8.6" cy="17.2" r=".45" fill="#e6ebf2" stroke={O} stroke-width=".3" /><circle cx="20.8" cy="17.2" r=".45" fill="#e6ebf2" stroke={O} stroke-width=".3" />
				<rect x="8.6" y="21.4" width="2.6" height="6.6" rx="1.2" fill={u('chr')} stroke={O} stroke-width=".8" />
				<rect x="17.4" y="21.4" width="2.6" height="6.6" rx="1.2" fill={u('chr')} stroke={O} stroke-width=".8" />
				<ellipse cx="10.2" cy="28.2" rx="2" ry="1" fill="#4d5a6c" stroke={O} stroke-width=".6" />
				<ellipse cx="19" cy="28.2" rx="2" ry="1" fill="#4d5a6c" stroke={O} stroke-width=".6" />
				<g class="ap-tilt">
					<rect x="19" y="11.6" width="3.6" height="4" fill="#5d6a80" stroke={O} stroke-width=".6" />
					<rect x="18.2" y="13" width="5.2" height="1.6" rx=".8" fill="#2fa8ff" stroke={O} stroke-width=".5" />
					<circle cx="20.8" cy="15.1" r=".75" fill="#ffd23a" stroke={O} stroke-width=".35" />
					<path d="M24 4.8 L24.6 1.8" stroke="#4d5a6c" stroke-width=".8" stroke-linecap="round" />
					<circle class="ap-led" cx="24.7" cy="1.5" r="1.05" fill="#ff3a4a" stroke={O} stroke-width=".4" />
					<path d="M20 6 L16.2 6.4 L15 11.6 L17.6 12 Z" fill="#8a98ac" stroke={O} stroke-width=".8" stroke-linejoin="round" />
					<rect x="17.2" y="4.6" width="11.6" height="9.2" rx="3.6" fill={u('chr')} stroke={O} stroke-width="1" />
					<rect x="25.6" y="9.2" width="5.4" height="4.6" rx="1.8" fill="#e6ecf4" stroke={O} stroke-width=".8" />
					<ellipse cx="30.3" cy="10.3" rx=".95" ry=".75" fill={O} />
					<path d="M26.6 12.6 Q28.4 13.4 30.2 12.4" fill="none" stroke={O} stroke-width=".5" stroke-linecap="round" />
					<rect x="19.6" y="6.6" width="8.4" height="3.4" rx="1.7" fill="#121826" stroke={O} stroke-width=".6" />
					<g class="ap-scan"><circle cx="25.6" cy="8.3" r="2.2" fill={u('eye')} /><circle cx="25.6" cy="8.3" r="1.05" fill="#ff2a3a" /><circle cx="25.9" cy="8" r=".35" fill="#ffd8d8" /></g>
					<path d="M19.4 5.6 Q22 5 25 5.2" fill="none" stroke="#fff" stroke-width=".7" stroke-linecap="round" opacity=".85" />
					<circle cx="18.9" cy="6.9" r=".5" fill="#c8d0dc" stroke={O} stroke-width=".3" />
				</g>
			</g>
		{:else if id === 'a-pet-bat'}
			<!-- Burger Bat: a little purple bat whose flapping wings are sesame buns with a lettuce frill -->
			<defs>
				<radialGradient id={g('bun')} cx=".42" cy=".22" r=".95"><stop offset="0" stop-color="#ffe0a8" /><stop offset=".5" stop-color="#f0a24a" /><stop offset="1" stop-color="#b0581b" /></radialGradient>
				<radialGradient id={g('bb')} gradientUnits="userSpaceOnUse" cx="14" cy="14" r="10"><stop offset="0" stop-color="#a87ae0" /><stop offset=".6" stop-color="#5e2c90" /><stop offset="1" stop-color="#2a0a4a" /></radialGradient>
			</defs>
			<g class="ap-bob">
				{#each [false, true] as flip (flip)}
					<g transform={flip ? 'translate(32 0) scale(-1 1)' : undefined}>
						<g class="ap-flap" style={flip ? 'animation-delay:-.05s' : undefined}>
							<path d={BAT_LETTUCE} fill="none" stroke="#24561a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" />
							<path d={BAT_LETTUCE} fill="none" stroke="#66c93c" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
							<path d="M5.4 17.4 L6.2 19.4 L7 17.6 Z" fill="#ffc928" stroke="#a87a0c" stroke-width=".3" />
							<path d={BAT_WING} fill={u('bun')} stroke={O} stroke-width=".9" stroke-linejoin="round" />
							<path d="M3.2 11.6 Q5.6 9.6 8.6 9.7" fill="none" stroke="#fff6d8" stroke-width=".7" stroke-linecap="round" opacity=".7" />
							<g fill="#fff6dc">
								<ellipse cx="4.6" cy="12.6" rx=".75" ry=".42" transform="rotate(-30 4.6 12.6)" />
								<ellipse cx="7.4" cy="11.6" rx=".75" ry=".42" transform="rotate(-6 7.4 11.6)" />
								<ellipse cx="9.8" cy="13" rx=".75" ry=".42" transform="rotate(22 9.8 13)" />
								<ellipse cx="6.4" cy="14.4" rx=".75" ry=".42" transform="rotate(-14 6.4 14.4)" />
							</g>
						</g>
					</g>
				{/each}
				<!-- ears + round body as one shape -->
				<g fill={O} stroke={O} stroke-width="1.8" stroke-linejoin="round">
					<path d="M11.4 14 L10.8 6.8 L15.2 11.8 Z" /><path d="M20.6 14 L21.2 6.8 L16.8 11.8 Z" /><ellipse cx="16" cy="17.6" rx="5.6" ry="5.8" />
				</g>
				<g fill={u('bb')}><path d="M11.4 14 L10.8 6.8 L15.2 11.8 Z" /><path d="M20.6 14 L21.2 6.8 L16.8 11.8 Z" /><ellipse cx="16" cy="17.6" rx="5.6" ry="5.8" /></g>
				<path d="M11.8 12.4 L11.5 9 L13.8 11.6 Z M20.2 12.4 L20.5 9 L18.2 11.6 Z" fill="#ff8ac0" opacity=".85" />
				<ellipse cx="16" cy="20.6" rx="3.4" ry="2.5" fill="#b896e8" opacity=".75" />
				<path d="M12.2 14.2 Q13.6 12.8 15.2 12.6" fill="none" stroke="#d8c0ff" stroke-width=".6" stroke-linecap="round" opacity=".7" />
				<g class="ap-blink">
					<ellipse cx="13.8" cy="16.2" rx="1.6" ry="1.85" fill="#fff" /><ellipse cx="18.2" cy="16.2" rx="1.6" ry="1.85" fill="#fff" />
					<circle cx="14.1" cy="16.6" r=".95" fill="#1a0630" /><circle cx="18.5" cy="16.6" r=".95" fill="#1a0630" />
					<circle cx="14.4" cy="16.1" r=".35" fill="#fff" /><circle cx="18.8" cy="16.1" r=".35" fill="#fff" />
				</g>
				<ellipse cx="12" cy="18.8" rx="1.1" ry=".6" fill="#ff7ab8" opacity=".6" /><ellipse cx="20" cy="18.8" rx="1.1" ry=".6" fill="#ff7ab8" opacity=".6" />
				<path d="M14.4 19 Q16 20.3 17.6 19" fill="none" stroke={O} stroke-width=".6" stroke-linecap="round" />
				<path d="M14.9 19.35 L15.3 20.5 L15.7 19.55 Z M16.3 19.55 L16.7 20.5 L17.1 19.35 Z" fill="#fff" stroke={O} stroke-width=".25" stroke-linejoin="round" />
				<path d="M14.4 23.2 L14 24.4 M15 23.4 L15 24.6 M17 23.4 L17 24.6 M17.6 23.2 L18 24.4" stroke={O} stroke-width=".55" stroke-linecap="round" />
			</g>
		{:else if id === 'a-pet-fox'}
			<!-- Fire Fox: a sitting orange fox whose tail is a flickering flame throwing embers -->
			<defs>
				<radialGradient id={g('fl')} cx=".62" cy=".95" r="1"><stop offset="0" stop-color="#ffe45a" /><stop offset=".45" stop-color="#ff8a1a" /><stop offset="1" stop-color="#d8240c" /></radialGradient>
				<radialGradient id={g('fx')} gradientUnits="userSpaceOnUse" cx="19" cy="9" r="20"><stop offset="0" stop-color="#ffc070" /><stop offset=".5" stop-color="#f0721e" /><stop offset="1" stop-color="#a83c0c" /></radialGradient>
			</defs>
			<g class="ap-flicker">
				<path
					d="M13.4 25.6 C7.4 26.4 2.8 22.6 3.4 17 C3.8 13.8 5.8 12 5.4 8.4 C8 10 9 12.6 8.8 15 C10 12.6 9.8 9.6 8.4 6.4 C12.2 8.4 13.8 12.8 13 16.6 C14.2 15.8 14.6 14.2 14.4 12.6 C16.4 15 16.6 19.4 15.2 22.6 Z"
					fill={u('fl')}
					stroke="#6a1004"
					stroke-width=".8"
					stroke-linejoin="round"
				/>
			</g>
			<g class="ap-flicker fast">
				<path d="M13 24.2 C8.8 24.6 5.6 21.6 6.2 17.6 C6.6 15.4 7.8 14.4 7.8 12.4 C9.8 14 10.4 16 10.2 17.8 C11.4 16.6 11.6 14.8 11.2 13 C13.4 14.8 14.2 18 13.4 20.6 Z" fill="#ffb02a" />
				<path d="M12.6 22.8 C10 23 8.4 21.2 8.8 18.8 C9.6 19.8 10.6 20 11.2 19.2 C11.8 20.2 12.6 21 12.6 22.8 Z" fill="#fff3a0" />
			</g>
			<circle class="ap-ember" cx="6.4" cy="8.6" r=".55" fill="#ffd84a" />
			<circle class="ap-ember" cx="9.6" cy="6.4" r=".45" fill="#ffe680" style="animation-delay:-.7s" />
			<circle class="ap-ember" cx="4.2" cy="12.6" r=".5" fill="#ffb02a" style="animation-delay:-1.3s" />
			<!-- body, chest fluff, legs -->
			<path d="M10.8 28.8 C9.8 23.2 11.6 17.6 16.4 16.6 C20.8 15.8 23.6 19 23.4 23.6 C23.2 26.6 22.2 28.8 22.2 28.8 Z" fill={u('fx')} stroke="#4a1404" stroke-width=".9" stroke-linejoin="round" />
			<path d="M11.6 26.6 C11.2 23.4 13.4 21.6 15.6 22.4" fill="none" stroke="#a83c0c" stroke-width=".6" stroke-linecap="round" />
			<ellipse cx="13.4" cy="28.7" rx="2.4" ry="1.05" fill="#3a1a0a" />
			<path d="M17.4 18.4 C20.2 18.6 22 21.4 21.4 24.6 C20.6 23.2 19.6 23.8 18.8 22.6 C18.2 23.6 17.4 23 17 21.8 C16.6 20.4 16.6 19.2 17.4 18.4 Z" fill="#fff4e4" />
			{#each [17.6, 20.6] as x (x)}
				<rect {x} y="22" width="2" height="6.9" rx="1" fill="#f0721e" stroke="#4a1404" stroke-width=".55" />
				<rect {x} y="25.6" width="2" height="3.3" rx="1" fill="#3a1a0a" />
			{/each}
			<!-- head: ears + head + muzzle as one shape -->
			<g fill="#4a1404" stroke="#4a1404" stroke-width="1.8" stroke-linejoin="round">
				<path d="M14.4 9.6 L14 3 L18.6 7.2 Z" /><path d="M19.4 7 L22.2 2.2 L23.8 8.6 Z" />
				<ellipse cx="19.4" cy="11.6" rx="5.6" ry="4.8" /><path d="M22 10.6 C25.2 10.8 28.4 11.8 29.6 13.2 C28.2 14.8 24.6 15.4 21.8 14.8 Z" />
				<path d="M14.6 12.2 L12.4 13.2 L14 13.8 L12.6 15 L15.2 15 Z" />
			</g>
			<g fill={u('fx')}>
				<path d="M14.4 9.6 L14 3 L18.6 7.2 Z" />
				<ellipse cx="19.4" cy="11.6" rx="5.6" ry="4.8" /><path d="M22 10.6 C25.2 10.8 28.4 11.8 29.6 13.2 C28.2 14.8 24.6 15.4 21.8 14.8 Z" />
				<path d="M14.6 12.2 L12.4 13.2 L14 13.8 L12.6 15 L15.2 15 Z" />
			</g>
			<path d="M15.1 8.4 L14.9 4.8 L17.3 7.1 Z" fill="#ffe0c0" />
			<g class="ap-twitch">
				<path d="M19.4 7 L22.2 2.2 L23.8 8.6 Z" fill={u('fx')} />
				<path d="M20.4 6.8 L22 3.8 L22.9 7.6 Z" fill="#ffe0c0" />
				<path d="M21.5 3.5 L22.2 2.2 L22.7 4.3 Z" fill="#2a1006" />
			</g>
			<path d="M19.6 13.2 C22.4 15.4 26.4 15.2 29.4 13.6 C27.8 16.4 23 17.2 19.8 15.6 Z" fill="#fff4e4" />
			<path d="M16 8.2 Q18 7 20.2 7.4" fill="none" stroke="#ffd8a0" stroke-width=".6" stroke-linecap="round" opacity=".8" />
			<ellipse cx="29.5" cy="13.1" rx=".95" ry=".75" fill="#1a0e05" /><circle cx="29.3" cy="12.8" r=".25" fill="#fff" opacity=".8" />
			<g class="ap-blink">
				<ellipse cx="23.2" cy="10.6" rx="1.15" ry="1.45" fill="#1a0e05" />
				<circle cx="23.6" cy="10" r=".45" fill="#fff" />
			</g>
			<path d="M22 8.7 Q23.2 8.2 24.4 8.8" fill="none" stroke="#8a2a08" stroke-width=".5" stroke-linecap="round" />
			<ellipse cx="24.8" cy="13.3" rx="1" ry=".55" fill="#ff6a6a" opacity=".55" />
			<path d="M26 14.6 Q27.4 15 28.6 14.4" fill="none" stroke="#6a2a10" stroke-width=".45" stroke-linecap="round" />
		{:else if id === 'a-pet-dragon'}
			<!-- Baby Dragon: a chubby purple dragon, little wings flapping, puffing smoke rings, gold horns -->
			<defs>
				<radialGradient id={g('dr')} gradientUnits="userSpaceOnUse" cx="17" cy="9" r="21"><stop offset="0" stop-color="#d4a4ff" /><stop offset=".5" stop-color="#8a3fd0" /><stop offset="1" stop-color="#46168a" /></radialGradient>
				<radialGradient id={g('sn')} cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#e2c4ff" /><stop offset="1" stop-color="#9a5ae0" /></radialGradient>
				<linearGradient id={g('mem')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc0f0" /><stop offset="1" stop-color="#b070f0" /></linearGradient>
				<linearGradient id={g('hn')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c0" /><stop offset=".6" stop-color="#ffcf2a" /><stop offset="1" stop-color="#b87a00" /></linearGradient>
			</defs>
			{@render twinkle(4, 3.8, 1.6, 0, '#fff6c0')}
			{@render twinkle(28.8, 23.6, 1.3, 1, '#fff6c0')}
			<g class="ap-tailsway">
				<path d="M11 25.6 C6.6 26.6 3.4 24.4 3.6 20.6 C3.8 18.4 5 17.4 5.6 15.8" fill="none" stroke={O} stroke-width="3.6" stroke-linecap="round" />
				<path d="M11 25.6 C6.6 26.6 3.4 24.4 3.6 20.6 C3.8 18.4 5 17.4 5.6 15.8" fill="none" stroke="#8a3fd0" stroke-width="2.3" stroke-linecap="round" />
				<path d="M5.6 16.4 C4 15.6 3.6 13.4 4.6 11.8 C5.6 13 7.4 13.4 8.2 12.8 C8.2 14.8 7.2 16.2 5.6 16.4 Z" fill={u('hn')} stroke={O} stroke-width=".7" stroke-linejoin="round" />
			</g>
			<g transform="translate(4.4 -2.6)"><path class="ap-flap-s" d={DRAGON_WING} fill="#9a5ad0" stroke={O} stroke-width=".7" stroke-linejoin="round" style="animation-delay:-.12s" /></g>
			<path class="ap-flap-s" d={DRAGON_WING} fill={u('mem')} stroke={O} stroke-width=".8" stroke-linejoin="round" />
			<path d="M10 28.8 C8.8 23.4 10.4 17.6 15.6 16.6 C20.2 15.8 23 19 22.8 23.4 C22.6 26.8 21.8 28.8 21.8 28.8 Z" fill={u('dr')} stroke={O} stroke-width=".9" stroke-linejoin="round" />
			<path d="M15.8 18.6 C19 18.8 21 21.6 20.6 25.4 C20.4 27 19.8 28.6 19.8 28.6 H15.8 C15 25 14.8 21.4 15.8 18.6 Z" fill="#ffdcb4" />
			<path d="M15.4 21 H20.2 M15.2 23.4 H20.7 M15.5 25.8 H20.6" stroke="#e0a878" stroke-width=".45" />
			<ellipse cx="12.8" cy="28.6" rx="2.6" ry="1.3" fill="#8a3fd0" stroke={O} stroke-width=".7" />
			<ellipse cx="19.8" cy="28.8" rx="2.4" ry="1.2" fill="#8a3fd0" stroke={O} stroke-width=".7" />
			<g fill="#fff4dc"><circle cx="14.6" cy="28.9" r=".38" /><circle cx="15.2" cy="28.3" r=".34" /><circle cx="21.5" cy="29.1" r=".36" /><circle cx="22" cy="28.5" r=".32" /></g>
			<path d="M16.8 21.2 Q19 22.2 19.8 23.6" fill="none" stroke={O} stroke-width="2.2" stroke-linecap="round" />
			<path d="M16.8 21.2 Q19 22.2 19.8 23.6" fill="none" stroke="#9a52e0" stroke-width="1.2" stroke-linecap="round" />
			<!-- frills, horns, then head + snout as one shape -->
			<g fill="#ff8ad8" stroke={O} stroke-width=".6" stroke-linejoin="round">
				<path d="M14.6 8.4 L11.6 7.4 L13.6 10.4 Z" /><path d="M14 11.4 L11.2 11.4 L13.6 13.6 Z" /><path d="M14.6 14.2 L12.2 15.4 L14.8 16 Z" />
			</g>
			<g fill={u('hn')} stroke={O} stroke-width=".6" stroke-linejoin="round">
				<path d="M16.4 6.2 C15.4 3.8 13.8 3 12.4 3.2 C13.8 4.4 14.4 5.8 14.6 7.2 Z" />
				<path d="M19.8 5.4 C19.6 2.8 18.4 1.6 17 1.4 C18 2.8 18.2 4.2 18 5.8 Z" />
			</g>
			<g fill={O} stroke={O} stroke-width="1.8"><ellipse cx="19.4" cy="10.4" rx="5.8" ry="5.2" /><ellipse cx="25.4" cy="11.8" rx="4.2" ry="3.2" /></g>
			<ellipse cx="19.4" cy="10.4" rx="5.8" ry="5.2" fill={u('dr')} />
			<ellipse cx="25.4" cy="11.8" rx="4.2" ry="3.2" fill={u('sn')} />
			<path d="M15.4 7.6 Q17.2 5.8 19.6 5.6" fill="none" stroke="#f0dcff" stroke-width=".65" stroke-linecap="round" opacity=".8" />
			<ellipse cx="28.4" cy="10.6" rx=".7" ry=".45" transform="rotate(-20 28.4 10.6)" fill="#3a0a6a" />
			<path d="M24.2 13.4 Q26.6 14.8 28.8 13.2" fill="none" stroke={O} stroke-width=".6" stroke-linecap="round" />
			<path d="M26 14.1 L26.4 15.1 L26.8 14.2 Z" fill="#fff" stroke={O} stroke-width=".22" />
			<g class="ap-blink">
				<ellipse cx="21.4" cy="9.4" rx="1.6" ry="2" fill="#1a0630" />
				<ellipse cx="21.4" cy="10.3" rx="1.15" ry=".9" fill="#8a4aff" opacity=".9" />
				<circle cx="21.95" cy="8.6" r=".65" fill="#fff" /><circle cx="21" cy="10.6" r=".3" fill="#fff" />
			</g>
			<ellipse cx="23.4" cy="12.6" rx="1.2" ry=".65" fill="#ff7ac8" opacity=".6" />
			{#each [0, 0.8, 1.6] as d (d)}
				<ellipse class="ap-ring" cx="29.6" cy="8.8" rx="1.4" ry="1" fill="none" stroke="#f2ecff" stroke-width=".85" style="animation-delay:-{d}s" />
			{/each}

			<!-- ======================= plushies ======================= -->
		{:else if id === 'a-plush-teddy'}
			<!-- Teddy Bear: brown felt, button eyes, a satin-stitched nose, a checked patch sewn on the tummy -->
			{@render teddy(false)}
		{:else if id === 'a-plush-gold'}
			<!-- Golden Teddy: a gold teddy with a little jewelled crown, an embroidered heart, a glow and twinkles -->
			{@render teddy(true)}
		{:else if id === 'a-plush-burger'}
			<!-- Burger Plush: a puffy felt burger with stubby arms, felt sesame seeds, lettuce, cheese and a smile -->
			<defs>
				<radialGradient id={g('bun')} gradientUnits="userSpaceOnUse" cx="13" cy="7" r="22"><stop offset="0" stop-color="#ffe0a6" /><stop offset=".45" stop-color="#f0a24a" /><stop offset="1" stop-color="#a8521a" /></radialGradient>
				<linearGradient id={g('pat')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5030" /><stop offset="1" stop-color="#4e2812" /></linearGradient>
				{@render felt()}
			</defs>
			<g class="ap-squish">
				<ellipse cx="4.2" cy="18.6" rx="1.8" ry="2.7" transform="rotate(-34 4.2 18.6)" fill={u('bun')} stroke={B} stroke-width=".8" />
				<ellipse cx="27.8" cy="18.6" rx="1.8" ry="2.7" transform="rotate(34 27.8 18.6)" fill={u('bun')} stroke={B} stroke-width=".8" />
				<path d="M5.6 21.6 H26.4 Q26.8 27.6 21.2 27.8 H10.8 Q5.2 27.6 5.6 21.6 Z" fill={u('bun')} stroke={B} stroke-width=".9" stroke-linejoin="round" />
				<path d="M5.6 21.6 H26.4 Q26.8 27.6 21.2 27.8 H10.8 Q5.2 27.6 5.6 21.6 Z" fill={u('felt')} />
				<path d="M7.2 24.6 Q16 26 24.8 24.6" {...STITCH} stroke="#8a4a14" />
				<rect x="4.8" y="18.6" width="22.4" height="4.2" rx="2.1" fill={u('pat')} stroke={B} stroke-width=".8" />
				<path d="M6.4 20.8 H25.6" {...STITCH} stroke="#b07a52" />
				<path d="M5 18.4 H27 L26.2 19.6 H23.2 L21.8 22 L20.4 19.6 H12.6 L11.2 21.4 L9.8 19.6 H5.6 Z" fill="#ffcf3a" stroke="#a87a0c" stroke-width=".5" stroke-linejoin="round" />
				<path
					d="M4.4 17 H27.6 L27.8 18.2 Q26.6 19.4 25.4 18.3 Q24.2 19.4 23 18.3 Q21.8 19.4 20.6 18.3 Q19.4 19.4 18.2 18.3 Q17 19.4 15.8 18.3 Q14.6 19.4 13.4 18.3 Q12.2 19.4 11 18.3 Q9.8 19.4 8.6 18.3 Q7.4 19.4 6.2 18.3 Q5 19.4 4.2 18.2 Z"
					fill="#6ad23a"
					stroke="#24561a"
					stroke-width=".55"
					stroke-linejoin="round"
				/>
				<path d="M5.6 17.6 H26.4" {...STITCH} stroke="#c8f4a0" stroke-width=".32" />
				<path d="M4.8 17.4 C4.8 9.4 9.6 5.4 16 5.4 C22.4 5.4 27.2 9.4 27.2 17.4 Z" fill={u('bun')} stroke={B} stroke-width=".9" stroke-linejoin="round" />
				<path d="M4.8 17.4 C4.8 9.4 9.6 5.4 16 5.4 C22.4 5.4 27.2 9.4 27.2 17.4 Z" fill={u('felt')} />
				<path d="M6.4 16.2 Q16 15.4 25.6 16.2" {...STITCH} stroke="#8a4a14" />
				<path d="M8 10 Q10.6 6.8 14.6 6.4" fill="none" stroke="#fff4dc" stroke-width=".8" stroke-linecap="round" opacity=".6" />
				{#each [[9.8, 8.6, -30], [16, 7.3, 0], [22.2, 8.6, 30], [7.6, 12.2, -55], [24.4, 12.2, 55]] as [x, y, a] (`${x}-${y}`)}
					<ellipse cx={x} cy={y} rx="1.1" ry=".55" transform="rotate({a} {x} {y})" fill="#fff6dc" stroke="#d8b880" stroke-width=".3" />
				{/each}
				{@render eye(12.6, 11.6, 1.35)}
				{@render eye(19.4, 11.6, 1.35)}
				<circle cx="10.2" cy="13.8" r="1.15" fill="#ff9ab0" /><circle cx="21.8" cy="13.8" r="1.15" fill="#ff9ab0" />
				<circle cx="10.2" cy="13.8" r=".8" {...STITCH} stroke="#e0607e" stroke-width=".25" stroke-dasharray=".4 .35" />
				<circle cx="21.8" cy="13.8" r=".8" {...STITCH} stroke="#e0607e" stroke-width=".25" stroke-dasharray=".4 .35" />
				<path d="M13.6 13.4 Q16 15.6 18.4 13.4" fill="#8a1a2a" stroke="#4a1a08" stroke-width=".6" stroke-linecap="round" stroke-linejoin="round" />
				{@render tag(6.8, 24.6, 34)}
			</g>
		{:else if id === 'a-plush-bunny'}
			<!-- Bunny: a white bunny, one ear up and one floppy, button eyes, a pink bow -->
			<defs>
				<radialGradient id={g('fur')} gradientUnits="userSpaceOnUse" cx="13" cy="9" r="22"><stop offset="0" stop-color="#ffffff" /><stop offset=".55" stop-color="#f0ecf8" /><stop offset="1" stop-color="#bcb4d4" /></radialGradient>
				{@render felt()}
			</defs>
			<g class="ap-squish">
				<path d="M10.4 9.6 C8.8 5.2 9 1 11.4 .8 C13.8 .6 14.4 5 13.6 9.4 Z" fill={u('fur')} stroke={O} stroke-width=".85" stroke-linejoin="round" />
				<path d="M11 8.4 C10.2 5.2 10.4 2.4 11.5 2.2 C12.6 2 12.8 5.2 12.6 8.4 Z" fill="#ffb4cc" />
				<path d="M18.2 8 C19.8 4.8 24.6 4.2 27.4 6.4 C29.4 8 29 11.2 27.4 11.6 C25.8 10.2 23.4 8.8 20.2 9.8 Z" fill={u('fur')} stroke={O} stroke-width=".85" stroke-linejoin="round" />
				<path d="M19.8 8.2 C21.6 6.2 24.8 6 26.6 7.4 C27.8 8.4 27.6 10 26.8 10.2 C25 9 22.6 8.2 19.8 8.2 Z" fill="#ffb4cc" />
				<ellipse cx="9.8" cy="19.6" rx="2.2" ry="3" transform="rotate(22 9.8 19.6)" fill={u('fur')} stroke={O} stroke-width=".85" />
				<ellipse cx="22.2" cy="19.6" rx="2.2" ry="3" transform="rotate(-22 22.2 19.6)" fill={u('fur')} stroke={O} stroke-width=".85" />
				<ellipse cx="11.4" cy="27.4" rx="3.3" ry="2.1" fill={u('fur')} stroke={O} stroke-width=".85" />
				<ellipse cx="20.6" cy="27.4" rx="3.3" ry="2.1" fill={u('fur')} stroke={O} stroke-width=".85" />
				<ellipse cx="11" cy="27.8" rx="1.4" ry=".9" fill="#ffc0d4" /><ellipse cx="21" cy="27.8" rx="1.4" ry=".9" fill="#ffc0d4" />
				<g fill="#ffc0d4"><circle cx="9.6" cy="26.5" r=".45" /><circle cx="11" cy="26.2" r=".45" /><circle cx="12.4" cy="26.5" r=".45" /><circle cx="19.6" cy="26.5" r=".45" /><circle cx="21" cy="26.2" r=".45" /><circle cx="22.4" cy="26.5" r=".45" /></g>
				<ellipse cx="16" cy="21.6" rx="6.2" ry="5.9" fill={u('fur')} stroke={O} stroke-width=".85" />
				<ellipse cx="16" cy="21.6" rx="6.2" ry="5.9" fill={u('felt')} />
				<ellipse cx="16" cy="22.8" rx="3.4" ry="3.4" fill="#fff8fb" />
				<ellipse cx="16" cy="22.8" rx="2.9" ry="2.9" {...STITCH} stroke="#d0b8d8" stroke-width=".32" />
				<ellipse cx="16" cy="12.6" rx="6.8" ry="5.9" fill={u('fur')} stroke={O} stroke-width=".85" />
				<ellipse cx="16" cy="12.6" rx="6.8" ry="5.9" fill={u('felt')} />
				<path d="M16 6.9 V9.4" {...STITCH} stroke="#b8acd0" />
				<path d="M11 9.6 Q12.4 7.8 14.6 7.4" fill="none" stroke="#fff" stroke-width=".7" stroke-linecap="round" />
				{@render eye(13.2, 12.2, 1.2)}
				{@render eye(18.8, 12.2, 1.2)}
				<ellipse cx="12" cy="14.7" rx="1.15" ry=".7" fill="#ffb0cc" /><ellipse cx="20" cy="14.7" rx="1.15" ry=".7" fill="#ffb0cc" />
				<path d="M15.1 14.2 Q16 13.8 16.9 14.2 Q16.5 15 16 15.1 Q15.5 15 15.1 14.2 Z" fill="#ff7aa8" stroke="#a83a6a" stroke-width=".25" />
				<path d="M16 15.1 V15.7 M15 15.8 Q16 16.6 17 15.8" fill="none" stroke="#8a3a5a" stroke-width=".45" stroke-linecap="round" />
				<path d="M11.6 14.6 L9.2 14.2 M11.6 15.4 L9.2 15.9 M20.4 14.6 L22.8 14.2 M20.4 15.4 L22.8 15.9" {...STITCH} stroke="#9a8ab0" stroke-width=".3" stroke-dasharray=".5 .4" />
				<!-- a pink bow at the neck -->
				<g fill="#ff6aa8" stroke={O} stroke-width=".4" stroke-linejoin="round">
					<path d="M16 18.2 L14.6 20.4 L15.4 20.6 Z" /><path d="M16 18.2 L17.4 20.4 L16.6 20.6 Z" />
					<path d="M16 18 C14.6 16.8 12.8 17 13 18.2 C13.2 19.4 14.8 19.2 16 18 Z" /><path d="M16 18 C17.4 16.8 19.2 17 19 18.2 C18.8 19.4 17.2 19.2 16 18 Z" />
				</g>
				<circle cx="16" cy="18" r=".75" fill="#ff8ac0" stroke={O} stroke-width=".35" />
				{@render tag(22, 24.4, -28)}
			</g>
		{:else if id === 'a-plush-dino'}
			<!-- Dino: a green T-rex plush, orange felt spikes, felt teeth, a stitched belly, stubby arms -->
			<defs>
				<radialGradient id={g('dn')} gradientUnits="userSpaceOnUse" cx="20" cy="6" r="25"><stop offset="0" stop-color="#b4f47a" /><stop offset=".5" stop-color="#5cc23e" /><stop offset="1" stop-color="#2a7a1e" /></radialGradient>
				<linearGradient id={g('sp')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc24a" /><stop offset="1" stop-color="#ff7a1a" /></linearGradient>
				{@render felt()}
			</defs>
			<g class="ap-squish">
				{#each DINO_SPIKES as [x, y, a] (`${x}-${y}`)}
					<g transform="translate({x} {y}) rotate({a})">
						<path d="M-1.7 .8 Q0 -3.2 1.7 .8 Z" fill={u('sp')} stroke={O} stroke-width=".6" stroke-linejoin="round" />
						<path d="M0 -1.6 V.4" {...STITCH} stroke="#b8500a" stroke-width=".25" stroke-dasharray=".4 .35" />
					</g>
				{/each}
				<g fill={O} stroke={O} stroke-width="1.8" stroke-linejoin="round"><path d={DINO_BODY} /><path d={DINO_HEAD} /></g>
				<g fill={u('dn')}><path d={DINO_BODY} /><path d={DINO_HEAD} /></g>
				<g fill={u('felt')}><path d={DINO_BODY} /><path d={DINO_HEAD} /></g>
				<path d="M18 14.6 C20.8 15.6 22.2 18.2 22.2 21.2 C22.2 24.8 20.6 27.8 17.8 28.4 C16.8 24.2 16.8 18.6 18 14.6 Z" fill="#e2f6a0" />
				<path d="M17.3 18.4 Q19.8 18.8 22 18.2 M17.1 21.6 Q19.8 22 22.2 21.4 M17.3 24.8 Q19.6 25.2 21.6 24.6" {...STITCH} stroke="#8aa83a" />
				<path d="M17.8 4.6 Q20.2 3.2 23.4 3.4" fill="none" stroke="#e8ffc8" stroke-width=".7" stroke-linecap="round" opacity=".75" />
				<!-- smile with felt teeth, button eye, nostril, blush -->
				<path d="M20.4 10.8 C23.6 11.8 27.2 11.6 30.2 10.2" fill="none" stroke={O} stroke-width=".6" stroke-linecap="round" />
				{#each DINO_TEETH as [x, y] (x)}<path d="M{x - 0.6} {y} L{x} {y + 1.15} L{x + 0.6} {y - 0.05} Z" fill="#fff" stroke={O} stroke-width=".28" stroke-linejoin="round" />{/each}
				{@render eye(21.8, 6.6, 1.35)}
				<ellipse cx="29.6" cy="6.4" rx=".55" ry=".4" fill="#1f4a14" />
				<ellipse cx="25.8" cy="8.8" rx="1.2" ry=".7" fill="#ff9aa0" opacity=".75" />
				<!-- stubby arm, feet with felt claws -->
				<path d="M21.6 16.8 C23.6 16.6 24.8 17.6 24.6 18.8 C23.6 18.6 22.6 18.8 21.8 19.2 Z" fill={u('dn')} stroke={O} stroke-width=".6" stroke-linejoin="round" />
				<ellipse cx="12.2" cy="28.4" rx="3.4" ry="1.6" fill="#3e9a2a" stroke={O} stroke-width=".7" />
				<ellipse cx="19" cy="28.6" rx="3" ry="1.5" fill="#3e9a2a" stroke={O} stroke-width=".7" />
				<g fill="#fff"><path d="M14.4 28 L15.8 28.4 L14.4 28.9 Z" /><path d="M14.6 28.9 L15.7 29.3 L14.4 29.6 Z" /><path d="M20.8 28.2 L22.1 28.6 L20.8 29.1 Z" /></g>
				{@render tag(7, 26.2, 36)}
			</g>
		{:else if id === 'a-plush-shark'}
			<!-- Shark: a blue shark plush with a white belly, felt teeth in a big smile, a wiggling tail -->
			<defs>
				<linearGradient id={g('sk')} gradientUnits="userSpaceOnUse" x1="0" y1="5" x2="0" y2="26"><stop offset="0" stop-color="#9ad6ff" /><stop offset=".45" stop-color="#3a8ee8" /><stop offset="1" stop-color="#1a4aa0" /></linearGradient>
				{@render felt()}
			</defs>
			<g class="ap-squish">
				<g class="ap-fin">
					<path d="M7.6 17 C5.6 14.4 3.4 11.6 1.2 10.6 C1.6 13.6 2.4 16.2 3.4 18 C2.2 20 1.6 22.6 1.6 25 C3.6 23.6 5.8 21.4 7.8 19.6 Z" fill={u('sk')} stroke={O} stroke-width=".85" stroke-linejoin="round" />
					<path d="M3.4 13.4 Q4.6 15.6 4.4 18 Q3.8 20.4 2.8 22.4" {...STITCH} stroke="#c8e8ff" stroke-width=".3" />
				</g>
				<path d="M13.6 12.6 C14.6 8.4 16.4 5.4 18.8 4.2 C19 7.4 19.2 10.4 20.4 12.8 Z" fill={u('sk')} stroke={O} stroke-width=".85" stroke-linejoin="round" />
				<path d="M6.2 18.4 C8.6 13.8 13.4 11.8 18.8 11.8 C24.6 11.8 29.6 14.4 30.6 18 C30.4 21.6 26 24.6 18.8 24.6 C12.8 24.6 8.4 22.4 6.2 18.4 Z" fill={u('sk')} stroke={O} stroke-width=".9" stroke-linejoin="round" />
				<path d="M7.8 19.4 C13 20 22 19.6 30.4 17.8 C30 21.6 25.6 24.6 18.8 24.6 C13 24.6 9.4 22.6 7.8 19.4 Z" fill="#fbfdff" />
				<path d="M6.2 18.4 C8.6 13.8 13.4 11.8 18.8 11.8 C24.6 11.8 29.6 14.4 30.6 18 C30.4 21.6 26 24.6 18.8 24.6 C12.8 24.6 8.4 22.4 6.2 18.4 Z" fill={u('felt')} />
				<path d="M8.6 19.5 C13 20 22 19.6 29.6 18" {...STITCH} stroke="#7ab8e8" />
				<path d="M11 15.2 Q15 12.8 20 12.8" fill="none" stroke="#e0f4ff" stroke-width=".7" stroke-linecap="round" opacity=".7" />
				<path d="M19.6 15.6 Q19 17 19.6 18.4 M20.9 15.4 Q20.3 16.9 20.9 18.4 M22.2 15.4 Q21.6 16.9 22.2 18.3" {...STITCH} stroke="#123a80" stroke-width=".32" stroke-dasharray=".5 .4" />
				<path d="M15.6 21.8 C15 24.6 13.2 27 11 27.8 C11.8 25.6 12.6 23.4 13 21.6 Z" fill="#2f78d0" stroke={O} stroke-width=".75" stroke-linejoin="round" />
				<path d="M23.8 20.3 Q26.8 21.7 29.4 19.6" fill="#7a1a2a" stroke={O} stroke-width=".65" stroke-linecap="round" stroke-linejoin="round" />
				<path d="M24.5 20.6 L25 21.6 L25.6 20.9 L26.2 21.8 L26.8 21 L27.4 21.6 L28 20.7 L28.6 21.1 L29 20" fill="#fff" stroke={O} stroke-width=".25" stroke-linejoin="round" />
				{@render eye(24.6, 16.4, 1.25)}
				<ellipse cx="27.2" cy="18.8" rx="1" ry=".55" fill="#ff9ab4" opacity=".7" />
				{@render tag(8.6, 21.6, 28)}
			</g>
		{:else if id === 'a-plush-octo'}
			<!-- Octopus: a pink plush octopus, curly arms swaying, felt spots and suckers, button eyes -->
			<defs>
				<radialGradient id={g('oc')} gradientUnits="userSpaceOnUse" cx="13" cy="8" r="20"><stop offset="0" stop-color="#ffd4ec" /><stop offset=".5" stop-color="#ff7ab8" /><stop offset="1" stop-color="#c0306e" /></radialGradient>
				{@render felt()}
			</defs>
			<g class="ap-squish">
				{#each OCTO_ARMS as [arms, cls] (cls)}
					<g class={cls || undefined}>
						{#each arms as d (d)}<path {d} fill="none" stroke={O} stroke-width="3.5" stroke-linecap="round" />{/each}
						{#each arms as d (d)}<path {d} fill="none" stroke="#ff7ab8" stroke-width="2.3" stroke-linecap="round" />{/each}
						{#each arms as d (d)}<path {d} fill="none" stroke="#ffd0e6" stroke-width=".7" stroke-linecap="round" stroke-dasharray=".2 1.2" />{/each}
					</g>
				{/each}
				<path d="M5.6 18.6 C5.6 9.6 10 4.4 16 4.4 C22 4.4 26.4 9.6 26.4 18.6 C26.4 22.2 22 23.6 16 23.6 C10 23.6 5.6 22.2 5.6 18.6 Z" fill={u('oc')} stroke={O} stroke-width=".9" stroke-linejoin="round" />
				<path d="M5.6 18.6 C5.6 9.6 10 4.4 16 4.4 C22 4.4 26.4 9.6 26.4 18.6 C26.4 22.2 22 23.6 16 23.6 C10 23.6 5.6 22.2 5.6 18.6 Z" fill={u('felt')} />
				<path d="M16 4.7 V10.4 M11.6 5.8 Q9.6 9 9.2 12.2 M20.4 5.8 Q22.4 9 22.8 12.2" {...STITCH} stroke="#c0306e" />
				<path d="M8.6 11 Q9.6 7.4 13 6" fill="none" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".6" />
				{#each [[12.6, 8.4, 1.15], [19.8, 7.6, 0.85], [22.6, 10.8, 0.7], [9.2, 14.2, 0.6]] as [x, y, r] (x)}
					<circle cx={x} cy={y} r={r} fill="#e04a8e" />
					<circle cx={x} cy={y} r={r * 0.7} {...STITCH} stroke="#ffb8d8" stroke-width=".22" stroke-dasharray=".35 .3" />
				{/each}
				{@render eye(12.8, 15, 1.4)}
				{@render eye(19.2, 15, 1.4)}
				<ellipse cx="10.2" cy="17.8" rx="1.3" ry=".75" fill="#ffb8d8" /><ellipse cx="21.8" cy="17.8" rx="1.3" ry=".75" fill="#ffb8d8" />
				<path d="M14 18 Q16 19.8 18 18" fill="none" stroke="#6a0a3a" stroke-width=".55" stroke-linecap="round" />
				{@render tag(26, 17.6, -62)}
			</g>
		{:else if id === 'a-plush-uni'}
			<!-- Unicorn: a pastel plush unicorn, a rainbow yarn mane, a gold stitched horn, sleepy happy eyes -->
			<defs>
				<radialGradient id={g('un')} gradientUnits="userSpaceOnUse" cx="13" cy="9" r="22"><stop offset="0" stop-color="#ffffff" /><stop offset=".55" stop-color="#f6eeff" /><stop offset="1" stop-color="#ccbcec" /></radialGradient>
				<linearGradient id={g('hn')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe680" /><stop offset=".5" stop-color="#fff8d0" /><stop offset="1" stop-color="#e0a420" /></linearGradient>
				{@render felt()}
			</defs>
			{@render twinkle(26.8, 3.4, 1.6, 0, '#ffe6f6')}
			{@render twinkle(3.2, 20.6, 1.2, 0.9, '#e6f0ff')}
			{@render twinkle(28.4, 21, 1, 1.6, '#fffbe0')}
			<g class="ap-squish">
				{#each UNI_TAIL as [x, y, c] (`${x}-${y}`)}
					<circle cx={x} cy={y} r="1.8" fill={c} stroke={O} stroke-width=".55" />
				{/each}
				{#each UNI_MANE as [x, y, c] (`${x}-${y}`)}
					<circle cx={x} cy={y} r="2.1" fill={c} stroke={O} stroke-width=".55" />
					<path d="M{x - 0.9} {y + 0.2} Q{x} {y - 1} {x + 0.8} {y + 0.1}" fill="none" stroke="#fff" stroke-width=".45" stroke-linecap="round" opacity=".6" />
				{/each}
				<path d="M11.2 8.4 L10.4 3.8 L14 6.6 Z M20.8 8.4 L21.6 3.8 L18 6.6 Z" fill={u('un')} stroke={O} stroke-width=".8" stroke-linejoin="round" />
				<path d="M11.4 7.2 L11 5.2 L12.8 6.6 Z M20.6 7.2 L21 5.2 L19.2 6.6 Z" fill="#ffb4d8" />
				<ellipse cx="16" cy="21.4" rx="6.2" ry="5.8" fill={u('un')} stroke={O} stroke-width=".85" />
				<ellipse cx="16" cy="21.4" rx="6.2" ry="5.8" fill={u('felt')} />
				<path d="M11.4 18.6 Q16 21 20.6 18.6" {...STITCH} stroke="#c0a8e0" />
				{#each [11, 17.6] as x (x)}
					<rect {x} y="23" width="3.4" height="5.6" rx="1.7" fill={u('un')} stroke={O} stroke-width=".75" />
					<rect {x} y="26.8" width="3.4" height="1.9" rx=".9" fill="#c8b0ff" stroke={O} stroke-width=".6" />
				{/each}
				<ellipse cx="16" cy="12.6" rx="6.6" ry="5.8" fill={u('un')} stroke={O} stroke-width=".85" />
				<ellipse cx="16" cy="12.6" rx="6.6" ry="5.8" fill={u('felt')} />
				<path d="M11 9.6 Q12.4 7.6 14.4 7.2" fill="none" stroke="#fff" stroke-width=".7" stroke-linecap="round" />
				<ellipse cx="16" cy="15.6" rx="3.8" ry="2.5" fill="#ffe8f4" stroke={O} stroke-width=".45" />
				<ellipse cx="14.7" cy="15.5" rx=".45" ry=".35" fill="#e8789e" /><ellipse cx="17.3" cy="15.5" rx=".45" ry=".35" fill="#e8789e" />
				<path d="M15 16.6 Q16 17.4 17 16.6" fill="none" stroke="#8a3a5a" stroke-width=".45" stroke-linecap="round" />
				<path
					d="M11.4 11.6 Q12.8 13 14.2 11.6 M17.8 11.6 Q19.2 13 20.6 11.6 M11.6 12 L10.8 12.6 M12.2 12.5 L11.8 13.3 M20.4 12 L21.2 12.6 M19.8 12.5 L20.2 13.3"
					fill="none"
					stroke={O}
					stroke-width=".55"
					stroke-linecap="round"
				/>
				<ellipse cx="11.4" cy="14.2" rx="1.2" ry=".7" fill="#ffb0cc" /><ellipse cx="20.6" cy="14.2" rx="1.2" ry=".7" fill="#ffb0cc" />
				<circle cx="14.6" cy="7.4" r="1.3" fill="#ff8ac8" stroke={O} stroke-width=".45" />
				<circle cx="17.4" cy="7.3" r="1.3" fill="#ffe27a" stroke={O} stroke-width=".45" />
				<path d="M14.5 7.4 L16 .4 L17.5 7.4 Z" fill={u('hn')} stroke="#7a5200" stroke-width=".55" stroke-linejoin="round" />
				<path d="M14.8 6 Q16 6.6 17.2 5.4 M15.2 3.9 Q16 4.4 16.9 3.4 M15.6 2 Q16 2.3 16.5 1.8" fill="none" stroke="#b8860b" stroke-width=".4" stroke-linecap="round" />
				{@render tag(21.6, 24.6, -30)}
			</g>

			<!-- ======================= mounts (96 × 64, facing right) ======================= -->
		{:else if id === 'a-mount-cart'}
			<!-- Shopping Cart: a chrome wire cart with a red grip and bumper, castors spinning, speed lines -->
			<defs>
				<linearGradient id={g('chr')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" /><stop offset=".5" stop-color="#b8c4d4" /><stop offset="1" stop-color="#6f7d92" /></linearGradient>
				<linearGradient id={g('red')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a7a" /><stop offset=".5" stop-color="#e2261f" /><stop offset="1" stop-color="#8a0a0a" /></linearGradient>
			</defs>
			{#each [30, 37, 44] as y, i (y)}
				<path class="ap-speed" d="M1 {y} H7" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".7" style="animation-delay:-{i * 0.3}s" />
			{/each}
			<g class="ap-jitter">
				<path d="M13 26 L6.4 15.6" stroke={O} stroke-width="4" stroke-linecap="round" />
				<path d="M13 26 L6.4 15.6" stroke={u('chr')} stroke-width="2.2" stroke-linecap="round" />
				<rect x="1.4" y="10.4" width="9" height="6" rx="3" fill={u('red')} stroke={O} stroke-width="1.4" />
				<path d="M3.6 12 H8.2" stroke="#ffc0b8" stroke-width=".9" stroke-linecap="round" opacity=".85" />
				<path d="M11 25 L91 22 L82 47 L16 47 Z" fill="#9fb4cc" fill-opacity=".2" />
				<path d={CART_WIRES} fill="none" stroke="#4d5a6e" stroke-width="1.5" />
				<path d={CART_WIRES} fill="none" stroke="#dbe3ee" stroke-width=".8" />
				<path d="M11 25 L91 22 L82 47 L16 47 Z" fill="none" stroke={O} stroke-width="3.4" stroke-linejoin="round" />
				<path d="M11 25 L91 22 L82 47 L16 47 Z" fill="none" stroke={u('chr')} stroke-width="1.8" stroke-linejoin="round" />
				<path d="M9.6 25 L92.4 21.8" stroke={O} stroke-width="4.4" stroke-linecap="round" />
				<path d="M9.6 25 L92.4 21.8" stroke="#e2261f" stroke-width="2.6" stroke-linecap="round" />
				<path d="M12 24.3 L88 21.4" stroke="#ffa094" stroke-width=".8" stroke-linecap="round" />
				<path d="M17 47 L21 55 M81 47 L76 55 M20 55 H77" fill="none" stroke={O} stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" />
				<path d="M17 47 L21 55 M81 47 L76 55 M20 55 H77" fill="none" stroke={u('chr')} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
				<path d="M24 51.4 H78 M30 47.4 V51.4 M40 47.4 V51.4 M50 47.4 V51.4 M60 47.4 V51.4 M70 47.4 V51.4" fill="none" stroke="#8a98ac" stroke-width=".9" />
				{#each [22, 75] as cx (cx)}
					<rect x={cx - 2.4} y="54.2" width="4.8" height="3" rx=".9" fill="#3a414c" stroke={O} stroke-width="1" />
					<g class="ap-spin">
						<circle {cx} cy="58.8" r="4.8" fill="#2a2f38" stroke={O} stroke-width="1.4" />
						<path d="M{cx - 3.6} 58.8 H{cx + 3.6} M{cx - 1.8} 55.7 L{cx + 1.8} 61.9 M{cx + 1.8} 55.7 L{cx - 1.8} 61.9" stroke="#6a7484" stroke-width=".9" />
						<circle {cx} cy="58.8" r="1.5" fill="#d8dfe8" stroke={O} stroke-width=".7" />
					</g>
					<path d="M{cx - 3.4} 57 A4 4 0 0 1 {cx - 0.6} 55" fill="none" stroke="#fff" stroke-width=".7" stroke-linecap="round" opacity=".4" />
				{/each}
			</g>
		{:else if id === 'a-mount-board'}
			<!-- Hoverboard: a magenta deck with a neon stripe, two hover pads glowing cyan, floating up and down -->
			<defs>
				<radialGradient id={g('glow')}><stop offset="0" stop-color="#7af6ff" stop-opacity=".75" /><stop offset="1" stop-color="#2ad8ff" stop-opacity="0" /></radialGradient>
				<radialGradient id={g('pad')}><stop offset="0" stop-color="#e8ffff" /><stop offset=".4" stop-color="#7af6ff" stop-opacity=".9" /><stop offset="1" stop-color="#2ad8ff" stop-opacity="0" /></radialGradient>
				<linearGradient id={g('deck')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8ae4" /><stop offset=".5" stop-color="#b83ad8" /><stop offset="1" stop-color="#5a1a9a" /></linearGradient>
			</defs>
			<ellipse class="ap-glow" cx="48" cy="61" rx="38" ry="3" fill={u('glow')} />
			{#each [[2.6, 44.6, 0], [1.2, 49.6, 0.4], [3.4, 52.4, 0.8]] as [x, y, d] (d)}
				<circle class="ap-speed" cx={x} cy={y} r=".9" fill="#9cfcff" style="animation-delay:-{d}s" />
			{/each}
			<g class="ap-board">
				<!-- hover pads: glow, ripples and the pads themselves -->
				{#each [27, 69] as cx, i (cx)}
					<ellipse class="ap-glow" {cx} cy="58.6" rx="11" ry="3.6" fill={u('pad')} style="animation-delay:-{i * 0.6}s" />
					<ellipse class="ap-ripple-ring" {cx} cy="60.2" rx="6.4" ry="1.4" fill="none" stroke="#b4feff" stroke-width=".8" style="animation-delay:-{i * 0.5}s" />
					<rect x={cx - 9.4} y="52.4" width="18.8" height="4.4" rx="2.2" fill="#2a3344" stroke={O} stroke-width="1.2" />
					<rect x={cx - 7.4} y="54.3" width="14.8" height="1.4" rx=".7" fill="#c8ffff" />
				{/each}
				<!-- a cyan jet out of the tail -->
				<g class="ap-flame">
					<path d="M5.6 44.6 C3.4 44.2 1.4 45.6 .2 47.4 C1.4 49.2 3.4 50.6 5.6 50.2 Z" fill={u('pad')} stroke="#1aa0c8" stroke-width=".6" stroke-linejoin="round" />
					<path d="M5.4 46.2 C4 46 2.8 46.6 2 47.4 C2.8 48.2 4 48.8 5.4 48.6 Z" fill="#ffffff" />
				</g>
				<rect x="3.6" y="44.6" width="3.6" height="5.6" rx="1" fill="#4a5466" stroke={O} stroke-width="1" />
				<!-- the deck: thick, kicked up at both ends -->
				<path
					d="M5 46.6 C5 43.8 7 42.8 9.8 43 L83 44 C87.4 44 90.6 42.4 92.8 39.8 C95 41.8 95.4 46.2 93 49.4 C91 52 88 53.6 84 53.6 L10.4 53.6 C7.2 53.6 5 50.8 5 46.6 Z"
					fill={u('deck')}
					stroke={O}
					stroke-width="1.6"
					stroke-linejoin="round"
				/>
				<path d="M6.6 45.4 C7 44.2 8.2 44 9.8 44 L83 45 C87.6 45 90.8 43.6 92.8 41.4" fill="none" stroke="#2a0e4a" stroke-width="2" stroke-linecap="round" />
				<path d="M8 49 L84 49.4 C88 49.4 91 48.2 93.2 46" fill="none" stroke="#6af4ff" stroke-width="1.6" stroke-linecap="round" />
				<path d="M9 52.2 L84 52.4 C87.6 52.4 90.4 51.4 92.4 49.8" fill="none" stroke="#ffb8f4" stroke-width=".8" stroke-linecap="round" opacity=".7" />
				<path d="M10.6 46.4 l2 1.2 l-2 1.2 M13.8 46.4 l2 1.2 l-2 1.2 M17 46.4 l2 1.2 l-2 1.2" fill="none" stroke="#ffe14a" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round" />
				<path d="M82.2 45.6 L80.2 48.4 H82 L80.8 51 L84.2 47.4 H82.4 L83.4 45.6 Z" fill="#ffe14a" stroke={O} stroke-width=".5" stroke-linejoin="round" />
			</g>
		{:else if id === 'a-mount-pony'}
			<!-- Rocking Horse: a painted wooden horse on curved rockers, a red yarn mane and tail, rocking -->
			<defs>
				<linearGradient id={g('wd')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4bc76" /><stop offset=".55" stop-color="#c8782e" /><stop offset="1" stop-color="#8a4a1a" /></linearGradient>
				<linearGradient id={g('wd2')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c88040" /><stop offset="1" stop-color="#7a3e14" /></linearGradient>
				<radialGradient id={g('yarn')} cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#ff8a6a" /><stop offset=".55" stop-color="#d82a12" /><stop offset="1" stop-color="#8a1006" /></radialGradient>
			</defs>
			<g class="ap-rockhorse">
				<path d="M33 41 L26 56 M60 41 L68 56" fill="none" stroke={B} stroke-width="5.6" stroke-linecap="round" />
				<path d="M33 41 L26 56 M60 41 L68 56" fill="none" stroke="#9a5420" stroke-width="3.8" stroke-linecap="round" />
				<path d="M27 32.4 C19 31.6 13 35.8 11 43.6 C10.4 46.4 11.4 49.2 13 49.6 C13.6 45.6 15.6 42.2 18.4 40.6 C17.6 43.6 18 46 19.4 47.2 C20.4 43.2 23.4 39.6 27.2 38 Z" fill={u('yarn')} stroke={B} stroke-width="1.2" stroke-linejoin="round" />
				<path d="M24 34.6 C18 35.6 14.6 40 13.4 46 M25.4 36.6 C21 38 19 41.6 18.6 45" fill="none" stroke="#ffb09a" stroke-width=".6" stroke-linecap="round" opacity=".8" />
				<path d="M1.6 52.4 Q48 67 94.4 52.4 L94.8 56.2 Q48 71 1.2 56.2 Z" fill={u('wd2')} stroke={B} stroke-width="1.5" stroke-linejoin="round" />
				<path d="M8 56.4 Q48 68.4 88 56.4" fill="none" stroke="#5a2a0a" stroke-width=".6" opacity=".6" />
				<path d="M6 53.8 Q48 66.4 90 53.8" fill="none" stroke="#f0b070" stroke-width=".6" opacity=".55" />
				{#each [2.8, 93.2] as x (x)}
					<circle cx={x} cy="54.3" r="2.6" fill={u('wd')} stroke={B} stroke-width="1.2" />
					<path d="M{x} 54.3 m-1.1 0 a1.1 1.1 0 1 1 1.1 1.1" fill="none" stroke={B} stroke-width=".6" />
				{/each}
				<path d="M30 41 L21 56.4 M63 41 L74 56.4" fill="none" stroke={B} stroke-width="6" stroke-linecap="round" />
				<path d="M30 41 L21 56.4 M63 41 L74 56.4" fill="none" stroke={u('wd')} stroke-width="4.2" stroke-linecap="round" />
				<ellipse cx="46" cy="37" rx="21" ry="8.4" fill={u('wd')} stroke={B} stroke-width="1.6" />
				<path d="M27.2 33.8 C30 31.8 33 33.8 31.6 36.2 C30.6 37.8 28.4 37.4 28.6 35.8" fill="none" stroke="#ffd23a" stroke-width=".9" stroke-linecap="round" />
				<g fill="#ffd23a"><circle cx="33.4" cy="39.4" r=".8" /><circle cx="29.4" cy="40" r=".6" /></g>
				<path d="M35 30.4 Q46 26.6 57 30.4 L56.6 34.4 Q46 31.4 35.4 34.4 Z" fill="#d8232e" stroke={B} stroke-width="1" stroke-linejoin="round" />
				<path d="M35.6 33.2 Q46 30.2 56.4 33.2" fill="none" stroke="#ffd23a" stroke-width=".7" />
				<path d="M46 32 V42" stroke="#6a3a14" stroke-width="1" />
				<path d="M44.2 42 H47.8 L47 44.6 H45 Z" fill="none" stroke="#ffd23a" stroke-width="1" stroke-linejoin="round" />
				<path d="M57 34 C60 27 64 21 69 16 L80.4 19.4 C77.6 24 74.4 30 69.4 40 Z" fill={u('wd')} stroke={B} stroke-width="1.6" stroke-linejoin="round" />
				<g fill="#ffd23a"><circle cx="66" cy="30" r=".85" /><circle cx="63.8" cy="34" r=".7" /><circle cx="68.6" cy="26" r=".7" /></g>
				<path d="M70 8.6 C66 13 63.4 20 59.2 30 C58.4 32 59.6 33.8 61.4 33 C62 29.4 63.6 26 65.6 23.4 C65.4 26 66.2 27.6 67.4 27.8 C67.8 23.6 69.6 18.6 72.6 14.6 C72.8 17 73.8 18.2 75 18 C74.6 14.6 74.4 11.6 75.4 9.4 Z" fill={u('yarn')} stroke={B} stroke-width="1.1" stroke-linejoin="round" />
				<path d="M69.6 11.6 C67 16 65.2 21 62.4 27.6 M72.6 11 C71 14 69.6 18 68.6 22.4" fill="none" stroke="#ffb09a" stroke-width=".6" stroke-linecap="round" opacity=".8" />
				<path d="M73.4 10.6 L74 3.6 L78.6 8.8 Z" fill={u('wd')} stroke={B} stroke-width="1.2" stroke-linejoin="round" />
				<path d="M74.6 8.6 L74.9 5.6 L77 8.2 Z" fill="#8a4a1a" />
				<path d={HORSE_HEAD} fill={u('wd')} stroke={B} stroke-width="1.6" stroke-linejoin="round" />
				<path d="M88.6 15.6 L93.4 20.2 C95.4 22.6 94.6 26 91.4 26.4 C89.6 26.6 88.2 25.8 86.8 25.2 C88.4 22.4 89 19 88.6 15.6 Z" fill="#8a4a1a" opacity=".45" />
				<path d="M74 10.8 Q78 9.2 82.6 10.4" fill="none" stroke="#ffe0b0" stroke-width="1" stroke-linecap="round" opacity=".75" />
				<ellipse cx="91.6" cy="22.4" rx="1" ry=".7" fill="#3a1a08" />
				<path d="M86.6 25 Q89.6 24.6 92 25.8" fill="none" stroke="#3a1a08" stroke-width=".7" stroke-linecap="round" />
				<ellipse cx="80" cy="14.4" rx="2" ry="2.4" fill="#fff" stroke={B} stroke-width=".7" />
				<ellipse cx="80.6" cy="14.8" rx="1.2" ry="1.6" fill="#1a0e05" /><circle cx="81" cy="14.1" r=".45" fill="#fff" />
				<path d="M78.4 12.3 L77.6 11.1 M79.6 11.9 L79.4 10.5 M81 11.9 L81.4 10.6" stroke={B} stroke-width=".6" stroke-linecap="round" />
				<path d="M82.6 11.6 L86.4 24.6 M86 19.6 Q89.6 18 93 20.6" fill="none" stroke="#e2261f" stroke-width="1.6" stroke-linecap="round" />
				<path d="M86.4 22.4 Q78 30 70.4 27.4" fill="none" stroke="#e2261f" stroke-width="1" stroke-linecap="round" />
				<circle cx="86.2" cy="19.8" r="1.1" fill="#ffd23a" stroke={B} stroke-width=".5" />
				<ellipse cx="76.4" cy="17.6" rx="1.4" ry="2" fill="#f0c878" stroke={B} stroke-width=".8" />
			</g>
		{:else if id === 'a-mount-quad'}
			<!-- Quad Bike: a military-green quad, knobbly wheels turning, a jerrycan on the rack, exhaust puffs -->
			<defs>
				<linearGradient id={g('gr')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a2b25e" /><stop offset=".55" stop-color="#64742c" /><stop offset="1" stop-color="#3a4618" /></linearGradient>
				<radialGradient id={g('lamp')} cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff" /><stop offset=".5" stop-color="#fff2a0" /><stop offset="1" stop-color="#e0a820" /></radialGradient>
				<radialGradient id={g('beam')} cx="0" cy=".5" r="1"><stop offset="0" stop-color="#fff6c0" stop-opacity=".55" /><stop offset="1" stop-color="#fff6c0" stop-opacity="0" /></radialGradient>
			</defs>
			{#each [0, 0.55, 1.1] as d (d)}<circle class="ap-puff" cx="3" cy="35.4" r="1.8" fill="#c8c8c0" style="animation-delay:-{d}s" />{/each}
			<g class="ap-idle">
				<!-- knobbly wheels, turning -->
				{#each [21, 76] as cx (cx)}
					<g class="ap-spin">
						<circle {cx} cy="51" r="10.6" fill="#1f2226" stroke={O} stroke-width="1.5" />
						{#each SPOKES16 as a (a)}<rect x={cx - 1.4} y="39.6" width="2.8" height="2.6" rx=".55" fill="#2e3238" stroke={O} stroke-width=".6" transform="rotate({a} {cx} 51)" />{/each}
						<circle {cx} cy="51" r="7.6" fill="none" stroke="#3a3f47" stroke-width="1.2" />
						<circle {cx} cy="51" r="5.6" fill="#56602c" stroke={O} stroke-width="1" />
						{#each [0, 72, 144, 216, 288] as a (a)}<circle {cx} cy="47.8" r=".65" fill="#c8ccd2" transform="rotate({a} {cx} 51)" />{/each}
						<circle {cx} cy="51" r="1.7" fill="#2a2f38" stroke={O} stroke-width=".5" />
					</g>
				{/each}
				<!-- chassis: frame tube, engine, footrest; exhaust out the back -->
				<path d="M26 46 H70" stroke={O} stroke-width="3" stroke-linecap="round" />
				<path d="M26 46 H70" stroke="#4a4f58" stroke-width="1.5" stroke-linecap="round" />
				<path d="M36 39.6 H60 L58.4 50 H37.6 Z" fill="#3a3f47" stroke={O} stroke-width="1.3" stroke-linejoin="round" />
				<path d="M38.4 42.2 H57.6 M38.8 44.8 H57.2 M39.2 47.4 H56.8" stroke="#6a707a" stroke-width=".8" />
				<rect x="31" y="49.4" width="34" height="2.6" rx="1.3" fill="#2a2e34" stroke={O} stroke-width="1" />
				<path d="M16 37.2 L3.8 35.6" stroke={O} stroke-width="3.2" stroke-linecap="round" />
				<path d="M16 37.2 L3.8 35.6" stroke="#8a8f98" stroke-width="1.8" stroke-linecap="round" />
				<ellipse cx="3.4" cy="35.6" rx=".9" ry="1.35" fill="#2a2a2a" />
				<!-- body: under-seat panel, seat, tank with a stencil star -->
				<path d="M29 38.4 L33 33 H60 L63 38.4 L60.6 43.4 H32 Z" fill={u('gr')} stroke={O} stroke-width="1.4" stroke-linejoin="round" />
				<path d="M30.6 33.6 C30.6 31 32.6 30 35.4 30 H56.6 C58.8 30 59.8 31.4 59.4 33.6 Z" fill="#2a2e34" stroke={O} stroke-width="1.2" stroke-linejoin="round" />
				<path d="M33 31.4 H56" stroke="#5a606a" stroke-width=".8" stroke-linecap="round" />
				<path d="M58.4 34 C59.4 30.4 62.4 28.8 66 28.8 C69 28.8 71.8 30.2 73.4 33.2 L75.4 37.6 L61 40 Z" fill={u('gr')} stroke={O} stroke-width="1.4" stroke-linejoin="round" />
				<path d={star(66.4, 34, 2)} fill="#f2f0e0" opacity=".9" />
				<!-- mudguards over both wheels -->
				<path d="M7 50 C7 40.4 13.4 35.4 21 35.4 C28.6 35.4 35 40.4 35 50 L32 50 C32 42.6 27.4 38.4 21 38.4 C14.6 38.4 10 42.6 10 50 Z" fill={u('gr')} stroke={O} stroke-width="1.4" stroke-linejoin="round" />
				<path d="M62 50 C62 40.4 68.4 35.4 76 35.4 C83.6 35.4 90 40.4 90 50 L87 50 C87 42.6 82.4 38.4 76 38.4 C69.6 38.4 65 42.6 65 50 Z" fill={u('gr')} stroke={O} stroke-width="1.4" stroke-linejoin="round" />
				<path d="M10 41 Q14 36.6 21 36.4 M65 41 Q69 36.6 76 36.4" fill="none" stroke="#d0dc90" stroke-width=".8" stroke-linecap="round" opacity=".6" />
				<!-- the nose with the headlight -->
				<path d="M81 35.8 L90.4 37.2 C92.8 37.8 94 39.4 93.8 41.4 L93.2 44 L85.6 42.6 Z" fill={u('gr')} stroke={O} stroke-width="1.3" stroke-linejoin="round" />
				<!-- racks + a jerrycan on the back one -->
				<path d="M5.4 34.4 H32 M68 33.4 H89" stroke={O} stroke-width="2.6" stroke-linecap="round" />
				<path d="M5.4 34.4 H32 M68 33.4 H89" stroke="#7a8448" stroke-width="1.2" stroke-linecap="round" />
				<rect x="7" y="23" width="13.6" height="11" rx="1.6" fill={u('gr')} stroke={O} stroke-width="1.3" />
				<path d="M9.2 25.2 L18.4 31.8 M18.4 25.2 L9.2 31.8" stroke="#3a4618" stroke-width="1" stroke-linecap="round" />
				<path d="M9 24.8 L18.6 31.6 M18.6 24.8 L9 31.6" stroke="#b8c470" stroke-width=".4" stroke-linecap="round" opacity=".6" />
				<path d="M9.2 23 V21 H15.2 V23" fill="none" stroke={O} stroke-width="1.2" stroke-linejoin="round" />
				<rect x="16.4" y="20.6" width="2.6" height="2.4" rx=".5" fill="#4a5420" stroke={O} stroke-width=".8" />
				<!-- handlebar with a mirror, brush guard, headlight -->
				<path d="M68.4 31 L65.6 20.6" stroke={O} stroke-width="2.6" stroke-linecap="round" />
				<path d="M68.4 31 L65.6 20.6" stroke="#3a3f47" stroke-width="1.3" stroke-linecap="round" />
				<path d="M64 19.6 L62.2 15.6" stroke={O} stroke-width="1" stroke-linecap="round" />
				<ellipse cx="61.8" cy="14.8" rx="1.6" ry="1.2" fill="#9ab8d0" stroke={O} stroke-width=".8" />
				<rect x="61.4" y="18.6" width="8.4" height="3" rx="1.5" fill="#1c1f24" stroke={O} stroke-width="1" />
				<path d="M89.6 30.6 C94.6 32.6 95.6 41.6 92.6 48" fill="none" stroke={O} stroke-width="3" stroke-linecap="round" />
				<path d="M89.6 30.6 C94.6 32.6 95.6 41.6 92.6 48" fill="none" stroke="#4a4f58" stroke-width="1.5" stroke-linecap="round" />
				<path class="ap-glow" d="M93.4 36 L96 32.4 V46 L93.4 42.6 Z" fill={u('beam')} />
				<circle cx="90.6" cy="39.4" r="3" fill={u('lamp')} stroke={O} stroke-width="1.2" />
				<circle cx="89.7" cy="38.5" r=".85" fill="#fff" />
				<rect x="3.6" y="44" width="3.6" height="2.4" rx=".6" fill="#2a2e34" stroke={O} stroke-width=".8" />
			</g>
		{:else if id === 'a-mount-couch'}
			<!-- Jet Couch: a plum velvet sofa with gold buttons, riding two rocket boosters with flickering flames -->
			<defs>
				<radialGradient id={g('vel')} gradientUnits="userSpaceOnUse" cx="40" cy="18" r="70"><stop offset="0" stop-color="#e880ec" /><stop offset=".5" stop-color="#a02eb8" /><stop offset="1" stop-color="#560c6c" /></radialGradient>
				<linearGradient id={g('chr')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" /><stop offset=".45" stop-color="#c8d0dc" /><stop offset="1" stop-color="#5e6a7e" /></linearGradient>
				<radialGradient id={g('fl')} cx="1" cy=".5" r="1"><stop offset="0" stop-color="#fff6c0" /><stop offset=".3" stop-color="#ffd23a" /><stop offset=".7" stop-color="#ff6a1a" /><stop offset="1" stop-color="#d81a0a" /></radialGradient>
			</defs>
			<g class="ap-couch">
				<!-- the far booster (smaller, peeking out between the sofa and the near one) and its flame -->
				<g transform="translate(6.2 8) scale(.78)">
					<g class="ap-flame b">
						<path d="M15.6 53.6 C10 52.6 4.6 54.4 0.6 57.6 C4.6 60.8 10 62.6 15.6 61.6 Z" fill={u('fl')} stroke="#a8200a" stroke-width="1" stroke-linejoin="round" />
						<path d="M15.4 55.4 C11.4 55 7.6 56.2 5 57.6 C7.6 59 11.4 60.2 15.4 59.8 Z" fill="#ffd23a" />
					</g>
				</g>
				<rect x="21.6" y="49.8" width="26" height="6.2" rx="3.1" fill={u('chr')} stroke={O} stroke-width="1.2" />
				<path d="M22.2 50.2 L18.4 49 V56.8 L22.2 55.6 Z" fill="#3a3f4a" stroke={O} stroke-width="1" stroke-linejoin="round" />
				<!-- the near booster and its flame -->
				<g class="ap-flame">
					<path d="M12.4 54.4 C7.6 53.4 3.6 55.4 .4 58.6 C3.6 61.8 7.6 63.8 12.4 62.8 Z" fill={u('fl')} stroke="#a8200a" stroke-width=".8" stroke-linejoin="round" />
					<path d="M12.2 56.2 C9.2 55.8 6.4 57 4.2 58.6 C6.4 60.2 9.2 61.4 12.2 61 Z" fill="#ffd23a" />
					<path d="M12.2 57.4 C10.4 57.2 8.6 57.8 7.4 58.6 C8.6 59.4 10.4 60 12.2 59.8 Z" fill="#fffbe8" />
				</g>
				<rect x="16" y="54.6" width="34" height="8" rx="4" fill={u('chr')} stroke={O} stroke-width="1.4" />
				<path d="M16.6 55 L12.2 53.6 V63.6 L16.6 62.2 Z" fill="#3a3f4a" stroke={O} stroke-width="1" stroke-linejoin="round" />
				<path d="M25.6 54.8 L21.8 51.2 H25.6 L31 54.8 Z" fill="#e2261f" stroke={O} stroke-width=".9" stroke-linejoin="round" />
				<path d="M25.6 62.4 L22.6 64 H26.6 L31 62.4 Z" fill="#e2261f" stroke={O} stroke-width=".9" stroke-linejoin="round" />
				<rect x="41" y="54.6" width="3" height="8" fill="#e2261f" />
				<path d="M18.6 56.6 H47" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".7" />
				<!-- the sofa: back, seat, rolled arms, skirt (lifted a little so both boosters show) -->
				<g transform="translate(0 -2.4)">
				<path d="M14 40 V24 C14 18 18 16 24 16 H72 C78 16 82 18 82 24 V40 Z" fill={u('vel')} stroke={O} stroke-width="1.6" stroke-linejoin="round" />
				<path d="M24 24 L36 32 L48 24 L60 32 L72 24 M24 32 L36 24 L48 32 L60 24 L72 32" fill="none" stroke="#4a0a5e" stroke-width=".7" opacity=".55" />
				{#each [24, 36, 48, 60, 72] as x, i (x)}
					<circle cx={x} cy={i % 2 ? 32 : 24} r="1" fill="#ffd23a" stroke={O} stroke-width=".4" />
					<circle cx={x} cy={i % 2 ? 24 : 32} r="1" fill="#ffd23a" stroke={O} stroke-width=".4" />
				{/each}
				<path d="M18 19.6 Q30 17.4 46 17.6" fill="none" stroke="#ffc8f4" stroke-width="1" stroke-linecap="round" opacity=".55" />
				<path d="M16 37.4 H80 C83 37.4 84 39.4 84 42 V44.4 C84 46.4 82.6 47.6 80.4 47.6 H15.6 C13.4 47.6 12 46.4 12 44.4 V42 C12 39.4 13 37.4 16 37.4 Z" fill={u('vel')} stroke={O} stroke-width="1.4" stroke-linejoin="round" />
				<path d="M48 37.8 V47.2" stroke="#4a0a5e" stroke-width=".9" />
				<path d="M13.4 46 H82.6" stroke="#ffd23a" stroke-width=".8" opacity=".9" />
				{#each [[4, 11.6], [77, 84.4]] as [x0, cx] (x0)}
					<path d="M{x0} 48 V33.6 C{x0} 29 {cx - 4.2} 26.6 {cx} 26.6 C{cx + 4.2} 26.6 {x0 + 15} 29 {x0 + 15} 33.6 V48 Z" fill={u('vel')} stroke={O} stroke-width="1.6" stroke-linejoin="round" />
					<circle cx={cx} cy="31.2" r="3.6" fill="none" stroke="#4a0a5e" stroke-width="1" />
					<path d="M{cx} 31.2 m-1.6 0 a1.6 1.6 0 1 1 1.6 1.6" fill="none" stroke="#4a0a5e" stroke-width=".8" />
					<path d="M{x0 + 2.4} 30 Q{cx - 2} 27.6 {cx + 1.6} 27.8" fill="none" stroke="#ffc8f4" stroke-width=".8" stroke-linecap="round" opacity=".6" />
				{/each}
				<rect x="3" y="47" width="90" height="5.4" rx="2.4" fill="#6a1680" stroke={O} stroke-width="1.4" />
				<path d="M5 49.6 H91" stroke="#ffd23a" stroke-width=".7" stroke-dasharray="1.6 1.2" opacity=".8" />
				</g>
			</g>
		{:else if id === 'a-mount-duck'}
			<!-- Giant Duck: a huge yellow rubber duck bobbing in a little splash of waves -->
			<defs>
				<radialGradient id={g('dk')} gradientUnits="userSpaceOnUse" cx="40" cy="20" r="62"><stop offset="0" stop-color="#fff8b8" /><stop offset=".45" stop-color="#ffd83a" /><stop offset="1" stop-color="#e8900a" /></radialGradient>
				<linearGradient id={g('bk')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb24a" /><stop offset="1" stop-color="#e8560a" /></linearGradient>
				<linearGradient id={g('wt')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6ecff" /><stop offset=".5" stop-color="#4ab8ee" /><stop offset="1" stop-color="#1f78c8" /></linearGradient>
				<clipPath id={g('clip')}><rect x="0" y="0" width="96" height="64" /></clipPath>
			</defs>
			<g class="ap-duckbob">
				<g fill={O} stroke={O} stroke-width="3" stroke-linejoin="round"><path d={DUCK_MOUNT} /><circle cx="79" cy="19" r="12.4" /></g>
				<g fill={u('dk')}><path d={DUCK_MOUNT} /><circle cx="79" cy="19" r="12.4" /></g>
				<path d="M9 47.6 C14 54.6 28 57.4 46 57.4 C62 57.4 74 55.8 80 50.8" fill="none" stroke="#e0860a" stroke-width="2.4" stroke-linecap="round" opacity=".45" />
				<ellipse cx="13" cy="30.6" rx="4.4" ry="1.8" transform="rotate(-38 13 30.6)" fill="#fff" opacity=".55" />
				<path d="M34 36 C40 30 54 30 60 37 C55 45 40 46 34 36 Z" fill="#ffc82a" stroke="#a86a00" stroke-width="1" stroke-linejoin="round" />
				<path d="M40 38 Q46 40.6 53 38.6 M42.6 41.8 Q47 43 51.4 41.8" fill="none" stroke="#c88a10" stroke-width=".9" stroke-linecap="round" />
				<path d="M70.4 12.4 C72.4 9.2 75.8 7.8 79.4 7.6" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".7" />
				<path d="M88.4 17 C91.6 15.6 95.4 16.6 95.8 19.2 C95.4 22.2 92.4 23 89 22.8 Z" fill={u('bk')} stroke={O} stroke-width="1.3" stroke-linejoin="round" />
				<path d="M89.2 20 Q92.4 20.4 95.6 19.6" fill="none" stroke={O} stroke-width=".8" />
				<ellipse cx="86.2" cy="22" rx="2.1" ry="1.1" fill="#ff7a4a" opacity=".5" />
				<path d="M81.4 10.4 Q83.6 9.4 85.8 10.6" fill="none" stroke={O} stroke-width=".9" stroke-linecap="round" />
				<g class="ap-blink">
					<ellipse cx="83.6" cy="14.8" rx="2.3" ry="2.9" fill="#1a0e05" />
					<circle cx="84.4" cy="13.6" r=".9" fill="#fff" /><circle cx="83" cy="16.2" r=".45" fill="#fff" />
				</g>
			</g>
			<g clip-path={u('clip')}>
				<g class="ap-wave">
					<path d={WAVE} fill={u('wt')} stroke="#1a5a9a" stroke-width="1.2" stroke-linejoin="round" />
					<path d="M-12 59.6 Q-4 58.2 4 59.6 M20 59.4 Q28 58 36 59.4 M52 60 Q60 58.6 68 60 M84 59.4 Q92 58 100 59.4" fill="none" stroke="#e0f8ff" stroke-width=".9" stroke-linecap="round" opacity=".75" />
				</g>
			</g>
			<g fill="#fff" opacity=".9">
				<ellipse class="ap-glow" cx="9" cy="54.6" rx="4" ry="1.3" />
				<ellipse class="ap-glow" cx="82" cy="54" rx="4.4" ry="1.4" style="animation-delay:-.7s" />
			</g>
			<g fill="#bdf0ff" stroke="#1a5a9a" stroke-width=".5">
				{#each [[4, 47, 0], [92, 46, 0.5], [89.6, 50.4, 1], [7.4, 50.6, 1.3]] as [x, y, d] (d)}
					<path class="ap-drop" d="M{x} {y - 1.8} C{x + 1.2} {y - 0.2} {x + 1.1} {y + 1.2} {x} {y + 1.2} C{x - 1.1} {y + 1.2} {x - 1.2} {y - 0.2} {x} {y - 1.8} Z" style="animation-delay:-{d}s" />
				{/each}
			</g>
		{:else if id === 'a-mount-dragon'}
			<!-- Dragon: a red dragon, a big wing flapping, a spade tail swaying, a smoking nostril, gold horns -->
			<defs>
				<radialGradient id={g('sc')} gradientUnits="userSpaceOnUse" cx="64" cy="18" r="64"><stop offset="0" stop-color="#ff9a6a" /><stop offset=".45" stop-color="#e2261f" /><stop offset="1" stop-color="#6e0a0a" /></radialGradient>
				<linearGradient id={g('mem')} gradientUnits="userSpaceOnUse" x1="4" y1="2" x2="40" y2="34"><stop offset="0" stop-color="#ffb07a" /><stop offset=".5" stop-color="#e8502a" /><stop offset="1" stop-color="#9a1a10" /></linearGradient>
				<linearGradient id={g('hn')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c8" /><stop offset=".6" stop-color="#ffcf4a" /><stop offset="1" stop-color="#b8800a" /></linearGradient>
			</defs>
			<g class="ap-pivot" style:--o="30px 41px">
				<path d="M30 38 C22 38 14 42 9 40 C6 38.8 5 36 2.6 35.4 C4.2 38.4 6 41.8 9.6 44.4 C15 47.6 22 46.4 30 45 Z" fill={u('sc')} stroke={O} stroke-width="1.4" stroke-linejoin="round" />
				<path d="M5 37 L.8 31.6 L7.6 33 Z" fill={u('hn')} stroke={O} stroke-width="1" stroke-linejoin="round" />
				<g fill={u('hn')} stroke={O} stroke-width=".7" stroke-linejoin="round">
					<path d="M24 38.4 L22.6 35.6 L26.4 38 Z" /><path d="M17.6 40 L16 37.2 L19.8 39.8 Z" /><path d="M11.8 40.6 L10 38 L13.6 40.6 Z" />
				</g>
			</g>
			<!-- far legs (darker), behind the body -->
			<path d="M40 46 L39.2 57.6 H45 L45.6 47 Z M50 45 L49.6 57.6 H55 L55.4 46 Z" fill="#8a1a14" stroke={O} stroke-width="1.2" stroke-linejoin="round" />
			<path d="M37.8 57.4 H46.2 C47.4 57.4 47.8 58.8 47.4 60 L47 61.2 H37.4 Z M48.2 57.4 H56.6 C57.8 57.4 58.2 58.8 57.8 60 L57.4 61.2 H47.8 Z" fill="#5a0a08" stroke={O} stroke-width="1" stroke-linejoin="round" />
			<ellipse cx="47" cy="42" rx="19" ry="9.6" fill={u('sc')} stroke={O} stroke-width="1.6" />
			<path d="M30 44 C34 51 56 53 64 44 C58 49 38 49.6 30 44 Z" fill="#ffe0a0" stroke={O} stroke-width=".8" stroke-linejoin="round" />
			<!-- the near hind leg: a big thigh, a shin, a clawed foot -->
			<path d="M25.6 44.4 C25.6 37.6 32 35.2 37.4 37.6 C41.6 39.6 42.4 45.6 39 49.4 L37.6 51 L36.8 57.6 H29.8 L30.2 51 C27.4 49.8 25.6 47.6 25.6 44.4 Z" fill={u('sc')} stroke={O} stroke-width="1.4" stroke-linejoin="round" />
			<path d="M28.4 41 Q31.6 38.6 35.4 39" fill="none" stroke="#ffa080" stroke-width=".9" stroke-linecap="round" opacity=".7" />
			<path d="M32 49.2 Q35 47.8 37.4 45" fill="none" stroke="#8a1410" stroke-width=".8" stroke-linecap="round" />
			<path d="M27.4 57.2 H38.4 C40.6 57.2 41.4 59.2 40.6 60.8 L40.2 61.8 H26.6 C25.4 61.8 25.4 59.2 27.4 57.2 Z" fill="#8a1410" stroke={O} stroke-width="1.2" stroke-linejoin="round" />
			<path d="M31.4 58.4 V61.4 M35.4 58.4 V61.4" stroke={O} stroke-width=".6" opacity=".6" />
			<g fill="#fff4dc" stroke={O} stroke-width=".5" stroke-linejoin="round"><path d="M40.4 58.6 L43.2 60 L40.4 61.2 Z" /><path d="M39.8 60.8 L42.4 62.8 L39.2 61.8 Z" /></g>
			<!-- the near front leg -->
			<path d="M56.4 41.6 C61 40.6 65.4 44 65 48.6 L64.4 57.6 H58.2 L58 50.4 C55.8 48.6 55 44.4 56.4 41.6 Z" fill={u('sc')} stroke={O} stroke-width="1.4" stroke-linejoin="round" />
			<path d="M58.2 43.6 Q61 42.6 63.2 44.4" fill="none" stroke="#ffa080" stroke-width=".8" stroke-linecap="round" opacity=".7" />
			<path d="M56.6 57.2 H66 C68.2 57.2 69 59.2 68.2 60.8 L67.8 61.8 H56 C55 61.8 54.8 59.2 56.6 57.2 Z" fill="#8a1410" stroke={O} stroke-width="1.2" stroke-linejoin="round" />
			<path d="M60 58.4 V61.4 M63.6 58.4 V61.4" stroke={O} stroke-width=".6" opacity=".6" />
			<g fill="#fff4dc" stroke={O} stroke-width=".5" stroke-linejoin="round"><path d="M68 58.6 L70.8 60 L68 61.2 Z" /><path d="M67.4 60.8 L70 62.8 L66.8 61.8 Z" /></g>
			<!-- a curved neck with a plated belly stripe -->
			<path d="M55.6 38 C57 31 60.6 24.4 65.8 18.8 C67.8 16.6 70.2 15.2 72.6 15.2 L79.2 20.4 C75.8 23.4 73.4 27 72.2 32.4 C71.4 36.4 71 40.4 70.8 44.8 Z" fill={u('sc')} stroke={O} stroke-width="1.5" stroke-linejoin="round" />
			<path d="M70.8 44.8 C71 40.4 71.4 36.4 72.2 32.4 C73.4 27 75.8 23.4 79.2 20.4 L81.4 22 C78.2 24.8 76 28.2 74.8 33 C74 36.8 73.6 40.8 73.4 45.4 Z" fill="#ffe0a0" stroke={O} stroke-width=".8" stroke-linejoin="round" />
			<path d="M71 40.4 L73.8 40.8 M71.6 36 L74.4 36.6 M72.6 31.6 L75.4 32.4 M74.6 27 L77.2 28" stroke="#d8a868" stroke-width=".6" />
			<path d="M58.6 32 Q61.6 25.4 66.4 20.4" fill="none" stroke="#ffa080" stroke-width="1" stroke-linecap="round" opacity=".6" />
			<g fill={u('hn')} stroke={O} stroke-width=".8" stroke-linejoin="round">
				<path d="M57.8 32.4 L53.8 31.2 L56.6 28.4 Z" /><path d="M61 26.6 L57.2 25.2 L60.4 22.6 Z" /><path d="M64.8 21.4 L61.8 19.4 L65.2 17.4 Z" />
			</g>
			<g fill={u('hn')} stroke={O} stroke-width="1" stroke-linejoin="round">
				<path d="M74.4 7.4 C71 4.4 67.4 3.4 64.2 4 C67.4 5.4 69.8 7.8 71.4 10.4 Z" />
				<path d="M77.6 5.8 C75.6 2.4 72.6 .8 69.6 .8 C72.4 2.6 74.4 4.8 75.2 7.4 Z" />
				<path d="M71.4 14 L66.6 13.4 L70.6 17.6 Z" />
			</g>
			<path d={DRAGON_HEAD} fill={u('sc')} stroke={O} stroke-width="1.6" stroke-linejoin="round" />
			<path d="M74.6 8 C77 6.6 80 6.2 83 6.8" fill="none" stroke="#ffc0a0" stroke-width="1" stroke-linecap="round" opacity=".75" />
			<path d="M76 20.6 C80.6 20.6 86 19.4 92.6 19.4" fill="none" stroke={O} stroke-width=".9" stroke-linecap="round" />
			<path d="M84 19.8 L84.8 21.4 L85.6 19.7 M88 19.5 L88.8 21 L89.5 19.5" fill="#fff" stroke={O} stroke-width=".4" stroke-linejoin="round" />
			<path d="M78.6 8.8 C81.4 7.4 84.4 7.8 86.4 9.4" fill="none" stroke={O} stroke-width="1.2" stroke-linecap="round" />
			<ellipse cx="82.4" cy="11.6" rx="2" ry="1.6" fill="#ffe14a" stroke={O} stroke-width=".8" />
			<ellipse cx="82.6" cy="11.6" rx=".5" ry="1.4" fill="#1a0e05" />
			<circle cx="81.8" cy="11" r=".4" fill="#fff" />
			<ellipse cx="91.4" cy="13.4" rx="1" ry=".6" transform="rotate(-20 91.4 13.4)" fill="#3a0606" />
			{#each [0, 0.7, 1.4] as d (d)}<circle class="ap-smoke" cx="92.6" cy="11.2" r="1.8" fill="#ece6e2" style="animation-delay:-{d}s" />{/each}
			<g class="ap-pivot wing" style:--o="46px 34px">
				<path
					d="M46 34 L36 15 L25 5.6 C18 3.6 10 2.8 2.6 4.6 C6.4 7 8 9.4 8.6 12.6 C11.4 11.6 14.6 12.6 15.6 15.4 C18.4 14.6 21.6 16 22.4 19.2 C25 18.6 28 20 28.6 23.4 C31 23.6 33 25.4 33.4 28 C36 29 38 31 38.4 34 Z"
					fill={u('mem')}
					stroke={O}
					stroke-width="1.4"
					stroke-linejoin="round"
				/>
				<path d="M25 5.6 L2.6 4.6 M25 5.6 L8.6 12.6 M25 5.6 L15.6 15.4 M36 15 L22.4 19.2 M36 15 L28.6 23.4" fill="none" stroke="#6a0a08" stroke-width="1.1" stroke-linecap="round" />
				<path d="M46 34 L36 15 L25 5.6" fill="none" stroke={O} stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
				<path d="M46 34 L36 15 L25 5.6" fill="none" stroke="#d8361e" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
				<path d="M25 5.6 L23.6 2.2 L26.8 4.6 Z" fill={u('hn')} stroke={O} stroke-width=".7" stroke-linejoin="round" />
			</g>
		{:else if id === 'a-mount-unicorn'}
			<!-- Golden Unicorn: a gold unicorn, a pearly horn, a rainbow mane and tail swaying, sparkles -->
			<defs>
				<radialGradient id={g('au')} gradientUnits="userSpaceOnUse" cx="62" cy="16" r="62"><stop offset="0" stop-color="#fffbe0" /><stop offset=".35" stop-color="#ffd84a" /><stop offset=".72" stop-color="#d8a020" /><stop offset="1" stop-color="#8a5a08" /></radialGradient>
				<linearGradient id={g('pearl')} x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" /><stop offset=".5" stop-color="#ffd6f0" /><stop offset="1" stop-color="#d8c0ff" /></linearGradient>
			</defs>
			{@render twinkle(8, 8, 2.2, 0, '#fffbe0')}
			{@render twinkle(40, 5, 1.6, 0.6, '#ffe6f6')}
			{@render twinkle(92.4, 42, 1.8, 1.2, '#fffbe0')}
			{@render twinkle(4.6, 30, 1.4, 1.7, '#e6f0ff')}
			<g class="ap-pivot" style:--o="28px 38px">
				{#each STRANDS as k (k)}<path d={uniTail(k)} fill="none" stroke={O} stroke-width="3.8" stroke-linecap="round" />{/each}
				{#each STRANDS as k (k)}<path d={uniTail(k)} fill="none" stroke={RAINBOW[k]} stroke-width="2.4" stroke-linecap="round" />{/each}
			</g>
			<!-- far legs (darker): one standing, one bent up in a prance -->
			<path d="M37 44 L36.4 57.6 M59.6 44 L63.4 50.6 L69.2 48.4" fill="none" stroke={O} stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round" />
			<path d="M37 44 L36.4 57.6 M59.6 44 L63.4 50.6 L69.2 48.4" fill="none" stroke="#c8901a" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" />
			<rect x="33.2" y="56.4" width="6.4" height="3.8" rx="1.2" fill="#b8608a" stroke={O} stroke-width="1.1" />
			<rect x="68" y="46.2" width="4.4" height="4" rx="1.1" transform="rotate(-24 70.2 48.2)" fill="#b8608a" stroke={O} stroke-width="1" />
			<ellipse cx="47" cy="40" rx="20" ry="9.6" fill={u('au')} stroke={O} stroke-width="1.6" />
			<path d="M33 35.4 Q42 31.6 54 32.6" fill="none" stroke="#fffbe0" stroke-width="1.1" stroke-linecap="round" opacity=".7" />
			<path d="M31 44 L29.8 58 M62.6 44 L64.2 58" fill="none" stroke={O} stroke-width="6.6" stroke-linecap="round" />
			<path d="M31 44 L29.8 58 M62.6 44 L64.2 58" fill="none" stroke={u('au')} stroke-width="4.8" stroke-linecap="round" />
			<rect x="26.6" y="57.4" width="6.6" height="4.2" rx="1.2" fill="#e08ab4" stroke={O} stroke-width="1.1" />
			<rect x="60.9" y="57.4" width="6.6" height="4.2" rx="1.2" fill="#e08ab4" stroke={O} stroke-width="1.1" />
			<path d="M27.6 58.4 H32.2 M61.9 58.4 H66.5" stroke="#ffd0e6" stroke-width=".7" stroke-linecap="round" />
			<!-- an arched neck, the rainbow mane down its back -->
			<path d="M56.6 37 C58 29.4 62 21.6 67.6 15.6 C69.4 13.6 71.4 12.6 73.4 12.8 L80.6 19.6 C77.4 24.4 74.4 30.6 70.4 41 Z" fill={u('au')} stroke={O} stroke-width="1.5" stroke-linejoin="round" />
			<path d="M62.6 27 C64.6 22.6 67.4 18.8 70.4 16" fill="none" stroke="#fffbe0" stroke-width="1" stroke-linecap="round" opacity=".75" />
			<g class="ap-pivot mane" style:--o="74px 6px">
				{#each STRANDS as k (k)}<path d={uniMane(k)} fill="none" stroke={O} stroke-width="3.8" stroke-linecap="round" />{/each}
				{#each STRANDS as k (k)}<path d={uniMane(k)} fill="none" stroke={RAINBOW[k]} stroke-width="2.4" stroke-linecap="round" />{/each}
			</g>
			<!-- ear, head, forelock, pearly horn -->
			<path d="M75 8.4 L75.2 1.6 L79.6 6.6 Z" fill={u('au')} stroke={O} stroke-width="1.1" stroke-linejoin="round" />
			<path d="M76 7 L76.1 4 L78 6.4 Z" fill="#ffb4d8" />
			<path d={UNI_HEAD} fill={u('au')} stroke={O} stroke-width="1.6" stroke-linejoin="round" />
			<ellipse cx="91.4" cy="21" rx="3.6" ry="3" fill="#fff3b0" opacity=".5" />
			<path d="M74.6 9.4 Q78.6 6.4 83.6 7" fill="none" stroke="#fffbe0" stroke-width="1" stroke-linecap="round" opacity=".85" />
			<path d="M76.4 8.4 C78.2 6.2 80.4 6 81.2 7.6" fill="none" stroke="#ff8ac8" stroke-width="1.7" stroke-linecap="round" />
			<path d="M77.6 9.6 C79.4 8 81.2 8.2 81.8 9.6" fill="none" stroke="#a46aff" stroke-width="1.5" stroke-linecap="round" />
			<path d="M79.4 6 L90.4 .4 L84.8 7.6 Z" fill={u('pearl')} stroke={O} stroke-width="1" stroke-linejoin="round" />
			<path d="M81 5.6 L83.6 6.8 M83.6 4 L85.8 5 M86.2 2.4 L87.8 3" stroke="#b88ad8" stroke-width=".8" stroke-linecap="round" />
			{@render twinkle(92.6, 3.6, 1.5, 0.3, '#ffffff')}
			<!-- a big sparkly eye with lashes, nostril, smile, blush -->
			<ellipse cx="84" cy="13" rx="2.1" ry="2.6" fill="#2a0a4a" />
			<ellipse cx="84" cy="14" rx="1.5" ry="1.1" fill="#a46aff" opacity=".85" />
			<circle cx="84.6" cy="12" r=".8" fill="#fff" /><circle cx="83.5" cy="14.4" r=".35" fill="#fff" />
			<path d="M82.2 11 L80.8 9.8 M83.2 10.5 L82.6 9 M84.4 10.4 L84.6 8.9" stroke={O} stroke-width=".7" stroke-linecap="round" />
			<ellipse cx="93" cy="21.2" rx=".9" ry=".6" fill="#8a5a08" />
			<path d="M88.6 23.6 Q91.2 24 93.2 23" fill="none" stroke="#8a5a08" stroke-width=".8" stroke-linecap="round" />
			<ellipse cx="87.6" cy="18.6" rx="2" ry="1" fill="#ff9ac0" opacity=".55" />
		{/if}
	</svg>
{/if}

<style>
	.ap {
		display: block;
		overflow: visible;
	}
	/* pets sit on the shoulder without a wrapper of their own: a small shadow so they read on any header */
	.ap-pet {
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.55));
	}

	/* ---------- shared moves ---------- */
	.ap-float {
		animation: ap-float 2.8s ease-in-out infinite;
	}
	@keyframes ap-float {
		50% {
			transform: translateY(-1.6px);
		}
	}
	.ap-shadow {
		transform-box: fill-box;
		transform-origin: center;
		animation: ap-shadow 2.8s ease-in-out infinite;
	}
	@keyframes ap-shadow {
		50% {
			transform: scale(0.75);
			opacity: 0.16;
		}
	}
	.ap-bob {
		animation: ap-bob 2.2s ease-in-out infinite;
	}
	@keyframes ap-bob {
		50% {
			transform: translateY(-1.1px);
		}
	}
	.ap-blink {
		transform-box: fill-box;
		transform-origin: center;
		animation: ap-blink 4.2s infinite;
	}
	@keyframes ap-blink {
		0%,
		91%,
		97%,
		100% {
			transform: scaleY(1);
		}
		94% {
			transform: scaleY(0.1);
		}
	}
	.ap-twinkle {
		transform-box: fill-box;
		transform-origin: center;
		animation: ap-twinkle 2.2s ease-in-out infinite;
	}
	@keyframes ap-twinkle {
		0%,
		100% {
			transform: scale(0.35) rotate(0deg);
			opacity: 0.25;
		}
		50% {
			transform: scale(1) rotate(45deg);
			opacity: 1;
		}
	}
	.ap-glow {
		animation: ap-glow 2.4s ease-in-out infinite;
	}
	@keyframes ap-glow {
		50% {
			opacity: 0.5;
		}
	}
	.ap-chase {
		animation: ap-chase 1.25s linear infinite;
	}
	@keyframes ap-chase {
		0%,
		100% {
			opacity: 0.3;
		}
		30% {
			opacity: 1;
		}
	}
	.ap-spin {
		transform-box: fill-box;
		transform-origin: center;
		animation: ap-spin 0.8s linear infinite;
	}
	@keyframes ap-spin {
		to {
			transform: rotate(360deg);
		}
	}
	/* swings round a point given in viewBox units by --o */
	.ap-pivot {
		transform-box: view-box;
		transform-origin: var(--o);
		animation: ap-sway 2.4s ease-in-out infinite alternate;
	}
	@keyframes ap-sway {
		from {
			transform: rotate(-4deg);
		}
		to {
			transform: rotate(4deg);
		}
	}
	.ap-speed {
		animation: ap-speed 0.9s linear infinite;
	}
	@keyframes ap-speed {
		0% {
			transform: translateX(4px);
			opacity: 0;
		}
		30% {
			opacity: 0.85;
		}
		100% {
			transform: translateX(-6px);
			opacity: 0;
		}
	}

	/* ---------- pets ---------- */
	.ap-look {
		animation: ap-look 5s ease-in-out infinite;
	}
	@keyframes ap-look {
		0%,
		34%,
		84%,
		100% {
			transform: translateX(0);
		}
		42%,
		76% {
			transform: translateX(-1.6px);
		}
	}
	.ap-hover {
		transform-box: fill-box;
		transform-origin: center;
		animation: ap-hover 3s ease-in-out infinite;
	}
	@keyframes ap-hover {
		0%,
		100% {
			transform: translateY(0) rotate(-3deg);
		}
		50% {
			transform: translateY(-1.4px) rotate(3deg);
		}
	}
	.ap-beam {
		animation: ap-beam 1.9s linear infinite;
	}
	@keyframes ap-beam {
		0%,
		100% {
			opacity: 0.9;
		}
		9% {
			opacity: 0.45;
		}
		13% {
			opacity: 0.95;
		}
		48% {
			opacity: 0.7;
		}
		53% {
			opacity: 1;
		}
		58% {
			opacity: 0.55;
		}
		64% {
			opacity: 0.9;
		}
	}
	.ap-rock {
		transform-box: fill-box;
		transform-origin: 50% 92%;
		animation: ap-rock 2.6s ease-in-out infinite alternate;
	}
	@keyframes ap-rock {
		from {
			transform: rotate(-5deg);
		}
		to {
			transform: rotate(5deg) translateY(-0.6px);
		}
	}
	.ap-ripple {
		animation: ap-glow 2.6s ease-in-out infinite;
	}
	.ap-run-a,
	.ap-run-b {
		animation: ap-run 0.32s ease-in-out infinite alternate;
	}
	.ap-run-b {
		animation-delay: -0.32s;
	}
	@keyframes ap-run {
		from {
			transform: translateX(-0.9px);
		}
		to {
			transform: translateX(0.9px);
		}
	}
	.ap-roll {
		transform-box: view-box;
		transform-origin: 16px 16.4px;
		animation: ap-spin 2.4s linear infinite;
	}
	.ap-wag {
		transform-box: fill-box;
		transform-origin: 100% 100%;
		animation: ap-wag 0.4s ease-in-out infinite alternate;
	}
	@keyframes ap-wag {
		from {
			transform: rotate(-14deg);
		}
		to {
			transform: rotate(14deg);
		}
	}
	.ap-scan {
		animation: ap-scan 3s ease-in-out infinite;
	}
	@keyframes ap-scan {
		0%,
		100% {
			transform: translateX(0);
		}
		45%,
		55% {
			transform: translateX(-3.6px);
		}
	}
	.ap-led {
		animation: ap-led 1.1s steps(1) infinite;
	}
	@keyframes ap-led {
		50% {
			opacity: 0.3;
		}
	}
	.ap-tilt {
		transform-box: fill-box;
		transform-origin: 30% 100%;
		animation: ap-tilt 4.4s ease-in-out infinite;
	}
	@keyframes ap-tilt {
		0%,
		60%,
		100% {
			transform: rotate(0deg);
		}
		72%,
		86% {
			transform: rotate(-7deg);
		}
	}
	.ap-flap {
		transform-box: fill-box;
		transform-origin: 100% 40%;
		animation: ap-flap 0.5s ease-in-out infinite alternate;
	}
	@keyframes ap-flap {
		from {
			transform: rotate(14deg);
		}
		to {
			transform: rotate(-10deg);
		}
	}
	.ap-flicker {
		transform-box: fill-box;
		transform-origin: 70% 100%;
		animation: ap-flicker 0.9s ease-in-out infinite;
	}
	.ap-flicker.fast {
		animation-duration: 0.6s;
		animation-direction: reverse;
	}
	@keyframes ap-flicker {
		0%,
		100% {
			transform: scale(1, 1) skewX(0deg);
		}
		25% {
			transform: scale(0.95, 1.06) skewX(-3deg);
		}
		50% {
			transform: scale(1.03, 0.96) skewX(2deg);
		}
		75% {
			transform: scale(0.98, 1.04) skewX(-1.5deg);
		}
	}
	.ap-ember {
		animation: ap-ember 1.8s ease-out infinite;
	}
	@keyframes ap-ember {
		0% {
			transform: translate(0, 0);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		100% {
			transform: translate(-1.4px, -6px);
			opacity: 0;
		}
	}
	.ap-twitch {
		transform-box: fill-box;
		transform-origin: 40% 100%;
		animation: ap-twitch 4s ease-in-out infinite;
	}
	@keyframes ap-twitch {
		0%,
		80%,
		90%,
		100% {
			transform: rotate(0deg);
		}
		84% {
			transform: rotate(-14deg);
		}
		87% {
			transform: rotate(4deg);
		}
	}
	.ap-ring {
		transform-box: fill-box;
		transform-origin: center;
		animation: ap-ring 2.4s ease-out infinite;
	}
	@keyframes ap-ring {
		0% {
			transform: translate(0, 0) scale(0.5);
			opacity: 0;
		}
		15% {
			opacity: 0.95;
		}
		100% {
			transform: translate(1.4px, -8px) scale(1.9);
			opacity: 0;
		}
	}
	.ap-tailsway {
		transform-box: fill-box;
		transform-origin: 100% 100%;
		animation: ap-sway 2s ease-in-out infinite alternate;
	}
	.ap-flap-s {
		transform-box: fill-box;
		transform-origin: 100% 90%;
		animation: ap-flap-s 0.7s ease-in-out infinite alternate;
	}
	@keyframes ap-flap-s {
		from {
			transform: rotate(10deg);
		}
		to {
			transform: rotate(-14deg);
		}
	}

	/* ---------- plushies ---------- */
	.ap-squish {
		transform-box: fill-box;
		transform-origin: 50% 100%;
		animation: ap-squish 2.8s ease-in-out infinite;
	}
	@keyframes ap-squish {
		0%,
		100% {
			transform: scale(1, 1);
		}
		50% {
			transform: scale(1.035, 0.965);
		}
	}
	.ap-arm-l,
	.ap-arm-r {
		transform-box: fill-box;
		animation: ap-arm 1.8s ease-in-out infinite alternate;
	}
	.ap-arm-l {
		transform-origin: 100% 0%;
	}
	.ap-arm-r {
		transform-origin: 0% 0%;
		animation-direction: alternate-reverse;
	}
	@keyframes ap-arm {
		from {
			transform: rotate(-7deg);
		}
		to {
			transform: rotate(7deg);
		}
	}
	.ap-fin {
		transform-box: fill-box;
		transform-origin: 100% 50%;
		animation: ap-fin 0.8s ease-in-out infinite alternate;
	}
	@keyframes ap-fin {
		from {
			transform: rotate(-9deg);
		}
		to {
			transform: rotate(9deg);
		}
	}

	/* ---------- mounts ---------- */
	.ap-jitter {
		animation: ap-jitter 0.5s steps(2) infinite;
	}
	@keyframes ap-jitter {
		50% {
			transform: translateY(-0.5px);
		}
	}
	.ap-board {
		animation: ap-board 2.4s ease-in-out infinite;
	}
	@keyframes ap-board {
		50% {
			transform: translateY(-2px);
		}
	}
	.ap-ripple-ring {
		transform-box: fill-box;
		transform-origin: center;
		animation: ap-ripple-ring 1.4s ease-out infinite;
	}
	@keyframes ap-ripple-ring {
		0% {
			transform: scale(0.4);
			opacity: 0.9;
		}
		100% {
			transform: scale(1.5);
			opacity: 0;
		}
	}
	.ap-rockhorse {
		transform-box: view-box;
		transform-origin: 48px 62px;
		animation: ap-rockh 2.4s ease-in-out infinite alternate;
	}
	@keyframes ap-rockh {
		from {
			transform: rotate(-3.5deg);
		}
		to {
			transform: rotate(3.5deg);
		}
	}
	.ap-idle {
		animation: ap-idle 0.2s steps(2) infinite;
	}
	@keyframes ap-idle {
		50% {
			transform: translateY(-0.4px);
		}
	}
	.ap-puff {
		transform-box: fill-box;
		transform-origin: center;
		animation: ap-puff 1.6s ease-out infinite;
	}
	@keyframes ap-puff {
		0% {
			transform: translate(0, 0) scale(0.4);
			opacity: 0;
		}
		20% {
			opacity: 0.8;
		}
		100% {
			transform: translate(-3px, -8px) scale(1.8);
			opacity: 0;
		}
	}
	.ap-couch {
		animation: ap-couch 1.8s ease-in-out infinite;
	}
	@keyframes ap-couch {
		50% {
			transform: translateY(-1.6px);
		}
	}
	.ap-flame {
		transform-box: fill-box;
		transform-origin: 100% 50%;
		animation: ap-flame 0.32s ease-in-out infinite alternate;
	}
	.ap-flame.b {
		animation-duration: 0.27s;
		animation-direction: alternate-reverse;
	}
	@keyframes ap-flame {
		from {
			transform: scale(1, 1);
		}
		to {
			transform: scale(0.78, 0.9);
		}
	}
	.ap-duckbob {
		transform-box: fill-box;
		transform-origin: 50% 90%;
		animation: ap-duckbob 2.8s ease-in-out infinite;
	}
	@keyframes ap-duckbob {
		0%,
		100% {
			transform: translateY(0) rotate(-2deg);
		}
		50% {
			transform: translateY(-1.4px) rotate(2deg);
		}
	}
	.ap-wave {
		animation: ap-wave 2.2s linear infinite;
	}
	@keyframes ap-wave {
		to {
			transform: translateX(16px);
		}
	}
	.ap-drop {
		animation: ap-drop 1.6s ease-in-out infinite;
	}
	@keyframes ap-drop {
		0%,
		100% {
			transform: translateY(0);
			opacity: 0.95;
		}
		50% {
			transform: translateY(-3px);
			opacity: 0.45;
		}
	}
	.ap-smoke {
		transform-box: fill-box;
		transform-origin: center;
		animation: ap-smoke 2.1s ease-out infinite;
	}
	@keyframes ap-smoke {
		0% {
			transform: translate(0, 0) scale(0.4);
			opacity: 0;
		}
		20% {
			opacity: 0.85;
		}
		100% {
			transform: translate(3px, -10px) scale(2);
			opacity: 0;
		}
	}
	.ap-pivot.wing {
		animation: ap-wing 1.3s ease-in-out infinite alternate;
	}
	@keyframes ap-wing {
		from {
			transform: rotate(6deg);
		}
		to {
			transform: rotate(-8deg);
		}
	}
	.ap-pivot.mane {
		animation-duration: 1.9s;
		animation-direction: alternate-reverse;
	}

	@media (prefers-reduced-motion: reduce) {
		.ap,
		.ap :global(*) {
			animation: none !important;
		}
	}
</style>
