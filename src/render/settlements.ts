// @ts-nocheck
// Painted-map scenery shared by every map (docs/features/rendering.md, "Làng, tháp canh"): a thatched hamlet beside every mine with props of its resource (rice paddies, log piles, quarry
// blocks, gold heaps), a wooden watchtower by every flag, a few pagodas on the rock massifs, and clouds framing the map
// when zoomed out. Display only: nothing here blocks units, buildings or vision, and the layout is deterministic for a
// given state (host and guest build the same) — buildSettlements() runs from buildWorldDecor().
import { H, MAP_TILES, TILE_SIZE, W } from '../config/map';
import { SETTLEMENT_LOOK as S } from '../config/visuals';
import { ctx, renderView } from '../core/view';
import { state } from '../core/game';
import { terrainType } from '../map/terrain';

const sprite = (w, h, paint) => { const s = document.createElement('canvas'); s.width = w; s.height = h; paint(s.getContext('2d')); return s; };
const poly = (c, pts, fill, line, lw = 1.3) => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fillStyle = fill; c.fill(); if (line) { c.strokeStyle = line; c.lineWidth = lw; c.stroke(); } };
const ell = (c, x, y, rx, ry, fill, line, lw = 1) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); if (line) { c.strokeStyle = line; c.lineWidth = lw; c.stroke(); } };
const seg = (c, pts, color, lw) => { c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); };
const shadow = (c, x, y, rx, ry) => ell(c, x, y, rx, ry, '#1a2a1c55');

// ---- sprites ----
// Thatched hut: timber walls, a straw roof with ridge and eaves; variant 1 has a lean-to annex.
const hut = v => sprite(96, 80, c => {
  shadow(c, 48, 72, 40, 8);
  if (v) { poly(c, [62, 70, 88, 70, 88, 52, 62, 52], '#9b7448', '#3d2a18'); poly(c, [58, 54, 92, 54, 86, 42, 64, 42], '#c79a4e', '#5c4220'); }
  poly(c, [16, 72, 66, 72, 66, 44, 16, 44], '#b48756', '#3d2a18', 1.5);
  for (const x of [24, 34, 44, 54]) seg(c, [x, 46, x, 70], '#8a643c', 1);
  poly(c, [35, 72, 46, 72, 46, 56, 35, 56], '#4a3220', '#2a1c10');
  poly(c, [21, 58, 29, 58, 29, 51, 21, 51], '#3a2a1a', '#2a1c10'); seg(c, [25, 51, 25, 58], '#8a643c', 1);
  const g = c.createLinearGradient(0, 14, 0, 50); g.addColorStop(0, '#e8c46e'); g.addColorStop(1, '#a87a34');
  poly(c, [8, 50, 74, 50, 58, 16, 24, 16], g, '#5c4220', 1.6);
  for (let i = 0; i < 12; i++) { const x = 12 + i * 5.5; seg(c, [x, 49, x + (x < 41 ? 6 : -6) * .9, 19], '#b98c45', 1); }
  seg(c, [22, 17, 60, 17], '#7a5a2a', 3); seg(c, [8, 50, 74, 50], '#7a5a2a', 2);
});
const logPile = () => sprite(84, 56, c => {
  shadow(c, 42, 48, 36, 7);
  const ends = [[18, 44], [32, 44], [46, 44], [60, 44], [25, 32], [39, 32], [53, 32], [32, 20], [46, 20]];
  poly(c, [12, 50, 70, 50, 66, 14, 16, 14], '#8a5f36', '#3d2a18'); // side of the stack
  for (const [x, y] of ends) { ell(c, x + 8, y, 8, 7.5, '#c99a62', '#4a321c', 1.2); ell(c, x + 8, y, 4.5, 4, '#b07f4a'); ell(c, x + 8, y, 1.5, 1.4, '#8a5f36'); }
  seg(c, [6, 52, 6, 12], '#6b4a2b', 2.5); seg(c, [78, 52, 78, 12], '#6b4a2b', 2.5); // posts
  seg(c, [72, 10, 82, 4], '#7a5532', 2.4); poly(c, [78, 2, 84, 8, 88, 0], '#a9b3b8', '#3b4246'); // axe
});
const stonePile = () => sprite(84, 60, c => {
  shadow(c, 42, 52, 36, 7);
  const blocks = [[10, 38, 22, 14], [32, 38, 22, 14], [54, 38, 20, 14], [18, 24, 22, 14], [40, 24, 22, 14], [28, 10, 22, 14]];
  for (const [x, y, w, h] of blocks) { poly(c, [x, y + h, x + w, y + h, x + w, y, x, y], '#a7a497', '#4a4840', 1.3); poly(c, [x, y, x + w, y, x + w - 3, y - 4, x + 3, y - 4], '#d1cdbf', '#4a4840', 1); }
  seg(c, [74, 54, 80, 20], '#6b4a2b', 2.4); poly(c, [74, 20, 86, 22, 80, 14], '#9aa3a8', '#3b4246'); // pickaxe
});
const goldHeap = () => sprite(84, 60, c => {
  shadow(c, 40, 52, 34, 7);
  const g = c.createRadialGradient(36, 30, 4, 38, 40, 34); g.addColorStop(0, '#fff0a0'); g.addColorStop(.5, '#f2c24a'); g.addColorStop(1, '#b07e22');
  c.beginPath(); c.moveTo(8, 52); c.quadraticCurveTo(20, 18, 38, 16); c.quadraticCurveTo(58, 18, 68, 52); c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = '#7a5418'; c.lineWidth = 1.4; c.stroke();
  for (let i = 0; i < 9; i++) ell(c, 18 + (i * 13) % 44, 30 + (i * 7) % 18, 2.4, 1.8, '#fff6c4');
  poly(c, [62, 54, 82, 54, 82, 38, 62, 38], '#8a5f36', '#3d2a18'); seg(c, [62, 46, 82, 46], '#5d4128', 1.2); // crate
});
// Rice paddies lying flat: green and gold plots in furrows inside earth banks.
const paddy = v => sprite(120, 72, c => {
  const plots = [[4, 4, 54, 30], [62, 4, 54, 30], [4, 38, 54, 30], [62, 38, 54, 30]];
  plots.forEach(([x, y, w, h], i) => {
    poly(c, [x, y, x + w, y, x + w, y + h, x, y + h], (i + v) % 3 ? '#8fbf4f' : '#d8c25a', '#8a6a3c', 2.2);
    for (let k = 4; k < h; k += 4) seg(c, [x + 2, y + k, x + w - 2, y + k], (i + v) % 3 ? '#6f9e3c' : '#b9a043', 1);
  });
});
// Wooden watchtower: four splayed legs with cross braces, a railed platform and a small hipped roof.
const watchtower = () => sprite(64, 120, c => {
  shadow(c, 32, 114, 22, 5);
  for (const [a, b] of [[14, 24], [50, 40]]) seg(c, [a, 114, b, 44], '#6b4a2b', 3.4);
  for (const [a, b] of [[22, 26], [42, 38]]) seg(c, [a, 114, b, 44], '#5a3d22', 2.6);
  seg(c, [17, 100, 47, 70], '#7a5532', 1.6); seg(c, [47, 100, 17, 70], '#7a5532', 1.6); seg(c, [20, 78, 44, 78], '#7a5532', 1.8);
  poly(c, [12, 46, 52, 46, 52, 40, 12, 40], '#8a6440', '#3d2a18'); // platform
  for (const x of [14, 24, 34, 44, 50]) seg(c, [x, 40, x, 30], '#6b4a2b', 1.6); seg(c, [12, 30, 52, 30], '#6b4a2b', 2);
  seg(c, [16, 28, 16, 16], '#5a3d22', 1.8); seg(c, [48, 28, 48, 16], '#5a3d22', 1.8);
  poly(c, [6, 18, 58, 18, 32, 2], '#3f5f8a', '#22344a', 1.4); poly(c, [32, 2, 58, 18, 32, 18], '#2f4a6e');
});
// Three-tier pagoda on a stone plinth, roofs curling at the eaves.
const pagoda = () => sprite(96, 150, c => {
  shadow(c, 48, 144, 38, 7);
  poly(c, [16, 146, 80, 146, 76, 132, 20, 132], '#9d978a', '#4a463d', 1.4);
  const tiers = [[24, 72, 132, 104], [28, 68, 100, 74], [32, 64, 70, 46]];
  for (const [l, r, bottom, top] of tiers) {
    poly(c, [l, bottom, r, bottom, r, top + 12, l, top + 12], '#a8433a', '#4a1e18', 1.2);
    for (let x = l + 6; x < r - 2; x += 8) seg(c, [x, bottom - 2, x, top + 16], '#7a2e26', 1);
    poly(c, [l - 14, top + 14, r + 14, top + 14, r + 4, top + 2, l - 4, top + 2], '#34495e', '#1c2833', 1.4);
    seg(c, [l - 14, top + 14, l - 18, top + 8], '#1c2833', 2); seg(c, [r + 14, top + 14, r + 18, top + 8], '#1c2833', 2);
  }
  poly(c, [38, 48, 58, 48, 48, 30], '#34495e', '#1c2833'); seg(c, [48, 30, 48, 12], '#c9a14a', 2.2); ell(c, 48, 12, 2.6, 2.6, '#f2c64e');
});
const cloud = sprite(256, 128, c => {
  for (const [x, y, r, a] of [[60, 78, 46, .9], [110, 58, 56, 1], [168, 70, 50, .95], [210, 86, 36, .9], [130, 92, 52, 1], [80, 98, 38, .9]]) {
    const g = c.createRadialGradient(x, y - r * .3, r * .2, x, y, r); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(.7, 'rgba(244,246,250,.85)'); g.addColorStop(1, 'rgba(230,236,244,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
});
const SPRITES = { hut: [hut(0), hut(1)], logPile: [logPile()], stonePile: [stonePile()], goldHeap: [goldHeap()], paddy: [paddy(0), paddy(1)], watchtower: [watchtower()], pagoda: [pagoda()] };
// World size at scale 1 [w, h]; props stand on (x, y), paddies lie flat centred on it.
const SIZE = { hut: [134, 112], logPile: [100, 68], stonePile: [100, 72], goldHeap: [98, 70], paddy: [230, 138], watchtower: [80, 150], pagoda: [160, 250] };
export const FLAT_SETTLEMENT = new Set(['paddy']);
export function settlementSprite(item) {
  const list = SPRITES[item.kind]; if (!list) return null;
  const s = item.scale || 1, [w, h] = SIZE[item.kind], img = list[(item.variant || 0) % list.length];
  return FLAT_SETTLEMENT.has(item.kind) ? { img, x: item.x - w * s / 2, y: item.y - h * s / 2, w: w * s, h: h * s } : { img, x: item.x - w * s / 2, y: item.y - h * s * .94, w: w * s, h: h * s };
}

// ---- hamlets, towers, pagodas ----
// `place(x, y, gap)` is true where a prop may stand (open ground, away from fortresses, flags, camps and other
// scenery); `add(list, item)` stores it; `rand(seed)` is the decor hash noise.
export function buildSettlements({ place, add, trees, ground, rand }) {
  const T = TILE_SIZE, mines = state.mines || [];
  const RES_PROP = { wood: 'logPile', stone: 'stonePile', gold: 'goldHeap' };
  mines.forEach((m, mi) => {
    // 3–4 huts on a ring around the mine, then S.hamletProps resource props (rice paddies, flat, for food).
    const start = rand(7000 + mi) * Math.PI * 2, huts = 3 + (rand(7100 + mi) < .5 ? 1 : 0);
    let placed = 0;
    for (let k = 0; k < 18 && placed < huts; k++) {
      const a = start + k * .75, r = S.hamletRadius[0] + rand(7200 + mi * 17 + k) * (S.hamletRadius[1] - S.hamletRadius[0]), x = m.x + Math.cos(a) * r, y = m.y + Math.sin(a) * r * .8;
      if (!place(x, y, S.hutGap)) continue;
      add(trees, { x, y, scale: .8 + rand(7300 + mi * 13 + k) * .25, variant: (mi + k) % 2, kind: 'hut' }); placed++;
    }
    const prop = RES_PROP[m.resource];
    for (let k = 0, props = 0; k < 14 && props < S.hamletProps; k++) {
      const a = start + Math.PI + k * .7, r = S.hamletRadius[0] + 20 + k * 6, x = m.x + Math.cos(a) * r, y = m.y + Math.sin(a) * r * .8;
      if (prop ? !place(x, y, S.propGap) : !place(x, y, S.paddyGap)) continue;
      if (prop) add(trees, { x, y, scale: .9, variant: 0, kind: prop });
      else add(ground, { x, y, scale: .85 + rand(7400 + mi + k) * .3, variant: (mi + k) % 2, kind: 'paddy' });
      props++;
    }
  });
  // A watchtower by each flag, outside the capture ring, above or beside it (the flag's label sits below).
  (state.regions || []).forEach(r => {
    if (!r.cp) return;
    for (let k = 0; k < 8; k++) {
      const a = -Math.PI * (.08 + ((rand(7500 + r.id) + k * .37) % 1) * .84), x = r.cp.x + Math.cos(a) * S.towerRadius, y = r.cp.y + Math.sin(a) * S.towerRadius * .8;
      if (place(x, y, S.towerGap)) { add(trees, { x, y, scale: 1, variant: 0, kind: 'watchtower' }); break; }
    }
  });
  // Pagodas crown the deepest rock: tiles whose 7×7 neighbourhood is nearly all rock, far apart.
  const deep = [];
  for (let gy = 4; gy < MAP_TILES - 4; gy += 2) for (let gx = 4; gx < MAP_TILES - 4; gx += 2) {
    if (terrainType[gy * MAP_TILES + gx] !== 3) continue;
    let n = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (terrainType[(gy + dy) * MAP_TILES + gx + dx] === 3) n++;
    if (n >= 44) deep.push({ x: (gx + .5) * T, y: (gy + .5) * T, s: n + rand(gy * MAP_TILES + gx) });
  }
  deep.sort((a, b) => b.s - a.s);
  const pagodas = [];
  for (const p of deep) { if (pagodas.length >= S.pagodas) break; if (pagodas.every(q => Math.hypot(q.x - p.x, q.y - p.y) > S.pagodaSpacing)) { pagodas.push(p); add(trees, { x: p.x, y: p.y, scale: 1, variant: 0, kind: 'pagoda' }); } }
}

// ---- clouds ----
// Puffs along the map edges and heavier banks at the corners, fading in as the camera zooms out (invisible at the normal
// playing zoom, so they never hide units).
const cloudSpots = [];
{
  const h = i => { const v = Math.sin(i * 91.7 + 13.1) * 43758.5453; return v - Math.floor(v); };
  // Heavy banks at the four corners (several overlapping puffs), then a few loose puffs along each edge, mostly outside.
  [[0, 0], [W, 0], [0, H], [W, H]].forEach(([cx, cy], k) => {
    for (let i = 0; i < 5; i++) { const a = h(k * 10 + i) * Math.PI * 2, r = 120 + h(k * 10 + i + 5) * 420; cloudSpots.push({ x: cx + Math.cos(a) * r * (cx ? -1 : 1) * .6, y: cy + Math.sin(a) * r * .5 * (cy ? -1 : 1), s: 3.2 + h(k * 10 + i + 7) * 2.6 }); }
  });
  for (let i = 0; i < 16; i++) {
    const side = i % 4, t = .15 + h(i + 40) * .7, out = 40 + h(i + 60) * 120, s = 1.8 + h(i + 80) * 1.8;
    cloudSpots.push(side === 0 ? { x: t * W, y: -out, s } : side === 1 ? { x: t * W, y: H + out, s } : side === 2 ? { x: -out, y: t * H, s } : { x: W + out, y: t * H, s });
  }
}
export function drawMapClouds() {
  const scale = renderView.scale || 1, a = Math.max(0, Math.min(1, (S.cloudFadeScale - scale) / S.cloudFadeRange));
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a * S.cloudAlpha;
  for (const c of cloudSpots) ctx.drawImage(cloud, c.x - 128 * c.s, c.y - 64 * c.s, 256 * c.s, 128 * c.s);
  ctx.restore();
}
