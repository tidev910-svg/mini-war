// @ts-nocheck
// Frame composition: draw() calls every layer in order (docs/features/rendering.md).
import { VIEW_H, VIEW_W, camX, camY, ctx, drawUprightAt, renderView, setRenderView, viewOffsets, zoom } from '../core/view';
import { H, W } from '../config/map';
import { terrainCanvas, terrainPadding, terrainSmoothCanvas } from '../map/terrain';
import { localTeam, placement, selected, selectedFortress, state } from '../core/game';
import { dragSelect } from '../ui/input';
import { BUILDING_TYPES, MINE_TYPES } from '../config/balance';
import { isTeamAreaExplored, teamCanSee } from '../sim/fog';
import { fortressGunPosition } from '../map/bases';
import { drawTerritory } from './territory';
import { drawUnit, drawUnitHealthBar, drawUnitSelection, teamPalette, unitTargetHeight } from './units';
import { drawBase, drawBuilding, drawMusterYard } from './buildings';
import { drawRock, drawTerrainDetail, drawTree, rockDecor, treeDecor } from './terrain';
import { drawFlag } from './flags';
import { drawFog, refreshFog } from './fog';

export function draw(){
 const viewScale=zoom;
 const {x:offsetX,y:offsetY}=viewOffsets(viewScale);
 setRenderView({scale:viewScale,offsetX,offsetY});
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
 drawFog();
 drawTerritory(camX,camY,camX+VIEW_W/viewScale,camY+VIEW_H/viewScale,'over');
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
