// @ts-nocheck
// Balance V3.1 incomes (fortress, territories, farms) and the V2 training lanes (parallel lanes, buying lanes)
// (docs/features/economy.md, units.md). Income numbers are V3.1; lane prices are provisional (QUEUE_LANE_UPGRADES).
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGame, quietMatch } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); });
const step = (seconds, dt = 0.05) => { for (let k = 0; k < Math.round(seconds / dt); k++) g.update(dt); };
const zero = () => ({ food: 0, wood: 0, stone: 0, gold: 0 });
const neutralAll = state => { for (const r of state.regions) if (r.home == null) r.owner = -1; };

describe('income (V3.1)', () => {
  it('pays 40 food, 30 wood, 10 stone, 10 gold per minute per fortress with no territory', () => {
    const state = quietMatch(g); neutralAll(state);
    state.resources = [zero(), zero()];
    step(120);
    for (const res of state.resources) {
      expect(res.food).toBeCloseTo(80, 1);
      expect(res.wood).toBeCloseTo(60, 1);
      expect(res.stone).toBeCloseTo(20, 1);
      expect(res.gold).toBeCloseTo(20, 1);
    }
    expect(g.foodPerMinute(0)).toBe(40);
  });

  it('a held wood region adds 45 wood/min to its owner only, and moves fully when the flag changes hands', () => {
    const state = quietMatch(g); neutralAll(state);
    const region = state.regions[state.mines.find(m => m.resource === 'wood').regionId];
    region.owner = 0; state.resources = [zero(), zero()];
    step(60);
    expect(state.resources[0].wood).toBeCloseTo(30 + 45, 0);
    expect(state.resources[1].wood).toBeCloseTo(30, 0);
    region.owner = 1; state.resources = [zero(), zero()];
    step(60);
    expect(state.resources[0].wood).toBeCloseTo(30, 0);
    expect(state.resources[1].wood).toBeCloseTo(30 + 45, 0);
  });

  it('gives every territory of a type the same rate: 45 food, 45 wood, 35 stone, 35 gold per minute', () => {
    const rates = { food: 45, wood: 45, stone: 35, gold: 35 };
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

  it('adds up: 2 wood, 1 stone, 1 gold territories give 40 / 120 / 45 / 45 per minute', () => {
    let state, owned = [];
    for (let k = 0; k < 20 && owned.length < 4; k++) {
      state = quietMatch(g);
      const pick = (type, n) => state.mines.filter(m => m.resource === type).slice(0, n);
      owned = [...pick('wood', 2), ...pick('stone', 1), ...pick('gold', 1)];
    }
    expect(owned).toHaveLength(4);
    neutralAll(state);
    for (const m of owned) state.regions[m.regionId].owner = 0;
    state.resources[0] = zero();
    step(60);
    const res = state.resources[0];
    expect(res.food).toBeCloseTo(40, 0); expect(res.wood).toBeCloseTo(120, 0);
    expect(res.stone).toBeCloseTo(45, 0); expect(res.gold).toBeCloseTo(45, 0);
  });

  it('a working farm (120 wood) adds 35 food/min after its 3-second build; levels make 35 / 50 / 70 in total', () => {
    const state = quietMatch(g); neutralAll(state);
    state.resources[0] = { food: 0, wood: 500, stone: 0, gold: 0 };
    const b = state.bases[0], spot = g.findBuildSpot(0, 'farm', b.x, b.y, 150, 600);
    const farm = g.placeBuilding(0, 'farm', spot.x, spot.y);
    expect(state.resources[0].wood).toBe(380);
    step(3.05);
    expect(farm.progress).toBe(1);
    const inFoodRegion = g.regionAt(farm.x, farm.y)?.resource === 'food' && g.regionAt(farm.x, farm.y)?.owner === 0;
    expect(g.foodPerMinute(0)).toBeCloseTo(40 + 35 * (inFoodRegion ? 1.25 : 1));
    expect(g.FARM_LEVELS.slice(1).map(l => l.food)).toEqual([35, 50, 70]);
  });
});

describe('training lanes (V2)', () => {
  it('starts each side with 4 lanes that train in parallel', () => {
    const state = quietMatch(g);
    expect(g.lanesOf(0)).toBe(4); expect(g.lanesOf(1)).toBe(4);
    state.resources[0] = { food: 2000, wood: 2000, stone: 0, gold: 2000 };
    const count = () => state.units.filter(u => u.team === 0).length;
    for (let i = 0; i < 4; i++) g.buy('infantry', 0);
    expect(state.resources[0].food).toBe(2000 - 4 * 55);
    step(4.9); expect(count()).toBe(0);
    step(0.15); expect(count()).toBe(4);
  });

  it('a fifth unit waits for a free lane; capacity is lanes + 4 waiting', () => {
    const state = quietMatch(g);
    state.resources[0] = { food: 5000, wood: 5000, stone: 0, gold: 5000 };
    for (let i = 0; i < 9; i++) g.buy('infantry', 0);
    expect(g.trainQueueOf(0)).toHaveLength(4 + g.TRAIN_QUEUE_WAITING);
    expect(g.buyProblem('infantry', 0)).toMatch(/đầy/);
    step(5.05);
    expect(state.units.filter(u => u.team === 0)).toHaveLength(4);
    expect(g.trainQueueOf(0)).toHaveLength(4);
    state.trainQueue = [];
    g.buy('scout', 0); g.buy('scout', 0);
    expect(g.buyProblem('scout', 0)).toMatch(/tối đa 2 lính trinh sát/);
  });

  it('opening lane 5 without enough resources changes nothing', () => {
    const state = quietMatch(g);
    state.resources[0] = { food: 0, wood: 199, stone: 100, gold: 0 };
    expect(g.buyQueueLane(0)).toBe(false);
    expect(state.resources[0]).toEqual({ food: 0, wood: 199, stone: 100, gold: 0 });
    expect(g.laneUpgradeOf(0)).toBeNull();
    expect(g.lanesOf(0)).toBe(4);
  });

  it('opening lane 5 charges once, takes 15 s, and does not reset units in training', () => {
    const state = quietMatch(g);
    state.resources[0] = { food: 1000, wood: 1000, stone: 1000, gold: 1000 };
    g.buy('cavalry', 0); // 12 s
    step(2);
    const before = { ...state.resources[0] };
    expect(g.buyQueueLane(0)).toBe(true);
    expect(state.resources[0].wood).toBe(before.wood - 200); expect(state.resources[0].stone).toBe(before.stone - 100);
    expect(state.resources[0].gold).toBe(before.gold);
    expect(g.buyQueueLane(0)).toBe(false); // already opening: nothing charged again
    expect(state.resources[0].wood).toBe(before.wood - 200);
    const left = g.trainQueueOf(0)[0].left;
    expect(left).toBeCloseTo(10, 1);
    step(14.9); expect(g.lanesOf(0)).toBe(4);
    step(0.15); expect(g.lanesOf(0)).toBe(5); expect(g.laneUpgradeOf(0)).toBeNull();
    expect(state.units.filter(u => u.team === 0 && u.type === 'cavalry')).toHaveLength(1);
    expect(g.nextLaneOffer(0)).toMatchObject({ lane: 6, cost: { wood: 350, stone: 150, gold: 50 }, seconds: 20 });
  });

  it('never blocks training because of the army size', () => {
    const state = quietMatch(g);
    state.resources[0] = { food: 5000, wood: 5000, stone: 0, gold: 5000 };
    for (let i = 0; i < 160; i++) state.units.push({ id: 10000 + i, team: 0, type: 'infantry', hp: 100, max: 100, x: 0, y: 0 });
    expect(g.buyProblem('infantry', 0)).toBe('');
  });
});
