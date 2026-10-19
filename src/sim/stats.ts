// @ts-nocheck
// Match statistics (docs/features/match-stats.md): what each side trained, lost, destroyed, gathered and spent, plus a
// timeline of regions held and army size. Recorded by the host / AI simulation into state.stats, so the PvP guest gets
// it in the snapshot; shown on the result screen (ui/results.ts) and copyable as JSON for balance playtests.
import { gameTime, state } from '../core/game';

export const STATS_SAMPLE_SECONDS = 10;
const zero = () => ({ food: 0, wood: 0, stone: 0, gold: 0 });
const side = () => ({ trained: 0, lost: 0, killed: 0, damage: 0, built: 0, buildingsLost: 0, peakArmy: 0, gathered: zero(), spent: zero() });
export function newStats() { return { sides: [side(), side()], timeline: [], clock: 0 }; }
const sideOf = team => state?.stats?.sides?.[team];

export function recordGathered(team, resource, amount) { const s = sideOf(team); if (s) s.gathered[resource] += amount; }
export function recordTrained(team) { const s = sideOf(team); if (s) s.trained++; }
export function recordDamage(team, amount) { const s = sideOf(team); if (s) s.damage += Math.max(0, amount); }
export function recordUnitDeath(victimTeam, killerTeam) { const v = sideOf(victimTeam), k = sideOf(killerTeam); if (v) v.lost++; if (k && killerTeam !== victimTeam) k.killed++; }
export function recordBuilt(team) { const s = sideOf(team); if (s) s.built++; }
export function recordBuildingLost(team) { const s = sideOf(team); if (s) s.buildingsLost++; }

// One timeline point: regions held (home included) and living army per side.
export function sampleStats() {
  const st = state?.stats; if (!st) return;
  const regions = [0, 1].map(t => state.regions.filter(r => r.owner === t).length), army = [0, 1].map(t => state.units.filter(u => u.team === t && u.hp > 0).length);
  for (const t of [0, 1]) st.sides[t].peakArmy = Math.max(st.sides[t].peakArmy, army[t]);
  const last = st.timeline[st.timeline.length - 1];
  if (last && Math.abs(last.t - gameTime) < .5) st.timeline.pop();
  st.timeline.push({ t: Math.round(gameTime), regions, army });
}
export function updateStats(dt) {
  const st = state?.stats; if (!st) return;
  if (!st.timeline.length) sampleStats();
  st.clock += dt; if (st.clock >= STATS_SAMPLE_SECONDS) { st.clock -= STATS_SAMPLE_SECONDS; sampleStats(); }
}
