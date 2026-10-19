// @ts-nocheck
// Unit movement along paths (docs/features/pathfinding.md). Every walk — move orders, chasing a target, AI errands —
// goes through steerTo(). Routes are planned on what the unit's side has explored: unexplored ground counts as open, so a
// unit heads straight into the fog and only re-routes once its own vision reveals water or rock across the way.
import { H, TILE_SIZE, W } from '../config/map';
import { state } from '../core/game';
import { BUILDING_TYPES, specs } from '../config/balance';
import { findPath, groupPaths, isWalkableAt, lineWalkable, nearestWalkable, pathStillOpen, planGrid, setStructureObstacles } from '../map/paths';

// A path is recomputed when its goal has moved this far, but at most once per PATH_REPATH_SECONDS while chasing.
// Every PATH_CHECK_SECONDS the remaining route is re-checked against newly explored tiles.
export const PATH_GOAL_TOLERANCE = TILE_SIZE * 1.5, PATH_REPATH_SECONDS = 1, PATH_CHECK_SECONDS = 0.4;

// Units are kept inside this box (update() clamps them after moving). Path waypoints are clamped to the same box in
// steerTo(), otherwise a route touching the map edge (a waypoint at y < MOVE_BOUNDS.top) is never reached: the unit
// steps towards it, is clamped back, and stays "moving" forever.
export const MOVE_BOUNDS = { left: 22, top: 45, right: W - 22, bottom: H - 30 };
export function clampToBounds(u) { u.x = Math.max(MOVE_BOUNDS.left, Math.min(MOVE_BOUNDS.right, u.x)); u.y = Math.max(MOVE_BOUNDS.top, Math.min(MOVE_BOUNDS.bottom, u.y)); }
// What `team` knows of the map: its explored tiles (team 0 = state.fogSeen, team 1 = state.enemyFogSeen).
export function knownMap(team) { return team === 0 ? state.fogSeen : state.enemyFogSeen; }

// Moves `u` up to speed·dt along its path toward (gx, gy). Keeps u.path (world waypoints) and u.goal for drawing and
// for the guest. Returns true when the unit has nothing left to walk (arrived, or the goal cannot be reached).
export function steerTo(u, gx, gy, speed, dt) {
  const known = knownMap(u.team);
  u.repath = (u.repath || 0) - dt; u.pathCheck = (u.pathCheck || 0) - dt;
  const goalMoved = !u.goal || Math.hypot(u.goal.x - gx, u.goal.y - gy) > PATH_GOAL_TOLERANCE;
  const replan = () => { u.goal = { x: gx, y: gy }; u.path = findPath(u.x, u.y, gx, gy, known); u.repath = PATH_REPATH_SECONDS; u.pathCheck = PATH_CHECK_SECONDS; u.replans = (u.replans || 0) + 1; };
  if (!u.path || (goalMoved && (u.repath <= 0 || !u.path.length || lineWalkable(u.x, u.y, gx, gy, planGrid(known))))) replan();
  else if (goalMoved && u.path.length && lineWalkable(u.path[u.path.length - 1].x, u.path[u.path.length - 1].y, gx, gy, planGrid(known))) {
    // Target drifted but is still in plain sight of the last waypoint: just slide the end of the path.
    u.path[u.path.length - 1] = { x: gx, y: gy }; u.goal = { x: gx, y: gy };
  } else if (u.pathCheck <= 0 && u.path.length) {
    // Vision has uncovered more of the map: if water or rock now lies across the route, find another way.
    u.pathCheck = PATH_CHECK_SECONDS;
    if (!pathStillOpen(u.x, u.y, u.path, known)) replan();
  }
  let budget = speed * dt;
  while (budget > 0 && u.path.length) {
    const w = u.path[0], p = { x: Math.max(MOVE_BOUNDS.left, Math.min(MOVE_BOUNDS.right, w.x)), y: Math.max(MOVE_BOUNDS.top, Math.min(MOVE_BOUNDS.bottom, w.y)) };
    const d = Math.hypot(p.x - u.x, p.y - u.y), step = Math.min(d, budget);
    const nx = d > 1e-9 ? u.x + (p.x - u.x) / d * step : p.x, ny = d > 1e-9 ? u.y + (p.y - u.y) / d * step : p.y;
    // Never step onto water or rock, even where the plan assumed unexplored ground was open: stop and re-plan next frame.
    if (!isWalkableAt(nx, ny) && isWalkableAt(u.x, u.y)) { u.path = null; u.pathCheck = 0; return false; }
    u.x = nx; u.y = ny; budget -= step; u.moving = true;
    if (step >= d) u.path.shift();
  }
  return !u.path.length;
}
export function clearPath(u) { u.path = null; u.goal = null; u.moveGroup = null; }
let moveGroupCounter = 0;

// Group move order: a shared route from the group's centre (groupPaths, planned on the side's explored map), each unit
// ending at its own formation slot (slots on known water or rock move to the nearest open tile).
export function assignGroupMove(units, slots, cx, cy) {
  if (!units.length) return;
  const known = knownMap(units[0].team), snapped = slots.map(p => nearestWalkable(p.x, p.y, 24, planGrid(known)) || p);
  const routes = units.length > 1 ? groupPaths(units, snapped, cx, cy, known) : [findPath(units[0].x, units[0].y, snapped[0].x, snapped[0].y, known)];
  // Units of one order share u.moveGroup so the route is drawn once per group (render/paths.ts).
  const group = ++moveGroupCounter;
  units.forEach((u, i) => { u.dest = snapped[i]; u.goal = snapped[i]; u.order = 'move'; u.path = routes[i]; u.repath = PATH_REPATH_SECONDS; u.pathCheck = PATH_CHECK_SECONDS; u.moveGroup = group; });
}

// Buildings and fortresses as path obstacles (map/paths.ts): rebuilt only when the set of structures, or where they stand,
// changes (placed, dragged, destroyed, new match). Called every frame from update() (host / AI side only).
let structureKey = null;
export function syncStructureObstacles() {
  if (!state) return;
  const bases = state.bases.filter(b => b.hp > 0), blds = state.buildings.filter(b => b.hp > 0);
  const key = bases.map(b => `${b.team}@${b.x | 0},${b.y | 0}`).join() + '|' + blds.map(b => `${b.id}@${b.x | 0},${b.y | 0}`).join();
  if (key === structureKey) return;
  structureKey = key;
  setStructureObstacles([...bases.map(b => ({ x: b.x, y: b.y, hw: b.w / 2, hh: b.h / 2 })), ...blds.map(b => ({ x: b.x, y: b.y, hw: BUILDING_TYPES[b.kind].halfW, hh: BUILDING_TYPES[b.kind].halfH }))]);
}

// Light separation: overlapping units (any side) push each other apart by part of the overlap each frame, so a group
// spreads into a crowd instead of one stack. A push never moves a unit onto water, rock or a building, nor out of
// MOVE_BOUNDS. SEPARATION_RATE: share of the overlap removed per second; SEPARATION_SPACING: bodies may overlap this much.
export const SEPARATION_RATE = 6, SEPARATION_SPACING = .85, SEPARATION_CELL = 32;
const sepGrid = new Map();
export function separateUnits(dt) {
  const units = state.units.filter(u => u.hp > 0), k = Math.min(1, SEPARATION_RATE * dt) * .5;
  sepGrid.clear();
  for (const u of units) { const key = Math.floor(u.x / SEPARATION_CELL) * 4096 + Math.floor(u.y / SEPARATION_CELL); let cell = sepGrid.get(key); if (!cell) sepGrid.set(key, cell = []); cell.push(u); }
  for (const u of units) {
    const cx = Math.floor(u.x / SEPARATION_CELL), cy = Math.floor(u.y / SEPARATION_CELL), ru = specs[u.type].r;
    for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gy = cy - 1; gy <= cy + 1; gy++) {
      const cell = sepGrid.get(gx * 4096 + gy); if (!cell) continue;
      for (const v of cell) {
        if (v.id <= u.id) continue; // each pair once
        const min = (ru + specs[v.type].r) * SEPARATION_SPACING; let dx = v.x - u.x, dy = v.y - u.y; const d2 = dx * dx + dy * dy;
        if (d2 >= min * min) continue;
        let d = Math.sqrt(d2);
        if (d < 1e-3) { const a = (u.id * 2.399) % (Math.PI * 2); dx = Math.cos(a); dy = Math.sin(a); d = 1; } else { dx /= d; dy /= d; } // exact stack: split along a fixed angle
        const push = (min - Math.min(d, min)) * k;
        nudge(u, -dx * push, -dy * push); nudge(v, dx * push, dy * push);
      }
    }
  }
}
function nudge(u, dx, dy) {
  const x = Math.max(MOVE_BOUNDS.left, Math.min(MOVE_BOUNDS.right, u.x + dx)), y = Math.max(MOVE_BOUNDS.top, Math.min(MOVE_BOUNDS.bottom, u.y + dy));
  if (isWalkableAt(x, y) || !isWalkableAt(u.x, u.y)) { u.x = x; u.y = y; }
}
