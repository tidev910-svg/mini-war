// @ts-nocheck
// Host → guest state snapshots (docs/features/multiplayer.md).
import { revealOpenedCamps } from '../sim/creeps';
import { MAP_TILES } from '../config/map';
import { $, conn, ended, gameTime, localSelectedIds, localTeam, mode, netRole, normalizeUnitType, paused, selected, selectedBuilding, selectedFortress, setEnded, setGameTime, setPaused, setSelected, setSelectedBuilding, setSelectedFortress, setState, state } from '../core/game';
import { setNetStatus } from './peer';
import { revealTeamVision } from '../sim/fog';
import { ensureRegionMap } from '../map/regions';
import { useMap } from '../map/terrain';
import { setPauseButton, updateHUD } from '../ui/hud';
import { showMatchStats } from '../ui/results';

export function serializeSnapshot(){
 // Keep explored fog maps local to each browser; serialize only live simulation state.
 const {fogSeen,enemyFogSeen,...clean}=state;
 clean.units=state.units.map(u=>({...u,type:normalizeUnitType(u.type),selected:false,target:null}));
 clean.bullets=state.bullets.map(b=>({...b,target:null}));
 clean.pendingSpawns=(state.pendingSpawns||[]).map(p=>({...p,type:normalizeUnitType(p.type)}));
 return {type:'snapshot',gameTime,paused,ended,state:clean,resultTitle:$('resultTitle').textContent,resultText:$('resultText').textContent};
}
// Host sends a snapshot this often (seconds; plus one right after each action, see peer.ts).
export const SNAPSHOT_INTERVAL=.18;
// Guest-side smoothing: each unit glides from where it was drawn to its new snapshot position over SNAPSHOT_INTERVAL,
// instead of jumping five times a second. Jumps longer than SNAPSHOT_TELEPORT (spawn, a unit leaving a flag) snap.
// Display only: the guest runs no simulation and the host keeps the real positions.
export const SNAPSHOT_TELEPORT=180;
export function smoothGuestUnits(dt){
 if(!state?.units)return;
 for(const u of state.units){
  if(u.lerpTo==null)continue;
  u.lerpT=Math.min(1,(u.lerpT||0)+dt/SNAPSHOT_INTERVAL);
  u.x=u.lerpFrom.x+(u.lerpTo.x-u.lerpFrom.x)*u.lerpT;u.y=u.lerpFrom.y+(u.lerpTo.y-u.lerpFrom.y)*u.lerpT;
  if(u.lerpT>=1){u.lerpFrom=u.lerpTo=null;}
 }
}
export function sendSnapshot(){if(mode!=='pvp'||netRole!=='host'||!conn||conn.open!==true)return;try{conn.send(serializeSnapshot());}catch(e){setNetStatus('Không gửi được trạng thái trận đấu.');}}
export function applySnapshot(packet){
 if(!packet?.state)return;
 const oldFog=state?.fogSeen instanceof Uint8Array&&state.fogSeen.length===MAP_TILES*MAP_TILES?state.fogSeen:new Uint8Array(MAP_TILES*MAP_TILES);
 const oldEnemyFog=state?.enemyFogSeen instanceof Uint8Array&&state.enemyFogSeen.length===MAP_TILES*MAP_TILES?state.enemyFogSeen:new Uint8Array(MAP_TILES*MAP_TILES);
 const drawn=new Map((state?.units||[]).map(u=>[u.id,u])),picked=new Set(localSelectedIds),hadFortressSelected=!!selectedFortress,selectedBuildingId=selectedBuilding?.id;
 // The host's map: rebuild the ground first, the region map and paths depend on it (realms-map.md). The scenery is
 // rebuilt by startGuestFromSnapshot() (net/peer.ts) when the guest joins, the only time the map can change.
 useMap(packet.state.mapId);
 setState(packet.state);ensureRegionMap();state.units=(state.units||[]).map(u=>glideFrom(drawn.get(u.id),{...u,type:normalizeUnitType(u.type)}));state.pendingSpawns=(state.pendingSpawns||[]).map(p=>({...p,type:normalizeUnitType(p.type)}));state.visualEvents??=[];setSelectedFortress(hadFortressSelected?state.bases.find(b=>b.team===localTeam())||null:null);state.pendingSpawns??=[];state.fogSeen=oldFog;state.enemyFogSeen=oldEnemyFog;
 setGameTime(Number(packet.gameTime)||0);setPaused(!!packet.paused);setEnded(!!packet.ended);
 const hostWon=String(packet.resultTitle||'').includes('CHIẾN THẮNG!');
 const localWon=localTeam()===0?hostWon:!hostWon;
 $('resultTitle').textContent=ended?(localWon?'🏆 CHIẾN THẮNG!':'💥 THẤT THỦ!'):(packet.resultTitle||'Trận đấu kết thúc');
 $('resultText').textContent=ended?(localWon?'Bạn đã phá hủy căn cứ đối phương. Chỉ huy xuất sắc!':'Căn cứ của bạn đã bị phá hủy. Hãy thử chiến thuật khác!'):(packet.resultText||'');
 setPauseButton();
 for(const u of state.units){u.selected=picked.has(u.id)&&u.team===localTeam();}
 setSelectedBuilding(state.buildings.find(b=>b.id===selectedBuildingId)||null);
 setSelected(state.units.find(u=>u.selected)||null);
 revealTeamVision(0);revealTeamVision(1);revealOpenedCamps();updateHUD();
 if(ended){if(!$('overlay').classList.contains('show'))showMatchStats();$('overlay').classList.add('show');}else $('overlay').classList.remove('show');
}
// Start the glide of a fresh snapshot unit `u` from where `prev` (the same unit in the last snapshot) is drawn now.
function glideFrom(prev,u){
 if(!prev||Math.hypot(u.x-prev.x,u.y-prev.y)>SNAPSHOT_TELEPORT||(u.x===prev.x&&u.y===prev.y))return u;
 u.lerpFrom={x:prev.x,y:prev.y};u.lerpTo={x:u.x,y:u.y};u.lerpT=0;u.x=prev.x;u.y=prev.y;return u;
}
