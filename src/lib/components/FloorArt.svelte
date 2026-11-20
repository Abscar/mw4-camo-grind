<!--
	Little casino props for BurgiCasino's floor (2026-11-20, the user: "lots of dopamine and fun things on
	the screen"): a burger coin, a casino chip in any colour, a die, a playing card, a crown for the
	leaderboard's winner and a twinkle. Our own chunky cartoons in the style of the casino's tile pictures
	(CasinoTabArt / SlotSymbol). Always decorative (aria-hidden): the page says everything in words.
-->
<script module lang="ts">
	export type FloorProp = 'coin' | 'chip' | 'dice' | 'card' | 'crown' | 'sparkle';
</script>

<script lang="ts">
	let { kind, size = 40, tint = '#d8263a', class: cls = '' }: { kind: FloorProp; size?: number; tint?: string; class?: string } = $props();
	const uid = $props.id();
	const u = `fa-${uid}`;
	const O = '#2a1408';
	/** A small burger centred on (x, y), about 14 wide at s = 1. */
	const burger = (x: number, y: number, s = 1) =>
		`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6.4 -0.6 q0 -6 6.4 -6 q6.4 0 6.4 6 z" fill="#f0a24a" stroke="${O}" stroke-width="1.1"/><circle cx="-2.6" cy="-3.6" r=".6" fill="#fff3d0"/><circle cx="1" cy="-4.6" r=".6" fill="#fff3d0"/><circle cx="3.4" cy="-2.8" r=".6" fill="#fff3d0"/><path d="M-7 -.4 h14 l-1.4 1.8 l-1.6 -1 l-1.8 1.2 l-1.8 -1.2 l-1.8 1.2 l-1.8 -1.2 l-1.6 1 z" fill="#4fb23a"/><rect x="-6.6" y="1.2" width="13.2" height="2.6" rx="1.1" fill="#6b3a1c" stroke="${O}" stroke-width=".8"/><path d="M-6.2 4.4 h12.4 q0 3.2 -3.2 3.2 h-6 q-3.2 0 -3.2 -3.2 z" fill="#f0a24a" stroke="${O}" stroke-width="1.1"/></g>`;
</script>

<svg class="fa {cls}" data-prop={kind} viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id="{u}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6b0" /><stop offset=".45" stop-color="#ffc928" /><stop offset="1" stop-color="#b86e00" /></linearGradient>
		<radialGradient id="{u}-g2" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffe680" /><stop offset=".7" stop-color="#f0a800" /><stop offset="1" stop-color="#c47a00" /></radialGradient>
		<radialGradient id="{u}-c" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".35" /><stop offset=".6" stop-color="#fff" stop-opacity="0" /></radialGradient>
	</defs>
	{#if kind === 'coin'}
		<circle cx="20" cy="20" r="18" fill="url(#{u}-g)" stroke="#7a4a00" stroke-width="1.6" />
		<circle cx="20" cy="20" r="15.4" fill="none" stroke="#fff3b0" stroke-width="1.1" stroke-dasharray="2 2.2" opacity=".85" />
		<circle cx="20" cy="20" r="12.6" fill="url(#{u}-g2)" stroke="#a86a00" stroke-width="1" />
		{@html burger(20, 20.4, 0.95)}
		<path d="M9 13 q3 -5 9 -6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6" />
	{:else if kind === 'chip'}
		<circle cx="20" cy="20" r="18" fill={tint} stroke={O} stroke-width="1.4" />
		<circle cx="20" cy="20" r="15.6" fill="none" stroke="#fff" stroke-width="4.2" stroke-dasharray="5.2 7.05" />
		<circle cx="20" cy="20" r="11" fill={tint} stroke="#fff" stroke-width="1" stroke-dasharray="1.6 1.6" />
		<circle cx="20" cy="20" r="18" fill="url(#{u}-c)" />
		{@html burger(20, 20.4, 0.7)}
	{:else if kind === 'dice'}
		<rect x="4" y="4" width="32" height="32" rx="7" fill="#fffaf0" stroke={O} stroke-width="1.6" />
		<path d="M8 8 h24" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8" />
		<rect x="4" y="27" width="32" height="9" rx="5" fill="#000" opacity=".08" />
		{#each [[12, 12], [28, 12], [20, 20], [12, 28], [28, 28]] as [x, y] (`${x}-${y}`)}<circle cx={x} cy={y} r="3" fill={x === 20 ? '#d8263a' : '#1a1a1a'} />{/each}
	{:else if kind === 'card'}
		<rect x="8" y="3" width="24" height="34" rx="3.4" fill="#fffaf0" stroke={O} stroke-width="1.5" />
		<text x="12" y="13" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="8" fill="#d8263a">A</text>
		<path d="M20 29 c-6 -4.6 -7.4 -7.6 -7.4 -10 a3.8 3.8 0 0 1 7.4 -1.3 a3.8 3.8 0 0 1 7.4 1.3 c0 2.4 -1.4 5.4 -7.4 10 z" fill="#d8263a" stroke="#7a0d14" stroke-width=".8" />
	{:else if kind === 'crown'}
		<path d="M5 30 L3 11 L13 19 L20 6 L27 19 L37 11 L35 30 Z" fill="url(#{u}-g)" stroke="#7a4a00" stroke-width="1.6" stroke-linejoin="round" />
		<rect x="5" y="29" width="30" height="6" rx="2" fill="url(#{u}-g2)" stroke="#7a4a00" stroke-width="1.4" />
		<circle cx="20" cy="22" r="3" fill="#e0245e" stroke="#7a0d14" stroke-width=".8" />
		<circle cx="11.6" cy="24.4" r="2" fill="#2de2e6" stroke="#0a5a5c" stroke-width=".6" />
		<circle cx="28.4" cy="24.4" r="2" fill="#7dff6a" stroke="#1f6a18" stroke-width=".6" />
		{#each [3, 20, 37] as x, i (x)}<circle cx={x} cy={i === 1 ? 6 : 11} r="2.2" fill="#fffbe0" stroke="#7a4a00" stroke-width=".8" />{/each}
	{:else}
		<path d="M20 2 C21.6 14 26 18.4 38 20 C26 21.6 21.6 26 20 38 C18.4 26 14 21.6 2 20 C14 18.4 18.4 14 20 2 Z" fill={tint} />
		<circle cx="20" cy="20" r="3.4" fill="#fff" />
	{/if}
</svg>

<style>
	.fa {
		display: block;
		overflow: visible;
	}
</style>
