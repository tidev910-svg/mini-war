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

// ---- Unit art (render/unitArt.ts) ----
// Material colours of the code-drawn soldiers; the side's colours come from TEAM_COLORS (cloth, plumes, shields, caparison).
export const UNIT_ART={
 ink:'#1b130e',shadow:'rgba(0,0,0,.30)',
 skin:'#e3b48a',skinShade:'#b98461',
 steel:'#c7ccd2',steelDark:'#7b838d',steelLight:'#f0f2f5',
 leather:'#7a4f2e',leatherDark:'#4d311c',wood:'#8b5b33',boot:'#3a291d',
 cloak:'#56603a',cloakDark:'#373d24',gold:'#d9a441',string:'#efe6cf',
 horse:'#8a5a36',horseDark:'#5c3b23',horseLight:'#ab7a4d',mane:'#2d2019',hoof:'#2a211c',
};
// Walk / idle animation speed (frames per second of the 4-frame cycles) and how long the strike pose shows after an attack.
export const UNIT_ANIM={walkFps:7,cavalryWalkFps:8,idleFps:1.25,strikeSeconds:.22};
