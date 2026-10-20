// @ts-nocheck
// Mouse, touch and keyboard: selection, orders, camera pan/zoom, building placement, button wiring (docs/features/controls.md).
import { MAP_WORLD_H, MAP_WORLD_W, MAX_ZOOM, MIN_ZOOM, VIEW_H, VIEW_W, camX, camY, canvas, clampCamera, gameApp, screenPlaneToWorld, setCamX, setCamY, setZoom, syncWorldMetrics, toggleSideHud, viewOffsets, worldToCanvas, zoom } from '../core/view';
import { H, W } from '../config/map';
import { $, addLog, canAfford, conn, costText, draggingFarm, ended, formatAmount, localSelectedIds, localTeam, missingText, mode, notifyShortfall, netRole, paused, peer, placement, selected, selectedBuilding, selectedFlag, selectedFortress, setDraggingFarm, setPaused, setPlacement, setSelected, setSelectedBuilding, setSelectedFlag, setSelectedFortress, setSuppressNextCanvasClick, state, suppressNextCanvasClick } from '../core/game';
import { fresh } from '../core/match';
import { playSound } from '../audio/sound';
import { BUILDING_TYPES, FARM_LEVELS, FLAG_CAPTURE_MAX_UNITS, FLAG_DECAY_DELAY_SECONDS, FOOD_REGION_FARM_BONUS, FORTRESS_GUN_COST, specs } from '../config/balance';
import { requestBuy, requestBuyLane } from '../sim/units';
import { farmFoodPerMinute } from '../sim/economy';
import { createRoom, destroyPeer, joinRoom, setNetStatus } from '../net/peer';
import { roomFromUrl, showFriendPanel, showModeHome, startAIMode } from './modeScreen';
import { applySnapshot } from '../net/snapshot';
import { isTeamAreaExplored } from '../sim/fog';
import { requestAction } from '../core/actions';
import { regionLabel } from '../map/regions';
import { setPauseButton, setShowTerritory, setSidebarCollapsed, showTerritory, updateHUD } from './hud';
import { buildingDone, buildingName, buildingPlacementProblem } from '../sim/buildings';
import { captureSeconds } from '../sim/territory';
import { unitHitRadius } from '../render/units';
import { flagHit } from '../render/flags';
import { minimapCanvas, minimapToWorld } from '../render/minimap';
import { closePanels, openPanel } from './panels';
import { showMoveMarker } from '../render/paths';

export function endPlacement(){setPlacement(null);document.querySelectorAll('.controls .placing').forEach(el=>el.classList.remove('placing'));canvas.style.cursor='';}
export function beginPlacement(kind){
 if(ended||paused)return;
 const def=BUILDING_TYPES[kind];
 if(!canAfford(localTeam(),def.cost)){addLog(`Không đủ tài nguyên để xây ${def.name}: thiếu ${missingText(localTeam(),def.cost)}.`);notifyShortfall(localTeam(),def.cost);return;}
 endPlacement();
 const home=state.bases.find(b=>b.team===localTeam());setPlacement({kind,x:home?.x||W/2,y:home?.y||H/2,valid:false,problem:''});
 $(def.button).classList.add('placing');
 addLog(`Chọn vị trí ${def.name.toLowerCase()}: nhấp trái để đặt, nhấp phải hoặc Escape để hủy.`+(def.where==='territory'?' Chỉ xây trong lãnh thổ của mình.':''));
}
export let dragSelect=null;
$('modeAI').onclick=startAIMode;
$('modeFriends').onclick=()=>{showFriendPanel();setNetStatus('Chọn tạo phòng mới hoặc nhập mã phòng.');};
$('modeBack').onclick=()=>{if(peer||conn)destroyPeer();$('roomWaiting').classList.remove('show');$('friendActions').style.display='block';$('createRoom').disabled=false;$('joinRoom').disabled=false;showModeHome();};
$('createRoom').onclick=createRoom;
$('joinRoom').onclick=joinRoom;
$('copyRoomCode').onclick=()=>{const code=$('roomCode').textContent; if(navigator.clipboard?.writeText)navigator.clipboard.writeText(code).then(()=>setNetStatus('Đã sao chép mã phòng: '+code)).catch(()=>setNetStatus('Mã phòng: '+code));else setNetStatus('Mã phòng: '+code);};
$('copyRoomLink').onclick=()=>{const url=window._miniWarInviteUrl||window.location.href;if(navigator.clipboard?.writeText)navigator.clipboard.writeText(url).then(()=>setNetStatus('Đã sao chép link mời.')).catch(()=>setNetStatus('Link mời: '+url));else setNetStatus('Link mời: '+url);};
if(roomFromUrl){showFriendPanel();$('roomInput').value=roomFromUrl.toUpperCase();setNetStatus('Link mời được phát hiện. Bấm “Tham gia phòng” để kết nối.');}

// Button price labels come from the same cost tables the simulation charges.
for(const type of Object.keys(specs))$(type).querySelector('span').textContent=costText(specs[type].cost)+' · nuôi '+formatAmount(specs[type].upkeep)+' lúa/phút';
for(const [kind,def] of Object.entries(BUILDING_TYPES))if(def.button)$(def.button).querySelector('span').textContent=costText(def.cost)+' · '+def.buildTime+'s'+(kind==='farm'?' · +'+FARM_LEVELS[1].food+' lúa/phút':kind==='tower'?' · trong lãnh thổ':'');
$('upgradeOutpost').querySelector('span').textContent=costText(BUILDING_TYPES.outpost.cost)+' · '+BUILDING_TYPES.outpost.buildTime+'s · cạnh cờ đã chiếm, có súng';
$('turret').querySelector('span').textContent=costText(FORTRESS_GUN_COST)+' · tích hợp pháo thứ hai';
for(const type of Object.keys(specs))$(type).onclick=()=>requestBuy(type);
$('buyLane').onclick=()=>requestBuyLane();
// Building cards close the drawer so the map is free for placement.
for(const [kind,def] of Object.entries(BUILDING_TYPES))if(def.button)$(def.button).onclick=()=>{closePanels();beginPlacement(kind);};
$('toggleTerritory').onclick=()=>setShowTerritory(!showTerritory);
$('upgradeFarm').onclick=()=>requestAction('upgrade',{kind:'farm',id:selectedBuilding?.kind==='farm'&&selectedBuilding.team===localTeam()?selectedBuilding.id:null});
$('upgradeOutpost').onclick=()=>requestAction('outpost',{regionId:selectedFlag});
$('turret').onclick=()=>requestAction('turret');
$('attack').onclick=()=>{const ids=state.units.filter(u=>u.team===localTeam()&&u.selected).map(u=>u.id);if(ids.length)playSound('order.attack');requestAction('attack',{ids});};
// Fullscreen on the whole page (not #gameApp) so the lobby, guide and dialogs stay visible in fullscreen too.
async function toggleFullscreen(){try{if(document.fullscreenElement){await document.exitFullscreen();}else{await document.documentElement.requestFullscreen();}}catch{addLog('Trình duyệt không cho phép bật toàn màn hình.');}}
$('fullscreen').onclick=toggleFullscreen;
$('lobbyFullscreen').onclick=toggleFullscreen;
$('lobbyGuide').onclick=()=>openPanel('guide');
document.addEventListener('fullscreenchange',()=>{const on=!!document.fullscreenElement,el=$('fullscreen');el.innerHTML=`<svg class="ico"><use href="#i-${on?'shrink':'expand'}"/></svg>`;el.dataset.tip=on?'Thoát toàn màn hình':'Toàn màn hình';});
toggleSideHud.onclick=()=>setSidebarCollapsed(!gameApp.classList.contains('panel-collapsed'));
window.addEventListener('resize',()=>{syncWorldMetrics();});
$('pause').onclick=()=>{if(ended)return;if(mode==='pvp'&&netRole==='guest'){requestAction('pause',{paused:!paused});return;}setPaused(!paused);setPauseButton();addLog(paused?'Đã tạm dừng trận đấu.':'Trận đấu tiếp tục.');updateHUD();};
$('overlayRestart').onclick=()=>{if(mode==='pvp'){addLog('Muốn chơi trận mới, hãy tạo phòng mới hoặc tải lại trang.');return;} $('feed').innerHTML='';fresh();};
export function canvasPoint(e){const rect=canvas.getBoundingClientRect();return {x:(e.clientX-rect.left)*VIEW_W/rect.width,y:(e.clientY-rect.top)*VIEW_H/rect.height};}
export function canvasPos(e){const p=canvasPoint(e),o=viewOffsets();return screenPlaneToWorld((p.x-o.x)/zoom,(p.y-o.y)/zoom);}
export let selectingBox=false,boxStart=null,boxPointerId=null,guiding=false;

 canvas.addEventListener('wheel',e=>{
  e.preventDefault();e.stopPropagation();
  const rect=canvas.getBoundingClientRect();
  const px=(e.clientX-rect.left)*VIEW_W/rect.width;
  const py=(e.clientY-rect.top)*VIEW_H/rect.height;
  const {x:ox,y:oy}=viewOffsets();
  const ix=(px-ox)/zoom,iy=(py-oy)/zoom;
  setZoom(Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,zoom*(e.deltaY<0?1.15:1/1.15))));
  if(MAP_WORLD_W*zoom>=VIEW_W)setCamX(ix-px/zoom);else setCamX(0);
  if(MAP_WORLD_H*zoom>=VIEW_H)setCamY(iy-py/zoom);else setCamY(0);
  clampCamera();
 },{passive:false});
 export let panning=false,panPointerId=null,panStart=null,panCamStart=null,justPanned=false,panMoved=false;
 canvas.addEventListener('pointerdown',e=>{
  if(placement){
   e.preventDefault();e.stopImmediatePropagation();
   if(e.button===2){endPlacement();addLog('Đã hủy đặt công trình.');return;}
   if(e.button===0){setSuppressNextCanvasClick(true);placement.problem=buildingPlacementProblem(localTeam(),placement.kind,placement.x,placement.y);placement.valid=!placement.problem;if(placement.valid){const {kind,x,y}=placement;endPlacement();requestAction('build',{kind,x,y});}else addLog(BUILDING_TYPES[placement.kind].name+': '+placement.problem);}
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
  setCamX(panCamStart.x-(e.clientX-panStart.x)*sx/zoom);
  setCamY(panCamStart.y-(e.clientY-panStart.y)*sy/zoom);
  clampCamera();
 });
 export function stopPan(e){if(panning&&(!e||e.pointerId===panPointerId)){const wasDrag=panMoved,button=e?.button; if(button===2&&!wasDrag){const pos=canvasPos(e),chosen=state.units.filter(u=>u.team===localTeam()&&u.selected);if(chosen.length){const own=state.regions.find(r=>r.cp&&r.owner===localTeam()&&flagHit(r,pos.x,pos.y));if(own){requestAction('garrison',{ids:chosen.map(u=>u.id),regionId:own.id});showMoveMarker(own.cp.x,own.cp.y);}else{requestAction('move',{ids:chosen.map(u=>u.id),x:pos.x,y:pos.y});showMoveMarker(pos.x,pos.y);}setSelected(null);}} justPanned=wasDrag;panning=false;panPointerId=null;panStart=null;panCamStart=null;panMoved=false;canvas.style.cursor='';canvas.style.touchAction='';}}
 canvas.addEventListener('pointerup',stopPan);
canvas.addEventListener('pointercancel',stopPan);
canvas.addEventListener('click',e=>{
 if(suppressNextCanvasClick){setSuppressNextCanvasClick(false);e.preventDefault();return;}
 if(placement)return;
 if(selectingBox)return;
 const {x,y}=canvasPos(e);
 const fortress=state.bases.find(b=>b.team===localTeam()&&Math.abs(x-b.x)<=124&&y>=b.y-196&&y<=b.y+34);
 if(fortress){for(const u of state.units)u.selected=false;localSelectedIds.clear();setSelected(null);setSelectedFortress(fortress);setSelectedBuilding(null);setSelectedFlag(null);addLog('Đã chọn pháo đài căn cứ.');return;}
 setSelectedFortress(null);
 // Flags: click to select one (shows its capture range); with a single unit selected the click is a move order instead.
 const flag=!selected&&state.regions.find(r=>r.cp&&isTeamAreaExplored(localTeam(),r.cp.x,r.cp.y)&&flagHit(r,x,y));
 if(flag){
  for(const u of state.units)u.selected=false;localSelectedIds.clear();setSelectedBuilding(null);setSelectedFlag(flag.id);
  const who=flag.owner===localTeam()?'của bạn':flag.owner>=0?'của địch':'trung lập';
  addLog(`Đã chọn cờ ${regionLabel(flag)} (${who}): đưa quân chiến đấu vào vòng nét đứt để chiếm (trinh sát không tính); 1 quân ~${Math.round(captureSeconds(1))} giây, ${FLAG_CAPTURE_MAX_UNITS}+ quân ~${Math.round(captureSeconds(FLAG_CAPTURE_MAX_UNITS))} giây; bỏ trống ${FLAG_DECAY_DELAY_SECONDS} giây thì tiến độ giảm dần.`+(flag.resource==='food'?` Nông trại trong vùng lúa của mình được +${Math.round(FOOD_REGION_FARM_BONUS*100)}% lúa.`:'')+(flag.owner===localTeam()&&!state.buildings.some(b=>b.kind==='outpost'&&b.regionId===flag.id)?' Bấm "Xây tiền đồn" để giữ cờ.':''));
  updateHUD();return;
 }
 setSelectedFlag(null);
 const building=state.buildings.find(b=>b.team===localTeam()&&Math.abs(x-b.x)<=BUILDING_TYPES[b.kind].halfW&&Math.abs(y-b.y)<=BUILDING_TYPES[b.kind].halfH+10);
 if(building){
  for(const u of state.units)u.selected=false;localSelectedIds.clear();setSelected(null);setSelectedBuilding(building);
  const info=!buildingDone(building)?`đang xây ${Math.round(building.progress*100)}%`:building.kind==='farm'?`cấp ${building.level}, ${formatAmount(farmFoodPerMinute(building))} lúa/phút`+(farmFoodPerMinute(building)>FARM_LEVELS[building.level].food?' (có thưởng vùng lúa)':'')+(building.level<3?' · bấm "Nâng cấp nông trại"':''):building.kind==='outpost'?`giữ cờ ${regionLabel(state.regions[building.regionId])}, máu ${Math.ceil(building.hp)}/${building.max}`:`máu ${Math.ceil(building.hp)}/${building.max}`;
  addLog(`Đã chọn ${buildingName(building).toLowerCase()}: ${info}.`);updateHUD();return;
 }
 setSelectedBuilding(null);
 let hit=null;for(const u of state.units){if(u.team===localTeam()&&Math.hypot(u.x-x,u.y-y)<unitHitRadius(u))hit=u;}
 if(hit){
  for(const u of state.units)u.selected=false;localSelectedIds.clear();
  hit.selected=true;localSelectedIds.add(hit.id);setSelected(hit);addLog('Đã chọn '+specs[hit.type].name+'. Giữ Shift hoặc kéo khung để chọn nhiều lính.');
 }else if(selected){
  requestAction('move',{ids:[selected.id],x,y});showMoveMarker(x,y);addLog('Đã đặt điểm đến cho đơn vị.');setSelected(null);
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
  if(buildingHit?.kind==='farm'){setDraggingFarm(buildingHit);canvas.setPointerCapture?.(e.pointerId);e.preventDefault();return;}
  if(buildingHit){e.preventDefault();return;}
  // Units cannot be dragged; click to select and right-click to move.
  const unitHit=state.units.find(u=>u.team===localTeam()&&u.hp>0&&Math.hypot(u.x-pos.x,u.y-pos.y)<unitHitRadius(u));
  // Drag on open ground to box-select multiple friendly units.
  if(!unitHit){
   setSelectedFortress(null);const boxPoint=canvasPoint(e);selectingBox=true;boxPointerId=e.pointerId;boxStart=boxPoint;dragSelect={x:boxPoint.x,y:boxPoint.y,cx:boxPoint.x,cy:boxPoint.y};
   canvas.setPointerCapture?.(e.pointerId);
  }else if(e.shiftKey){
   const hit=state.units.find(u=>u.team===localTeam()&&Math.hypot(u.x-pos.x,u.y-pos.y)<unitHitRadius(u));
   if(hit){hit.selected=!hit.selected;if(hit.selected)localSelectedIds.add(hit.id);else localSelectedIds.delete(hit.id);setSelected(hit.selected?hit:null);}
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
export function endPointer(e){
 if(draggingFarm){if(mode==='pvp'&&netRole==='guest'){requestAction('moveFarm',{id:draggingFarm.id,x:draggingFarm.x,y:draggingFarm.y});}setDraggingFarm(null);if(window._miniWarQueuedSnapshot){applySnapshot(window._miniWarQueuedSnapshot);window._miniWarQueuedSnapshot=null;}return;}
 if(selectingBox&&boxPointerId===e.pointerId&&dragSelect){
  const x1=Math.min(dragSelect.x,dragSelect.cx),x2=Math.max(dragSelect.x,dragSelect.cx);
  const y1=Math.min(dragSelect.y,dragSelect.cy),y2=Math.max(dragSelect.y,dragSelect.cy);
  if(Math.abs(x2-x1)+Math.abs(y2-y1)>8){
   for(const u of state.units){if(u.team===localTeam()){const p=worldToCanvas(u.x,u.y);u.selected=p.x>=x1&&p.x<=x2&&p.y>=y1&&p.y<=y2;if(u.selected)localSelectedIds.add(u.id);else localSelectedIds.delete(u.id);}}
   setSelected(null);
   addLog(`${state.units.filter(u=>u.team===localTeam()&&u.selected).length} lính được chọn.`);
  }
 }
 selectingBox=false;boxStart=null;boxPointerId=null;dragSelect=null;guiding=false;
}
canvas.addEventListener('pointerup',endPointer);
canvas.addEventListener('pointercancel',endPointer);
// Keyboard shortcuts (Esc, T, F10, 1–5, F1–F9, A, S, camera keys…) are all handled in ui/hotkeys.ts.

// Minimap: press or drag to centre the camera there (local view only, nothing to send to the host).
let minimapDrag=null;
function centerCameraOnMinimap(e){const p=minimapToWorld(e);setCamX(p.x-VIEW_W/zoom/2);setCamY(p.y-VIEW_H/zoom/2);clampCamera();}
minimapCanvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();minimapDrag=e.pointerId;try{minimapCanvas.setPointerCapture(e.pointerId);}catch{}centerCameraOnMinimap(e);});
minimapCanvas.addEventListener('pointermove',e=>{if(minimapDrag===e.pointerId)centerCameraOnMinimap(e);});
for(const type of ['pointerup','pointercancel'])minimapCanvas.addEventListener(type,e=>{if(minimapDrag===e.pointerId)minimapDrag=null;});
