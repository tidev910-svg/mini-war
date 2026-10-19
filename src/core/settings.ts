// @ts-nocheck
// Player preferences (docs/features/settings.md): display and control options, plus the single-player AI difficulty —
// nothing here changes the rules of a PvP match, so they stay local to this browser (localStorage) and never go through
// requestAction().
export const DEFAULT_SETTINGS = {
  quality: 'medium',      // 'low' | 'medium' | 'high' — canvas resolution cap; 'low' also skips the ground speckles
  reduceMotion: false,    // UI animations (menus, dialogs, lobby) off
  hpBars: 'always',       // 'always' | 'damaged' | 'selected' — which unit health bars are drawn
  mapLabels: true,        // mine, building and muster-yard names on the map
  unitPaths: true,        // route lines of the selected units
  territory: true,        // territory tint and borders (also toggled with T)
  uiScale: 1,             // HUD size: .9 | 1 | 1.15
  scrollSpeed: 1,         // arrow-key camera speed: .6 | 1 | 1.6
  noticeSeconds: 5,       // notice banner fades after 3 | 5 | 10 seconds
  masterVolume: .8,       // 0..1 — all sound (audio/sound.ts)
  sfxVolume: .8,          // 0..1 — battle: hits, shots, falls, building
  uiVolume: .7,           // 0..1 — interface, orders and event jingles
  musicVolume: .5,        // 0..1 — background music made in code (audio/music.ts)
  ambienceVolume: .5,     // 0..1 — wind and birds in a match
  muted: false,           // all sound off (also the M key)
  aiDifficulty: 'normal', // 'easy' | 'normal' | 'hard' — pace of the AI opponent (AI_DIFFICULTY in config/balance.ts)
};
// Canvas backing store per quality level (syncWorldMetrics() in core/view.ts): at most QUALITY_PIXELS pixels and at most
// QUALITY_MAX_SCALE canvas pixels per CSS pixel ('low' always renders below screen resolution, the browser scales it up).
export const QUALITY_PIXELS = { low: 1000000, medium: 2100000, high: 3600000 };
export const QUALITY_MAX_SCALE = { low: .75, medium: 4, high: 4 };
const STORAGE_KEY = 'miniwar.settings';

function load() {
  try { const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); return { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) }; }
  catch { return { ...DEFAULT_SETTINGS }; }
}
export let settings = load();
const listeners = [];
// Called with (key, value) after every change; the UI and renderers apply what concerns them.
export function onSettingChange(fn) { listeners.push(fn); }
export function setSetting(key, value) {
  if (!(key in DEFAULT_SETTINGS) || settings[key] === value) return;
  settings = { ...settings, [key]: value };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  for (const fn of listeners) fn(key, value);
}
export function resetSettings() { for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) setSetting(k, v); }
