// @ts-nocheck
// Event sounds made in code (docs/features/audio.md): each recipe is rendered once, when the page loads, with an
// OfflineAudioContext into an AudioBuffer, then played by playSound() like a file. SOUNDS entries name them as
// 'synth:<recipe>' (config/audio.ts). War drums, tù và horns and bells instead of the old jingles.
import { bell, cymbal, drum, horn, knock, makeReverb, midi } from './instruments';

const D3 = midi(50), F3 = midi(53), A3 = midi(57), A2 = midi(45), D4 = midi(62), Fs4 = midi(66), G4 = midi(67), A4 = midi(69), D5 = midi(74);
// seconds: length; gain: overall level; wet: reverb share; build(ctx, out) schedules the instruments from time 0.
export const SYNTH_RECIPES = {
  // Match start: three war drums, then a horn call D → A.
  start: { seconds: 3.6, gain: .9, wet: .35, build: (c, o) => {
    drum(c, o, 0, { freq: 58, gain: .9 }); drum(c, o, .42, { freq: 58, gain: .75 }); drum(c, o, .7, { freq: 52, gain: 1, decay: .8 });
    horn(c, o, 1.0, { freq: D3, dur: .55, gain: .32 }); horn(c, o, 1.6, { freq: A3, dur: 1.4, gain: .3 }); horn(c, o, 1.6, { freq: D3, dur: 1.4, gain: .18, bright: 700 });
    drum(c, o, 1.6, { freq: 50, gain: .8, decay: .9 });
  } },
  // Fortress under attack: two low tù và blasts over a drum roll.
  alarm: { seconds: 3, gain: 1, wet: .3, build: (c, o) => {
    horn(c, o, 0, { freq: A2, dur: .9, gain: .4, bright: 800, scoop: .85 }); horn(c, o, 0, { freq: A2 * 1.5, dur: .9, gain: .14, bright: 800, scoop: .85 });
    horn(c, o, 1.15, { freq: A2, dur: 1.3, gain: .42, bright: 850, scoop: .85 }); horn(c, o, 1.15, { freq: A2 * 1.5, dur: 1.3, gain: .15, bright: 850, scoop: .85 });
    for (let i = 0; i < 6; i++) drum(c, o, i * .14, { freq: 70, gain: .35 + i * .05, decay: .25 });
  } },
  // Flag lost: a falling minor horn figure and a dull drum.
  lost: { seconds: 2.4, gain: .9, wet: .35, build: (c, o) => {
    horn(c, o, 0, { freq: A3, dur: .42, gain: .28, bright: 900 }); horn(c, o, .45, { freq: F3, dur: 1.2, gain: .3, bright: 800 });
    drum(c, o, .45, { freq: 55, gain: .6, decay: .7 });
  } },
  // Flag captured: a short rising fanfare D – F# – A.
  capture: { seconds: 2, gain: .85, wet: .3, build: (c, o) => {
    horn(c, o, 0, { freq: D4, dur: .17, gain: .24, bright: 1800 }); horn(c, o, .18, { freq: Fs4, dur: .17, gain: .24, bright: 1800 });
    horn(c, o, .36, { freq: A4, dur: .9, gain: .26, bright: 1900 }); horn(c, o, .36, { freq: D3, dur: .9, gain: .14, bright: 900 });
    drum(c, o, .36, { freq: 70, gain: .55, decay: .4 });
  } },
  // Building finished: two hammer knocks and a small chime.
  built: { seconds: 1.8, gain: .8, wet: .25, build: (c, o) => {
    knock(c, o, 0, { gain: .55 }); knock(c, o, .17, { gain: .6 }); bell(c, o, .36, { freq: midi(81), dur: 1.3, gain: .07 });
  } },
  // Unit trained: a quiet drum tap and a horn blip.
  trained: { seconds: .8, gain: .7, wet: .2, build: (c, o) => {
    drum(c, o, 0, { freq: 90, gain: .7, decay: .25, skin: .5 }); horn(c, o, .05, { freq: G4, dur: .2, gain: .24, bright: 1600 });
  } },
  // Victory: drum roll, triple-call fanfare, a full D major chord with a cymbal swell and a bell.
  victory: { seconds: 6, gain: .95, wet: .4, build: (c, o) => {
    for (let i = 0; i < 10; i++) drum(c, o, i * .09, { freq: 75, gain: .25 + i * .05, decay: .2 });
    for (const [t, d] of [[1, .2], [1.25, .2], [1.5, .2]]) horn(c, o, t, { freq: D4, dur: d, gain: .26, bright: 1900 });
    horn(c, o, 1.75, { freq: A4, dur: .85, gain: .28, bright: 2000 }); drum(c, o, 1.75, { freq: 55, gain: .8 });
    for (const [f, g] of [[D3, .16], [D4, .22], [Fs4, .2], [A4, .2], [D5, .16]]) horn(c, o, 2.7, { freq: f, dur: 2.2, gain: g, bright: 1900 });
    drum(c, o, 2.7, { freq: 50, gain: 1, decay: 1 }); cymbal(c, o, 2.1, { gain: .12, rise: .6, decay: 2.2 }); bell(c, o, 2.7, { freq: D5, dur: 3, gain: .08 });
  } },
  // Defeat: three slow low bell tolls over a dark horn drone (replaces the saxophone jingle).
  defeat: { seconds: 7, gain: 1, wet: .45, build: (c, o) => {
    for (const t of [0, 1.9, 3.8]) bell(c, o, t, { freq: midi(43), dur: 3.4, gain: .32 });
    horn(c, o, .3, { freq: D3, dur: 5, gain: .1, bright: 520, vibrato: 3 }); horn(c, o, .3, { freq: F3, dur: 5, gain: .08, bright: 520, vibrato: 3 });
    drum(c, o, 0, { freq: 45, gain: .7, decay: 1.2 });
  } },
};

// Renders one recipe to an AudioBuffer (a promise); rejects where OfflineAudioContext is missing (e.g. jsdom).
export function renderSynth(name, sampleRate = 44100) {
  const r = SYNTH_RECIPES[name], OAC = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  if (!r || !OAC) return Promise.reject(new Error('synth unavailable: ' + name));
  const c = new OAC(2, Math.ceil(r.seconds * sampleRate), sampleRate);
  const out = c.createGain(), comp = c.createDynamicsCompressor(), master = c.createGain(), verb = makeReverb(c, 2.2, 3), wet = c.createGain();
  master.gain.value = r.gain; wet.gain.value = r.wet;
  out.connect(comp); comp.connect(master); comp.connect(verb); verb.connect(wet); wet.connect(master); master.connect(c.destination);
  r.build(c, out);
  return c.startRendering();
}
