// Copies the inlined offline build to "MW4 Camo Grind.html" in the project folder,
// after checking that it really is one self-contained file.
import { copyFileSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = `${root}build-file/offline.html`;
const target = `${root}MW4 Camo Grind.html`;

const html = readFileSync(source, 'utf8');

// Every src/href must be inline (data:) or an absolute web address; nothing may point at a
// sibling file, because there won't be any next to the HTML file.
const refs = [...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']*)["']/g)].map((m) => m[1]);
const local = refs.filter((r) => r && !/^(data:|https?:|#|mailto:)/i.test(r));
if (local.length > 0) {
	console.error('The offline file still points at other files:', local);
	process.exit(1);
}

copyFileSync(source, target);
console.log(`Wrote "${target}" (${Math.round(statSync(target).size / 1024)} kB)`);
