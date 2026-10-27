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
import drawnPoses from '../../src/scene/kalman/drawn-poses.json';
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
    'pupils',
    'pupilsProfessional',
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

  it('marks exactly the tie, the glasses and (front) the professional pupils as accessories', () => {
    const accessories = repoRig(figure).layers.filter((layer) => layer.accessory === true);
    const expected =
      figure === 'front' ? ['glasses', 'pupilsProfessional', 'tie'] : ['glasses', 'tie'];
    expect(accessories.map((layer) => layer.name).sort()).toEqual(expected);
  });

  it('shows the goofy pupils only in the goofy mood (front)', () => {
    const goofyOnly = repoRig(figure).layers.filter((layer) => layer.mood === 'goofy');
    expect(goofyOnly.map((layer) => layer.name)).toEqual(figure === 'front' ? ['pupils'] : []);
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

  it('turn both side feet by the same amount, so they move as one piece', () => {
    // The side feet share one pivot; turned differently, the straight line between them in the
    // drawing would show (kalman-animation-feel, task 1.4).
    const rigs = repoRigs();
    for (const data of poses.filter((p) => p.figure === 'side')) {
      // Validated first, so the pose has its proper type (the raw JSON's type is too narrow).
      const result = validateFigurePose(data, rigs);
      if (!result.ok) throw new Error(result.errors.join(' '));
      const { name, layers } = result.value;
      const back = layers['footBack']?.rotate ?? 0;
      const front = layers['footFront']?.rotate ?? 0;
      expect({ pose: name, back }).toEqual({ pose: name, back: front });
    }
  });

  it('all belong to a figure and are valid for its rig', () => {
    const rigs = repoRigs();
    for (const pose of poses) {
      const result = validateFigurePose(pose, rigs);
      expect(result.ok ? [] : result.errors).toEqual([]);
    }
  });
});

describe('the drawn poses in the repo', () => {
  it('include the bow, in both moods, with images that exist (spec: "The drawn bow in place")', () => {
    const bow = drawnPoses.poses.find((pose) => pose.name === 'bow');
    expect(bow).toBeDefined();
    for (const placed of [bow?.images.goofy, bow?.images.professional]) {
      expect(placed && existsSync(join(ASSETS, placed.image))).toBe(true);
    }
  });

  it('stand the bow on the front figure’s ground line', () => {
    // The ground line: the lowest edge of any front layer (his feet).
    const front = repoRig('front');
    const ground = Math.max(...front.layers.map((l) => l.position[1] + l.size[1]));
    const bow = drawnPoses.poses.find((pose) => pose.name === 'bow');
    for (const placed of [bow?.images.goofy, bow?.images.professional]) {
      const bottom = (placed?.position[1] ?? 0) + (placed?.size[1] ?? 0);
      // Within 2 artboard units: about one pixel of the drawing.
      expect(Math.abs(bottom - ground)).toBeLessThanOrEqual(2);
    }
  });
});
