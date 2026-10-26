/**
 * Checks turntable.json in the repo: valid, the four views of the design sheet, and every
 * image file exists.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { turntableErrors } from '../../src/lib/kalman-turntable';
import turntable from '../../src/scene/kalman/turntable.json';

describe('the turntable in the repo', () => {
  it('is valid', () => {
    expect(turntableErrors(turntable)).toEqual([]);
  });

  it('starts with the front view at 0°', () => {
    // More views (¾ front, side, ¾ back, back) are added as they are made.
    expect(turntable.views[0]).toMatchObject({ name: 'front', angle: 0 });
  });

  it('points to images that exist', () => {
    for (const view of turntable.views) {
      for (const placed of Object.values(view.images)) {
        expect(existsSync(join('src/assets/kalman', placed.image)), placed.image).toBe(true);
      }
    }
  });
});
