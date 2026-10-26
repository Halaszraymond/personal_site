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

  it('has eight angles: the front, four drawn views and three mirrored ones', () => {
    expect(turntable.views.map((view) => [view.name, view.angle])).toEqual([
      ['front', 0],
      ['3q-front', 45],
      ['side', 90],
      ['3q-back', 135],
      ['back', 180],
      ['3q-back-mirrored', 225],
      ['side-mirrored', 270],
      ['3q-front-mirrored', 315],
    ]);
  });

  it('points to images that exist', () => {
    for (const view of turntable.views) {
      // A mirrored view has no images of its own: it borrows its source's.
      const images = 'images' in view ? Object.values(view.images) : [];
      for (const placed of images) {
        expect(existsSync(join('src/assets/kalman', placed.image)), placed.image).toBe(true);
      }
    }
  });
});
