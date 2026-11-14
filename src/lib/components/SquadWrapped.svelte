<!--
	Squad Wrapped (squad step 3, 2026-11-14; the user's pick): the week as a slideshow, like a music
	app's year in review. On Sundays it's this week (Monday 00:00 → now), other days last week
	(squad-fun.ts `wrappedWeek` / `wrapped`, from everyone's tick times and tracker-open minutes).
	Slides: the total, most camos, most grinded class, the Night Owl (ticks 02–06), biggest day,
	weapons maxed, most hours, the slacker, then a summary with a picture (drawn on a canvas, our own
	look) to download or share in the group chat. Tap / arrow keys / buttons to move; no autoplay.
-->
<script lang="ts">
	import { CLASSES, WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { wrapped, wrappedWeek, type Wrapped } from '#lib/squad-fun.ts';
	import Dialog from './Dialog.svelte';
	import SquadAvatar from './SquadAvatar.svelte';

	const w = t.squad.wrapped;
	const CLASS_NAME = Object.fromEntries(CLASSES.map((c) => [c.id, c.name]));

	let open = $state(false);
	let i = $state(0);
	let data = $state<Wrapped | null>(null);
	const sunday = $derived(new Date(squad.now).getDay() === 0);

	const fmtDay = (ms: number, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) => new Date(ms).toLocaleDateString('en-GB', opts);
	const range = $derived(data ? w.week(fmtDay(data.from), fmtDay(data.to - 1)) : '');
	const op = (id: string) => squad.byId(id)?.member.op;
	const nameOf = (id: string | null) => (id ? (data?.members.find((m) => m.id === id)?.name ?? '?') : '');

	type Slide = 'intro' | 'camos' | 'cls' | 'owl' | 'day' | 'maxed' | 'hours' | 'slacker' | 'end';
	const SLIDES: Slide[] = ['intro', 'camos', 'cls', 'owl', 'day', 'maxed', 'hours', 'slacker', 'end'];

	function show() {
		const { from, to } = wrappedWeek(squad.now);
		data = wrapped(Object.fromEntries(squad.entries.map((e) => [e.id, e.member])), from, to);
		i = 0;
		open = true;
	}
	const go = (step: number) => (i = Math.max(0, Math.min(SLIDES.length - 1, i + step)));

	// ----- the picture -----

	function draw(): HTMLCanvasElement | null {
		if (!data) return null;
		const c = document.createElement('canvas');
		c.width = 1080;
		c.height = 1350;
		const g = c.getContext('2d');
		if (!g) return null;
		const bg = g.createLinearGradient(0, 0, 1080, 1350);
		bg.addColorStop(0, '#2a0508');
		bg.addColorStop(0.55, '#5c0d12');
		bg.addColorStop(1, '#1a0b05');
		g.fillStyle = bg;
		g.fillRect(0, 0, 1080, 1350);
		// a few hot stripes
		g.globalAlpha = 0.18;
		for (let k = 0; k < 7; k++) {
			g.fillStyle = k % 2 ? '#ff4418' : '#e0a420';
			g.beginPath();
			g.moveTo(-200 + k * 260, 1350);
			g.lineTo(80 + k * 260, 1350);
			g.lineTo(520 + k * 260, 0);
			g.lineTo(240 + k * 260, 0);
			g.fill();
		}
		g.globalAlpha = 1;
		const font = (px: number, weight = 800) => `${weight} ${px}px Bahnschrift, "Segoe UI", system-ui, sans-serif`;
		g.textBaseline = 'alphabetic';
		g.fillStyle = '#ffe48a';
		g.font = font(96);
		g.fillText('SQUAD', 80, 190);
		g.fillStyle = '#ffffff';
		g.fillText('WRAPPED', 80, 290);
		g.font = font(40, 600);
		g.fillStyle = '#ffb8a0';
		g.fillText(range, 84, 356);
		let y = 460;
		const row = (label: string, value: string) => {
			g.font = font(30, 700);
			g.fillStyle = '#ffb8a0';
			g.fillText(label.toUpperCase(), 84, y);
			g.font = font(52);
			g.fillStyle = '#ffffff';
			let v = value;
			while (g.measureText(v).width > 912 && v.length > 4) v = v.slice(0, -2);
			if (v !== value) v = v.trimEnd() + '…';
			g.fillText(v, 84, y + 60);
			y += 138;
		};
		const d = data;
		row(w.mostCamos, d.mvps.length ? `${d.mvps.map(nameOf).join(' & ')} · ${w.camos(d.members[0].camos)}` : '—');
		row(w.topClass, d.topClass ? w.topClassLine(CLASS_NAME[d.topClass.cls] ?? d.topClass.cls, d.topClass.n) : '—');
		row(w.nightOwl, d.nightOwl ? nameOf(d.nightOwl) : '—');
		row(w.bestDay, d.bestDay ? `${nameOf(d.bestDay.id)} · ${w.bestDayLine(fmtDay(d.bestDay.day, { weekday: 'long' }), d.bestDay.n)}` : '—');
		row(w.maxed, String(d.members.reduce((n, m) => n + m.maxed.length, 0)));
		row(w.slacker, d.slacker ? nameOf(d.slacker) : '—');
		g.font = font(44);
		g.fillStyle = '#ffe48a';
		g.fillText(`${d.total} CAMOS`, 84, 1290);
		g.font = font(28, 600);
		g.fillStyle = 'rgb(255 255 255 / 0.6)';
		g.textAlign = 'right';
		g.fillText('MW4 CAMO GRIND', 996, 1290);
		return c;
	}

	async function blob(): Promise<Blob | null> {
		const c = draw();
		return c ? await new Promise((r) => c.toBlob((b) => r(b), 'image/png')) : null;
	}
	const fileName = $derived(data ? w.file(new Date(data.from).toISOString().slice(0, 10)) : 'squad-wrapped.png');

	async function download() {
		const b = await blob();
		if (!b) return;
		const url = URL.createObjectURL(b);
		const a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		document.body.append(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 5000);
	}

	const canShareFile = $derived(typeof navigator !== 'undefined' && typeof navigator.canShare === 'function');
	async function share() {
		const b = await blob();
		if (!b) return;
		const file = new File([b], fileName, { type: 'image/png' });
		try {
			if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: w.title });
			else await download();
		} catch {
			// share sheet closed
		}
	}
	const preview = $derived(open && data && SLIDES[i] === 'end' ? draw()?.toDataURL('image/png') : null);
</script>

<svelte:window
	onkeydown={(e) => {
		if (!open) return;
		if (e.key === 'ArrowRight') go(1);
		if (e.key === 'ArrowLeft') go(-1);
	}}
/>

<button type="button" class="btn wr-open" class:wr-sunday={sunday} title={w.hint} onclick={show}>
	<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M3 15V9m5 6V4m5 11v-8m4 8v-5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none" /></svg>
	{sunday ? w.openSunday : w.open}
</button>

<Dialog bind:open title={w.title} class="wr-dlg m-auto">
	{#snippet custom(titleId)}
		{#if data}
			{@const d = data}
			{@const slide = SLIDES[i]}
			<div
				class="wr"
				role="group"
				aria-roledescription="slideshow"
			>
				<div class="wr-bars" aria-hidden="true">
					{#each SLIDES as _, k (k)}<span class:on={k <= i}></span>{/each}
				</div>
				<div class="wr-head">
					<h2 id={titleId} class="font-head">{w.title}</h2>
					<p>{range}</p>
					<button type="button" class="wr-x" aria-label={w.close} onclick={() => (open = false)}
						><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" /></svg></button
					>
				</div>
				<div class="wr-body" aria-live="polite">
					<p class="sr-only">{w.slide(i + 1, SLIDES.length)}</p>
					{#if slide === 'intro'}
						<p class="wr-big font-head">{d.total}</p>
						<p class="wr-line">{d.total ? w.intro(d.total) : w.introNone}</p>
					{:else if slide === 'camos'}
						<p class="wr-kick font-head">{w.mostCamos}</p>
						<ol class="wr-list">
							{#each d.members as m, k (m.id)}
								<li class:wr-top={d.mvps.includes(m.id)}>
									<span class="num">{k + 1}</span><SquadAvatar name={m.name} op={op(m.id)} size={36} /><b>{m.name}</b><span class="num">{w.camos(m.camos)}</span>
								</li>
							{/each}
						</ol>
					{:else if slide === 'cls'}
						<p class="wr-kick font-head">{w.topClass}</p>
						<p class="wr-mid font-head">{d.topClass ? (CLASS_NAME[d.topClass.cls] ?? d.topClass.cls) : '—'}</p>
						{#if d.topClass}<p class="wr-line">{w.camos(d.topClass.n)}</p>{/if}
						<ul class="wr-small">
							{#each d.members.filter((m) => m.topClass) as m (m.id)}
								<li>{m.name}: {CLASS_NAME[m.topClass!.cls] ?? ''} ({m.topClass!.n})</li>
							{/each}
						</ul>
					{:else if slide === 'owl'}
						<p class="wr-kick font-head">{w.nightOwl}</p>
						{#if d.nightOwl}
							<SquadAvatar name={nameOf(d.nightOwl)} op={op(d.nightOwl)} size={84} />
							<p class="wr-mid font-head">{nameOf(d.nightOwl)}</p>
							<p class="wr-line">{w.nightOwlLine(d.members.find((m) => m.id === d.nightOwl)?.night ?? 0)}</p>
						{:else}
							<p class="wr-line">{w.noOwl}</p>
						{/if}
					{:else if slide === 'day'}
						<p class="wr-kick font-head">{w.bestDay}</p>
						{#if d.bestDay}
							<p class="wr-mid font-head">{nameOf(d.bestDay.id)}</p>
							<p class="wr-line">{w.bestDayLine(fmtDay(d.bestDay.day, { weekday: 'long', day: 'numeric', month: 'short' }), d.bestDay.n)}</p>
						{:else}
							<p class="wr-line">—</p>
						{/if}
					{:else if slide === 'maxed'}
						<p class="wr-kick font-head">{w.maxed}</p>
						{@const any = d.members.some((m) => m.maxed.length)}
						{#if any}
							<ul class="wr-small">
								{#each d.members.filter((m) => m.maxed.length) as m (m.id)}
									<li><b>{m.name}</b>: {m.maxed.map((id) => WEAPON_BY_ID.get(id)?.name ?? id).join(', ')}</li>
								{/each}
							</ul>
						{:else}
							<p class="wr-line">{w.maxedNone}</p>
						{/if}
					{:else if slide === 'hours'}
						<p class="wr-kick font-head">{w.hours}</p>
						<ol class="wr-list">
							{#each [...d.members].sort((a, b) => b.minutes - a.minutes) as m, k (m.id)}
								<li class:wr-top={k === 0 && m.minutes > 0}><span class="num">{k + 1}</span><b>{m.name}</b><span class="num">{t.squad.minutes(m.minutes)}</span></li>
							{/each}
						</ol>
						<p class="wr-small">{t.squad.played.hint}</p>
					{:else if slide === 'slacker'}
						<p class="wr-kick font-head">{w.slacker}</p>
						{#if d.slacker}
							<SquadAvatar name={nameOf(d.slacker)} op={op(d.slacker)} size={84} />
							<p class="wr-mid font-head wr-slack">{nameOf(d.slacker)}</p>
							<p class="wr-line">{w.slackerLine(d.members.find((m) => m.id === d.slacker)?.camos ?? 0)}</p>
						{:else}
							<p class="wr-line">{w.noSlacker}</p>
						{/if}
					{:else}
						{#if preview}<img class="wr-pic" src={preview} alt="" />{/if}
						<div class="mt-3 flex flex-wrap justify-center gap-2">
							<button type="button" class="btn btn-primary" onclick={() => void download()}>{w.download}</button>
							{#if canShareFile}<button type="button" class="btn" onclick={() => void share()}>{w.share}</button>{/if}
						</div>
					{/if}
				</div>
				<div class="wr-nav">
					<button type="button" class="btn" disabled={i === 0} onclick={() => go(-1)}>{w.prev}</button>
					{#if i < SLIDES.length - 1}
						<button type="button" class="btn btn-primary" onclick={() => go(1)}>{w.next}</button>
					{:else}
						<button type="button" class="btn" onclick={() => (open = false)}>{w.close}</button>
					{/if}
				</div>
			</div>
		{/if}
	{/snippet}
</Dialog>

<style>
	.wr-sunday {
		border-color: #e0a420;
		box-shadow: 0 0 12px rgb(224 164 32 / 0.55);
	}
	.wr-open svg {
		flex: none;
	}
	:global(dialog.wr-dlg) {
		width: min(26rem, calc(100vw - 1.5rem));
		height: fit-content;
		max-height: calc(100dvh - 1.5rem);
		padding: 0;
		border: 2px solid #e0a420;
		border-radius: 18px;
		color: #fff;
		background: linear-gradient(160deg, #2a0508, #5c0d12 55%, #1a0b05);
		box-shadow: 0 0 40px rgb(255 68 24 / 0.45);
		overflow: hidden;
	}
	.wr {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 14px 16px 16px;
		max-height: calc(100dvh - 1.5rem);
	}
	.wr-bars {
		display: flex;
		gap: 4px;
	}
	.wr-bars span {
		flex: 1;
		height: 4px;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.25);
	}
	.wr-bars span.on {
		background: #ffe48a;
	}
	.wr-head {
		position: relative;
		padding-right: 48px;
	}
	.wr-head h2 {
		font-size: 22px;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #ffe48a;
	}
	.wr-head p {
		font-size: 13px;
		color: #ffb8a0;
	}
	.wr-x {
		position: absolute;
		top: -6px;
		right: -6px;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		color: #fff;
	}
	.wr-x svg {
		width: 18px;
		height: 18px;
	}
	.wr-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		min-height: 260px;
		overflow-y: auto;
		text-align: center;
	}
	.wr-kick {
		font-size: 13px;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #ffb8a0;
	}
	.wr-big {
		margin-top: 20px;
		font-size: 96px;
		font-weight: 900;
		line-height: 1;
		color: #ffe48a;
		text-shadow: 0 4px 0 #7a1a00;
	}
	.wr-mid {
		font-size: 32px;
		font-weight: 900;
		line-height: 1.1;
		word-break: break-word;
	}
	.wr-slack {
		color: #ff5a5a;
	}
	.wr-line {
		font-size: 16px;
	}
	.wr-small {
		font-size: 13px;
		color: rgb(255 255 255 / 0.8);
	}
	.wr-list {
		display: grid;
		gap: 6px;
		width: 100%;
	}
	.wr-list li {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 10px;
		border-radius: 10px;
		background: rgb(0 0 0 / 0.3);
		text-align: left;
	}
	.wr-list li b {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.wr-top {
		outline: 2px solid #ffe48a;
	}
	.wr-pic {
		width: min(240px, 60vw);
		border-radius: 10px;
		box-shadow: 0 6px 20px rgb(0 0 0 / 0.5);
	}
	.wr-nav {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}
</style>
