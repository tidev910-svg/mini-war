// @ts-nocheck
// Host → guest state snapshots (docs/features/multiplayer.md).
import { MAP_TILES } from '../config/map';
import { $, conn, ended, gameTime, localSelectedIds, localTeam, mode, netRole, normalizeUnitType, paused, selected, selectedBuilding, selectedFortress, setEnded, setGameTime, setPaused, setSelected, setSelectedBuilding, setSelectedFortress, setState, state } from '../core/game';
import { setNetStatus } from './peer';
import { revealTeamVision } from '../sim/fog';
import { ensureRegionMap } from '../map/regions';
import { updateHUD } from '../ui/hud';

export function serializeSnapshot(){
 // Keep explored fog maps local to each browser; serialize only live simulation state.
 const {fogSeen,enemyFogSeen,...clean}=state;
 clean.units=state.units.map(u=>({...u,type:normalizeUnitType(u.type),selected:false,target:null}));
 clean.bullets=state.bullets.map(b=>({...b,target:null}));
 clean.pendingSpawns=(state.pendingSpawns||[]).map(p=>({...p,type:normalizeUnitType(p.type)}));
 return {type:'snapshot',gameTime,paused,ended,state:clean,resultTitle:$('resultTitle').textContent,resultText:$('resultText').textContent};
}
export function sendSnapshot(){if(mode!=='pvp'||netRole!=='host'||!conn||conn.open!==true)return;try{conn.send(serializeSnapshot());}catch(e){setNetStatus('Không gửi được trạng thái trận đấu.');}}
export function applySnapshot(packet){
 if(!packet?.state)return;
 const oldFog=state?.fogSeen instanceof Uint8Array&&state.fogSeen.length===MAP_TILES*MAP_TILES?state.fogSeen:new Uint8Array(MAP_TILES*MAP_TILES);
 const oldEnemyFog=state?.enemyFogSeen instanceof Uint8Array&&state.enemyFogSeen.length===MAP_TILES*MAP_TILES?state.enemyFogSeen:new Uint8Array(MAP_TILES*MAP_TILES);
 const picked=new Set(localSelectedIds),hadFortressSelected=!!selectedFortress,selectedBuildingId=selectedBuilding?.id;
 setState(packet.state);ensureRegionMap();state.units=(state.units||[]).map(u=>({...u,type:normalizeUnitType(u.type)}));state.pendingSpawns=(state.pendingSpawns||[]).map(p=>({...p,type:normalizeUnitType(p.type)}));setSelectedFortress(hadFortressSelected?state.bases.find(b=>b.team===localTeam())||null:null);state.pendingSpawns??=[];state.fogSeen=oldFog;state.enemyFogSeen=oldEnemyFog;
 setGameTime(Number(packet.gameTime)||0);setPaused(!!packet.paused);setEnded(!!packet.ended);
 const hostWon=String(packet.resultTitle||'').includes('CHIẾN THẮNG!');
 const localWon=localTeam()===0?hostWon:!hostWon;
 $('resultTitle').textContent=ended?(localWon?'🏆 CHIẾN THẮNG!':'💥 THẤT THỦ!'):(packet.resultTitle||'Trận đấu kết thúc');
 $('resultText').textContent=ended?(localWon?'Bạn đã phá hủy căn cứ đối phương. Chỉ huy xuất sắc!':'Căn cứ của bạn đã bị phá hủy. Hãy thử chiến thuật khác!'):(packet.resultText||'');
 $('pause').innerHTML=paused?'▶ Tiếp tục<span>Tiếp tục trận đấu</span>':'Ⅱ Tạm dừng<span>Dừng / tiếp tục</span>';
 for(const u of state.units){u.selected=picked.has(u.id)&&u.team===localTeam();}
 setSelectedBuilding(state.buildings.find(b=>b.id===selectedBuildingId)||null);
 setSelected(state.units.find(u=>u.selected)||null);
 revealTeamVision(0);revealTeamVision(1);updateHUD();
 if(ended)$('overlay').classList.add('show');else $('overlay').classList.remove('show');
}
