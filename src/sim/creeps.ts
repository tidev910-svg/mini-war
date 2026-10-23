// @ts-nocheck
// Neutral camps and their monsters (docs/features/neutral-camps.md). Runs on the host / in the AI mode only; camps
// (state.camps), monsters (state.creeps) and side buffs (state.buffs) travel to the guest in the snapshot.
// A camp sleeps until a unit of either side comes within `aggro` of one of its monsters, or one of them is hit; then the
// whole camp fights the units close to it (within aggro + CREEP_CHASE_PAD of the camp centre; archers anywhere within the
// leash, since they may be shooting at it) and never follows anyone past `leash`; units only passing by are left alone. With nobody left
// within reach the monsters walk home and heal. When the last one dies, the side that dealt most of the camp's damage
// gets the reward (and the tomb's buff); the camp fills again after `respawn` seconds.
import { gameTime, nextFxId, nextId, setNextId, state, teamResources } from '../core/game';
import { CAMP_TYPES, CREEP_CHASE_PAD, CREEP_ENGAGE_MARGIN, CREEP_REGEN, CREEP_SPLASH_SHARE, CREEP_TYPES } from '../config/creeps';
import { specs } from '../config/balance';
import { revealCircle, teamCanSee } from './fog';
import { clearPath, steerTo } from './movement';
import { nearestWalkable } from '../map/paths';
import { hurt } from './combat';
import { recordCamp, recordGathered } from './stats';
import { facingFrom } from './units';

export const CREEP_TEAM = 2; // monsters' side: neither player
// A camp stays awake this many seconds after the last unit came close or the last hit.
const AWAKE_SECONDS = 3;
export const campById = id => (state?.camps || []).find(c => c.id === id) || null;
export const campCreeps = camp => (state?.creeps || []).filter(c => c.camp === camp.id && c.hp > 0);
// The camp as `team` knows it: its state when it last saw the camp ('alive' | 'cleared' | 'closed'), or null if never seen.
// An opened tomb is announced to both sides.
export function campKnownState(camp, team) {
  if (teamCanSee(team, camp.x, camp.y)) return camp.state;
  const seen = camp.seen?.[team];
  if (CAMP_TYPES[camp.kind].opensAt && camp.state !== 'closed' && (seen == null || seen === 'closed')) return 'alive';
  return seen;
}

function spawnCamp(camp) {
  const def = CAMP_TYPES[camp.kind], list = Object.entries(def.creeps).flatMap(([type, n]) => Array(n).fill(type));
  list.forEach((type, i) => {
    const s = CREEP_TYPES[type], big = s.r >= 20, a = i / list.length * Math.PI * 2 + Math.random() * .5, d = big ? 0 : 42 + Math.random() * 28;
    const p = nearestWalkable(camp.x + Math.cos(a) * d, camp.y + Math.sin(a) * d * .8) || camp;
    state.creeps.push({ id: setNextId(nextId + 1) - 1, camp: camp.id, creep: type, team: CREEP_TEAM, x: p.x, y: p.y, homeX: p.x, homeY: p.y, hp: s.hp, max: s.hp, timer: 0, target: null, facing: 'down', walk: Math.random() * 3, moving: false });
  });
  camp.state = 'alive'; camp.damage = [0, 0]; camp.awake = 0;
}
// Fills every camp at the start of a match (the tomb stays closed until CAMP_TYPES.tomb.opensAt).
export function initCamps() { for (const camp of state.camps || []) if (camp.state === 'alive') spawnCamp(camp); }
// Opened tombs are marked explored for both sides (the opening is announced map-wide). The guest keeps its own explored
// map, so applySnapshot() calls this too.
export function revealOpenedCamps() {
  for (const camp of state?.camps || []) if (CAMP_TYPES[camp.kind].opensAt && camp.state !== 'closed') { revealCircle(state.fogSeen, camp.x, camp.y, 260); revealCircle(state.enemyFogSeen, camp.x, camp.y, 260); }
}
// True near a camp `team` knows to be full (within its leash + 60): AI errands keep away from those.
export function nearKnownCamp(team, x, y) { return (state?.camps || []).some(c => campKnownState(c, team) === 'alive' && Math.hypot(c.x - x, c.y - y) < CAMP_TYPES[c.kind].leash + 60); }
// Side buffs from the tomb: 1 + the summed share of the active ones ('damage' or 'speed').
export function buffFactor(team, kind) { let f = 1; for (const b of state?.buffs || []) if (b.team === team && b.until > gameTime) f += b[kind] || 0; return f; }

const unitsNear = (camp, r) => state.units.some(u => u.hp > 0 && Math.hypot(u.x - camp.x, u.y - camp.y) <= r);
export function updateCreeps(dt) {
  if (!state.camps) return;
  state.buffs = (state.buffs || []).filter(b => b.until > gameTime);
  for (const camp of state.camps) {
    const def = CAMP_TYPES[camp.kind];
    if (camp.state === 'closed' && gameTime >= def.opensAt) { spawnCamp(camp); camp.openedAt = gameTime; revealOpenedCamps(); }
    // Refill once the time is up and nobody stands within its leash.
    else if (camp.state === 'cleared' && gameTime >= camp.respawnAt && !unitsNear(camp, def.leash)) spawnCamp(camp);
    for (const team of [0, 1]) if (teamCanSee(team, camp.x, camp.y)) camp.seen[team] = camp.state;
  }
  const foes = state.units.filter(u => u.hp > 0 && u.garrison == null);
  for (const camp of state.camps) {
    if (camp.state !== 'alive') continue;
    const def = CAMP_TYPES[camp.kind], monsters = campCreeps(camp);
    if (!monsters.length) { clearCamp(camp); continue; }
    const near = foes.filter(u => { const d = Math.hypot(u.x - camp.x, u.y - camp.y); return d <= def.leash && (d <= def.aggro + CREEP_CHASE_PAD || u.type === 'archer'); });
    if (near.some(u => monsters.some(c => Math.hypot(u.x - c.x, u.y - c.y) <= def.aggro))) camp.awake = AWAKE_SECONDS;
    else camp.awake = Math.max(0, camp.awake - dt);
    for (const c of monsters) stepCreep(c, camp, def, camp.awake > 0 ? near : [], dt);
  }
}
function stepCreep(c, camp, def, foes, dt) {
  const s = CREEP_TYPES[c.creep], sx = c.x, sy = c.y, reach = u => s.range + specs[u.type].r;
  c.timer -= dt; c.walk += dt; c.moving = false;
  // Keep the current target while it is in reach; otherwise the nearest unit within the leash.
  let t = foes.find(u => u.id === c.target) || null, best = null, bd = Infinity;
  for (const u of foes) { const d = Math.hypot(u.x - c.x, u.y - c.y); if (d < bd) { bd = d; best = u; } }
  if (!t || (best !== t && Math.hypot(t.x - c.x, t.y - c.y) > reach(t))) t = best;
  c.target = t ? t.id : null;
  if (t) {
    const d = Math.hypot(t.x - c.x, t.y - c.y);
    if (d > reach(t)) {
      steerTo(c, t.x, t.y, s.speed, dt);
      const out = Math.hypot(c.x - camp.x, c.y - camp.y);
      if (out > def.leash) { c.x = camp.x + (c.x - camp.x) * def.leash / out; c.y = camp.y + (c.y - camp.y) * def.leash / out; }
    } else if (c.timer <= 0) { c.timer = s.cooldown; strike(c, s, t); }
  } else {
    if (Math.hypot(c.homeX - c.x, c.homeY - c.y) > 6) { if (steerTo(c, c.homeX, c.homeY, s.speed * 1.2, dt)) clearPath(c); }
    else if (c.path) clearPath(c);
    if (camp.awake <= 0) c.hp = Math.min(c.max, c.hp + c.max * CREEP_REGEN * dt);
  }
  const mx = c.x - sx, my = c.y - sy;
  if (mx * mx + my * my > 1e-4) c.facing = facingFrom(mx, my, c.facing);
  else if (t) c.facing = facingFrom(t.x - c.x, t.y - c.y, c.facing);
}
// Bandit archers shoot arrows; the rest hit in melee, the troll and the boss also every unit around the target.
function strike(c, s, t) {
  if (s.ranged) { state.bullets.push({ id: nextFxId(), x: c.x, y: c.y - 3, target: t, damage: s.damage, team: CREEP_TEAM, speed: 280, life: 2, attackerType: s.counterAs }); return; }
  hurt(t, s.damage, CREEP_TEAM, s.counterAs || null, c.creep);
  if (s.splash) for (const u of state.units) if (u !== t && u.hp > 0 && u.garrison == null && Math.hypot(u.x - t.x, u.y - t.y) <= s.splash) hurt(u, s.damage * CREEP_SPLASH_SHARE, CREEP_TEAM, s.counterAs || null, c.creep);
}
// Called by hurt() for every hit on a monster: counts the side's share of the camp's damage and wakes the camp.
export function noteCreepHit(c, amount, team) {
  const camp = campById(c.camp); if (!camp) return;
  if (team === 0 || team === 1) camp.damage[team] += Math.max(0, Math.min(amount, c.hp));
  camp.awake = AWAKE_SECONDS;
}
// Called by hurt() when a monster dies: it leaves a falling body (display only).
export function creepKilled(c) {
  state.creeps = state.creeps.filter(x => x !== c);
  state.effects.push({ id: nextFxId(), kind: 'creepFall', creep: c.creep, facing: c.facing, x: c.x, y: c.y, life: 1.4, max: 1.4 });
}
function clearCamp(camp) {
  const def = CAMP_TYPES[camp.kind], [a, b] = camp.damage, team = a <= 0 && b <= 0 ? -1 : a >= b ? 0 : 1;
  camp.state = 'cleared'; camp.respawnAt = gameTime + def.respawn; camp.winner = team; camp.clearedAt = gameTime;
  if (team >= 0) {
    for (const [k, v] of Object.entries(def.reward)) { teamResources(team)[k] += v; recordGathered(team, k, v); }
    recordCamp(team);
    if (def.buff) state.buffs.push({ team, until: gameTime + def.buff.seconds, damage: def.buff.damage, speed: def.buff.speed, camp: camp.id });
  }
  for (const u of state.units) if (u.campTarget === camp.id) { u.campTarget = null; if (u.order === 'camp') { u.order = 'hold'; clearPath(u); } }
}
// Which monster `u` fights, if any: one of the camp it was ordered to clear (while seen), else one of an awake camp
// that is within its reach (plus CREEP_ENGAGE_MARGIN) — units defend themselves, but do not wander into camps.
export function creepTargetFor(u) {
  const list = state.creeps; if (!list?.length) return null;
  const range = specs[u.type].range; let best = null, bd = Infinity;
  for (const c of list) {
    if (c.hp <= 0) continue;
    const d = Math.hypot(c.x - u.x, c.y - u.y);
    if (u.campTarget === c.camp) { if (!teamCanSee(u.team, c.x, c.y)) continue; }
    else if (d > range + CREEP_TYPES[c.creep].r + CREEP_ENGAGE_MARGIN || !(campById(c.camp)?.awake > 0)) continue;
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}
// Player order (action 'camp'): the units walk to the camp and fight its monsters until it is cleared.
export function orderCampAttack(team, ids, campId) {
  const camp = campById(campId); if (!camp || camp.state !== 'alive') return 0;
  const want = new Set(ids || []); let n = 0;
  for (const u of state.units) if (u.team === team && want.has(u.id)) { u.order = 'camp'; u.campTarget = camp.id; u.dest = null; u.target = null; u.attackGoal = null; clearPath(u); n++; }
  return n;
}
// Any other order to these units drops their camp order.
export function forgetCamp(team, ids) { const want = new Set(ids || []); for (const u of state.units) if (u.team === team && want.has(u.id)) u.campTarget = null; }
