// @ts-nocheck
// Colours and sizes for territory borders, flags and fog (docs/features/rendering.md). Data only.

// ---- Territory map (docs/features/territory.md) ----
// regionMap[tile] = region id. Built by a multi-source Dijkstra from each region's seed tile; water and rock cost more
// to cross, so borders follow rivers and rocky ground. Deterministic from the seeds, so a guest rebuilds the same map.
// Border colours (neutral is a pale cream) and widths in screen pixels.
export const TERRITORY_COLORS={neutral:'#fff4c8e6',0:'#4aaaff',1:'#ff626b'},TERRITORY_BORDER_PX={neutral:3,owned:4};
// Soft glow around each border line: TERRITORY_GLOW_PX screen pixels on each side, in a faint version of the line colour.
export const TERRITORY_GLOW={neutral:'#fff4c833',0:'#4aaaff4d',1:'#ff626b4d'},TERRITORY_GLOW_PX=3;
// Region flags are about as tall as a fortress; below FLAG_MIN_SCREEN_ZOOM they grow so they stay recognisable when zoomed out.
export const FLAG_COLORS={neutral:{main:'#ebe1c3',trim:'#8d8166'},0:{main:'#3f9bf0',trim:'#d4ecff'},1:{main:'#e0484f',trim:'#ffd9d4'}},FLAG_MIN_SCREEN_ZOOM=.3,FLAG_LABEL_MIN_PX=11,FLAG_RING_PX=2.5;
export const RESOURCE_ICONS={food:'🌾',wood:'🪵',stone:'🪨',gold:'🪙'};
/// Unexplored fog is a fully opaque blue-grey veil (nothing of the terrain shows through, and it reads differently from
// black void, brown rock and teal water). The soft edge lies entirely on the explored side: explored tiles within
// FOG_EDGE_TILES of unexplored ground are fogged before the blur, so every unexplored tile stays (almost) fully covered.
// Explored ground the side does not see right now (teamCanSee) keeps its terrain under a thin veil (FOG_MEMORY_ALPHA).
// The tile mask sits inside an opaque FOG_PAD-tile border so the blur does not thin the veil along the map edge.
// Rebuilt at most 5 times a second, or at once when the fog array changes.
export const FOG_RGB=[30,40,60],FOG_EDGE_TILES=2,FOG_BLUR_SCALE=4,FOG_PAD=4,FOG_MEMORY_ALPHA=115;
