// @ts-nocheck
// Route lines for the local side's selected units and the pulse where a move order was given (docs/features/pathfinding.md).
import { ctx, zoom } from '../core/view';
import { localTeam, state } from '../core/game';
import { TILE_SIZE } from '../config/map';
import { bridges } from '../map/paths';
import { playSound } from '../audio/sound';

// Pulse shown at the clicked point for MOVE_MARKER_SECONDS after a move order (set by ui/input.ts via showMoveMarker()).
export const MOVE_MARKER_SECONDS = 1.2;
let moveMarker = null;
// Called for the local player's move orders only, so it also gives the order its sound.
export function showMoveMarker(x, y) { moveMarker = { x, y, at: performance.now() }; playSound('order.move'); }

// Dashed route for the local side's selected, moving units, with chevrons pointing the way and a small flag at the end.
// One line per move order (u.moveGroup): the unit with the longest way left draws it. Widths are in screen pixels.
export function drawUnitPaths() {
  const team = localTeam(), px = 1 / zoom, leaders = new Map();
  const left = u => { let d = 0, p = u; for (const q of u.path) { d += Math.hypot(q.x - p.x, q.y - p.y); p = q; } return d; };
  for (const u of state.units) {
    if (u.team !== team || !u.selected || u.hp <= 0 || !u.path?.length || (u.order !== 'move' && !u.moving)) continue;
    const key = u.order === 'move' && u.moveGroup != null ? 'g' + u.moveGroup : 'u' + u.id, cur = leaders.get(key), l = left(u);
    if (!cur || l > cur.l) leaders.set(key, { u, l });
  }
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const { u } of leaders.values()) {
    const pts = [{ x: u.x, y: u.y }, ...u.path];
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.setLineDash([]); ctx.strokeStyle = 'rgba(10,20,30,.55)'; ctx.lineWidth = 5 * px; ctx.stroke();
    ctx.setLineDash([9 * px, 7 * px]); ctx.lineDashOffset = -performance.now() / 40 * px; ctx.strokeStyle = '#ffe7a8'; ctx.lineWidth = 2.5 * px; ctx.stroke();
    ctx.setLineDash([]);
    // Chevrons every ~3 tiles along the route.
    let carry = TILE_SIZE * 1.5;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], b = pts[k], len = Math.hypot(b.x - a.x, b.y - a.y); if (len < 1) continue;
      const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
      for (let t = carry; t < len; t += TILE_SIZE * 3) {
        const x = a.x + ux * t, y = a.y + uy * t, s = 6 * px;
        ctx.beginPath(); ctx.moveTo(x - ux * s - uy * s, y - uy * s + ux * s); ctx.lineTo(x + ux * s, y + uy * s); ctx.lineTo(x - ux * s + uy * s, y - uy * s - ux * s);
        ctx.strokeStyle = '#ffe7a8'; ctx.lineWidth = 2 * px; ctx.stroke();
      }
      carry = Math.max(0, (carry - len) % (TILE_SIZE * 3));
    }
    const end = pts[pts.length - 1];
    ctx.beginPath(); ctx.ellipse(end.x, end.y, 9 * px, 5 * px, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,231,168,.35)'; ctx.fill(); ctx.strokeStyle = '#ffe7a8'; ctx.lineWidth = 1.5 * px; ctx.stroke();
    ctx.fillStyle = '#6b4f33'; ctx.fillRect(end.x - 1 * px, end.y - 16 * px, 2 * px, 16 * px);
    ctx.fillStyle = team === 0 ? '#4aaaff' : '#ff626b'; ctx.beginPath(); ctx.moveTo(end.x + 1 * px, end.y - 16 * px); ctx.lineTo(end.x + 10 * px, end.y - 12.5 * px); ctx.lineTo(end.x + 1 * px, end.y - 9 * px); ctx.closePath(); ctx.fill();
  }
  if (moveMarker) {
    const t = (performance.now() - moveMarker.at) / 1000 / MOVE_MARKER_SECONDS;
    if (t >= 1) moveMarker = null;
    else {
      ctx.globalAlpha = 1 - t;
      for (const k of [0, 0.35]) { const r = (8 + 26 * Math.min(1, t + k)) * px; ctx.beginPath(); ctx.ellipse(moveMarker.x, moveMarker.y, r, r * 0.55, 0, 0, Math.PI * 2); ctx.strokeStyle = '#ffe7a8'; ctx.lineWidth = 2.5 * px; ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

// Wooden bridges over the river (tiles from map/paths.ts), drawn on the ground layer.
export function drawBridges(left, top, right, bottom) {
  const T = TILE_SIZE;
  for (const b of bridges) {
    const x = b.x0 * T - T * 0.6, y = b.y0 * T + T * 0.1, w = (b.x1 - b.x0 + 1) * T + T * 1.2, h = (b.y1 - b.y0 + 1) * T - T * 0.2;
    if (x > right || x + w < left || y > bottom || y + h < top) continue;
    ctx.save();
    ctx.fillStyle = 'rgba(10,25,30,.35)'; ctx.fillRect(x + 6, y + 10, w, h);
    const deck = ctx.createLinearGradient(0, y, 0, y + h); deck.addColorStop(0, '#b78a55'); deck.addColorStop(.5, '#9a6e40'); deck.addColorStop(1, '#7a5530');
    ctx.fillStyle = deck; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(60,38,20,.65)'; ctx.lineWidth = 2;
    for (let px = x + 10; px < x + w; px += 14) { ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + h); ctx.stroke(); }
    ctx.fillStyle = '#5b3d22'; ctx.fillRect(x, y - 5, w, 7); ctx.fillRect(x, y + h - 2, w, 7);
    for (let px = x; px <= x + w; px += T * 1.5) { ctx.fillRect(px - 4, y - 10, 8, 12); ctx.fillRect(px - 4, y + h - 4, 8, 12); }
    ctx.restore();
  }
}
