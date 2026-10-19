// @ts-nocheck
// Keyboard shortcuts in the style of Age of Empires II (docs/features/controls.md): type filter 1–5 and control groups
// (Unit Control V1.0), select fortress, idle unit, stop, delete, contextual train/build keys, camera keys. Every key
// handler of the game lives here.
import { $, addLog, ended, localTeam, paused, placement, selectedFortress, setSelectedFortress, state } from '../core/game';
import { MAX_ZOOM, MIN_ZOOM, VIEW_H, VIEW_W, camX, camY, canvas, centerCameraAt, clampCamera, setCamX, setCamY, setZoom, worldToCanvas, zoom } from '../core/view';
import { specs } from '../config/balance';
import { requestAction } from '../core/actions';
import { setSetting, settings } from '../core/settings';
import { playSound } from '../audio/sound';
import { requestBuy } from '../sim/units';
import { endPlacement } from './input';
import { closeMenu, closePanels, menuOpen, openPanel, openPanelName, togglePanel } from './panels';
import { setShowTerritory, showTerritory } from './hud';
import { SELECT_KEYS, filterSelectionByType, selectUnits, updateSelectionBar } from './selection';
export { selectUnits } from './selection';

// Key table (also rendered into the guide). `ctx`: when the key applies — always, with the fortress selected or the
// train drawer open ('train'), or with the build drawer open ('build').
export const TRAIN_KEYS = { q: 'scout', w: 'infantry', e: 'archer', r: 'spearman', t: 'cavalry' };
export const BUILD_KEYS = { f: 'farm', t: 'buildTower', o: 'upgradeOutpost', u: 'upgradeFarm', p: 'turret' };
export const HOTKEYS = [
  ['1 2 3 4 5', 'Trong nhóm đang chọn, chỉ giữ trinh sát / lính / lính giáo / cung thủ / kỵ binh (không có loại đó: giữ nguyên)'],
  ['Thanh quân (dưới)', 'Bấm biểu tượng: chỉ chọn loại đó · Shift + bấm: thêm / bỏ loại đó'],
  ['Ctrl + 1…9', 'Lưu nhóm quân đang chọn vào số đó'],
  ['F1…F9', 'Gọi nhóm quân đã lưu; bấm hai lần liền: camera tới nhóm'],
  ['Shift + F1…F9', 'Thêm nhóm đó vào lựa chọn hiện tại'],
  ['H', 'Chọn pháo đài, đưa camera về và mở bảng Huấn luyện'],
  ['Q W E R T', 'Khi pháo đài đang chọn / bảng Huấn luyện mở: trinh sát, lính, cung thủ, lính giáo, kỵ binh'],
  ['B', 'Mở bảng Xây dựng'],
  ['F T O U P', 'Trong bảng Xây dựng: nông trại, tháp, tiền đồn, nâng cấp nông trại, pháo thứ hai'],
  [',', 'Chọn lần lượt quân đang rảnh (đứng yên, không lệnh) và đưa camera tới'],
  ['Ctrl + A', 'Chọn tất cả quân của mình'],
  ['Nhấp đúp vào quân', 'Chọn mọi quân cùng loại đang trên màn hình'],
  ['A', 'Nhóm đang chọn tấn công'],
  ['S', 'Nhóm đang chọn dừng lại'],
  ['Delete', 'Loại bỏ quân đang chọn (không hoàn tiền)'],
  ['Space', 'Đưa camera tới quân đang chọn (không chọn gì: tới pháo đài)'],
  ['Mũi tên / + −', 'Cuộn bản đồ (Shift: nhanh gấp đôi) / phóng to, thu nhỏ'],
  ['T', 'Ẩn/hiện ranh giới vùng (khi không dùng làm phím huấn luyện/xây)'],
  ['M', 'Bật / tắt âm thanh'],
  ['F10 · Pause', 'Tạm dừng / tiếp tục'],
  ['?', 'Mở hướng dẫn'],
  ['Enter (ở sảnh)', 'Vào trận với AI'],
  ['Esc', 'Đóng menu → huỷ đặt công trình → đóng bảng → bỏ chọn'],
];

// The guide's shortcut table is built from HOTKEYS so it never drifts from the handlers.
{ const table = $('hotkeyTable'); if (table) for (const [keys, what] of HOTKEYS) { const tr = document.createElement('tr'); const k = document.createElement('th'); k.textContent = keys; const d = document.createElement('td'); d.textContent = what; tr.append(k, d); table.append(tr); } }

const GROUP_DOUBLE_TAP_MS = 400;
// Control groups are local to this browser: unit ids per group 1–9 (saved with Ctrl + digit, recalled with F1–F9).
const groups = Array.from({ length: 10 }, () => []);
let lastGroupTap = { digit: -1, at: 0 }, idleCursor = 0;

const ownAlive = () => state.units.filter(u => u.team === localTeam() && u.hp > 0);
const chosen = () => ownAlive().filter(u => u.selected);
function centerOn(units) { if (!units.length) return; let x = 0, y = 0; for (const u of units) { x += u.x; y += u.y; } centerCameraAt(x / units.length, y / units.length); }
const typing = () => ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
const modeScreenOpen = () => !$('modeScreen').classList.contains('hidden');

function saveGroup(digit) {
  const ids = chosen().map(u => u.id);
  groups[digit] = ids; addLog(ids.length ? `Đã lưu ${ids.length} quân vào nhóm ${digit} (gọi lại: F${digit}).` : `Đã xoá nhóm ${digit}.`);
}
function recallGroup(e, digit) {
  const members = ownAlive().filter(u => groups[digit].includes(u.id));
  groups[digit] = members.map(u => u.id);
  if (!members.length) { addLog(`Nhóm ${digit} chưa có quân (Ctrl + ${digit} để lưu).`); return; }
  selectUnits(members, e.shiftKey); updateSelectionBar();
  const now = performance.now();
  if (lastGroupTap.digit === digit && now - lastGroupTap.at < GROUP_DOUBLE_TAP_MS) centerOn(members);
  lastGroupTap = { digit, at: now };
}
function selectFortress() {
  const base = state.bases.find(b => b.team === localTeam()); if (!base) return;
  selectUnits([]); setSelectedFortress(base); centerCameraAt(base.x, base.y); openPanel('train');
}
function nextIdle() {
  const idle = ownAlive().filter(u => u.order !== 'move' && u.order !== 'attack' && !u.moving).sort((a, b) => a.id - b.id);
  if (!idle.length) { addLog('Không có quân nào đang rảnh.'); return; }
  const u = idle.find(v => v.id > idleCursor) || idle[0]; idleCursor = u.id;
  selectUnits([u]); centerCameraAt(u.x, u.y);
}
// Double-click a unit: select every unit of the same type that is on screen.
canvas.addEventListener('dblclick', e => {
  const rect = canvas.getBoundingClientRect(), px = (e.clientX - rect.left) * VIEW_W / rect.width, py = (e.clientY - rect.top) * VIEW_H / rect.height;
  let hit = null, best = 24 * VIEW_W / rect.width;
  for (const u of ownAlive()) { const p = worldToCanvas(u.x, u.y), d = Math.hypot(p.x - px, p.y - py); if (d < best) { best = d; hit = u; } }
  if (!hit) return;
  const same = ownAlive().filter(u => { const p = worldToCanvas(u.x, u.y); return u.type === hit.type && p.x >= 0 && p.y >= 0 && p.x <= VIEW_W && p.y <= VIEW_H; });
  selectUnits(same); updateSelectionBar(); addLog(`Đã chọn ${same.length} ${specs[hit.type].name.toLowerCase()} trên màn hình.`);
});

document.addEventListener('keydown', e => {
  if (typing()) return;
  // Lobby: Enter starts a match against the AI, Esc closes the guide opened from the lobby.
  if (modeScreenOpen()) {
    if (e.key === 'Escape' && openPanelName) closePanels();
    else if (e.key === 'Enter' && !openPanelName && $('modeHome').style.display !== 'none' && !document.activeElement?.closest?.('button')) { e.preventDefault(); $('modeAI').click(); }
    return;
  }
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  // Camera keys work anywhere (not only with the canvas focused).
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_'].includes(key)) {
    e.preventDefault();
    const step = (e.shiftKey ? 360 : 180) * settings.scrollSpeed / zoom;
    if (key === '+' || key === '=') setZoom(Math.min(MAX_ZOOM, zoom * 1.15));
    if (key === '-' || key === '_') setZoom(Math.max(MIN_ZOOM, zoom / 1.15));
    if (key === 'ArrowLeft') setCamX(camX - step); if (key === 'ArrowRight') setCamX(camX + step);
    if (key === 'ArrowUp') setCamY(camY - step); if (key === 'ArrowDown') setCamY(camY + step);
    clampCamera(); return;
  }
  // While the leave-match confirmation is open only Esc (above order: closes it) and its buttons act.
  if (openPanelName === 'confirm' && key !== 'Escape') return;
  if (key === 'F10' || key === 'Pause') { e.preventDefault(); $('pause').click(); return; }
  if (key === '?') { e.preventDefault(); togglePanel('guide'); return; }
  // F1–F9 recall control groups (Shift adds the group); the browser's own F-key actions (help, find, reload…) are blocked.
  const fGroup = /^F([1-9])$/.exec(key)?.[1];
  if (fGroup) { e.preventDefault(); if (!e.ctrlKey && !e.metaKey && !e.altKey) recallGroup(e, Number(fGroup)); return; }
  if (key === 'Escape') {
    if (menuOpen()) closeMenu();
    else if (placement) { endPlacement(); addLog('Đã hủy đặt công trình.'); }
    else if (openPanelName) closePanels();
    else { selectUnits([]); }
    return;
  }
  // Ctrl + 1–9 saves a control group; plain 1–5 (top row or numpad) filters the selection by unit type.
  const digit = Number(/^(?:Digit|Numpad)([0-9])$/.exec(e.code)?.[1] ?? NaN);
  if (digit >= 1 && digit <= 9 && (e.ctrlKey || e.metaKey) && !e.altKey) { e.preventDefault(); saveGroup(digit); return; }
  if (SELECT_KEYS[digit] && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) { e.preventDefault(); filterSelectionByType(SELECT_KEYS[digit]); return; }
  if ((e.ctrlKey || e.metaKey) && key === 'a') { e.preventDefault(); const all = ownAlive(); selectUnits(all); updateSelectionBar(); addLog(`Đã chọn toàn bộ ${all.length} quân.`); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (ended) return;
  // Contextual keys first: training with the fortress selected or the train drawer open, building with the build drawer open.
  if ((openPanelName === 'train' || selectedFortress) && TRAIN_KEYS[key]) { requestBuy(TRAIN_KEYS[key]); return; }
  if (openPanelName === 'build' && BUILD_KEYS[key]) { $(BUILD_KEYS[key]).click(); return; }
  const ids = chosen().map(u => u.id);
  switch (key) {
    case 'h': selectFortress(); break;
    case 'b': togglePanel('build'); break;
    case ',': nextIdle(); break;
    case 'a': if (ids.length) { playSound('order.attack'); requestAction('attack', { ids }); } break;
    case 'm': setSetting('muted', !settings.muted); addLog(settings.muted ? 'Đã tắt âm thanh (M để bật lại).' : 'Đã bật âm thanh.'); break;
    case 's': if (ids.length) { requestAction('stop', { ids }); addLog(`${ids.length} quân dừng lại.`); } break;
    case 'Delete': if (ids.length) requestAction('delete', { ids }); break;
    case ' ': e.preventDefault(); { const sel = chosen(); if (sel.length) centerOn(sel); else { const b = state.bases.find(v => v.team === localTeam()); if (b) centerCameraAt(b.x, b.y); } } break;
    case 't': setShowTerritory(!showTerritory); break;
  }
});
