// @ts-nocheck
// Fog of war V3.1 (docs/features/fog-of-war.md): three states per tile and side — unexplored (dark), explored but not
// seen now (thin veil, state.fogSeen / state.enemyFogSeen), seen now (teamCanSee / teamVisibleTiles).
// Every sight source comes from visionSources(): units (UNIT_VISION by type), the side's fortress and buildings
// (BUILDING_VISION) and the flags of the regions it holds (TERRITORY_VISION around the flag). The player, the AI, the
// renderer and the minimap all use it, so both sides see by the same rules.
import { H, HOME_TERRITORY_TILES, MAP_TILES, TILE_SIZE, W } from '../config/map';
import { BUILDING_VISION, TERRITORY_VISION, UNIT_VISION } from '../config/balance';
import { state } from '../core/game';

export const unitVisionRadius = type => UNIT_VISION[type] ?? UNIT_VISION.infantry;
// Sight sources of `team` as [x, y, radius, key]; the key names the source for revealTeamVision()'s cache.
export function visionSources(team) {
  const out = [];
  if (!state) return out;
  for (const u of state.units) if (u.team === team && u.hp > 0) out.push([u.x, u.y, unitVisionRadius(u.type), 'u' + u.id]);
  for (const b of state.bases) if (b.team === team && b.hp > 0) out.push([b.x, b.y, BUILDING_VISION, 'B' + team]);
  for (const b of state.buildings) if (b.team === team && b.hp > 0) out.push([b.x, b.y, BUILDING_VISION, 'b' + b.id]);
  for (const r of state.regions || []) if (r.cp && r.owner === team) out.push([r.cp.x, r.cp.y, TERRITORY_VISION, 'r' + r.id]);
  return out;
}
// True when at least one source of `team` sees the point (squared distances, no square roots: this is called a lot).
export function teamCanSee(team, x, y) {
  if (!state) return false;
  for (const u of state.units) { if (u.team !== team || u.hp <= 0) continue; const r = unitVisionRadius(u.type), dx = x - u.x, dy = y - u.y; if (dx * dx + dy * dy <= r * r) return true; }
  const B = BUILDING_VISION * BUILDING_VISION;
  for (const b of state.bases) { if (b.team !== team || b.hp <= 0) continue; const dx = x - b.x, dy = y - b.y; if (dx * dx + dy * dy <= B) return true; }
  for (const b of state.buildings) { if (b.team !== team || b.hp <= 0) continue; const dx = x - b.x, dy = y - b.y; if (dx * dx + dy * dy <= B) return true; }
  const T = TERRITORY_VISION * TERRITORY_VISION;
  for (const r of state.regions || []) { if (!r.cp || r.owner !== team) continue; const dx = x - r.cp.x, dy = y - r.cp.y; if (dx * dx + dy * dy <= T) return true; }
  return false;
}
export const aiCanSee = (x, y) => teamCanSee(1, x, y);

// Marks every tile a source sees as explored. A source is only re-stamped when it has moved to another tile (or is new),
// since explored tiles never go back to unexplored; the cache belongs to the explored array, so a new match starts fresh.
const stamped = new WeakMap();
export function revealTeamVision(team) {
  if (!state) return;
  const arr = team === 0 ? state.fogSeen : state.enemyFogSeen; if (!arr) return;
  let last = stamped.get(arr); if (!last) stamped.set(arr, last = new Map());
  for (const [x, y, r, key] of visionSources(team)) {
    const tile = Math.floor(y / TILE_SIZE) * MAP_TILES + Math.floor(x / TILE_SIZE), mark = tile * 4096 + r;
    if (last.get(key) === mark) continue;
    last.set(key, mark); revealCircle(arr, x, y, r);
  }
}
export function isTeamAreaExplored(team, x, y) {
  const fog = team === 0 ? state.fogSeen : state.enemyFogSeen;
  if (!fog || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x >= W || y >= H) return false;
  const gx = Math.floor(x / (W / MAP_TILES)), gy = Math.floor(y / (H / MAP_TILES));
  return gx >= 0 && gx < MAP_TILES && gy >= 0 && gy < MAP_TILES && fog[gy * MAP_TILES + gx] === 1;
}
export function revealCircle(arr, x, y, r) {
  const cell = W / MAP_TILES, x1 = Math.max(0, Math.floor((x - r) / cell)), x2 = Math.min(MAP_TILES - 1, Math.ceil((x + r) / cell)), y1 = Math.max(0, Math.floor((y - r) / cell)), y2 = Math.min(MAP_TILES - 1, Math.ceil((y + r) / cell));
  for (let gy = y1; gy <= y2; gy++) for (let gx = x1; gx <= x2; gx++) { const dx = (gx + .5) * cell - x, dy = (gy + .5) * cell - y; if (dx * dx + dy * dy <= r * r) arr[gy * MAP_TILES + gx] = 1; }
}
// Each side knows its own home territory from the start so it has room to build.
export function revealHomeTerritory() { if (!state) return; for (const b of state.bases) revealCircle(b.team === 0 ? state.fogSeen : state.enemyFogSeen, b.x, b.y, HOME_TERRITORY_TILES * TILE_SIZE); }
// Tiles the team sees right now (the same sources as teamCanSee), written into `out`.
export function teamVisibleTiles(team, out) {
  out.fill(0);
  for (const [x, y, r] of visionSources(team)) revealCircle(out, x, y, r);
  return out;
}
