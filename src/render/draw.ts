// @ts-nocheck
// Frame composition: draw() calls every layer in order (docs/features/rendering.md).
import { TEAM_COLORS, THEME } from '../config/theme';
import { settings } from '../core/settings';
import { updateSoundscape } from '../audio/sound';
import { VIEW_H, VIEW_W, camX, camY, ctx, drawUprightAt, renderView, setRenderView, viewOffsets, zoom } from '../core/view';
import { H, W } from '../config/map';
import { terrainCanvas, terrainPadding, terrainSmoothCanvas } from '../map/terrain';
import { localTeam, placement, selected, selectedFortress, state } from '../core/game';
import { dragSelect } from '../ui/input';
import { BUILDING_TYPES, MINE_TYPES } from '../config/balance';
import { isTeamAreaExplored, teamCanSee } from '../sim/fog';
import { fortressGunPosition } from '../map/bases';
import { drawTerritory } from './territory';
import { drawFallenUnit, drawUnit, drawUnitHealthBar, drawUnitSelection, flushMapLabels, mapText, queueMapLabel, teamPalette, unitTargetHeight } from './units';
import { MAP_LABEL_MIN_SCALE, drawBase, drawBuilding, drawMusterYard } from './buildings';
import { DECOR_LAYER_SCALE, decorLayerCanvas, drawDecor, drawTerrainDetail, rockDecor, shoreDecor, treeDecor, waterDecor } from './terrain';
import { drawFlag } from './flags';
import { drawFog, refreshFog } from './fog';
import { drawMinimap } from './minimap';
import { drawBridges, drawUnitPaths } from './paths';

export function draw(){
 const viewScale=zoom;
 const {x:offsetX,y:offsetY}=viewOffsets(viewScale);
 setRenderView({scale:viewScale,offsetX,offsetY});
 ctx.setTransform(1,0,0,1,0,0);
 ctx.clearRect(0,0,VIEW_W,VIEW_H);
// The orthographic viewport's matte uses the same dark tone as unexplored fog,
// so no green page/background corners appear around the square world.
ctx.fillStyle=THEME['ui-fog'];ctx.fillRect(0,0,VIEW_W,VIEW_H);
 ctx.save();
 ctx.translate(offsetX,offsetY);
 ctx.scale(viewScale,viewScale);

 // Precomputed 256 × 256 biome map with the requested area shares.
 ctx.drawImage(terrainSmoothCanvas,terrainPadding,terrainPadding,terrainCanvas.width,terrainCanvas.height,0,0,W,H);
 ctx.globalAlpha=.08;ctx.drawImage(terrainCanvas,0,0,W,H);ctx.globalAlpha=1;
 drawTerrainDetail(camX,camY,camX+VIEW_W/viewScale,camY+VIEW_H/viewScale);
 // Main road crossing meadow and ford, about 2–3 tiles wide.
 // Roads start off-map; clip them to the world so their ends do not poke out past the fog into the margin.
 ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();ctx.lineCap='round';ctx.lineJoin='round';
 ctx.beginPath();ctx.moveTo(-80,H*.57);ctx.bezierCurveTo(W*.12,H*.52,W*.19,H*.67,W*.32,H*.58);ctx.bezierCurveTo(W*.43,H*.50,W*.49,H*.51,W*.57,H*.57);ctx.bezierCurveTo(W*.72,H*.67,W*.83,H*.47,W+80,H*.52);
 ctx.strokeStyle='#765f3d55';ctx.lineWidth=83;ctx.stroke();ctx.strokeStyle='#d3bd82';ctx.lineWidth=100;ctx.stroke();ctx.strokeStyle='#e4d29d';ctx.lineWidth=80;ctx.stroke();
 ctx.globalAlpha=.38;ctx.setLineDash([12,15]);ctx.strokeStyle='#a98d5a';ctx.lineWidth=2.5;ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;ctx.restore();
 // Secondary earth track softens the open approach lanes without crossing bases or unit paths.
 ctx.save();ctx.beginPath();ctx.moveTo(W*.18,H*.21);ctx.quadraticCurveTo(W*.30,H*.29,W*.38,H*.26);ctx.quadraticCurveTo(W*.52,H*.33,W*.64,H*.25);ctx.quadraticCurveTo(W*.73,H*.18,W*.82,H*.26);
 ctx.strokeStyle='#9a7d59aa';ctx.lineWidth=26;ctx.stroke();ctx.strokeStyle='#f0d9a3cc';ctx.lineWidth=18;ctx.stroke();ctx.restore(); // Once a mine is discovered, keep its location visible on explored terrain.
 // Unexplored mines remain hidden by fog; current vision is not required after discovery.
 // Territory layer: owner tint and borders (only where explored); toggled with T. Flags are drawn with the scene (drawFlag).
 refreshFog(localTeam()===0?state.fogSeen:state.enemyFogSeen);
 drawBridges(camX,camY,camX+VIEW_W/viewScale,camY+VIEW_H/viewScale);
 drawTerritory(camX,camY,camX+VIEW_W/viewScale,camY+VIEW_H/viewScale);
 // Everything below is culled to the camera (plus a margin that grows when zoomed out, where flags and labels get larger).
 const cullPad=Math.max(260,130/viewScale),leftWorld=camX-cullPad,topWorld=camY-cullPad,rightWorld=camX+VIEW_W/viewScale+cullPad,bottomWorld=camY+VIEW_H/viewScale+cullPad;
 const inView=o=>o.x>=leftWorld&&o.x<=rightWorld&&o.y>=topWorld&&o.y<=bottomWorld;
 for(const m of state.mines){
  if(!inView(m)||(!currentlyVisible(m.x,m.y)&&!isTeamAreaExplored(localTeam(),m.x,m.y)))continue;
  drawUprightAt(m.x,m.y,()=>{
  // Colorful collectible mine with stacked stones, gold crystals and a team-control ring.
  const mineTeam=m.owner===0?teamPalette(0):m.owner===1?teamPalette(1):null;
  ctx.fillStyle='#29472d40';ctx.beginPath();ctx.ellipse(m.x+3,m.y+15,35,17,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=mineTeam?mineTeam.glow+'55':'#d5e3bf';ctx.beginPath();ctx.ellipse(m.x,m.y+3,35,23,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#85978a';ctx.beginPath();ctx.moveTo(m.x-30,m.y+7);ctx.lineTo(m.x-24,m.y-12);ctx.lineTo(m.x-11,m.y-24);ctx.lineTo(m.x+7,m.y-25);ctx.lineTo(m.x+25,m.y-10);ctx.lineTo(m.x+31,m.y+7);ctx.lineTo(m.x+17,m.y+16);ctx.lineTo(m.x-19,m.y+16);ctx.closePath();ctx.fill();ctx.strokeStyle='#e0e9c9';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#bac9b0';ctx.beginPath();ctx.moveTo(m.x-20,m.y-11);ctx.lineTo(m.x-10,m.y-21);ctx.lineTo(m.x+4,m.y-21);ctx.lineTo(m.x-3,m.y-8);ctx.closePath();ctx.fill();
  const crystal=MINE_TYPES[m.resource].crystal;
  for(let i=0;i<5;i++){const cx=m.x-12+i*6,cy=m.y-6+(i%2)*6;ctx.fillStyle='#9a6d22';ctx.beginPath();ctx.moveTo(cx-3,cy+4);ctx.lineTo(cx-2,cy-3);ctx.lineTo(cx,cy-7);ctx.lineTo(cx+3,cy-2);ctx.lineTo(cx+3,cy+4);ctx.closePath();ctx.fill();ctx.fillStyle=crystal;ctx.beginPath();ctx.moveTo(cx-2,cy+3);ctx.lineTo(cx-1,cy-3);ctx.lineTo(cx,cy-6);ctx.lineTo(cx+2,cy-2);ctx.lineTo(cx+2,cy+3);ctx.closePath();ctx.fill();}
  // Label at least 12 px on screen in the owner's light colour (cream when neutral), queued above the scenery; hidden when
  // zoomed far out, where the flag label already names the region's resource.
  if(settings.mapLabels&&viewScale>=MAP_LABEL_MIN_SCALE){const text=(m.owner===0?'XANH · ':m.owner===1?'ĐỎ · ':'TRUNG LẬP · ')+MINE_TYPES[m.resource].label+' +'+Math.round(m.income*60)+'/PHÚT';queueMapLabel(m.x,m.y,()=>mapText(text,m.x,m.y+34,11,800,m.owner>=0?TEAM_COLORS[m.owner].light:THEME['text-main']));}
  });
 }
 // Show friendly integrated cannon coverage while the unified fortress is selected.
 for(const base of state.bases){if(base.team!==localTeam()||selectedFortress!==base)continue;for(let index=0;index<(base.guns||[]).length;index++){
  if(!base.guns[index].active)continue;const pos=fortressGunPosition(base,index);ctx.save();ctx.beginPath();ctx.arc(pos.x,pos.y,190,0,Math.PI*2);ctx.fillStyle='rgba(76,166,255,0.08)';ctx.fill();ctx.strokeStyle='rgba(106,190,255,0.58)';ctx.lineWidth=2;ctx.setLineDash([9,6]);ctx.stroke();ctx.setLineDash([]);ctx.restore();
 }}
 // Depth-sort decorative scenery and game actors on world Y so units can pass in front of or behind trees.
 const sceneActors=[],enqueue=(y,draw)=>sceneActors.push({y,draw});
 // Zoomed far out (below DECOR_LAYER_SCALE) scenery comes from one cached layer; closer in, each item is depth-sorted
 // with units so they can walk in front of or behind trees.
 if(viewScale<DECOR_LAYER_SCALE)ctx.drawImage(decorLayerCanvas(),0,0,W,H);
 else{
  for(const lily of waterDecor)if(inView(lily))drawDecor(lily);
  for(const item of treeDecor)if(inView(item))enqueue(item.y,()=>drawDecor(item));
  for(const item of rockDecor)if(inView(item))enqueue(item.y+(item.kind==='stone'?4:18),()=>drawDecor(item));
  for(const item of shoreDecor)if(inView(item))enqueue(item.y,()=>drawDecor(item));
 }
 for(const b of state.bases){if(!inView(b)||(b.team!==localTeam()&&!currentlyVisible(b.x,b.y)))continue;drawMusterYard(b);enqueue(b.y+106,()=>drawBase(b));}
 for(const r of state.regions){if(!r.cp||!inView(r.cp)||!isTeamAreaExplored(localTeam(),r.cp.x,r.cp.y))continue;enqueue(r.cp.y+8,()=>drawFlag(r));}
 for(const b of state.buildings){if(!inView(b)||(b.team!==localTeam()&&!currentlyVisible(b.x,b.y)))continue;enqueue(b.y+BUILDING_TYPES[b.kind].halfH*.7,()=>drawBuilding(b));}
 for(const g of state.guards){if(g.hp<=0||!currentlyVisible(g.x,g.y))continue;enqueue(g.y+9,()=>drawUprightAt(g.x,g.y,()=>{ctx.fillStyle='#24412f45';ctx.beginPath();ctx.ellipse(g.x+2,g.y+8,14,7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#7d4ba9';ctx.beginPath();ctx.arc(g.x,g.y,11,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#eed8ff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#f9ecff';ctx.beginPath();ctx.arc(g.x-3,g.y-2,2.2,0,Math.PI*2);ctx.arc(g.x+3,g.y-2,2.2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#26152f';ctx.fillRect(g.x-11,g.y-16,22,4);ctx.fillStyle='#ef5350';ctx.fillRect(g.x-10,g.y-15,20*Math.max(0,g.hp/g.max),2);}));}
 // Fallen units lie in the depth-sorted scene (enemy ones only where the local side sees).
 for(const e of state.effects)if(e.kind==='fall'&&inView(e)&&(e.team===localTeam()||currentlyVisible(e.x,e.y)))enqueue(e.y,()=>drawFallenUnit(e));
 for(const u of state.units){if(!inView(u)||(u.team!==localTeam()&&!currentlyVisible(u.x,u.y)))continue;enqueue(u.y+unitTargetHeight(u.type)*.48,()=>drawUnit(u));}
 sceneActors.sort((a,b)=>a.y-b.y);for(const actor of sceneActors)actor.draw();
 // Labels and building health bars queued during the scene, above every sprite.
 flushMapLabels();
 // Health bars are a separate foreground UI layer so canopies never obscure unit status.
 // Which bars show follows the hpBars setting: always, only for hurt units, or only for selected ones.
 const barShown=u=>settings.hpBars==='always'||(settings.hpBars==='damaged'?u.hp<u.max:(selected===u||u.selected));
 for(const u of state.units)if(u.hp>0&&inView(u)&&barShown(u)&&(u.team===localTeam()||currentlyVisible(u.x,u.y)))drawUnitHealthBar(u);
 // Selection rings remain legible above canopy sprites, while the actor itself still respects Y-depth.
 for(const u of state.units)if((selected===u||u.selected)&&inView(u)&&(u.team===localTeam()||currentlyVisible(u.x,u.y)))drawUnitSelection(u);
 // Projectiles and effects stay on their own foreground layer.
 for(const b of state.bullets){if(!inView(b))continue;drawUprightAt(b.x,b.y,()=>{ctx.strokeStyle=b.team===0?'#a8e2ff':'#ffadb0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-5,b.y+3);ctx.stroke();});}
 for(const e of state.effects){if(e.kind||!inView(e))continue;drawUprightAt(e.x,e.y,()=>{ctx.globalAlpha=Math.max(0,e.life/e.max);ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,12+(1-e.life/e.max)*10,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;});}
 // Fog of war overlay: unexplored tiles are veiled (drawFog); explored terrain stays visible.
 drawFog();
 drawTerritory(camX,camY,camX+VIEW_W/viewScale,camY+VIEW_H/viewScale,'over');
 // Route lines of the selected units go above the fog so a march into unexplored ground stays visible.
 if(settings.unitPaths)drawUnitPaths();
 // Keep placement feedback readable even when the cursor crosses unexplored fog.
 if(placement)drawBuilding({kind:placement.kind,x:placement.x,y:placement.y,team:localTeam(),previewValid:placement.valid},true);
 // Hide enemy forces and enemy structures when their location is not currently visible.
 function currentlyVisible(x,y){return teamCanSee(localTeam(),x,y);}
 // Return to screen coordinates for selection feedback and fixed viewport labels.
 ctx.restore();
 if(dragSelect){const x=Math.min(dragSelect.x,dragSelect.cx),y=Math.min(dragSelect.y,dragSelect.cy),w=Math.abs(dragSelect.cx-dragSelect.x),h=Math.abs(dragSelect.cy-dragSelect.y);ctx.fillStyle='#69b9ff22';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#8bd0ff';ctx.setLineDash([6,4]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);}
 if(placement){const valid=placement.valid,color=valid?'#47b96c':'#d84c58',name=BUILDING_TYPES[placement.kind].name.toUpperCase(),text=valid?name+' · VỊ TRÍ HỢP LỆ':name+' · '+(placement.problem||'VỊ TRÍ BỊ CHẶN');ctx.save();ctx.font='700 13px system-ui';const w=Math.min(VIEW_W-32,Math.max(280,ctx.measureText(text+'  ·  Trái: đặt  |  Phải / Esc: hủy').width+28)),x=(VIEW_W-w)/2,y=Math.round(VIEW_H*.14);ctx.fillStyle='#101b25eF';ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,w,30,8);ctx.fill();ctx.stroke();ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText(text+'  ·  Trái: đặt  |  Phải / Esc: hủy',VIEW_W/2,y+15,w-18);ctx.restore();}
 drawMinimap();
 updateSoundscape();
}
