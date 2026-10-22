// @ts-nocheck
// What each side knows about the enemy (docs/features/combat.md, fog-of-war.md): enemy fortress, buildings and held flags
// as last seen. Updated by the host / AI side from what each side sees right now (teamCanSee), never from what is hidden:
// a building seen and then left behind stays known until the side sees its spot empty. Used by the attack order to march
// on a known target when no enemy is in sight (attackGoal()). Kept here, not in state: only the deciding side needs it.
import { state } from '../core/game';
import { teamCanSee } from './fog';

let memo = null;
const fresh = () => ({ state, sides: [0, 1].map(() => ({ buildings: new Map(), base: null, flags: new Map() })) });
export const knowledgeOf = team => (memo && memo.state === state ? memo.sides[team] : null);

export function updateKnowledge() {
  if (!state) return;
  if (!memo || memo.state !== state) memo = fresh();
  for (const team of [0, 1]) {
    const k = memo.sides[team], see = (x, y) => teamCanSee(team, x, y), alive = new Set();
    for (const b of state.buildings) { if (b.team === team || b.hp <= 0) continue; alive.add(b.id); if (see(b.x, b.y)) k.buildings.set(b.id, { x: b.x, y: b.y, kind: b.kind }); }
    for (const [id, b] of k.buildings) if (!alive.has(id) && see(b.x, b.y)) k.buildings.delete(id);
    const base = state.bases.find(b => b.team !== team);
    if (base && see(base.x, base.y)) k.base = base.hp > 0 ? { x: base.x, y: base.y } : null;
    for (const r of state.regions) if (r.cp && see(r.cp.x, r.cp.y)) { if (r.owner >= 0 && r.owner !== team) k.flags.set(r.id, { x: r.cp.x, y: r.cp.y }); else k.flags.delete(r.id); }
  }
}
// Known enemy targets of `team`, each {key, x, y, label}.
function knownTargets(team) {
  const k = knowledgeOf(team); if (!k) return [];
  const out = [];
  for (const [id, b] of k.buildings) out.push({ key: 'b' + id, x: b.x, y: b.y, kind: b.kind });
  for (const [id, f] of k.flags) out.push({ key: 'r' + id, x: f.x, y: f.y, kind: 'flag' });
  if (k.base) out.push({ key: 'base', x: k.base.x, y: k.base.y, kind: 'base' });
  return out;
}
// The known enemy target nearest to (x, y), or null when the side knows of none.
export function nearestKnownTarget(team, x, y) {
  let best = null, bd = Infinity;
  for (const t of knownTargets(team)) { const d = Math.hypot(t.x - x, t.y - y); if (d < bd) { bd = d; best = t; } }
  return best;
}
// Where a unit with an attack order and no enemy in sight should go: its goal while still known, else the nearest known one.
export function attackGoal(u) {
  const known = knownTargets(u.team);
  if (u.attackGoal && known.some(t => t.key === u.attackGoal.key)) return u.attackGoal;
  const t = nearestKnownTarget(u.team, u.x, u.y);
  u.attackGoal = t ? { key: t.key, x: t.x, y: t.y } : null;
  return u.attackGoal;
}
