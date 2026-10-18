// @ts-nocheck
// Minimap in the bottom-left frame: terrain, territory colours, fog, flags, fortresses, units and the camera view (docs/features/minimap.md).
import { H, MAP_TILES, TILE_SIZE, W } from '../config/map';
import { FOG_RGB, FOG_MEMORY_ALPHA } from '../config/visuals';
import { VIEW_H, VIEW_W, camX, camY, zoom } from '../core/view';
import { localTeam, state } from '../core/game';
import { terrainCanvas } from '../map/terrain';
import { regionMap } from '../map/regions';
import { isTeamAreaExplored, teamCanSee } from '../sim/fog';
import { fogVisible } from './fog';
import { bridges } from '../map/paths';

// The tile layers (territory tint + fog) are rebuilt at most MINIMAP_LAYER_HZ times a second; markers and the view box every frame.
const MINIMAP_LAYER_HZ = 4, MINIMAP_TINT_ALPHA = 70;
const MINIMAP_COLORS = { 0: [74, 170, 255], 1: [255, 98, 107], flag: { '-1': '#f4ecd6', 0: '#4aaaff', 1: '#ff626b' } };
export const minimapCanvas = document.getElementById('minimap');
const mctx = minimapCanvas?.getContext('2d');
const layerCanvas = document.createElement('canvas'); layerCanvas.width = layerCanvas.height = MAP_TILES;
const layerCtx = layerCanvas.getContext('2d'), layerImage = layerCtx.createImageData(MAP_TILES, MAP_TILES);
let terrainSmall = null, layerBuiltAt = 0;

function buildTerrainSmall() {
  terrainSmall = document.createElement('canvas'); terrainSmall.width = terrainSmall.height = MAP_TILES;
  terrainSmall.getContext('2d').drawImage(terrainCanvas, 0, 0, MAP_TILES, MAP_TILES);
}
function buildLayer() {
  const team = localTeam(), seen = team === 0 ? state.fogSeen : state.enemyFogSeen, d = layerImage.data;
  for (let i = 0; i < MAP_TILES * MAP_TILES; i++) {
    const o = i * 4;
    if (!seen || !seen[i]) { d[o] = FOG_RGB[0]; d[o + 1] = FOG_RGB[1]; d[o + 2] = FOG_RGB[2]; d[o + 3] = 255; continue; }
    const owner = regionMap ? state.regions[regionMap[i]]?.owner : -1, c = MINIMAP_COLORS[owner];
    const dim = !fogVisible[i];
    if (c) { d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = dim ? MINIMAP_TINT_ALPHA + 40 : MINIMAP_TINT_ALPHA; }
    else if (dim) { d[o] = FOG_RGB[0]; d[o + 1] = FOG_RGB[1]; d[o + 2] = FOG_RGB[2]; d[o + 3] = FOG_MEMORY_ALPHA; }
    else d[o + 3] = 0;
  }
  layerCtx.putImageData(layerImage, 0, 0);
}
export function drawMinimap() {
  if (!mctx || !state) return;
  const now = performance.now(), size = minimapCanvas.width, sx = size / W, sy = minimapCanvas.height / H, team = localTeam();
  if (!terrainSmall) buildTerrainSmall();
  if (now - layerBuiltAt > 1000 / MINIMAP_LAYER_HZ) { layerBuiltAt = now; buildLayer(); }
  mctx.save();
  mctx.imageSmoothingEnabled = true;
  mctx.drawImage(terrainSmall, 0, 0, size, minimapCanvas.height);
  mctx.drawImage(layerCanvas, 0, 0, size, minimapCanvas.height);
  // Bridges as short brown bars over the river.
  mctx.fillStyle = '#9a6e40'; for (const b of bridges) mctx.fillRect(b.x0 * TILE_SIZE * sx, b.y0 * TILE_SIZE * sy, (b.x1 - b.x0 + 1) * TILE_SIZE * sx, Math.max(2, (b.y1 - b.y0 + 1) * TILE_SIZE * sy));
  const dot = (x, y, r, fill, stroke = '#0b1622') => { mctx.beginPath(); mctx.arc(x * sx, y * sy, r, 0, Math.PI * 2); mctx.fillStyle = fill; mctx.fill(); mctx.lineWidth = 1; mctx.strokeStyle = stroke; mctx.stroke(); };
  for (const r of state.regions) if (r.cp && isTeamAreaExplored(team, r.cp.x, r.cp.y)) dot(r.cp.x, r.cp.y, 3, MINIMAP_COLORS.flag[r.owner] || MINIMAP_COLORS.flag[-1]);
  for (const b of state.bases) {
    if (b.team !== team && !isTeamAreaExplored(team, b.x, b.y)) continue;
    const x = b.x * sx, y = b.y * sy; mctx.fillStyle = b.team === 0 ? '#4aaaff' : '#ff626b'; mctx.strokeStyle = '#ffe7a8'; mctx.lineWidth = 1.5;
    mctx.fillRect(x - 5, y - 5, 10, 10); mctx.strokeRect(x - 5, y - 5, 10, 10);
  }
  for (const u of state.units) {
    if (u.hp <= 0 || (u.team !== team && !teamCanSee(team, u.x, u.y))) continue;
    mctx.fillStyle = u.team === 0 ? '#9fd6ff' : '#ffb0b5'; mctx.fillRect(u.x * sx - 1.5, u.y * sy - 1.5, 3, 3);
  }
  // Camera view box (the whole map when zoomed out past it).
  const vw = Math.min(W, VIEW_W / zoom), vh = Math.min(H, VIEW_H / zoom);
  mctx.strokeStyle = '#ffe7a8'; mctx.lineWidth = 1.5; mctx.strokeRect(camX * sx, camY * sy, vw * sx, vh * sy);
  mctx.restore();
}
// World point under a pointer event on the minimap.
export function minimapToWorld(e) {
  const rect = minimapCanvas.getBoundingClientRect();
  return { x: Math.max(0, Math.min(W, (e.clientX - rect.left) / rect.width * W)), y: Math.max(0, Math.min(H, (e.clientY - rect.top) / rect.height * H)) };
}
