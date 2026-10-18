// @ts-nocheck
// Target selection and damage (docs/features/combat.md).
import { dist, gameTime, mode, selected, setSelected, state } from '../core/game';
import { UNIT_ANIM } from '../config/visuals';
import { finish } from '../core/match';
import { aiCanSee, teamCanSee } from './fog';
import { destroyBuilding } from './buildings';

export function nearestEnemy(u){
 let best=null,bd=Infinity;
 for(const v of state.units){
  if(v.team===u.team)continue;
  // AI may only acquire a new target if its own vision currently reveals it.
  if((mode==='pvp'&&!teamCanSee(u.team,v.x,v.y))||(mode==='ai'&&u.team===1&&!aiCanSee(v.x,v.y)))continue;
  let d=dist(u,v);if(d<bd){bd=d;best=v;}
 }
 const base=state.bases[1-u.team];
 if((mode==='ai'&&u.team===0)||teamCanSee(u.team,base.x,base.y)){let db=Math.hypot(base.x-u.x,base.y-u.y);if(!best||db<bd-20){best=base;bd=db;}}
 // Enemy buildings (farms, outposts, towers) are targets for both sides when seen.
 for(const b of state.buildings){if(b.team===u.team||b.hp<=0)continue;if(!((mode==='ai'&&u.team===0)||teamCanSee(u.team,b.x,b.y)))continue;let d=dist(u,b);if(d<bd-15){best=b;bd=d;}}
 return best;
}
export function unitTargetValid(t,u){return t&&t.hp>0&&((t.team!==undefined&&t.team!==u.team)||t.team===undefined);}
export function hurt(target,damage,team,attackerType=null){
 let finalDamage=damage;
 if(attackerType==='spearman'&&target?.type==='cavalry')finalDamage*=1.35;
 else if(attackerType==='cavalry'&&target?.type==='spearman')finalDamage*=0.9;
 target.hp-=finalDamage;state.effects.push({x:target.x,y:target.y,life:.18,max:.18,color:team===0?'#73c8ff':'#ff747a'});
 // Display only: hit flash on the unit, and a falling body when it dies (both travel in the snapshot to the guest).
 if(target.type)target.hitAt=gameTime;
 if(target.hp<=0){
  if(target===state.bases[0])finish(false);
  else if(target===state.bases[1])finish(true);
  else if(target.kind)destroyBuilding(target);
  else if(target.type){state.units=state.units.filter(u=>u!==target);if(selected===target)setSelected(null);state.effects.push({kind:'fall',type:target.type,team:target.team,facing:target.facing,x:target.x,y:target.y,life:UNIT_ANIM.fallSeconds,max:UNIT_ANIM.fallSeconds});}
 }
}
