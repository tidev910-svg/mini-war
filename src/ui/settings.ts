// @ts-nocheck
// Settings dialog (docs/features/settings.md): tabs and controls built from SETTINGS_SCHEMA, values in core/settings.ts.
// Choice rows are segmented buttons, on/off rows are switches; every change is saved at once and applied live.
import { $ } from '../core/game';
import { syncWorldMetrics } from '../core/view';
import { DEFAULT_SETTINGS, onSettingChange, resetSettings, setSetting, settings } from '../core/settings';
import { openPanel } from './panels';
import { setShowTerritory, showTerritory } from './hud';
import { playSound } from '../audio/sound';

export const SETTINGS_SCHEMA = [
  { id: 'graphics', title: 'Đồ hoạ', rows: [
    { key: 'quality', label: 'Chất lượng hình', hint: 'Độ phân giải của bản đồ. "Thấp" bỏ chi tiết mặt đất để chạy mượt trên máy yếu.', options: [['low', 'Thấp'], ['medium', 'Vừa'], ['high', 'Cao']] },
    { key: 'reduceMotion', label: 'Hiệu ứng chuyển động', hint: 'Hoạt ảnh khi mở menu, bảng, hộp thoại và sảnh.', options: [[false, 'Đầy đủ'], [true, 'Giảm']] },
    { key: 'combatVfxEnabled', label: 'Hiệu ứng chiến đấu', hint: 'Tư thế ra đòn, lóe sáng khi trúng đòn và bụi chân ngựa; chỉ ảnh hưởng hình ảnh.', toggle: true },
  ] },
  { id: 'display', title: 'Hiển thị', rows: [
    { key: 'hpBars', label: 'Thanh máu quân', hint: 'Thanh máu của pháo đài và công trình luôn hiện khi bị hư.', options: [['always', 'Luôn hiện'], ['damaged', 'Khi bị thương'], ['selected', 'Khi chọn']] },
    { key: 'mapLabels', label: 'Nhãn mỏ và công trình', hint: 'Tên mỏ, công trình, sân tập kết trên bản đồ (nhãn pháo đài và cột cờ luôn hiện).', toggle: true },
    { key: 'unitPaths', label: 'Đường đi của quân đang chọn', hint: 'Nét đứt và mũi tên tới đích.', toggle: true },
    { key: 'territory', label: 'Ranh giới vùng', hint: 'Màu lãnh thổ và đường biên (phím T).', toggle: true },
    { key: 'uiScale', label: 'Cỡ giao diện', hint: 'Phóng to hoặc thu nhỏ các bảng nổi trên bản đồ.', options: [[.9, '90%'], [1, '100%'], [1.15, '115%']] },
  ] },
  { id: 'audio', title: 'Âm thanh', rows: [
    { key: 'muted', label: 'Tắt tiếng', hint: 'Tắt mọi âm thanh (phím M).', toggle: true },
    { key: 'masterVolume', label: 'Âm lượng tổng', hint: 'Áp dụng cho mọi âm thanh.', range: true, preview: 'ui.confirm' },
    { key: 'sfxVolume', label: 'Trận đánh', hint: 'Kiếm chạm, tên bay, pháo, quân ngã, xây dựng — chỉ nghe trong khung nhìn.', range: true, preview: 'combat.clash' },
    { key: 'uiVolume', label: 'Giao diện & sự kiện', hint: 'Bấm nút, ra lệnh, chiếm cờ, cảnh báo, thắng thua.', range: true, preview: 'event.built' },
    { key: 'musicVolume', label: 'Nhạc nền', hint: 'Trống trận và đàn, dồn dập hơn khi đang giao tranh trong tầm nhìn.', range: true },
    { key: 'ambienceVolume', label: 'Tiếng môi trường', hint: 'Gió và chim trong trận; nhỏ dần khi thu nhỏ bản đồ.', range: true },
  ] },
  { id: 'controls', title: 'Điều khiển', rows: [
    { key: 'aiDifficulty', label: 'Độ khó AI', hint: 'Chơi với AI: tốc độ ra quân, thời điểm và quy mô các đợt tấn công. Đổi giữa trận có hiệu lực ngay.', options: [['easy', 'Dễ'], ['normal', 'Thường'], ['hard', 'Khó']] },
    { key: 'scrollSpeed', label: 'Tốc độ cuộn bản đồ', hint: 'Khi dùng phím mũi tên (giữ Shift để nhanh gấp đôi).', options: [[.6, 'Chậm'], [1, 'Vừa'], [1.6, 'Nhanh']] },
    { key: 'noticeSeconds', label: 'Thông báo tự ẩn sau', hint: 'Dải thông báo phía dưới; lịch sử vẫn mở được bằng nút cuộn giấy.', options: [[3, '3 giây'], [5, '5 giây'], [10, '10 giây']] },
  ] },
];

let tab = SETTINGS_SCHEMA[0].id;
function renderTabs() {
  const nav = $('settingsTabs'); nav.innerHTML = '';
  SETTINGS_SCHEMA.forEach((t, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'settings-tab'; b.setAttribute('role', 'tab'); b.textContent = t.title; b.dataset.tab = t.id;
    b.setAttribute('aria-selected', String(t.id === tab)); b.style.setProperty('--i', i);
    b.onclick = () => { if (tab !== t.id) { tab = t.id; playSound('ui.tab'); renderTabs(); renderPage(); } };
    nav.append(b);
  });
}
function renderPage() {
  const body = $('settingsBody'), page = document.createElement('div'); page.className = 'settings-page';
  for (const [i, row] of SETTINGS_SCHEMA.find(t => t.id === tab).rows.entries()) {
    const r = document.createElement('div'); r.className = 'settings-row'; r.style.setProperty('--i', i);
    const text = document.createElement('div'); text.className = 'settings-text';
    const label = document.createElement('strong'); label.textContent = row.label; const hint = document.createElement('small'); hint.textContent = row.hint; text.append(label, hint);
    const ctl = document.createElement('div'); ctl.className = 'settings-control'; ctl.dataset.key = row.key;
    if (row.range) { // 0–100 % slider; releasing it plays a short preview on that bus
      const input = document.createElement('input'); input.type = 'range'; input.min = '0'; input.max = '100'; input.step = '5'; input.className = 'volume'; input.setAttribute('aria-label', row.label);
      const out = document.createElement('output'); out.className = 'volume-value';
      input.oninput = () => setSetting(row.key, Number(input.value) / 100);
      input.onchange = () => playSound(row.preview);
      ctl.classList.add('range'); ctl.append(input, out);
    } else if (row.toggle) {
      const sw = document.createElement('button'); sw.type = 'button'; sw.className = 'switch'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-label', row.label);
      sw.onclick = () => { setSetting(row.key, !settings[row.key]); playSound('ui.toggle'); }; ctl.append(sw);
    } else {
      ctl.classList.add('segmented'); ctl.setAttribute('role', 'radiogroup'); ctl.setAttribute('aria-label', row.label);
      for (const [value, name] of row.options) {
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.textContent = name; b.dataset.value = JSON.stringify(value);
        b.onclick = () => setSetting(row.key, value); ctl.append(b);
      }
    }
    r.append(text, ctl); page.append(r);
  }
  body.replaceChildren(page); syncControls();
}
// Reflect current values on the controls (selected segment, switch state, sliding thumb position).
function syncControls() {
  for (const ctl of document.querySelectorAll('#settingsBody .settings-control')) {
    const v = settings[ctl.dataset.key];
    if (ctl.classList.contains('range')) {
      const input = ctl.querySelector('input'), pct = Math.round(v * 100);
      if (Number(input.value) !== pct) input.value = String(pct);
      input.style.setProperty('--fill', pct + '%'); ctl.querySelector('output').textContent = pct + '%';
    } else if (ctl.classList.contains('segmented')) {
      const buttons = [...ctl.children], idx = Math.max(0, buttons.findIndex(b => JSON.parse(b.dataset.value) === v));
      buttons.forEach((b, i) => b.setAttribute('aria-checked', String(i === idx)));
      ctl.style.setProperty('--n', buttons.length); ctl.style.setProperty('--sel', idx);
    } else ctl.firstChild.setAttribute('aria-checked', String(!!v));
  }
}
let savedTimer = 0;
function flashSaved() {
  const el = $('settingsSaved'); el.textContent = 'Đã lưu'; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
  clearTimeout(savedTimer); savedTimer = setTimeout(() => { el.textContent = 'Tự động lưu trên trình duyệt này'; }, 1400);
}

// Apply a setting to the page (renderers read `settings` directly every frame).
function apply(key, value) {
  const root = document.documentElement;
  if (key === 'reduceMotion') root.classList.toggle('reduce-motion', !!value);
  if (key === 'uiScale') root.style.setProperty('--ui-scale', String(value));
  if (key === 'quality') syncWorldMetrics();
  if (key === 'territory' && showTerritory !== value) setShowTerritory(value);
}
for (const key of Object.keys(DEFAULT_SETTINGS)) apply(key, settings[key]);
onSettingChange((key, value) => { apply(key, value); syncControls(); if (!$('settingsModal').hidden) flashSaved(); });

export function openSettings() { renderTabs(); renderPage(); openPanel('settings'); }
$('openSettings').onclick = openSettings;
$('lobbySettings').onclick = openSettings;
$('settingsReset').onclick = resetSettings;
$('settingsModal').addEventListener('click', e => { if (e.target === $('settingsModal')) openPanel(null); });
