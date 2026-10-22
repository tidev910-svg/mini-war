// @ts-nocheck
// Target selection and damage (docs/features/combat.md).
import { recordDamage, recordUnitDeath } from './stats';
import { dist, mode, nextFxId, selected, setSelected, state } from '../core/game';
import { BUILDING_TYPES, COUNTER_MULTIPLIERS, STRUCTURE_DAMAGE_MULTIPLIERS, specs } from '../config/balance';
import { TILE_SIZE } from '../config/map';
import { UNIT_ANIM } from '../config/visuals';
import { finish } from '../core/match';
import { aiCanSee, teamCanSee } from './fog';
import { destroyBuilding } from './buildings';

export function nearestEnemy(u){
 let best=null,bd=Infinity;
 for(const v of state.units){
  if(v.team===u.team)continue;
  // Every side, in every mode, only targets what it sees right now (fog-of-war.md; before 2026-10-22 the player's
  // units in the AI mode also locked on to enemies in the fog).
  if(v.garrison!=null||!teamCanSee(u.team,v.x,v.y))continue;
  let d=dist(u,v);if(d<bd){bd=d;best=v;}
 }
 const base=state.bases[1-u.team];
 if(base.hp>0&&teamCanSee(u.team,base.x,base.y)){let db=Math.hypot(base.x-u.x,base.y-u.y);if(!best||db<bd-20){best=base;bd=db;}}
 // Enemy buildings (farms, outposts, towers) are targets for both sides when seen.
 for(const b of state.buildings){if(b.team===u.team||b.hp<=0)continue;if(!teamCanSee(u.team,b.x,b.y))continue;let d=dist(u,b);if(d<bd-15){best=b;bd=d;}}
 return best;
}
// Distance (centre to centre) from which `u` can hit `target`. Units: own range + target body radius. Structures: own
// range + 35 (fortress) or + 10 (buildings), as before; melee units (range < MELEE_RANGE_MAX) instead reach from anywhere
// next to the footprint, since buildings block their tiles (pathfinding.md) and a melee unit can only stand at the edge.
export const MELEE_RANGE_MAX=60;
export function structureReach(t){const hw=t.w?t.w/2:BUILDING_TYPES[t.kind]?.halfW||0,hh=t.h?t.h/2:BUILDING_TYPES[t.kind]?.halfH||0;return Math.hypot(hw+TILE_SIZE*.75,hh+TILE_SIZE*.75)+TILE_SIZE*.6;} // blocked tiles reach ≤ ¾ tile past the footprint
export function attackRange(u,target){
 const s=specs[u.type];if(target.type)return s.range+specs[target.type].r;
 const base=s.range+(target.w?35:10);return s.range<MELEE_RANGE_MAX?Math.max(base,structureReach(target)):base;
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
 recordDamage(team,Math.min(finalDamage,Math.max(0,target.hp)));
 target.hp-=finalDamage;state.effects.push({id:nextFxId(),src:attackerType||'gun',x:target.x,y:target.y,life:.18,max:.18,color:team===0?'#73c8ff':'#ff747a'});
 // Display only: a dying unit leaves a falling body (travels in the snapshot to the guest).
 if(target.hp<=0){
  if(target===state.bases[0])finish(false);
  else if(target===state.bases[1])finish(true);
  else if(target.kind)destroyBuilding(target);
  else if(target.type){recordUnitDeath(target.team,team);state.units=state.units.filter(u=>u!==target);if(selected===target)setSelected(null);state.effects.push({id:nextFxId(),kind:'fall',type:target.type,team:target.team,facing:target.facing,x:target.x,y:target.y,life:UNIT_ANIM.fallSeconds,max:UNIT_ANIM.fallSeconds});}
 }
}
