// @ts-nocheck
// Fog veil: opaque unexplored, thin veil over unseen explored ground (docs/features/fog-of-war.md).
import { ctx } from '../core/view';
import { H, MAP_TILES, W } from '../config/map';
import { localTeam } from '../core/game';
import { teamVisibleTiles } from '../sim/fog';
import { FOG_BLUR_SCALE, FOG_EDGE_TILES, FOG_MEMORY_ALPHA, FOG_PAD, FOG_RGB } from '../config/visuals';

export const fogCanvas=document.createElement('canvas');
fogCanvas.width=fogCanvas.height=MAP_TILES+FOG_PAD*2;
export const fogCtx=fogCanvas.getContext('2d'),fogImage=fogCtx.createImageData(MAP_TILES,MAP_TILES),fogMask=new Uint8Array(MAP_TILES*MAP_TILES),fogVisible=new Uint8Array(MAP_TILES*MAP_TILES);
export const fogSoftCanvas=document.createElement('canvas');
fogSoftCanvas.width=fogSoftCanvas.height=fogCanvas.width*FOG_BLUR_SCALE;
export const fogSoftCtx=fogSoftCanvas.getContext('2d');
for(let i=0;i<MAP_TILES*MAP_TILES;i++){fogImage.data[i*4]=FOG_RGB[0];fogImage.data[i*4+1]=FOG_RGB[1];fogImage.data[i*4+2]=FOG_RGB[2];}
export let fogArray=null,fogBuiltAt=0;
// Rebuilds the veil; draw() calls it before drawTerritory() so both border passes and drawFog() use the same masks.
export function refreshFog(fog){
 const now=performance.now(),N=MAP_TILES,E=FOG_EDGE_TILES;
 if(now-fogBuiltAt>200||fog!==fogArray){
  fogArray=fog;fogBuiltAt=now;
  teamVisibleTiles(localTeam(),fogVisible);
  // fogMask = 1 where the tile is unexplored or within E tiles of an unexplored tile (or of the map edge).
  fogMask.fill(0);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
   if(fog[y*N+x])continue;
   for(let dy=-E;dy<=E;dy++){const yy=y+dy;if(yy<0||yy>=N)continue;for(let dx=-E;dx<=E;dx++){const xx=x+dx;if(xx>=0&&xx<N)fogMask[yy*N+xx]=1;}}
  }
  for(let i=0;i<fogMask.length;i++)fogImage.data[i*4+3]=fogMask[i]?255:fogVisible[i]?0:FOG_MEMORY_ALPHA;
  fogCtx.fillStyle=`rgb(${FOG_RGB.join(',')})`;fogCtx.fillRect(0,0,fogCanvas.width,fogCanvas.height);
  fogCtx.putImageData(fogImage,FOG_PAD,FOG_PAD);
  const size=fogSoftCanvas.width;
  fogSoftCtx.clearRect(0,0,size,size);fogSoftCtx.imageSmoothingEnabled=true;fogSoftCtx.filter=`blur(${FOG_BLUR_SCALE}px)`;
  fogSoftCtx.drawImage(fogCanvas,0,0,size,size);fogSoftCtx.filter='none';
 }
}
export function drawFog(){
 const s=FOG_BLUR_SCALE,N=MAP_TILES;
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(fogSoftCanvas,FOG_PAD*s,FOG_PAD*s,N*s,N*s,0,0,W,H);ctx.restore();
}
