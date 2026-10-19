// @ts-nocheck
// Unit selection helpers and the selection bar (docs/features/controls.md, Unit Control V1.0).
// Selection is local to this browser (u.selected + localSelectedIds); nothing here sends an action, so units dropped from
// the selection keep whatever order they had.
// The bar remembers the last "real" selection (box, click, double-click, Ctrl+A, group) as the pool: filtering by type
// (keys 1–5 or a bar icon) narrows the selection inside it, and Shift + icon puts a type of the pool back or takes it out.
import { $, addLog, localSelectedIds, localTeam, setSelected, setSelectedBuilding, setSelectedFlag, setSelectedFortress, state } from '../core/game';
import { specs } from '../config/balance';

// Keys 1–5 → unit type (the bar shows types in this order).
export const SELECT_KEYS = { 1: 'scout', 2: 'infantry', 3: 'spearman', 4: 'archer', 5: 'cavalry' };
const TYPE_ORDER = Object.values(SELECT_KEYS);
const ICONS = { scout: 'eye', infantry: 'sword', spearman: 'spear', archer: 'bow', cavalry: 'horse' };

const ownAlive = () => state.units.filter(u => u.team === localTeam() && u.hp > 0);
export const selectedOwnUnits = () => ownAlive().filter(u => u.selected);
// Replace (or extend) the selection with `units`, the way a click or a box selection does.
export function selectUnits(units, add = false) {
  if (!add) { for (const u of state.units) u.selected = false; localSelectedIds.clear(); }
  for (const u of units) { u.selected = true; localSelectedIds.add(u.id); }
  setSelected(units[0] || null); setSelectedFortress(null); setSelectedBuilding(null); setSelectedFlag(null);
}

let pool = [], lastSig = '', filterSig = null;
const sigOf = units => units.map(u => u.id).sort((a, b) => a - b).join(',');
// Narrowing done here leaves the pool alone; any other change of the selection starts a new pool.
function trackPool() {
  const sel = selectedOwnUnits(), sig = sigOf(sel);
  if (sig !== lastSig) { if (sig !== filterSig) pool = sel.map(u => u.id); lastSig = sig; }
  const alive = new Set(ownAlive().map(u => u.id)); pool = pool.filter(id => alive.has(id));
  if (!sel.length) pool = [];
}
function applyFilter(units) { selectUnits(units); filterSig = sigOf(units); trackPool(); updateSelectionBar(); }
const poolUnits = () => { const ids = new Set(pool); return ownAlive().filter(u => ids.has(u.id)); };

// Keys 1–5: keep only that type among the units already selected; if there is none, keep the selection and say so.
export function filterSelectionByType(type) {
  trackPool();
  const sel = selectedOwnUnits(); if (!sel.length) return false;
  const keep = sel.filter(u => u.type === type);
  if (!keep.length) { addLog(`Nhóm đang chọn không có ${specs[type].name.toLowerCase()}.`); return false; }
  if (keep.length !== sel.length) applyFilter(keep);
  return true;
}
// Bar icon: select only that type of the pool. Shift + icon: add that type of the pool, or remove it if selected.
export function selectTypeFromPool(type, toggle = false) {
  trackPool();
  const sel = selectedOwnUnits(), ofType = poolUnits().filter(u => u.type === type);
  if (!ofType.length) return;
  if (!toggle) { applyFilter(ofType); return; }
  const has = sel.some(u => u.type === type);
  const next = has ? sel.filter(u => u.type !== type) : [...sel, ...ofType.filter(u => !u.selected)];
  if (next.length) applyFilter(next);
}

// The bar: one icon per type in the pool with "selected / in pool" counts and its key; hidden with nothing selected.
let barHtml = '';
export function updateSelectionBar() {
  const bar = $('unitBar'); if (!bar || !state) return;
  trackPool();
  const sel = selectedOwnUnits(), all = poolUnits();
  if (!sel.length) { bar.hidden = true; return; }
  const keyOf = Object.fromEntries(Object.entries(SELECT_KEYS).map(([k, t]) => [t, k]));
  const html = TYPE_ORDER.filter(t => all.some(u => u.type === t)).map(t => {
    const n = sel.filter(u => u.type === t).length, total = all.filter(u => u.type === t).length;
    return `<button type="button" class="unit-chip${n ? ' on' : ''}" data-type="${t}" data-tip="${specs[t].name}: bấm để chỉ chọn loại này · Shift + bấm: thêm/bỏ · phím ${keyOf[t]}"><kbd>${keyOf[t]}</kbd><svg class="ico"><use href="#i-${ICONS[t]}"/></svg><b>${n}</b>${n !== total ? `<small>/${total}</small>` : ''}</button>`;
  }).join('') + `<span class="unit-total">${sel.length} quân</span>`;
  if (html !== barHtml) { barHtml = html; bar.innerHTML = html; }
  bar.hidden = false;
}
$('unitBar')?.addEventListener('click', e => { const b = e.target.closest('.unit-chip'); if (b) selectTypeFromPool(b.dataset.type, e.shiftKey); });
