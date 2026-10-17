// @ts-nocheck
// Fog of war: explored maps and current vision (docs/features/fog-of-war.md).
import { H, HOME_TERRITORY_TILES, MAP_TILES, TILE_SIZE, W } from '../config/map';
import { state } from '../core/game';
import { unitVisionRadius } from './units';
import { fortressGunPosition } from '../map/bases';
import { regionAt, regionMap } from '../map/regions';
import { buildingVision } from './buildings';

export function revealTeamVision(team){
 if(!state)return;const arr=team===0?state.fogSeen:state.enemyFogSeen;if(!arr)return;revealOwnedRegions(team,arr);
 const cols=MAP_TILES,rows=MAP_TILES,cw=W/cols,ch=H/rows;
 const sources=[...state.units.filter(u=>u.team===team&&u.hp>0).map(u=>({x:u.x,y:u.y,r:unitVisionRadius(u.type)})),...state.bases.filter(b=>b.team===team).map(b=>({x:b.x,y:b.y,r:175})),...state.buildings.filter(b=>b.team===team).map(b=>({x:b.x,y:b.y,r:buildingVision(b)}))];
 for(const source of sources){const x1=Math.max(0,Math.floor((source.x-source.r)/cw)),x2=Math.min(cols-1,Math.ceil((source.x+source.r)/cw)),y1=Math.max(0,Math.floor((source.y-source.r)/ch)),y2=Math.min(rows-1,Math.ceil((source.y+source.r)/ch));for(let gy=y1;gy<=y2;gy++)for(let gx=x1;gx<=x2;gx++){if(Math.hypot((gx+.5)*cw-source.x,(gy+.5)*ch-source.y)<=source.r)arr[gy*cols+gx]=1;}}
}
export function teamCanSee(team,x,y){
 if(!state)return false;
 // Visibility is queried repeatedly by target acquisition and rendering. Compare
 // squared distances to avoid a square root for every unit, base, and turret.
 for(const u of state.units){if(u.team!==team||u.hp<=0)continue;const r=unitVisionRadius(u.type),dx=x-u.x,dy=y-u.y;if(dx*dx+dy*dy<=r*r)return true;}
 const base=state.bases.find(b=>b.team===team);if(base){const dx=x-base.x,dy=y-base.y;if(dx*dx+dy*dy<=175*175)return true;}
 for(const b of state.buildings){if(b.team!==team)continue;const r=buildingVision(b),dx=x-b.x,dy=y-b.y;if(dx*dx+dy*dy<=r*r)return true;}
 if(state.bases.some(b=>b.team===team&&(b.guns||[]).some((gun,index)=>{if(!gun.active)return false;const pos=fortressGunPosition(b,index),dx=x-pos.x,dy=y-pos.y;return dx*dx+dy*dy<=105*105;})))return true;
 // A captured flag gives live vision over its whole region while the team holds it.
 const r=regionAt(x,y);return !!r&&!!r.cp&&r.owner===team;
}
export function isTeamAreaExplored(team,x,y){
 const fog=team===0?state.fogSeen:state.enemyFogSeen;
 if(!fog||!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=W||y>=H)return false;
 const cols=MAP_TILES,rows=MAP_TILES,cellW=W/cols,cellH=H/rows;
 const gx=Math.floor(x/cellW),gy=Math.floor(y/cellH);
 return gx>=0&&gx<cols&&gy>=0&&gy<rows&&fog[gy*cols+gx]===1;
}
// A captured flag lights up its whole region: every tile of the region becomes explored for that team.
export function revealRegion(arr,regionId){if(!arr||!regionMap)return;for(let i=0;i<regionMap.length;i++)if(regionMap[i]===regionId)arr[i]=1;}
// Reveal every flag region the team owns (the guest keeps its own fog, so it re-applies this on each snapshot).
export function revealOwnedRegions(team,arr){if(!arr||!regionMap||!state?.regions)return;const owned=new Set(state.regions.filter(r=>r.cp&&r.owner===team).map(r=>r.id));if(!owned.size)return;for(let i=0;i<regionMap.length;i++)if(owned.has(regionMap[i]))arr[i]=1;}
export function revealCircle(arr,x,y,r){const cell=W/MAP_TILES,x1=Math.max(0,Math.floor((x-r)/cell)),x2=Math.min(MAP_TILES-1,Math.ceil((x+r)/cell)),y1=Math.max(0,Math.floor((y-r)/cell)),y2=Math.min(MAP_TILES-1,Math.ceil((y+r)/cell));for(let gy=y1;gy<=y2;gy++)for(let gx=x1;gx<=x2;gx++){const dx=(gx+.5)*cell-x,dy=(gy+.5)*cell-y;if(dx*dx+dy*dy<=r*r)arr[gy*MAP_TILES+gx]=1;}}
// Each side knows its own home territory from the start so it has room to build.
export function revealHomeTerritory(){if(!state)return;for(const b of state.bases)revealCircle(b.team===0?state.fogSeen:state.enemyFogSeen,b.x,b.y,HOME_TERRITORY_TILES*TILE_SIZE);}
export function aiCanSee(x,y){return teamCanSee(1,x,y);}
// Tiles the team sees right now: the same sources as teamCanSee (units, fortress, buildings, fortress guns, held flag regions).
export function teamVisibleTiles(team,out){
 out.fill(0);if(!state)return out;
 const sources=[...state.units.filter(u=>u.team===team&&u.hp>0).map(u=>[u.x,u.y,unitVisionRadius(u.type)]),...state.bases.filter(b=>b.team===team).map(b=>[b.x,b.y,175]),...state.buildings.filter(b=>b.team===team).map(b=>[b.x,b.y,buildingVision(b)])];
 for(const b of state.bases)if(b.team===team)(b.guns||[]).forEach((g,i)=>{if(g.active){const p=fortressGunPosition(b,i);sources.push([p.x,p.y,105]);}});
 for(const [x,y,r] of sources)revealCircle(out,x,y,r);
 if(regionMap){const held=new Set(state.regions.filter(r=>r.cp&&r.owner===team).map(r=>r.id));if(held.size)for(let i=0;i<regionMap.length;i++)if(held.has(regionMap[i]))out[i]=1;}
 return out;
}
