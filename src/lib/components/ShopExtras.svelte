<!--
	BurgiShop things that live on the whole page (the 18-ideas pack, 2026-11-21, shop.ts):
	- your Trail (slot `trail`): leaves, burgers, smoke or a rainbow following your mouse / finger, only on your
	  own page. A small pool of absolutely placed spans (no canvas), a new piece at most every 40 ms and 12 on
	  screen at most; nothing with reduced motion or Battery saver.
	- a friend's Confetti Bomb (PRANKS `confetti`): the first time your page sees an active one, confetti rains
	  (CasinoConfetti) and a toast says who did it. Remembered per device (`mw4-camo-grind:confetti-seen`).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { owns, PRANK_BY_ID } from '#lib/shop.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import CasinoConfetti from './CasinoConfetti.svelte';

	const SEEN_KEY = 'mw4-camo-grind:confetti-seen';
	const trail = $derived.by(() => {
		const id = squad.shop?.eq.trail;
		return id && owns(squad.shop, id) ? id : null;
	});

	interface Bit {
		id: number;
		x: number;
		y: number;
		r: number;
		h: number;
	}
	let bits = $state<Bit[]>([]);
	let nextId = 1;
	let last = 0;
	const MAX = 12;
	const LIFE = 900;

	function quiet(): boolean {
		const html = document.documentElement;
		return html.hasAttribute('data-still') || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
	}

	$effect(() => {
		if (!trail) return;
		const onMove = (ev: PointerEvent) => {
			const now = performance.now();
			if (now - last < 40 || quiet()) return;
			last = now;
			const id = nextId++;
			const bit: Bit = { id, x: ev.clientX, y: ev.clientY, r: Math.round(Math.random() * 360), h: Math.round((now / 6) % 360) };
			bits = [...bits.slice(-(MAX - 1)), bit];
			setTimeout(() => (bits = bits.filter((b) => b.id !== id)), LIFE);
		};
		window.addEventListener('pointermove', onMove, { passive: true });
		return () => {
			window.removeEventListener('pointermove', onMove);
			bits = [];
		};
	});

	// a friend's Confetti Bomb: once per bomb, per device
	let confetti = $state<{ fire: () => void }>();
	$effect(() => {
		const me = squad.me;
		if (!me || !confetti) return;
		const now = squad.serverNow();
		const def = PRANK_BY_ID.get('confetti');
		if (!def) return;
		let seen: string[] = [];
		try {
			seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
			if (!Array.isArray(seen)) seen = [];
		} catch {
			seen = [];
		}
		for (const e of squad.entries) {
			for (const [pid, p] of Object.entries(e.member.shop?.pranks ?? {})) {
				if (p.k !== 'confetti' || p.to !== me.id || seen.includes(pid) || now - p.at > def.hours * 3_600_000) continue;
				seen = [...seen, pid].slice(-40);
				try {
					localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
				} catch {
					/* it may go off once more next time */
				}
				const who = e.member.name;
				setTimeout(() => {
					confetti?.fire();
					setTimeout(() => confetti?.fire(), 700);
					toast.show(t.pranks.confettiGot(who), undefined, 6000);
				}, 1200);
				return;
			}
		}
	});
</script>

<CasinoConfetti bind:this={confetti} />
{#if trail && bits.length}
	<div class="trail" data-trail={trail} aria-hidden="true">
		{#each bits as b (b.id)}
			<i style:left="{b.x}px" style:top="{b.y}px" style:--r="{b.r}deg" style:--h={b.h}></i>
		{/each}
	</div>
{/if}

<style>
	.trail {
		position: fixed;
		inset: 0;
		z-index: 70;
		pointer-events: none;
		overflow: hidden;
	}
	.trail i {
		position: absolute;
		width: 16px;
		height: 16px;
		margin: -8px 0 0 -8px;
		animation: trail-fade 0.9s ease-out forwards;
	}
	@keyframes trail-fade {
		from {
			opacity: 0.9;
			transform: rotate(var(--r)) scale(1);
		}
		to {
			opacity: 0;
			transform: translateY(18px) rotate(calc(var(--r) + 120deg)) scale(0.4);
		}
	}
	/* a little cannabis leaf (the shared leaf shape, as a mask) */
	.trail[data-trail='trail-leaves'] i {
		background: #5fe06a;
		-webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Cpath d='M20 36c-1-9 0-17 2-24 2 7 3 15 2 24zM20 36c-6-5-10-11-11-18 5 3 9 8 12 17zM20 36c6-5 10-11 11-18-5 3-9 8-12 17zM20 36c-8-1-13-5-15-9 5 0 11 3 15 8zM20 36c8-1 13-5 15-9-5 0-11 3-15 8z'/%3E%3C/svg%3E") center / contain no-repeat;
		mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Cpath d='M20 36c-1-9 0-17 2-24 2 7 3 15 2 24zM20 36c-6-5-10-11-11-18 5 3 9 8 12 17zM20 36c6-5 10-11 11-18-5 3-9 8-12 17zM20 36c-8-1-13-5-15-9 5 0 11 3 15 8zM20 36c8-1 13-5 15-9-5 0-11 3-15 8z'/%3E%3C/svg%3E") center / contain no-repeat;
		filter: drop-shadow(0 0 2px rgb(0 0 0 / 0.6));
	}
	.trail[data-trail='trail-burgers'] i {
		border-radius: 50% 50% 35% 35%;
		background:
			linear-gradient(180deg, #e0a040 0 38%, #4fb23a 38% 48%, #6b3a1c 48% 70%, #e0a040 70%);
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.6);
	}
	.trail[data-trail='trail-smoke'] i {
		width: 26px;
		height: 26px;
		margin: -13px 0 0 -13px;
		border-radius: 50%;
		background: radial-gradient(circle, rgb(235 235 245 / 0.75), rgb(200 200 215 / 0.25) 55%, transparent 72%);
		animation-name: trail-smoke;
		animation-duration: 0.9s;
	}
	@keyframes trail-smoke {
		from {
			opacity: 0.8;
			transform: scale(0.6);
		}
		to {
			opacity: 0;
			transform: translateY(-22px) scale(1.8);
		}
	}
	.trail[data-trail='trail-rainbow'] i {
		width: 12px;
		height: 12px;
		margin: -6px 0 0 -6px;
		border-radius: 50%;
		background: hsl(calc(var(--h) * 1deg) 95% 62%);
		box-shadow: 0 0 10px hsl(calc(var(--h) * 1deg) 95% 62%);
	}
	@media (prefers-reduced-motion: reduce) {
		.trail {
			display: none;
		}
	}
</style>
