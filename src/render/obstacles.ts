// @ts-nocheck
// Impassable ground drawn so it reads as impassable — and the farmland, drawn the same crisp way as rice paddies (docs/features/rendering.md, "Vật cản"): rock becomes cliffs with a
// crisp outline, a shaded south face and stone texture, water is redrawn crisply inside its true shore with a sandy bank
// and a foam line, and mountain peaks stand on the
// widest rock massifs. The ground under it is the blurred terrain canvas, whose soft edges hid where units can and cannot
// walk. Display only — passability is still terrainType / walkable (map/paths.ts); the crisp edges follow those tiles.
import { MAP_TILES, TILE_SIZE, W, H } from '../config/map';
import { OBSTACLE_LOOK as O } from '../config/visuals';
import { ctx, renderView } from '../core/view';
import { terrainType, terrainVersion, tileRealm } from '../map/terrain';
import { bridgeTiles } from '../map/paths';

const N = MAP_TILES, T = TILE_SIZE;
const hash = (x, y) => { const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); };

// Outlines of every patch of one tile type as closed loops (world units): the tile edges between that type and anything
// else, oriented clockwise around the patch and chained end to end (every corner has as many edges in as out, so each
// chain closes), then rounded by corner cutting. `test(i)` says whether tile i belongs to the patches.
function loopsOf(test, passes = O.smoothPasses) {
  const is = (x, y) => x >= 0 && y >= 0 && x < N && y < N && test(y * N + x);
  const out = new Map(), key = (x, y) => x * 4096 + y;
  const edge = (ax, ay, bx, by) => { const k = key(ax, ay), e = { ax, ay, bx, by, used: false }, l = out.get(k); if (l) l.push(e); else out.set(k, [e]); };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!is(x, y)) continue;
    if (!is(x, y - 1)) edge(x, y, x + 1, y);
    if (!is(x + 1, y)) edge(x + 1, y, x + 1, y + 1);
    if (!is(x, y + 1)) edge(x + 1, y + 1, x, y + 1);
    if (!is(x - 1, y)) edge(x, y + 1, x, y);
  }
  const loops = [];
  for (const list of out.values()) for (const first of list) {
    if (first.used) continue;
    const pts = []; let e = first;
    while (e && !e.used) { e.used = true; pts.push(e.ax, e.ay); e = (out.get(key(e.bx, e.by)) || []).find(n => !n.used); }
    if (pts.length < 6) continue;
    // Keep only the corners (drop the middle points of straight runs), then cut corners so stair steps become curves.
    let p = [];
    for (let i = 0, n = pts.length; i < n; i += 2) {
      const ax = pts[(i - 2 + n) % n], ay = pts[(i - 1 + n) % n], bx = pts[i], by = pts[i + 1], cx = pts[(i + 2) % n], cy = pts[(i + 3) % n];
      if ((bx - ax) * (cy - by) - (by - ay) * (cx - bx) !== 0) p.push(bx, by);
    }
    for (let it = 0; it < passes; it++) {
      const q = [], n = p.length;
      for (let i = 0; i < n; i += 2) { const ax = p[i], ay = p[i + 1], bx = p[(i + 2) % n], by = p[(i + 3) % n]; q.push(ax * .75 + bx * .25, ay * .75 + by * .25, ax * .25 + bx * .75, ay * .25 + by * .75); }
      p = q;
    }
    const path = new Path2D(); let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < p.length; i += 2) {
      // A little hash wobble so long straight cliffs do not look ruled.
      const x = (p[i] + (hash(p[i] * 3.1, p[i + 1]) - .5) * O.edgeNoise) * T, y = (p[i + 1] + (hash(p[i + 1] * 1.7, p[i]) - .5) * O.edgeNoise) * T;
      if (i) path.lineTo(x, y); else path.moveTo(x, y);
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    path.closePath();
    loops.push({ path, minX, minY, maxX, maxY });
  }
  return loops;
}
// Stone texture for the top of the rock: blotches in the rock palette, strata bands and hairline cracks.
const stone = (() => {
  const s = document.createElement('canvas'); s.width = s.height = 96; const c = s.getContext('2d');
  c.fillStyle = O.rockTop[0]; c.fillRect(0, 0, 96, 96);
  for (let i = 0; i < 70; i++) { c.fillStyle = O.rockTop[i % O.rockTop.length]; c.beginPath(); c.ellipse(hash(i, 1) * 96, hash(i, 2) * 96, 6 + hash(i, 3) * 12, 3 + hash(i, 4) * 6, hash(i, 5) * 3, 0, Math.PI * 2); c.fill(); }
  c.strokeStyle = O.strata; c.lineWidth = 1.4; for (const y of [18, 47, 78]) { c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(30, y - 5, 60, y + 6, 96, y); c.stroke(); }
  c.strokeStyle = O.crack; c.lineWidth = 1; for (let i = 0; i < 6; i++) { const x = hash(i, 9) * 96, y = hash(i, 10) * 96; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6, y + 5); c.lineTo(x + 4, y + 11); c.stroke(); }
  return s;
})();
// Water surface: the water colour with soft ripple strokes.
const ripples = (() => {
  const s = document.createElement('canvas'); s.width = s.height = 128; const c = s.getContext('2d');
  c.fillStyle = O.water; c.fillRect(0, 0, 128, 128); c.strokeStyle = O.ripple; c.lineWidth = 1.6; c.lineCap = 'round';
  for (let i = 0; i < 14; i++) { const x = hash(i, 21) * 128, y = hash(i, 22) * 128, w = 10 + hash(i, 23) * 18; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 3, x + w, y); c.stroke(); }
  return s;
})();
// Rice paddies: plots of young green, ripe gold and flooded rice inside earth banks, rows running a different way in
// each plot, a sky glint on the flooded ones.
const paddies = (() => {
  const S = 320, s = document.createElement('canvas'); s.width = S; s.height = S * .75; const c = s.getContext('2d');
  c.fillStyle = O.fieldBank; c.fillRect(0, 0, S, S * .75);
  // Plots: split the tile again and again at uneven points (deterministic), so sizes vary and no checkerboard shows.
  // Cuts stay on whole pixels and the split keeps each plot at least 34 px, so the pattern tiles without seams.
  const plots = [], split = (x, y, w, h, d) => {
    const k = plots.length + d * 7 + x * .13 + y * .07;
    if (d >= 4 || (w < 80 && h < 70) || (d >= 2 && hash(k, 5) < .25)) { plots.push([x, y, w, h]); return; }
    if (w / h > hash(k, 6) * .8 + .8) { const cut = Math.round(w * (.35 + hash(k, 7) * .3)); split(x, y, cut, h, d + 1); split(x + cut, y, w - cut, h, d + 1); }
    else { const cut = Math.round(h * (.35 + hash(k, 8) * .3)); split(x, y, w, cut, d + 1); split(x, y + cut, w, h - cut, d + 1); }
  };
  split(0, 0, S, S * .75, 0);
  plots.forEach(([x, y, w, h], k) => {
    const roll = hash(k, 11), col = roll < O.fieldWaterShare ? O.fieldWater : roll < O.fieldWaterShare + O.fieldGoldShare ? O.fieldGold : O.fieldPlots[Math.floor(hash(k, 12) * O.fieldPlots.length)];
    const flooded = col === O.fieldWater, b = O.fieldBankPx;
    c.fillStyle = col; c.fillRect(x + b, y + b, w - 2 * b, h - 2 * b);
    c.strokeStyle = flooded ? '#2f6f7a38' : '#3f5a202a'; c.lineWidth = 1.2; c.beginPath();
    if (w > h) for (let yy = y + b + 4; yy < y + h - b; yy += 5) { c.moveTo(x + b + 1, yy); c.lineTo(x + w - b - 1, yy); }
    else for (let xx = x + b + 4; xx < x + w - b; xx += 5) { c.moveTo(xx, y + b + 1); c.lineTo(xx, y + h - b - 1); }
    c.stroke();
    if (flooded) { c.fillStyle = '#ffffff50'; c.fillRect(x + b + 6, y + b + 5, w * .45, 2); c.fillRect(x + w * .4, y + h * .55, w * .3, 1.6); for (let i = 0; i < 16; i++) { c.fillStyle = '#5f9a3e'; c.fillRect(x + b + 4 + (i * 13) % Math.max(1, w - 2 * b - 8), y + b + 4 + (i * 7) % Math.max(1, h - 2 * b - 8), 1.6, 3); } }
    c.fillStyle = '#ffffff1e'; c.fillRect(x + b, y + b, w - 2 * b, 1.4); // light catching the top of each bank
  });
  return s;
})();
let fieldLoops = [], rockLoops = [], waterLoops = [], loopsVersion = -1, layer = null, layerVersion = -1;
function ensureLoops() {
  if (loopsVersion === terrainVersion) return;
  // Water includes the tiles under bridges, so the shore runs on beneath the deck (bridges are drawn later, on top).
  loopsVersion = terrainVersion;
  rockLoops = loopsOf(i => terrainType[i] === 3); waterLoops = loopsOf(i => terrainType[i] === 2, O.waterSmoothPasses);
  // Farmland: field tiles, except the golden ground of the gold hills and abyss on the "Ngũ Vực" map (tileRealm > 0).
  fieldLoops = loopsOf(i => terrainType[i] === 4 && tileRealm[i] <= 0);
}
// Rock: the shape again cliffHeight lower in the cliff colours, then the stone top over it (so a band shows only along
// south faces), a light rim and a dark outline at the cliff foot. Water: a foam line along the shore.
function paint(c, loops, water, fields) {
  c.save(); c.lineJoin = 'round';
  if (fields.length) {
    // Rice paddies: a grassy rim and an earth bank round the whole field, then the plots.
    c.strokeStyle = O.fieldRim; c.lineWidth = O.fieldBankWidth + 6; for (const l of fields) c.stroke(l.path);
    c.strokeStyle = O.fieldBank; c.lineWidth = O.fieldBankWidth; for (const l of fields) c.stroke(l.path);
    const plots = c.createPattern(paddies, 'repeat'); plots.setTransform?.(new DOMMatrix().rotate(O.fieldAngle).scale(O.fieldScale)); // turned a little off the tile grid
    c.fillStyle = plots; for (const l of fields) c.fill(l.path, 'evenodd');
  }
  if (water.length) {
    // A sandy bank outside the shore (half of the stroke; the water covers the inner half), then the water itself,
    // so the blurred ground under it no longer smears water over walkable land; then the foam line on the shore.
    c.strokeStyle = O.bank; c.lineWidth = O.bankWidth; for (const l of water) c.stroke(l.path);
    const surface = c.createPattern(ripples, 'repeat'); surface.setTransform?.(new DOMMatrix().scale(O.rippleScale));
    c.fillStyle = surface; for (const l of water) c.fill(l.path, 'evenodd');
    c.strokeStyle = O.foam; c.lineWidth = O.foamWidth; for (const l of water) c.stroke(l.path);
  }
  if (loops.length) {
    const pattern = c.createPattern(stone, 'repeat'); pattern.setTransform?.(new DOMMatrix().scale(O.stoneScale));
    c.save(); c.translate(0, O.cliffHeight); c.fillStyle = O.cliffFace; for (const l of loops) c.fill(l.path, 'evenodd'); c.strokeStyle = O.rockOutline; c.lineWidth = O.outlineWidth; for (const l of loops) c.stroke(l.path); c.restore();
    c.save(); c.translate(0, O.cliffHeight * .45); c.fillStyle = O.cliffLight; for (const l of loops) c.fill(l.path, 'evenodd'); c.restore();
    c.fillStyle = pattern; for (const l of loops) c.fill(l.path, 'evenodd');
    c.strokeStyle = O.rockRim; c.lineWidth = O.rimWidth; for (const l of loops) c.stroke(l.path);
  }
  c.restore();
}
// Drawn right after the ground (before roads, scenery and units). Close up: the loops crossing the view, as vectors (crisp
// at any zoom). Zoomed out below O.layerScale: one pre-rendered map-sized image.
export function drawObstacles(left = 0, top = 0, right = W, bottom = H) {
  ensureLoops();
  if ((renderView.scale || 1) < O.layerScale) {
    if (!layer || layerVersion !== terrainVersion) {
      layerVersion = terrainVersion; layer ??= document.createElement('canvas'); layer.width = layer.height = Math.round(W * O.layerRes);
      const c = layer.getContext('2d'); c.clearRect(0, 0, layer.width, layer.height); c.save(); c.scale(O.layerRes, O.layerRes); paint(c, rockLoops, waterLoops, fieldLoops); c.restore();
    }
    ctx.drawImage(layer, 0, 0, W, H); return;
  }
  const pad = O.cliffHeight + 20, seen = l => l.maxX >= left - pad && l.minX <= right + pad && l.maxY >= top - pad && l.minY <= bottom + pad;
  paint(ctx, rockLoops.filter(seen), waterLoops.filter(seen), fieldLoops.filter(seen));
}

// ---- mountain peaks ----
// Painted mountains, lit from the upper left: each sprite is a small massif of 2–3 peaks, the ones behind paler and bluer
// (aerial perspective). A peak is a jagged silhouette split by its spine into a warm lit face and a cool shadow face, with
// gullies, ledges, a snow cap whose ragged lower edge runs down the gullies, and a scree skirt that fades into the rock
// plateau it stands on. PEAK_W × PEAK_H px; four variants so a range never repeats the same shape side by side.
const PEAK_W = 320, PEAK_H = 250, PEAK_BASE = 236;
const mix = (a, b, t) => '#' + [0, 2, 4].map(i => Math.round(parseInt(a.slice(1 + i, 3 + i), 16) * (1 - t) + parseInt(b.slice(1 + i, 3 + i), 16) * t).toString(16).padStart(2, '0')).join('');
// One peak: centre cx, foot half-width hw, height h, summit offset off (share of hw), seed for its jags, haze 0..1.
function paintPeak(c, cx, hw, h, off, seed, haze) {
  const r = k => hash(seed * 13.7 + k, seed * 3.1 + k * .7), base = PEAK_BASE, sx = cx + off * hw, sy = base - h;
  const tint = col => mix(col, '#b9c6d6', haze * .55);
  // Silhouette: left foot → summit → right foot, each slope broken into jagged steps (steeper near the top).
  const slope = (fromX, toX, dir) => { const pts = [], n = 7; for (let i = 1; i < n; i++) { const t = i / n, y = base - h * Math.pow(t, 1.3), j = (r(i * dir + 3) - .5) * h * .09 * (1 - t * .5); pts.push(fromX + (toX - fromX) * t + j * dir, y + (r(i * dir + 9) - .5) * h * .05); } return pts; };
  const left = [[cx - hw, base], ...slope(cx - hw, sx, 1).reduce((o, v, i, arr) => i % 2 ? o : [...o, [arr[i], arr[i + 1]]], [])];
  const rightUp = slope(cx + hw, sx, -1).reduce((o, v, i, arr) => i % 2 ? o : [...o, [arr[i], arr[i + 1]]], []);
  const outline = [...left, [sx, sy], ...rightUp.reverse(), [cx + hw, base]];
  // Spine: from the summit down to the foot, zigzagging a little right of centre; it splits the lit and shaded faces.
  const spine = [[sx, sy]]; for (let i = 1; i <= 5; i++) { const t = i / 5; spine.push([sx + (cx + hw * .18 - sx) * t + (r(40 + i) - .5) * hw * .16, sy + h * t]); }
  const path = pts => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) c.lineTo(q[0], q[1]); c.closePath(); };
  const litFace = [...left, ...spine], shadeFace = [...spine, [cx + hw, base], ...rightUp.slice().reverse()];
  // Faces: warm lit stone and cool violet shade, each darker toward the foot.
  let g = c.createLinearGradient(0, sy, 0, base); g.addColorStop(0, tint('#f0dfb8')); g.addColorStop(.5, tint('#c9ad7e')); g.addColorStop(1, tint('#8f7656'));
  path(litFace); c.fillStyle = g; c.fill();
  g = c.createLinearGradient(0, sy, 0, base); g.addColorStop(0, tint('#7e7a98')); g.addColorStop(.6, tint('#55516c')); g.addColorStop(1, tint('#3d3a4f'));
  path(shadeFace); c.fillStyle = g; c.fill();
  // Gullies and ledges, clipped to the mountain.
  c.save(); path(outline); c.clip();
  for (let i = 0; i < 9; i++) {
    const t = .18 + r(60 + i) * .7, lit = r(70 + i) < .55, x0 = lit ? cx - hw * (.15 + r(80 + i) * .55) : cx + hw * (.25 + r(80 + i) * .5), y0 = base - h * (1 - t);
    c.strokeStyle = lit ? tint('#7d7362') + 'b0' : tint('#3a3744') + 'c0'; c.lineWidth = 1.6 + r(90 + i) * 1.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + (lit ? -8 : 8), y0 + h * .12, x0 + (lit ? -4 : 12), y0 + h * .28); c.stroke();
    if (lit) { c.strokeStyle = tint('#f1e9d6') + '90'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0 + 3, y0 + 2); c.lineTo(x0 + 14, y0 + 4); c.stroke(); }
  }
  // Snow cap: everything above a ragged snowline that dips down the gullies; lit snow white, shaded snow blue-grey.
  const snowY = sy + h * (.17 + r(5) * .07), snow = [[cx - hw - 4, sy - 4], [cx + hw + 4, sy - 4]];
  for (let i = 0; i <= 12; i++) { const t = 1 - i / 12, x = cx - hw + 2 * hw * t, dip = (i % 2 ? h * (.04 + r(100 + i) * .1) : -h * .02) * (1 - Math.abs(x - sx) / hw * .6); snow.push([x, snowY + dip - Math.abs(x - sx) / hw * h * .12]); }
  path(snow); c.save(); c.clip();
  path(litFace); c.fillStyle = tint('#fbfaf4'); c.fill();
  path(shadeFace); c.fillStyle = tint('#c3cddd'); c.fill();
  c.restore();
  // Scree skirt: the foot fades into the plateau colour.
  g = c.createLinearGradient(0, base - h * .16, 0, base); g.addColorStop(0, 'rgba(120,108,92,0)'); g.addColorStop(1, 'rgba(120,108,92,.75)');
  c.fillStyle = g; c.fillRect(cx - hw - 2, base - h * .16, hw * 2 + 4, h * .16);
  c.restore();
  // Rim light on the lit ridge and a dark line down the shaded edge.
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = tint('#fff8e8') + 'c0'; c.lineWidth = 2; c.beginPath(); c.moveTo(left[Math.floor(left.length / 2)][0], left[Math.floor(left.length / 2)][1]); for (const q of left.slice(Math.floor(left.length / 2) + 1)) c.lineTo(q[0], q[1]); c.lineTo(sx, sy); c.stroke();
  c.strokeStyle = tint('#2f2c38') + 'a0'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(sx, sy); for (const q of rightUp) c.lineTo(q[0], q[1]); c.stroke(); // rightUp runs summit → foot here (reversed above)
  // Dark outline round the whole silhouette, like the other sprites, so the massif stands clear of the plateau.
  path(outline); c.strokeStyle = tint('#2c2826'); c.lineWidth = 1.8; c.stroke();
}
// Peaks of each variant, back to front: [centre x, foot half-width, height, summit offset, haze].
const PEAK_LAYOUTS = [
  [[92, 92, 112, -.12, .55], [226, 96, 122, .1, .45], [158, 140, 176, .02, 0]],
  [[226, 90, 110, .18, .5], [112, 120, 150, -.06, .2], [204, 100, 118, .1, .05]],
  [[162, 150, 186, .04, 0], [64, 70, 84, -.2, .1], [262, 66, 80, .22, .1]],
  [[116, 104, 132, .14, .45], [206, 132, 172, -.08, .05], [66, 66, 80, .1, .1]],
];
const peakSprite = v => {
  const s = document.createElement('canvas'); s.width = PEAK_W; s.height = PEAK_H; const c = s.getContext('2d');
  const sh = c.createRadialGradient(PEAK_W / 2, PEAK_BASE + 2, 10, PEAK_W / 2, PEAK_BASE + 2, PEAK_W * .48); sh.addColorStop(0, '#1b241e66'); sh.addColorStop(1, '#1b241e00');
  c.fillStyle = sh; c.beginPath(); c.ellipse(PEAK_W / 2, PEAK_BASE + 2, PEAK_W * .48, 16, 0, 0, Math.PI * 2); c.fill();
  PEAK_LAYOUTS[v].forEach(([cx, hw, h, off, haze], k) => paintPeak(c, cx, hw, h, off, v * 10 + k + 1, haze));
  // A few boulders at the foot, in front of the massif.
  for (let i = 0; i < 5; i++) { const x = 40 + hash(v, i) * 240, y = PEAK_BASE - 2 + hash(i, v) * 6, rr = 4 + hash(v + i, 3) * 6; c.fillStyle = '#8f8775'; c.beginPath(); c.ellipse(x, y, rr * 1.4, rr, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#c9bfa8'; c.beginPath(); c.ellipse(x - rr * .3, y - rr * .35, rr * .6, rr * .35, 0, 0, Math.PI * 2); c.fill(); }
  return s;
};
const PEAKS = PEAK_LAYOUTS.map((_, v) => peakSprite(v));
// World size: O.peakWorld[0] × O.peakWorld[1] at scale 1 (× O.peakScale), standing on its foot (PEAK_BASE).
export function obstacleDecorSprite(item) {
  if (item.kind !== 'peak') return null;
  const s = (item.scale || 1) * O.peakScale, w = O.peakWorld[0] * s, h = O.peakWorld[1] * s;
  return { img: PEAKS[(item.variant || 0) % PEAKS.length], x: item.x - w / 2, y: item.y - h * PEAK_BASE / PEAK_H, w, h };
}
// Peaks on rock tiles deep inside a massif (at least O.peakDepth of the 9×9 tiles around are rock), spaced O.peakGap apart.
export function placePeaks({ add, list, rand, free }) {
  const T = TILE_SIZE, R = 4, spots = [];
  for (let gy = R; gy < N - R; gy += 2) for (let gx = R; gx < N - R; gx += 2) {
    if (terrainType[gy * N + gx] !== 3) continue;
    let n = 0; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (terrainType[(gy + dy) * N + gx + dx] === 3) n++;
    if (n / 81 >= O.peakDepth) spots.push({ x: (gx + .5) * T, y: (gy + .5) * T, s: n + rand(gy * N + gx) * 4 });
  }
  spots.sort((a, b) => b.s - a.s);
  for (const p of spots) if (free(p.x, p.y, O.peakGap)) add(list, { x: p.x, y: p.y, scale: .85 + rand(p.x + p.y) * .3, variant: Math.floor(rand(p.x * 3) * 4), kind: 'peak' });
}
