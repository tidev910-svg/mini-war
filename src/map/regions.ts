// @ts-nocheck
// Territory regions: tile map, borders, generation of the 20 flag regions with their mines (docs/features/territory.md).
import { H, HOME_TERRITORY_TILES, MAP_TILES, MIN_LAND_PATCH_TILES, REGION_COUNT, REGION_MIN_BASE_TILES, REGION_SEED_SPACING_TILES, REGION_TYPES, TILE_SIZE, W, forestRegions, goldRegions, rockRegions } from '../config/map';
import { landPatchSizes, terrainType, walkDistances } from './terrain';
import { state } from '../core/game';
import { FLAG_ENEMY_BASE_MIN_TILES, MINE_TYPES, RESOURCE_NAMES, RICH_MINE_MULTIPLIER } from '../config/balance';
import { baseDir, stateBaseTooClose } from './bases';

export let regionMap=null,regionMapKey='',regionEdges=[],regionTintKey='';
export function setRegionTintKey(v){return regionTintKey=v;}
export function regionSeedKey(regions){return regions.map(r=>r.sgx+','+r.sgy).join(';');}
export function buildRegionMap(regions){
 const N=MAP_TILES*MAP_TILES,dist=new Float32Array(N).fill(Infinity),owner=new Int16Array(N).fill(-1),heapD=[],heapI=[];
 const push=(d,i)=>{let k=heapD.length;heapD.push(d);heapI.push(i);while(k>0){const p=(k-1)>>1;if(heapD[p]<=d)break;heapD[k]=heapD[p];heapI[k]=heapI[p];k=p;}heapD[k]=d;heapI[k]=i;};
 const pop=()=>{const d=heapD[0],i=heapI[0],ld=heapD.pop(),li=heapI.pop(),n=heapD.length;if(n){let k=0;for(;;){let c=2*k+1;if(c>=n)break;if(c+1<n&&heapD[c+1]<heapD[c])c++;if(heapD[c]>=ld)break;heapD[k]=heapD[c];heapI[k]=heapI[c];k=c;}heapD[k]=ld;heapI[k]=li;}popped=i;return d;};
 let popped=0;
 const cost=i=>{const t=terrainType[i];return t===2?6:t===3?3:1;};
 for(const r of regions){const i=r.sgy*MAP_TILES+r.sgx;if(dist[i]>0){dist[i]=0;owner[i]=r.id;push(0,i);}}
 while(heapD.length){
  const d=pop(),i=popped;if(d>dist[i])continue;const x=i%MAP_TILES,y=(i-x)/MAP_TILES;
  const visit=j=>{const nd=d+cost(j);if(nd<dist[j]){dist[j]=nd;owner[j]=owner[i];push(nd,j);}};
  if(x>0)visit(i-1);if(x<MAP_TILES-1)visit(i+1);if(y>0)visit(i-MAP_TILES);if(y<MAP_TILES-1)visit(i+MAP_TILES);
 }
 regionMap=owner;regionMapKey=regionSeedKey(regions);regionTintKey='';
 // Border edges in tile units: [x1,y1,x2,y2,regionA,regionB,tileA,tileB].
 regionEdges=[];
 for(let y=0;y<MAP_TILES;y++)for(let x=0;x<MAP_TILES;x++){
  const i=y*MAP_TILES+x,a=owner[i];
  if(x<MAP_TILES-1&&owner[i+1]!==a){const e=[x+1,y,x+1,y+1,a,owner[i+1],i,i+1];regionEdges.push(e);}
  if(y<MAP_TILES-1&&owner[i+MAP_TILES]!==a){const e=[x,y+1,x+1,y+1,a,owner[i+MAP_TILES],i,i+MAP_TILES];regionEdges.push(e);}
 }
}
// Guests (and any state from a snapshot) rebuild the tile map when the region seeds differ from the cached one.
export function ensureRegionMap(){if(state?.regions&&regionMapKey!==regionSeedKey(state.regions))buildRegionMap(state.regions);}
export function generateRegions(blueBase,redBase){
 const T=TILE_SIZE,bases=[blueBase,redBase];let regions=[],mines=[];
 const tileOf=v=>Math.max(1,Math.min(MAP_TILES-2,Math.floor(v/T)));
 const add=(sgx,sgy,home=null)=>regions.push({id:regions.length,resource:home===null?null:'wood',sgx,sgy,home,owner:home===null?-1:home,cp:null,cap:0,capTeam:-1,contested:false,idle:0,stage2:-1});
 const walk=bases.map(walkDistances),patch=landPatchSizes(),reachable=i=>patch[i]>=MIN_LAND_PATCH_TILES;
 // Seed pool: the centres of the forest/rock/field biomes first (shuffled), then random land tiles, all away from the
 // fortresses and REGION_SEED_SPACING_TILES apart. Exactly REGION_COUNT seeds are used; seeds whose region gets no flag
 // or mine spot are swapped for the next ones in the pool and the map is split again.
 const farFromBases=(x,y)=>bases.every(b=>Math.hypot(x*T-b.x,y*T-b.y)>T*REGION_MIN_BASE_TILES);
 const pool=[],spaced=(x,y)=>pool.every(c=>Math.hypot(c.sgx-x,c.sgy-y)>=REGION_SEED_SPACING_TILES);
 for(const [cx,cy] of [...forestRegions,...rockRegions,...goldRegions].sort(()=>Math.random()-.5)){const x=tileOf(cx*W),y=tileOf(cy*H);if(farFromBases(x,y)&&spaced(x,y))pool.push({sgx:x,sgy:y});}
 for(let tries=0;pool.length<REGION_COUNT*2&&tries<4000;tries++){const x=2+Math.floor(Math.random()*(MAP_TILES-4)),y=2+Math.floor(Math.random()*(MAP_TILES-4)),i=y*MAP_TILES+x;if(reachable(i)&&farFromBases(x,y)&&spaced(x,y))pool.push({sgx:x,sgy:y});}
 let tiles,spots;
 const at=i=>({x:(i%MAP_TILES+.5)*T,y:((i-i%MAP_TILES)/MAP_TILES+.5)*T});
 // A spot is usable when its 3×3 tiles are passable, inside the same region and on a large land patch (not an islet).
 const clear=(i,id)=>{const x=i%MAP_TILES,y=(i-x)/MAP_TILES;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const j=(y+dy)*MAP_TILES+x+dx;if(regionMap[j]!==id||terrainType[j]===2||terrainType[j]===3)return false;}return reachable(i);};
 const nearestTo=(r,cx,cy,ok)=>{let best=null,bd=Infinity;for(const i of tiles[r.id]){const x=i%MAP_TILES,y=(i-x)/MAP_TILES,d=(x-cx)**2+(y-cy)**2;if(d>=bd||!clear(i,r.id))continue;const p=at(i);if(ok(p)){best=p;bd=d;}}return best;};
 const awayFromBases=p=>bases.every(b=>Math.hypot(p.x-b.x,p.y-b.y)>T*(FLAG_ENEMY_BASE_MIN_TILES+1));
 for(let pass=0;;pass++){
  regions=[];for(const b of bases)add(tileOf(b.x),tileOf(b.y),b.team);
  for(const c of pool.slice(0,REGION_COUNT))add(c.sgx,c.sgy);
  buildRegionMap(regions);
  tiles=regions.map(()=>[]);for(let i=0;i<regionMap.length;i++)if(regionMap[i]>=0)tiles[regionMap[i]].push(i);
  // Flag: the usable tile nearest the region's centre of mass.
  for(const r of regions){
   if(r.home!==null)continue;
   let sx=0,sy=0;for(const i of tiles[r.id]){sx+=i%MAP_TILES;sy+=(i-i%MAP_TILES)/MAP_TILES;}
   const n=Math.max(1,tiles[r.id].length);r.cp=nearestTo(r,sx/n,sy/n,awayFromBases);
  }
  // One mine spot per flag region (independent of its type), at least 6 tiles from the flag so labels do not overlap.
  // Home regions have no mine: the fortress income (FORTRESS_INCOME_PER_MINUTE) replaces it.
  spots=new Map();const farFromMines=p=>![...spots.values()].some(m=>Math.hypot(p.x-m.x,p.y-m.y)<260);
  for(const r of regions){
   if(r.home!==null||!r.cp)continue;
   const home=null;
   const ok=home?p=>farFromMines(p)&&Math.hypot(p.x-home.x,p.y-home.y)>=T*9&&Math.hypot(p.x-home.x,p.y-home.y)<=T*16
    :p=>farFromMines(p)&&Math.hypot(p.x-r.cp.x,p.y-r.cp.y)>=T*6&&!stateBaseTooClose(p.x,p.y,blueBase,redBase);
   // Neutral: the usable tile nearest the flag that is 6+ tiles out; home: nearest usable tile to a point 12 tiles toward the enemy.
   const spot=home?nearestTo(r,home.x/T+baseDir(home)*12,home.y/T,ok):nearestTo(r,r.cp.x/T,r.cp.y/T,ok);
   if(spot)spots.set(r.id,spot);
  }
  const bad=new Set(regions.filter(r=>r.home===null&&(!r.cp||!spots.has(r.id))).map(r=>r.id-bases.length));
  if(!bad.size)break;
  if(pass>=5||pool.length-bad.size<REGION_COUNT)return {regions,mines:[],unfairness:Infinity};
  for(const k of [...bad].sort((a,b)=>b-a))pool.splice(k,1);
 }
 // Resource types: the types missing among each fortress's REGION_TYPES.length nearest regions (walking cost to the flag)
 // go, in random order, to its nearest regions without a type, so both sides have every type close by.
 const neutral=regions.filter(r=>r.home===null&&spots.has(r.id)),flagWalk=(r,team)=>walk[team][tileOf(r.cp.y)*MAP_TILES+tileOf(r.cp.x)];
 for(const team of [0,1].sort(()=>Math.random()-.5)){
  const sorted=neutral.slice().sort((a,b)=>flagWalk(a,team)-flagWalk(b,team)),need=new Set(REGION_TYPES);
  for(const r of sorted.slice(0,REGION_TYPES.length))if(r.resource)need.delete(r.resource);
  const types=[...need].sort(()=>Math.random()-.5);
  for(const r of sorted){if(!types.length)break;if(!r.resource)r.resource=types.pop();}
 }
 for(const r of neutral)if(!r.resource)r.resource=REGION_TYPES[Math.floor(Math.random()*REGION_TYPES.length)];
 for(const r of regions){
  const spot=spots.get(r.id);if(!spot||!r.resource)continue;
  const rich=r.home===null&&Math.abs(r.sgx/MAP_TILES-.5)<.15&&Math.abs(r.sgy/MAP_TILES-.5)<.15;
  mines.push({...spot,resource:r.resource,rich,regionId:r.id,income:MINE_TYPES[r.resource].perSecond*(rich?RICH_MINE_MULTIPLIER:1),owner:r.owner});
 }
 // Fairness: for every type, compare each side's walking distance to its nearest flag of that type.
 let diff=0,total=0;
 for(const type of REGION_TYPES){
  const d=[0,1].map(team=>Math.min(...regions.filter(r=>r.home===null&&r.resource===type).map(r=>flagWalk(r,team))));
  if(!d.every(Number.isFinite))return {regions,mines,unfairness:Infinity};
  diff+=Math.abs(d[0]-d[1]);total+=Math.max(d[0],d[1]);
 }
 return {regions,mines,unfairness:total?diff/total:0};
}
export function regionLabel(r){return r.home!==null?'vùng nhà':'vùng '+RESOURCE_NAMES[r.resource];}
export function regionAt(x,y){if(!regionMap||!state?.regions)return null;const gx=Math.floor(x/TILE_SIZE),gy=Math.floor(y/TILE_SIZE);if(gx<0||gy<0||gx>=MAP_TILES||gy>=MAP_TILES)return null;return state.regions[regionMap[gy*MAP_TILES+gx]]||null;}
export function inOwnTerritory(team,x,y){const base=state.bases[team];if(base&&Math.hypot(x-base.x,y-base.y)<=HOME_TERRITORY_TILES*TILE_SIZE)return true;const r=regionAt(x,y);return !!r&&r.owner===team;}
