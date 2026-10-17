// @ts-nocheck
// Trees, rocks, grass and terrain detail (docs/features/rendering.md).
import { ctx, drawUprightAt } from '../core/view';
import { H, MAP_TILES, TILE_SIZE, W, forestRegions, rockRegions } from '../config/map';
import { terrainType } from '../map/terrain';
import { state } from '../core/game';

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
export function drawTree(x,y,scale=1,variant=0){const sprite=pineSprites[((variant%5)+5)%5],width=74*scale,height=105*scale;return drawUprightAt(x,y,()=>ctx.drawImage(sprite,x-width/2,y-height,width,height));}
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
export function drawRock(x,y,scale=1){const width=190*scale,height=136*scale;return drawUprightAt(x,y,()=>ctx.drawImage(rockClusterSprite,x-width/2,y-height*.88,width,height));}
export const treeDecor=[],rockDecor=[];
export function decorRandom(seed){const v=Math.sin((seed+19)*127.1+(seed+73)*311.7)*43758.5453;return v-Math.floor(v);}
export function buildWorldDecor(){
 treeDecor.length=0;rockDecor.length=0;
 const keepClear=(x,y)=>state.bases.some(b=>Math.hypot(x-b.x,y-b.y)<Math.max(b.w||0,b.h||0)*.50+150)||state.mines.some(m=>Math.hypot(x-m.x,y-m.y)<95);
 const roadBuffer=(x,y)=>{
  const mainRoadY=H*0.55;
  const roadCenterX=W*0.5,roadHalfWidth=W*0.38;
  return Math.abs(y-mainRoadY)<32 && Math.abs(x-roadCenterX)<roadHalfWidth;
 };
 const distanceFromBase=(x,y)=>Math.min(...state.bases.map(b=>Math.hypot(x-b.x,y-b.y)));
 for(let team=0;team<state.bases.length;team++){
  const base=state.bases[team];
  for(let i=0;i<2;i++){
   const seed=91000+team*100+i*13,angle=(i-1)*.62-Math.PI/2,radius=108+decorRandom(seed)*10,x=base.x+Math.cos(angle)*radius,y=base.y+Math.sin(angle)*radius;
   if(roadBuffer(x,y))continue;
   treeDecor.push({x,y,scale:.8+decorRandom(seed+1)*.18,variant:(i+team*2)%5});
  }
 }
 for(let region=0;region<forestRegions.length;region++){
  const [cx,cy,rx,ry]=forestRegions[region];
  const clusterCount=1+Math.floor(decorRandom(region*97)*2);
  for(let cluster=0;cluster<clusterCount;cluster++){
   const seed=region*1000+cluster*17,clusterCenterX=cx+(decorRandom(seed)-.5)*.12,clusterCenterY=cy+(decorRandom(seed+1)-.5)*.12;
   const treeCount=3+Math.floor(decorRandom(seed+2)*5);
   for(let i=0;i<treeCount;i++){
    const angle=decorRandom(seed+3+i*5)*Math.PI*2,spread=Math.sqrt(decorRandom(seed+4+i*7))*0.7;
    const gx=Math.round((clusterCenterX+Math.cos(angle)*rx*spread)*MAP_TILES),gy=Math.round((clusterCenterY+Math.sin(angle)*ry*spread)*MAP_TILES);
    if(gx<1||gy<1||gx>=MAP_TILES-1||gy>=MAP_TILES-1)continue;
    const tile=gy*MAP_TILES+gx;
    if(terrainType[tile]!==1)continue;
    const x=(gx+.5)*TILE_SIZE,y=(gy+.5)*TILE_SIZE;
    if(keepClear(x,y)||roadBuffer(x,y)||distanceFromBase(x,y)<160)continue;
    const minTreeSpacing=58;
    let tooClose=false;
    for(const tree of treeDecor){if(Math.hypot(tree.x-x,tree.y-y)<minTreeSpacing){tooClose=true;break;}}
    if(tooClose)continue;
    treeDecor.push({x,y,scale:.68+decorRandom(seed+5+i*11)*.5,variant:Math.floor(decorRandom(seed+6+i*13)*5)});
   }
  }
 }
 for(let region=0;region<rockRegions.length;region++){
  const [cx,cy,rx,ry]=rockRegions[region];
  for(let i=0;i<3;i++){
   const seed=70000+region*100+i*11,angle=decorRandom(seed)*Math.PI*2,radius=decorRandom(seed+1)*.60;
   let gx=Math.round((cx+Math.cos(angle)*rx*radius)*MAP_TILES),gy=Math.round((cy+Math.sin(angle)*ry*radius)*MAP_TILES);
   if(gx<2||gy<2||gx>=MAP_TILES-2||gy>=MAP_TILES-2)continue;
   if(terrainType[gy*MAP_TILES+gx]!==3){
    let nearest=null,best=Infinity;
    for(let oy=-5;oy<=5;oy++)for(let ox=-5;ox<=5;ox++){const tx=gx+ox,ty=gy+oy;if(tx<0||ty<0||tx>=MAP_TILES||ty>=MAP_TILES||terrainType[ty*MAP_TILES+tx]!==3)continue;const d=ox*ox+oy*oy;if(d<best){best=d;nearest=[tx,ty];}}
    if(!nearest)continue;[gx,gy]=nearest;
   }
   const x=(gx+.5)*TILE_SIZE,y=(gy+.5)*TILE_SIZE;if(keepClear(x,y)||roadBuffer(x,y))continue;
   rockDecor.push({x,y,scale:.56+decorRandom(seed+2)*.55});
  }
 }
}
export function drawGrassPatch(x,y,rx,ry,color){
 ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
}
export function drawTerrainDetail(){
 const cols=MAP_TILES,rows=MAP_TILES;
 const microDetails=[];
 for(let i=0;i<8200;i++){
  const seed=i*97.3+19.7;
  const x=(seed % (cols*3)) * (TILE_SIZE * 0.42) + ((i % 7) * 8);
  const y=((seed * 1.63) % (rows*3)) * (TILE_SIZE * 0.42) + ((i % 11) * 6);
  const tx=Math.min(cols-1,Math.max(0,Math.floor(x/TILE_SIZE)));const ty=Math.min(rows-1,Math.max(0,Math.floor(y/TILE_SIZE)));
  const tileType=terrainType[ty*cols+tx];
  if(tileType===2)continue;
  const worldX=(tx+.5)*TILE_SIZE + (i%5-2)*2.2;
  const worldY=(ty+.5)*TILE_SIZE + (i%7-3)*2.7;
  if(tileType===1){
   const patchColors=['#8bc96b','#a5d67d','#6ea75d','#788f5b'];
   microDetails.push({x:worldX,y:worldY,rx:5+(i%4)*1.6,ry:3.1+(i%3)*1.1,color:patchColors[i%patchColors.length]+'99',shadow:'#dfeeb8'+'6f',shadowX:2.2,shadowY:-2.1,shadowRx:3.2,shadowRy:1.5,angle:(i%9)*0.35});
  }else if(tileType===3){
   const stoneColors=['#928873','#7b715f','#b3a28c','#a08974'];
   microDetails.push({x:worldX,y:worldY,rx:4.8+(i%3)*1.5,ry:3.3+(i%2)*1.2,color:stoneColors[i%stoneColors.length]+'8a',shadow:'#d9d0be'+'55',shadowX:-2.4,shadowY:1.8,shadowRx:2.8,shadowRy:1.7,angle:(i%7)*0.24});
  }else if(tileType===4){
   microDetails.push({x:worldX,y:worldY,rx:4.4,ry:2.8,color:'#f3d45d'+'7d',shadow:'#e9c867'+'88',shadowX:2.6,shadowY:-1.8,shadowRx:2.7,shadowRy:1.8,angle:(i%5)*0.33});
  }else{
   const verdant=['#8ccf72','#79b95d','#9cd67d','#a9d86d'];
   microDetails.push({x:worldX,y:worldY,rx:5.6+(i%4)*0.9,ry:3.1+(i%3)*0.9,color:verdant[i%verdant.length]+'70',shadow:'#dfeeb8'+'55',shadowX:1.8,shadowY:-1.6,shadowRx:2.9,shadowRy:1.2,angle:(i%9)*0.27});
  }
 }
 for(const item of microDetails){
  ctx.fillStyle=item.color;
  ctx.beginPath();ctx.ellipse(item.x,item.y,item.rx,item.ry,item.angle,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=item.shadow;
  ctx.beginPath();ctx.ellipse(item.x+item.shadowX,item.y+item.shadowY,item.shadowRx,item.shadowRy,item.angle*0.8,0,Math.PI*2);ctx.fill();
 }
}
