// @ts-nocheck
// Fog veil: opaque unexplored, thin veil over unseen explored ground (docs/features/fog-of-war.md).
import { ctx } from '../core/view';
import { H, MAP_TILES, W } from '../config/map';
import { localTeam } from '../core/game';
import { teamVisibleTiles } from '../sim/fog';
import { FOG_BLUR_SCALE, FOG_EDGE_TILES, FOG_MEMORY_ALPHA, FOG_PAD, FOG_RGB } from '../config/visuals';
import { MAP_UI } from '../config/theme';

export const fogCanvas=document.createElement('canvas');
fogCanvas.width=fogCanvas.height=MAP_TILES+FOG_PAD*2;
export const fogCtx=fogCanvas.getContext('2d'),fogImage=fogCtx.createImageData(MAP_TILES,MAP_TILES),fogMask=new Uint8Array(MAP_TILES*MAP_TILES),fogVisible=new Uint8Array(MAP_TILES*MAP_TILES);
export const fogSoftCanvas=document.createElement('canvas');
fogSoftCanvas.width=fogSoftCanvas.height=fogCanvas.width*FOG_BLUR_SCALE;
export const fogSoftCtx=fogSoftCanvas.getContext('2d');
// Fixed per-tile mottling (± MAP_UI.fogNoise) so the dark veil reads as cloud rather than a flat hole; the blur softens it.
for(let i=0;i<MAP_TILES*MAP_TILES;i++){const n=(Math.random()*2-1)*MAP_UI.fogNoise;fogImage.data[i*4]=FOG_RGB[0]+n;fogImage.data[i*4+1]=FOG_RGB[1]+n;fogImage.data[i*4+2]=FOG_RGB[2]+n*1.4;}
export let fogArray=null,fogBuiltAt=0;
let fogBlurred=false;
const fogRowMask=new Uint8Array(MAP_TILES*MAP_TILES);
// Rebuilds the veil; draw() calls it before drawTerritory() so both border passes and drawFog() use the same masks.
export function refreshFog(fog){
 const now=performance.now(),N=MAP_TILES,E=FOG_EDGE_TILES;
 if(now-fogBuiltAt>200||fog!==fogArray){
  fogArray=fog;fogBuiltAt=now;
  teamVisibleTiles(localTeam(),fogVisible);
  // fogMask = 1 where the tile is unexplored or within E tiles of an unexplored tile (or of the map edge).
  // Square dilation done as two sliding-window passes (rows into fogRowMask, then columns), O(N²) instead of O(N²·(2E+1)²).
  for(let y=0;y<N;y++){
   const o=y*N;let count=0;
   for(let x=0;x<E&&x<N;x++)if(!fog[o+x])count++;
   for(let x=0;x<N;x++){const add=x+E,drop=x-E-1;if(add<N&&!fog[o+add])count++;if(drop>=0&&!fog[o+drop])count--;fogRowMask[o+x]=count>0?1:0;}
  }
  for(let x=0;x<N;x++){
   let count=0;
   for(let y=0;y<E&&y<N;y++)count+=fogRowMask[y*N+x];
   for(let y=0;y<N;y++){const add=y+E,drop=y-E-1;if(add<N)count+=fogRowMask[add*N+x];if(drop>=0)count-=fogRowMask[drop*N+x];fogMask[y*N+x]=count>0?1:0;}
  }
  // Re-blur only when some tile's veil actually changed (the blur is the expensive part, ~4 ms on a 1056² canvas).
  let changed=!fogBlurred;
  for(let i=0;i<fogMask.length;i++){const a=fogMask[i]?255:fogVisible[i]?0:FOG_MEMORY_ALPHA;if(fogImage.data[i*4+3]!==a){fogImage.data[i*4+3]=a;changed=true;}}
  if(!changed)return;
  fogBlurred=true;
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
