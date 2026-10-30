// @ts-nocheck
// Ground of the "Ngũ Vực" map (docs/features/realms-map.md): which realm each tile belongs to, and its terrain.
// Deterministic (no Math.random), so the PvP guest builds the same ground from the map id alone; the left half is
// generated and mirrored onto the right, so neither side has better ground.
import { MAP_TILES } from '../config/map';
import { REALMS, REALM_LAYOUT as L } from '../config/maps';

export const REALM_INDEX=Object.fromEntries(REALMS.map((r,i)=>[r.id,i]));
// Realm of the point (nx, ny), both in 0..1.
export function realmAt(nx,ny){
 const rad=Math.hypot(nx-.5,ny-.5);
 if(rad<L.coreRadius)return REALM_INDEX.abyss;
 if(rad<L.ringRadius)return REALM_INDEX.hills;
 if(Math.min(nx,1-nx)<L.plainsWidth)return REALM_INDEX.plains;
 return ny<.5?REALM_INDEX.forest:REALM_INDEX.mountain;
}
// Angle of (nx, ny) around the map centre in degrees, 0..360 (0 = east, 90 = south).
const angleOf=(nx,ny)=>(Math.atan2(ny-.5,nx-.5)*180/Math.PI+360)%360;
// Taper of a range of short mountain ranges at `pos` (cfg: seg long, gap between, a gap centred on gapAt, repeating every
// period): 0 in a gap, rising to 1 at the middle of a range, so each range is thick in the middle and pointed at its ends.
export function rangeTaper(pos,cfg,period=cfg.seg+cfg.gap){
 const t=(((pos-(cfg.gapAt+cfg.gap/2))%period)+period)%period;
 return t<cfg.seg?Math.sqrt(Math.sin(Math.PI*t/cfg.seg)):0;
}
const nearAngle=(a,list,half)=>list.some(b=>{const d=Math.abs(a-b)%360;return Math.min(d,360-d)<=half;});

// Fills `types` (0 grass, 1 forest, 2 water, 3 rock, 4 field — as in map/terrain.ts) and `realms` (realm index) for the
// whole grid. `rnd(x, y)` is the terrain's hash noise in 0..1.
export function fillRealmsTerrain(types,realms,rnd){
 const N=MAP_TILES;
 // Smooth value noise: hash noise on a coarse grid, blended between grid points, so ground forms blobs, not speckle.
 const smooth=(x,y,cell,salt)=>{
  const gx=x/cell,gy=y/cell,x0=Math.floor(gx),y0=Math.floor(gy),fx=gx-x0,fy=gy-y0,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const v=(a,b)=>rnd(a*7+salt,b*13+salt*3);
  return (v(x0,y0)*(1-sx)+v(x0+1,y0)*sx)*(1-sy)+(v(x0,y0+1)*(1-sx)+v(x0+1,y0+1)*sx)*sy;
 };
 for(let y=0;y<N;y++)for(let x=0;x<N/2;x++){
  const nx=(x+.5)/N,ny=(y+.5)/N,realm=realmAt(nx,ny),id=REALMS[realm].id;
  const blob=smooth(x,y,9,11)*.75+smooth(x,y,4,29)*.25,fine=rnd(x+5,y+3);
  let t=0;
  if(id==='plains')t=blob>.7?4:blob<.16?1:0;                 // open grass, wheat patches, a few groves
  else if(id==='forest')t=blob>.36?1:fine>.985?3:0;            // dense woods with clearings
  else if(id==='mountain')t=blob>.69?3:blob<.14?1:0;           // rock outcrops between grassy valleys
  else if(id==='hills')t=blob>.42?4:blob<.1?3:0;               // golden fields, scattered boulders
  else t=blob>.32?4:0;                                         // the abyss: rich golden ground
  const rad=Math.hypot(nx-.5,ny-.5),fx=Math.min(nx,1-nx),a=angleOf(nx,ny);
  // Short mountain ranges along the plains edge and around the gold hills, with open ground between them.
  if(rad>=L.ringRadius&&Math.abs(fx-L.plainsWidth)<L.ridge*rangeTaper(ny,L.plainsRidge))t=3;
  if(Math.abs(rad-L.ringRadius)<L.ridge*rangeTaper(a,L.ringRidge,360/Math.round(360/(L.ringRidge.seg+L.ringRidge.gap))))t=3;
  // Water moat around the abyss, crossed on land at the gaps.
  if(rad<L.coreRadius&&rad>=L.coreRadius-L.moat&&!nearAngle(a,L.moatGaps,L.moatGapDegrees/2))t=2;
  for(const [px,py,pr] of L.ponds){const d=Math.hypot(nx-px,ny-py)/pr,edge=1+.18*Math.sin(Math.atan2(ny-py,nx-px)*3)+(fine-.5)*.1;if(d<edge)t=2;}
  for(const xx of [x,N-1-x]){const i=y*N+xx;types[i]=t;realms[i]=realm;}
 }
}
