// @ts-nocheck
// Match statistics recorded into state.stats (docs/features/match-stats.md).
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGame, quietMatch } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); });
const step = (seconds, dt = 0.05) => { for (let k = 0; k < Math.round(seconds / dt); k++) g.update(dt); };

describe('match statistics', () => {
  it('counts gathered income, spending, trained units and timeline samples', () => {
    const state = quietMatch(g);
    for (const r of state.regions) if (r.home == null) r.owner = -1;
    state.resources[0] = { food: 500, wood: 500, stone: 0, gold: 0 };
    step(60);
    const s0 = state.stats.sides[0];
    expect(s0.gathered.food).toBeCloseTo(40, 0); expect(s0.gathered.wood).toBeCloseTo(30, 0);
    expect(s0.gathered.stone).toBeCloseTo(10, 0); expect(s0.gathered.gold).toBeCloseTo(10, 0);
    g.buy('infantry', 0); g.buy('spearman', 0);
    expect(s0.spent).toMatchObject({ food: 100, wood: 15 });
    step(6.1);
    expect(s0.trained).toBe(2);
    expect(state.stats.timeline.length).toBeGreaterThanOrEqual(7); // one sample at the start, then every 10 s
    expect(state.stats.timeline.at(-1).army[0]).toBeGreaterThanOrEqual(0);
  });

  it('counts kills, losses and damage on both sides', () => {
    const state = quietMatch(g);
    const a = g.spawn(0, 'cavalry'), b = g.spawn(1, 'infantry');
    b.hp = 30;
    g.hurt(b, 24, 0, 'cavalry'); // 24 damage
    g.hurt(b, 24, 0, 'cavalry'); // only the remaining 6 count as damage dealt
    expect(state.units.includes(b)).toBe(false);
    expect(state.stats.sides[0].killed).toBe(1);
    expect(state.stats.sides[1].lost).toBe(1);
    expect(state.stats.sides[0].damage).toBeCloseTo(30);
    g.deleteUnits(0, [a.id]);
    expect(state.stats.sides[0].lost).toBe(1);
    expect(state.stats.sides[1].killed).toBe(0);
  });

  it('renders the result table and charts when the match ends', () => {
    quietMatch(g);
    step(20);
    g.finish(true);
    const box = document.getElementById('matchStats');
    expect(box.querySelectorAll('.stat-table tbody tr').length).toBeGreaterThanOrEqual(10);
    expect(box.querySelectorAll('.stat-chart polyline').length).toBe(4);
  });
});
