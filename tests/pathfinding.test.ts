// @ts-nocheck
// Obstacles and pathfinding (docs/features/pathfinding.md).
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGame, quietMatch } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); g.buildWalkable(); });

const T = () => g.TILE_SIZE, N = () => g.MAP_TILES;
// A walkable land point on each bank of the river at a given row (map fraction).
function banks(f) {
  const y = Math.floor(f * N()), rx = Math.floor((0.34 + 0.31 * f + 0.055 * Math.sin(f * 10)) * N());
  let a = rx, b = rx; while (g.terrainType[y * N() + a] === 2 || !g.walkable[y * N() + a]) a--; while (g.terrainType[y * N() + b] === 2 || !g.walkable[y * N() + b]) b++;
  return { west: { x: (a - 3 + 0.5) * T(), y: (y + 0.5) * T() }, east: { x: (b + 3 + 0.5) * T(), y: (y + 0.5) * T() } };
}
const legsWalkable = (start, path) => { let p = start; for (const q of path) { if (!g.lineWalkable(p.x, p.y, q.x, q.y)) return false; p = q; } return true; };

describe('obstacles', () => {
  it('blocks water and rock, opens bridges over the river', () => {
    let water = 0, rock = 0, open = 0;
    for (let i = 0; i < g.walkable.length; i++) { const t = g.terrainType[i]; if (t === 2 && g.walkable[i] && !g.bridgeTiles[i]) water++; if (t === 3 && g.walkable[i] && !g.bridgeTiles[i]) rock++; if (g.bridgeTiles[i]) open++; }
    expect(water).toBe(0);
    expect(rock).toBe(0);
    expect(g.bridges).toHaveLength(g.BRIDGE_ROWS.length);
    expect(open).toBeGreaterThan(40);
  });

  it('lands every bridge on open ground at both ends', () => {
    for (const b of g.bridges) for (let y = b.y0; y <= b.y1; y++) {
      let x0 = -1, x1 = -1;
      for (let x = 0; x < N(); x++) if (g.bridgeTiles[y * N() + x]) { if (x0 < 0) x0 = x; x1 = x; }
      if (x0 < 0) continue;
      expect(g.walkable[y * N() + x0 - 1] && !g.bridgeTiles[y * N() + x0 - 1], `bridge row ${y} west end`).toBeTruthy();
      expect(g.walkable[y * N() + x1 + 1] && !g.bridgeTiles[y * N() + x1 + 1], `bridge row ${y} east end`).toBeTruthy();
    }
  });

  it('connects both river banks only through the bridges', () => {
    const { west, east } = banks(0.25);
    const reach = g.reachableFrom(west.x, west.y);
    expect(reach[g.tileOf(east.y) * N() + g.tileOf(east.x)]).toBe(1);
    g.walkable.set(g.walkable.map((w, i) => (g.bridgeTiles[i] ? 0 : w)));
    const cut = g.reachableFrom(west.x, west.y);
    expect(cut[g.tileOf(east.y) * N() + g.tileOf(east.x)]).toBe(0);
    g.buildWalkable();
  });
});

describe('findPath', () => {
  it('goes around the river over a bridge, every leg on walkable ground', () => {
    const { west, east } = banks(0.25);
    expect(g.lineWalkable(west.x, west.y, east.x, east.y)).toBe(false);
    const path = g.findPath(west.x, west.y, east.x, east.y);
    expect(path.length).toBeGreaterThan(1);
    expect(legsWalkable(west, path)).toBe(true);
    const end = path[path.length - 1];
    expect(Math.hypot(end.x - east.x, end.y - east.y)).toBeLessThan(T());
    // Some waypoint-to-waypoint leg crosses bridge tiles.
    let onBridge = false, p = west;
    for (const q of path) { for (let k = 0; k <= 40; k++) { const x = p.x + (q.x - p.x) * k / 40, y = p.y + (q.y - p.y) * k / 40; if (g.bridgeTiles[g.tileOf(y) * N() + g.tileOf(x)]) onBridge = true; } p = q; }
    expect(onBridge).toBe(true);
  });

  it('returns the goal alone when the straight line is clear', () => {
    const { west } = banks(0.25);
    const near = { x: west.x - T() * 2, y: west.y };
    if (g.lineWalkable(west.x, west.y, near.x, near.y)) expect(g.findPath(west.x, west.y, near.x, near.y)).toEqual([near]);
  });

  it('moves a goal on water to the nearest walkable tile', () => {
    const { west, east } = banks(0.62);
    const mid = { x: (west.x + east.x) / 2, y: west.y };
    expect(g.isWalkableAt(mid.x, mid.y)).toBe(false);
    const path = g.findPath(west.x, west.y, mid.x, mid.y), end = path[path.length - 1];
    expect(g.isWalkableAt(end.x, end.y)).toBe(true);
  });

  it('shares one flow field for a group', () => {
    const { west, east } = banks(0.45), field = g.flowField(east.x, east.y);
    for (const dx of [0, 3, -3]) {
      const start = { x: west.x + dx * T(), y: west.y + dx * T() };
      if (!g.isWalkableAt(start.x, start.y)) continue;
      const path = g.pathFromField(field, start.x, start.y);
      expect(legsWalkable(start, path)).toBe(true);
    }
  });
});

describe('units', () => {
  it('walk a move order across the river without ever standing on water or rock', () => {
    const state = quietMatch(g);
    const { west, east } = banks(0.3);
    const units = [];
    for (let i = 0; i < 6; i++) { const u = g.spawn(0, 'infantry', 0, 0, false) || g.spawn(0, 'infantry'); u.x = west.x + (i % 3 - 1) * 20; u.y = west.y + Math.floor(i / 3) * 20; if (!g.isWalkableAt(u.x, u.y)) { u.x = west.x; u.y = west.y; } units.push(u); }
    g.applyAction(0, 'move', { ids: units.map(u => u.id), x: east.x, y: east.y });
    expect(units.every(u => u.path && u.path.length)).toBe(true);
    let bad = 0;
    for (let t = 0; t < 240 && units.some(u => u.order === 'move'); t += 0.1) {
      g.update(0.1);
      for (const u of units) if (!g.isWalkableAt(u.x, u.y)) bad++;
    }
    expect(bad).toBe(0);
    for (const u of units) { expect(u.order).toBe('hold'); expect(Math.hypot(u.x - east.x, u.y - east.y)).toBeLessThan(T() * 4); }
  });
});

describe('fog-aware planning', () => {
  it('plans straight across unexplored ground and around obstacles the side has seen', () => {
    const { west, east } = banks(0.25);
    const unknown = new Uint8Array(g.walkable.length), all = new Uint8Array(g.walkable.length).fill(1);
    expect(g.findPath(west.x, west.y, east.x, east.y, unknown)).toEqual([east]);
    const seen = g.findPath(west.x, west.y, east.x, east.y, all);
    expect(seen.length).toBeGreaterThan(1);
    expect(legsWalkable(west, seen)).toBe(true);
  });

  it('walks straight into the fog, re-routes when its vision reveals the river, and still arrives', () => {
    const state = quietMatch(g);
    state.fogSeen.fill(0);
    const { west, east } = banks(0.3);
    const u = g.spawn(0, 'infantry', 0, 0, false) || g.spawn(0, 'infantry');
    u.x = west.x - T() * 8; u.y = west.y;
    if (!g.isWalkableAt(u.x, u.y)) { u.x = west.x; u.y = west.y; }
    g.applyAction(0, 'move', { ids: [u.id], x: east.x, y: east.y });
    expect(u.path).toHaveLength(1); // nothing known: straight at the goal
    const startReplans = u.replans || 0;
    let bad = 0;
    for (let t = 0; t < 300 && u.order === 'move'; t += 0.1) { g.update(0.1); if (!g.isWalkableAt(u.x, u.y)) bad++; }
    expect(bad).toBe(0);
    expect((u.replans || 0) - startReplans).toBeGreaterThan(0);
    expect(u.order).toBe('hold');
    expect(Math.hypot(u.x - east.x, u.y - east.y)).toBeLessThan(T() * 2);
  });
});

