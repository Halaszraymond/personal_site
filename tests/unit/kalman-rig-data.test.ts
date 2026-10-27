/**
 * Checks the rig and poses in the repo (spec: kalman-rig, "The rig has Kálmán's parts",
 * "Poses are data", "Placeholder layers until the illustrations arrive").
 *
 * A bad edit of rig.json or a bad paste from the preview's "Copy pose" fails here, with the
 * message from validateRig() or validatePose() saying what is wrong.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import poses from '../../src/scene/kalman/poses.json';
import rigData from '../../src/scene/kalman/rig.json';
import { validatePose, validateRig, type Rig } from '../../src/lib/kalman-rig';

const ASSETS = 'src/assets/kalman';

/** Kálmán's nine parts (README §2.1); left and right as seen by the viewer. */
const KALMAN_PARTS = [
  'body',
  'head',
  'flipperLeft',
  'flipperRight',
  'footLeft',
  'footRight',
  'tail',
  'tie',
  'glasses',
];

/** The repo's rig, validated against the real files in src/assets/kalman/. */
function repoRig(): Rig {
  const result = validateRig(rigData, (image) => existsSync(join(ASSETS, image)));
  // Printing the errors makes a failure say exactly what to fix.
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return result.value;
}

describe('the rig in the repo', () => {
  it('is valid, and every layer points to an existing image', () => {
    expect(() => repoRig()).not.toThrow();
  });

  it('has exactly Kálmán’s nine parts, with the body as the only root', () => {
    const rig = repoRig();
    expect(rig.layers.map((layer) => layer.name).sort()).toEqual([...KALMAN_PARTS].sort());
    expect(rig.layers.filter((layer) => layer.parent === null).map((layer) => layer.name)).toEqual([
      'body',
    ]);
  });

  it('marks exactly the tie and the glasses as accessories', () => {
    const accessories = repoRig().layers.filter((layer) => layer.accessory === true);
    expect(accessories.map((layer) => layer.name).sort()).toEqual(['glasses', 'tie']);
  });
});

describe('the poses in the repo', () => {
  it('contains at least the five agreed poses, each name once', () => {
    const names = poses.map((pose) => pose.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of ['rest', 'bow', 'flippersUp', 'headTiltLeft', 'headTiltRight']) {
      expect(names).toContain(name);
    }
  });

  it('are all valid for the rig', () => {
    const rig = repoRig();
    for (const pose of poses) {
      const result = validatePose(pose, rig);
      expect(result.ok ? [] : result.errors).toEqual([]);
    }
  });
});
