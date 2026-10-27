/**
 * Checks animations.json in the repo (spec: kalman-animation, "Animations are data", "The right
 * figure for each animation"): valid against the repo's poses, with the six animations.
 */
import { describe, expect, it } from 'vitest';
import { validateAnimations } from '../../src/lib/kalman-animation';
import { validateRig, type Figure, type Pose, type Rig } from '../../src/lib/kalman-rig';
import animations from '../../src/scene/kalman/animations.json';
import drawnPoses from '../../src/scene/kalman/drawn-poses.json';
import poses from '../../src/scene/kalman/poses.json';
import rigData from '../../src/scene/kalman/rig.json';

/** A figure's rig from the repo (the images are checked in kalman-rig-data.test.ts). */
function repoRig(figure: Figure): Rig {
  const result = validateRig(rigData[figure], () => true);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return result.value;
}
const RIGS = { front: repoRig('front'), side: repoRig('side'), swim: repoRig('swim') };

describe('the animations in the repo', () => {
  it('are valid against the repo’s poses and include all six', () => {
    // drawn-poses.json is checked in kalman-rig-data.test.ts; here only its names and figures count.
    const drawn = drawnPoses.poses.map(({ name, figure }) => ({ name, figure: figure as Figure }));
    expect(validateAnimations(animations, poses as Pose[], RIGS, drawn)).toEqual([]);
  });

  it('use the front figure for idle, bow and head-follow, and the side for the rest', () => {
    const figureOf = Object.fromEntries(animations.map((a) => [a.name, a.figure]));
    expect(figureOf).toEqual({
      idle: 'front',
      bow: 'front',
      'head-follow': 'front',
      dive: 'side',
      swim: 'swim',
      launch: 'side',
    });
  });

  it('loop idle and swim only', () => {
    expect(animations.filter((a) => a.loop).map((a) => a.name)).toEqual(['idle', 'swim']);
  });
});
