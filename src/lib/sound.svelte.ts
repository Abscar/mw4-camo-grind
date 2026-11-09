/**
 * Sound effects for your own ticks, in every theme, off by default. Everything is synthesized with
 * the Web Audio API: no audio files, no game sounds. Only feed.gain (your own taps) plays them.
 * On/off is per device under its own key: not part of the saved progress, backups or sync.
 * The AudioContext is made lazily, on the tap that first needs it (browsers only allow sound after
 * a user gesture).
 */

const KEY = 'mw4-camo-grind:sound';
/** Overall loudness: moderate, never harsh. */
export const VOLUME = 0.7;

/** A camo gained, a weapon maxed by this tick, or the tick that unlocked Divergence. */
export type SoundKind = 'camo' | 'maxed' | 'divergence';

type Ctx = BaseAudioContext;

/** Repeatable white noise (xorshift), cached per context. */
const noiseCache = new WeakMap<Ctx, AudioBuffer>();
function noise(ctx: Ctx): AudioBuffer {
	let buf = noiseCache.get(ctx);
	if (buf) return buf;
	const len = Math.ceil(ctx.sampleRate * 1.5);
	buf = ctx.createBuffer(1, len, ctx.sampleRate);
	const d = buf.getChannelData(0);
	let s = 0x2545f491;
	for (let i = 0; i < len; i++) {
		s ^= s << 13;
		s ^= s >>> 17;
		s ^= s << 5;
		d[i] = ((s >>> 0) / 4294967296) * 2 - 1;
	}
	noiseCache.set(ctx, buf);
	return buf;
}

/** A gain node that rises to `peak` in `attack` s and fades out over `decay` s. */
function envelope(ctx: Ctx, t: number, attack: number, peak: number, decay: number): GainNode {
	const g = ctx.createGain();
	g.gain.setValueAtTime(0.0001, t);
	g.gain.exponentialRampToValueAtTime(peak, t + attack);
	g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
	return g;
}

function tone(ctx: Ctx, out: AudioNode, type: OscillatorType, freq: number, t: number, attack: number, peak: number, decay: number): void {
	const osc = ctx.createOscillator();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, t);
	const g = envelope(ctx, t, attack, peak, decay);
	osc.connect(g).connect(out);
	osc.start(t);
	osc.stop(t + attack + decay + 0.02);
}

/** Camo gained: a short, crisp tick (~60 ms): a burst of bright noise and a falling click. */
export function hitmarker(ctx: Ctx, out: AudioNode, t: number): void {
	const src = ctx.createBufferSource();
	src.buffer = noise(ctx);
	const hp = ctx.createBiquadFilter();
	hp.type = 'highpass';
	hp.frequency.value = 2400;
	const bp = ctx.createBiquadFilter();
	bp.type = 'bandpass';
	bp.frequency.value = 4200;
	bp.Q.value = 1.1;
	src.connect(hp).connect(bp).connect(envelope(ctx, t, 0.001, 0.6, 0.06)).connect(out);
	src.start(t, 0, 0.08);

	const click = ctx.createOscillator();
	click.type = 'triangle';
	click.frequency.setValueAtTime(2700, t);
	click.frequency.exponentialRampToValueAtTime(1600, t + 0.04);
	click.connect(envelope(ctx, t, 0.001, 0.24, 0.06)).connect(out);
	click.start(t);
	click.stop(t + 0.08);
}

/** Weapon maxed: the tick plus a quick rising major arpeggio (~0.6 s). */
export function maxedChime(ctx: Ctx, out: AudioNode, t: number): void {
	hitmarker(ctx, out, t);
	const notes = [783.99, 987.77, 1174.66, 1567.98]; // G5 B5 D6 G6
	notes.forEach((f, i) => {
		const at = t + 0.05 + i * 0.07;
		const last = i === notes.length - 1;
		tone(ctx, out, 'triangle', f, at, 0.006, last ? 0.3 : 0.22, last ? 0.45 : 0.22);
		tone(ctx, out, 'sine', f * 2, at, 0.006, last ? 0.08 : 0.05, last ? 0.32 : 0.16);
	});
}

/** Divergence unlocked: the tick, a deep boom, a rising whoosh and a warm major chord (~1.2 s). */
export function divergenceBoom(ctx: Ctx, out: AudioNode, t: number): void {
	hitmarker(ctx, out, t);

	// deep boom (a sweep down, with a harmonic so small speakers carry it too)
	for (const [type, peak] of [['sine', 0.5], ['triangle', 0.12]] as const) {
		const osc = ctx.createOscillator();
		osc.type = type;
		osc.frequency.setValueAtTime(140, t);
		osc.frequency.exponentialRampToValueAtTime(38, t + 0.7);
		osc.connect(envelope(ctx, t, 0.008, peak, 0.9)).connect(out);
		osc.start(t);
		osc.stop(t + 0.95);
	}

	// whoosh: noise through a band that opens and closes
	const src = ctx.createBufferSource();
	src.buffer = noise(ctx);
	const bp = ctx.createBiquadFilter();
	bp.type = 'bandpass';
	bp.Q.value = 0.8;
	bp.frequency.setValueAtTime(400, t);
	bp.frequency.exponentialRampToValueAtTime(2400, t + 0.45);
	bp.frequency.exponentialRampToValueAtTime(600, t + 1.1);
	const wg = ctx.createGain();
	wg.gain.setValueAtTime(0.0001, t);
	wg.gain.exponentialRampToValueAtTime(0.2, t + 0.4);
	wg.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
	src.connect(bp).connect(wg).connect(out);
	src.start(t, 0, 1.25);

	// chord: D major, soft saws through a low-pass
	const lp = ctx.createBiquadFilter();
	lp.type = 'lowpass';
	lp.frequency.setValueAtTime(900, t + 0.12);
	lp.frequency.exponentialRampToValueAtTime(2200, t + 0.5);
	lp.Q.value = 0.7;
	lp.connect(out);
	for (const f of [293.66, 369.99, 440, 587.33]) {
		tone(ctx, lp, 'sawtooth', f, t + 0.12, 0.12, 0.07, 1.05);
		tone(ctx, lp, 'sawtooth', f * 1.004, t + 0.12, 0.12, 0.04, 1.05);
	}
}

/** Schedule one sound at time `t` on any context (also an OfflineAudioContext, for tests). */
export function schedule(kind: SoundKind, ctx: Ctx, out: AudioNode, t: number): void {
	if (kind === 'divergence') divergenceBoom(ctx, out, t);
	else if (kind === 'maxed') maxedChime(ctx, out, t);
	else hitmarker(ctx, out, t);
}

class Sound {
	/** Sound effects on for this device. Read after the page has loaded (so prerendered HTML matches). */
	on = $state(false);
	#loaded = false;
	#ctx: AudioContext | null = null;
	#out: GainNode | null = null;

	/** Read the saved on/off setting once, in the browser. */
	load(): void {
		if (this.#loaded) return;
		this.#loaded = true;
		try {
			this.on = localStorage.getItem(KEY) === '1';
		} catch {
			this.on = false;
		}
	}

	/** Switch on or off (a tap). Switching on plays one tick, so you hear that it works. */
	set(on: boolean): void {
		this.#loaded = true;
		this.on = on;
		try {
			localStorage.setItem(KEY, on ? '1' : '0');
		} catch {
			// storage refused (private mode, full): the setting just lasts until reload
		}
		if (on) this.#play('camo');
	}

	/** Play one sound for a tick, if sound is on. */
	play(kind: SoundKind): void {
		this.load();
		if (this.on) this.#play(kind);
	}

	#play(kind: SoundKind): void {
		const ctx = this.#context();
		if (!ctx || !this.#out) return;
		if (ctx.state === 'suspended') ctx.resume().catch(() => {});
		try {
			schedule(kind, ctx, this.#out, ctx.currentTime + 0.01);
		} catch {
			// never let a sound break a tick
		}
	}

	#context(): AudioContext | null {
		if (this.#ctx) return this.#ctx;
		try {
			const AC =
				window.AudioContext ??
				(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
			if (!AC) return null;
			const ctx = new AC();
			const out = ctx.createGain();
			out.gain.value = VOLUME;
			out.connect(ctx.destination);
			this.#ctx = ctx;
			this.#out = out;
			return ctx;
		} catch {
			return null;
		}
	}
}

export const sound = new Sound();
