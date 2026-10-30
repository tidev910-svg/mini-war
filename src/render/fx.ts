// @ts-nocheck
// Visual effects (docs/features/rendering.md): projectiles drawn by kind, and short-lived particles for hits, deaths,
// buildings, captures and garrisons. Display only: like updateSoundscape(), updateFx() spots new things by comparing the
// state between frames (effect / bullet ids, buildings, flag owners, garrisons), so the PvP guest sees the same. Particles
// live here, not in state; they only start where the local side sees, and stop while the game is paused.
import { CREEP_TYPES } from '../config/creeps';
import { ctx, drawUprightAt } from '../core/view';
import { gameTime, localTeam, paused, state } from '../core/game';
import { settings } from '../core/settings';
import { teamCanSee } from '../sim/fog';
import { BUILDING_TYPES } from '../config/balance';
import { ARCHER_ATTACK_ANIM, CAVALRY_ATTACK_ANIM, SPEARMAN_ATTACK_ANIM, WOLF_ATTACK_ANIM, FX_COLORS as C, FX_MAX_PARTICLES } from '../config/visuals';
import { TEAM_COLORS } from '../config/theme';

const parts = [], particlePool = [];
let last = 0, primed = false, stateRef = null, lastGameTime = 0;
let seenFx = new Set(), seenShots = new Map(), seenActions = new Set(), buildings = new Map(), owners = new Map(), garrisons = new Map(), sorties = new Map();
const unitActions = new Map(), creepActions = new Map(), unitFlashes = new Map(), horseDustClocks = new Map();
// Private renderer-only generator: particle variation must never consume Math.random used by simulation/AI.
let renderSeed = 0x6d2b79f5;
const randomVisual = () => { renderSeed ^= renderSeed << 13; renderSeed ^= renderSeed >>> 17; renderSeed ^= renderSeed << 5; return (renderSeed >>> 0) / 0x100000000; };
const rnd = (a, b) => a + randomVisual() * (b - a);
const amount = n => Math.max(1, Math.round(settings.quality === 'low' ? n / 2 : n));
function add(p) {
  if (parts.length >= FX_MAX_PARTICLES) particlePool.push(parts.shift());
  const item = particlePool.pop() || {}; for (const key in item) delete item[key]; Object.assign(item, p, { age: 0 }); parts.push(item);
}

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
function attackTrace(e) {
  if (e.unitType === 'archer') return; // The existing gameplay arrow is the single projectile; do not make a visual duplicate.
  const angle = Number.isFinite(e.angle) ? e.angle : 0;
  if (e.unitType === 'infantry') add({ kind: 'slash', x: e.x + Math.cos(angle) * 13, y: e.y - 12 + Math.sin(angle) * 8, a: angle - .75, life: .16, r: 16 });
  else if (e.unitType === 'spearman' || e.unitType === 'cavalry') add({ kind: 'thrust', x: e.x, y: e.y - 13, a: angle, life: .15, length: e.unitType === 'cavalry' ? 20 : 17 });
  else add({ kind: 'scoutTrail', x: e.x + Math.cos(angle) * 7, y: e.y - 10 + Math.sin(angle) * 4, a: angle, life: .11, length: 8 });
}

// Hits by attacker (effect.src, sim/combat.ts): melee swings, arrows, gun shots.
// Monsters (sim/creeps.ts) name their own hits: the troll and the boss smash the ground.
const MELEE = { infantry: 4, spearman: 3, cavalry: 7, scout: 2, wolf: 3, bandit: 4, skeleton: 3, boar: 3, spiderling: 2 };
function hit(e) {
  if (CREEP_TYPES[e.src]?.splash) { const tint = e.src === 'boss' ? C.curse : e.src === 'dragon' ? C.fire : null; flash(e.x, e.y, 30, tint || C.glow, .18); dust(e.x, e.y + 6, 6, 14); debris(e.x, e.y, 5, C.dust, 80); ring(e.x, e.y, tint || C.dust, 40, .4); if (e.src === 'dragon') sparks(e.x, e.y, 10, C.sparkHot, 160); }
  else if (MELEE[e.src]) { slash(e.x, e.y); flash(e.x, e.y - 12, 14, C.spark, .1); sparks(e.x, e.y, MELEE[e.src] + 2); }
  else if (e.src === 'archer' || e.src === 'flag') { splinters(e.x, e.y, 3); dust(e.x, e.y + 6, 1, 6); }
  else { flash(e.x, e.y - 8, 26, C.fire); sparks(e.x, e.y, 6, C.sparkHot, 150); smoke(e.x, e.y, 2, 12); debris(e.x, e.y, 3, C.dust, 60); }
}

// ---- spotting new things (called once per frame from draw()) ----
export function updateFx(inView = () => true) {
  const now = performance.now(), dt = paused ? 0 : Math.min(.1, (now - (last || now)) / 1000); last = now;
  for (const [id, action] of unitActions) {
    action.left -= dt;
    if (action.left <= 0 && action.type === 'archer' && action.phase === 'aim') { action.phase = 'draw'; action.left = action.drawLeft; action.duration = action.drawLeft; }
    else if (action.left <= 0 && action.type === 'archer' && action.phase === 'release') { action.phase = 'recovery'; action.left = ARCHER_ATTACK_ANIM.recoverySeconds; action.duration = ARCHER_ATTACK_ANIM.recoverySeconds; }
    else if (action.left <= 0 && action.phase === 'impact') { const recovery = action.type === 'spearman' ? SPEARMAN_ATTACK_ANIM.recoverySeconds : action.type === 'cavalry' ? CAVALRY_ATTACK_ANIM.recoverySeconds : .12; action.phase = 'recovery'; action.left = recovery; action.duration = recovery; }
    else if (action.left <= 0) unitActions.delete(id);
  }
  for (const [id, action] of creepActions) {
    action.left -= dt;
    if (action.left <= 0 && action.phase === 'bite') { action.phase = 'recovery'; action.left = WOLF_ATTACK_ANIM.recoverySeconds; action.duration = WOLF_ATTACK_ANIM.recoverySeconds; }
    else if (action.left <= 0) creepActions.delete(id);
  }
  for (const [id, flashState] of unitFlashes) { flashState.left -= dt; if (flashState.left <= 0) unitFlashes.delete(id); }
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.age += dt; if (p.age >= p.life) { particlePool.push(parts.splice(i, 1)[0]); continue; }
    if (p.vx != null) { p.x += p.vx * dt; p.y += p.vy * dt; }
    if (p.kind === 'spark') { p.vy += 260 * dt; p.vx *= .92; }
    if (p.kind === 'debris') { p.vz -= 420 * dt; p.z = Math.max(0, p.z + p.vz * dt); if (!p.z) { p.vx *= .7; p.vy *= .7; } }
    if (p.kind === 'dust') { p.vx *= .95; p.vy *= .96; }
  }
  if (!state) return;
  // Host snapshots replace the state object repeatedly. Preserve render event cursors across those snapshots;
  // reset them only when the match clock visibly rewinds into a new match.
  if (state !== stateRef) {
    const newMatch = stateRef != null && gameTime < lastGameTime - .01; stateRef = state;
    if (newMatch || !primed) { primed = false; seenFx = new Set(); seenShots = new Map(); seenActions = new Set(); buildings = new Map(); owners = new Map(); garrisons = new Map(); sorties = new Map(); unitActions.clear(); creepActions.clear(); unitFlashes.clear(); horseDustClocks.clear(); }
  }
  lastGameTime = gameTime;
  const team = localTeam(), see = (x, y) => teamCanSee(team, x, y);
  // Hits and falls (once per effect id).
  const fx = new Set();
  for (const e of state.effects) {
    if (e.id == null) continue; fx.add(e.id);
    if (!primed || seenFx.has(e.id) || !(e.team === team || see(e.x, e.y)) || !inView(e)) continue;
    if (e.kind === 'fall' || e.kind === 'creepFall') dust(e.x, e.y + 6, 4, 9);
    else {
      if (settings.combatVfxEnabled && e.targetUnitId != null) {
        unitFlashes.set(e.targetUnitId, { left: .11 });
        flash(e.x, e.y - 10, 10, C.spark, .11); sparks(e.x, e.y - 10, 2, C.spark, 45);
      } else hit(e);
    }
  }
  seenFx = fx;
  const actions = new Set();
  for (const e of state.visualEvents || []) {
    if (e.id == null) continue; actions.add(e.id);
    const poseAction = (e.unitType === 'infantry' || e.unitType === 'archer' || e.unitType === 'spearman' || e.unitType === 'cavalry' || e.unitType === 'wolf') && (e.kind === 'attackWindup' || e.kind === 'attack' || e.kind === 'attackCancel');
    if ((!settings.combatVfxEnabled && !poseAction) || seenActions.has(e.id) || !(e.team === team || see(e.x, e.y)) || !inView(e)) continue;
    const current = unitActions.get(e.unitId);
    const creepCurrent=creepActions.get(e.unitId);
    if(e.unitType==='wolf'&&e.kind==='attackWindup'){
      const duration=Math.max(.04,Math.min(WOLF_ATTACK_ANIM.windupSeconds,e.duration||WOLF_ATTACK_ANIM.windupSeconds));
      creepActions.set(e.unitId,{left:duration,duration,angle:e.angle,type:'wolf',phase:'windup',actionId:e.actionId,targetUnitId:e.targetUnitId});
    }
    else if(e.unitType==='wolf'&&e.kind==='attack'){
      creepActions.set(e.unitId,{left:WOLF_ATTACK_ANIM.biteSeconds,duration:WOLF_ATTACK_ANIM.biteSeconds,angle:e.angle,type:'wolf',phase:'bite',actionId:e.actionId,targetUnitId:e.targetUnitId});
    }
    else if(e.unitType==='wolf'&&e.kind==='attackCancel'){if(creepCurrent?.actionId===e.actionId)creepActions.delete(e.unitId);}
    else if (e.kind === 'attackWindup' && e.unitType === 'archer') {
      const duration = Math.max(.04, Math.min(ARCHER_ATTACK_ANIM.windupSeconds, e.duration || ARCHER_ATTACK_ANIM.windupSeconds));
      const aimLeft = duration * ARCHER_ATTACK_ANIM.aimFraction, drawLeft = duration - aimLeft;
      unitActions.set(e.unitId, { left: aimLeft, duration: aimLeft, drawLeft, angle: e.angle, type: e.unitType, phase: 'aim', actionId: e.actionId });
    }
    else if (e.kind === 'attackWindup' && e.unitType === 'spearman') { const duration = Math.max(.04, Math.min(SPEARMAN_ATTACK_ANIM.windupSeconds, e.duration || SPEARMAN_ATTACK_ANIM.windupSeconds)); unitActions.set(e.unitId, { left: duration, duration, angle: e.angle, type: e.unitType, phase: 'windup', actionId: e.actionId }); }
    else if (e.kind === 'attackWindup' && e.unitType === 'cavalry') { const duration = Math.max(.04, Math.min(CAVALRY_ATTACK_ANIM.windupSeconds+CAVALRY_ATTACK_ANIM.thrustSeconds, e.duration || CAVALRY_ATTACK_ANIM.windupSeconds+CAVALRY_ATTACK_ANIM.thrustSeconds)); unitActions.set(e.unitId, { left: duration, duration, angle: e.angle, type: e.unitType, phase: 'windup', actionId: e.actionId }); }
    else if (e.kind === 'attackWindup') unitActions.set(e.unitId, { left: .22, duration: .22, angle: e.angle, type: e.unitType, phase: 'windup', actionId: e.actionId });
    else if (e.kind === 'attackCancel') { if (current?.actionId === e.actionId) unitActions.delete(e.unitId); }
    else if (e.kind === 'attack' && e.unitType === 'archer') unitActions.set(e.unitId, { left: ARCHER_ATTACK_ANIM.releaseSeconds, duration: ARCHER_ATTACK_ANIM.releaseSeconds, angle: e.angle, type: e.unitType, phase: 'release', actionId: e.actionId });
    else if (e.kind === 'attack' && e.unitType === 'infantry') unitActions.set(e.unitId, { left: .07, duration: .07, angle: e.angle, type: e.unitType, phase: 'impact', actionId: e.actionId });
    else if (e.kind === 'attack' && e.unitType === 'spearman') unitActions.set(e.unitId, { left: SPEARMAN_ATTACK_ANIM.impactSeconds, duration: SPEARMAN_ATTACK_ANIM.impactSeconds, angle: e.angle, type: e.unitType, phase: 'impact', actionId: e.actionId });
    else if (e.kind === 'attack' && e.unitType === 'cavalry') unitActions.set(e.unitId, { left: CAVALRY_ATTACK_ANIM.impactSeconds, duration: CAVALRY_ATTACK_ANIM.impactSeconds, angle: e.angle, type: e.unitType, phase: 'impact', actionId: e.actionId });
    else unitActions.set(e.unitId, { left: Math.min(.2, e.life || .2), duration: Math.min(.2, e.max || .2), angle: e.angle, type: e.unitType });
    if (settings.combatVfxEnabled && e.kind === 'attack') attackTrace(e);
  }
  seenActions = actions;
  // Very light hoof dust only while a visible cavalry unit is moving and inside the camera.
  for (const id of horseDustClocks.keys()) horseDustClocks.set(id, -1);
  if (settings.combatVfxEnabled) for (const u of state.units) {
    if (u.type !== 'cavalry') continue;
    if (!u.moving || !(u.team === team || see(u.x, u.y)) || !inView(u)) { horseDustClocks.delete(u.id); continue; }
    const clock = Math.max(0, horseDustClocks.get(u.id) || 0) + dt;
    if (clock >= .24) {
      horseDustClocks.set(u.id, clock % .24);
      add({ kind: 'horseDust', ground: true, x: u.x + rnd(-4, 4), y: u.y + 5, vx: rnd(-5, 5), vy: 4, life: .34, size: 4, grow: 1.2, color: C.dust, alpha: .19 });
    } else horseDustClocks.set(u.id, clock);
  }
  for (const [id, clock] of horseDustClocks) if (clock < 0) horseDustClocks.delete(id);
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
      const archerArrow=b.attackerType==='archer';
      ctx.save(); ctx.translate(b.x, b.y - (archerArrow?0:8));
      if (archerArrow) {
        // b.x/b.y is the arrowhead anchor from the nocked position in the Archer draw frame.
        ctx.rotate(a);
        ctx.strokeStyle=C.arrowShaft;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-15,0);ctx.lineTo(0,0);ctx.stroke();
        ctx.fillStyle=C.arrowHead;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-5,-2.6);ctx.lineTo(-5,2.6);ctx.closePath();ctx.fill();
        ctx.strokeStyle=TEAM_COLORS[b.team]?.light||C.slash;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(-17,-2.5);ctx.moveTo(-14,0);ctx.lineTo(-17,2.5);ctx.stroke();
      } else if (b.attackerType === 'flag') {
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
function drawParticles(inView, groundOnly) {
  for (const p of parts) {
    if (!!p.ground !== groundOnly) continue;
    if (!inView(p)) continue;
    const k = p.age / p.life, fade = 1 - k;
    drawUprightAt(p.x, p.y, () => {
      ctx.save();
      if (p.kind === 'spark') { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fade; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
      else if (p.kind === 'dust') { ctx.globalAlpha = p.alpha * fade; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + k * p.grow), 0, Math.PI * 2); ctx.fill(); }
      else if (p.kind === 'flash') { ctx.globalCompositeOperation = 'lighter'; const r = p.r * (.6 + k * .6), g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, p.color); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.globalAlpha = fade; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); }
      else if (p.kind === 'slash') { ctx.globalAlpha = fade; ctx.strokeStyle = C.slash; ctx.lineWidth = 4 * fade + 1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, p.a, p.a + 1.9 * Math.min(1, k * 3)); ctx.stroke(); }
      else if (p.kind === 'thrust' || p.kind === 'scoutTrail') {
        ctx.globalAlpha = fade * (p.kind === 'scoutTrail' ? .5 : .72); ctx.strokeStyle = p.kind === 'scoutTrail' ? C.spark : C.slash; ctx.lineWidth = p.kind === 'scoutTrail' ? 1.5 : 2.2; ctx.lineCap = 'round'; ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(p.length, 0); ctx.stroke();
      }
      else if (p.kind === 'ring') { ctx.globalAlpha = fade * .9; ctx.strokeStyle = p.color; ctx.lineWidth = 3 * fade + 1; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * k + 10, (p.r * k + 10) * .5, 0, 0, Math.PI * 2); ctx.stroke(); }
      else if (p.kind === 'debris') { ctx.globalAlpha = Math.min(1, fade * 2); ctx.fillStyle = p.color; ctx.translate(p.x, p.y - p.z); ctx.rotate(p.spin * p.age); ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); }
      else if (p.kind === 'splinter') { ctx.globalAlpha = fade; ctx.strokeStyle = C.wood; ctx.lineWidth = 1.4; ctx.translate(p.x, p.y); ctx.rotate(p.a + p.spin * p.age); ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ctx.stroke(); }
      ctx.restore();
    });
  }
}
export function drawGroundFx(inView) { drawParticles(inView, true); }
export function drawFx(inView) { drawParticles(inView, false); }
export function unitCombatVisual(u) {
  const action = unitActions.get(u.id), flashState = unitFlashes.get(u.id);
  if (!action && !flashState) return null;
  return { action: action ? { ...action, pulse: action.phase === 'windup' || action.phase === 'impact' || action.phase === 'recovery' ? 0 : Math.sin((1 - Math.max(0, action.left / Math.max(.001, action.duration))) * Math.PI) } : null,
    flash: flashState ? Math.max(0, flashState.left / .11) : 0 };
}
export function creepCombatVisual(c) { return creepActions.get(c.id) || null; }
export const fxCount = () => parts.length;
