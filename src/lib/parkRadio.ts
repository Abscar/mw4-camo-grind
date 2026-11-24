/**
 * Holk Park's boombox (2026-11-24): a lo-fi loop made on the spot with Web Audio (no files): four soft
 * seventh chords on warm triangle tones through a low-pass, a muffled kick, a quiet hi-hat, a bass line and
 * some vinyl crackle, at 72 BPM. Only plays after a tap on the radio (browsers need that) and stops when
 * the park closes. Browser only.
 */
type Ctx = AudioContext;

const BPM = 72;
const BEAT = 60 / BPM;
/** Fmaj7, Em7, Dm7, Cmaj7 (MIDI notes), one bar each */
const CHORDS = [
	[53, 57, 60, 64],
	[52, 55, 59, 62],
	[50, 53, 57, 60],
	[48, 52, 55, 59]
];
const BASS = [41, 40, 38, 36];
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class ParkRadio {
	#ctx: Ctx | null = null;
	#out: GainNode | null = null;
	#noise: AudioBuffer | null = null;
	#crackle: AudioBufferSourceNode | null = null;
	#timer: ReturnType<typeof setInterval> | null = null;
	#next = 0;
	#step = 0;
	playing = false;

	start(): boolean {
		if (this.playing) return true;
		try {
			const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			const ctx = (this.#ctx ??= new AC());
			void ctx.resume();
			const out = ctx.createGain();
			out.gain.value = 0;
			out.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.2);
			const lp = ctx.createBiquadFilter();
			lp.type = 'lowpass';
			lp.frequency.value = 2400;
			out.connect(lp).connect(ctx.destination);
			this.#out = out;
			if (!this.#noise) {
				const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
				const d = b.getChannelData(0);
				for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
				this.#noise = b;
			}
			// vinyl crackle: sparse clicks in a looping noise buffer
			const cb = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
			const cd = cb.getChannelData(0);
			for (let i = 0; i < cd.length; i++) cd[i] = Math.random() < 0.0006 ? (Math.random() - 0.5) * 0.9 : (Math.random() - 0.5) * 0.012;
			const cr = ctx.createBufferSource();
			cr.buffer = cb;
			cr.loop = true;
			const cg = ctx.createGain();
			cg.gain.value = 0.35;
			cr.connect(cg).connect(out);
			cr.start();
			this.#crackle = cr;
			this.#next = ctx.currentTime + 0.1;
			this.#step = 0;
			this.#timer = setInterval(() => this.#schedule(), 100);
			this.#schedule();
			this.playing = true;
			return true;
		} catch {
			this.stop();
			return false;
		}
	}

	stop(): void {
		this.playing = false;
		if (this.#timer) clearInterval(this.#timer);
		this.#timer = null;
		const ctx = this.#ctx;
		const out = this.#out;
		if (ctx && out) {
			try {
				out.gain.cancelScheduledValues(ctx.currentTime);
				out.gain.setValueAtTime(out.gain.value, ctx.currentTime);
				out.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
				const cr = this.#crackle;
				setTimeout(() => {
					try {
						cr?.stop();
						out.disconnect();
					} catch {
						/* already gone */
					}
				}, 500);
			} catch {
				/* already gone */
			}
		}
		this.#out = null;
		this.#crackle = null;
	}

	/** schedule the eighth notes in the next 0.3 s */
	#schedule(): void {
		const ctx = this.#ctx;
		const out = this.#out;
		if (!ctx || !out) return;
		while (this.#next < ctx.currentTime + 0.3) {
			const s = this.#step;
			const t = this.#next;
			const bar = Math.floor(s / 8) % 4;
			const eighth = s % 8;
			if (eighth === 0) this.#chord(ctx, out, t, CHORDS[bar]);
			if (eighth === 0 || eighth === 5) this.#kick(ctx, out, t);
			if (eighth === 4) this.#snare(ctx, out, t);
			if (eighth % 2 === 1) this.#hat(ctx, out, t + BEAT * 0.06);
			if (eighth === 0 || eighth === 3 || eighth === 6) this.#bass(ctx, out, t, BASS[bar] + (eighth === 6 ? 7 : 0));
			this.#next += BEAT / 2;
			this.#step++;
		}
	}

	#chord(ctx: Ctx, out: AudioNode, t: number, notes: number[]) {
		for (const [i, m] of notes.entries()) {
			const o = ctx.createOscillator();
			o.type = 'triangle';
			o.frequency.value = hz(m + 12);
			o.detune.value = (i - 1.5) * 6;
			const g = ctx.createGain();
			g.gain.setValueAtTime(0, t);
			g.gain.linearRampToValueAtTime(0.045, t + 0.08 + i * 0.03);
			g.gain.exponentialRampToValueAtTime(0.0008, t + BEAT * 4);
			o.connect(g).connect(out);
			o.start(t + i * 0.03);
			o.stop(t + BEAT * 4 + 0.05);
		}
	}
	#bass(ctx: Ctx, out: AudioNode, t: number, m: number) {
		const o = ctx.createOscillator();
		o.type = 'sine';
		o.frequency.value = hz(m);
		const g = ctx.createGain();
		g.gain.setValueAtTime(0.16, t);
		g.gain.exponentialRampToValueAtTime(0.001, t + BEAT * 1.2);
		o.connect(g).connect(out);
		o.start(t);
		o.stop(t + BEAT * 1.3);
	}
	#kick(ctx: Ctx, out: AudioNode, t: number) {
		const o = ctx.createOscillator();
		o.frequency.setValueAtTime(110, t);
		o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
		const g = ctx.createGain();
		g.gain.setValueAtTime(0.38, t);
		g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
		o.connect(g).connect(out);
		o.start(t);
		o.stop(t + 0.34);
	}
	#noiseHit(ctx: Ctx, out: AudioNode, t: number, type: BiquadFilterType, freq: number, peak: number, len: number) {
		if (!this.#noise) return;
		const n = ctx.createBufferSource();
		n.buffer = this.#noise;
		const fl = ctx.createBiquadFilter();
		fl.type = type;
		fl.frequency.value = freq;
		const g = ctx.createGain();
		g.gain.setValueAtTime(peak, t);
		g.gain.exponentialRampToValueAtTime(0.0008, t + len);
		n.connect(fl).connect(g).connect(out);
		n.start(t, Math.random());
		n.stop(t + len + 0.02);
	}
	#hat(ctx: Ctx, out: AudioNode, t: number) {
		this.#noiseHit(ctx, out, t, 'highpass', 7000, 0.05, 0.05);
	}
	#snare(ctx: Ctx, out: AudioNode, t: number) {
		this.#noiseHit(ctx, out, t, 'bandpass', 1800, 0.12, 0.18);
	}
}
