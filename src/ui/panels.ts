// @ts-nocheck
// Drawers (train / build), guide and confirm modals, game menu, tooltips, notice banner and unit-card portraits (docs/features/hud-ui.md).
import { $, canAfford, localTeam, state } from '../core/game';
import { canvas } from '../core/view';
import { specs } from '../config/balance';
import { buyProblem } from '../sim/units';
import { unitArtFrame } from '../render/unitArt';

const PANELS = { train: 'trainDrawer', build: 'buildDrawer', guide: 'guideModal', confirm: 'confirmModal' };
const DOCK = { train: 'openTrain', build: 'openBuild' };
export let openPanelName = null;
export function openPanel(name) {
  for (const [key, id] of Object.entries(PANELS)) $(id).hidden = key !== name;
  for (const [key, id] of Object.entries(DOCK)) $(id).classList.toggle('active', key === name);
  openPanelName = name;
  if (name) closeMenu();
  if (name === 'train') updateUnitCards();
}
export function closePanels() { openPanel(null); }
export function togglePanel(name) { if (openPanelName === name) closePanels(); else openPanel(name); }

// Unit cards: grey out what the local side cannot recruit now and show its count on the field.
export function updateUnitCards() {
  if (openPanelName !== 'train' || !state) return;
  const team = localTeam();
  for (const type of Object.keys(specs)) {
    const card = $(type); if (!card) continue;
    const problem = buyProblem(type, team), cant = !canAfford(team, specs[type].cost);
    card.classList.toggle('cant', cant);
    card.title = problem || `${specs[type].name}: huấn luyện ${specs[type].train} giây`;
    let count = card.querySelector('.card-count');
    if (!count) { count = document.createElement('small'); count.className = 'card-count'; card.appendChild(count); }
    const n = state.units.filter(u => u.team === team && u.type === type && u.hp > 0).length;
    const text = n ? `Đang có ${n}` : '';
    if (count.textContent !== text) count.textContent = text;
  }
}

// Portrait = the unit's code-drawn idle frame facing the viewer, in the local side's colours, framed on head and torso.
export function drawPortraits() {
  const team = localTeam();
  for (const el of document.querySelectorAll('canvas.portrait')) {
    const type = el.dataset.unit; if (!type) continue;
    const f = unitArtFrame(type, team, 'down', 'idle', 0), k = el.height * (type === 'cavalry' ? .95 : 1.25) / f.figureH;
    const pctx = el.getContext('2d'); pctx.clearRect(0, 0, el.width, el.height);
    pctx.drawImage(f.canvas, el.width / 2 - f.ax * k, el.height * (type === 'cavalry' ? 1.02 : 1.12) - f.ay * k, f.w * k, f.h * k);
  }
}
drawPortraits();

// Notice banner: shows the newest log line, fades after NOTICE_SECONDS; the scroll button opens the last 12 entries.
// A 'danger' line (under attack, losses) gives the banner a red rim while it is the newest.
const NOTICE_SECONDS = 5;
let noticeTimer = 0;
function showNotice() {
  const strip = $('chatStrip'), first = $('feed').firstElementChild;
  strip.classList.remove('idle'); strip.classList.toggle('alert', !!first?.classList.contains('tone-danger'));
  clearTimeout(noticeTimer); noticeTimer = setTimeout(() => strip.classList.add('idle'), NOTICE_SECONDS * 1000);
}
new MutationObserver(showNotice).observe($('feed'), { childList: true });
$('chatToggle').onclick = () => { const strip = $('chatStrip'); strip.classList.toggle('open'); if (!strip.classList.contains('open')) showNotice(); };
$('feed').onclick = () => $('chatStrip').classList.add('open');

// Game menu (side rail): pause, guide, hide HUD, leave. Closes on outside click, Esc or after picking an item.
export function closeMenu() { $('gameMenu').hidden = true; $('menuBtn').setAttribute('aria-expanded', 'false'); }
export function toggleMenu() { const open = $('gameMenu').hidden; $('gameMenu').hidden = !open; $('menuBtn').setAttribute('aria-expanded', String(open)); if (open) hideTooltip(); }
export const menuOpen = () => !$('gameMenu').hidden;
$('menuBtn').onclick = e => { e.stopPropagation(); toggleMenu(); };
$('gameMenu').addEventListener('click', e => { if (e.target.closest('.menu-item')) closeMenu(); });
document.addEventListener('pointerdown', e => { if (menuOpen() && !e.target.closest('#gameMenu,#menuBtn')) closeMenu(); });

// Confirmation dialog used before leaving a match.
let confirmYes = null;
export function confirmAction(title, text, yesLabel, onYes) {
  $('confirmTitle').textContent = title; $('confirmText').textContent = text; $('confirmYes').textContent = yesLabel;
  confirmYes = onYes; openPanel('confirm'); $('confirmNo').focus();
}
$('confirmYes').onclick = () => { const f = confirmYes; confirmYes = null; closePanels(); f?.(); };
$('confirmNo').onclick = () => { confirmYes = null; closePanels(); };
$('confirmModal').addEventListener('click', e => { if (e.target === $('confirmModal')) $('confirmNo').click(); });

// Tooltips for every [data-tip] element (icon-only buttons, banners, army chips). A disabled main button sits in a
// .dock-slot whose data-why holds the reason, shown in red under the tip.
const tip = $('tooltip');
let tipFor = null;
function placeTooltip(el) {
  const r = el.getBoundingClientRect(), t = tip.getBoundingClientRect(), gap = 8, vw = innerWidth, vh = innerHeight;
  let x, y;
  if (el.dataset.tipSide === 'left') { x = r.left - t.width - gap; y = r.top + r.height / 2 - t.height / 2; }
  else { x = r.left + r.width / 2 - t.width / 2; y = r.bottom + gap; if (y + t.height > vh - 4) y = r.top - t.height - gap; }
  tip.style.left = Math.max(4, Math.min(vw - t.width - 4, x)) + 'px'; tip.style.top = Math.max(4, Math.min(vh - t.height - 4, y)) + 'px';
}
function renderTooltip() {
  if (!tipFor) return;
  const text = tipFor.dataset.tip || '', why = tipFor.dataset.why || '';
  tip.textContent = text;
  if (why) { const w = document.createElement('span'); w.className = 'why'; w.textContent = why; tip.appendChild(w); }
  placeTooltip(tipFor);
}
export function hideTooltip() { tipFor = null; tip.hidden = true; }
// Called by updateHUD so an open tooltip follows live numbers.
export function refreshTooltip() { if (tipFor) { if (!tipFor.isConnected) hideTooltip(); else renderTooltip(); } }
document.addEventListener('pointerover', e => {
  if (e.pointerType === 'touch') return;
  const el = e.target.closest?.('[data-tip]');
  if (el === tipFor) return;
  if (!el || (el.id === 'menuBtn' && menuOpen())) { hideTooltip(); return; }
  tipFor = el; tip.hidden = false; renderTooltip();
});
document.addEventListener('pointerdown', hideTooltip, true);

$('openTrain').onclick = () => togglePanel('train');
$('openBuild').onclick = () => togglePanel('build');
$('openGuide').onclick = () => togglePanel('guide');
for (const btn of document.querySelectorAll('[data-close]')) btn.onclick = closePanels;
$('guideModal').addEventListener('click', e => { if (e.target === $('guideModal')) closePanels(); });
// Touching the battlefield closes an open drawer, like tapping the map in kingdom games.
canvas.addEventListener('pointerdown', () => { if (openPanelName === 'train' || openPanelName === 'build') closePanels(); });
// Keys H / B / Esc for the panels are handled in ui/hotkeys.ts.
