<!--
	The Hideouts tile picture: our own cartoon of a cosy den door with a neon "OPEN" sign, a couch and a holk.
	Decoration (the tile says "Hideouts" in words).
-->
<script lang="ts">
	let { size = 64 }: { size?: number } = $props();
	const uid = $props.id();
</script>

<svg class="ta hot" viewBox="0 0 64 56" width={size} height={size * 0.875} aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id="{uid}-w" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6a3a1c" /><stop offset="1" stop-color="#3a1c0c" /></linearGradient>
	</defs>
	<path d="M6 24 L32 6 L58 24 V52 H6Z" fill="url(#{uid}-w)" stroke="#1a0a04" stroke-width="2" stroke-linejoin="round" />
	<path d="M3 26 L32 5 L61 26" fill="none" stroke="#ff9a3a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
	<rect x="12" y="30" width="16" height="22" rx="2" fill="#2a1408" stroke="#1a0a04" stroke-width="1.5" />
	<circle cx="25" cy="42" r="1.4" fill="#ffd23a" />
	<rect x="33" y="29" width="20" height="13" rx="2" fill="#12040f" stroke="#ff3fd8" stroke-width="1.5" />
	<text class="ho-neon" x="43" y="38.4" text-anchor="middle" font-size="7" font-weight="900" fill="#ffe6ff" font-family="Impact, sans-serif">OPEN</text>
	<rect x="33" y="45" width="20" height="5" rx="2" fill="#a8121e" />
	<rect x="31" y="43" width="4" height="8" rx="1.5" fill="#7a0a1c" /><rect x="51" y="43" width="4" height="8" rx="1.5" fill="#7a0a1c" />
	<path d="M44 14 l9 -2" stroke="#f4ead6" stroke-width="2.4" stroke-linecap="round" /><circle cx="53.5" cy="11.8" r="1.4" fill="#ff6a2a" />
	<circle class="ho-puff" cx="55" cy="8" r="2" fill="#cfc6d8" opacity="0.7" />
</svg>

<style>
	.ho-neon {
		filter: drop-shadow(0 0 2px #ff3fd8);
		animation: ho-flick 4s infinite;
	}
	.ho-puff {
		animation: ho-puff 3s ease-out infinite;
	}
	@keyframes ho-flick {
		0%,
		90%,
		94%,
		100% {
			opacity: 1;
		}
		92% {
			opacity: 0.4;
		}
	}
	@keyframes ho-puff {
		from {
			transform: translate(0, 0);
			opacity: 0.7;
		}
		to {
			transform: translate(3px, -8px);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ho-neon,
		.ho-puff {
			animation: none;
		}
	}
</style>
