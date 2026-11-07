import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

/**
 * Hash routing doesn't allow page options, so the offline file build drops the
 * `export const prerender = true` from the root layout (the website still prerenders).
 */
const dropPageOptions: Plugin = {
	name: 'offline-file:drop-page-options',
	enforce: 'pre',
	transform(_code, id) {
		if (/[\\/]src[\\/]routes[\\/]\+layout\.ts$/.test(id)) return { code: 'export {};', map: null };
	}
};

export default defineConfig(({ mode }) => {
	// `vite build --mode file` makes the single, self-contained offline copy
	// (everything inlined, hash routing so it works when opened via file://).
	// Every other mode is the normal static website.
	const offlineFile = mode === 'file';

	return {
		// The offline file must be a single file, so pictures are baked into it as data URLs.
		// (That makes the inlined bundle bigger than Vite's default 500 kB warning, on purpose.)
		...(offlineFile ? { build: { assetsInlineLimit: 50 * 1024 * 1024, chunkSizeWarningLimit: 2048 } } : {}),
		plugins: [
			...(offlineFile ? [dropPageOptions] : []),
			tailwindcss(),
			sveltekit({
				compilerOptions: {
					// Runes everywhere except third-party libraries. Can be removed in Svelte 6.
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},
				adapter: offlineFile
					? // Hash routing renders nothing ahead of time; the "fallback" page is the whole app.
						// (Not called index.html, so it can't collide with the website's prerendered page.)
						adapter({ pages: 'build-file', assets: 'build-file', fallback: 'offline.html' })
					: adapter({ pages: 'build', assets: 'build' }),
				paths: {
					// GitHub Pages project sites live under /<repo>/; the deploy workflow sets BASE_PATH.
					base: offlineFile ? '' : ((globalThis as any).process?.env?.BASE_PATH ?? '')
				},
				router: { type: offlineFile ? 'hash' : 'pathname' },
				output: { bundleStrategy: offlineFile ? 'inline' : 'split' },
				// Service workers don't exist on file://, so only register one on the website.
				serviceWorker: { register: !offlineFile },
				// One static page, no server: nothing to poll for.
				version: { pollInterval: 0 }
			})
		]
	};
});
