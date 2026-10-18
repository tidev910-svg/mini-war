// @ts-nocheck
// Sound playback and the battlefield soundscape (docs/features/audio.md).
// playSound(name, {x, y}) plays an entry of SOUNDS (config/audio.ts) through a Web Audio graph:
//   source → gain → stereo pan → bus ('ui' | 'sfx' | 'event') → master → speakers
// The AudioContext and the sound files are set up when the page loads (browsers keep it suspended); the first pointer or
// key press resumes it, since audio may only start after a user gesture.
// updateSoundscape() runs once per frame (from draw()) and turns changes in the match state into sounds — new hits,
// shots and falls, captures and losses, finished buildings, new units, spending, selection, start and end. Because it
// reads the state rather than hooking the simulation, the PvP guest hears the same battle from its snapshots.
import { AUDIO_EDGE_GAIN, AUDIO_MAX_VOICES, AUDIO_PAN, AUDIO_VIEW_MARGIN, COINS_MIN_SPEND, SOUNDS } from '../config/audio';
import { DEFAULT_ZOOM, VIEW_H, VIEW_W, camX, camY, zoom } from '../core/view';
import { ended, gameStarted, gameTime, localSelectedIds, localTeam, state } from '../core/game';
import { onSettingChange, settings } from '../core/settings';
import { teamCanSee } from '../sim/fog';

let ac = null, master = null;
const buses = {}, buffers = new Map(), failed = new Set(), voices = [], lastPlay = {};
// Play counts per sound name (smoke tests and debugging).
export const soundStats = {};
export function audioStatus() { return { state: ac?.state || 'none', loaded: buffers.size, failed: [...failed] }; }

function applyVolumes() {
  if (!ac) return;
  master.gain.value = settings.muted ? 0 : settings.masterVolume;
  buses.ui.gain.value = settings.uiVolume; buses.event.gain.value = settings.uiVolume; buses.sfx.gain.value = settings.sfxVolume;
}
function ensureAudio() {
  if (ac) return ac;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  ac = new AC(); master = ac.createGain(); master.connect(ac.destination);
  for (const b of ['ui', 'sfx', 'event']) { buses[b] = ac.createGain(); buses[b].connect(master); }
  applyVolumes();
  const files = new Set(Object.values(SOUNDS).flatMap(s => s.files));
  for (const f of files) fetch(import.meta.env.BASE_URL + 'assets/audio/' + f).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then(data => ac.decodeAudioData(data)).then(buf => { buffers.set(f, buf); flushPending(); }).catch(() => failed.add(f));
  return ac;
}
ensureAudio();
for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => { if (ensureAudio() && ac.state === 'suspended') ac.resume().then(flushPending); }, { capture: true });
// Event sounds (start, victory…) asked for before their file is decoded or the context runs wait up to PENDING_SECONDS.
const PENDING_SECONDS = 2, pending = [];
function flushPending() {
  const now = performance.now();
  for (let i = pending.length - 1; i >= 0; i--) { const p = pending[i]; if (now - p.at > PENDING_SECONDS * 1000) pending.splice(i, 1); else if (playSound(p.name, null, false)) pending.splice(i, 1); }
}
onSettingChange(key => { if (['muted', 'masterVolume', 'uiVolume', 'sfxVolume'].includes(key)) applyVolumes(); });

// Gain and pan for a world point: silent outside the view (+margin), quieter towards the edges and when zoomed far out.
function positional(x, y) {
  const vw = VIEW_W / zoom, vh = VIEW_H / zoom, dx = (x - (camX + vw / 2)) / (vw / 2), dy = (y - (camY + vh / 2)) / (vh / 2), m = 1 + AUDIO_VIEW_MARGIN * 2;
  if (Math.abs(dx) > m || Math.abs(dy) > m) return null;
  const edge = Math.min(1, Math.max(Math.abs(dx), Math.abs(dy)) / m);
  return { gain: (1 - (1 - AUDIO_EDGE_GAIN) * edge) * Math.max(.35, Math.min(1, zoom / DEFAULT_ZOOM)), pan: Math.max(-1, Math.min(1, dx)) * AUDIO_PAN };
}
export function playSound(name, pos = null, queue = true) {
  const def = SOUNDS[name];
  if (!def || settings.muted) return false;
  const ready = ac && ac.state === 'running' && def.files.every(f => buffers.has(f));
  if (!ready) { if (queue && def.bus === 'event' && !pending.some(p => p.name === name)) pending.push({ name, at: performance.now() }); return false; }
  const now = ac.currentTime;
  for (let i = voices.length - 1; i >= 0; i--) if (voices[i].end <= now) voices.splice(i, 1);
  if (def.minGap && now - (lastPlay[name] ?? -99) < def.minGap) return false;
  if (voices.filter(v => v.name === name).length >= (def.maxVoices || 4)) return false;
  let gain = def.volume, pan = 0;
  if (pos) { const p = positional(pos.x, pos.y); if (!p) return false; gain *= p.gain; pan = p.pan; }
  const file = def.files[Math.floor(Math.random() * def.files.length)], buf = buffers.get(file); if (!buf) return false;
  if (voices.length >= AUDIO_MAX_VOICES) { const old = voices.findIndex(v => v.positional); if (old < 0) return false; try { voices[old].src.stop(); } catch {} voices.splice(old, 1); }
  const src = ac.createBufferSource(), g = ac.createGain(), rate = 1 + (Math.random() * 2 - 1) * (def.pitch || 0);
  src.buffer = buf; src.playbackRate.value = rate; g.gain.value = gain;
  let node = src.connect(g);
  if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; node = g.connect(p); }
  node.connect(buses[def.bus] || buses.ui);
  src.start(); voices.push({ name, src, end: now + buf.duration / rate, positional: !!pos }); lastPlay[name] = now;
  soundStats[name] = (soundStats[name] || 0) + 1;
  return true;
}

// ---- soundscape: state changes → sounds ----
let primed = false, wasStarted = false, wasEnded = false, lastTime = 0;
let seenFx = new Set(), seenShots = new Set(), owners = [], buildings = new Map(), ownUnits = new Set(), selectedCount = 0, wealth = 0;
const total = r => r ? r.food + r.wood + r.stone + r.gold : 0;
function reset() { primed = false; seenFx = new Set(); seenShots = new Set(); owners = []; buildings = new Map(); ownUnits = new Set(); selectedCount = 0; }
export function updateSoundscape() {
  if (!state) return;
  const team = localTeam(), seen = (x, y) => teamCanSee(team, x, y);
  if (gameStarted && !wasStarted) { reset(); playSound('event.start'); }
  if (gameTime + .5 < lastTime) reset(); // a new match started
  wasStarted = gameStarted; lastTime = gameTime;
  if (!gameStarted) { wasEnded = ended; return; }
  if (ended && !wasEnded) playSound(state.bases.some(b => b.team === team && b.hp > 0) ? 'event.victory' : 'event.defeat');
  wasEnded = ended;
  // Hits and falls (effects) and shots (bullets), each heard once by id, only where the local side sees.
  const fx = new Set(), shots = new Set();
  for (const e of state.effects) {
    if (e.id == null) continue; fx.add(e.id);
    if (!primed || seenFx.has(e.id) || !seen(e.x, e.y)) continue;
    playSound(e.kind === 'fall' ? 'combat.fall' : e.src === 'archer' || e.src === 'gun' ? 'combat.arrowHit' : 'combat.clash', e);
  }
  for (const b of state.bullets) {
    if (b.id == null) continue; shots.add(b.id);
    if (!primed || seenShots.has(b.id) || !seen(b.x, b.y)) continue;
    playSound(b.attackerType === 'archer' ? 'combat.bow' : 'combat.cannon', b);
  }
  seenFx = fx; seenShots = shots;
  // Flags: captured by the local side, or lost by it.
  state.regions.forEach((r, i) => {
    if (primed && owners[i] !== undefined && owners[i] !== r.owner) {
      if (r.owner === team) playSound('event.capture'); else if (owners[i] === team) playSound('event.lost');
    }
    owners[i] = r.owner;
  });
  // Own buildings: placed, then finished.
  const nextBuildings = new Map();
  for (const b of state.buildings) {
    if (b.team !== team) continue;
    const done = b.progress >= 1, before = buildings.get(b.id);
    if (primed && before === undefined) playSound('build.place', b);
    else if (primed && before === false && done) playSound('event.built');
    nextBuildings.set(b.id, done);
  }
  buildings = nextBuildings;
  // New own units (trained) and the selection growing.
  const units = new Set();
  for (const u of state.units) if (u.team === team) { units.add(u.id); if (primed && !ownUnits.has(u.id)) playSound('event.trained'); }
  ownUnits = units;
  if (primed && localSelectedIds.size > selectedCount) playSound('order.select');
  selectedCount = localSelectedIds.size;
  // Spending: a sudden drop in the local side's stock (food upkeep is a trickle).
  const w = total(state.resources?.[team]);
  if (primed && wealth - w >= COINS_MIN_SPEND) playSound('economy.coins');
  wealth = w;
  primed = true;
}
