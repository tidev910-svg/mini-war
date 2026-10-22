// @ts-nocheck
// Match lifecycle: fresh() map and state, the simulation step update(), finish() and the frame loop (docs/features/match-flow.md).
import { attackGoal, updateKnowledge } from '../sim/knowledge';
import { enterGarrison, sortieGoal, sortieMayChase, updateFlagDefense } from '../sim/garrison';
import { newStats, recordGathered, sampleStats, updateStats } from '../sim/stats';
import { showMatchStats } from '../ui/results';
import { DEFAULT_ZOOM, camX, camY, centerCameraOnHome, setCamX, setCamY, setZoom, zoom } from './view';
import { BASE_MIN_SEPARATION, H, MAP_FAIRNESS_TOLERANCE, MAP_GENERATION_TRIES, MAP_TILES, TILE_SIZE, W } from '../config/map';
import { $, addLog, dist, ended, nextFxId, gameStarted, gameTime, localTeam, mode, netRole, nextId, paused, selected, selectedBuilding, selectedFlag, selectedFortress, setEnded, setGameTime, setNextId, setPaused, setSelected, setSelectedBuilding, setSelectedFlag, setSelectedFortress, setState, setSuppressNextCanvasClick, state, suppressNextCanvasClick, teamResources } from './game';
import { endPlacement } from '../ui/input';
import { FLAG_CAPTURE_RADIUS_TILES, FLAG_DEFENSE, FORTRESS_INCOME_PER_MINUTE, STARTING_RESOURCES, TRAIN_LANES_START, FORTRESS_GUN_DAMAGE, specs } from '../config/balance';
import { facingFrom, processPendingSpawns, unitVisionRadius, updateQueueLanes, updateTraining } from '../sim/units';
import { farmFoodPerMinute, supplyFactor, updateSupply } from '../sim/economy';
import { sendSnapshot } from '../net/snapshot';
import { aiCanSee, revealHomeTerritory, revealTeamVision, teamCanSee, visionSources } from '../sim/fog';
import { baseSiteClear, fortressGunPosition, musterYard } from '../map/bases';
import { buildRegionMap, generateRegions } from '../map/regions';
import { setPauseButton, updateHUD, updateMatchClockHUD, updateTrainQueueHUD } from '../ui/hud';
import { buildingDone, buildingVision, needsBuilder, updateBuildings } from '../sim/buildings';
import { attackRange, hurt, nearestEnemy, unitTargetValid } from '../sim/combat';
import { flagStandSpot, runEnemyAI } from '../ai/enemy';
import { aiLevel, aiUnitGoal, exploreSpot, newAIPlan } from '../ai/attack';
import { buildWorldDecor } from '../render/terrain';
import { draw } from '../render/draw';
import { clampToBounds, clearPath, separateUnits, steerTo, syncStructureObstacles } from '../sim/movement';
import { formationMayChase, formationOf, formationTarget, updateFormations } from '../sim/formation';
import { nearestWalkable, reachableFrom, setStructureObstacles, tileOf } from '../map/paths';

export let last=0;
export let aiTimer=0,incomeTimer=0;
export let lastHudSecond=-1,pendingSpawnRetryTimer=0;
export let snapshotClock=0;
const HUD_REFRESH_MS=100;let hudRefreshedAt=-Infinity;
export function fresh(){
 setStructureObstacles([]); // the last match's buildings must not shape this map's checks
 endPlacement();setSuppressNextCanvasClick(false);setSelectedFortress(null);setSelectedBuilding(null);setSelectedFlag(null);
 // Random fortresses anywhere on the map, at least BASE_MIN_SEPARATION of the map width apart, with their regions, mines
 // and flags (generateRegions, territory.md). Re-roll until both sides have every resource type at a similar walking
 // distance; keep the fairest attempt otherwise.
 const margin=420;
 let best=null;
 for(let attempt=0,rolls=0;attempt<MAP_GENERATION_TRIES&&rolls<2000;rolls++){
  const makeBase=team=>({team,x:margin+Math.random()*(W-2*margin),y:margin+Math.random()*(H-2*margin),hp:1230,max:1230,w:TILE_SIZE*5.5,h:TILE_SIZE*5.0,guns:[{active:true,cool:0},{active:false,cool:0}]});
  const blueBase=makeBase(0),redBase=makeBase(1);
  if(Math.hypot(blueBase.x-redBase.x,blueBase.y-redBase.y)<W*BASE_MIN_SEPARATION&&(best||rolls<1999))continue;
  blueBase.dir=redBase.x>=blueBase.x?1:-1;redBase.dir=-blueBase.dir;
  // A fortress or muster yard standing mostly on rock or water cannot deploy units; re-roll (cheap, no region map needed).
  if(![blueBase,redBase].every(baseSiteClear)&&(best||rolls<1999))continue;
  attempt++;
  const gen=generateRegions(blueBase,redBase);
  // Both muster yards, every flag and every mine must be reachable on foot (water and rock block; bridges cross the river).
  const reach=reachableFrom(musterYard(blueBase).x,musterYard(blueBase).y),onFoot=p=>{const q=nearestWalkable(p.x,p.y,4);return !!q&&reach[tileOf(q.y)*MAP_TILES+tileOf(q.x)]===1;};
  if(!onFoot(musterYard(redBase))||gen.regions.some(r=>r.cp&&!onFoot(r.cp))||gen.mines.some(m=>!onFoot(m)))gen.unfairness=Infinity;
  if(!best||gen.unfairness<best.unfairness)best={...gen,blueBase,redBase};
  if(gen.unfairness<=MAP_FAIRNESS_TOLERANCE)break;
 }
 const {regions,mines,blueBase,redBase}=best;
 buildRegionMap(regions);
 setState({resources:[{...STARTING_RESOURCES},{...STARTING_RESOURCES}],supply:[{status:'ok',grace:0},{status:'ok',grace:0}],units:[],bullets:[],effects:[],buildings:[],regions,guards:[],bases:[blueBase,redBase],mines,fogSeen:new Uint8Array(MAP_TILES*MAP_TILES),enemyFogSeen:new Uint8Array(MAP_TILES*MAP_TILES),enemyMemory:{base:null,targets:[]},aiExploreTarget:null,pendingSpawns:[],trainQueue:[],queueLanes:[TRAIN_LANES_START,TRAIN_LANES_START],laneUpgrade:[null,null],stats:newStats(),aiPlan:newAIPlan(),formations:[],garrisons:[]});
 syncStructureObstacles();
 buildWorldDecor();revealHomeTerritory();
 setGameTime(0);aiTimer=5;incomeTimer=0;setNextId(1);lastHudSecond=-1;pendingSpawnRetryTimer=0;setSelected(null);setPaused(false);setEnded(false);setCamX(0);setCamY(0);setZoom(DEFAULT_ZOOM);
 centerCameraOnHome();
 $('overlay').classList.remove('show');setPauseButton();
 addLog('Trận đấu bắt đầu. Vị trí căn cứ được chọn ngẫu nhiên trong mỗi trận!');
 updateHUD();
}
export function finish(win){if(ended)return;setEnded(true);sampleStats();$('resultTitle').textContent=win?'🏆 CHIẾN THẮNG!':'💥 THẤT THỦ!';$('resultText').textContent=win?'Bạn đã phá hủy căn cứ địch. Chỉ huy xuất sắc!':'Căn cứ của bạn đã bị phá hủy. Hãy thử chiến thuật khác!';$('overlay').classList.add('show');showMatchStats();addLog(win?'Chiến thắng!':'Thất bại!');updateHUD();}
export function update(dt){
 if(!gameStarted|| (mode==='pvp'&&netRole==='guest') || paused||ended)return;const before=gameTime;setGameTime(gameTime+(dt));incomeTimer+=dt;aiTimer+=dt;
 const shownSecond=Math.floor(gameTime);if(shownSecond!==lastHudSecond){lastHudSecond=shownSecond;updateMatchClockHUD();updateTrainQueueHUD(localTeam());}
 updateTraining(dt);updateQueueLanes(dt);updateStats(dt);
 pendingSpawnRetryTimer+=dt;if(pendingSpawnRetryTimer>=.35){pendingSpawnRetryTimer=0;processPendingSpawns();}
 // Income once a second: fortress base income, farms, and the mines of held regions.
 while(incomeTimer>=1){incomeTimer-=1;
  for(const b of state.bases)if(b.hp>0){const res=teamResources(b.team);for(const [k,v] of Object.entries(FORTRESS_INCOME_PER_MINUTE)){res[k]+=v/60;recordGathered(b.team,k,v/60);}}
  for(const b of state.buildings)if(b.kind==='farm'&&buildingDone(b)){const f=farmFoodPerMinute(b)/60;teamResources(b.team).food+=f;recordGathered(b.team,'food',f);}
  // Mines pay whoever owns their region (a finished flag or outpost).
  for(const mine of state.mines){const r=state.regions[mine.regionId];mine.owner=r?r.owner:-1;if(mine.owner>=0){teamResources(mine.owner)[mine.resource]+=mine.income;recordGathered(mine.owner,mine.resource,mine.income);}}
  updateSupply(0);updateSupply(1);
 }
 if(mode==='ai'&&aiTimer>=aiLevel().tick){aiTimer=0;runEnemyAI();}
 updateBuildings(dt);syncStructureObstacles();updateFormations(dt);updateFlagDefense(dt);updateKnowledge();
 // unit movement and combat
 for(const u of [...state.units]){
  if(u.hp<=0)continue;const s=specs[u.type];u.walk+=dt;u.moving=false;u.attackTimer-=dt;const startX=u.x,startY=u.y;
  const speed=s.speed*supplyFactor(u.team,'speed'),cooldown=s.cooldown/supplyFactor(u.team,'attack');
  let target=nearestEnemy(u);if(!unitTargetValid(target,u))target=null;
  const fm=u.formation!=null?formationOf(u):null;let engaged=false;
  if(mode==='ai'&&u.team===1&&!target){
   // Assigned builders stay at their flag until it no longer needs them.
   const job=u.buildTarget?state.buildings.find(b=>b.id===u.buildTarget&&needsBuilder(b)):null;
   if(!job)u.buildTarget=null;
   // Capture squads stay at their flag until the region is the AI's with no enemy progress on it.
   const flag=u.captureTarget!=null?state.regions[u.captureTarget]:null;
   if(flag&&(!flag.cp||(flag.owner===1&&!flag.cap)))u.captureTarget=null;
   // Attack-planner roles (ai/attack.ts): rally point, wave target, defence or retreat.
   const goal=!job&&u.captureTarget==null?aiUnitGoal(u):null;
   if(job){if(!u.dest||Math.hypot(u.dest.x-job.x,u.dest.y-job.y)>60)u.dest={x:job.x,y:job.y+30};}
   else if(goal){u.dest={x:goal.x,y:goal.y};u.order='explore';}
   else if(u.captureTarget!=null){if(!u.dest||Math.hypot(u.dest.x-flag.cp.x,u.dest.y-flag.cp.y)>FLAG_CAPTURE_RADIUS_TILES*TILE_SIZE*.6)u.dest=flagStandSpot(flag);}
   else if(!u.dest||Math.hypot(u.dest.x-u.x,u.dest.y-u.y)<35||Math.random()<.003){
    const cols=MAP_TILES,rows=MAP_TILES,cw=W/cols,ch=H/rows;
    // Prefer neutral or enemy-controlled mines; otherwise explore an unseen cell.
    const mineTargets=state.mines.filter(m=>m.owner!==1).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y));
    let candidate=mineTargets.length?{x:mineTargets[0].x,y:mineTargets[0].y}:null;
    // Scouts sweep the edge of what the AI knows, moving outward from home (no knowledge of where the enemy lives).
    if(u.type==='scout')candidate=exploreSpot(u)||candidate;
    else if(!candidate||Math.hypot(candidate.x-u.x,candidate.y-u.y)<70){candidate=null;for(let k=0;k<48;k++){const gx=Math.floor(Math.random()*cols),gy=Math.floor(Math.random()*rows),idx=gy*cols+gx;if(!state.enemyFogSeen[idx]){candidate={x:(gx+.5)*cw,y:(gy+.5)*ch};break;}}}
    if(!candidate)candidate={x:Math.random()*W,y:45+Math.random()*(H-75)};
    u.dest=candidate;u.order='explore';
   }
   // Walk the path; an errand whose spot cannot be reached is dropped so a new one is picked next frame.
   if(Math.hypot(u.dest.x-u.x,u.dest.y-u.y)>5&&steerTo(u,u.dest.x,u.dest.y,speed,dt)&&Math.hypot(u.dest.x-u.x,u.dest.y-u.y)>35&&u.captureTarget==null&&!u.buildTarget&&!goal){u.dest=null;clearPath(u);}
  }
  if(target){
   const d=dist(u,target),range=attackRange(u,target);
   if(d<=range){engaged=true;
    if(u.attackTimer<=0){u.attackTimer=cooldown;
      if(u.type==='archer'){state.bullets.push({id:nextFxId(),x:u.x,y:u.y-3,target,damage:s.damage,team:u.team,speed:280,life:2,attackerType:u.type});}
      else hurt(target,s.damage,u.team,u.type);
    }
   }else if((u.order==='attack'||(mode==='ai'&&u.team===1)||(fm&&u.order==='formation'&&formationMayChase(fm,u,target))||(u.order==='sortie'&&sortieMayChase(u,target)))){
    engaged=true;
    steerTo(u,target.x,target.y,speed,dt);
    clampToBounds(u);
   }
  }
  // Player units with a move order follow their path to the clicked point (formation slot).
  if((mode==='pvp'||u.team===0)&&u.order==='move'&&u.dest){
   if(steerTo(u,u.dest.x,u.dest.y,speed,dt)){u.order=fm?'formation':'hold';u.dest=null;clearPath(u);if(u.garrisonTarget!=null){enterGarrison(u);continue;}}
   else if(u.garrisonTarget!=null&&state.regions[u.garrisonTarget]?.cp&&Math.hypot(u.x-state.regions[u.garrisonTarget].cp.x,u.y-state.regions[u.garrisonTarget].cp.y)<=FLAG_DEFENSE.enterRadius){enterGarrison(u);continue;}
   clampToBounds(u);
  }
  // Attack order with no enemy in sight (player units): march on the nearest known enemy target (sim/knowledge.ts);
  // reaching an enemy flag captures it, reaching a structure brings it into sight and into the fight.
  else if(u.order==='attack'&&!engaged&&!target&&(mode==='pvp'||u.team===0)){const g=attackGoal(u);if(g&&Math.hypot(g.x-u.x,g.y-u.y)>30){steerTo(u,g.x,g.y,speed,dt);clampToBounds(u);}}
  // Flag defenders (sim/garrison.ts): hold while the flag is threatened, walk back in once it has been calm.
  else if(u.order==='sortie'&&!engaged){const p=sortieGoal(u);if(p){if(Math.hypot(p.x-u.x,p.y-u.y)<=FLAG_DEFENSE.enterRadius){enterGarrison(u);continue;}steerTo(u,p.x,p.y,speed,dt);clampToBounds(u);}}
  // Formation members walk to their slot (or column place) when not fighting (sim/formation.ts). A slot that slid less
  // than PATH_GOAL_TOLERANCE does not re-plan by itself, so an emptied path away from the slot is dropped.
  else if(fm&&u.order==='formation'&&!engaged){const p=formationTarget(fm,u);if(Math.hypot(p.x-u.x,p.y-u.y)>4){if(steerTo(u,p.x,p.y,speed,dt)&&Math.hypot(p.x-u.x,p.y-u.y)>8)clearPath(u);clampToBounds(u);}else if(u.path)clearPath(u);}
  // Face the direction actually travelled this frame; when standing, face a target that is within attack range.
  const movedX=u.x-startX,movedY=u.y-startY;
  if(movedX*movedX+movedY*movedY>1e-4)u.facing=facingFrom(movedX,movedY,u.facing);
  else if(target&&dist(u,target)<=attackRange(u,target))u.facing=facingFrom(target.x-u.x,target.y-u.y);
 }
 separateUnits(dt);
 // bullets track moving target
 for(const b of [...state.bullets]){
  if(!b.target||b.target.hp<=0||b.target.garrison!=null){state.bullets=state.bullets.filter(q=>q!==b);continue;}
  const d=dist(b,b.target),step=b.speed*dt;
  if(d<=step+7){hurt(b.target,b.damage,b.team,b.attackerType);state.bullets=state.bullets.filter(q=>q!==b);}
  else{b.x+=(b.target.x-b.x)/d*step;b.y+=(b.target.y-b.y)/d*step;b.life-=dt;if(b.life<=0)state.bullets=state.bullets.filter(q=>q!==b);}
 }
 // Integrated fortress cannons preserve the former tower firing stats.
 for(const base of state.bases)for(let index=0;index<(base.guns||[]).length;index++){
  const gun=base.guns[index];if(!gun.active)continue;gun.cool-=dt;const source=fortressGunPosition(base,index);let target=null,bd=190;
  for(const u of state.units){if(u.team===base.team)continue;if(!teamCanSee(base.team,u.x,u.y))continue;const d=Math.hypot(source.x-u.x,source.y-u.y);if(d<bd){bd=d;target=u;}}
  if(target&&gun.cool<=0){gun.cool=1.0;state.bullets.push({id:nextFxId(),x:source.x,y:source.y-8,target,damage:FORTRESS_GUN_DAMAGE[index]??FORTRESS_GUN_DAMAGE[0],team:base.team,speed:320,life:1.2});}
 }
 // Neutral monsters guarding the gold mines attack nearby player units.
 for(const g of state.guards){
  if(g.hp<=0)continue;g.timer-=dt;
  let target=state.units.filter(u=>u.team===0&&u.hp>0&&Math.hypot(u.x-g.x,u.y-g.y)<g.aggro).sort((a,b)=>Math.hypot(a.x-g.x,a.y-g.y)-Math.hypot(b.x-g.x,b.y-g.y))[0];
  if(target){
   const d=Math.hypot(target.x-g.x,target.y-g.y);
   if(d>g.range){g.x+=(target.x-g.x)/d*g.speed*dt;g.y+=(target.y-g.y)/d*g.speed*dt;}
   else if(g.timer<=0){target.hp-=g.damage;g.timer=g.cooldown;state.effects.push({id:nextFxId(),src:'guard',x:target.x,y:target.y,life:.18,max:.18,color:'#ff9f43'});}
  }else{
   const d=Math.hypot(g.homeX-g.x,g.homeY-g.y);
   if(d>3){g.x+=(g.homeX-g.x)/d*g.speed*dt;g.y+=(g.homeY-g.y)/d*g.speed*dt;}
  }
 }
 state.guards=state.guards.filter(g=>g.hp>0);
 // Fog of war: what each side sees now becomes explored (sim/fog.ts); explored tiles never go dark again.
 revealTeamVision(0);revealTeamVision(1);
 // AI has its own independent vision map and stale memory of sightings.
 const aiSources=visionSources(1).map(([x,y,r])=>({x,y,r}));
 // The blue fortress is spotted when its centre is in sight or any red unit's sight reaches its walls.
 const blueBase=state.bases[0],spotted=aiCanSee(blueBase.x,blueBase.y)||aiSources.some(s=>Math.hypot(s.x-blueBase.x,s.y-blueBase.y)<=s.r+Math.max(blueBase.w,blueBase.h)/2);
 if(spotted)state.enemyMemory.base={x:blueBase.x,y:blueBase.y,age:0};
 for(const u of state.units){if(u.team===0&&aiCanSee(u.x,u.y)){const old=state.enemyMemory.targets.find(m=>m.id===u.id);if(old){old.x=u.x;old.y=u.y;old.age=0;}else state.enemyMemory.targets.push({id:u.id,x:u.x,y:u.y,age:0,type:u.type});}}
 for(const m of state.enemyMemory.targets)m.age+=dt;state.enemyMemory.targets=state.enemyMemory.targets.filter(m=>m.age<90);
 if(state.enemyMemory.base)state.enemyMemory.base.age+=dt;
 for(const e of state.effects)e.life-=dt;state.effects=state.effects.filter(e=>e.life>0);
 // The HUD refreshes at most every HUD_REFRESH_MS from the frame loop (actions still call updateHUD() at once).
 const now=performance.now();if(now-hudRefreshedAt>=HUD_REFRESH_MS){hudRefreshedAt=now;updateHUD();}
}
export function loop(ts){if(!last)last=ts;let dt=Math.min((ts-last)/1000,.05);last=ts;update(dt);if(mode==='pvp'&&netRole==='host'&&gameStarted){snapshotClock+=dt;if(snapshotClock>=.18){snapshotClock=0;sendSnapshot();}}draw();requestAnimationFrame(loop);}
