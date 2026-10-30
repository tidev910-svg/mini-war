// @ts-nocheck
// Territory tint and glowing borders (docs/features/territory.md).
import { knownRegionOwner } from './intel';
import { ctx, zoom } from '../core/view';
import { H, MAP_TILES, TILE_SIZE, W } from '../config/map';
import { localTeam, state } from '../core/game';
import { NEUTRAL_BORDER, TERRITORY_BORDER_PX, TERRITORY_COLORS, TERRITORY_GLOW, TERRITORY_GLOW_PX } from '../config/visuals';
import { MAP_UI, TEAM_COLORS, THEME, hexA, hexRgb } from '../config/theme';
import { regionEdges, regionMap, regionTintKey, setRegionTintKey } from '../map/regions';
import { showTerritory } from '../ui/hud';
import { fogMask, fogVisible } from './fog';
import { terrainType } from '../map/terrain';

export const regionTintCanvas=document.createElement('canvas');
regionTintCanvas.width=MAP_TILES;
regionTintCanvas.height=MAP_TILES;
export const regionTintCtx=regionTintCanvas.getContext('2d');
// Translucent owner colours per tile (as the local side knows them, render/intel.ts), redrawn only when that changes.
export function refreshRegionTint(){
 const key=state.regions.map(knownRegionOwner).join(',');if(key===regionTintKey||!regionMap)return;setRegionTintKey(key);
 const img=regionTintCtx.createImageData(MAP_TILES,MAP_TILES),colors={0:hexRgb(TEAM_COLORS[0].light),1:hexRgb(TEAM_COLORS[1].light)};
 for(let i=0;i<regionMap.length;i++){const r=state.regions[regionMap[i]];const c=r&&colors[knownRegionOwner(r)];if(!c)continue;img.data[i*4]=c[0];img.data[i*4+1]=c[1];img.data[i*4+2]=c[2];img.data[i*4+3]=34;}
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
 const buckets={0:[],1:[],neutral:[]},me=localTeam();
 for(const e of regionEdges){
  if(e[2]<x1||e[0]>x2||e[3]<y1||e[1]>y2)continue;if(!fog[e[6]]&&!fog[e[7]])continue;if((fogMask[e[6]]||fogMask[e[7]]||!fogVisible[e[6]]||!fogVisible[e[7]]?1:0)!==(over?1:0))continue;
  // Rivers and lakes already separate regions: skip borders on or along water. Between two neutral regions: a thin dashed
  // line (NEUTRAL_BORDER), like the borders of a painted campaign map.
  if(terrainType[e[6]]===2||terrainType[e[7]]===2)continue;
  const a=knownRegionOwner(state.regions[e[4]]),b=knownRegionOwner(state.regions[e[5]]);
  if(a<0&&b<0){buckets.neutral.push(e);continue;}
  buckets[a>=0&&b>=0&&a!==b?me:a>=0?a:b].push(e);
 }
 ctx.lineCap='round';ctx.lineJoin='round';
 if(buckets.neutral.length){
  ctx.beginPath();for(const line of borderLines(buckets.neutral))traceSmooth(line,T);
  ctx.setLineDash(NEUTRAL_BORDER.dash.map(d=>d/zoom));ctx.strokeStyle=NEUTRAL_BORDER.color;ctx.lineWidth=NEUTRAL_BORDER.px/zoom;ctx.stroke();ctx.setLineDash([]);
 }
 for(const key of [0,1]){
  const edges=buckets[key];if(!edges.length)continue;
  const px=TERRITORY_BORDER_PX.owned;
  ctx.beginPath();for(const line of borderLines(edges))traceSmooth(line,T);
  ctx.strokeStyle=TERRITORY_GLOW[key];ctx.lineWidth=(px+2*TERRITORY_GLOW_PX)/zoom;ctx.stroke();
  ctx.strokeStyle=hexA(THEME['text-on-map-stroke'],.35);ctx.lineWidth=(px+1.5)/zoom;ctx.stroke();
  ctx.strokeStyle=TERRITORY_COLORS[key];ctx.lineWidth=px/zoom;ctx.stroke();
 }
 ctx.restore();
}

// Border edges are one-tile grid segments, which read as stair steps. Link them into polylines (each walk stops at a
// junction or a dead end, so endpoints stay exact and neighbouring lines still meet)…
function borderLines(edges){
 const at=new Map(),key=(x,y)=>x*8192+y,used=new Uint8Array(edges.length),lines=[];
 edges.forEach((e,i)=>{for(const k of [key(e[0],e[1]),key(e[2],e[3])]){const list=at.get(k);if(list)list.push(i);else at.set(k,[i]);}});
 const walk=(line,x,y)=>{for(;;){const list=at.get(key(x,y));if(!list||list.length!==2)return;const i=list.find(j=>!used[j]);if(i===undefined)return;used[i]=1;const e=edges[i];[x,y]=e[0]===x&&e[1]===y?[e[2],e[3]]:[e[0],e[1]];line.push(x,y);}};
 for(let i=0;i<edges.length;i++){
  if(used[i])continue;used[i]=1;const e=edges[i];
  const fwd=[e[0],e[1],e[2],e[3]];walk(fwd,e[2],e[3]);
  const back=[];walk(back,e[0],e[1]);
  const line=[];for(let k=back.length-2;k>=0;k-=2)line.push(back[k],back[k+1]);line.push(...fwd);lines.push(line);
 }
 return lines;
}
// …then keep every MAP_UI.borderSmoothTiles-th vertex and round the corners with quadratic curves through midpoints.
function traceSmooth(line,T){
 const step=MAP_UI.borderSmoothTiles,n=line.length/2,pts=[];
 for(let k=0;k<n;k+=step)pts.push(line[k*2]*T,line[k*2+1]*T);
 if((n-1)%step)pts.push(line[(n-1)*2]*T,line[(n-1)*2+1]*T);
 const m=pts.length/2;ctx.moveTo(pts[0],pts[1]);
 if(m<3){ctx.lineTo(pts[2],pts[3]);return;}
 for(let k=1;k<m-1;k++)ctx.quadraticCurveTo(pts[k*2],pts[k*2+1],(pts[k*2]+pts[k*2+2])/2,(pts[k*2+1]+pts[k*2+3])/2);
 ctx.lineTo(pts[(m-1)*2],pts[(m-1)*2+1]);
}
