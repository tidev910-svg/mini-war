// @ts-nocheck
// Player commands: requestAction() routes to the host, applyAction() changes state (docs/architecture.md, multiplayer.md).
import { H, W } from '../config/map';
import { addLog, conn, ended, localTeam, mode, netRole, paused, setPaused, state } from './game';
import { buy, buyQueueLane, commandAttack, deleteUnits, stopUnits } from '../sim/units';
import { setNetStatus } from '../net/peer';
import { updateHUD } from '../ui/hud';
import { buildTurret, buildingPlacementProblem, placeBuilding, startOutpost, startUpgrade } from '../sim/buildings';
import { assignGroupMove } from '../sim/movement';

export function requestAction(action,payload={}){
 if(mode==='pvp'&&netRole==='guest'){
  if(conn&&conn.open)conn.send({type:'action',action,payload});else setNetStatus('Chưa kết nối với chủ phòng.');
  return;
 }
 applyAction(localTeam(),action,payload);
}
export function applyAction(team,action,payload={}){
 if(action==='buy')buy(payload.unit,team);
 else if(action==='build')placeBuilding(team,String(payload.kind),Number(payload.x),Number(payload.y));
 else if(action==='upgrade')startUpgrade(team,'farm',payload.id==null?null:Number(payload.id));
 else if(action==='outpost')startOutpost(team,payload.regionId==null?null:Number(payload.regionId));
 else if(action==='turret')buildTurret(team);
 else if(action==='buyLane')buyQueueLane(team); // open the next training lane (economy & queue V2)
 else if(action==='stop')stopUnits(team,payload.ids);
 else if(action==='delete')deleteUnits(team,payload.ids);
 else if(action==='attack')commandAttack(team,payload.ids);
 else if(action==='move'){
  if(ended||paused)return;
  const ids=new Set(payload.ids||[]);
  const x=Math.max(25,Math.min(W-25,Number(payload.x)||0));
  const y=Math.max(45,Math.min(H-30,Number(payload.y)||0));
  // Give every selected unit a unique formation slot around the clicked destination,
  // instead of sending the whole group to exactly the same point.
  const chosen=state.units.filter(u=>u.team===team&&ids.has(u.id));
  if(chosen.length){
  const spacing=34;
   const cols=Math.ceil(Math.sqrt(chosen.length));
   const rows=Math.ceil(chosen.length/cols);
   const halfW=(cols-1)*spacing/2,halfH=(rows-1)*spacing/2;
   // Shift the whole formation inward near map edges so slots do not pile up on a clamp boundary.
   const cx=Math.max(25+halfW,Math.min(W-25-halfW,x));
   const cy=Math.max(45+halfH,Math.min(H-30-halfH,y));
   const slots=chosen.map((u,i)=>{const col=i%cols,row=Math.floor(i/cols);return {x:cx+(col-(cols-1)/2)*spacing,y:cy+(row-(rows-1)/2)*spacing};});
   // Each unit walks its own path around water and rock to its slot (one shared flow field for the group).
   assignGroupMove(chosen,slots,cx,cy);
  }
 }
 else if(action==='pause'){if(!ended){setPaused(!!payload.paused);updateHUD();}}
 else if(action==='moveFarm'){
  const f=state.buildings.find(b=>b.id===Number(payload.id)&&b.team===team&&b.kind==='farm');if(!f||ended||paused)return;
  const nx=Math.max(33,Math.min(W-33,Number(payload.x)||0)),ny=Math.max(36,Math.min(H-36,Number(payload.y)||0));
  const problem=buildingPlacementProblem(team,'farm',nx,ny,f);
  if(problem){if(team===localTeam())addLog('Không thể chuyển nông trại: '+problem);return;}
  f.x=nx;f.y=ny;
 }
 updateHUD();
}
