// @ts-nocheck
// Trees, rocks, grass and terrain detail (docs/features/rendering.md).
import { ctx, drawUprightAt, renderView } from '../core/view';
import { H, MAP_TILES, TILE_SIZE, W } from '../config/map';
import { terrainType } from '../map/terrain';
import { state } from '../core/game';
import { musterYard } from '../map/bases';
import { bridgeTiles, buildWalkable } from '../map/paths';

export function makePineSprite(variant){
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
export const pineSprites=Array.from({length:5},(_,i)=>makePineSprite(i));
export function drawRockClusterSprite(){
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
export const rockClusterSprite=drawRockClusterSprite();
export const treeDecor=[],rockDecor=[],shoreDecor=[],waterDecor=[];
// Broadleaf (round-crowned) trees: a trunk under overlapping leaf blobs lit from the top left. Variant 2 is autumn-yellow.
export function makeBroadleafSprite(variant){
 const sprite=document.createElement('canvas');sprite.width=128;sprite.height=144;const c=sprite.getContext('2d');
 const palettes=[['#1f4a2a','#2f6a37','#4a8a45','#7cb35e','#b6d77c'],['#1d4432','#2b6044','#3f7f50','#69a35e','#a7cf7f'],['#4a4a1e','#7a6d25','#a8922f','#d0b347','#f1d97a']];
 const p=palettes[variant%palettes.length];
 c.fillStyle='#17251d55';c.beginPath();c.ellipse(64,130,40,11,0,0,Math.PI*2);c.fill();
 const trunk=c.createLinearGradient(56,0,72,0);trunk.addColorStop(0,'#4b3020');trunk.addColorStop(.5,'#8a5a33');trunk.addColorStop(1,'#3a291d');
 c.fillStyle=trunk;c.beginPath();c.moveTo(57,128);c.lineTo(60,84);c.lineTo(52,72);c.lineTo(58,70);c.lineTo(64,78);c.lineTo(71,68);c.lineTo(76,71);c.lineTo(68,86);c.lineTo(71,128);c.closePath();c.fill();
 const blobs=[[64,50,34],[40,62,24],[88,62,24],[52,36,22],[78,36,22],[64,74,22],[30,78,15],[98,78,15]];
 for(const [x,y,r] of blobs){c.fillStyle=p[0];c.beginPath();c.arc(x+3,y+4,r,0,Math.PI*2);c.fill();}
 for(const [x,y,r] of blobs){const g=c.createRadialGradient(x-r*.4,y-r*.45,r*.15,x,y,r);g.addColorStop(0,p[4]);g.addColorStop(.35,p[3]);g.addColorStop(.75,p[2]);g.addColorStop(1,p[1]);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
 for(let i=0;i<40;i++){const x=24+((i*37+variant*13)%80),y=18+((i*29+variant*7)%68),r=1.2+(i%3)*.5;c.fillStyle=i%3===0?p[4]+'cc':p[1]+'99';c.beginPath();c.ellipse(x,y,r*1.6,r,(i%5)*.4,0,Math.PI*2);c.fill();}
 return sprite;
}
export const broadleafSprites=Array.from({length:3},(_,i)=>makeBroadleafSprite(i));
// Low bushes for open grass and forest edges.
export function makeBushSprite(variant){
 const sprite=document.createElement('canvas');sprite.width=72;sprite.height=48;const c=sprite.getContext('2d');
 const p=variant?['#264f2c','#3c7a3d','#69a552','#a6d07a']:['#2d4a26','#4b7034','#7a9e46','#b9cf74'];
 c.fillStyle='#17251d50';c.beginPath();c.ellipse(36,41,28,6,0,0,Math.PI*2);c.fill();
 const blobs=[[22,30,12],[36,24,15],[51,30,12],[30,34,10],[44,35,10]];
 for(const [x,y,r] of blobs){const g=c.createRadialGradient(x-r*.4,y-r*.5,r*.1,x,y,r);g.addColorStop(0,p[3]);g.addColorStop(.45,p[2]);g.addColorStop(1,p[1]);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
 if(variant===1)for(let i=0;i<6;i++){c.fillStyle=i%2?'#f2d0e4':'#fff3b0';c.beginPath();c.arc(16+i*8,22+(i%3)*6,1.8,0,Math.PI*2);c.fill();}
 return sprite;
}
export const bushSprites=[makeBushSprite(0),makeBushSprite(1)];
// Small boulders (1–3 stones) in the same shading as the rock clusters.
export function makeStoneSprite(variant){
 const sprite=document.createElement('canvas');sprite.width=72;sprite.height=48;const c=sprite.getContext('2d');
 c.fillStyle='#1b241e4d';c.beginPath();c.ellipse(36,40,28,6,0,0,Math.PI*2);c.fill();
 const sets=[[[36,28,30,26]],[[28,30,26,22],[48,33,18,16]],[[22,33,18,16],[38,27,24,22],[54,35,14,12]]];
 for(const [cx,cy,w,h] of sets[variant%3]){
  c.beginPath();c.moveTo(cx-w*.5,cy+h*.3);c.lineTo(cx-w*.38,cy-h*.3);c.lineTo(cx-w*.05,cy-h*.5);c.lineTo(cx+w*.32,cy-h*.36);c.lineTo(cx+w*.5,cy+h*.08);c.lineTo(cx+w*.38,cy+h*.45);c.lineTo(cx-w*.2,cy+h*.5);c.closePath();
  const g=c.createLinearGradient(cx-w*.4,cy-h*.4,cx+w*.5,cy+h*.4);g.addColorStop(0,'#d6cfba');g.addColorStop(.4,'#999e93');g.addColorStop(1,'#46514b');c.fillStyle=g;c.fill();
  c.strokeStyle='#2c3531';c.lineWidth=1.4;c.stroke();
  c.fillStyle='#e4dcc7';c.beginPath();c.moveTo(cx-w*.38,cy-h*.3);c.lineTo(cx-w*.05,cy-h*.5);c.lineTo(cx+w*.1,cy-h*.2);c.lineTo(cx-w*.18,cy-h*.12);c.closePath();c.fill();
 }
 return sprite;
}
export const stoneSprites=Array.from({length:3},(_,i)=>makeStoneSprite(i));
// Reeds with cattail heads along the shore.
export function makeReedSprite(variant){
 const sprite=document.createElement('canvas');sprite.width=48;sprite.height=64;const c=sprite.getContext('2d');
 c.fillStyle='#1d3b3044';c.beginPath();c.ellipse(24,58,16,4,0,0,Math.PI*2);c.fill();
 for(let i=0;i<9;i++){
  const x=10+i*3.3+(variant?((i*7)%3)-1:0),h=30+((i*13+variant*5)%22),lean=((i*5)%7-3)*1.6;
  c.strokeStyle=i%3===0?'#4f7a3a':i%2?'#6f9a48':'#89b05a';c.lineWidth=1.8;c.beginPath();c.moveTo(x,58);c.quadraticCurveTo(x+lean*.5,58-h*.6,x+lean,58-h);c.stroke();
  if(i%3===1){c.fillStyle='#6b4528';c.beginPath();c.ellipse(x+lean,58-h+4,2.2,5,lean*.03,0,Math.PI*2);c.fill();}
 }
 return sprite;
}
export const reedSprites=[makeReedSprite(0),makeReedSprite(1)];
// Lily pads lying flat on lakes (drawn under every upright object).
export function makeLilySprite(variant){
 const sprite=document.createElement('canvas');sprite.width=56;sprite.height=32;const c=sprite.getContext('2d');
 const pads=[[18,17,10],[34,13,8],[39,23,7]];
 for(const [x,y,r] of pads){c.fillStyle='#2f6b3a';c.beginPath();c.ellipse(x,y,r,r*.62,0,.35,Math.PI*2-.05);c.lineTo(x,y);c.closePath();c.fill();c.fillStyle='#5f9e4c';c.beginPath();c.ellipse(x-1,y-1,r*.8,r*.48,0,.4,Math.PI*2-.1);c.lineTo(x-1,y-1);c.closePath();c.fill();}
 if(variant){c.fillStyle='#f6c6dc';for(let i=0;i<5;i++){const a=i/5*Math.PI*2;c.beginPath();c.ellipse(34+Math.cos(a)*2.6,12+Math.sin(a)*1.6,2.4,1.4,a,0,Math.PI*2);c.fill();}c.fillStyle='#ffe27a';c.beginPath();c.arc(34,12,1.4,0,Math.PI*2);c.fill();}
 return sprite;
}
export const lilySprites=[makeLilySprite(0),makeLilySprite(1)];
export function decorRandom(seed){const v=Math.sin((seed+19)*127.1+(seed+73)*311.7)*43758.5453;return v-Math.floor(v);}
// Scenery density (docs/features/rendering.md). Each pass walks the tile grid in steps of `step` tiles, jitters a point inside
// the cell and keeps it with probability `chance`; `gap` is the minimum distance to any scenery already placed.
export const DECOR_PASSES={
 forest:{step:2,chance:.3,coreBonus:.45,gap:34},grassTree:{step:4,chance:.05,gap:70},bush:{step:4,chance:.07,gap:40},
 rockCluster:{step:4,chance:.32,gap:115},rockStone:{step:2,chance:.16,gap:30},grassStone:{step:5,chance:.035,gap:40},
 reed:{step:1,chance:.2,gap:30},lily:{step:2,chance:.09,gap:34},
};
export function buildWorldDecor(){
 treeDecor.length=0;rockDecor.length=0;shoreDecor.length=0;waterDecor.length=0;
 buildWalkable();
 const yards=state.bases.map(musterYard);
 const keepClear=(x,y)=>state.bases.some(b=>Math.hypot(x-b.x,y-b.y)<Math.max(b.w||0,b.h||0)*.50+150)
  ||yards.some(r=>Math.abs(x-r.x)<r.w/2+40&&Math.abs(y-r.y)<r.h/2+40)
  ||state.mines.some(m=>Math.hypot(x-m.x,y-m.y)<95)
  ||state.regions.some(r=>r.cp&&Math.hypot(x-r.cp.x,y-r.cp.y)<120);
 const roadBuffer=(x,y)=>{
  const mainRoadY=H*0.55;
  const roadCenterX=W*0.5,roadHalfWidth=W*0.38;
  return Math.abs(y-mainRoadY)<32 && Math.abs(x-roadCenterX)<roadHalfWidth;
 };
 // Spatial hash of everything placed so far, for the minimum gaps.
 const CELL=128,hash=new Map(),key=(cx,cy)=>cx*4096+cy;
 const free=(x,y,gap)=>{const cx=Math.floor(x/CELL),cy=Math.floor(y/CELL),r=Math.ceil(gap/CELL);for(let ox=-r;ox<=r;ox++)for(let oy=-r;oy<=r;oy++){const list=hash.get(key(cx+ox,cy+oy));if(list)for(const p of list)if(Math.hypot(p.x-x,p.y-y)<gap)return false;}return true;};
 const add=(list,item)=>{list.push(item);const k=key(Math.floor(item.x/CELL),Math.floor(item.y/CELL));if(!hash.has(k))hash.set(k,[]);hash.get(k).push(item);return item;};
 const typeAt=(gx,gy)=>gx<0||gy<0||gx>=MAP_TILES||gy>=MAP_TILES?-1:terrainType[gy*MAP_TILES+gx];
 const nearWater=(gx,gy)=>{for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)if(typeAt(gx+ox,gy+oy)===2)return true;return false;};
 // Share of the 5×5 neighbourhood that is forest: deep forest grows denser.
 const forestDepth=(gx,gy)=>{let n=0;for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++)if(typeAt(gx+ox,gy+oy)===1)n++;return n/25;};
 // Walks the grid for one pass; `pick(gx, gy, x, y, roll, seed)` places an item or not.
 const walk=(pass,salt,pick)=>{const {step}=DECOR_PASSES[pass];for(let gy=1;gy<MAP_TILES-1;gy+=step)for(let gx=1;gx<MAP_TILES-1;gx+=step){
  const seed=salt+gy*MAP_TILES+gx,tx=Math.min(MAP_TILES-2,gx+Math.floor(decorRandom(seed)*step)),ty=Math.min(MAP_TILES-2,gy+Math.floor(decorRandom(seed+7)*step));
  const x=(tx+decorRandom(seed+11))*TILE_SIZE,y=(ty+decorRandom(seed+13))*TILE_SIZE;
  pick(tx,ty,x,y,decorRandom(seed+17),seed);
 }};
 const ok=(x,y,gap)=>!keepClear(x,y)&&!roadBuffer(x,y)&&free(x,y,gap);
 // Two trees framing each fortress.
 for(let team=0;team<state.bases.length;team++){
  const base=state.bases[team];
  for(let i=0;i<2;i++){
   const seed=91000+team*100+i*13,angle=(i-1)*.62-Math.PI/2,radius=108+decorRandom(seed)*10,x=base.x+Math.cos(angle)*radius,y=base.y+Math.sin(angle)*radius;
   if(roadBuffer(x,y))continue;
   add(treeDecor,{x,y,scale:.8+decorRandom(seed+1)*.18,variant:(i+team*2)%5,kind:'pine'});
  }
 }
 // Forest: dense pines with some broadleaf trees; bushes at the thin edges.
 const P=DECOR_PASSES;
 walk('forest',100000,(gx,gy,x,y,roll,seed)=>{
  if(typeAt(gx,gy)!==1)return;const depth=forestDepth(gx,gy);
  if(roll>P.forest.chance+P.forest.coreBonus*depth||!ok(x,y,P.forest.gap))return;
  const r=decorRandom(seed+23),kind=depth<.45&&r<.25?'bush':r<.78?'pine':'broadleaf';
  add(treeDecor,{x,y,scale:(kind==='bush'?.8:.68)+decorRandom(seed+29)*.5,variant:Math.floor(decorRandom(seed+31)*5),kind});
 });
 // Open grass: lone trees and bushes (not on shores or fields).
 walk('grassTree',300000,(gx,gy,x,y,roll,seed)=>{
  if(typeAt(gx,gy)!==0||nearWater(gx,gy)||roll>P.grassTree.chance||!ok(x,y,P.grassTree.gap))return;
  add(treeDecor,{x,y,scale:.7+decorRandom(seed+29)*.45,variant:Math.floor(decorRandom(seed+31)*5),kind:decorRandom(seed+23)<.6?'broadleaf':'pine'});
 });
 walk('bush',400000,(gx,gy,x,y,roll,seed)=>{
  if(typeAt(gx,gy)!==0||roll>P.bush.chance||!ok(x,y,P.bush.gap))return;
  add(treeDecor,{x,y,scale:.75+decorRandom(seed+29)*.5,variant:Math.floor(decorRandom(seed+31)*2),kind:'bush'});
 });
 // Rock fields: big clusters first, then loose stones; a few stones on open grass.
 walk('rockCluster',500000,(gx,gy,x,y,roll,seed)=>{
  if(typeAt(gx,gy)!==3||roll>P.rockCluster.chance||!ok(x,y,P.rockCluster.gap))return;
  add(rockDecor,{x,y,scale:.56+decorRandom(seed+29)*.55,variant:0,kind:'cluster'});
 });
 walk('rockStone',600000,(gx,gy,x,y,roll,seed)=>{
  if(typeAt(gx,gy)!==3||roll>P.rockStone.chance||!ok(x,y,P.rockStone.gap))return;
  add(rockDecor,{x,y,scale:.7+decorRandom(seed+29)*.6,variant:Math.floor(decorRandom(seed+31)*3),kind:'stone'});
 });
 walk('grassStone',700000,(gx,gy,x,y,roll,seed)=>{
  if(typeAt(gx,gy)!==0||roll>P.grassStone.chance||!ok(x,y,P.grassStone.gap))return;
  add(rockDecor,{x,y,scale:.55+decorRandom(seed+29)*.4,variant:Math.floor(decorRandom(seed+31)*3),kind:'stone'});
 });
 // Water: reeds on shore tiles, lily pads on water away from the bank.
 walk('reed',800000,(gx,gy,x,y,roll,seed)=>{
  const t=typeAt(gx,gy);if((t!==0&&t!==1)||!nearWater(gx,gy)||roll>P.reed.chance||!ok(x,y,P.reed.gap))return;
  add(shoreDecor,{x,y,scale:.8+decorRandom(seed+29)*.5,variant:Math.floor(decorRandom(seed+31)*2),kind:'reed'});
 });
 walk('lily',900000,(gx,gy,x,y,roll,seed)=>{
  if(typeAt(gx,gy)!==2||bridgeTiles[gy*MAP_TILES+gx]||[[1,0],[-1,0],[0,1],[0,-1]].some(([ox,oy])=>typeAt(gx+ox,gy+oy)!==2)||roll>P.lily.chance||!free(x,y,P.lily.gap))return;
  add(waterDecor,{x,y,scale:.8+decorRandom(seed+29)*.5,variant:decorRandom(seed+31)<.3?1:0,kind:'lily'});
 });
 decorVersion++;
}
// Sprite and rectangle (world units) for one scenery item; shared by the per-item draw and the zoomed-out layer.
// kind: pine (5 variants), broadleaf (3), bush (2), cluster, stone (3), reed (2), lily (2).
export function decorSprite(item){
 const s=item.scale||1,v=item.variant||0,x=item.x,y=item.y;
 switch(item.kind){
  case 'broadleaf':return {img:broadleafSprites[v%broadleafSprites.length],x:x-42*s,y:y-94*s,w:84*s,h:94*s};
  case 'bush':return {img:bushSprites[v%bushSprites.length],x:x-23*s,y:y-31*s*.86,w:46*s,h:31*s};
  case 'cluster':return {img:rockClusterSprite,x:x-95*s,y:y-136*s*.88,w:190*s,h:136*s};
  case 'stone':return {img:stoneSprites[v%stoneSprites.length],x:x-23*s,y:y-31*s*.84,w:46*s,h:31*s};
  case 'reed':return {img:reedSprites[v%reedSprites.length],x:x-22*s,y:y-58*s*.9,w:44*s,h:58*s};
  case 'lily':return {img:lilySprites[v%lilySprites.length],x:x-28*s,y:y-16*s,w:56*s,h:32*s};
  default:return {img:pineSprites[((v%5)+5)%5],x:x-37*s,y:y-105*s,w:74*s,h:105*s};
 }
}
export function drawDecor(item){const r=decorSprite(item);if(item.kind==='lily'){ctx.drawImage(r.img,r.x,r.y,r.w,r.h);return;}drawUprightAt(item.x,item.y,()=>ctx.drawImage(r.img,r.x,r.y,r.w,r.h));}
// Zoomed far out, every tree and rock is painted once into one map-sized layer (DECOR_LAYER_SCALE px per world unit),
// rebuilt only when buildWorldDecor() runs, so draw() blits one image instead of ~2,000 sprites.
export const DECOR_LAYER_SCALE=.2;
let decorLayer=null,decorVersion=0,decorLayerVersion=-1;
export function decorLayerCanvas(){
 if(decorLayerVersion===decorVersion&&decorLayer)return decorLayer;
 decorLayer??=document.createElement('canvas');decorLayer.width=Math.round(W*DECOR_LAYER_SCALE);decorLayer.height=Math.round(H*DECOR_LAYER_SCALE);
 const c=decorLayer.getContext('2d');c.clearRect(0,0,decorLayer.width,decorLayer.height);c.save();c.scale(DECOR_LAYER_SCALE,DECOR_LAYER_SCALE);
 for(const item of [...waterDecor,...[...treeDecor,...rockDecor].sort((a,b)=>a.y-b.y)]){const r=decorSprite(item);c.drawImage(r.img,r.x,r.y,r.w,r.h);}
 c.restore();decorLayerVersion=decorVersion;return decorLayer;
}
export function drawGrassPatch(x,y,rx,ry,color){
 ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
}
// Ground speckles (grass tufts, pebbles, sand grains): ~8,000 items, each a coloured ellipse plus a small highlight.
// The terrain never changes during a session, so they are generated once and bucketed by tile row; each frame only the
// rows and columns inside the camera are drawn, one path per colour (a fill per colour instead of one per ellipse).
// Zoomed out below DETAIL_LAYER_SCALE the speckles are a pixel or two wide, so a pre-rendered layer is blitted instead.
export const DETAIL_LAYER_SCALE=.3,DETAIL_LAYER_RES=.25;
let detailRows=null,detailLayer=null;
function buildTerrainDetail(){
 const cols=MAP_TILES,rows=MAP_TILES;detailRows=Array.from({length:rows},()=>[]);
 for(let i=0;i<8200;i++){
  const seed=i*97.3+19.7;
  const x=(seed % (cols*3)) * (TILE_SIZE * 0.42) + ((i % 7) * 8);
  const y=((seed * 1.63) % (rows*3)) * (TILE_SIZE * 0.42) + ((i % 11) * 6);
  const tx=Math.min(cols-1,Math.max(0,Math.floor(x/TILE_SIZE)));const ty=Math.min(rows-1,Math.max(0,Math.floor(y/TILE_SIZE)));
  const tileType=terrainType[ty*cols+tx];
  if(tileType===2)continue;
  const worldX=(tx+.5)*TILE_SIZE + (i%5-2)*2.2;
  const worldY=(ty+.5)*TILE_SIZE + (i%7-3)*2.7;
  let d;
  if(tileType===1){
   const patchColors=['#8bc96b','#a5d67d','#6ea75d','#788f5b'];
   d={rx:5+(i%4)*1.6,ry:3.1+(i%3)*1.1,color:patchColors[i%patchColors.length]+'99',shadow:'#dfeeb8'+'6f',shadowX:2.2,shadowY:-2.1,shadowRx:3.2,shadowRy:1.5,angle:(i%9)*0.35};
  }else if(tileType===3){
   const stoneColors=['#928873','#7b715f','#b3a28c','#a08974'];
   d={rx:4.8+(i%3)*1.5,ry:3.3+(i%2)*1.2,color:stoneColors[i%stoneColors.length]+'8a',shadow:'#d9d0be'+'55',shadowX:-2.4,shadowY:1.8,shadowRx:2.8,shadowRy:1.7,angle:(i%7)*0.24};
  }else if(tileType===4){
   d={rx:4.4,ry:2.8,color:'#f3d45d'+'7d',shadow:'#e9c867'+'88',shadowX:2.6,shadowY:-1.8,shadowRx:2.7,shadowRy:1.8,angle:(i%5)*0.33};
  }else{
   const verdant=['#8ccf72','#79b95d','#9cd67d','#a9d86d'];
   d={rx:5.6+(i%4)*0.9,ry:3.1+(i%3)*0.9,color:verdant[i%verdant.length]+'70',shadow:'#dfeeb8'+'55',shadowX:1.8,shadowY:-1.6,shadowRx:2.9,shadowRy:1.2,angle:(i%9)*0.27};
  }
  d.x=worldX;d.y=worldY;detailRows[ty].push(d);
 }
}
// Paints the speckles of tile rows ty0..ty1 whose x lies in [x0, x1] into context c: one path and one fill per colour,
// base speckles first, then their highlights on top.
function paintTerrainDetail(c,ty0,ty1,x0,x1){
 const base=new Map(),high=new Map(),push=(m,k,d)=>{const l=m.get(k);if(l)l.push(d);else m.set(k,[d]);};
 for(let ty=ty0;ty<=ty1;ty++)for(const d of detailRows[ty])if(d.x>=x0&&d.x<=x1){push(base,d.color,d);push(high,d.shadow,d);}
 for(const [color,list] of base){c.fillStyle=color;c.beginPath();for(const d of list){c.moveTo(d.x+d.rx,d.y);c.ellipse(d.x,d.y,d.rx,d.ry,d.angle,0,Math.PI*2);}c.fill();}
 for(const [color,list] of high){
  c.fillStyle=color;c.beginPath();
  for(const d of list){const sx=d.x+d.shadowX,sy=d.y+d.shadowY;c.moveTo(sx+d.shadowRx,sy);c.ellipse(sx,sy,d.shadowRx,d.shadowRy,d.angle*0.8,0,Math.PI*2);}
  c.fill();
 }
}
function terrainDetailLayer(){
 if(detailLayer)return detailLayer;
 detailLayer=document.createElement('canvas');detailLayer.width=Math.round(W*DETAIL_LAYER_RES);detailLayer.height=Math.round(H*DETAIL_LAYER_RES);
 const c=detailLayer.getContext('2d');c.scale(DETAIL_LAYER_RES,DETAIL_LAYER_RES);paintTerrainDetail(c,0,MAP_TILES-1,-Infinity,Infinity);
 return detailLayer;
}
export function drawTerrainDetail(viewLeft=0,viewTop=0,viewRight=W,viewBottom=H){
 if(!detailRows)buildTerrainDetail();
 if((renderView.scale||1)<DETAIL_LAYER_SCALE){ctx.drawImage(terrainDetailLayer(),0,0,W,H);return;}
 const pad=12,ty0=Math.max(0,Math.floor((viewTop-pad)/TILE_SIZE)),ty1=Math.min(MAP_TILES-1,Math.floor((viewBottom+pad)/TILE_SIZE));
 paintTerrainDetail(ctx,ty0,ty1,viewLeft-pad,viewRight+pad);
}
