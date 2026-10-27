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
import animations from '../../src/scene/kalman/animations.json' with { type: 'json' };
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

/** The moment of `animation`'s keyframe with `pose` (the n-th one), from animations.json. */
function keyframe(animation: string, pose: string, nth = 0): number {
  const frames = animations.find((a) => a.name === animation)?.keyframes ?? [];
  const at = frames.filter((k) => k.pose === pose)[nth]?.at;
  if (at === undefined) throw new Error(`${animation} has no keyframe ${nth} with ${pose}`);
  return at;
}

/** Halfway through the cross-fade into the bow's drawn pose: its fade before the deepest moment. */
const bowFade = animations.find((a) => a.name === 'bow')?.fade ?? 0.2;

/**
 * Key moments of the animations (README §5.4, visual layer 4), held still with the scrub slider
 * so the screenshot is the same every run: the animation and the moment in seconds. The moments
 * come from the keyframes, so they stay right while Raymond tunes the timing.
 */
const MOMENTS = [
  { name: 'kalman-bow-cross-fade', animation: 'bow', at: keyframe('bow', 'bow') - bowFade / 2 },
  { name: 'kalman-bow-drawn', animation: 'bow', at: keyframe('bow', 'bow') + 0.2 },
  { name: 'kalman-dive-crouch', animation: 'dive', at: keyframe('dive', 'crouch') },
  { name: 'kalman-dive-entry', animation: 'dive', at: keyframe('dive', 'dive') },
  { name: 'kalman-swim-down-stroke', animation: 'swim', at: keyframe('swim', 'strokeDown', 1) },
  { name: 'kalman-launch-rise', animation: 'launch', at: keyframe('launch', 'launchRise') },
  { name: 'kalman-launch-landing', animation: 'launch', at: keyframe('launch', 'landing') },
  { name: 'kalman-launch-wobble', animation: 'launch', at: keyframe('launch', 'landingWobble') },
].map((moment) => ({ ...moment, at: moment.at.toFixed(2) }));

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
