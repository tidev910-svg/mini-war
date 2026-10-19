// @ts-nocheck
// Target selection and damage (docs/features/combat.md).
import { dist, mode, nextFxId, selected, setSelected, state } from '../core/game';
import { COUNTER_MULTIPLIERS, STRUCTURE_DAMAGE_MULTIPLIERS } from '../config/balance';
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
export function damageMultiplier(attackerType,target){
 if(!attackerType||!target)return 1;
 const structure=!!target.kind||state.bases.includes(target);
 if(structure)return STRUCTURE_DAMAGE_MULTIPLIERS[attackerType]??1;
 return COUNTER_MULTIPLIERS[attackerType]?.[target.type]??1;
}
export function hurt(target,damage,team,attackerType=null){
 // Combat V3.1: base damage × counter multiplier (unit targets) or × structure multiplier (buildings and fortresses).
 const finalDamage=damage*damageMultiplier(attackerType,target);
 target.hp-=finalDamage;state.effects.push({id:nextFxId(),src:attackerType||'gun',x:target.x,y:target.y,life:.18,max:.18,color:team===0?'#73c8ff':'#ff747a'});
 // Display only: a dying unit leaves a falling body (travels in the snapshot to the guest).
 if(target.hp<=0){
  if(target===state.bases[0])finish(false);
  else if(target===state.bases[1])finish(true);
  else if(target.kind)destroyBuilding(target);
  else if(target.type){state.units=state.units.filter(u=>u!==target);if(selected===target)setSelected(null);state.effects.push({id:nextFxId(),kind:'fall',type:target.type,team:target.team,facing:target.facing,x:target.x,y:target.y,life:UNIT_ANIM.fallSeconds,max:UNIT_ANIM.fallSeconds});}
 }
}
