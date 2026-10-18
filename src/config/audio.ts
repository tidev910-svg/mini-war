// @ts-nocheck
// Sound effects (docs/features/audio.md). Files live in public/assets/audio/ (Kenney CC0 packs, see LICENSE.txt there).
// Each entry: files (one is picked at random), bus ('ui' | 'sfx' | 'event'), volume 0..1, maxVoices (how many copies may
// sound at once), minGap (seconds before it may start again), pitch (± random playback-rate spread). Data only.
const n = (base, count) => Array.from({ length: count }, (_, i) => `${base}-${i + 1}.ogg`);
export const SOUNDS = {
  'ui.click': { files: ['ui/click.ogg'], bus: 'ui', volume: .5, maxVoices: 2, minGap: .04 },
  'ui.open': { files: ['ui/open.ogg'], bus: 'ui', volume: .55 },
  'ui.close': { files: ['ui/close.ogg'], bus: 'ui', volume: .5 },
  'ui.dialogOpen': { files: ['ui/dialog-open.ogg'], bus: 'ui', volume: .8 },
  'ui.dialogClose': { files: ['ui/dialog-close.ogg'], bus: 'ui', volume: .7 },
  'ui.tab': { files: ['ui/tab.ogg'], bus: 'ui', volume: .6 },
  'ui.toggle': { files: ['ui/toggle.ogg'], bus: 'ui', volume: .5 },
  'ui.error': { files: ['ui/error.ogg'], bus: 'ui', volume: .6, minGap: .25 },
  'ui.confirm': { files: ['ui/confirm.ogg'], bus: 'ui', volume: .55 },
  'order.select': { files: n('order/select', 3), bus: 'ui', volume: .45, minGap: .12, pitch: .08 },
  'order.move': { files: n('order/move', 3), bus: 'ui', volume: .5, minGap: .1, pitch: .06 },
  'order.attack': { files: n('order/attack', 3), bus: 'ui', volume: .6, minGap: .15, pitch: .05 },
  'combat.clash': { files: n('combat/clash', 5), bus: 'sfx', volume: .4, maxVoices: 5, minGap: .03, pitch: .12 },
  'combat.bow': { files: n('combat/bow', 2), bus: 'sfx', volume: .25, maxVoices: 3, minGap: .05, pitch: .15 },
  'combat.arrowHit': { files: n('combat/arrow-hit', 3), bus: 'sfx', volume: .35, maxVoices: 3, minGap: .04, pitch: .12 },
  'combat.cannon': { files: n('combat/cannon', 3), bus: 'sfx', volume: .55, maxVoices: 3, minGap: .08, pitch: .08 },
  'combat.fall': { files: n('combat/fall', 3), bus: 'sfx', volume: .5, maxVoices: 3, minGap: .06, pitch: .1 },
  'build.place': { files: ['combat/build-place.ogg'], bus: 'sfx', volume: .6 },
  'economy.coins': { files: n('combat/coins', 2), bus: 'ui', volume: .45, minGap: .2 },
  'event.start': { files: ['event/start.ogg'], bus: 'event', volume: .75 },
  'event.alarm': { files: ['event/alarm.ogg'], bus: 'event', volume: .8, minGap: 5 },
  'event.lost': { files: ['event/lost.ogg'], bus: 'event', volume: .75, minGap: 1 },
  'event.capture': { files: ['event/capture.ogg'], bus: 'event', volume: .75, minGap: 1 },
  'event.built': { files: ['event/built.ogg'], bus: 'event', volume: .6, minGap: .5 },
  'event.trained': { files: ['event/trained.ogg'], bus: 'event', volume: .45, minGap: .4 },
  'event.victory': { files: ['event/victory.ogg'], bus: 'event', volume: .9 },
  'event.defeat': { files: ['event/defeat.ogg'], bus: 'event', volume: .9 },
};
// Positional sounds (battle): heard only inside the camera view plus AUDIO_VIEW_MARGIN of its size; quieter towards the
// edges (down to AUDIO_EDGE_GAIN) and panned left/right by screen position (± AUDIO_PAN).
export const AUDIO_VIEW_MARGIN = .25, AUDIO_EDGE_GAIN = .35, AUDIO_PAN = .7;
// At most AUDIO_MAX_VOICES sounds play at once (the oldest positional one is dropped first).
export const AUDIO_MAX_VOICES = 18;
// A drop of at least COINS_MIN_SPEND in the local side's resources within one frame plays the coin sound (upkeep is tiny).
export const COINS_MIN_SPEND = 15;
