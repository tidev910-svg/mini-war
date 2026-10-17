// @ts-nocheck
// HUD and side panel: resources, unit counts, training queue line, territory toggle (docs/features/hud-ui.md).
import { gameApp, syncWorldMetrics, toggleSideHud } from '../core/view';
import { $, costText, ended, formatAmount, gameTime, localTeam, paused, selectedBuilding, state, teamResources } from '../core/game';
import { BUILDING_TYPES, FARM_LEVELS, RESOURCE_NAMES, TRAIN_QUEUE_MAX, specs } from '../config/balance';
import { trainQueueOf } from '../sim/units';
import { foodPerMinute, upkeepPerMinute } from '../sim/economy';
import { activeFortressGuns } from '../map/bases';
import { upgradeCost, upgradeTarget } from '../sim/buildings';

export let showTerritory=true;
export function setShowTerritory(on){showTerritory=on;const el=$('toggleTerritory');if(el){el.querySelector('span').textContent=(on?'Đang hiện':'Đang ẩn')+' · phím T';el.classList.toggle('placing',!on);}}
export function updateMatchClockHUD(){const sec=Math.floor(gameTime);$('time').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');setText($('phaseHint'),gameTime<300?'Giai đoạn phát triển kinh tế':gameTime<600?'Giai đoạn mở rộng':'Giai đoạn giao tranh');}
export function updateHUD(){
 const team=localTeam(),res=teamResources(team);for(const key of Object.keys(RESOURCE_NAMES))$(key).textContent=Math.floor(res[key]);
 const produced=foodPerMinute(team),eaten=upkeepPerMinute(team),net=produced-eaten,supply=state.supply[team],foodRate=$('foodRate');
 foodRate.textContent=supply.status==='warning'?`Thiếu lúa · chậm sau ${supply.grace}s`:supply.status==='starving'?'Thiếu tiếp tế · quân chậm':`+${formatAmount(produced)} −${formatAmount(eaten)} = ${net>=0?'+':''}${formatAmount(net)}/phút`;
 foodRate.className=supply.status!=='ok'?'supply-bad':net<0?'supply-warn':'';
 updateMatchClockHUD();
 const ours=state.units.filter(u=>u.team===team);
 const infantry=ours.filter(u=>u.type==='infantry').length,archers=ours.filter(u=>u.type==='archer').length,scouts=ours.filter(u=>u.type==='scout').length,spearmen=ours.filter(u=>u.type==='spearman').length,cavalry=ours.filter(u=>u.type==='cavalry').length;
 const queued=state.pendingSpawns.filter(u=>u.team===team);updateTrainQueueHUD(team);$('unitCount').textContent=ours.length+queued.length;$('unitBreakdown').textContent=`Lính ${infantry} · Cung ${archers} · Lính giáo ${spearmen} · Kỵ binh ${cavalry}${queued.length?` · Chờ ${queued.length}`:''}`;const spearmanCounter=$('spearmanCount');if(spearmanCounter)spearmanCounter.textContent=spearmen;
 $('unitCount').parentElement.querySelector('small').textContent=team===0?'🪖 Quân xanh':'🪖 Quân đỏ';if(spearmanCounter)spearmanCounter.parentElement.querySelector('small').textContent=team===0?'🗡️ Lính giáo xanh':'🗡️ Lính giáo đỏ';
 const home=state.bases.find(b=>b.team===team);$('turret').disabled=paused||ended||activeFortressGuns(home)>=2;
 for(const id of ['scout','infantry','archer','spearman','cavalry','attack','upgradeFarm','upgradeOutpost',...Object.values(BUILDING_TYPES).map(d=>d.button).filter(Boolean)])$(id).disabled=paused||ended;
 // The farm upgrade button shows the next level's price.
 for(const type of Object.keys(specs))setText($(type).querySelector('span'),costText(specs[type].cost)+' · '+specs[type].train+'s · nuôi '+formatAmount(specs[type].upkeep)+' lúa/phút');
 const farmTarget=upgradeTarget(team,'farm',selectedBuilding?.kind==='farm'&&selectedBuilding.team===team?selectedBuilding.id:null)||upgradeTarget(team,'farm',null);
 setText($('upgradeFarm').querySelector('span'),farmTarget?`lên cấp ${farmTarget.level+1}: ${costText(upgradeCost(farmTarget))} · ${FARM_LEVELS[farmTarget.level+1].food} lúa/phút`:'cấp 2: 80 gỗ · 40 đá · cấp 3: 120 gỗ · 80 đá');
 const owned=state.regions.filter(r=>r.owner===team),income={};
 for(const m of state.mines)if(state.regions[m.regionId]?.owner===team)income[m.resource]=(income[m.resource]||0)+m.income*60;
 setText($('territory'),String(owned.length));
 setText($('territoryIncome'),Object.keys(income).length?Object.entries(income).map(([k,v])=>`+${Math.round(v)} ${RESOURCE_NAMES[k]}`).join(' · ')+'/phút':'Chưa có mỏ');
 $('pause').disabled=ended;
 $('pause').innerHTML=paused?'▶ Tiếp tục<span>Tiếp tục trận đấu</span>':'Ⅱ Tạm dừng<span>Dừng / tiếp tục</span>';
}
// Training line under the unit buttons: the unit in training with a progress fill, then the units waiting.
export function updateTrainQueueHUD(team){
 const el=$('trainQueue');if(!el)return;const list=trainQueueOf(team);
 if(!list.length){setText(el,'');el.style.backgroundImage='';return;}
 const head=list[0],pct=Math.round((1-head.left/head.total)*100),rest=list.slice(1).map(q=>specs[q.type].name);
 setText(el,`⏳ Đang huấn luyện: ${specs[head.type].name} ${Math.max(0,Math.ceil(head.left))}s${rest.length?` · chờ (${rest.length}/${TRAIN_QUEUE_MAX-1}): ${rest.join(', ')}`:''}`);
 el.style.backgroundImage=`linear-gradient(90deg,#4f9a5a ${pct}%,transparent ${pct}%)`;
}
export function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
export function setSidebarCollapsed(collapsed){gameApp.classList.toggle('panel-collapsed',collapsed);toggleSideHud.textContent=collapsed?'▢':'▣';toggleSideHud.setAttribute('aria-label',collapsed?'Mở bảng điều khiển':'Thu gọn bảng điều khiển');setTimeout(()=>syncWorldMetrics(),0);}
