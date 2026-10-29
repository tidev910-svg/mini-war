import { describe, expect, it } from 'vitest';
import { WOLF_MAX_HEAD_AIM, wolfPoseAngles } from '../src/render/wolf-pose';

describe('wolf facing during bite poses', () => {
  it.each([
    ['up', 3 * Math.PI / 2, false],
    ['down', Math.PI / 2, false],
    ['left', 0, true],
    ['right', 0, false],
  ])('keeps the body stable while facing %s', (facing, expectedBodyAngle, expectedFlip) => {
    const expectedFacing = poseAngle(facing);
    const pose = wolfPoseAngles(facing, expectedFacing);
    expect(pose.bodyAngle).toBeCloseTo(expectedBodyAngle);
    expect(pose.flipX).toBe(expectedFlip);
    expect(pose.headAim).toBeCloseTo(0);
    expect(wrap(pose.bodyAngle + (pose.flipX ? Math.PI : 0))).toBeCloseTo(expectedFacing);
    expect(Math.cos(pose.bodyAngle)).toBeGreaterThanOrEqual(-1e-9);
  });

  it('aims the neck toward a nearby target angle without reversing the body', () => {
    const pose = wolfPoseAngles('right', Math.PI / 6);
    expect(pose.bodyAngle).toBe(0);
    expect(pose.headAim).toBeCloseTo(Math.PI / 6);
  });

  it('clamps a target behind the wolf so the head cannot turn upside down', () => {
    for (const facing of ['up', 'down', 'left', 'right']) {
      const pose = wolfPoseAngles(facing, (poseAngle(facing) + Math.PI) % (2 * Math.PI));
      expect(Math.abs(pose.headAim)).toBeLessThanOrEqual(WOLF_MAX_HEAD_AIM);
      expect(wrap(pose.bodyAngle + (pose.flipX ? Math.PI : 0))).toBeCloseTo(poseAngle(facing));
      expect(Math.cos(pose.bodyAngle)).toBeGreaterThanOrEqual(-1e-9);
    }
  });

  it('keeps the paws on the lower half of the screen for all eight facings', () => {
    for (const facing of ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right']) {
      const pose = wolfPoseAngles(facing);
      // Under rotate(bodyAngle) + optional horizontal reflection, local down remains screen-down.
      expect(Math.cos(pose.bodyAngle)).toBeGreaterThanOrEqual(-1e-9);
    }
  });
});

function poseAngle(facing) {
  return { up: 3 * Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[facing];
}

function wrap(angle) { return ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); }
