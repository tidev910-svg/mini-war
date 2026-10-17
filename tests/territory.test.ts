// @ts-nocheck
// Flag capture and region vision (docs/features/territory.md).
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGame, quietMatch } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); });

const nearestFlag = (state, team) => {
  const base = state.bases[team];
  return state.regions.filter(r => r.cp).sort((a, b) => Math.hypot(a.cp.x - base.x, a.cp.y - base.y) - Math.hypot(b.cp.x - base.x, b.cp.y - base.y))[0];
};
function captureTime(n, type = 'spearman', enemies = 0) {
  const state = quietMatch(g), flag = nearestFlag(state, 0);
  const put = (team, t) => { const u = g.spawn(team, t, 0, 0, false) || g.spawn(team, t); u.x = flag.cp.x + (Math.random() - 0.5) * 40; u.y = flag.cp.y + (Math.random() - 0.5) * 40; };
  for (let i = 0; i < n; i++) put(0, type);
  for (let i = 0; i < enemies; i++) put(1, 'spearman');
  let t = 0;
  while (flag.owner !== 0 && t < 90) { g.updateCaptures(0.05); t += 0.05; }
  return { t, flag };
}

describe('flag capture', () => {
  it('follows T = 60 / N^0.6 capped at 10 units', () => {
    expect(g.captureSeconds(1)).toBeCloseTo(60, 5);
    expect(g.captureSeconds(5)).toBeCloseTo(60 / 5 ** 0.6, 5);
    expect(g.captureSeconds(20)).toBeCloseTo(g.captureSeconds(10), 5);
  });

  it('takes about 60 s with one unit and about 23 s with five', () => {
    expect(captureTime(1).t).toBeCloseTo(60, 0);
    expect(captureTime(5).t).toBeCloseTo(22.9, 0);
  });

  it('cannot be captured by scouts, and stops while both sides stand in range', () => {
    const scouts = captureTime(2, 'scout');
    expect(scouts.flag.owner).not.toBe(0);
    expect(scouts.flag.cap).toBe(0);
    const contested = captureTime(5, 'spearman', 2);
    expect(contested.flag.owner).not.toBe(0);
    expect(contested.flag.contested).toBe(true);
  });
});

describe('region vision', () => {
  it('shows the whole held region to its owner only, and moves with ownership', () => {
    const state = quietMatch(g), flag = nearestFlag(state, 0);
    let far = null, best = 0;
    for (let i = 0; i < g.regionMap.length; i++) if (g.regionMap[i] === flag.id) {
      const x = (i % g.MAP_TILES + 0.5) * g.TILE_SIZE, y = (Math.floor(i / g.MAP_TILES) + 0.5) * g.TILE_SIZE, d = Math.hypot(x - flag.cp.x, y - flag.cp.y);
      if (d > best) { best = d; far = { x, y }; }
    }
    expect(g.teamCanSee(0, far.x, far.y)).toBe(false);
    flag.owner = 0;
    expect(g.teamCanSee(0, far.x, far.y)).toBe(true);
    expect(g.teamCanSee(1, far.x, far.y)).toBe(false);
    flag.owner = 1;
    expect(g.teamCanSee(0, far.x, far.y)).toBe(false);
    expect(g.teamCanSee(1, far.x, far.y)).toBe(true);
  });
});
