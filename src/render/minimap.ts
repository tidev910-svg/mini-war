// @ts-nocheck
// Minimap in the bottom-left frame: terrain, territory colours, fog, explored mines and bridges, flags, buildings,
// units and the camera view (docs/features/minimap.md). Colours come from the design tokens (config/theme.ts):
// the local side's things in its faction colour, enemies seen right now in --danger.
import { CREEP_COLORS } from '../config/visuals';
import { CAMP_TYPES } from '../config/creeps';
import { campKnownState } from '../sim/creeps';
import { ghostBuildings, knownRegionOwner } from './intel';
import { H, MAP_TILES, TILE_SIZE, W } from '../config/map';
import { FOG_RGB, FOG_MEMORY_ALPHA } from '../config/visuals';
import { TEAM_COLORS, THEME, hexRgb } from '../config/theme';
import { VIEW_H, VIEW_W, camX, camY, zoom } from '../core/view';
import { localTeam, state } from '../core/game';
import { terrainCanvas } from '../map/terrain';
import { regionMap } from '../map/regions';
import { isTeamAreaExplored, teamCanSee } from '../sim/fog';
import { fogVisible } from './fog';
import { bridges } from '../map/paths';

// The tile layers (territory tint + fog) are rebuilt at most MINIMAP_LAYER_HZ times a second; markers and the view box every frame.
const MINIMAP_LAYER_HZ = 4, MINIMAP_TINT_ALPHA = 70;
const TINT = { 0: hexRgb(TEAM_COLORS[0].light), 1: hexRgb(TEAM_COLORS[1].light) };
// Mine markers differ by shape as well as colour: food ●, wood ▲, stone ■, gold ◆.
const MINE_MARK = { food: 'circle', wood: 'triangle', stone: 'square', gold: 'diamond' };
const MINE_COLOR = { food: THEME.resource, wood: THEME.success, stone: THEME['text-sub'], gold: THEME.resource };
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
    const owner = regionMap ? knownRegionOwner(state.regions[regionMap[i]]) : -1, c = TINT[owner];
    const dim = !fogVisible[i];
    if (c) { d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = dim ? MINIMAP_TINT_ALPHA + 40 : MINIMAP_TINT_ALPHA; }
    else if (dim) { d[o] = FOG_RGB[0]; d[o + 1] = FOG_RGB[1]; d[o + 2] = FOG_RGB[2]; d[o + 3] = FOG_MEMORY_ALPHA; }
    else d[o + 3] = 0;
  }
  layerCtx.putImageData(layerImage, 0, 0);
}
function mark(shape, x, y, r, fill) {
  mctx.beginPath();
  if (shape === 'circle') mctx.arc(x, y, r, 0, Math.PI * 2);
  else if (shape === 'triangle') { mctx.moveTo(x, y - r * 1.15); mctx.lineTo(x + r, y + r * .8); mctx.lineTo(x - r, y + r * .8); mctx.closePath(); }
  else if (shape === 'diamond') { mctx.moveTo(x, y - r * 1.2); mctx.lineTo(x + r, y); mctx.lineTo(x, y + r * 1.2); mctx.lineTo(x - r, y); mctx.closePath(); }
  else mctx.rect(x - r * .85, y - r * .85, r * 1.7, r * 1.7);
  mctx.fillStyle = fill; mctx.fill(); mctx.lineWidth = 1; mctx.strokeStyle = THEME['text-on-map-stroke']; mctx.stroke();
}
export function drawMinimap() {
  if (!mctx || !state) return;
  const now = performance.now(), size = minimapCanvas.width, sx = size / W, sy = minimapCanvas.height / H, team = localTeam();
  const own = TEAM_COLORS[team].light, ownSolid = TEAM_COLORS[team].primary, foe = THEME.danger;
  const explored = (x, y) => isTeamAreaExplored(team, x, y);
  if (!terrainSmall) buildTerrainSmall();
  if (now - layerBuiltAt > 1000 / MINIMAP_LAYER_HZ) { layerBuiltAt = now; buildLayer(); }
  mctx.save();
  mctx.imageSmoothingEnabled = true;
  mctx.drawImage(terrainSmall, 0, 0, size, minimapCanvas.height);
  mctx.drawImage(layerCanvas, 0, 0, size, minimapCanvas.height);
  // Bridges the side has explored: a plank across the river with a dark outline.
  mctx.fillStyle = THEME['gold-muted']; mctx.strokeStyle = THEME['text-on-map-stroke']; mctx.lineWidth = 1;
  for (const b of bridges) {
    const x = b.x0 * TILE_SIZE, y = b.y0 * TILE_SIZE, w = (b.x1 - b.x0 + 1) * TILE_SIZE, h = (b.y1 - b.y0 + 1) * TILE_SIZE;
    if (!explored(x + w / 2, y + h / 2)) continue;
    mctx.fillRect(x * sx, y * sy, w * sx, Math.max(3, h * sy)); mctx.strokeRect(x * sx, y * sy, w * sx, Math.max(3, h * sy));
  }
  // Mines the side has explored, by resource shape.
  for (const m of state.mines) if (explored(m.x, m.y)) mark(MINE_MARK[m.resource] || 'square', m.x * sx, m.y * sy, 2.6, MINE_COLOR[m.resource] || THEME['text-sub']);
  // Flags: a small pennant in the owner's colour (pale for neutral).
  for (const r of state.regions) {
    if (!r.cp || !explored(r.cp.x, r.cp.y)) continue;
    const x = r.cp.x * sx, y = r.cp.y * sy;
    mctx.strokeStyle = THEME['text-on-map-stroke']; mctx.lineWidth = 1.5; mctx.beginPath(); mctx.moveTo(x, y + 3); mctx.lineTo(x, y - 6); mctx.stroke();
    mctx.beginPath(); mctx.moveTo(x, y - 6); mctx.lineTo(x + 6, y - 4); mctx.lineTo(x, y - 2); mctx.closePath();
    const owner = knownRegionOwner(r); mctx.fillStyle = owner >= 0 ? TEAM_COLORS[owner].light : THEME['text-main']; mctx.fill(); mctx.lineWidth = 1; mctx.stroke();
  }
  // Buildings: own always, enemy while seen or as last seen (render/intel.ts).
  for (const b of [...state.buildings, ...ghostBuildings()]) {
    const mine = b.team === team; if (!mine && !teamCanSee(team, b.x, b.y) && !ghostBuildings().includes(b)) continue;
    mctx.fillStyle = mine ? own : foe; mctx.fillRect(b.x * sx - 2.5, b.y * sy - 2.5, 5, 5);
  }
  // Fortresses (the enemy's once explored): a framed square.
  for (const b of state.bases) {
    if (b.team !== team && !explored(b.x, b.y)) continue;
    const x = b.x * sx, y = b.y * sy; mctx.fillStyle = b.team === team ? ownSolid : foe; mctx.strokeStyle = THEME.gold; mctx.lineWidth = 1.5;
    mctx.fillRect(x - 5, y - 5, 10, 10); mctx.strokeRect(x - 5, y - 5, 10, 10);
  }
  // Neutral camps the side knows of: an amber diamond, grey once cleared (neutral-camps.md).
  for (const c of state.camps || []) {
    const known = campKnownState(c, team); if (known == null || (!explored(c.x, c.y) && !CAMP_TYPES[c.kind].opensAt)) continue;
    mark('diamond', c.x * sx, c.y * sy, c.kind === 'tomb' ? 4.5 : 3.2, known === 'alive' ? CREEP_COLORS.minimap : CREEP_COLORS.minimapDim);
  }
  for (const u of state.units) {
    if (u.hp <= 0) continue;
    const mine = u.team === team; if (!mine && !teamCanSee(team, u.x, u.y)) continue;
    mctx.fillStyle = mine ? own : foe; mctx.fillRect(u.x * sx - 1.5, u.y * sy - 1.5, 3, 3);
  }
  // Camera view box (the whole map when zoomed out past it).
  const vw = Math.min(W, VIEW_W / zoom), vh = Math.min(H, VIEW_H / zoom);
  mctx.strokeStyle = THEME['text-main']; mctx.lineWidth = 1.5; mctx.strokeRect(camX * sx, camY * sy, vw * sx, vh * sy);
  mctx.restore();
}
// World point under a pointer event on the minimap.
export function minimapToWorld(e) {
  const rect = minimapCanvas.getBoundingClientRect();
  return { x: Math.max(0, Math.min(W, (e.clientX - rect.left) / rect.width * W)), y: Math.max(0, Math.min(H, (e.clientY - rect.top) / rect.height * H)) };
}
