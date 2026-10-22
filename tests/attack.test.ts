// @ts-nocheck
// Targeting only what the side sees, and the attack order marching on known targets (decision 8.4, 2026-10-22).
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGame, quietMatch } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); });
const step = (seconds, dt = 0.05) => { for (let k = 0; k < Math.round(seconds / dt); k++) g.update(dt); };
// An open spot far from both fortresses and every flag.
function quietSpot(state, away = 1300) {
  for (let y = 900; y < g.H - 900; y += 250) for (let x = 900; x < g.W - 900; x += 250) {
    if (state.bases.every(b => Math.hypot(b.x - x, b.y - y) > away) && state.regions.every(r => !r.cp || Math.hypot(r.cp.x - x, r.cp.y - y) > away) && g.isWalkableAt(x, y) && g.isWalkableAt(x + 300, y)) return { x, y };
  }
  throw new Error('no quiet spot');
}
const put = (team, type, p) => { const u = g.spawn(team, type); u.x = p.x; u.y = p.y; u.order = 'hold'; return u; };
const feed = () => document.getElementById('feed').firstElementChild?.textContent || '';

describe('targets only what the side sees', () => {
  it('in the AI mode the player no longer locks on to enemies in the fog — same rule for both sides', () => {
    const state = quietMatch(g); g.setMode('ai');
    const p = quietSpot(state), blue = put(0, 'infantry', p), red = put(1, 'infantry', { x: p.x + 700, y: p.y });
    expect(g.nearestEnemy(blue)).not.toBe(red);
    expect(g.nearestEnemy(red)).not.toBe(blue);
    red.x = p.x + 250; // inside 320 sight
    expect(g.nearestEnemy(blue)).toBe(red);
    expect(g.nearestEnemy(red)).toBe(blue);
    g.setMode('test');
  });

  it('the enemy fortress and buildings are only targets while seen', () => {
    const state = quietMatch(g), p = quietSpot(state), blue = put(0, 'cavalry', p);
    const farm = { id: 6101, kind: 'farm', team: 1, x: p.x + 600, y: p.y, hp: 180, max: 180, level: 1, progress: 1, upgrade: null };
    state.buildings.push(farm);
    expect(g.nearestEnemy(blue)).toBe(null);
    blue.x = p.x + 300;
    expect(g.nearestEnemy(blue)).toBe(farm);
  });
});

describe('attack order with nothing in sight', () => {
  it('marches on the nearest known enemy target, then fights it', () => {
    const state = quietMatch(g), p = quietSpot(state);
    const farm = { id: 6102, kind: 'farm', team: 1, x: p.x + 900, y: p.y, hp: 180, max: 180, level: 1, progress: 1, upgrade: null };
    state.buildings.push(farm);
    const scout = put(0, 'scout', { x: farm.x - 300, y: farm.y }); g.update(0.05); // a scout spots the farm…
    state.units = state.units.filter(u => u !== scout); g.update(0.05);              // …and is gone
    const units = [0, 1, 2].map(i => put(0, 'infantry', { x: p.x, y: p.y + i * 20 }));
    g.applyAction(0, 'attack', { ids: units.map(u => u.id) });
    expect(feed()).toContain('tiến tới nông trại địch');
    const d0 = Math.hypot(units[0].x - farm.x, units[0].y - farm.y);
    step(6);
    expect(Math.hypot(units[0].x - farm.x, units[0].y - farm.y)).toBeLessThan(d0 - 150);
    step(40);
    expect(state.buildings.includes(farm)).toBe(false); // reached, seen, destroyed
  });

  it('with nothing known the units wait and the player is told to scout', () => {
    const state = quietMatch(g), p = quietSpot(state), u = put(0, 'infantry', p);
    g.update(0.05);
    g.applyAction(0, 'attack', { ids: [u.id] });
    expect(feed()).toContain('chưa phát hiện địch');
    step(3);
    expect(Math.hypot(u.x - p.x, u.y - p.y)).toBeLessThan(25);
  });

  it('a building destroyed out of sight stays known until its spot is seen empty', () => {
    const state = quietMatch(g), p = quietSpot(state);
    const farm = { id: 6103, kind: 'farm', team: 1, x: p.x, y: p.y, hp: 180, max: 180, level: 1, progress: 1, upgrade: null };
    state.buildings.push(farm);
    const scout = put(0, 'scout', { x: p.x - 200, y: p.y }); g.updateKnowledge();
    scout.x -= 1500; state.buildings = state.buildings.filter(b => b !== farm); g.updateKnowledge();
    expect(g.nearestKnownTarget(0, p.x, p.y)?.key).toBe('b6103');
    scout.x = p.x - 200; g.updateKnowledge();
    expect(g.nearestKnownTarget(0, p.x, p.y)?.key).not.toBe('b6103');
  });
});
