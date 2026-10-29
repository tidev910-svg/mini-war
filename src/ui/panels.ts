// @ts-nocheck
// Drawers (train / build), guide and confirm modals, game menu, tooltips, notice banner and unit-card portraits (docs/features/hud-ui.md).
import { $, canAfford, localTeam, state } from '../core/game';
import { canvas } from '../core/view';
import { settings } from '../core/settings';
import { playSound } from '../audio/sound';
import { specs } from '../config/balance';
import { buyProblem } from '../sim/units';
import { SPEARMAN_ROWS, archerClips, archerPortraits, archerSpriteSheet, CAVALRY_ROWS, CAVALRY_MOTION_COLUMNS, cavalryClips, cavalrySpriteSheet, infantryClips, infantryPortraits, infantrySpriteSheet, scoutClips, scoutSpriteSheet, spearmanSpriteSheet } from '../render/sprites';

const PANELS = { train: 'trainDrawer', build: 'buildDrawer', guide: 'guideModal', confirm: 'confirmModal', settings: 'settingsModal' };
// Show / hide with the open and close animations of style.css. `hidden` changes at once (so code and tests see the new
// state immediately); while `.closing` is set the element stays painted and plays its exit animation, then disappears.
export function showAnimated(el) { el.classList.remove('closing'); el.hidden = false; }
export function hideAnimated(el) {
  if (el.hidden) return;
  el.hidden = true;
  if (settings.reduceMotion || matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
  el.classList.add('closing');
  const done = () => el.classList.remove('closing');
  el.addEventListener('animationend', e => { if (e.target === el) done(); }, { once: true }); setTimeout(done, 400);
}
const DOCK = { train: 'openTrain', build: 'openBuild' };
export let openPanelName = null;
const MODALS = new Set(['guide', 'confirm', 'settings']);
export function openPanel(name) {
  // Sounds: dialogs open and close like a book, drawers with the interface open/close clicks.
  const prev = openPanelName;
  if (name !== prev) {
    if (prev) playSound(MODALS.has(prev) ? 'ui.dialogClose' : 'ui.close');
    if (name) playSound(MODALS.has(name) ? 'ui.dialogOpen' : 'ui.open');
  }
  for (const [key, id] of Object.entries(PANELS)) key === name ? showAnimated($(id)) : hideAnimated($(id));
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

// Portrait = first idle frame of the unit's sprite sheet in the local side's colour (sheets are 4 columns wide).
const SHEETS = {
  scout: { img: scoutSpriteSheet, rows: 4, row: t => scoutClips[t ? 'red' : 'blue'].idle.row },
  infantry: { img: infantrySpriteSheet, portraits: infantryPortraits, rows: 4, row: t => infantryClips[t ? 'red' : 'blue'].idle.row },
  archer: { img: archerSpriteSheet, portraits: archerPortraits, rows: 4, row: t => archerClips[t ? 'red' : 'blue'].idle.row },
  cavalry: { img: cavalrySpriteSheet, rows: CAVALRY_ROWS, columns: CAVALRY_MOTION_COLUMNS, row: t => cavalryClips[t ? 'red' : 'blue'].idle.row, column: t => cavalryClips[t ? 'red' : 'blue'].idle.column },
  spearman: { img: spearmanSpriteSheet, rows: SPEARMAN_ROWS, row: t => t * 8 },
};
export function drawPortraits() {
  const team = localTeam();
  for (const el of document.querySelectorAll('canvas.portrait')) {
    const sheet = SHEETS[el.dataset.unit]; if (!sheet) continue;
    const pctx = el.getContext('2d'); pctx.clearRect(0, 0, el.width, el.height);
    const portrait = sheet.portraits?.[team ? 'red' : 'blue'];
    if (portrait?.complete && portrait.naturalWidth) { pctx.drawImage(portrait, 0, 0, el.width, el.height); continue; }
    const img = sheet.img; if (!img.complete || !img.naturalWidth) continue;
    const cw = img.naturalWidth / (sheet.columns || 4), ch = img.naturalHeight / sheet.rows, scale = Math.min(el.width / cw, el.height / ch) * 1.25;
    const w = cw * scale, h = ch * scale;
    pctx.drawImage(img, (sheet.column?.(team) || 0) * cw, sheet.row(team) * ch, cw, ch, (el.width - w) / 2, el.height - h * 0.92, w, h);
  }
}
for (const sheet of Object.values(SHEETS)) {
  sheet.img?.addEventListener('load', drawPortraits);
  for (const portrait of Object.values(sheet.portraits || {})) portrait.addEventListener('load', drawPortraits);
}

// Notice banner: shows the newest log line, fades after settings.noticeSeconds; the scroll button opens the last 12 entries.
// A 'danger' line (under attack, losses) gives the banner a red rim while it is the newest.
let noticeTimer = 0;
function showNotice() {
  const strip = $('chatStrip'), first = $('feed').firstElementChild;
  strip.classList.remove('idle'); strip.classList.toggle('alert', !!first?.classList.contains('tone-danger'));
  clearTimeout(noticeTimer); noticeTimer = setTimeout(() => strip.classList.add('idle'), settings.noticeSeconds * 1000);
}
new MutationObserver(showNotice).observe($('feed'), { childList: true });
$('chatToggle').onclick = () => { const strip = $('chatStrip'); strip.classList.toggle('open'); if (!strip.classList.contains('open')) showNotice(); };
$('feed').onclick = () => $('chatStrip').classList.add('open');

// Game menu (side rail): pause, guide, hide HUD, leave. Closes on outside click, Esc or after picking an item.
export function closeMenu() { if (!$('gameMenu').hidden) playSound('ui.close'); hideAnimated($('gameMenu')); $('menuBtn').setAttribute('aria-expanded', 'false'); }
export function toggleMenu() { const open = $('gameMenu').hidden; if (open) { showAnimated($('gameMenu')); hideTooltip(); playSound('ui.open'); } else { hideAnimated($('gameMenu')); playSound('ui.close'); } $('menuBtn').setAttribute('aria-expanded', String(open)); }
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

// Click sound for ordinary buttons; buttons with their own sound (menu, dialogs, drawers, orders, tabs, switches) are left out.
const CLICKY = '.card-btn, .lane-buy, .lobby-btn, .menu-item, .btn, .segmented button, #toggleTerritory, #fullscreen, #chatToggle';
document.addEventListener('click', e => { const b = e.target.closest?.(CLICKY); if (b && !b.disabled) playSound('ui.click'); }, true);
