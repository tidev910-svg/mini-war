// @ts-nocheck
// Selection info panel (docs/features/selection-info.md): what the selected units, building, fortress or flag are and do —
// health, damage, counters, current order, build / upgrade / capture progress. Read-only; refreshed from updateHUD().
import { garrisonOf, sortieOf } from '../sim/garrison';
import { requestAction } from '../core/actions';
import { knownFlag } from '../render/intel';
import { $, formatAmount, localTeam, selectedBuilding, selectedFlag, selectedFortress, state } from '../core/game';
import { BUILDING_TYPES, COUNTER_MULTIPLIERS, FARM_LEVELS, FLAG_CAPTURE_RADIUS_TILES, FLAG_GUN, FARM_UPGRADE_SECONDS, FORTRESS_GUN_DAMAGE, FORTRESS_INCOME_PER_MINUTE, RESOURCE_NAMES, STRUCTURE_DAMAGE_MULTIPLIERS, specs } from '../config/balance';
import { buildingDone, hasBuilder } from '../sim/buildings';
import { farmFoodPerMinute, supplyFactor } from '../sim/economy';
import { captureSeconds, captureStage, flagCapturers, regionOutpost } from '../sim/territory';
import { teamCanSee } from '../sim/fog';
import { regionLabel } from '../map/regions';
import { TILE_SIZE } from '../config/map';
import { selectedOwnUnits } from './selection';
import { formationOf } from '../sim/formation';
import { FORMATION_KINDS, FORMATION_MODES } from '../config/formation';

const ORDER_NAMES = { hold: 'Đứng giữ vị trí', move: 'Đang di chuyển', attack: 'Tấn công', explore: 'Đi tự do', formation: 'Theo đội hình', sortie: 'Xuất kích bảo vệ cờ', camp: 'Đang dọn hang quái' };
const num = n => formatAmount(n);
const mult = m => '×' + String(Math.round(m * 100) / 100).replace('.', ',');
const pct = p => `${Math.round(Math.max(0, Math.min(1, p)) * 100)}%`;
const sideName = t => t === localTeam() ? 'Phe bạn' : t >= 0 ? 'Đối phương' : 'Trung lập';
const bar = (v, max, cls = 'hp') => `<div class="info-bar ${cls}"><i style="width:${pct(v / Math.max(1, max))}"></i><span>${num(Math.max(0, v))} / ${num(max)}</span></div>`;
const progress = (label, p) => `<div class="info-bar progress"><i style="width:${pct(p)}"></i><span>${label} ${pct(p)}</span></div>`;
const row = (k, v) => `<dt>${k}</dt><dd>${v}</dd>`;

// Counter text for one unit type: whom it beats, who beats it, and its multiplier against structures.
export function counterLines(type) {
  const strong = Object.entries(COUNTER_MULTIPLIERS[type] || {}).map(([t, m]) => `${specs[t].name} ${mult(m)}`);
  const weak = Object.entries(COUNTER_MULTIPLIERS).filter(([, v]) => v[type]).map(([a, v]) => `${specs[a].name} ${mult(v[type])}`);
  return [['Mạnh với', strong.join(', ') || '—'], ['Yếu trước', weak.join(', ') || '—'], ['Đánh công trình', mult(STRUCTURE_DAMAGE_MULTIPLIERS[type] ?? 1)]];
}
function orderOf(u) {
  if (u.buildTarget) return 'Đang xây tiền đồn';
  if (u.captureTarget != null) return 'Đang chiếm cờ';
  if (u.garrisonTarget != null) return 'Đang về đồn trú';
  if (u.campTarget != null) return ORDER_NAMES.camp;
  return ORDER_NAMES[u.order] || ORDER_NAMES.hold;
}

// Formation of the selection (sim/formation.ts): kind · mode, or how many of the units are in one.
function formationRow(units) {
  const inF = units.filter(u => u.formation != null); if (!inF.length) return '';
  const f = formationOf(inF[0]);
  if (!f || inF.length < units.filter(u => u.type !== 'scout').length || inF.some(u => u.formation !== f.id)) return row('Đội hình', `${inF.length} quân đang trong đội hình`);
  return row('Đội hình', `${FORMATION_KINDS[f.kind].name} · ${FORMATION_MODES[f.mode]}${f.column ? ' · hàng dọc qua lối hẹp' : f.moving ? ' · đang hành quân' : ''}`);
}
function unitsHtml(units) {
  const team = units[0].team, starving = supplyFactor(team, 'attack') < 1;
  if (units.length === 1) {
    const u = units[0], s = specs[u.type];
    return `<header><b>${s.name}</b><small>${sideName(u.team)}</small></header>${bar(u.hp, u.max)}
      <dl>${row('Sát thương', `${num(s.damage)} mỗi ${String(s.cooldown).replace('.', ',')} giây${starving ? ' <em>(thiếu lúa: chậm hơn)</em>' : ''}`)}
      ${row('Tầm đánh', num(s.range))}${row('Tốc độ', num(s.speed))}${row('Lúa nuôi', `${String(s.upkeep).replace('.', ',')}/phút`)}
      ${counterLines(u.type).map(([k, v]) => row(k, v)).join('')}${row('Lệnh', orderOf(u))}${formationRow(units)}</dl>`;
  }
  const hp = units.reduce((t, u) => t + Math.max(0, u.hp), 0), max = units.reduce((t, u) => t + u.max, 0);
  const dps = units.reduce((t, u) => t + specs[u.type].damage / specs[u.type].cooldown, 0) * (starving ? supplyFactor(team, 'attack') : 1);
  const upkeep = units.reduce((t, u) => t + specs[u.type].upkeep, 0);
  const types = [...new Set(units.map(u => u.type))];
  const orders = Object.entries(units.reduce((o, u) => (o[orderOf(u)] = (o[orderOf(u)] || 0) + 1, o), {})).map(([k, n]) => `${k} ${n}`).join(' · ');
  return `<header><b>${units.length} quân</b><small>${types.map(t => specs[t].name).join(', ')}</small></header>${bar(hp, max)}
    <dl>${row('Sát thương/giây', `≈ ${num(dps)}`)}${row('Lúa nuôi', `${num(upkeep)}/phút`)}
    ${types.length === 1 ? counterLines(types[0]).map(([k, v]) => row(k, v)).join('') : ''}${row('Lệnh', orders)}${formationRow(units)}</dl>`;
}

function buildingHtml(b) {
  const def = BUILDING_TYPES[b.kind], done = buildingDone(b), lines = [];
  if (!done) {
    lines.push(progress('Đang xây', b.progress));
    if (b.kind === 'outpost') lines.push(`<p class="info-note${hasBuilder(b) ? '' : ' warn'}">${hasBuilder(b) ? 'Có quân đứng gần: đang xây.' : 'Cần một quân đứng gần để tiếp tục xây.'}</p>`);
  }
  if (b.upgrade) lines.push(progress(`Nâng lên cấp ${b.level + 1}`, b.upgrade.progress / (b.upgrade.time || FARM_UPGRADE_SECONDS)));
  const rows = [];
  if (b.kind === 'farm') { rows.push(['Cấp', `${b.level} / ${FARM_LEVELS.length - 1}`]); if (done) rows.push(['Sinh lúa', `${num(farmFoodPerMinute(b))}/phút${farmFoodPerMinute(b) > FARM_LEVELS[b.level].food ? ' (thưởng vùng lúa)' : ''}`]); }
  if (def.gun) rows.push(['Súng', `${num(def.gun.damage)} sát thương mỗi ${String(def.gun.cooldown).replace('.', ',')} giây · tầm ${num(def.gun.range)}${done ? '' : ' (khi xây xong)'}`]);
  return `<header><b>${def.name}</b><small>${sideName(b.team)}</small></header>${bar(b.hp, b.max)}${lines.join('')}<dl>${rows.map(([k, v]) => row(k, v)).join('')}</dl>`;
}

function fortressHtml(base) {
  const guns = (base.guns || []).map((g, i) => g.active ? `${FORTRESS_GUN_DAMAGE[i] ?? FORTRESS_GUN_DAMAGE[0]}` : null).filter(Boolean);
  const income = Object.entries(FORTRESS_INCOME_PER_MINUTE).map(([k, v]) => `${v} ${RESOURCE_NAMES[k]}`).join(', ');
  return `<header><b>Pháo đài</b><small>${sideName(base.team)}</small></header>${bar(base.hp, base.max)}
    <dl>${row('Pháo', `${guns.length} / ${(base.guns || []).length} · sát thương ${guns.join(' + ')}`)}${row('Thu nhập', `${income} mỗi phút`)}
    ${row('Hàng huấn luyện', `${state.queueLanes?.[base.team] ?? '—'} hàng song song`)}</dl>`;
}

// Garrison of the local side's own flag (hidden from the enemy, so only ever shown to the owner).
function garrisonRows(r) {
  const inside = garrisonOf(r), out = sortieOf(r), mix = list => [...new Set(list.map(u => u.type))].map(t => `${list.filter(u => u.type === t).length} ${specs[t].name.toLowerCase()}`).join(', ');
  return row('Đồn trú', inside.length ? `${inside.length} quân: ${mix(inside)}` : 'Trống — chuột phải vào cờ để đưa quân vào') + (out.length ? row('Đang xuất kích', `${out.length} quân${r.defense?.returning ? ' · đang rút về' : ''}`) : '');
}
const garrisonActions = r => (garrisonOf(r).length ? `<button type="button" class="btn info-action" data-garrison-exit="${r.id}">Cho toàn bộ quân ra</button>` : '');
function flagHtml(r) {
  const me = localTeam(), stage = captureStage(r);
  const mines = state.mines.filter(m => m.regionId === r.id), perMin = mines.reduce((t, m) => t + m.income * 60, 0);
  // Enemy capturers are only counted where the local side can see them.
  const rad = FLAG_CAPTURE_RADIUS_TILES * TILE_SIZE;
  const mine = flagCapturers(r, me), theirs = state.units.filter(u => u.team !== me && u.hp > 0 && u.type !== 'scout' && Math.hypot(u.x - r.cp.x, u.y - r.cp.y) <= rad && teamCanSee(me, u.x, u.y)).length;
  const lines = [];
  if (stage) lines.push(progress(stage === 1 ? `${sideName(r.capTeam)} hạ cờ (1/2)` : `${sideName(r.capTeam)} chiếm cờ (2/2)`, r.cap));
  else if (r.cap > 0) lines.push(progress(`${sideName(r.capTeam)} chiếm cờ`, r.cap));
  if (r.contested) lines.push(`<p class="info-note warn">${regionOutpost(r) && !(mine && theirs) ? 'Tiền đồn đang giữ cờ: phải phá tiền đồn trước.' : 'Đang tranh chấp: hai bên cùng đứng ở cờ.'}</p>`);
  const capturers = mine || theirs ? `${mine} quân bạn${theirs ? ` · ${theirs} quân địch` : ''}` : 'Không có ai';
  const speed = mine && !theirs && r.owner !== me ? ` (~${Math.round(captureSeconds(mine))} giây mỗi giai đoạn)` : '';
  return `<header><b>Cờ ${regionLabel(r)}</b><small>${sideName(r.owner)}</small></header>${lines.join('')}
    <dl>${row('Sinh', perMin ? `${num(perMin)} ${RESOURCE_NAMES[r.resource]}/phút cho phe giữ cờ` : 'Không có mỏ')}${row('Trong vòng cờ', capturers + speed)}
    ${row('Tiền đồn', regionOutpost(r) ? (buildingDone(regionOutpost(r)) ? 'Có' : 'Đang xây') : 'Chưa có')}
    ${r.owner >= 0 ? row('Tự vệ', `${FLAG_GUN.damage} sát thương mỗi ${FLAG_GUN.cooldown} giây · tầm ${FLAG_GUN.range}`) : ''}${r.owner === me ? garrisonRows(r) : ''}</dl>${r.owner === me ? garrisonActions(r) : ''}`;
}

// The panel shows one thing at a time, in the same priority the click handler selects them.
let shown = '';
export function updateSelectionInfo() {
  const box = $('selInfo'); if (!box || !state) return;
  let html = '';
  const units = selectedOwnUnits();
  if (units.length) html = unitsHtml(units);
  else if (selectedFortress) { const base = state.bases.find(b => b.team === selectedFortress.team); if (base) html = fortressHtml(base); }
  else if (selectedBuilding) { const b = state.buildings.find(q => q.id === selectedBuilding.id); if (b) html = buildingHtml(b); }
  else if (selectedFlag != null && state.regions[selectedFlag]) html = flagHtml(knownFlag(state.regions[selectedFlag])); // as the side last saw it
  if (html !== shown) { shown = html; box.innerHTML = html; }
  box.hidden = !html;
}

// The only button in the panel: let the garrison of the selected own flag out (an action, so the host decides in PvP).
$('selInfo')?.addEventListener('click', e => { const b = e.target.closest?.('[data-garrison-exit]'); if (b) requestAction('garrisonExit', { regionId: Number(b.dataset.garrisonExit) }); });
