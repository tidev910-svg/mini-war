// @ts-nocheck
// Unit purchase, training queue and deployment in the muster yard (docs/features/units.md).
import { H, MAP_TILES, TILE_SIZE, W } from '../config/map';
import { terrainType } from '../map/terrain';
import { addLog, canAfford, ended, gameTime, localTeam, missingText, mode, netRole, nextId, normalizeUnitType, paused, setNextId, spend, state } from '../core/game';
import { BUILDING_TYPES, TRAIN_QUEUE_MAX, specs } from '../config/balance';
import { requestAction } from '../core/actions';
import { baseDir, musterYard } from '../map/bases';
import { updateHUD } from '../ui/hud';

// Dominant axis wins so diagonal movement still picks one of the four painted directions.
export function facingFrom(dx,dy){return Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');}
export function unitVisionRadius(type){switch(normalizeUnitType(type)){case 'spearman':return 150;case 'archer':return 130;case 'scout':return 145;default:return 105;}}
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
export function buyProblem(type,team){
 if(!Object.hasOwn(specs,type))return 'Loại quân không hợp lệ.';
 if(ended)return 'Trận đấu đã kết thúc.';
 if(paused)return 'Trận đấu đang tạm dừng.';
 const s=specs[type];
 if(type==='scout'&&state.units.filter(u=>u.team===team&&u.type==='scout'&&u.hp>0).length+state.pendingSpawns.filter(u=>u.team===team&&u.type==='scout').length+trainQueueOf(team).filter(q=>q.type==='scout').length>=2)return 'Mỗi phe chỉ được có tối đa 2 lính trinh sát cùng lúc.';
 if(trainQueueOf(team).length>=TRAIN_QUEUE_MAX)return `Hàng đợi huấn luyện đã đầy (${TRAIN_QUEUE_MAX} quân).`;
 if(!canAfford(team,s.cost))return 'Không đủ tài nguyên để tạo '+s.name+': thiếu '+missingText(team,s.cost)+'.';
 return '';
}
export function buy(type,team=localTeam()){
 const problem=buyProblem(type,team);
 if(problem){if(team===localTeam()&&Object.hasOwn(specs,type))addLog(problem);return;}
 const s=specs[type];spend(team,s.cost);queueTraining(team,type);
 if(team===localTeam())addLog(`Đã xếp ${s.name} vào hàng huấn luyện (${s.train} giây).`);updateHUD();
}
// Paid units wait in the side's training queue; only the first one per side trains, then deploys in the muster yard.
export function queueTraining(team,type,order='hold'){state.trainQueue??=[];state.trainQueue.push({id:(setNextId(nextId+1)-1),team,type,order,left:specs[type].train,total:specs[type].train});}
export function updateTraining(dt){
 if(!state.trainQueue?.length)return;
 for(const team of [0,1]){
  const q=state.trainQueue.find(e=>e.team===team);if(!q)continue;
  q.left-=dt;if(q.left>1e-6)continue;
  state.trainQueue.splice(state.trainQueue.indexOf(q),1);
  const unit=spawn(team,q.type,undefined,undefined,true,q.order);
  if(unit){unit.order=q.order;if(team===localTeam())addLog(specs[q.type].name+' đã huấn luyện xong.');}
  updateHUD();
 }
}
// Unit buttons: the guest checks locally first so it sees the reason; the host re-validates every purchase.
export function requestBuy(type){if(mode==='pvp'&&netRole==='guest'){const problem=buyProblem(type,localTeam());if(problem){addLog(problem);return;}}requestAction('buy',{unit:type});}
export function commandAttack(team=localTeam(),ids=null){if(ended||paused)return;const wanted=ids?new Set(ids):new Set(state.units.filter(u=>u.team===team&&u.selected).map(u=>u.id));const chosen=state.units.filter(u=>u.team===team&&wanted.has(u.id));for(const u of chosen){u.order='attack';u.dest=null;u.target=null;}if(team===localTeam())addLog(chosen.length?`${chosen.length} đơn vị được chọn nhận lệnh tấn công!`:'Chưa chọn quân. Hãy chọn lính trước.');}
