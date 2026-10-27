/**
 * Unit tests for the animation logic (src/lib/kalman-animation.ts; spec: kalman-animation).
 * Easing curves are passed in, so these tests use simple ones instead of GSAP's.
 */
import { describe, expect, it } from 'vitest';
import {
  blendPoses,
  duration,
  headTurn,
  samplePose,
  validateAnimations,
  type Animation,
  type EaseOf,
} from '../../src/lib/kalman-animation';
import type { Pose } from '../../src/lib/kalman-rig';

/** Linear for every name: progress in, the same progress out. */
const linear: EaseOf = () => (t) => t;
/** A fixed S-curve (smoothstep) for every name, to see that easing is applied. */
const sCurve: EaseOf = () => (t) => t * t * (3 - 2 * t);

const REST: Pose = { name: 'rest', label: 'Rest', figure: 'front', layers: {} };
const NOD: Pose = {
  name: 'nod',
  label: 'Nod',
  figure: 'front',
  layers: { head: { rotate: 20, offset: [0, 10] } },
};
const POSES = new Map([
  ['rest', REST],
  ['nod', NOD],
]);

const NODDING: Animation = {
  name: 'nodding',
  label: 'Nodding',
  figure: 'front',
  loop: false,
  keyframes: [
    { at: 0, pose: 'rest', ease: 'power2.inOut' },
    { at: 1, pose: 'nod' },
    { at: 2, pose: 'rest' },
  ],
};

describe('blendPoses', () => {
  it('is the first pose at 0, the second at 1, and halfway in between at 0.5', () => {
    expect(blendPoses(REST, NOD, 0).layers['head']).toEqual({ rotate: 0, offset: [0, 0] });
    expect(blendPoses(REST, NOD, 1).layers['head']).toEqual({ rotate: 20, offset: [0, 10] });
    expect(blendPoses(REST, NOD, 0.5).layers['head']).toEqual({ rotate: 10, offset: [0, 5] });
  });

  it('keeps the figure of the poses', () => {
    const side: Pose = { ...REST, figure: 'side' };
    expect(blendPoses(side, side, 0.3).figure).toBe('side');
  });
});

describe('samplePose', () => {
  it('is exactly a keyframe’s pose at its own moment (spec: "Exactly at a keyframe")', () => {
    expect(samplePose(NODDING, POSES, 1, linear).layers).toEqual(NOD.layers);
    expect(samplePose(NODDING, POSES, 0, linear).layers).toEqual({});
  });

  it('is halfway with a linear easing (spec: "Halfway with linear easing")', () => {
    expect(samplePose(NODDING, POSES, 0.5, linear).layers['head']?.rotate).toBe(10);
    // From nod back to rest, a quarter of the way: 15 degrees.
    expect(samplePose(NODDING, POSES, 1.25, linear).layers['head']?.rotate).toBe(15);
  });

  it('runs the progress through the keyframe’s easing curve', () => {
    // Smoothstep at a quarter: 0.15625 of the way, so 3.125 degrees instead of 5.
    expect(samplePose(NODDING, POSES, 0.25, sCurve).layers['head']?.rotate).toBeCloseTo(3.125);
  });

  it('stays at the first pose before the start and the last after the end', () => {
    expect(samplePose(NODDING, POSES, -1, linear).layers).toEqual({});
    expect(samplePose(NODDING, POSES, 5, linear).layers).toEqual({});
  });

  it('never turns a layer beyond the two poses it blends (so never outside its range)', () => {
    for (let time = 0; time <= 2; time += 0.05) {
      const rotate = samplePose(NODDING, POSES, time, sCurve).layers['head']?.rotate ?? 0;
      expect(rotate).toBeGreaterThanOrEqual(0);
      expect(rotate).toBeLessThanOrEqual(20);
    }
  });

  it('is named after the animation, and knows its length', () => {
    expect(samplePose(NODDING, POSES, 0.5, linear).name).toBe('nodding');
    expect(duration(NODDING)).toBe(2);
  });
});

describe('headTurn', () => {
  const pivot = [800, 300] as const;
  const range = [-25, 25] as const;

  it('does not turn for a point straight above the head', () => {
    expect(headTurn([800, 0], pivot, range, 500)).toBe(0);
  });

  it('turns to the end of the range for a point far to the right or left', () => {
    expect(headTurn([1600, 300], pivot, range, 500)).toBe(25);
    expect(headTurn([0, 300], pivot, range, 500)).toBe(-25);
  });

  it('turns proportionally in between', () => {
    expect(headTurn([1050, 300], pivot, range, 500)).toBe(12.5);
    expect(headTurn([550, 300], pivot, range, 500)).toBe(-12.5);
  });
});

describe('validateAnimations', () => {
  const poses: Pose[] = [
    REST,
    NOD,
    { name: 'stroke', label: 'Stroke', figure: 'side', layers: {} },
  ];
  const valid = (name: string, figure: 'front' | 'side' = 'front') => ({
    name,
    label: name,
    figure,
    loop: false,
    keyframes: [{ at: 0, pose: figure === 'front' ? 'rest' : 'stroke' }],
  });
  const all = ['idle', 'bow', 'head-follow', 'dive', 'swim', 'launch'].map((name) => valid(name));

  it('accepts valid animations', () => {
    expect(validateAnimations(all, poses)).toEqual([]);
  });

  it('rejects keyframes out of order, naming the animation and the two keyframes', () => {
    const late = {
      ...valid('bow'),
      keyframes: [
        { at: 0, pose: 'rest' },
        { at: 1, pose: 'nod' },
        { at: 0.5, pose: 'rest' },
      ],
    };
    expect(validateAnimations([...all.slice(0, 1), late, ...all.slice(2)], poses)).toEqual([
      'Animation "bow": the keyframe at 0.5 s comes after the one at 1 s.',
    ]);
  });

  it('rejects a pose its figure doesn’t have (spec: "Unknown pose")', () => {
    const swim = { ...valid('swim', 'side'), keyframes: [{ at: 0, pose: 'nod' }] };
    expect(validateAnimations([...all.filter((a) => a.name !== 'swim'), swim], poses)).toEqual([
      'Animation "swim" names the pose "nod", which its side figure doesn\'t have.',
    ]);
  });

  it('rejects a late start, an unknown easing and a missing animation', () => {
    const bow = { ...valid('bow'), keyframes: [{ at: 0.2, pose: 'rest', ease: 'back.out' }] };
    expect(validateAnimations([bow], poses)).toEqual([
      'Animation "bow" must start with a keyframe at 0 seconds.',
      'Animation "bow" uses the unknown easing "back.out".',
      'The animation "idle" is missing.',
      'The animation "head-follow" is missing.',
      'The animation "dive" is missing.',
      'The animation "swim" is missing.',
      'The animation "launch" is missing.',
    ]);
  });
});
