// Wolf rendering only: keep the body on a stable movement facing and let the neck aim within a safe arc.
const WOLF_FACING_ANGLES = {
  right: 0,
  'down-right': Math.PI / 4,
  down: Math.PI / 2,
  'down-left': (3 * Math.PI) / 4,
  left: Math.PI,
  'up-left': (5 * Math.PI) / 4,
  up: (3 * Math.PI) / 2,
  'up-right': (7 * Math.PI) / 4,
};

export const WOLF_MAX_HEAD_AIM = Math.PI / 4;

function wrapAngle(angle) {
  return ((angle + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
}

export function wolfPoseAngles(facing, targetAngle = null) {
  const worldFacing = WOLF_FACING_ANGLES[facing] ?? WOLF_FACING_ANGLES.right;
  // Keep the side-view body within the lower hemisphere. Facing left is a horizontal mirror,
  // not a 180° rotation that would put the belly and legs above the back.
  const flipX = Math.cos(worldFacing) < -1e-9;
  const bodyAngle = flipX ? wrapAngle(worldFacing - Math.PI) : worldFacing;
  if (!Number.isFinite(targetAngle)) return { bodyAngle, flipX, headAim: 0 };
  const relativeAim = wrapAngle(targetAngle - worldFacing);
  return {
    bodyAngle,
    flipX,
    // A horizontal reflection reverses local rotation handedness.
    headAim: (flipX ? -1 : 1) * Math.max(-WOLF_MAX_HEAD_AIM, Math.min(WOLF_MAX_HEAD_AIM, relativeAim)),
  };
}
