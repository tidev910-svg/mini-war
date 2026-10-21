// @ts-nocheck
// Loads the game into jsdom for unit tests: the page markup from index.html, a no-op 2D canvas (jsdom has none),
// then every module except main.ts (so no frame loop starts). Returns one object with all exports, read live.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MODULES = ['config/map', 'config/balance', 'config/theme', 'config/visuals', 'config/formation', 'ui/theme', 'core/game', 'core/view', 'core/match', 'core/actions',
  'map/terrain', 'map/regions', 'map/bases', 'map/paths', 'sim/movement', 'sim/economy', 'sim/units', 'sim/fog', 'sim/buildings', 'sim/territory', 'sim/combat', 'sim/stats', 'sim/formation', 'sim/garrison',
  'ai/attack', 'ai/enemy', 'net/peer', 'net/snapshot', 'ui/modeScreen', 'ui/hud', 'ui/input', 'render/sprites', 'render/territory', 'render/units',
  'render/buildings', 'render/terrain', 'render/flags', 'render/fog', 'render/minimap', 'render/intel', 'render/fx', 'render/paths', 'render/draw', 'ui/panels', 'ui/selection', 'ui/results', 'ui/info', 'ui/formation', 'ui/hotkeys', 'ui/settings', 'core/settings', 'config/audio', 'audio/instruments', 'audio/synth', 'audio/music', 'audio/sound'];

// A 2D context whose methods do nothing; pixel buffers are real so fog/tint code can fill them.
function fakeContext(canvas) {
  const imageData = (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)) });
  const special = {
    canvas,
    createImageData: (w, h) => (typeof w === 'object' ? imageData(w.width, w.height) : imageData(w, h)),
    getImageData: (x, y, w, h) => imageData(w, h),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createPattern: () => ({}),
    measureText: text => ({ width: String(text).length * 6 }),
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    isPointInPath: () => false,
  };
  const store = {};
  return new Proxy(special, {
    get: (t, k) => (k in t ? t[k] : k in store ? store[k] : () => {}),
    set: (t, k, v) => { store[k] = v; return true; },
  });
}

let loaded = null;
export async function loadGame() {
  if (loaded) return loaded;
  const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');
  document.body.innerHTML = html.slice(html.indexOf('<body') >= 0 ? html.indexOf('>', html.indexOf('<body')) + 1 : 0, html.lastIndexOf('</body>'));
  HTMLCanvasElement.prototype.getContext = function () { return (this.__ctx ??= fakeContext(this)); };
  window.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  globalThis.requestAnimationFrame ??= () => 0;
  const mods = [];
  const loaders = import.meta.glob('../../src/**/*.ts');
  for (const m of MODULES) mods.push(await loaders[`../../src/${m}.ts`]());
  loaded = new Proxy({}, { get: (_, k) => { for (const m of mods) if (k in m) return m[k]; return undefined; } });
  return loaded;
}

// Start a match that no AI drives: tests step update() themselves.
export function quietMatch(g) {
  g.fresh();
  g.setMode('test');
  g.setGameStarted(true);
  g.state.units = [];
  return g.state;
}
