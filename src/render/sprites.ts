// @ts-nocheck
// Sprite sheets and animation clips (docs/assets.md, docs/features/rendering.md).

// Shared atlas: blue/red idle and walk clips occupy dedicated rows; later actions can add rows without changing simulation data.
export const infantrySpriteSheet=new Image();
infantrySpriteSheet.src=import.meta.env.BASE_URL+'assets/units/infantry/infantry-sheet.png';
export const infantryClips={blue:{idle:{row:0,frames:4,fps:1.25},walk:{row:1,frames:4,fps:7}},red:{idle:{row:2,frames:4,fps:1.25},walk:{row:3,frames:4,fps:7}}};
export const scoutSpriteSheet=new Image();
scoutSpriteSheet.src=import.meta.env.BASE_URL+'assets/units/scout/scout-sheet.png';
export const scoutClips={blue:{idle:{row:0,frames:4,fps:1.25},walk:{row:1,frames:4,fps:7}},red:{idle:{row:2,frames:4,fps:1.25},walk:{row:3,frames:4,fps:7}}};
// Per-cell alpha bounds from the atlas keep blue and red scouts grounded at the same world Y.
export const scoutFootAnchors=[[304,307,303,308],[294,297,297,298],[276,282,276,283],[267,270,269,270]].map(row=>row.map(bottom=>bottom/313.5));
export const cavalrySpriteSheet=new Image();
cavalrySpriteSheet.src=import.meta.env.BASE_URL+'assets/units/cavalry/cavalry-sheet.png';
export const cavalryClips={blue:{idle:{row:0,frames:3,fps:1},walk:{row:1,frames:4,fps:7}},red:{idle:{row:2,frames:3,fps:1},walk:{row:3,frames:4,fps:7}}};
export const archerSpriteSheet=new Image();
archerSpriteSheet.src=import.meta.env.BASE_URL+'assets/units/archer/archer-sheet.png';
export const archerClips={blue:{idle:{row:0,frames:4,fps:1.25},walk:{row:1,frames:4,fps:7}},red:{idle:{row:2,frames:4,fps:1.25},walk:{row:3,frames:4,fps:7}}};
// 16 rows: team*8 + direction*2 + (idle 0 | walk 1); built by tools/build_spearman_sheet.py.
export const spearmanSpriteSheet=new Image();
spearmanSpriteSheet.src=import.meta.env.BASE_URL+'assets/units/spearman/spearman-sheet.png';
export const SPEARMAN_DIRECTIONS=['down','left','up','right'],SPEARMAN_ROWS=16;
export const spearmanClips={idle:{frames:4,fps:1.25},walk:{frames:4,fps:7}};
export const farmSprite=new Image();
farmSprite.src=import.meta.env.BASE_URL+'assets/farmstead-v2.png';
export const fortressSprite=new Image();
fortressSprite.src=import.meta.env.BASE_URL+'assets/fortress-sprite.png';
