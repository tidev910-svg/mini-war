// @ts-nocheck
// Fortress, muster yard, farms and other buildings (docs/features/rendering.md).
import { ctx, drawUprightAt, renderView } from '../core/view';
import { draggingFarm, selectedBuilding, selectedFortress } from '../core/game';
import { BUILDING_TYPES } from '../config/balance';
import { farmSprite, fortressSprite } from './sprites';
import { musterYard } from '../map/bases';
import { buildingDone, buildingName } from '../sim/buildings';
import { healthBar, mapBanner, mapText, teamPalette } from './units';
import { TEAM_COLORS } from '../config/theme';

// Building and muster-yard names are hidden when zoomed out this far (they would crowd the map at 12 px minimum).
const MAP_LABEL_MIN_SCALE=.28;
export function drawMusterYard(b){const yard=musterYard(b);drawUprightAt(yard.x,yard.y,()=>{ctx.save();ctx.fillStyle='#4f463738';ctx.beginPath();ctx.ellipse(yard.x+4,yard.y+8,yard.w*.52,yard.h*.52,-.08,0,Math.PI*2);ctx.fill();ctx.fillStyle=b.team===0?'#9c875c':'#826558';ctx.beginPath();ctx.ellipse(yard.x,yard.y,yard.w*.50,yard.h*.50,-.08,0,Math.PI*2);ctx.fill();ctx.strokeStyle=b.team===0?'#d0bd84':'#c89982';ctx.lineWidth=3;ctx.setLineDash([7,6]);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#554b3b66';ctx.lineWidth=5;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(yard.x-48,yard.y+i*28);ctx.quadraticCurveTo(yard.x,yard.y+i*28+5,yard.x+48,yard.y+i*28);ctx.stroke();}if(renderView.scale>=MAP_LABEL_MIN_SCALE)mapText('SÂN TẬP KẾT',yard.x,yard.y+yard.h*.36,15,900);ctx.restore();});}
export function drawBase(b){return drawUprightAt(b.x,b.y,()=>{
 const w=238,h=200,blue=b.team===0;ctx.save();
 if(fortressSprite.complete&&fortressSprite.naturalWidth)ctx.drawImage(fortressSprite,b.x-w/2,b.y-h+16,w,h);
 else {ctx.fillStyle='#8995a0';ctx.fillRect(b.x-w*.42,b.y-h*.62,w*.84,h*.62);ctx.fillStyle='#2c5e9b';ctx.fillRect(b.x-w*.25,b.y-h*.9,w*.5,h*.34);}
 if(!blue){ctx.fillStyle='#b92f48';ctx.beginPath();ctx.moveTo(b.x+3,b.y-116);ctx.lineTo(b.x+28,b.y-108);ctx.lineTo(b.x+3,b.y-97);ctx.closePath();ctx.fill();}
 if(selectedFortress===b){ctx.strokeStyle=blue?'#74c8ff':'#ff777f';ctx.lineWidth=4;ctx.setLineDash([10,5]);ctx.beginPath();ctx.ellipse(b.x,b.y+2,102,48,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
 const barH=healthBar(b.x,b.y+40,104,b.hp,b.max);mapBanner('PHÁO ĐÀI '+TEAM_COLORS[b.team].name.replace('QUÂN ',''),b.x,b.y+40+barH+Math.max(14,12/(renderView.scale||1)),14,b.team);ctx.restore();
});}
export function drawFarm(f,preview=false){return drawUprightAt(f.x,f.y,()=>{
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
export function drawBuildingOverlay(b,preview){
 const def=BUILDING_TYPES[b.kind],x=b.x,y=b.y,hw=def.halfW,hh=def.halfH;ctx.save();ctx.globalAlpha=1;
 if(preview){const color=b.previewValid?'#72f2a0':'#ff6875';ctx.fillStyle=b.previewValid?'#47df7a38':'#f23d4f42';ctx.fillRect(x-hw,y-hh,hw*2,hh*2);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.setLineDash([7,4]);ctx.strokeRect(x-hw,y-hh,hw*2,hh*2);ctx.setLineDash([]);ctx.restore();return;}
 const barW=Math.max(44,hw*2),barY=y+hh+6;
 const progressBar=(value,color)=>{ctx.fillStyle='#111827';ctx.fillRect(x-barW/2,barY,barW,6);ctx.fillStyle=color;ctx.fillRect(x-barW/2+1,barY+1,(barW-2)*Math.max(0,Math.min(1,value)),4);};
 if(b.waiting)progressBar(b.upgrade?b.upgrade.progress:b.progress,'#8a8f97');
 else if(!buildingDone(b))progressBar(b.progress,'#f0c24f');
 else if(b.upgrade)progressBar(b.upgrade.progress,'#8be0ff');
 else if(b.hp<b.max)healthBar(x,barY,barW,b.hp,b.max);
 if(selectedBuilding===b){ctx.strokeStyle=b.team===0?'#74c8ff':'#ff777f';ctx.lineWidth=3;ctx.setLineDash([8,5]);ctx.beginPath();ctx.ellipse(x,y+hh*.4,hw+14,hh*.75+10,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
 const label=(b.kind==='farm'?'NÔNG TRẠI'+(b.level>1?' CẤP '+b.level:''):buildingName(b).toUpperCase())+(b.waiting?' · CHỜ QUÂN XÂY':!buildingDone(b)?' · ĐANG XÂY':'');
 if(renderView.scale>=MAP_LABEL_MIN_SCALE)mapText(label,x,barY+20,11);
 ctx.restore();
}
export function drawBuilding(b,preview=false){
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
