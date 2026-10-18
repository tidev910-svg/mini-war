// @ts-nocheck
// Construction (docs/features/buildings.md): build time and hit points grow from 20% to full while building.
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGame, quietMatch } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); });

describe('construction', () => {
  it('finishes a farm in 3 s with full hit points', () => {
    const state = quietMatch(g);
    state.resources[0] = { food: 0, wood: 1000, stone: 0, gold: 0 };
    const base = state.bases[0];
    let farm = null;
    for (let i = 0; i < 40 && !farm; i++) {
      const spot = g.findBuildSpot(0, 'farm', base.x, base.y, g.TILE_SIZE * 4, g.TILE_SIZE * 12);
      if (spot) farm = g.placeBuilding(0, 'farm', spot.x, spot.y);
    }
    expect(farm).toBeTruthy();
    expect(farm.hp).toBeCloseTo(farm.max * 0.2);
    for (let i = 0; i < 30; i++) g.update(0.05);
    expect(farm.progress).toBeCloseTo(0.5, 1);
    expect(farm.hp).toBeCloseTo(farm.max * 0.6, 0);
    for (let i = 0; i < 30; i++) g.update(0.05);
    expect(farm.progress).toBe(1);
    expect(farm.hp).toBeCloseTo(farm.max, 0);
  });
});
