// @ts-nocheck
// Formation menu (docs/features/formations.md): opened from the "Đội hình" button on the selection bar or with G.
// Three formations, "Giữ đội hình" / "Di chuyển tự do", "Hủy đội hình". Every choice is an action (requestAction), so the
// host decides in PvP. The small diagrams are drawn from formationLayout() with a sample army.
import { $, state } from '../core/game';
import { FORMATION_KINDS, FORMATION_MODES } from '../config/formation';
import { requestAction } from '../core/actions';
import { formationLayout, formationOf } from '../sim/formation';
import { selectedOwnUnits } from './selection';
import { playSound } from '../audio/sound';

const menu = () => $('formationMenu');
export const formationMenuOpen = () => !!menu() && !menu().hidden;
const fighters = () => selectedOwnUnits().filter(u => u.type !== 'scout');
// The one formation every selected fighter belongs to, if any.
function currentFormation() { const fs = fighters(); const f = fs.length ? formationOf(fs[0]) : null; return f && fs.every(u => u.formation === f.id) ? f : null; }

// Sample army for the diagrams: front line, archers behind, cavalry on the wings.
const SAMPLE = [...Array(5).fill('spearman'), ...Array(6).fill('infantry'), ...Array(5).fill('archer'), ...Array(4).fill('cavalry')].map((type, i) => ({ id: i + 1, type }));
function diagram(kind) {
  const slots = formationLayout(kind, SAMPLE), pts = SAMPLE.map(u => ({ type: u.type, x: slots[u.id].r, y: -slots[u.id].f }));
  const pad = 18, xs = pts.map(p => p.x), ys = pts.map(p => p.y), x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad - 10;
  const w = Math.max(...xs) + pad - x0, h = Math.max(...ys) + pad - y0;
  return `<svg class="formation-diagram" viewBox="${x0} ${y0} ${w} ${h}" aria-hidden="true"><path class="fd-arrow" d="M0 ${y0 + 4}l-8 10h16z"/>${pts.map(p => `<circle class="fd-${p.type}" cx="${p.x}" cy="${p.y}" r="9"/>`).join('')}</svg>`;
}
function build() {
  const box = $('formationKinds'); if (!box || box.childElementCount) return;
  box.innerHTML = Object.entries(FORMATION_KINDS).map(([k, v]) => `<button type="button" data-kind="${k}" data-tip="${v.hint}">${diagram(k)}<strong>${v.name}</strong></button>`).join('');
  $('formationModes').innerHTML = Object.entries(FORMATION_MODES).map(([k, v]) => `<button type="button" role="radio" data-mode="${k}">${v}</button>`).join('');
}

export function toggleFormationMenu(open = !formationMenuOpen()) {
  if (!menu()) return;
  if (open && !fighters().length) open = false;
  build(); menu().hidden = !open; if (open) { updateFormationMenu(); playSound('ui.open'); }
}
// Kept in step with the selection (called from updateSelectionBar()).
export function updateFormationMenu() {
  if (!formationMenuOpen()) return;
  const fs = fighters(); if (!fs.length) { menu().hidden = true; return; }
  const scouts = selectedOwnUnits().length - fs.length, f = currentFormation();
  $('formationCount').textContent = `${fs.length} quân chiến đấu${scouts ? ` · ${scouts} trinh sát không tham gia` : ''}`;
  for (const b of menu().querySelectorAll('[data-kind]')) b.classList.toggle('on', f?.kind === b.dataset.kind);
  for (const b of menu().querySelectorAll('[data-mode]')) { b.setAttribute('aria-checked', String(f?.mode === b.dataset.mode)); b.disabled = !f; }
  $('formationCancel').disabled = !fs.some(u => u.formation != null);
}

menu()?.addEventListener('click', e => {
  const ids = selectedOwnUnits().map(u => u.id), b = e.target.closest?.('button'); if (!b || !ids.length) return;
  if (b.dataset.kind) { requestAction('formation', { ids, kind: b.dataset.kind }); playSound('order.move'); }
  else if (b.dataset.mode) requestAction('formationMode', { ids, mode: b.dataset.mode });
  else if (b.id === 'formationCancel') requestAction('formationCancel', { ids });
  else if (b.dataset.close != null) { toggleFormationMenu(false); return; }
  updateFormationMenu(); setTimeout(updateFormationMenu, 250); // a guest sees the result after the next snapshot
});
$('unitBar')?.addEventListener('click', e => { if (e.target.closest?.('.formation-btn')) toggleFormationMenu(); });
