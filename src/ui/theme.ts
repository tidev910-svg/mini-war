// @ts-nocheck
// Writes the design tokens (config/theme.ts) to :root as CSS variables and points --faction-* at the local side's
// colours, so switching to Quân Đỏ re-colours the whole HUD by changing one attribute (docs/features/hud-ui.md).
import { TEAM_COLORS, THEME } from '../config/theme';

const root = document.documentElement;
for (const [name, value] of Object.entries(THEME)) root.style.setProperty('--' + name, value);
for (const [team, c] of Object.entries(TEAM_COLORS)) for (const k of ['primary', 'light', 'dark']) root.style.setProperty(`--team${team}-${k}`, c[k]);

// Local side → faction colours. data-faction lets CSS add per-side touches if ever needed.
export function setFactionTheme(team) {
  const c = TEAM_COLORS[team] || TEAM_COLORS[0];
  for (const k of ['primary', 'light', 'dark']) root.style.setProperty('--faction-' + k, c[k]);
  root.dataset.faction = String(team);
}
setFactionTheme(0);
