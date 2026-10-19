// @ts-nocheck
// Army formations (docs/features/formations.md, spec V3.1 "Hệ thống đội hình").
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGame, quietMatch } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); g.buildWalkable(); });
const T = () => g.TILE_SIZE, N = () => g.MAP_TILES;
const step = (seconds, dt = 0.05) => { for (let k = 0; k < Math.round(seconds / dt); k++) g.update(dt); };
const army = (spec) => { let id = 0; return Object.entries(spec).flatMap(([type, n]) => Array.from({ length: n }, () => ({ id: ++id, type }))); };
const pick = (slots, list, t) => list.filter(u => u.type === t).map(u => slots[u.id]);

// An open square of land (terrain only), at least r tiles around, far from both fortresses.
function openPatch(state, r) {
  for (let gy = 30; gy < N() - 30; gy += 5) for (let gx = 30; gx < N() - 30; gx += 5) {
    let ok = true; for (let y = gy - r; y <= gy + r && ok; y++) for (let x = gx - r; x <= gx + r; x++) if (!g.walkable[y * N() + x]) { ok = false; break; }
    const p = { x: (gx + 0.5) * T(), y: (gy + 0.5) * T() };
    if (ok && state.bases.every(b => Math.hypot(b.x - p.x, b.y - p.y) > 900)) return p;
  }
  throw new Error('no open patch');
}
function squad(state, spec, at) {
  const units = Object.entries(spec).flatMap(([type, n]) => Array.from({ length: n }, () => g.spawn(0, type)));
  units.forEach((u, i) => { u.x = at.x + (i % 6) * 22 - 55; u.y = at.y + Math.floor(i / 6) * 22 - 40; });
  state.fogSeen.fill(1);
  return units;
}

describe('formation layouts', () => {
  it('Phòng thủ: spearmen and infantry in front, archers behind, cavalry on both wings', () => {
    const list = army({ spearman: 4, infantry: 6, archer: 5, cavalry: 4 }), s = g.formationLayout('defense', list);
    const front = [...pick(s, list, 'spearman'), ...pick(s, list, 'infantry')], arch = pick(s, list, 'archer'), cav = pick(s, list, 'cavalry');
    expect(Math.max(...arch.map(p => p.f))).toBeLessThan(Math.min(...front.map(p => p.f)));
    expect(Math.min(...pick(s, list, 'spearman').map(p => p.f))).toBeGreaterThanOrEqual(Math.max(...pick(s, list, 'infantry').map(p => p.f)) - 1e-6);
    const frontHalf = Math.max(...front.map(p => Math.abs(p.r)));
    expect(cav.every(p => Math.abs(p.r) > frontHalf)).toBe(true);
    expect(cav.filter(p => p.r < 0).length).toBe(2);
  });

  it('Mũi nhọn: infantry tip in front, spearmen on the outer edges, archers behind', () => {
    const list = army({ spearman: 4, infantry: 6, archer: 3, cavalry: 2 }), s = g.formationLayout('wedge', list);
    const all = Object.values(s), tip = all.reduce((a, b) => (b.f > a.f ? b : a));
    expect(pick(s, list, 'infantry')).toContainEqual(tip);
    for (const p of pick(s, list, 'spearman')) { const sameRow = pick(s, list, 'infantry').filter(q => Math.abs(q.f - p.f) < 1); if (sameRow.length) expect(Math.abs(p.r)).toBeGreaterThan(Math.max(...sameRow.map(q => Math.abs(q.r)))); }
    expect(Math.max(...pick(s, list, 'archer').map(p => p.f))).toBeLessThan(Math.min(...pick(s, list, 'infantry').map(p => p.f)));
  });

  it('Bao vây hai cánh: cavalry wide on both sides, ahead of the centre line', () => {
    const list = army({ spearman: 3, infantry: 5, archer: 4, cavalry: 6 }), s = g.formationLayout('flank', list);
    const centre = [...pick(s, list, 'spearman'), ...pick(s, list, 'infantry')], cav = pick(s, list, 'cavalry');
    const half = Math.max(...centre.map(p => Math.abs(p.r)));
    expect(cav.every(p => Math.abs(p.r) >= half + 3 * g.FORMATION_SPACING)).toBe(true);
    expect(Math.max(...cav.map(p => p.f))).toBeGreaterThan(Math.max(...centre.map(p => p.f)));
  });

  it('places every unit even when types are missing, slots never shared', () => {
    for (const kind of ['defense', 'wedge', 'flank']) for (const spec of [{ archer: 7 }, { cavalry: 5 }, { spearman: 3, archer: 2 }, { infantry: 1 }]) {
      const list = army(spec), s = g.formationLayout(kind, list), keys = list.map(u => `${Math.round(s[u.id].f)},${Math.round(s[u.id].r)}`);
      expect(new Set(keys).size).toBe(list.length);
    }
  });
});

describe('formation orders', () => {
  it('leaves scouts out: their position and order do not change', () => {
    const state = quietMatch(g), at = openPatch(state, 10);
    const units = squad(state, { scout: 3, infantry: 4, archer: 3 }, at), scouts = units.filter(u => u.type === 'scout');
    for (const s of scouts) { s.order = 'explore'; s.dest = { x: s.x + 300, y: s.y }; }
    const before = scouts.map(s => [s.x, s.y, s.order, s.dest.x]);
    g.applyAction(0, 'formation', { ids: units.map(u => u.id), kind: 'defense' });
    const f = state.formations[0];
    expect(f.ids).toHaveLength(7);
    expect(scouts.every(s => s.formation == null)).toBe(true);
    expect(scouts.map(s => [s.x, s.y, s.order, s.dest.x])).toEqual(before);
  });

  it('Giữ đội hình marches at the slowest member speed and keeps the shape', () => {
    const state = quietMatch(g), at = openPatch(state, 14);
    const units = squad(state, { cavalry: 3, infantry: 3, archer: 3 }, at), ids = units.map(u => u.id);
    g.applyAction(0, 'formation', { ids, kind: 'defense' });
    step(4); // form up
    const f = state.formations[0], start = { x: f.x, y: f.y };
    g.applyAction(0, 'move', { ids, x: start.x + 8 * T(), y: start.y });
    step(5);
    const moved = Math.hypot(f.x - start.x, f.y - start.y);
    expect(moved).toBeLessThanOrEqual(g.specs.archer.speed * 5 + 1);
    expect(moved).toBeGreaterThan(g.specs.archer.speed * 2);
    expect(g.specs.cavalry.speed).toBe(58); // own speed untouched
    for (const u of units) { const p = g.formationTarget(f, u); expect(Math.hypot(p.x - u.x, p.y - u.y)).toBeLessThan(g.FORMATION_CATCHUP); }
    step(12);
    expect(f.moving).toBe(false);
    for (const u of units) { const p = g.formationTarget(f, u); expect(Math.hypot(p.x - u.x, p.y - u.y)).toBeLessThan(20); }
  });

  it('Di chuyển tự do: every member walks at its own speed to its slot at the destination', () => {
    const state = quietMatch(g), at = openPatch(state, 14);
    const units = squad(state, { cavalry: 2, archer: 2 }, at), ids = units.map(u => u.id);
    g.applyAction(0, 'formation', { ids, kind: 'flank' });
    g.applyAction(0, 'formationMode', { ids, mode: 'free' });
    step(3);
    g.applyAction(0, 'move', { ids, x: at.x + 8 * T(), y: at.y });
    expect(units.every(u => u.order === 'move')).toBe(true);
    const from = units.map(u => ({ x: u.x, y: u.y }));
    step(3);
    units.forEach((u, i) => { const d = Math.hypot(u.x - from[i].x, u.y - from[i].y); if (u.type === 'cavalry') expect(d).toBeGreaterThan(g.specs.cavalry.speed * 3 * 0.85); else expect(d).toBeLessThan(g.specs.archer.speed * 3 + 10); }); // + light separation pushes
    step(20);
    expect(units.every(u => u.order === 'formation')).toBe(true); // arrived, back under the formation
  });

  it('a unit given its own order leaves the formation; the rest keeps it; cancel dissolves it', () => {
    const state = quietMatch(g), at = openPatch(state, 10);
    const units = squad(state, { infantry: 4, spearman: 2 }, at), ids = units.map(u => u.id);
    g.applyAction(0, 'formation', { ids, kind: 'wedge' });
    g.applyAction(0, 'move', { ids: [ids[0]], x: at.x - 200, y: at.y });
    expect(units[0].formation).toBe(null);
    expect(units[0].order).toBe('move');
    expect(state.formations[0].ids).toHaveLength(5);
    g.applyAction(0, 'formationCancel', { ids: [ids[1]] });
    expect(state.formations).toHaveLength(0);
    expect(units.slice(1).every(u => u.formation == null && u.order === 'hold')).toBe(true);
  });

  it('squeezes into a column over a bridge and spreads out again on the far bank', () => {
    const state = quietMatch(g);
    const b = g.bridges[Math.floor(g.bridges.length / 2)], y = ((b.y0 + b.y1) / 2 + 0.5) * T();
    const west = g.nearestWalkable((b.x0 - 8) * T(), y), east = g.nearestWalkable((b.x1 + 10) * T(), y);
    const units = squad(state, { infantry: 6, spearman: 4, archer: 4, cavalry: 4 }, west), ids = units.map(u => u.id);
    g.applyAction(0, 'formation', { ids, kind: 'defense' });
    step(5);
    g.applyAction(0, 'move', { ids, x: east.x, y: east.y });
    const f = state.formations[0]; let column = false;
    for (let k = 0; k < 120 * 20 && f.moving; k++) { g.update(0.05); column ||= f.column; }
    expect(column).toBe(true);
    expect(f.moving).toBe(false);
    expect(f.column).toBe(false);
    expect(Math.hypot(f.x - east.x, f.y - east.y)).toBeLessThan(T());
    step(15);
    const near = units.filter(u => { const p = g.formationTarget(f, u); return Math.hypot(p.x - u.x, p.y - u.y) < 40; });
    expect(near.length).toBeGreaterThanOrEqual(units.length - 1);
  });

  it('members fight an enemy near their slot, then return to it', () => {
    const state = quietMatch(g), at = openPatch(state, 10);
    const units = squad(state, { infantry: 4 }, at), ids = units.map(u => u.id);
    g.applyAction(0, 'formation', { ids, kind: 'defense' });
    step(4);
    const f = state.formations[0], enemy = g.spawn(1, 'scout'); enemy.x = f.x + 120; enemy.y = f.y; enemy.hp = 5; enemy.order = 'hold';
    let left = false;
    for (let k = 0; k < 200 && state.units.includes(enemy); k++) { g.update(0.05); left ||= units.some(u => Math.hypot(g.formationTarget(f, u).x - u.x, g.formationTarget(f, u).y - u.y) > 30); }
    expect(state.units.includes(enemy)).toBe(false);
    expect(left).toBe(true);
    step(6);
    for (const u of units) { const p = g.formationTarget(f, u); expect(Math.hypot(p.x - u.x, p.y - u.y)).toBeLessThan(20); }
  });
});
