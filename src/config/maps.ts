// @ts-nocheck
// Map choices and the five realms of the "Ngũ Vực" map (docs/features/realms-map.md). Data only, no logic.

// Maps the host (or the single player) picks in the lobby (settings.mapKind). The id goes to the guest in state.mapId.
export const MAPS={
 classic:{name:'Đại Lục',hint:'Sông chia đôi, 4 cầu, vị trí nhà ngẫu nhiên'},
 realms: {name:'Ngũ Vực',hint:'5 miền đất, mỗi miền một khoáng sản và một loài quái canh giữ'},
};
export const DEFAULT_MAP='classic';

// The five realms, from the least to the most valuable ground. Each realm holds `seeds` flag regions on each side of the
// mirror line (so 2 × seeds in all; the sum over realms × 2 = REGION_COUNT), every one with a mine of `resource`
// (`rich`: income × RICH_GOLD_MULTIPLIER, config/balance.ts), and `camps` camps of kind `camp` per side (config/creeps.ts);
// `centerCamp`: one camp of that kind on the mirror line instead. The monster grows with the worth of the ground.
// labels: where the realm's name is written on the map when zoomed out (render/terrain.ts, drawRealmLabels()).
// Index in this list = the realm id stored in tileRealm (map/terrain.ts) and region.realm.
export const REALMS=[
 {id:'plains',  name:'Đồng Lúa',resource:'food', seeds:3,camp:'boars',  camps:2,labels:[[.1,.06],[.9,.06]]},
 {id:'forest',  name:'Rừng Già',resource:'wood', seeds:2,camp:'spiders',camps:1,labels:[[.5,.07]]},
 {id:'mountain',name:'Núi Đá',  resource:'stone',seeds:2,camp:'bears',  camps:1,labels:[[.5,.93]]},
 {id:'hills',   name:'Đồi Vàng',resource:'gold', seeds:2,camp:'golem',  camps:1,labels:[[.5,.3]]},
 {id:'abyss',   name:'Vực Vàng',resource:'gold', seeds:1,camp:'dragon', centerCamp:true,rich:true,labels:[[.5,.43]]},
];
// Layout, as fractions of the map side; the map is mirrored left ↔ right, so both sides get the same ground.
// plainsWidth: the plains are the strips along the left and right edges (each side's home). coreRadius / ringRadius:
// the abyss is the disc at the centre, the gold hills the ring around it. Forest fills the rest of the north, mountain
// the rest of the south. Between realms stand short mountain ranges, not one long wall: ridge = half the thickness of a
// range at its middle (it tapers to its ends); plainsRidge: ranges along the plains edge, seg long with gap between them
// (fractions of the map height), a gap centred on gapAt; ringRidge: the same around the gold hills in degrees (0 = east,
// 90 = south). moat: the water ring around the abyss, open at moatGaps. Changed 2026-10-30 from two long ridges with
// 3 and 6 passes.
export const REALM_LAYOUT={
 plainsWidth:.2,coreRadius:.11,ringRadius:.25,ridge:.011,moat:.012,
 plainsRidge:{seg:.07,gap:.045,gapAt:.5},
 ringRidge:{seg:22,gap:14,gapAt:90},
 moatGaps:[45,135,225,315],moatGapDegrees:16,
 // Ponds in each plains strip, [x, y, radius] on the left side (mirrored to the right).
 ponds:[[.09,.13,.03],[.11,.87,.03]],
};
// Fortress spot on this map: x within baseX of the side it stands on, y within baseY; the other fortress mirrors it.
export const REALM_BASE={baseX:[.075,.11],baseY:[.32,.68]};
// Walking a region's growth into another realm costs this much per tile, so every flag region stays in its realm
// (buildRegionMap() in map/regions.ts).
export const REALM_CROSS_COST=400;
