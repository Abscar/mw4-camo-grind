/**
 * KarmaShop's drawings (karma-shop.ts, 2026-11-20): the pins, the shoulder sidekicks, and what sits on an
 * operator's eyes and head. Like faceGear.ts these are pure, deterministic SVG strings (no browser APIs, no
 * runes, ids scoped by the caller's `u`), so Node tests them (scripts/karma-shop.test.js) and the prerendered page
 * matches the browser. ShopPin / ShopPet / faceGear hand any "k-" id over to these. Animated parts use the
 * `ka-*` classes in src/karma-shop.css (still with reduced motion). The auras, effects, name styles and the smoke
 * colour are CSS only (karma-shop.css). Our own cartoons, no brands.
 */
import type { Face } from './faceGear.ts';

type P = [number, number];
const f = (n: number, d = 2) => +n.toFixed(d);

/** A heart `w` wide centred on (cx, cy) (its tip a little lower than its lobes are high). */
export function heartPath(cx: number, cy: number, w: number): string {
	const s = w / 2;
	const p = (x: number, y: number) => `${f(cx + x * s)} ${f(cy + y * s)}`;
	return `M${p(0, 0.85)} C${p(-0.55, 0.45)} ${p(-1, 0.1)} ${p(-1, -0.35)} C${p(-1, -0.75)} ${p(-0.7, -1)} ${p(-0.42, -1)} C${p(-0.2, -1)} ${p(-0.05, -0.85)} ${p(0, -0.65)} C${p(0.05, -0.85)} ${p(0.2, -1)} ${p(0.42, -1)} C${p(0.7, -1)} ${p(1, -0.75)} ${p(1, -0.35)} C${p(1, 0.1)} ${p(0.55, 0.45)} ${p(0, 0.85)} Z`;
}

const pinkGrad = (id: string) =>
	`<radialGradient id="${id}" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffd0e6"/><stop offset="0.45" stop-color="#ff5a9e"/><stop offset="1" stop-color="#c0124e"/></radialGradient>`;
const goldGrad = (id: string) =>
	`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c0"/><stop offset="0.5" stop-color="#ffc928"/><stop offset="1" stop-color="#a86a00"/></linearGradient>`;
const O = '#2a0614';

/* ---------- pins (inside ShopPin's round enamel pin, 32 × 32) ---------- */

/** A KarmaShop pin's picture ('' for an id it doesn't know). */
export function karmaPin(u: string, id: string): string {
	const v = `${u}-kp`;
	if (id === 'k-pin-heart') {
		return `<defs>${pinkGrad(`${v}-h`)}</defs>
		<path d="${heartPath(16, 17, 19)}" fill="url(#${v}-h)" stroke="${O}" stroke-width="1.2" stroke-linejoin="round"/>
		<ellipse cx="11.6" cy="12.4" rx="2.4" ry="1.5" transform="rotate(-30 11.6 12.4)" fill="#fff" opacity="0.7"/>`;
	}
	if (id === 'k-pin-angel') {
		const wing = `M11 15.4 C8 11.4 4.6 11 3.4 13.2 C5.2 13.6 4.6 15.6 6.6 16.2 C5.8 17.6 7.6 18.6 9 17.8 C9 19 10.6 19.4 11.4 18.4 Z`;
		const feathers = `M5.4 14 Q7.6 14.6 9.6 15.6 M7 16.6 Q8.6 16.8 10.2 17.2`;
		return `<defs>${pinkGrad(`${v}-h`)}</defs>
		<g fill="#ffffff" stroke="#5a6a8a" stroke-width="0.8" stroke-linejoin="round"><path d="${wing}"/><path d="${wing}" transform="translate(32 0) scale(-1 1)"/></g>
		<g fill="none" stroke="#9aa8c4" stroke-width="0.5" stroke-linecap="round"><path d="${feathers}"/><path d="${feathers}" transform="translate(32 0) scale(-1 1)"/></g>
		<path d="${heartPath(16, 17.2, 12.6)}" fill="url(#${v}-h)" stroke="${O}" stroke-width="1.1" stroke-linejoin="round"/>
		<ellipse cx="13.3" cy="14.2" rx="1.5" ry="1" transform="rotate(-30 13.3 14.2)" fill="#fff" opacity="0.7"/>`;
	}
	if (id === 'k-pin-burger') {
		// BurgiGives' holy burger: a burger with a gold halo over it
		return `<defs>${goldGrad(`${v}-g`)}</defs>
		<ellipse cx="16" cy="8.4" rx="6.4" ry="1.9" fill="none" stroke="#5a3a00" stroke-width="2.6"/>
		<ellipse cx="16" cy="8.4" rx="6.4" ry="1.9" fill="none" stroke="url(#${v}-g)" stroke-width="1.6"/>
		<path d="M8.4 17.4c0-3.8 3.4-6 7.6-6s7.6 2.2 7.6 6z" fill="#e0a040" stroke="${O}" stroke-width="1.1"/>
		<path d="M8 18.6h16l-1.3 1.7H9.3z" fill="#4fb23a"/>
		<rect x="8.4" y="20" width="15.2" height="2.4" rx="1" fill="#6b3a1c"/>
		<path d="M8.8 22.9h14.4c0 1.7-1.3 2.6-3 2.6h-8.4c-1.7 0-3-.9-3-2.6z" fill="#e0a040" stroke="${O}" stroke-width="1.1"/>
		<path d="${heartPath(16, 14.6, 3.6)}" fill="#ff5a9e"/>`;
	}
	if (id === 'k-pin-medal') {
		return `<defs>${goldGrad(`${v}-g`)}<radialGradient id="${v}-gem" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffe0ef"/><stop offset="0.5" stop-color="#ff4a8e"/><stop offset="1" stop-color="#8a0a36"/></radialGradient></defs>
		<path d="${heartPath(16, 17, 20)}" fill="url(#${v}-g)" stroke="#5a3a00" stroke-width="1.2" stroke-linejoin="round"/>
		<path d="${heartPath(16, 16.6, 13)}" fill="none" stroke="#fff6c0" stroke-width="0.7" opacity="0.8"/>
		<path d="M16 12.2 L19.2 15.4 L16 19.6 L12.8 15.4 Z" fill="url(#${v}-gem)" stroke="#5a0a24" stroke-width="0.7" stroke-linejoin="round"/>
		<path d="M14 14.6 L16 13.2" stroke="#fff" stroke-width="0.7" stroke-linecap="round" opacity="0.85"/>
		<path class="ka-twinkle" d="M23.6 9.2 l0.7 1.8 1.8 0.7 -1.8 0.7 -0.7 1.8 -0.7 -1.8 -1.8 -0.7 1.8 -0.7z" fill="#fffbe0"/>`;
	}
	return '';
}

/* ---------- sidekicks (ShopPet's 32 × 32 box, on the left shoulder) ---------- */

/** A KarmaShop sidekick ('' for an id it doesn't know). */
export function karmaPet(u: string, id: string): string {
	const v = `${u}-kpet`;
	if (id === 'k-pet-heart') {
		// a chubby pink heart with a face, waving
		return `<defs>${pinkGrad(`${v}-h`)}</defs>
		<g class="ka-bob">
			<path d="M13 26.2 L12.6 29.6 M19 26.2 L19.4 29.6" stroke="#8a0a36" stroke-width="1.4" stroke-linecap="round"/>
			<ellipse cx="11.9" cy="30" rx="1.8" ry="0.9" fill="#5a0a24"/><ellipse cx="20.1" cy="30" rx="1.8" ry="0.9" fill="#5a0a24"/>
			<path d="M8.6 18.6 L5.6 21.4" stroke="#c0124e" stroke-width="1.5" stroke-linecap="round"/><circle cx="5.3" cy="21.7" r="1.3" fill="#ff7ab0" stroke="#8a0a36" stroke-width="0.6"/>
			<g class="ka-wave"><path d="M23.4 17.4 L27 13.2" stroke="#c0124e" stroke-width="1.5" stroke-linecap="round"/><circle cx="27.3" cy="12.7" r="1.3" fill="#ff7ab0" stroke="#8a0a36" stroke-width="0.6"/></g>
			<path d="${heartPath(16, 16.4, 21)}" fill="url(#${v}-h)" stroke="#6a0a2a" stroke-width="1" stroke-linejoin="round"/>
			<ellipse cx="11.2" cy="10.8" rx="2.2" ry="1.3" transform="rotate(-30 11.2 10.8)" fill="#fff" opacity="0.6"/>
			<ellipse cx="13" cy="15.4" rx="1.5" ry="1.9" fill="#fff"/><ellipse cx="19" cy="15.4" rx="1.5" ry="1.9" fill="#fff"/>
			<circle cx="13.3" cy="15.9" r="0.95" fill="#2a0614"/><circle cx="19.3" cy="15.9" r="0.95" fill="#2a0614"/>
			<circle cx="13.7" cy="15.4" r="0.35" fill="#fff"/><circle cx="19.7" cy="15.4" r="0.35" fill="#fff"/>
			<ellipse cx="10.6" cy="18.4" rx="1.4" ry="0.8" fill="#ffb0d0"/><ellipse cx="21.4" cy="18.4" rx="1.4" ry="0.8" fill="#ffb0d0"/>
			<path d="M14 18.6 Q16 20.8 18 18.6" fill="#7a0a2e" stroke="#4a0418" stroke-width="0.7" stroke-linecap="round"/>
		</g>`;
	}
	if (id === 'k-pet-pup') {
		// a little rescue puppy sitting, tongue out, a red collar with a gold heart tag, tail wagging
		return `<defs><radialGradient id="${v}-fur" cx="0.4" cy="0.3" r="0.85"><stop offset="0" stop-color="#ffe2b8"/><stop offset="0.55" stop-color="#e2a560"/><stop offset="1" stop-color="#a8642a"/></radialGradient>${goldGrad(`${v}-g`)}</defs>
		<g class="ka-wag"><path d="M22.6 24.4 Q28.6 22.6 28.4 16.8" fill="none" stroke="#6a3a14" stroke-width="3.2" stroke-linecap="round"/><path d="M22.6 24.4 Q28.6 22.6 28.4 16.8" fill="none" stroke="#e2a560" stroke-width="2" stroke-linecap="round"/></g>
		<g class="ka-bob">
			<path d="M9 30.4 C8.4 23.4 11 20 16 20 C21 20 23.6 23.4 23 30.4 Z" fill="url(#${v}-fur)" stroke="#6a3a14" stroke-width="0.9"/>
			<path d="M13.4 30.4 V26.6 M18.6 30.4 V26.6" stroke="#6a3a14" stroke-width="0.7" stroke-linecap="round"/>
			<ellipse cx="16" cy="26.6" rx="3" ry="2.4" fill="#fff0dc" opacity="0.9"/>
			<path d="M10.8 20.6 Q16 23.2 21.2 20.6" fill="none" stroke="#d8232e" stroke-width="2" stroke-linecap="round"/>
			<path d="${heartPath(16, 23.6, 3.4)}" fill="url(#${v}-g)" stroke="#5a3a00" stroke-width="0.5"/>
			<circle cx="16" cy="13.4" r="7.4" fill="url(#${v}-fur)" stroke="#6a3a14" stroke-width="0.9"/>
			<path d="M9.6 9.4 C6.2 9.6 5.8 15.8 7.6 18 C8.8 16.6 9.6 13.6 10.6 11.6 Z" fill="#8a4a1c" stroke="#5a2a0a" stroke-width="0.7"/>
			<path d="M22.4 9.4 C25.8 9.6 26.2 15.8 24.4 18 C23.2 16.6 22.4 13.6 21.4 11.6 Z" fill="#8a4a1c" stroke="#5a2a0a" stroke-width="0.7"/>
			<ellipse cx="16" cy="16.4" rx="4" ry="2.9" fill="#fff0dc"/>
			<ellipse cx="13" cy="12.4" rx="1.3" ry="1.5" fill="#2a160a"/><ellipse cx="19" cy="12.4" rx="1.3" ry="1.5" fill="#2a160a"/>
			<circle cx="13.4" cy="11.9" r="0.45" fill="#fff"/><circle cx="19.4" cy="11.9" r="0.45" fill="#fff"/>
			<ellipse cx="16" cy="15" rx="1.5" ry="1.1" fill="#2a160a"/>
			<path d="M16 16 V17 M14.4 17.2 Q16 18.4 17.6 17.2" fill="none" stroke="#2a160a" stroke-width="0.6" stroke-linecap="round"/>
			<path d="M15.1 17.6 Q16 20.4 16.9 17.6 Z" fill="#ff6a8e" stroke="#a8243e" stroke-width="0.4"/>
		</g>`;
	}
	if (id === 'k-pet-cherub') {
		// a chubby little cherub: halo, curl, rosy cheeks, white wings that flap, a white wrap, holding a heart
		const wing = 'M11.2 15 C6 9.6 1.4 10.6 1 13.4 C3 13.4 2.2 15.8 4.4 16.4 C3.4 18 5.4 19.2 7.2 18.2 C7.2 19.8 9.4 20.4 10.6 19 Z';
		return `<defs><radialGradient id="${v}-skin" cx="0.4" cy="0.32" r="0.8"><stop offset="0" stop-color="#fff0e4"/><stop offset="0.6" stop-color="#ffcfae"/><stop offset="1" stop-color="#e09a78"/></radialGradient>${goldGrad(`${v}-g`)}${pinkGrad(`${v}-h`)}</defs>
		<g class="ka-float">
			<g fill="#ffffff" stroke="#8a98b8" stroke-width="0.7" stroke-linejoin="round">
				<path class="ka-flap-l" d="${wing}"/>
				<g transform="translate(32 0) scale(-1 1)"><path class="ka-flap-l" d="${wing}"/></g>
			</g>
			<ellipse cx="16" cy="3.6" rx="5" ry="1.4" fill="none" stroke="#7a5200" stroke-width="2"/>
			<ellipse cx="16" cy="3.6" rx="5" ry="1.4" fill="none" stroke="url(#${v}-g)" stroke-width="1.2"/>
			<ellipse cx="16" cy="22.4" rx="5.6" ry="5.4" fill="url(#${v}-skin)" stroke="#a8643e" stroke-width="0.8"/>
			<path d="M10.8 22.6 Q16 26.8 21.2 22.6 L20.4 26.4 Q16 29.4 11.6 26.4 Z" fill="#ffffff" stroke="#9aa6bc" stroke-width="0.6" stroke-linejoin="round"/>
			<path d="M13.6 28 L13 30.2 M18.4 28 L19 30.2" stroke="#e09a78" stroke-width="1.8" stroke-linecap="round"/>
			<circle cx="16" cy="12.6" r="6.6" fill="url(#${v}-skin)" stroke="#a8643e" stroke-width="0.8"/>
			<path d="M13.6 6.6 Q15.6 4.6 17.4 6.2 Q19.6 5.4 19.8 7.6 Q17.4 6.8 16 8.2 Q14.6 6.8 13.6 6.6 Z" fill="#ffd25a" stroke="#b8860b" stroke-width="0.5"/>
			<path d="M12.4 12.4 Q13.6 11.2 14.8 12.4 M17.2 12.4 Q18.4 11.2 19.6 12.4" fill="none" stroke="#5a2a14" stroke-width="0.8" stroke-linecap="round"/>
			<ellipse cx="11.8" cy="14.8" rx="1.4" ry="0.9" fill="#ff9ab8"/><ellipse cx="20.2" cy="14.8" rx="1.4" ry="0.9" fill="#ff9ab8"/>
			<path d="M14.6 15.6 Q16 17 17.4 15.6" fill="none" stroke="#a8243e" stroke-width="0.7" stroke-linecap="round"/>
			<path d="M10.6 20.6 Q9.6 22.6 11.6 23.6 M21.4 20.6 Q22.8 21.2 23.6 20" stroke="#e09a78" stroke-width="1.8" fill="none" stroke-linecap="round"/>
			<g class="ka-beat"><path d="${heartPath(25.2, 19.2, 6)}" fill="url(#${v}-h)" stroke="#6a0a2a" stroke-width="0.6" stroke-linejoin="round"/></g>
		</g>`;
	}
	return '';
}

/* ---------- eyes and head (drawn by each emblem at its own face, like faceGear.ts) ---------- */

/** KarmaShop's eyes over the face's eyes ('' for nothing, no eyes or an id it doesn't know). */
export function karmaEyes(u: string, id: string | null | undefined, e: Face['eyes']): string {
	if (!e || !id) return '';
	const v = `${u}-ke`;
	const R = e.rad;
	if (id === 'k-eyes-hearts') {
		// big glowing pink hearts over the eyes, beating
		return `<defs>${pinkGrad(`${v}-h`)}<radialGradient id="${v}-glow"><stop offset="0" stop-color="#ff5aa0" stop-opacity="0.75"/><stop offset="1" stop-color="#ff5aa0" stop-opacity="0"/></radialGradient></defs>
		${[e.l, e.r]
			.map(
				([cx, cy], i) =>
					`<g class="ka-beat" style="animation-delay:-${i * 0.2}s"><circle cx="${cx}" cy="${cy}" r="${f(R * 1.9)}" fill="url(#${v}-glow)"/><path d="${heartPath(cx, cy + R * 0.08, R * 2.5)}" fill="url(#${v}-h)" stroke="#5a0420" stroke-width="${f(R * 0.14)}" stroke-linejoin="round"/><ellipse cx="${f(cx - R * 0.5)}" cy="${f(cy - R * 0.45)}" rx="${f(R * 0.32)}" ry="${f(R * 0.2)}" transform="rotate(-30 ${f(cx - R * 0.5)} ${f(cy - R * 0.45)})" fill="#fff" opacity="0.8"/></g>`
			)
			.join('')}`;
	}
	if (id === 'k-eyes-rose') {
		// heart-shaped glasses: rosy see-through lenses, a rose-gold frame, a bridge and the arms
		const [[lx, ly], [rx, ry]] = [e.l, e.r];
		const w = R * 2.6;
		return `<defs><linearGradient id="${v}-lens" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9ac8" stop-opacity="0.92"/><stop offset="1" stop-color="#ff3a86" stop-opacity="0.85"/></linearGradient></defs>
		<path d="M${f(lx - w * 0.48)} ${f(ly - R * 0.3)} L${f(lx - R * 1.75)} ${f(ly - R * 0.5)} M${f(rx + w * 0.48)} ${f(ry - R * 0.3)} L${f(rx + R * 1.75)} ${f(ry - R * 0.5)}" stroke="#d88a6a" stroke-width="${f(R * 0.2)}" stroke-linecap="round"/>
		<path d="M${f(lx + w * 0.3)} ${f(ly - R * 0.55)} Q${f((lx + rx) / 2)} ${f(ly - R * 1)} ${f(rx - w * 0.3)} ${f(ry - R * 0.55)}" fill="none" stroke="#d88a6a" stroke-width="${f(R * 0.2)}"/>
		${[e.l, e.r]
			.map(
				([cx, cy]) =>
					`<path d="${heartPath(cx, cy + R * 0.05, w)}" fill="url(#${v}-lens)" stroke="#e8a080" stroke-width="${f(R * 0.2)}" stroke-linejoin="round"/><path d="M${f(cx - R * 0.75)} ${f(cy - R * 0.3)} Q${f(cx - R * 0.5)} ${f(cy - R * 0.75)} ${f(cx - R * 0.1)} ${f(cy - R * 0.7)}" fill="none" stroke="#fff" stroke-width="${f(R * 0.16)}" stroke-linecap="round" opacity="0.85"/>`
			)
			.join('')}`;
	}
	return '';
}

/** KarmaShop's hats on the face's head ('' for nothing or an id it doesn't know). */
export function karmaHat(u: string, id: string | null | undefined, h: Face['head']): string {
	if (!id) return '';
	const v = `${u}-kh`;
	const { x, y, w } = h;
	if (id === 'k-hat-halo') {
		// a gold ring floating over the head with a soft glow, bobbing gently
		const cy = y - 0.17 * w;
		const rx = 0.36 * w;
		const ry = 0.1 * w;
		return `<defs><linearGradient id="${v}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.45" stop-color="#ffd23a"/><stop offset="1" stop-color="#b87a00"/></linearGradient></defs>
		<g class="ka-halo">
			<ellipse class="ka-halo-glow" cx="${f(x)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="#ffe680" stroke-width="${f(w * 0.16)}" opacity="0.35"/>
			<ellipse cx="${f(x)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="#7a5000" stroke-width="${f(w * 0.075)}"/>
			<ellipse cx="${f(x)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="url(#${v}-g)" stroke-width="${f(w * 0.05)}"/>
			<path d="M${f(x - rx * 0.62)} ${f(cy - ry * 0.78)} Q${f(x - rx * 0.1)} ${f(cy - ry * 1.08)} ${f(x + rx * 0.35)} ${f(cy - ry * 0.92)}" fill="none" stroke="#ffffff" stroke-width="${f(w * 0.018)}" stroke-linecap="round" opacity="0.9"/>
		</g>`;
	}
	if (id === 'k-hat-band') {
		// a pink alice band with two hearts bobbing on springs
		const band = `M${f(x - 0.52 * w)} ${f(y + 0.2 * w)} Q${f(x)} ${f(y - 0.14 * w)} ${f(x + 0.52 * w)} ${f(y + 0.2 * w)}`;
		const bopper = (dx: number, d: number) => {
			const bx = x + dx * w;
			const base = y + 0.02 * w;
			const top = y - 0.3 * w;
			const n = 5;
			const zig = Array.from({ length: n + 1 }, (_, i) => `${i ? 'L' : 'M'}${f(bx + (i % 2 ? 0.035 : -0.035) * w * (i && i < n ? 1 : 0))} ${f(base + ((top - base) * i) / n)}`).join(' ');
			return `<g class="ka-bop" style="animation-delay:-${d}s"><path d="${zig}" fill="none" stroke="#c9d3dc" stroke-width="${f(w * 0.022)}" stroke-linejoin="round"/><path d="${heartPath(bx, top - 0.06 * w, 0.21 * w)}" fill="url(#${v}-h)" stroke="#5a0420" stroke-width="${f(w * 0.018)}" stroke-linejoin="round"/></g>`;
		};
		return `<defs>${pinkGrad(`${v}-h`)}</defs>
		${bopper(-0.2, 0)}${bopper(0.2, 0.45)}
		<path d="${band}" fill="none" stroke="#6a0a2a" stroke-width="${f(w * 0.085)}" stroke-linecap="round"/>
		<path d="${band}" fill="none" stroke="#ff6aa8" stroke-width="${f(w * 0.055)}" stroke-linecap="round"/>`;
	}
	if (id === 'k-hat-flowers') {
		// a crown of little flowers (pink, white, yellow) and leaves along the top of the head
		// a point on the vine: the quadratic from (x − 0.5w, y + 0.2w) over (x, y − 0.1w) to (x + 0.5w, y + 0.2w)
		const arc = (t: number): P => [x + w * (t - 0.5), y + 0.2 * w - 0.6 * w * t * (1 - t)];
		const vine = `M${f(x - 0.5 * w)} ${f(y + 0.2 * w)} Q${f(x)} ${f(y - 0.1 * w)} ${f(x + 0.5 * w)} ${f(y + 0.2 * w)}`;
		const cols = ['#ff7ab0', '#ffffff', '#ffd23a', '#ff7ab0', '#c9a0ff', '#ffffff', '#ff7ab0'];
		const leaves = [0.08, 0.3, 0.52, 0.72, 0.93]
			.map((t, i) => {
				const [lx, ly] = arc(t);
				const r = w * 0.07;
				return `<ellipse cx="${f(lx)}" cy="${f(ly - r * 0.4)}" rx="${f(r * 1.25)}" ry="${f(r * 0.55)}" transform="rotate(${i % 2 ? 35 : -35} ${f(lx)} ${f(ly)})" fill="#4fbf4a" stroke="#1f5a14" stroke-width="${f(w * 0.01)}"/>`;
			})
			.join('');
		const flowers = cols
			.map((c, i) => {
				const [fx, fy] = arc(i / (cols.length - 1));
				const r = w * (i === 3 ? 0.058 : 0.046);
				const petals = [0, 72, 144, 216, 288].map((a) => {
					const rad = (a * Math.PI) / 180;
					return `<circle cx="${f(fx + Math.sin(rad) * r)}" cy="${f(fy - 0.02 * w - Math.cos(rad) * r)}" r="${f(r * 0.72)}"/>`;
				});
				return `<g fill="${c}" stroke="#7a2a4a" stroke-width="${f(w * 0.008)}">${petals.join('')}</g><circle cx="${f(fx)}" cy="${f(fy - 0.02 * w)}" r="${f(r * 0.55)}" fill="${c === '#ffd23a' ? '#ff8a1a' : '#ffd23a'}"/>`;
			})
			.join('');
		return `<path d="${vine}" fill="none" stroke="#2f7a24" stroke-width="${f(w * 0.045)}" stroke-linecap="round"/>${leaves}${flowers}`;
	}
	return '';
}

/** Every KarmaShop id karmaArt draws (the tests check each one draws something). */
export const DRAWN = {
	badge: ['k-pin-heart', 'k-pin-angel', 'k-pin-burger', 'k-pin-medal'],
	pet: ['k-pet-heart', 'k-pet-pup', 'k-pet-cherub'],
	eyes: ['k-eyes-rose', 'k-eyes-hearts'],
	hat: ['k-hat-band', 'k-hat-flowers', 'k-hat-halo']
} as const;
