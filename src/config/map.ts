// @ts-nocheck
// Map and territory-generation constants (docs/features/territory.md). Data only, no logic.

// The world is a fixed 9600×9600 square (256 tiles of 37.5); only the view and zoom depend on the canvas size,
// so PvP peers with different screens and a resized window keep identical coordinates.
export const WORLD_SIZE=9600;
export const W=WORLD_SIZE,H=W,MAP_TILES=256,TILE_SIZE=W/MAP_TILES;
export const forestRegions=[[.12,.18,.15,.14],[.35,.12,.13,.12],[.73,.14,.16,.13],[.88,.32,.12,.16],[.18,.42,.15,.17],[.72,.43,.13,.16],[.42,.57,.13,.12],[.12,.70,.14,.15],[.85,.72,.14,.16],[.36,.86,.15,.12],[.64,.89,.15,.12],[.52,.28,.10,.11]];
export const rockRegions=[[.12,.31,.11,.10],[.55,.14,.12,.10],[.82,.49,.11,.13],[.29,.65,.14,.10],[.68,.76,.12,.11],[.48,.94,.12,.08]];
// Golden fields; together with forestRegions (wood) and rockRegions (stone) these become the capturable territories.
export const goldRegions=[[.27,.22,.09,.08],[.59,.28,.10,.08],[.91,.43,.07,.10],[.30,.49,.09,.09],[.59,.61,.10,.08],[.16,.88,.09,.07],[.89,.91,.08,.07],[.47,.44,.08,.07]];
// Lakes added 2026-10-18 on open grass between the biomes and away from the river: [cx, cy, rx, ry] as map fractions.
// They become water tiles (no building, flags or mines; units still wade through) before rock, fields and forest are placed.
export const lakeRegions=[[.48,.75,.050,.040],[.59,.48,.045,.035],[.31,.34,.045,.040],[.23,.79,.040,.035],[.78,.88,.035,.030],[.88,.12,.035,.030],[.72,.62,.035,.030]];
// Wooden bridges over the river (docs/features/pathfinding.md): rows as map fractions, each BRIDGE_WIDTH_TILES tiles tall.
// Water and rock block movement, so these are the only river crossings; 0.535 carries the main road.
export const BRIDGE_ROWS=[.14,.36,.535,.80],BRIDGE_WIDTH_TILES=3;
// No military buildings (removed 2026-10-17): every unit type is recruited at the fortress and deploys in its muster yard.
export const HOME_TERRITORY_TILES=14;
// Territory map: exactly REGION_COUNT flag regions plus the two home regions that contain the fortresses.
// Each region has exactly one resource. The REGION_TYPES.length regions closest to each fortress (by walking distance)
// get one of each type; the rest are random. fresh() re-rolls the fortresses until both sides are about as close to each type.
export const REGION_TYPES=['food','wood','stone','gold'],REGION_COUNT=20,REGION_SEED_SPACING_TILES=20,REGION_MIN_BASE_TILES=22,MAP_FAIRNESS_TOLERANCE=.3,MAP_GENERATION_TRIES=15;
// True when at least BASE_SITE_MIN_CLEAR of the tiles under the fortress and its muster yard are walkable ground.
export const BASE_SITE_MIN_CLEAR=.85,BASE_MIN_SEPARATION=.55;
export const MIN_LAND_PATCH_TILES=400;
