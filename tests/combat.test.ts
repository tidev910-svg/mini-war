// @ts-nocheck
// Combat V3.1 (damage only): base damage, counter multipliers, structure multipliers and gun damage (docs/features/combat.md).
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGame, quietMatch } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); });
// A bare target of a unit type with plenty of health, so one hit never kills it.
const dummy = (type, team = 1) => ({ id: 90000 + Math.floor(Math.random() * 1e6), team, type, x: 4800, y: 4800, hp: 1000, max: 1000 });
const loss = (target, attacker) => { const before = target.hp; g.hurt(target, g.specs[attacker]?.damage ?? 10, 0, attacker); return +(before - target.hp).toFixed(4); };

describe('Combat V3.1 damage', () => {
  it('uses the V3.1 base damage per hit', () => {
    expect(Object.fromEntries(Object.entries(g.specs).map(([k, s]) => [k, s.damage]))).toEqual({ scout: 7, infantry: 14, archer: 16, spearman: 12, cavalry: 24 });
    expect(g.BUILDING_TYPES.tower.gun.damage).toBe(30);
    expect(g.BUILDING_TYPES.outpost.gun.damage).toBe(12);
    expect(g.FORTRESS_GUN_DAMAGE).toEqual([18, 45]);
  });

  it('applies the counter multipliers between units, ×1 otherwise', () => {
    quietMatch(g);
    expect(loss(dummy('cavalry'), 'spearman')).toBeCloseTo(12 * 2.2);
    expect(loss(dummy('archer'), 'cavalry')).toBeCloseTo(24 * 1.5);
    expect(loss(dummy('spearman'), 'archer')).toBeCloseTo(16 * 1.3);
    expect(loss(dummy('spearman'), 'infantry')).toBeCloseTo(14 * 1.2);
    expect(loss(dummy('infantry'), 'cavalry')).toBeCloseTo(24);
    expect(loss(dummy('cavalry'), 'archer')).toBeCloseTo(16);
    expect(loss(dummy('scout'), 'scout')).toBeCloseTo(7);
  });

  it('uses only the structure multiplier against buildings and fortresses', () => {
    const state = quietMatch(g);
    const farm = { id: 91000, kind: 'farm', team: 1, x: 4000, y: 4000, hp: 1000, max: 1000, level: 1, progress: 1 };
    state.buildings.push(farm);
    const want = { scout: 0.5, infantry: 1.1, spearman: 1, archer: 0.6, cavalry: 0.8 };
    for (const [type, m] of Object.entries(want)) expect(loss(farm, type)).toBeCloseTo(g.specs[type].damage * m);
    const fortress = state.bases[1], before = fortress.hp;
    g.hurt(fortress, g.specs.spearman.damage, 0, 'spearman'); // no ×2.2 stacking on structures
    expect(before - fortress.hp).toBeCloseTo(12);
    g.hurt(fortress, 30, 0, null); // gun shots: no multiplier
    expect(before - fortress.hp).toBeCloseTo(42);
  });

  it('fires 18 damage from the fortress main gun and 45 from the second gun', () => {
    const state = quietMatch(g);
    const base = state.bases[0];
    base.guns[1].active = true;
    const shots = [];
    for (const idx of [0, 1]) {
      const p = g.fortressGunPosition(base, idx), u = g.spawn(1, 'cavalry', p.x, p.y, false) || g.spawn(1, 'cavalry');
      u.x = p.x + 40; u.y = p.y; u.hp = u.max = 100000;
    }
    for (let k = 0; k < 40 && shots.length < 2; k++) { g.update(0.05); for (const b of state.bullets) if (b.team === 0 && !shots.includes(b.damage)) shots.push(b.damage); }
    expect(shots.sort((a, b) => a - b)).toEqual([18, 45]);
  });
});
