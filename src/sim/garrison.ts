// @ts-nocheck
// Flag defence (docs/features/flag-defense.md, spec V3.1 "Cơ chế phòng thủ cột cờ — Toàn quân phản công, tự động rút về").
// Units sent into a flag their side holds leave state.units for state.garrisons, so the rest of the game (drawing,
// selection, targeting, vision, separation) simply does not see them; they still eat food (sim/economy.ts).
// When an enemy unit comes within FLAG_DEFENSE.radius of the flag the whole garrison sorties around it (order 'sortie'),
// fights by the normal rules within FLAG_DEFENSE.leash, and after FLAG_DEFENSE.calmSeconds with no enemy there walks back
// in. A player's own order to a sortie unit takes it out of the automatic defence. Every held flag also shoots (FLAG_GUN).
import { FLAG_DEFENSE, FLAG_GUN } from '../config/balance';
import { addLog, localTeam, nextFxId, state } from '../core/game';
import { regionLabel } from '../map/regions';
import { nearestWalkable } from '../map/paths';
import { assignGroupMove, clearPath } from './movement';
import { detachUnits } from './formation';

export const garrisonOf = r => (state.garrisons || []).filter(u => u.garrison === r.id);
export const sortieOf = r => state.units.filter(u => u.hp > 0 && u.sortie === r.id);
const defenceOf = r => (r.defense ||= { alarm: false, calm: 0, returning: false, cool: 0 });

// Free, walkable spots in rings around the flag, at least 22 px apart, for units coming out or walking in.
function ringSpots(r, n) {
  const out = [];
  for (let ring = 1; out.length < n && ring < 12; ring++) {
    const rad = 18 + ring * 24, count = Math.max(6, Math.floor(2 * Math.PI * rad / 26));
    for (let k = 0; k < count && out.length < n; k++) {
      const a = (k + ring * .5) / count * Math.PI * 2, p = nearestWalkable(r.cp.x + Math.cos(a) * rad, r.cp.y + Math.sin(a) * rad, 3);
      if (p && out.every(q => Math.hypot(q.x - p.x, q.y - p.y) >= 22)) out.push(p);
    }
  }
  while (out.length < n) out.push({ x: r.cp.x, y: r.cp.y });
  return out;
}

// Player order: the chosen units walk to the flag and go in (any unit type). Only into a flag the side holds.
export function orderGarrison(team, ids, regionId) {
  const r = state.regions[regionId];
  if (!r?.cp || r.owner !== team) { if (team === localTeam()) addLog('Chỉ đồn trú được ở cờ của mình.'); return; }
  const want = new Set(ids || []), units = state.units.filter(u => u.team === team && u.hp > 0 && want.has(u.id));
  if (!units.length) return;
  detachUnits(team, units.map(u => u.id));
  assignGroupMove(units, ringSpots(r, units.length), r.cp.x, r.cp.y);
  for (const u of units) { u.garrisonTarget = r.id; u.sortie = null; }
  if (team === localTeam()) addLog(`${units.length} quân về đồn trú ở cờ ${regionLabel(r)}.`);
}
// A unit at its flag goes inside; false (and the order dropped) when the flag is no longer the side's.
export function enterGarrison(u, regionId = u.garrisonTarget ?? u.sortie) {
  const r = state.regions[regionId];
  u.garrisonTarget = null; u.sortie = null;
  if (!r?.cp || r.owner !== u.team) { u.order = 'hold'; return false; }
  state.units = state.units.filter(v => v !== u);
  Object.assign(u, { garrison: r.id, order: 'garrison', selected: false, dest: null, x: r.cp.x, y: r.cp.y, moving: false });
  clearPath(u); (state.garrisons ||= []).push(u);
  return true;
}
// Everyone inside comes out around the flag: sortie (automatic defence) or a plain release (player order / flag lost).
export function releaseGarrison(r, sortie) {
  const out = garrisonOf(r); if (!out.length) return out;
  state.garrisons = state.garrisons.filter(u => u.garrison !== r.id);
  ringSpots(r, out.length).forEach((p, i) => {
    const u = out[i];
    Object.assign(u, { x: p.x, y: p.y, garrison: null, sortie: sortie ? r.id : null, order: sortie ? 'sortie' : 'hold', dest: null, attackTimer: 0 });
    clearPath(u); state.units.push(u);
  });
  return out;
}
export function orderGarrisonExit(team, regionId) {
  const r = state.regions[regionId]; if (!r?.cp || r.owner !== team) return;
  const out = releaseGarrison(r, false);
  if (out.length && team === localTeam()) addLog(`${out.length} quân rời cờ ${regionLabel(r)}.`);
}
// Any order of the player's own takes these units out of the automatic defence and cancels walking in.
export function releaseFromFlag(team, ids) {
  const want = new Set(ids || []);
  for (const u of state.units) if (u.team === team && want.has(u.id)) { u.sortie = null; u.garrisonTarget = null; }
}
// Sortie units fight enemies within the leash of their flag.
export function sortieMayChase(u, target) { const r = state.regions[u.sortie]; return !!r?.cp && Math.hypot(target.x - r.cp.x, target.y - r.cp.y) <= FLAG_DEFENSE.leash; }
// Where an idle sortie unit goes: back to the flag once the area has been calm long enough, else nowhere (null).
export function sortieGoal(u) { const r = state.regions[u.sortie]; return r?.cp && r.defense?.returning ? r.cp : null; }

// Once per frame on the host / AI side: alarms, sorties, the walk back, and the flags' own shots.
export function updateFlagDefense(dt) {
  for (const r of state.regions) {
    if (!r.cp) continue;
    if (r.owner < 0) { // lost or never held: whatever belonged to it is on its own
      if (garrisonOf(r).length) releaseGarrison(r, false);
      for (const u of sortieOf(r)) { u.sortie = null; if (u.order === 'sortie') u.order = 'hold'; }
      r.defense = null; continue;
    }
    const d = defenceOf(r);
    let nearest = null, nd = Infinity;
    for (const u of state.units) { if (u.team === r.owner || u.hp <= 0) continue; const dd = Math.hypot(u.x - r.cp.x, u.y - r.cp.y); if (dd <= FLAG_DEFENSE.radius && dd < nd) { nd = dd; nearest = u; } }
    if (nearest) {
      d.calm = 0; d.returning = false;
      if (!d.alarm) { d.alarm = true; if (r.owner === localTeam() && garrisonOf(r).length) addLog(`Cờ ${regionLabel(r)} bị tấn công: toàn bộ ${garrisonOf(r).length} quân đồn trú xuất kích!`, 'danger'); }
      if (garrisonOf(r).length) releaseGarrison(r, true);
    } else if (d.alarm) {
      d.calm += dt;
      if (d.calm >= FLAG_DEFENSE.calmSeconds) { d.alarm = false; d.returning = sortieOf(r).length > 0; }
    }
    if (d.returning && !sortieOf(r).length) d.returning = false;
    // The flag's own shot: one enemy within range, the nearest.
    d.cool = Math.max(0, d.cool - dt);
    if (nearest && nd <= FLAG_GUN.range && d.cool <= 0) {
      d.cool = FLAG_GUN.cooldown;
      state.bullets.push({ id: nextFxId(), x: r.cp.x, y: r.cp.y - 40, target: nearest, damage: FLAG_GUN.damage, team: r.owner, speed: 320, life: 1.2, attackerType: 'flag' });
    }
  }
}
