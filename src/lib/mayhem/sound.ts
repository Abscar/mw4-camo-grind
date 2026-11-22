/**
 * Squad Mayhem's sounds (2026-11-22): made with Web Audio on the fly (no files), like the site's other
 * sounds. Shots are filtered noise bursts per gun kind, hits a click, kills a hitmarker, explosions a low
 * rumble. Starts on the Play tap (browsers only allow audio after one). Its own mute, remembered per device.
 */
import type { GameEvent } from './engine.ts';
import type { GunKind } from './guns.ts';

const SHOT: Record<GunKind, { f: number; q: number; len: number; vol: number; low: number }> = {
	pistol: { f: 1800, q: 0.8, len: 0.09, vol: 0.32, low: 140 },
	smg: { f: 2400, q: 0.9, len: 0.06, vol: 0.22, low: 120 },
	ar: { f: 1500, q: 0.8, len: 0.08, vol: 0.28, low: 110 },
	shotgun: { f: 900, q: 0.6, len: 0.22, vol: 0.45, low: 70 },
	lmg: { f: 1300, q: 0.8, len: 0.08, vol: 0.27, low: 100 },
	marksman: { f: 1100, q: 0.7, len: 0.16, vol: 0.4, low: 80 },
	sniper: { f: 800, q: 0.6, len: 0.32, vol: 0.5, low: 55 },
	launcher: { f: 500, q: 0.5, len: 0.25, vol: 0.4, low: 60 },
	melee: { f: 3000, q: 2, len: 0.08, vol: 0.18, low: 400 }
};

export class MayhemSound {
	muted = false;
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
			const len = ctx.sampleRate * 0.5;
			const buf = ctx.createBuffer(1, len, ctx.sampleRate);
			const d = buf.getChannelData(0);
			for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
			const out = ctx.createGain();
			out.gain.value = 0.6;
			out.connect(ctx.destination);
			this.#ctx = ctx;
			this.#noise = buf;
			this.#out = out;
		} catch {
			/* no audio: silent game */
		}
	}

	/** don't stack the same sound more than every `gap` seconds (SMGs at 13 shots a second) */
	#ok(key: string, gap: number) {
		const now = this.#ctx!.currentTime;
		if ((this.#last.get(key) ?? -1) > now - gap) return false;
		this.#last.set(key, now);
		return true;
	}

	#burst(f: number, q: number, len: number, vol: number) {
		const ctx = this.#ctx!;
		const src = ctx.createBufferSource();
		src.buffer = this.#noise;
		const bp = ctx.createBiquadFilter();
		bp.type = 'bandpass';
		bp.frequency.value = f;
		bp.Q.value = q;
		const g = ctx.createGain();
		const t = ctx.currentTime;
		g.gain.setValueAtTime(vol, t);
		g.gain.exponentialRampToValueAtTime(0.001, t + len);
		src.connect(bp).connect(g).connect(this.#out!);
		src.start(t, Math.random() * 0.3, len + 0.02);
	}

	#tone(from: number, to: number, len: number, vol: number, type: OscillatorType = 'sine') {
		const ctx = this.#ctx!;
		const o = ctx.createOscillator();
		o.type = type;
		const g = ctx.createGain();
		const t = ctx.currentTime;
		o.frequency.setValueAtTime(from, t);
		o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + len);
		g.gain.setValueAtTime(vol, t);
		g.gain.exponentialRampToValueAtTime(0.001, t + len);
		o.connect(g).connect(this.#out!);
		o.start(t);
		o.stop(t + len + 0.02);
	}

	play(e: GameEvent) {
		if (this.muted || !this.#ctx || this.#ctx.state !== 'running') return;
		switch (e.t) {
			case 'shot': {
				const s = SHOT[e.kind];
				if (!this.#ok(`shot${e.mine}`, e.mine ? 0.03 : 0.07)) return;
				const v = e.mine ? s.vol : s.vol * 0.45;
				this.#burst(s.f, s.q, s.len, v);
				this.#tone(s.low * 2, s.low, s.len * 1.2, v * 0.8, 'triangle');
				break;
			}
			case 'hit':
				if (this.#ok('hit', 0.03)) this.#tone(e.head ? 1700 : 1200, e.head ? 1500 : 1000, 0.05, 0.12, 'square');
				break;
			case 'kill':
				this.#tone(2200, 1800, 0.07, 0.14, 'square');
				setTimeout(() => this.#ctx && this.#tone(2600, 2200, 0.06, 0.1, 'square'), 45);
				break;
			case 'hurt':
				if (this.#ok('hurt', 0.12)) this.#tone(220, 90, 0.18, 0.25, 'sawtooth');
				break;
			case 'boom':
				this.#burst(180, 0.4, 0.7, 0.7);
				this.#tone(90, 30, 0.7, 0.6);
				break;
			case 'punch':
				this.#burst(400, 1, 0.08, 0.4);
				this.#tone(140, 60, 0.1, 0.4);
				break;
			case 'throw':
				this.#burst(2500, 3, 0.15, 0.12);
				break;
			case 'pickup':
				this.#tone(e.id ? 500 : 700, e.id ? 900 : 1300, 0.09, 0.15, 'triangle');
				break;
			case 'empty':
				this.#tone(1600, 1600, 0.03, 0.12, 'square');
				break;
			case 'wave':
				this.#tone(300, 600, 0.3, 0.2, 'sawtooth');
				break;
			case 'clear':
				this.#tone(500, 1000, 0.25, 0.18, 'triangle');
				setTimeout(() => this.#ctx && this.#tone(750, 1500, 0.3, 0.18, 'triangle'), 140);
				break;
			case 'dead':
				this.#tone(400, 50, 1.1, 0.35, 'sawtooth');
				break;
		}
	}
}
