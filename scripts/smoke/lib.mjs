// Drives a headless Chrome through the DevTools protocol against the running dev server (pnpm dev).
// game(expr) runs `expr` (a function body) in the page with every module's exports in scope, read live:
// e.g. `fresh();return state.regions.length`. Exported `let`s are read-only from outside; use their setters (setPaused…).
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export const URL = process.env.MINI_WAR_URL || 'http://127.0.0.1:5173/';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const sleep = ms => new Promise(r => setTimeout(r, ms));

// Every module under src/, so game() can see all exports. Keep in sync with the folders in docs/architecture.md.
const MODULES = ['config/map', 'config/balance', 'config/theme', 'config/visuals', 'config/formation', 'ui/theme', 'core/game', 'core/view', 'core/match', 'core/actions',
  'map/terrain', 'map/regions', 'map/bases', 'map/paths', 'sim/movement', 'sim/economy', 'sim/units', 'sim/fog', 'sim/buildings', 'sim/territory', 'sim/combat', 'sim/stats', 'sim/formation', 'sim/garrison',
  'ai/attack', 'ai/enemy', 'net/peer', 'net/snapshot', 'ui/modeScreen', 'ui/hud', 'ui/input', 'render/sprites', 'render/territory', 'render/units',
  'render/buildings', 'render/terrain', 'render/flags', 'render/fog', 'render/minimap', 'render/intel', 'render/fx', 'render/paths', 'render/draw', 'ui/panels', 'ui/selection', 'ui/results', 'ui/info', 'ui/formation', 'ui/hotkeys', 'ui/settings', 'core/settings', 'config/audio', 'audio/instruments', 'audio/synth', 'audio/music', 'audio/sound'];

// The Chrome profile lives in the OS temp folder: inside the project, Vite's file watcher crashes on Chrome's locked files.
export async function launch({ port, outDir, size = '1400,1000', url = URL }) {
  mkdirSync(outDir, { recursive: true });
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), 'mini-war-smoke', 'profile-' + port)}`,
    `--window-size=${size}`, '--no-first-run', '--autoplay-policy=no-user-gesture-required', url], { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 160 && !targets.find(t => t.type === 'page'); i++) { await sleep(250); try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch {} }
  const page = targets.find(t => t.type === 'page');
  if (!page) { proc.kill(); throw new Error('Chrome did not start on port ' + port); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map(); const errors = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
    return r.result?.result?.value;
  };
  const page$ = expr => evaluate(expr);
  const game = async body => {
    // Import each module by the exact URL the page loaded (Vite adds ?t=… to files edited while the server runs);
    // a bare '/src/x.ts' would load a second copy of the game with its own state and event handlers.
    const loader = `(async()=>{if(!window.__smokeScope){const loaded=performance.getEntriesByType('resource').map(e=>e.name);
      const url=m=>loaded.find(n=>new URL(n).pathname==='/src/'+m+'.ts')||'/src/'+m+'.ts';
      const mods=await Promise.all(${JSON.stringify(MODULES)}.map(m=>import(url(m))));
      window.__smokeScope=new Proxy({},{has:(_,k)=>mods.some(m=>k in m),get:(_,k)=>{for(const m of mods)if(k in m)return m[k];}});}
      with(window.__smokeScope){return JSON.stringify((()=>{${body}})());}})()`;
    const v = await evaluate(loader); return v === undefined ? undefined : JSON.parse(v);
  };
  const shot = async (dir, name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(dir, name + '.png'), Buffer.from(r.result.data, 'base64')); };
  const close = () => { try { ws.close(); } catch {} proc.kill(); };
  return { send, page: page$, game, shot, errors, close };
}

// Wait for the page, then start an AI match (the mode screen covers the canvas until a mode is chosen).
export async function startAI(c) {
  await sleep(2500);
  await c.page("document.getElementById('modeAI').click()");
  await sleep(800);
}

// Tiny assertion helper: collects failures instead of stopping at the first one.
export function checker(name) {
  const fails = [];
  return {
    ok(cond, msg, detail) { if (!cond) fails.push(msg + (detail === undefined ? '' : ' → ' + JSON.stringify(detail))); },
    report(extra = {}) {
      console.log(`${fails.length ? '✗' : '✓'} ${name}`); for (const f of fails) console.log('   - ' + f);
      for (const [k, v] of Object.entries(extra)) console.log(`   ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
      return fails.length === 0;
    },
  };
}
