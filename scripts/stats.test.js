// Grind stats under the KPI tiles (src/lib/stats.ts): today / this week / Divergence estimate.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DIVERGENCE_REQUIRED, MAX_LEVEL } from '../src/lib/data/camos.ts';
import { WEAPONS } from '../src/lib/data/weapons.ts';
import { defaultProgress } from '../src/lib/progress-codec.ts';
import { PACE_MIN_DAYS, grindStats } from '../src/lib/stats.ts';

const DAY = 86_400_000;
// Wednesday 11 Nov 2026, 15:00 local time (that week's Monday is the 9th)
const NOW = new Date(2026, 10, 11, 15, 0, 0).getTime();

test('stats: camos ticked today and this week (since Monday), only for camos you still have', () => {
	const levels = defaultProgress().weapons;
	levels.m4 = 3;
	levels.oden = 2;
	const stamps = {
		m4: [0, NOW - 2 * 3_600_000, NOW - 60_000], // Gold unknown, Plat + HB today
		oden: [0, NOW - 2 * DAY], // Plat on Monday
		axion: [0, NOW - 3_600_000] // Plat ticked and taken away again (level 1)
	};
	const s = grindStats(stamps, levels, NOW);
	assert.equal(s.today, 2);
	assert.equal(s.week, 3);
});

test('stats: no Divergence estimate before a couple of days of ticks, then one at your pace', () => {
	const levels = defaultProgress().weapons;
	assert.equal(grindStats({}, levels, NOW).divergence.kind, 'tooSoon');

	// 6 Harmonic Breaks over the last 3 days → 2 a day; 33 - 6 = 27 to go → 14 days
	const hb = WEAPONS.slice(0, 6);
	const stamps = {};
	hb.forEach((w, i) => {
		levels[w.id] = MAX_LEVEL;
		stamps[w.id] = [0, 0, NOW - (i % 3) * DAY - 3_600_000];
	});
	stamps[hb[0].id][2] = NOW - 3 * DAY; // the first known tick, 3 days ago
	const s = grindStats(stamps, levels, NOW);
	assert.equal(s.divergence.kind, 'eta');
	if (s.divergence.kind === 'eta') {
		assert.equal(s.divergence.days, Math.ceil((DIVERGENCE_REQUIRED - 6) / 2));
		assert.ok(s.divergence.date > NOW);
	}
	assert.ok(PACE_MIN_DAYS <= 3);
});

test('stats: no recent Harmonic Break = no pace; enough of them = unlocked', () => {
	const levels = defaultProgress().weapons;
	levels.m4 = 2;
	assert.equal(grindStats({ m4: [0, NOW - 20 * DAY] }, levels, NOW).divergence.kind, 'noPace');
	for (const w of WEAPONS.slice(0, DIVERGENCE_REQUIRED)) levels[w.id] = MAX_LEVEL;
	assert.equal(grindStats({}, levels, NOW).divergence.kind, 'unlocked');
});
