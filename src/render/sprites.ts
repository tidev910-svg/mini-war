// @ts-nocheck
// Building sprites (docs/assets.md, docs/features/rendering.md).

// Soldiers are drawn in code (render/unitArt.ts); the old unit sheets in public/assets/units/ are no longer loaded.
export const farmSprite=new Image();
farmSprite.src=import.meta.env.BASE_URL+'assets/farmstead-v2.png';
export const fortressSprite=new Image();
fortressSprite.src=import.meta.env.BASE_URL+'assets/fortress-sprite.png';
