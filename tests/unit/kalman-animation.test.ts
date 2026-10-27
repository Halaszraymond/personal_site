/**
 * Unit tests for the animation logic (src/lib/kalman-animation.ts; spec: kalman-animation).
 * Easing curves are passed in, so these tests use simple ones instead of GSAP's.
 */
import { describe, expect, it } from 'vitest';
import {
  blendPoses,
  duration,
  EASES,
  headTurn,
  playLength,
  samplePose,
  validateAnimations,
  type Animation,
  type EaseOf,
} from '../../src/lib/kalman-animation';
import type { Pose, Rig, Rigs } from '../../src/lib/kalman-rig';

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

/** A rig with only the given layer names: validateAnimations() only reads the names. */
const rigOf = (...names: string[]): Rig => ({
  artboard: [100, 100],
  layers: names.map((name, order) => ({
    name,
    image: `${name}.png`,
    size: [10, 10],
    position: [0, 0],
    pivot: [5, 5],
    parent: order === 0 ? null : 'body',
    order,
    rotate: [-10, 10],
  })),
});
const RIGS: Rigs = { front: rigOf('body', 'head'), side: rigOf('body', 'tail') };

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
    expect(validateAnimations(all, poses, RIGS)).toEqual([]);
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
    expect(validateAnimations([...all.slice(0, 1), late, ...all.slice(2)], poses, RIGS)).toEqual([
      'Animation "bow": the keyframe at 0.5 s comes after the one at 1 s.',
    ]);
  });

  it('rejects a pose its figure doesn’t have (spec: "Unknown pose")', () => {
    const swim = { ...valid('swim', 'side'), keyframes: [{ at: 0, pose: 'nod' }] };
    expect(
      validateAnimations([...all.filter((a) => a.name !== 'swim'), swim], poses, RIGS),
    ).toEqual(['Animation "swim" names the pose "nod", which its side figure doesn\'t have.']);
  });

  it('rejects a late start, an unknown easing and a missing animation', () => {
    const bow = { ...valid('bow'), keyframes: [{ at: 0.2, pose: 'rest', ease: 'elastic.out' }] };
    expect(validateAnimations([bow], poses, RIGS)).toEqual([
      'Animation "bow" must start with a keyframe at 0 seconds.',
      'Animation "bow" uses the unknown easing "elastic.out".',
      'The animation "idle" is missing.',
      'The animation "head-follow" is missing.',
      'The animation "dive" is missing.',
      'The animation "swim" is missing.',
      'The animation "launch" is missing.',
    ]);
  });
});

// ---------------------------------------------------------------------------------------
// Lag, length, stretch and overshoot (spec: "Layers can trail behind", "Playback ends where it
// should", "Poses blend smoothly between keyframes"; design §2-§4)
// ---------------------------------------------------------------------------------------

describe('lag', () => {
  // The dive, simplified: the body and the tail both go from rest (0°) to 20° in one second.
  const SWING: Pose = {
    name: 'swing',
    label: 'Swing',
    figure: 'side',
    layers: { body: { rotate: 20 }, tail: { rotate: 20 } },
  };
  const SIDE_POSES = new Map([
    ['rest', { ...REST, figure: 'side' as const }],
    ['swing', SWING],
  ]);
  const DIVE: Animation = {
    name: 'dive',
    label: 'Dive',
    figure: 'side',
    loop: false,
    lag: { tail: 0.1 },
    keyframes: [
      { at: 0, pose: 'rest' },
      { at: 2, pose: 'swing' },
    ],
  };
  const angle = (animation: Animation, time: number, layer: string) =>
    samplePose(animation, SIDE_POSES, time, linear).layers[layer]?.rotate ?? 0;

  it('shows a trailing layer where the animation was that much earlier (spec: "A trailing tail")', () => {
    // At 1.0 s the body is halfway (10°); the tail shows 0.9 s: 9°.
    expect(angle(DIVE, 1, 'body')).toBeCloseTo(10, 9);
    expect(angle(DIVE, 1, 'tail')).toBeCloseTo(9, 9);
  });

  it('holds a trailing layer at the first pose before the start, and lets it catch up after the end', () => {
    expect(angle(DIVE, 0.05, 'tail')).toBe(0);
    // The last keyframe is at 2 s; the tail reaches it 0.1 s later.
    expect(angle(DIVE, 2.05, 'tail')).toBeCloseTo(19.5, 9);
    expect(angle(DIVE, 2.1, 'tail')).toBeCloseTo(20, 9);
  });

  it('leaves layers without a lag exactly on the keyframes', () => {
    const withoutLag: Animation = { ...DIVE, lag: {} };
    for (const time of [0, 0.5, 1, 1.7, 2]) {
      expect(angle(DIVE, time, 'body')).toBe(angle(withoutLag, time, 'body'));
    }
  });

  it('wraps around in a loop, carrying the end of one round into the next (spec: "Lag in a loop")', () => {
    // A stroke that swings out and back in 2 s: 0° → 20° → 0°.
    const STROKE: Animation = {
      ...DIVE,
      name: 'stroke',
      loop: true,
      lag: { tail: 0.5 },
      keyframes: [
        { at: 0, pose: 'swing' },
        { at: 1, pose: 'rest' },
        { at: 2, pose: 'swing' },
      ],
    };
    // Just after the start the tail shows 1.6 s of the previous round (12°), not 0.1 s held still.
    expect(angle(STROKE, 0.1, 'tail')).toBeCloseTo(12, 9);
  });
});

describe('playLength', () => {
  const base: Animation = { ...NODDING, lag: { head: 0.08, glasses: 0.15 } };

  it('adds the largest lag to a non-looping animation, so it ends once every layer has settled', () => {
    expect(playLength(base)).toBeCloseTo(2.15, 9);
    expect(playLength(NODDING)).toBe(2);
  });

  it('keeps a loop at its keyframes’ length, because its lagging layers wrap around', () => {
    expect(playLength({ ...base, loop: true })).toBe(duration(base));
  });
});

describe('stretch and overshoot', () => {
  it('blends a stretch like any other value: halfway between 1 and 0.9 is 0.95', () => {
    const squash: Pose = { ...REST, name: 'squash', layers: { body: { stretch: 0.9 } } };
    expect(blendPoses(REST, squash, 0.5).layers['body']?.stretch).toBeCloseTo(0.95, 12);
  });

  it('gives no stretch to a layer that neither pose stretches', () => {
    expect(blendPoses(REST, NOD, 0.5).layers['head']).not.toHaveProperty('stretch');
  });

  it('allows the overshooting back easings', () => {
    expect(EASES).toContain('back.out');
    expect(EASES).toContain('back.inOut');
  });
});

describe('validating the lag', () => {
  const poses: Pose[] = [REST, { name: 'stroke', label: 'Stroke', figure: 'side', layers: {} }];
  const named = (name: string) => ({
    name,
    label: name,
    figure: 'front',
    loop: false,
    keyframes: [{ at: 0, pose: 'rest' }],
  });
  const others = ['idle', 'head-follow', 'dive', 'swim', 'launch'].map(named);

  it('accepts a lag for the figure’s own layers', () => {
    const bow = { ...named('bow'), lag: { head: 0.05 } };
    expect(validateAnimations([bow, ...others], poses, RIGS)).toEqual([]);
  });

  it('rejects a lag for a layer only the other figure has (spec: "Lag for an unknown layer")', () => {
    const bow = { ...named('bow'), lag: { tail: 0.1 } };
    expect(validateAnimations([bow, ...others], poses, RIGS)).toEqual([
      'Animation "bow" gives a lag to the layer "tail", which its figure doesn\'t have.',
    ]);
  });

  it('rejects a negative lag, a lag that is not a number, and a lag that is not an object', () => {
    const negative = { ...named('bow'), lag: { head: -0.1, body: '0.2' } };
    expect(validateAnimations([negative, ...others], poses, RIGS)).toEqual([
      'Animation "bow" needs the lag of "head" as 0 or more seconds.',
      'Animation "bow" needs the lag of "body" as 0 or more seconds.',
    ]);
    const list = { ...named('bow'), lag: [0.1] };
    expect(validateAnimations([list, ...others], poses, RIGS)).toEqual([
      'Animation "bow" needs "lag" as an object of layer names and seconds.',
    ]);
  });
});
