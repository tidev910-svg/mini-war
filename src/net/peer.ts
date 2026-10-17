// @ts-nocheck
// PeerJS rooms: create/join, connection and message handling (docs/features/multiplayer.md).
import { DEFAULT_ZOOM, centerCameraOnHome, setZoom, zoom } from '../core/view';
import { MAP_TILES } from '../config/map';
import { $, addLog, conn, connectionIntent, draggingFarm, gameStarted, localSelectedIds, mode, netRole, paused, peer, roomCode, setConn, setConnectionIntent, setGameStarted, setMode, setNetRole, setPaused, setPeer, setRoomCode, state } from '../core/game';
import { fresh } from '../core/match';
import { hideModeScreen, setGameModeLabel, showFriendPanel, showModeScreen } from '../ui/modeScreen';
import { applySnapshot, sendSnapshot } from './snapshot';
import { revealHomeTerritory } from '../sim/fog';
import { applyAction } from '../core/actions';
import { ensureRegionMap } from '../map/regions';
import { updateHUD } from '../ui/hud';

export function roomPeerId(code){return 'miniwarr'+code.toLowerCase().replace(/[^a-z0-9]/g,'');}
export function setNetStatus(msg){const el=$('netStatus');if(el)el.textContent=msg;}
export function destroyPeer(){try{if(conn){conn.close();}}catch{}try{if(peer){peer.destroy();}}catch{}setConn(null);setPeer(null);setNetRole(null);setRoomCode('');}
export function ensurePeerJs(){
 if(window.Peer)return Promise.resolve();
 if(window._peerJsPromise)return window._peerJsPromise;
 window._peerJsPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';script.async=true;
  script.onload=()=>window.Peer?resolve():reject(new Error('Không tải được thư viện kết nối.'));
  script.onerror=()=>reject(new Error('Không tải được PeerJS. Hãy kiểm tra Internet rồi thử lại.'));
  document.head.appendChild(script);
 });return window._peerJsPromise;
}
export function startHostGame(){
 setMode('pvp');setNetRole('host');setGameStarted(true);localSelectedIds.clear();$('feed').innerHTML='';fresh();hideModeScreen();setGameModeLabel();addLog('Phòng 1 đấu 1 đã mở. Bạn là quân xanh.');sendSnapshot();
}
export function startGuestFromSnapshot(packet){
 setMode('pvp');setNetRole('guest');setGameStarted(true);hideModeScreen();setGameModeLabel();
 // Drop the fog this browser made for its own pre-lobby map, then reveal the host's real home territories.
 if(state){state.fogSeen=new Uint8Array(MAP_TILES*MAP_TILES);state.enemyFogSeen=new Uint8Array(MAP_TILES*MAP_TILES);}
 applySnapshot(packet);ensureRegionMap();revealHomeTerritory();setZoom(DEFAULT_ZOOM);centerCameraOnHome();addLog('Đã vào phòng. Bạn là quân đỏ.');
}
export function createRoom(){
 if(peer||conn)destroyPeer();setConnectionIntent('host');setNetStatus('Đang khởi tạo phòng...');$('createRoom').disabled=true;$('joinRoom').disabled=true;
 ensurePeerJs().then(()=>{
  let attempts=0;
  const tryCreate=()=>{
   attempts++;setRoomCode(Math.random().toString(36).slice(2,8).toUpperCase().padEnd(6,'X').slice(0,6));
   setPeer(new Peer(roomPeerId(roomCode)));
   peer.on('open',id=>{
    $('roomCode').textContent=roomCode;$('roomWaiting').classList.add('show');$('friendActions').style.display='none';
    const url=new URL(window.location.href);url.searchParams.set('room',roomCode);window._miniWarInviteUrl=url.href;
    setNetStatus('Đang chờ bạn bè tham gia... Hãy gửi mã hoặc link mời.');
   });
   peer.on('connection',incoming=>{
    if(conn&&conn.open){incoming.close();return;}
    setConn(incoming);setNetRole('host');
    setupConnection(incoming,'host');
   });
   peer.on('error',err=>{
    const msg=String(err?.type||err?.message||err);
    if(msg.includes('unavailable-id')&&attempts<5){try{peer?.destroy();}catch{}setPeer(null);setTimeout(tryCreate,150);return;}
    setNetStatus('Lỗi tạo phòng: '+msg+'. Thử tạo phòng mới.');$('createRoom').disabled=false;$('joinRoom').disabled=false;
   });
  };tryCreate();
 }).catch(err=>{setNetStatus(err.message);$('createRoom').disabled=false;$('joinRoom').disabled=false;});
}
export function joinRoom(){
 const code=String($('roomInput').value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
 if(code.length<4){setNetStatus('Nhập mã phòng hợp lệ (ít nhất 4 ký tự).');return;}
 if(peer||conn)destroyPeer();setConnectionIntent('guest');setRoomCode(code);setNetStatus('Đang kết nối tới phòng '+code+'...');$('createRoom').disabled=true;$('joinRoom').disabled=true;
 ensurePeerJs().then(()=>{
  setPeer(new Peer());
  peer.on('open',()=>{
   setConn(peer.connect(roomPeerId(code),{reliable:true}));
   setupConnection(conn,'guest');
  });
  peer.on('error',err=>{setNetStatus('Lỗi kết nối: '+(err?.type||err?.message||err)+'. Kiểm tra mã phòng và thử lại.');$('createRoom').disabled=false;$('joinRoom').disabled=false;});
 }).catch(err=>{setNetStatus(err.message);$('createRoom').disabled=false;$('joinRoom').disabled=false;});
}
export function setupConnection(connection,role){
 connection.on('open',()=>{
  if(role==='host'){
   if(!gameStarted||mode!=='pvp') startHostGame();
   else {setPaused(false);updateHUD();sendSnapshot();}
   setNetStatus('Đã có đối thủ kết nối. Trận đấu bắt đầu!');
  }else{
   setNetStatus('Đã kết nối, đang nhận dữ liệu trận đấu...');
   connection.send({type:'hello',room:roomCode});
  }
 });
 connection.on('data',data=>{
  if(!data||typeof data!=='object')return;
  if(role==='host'&&data.type==='action'){
   // All guest commands are validated and applied by the host simulation.
   applyAction(1,data.action,data.payload||{});sendSnapshot();
  }else if(role==='guest'&&data.type==='snapshot'){
   if(draggingFarm){window._miniWarQueuedSnapshot=data;return;}
   if(!gameStarted||mode!=='pvp')startGuestFromSnapshot(data);else applySnapshot(data);
   setNetStatus('Đã kết nối với chủ phòng · '+(paused?'Trận đang tạm dừng':'Đang chơi trực tuyến'));
  }else if(role==='host'&&data.type==='hello'){
   sendSnapshot();setNetStatus('Đã có đối thủ kết nối. Trận đấu bắt đầu!');
  }
 });
 connection.on('close',()=>{
  if(conn===connection)setConn(null);
  if(role==='host'){setPaused(true);updateHUD();setNetStatus('Đối thủ đã ngắt kết nối. Trận đang tạm dừng. Bạn có thể gửi lại mã phòng để kết nối lại.');addLog('Đối thủ đã rời phòng.');}
  else{
   const lastRoom=roomCode;destroyPeer();setGameStarted(false);showModeScreen();showFriendPanel();
   $('createRoom').disabled=false;$('joinRoom').disabled=false;$('friendActions').style.display='block';$('roomWaiting').classList.remove('show');
   if(lastRoom)$('roomInput').value=lastRoom;
   setNetStatus('Đã mất kết nối với chủ phòng. Bấm “Tham gia phòng” để vào lại.');
  }
 });
 connection.on('error',err=>setNetStatus('Lỗi kết nối: '+(err?.message||err)));
}
