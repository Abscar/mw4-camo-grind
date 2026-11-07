/**
 * The COD headlines shown by the news box (NewsFeed) and the nerf/buff headlines shown by the
 * news buddy (NewsBuddy).
 *
 * The build bakes news.json into the page, so headlines show at once, also offline. Once the
 * page has loaded it asks for the published copy (GitHub refreshes it every hour), and again
 * whenever the tab is looked at after 10+ minutes. The offline file asks the public website.
 *
 * `now` is the viewer's clock: null until the page has loaded (so the prerendered HTML and the
 * first render match), then it ticks every minute for the "12 min ago" labels.
 */
import { onMount } from 'svelte';
import baked from '#lib/data/news.json';
import { t } from '#lib/i18n/en.ts';
import { OFFLINE_FILE } from './browser.ts';
import { readNews, type Headline, type NewsSource } from './news-codec.ts';
import { SITE_URL } from './site.ts';

/** Charlie Intel's own posts are only on X; the news box links there. */
export const CHARLIE_INTEL_X = 'https://x.com/charlieintel';

const RECHECK_MS = 10 * 60_000;
const initial = readNews(baked);

class News {
	/** The newest COD headlines (news box). */
	items = $state<Headline[]>(initial?.items ?? []);
	/** The newest nerf / buff / movement headlines (news buddy). */
	patches = $state<Headline[]>(initial?.patches ?? []);
	sources = $state<NewsSource[]>(initial?.sources ?? []);
	now = $state<Date | null>(null);
}

export const news = new News();

/** "just now", "12 min ago", "3 h ago", "yesterday" or "4 Nov". */
export function timeAgo(iso: string, now: Date): string {
	const then = new Date(iso);
	const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000);
	if (minutes < 1) return t.feed.justNow;
	if (minutes < 60) return t.feed.minutesAgo(minutes);
	if (minutes < 24 * 60) return t.feed.hoursAgo(Math.floor(minutes / 60));
	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);
	if (then.toDateString() === yesterday.toDateString()) return t.feed.yesterday;
	return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

async function refresh(): Promise<void> {
	try {
		// The page is the site's only route, so its own address is the site's base address.
		const url = new URL('news.json', OFFLINE_FILE ? SITE_URL : document.baseURI);
		const res = await fetch(url, { cache: 'no-cache' });
		if (!res.ok) return;
		const fresh = readNews(await res.json());
		if (!fresh || fresh.items.length === 0) return;
		news.items = fresh.items;
		news.patches = fresh.patches;
		if (fresh.sources.length > 0) news.sources = fresh.sources;
	} catch {
		// offline, or the file isn't published yet: keep what we have
	}
}

function start(): () => void {
	let lastCheck = 0;
	const update = () => {
		news.now = new Date();
		if (document.visibilityState === 'visible' && Date.now() - lastCheck >= RECHECK_MS) {
			lastCheck = Date.now();
			void refresh();
		}
	};
	update();
	const timer = setInterval(update, 60_000);
	document.addEventListener('visibilitychange', update);
	return () => {
		clearInterval(timer);
		document.removeEventListener('visibilitychange', update);
	};
}

let users = 0;
let stop: (() => void) | null = null;

/** Call while a component is being set up: keeps the clock and the checks running while it's on screen. */
export function useNews(): void {
	onMount(() => {
		if (users++ === 0) stop = start();
		return () => {
			if (--users === 0) {
				stop?.();
				stop = null;
			}
		};
	});
}
