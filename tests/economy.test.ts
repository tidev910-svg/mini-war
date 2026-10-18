// @ts-nocheck
// Fortress income, mine rates and the training queue (docs/features/economy.md, units.md).
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGame, quietMatch } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); });
const step = (seconds, dt = 0.05) => { for (let k = 0; k < Math.round(seconds / dt); k++) g.update(dt); };

describe('income', () => {
  it('pays 25 food, 20 wood, 8 stone, 8 gold per minute per fortress with no territory', () => {
    const state = quietMatch(g);
    state.resources = [{ food: 0, wood: 0, stone: 0, gold: 0 }, { food: 0, wood: 0, stone: 0, gold: 0 }];
    step(120);
    for (const res of state.resources) {
      expect(res.food).toBeCloseTo(50, 1);
      expect(res.wood).toBeCloseTo(40, 1);
      expect(res.stone).toBeCloseTo(16, 1);
      expect(res.gold).toBeCloseTo(16, 1);
    }
    expect(g.foodPerMinute(0)).toBe(25);
  });

  it('pays a held mine to its owner only', () => {
    const state = quietMatch(g);
    const mine = state.mines.find(m => m.resource === 'stone'), region = state.regions[mine.regionId];
    region.owner = 0;
    const before = state.resources.map(r => r.stone);
    step(60);
    expect(state.resources[0].stone - before[0]).toBeCloseTo(8 + 20, 0);
    expect(state.resources[1].stone - before[1]).toBeCloseTo(8, 0);
  });

  it('gives every territory of a type the same fixed rate (no rich mines)', () => {
    const rates = { food: 25, wood: 30, stone: 20, gold: 20 };
    for (let k = 0; k < 5; k++) {
      const state = quietMatch(g);
      const flags = state.regions.filter(r => r.cp);
      expect(flags).toHaveLength(20);
      for (const r of flags) {
        const ms = state.mines.filter(m => m.regionId === r.id);
        expect(ms).toHaveLength(1);
        expect(ms[0].income * 60).toBeCloseTo(rates[r.resource]);
      }
    }
  });

  it('matches the document example: 2 wood, 1 stone, 1 gold territories give 25 / 80 / 28 / 28 per minute', () => {
    let state, owned = [];
    for (let k = 0; k < 20 && owned.length < 4; k++) {
      state = quietMatch(g);
      const pick = (type, n) => state.mines.filter(m => m.resource === type).slice(0, n);
      owned = [...pick('wood', 2), ...pick('stone', 1), ...pick('gold', 1)];
    }
    expect(owned).toHaveLength(4);
    for (const r of state.regions) if (r.home == null) r.owner = -1;
    for (const m of owned) state.regions[m.regionId].owner = 0;
    state.resources[0] = { food: 0, wood: 0, stone: 0, gold: 0 };
    step(60);
    const res = state.resources[0];
    expect(res.food).toBeCloseTo(25, 0); expect(res.wood).toBeCloseTo(80, 0);
    expect(res.stone).toBeCloseTo(28, 0); expect(res.gold).toBeCloseTo(28, 0);
  });

  it('uses the v1 mine rates', () => {
    expect(g.MINE_TYPES.food.perSecond * 60).toBeCloseTo(25);
    expect(g.MINE_TYPES.wood.perSecond * 60).toBeCloseTo(30);
    expect(g.MINE_TYPES.stone.perSecond * 60).toBeCloseTo(20);
    expect(g.MINE_TYPES.gold.perSecond * 60).toBeCloseTo(20);
  });
});

describe('training queue', () => {
  it('charges when queued and deploys after the training time, one unit at a time', () => {
    const state = quietMatch(g);
    state.resources[0] = { food: 2000, wood: 2000, stone: 0, gold: 2000 };
    const count = () => state.units.filter(u => u.team === 0).length;
    g.buy('infantry', 0);
    expect(state.resources[0].food).toBe(2000 - 45);
    expect(state.resources[0].gold).toBe(2000);
    step(4.9); expect(count()).toBe(0);
    step(0.1); expect(count()).toBe(1);
    g.buy('spearman', 0); g.buy('archer', 0);
    step(6); expect(count()).toBe(2);
    step(7.9); expect(count()).toBe(2);
    step(0.1); expect(count()).toBe(3);
  });

  it('holds at most TRAIN_QUEUE_MAX units and counts queued scouts toward the limit of 2', () => {
    const state = quietMatch(g);
    state.resources[0] = { food: 5000, wood: 5000, stone: 0, gold: 5000 };
    for (let i = 0; i < 7; i++) g.buy('infantry', 0);
    expect(g.trainQueueOf(0)).toHaveLength(g.TRAIN_QUEUE_MAX);
    expect(g.buyProblem('infantry', 0)).toMatch(/đầy/);
    state.trainQueue = [];
    g.buy('scout', 0); g.buy('scout', 0);
    expect(g.buyProblem('scout', 0)).toMatch(/tối đa 2 lính trinh sát/);
  });
});
