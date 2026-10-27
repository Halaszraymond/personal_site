/**
 * Checks animations.json in the repo (spec: kalman-animation, "Animations are data", "The right
 * figure for each animation"): valid against the repo's poses, with the six animations.
 */
import { describe, expect, it } from 'vitest';
import { validateAnimations } from '../../src/lib/kalman-animation';
import type { Pose } from '../../src/lib/kalman-rig';
import animations from '../../src/scene/kalman/animations.json';
import poses from '../../src/scene/kalman/poses.json';

describe('the animations in the repo', () => {
  it('are valid against the repo’s poses and include all six', () => {
    expect(validateAnimations(animations, poses as Pose[])).toEqual([]);
  });

  it('use the front figure for idle, bow and head-follow, and the side for the rest', () => {
    const figureOf = Object.fromEntries(animations.map((a) => [a.name, a.figure]));
    expect(figureOf).toEqual({
      idle: 'front',
      bow: 'front',
      'head-follow': 'front',
      dive: 'side',
      swim: 'side',
      launch: 'side',
    });
  });

  it('loop idle and swim only', () => {
    expect(animations.filter((a) => a.loop).map((a) => a.name)).toEqual(['idle', 'swim']);
  });
});
