// @ts-nocheck
// Sprite sheets and animation clips (docs/assets.md, docs/features/rendering.md).

// Shared atlas: blue/red idle and walk clips occupy dedicated rows; later actions can add rows without changing simulation data.
export const infantrySpriteSheet=new Image();
infantrySpriteSheet.src=import.meta.env.BASE_URL+'assets/units/infantry/infantry-sheet.png';
export const infantryClips={blue:{idle:{row:0,frames:4,fps:1.25},walk:{row:1,frames:4,fps:7}},red:{idle:{row:2,frames:4,fps:1.25},walk:{row:3,frames:4,fps:7}}};
// Separate authored attack strips keep the established idle / walk atlas untouched.
export const infantryAttackSheets={blue:new Image(),red:new Image()};
infantryAttackSheets.blue.src=import.meta.env.BASE_URL+'assets/units/infantry/infantry-attack-directions-blue.png';
infantryAttackSheets.red.src=import.meta.env.BASE_URL+'assets/units/infantry/infantry-attack-directions-red.png';
// Four frame columns (wind-up, swing, impact, recovery) by four naturally drawn facing rows.
export const infantryAttackClip={frames:4,directions:4};
export const scoutSpriteSheet=new Image();
scoutSpriteSheet.src=import.meta.env.BASE_URL+'assets/units/scout/scout-sheet.png';
export const scoutClips={blue:{idle:{row:0,frames:4,fps:1.25},walk:{row:1,frames:4,fps:7}},red:{idle:{row:2,frames:4,fps:1.25},walk:{row:3,frames:4,fps:7}}};
// Per-cell alpha bounds from the atlas keep blue and red scouts grounded at the same world Y.
export const scoutFootAnchors=[[304,307,303,308],[294,297,297,298],[276,282,276,283],[267,270,269,270]].map(row=>row.map(bottom=>bottom/313.5));
export const cavalrySpriteSheet=new Image();
cavalrySpriteSheet.src=import.meta.env.BASE_URL+'assets/units/cavalry/cavalry-sheet.png';
export const cavalryClips={blue:{idle:{row:0,frames:3,fps:1},walk:{row:1,frames:4,fps:7}},red:{idle:{row:2,frames:3,fps:1},walk:{row:3,frames:4,fps:7}}};
export const archerSpriteSheet=new Image();
archerSpriteSheet.src=import.meta.env.BASE_URL+'assets/units/archer/archer-sheet-v2.png';
export const archerClips={blue:{idle:{row:0,frames:4,fps:1.25},walk:{row:1,frames:4,fps:7}},red:{idle:{row:2,frames:4,fps:1.25},walk:{row:3,frames:4,fps:7}}};
export const archerAttackSpriteSheets={blue:new Image(),red:new Image()};
archerAttackSpriteSheets.blue.src=import.meta.env.BASE_URL+'assets/units/archer/archer-attack-blue.png';
archerAttackSpriteSheets.red.src=import.meta.env.BASE_URL+'assets/units/archer/archer-attack-red.png';
// Four columns: aim, draw, release, recovery; rows: up, down, left, right for each team.
export const archerAttackClip={frames:4,directions:4};
// 16 rows: team*8 + direction*2 + (idle 0 | walk 1); built by tools/build_spearman_sheet.py.
export const spearmanSpriteSheet=new Image();
spearmanSpriteSheet.src=import.meta.env.BASE_URL+'assets/units/spearman/spearman-sheet.png';
export const SPEARMAN_DIRECTIONS=['down','left','up','right'],SPEARMAN_ROWS=16;
export const spearmanClips={idle:{frames:4,fps:1.25},walk:{frames:4,fps:7}};// The authored motion sheet includes four attack poses for each direction. Build this cached atlas once at image load;
// simulation, movement, selection and the idle/walk atlas remain untouched.
export const spearmanAttackSpriteSheet=document.createElement('canvas');
export const spearmanAttackClip={frames:4,directions:4};
const spearmanMotionSource=new Image();
spearmanMotionSource.onload=()=>buildSpearmanAttackAtlas();
spearmanMotionSource.src=import.meta.env.BASE_URL+'assets/units/spearman/spearman-motion-source.png';
function buildSpearmanAttackAtlas(){
 const CELL=256,HALF=72,FOOT=.90,centers=[153,240,325,413,509,596,680,765,849,932,1016,1098,1190,1280,1369,1455];
 const extract=(cx,y0,y1)=>{
  const w=HALF*2,h=y1-y0,window=document.createElement('canvas');window.width=w;window.height=h;
  const wc=window.getContext('2d',{willReadFrequently:true});wc.drawImage(spearmanMotionSource,cx-HALF,y0,w,h,0,0,w,h);
  const image=wc.getImageData(0,0,w,h),px=image.data,mask=new Uint8Array(w*h),keep=new Uint8Array(w*h),queue=new Int32Array(w*h);let tail=0;
  for(let i=0;i<w*h;i++)mask[i]=px[i*4+3]>200?1:0;
  for(let y=Math.floor(h*.45);y<Math.floor(h*.75);y++)for(let x=HALF-10;x<HALF+10;x++){const i=y*w+x;if(mask[i]&&!keep[i]){keep[i]=1;queue[tail++]=i;}}
  for(let head=0;head<tail;head++){const i=queue[head],x=i%w,y=(i/w)|0;for(const n of [x?i-1:-1,x+1<w?i+1:-1,y?i-w:-1,y+1<h?i+w:-1])if(n>=0&&mask[n]&&!keep[n]){keep[n]=1;queue[tail++]=n;}}
  for(let pass=0;pass<3;pass++){const grown=keep.slice();for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!keep[i])continue;if(x)grown[i-1]=1;if(x+1<w)grown[i+1]=1;if(y)grown[i-w]=1;if(y+1<h)grown[i+w]=1;}keep.set(grown);}
  let left=w,top=h,right=-1,bottom=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!keep[i])px[i*4+3]=0;if(px[i*4+3]>40){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
  const cut=document.createElement('canvas');cut.width=right-left+1;cut.height=bottom-top+1;const cc=cut.getContext('2d',{willReadFrequently:true});cc.putImageData(wc.createImageData(cut.width,cut.height),0,0);
  const cropped=cc.createImageData(cut.width,cut.height);for(let y=0;y<cut.height;y++){const from=((top+y)*w+left)*4;cropped.data.set(px.subarray(from,from+cut.width*4),y*cut.width*4);}cc.putImageData(cropped,0,0);
  let bodyTop=-1,feet=-1;const xs=[];const cd=cropped.data;for(let y=0;y<cut.height;y++){let count=0;for(let x=0;x<cut.width;x++)if(cd[(y*cut.width+x)*4+3]>40)count++;if(bodyTop<0&&count>18)bodyTop=y;if(count>0)feet=y;}
  for(let y=bodyTop+Math.floor((feet-bodyTop)/3);y<=feet;y++)for(let x=0;x<cut.width;x++)if(cd[(y*cut.width+x)*4+3]>40)xs.push(x);xs.sort((a,b)=>a-b);
  return {canvas:cut,top:bodyTop,bottom:feet,cx:xs[Math.floor(xs.length/2)]};
 };
 const heights=[];for(const [y0,y1] of [[95,318],[372,618]])for(const cx of centers){const f=extract(cx,y0,y1);heights.push(f.bottom-f.top);}
 heights.sort((a,b)=>a-b);const scale=.64*CELL/((heights[15]+heights[16])/2);
 const tintRed=canvas=>{const c=canvas.getContext('2d',{willReadFrequently:true}),im=c.getImageData(0,0,canvas.width,canvas.height),d=im.data;
  for(let i=0;i<d.length;i+=4){if(d[i+3]<16)continue;let r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min,h=0,s=max===0?0:delta/max;
   if(delta){if(max===r)h=60*((g-b)/delta%6);else if(max===g)h=60*((b-r)/delta+2);else h=60*((r-g)/delta+4);if(h<0)h+=360;}
   if(h<=195||h>=275||s<=.28)continue;const mix=Math.max(0,Math.min(1,(s-.28)/.15)),v=Math.min(1,max*.98),sat=Math.min(1,s*1.12+.05),ch=v*sat,x=ch*(1-Math.abs((359/60%2)-1)),m=v-ch;let rr=ch,gg=0,bb=x;
   d[i]=Math.round(255*(r*(1-mix)+(rr+m)*mix));d[i+1]=Math.round(255*(g*(1-mix)+(gg+m)*mix));d[i+2]=Math.round(255*(b*(1-mix)+(bb+m)*mix));
  }c.putImageData(im,0,0);};
 spearmanAttackSpriteSheet.width=CELL*4;spearmanAttackSpriteSheet.height=CELL*8;
 const atlas=spearmanAttackSpriteSheet.getContext('2d');atlas.imageSmoothingEnabled=true;atlas.imageSmoothingQuality='high';
 for(let team=0;team<2;team++)for(let dir=0;dir<4;dir++)for(let frame=0;frame<4;frame++){
  const sprite=extract(centers[dir*4+frame],666,920);if(team)tintRed(sprite.canvas);
  const cell=document.createElement('canvas');cell.width=CELL;cell.height=CELL;const c=cell.getContext('2d');c.fillStyle='rgba(20,14,8,.42)';c.filter='blur(5px)';c.beginPath();c.ellipse(CELL/2,CELL*FOOT, CELL*.20,9,0,0,Math.PI*2);c.fill();c.filter='none';
  const dw=sprite.canvas.width*scale,dh=sprite.canvas.height*scale,dx=CELL/2-sprite.cx*scale,dy=CELL*FOOT-sprite.bottom*scale;c.drawImage(sprite.canvas,dx,dy,dw,dh);atlas.drawImage(cell,frame*CELL,(team*4+dir)*CELL);
 }
}
export const farmSprite=new Image();
farmSprite.src=import.meta.env.BASE_URL+'assets/farmstead-v2.png';
export const fortressSprite=new Image();
fortressSprite.src=import.meta.env.BASE_URL+'assets/fortress-sprite.png';
// Low territory flag tower layers: platform and rotating ballista stay separate from the flag/UI.
export const flagTowerPlatformSprite=new Image();
flagTowerPlatformSprite.src=import.meta.env.BASE_URL+'assets/territory-flag-tower-platform.png';
export const flagBallistaSprite=new Image();
flagBallistaSprite.src=import.meta.env.BASE_URL+'assets/territory-flag-ballista.png';
const flagPlatformVariants={};
export function flagPlatformFor(owner){
 if(!flagTowerPlatformSprite.complete||!flagTowerPlatformSprite.naturalWidth)return flagTowerPlatformSprite;
 const key=owner===0?'blue':owner===1?'red':'neutral';if(flagPlatformVariants[key])return flagPlatformVariants[key];
 const target=key==='blue'?[63,155,240]:key==='red'?[224,72,79]:[169,147,96];
 const canvas=document.createElement('canvas');canvas.width=flagTowerPlatformSprite.naturalWidth;canvas.height=flagTowerPlatformSprite.naturalHeight;
 const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(flagTowerPlatformSprite,0,0);const img=c.getImageData(0,0,canvas.width,canvas.height),d=img.data;
 for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];if(d[i+3]<16||b<72||b<=r*1.28||b<=g*1.08)continue;
  const luma=(.2126*r+.7152*g+.0722*b)/255,scale=Math.min(1.45,Math.max(.35,luma/.52));d[i]=Math.min(255,target[0]*scale);d[i+1]=Math.min(255,target[1]*scale);d[i+2]=Math.min(255,target[2]*scale);
 }
 c.putImageData(img,0,0);return flagPlatformVariants[key]=canvas;
}
