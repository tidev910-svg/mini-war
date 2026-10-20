// @ts-nocheck
// Region flags with control ring and capture bar (docs/features/territory.md).
import { localTeam } from '../core/game';
import { garrisonOf } from '../sim/garrison';
import { ctx, drawUprightAt, zoom } from '../core/view';
import { TILE_SIZE } from '../config/map';
import { selectedFlag } from '../core/game';
import { FLAG_CAPTURE_RADIUS_TILES, FLAG_DECAY_DELAY_SECONDS } from '../config/balance';
import { FLAG_COLORS, FLAG_LABEL_MIN_PX, FLAG_MIN_SCREEN_ZOOM, FLAG_SHORT_LABEL_ZOOM, FLAG_RING_PX, RESOURCE_ICONS, TERRITORY_COLORS, TERRITORY_GLOW, TERRITORY_GLOW_PX } from '../config/visuals';
import { regionLabel } from '../map/regions';
import { TEAM_COLORS, THEME } from '../config/theme';
import { captureStage } from '../sim/territory';

export function flagScale(){return Math.max(1,FLAG_MIN_SCREEN_ZOOM/zoom);}
export function flagHit(r,x,y){const s=flagScale();return Math.abs(x-r.cp.x)<=60*s&&y>=r.cp.y-190*s&&y<=r.cp.y+30*s;}
export function drawFlag(r){
 const {x,y}=r.cp,s=flagScale(),c=FLAG_COLORS[r.owner]||FLAG_COLORS.neutral,selectedHere=selectedFlag===r.id;
 drawUprightAt(x,y,()=>{
  ctx.save();
  // Glowing control ring at the capture radius in the holder's colour (always drawn), pulsing gently.
  {const R=FLAG_CAPTURE_RADIUS_TILES*TILE_SIZE,glow=TERRITORY_GLOW[r.owner>=0?r.owner:'neutral'],line=TERRITORY_COLORS[r.owner>=0?r.owner:'neutral'],pulse=.75+.25*Math.sin(performance.now()/450+r.id);
   ctx.beginPath();ctx.arc(x,y,R,0,Math.PI*2);ctx.globalAlpha=pulse;ctx.strokeStyle=glow;ctx.lineWidth=(FLAG_RING_PX+2*TERRITORY_GLOW_PX+2)/zoom;ctx.stroke();
   ctx.globalAlpha=1;ctx.strokeStyle=line;ctx.lineWidth=FLAG_RING_PX/zoom;ctx.globalAlpha=.55+.3*pulse;ctx.stroke();ctx.globalAlpha=1;}
  // Capture range highlight: shown while the flag is selected or being captured.
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
  // Two short lines: owner and region, then the capture status; both shortened when zoomed far out (FLAG_SHORT_LABEL_ZOOM).
  const short=zoom<FLAG_SHORT_LABEL_ZOOM,owner=r.owner===0?'XANH':r.owner===1?'ĐỎ':'TRUNG LẬP',pct=Math.round(r.cap*100)+'%';
  const status=r.contested?'TRANH CHẤP':r.cap<=0?'':short?pct:(stage===1?'GĐ 1/2 · HẠ CỜ '+pct:stage===2?'GĐ 2/2 · CHIẾM '+pct:'ĐANG CHIẾM '+pct)+(r.idle>=FLAG_DECAY_DELAY_SECONDS?' · ĐANG GIẢM':'');
  const name=(short?'':'CỜ '+owner+' · ')+regionLabel(r).toUpperCase();
  // Text keeps at least FLAG_LABEL_MIN_PX on screen; colours from the design tokens.
  const fs=Math.max(13,FLAG_LABEL_MIN_PX/(s*zoom));
  ctx.font=`900 ${fs}px ${THEME['font-ui']}`;ctx.textBaseline='alphabetic';ctx.lineJoin='round';ctx.lineWidth=fs*.3;ctx.strokeStyle=THEME['text-on-map-stroke'];ctx.fillStyle=r.owner>=0?TEAM_COLORS[r.owner].light:THEME['text-main'];
  // Garrison count (sim/garrison.ts): only on the local side's own flags, never shown to the enemy.
  const inside=r.owner===localTeam()?garrisonOf(r).length:0,guard=inside?(short?'🛡 '+inside:'ĐỒN TRÚ '+inside+' QUÂN'):'';
  for(const [text,ty] of [[name,40+fs*1.1],[status,40+fs*2.3],[guard,40+fs*(status?3.5:2.3)]])if(text){ctx.strokeText(text,0,ty);ctx.fillText(text,0,ty);}
  if(selectedHere){ctx.strokeStyle='#fff4a8';ctx.lineWidth=3;ctx.setLineDash([8,5]);ctx.beginPath();ctx.ellipse(0,0,66,26,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();
 });
}
