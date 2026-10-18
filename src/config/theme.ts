// @ts-nocheck
// Design tokens of the "heraldry & banners" UI (docs/features/hud-ui.md). The single place for UI colours, font sizes and
// spacing: ui/theme.ts writes every token to :root as a CSS variable (--ui-bg-panel, --fs-md…), so style.css only uses
// var(--…), and the canvas renderers read the same values from here. Data only.

// Side colours. The local player's side is the "faction": --faction-* point at TEAM_COLORS[localTeam()].
export const TEAM_COLORS = {
  0: { primary: '#2F5DB8', light: '#6F95E0', dark: '#1A3570', name: 'QUÂN XANH' },
  1: { primary: '#B03030', light: '#E07070', dark: '#6E1818', name: 'QUÂN ĐỎ' },
};

export const THEME = {
  // Backgrounds and surfaces
  'ui-bg-panel': '#16213A',
  'ui-bg-panel-glass': 'rgba(22,33,58,.92)',
  'ui-bg-panel-soft': '#1E2C4A',
  'ui-bg-deep': '#0E1628',
  'ui-backdrop': 'rgba(6,9,16,.66)',
  'ui-shadow': 'rgba(0,0,0,.55)',
  'ui-fog': '#0A0E16',
  // Metal: --gold only rims the important parts (main actions, player panel); --gold-muted for thin ordinary rims.
  'gold': '#D8B45A',
  'gold-muted': '#8A7445',
  'gold-ink': '#2A1E08',
  // Text
  'text-main': '#FFF5DC',
  'text-sub': '#C8D4F0',
  'text-on-map-stroke': '#0A0E16',
  // States
  'danger': '#D94A3A',
  'danger-dark': '#7A2018',
  'success': '#4FB36A',
  'resource': '#F2C94C',
  'warning': '#E8A23A',
  // Typography (fonts that ship every Vietnamese glyph on Windows / macOS / Linux, nothing downloaded)
  'font-title': '"Palatino Linotype","Book Antiqua","Noto Serif","Times New Roman",serif',
  'font-ui': 'system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans",sans-serif',
  'fs-xs': '12px', 'fs-sm': '13px', 'fs-md': '14px', 'fs-lg': '16px', 'fs-xl': '18px', 'fs-2xl': '24px', 'fs-hero': '30px',
  // Spacing and radius
  'sp-1': '4px', 'sp-2': '8px', 'sp-3': '12px', 'sp-4': '16px', 'sp-5': '24px',
  'radius-sm': '6px', 'radius-md': '10px',
  // Border tiers: 1 = main action shields, 2 = player panel, 3 = resources, minimap, rail buttons, notices.
  'border-1': '3px', 'border-2': '2px', 'border-3': '1px',
};

// Canvas overlays on the battlefield (labels, health bars, borders, minimap) use these, built from the tokens above.
export const MAP_UI = {
  labelMinPx: 12,            // map labels never render smaller than this on screen
  healthBarPx: 6,            // fortress / building health bar height on screen
  borderSmoothTiles: 2,      // border polylines are resampled every N tiles before rounding the corners
  fogNoise: 9,               // ± brightness of the fog's mottling per tile
};

// '#RRGGBB' → [r, g, b] for image-data writers (fog, minimap, territory tint).
export function hexRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
// '#RRGGBB' + alpha 0..1 → 'rgba(…)'.
export function hexA(hex, a) { const [r, g, b] = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; }
// Health colour from --success (full) to --danger (empty), through --resource at half.
export function healthColor(frac) {
  const f = Math.max(0, Math.min(1, frac)), mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const c = f > .5 ? mix(hexRgb(THEME.resource), hexRgb(THEME.success), (f - .5) * 2) : mix(hexRgb(THEME.danger), hexRgb(THEME.resource), f * 2);
  return `rgb(${c.join(',')})`;
}
