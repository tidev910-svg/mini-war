// @ts-nocheck
// Food production, upkeep and supply shortage (docs/features/economy.md).
import { addLog, localTeam, state, teamResources } from '../core/game';
import { FARM_LEVELS, FOOD_REGION_FARM_BONUS, FORTRESS_INCOME_PER_MINUTE, SUPPLY_ATTACK_SPEED_FACTOR, SUPPLY_GRACE_SECONDS, SUPPLY_SPEED_FACTOR, specs } from '../config/balance';
import { regionAt } from '../map/regions';

// Food produced per minute: finished farms plus food mines in owned regions.
// A finished farm's output per minute, +FOOD_REGION_FARM_BONUS when it stands in a food region its team owns.
export function farmFoodPerMinute(b){if(b.progress<1)return 0;const r=regionAt(b.x,b.y),bonus=r&&r.resource==='food'&&r.owner===b.team;return FARM_LEVELS[b.level].food*(bonus?1+FOOD_REGION_FARM_BONUS:1);}
export function foodPerMinute(team){let total=state.bases.some(b=>b.team===team&&b.hp>0)?FORTRESS_INCOME_PER_MINUTE.food:0;for(const b of state.buildings)if(b.team===team&&b.kind==='farm')total+=farmFoodPerMinute(b);for(const m of state.mines)if(m.resource==='food'&&state.regions[m.regionId]?.owner===team)total+=m.income*60;return total;}
// Units inside a flag (state.garrisons, sim/garrison.ts) eat like everyone else.
export function upkeepPerMinute(team){let total=0;for(const u of state.units)if(u.team===team&&u.hp>0)total+=specs[u.type].upkeep;for(const u of state.garrisons||[])if(u.team===team&&u.hp>0)total+=specs[u.type].upkeep;return total;}
export function supplyFactor(team,kind){return state?.supply?.[team]?.status==='starving'?(kind==='speed'?SUPPLY_SPEED_FACTOR:SUPPLY_ATTACK_SPEED_FACTOR):1;}
// Called once per second per team. Shortage starts only when stored food cannot pay upkeep, and ends only
// when farms cover upkeep again (net >= 0), so the status cannot flicker around an empty granary.
export function updateSupply(team){
 const res=teamResources(team),supply=state.supply[team],due=upkeepPerMinute(team)/60,net=foodPerMinute(team)-upkeepPerMinute(team);
 const paid=res.food>=due;res.food=paid?res.food-due:0;
 const mine=team===localTeam();
 if(net>=0){if(supply.status!=='ok'&&mine)addLog('Đã đủ lúa nuôi quân: hết thiếu tiếp tế.');supply.status='ok';supply.grace=0;return;}
 if(supply.status==='ok'&&!paid){supply.status='warning';supply.grace=SUPPLY_GRACE_SECONDS;if(mine)addLog(`Kho lúa đã cạn! Sau ${SUPPLY_GRACE_SECONDS} giây quân sẽ bị chậm lại nếu không xây thêm nông trại.`,'danger');}
 else if(supply.status==='warning'){supply.grace-=1;if(supply.grace<=0){supply.status='starving';supply.grace=0;if(mine)addLog(`Quân thiếu tiếp tế: −${Math.round((1-SUPPLY_SPEED_FACTOR)*100)}% tốc độ di chuyển, −${Math.round((1-SUPPLY_ATTACK_SPEED_FACTOR)*100)}% tốc độ đánh.`,'danger');}}
}
