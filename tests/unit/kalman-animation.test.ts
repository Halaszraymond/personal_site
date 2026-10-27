/**
 * Unit tests for the animation logic (src/lib/kalman-animation.ts; spec: kalman-animation).
 * Easing curves are passed in, so these tests use simple ones instead of GSAP's.
 */
import { describe, expect, it } from 'vitest';
import {
  blendPoses,
  crossFade,
  drawnFrame,
  duration,
  BODY_SHARE,
  EASES,
  eyeShift,
  followAngles,
  HEAD_SHARE,
  headTurn,
  hermite,
  playLength,
  samplePose,
  smoothSlope,
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
const RIGS: Rigs = {
  front: rigOf('body', 'head'),
  side: rigOf('body', 'tail'),
  swim: rigOf('body', 'flipper'),
};
/** One drawn pose, the front figure's bow. */
const DRAWN = [{ name: 'bow', figure: 'front' as const }];

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
    expect(validateAnimations(all, poses, RIGS, DRAWN)).toEqual([]);
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
    expect(
      validateAnimations([...all.slice(0, 1), late, ...all.slice(2)], poses, RIGS, DRAWN),
    ).toEqual(['Animation "bow": the keyframe at 0.5 s comes after the one at 1 s.']);
  });

  it('rejects a pose its figure doesn’t have (spec: "Unknown pose")', () => {
    const swim = { ...valid('swim', 'side'), keyframes: [{ at: 0, pose: 'nod' }] };
    expect(
      validateAnimations([...all.filter((a) => a.name !== 'swim'), swim], poses, RIGS, DRAWN),
    ).toEqual(['Animation "swim" names the pose "nod", which its side figure doesn\'t have.']);
  });

  it('rejects a late start, an unknown easing and a missing animation', () => {
    const bow = { ...valid('bow'), keyframes: [{ at: 0.2, pose: 'rest', ease: 'elastic.out' }] };
    expect(validateAnimations([bow], poses, RIGS, DRAWN)).toEqual([
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
    expect(validateAnimations([bow, ...others], poses, RIGS, DRAWN)).toEqual([]);
  });

  it('rejects a lag for a layer only the other figure has (spec: "Lag for an unknown layer")', () => {
    const bow = { ...named('bow'), lag: { tail: 0.1 } };
    expect(validateAnimations([bow, ...others], poses, RIGS, DRAWN)).toEqual([
      'Animation "bow" gives a lag to the layer "tail", which its figure doesn\'t have.',
    ]);
  });

  it('rejects a negative lag, a lag that is not a number, and a lag that is not an object', () => {
    const negative = { ...named('bow'), lag: { head: -0.1, body: '0.2' } };
    expect(validateAnimations([negative, ...others], poses, RIGS, DRAWN)).toEqual([
      'Animation "bow" needs the lag of "head" as 0 or more seconds.',
      'Animation "bow" needs the lag of "body" as 0 or more seconds.',
    ]);
    const list = { ...named('bow'), lag: [0.1] };
    expect(validateAnimations([list, ...others], poses, RIGS, DRAWN)).toEqual([
      'Animation "bow" needs "lag" as an object of layer names and seconds.',
    ]);
  });
});

// ---------------------------------------------------------------------------------------
// Drawn poses (spec: "An animation can show a drawn pose"; design §8)
// ---------------------------------------------------------------------------------------

describe('drawnFrame', () => {
  // A bow: down by 1 s, the drawn bow held from 1 s to 1.6 s, back up by 2.4 s; fade 0.2 s.
  const BOWING: Animation = {
    ...NODDING,
    name: 'bowing',
    fade: 0.2,
    keyframes: [
      { at: 0, pose: 'rest' },
      { at: 1, pose: 'nod', drawn: 'bow' },
      { at: 1.6, pose: 'nod', drawn: 'bow' },
      { at: 2.4, pose: 'rest' },
    ],
  };

  it('shows the drawing fully from the first to the last keyframe naming it (spec: "Holding the drawn pose")', () => {
    for (const time of [1, 1.3, 1.6]) {
      expect(drawnFrame(BOWING, time)).toEqual({ name: 'bow', opacity: 1 });
    }
  });

  it('is half see-through halfway through the cross-fade, in and out (spec: "Halfway through the cross-fade")', () => {
    expect(drawnFrame(BOWING, 0.9)?.opacity).toBeCloseTo(0.5, 9);
    expect(drawnFrame(BOWING, 1.7)?.opacity).toBeCloseTo(0.5, 9);
  });

  it('shows nothing before the fade starts or after it ends, and without drawn keyframes', () => {
    expect(drawnFrame(BOWING, 0.79)).toBeUndefined();
    expect(drawnFrame(BOWING, 1.81)).toBeUndefined();
    expect(drawnFrame(NODDING, 1)).toBeUndefined();
  });

  it('fades over 0.2 s when the animation doesn’t say, and switches at once with a fade of 0', () => {
    const { fade, ...withoutFade } = BOWING;
    expect(fade).toBe(0.2);
    expect(drawnFrame(withoutFade, 0.9)?.opacity).toBeCloseTo(0.5, 9);
    expect(drawnFrame({ ...BOWING, fade: 0 }, 0.99)).toBeUndefined();
  });
});

describe('validating drawn poses and the fade', () => {
  const poses: Pose[] = [REST, { name: 'stroke', label: 'Stroke', figure: 'side', layers: {} }];
  const named = (name: string, figure = 'front') => ({
    name,
    label: name,
    figure,
    loop: false,
    keyframes: [{ at: 0, pose: figure === 'front' ? 'rest' : 'stroke' }],
  });
  const others = ['idle', 'head-follow', 'dive', 'swim', 'launch'].map((name) => named(name));

  it('accepts a keyframe showing a drawn pose of its own figure', () => {
    const bow = { ...named('bow'), keyframes: [{ at: 0, pose: 'rest', drawn: 'bow' }] };
    expect(validateAnimations([bow, ...others], poses, RIGS, DRAWN)).toEqual([]);
  });

  it('rejects an unknown drawn pose, and one of the other figure', () => {
    const bow = { ...named('bow'), keyframes: [{ at: 0, pose: 'rest', drawn: 'curtsy' }] };
    const dive = { ...named('dive', 'side'), keyframes: [{ at: 0, pose: 'stroke', drawn: 'bow' }] };
    const rest = others.filter((a) => a.name !== 'dive');
    expect(validateAnimations([bow, dive, ...rest], poses, RIGS, DRAWN)).toEqual([
      'Animation "bow" shows the drawn pose "curtsy", which its front figure doesn\'t have.',
      'Animation "dive" shows the drawn pose "bow", which its side figure doesn\'t have.',
    ]);
  });

  it('rejects a fade that is negative or not a number', () => {
    const bow = { ...named('bow'), fade: -1 };
    expect(validateAnimations([bow, ...others], poses, RIGS, DRAWN)).toEqual([
      'Animation "bow" needs "fade" as 0 or more seconds.',
    ]);
  });
});

describe('crossFade', () => {
  it('fades the drawing in over solid layers, then the layers out under a solid drawing', () => {
    expect(crossFade(0)).toEqual({ drawing: 0, layers: 1 });
    expect(crossFade(0.25)).toEqual({ drawing: 0.5, layers: 1 });
    expect(crossFade(0.75)).toEqual({ drawing: 1, layers: 0.5 });
    expect(crossFade(1)).toEqual({ drawing: 1, layers: 0 });
  });

  it('is never see-through: halfway both are solid (scenario "Halfway through the cross-fade")', () => {
    expect(crossFade(0.5)).toEqual({ drawing: 1, layers: 1 });
    for (let opacity = 0; opacity <= 1; opacity += 0.05) {
      const { drawing, layers } = crossFade(opacity);
      // Where both pictures are the same, the one on top covers what the other leaves open.
      expect(Math.max(drawing, layers)).toBe(1);
    }
  });
});

describe('eyeShift', () => {
  const eyes: [number, number] = [200, 100];
  const shift: [number, number] = [6, 4];

  it('shifts to the right end of the limit for a point far to the right (spec: "Pointer far to the right")', () => {
    expect(eyeShift([2000, 100], eyes, shift, 500)).toEqual([6, 0]);
  });

  it('looks up without shifting sideways for a point straight above (spec: "Pointer straight above the head")', () => {
    expect(eyeShift([200, -2000], eyes, shift, 500)).toEqual([0, -4]);
  });

  it('shifts down and to the left for a point below and to the left (spec: "Pointer below and to the left")', () => {
    const [x, y] = eyeShift([100, 150], eyes, shift, 500);
    expect(x).toBeCloseTo(-1.2, 9);
    expect(y).toBeCloseTo(0.4, 9);
  });

  it('stays at rest for a point on the eyes, and never goes past the limit', () => {
    expect(eyeShift(eyes, eyes, shift, 500)).toEqual([0, 0]);
    const [x, y] = eyeShift([-5000, 5000], eyes, shift, 500);
    expect([x, y]).toEqual([-6, 4]);
  });
});

describe('blending plant', () => {
  it('blends a plant like a rotation, and adds none where neither pose plants', () => {
    const planted: Pose = { ...REST, name: 'crouch', layers: { footLeft: { plant: 1 } } };
    expect(blendPoses(REST, planted, 0.25).layers['footLeft']?.plant).toBeCloseTo(0.25, 12);
    expect(blendPoses(REST, NOD, 0.5).layers['head']).not.toHaveProperty('plant');
  });
});

describe('followAngles', () => {
  it('turns the head part of its range and the body part of the head’s angle (spec: "Pointer far to the right")', () => {
    const { head, body } = followAngles([5000, 100], [200, 100], [-25, 25], 500);
    expect(head).toBeCloseTo(25 * HEAD_SHARE, 9);
    expect(body).toBeCloseTo(head * BODY_SHARE, 9);
    expect(body).toBeGreaterThan(0);
  });

  it('turns neither for a point straight above the head', () => {
    expect(followAngles([200, -500], [200, 100], [-25, 25], 500)).toEqual({ head: 0, body: 0 });
  });
});

describe('smooth animations (design §15)', () => {
  // The head goes 0° → 10° → 30° → 30°: through 10° on the way up, a hold at 30°.
  const UP: Pose = { ...REST, name: 'up', layers: { head: { rotate: 10 } } };
  const TOP: Pose = { ...REST, name: 'top', layers: { head: { rotate: 30 } } };
  const SMOOTH_POSES = new Map([
    ['rest', REST],
    ['up', UP],
    ['top', TOP],
  ]);
  const RISING: Animation = {
    ...NODDING,
    name: 'rising',
    smooth: true,
    keyframes: [
      { at: 0, pose: 'rest' },
      { at: 1, pose: 'up' },
      { at: 2, pose: 'top' },
      { at: 3, pose: 'top' },
    ],
  };
  const head = (time: number) =>
    samplePose(RISING, SMOOTH_POSES, time, linear).layers['head']?.rotate ?? 0;

  it('is exactly each keyframe’s pose at its own moment', () => {
    expect(head(0)).toBe(0);
    expect(head(1)).toBeCloseTo(10, 9);
    expect(head(2)).toBeCloseTo(30, 9);
  });

  it('keeps moving through a keyframe it passes through, instead of stopping there', () => {
    // Just before and just after 1 s the head is clearly moving, at about the same speed.
    const before = (head(1) - head(0.99)) / 0.01;
    const after = (head(1.01) - head(1)) / 0.01;
    expect(before).toBeGreaterThan(5);
    expect(after).toBeCloseTo(before, 0);
  });

  it('slows to a stop where it turns around or holds, and never swings past it', () => {
    expect(smoothSlope([0, 1, 2, 3], [0, 10, 30, 30], 2)).toBe(0);
    for (let time = 2; time <= 3; time += 0.1) expect(head(time)).toBeLessThanOrEqual(30 + 1e-9);
  });

  it('hermite runs from one value to the next with the given slopes', () => {
    expect(hermite(0, 0, 0, 1, 10, 0, 0.5)).toBeCloseTo(5, 9);
    expect(hermite(0, 0, 0, 1, 10, 0, 1)).toBeCloseTo(10, 9);
  });
});
