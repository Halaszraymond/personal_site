/**
 * Checks how the repo's animations move (spec: kalman-animation, "The bow is a deep, polite
 * bow", "The dive moves like a dive", "The swim moves like a stroke", "The launch is
 * professional, the landing goofy").
 *
 * Each moment is sampled the way the player draws it: samplePose() with GSAP's own easing
 * curves, then clampToRig(). So these tests see exactly what the preview shows at that time,
 * and they keep holding while Raymond tunes the numbers, as long as the movement stays right.
 */
import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import {
  drawnFrame,
  duration,
  playLength,
  samplePose,
  type Animation,
  type EaseOf,
} from '../../src/lib/kalman-animation';
import {
  applyToPoint,
  clampToRig,
  figureOf,
  resolvePose,
  validateRig,
  type Figure,
  type LayerPose,
  type Pose,
  type Rig,
} from '../../src/lib/kalman-rig';
import animationData from '../../src/scene/kalman/animations.json';
import poseData from '../../src/scene/kalman/poses.json';
import rigData from '../../src/scene/kalman/rig.json';

const easeOf: EaseOf = (name) => gsap.parseEase(name);

function rigOf(figure: Figure): Rig {
  const result = validateRig(rigData[figure], () => true);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return result.value;
}

// The repo's JSON, checked by kalman-animation-data.test.ts, so it may be treated as typed here.
const animations = animationData as unknown as Animation[];
const poses = poseData as unknown as Pose[];

function animation(name: string): Animation {
  const found = animations.find((a) => a.name === name);
  if (found === undefined) throw new Error(`No animation ${name}`);
  return found;
}

/** The pose of `name` at `time`, as the player draws it. */
function at(name: string, time: number): Readonly<Record<string, LayerPose>> {
  const anim = animation(name);
  const byName = new Map(
    poses.filter((p) => figureOf(p) === anim.figure).map((p) => [p.name, p] as const),
  );
  return clampToRig(samplePose(anim, byName, time, easeOf), rigOf(anim.figure)).layers;
}

const rotate = (layers: Readonly<Record<string, LayerPose>>, layer: string) =>
  layers[layer]?.rotate ?? 0;
const stretch = (layers: Readonly<Record<string, LayerPose>>, layer: string) =>
  layers[layer]?.stretch ?? 1;
const offset = (layers: Readonly<Record<string, LayerPose>>, layer: string) =>
  layers[layer]?.offset ?? [0, 0];

/**
 * Where a figure lies on the artboard in `layers`: the front of its whole outline (the bill, the
 * smallest x) and the vertical middle of its body (the torso). The glide must match the swimming
 * figure on both, so the cross-fade between them never shows two penguins.
 */
function placement(
  figure: Figure,
  layers: Readonly<Record<string, LayerPose>>,
): { front: number; bodyMiddle: number } {
  const rig = rigOf(figure);
  let front = Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const layer of resolvePose(rig, { name: 'x', label: 'x', figure, layers }, 'goofy')) {
    if (!layer.visible) continue;
    const [width, height] = rig.layers.find((l) => l.name === layer.name)?.size ?? [0, 0];
    for (const corner of [
      [0, 0],
      [width, 0],
      [0, height],
      [width, height],
    ] as const) {
      const [x, y] = applyToPoint(layer.matrix, corner);
      front = Math.min(front, x);
      if (layer.name === 'body') {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }
  return { front, bodyMiddle: (top + bottom) / 2 };
}

/** Where the swimming figure lies at rest: where the glide must lie. */
const SWIMMING = placement('swim', {});

/** True when `layers` of the side figure lie where the swimming figure swims. */
function expectWhereHeSwims(layers: Readonly<Record<string, LayerPose>>): void {
  const side = placement('side', layers);
  expect(Math.abs(side.bodyMiddle - SWIMMING.bodyMiddle)).toBeLessThanOrEqual(10);
  expect(Math.abs(side.front - SWIMMING.front)).toBeLessThanOrEqual(40);
}

/** The moment of an animation's keyframe that uses `pose` (the first one, or the n-th). */
function keyframeAt(name: string, pose: string, nth = 0): number {
  const times = animation(name)
    .keyframes.filter((k) => k.pose === pose)
    .map((k) => k.at);
  const time = times[nth];
  if (time === undefined) throw new Error(`${name} has no keyframe ${nth} with ${pose}`);
  return time;
}

describe('the bow (spec: "The bow is a deep, polite bow")', () => {
  const bow = animation('bow');
  const deepest = keyframeAt('bow', 'bow');

  it('shows the drawn bow at its deepest moment (scenario "The deepest moment")', () => {
    expect(bow.figure).toBe('front');
    expect(drawnFrame(bow, deepest)).toEqual({ name: 'bow', opacity: 1 });
  });

  // Halfway through the cross-fade: the drawing fades in from `fade` before the deepest moment.
  const halfway = deepest - (bow.fade ?? 0.2) / 2;

  it('has the head well down and shorter, the body upright and the flippers calm halfway through the cross-fade (scenario "On the way down")', () => {
    const layers = at('bow', halfway);
    const headHeight = rigOf('front').layers.find((l) => l.name === 'head')?.size[1] ?? 0;
    expect(offset(layers, 'head')[1]).toBeGreaterThanOrEqual(headHeight / 4);
    expect(stretch(layers, 'head')).toBeLessThan(1);
    expect(Math.abs(rotate(layers, 'body'))).toBeLessThanOrEqual(2);
    expect(Math.abs(rotate(layers, 'flipperLeft'))).toBeLessThanOrEqual(3);
    expect(Math.abs(rotate(layers, 'flipperRight'))).toBeLessThanOrEqual(3);
  });

  it('is still bending while the drawn bow fades in (spec: "The bow folds smoothly")', () => {
    expect(offset(at('bow', halfway), 'head')[1]).toBeLessThan(
      offset(at('bow', deepest), 'head')[1],
    );
  });

  it('ends at rest, with the drawing gone', () => {
    const end = at('bow', playLength(bow));
    for (const layer of Object.values(end)) {
      expect(layer.rotate ?? 0).toBeCloseTo(0, 6);
      expect(layer.stretch ?? 1).toBeCloseTo(1, 6);
    }
    expect(drawnFrame(bow, playLength(bow))).toBeUndefined();
  });
});

describe('the dive (spec: "The dive moves like a dive")', () => {
  it('leans forward, lower than at rest and squashed, at the end of the crouch (scenario "Crouch before the hop")', () => {
    const layers = at('dive', keyframeAt('dive', 'crouch'));
    expect(rotate(layers, 'body')).toBeLessThan(0);
    expect(offset(layers, 'body')[1]).toBeGreaterThan(0);
    expect(stretch(layers, 'body')).toBeLessThan(1);
    // On bent knees: the body sinks over feet that stay on the ground.
    expect(layers['footFront']?.plant).toBeCloseTo(1, 6);
    expect(layers['footBack']?.plant).toBeCloseTo(1, 6);
  });

  it('is higher than at rest, with the flipper flung out, just after the hop (scenario "The hop")', () => {
    const layers = at('dive', keyframeAt('dive', 'diveHop'));
    // y points down on the artboard: higher is negative.
    expect(offset(layers, 'body')[1]).toBeLessThan(0);
    expect(Math.abs(rotate(layers, 'flipper'))).toBeGreaterThan(20);
  });

  it('goes in head first, stretched, with the tail and feet still catching up (scenario "Face first")', () => {
    const entry = keyframeAt('dive', 'dive');
    const layers = at('dive', entry);
    // Past horizontal (−90°): the head is lower than the tail.
    expect(rotate(layers, 'body')).toBeLessThan(-90);
    expect(stretch(layers, 'body')).toBeGreaterThan(1);
    const target = poses.find((p) => p.figure === 'side' && p.name === 'dive')?.layers;
    expect(rotate(layers, 'tail')).toBeLessThan(target?.['tail']?.rotate ?? 0);
    expect(rotate(layers, 'footFront')).toBeLessThan(target?.['footFront']?.rotate ?? 0);
  });

  it('levels out into a glide where the swimming figure swims (scenario "Levelling out")', () => {
    const end = at('dive', playLength(animation('dive')));
    // Horizontal, head forward (−90° lies him on his front with the bill to the left).
    expect(rotate(end, 'body')).toBeCloseTo(-90, 0);
    expectWhereHeSwims(end);
  });
});

describe('the swim (spec: "The swim moves like a stroke")', () => {
  const swim = animation('swim');
  const times = Array.from({ length: 73 }, (_, i) => (i / 72) * duration(swim));

  it('swims as the swimming figure, close to its drawn horizontal line (scenario "Horizontal")', () => {
    expect(swim.figure).toBe('swim');
    for (const time of times)
      expect(Math.abs(rotate(at('swim', time), 'body'))).toBeLessThanOrEqual(12);
  });

  it('is further forward and stretched at the end of the down stroke (scenario "Surge on the down stroke")', () => {
    const down = at('swim', keyframeAt('swim', 'strokeDown', 1));
    const up = at('swim', keyframeAt('swim', 'strokeUp', 0));
    // Forward is to the left, towards the bill: a smaller x.
    expect(offset(down, 'body')[0]).toBeLessThan(offset(up, 'body')[0]);
    expect(stretch(down, 'body')).toBeGreaterThan(1);
  });

  it('lets the flipper reach a turning point of the stroke after the body (scenario "Trailing")', () => {
    const turn = keyframeAt('swim', 'strokeDown', 1);
    const lag = swim.lag?.['flipper'] ?? 0;
    expect(lag).toBeGreaterThan(0);
    // When the body reaches the end of the down stroke, the flipper is still on its way down.
    expect(rotate(at('swim', turn), 'flipper')).toBeLessThan(
      rotate(at('swim', turn + lag), 'flipper'),
    );
  });

  it('tips his body aside once per loop, as if at a fish, and back (scenario "A glance at a fish")', () => {
    // The strokes pitch the body a few degrees; a glance tips it clearly further.
    const glancing = times.map((time) => Math.abs(rotate(at('swim', time), 'body')) > 6);
    const starts = glancing.filter((now, i) => now && !glancing[i - 1]).length;
    expect(starts).toBe(1);
    expect(glancing[0]).toBe(false);
  });
});

describe('the launch (spec: "The launch is professional, the landing goofy")', () => {
  const launch = animation('launch');

  it('starts from the glide, where the swimming figure swims (scenario "From the swim")', () => {
    const start = at('launch', 0);
    expect(rotate(start, 'body')).toBeCloseTo(-90, 0);
    expectWhereHeSwims(start);
  });

  it('swoops up almost upright under the water before he rises', () => {
    const turn = at('launch', keyframeAt('launch', 'launchTurn'));
    expect(Math.abs(rotate(turn, 'body'))).toBeLessThan(45);
    // Lower than when he rises: still under the surface.
    expect(offset(turn, 'body')[1]).toBeGreaterThan(
      offset(at('launch', keyframeAt('launch', 'launchRise')), 'body')[1],
    );
  });

  it('rises stretched, with the flipper close to the body (scenario "Rising")', () => {
    const layers = at('launch', keyframeAt('launch', 'launchRise'));
    expect(offset(layers, 'body')[1]).toBeLessThan(0);
    expect(stretch(layers, 'body')).toBeGreaterThan(1);
    expect(Math.abs(rotate(layers, 'flipper'))).toBeLessThanOrEqual(10);
  });

  it('lands on his belly, close to horizontal, at ground level, squashed (scenario "Landing on his belly")', () => {
    const layers = at('launch', keyframeAt('launch', 'landing'));
    expect(rotate(layers, 'body')).toBeGreaterThan(-100);
    expect(rotate(layers, 'body')).toBeLessThan(-75);
    expect(stretch(layers, 'body')).toBeLessThan(1);
    // Ground level: his belly touches the ground line (where his feet stand at rest). Lying on
    // his front, the belly is the side of the body image the bill faces (x = 0), widest about
    // halfway down; that point must be on the ground.
    const rig = rigOf('side');
    const ground = Math.max(...rig.layers.map((l) => l.position[1] + l.size[1]));
    const body = resolvePose(rig, { name: 'x', label: 'x', figure: 'side', layers }, 'goofy').find(
      (l) => l.name === 'body',
    );
    const height = rig.layers.find((l) => l.name === 'body')?.size[1] ?? 0;
    const belly = body ? applyToPoint(body.matrix, [0, height * 0.55])[1] : 0;
    expect(Math.abs(belly - ground)).toBeLessThanOrEqual(25);
  });

  it('pushes himself up on planted feet with the flipper out, then ends at rest (scenario "Standing up")', () => {
    const layers = at('launch', keyframeAt('launch', 'pushUp'));
    expect(rotate(layers, 'body')).toBeGreaterThan(-80);
    expect(rotate(layers, 'body')).toBeLessThan(-10);
    // Planted once the trailing feet have caught up with the pose.
    const caughtUp = at(
      'launch',
      keyframeAt('launch', 'pushUp') + (launch.lag?.['footFront'] ?? 0),
    );
    expect(caughtUp['footFront']?.plant).toBeCloseTo(1, 6);
    expect(Math.abs(rotate(layers, 'flipper'))).toBeGreaterThan(30);
    for (const layer of Object.values(at('launch', playLength(launch)))) {
      expect(layer.rotate ?? 0).toBeCloseTo(0, 6);
      expect(layer.stretch ?? 1).toBeCloseTo(1, 6);
    }
  });
});
