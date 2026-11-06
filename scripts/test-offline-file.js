// Tests the offline file the way the user opens it: double-clicked, via file://.
// Drives headless Edge with a throwaway profile over the DevTools protocol (no extra packages).
// Usage: node scripts/test-offline-file.js   (screenshots + results land in build-file/)
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const FILE_URL = new URL('../MW4%20Camo%20Grind.html', import.meta.url).href;
const OUT = process.argv[2] ?? fileURLToPath(new URL('../build-file/', import.meta.url));
const PORT = 9333;

const profile = mkdtempSync(join(tmpdir(), 'mw4-edge-'));
const edge = spawn(EDGE, [
	'--headless=new',
	`--remote-debugging-port=${PORT}`,
	`--user-data-dir=${profile}`,
	'--no-first-run',
	'--no-default-browser-check',
	'--disable-extensions',
	'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 50; i++) {
	try {
		targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
		if (targets.some((t) => t.type === 'page')) break;
	} catch {}
	await sleep(200);
}
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

let id = 0;
const pending = new Map();
const consoleLog = [];
ws.addEventListener('message', (e) => {
	const msg = JSON.parse(e.data);
	if (msg.id && pending.has(msg.id)) {
		pending.get(msg.id)(msg);
		pending.delete(msg.id);
	} else if (msg.method === 'Runtime.consoleAPICalled') {
		consoleLog.push(`[console.${msg.params.type}] ` + msg.params.args.map((a) => a.value ?? a.description).join(' '));
	} else if (msg.method === 'Runtime.exceptionThrown') {
		consoleLog.push('[exception] ' + (msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text));
	} else if (msg.method === 'Log.entryAdded') {
		consoleLog.push(`[log.${msg.params.entry.level}] ${msg.params.entry.text} ${msg.params.entry.url ?? ''}`);
	}
});
const send = (method, params = {}) =>
	new Promise((resolve, reject) => {
		const msgId = ++id;
		pending.set(msgId, (m) => (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)));
		ws.send(JSON.stringify({ id: msgId, method, params }));
	});
const evaluate = async (expression) => {
	const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
	if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
	return r.result.value;
};
const navigate = async (url) => {
	await send('Page.navigate', { url });
	await sleep(1500);
};
const screenshot = async (name) => {
	const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
	writeFileSync(join(OUT, name), Buffer.from(data, 'base64'));
};

const results = {};
try {
	await send('Runtime.enable');
	await send('Log.enable');
	await send('Page.enable');
	await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

	// 1. Plant progress from the OLD tracker (same file:// origin), as if the user had used it.
	await navigate(FILE_URL);
	await evaluate(`localStorage.clear(); localStorage.setItem('mw4-camo-grind-v1', JSON.stringify({ v: 1, ticks: { m4: [1,1,1], oden: [1,1,0], 'cronen-osprey': [1,0,0] }, mastery: { md: 7, pr: 0, or: 0 }, theme: 'field', hideMaxed: false })); true`);
	await navigate(FILE_URL);

	const state = `(() => {
		const pressed = (camo, w) => document.querySelector('button[aria-label="' + camo + ': ' + w + '"]')?.getAttribute('aria-pressed');
		return {
			href: location.href,
			ready: document.querySelector('.app-gate')?.classList.contains('ready'),
			theme: document.documentElement.dataset.theme,
			classes: document.querySelectorAll('main section h2[id^=class-]').length,
			weapons: document.querySelectorAll('main section li').length,
			kpi: [...document.querySelectorAll('section[aria-label="Overall progress"] p.font-head')].map(p => p.textContent.trim()),
			m4: [pressed('Gold','M4'), pressed('Platinum','M4'), pressed('Harmonic Break','M4')].join(','),
			oden: [pressed('Gold','Oden'), pressed('Platinum','Oden'), pressed('Harmonic Break','Oden')].join(','),
			osprey: pressed('Gold','Cronen Osprey'),
			han86: [pressed('Gold','Han 86'), pressed('Platinum','Han 86'), pressed('Harmonic Break','Han 86')].join(','),
			mercurial: document.querySelector('input[aria-label="Mercurial Drift: times done"]')?.value,
			toast: document.querySelector('[role=status]')?.innerText.trim(),
			keys: Object.keys(localStorage).sort()
		};
	})()`;
	results.afterMigration = await evaluate(state);
	await screenshot('file-desktop-field.png');

	// 2. Tick Harmonic Break on Han 86 with a real click event, then reload: must persist.
	await evaluate(`document.querySelector('button[aria-label="Harmonic Break: Han 86"]').click(); true`);
	await sleep(300);
	results.afterTick = await evaluate(state);
	await navigate(FILE_URL);
	results.afterReload = await evaluate(state);

	// 3. Theme switch persists.
	await evaluate(`[...document.querySelectorAll('button[aria-pressed]')].find(b => b.title === 'Neon Grid').click(); true`);
	await sleep(400);
	await navigate(FILE_URL);
	results.themeAfterReload = await evaluate('document.documentElement.dataset.theme');

	// 4. Progress-link dialog in the offline file (no site address configured yet).
	await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Copy my progress link').click(); true`);
	await sleep(300);
	results.linkDialog = await evaluate(`[...document.querySelectorAll('dialog')].find(d => d.open)?.innerText.replace(/\\n+/g, ' | ')`);
	await evaluate(`[...document.querySelectorAll('dialog')].find(d => d.open)?.close(); true`);

	// 5. Export must create a .json download link (capture it instead of saving).
	results.export = await evaluate(`(async () => {
		let blob, name; const oc = URL.createObjectURL; URL.createObjectURL = (b) => { blob = b; return oc.call(URL, b); };
		const click = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { name = this.download; };
		[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Export backup (.json)').click();
		URL.createObjectURL = oc; HTMLAnchorElement.prototype.click = click;
		const j = JSON.parse(await blob.text()); return { name, app: j.app, v: j.v, han86: j.progress.weapons['han-86'], m4: j.progress.weapons.m4 };
	})()`);

	// 6. Tab regains focus / visibility (SvelteKit checks for new versions then) â€“ watch the console.
	await evaluate(`document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); true`);
	await sleep(800);

	// 7. Phone width.
	await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
	await navigate(FILE_URL);
	results.phone = await evaluate(`({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth,
		smallTargets: [...document.querySelectorAll('button, input:not([type=hidden]):not(.sr-only), label')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44) && !e.closest('footer'); }).map(e => (e.getAttribute('aria-label') || e.textContent.trim()).slice(0, 30) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)).slice(0, 15) })`);
	await screenshot('file-phone-top.png');
	await evaluate(`document.querySelector('section[aria-labelledby=mastery-heading]').scrollIntoView(); true`);
	await sleep(300);
	await screenshot('file-phone-mastery.png');
} catch (e) {
	results.error = String(e?.stack ?? e);
} finally {
	results.console = consoleLog;
	writeFileSync(join(OUT, 'file-test-results.json'), JSON.stringify(results, null, 2));
	ws.close();
	edge.kill();
	await sleep(800);
	try { rmSync(profile, { recursive: true, force: true }); } catch {}
	console.log(JSON.stringify(results, null, 2));
	process.exit(0);
}
