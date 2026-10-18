// @ts-nocheck
// Start screen: AI or friend mode, room panel (docs/features/multiplayer.md, hud-ui.md).
import { $, conn, gameStarted, localSelectedIds, localTeam, mode, netRole, setGameStarted, setMode, setNetRole, setPaused } from '../core/game';
import { TEAM_COLORS } from '../config/theme';
import { fresh } from '../core/match';
import { destroyPeer } from '../net/peer';
import { closeMenu, closePanels, confirmAction, drawPortraits } from './panels';
import { setFactionTheme } from './theme';

export function showFriendPanel(){ $('modeHome').style.display='none';$('friendPanel').classList.add('show'); }
export function showModeHome(){ $('friendPanel').classList.remove('show');$('modeHome').style.display='block'; }
export function hideModeScreen(){ $('modeScreen').classList.add('hidden'); }
export function showModeScreen(){ $('modeScreen').classList.remove('hidden'); }
export function setGameModeLabel(){
 $('modeStatus').textContent=mode==='pvp'?(netRole==='host'?'Solo với bạn bè · Chủ phòng': 'Solo với bạn bè · Khách'):'Chơi với AI · Offline';
 $('sideName').textContent=TEAM_COLORS[localTeam()].name;$('crest').classList.toggle('red',localTeam()===1);setFactionTheme(localTeam());drawPortraits();
 const labels=document.querySelectorAll('.legend span');if(labels.length>=2){labels[0].innerHTML='<i class="dot blue"></i>'+(localTeam()===0?'Quân xanh của bạn':'Quân xanh đối thủ');labels[1].innerHTML='<i class="dot red"></i>'+(localTeam()===1?'Quân đỏ của bạn':(mode==='pvp'?'Quân đỏ đối thủ':'Quân đỏ của máy'));}
}
export function startAIMode(){
 destroyPeer();setMode('ai');setNetRole(null);setGameStarted(true);localSelectedIds.clear();fresh();hideModeScreen();setGameModeLabel();
}
// Leave the match (menu → Rời trận, after confirming): drop any P2P room, stop the match and return to the mode screen.
export function leaveMatch(){
 // Leaving on purpose: drop the connection's close handler first so it does not report a lost connection.
 try{conn?.removeAllListeners?.('close');}catch{}
 $('createRoom').disabled=false;$('joinRoom').disabled=false;$('friendActions').style.display='block';$('roomWaiting').classList.remove('show');$('netStatus').textContent='Chưa kết nối.';
 destroyPeer();setMode('ai');setNetRole(null);setGameStarted(false);setPaused(false);closePanels();closeMenu();showModeHome();showModeScreen();}
$('leaveMatch').onclick=()=>confirmAction('Rời trận?',mode==='pvp'?'Trận 1 đấu 1 sẽ kết thúc, kết nối với đối thủ bị ngắt và bạn quay về màn chọn chế độ.':'Trận đấu hiện tại sẽ kết thúc và bạn quay về màn chọn chế độ.','Rời trận',leaveMatch);
export const roomFromUrl=new URLSearchParams(window.location.search).get('room');
