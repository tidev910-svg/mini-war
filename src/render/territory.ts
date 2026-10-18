// @ts-nocheck
// Territory tint and glowing borders (docs/features/territory.md).
import { ctx, zoom } from '../core/view';
import { H, MAP_TILES, TILE_SIZE, W } from '../config/map';
import { localTeam, state } from '../core/game';
import { TERRITORY_BORDER_PX, TERRITORY_COLORS, TERRITORY_GLOW, TERRITORY_GLOW_PX } from '../config/visuals';
import { regionEdges, regionMap, regionTintKey, setRegionTintKey } from '../map/regions';
import { showTerritory } from '../ui/hud';
import { fogMask, fogVisible } from './fog';
import { terrainType } from '../map/terrain';

export const regionTintCanvas=document.createElement('canvas');
regionTintCanvas.width=MAP_TILES;
regionTintCanvas.height=MAP_TILES;
export const regionTintCtx=regionTintCanvas.getContext('2d');
// Translucent owner colours per tile, redrawn only when ownership changes.
export function refreshRegionTint(){
 const key=state.regions.map(r=>r.owner).join('');if(key===regionTintKey||!regionMap)return;setRegionTintKey(key);
 const img=regionTintCtx.createImageData(MAP_TILES,MAP_TILES),colors={0:[74,170,255],1:[255,98,107]};
 for(let i=0;i<regionMap.length;i++){const r=state.regions[regionMap[i]];const c=r&&colors[r.owner];if(!c)continue;img.data[i*4]=c[0];img.data[i*4+1]=c[1];img.data[i*4+2]=c[2];img.data[i*4+3]=34;}
 regionTintCtx.putImageData(img,0,0);
}
// layer 'under' (before units): tint plus the borders away from the fog edge, so borders never cover units.
// layer 'over' (after drawFog): border segments that touch the fog's soft edge (fogMask) or ground not seen right now
// (fogVisible), which the veil would hide or dim. Nothing hidden is drawn there, so these never cover visible units.
export function drawTerritory(viewLeft,viewTop,viewRight,viewBottom,layer='under'){
 const T=TILE_SIZE,fog=localTeam()===0?state.fogSeen:state.enemyFogSeen,over=layer==='over';
 if(!regionMap||!showTerritory)return;
 ctx.save();if(!over){refreshRegionTint();ctx.drawImage(regionTintCanvas,0,0,W,H);}
 const x1=viewLeft/T-1,x2=viewRight/T+1,y1=viewTop/T-1,y2=viewBottom/T+1;
 // Widths are in screen pixels (divided by zoom) so borders stay equally thick at every zoom level.
 // Every boundary of an owned region is drawn once: a solid line in the colour of the side that owns either region (the
 // local side's colour between a blue and a red region), over a faint glow and a thin dark edge for light ground.
 const buckets={0:[],1:[]},me=localTeam();
 for(const e of regionEdges){
  if(e[2]<x1||e[0]>x2||e[3]<y1||e[1]>y2)continue;if(!fog[e[6]]&&!fog[e[7]])continue;if((fogMask[e[6]]||fogMask[e[7]]||!fogVisible[e[6]]||!fogVisible[e[7]]?1:0)!==(over?1:0))continue;
  // Rivers and lakes already separate regions: skip borders on or along water. Between two neutral regions nothing is drawn.
  if(terrainType[e[6]]===2||terrainType[e[7]]===2)continue;
  const a=state.regions[e[4]]?.owner??-1,b=state.regions[e[5]]?.owner??-1;
  if(a<0&&b<0)continue;
  buckets[a>=0&&b>=0&&a!==b?me:a>=0?a:b].push(e);
 }
 ctx.lineCap='round';ctx.lineJoin='round';
 for(const key of [0,1]){
  const edges=buckets[key];if(!edges.length)continue;
  const px=TERRITORY_BORDER_PX.owned;
  ctx.beginPath();for(const e of edges){ctx.moveTo(e[0]*T,e[1]*T);ctx.lineTo(e[2]*T,e[3]*T);}
  ctx.strokeStyle=TERRITORY_GLOW[key];ctx.lineWidth=(px+2*TERRITORY_GLOW_PX)/zoom;ctx.stroke();
  ctx.strokeStyle='#0f1a1459';ctx.lineWidth=(px+1.5)/zoom;ctx.stroke();
  ctx.strokeStyle=TERRITORY_COLORS[key];ctx.lineWidth=px/zoom;ctx.stroke();
 }
 ctx.restore();
}
