// @ts-nocheck
// Unit drawing, health bars, selection rings (docs/features/rendering.md).
import { ctx, drawUprightAt, renderView } from '../core/view';
import { MAP_UI, TEAM_COLORS, THEME, hexA, healthColor } from '../config/theme';
import { TILE_SIZE } from '../config/map';
import { gameTime, normalizeUnitType } from '../core/game';
import { specs } from '../config/balance';
import { DIR_VIEW, POSE_FRAMES, unitArtFrame } from './unitArt';
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
// Code-drawn soldier (render/unitArt.ts) in eight directions: u.facing picks the baked yaw (left-facing = mirrored).
// Pose priority: attack (windup just before a blow, then strike / follow-through / recover after it), hit flash, walk, idle.
export function unitArtPose(u){
 const A=UNIT_ANIM,cd=specs[u.type]?.cooldown||1,since=cd-(u.attackTimer??-1);
 if(u.engaged&&!u.moving){
  if(since>=0&&since<A.attackFrameSeconds*3)return {pose:'attack',frame:1+Math.floor(since/A.attackFrameSeconds)};
  if(u.attackTimer>0&&u.attackTimer<=A.windupSeconds)return {pose:'attack',frame:0};
 }
 if(u.hitAt!=null&&gameTime-u.hitAt>=0&&gameTime-u.hitAt<A.hurtSeconds)return {pose:'hurt',frame:0,tint:'hit'};
 if(u.moving)return {pose:'walk',frame:Math.floor((u.walk||0)*(u.type==='cavalry'?A.cavalryWalkFps:A.walkFps))%POSE_FRAMES.walk};
 return {pose:'idle',frame:Math.floor((u.walk||0)*A.idleFps)%POSE_FRAMES.idle};
}
function drawArt(x,y,type,team,facing,pose,frame,tint,extra){
 const [yaw,mirror]=DIR_VIEW[facing]||DIR_VIEW.down,f=unitArtFrame(type,team,yaw,pose,frame,tint),k=unitTargetHeight(type)/f.figureH;
 ctx.save();ctx.translate(x,y);if(extra)extra(mirror);if(mirror)ctx.scale(-1,1);
 ctx.drawImage(f.canvas,-f.ax*k,-f.ay*k,f.w*k,f.h*k);
 ctx.restore();
}
export function drawUnit(u){return drawUprightAt(u.x,u.y,()=>{
 const {pose,frame,tint}=unitArtPose(u);
 drawArt(u.x,u.y,normalizeUnitType(u.type),u.team,u.facing||'down',pose,frame,tint||'');
});}
// A unit that just died (effect kind 'fall'): flashes, topples backwards over the first third, then fades out.
export function drawFallenUnit(e){return drawUprightAt(e.x,e.y,()=>{
 const p=1-e.life/e.max,turn=Math.min(1,p/.35),alpha=p<.6?1:Math.max(0,1-(p-.6)/.4);
 ctx.save();ctx.globalAlpha=alpha;
 drawArt(e.x,e.y,normalizeUnitType(e.type),e.team,e.facing||'down','hurt',0,p<.12?'hit':'',mirror=>{const side=(DIR_VIEW[e.facing]||DIR_VIEW.down)[0]===90?-1:1;ctx.rotate(turn*Math.PI/2*side*(mirror?-1:1));});
 ctx.restore();
});}
// Health bar just above the helmet, wider for cavalry.
export function drawUnitHealthBar(u){
 const type=normalizeUnitType(u.type),h=unitTargetHeight(type),w=type==='cavalry'?46:30;
 bar(u.x-w/2,u.y-h*1.08-8,w,6,u.hp,u.max,u.team);
}
export function drawUnitSelection(u){const r=(specs[u.type]?.r||9)*2;ctx.strokeStyle='#fff4a8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(u.x,u.y,r+7,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#fff4a8';ctx.beginPath();ctx.arc(u.x,u.y+r+9,3,0,Math.PI*2);ctx.fill();}
