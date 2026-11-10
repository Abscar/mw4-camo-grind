/**
 * Talking to YouTube's embedded player for the old TV in the header (RetroTv.svelte).
 * Pure helpers (no DOM), so Node can test them: the embed address, and the small postMessage
 * protocol the embed speaks when it's loaded with `enablejsapi=1` (the same messages YouTube's
 * own iframe_api script sends, without loading that script).
 */

/** Privacy-enhanced embeds: no YouTube cookies until the viewer interacts with the player. */
export const YT_ORIGIN = 'https://www.youtube-nocookie.com';

/** A YouTube video id: 11 characters of base64url. */
export const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** Player states reported by the embed. */
export const PLAYING = 1;
export const PAUSED = 2;
export const BUFFERING = 3;

/**
 * The embed address that starts at `ids[start]` and then plays the rest in order, looping for ever
 * (like a TV channel that never stops). With a `playlist`, the embed plays exactly that list and
 * ignores the id in the path (checked 2026-11-10, despite what YouTube's docs say), so the list
 * itself starts at `start` and wraps round.
 */
export function embedUrl(
	ids: readonly string[],
	start: number,
	opts: { muted: boolean; origin?: string }
): string {
	const n = ids.length;
	const order = Array.from({ length: n }, (_, i) => ids[(((start + i) % n) + n) % n]);
	const params = new URLSearchParams({
		autoplay: '1',
		mute: opts.muted ? '1' : '0',
		playsinline: '1',
		rel: '0',
		iv_load_policy: '3',
		enablejsapi: '1',
		playlist: order.join(','),
		loop: '1'
	});
	if (opts.origin && opts.origin !== 'null') params.set('origin', opts.origin);
	return `${YT_ORIGIN}/embed/${order[0]}?${params.toString()}`;
}

/** The normal YouTube page for a video (the offline file links there: embeds need a web address). */
export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/** What we read from the player's messages. Every field is optional: messages carry a few at a time. */
export interface PlayerNews {
	event: string;
	state?: number;
	muted?: boolean;
	videoId?: string;
	error?: number;
}

/**
 * Reads one message from the embed (a JSON string). Returns null for anything that isn't a player
 * message, so other postMessage traffic on the page is ignored.
 */
export function readPlayerMessage(data: unknown): PlayerNews | null {
	let msg: unknown = data;
	if (typeof data === 'string') {
		try {
			msg = JSON.parse(data);
		} catch {
			return null;
		}
	}
	if (!msg || typeof msg !== 'object') return null;
	const { event, info } = msg as { event?: unknown; info?: unknown };
	if (typeof event !== 'string') return null;
	const out: PlayerNews = { event };
	if (event === 'onStateChange' && typeof info === 'number') out.state = info;
	if (event === 'onError' && typeof info === 'number') out.error = info;
	if ((event === 'infoDelivery' || event === 'initialDelivery') && info && typeof info === 'object') {
		const i = info as { playerState?: unknown; muted?: unknown; videoData?: unknown };
		if (typeof i.playerState === 'number') out.state = i.playerState;
		if (typeof i.muted === 'boolean') out.muted = i.muted;
		const v = i.videoData as { video_id?: unknown } | undefined;
		if (v && typeof v.video_id === 'string' && VIDEO_ID.test(v.video_id)) out.videoId = v.video_id;
	}
	return out;
}

/** "Start talking to me": sent after the embed loads, until it answers. */
export const LISTENING = JSON.stringify({ event: 'listening', id: 'tv', channel: 'widget' });

export type PlayerCommand = 'playVideo' | 'pauseVideo' | 'mute' | 'unMute';

export const command = (func: PlayerCommand): string =>
	JSON.stringify({ event: 'command', func, args: [], id: 'tv', channel: 'widget' });
