// @ts-nocheck
// Fog of war V3.1 (docs/features/fog-of-war.md): sight radii, three states, last-seen memory in the veil.
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGame, quietMatch } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); });
// A point at least `away` from both fortresses and every flag, inside the map.
function quietSpot(state, away = 1400) {
  for (let y = 900; y < g.H - 900; y += 300) for (let x = 900; x < g.W - 900; x += 300) {
    const p = { x, y };
    if (state.bases.every(b => Math.hypot(b.x - x, b.y - y) > away) && state.regions.every(r => !r.cp || Math.hypot(r.cp.x - x, r.cp.y - y) > away)) return p;
  }
  throw new Error('no quiet spot');
}

describe('sight radii', () => {
  it('uses the V3.1 table for every unit type, the same for both sides', () => {
    expect(g.UNIT_VISION).toEqual({ scout: 500, infantry: 320, spearman: 320, archer: 360, cavalry: 420 });
    expect(g.BUILDING_VISION).toBe(350);
    const state = quietMatch(g), p = quietSpot(state);
    for (const team of [0, 1]) for (const [type, r] of Object.entries(g.UNIT_VISION)) {
      state.units = []; const u = g.spawn(team, type); u.x = p.x; u.y = p.y;
      expect(g.teamCanSee(team, p.x + r - 2, p.y)).toBe(true);
      expect(g.teamCanSee(team, p.x + r + 2, p.y)).toBe(false);
      expect(g.teamCanSee(1 - team, p.x, p.y)).toBe(false);
    }
  });

  it('own fortress and buildings (also while being built) see 350', () => {
    const state = quietMatch(g), base = state.bases[0];
    expect(g.teamCanSee(0, base.x + 348, base.y)).toBe(true);
    expect(g.teamCanSee(0, base.x + 352, base.y)).toBe(false);
    const p = quietSpot(state);
    state.buildings.push({ id: 7001, kind: 'farm', team: 0, x: p.x, y: p.y, hp: 36, max: 180, level: 1, progress: 0, upgrade: null });
    expect(g.teamCanSee(0, p.x, p.y - 348)).toBe(true);
    expect(g.teamCanSee(0, p.x, p.y - 352)).toBe(false);
  });
});

describe('three states', () => {
  it('seen ground becomes explored and stays explored, but is no longer seen once the unit leaves', () => {
    const state = quietMatch(g), p = quietSpot(state), N = g.MAP_TILES, tile = (x, y) => Math.floor(y / g.TILE_SIZE) * N + Math.floor(x / g.TILE_SIZE);
    const u = g.spawn(0, 'scout'); u.x = p.x; u.y = p.y;
    const spot = { x: p.x + 480, y: p.y };
    expect(state.fogSeen[tile(spot.x, spot.y)]).toBe(0);
    g.revealTeamVision(0);
    expect(state.fogSeen[tile(spot.x, spot.y)]).toBe(1);
    expect(g.teamCanSee(0, spot.x, spot.y)).toBe(true);
    u.x -= 1200; g.revealTeamVision(0);
    expect(state.fogSeen[tile(spot.x, spot.y)]).toBe(1); // never dark again
    expect(g.teamCanSee(0, spot.x, spot.y)).toBe(false); // veiled: enemy units there are hidden
  });
});

describe('last-seen memory in the veil (render/intel.ts)', () => {
  it('remembers enemy buildings and flags as last seen, and forgets a building seen to be gone', () => {
    const state = quietMatch(g), p = quietSpot(state);
    const scout = g.spawn(0, 'scout'); scout.x = p.x; scout.y = p.y;
    const farm = { id: 7002, kind: 'farm', team: 1, x: p.x + 200, y: p.y, hp: 180, max: 180, level: 1, progress: 1, upgrade: null };
    state.buildings.push(farm);
    const flag = state.regions.find(r => r.cp && r.home == null); flag.owner = -1; flag.cap = 0;
    const far = { x: flag.cp.x, y: flag.cp.y };
    scout.x = far.x; scout.y = far.y; g.updateIntel();       // the scout sees the neutral flag
    scout.x = p.x; scout.y = p.y; g.updateIntel();           // and walks away
    flag.owner = 1;                                           // the enemy takes it out of sight
    g.updateIntel();
    expect(g.knownFlag(flag).owner).toBe(-1);
    expect(g.knownRegionOwner(flag)).toBe(-1);
    expect(g.ghostBuildings()).toHaveLength(0);               // the farm is seen right now, drawn live
    scout.x = p.x - 1500; g.updateIntel();
    expect(g.ghostBuildings().map(b => b.id)).toContain(7002);
    farm.hp = 0; state.buildings = state.buildings.filter(b => b !== farm); g.updateIntel();
    expect(g.ghostBuildings().map(b => b.id)).toContain(7002); // destroyed out of sight: still remembered
    scout.x = p.x; g.updateIntel();
    expect(g.ghostBuildings().map(b => b.id)).not.toContain(7002); // seen empty: forgotten
    scout.x = far.x; scout.y = far.y; g.updateIntel();
    expect(g.knownFlag(flag).owner).toBe(1);                 // seen again: up to date
  });
});
