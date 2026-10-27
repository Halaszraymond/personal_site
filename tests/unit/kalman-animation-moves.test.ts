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
  clampToRig,
  figureOf,
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

  it('has the head well down, the body upright and the flippers calm just before the cross-fade (scenario "On the way down")', () => {
    const justBefore = deepest - (bow.fade ?? 0.2);
    const layers = at('bow', justBefore);
    const headHeight = rigOf('front').layers.find((l) => l.name === 'head')?.size[1] ?? 0;
    expect(offset(layers, 'head')[1]).toBeGreaterThanOrEqual(headHeight / 4);
    expect(Math.abs(rotate(layers, 'body'))).toBeLessThanOrEqual(2);
    expect(Math.abs(rotate(layers, 'flipperLeft'))).toBeLessThanOrEqual(3);
    expect(Math.abs(rotate(layers, 'flipperRight'))).toBeLessThanOrEqual(3);
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
});

describe('the swim (spec: "The swim moves like a stroke")', () => {
  const swim = animation('swim');
  const times = Array.from({ length: 73 }, (_, i) => (i / 72) * duration(swim));

  it('lies close to horizontal, bill first, at every moment (scenario "Horizontal")', () => {
    for (const time of times) {
      const body = rotate(at('swim', time), 'body');
      expect(body).toBeGreaterThan(-100);
      expect(body).toBeLessThan(-80);
    }
  });

  it('is further forward and stretched at the end of the down stroke (scenario "Surge on the down stroke")', () => {
    const down = at('swim', keyframeAt('swim', 'strokeDown', 1));
    const up = at('swim', keyframeAt('swim', 'strokeUp', 0));
    // Forward is to the left, towards the bill: a smaller x.
    expect(offset(down, 'body')[0]).toBeLessThan(offset(up, 'body')[0]);
    expect(stretch(down, 'body')).toBeGreaterThan(1);
  });

  it('lets the tail and feet reach a turning point after the body (scenario "Trailing")', () => {
    const turn = keyframeAt('swim', 'strokeDown', 1);
    const lag = swim.lag?.['tail'] ?? 0;
    expect(lag).toBeGreaterThan(0);
    // When the body turns, the tail is still on its way; it gets there `lag` seconds later.
    expect(rotate(at('swim', turn), 'tail')).toBeLessThan(rotate(at('swim', turn + lag), 'tail'));
    const feetLag = swim.lag?.['footFront'] ?? 0;
    expect(rotate(at('swim', turn), 'footFront')).toBeLessThan(
      rotate(at('swim', turn + feetLag), 'footFront'),
    );
  });

  it('glances aside once per loop and looks ahead again (scenario "A glance at a fish")', () => {
    // While swimming the head is turned back so the bill points forward; a glance turns it
    // away from that swimming position.
    const swimming = poses.find((p) => p.figure === 'side' && p.name === 'strokeDown')?.layers;
    const ahead = swimming?.['head']?.rotate ?? 0;
    const glancing = times.map((time) => Math.abs(rotate(at('swim', time), 'head') - ahead) > 10);
    // One stretch of glancing: it starts once (false → true) in the whole loop.
    const starts = glancing.filter((now, i) => now && !glancing[i - 1]).length;
    expect(starts).toBe(1);
    expect(glancing[0]).toBe(false);
  });
});

describe('the launch (spec: "The launch is professional, the landing goofy")', () => {
  const launch = animation('launch');

  it('rises stretched, with the flipper close to the body (scenario "Rising")', () => {
    const layers = at('launch', keyframeAt('launch', 'launchRise'));
    expect(offset(layers, 'body')[1]).toBeLessThan(0);
    expect(stretch(layers, 'body')).toBeGreaterThan(1);
    expect(Math.abs(rotate(layers, 'flipper'))).toBeLessThanOrEqual(10);
  });

  it('lands at ground level, squashed (scenario "Landing")', () => {
    const layers = at('launch', keyframeAt('launch', 'landing'));
    expect(Math.abs(offset(layers, 'body')[1])).toBeLessThanOrEqual(1);
    expect(stretch(layers, 'body')).toBeLessThan(1);
  });

  it('tips forward with the flipper out, then ends at rest (scenario "Almost losing his balance")', () => {
    const layers = at('launch', keyframeAt('launch', 'landingWobble'));
    expect(rotate(layers, 'body')).toBeLessThan(0);
    expect(Math.abs(rotate(layers, 'flipper'))).toBeGreaterThanOrEqual(60);
    for (const layer of Object.values(at('launch', playLength(launch)))) {
      expect(layer.rotate ?? 0).toBeCloseTo(0, 6);
      expect(layer.stretch ?? 1).toBeCloseTo(1, 6);
    }
  });
});
