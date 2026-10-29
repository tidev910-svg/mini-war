// @ts-nocheck
// Red-side camp hunting for single-player mode (docs/features/ai-opponent.md, neutral-camps.md). Between attack waves the
// AI sends a squad of free (or still gathering) fighters to a neutral camp it knows is full — only camps it has seen (or the announced tomb),
// only the kinds its difficulty clears (AI_DIFFICULTY.camps) — and calls them back when the camp is cleared or the squad
// is mostly lost. The squad first gathers at a stage
// point outside the camp's aggro, on the side facing the AI's fortress, and goes in together once most of it is there
// (one by one, fast wolves pick them off).
import { AI_CAMP_SQUAD, CAMP_TYPES } from '../config/creeps';
import { gameTime, state } from '../core/game';
import { campKnownState } from '../sim/creeps';
import { aiLevel } from './attack';
import { nearestWalkable } from '../map/paths';

const STAGE_GAP = 90, STAGE_RADIUS = 110, STAGE_SHARE = .7;

const TEAM = 1;
const hyp = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const free = u => !u.aiRole && u.captureTarget == null && !u.buildTarget;
const release = list => { for (const u of list) { u.aiRole = null; u.aiSpot = null; u.dest = null; u.campTarget = null; } };

// A camp woken by AI units passing by (a wave, a capture squad on its way): when a camp squad's worth of AI units plus
// CAMP_RALLY_SPARE (AI_CAMP_SQUAD) is within CAMP_RALLY_RADIUS, all of them fight it together; fewer walk on past it
// (core/match.ts). Never the tomb: only a squad sent for it fights it. On every difficulty.
const CAMP_RALLY_RADIUS = 500, CAMP_RALLY_SPARE = 2;
function fightWokenCamps() {
  for (const camp of state.camps) {
    if (camp.state !== 'alive' || !(camp.awake > 0) || CAMP_TYPES[camp.kind].opensAt) continue;
    const near = state.units.filter(u => u.team === TEAM && u.hp > 0 && u.type !== 'scout' && hyp(u, camp) <= CAMP_RALLY_RADIUS);
    if (near.length < AI_CAMP_SQUAD[camp.kind] + CAMP_RALLY_SPARE || !near.some(u => hyp(u, camp) <= CAMP_TYPES[camp.kind].aggro + 60)) continue;
    for (const u of near) if (u.campTarget == null) u.campTarget = camp.id;
  }
}

export function runCampPlan() {
  const plan = state.aiPlan, lvl = aiLevel(), kinds = lvl.camps || [];
  if (!plan || !state.camps?.length) return;
  fightWokenCamps();
  if (!kinds.length) return;
  const home = state.bases[TEAM], army = state.units.filter(u => u.team === TEAM && u.hp > 0 && u.type !== 'scout');
  const squad = army.filter(u => u.aiRole === 'camp');
  const camp = plan.camp != null ? state.camps.find(c => c.id === plan.camp) : null;
  // Done, or the squad is down to less than half of what was sent: come home.
  if (plan.camp != null && (!camp || camp.state !== 'alive' || squad.length < Math.ceil((plan.campSent || 1) / 2))) { release(squad); plan.camp = null; plan.campGo = false; return; }
  if (plan.camp != null && !plan.campGo && plan.campStage && squad.filter(u => hyp(u, plan.campStage) <= STAGE_RADIUS).length >= Math.ceil(squad.length * STAGE_SHARE)) plan.campGo = true;
  if (plan.camp != null || plan.defend || plan.phase === 'attack') return;
  // Free fighters, and those gathering for the next wave (they rejoin it afterwards); lvl.homeGuard of them stay home.
  const spare = army.filter(u => free(u) || u.aiRole === 'rally').slice(lvl.homeGuard || 0);
  const options = state.camps.filter(c => kinds.includes(c.kind) && c.state === 'alive' && campKnownState(c, TEAM) === 'alive' && (!CAMP_TYPES[c.kind].opensAt || gameTime >= CAMP_TYPES[c.kind].opensAt))
    .filter(c => spare.length >= AI_CAMP_SQUAD[c.kind])
    .sort((a, b) => hyp(a, home) - hyp(b, home));
  const target = options[0]; if (!target) return;
  const sent = spare.sort((p, q) => hyp(p, target) - hyp(q, target)).slice(0, AI_CAMP_SQUAD[target.kind] + 1);
  for (const u of sent) { u.aiRole = 'camp'; u.aiSpot = null; u.dest = null; u.campTarget = target.id; }
  // Stage point: past the aggro radius plus the camp's spread, toward the AI's fortress.
  const d = hyp(home, target) || 1, k = (CAMP_TYPES[target.kind].aggro + STAGE_GAP + 70) / d;
  plan.campStage = nearestWalkable(target.x + (home.x - target.x) * k, target.y + (home.y - target.y) * k) || { x: target.x, y: target.y };
  plan.camp = target.id; plan.campSent = sent.length; plan.campGo = false;
}
