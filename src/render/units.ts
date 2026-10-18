// @ts-nocheck
// Unit drawing, health bars, selection rings (docs/features/rendering.md).
import { ctx, drawUprightAt, renderView } from '../core/view';
import { MAP_UI, TEAM_COLORS, THEME, hexA, healthColor } from '../config/theme';
import { TILE_SIZE } from '../config/map';
import { normalizeUnitType } from '../core/game';
import { specs } from '../config/balance';
import { unitArtFrame } from './unitArt';
import { UNIT_ANIM } from '../config/visuals';

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
// Map labels and building health bars are queued while the depth-sorted scene is drawn and painted afterwards in one
// pass (flushMapLabels in draw.ts), so trees and other sprites further down the screen never cover them.
const mapLabels=[];
export function queueMapLabel(x,y,fn){mapLabels.push([x,y,fn]);}
export function flushMapLabels(){for(const [x,y,fn] of mapLabels)drawUprightAt(x,y,fn);mapLabels.length=0;}
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
// Code-drawn soldier (render/unitArt.ts): the view follows u.facing ('left' is the mirrored side view), the pose the walk
// clock (u.walk), u.moving and the attack timer (strike pose for UNIT_ANIM.strikeSeconds after each attack).
export function unitArtPose(u){
 const cd=specs[u.type]?.cooldown||1,since=cd-(u.attackTimer??-1);
 if(u.target&&since>=0&&since<UNIT_ANIM.strikeSeconds)return {pose:'strike',frame:0};
 if(u.moving)return {pose:'walk',frame:Math.floor((u.walk||0)*(u.type==='cavalry'?UNIT_ANIM.cavalryWalkFps:UNIT_ANIM.walkFps))%4};
 return {pose:'idle',frame:Math.floor((u.walk||0)*UNIT_ANIM.idleFps)%4};
}
export function drawUnit(u){return drawUprightAt(u.x,u.y,()=>{
 const type=normalizeUnitType(u.type),dir=u.facing||'down',view=dir==='left'||dir==='right'?'side':dir;
 const {pose,frame}=unitArtPose(u),f=unitArtFrame(type,u.team,view,pose,frame),k=unitTargetHeight(type)/f.figureH;
 ctx.save();ctx.translate(u.x,u.y);if(dir==='left')ctx.scale(-1,1);
 ctx.drawImage(f.canvas,-f.ax*k,-f.ay*k,f.w*k,f.h*k);
 ctx.restore();
});}
// Health bar just above the helmet, wider for cavalry.
export function drawUnitHealthBar(u){
 const type=normalizeUnitType(u.type),h=unitTargetHeight(type),w=type==='cavalry'?46:30;
 bar(u.x-w/2,u.y-h*1.08-8,w,6,u.hp,u.max,u.team);
}
export function drawUnitSelection(u){const r=(specs[u.type]?.r||9)*2;ctx.strokeStyle='#fff4a8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(u.x,u.y,r+7,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff4a8';ctx.beginPath();ctx.arc(u.x,u.y+r+9,3,0,Math.PI*2);ctx.fill();}
