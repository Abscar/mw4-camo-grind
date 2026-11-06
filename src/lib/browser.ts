/** Browser-only helpers: file download/upload and progress-link URLs. */

import { encodeLink, linkCodeFromHash, type ProgressData } from './progress-codec.ts';
import { SITE_URL } from './site.ts';

/** True in the self-contained offline file (built with `--mode file`, hash routing). */
export const OFFLINE_FILE = import.meta.env.MODE === 'file';

export function downloadText(filename: string, text: string, type = 'application/json'): void {
	const url = URL.createObjectURL(new Blob([text], { type }));
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.append(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function backupFilename(): string {
	return `mw4-camo-progress-${new Date().toISOString().slice(0, 10)}.json`;
}

/**
 * Where progress links should point. The website uses its own address; the offline file can
 * only make links once SITE_URL is filled in (a file:// address doesn't work on another device).
 */
export function progressLink(progress: ProgressData): string | null {
	const base = OFFLINE_FILE ? SITE_URL : location.origin + location.pathname;
	if (!base) return null;
	return `${base.split('#')[0]}#p=${encodeLink(progress)}`;
}

/** The progress code in the current address, if any (website only; the offline file routes by hash). */
export function linkCodeInAddress(): string | null {
	return OFFLINE_FILE ? null : linkCodeFromHash(location.hash);
}

/** Remove the progress code from the address bar, so a reload doesn't offer it again. */
export function clearLinkFromAddress(): void {
	history.replaceState(history.state, '', location.pathname + location.search);
}

export async function copyText(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}
