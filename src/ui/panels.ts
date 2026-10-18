// @ts-nocheck
// Drawers (train / build), guide modal, battle-log strip and unit-card portraits (docs/features/hud-ui.md).
import { $, canAfford, localTeam, state } from '../core/game';
import { canvas } from '../core/view';
import { specs } from '../config/balance';
import { buyProblem } from '../sim/units';
import { SPEARMAN_ROWS, archerClips, archerSpriteSheet, cavalryClips, cavalrySpriteSheet, infantryClips, infantrySpriteSheet, scoutClips, scoutSpriteSheet, spearmanSpriteSheet } from '../render/sprites';

const PANELS = { train: 'trainDrawer', build: 'buildDrawer', guide: 'guideModal' };
const DOCK = { train: 'openTrain', build: 'openBuild' };
export let openPanelName = null;
export function openPanel(name) {
  for (const [key, id] of Object.entries(PANELS)) $(id).hidden = key !== name;
  for (const [key, id] of Object.entries(DOCK)) $(id).classList.toggle('active', key === name);
  openPanelName = name;
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
  infantry: { img: infantrySpriteSheet, rows: 4, row: t => infantryClips[t ? 'red' : 'blue'].idle.row },
  archer: { img: archerSpriteSheet, rows: 4, row: t => archerClips[t ? 'red' : 'blue'].idle.row },
  cavalry: { img: cavalrySpriteSheet, rows: 4, row: t => cavalryClips[t ? 'red' : 'blue'].idle.row },
  spearman: { img: spearmanSpriteSheet, rows: SPEARMAN_ROWS, row: t => t * 8 },
};
export function drawPortraits() {
  const team = localTeam();
  for (const el of document.querySelectorAll('canvas.portrait')) {
    const sheet = SHEETS[el.dataset.unit]; if (!sheet) continue;
    const pctx = el.getContext('2d'); pctx.clearRect(0, 0, el.width, el.height);
    const img = sheet.img; if (!img.complete || !img.naturalWidth) continue;
    const cw = img.naturalWidth / 4, ch = img.naturalHeight / sheet.rows, scale = Math.min(el.width / cw, el.height / ch) * 1.25;
    const w = cw * scale, h = ch * scale;
    pctx.drawImage(img, 0, sheet.row(team) * ch, cw, ch, (el.width - w) / 2, el.height - h * 0.92, w, h);
  }
}
for (const sheet of Object.values(SHEETS)) sheet.img.addEventListener('load', drawPortraits);

// Battle-log strip: one line, click to expand the last 12 entries.
$('chatToggle').onclick = () => $('chatStrip').classList.toggle('open');
$('feed').onclick = () => $('chatStrip').classList.add('open');

$('openTrain').onclick = () => togglePanel('train');
$('openBuild').onclick = () => togglePanel('build');
$('openGuide').onclick = () => togglePanel('guide');
for (const btn of document.querySelectorAll('[data-close]')) btn.onclick = closePanels;
$('guideModal').addEventListener('click', e => { if (e.target === $('guideModal')) closePanels(); });
// Touching the battlefield closes an open drawer, like tapping the map in kingdom games.
canvas.addEventListener('pointerdown', () => { if (openPanelName === 'train' || openPanelName === 'build') closePanels(); });
// Keys H / B / Esc for the panels are handled in ui/hotkeys.ts.
