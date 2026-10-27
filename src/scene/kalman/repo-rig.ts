/**
 * Kálmán's rig and poses from the repo (rig.json, poses.json), validated once.
 *
 * Imported by the figure component (at build time) and by the preview's script (in the
 * browser). An invalid file throws here, so a bad edit fails the build with the validator's
 * message. Whether every image file exists is checked by the figure component, which looks
 * the images up, and by the unit test tests/unit/kalman-rig-data.test.ts.
 */
import { REST_POSE, validatePose, validateRig, type Pose, type Rig } from '../../lib/kalman-rig';
import { turntableErrors, type TurntableEntry } from '../../lib/kalman-turntable';
import poseData from './poses.json';
import rigData from './rig.json';
import turntableData from './turntable.json';

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

/** The turntable views from turntable.json (the four views of the design sheet). */
export const REPO_TURNTABLE: readonly TurntableEntry[] = loadTurntable();

function loadTurntable(): TurntableEntry[] {
  const errors = turntableErrors(turntableData);
  if (errors.length > 0) fail('src/scene/kalman/turntable.json', errors);
  // TypeScript reads `[577.5, 1222.5]` in JSON as `number[]`, not as a pair; turntableErrors()
  // has just checked the pairs, so going through `unknown` is safe here.
  return turntableData.views as unknown as TurntableEntry[];
}
