// @ts-nocheck
// Red-side attack planner for single-player mode (docs/features/ai-opponent.md): gathers the free army at a rally point,
// sends it as a wave at a target the AI knows about (enemy building or flag, then the fortress), retreats when the wave is
// mostly lost and regroups; pulls free units back when enemies are seen near its fortress. Pace from AI_DIFFICULTY.
import { AI_DIFFICULTY } from '../config/balance';
import { TILE_SIZE } from '../config/map';
import { H, W } from '../config/map';
import { gameTime, state } from '../core/game';
import { settings } from '../core/settings';
import { isTeamAreaExplored } from '../sim/fog';
import { nearestWalkable } from '../map/paths';

const TEAM = 1;
const REINFORCE_GROUP = 4;
const RALLY_DISTANCE = 260, RALLY_RADIUS = 220, ARRIVE_RADIUS = 200;
export const aiLevel = () => AI_DIFFICULTY[settings.aiDifficulty] || AI_DIFFICULTY.normal;
// phase: 'build' (economy only) → 'gather' (free fighters walk to the rally point) → 'attack' (the wave walks to target)
// → 'regroup' (survivors return home, wait lvl.regroup seconds) → 'build'. defend: centre of recent enemy sightings near home.
// camp / campSent / campStage / campGo: the neutral camp a squad is clearing, how many were sent, where it gathers
// first and whether it has gone in (ai/camps.ts).
export function newAIPlan() { return { phase: 'build', target: null, rally: null, wave: 0, launched: 0, since: 0, nextWaveAt: 0, defend: null, camp: null, campSent: 0, campStage: null, campGo: false }; }

const hyp = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const centre = list => ({ x: list.reduce((t, p) => t + p.x, 0) / list.length, y: list.reduce((t, p) => t + p.y, 0) / list.length });
const fighters = () => state.units.filter(u => u.team === TEAM && u.hp > 0 && u.type !== 'scout');
const free = u => !u.aiRole && u.captureTarget == null && !u.buildTarget;
const setRole = (list, role) => { for (const u of list) { u.aiRole = role; u.aiSpot = null; u.dest = null; } };

// What the AI knows to hit, cheapest first: explored enemy buildings and enemy-held flags (towers count as farther away),
// the remembered fortress (preferred from lvl.fortressAfterWave), else the last sighting of an enemy unit, else an unexplored spot.
function pickTarget(from, plan, lvl) {
  const options = [];
  // Towers count as farther away; with lvl.harass the enemy's farms count as nearer (hit the economy).
  for (const b of state.buildings) if (b.team !== TEAM && b.hp > 0 && isTeamAreaExplored(TEAM, b.x, b.y)) options.push({ kind: 'building', id: b.id, x: b.x, y: b.y, cost: hyp(from, b) * (b.kind === 'tower' ? 1.8 : b.kind === 'farm' && lvl.harass ? .6 : 1) });
  for (const r of state.regions) if (r.cp && r.owner >= 0 && r.owner !== TEAM && r.home == null && isTeamAreaExplored(TEAM, r.cp.x, r.cp.y)) options.push({ kind: 'region', id: r.id, x: r.cp.x, y: r.cp.y, cost: hyp(from, r.cp) });
  const base = state.enemyMemory?.base;
  if (base) options.push({ kind: 'base', x: base.x, y: base.y, cost: hyp(from, base) * (plan.wave >= lvl.fortressAfterWave ? .4 : 2.5) });
  if (options.length) return options.sort((a, b) => a.cost - b.cost)[0];
  const seen = [...(state.enemyMemory?.targets || [])].filter(m => m.age < 30).sort((a, b) => a.age - b.age)[0];
  if (seen) return { kind: 'explore', x: seen.x, y: seen.y };
  // Otherwise search — the AI does not know where the enemy lives (decision 4.1, 2026-10-20).
  const p = exploreSpot(from);
  return p ? { kind: 'explore', x: p.x, y: p.y } : null;
}
// An unexplored spot to look at from `from`: of 96 random unexplored spots, the one far from the AI's own fortress (the
// enemy lives at least BASE_MIN_SEPARATION away) but not too far from `from`, so waves and scouts sweep outward from home
// instead of crossing the map at random. Also used by the AI's scouts (core/match.ts).
export function exploreSpot(from) {
  const home = state.bases[TEAM]; let best = null, bestScore = -Infinity;
  for (let k = 0; k < 96; k++) {
    const x = Math.random() * W, y = Math.random() * H; if (isTeamAreaExplored(TEAM, x, y)) continue;
    const score = hyp({ x, y }, home) - 1.2 * hyp({ x, y }, from); if (score > bestScore) { bestScore = score; best = { x, y }; }
  }
  return best && nearestWalkable(best.x, best.y);
}
function targetDone(t, wave) {
  if (!t) return true;
  if (t.kind === 'building') return !state.buildings.some(b => b.id === t.id && b.hp > 0);
  if (t.kind === 'region') { const r = state.regions[t.id]; return !r || r.owner === TEAM && !r.cap; }
  if (t.kind === 'base') return state.bases[1 - TEAM].hp <= 0;
  return wave.length > 0 && wave.filter(u => hyp(u, t) < ARRIVE_RADIUS).length * 2 >= wave.length; // explore: half the wave reached the spot
}
function rallyPoint(target) {
  const home = state.bases[TEAM], d = hyp(home, target) || 1, k = Math.min(RALLY_DISTANCE, d * .4) / d;
  return nearestWalkable(home.x + (target.x - home.x) * k, home.y + (target.y - home.y) * k) || { x: home.x, y: home.y };
}

// One planner step, run on every AI turn (runEnemyAI()).
export function runAttackPlan() {
  const plan = state.aiPlan; if (!plan) return;
  const lvl = aiLevel(), home = state.bases[TEAM], army = fighters();
  const role = r => army.filter(u => u.aiRole === r);
  // Defence first: enemies seen near home in the last 6 s pull free and gathering fighters to them.
  const threats = (state.enemyMemory?.targets || []).filter(m => m.age < 6 && hyp(m, home) < lvl.defendRadius);
  if (threats.length >= 2) { plan.defend = centre(threats); setRole(army.filter(u => free(u) || u.aiRole === 'rally'), 'defend'); }
  else if (plan.defend) { plan.defend = null; setRole(role('defend'), plan.phase === 'gather' ? 'rally' : null); }
  if (plan.phase === 'regroup' && gameTime >= plan.nextWaveAt) plan.phase = 'build';
  if (plan.phase === 'build' && gameTime >= Math.max(plan.nextWaveAt, lvl.firstAttack)) {
    plan.target = pickTarget(home, plan, lvl);
    if (plan.target) { plan.rally = rallyPoint(plan.target); plan.phase = 'gather'; plan.since = gameTime; }
  }
  if (plan.phase === 'gather') {
    if (!plan.defend) setRole(army.filter(free), 'rally');
    const gathered = role('rally'), ready = gathered.filter(u => hyp(u, plan.rally) < RALLY_RADIUS).length;
    const need = lvl.waveSize + plan.wave * lvl.waveGrowth;
    if (ready >= need || (gameTime - plan.since >= lvl.gatherSeconds && ready >= Math.ceil(need * .6))) {
      setRole(gathered, 'wave'); plan.launched = gathered.length; plan.wave++; plan.phase = 'attack'; plan.since = gameTime;
      plan.target = pickTarget(plan.rally, plan, lvl) || plan.target;
    }
  } else if (plan.phase === 'attack') {
    let wave = role('wave');
    // Reinforcements: fighters made during the attack join it in groups of REINFORCE_GROUP or more (one at a time they
    // just die on the defences), except lvl.homeGuard of them who stay home.
    if (lvl.reinforce && !plan.defend) { const extra = army.filter(free).slice(lvl.homeGuard); if (extra.length >= REINFORCE_GROUP) { setRole(extra, 'wave'); plan.launched += extra.length; wave = role('wave'); } }
    if (wave.length <= plan.launched * lvl.retreatAt) retreat(plan, lvl, wave);
    else if (targetDone(plan.target, wave)) { plan.target = pickTarget(centre(wave), plan, lvl); if (!plan.target) retreat(plan, lvl, wave); }
    else if (plan.target.kind === 'explore') { const known = pickTarget(centre(wave), plan, lvl); if (known && known.kind !== 'explore') plan.target = known; } // found something real
  }
}
function retreat(plan, lvl, wave) { setRole(wave, 'retreat'); plan.phase = 'regroup'; plan.target = null; plan.nextWaveAt = gameTime + lvl.regroup; }

// Where an AI unit with a planner role should walk when it has no enemy in sight, or null for the usual errands.
// Called every frame from the unit loop (core/match.ts).
export function aiUnitGoal(u) {
  const plan = state.aiPlan; if (!plan || !u.aiRole) return null;
  const home = state.bases[TEAM];
  if (u.aiRole === 'defend') return plan.defend || (u.aiRole = null);
  if (u.aiRole === 'retreat') { if (hyp(u, home) < 200) { u.aiRole = null; return null; } return spot(u, home, 140); }
  if (u.aiRole === 'rally') return plan.rally ? spot(u, plan.rally, RALLY_RADIUS * .5) : (u.aiRole = null);
  if (u.aiRole === 'camp') { const c = state.camps?.find(k => k.id === u.campTarget); if (!c || c.state !== 'alive') { u.aiRole = null; u.campTarget = null; return null; } const plan2 = state.aiPlan; return plan2.campGo || !plan2.campStage ? spot(u, c, 70) : spot(u, plan2.campStage, 60); }
  if (u.aiRole === 'wave') return plan.target ? spot(u, plan.target, plan.target.kind === 'region' ? FLAG_SPREAD : 50) : null;
  return null;
}
const FLAG_SPREAD = 2 * TILE_SIZE;
// A personal spot around a point, so the group spreads instead of stacking; re-rolled when the point moves.
function spot(u, p, radius) {
  if (!u.aiSpot || u.aiSpot.cx !== p.x || u.aiSpot.cy !== p.y) {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * radius;
    const q = nearestWalkable(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d) || p;
    u.aiSpot = { cx: p.x, cy: p.y, x: q.x, y: q.y };
  }
  return u.aiSpot;
}
