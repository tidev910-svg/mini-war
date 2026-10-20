// @ts-nocheck
// Farms, outposts, towers: placement, construction, upgrades, destruction (docs/features/buildings.md, farms.md).
import { recordBuildingLost, recordBuilt } from './stats';
import { H, TILE_SIZE, W } from '../config/map';
import { tilePassable } from '../map/terrain';
import { addLog, canAfford, costText, draggingFarm, ended, localTeam, missingText, mode, nextFxId, nextId, notifyShortfall, paused, selectedBuilding, setDraggingFarm, setNextId, setSelectedBuilding, spend, state } from '../core/game';
import { BUILDER_RADIUS_TILES, BUILDING_TYPES, FARM_LEVELS, FARM_UPGRADE_SECONDS, FORTRESS_GUN_COST, specs, BUILDING_VISION } from '../config/balance';
import { isTeamAreaExplored, teamCanSee } from './fog';
import { activeFortressGuns, musterYard } from '../map/bases';
import { inOwnTerritory, regionAt } from '../map/regions';
import { updateHUD } from '../ui/hud';
import { updateCaptures } from './territory';

export function buildingDef(b){return BUILDING_TYPES[b.kind];}
export function buildingDone(b){return b.progress>=1;}
export function buildingName(b){return buildingDef(b).name;}
// Every building of a side sees BUILDING_VISION around it, also while it is being built (fog of war V3.1).
export function buildingVision(b){return BUILDING_VISION;}
export function buildingGun(b){return buildingDone(b)?buildingDef(b).gun||null:null;}
export function hasBuilding(team,kind){return state.buildings.some(b=>b.team===team&&b.kind===kind&&buildingDone(b));}
// Returns '' when the footprint is valid, otherwise the reason shown to the player.
export function buildingPlacementProblem(team,kind,x,y,ignore=null){
 if(!Object.hasOwn(BUILDING_TYPES,kind))return 'Loại công trình không hợp lệ.';
 const def=BUILDING_TYPES[kind],hw=def.halfW,hh=def.halfH;
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<hw+2||x>W-hw-2||y<hh+2||y>H-hh-2)return 'Vị trí nằm ngoài bản đồ.';
 const xs=[],ys=[];for(let v=-hw;v<hw;v+=8)xs.push(v);xs.push(hw);for(let v=-hh;v<hh;v+=8)ys.push(v);ys.push(hh);
 for(const sy of ys)for(const sx of xs){
  if(!isTeamAreaExplored(team,x+sx,y+sy))return 'Chỉ xây được trên vùng đã khám phá.';
  if(!tilePassable(x+sx,y+sy))return 'Không xây được trên nước hoặc đá.';
 }
 for(const b of state.buildings){if(b===ignore)continue;const o=BUILDING_TYPES[b.kind];if(Math.abs(x-b.x)<hw+o.halfW&&Math.abs(y-b.y)<hh+o.halfH)return 'Chồng lên công trình khác.';}
 for(const b of state.bases){
  if(Math.abs(x-b.x)<hw+(b.w||74)/2&&Math.abs(y-b.y)<hh+(b.h||92)/2)return 'Quá sát pháo đài.';
  const yard=musterYard(b);if(Math.abs(x-yard.x)<hw+yard.w/2&&Math.abs(y-yard.y)<hh+yard.h/2)return 'Không xây đè lên sân tập kết.';
 }
 // Flags keep a clear patch around them; an outpost may stand closer.
 const flagGap=TILE_SIZE*(kind==='outpost'?1.2:2.5);
 for(const r of state.regions){if(!r.cp)continue;const qx=Math.max(x-hw,Math.min(r.cp.x,x+hw)),qy=Math.max(y-hh,Math.min(r.cp.y,y+hh));if(Math.hypot(r.cp.x-qx,r.cp.y-qy)<flagGap)return 'Quá sát cột cờ.';}
 // Units gather beside a flag to build an outpost, so outposts skip the unit check.
 if(kind!=='outpost')for(const u of state.units){if(u.hp<=0)continue;const qx=Math.max(x-hw,Math.min(u.x,x+hw)),qy=Math.max(y-hh,Math.min(u.y,y+hh));if(Math.hypot(u.x-qx,u.y-qy)<(specs[u.type]?.r||9)+2)return 'Có quân đang đứng ở đó.';}
 if(def.where==='territory'&&!inOwnTerritory(team,x,y))return 'Phải xây trong lãnh thổ của mình (gần pháo đài hoặc trong vùng đã chiếm cờ).';
 if(def.where==='flag'){
  const r=regionAt(x,y);
  if(!r||!r.cp||r.owner!==team)return 'Tiền đồn phải xây cạnh cột cờ của vùng bạn đã chiếm.';
  if(Math.hypot(x-r.cp.x,y-r.cp.y)>BUILDER_RADIUS_TILES*TILE_SIZE)return `Tiền đồn phải đứng cách cột cờ tối đa ${BUILDER_RADIUS_TILES} ô.`;
  if(state.buildings.some(b=>b!==ignore&&b.kind==='outpost'&&b.regionId===r.id))return 'Vùng này đã có tiền đồn.';
 }
 return '';
}
export function findBuildSpot(team,kind,ax,ay,minR,maxR,tries=160){
 for(let i=0;i<tries;i++){const a=Math.random()*Math.PI*2,d=minR+Math.random()*(maxR-minR),x=ax+Math.cos(a)*d,y=ay+Math.sin(a)*d;if(!buildingPlacementProblem(team,kind,x,y))return {x,y};}
 return null;
}
export function placeBuilding(team,kind,x,y){
 if(ended||paused||!Object.hasOwn(BUILDING_TYPES,kind))return null;
 const def=BUILDING_TYPES[kind],mine=team===localTeam();
 const problem=buildingPlacementProblem(team,kind,x,y);
 if(problem){if(mine)addLog(def.name+': '+problem);return null;}
 if(!canAfford(team,def.cost)){if(mine){addLog(`Không đủ tài nguyên để xây ${def.name}: thiếu ${missingText(team,def.cost)}.`);notifyShortfall(team,def.cost);}return null;}
 spend(team,def.cost);
 const b={id:(setNextId(nextId+1)-1),kind,team,x,y,hp:def.hp*.2,max:def.hp,level:1,progress:0,upgrade:null,cool:0,regionId:def.where==='flag'?regionAt(x,y).id:null,waiting:false};
 state.buildings.push(b);
 if(mine)addLog(`Bắt đầu xây ${def.name} (${def.buildTime} giây).`+(kind==='outpost'?' Cần ít nhất một quân của bạn đứng cạnh thì mới xây.':''));
 recordBuilt(team);
 updateHUD();return b;
}
export function upgradeCost(b){return b.kind==='farm'?FARM_LEVELS[b.level+1]?.cost||null:null;}
// Without an id, pick the lowest-level farm nearest the fortress.
export function upgradeTarget(team,kind,id){
 const usable=b=>b&&b.team===team&&b.kind===kind&&buildingDone(b)&&!b.upgrade&&!!upgradeCost(b);
 if(id!==null){const b=state.buildings.find(b=>b.id===id);return usable(b)?b:null;}
 const base=state.bases[team];
 return state.buildings.filter(usable).sort((a,b)=>(a.level-b.level)||(Math.hypot(a.x-base.x,a.y-base.y)-Math.hypot(b.x-base.x,b.y-base.y)))[0]||null;
}
export function startUpgrade(team,kind,id=null){
 if(ended||paused||kind!=='farm')return false;
 const mine=team===localTeam(),b=upgradeTarget(team,kind,id);
 if(!b){if(mine)addLog('Không có nông trại nào nâng cấp được (phải xây xong, chưa đạt cấp 3, không đang nâng cấp).');return false;}
 const cost=upgradeCost(b);
 if(!canAfford(team,cost)){if(mine){addLog(`Không đủ tài nguyên để nâng cấp nông trại: thiếu ${missingText(team,cost)}.`);notifyShortfall(team,cost);}return false;}
 spend(team,cost);b.upgrade={progress:0,time:FARM_UPGRADE_SECONDS};
 if(mine)addLog(`Đang nâng nông trại lên cấp ${b.level+1} (${FARM_UPGRADE_SECONDS} giây).`);
 updateHUD();return true;
}
// Outpost beside the flag of an owned region: the given region, otherwise the owned region without one nearest the fortress.
export function outpostRegions(team){return state.regions.filter(r=>r.cp&&r.owner===team&&!state.buildings.some(b=>b.kind==='outpost'&&b.regionId===r.id));}
export function startOutpost(team,regionId=null){
 if(ended||paused)return null;
 const mine=team===localTeam(),def=BUILDING_TYPES.outpost,base=state.bases[team];
 const options=outpostRegions(team).filter(r=>regionId===null||r.id===regionId).sort((a,b)=>Math.hypot(a.cp.x-base.x,a.cp.y-base.y)-Math.hypot(b.cp.x-base.x,b.cp.y-base.y));
 if(!options.length){if(mine)addLog(regionId===null?'Không có vùng nào xây được tiền đồn (phải chiếm cờ của vùng và vùng chưa có tiền đồn).':'Vùng này chưa thuộc về bạn hoặc đã có tiền đồn.');return null;}
 if(!canAfford(team,def.cost)){if(mine){addLog(`Không đủ tài nguyên để xây tiền đồn: thiếu ${missingText(team,def.cost)}.`);notifyShortfall(team,def.cost);}return null;}
 for(const r of options){const spot=findBuildSpot(team,'outpost',r.cp.x,r.cp.y,TILE_SIZE*1.8,TILE_SIZE*3.5,80);if(spot)return placeBuilding(team,'outpost',spot.x,spot.y);}
 if(mine)addLog('Không tìm được chỗ trống cạnh cột cờ để xây tiền đồn.');return null;
}
export function completeBuilding(b){
 const def=buildingDef(b);if(b.team!==localTeam())return;
 if(b.kind==='outpost')addLog('Tiền đồn đã hoàn thành: có súng phòng thủ, tầm nhìn rộng, và giữ cờ của vùng không bị chiếm khi còn đứng.');
 else addLog(`${def.name} đã xây xong.`);
}
export function needsBuilder(b){return b.kind==='outpost'&&!buildingDone(b);}
export function hasBuilder(b){const r=BUILDER_RADIUS_TILES*TILE_SIZE;return state.units.some(u=>u.team===b.team&&u.hp>0&&Math.hypot(u.x-b.x,u.y-b.y)<=r);}
export function destroyBuilding(b){
 recordBuildingLost(b.team);
 state.buildings=state.buildings.filter(x=>x!==b);
 if(selectedBuilding===b)setSelectedBuilding(null);if(draggingFarm===b)setDraggingFarm(null);
 if(b.team===localTeam())addLog(`${buildingName(b)} đã bị phá hủy.`,'danger');
 else if(b.kind==='outpost')addLog('Đã phá tiền đồn địch: có thể chiếm cờ của vùng đó.');
}
// Construction, farm upgrades, flag capture and building guns (towers, outposts). Called every simulation step.
export function updateBuildings(dt){
 updateCaptures(dt);
 for(const b of [...state.buildings]){
  const def=buildingDef(b);
  if(!buildingDone(b)){
   b.waiting=needsBuilder(b)&&!hasBuilder(b);if(b.waiting)continue;
   const step=dt/def.buildTime;b.progress=Math.min(1,b.progress+step);if(b.progress>1-1e-6)b.progress=1; // absorb float drift so a 3 s farm finishes at 3 s
   b.hp=Math.min(b.max,b.hp+b.max*.8*step);
   if(buildingDone(b))completeBuilding(b);
   continue;
  }
  b.waiting=false;
  if(b.upgrade){
   b.upgrade.progress+=dt/b.upgrade.time;
   if(b.upgrade.progress>=1){b.upgrade=null;b.level++;if(b.team===localTeam())addLog(`Nông trại đã lên cấp ${b.level}: ${FARM_LEVELS[b.level].food} lúa/phút.`);}
  }
  const gun=buildingGun(b);if(!gun)continue;
  b.cool-=dt;if(b.cool>0)continue;
  let target=null,bd=gun.range;
  for(const u of state.units){if(u.team===b.team||u.hp<=0)continue;if((mode==='pvp'||b.team===1)&&!teamCanSee(b.team,u.x,u.y))continue;const d=Math.hypot(u.x-b.x,u.y-b.y);if(d<bd){bd=d;target=u;}}
  if(target){b.cool=gun.cooldown;state.bullets.push({id:nextFxId(),x:b.x,y:b.y-24,target,damage:gun.damage,team:b.team,speed:320,life:1.2});}
 }
}
export function buildTurret(team=localTeam()){
 if(ended||paused)return;const base=state.bases.find(b=>b.team===team);if(!base)return;
 if(activeFortressGuns(base)>=2){if(team===localTeam())addLog('Pháo đài đã có đủ 2 khẩu pháo tích hợp.');return;}
 if(!canAfford(team,FORTRESS_GUN_COST)){if(team===localTeam())addLog('Cần '+costText(FORTRESS_GUN_COST)+' để mở khóa pháo thứ hai: thiếu '+missingText(team,FORTRESS_GUN_COST)+'.');notifyShortfall(team,FORTRESS_GUN_COST);return;}
 const next=base.guns.findIndex(g=>!g.active);if(next<0)return;spend(team,FORTRESS_GUN_COST);
 base.guns[next].active=true;base.guns[next].cool=.2;base.max+=230;base.hp+=230;
 if(team===localTeam())addLog('Pháo thứ hai đã được tích hợp vào pháo đài; máu công trình tăng thêm 230.');updateHUD();
}
