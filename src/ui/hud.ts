// @ts-nocheck
// HUD over the battlefield: player panel, resource banners, queue panel, side rail and menu (docs/features/hud-ui.md).
import { gameApp, syncWorldMetrics, toggleSideHud } from '../core/view';
import { $, addLog, canAfford, costText, ended, formatAmount, gameTime, localTeam, paused, selectedBuilding, state, teamResources } from '../core/game';
import { BUILDING_TYPES, FARM_LEVELS, FORTRESS_INCOME_PER_MINUTE, RESOURCE_NAMES, TRAIN_QUEUE_WAITING, specs } from '../config/balance';
import { TEAM_COLORS } from '../config/theme';
import { laneProblem, laneUpgradeOf, lanesOf, nextLaneOffer, trainQueueOf } from '../sim/units';
import { foodPerMinute, upkeepPerMinute } from '../sim/economy';
import { activeFortressGuns } from '../map/bases';
import { buildingDef, buildingDone, upgradeCost, upgradeTarget } from '../sim/buildings';
import { refreshTooltip, updateUnitCards } from './panels';
import { setFactionTheme } from './theme';
import { setSetting, settings } from '../core/settings';
import { playSound } from '../audio/sound';

const icon = name => `<svg class="ico"><use href="#i-${name}"/></svg>`;
// Rail / menu buttons: icon + label (+ key). The tooltip text lives in data-tip.
function setButton(el, iconName, label, key = '') {
  if (!el) return;
  const html = icon(iconName) + (el.classList.contains('menu-item') ? `<span>${label}</span>${key ? `<kbd>${key}</kbd>` : ''}` : '');
  setHTML(el, html);
  setData(el, 'tip', label + (key ? ' · ' + key : ''));
}

export let showTerritory=settings.territory;
// Also remembered as the 'territory' setting (core/settings.ts), so T and the settings panel stay in step.
export function setShowTerritory(on){showTerritory=on;setSetting('territory',on);const el=$('toggleTerritory');if(el){el.dataset.tip=(on?'Ranh giới vùng: đang hiện':'Ranh giới vùng: đang ẩn')+' · T';el.classList.toggle('placing',!on);}}
// Pause item in the menu (F3 clicks it even while the menu is closed).
export function setPauseButton(){setButton($('pause'),paused?'play':'pause',paused?'Tiếp tục':'Tạm dừng','F3');}
export function updateMatchClockHUD(){const sec=Math.floor(gameTime);$('time').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');setText($('phaseHint'),gameTime<300?'Giai đoạn phát triển kinh tế':gameTime<600?'Giai đoạn mở rộng':'Giai đoạn giao tranh');}

// Army row: one icon + count per unit type, plus units waiting in the muster yard.
const ARMY_ICONS={scout:'eye',infantry:'sword',archer:'bow',spearman:'spear',cavalry:'horse'};
function armyRow(ours,queued){
 return Object.entries(ARMY_ICONS).map(([type,ico])=>{const n=ours.filter(u=>u.type===type).length;return `<span class="army-chip${n?'':' zero'}" data-tip="${specs[type].name}: ${n}">${icon(ico)}<b>${n}</b></span>`;}).join('')
  +(queued?`<span class="army-chip" data-tip="Quân chờ ở sân tập kết">${icon('hourglass')}<b>${queued}</b></span>`:'');
}

export function updateHUD(){
 const team=localTeam(),res=teamResources(team);for(const key of Object.keys(RESOURCE_NAMES))setText($(key),String(Math.floor(res[key])));
 // Banners show the amount and the rate; food shows gross − army upkeep = net (warnings replace it). Sources are in the tooltip.
 const produced=foodPerMinute(team),eaten=upkeepPerMinute(team),net=produced-eaten,supply=state.supply[team],foodRate=$('foodRate');
 setText(foodRate,supply.status==='warning'?`Thiếu lúa · ${supply.grace}s`:supply.status==='starving'?'Thiếu tiếp tế':`+${formatAmount(produced)} −${formatAmount(eaten)} = ${net>=0?'+':''}${formatAmount(net)}/phút`);
 foodRate.className=supply.status!=='ok'?'supply-bad':net<0?'supply-warn':'';
 setData($('resFood'),'tip',`Lúa: ${Math.floor(res.food)}\nThu nhập gộp +${formatAmount(produced)}/phút (nhà chính, nông trại, vùng lúa)\nTiêu hao quân đội −${formatAmount(eaten)}/phút\nThu nhập ròng${net>=0?'+':''}${formatAmount(net)}/phút`+(supply.status==='warning'?`\nHết lúa: quân bị chậm sau ${supply.grace} giây`:supply.status==='starving'?'\nĐang thiếu tiếp tế: quân chậm hơn':''));
 // Wood, stone and gold per minute: fortress income plus held mines.
 const minePerMinute={};for(const m of state.mines)if(state.regions[m.regionId]?.owner===team)minePerMinute[m.resource]=(minePerMinute[m.resource]||0)+m.income*60;
 const fortress=state.bases.some(b=>b.team===team&&b.hp>0);
 for(const k of ['wood','stone','gold']){
  const base=fortress?FORTRESS_INCOME_PER_MINUTE[k]:0,mine=minePerMinute[k]||0,cap=k[0].toUpperCase()+k.slice(1);
  setText($(k+'Rate'),`+${formatAmount(base+mine)}/phút`);
  setData($('res'+cap),'tip',`${RESOURCE_NAMES[k][0].toUpperCase()+RESOURCE_NAMES[k].slice(1)}: ${Math.floor(res[k])}\nPháo đài +${formatAmount(base)}/phút\nMỏ trong vùng đã chiếm +${formatAmount(mine)}/phút`);
 }
 updateMatchClockHUD();
 const ours=state.units.filter(u=>u.team===team),queued=state.pendingSpawns.filter(u=>u.team===team).length;
 updateTrainQueueHUD(team);setText($('unitCount'),String(ours.length+queued));
 setHTML($('unitBreakdown'),armyRow(ours,queued));
 const spearmanCounter=$('spearmanCount');if(spearmanCounter)spearmanCounter.textContent=ours.filter(u=>u.type==='spearman').length;
 setText($('sideName'),TEAM_COLORS[team].name);$('crest').classList.toggle('red',team===1);
 if(document.documentElement.dataset.faction!==String(team))setFactionTheme(team);
 const home=state.bases.find(b=>b.team===team);$('turret').disabled=paused||ended||activeFortressGuns(home)>=2;
 // Disabled main buttons explain why in their tooltip (data-why, read by the tooltip in ui/panels.ts).
 const why=ended?'Trận đấu đã kết thúc':paused?'Trận đấu đang tạm dừng':'';
 for(const id of ['scout','infantry','archer','spearman','cavalry','attack','openTrain','openBuild','upgradeFarm','upgradeOutpost',...Object.values(BUILDING_TYPES).map(d=>d.button).filter(Boolean)]){const el=$(id),off=paused||ended;if(el.disabled!==off)el.disabled=off;}
 for(const id of ['openTrain','openBuild','attack'])setData($(id).parentElement,'why',why);
 // The farm upgrade button shows the next level's price.
 for(const type of Object.keys(specs))setText($(type).querySelector('span'),costText(specs[type].cost)+' · '+specs[type].train+'s · nuôi '+formatAmount(specs[type].upkeep)+' lúa/phút');
 updateUnitCards();
 updateLaneBar(team);
 setText($('farm').querySelector('span'),`${costText(BUILDING_TYPES.farm.cost)} · +${FARM_LEVELS[1].food} lúa/phút`);
 const farmTarget=upgradeTarget(team,'farm',selectedBuilding?.kind==='farm'&&selectedBuilding.team===team?selectedBuilding.id:null)||upgradeTarget(team,'farm',null);
 setText($('upgradeFarm').querySelector('span'),farmTarget?`lên cấp ${farmTarget.level+1}: ${costText(upgradeCost(farmTarget))} · ${FARM_LEVELS[farmTarget.level+1].food} lúa/phút`:`cấp 2: ${costText(FARM_LEVELS[2].cost)} · cấp 3: ${costText(FARM_LEVELS[3].cost)}`);
 // Territory banner: regions held and how many mines they hold; per-resource income in the tooltip.
 const owned=state.regions.filter(r=>r.owner===team),income={};let mines=0;
 for(const m of state.mines)if(state.regions[m.regionId]?.owner===team){income[m.resource]=(income[m.resource]||0)+m.income*60;mines++;}
 setText($('territory'),String(owned.length));
 setText($('territoryIncome'),mines?`${mines} mỏ đang khai thác`:'Chưa có mỏ');
 setData($('resTerritory'),'tip',`Lãnh thổ: ${owned.length}/${state.regions.length} vùng\nChiếm cột cờ của một vùng để khai thác mỏ trong vùng đó và nhìn thấy toàn vùng.\n`+(mines?'Mỏ đang sinh: '+Object.entries(income).map(([k,v])=>`+${Math.round(v)} ${RESOURCE_NAMES[k]}`).join(' · ')+'/phút':'Chưa có mỏ nào: hãy đưa quân tới cột cờ của vùng có mỏ.'));
 $('pause').disabled=ended;
 setPauseButton();
 watchHomeUnderAttack(home);
 refreshTooltip();
}

// Notice when the local fortress loses health (display only; at most once per HOME_ALERT_SECONDS).
const HOME_ALERT_SECONDS=15;let homeHp=null,homeAlertAt=-Infinity;
function watchHomeUnderAttack(home){
 if(!home){homeHp=null;return;}
 if(gameTime<homeAlertAt)homeAlertAt=-Infinity; // a new match started
 if(homeHp!==null&&home.hp<homeHp-.5&&!ended&&gameTime-homeAlertAt>HOME_ALERT_SECONDS){homeAlertAt=gameTime;addLog('Pháo đài đang bị tấn công!','danger');playSound('event.alarm');}
 homeHp=home.hp;
}

// Missing resources flash their banner red for half a second (event from notifyShortfall in core/game.ts).
document.addEventListener('resource-shortfall',e=>{
 playSound('ui.error');
 for(const key of e.detail){const el=document.querySelector(`.res[data-res="${key}"]`);if(!el)continue;el.classList.remove('short');void el.offsetWidth;el.classList.add('short');}
});
document.addEventListener('animationend',e=>{if(e.target.classList?.contains('short'))e.target.classList.remove('short');});

// Queue panel: the unit in training, the units waiting, then buildings under construction or upgrade, each with a bar.
const UNIT_ICONS={scout:'🔭',infantry:'🪖',archer:'🏹',spearman:'🗡️',cavalry:'🐎'},BUILDING_ICONS={farm:'🌾',outpost:'🛡️',tower:'🗼'};
export function updateTrainQueueHUD(team){
 const el=$('trainQueue');if(!el||!state)return;
 const rows=[];
 // Units in the first lanesOf(team) entries train at the same time; the rest wait for a free lane.
 const lanes=lanesOf(team);
 trainQueueOf(team).forEach((q,i)=>{const active=i<lanes,pct=active?Math.round((1-q.left/q.total)*100):0;rows.push(`<div class="q-item${active?'':' waiting'}"><i>${UNIT_ICONS[q.type]||'🪖'}</i><span class="q-name">${specs[q.type].name}${active?'':` · chờ ${i-lanes+1}/${TRAIN_QUEUE_WAITING}`}</span><span class="q-time">${active?Math.max(0,Math.ceil(q.left))+'s':''}</span><span class="q-bar"><b style="width:${pct}%"></b></span></div>`);});
 const up=laneUpgradeOf(team);
 if(up)rows.push(`<div class="q-item build"><i>➕</i><span class="q-name">Mở hàng đợi thứ ${up.lane}</span><span class="q-time">${Math.max(0,Math.ceil(up.left))}s</span><span class="q-bar"><b style="width:${Math.round((1-up.left/up.total)*100)}%"></b></span></div>`);
 for(const b of state.buildings){
  if(b.team!==team)continue;const def=buildingDef(b);let pct,left,label;
  if(!buildingDone(b)){pct=b.progress;left=(1-b.progress)*def.buildTime;label=b.waiting?def.name+' · cần quân đứng cạnh':'Đang xây '+def.name.toLowerCase();}
  else if(b.upgrade){pct=b.upgrade.progress;left=(1-b.upgrade.progress)*b.upgrade.time;label=`${def.name} lên cấp ${b.level+1}`;}
  else continue;
  rows.push(`<div class="q-item build"><i>${BUILDING_ICONS[b.kind]||'🏗️'}</i><span class="q-name">${label}</span><span class="q-time">${Math.max(0,Math.ceil(left))}s</span><span class="q-bar"><b style="width:${Math.round(pct*100)}%"></b></span></div>`);
 }
 setHTML(el,rows.join(''));
}
// Lane bar in the training drawer: lanes open, which are busy, and the button that buys the next lane (price, missing
// resources, progress while it opens).
function updateLaneBar(team){
 const lanes=lanesOf(team),busy=Math.min(lanes,trainQueueOf(team).length),up=laneUpgradeOf(team),offer=nextLaneOffer(team),btn=$('buyLane');
 setText($('laneCount'),String(lanes));
 setHTML($('laneSlots'),Array.from({length:lanes},(_,i)=>`<i class="${i<busy?'busy':''}"></i>`).join('')+(up?'<i class="opening"></i>':''));
 const problem=laneProblem(team);
 if(up){setText($('laneTitle'),`Đang mở hàng đợi thứ ${up.lane}`);setText($('laneCost'),`còn ${Math.max(0,Math.ceil(up.left))} giây`);$('laneProgress').style.width=Math.round((1-up.left/up.total)*100)+'%';}
 else if(offer){setText($('laneTitle'),`Mở hàng đợi thứ ${offer.lane}`);setText($('laneCost'),`${costText(offer.cost)} · ${offer.seconds} giây`);$('laneProgress').style.width='0%';}
 else {setText($('laneTitle'),'Đã mở hết hàng đợi');setText($('laneCost'),'theo bảng giá hiện tại');$('laneProgress').style.width='0%';}
 btn.classList.toggle('cant',!!offer&&!up&&!canAfford(team,offer.cost));btn.classList.toggle('opening',!!up);
 const off=!!up||!offer||ended||paused;if(btn.disabled!==off)btn.disabled=off;
 setData(btn,'tip',problem||'Giá tạm, chưa chốt (QUEUE_LANE_UPGRADES).');
}
export function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
// DOM writes only when the value changed: the HUD refreshes ~10 times a second and most values stay the same.
// setHTML compares with the last string it wrote instead of reading innerHTML back (serialising is not free).
function setHTML(el,html){if(el&&el._html!==html){el._html=html;el.innerHTML=html;}}
function setData(el,key,value){if(el&&el.dataset[key]!==value)el.dataset[key]=value;}
// Hide every HUD panel except the side rail (its menu holds the item that brings them back).
export function setSidebarCollapsed(collapsed){gameApp.classList.toggle('panel-collapsed',collapsed);setButton(toggleSideHud,collapsed?'eye':'eye-off',collapsed?'Hiện giao diện':'Ẩn giao diện');toggleSideHud.setAttribute('aria-label',collapsed?'Hiện giao diện':'Ẩn giao diện');setTimeout(()=>syncWorldMetrics(),0);}
