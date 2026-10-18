// @ts-nocheck
// Unit movement along paths (docs/features/pathfinding.md). Every walk — move orders, chasing a target, AI errands —
// goes through steerTo(). Routes are planned on what the unit's side has explored: unexplored ground counts as open, so a
// unit heads straight into the fog and only re-routes once its own vision reveals water or rock across the way.
import { TILE_SIZE } from '../config/map';
import { state } from '../core/game';
import { findPath, groupPaths, isWalkableAt, lineWalkable, nearestWalkable, pathStillOpen, planGrid } from '../map/paths';

// A path is recomputed when its goal has moved this far, but at most once per PATH_REPATH_SECONDS while chasing.
// Every PATH_CHECK_SECONDS the remaining route is re-checked against newly explored tiles.
export const PATH_GOAL_TOLERANCE = TILE_SIZE * 1.5, PATH_REPATH_SECONDS = 1, PATH_CHECK_SECONDS = 0.4;

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
    const p = u.path[0], d = Math.hypot(p.x - u.x, p.y - u.y), step = Math.min(d, budget);
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
