// @ts-nocheck
// Visual effects (docs/features/rendering.md): projectiles drawn by kind, and short-lived particles for hits, deaths,
// buildings, captures and garrisons. Display only: like updateSoundscape(), updateFx() spots new things by comparing the
// state between frames (effect / bullet ids, buildings, flag owners, garrisons), so the PvP guest sees the same. Particles
// live here, not in state; they only start where the local side sees, and stop while the game is paused.
import { ctx, drawUprightAt } from '../core/view';
import { localTeam, paused, state } from '../core/game';
import { settings } from '../core/settings';
import { teamCanSee } from '../sim/fog';
import { BUILDING_TYPES } from '../config/balance';
import { FX_COLORS as C, FX_MAX_PARTICLES } from '../config/visuals';
import { TEAM_COLORS } from '../config/theme';

const parts = [];
let last = 0, primed = false, stateRef = null;
let seenFx = new Set(), seenShots = new Map(), buildings = new Map(), owners = new Map(), garrisons = new Map(), sorties = new Map();
const rnd = (a, b) => a + Math.random() * (b - a);
const amount = n => Math.max(1, Math.round(settings.quality === 'low' ? n / 2 : n));
function add(p) { if (parts.length >= FX_MAX_PARTICLES) parts.shift(); parts.push({ age: 0, ...p }); }

// ---- particle recipes ----
// kind: spark (bright point with velocity), dust / smoke (soft growing puff), flash (radial glow), slash (swing arc),
// ring (expanding ring), debris (chunk thrown up, falls back with z), splinter (short spinning line).
function sparks(x, y, n, color = C.spark, speed = 120) {
  for (let i = 0; i < amount(n); i++) { const a = rnd(0, Math.PI * 2), v = rnd(.4, 1) * speed; add({ kind: 'spark', x, y: y - 10, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: rnd(.2, .4), color, size: rnd(1.8, 3) }); }
}
function dust(x, y, n, size = 10, color = C.dust) {
  for (let i = 0; i < amount(n); i++) add({ kind: 'dust', x: x + rnd(-8, 8), y: y + rnd(-4, 4), vx: rnd(-25, 25), vy: rnd(-12, 4), life: rnd(.45, .8), size: size * rnd(.7, 1.2), grow: 1.8, color, alpha: .45 });
}
function smoke(x, y, n, size = 16) {
  for (let i = 0; i < amount(n); i++) add({ kind: 'dust', x: x + rnd(-10, 10), y: y - rnd(0, 10), vx: rnd(-8, 8), vy: rnd(-34, -18), life: rnd(1.1, 1.8), size: size * rnd(.8, 1.3), grow: 2.2, color: C.smoke, alpha: .5 });
}
const flash = (x, y, r, color = C.glow, life = .16) => add({ kind: 'flash', x, y, r, color, life });
const slash = (x, y) => add({ kind: 'slash', x, y: y - 12, a: rnd(0, Math.PI * 2), life: .2, r: rnd(16, 22) });
const ring = (x, y, color, r = 70, life = .9) => add({ kind: 'ring', x, y, r, color, life });
function debris(x, y, n, color = C.debris, speed = 90) {
  for (let i = 0; i < amount(n); i++) { const a = rnd(0, Math.PI * 2), v = rnd(.3, 1) * speed; add({ kind: 'debris', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .5, z: 0, vz: rnd(80, 190), life: rnd(.7, 1.1), size: rnd(2, 4), color, spin: rnd(-8, 8) }); }
}
function splinters(x, y, n) { for (let i = 0; i < amount(n); i++) { const a = rnd(0, Math.PI * 2); add({ kind: 'splinter', x, y: y - 10, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70 - 20, life: rnd(.25, .4), a, spin: rnd(-14, 14) }); } }

// Hits by attacker (effect.src, sim/combat.ts): melee swings, arrows, gun shots.
const MELEE = { infantry: 4, spearman: 3, cavalry: 7, scout: 2, guard: 3 };
function hit(e) {
  if (MELEE[e.src]) { slash(e.x, e.y); flash(e.x, e.y - 12, 14, C.spark, .1); sparks(e.x, e.y, MELEE[e.src] + 2); }
  else if (e.src === 'archer' || e.src === 'flag') { splinters(e.x, e.y, 3); dust(e.x, e.y + 6, 1, 6); }
  else { flash(e.x, e.y - 8, 26, C.fire); sparks(e.x, e.y, 6, C.sparkHot, 150); smoke(e.x, e.y, 2, 12); debris(e.x, e.y, 3, C.dust, 60); }
}

// ---- spotting new things (called once per frame from draw()) ----
export function updateFx() {
  const now = performance.now(), dt = paused ? 0 : Math.min(.1, (now - (last || now)) / 1000); last = now;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.age += dt; if (p.age >= p.life) { parts.splice(i, 1); continue; }
    if (p.vx != null) { p.x += p.vx * dt; p.y += p.vy * dt; }
    if (p.kind === 'spark') { p.vy += 260 * dt; p.vx *= .92; }
    if (p.kind === 'debris') { p.vz -= 420 * dt; p.z = Math.max(0, p.z + p.vz * dt); if (!p.z) { p.vx *= .7; p.vy *= .7; } }
    if (p.kind === 'dust') { p.vx *= .95; p.vy *= .96; }
  }
  if (!state) return;
  if (state !== stateRef) { stateRef = state; primed = false; seenFx = new Set(); seenShots = new Map(); buildings = new Map(); owners = new Map(); garrisons = new Map(); sorties = new Map(); }
  const team = localTeam(), see = (x, y) => teamCanSee(team, x, y);
  // Hits and falls (once per effect id).
  const fx = new Set();
  for (const e of state.effects) {
    if (e.id == null) continue; fx.add(e.id);
    if (!primed || seenFx.has(e.id) || !(e.team === team || see(e.x, e.y))) continue;
    if (e.kind === 'fall') dust(e.x, e.y + 6, 4, 9); else hit(e);
  }
  seenFx = fx;
  // Shots: a muzzle flash and smoke where a gun fires (arrows have none); trails are drawn from the kept positions.
  const shots = new Map();
  for (const b of state.bullets) {
    if (b.id == null) continue;
    const old = seenShots.get(b.id), trail = old ? old.trail : [];
    trail.push({ x: b.x, y: b.y }); if (trail.length > 6) trail.shift();
    shots.set(b.id, { trail });
    if (primed && !old && !b.attackerType && see(b.x, b.y)) { flash(b.x, b.y, 18, C.fire, .12); smoke(b.x, b.y, 2, 9); }
  }
  seenShots = shots;
  // Buildings: placed (dust), finished (dust + gold sparkle), destroyed where seen (dust, smoke column, rubble).
  const next = new Map();
  for (const b of state.buildings) {
    const done = b.progress >= 1, before = buildings.get(b.id), visible = b.team === team || see(b.x, b.y);
    next.set(b.id, { x: b.x, y: b.y, done, kind: b.kind });
    if (!primed || !visible) continue;
    if (!before) dust(b.x, b.y + 10, 6, 14);
    else if (!before.done && done) { dust(b.x, b.y + 10, 6, 14); sparks(b.x, b.y - 10, 10, C.gold, 90); }
  }
  if (primed) for (const [id, b] of buildings) if (!next.has(id) && see(b.x, b.y)) {
    const s = (BUILDING_TYPES[b.kind]?.halfW || 30) / 30;
    flash(b.x, b.y - 10, 40 * s, C.fire, .2); dust(b.x, b.y + 8, 10, 18 * s); smoke(b.x, b.y - 10, 6, 22 * s); debris(b.x, b.y, 12, C.debris, 110);
  }
  buildings = next;
  // Flags: captured (ring in the new owner's colour, gold sparks); garrison going in / coming out (dust around the flag).
  for (const r of state.regions) {
    if (!r.cp) continue;
    const before = owners.get(r.id), visible = r.owner === team || before === team || see(r.cp.x, r.cp.y);
    if (primed && before !== undefined && before !== r.owner && r.owner >= 0 && visible) { ring(r.cp.x, r.cp.y, TEAM_COLORS[r.owner].light, 90); sparks(r.cp.x, r.cp.y - 30, 12, C.gold, 140); }
    owners.set(r.id, r.owner);
    if (r.owner !== team) continue; // a garrison is hidden from the enemy
    const inside = (state.garrisons || []).filter(u => u.garrison === r.id).length, out = state.units.filter(u => u.sortie === r.id).length;
    if (primed && inside > (garrisons.get(r.id) || 0)) dust(r.cp.x, r.cp.y + 10, 4, 10);
    if (primed && out > (sorties.get(r.id) || 0)) { dust(r.cp.x, r.cp.y + 10, 10, 16); ring(r.cp.x, r.cp.y, TEAM_COLORS[team].light, 60, .6); }
    garrisons.set(r.id, inside); sorties.set(r.id, out);
  }
  primed = true;
}

// ---- drawing ----
// Projectiles: arrows (archers, flags) as shaft + head + team fletching pointing at the target; gun shots as glowing balls
// with a fading trail. `show(b)` filters what the local side may see.
export function drawProjectiles(show) {
  for (const b of state.bullets) {
    if (!show(b)) continue;
    const t = b.target, a = t ? Math.atan2(t.y - b.y, t.x - b.x) : 0;
    drawUprightAt(b.x, b.y, () => {
      ctx.save(); ctx.translate(b.x, b.y - 8);
      if (b.attackerType === 'archer' || b.attackerType === 'flag') {
        ctx.rotate(a);
        ctx.strokeStyle = C.arrowShaft; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(6, 0); ctx.stroke();
        ctx.fillStyle = C.arrowHead; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(5, -2.6); ctx.lineTo(5, 2.6); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = TEAM_COLORS[b.team]?.light || C.slash; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-12, -2.5); ctx.moveTo(-9, 0); ctx.lineTo(-12, 2.5); ctx.stroke();
      } else {
        const trail = seenShots.get(b.id)?.trail || [];
        ctx.lineCap = 'round';
        for (let i = 1; i < trail.length; i++) { ctx.globalAlpha = i / trail.length * .5; ctx.strokeStyle = C.fire; ctx.lineWidth = 1 + i * .6; ctx.beginPath(); ctx.moveTo(trail[i - 1].x - b.x, trail[i - 1].y - b.y); ctx.lineTo(trail[i].x - b.x, trail[i].y - b.y); ctx.stroke(); }
        ctx.globalAlpha = 1; const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 7); g.addColorStop(0, C.glow); g.addColorStop(.45, C.fire); g.addColorStop(1, 'rgba(255,140,40,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });
  }
}
export function drawFx(inView) {
  for (const p of parts) {
    if (!inView(p)) continue;
    const k = p.age / p.life, fade = 1 - k;
    drawUprightAt(p.x, p.y, () => {
      ctx.save();
      if (p.kind === 'spark') { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fade; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
      else if (p.kind === 'dust') { ctx.globalAlpha = p.alpha * fade; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + k * p.grow), 0, Math.PI * 2); ctx.fill(); }
      else if (p.kind === 'flash') { ctx.globalCompositeOperation = 'lighter'; const r = p.r * (.6 + k * .6), g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, p.color); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.globalAlpha = fade; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); }
      else if (p.kind === 'slash') { ctx.globalAlpha = fade; ctx.strokeStyle = C.slash; ctx.lineWidth = 4 * fade + 1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, p.a, p.a + 1.9 * Math.min(1, k * 3)); ctx.stroke(); }
      else if (p.kind === 'ring') { ctx.globalAlpha = fade * .9; ctx.strokeStyle = p.color; ctx.lineWidth = 3 * fade + 1; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * k + 10, (p.r * k + 10) * .5, 0, 0, Math.PI * 2); ctx.stroke(); }
      else if (p.kind === 'debris') { ctx.globalAlpha = Math.min(1, fade * 2); ctx.fillStyle = p.color; ctx.translate(p.x, p.y - p.z); ctx.rotate(p.spin * p.age); ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); }
      else if (p.kind === 'splinter') { ctx.globalAlpha = fade; ctx.strokeStyle = C.wood; ctx.lineWidth = 1.4; ctx.translate(p.x, p.y); ctx.rotate(p.a + p.spin * p.age); ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.stroke(); }
      ctx.restore();
    });
  }
}
export const fxCount = () => parts.length;
