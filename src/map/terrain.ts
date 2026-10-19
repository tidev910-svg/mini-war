// @ts-nocheck
// Procedural terrain (grass/water/rock), passability and walking distances (docs/features/rendering.md, territory.md).
import { MAP_TILES, TILE_SIZE, forestRegions, goldRegions, lakeRegions, rockRegions } from '../config/map';
import { nearestWalkable, terrainWalkable } from './paths';

export const terrainCanvas=document.createElement('canvas'),terrainCtx=terrainCanvas.getContext('2d'),terrainSmoothCanvas=document.createElement('canvas'),terrainSmoothCtx=terrainSmoothCanvas.getContext('2d'),terrainType=new Uint8Array(MAP_TILES*MAP_TILES),resourceTiles=[];
terrainCanvas.width=MAP_TILES*8;
terrainCanvas.height=MAP_TILES*8;
export const terrainPadding=32;
terrainSmoothCanvas.width=terrainCanvas.width+terrainPadding*2;
terrainSmoothCanvas.height=terrainCanvas.height+terrainPadding*2;
export function buildTerrain(){
 const total=MAP_TILES*MAP_TILES,parts=[];
 const rnd=(x,y)=>{const v=Math.sin((x+17)*127.1+(y+31)*311.7)*43758.5453;return v-Math.floor(v);};
 const affinity=(x,y,centers)=>Math.max(...centers.map(([cx,cy,rx,ry])=>1-Math.hypot((x-cx)/rx,(y-cy)/ry)));
 for(let y=0;y<MAP_TILES;y++)for(let x=0;x<MAP_TILES;x++){
  const nx=(x+.5)/MAP_TILES,ny=(y+.5)/MAP_TILES,jitter=rnd(x,y)*.20+rnd(Math.floor(x/8),Math.floor(y/8))*.16;
  const riverX=.34+.31*ny+.055*Math.sin(ny*10);
  const lake=Math.max(0,1-Math.hypot((nx-.18)/.10,(ny-.55)/.12),1-Math.hypot((nx-.79)/.11,(ny-.25)/.09));
  parts.push({i:y*MAP_TILES+x,water:Math.abs(nx-riverX)-lake*.16+rnd(x+9,y+13)*.018,rock:affinity(nx,ny,rockRegions)+jitter,resource:affinity(nx,ny,goldRegions)+jitter,forest:affinity(nx,ny,forestRegions)+jitter});
 }
 function assign(key,count,type,ascending=false){
  const candidates=parts.filter(p=>terrainType[p.i]===0).sort((a,b)=>ascending?a[key]-b[key]:b[key]-a[key]);
  for(let n=0;n<count;n++)terrainType[candidates[n].i]=type;
 }
 // Counts are allocated from the full 65,536-tile grid, so the requested area shares are exact to rounding.
 assign('water',5243,2,true);
 // Extra lakes: a wobbly ellipse per lakeRegions entry, carved before the other biomes so they never overwrite it.
 lakeRegions.forEach(([cx,cy,rx,ry],k)=>{
  const x0=Math.max(1,Math.floor((cx-rx*1.4)*MAP_TILES)),x1=Math.min(MAP_TILES-2,Math.ceil((cx+rx*1.4)*MAP_TILES)),y0=Math.max(1,Math.floor((cy-ry*1.4)*MAP_TILES)),y1=Math.min(MAP_TILES-2,Math.ceil((cy+ry*1.4)*MAP_TILES));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const dx=((x+.5)/MAP_TILES-cx)/rx,dy=((y+.5)/MAP_TILES-cy)/ry,a=Math.atan2(dy,dx);
   const edge=1+.16*Math.sin(3*a+k*1.7)+.09*Math.sin(5*a+k*2.9)+(rnd(x+k*31,y)-.5)*.08;
   if(Math.hypot(dx,dy)<edge&&terrainType[y*MAP_TILES+x]===0)terrainType[y*MAP_TILES+x]=2;
  }
 });
 assign('rock',4588,3);assign('resource',3276,4);assign('forest',13107,1);
 // Grass and forest tiles next to water get a sandy shore colour.
 const nearWater=i=>{const x=i%MAP_TILES,y=(i-x)/MAP_TILES;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const tx=x+ox,ty=y+oy;if(tx>=0&&ty>=0&&tx<MAP_TILES&&ty<MAP_TILES&&terrainType[ty*MAP_TILES+tx]===2)return true;}return false;};
 const pxPerTile=terrainCanvas.width/MAP_TILES;
 for(let y=0;y<MAP_TILES;y++)for(let x=0;x<MAP_TILES;x++){
  const i=y*MAP_TILES+x,type=terrainType[i],px=x*pxPerTile,py=y*pxPerTile,n=rnd(x+101,y+53);
  if(type===1){
   const grass=['#376f3a','#4a7d42','#5a8a4d','#6d9a5d','#7aa65b'];
   const base=grass[Math.floor(n*grass.length)];
   terrainCtx.fillStyle=base;terrainCtx.fillRect(px,py,pxPerTile,pxPerTile);
   const patchCount=1 + Math.floor(n*2.2);
   for(let c=0;c<patchCount;c++){
    const cx=px+2.8+((c*17+Math.floor(n*23))%(Math.max(5,pxPerTile-6))),cy=py+2.8+((c*19+Math.floor(n*29))%(Math.max(5,pxPerTile-6)));
    const radius=0.7+((c+1)*0.55)*n;
    const hue=c%3===0?'#8ecb65':c%3===1?'#a7d88d':'#dfe9b3';
    terrainCtx.fillStyle=hue;
    terrainCtx.beginPath();terrainCtx.ellipse(cx,cy,radius*1.5,radius*0.9,((c+2)*0.46),0,Math.PI*2);terrainCtx.fill();
    if(c%2===0){
     terrainCtx.fillStyle='#eff7b8';
     terrainCtx.beginPath();terrainCtx.ellipse(cx+0.8,cy-0.7,radius*0.9,radius*0.48,((c+3)*0.31),0,Math.PI*2);terrainCtx.fill();
    }
   }
   if(n>0.72){terrainCtx.fillStyle='#e9f0af';terrainCtx.fillRect(px+1.2,py+1.5,0.8,0.8);}
   if(n>0.87){terrainCtx.fillStyle='#1d452a';terrainCtx.fillRect(px+pxPerTile*0.76,py+pxPerTile*0.18,0.55,0.55);}
  }
  else if(type===2){
   const water=['#2c7890','#3a8197','#428da2','#3a738b'];
   terrainCtx.fillStyle=water[Math.floor(n*water.length)];terrainCtx.fillRect(px,py,pxPerTile,pxPerTile);
   terrainCtx.fillStyle='#bfe7ea';terrainCtx.fillRect(px+1,py+1,pxPerTile*0.28,pxPerTile*0.18);
   if(n>.68){terrainCtx.fillStyle='#d7f6f6';terrainCtx.fillRect(px+pxPerTile*0.58,py+pxPerTile*0.37,pxPerTile*0.22,pxPerTile*0.12);}
   if(n>.82){terrainCtx.fillStyle='#d7f6f6';terrainCtx.fillRect(px+pxPerTile*0.18,py+pxPerTile*0.72,pxPerTile*0.26,pxPerTile*0.08);}
  }
  else if(type===3){
   const rock=['#7c705e','#867a67','#93866f','#706a5f'];
   terrainCtx.fillStyle=rock[Math.floor(n*rock.length)];terrainCtx.fillRect(px,py,pxPerTile,pxPerTile);
   terrainCtx.fillStyle='#b4a38d';terrainCtx.fillRect(px+1.2,py+1.8,2.1,1.5);
   if(n>.58){terrainCtx.fillStyle='#d9d0bc';terrainCtx.fillRect(px+Math.max(2,pxPerTile*0.46),py+Math.max(2,pxPerTile*0.34),2.4,1.8);}
   if(n>.76){terrainCtx.fillStyle='#6a6053';terrainCtx.fillRect(px+pxPerTile*0.7,py+pxPerTile*0.58,2.1,1.3);}
  }
  else if(type===4){
   const field=['#b3c46b','#c6cd7d','#d4d179','#d9c578'];
   terrainCtx.fillStyle=field[Math.floor(n*field.length)];terrainCtx.fillRect(px,py,pxPerTile,pxPerTile);
   resourceTiles.push(i);terrainCtx.fillStyle='#efdf8c';terrainCtx.fillRect(px+1.5,py+1.5,1.8,2.6);
   if(n>.62){terrainCtx.fillStyle='#f2d373';terrainCtx.fillRect(px+pxPerTile*0.58,py+pxPerTile*0.22,2,2.7);}
  }
  else if(type===0&&nearWater(i)){
   const shore=['#c9c58a','#d3cc93','#bfbd82','#b6c07f'];
   terrainCtx.fillStyle=shore[Math.floor(n*shore.length)];terrainCtx.fillRect(px,py,pxPerTile,pxPerTile);
   if(n>.55){terrainCtx.fillStyle='#e6dfae';terrainCtx.fillRect(px+1.4,py+2,1.6,1.1);}
  }
  else{
   const plains=['#7bbd63','#82c66d','#70ad61','#8ec96c'];
   terrainCtx.fillStyle=plains[Math.floor(n*plains.length)];terrainCtx.fillRect(px,py,pxPerTile,pxPerTile);
   if(n>.62){terrainCtx.fillStyle='#d5e7a1';terrainCtx.fillRect(px+1.6,py+2.2,1.3,1.1);}
  }
 }
 terrainSmoothCtx.fillStyle='#79b967';terrainSmoothCtx.fillRect(0,0,terrainSmoothCanvas.width,terrainSmoothCanvas.height);
 terrainSmoothCtx.filter='blur(8px)';terrainSmoothCtx.drawImage(terrainCanvas,terrainPadding,terrainPadding);terrainSmoothCtx.filter='none';
 for(let i=0;i<4200;i++){
  const n=Math.sin((i+53)*127.1)*43758.5453,rx=n-Math.floor(n),m=Math.sin((i+301)*311.7)*24634.6345,ry=m-Math.floor(m);
  const px=terrainPadding+rx*terrainCanvas.width,py=terrainPadding+ry*terrainCanvas.height,tx=Math.min(MAP_TILES-1,Math.floor(rx*MAP_TILES)),ty=Math.min(MAP_TILES-1,Math.floor(ry*MAP_TILES)),type=terrainType[ty*MAP_TILES+tx],size=.72+(i%4)*.28;
  const colors=type===2?['#b5d4bd12','#214e6330']:type===3?['#ded2b03a','#3e49433f']:type===1?['#aac07a18','#183f2f14']:type===4?['#e5d89026','#6d80543a']:['#d2df9850','#47743b3f'];
  terrainSmoothCtx.fillStyle=colors[i%2];terrainSmoothCtx.beginPath();terrainSmoothCtx.ellipse(px,py,size*1.5,size*.62,(i%9)*.21,0,Math.PI*2);terrainSmoothCtx.fill();
 }
}

buildTerrain();
/// Walking cost from a fortress to every tile (4 directions, one per tile), the way units really walk: water and rock
// block, the river is crossed on the bridges (docs/features/pathfinding.md). Unreachable tiles stay Infinity.
export function walkDistances(base){
 const N=MAP_TILES*MAP_TILES,d=new Float32Array(N).fill(Infinity),heapD=[],heapI=[];
 const push=(v,i)=>{let k=heapD.length;heapD.push(v);heapI.push(i);while(k>0){const p=(k-1)>>1;if(heapD[p]<=v)break;heapD[k]=heapD[p];heapI[k]=heapI[p];k=p;}heapD[k]=v;heapI[k]=i;};
 const pop=()=>{const v=heapD[0],i=heapI[0],lv=heapD.pop(),li=heapI.pop(),n=heapD.length;if(n){let k=0;for(;;){let c=2*k+1;if(c>=n)break;if(c+1<n&&heapD[c+1]<heapD[c])c++;if(heapD[c]>=lv)break;heapD[k]=heapD[c];heapI[k]=heapI[c];k=c;}heapD[k]=lv;heapI[k]=li;}return [v,i];};
 // Real walking: only walkable tiles (water and rock block, bridges cross the river), start from the nearest walkable tile.
 const cost=i=>terrainWalkable[i]?1:Infinity;
 const from=nearestWalkable(base.x,base.y,24,terrainWalkable)||base;
 const start=Math.max(1,Math.min(MAP_TILES-2,Math.floor(from.y/TILE_SIZE)))*MAP_TILES+Math.max(1,Math.min(MAP_TILES-2,Math.floor(from.x/TILE_SIZE)));
 d[start]=0;push(0,start);
 while(heapD.length){const [v,i]=pop();if(v>d[i])continue;const x=i%MAP_TILES,y=(i-x)/MAP_TILES;
  for(const j of [x>0?i-1:-1,x<MAP_TILES-1?i+1:-1,y>0?i-MAP_TILES:-1,y<MAP_TILES-1?i+MAP_TILES:-1]){if(j<0)continue;const nv=v+cost(j);if(nv<d[j]){d[j]=nv;push(nv,j);}}}
 return d;
}
// Size of the connected land patch (no water or rock) each tile belongs to; terrain never changes, so it is computed once.
// Flags and mines must sit on a patch of at least MIN_LAND_PATCH_TILES so they are not on a walled-in islet.
export let landPatchSize=null;
export function landPatchSizes(){
 if(landPatchSize)return landPatchSize;
 const N=MAP_TILES*MAP_TILES,size=new Int32Array(N),label=new Int32Array(N).fill(-1),queue=new Int32Array(N),land=i=>{const t=terrainType[i];return t!==2&&t!==3;};
 for(let s=0;s<N;s++){
  if(label[s]>=0||!land(s))continue;
  let head=0,tail=0;queue[tail++]=s;label[s]=s;
  while(head<tail){const i=queue[head++],x=i%MAP_TILES,y=(i-x)/MAP_TILES;for(const j of [x>0?i-1:-1,x<MAP_TILES-1?i+1:-1,y>0?i-MAP_TILES:-1,y<MAP_TILES-1?i+MAP_TILES:-1])if(j>=0&&label[j]<0&&land(j)){label[j]=s;queue[tail++]=j;}}
  for(let k=0;k<tail;k++)size[queue[k]]=tail;
 }
 return landPatchSize=size;
}
// ---- Buildings & territory (docs/features/buildings.md, docs/features/territory.md) ----
export function tilePassable(x,y){const gx=Math.floor(x/TILE_SIZE),gy=Math.floor(y/TILE_SIZE);if(gx<1||gy<1||gx>=MAP_TILES-1||gy>=MAP_TILES-1)return false;const t=terrainType[gy*MAP_TILES+gx];return t!==2&&t!==3;}
