// @ts-nocheck
// What the local side last saw (fog of war V3.1, "sương mù mờ"; docs/features/fog-of-war.md). In explored ground it
// does not see right now, flags, territory colours, mines and the enemy's fortress and buildings are drawn as they were
// when last seen, not as they are; enemy units are never shown there. Display only: rebuilt from the state every frame
// by updateIntel() (draw()), never stored in state or sent over the network. The side always knows its own regions.
import { localTeam, state } from '../core/game';
import { teamCanSee } from '../sim/fog';

const UNSEEN_FLAG = { owner: -1, cap: 0, capTeam: -1, stage2: -1, contested: false }; // flags start neutral
let memo = null;
const fresh = team => ({ team, state, flags: new Map(), mines: new Map(), buildings: new Map(), bases: new Map(), visible: new Set() });
const flagFacts = r => ({ owner: r.owner, cap: r.cap, capTeam: r.capTeam, stage2: r.stage2, contested: r.contested });

export function updateIntel() {
  if (!state) return;
  const team = localTeam();
  if (!memo || memo.team !== team || memo.state !== state) memo = fresh(team);
  const see = (x, y) => teamCanSee(team, x, y), mine = owner => owner === team;
  for (const r of state.regions) {
    if (!r.cp) continue;
    const known = memo.flags.get(r.id);
    // Seen now, or one of the local side's own regions (now or as remembered): live.
    if (see(r.cp.x, r.cp.y) || mine(r.owner) || mine(known?.owner)) memo.flags.set(r.id, flagFacts(r));
  }
  state.mines.forEach((m, i) => { if (see(m.x, m.y) || mine(m.owner) || mine(memo.mines.get(i))) memo.mines.set(i, m.owner); });
  // Enemy structures: remembered as last seen; forgotten once the side sees the spot empty.
  const alive = new Set(); memo.visible.clear();
  for (const b of state.buildings) {
    if (b.team === team) continue; alive.add(b.id);
    if (see(b.x, b.y)) { memo.buildings.set(b.id, { ...b, upgrade: b.upgrade && { ...b.upgrade } }); memo.visible.add('b' + b.id); }
  }
  for (const [id, b] of memo.buildings) if (!alive.has(id) && see(b.x, b.y)) memo.buildings.delete(id);
  for (const b of state.bases) {
    if (b.team === team) continue;
    if (see(b.x, b.y)) { memo.bases.set(b.team, { ...b, guns: (b.guns || []).map(g => ({ ...g })) }); memo.visible.add('B' + b.team); }
  }
}
// A region's flag as the local side knows it (the live region with remembered owner and capture progress).
// Live when seen, when it is the side's own region, or when the side itself is capturing it.
export function knownFlag(r) {
  const team = localTeam();
  if (r.owner === team || r.capTeam === team || teamCanSee(team, r.cp.x, r.cp.y)) return r;
  return { ...r, ...(memo?.flags.get(r.id) || UNSEEN_FLAG) };
}
// Home regions (no flag) and the side's own regions are always known.
export const knownRegionOwner = r => (!r ? -1 : !r.cp || r.owner === localTeam() ? r.owner : (memo?.flags.get(r.id) || UNSEEN_FLAG).owner);
export function knownMine(m, i) { const owner = memo?.mines.has(i) ? memo.mines.get(i) : -1; return owner === m.owner ? m : { ...m, owner }; }
// Remembered enemy structures not seen right now (drawn in the veil as they were).
export const ghostBuildings = () => (memo ? [...memo.buildings.values()].filter(b => !memo.visible.has('b' + b.id)) : []);
export const ghostBases = () => (memo ? [...memo.bases.values()].filter(b => !memo.visible.has('B' + b.team)) : []);
