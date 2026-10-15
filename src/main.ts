// @ts-nocheck
// Gradual TypeScript migration: preserve the simulation while Vite hosts it.
import './style.css';

(() => {
const canvas=document.getElementById('game');
const gameApp=document.getElementById('gameApp');
const toggleSideHud=document.getElementById('toggleSideHud');
const portraitMode=window.matchMedia('(max-width: 720px) and (orientation: portrait)').matches;
let VIEW_W=canvas.width,VIEW_H=canvas.height,W=VIEW_W*10,H=W,MAP_TILES=256,TILE_SIZE=W/MAP_TILES;
let MAP_WORLD_W=W,MAP_WORLD_H=H,MIN_ZOOM=Math.min(VIEW_W/MAP_WORLD_W,VIEW_H/MAP_WORLD_H),DEFAULT_ZOOM=VIEW_W/(TILE_SIZE*64),MAX_ZOOM=VIEW_W/(TILE_SIZE*32);
const DEPLOYMENT_LOCK_SECONDS=120,BASE_DEPLOYMENT_RADIUS=TILE_SIZE*8;
let camX=0,camY=0,zoom=DEFAULT_ZOOM;
function syncWorldMetrics(){
  const rect=canvas.getBoundingClientRect();
  const cssWidth=Math.max(540,Math.round(rect.width || canvas.clientWidth || canvas.width));
  const cssHeight=Math.max(320,Math.round(rect.height || canvas.clientHeight || canvas.height));
  const dpr=window.devicePixelRatio||1;
  canvas.width=Math.max(540,Math.round(cssWidth*dpr));
  canvas.height=Math.max(320,Math.round(cssHeight*dpr));
  VIEW_W=canvas.width;VIEW_H=canvas.height;W=VIEW_W*10;H=W;TILE_SIZE=W/MAP_TILES;
  MAP_WORLD_W=W;MAP_WORLD_H=H;MIN_ZOOM=Math.min(VIEW_W/MAP_WORLD_W,VIEW_H/MAP_WORLD_H);DEFAULT_ZOOM=VIEW_W/(TILE_SIZE*64);MAX_ZOOM=VIEW_W/(TILE_SIZE*32);
  zoom=Math.max(MIN_ZOOM,Math.min(zoom || DEFAULT_ZOOM,MAX_ZOOM));
  clampCamera();
}
if(portraitMode){canvas.width=540;canvas.height=960;}else if(window.innerWidth>=900){canvas.width=960;canvas.height=960;}
syncWorldMetrics();
const ctx=canvas.getContext('2d');
const forestRegions=[[.12,.18,.15,.14],[.35,.12,.13,.12],[.73,.14,.16,.13],[.88,.32,.12,.16],[.18,.42,.15,.17],[.72,.43,.13,.16],[.42,.57,.13,.12],[.12,.70,.14,.15],[.85,.72,.14,.16],[.36,.86,.15,.12],[.64,.89,.15,.12],[.52,.28,.10,.11]];
const rockRegions=[[.12,.31,.11,.10],[.55,.14,.12,.10],[.82,.49,.11,.13],[.29,.65,.14,.10],[.68,.76,.12,.11],[.48,.94,.12,.08]];
const terrainCanvas=document.createElement('canvas'),terrainCtx=terrainCanvas.getContext('2d'),terrainSmoothCanvas=document.createElement('canvas'),terrainSmoothCtx=terrainSmoothCanvas.getContext('2d'),terrainType=new Uint8Array(MAP_TILES*MAP_TILES),resourceTiles=[];
terrainCanvas.width=MAP_TILES*8;terrainCanvas.height=MAP_TILES*8;
const terrainPadding=32;terrainSmoothCanvas.width=terrainCanvas.width+terrainPadding*2;terrainSmoothCanvas.height=terrainCanvas.height+terrainPadding*2;
function buildTerrain(){
 const total=MAP_TILES*MAP_TILES,parts=[];
 const resources=[[.27,.22,.09,.08],[.59,.28,.10,.08],[.91,.43,.07,.10],[.30,.49,.09,.09],[.59,.61,.10,.08],[.16,.88,.09,.07],[.89,.91,.08,.07],[.47,.44,.08,.07]];
 const rnd=(x,y)=>{const v=Math.sin((x+17)*127.1+(y+31)*311.7)*43758.5453;return v-Math.floor(v);};
 const affinity=(x,y,centers)=>Math.max(...centers.map(([cx,cy,rx,ry])=>1-Math.hypot((x-cx)/rx,(y-cy)/ry)));
 for(let y=0;y<MAP_TILES;y++)for(let x=0;x<MAP_TILES;x++){
  const nx=(x+.5)/MAP_TILES,ny=(y+.5)/MAP_TILES,jitter=rnd(x,y)*.20+rnd(Math.floor(x/8),Math.floor(y/8))*.16;
  const riverX=.34+.31*ny+.055*Math.sin(ny*10);
  const lake=Math.max(0,1-Math.hypot((nx-.18)/.10,(ny-.55)/.12),1-Math.hypot((nx-.79)/.11,(ny-.25)/.09));
  parts.push({i:y*MAP_TILES+x,water:Math.abs(nx-riverX)-lake*.16+rnd(x+9,y+13)*.018,rock:affinity(nx,ny,rockRegions)+jitter,resource:affinity(nx,ny,resources)+jitter,forest:affinity(nx,ny,forestRegions)+jitter});
 }
 function assign(key,count,type,ascending=false){
  const candidates=parts.filter(p=>terrainType[p.i]===0).sort((a,b)=>ascending?a[key]-b[key]:b[key]-a[key]);
  for(let n=0;n<count;n++)terrainType[candidates[n].i]=type;
 }
 // Counts are allocated from the full 65,536-tile grid, so the requested area shares are exact to rounding.
 assign('water',5243,2,true);assign('rock',4588,3);assign('resource',3276,4);assign('forest',13107,1);
 const pxPerTile=terrainCanvas.width/MAP_TILES;
 for(let y=0;y<MAP_TILES;y++)for(let x=0;x<MAP_TILES;x++){
  const i=y*MAP_TILES+x,type=terrainType[i],px=x*pxPerTile,py=y*pxPerTile,n=rnd(x+101,y+53);
  if(type===1){
   const grass=['#376f3a','#4a7d42','#5a8a4d','#6d9a5d','#7aa65b'];
   const base=grass[Math.floor(n*grass.length)];
   terrainCtx.fillStyle=base;terrainCtx.fillRect(px,py,pxPerTile,pxPerTile);
   const patchCount=1 + Math.floor(n*2.2);
   for(let c=0;c<patchCount;c++){
    const cx=px+2.8+((c*17+Math.floor(n*23))%(Math.max(5,pxPerTile-6))),cy=py+2.8+((c*19+Math.floor(n*29))%(Math.max(5,pxPerTile-6)));
    const radius=0.7+((c+1)*0.55)*n;
    const hue=c%3===0?'#8ecb65':c%3===1?'#a7d88d':'#dfe9b3';
    terrainCtx.fillStyle=hue;
    terrainCtx.beginPath();terrainCtx.ellipse(cx,cy,radius*1.5,radius*0.9,((c+2)*0.46),0,Math.PI*2);terrainCtx.fill();
    if(c%2===0){
     terrainCtx.fillStyle='#eff7b8';
     terrainCtx.beginPath();terrainCtx.ellipse(cx+0.8,cy-0.7,radius*0.9,radius*0.48,((c+3)*0.31),0,Math.PI*2);terrainCtx.fill();
    }
   }
   if(n>0.72){terrainCtx.fillStyle='#e9f0af';terrainCtx.fillRect(px+1.2,py+1.5,0.8,0.8);}
   if(n>0.87){terrainCtx.fillStyle='#1d452a';terrainCtx.fillRect(px+pxPerTile*0.76,py+pxPerTile*0.18,0.55,0.55);}
  }
  else if(type===2){
   const water=['#2c7890','#3a8197','#428da2','#3a738b'];
   terrainCtx.fillStyle=water[Math.floor(n*water.length)];terrainCtx.fillRect(px,py,pxPerTile,pxPerTile);
   terrainCtx.fillStyle='#bfe7ea';terrainCtx.fillRect(px+1,py+1,pxPerTile*0.28,pxPerTile*0.18);
   if(n>.68){terrainCtx.fillStyle='#d7f6f6';terrainCtx.fillRect(px+pxPerTile*0.58,py+pxPerTile*0.37,pxPerTile*0.22,pxPerTile*0.12);}
   if(n>.82){terrainCtx.fillStyle='#d7f6f6';terrainCtx.fillRect(px+pxPerTile*0.18,py+pxPerTile*0.72,pxPerTile*0.26,pxPerTile*0.08);}
  }
  else if(type===3){
   const rock=['#7c705e','#867a67','#93866f','#706a5f'];
   terrainCtx.fillStyle=rock[Math.floor(n*rock.length)];terrainCtx.fillRect(px,py,pxPerTile,pxPerTile);
   terrainCtx.fillStyle='#b4a38d';terrainCtx.fillRect(px+1.2,py+1.8,2.1,1.5);
   if(n>.58){terrainCtx.fillStyle='#d9d0bc';terrainCtx.fillRect(px+Math.max(2,pxPerTile*0.46),py+Math.max(2,pxPerTile*0.34),2.4,1.8);}
   if(n>.76){terrainCtx.fillStyle='#6a6053';terrainCtx.fillRect(px+pxPerTile*0.7,py+pxPerTile*0.58,2.1,1.3);}
  }
  else if(type===4){
   const field=['#b3c46b','#c6cd7d','#d4d179','#d9c578'];
   terrainCtx.fillStyle=field[Math.floor(n*field.length)];terrainCtx.fillRect(px,py,pxPerTile,pxPerTile);
   resourceTiles.push(i);terrainCtx.fillStyle='#efdf8c';terrainCtx.fillRect(px+1.5,py+1.5,1.8,2.6);
   if(n>.62){terrainCtx.fillStyle='#f2d373';terrainCtx.fillRect(px+pxPerTile*0.58,py+pxPerTile*0.22,2,2.7);}
  }
  else{
   const plains=['#7bbd63','#82c66d','#70ad61','#8ec96c'];
   terrainCtx.fillStyle=plains[Math.floor(n*plains.length)];terrainCtx.fillRect(px,py,pxPerTile,pxPerTile);
   if(n>.62){terrainCtx.fillStyle='#d5e7a1';terrainCtx.fillRect(px+1.6,py+2.2,1.3,1.1);}
  }
 }
 terrainSmoothCtx.fillStyle='#79b967';terrainSmoothCtx.fillRect(0,0,terrainSmoothCanvas.width,terrainSmoothCanvas.height);
 terrainSmoothCtx.filter='blur(8px)';terrainSmoothCtx.drawImage(terrainCanvas,terrainPadding,terrainPadding);terrainSmoothCtx.filter='none';
 for(let i=0;i<4200;i++){
  const n=Math.sin((i+53)*127.1)*43758.5453,rx=n-Math.floor(n),m=Math.sin((i+301)*311.7)*24634.6345,ry=m-Math.floor(m);
  const px=terrainPadding+rx*terrainCanvas.width,py=terrainPadding+ry*terrainCanvas.height,tx=Math.min(MAP_TILES-1,Math.floor(rx*MAP_TILES)),ty=Math.min(MAP_TILES-1,Math.floor(ry*MAP_TILES)),type=terrainType[ty*MAP_TILES+tx],size=.72+(i%4)*.28;
  const colors=type===2?['#b5d4bd12','#214e6330']:type===3?['#ded2b03a','#3e49433f']:type===1?['#aac07a18','#183f2f14']:type===4?['#e5d89026','#6d80543a']:['#d2df9850','#47743b3f'];
  terrainSmoothCtx.fillStyle=colors[i%2];terrainSmoothCtx.beginPath();terrainSmoothCtx.ellipse(px,py,size*1.5,size*.62,(i%9)*.21,0,Math.PI*2);terrainSmoothCtx.fill();
 }
}

buildTerrain();
let renderView={scale:zoom,offsetX:0,offsetY:0};
function worldToScreenPlane(x,y){return {x,y};}
function screenPlaneToWorld(x,y){return {x,y};}
function viewOffsets(scale=zoom){return {x:MAP_WORLD_W*scale<VIEW_W?(VIEW_W-MAP_WORLD_W*scale)/2:-camX*scale,y:MAP_WORLD_H*scale<VIEW_H?(VIEW_H-MAP_WORLD_H*scale)/2:-camY*scale};}
function worldToCanvas(x,y){const p=worldToScreenPlane(x,y),o=viewOffsets();return {x:o.x+p.x*zoom,y:o.y+p.y*zoom};}
function drawUprightAt(x,y,drawFn){const p=worldToScreenPlane(x,y);ctx.save();ctx.setTransform(renderView.scale,0,0,renderView.scale,renderView.offsetX+(p.x-x)*renderView.scale,renderView.offsetY+(p.y-y)*renderView.scale);drawFn();ctx.restore();}
function clampCamera(){camX=Math.max(0,Math.min(Math.max(0,MAP_WORLD_W-VIEW_W/zoom),camX));camY=Math.max(0,Math.min(Math.max(0,MAP_WORLD_H-VIEW_H/zoom),camY));}

const $=id=>document.getElementById(id);
let state, last=0, accumulator=0, paused=false, ended=false, selected=null, gameTime=0, aiTimer=0, incomeTimer=0, nextId=1, logTimer=0, draggingFarm=null,lastHudSecond=-1,pendingSpawnRetryTimer=0;
let farmPlacement=null,suppressNextCanvasClick=false,selectedFortress=null;
function endFarmPlacement(){farmPlacement=null;$('farm').classList.remove('placing');canvas.style.cursor='';}
let mode='ai', gameStarted=false, peer=null, conn=null, netRole=null, roomCode='', snapshotClock=0, localSelectedIds=new Set(), connectionIntent='';
const specs={
 scout:{name:'Trinh sát',hp:60,damage:5,range:18,speed:72,cooldown:1.1,cost:40,energy:0,r:8,color:'#8ce6a0'},
 infantry:{name:'Lính',hp:100,damage:13,range:22,speed:45,cooldown:.8,cost:50,energy:0,r:10,color:'#58b5ff'},
 archer:{name:'Cung thủ',hp:65,damage:10,range:125,speed:34,cooldown:1.05,cost:75,energy:15,r:9,color:'#78d6ff'},
 spearman:{name:'Lính giáo',hp:145,damage:18,range:26,speed:38,cooldown:.82,cost:110,energy:25,r:11,color:'#d7d6a4'},
 cavalry:{name:'Lính kỵ binh',hp:210,damage:24,range:27,speed:58,cooldown:.9,cost:250,energy:70,r:13,color:'#f2d5a0'}
};
// Shared atlas: blue/red idle and walk clips occupy dedicated rows; later actions can add rows without changing simulation data.
const infantrySpriteSheet=new Image();infantrySpriteSheet.src='/assets/units/infantry/infantry-sheet.png';
const infantryClips={blue:{idle:{row:0,frames:4,fps:1.25},walk:{row:1,frames:4,fps:7}},red:{idle:{row:2,frames:4,fps:1.25},walk:{row:3,frames:4,fps:7}}};
const scoutSpriteSheet=new Image();scoutSpriteSheet.src='/assets/units/scout/scout-sheet.png';
const scoutClips={blue:{idle:{row:0,frames:4,fps:1.25},walk:{row:1,frames:4,fps:7}},red:{idle:{row:2,frames:4,fps:1.25},walk:{row:3,frames:4,fps:7}}};
// Per-cell alpha bounds from the atlas keep blue and red scouts grounded at the same world Y.
const scoutFootAnchors=[[304,307,303,308],[294,297,297,298],[276,282,276,283],[267,270,269,270]].map(row=>row.map(bottom=>bottom/313.5));
const cavalrySpriteSheet=new Image();cavalrySpriteSheet.src='/assets/units/cavalry/cavalry-sheet.png';
const cavalryClips={blue:{idle:{row:0,frames:3,fps:1},walk:{row:1,frames:4,fps:7}},red:{idle:{row:2,frames:3,fps:1},walk:{row:3,frames:4,fps:7}}};
const archerSpriteSheet=new Image();archerSpriteSheet.src='/assets/units/archer/archer-sheet.png';
const archerClips={blue:{idle:{row:0,frames:4,fps:1.25},walk:{row:1,frames:4,fps:7}},red:{idle:{row:2,frames:4,fps:1.25},walk:{row:3,frames:4,fps:7}}};
// 16 rows: team*8 + direction*2 + (idle 0 | walk 1); built by tools/build_spearman_sheet.py.
const spearmanSpriteSheet=new Image();spearmanSpriteSheet.src='/assets/units/spearman/spearman-sheet.png';
const SPEARMAN_DIRECTIONS=['down','left','up','right'],SPEARMAN_ROWS=16;
const spearmanClips={idle:{frames:4,fps:1.25},walk:{frames:4,fps:7}};
// Dominant axis wins so diagonal movement still picks one of the four painted directions.
function facingFrom(dx,dy){return Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');}
const farmSprite=new Image();farmSprite.src='/assets/farmstead-v2.png';
const fortressSprite=new Image();fortressSprite.src='/assets/fortress-sprite.png';
function localTeam(){return mode==='pvp'&&netRole==='guest'?1:0;}
function isMultiplayer(){return mode==='pvp';}
function teamGold(team){return team===0?state.gold:state.enemyGold;}
function setTeamGold(team,value){if(team===0)state.gold=value;else state.enemyGold=value;}
function teamEnergy(team){return team===0?state.energy:state.enemyEnergy;}
function setTeamEnergy(team,value){if(team===0)state.energy=value;else state.enemyEnergy=value;}
function normalizeUnitType(type){return type==='tank'?'spearman':type;}
function unitVisionRadius(type){switch(normalizeUnitType(type)){case 'spearman':return 150;case 'archer':return 130;case 'scout':return 145;default:return 105;}}
function roomPeerId(code){return 'miniwarr'+code.toLowerCase().replace(/[^a-z0-9]/g,'');}
function setNetStatus(msg){const el=$('netStatus');if(el)el.textContent=msg;}
function showFriendPanel(){ $('modeHome').style.display='none';$('friendPanel').classList.add('show'); }
function showModeHome(){ $('friendPanel').classList.remove('show');$('modeHome').style.display='block'; }
function hideModeScreen(){ $('modeScreen').classList.add('hidden'); }
function showModeScreen(){ $('modeScreen').classList.remove('hidden'); }
function setGameModeLabel(){
 $('modeStatus').textContent=mode==='pvp'?(netRole==='host'?'Chế độ: Solo với bạn bè · Bạn là quân XANH · Chủ phòng': 'Chế độ: Solo với bạn bè · Bạn là quân ĐỎ'):'Chế độ: Chơi với AI · Offline';
 const labels=document.querySelectorAll('.legend span');if(labels.length>=2){labels[0].innerHTML='<i class="dot" style="background:#4aaaff"></i>'+(localTeam()===0?'Quân xanh của bạn':'Quân xanh đối thủ');labels[1].innerHTML='<i class="dot" style="background:#ff626b"></i>'+(localTeam()===1?'Quân đỏ của bạn':(mode==='pvp'?'Quân đỏ đối thủ':'Quân đỏ của máy'));}
}
function destroyPeer(){try{if(conn){conn.close();}}catch{}try{if(peer){peer.destroy();}}catch{}conn=null;peer=null;netRole=null;roomCode='';}
function ensurePeerJs(){
 if(window.Peer)return Promise.resolve();
 if(window._peerJsPromise)return window._peerJsPromise;
 window._peerJsPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';script.async=true;
  script.onload=()=>window.Peer?resolve():reject(new Error('Không tải được thư viện kết nối.'));
  script.onerror=()=>reject(new Error('Không tải được PeerJS. Hãy kiểm tra Internet rồi thử lại.'));
  document.head.appendChild(script);
 });return window._peerJsPromise;
}
function startAIMode(){
 destroyPeer();mode='ai';netRole=null;gameStarted=true;localSelectedIds.clear();fresh();hideModeScreen();setGameModeLabel();
}
function startHostGame(){
 mode='pvp';netRole='host';gameStarted=true;localSelectedIds.clear();$('feed').innerHTML='';fresh();hideModeScreen();setGameModeLabel();addLog('Phòng 1 đấu 1 đã mở. Bạn là quân xanh.');sendSnapshot();
}
function startGuestFromSnapshot(packet){
 mode='pvp';netRole='guest';gameStarted=true;hideModeScreen();setGameModeLabel();applySnapshot(packet);addLog('Đã vào phòng. Bạn là quân đỏ.');
}
function createRoom(){
 if(peer||conn)destroyPeer();connectionIntent='host';setNetStatus('Đang khởi tạo phòng...');$('createRoom').disabled=true;$('joinRoom').disabled=true;
 ensurePeerJs().then(()=>{
  let attempts=0;
  const tryCreate=()=>{
   attempts++;roomCode=Math.random().toString(36).slice(2,8).toUpperCase().padEnd(6,'X').slice(0,6);
   peer=new Peer(roomPeerId(roomCode));
   peer.on('open',id=>{
    $('roomCode').textContent=roomCode;$('roomWaiting').classList.add('show');$('friendActions').style.display='none';
    const url=new URL(window.location.href);url.searchParams.set('room',roomCode);window._miniWarInviteUrl=url.href;
    setNetStatus('Đang chờ bạn bè tham gia... Hãy gửi mã hoặc link mời.');
   });
   peer.on('connection',incoming=>{
    if(conn&&conn.open){incoming.close();return;}
    conn=incoming;netRole='host';
    setupConnection(incoming,'host');
   });
   peer.on('error',err=>{
    const msg=String(err?.type||err?.message||err);
    if(msg.includes('unavailable-id')&&attempts<5){try{peer?.destroy();}catch{}peer=null;setTimeout(tryCreate,150);return;}
    setNetStatus('Lỗi tạo phòng: '+msg+'. Thử tạo phòng mới.');$('createRoom').disabled=false;$('joinRoom').disabled=false;
   });
  };tryCreate();
 }).catch(err=>{setNetStatus(err.message);$('createRoom').disabled=false;$('joinRoom').disabled=false;});
}
function joinRoom(){
 const code=String($('roomInput').value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
 if(code.length<4){setNetStatus('Nhập mã phòng hợp lệ (ít nhất 4 ký tự).');return;}
 if(peer||conn)destroyPeer();connectionIntent='guest';roomCode=code;setNetStatus('Đang kết nối tới phòng '+code+'...');$('createRoom').disabled=true;$('joinRoom').disabled=true;
 ensurePeerJs().then(()=>{
  peer=new Peer();
  peer.on('open',()=>{
   conn=peer.connect(roomPeerId(code),{reliable:true});
   setupConnection(conn,'guest');
  });
  peer.on('error',err=>{setNetStatus('Lỗi kết nối: '+(err?.type||err?.message||err)+'. Kiểm tra mã phòng và thử lại.');$('createRoom').disabled=false;$('joinRoom').disabled=false;});
 }).catch(err=>{setNetStatus(err.message);$('createRoom').disabled=false;$('joinRoom').disabled=false;});
}
function setupConnection(connection,role){
 connection.on('open',()=>{
  if(role==='host'){
   if(!gameStarted||mode!=='pvp') startHostGame();
   else {paused=false;updateHUD();sendSnapshot();}
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
  if(conn===connection)conn=null;
  if(role==='host'){paused=true;updateHUD();setNetStatus('Đối thủ đã ngắt kết nối. Trận đang tạm dừng. Bạn có thể gửi lại mã phòng để kết nối lại.');addLog('Đối thủ đã rời phòng.');}
  else{gameStarted=false;showModeScreen();showFriendPanel();setNetStatus('Đã mất kết nối với chủ phòng. Hãy thử tham gia lại.');}
 });
 connection.on('error',err=>setNetStatus('Lỗi kết nối: '+(err?.message||err)));
}
function serializeSnapshot(){
 // Keep explored fog maps local to each browser; serialize only live simulation state.
 const {fogSeen,enemyFogSeen,...clean}=state;
 clean.units=state.units.map(u=>({...u,type:normalizeUnitType(u.type),selected:false,target:null}));
 clean.bullets=state.bullets.map(b=>({...b,target:null}));
 clean.pendingSpawns=(state.pendingSpawns||[]).map(p=>({...p,type:normalizeUnitType(p.type)}));
 return {type:'snapshot',gameTime,paused,ended,state:clean,resultTitle:$('resultTitle').textContent,resultText:$('resultText').textContent};
}
function sendSnapshot(){if(mode!=='pvp'||netRole!=='host'||!conn||conn.open!==true)return;try{conn.send(serializeSnapshot());}catch(e){setNetStatus('Không gửi được trạng thái trận đấu.');}}
function applySnapshot(packet){
 if(!packet?.state)return;
 const oldFog=state?.fogSeen instanceof Uint8Array&&state.fogSeen.length===MAP_TILES*MAP_TILES?state.fogSeen:new Uint8Array(MAP_TILES*MAP_TILES);
 const oldEnemyFog=state?.enemyFogSeen instanceof Uint8Array&&state.enemyFogSeen.length===MAP_TILES*MAP_TILES?state.enemyFogSeen:new Uint8Array(MAP_TILES*MAP_TILES);
 const picked=new Set(localSelectedIds),hadFortressSelected=!!selectedFortress;
 state=packet.state;state.units=(state.units||[]).map(u=>({...u,type:normalizeUnitType(u.type)}));state.pendingSpawns=(state.pendingSpawns||[]).map(p=>({...p,type:normalizeUnitType(p.type)}));selectedFortress=hadFortressSelected?state.bases.find(b=>b.team===localTeam())||null:null;state.pendingSpawns??=[];state.fogSeen=oldFog;state.enemyFogSeen=oldEnemyFog;
 gameTime=Number(packet.gameTime)||0;paused=!!packet.paused;ended=!!packet.ended;
 const hostWon=String(packet.resultTitle||'').includes('CHIẾN THẮNG!');
 const localWon=localTeam()===0?hostWon:!hostWon;
 $('resultTitle').textContent=ended?(localWon?'🏆 CHIẾN THẮNG!':'💥 THẤT THỦ!'):(packet.resultTitle||'Trận đấu kết thúc');
 $('resultText').textContent=ended?(localWon?'Bạn đã phá hủy căn cứ đối phương. Chỉ huy xuất sắc!':'Căn cứ của bạn đã bị phá hủy. Hãy thử chiến thuật khác!'):(packet.resultText||'');
 $('pause').innerHTML=paused?'▶ Tiếp tục<span>Tiếp tục trận đấu</span>':'Ⅱ Tạm dừng<span>Dừng / tiếp tục</span>';
 for(const u of state.units){u.selected=picked.has(u.id)&&u.team===localTeam();}
 selected=state.units.find(u=>u.selected)||null;
 revealTeamVision(0);revealTeamVision(1);updateHUD();
 if(ended)$('overlay').classList.add('show');else $('overlay').classList.remove('show');
}
function revealTeamVision(team){
 if(!state)return;const arr=team===0?state.fogSeen:state.enemyFogSeen;if(!arr)return;
 const cols=MAP_TILES,rows=MAP_TILES,cw=W/cols,ch=H/rows;
 const sources=[...state.units.filter(u=>u.team===team&&u.hp>0).map(u=>({x:u.x,y:u.y,r:unitVisionRadius(u.type)})),...state.bases.filter(b=>b.team===team).map(b=>({x:b.x,y:b.y,r:175}))];
 for(const source of sources){const x1=Math.max(0,Math.floor((source.x-source.r)/cw)),x2=Math.min(cols-1,Math.ceil((source.x+source.r)/cw)),y1=Math.max(0,Math.floor((source.y-source.r)/ch)),y2=Math.min(rows-1,Math.ceil((source.y+source.r)/ch));for(let gy=y1;gy<=y2;gy++)for(let gx=x1;gx<=x2;gx++){if(Math.hypot((gx+.5)*cw-source.x,(gy+.5)*ch-source.y)<=source.r)arr[gy*cols+gx]=1;}}
}
function requestAction(action,payload={}){
 if(mode==='pvp'&&netRole==='guest'){
  if(conn&&conn.open)conn.send({type:'action',action,payload});else setNetStatus('Chưa kết nối với chủ phòng.');
  return;
 }
 applyAction(localTeam(),action,payload);
}
function applyAction(team,action,payload={}){
 if(action==='buy')buy(payload.unit,team);
 else if(action==='farm')buildFarm(team);
 else if(action==='placeFarm')placeFarmAt(team,Number(payload.x),Number(payload.y));
 else if(action==='turret')buildTurret(team);
 else if(action==='attack')commandAttack(team,payload.ids);
 else if(action==='move'){
  if(ended||paused)return;
  const ids=new Set(payload.ids||[]);
  const x=Math.max(25,Math.min(W-25,Number(payload.x)||0));
  const y=Math.max(45,Math.min(H-30,Number(payload.y)||0));
  // Give every selected unit a unique formation slot around the clicked destination,
  // instead of sending the whole group to exactly the same point.
  const chosen=state.units.filter(u=>u.team===team&&ids.has(u.id));
  const skipped=[];
  if(chosen.length){
  const spacing=34;
   const cols=Math.ceil(Math.sqrt(chosen.length));
   const rows=Math.ceil(chosen.length/cols);
   const halfW=(cols-1)*spacing/2,halfH=(rows-1)*spacing/2;
   // Shift the whole formation inward near map edges so slots do not pile up on a clamp boundary.
   const cx=Math.max(25+halfW,Math.min(W-25-halfW,x));
   const cy=Math.max(45+halfH,Math.min(H-30-halfH,y));
   chosen.forEach((u,i)=>{
    const col=i%cols,row=Math.floor(i/cols);
    const slotX=cx+(col-(cols-1)/2)*spacing;
    const slotY=cy+(row-(rows-1)/2)*spacing;
    if(isDeploymentLocked(u)&&!insideBaseDeploymentZone(team,slotX,slotY)){
     skipped.push(u);u.dest=null;u.order='hold';return;
    }
    u.dest={x:slotX,y:slotY};u.order='move';
   });
  }
  if(skipped.length&&team===localTeam())addLog(`Trong thời gian khóa, ${skipped.length} đơn vị không thể nhận lệnh đi ra ngoài vùng căn cứ.`);
 }
 else if(action==='pause'){if(!ended){paused=!!payload.paused;updateHUD();}}
 else if(action==='moveFarm'){
  const items=state.farms.filter(f=>f.team===team);const f=items[payload.index];if(!f||ended||paused)return;
  const nx=Math.max(33,Math.min(W-33,Number(payload.x)||0)),ny=Math.max(36,Math.min(H-36,Number(payload.y)||0));
  if(!farmPlacementValid(team,nx,ny,f)){if(team===localTeam())addLog('Không thể chuyển nông trại vào sương mù hoặc đè lên vật thể khác.');return;}
  f.x=nx;f.y=ny;
 }
 updateHUD();
}
function teamCanSee(team,x,y){
 if(!state)return false;
 // Visibility is queried repeatedly by target acquisition and rendering. Compare
 // squared distances to avoid a square root for every unit, base, and turret.
 for(const u of state.units){if(u.team!==team||u.hp<=0)continue;const r=unitVisionRadius(u.type),dx=x-u.x,dy=y-u.y;if(dx*dx+dy*dy<=r*r)return true;}
 const base=state.bases.find(b=>b.team===team);if(base){const dx=x-base.x,dy=y-base.y;if(dx*dx+dy*dy<=175*175)return true;}
 return state.bases.some(b=>b.team===team&&(b.guns||[]).some((gun,index)=>{if(!gun.active)return false;const pos=fortressGunPosition(b,index),dx=x-pos.x,dy=y-pos.y;return dx*dx+dy*dy<=105*105;}));
}

function fortressGunPosition(base,index){const forward=base.team===0?1:-1;return {x:base.x+forward*(index===0?82:-82),y:base.y};}
function musterYard(base){const forward=base.team===0?1:-1;return {x:base.x+forward*((base.w||TILE_SIZE*5.5)/2+72),y:base.y,w:170,h:144};}
function activeFortressGuns(base){return (base.guns||[]).filter(g=>g.active).length;}
function stateBaseTooClose(x,y,blueBase,redBase){
 return [blueBase,redBase].some(b=>Math.hypot(x-b.x,y-b.y)<340);
}
function fresh(){
 endFarmPlacement();suppressNextCanvasClick=false;selectedFortress=null;
 const marginY=260;
 const blueBase={team:0,x:220+Math.random()*W*0.16,y:marginY+Math.random()*(H-2*marginY),hp:1230,max:1230,w:TILE_SIZE*5.5,h:TILE_SIZE*5.0,guns:[{active:true,cool:0},{active:false,cool:0}]};
 const redBase={team:1,x:W-220-Math.random()*W*0.16,y:marginY+Math.random()*(H-2*marginY),hp:1230,max:1230,w:TILE_SIZE*5.5,h:TILE_SIZE*5.0,guns:[{active:true,cool:0},{active:false,cool:0}]};
 // Three mine types: ordinary, rich (central objective), and special energy reward.
 const mines=[];
 function randomMineSpot(central=false){
  let x,y,tries=0;
  const centralResources=central?resourceTiles.filter(i=>Math.abs((i%MAP_TILES+.5)/MAP_TILES-.5)<.15&&Math.abs((Math.floor(i/MAP_TILES)+.5)/MAP_TILES-.5)<.15):[];
  const choices=centralResources.length?centralResources:resourceTiles;
  do{
   const tile=choices[Math.floor(Math.random()*choices.length)];
   x=((tile%MAP_TILES)+.5)*TILE_SIZE;
   y=(Math.floor(tile/MAP_TILES)+.5)*TILE_SIZE;
   tries++;
  }while(tries<160 && (stateBaseTooClose(x,y,blueBase,redBase)||mines.some(m=>Math.hypot(x-m.x,y-m.y)<380)));
  return {x,y};
 }
 mines.push({...randomMineSpot(),kind:'ordinary',income:3,owner:-1,emptyTime:0,controlTime:0,rewarded:false});
 mines.push({...randomMineSpot(true),kind:'rich',income:5,owner:-1,emptyTime:0,controlTime:0,rewarded:false});
 mines.push({...randomMineSpot(),kind:'special',income:3,owner:-1,emptyTime:0,controlTime:0,rewarded:false});
 state={gold:150,energy:100,enemyGold:150,enemyEnergy:100,units:[],bullets:[],effects:[],farms:[],guards:[],bases:[blueBase,redBase],mines,fogSeen:new Uint8Array(MAP_TILES*MAP_TILES),enemyFogSeen:new Uint8Array(MAP_TILES*MAP_TILES),enemyMemory:{base:null,targets:[]},aiExploreTarget:null,pendingSpawns:[]};
 buildWorldDecor();
 gameTime=0;aiTimer=5;incomeTimer=0;nextId=1;lastHudSecond=-1;pendingSpawnRetryTimer=0;selected=null;paused=false;ended=false;camX=0;camY=0;zoom=DEFAULT_ZOOM;
 const homePoint=worldToScreenPlane(state.bases[0].x,state.bases[0].y);
 camX=homePoint.x-VIEW_W/zoom*.30;camY=homePoint.y-VIEW_H/zoom*.58;clampCamera();
 $('overlay').classList.remove('show');$('pause').innerHTML='Ⅱ Tạm dừng<span>Dừng / tiếp tục</span>';
 addLog('Trận đấu bắt đầu. Vị trí căn cứ được chọn ngẫu nhiên trong mỗi trận!');
 updateHUD();
}
function addLog(msg){const el=document.createElement('div');el.textContent=msg;$('feed').prepend(el);while($('feed').children.length>12)$('feed').lastChild.remove();}
function isDeploymentLocked(unit){return !!unit&&gameTime<DEPLOYMENT_LOCK_SECONDS&&unit.type!=='scout';}
function insideBaseDeploymentZone(team,x,y){const base=state?.bases?.find(b=>b.team===team);return !!base&&Math.hypot(x-base.x,y-base.y)<=BASE_DEPLOYMENT_RADIUS;}
function constrainToBaseDeploymentZone(unit){if(!isDeploymentLocked(unit))return;const base=state.bases.find(b=>b.team===unit.team);if(!base)return;const dx=unit.x-base.x,dy=unit.y-base.y,d=Math.hypot(dx,dy);if(d>BASE_DEPLOYMENT_RADIUS){const scale=BASE_DEPLOYMENT_RADIUS/d;unit.x=base.x+dx*scale;unit.y=base.y+dy*scale;}}
function spawn(team,type,x,y,queueIfBlocked=true,pendingOrder='hold'){
 const spec=specs[type],left=team===0;
 const base=state.bases.find(b=>b.team===team)||{team,x:left?75:W-75,y:H/2,w:TILE_SIZE*5.5,h:TILE_SIZE*5};
 const yard=musterYard(base),radius=spec.r||9,forward=left?1:-1,spacing=radius*2+5;
 const terrainBlocked=(ax,ay)=>{if(ax<radius||ay<radius||ax>=W-radius||ay>=H-radius)return true;const gx=Math.floor(ax/TILE_SIZE),gy=Math.floor(ay/TILE_SIZE),terrain=terrainType[gy*MAP_TILES+gx];return terrain===2||terrain===3;};
 const inYard=(ax,ay)=>Math.abs(ax-yard.x)<=yard.w/2-radius&&Math.abs(ay-yard.y)<=yard.h/2-radius;
 const occupied=(ax,ay)=>(!inYard(ax,ay)||terrainBlocked(ax,ay)||state.units.some(u=>Math.hypot(u.x-ax,u.y-ay)<radius+(specs[u.type]?.r||9)+3)||state.farms.some(f=>Math.hypot(f.x-ax,f.y-ay)<radius+20)||state.bases.some(b=>Math.hypot(b.x-ax,b.y-ay)<radius+Math.max(b.w||74,b.h||92)*.42));
 const prepLocked=type!=='scout'&&gameTime<DEPLOYMENT_LOCK_SECONDS,inPrepArea=(ax,ay)=>!prepLocked||Math.hypot(ax-base.x,ay-base.y)<=BASE_DEPLOYMENT_RADIUS-radius;
 const sameTypeCount=state.units.filter(u=>u.team===team&&u.type===type).length,col=sameTypeCount%4,row=Math.floor(sameTypeCount/4);
 let px=yard.x+forward*row*spacing,py=yard.y+(col-1.5)*spacing,found=false;
 if(inPrepArea(px,py)&&!occupied(px,py))found=true;
 if(!found){outer:for(let rowIndex=-3;rowIndex<=3;rowIndex++)for(let colIndex=-2;colIndex<=2;colIndex++){const ax=yard.x+forward*rowIndex*18,ay=yard.y+colIndex*20;if(!inPrepArea(ax,ay)||occupied(ax,ay))continue;px=ax;py=ay;found=true;break outer;}}
 if(!found){if(!queueIfBlocked)return null;state.pendingSpawns??=[];state.pendingSpawns.push({id:nextId++,team,type,order:pendingOrder,queuedAt:gameTime});if(team===localTeam())addLog(`Sân tập kết đã kín; ${spec.name} đang chờ chỗ trống.`);return null;}
 const unit={id:nextId++,team,type,x:px,y:py,hp:spec.hp,max:spec.hp,attackTimer:Math.random()*.35,order:'hold',target:null,dest:null,selected:false,walk:Math.random()*6,moving:false};state.units.push(unit);return unit;
}
function processPendingSpawns(){
 if(!state?.pendingSpawns?.length)return;
 for(let i=0;i<state.pendingSpawns.length;){
  const pending=state.pendingSpawns[i],unit=spawn(pending.team,pending.type,undefined,undefined,false);
  if(!unit){i++;continue;}
  unit.id=pending.id;unit.order=pending.order||'hold';state.pendingSpawns.splice(i,1);
  if(pending.team===localTeam())addLog(`Đã xuất quân ${specs[pending.type].name} từ hàng chờ.`);
 }
}
function buy(type,team=localTeam()){
 if(ended||paused||!specs[type])return;const s=specs[type];
 if(type==='scout'&&state.units.filter(u=>u.team===team&&u.type==='scout'&&u.hp>0).length+state.pendingSpawns.filter(u=>u.team===team&&u.type==='scout').length>=2){addLog('Mỗi phe chỉ được có tối đa 2 lính trinh sát cùng lúc.');return;}
 if(teamGold(team)<s.cost||teamEnergy(team)<s.energy){if(team===localTeam())addLog('Không đủ tài nguyên để tạo '+s.name+'.');return;}
 setTeamGold(team,teamGold(team)-s.cost);setTeamEnergy(team,teamEnergy(team)-s.energy);const unit=spawn(team,type);if(team===localTeam()&&unit)addLog('Đã tạo '+s.name+' gần căn cứ.');updateHUD();
}
function isTeamAreaExplored(team,x,y){
 const fog=team===0?state.fogSeen:state.enemyFogSeen;
 if(!fog||!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=W||y>=H)return false;
 const cols=MAP_TILES,rows=MAP_TILES,cellW=W/cols,cellH=H/rows;
 const gx=Math.floor(x/cellW),gy=Math.floor(y/cellH);
 return gx>=0&&gx<cols&&gy>=0&&gy<rows&&fog[gy*cols+gx]===1;
}
// A farm occupies a rectangle (62 x 68 world units). Every sampled part of
// its footprint must have been explored, and its footprint cannot overlap
// another structure or unit. The optional farm is ignored while repositioning.
function farmPlacementValid(team,x,y,ignoreFarm=null){
 const halfW=31,halfH=34;
 if(x<halfW+2||x>W-halfW-2||y<halfH+2||y>H-halfH-2)return false;
 const sampleXs=[];for(let sx=-halfW;sx<=halfW;sx+=8)sampleXs.push(sx);sampleXs.push(halfW);
 const sampleYs=[];for(let sy=-halfH;sy<=halfH;sy+=8)sampleYs.push(sy);sampleYs.push(halfH);
 for(const sy of sampleYs){
  for(const sx of sampleXs){
   if(!isTeamAreaExplored(team,x+sx,y+sy))return false;
   const gx=Math.floor((x+sx)/TILE_SIZE),gy=Math.floor((y+sy)/TILE_SIZE),terrain=terrainType[gy*MAP_TILES+gx];
   // Match the movement system: water and rocky tiles are impassable and cannot support a farm.
   if(terrain===2||terrain===3)return false;
  }
 }
 // Farm-to-farm overlap uses their actual rectangular footprints.
 for(const f of state.farms){
  if(f===ignoreFarm||f.hp<=0)continue;
  if(Math.abs(x-f.x)<halfW+31 && Math.abs(y-f.y)<halfH+34)return false;
 }
 // Keep farms clear of both main bases.
 for(const b of state.bases){
  if(Math.abs(x-b.x)<halfW+(b.w||74)/2 && Math.abs(y-b.y)<halfH+(b.h||92)/2)return false;
 }
 // Do not place a building on top of a unit either.
 for(const u of state.units){
  if(u.hp<=0)continue;
  const qx=Math.max(x-halfW,Math.min(u.x,x+halfW));
  const qy=Math.max(y-halfH,Math.min(u.y,y+halfH));
  if(Math.hypot(u.x-qx,u.y-qy)<(specs[u.type]?.r||9)+2)return false;
 }
 return true;
}
function findOpenBaseSpot(team, radius=18, kind='building'){
 const home=state.bases.find(b=>b.team===team); const left=team===0, bx=home?home.x:(left?75:W-75), by=home?home.y:H/2;
 const occupied=(x,y)=>{
  if(state.bases.some(b=>Math.hypot(b.x-x,b.y-y)<radius+Math.max(b.w,b.h)*0.42))return true;
  if(state.units.some(u=>Math.hypot(u.x-x,u.y-y)<radius+(specs[u.type]?.r||9)+5))return true;
  if(state.farms.some(f=>kind==='farm'?(Math.abs(f.x-x)<62&&Math.abs(f.y-y)<68):Math.hypot(f.x-x,f.y-y)<radius+24))return true;
  return false;
 };
 // Search outward from the home base in a compact staging area; never place on top of another object.
 for(let ring=0;ring<18;ring++){
  for(let k=0;k<32;k++){
   const a=k*Math.PI/16, dist=52+ring*13;
   const x=bx+Math.cos(a)*dist*(left?1:-1), y=by+Math.sin(a)*dist;
   if((left&&x>bx+185)||(!left&&x<bx-185)||y<by-145||y>by+145)continue;
   if(!occupied(x,y)&&(kind!=='farm'||farmPlacementValid(team,x,y)))return {x,y};
  }
 }
 // Wider fallback if the base staging area is crowded.
 for(let gy=-12;gy<=12;gy++)for(let gx=0;gx<=24;gx++){
  const x=left?bx+45+gx*12:bx-45-gx*12,y=by+gy*12;
  if(x<20||x>W-20||y<20||y>H-20)continue;
  if(!occupied(x,y)&&(kind!=='farm'||farmPlacementValid(team,x,y)))return {x,y};
 }
 return {x:bx+(left?120:-120),y:by+160};
}
function buildFarm(team=localTeam()){
 if(ended||paused)return;
 if(teamGold(team)<80){if(team===localTeam())addLog('Không đủ vàng để xây nông trại (80 vàng).');return;}
 const spot=findOpenBaseSpot(team,25,'farm');
 if(!spot||!farmPlacementValid(team,spot.x,spot.y)){
  if(team===localTeam())addLog('Không có chỗ xây hợp lệ: hãy đưa quân mở sương mù và dọn chỗ trống trước.');
  return;
 }
 placeFarmAt(team,spot.x,spot.y);
}
function placeFarmAt(team,x,y){
 if(ended||paused)return false;
 if(!Number.isFinite(x)||!Number.isFinite(y)||!farmPlacementValid(team,x,y)){
  if(team===localTeam())addLog('Vị trí không hợp lệ: tránh nước, đá, công trình và khu vực chưa khám phá.');
  return false;
 }
 if(teamGold(team)<80){if(team===localTeam())addLog('Không đủ vàng để xây nông trại (80 vàng).');return false;}
 setTeamGold(team,teamGold(team)-80);
 state.farms.push({x,y,hp:180,max:180,team});
 if(team===localTeam())addLog('Đã xây nông trại: tạo thêm 2 vàng mỗi giây.');updateHUD();return true;
}
function beginFarmPlacement(){
 if(ended||paused)return;
 if(teamGold(localTeam())<80){addLog('Không đủ vàng để xây nông trại (80 vàng).');return;}
 const home=state.bases.find(b=>b.team===localTeam());farmPlacement={x:home?.x||W/2,y:home?.y||H/2,valid:false};
 $('farm').classList.add('placing');
 addLog('Chọn vị trí nông trại: nhấp trái để đặt, nhấp phải hoặc Escape để hủy.');
}
function buildTurret(team=localTeam()){
 if(ended||paused)return;const base=state.bases.find(b=>b.team===team);if(!base)return;
 if(activeFortressGuns(base)>=2){if(team===localTeam())addLog('Pháo đài đã có đủ 2 khẩu pháo tích hợp.');return;}
 if(teamGold(team)<100){if(team===localTeam())addLog('Cần 100 vàng để mở khóa pháo thứ hai.');return;}
 const next=base.guns.findIndex(g=>!g.active);if(next<0)return;setTeamGold(team,teamGold(team)-100);
 base.guns[next].active=true;base.guns[next].cool=.2;base.max+=230;base.hp+=230;
 if(team===localTeam())addLog('Pháo thứ hai đã được tích hợp vào pháo đài; máu công trình tăng thêm 230.');updateHUD();
}
function commandAttack(team=localTeam(),ids=null){if(ended||paused)return;const wanted=ids?new Set(ids):new Set(state.units.filter(u=>u.team===team&&u.selected).map(u=>u.id));const chosen=state.units.filter(u=>u.team===team&&wanted.has(u.id));for(const u of chosen){u.order='attack';u.dest=null;u.target=null;}if(team===localTeam()){if(gameTime<DEPLOYMENT_LOCK_SECONDS)addLog(chosen.length?'Đã nhận lệnh tấn công; quân không thể rời vùng căn cứ trước khi hết thời gian khóa.':'Chưa chọn quân.');else addLog(chosen.length?`${chosen.length} đơn vị được chọn nhận lệnh tấn công!`:'Chưa chọn quân. Hãy chọn lính trước.');}}
function updateMatchClockHUD(){const sec=Math.floor(gameTime);$('time').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');const remaining=Math.max(0,Math.ceil(DEPLOYMENT_LOCK_SECONDS-gameTime));$('deployTimer').textContent=remaining?`Mở khóa xuất quân sau ${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`:'Đã mở khóa xuất quân';}
function updateHUD(){
 const team=localTeam();$('gold').textContent=Math.floor(teamGold(team));$('energy').textContent=Math.floor(teamEnergy(team));
 updateMatchClockHUD();
 const ours=state.units.filter(u=>u.team===team);
 const infantry=ours.filter(u=>u.type==='infantry').length,archers=ours.filter(u=>u.type==='archer').length,scouts=ours.filter(u=>u.type==='scout').length,spearmen=ours.filter(u=>u.type==='spearman').length,cavalry=ours.filter(u=>u.type==='cavalry').length;
 const queued=state.pendingSpawns.filter(u=>u.team===team);$('unitCount').textContent=ours.length+queued.length;$('unitBreakdown').textContent=`Lính ${infantry} · Cung ${archers} · Lính giáo ${spearmen} · Kỵ binh ${cavalry}${queued.length?` · Chờ ${queued.length}`:''}`;const spearmanCounter=$('spearmanCount');if(spearmanCounter)spearmanCounter.textContent=spearmen;
 const stats=document.querySelectorAll('.hud .stat');if(stats[3])stats[3].querySelector('small').textContent=team===0?'🪖 Quân xanh':'🪖 Quân đỏ';if(stats[4])stats[4].querySelector('small').textContent=team===0?'🗡️ Lính giáo xanh':'🗡️ Lính giáo đỏ';
 const home=state.bases.find(b=>b.team===team);$('turret').disabled=paused||ended||activeFortressGuns(home)>=2;
 for(const id of ['scout','infantry','archer','spearman','cavalry','farm','attack'])$(id).disabled=paused||ended;
 $('pause').disabled=ended;
 $('pause').innerHTML=paused?'▶ Tiếp tục<span>Tiếp tục trận đấu</span>':'Ⅱ Tạm dừng<span>Dừng / tiếp tục</span>';
}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function aiCanSee(x,y){return teamCanSee(1,x,y);}
function nearestEnemy(u){
 let best=null,bd=Infinity;
 for(const v of state.units){
  if(v.team===u.team)continue;
  // AI may only acquire a new target if its own vision currently reveals it.
  if((mode==='pvp'&&!teamCanSee(u.team,v.x,v.y))||(mode==='ai'&&u.team===1&&!aiCanSee(v.x,v.y)))continue;
  let d=dist(u,v);if(d<bd){bd=d;best=v;}
 }
 const base=state.bases[1-u.team];
 if((mode==='ai'&&u.team===0)||teamCanSee(u.team,base.x,base.y)){let db=Math.hypot(base.x-u.x,base.y-u.y);if(!best||db<bd-20){best=base;bd=db;}}
 if(u.team===1){for(const f of state.farms){if(f.team===u.team||f.hp<=0||!aiCanSee(f.x,f.y))continue;let d=dist(u,f);if(d<bd-15){best=f;bd=d;}}}
 return best;
}
function unitTargetValid(t,u){return t&&t.hp>0&&((t.team!==undefined&&t.team!==u.team)||t.team===undefined);}
function hurt(target,damage,team,attackerType=null){
 let finalDamage=damage;
 if(attackerType==='spearman'&&target?.type==='cavalry')finalDamage*=1.35;
 else if(attackerType==='cavalry'&&target?.type==='spearman')finalDamage*=0.9;
 target.hp-=finalDamage;state.effects.push({x:target.x,y:target.y,life:.18,max:.18,color:team===0?'#73c8ff':'#ff747a'});
 if(target.hp<=0){
  if(target===state.bases[0])finish(false);
  else if(target===state.bases[1])finish(true);
  else if(target.type){state.units=state.units.filter(u=>u!==target);if(selected===target)selected=null;}
 }
}
function finish(win){if(ended)return;ended=true;$('resultTitle').textContent=win?'🏆 CHIẾN THẮNG!':'💥 THẤT THỦ!';$('resultText').textContent=win?'Bạn đã phá hủy căn cứ địch. Chỉ huy xuất sắc!':'Căn cứ của bạn đã bị phá hủy. Hãy thử chiến thuật khác!';$('overlay').classList.add('show');addLog(win?'Chiến thắng!':'Thất bại!');updateHUD();}
function update(dt){
 if(!gameStarted|| (mode==='pvp'&&netRole==='guest') || paused||ended)return;const before=gameTime;gameTime+=dt;incomeTimer+=dt;aiTimer+=dt;
 const shownSecond=Math.floor(gameTime);if(shownSecond!==lastHudSecond||before<DEPLOYMENT_LOCK_SECONDS&&gameTime>=DEPLOYMENT_LOCK_SECONDS){lastHudSecond=shownSecond;updateMatchClockHUD();if(before<DEPLOYMENT_LOCK_SECONDS&&gameTime>=DEPLOYMENT_LOCK_SECONDS){addLog('Thời gian khóa đã kết thúc. Tất cả đơn vị được phép rời vùng căn cứ.');updateHUD();}}
 pendingSpawnRetryTimer+=dt;if(pendingSpawnRetryTimer>=.35){pendingSpawnRetryTimer=0;processPendingSpawns();}
 // income, with a bonus for controlling the mine
 while(incomeTimer>=1){incomeTimer-=1;state.gold+=8;state.energy+=5;state.enemyGold+=8;state.enemyEnergy+=5;
  state.gold += state.farms.filter(f=>f.team===0&&f.hp>0).length*2;state.enemyGold += state.farms.filter(f=>f.team===1&&f.hp>0).length*2;
  for(const mine of state.mines){
   const blue=state.units.filter(u=>u.team===0&&u.hp>0&&Math.hypot(u.x-mine.x,u.y-mine.y)<58).length;
   const red=state.units.filter(u=>u.team===1&&u.hp>0&&Math.hypot(u.x-mine.x,u.y-mine.y)<58).length;
   const controller=blue>red?0:red>blue?1:-1;
   if(controller===-1){mine.emptyTime=(mine.emptyTime||0)+1;mine.controlTime=0;if(mine.emptyTime>=5)mine.owner=-1;}
   else {mine.emptyTime=0;if(mine.owner!==controller){mine.owner=controller;mine.controlTime=0;mine.rewarded=false;}mine.controlTime=(mine.controlTime||0)+1;
    if(mine.owner===0)state.gold+=mine.income;else state.enemyGold+=mine.income;
    if(mine.kind==='special'&&mine.controlTime>=30&&!mine.rewarded){if(mine.owner===0)state.energy+=25;else state.enemyEnergy+=25;mine.rewarded=true;if(mine.owner===localTeam())addLog('Mỏ đặc biệt thưởng +25 năng lượng!');}
   }
  }
 }
 // AI trains scouts to explore and contest mines before committing to attacks.
 if(mode==='ai'&&aiTimer>=5){
  aiTimer=0;
  const aiScouts=state.units.filter(u=>u.team===1&&u.type==='scout'&&u.hp>0).length+state.pendingSpawns.filter(u=>u.team===1&&u.type==='scout').length;
  if(aiScouts<2&&state.enemyGold>=40){state.enemyGold-=40;const scout=spawn(1,'scout',undefined,undefined,true,'explore');if(scout)scout.order='explore';}
  else if(state.enemyGold>=250&&state.enemyEnergy>=70&&Math.random()<.14){state.enemyGold-=250;state.enemyEnergy-=70;spawn(1,'cavalry');}
  else if(state.enemyGold>=110&&state.enemyEnergy>=25&&Math.random()<.42){state.enemyGold-=110;state.enemyEnergy-=25;spawn(1,'spearman');}
  else if(state.enemyGold>=75&&state.enemyEnergy>=15&&Math.random()<.6){state.enemyGold-=75;state.enemyEnergy-=15;spawn(1,'archer');}
  else if(state.enemyGold>=50){state.enemyGold-=50;spawn(1,'infantry');}
  const enemyBase=state.bases[1];if(state.enemyGold>=100&&activeFortressGuns(enemyBase)<2&&Math.random()<.25)buildTurret(1);
 }
 // unit movement and combat
 for(const u of [...state.units]){
  if(u.hp<=0)continue;const s=specs[u.type];u.walk+=dt;u.moving=false;u.attackTimer-=dt;const startX=u.x,startY=u.y;
  constrainToBaseDeploymentZone(u);
  let target=nearestEnemy(u);if(!unitTargetValid(target,u))target=null;
  if(mode==='ai'&&u.team===1&&!target){
   if(!u.dest||Math.hypot(u.dest.x-u.x,u.dest.y-u.y)<35||Math.random()<.003){
    const cols=MAP_TILES,rows=MAP_TILES,cw=W/cols,ch=H/rows;
    // Prefer neutral or enemy-controlled mines; otherwise explore an unseen cell.
    const mineTargets=state.mines.filter(m=>m.owner!==1).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y));
    let candidate=mineTargets.length?{x:mineTargets[0].x,y:mineTargets[0].y}:null;
    if(!candidate||Math.hypot(candidate.x-u.x,candidate.y-u.y)<70){candidate=null;for(let k=0;k<48;k++){const gx=Math.floor(Math.random()*cols),gy=Math.floor(Math.random()*rows),idx=gy*cols+gx;if(!state.enemyFogSeen[idx]){candidate={x:(gx+.5)*cw,y:(gy+.5)*ch};break;}}}
    if(!candidate)candidate={x:Math.random()*W,y:45+Math.random()*(H-75)};
    u.dest=candidate;u.order='explore';
   }
   const ed=Math.hypot(u.dest.x-u.x,u.dest.y-u.y);if(ed>5){u.moving=true;const step=Math.min(ed,s.speed*dt);u.x+=(u.dest.x-u.x)/ed*step;u.y+=(u.dest.y-u.y)/ed*step;}
  }
  if(target){
   const d=dist(u,target),tr=target.type?specs[target.type]:null;
   const range=s.range+(tr?tr.r:target.w?35:10);
   if(d<=range){
    if(u.attackTimer<=0){u.attackTimer=s.cooldown;
      if(u.type==='archer'){state.bullets.push({x:u.x,y:u.y-3,target,damage:s.damage,team:u.team,speed:280,life:2,attackerType:u.type});}
      else hurt(target,s.damage,u.team,u.type);
    }
   }else if((u.order==='attack'||(mode==='ai'&&u.team===1))&&(gameTime>=DEPLOYMENT_LOCK_SECONDS||u.type==='scout')){
    const dx=(target.x-u.x)/Math.max(1,d),dy=(target.y-u.y)/Math.max(1,d);u.moving=true;u.x+=dx*s.speed*dt;u.y+=dy*s.speed*dt;
    constrainToBaseDeploymentZone(u);
    u.x=Math.max(22,Math.min(W-22,u.x));u.y=Math.max(45,Math.min(H-30,u.y));
   }
  }
  // Player units with a move order travel to the clicked point, not a fixed lane.
  if((mode==='pvp'||u.team===0)&&u.order==='move'&&u.dest){
   const dd=Math.hypot(u.dest.x-u.x,u.dest.y-u.y);
   if(dd<5){u.order='hold';u.dest=null;}
   else{
    u.moving=true;const step=Math.min(dd,s.speed*dt);
    u.x+=(u.dest.x-u.x)/dd*step;u.y+=(u.dest.y-u.y)/dd*step;
    u.x=Math.max(22,Math.min(W-22,u.x));u.y=Math.max(45,Math.min(H-30,u.y));
    constrainToBaseDeploymentZone(u);
   }
  }
  // Face the direction actually travelled this frame; when standing, face a target that is within attack range.
  const movedX=u.x-startX,movedY=u.y-startY;
  if(movedX*movedX+movedY*movedY>1e-4)u.facing=facingFrom(movedX,movedY);
  else if(target&&dist(u,target)<=s.range+(target.type?specs[target.type].r:target.w?35:10))u.facing=facingFrom(target.x-u.x,target.y-u.y);
 }
 // bullets track moving target
 for(const b of [...state.bullets]){
  if(!b.target||b.target.hp<=0){state.bullets=state.bullets.filter(q=>q!==b);continue;}
  const d=dist(b,b.target),step=b.speed*dt;
  if(d<=step+7){hurt(b.target,b.damage,b.team,b.attackerType);state.bullets=state.bullets.filter(q=>q!==b);}
  else{b.x+=(b.target.x-b.x)/d*step;b.y+=(b.target.y-b.y)/d*step;b.life-=dt;if(b.life<=0)state.bullets=state.bullets.filter(q=>q!==b);}
 }
 // Integrated fortress cannons preserve the former tower firing stats.
 for(const base of state.bases)for(let index=0;index<(base.guns||[]).length;index++){
  const gun=base.guns[index];if(!gun.active)continue;gun.cool-=dt;const source=fortressGunPosition(base,index);let target=null,bd=190;
  for(const u of state.units){if(u.team===base.team)continue;if((mode==='pvp'&&!teamCanSee(base.team,u.x,u.y))||(mode==='ai'&&base.team===1&&!aiCanSee(u.x,u.y)))continue;const d=Math.hypot(source.x-u.x,source.y-u.y);if(d<bd){bd=d;target=u;}}
  if(target&&gun.cool<=0){gun.cool=1.0;state.bullets.push({x:source.x,y:source.y-8,target,damage:17,team:base.team,speed:320,life:1.2});}
 }
 // Neutral monsters guarding the gold mines attack nearby player units.
 for(const g of state.guards){
  if(g.hp<=0)continue;g.timer-=dt;
  let target=state.units.filter(u=>u.team===0&&u.hp>0&&Math.hypot(u.x-g.x,u.y-g.y)<g.aggro).sort((a,b)=>Math.hypot(a.x-g.x,a.y-g.y)-Math.hypot(b.x-g.x,b.y-g.y))[0];
  if(target){
   const d=Math.hypot(target.x-g.x,target.y-g.y);
   if(d>g.range){g.x+=(target.x-g.x)/d*g.speed*dt;g.y+=(target.y-g.y)/d*g.speed*dt;}
   else if(g.timer<=0){target.hp-=g.damage;g.timer=g.cooldown;state.effects.push({x:target.x,y:target.y,life:.18,max:.18,color:'#ff9f43'});}
  }else{
   const d=Math.hypot(g.homeX-g.x,g.homeY-g.y);
   if(d>3){g.x+=(g.homeX-g.x)/d*g.speed*dt;g.y+=(g.homeY-g.y)/d*g.speed*dt;}
  }
 }
 state.guards=state.guards.filter(g=>g.hp>0);
 // Fog of war: explored terrain stays visible, while enemy units only render in currently revealed areas.
 const cols=MAP_TILES,rows=MAP_TILES,cellW=W/cols,cellH=H/rows;
 for(const u of state.units){if(u.team!==0)continue;const radius=unitVisionRadius(u.type);
  const minX=Math.max(0,Math.floor((u.x-radius)/cellW)),maxX=Math.min(cols-1,Math.ceil((u.x+radius)/cellW));
  const minY=Math.max(0,Math.floor((u.y-radius)/cellH)),maxY=Math.min(rows-1,Math.ceil((u.y+radius)/cellH));
  const radiusSq=radius*radius;for(let gy=minY;gy<=maxY;gy++)for(let gx=minX;gx<=maxX;gx++){const dx=(gx+.5)*cellW-u.x,dy=(gy+.5)*cellH-u.y;if(dx*dx+dy*dy<=radiusSq)state.fogSeen[gy*cols+gx]=1;}
 }
 // AI has its own independent vision map and stale memory of sightings.
 const aiSources=[...state.units.filter(u=>u.team===1&&u.hp>0).map(u=>({x:u.x,y:u.y,r:u.type==='scout'?145:(u.type==='spearman'?120:105)})),{x:state.bases[1].x,y:state.bases[1].y,r:160}];
 for(const source of aiSources){
  const minX=Math.max(0,Math.floor((source.x-source.r)/cellW)),maxX=Math.min(cols-1,Math.ceil((source.x+source.r)/cellW));
  const minY=Math.max(0,Math.floor((source.y-source.r)/cellH)),maxY=Math.min(rows-1,Math.ceil((source.y+source.r)/cellH));
  const radiusSq=source.r*source.r;for(let gy=minY;gy<=maxY;gy++)for(let gx=minX;gx<=maxX;gx++){const dx=(gx+.5)*cellW-source.x,dy=(gy+.5)*cellH-source.y;if(dx*dx+dy*dy<=radiusSq)state.enemyFogSeen[gy*cols+gx]=1;}
 }
 const blueBase=state.bases[0];if(aiCanSee(blueBase.x,blueBase.y))state.enemyMemory.base={x:blueBase.x,y:blueBase.y,age:0};
 for(const u of state.units){if(u.team===0&&aiCanSee(u.x,u.y)){const old=state.enemyMemory.targets.find(m=>m.id===u.id);if(old){old.x=u.x;old.y=u.y;old.age=0;}else state.enemyMemory.targets.push({id:u.id,x:u.x,y:u.y,age:0});}}
 for(const m of state.enemyMemory.targets)m.age+=dt;state.enemyMemory.targets=state.enemyMemory.targets.filter(m=>m.age<90);
 if(state.enemyMemory.base)state.enemyMemory.base.age+=dt;
 // The fortress provides the same local vision as before; integrated guns preserve the prior Fog of War rules.
 for(const source of [{x:state.bases[0].x,y:state.bases[0].y,r:175}]){
  const minX=Math.max(0,Math.floor((source.x-source.r)/cellW)),maxX=Math.min(cols-1,Math.ceil((source.x+source.r)/cellW));
  const minY=Math.max(0,Math.floor((source.y-source.r)/cellH)),maxY=Math.min(rows-1,Math.ceil((source.y+source.r)/cellH));
  const radiusSq=source.r*source.r;for(let gy=minY;gy<=maxY;gy++)for(let gx=minX;gx<=maxX;gx++){const dx=(gx+.5)*cellW-source.x,dy=(gy+.5)*cellH-source.y;if(dx*dx+dy*dy<=radiusSq)state.fogSeen[gy*cols+gx]=1;}
 }
 for(const e of state.effects)e.life-=dt;state.effects=state.effects.filter(e=>e.life>0);
 updateHUD();
}
function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function bar(x,y,w,h,hp,max,team){
 ctx.fillStyle='#111827';ctx.fillRect(x,y,w,h);ctx.fillStyle=team===0?'#4baeff':'#ff626b';ctx.fillRect(x+1,y+1,(w-2)*Math.max(0,hp/max),h-2);ctx.strokeStyle='#e9f2ff66';ctx.strokeRect(x,y,w,h);
}
function teamPalette(team){
 return team===0?{main:'#3b8f7d',light:'#dcf5d0',deep:'#1d5861',shadow:'#123a40',trim:'#f7d587',glow:'#74d5bb'}:{main:'#bc5c4b',light:'#f7d8b5',deep:'#6f2f2a',shadow:'#432126',trim:'#efd7a8',glow:'#f39b65'};
}
function pill(x,y,w,h,r,fill,stroke,line=2){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}}
function zoomLerp(a,b,t){return a+(b-a)*Math.max(0,Math.min(1,t));}
function unitTargetHeight(type){
 const tileHeight={scout:1.3,infantry:1.3,archer:1.3,spearman:1.55,cavalry:1.65}[normalizeUnitType(type)]||1.3;
 return TILE_SIZE*tileHeight;
}
function unitHitRadius(u){return Math.max((specs[u.type]?.r||8)*2+9,unitTargetHeight(u.type)*.65);}
function drawMusterYard(b){const yard=musterYard(b);drawUprightAt(yard.x,yard.y,()=>{ctx.save();ctx.fillStyle='#4f463738';ctx.beginPath();ctx.ellipse(yard.x+4,yard.y+8,yard.w*.52,yard.h*.52,-.08,0,Math.PI*2);ctx.fill();ctx.fillStyle=b.team===0?'#9c875c':'#826558';ctx.beginPath();ctx.ellipse(yard.x,yard.y,yard.w*.50,yard.h*.50,-.08,0,Math.PI*2);ctx.fill();ctx.strokeStyle=b.team===0?'#d0bd84':'#c89982';ctx.lineWidth=3;ctx.setLineDash([7,6]);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#554b3b66';ctx.lineWidth=5;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(yard.x-48,yard.y+i*28);ctx.quadraticCurveTo(yard.x,yard.y+i*28+5,yard.x+48,yard.y+i*28);ctx.stroke();}ctx.fillStyle='#f1e3b2';ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.fillText('SÂN TẬP KẾT',yard.x,yard.y+yard.h*.39);ctx.restore();});}
function drawBase(b){return drawUprightAt(b.x,b.y,()=>{
 const w=238,h=200,blue=b.team===0;ctx.save();
 if(fortressSprite.complete&&fortressSprite.naturalWidth)ctx.drawImage(fortressSprite,b.x-w/2,b.y-h+16,w,h);
 else {ctx.fillStyle='#8995a0';ctx.fillRect(b.x-w*.42,b.y-h*.62,w*.84,h*.62);ctx.fillStyle='#2c5e9b';ctx.fillRect(b.x-w*.25,b.y-h*.9,w*.5,h*.34);}
 if(!blue){ctx.fillStyle='#b92f48';ctx.beginPath();ctx.moveTo(b.x+3,b.y-116);ctx.lineTo(b.x+28,b.y-108);ctx.lineTo(b.x+3,b.y-97);ctx.closePath();ctx.fill();}
 if(selectedFortress===b){ctx.strokeStyle=blue?'#74c8ff':'#ff777f';ctx.lineWidth=4;ctx.setLineDash([10,5]);ctx.beginPath();ctx.ellipse(b.x,b.y+2,102,48,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
 bar(b.x-48,b.y+43,96,10,b.hp,b.max,b.team);ctx.textAlign='center';ctx.font='900 13px system-ui';ctx.lineWidth=3;ctx.strokeStyle='#172633';ctx.strokeText(blue?'PHÁO ĐÀI XANH':'PHÁO ĐÀI ĐỎ',b.x,b.y+68);ctx.fillStyle='#fff';ctx.fillText(blue?'PHÁO ĐÀI XANH':'PHÁO ĐÀI ĐỎ',b.x,b.y+68);ctx.restore();
});}
function drawUnit(u){return drawUprightAt(u.x,u.y,()=>{
 const s=specs[u.type],blue=u.team===0,p=teamPalette(u.team),r=s.r*2;
 const angle=blue?0:Math.PI;
 if(u.type==='scout'&&scoutSpriteSheet.complete&&scoutSpriteSheet.naturalWidth){
  const clip=scoutClips[blue?'blue':'red'][u.moving?'walk':'idle'];
  const cellW=scoutSpriteSheet.naturalWidth/4,cellH=scoutSpriteSheet.naturalHeight/4;
  const frame=Math.floor(u.walk*clip.fps)%clip.frames,height=unitTargetHeight('scout')/.875,width=height*cellW/cellH;
  ctx.fillStyle=p.glow+'20';ctx.beginPath();ctx.ellipse(u.x,u.y+2,width*.31,height*.10,0,0,Math.PI*2);ctx.fill();
  const foot=scoutFootAnchors[clip.row][frame];
  ctx.drawImage(scoutSpriteSheet,frame*cellW,clip.row*cellH,cellW,cellH,u.x-width/2,u.y-height*foot,width,height);
  return;
 }
 if(u.type==='cavalry'&&cavalrySpriteSheet.complete&&cavalrySpriteSheet.naturalWidth){
  const clip=cavalryClips[blue?'blue':'red'][u.moving?'walk':'idle'];
  const cellW=cavalrySpriteSheet.naturalWidth/4,cellH=cavalrySpriteSheet.naturalHeight/4;
  const frame=Math.floor(u.walk*clip.fps)%clip.frames,height=unitTargetHeight('cavalry')/.95,width=height*cellW/cellH;
  ctx.fillStyle=p.glow+'20';ctx.beginPath();ctx.ellipse(u.x,u.y+3,width*.33,height*.11,0,0,Math.PI*2);ctx.fill();
  ctx.drawImage(cavalrySpriteSheet,frame*cellW,clip.row*cellH,cellW,cellH,u.x-width/2,u.y-height*.88,width,height);
  return;
 }
 if(u.type==='spearman'&&spearmanSpriteSheet.complete&&spearmanSpriteSheet.naturalWidth){
  const clip=spearmanClips[u.moving?'walk':'idle'];
  const direction=Math.max(0,SPEARMAN_DIRECTIONS.indexOf(u.facing||'down'));
  const row=(blue?0:8)+direction*2+(u.moving?1:0);
  const cellW=spearmanSpriteSheet.naturalWidth/4,cellH=spearmanSpriteSheet.naturalHeight/SPEARMAN_ROWS;
  const frame=Math.floor(u.walk*clip.fps)%clip.frames;
  const height=unitTargetHeight('spearman')*.96,width=height*cellW/cellH;
  ctx.fillStyle=p.glow+'20';ctx.beginPath();ctx.ellipse(u.x,u.y+2,width*.30,height*.10,0,0,Math.PI*2);ctx.fill();
  ctx.drawImage(spearmanSpriteSheet,frame*cellW,row*cellH,cellW,cellH,u.x-width/2,u.y-height*.90,width,height);
  return;
 }
 if(u.type==='infantry'&&infantrySpriteSheet.complete&&infantrySpriteSheet.naturalWidth){
  const clip=infantryClips[blue?'blue':'red'][u.moving?'walk':'idle'];
  const cellW=infantrySpriteSheet.naturalWidth/4,cellH=infantrySpriteSheet.naturalHeight/4;
  const frame=Math.floor(u.walk*clip.fps)%clip.frames,size=unitTargetHeight('infantry')/.875;
  // Independent soft team marker; the sprite atlas supplies the detailed foot shadow.
  ctx.fillStyle=p.glow+'20';ctx.beginPath();ctx.ellipse(u.x,u.y+2,size*.30,size*.12,0,0,Math.PI*2);ctx.fill();
  ctx.drawImage(infantrySpriteSheet,frame*cellW,clip.row*cellH,cellW,cellH,u.x-size/2,u.y-size*.88,size,size);
  return;
 }
 if(u.type==='archer'&&archerSpriteSheet.complete&&archerSpriteSheet.naturalWidth){
  const clip=archerClips[blue?'blue':'red'][u.moving?'walk':'idle'];
  const cellW=archerSpriteSheet.naturalWidth/4,cellH=archerSpriteSheet.naturalHeight/4;
  const frame=Math.floor(u.walk*clip.fps)%clip.frames;
  const height=unitTargetHeight('archer')/.95,width=height*cellW/cellH;
  ctx.fillStyle=p.glow+'20';ctx.beginPath();ctx.ellipse(u.x,u.y+2,width*.31,height*.10,0,0,Math.PI*2);ctx.fill();
  ctx.drawImage(archerSpriteSheet,frame*cellW,clip.row*cellH,cellW,cellH,u.x-width/2,u.y-height*.88,width,height);
  return;
 }
 const spriteScale=unitTargetHeight(u.type)/Math.max(1,s.r*4.6);
 ctx.save();ctx.translate(u.x,u.y);ctx.scale(spriteScale,spriteScale);ctx.translate(-u.x,-u.y);
 // unit shadow and subtle team-color ground marker
 ctx.save();ctx.translate(u.x,u.y);
 ctx.fillStyle='#1b332d38';ctx.beginPath();ctx.ellipse(3,r*.55,r*1.15,r*.60,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=p.glow+'25';ctx.beginPath();ctx.ellipse(0,0,r*1.08,r*.83,0,0,Math.PI*2);ctx.fill();
 if(u.type==='cavalry'){
  ctx.rotate(angle);
  // Cartoon warhorse: hooves, legs, body, mane and head facing forward.
  ctx.strokeStyle='#503a2d';ctx.lineWidth=Math.max(2,r*.11);ctx.lineCap='round';
  for(const [lx,ly,dx,dy] of [[-r*.52,r*.25,-r*.12,r*.72],[-r*.20,r*.27,-r*.28,r*.70],[r*.35,r*.23,r*.25,r*.70],[r*.63,r*.10,r*.72,r*.55]]){
   ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(dx,dy);ctx.stroke();
   ctx.fillStyle='#392f2b';ctx.beginPath();ctx.ellipse(dx,dy+1,r*.16,r*.09,0,0,Math.PI*2);ctx.fill();
  }
  // body and rump
  ctx.fillStyle=blue?'#9b6842':'#8c493d';ctx.strokeStyle='#4a3028';ctx.lineWidth=2.2;
  ctx.beginPath();ctx.ellipse(-r*.05,r*.08,r*.76,r*.43,-.06,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=blue?'#bf8a5b':'#b96a55';ctx.beginPath();ctx.ellipse(-r*.52,r*.02,r*.28,r*.34,0,0,Math.PI*2);ctx.fill();
  // neck, head and ears
  ctx.fillStyle=blue?'#a9744a':'#994f42';ctx.strokeStyle='#4a3028';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(r*.34,-r*.14);ctx.lineTo(r*.54,-r*.66);ctx.lineTo(r*.82,-r*.70);ctx.lineTo(r*.92,-r*.43);ctx.lineTo(r*.62,-r*.23);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(r*.65,-r*.66);ctx.lineTo(r*.62,-r*.88);ctx.lineTo(r*.78,-r*.70);ctx.fill();ctx.stroke();
  ctx.fillStyle='#33251f';ctx.beginPath();ctx.arc(r*.78,-r*.56,r*.055,0,Math.PI*2);ctx.fill();
  // mane and tail
  ctx.strokeStyle='#382b29';ctx.lineWidth=r*.13;ctx.beginPath();ctx.moveTo(r*.42,-r*.54);ctx.quadraticCurveTo(r*.12,-r*.72,r*.17,-r*.28);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-r*.70,-r*.02);ctx.quadraticCurveTo(-r*1.12,-r*.10,-r*.94,r*.28);ctx.stroke();
  // saddle and rider torso
  pill(-r*.29,-r*.37,r*.68,r*.44,5,p.deep,p.trim,1.5);
  pill(-r*.22,-r*.88,r*.52,r*.56,5,p.main,p.trim,2);
  ctx.fillStyle='#d9b18b';ctx.beginPath();ctx.arc(r*.02,-r*.99,r*.22,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#65452f';ctx.lineWidth=1.5;ctx.stroke();
  // helmet and forward lance
  ctx.fillStyle=p.deep;ctx.beginPath();ctx.arc(r*.02,-r*1.02,r*.235,Math.PI,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#e8e2cf';ctx.lineWidth=2.7;ctx.beginPath();ctx.moveTo(r*.28,-r*.51);ctx.lineTo(r*1.20,-r*.77);ctx.stroke();
  ctx.fillStyle='#f4eee0';ctx.beginPath();ctx.moveTo(r*1.28,-r*.80);ctx.lineTo(r*1.09,-r*.70);ctx.lineTo(r*1.12,-r*.84);ctx.closePath();ctx.fill();
 }else{
  ctx.rotate(angle);
  // rounded backpack / equipment silhouette
  if(u.type==='scout'){
   pill(-r*.90,-r*.55,r*.55,r*1.08,4,'#d7e7ce','#527e59',1.4);
   pill(-r*.76,-r*.40,r*.28,r*.40,3,'#86cc80',null);
  }
  // limbs visible as small boot/arm paddles
  pill(-r*.74,-r*.62,r*.39,r*.44,4,p.deep,'#102c45',1.5);
  pill(r*.34,-r*.62,r*.39,r*.44,4,p.deep,'#102c45',1.5);
  pill(-r*.74,r*.22,r*.39,r*.44,4,p.deep,'#102c45',1.5);
  pill(r*.34,r*.22,r*.39,r*.44,4,p.deep,'#102c45',1.5);
  // armored torso
  pill(-r*.65,-r*.72,r*1.30,r*1.45,7,p.main,p.trim,2.2);
  pill(-r*.39,-r*.48,r*.78,r*.84,5,p.light,p.deep,1.2);
  // shoulder pads
  ctx.fillStyle=p.trim;ctx.beginPath();ctx.arc(-r*.58,-r*.40,r*.22,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(r*.58,-r*.40,r*.22,0,Math.PI*2);ctx.fill();
  // helmet + visor, strongly readable at game zoom
  ctx.fillStyle=p.deep;ctx.beginPath();ctx.arc(0,-r*.67,r*.48,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=p.light;ctx.beginPath();ctx.arc(0,-r*.72,r*.38,0,Math.PI*2);ctx.fill();
  pill(r*.06,-r*.81,r*.40,r*.18,3,'#18384d','#d9f4ff',1);
  if(u.type==='archer'){
   // bow arc and arrow bundle
   ctx.strokeStyle='#8b5b32';ctx.lineWidth=3;ctx.beginPath();ctx.arc(r*.70,-r*.04,r*.50,-1.25,1.25);ctx.stroke();
   ctx.strokeStyle='#f4e0a2';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(r*.56,-r*.47);ctx.lineTo(r*.91,r*.40);ctx.moveTo(r*.42,-r*.25);ctx.lineTo(r*.78,r*.24);ctx.stroke();
  }else if(u.type==='infantry'){
   pill(r*.50,-r*.10,r*.55,r*.70,3,'#a6c7d5','#edf9ff',1);
   ctx.strokeStyle='#eff9ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(r*.76,-r*.52);ctx.lineTo(r*1.02,r*.42);ctx.stroke();
  }else{
   // scout binoculars and small radio pack
   ctx.fillStyle='#f8e69f';ctx.beginPath();ctx.arc(r*.22,-r*.72,r*.10,0,Math.PI*2);ctx.arc(r*.43,-r*.72,r*.10,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#dff8e5';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(-r*.27,-r*.95);ctx.lineTo(-r*.14,-r*1.26);ctx.stroke();
  }
 }
 ctx.restore();
 ctx.restore();
});
}
function drawUnitHealthBar(u){
 if(u.type==='scout'){
  const height=unitTargetHeight('scout')/.875,width=height*.72;
  bar(u.x-width/2,u.y-height*.98-8,width,6,u.hp,u.max,u.team);return;
 }
 if(u.type==='infantry'){
  const size=unitTargetHeight('infantry')/.875,width=size*.58;
  bar(u.x-width/2,u.y-size*.88-8,width,6,u.hp,u.max,u.team);return;
 }
 if(u.type==='cavalry'){
  const size=unitTargetHeight('cavalry')/.95,aspect=cavalrySpriteSheet.naturalHeight?cavalrySpriteSheet.naturalWidth/cavalrySpriteSheet.naturalHeight:1.2,width=size*aspect*.52;
  bar(u.x-width/2,u.y-size*.88-8,width,6,u.hp,u.max,u.team);return;
 }
 if(u.type==='archer'&&archerSpriteSheet.naturalHeight){
  const size=unitTargetHeight('archer')/.95,width=size*(archerSpriteSheet.naturalWidth/4)/(archerSpriteSheet.naturalHeight/4)*.50;
  bar(u.x-width/2,u.y-size*.88-8,width,6,u.hp,u.max,u.team);return;
 }
 const r=(specs[u.type]?.r||9)*2;bar(u.x-r-5,u.y-r-15,(r+5)*2,6,u.hp,u.max,u.team);
}
function drawUnitSelection(u){const r=(specs[u.type]?.r||9)*2;ctx.strokeStyle='#fff4a8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(u.x,u.y,r+7,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff4a8';ctx.beginPath();ctx.arc(u.x,u.y+r+9,3,0,Math.PI*2);ctx.fill();}
let dragSelect=null;

function makePineSprite(variant){
 const sprite=document.createElement('canvas');sprite.width=128;sprite.height=152;const c=sprite.getContext('2d');
 const palettes=[['#173b2b','#245638','#347344','#4d8a4b','#79a958'],['#193d33','#285c4b','#34735a','#4b8a61','#7cab67'],['#233d32','#365c3c','#4c7942','#668d43','#92a957'],['#263e2d','#355a36','#477544','#65904b','#9ab75f'],['#153b32','#205344','#2f6d50','#468158','#77a365']];
 const palette=palettes[variant],shape=[{tiers:5,spread:.80},{tiers:4,spread:1.03},{tiers:5,spread:1.14},{tiers:4,spread:.90},{tiers:6,spread:1.08}][variant];
 c.fillStyle='#17251d55';c.beginPath();c.ellipse(66,132,43,12,0,0,Math.PI*2);c.fill();
 const trunk=c.createLinearGradient(58,0,72,0);trunk.addColorStop(0,'#4b3020');trunk.addColorStop(.45,'#8e5e35');trunk.addColorStop(1,'#39281d');
 c.fillStyle=trunk;c.beginPath();c.moveTo(60,121);c.lineTo(61,91);c.lineTo(67,87);c.lineTo(72,91);c.lineTo(73,124);c.closePath();c.fill();
 const tiers=shape.tiers,top=14,span=103;
 for(let t=tiers-1;t>=0;t--){
  const progress=t/(tiers-1),cy=top+progress*span*.68,width=(20+progress*45)*shape.spread,height=35+progress*17;
  const y0=cy-height*.5,y1=cy+height*.5,wiggle=(variant+1)*3+t*2;
  c.beginPath();c.moveTo(64,y0);c.lineTo(64-width*.26,y0+height*.22);c.lineTo(64-width*.16,y0+height*.31);c.lineTo(64-width*.50,y0+height*.52);c.lineTo(64-width*.36,y0+height*.59);c.lineTo(64-width*.68,y0+height*.82);c.lineTo(64-width*.55,y1);c.lineTo(64+width*.57,y1);c.lineTo(64+width*.70,y0+height*.80);c.lineTo(64+width*.42,y0+height*.57);c.lineTo(64+width*.61,y0+height*.50);c.lineTo(64+width*.20,y0+height*.29);c.lineTo(64+width*.31,y0+height*.21);c.closePath();
  c.fillStyle=palette[1];c.fill();
  const light=c.createLinearGradient(64-width*.55,y0,64+width*.55,y1);light.addColorStop(0,palette[4]);light.addColorStop(.38,palette[3]);light.addColorStop(.70,palette[2]);light.addColorStop(1,palette[0]);c.fillStyle=light;
  c.beginPath();c.moveTo(64,y0+2);c.lineTo(64-width*.25,y0+height*.24);c.lineTo(64-width*.13,y0+height*.34);c.lineTo(64-width*.46,y0+height*.53);c.lineTo(64-width*.33,y0+height*.61);c.lineTo(64-width*.57,y0+height*.86);c.lineTo(64,y1-2);c.closePath();c.fill();
  c.strokeStyle=palette[4]+'b8';c.lineWidth=1.7;c.lineCap='round';
  for(let b=0;b<4;b++){const by=y0+height*(.34+b*.13),spread=width*(.22+b*.075);c.beginPath();c.moveTo(64,by);c.lineTo(64-spread,by+height*.08);c.moveTo(64,by+2);c.lineTo(64+spread*.92,by+height*.08);c.stroke();}
  c.strokeStyle=palette[0]+'85';c.lineWidth=2;c.beginPath();c.moveTo(64+width*.30,y0+height*.60);c.lineTo(64+width*.56,y1-1);c.stroke();
 }
 // Fine needle flecks are baked into the reusable sprite, not redrawn per frame.
 for(let i=0;i<52;i++){
  const x=13+((i*37+variant*19)%101),y=22+((i*53+variant*11)%91),r=1+(i%3)*.45;
  c.fillStyle=i%4===0?palette[4]+'c8':i%3===0?palette[0]+'a8':palette[3]+'8c';c.beginPath();c.ellipse(x,y,r*1.7,r*.7,(i%5-2)*.18,0,Math.PI*2);c.fill();
 }
 return sprite;
}
const pineSprites=Array.from({length:5},(_,i)=>makePineSprite(i));
function drawTree(x,y,scale=1,variant=0){const sprite=pineSprites[((variant%5)+5)%5],width=74*scale,height=105*scale;return drawUprightAt(x,y,()=>ctx.drawImage(sprite,x-width/2,y-height,width,height));}
function drawRockClusterSprite(){
 const sprite=document.createElement('canvas');sprite.width=256;sprite.height=184;const c=sprite.getContext('2d');
 const scree=c.createRadialGradient(128,126,20,128,126,118);scree.addColorStop(0,'#9b8a695f');scree.addColorStop(.68,'#8c866b48');scree.addColorStop(1,'#8c866b00');
 c.fillStyle=scree;c.beginPath();for(let i=0;i<=24;i++){const a=i/24*Math.PI*2,r=1+Math.sin(a*5+.4)*.12+Math.sin(a*9)*.05,x=128+Math.cos(a)*112*r,y=132+Math.sin(a)*24*r;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}c.closePath();c.fill();
 for(let i=0;i<24;i++){const x=24+(i*59)%208,y=129+((i*23)%30),r=2+(i%3)*1.4;c.fillStyle=i%2?'#c6b79245':'#594f3e35';c.beginPath();c.ellipse(x,y,r*1.8,r*.8,(i%7)*.24,0,Math.PI*2);c.fill();}
 c.fillStyle='#1b241e55';c.beginPath();c.ellipse(128,153,109,22,0,0,Math.PI*2);c.fill();
 const boulders=[{x:57,y:106,w:56,h:58},{x:105,y:77,w:75,h:82},{x:166,y:108,w:62,h:58},{x:204,y:126,w:37,h:39},{x:32,y:131,w:32,h:31}];
 for(let i=0;i<boulders.length;i++){
  const b=boulders[i],cx=b.x,cy=b.y,w=b.w,h=b.h;
  c.fillStyle='#4a4d49';c.beginPath();c.moveTo(cx-w*.52,cy+h*.25);c.lineTo(cx-w*.42,cy-h*.28);c.lineTo(cx-w*.12,cy-h*.50);c.lineTo(cx+w*.28,cy-h*.38);c.lineTo(cx+w*.53,cy+h*.05);c.lineTo(cx+w*.42,cy+h*.43);c.lineTo(cx-w*.25,cy+h*.48);c.closePath();c.fill();
  const shade=c.createLinearGradient(cx-w*.4,cy-h*.4,cx+w*.5,cy+h*.3);shade.addColorStop(0,'#d0c9b4');shade.addColorStop(.34,'#969b91');shade.addColorStop(.7,'#626d68');shade.addColorStop(1,'#39453f');c.fillStyle=shade;c.fill();
  c.fillStyle='#e1dac5';c.beginPath();c.moveTo(cx-w*.42,cy-h*.28);c.lineTo(cx-w*.12,cy-h*.50);c.lineTo(cx+w*.28,cy-h*.38);c.lineTo(cx+w*.02,cy-h*.13);c.lineTo(cx-w*.18,cy-h*.18);c.closePath();c.fill();
  c.fillStyle='#758079';c.beginPath();c.moveTo(cx-w*.12,cy-h*.50);c.lineTo(cx+w*.28,cy-h*.38);c.lineTo(cx+w*.53,cy+h*.05);c.lineTo(cx+w*.02,cy-h*.13);c.closePath();c.fill();
  c.strokeStyle='#29332f';c.lineWidth=2;c.beginPath();c.moveTo(cx-w*.52,cy+h*.25);c.lineTo(cx-w*.42,cy-h*.28);c.lineTo(cx-w*.12,cy-h*.50);c.lineTo(cx+w*.28,cy-h*.38);c.lineTo(cx+w*.53,cy+h*.05);c.lineTo(cx+w*.42,cy+h*.43);c.stroke();
 }
 // Broken scree stones around the foot of the ridge.
 for(let i=0;i<28;i++){
  const x=22+(i*47)%211,y=139+((i*31)%30),r=2+(i%4)*1.2;
  c.fillStyle=i%3?'#7c8176':'#c0b99f';c.beginPath();c.moveTo(x-r,y);c.lineTo(x-r*.25,y-r*.75);c.lineTo(x+r*.8,y-r*.35);c.lineTo(x+r,y+r*.45);c.lineTo(x-r*.55,y+r*.55);c.closePath();c.fill();
 }
 return sprite;
}
const rockClusterSprite=drawRockClusterSprite();
function drawRock(x,y,scale=1){const width=190*scale,height=136*scale;return drawUprightAt(x,y,()=>ctx.drawImage(rockClusterSprite,x-width/2,y-height*.88,width,height));}
const treeDecor=[],rockDecor=[];
function decorRandom(seed){const v=Math.sin((seed+19)*127.1+(seed+73)*311.7)*43758.5453;return v-Math.floor(v);}
function buildWorldDecor(){
 treeDecor.length=0;rockDecor.length=0;
 const keepClear=(x,y)=>state.bases.some(b=>Math.hypot(x-b.x,y-b.y)<Math.max(b.w||0,b.h||0)*.50+150)||state.mines.some(m=>Math.hypot(x-m.x,y-m.y)<95);
 const roadBuffer=(x,y)=>{
  const mainRoadY=H*0.55;
  const roadCenterX=W*0.5,roadHalfWidth=W*0.38;
  return Math.abs(y-mainRoadY)<32 && Math.abs(x-roadCenterX)<roadHalfWidth;
 };
 const distanceFromBase=(x,y)=>Math.min(...state.bases.map(b=>Math.hypot(x-b.x,y-b.y)));
 for(let team=0;team<state.bases.length;team++){
  const base=state.bases[team];
  for(let i=0;i<2;i++){
   const seed=91000+team*100+i*13,angle=(i-1)*.62-Math.PI/2,radius=108+decorRandom(seed)*10,x=base.x+Math.cos(angle)*radius,y=base.y+Math.sin(angle)*radius;
   if(roadBuffer(x,y))continue;
   treeDecor.push({x,y,scale:.8+decorRandom(seed+1)*.18,variant:(i+team*2)%5});
  }
 }
 for(let region=0;region<forestRegions.length;region++){
  const [cx,cy,rx,ry]=forestRegions[region];
  const clusterCount=1+Math.floor(decorRandom(region*97)*2);
  for(let cluster=0;cluster<clusterCount;cluster++){
   const seed=region*1000+cluster*17,clusterCenterX=cx+(decorRandom(seed)-.5)*.12,clusterCenterY=cy+(decorRandom(seed+1)-.5)*.12;
   const treeCount=3+Math.floor(decorRandom(seed+2)*5);
   for(let i=0;i<treeCount;i++){
    const angle=decorRandom(seed+3+i*5)*Math.PI*2,spread=Math.sqrt(decorRandom(seed+4+i*7))*0.7;
    const gx=Math.round((clusterCenterX+Math.cos(angle)*rx*spread)*MAP_TILES),gy=Math.round((clusterCenterY+Math.sin(angle)*ry*spread)*MAP_TILES);
    if(gx<1||gy<1||gx>=MAP_TILES-1||gy>=MAP_TILES-1)continue;
    const tile=gy*MAP_TILES+gx;
    if(terrainType[tile]!==1)continue;
    const x=(gx+.5)*TILE_SIZE,y=(gy+.5)*TILE_SIZE;
    if(keepClear(x,y)||roadBuffer(x,y)||distanceFromBase(x,y)<160)continue;
    const minTreeSpacing=58;
    let tooClose=false;
    for(const tree of treeDecor){if(Math.hypot(tree.x-x,tree.y-y)<minTreeSpacing){tooClose=true;break;}}
    if(tooClose)continue;
    treeDecor.push({x,y,scale:.68+decorRandom(seed+5+i*11)*.5,variant:Math.floor(decorRandom(seed+6+i*13)*5)});
   }
  }
 }
 for(let region=0;region<rockRegions.length;region++){
  const [cx,cy,rx,ry]=rockRegions[region];
  for(let i=0;i<3;i++){
   const seed=70000+region*100+i*11,angle=decorRandom(seed)*Math.PI*2,radius=decorRandom(seed+1)*.60;
   let gx=Math.round((cx+Math.cos(angle)*rx*radius)*MAP_TILES),gy=Math.round((cy+Math.sin(angle)*ry*radius)*MAP_TILES);
   if(gx<2||gy<2||gx>=MAP_TILES-2||gy>=MAP_TILES-2)continue;
   if(terrainType[gy*MAP_TILES+gx]!==3){
    let nearest=null,best=Infinity;
    for(let oy=-5;oy<=5;oy++)for(let ox=-5;ox<=5;ox++){const tx=gx+ox,ty=gy+oy;if(tx<0||ty<0||tx>=MAP_TILES||ty>=MAP_TILES||terrainType[ty*MAP_TILES+tx]!==3)continue;const d=ox*ox+oy*oy;if(d<best){best=d;nearest=[tx,ty];}}
    if(!nearest)continue;[gx,gy]=nearest;
   }
   const x=(gx+.5)*TILE_SIZE,y=(gy+.5)*TILE_SIZE;if(keepClear(x,y)||roadBuffer(x,y))continue;
   rockDecor.push({x,y,scale:.56+decorRandom(seed+2)*.55});
  }
 }
}
function drawGrassPatch(x,y,rx,ry,color){
 ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
}
function drawFarm(f,preview=false){return drawUprightAt(f.x,f.y,()=>{
 const x=f.x,y=f.y;ctx.save();
 if(preview)ctx.globalAlpha=.72;
 if(draggingFarm===f){ctx.strokeStyle='#ffe08a';ctx.lineWidth=3;ctx.setLineDash([5,4]);ctx.strokeRect(x-31,y-34,62,68);ctx.setLineDash([]);}
 if(farmSprite.complete&&farmSprite.naturalWidth){
  ctx.drawImage(farmSprite,x-44,y-37,88,69);
 }else{
  ctx.fillStyle='#244b2d35';ctx.beginPath();ctx.ellipse(x+2,y+14,29,15,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#b7d78a';ctx.beginPath();ctx.ellipse(x,y+8,31,17,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#8c6a3d';ctx.fillRect(x-20,y-10,40,16);
  ctx.fillStyle='#c89b52';ctx.fillRect(x-22,y-18,44,8);
  ctx.fillStyle='#a85d3a';ctx.beginPath();ctx.moveTo(x-25,y-10);ctx.lineTo(x,y-30);ctx.lineTo(x+25,y-10);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#efe4ba';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-12,y-8);ctx.lineTo(x-12,y+18);ctx.moveTo(x+12,y-8);ctx.lineTo(x+12,y+18);ctx.stroke();
  ctx.fillStyle='#f7d583';ctx.beginPath();ctx.arc(x+14,y-6,4,0,Math.PI*2);ctx.fill();
  for(let i=0;i<3;i++){ctx.strokeStyle='#4c8d58';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-30+i*7,y+6);ctx.lineTo(x-33+i*7,y+18);ctx.stroke();}
 }
 if(preview){const color=f.previewValid?'#72f2a0':'#ff6875';ctx.fillStyle=f.previewValid?'#47df7a38':'#f23d4f42';ctx.fillRect(x-31,y-34,62,68);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.setLineDash([7,4]);ctx.strokeRect(x-31,y-34,62,68);ctx.setLineDash([]);}
 ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#34533c';ctx.strokeText('NÔNG TRẠI',x,y+42);ctx.fillStyle='#fff';ctx.fillText('NÔNG TRẠI',x,y+42);ctx.restore();
});
}
function drawTerrainDetail(){
 const cols=MAP_TILES,rows=MAP_TILES;
 const microDetails=[];
 for(let i=0;i<8200;i++){
  const seed=i*97.3+19.7;
  const x=(seed % (cols*3)) * (TILE_SIZE * 0.42) + ((i % 7) * 8);
  const y=((seed * 1.63) % (rows*3)) * (TILE_SIZE * 0.42) + ((i % 11) * 6);
  const tx=Math.min(cols-1,Math.max(0,Math.floor(x/TILE_SIZE)));const ty=Math.min(rows-1,Math.max(0,Math.floor(y/TILE_SIZE)));
  const tileType=terrainType[ty*cols+tx];
  if(tileType===2)continue;
  const worldX=(tx+.5)*TILE_SIZE + (i%5-2)*2.2;
  const worldY=(ty+.5)*TILE_SIZE + (i%7-3)*2.7;
  if(tileType===1){
   const patchColors=['#8bc96b','#a5d67d','#6ea75d','#788f5b'];
   microDetails.push({x:worldX,y:worldY,rx:5+(i%4)*1.6,ry:3.1+(i%3)*1.1,color:patchColors[i%patchColors.length]+'99',shadow:'#dfeeb8'+'6f',shadowX:2.2,shadowY:-2.1,shadowRx:3.2,shadowRy:1.5,angle:(i%9)*0.35});
  }else if(tileType===3){
   const stoneColors=['#928873','#7b715f','#b3a28c','#a08974'];
   microDetails.push({x:worldX,y:worldY,rx:4.8+(i%3)*1.5,ry:3.3+(i%2)*1.2,color:stoneColors[i%stoneColors.length]+'8a',shadow:'#d9d0be'+'55',shadowX:-2.4,shadowY:1.8,shadowRx:2.8,shadowRy:1.7,angle:(i%7)*0.24});
  }else if(tileType===4){
   microDetails.push({x:worldX,y:worldY,rx:4.4,ry:2.8,color:'#f3d45d'+'7d',shadow:'#e9c867'+'88',shadowX:2.6,shadowY:-1.8,shadowRx:2.7,shadowRy:1.8,angle:(i%5)*0.33});
  }else{
   const verdant=['#8ccf72','#79b95d','#9cd67d','#a9d86d'];
   microDetails.push({x:worldX,y:worldY,rx:5.6+(i%4)*0.9,ry:3.1+(i%3)*0.9,color:verdant[i%verdant.length]+'70',shadow:'#dfeeb8'+'55',shadowX:1.8,shadowY:-1.6,shadowRx:2.9,shadowRy:1.2,angle:(i%9)*0.27});
  }
 }
 for(const item of microDetails){
  ctx.fillStyle=item.color;
  ctx.beginPath();ctx.ellipse(item.x,item.y,item.rx,item.ry,item.angle,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=item.shadow;
  ctx.beginPath();ctx.ellipse(item.x+item.shadowX,item.y+item.shadowY,item.shadowRx,item.shadowRy,item.angle*0.8,0,Math.PI*2);ctx.fill();
 }
}

function draw(){
 const viewScale=zoom;
 const {x:offsetX,y:offsetY}=viewOffsets(viewScale);
 renderView={scale:viewScale,offsetX,offsetY};
 ctx.setTransform(1,0,0,1,0,0);
 ctx.clearRect(0,0,VIEW_W,VIEW_H);
// The orthographic viewport's matte uses the same dark tone as unexplored fog,
// so no green page/background corners appear around the square world.
ctx.fillStyle='#0b1411';ctx.fillRect(0,0,VIEW_W,VIEW_H);
 ctx.save();
 ctx.translate(offsetX,offsetY);
 ctx.scale(viewScale,viewScale);

 // Precomputed 256 × 256 biome map with the requested area shares.
 ctx.drawImage(terrainSmoothCanvas,terrainPadding,terrainPadding,terrainCanvas.width,terrainCanvas.height,0,0,W,H);
 ctx.globalAlpha=.08;ctx.drawImage(terrainCanvas,0,0,W,H);ctx.globalAlpha=1;
 drawTerrainDetail();
 // Main road crossing meadow and ford, about 2–3 tiles wide.
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 ctx.beginPath();ctx.moveTo(-80,H*.57);ctx.bezierCurveTo(W*.12,H*.52,W*.19,H*.67,W*.32,H*.58);ctx.bezierCurveTo(W*.43,H*.50,W*.49,H*.51,W*.57,H*.57);ctx.bezierCurveTo(W*.72,H*.67,W*.83,H*.47,W+80,H*.52);
 ctx.strokeStyle='#765f3d55';ctx.lineWidth=83;ctx.stroke();ctx.strokeStyle='#d3bd82';ctx.lineWidth=100;ctx.stroke();ctx.strokeStyle='#e4d29d';ctx.lineWidth=80;ctx.stroke();
 ctx.globalAlpha=.38;ctx.setLineDash([12,15]);ctx.strokeStyle='#a98d5a';ctx.lineWidth=2.5;ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;ctx.restore();
 // Secondary earth track softens the open approach lanes without crossing bases or unit paths.
 ctx.save();ctx.beginPath();ctx.moveTo(W*.18,H*.21);ctx.quadraticCurveTo(W*.30,H*.29,W*.38,H*.26);ctx.quadraticCurveTo(W*.52,H*.33,W*.64,H*.25);ctx.quadraticCurveTo(W*.73,H*.18,W*.82,H*.26);
 ctx.strokeStyle='#9a7d59aa';ctx.lineWidth=26;ctx.stroke();ctx.strokeStyle='#f0d9a3cc';ctx.lineWidth=18;ctx.stroke();ctx.restore(); // Once a mine is discovered, keep its location visible on explored terrain.
 // Unexplored mines remain hidden by fog; current vision is not required after discovery.
 for(const m of state.mines){
  if(!currentlyVisible(m.x,m.y)&&!isTeamAreaExplored(localTeam(),m.x,m.y))continue;
  drawUprightAt(m.x,m.y,()=>{
  // Colorful collectible mine with stacked stones, gold crystals and a team-control ring.
  const mineTeam=m.owner===0?teamPalette(0):m.owner===1?teamPalette(1):null;
  ctx.fillStyle='#29472d40';ctx.beginPath();ctx.ellipse(m.x+3,m.y+15,35,17,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=mineTeam?mineTeam.glow+'55':'#d5e3bf';ctx.beginPath();ctx.ellipse(m.x,m.y+3,35,23,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#85978a';ctx.beginPath();ctx.moveTo(m.x-30,m.y+7);ctx.lineTo(m.x-24,m.y-12);ctx.lineTo(m.x-11,m.y-24);ctx.lineTo(m.x+7,m.y-25);ctx.lineTo(m.x+25,m.y-10);ctx.lineTo(m.x+31,m.y+7);ctx.lineTo(m.x+17,m.y+16);ctx.lineTo(m.x-19,m.y+16);ctx.closePath();ctx.fill();ctx.strokeStyle='#e0e9c9';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#bac9b0';ctx.beginPath();ctx.moveTo(m.x-20,m.y-11);ctx.lineTo(m.x-10,m.y-21);ctx.lineTo(m.x+4,m.y-21);ctx.lineTo(m.x-3,m.y-8);ctx.closePath();ctx.fill();
  const crystal=m.kind==='rich'?'#ffe16d':m.kind==='special'?'#c8a1ff':'#ffca5e';
  for(let i=0;i<5;i++){const cx=m.x-12+i*6,cy=m.y-6+(i%2)*6;ctx.fillStyle='#9a6d22';ctx.beginPath();ctx.moveTo(cx-3,cy+4);ctx.lineTo(cx-2,cy-3);ctx.lineTo(cx,cy-7);ctx.lineTo(cx+3,cy-2);ctx.lineTo(cx+3,cy+4);ctx.closePath();ctx.fill();ctx.fillStyle=crystal;ctx.beginPath();ctx.moveTo(cx-2,cy+3);ctx.lineTo(cx-1,cy-3);ctx.lineTo(cx,cy-6);ctx.lineTo(cx+2,cy-2);ctx.lineTo(cx+2,cy+3);ctx.closePath();ctx.fill();}
  if(m.kind==='special'){ctx.strokeStyle='#d6bdff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(m.x,m.y-1,39,0,Math.PI*2);ctx.stroke();}
  const labelColor=m.owner===0?'#1764a4':m.owner===1?'#a52d3a':'#42564a';ctx.font='900 11px system-ui';ctx.textAlign='center';const mineLabel=m.kind==='rich'?'MỎ GIÀU +5':m.kind==='special'?'MỎ ĐẶC BIỆT +3':'MỎ THƯỜNG +3';ctx.lineWidth=3;ctx.strokeStyle='#f1f8da';ctx.strokeText((m.owner===0?'XANH · ':m.owner===1?'ĐỎ · ':'TRUNG LẬP · ')+mineLabel,m.x,m.y+34);ctx.fillStyle=labelColor;ctx.fillText((m.owner===0?'XANH · ':m.owner===1?'ĐỎ · ':'TRUNG LẬP · ')+mineLabel,m.x,m.y+34);
  });
 }
 // Show friendly integrated cannon coverage while the unified fortress is selected.
 for(const base of state.bases){if(base.team!==localTeam()||selectedFortress!==base)continue;for(let index=0;index<(base.guns||[]).length;index++){
  if(!base.guns[index].active)continue;const pos=fortressGunPosition(base,index);ctx.save();ctx.beginPath();ctx.arc(pos.x,pos.y,190,0,Math.PI*2);ctx.fillStyle='rgba(76,166,255,0.08)';ctx.fill();ctx.strokeStyle='rgba(106,190,255,0.58)';ctx.lineWidth=2;ctx.setLineDash([9,6]);ctx.stroke();ctx.setLineDash([]);ctx.restore();
 }}
 // Depth-sort decorative scenery and game actors on world Y so units can pass in front of or behind trees.
 const sceneActors=[],enqueue=(y,draw)=>sceneActors.push({y,draw}),leftWorld=camX-260,topWorld=camY-260,rightWorld=camX+VIEW_W/viewScale+260,bottomWorld=camY+VIEW_H/viewScale+260;
 for(const tree of treeDecor){if(tree.x<leftWorld||tree.x>rightWorld||tree.y<topWorld||tree.y>bottomWorld)continue;enqueue(tree.y,()=>drawTree(tree.x,tree.y,tree.scale,tree.variant));}
 for(const rock of rockDecor){if(rock.x<leftWorld||rock.x>rightWorld||rock.y<topWorld||rock.y>bottomWorld)continue;enqueue(rock.y+18,()=>drawRock(rock.x,rock.y,rock.scale));}
 for(const b of state.bases){if(b.team!==localTeam()&&!currentlyVisible(b.x,b.y))continue;drawMusterYard(b);enqueue(b.y+106,()=>drawBase(b));}
 for(const f of state.farms)enqueue(f.y+24,()=>drawFarm(f));
 for(const g of state.guards){if(g.hp<=0||!currentlyVisible(g.x,g.y))continue;enqueue(g.y+9,()=>drawUprightAt(g.x,g.y,()=>{ctx.fillStyle='#24412f45';ctx.beginPath();ctx.ellipse(g.x+2,g.y+8,14,7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#7d4ba9';ctx.beginPath();ctx.arc(g.x,g.y,11,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#eed8ff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#f9ecff';ctx.beginPath();ctx.arc(g.x-3,g.y-2,2.2,0,Math.PI*2);ctx.arc(g.x+3,g.y-2,2.2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#26152f';ctx.fillRect(g.x-11,g.y-16,22,4);ctx.fillStyle='#ef5350';ctx.fillRect(g.x-10,g.y-15,20*Math.max(0,g.hp/g.max),2);}));}
 for(const u of state.units){if(u.team!==localTeam()&&!currentlyVisible(u.x,u.y))continue;enqueue(u.y+unitTargetHeight(u.type)*.48,()=>drawUnit(u));}
 sceneActors.sort((a,b)=>a.y-b.y);for(const actor of sceneActors)actor.draw();
 // Health bars are a separate foreground UI layer so canopies never obscure unit status.
 for(const u of state.units)if(u.hp>0&&(u.team===localTeam()||currentlyVisible(u.x,u.y)))drawUnitHealthBar(u);
 // Selection rings remain legible above canopy sprites, while the actor itself still respects Y-depth.
 for(const u of state.units)if((selected===u||u.selected)&&(u.team===localTeam()||currentlyVisible(u.x,u.y)))drawUnitSelection(u);
 // Projectiles and effects stay on their own foreground layer.
 for(const b of state.bullets){drawUprightAt(b.x,b.y,()=>{ctx.strokeStyle=b.team===0?'#a8e2ff':'#ffadb0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-5,b.y+3);ctx.stroke();});}
 for(const e of state.effects){drawUprightAt(e.x,e.y,()=>{ctx.globalAlpha=Math.max(0,e.life/e.max);ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,12+(1-e.life/e.max)*10,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;});}
 // Fog of war overlay: unrevealed cells are dark; previously explored cells remain dim.
 const cols=MAP_TILES,rows=MAP_TILES,cellW=W/cols,cellH=H/rows;
 const localFog=localTeam()===0?state.fogSeen:state.enemyFogSeen;
 // Render only fog cells inside the viewport; this keeps the larger map responsive.
 const planeLeft=(0-offsetX)/viewScale,planeTop=(0-offsetY)/viewScale,planeRight=(VIEW_W-offsetX)/viewScale,planeBottom=(VIEW_H-offsetY)/viewScale;
 const visibleCorners=[screenPlaneToWorld(planeLeft,planeTop),screenPlaneToWorld(planeRight,planeTop),screenPlaneToWorld(planeLeft,planeBottom),screenPlaneToWorld(planeRight,planeBottom)];
 const worldLeft=Math.max(0,Math.min(...visibleCorners.map(p=>p.x))),worldTop=Math.max(0,Math.min(...visibleCorners.map(p=>p.y)));
 const worldRight=Math.min(W,Math.max(...visibleCorners.map(p=>p.x))),worldBottom=Math.min(H,Math.max(...visibleCorners.map(p=>p.y)));
 const minGX=Math.max(0,Math.floor(worldLeft/cellW)-1),maxGX=Math.min(cols-1,Math.ceil(worldRight/cellW)+1);
 const minGY=Math.max(0,Math.floor(worldTop/cellH)-1),maxGY=Math.min(rows-1,Math.ceil(worldBottom/cellH)+1);
 for(let gy=minGY;gy<=maxGY;gy++)for(let gx=minGX;gx<=maxGX;gx++){
  if(!localFog[gy*cols+gx]){ctx.fillStyle='rgba(5,10,20,.91)';ctx.fillRect(gx*cellW,gy*cellH,cellW+0.5,cellH+0.5);}
 }
 // Keep placement feedback readable even when the cursor crosses unexplored fog.
 if(farmPlacement){const preview={x:farmPlacement.x,y:farmPlacement.y,team:localTeam(),previewValid:farmPlacement.valid};drawFarm(preview,true);}
 // Hide enemy forces and enemy structures when their location is not currently visible.
 function currentlyVisible(x,y){return teamCanSee(localTeam(),x,y);}
 // Return to screen coordinates for selection feedback and fixed viewport labels.
 ctx.restore();
 if(dragSelect){const x=Math.min(dragSelect.x,dragSelect.cx),y=Math.min(dragSelect.y,dragSelect.cy),w=Math.abs(dragSelect.cx-dragSelect.x),h=Math.abs(dragSelect.cy-dragSelect.y);ctx.fillStyle='#69b9ff22';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#8bd0ff';ctx.setLineDash([6,4]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);}
 if(farmPlacement){const valid=farmPlacement.valid,color=valid?'#47b96c':'#d84c58',text=valid?'NÔNG TRẠI · VỊ TRÍ HỢP LỆ':'NÔNG TRẠI · VỊ TRÍ BỊ CHẶN';ctx.save();ctx.font='700 13px system-ui';const w=Math.min(VIEW_W-32,Math.max(280,ctx.measureText(text+'  ·  Trái: đặt  |  Phải / Esc: hủy').width+28)),x=(VIEW_W-w)/2,y=VIEW_H-43;ctx.fillStyle='#101b25eF';ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,w,30,8);ctx.fill();ctx.stroke();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(text+'  ·  Trái: đặt  |  Phải / Esc: hủy',VIEW_W/2,y+15,w-18);ctx.restore();}
 ctx.textAlign='left';ctx.font='12px system-ui';ctx.fillStyle='#efffea99';ctx.fillText('CHIẾN TRƯỜNG 01',16,22);
 ctx.textAlign='right';ctx.fillStyle='#efffea99';ctx.fillText(gameTime<DEPLOYMENT_LOCK_SECONDS?'GIAI ĐOẠN TRINH SÁT · '+Math.ceil(DEPLOYMENT_LOCK_SECONDS-gameTime)+' GIÂY':'TẤN CÔNG ĐÃ MỞ KHÓA',VIEW_W-16,22);
}
function loop(ts){if(!last)last=ts;let dt=Math.min((ts-last)/1000,.05);last=ts;update(dt);if(mode==='pvp'&&netRole==='host'&&gameStarted){snapshotClock+=dt;if(snapshotClock>=.18){snapshotClock=0;sendSnapshot();}}draw();requestAnimationFrame(loop);}
$('modeAI').onclick=startAIMode;
$('modeFriends').onclick=()=>{showFriendPanel();setNetStatus('Chọn tạo phòng mới hoặc nhập mã phòng.');};
$('modeBack').onclick=()=>{if(peer||conn)destroyPeer();$('roomWaiting').classList.remove('show');$('friendActions').style.display='block';$('createRoom').disabled=false;$('joinRoom').disabled=false;showModeHome();};
$('createRoom').onclick=createRoom;$('joinRoom').onclick=joinRoom;
$('copyRoomCode').onclick=()=>{const code=$('roomCode').textContent; if(navigator.clipboard?.writeText)navigator.clipboard.writeText(code).then(()=>setNetStatus('Đã sao chép mã phòng: '+code)).catch(()=>setNetStatus('Mã phòng: '+code));else setNetStatus('Mã phòng: '+code);};
$('copyRoomLink').onclick=()=>{const url=window._miniWarInviteUrl||window.location.href;if(navigator.clipboard?.writeText)navigator.clipboard.writeText(url).then(()=>setNetStatus('Đã sao chép link mời.')).catch(()=>setNetStatus('Link mời: '+url));else setNetStatus('Link mời: '+url);};
const roomFromUrl=new URLSearchParams(window.location.search).get('room');if(roomFromUrl){showFriendPanel();$('roomInput').value=roomFromUrl.toUpperCase();setNetStatus('Link mời được phát hiện. Bấm “Tham gia phòng” để kết nối.');}

$('scout').onclick=()=>requestAction('buy',{unit:'scout'});$('infantry').onclick=()=>requestAction('buy',{unit:'infantry'});$('archer').onclick=()=>requestAction('buy',{unit:'archer'});$('spearman').onclick=()=>requestAction('buy',{unit:'spearman'});$('cavalry').onclick=()=>requestAction('buy',{unit:'cavalry'});$('farm').onclick=beginFarmPlacement;$('turret').onclick=()=>requestAction('turret');$('attack').onclick=()=>requestAction('attack',{ids:state.units.filter(u=>u.team===localTeam()&&u.selected).map(u=>u.id)});
$('fullscreen').onclick=async()=>{const app=$('gameApp');try{if(document.fullscreenElement){await document.exitFullscreen();}else{await app.requestFullscreen();}}catch{addLog('Trình duyệt không cho phép bật toàn màn hình.');}};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').innerHTML=document.fullscreenElement?'⤢ Thoát toàn màn hình<span>Thu nhỏ game</span>':'⛶ Toàn màn hình<span>Mở rộng game</span>';});
function setSidebarCollapsed(collapsed){gameApp.classList.toggle('panel-collapsed',collapsed);toggleSideHud.textContent=collapsed?'▢':'▣';toggleSideHud.setAttribute('aria-label',collapsed?'Mở bảng điều khiển':'Thu gọn bảng điều khiển');setTimeout(()=>syncWorldMetrics(),0);}
toggleSideHud.onclick=()=>setSidebarCollapsed(!gameApp.classList.contains('panel-collapsed'));
window.addEventListener('resize',()=>{syncWorldMetrics();});
$('pause').onclick=()=>{if(ended)return;if(mode==='pvp'&&netRole==='guest'){requestAction('pause',{paused:!paused});return;}paused=!paused;$('pause').innerHTML=paused?'▶ Tiếp tục<span>Tiếp tục trận đấu</span>':'Ⅱ Tạm dừng<span>Dừng / tiếp tục</span>';addLog(paused?'Đã tạm dừng trận đấu.':'Trận đấu tiếp tục.');updateHUD();};
$('overlayRestart').onclick=()=>{if(mode==='pvp'){addLog('Muốn chơi trận mới, hãy tạo phòng mới hoặc tải lại trang.');return;} $('feed').innerHTML='';fresh();};
function canvasPoint(e){const rect=canvas.getBoundingClientRect();return {x:(e.clientX-rect.left)*VIEW_W/rect.width,y:(e.clientY-rect.top)*VIEW_H/rect.height};}
function canvasPos(e){const p=canvasPoint(e),o=viewOffsets();return screenPlaneToWorld((p.x-o.x)/zoom,(p.y-o.y)/zoom);}
let selectingBox=false,boxStart=null,boxPointerId=null,guiding=false;

 canvas.addEventListener('wheel',e=>{
  e.preventDefault();e.stopPropagation();
  const rect=canvas.getBoundingClientRect();
  const px=(e.clientX-rect.left)*VIEW_W/rect.width;
  const py=(e.clientY-rect.top)*VIEW_H/rect.height;
  const {x:ox,y:oy}=viewOffsets();
  const ix=(px-ox)/zoom,iy=(py-oy)/zoom;
  zoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,zoom*(e.deltaY<0?1.15:1/1.15)));
  if(MAP_WORLD_W*zoom>=VIEW_W)camX=ix-px/zoom;else camX=0;
  if(MAP_WORLD_H*zoom>=VIEW_H)camY=iy-py/zoom;else camY=0;
  clampCamera();
 },{passive:false});
 let panning=false,panPointerId=null,panStart=null,panCamStart=null,justPanned=false,panMoved=false;
 canvas.addEventListener('pointerdown',e=>{
  if(farmPlacement){
   e.preventDefault();e.stopImmediatePropagation();
   if(e.button===2){endFarmPlacement();addLog('Đã hủy đặt nông trại.');return;}
   if(e.button===0){suppressNextCanvasClick=true;farmPlacement.valid=farmPlacementValid(localTeam(),farmPlacement.x,farmPlacement.y);if(farmPlacement.valid){const {x,y}=farmPlacement;endFarmPlacement();requestAction('placeFarm',{x,y});}else addLog('Vị trí bị chặn. Hãy chọn vùng đã khám phá, bằng phẳng và còn trống.');}
   return;
  }
  canvas.focus({preventScroll:true});
  const pos=canvasPos(e);
  const hitUnit=(state?.units||[]).some(u=>u.hp>0 && u.team===localTeam() && Math.hypot(u.x-pos.x,u.y-pos.y)<unitHitRadius(u));
  const hitBuilding=(state?.bases||[]).some(b=>b.team===localTeam()&&Math.abs(pos.x-b.x)<=124&&pos.y>=b.y-196&&pos.y<=b.y+34) || (state?.farms||[]).some(f=>f.team===localTeam()&&Math.abs(pos.x-f.x)<=28&&Math.abs(pos.y-f.y)<=34);
  const canPan=e.button===1||e.button===2||e.pointerType==='touch';
  if(canPan){
   panning=true;panPointerId=e.pointerId;panStart={x:e.clientX,y:e.clientY};panCamStart={x:camX,y:camY};panMoved=false;
   canvas.setPointerCapture?.(e.pointerId);canvas.style.cursor='grabbing';canvas.style.touchAction='none';e.preventDefault();
  }
 });
 canvas.addEventListener('pointermove',e=>{
  if(!panning||panPointerId!==e.pointerId)return;
  if(Math.hypot(e.clientX-panStart.x,e.clientY-panStart.y)>4)panMoved=true;
  const rect=canvas.getBoundingClientRect(),sx=VIEW_W/rect.width,sy=VIEW_H/rect.height;
  camX=panCamStart.x-(e.clientX-panStart.x)*sx/zoom;
  camY=panCamStart.y-(e.clientY-panStart.y)*sy/zoom;
  clampCamera();
 });
 function stopPan(e){if(panning&&(!e||e.pointerId===panPointerId)){const wasDrag=panMoved,button=e?.button; if(button===2&&!wasDrag){const pos=canvasPos(e),chosen=state.units.filter(u=>u.team===localTeam()&&u.selected);if(chosen.length){requestAction('move',{ids:chosen.map(u=>u.id),x:pos.x,y:pos.y});selected=null;}} justPanned=wasDrag;panning=false;panPointerId=null;panStart=null;panCamStart=null;panMoved=false;canvas.style.cursor='';canvas.style.touchAction='';}}
 canvas.addEventListener('pointerup',stopPan);canvas.addEventListener('pointercancel',stopPan);
 window.addEventListener('keydown',e=>{
  if(document.activeElement!==canvas)return;
  const step=(e.shiftKey?360:180)/zoom;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_'].includes(e.key)){e.preventDefault();
   if(e.key==='+'||e.key==='=')zoom=Math.max(MIN_ZOOM,zoom/1.15);
   if(e.key==='-'||e.key==='_')zoom=Math.min(MAX_ZOOM,zoom*1.15);
   if(e.key==='ArrowLeft')camX-=step;if(e.key==='ArrowRight')camX+=step;
   if(e.key==='ArrowUp')camY-=step;if(e.key==='ArrowDown')camY+=step;
   clampCamera();
  }
 });
canvas.addEventListener('click',e=>{
 if(suppressNextCanvasClick){suppressNextCanvasClick=false;e.preventDefault();return;}
 if(farmPlacement)return;
 if(selectingBox)return;
 const {x,y}=canvasPos(e);
 const fortress=state.bases.find(b=>b.team===localTeam()&&Math.abs(x-b.x)<=124&&y>=b.y-196&&y<=b.y+34);
 if(fortress){for(const u of state.units)u.selected=false;localSelectedIds.clear();selected=null;selectedFortress=fortress;addLog('Đã chọn pháo đài căn cứ.');return;}
 selectedFortress=null;
 let hit=null;for(const u of state.units){if(u.team===localTeam()&&Math.hypot(u.x-x,u.y-y)<unitHitRadius(u))hit=u;}
 if(hit){
  for(const u of state.units)u.selected=false;localSelectedIds.clear();
  hit.selected=true;localSelectedIds.add(hit.id);selected=hit;addLog('Đã chọn '+specs[hit.type].name+'. Giữ Shift hoặc kéo khung để chọn nhiều lính.');
 }else if(selected){
  requestAction('move',{ids:[selected.id],x,y});addLog('Đã đặt điểm đến cho đơn vị.');selected=null;
 }
});
canvas.style.touchAction='none';
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0)return;
 if(farmPlacement){e.preventDefault();return;}
 const pos=canvasPos(e);
 if(e.button===0){
  // Farms take priority over unit selection: drag a farm by grabbing its visible body.
  const fortressHit=state.bases.find(b=>b.team===localTeam()&&Math.abs(pos.x-b.x)<=124&&pos.y>=b.y-196&&pos.y<=b.y+34);
  if(fortressHit){e.preventDefault();return;}
  const farmHit=state.farms.find(f=>f.team===localTeam()&&Math.abs(pos.x-f.x)<=28&&Math.abs(pos.y-f.y)<=34);
  if(farmHit){draggingFarm=farmHit;canvas.setPointerCapture?.(e.pointerId);e.preventDefault();return;}
  // Units cannot be dragged; click to select and right-click to move.
  const unitHit=state.units.find(u=>u.team===localTeam()&&u.hp>0&&Math.hypot(u.x-pos.x,u.y-pos.y)<unitHitRadius(u));
  // Drag on open ground to box-select multiple friendly units.
  if(!unitHit){
   selectedFortress=null;const boxPoint=canvasPoint(e);selectingBox=true;boxPointerId=e.pointerId;boxStart=boxPoint;dragSelect={x:boxPoint.x,y:boxPoint.y,cx:boxPoint.x,cy:boxPoint.y};
   canvas.setPointerCapture?.(e.pointerId);
  }else if(e.shiftKey){
   const hit=state.units.find(u=>u.team===localTeam()&&Math.hypot(u.x-pos.x,u.y-pos.y)<unitHitRadius(u));
   if(hit){hit.selected=!hit.selected;if(hit.selected)localSelectedIds.add(hit.id);else localSelectedIds.delete(hit.id);selected=hit.selected?hit:null;}
   e.preventDefault();
  }
 }
 // Right mouse drag pans the map. A right click without dragging orders selected units to move.
});
canvas.addEventListener('pointermove',e=>{
 const pos=canvasPos(e);
 if(farmPlacement){farmPlacement.x=pos.x;farmPlacement.y=pos.y;farmPlacement.valid=farmPlacementValid(localTeam(),pos.x,pos.y);canvas.style.cursor=farmPlacement.valid?'copy':'not-allowed';return;}
 if(draggingFarm){
  const nx=Math.max(33,Math.min(W-33,pos.x)),ny=Math.max(36,Math.min(H-36,pos.y));
  if(farmPlacementValid(localTeam(),nx,ny,draggingFarm)){draggingFarm.x=nx;draggingFarm.y=ny;}
  return;
 }
 if(selectingBox&&boxPointerId===e.pointerId&&dragSelect){const boxPoint=canvasPoint(e);dragSelect.cx=boxPoint.x;dragSelect.cy=boxPoint.y;}
 if(guiding){
  for(const u of state.units)if(u.team===localTeam()&&u.selected){u.dest={x:Math.max(25,Math.min(W-25,pos.x)),y:Math.max(45,Math.min(H-30,pos.y))};u.order='move';}
 }
});
function endPointer(e){
 if(draggingFarm){if(mode==='pvp'&&netRole==='guest'){const index=state.farms.filter(f=>f.team===localTeam()).indexOf(draggingFarm);requestAction('moveFarm',{index,x:draggingFarm.x,y:draggingFarm.y});}draggingFarm=null;if(window._miniWarQueuedSnapshot){applySnapshot(window._miniWarQueuedSnapshot);window._miniWarQueuedSnapshot=null;}return;}
 if(selectingBox&&boxPointerId===e.pointerId&&dragSelect){
  const x1=Math.min(dragSelect.x,dragSelect.cx),x2=Math.max(dragSelect.x,dragSelect.cx);
  const y1=Math.min(dragSelect.y,dragSelect.cy),y2=Math.max(dragSelect.y,dragSelect.cy);
  if(Math.abs(x2-x1)+Math.abs(y2-y1)>8){
   for(const u of state.units){if(u.team===localTeam()){const p=worldToCanvas(u.x,u.y);u.selected=p.x>=x1&&p.x<=x2&&p.y>=y1&&p.y<=y2;if(u.selected)localSelectedIds.add(u.id);else localSelectedIds.delete(u.id);}}
   selected=null;
   addLog(`${state.units.filter(u=>u.team===localTeam()&&u.selected).length} lính được chọn.`);
  }
 }
 selectingBox=false;boxStart=null;boxPointerId=null;dragSelect=null;guiding=false;
}
canvas.addEventListener('pointerup',endPointer);
canvas.addEventListener('pointercancel',endPointer);
document.addEventListener('keydown',e=>{if(farmPlacement&&e.key==='Escape'){endFarmPlacement();addLog('Đã hủy đặt nông trại.');return;}if(e.code==='Space'){e.preventDefault();$('pause').click();}if(e.key.toLowerCase()==='a')requestAction('attack',{ids:state.units.filter(u=>u.team===localTeam()&&u.selected).map(u=>u.id)});});
fresh();gameStarted=false;requestAnimationFrame(loop);
})();


