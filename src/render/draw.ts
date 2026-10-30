// @ts-nocheck
// Frame composition: draw() calls every layer in order (docs/features/rendering.md).
import { CAMP_TYPES, CREEP_TYPES } from '../config/creeps';
import { campKnownState } from '../sim/creeps';
import { drawBuffAuras, drawCampSite, drawCreep, drawCreepBar, drawCreepFall, updateCampNotices } from './creeps';
import { drawFx, drawGroundFx, drawProjectiles, updateFx } from './fx';
import { ghostBases, ghostBuildings, knownFlag, knownMine, updateIntel } from './intel';
import { TEAM_COLORS, THEME } from '../config/theme';
import { settings } from '../core/settings';
import { updateSoundscape } from '../audio/sound';
import { VIEW_H, VIEW_W, camX, camY, ctx, drawUprightAt, renderView, setRenderView, viewOffsets, zoom } from '../core/view';
import { H, W } from '../config/map';
import { terrainCanvas, terrainPadding, terrainSmoothCanvas } from '../map/terrain';
import { drawMapClouds } from './settlements';
import { drawObstacles } from './obstacles';
import { localTeam, placement, selected, selectedFortress, state } from '../core/game';
import { dragSelect } from '../ui/input';
import { BUILDING_TYPES, MINE_TYPES } from '../config/balance';
import { isTeamAreaExplored, teamCanSee } from '../sim/fog';
import { fortressGunPosition } from '../map/bases';
import { drawTerritory } from './territory';
import { drawFallenUnit, drawUnit, drawUnitHealthBar, drawUnitSelection, flushMapLabels, mapText, queueMapLabel, showFallenBody, teamPalette, unitTargetHeight } from './units';
import { MAP_LABEL_MIN_SCALE, drawBase, drawBuilding, drawMusterYard } from './buildings';
import { DECOR_LAYER_SCALE, decorLayerCanvas, drawDecor, drawRealmLabels, drawTerrainDetail, groundDecor, rockDecor, shoreDecor, treeDecor, waterDecor } from './terrain';
import { drawFlag } from './flags';
import { drawFog, refreshFog } from './fog';
import { drawMinimap } from './minimap';
import { drawBridges, drawUnitPaths } from './paths';

// Cached sea outside the square world. It is screen-space decoration only: the
// map, terrain data, camera and pathfinding remain in their existing world space.
let seaMatte=null,seaMatteW=0,seaMatteH=0;
function drawSeaMatte(){
 if(!seaMatte||seaMatte.width!==VIEW_W||seaMatte.height!==VIEW_H){
  seaMatte=document.createElement('canvas');seaMatte.width=VIEW_W;seaMatte.height=VIEW_H;seaMatteW=VIEW_W;seaMatteH=VIEW_H;
  const water=seaMatte.getContext('2d'),g=water.createLinearGradient(0,0,VIEW_W,VIEW_H);
  g.addColorStop(0,'#285e70');g.addColorStop(.48,'#347789');g.addColorStop(1,'#214f62');water.fillStyle=g;water.fillRect(0,0,VIEW_W,VIEW_H);
  // Broad low-contrast ripples echo the game's painted water without a tiled seam.
  water.lineCap='round';
  for(let y=20,row=0;y<VIEW_H+40;y+=42,row++){
   for(let x=(row%2)*35-60;x<VIEW_W+90;x+=118){
    const length=42+((row*17+x*3)%37),rise=((row*13+x)%17)-8;
    water.beginPath();water.moveTo(x,y);water.bezierCurveTo(x+length*.28,y-5+rise*.15,x+length*.68,y+5+rise*.15,x+length,y+rise*.2);
    water.strokeStyle=(row+x)%3===0?'rgba(142,196,196,.16)':'rgba(12,47,62,.13)';water.lineWidth=(row%4===0)?2:1.2;water.stroke();
   }
  }
  // A few soft color currents keep the matte from reading as a flat UI panel.
  for(const [x,y,r,color] of [[.2,.3,.32,'rgba(90,158,166,.09)'],[.78,.68,.38,'rgba(12,54,70,.10)'],[.52,.08,.25,'rgba(115,174,177,.07)']]){
   const cx=VIEW_W*x,cy=VIEW_H*y,rad=Math.max(VIEW_W,VIEW_H)*r,glow=water.createRadialGradient(cx,cy,0,cx,cy,rad);glow.addColorStop(0,color);glow.addColorStop(1,'rgba(20,68,82,0)');water.fillStyle=glow;water.fillRect(cx-rad,cy-rad,rad*2,rad*2);
  }
 }
 ctx.drawImage(seaMatte,0,0,seaMatteW,seaMatteH);
}

export function draw(){
 const viewScale=zoom;
 const {x:offsetX,y:offsetY}=viewOffsets(viewScale);
 setRenderView({scale:viewScale,offsetX,offsetY});
 ctx.setTransform(1,0,0,1,0,0);
 ctx.clearRect(0,0,VIEW_W,VIEW_H);
// Fill the viewport with water first; the square world and its Fog of War are
// drawn above it, so only the area beyond the map's edges shows this sea.
drawSeaMatte();
 ctx.save();
 ctx.translate(offsetX,offsetY);
 ctx.scale(viewScale,viewScale);

 // Precomputed 256 × 256 biome map with the requested area shares.
 ctx.drawImage(terrainSmoothCanvas,terrainPadding,terrainPadding,terrainCanvas.width,terrainCanvas.height,0,0,W,H);
 ctx.globalAlpha=.08;ctx.drawImage(terrainCanvas,0,0,W,H);ctx.globalAlpha=1;
 drawTerrainDetail(camX,camY,camX+VIEW_W/viewScale,camY+VIEW_H/viewScale);
 // Rock as crisp cliffs and water with a foam shoreline, so impassable ground reads at a glance (render/obstacles.ts).
 drawObstacles(camX,camY,camX+VIEW_W/viewScale,camY+VIEW_H/viewScale);
 // Once a mine is discovered, keep its location visible on explored terrain.
 // Unexplored mines remain hidden by fog; current vision is not required after discovery.
 // Territory layer: owner tint and borders (only where explored); toggled with T. Flags are drawn with the scene (drawFlag).
 updateIntel(); // what the local side last saw in the veil (render/intel.ts)
 refreshFog(localTeam()===0?state.fogSeen:state.enemyFogSeen);
 drawBridges(camX,camY,camX+VIEW_W/viewScale,camY+VIEW_H/viewScale);
 drawTerritory(camX,camY,camX+VIEW_W/viewScale,camY+VIEW_H/viewScale);
 // Everything below is culled to the camera (plus a margin that grows when zoomed out, where flags and labels get larger).
 const cullPad=Math.max(260,130/viewScale),leftWorld=camX-cullPad,topWorld=camY-cullPad,rightWorld=camX+VIEW_W/viewScale+cullPad,bottomWorld=camY+VIEW_H/viewScale+cullPad;
 const inView=o=>o.x>=leftWorld&&o.x<=rightWorld&&o.y>=topWorld&&o.y<=bottomWorld;
  updateFx(inView);
 for(let mi=0;mi<state.mines.length;mi++){const m=knownMine(state.mines[mi],mi);
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
  if(settings.mapLabels&&viewScale>=MAP_LABEL_MIN_SCALE){const text=(m.owner===0?'XANH · ':m.owner===1?'ĐỎ · ':'TRUNG LẬP · ')+MINE_TYPES[m.resource].label+(m.rich?' GIÀU':'')+' +'+Math.round(m.income*60)+'/PHÚT';queueMapLabel(m.x,m.y,()=>mapText(text,m.x,m.y+34,11,800,m.owner>=0?TEAM_COLORS[m.owner].light:THEME['text-main']));}
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
  for(const item of groundDecor)if(inView(item))drawDecor(item);
  for(const item of treeDecor)if(inView(item))enqueue(item.y,()=>drawDecor(item));
  for(const item of rockDecor)if(inView(item))enqueue(item.y+(item.kind==='stone'?4:18),()=>drawDecor(item));
  for(const item of shoreDecor)if(inView(item))enqueue(item.y,()=>drawDecor(item));
 }
 for(const b of state.bases){if(!inView(b)||(b.team!==localTeam()&&!currentlyVisible(b.x,b.y)))continue;drawMusterYard(b);enqueue(b.y+106,()=>drawBase(b));}
 // Enemy fortress and buildings out of sight: drawn as last seen, under the veil.
 for(const b of ghostBases())if(inView(b)){drawMusterYard(b);enqueue(b.y+106,()=>drawBase(b));}
 for(const b of ghostBuildings())if(inView(b))enqueue(b.y+BUILDING_TYPES[b.kind].halfH*.7,()=>drawBuilding(b));
 for(const r of state.regions){if(!r.cp||!inView(r.cp)||!isTeamAreaExplored(localTeam(),r.cp.x,r.cp.y))continue;enqueue(r.cp.y+8,()=>drawFlag(knownFlag(r)));}
 for(const b of state.buildings){if(!inView(b)||(b.team!==localTeam()&&!currentlyVisible(b.x,b.y)))continue;enqueue(b.y+BUILDING_TYPES[b.kind].halfH*.7,()=>drawBuilding(b));}
 // Neutral camps as the local side knows them; monsters only where it sees (render/creeps.ts).
 for(const camp of state.camps||[]){if(!inView(camp))continue;const known=campKnownState(camp,localTeam());if(known==null||(!isTeamAreaExplored(localTeam(),camp.x,camp.y)&&!CAMP_TYPES[camp.kind].opensAt))continue;enqueue(camp.y-20,()=>drawCampSite(camp,known));}
 for(const c of state.creeps||[]){if(!inView(c)||!currentlyVisible(c.x,c.y))continue;enqueue(c.y+CREEP_TYPES[c.creep].r,()=>drawCreep(c));}
 for(const e of state.effects)if(e.kind==='creepFall'&&inView(e)&&currentlyVisible(e.x,e.y))enqueue(e.y,()=>drawCreepFall(e));
 // Fallen units lie in the depth-sorted scene (enemy ones only where the local side sees).
 for(const e of state.effects)if(e.kind==='fall'&&inView(e)&&(e.team===localTeam()||currentlyVisible(e.x,e.y))&&showFallenBody(e,state.units))enqueue(e.y,()=>drawFallenUnit(e));
 for(const u of state.units){if(!inView(u)||(u.team!==localTeam()&&!currentlyVisible(u.x,u.y)))continue;enqueue(u.y+unitTargetHeight(u.type)*.48,()=>drawUnit(u));}
 drawBuffAuras(inView);
 drawGroundFx(inView); // Ground effects stay under actors, selection rings and status UI.
 sceneActors.sort((a,b)=>a.y-b.y);for(const actor of sceneActors)actor.draw();
 // Labels and building health bars queued during the scene, above every sprite.
 flushMapLabels();
 // Health bars are a separate foreground UI layer so canopies never obscure unit status.
 // Which bars show follows the hpBars setting: always, only for hurt units, or only for selected ones.
 const barShown=u=>settings.hpBars==='always'||(settings.hpBars==='damaged'?u.hp<u.max:(selected===u||u.selected));
 for(const u of state.units)if(u.hp>0&&inView(u)&&barShown(u)&&(u.team===localTeam()||currentlyVisible(u.x,u.y)))drawUnitHealthBar(u);
 for(const c of state.creeps||[])if(inView(c)&&(settings.hpBars==='always'||c.hp<c.max)&&currentlyVisible(c.x,c.y))drawCreepBar(c);
 // Selection rings remain legible above canopy sprites, while the actor itself still respects Y-depth.
 for(const u of state.units)if((selected===u||u.selected)&&inView(u)&&(u.team===localTeam()||currentlyVisible(u.x,u.y)))drawUnitSelection(u);
 // Projectiles and effects stay on their own foreground layer.
 // Arrows, gun shots and particles (render/fx.ts); shots and particles in the fog are hidden by the veil drawn next.
 drawProjectiles(b=>inView(b)&&(b.team===localTeam()||currentlyVisible(b.x,b.y)));
 drawFx(inView);
 // Fog of war overlay: unexplored tiles are veiled (drawFog); explored terrain stays visible.
 drawFog();
 drawTerritory(camX,camY,camX+VIEW_W/viewScale,camY+VIEW_H/viewScale,'over');
 drawMapClouds();
 drawRealmLabels();
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
 updateCampNotices();
 updateSoundscape();
}
