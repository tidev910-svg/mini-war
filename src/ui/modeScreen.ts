// @ts-nocheck
// Start screen: AI or friend mode, room panel (docs/features/multiplayer.md, hud-ui.md).
import { $, gameStarted, localSelectedIds, localTeam, mode, netRole, setGameStarted, setMode, setNetRole } from '../core/game';
import { fresh } from '../core/match';
import { destroyPeer } from '../net/peer';

export function showFriendPanel(){ $('modeHome').style.display='none';$('friendPanel').classList.add('show'); }
export function showModeHome(){ $('friendPanel').classList.remove('show');$('modeHome').style.display='block'; }
export function hideModeScreen(){ $('modeScreen').classList.add('hidden'); }
export function showModeScreen(){ $('modeScreen').classList.remove('hidden'); }
export function setGameModeLabel(){
 $('modeStatus').textContent=mode==='pvp'?(netRole==='host'?'Chế độ: Solo với bạn bè · Bạn là quân XANH · Chủ phòng': 'Chế độ: Solo với bạn bè · Bạn là quân ĐỎ'):'Chế độ: Chơi với AI · Offline';
 const labels=document.querySelectorAll('.legend span');if(labels.length>=2){labels[0].innerHTML='<i class="dot" style="background:#4aaaff"></i>'+(localTeam()===0?'Quân xanh của bạn':'Quân xanh đối thủ');labels[1].innerHTML='<i class="dot" style="background:#ff626b"></i>'+(localTeam()===1?'Quân đỏ của bạn':(mode==='pvp'?'Quân đỏ đối thủ':'Quân đỏ của máy'));}
}
export function startAIMode(){
 destroyPeer();setMode('ai');setNetRole(null);setGameStarted(true);localSelectedIds.clear();fresh();hideModeScreen();setGameModeLabel();
}
export const roomFromUrl=new URLSearchParams(window.location.search).get('room');
