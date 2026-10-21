// @ts-nocheck
// Synthesized instruments (docs/features/audio.md), shared by the event sounds rendered at load (audio/synth.ts) and the
// live music and ambience (audio/music.ts). Each one schedules its own nodes on `ctx` (an AudioContext or an
// OfflineAudioContext) starting at time `t` into `dest`, and stops them when they have faded out.

const noiseBuffers = new WeakMap();
// Two seconds of white noise per context, reused by every noisy instrument.
export function noise(ctx) {
  let b = noiseBuffers.get(ctx);
  if (!b) { b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; noiseBuffers.set(ctx, b); }
  return b;
}
export const midi = m => 440 * 2 ** ((m - 69) / 12);
const ramp = (param, t, peak, attack, release) => { param.setValueAtTime(.0001, t); param.exponentialRampToValueAtTime(peak, t + attack); param.exponentialRampToValueAtTime(.0001, t + attack + release); };

// War drum: a sine skin whose pitch drops after the hit, plus a short burst of dull noise.
export function drum(ctx, dest, t, { freq = 62, gain = .8, decay = .6, skin = .35 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(freq * 2.4, t); o.frequency.exponentialRampToValueAtTime(freq, t + .045); o.frequency.exponentialRampToValueAtTime(freq * .72, t + decay);
  ramp(g.gain, t, gain, .004, decay); o.connect(g).connect(dest); o.start(t); o.stop(t + decay + .05);
  const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), ng = ctx.createGain();
  n.buffer = noise(ctx); f.type = 'lowpass'; f.frequency.value = 1100; ramp(ng.gain, t, gain * skin, .002, .11);
  n.connect(f).connect(ng).connect(dest); n.start(t, Math.random()); n.stop(t + .16);
}
// Horn (tù và / brass): detuned saws and a square through a lowpass that opens on the attack, a small pitch scoop and vibrato.
export function horn(ctx, dest, t, { freq = 147, dur = 1, gain = .3, bright = 1200, scoop = .93, vibrato = 4.5 } = {}) {
  const g = ctx.createGain(), f = ctx.createBiquadFilter(), end = t + dur;
  f.type = 'lowpass'; f.Q.value = 1.4;
  f.frequency.setValueAtTime(bright * .3, t); f.frequency.linearRampToValueAtTime(bright, t + .1); f.frequency.setTargetAtTime(bright * .65, t + .18, .35);
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(gain, t + .07); g.gain.setTargetAtTime(gain * .8, t + .1, .25); g.gain.setTargetAtTime(.0001, end - .1, .07);
  const lfo = ctx.createOscillator(), depth = ctx.createGain(); lfo.frequency.value = vibrato; depth.gain.setValueAtTime(0, t); depth.gain.linearRampToValueAtTime(freq * .007, t + .4); lfo.connect(depth);
  for (const [type, det, amp] of [['sawtooth', -7, .45], ['sawtooth', 6, .45], ['square', 0, .2]]) {
    const o = ctx.createOscillator(), a = ctx.createGain();
    o.type = type; o.detune.value = det; o.frequency.setValueAtTime(freq * scoop, t); o.frequency.exponentialRampToValueAtTime(freq, t + .08);
    depth.connect(o.frequency); a.gain.value = amp; o.connect(a).connect(f); o.start(t); o.stop(end + .4);
  }
  lfo.start(t); lfo.stop(end + .4); f.connect(g).connect(dest);
}
// Bell: inharmonic partials (hum, prime, minor third, fifth, octave…) each with its own decay.
export function bell(ctx, dest, t, { freq = 220, dur = 4, gain = .25 } = {}) {
  for (const [ratio, amp, life] of [[.5, .45, 1], [1, 1, .8], [1.19, .4, .5], [1.5, .3, .45], [2, .45, .35], [2.52, .22, .25], [3.01, .18, .2], [4.17, .1, .12]]) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq * ratio; ramp(g.gain, t, gain * amp, .003, dur * life);
    o.connect(g).connect(dest); o.start(t); o.stop(t + dur * life + .05);
  }
}
// Plucked string (lute-like): triangle + a little saw through a lowpass that closes as the note dies.
export function pluck(ctx, dest, t, { freq = 294, dur = .9, gain = .15, bright = 2600 } = {}) {
  const f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = 'lowpass'; f.frequency.setValueAtTime(bright, t); f.frequency.exponentialRampToValueAtTime(260, t + dur);
  ramp(g.gain, t, gain, .004, dur);
  for (const [type, amp, det] of [['triangle', 1, 0], ['sawtooth', .25, 4]]) { const o = ctx.createOscillator(), a = ctx.createGain(); o.type = type; o.frequency.value = freq; o.detune.value = det; a.gain.value = amp; o.connect(a).connect(f); o.start(t); o.stop(t + dur + .05); }
  f.connect(g).connect(dest);
}
// Hammer on wood: a band-passed click and a low knock.
export function knock(ctx, dest, t, { gain = .5 } = {}) {
  const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  n.buffer = noise(ctx); f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = 2.5; ramp(g.gain, t, gain, .001, .07);
  n.connect(f).connect(g).connect(dest); n.start(t, Math.random()); n.stop(t + .1);
  const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(140, t + .08); ramp(og.gain, t, gain * .8, .002, .1);
  o.connect(og).connect(dest); o.start(t); o.stop(t + .14);
}
// Cymbal / rattle: high-passed noise, either a hit (rise ≈ 0) or a swell.
export function cymbal(ctx, dest, t, { gain = .15, rise = 0, decay = 1.2, cutoff = 5000 } = {}) {
  const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  n.buffer = noise(ctx); n.loop = true; f.type = 'highpass'; f.frequency.value = cutoff;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + Math.max(.003, rise)); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(.003, rise) + decay);
  n.connect(f).connect(g).connect(dest); n.start(t); n.stop(t + rise + decay + .05);
}
// A room: convolution with a decaying stereo noise impulse.
export function makeReverb(ctx, seconds = 2.2, decay = 3) {
  const len = Math.floor(ctx.sampleRate * seconds), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay; }
  const conv = ctx.createConvolver(); conv.buffer = ir; return conv;
}
// Swing / swish: band-passed noise whose centre sweeps from `from` to `to` Hz.
export function whoosh(ctx, dest, t, { dur = .14, gain = .25, from = 900, to = 3200 } = {}) {
  const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  n.buffer = noise(ctx); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + dur * .6); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  n.connect(f).connect(g).connect(dest); n.start(t, Math.random()); n.stop(t + dur + .02);
}
// Metal on metal: a few inharmonic partials that die fast, over a bright click.
export function clang(ctx, dest, t, { freq = 1100, gain = .2, dur = .35 } = {}) {
  for (const [ratio, amp, life] of [[1, 1, 1], [1.47, .6, .7], [2.09, .45, .5], [2.83, .3, .35], [3.76, .2, .25]]) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq * ratio; ramp(g.gain, t, gain * amp, .001, dur * life);
    o.connect(g).connect(dest); o.start(t); o.stop(t + dur * life + .03);
  }
  const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  n.buffer = noise(ctx); f.type = 'highpass'; f.frequency.value = 3500; ramp(g.gain, t, gain * .8, .001, .03);
  n.connect(f).connect(g).connect(dest); n.start(t, Math.random()); n.stop(t + .05);
}
// Bow or crossbow string: a low pluck whose pitch drops at once.
export function twang(ctx, dest, t, { freq = 180, gain = .3 } = {}) {
  const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(freq * 1.6, t); o.frequency.exponentialRampToValueAtTime(freq, t + .03);
  f.type = 'lowpass'; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(300, t + .2); ramp(g.gain, t, gain, .002, .22);
  o.connect(f).connect(g).connect(dest); o.start(t); o.stop(t + .26);
}
