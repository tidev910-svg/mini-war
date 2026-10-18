import { defineConfig } from 'vite';
import { TEAM_COLORS, THEME } from './src/config/theme';

// The design tokens (src/config/theme.ts) are written into index.html as a <style> block, so the very first paint already
// has every CSS variable: no unstyled flash while the game's modules load. src/ui/theme.ts sets the same values again at
// runtime and switches --faction-* to the local side (docs/features/hud-ui.md).
function themeTokens() {
  const vars = Object.entries(THEME).map(([k, v]) => `--${k}:${v}`);
  for (const [team, c] of Object.entries(TEAM_COLORS)) for (const k of ['primary', 'light', 'dark']) vars.push(`--team${team}-${k}:${c[k]}`);
  for (const k of ['primary', 'light', 'dark']) vars.push(`--faction-${k}:${TEAM_COLORS[0][k]}`);
  return `:root{${vars.join(';')}}`;
}

// GitHub Pages serves the build at https://tidev910-svg.github.io/mini-war/, so production paths start with /mini-war/
// (asset URLs use import.meta.env.BASE_URL). The dev server and the smoke tests stay at /.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/mini-war/' : '/',
  plugins: [{
    name: 'mini-war-theme-tokens',
    transformIndexHtml: () => [{ tag: 'style', attrs: { id: 'theme-tokens' }, children: themeTokens(), injectTo: 'head-prepend' }],
  }],
}));
