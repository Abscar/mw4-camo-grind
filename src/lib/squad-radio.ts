/**
 * Pure helpers for the squad radio (2026-11-14, step 2 of the squad): short text messages mixed
 * with automatic events ("Lars Åke maxed the Kastov 762"), quick buttons and a 🔥 on others'
 * news. Its own small document on the sync service, next to the squad's (code + "-radio"), so
 * chatting never races the squad's progress writes. Text only, the newest MAX_MSGS kept, each at
 * most TEXT_MAX characters. Whoever has the squad link can read and write it (the user knows).
 *
 * No browser APIs and no runes (scripts/squad.test.js).
 */

import { APP_ID } from './progress-codec.ts';
import { isMemberId, makeMemberId } from './squad-codec.ts';

export const RADIO_FORMAT = 1;
export const MAX_MSGS = 100;
export const TEXT_MAX = 200;
const NAME_MAX = 24;

export interface RadioMsg {
	id: string;
	/** The member who sent it. */
	from: string;
	/** Their name when they sent it (they may have left since). */
	name: string;
	text: string;
	/** ms, the sync service's clock. */
	at: number;
	/** 'event' = written by the page itself (a maxed weapon, Divergence, a Mastery camo). */
	kind: 'msg' | 'event';
	/** Members who gave it a 🔥. */
	fire?: string[];
}

export interface RadioDoc {
	msgs: RadioMsg[];
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** The radio's code: the squad's own code + "-radio" (still a valid code for the sync service). */
export const radioCode = (squadCode: string) => `${squadCode}-radio`;

export function cleanText(raw: unknown, max = TEXT_MAX): string {
	if (typeof raw !== 'string') return '';
	// eslint-disable-next-line no-control-regex
	return [...raw.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()].slice(0, max).join('').trim();
}

function cleanMsg(raw: unknown): RadioMsg | null {
	if (!isObject(raw)) return null;
	const text = cleanText(raw.text);
	const name = cleanText(raw.name, NAME_MAX);
	if (
		typeof raw.id !== 'string' ||
		!isMemberId(raw.id) ||
		typeof raw.from !== 'string' ||
		!isMemberId(raw.from) ||
		!text ||
		!name ||
		typeof raw.at !== 'number' ||
		!Number.isFinite(raw.at)
	)
		return null;
	const msg: RadioMsg = { id: raw.id, from: raw.from, name, text, at: raw.at, kind: raw.kind === 'event' ? 'event' : 'msg' };
	if (Array.isArray(raw.fire)) {
		const fire = [...new Set(raw.fire.filter((x): x is string => typeof x === 'string' && isMemberId(x)))].slice(0, 20);
		if (fire.length) msg.fire = fire;
	}
	return msg;
}

export function fromRadioWire(raw: unknown): RadioDoc | null {
	if (!isObject(raw) || raw.app !== APP_ID || raw.radio !== RADIO_FORMAT || !Array.isArray(raw.msgs)) return null;
	const msgs = raw.msgs.map(cleanMsg).filter((m): m is RadioMsg => m !== null);
	return { msgs: msgs.sort((a, b) => a.at - b.at).slice(-MAX_MSGS) };
}

export function toRadioWire(doc: RadioDoc) {
	return { app: APP_ID, radio: RADIO_FORMAT, msgs: doc.msgs };
}

export function newMsg(from: string, name: string, text: string, at: number, kind: RadioMsg['kind'] = 'msg'): RadioMsg | null {
	return cleanMsg({ id: makeMemberId(), from, name, text, at, kind });
}

/** The radio with a message added (the oldest go once there are more than MAX_MSGS). */
export function withMsg(doc: RadioDoc, msg: RadioMsg): RadioDoc {
	if (doc.msgs.some((m) => m.id === msg.id)) return doc;
	return { msgs: [...doc.msgs, msg].sort((a, b) => a.at - b.at).slice(-MAX_MSGS) };
}

/** 🔥 on / off for one member on one message. */
export function toggleFire(doc: RadioDoc, msgId: string, member: string): RadioDoc {
	return {
		msgs: doc.msgs.map((m) => {
			if (m.id !== msgId) return m;
			const fire = m.fire?.includes(member) ? m.fire.filter((x) => x !== member) : [...(m.fire ?? []), member];
			const { fire: _old, ...rest } = m;
			return fire.length ? { ...rest, fire } : rest;
		})
	};
}

/** Messages from the others newer than `since` (the unread count on the Squad tab). */
export function unreadCount(doc: RadioDoc | null, myId: string | null, since: number): number {
	return doc ? doc.msgs.filter((m) => m.from !== myId && m.at > since).length : 0;
}

export const emptyRadio = (): RadioDoc => ({ msgs: [] });
