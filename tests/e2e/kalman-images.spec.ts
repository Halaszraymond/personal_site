/**
 * End-to-end checks of Kálmán's built images (spec: kalman-rig, "The figure loads only what it
 * shows"): every image is WebP and no wider than twice its width on a 480 px stage.
 *
 * Runs on the preview, which draws every image there is (all figures, the turntable views and
 * the drawn poses), so one page covers them all.
 */
import { PIXEL_DENSITY, STAGE_WIDTH_PX } from '../../src/lib/kalman-images';
import rig from '../../src/scene/kalman/rig.json' with { type: 'json' };
import { expect, test } from './fixtures';

test('every figure image is WebP at most twice its width on the stage', async ({ page }) => {
  await page.goto('/playground/');
  const images = await page.locator('[data-kalman-figure] image').evaluateAll((elements) =>
    elements.map((image) => ({
      href: image.getAttribute('href') ?? image.getAttribute('data-href') ?? '',
      width: Number(image.getAttribute('width')),
    })),
  );
  expect(images.length).toBeGreaterThan(0);

  const [artboardWidth = 0] = rig.front.artboard;
  for (const { href, width } of images) {
    expect(href).toMatch(/\.webp$/);
    // The image's own pixel width, read by loading it in the page.
    const natural = await page.evaluate(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return image.naturalWidth;
    }, href);
    const allowed = Math.ceil((width / artboardWidth) * STAGE_WIDTH_PX * PIXEL_DENSITY);
    expect(natural, href).toBeLessThanOrEqual(allowed);
  }
});
