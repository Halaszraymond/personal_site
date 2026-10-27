/**
 * Unit tests for the built image sizes (src/lib/kalman-images.ts).
 */
import { describe, expect, it } from 'vitest';
import { builtImageWidth, PIXEL_DENSITY, STAGE_WIDTH_PX } from '../../src/lib/kalman-images';

describe('builtImageWidth', () => {
  it('builds an image at twice its width on a 480 px stage', () => {
    // The body is 492.1 of 1600 artboard units wide: 147.6 px on the stage, 296 px built.
    expect(builtImageWidth(492.1, 1600, 370)).toBe(296);
    expect(STAGE_WIDTH_PX * PIXEL_DENSITY).toBe(960);
  });

  it('never enlarges an image beyond its source', () => {
    expect(builtImageWidth(1600, 1600, 500)).toBe(500);
  });

  it('keeps at least one pixel', () => {
    expect(builtImageWidth(0.1, 1600, 10)).toBe(1);
  });
});
