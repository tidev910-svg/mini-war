// @ts-nocheck
// AI attack planner (docs/features/ai-opponent.md): gather → wave → retreat → regroup, home defence, difficulty pace.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loadGame, quietMatch } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); });
afterAll(() => g.setSetting('aiDifficulty', 'normal'));

// A quiet match with `n` red infantry, the blue fortress remembered by the AI, at second `t`.
function setup(n, t, level = 'normal') {
  g.setSetting('aiDifficulty', level);
  const state = quietMatch(g);
  const blue = state.bases[0];
  state.enemyMemory.base = { x: blue.x, y: blue.y, age: 0 };
  g.setGameTime(t);
  const units = Array.from({ length: n }, () => g.spawn(1, 'infantry'));
  for (const u of units) { u.x = blue.x; u.y = blue.y + 60; } // far from the AI's rally point
  return { state, units };
}
const moveTo = (units, p) => { for (const u of units) { u.x = p.x; u.y = p.y; } };

describe('AI attack planner', () => {
  it('waits for the first-attack time of its difficulty', () => {
    const { state } = setup(12, 300, 'easy');
    g.runAttackPlan();
    expect(state.aiPlan.phase).toBe('build'); // easy attacks from 420 s
    g.setSetting('aiDifficulty', 'hard');
    g.runAttackPlan();
    expect(state.aiPlan.phase).toBe('gather'); // hard from 180 s
  });

  it('gathers free fighters at a rally point, then launches a wave at the known fortress', () => {
    const { state, units } = setup(8, 280);
    g.runAttackPlan();
    const plan = state.aiPlan;
    expect(plan.phase).toBe('gather');
    expect(units.every(u => u.aiRole === 'rally')).toBe(true);
    g.runAttackPlan();
    expect(plan.phase).toBe('gather'); // not at the rally point yet
    moveTo(units, plan.rally);
    g.runAttackPlan();
    expect(plan.phase).toBe('attack');
    expect(plan.wave).toBe(1);
    expect(plan.target.kind).toBe('base');
    expect(units.every(u => u.aiRole === 'wave')).toBe(true);
    const goal = g.aiUnitGoal(units[0]);
    expect(Math.hypot(goal.x - state.bases[0].x, goal.y - state.bases[0].y)).toBeLessThan(g.structureReach(state.bases[0])); // beside the fortress (its tiles are blocked)
  });

  it('prefers a near enemy-held flag before the fortress on the first wave', () => {
    const { state, units } = setup(8, 280);
    const red = state.bases[1];
    const flag = state.regions.filter(r => r.cp && r.home == null).sort((a, b) => Math.hypot(a.cp.x - red.x, a.cp.y - red.y) - Math.hypot(b.cp.x - red.x, b.cp.y - red.y))[0];
    flag.owner = 0;
    for (let i = 0; i < state.enemyFogSeen.length; i++) state.enemyFogSeen[i] = 1;
    g.runAttackPlan();
    moveTo(units, state.aiPlan.rally);
    g.runAttackPlan();
    expect(state.aiPlan.target).toMatchObject({ kind: 'region', id: flag.id });
    // Once the flag is the AI's, the wave moves on to the next target.
    flag.owner = 1; flag.cap = null;
    g.runAttackPlan();
    expect(state.aiPlan.target.kind).toBe('base');
  });

  it('retreats when most of the wave is lost and regroups before the next wave', () => {
    const { state, units } = setup(10, 280);
    g.runAttackPlan(); moveTo(units, state.aiPlan.rally); g.runAttackPlan();
    expect(state.aiPlan.phase).toBe('attack');
    state.units = state.units.filter(u => !units.slice(0, 7).includes(u)); // 3 of 10 left (normal retreats at 30%)
    g.runAttackPlan();
    expect(state.aiPlan.phase).toBe('regroup');
    expect(units.slice(7).every(u => u.aiRole === 'retreat')).toBe(true);
    expect(state.aiPlan.nextWaveAt).toBe(280 + 120);
    // Back home, the role clears; the next wave needs more fighters (8 + 3).
    moveTo(units.slice(7), state.bases[1]);
    for (const u of units.slice(7)) expect(g.aiUnitGoal(u)).toBe(null);
    g.setGameTime(400); g.runAttackPlan();
    expect(state.aiPlan.phase).toBe('gather');
  });

  it('pulls free units back to defend when enemies are seen near home', () => {
    const { state, units } = setup(4, 60);
    const red = state.bases[1];
    state.enemyMemory.targets = [{ id: 901, x: red.x + 150, y: red.y, age: 1 }, { id: 902, x: red.x + 170, y: red.y + 20, age: 1 }];
    g.runAttackPlan();
    expect(units.every(u => u.aiRole === 'defend')).toBe(true);
    expect(g.aiUnitGoal(units[0]).x).toBeCloseTo(red.x + 160);
    state.enemyMemory.targets = [];
    g.runAttackPlan();
    expect(units.every(u => !u.aiRole)).toBe(true);
  });

  it('keeps capture squads and builders out of the wave', () => {
    const { state, units } = setup(9, 280);
    units[0].captureTarget = 3; units[1].buildTarget = 77;
    g.runAttackPlan();
    expect(units[0].aiRole).toBeFalsy();
    expect(units[1].aiRole).toBeFalsy();
    expect(units.slice(2).every(u => u.aiRole === 'rally')).toBe(true);
    expect(state.aiPlan.phase).toBe('gather');
  });
});
