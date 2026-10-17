// @ts-nocheck
// Map generation (docs/features/territory.md): exactly 20 flag regions, one mine each, every resource near each fortress.
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGame } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); });

describe('generated maps', () => {
  it('always have 20 flag regions, 2 home regions and one matching mine per flag region', () => {
    for (let k = 0; k < 8; k++) {
      g.fresh();
      const flags = g.state.regions.filter(r => r.cp), homes = g.state.regions.filter(r => r.home !== null);
      expect(flags).toHaveLength(g.REGION_COUNT);
      expect(homes).toHaveLength(2);
      for (const r of flags) expect(g.state.mines.filter(m => m.regionId === r.id && m.resource === r.resource)).toHaveLength(1);
      expect(g.state.mines.filter(m => g.state.regions[m.regionId].home !== null)).toHaveLength(0);
    }
  });

  it('give each fortress all four resources among its four nearest flags (walking cost)', () => {
    for (let k = 0; k < 8; k++) {
      g.fresh();
      const flags = g.state.regions.filter(r => r.cp), walk = g.state.bases.map(g.walkDistances);
      const tile = v => Math.max(1, Math.min(g.MAP_TILES - 2, Math.floor(v / g.TILE_SIZE)));
      for (const team of [0, 1]) {
        const cost = r => walk[team][tile(r.cp.y) * g.MAP_TILES + tile(r.cp.x)];
        const nearest = flags.slice().sort((a, b) => cost(a) - cost(b)).slice(0, 4);
        expect(new Set(nearest.map(r => r.resource)).size).toBe(4);
      }
    }
  });

  it('place the fortresses apart, on clear ground, facing each other', () => {
    for (let k = 0; k < 8; k++) {
      g.fresh();
      const [b0, b1] = g.state.bases;
      expect(Math.hypot(b0.x - b1.x, b0.y - b1.y)).toBeGreaterThanOrEqual(g.W * g.BASE_MIN_SEPARATION);
      expect(b0.dir).toBe(Math.sign(b1.x - b0.x || 1));
      expect(b1.dir).toBe(-b0.dir);
      expect(g.state.bases.every(g.baseSiteClear)).toBe(true);
    }
  });
});
