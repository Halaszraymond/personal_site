/**
 * Visual regression, layer 2 (README §5.4): screenshots of the HTML, compared with stored
 * baselines. An unintended visual change fails the test.
 *
 * Linux only: fonts render slightly differently on Windows and macOS, which would make
 * every comparison fail. So these tests only run when `CI` is set, and the baselines are
 * made by the manual GitHub workflow `update-visual-baselines.yml`. Locally they show as skipped.
 *
 * Pages are shown in fallback mode (reduced motion) and the scene slot is masked, so
 * future 3D frames never end up in these screenshots; 3D snapshots are a separate layer.
 */
import { expect, test } from './fixtures';

const isCI = process.env['CI'] !== undefined;

const PAGES = [
  { name: 'root', path: '/' },
  { name: 'nl', path: '/nl/' },
  { name: 'hu', path: '/hu/' },
  { name: 'en', path: '/en/' },
];
/** A small phone and a laptop. */
const WIDTHS = [375, 1280];

test.use({ reducedMotion: 'reduce', locale: 'en-US' });

for (const { name, path } of PAGES) {
  for (const width of WIDTHS) {
    test(`${name} at ${width}px looks the same as the baseline`, async ({ page }) => {
      test.skip(!isCI, 'Visual baselines are Linux-only: these run in CI.');
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);

      await expect(page).toHaveScreenshot(`${name}-${width}.png`, {
        fullPage: true,
        mask: [page.locator('[data-scene-slot]')],
      });
    });
  }
}

/**
 * 3D snapshot, layer 4 (README §5.4): the default Kálmán in the playground, from the starting
 * view, with the swim preview paused (it always starts paused). SwiftShader renders the same
 * way on every Linux run; the small tolerance absorbs anti-aliasing differences at the edges.
 */
test('the default Kálmán looks the same as the 3D baseline', async ({ page }) => {
  test.skip(!isCI, 'Visual baselines are Linux-only: these run in CI.');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/playground/');
  const canvas = page.locator('[data-view] canvas');
  await expect
    .poll(async () => Number((await canvas.getAttribute('data-frames')) ?? 0))
    .toBeGreaterThan(0);

  await expect(page.locator('[data-view]')).toHaveScreenshot('kalman-default.png', {
    maxDiffPixelRatio: 0.01,
  });
});
