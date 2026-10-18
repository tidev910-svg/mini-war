// @ts-nocheck
// HUD over the battlefield: commander badge, resource bar, queue panel, side-rail buttons (docs/features/hud-ui.md).
import { gameApp, syncWorldMetrics, toggleSideHud } from '../core/view';
import { $, costText, ended, formatAmount, gameTime, localTeam, paused, selectedBuilding, state, teamResources } from '../core/game';
import { BUILDING_TYPES, FARM_LEVELS, FORTRESS_INCOME_PER_MINUTE, RESOURCE_NAMES, TRAIN_QUEUE_MAX, specs } from '../config/balance';
import { trainQueueOf } from '../sim/units';
import { foodPerMinute, upkeepPerMinute } from '../sim/economy';
import { activeFortressGuns } from '../map/bases';
import { buildingDef, buildingDone, upgradeCost, upgradeTarget } from '../sim/buildings';
import { updateUnitCards } from './panels';

export let showTerritory=true;
export function setShowTerritory(on){showTerritory=on;const el=$('toggleTerritory');if(el){el.querySelector('span').textContent=(on?'Ranh giới: đang hiện':'Ranh giới: đang ẩn')+' · T';el.classList.toggle('placing',!on);}}
// Pause button label (rail button: icon + tooltip).
export function setPauseButton(){$('pause').innerHTML=paused?'<i>▶</i><span>Tiếp tục · F3</span>':'<i>Ⅱ</i><span>Tạm dừng · F3</span>';}
export function updateMatchClockHUD(){const sec=Math.floor(gameTime);$('time').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');setText($('phaseHint'),gameTime<300?'Giai đoạn phát triển kinh tế':gameTime<600?'Giai đoạn mở rộng':'Giai đoạn giao tranh');}
export function updateHUD(){
 const team=localTeam(),res=teamResources(team);for(const key of Object.keys(RESOURCE_NAMES))$(key).textContent=Math.floor(res[key]);
 const produced=foodPerMinute(team),eaten=upkeepPerMinute(team),net=produced-eaten,supply=state.supply[team],foodRate=$('foodRate');
 foodRate.textContent=supply.status==='warning'?`Thiếu lúa · chậm sau ${supply.grace}s`:supply.status==='starving'?'Thiếu tiếp tế · quân chậm':`+${formatAmount(produced)} −${formatAmount(eaten)} = ${net>=0?'+':''}${formatAmount(net)}/phút`;
 foodRate.className=supply.status!=='ok'?'supply-bad':net<0?'supply-warn':'';
 // Wood, stone and gold per minute: fortress income plus held mines (food has its own line with upkeep).
 const minePerMinute={};for(const m of state.mines)if(state.regions[m.regionId]?.owner===team)minePerMinute[m.resource]=(minePerMinute[m.resource]||0)+m.income*60;
 const fortress=state.bases.some(b=>b.team===team&&b.hp>0);
 for(const k of ['wood','stone','gold'])setText($(k+'Rate'),`+${formatAmount((fortress?FORTRESS_INCOME_PER_MINUTE[k]:0)+(minePerMinute[k]||0))}/phút`);
 updateMatchClockHUD();
 const ours=state.units.filter(u=>u.team===team);
 const infantry=ours.filter(u=>u.type==='infantry').length,archers=ours.filter(u=>u.type==='archer').length,scouts=ours.filter(u=>u.type==='scout').length,spearmen=ours.filter(u=>u.type==='spearman').length,cavalry=ours.filter(u=>u.type==='cavalry').length;
 const queued=state.pendingSpawns.filter(u=>u.team===team);updateTrainQueueHUD(team);$('unitCount').textContent=ours.length+queued.length;$('unitBreakdown').textContent=`Lính ${infantry} · Cung ${archers} · Lính giáo ${spearmen} · Kỵ binh ${cavalry}${queued.length?` · Chờ ${queued.length}`:''}`;const spearmanCounter=$('spearmanCount');if(spearmanCounter)spearmanCounter.textContent=spearmen;
 setText($('sideName'),team===0?'QUÂN XANH':'QUÂN ĐỎ');$('crest').classList.toggle('red',team===1);
 const home=state.bases.find(b=>b.team===team);$('turret').disabled=paused||ended||activeFortressGuns(home)>=2;
 for(const id of ['scout','infantry','archer','spearman','cavalry','attack','openTrain','openBuild','upgradeFarm','upgradeOutpost',...Object.values(BUILDING_TYPES).map(d=>d.button).filter(Boolean)])$(id).disabled=paused||ended;
 // The farm upgrade button shows the next level's price.
 for(const type of Object.keys(specs))setText($(type).querySelector('span'),costText(specs[type].cost)+' · '+specs[type].train+'s · nuôi '+formatAmount(specs[type].upkeep)+' lúa/phút');
 updateUnitCards();
 const farmTarget=upgradeTarget(team,'farm',selectedBuilding?.kind==='farm'&&selectedBuilding.team===team?selectedBuilding.id:null)||upgradeTarget(team,'farm',null);
 setText($('upgradeFarm').querySelector('span'),farmTarget?`lên cấp ${farmTarget.level+1}: ${costText(upgradeCost(farmTarget))} · ${FARM_LEVELS[farmTarget.level+1].food} lúa/phút`:'cấp 2: 80 gỗ · 40 đá · cấp 3: 120 gỗ · 80 đá');
 const owned=state.regions.filter(r=>r.owner===team),income={};
 for(const m of state.mines)if(state.regions[m.regionId]?.owner===team)income[m.resource]=(income[m.resource]||0)+m.income*60;
 setText($('territory'),String(owned.length));
 setText($('territoryIncome'),Object.keys(income).length?Object.entries(income).map(([k,v])=>`+${Math.round(v)} ${RESOURCE_NAMES[k]}`).join(' · ')+'/phút':'Chưa có mỏ');
 $('pause').disabled=ended;
 setPauseButton();
}
// Queue panel: the unit in training, the units waiting, then buildings under construction or upgrade, each with a bar.
const UNIT_ICONS={scout:'🔭',infantry:'🪖',archer:'🏹',spearman:'🗡️',cavalry:'🐎'},BUILDING_ICONS={farm:'🌾',outpost:'🛡️',tower:'🗼'};
export function updateTrainQueueHUD(team){
 const el=$('trainQueue');if(!el||!state)return;
 const rows=[];
 trainQueueOf(team).forEach((q,i)=>{const pct=i?0:Math.round((1-q.left/q.total)*100);rows.push(`<div class="q-item${i?' waiting':''}"><i>${UNIT_ICONS[q.type]||'🪖'}</i><span class="q-name">${specs[q.type].name}${i?` · chờ ${i}/${TRAIN_QUEUE_MAX-1}`:''}</span><span class="q-time">${i?'':Math.max(0,Math.ceil(q.left))+'s'}</span><span class="q-bar"><b style="width:${pct}%"></b></span></div>`);});
 for(const b of state.buildings){
  if(b.team!==team)continue;const def=buildingDef(b);let pct,left,label;
  if(!buildingDone(b)){pct=b.progress;left=(1-b.progress)*def.buildTime;label=b.waiting?def.name+' · cần quân đứng cạnh':'Đang xây '+def.name.toLowerCase();}
  else if(b.upgrade){pct=b.upgrade.progress;left=(1-b.upgrade.progress)*b.upgrade.time;label=`${def.name} lên cấp ${b.level+1}`;}
  else continue;
  rows.push(`<div class="q-item build"><i>${BUILDING_ICONS[b.kind]||'🏗️'}</i><span class="q-name">${label}</span><span class="q-time">${Math.max(0,Math.ceil(left))}s</span><span class="q-bar"><b style="width:${Math.round(pct*100)}%"></b></span></div>`);
 }
 const html=rows.join('');if(el.innerHTML!==html)el.innerHTML=html;
}
export function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
// Hide every HUD panel except the side rail (so the button to bring them back stays visible).
export function setSidebarCollapsed(collapsed){gameApp.classList.toggle('panel-collapsed',collapsed);toggleSideHud.innerHTML=collapsed?'<i>▢</i><span>Hiện giao diện</span>':'<i>▣</i><span>Ẩn giao diện</span>';toggleSideHud.setAttribute('aria-label',collapsed?'Hiện giao diện':'Ẩn giao diện');setTimeout(()=>syncWorldMetrics(),0);}
