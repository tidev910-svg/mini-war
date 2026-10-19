// @ts-nocheck
// Army formations (docs/features/formations.md): the player arranges the selected fighters (never scouts) as Phòng thủ,
// Mũi nhọn or Bao vây hai cánh around a virtual anchor. "Giữ đội hình": the anchor marches at the slowest member's speed
// and every member walks to its slot around it (faster units simply catch up and wait); narrow ground turns the formation
// into a 2-wide column. "Di chuyển tự do": each member walks to its slot at the destination at its own speed. Members
// may leave their slot to fight (FORMATION_LEASH) and walk back afterwards. State lives in state.formations (snapshot).
import { specs } from '../config/balance';
import { FORMATION_CATCHUP, FORMATION_COLUMN_ENTER, FORMATION_COLUMN_EXIT, FORMATION_COLUMN_SECONDS, FORMATION_KINDS, FORMATION_LEASH, FORMATION_MAX_WIDTH, FORMATION_MIN_WIDTH, FORMATION_MODES, FORMATION_SPACING, FORMATION_TURN_RATE, FORMATION_WAIT_MAX, FORMATION_WIDTH_FACTOR } from '../config/formation';
import { H, MAP_TILES, W } from '../config/map';
import { addLog, localTeam, nextId, setNextId, state } from '../core/game';
import { findPath, isWalkableAt, nearestWalkable, tileOf } from '../map/paths';
import { assignGroupMove, clearPath, knownMap, MOVE_BOUNDS } from './movement';
import { supplyFactor } from './economy';

const S = FORMATION_SPACING;
const ROLE_ORDER = { spearman: 0, infantry: 1, cavalry: 2, archer: 3 };
export const formationOf = u => (u.formation != null && state.formations?.find(f => f.id === u.formation)) || null;
const alive = f => f.ids.map(id => state.units.find(u => u.id === id)).filter(u => u && u.hp > 0 && u.formation === f.id);
const byType = (units, t) => units.filter(u => u.type === t);

// Slot offsets {f: forward, r: right} in px for each unit id. Missing types are simply left out; the result is centred
// on the members' centre of mass so the anchor sits in the middle of the formation.
export function formationLayout(kind, units) {
  const out = {}, inf = byType(units, 'infantry'), spear = byType(units, 'spearman'), arch = byType(units, 'archer'), cav = byType(units, 'cavalry');
  const width = Math.max(FORMATION_MIN_WIDTH, Math.min(FORMATION_MAX_WIDTH, Math.round(Math.sqrt(units.length) * FORMATION_WIDTH_FACTOR)));
  // Rows `width` wide, centred, from forward position f0 backwards; returns the next free forward position.
  const rows = (list, f0, w = width) => { list.forEach((u, i) => { const row = Math.floor(i / w), n = Math.min(w, list.length - row * w); out[u.id] = { f: f0 - row * S, r: ((i % w) - (n - 1) / 2) * S }; }); return list.length ? f0 - Math.ceil(list.length / w) * S : f0; };
  // Two wings, 2 slots wide each, starting `gap` beyond `half` on both sides, from forward position f0 backwards.
  const wings = (list, half, gap, f0) => list.forEach((u, i) => { const side = i % 2 ? 1 : -1, k = Math.floor(i / 2), col = k % 2, row = Math.floor(k / 2); out[u.id] = { f: f0 - row * S, r: side * (half + gap + col * S) }; });
  const halfOf = n => (Math.min(width, Math.max(1, n)) - 1) / 2 * S;
  if (kind === 'wedge') {
    // Tip of infantry (spearmen if there is none): row k holds 2k+1 slots; spearmen line both outer edges, row by row.
    const tip = inf.length ? inf : spear, edges = inf.length ? spear : [];
    let k = 0, placed = 0, half = 0;
    while (placed < tip.length) { for (let j = 0; j <= 2 * k && placed < tip.length; j++, placed++) out[tip[placed].id] = { f: -k * S * .9, r: (j - k) * S }; half = k * S; k++; }
    const depthRows = Math.max(k, 1);
    edges.forEach((u, i) => { const side = i % 2 ? 1 : -1, row = 1 + Math.floor(i / 2); out[u.id] = { f: -row * S * .9, r: side * (row + 1) * S }; half = Math.max(half, (row + 1) * S); });
    const back = -Math.max(depthRows, 1 + Math.ceil(edges.length / 2)) * S * .9 - S * .5;
    rows(arch, back);
    wings(cav, half, S * 2, -S);
  } else if (kind === 'flank') {
    const centre = [...inf, ...spear], next = rows(centre, 0);
    rows(arch, next - S * .3);
    wings(cav, halfOf(centre.length), S * 4, S * 1.5);
  } else { // defense
    const front = [...spear, ...inf], next = rows(front, 0);
    rows(arch, next - S * .3);
    wings(cav, halfOf(front.length), S * 1.5, 0);
  }
  const ids = Object.keys(out), cf = ids.reduce((t, id) => t + out[id].f, 0) / (ids.length || 1), cr = ids.reduce((t, id) => t + out[id].r, 0) / (ids.length || 1);
  for (const id of ids) { out[id].f -= cf; out[id].r -= cr; }
  return out;
}
// World position of a slot for a formation centred at (x, y) facing `angle`.
export function slotWorld(x, y, angle, s) { const c = Math.cos(angle), n = Math.sin(angle); return { x: x + c * s.f - n * s.r, y: y + n * s.f + c * s.r }; }
const clampPt = p => ({ x: Math.max(MOVE_BOUNDS.left, Math.min(MOVE_BOUNDS.right, p.x)), y: Math.max(MOVE_BOUNDS.top, Math.min(MOVE_BOUNDS.bottom, p.y)) });
const centreOf = us => ({ x: us.reduce((t, u) => t + u.x, 0) / us.length, y: us.reduce((t, u) => t + u.y, 0) / us.length });
// Open on what the side knows: real open ground, or ground it has not explored (same rule as route planning).
function openFor(team, p) { if (isWalkableAt(p.x, p.y)) return true; const known = knownMap(team); return !known?.[tileOf(p.y) * MAP_TILES + tileOf(p.x)]; }

function relayout(f, members) { f.slots = formationLayout(f.kind, members); f.ids = members.map(u => u.id); f.colOrder = null; }
function removeFromFormation(u) {
  const f = formationOf(u); u.formation = null;
  if (u.order === 'formation') u.order = 'hold';
  if (!f) return;
  f.ids = f.ids.filter(id => id !== u.id); delete f.slots[u.id];
  if (!f.ids.length) state.formations = state.formations.filter(q => q !== f);
}
// Units given an order of their own leave their formation (the rest keeps its order).
export function detachUnits(team, ids) { const want = new Set(ids || []); for (const u of state.units) if (u.team === team && want.has(u.id) && u.formation != null) removeFromFormation(u); }

// Formations of `team` whose every living member is in `ids`; members of other formations in `ids` are detached.
function wholeFormations(team, ids) {
  const want = new Set(ids || []), whole = [];
  for (const f of [...(state.formations || [])]) {
    if (f.team !== team) continue;
    const members = alive(f); if (!members.length) continue;
    const inside = members.filter(u => want.has(u.id));
    if (inside.length === members.length) whole.push(f);
    else for (const u of inside) removeFromFormation(u);
  }
  return whole;
}

// "Đội hình" with a kind: arrange the chosen fighters (scouts are left alone). Returns the formation or null.
export function createFormation(team, ids, kind) {
  if (!FORMATION_KINDS[kind]) return null;
  const want = new Set(ids || []), chosen = state.units.filter(u => u.team === team && u.hp > 0 && want.has(u.id));
  const members = chosen.filter(u => u.type !== 'scout'), scouts = chosen.length - members.length;
  if (!members.length) { if (team === localTeam()) addLog('Đội hình cần ít nhất một quân chiến đấu (trinh sát không tham gia).'); return null; }
  // The same formation re-shaped keeps its anchor, heading and mode.
  const same = members[0].formation != null && members.every(u => u.formation === members[0].formation) && alive(formationOf(members[0]) || { ids: [] }).length === members.length ? formationOf(members[0]) : null;
  let f = same;
  if (!f) {
    for (const u of members) if (u.formation != null) removeFromFormation(u);
    const c = centreOf(members), base = state.bases[team], away = Math.hypot(c.x - base.x, c.y - base.y) > 60;
    const anchor = nearestWalkable(c.x, c.y, 8) || c;
    f = { id: (setNextId(nextId + 1) - 1), team, kind, mode: 'hold', ids: [], slots: {}, x: anchor.x, y: anchor.y,
      angle: away ? Math.atan2(c.y - base.y, c.x - base.x) : Math.atan2(H / 2 - c.y, W / 2 - c.x), path: [], moving: false, wait: 0, column: false, colTimer: 0, trail: [], aggressive: false };
    (state.formations ||= []).push(f);
  }
  f.kind = kind; relayout(f, members);
  for (const u of members) { u.formation = f.id; u.order = 'formation'; u.dest = null; clearPath(u); }
  if (team === localTeam()) addLog(`Đội hình ${FORMATION_KINDS[kind].name}: ${members.length} quân${scouts ? ` (${scouts} trinh sát không tham gia)` : ''} · ${FORMATION_MODES[f.mode]}.`);
  return f;
}
export function setFormationMode(team, ids, mode) {
  if (!FORMATION_MODES[mode]) return;
  for (const f of wholeFormations(team, ids)) { f.mode = mode; if (team === localTeam()) addLog(`Đội hình ${FORMATION_KINDS[f.kind].name}: ${FORMATION_MODES[mode]}.`); }
}
// "Hủy đội hình": every formation with a chosen member dissolves; its units stay where they are.
export function cancelFormations(team, ids) {
  const want = new Set(ids || []), gone = (state.formations || []).filter(f => f.team === team && f.ids.some(id => want.has(id)));
  for (const f of gone) for (const u of alive(f)) { u.formation = null; if (u.order === 'formation') u.order = 'hold'; u.dest = null; clearPath(u); }
  state.formations = (state.formations || []).filter(f => !gone.includes(f));
  if (gone.length && team === localTeam()) addLog('Đã hủy đội hình: quân đứng tại chỗ, di chuyển tự do.');
}

// Move order. Whole formations march (hold) or walk to their slots at the destination (free); returns the ids handled.
export function orderFormationMove(team, ids, x, y) {
  const handled = new Set();
  for (const f of wholeFormations(team, ids)) {
    const members = alive(f); relayout(f, members); f.aggressive = false;
    const dest = clampPt(nearestWalkable(x, y, 24) || { x, y });
    if (Math.hypot(dest.x - f.x, dest.y - f.y) > 20) f.angle = Math.atan2(dest.y - f.y, dest.x - f.x);
    if (f.mode === 'free') {
      f.x = dest.x; f.y = dest.y; f.path = []; f.moving = false; f.column = false;
      const slots = members.map(u => clampPt(slotWorld(dest.x, dest.y, f.angle, f.slots[u.id])));
      assignGroupMove(members, slots, dest.x, dest.y); // order 'move'; back to 'formation' on arrival (core/match.ts)
    } else {
      f.path = findPath(f.x, f.y, dest.x, dest.y, knownMap(team)); f.moving = f.path.length > 0; f.wait = 0; f.trail = [{ x: f.x, y: f.y }];
      for (const u of members) { u.order = 'formation'; u.dest = null; clearPath(u); }
    }
    for (const u of members) handled.add(u.id);
  }
  return handled;
}
// Stop: whole formations halt where their members are; returns the ids handled.
export function stopFormations(team, ids) {
  const handled = new Set();
  for (const f of wholeFormations(team, ids)) {
    const members = alive(f), c = centreOf(members);
    f.x = c.x; f.y = c.y; f.path = []; f.moving = false; f.column = false; f.aggressive = false;
    for (const u of members) { u.order = 'formation'; u.dest = null; clearPath(u); handled.add(u.id); }
  }
  return handled;
}
// Attack: whole formations keep their shape but members chase any enemy in sight, then regroup; returns the ids handled.
export function attackFormations(team, ids) {
  const handled = new Set();
  for (const f of wholeFormations(team, ids)) { f.aggressive = true; for (const u of alive(f)) handled.add(u.id); }
  return handled;
}

// Where a member should stand now: its slot around the anchor, or its place in the column while squeezing through.
export function formationTarget(f, u) {
  const s = f.slots[u.id]; if (!s) return { x: u.x, y: u.y };
  if (f.column) {
    const order = f.colOrder || (f.colOrder = columnOrder(f));
    const i = Math.max(0, order.indexOf(u.id)), back = Math.floor(i / 2) * S * .9, side = (i % 2 ? 1 : -1) * S * .3;
    const p = trailPoint(f, back);
    return clampPt({ x: p.x - Math.sin(p.a) * side, y: p.y + Math.cos(p.a) * side });
  }
  const p = clampPt(slotWorld(f.x, f.y, f.angle, s));
  return isWalkableAt(p.x, p.y) ? p : nearestWalkable(p.x, p.y, 4) || p;
}
const unitType = id => state.units.find(u => u.id === id)?.type;
// Column order: front slots first, spearmen and infantry before cavalry and archers.
const columnOrder = f => Object.keys(f.slots).map(Number).sort((a, b) => f.slots[b].f - f.slots[a].f || ROLE_ORDER[unitType(a)] - ROLE_ORDER[unitType(b)]);
// Point `d` px back along the anchor's trail (newest first), with the local heading `a`.
function trailPoint(f, d) {
  let p = { x: f.x, y: f.y }, left = d;
  for (const q of f.trail) { const len = Math.hypot(q.x - p.x, q.y - p.y); if (len >= left && len > 0) { const t = left / len; return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t, a: Math.atan2(p.y - q.y, p.x - q.x) }; } left -= len; p = q; }
  return { ...p, a: f.angle };
}
// A member may leave its slot to fight an enemy this close to the slot (any enemy after an attack order).
export function formationMayChase(f, u, target) {
  if (f.aggressive) return true;
  const p = formationTarget(f, u); return Math.hypot(target.x - p.x, target.y - p.y) <= FORMATION_LEASH;
}

// Once per frame on the host / AI side, before units move: prune, march the anchor, switch column mode.
export function updateFormations(dt) {
  if (!state.formations?.length) return;
  for (const f of [...state.formations]) {
    const members = alive(f);
    if (!members.length) { state.formations = state.formations.filter(q => q !== f); continue; }
    if (members.length !== f.ids.length) f.ids = members.map(u => u.id);
    if (f.mode !== 'hold' || !f.moving) { f.column = false; continue; }
    // Wait for stragglers (fighting units count as late), but never longer than FORMATION_WAIT_MAX at a time.
    const inPlace = members.filter(u => { const p = formationTarget(f, u); return Math.hypot(p.x - u.x, p.y - u.y) <= FORMATION_CATCHUP; }).length;
    if (inPlace * 2 < members.length && f.wait < FORMATION_WAIT_MAX) { f.wait += dt; continue; }
    if (inPlace * 5 >= members.length * 4) f.wait = 0;
    // March at the slowest member's speed (their own speeds are untouched; a starving army is slower for everyone).
    let budget = Math.min(...members.map(u => specs[u.type].speed)) * supplyFactor(f.team, 'speed') * dt;
    while (budget > 0 && f.path.length) {
      const q = clampPt(f.path[0]), d = Math.hypot(q.x - f.x, q.y - f.y), step = Math.min(d, budget);
      if (d > 1e-6) { const head = Math.atan2(q.y - f.y, q.x - f.x); f.x += (q.x - f.x) / d * step; f.y += (q.y - f.y) / d * step; turn(f, head, dt); }
      budget -= step; if (step >= d) f.path.shift();
    }
    const last = f.trail[0]; if (!last || Math.hypot(last.x - f.x, last.y - f.y) >= 6) { f.trail.unshift({ x: f.x, y: f.y }); if (f.trail.length > 400) f.trail.length = 400; }
    if (!f.path.length) { f.moving = false; f.column = false; continue; }
    // Narrow ground: share of slots (as laid out around the anchor) that are blocked on what the side knows.
    const blocked = members.filter(u => !openFor(f.team, slotWorld(f.x, f.y, f.angle, f.slots[u.id]))).length / members.length;
    if (!f.column && blocked >= FORMATION_COLUMN_ENTER) { f.column = true; f.colTimer = 0; f.colOrder = columnOrder(f); }
    else if (f.column) { f.colTimer = blocked <= FORMATION_COLUMN_EXIT ? f.colTimer + dt : 0; if (f.colTimer >= FORMATION_COLUMN_SECONDS) f.column = false; }
  }
}
// Turn the heading toward `head` at most FORMATION_TURN_RATE·dt (the shorter way round).
function turn(f, head, dt) { let d = head - f.angle; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; const m = FORMATION_TURN_RATE * dt; f.angle += Math.max(-m, Math.min(m, d)); }
