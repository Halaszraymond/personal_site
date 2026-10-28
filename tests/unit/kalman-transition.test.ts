/**
 * Unit tests for transitions between animations (src/lib/kalman-animation.ts; kalman-flow).
 * Scenario names in quotes are from the kalman-animation spec.
 */
import { describe, expect, it } from 'vitest';
import { figureFade, transitionPose, TRANSITION } from '../../src/lib/kalman-animation';
import type { Pose } from '../../src/lib/kalman-rig';

const linear = (progress: number) => progress;
const FROM: Pose = {
  name: 'from',
  label: 'From',
  figure: 'side',
  layers: { body: { rotate: -90, offset: [20, -78], stretch: 1.12 }, head: { rotate: 60 } },
};
const TARGET: Pose = {
  name: 'target',
  label: 'Target',
  figure: 'side',
  layers: { body: { rotate: 0 }, head: { rotate: 10 } },
};

describe('transitionPose', () => {
  it('"Same figure": halfway, every layer is between its old and its new value', () => {
    const pose = transitionPose(FROM, TARGET, TRANSITION / 2, TRANSITION, linear);
    expect(pose.layers['body']?.rotate).toBeCloseTo(-45);
    expect(pose.layers['body']?.offset).toEqual([10, -39]);
    expect(pose.layers['body']?.stretch).toBeCloseTo(1.06);
    expect(pose.layers['head']?.rotate).toBeCloseTo(35);
  });

  it('starts exactly where the figure was', () => {
    const pose = transitionPose(FROM, TARGET, 0, TRANSITION, linear);
    expect(pose.layers['body']?.rotate).toBe(-90);
    expect(pose.layers['head']?.rotate).toBe(60);
  });

  it('ends exactly in the new animation, and stays there', () => {
    expect(transitionPose(FROM, TARGET, TRANSITION, TRANSITION, linear)).toBe(TARGET);
    expect(transitionPose(FROM, TARGET, 5, TRANSITION, linear)).toBe(TARGET);
  });

  it('carries the new animation’s name, so the figure says what plays', () => {
    expect(transitionPose(FROM, TARGET, 0.1, TRANSITION, linear).name).toBe('target');
  });

  it('follows the easing', () => {
    const easeIn = (progress: number) => progress * progress;
    const pose = transitionPose(FROM, TARGET, TRANSITION / 2, TRANSITION, easeIn);
    expect(pose.layers['body']?.rotate).toBeCloseTo(-90 + 90 * 0.25);
  });
});

describe('figureFade', () => {
  it('"Another figure": one figure is always fully opaque, so he is never see-through', () => {
    for (let step = 0; step <= 100; step += 1) {
      const { incoming, outgoing } = figureFade(step / 100);
      expect(Math.max(incoming, outgoing)).toBe(1);
    }
  });

  it('shows only the old figure at the start and only the new one at the end', () => {
    expect(figureFade(0)).toEqual({ incoming: 0, outgoing: 1 });
    expect(figureFade(1)).toEqual({ incoming: 1, outgoing: 0 });
  });

  it('fades the new one in first, then the old one out', () => {
    expect(figureFade(0.25)).toEqual({ incoming: 0.5, outgoing: 1 });
    expect(figureFade(0.75)).toEqual({ incoming: 1, outgoing: 0.5 });
  });

  it('clamps outside 0–1', () => {
    expect(figureFade(-1)).toEqual({ incoming: 0, outgoing: 1 });
    expect(figureFade(2)).toEqual({ incoming: 1, outgoing: 0 });
  });
});
