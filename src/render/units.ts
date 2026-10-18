// @ts-nocheck
// Unit drawing, health bars, selection rings (docs/features/rendering.md).
import { ctx, drawUprightAt, renderView } from '../core/view';
import { MAP_UI, TEAM_COLORS, THEME, hexA, healthColor } from '../config/theme';
import { TILE_SIZE } from '../config/map';
import { normalizeUnitType } from '../core/game';
import { specs } from '../config/balance';
import { SPEARMAN_DIRECTIONS, SPEARMAN_ROWS, archerClips, archerSpriteSheet, cavalryClips, cavalrySpriteSheet, infantryClips, infantrySpriteSheet, scoutClips, scoutFootAnchors, scoutSpriteSheet, spearmanClips, spearmanSpriteSheet } from './sprites';

export function roundRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
// Unit health bar in the side's light colour (who is who matters more than how hurt in a melee).
export function bar(x,y,w,h,hp,max,team){
 ctx.fillStyle=THEME['text-on-map-stroke'];ctx.fillRect(x,y,w,h);ctx.fillStyle=TEAM_COLORS[team]?.light||THEME.success;ctx.fillRect(x+1,y+1,(w-2)*Math.max(0,hp/max),h-2);ctx.strokeStyle=hexA(THEME['text-main'],.4);ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);
}
// Building / fortress health bar: MAP_UI.healthBarPx tall on screen, dark rim, --success → --danger with the damage.
export function healthBar(cx,y,w,hp,max){
 const s=renderView.scale||1,h=Math.max(6,MAP_UI.healthBarPx/s),rim=Math.max(1.5,1.5/s),f=Math.max(0,Math.min(1,hp/max));
 ctx.fillStyle=THEME['text-on-map-stroke'];ctx.fillRect(cx-w/2-rim,y-rim,w+rim*2,h+rim*2);
 ctx.fillStyle=hexA(THEME['ui-bg-panel'],.9);ctx.fillRect(cx-w/2,y,w,h);
 ctx.fillStyle=healthColor(f);ctx.fillRect(cx-w/2,y,w*f,h);
 return h+rim;
}
// Map text at least MAP_UI.labelMinPx on screen, outlined in --text-on-map-stroke so it reads on any ground.
export function mapFontPx(worldPx){return Math.max(worldPx,MAP_UI.labelMinPx/(renderView.scale||1));}
export function mapText(text,x,y,worldPx,weight=800,color=THEME['text-main']){
 const fs=mapFontPx(worldPx);ctx.font=`${weight} ${fs}px ${THEME['font-ui']}`;ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.lineJoin='round';ctx.lineWidth=fs*.28;ctx.strokeStyle=THEME['text-on-map-stroke'];ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);
 return fs;
}
// Name on a small swallowtail banner in the side's colour (fortress label).
export function mapBanner(text,x,y,worldPx,team){
 const fs=mapFontPx(worldPx);ctx.font=`700 ${fs}px ${THEME['font-title']}`;ctx.textAlign='center';ctx.textBaseline='middle';
 const w=ctx.measureText(text).width+fs*1.6,h=fs*1.55,notch=fs*.5,x0=x-w/2,y0=y-h/2,c=TEAM_COLORS[team]||TEAM_COLORS[0];
 ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x0+w,y0);ctx.lineTo(x0+w-notch,y);ctx.lineTo(x0+w,y0+h);ctx.lineTo(x0,y0+h);ctx.lineTo(x0+notch,y);ctx.closePath();
 ctx.fillStyle=c.primary;ctx.fill();ctx.lineWidth=Math.max(1,1.2/(renderView.scale||1));ctx.strokeStyle=THEME['gold-muted'];ctx.stroke();
 ctx.fillStyle=THEME['text-main'];ctx.fillText(text,x,y+fs*.04);
}
export function teamPalette(team){
 return team===0?{main:'#3b8f7d',light:'#dcf5d0',deep:'#1d5861',shadow:'#123a40',trim:'#f7d587',glow:'#74d5bb'}:{main:'#bc5c4b',light:'#f7d8b5',deep:'#6f2f2a',shadow:'#432126',trim:'#efd7a8',glow:'#f39b65'};
}
export function pill(x,y,w,h,r,fill,stroke,line=2){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}}
export function zoomLerp(a,b,t){return a+(b-a)*Math.max(0,Math.min(1,t));}
export function unitTargetHeight(type){
 const tileHeight={scout:1.3,infantry:1.3,archer:1.3,spearman:1.55,cavalry:1.65}[normalizeUnitType(type)]||1.3;
 return TILE_SIZE*tileHeight;
}
export function unitHitRadius(u){return Math.max((specs[u.type]?.r||8)*2+9,unitTargetHeight(u.type)*.65);}
export function drawUnit(u){return drawUprightAt(u.x,u.y,()=>{
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
export function drawUnitHealthBar(u){
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
export function drawUnitSelection(u){const r=(specs[u.type]?.r||9)*2;ctx.strokeStyle='#fff4a8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(u.x,u.y,r+7,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff4a8';ctx.beginPath();ctx.arc(u.x,u.y+r+9,3,0,Math.PI*2);ctx.fill();}
