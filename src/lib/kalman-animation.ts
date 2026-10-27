/**
 * Kálmán's animations as data, and the maths that turns them into a pose at any moment
 * (spec: kalman-animation).
 *
 * An animation is a list of keyframes: a pose at a moment in time, with an easing towards the
 * next keyframe. `samplePose()` works out the pose between two keyframes by blending them; the
 * player (src/scene/kalman/kalman-player.ts) only asks "what is the pose at 0.73 s?" on every
 * frame and draws the answer. The easing curves are passed in, so this file needs neither GSAP
 * nor a browser and is unit-tested on its own.
 */
import { figureOf, type Figure, type LayerPose, type Pair, type Pose } from './kalman-rig';

/** One moment of an animation: a pose, and how to ease towards the next keyframe. */
export interface Keyframe {
  /** Seconds from the start of the animation. */
  readonly at: number;
  /** The name of a pose of the animation's figure. */
  readonly pose: string;
  /** The easing from this keyframe to the next one; `none` (linear) when left out. */
  readonly ease?: EaseName;
}

/** An animation: which figure it uses, whether it loops, and its keyframes. */
export interface Animation {
  readonly name: string;
  readonly label: string;
  readonly figure: Figure;
  readonly loop: boolean;
  /** For head-follow: the head turns towards the pointer instead of following keyframes. */
  readonly follow?: 'head';
  readonly keyframes: readonly Keyframe[];
}

/**
 * The easing curves an animation may use: GSAP's names for them. Easing is how speed changes
 * over a movement: `none` keeps a constant speed, `.in` starts slowly, `.out` ends slowly,
 * `.inOut` does both. Curves that overshoot (like `back.out`) are left out on purpose, so a
 * blended pose can never turn a layer past its allowed range.
 */
export const EASES = [
  'none',
  'sine.in',
  'sine.out',
  'sine.inOut',
  'power1.in',
  'power1.out',
  'power1.inOut',
  'power2.in',
  'power2.out',
  'power2.inOut',
  'power3.in',
  'power3.out',
  'power3.inOut',
] as const;

/** One of the allowed easing names. */
export type EaseName = (typeof EASES)[number];

/** Turns an easing name into its curve: progress 0–1 in, eased progress 0–1 out. */
export type EaseOf = (name: EaseName) => (progress: number) => number;

/** The six animations the repo must have (spec: "Animations are data"). */
export const REQUIRED_ANIMATIONS = ['idle', 'bow', 'head-follow', 'dive', 'swim', 'launch'];

/** The length of an animation in seconds: the moment of its last keyframe. */
export function duration(animation: Animation): number {
  return animation.keyframes.at(-1)?.at ?? 0;
}

// ---------------------------------------------------------------------------------------
// Blending
// ---------------------------------------------------------------------------------------

/** `a` at 0, `b` at 1, and in between on a straight line: like `numpy.interp` for one value. */
function mix(a: number, b: number, amount: number): number {
  return a + (b - a) * amount;
}

/**
 * The pose `amount` of the way from `from` to `to` (0 = exactly `from`, 1 = exactly `to`):
 * every layer's rotation and offset blended. A layer that only one pose mentions counts as 0
 * (rest) in the other.
 */
export function blendPoses(from: Pose, to: Pose, amount: number, name = from.name): Pose {
  const layerNames = new Set([...Object.keys(from.layers), ...Object.keys(to.layers)]);
  const layers: Record<string, LayerPose> = {};
  for (const layer of layerNames) {
    const a = from.layers[layer] ?? {};
    const b = to.layers[layer] ?? {};
    const [ax, ay] = a.offset ?? [0, 0];
    const [bx, by] = b.offset ?? [0, 0];
    const offset: Pair = [mix(ax, bx, amount), mix(ay, by, amount)];
    layers[layer] = { rotate: mix(a.rotate ?? 0, b.rotate ?? 0, amount), offset };
  }
  return { name, label: from.label, figure: figureOf(from), layers };
}

/**
 * The pose at `time` seconds into `animation`. Between two keyframes, the progress (0 to 1) goes
 * through the first keyframe's easing curve and then blends the two poses. Before the start it is
 * the first keyframe's pose, after the end the last one's. `posesByName` holds the animation's
 * figure's poses; the result carries the animation's name, so the figure can say what it shows.
 */
export function samplePose(
  animation: Animation,
  posesByName: ReadonlyMap<string, Pose>,
  time: number,
  easeOf: EaseOf,
): Pose {
  const frames = animation.keyframes;
  const poseOf = (keyframe: Keyframe): Pose => {
    const pose = posesByName.get(keyframe.pose);
    if (pose === undefined)
      throw new Error(`Unknown pose "${keyframe.pose}" in ${animation.name}.`);
    return pose;
  };
  const first = frames[0];
  if (first === undefined) throw new Error(`The animation ${animation.name} has no keyframes.`);
  // The last keyframe at or before `time`; the next one after it, if any.
  const index = Math.max(
    0,
    frames.findLastIndex((frame) => frame.at <= time),
  );
  const current = frames[index] ?? first;
  const next = frames[index + 1];
  if (next === undefined || time <= current.at) {
    return { ...poseOf(current), name: animation.name };
  }
  const progress = (time - current.at) / (next.at - current.at);
  const eased = easeOf(current.ease ?? 'none')(Math.min(1, Math.max(0, progress)));
  return blendPoses(poseOf(current), poseOf(next), eased, animation.name);
}

// ---------------------------------------------------------------------------------------
// Head-follow
// ---------------------------------------------------------------------------------------

/**
 * How far the head turns towards `point`, in degrees: proportional to how far the point is to
 * the side of the head's pivot, reaching the end of `range` at `reach` artboard units away, and
 * never beyond it. A point straight above or below the head gives 0.
 */
export function headTurn(point: Pair, headPivot: Pair, range: Pair, reach: number): number {
  const sideways = (point[0] - headPivot[0]) / reach;
  // To the right is a clockwise turn (positive), to the left anticlockwise (negative).
  const turn = sideways >= 0 ? sideways * range[1] : -sideways * range[0];
  return Math.min(range[1], Math.max(range[0], turn));
}

// ---------------------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------------------

/** A plain object such as `{ ... }` from JSON (not an array, not null). */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const isEase = (value: unknown): value is EaseName =>
  typeof value === 'string' && (EASES as readonly string[]).includes(value);

/** The problems with one animation, given the pose names its figure has. */
function animationErrors(
  value: unknown,
  index: number,
  poseNames: (figure: Figure) => Set<string>,
): string[] {
  if (!isRecord(value)) return [`Animation ${index + 1} is not an object.`];
  const { name, label, figure, loop, follow, keyframes } = value;
  const title =
    typeof name === 'string' && name !== '' ? `Animation "${name}"` : `Animation ${index + 1}`;
  const errors: string[] = [];
  if (typeof name !== 'string' || name === '') errors.push(`${title} needs a "name".`);
  if (typeof label !== 'string' || label === '') errors.push(`${title} needs a "label".`);
  if (figure !== 'front' && figure !== 'side')
    errors.push(`${title} needs "figure" as "front" or "side".`);
  if (typeof loop !== 'boolean') errors.push(`${title} needs "loop" as true or false.`);
  if (follow !== undefined && follow !== 'head') errors.push(`${title} can only follow "head".`);
  if (!Array.isArray(keyframes) || keyframes.length === 0) {
    errors.push(`${title} needs a list of "keyframes".`);
    return errors;
  }
  const known = figure === 'front' || figure === 'side' ? poseNames(figure) : new Set<string>();
  let previous: number | undefined;
  keyframes.forEach((keyframe: unknown, k) => {
    if (!isRecord(keyframe)) {
      errors.push(`${title}, keyframe ${k + 1} is not an object.`);
      return;
    }
    const { at, pose, ease } = keyframe;
    if (typeof at !== 'number' || !Number.isFinite(at) || at < 0) {
      errors.push(`${title}, keyframe ${k + 1} needs "at" as a time in seconds.`);
    } else {
      if (k === 0 && at !== 0) errors.push(`${title} must start with a keyframe at 0 seconds.`);
      if (previous !== undefined && at <= previous) {
        errors.push(`${title}: the keyframe at ${at} s comes after the one at ${previous} s.`);
      }
      previous = at;
    }
    if (typeof pose !== 'string' || !known.has(pose)) {
      errors.push(
        `${title} names the pose "${String(pose)}", which its ${String(figure)} figure doesn't have.`,
      );
    }
    if (ease !== undefined && !isEase(ease)) {
      errors.push(`${title} uses the unknown easing "${String(ease)}".`);
    }
  });
  return errors;
}

/**
 * Checks animations.json (spec: "An invalid animation is rejected"): every problem at once.
 * `poses` are all poses of both figures, to check the keyframes' pose names.
 */
export function validateAnimations(data: unknown, poses: readonly Pose[]): string[] {
  if (!Array.isArray(data)) return ['The animations must be a list.'];
  const poseNames = (figure: Figure) =>
    new Set(poses.filter((pose) => figureOf(pose) === figure).map((pose) => pose.name));
  const errors = data.flatMap((value: unknown, index) => animationErrors(value, index, poseNames));
  const names = data.map((value: unknown) => (isRecord(value) ? value['name'] : undefined));
  for (const required of REQUIRED_ANIMATIONS) {
    if (!names.includes(required)) errors.push(`The animation "${required}" is missing.`);
  }
  return errors;
}
