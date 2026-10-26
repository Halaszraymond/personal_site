/**
 * Kálmán's rig and poses from the repo (rig.json, poses.json), validated once.
 *
 * Imported by the figure component (at build time) and by the preview's script (in the
 * browser). An invalid file throws here, so a bad edit fails the build with the validator's
 * message. Whether every image file exists is checked by the figure component, which looks
 * the images up, and by the unit test tests/unit/kalman-rig-data.test.ts.
 */
import { REST_POSE, validatePose, validateRig, type Pose, type Rig } from '../../lib/kalman-rig';
import poseData from './poses.json';
import rigData from './rig.json';

/** Throws with every problem listed, like `raise ValueError("\n".join(errors))` in Python. */
function fail(what: string, errors: readonly string[]): never {
  throw new Error(`${what} is invalid:\n  ${errors.join('\n  ')}`);
}

function loadRig(): Rig {
  // Images are checked where they are looked up (see the header comment), so `() => true`.
  const result = validateRig(rigData, () => true);
  return result.ok ? result.value : fail('src/scene/kalman/rig.json', result.errors);
}

/** The repo's rig. */
export const REPO_RIG: Rig = loadRig();

function loadPoses(): Pose[] {
  return poseData.map((data) => {
    const result = validatePose(data, REPO_RIG);
    return result.ok ? result.value : fail('src/scene/kalman/poses.json', result.errors);
  });
}

/** The repo's named poses, in the order of poses.json. */
export const REPO_POSES: readonly Pose[] = loadPoses();

/** A named pose, or the rest pose for a name that doesn't exist. */
export function poseNamed(name: string): Pose {
  return REPO_POSES.find((pose) => pose.name === name) ?? REST_POSE;
}
