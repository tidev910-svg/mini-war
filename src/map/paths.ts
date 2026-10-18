// @ts-nocheck
// Obstacles and pathfinding (docs/features/pathfinding.md): water and rock block movement, wooden bridges cross the river,
// A* on the 256×256 tile grid (8 directions, no corner cutting), line-of-sight smoothing and shared flow fields for groups.
import { MAP_TILES, TILE_SIZE, BRIDGE_ROWS, BRIDGE_WIDTH_TILES } from '../config/map';
import { terrainType } from './terrain';

const N = MAP_TILES, SIZE = N * N, SQRT2 = Math.SQRT2;
// 1 = units can stand here. Built once from the terrain (which never changes) plus the bridge tiles.
export const walkable = new Uint8Array(SIZE);
export const bridgeTiles = new Uint8Array(SIZE);
export const bridges = []; // [{y0, y1, x0, x1}] in tiles, for drawing
let built = false;
export const BRIDGE_MAX_RAMP_TILES = 10, BRIDGE_ROW_SEARCH_TILES = 12;

export function buildWalkable() {
  for (let i = 0; i < SIZE; i++) { const t = terrainType[i]; walkable[i] = t === 2 || t === 3 ? 0 : 1; }
  bridgeTiles.fill(0); bridges.length = 0;
  // Each bridge spans the river where its row crosses the river centre line, BRIDGE_WIDTH_TILES rows tall. The deck may
  // carry on over up to BRIDGE_MAX_RAMP_TILES of rock at either end; if a row still ends in rock, the bridge moves to the
  // nearest row (within BRIDGE_ROW_SEARCH_TILES) where every row of the deck lands on open ground on both banks.
  const half = BRIDGE_WIDTH_TILES >> 1;
  const span = (y, rx) => {
    if (y < 1 || y >= N - 1 || terrainType[y * N + rx] !== 2) return null;
    let a = rx, b = rx;
    while (a > 0 && terrainType[y * N + a - 1] === 2) a--;
    while (b < N - 1 && terrainType[y * N + b + 1] === 2) b++;
    for (let k = 0; k < BRIDGE_MAX_RAMP_TILES && a > 1 && !walkable[y * N + a - 1]; k++) a--;
    for (let k = 0; k < BRIDGE_MAX_RAMP_TILES && b < N - 2 && !walkable[y * N + b + 1]; k++) b++;
    return walkable[y * N + a - 1] && walkable[y * N + b + 1] ? [a, b] : null;
  };
  for (const f of BRIDGE_ROWS) {
    let chosen = null;
    for (let d = 0; d <= BRIDGE_ROW_SEARCH_TILES && !chosen; d++) for (const yc of d ? [Math.floor(f * N) + d, Math.floor(f * N) - d] : [Math.floor(f * N)]) {
      const fy = (yc + 0.5) / N, rx = Math.floor((0.34 + 0.31 * fy + 0.055 * Math.sin(fy * 10)) * N);
      const rows = []; for (let y = yc - half; y <= yc + half; y++) { const sp = span(y, rx); if (!sp) { rows.length = 0; break; } rows.push([y, ...sp]); }
      if (rows.length) { chosen = rows; break; }
    }
    if (!chosen) continue;
    for (const [y, a, b] of chosen) for (let x = a; x <= b; x++) { bridgeTiles[y * N + x] = 1; walkable[y * N + x] = 1; }
    bridges.push({ y0: chosen[0][0], y1: chosen[chosen.length - 1][0], x0: Math.min(...chosen.map(r => r[1])), x1: Math.max(...chosen.map(r => r[2])) });
  }
  built = true;
}
const ensure = () => { if (!built) buildWalkable(); };

export const tileOf = v => Math.max(0, Math.min(N - 1, Math.floor(v / TILE_SIZE)));
export const tileCenter = i => ({ x: (i % N + 0.5) * TILE_SIZE, y: (Math.floor(i / N) + 0.5) * TILE_SIZE });
export function isWalkableAt(x, y) { ensure(); if (x < 0 || y < 0 || x >= N * TILE_SIZE || y >= N * TILE_SIZE) return false; return walkable[tileOf(y) * N + tileOf(x)] === 1; }

// Planning grid for a side that only knows what it has explored (`known` = state.fogSeen / enemyFogSeen): unexplored tiles
// count as open, so units head straight into the unknown; explored water and rock block. Without `known`: the real terrain.
// The grid is a shared scratch buffer, valid until the next planGrid() call.
const planScratch = new Uint8Array(SIZE);
export function planGrid(known = null) {
  ensure();
  if (!known) return walkable;
  for (let i = 0; i < SIZE; i++) planScratch[i] = walkable[i] | (known[i] ? 0 : 1);
  return planScratch;
}
const openIn = (grid, x, y) => x >= 0 && y >= 0 && x < N * TILE_SIZE && y < N * TILE_SIZE && grid[tileOf(y) * N + tileOf(x)] === 1;

// Nearest open tile of `grid` to a point (spiral search up to `maxR` tiles), as a world point at the tile centre or the point itself.
export function nearestWalkable(x, y, maxR = 24, grid = walkable) {
  ensure();
  if (openIn(grid, x, y)) return { x, y };
  const gx = tileOf(x), gy = tileOf(y);
  for (let r = 1; r <= maxR; r++) {
    let best = null, bd = Infinity;
    for (let oy = -r; oy <= r; oy++) for (let ox = -r; ox <= r; ox++) {
      if (Math.max(Math.abs(ox), Math.abs(oy)) !== r) continue;
      const tx = gx + ox, ty = gy + oy; if (tx < 0 || ty < 0 || tx >= N || ty >= N || !grid[ty * N + tx]) continue;
      const c = tileCenter(ty * N + tx), d = (c.x - x) ** 2 + (c.y - y) ** 2; if (d < bd) { bd = d; best = c; }
    }
    if (best) return best;
  }
  return null;
}

// True when the straight segment stays on open tiles of `grid` (sampled every ¼ tile, also checking both side tiles at
// diagonal steps so a line never slips between two blocked corners).
export function lineWalkable(ax, ay, bx, by, grid = walkable) {
  ensure();
  const walkable = grid;
  const d = Math.hypot(bx - ax, by - ay), steps = Math.max(1, Math.ceil(d / (TILE_SIZE * 0.25)));
  let pgx = tileOf(ax), pgy = tileOf(ay);
  if (!walkable[pgy * N + pgx]) return false;
  for (let k = 1; k <= steps; k++) {
    const x = ax + (bx - ax) * k / steps, y = ay + (by - ay) * k / steps, gx = tileOf(x), gy = tileOf(y);
    if (gx === pgx && gy === pgy) continue;
    if (!walkable[gy * N + gx]) return false;
    if (gx !== pgx && gy !== pgy && (!walkable[pgy * N + gx] || !walkable[gy * N + pgx])) return false;
    pgx = gx; pgy = gy;
  }
  return true;
}

// Binary heap keyed by f, reused between searches.
const heapK = new Float64Array(SIZE * 2), heapV = new Int32Array(SIZE * 2); let heapN = 0;
const push = (k, v) => { let i = heapN++; while (i > 0) { const p = (i - 1) >> 1; if (heapK[p] <= k) break; heapK[i] = heapK[p]; heapV[i] = heapV[p]; i = p; } heapK[i] = k; heapV[i] = v; };
const pop = () => { const v = heapV[0], k = heapK[--heapN], w = heapV[heapN]; let i = 0; for (;;) { let c = 2 * i + 1; if (c >= heapN) break; if (c + 1 < heapN && heapK[c + 1] < heapK[c]) c++; if (heapK[c] >= k) break; heapK[i] = heapK[c]; heapV[i] = heapV[c]; i = c; } heapK[i] = k; heapV[i] = w; return v; };
const gScore = new Float32Array(SIZE), cameFrom = new Int32Array(SIZE), stamp = new Uint32Array(SIZE), closed = new Uint32Array(SIZE); let search = 0;
const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, SQRT2], [1, -1, SQRT2], [-1, 1, SQRT2], [-1, -1, SQRT2]];
export const PATH_MAX_NODES = 40000;
export let lastSearchNodes = 0;

// A* from tile `s` to tile `g`. Returns the tile list (start excluded). If `g` cannot be reached (or the node budget runs out)
// it returns the path to the explored tile closest to `g`, so units walk as near as they can.
function astar(s, g, walkable) {
  search++; heapN = 0;
  const gx = g % N, gy = (g - gx) / N, h = i => { const dx = Math.abs(i % N - gx), dy = Math.abs(Math.floor(i / N) - gy); return Math.max(dx, dy) + (SQRT2 - 1) * Math.min(dx, dy); };
  stamp[s] = search; gScore[s] = 0; cameFrom[s] = -1; push(h(s), s);
  let best = s, bestH = h(s), nodes = 0;
  while (heapN) {
    const cur = pop(); if (closed[cur] === search) continue; closed[cur] = search; nodes++;
    if (cur === g) { best = g; break; }
    const hc = h(cur); if (hc < bestH) { bestH = hc; best = cur; }
    if (nodes > PATH_MAX_NODES) break;
    const cx = cur % N, cy = (cur - cx) / N;
    for (const [dx, dy, cost] of DIRS) {
      const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      const ni = ny * N + nx; if (!walkable[ni] || closed[ni] === search) continue;
      if (dx && dy && (!walkable[cy * N + nx] || !walkable[ny * N + cx])) continue; // no corner cutting
      const ng = gScore[cur] + cost;
      if (stamp[ni] !== search || ng < gScore[ni]) { stamp[ni] = search; gScore[ni] = ng; cameFrom[ni] = cur; push(ng + h(ni), ni); }
    }
  }
  lastSearchNodes = nodes;
  const out = []; for (let i = best; i !== s && i >= 0; i = cameFrom[i]) out.push(i);
  return out.reverse();
}

// String-pulling: keep only the waypoints needed so each straight leg stays walkable.
function smooth(start, points, grid) {
  const out = []; let from = start, i = 0;
  while (i < points.length) {
    let j = points.length - 1;
    while (j > i && !lineWalkable(from.x, from.y, points[j].x, points[j].y, grid)) j--;
    out.push(points[j]); from = points[j]; i = j + 1;
  }
  return out;
}

// World-space waypoints from (ax, ay) to (bx, by), planned on what `known` says (see planGrid; null = real terrain).
// The goal moves to the nearest open tile; when it cannot be reached the path ends at the closest reachable point.
// A clear straight line returns just the goal — always the case across unexplored ground.
export function findPath(ax, ay, bx, by, known = null) {
  const grid = planGrid(known);
  const start = openIn(grid, ax, ay) ? { x: ax, y: ay } : nearestWalkable(ax, ay, 6, grid) || { x: ax, y: ay };
  const goal = nearestWalkable(bx, by, 24, grid) || { x: bx, y: by };
  if (lineWalkable(start.x, start.y, goal.x, goal.y, grid)) return [goal];
  const tiles = astar(tileOf(start.y) * N + tileOf(start.x), tileOf(goal.y) * N + tileOf(goal.x), grid);
  if (!tiles.length) return [];
  const pts = tiles.map(tileCenter), reached = tiles[tiles.length - 1] === tileOf(goal.y) * N + tileOf(goal.x);
  if (reached) pts[pts.length - 1] = goal;
  return smooth(start, pts, grid);
}
// True while every remaining leg of `path` from (x, y) is open on the planning grid (used to notice newly seen obstacles).
export function pathStillOpen(x, y, path, known = null) {
  const grid = planGrid(known); let p = { x, y };
  for (const q of path) { if (!lineWalkable(p.x, p.y, q.x, q.y, grid)) return false; p = q; }
  return true;
}

// Flow field for a group order: walking distance from the goal tile to every reachable tile (Dijkstra, 8 directions).
// A unit descends it to the goal; one field serves the whole group, so a big army costs one search instead of one each.
export function flowField(bx, by) {
  ensure();
  const goal = nearestWalkable(bx, by) || { x: bx, y: by }, g = tileOf(goal.y) * N + tileOf(goal.x);
  const dist = new Float32Array(SIZE).fill(Infinity); search++; heapN = 0; dist[g] = 0; push(0, g);
  while (heapN) {
    const cur = pop(); if (closed[cur] === search) continue; closed[cur] = search;
    const cx = cur % N, cy = (cur - cx) / N;
    for (const [dx, dy, cost] of DIRS) {
      const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      const ni = ny * N + nx; if (!walkable[ni] || closed[ni] === search) continue;
      if (dx && dy && (!walkable[cy * N + nx] || !walkable[ny * N + cx])) continue;
      const nd = dist[cur] + cost; if (nd < dist[ni]) { dist[ni] = nd; push(nd, ni); }
    }
  }
  return { goal, dist };
}
// Waypoints from (ax, ay) down a flow field to its goal, then on to `final` (the unit's own formation slot) when walkable.
export function pathFromField(field, ax, ay, final = null) {
  const { dist, goal } = field, start = isWalkableAt(ax, ay) ? { x: ax, y: ay } : nearestWalkable(ax, ay, 6) || { x: ax, y: ay };
  const end = final && isWalkableAt(final.x, final.y) ? final : goal;
  if (lineWalkable(start.x, start.y, end.x, end.y)) return [end];
  let i = tileOf(start.y) * N + tileOf(start.x);
  if (!Number.isFinite(dist[i])) return findPath(ax, ay, end.x, end.y); // not connected to the goal: best effort
  const tiles = [];
  for (let guard = 0; guard < SIZE && dist[i] > 0; guard++) {
    const cx = i % N, cy = (i - cx) / N; let next = -1, nd = dist[i];
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      const ni = ny * N + nx; if (dist[ni] >= nd) continue;
      if (dx && dy && (!walkable[cy * N + nx] || !walkable[ny * N + cx])) continue;
      nd = dist[ni]; next = ni;
    }
    if (next < 0) break; tiles.push(next); i = next;
  }
  const pts = tiles.map(tileCenter); pts.push(end);
  return smooth(start, pts);
}

// Group route (planned on `known`, see planGrid): one A* path from the group's centre to the goal; each unit joins it at the farthest waypoint it can walk
// to in a straight line, then follows it and finishes at its own slot. Costs one search plus line checks per unit,
// instead of one search per unit (or a full-map flow field).
export function groupPaths(units, slots, cx, cy, known = null) {
  ensure();
  let sx = 0, sy = 0; for (const u of units) { sx += u.x; sy += u.y; }
  const center = nearestWalkable(sx / units.length, sy / units.length, 8, planGrid(known)) || { x: units[0].x, y: units[0].y };
  const shared = findPath(center.x, center.y, cx, cy, known);
  const grid = planGrid(known);
  return units.map((u, i) => {
    const slot = slots[i];
    if (lineWalkable(u.x, u.y, slot.x, slot.y, grid)) return [slot];
    let k = -1;
    for (let j = shared.length - 1; j >= 0; j--) if (lineWalkable(u.x, u.y, shared[j].x, shared[j].y, grid)) { k = j; break; }
    if (k < 0) { const own = findPath(u.x, u.y, slot.x, slot.y, known); planGrid(known); return own; }
    const route = shared.slice(k);
    const last = route[route.length - 1];
    if (lineWalkable(last.x, last.y, slot.x, slot.y, grid)) route.push(slot);
    else { route.push(...findPath(last.x, last.y, slot.x, slot.y, known)); planGrid(known); }
    return route;
  });
}

// Tiles reachable on foot from a point (BFS), for map-generation checks.
export function reachableFrom(x, y) {
  ensure();
  const seen = new Uint8Array(SIZE), q = new Int32Array(SIZE), s = tileOf(y) * N + tileOf(x); if (!walkable[s]) return seen;
  let h = 0, t = 0; q[t++] = s; seen[s] = 1;
  while (h < t) { const i = q[h++], cx = i % N, cy = (i - cx) / N; for (const j of [cx > 0 ? i - 1 : -1, cx < N - 1 ? i + 1 : -1, cy > 0 ? i - N : -1, cy < N - 1 ? i + N : -1]) if (j >= 0 && !seen[j] && walkable[j]) { seen[j] = 1; q[t++] = j; } }
  return seen;
}
