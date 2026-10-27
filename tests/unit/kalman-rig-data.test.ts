/**
 * Checks the rigs and poses in the repo (spec: kalman-rig, "The rig has Kálmán's parts",
 * "Poses are data", "Layers come from the design images").
 *
 * A bad edit of rig.json or a bad paste from the preview's "Copy pose" fails here, with the
 * message from validateRig() or validatePose() saying what is wrong.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import poses from '../../src/scene/kalman/poses.json';
import rigData from '../../src/scene/kalman/rig.json';
import {
  FIGURES,
  validateFigurePose,
  validateRig,
  type Figure,
  type Rig,
  type Rigs,
} from '../../src/lib/kalman-rig';

const ASSETS = 'src/assets/kalman';

/** Each figure's parts; left and right as seen by the viewer, front and back as seen from the side. */
const PARTS: Record<Figure, string[]> = {
  front: [
    'body',
    'head',
    'flipperLeft',
    'flipperRight',
    'footLeft',
    'footRight',
    'tail',
    'tie',
    'glasses',
  ],
  // The far flipper is hidden behind the body in a side view, so it is part of the body.
  side: ['body', 'head', 'flipper', 'footFront', 'footBack', 'tail', 'tie', 'glasses'],
};

/** The poses each figure must have (spec: "Poses are data"). */
const REQUIRED_POSES: Record<Figure, string[]> = {
  front: ['rest', 'bow', 'flippersUp', 'headTiltLeft', 'headTiltRight'],
  side: ['rest', 'strokeUp', 'strokeDown', 'dive'],
};

/** A figure's rig from the repo, validated against the real files in src/assets/kalman/. */
function repoRig(figure: Figure): Rig {
  const result = validateRig(rigData[figure], (image) => existsSync(join(ASSETS, image)));
  // Printing the errors makes a failure say exactly what to fix.
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return result.value;
}

const repoRigs = (): Rigs => ({ front: repoRig('front'), side: repoRig('side') });

describe.each(FIGURES)('the %s rig in the repo', (figure) => {
  it('is valid, and every layer points to an existing image', () => {
    expect(() => repoRig(figure)).not.toThrow();
  });

  it('has exactly this figure’s parts, with the body as the only root', () => {
    const rig = repoRig(figure);
    expect(rig.layers.map((layer) => layer.name).sort()).toEqual([...PARTS[figure]].sort());
    expect(rig.layers.filter((layer) => layer.parent === null).map((layer) => layer.name)).toEqual([
      'body',
    ]);
  });

  it('marks exactly the tie and the glasses as accessories', () => {
    const accessories = repoRig(figure).layers.filter((layer) => layer.accessory === true);
    expect(accessories.map((layer) => layer.name).sort()).toEqual(['glasses', 'tie']);
  });

  it('shares the artboard with the other figure, so switching doesn’t make him jump', () => {
    expect(repoRig(figure).artboard).toEqual(rigData.front.artboard);
  });
});

describe('the poses in the repo', () => {
  it.each(FIGURES)('include the agreed %s poses, each name once per figure', (figure) => {
    const names = poses.filter((pose) => pose.figure === figure).map((pose) => pose.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of REQUIRED_POSES[figure]) expect(names).toContain(name);
  });

  it('all belong to a figure and are valid for its rig', () => {
    const rigs = repoRigs();
    for (const pose of poses) {
      const result = validateFigurePose(pose, rigs);
      expect(result.ok ? [] : result.errors).toEqual([]);
    }
  });
});
