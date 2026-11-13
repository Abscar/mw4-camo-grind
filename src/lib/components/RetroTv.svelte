<!--
	The old TV in the Abscar header (the user's ask, 2026-11-10): a wood-cabinet CRT with rabbit-ear
	antennas playing classic CoD4 / MW2 / MW3 montages (data/montages.ts) through YouTube's
	privacy-enhanced embed, one after the other, looping like a TV channel.
	- It switches itself on, muted, when the page opens (the user's pick), always to one of the
	  favourite's (ZzirGrizZ) montages. Knobs: channel down / up, sound, power. The red LED shows the
	  channel; the plate under the screen whose montage it is.
	- While muted it pauses when scrolled out of view or in a hidden tab (saves mobile data) and
	  carries on when it's back. With sound on it keeps playing (you may be listening). The player
	  only loads once the TV has been on screen (phones: below the fold), never while it's hidden
	  (the other themes).
	- Off stays off on this device (`mw4-camo-grind:tv`). No autoplay with reduced motion or data saver.
	- "Pause animations" (the header's pause button, motion.svelte.ts) switches it off without
	  remembering that, and back on when you press play; it doesn't switch on by itself while paused.
	  A knob pressed while paused still plays (you asked for it).
	- The offline file (file://) can't play YouTube embeds: "No signal" + a "Watch on YouTube" link.
	- Nothing is drawn over the playing video (YouTube's embed rules): static, the channel OSD and the
	  warm-up flash only show while the video is hidden.
	Channel changes make a new <iframe> (changing `src` would add browser history entries).
	- Breaking news (2026-11-13, the user's pick): when there's a fresh nerf / buff headline
	  (news-codec.ts `breakingNews`: the newest, at most 14 days old, not shown on this device yet),
	  the TV drops the montage for "CH 00": our own news-studio screen with a red BREAKING NEWS bar,
	  the headline, source + time and a ticker. The screen links to the article; after 15 s (or ×,
	  or a channel knob) the montage comes back. Once per headline per device (`mw4-camo-grind:tv-news`);
	  only while the TV is on and on screen, so nobody misses it below the fold. The player is
	  removed meanwhile, so nothing is drawn over a playing video.
-->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { OFFLINE_FILE } from '#lib/browser.ts';
	import { FAVOURITE, MONTAGES } from '#lib/data/montages.ts';
	import { t } from '#lib/i18n/en.ts';
	import { motion } from '#lib/motion.svelte.ts';
	import { breakingNews, type Headline } from '#lib/news-codec.ts';
	import { news, timeAgo } from '#lib/news.svelte.ts';
	import TvGames from '#lib/components/TvGames.svelte';
	import {
		CAPTIONS_OFF,
		LISTENING,
		PLAYING,
		YT_ORIGIN,
		command,
		embedUrl,
		readPlayerMessage,
		watchUrl,
		type PlayerCommand
	} from '#lib/youtube.ts';

	const STORE_KEY = 'mw4-camo-grind:tv';
	const IDS = MONTAGES.map((m) => m.id);
	const N = IDS.length;
	/** Flipping through channels quickly only loads the one you stop on. */
	const TUNE_MS = 350;
	/** If the player never says "playing" (autoplay blocked, messages lost), show it anyway. */
	const REVEAL_MS = 2600;
	/** Which breaking-news headline this device has shown (its link), and for how long it stays on. */
	const NEWS_KEY = 'mw4-camo-grind:tv-news';
	const NEWS_MS = 15_000;

	/** The breaking-news headline on screen now, or null (the montage). */
	let newsItem = $state<Headline | null>(null);
	let newsTimer: ReturnType<typeof setTimeout> | undefined;

	let mounted = $state(false);
	let power = $state(false);
	let channel = $state(0);
	/** Static on screen while a channel loads; the video is hidden meanwhile. */
	let tuning = $state(true);
	let src = $state<string | null>(null);
	let frameKey = $state(0);
	let soundOn = $state(false);
	/** False in the offline file, without internet, or when no montage would play. */
	let signal = $state(true);
	let phase = $state<'idle' | 'warm' | 'cool'>('idle');
	let playerState = $state(-1);
	/**
	 * Laid out at all? The TV is Abscar-only (display: none in the other themes): no player is made
	 * while it's hidden, so nothing loads or plays behind another theme.
	 */
	let shown = $state(false);
	/** Been on screen yet? On phones the TV starts below the fold: its player loads when you get there. */
	let seen = $state(false);
	let inView = $state(true);
	let pageVisible = $state(true);

	let frame: HTMLIFrameElement | undefined = $state();
	let root: HTMLDivElement | undefined = $state();
	let antenna: SVGSVGElement | undefined = $state();

	let reduced = false;
	let apiReady = false;
	/** A channel change is waiting: ignore what the old player says about its video. */
	let pending = false;
	let pausedByUs = false;
	/** Off (or kept off) because animations are paused: comes back on when they play again. */
	let offByStill = false;
	let errors = 0;
	/** Right after we (un)mute, the player may still report the old setting for a moment. */
	let ignoreMutedUntil = 0;
	/** The video the player is on, and the last one whose automatic captions were switched off. */
	let playingId: string | null = null;
	let captionsOffFor: string | null = null;
	let tuneTimer: ReturnType<typeof setTimeout> | undefined;
	let revealTimer: ReturnType<typeof setTimeout> | undefined;
	let phaseTimer: ReturnType<typeof setTimeout> | undefined;
	let offTimer: ReturnType<typeof setTimeout> | undefined;
	let handshake: ReturnType<typeof setInterval> | undefined;

	const current = $derived(MONTAGES[channel]);
	const pad = (n: number) => String(n).padStart(2, '0');

	function saveOn(on: boolean) {
		try {
			if (on) localStorage.removeItem(STORE_KEY);
			else localStorage.setItem(STORE_KEY, 'off');
		} catch {
			// private mode / full storage: it just won't remember
		}
	}

	function send(func: PlayerCommand) {
		frame?.contentWindow?.postMessage(command(func), YT_ORIGIN);
	}

	function flash(p: 'warm' | 'cool') {
		if (reduced) return;
		phase = p;
		clearTimeout(phaseTimer);
		phaseTimer = setTimeout(() => (phase = 'idle'), 650);
	}

	function wiggle() {
		if (reduced || !antenna) return;
		antenna.animate(
			[
				{ transform: 'rotate(0deg)' },
				{ transform: 'rotate(-3deg)' },
				{ transform: 'rotate(2.5deg)' },
				{ transform: 'rotate(-1deg)' },
				{ transform: 'rotate(0deg)' }
			],
			{ duration: 520, easing: 'ease-out' }
		);
	}

	/** Where the TV is: laid out at all (`shown`), on screen now (`inView`), ever on screen (`seen`). */
	function placed(width: number, onScreen: boolean) {
		const nowShown = width > 0;
		if (nowShown && !shown) {
			// (back) in view of a theme that shows it: a fresh player is made, static until it plays
			tuning = true;
			apiReady = false;
			pausedByUs = false;
			playerState = -1;
		}
		shown = nowShown;
		inView = nowShown && onScreen;
		if (inView) seen = true;
	}

	/** Measured directly too, so a lost first observer report can't leave the TV stuck on static. */
	function measure() {
		if (!root) return;
		const r = root.getBoundingClientRect();
		placed(r.width, r.bottom > 0 && r.top < innerHeight);
	}

	/** Show static, then load the player for `ch` (after `delay`, so fast flipping loads only the last). */
	function tuneTo(ch: number, delay = TUNE_MS) {
		// a channel knob during the news goes back to the montages
		clearTimeout(newsTimer);
		newsItem = null;
		channel = ((ch % N) + N) % N;
		tuning = true;
		pending = true;
		clearTimeout(tuneTimer);
		clearTimeout(revealTimer);
		if (!signal) return;
		tuneTimer = setTimeout(() => {
			measure();
			apiReady = false;
			pausedByUs = false;
			playerState = -1;
			src = embedUrl(IDS, channel, { muted: !soundOn, origin: location.origin });
			frameKey++;
		}, delay);
	}

	function turnOn(ch = channel) {
		clearTimeout(offTimer);
		power = true;
		saveOn(true);
		flash('warm');
		errors = 0;
		tuneTo(ch, reduced ? 0 : 450);
	}

	/** `remember`: a tap on the power knob (stays off on this device); not when pausing animations. */
	function turnOff(remember = true) {
		if (remember) {
			saveOn(false);
			offByStill = false;
		}
		clearTimeout(tuneTimer);
		clearTimeout(revealTimer);
		clearTimeout(newsTimer);
		clearInterval(handshake);
		src = null;
		newsItem = null;
		soundOn = false;
		tuning = true;
		flash('cool');
		// the picture collapses to a dot first, then the set goes dark
		offTimer = setTimeout(() => (power = false), reduced ? 0 : 400);
	}

	function flip(step: number) {
		wiggle();
		if (!power) turnOn(channel + step);
		else tuneTo(channel + step);
	}

	function toggleSound() {
		soundOn = !soundOn;
		ignoreMutedUntil = Date.now() + 1500;
		if (!power) return turnOn();
		if (!src) return;
		if (apiReady) {
			send(soundOn ? 'unMute' : 'mute');
			if (soundOn) send('playVideo');
		} else {
			// the player isn't answering: reload this channel with the new sound setting
			tuneTo(channel, 0);
		}
	}

	function onFrameLoad() {
		pending = false;
		clearInterval(handshake);
		let tries = 0;
		frame?.contentWindow?.postMessage(LISTENING, YT_ORIGIN);
		handshake = setInterval(() => {
			if (apiReady || ++tries > 40) return clearInterval(handshake);
			frame?.contentWindow?.postMessage(LISTENING, YT_ORIGIN);
		}, 250);
		clearTimeout(revealTimer);
		revealTimer = setTimeout(() => (tuning = false), REVEAL_MS);
	}

	/** A montage that won't play (removed, blocked): static for a moment, then the next channel. */
	function skipBroken() {
		errors++;
		if (errors >= N) {
			signal = false;
			src = null;
			return;
		}
		tuneTo(channel + 1, 900);
	}

	function onMessage(e: MessageEvent) {
		if (e.origin !== YT_ORIGIN || !frame || e.source !== frame.contentWindow) return;
		const news = readPlayerMessage(e.data);
		if (!news) return;
		apiReady = true;
		if (news.error !== undefined) {
			if (!pending) skipBroken(); // (not when it's the old channel's player, mid channel change)
			return;
		}
		if (news.videoId) playingId = news.videoId;
		if (news.state !== undefined) {
			playerState = news.state;
			if (news.state === PLAYING) {
				tuning = false;
				errors = 0;
				clearTimeout(revealTimer);
				// once per video: the captions module is loaded by the time it plays
				if (playingId && playingId !== captionsOffFor) {
					frame.contentWindow?.postMessage(CAPTIONS_OFF, YT_ORIGIN);
					captionsOffFor = playingId;
				}
			}
		}
		// follows YouTube's own mute button too
		if (news.muted !== undefined && Date.now() > ignoreMutedUntil) soundOn = !news.muted;
		if (news.videoId && !pending) {
			const i = IDS.indexOf(news.videoId);
			if (i >= 0) channel = i; // the player moved on to the next montage by itself
		}
	}

	/** Drop the montage for the news screen (the player goes, so nothing is drawn over a playing video). */
	function showNews(h: Headline) {
		try {
			localStorage.setItem(NEWS_KEY, h.url);
		} catch {
			// not remembered: it may show once more on the next visit
		}
		clearTimeout(tuneTimer);
		clearTimeout(revealTimer);
		clearInterval(handshake);
		src = null;
		pending = false;
		tuning = false;
		newsItem = h;
		flash('warm');
		clearTimeout(newsTimer);
		newsTimer = setTimeout(endNews, NEWS_MS);
	}

	/** Back to the montage it was on. */
	function endNews() {
		clearTimeout(newsTimer);
		if (!newsItem) return;
		newsItem = null;
		if (power) tuneTo(channel, 0);
	}

	// breaking news: a fresh nerf / buff headline interrupts once, while the TV is on and on screen
	$effect(() => {
		const patches = news.patches;
		if (!mounted || !power || !inView || newsItem) return;
		untrack(() => {
			let shownUrl: string | null = null;
			try {
				shownUrl = localStorage.getItem(NEWS_KEY);
			} catch {
				// no storage: treat as not shown
			}
			const h = breakingNews(patches, Date.now(), shownUrl);
			if (h) showNews(h);
		});
	});

	// muted and out of sight (scrolled away, other tab): pause; back in sight: carry on
	$effect(() => {
		const away = !inView || !pageVisible;
		if (away && !soundOn && playerState === PLAYING) {
			send('pauseVideo');
			pausedByUs = true;
		} else if (!away && pausedByUs) {
			send('playVideo');
			pausedByUs = false;
		}
	});

	// animations paused: off (not remembered); playing again: back on if pausing switched it off
	$effect(() => {
		const still = motion.still;
		if (!mounted) return;
		untrack(() => {
			if (still && power) {
				offByStill = true;
				turnOff(false);
			} else if (!still && offByStill) {
				offByStill = false;
				if (!power) turnOn();
			}
		});
	});

	onMount(() => {
		mounted = true;
		motion.load();
		reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
		signal = !OFFLINE_FILE && navigator.onLine;
		// it always switches on to one of the favourite's montages (then plays on in list order)
		const favourites = MONTAGES.flatMap((m, i) => (m.by === FAVOURITE ? [i] : []));
		const pool = favourites.length > 0 ? favourites : IDS.map((_, i) => i);
		channel = pool[Math.floor(Math.random() * pool.length)];
		let wasOff = false;
		try {
			wasOff = localStorage.getItem(STORE_KEY) === 'off';
		} catch {
			// no storage: start as if new
		}
		if (!wasOff && !reduced && !saveData) {
			if (motion.still) offByStill = true;
			else turnOn(channel);
		}

		const onVisibility = () => (pageVisible = document.visibilityState === 'visible');
		const onOnline = () => {
			if (OFFLINE_FILE || signal) return;
			signal = true;
			errors = 0;
			if (power) tuneTo(channel, 0);
		};
		const observer = new IntersectionObserver(([entry]) =>
			placed(entry.boundingClientRect.width, entry.isIntersecting)
		);
		if (root) observer.observe(root);
		measure();
		window.addEventListener('message', onMessage);
		window.addEventListener('online', onOnline);
		document.addEventListener('visibilitychange', onVisibility);
		return () => {
			observer.disconnect();
			window.removeEventListener('message', onMessage);
			window.removeEventListener('online', onOnline);
			document.removeEventListener('visibilitychange', onVisibility);
			for (const timer of [tuneTimer, revealTimer, phaseTimer, offTimer, newsTimer]) clearTimeout(timer);
			clearInterval(handshake);
		};
	});
</script>

<div class="retro-tv" bind:this={root} role="group" aria-label={t.tv.label}>
	<svg class="tv-antenna" bind:this={antenna} viewBox="0 0 160 54" aria-hidden="true">
		<g stroke-linecap="round">
			<path d="M74 46 L22 6" stroke="#5d6369" stroke-width="3.4" />
			<path d="M74 46 L22 6" stroke="#e9edf1" stroke-width="1.2" transform="translate(-0.6 -0.8)" />
			<path d="M86 46 L140 10" stroke="#5d6369" stroke-width="3.4" />
			<path d="M86 46 L140 10" stroke="#e9edf1" stroke-width="1.2" transform="translate(0.6 -0.8)" />
		</g>
		<circle cx="22" cy="6" r="3.6" fill="#c9ced3" stroke="#4a4f54" stroke-width="1" />
		<circle cx="140" cy="10" r="3.6" fill="#c9ced3" stroke="#4a4f54" stroke-width="1" />
		<path d="M54 54 C56 38 104 38 106 54 Z" fill="#1d1813" stroke="#0b0907" stroke-width="1.2" />
		<path d="M62 47 C70 41 86 40 96 44" fill="none" stroke="rgb(255 230 200 / 0.28)" stroke-width="1.6" stroke-linecap="round" />
	</svg>

	<div class="tv-cabinet">
		<div class="tv-front">
			<div class="tv-glass">
				{#if power && !newsItem && (tuning || !signal || !src)}
					<div class="tv-static" aria-hidden="true"></div>
				{/if}
				{#if power && signal && src && shown && seen}
					{#key frameKey}
						<iframe
							bind:this={frame}
							class="tv-video"
							class:tv-video-hidden={tuning}
							{src}
							title={t.tv.frame}
							allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
							referrerpolicy="strict-origin-when-cross-origin"
							onload={onFrameLoad}
						></iframe>
					{/key}
				{/if}
				{#if power && !newsItem && (tuning || !signal)}
					<div class="tv-osd" aria-hidden="true">
						<span class="tv-osd-ch">{t.tv.channel(channel + 1)}</span>
						{#if !signal}<span class="tv-osd-msg">{t.tv.noSignal}</span>{/if}
					</div>
				{/if}
				{#if power && newsItem}
					{@const more = news.patches.filter((p) => p.url !== newsItem?.url).slice(0, 3)}
					<!-- CH 00: the breaking-news screen (our own studio look); tap = the article -->
					<a
						class="tv-news"
						href={newsItem.url}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="{t.tv.newsOpen(newsItem.title)} ({t.news.newTab})"
					>
						<span class="tvn-top" aria-hidden="true">
							<span class="tvn-live"><i></i>{t.tv.live}</span>
							<span class="tvn-ch">{t.tv.newsChannel}</span>
						</span>
						<span class="tvn-banner" aria-hidden="true">{t.tv.breaking}</span>
						<span class="tvn-headline" aria-hidden="true">{newsItem.title}</span>
						<span class="tvn-meta" aria-hidden="true"
							>{newsItem.source}{#if news.now}{' · '}{timeAgo(newsItem.date, news.now)}{/if}</span
						>
						<span class="tvn-ticker" aria-hidden="true"
							><span class="tvn-crawl"
								>{t.tv.newsDesk}{#each more as p (p.url)}{'  ◆  '}{p.title}{:else}{'  ◆  '}{newsItem.title}{/each}</span
							></span
						>
						<span class="tvn-timer" aria-hidden="true"></span>
					</a>
					<button type="button" class="tvn-back" aria-label={t.tv.newsBack} title={t.tv.newsBack} onclick={endNews}>
						<span aria-hidden="true"
							><svg viewBox="0 0 16 16"
								><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" /></svg
							></span
						>
					</button>
				{/if}
				{#if power && !newsItem && !signal && OFFLINE_FILE}
					<a class="tv-yt" href={watchUrl(current.id)} target="_blank" rel="noopener noreferrer"
						>{t.tv.watchOnYouTube}<span class="sr-only"> ({t.news.newTab})</span></a
					>
				{/if}
				{#if !power}
					<button type="button" class="tv-screen-btn" onclick={() => turnOn()}>
						<span class="tv-glare" aria-hidden="true"></span>
						<span class="tv-hint" class:tv-hint-show={mounted}>{t.tv.watch}</span>
					</button>
				{/if}
				<div class="tv-flash" data-phase={phase} aria-hidden="true"></div>
			</div>
			<p class="tv-plate" title={power ? (newsItem ? newsItem.title : `${current.by}: ${current.title}`) : undefined}>
				{#if power && newsItem}
					<span class="tv-plate-author tvn-plate">{t.tv.breaking}</span>
					<span class="tv-plate-title">{newsItem.source}</span>
				{:else if power}
					<span class="tv-plate-author">{current.by}</span>
					<span class="tv-plate-title">{current.name}</span>
				{:else}
					<span class="tv-plate-brand">{t.tv.brand}</span>
				{/if}
			</p>
		</div>

		<div class="tv-controls">
			<span class="tv-grille" aria-hidden="true"></span>
			<span class="tv-led" class:tv-led-on={power} aria-hidden="true">{power ? (newsItem ? '00' : pad(channel + 1)) : '88'}</span>
			<button type="button" class="tv-knob" aria-label={t.tv.prev} title={t.tv.prev} onclick={() => flip(-1)}>
				<span
					><svg viewBox="0 0 16 16" aria-hidden="true"
						><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg
					></span
				>
			</button>
			<button type="button" class="tv-knob" aria-label={t.tv.next} title={t.tv.next} onclick={() => flip(1)}>
				<span
					><svg viewBox="0 0 16 16" aria-hidden="true"
						><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg
					></span
				>
			</button>
			<button
				type="button"
				class="tv-knob"
				aria-label={t.tv.sound}
				aria-pressed={power && soundOn}
				title={t.tv.sound}
				onclick={toggleSound}
			>
				<span
					><svg viewBox="0 0 16 16" aria-hidden="true">
						<path d="M2 6h2.6L8 3.2v9.6L4.6 10H2z" fill="currentColor" />
						<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
							{#if power && soundOn}
								<path d="M10.4 5.8a3 3 0 0 1 0 4.4" />
								<path d="M12.4 4a5.6 5.6 0 0 1 0 8" />
							{:else}
								<path d="M10.5 6l4 4M14.5 6l-4 4" />
							{/if}
						</g>
					</svg></span
				>
			</button>
			<button
				type="button"
				class="tv-knob tv-power"
				aria-label={t.tv.power}
				aria-pressed={power}
				title={t.tv.power}
				onclick={() => (power ? turnOff() : turnOn())}
			>
				<span
					><svg viewBox="0 0 16 16" aria-hidden="true"
						><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
							><path d="M8 2.2v5.2" /><path d="M4.6 4.6a5 5 0 1 0 6.8 0" /></g
						></svg
					><i class="tv-pled" class:tv-pled-on={power}></i></span
				>
			</button>
		</div>
	</div>
	<div class="tv-feet" aria-hidden="true"><i></i><i></i></div>
	<!-- a PS3, games and cases on the floor in front of it (the user's ask, 2026-11-11) -->
	<TvGames on={power} />
</div>

<style>
	/* a definite width (not a % of an auto-sized flex item), so the size never depends on the plate text */
	.retro-tv {
		width: 304px;
		max-width: 100%;
		text-shadow: none;
		user-select: none;
	}

	/* rabbit ears: the dome sits on the cabinet's top edge */
	.tv-antenna {
		display: block;
		width: 52%;
		height: auto;
		margin: 0 auto -5px;
		overflow: visible;
		transform-origin: 50% 100%;
		filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.55));
	}

	/* walnut cabinet with a little grain */
	.tv-cabinet {
		position: relative;
		padding: 9px 9px 5px;
		border-radius: 18px;
		background:
			repeating-linear-gradient(93deg, rgb(0 0 0 / 0.08) 0 1px, transparent 1px 5px),
			repeating-linear-gradient(87deg, rgb(255 214 160 / 0.06) 0 2px, transparent 2px 13px),
			radial-gradient(ellipse 60% 30% at 30% 18%, rgb(255 205 150 / 0.12), transparent),
			linear-gradient(180deg, #7b4a27 0%, #5b3418 48%, #43250f 100%);
		box-shadow:
			inset 0 1.5px 0 rgb(255 226 188 / 0.36),
			inset 0 -3px 0 rgb(0 0 0 / 0.38),
			inset 0 0 0 1px rgb(0 0 0 / 0.45),
			0 0 0 1px rgb(0 0 0 / 0.6),
			0 14px 28px rgb(0 0 0 / 0.62);
	}

	.tv-front {
		padding: 5px 5px 0;
		border-radius: 13px;
		background: linear-gradient(180deg, #1e1a16, #110f0c);
		box-shadow:
			inset 0 0 0 1px rgb(0 0 0 / 0.75),
			inset 0 2px 5px rgb(0 0 0 / 0.6),
			0 1px 0 rgb(255 222 182 / 0.16);
	}

	/* the picture tube: 4:3, the video fills it but for a thin dark rim */
	.tv-glass {
		position: relative;
		aspect-ratio: 276 / 209;
		overflow: hidden;
		border-radius: 14px / 17px;
		background: radial-gradient(ellipse at 50% 42%, #1b211d, #060807 72%);
		box-shadow:
			inset 0 0 0 2px #000,
			inset 0 0 24px 6px rgb(0 0 0 / 0.95);
		isolation: isolate;
	}
	/* 268 × 201 px at full size: YouTube asks for embeds of at least 200 × 200 */
	.tv-video {
		position: absolute;
		inset: 4px;
		width: calc(100% - 8px);
		height: calc(100% - 8px);
		border: 0;
		border-radius: 6px;
		background: #000;
		transition: opacity 0.18s;
	}
	.tv-video-hidden {
		opacity: 0;
	}

	/* snow: one noise tile, jumped around 12 times a second, plus a slow rolling bar */
	.tv-static {
		position: absolute;
		inset: 0;
		background-color: #858585;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='1' stitchTiles='stitch'/%3E%3CfeColorMatrix values='2.4 0 0 0 -0.7 2.4 0 0 0 -0.7 2.4 0 0 0 -0.7 0 0 0 0 1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
		background-size: 240px 180px;
		animation: tv-snow 0.5s steps(1) infinite;
	}
	.tv-static::after {
		content: '';
		position: absolute;
		inset: -30% 0 auto;
		height: 30%;
		background: linear-gradient(180deg, transparent, rgb(255 255 255 / 0.16) 45%, rgb(0 0 0 / 0.12) 70%, transparent);
		animation: tv-roll 2.4s linear infinite;
	}
	@keyframes tv-snow {
		0% {
			background-position: 0 0;
		}
		17% {
			background-position: -61px 37px;
		}
		33% {
			background-position: 83px -19px;
		}
		50% {
			background-position: -27px -71px;
		}
		67% {
			background-position: 47px 91px;
		}
		83% {
			background-position: -103px 13px;
		}
	}
	@keyframes tv-roll {
		to {
			transform: translateY(440%);
		}
	}

	/* on-screen display while tuning: green channel number, "No signal" */
	.tv-osd {
		position: absolute;
		inset: 0;
		pointer-events: none;
		font-family: var(--font-hud);
		font-weight: 700;
		color: #7dff5a;
		text-shadow:
			0 0 6px rgb(110 255 80 / 0.8),
			0 1px 0 #000;
	}
	.tv-osd-ch {
		position: absolute;
		top: 12px;
		right: 16px;
		font-size: 20px;
		letter-spacing: 0.06em;
	}
	.tv-osd-msg {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-size: 17px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}
	.tv-yt {
		position: absolute;
		left: 50%;
		bottom: 14px;
		transform: translateX(-50%);
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 14px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.78);
		color: #fff;
		font: 700 12.5px/1 var(--font-head);
		white-space: nowrap;
	}

	/* CH 00, breaking news: a navy studio with a faint grid, red BREAKING NEWS bar, white headline box,
	   source line, yellow ticker and a red bar that runs out while it's on */
	.tv-news {
		position: absolute;
		inset: 4px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-radius: 6px;
		color: #fff;
		text-decoration: none;
		background:
			repeating-linear-gradient(0deg, rgb(120 170 255 / 0.07) 0 1px, transparent 1px 16px),
			repeating-linear-gradient(90deg, rgb(120 170 255 / 0.07) 0 1px, transparent 1px 16px),
			radial-gradient(ellipse 80% 60% at 28% 18%, #2a4f93, #0b1834 62%, #050a18);
		animation: tvn-in 0.35s ease-out;
	}
	/* scanlines + a soft vignette, like the rest of the tube */
	.tv-news::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			repeating-linear-gradient(0deg, rgb(0 0 0 / 0.16) 0 1px, transparent 1px 3px),
			radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.55));
	}
	.tv-news:focus-visible {
		outline: 2px solid #ffe14a;
		outline-offset: -3px;
	}
	.tvn-top {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 46px 0 9px;
		font: 700 11px/1 var(--font-hud);
		letter-spacing: 0.08em;
	}
	.tvn-live {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 3px 7px 3px 6px;
		border-radius: 3px;
		background: #d4111b;
		text-transform: uppercase;
		box-shadow: 0 0 8px rgb(255 30 40 / 0.6);
	}
	.tvn-live i {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #fff;
		animation: tvn-blink 1s steps(1) infinite;
	}
	.tvn-ch {
		color: #7dff5a;
		text-shadow: 0 0 6px rgb(110 255 80 / 0.8);
	}
	.tvn-banner {
		align-self: flex-start;
		margin-top: auto;
		padding: 5px 18px 4px 9px;
		clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
		background: linear-gradient(180deg, #ff2b33, #b20b14);
		font: 800 15px/1 var(--font-head);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		text-shadow: 0 1px 0 rgb(0 0 0 / 0.45);
		animation: tvn-slide 0.5s 0.15s ease-out backwards;
	}
	.tvn-headline {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
		padding: 6px 9px 5px;
		background: linear-gradient(180deg, #ffffff, #dfe6f0);
		color: #0b1424;
		font: 700 13px/1.25 var(--font-head);
		animation: tvn-slide 0.5s 0.3s ease-out backwards;
	}
	.tvn-meta {
		padding: 3px 9px;
		background: #0b1424;
		color: #ffcc33;
		font: 700 10px/1.25 var(--font-head);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.tvn-ticker {
		height: 18px;
		overflow: hidden;
		white-space: nowrap;
		background: #ffcc33;
		color: #14110d;
		font: 700 10.5px/18px var(--font-head);
	}
	.tvn-crawl {
		display: inline-block;
		padding-left: 100%;
		white-space: pre;
		animation: tvn-crawl 16s linear infinite;
	}
	.tvn-timer {
		position: absolute;
		left: 0;
		bottom: 0;
		z-index: 1;
		width: 100%;
		height: 2px;
		background: #ff2b33;
		transform-origin: left;
		animation: tvn-timer 15s linear forwards;
	}
	/* "back to the montage": a 44 px target in the screen's top-right corner */
	.tvn-back {
		position: absolute;
		top: 4px;
		right: 4px;
		z-index: 2;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		padding: 0;
		border: 0;
		background: none;
		color: #fff;
		cursor: pointer;
	}
	.tvn-back > span {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: rgb(0 0 0 / 0.55);
		box-shadow: 0 0 0 1px rgb(255 255 255 / 0.35);
	}
	.tvn-back svg {
		width: 11px;
		height: 11px;
	}
	.tvn-back:focus-visible {
		outline: 2px solid #ffe14a;
		outline-offset: -4px;
		border-radius: 50%;
	}
	.tv-plate-author.tvn-plate {
		color: #ff4a4a;
	}
	@keyframes tvn-in {
		from {
			filter: brightness(2.2) saturate(0.4);
		}
	}
	@keyframes tvn-slide {
		from {
			transform: translateX(-105%);
		}
	}
	@keyframes tvn-blink {
		50% {
			opacity: 0;
		}
	}
	@keyframes tvn-crawl {
		to {
			transform: translateX(-100%);
		}
	}
	@keyframes tvn-timer {
		to {
			transform: scaleX(0);
		}
	}

	/* switched off: dark glass with a reflection, the whole screen is an "on" button */
	.tv-screen-btn {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}
	.tv-screen-btn:focus-visible {
		outline: 2px solid #ffe14a;
		outline-offset: -4px;
		border-radius: 12px;
	}
	.tv-glare {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(128deg, transparent 18%, rgb(255 255 255 / 0.1) 26%, rgb(255 255 255 / 0.02) 38%, transparent 44%),
			radial-gradient(ellipse 70% 50% at 32% 24%, rgb(255 255 255 / 0.07), transparent 70%);
	}
	.tv-hint {
		position: relative;
		font: 700 13px/1 var(--font-head);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgb(220 230 225 / 0.55);
		opacity: 0;
		transition: opacity 0.4s 0.6s;
	}
	.tv-hint-show {
		opacity: 1;
	}

	/* CRT warm-up (a bright line opens into the picture) and switch-off (it collapses to a dot) */
	.tv-flash {
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0;
		background: radial-gradient(ellipse at center, #fff 0 34%, rgb(205 232 255 / 0.75) 58%, transparent 78%);
	}
	.tv-flash[data-phase='warm'] {
		animation: tv-warm 0.5s ease-out;
	}
	.tv-flash[data-phase='cool'] {
		animation: tv-cool 0.42s ease-in forwards;
	}
	@keyframes tv-warm {
		0% {
			opacity: 1;
			transform: scale(0.9, 0.012);
		}
		45% {
			opacity: 1;
			transform: scale(1, 0.06);
		}
		100% {
			opacity: 0;
			transform: scale(1.1, 1.1);
		}
	}
	@keyframes tv-cool {
		0% {
			opacity: 0.9;
			transform: scale(1, 1);
		}
		45% {
			opacity: 1;
			transform: scale(1, 0.012);
		}
		80% {
			opacity: 1;
			transform: scale(0.03, 0.012);
		}
		100% {
			opacity: 0;
			transform: scale(0, 0);
		}
	}

	/* the plate under the screen: who made the montage (the brand while it's off) */
	.tv-plate {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		height: 19px;
		margin: 0;
		padding: 0 8px;
		overflow: hidden;
		white-space: nowrap;
		font: 600 10.5px/1 var(--font-head);
		letter-spacing: 0.03em;
		color: #cdbda9;
	}
	.tv-plate-author {
		flex: none;
		color: #ffe14a;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.tv-plate-title {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.tv-plate-brand {
		letter-spacing: 0.32em;
		text-transform: uppercase;
		background: linear-gradient(180deg, #f2f4f6, #9aa1a8);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	/* speaker grille, red LED channel display and the knobs */
	.tv-controls {
		display: flex;
		align-items: center;
		gap: 4px;
		height: 50px;
		padding: 4px 1px 0;
	}
	.tv-grille {
		flex: 1;
		align-self: stretch;
		margin: 7px 4px 7px 3px;
		border-radius: 5px;
		background: repeating-linear-gradient(90deg, #140d08 0 2px, #6b4224 2px 5px);
		box-shadow:
			inset 0 1px 3px rgb(0 0 0 / 0.75),
			0 1px 0 rgb(255 222 182 / 0.14);
	}
	.tv-led {
		flex: none;
		width: 40px;
		height: 26px;
		border-radius: 4px;
		background: #150404;
		box-shadow:
			inset 0 1px 4px #000,
			0 1px 0 rgb(255 222 182 / 0.18);
		font: 700 17px/26px var(--font-hud);
		letter-spacing: 0.06em;
		text-align: center;
		color: rgb(255 60 45 / 0.1);
	}
	.tv-led-on {
		color: #ff3b2c;
		text-shadow: 0 0 6px rgb(255 50 35 / 0.9);
	}
	.tv-knob {
		position: relative;
		flex: none;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: none;
		color: #221a14;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}
	.tv-knob > span {
		position: relative;
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: radial-gradient(circle at 34% 28%, #ffffff, #cfd3d7 38%, #858a8f 74%, #4d5155);
		box-shadow:
			0 0 0 2px #2b1a0d,
			0 3px 4px rgb(0 0 0 / 0.6),
			inset 0 -2px 2px rgb(0 0 0 / 0.28);
		transition: transform 0.08s;
	}
	.tv-knob:hover > span {
		background: radial-gradient(circle at 34% 28%, #ffffff, #e0e3e6 38%, #959a9f 74%, #55595d);
	}
	.tv-knob:active > span {
		transform: translateY(1px) scale(0.95);
	}
	.tv-knob:focus-visible {
		outline: 2px solid #ffe14a;
		outline-offset: -1px;
	}
	.tv-knob svg {
		width: 15px;
		height: 15px;
	}
	.tv-knob[aria-pressed='true']:not(.tv-power) > span {
		box-shadow:
			0 0 0 2px #2b1a0d,
			0 0 10px 1px rgb(255 225 74 / 0.75),
			0 3px 4px rgb(0 0 0 / 0.6),
			inset 0 -2px 2px rgb(0 0 0 / 0.28);
	}
	.tv-pled {
		position: absolute;
		top: -3px;
		right: -3px;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #ff2b1c;
		box-shadow:
			0 0 0 1px #2b1a0d,
			0 0 6px #ff2b1c;
	}
	.tv-pled-on {
		background: #6dff4a;
		box-shadow:
			0 0 0 1px #2b1a0d,
			0 0 7px #6dff4a;
	}

	.tv-feet {
		display: flex;
		justify-content: space-between;
		padding: 0 36px;
	}
	.tv-feet i {
		width: 28px;
		height: 7px;
		border-radius: 0 0 7px 7px;
		background: linear-gradient(180deg, #24180f, #0d0906);
		box-shadow: 0 3px 5px rgb(0 0 0 / 0.5);
	}

	@media (prefers-reduced-motion: reduce) {
		.tv-static,
		.tv-static::after,
		.tv-news,
		.tvn-banner,
		.tvn-headline,
		.tvn-live i,
		.tvn-crawl {
			animation: none;
		}
		.tvn-crawl {
			padding-left: 9px;
		}
		.tvn-timer {
			display: none;
		}
		.tv-video,
		.tv-hint {
			transition: none;
		}
	}
</style>
