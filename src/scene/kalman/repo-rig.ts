/**
 * Kálmán's rigs, poses and animations from the repo (rig.json, poses.json, animations.json),
 * validated once. There are two figures, front and side (kalman-animations design §2), each
 * with its own rig and poses.
 *
 * Imported by the figure component (at build time) and by the preview's script (in the
 * browser). An invalid file throws here, so a bad edit fails the build with the validator's
 * message. Whether every image file exists is checked by the figure component, which looks
 * the images up, and by the unit test tests/unit/kalman-rig-data.test.ts.
 */
import {
  FIGURES,
  figureOf,
  validateFigurePose,
  validateRig,
  type Figure,
  type Pose,
  type Rig,
  type Rigs,
} from '../../lib/kalman-rig';
import { validateAnimations, type Animation } from '../../lib/kalman-animation';
import { drawnPoseErrors, type DrawnPose } from '../../lib/kalman-drawn-poses';
import { turntableErrors, type TurntableEntry } from '../../lib/kalman-turntable';
import animationData from './animations.json';
import drawnPoseData from './drawn-poses.json';
import poseData from './poses.json';
import rigData from './rig.json';
import turntableData from './turntable.json';

/** Throws with every problem listed, like `raise ValueError("\n".join(errors))` in Python. */
function fail(what: string, errors: readonly string[]): never {
  throw new Error(`${what} is invalid:\n  ${errors.join('\n  ')}`);
}

function loadRig(figure: Figure): Rig {
  // Images are checked where they are looked up (see the header comment), so `() => true`.
  const result = validateRig(rigData[figure], () => true);
  return result.ok ? result.value : fail(`src/scene/kalman/rig.json (${figure})`, result.errors);
}

/** The repo's rigs, one per figure. */
export const REPO_RIGS: Rigs = {
  front: loadRig('front'),
  side: loadRig('side'),
  swim: loadRig('swim'),
};

/** The front figure's rig: the one the turntable, the spin and most poses use. */
export const REPO_RIG: Rig = REPO_RIGS.front;

function loadPoses(): Pose[] {
  return poseData.map((data) => {
    const result = validateFigurePose(data, REPO_RIGS);
    return result.ok ? result.value : fail('src/scene/kalman/poses.json', result.errors);
  });
}

/** The repo's named poses, in the order of poses.json, for both figures. */
export const REPO_POSES: readonly Pose[] = loadPoses();

/** The poses of one figure, in the order of poses.json. */
export function posesFor(figure: Figure): Pose[] {
  return REPO_POSES.filter((pose) => figureOf(pose) === figure);
}

/** A figure's named pose, or that figure's rest pose for a name that doesn't exist. */
export function poseNamed(name: string, figure: Figure = 'front'): Pose {
  return (
    posesFor(figure).find((pose) => pose.name === name) ?? {
      name: 'rest',
      label: 'Rest',
      figure,
      layers: {},
    }
  );
}

/** Both figures, re-exported so pages and scripts import them from one place. */
export { FIGURES };

/** The turntable views from turntable.json (the four views of the design sheet). */
export const REPO_TURNTABLE: readonly TurntableEntry[] = loadTurntable();

function loadTurntable(): TurntableEntry[] {
  const errors = turntableErrors(turntableData);
  if (errors.length > 0) fail('src/scene/kalman/turntable.json', errors);
  // TypeScript reads `[577.5, 1222.5]` in JSON as `number[]`, not as a pair; turntableErrors()
  // has just checked the pairs, so going through `unknown` is safe here.
  return turntableData.views as unknown as TurntableEntry[];
}

/** The drawn poses from drawn-poses.json (whole drawings, such as the bow). */
export const REPO_DRAWN_POSES: readonly DrawnPose[] = loadDrawnPoses();

function loadDrawnPoses(): DrawnPose[] {
  const errors = drawnPoseErrors(drawnPoseData);
  if (errors.length > 0) fail('src/scene/kalman/drawn-poses.json', errors);
  // Checked above; JSON reads the pairs as `number[]`, hence the step through `unknown`.
  return drawnPoseData.poses as unknown as DrawnPose[];
}

/** The animations from animations.json, checked against the repo's poses. */
export const REPO_ANIMATIONS: readonly Animation[] = loadAnimations();

function loadAnimations(): Animation[] {
  const errors = validateAnimations(animationData, REPO_POSES, REPO_RIGS, REPO_DRAWN_POSES);
  if (errors.length > 0) fail('src/scene/kalman/animations.json', errors);
  // Checked above (names, figures, keyframes and eases), so the JSON may be treated as typed.
  return animationData as unknown as Animation[];
}
