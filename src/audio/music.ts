// @ts-nocheck
// Background music and ambience made in code (docs/features/audio.md). No files: a step sequencer schedules
// instruments (audio/instruments.ts) a little ahead of the AudioContext clock.
//  - Music (bus 'music'): a low drone following Dm – B♭ – C – Am (2 bars each), a lute melody improvised on D minor,
//    and war drums whose pattern grows with the battle heat. Lobby: drone and lute only; after the match: fades out.
//  - Ambience (bus 'ambience', in a match only): wind (filtered noise with a slow swell) and birdsong while things are
//    calm; quieter when zoomed out.
// Battle heat: addBattleHeat() is called by updateSoundscape() for every fight sound the player hears; it decays with
// MUSIC_HEAT_SECONDS and the music follows a smoothed copy of it.
import { MUSIC_BPM, MUSIC_HEAT_SECONDS, MUSIC_LOOKAHEAD } from '../config/audio';
import { DEFAULT_ZOOM, zoom } from '../core/view';
import { ended, gameStarted } from '../core/game';
import { drum, cymbal, horn, makeReverb, midi, noise, pluck } from './instruments';

let heat = 0, level = 0, lastNow = 0;
export const musicStatus = () => ({ heat, level, scene: scene() });
export function addBattleHeat(v) { heat = Math.min(1, heat + v); }
const scene = () => (!gameStarted ? 'lobby' : ended ? 'end' : 'match');

// Chord roots (MIDI) and whether the chord is minor: Dm, B♭, C, Am — two bars each.
const CHORDS = [[50, true], [46, false], [48, false], [45, true]];
const SCALE = [0, 2, 3, 5, 7, 8, 10]; // D natural minor, from D
const STEP = 60 / MUSIC_BPM / 2;      // eighth notes
let g = null, nextAt = 0, step = 0, motif = null;

function setup(ac, buses) {
  const out = ac.createGain(), verb = makeReverb(ac, 2.6, 2.6), wet = ac.createGain();
  out.gain.value = 0; wet.gain.value = .35; out.connect(buses.music); out.connect(verb); verb.connect(wet); wet.connect(buses.music);
  // Drone: two saws (root + fifth) through a slowly breathing lowpass.
  const drone = ac.createGain(), f = ac.createBiquadFilter(), lfo = ac.createOscillator(), lfoGain = ac.createGain();
  f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = .8; lfo.frequency.value = .07; lfoGain.gain.value = 160; lfo.connect(lfoGain).connect(f.frequency); lfo.start();
  drone.gain.value = .045; f.connect(drone).connect(out);
  const voices = [0, 7, -12].map((iv, i) => { const o = ac.createOscillator(); o.type = i === 2 ? 'triangle' : 'sawtooth'; o.detune.value = i ? 4 : -4; o.frequency.value = midi(38 + iv); o.connect(f); o.start(); return { o, iv }; });
  // Ambience: looping noise as wind, swelling slowly.
  const amb = ac.createGain(), wind = ac.createBufferSource(), wf = ac.createBiquadFilter(), wg = ac.createGain(), wl = ac.createOscillator(), wlg = ac.createGain();
  amb.gain.value = 0; amb.connect(buses.ambience);
  wind.buffer = noise(ac); wind.loop = true; wf.type = 'lowpass'; wf.frequency.value = 520; wf.Q.value = .6;
  wg.gain.value = .13; wl.frequency.value = .09; wlg.gain.value = .07; wl.connect(wlg).connect(wg.gain); wl.start();
  wind.connect(wf).connect(wg).connect(amb); wind.start();
  g = { out, voices, amb, nextBird: 0 };
}

// One eighth-note step at time t.
function playStep(ac, t) {
  const bar = Math.floor(step / 8), beat = step % 8, [root, minor] = CHORDS[Math.floor(bar / 2) % CHORDS.length], sc = scene();
  if (beat === 0 && bar % 2 === 0) for (const v of g.voices) v.o.frequency.setTargetAtTime(midi(root - 12 + v.iv), t, .4);
  // Melody: a new motif each bar — chord tones on strong beats, scale neighbours between; busier in battle.
  if (beat === 0) {
    const busy = sc === 'match' ? .3 + level * .45 : .3, tones = minor ? [0, 3, 7] : [0, 4, 7];
    motif = Array.from({ length: 8 }, (_, i) => {
      if (Math.random() > (i % 2 ? busy * .7 : busy + .15)) return null;
      if (i % 4 === 0) return root + 12 + tones[Math.floor(Math.random() * 3)];
      const deg = SCALE[Math.floor(Math.random() * SCALE.length)]; return 62 + deg - (Math.random() < .3 ? 12 : 0);
    });
  }
  const note = sc !== 'end' && motif?.[beat];
  if (note) pluck(ac, g.out, t, { freq: midi(note), dur: .9 + Math.random() * .4, gain: .09 + Math.random() * .03 });
  if (sc === 'lobby') { if (beat === 0 && bar % 2 === 0) drum(ac, g.out, t, { freq: 52, gain: .12, decay: .9 }); return; }
  if (sc !== 'match') return;
  // War drums by heat: heartbeat → march → driving eighths with rattles and a horn stab each bar.
  const L = level;
  if (L > .12 && (beat === 0 || (L > .35 && (beat === 3 || beat === 6)))) drum(ac, g.out, t, { freq: beat ? 66 : 52, gain: .25 + L * .45, decay: .7 });
  if (L > .35 && beat === 4) drum(ac, g.out, t, { freq: 60, gain: .15 + L * .25, decay: .5 });
  if (L > .65 && beat % 2 === 1) drum(ac, g.out, t, { freq: 88, gain: .12 + L * .15, decay: .2, skin: .7 });
  if (L > .65 && beat % 2 === 1 && Math.random() < .5) cymbal(ac, g.out, t, { gain: .025, decay: .12, cutoff: 6000 });
  if (L > .75 && beat === 0 && bar % 2 === 0) horn(ac, g.out, t, { freq: midi(root), dur: STEP * 3, gain: .07, bright: 900 });
}

function bird(ac, t) {
  const o = ac.createOscillator(), gg = ac.createGain(), p = ac.createStereoPanner ? ac.createStereoPanner() : null, base = 2600 + Math.random() * 1600, n = 2 + Math.floor(Math.random() * 4);
  o.type = 'sine'; gg.gain.value = .0001;
  for (let i = 0; i < n; i++) {
    const s = t + i * (.11 + Math.random() * .06);
    o.frequency.setValueAtTime(base * (1 + Math.random() * .1), s); o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * .3), s + .05); o.frequency.exponentialRampToValueAtTime(base * .9, s + .09);
    gg.gain.setValueAtTime(.0001, s); gg.gain.exponentialRampToValueAtTime(.035, s + .015); gg.gain.exponentialRampToValueAtTime(.0001, s + .09);
  }
  if (p) { p.pan.value = Math.random() * 1.6 - .8; o.connect(gg).connect(p).connect(g.amb); } else o.connect(gg).connect(g.amb);
  o.start(t); o.stop(t + n * .2 + .1);
}

// Once per frame (from updateSoundscape()); `graph` is {ac, buses} from audio/sound.ts, null when there is no audio.
export function updateMusic(graph) {
  if (!graph || graph.ac.state !== 'running') return;
  const { ac, buses } = graph; if (!g) setup(ac, buses);
  const now = ac.currentTime, dt = Math.min(.25, Math.max(0, now - lastNow)); lastNow = now;
  heat *= Math.exp(-dt / MUSIC_HEAT_SECONDS); level += (heat - level) * Math.min(1, dt / 2.5);
  const sc = scene();
  g.out.gain.setTargetAtTime(sc === 'end' ? 0 : 1, now, sc === 'end' ? .8 : 1.5);
  g.amb.gain.setTargetAtTime(sc === 'match' ? Math.max(.35, Math.min(1, zoom / DEFAULT_ZOOM)) * (1 - level * .5) : 0, now, .8);
  if (nextAt < now) nextAt = now + .05; // first call, or the tab was in the background
  while (nextAt < now + MUSIC_LOOKAHEAD) { playStep(ac, nextAt); nextAt += STEP; step++; }
  if (sc === 'match' && level < .4 && now >= g.nextBird) { g.nextBird = now + 3 + Math.random() * 7; bird(ac, now + .05); }
}
