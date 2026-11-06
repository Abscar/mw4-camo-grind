// Static site: the page is rendered to plain HTML at build time.
// Written as an expression on purpose: the offline file uses hash routing, which doesn't allow
// page options, so vite.config.ts strips this file in that build. A plain `true` would be read
// straight from the source by SvelteKit and trip the hash-routing check.
export const prerender = import.meta.env.MODE !== 'file';
