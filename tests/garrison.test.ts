// @ts-nocheck
// Flag defence V3.1 (docs/features/flag-defense.md): garrison, flag gun, full sortie, return after 3 calm seconds.
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGame, quietMatch } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); });
const step = (seconds, dt = 0.05) => { for (let k = 0; k < Math.round(seconds / dt); k++) g.update(dt); };
// A flag far from both fortresses, held by `owner`, with every tile explored.
function heldFlag(state, owner = 0) {
  const r = state.regions.filter(q => q.cp && q.home == null).sort((a, b) => Math.min(...state.bases.map(s => Math.hypot(s.x - b.cp.x, s.y - b.cp.y))) - Math.min(...state.bases.map(s => Math.hypot(s.x - a.cp.x, s.y - a.cp.y))))[0];
  r.owner = owner; r.cap = 0; r.capTeam = -1; state.fogSeen.fill(1); state.enemyFogSeen.fill(1);
  return r;
}
const near = (r, dx, dy = 0) => ({ x: r.cp.x + dx, y: r.cp.y + dy });
function put(team, type, p) { const u = g.spawn(team, type); u.x = p.x; u.y = p.y; return u; }
function garrison(state, r, n) {
  const units = Array.from({ length: n }, (_, i) => put(0, i % 2 ? 'archer' : 'infantry', near(r, 120 + i * 6, 40)));
  g.applyAction(0, 'garrison', { ids: units.map(u => u.id), regionId: r.id });
  step(6);
  return units;
}

describe('garrison', () => {
  it('units walk in, vanish from the field (hidden, untargetable) and still eat', () => {
    const state = quietMatch(g), r = heldFlag(state), upkeep0 = g.upkeepPerMinute(0);
    const units = garrison(state, r, 6);
    expect(units.every(u => u.garrison === r.id)).toBe(true);
    expect(state.units.filter(u => u.team === 0)).toHaveLength(0);
    expect(g.garrisonOf(r)).toHaveLength(6);
    expect(g.upkeepPerMinute(0)).toBeCloseTo(upkeep0 + 3 * g.specs.infantry.upkeep + 3 * g.specs.archer.upkeep);
    const enemy = put(1, 'archer', near(r, 600)); // far away: no alarm, and nothing of the garrison to target
    expect(g.nearestEnemy(enemy)?.type).toBeUndefined();
  });

  it('only into a flag the side holds', () => {
    const state = quietMatch(g), r = heldFlag(state, 1), u = put(0, 'infantry', near(r, 80));
    g.applyAction(0, 'garrison', { ids: [u.id], regionId: r.id });
    step(3);
    expect(u.garrison == null).toBe(true);
    expect(state.units.includes(u)).toBe(true);
  });

  it('a held flag shoots one enemy within 180 for 10 damage every 2 s; a neutral flag does not', () => {
    const state = quietMatch(g), r = heldFlag(state), foe = put(1, 'cavalry', near(r, 170)), far = put(1, 'cavalry', near(r, -260));
    foe.order = far.order = 'hold'; const hp = foe.hp;
    step(4.6);
    expect(hp - foe.hp).toBeCloseTo(3 * g.FLAG_GUN.damage, 5); // shots at 0, 2 and 4 s (each lands ~0.5 s later)
    expect(far.hp).toBe(g.specs.cavalry.hp);
    r.owner = -1; const hp2 = foe.hp; step(3);
    expect(foe.hp).toBe(hp2);
  });
});

describe('full sortie and automatic return', () => {
  it('every defender comes out when an enemy nears, spread out, then walks back 3 calm seconds after', () => {
    const state = quietMatch(g), r = heldFlag(state), units = garrison(state, r, 8);
    const foe = put(1, 'scout', near(r, 170)); foe.order = 'hold';
    g.update(0.05);
    expect(g.garrisonOf(r)).toHaveLength(0);
    expect(units.every(u => state.units.includes(u) && u.order === 'sortie')).toBe(true);
    for (let i = 0; i < units.length; i++) for (let j = i + 1; j < units.length; j++) expect(Math.hypot(units[i].x - units[j].x, units[i].y - units[j].y)).toBeGreaterThan(15);
    expect(units.every(u => g.isWalkableAt(u.x, u.y))).toBe(true);
    // The defenders kill the scout; 3 s of calm later they head home and go back inside.
    for (let k = 0; k < 400 && state.units.includes(foe); k++) g.update(0.05);
    expect(state.units.includes(foe)).toBe(false);
    step(2.5);
    expect(r.defense.returning).toBe(false);
    step(1);
    expect(r.defense.returning || g.garrisonOf(r).length === units.length).toBe(true);
    step(8);
    expect(g.garrisonOf(r)).toHaveLength(units.length);
  });

  it('an enemy coming back within the 3 s cancels the countdown', () => {
    const state = quietMatch(g), r = heldFlag(state), units = garrison(state, r, 2);
    const foe = put(1, 'cavalry', near(r, 175)); foe.order = 'hold'; foe.hp = 1e6;
    g.update(0.05);
    expect(units.every(u => u.order === 'sortie')).toBe(true);
    foe.x = r.cp.x + 700; step(2);           // gone for 2 s…
    expect(r.defense.calm).toBeGreaterThan(1.5);
    foe.x = r.cp.x + 170; g.update(0.05);    // …and back: the countdown restarts
    expect(r.defense.calm).toBe(0);
    foe.x = r.cp.x + 700; step(2);
    expect(r.defense.returning).toBe(false);
    expect(units.every(u => u.order === 'sortie')).toBe(true);
  });

  it("the player's own order wins: that unit is not pulled back in", () => {
    const state = quietMatch(g), r = heldFlag(state), units = garrison(state, r, 3);
    const foe = put(1, 'scout', near(r, 170)); foe.order = 'hold';
    g.update(0.05);
    g.applyAction(0, 'move', { ids: [units[0].id], x: r.cp.x - 400, y: r.cp.y });
    expect(units[0].sortie).toBe(null);
    state.units = state.units.filter(u => u !== foe);
    step(14);
    expect(g.garrisonOf(r)).toHaveLength(2);
    expect(state.units.includes(units[0])).toBe(true);
  });

  it('a garrison inside stops capture; the owner can let everyone out', () => {
    const state = quietMatch(g), r = heldFlag(state);
    garrison(state, r, 2);
    for (let i = 0; i < 4; i++) put(1, 'infantry', near(r, 10 * i, 10)); // standing on the flag
    g.updateCaptures(5);
    expect(r.cap).toBe(0);
    state.units = state.units.filter(u => u.team !== 1);
    g.applyAction(0, 'garrisonExit', { regionId: r.id });
    expect(g.garrisonOf(r)).toHaveLength(0);
    expect(state.units.filter(u => u.team === 0 && u.order === 'hold')).toHaveLength(2);
  });
});
