/**
 * Unit tests for checking drawn poses (src/lib/kalman-drawn-poses.ts; spec: kalman-rig,
 * "Drawn poses come from the design images").
 */
import { describe, expect, it } from 'vitest';
import { drawnPoseErrors } from '../../src/lib/kalman-drawn-poses';

const placed = { image: 'drawn/bow.png', size: [600, 1100], position: [460, 270] };

describe('drawnPoseErrors', () => {
  it('accepts a drawn pose with a placed image per mood', () => {
    expect(
      drawnPoseErrors({
        poses: [{ name: 'bow', images: { goofy: placed, professional: placed } }],
      }),
    ).toEqual([]);
  });

  it('needs a list of poses', () => {
    expect(drawnPoseErrors({})).toEqual(['The drawn poses need a list of "poses".']);
    expect(drawnPoseErrors(null)).toEqual(['The drawn poses need a list of "poses".']);
  });

  it('rejects a missing mood, a missing name and a name listed twice', () => {
    const bow = { name: 'bow', images: { goofy: placed, professional: placed } };
    expect(
      drawnPoseErrors({
        poses: [
          bow,
          bow,
          { images: { goofy: placed } },
          { name: 'nod', images: { goofy: { image: 'x.png' } } },
        ],
      }),
    ).toEqual([
      'Drawn pose "bow" is listed twice.',
      'Drawn pose 3 needs a "name".',
      'Drawn pose 3 needs a "professional" image with "image", "size" and "position".',
      'Drawn pose "nod" needs a "goofy" image with "image", "size" and "position".',
      'Drawn pose "nod" needs a "professional" image with "image", "size" and "position".',
    ]);
  });
});
