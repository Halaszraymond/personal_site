/**
 * Visual regression, layer 2 (README §5.4): screenshots of the HTML, compared with stored
 * baselines. An unintended visual change fails the test.
 *
 * Linux only: fonts render slightly differently on Windows and macOS, which would make
 * every comparison fail. So these tests only run when `CI` is set, and the baselines are
 * made by the manual GitHub workflow `update-visual-baselines.yml`. Locally they show as skipped.
 *
 * Pages are shown in fallback mode (reduced motion) and the scene slot is masked, so
 * future animation frames never end up in these screenshots.
 *
 * Layer 4 is here too: snapshots of Kálmán's key poses in the dev-only preview, with a small
 * tolerance. They change on purpose when the real illustrations replace the placeholders;
 * then the baselines are made again with the workflow.
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

/** Kálmán's key poses: the pose button to press and whether he is in his professional mood. */
const POSES = [
  { name: 'kalman-rest-goofy', button: 'Rest', professional: false },
  { name: 'kalman-bow-professional', button: 'Bow', professional: true },
  // The joints (spec: "Joints don't show"): raised flippers must leave no line on the body, and
  // a tilted head no hard edge at the neck.
  { name: 'kalman-flippers-up-goofy', button: 'Flippers up', professional: false },
  { name: 'kalman-head-tilt-professional', button: 'Head tilt right', professional: true },
];

for (const { name, button, professional } of POSES) {
  test(`${name} looks the same as the baseline`, async ({ page }) => {
    test.skip(!isCI, 'Visual baselines are Linux-only: these run in CI.');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/playground/');
    // Idle off, so the figure holds still for the screenshot.
    await page.getByRole('switch', { name: /Idle when nothing else plays/ }).uncheck();
    await page.getByRole('button', { name: button, exact: true }).click();
    if (professional) await page.getByRole('switch', { name: /Professional/ }).check();

    await expect(page.locator('[data-kalman-figure]')).toHaveScreenshot(`${name}.png`, {
      // A small tolerance for anti-aliasing at the layers' edges.
      maxDiffPixelRatio: 0.01,
    });
  });
}

/**
 * Key moments of the animations (README §5.4, visual layer 4), held still with the scrub slider
 * so the screenshot is the same every run: the animation and the moment in seconds.
 */
const MOMENTS = [
  { name: 'kalman-bow-deepest', animation: 'bow', at: '0.9' },
  { name: 'kalman-dive-halfway', animation: 'dive', at: '1.2' },
  { name: 'kalman-swim-stroke-up', animation: 'swim', at: '0.4' },
  // Pointing up, just before he shoots up out of the frame.
  { name: 'kalman-launch-up', animation: 'launch', at: '0.4' },
];

for (const { name, animation, at } of MOMENTS) {
  test(`${name} looks the same as the baseline`, async ({ page }) => {
    test.skip(!isCI, 'Visual baselines are Linux-only: these run in CI.');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/playground/');
    await page.getByRole('switch', { name: /Idle when nothing else plays/ }).uncheck();
    await page.getByRole('button', { name: `Play ${animation}` }).click();
    await page.getByLabel('Position in the animation').fill(at);
    await expect(page.locator('[data-kalman-figure]')).toHaveAttribute(
      'data-time',
      Number(at).toFixed(2),
    );

    await expect(page.locator('[data-kalman-figure]')).toHaveScreenshot(`${name}.png`, {
      maxDiffPixelRatio: 0.01,
    });
  });
}
