/**
 * A small hover label for mouse users (2026-11-22, the user: "when you hold the mouse over Gold, show what you need
 * to do for Gold"): `use:hoverTip={{ label, text, ink }}` on the G / P / HB / TER / SCA / CAS column headings of a
 * class box. One shared box on <body> (so a class box's clipped corners never cut it off), placed under the heading
 * (above it when there's no room), shown after a short pause and only for a real mouse; touch screens get the same
 * text from the "?" in the class header (ClassChallenges). aria-hidden: it repeats what the "?" box already says.
 * Styles: `.hover-tip` in grind.css.
 */
export type HoverTip = {
	/** the camo's name, drawn in its colour */
	label: string;
	/** the challenge */
	text: string;
	/** text colour class for the label (CAMO_INK) */
	ink?: string;
	/** shown after the text in brackets, e.g. "unconfirmed" */
	flag?: string;
};

let box: HTMLDivElement | undefined;
let showTimer: ReturnType<typeof setTimeout> | undefined;
let owner: HTMLElement | undefined;

function getBox(): HTMLDivElement {
	if (box?.isConnected) return box;
	box = document.createElement('div');
	box.className = 'hover-tip';
	box.setAttribute('aria-hidden', 'true');
	box.hidden = true;
	document.body.append(box);
	// a scroll moves the heading away from the box: just hide it
	window.addEventListener('scroll', () => hide(), { capture: true, passive: true });
	return box;
}

function fill(el: HTMLDivElement, tip: HoverTip) {
	const b = document.createElement('b');
	b.className = `hover-tip-label ${tip.ink ?? ''}`;
	b.textContent = tip.label;
	const s = document.createElement('span');
	s.textContent = tip.flag ? `${tip.text} (${tip.flag})` : tip.text;
	el.replaceChildren(b, s);
}

function place(el: HTMLDivElement, anchor: HTMLElement) {
	const r = anchor.getBoundingClientRect();
	const vw = document.documentElement.clientWidth;
	const vh = window.innerHeight;
	const w = el.offsetWidth;
	const h = el.offsetHeight;
	const left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, vw - 8 - w));
	let top = r.bottom + 6;
	const above = top + h > vh - 8 && r.top - 6 - h >= 8;
	if (above) top = r.top - 6 - h;
	el.classList.toggle('above', above);
	el.style.left = `${Math.round(left)}px`;
	el.style.top = `${Math.round(top)}px`;
	el.style.setProperty('--arrow-x', `${Math.round(r.left + r.width / 2 - left)}px`);
}

function hide(anchor?: HTMLElement) {
	if (anchor && owner !== anchor) return;
	clearTimeout(showTimer);
	owner = undefined;
	if (box) box.hidden = true;
}

const canHover = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

export function hoverTip(node: HTMLElement, tip: HoverTip) {
	let current = tip;
	const enter = (e: PointerEvent) => {
		if (e.pointerType !== 'mouse' || !canHover()) return;
		clearTimeout(showTimer);
		owner = node;
		showTimer = setTimeout(() => {
			if (owner !== node || !node.isConnected) return;
			const el = getBox();
			fill(el, current);
			el.hidden = false;
			place(el, node);
		}, 120);
	};
	const leave = () => hide(node);
	node.addEventListener('pointerenter', enter);
	node.addEventListener('pointerleave', leave);
	return {
		update(next: HoverTip) {
			current = next;
		},
		destroy() {
			node.removeEventListener('pointerenter', enter);
			node.removeEventListener('pointerleave', leave);
			hide(node);
		}
	};
}
