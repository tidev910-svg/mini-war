// @ts-nocheck
// Neutral camps on the map (docs/features/neutral-camps.md): the camp sites (den, bandit tents, troll cave, tomb) as the
// local side knows them, the monsters it sees, their falling bodies, the glow under units with the tomb's buff, and the
// notices and calls when a camp wakes, is cleared, fills again or the tomb opens. Monsters are drawn in code (no sprites).
// Display only; updateCampNotices() compares the state between frames, so the PvP guest gets the same notices.
import { ctx, drawUprightAt, renderView } from '../core/view';
import { addLog, gameTime, localTeam, state } from '../core/game';
import { settings } from '../core/settings';
import { CAMP_TYPES, CREEP_TYPES } from '../config/creeps';
import { RESOURCE_NAMES } from '../config/balance';
import { CREEP_COLORS as K } from '../config/visuals';
import { campKnownState, buffFactor } from '../sim/creeps';
import { creepCombatVisual } from './fx';
import { teamCanSee } from '../sim/fog';
import { playSound } from '../audio/sound';
import { MAP_LABEL_MIN_SCALE } from './buildings';
import { mapText, queueMapLabel } from './units';
import { wolfPoseAngles } from './wolf-pose';

const ell = (x, y, rx, ry, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
const poly = (pts, fill, stroke = null, lw = 2) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } };
const line = (x1, y1, x2, y2, color, w) => { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const rewardText = def => Object.entries(def.reward).map(([k, v]) => `+${v} ${RESOURCE_NAMES[k]}`).join(' ');

// ---- camp sites ----
function fire(x, y, s = 1) {
  const t = performance.now() / 1000;
  for (let i = -1; i <= 1; i++) line(x - 9 * s, y + 3 + i, x + 9 * s, y - 1 - i, K.wood, 3 * s);
  for (let k = 0; k < 3; k++) { const h = (13 + Math.sin(t * 9 + k * 2) * 4) * s, w = (6 - k * 1.5) * s; poly([x - w, y, x + Math.sin(t * 7 + k) * 2, y - h, x + w, y], k ? K.flame : K.ember); }
}
function tent(x, y, s, cloth) {
  poly([x - 22 * s, y + 8 * s, x, y - 26 * s, x + 22 * s, y + 8 * s], cloth, K.outline, 2);
  poly([x - 5 * s, y + 8 * s, x, y - 8 * s, x + 5 * s, y + 8 * s], K.dark);
  line(x, y - 26 * s, x, y - 34 * s, K.wood, 2);
}
export function drawCampSite(camp, known) {
  const { x, y } = camp, alive = known === 'alive', kind = camp.kind;
  drawUprightAt(x, y, () => {
    ctx.save(); if (known === 'cleared') ctx.globalAlpha = .75;
    ell(x + 4, y + 10, 92, 46, K.groundShadow); ell(x, y + 4, 86, 42, kind === 'tomb' ? K.stoneFloor : K.dirt);
    if (kind === 'wolves') {
      // Low rocky mound; the layered arch gives the entrance depth without crowding its footprint.
      poly([x-60,y+9,x-55,y-18,x-38,y-39,x-14,y-50,x+8,y-46,x+33,y-37,x+53,y-16,x+59,y+10,x+43,y+19,x-43,y+19], '#666e68',K.outline,2);
      poly([x-49,y-17,x-34,y-37,x-14,y-45,x-3,y-31,x-15,y-17,x-30,y-13], '#92978e','#4d514b',1.3);
      poly([x+7,y-43,x+30,y-35,x+48,y-17,x+34,y-12,x+19,y-24], '#777f77','#424740',1.2);
      // Dark arched mouth with a cool inner gradient and a raised stone lip.
      ctx.beginPath();ctx.moveTo(x-30,y+12);ctx.lineTo(x-27,y-7);ctx.quadraticCurveTo(x-25,y-31,x-4,y-34);ctx.quadraticCurveTo(x+19,y-34,x+23,y-8);ctx.lineTo(x+27,y+12);ctx.closePath();
      const cave=ctx.createLinearGradient(x,y-34,x,y+12);cave.addColorStop(0,'#141918');cave.addColorStop(.72,'#090d0d');cave.addColorStop(1,'#292a25');ctx.fillStyle=cave;ctx.fill();ctx.strokeStyle='#343a35';ctx.lineWidth=3;ctx.stroke();
      ctx.beginPath();ctx.moveTo(x-25,y-8);ctx.quadraticCurveTo(x-21,y-29,x-3,y-31);ctx.quadraticCurveTo(x+15,y-31,x+19,y-8);ctx.strokeStyle='#b1aa91';ctx.lineWidth=2;ctx.stroke();
      ell(x-2,y+8,25,5,'#4b5049');ell(x-2,y+7,17,2.2,'#9a927b');
      // Loose stones, sparse grass, bones and paw marks frame the entrance.
      for(const [sx,sy,rx,ry,col] of [[-51,7,7,5,'#a09b8b'],[47,6,8,5,'#b1a991'],[-37,19,5,3,'#85877d'],[39,-26,5,3,'#aaa38e']]){ell(x+sx,y+sy,rx,ry,col);ctx.strokeStyle='#565b54';ctx.lineWidth=1;ctx.stroke();}
      for(const side of [-1,1]){line(x+side*52,y+23,x+side*48,y+15,K.moss,2);line(x+side*57,y+23,x+side*60,y+14,K.moss,2);}
      for (const [bx, by, a] of [[x + 30, y + 27, .4], [x - 36, y + 27, -.6], [x + 7, y + 31, 1.2]]) { ctx.save(); ctx.translate(bx, by); ctx.rotate(a); line(-7, 0, 7, 0, K.bone, 2.5); ell(-7, 0, 2.5, 2.5, K.bone); ell(7, 0, 2.5, 2.5, K.bone); ctx.restore(); }
      for(const [px,py,a] of [[-68,13,-.2],[-59,28,.25],[65,15,.2],[57,31,-.3]]){ctx.save();ctx.translate(x+px,y+py);ctx.rotate(a);ell(-2,0,2.1,3,'#514d45');ell(2,0,2.1,3,'#514d45');for(const toe of [-4,0,4])ell(toe,-3,1.25,1.7,'#514d45');ctx.restore();}
    } else if (kind === 'bandits') {
      tent(x - 40, y - 10, 1, K.tentA); tent(x + 38, y - 14, .9, K.tentB);
      for (let i = 0; i < 7; i++) { const a = Math.PI * (.15 + i * .12), px = x + Math.cos(a) * 80, py = y + 10 + Math.sin(a) * 34; line(px, py, px, py - 18, K.wood, 4); }
      if (alive) fire(x, y + 8); else for (let i = -1; i <= 1; i++) line(x - 9, y + 11 + i, x + 9, y + 7 - i, K.ash, 3);
    } else if (kind === 'troll') {
      for (const [bx, by, r] of [[x - 50, y - 6, 26], [x + 48, y - 8, 28], [x - 22, y - 34, 30], [x + 20, y - 38, 30]]) { ell(bx, by, r, r * .8, K.rock); ctx.strokeStyle = K.outline; ctx.lineWidth = 2; ctx.stroke(); ell(bx - r * .3, by - r * .35, r * .35, r * .2, K.moss); }
      ell(x, y - 8, 30, 24, K.dark);
    } else if (kind === 'tomb') {
      poly([x - 70, y + 14, x - 62, y - 8, x + 62, y - 8, x + 70, y + 14], K.stone, K.outline);
      for (const px of [x - 46, x + 46]) { ctx.fillStyle = K.stoneLight; ctx.fillRect(px - 8, y - 70, 16, 64); ctx.strokeStyle = K.outline; ctx.lineWidth = 2; ctx.strokeRect(px - 8, y - 70, 16, 64); }
      poly([x - 58, y - 70, x, y - 96, x + 58, y - 70], K.stone, K.outline);
      ctx.fillStyle = known === 'closed' ? K.stoneLight : K.dark; ctx.fillRect(x - 22, y - 58, 44, 50);
      if (known === 'closed') { ctx.strokeStyle = K.rune; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 34, 11, 0, Math.PI * 2); ctx.moveTo(x, y - 47); ctx.lineTo(x, y - 21); ctx.stroke(); }
      else if (alive) { const g = ctx.createRadialGradient(x, y - 30, 2, x, y - 30, 40); g.addColorStop(0, K.curseGlow); g.addColorStop(1, 'rgba(150,80,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - 40, y - 70, 80, 80); }
    }
    ctx.restore();
    if (settings.mapLabels && renderView.scale >= MAP_LABEL_MIN_SCALE) {
      const def = CAMP_TYPES[kind], seen = teamCanSee(localTeam(), x, y);
      const status = known === 'closed' ? `MỞ LÚC ${clock(def.opensAt)}` : known === 'cleared' ? (seen && camp.state === 'cleared' ? `ĐÃ DỌN · QUAY LẠI ${clock(Math.max(0, camp.respawnAt - gameTime))}` : 'ĐÃ DỌN') : rewardText(def).toUpperCase() + (def.buff ? ` · SỨC MẠNH ${def.buff.seconds}S` : '');
      const ly = y + 58;
      queueMapLabel(x, y, () => { mapText(def.name.toUpperCase(), x, ly, 13, 900, K.label); mapText(status, x, ly + 18, 11, 800, known === 'alive' ? K.reward : K.labelDim); });
    }
  });
}

// ---- monsters ----
const facingLeft = c => String(c.facing || '').includes('left');
function humanoid(c, h, look) {
  const step = c.moving ? Math.sin(c.walk * 9) * 4 : 0, bob = c.moving ? Math.abs(Math.sin(c.walk * 9)) * 1.5 : Math.sin(c.walk * 2) * .6;
  const x = c.x, y = c.y - bob;
  ell(c.x + 2, c.y + 2, h * .26, h * .09, K.shadow);
  line(x - 4, y - h * .32, x - 4 + step, y, look.legs, h * .1); line(x + 4, y - h * .32, x + 4 - step, y, look.legs, h * .1);
  poly([x - h * .2, y - h * .3, x - h * .15, y - h * .72, x + h * .15, y - h * .72, x + h * .2, y - h * .3], look.body, K.outline, 1.5);
  ell(x, y - h * .84, h * .14, h * .14, look.head); ctx.strokeStyle = K.outline; ctx.lineWidth = 1.5; ctx.stroke();
  if (look.hood) poly([x - h * .17, y - h * .8, x, y - h * 1.04, x + h * .17, y - h * .8, x + h * .12, y - h * .9, x - h * .12, y - h * .9], look.hood);
  if (look.eyes) { ell(x - h * .05, y - h * .85, 1.6, 1.6, look.eyes); ell(x + h * .05, y - h * .85, 1.6, 1.6, look.eyes); }
  look.weapon?.(x, y);
}
const DRAW = {
  wolf(c) {
    const action=creepCombatVisual(c),pose=wolfPoseAngles(c.facing,action?.angle),phase=c.moving?c.walk*12:0,breathe=c.moving?0:Math.sin(c.walk*2)*.4;
    const windup=action?.phase==='windup'?1-Math.max(0,action.left/Math.max(.001,action.duration)):0,bite=action?.phase==='bite'?Math.sin(Math.min(1,1-Math.max(0,action.left/Math.max(.001,action.duration)))*Math.PI):0;
    const recovering=action?.phase==='recovery'?1-Math.max(0,action.left/Math.max(.001,action.duration)):0,bodyLift=c.moving?Math.max(0,Math.sin(phase*2))*.75:breathe;
    ctx.save();ctx.translate(c.x,c.y);ctx.rotate(pose.bodyAngle);if(pose.flipX)ctx.scale(-1,1);
    // Low cast shadow and four articulated legs sit beneath the torso.
    ell(2,3,19,5.5,K.shadow);
    for(const [lx,front,offset] of [[-12,false,0],[-5,false,Math.PI],[7,true,Math.PI*.5],[13,true,-Math.PI*.5]]){
      const stride=c.moving?Math.sin(phase+offset)*3.1:Math.sin(c.walk*2+offset)*.25;
      const hipY=(front?-12:-10)+bodyLift,elbowX=lx+stride*.45,elbowY=-5+(front?1:0)+bodyLift*.45,pawX=lx+stride,pawY=1;
      ctx.strokeStyle='#49443e';ctx.lineWidth=4.2;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.beginPath();ctx.moveTo(lx,hipY);ctx.lineTo(elbowX,elbowY);ctx.lineTo(pawX,pawY);ctx.stroke();
      ctx.strokeStyle='#aaa397';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(lx,hipY+1);ctx.lineTo(elbowX,elbowY);ctx.stroke();
      ell(pawX+1,pawY,3,1.8,'#403b36');
    }
    // Lean, layered torso with a darker back and a warm chest patch.
    ell(-1,-12+bodyLift,18,8.2,'#393633');ctx.strokeStyle=K.outline;ctx.lineWidth=1.3;ctx.stroke();
    ell(-1,-13+bodyLift,16.5,6.8,'#817970');ell(-3,-15+bodyLift,11.5,3.4,'#514b44');
    // A warm, tapered underside separates the lean belly from the deeper chest and shoulders.
    ctx.beginPath();ctx.moveTo(-9,-10+bodyLift);ctx.quadraticCurveTo(-2,-7+bodyLift,7,-9+bodyLift);ctx.quadraticCurveTo(10,-11+bodyLift,9,-13+bodyLift);ctx.quadraticCurveTo(0,-10+bodyLift,-9,-12+bodyLift);ctx.closePath();ctx.fillStyle='#b2a28d';ctx.fill();
    ell(7,-11+bodyLift,8,6.4,'#8d857a');ell(8,-10+bodyLift,3.8,5.2,'#c3b6a1');
    // Soft, curved tail follows the gait instead of reading as a rigid bar.
    const tailLift=Math.sin(phase*.5+c.walk)*2.2;
    ctx.strokeStyle='#403b36';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-15,-14+bodyLift);ctx.quadraticCurveTo(-20,-11+tailLift,-24,-16+tailLift);ctx.quadraticCurveTo(-27,-20+tailLift,-30,-17+tailLift);ctx.stroke();
    ctx.strokeStyle='#a99e8e';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(-26,-18+tailLift);ctx.quadraticCurveTo(-28,-20+tailLift,-30,-17+tailLift);ctx.stroke();
    // Shoulder-pivoted neck/head rig: lower, reach and open the jaw at the actual hit pose.
    ctx.save();ctx.translate(8,-17+bodyLift);ctx.rotate(pose.headAim*.8-windup*.08+bite*.1+recovering*.04);ctx.translate(bite*2.7-windup*.5,windup*1.1+bite*1.4);
    ctx.beginPath();ctx.moveTo(-1,2);ctx.quadraticCurveTo(2,-7,8,-9);ctx.quadraticCurveTo(13,-8,15,-3);ctx.lineTo(10,4);ctx.quadraticCurveTo(4,5,1,7);ctx.closePath();ctx.fillStyle='#5e5850';ctx.fill();ctx.strokeStyle='#302c28';ctx.lineWidth=1.2;ctx.stroke();
    ctx.beginPath();ctx.moveTo(4,-3);ctx.quadraticCurveTo(9,-7,13,-4);ctx.strokeStyle='#b5a995';ctx.lineWidth=2;ctx.stroke();
    poly([3,-7,5,-13,8,-8],'#aaa195','#443e38',.8);poly([10,-8,14,-13,15,-7],'#81796f','#393531',.8);
    poly([5,-8,13,-9,17,-5,15,-1,10,0,5,-3],'#999187','#393531',1);
    ell(17,-3,6,3.2,'#b3a894');ell(22,-3.2,1.7,1.45,'#201d1a');ell(12,-6,1.25,1.05,K.eyeGlow);ell(12.2,-6,.45,.75,'#191613');
    if(bite>.08){ctx.beginPath();ctx.moveTo(12,-.5);ctx.quadraticCurveTo(17,1+bite*2,21,-1);ctx.lineTo(17,1+bite*4);ctx.quadraticCurveTo(14,2+bite*3,12,-.5);ctx.closePath();ctx.fillStyle='#2a1715';ctx.fill();line(15,1,16,2+bite*3,'#efe4d4',.8);line(19,0,18,2+bite*3,'#efe4d4',.8);}
    else {ctx.strokeStyle='#4c352d';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(13,-.5);ctx.quadraticCurveTo(17,1,20,-.4);ctx.stroke();}
    ctx.restore();
    // Short fur marks reinforce the darker dorsal coat without adding noisy detail.
    ctx.strokeStyle='#c6b8a3';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-7,-18+bodyLift);ctx.lineTo(-4,-20+bodyLift);ctx.moveTo(-1,-18+bodyLift);ctx.lineTo(2,-20+bodyLift);ctx.moveTo(5,-17+bodyLift);ctx.lineTo(7,-19+bodyLift);ctx.stroke();
    ctx.strokeStyle='#d2c6b3';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-7,-18);ctx.lineTo(-4,-20);ctx.moveTo(-1,-18);ctx.lineTo(2,-20);ctx.moveTo(5,-17);ctx.lineTo(7,-19);ctx.stroke();
    ctx.restore();
  },
  bandit: c => humanoid(c, 46, { legs: K.leather, body: K.banditCloth, head: K.skin, hood: K.banditHood, weapon: (x, y) => line(x + 9, y - 22, x + 20, y - 40, K.steel, 3) }),
  banditArcher: c => humanoid(c, 44, { legs: K.leather, body: K.banditCloth2, head: K.skin, hood: K.banditHood, weapon: (x, y) => { ctx.strokeStyle = K.wood; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x + 10, y - 28, 13, -1.3, 1.3); ctx.stroke(); } }),
  skeleton: c => humanoid(c, 46, { legs: K.bone, body: K.boneDark, head: K.bone, eyes: K.curse, weapon: (x, y) => line(x + 9, y - 20, x + 19, y - 42, K.rust, 3) }),
  troll(c) {
    const x = c.x, y = c.y - (c.moving ? Math.abs(Math.sin(c.walk * 5)) * 2 : 0), sw = c.moving ? Math.sin(c.walk * 5) * 6 : 0;
    ell(c.x + 3, c.y + 3, 30, 9, K.shadow);
    line(x - 12, y - 30, x - 14 + sw, y, K.trollDark, 11); line(x + 12, y - 30, x + 14 - sw, y, K.trollDark, 11);
    ell(x, y - 46, 30, 26, K.troll); ctx.strokeStyle = K.outline; ctx.lineWidth = 2; ctx.stroke();
    for (const [px, py] of [[-12, -56], [10, -60], [2, -40]]) ell(x + px, y + py, 7, 4, K.moss);
    ell(x + 4, y - 74, 12, 10, K.troll); ctx.stroke(); ell(x + 1, y - 76, 2, 2, K.eyeGlow); ell(x + 8, y - 76, 2, 2, K.eyeGlow);
    line(x + 26, y - 50, x + 34, y - 18, K.trollDark, 9); line(x + 34, y - 18, x + 40, y - 64, K.wood, 8); ell(x + 41, y - 66, 8, 8, K.rock);
    line(x - 26, y - 50, x - 30, y - 16, K.trollDark, 9);
  },
  boss(c) {
    const x = c.x, y = c.y - Math.sin(c.walk * 2) * 1.5, t = performance.now() / 1000;
    ell(c.x, c.y + 2, 34, 11, K.curseShadow);
    const g = ctx.createRadialGradient(x, y - 48, 4, x, y - 48, 62); g.addColorStop(0, 'rgba(160,90,255,0.35)'); g.addColorStop(1, 'rgba(160,90,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 48, 62, 0, Math.PI * 2); ctx.fill();
    poly([x - 26, y, x - 18, y - 62, x + 18, y - 62, x + 26, y], K.robe, K.outline, 2);
    poly([x - 18, y - 62, x, y - 30, x + 18, y - 62], K.robeTrim);
    ell(x, y - 74, 13, 13, K.bone); ctx.strokeStyle = K.outline; ctx.lineWidth = 2; ctx.stroke();
    ell(x - 5, y - 75, 3, 3, K.curse); ell(x + 5, y - 75, 3, 3, K.curse);
    poly([x - 13, y - 82, x - 11, y - 96, x - 5, y - 87, x, y - 99, x + 5, y - 87, x + 11, y - 96, x + 13, y - 82], K.crown, K.outline, 1.5);
    line(x + 26, y - 4, x + 30, y - 92, K.wood, 4);
    const orb = 8 + Math.sin(t * 4) * 1.5; ell(x + 30, y - 96, orb, orb, K.curse); ell(x + 30, y - 96, orb * .45, orb * .45, K.curseGlow);
  },
};
export function drawCreep(c) {
  drawUprightAt(c.x, c.y, () => {
    ctx.save();
    if (c.creep!=='wolf'&&facingLeft(c)) { ctx.translate(c.x, 0); ctx.scale(-1, 1); ctx.translate(-c.x, 0); }
    DRAW[c.creep]?.(c);
    ctx.restore();
  });
}
// Health bar above a monster: amber, so it never reads as either side.
export function drawCreepBar(c) {
  const s = CREEP_TYPES[c.creep], w = Math.max(24, s.r * 2.6), top = s.r >= 20 ? (c.creep === 'boss' ? 108 : 92) : c.creep === 'wolf' ? 30 : 58;
  drawUprightAt(c.x, c.y, () => {
    const h = Math.max(4, 5 / (renderView.scale || 1) * .6), y = c.y - top;
    ctx.fillStyle = K.barBack; ctx.fillRect(c.x - w / 2 - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = K.bar; ctx.fillRect(c.x - w / 2, y, w * Math.max(0, c.hp / c.max), h);
  });
}
export function drawCreepFall(e) {
  const p = 1 - e.life / e.max, alpha = p < .6 ? 1 : Math.max(0, 1 - (p - .6) / .4), side = facingLeft(e) ? -1 : 1;
  drawUprightAt(e.x, e.y, () => {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(e.x, e.y); ctx.rotate(Math.min(1, p / .35) * Math.PI / 2 * side); ctx.translate(-e.x, -e.y);
    DRAW[e.creep]?.({ x: e.x, y: e.y, walk: 0, moving: false, facing: e.facing });
    ctx.restore();
  });
}
// A pulsing ring under each visible unit whose side has the tomb's buff.
export function drawBuffAuras(inView) {
  if (!state.buffs?.length) return;
  const t = performance.now() / 1000, me = localTeam();
  for (const team of [0, 1]) {
    if (buffFactor(team, 'damage') <= 1) continue;
    for (const u of state.units) {
      if (u.team !== team || !inView(u) || (team !== me && !teamCanSee(me, u.x, u.y))) continue;
      drawUprightAt(u.x, u.y, () => { ctx.save(); ctx.globalAlpha = .55 + Math.sin(t * 5 + u.id) * .2; ctx.strokeStyle = K.buff; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(u.x, u.y + 2, 17, 7, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); });
    }
  }
}

// The camp under a map point, for clicks: a camp `team` knows to be full within CAMP_HIT_RADIUS of its centre, or the
// camp of a monster it sees under the point.
const CAMP_HIT_RADIUS = 95;
export function campAt(x, y, team) {
  for (const c of state.creeps || []) if (Math.hypot(c.x - x, c.y - (y + CREEP_TYPES[c.creep].r)) <= CREEP_TYPES[c.creep].r * 2 + 10 && teamCanSee(team, c.x, c.y)) return state.camps.find(k => k.id === c.camp) || null;
  return (state.camps || []).find(c => Math.hypot(c.x - x, c.y - y) <= CAMP_HIT_RADIUS && campKnownState(c, team) != null) || null;
}
// One line about a camp for the log (left click).
export function campInfo(camp, team) {
  const def = CAMP_TYPES[camp.kind], known = campKnownState(camp, team);
  const who = Object.entries(def.creeps).map(([t, n]) => `${n} ${CREEP_TYPES[t].name.toLowerCase()}`).join(', ');
  if (known === 'closed') return `${def.name}: còn niêm phong, mở lúc ${clock(def.opensAt)}. Hạ Vua Xương để cả quân được +${Math.round(def.buff.damage * 100)}% sát thương, +${Math.round(def.buff.speed * 100)}% tốc độ trong ${def.buff.seconds} giây.`;
  if (known === 'cleared') return `${def.name}: đã dọn, quái sẽ quay lại sau ít phút.`;
  return `${def.name}: ${who}. Phần thưởng ${rewardText(def)}` + (def.buff ? `, cả quân +${Math.round(def.buff.damage * 100)}% sát thương, +${Math.round(def.buff.speed * 100)}% tốc độ trong ${def.buff.seconds} giây` : '') + ` cho phe gây nhiều sát thương nhất. Chọn quân rồi chuột phải vào hang để dọn.`;
}

// ---- notices and calls (once per change, for the local side) ----
let ref = null, before = new Map(), buffed = false;
const CALL = { wolves: 'creep.howl', bandits: 'creep.horn', troll: 'creep.roar', tomb: 'creep.roar' };
export function updateCampNotices() {
  if (!state?.camps) return;
  const me = localTeam(), first = ref !== state; if (first) { ref = state; before = new Map(); buffed = false; }
  for (const camp of state.camps) {
    const old = before.get(camp.id), def = CAMP_TYPES[camp.kind], seen = teamCanSee(me, camp.x, camp.y), name = def.name;
    before.set(camp.id, { state: camp.state, awake: camp.awake > 0 });
    if (first || !old) continue;
    if (old.state === 'closed' && camp.state === 'alive') { addLog(`${name} đã mở! Hạ Vua Xương để cả quân được +${Math.round(def.buff.damage * 100)}% sát thương, +${Math.round(def.buff.speed * 100)}% tốc độ trong ${def.buff.seconds} giây (${rewardText(def)}).`, 'danger'); playSound('event.tombOpen'); }
    else if (old.state === 'alive' && camp.state === 'cleared') {
      if (camp.winner === me) { addLog(`Đã dọn ${name.toLowerCase()}: ${rewardText(def)}` + (def.buff ? ` · cả quân +${Math.round(def.buff.damage * 100)}% sát thương, +${Math.round(def.buff.speed * 100)}% tốc độ trong ${def.buff.seconds} giây!` : '.')); playSound('event.campCleared'); }
      else if (camp.winner >= 0 && (seen || def.buff)) addLog(def.buff ? `Đối phương đã hạ Vua Xương: quân địch mạnh hơn trong ${def.buff.seconds} giây!` : `Đối phương đã dọn ${name.toLowerCase()}.`, 'danger');
    } else if (old.state === 'cleared' && camp.state === 'alive' && seen) addLog(`${name} đã có quái trở lại.`);
    if (camp.state === 'alive' && !old.awake && camp.awake > 0 && seen) playSound(CALL[camp.kind], camp);
  }
  const now = buffFactor(me, 'damage') > 1;
  if (!first && buffed && !now) addLog('Sức mạnh Lăng cổ đã hết.');
  buffed = now;
}
