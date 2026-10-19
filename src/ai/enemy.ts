// @ts-nocheck
// Red-side AI for single-player mode (docs/features/ai-opponent.md).
import { REGION_TYPES, TILE_SIZE } from '../config/map';
import { canAfford, gameTime, spend, state, teamResources } from '../core/game';
import { AI_CAPTURE_SQUAD, AI_CAPTURE_TARGET_INTERVAL, AI_MAX_CAPTURE_TARGETS, BUILDING_TYPES, FARM_LEVELS, FLAG_CAPTURE_RADIUS_TILES, FORTRESS_GUN_COST, specs } from '../config/balance';
import { queueTraining, trainQueueOf } from '../sim/units';
import { foodPerMinute, upkeepPerMinute } from '../sim/economy';
import { isTeamAreaExplored } from '../sim/fog';
import { activeFortressGuns } from '../map/bases';
import { aiLevel, runAttackPlan } from './attack';
import { buildTurret, buildingDone, findBuildSpot, needsBuilder, outpostRegions, placeBuilding, startOutpost, startUpgrade } from '../sim/buildings';

// Economic AI for the red side (ai-opponent.md). Runs every 5 seconds; each step spends only when affordable.
// A random point within half the capture radius of a flag, so a squad spreads out instead of stacking.
export function flagStandSpot(r){const a=Math.random()*Math.PI*2,d=Math.random()*FLAG_CAPTURE_RADIUS_TILES*TILE_SIZE*.5;return {x:r.cp.x+Math.cos(a)*d,y:r.cp.y+Math.sin(a)*d};}
export function runEnemyAI(){
 const team=1,base=state.bases[1],res=teamResources(1),T=TILE_SIZE;
 const own=state.buildings.filter(b=>b.team===team),count=kind=>own.filter(b=>b.kind===kind).length;
 const underway=kind=>own.some(b=>b.kind===kind&&!buildingDone(b));
 const build=(kind,ax,ay,minR,maxR)=>{if(!canAfford(team,BUILDING_TYPES[kind].cost))return false;const spot=findBuildSpot(team,kind,ax,ay,minR,maxR);return !!(spot&&placeBuilding(team,kind,spot.x,spot.y));};
 const regionHas=(r,k)=>r.resource===k;
 // 1. The fortress income (FORTRESS_INCOME_PER_MINUTE) gives the AI food and some of every resource from the start.
 // 2. Food: two farms to start, then only as many as the army needs (+10 lúa/phút of slack).
 const farmsUnderway=own.filter(b=>b.kind==='farm'&&!buildingDone(b)).length;
 const net=foodPerMinute(team)+farmsUnderway*FARM_LEVELS[1].food-upkeepPerMinute(team);
 if((count('farm')<2||net<10)&&count('farm')<10&&farmsUnderway<2)build('farm',base.x,base.y,T*3,T*10);
 // Resource types the AI has no mine for yet; flags of those regions come first.
 const earning=k=>state.mines.some(m=>m.owner===team&&m.resource===k);
 const wanted=REGION_TYPES.filter(k=>!earning(k));
 // 3. Territory: send small squads to stand at flags the AI has seen and does not own (neutral first, regions with a
 // missing resource first, then nearest), more flags at once as the match goes on.
 const squad=r=>state.units.filter(u=>u.team===team&&u.hp>0&&u.captureTarget===r.id);
 const flags=state.regions.filter(r=>r.cp&&r.owner!==team&&isTeamAreaExplored(team,r.cp.x,r.cp.y))
  .sort((a,b)=>(a.owner>=0)-(b.owner>=0)||wanted.some(k=>regionHas(b,k))-wanted.some(k=>regionHas(a,k))||Math.hypot(a.cp.x-base.x,a.cp.y-base.y)-Math.hypot(b.cp.x-base.x,b.cp.y-base.y));
 const active=flags.filter(r=>squad(r).length).length,limit=Math.min(AI_MAX_CAPTURE_TARGETS,1+Math.floor(gameTime/AI_CAPTURE_TARGET_INTERVAL));
 for(const r of flags){
  const have=squad(r).length;if(!have&&active>=limit)continue;
  const need=(r.owner>=0||r.contested?AI_CAPTURE_SQUAD*2:AI_CAPTURE_SQUAD)-have;if(need<=0)continue;
  // Nearest free fighters (scouts cannot capture).
  const free=state.units.filter(u=>u.team===team&&u.hp>0&&u.type!=='scout'&&!u.buildTarget&&u.captureTarget==null&&!u.aiRole).sort((p,q)=>Math.hypot(p.x-r.cp.x,p.y-r.cp.y)-Math.hypot(q.x-r.cp.x,q.y-r.cp.y));
  for(const u of free.slice(0,need)){u.captureTarget=r.id;u.dest=flagStandSpot(r);u.order='explore';}
  if(!have&&free.length)break;
 }
 // Builders: each outpost under construction gets the nearest free unit.
 for(const b of own.filter(needsBuilder)){
  if(state.units.some(u=>u.team===team&&u.hp>0&&u.buildTarget===b.id))continue;
  const free=state.units.filter(u=>u.team===team&&u.hp>0&&!u.buildTarget&&!u.aiRole).sort((p,q)=>Math.hypot(p.x-b.x,p.y-b.y)-Math.hypot(q.x-b.x,q.y-b.y));
  if(free[0]){free[0].buildTarget=b.id;free[0].dest={x:b.x,y:b.y+30};free[0].order='explore';}
 }
 // 4. Upgrades and defence when stone and gold allow.
 if(gameTime>45&&res.stone>=120)startUpgrade(team,'farm');
 if(res.stone>=180&&res.wood>=260&&outpostRegions(team).length)startOutpost(team);
 if(count('tower')<2&&canAfford(team,BUILDING_TYPES.tower.cost)&&Math.random()<.35){
  const anchors=[base,...state.regions.filter(r=>r.cp&&r.owner===team).map(r=>r.cp)];const a=anchors[Math.floor(Math.random()*anchors.length)];
  build('tower',a.x,a.y,a===base?T*5:50,a===base?T*12:180);
 }
 // 5. Units, recruited at the fortress, never past what the farms can feed.
 const training=trainQueueOf(team),aiScouts=state.units.filter(u=>u.team===team&&u.type==='scout'&&u.hp>0).length+state.pendingSpawns.filter(u=>u.team===team&&u.type==='scout').length+training.filter(q=>q.type==='scout').length;
 // Queued and training units are already paid for and will eat once they deploy, so their upkeep counts against the food margin.
 // The AI keeps at most 2 units in training so it does not hoard paid units in the queue.
 const queuedUpkeep=[...state.pendingSpawns.filter(p=>p.team===team),...training].reduce((t,p)=>t+specs[p.type].upkeep,0);
 const aiBuy=type=>{if(training.length>=aiLevel().maxTraining||!canAfford(team,specs[type].cost)||foodPerMinute(team)-upkeepPerMinute(team)-queuedUpkeep-specs[type].upkeep<0)return false;spend(team,specs[type].cost);queueTraining(team,type,type==='scout'?'explore':'hold');return true;};
 if(aiScouts<2&&aiBuy('scout')){}
 else if(Math.random()<.14&&aiBuy('cavalry')){}
 else if(Math.random()<.42&&aiBuy('spearman')){}
 else if(Math.random()<.6&&aiBuy('archer')){}
 else if(aiBuy('infantry')){}
 else aiBuy('spearman');
 if(activeFortressGuns(base)<2&&canAfford(team,FORTRESS_GUN_COST)&&Math.random()<.25)buildTurret(team);
 // 6. Attack waves and home defence (ai/attack.ts).
 runAttackPlan();
}
