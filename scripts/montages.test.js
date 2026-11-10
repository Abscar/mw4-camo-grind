// The old TV in the Abscar header: montage list (src/lib/data/montages.ts) and the YouTube
// embed helpers (src/lib/youtube.ts).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FAVOURITE, MONTAGE_GAMES, MONTAGES } from '../src/lib/data/montages.ts';
import { CAPTIONS_OFF, VIDEO_ID, YT_ORIGIN, command, embedUrl, readPlayerMessage } from '../src/lib/youtube.ts';

test('montages: real-looking ids, no duplicates, every field filled in', () => {
	assert.ok(MONTAGES.length >= 6, 'enough channels to flip through');
	assert.ok(MONTAGES.length <= 99, 'the LED shows two digits');
	const seen = new Set();
	for (const m of MONTAGES) {
		assert.match(m.id, VIDEO_ID, `${m.id} is a YouTube video id`);
		assert.ok(!seen.has(m.id), `${m.id} only once`);
		seen.add(m.id);
		for (const field of ['by', 'name', 'title', 'channel']) {
			assert.ok(m[field].trim().length > 0, `${m.id} has a ${field}`);
		}
		assert.ok(MONTAGE_GAMES.includes(m.game), `${m.id}: known game ${m.game}`);
	}
});

test('montages: CoD4, MW2 and MW3 are all on, and the favourite (ZzirGrizZ) has several channels', () => {
	for (const game of MONTAGE_GAMES) {
		assert.ok(
			MONTAGES.some((m) => m.game === game),
			`at least one ${game} montage`
		);
	}
	assert.equal(FAVOURITE, 'ZzirGrizZ');
	const favourite = MONTAGES.flatMap((m, i) => (m.by === FAVOURITE ? [i] : []));
	assert.ok(favourite.length >= 3, 'ZzirGrizZ montages');
	// spread out: never two of his in a row, so flipping channels shows the others too
	for (let k = 1; k < favourite.length; k++) assert.ok(favourite[k] - favourite[k - 1] > 1);
});

test('embed: starts at the chosen channel and plays the rest in order, looping', () => {
	const ids = ['aaaaaaaaaaa', 'bbbbbbbbbbb', 'ccccccccccc', 'ddddddddddd'];
	const url = new URL(embedUrl(ids, 2, { muted: true, origin: 'https://abscar.github.io' }));
	assert.equal(url.origin, YT_ORIGIN);
	assert.equal(url.pathname, '/embed/ccccccccccc');
	// the embed plays the playlist and ignores the path id, so the list starts with the channel itself
	assert.equal(url.searchParams.get('playlist'), 'ccccccccccc,ddddddddddd,aaaaaaaaaaa,bbbbbbbbbbb');
	assert.equal(url.searchParams.get('loop'), '1');
	assert.equal(url.searchParams.get('autoplay'), '1');
	assert.equal(url.searchParams.get('mute'), '1');
	assert.equal(url.searchParams.get('playsinline'), '1');
	assert.equal(url.searchParams.get('enablejsapi'), '1');
	assert.equal(url.searchParams.get('origin'), 'https://abscar.github.io');
});

test('embed: sound on, wrapping channel numbers, one video, no origin from file://', () => {
	const ids = ['aaaaaaaaaaa', 'bbbbbbbbbbb', 'ccccccccccc'];
	assert.equal(new URL(embedUrl(ids, 0, { muted: false })).searchParams.get('mute'), '0');
	assert.equal(new URL(embedUrl(ids, -1, { muted: true })).pathname, '/embed/ccccccccccc');
	assert.equal(
		new URL(embedUrl(ids, -1, { muted: true })).searchParams.get('playlist'),
		'ccccccccccc,aaaaaaaaaaa,bbbbbbbbbbb'
	);
	assert.equal(new URL(embedUrl(ids, 4, { muted: true })).pathname, '/embed/bbbbbbbbbbb');
	const one = new URL(embedUrl(['aaaaaaaaaaa'], 0, { muted: true, origin: 'null' }));
	assert.equal(one.searchParams.get('playlist'), 'aaaaaaaaaaa');
	assert.equal(one.searchParams.get('origin'), null);
});

test('player messages: state, mute, current video and errors are read; other traffic is ignored', () => {
	const info = JSON.stringify({
		event: 'infoDelivery',
		info: { playerState: 1, muted: true, videoData: { video_id: 'bbbbbbbbbbb', title: 'x' } },
		id: 'tv',
		channel: 'widget'
	});
	assert.deepEqual(readPlayerMessage(info), { event: 'infoDelivery', state: 1, muted: true, videoId: 'bbbbbbbbbbb' });
	assert.deepEqual(readPlayerMessage('{"event":"onStateChange","info":2}'), { event: 'onStateChange', state: 2 });
	assert.deepEqual(readPlayerMessage('{"event":"onError","info":150}'), { event: 'onError', error: 150 });
	assert.deepEqual(readPlayerMessage('{"event":"onReady","info":null}'), { event: 'onReady' });
	assert.deepEqual(
		readPlayerMessage('{"event":"infoDelivery","info":{"videoData":{"video_id":"<script>"}}}'),
		{ event: 'infoDelivery' },
		'only real video ids are taken'
	);
	assert.equal(readPlayerMessage('not json'), null);
	assert.equal(readPlayerMessage('{"info":1}'), null);
	assert.equal(readPlayerMessage(42), null);
	assert.equal(readPlayerMessage(null), null);
});

test('player commands are what the embed expects', () => {
	assert.deepEqual(JSON.parse(command('unMute')), {
		event: 'command',
		func: 'unMute',
		args: [],
		id: 'tv',
		channel: 'widget'
	});
	assert.deepEqual(JSON.parse(CAPTIONS_OFF).args, ['captions']);
	assert.equal(JSON.parse(CAPTIONS_OFF).func, 'unloadModule');
});
