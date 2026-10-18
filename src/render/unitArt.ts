// @ts-nocheck
// Code-drawn soldiers in eight directions with walk, attack and hit poses (docs/features/rendering.md).
// Each soldier is a small 3-D puppet: joints and gear are placed in unit space — R to the unit's right, F forward, H up
// (feet at 0) — and projected for a yaw θ (0 = facing the viewer, 90 = facing right, 180 = back turned):
//   screen x = −R·cosθ + F·sinθ,  depth (towards the viewer) = R·sinθ + F·cosθ,  screen y = −H + depth·K
// Parts are painted far to near. Five yaws are baked (down, down-right, right, up-right, up); the three left-facing
// directions are those frames mirrored at draw time. Every frame is painted once into a cached canvas.
import { TEAM_COLORS } from '../config/theme';
import { UNIT_ART as A } from '../config/visuals';

const TAU = Math.PI * 2, SS = 1, K = .3; // SS: canvas pixels per design unit (1:1 matches the largest on-screen size at max zoom); K: ground tilt of the view
export const DIRECTIONS = ['down', 'down-right', 'right', 'up-right', 'up', 'up-left', 'left', 'down-left'];
// Direction → [baked yaw in degrees, mirrored].
export const DIR_VIEW = { down: [0, false], 'down-right': [45, false], right: [90, false], 'up-right': [135, false], up: [180, false], 'up-left': [135, true], left: [90, true], 'down-left': [45, true] };
export const POSE_FRAMES = { idle: 4, walk: 6, attack: 4, hurt: 1 };
// Feet-to-helmet height in design units (drawUnit scales it to unitTargetHeight) and the canvas box with the feet anchor.
export const FIGURE_H = { infantry: 54, spearman: 56, archer: 53, scout: 52, cavalry: 84 };
const BOX = { foot: { w: 88, h: 102, ax: 44, ay: 90 }, cavalry: { w: 150, h: 132, ax: 75, ay: 116 } };

// ---- drawing helpers ----
function ell(c, x, y, rx, ry, fill, stroke, lw = 1.1) { c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } }
function poly(c, pts, fill, stroke, lw = 1.1) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } }
function seg(c, a, b, color, lw) { c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.stroke(); }
function limb(c, a, b, color, w) { seg(c, a, b, A.ink, w + 2); seg(c, a, b, color, w); }
function limb3(c, a, m, b, color, w) { // two-segment limb through a joint
  for (const [col, lw] of [[A.ink, w + 2], [color, w]]) { c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(m.x, m.y); c.lineTo(b.x, b.y); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
}
const add3 = (p, d) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];

// ---- poses ----
// Hand positions and weapon placement in unit space for one frame. kind: infantry | spearman | archer | scout | cavalry.
function poseOf(kind, pose, frame) {
  const n = POSE_FRAMES[pose] || 1, t = frame / n * TAU, sn = Math.sin(t), cs = Math.cos(t);
  const mounted = kind === 'cavalry', hip = mounted ? 46 : 15;
  const st = { hip, lean: 0, bob: 0, strideL: 0, strideR: 0, liftL: 0, liftR: 0, bowDraw: false, arrow: false };
  if (pose === 'walk') {
    st.bob = mounted ? -Math.abs(sn) * 2 : -(1 - Math.abs(sn)) * 1.4;
    st.strideL = sn * 6; st.strideR = -sn * 6; st.liftL = Math.max(0, cs) * 2.4; st.liftR = Math.max(0, -cs) * 2.4;
  } else if (pose === 'idle') st.bob = Math.sin(t) * .55;
  const sh = hip + 18, swing = pose === 'walk' && !mounted ? sn * 4 : 0;
  // Idle / walk hands; the right hand holds the weapon, the left the shield or bow.
  st.rHand = [8.5, 3 + swing, sh - 13]; st.lHand = [-8.5, 4 - swing * .4, sh - 9];
  if (kind === 'spearman') { st.rHand = [8.5, 3 + swing * .5, sh - 7]; st.weapon = { butt: [0, 1, -sh + 4 + 7], tip: [0, 4, 46] }; }
  else if (kind === 'cavalry') { st.rHand = [8.5, 3, sh - 6]; st.lHand = [-8.5, 5, sh - 7]; st.weapon = { butt: [0, -6, -10], tip: [0, 12, 42] }; }
  else if (kind === 'archer') { st.lHand = [-8.5, 4 - swing * .4, sh - 11]; }
  else st.weapon = { tip: kind === 'scout' ? [0, 4, -6] : [0, 6, -11] };
  if (pose === 'attack') {
    // frames: windup → strike → follow-through → recover
    const f = frame;
    if (kind === 'infantry' || kind === 'scout') {
      const dagger = kind === 'scout';
      st.lean = [-1.5, 2.5, 2, .5][f];
      st.rHand = dagger ? [[8, -1, 32], [4, 13, 29], [4, 10, 27], [8, 4, 22]][f] : [[8, -2, 42], [5, 11, 32], [-3, 8, 22], [7, 5, 24]][f];
      st.weapon = { tip: dagger ? [[0, 2, 7], [0, 8, 0], [0, 7, -2], [0, 4, -6]][f] : [[0, -5, 12], [-3, 11, -4], [-9, 4, -6], [0, 7, -9]][f] };
      st.lHand = [-8.5, 7, 25];
    } else if (kind === 'spearman' || kind === 'cavalry') {
      const H = kind === 'cavalry' ? sh - 4 : 30, reach = kind === 'cavalry' ? 38 : 26;
      st.lean = [-1, 2.5, 2, .5][f];
      st.rHand = [[7.5, -4, H], [7.5, 9, H], [7.5, 6, H - 1], [8, 2, H - 2]][f];
      // The thrust angles slightly up and across the body so it still reads when aimed straight at or away from the viewer.
      st.weapon = f === 3 ? { butt: [0, -9, -11], tip: [0, 14, 26] } : { butt: [2, -14, -3], tip: [-5, reach + (f === 1 ? 4 : 0), 7] };
      st.lHand = kind === 'cavalry' ? [-8.5, 6, sh - 6] : [-8, 7, 26];
    } else if (kind === 'archer') {
      st.lean = [0, .5, .5, 0][f];
      st.lHand = [[-3, 13, 37], [-3, 13, 37], [-3, 12, 36], [-6, 8, 30]][f];
      st.rHand = [[2, 1, 37], [4, -2, 39], [4, -1, 38], [6, 3, 26]][f];
      st.bowDraw = f === 0; st.arrow = f === 0;
    }
  } else if (pose === 'hurt') {
    st.lean = -3; st.rHand = [10.5, -1, hip + 11]; st.lHand = [-10.5, 0, hip + 12];
  }
  return st;
}

// ---- soldier (foot or mounted rider) ----
function soldier(parts, P, view, kind, st, team) {
  const { s, c } = view, mounted = kind === 'cavalry', hip = st.hip + st.bob, sh = hip + 18, head = hip + 29, L = st.lean;
  const gear = mounted ? 'spearman' : kind; // riders wear the great helm and carry a kite shield
  const body = kind === 'scout' ? A.cloak : team.primary, arm = kind === 'scout' ? A.cloakDark : kind === 'archer' ? A.leather : A.steel;
  // Legs (standing: stride and lift; mounted: hanging down the horse's flanks).
  for (const side of [-1, 1]) {
    const hipP = P(side * 4.2, 0, hip);
    if (mounted) {
      const knee = P(side * 9.5, 5, hip - 6), foot = P(side * 9.5, 3, hip - 14);
      parts.push([foot.d, 1, ctx => { limb3(ctx, hipP, knee, foot, A.leather, 4.4); ell(ctx, foot.x, foot.y, 2.6, 2, A.boot, A.ink, 1); }]);
    } else {
      const stride = side < 0 ? st.strideL : st.strideR, lift = side < 0 ? st.liftL : st.liftR;
      const foot = P(side * 4.6, stride, lift), knee = P(side * 4.5, stride * .5 + 1.5, (hip + lift) * .5 + 1), toe = P(side * 4.6, stride + 3.2, lift);
      parts.push([(hipP.d + foot.d) / 2 - .01, 1, ctx => { limb3(ctx, hipP, knee, foot, side < 0 ? A.leather : A.leatherDark, 4.6); ell(ctx, (foot.x + toe.x) / 2, (foot.y + toe.y) / 2 + .6, 2.4 + 1.4 * Math.abs(s), 1.9, A.boot, A.ink, 1); }]);
    }
  }
  // Scout's cloak hangs behind the shoulders.
  if (kind === 'scout') {
    const flare = Math.abs(st.strideL) * .4;
    const pts = [P(-8, L - 3, sh), P(8, L - 3, sh), P(11 + flare, -6, hip - 7), P(-11 - flare, -6, hip - 7)];
    parts.push([P(0, -4, sh).d - 1, 0, ctx => poly(ctx, pts.flatMap(p => [p.x, p.y]), c < 0 ? A.cloak : A.cloakDark, A.ink, 1.1)]);
  }
  // Quiver on the back.
  if (kind === 'archer') {
    // Depth from the back plane only: behind the torso except when the unit turns its back.
    const a = P(2, L - 5, sh - 15), b = P(4.5, L - 5.5, sh + 6), back = P(0, L - 5, sh).d;
    parts.push([back - .5, 0, ctx => { limb(ctx, a, b, A.leather, 4.4); for (const dx of [-1.6, 0, 1.6]) ell(ctx, b.x + dx, b.y - 1.5, 1.2, 2, A.string, A.ink, .6); }]);
  }
  // Torso: width shrinks from front to profile; tabard stripe and belt buckle on the front, cape on the back.
  const top = P(0, L, sh), bottom = P(0, 0, hip - 2), w = 13 * Math.abs(c) + 9 * Math.abs(s);
  parts.push([0, 1.5, ctx => {
    ctx.beginPath(); ctx.moveTo(top.x - w / 2, top.y); ctx.lineTo(top.x + w / 2, top.y); ctx.lineTo(bottom.x + w / 2 - .5, bottom.y); ctx.lineTo(bottom.x - w / 2 + .5, bottom.y); ctx.closePath();
    ctx.fillStyle = body; ctx.fill(); ctx.strokeStyle = A.ink; ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.stroke();
    const belt = P(0, L * .2, hip + 2.2);
    ctx.fillStyle = A.leatherDark; ctx.fillRect(belt.x - w / 2 + .6, belt.y - 1.6, w - 1.2, 3.2);
    if (c > .15) {
      if (kind !== 'scout') seg(ctx, P(0, L + 4.5, sh - 2), P(0, 4.5, hip + 4), team.light, 3.2 * c + 1);
      const bk = P(0, 5, hip + 2.2); ctx.fillStyle = A.gold; ctx.fillRect(bk.x - 1.5, bk.y - 1.6, 3, 3.2);
    } else if (c < -.15 && kind !== 'scout' && kind !== 'archer') {
      const a1 = P(-6, L - 4, sh - 1), a2 = P(6, L - 4, sh - 1), b2 = P(7, -4, hip - 1), b1 = P(-7, -4, hip - 1);
      poly(ctx, [a1.x, a1.y, a2.x, a2.y, b2.x, b2.y, b1.x, b1.y], team.dark, A.ink, 1);
    } else if (Math.abs(c) <= .15 && kind !== 'scout') seg(ctx, P(0, L + 4.5, sh - 2), P(0, 4.5, hip + 4), team.light, 1.4);
    if (kind === 'scout' && c > -.2) { const sc = P(0, L + 3, sh); ctx.fillStyle = team.primary; ctx.beginPath(); ctx.roundRect(sc.x - w / 2 + 1, sc.y - 1.5, w - 2, 3.4, 1.4); ctx.fill(); ctx.strokeStyle = A.ink; ctx.lineWidth = .8; ctx.stroke(); }
  }]);
  // Head with helmet / hood, face features on the side facing the viewer, plume in the side's colour.
  const hc = P(0, L * 1.3, head);
  parts.push([.1, 3, ctx => drawHead(ctx, P, view, gear, hc, L * 1.3, head, team)]);
  // Arms, off-hand gear (shield or bow), weapon.
  const shoulder = side => P(side * 7.5, L, sh - 1);
  const elbow = (side, h) => P(side * 9 + (h[0] - side * 9) * .4, (L + h[1]) * .5 - .5, (sh + h[2]) * .5 - 1.5);
  const rH = P(...st.rHand), lH = P(...st.lHand);
  parts.push([(shoulder(-1).d + lH.d) / 2, 2, ctx => { limb3(ctx, shoulder(-1), elbow(-1, st.lHand), lH, arm, 3.7); ell(ctx, lH.x, lH.y, 2.1, 2.1, A.skin, A.ink, .9); }]);
  parts.push([(shoulder(1).d + rH.d) / 2, 2, ctx => { limb3(ctx, shoulder(1), elbow(1, st.rHand), rH, arm, 3.7); ell(ctx, rH.x, rH.y, 2.1, 2.1, A.skin, A.ink, .9); }]);
  if (gear === 'infantry' || gear === 'spearman') {
    // Shield on the left forearm, its face pointing left-forward; nd = how much of the face the viewer sees.
    const cp = P(...add3(st.lHand, [-2.5, 1.5, gear === 'spearman' ? -1 : 0])), nd = -.7 * s + .7 * c;
    parts.push([cp.d + 1.2, 4, ctx => gear === 'infantry' ? roundShield(ctx, cp, 8.5, nd, team) : kiteShield(ctx, cp, mounted ? .82 : .95, nd, team)]);
  }
  if (kind === 'archer') {
    // The bow is canted a little across the body so it never shrinks to a line when seen straight from the front.
    const g = st.lHand, top2 = P(...add3(g, [2, -1, 15])), bot = P(...add3(g, [-2, -1, -15])), belly = P(...add3(g, [-4, 6, 0])), grip = P(...g);
    const pull = st.bowDraw ? rH : null, tipArrow = P(...add3(g, [0, 9, 0]));
    parts.push([grip.d + .6, 4, ctx => {
      ctx.beginPath(); ctx.moveTo(top2.x, top2.y); ctx.quadraticCurveTo(belly.x * 2 - (top2.x + bot.x) / 2, belly.y * 2 - (top2.y + bot.y) / 2, bot.x, bot.y);
      ctx.strokeStyle = A.ink; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = A.wood; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(top2.x, top2.y); if (pull) ctx.lineTo(pull.x, pull.y); ctx.lineTo(bot.x, bot.y); ctx.strokeStyle = A.string; ctx.lineWidth = .8; ctx.stroke();
      if (st.arrow) { seg(ctx, rH, tipArrow, A.wood, 1.3); ell(ctx, tipArrow.x, tipArrow.y, 1.3, 1.3, A.steelLight, A.ink, .5); }
    }]);
  }
  if (st.weapon) {
    if (st.weapon.butt) { // spear / lance with a pennant in the side's colour on the lance
      const tipL = add3(st.rHand, st.weapon.tip), butt = P(...add3(st.rHand, st.weapon.butt)), tip = P(...tipL);
      const dir = [st.weapon.tip[0] - st.weapon.butt[0], st.weapon.tip[1] - st.weapon.butt[1], st.weapon.tip[2] - st.weapon.butt[2]], l = Math.hypot(...dir) || 1;
      const point = P(...add3(tipL, dir.map(v => v / l * 7))), pennant = P(...add3(tipL, dir.map(v => -v / l * 8)));
      parts.push([rH.d + .3, 2.5, ctx => { seg(ctx, butt, tip, A.ink, 3.4); seg(ctx, butt, tip, A.wood, 2); spearHead(ctx, tip, point); if (mounted) seg(ctx, tip, pennant, team.primary, 2.6); }]);
    } else { // sword / dagger
      const tip = P(...add3(st.rHand, st.weapon.tip));
      parts.push([rH.d + .3, 2.5, ctx => sword(ctx, rH, tip)]);
    }
  }
}
function spearHead(c, base, tip) {
  const dx = tip.x - base.x, dy = tip.y - base.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l * 2.4, ny = dx / l * 2.4;
  poly(c, [tip.x, tip.y, base.x + nx, base.y + ny, base.x - nx, base.y - ny], A.steelLight, A.ink, 1);
}
function sword(c, hand, tip) {
  const dx = tip.x - hand.x, dy = tip.y - hand.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l * 2.8, ny = dx / l * 2.8;
  seg(c, hand, tip, A.ink, 4.2); seg(c, hand, tip, A.steelLight, 2.4);
  seg(c, { x: hand.x - nx, y: hand.y - ny }, { x: hand.x + nx, y: hand.y + ny }, A.gold, 2.2);
}
// Shields seen at an angle: nd = how much the face points at the viewer (−1 back … 1 front); the width squashes with |nd|.
function roundShield(c, p, r, nd, team) {
  const rx = r * Math.max(.3, Math.abs(nd));
  if (nd < 0) { ell(c, p.x, p.y, rx, r, A.wood, A.ink, 1.3); seg(c, { x: p.x - rx * .7, y: p.y }, { x: p.x + rx * .7, y: p.y }, A.leatherDark, 2); return; }
  ell(c, p.x, p.y, rx, r, team.primary, A.ink, 1.3); ell(c, p.x, p.y, Math.max(.5, rx - 1.6), r - 1.6, null, A.gold, 1.2);
  ell(c, p.x, p.y, rx * .45, r * .45, team.light); ell(c, p.x, p.y, rx * .22, r * .22, A.steel, A.ink, .8);
}
function kiteShield(c, p, sc, nd, team) {
  const k = Math.max(.3, Math.abs(nd)), w = 9 * sc * k, x = p.x, y = p.y, pts = [x - w, y - 11 * sc, x + w, y - 11 * sc, x + w * .95, y + 2 * sc, x, y + 13 * sc, x - w * .95, y + 2 * sc];
  if (nd < 0) { poly(c, pts, A.wood, A.ink, 1.3); seg(c, { x, y: y - 9 * sc }, { x, y: y + 9 * sc }, A.leatherDark, 1.6); return; }
  poly(c, pts, team.primary, A.ink, 1.3);
  const e = 3.4 * sc * k; // emblem: a chevron in the side's light colour
  poly(c, [x - e, y - 6 * sc, x, y - 1.5 * sc, x + e, y - 6 * sc, x + e, y - 3 * sc, x, y + 2 * sc, x - e, y - 3 * sc], team.light);
  c.beginPath(); c.moveTo(pts[0], pts[1]); c.lineTo(pts[2], pts[3]); c.strokeStyle = A.gold; c.lineWidth = 1.4; c.stroke();
}
function drawHead(c, P, view, gear, hc, F0, H, team) {
  const { s, c: cs } = view, r = 7.4, front = cs > -.35;
  const facePt = (R, F, h) => P(R, F0 + F, H + h), faceVisible = (R, F) => R * s + F * cs > .8;
  const hood = gear === 'archer' || gear === 'scout', hoodCol = gear === 'scout' ? A.cloak : team.dark;
  if (hood) { // hood around the face; the pointed tip of the scout's hood trails behind
    if (gear === 'scout') { const tip = facePt(0, -7, 8); poly(c, [hc.x - 5, hc.y - 3, hc.x + 5, hc.y - 3, tip.x, tip.y], hoodCol, A.ink, 1); }
    ell(c, hc.x, hc.y, r + 1.6, r + 1.4, hoodCol, A.ink, 1.2);
    if (front) { const fp = facePt(0, 3.5, -.6); ell(c, fp.x, fp.y, 5.2 * (.35 + .65 * Math.max(0, cs)) + 1.4 * Math.abs(s), 5.6, A.skin, A.ink, .9); }
  } else ell(c, hc.x, hc.y, r, r, front ? A.skin : A.steel, A.ink, 1.2);
  if (front) {
    for (const side of [-1, 1]) if (faceVisible(side * 2.6, 6.3)) { const e = facePt(side * 2.6, 6.3, .5); ell(c, e.x, e.y, .9, 1.1, A.ink); }
    if (Math.abs(s) > .3 && cs > -.5 && !hood && gear !== 'spearman') { const b = facePt(0, 7, .2), t = facePt(0, 9.6, -.6); poly(c, [b.x, b.y - 1.6, t.x, t.y, b.x, b.y + 1.8], A.skin, A.ink, .9); }
  }
  if (gear === 'infantry') {
    if (front) { c.beginPath(); c.arc(hc.x, hc.y, r + .5, Math.PI, TAU); c.closePath(); c.fillStyle = A.steel; c.fill(); c.strokeStyle = A.ink; c.lineWidth = 1.2; c.stroke(); if (faceVisible(0, 7)) { const n = facePt(0, 7.2, -1); c.fillStyle = A.steelDark; c.fillRect(n.x - .8, n.y - 2.5, 1.6, 5); } }
    else ell(c, hc.x, hc.y, r + .5, r + .5, A.steel, A.ink, 1.2);
  }
  if (gear === 'spearman') { // great helm hides the face; a visor slit on the front half
    ell(c, hc.x, hc.y, r + .6, r + .8, A.steel, A.ink, 1.2);
    const da = -3.6 * s + 6.8 * cs, db = 3.6 * s + 6.8 * cs;
    if (da > 0 || db > 0) seg(c, da > 0 ? facePt(-3.6, 6.8, .6) : facePt(0, 7.4, .6), db > 0 ? facePt(3.6, 6.8, .6) : facePt(0, 7.4, .6), A.ink, 1.8);
  }
  if (gear === 'infantry' || gear === 'spearman') { // plume: a thick stroke along a curve over the crown, trailing back
    const big = gear === 'spearman', p0 = facePt(0, 1, r + .2), p1 = facePt(0, -3, r + 5 + (big ? 3 : 0)), p2 = facePt(0, -11 - (big ? 3 : 0), r - 1);
    for (const [col, lw] of [[A.ink, (big ? 4.6 : 2.8) + 2], [team.primary, big ? 4.6 : 2.8]]) { c.beginPath(); c.moveTo(p0.x, p0.y); c.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.stroke(); }
  }
}

// ---- horse ----
function horse(parts, P, view, pose, frame, team, bob) {
  const { s, c } = view, n = POSE_FRAMES[pose] || 1, t = frame / n * TAU, moving = pose === 'walk', H0 = 31 + bob;
  for (const [side, fwd, ph] of [[-1, 16, 0], [1, 16, Math.PI], [-1, -16, Math.PI / 2], [1, -16, Math.PI * 1.5]]) {
    const R = side * 8;
    const a = moving ? Math.sin(t + ph) : 0, lift = moving ? Math.max(0, Math.cos(t + ph)) * 3.5 : 0, near = side * s > 0 || (Math.abs(s) < .2 && fwd * c > 0);
    const hipP = P(R, fwd, H0 - 6), knee = P(R * 1.05, fwd + a * 4, (H0 - 6) * .45 + lift), hoof = P(R * 1.08, fwd + a * 8, lift);
    parts.push([(hipP.d + hoof.d) / 2, near ? 6 : -6, ctx => { limb3(ctx, hipP, knee, hoof, near ? A.horse : A.horseDark, 4.4); ell(ctx, hoof.x, hoof.y, 2.6, 1.6, A.hoof, A.ink, .8); }]);
  }
  // tail
  const t0 = P(0, -28, H0 + 2), t1 = P(moving ? Math.sin(t) * 3 : 0, -35, H0 - 12);
  parts.push([t0.d - .5, -5, ctx => { for (const [col, lw] of [[A.ink, 6.5], [A.mane, 4.5]]) { ctx.beginPath(); ctx.moveTo(t0.x, t0.y); ctx.quadraticCurveTo((t0.x + t1.x) / 2 - 3 * s, t0.y + 1, t1.x, t1.y); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke(); } }]);
  // body with the caparison in the side's colour, and the saddle
  const bc = P(0, 0, H0), rx = 27 * Math.abs(s) + 15 * Math.abs(c), ry = 12 + 2 * Math.abs(c);
  parts.push([0, 0, ctx => {
    ell(ctx, bc.x, bc.y, rx, ry, A.horse, A.ink, 1.3);
    ctx.save(); ctx.beginPath(); ctx.ellipse(bc.x, bc.y, rx, ry, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = team.primary; ctx.fillRect(bc.x - rx - 1, bc.y - 3, rx * 2 + 2, 16);
    ctx.strokeStyle = A.gold; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(bc.x - rx, bc.y + 7); ctx.lineTo(bc.x + rx, bc.y + 7); ctx.stroke(); ctx.restore();
    ell(ctx, bc.x, bc.y, rx, ry, null, A.ink, 1.3);
    const sd = P(0, 0, H0 + 11); ctx.fillStyle = A.leatherDark; ctx.beginPath(); ctx.roundRect(sd.x - 5 - 2 * Math.abs(s), sd.y - 2.5, 10 + 4 * Math.abs(s), 5, 2); ctx.fill(); ctx.strokeStyle = A.ink; ctx.lineWidth = 1; ctx.stroke();
  }]);
  // neck, mane, head (ears, muzzle, eyes)
  const n0 = P(0, 16, H0 + 4), n1 = P(0, 27, H0 + 19), hd = P(0, 31, H0 + 19), mz = P(0, 36.5, H0 + 15.5);
  parts.push([hd.d, .5, ctx => {
    for (const [col, lw] of [[A.ink, 11], [A.horse, 9]]) seg(ctx, n0, n1, col, lw);
    seg(ctx, P(0, 13, H0 + 9), P(0, 26, H0 + 24), A.mane, 3);
    for (const side of [-1, 1]) { const e = P(side * 2.4, 29, H0 + 26), b = P(side * 2.2, 30, H0 + 22); poly(ctx, [b.x - 1.6, b.y, e.x, e.y, b.x + 1.6, b.y], A.horse, A.ink, .9); }
    ell(ctx, hd.x, hd.y, 4.5 + 5 * Math.abs(s) + 1.5 * Math.abs(c), 4.6 + 4.6 * Math.abs(c), A.horse, A.ink, 1.2);
    ell(ctx, mz.x, mz.y, 3 + 2.4 * Math.abs(s), 3 + 1.4 * Math.abs(c), A.horseDark, A.ink, .9);
    for (const side of [-1, 1]) if (side * 3.6 * s + 32 * c > -2 && (Math.abs(s) > .3 || c > 0)) { const e = P(side * 3.6, 32, H0 + 21); ell(ctx, e.x, e.y, .9, 1, A.ink); }
  }]);
}

// ---- frame cache ----
const cache = new Map();
// Frame canvas for (type, team, yaw, pose, frame, tint); w/h/ax/ay are design units, the canvas holds them × SS.
// tint 'hit' adds a red flash on top (hurt pose).
export function unitArtFrame(type, team, yaw, pose, frame, tint = '') {
  const key = `${type}|${team}|${yaw}|${pose}|${frame}|${tint}`;
  let f = cache.get(key); if (f) return f;
  const box = type === 'cavalry' ? BOX.cavalry : BOX.foot, canvas = document.createElement('canvas');
  canvas.width = Math.round(box.w * SS); canvas.height = Math.round(box.h * SS);
  const c = canvas.getContext('2d'), colors = TEAM_COLORS[team] || TEAM_COLORS[0], th = yaw * Math.PI / 180;
  const view = { s: Math.sin(th), c: Math.cos(th) }, P = (R, F, H) => { const d = R * view.s + F * view.c; return { x: -R * view.c + F * view.s, y: -H + d * K, d }; };
  c.scale(SS, SS); c.translate(box.ax, box.ay); c.lineJoin = 'round';
  const st = poseOf(type, pose, frame), parts = [];
  ell(c, 0, 0, type === 'cavalry' ? 30 * Math.abs(view.s) + 14 * Math.abs(view.c) : 11, type === 'cavalry' ? 6 : 3.6, A.shadow); // ground shadow
  if (type === 'cavalry') horse(parts, P, view, pose === 'walk' ? 'walk' : 'idle', frame, colors, st.bob);
  soldier(parts, P, view, type, st, colors);
  parts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); // far to near, ties by part order
  for (const [, , fn] of parts) fn(c);
  if (tint === 'hit') { c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(255,60,40,.45)'; c.fillRect(-box.ax, -box.ay, box.w, box.h); c.globalCompositeOperation = 'source-over'; }
  f = { canvas, w: box.w, h: box.h, ax: box.ax, ay: box.ay, figureH: FIGURE_H[type] || 54 };
  cache.set(key, f); return f;
}
