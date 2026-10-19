// @ts-nocheck
// Unit purchase, training queue and deployment in the muster yard (docs/features/units.md).
import { recordTrained, recordUnitDeath } from './stats';
import { H, MAP_TILES, TILE_SIZE, W } from '../config/map';
import { terrainType } from '../map/terrain';
import { addLog, canAfford, ended, gameTime, localTeam, missingText, mode, notifyShortfall, netRole, nextId, normalizeUnitType, paused, setNextId, spend, state } from '../core/game';
import { BUILDING_TYPES, QUEUE_LANE_UPGRADES, SCOUT_VISION, TRAIN_LANES_START, TRAIN_QUEUE_WAITING, specs } from '../config/balance';
import { requestAction } from '../core/actions';
import { baseDir, musterYard } from '../map/bases';
import { updateHUD } from '../ui/hud';

// Dominant axis wins so diagonal movement still picks one of the four painted directions.
// Facing for drawing, one of eight 45° sectors (screen y grows downwards). With a previous facing, the heading must leave
// that sector by FACING_HYSTERESIS radians before the unit turns, so walking along a sector edge does not flicker.
export const FACINGS=['right','down-right','down','down-left','left','up-left','up','up-right'];
const FACING_HYSTERESIS=Math.PI/18;
export function facingFrom(dx,dy,prev){
 const a=Math.atan2(dy,dx),step=Math.PI/4,p=FACINGS.indexOf(prev);
 if(p>=0){let d=Math.abs(a-p*step)%(Math.PI*2);if(d>Math.PI)d=Math.PI*2-d;if(d<=step/2+FACING_HYSTERESIS)return prev;}
 return FACINGS[((Math.round(a/step)%8)+8)%8];
}
export function unitVisionRadius(type){switch(normalizeUnitType(type)){case 'spearman':return 150;case 'archer':return 130;case 'scout':return SCOUT_VISION;default:return 105;}}
export function spawn(team,type,x,y,queueIfBlocked=true,pendingOrder='hold'){
 const spec=specs[type],left=team===0;
 const base=state.bases.find(b=>b.team===team)||{team,x:left?75:W-75,y:H/2,w:TILE_SIZE*5.5,h:TILE_SIZE*5};
 const yard=musterYard(base),radius=spec.r||9,forward=baseDir(base),spacing=radius*2+5;
 const terrainBlocked=(ax,ay)=>{if(ax<radius||ay<radius||ax>=W-radius||ay>=H-radius)return true;const gx=Math.floor(ax/TILE_SIZE),gy=Math.floor(ay/TILE_SIZE),terrain=terrainType[gy*MAP_TILES+gx];return terrain===2||terrain===3;};
 const inYard=(ax,ay)=>Math.abs(ax-yard.x)<=yard.w/2-radius&&Math.abs(ay-yard.y)<=yard.h/2-radius;
 const occupied=(ax,ay)=>(!inYard(ax,ay)||terrainBlocked(ax,ay)||state.units.some(u=>Math.hypot(u.x-ax,u.y-ay)<radius+(specs[u.type]?.r||9)+3)||state.buildings.some(b=>Math.abs(b.x-ax)<BUILDING_TYPES[b.kind].halfW+radius&&Math.abs(b.y-ay)<BUILDING_TYPES[b.kind].halfH+radius)||state.bases.some(b=>Math.hypot(b.x-ax,b.y-ay)<radius+Math.max(b.w||74,b.h||92)*.42));
 const sameTypeCount=state.units.filter(u=>u.team===team&&u.type===type).length,col=sameTypeCount%4,row=Math.floor(sameTypeCount/4);
 let px=yard.x+forward*row*spacing,py=yard.y+(col-1.5)*spacing,found=false;
 if(!occupied(px,py))found=true;
 if(!found){outer:for(let rowIndex=-3;rowIndex<=3;rowIndex++)for(let colIndex=-2;colIndex<=2;colIndex++){const ax=yard.x+forward*rowIndex*18,ay=yard.y+colIndex*20;if(occupied(ax,ay))continue;px=ax;py=ay;found=true;break outer;}}
 if(!found){
  const blocked=(ax,ay)=>terrainBlocked(ax,ay)||state.units.some(u=>Math.hypot(u.x-ax,u.y-ay)<radius+(specs[u.type]?.r||9)+3)||state.buildings.some(b=>Math.abs(b.x-ax)<BUILDING_TYPES[b.kind].halfW+radius&&Math.abs(b.y-ay)<BUILDING_TYPES[b.kind].halfH+radius)||state.bases.some(b=>Math.hypot(b.x-ax,b.y-ay)<radius+Math.max(b.w||74,b.h||92)*.42);
  around:for(let ring=1;ring<=8;ring++)for(let k=0;k<16;k++){const a=k*Math.PI/8,ax=yard.x+Math.cos(a)*ring*TILE_SIZE*.8,ay=yard.y+Math.sin(a)*ring*TILE_SIZE*.8;if(blocked(ax,ay))continue;px=ax;py=ay;found=true;break around;}
 }
 if(!found){if(!queueIfBlocked)return null;state.pendingSpawns??=[];state.pendingSpawns.push({id:(setNextId(nextId+1)-1),team,type,order:pendingOrder,queuedAt:gameTime});if(team===localTeam())addLog(`Sân tập kết đã kín; ${spec.name} đang chờ chỗ trống.`);return null;}
 const unit={id:(setNextId(nextId+1)-1),team,type,x:px,y:py,hp:spec.hp,max:spec.hp,attackTimer:Math.random()*.35,order:'hold',target:null,dest:null,selected:false,walk:Math.random()*6,moving:false};state.units.push(unit);return unit;
}
export function processPendingSpawns(){
 if(!state?.pendingSpawns?.length)return;
 for(let i=0;i<state.pendingSpawns.length;){
  const pending=state.pendingSpawns[i],unit=spawn(pending.team,pending.type,undefined,undefined,false);
  if(!unit){i++;continue;}
  unit.id=pending.id;unit.order=pending.order||'hold';state.pendingSpawns.splice(i,1);
  if(pending.team===localTeam())addLog(`Đã xuất quân ${specs[pending.type].name} từ hàng chờ.`);
 }
}
// Why `team` cannot recruit `type` right now ('' when it can). The host runs it inside buy(); the guest runs it on its
// snapshot before sending, so a refused purchase is explained on the guest's screen too (host logs only reach the host).
export function trainQueueOf(team){return (state.trainQueue||[]).filter(q=>q.team===team);}
// Training lanes (economy & queue V2): the first lanesOf(team) entries of a side's queue train at the same time; up to
// TRAIN_QUEUE_WAITING more wait. Extra lanes are bought with buyQueueLane().
export function lanesOf(team){return state?.queueLanes?.[team]??TRAIN_LANES_START;}
export function queueCapacity(team){return lanesOf(team)+TRAIN_QUEUE_WAITING;}
export function laneUpgradeOf(team){return state?.laneUpgrade?.[team]||null;}
// Price and time of the next lane, or null once every lane in QUEUE_LANE_UPGRADES is open.
export function nextLaneOffer(team){const i=lanesOf(team)-TRAIN_LANES_START;return QUEUE_LANE_UPGRADES[i]?{lane:lanesOf(team)+1,...QUEUE_LANE_UPGRADES[i]}:null;}
export function laneProblem(team){
 if(ended)return 'Trận đấu đã kết thúc.';
 if(paused)return 'Trận đấu đang tạm dừng.';
 const up=laneUpgradeOf(team);if(up)return `Đang mở hàng đợi thứ ${up.lane}.`;
 const offer=nextLaneOffer(team);if(!offer)return 'Đã mở hết các hàng đợi trong bảng giá.';
 if(!canAfford(team,offer.cost))return `Không đủ tài nguyên để mở hàng đợi thứ ${offer.lane}: thiếu ${missingText(team,offer.cost)}.`;
 return '';
}
// Pay once, then the lane opens when its time runs out (updateQueueLanes); training in progress is not touched.
export function buyQueueLane(team=localTeam()){
 const problem=laneProblem(team),offer=nextLaneOffer(team);
 if(problem){if(team===localTeam()){addLog(problem);if(offer)notifyShortfall(team,offer.cost);}return false;}
 spend(team,offer.cost);
 state.laneUpgrade??=[null,null];state.laneUpgrade[team]={lane:offer.lane,left:offer.seconds,total:offer.seconds};
 if(team===localTeam())addLog(`Đang mở hàng đợi thứ ${offer.lane} (${offer.seconds} giây).`);
 updateHUD();return true;
}
export function updateQueueLanes(dt){
 for(const team of [0,1]){
  const up=laneUpgradeOf(team);if(!up)continue;
  up.left-=dt;if(up.left>1e-6)continue;
  state.queueLanes??=[TRAIN_LANES_START,TRAIN_LANES_START];state.queueLanes[team]=up.lane;state.laneUpgrade[team]=null;
  if(team===localTeam())addLog(`Đã mở hàng đợi thứ ${up.lane}: ${up.lane} quân huấn luyện cùng lúc.`);
  updateHUD();
 }
}
export function requestBuyLane(){if(mode==='pvp'&&netRole==='guest'){const problem=laneProblem(localTeam());if(problem){addLog(problem);const o=nextLaneOffer(localTeam());if(o)notifyShortfall(localTeam(),o.cost);return;}}requestAction('buyLane',{});}
export function buyProblem(type,team){
 if(!Object.hasOwn(specs,type))return 'Loại quân không hợp lệ.';
 if(ended)return 'Trận đấu đã kết thúc.';
 if(paused)return 'Trận đấu đang tạm dừng.';
 const s=specs[type];
 if(type==='scout'&&state.units.filter(u=>u.team===team&&u.type==='scout'&&u.hp>0).length+state.pendingSpawns.filter(u=>u.team===team&&u.type==='scout').length+trainQueueOf(team).filter(q=>q.type==='scout').length>=2)return 'Mỗi phe chỉ được có tối đa 2 lính trinh sát cùng lúc.';
 if(trainQueueOf(team).length>=queueCapacity(team))return `Hàng đợi huấn luyện đã đầy (${lanesOf(team)} đang luyện + ${TRAIN_QUEUE_WAITING} chờ).`;
 if(!canAfford(team,s.cost))return 'Không đủ tài nguyên để tạo '+s.name+': thiếu '+missingText(team,s.cost)+'.';
 return '';
}
export function buy(type,team=localTeam()){
 const problem=buyProblem(type,team);
 if(problem){if(team===localTeam()&&Object.hasOwn(specs,type)){addLog(problem);notifyShortfall(team,specs[type].cost);}return;}
 const s=specs[type];spend(team,s.cost);queueTraining(team,type);
 if(team===localTeam())addLog(`Đã xếp ${s.name} vào hàng huấn luyện (${s.train} giây).`);updateHUD();
}
// Paid units wait in the side's training queue; the first lanesOf(team) train in parallel, then deploy in the muster yard.
export function queueTraining(team,type,order='hold'){state.trainQueue??=[];state.trainQueue.push({id:(setNextId(nextId+1)-1),team,type,order,left:specs[type].train,total:specs[type].train});}
export function updateTraining(dt){
 if(!state.trainQueue?.length)return;
 for(const team of [0,1]){
  for(const q of trainQueueOf(team).slice(0,lanesOf(team))){
  q.left-=dt;if(q.left>1e-6)continue;
  state.trainQueue.splice(state.trainQueue.indexOf(q),1);
  recordTrained(team);
  const unit=spawn(team,q.type,undefined,undefined,true,q.order);
  if(unit){unit.order=q.order;if(team===localTeam())addLog(specs[q.type].name+' đã huấn luyện xong.');}
  updateHUD();
  }
 }
}
// Unit buttons: the guest checks locally first so it sees the reason; the host re-validates every purchase.
export function requestBuy(type){if(mode==='pvp'&&netRole==='guest'){const problem=buyProblem(type,localTeam());if(problem){addLog(problem);if(Object.hasOwn(specs,type))notifyShortfall(localTeam(),specs[type].cost);return;}}requestAction('buy',{unit:type});}
export function commandAttack(team=localTeam(),ids=null){if(ended||paused)return;const wanted=ids?new Set(ids):new Set(state.units.filter(u=>u.team===team&&u.selected).map(u=>u.id));const chosen=state.units.filter(u=>u.team===team&&wanted.has(u.id));for(const u of chosen){u.order='attack';u.dest=null;u.target=null;u.path=null;u.goal=null;}if(team===localTeam())addLog(chosen.length?`${chosen.length} đơn vị được chọn nhận lệnh tấn công!`:'Chưa chọn quân. Hãy chọn lính trước.');}
// Stop (S): the chosen units drop their order and path and hold where they are.
export function stopUnits(team,ids){if(ended||paused)return;const want=new Set(ids||[]);for(const u of state.units)if(u.team===team&&want.has(u.id)){u.order='hold';u.dest=null;u.target=null;u.path=null;u.goal=null;u.moveGroup=null;}}
// Delete: the chosen units are removed from the battlefield (no refund), like deleting units in Age of Empires.
export function deleteUnits(team,ids){if(ended||paused)return;const want=new Set(ids||[]);const before=state.units.length;state.units=state.units.filter(u=>!(u.team===team&&want.has(u.id)));const n=before-state.units.length;for(let i=0;i<n;i++)recordUnitDeath(team,team);if(n&&team===localTeam())addLog(`Đã loại bỏ ${n} quân.`);}
