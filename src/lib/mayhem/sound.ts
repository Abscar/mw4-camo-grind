/**
 * Abscars Madness' sounds (2026-11-22; new gun sounds + movement sounds 2026-11-23, the user: "new sounds,
 * different gunshots for different kinds of weapons"). All made with Web Audio on the fly (no files), like the
 * site's other sounds. Every gun kind has its own recipe built from a few layers: a sharp crack (filtered noise),
 * a body thump (a falling tone), a tail (a longer low noise), sometimes an echo, and after some guns a mechanical
 * part (the shotgun's pump, the sniper's bolt). Enemy shots sound further away (quieter, duller).
 * Moves: jump whoosh, a higher airy one for the double jump, wall kick, landing thud, footsteps, dash, slam.
 * Starts on the Play tap (browsers only allow audio after one). Its own mute, remembered per device.
 */
import type { GameEvent } from './engine.ts';
import type { GunKind } from './guns.ts';

type Layer =
	| { n: 'noise'; type: BiquadFilterType; f: number; to?: number; q: number; len: number; vol: number; at?: number }
	| { n: 'tone'; wave: OscillatorType; f: number; to: number; len: number; vol: number; at?: number };

/** a recipe per gun kind (volumes are for your own shots) */
const GUN: Record<GunKind, Layer[]> = {
	pistol: [
		{ n: 'noise', type: 'highpass', f: 2600, q: 0.7, len: 0.05, vol: 0.34 },
		{ n: 'tone', wave: 'triangle', f: 320, to: 120, len: 0.07, vol: 0.32 },
		{ n: 'noise', type: 'lowpass', f: 900, q: 0.5, len: 0.18, vol: 0.12, at: 0.01 }
	],
	smg: [
		{ n: 'noise', type: 'bandpass', f: 3200, q: 1.1, len: 0.035, vol: 0.26 },
		{ n: 'tone', wave: 'square', f: 260, to: 140, len: 0.04, vol: 0.12 },
		{ n: 'noise', type: 'lowpass', f: 1400, q: 0.6, len: 0.07, vol: 0.1 }
	],
	ar: [
		{ n: 'noise', type: 'bandpass', f: 1900, q: 0.8, len: 0.05, vol: 0.32 },
		{ n: 'tone', wave: 'triangle', f: 210, to: 70, len: 0.09, vol: 0.4 },
		{ n: 'noise', type: 'lowpass', f: 700, q: 0.5, len: 0.22, vol: 0.14, at: 0.01 }
	],
	shotgun: [
		{ n: 'noise', type: 'lowpass', f: 1600, q: 0.4, len: 0.08, vol: 0.55 },
		{ n: 'tone', wave: 'sine', f: 120, to: 38, len: 0.32, vol: 0.6 },
		{ n: 'noise', type: 'lowpass', f: 500, q: 0.4, len: 0.45, vol: 0.26, at: 0.02 },
		// the pump: chk … chk
		{ n: 'noise', type: 'highpass', f: 3500, q: 1, len: 0.03, vol: 0.18, at: 0.36 },
		{ n: 'tone', wave: 'square', f: 900, to: 500, len: 0.03, vol: 0.06, at: 0.36 },
		{ n: 'noise', type: 'highpass', f: 2800, q: 1, len: 0.035, vol: 0.2, at: 0.5 },
		{ n: 'tone', wave: 'square', f: 700, to: 400, len: 0.03, vol: 0.06, at: 0.5 }
	],
	lmg: [
		{ n: 'noise', type: 'bandpass', f: 1300, q: 0.8, len: 0.06, vol: 0.32 },
		{ n: 'tone', wave: 'sawtooth', f: 150, to: 55, len: 0.1, vol: 0.3 },
		{ n: 'noise', type: 'lowpass', f: 500, q: 0.5, len: 0.2, vol: 0.16 }
	],
	marksman: [
		{ n: 'noise', type: 'highpass', f: 2200, q: 0.8, len: 0.06, vol: 0.42 },
		{ n: 'tone', wave: 'triangle', f: 260, to: 60, len: 0.14, vol: 0.42 },
		{ n: 'noise', type: 'lowpass', f: 600, q: 0.5, len: 0.35, vol: 0.18, at: 0.01 },
		// echo off the walls
		{ n: 'noise', type: 'bandpass', f: 1100, q: 0.7, len: 0.12, vol: 0.1, at: 0.13 }
	],
	sniper: [
		{ n: 'noise', type: 'highpass', f: 1800, q: 0.7, len: 0.09, vol: 0.55 },
		{ n: 'tone', wave: 'sine', f: 180, to: 32, len: 0.45, vol: 0.6 },
		{ n: 'noise', type: 'lowpass', f: 420, q: 0.4, len: 0.8, vol: 0.28, at: 0.02 },
		{ n: 'noise', type: 'bandpass', f: 900, q: 0.6, len: 0.2, vol: 0.12, at: 0.22 },
		// the bolt: click … clack
		{ n: 'noise', type: 'highpass', f: 3000, q: 1.2, len: 0.03, vol: 0.16, at: 0.55 },
		{ n: 'tone', wave: 'square', f: 1200, to: 800, len: 0.025, vol: 0.05, at: 0.55 },
		{ n: 'noise', type: 'highpass', f: 2400, q: 1.2, len: 0.04, vol: 0.18, at: 0.72 }
	],
	launcher: [
		{ n: 'tone', wave: 'sine', f: 90, to: 40, len: 0.25, vol: 0.5 },
		// the rocket's whoosh, rising
		{ n: 'noise', type: 'bandpass', f: 400, to: 2600, q: 1.4, len: 0.5, vol: 0.3 },
		{ n: 'noise', type: 'lowpass', f: 800, q: 0.5, len: 0.15, vol: 0.25 }
	],
	melee: [{ n: 'noise', type: 'bandpass', f: 900, to: 4200, q: 2.2, len: 0.14, vol: 0.22 }]
};

/** how often the same gun may start a new sound (an SMG fires 13 times a second) */
const GAP: Record<GunKind, number> = { pistol: 0.03, smg: 0.05, ar: 0.05, shotgun: 0.1, lmg: 0.05, marksman: 0.05, sniper: 0.1, launcher: 0.1, melee: 0.05 };

export class MayhemSound {
	muted = false;
	#vol = 0.8;
	/** 0 … 1, from the game's settings */
	set volume(v: number) {
		this.#vol = Math.min(1, Math.max(0, v));
		if (this.#out) this.#out.gain.value = 0.75 * this.#vol;
	}
	#ctx: AudioContext | null = null;
	#noise: AudioBuffer | null = null;
	#out: GainNode | null = null;
	#last = new Map<string, number>();

	unlock() {
		if (this.#ctx) {
			this.#ctx.resume().catch(() => {});
			return;
		}
		try {
			const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			if (!C) return;
			const ctx = new C();
			const len = ctx.sampleRate * 1;
			const buf = ctx.createBuffer(1, len, ctx.sampleRate);
			const d = buf.getChannelData(0);
			for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
			// a soft limiter so a firefight doesn't clip
			const comp = ctx.createDynamicsCompressor();
			comp.threshold.value = -14;
			comp.ratio.value = 6;
			const out = ctx.createGain();
			out.gain.value = 0.75 * this.#vol;
			out.connect(comp).connect(ctx.destination);
			this.#ctx = ctx;
			this.#noise = buf;
			this.#out = out;
		} catch {
			/* no audio: silent game */
		}
	}

	/** don't stack the same sound more than every `gap` seconds */
	#ok(key: string, gap: number) {
		const now = this.#ctx!.currentTime;
		if ((this.#last.get(key) ?? -1) > now - gap) return false;
		this.#last.set(key, now);
		return true;
	}

	#layer(l: Layer, gain = 1, dull = false) {
		const ctx = this.#ctx!;
		const t = ctx.currentTime + (l.at ?? 0);
		const g = ctx.createGain();
		g.gain.setValueAtTime(Math.max(0.0001, l.vol * gain), t);
		g.gain.exponentialRampToValueAtTime(0.0001, t + l.len);
		let tail: AudioNode = g;
		if (dull) {
			const lp = ctx.createBiquadFilter();
			lp.type = 'lowpass';
			lp.frequency.value = 1500;
			g.connect(lp);
			tail = lp;
		}
		tail.connect(this.#out!);
		if (l.n === 'noise') {
			const src = ctx.createBufferSource();
			src.buffer = this.#noise;
			const fl = ctx.createBiquadFilter();
			fl.type = l.type;
			fl.frequency.setValueAtTime(l.f, t);
			if (l.to) fl.frequency.exponentialRampToValueAtTime(l.to, t + l.len);
			fl.Q.value = l.q;
			src.connect(fl).connect(g);
			src.start(t, Math.random() * 0.4, l.len + 0.03);
		} else {
			const o = ctx.createOscillator();
			o.type = l.wave;
			o.frequency.setValueAtTime(l.f, t);
			o.frequency.exponentialRampToValueAtTime(Math.max(20, l.to), t + l.len);
			o.connect(g);
			o.start(t);
			o.stop(t + l.len + 0.03);
		}
	}

	#burst(f: number, q: number, len: number, vol: number, type: BiquadFilterType = 'bandpass', to?: number) {
		this.#layer({ n: 'noise', type, f, q, len, vol, to });
	}

	#tone(from: number, to: number, len: number, vol: number, wave: OscillatorType = 'sine', at = 0) {
		this.#layer({ n: 'tone', wave, f: from, to, len, vol, at });
	}

	play(e: GameEvent) {
		if (this.muted || !this.#ctx || this.#ctx.state !== 'running') return;
		switch (e.t) {
			case 'shot': {
				if (!this.#ok(`shot${e.kind}${e.mine}`, e.mine ? GAP[e.kind] : GAP[e.kind] * 2)) return;
				const pitch = 0.94 + Math.random() * 0.12; // no two shots exactly alike
				for (const l of GUN[e.kind]) {
					const v: Layer = l.n === 'tone' ? { ...l, f: l.f * pitch, to: l.to * pitch } : { ...l, f: l.f * pitch };
					this.#layer(v, e.mine ? 1 : 0.4, !e.mine);
				}
				break;
			}
			case 'hit':
				if (this.#ok('hit', 0.03)) this.#tone(e.head ? 1700 : 1200, e.head ? 1500 : 1000, 0.05, 0.12, 'square');
				break;
			case 'kill':
				this.#tone(2200, 1800, 0.07, 0.14, 'square');
				this.#tone(2600, 2200, 0.06, 0.1, 'square', 0.045);
				break;
			case 'hurt':
				if (this.#ok('hurt', 0.12)) this.#tone(220, 90, 0.18, 0.25, 'sawtooth');
				break;
			case 'boom':
				this.#burst(180, 0.4, 0.8, 0.7, 'lowpass');
				this.#tone(90, 28, 0.8, 0.6);
				this.#burst(2000, 0.5, 0.12, 0.3, 'highpass');
				break;
			case 'punch':
				this.#burst(400, 1, 0.08, 0.4);
				this.#tone(140, 60, 0.1, 0.4);
				break;
			case 'throw':
				this.#burst(700, 2, 0.18, 0.14, 'bandpass', 3000);
				break;
			case 'pickup':
				this.#burst(3000, 1, 0.03, 0.12, 'highpass');
				this.#tone(e.id ? 500 : 700, e.id ? 900 : 1300, 0.09, 0.15, 'triangle', 0.02);
				break;
			case 'empty':
				this.#tone(1600, 1600, 0.03, 0.12, 'square');
				break;
			case 'jump':
				if (e.n <= 1) this.#burst(500, 1.2, 0.12, 0.08, 'bandpass', 1400);
				else {
					// the double / triple jump: a whoosh and a rising ping
					this.#burst(800, 1.4, 0.2, 0.12, 'bandpass', 3200);
					this.#tone(500 + e.n * 120, 1100 + e.n * 200, 0.12, 0.07, 'triangle');
				}
				break;
			case 'wall':
				this.#burst(2500, 1, 0.04, 0.16, 'highpass');
				this.#burst(700, 1.2, 0.15, 0.1, 'bandpass', 2400);
				break;
			case 'land':
				this.#tone(e.hard ? 110 : 150, 45, e.hard ? 0.18 : 0.1, e.hard ? 0.35 : 0.18);
				this.#burst(500, 0.6, 0.08, e.hard ? 0.2 : 0.1, 'lowpass');
				break;
			case 'step':
				if (this.#ok('step', 0.12)) this.#burst(1200 + Math.random() * 600, 1, 0.035, 0.05, 'bandpass');
				break;
			case 'dash':
				this.#burst(600, 1.6, 0.2, 0.22, 'bandpass', 4000);
				this.#tone(300, 900, 0.1, 0.06, 'sawtooth');
				break;
			case 'slam':
				this.#burst(160, 0.5, e.big ? 0.8 : 0.5, e.big ? 0.75 : 0.55, 'lowpass');
				this.#tone(80, 28, e.big ? 0.8 : 0.5, 0.55);
				if (e.big) this.#burst(1500, 0.6, 0.3, 0.2, 'highpass');
				break;
			case 'wave':
				this.#tone(300, 600, 0.3, 0.2, 'sawtooth');
				break;
			case 'clear':
				this.#tone(500, 1000, 0.25, 0.18, 'triangle');
				this.#tone(750, 1500, 0.3, 0.18, 'triangle', 0.14);
				break;
			case 'dead':
				this.#tone(400, 50, 1.1, 0.35, 'sawtooth');
				break;
			case 'door':
				this.#burst(300, 0.6, 0.5, 0.25);
				this.#tone(120, 70, 0.5, 0.25, 'sawtooth');
				break;
			case 'key':
			case 'checkpoint':
				this.#tone(800, 1200, 0.1, 0.15, 'triangle');
				this.#tone(1200, 1800, 0.14, 0.15, 'triangle', 0.09);
				break;
			case 'switch':
				this.#tone(1400, 900, 0.05, 0.15, 'square');
				break;
			case 'respawn':
				this.#tone(300, 900, 0.35, 0.15, 'triangle');
				break;
			case 'complete':
				[523, 659, 784, 1046].forEach((n, i) => this.#tone(n, n, 0.22, 0.18, 'triangle', i * 0.12));
				break;
		}
	}
}
