// @ts-nocheck
// Fortress geometry: facing, muster yard, gun positions, site checks (docs/features/fortress.md).
import { BASE_SITE_MIN_CLEAR, TILE_SIZE } from '../config/map';
import { tilePassable } from './terrain';

// Fortresses stand anywhere on the map; the muster yard and the forward gun face the enemy fortress (base.dir = ±1).
export function baseDir(base){return base.dir||(base.team===0?1:-1);}
export function fortressGunPosition(base,index){const forward=baseDir(base);return {x:base.x+forward*(index===0?82:-82),y:base.y};}
export function musterYard(base){const forward=baseDir(base);return {x:base.x+forward*((base.w||TILE_SIZE*5.5)/2+72),y:base.y,w:170,h:144};}
export function activeFortressGuns(base){return (base.guns||[]).filter(g=>g.active).length;}
export function baseSiteClear(base){
 const yard=musterYard(base),rects=[[base.x,base.y,base.w,base.h],[yard.x,yard.y,yard.w,yard.h]];let total=0,clear=0;
 for(const [cx,cy,w,h] of rects)for(let y=cy-h/2;y<=cy+h/2;y+=TILE_SIZE)for(let x=cx-w/2;x<=cx+w/2;x+=TILE_SIZE){total++;if(tilePassable(x,y))clear++;}
 return clear>=total*BASE_SITE_MIN_CLEAR;
}
export function stateBaseTooClose(x,y,blueBase,redBase){
 return [blueBase,redBase].some(b=>Math.hypot(x-b.x,y-b.y)<340);
}
