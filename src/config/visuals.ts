// @ts-nocheck
// Colours and sizes for territory borders, flags and fog (docs/features/rendering.md). Data only.
// Side and fog colours come from the design tokens (config/theme.ts) so the map overlays match the HUD.
import { TEAM_COLORS, THEME, hexA, hexRgb } from './theme';

// ---- Territory map (docs/features/territory.md) ----
// regionMap[tile] = region id. Built by a multi-source Dijkstra from each region's seed tile; water and rock cost more
// to cross, so borders follow rivers and rocky ground. Deterministic from the seeds, so a guest rebuilds the same map.
// Border colours (each side's light colour; neutral is a pale cream) and widths in screen pixels.
export const TERRITORY_COLORS={neutral:'#fff4c8e6',0:TEAM_COLORS[0].light,1:TEAM_COLORS[1].light},TERRITORY_BORDER_PX={owned:3.5};
// Soft glow around each border line: TERRITORY_GLOW_PX screen pixels on each side, in a faint version of the line colour.
export const TERRITORY_GLOW={neutral:'#fff4c833',0:hexA(TEAM_COLORS[0].light,.35),1:hexA(TEAM_COLORS[1].light,.35)},TERRITORY_GLOW_PX=3;
// Region flags are about as tall as a fortress; below FLAG_MIN_SCREEN_ZOOM they grow so they stay recognisable when zoomed out.
export const FLAG_COLORS={neutral:{main:'#ebe1c3',trim:'#8d8166'},0:{main:'#3f9bf0',trim:'#d4ecff'},1:{main:'#e0484f',trim:'#ffd9d4'}},FLAG_MIN_SCREEN_ZOOM=.3,FLAG_LABEL_MIN_PX=12,
 // Below this screen zoom (map units → screen pixels) flag labels shrink to the region type ("VÙNG GỖ") and the status to
 // "45%" / "TRANH CHẤP": the owner still shows in the text and flag colour, and 20 full labels would overlap.
 FLAG_SHORT_LABEL_ZOOM=.2,FLAG_RING_PX=2.5;
export const RESOURCE_ICONS={food:'🌾',wood:'🪵',stone:'🪨',gold:'🪙'};
// Unexplored fog is a fully opaque near-black veil in --ui-fog, darker than every HUD panel so panels never melt into it
// (nothing of the terrain shows through), lightly mottled per tile (MAP_UI.fogNoise in config/theme.ts). The soft edge lies entirely on the explored side: explored tiles within
// FOG_EDGE_TILES of unexplored ground are fogged before the blur, so every unexplored tile stays (almost) fully covered.
// Explored ground the side does not see right now (teamCanSee) keeps its terrain under a thin veil (FOG_MEMORY_ALPHA).
// The tile mask sits inside an opaque FOG_PAD-tile border so the blur does not thin the veil along the map edge.
// Rebuilt at most 5 times a second, or at once when the fog array changes.
export const FOG_RGB=hexRgb(THEME['ui-fog']),FOG_EDGE_TILES=2,FOG_BLUR_SCALE=4,FOG_PAD=4,FOG_MEMORY_ALPHA=115;


// A unit that dies leaves a falling sprite (effect kind 'fall', render/units.ts drawFallenUnit) for fallSeconds.
export const UNIT_ANIM={fallSeconds:.42};
// Archer pose-only timing and arrow-head coordinates inside the draw-frame cell (render/sprites.ts).
// These are presentation timings; attackTimer, projectile speed and damage stay simulation-owned.
export const ARCHER_ATTACK_ANIM={windupSeconds:.36,aimFraction:.30,releaseSeconds:.06,recoverySeconds:.18,
 // Arrow launch points normalized in each attack cell, placed at the archer's bow hand instead of the arrow tip at the cell edge.
 arrowOriginInCell:{up:{x:.52,y:.35},down:{x:.52,y:.65},left:{x:.32,y:.50},right:{x:.68,y:.50}}};
export const SPEARMAN_ATTACK_ANIM={windupSeconds:.24,impactSeconds:.07,recoverySeconds:.12};
export function spearmanAttackDirection(angle){
 const a=Number.isFinite(angle)?angle:Math.PI/2,dx=Math.cos(a),dy=Math.sin(a);
 return Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
}
export function archerAttackDirection(angle){
 const a=Number.isFinite(angle)?angle:Math.PI/2,dx=Math.cos(a),dy=Math.sin(a);
 return Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
}
// Visual effects (render/fx.ts, docs/features/rendering.md): particle colours and how many particles at most.
export const FX_COLORS={spark:'#ffe9a8',sparkHot:'#ffb347',slash:'#f4f1ea',dust:'#a08a6a',smoke:'#5d5650',debris:'#6b5640',wood:'#9c7a4c',fire:'#ff9a3c',glow:'#ffd27a',gold:'#ffd75e',curse:'#b07cff',arrowShaft:'#6e4f2c',arrowHead:'#cfd5dc'};
export const FX_MAX_PARTICLES=450;
// Neutral camps and monsters (render/creeps.ts, neutral-camps.md): drawn in code. Neutral amber for their health bars and
// labels so they never read as either side; the tomb's curse and the buff glow are violet.
export const CREEP_COLORS={outline:'#2b2118',shadow:'#1e2a1c55',groundShadow:'#29472d33',dirt:'#b49a6c',stoneFloor:'#a7a397',dark:'#1d1712',
 rock:'#7f8580',stone:'#9d978a',stoneLight:'#c9c2b0',moss:'#6f8f4e',bone:'#e9e1cc',boneDark:'#a69c86',wood:'#7a5532',ash:'#5a524a',
 flame:'#ffb347',ember:'#ff6a2a',tentA:'#9b6b43',tentB:'#7d5a3a',banner:'#5b1f24',wolf:'#8d8a86',wolfDark:'#5f5b57',eyeGlow:'#ffd34d',
 skin:'#d9a77e',leather:'#5a4030',banditCloth:'#6c4a3a',banditCloth2:'#57603f',banditHood:'#3b2d26',steel:'#cfd5dc',rust:'#9a5b35',
 troll:'#7d8a78',trollDark:'#59645a',robe:'#3a2550',robeTrim:'#6a3f8f',crown:'#e8c45a',curse:'#b07cff',curseGlow:'#e6d2ff',curseShadow:'#2a183f66',rune:'#b07cff',
 bar:'#ffb347',barBack:'#1a1410',label:'#ffe2b0',labelDim:'#c9bca6',reward:'#ffd75e',buff:'#c99bff',minimap:'#ffb347',minimapDim:'#8b8172'};
