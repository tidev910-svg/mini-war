// @ts-nocheck
// Scenery of the "Ngũ Vực" map (docs/features/realms-map.md, rendering.md): each realm's own props, drawn in code once
// into small sprites like the trees and rocks of render/terrain.ts. Display only — props never block units or buildings,
// and they are placed with the same deterministic rules on host and guest (buildWorldDecor()).
import { H, MAP_TILES, TILE_SIZE, W } from '../config/map';
import { REALM_LAYOUT as L } from '../config/maps';
import { REALM_PEAKS } from '../config/visuals';
import { REALM_INDEX } from '../map/realms';
import { tileRealm } from '../map/terrain';

const sprite = (w, h, paint) => { const s = document.createElement('canvas'); s.width = w; s.height = h; paint(s.getContext('2d')); return s; };
const shadow = (c, x, y, rx, ry, a = '50') => { c.fillStyle = '#17251d' + a; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
const blob = (c, x, y, rx, ry, fill, stroke, lw = 1.2) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); } };
const stroke = (c, pts, color, lw) => { c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); };
const fillPoly = (c, pts, fill, line, lw = 1.3) => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fillStyle = fill; c.fill(); if (line) { c.strokeStyle = line; c.lineWidth = lw; c.stroke(); } };

// ---- plains ----
const haystack = v => sprite(80, 64, c => {
  shadow(c, 40, 56, 32, 7);
  const g = c.createLinearGradient(20, 10, 60, 58); g.addColorStop(0, '#f4dc8a'); g.addColorStop(.55, '#d9b558'); g.addColorStop(1, '#a8823a');
  c.beginPath(); c.moveTo(10, 56); c.quadraticCurveTo(12, 14 + v * 4, 40, 10 + v * 3); c.quadraticCurveTo(68, 14 + v * 4, 70, 56); c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = '#7b5d2a'; c.lineWidth = 1.5; c.stroke();
  for (let i = 0; i < 14; i++) { const x = 16 + i * 3.6, t = 22 + (i * 7) % 20; stroke(c, [x, 54, x + (i % 3 - 1) * 2, t], i % 2 ? '#f7e6a6' : '#b8913f', 1); }
  stroke(c, [14, 40, 66, 40], '#8a6a30', 1.6); // binding rope
});
const scarecrow = () => sprite(56, 92, c => {
  shadow(c, 28, 86, 16, 4);
  stroke(c, [28, 86, 28, 22], '#6b4a2b', 3.2); stroke(c, [8, 40, 48, 40], '#6b4a2b', 2.6);
  fillPoly(c, [16, 38, 40, 38, 37, 62, 19, 62], '#7c3b2e', '#3f241a'); // shirt
  for (const sx of [8, 48]) { stroke(c, [sx, 40, sx + (sx < 28 ? -3 : 3), 46], '#e8cf7c', 1.4); stroke(c, [sx, 40, sx + (sx < 28 ? -1 : 1), 47], '#d7b55e', 1.2); }
  blob(c, 28, 28, 7.5, 8, '#e9d9a6', '#6f5a33');
  fillPoly(c, [14, 24, 42, 24, 35, 20, 31, 9, 25, 9, 21, 20], '#b98a3e', '#5e4420'); // straw hat
  blob(c, 25.5, 29, 1.2, 1.2, '#2d2318'); blob(c, 30.5, 29, 1.2, 1.2, '#2d2318');
});
const wheat = v => sprite(40, 44, c => {
  shadow(c, 20, 40, 14, 3, '30');
  for (let i = 0; i < 7; i++) {
    const x = 7 + i * 4.3, h = 22 + ((i * 11 + v * 5) % 12), lean = ((i * 3 + v) % 5 - 2) * 1.6;
    stroke(c, [x, 40, x + lean, 40 - h], '#b4a24f', 1.2);
    for (let k = 0; k < 4; k++) blob(c, x + lean + (k % 2 ? 1.6 : -1.6), 40 - h + 2 + k * 3, 1.5, 2.4, k % 2 ? '#f2d070' : '#dcb24f');
  }
});
const flowers = v => sprite(56, 28, c => {
  const cols = v ? ['#f6c6dc', '#fff3b0', '#ffffff'] : ['#c9a4f2', '#fff3b0', '#f7a7a7'];
  for (let i = 0; i < 14; i++) { const x = 6 + (i * 17) % 44, y = 6 + (i * 11) % 16; blob(c, x, y + 1.5, 3, 1.5, '#4f8a3e70'); blob(c, x, y, 2.2, 1.6, cols[i % 3]); blob(c, x, y, .8, .8, '#e0a83a'); }
});

// ---- forest ----
const fern = v => sprite(56, 40, c => {
  shadow(c, 28, 36, 20, 4, '40');
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (1.08 + i * .14) + v * .05, len = 18 + (i % 3) * 4, ex = 28 + Math.cos(a) * len, ey = 34 + Math.sin(a) * len * .8;
    stroke(c, [28, 34, ex, ey], '#2f6a34', 1.4);
    for (let k = 1; k < 6; k++) { const t = k / 6, px = 28 + (ex - 28) * t, py = 34 + (ey - 34) * t; blob(c, px, py - 1, 3.2 * (1 - t * .5), 1.4, i % 2 ? '#5e9e4a' : '#4c8a3f'); }
  }
});
const mushrooms = v => sprite(44, 36, c => {
  shadow(c, 22, 31, 16, 3.5, '40');
  const caps = v ? ['#b9452f', '#c9573c', '#a83a28'] : ['#a07a4e', '#b58b5a', '#8c6a42'];
  for (const [x, h, r, k] of [[14, 12, 7, 0], [25, 17, 9, 1], [33, 9, 5.5, 2]]) {
    stroke(c, [x, 31, x, 31 - h], '#efe5cf', 3.2);
    c.beginPath(); c.ellipse(x, 31 - h, r, r * .62, 0, Math.PI, 0); c.closePath(); c.fillStyle = caps[k]; c.fill(); c.strokeStyle = '#4a2a1c'; c.lineWidth = 1; c.stroke();
    if (v) for (let d = 0; d < 3; d++) blob(c, x - r * .5 + d * r * .5, 31 - h - r * .3 + (d % 2), 1.1, .9, '#fff4e0');
  }
});
const log = v => sprite(96, 40, c => {
  shadow(c, 48, 32, 42, 6);
  const g = c.createLinearGradient(0, 12, 0, 32); g.addColorStop(0, '#8a6440'); g.addColorStop(1, '#4e3520');
  c.save(); c.translate(48, 22); c.rotate(v ? -.08 : .06);
  c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(-38, -8, 72, 16, 8) : c.rect(-38, -8, 72, 16); c.fill(); c.strokeStyle = '#3a2716'; c.lineWidth = 1.3; c.stroke();
  for (let i = 0; i < 5; i++) stroke(c, [-30 + i * 14, -6, -24 + i * 14, 5], '#5d4128', 1);
  blob(c, 36, 0, 5, 8, '#c49a62', '#3a2716'); blob(c, 36, 0, 2.5, 4.5, '#a07a48');
  for (let i = 0; i < 6; i++) blob(c, -28 + i * 11, -7 + (i % 2), 5, 2.4, '#6f9a48'); // moss
  c.restore();
});

// ---- mountain ----
const deadTree = v => sprite(72, 100, c => {
  shadow(c, 36, 94, 20, 4.5);
  const col = '#6e6357', dark = '#4b433b';
  fillPoly(c, [31, 94, 33, 52, 39, 52, 42, 94], col, dark);
  const branch = (x, y, a, len, w, depth) => { const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len; stroke(c, [x, y, ex, ey], depth ? col : dark, w); if (depth < 2) { branch(ex, ey, a - .45 - v * .1, len * .62, w * .62, depth + 1); branch(ex, ey, a + .4, len * .58, w * .6, depth + 1); } };
  branch(36, 56, -Math.PI / 2 - .35, 22, 4.2, 0); branch(36, 60, -Math.PI / 2 + .45, 20, 3.6, 0); branch(36, 54, -Math.PI / 2, 26, 3.8, 0);
});
const cairn = v => sprite(48, 60, c => {
  shadow(c, 24, 55, 17, 4);
  const stones = [[24, 48, 15, 7], [23, 38, 12, 6], [25, 29, 9, 5], [24, 21, 6.5, 4], ...(v ? [[23, 14, 4.5, 3]] : [])];
  stones.forEach(([x, y, rx, ry], i) => { blob(c, x, y, rx, ry, i % 2 ? '#a39e90' : '#8d887b', '#3f3d36'); blob(c, x - rx * .3, y - ry * .35, rx * .45, ry * .35, '#d2ccbb'); });
});

// ---- gold hills ----
const goldOre = v => sprite(72, 52, c => {
  shadow(c, 36, 45, 28, 6);
  const sets = v ? [[28, 32, 30, 26], [50, 36, 18, 16]] : [[36, 30, 34, 28]];
  for (const [cx, cy, w, h] of sets) {
    fillPoly(c, [cx - w * .5, cy + h * .3, cx - w * .38, cy - h * .3, cx - w * .05, cy - h * .5, cx + w * .32, cy - h * .36, cx + w * .5, cy + h * .08, cx + w * .38, cy + h * .45, cx - w * .2, cy + h * .5], '#8f8a7c', '#3a3730', 1.4);
    stroke(c, [cx - w * .3, cy - h * .1, cx - w * .05, cy + h * .05, cx + w * .2, cy - h * .2], '#f2c64e', 2.4); // gold vein
    stroke(c, [cx - w * .1, cy + h * .3, cx + w * .15, cy + h * .18], '#e0aa36', 2);
    for (let i = 0; i < 3; i++) blob(c, cx - w * .2 + i * w * .2, cy - h * .05 + (i % 2) * 4, 2, 1.6, '#ffe58a');
  }
});
const mineCart = () => sprite(80, 56, c => {
  shadow(c, 40, 50, 32, 5);
  stroke(c, [4, 48, 76, 44], '#5b4a38', 2.4); stroke(c, [6, 52, 78, 48], '#5b4a38', 2.4); // a stub of rails
  fillPoly(c, [18, 22, 62, 22, 58, 42, 22, 42], '#6b4a2e', '#2f2014', 1.6);
  stroke(c, [18, 30, 62, 30], '#4a3220', 1.2);
  for (const x of [26, 40, 52]) blob(c, x, 20, 6, 4, '#e9b94a', '#8a6420');
  for (const x of [27, 53]) { blob(c, x, 44, 5, 5, '#3a3028', '#1c1610'); blob(c, x, 44, 1.6, 1.6, '#8a7b66'); }
  stroke(c, [62, 18, 72, 6], '#7a5532', 2.2); fillPoly(c, [66, 6, 78, 9, 72, 3], '#9aa3a8', '#3b4246'); // pickaxe
});

// ---- abyss ----
const crystal = v => sprite(64, 80, c => {
  const glow = c.createRadialGradient(32, 52, 2, 32, 52, 32); glow.addColorStop(0, '#ffe08a66'); glow.addColorStop(1, '#ffe08a00'); c.fillStyle = glow; c.fillRect(0, 20, 64, 60);
  shadow(c, 32, 72, 22, 5);
  const shards = [[32, 72, 34, 9, 0], [22, 72, 22, 7, -.32], [42, 72, 26, 7, .28], ...(v ? [[14, 72, 13, 5, -.6], [50, 72, 15, 5, .55]] : [])];
  for (const [x, y, h, w, a] of shards) {
    c.save(); c.translate(x, y); c.rotate(a);
    fillPoly(c, [-w, 0, -w * .8, -h * .72, 0, -h, w * .8, -h * .72, w, 0], '#f1c24d', '#7a5718', 1.2);
    fillPoly(c, [0, 0, 0, -h, w * .8, -h * .72, w, 0], '#c8932e'); stroke(c, [-w * .35, -h * .1, -w * .25, -h * .7], '#fff2b8', 1.4);
    c.restore();
  }
});
const pillar = v => sprite(56, 104, c => {
  shadow(c, 28, 98, 22, 5);
  fillPoly(c, [10, 98, 46, 98, 44, 90, 12, 90], '#a9a293', '#4a463d');
  const top = v ? 46 : 26, g = c.createLinearGradient(15, 0, 41, 0); g.addColorStop(0, '#cfc7b4'); g.addColorStop(.5, '#a59d8a'); g.addColorStop(1, '#6e685b');
  fillPoly(c, [15, 90, 41, 90, 40, top + 4, 33, top, 27, top + 6, 21, top + 1, 16, top + 5], g, '#4a463d');
  for (const x of [21, 28, 35]) stroke(c, [x, 88, x, top + 10], '#7f786a', 1.1);
  if (!v) { fillPoly(c, [2, 98, 18, 92, 22, 98], '#b3ab98', '#4a463d'); blob(c, 46, 95, 6, 3, '#8f8877', '#4a463d'); } // fallen chunk
  stroke(c, [18, 70, 23, 60, 20, 52], '#5e7b44', 1.6); // ivy
});
const rune = v => sprite(72, 40, c => {
  c.strokeStyle = v ? '#ffd76acc' : '#c99bffbb'; c.lineWidth = 2.4; c.beginPath(); c.ellipse(36, 20, 30, 15, 0, 0, Math.PI * 2); c.stroke();
  c.lineWidth = 1.2; c.beginPath(); c.ellipse(36, 20, 22, 11, 0, 0, Math.PI * 2); c.stroke();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = 36 + Math.cos(a) * 26, y = 20 + Math.sin(a) * 13; stroke(c, [x - 2, y - 2, x + 2, y + 2, x - 2, y + 2], c.strokeStyle, 1.2); }
});

// ---- passes ----
// A stone waymarker with a burning brazier at the mouth of every pass through a ridge, so the ways across read at a glance.
const marker = () => sprite(40, 84, c => {
  shadow(c, 20, 78, 13, 3.5);
  fillPoly(c, [12, 78, 28, 78, 26, 34, 14, 34], '#9a9484', '#3f3c34', 1.4);
  fillPoly(c, [9, 34, 31, 34, 27, 26, 13, 26], '#6b6558', '#3f3c34', 1.2);
  const g = c.createRadialGradient(20, 18, 1, 20, 18, 14); g.addColorStop(0, '#ffd27a'); g.addColorStop(.5, '#ff8a3a99'); g.addColorStop(1, '#ff8a3a00'); c.fillStyle = g; c.fillRect(4, 2, 32, 30);
  fillPoly(c, [15, 26, 20, 8, 25, 26], '#ffb347'); fillPoly(c, [17.5, 26, 20, 15, 22.5, 26], '#fff0b0');
});

const SPRITES = {
  haystack: [haystack(0), haystack(1)], scarecrow: [scarecrow()], wheat: [wheat(0), wheat(1)], flowers: [flowers(0), flowers(1)],
  fern: [fern(0), fern(1)], mushrooms: [mushrooms(0), mushrooms(1)], log: [log(0), log(1)],
  deadTree: [deadTree(0), deadTree(1)], cairn: [cairn(0), cairn(1)],
  goldOre: [goldOre(0), goldOre(1)], mineCart: [mineCart()],
  crystal: [crystal(0), crystal(1)], pillar: [pillar(0), pillar(1)], rune: [rune(0), rune(1)], marker: [marker()],
};
// World size of each sprite at scale 1 and the share of its height below the anchor point (props stand on (x, y)).
const SIZE = {
  haystack: [78, 62], scarecrow: [40, 66], wheat: [36, 40], flowers: [64, 32], fern: [50, 36], mushrooms: [36, 30], log: [84, 35],
  deadTree: [68, 94], cairn: [36, 46], goldOre: [86, 62], mineCart: [84, 58], crystal: [64, 80], pillar: [52, 96], rune: [118, 66], marker: [32, 68],
};
// Flat props lie on the ground under every upright object (like lily pads).
export const FLAT_REALM_DECOR = new Set(['flowers', 'rune']);
export function realmDecorSprite(item) {
  const list = SPRITES[item.kind]; if (!list) return null;
  const s = item.scale || 1, [w, h] = SIZE[item.kind], img = list[(item.variant || 0) % list.length];
  return FLAT_REALM_DECOR.has(item.kind) ? { img, x: item.x - w * s / 2, y: item.y - h * s / 2, w: w * s, h: h * s } : { img, x: item.x - w * s / 2, y: item.y - h * s * .92, w: w * s, h: h * s };
}

// Density per prop (key = pass name; `kind` = sprite when it differs from the name): grid step in tiles, chance per cell, minimum gap to any scenery already placed (world units).
// `realm`: where it grows; `on`: terrain types it stands on (0 grass, 1 forest, 4 field); `list`: 'tree' (upright, depth-
// sorted) or 'ground' (flat).
export const REALM_DECOR_PASSES = {
  haystack: { realm: 'plains',   on: [0, 4], step: 5, chance: .09, gap: 120, list: 'tree', scale: [.75, .35] },
  scarecrow:{ realm: 'plains',   on: [4],    step: 7, chance: .1,  gap: 160, list: 'tree', scale: [.85, .25] },
  flowers:  { realm: 'plains',   on: [0],    step: 3, chance: .1,  gap: 50,  list: 'ground', scale: [.8, .5] },
  fern:     { realm: 'forest',   on: [1, 0], step: 2, chance: .1,  gap: 30,  list: 'tree', scale: [.75, .4] },
  mushrooms:{ realm: 'forest',   on: [1, 0], step: 3, chance: .06, gap: 40,  list: 'tree', scale: [.75, .45] },
  log:      { realm: 'forest',   on: [1, 0], step: 6, chance: .08, gap: 100, list: 'tree', scale: [.8, .3] },
  deadTree: { realm: 'mountain', on: [0],    step: 5, chance: .06, gap: 110, list: 'tree', scale: [.75, .4] },
  cairn:    { realm: 'mountain', on: [0],    step: 5, chance: .06, gap: 80,  list: 'tree', scale: [.75, .4] },
  hillGrass:{ realm: 'hills',    on: [4],    step: 2, chance: .12, gap: 40,  list: 'tree', scale: [.75, .35], kind: 'wheat' },
  goldOre:  { realm: 'hills',    on: [4, 0], step: 3, chance: .12, gap: 90,  list: 'tree', scale: [.7, .45] },
  mineCart: { realm: 'hills',    on: [0, 4], step: 8, chance: .15, gap: 200, list: 'tree', scale: [.8, .2] },
  crystal:  { realm: 'abyss',    on: [4, 0], step: 3, chance: .16, gap: 90,  list: 'tree', scale: [.7, .45] },
  pillar:   { realm: 'abyss',    on: [4, 0], step: 5, chance: .16, gap: 140, list: 'tree', scale: [.8, .3] },
  rune:     { realm: 'abyss',    on: [4, 0], step: 5, chance: .2,  gap: 140, list: 'ground', scale: [.9, .4] },
};
// Adds the realm props. `walk(step, salt, pick)` walks the tile grid like the other scenery passes; `ok(x, y, gap)` keeps
// props off fortresses, flags, mines and camps and away from other scenery; `add(list, item)` stores one.
export function placeRealmDecor({ walk, ok, free, add, typeAt, trees, ground, random }) {
  let salt = 2000000;
  for (const [name, p] of Object.entries(REALM_DECOR_PASSES)) {
    const kind = p.kind || name, realm = REALM_INDEX[p.realm], list = p.list === 'ground' ? ground : trees, variants = SPRITES[kind].length;
    walk(p.step, salt += 100000, (gx, gy, x, y, roll, seed) => {
      if (tileRealm[gy * MAP_TILES + gx] !== realm || !p.on.includes(typeAt(gx, gy)) || roll > p.chance || !ok(x, y, p.gap)) return;
      add(list, { x, y, scale: p.scale[0] + random(seed + 29) * p.scale[1], variant: Math.floor(random(seed + 31) * variants), kind });
    });
  }
  // Peaks along every short range (the obstacle 'peak' sprite, render/obstacles.ts): tallest at the middle of the range,
  // smaller toward its pointed ends, so each range reads as a row of high mountains.
  const T = TILE_SIZE, R = REALM_PEAKS, peaksAlong = (len, at) => {
    const n = Math.max(1, Math.round(len / R.spacing));
    for (let k = 0; k < n; k++) { const u = (k + .5) / n, p = at(u), v = Math.floor(random(p.x * .37 + p.y * .11) * 4); add(trees, { x: p.x, y: p.y, scale: R.scale[0] + Math.sin(Math.PI * u) * R.scale[1] + (random(p.y + k) - .5) * .12, variant: v, kind: 'peak' }); }
  };
  const pr = L.plainsRidge, pPeriod = pr.seg + pr.gap;
  for (let start = pr.gapAt + pr.gap / 2 - Math.ceil((pr.gapAt + pr.gap / 2) / pPeriod) * pPeriod; start < 1; start += pPeriod) {
    const y0 = Math.max(.02, start), y1 = Math.min(.98, start + pr.seg); if (y1 - y0 < pr.seg * .4) continue;
    for (const x of [L.plainsWidth * W, W - L.plainsWidth * W]) peaksAlong((y1 - y0) * H, u => ({ x, y: (y0 + (y1 - y0) * u) * H }));
  }
  const rr = L.ringRidge, ringN = Math.round(360 / (rr.seg + rr.gap)), rPeriod = 360 / ringN, r = L.ringRadius * W;
  for (let k = 0; k < ringN; k++) {
    const a0 = rr.gapAt + rr.gap / 2 + k * rPeriod;
    peaksAlong(rr.seg * Math.PI / 180 * r, u => { const a = (a0 + rr.seg * u) * Math.PI / 180; return { x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r }; });
  }
  // Waymarkers with braziers at the main gaps: the middle of each plains edge, and north and south through the gold hills.
  const put = (x, y) => { if (free(x, y, 40)) add(trees, { x, y, scale: 1, variant: 0, kind: 'marker' }); };
  for (const side of [-1, 1]) {
    const y = pr.gapAt * H + side * (pr.gap / 2 * H - T * 1.5);
    for (const x of [L.plainsWidth * W - T * 3.5, W - L.plainsWidth * W + T * 3.5]) put(x, y);
  }
  for (const deg of [rr.gapAt, rr.gapAt + 180]) for (const side of [-1, 1]) {
    const a = (deg + side * (rr.gap / 2 - 3)) * Math.PI / 180, rad = (L.ringRadius + .02) * W;
    put(W / 2 + Math.cos(a) * rad, H / 2 + Math.sin(a) * rad);
  }
}
