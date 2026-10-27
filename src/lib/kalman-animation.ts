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
import {
  figureOf,
  type Figure,
  type LayerPose,
  type Pair,
  type Pose,
  type Rigs,
} from './kalman-rig';

/** One moment of an animation: a pose, and how to ease towards the next keyframe. */
export interface Keyframe {
  /** Seconds from the start of the animation. */
  readonly at: number;
  /** The name of a pose of the animation's figure. */
  readonly pose: string;
  /** The easing from this keyframe to the next one; `none` (linear) when left out. */
  readonly ease?: EaseName;
  /**
   * A drawn pose (drawn-poses.json) to show instead of the layers at this keyframe, such as
   * the bow from the front, which layers can't make (design §7–§8).
   */
  readonly drawn?: string;
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
  /**
   * Per layer, how many seconds it trails behind the keyframes (follow-through and overlap):
   * the tail with a lag of 0.1 shows where the animation was 0.1 s ago. Like a Python
   * `dict[str, float]`; layers without a lag follow the keyframes exactly.
   */
  readonly lag?: Readonly<Record<string, number>>;
  /** How long a drawn pose takes to cross-fade in and out, in seconds; DRAWN_FADE when left out. */
  readonly fade?: number;
}

/** The default cross-fade time of a drawn pose: short, so nothing pops, but no ghost lingers. */
export const DRAWN_FADE = 0.2;

/** Which drawn pose shows at a moment, and how solid it is (0 = not at all, 1 = fully). */
export interface DrawnFrame {
  readonly name: string;
  readonly opacity: number;
}

/**
 * The easing curves an animation may use: GSAP's names for them. Easing is how speed changes
 * over a movement: `none` keeps a constant speed, `.in` starts slowly, `.out` ends slowly,
 * `.inOut` does both. The `back` curves overshoot: they go a little past the target and settle
 * back, like a nod that goes slightly too far. The player clamps every pose to the rig
 * (`clampToRig()`), so an overshoot never turns a layer past its allowed range.
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
  'back.out',
  'back.inOut',
] as const;

/** One of the allowed easing names. */
export type EaseName = (typeof EASES)[number];

/** Turns an easing name into its curve: progress 0–1 in, eased progress 0–1 out. */
export type EaseOf = (name: EaseName) => (progress: number) => number;

/** The six animations the repo must have (spec: "Animations are data"). */
export const REQUIRED_ANIMATIONS = ['idle', 'bow', 'head-follow', 'dive', 'swim', 'launch'];

/** The length of an animation's keyframes in seconds: the moment of its last keyframe. */
export function duration(animation: Animation): number {
  return animation.keyframes.at(-1)?.at ?? 0;
}

/**
 * How long an animation plays (design §3). A loop: its keyframes' length, because lagging
 * layers wrap around into the next round. Otherwise: until the slowest layer has caught up,
 * so the last keyframe plus the largest lag.
 */
export function playLength(animation: Animation): number {
  if (animation.loop) return duration(animation);
  const length = duration(animation) + Math.max(0, ...Object.values(animation.lag ?? {}));
  // Rounded to milliseconds: 2.2 + 0.12 is 2.3200000000000003 in floating point, which a
  // range slider refuses as a value (and nobody wants to read).
  return Math.round(length * 1000) / 1000;
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
 * every layer's rotation, offset and stretch blended. A layer that only one pose mentions counts
 * as rest in the other (rotation 0, offset [0, 0], stretch 1). The stretch is only written when
 * one of the poses has it, so layers that may not stretch never get one.
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
    const rotate = mix(a.rotate ?? 0, b.rotate ?? 0, amount);
    // Stretch and plant are only written when one of the poses has them, so layers that may
    // not stretch never get one, and unplanted layers stay as simple as before.
    const entry: { rotate: number; offset: Pair; stretch?: number; plant?: number } = {
      rotate,
      offset,
    };
    if (a.stretch !== undefined || b.stretch !== undefined) {
      entry.stretch = mix(a.stretch ?? 1, b.stretch ?? 1, amount);
    }
    if (a.plant !== undefined || b.plant !== undefined) {
      entry.plant = mix(a.plant ?? 0, b.plant ?? 0, amount);
    }
    layers[layer] = entry;
  }
  return { name, label: from.label, figure: figureOf(from), layers };
}

/**
 * The pose at `time` seconds into `animation`. Between two keyframes, the progress (0 to 1) goes
 * through the first keyframe's easing curve and then blends the two poses. Before the start it is
 * the first keyframe's pose, after the end the last one's. A layer with a lag takes its values
 * from `time - lag` instead (design §2); in a loop that earlier moment wraps around into the end
 * of the previous round. `posesByName` holds the animation's figure's poses; the result carries
 * the animation's name, so the figure can say what it shows.
 */
export function samplePose(
  animation: Animation,
  posesByName: ReadonlyMap<string, Pose>,
  time: number,
  easeOf: EaseOf,
): Pose {
  const now = keyframePoseAt(animation, posesByName, time, easeOf);
  const lags = Object.entries(animation.lag ?? {});
  if (lags.length === 0) return now;
  const length = duration(animation);
  const layers: Record<string, LayerPose> = { ...now.layers };
  for (const [layer, lag] of lags) {
    const earlier = time - lag;
    // A loop continues from the end of the previous round. `% length` alone would give a
    // negative time just after the start: JavaScript's % keeps the sign, unlike Python's.
    const at = animation.loop && length > 0 ? ((earlier % length) + length) % length : earlier;
    // No entry at that moment means the layer was at rest; `{}` says the same.
    layers[layer] = keyframePoseAt(animation, posesByName, at, easeOf).layers[layer] ?? {};
  }
  return { ...now, layers };
}

/** The pose at `time` from the keyframes alone, without any lag. */
function keyframePoseAt(
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
// Drawn poses
// ---------------------------------------------------------------------------------------

/**
 * The drawn pose at `time`, if any (design §8). Keyframes in a row that name the same drawn
 * pose form a span: from the first of them to the last, the drawing shows fully. It fades in
 * over the `fade` seconds before the span and out over the `fade` seconds after it, so the
 * layers and the drawing cross-fade. Like everything here a pure function of time, so a
 * scrubbed moment looks exactly like a played one.
 */
export function drawnFrame(animation: Animation, time: number): DrawnFrame | undefined {
  const fade = animation.fade ?? DRAWN_FADE;
  let best: DrawnFrame | undefined;
  const frames = animation.keyframes;
  for (let start = 0; start < frames.length; start++) {
    const name = frames[start]?.drawn;
    // Only the first keyframe of a span starts one.
    if (name === undefined || frames[start - 1]?.drawn === name) continue;
    let end = start;
    while (frames[end + 1]?.drawn === name) end++;
    const from = frames[start]?.at ?? 0;
    const to = frames[end]?.at ?? from;
    const opacity = spanOpacity(time, from, to, fade);
    if (opacity > 0 && (best === undefined || opacity > best.opacity)) best = { name, opacity };
  }
  return best;
}

/**
 * How solid the drawing and the layers are drawn for a drawn pose's `opacity` (0 to 1). Not
 * simply `opacity` and `1 − opacity`: two pictures at 50% each cover only 75%, so he would be
 * see-through halfway. Instead the drawing first fades in over the solid layers (opacity 0 to
 * 0.5), then the layers fade out under the solid drawing (0.5 to 1). Their lower halves are the
 * same picture, so that part stays solid all the time, and what only one of them has (the
 * layered head above the drawn bow) fades smoothly instead of popping.
 */
export function crossFade(opacity: number): { readonly drawing: number; readonly layers: number } {
  return { drawing: Math.min(1, 2 * opacity), layers: Math.min(1, 2 * (1 - opacity)) };
}

/** 1 inside `[from, to]`, a straight ramp over `fade` seconds on both sides, 0 further out. */
function spanOpacity(time: number, from: number, to: number, fade: number): number {
  if (time >= from && time <= to) return 1;
  if (fade <= 0) return 0;
  const distance = time < from ? from - time : time - to;
  return Math.max(0, 1 - distance / fade);
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

/** How much of its range the head turns on its own while following (the body does the rest). */
export const HEAD_SHARE = 2 / 3;
/** How much of the head's angle the body turns along: shoulders following the head. */
export const BODY_SHARE = 1 / 4;

/**
 * The angles for head-follow (design §12): the head turns towards `point` within a part of its
 * range, and the body turns along by a part of the head's angle, so the head and the body move
 * as one penguin instead of a head turning alone on its neck.
 */
export function followAngles(
  point: Pair,
  headPivot: Pair,
  range: Pair,
  reach: number,
): { readonly head: number; readonly body: number } {
  const head = headTurn(point, headPivot, [range[0] * HEAD_SHARE, range[1] * HEAD_SHARE], reach);
  return { head, body: head * BODY_SHARE };
}

/**
 * How far the pupils shift towards `point`, as an offset `[x, y]`: in both directions
 * proportional to how far the point is from the eyes, reaching `shift` (the rig's limit) at
 * `reach` artboard units away, and never beyond it. Unlike the head, which only turns sideways,
 * the eyes also look up and down.
 */
export function eyeShift(point: Pair, eyes: Pair, shift: Pair, reach: number): Pair {
  const towards = (from: number, to: number, limit: number) =>
    Math.min(limit, Math.max(-limit, ((to - from) / reach) * limit));
  return [towards(eyes[0], point[0], shift[0]), towards(eyes[1], point[1], shift[1])];
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

/** The problems with an animation's lag: per layer a time of 0 or more, for its figure's layers. */
function lagErrors(title: string, lag: unknown, layerNames: ReadonlySet<string>): string[] {
  if (lag === undefined) return [];
  if (!isRecord(lag)) return [`${title} needs "lag" as an object of layer names and seconds.`];
  const errors: string[] = [];
  for (const [layer, seconds] of Object.entries(lag)) {
    if (!layerNames.has(layer)) {
      errors.push(`${title} gives a lag to the layer "${layer}", which its figure doesn't have.`);
    }
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) {
      errors.push(`${title} needs the lag of "${layer}" as 0 or more seconds.`);
    }
  }
  return errors;
}

/** What an animation's figure has: its poses, its layers and its drawn poses, by name. */
interface FigureNames {
  readonly poses: (figure: Figure) => ReadonlySet<string>;
  readonly layers: (figure: Figure) => ReadonlySet<string>;
  readonly drawn: (figure: Figure) => ReadonlySet<string>;
}

/** The problems with one animation, given the names its figure has. */
function animationErrors(value: unknown, index: number, names: FigureNames): string[] {
  if (!isRecord(value)) return [`Animation ${index + 1} is not an object.`];
  const { name, label, figure, loop, follow, keyframes, lag, fade } = value;
  const title =
    typeof name === 'string' && name !== '' ? `Animation "${name}"` : `Animation ${index + 1}`;
  const errors: string[] = [];
  if (typeof name !== 'string' || name === '') errors.push(`${title} needs a "name".`);
  if (typeof label !== 'string' || label === '') errors.push(`${title} needs a "label".`);
  if (figure !== 'front' && figure !== 'side')
    errors.push(`${title} needs "figure" as "front" or "side".`);
  if (typeof loop !== 'boolean') errors.push(`${title} needs "loop" as true or false.`);
  if (follow !== undefined && follow !== 'head') errors.push(`${title} can only follow "head".`);
  if (figure === 'front' || figure === 'side') {
    errors.push(...lagErrors(title, lag, names.layers(figure)));
  }
  if (fade !== undefined && (typeof fade !== 'number' || !Number.isFinite(fade) || fade < 0)) {
    errors.push(`${title} needs "fade" as 0 or more seconds.`);
  }
  if (!Array.isArray(keyframes) || keyframes.length === 0) {
    errors.push(`${title} needs a list of "keyframes".`);
    return errors;
  }
  const hasFigure = figure === 'front' || figure === 'side';
  const known = hasFigure ? names.poses(figure) : new Set<string>();
  const drawnKnown = hasFigure ? names.drawn(figure) : new Set<string>();
  let previous: number | undefined;
  keyframes.forEach((keyframe: unknown, k) => {
    if (!isRecord(keyframe)) {
      errors.push(`${title}, keyframe ${k + 1} is not an object.`);
      return;
    }
    const { at, pose, ease, drawn } = keyframe;
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
    if (drawn !== undefined && (typeof drawn !== 'string' || !drawnKnown.has(drawn))) {
      errors.push(
        `${title} shows the drawn pose "${String(drawn)}", which its ${String(figure)} figure doesn't have.`,
      );
    }
  });
  return errors;
}

/**
 * Checks animations.json (spec: "An invalid animation is rejected"): every problem at once.
 * `poses` are all poses of both figures, to check the keyframes' pose names; `rigs` give each
 * figure's layer names, to check the lags; `drawnPoses` the drawn poses, to check `drawn`.
 */
export function validateAnimations(
  data: unknown,
  poses: readonly Pose[],
  rigs: Rigs,
  drawnPoses: readonly { readonly name: string; readonly figure: Figure }[],
): string[] {
  if (!Array.isArray(data)) return ['The animations must be a list.'];
  const figureNames: FigureNames = {
    poses: (figure) =>
      new Set(poses.filter((pose) => figureOf(pose) === figure).map((pose) => pose.name)),
    layers: (figure) => new Set(rigs[figure].layers.map((layer) => layer.name)),
    drawn: (figure) =>
      new Set(drawnPoses.filter((pose) => pose.figure === figure).map((pose) => pose.name)),
  };
  const errors = data.flatMap((value: unknown, index) =>
    animationErrors(value, index, figureNames),
  );
  const names = data.map((value: unknown) => (isRecord(value) ? value['name'] : undefined));
  for (const required of REQUIRED_ANIMATIONS) {
    if (!names.includes(required)) errors.push(`The animation "${required}" is missing.`);
  }
  return errors;
}
