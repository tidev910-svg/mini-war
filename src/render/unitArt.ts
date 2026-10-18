// @ts-nocheck
// Code-drawn soldiers in four directions (docs/features/rendering.md). Every frame is painted once into a small cached
// canvas and reused; drawUnit() picks the frame from the unit's facing, walk clock and attack timer.
//   views: 'down' (towards the viewer), 'up' (back turned), 'side' (facing right; facing left = mirrored at draw time)
//   poses: 'idle' (4 frames, breathing), 'walk' (4 frames, stride), 'strike' (1 frame: slash, thrust or drawn bow)
// Coordinates are design units with the feet at (0, 0) and y growing downwards; FIGURE_H is feet-to-helmet height,
// which drawUnit() scales to unitTargetHeight(type).
import { TEAM_COLORS } from '../config/theme';
import { UNIT_ART as A } from '../config/visuals';

const TAU = Math.PI * 2, SS = 1.6; // supersampling of the cached canvases
export const FIGURE_H = { infantry: 54, spearman: 56, archer: 53, scout: 52, cavalry: 80 };
// Canvas box per type in design units: width, height and the feet anchor inside it.
const BOX = { foot: { w: 84, h: 100, ax: 42, ay: 90 }, cavalry: { w: 156, h: 124, ax: 78, ay: 112 } };

// ---- drawing helpers ----
function ell(c, x, y, rx, ry, fill, stroke, lw = 1.1, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } }
function rr(c, x, y, w, h, r, fill, stroke, lw = 1.1) { c.beginPath(); c.roundRect(x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } }
function poly(c, pts, fill, stroke, lw = 1.1) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } }
function seg(c, x1, y1, x2, y2, color, lw) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.stroke(); }
// A limb: dark outline stroke under a coloured stroke, so arms and legs read at small sizes.
function limb(c, x1, y1, x2, y2, color, w) { seg(c, x1, y1, x2, y2, A.ink, w + 2); seg(c, x1, y1, x2, y2, color, w); }

// ---- gear ----
function sword(c, hx, hy, tx, ty) { // hilt at the hand, blade to the tip
  const dx = tx - hx, dy = ty - hy, l = Math.hypot(dx, dy) || 1, nx = -dy / l * 3, ny = dx / l * 3;
  seg(c, hx, hy, tx, ty, A.ink, 4.2); seg(c, hx, hy, tx, ty, A.steelLight, 2.4);
  seg(c, hx - nx, hy - ny, hx + nx, hy + ny, A.gold, 2.2); // cross-guard
}
function spear(c, bx, by, tx, ty) {
  seg(c, bx, by, tx, ty, A.ink, 3.4); seg(c, bx, by, tx, ty, A.wood, 2);
  const dx = tx - bx, dy = ty - by, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  poly(c, [tx + ux * 7, ty + uy * 7, tx - uy * 2.6, ty + ux * 2.6, tx + uy * 2.6, ty - ux * 2.6], A.steelLight, A.ink, 1);
}
function roundShield(c, x, y, r, team, back = false) {
  if (back) { ell(c, x, y, r, r, A.wood, A.ink, 1.3); seg(c, x - r * .7, y, x + r * .7, y, A.leatherDark, 2); return; }
  ell(c, x, y, r, r, team.primary, A.ink, 1.3); ell(c, x, y, r - 1.6, r - 1.6, null, A.gold, 1.2);
  ell(c, x, y, r * .45, r * .45, team.light); ell(c, x, y, r * .22, r * .22, A.steel, A.ink, .8);
}
function kiteShield(c, x, y, s, team, back = false, narrow = 1) {
  const w = 9 * s * narrow, pts = [x - w, y - 11 * s, x + w, y - 11 * s, x + w * .95, y + 2 * s, x, y + 13 * s, x - w * .95, y + 2 * s];
  if (back) { poly(c, pts, A.wood, A.ink, 1.3); seg(c, x, y - 9 * s, x, y + 9 * s, A.leatherDark, 1.6); return; }
  poly(c, pts, team.primary, A.ink, 1.3);
  if (narrow > .6) { poly(c, [x - 3 * s * narrow, y - 6 * s, x, y - 1 * s, x + 3 * s * narrow, y - 6 * s, x + 3 * s * narrow, y - 3 * s, x, y + 2 * s, x - 3 * s * narrow, y - 3 * s], team.light); }
  c.beginPath(); c.moveTo(pts[0], pts[1]); c.lineTo(pts[2], pts[3]); c.strokeStyle = A.gold; c.lineWidth = 1.4; c.stroke();
}
function bow(c, x, y, h, facing, draw = 0) { // vertical bow at x, grip at y; facing = +1 bulges right
  c.beginPath(); c.moveTo(x, y - h / 2); c.quadraticCurveTo(x + facing * h * .42, y, x, y + h / 2);
  c.strokeStyle = A.ink; c.lineWidth = 3.4; c.stroke(); c.strokeStyle = A.wood; c.lineWidth = 2; c.stroke();
  const sx = x - facing * draw; c.beginPath(); c.moveTo(x, y - h / 2); c.lineTo(sx, y); c.lineTo(x, y + h / 2); c.strokeStyle = A.string; c.lineWidth = .8; c.stroke();
}
function quiver(c, x, y, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  for (const dx of [-2, 0, 2]) { seg(c, dx, -12, dx, -16, A.wood, 1); poly(c, [dx - 1.6, -16, dx + 1.6, -16, dx, -19.5], A.string); }
  rr(c, -3.5, -12, 7, 17, 2, A.leather, A.ink, 1); seg(c, -3.5, -8, 3.5, -8, A.leatherDark, 1.2);
  c.restore();
}

// ---- heads ----
function head(c, kind, view, x, y, team) {
  const r = 7.4;
  if (view === 'up') {
    ell(c, x, y, r, r, kind === 'scout' ? A.cloak : kind === 'archer' ? team.dark : A.steel, A.ink, 1.2);
    if (kind === 'infantry' || kind === 'spearman') { seg(c, x, y - r, x, y + r * .6, A.steelDark, 1.4); }
    if (kind === 'archer') ell(c, x, y + 3, 5, 3, A.leatherDark);
    if (kind === 'scout') poly(c, [x - 5, y + 2, x + 5, y + 2, x, y + 11], A.cloakDark, A.ink, 1);
  } else if (view === 'down') {
    ell(c, x, y, r, r, A.skin, A.ink, 1.2);
    ell(c, x - 2.6, y + .5, .9, 1.1, A.ink); ell(c, x + 2.6, y + .5, .9, 1.1, A.ink);
    if (kind === 'infantry') { c.beginPath(); c.arc(x, y, r + .4, Math.PI, TAU); c.closePath(); c.fillStyle = A.steel; c.fill(); c.strokeStyle = A.ink; c.lineWidth = 1.2; c.stroke(); rr(c, x - .8, y - 1, 1.6, 4.5, .8, A.steelDark); }
    if (kind === 'spearman') { ell(c, x, y, r + .6, r + .8, A.steel, A.ink, 1.2); rr(c, x - 5, y - .6, 10, 1.8, .8, A.ink); seg(c, x, y + 1.6, x, y + 5.5, A.steelDark, 1.2); }
    if (kind === 'archer') { c.beginPath(); c.arc(x, y + .5, r + 1.4, Math.PI * .92, Math.PI * 2.08); c.lineTo(x + r + 1, y + 6); c.lineTo(x + r - 2, y - 1); c.arc(x, y + .5, r - 1.4, Math.PI * 2, Math.PI, true); c.lineTo(x - r - 1, y + 6); c.closePath(); c.fillStyle = team.dark; c.fill(); c.strokeStyle = A.ink; c.lineWidth = 1.1; c.stroke(); }
    if (kind === 'scout') { c.beginPath(); c.moveTo(x - r - 2, y + 7); c.quadraticCurveTo(x - r - 2, y - r - 5, x, y - r - 4); c.quadraticCurveTo(x + r + 2, y - r - 5, x + r + 2, y + 7); c.lineTo(x + r - 2, y + 7); c.quadraticCurveTo(x + r - 1, y - r + 1, x, y - r + 1); c.quadraticCurveTo(x - r + 1, y - r + 1, x - r + 2, y + 7); c.closePath(); c.fillStyle = A.cloak; c.fill(); c.strokeStyle = A.ink; c.lineWidth = 1.1; c.stroke(); }
  } else { // side, facing right
    ell(c, x, y, r, r, A.skin, A.ink, 1.2);
    poly(c, [x + r - 1, y - 1.5, x + r + 2.6, y + 1.4, x + r - 1, y + 2.4], A.skin, A.ink, 1); // nose
    ell(c, x + 3.4, y - .2, .9, 1.1, A.ink);
    if (kind === 'infantry') { c.beginPath(); c.arc(x, y, r + .4, Math.PI * 1.02, TAU * 1.0); c.lineTo(x - r, y + 2); c.closePath(); c.fillStyle = A.steel; c.fill(); c.strokeStyle = A.ink; c.lineWidth = 1.2; c.stroke(); rr(c, x + r - 1.6, y - 1, 1.6, 4.4, .8, A.steelDark); }
    if (kind === 'spearman') { ell(c, x, y, r + .6, r + .8, A.steel, A.ink, 1.2); rr(c, x + 1, y - .8, r, 1.8, .8, A.ink); }
    if (kind === 'archer') { c.beginPath(); c.arc(x - .5, y, r + 1.3, Math.PI * .55, Math.PI * 1.85); c.quadraticCurveTo(x + 2, y - 3, x - 1, y + 7); c.closePath(); c.fillStyle = team.dark; c.fill(); c.strokeStyle = A.ink; c.lineWidth = 1.1; c.stroke(); }
    if (kind === 'scout') { c.beginPath(); c.moveTo(x + r - 1, y + 6); c.quadraticCurveTo(x + r + 1, y - r - 4, x - 2, y - r - 3); c.quadraticCurveTo(x - r - 6, y - r, x - r - 5, y + 9); c.lineTo(x - 2, y + 7); c.quadraticCurveTo(x + 3, y - 3, x + r - 3, y + 6); c.closePath(); c.fillStyle = A.cloak; c.fill(); c.strokeStyle = A.ink; c.lineWidth = 1.1; c.stroke(); }
  }
  // Plumes in the side's colour on the helmets.
  if (kind === 'spearman' || kind === 'infantry') {
    const big = kind === 'spearman', ph = big ? 9 : 5;
    if (view === 'side') { c.beginPath(); c.moveTo(x - 1, y - r - 1); c.quadraticCurveTo(x - 4, y - r - ph - 2, x - 10 - ph * .6, y - r + 1); c.quadraticCurveTo(x - 5, y - r - 1, x - 1, y - r - 1); c.fillStyle = team.primary; c.fill(); c.strokeStyle = A.ink; c.lineWidth = 1; c.stroke(); }
    else ell(c, x, y - r - ph * .45, big ? 3.2 : 2, ph * .6, team.primary, A.ink, 1);
  }
}

// ---- foot soldiers ----
function torsoColors(kind, team) {
  return kind === 'scout' ? { body: A.cloak, trim: team.primary, arm: A.cloakDark }
    : kind === 'archer' ? { body: team.primary, trim: team.light, arm: A.leather }
    : { body: team.primary, trim: team.light, arm: A.steel };
}
function drawFoot(c, kind, view, pose, t, team) {
  const walk = pose === 'walk', strike = pose === 'strike', s = Math.sin(t);
  const bob = walk ? -Math.abs(Math.cos(t)) * 1.6 : pose === 'idle' ? Math.sin(t) * .6 : 0;
  const hipY = -15 + bob, shY = -34 + bob, headY = -44 + bob, col = torsoColors(kind, team);
  ell(c, 0, 0, kind === 'spearman' ? 12 : 11, 3.6, A.shadow);
  if (view === 'side') {
    const step = walk ? s * 5 : strike ? 3 : 0, lift = walk ? Math.max(0, Math.cos(t)) * 2.2 : 0, lift2 = walk ? Math.max(0, -Math.cos(t)) * 2.2 : 0;
    // far leg, far arm (shield / bow arm), then body, head, near leg, near arm (weapon arm)
    limb(c, -1, hipY, -step, -lift2 - 1.5, A.leatherDark, 4.4); ell(c, -step + 1.5, -lift2 - 1, 3.4, 1.8, A.boot, A.ink, 1);
    if (kind === 'scout') poly(c, [-3, shY - 1, 4, shY - 1, 2, hipY + 2, -12 - (walk ? Math.abs(s) * 3 : 0), hipY + 4], A.cloakDark, A.ink, 1);
    if (kind === 'archer') quiver(c, -5, shY + 9, -.35);
    const farHand = { x: 7 + (strike && kind === 'archer' ? 6 : 0), y: shY + 10 - (walk ? s * 2 : 0) };
    limb(c, 1, shY + 2, farHand.x, farHand.y, col.arm, 3.6);
    if (kind === 'infantry') roundShield(c, 9, shY + 11, 8.5, team, false);
    if (kind === 'spearman') kiteShield(c, 9, shY + 11, .95, team, false, .55);
    if (kind === 'archer') bow(c, farHand.x + 1, farHand.y - 2, 30, 1, strike ? 11 : 0);
    rr(c, -6, shY, 12, hipY - shY + 3, 4, col.body, A.ink, 1.2);
    rr(c, -6, hipY - 3.5, 12, 3.2, 1, A.leatherDark); rr(c, 1.5, hipY - 3.5, 3, 3.2, .6, A.gold);
    if (kind !== 'scout') seg(c, 4, shY + 3, 4, hipY - 4, col.trim, 1.6);
    head(c, kind, 'side', 1, headY, team);
    limb(c, 1, hipY, step, -lift - 1.5, A.leather, 4.6); ell(c, step + 1.5, -lift - 1, 3.6, 1.9, A.boot, A.ink, 1);
    // near arm with the weapon
    if (kind === 'spearman') {
      const hand = strike ? { x: 8, y: shY + 7 } : { x: 3 - (walk ? s * 2 : 0), y: shY + 9 };
      if (strike) spear(c, -16, shY + 9, 30, shY + 5); else spear(c, hand.x - 5, -4, hand.x + 9, shY - 36);
      limb(c, -1, shY + 3, hand.x, hand.y, col.arm, 3.8); ell(c, hand.x, hand.y, 2.2, 2.2, A.skin, A.ink, .9);
    } else if (kind === 'archer') {
      const hand = strike ? { x: -2, y: shY + 7 } : { x: -2 + (walk ? s * 3 : 0), y: shY + 13 };
      limb(c, -1, shY + 3, hand.x, hand.y, col.arm, 3.6); ell(c, hand.x, hand.y, 2.1, 2.1, A.skin, A.ink, .9);
      if (strike) { seg(c, hand.x, hand.y, hand.x + 22, hand.y, A.wood, 1.4); poly(c, [hand.x + 22, hand.y - 1.8, hand.x + 26, hand.y, hand.x + 22, hand.y + 1.8], A.steelLight); }
    } else {
      const raised = strike, hand = raised ? { x: 9, y: shY + 2 } : { x: 2 - (walk ? s * 3 : 0), y: shY + 13 };
      limb(c, -1, shY + 3, hand.x, hand.y, col.arm, 3.8);
      if (kind === 'infantry') raised ? sword(c, hand.x, hand.y, hand.x + 18, hand.y - 6) : sword(c, hand.x, hand.y, hand.x + 10, hand.y + 9);
      else raised ? sword(c, hand.x, hand.y, hand.x + 10, hand.y - 2) : sword(c, hand.x, hand.y, hand.x + 6, hand.y + 5);
      ell(c, hand.x, hand.y, 2.2, 2.2, A.skin, A.ink, .9);
    }
    return;
  }
  // Front ('down') and back ('up'): left/right in screen space; from the back the hands swap sides.
  const back = view === 'up', weaponX = back ? 1 : -1, liftL = walk ? Math.max(0, s) * 2.6 : 0, liftR = walk ? Math.max(0, -s) * 2.6 : 0, armSwing = walk ? s * 2.2 : 0;
  if (kind === 'scout') poly(c, [-9, shY - 1, 9, shY - 1, 13 + (walk ? Math.abs(s) : 0), hipY + 6, -13 - (walk ? Math.abs(s) : 0), hipY + 6], back ? A.cloak : A.cloakDark, A.ink, 1.1);
  limb(c, -4, hipY, -4.5, -liftL - 1.6, A.leather, 4.8); limb(c, 4, hipY, 4.5, -liftR - 1.6, A.leather, 4.8);
  ell(c, -4.6, -liftL - 1, 3, 2.1, A.boot, A.ink, 1); ell(c, 4.6, -liftR - 1, 3, 2.1, A.boot, A.ink, 1);
  // Gear that sits behind the body: from the front, the quiver; from the back, nothing (it is drawn over the body).
  rr(c, -9.5, shY, 19, hipY - shY + 3, 5, col.body, A.ink, 1.2);
  if (kind !== 'scout') rr(c, -2.4, shY + 1, 4.8, hipY - shY - 1, 1.5, col.trim);
  rr(c, -9.5, hipY - 3.5, 19, 3.4, 1, A.leatherDark); if (!back) rr(c, -1.8, hipY - 3.6, 3.6, 3.6, .6, A.gold);
  if (back && kind === 'archer') quiver(c, 3.5, shY + 11, .3);
  if (back && (kind === 'infantry' || kind === 'spearman')) poly(c, [-8, shY + 1, 8, shY + 1, 9, hipY + 1, -9, hipY + 1], team.dark, A.ink, 1); // short cape
  // Arms: weapon hand on weaponX side, off hand (shield / bow) opposite.
  const wHand = strike ? { x: weaponX * 13, y: shY - 4 } : { x: weaponX * 12, y: shY + 15 - armSwing };
  const oHand = { x: -weaponX * 12, y: shY + 13 + armSwing };
  limb(c, -weaponX * 8, shY + 3, oHand.x, oHand.y, col.arm, 3.8);
  if (kind === 'archer' && !back) {
    bow(c, oHand.x + weaponX * 1, oHand.y - 4, 32, -weaponX, strike ? 9 : 0);
  }
  head(c, kind, view, 0, headY, team);
  // Off-hand gear in front of the body.
  if (kind === 'infantry') roundShield(c, oHand.x, oHand.y - 2, 8.5, team, back);
  if (kind === 'spearman') kiteShield(c, oHand.x, oHand.y - 3, .95, team, back);
  if (kind === 'archer' && back) bow(c, oHand.x - weaponX * 1, oHand.y - 4, 32, -weaponX, strike ? 9 : 0);
  // Weapon arm.
  if (kind === 'spearman') {
    if (strike) spear(c, wHand.x * .6, shY + 14, wHand.x * .2, -2 - 4); else spear(c, wHand.x, -3, wHand.x, shY - 40);
  }
  limb(c, weaponX * 8, shY + 3, wHand.x, wHand.y, col.arm, 3.8);
  if (kind === 'infantry') strike ? sword(c, wHand.x, wHand.y, wHand.x + weaponX * 4, wHand.y - 19) : sword(c, wHand.x, wHand.y, wHand.x + weaponX * 3, wHand.y + 13);
  if (kind === 'scout') strike ? sword(c, wHand.x, wHand.y, wHand.x + weaponX * 2, wHand.y - 10) : sword(c, wHand.x, wHand.y, wHand.x + weaponX * 2, wHand.y + 7);
  if (kind === 'archer' && strike && !back) { seg(c, wHand.x, wHand.y + 10, oHand.x, oHand.y - 4, A.wood, 1.3); }
  ell(c, wHand.x, wHand.y, 2.2, 2.2, A.skin, A.ink, .9); ell(c, oHand.x, oHand.y, 2.2, 2.2, A.skin, A.ink, .9);
  if (kind === 'scout' && !back) rr(c, -6, shY - 1.5, 12, 3.4, 1.4, team.primary, A.ink, .8); // scarf in the side's colour
}

// ---- cavalry ----
function horseLegs(c, pts, t, walk) {
  // pts: [hipX, hipY, phase] per leg; galloping legs reach forward/back, idle legs stand.
  for (const [hx, hy, ph, far] of pts) {
    const a = walk ? Math.sin(t + ph) : 0, fx = hx + a * 6, lift = walk ? Math.max(0, Math.cos(t + ph)) * 3 : 0, kneeX = hx + a * 3, kneeY = hy + (0 - hy) * .5 - lift;
    const color = far ? A.horseDark : A.horse;
    limb(c, hx, hy, kneeX, kneeY, color, 4.6); limb(c, kneeX, kneeY, fx, -lift - 1.5, color, 3.6);
    ell(c, fx + .8, -lift - 1, 2.6, 1.6, A.hoof, A.ink, .8);
  }
}
function caparison(c, x, y, w, h, team) {
  rr(c, x, y, w, h, 4, team.primary, A.ink, 1.2); seg(c, x + 2, y + h - 1.5, x + w - 2, y + h - 1.5, A.gold, 1.6);
}
function rider(c, view, pose, t, team, bob) {
  const strike = pose === 'strike', shY = -64 + bob, hipY = -50 + bob;
  if (view === 'side') {
    kiteShield(c, 9, shY + 12, .8, team, false, .55);
    rr(c, -6, shY, 12, hipY - shY + 2, 4, team.primary, A.ink, 1.2); seg(c, 4, shY + 3, 4, hipY - 3, team.light, 1.6);
    limb(c, 0, hipY, 5, hipY + 12, A.leather, 4.4); ell(c, 6.5, hipY + 13, 3.4, 1.8, A.boot, A.ink, 1);
    head(c, 'spearman', 'side', 1, shY - 9, team);
    if (strike) spear(c, -14, shY + 9, 52, shY + 6); else spear(c, -4, hipY + 6, 20, shY - 38);
    const hand = strike ? { x: 6, y: shY + 8 } : { x: 3, y: shY + 10 };
    limb(c, -1, shY + 3, hand.x, hand.y, A.steel, 3.8); ell(c, hand.x, hand.y, 2.2, 2.2, A.skin, A.ink, .9);
    return;
  }
  const back = view === 'up', wx = back ? 1 : -1;
  limb(c, -6, hipY, -9, hipY + 11, A.leather, 4.4); limb(c, 6, hipY, 9, hipY + 11, A.leather, 4.4);
  rr(c, -9, shY, 18, hipY - shY + 2, 5, team.primary, A.ink, 1.2); if (!back) rr(c, -2.2, shY + 1, 4.4, hipY - shY - 1, 1.4, team.light);
  if (back) poly(c, [-8, shY + 1, 8, shY + 1, 9, hipY + 2, -9, hipY + 2], team.dark, A.ink, 1);
  head(c, 'spearman', view, 0, shY - 9, team);
  kiteShield(c, -wx * 12, shY + 11, .8, team, back);
  const hand = { x: wx * 12, y: shY + 12 };
  if (strike) spear(c, wx * 8, shY + 4, wx * 2, -6); else spear(c, hand.x, -18, hand.x, shY - 40);
  limb(c, wx * 8, shY + 3, hand.x, hand.y, A.steel, 3.8); ell(c, hand.x, hand.y, 2.2, 2.2, A.skin, A.ink, .9);
}
function drawCavalry(c, view, pose, t, team) {
  const walk = pose === 'walk', bob = walk ? -Math.abs(Math.sin(t)) * 2 : pose === 'idle' ? Math.sin(t) * .5 : 0;
  ell(c, 0, 0, view === 'side' ? 32 : 18, 4.5, A.shadow);
  if (view === 'side') {
    horseLegs(c, [[-18, -24 + bob, Math.PI, 1], [16, -24 + bob, 0, 1]], t, walk);
    // tail, body, neck and head (facing right)
    c.beginPath(); c.moveTo(-26, -34 + bob); c.quadraticCurveTo(-40, -30 + bob - (walk ? Math.sin(t) * 3 : 0), -36, -14 + bob); c.lineTo(-32, -16 + bob); c.quadraticCurveTo(-34, -28 + bob, -25, -30 + bob); c.closePath(); c.fillStyle = A.mane; c.fill(); c.strokeStyle = A.ink; c.lineWidth = 1; c.stroke();
    ell(c, -1, -32 + bob, 28, 12, A.horse, A.ink, 1.3);
    poly(c, [16, -38 + bob, 25, -55 + bob, 33, -54 + bob, 26, -32 + bob], A.horse, A.ink, 1.2);
    ell(c, 34, -53 + bob, 9, 5, A.horse, A.ink, 1.2, .55); ell(c, 40, -49 + bob, 3.6, 3, A.horseDark);
    poly(c, [27, -59 + bob, 29, -65 + bob, 31, -58 + bob], A.horse, A.ink, 1); ell(c, 33, -55 + bob, .9, 1, A.ink);
    c.beginPath(); c.moveTo(25, -58 + bob); c.quadraticCurveTo(17, -52 + bob, 15, -40 + bob); c.lineTo(19, -40 + bob); c.quadraticCurveTo(21, -50 + bob, 27, -55 + bob); c.closePath(); c.fillStyle = A.mane; c.fill();
    caparison(c, -24, -40 + bob, 42, 15, team);
    rr(c, -7, -45 + bob, 14, 6, 2, A.leatherDark, A.ink, 1);
    horseLegs(c, [[-14, -24 + bob, 0, 0], [20, -24 + bob, Math.PI, 0]], t, walk);
    rider(c, 'side', pose, t, team, bob);
    return;
  }
  if (view === 'down') {
    horseLegs(c, [[-9, -26 + bob, Math.PI, 1], [9, -26 + bob, 0, 1]], t, walk);
    ell(c, 0, -34 + bob, 15, 13, A.horse, A.ink, 1.3); // chest
    caparison(c, -17, -42 + bob, 8, 18, team); caparison(c, 9, -42 + bob, 8, 18, team);
    horseLegs(c, [[-6, -24 + bob, 0, 0], [6, -24 + bob, Math.PI, 0]], t, walk);
    rider(c, 'down', pose, t, team, bob - 4);
    // head and neck come towards the viewer, in front of the rider's legs
    ell(c, 0, -40 + bob, 7, 9, A.horse, A.ink, 1.2); ell(c, 0, -26 + bob, 7, 11, A.horse, A.ink, 1.2); ell(c, 0, -17.5 + bob, 5.6, 4.2, A.horseDark, A.ink, .9);
    poly(c, [-5, -36 + bob, -6.5, -43 + bob, -2.5, -38 + bob], A.horse, A.ink, 1); poly(c, [5, -36 + bob, 6.5, -43 + bob, 2.5, -38 + bob], A.horse, A.ink, 1);
    ell(c, -3.4, -30 + bob, .9, 1.1, A.ink); ell(c, 3.4, -30 + bob, .9, 1.1, A.ink); rr(c, -1.6, -41 + bob, 3.2, 9, 1.4, A.mane);
    return;
  }
  // up: rump and tail towards the viewer, rider's back above
  horseLegs(c, [[-7, -24 + bob, 0, 1], [7, -24 + bob, Math.PI, 1]], t, walk);
  ell(c, 0, -46 + bob, 6, 8, A.horse, A.ink, 1.1); poly(c, [-4, -52 + bob, -5, -58 + bob, -1, -53 + bob], A.horse, A.ink, 1); poly(c, [4, -52 + bob, 5, -58 + bob, 1, -53 + bob], A.horse, A.ink, 1);
  ell(c, 0, -32 + bob, 15, 13, A.horse, A.ink, 1.3);
  caparison(c, -17, -42 + bob, 8, 18, team); caparison(c, 9, -42 + bob, 8, 18, team);
  horseLegs(c, [[-8, -22 + bob, Math.PI, 0], [8, -22 + bob, 0, 0]], t, walk);
  c.beginPath(); c.moveTo(-2.5, -36 + bob); c.quadraticCurveTo(-3 + (walk ? Math.sin(t) * 3 : 0), -22 + bob, 0, -12 + bob); c.quadraticCurveTo(3, -22 + bob, 2.5, -36 + bob); c.closePath(); c.fillStyle = A.mane; c.fill(); c.strokeStyle = A.ink; c.lineWidth = 1; c.stroke();
  rider(c, 'up', pose, t, team, bob - 4);
}

// ---- frame cache ----
const cache = new Map();
// Frame canvas for (type, team, view, pose, frame); w/h/ax/ay are in design units, the canvas holds them × SS.
export function unitArtFrame(type, team, view, pose, frame) {
  const key = `${type}|${team}|${view}|${pose}|${frame}`;
  let f = cache.get(key); if (f) return f;
  const box = type === 'cavalry' ? BOX.cavalry : BOX.foot, canvas = document.createElement('canvas');
  canvas.width = Math.round(box.w * SS); canvas.height = Math.round(box.h * SS);
  const c = canvas.getContext('2d'), colors = TEAM_COLORS[team] || TEAM_COLORS[0], t = frame / 4 * TAU;
  c.scale(SS, SS); c.translate(box.ax, box.ay); c.lineJoin = 'round';
  if (type === 'cavalry') drawCavalry(c, view, pose, t, colors); else drawFoot(c, type, view, pose, t, colors);
  f = { canvas, w: box.w, h: box.h, ax: box.ax, ay: box.ay, figureH: FIGURE_H[type] || 54 };
  cache.set(key, f); return f;
}
