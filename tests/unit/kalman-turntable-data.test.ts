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

  it('has the four views of the design sheet, front at 0°', () => {
    expect(turntable.views.map((view) => [view.name, view.angle])).toEqual([
      ['front', 0],
      ['side-right', 90],
      ['back', 180],
      ['side-left', 270],
    ]);
  });

  it('points to images that exist', () => {
    for (const view of turntable.views) {
      for (const placed of Object.values(view.images)) {
        expect(existsSync(join('src/assets/kalman', placed.image)), placed.image).toBe(true);
      }
    }
  });
});
