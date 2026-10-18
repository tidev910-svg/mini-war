// @ts-nocheck
// Entry point: loads every module (their top-level code wires the page), then starts the first match.
// style.css is a <link> in index.html (render-blocking, so no unstyled flash); tokens are inlined by vite.config.ts.
import './ui/theme';
import { gameStarted, setGameStarted } from './core/game';
import { fresh, loop } from './core/match';
import './core/view';
import './config/map';
import './map/terrain';
import './ui/input';
import './config/balance';
import './render/sprites';
import './sim/units';
import './sim/economy';
import './net/peer';
import './ui/modeScreen';
import './net/snapshot';
import './sim/fog';
import './core/actions';
import './map/bases';
import './config/visuals';
import './map/regions';
import './ui/hud';
import './render/territory';
import './sim/buildings';
import './sim/territory';
import './sim/combat';
import './ai/enemy';
import './render/units';
import './render/buildings';
import './render/terrain';
import './render/flags';
import './render/fog';
import './render/draw';
import './ui/hotkeys';

fresh();
setGameStarted(false);
requestAnimationFrame(loop);
