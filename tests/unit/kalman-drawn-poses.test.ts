/**
 * Unit tests for checking drawn poses (src/lib/kalman-drawn-poses.ts; spec: kalman-rig,
 * "Drawn poses come from the design images").
 */
import { describe, expect, it } from 'vitest';
import { drawnPoseErrors } from '../../src/lib/kalman-drawn-poses';

const placed = { image: 'drawn/bow.png', size: [600, 1100], position: [460, 270] };
const bow = { name: 'bow', figure: 'front', images: { goofy: placed, professional: placed } };

describe('drawnPoseErrors', () => {
  it('accepts a drawn pose with a figure and a placed image per mood', () => {
    expect(drawnPoseErrors({ poses: [bow] })).toEqual([]);
  });

  it('needs a list of poses', () => {
    expect(drawnPoseErrors({})).toEqual(['The drawn poses need a list of "poses".']);
    expect(drawnPoseErrors(null)).toEqual(['The drawn poses need a list of "poses".']);
  });

  it('rejects a name listed twice, a missing name, an unknown figure and a missing mood', () => {
    const nameless = { figure: 'front', images: { goofy: placed } };
    const nod = { name: 'nod', figure: 'top', images: { goofy: { image: 'x.png' } } };
    expect(drawnPoseErrors({ poses: [bow, bow, nameless, nod] })).toEqual([
      'Drawn pose "bow" is listed twice.',
      'Drawn pose 3 needs a "name".',
      'Drawn pose 3 needs a "professional" image with "image", "size" and "position".',
      'Drawn pose "nod" needs "figure" as "front" or "side".',
      'Drawn pose "nod" needs a "goofy" image with "image", "size" and "position".',
      'Drawn pose "nod" needs a "professional" image with "image", "size" and "position".',
    ]);
  });
});
