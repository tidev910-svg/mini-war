// @ts-nocheck
// Gradual TypeScript migration: preserve the simulation while Vite hosts it.
import './style.css';

(() => {
const canvas=document.getElementById('game');
const gameApp=document.getElementById('gameApp');
const toggleSideHud=document.getElementById('toggleSideHud');
const portraitMode=window.matchMedia('(max-width: 720px) and (orientation: portrait)').matches;
// The world is a fixed 9600×9600 square (256 tiles of 37.5); only the view and zoom depend on the canvas size,
// so PvP peers with different screens and a resized window keep identical coordinates.
const WORLD_SIZE=9600;
let VIEW_W=canvas.width,VIEW_H=canvas.height,W=WORLD_SIZE,H=W,MAP_TILES=256,TILE_SIZE=W/MAP_TILES;
let MAP_WORLD_W=W,MAP_WORLD_H=H,MIN_ZOOM=Math.min(VIEW_W/MAP_WORLD_W,VIEW_H/MAP_WORLD_H),DEFAULT_ZOOM=VIEW_W/(TILE_SIZE*64),MAX_ZOOM=VIEW_W/(TILE_SIZE*32);
let camX=0,camY=0,zoom=DEFAULT_ZOOM;
function syncWorldMetrics(){
  const rect=canvas.getBoundingClientRect();
  const cssWidth=Math.max(540,Math.round(rect.width || canvas.clientWidth || canvas.width));
  const cssHeight=Math.max(320,Math.round(rect.height || canvas.clientHeight || canvas.height));
  const dpr=window.devicePixelRatio||1;
  canvas.width=Math.max(540,Math.round(cssWidth*dpr));
  canvas.height=Math.max(320,Math.round(cssHeight*dpr));
  VIEW_W=canvas.width;VIEW_H=canvas.height;
  MAP_WORLD_W=W;MAP_WORLD_H=H;MIN_ZOOM=Math.min(VIEW_W/MAP_WORLD_W,VIEW_H/MAP_WORLD_H);DEFAULT_ZOOM=VIEW_W/(TILE_SIZE*64);MAX_ZOOM=VIEW_W/(TILE_SIZE*32);
  zoom=Math.max(MIN_ZOOM,Math.min(zoom || DEFAULT_ZOOM,MAX_ZOOM));
  clampCamera();
}
if(portraitMode){canvas.width=540;canvas.height=960;}else if(window.innerWidth>=900){canvas.width=960;canvas.height=960;}
syncWorldMetrics();
const ctx=canvas.getContext('2d');
const forestRegions=[[.12,.18,.15,.14],[.35,.12,.13,.12],[.73,.14,.16,.13],[.88,.32,.12,.16],[.18,.42,.15,.17],[.72,.43,.13,.16],[.42,.57,.13,.12],[.12,.70,.14,.15],[.85,.72,.14,.16],[.36,.86,.15,.12],[.64,.89,.15,.12],[.52,.28,.10,.11]];
const rockRegions=[[.12,.31,.11,.10],[.55,.14,.12,.10],[.82,.49,.11,.13],[.29,.65,.14,.10],[.68,.76,.12,.11],[.48,.94,.12,.08]];
// Golden fields; together with forestRegions (wood) and rockRegions (stone) these become the capturable territories.
const goldRegions=[[.27,.22,.09,.08],[.59,.28,.10,.08],[.91,.43,.07,.10],[.30,.49,.09,.09],[.59,.61,.10,.08],[.16,.88,.09,.07],[.89,.91,.08,.07],[.47,.44,.08,.07]];
const terrainCanvas=document.createElement('canvas'),terrainCtx=terrainCanvas.getContext('2d'),terrainSmoothCanvas=document.createElement('canvas'),terrainSmoothCtx=terrainSmoothCanvas.getContext('2d'),terrainType=new Uint8Array(MAP_TILES*MAP_TILES),resourceTiles=[];
terrainCanvas.width=MAP_TILES*8;terrainCanvas.height=MAP_TILES*8;
const terrainPadding=32;terrainSmoothCanvas.width=terrainCanvas.width+terrainPadding*2;terrainSmoothCanvas.height=terrainCanvas.height+terrainPadding*2;
function buildTerrain(){
 const total=MAP_TILES*MAP_TILES,parts=[];
 const rnd=(x,y)=>{const v=Math.sin((x+17)*127.1+(y+31)*311.7)*43758.5453;return v-Math.floor(v);};
 const affinity=(x,y,centers)=>Math.max(...centers.map(([cx,cy,rx,ry])=>1-Math.hypot((x-cx)/rx,(y-cy)/ry)));
 for(let y=0;y<MAP_TILES;y++)for(let x=0;x<MAP_TILES;x++){
  const nx=(x+.5)/MAP_TILES,ny=(y+.5)/MAP_TILES,jitter=rnd(x,y)*.20+rnd(Math.floor(x/8),Math.floor(y/8))*.16;
  const riverX=.34+.31*ny+.055*Math.sin(ny*10);
  const lake=Math.max(0,1-Math.hypot((nx-.18)/.10,(ny-.55)/.12),1-Math.hypot((nx-.79)/.11,(ny-.25)/.09));
  parts.push({i:y*MAP_TILES+x,water:Math.abs(nx-riverX)-lake*.16+rnd(x+9,y+13)*.018,rock:affinity(nx,ny,rockRegions)+jitter,resource:affinity(nx,ny,goldRegions)+jitter,forest:affinity(nx,ny,forestRegions)+jitter});
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
let placement=null,suppressNextCanvasClick=false,selectedFortress=null,selectedBuilding=null,selectedFlag=null;
function endPlacement(){placement=null;document.querySelectorAll('.controls .placing').forEach(el=>el.classList.remove('placing'));canvas.style.cursor='';}
let mode='ai', gameStarted=false, peer=null, conn=null, netRole=null, roomCode='', snapshotClock=0, localSelectedIds=new Set(), connectionIntent='';
const specs={
 scout:{name:'Trinh sát',hp:60,damage:5,range:18,speed:72,cooldown:1.1,cost:{food:30},upkeep:.5,r:8,color:'#8ce6a0'},
 infantry:{name:'Lính',hp:100,damage:13,range:22,speed:45,cooldown:.8,cost:{food:40,gold:10},upkeep:1,r:10,color:'#58b5ff'},
 archer:{name:'Cung thủ',hp:65,damage:10,range:125,speed:34,cooldown:1.05,cost:{food:55,wood:30,gold:10},upkeep:1.5,r:9,color:'#78d6ff'},
 spearman:{name:'Lính giáo',hp:145,damage:18,range:26,speed:38,cooldown:.82,cost:{food:45,wood:20},upkeep:1,r:11,color:'#d7d6a4'},
 cavalry:{name:'Lính kỵ binh',hp:210,damage:24,range:27,speed:58,cooldown:.9,cost:{food:80,gold:50},upkeep:3,r:13,color:'#f2d5a0'}
};
// upkeep = food per minute per living unit. Running out of food starts a grace period, then slows the army.
const SUPPLY_GRACE_SECONDS=30,SUPPLY_SPEED_FACTOR=.85,SUPPLY_ATTACK_SPEED_FACTOR=.9;
// Four-resource economy (docs/features/resource-system.md). Income rates are per second.
const RESOURCE_NAMES={food:'lúa',wood:'gỗ',stone:'đá',gold:'vàng'};
const STARTING_RESOURCES={food:150,wood:400,stone:50,gold:50};
// Buildings are placed instantly but take buildTime seconds to finish; halfW/halfH is the logical footprint.
// where: 'explored' (any explored ground), 'territory' (near own fortress or in an owned region), 'flag' (next to the flag of an owned region).
const BUILDING_TYPES={
 farm:{name:'Nông trại',button:'farm',cost:{wood:100},buildTime:5,hp:180,halfW:31,halfH:34,vision:90,where:'explored'},
 // Outpost: defensive post beside a captured flag (no placement button; built with "Xây tiền đồn" via startOutpost).
 outpost:{name:'Tiền đồn',cost:{wood:200,stone:100},buildTime:40,hp:1500,halfW:26,halfH:24,visionTiles:14,where:'flag',gun:{range:160,damage:10,cooldown:1.2}},
 barracks:{name:'Nhà lính bộ',button:'buildBarracks',cost:{wood:150,stone:50},buildTime:30,hp:420,halfW:40,halfH:32,vision:100,where:'territory',unlocks:'infantry',icon:'⚔'},
 archery:{name:'Nhà lính cung',button:'buildArchery',cost:{wood:150,gold:50},buildTime:30,hp:380,halfW:40,halfH:32,vision:100,where:'territory',unlocks:'archer',icon:'🎯'},
 stable:{name:'Chuồng ngựa',button:'buildStable',cost:{wood:200,stone:100,gold:100},buildTime:30,hp:460,halfW:46,halfH:34,vision:100,where:'territory',unlocks:'cavalry',icon:'🐎'},
 tower:{name:'Tháp phòng thủ',button:'buildTower',cost:{wood:100,stone:200,gold:50},buildTime:25,hp:520,halfW:22,halfH:24,vision:200,where:'territory',gun:{range:190,damage:17,cooldown:1}}
};
const FARM_LEVELS=[null,{food:20},{food:30,cost:{wood:80,stone:40}},{food:45,cost:{wood:120,stone:80}}],FARM_UPGRADE_SECONDS=15;
const UNIT_REQUIREMENTS={infantry:'barracks',archer:'archery',cavalry:'stable'};
const HOME_TERRITORY_TILES=14;
// Territory map: up to REGION_COUNT neutral regions plus the two home regions that contain the fortresses.
// Each region has exactly one resource. The REGION_TYPES.length regions closest to each fortress (by walking distance)
// get one of each type; the rest are random. fresh() re-rolls the fortresses until both sides are about as close to each type.
const REGION_TYPES=['food','wood','stone','gold'],REGION_COUNT=20,REGION_MIN_BASE_TILES=22,MAP_FAIRNESS_TOLERANCE=.3,MAP_GENERATION_TRIES=15;
// Outposts only build while a friendly unit stands within BUILDER_RADIUS_TILES.
const BUILDER_RADIUS_TILES=4;
// Every neutral region has a flag near its centre (never this close to a fortress). Units within FLAG_CAPTURE_RADIUS_TILES capture it:
// seconds = FLAG_CAPTURE_BASE_SECONDS / min(units, FLAG_CAPTURE_MAX_UNITS)^FLAG_CAPTURE_EXPONENT (1 unit 60 s, 5 ≈ 23 s, 10+ ≈ 15 s).
// Scouts neither capture nor contest (FLAG_SCOUTS_CAPTURE). With nobody in range for FLAG_DECAY_DELAY_SECONDS, progress falls
// back toward 0 (a full bar empties in FLAG_DECAY_SECONDS) and never changes the owner. Decided 2026-10-17 (territory.md).
const FLAG_ENEMY_BASE_MIN_TILES=20,FLAG_CAPTURE_RADIUS_TILES=4,FLAG_CAPTURE_BASE_SECONDS=60,FLAG_CAPTURE_EXPONENT=.6,FLAG_CAPTURE_MAX_UNITS=10,FLAG_SCOUTS_CAPTURE=false;
const FLAG_DECAY_DELAY_SECONDS=5,FLAG_DECAY_SECONDS=60;
// AI capture squads: units per flag (doubled for enemy or contested flags), flags at once grows every interval up to the max.
const AI_CAPTURE_SQUAD=2,AI_MAX_CAPTURE_TARGETS=4,AI_CAPTURE_TARGET_INTERVAL=120;
const FORTRESS_GUN_COST={stone:100};
// Food regions: the mine gives 15 lúa/phút and farms standing in a food region their owner holds produce FOOD_REGION_FARM_BONUS more.
const FOOD_REGION_FARM_BONUS=.25;
const MINE_TYPES={food:{label:'MỎ LÚA',perSecond:15/60,crystal:'#f2d36b'},wood:{label:'MỎ GỖ',perSecond:30/60,crystal:'#9ccf6a'},stone:{label:'MỎ ĐÁ',perSecond:20/60,crystal:'#d9dee3'},gold:{label:'MỎ VÀNG',perSecond:15/60,crystal:'#ffca5e'}};
const RICH_MINE_MULTIPLIER=1.5;
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
function teamResources(team){return state.resources[team];}
function canAfford(team,cost){const res=teamResources(team);return Object.entries(cost).every(([key,amount])=>res[key]>=amount);}
function spend(team,cost){const res=teamResources(team);for(const [key,amount] of Object.entries(cost))res[key]-=amount;}
function costText(cost){return Object.entries(cost).map(([key,amount])=>amount+' '+RESOURCE_NAMES[key]).join(' · ');}
function formatAmount(value){return String(Math.round(value*10)/10).replace('.',',');}
// Food produced per minute: finished farms plus food mines in owned regions.
// A finished farm's output per minute, +FOOD_REGION_FARM_BONUS when it stands in a food region its team owns.
function farmFoodPerMinute(b){if(b.progress<1)return 0;const r=regionAt(b.x,b.y),bonus=r&&r.resource==='food'&&r.owner===b.team;return FARM_LEVELS[b.level].food*(bonus?1+FOOD_REGION_FARM_BONUS:1);}
function foodPerMinute(team){let total=0;for(const b of state.buildings)if(b.team===team&&b.kind==='farm')total+=farmFoodPerMinute(b);for(const m of state.mines)if(m.resource==='food'&&state.regions[m.regionId]?.owner===team)total+=m.income*60;return total;}
function upkeepPerMinute(team){let total=0;for(const u of state.units)if(u.team===team&&u.hp>0)total+=specs[u.type].upkeep;return total;}
function supplyFactor(team,kind){return state?.supply?.[team]?.status==='starving'?(kind==='speed'?SUPPLY_SPEED_FACTOR:SUPPLY_ATTACK_SPEED_FACTOR):1;}
// Called once per second per team. Shortage starts only when stored food cannot pay upkeep, and ends only
// when farms cover upkeep again (net >= 0), so the status cannot flicker around an empty granary.
function updateSupply(team){
 const res=teamResources(team),supply=state.supply[team],due=upkeepPerMinute(team)/60,net=foodPerMinute(team)-upkeepPerMinute(team);
 const paid=res.food>=due;res.food=paid?res.food-due:0;
 const mine=team===localTeam();
 if(net>=0){if(supply.status!=='ok'&&mine)addLog('Đã đủ lúa nuôi quân: hết thiếu tiếp tế.');supply.status='ok';supply.grace=0;return;}
 if(supply.status==='ok'&&!paid){supply.status='warning';supply.grace=SUPPLY_GRACE_SECONDS;if(mine)addLog(`Kho lúa đã cạn! Sau ${SUPPLY_GRACE_SECONDS} giây quân sẽ bị chậm lại nếu không xây thêm nông trại.`);}
 else if(supply.status==='warning'){supply.grace-=1;if(supply.grace<=0){supply.status='starving';supply.grace=0;if(mine)addLog(`Quân thiếu tiếp tế: −${Math.round((1-SUPPLY_SPEED_FACTOR)*100)}% tốc độ di chuyển, −${Math.round((1-SUPPLY_ATTACK_SPEED_FACTOR)*100)}% tốc độ đánh.`);}}
}
function missingText(team,cost){const res=teamResources(team);return Object.entries(cost).filter(([key,amount])=>res[key]<amount).map(([key,amount])=>Math.ceil(amount-res[key])+' '+RESOURCE_NAMES[key]).join(', ');}
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
 mode='pvp';netRole='guest';gameStarted=true;hideModeScreen();setGameModeLabel();
 // Drop the fog this browser made for its own pre-lobby map, then reveal the host's real home territories.
 if(state){state.fogSeen=new Uint8Array(MAP_TILES*MAP_TILES);state.enemyFogSeen=new Uint8Array(MAP_TILES*MAP_TILES);}
 applySnapshot(packet);ensureRegionMap();revealHomeTerritory();zoom=DEFAULT_ZOOM;centerCameraOnHome();addLog('Đã vào phòng. Bạn là quân đỏ.');
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
  else{
   const lastRoom=roomCode;destroyPeer();gameStarted=false;showModeScreen();showFriendPanel();
   $('createRoom').disabled=false;$('joinRoom').disabled=false;$('friendActions').style.display='block';$('roomWaiting').classList.remove('show');
   if(lastRoom)$('roomInput').value=lastRoom;
   setNetStatus('Đã mất kết nối với chủ phòng. Bấm “Tham gia phòng” để vào lại.');
  }
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
 const picked=new Set(localSelectedIds),hadFortressSelected=!!selectedFortress,selectedBuildingId=selectedBuilding?.id;
 state=packet.state;ensureRegionMap();state.units=(state.units||[]).map(u=>({...u,type:normalizeUnitType(u.type)}));state.pendingSpawns=(state.pendingSpawns||[]).map(p=>({...p,type:normalizeUnitType(p.type)}));selectedFortress=hadFortressSelected?state.bases.find(b=>b.team===localTeam())||null:null;state.pendingSpawns??=[];state.fogSeen=oldFog;state.enemyFogSeen=oldEnemyFog;
 gameTime=Number(packet.gameTime)||0;paused=!!packet.paused;ended=!!packet.ended;
 const hostWon=String(packet.resultTitle||'').includes('CHIẾN THẮNG!');
 const localWon=localTeam()===0?hostWon:!hostWon;
 $('resultTitle').textContent=ended?(localWon?'🏆 CHIẾN THẮNG!':'💥 THẤT THỦ!'):(packet.resultTitle||'Trận đấu kết thúc');
 $('resultText').textContent=ended?(localWon?'Bạn đã phá hủy căn cứ đối phương. Chỉ huy xuất sắc!':'Căn cứ của bạn đã bị phá hủy. Hãy thử chiến thuật khác!'):(packet.resultText||'');
 $('pause').innerHTML=paused?'▶ Tiếp tục<span>Tiếp tục trận đấu</span>':'Ⅱ Tạm dừng<span>Dừng / tiếp tục</span>';
 for(const u of state.units){u.selected=picked.has(u.id)&&u.team===localTeam();}
 selectedBuilding=state.buildings.find(b=>b.id===selectedBuildingId)||null;
 selected=state.units.find(u=>u.selected)||null;
 revealTeamVision(0);revealTeamVision(1);updateHUD();
 if(ended)$('overlay').classList.add('show');else $('overlay').classList.remove('show');
}
function revealTeamVision(team){
 if(!state)return;const arr=team===0?state.fogSeen:state.enemyFogSeen;if(!arr)return;
 const cols=MAP_TILES,rows=MAP_TILES,cw=W/cols,ch=H/rows;
 const sources=[...state.units.filter(u=>u.team===team&&u.hp>0).map(u=>({x:u.x,y:u.y,r:unitVisionRadius(u.type)})),...state.bases.filter(b=>b.team===team).map(b=>({x:b.x,y:b.y,r:175})),...state.buildings.filter(b=>b.team===team).map(b=>({x:b.x,y:b.y,r:buildingVision(b)}))];
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
 else if(action==='build')placeBuilding(team,String(payload.kind),Number(payload.x),Number(payload.y));
 else if(action==='upgrade')startUpgrade(team,'farm',payload.id==null?null:Number(payload.id));
 else if(action==='outpost')startOutpost(team,payload.regionId==null?null:Number(payload.regionId));
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
    u.dest={x:slotX,y:slotY};u.order='move';
   });
  }
 }
 else if(action==='pause'){if(!ended){paused=!!payload.paused;updateHUD();}}
 else if(action==='moveFarm'){
  const f=state.buildings.find(b=>b.id===Number(payload.id)&&b.team===team&&b.kind==='farm');if(!f||ended||paused)return;
  const nx=Math.max(33,Math.min(W-33,Number(payload.x)||0)),ny=Math.max(36,Math.min(H-36,Number(payload.y)||0));
  const problem=buildingPlacementProblem(team,'farm',nx,ny,f);
  if(problem){if(team===localTeam())addLog('Không thể chuyển nông trại: '+problem);return;}
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
 for(const b of state.buildings){if(b.team!==team)continue;const r=buildingVision(b),dx=x-b.x,dy=y-b.y;if(dx*dx+dy*dy<=r*r)return true;}
 return state.bases.some(b=>b.team===team&&(b.guns||[]).some((gun,index)=>{if(!gun.active)return false;const pos=fortressGunPosition(b,index),dx=x-pos.x,dy=y-pos.y;return dx*dx+dy*dy<=105*105;}));
}

function fortressGunPosition(base,index){const forward=base.team===0?1:-1;return {x:base.x+forward*(index===0?82:-82),y:base.y};}
function musterYard(base){const forward=base.team===0?1:-1;return {x:base.x+forward*((base.w||TILE_SIZE*5.5)/2+72),y:base.y,w:170,h:144};}
function activeFortressGuns(base){return (base.guns||[]).filter(g=>g.active).length;}
// True when at least BASE_SITE_MIN_CLEAR of the tiles under the fortress and its muster yard are walkable ground.
const BASE_SITE_MIN_CLEAR=.85;
function baseSiteClear(base){
 const yard=musterYard(base),rects=[[base.x,base.y,base.w,base.h],[yard.x,yard.y,yard.w,yard.h]];let total=0,clear=0;
 for(const [cx,cy,w,h] of rects)for(let y=cy-h/2;y<=cy+h/2;y+=TILE_SIZE)for(let x=cx-w/2;x<=cx+w/2;x+=TILE_SIZE){total++;if(tilePassable(x,y))clear++;}
 return clear>=total*BASE_SITE_MIN_CLEAR;
}
function stateBaseTooClose(x,y,blueBase,redBase){
 return [blueBase,redBase].some(b=>Math.hypot(x-b.x,y-b.y)<340);
}
function fresh(){
 endPlacement();suppressNextCanvasClick=false;selectedFortress=null;selectedBuilding=null;selectedFlag=null;
 // Random fortresses (blue in the left strip, red in the right strip) with their regions, mines and flags (generateRegions, territory.md).
 // Re-roll until both sides have every resource type at a similar walking distance; keep the fairest attempt otherwise.
 const marginY=260;
 let best=null;
 for(let attempt=0,rolls=0;attempt<MAP_GENERATION_TRIES&&rolls<500;rolls++){
  const blueBase={team:0,x:220+Math.random()*W*0.16,y:marginY+Math.random()*(H-2*marginY),hp:1230,max:1230,w:TILE_SIZE*5.5,h:TILE_SIZE*5.0,guns:[{active:true,cool:0},{active:false,cool:0}]};
  const redBase={team:1,x:W-220-Math.random()*W*0.16,y:marginY+Math.random()*(H-2*marginY),hp:1230,max:1230,w:TILE_SIZE*5.5,h:TILE_SIZE*5.0,guns:[{active:true,cool:0},{active:false,cool:0}]};
  // A fortress or muster yard standing mostly on rock or water cannot deploy units; re-roll (cheap, no region map needed).
  if(![blueBase,redBase].every(baseSiteClear)&&(best||rolls<499))continue;
  attempt++;
  const gen=generateRegions(blueBase,redBase);
  if(!best||gen.unfairness<best.unfairness)best={...gen,blueBase,redBase};
  if(gen.unfairness<=MAP_FAIRNESS_TOLERANCE)break;
 }
 const {regions,mines,blueBase,redBase}=best;
 buildRegionMap(regions);
 state={resources:[{...STARTING_RESOURCES},{...STARTING_RESOURCES}],supply:[{status:'ok',grace:0},{status:'ok',grace:0}],units:[],bullets:[],effects:[],buildings:[],regions,guards:[],bases:[blueBase,redBase],mines,fogSeen:new Uint8Array(MAP_TILES*MAP_TILES),enemyFogSeen:new Uint8Array(MAP_TILES*MAP_TILES),enemyMemory:{base:null,targets:[]},aiExploreTarget:null,pendingSpawns:[]};
 buildWorldDecor();revealHomeTerritory();
 gameTime=0;aiTimer=5;incomeTimer=0;nextId=1;lastHudSecond=-1;pendingSpawnRetryTimer=0;selected=null;paused=false;ended=false;camX=0;camY=0;zoom=DEFAULT_ZOOM;
 centerCameraOnHome();
 $('overlay').classList.remove('show');$('pause').innerHTML='Ⅱ Tạm dừng<span>Dừng / tiếp tục</span>';
 addLog('Trận đấu bắt đầu. Vị trí căn cứ được chọn ngẫu nhiên trong mỗi trận!');
 updateHUD();
}
// Frame the local side's fortress (blue for AI mode and the host, red for the guest).
function centerCameraOnHome(){const base=state.bases[localTeam()]||state.bases[0],p=worldToScreenPlane(base.x,base.y);camX=p.x-VIEW_W/zoom*(localTeam()===0?.30:.70);camY=p.y-VIEW_H/zoom*.58;clampCamera();}
function addLog(msg){const el=document.createElement('div');el.textContent=msg;$('feed').prepend(el);while($('feed').children.length>12)$('feed').lastChild.remove();}
function spawn(team,type,x,y,queueIfBlocked=true,pendingOrder='hold'){
 const spec=specs[type],left=team===0;
 const base=state.bases.find(b=>b.team===team)||{team,x:left?75:W-75,y:H/2,w:TILE_SIZE*5.5,h:TILE_SIZE*5};
 const yard=musterYard(base),radius=spec.r||9,forward=left?1:-1,spacing=radius*2+5;
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
 if(ended||paused||!Object.hasOwn(specs,type))return;const s=specs[type];
 const required=UNIT_REQUIREMENTS[type];if(required&&!hasBuilding(team,required)){if(team===localTeam())addLog(`Cần xây xong ${BUILDING_TYPES[required].name} để tuyển ${s.name}.`);return;}
 if(type==='scout'&&state.units.filter(u=>u.team===team&&u.type==='scout'&&u.hp>0).length+state.pendingSpawns.filter(u=>u.team===team&&u.type==='scout').length>=2){if(team===localTeam())addLog('Mỗi phe chỉ được có tối đa 2 lính trinh sát cùng lúc.');return;}
 if(!canAfford(team,s.cost)){if(team===localTeam())addLog('Không đủ tài nguyên để tạo '+s.name+': thiếu '+missingText(team,s.cost)+'.');return;}
 spend(team,s.cost);const unit=spawn(team,type);if(team===localTeam()&&unit)addLog('Đã tạo '+s.name+' gần căn cứ.');updateHUD();
}
function isTeamAreaExplored(team,x,y){
 const fog=team===0?state.fogSeen:state.enemyFogSeen;
 if(!fog||!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=W||y>=H)return false;
 const cols=MAP_TILES,rows=MAP_TILES,cellW=W/cols,cellH=H/rows;
 const gx=Math.floor(x/cellW),gy=Math.floor(y/cellH);
 return gx>=0&&gx<cols&&gy>=0&&gy<rows&&fog[gy*cols+gx]===1;
}
// ---- Territory map (docs/features/territory.md) ----
// regionMap[tile] = region id. Built by a multi-source Dijkstra from each region's seed tile; water and rock cost more
// to cross, so borders follow rivers and rocky ground. Deterministic from the seeds, so a guest rebuilds the same map.
// Border colours (neutral is a pale cream) and widths in screen pixels.
const TERRITORY_COLORS={neutral:'#fff4c8d9',0:'#4aaaffee',1:'#ff626bee'},TERRITORY_BORDER_PX={neutral:3,owned:5};
let regionMap=null,regionMapKey='',regionEdges=[],regionEdgesByRegion=[],regionTintKey='',showTerritory=true;
const regionTintCanvas=document.createElement('canvas');regionTintCanvas.width=MAP_TILES;regionTintCanvas.height=MAP_TILES;
const regionTintCtx=regionTintCanvas.getContext('2d');
function regionSeedKey(regions){return regions.map(r=>r.sgx+','+r.sgy).join(';');}
function buildRegionMap(regions){
 const N=MAP_TILES*MAP_TILES,dist=new Float32Array(N).fill(Infinity),owner=new Int16Array(N).fill(-1),heapD=[],heapI=[];
 const push=(d,i)=>{let k=heapD.length;heapD.push(d);heapI.push(i);while(k>0){const p=(k-1)>>1;if(heapD[p]<=d)break;heapD[k]=heapD[p];heapI[k]=heapI[p];k=p;}heapD[k]=d;heapI[k]=i;};
 const pop=()=>{const d=heapD[0],i=heapI[0],ld=heapD.pop(),li=heapI.pop(),n=heapD.length;if(n){let k=0;for(;;){let c=2*k+1;if(c>=n)break;if(c+1<n&&heapD[c+1]<heapD[c])c++;if(heapD[c]>=ld)break;heapD[k]=heapD[c];heapI[k]=heapI[c];k=c;}heapD[k]=ld;heapI[k]=li;}popped=i;return d;};
 let popped=0;
 const cost=i=>{const t=terrainType[i];return t===2?6:t===3?3:1;};
 for(const r of regions){const i=r.sgy*MAP_TILES+r.sgx;if(dist[i]>0){dist[i]=0;owner[i]=r.id;push(0,i);}}
 while(heapD.length){
  const d=pop(),i=popped;if(d>dist[i])continue;const x=i%MAP_TILES,y=(i-x)/MAP_TILES;
  const visit=j=>{const nd=d+cost(j);if(nd<dist[j]){dist[j]=nd;owner[j]=owner[i];push(nd,j);}};
  if(x>0)visit(i-1);if(x<MAP_TILES-1)visit(i+1);if(y>0)visit(i-MAP_TILES);if(y<MAP_TILES-1)visit(i+MAP_TILES);
 }
 regionMap=owner;regionMapKey=regionSeedKey(regions);regionTintKey='';
 // Border edges in tile units: [x1,y1,x2,y2,regionA,regionB,tileA,tileB].
 regionEdges=[];regionEdgesByRegion=regions.map(()=>[]);
 for(let y=0;y<MAP_TILES;y++)for(let x=0;x<MAP_TILES;x++){
  const i=y*MAP_TILES+x,a=owner[i];
  if(x<MAP_TILES-1&&owner[i+1]!==a){const e=[x+1,y,x+1,y+1,a,owner[i+1],i,i+1];regionEdges.push(e);regionEdgesByRegion[a]?.push(e);regionEdgesByRegion[owner[i+1]]?.push(e);}
  if(y<MAP_TILES-1&&owner[i+MAP_TILES]!==a){const e=[x,y+1,x+1,y+1,a,owner[i+MAP_TILES],i,i+MAP_TILES];regionEdges.push(e);regionEdgesByRegion[a]?.push(e);regionEdgesByRegion[owner[i+MAP_TILES]]?.push(e);}
 }
}
// Guests (and any state from a snapshot) rebuild the tile map when the region seeds differ from the cached one.
function ensureRegionMap(){if(state?.regions&&regionMapKey!==regionSeedKey(state.regions))buildRegionMap(state.regions);}
/// Walking cost from a fortress to every tile. Units have no pathfinding and wade through water, and the river splits the
// land in two, so this uses the same terrain costs as the region map (land 1, rock 3, water 6) instead of land-only paths.
function walkDistances(base){
 const N=MAP_TILES*MAP_TILES,d=new Float32Array(N).fill(Infinity),heapD=[],heapI=[];
 const push=(v,i)=>{let k=heapD.length;heapD.push(v);heapI.push(i);while(k>0){const p=(k-1)>>1;if(heapD[p]<=v)break;heapD[k]=heapD[p];heapI[k]=heapI[p];k=p;}heapD[k]=v;heapI[k]=i;};
 const pop=()=>{const v=heapD[0],i=heapI[0],lv=heapD.pop(),li=heapI.pop(),n=heapD.length;if(n){let k=0;for(;;){let c=2*k+1;if(c>=n)break;if(c+1<n&&heapD[c+1]<heapD[c])c++;if(heapD[c]>=lv)break;heapD[k]=heapD[c];heapI[k]=heapI[c];k=c;}heapD[k]=lv;heapI[k]=li;}return [v,i];};
 const cost=i=>{const t=terrainType[i];return t===2?6:t===3?3:1;};
 const start=Math.max(1,Math.min(MAP_TILES-2,Math.floor(base.y/TILE_SIZE)))*MAP_TILES+Math.max(1,Math.min(MAP_TILES-2,Math.floor(base.x/TILE_SIZE)));
 d[start]=0;push(0,start);
 while(heapD.length){const [v,i]=pop();if(v>d[i])continue;const x=i%MAP_TILES,y=(i-x)/MAP_TILES;
  for(const j of [x>0?i-1:-1,x<MAP_TILES-1?i+1:-1,y>0?i-MAP_TILES:-1,y<MAP_TILES-1?i+MAP_TILES:-1]){if(j<0)continue;const nv=v+cost(j);if(nv<d[j]){d[j]=nv;push(nv,j);}}}
 return d;
}
// Size of the connected land patch (no water or rock) each tile belongs to; terrain never changes, so it is computed once.
// Flags and mines must sit on a patch of at least MIN_LAND_PATCH_TILES so they are not on a walled-in islet.
let landPatchSize=null;const MIN_LAND_PATCH_TILES=400;
function landPatchSizes(){
 if(landPatchSize)return landPatchSize;
 const N=MAP_TILES*MAP_TILES,size=new Int32Array(N),label=new Int32Array(N).fill(-1),queue=new Int32Array(N),land=i=>{const t=terrainType[i];return t!==2&&t!==3;};
 for(let s=0;s<N;s++){
  if(label[s]>=0||!land(s))continue;
  let head=0,tail=0;queue[tail++]=s;label[s]=s;
  while(head<tail){const i=queue[head++],x=i%MAP_TILES,y=(i-x)/MAP_TILES;for(const j of [x>0?i-1:-1,x<MAP_TILES-1?i+1:-1,y>0?i-MAP_TILES:-1,y<MAP_TILES-1?i+MAP_TILES:-1])if(j>=0&&label[j]<0&&land(j)){label[j]=s;queue[tail++]=j;}}
  for(let k=0;k<tail;k++)size[queue[k]]=tail;
 }
 return landPatchSize=size;
}
function generateRegions(blueBase,redBase){
 const T=TILE_SIZE,regions=[],mines=[],bases=[blueBase,redBase];
 const tileOf=v=>Math.max(1,Math.min(MAP_TILES-2,Math.floor(v/T)));
 const add=(sgx,sgy,home=null)=>regions.push({id:regions.length,resource:home===null?null:'wood',sgx,sgy,home,owner:home===null?-1:home,cp:null,cap:0,capTeam:-1,contested:false,idle:0,stage2:-1});
 // Seeds: the fortresses (home regions, wood) and the centres of the forest/rock/field biomes away from them.
 for(const b of bases)add(tileOf(b.x),tileOf(b.y),b.team);
 const seeds=[...forestRegions,...rockRegions,...goldRegions].map(([cx,cy])=>({sgx:tileOf(cx*W),sgy:tileOf(cy*H)}))
  .filter(c=>bases.every(b=>Math.hypot(c.sgx*T-b.x,c.sgy*T-b.y)>T*REGION_MIN_BASE_TILES))
  .sort(()=>Math.random()-.5).slice(0,REGION_COUNT);
 for(const c of seeds)add(c.sgx,c.sgy);
 buildRegionMap(regions);
 const walk=bases.map(walkDistances),patch=landPatchSizes(),reachable=i=>patch[i]>=MIN_LAND_PATCH_TILES;
 const tiles=regions.map(()=>[]);for(let i=0;i<regionMap.length;i++)if(regionMap[i]>=0)tiles[regionMap[i]].push(i);
 const at=i=>({x:(i%MAP_TILES+.5)*T,y:((i-i%MAP_TILES)/MAP_TILES+.5)*T});
 // A spot is usable when its 3×3 tiles are passable, inside the same region and on a large land patch (not an islet).
 const clear=(i,id)=>{const x=i%MAP_TILES,y=(i-x)/MAP_TILES;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const j=(y+dy)*MAP_TILES+x+dx;if(regionMap[j]!==id||terrainType[j]===2||terrainType[j]===3)return false;}return reachable(i);};
 const nearestTo=(r,cx,cy,ok)=>{let best=null,bd=Infinity;for(const i of tiles[r.id]){const x=i%MAP_TILES,y=(i-x)/MAP_TILES,d=(x-cx)**2+(y-cy)**2;if(d>=bd||!clear(i,r.id))continue;const p=at(i);if(ok(p)){best=p;bd=d;}}return best;};
 const awayFromBases=p=>bases.every(b=>Math.hypot(p.x-b.x,p.y-b.y)>T*(FLAG_ENEMY_BASE_MIN_TILES+1));
 // Flag: the usable tile nearest the region's centre of mass.
 for(const r of regions){
  if(r.home!==null)continue;
  let sx=0,sy=0;for(const i of tiles[r.id]){sx+=i%MAP_TILES;sy+=(i-i%MAP_TILES)/MAP_TILES;}
  const n=Math.max(1,tiles[r.id].length);r.cp=nearestTo(r,sx/n,sy/n,awayFromBases);
 }
 // One mine spot per region (independent of its type): home mines 9–16 tiles from the fortress, neutral mines at least
 // 6 tiles from the flag so their labels do not overlap. Regions without a spot are dropped before types are handed out.
 const spots=new Map(),farFromMines=p=>![...spots.values()].some(m=>Math.hypot(p.x-m.x,p.y-m.y)<260);
 for(const r of regions){
  if(r.home===null&&!r.cp)continue;
  const home=r.home!==null?bases[r.home]:null;
  const ok=home?p=>farFromMines(p)&&Math.hypot(p.x-home.x,p.y-home.y)>=T*9&&Math.hypot(p.x-home.x,p.y-home.y)<=T*16
   :p=>farFromMines(p)&&Math.hypot(p.x-r.cp.x,p.y-r.cp.y)>=T*6&&!stateBaseTooClose(p.x,p.y,blueBase,redBase);
  // Neutral: the usable tile nearest the flag that is 6+ tiles out; home: nearest usable tile to a point 12 tiles toward the centre.
  const spot=home?nearestTo(r,home.x/T+(r.home===0?12:-12),home.y/T,ok):nearestTo(r,r.cp.x/T,r.cp.y/T,ok);
  if(spot)spots.set(r.id,spot);
 }
 // Resource types: the types missing among each fortress's REGION_TYPES.length nearest regions (walking cost to the flag)
 // go, in random order, to its nearest regions without a type, so both sides have every type close by.
 const neutral=regions.filter(r=>r.home===null&&spots.has(r.id)),flagWalk=(r,team)=>walk[team][tileOf(r.cp.y)*MAP_TILES+tileOf(r.cp.x)];
 for(const team of [0,1].sort(()=>Math.random()-.5)){
  const sorted=neutral.slice().sort((a,b)=>flagWalk(a,team)-flagWalk(b,team)),need=new Set(REGION_TYPES);
  for(const r of sorted.slice(0,REGION_TYPES.length))if(r.resource)need.delete(r.resource);
  const types=[...need].sort(()=>Math.random()-.5);
  for(const r of sorted){if(!types.length)break;if(!r.resource)r.resource=types.pop();}
 }
 for(const r of neutral)if(!r.resource)r.resource=REGION_TYPES[Math.floor(Math.random()*REGION_TYPES.length)];
 for(const r of regions){
  const spot=spots.get(r.id);if(!spot||!r.resource)continue;
  const rich=r.home===null&&Math.abs(r.sgx/MAP_TILES-.5)<.15&&Math.abs(r.sgy/MAP_TILES-.5)<.15;
  mines.push({...spot,resource:r.resource,rich,regionId:r.id,income:MINE_TYPES[r.resource].perSecond*(rich?RICH_MINE_MULTIPLIER:1),owner:r.owner});
 }
 // Drop regions with no mine or no flag and renumber; the caller rebuilds the tile map from the kept seeds.
 const keep=regions.filter(r=>mines.some(m=>m.regionId===r.id)&&(r.home!==null||r.cp));
 const newId=new Map(keep.map((r,i)=>[r.id,i]));
 const keptMines=mines.filter(m=>newId.has(m.regionId)).map(m=>({...m,regionId:newId.get(m.regionId)}));
 keep.forEach((r,i)=>{r.id=i;});
 // Fairness: for every type, compare each side's walking distance to its nearest flag of that type.
 let diff=0,total=0;
 for(const type of REGION_TYPES){
  const d=[0,1].map(team=>Math.min(...keep.filter(r=>r.home===null&&r.resource===type).map(r=>flagWalk(r,team))));
  if(!d.every(Number.isFinite))return {regions:keep,mines:keptMines,unfairness:Infinity};
  diff+=Math.abs(d[0]-d[1]);total+=Math.max(d[0],d[1]);
 }
 return {regions:keep,mines:keptMines,unfairness:total?diff/total:0};
}
// Translucent owner colours per tile, redrawn only when ownership changes.
function refreshRegionTint(){
 const key=state.regions.map(r=>r.owner).join('');if(key===regionTintKey||!regionMap)return;regionTintKey=key;
 const img=regionTintCtx.createImageData(MAP_TILES,MAP_TILES),colors={0:[74,170,255],1:[255,98,107]};
 for(let i=0;i<regionMap.length;i++){const r=state.regions[regionMap[i]];const c=r&&colors[r.owner];if(!c)continue;img.data[i*4]=c[0];img.data[i*4+1]=c[1];img.data[i*4+2]=c[2];img.data[i*4+3]=34;}
 regionTintCtx.putImageData(img,0,0);
}
function drawTerritory(viewLeft,viewTop,viewRight,viewBottom){
 const T=TILE_SIZE,fog=localTeam()===0?state.fogSeen:state.enemyFogSeen;
 if(!regionMap||!showTerritory)return;
 refreshRegionTint();ctx.save();ctx.drawImage(regionTintCanvas,0,0,W,H);
 const x1=viewLeft/T-1,x2=viewRight/T+1,y1=viewTop/T-1,y2=viewBottom/T+1;
 // Widths are in screen pixels (divided by zoom) so borders stay equally thick at every zoom level.
 // A dark under-stroke keeps them readable on light grass and fields; neutral borders first, owned borders on top.
 const stroke=(edges,color,px)=>{ctx.beginPath();for(const e of edges){if(e[2]<x1||e[0]>x2||e[3]<y1||e[1]>y2)continue;if(!fog[e[6]]&&!fog[e[7]])continue;ctx.moveTo(e[0]*T,e[1]*T);ctx.lineTo(e[2]*T,e[3]*T);}
  ctx.strokeStyle='#0f1a1466';ctx.lineWidth=(px+2.5)/zoom;ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=px/zoom;ctx.stroke();};
 ctx.lineCap='round';ctx.lineJoin='round';stroke(regionEdges,TERRITORY_COLORS.neutral,TERRITORY_BORDER_PX.neutral);
 for(const r of state.regions)if(r.owner>=0)stroke(regionEdgesByRegion[r.id]||[],TERRITORY_COLORS[r.owner],TERRITORY_BORDER_PX.owned);
 ctx.restore();
}
function setShowTerritory(on){showTerritory=on;const el=$('toggleTerritory');if(el){el.querySelector('span').textContent=(on?'Đang hiện':'Đang ẩn')+' · phím T';el.classList.toggle('placing',!on);}}
// ---- Buildings & territory (docs/features/buildings.md, docs/features/territory.md) ----
function tilePassable(x,y){const gx=Math.floor(x/TILE_SIZE),gy=Math.floor(y/TILE_SIZE);if(gx<1||gy<1||gx>=MAP_TILES-1||gy>=MAP_TILES-1)return false;const t=terrainType[gy*MAP_TILES+gx];return t!==2&&t!==3;}
function buildingDef(b){return BUILDING_TYPES[b.kind];}
function buildingDone(b){return b.progress>=1;}
function buildingName(b){return buildingDef(b).name;}
function visionOf(def){return def.visionTiles?def.visionTiles*TILE_SIZE:def.vision;}
function buildingVision(b){return !buildingDone(b)?60:visionOf(buildingDef(b));}
function buildingGun(b){return buildingDone(b)?buildingDef(b).gun||null:null;}
function hasBuilding(team,kind){return state.buildings.some(b=>b.team===team&&b.kind===kind&&buildingDone(b));}
function regionLabel(r){return r.home!==null?'vùng nhà':'vùng '+RESOURCE_NAMES[r.resource];}
function regionAt(x,y){if(!regionMap||!state?.regions)return null;const gx=Math.floor(x/TILE_SIZE),gy=Math.floor(y/TILE_SIZE);if(gx<0||gy<0||gx>=MAP_TILES||gy>=MAP_TILES)return null;return state.regions[regionMap[gy*MAP_TILES+gx]]||null;}
function inOwnTerritory(team,x,y){const base=state.bases[team];if(base&&Math.hypot(x-base.x,y-base.y)<=HOME_TERRITORY_TILES*TILE_SIZE)return true;const r=regionAt(x,y);return !!r&&r.owner===team;}
function revealCircle(arr,x,y,r){const cell=W/MAP_TILES,x1=Math.max(0,Math.floor((x-r)/cell)),x2=Math.min(MAP_TILES-1,Math.ceil((x+r)/cell)),y1=Math.max(0,Math.floor((y-r)/cell)),y2=Math.min(MAP_TILES-1,Math.ceil((y+r)/cell));for(let gy=y1;gy<=y2;gy++)for(let gx=x1;gx<=x2;gx++){const dx=(gx+.5)*cell-x,dy=(gy+.5)*cell-y;if(dx*dx+dy*dy<=r*r)arr[gy*MAP_TILES+gx]=1;}}
// Each side knows its own home territory from the start so it has room to build.
function revealHomeTerritory(){if(!state)return;for(const b of state.bases)revealCircle(b.team===0?state.fogSeen:state.enemyFogSeen,b.x,b.y,HOME_TERRITORY_TILES*TILE_SIZE);}
// Returns '' when the footprint is valid, otherwise the reason shown to the player.
function buildingPlacementProblem(team,kind,x,y,ignore=null){
 if(!Object.hasOwn(BUILDING_TYPES,kind))return 'Loại công trình không hợp lệ.';
 const def=BUILDING_TYPES[kind],hw=def.halfW,hh=def.halfH;
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<hw+2||x>W-hw-2||y<hh+2||y>H-hh-2)return 'Vị trí nằm ngoài bản đồ.';
 const xs=[],ys=[];for(let v=-hw;v<hw;v+=8)xs.push(v);xs.push(hw);for(let v=-hh;v<hh;v+=8)ys.push(v);ys.push(hh);
 for(const sy of ys)for(const sx of xs){
  if(!isTeamAreaExplored(team,x+sx,y+sy))return 'Chỉ xây được trên vùng đã khám phá.';
  if(!tilePassable(x+sx,y+sy))return 'Không xây được trên nước hoặc đá.';
 }
 for(const b of state.buildings){if(b===ignore)continue;const o=BUILDING_TYPES[b.kind];if(Math.abs(x-b.x)<hw+o.halfW&&Math.abs(y-b.y)<hh+o.halfH)return 'Chồng lên công trình khác.';}
 for(const b of state.bases){
  if(Math.abs(x-b.x)<hw+(b.w||74)/2&&Math.abs(y-b.y)<hh+(b.h||92)/2)return 'Quá sát pháo đài.';
  const yard=musterYard(b);if(Math.abs(x-yard.x)<hw+yard.w/2&&Math.abs(y-yard.y)<hh+yard.h/2)return 'Không xây đè lên sân tập kết.';
 }
 // Flags keep a clear patch around them; an outpost may stand closer.
 const flagGap=TILE_SIZE*(kind==='outpost'?1.2:2.5);
 for(const r of state.regions){if(!r.cp)continue;const qx=Math.max(x-hw,Math.min(r.cp.x,x+hw)),qy=Math.max(y-hh,Math.min(r.cp.y,y+hh));if(Math.hypot(r.cp.x-qx,r.cp.y-qy)<flagGap)return 'Quá sát cột cờ.';}
 // Units gather beside a flag to build an outpost, so outposts skip the unit check.
 if(kind!=='outpost')for(const u of state.units){if(u.hp<=0)continue;const qx=Math.max(x-hw,Math.min(u.x,x+hw)),qy=Math.max(y-hh,Math.min(u.y,y+hh));if(Math.hypot(u.x-qx,u.y-qy)<(specs[u.type]?.r||9)+2)return 'Có quân đang đứng ở đó.';}
 if(def.where==='territory'&&!inOwnTerritory(team,x,y))return 'Phải xây trong lãnh thổ của mình (gần pháo đài hoặc trong vùng đã chiếm cờ).';
 if(def.where==='flag'){
  const r=regionAt(x,y);
  if(!r||!r.cp||r.owner!==team)return 'Tiền đồn phải xây cạnh cột cờ của vùng bạn đã chiếm.';
  if(Math.hypot(x-r.cp.x,y-r.cp.y)>BUILDER_RADIUS_TILES*TILE_SIZE)return `Tiền đồn phải đứng cách cột cờ tối đa ${BUILDER_RADIUS_TILES} ô.`;
  if(state.buildings.some(b=>b!==ignore&&b.kind==='outpost'&&b.regionId===r.id))return 'Vùng này đã có tiền đồn.';
 }
 return '';
}
function findBuildSpot(team,kind,ax,ay,minR,maxR,tries=160){
 for(let i=0;i<tries;i++){const a=Math.random()*Math.PI*2,d=minR+Math.random()*(maxR-minR),x=ax+Math.cos(a)*d,y=ay+Math.sin(a)*d;if(!buildingPlacementProblem(team,kind,x,y))return {x,y};}
 return null;
}
function placeBuilding(team,kind,x,y){
 if(ended||paused||!Object.hasOwn(BUILDING_TYPES,kind))return null;
 const def=BUILDING_TYPES[kind],mine=team===localTeam();
 const problem=buildingPlacementProblem(team,kind,x,y);
 if(problem){if(mine)addLog(def.name+': '+problem);return null;}
 if(!canAfford(team,def.cost)){if(mine)addLog(`Không đủ tài nguyên để xây ${def.name}: thiếu ${missingText(team,def.cost)}.`);return null;}
 spend(team,def.cost);
 const b={id:nextId++,kind,team,x,y,hp:def.hp*.2,max:def.hp,level:1,progress:0,upgrade:null,cool:0,regionId:def.where==='flag'?regionAt(x,y).id:null,waiting:false};
 state.buildings.push(b);
 if(mine)addLog(`Bắt đầu xây ${def.name} (${def.buildTime} giây).`+(kind==='outpost'?' Cần ít nhất một quân của bạn đứng cạnh thì mới xây.':''));
 updateHUD();return b;
}
function upgradeCost(b){return b.kind==='farm'?FARM_LEVELS[b.level+1]?.cost||null:null;}
// Without an id, pick the lowest-level farm nearest the fortress.
function upgradeTarget(team,kind,id){
 const usable=b=>b&&b.team===team&&b.kind===kind&&buildingDone(b)&&!b.upgrade&&!!upgradeCost(b);
 if(id!==null){const b=state.buildings.find(b=>b.id===id);return usable(b)?b:null;}
 const base=state.bases[team];
 return state.buildings.filter(usable).sort((a,b)=>(a.level-b.level)||(Math.hypot(a.x-base.x,a.y-base.y)-Math.hypot(b.x-base.x,b.y-base.y)))[0]||null;
}
function startUpgrade(team,kind,id=null){
 if(ended||paused||kind!=='farm')return false;
 const mine=team===localTeam(),b=upgradeTarget(team,kind,id);
 if(!b){if(mine)addLog('Không có nông trại nào nâng cấp được (phải xây xong, chưa đạt cấp 3, không đang nâng cấp).');return false;}
 const cost=upgradeCost(b);
 if(!canAfford(team,cost)){if(mine)addLog(`Không đủ tài nguyên để nâng cấp nông trại: thiếu ${missingText(team,cost)}.`);return false;}
 spend(team,cost);b.upgrade={progress:0,time:FARM_UPGRADE_SECONDS};
 if(mine)addLog(`Đang nâng nông trại lên cấp ${b.level+1} (${FARM_UPGRADE_SECONDS} giây).`);
 updateHUD();return true;
}
// Outpost beside the flag of an owned region: the given region, otherwise the owned region without one nearest the fortress.
function outpostRegions(team){return state.regions.filter(r=>r.cp&&r.owner===team&&!state.buildings.some(b=>b.kind==='outpost'&&b.regionId===r.id));}
function startOutpost(team,regionId=null){
 if(ended||paused)return null;
 const mine=team===localTeam(),def=BUILDING_TYPES.outpost,base=state.bases[team];
 const options=outpostRegions(team).filter(r=>regionId===null||r.id===regionId).sort((a,b)=>Math.hypot(a.cp.x-base.x,a.cp.y-base.y)-Math.hypot(b.cp.x-base.x,b.cp.y-base.y));
 if(!options.length){if(mine)addLog(regionId===null?'Không có vùng nào xây được tiền đồn (phải chiếm cờ của vùng và vùng chưa có tiền đồn).':'Vùng này chưa thuộc về bạn hoặc đã có tiền đồn.');return null;}
 if(!canAfford(team,def.cost)){if(mine)addLog(`Không đủ tài nguyên để xây tiền đồn: thiếu ${missingText(team,def.cost)}.`);return null;}
 for(const r of options){const spot=findBuildSpot(team,'outpost',r.cp.x,r.cp.y,TILE_SIZE*1.8,TILE_SIZE*3.5,80);if(spot)return placeBuilding(team,'outpost',spot.x,spot.y);}
 if(mine)addLog('Không tìm được chỗ trống cạnh cột cờ để xây tiền đồn.');return null;
}
function completeBuilding(b){
 const def=buildingDef(b);if(b.team!==localTeam())return;
 if(b.kind==='outpost')addLog('Tiền đồn đã hoàn thành: có súng phòng thủ, tầm nhìn rộng, và giữ cờ của vùng không bị chiếm khi còn đứng.');
 else addLog(`${def.name} đã xây xong.`+(def.unlocks?` Có thể tuyển ${specs[def.unlocks].name}.`:''));
}
function needsBuilder(b){return b.kind==='outpost'&&!buildingDone(b);}
function hasBuilder(b){const r=BUILDER_RADIUS_TILES*TILE_SIZE;return state.units.some(u=>u.team===b.team&&u.hp>0&&Math.hypot(u.x-b.x,u.y-b.y)<=r);}
// ---- Flag capture (territory.md). Runs on the host every simulation step. ----
function captureSeconds(units){return FLAG_CAPTURE_BASE_SECONDS/Math.pow(Math.min(Math.max(1,units),FLAG_CAPTURE_MAX_UNITS),FLAG_CAPTURE_EXPONENT);}
function flagCapturers(r,team){const rad=FLAG_CAPTURE_RADIUS_TILES*TILE_SIZE;let n=0;for(const u of state.units)if(u.team===team&&u.hp>0&&(FLAG_SCOUTS_CAPTURE||u.type!=='scout')&&Math.hypot(u.x-r.cp.x,u.y-r.cp.y)<=rad)n++;return n;}
function regionOutpost(r){return state.buildings.find(b=>b.kind==='outpost'&&b.regionId===r.id&&b.team===r.owner)||null;}
// One side alone in range moves the flag. An enemy flag takes two stages: stage 1 lowers it to neutral, stage 2 captures it
// (r.stage2 remembers who lowered it, for the label). Both sides in range, or the owner's outpost still standing, pauses progress.
// The owner standing at its own flag erases the attacker's progress at the same speed. With nobody in range for
// FLAG_DECAY_DELAY_SECONDS the progress decays to 0; decay never changes the owner.
function captureStage(r){return r.capTeam<0||r.cap<=0?0:r.owner>=0?1:r.stage2===r.capTeam?2:0;}
function updateCaptures(dt){
 const me=localTeam();
 for(const r of state.regions){
  if(!r.cp)continue;
  const n=[flagCapturers(r,0),flagCapturers(r,1)],team=n[0]&&!n[1]?0:n[1]&&!n[0]?1:-1;
  const guarded=team>=0&&r.owner>=0&&team!==r.owner&&!!regionOutpost(r);
  const contested=(n[0]>0&&n[1]>0)||guarded;
  if(contested&&!r.contested&&(n[me]>0||r.owner===me))addLog(guarded?(r.owner===me?`Tiền đồn của bạn đang giữ cờ ${regionLabel(r)}: đối phương chưa chiếm được.`:`Cờ ${regionLabel(r)} có tiền đồn địch giữ: phải phá tiền đồn trước.`):`Cột cờ ${regionLabel(r)} đang bị tranh chấp: tiến độ chiếm tạm dừng.`);
  r.contested=contested;
  if(!n[0]&&!n[1]){
   r.idle=(r.idle||0)+dt;
   if(r.idle>=FLAG_DECAY_DELAY_SECONDS&&r.cap>0){r.cap=Math.max(0,r.cap-dt/FLAG_DECAY_SECONDS);if(r.cap===0){r.capTeam=-1;r.stage2=-1;}}
   continue;
  }
  r.idle=0;
  if(contested||team<0)continue;
  const step=dt/captureSeconds(n[team]);
  if(team===r.owner||(r.capTeam!==team&&r.cap>0)){
   if(r.cap>0){r.cap=Math.max(0,r.cap-step);if(r.cap===0){r.capTeam=-1;r.stage2=-1;}}
   continue;
  }
  if(r.capTeam!==team){r.capTeam=team;if(team===me)addLog(r.owner>=0?`Giai đoạn 1/2 · hạ cờ địch ở ${regionLabel(r)}: ${n[team]} quân, khoảng ${Math.round(captureSeconds(n[team]))} giây.`:`Đang chiếm cờ ${regionLabel(r)}: ${n[team]} quân, khoảng ${Math.round(captureSeconds(n[team]))} giây.`);}
  r.cap=Math.min(1,r.cap+step);if(r.cap<1)continue;
  r.cap=0;
  if(r.owner<0){
   r.owner=team;r.capTeam=-1;r.stage2=-1;
   if(team===me)addLog(`Đã chiếm ${regionLabel(r)}: mỏ trong vùng bắt đầu sinh ${RESOURCE_NAMES[r.resource]}.`);
   else if(teamCanSee(me,r.cp.x,r.cp.y))addLog(`Đối phương đã chiếm ${regionLabel(r)}.`);
  }else{
   const lost=r.owner;r.owner=-1;r.stage2=team;
   if(lost===me)addLog(`Mất ${regionLabel(r)}: cờ đã bị hạ về trung lập.`);
   else if(team===me)addLog(`Giai đoạn 2/2 · đã hạ cờ địch ở ${regionLabel(r)}: vùng về trung lập, tiếp tục đứng để chiếm.`);
  }
 }
}
function destroyBuilding(b){
 state.buildings=state.buildings.filter(x=>x!==b);
 if(selectedBuilding===b)selectedBuilding=null;if(draggingFarm===b)draggingFarm=null;
 if(b.team===localTeam())addLog(`${buildingName(b)} đã bị phá hủy.`);
 else if(b.kind==='outpost')addLog('Đã phá tiền đồn địch: có thể chiếm cờ của vùng đó.');
}
// Construction, farm upgrades, flag capture and building guns (towers, outposts). Called every simulation step.
function updateBuildings(dt){
 updateCaptures(dt);
 for(const b of [...state.buildings]){
  const def=buildingDef(b);
  if(!buildingDone(b)){
   b.waiting=needsBuilder(b)&&!hasBuilder(b);if(b.waiting)continue;
   const step=dt/def.buildTime;b.progress=Math.min(1,b.progress+step);b.hp=Math.min(b.max,b.hp+b.max*.8*step);
   if(buildingDone(b))completeBuilding(b);
   continue;
  }
  b.waiting=false;
  if(b.upgrade){
   b.upgrade.progress+=dt/b.upgrade.time;
   if(b.upgrade.progress>=1){b.upgrade=null;b.level++;if(b.team===localTeam())addLog(`Nông trại đã lên cấp ${b.level}: ${FARM_LEVELS[b.level].food} lúa/phút.`);}
  }
  const gun=buildingGun(b);if(!gun)continue;
  b.cool-=dt;if(b.cool>0)continue;
  let target=null,bd=gun.range;
  for(const u of state.units){if(u.team===b.team||u.hp<=0)continue;if((mode==='pvp'||b.team===1)&&!teamCanSee(b.team,u.x,u.y))continue;const d=Math.hypot(u.x-b.x,u.y-b.y);if(d<bd){bd=d;target=u;}}
  if(target){b.cool=gun.cooldown;state.bullets.push({x:b.x,y:b.y-24,target,damage:gun.damage,team:b.team,speed:320,life:1.2});}
 }
}
function beginPlacement(kind){
 if(ended||paused)return;
 const def=BUILDING_TYPES[kind];
 if(!canAfford(localTeam(),def.cost)){addLog(`Không đủ tài nguyên để xây ${def.name}: thiếu ${missingText(localTeam(),def.cost)}.`);return;}
 endPlacement();
 const home=state.bases.find(b=>b.team===localTeam());placement={kind,x:home?.x||W/2,y:home?.y||H/2,valid:false,problem:''};
 $(def.button).classList.add('placing');
 addLog(`Chọn vị trí ${def.name.toLowerCase()}: nhấp trái để đặt, nhấp phải hoặc Escape để hủy.`+(def.where==='territory'?' Chỉ xây trong lãnh thổ của mình.':''));
}
function buildTurret(team=localTeam()){
 if(ended||paused)return;const base=state.bases.find(b=>b.team===team);if(!base)return;
 if(activeFortressGuns(base)>=2){if(team===localTeam())addLog('Pháo đài đã có đủ 2 khẩu pháo tích hợp.');return;}
 if(!canAfford(team,FORTRESS_GUN_COST)){if(team===localTeam())addLog('Cần '+costText(FORTRESS_GUN_COST)+' để mở khóa pháo thứ hai: thiếu '+missingText(team,FORTRESS_GUN_COST)+'.');return;}
 const next=base.guns.findIndex(g=>!g.active);if(next<0)return;spend(team,FORTRESS_GUN_COST);
 base.guns[next].active=true;base.guns[next].cool=.2;base.max+=230;base.hp+=230;
 if(team===localTeam())addLog('Pháo thứ hai đã được tích hợp vào pháo đài; máu công trình tăng thêm 230.');updateHUD();
}
function commandAttack(team=localTeam(),ids=null){if(ended||paused)return;const wanted=ids?new Set(ids):new Set(state.units.filter(u=>u.team===team&&u.selected).map(u=>u.id));const chosen=state.units.filter(u=>u.team===team&&wanted.has(u.id));for(const u of chosen){u.order='attack';u.dest=null;u.target=null;}if(team===localTeam())addLog(chosen.length?`${chosen.length} đơn vị được chọn nhận lệnh tấn công!`:'Chưa chọn quân. Hãy chọn lính trước.');}
function updateMatchClockHUD(){const sec=Math.floor(gameTime);$('time').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');setText($('phaseHint'),gameTime<300?'Giai đoạn phát triển kinh tế':gameTime<600?'Giai đoạn mở rộng':'Giai đoạn giao tranh');}
function updateHUD(){
 const team=localTeam(),res=teamResources(team);for(const key of Object.keys(RESOURCE_NAMES))$(key).textContent=Math.floor(res[key]);
 const produced=foodPerMinute(team),eaten=upkeepPerMinute(team),net=produced-eaten,supply=state.supply[team],foodRate=$('foodRate');
 foodRate.textContent=supply.status==='warning'?`Thiếu lúa · chậm sau ${supply.grace}s`:supply.status==='starving'?'Thiếu tiếp tế · quân chậm':`+${formatAmount(produced)} −${formatAmount(eaten)} = ${net>=0?'+':''}${formatAmount(net)}/phút`;
 foodRate.className=supply.status!=='ok'?'supply-bad':net<0?'supply-warn':'';
 updateMatchClockHUD();
 const ours=state.units.filter(u=>u.team===team);
 const infantry=ours.filter(u=>u.type==='infantry').length,archers=ours.filter(u=>u.type==='archer').length,scouts=ours.filter(u=>u.type==='scout').length,spearmen=ours.filter(u=>u.type==='spearman').length,cavalry=ours.filter(u=>u.type==='cavalry').length;
 const queued=state.pendingSpawns.filter(u=>u.team===team);$('unitCount').textContent=ours.length+queued.length;$('unitBreakdown').textContent=`Lính ${infantry} · Cung ${archers} · Lính giáo ${spearmen} · Kỵ binh ${cavalry}${queued.length?` · Chờ ${queued.length}`:''}`;const spearmanCounter=$('spearmanCount');if(spearmanCounter)spearmanCounter.textContent=spearmen;
 $('unitCount').parentElement.querySelector('small').textContent=team===0?'🪖 Quân xanh':'🪖 Quân đỏ';if(spearmanCounter)spearmanCounter.parentElement.querySelector('small').textContent=team===0?'🗡️ Lính giáo xanh':'🗡️ Lính giáo đỏ';
 const home=state.bases.find(b=>b.team===team);$('turret').disabled=paused||ended||activeFortressGuns(home)>=2;
 for(const id of ['scout','infantry','archer','spearman','cavalry','attack','upgradeFarm','upgradeOutpost',...Object.values(BUILDING_TYPES).map(d=>d.button).filter(Boolean)])$(id).disabled=paused||ended;
 // Unit buttons show the missing building; the farm upgrade button shows the next level's price.
 for(const type of Object.keys(specs)){const need=UNIT_REQUIREMENTS[type],locked=need&&!hasBuilding(team,need);setText($(type).querySelector('span'),costText(specs[type].cost)+' · nuôi '+formatAmount(specs[type].upkeep)+' lúa/phút'+(locked?' · cần '+BUILDING_TYPES[need].name:''));$(type).classList.toggle('locked',!!locked);}
 const farmTarget=upgradeTarget(team,'farm',selectedBuilding?.kind==='farm'&&selectedBuilding.team===team?selectedBuilding.id:null)||upgradeTarget(team,'farm',null);
 setText($('upgradeFarm').querySelector('span'),farmTarget?`lên cấp ${farmTarget.level+1}: ${costText(upgradeCost(farmTarget))} · ${FARM_LEVELS[farmTarget.level+1].food} lúa/phút`:'cấp 2: 80 gỗ · 40 đá · cấp 3: 120 gỗ · 80 đá');
 const owned=state.regions.filter(r=>r.owner===team),income={};
 for(const m of state.mines)if(state.regions[m.regionId]?.owner===team)income[m.resource]=(income[m.resource]||0)+m.income*60;
 setText($('territory'),String(owned.length));
 setText($('territoryIncome'),Object.keys(income).length?Object.entries(income).map(([k,v])=>`+${Math.round(v)} ${RESOURCE_NAMES[k]}`).join(' · ')+'/phút':'Chưa có mỏ');
 $('pause').disabled=ended;
 $('pause').innerHTML=paused?'▶ Tiếp tục<span>Tiếp tục trận đấu</span>':'Ⅱ Tạm dừng<span>Dừng / tiếp tục</span>';
}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
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
 // Enemy buildings (farms, flags, barracks, towers…) are targets for both sides when seen.
 for(const b of state.buildings){if(b.team===u.team||b.hp<=0)continue;if(!((mode==='ai'&&u.team===0)||teamCanSee(u.team,b.x,b.y)))continue;let d=dist(u,b);if(d<bd-15){best=b;bd=d;}}
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
  else if(target.kind)destroyBuilding(target);
  else if(target.type){state.units=state.units.filter(u=>u!==target);if(selected===target)selected=null;}
 }
}
function finish(win){if(ended)return;ended=true;$('resultTitle').textContent=win?'🏆 CHIẾN THẮNG!':'💥 THẤT THỦ!';$('resultText').textContent=win?'Bạn đã phá hủy căn cứ địch. Chỉ huy xuất sắc!':'Căn cứ của bạn đã bị phá hủy. Hãy thử chiến thuật khác!';$('overlay').classList.add('show');addLog(win?'Chiến thắng!':'Thất bại!');updateHUD();}
// Economic AI for the red side (ai-opponent.md). Runs every 5 seconds; each step spends only when affordable.
// A random point within half the capture radius of a flag, so a squad spreads out instead of stacking.
function flagStandSpot(r){const a=Math.random()*Math.PI*2,d=Math.random()*FLAG_CAPTURE_RADIUS_TILES*TILE_SIZE*.5;return {x:r.cp.x+Math.cos(a)*d,y:r.cp.y+Math.sin(a)*d};}
function runEnemyAI(){
 const team=1,base=state.bases[1],res=teamResources(1),T=TILE_SIZE;
 const own=state.buildings.filter(b=>b.team===team),count=kind=>own.filter(b=>b.kind===kind).length;
 const underway=kind=>own.some(b=>b.kind===kind&&!buildingDone(b));
 const build=(kind,ax,ay,minR,maxR)=>{if(!canAfford(team,BUILDING_TYPES[kind].cost))return false;const spot=findBuildSpot(team,kind,ax,ay,minR,maxR);return !!(spot&&placeBuilding(team,kind,spot.x,spot.y));};
 const regionHas=(r,k)=>r.resource===k;
 // 1. The home wood region is owned from the start (territory.md), so the AI begins with food.
 // 2. Food: two farms to start, then only as many as the army needs (+10 lúa/phút of slack).
 const farmsUnderway=own.filter(b=>b.kind==='farm'&&!buildingDone(b)).length;
 const net=foodPerMinute(team)+farmsUnderway*FARM_LEVELS[1].food-upkeepPerMinute(team);
 if((count('farm')<2||net<10)&&count('farm')<10&&farmsUnderway<2)build('farm',base.x,base.y,T*3,T*10);
 // Saving: with two regions held and the next military building missing, stop spending elsewhere until it is up,
 // but only if every missing resource has an income; otherwise expand toward regions that produce it.
 const militaryNext=!count('barracks')?'barracks':!count('archery')?'archery':!count('stable')?'stable':null;
 const nextCost=militaryNext?BUILDING_TYPES[militaryNext].cost:{};
 const missing=Object.keys(nextCost).filter(k=>res[k]<nextCost[k]);
 const earning=k=>state.mines.some(m=>m.owner===team&&m.resource===k);
 const saving=!!militaryNext&&!underway(militaryNext)&&gameTime>45&&state.regions.filter(r=>r.owner===team).length>=2&&missing.every(earning);
 const wanted=missing.filter(k=>!earning(k));
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
  const free=state.units.filter(u=>u.team===team&&u.hp>0&&u.type!=='scout'&&!u.buildTarget&&u.captureTarget==null).sort((p,q)=>Math.hypot(p.x-r.cp.x,p.y-r.cp.y)-Math.hypot(q.x-r.cp.x,q.y-r.cp.y));
  for(const u of free.slice(0,need)){u.captureTarget=r.id;u.dest=flagStandSpot(r);u.order='explore';}
  if(!have&&free.length)break;
 }
 // Builders: each outpost under construction gets the nearest free unit.
 for(const b of own.filter(needsBuilder)){
  if(state.units.some(u=>u.team===team&&u.hp>0&&u.buildTarget===b.id))continue;
  const free=state.units.filter(u=>u.team===team&&u.hp>0&&!u.buildTarget).sort((p,q)=>Math.hypot(p.x-b.x,p.y-b.y)-Math.hypot(q.x-b.x,q.y-b.y));
  if(free[0]){free[0].buildTarget=b.id;free[0].dest={x:b.x,y:b.y+30};free[0].order='explore';}
 }
 // Wood kept back from unit purchases for the next military building.
 const woodReserve=saving?(nextCost.wood||0):0;
 // 4. Military buildings in order: barracks, archery, stable.
 if(militaryNext&&gameTime>45&&!underway(militaryNext))build(militaryNext,base.x,base.y,T*4,T*12);
 // 5. Upgrades and defence when stone and gold allow.
 if(count('barracks')&&res.stone>=120)startUpgrade(team,'farm');
 if(res.stone>=180&&res.wood>=260&&outpostRegions(team).length)startOutpost(team);
 if(count('tower')<2&&canAfford(team,BUILDING_TYPES.tower.cost)&&Math.random()<.35){
  const anchors=[base,...state.regions.filter(r=>r.cp&&r.owner===team).map(r=>r.cp)];const a=anchors[Math.floor(Math.random()*anchors.length)];
  build('tower',a.x,a.y,a===base?T*5:50,a===base?T*12:180);
 }
 // 6. Units, never past what the farms can feed and only with the required building.
 const aiScouts=state.units.filter(u=>u.team===team&&u.type==='scout'&&u.hp>0).length+state.pendingSpawns.filter(u=>u.team===team&&u.type==='scout').length;
 const aiBuy=type=>{const need=UNIT_REQUIREMENTS[type];if(need&&!hasBuilding(team,need))return false;if(saving&&type!=='scout'&&state.units.filter(u=>u.team===team).length>=4)return false;if((specs[type].cost.wood||0)>0&&res.wood-specs[type].cost.wood<woodReserve)return false;if(!canAfford(team,specs[type].cost)||foodPerMinute(team)-upkeepPerMinute(team)-specs[type].upkeep<0)return false;spend(team,specs[type].cost);const unit=spawn(team,type,undefined,undefined,true,type==='scout'?'explore':'hold');if(unit&&type==='scout')unit.order='explore';return true;};
 if(aiScouts<2&&aiBuy('scout')){}
 else if(Math.random()<.14&&aiBuy('cavalry')){}
 else if(Math.random()<.42&&aiBuy('spearman')){}
 else if(Math.random()<.6&&aiBuy('archer')){}
 else if(aiBuy('infantry')){}
 else aiBuy('spearman');
 if(activeFortressGuns(base)<2&&canAfford(team,FORTRESS_GUN_COST)&&Math.random()<.25)buildTurret(team);
}
function update(dt){
 if(!gameStarted|| (mode==='pvp'&&netRole==='guest') || paused||ended)return;const before=gameTime;gameTime+=dt;incomeTimer+=dt;aiTimer+=dt;
 const shownSecond=Math.floor(gameTime);if(shownSecond!==lastHudSecond){lastHudSecond=shownSecond;updateMatchClockHUD();}
 pendingSpawnRetryTimer+=dt;if(pendingSpawnRetryTimer>=.35){pendingSpawnRetryTimer=0;processPendingSpawns();}
 // income, with a bonus for controlling the mine
 // No base income: food comes from farms, wood/stone/gold from captured mines.
 while(incomeTimer>=1){incomeTimer-=1;
  for(const b of state.buildings)if(b.kind==='farm'&&buildingDone(b))teamResources(b.team).food+=farmFoodPerMinute(b)/60;
  // Mines pay whoever owns their region (a finished flag or outpost).
  for(const mine of state.mines){const r=state.regions[mine.regionId];mine.owner=r?r.owner:-1;if(mine.owner>=0)teamResources(mine.owner)[mine.resource]+=mine.income;}
  updateSupply(0);updateSupply(1);
 }
 if(mode==='ai'&&aiTimer>=5){aiTimer=0;runEnemyAI();}
 updateBuildings(dt);
 // unit movement and combat
 for(const u of [...state.units]){
  if(u.hp<=0)continue;const s=specs[u.type];u.walk+=dt;u.moving=false;u.attackTimer-=dt;const startX=u.x,startY=u.y;
  const speed=s.speed*supplyFactor(u.team,'speed'),cooldown=s.cooldown/supplyFactor(u.team,'attack');
  let target=nearestEnemy(u);if(!unitTargetValid(target,u))target=null;
  if(mode==='ai'&&u.team===1&&!target){
   // Assigned builders stay at their flag until it no longer needs them.
   const job=u.buildTarget?state.buildings.find(b=>b.id===u.buildTarget&&needsBuilder(b)):null;
   if(!job)u.buildTarget=null;
   // Capture squads stay at their flag until the region is the AI's with no enemy progress on it.
   const flag=u.captureTarget!=null?state.regions[u.captureTarget]:null;
   if(flag&&(!flag.cp||(flag.owner===1&&!flag.cap)))u.captureTarget=null;
   if(job){if(!u.dest||Math.hypot(u.dest.x-job.x,u.dest.y-job.y)>60)u.dest={x:job.x,y:job.y+30};}
   else if(u.captureTarget!=null){if(!u.dest||Math.hypot(u.dest.x-flag.cp.x,u.dest.y-flag.cp.y)>FLAG_CAPTURE_RADIUS_TILES*TILE_SIZE*.6)u.dest=flagStandSpot(flag);}
   else if(!u.dest||Math.hypot(u.dest.x-u.x,u.dest.y-u.y)<35||Math.random()<.003){
    const cols=MAP_TILES,rows=MAP_TILES,cw=W/cols,ch=H/rows;
    // Prefer neutral or enemy-controlled mines; otherwise explore an unseen cell.
    const mineTargets=state.mines.filter(m=>m.owner!==1).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y));
    let candidate=mineTargets.length?{x:mineTargets[0].x,y:mineTargets[0].y}:null;
    if(!candidate||Math.hypot(candidate.x-u.x,candidate.y-u.y)<70){candidate=null;for(let k=0;k<48;k++){const gx=Math.floor(Math.random()*cols),gy=Math.floor(Math.random()*rows),idx=gy*cols+gx;if(!state.enemyFogSeen[idx]){candidate={x:(gx+.5)*cw,y:(gy+.5)*ch};break;}}}
    if(!candidate)candidate={x:Math.random()*W,y:45+Math.random()*(H-75)};
    u.dest=candidate;u.order='explore';
   }
   const ed=Math.hypot(u.dest.x-u.x,u.dest.y-u.y);if(ed>5){u.moving=true;const step=Math.min(ed,speed*dt);u.x+=(u.dest.x-u.x)/ed*step;u.y+=(u.dest.y-u.y)/ed*step;}
  }
  if(target){
   const d=dist(u,target),tr=target.type?specs[target.type]:null;
   const range=s.range+(tr?tr.r:target.w?35:10);
   if(d<=range){
    if(u.attackTimer<=0){u.attackTimer=cooldown;
      if(u.type==='archer'){state.bullets.push({x:u.x,y:u.y-3,target,damage:s.damage,team:u.team,speed:280,life:2,attackerType:u.type});}
      else hurt(target,s.damage,u.team,u.type);
    }
   }else if((u.order==='attack'||(mode==='ai'&&u.team===1))){
    const dx=(target.x-u.x)/Math.max(1,d),dy=(target.y-u.y)/Math.max(1,d);u.moving=true;u.x+=dx*speed*dt;u.y+=dy*speed*dt;
    u.x=Math.max(22,Math.min(W-22,u.x));u.y=Math.max(45,Math.min(H-30,u.y));
   }
  }
  // Player units with a move order travel to the clicked point, not a fixed lane.
  if((mode==='pvp'||u.team===0)&&u.order==='move'&&u.dest){
   const dd=Math.hypot(u.dest.x-u.x,u.dest.y-u.y);
   if(dd<5){u.order='hold';u.dest=null;}
   else{
    u.moving=true;const step=Math.min(dd,speed*dt);
    u.x+=(u.dest.x-u.x)/dd*step;u.y+=(u.dest.y-u.y)/dd*step;
    u.x=Math.max(22,Math.min(W-22,u.x));u.y=Math.max(45,Math.min(H-30,u.y));
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
 const aiSources=[...state.units.filter(u=>u.team===1&&u.hp>0).map(u=>({x:u.x,y:u.y,r:u.type==='scout'?145:(u.type==='spearman'?120:105)})),{x:state.bases[1].x,y:state.bases[1].y,r:160},...state.buildings.filter(b=>b.team===1).map(b=>({x:b.x,y:b.y,r:buildingVision(b)}))];
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
 for(const source of [{x:state.bases[0].x,y:state.bases[0].y,r:175},...state.buildings.filter(b=>b.team===0).map(b=>({x:b.x,y:b.y,r:buildingVision(b)}))]){
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
 if(preview)ctx.globalAlpha=.72;else if(!buildingDone(f))ctx.globalAlpha=.55;
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
 ctx.restore();drawBuildingOverlay(f,preview);
});
}
// Progress, health, selection and name label shared by every building.
function drawBuildingOverlay(b,preview){
 const def=BUILDING_TYPES[b.kind],x=b.x,y=b.y,hw=def.halfW,hh=def.halfH;ctx.save();ctx.globalAlpha=1;
 if(preview){const color=b.previewValid?'#72f2a0':'#ff6875';ctx.fillStyle=b.previewValid?'#47df7a38':'#f23d4f42';ctx.fillRect(x-hw,y-hh,hw*2,hh*2);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.setLineDash([7,4]);ctx.strokeRect(x-hw,y-hh,hw*2,hh*2);ctx.setLineDash([]);ctx.restore();return;}
 const barW=Math.max(44,hw*2),barY=y+hh+6;
 const progressBar=(value,color)=>{ctx.fillStyle='#111827';ctx.fillRect(x-barW/2,barY,barW,6);ctx.fillStyle=color;ctx.fillRect(x-barW/2+1,barY+1,(barW-2)*Math.max(0,Math.min(1,value)),4);};
 if(b.waiting)progressBar(b.upgrade?b.upgrade.progress:b.progress,'#8a8f97');
 else if(!buildingDone(b))progressBar(b.progress,'#f0c24f');
 else if(b.upgrade)progressBar(b.upgrade.progress,'#8be0ff');
 else if(b.hp<b.max)bar(x-barW/2,barY,barW,6,b.hp,b.max,b.team);
 if(selectedBuilding===b){ctx.strokeStyle=b.team===0?'#74c8ff':'#ff777f';ctx.lineWidth=3;ctx.setLineDash([8,5]);ctx.beginPath();ctx.ellipse(x,y+hh*.4,hw+14,hh*.75+10,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
 const label=(b.kind==='farm'?'NÔNG TRẠI'+(b.level>1?' CẤP '+b.level:''):buildingName(b).toUpperCase())+(b.waiting?' · CHỜ QUÂN XÂY':!buildingDone(b)?' · ĐANG XÂY':'');
 ctx.font='900 10px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#34533c';ctx.strokeText(label,x,barY+18);ctx.fillStyle='#fff';ctx.fillText(label,x,barY+18);
 ctx.restore();
}
function drawBuilding(b,preview=false){
 if(b.kind==='farm')return drawFarm(b,preview);
 return drawUprightAt(b.x,b.y,()=>{
  const x=b.x,y=b.y,def=BUILDING_TYPES[b.kind],p=teamPalette(b.team),hw=def.halfW,hh=def.halfH;
  ctx.save();if(preview)ctx.globalAlpha=.72;else if(!buildingDone(b))ctx.globalAlpha=.55;
  ctx.fillStyle='#1d2b2140';ctx.beginPath();ctx.ellipse(x+3,y+hh*.6,hw*1.1,hh*.45,0,0,Math.PI*2);ctx.fill();
  if(b.kind==='outpost'){
   // Log palisade around a small watchtower flying the team colour.
   ctx.fillStyle='#7a5a36';for(let i=-3;i<=3;i++)ctx.fillRect(x+i*8-3,y-6,6,24);ctx.fillStyle='#9c7448';ctx.fillRect(x-28,y-10,56,7);ctx.strokeStyle='#4e3a24';ctx.lineWidth=2;ctx.strokeRect(x-28,y-10,56,7);
   ctx.fillStyle='#8b6a45';ctx.fillRect(x-9,y-46,18,38);ctx.strokeRect(x-9,y-46,18,38);ctx.fillStyle='#a07a4e';ctx.fillRect(x-14,y-52,28,8);ctx.strokeRect(x-14,y-52,28,8);
   ctx.strokeStyle='#5b4630';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x,y-52);ctx.lineTo(x,y-72);ctx.stroke();ctx.fillStyle=p.main;ctx.beginPath();ctx.moveTo(x+1,y-72);ctx.lineTo(x+17,y-67);ctx.lineTo(x+1,y-62);ctx.closePath();ctx.fill();
  }else if(b.kind==='tower'){
   ctx.fillStyle='#8a8f97';ctx.fillRect(x-16,y-46,32,58);ctx.strokeStyle='#5d636b';ctx.lineWidth=2;ctx.strokeRect(x-16,y-46,32,58);
   ctx.fillStyle='#a9aeb5';ctx.fillRect(x-21,y-54,42,10);for(let i=0;i<4;i++)ctx.fillRect(x-21+i*11.5,y-62,7,8);
   ctx.fillStyle=p.main;ctx.fillRect(x-6,y-32,12,16);ctx.fillStyle='#3b3f45';ctx.fillRect(x-5,y-2,10,14);
  }else{
   const top=y-hh*.55,wallH=hh*1.35;
   ctx.fillStyle='#cdb88f';ctx.fillRect(x-hw,top,hw*2,wallH);ctx.strokeStyle='#8a7550';ctx.lineWidth=2;ctx.strokeRect(x-hw,top,hw*2,wallH);
   ctx.fillStyle=p.deep;ctx.beginPath();ctx.moveTo(x-hw-6,top);ctx.lineTo(x,top-28);ctx.lineTo(x+hw+6,top);ctx.closePath();ctx.fill();ctx.strokeStyle=p.trim;ctx.stroke();
   ctx.fillStyle='#4a3524';ctx.fillRect(x-8,top+wallH-20,16,20);
   ctx.fillStyle=p.main;ctx.fillRect(x-hw+6,top+8,12,10);ctx.fillRect(x+hw-18,top+8,12,10);
   ctx.font='16px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(def.icon||'',x,top-10);
  }
  ctx.restore();drawBuildingOverlay(b,preview);
 });
}
// Region flags are about as tall as a fortress; below FLAG_MIN_SCREEN_ZOOM they grow so they stay recognisable when zoomed out.
const FLAG_COLORS={neutral:{main:'#ebe1c3',trim:'#8d8166'},0:{main:'#3f9bf0',trim:'#d4ecff'},1:{main:'#e0484f',trim:'#ffd9d4'}},FLAG_MIN_SCREEN_ZOOM=.3,FLAG_LABEL_MIN_PX=11;
const RESOURCE_ICONS={food:'🌾',wood:'🪵',stone:'🪨',gold:'🪙'};
function flagScale(){return Math.max(1,FLAG_MIN_SCREEN_ZOOM/zoom);}
function flagHit(r,x,y){const s=flagScale();return Math.abs(x-r.cp.x)<=60*s&&y>=r.cp.y-190*s&&y<=r.cp.y+30*s;}
function drawFlag(r){
 const {x,y}=r.cp,s=flagScale(),c=FLAG_COLORS[r.owner]||FLAG_COLORS.neutral,selectedHere=selectedFlag===r.id;
 drawUprightAt(x,y,()=>{
  ctx.save();
  // Capture range: shown while the flag is selected or being captured.
  if(selectedHere||r.cap>0||r.contested){
   const ring=r.contested?'#ffb347':r.capTeam>=0?TERRITORY_COLORS[r.capTeam]:'#fff4c8';
   ctx.beginPath();ctx.arc(x,y,FLAG_CAPTURE_RADIUS_TILES*TILE_SIZE,0,Math.PI*2);ctx.fillStyle=selectedHere?'#fff4c814':'#fff4c80a';ctx.fill();
   ctx.strokeStyle=ring;ctx.lineWidth=(selectedHere?3:2)/zoom;ctx.setLineDash([10/zoom,7/zoom]);ctx.stroke();ctx.setLineDash([]);
  }
  ctx.translate(x,y);ctx.scale(s,s);
  // Stone plinth.
  ctx.fillStyle='#1d2b2140';ctx.beginPath();ctx.ellipse(4,8,62,22,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#8f8672';ctx.beginPath();ctx.ellipse(0,2,48,18,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#bdb39b';ctx.beginPath();ctx.ellipse(0,-5,40,14,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#6d6553';ctx.lineWidth=2;ctx.stroke();
  // Pole and finial.
  ctx.fillStyle='#6b4f33';ctx.fillRect(-4,-178,8,174);ctx.strokeStyle='#3f2e1f';ctx.lineWidth=1.5;ctx.strokeRect(-4,-178,8,174);
  ctx.fillStyle='#f1cf6a';ctx.beginPath();ctx.arc(0,-182,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#8a6a22';ctx.stroke();
  // Waving banner in the owner's colour; the capturing side's colour fills it from the pole as progress grows.
  const banner=()=>{ctx.beginPath();ctx.moveTo(4,-174);ctx.bezierCurveTo(36,-186,62,-160,100,-170);ctx.lineTo(100,-114);ctx.bezierCurveTo(62,-104,36,-130,4,-118);ctx.closePath();};
  banner();ctx.fillStyle=c.main;ctx.fill();
  if(r.cap>0&&r.capTeam>=0){ctx.save();banner();ctx.clip();ctx.fillStyle=FLAG_COLORS[r.capTeam].main;ctx.globalAlpha=.85;ctx.fillRect(4,-190,96*r.cap,90);ctx.restore();}
  banner();ctx.strokeStyle=c.trim;ctx.lineWidth=3;ctx.stroke();
  ctx.font='26px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(RESOURCE_ICONS[r.resource]||'',52,-144);
  // Progress bar and label.
  // Two-stage bar for enemy flags: left half = stage 1 (lower), right half = stage 2 (capture), with a divider.
  const stage=captureStage(r),overall=stage===1?r.cap/2:stage===2?.5+r.cap/2:r.cap;
  if(r.cap>0||r.contested){ctx.fillStyle='#111827';ctx.fillRect(-56,26,112,10);ctx.fillStyle=r.contested?'#ff9f43':r.idle>=FLAG_DECAY_DELAY_SECONDS?'#9aa3ad':FLAG_COLORS[r.capTeam]?.main||'#ccc';ctx.fillRect(-55,27,110*overall,8);if(stage){ctx.fillStyle='#fff';ctx.fillRect(-1,24,2,14);}}
  // Two short lines: owner and region, then the capture status.
  const owner=r.owner===0?'XANH':r.owner===1?'ĐỎ':'TRUNG LẬP',pct=Math.round(r.cap*100)+'%';
  const status=r.contested?'TRANH CHẤP':r.cap<=0?'':(stage===1?'GĐ 1/2 · HẠ CỜ '+pct:stage===2?'GĐ 2/2 · CHIẾM '+pct:'ĐANG CHIẾM '+pct)+(r.idle>=FLAG_DECAY_DELAY_SECONDS?' · ĐANG GIẢM':'');
  // Text keeps at least FLAG_LABEL_MIN_PX on screen.
  const fs=Math.max(13,FLAG_LABEL_MIN_PX/(s*zoom));
  ctx.font=`900 ${fs}px system-ui`;ctx.textBaseline='alphabetic';ctx.lineWidth=fs*.3;ctx.strokeStyle='#1c2a22';ctx.fillStyle=r.owner===0?'#bfe2ff':r.owner===1?'#ffd0cc':'#fff8e0';
  for(const [text,ty] of [['CỜ '+owner+' · '+regionLabel(r).toUpperCase(),40+fs*1.1],[status,40+fs*2.3]])if(text){ctx.strokeText(text,0,ty);ctx.fillText(text,0,ty);}
  if(selectedHere){ctx.strokeStyle='#fff4a8';ctx.lineWidth=3;ctx.setLineDash([8,5]);ctx.beginPath();ctx.ellipse(0,0,66,26,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();
 });
}
// Unexplored fog as a soft blue-grey veil (slightly see-through, unlike black void or brown rock): one alpha per tile,
// blurred into a larger canvas so its edge fades over about two tiles. Rebuilt only when the explored area changes.
const FOG_RGB=[30,40,60],FOG_ALPHA=212,FOG_BLUR_SCALE=4;
const fogCanvas=document.createElement('canvas');fogCanvas.width=MAP_TILES;fogCanvas.height=MAP_TILES;
const fogCtx=fogCanvas.getContext('2d'),fogImage=fogCtx.createImageData(MAP_TILES,MAP_TILES);
const fogSoftCanvas=document.createElement('canvas');fogSoftCanvas.width=fogSoftCanvas.height=MAP_TILES*FOG_BLUR_SCALE;const fogSoftCtx=fogSoftCanvas.getContext('2d');
for(let i=0;i<MAP_TILES*MAP_TILES;i++){fogImage.data[i*4]=FOG_RGB[0];fogImage.data[i*4+1]=FOG_RGB[1];fogImage.data[i*4+2]=FOG_RGB[2];}
let fogKey=-1,fogArray=null,fogBuiltAt=0;
function drawFog(fog){
 let seen=0;for(let i=0;i<fog.length;i++)seen+=fog[i];
 const now=performance.now();
 if((seen!==fogKey||fog!==fogArray)&&(now-fogBuiltAt>200||fog!==fogArray)){
  fogKey=seen;fogArray=fog;fogBuiltAt=now;
  for(let i=0;i<fog.length;i++)fogImage.data[i*4+3]=fog[i]?0:FOG_ALPHA;
  fogCtx.putImageData(fogImage,0,0);
  const size=fogSoftCanvas.width;
  fogSoftCtx.clearRect(0,0,size,size);fogSoftCtx.imageSmoothingEnabled=true;fogSoftCtx.filter=`blur(${FOG_BLUR_SCALE*1.5}px)`;
  fogSoftCtx.drawImage(fogCanvas,0,0,size,size);fogSoftCtx.filter='none';
 }
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(fogSoftCanvas,0,0,W,H);ctx.restore();
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
 // Territory layer: owner tint and borders (only where explored); toggled with T. Flags are drawn with the scene (drawFlag).
 drawTerritory(camX,camY,camX+VIEW_W/viewScale,camY+VIEW_H/viewScale);
 for(const m of state.mines){
  if(!currentlyVisible(m.x,m.y)&&!isTeamAreaExplored(localTeam(),m.x,m.y))continue;
  drawUprightAt(m.x,m.y,()=>{
  // Colorful collectible mine with stacked stones, gold crystals and a team-control ring.
  const mineTeam=m.owner===0?teamPalette(0):m.owner===1?teamPalette(1):null;
  ctx.fillStyle='#29472d40';ctx.beginPath();ctx.ellipse(m.x+3,m.y+15,35,17,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=mineTeam?mineTeam.glow+'55':'#d5e3bf';ctx.beginPath();ctx.ellipse(m.x,m.y+3,35,23,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#85978a';ctx.beginPath();ctx.moveTo(m.x-30,m.y+7);ctx.lineTo(m.x-24,m.y-12);ctx.lineTo(m.x-11,m.y-24);ctx.lineTo(m.x+7,m.y-25);ctx.lineTo(m.x+25,m.y-10);ctx.lineTo(m.x+31,m.y+7);ctx.lineTo(m.x+17,m.y+16);ctx.lineTo(m.x-19,m.y+16);ctx.closePath();ctx.fill();ctx.strokeStyle='#e0e9c9';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#bac9b0';ctx.beginPath();ctx.moveTo(m.x-20,m.y-11);ctx.lineTo(m.x-10,m.y-21);ctx.lineTo(m.x+4,m.y-21);ctx.lineTo(m.x-3,m.y-8);ctx.closePath();ctx.fill();
  const crystal=MINE_TYPES[m.resource].crystal;
  for(let i=0;i<5;i++){const cx=m.x-12+i*6,cy=m.y-6+(i%2)*6;ctx.fillStyle='#9a6d22';ctx.beginPath();ctx.moveTo(cx-3,cy+4);ctx.lineTo(cx-2,cy-3);ctx.lineTo(cx,cy-7);ctx.lineTo(cx+3,cy-2);ctx.lineTo(cx+3,cy+4);ctx.closePath();ctx.fill();ctx.fillStyle=crystal;ctx.beginPath();ctx.moveTo(cx-2,cy+3);ctx.lineTo(cx-1,cy-3);ctx.lineTo(cx,cy-6);ctx.lineTo(cx+2,cy-2);ctx.lineTo(cx+2,cy+3);ctx.closePath();ctx.fill();}
  if(m.rich){ctx.strokeStyle='#ffe16d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(m.x,m.y-1,39,0,Math.PI*2);ctx.stroke();}
  const labelColor=m.owner===0?'#1764a4':m.owner===1?'#a52d3a':'#42564a';ctx.font='900 11px system-ui';ctx.textAlign='center';const mineLabel=MINE_TYPES[m.resource].label+(m.rich?' GIÀU':'')+' +'+Math.round(m.income*60)+'/PHÚT';ctx.lineWidth=3;ctx.strokeStyle='#f1f8da';ctx.strokeText((m.owner===0?'XANH · ':m.owner===1?'ĐỎ · ':'TRUNG LẬP · ')+mineLabel,m.x,m.y+34);ctx.fillStyle=labelColor;ctx.fillText((m.owner===0?'XANH · ':m.owner===1?'ĐỎ · ':'TRUNG LẬP · ')+mineLabel,m.x,m.y+34);
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
 for(const r of state.regions){if(!r.cp||!isTeamAreaExplored(localTeam(),r.cp.x,r.cp.y))continue;enqueue(r.cp.y+8,()=>drawFlag(r));}
 for(const b of state.buildings){if(b.team!==localTeam()&&!currentlyVisible(b.x,b.y))continue;enqueue(b.y+BUILDING_TYPES[b.kind].halfH*.7,()=>drawBuilding(b));}
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
 // Fog of war overlay: unexplored tiles are veiled (drawFog); explored terrain stays visible.
 drawFog(localTeam()===0?state.fogSeen:state.enemyFogSeen);
 // Keep placement feedback readable even when the cursor crosses unexplored fog.
 if(placement)drawBuilding({kind:placement.kind,x:placement.x,y:placement.y,team:localTeam(),previewValid:placement.valid},true);
 // Hide enemy forces and enemy structures when their location is not currently visible.
 function currentlyVisible(x,y){return teamCanSee(localTeam(),x,y);}
 // Return to screen coordinates for selection feedback and fixed viewport labels.
 ctx.restore();
 if(dragSelect){const x=Math.min(dragSelect.x,dragSelect.cx),y=Math.min(dragSelect.y,dragSelect.cy),w=Math.abs(dragSelect.cx-dragSelect.x),h=Math.abs(dragSelect.cy-dragSelect.y);ctx.fillStyle='#69b9ff22';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#8bd0ff';ctx.setLineDash([6,4]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);}
 if(placement){const valid=placement.valid,color=valid?'#47b96c':'#d84c58',name=BUILDING_TYPES[placement.kind].name.toUpperCase(),text=valid?name+' · VỊ TRÍ HỢP LỆ':name+' · '+(placement.problem||'VỊ TRÍ BỊ CHẶN');ctx.save();ctx.font='700 13px system-ui';const w=Math.min(VIEW_W-32,Math.max(280,ctx.measureText(text+'  ·  Trái: đặt  |  Phải / Esc: hủy').width+28)),x=(VIEW_W-w)/2,y=VIEW_H-43;ctx.fillStyle='#101b25eF';ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,w,30,8);ctx.fill();ctx.stroke();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(text+'  ·  Trái: đặt  |  Phải / Esc: hủy',VIEW_W/2,y+15,w-18);ctx.restore();}
 ctx.textAlign='left';ctx.font='12px system-ui';ctx.fillStyle='#efffea99';ctx.fillText('CHIẾN TRƯỜNG 01',16,22);
}
function loop(ts){if(!last)last=ts;let dt=Math.min((ts-last)/1000,.05);last=ts;update(dt);if(mode==='pvp'&&netRole==='host'&&gameStarted){snapshotClock+=dt;if(snapshotClock>=.18){snapshotClock=0;sendSnapshot();}}draw();requestAnimationFrame(loop);}
$('modeAI').onclick=startAIMode;
$('modeFriends').onclick=()=>{showFriendPanel();setNetStatus('Chọn tạo phòng mới hoặc nhập mã phòng.');};
$('modeBack').onclick=()=>{if(peer||conn)destroyPeer();$('roomWaiting').classList.remove('show');$('friendActions').style.display='block';$('createRoom').disabled=false;$('joinRoom').disabled=false;showModeHome();};
$('createRoom').onclick=createRoom;$('joinRoom').onclick=joinRoom;
$('copyRoomCode').onclick=()=>{const code=$('roomCode').textContent; if(navigator.clipboard?.writeText)navigator.clipboard.writeText(code).then(()=>setNetStatus('Đã sao chép mã phòng: '+code)).catch(()=>setNetStatus('Mã phòng: '+code));else setNetStatus('Mã phòng: '+code);};
$('copyRoomLink').onclick=()=>{const url=window._miniWarInviteUrl||window.location.href;if(navigator.clipboard?.writeText)navigator.clipboard.writeText(url).then(()=>setNetStatus('Đã sao chép link mời.')).catch(()=>setNetStatus('Link mời: '+url));else setNetStatus('Link mời: '+url);};
const roomFromUrl=new URLSearchParams(window.location.search).get('room');if(roomFromUrl){showFriendPanel();$('roomInput').value=roomFromUrl.toUpperCase();setNetStatus('Link mời được phát hiện. Bấm “Tham gia phòng” để kết nối.');}

// Button price labels come from the same cost tables the simulation charges.
for(const type of Object.keys(specs))$(type).querySelector('span').textContent=costText(specs[type].cost)+' · nuôi '+formatAmount(specs[type].upkeep)+' lúa/phút';
for(const [kind,def] of Object.entries(BUILDING_TYPES))if(def.button)$(def.button).querySelector('span').textContent=costText(def.cost)+' · '+def.buildTime+'s'+(kind==='farm'?' · +'+FARM_LEVELS[1].food+' lúa/phút':def.unlocks?' · mở '+specs[def.unlocks].name.toLowerCase():kind==='tower'?' · trong lãnh thổ':'');
$('upgradeOutpost').querySelector('span').textContent=costText(BUILDING_TYPES.outpost.cost)+' · '+BUILDING_TYPES.outpost.buildTime+'s · cạnh cờ đã chiếm, có súng';
$('turret').querySelector('span').textContent=costText(FORTRESS_GUN_COST)+' · tích hợp pháo thứ hai';
$('scout').onclick=()=>requestAction('buy',{unit:'scout'});$('infantry').onclick=()=>requestAction('buy',{unit:'infantry'});$('archer').onclick=()=>requestAction('buy',{unit:'archer'});$('spearman').onclick=()=>requestAction('buy',{unit:'spearman'});$('cavalry').onclick=()=>requestAction('buy',{unit:'cavalry'});for(const [kind,def] of Object.entries(BUILDING_TYPES))if(def.button)$(def.button).onclick=()=>beginPlacement(kind);$('toggleTerritory').onclick=()=>setShowTerritory(!showTerritory);$('upgradeFarm').onclick=()=>requestAction('upgrade',{kind:'farm',id:selectedBuilding?.kind==='farm'&&selectedBuilding.team===localTeam()?selectedBuilding.id:null});$('upgradeOutpost').onclick=()=>requestAction('outpost',{regionId:selectedFlag});$('turret').onclick=()=>requestAction('turret');$('attack').onclick=()=>requestAction('attack',{ids:state.units.filter(u=>u.team===localTeam()&&u.selected).map(u=>u.id)});
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
  if(placement){
   e.preventDefault();e.stopImmediatePropagation();
   if(e.button===2){endPlacement();addLog('Đã hủy đặt công trình.');return;}
   if(e.button===0){suppressNextCanvasClick=true;placement.problem=buildingPlacementProblem(localTeam(),placement.kind,placement.x,placement.y);placement.valid=!placement.problem;if(placement.valid){const {kind,x,y}=placement;endPlacement();requestAction('build',{kind,x,y});}else addLog(BUILDING_TYPES[placement.kind].name+': '+placement.problem);}
   return;
  }
  canvas.focus({preventScroll:true});
  const pos=canvasPos(e);
  const hitUnit=(state?.units||[]).some(u=>u.hp>0 && u.team===localTeam() && Math.hypot(u.x-pos.x,u.y-pos.y)<unitHitRadius(u));
  const hitBuilding=(state?.bases||[]).some(b=>b.team===localTeam()&&Math.abs(pos.x-b.x)<=124&&pos.y>=b.y-196&&pos.y<=b.y+34) || (state?.buildings||[]).some(b=>b.team===localTeam()&&Math.abs(pos.x-b.x)<=BUILDING_TYPES[b.kind].halfW&&Math.abs(pos.y-b.y)<=BUILDING_TYPES[b.kind].halfH);
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
   if(e.key==='+'||e.key==='=')zoom=Math.min(MAX_ZOOM,zoom*1.15);
   if(e.key==='-'||e.key==='_')zoom=Math.max(MIN_ZOOM,zoom/1.15);
   if(e.key==='ArrowLeft')camX-=step;if(e.key==='ArrowRight')camX+=step;
   if(e.key==='ArrowUp')camY-=step;if(e.key==='ArrowDown')camY+=step;
   clampCamera();
  }
 });
canvas.addEventListener('click',e=>{
 if(suppressNextCanvasClick){suppressNextCanvasClick=false;e.preventDefault();return;}
 if(placement)return;
 if(selectingBox)return;
 const {x,y}=canvasPos(e);
 const fortress=state.bases.find(b=>b.team===localTeam()&&Math.abs(x-b.x)<=124&&y>=b.y-196&&y<=b.y+34);
 if(fortress){for(const u of state.units)u.selected=false;localSelectedIds.clear();selected=null;selectedFortress=fortress;selectedBuilding=null;selectedFlag=null;addLog('Đã chọn pháo đài căn cứ.');return;}
 selectedFortress=null;
 // Flags: click to select one (shows its capture range); with a single unit selected the click is a move order instead.
 const flag=!selected&&state.regions.find(r=>r.cp&&isTeamAreaExplored(localTeam(),r.cp.x,r.cp.y)&&flagHit(r,x,y));
 if(flag){
  for(const u of state.units)u.selected=false;localSelectedIds.clear();selectedBuilding=null;selectedFlag=flag.id;
  const who=flag.owner===localTeam()?'của bạn':flag.owner>=0?'của địch':'trung lập';
  addLog(`Đã chọn cờ ${regionLabel(flag)} (${who}): đưa quân chiến đấu vào vòng nét đứt để chiếm (trinh sát không tính); 1 quân ~${Math.round(captureSeconds(1))} giây, ${FLAG_CAPTURE_MAX_UNITS}+ quân ~${Math.round(captureSeconds(FLAG_CAPTURE_MAX_UNITS))} giây; bỏ trống ${FLAG_DECAY_DELAY_SECONDS} giây thì tiến độ giảm dần.`+(flag.resource==='food'?` Nông trại trong vùng lúa của mình được +${Math.round(FOOD_REGION_FARM_BONUS*100)}% lúa.`:'')+(flag.owner===localTeam()&&!state.buildings.some(b=>b.kind==='outpost'&&b.regionId===flag.id)?' Bấm "Xây tiền đồn" để giữ cờ.':''));
  updateHUD();return;
 }
 selectedFlag=null;
 const building=state.buildings.find(b=>b.team===localTeam()&&Math.abs(x-b.x)<=BUILDING_TYPES[b.kind].halfW&&Math.abs(y-b.y)<=BUILDING_TYPES[b.kind].halfH+10);
 if(building){
  for(const u of state.units)u.selected=false;localSelectedIds.clear();selected=null;selectedBuilding=building;
  const info=!buildingDone(building)?`đang xây ${Math.round(building.progress*100)}%`:building.kind==='farm'?`cấp ${building.level}, ${formatAmount(farmFoodPerMinute(building))} lúa/phút`+(farmFoodPerMinute(building)>FARM_LEVELS[building.level].food?' (có thưởng vùng lúa)':'')+(building.level<3?' · bấm "Nâng cấp nông trại"':''):building.kind==='outpost'?`giữ cờ ${regionLabel(state.regions[building.regionId])}, máu ${Math.ceil(building.hp)}/${building.max}`:`máu ${Math.ceil(building.hp)}/${building.max}`;
  addLog(`Đã chọn ${buildingName(building).toLowerCase()}: ${info}.`);updateHUD();return;
 }
 selectedBuilding=null;
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
 if(placement){e.preventDefault();return;}
 const pos=canvasPos(e);
 if(e.button===0){
  // Farms take priority over unit selection: drag a farm by grabbing its visible body.
  const fortressHit=state.bases.find(b=>b.team===localTeam()&&Math.abs(pos.x-b.x)<=124&&pos.y>=b.y-196&&pos.y<=b.y+34);
  if(fortressHit){e.preventDefault();return;}
  const buildingHit=state.buildings.find(b=>b.team===localTeam()&&Math.abs(pos.x-b.x)<=BUILDING_TYPES[b.kind].halfW&&Math.abs(pos.y-b.y)<=BUILDING_TYPES[b.kind].halfH);
  if(buildingHit?.kind==='farm'){draggingFarm=buildingHit;canvas.setPointerCapture?.(e.pointerId);e.preventDefault();return;}
  if(buildingHit){e.preventDefault();return;}
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
 if(placement){placement.x=pos.x;placement.y=pos.y;
  placement.problem=buildingPlacementProblem(localTeam(),placement.kind,placement.x,placement.y);placement.valid=!placement.problem;canvas.style.cursor=placement.valid?'copy':'not-allowed';return;}
 if(draggingFarm){
  const nx=Math.max(33,Math.min(W-33,pos.x)),ny=Math.max(36,Math.min(H-36,pos.y));
  if(!buildingPlacementProblem(localTeam(),'farm',nx,ny,draggingFarm)){draggingFarm.x=nx;draggingFarm.y=ny;}
  return;
 }
 if(selectingBox&&boxPointerId===e.pointerId&&dragSelect){const boxPoint=canvasPoint(e);dragSelect.cx=boxPoint.x;dragSelect.cy=boxPoint.y;}
 if(guiding){
  for(const u of state.units)if(u.team===localTeam()&&u.selected){u.dest={x:Math.max(25,Math.min(W-25,pos.x)),y:Math.max(45,Math.min(H-30,pos.y))};u.order='move';}
 }
});
function endPointer(e){
 if(draggingFarm){if(mode==='pvp'&&netRole==='guest'){requestAction('moveFarm',{id:draggingFarm.id,x:draggingFarm.x,y:draggingFarm.y});}draggingFarm=null;if(window._miniWarQueuedSnapshot){applySnapshot(window._miniWarQueuedSnapshot);window._miniWarQueuedSnapshot=null;}return;}
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
document.addEventListener('keydown',e=>{if(placement&&e.key==='Escape'){endPlacement();addLog('Đã hủy đặt công trình.');return;}if(e.key.toLowerCase()==='t'&&!e.ctrlKey&&!e.metaKey&&document.activeElement?.tagName!=='INPUT'){setShowTerritory(!showTerritory);return;}if(e.code==='Space'){e.preventDefault();$('pause').click();}if(e.key.toLowerCase()==='a')requestAction('attack',{ids:state.units.filter(u=>u.team===localTeam()&&u.selected).map(u=>u.id)});});
fresh();gameStarted=false;requestAnimationFrame(loop);
})();


