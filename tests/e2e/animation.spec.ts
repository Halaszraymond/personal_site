/**
 * End-to-end tests for Kálmán's animations in the preview (specs: kalman-animation, and the
 * kalman-preview requirements for the play buttons, idle loop, scrubbing, head-follow and the
 * front/side switch).
 *
 * The figure says what it is doing: `data-animation` (the playing or held animation) and
 * `data-time` (seconds into it). Tests read those, and hold moments still with the scrub
 * slider, instead of guessing from pixels or waiting for time to pass.
 */
import type { Page } from '@playwright/test';
import animations from '../../src/scene/kalman/animations.json' with { type: 'json' };
import poses from '../../src/scene/kalman/poses.json' with { type: 'json' };
import { expect, test } from './fixtures';

const figure = (page: Page) => page.locator('[data-kalman-figure]');
const frontHead = (page: Page) =>
  page.locator('[data-layers][data-figure="front"] [data-layer="head"]');
const scrub = (page: Page) => page.getByLabel('Position in the animation');

const timeNow = async (page: Page) => Number(await figure(page).getAttribute('data-time'));

/** The figure's time in seconds, read twice with a pause in between. */
async function timeAdvances(page: Page, waitMs = 400): Promise<boolean> {
  const before = await timeNow(page);
  await page.waitForTimeout(waitMs);
  return (await timeNow(page)) !== before;
}

/**
 * Waits until the figure's time moves on. Polling, not one fixed pause: on a busy CI machine
 * WebKit can skip frames for a while, so a single 400 ms look can see the time unchanged
 * although the animation plays (like `while` with a timeout in Python, not one `sleep`).
 */
async function expectTimeToAdvance(page: Page): Promise<void> {
  const before = await timeNow(page);
  await expect.poll(() => timeNow(page)).not.toBe(before);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/playground/');
});

test('there is one play button per animation', async ({ page }) => {
  for (const name of ['idle', 'bow', 'head-follow', 'dive', 'swim', 'launch']) {
    await expect(page.locator(`[data-animation-button="${name}"]`)).toHaveCount(1);
  }
});

test('the idle loop plays by default', async ({ page }) => {
  await expect(page.getByRole('switch', { name: /Idle when nothing else plays/ })).toBeChecked();
  await expect(figure(page)).toHaveAttribute('data-animation', 'idle');
  await expectTimeToAdvance(page);
});

test('playing the bow marks it, and he ends at rest', async ({ page }) => {
  await page.getByRole('switch', { name: /Idle when nothing else plays/ }).uncheck();
  const restHead = await frontHead(page).getAttribute('transform');
  const button = page.getByRole('button', { name: 'Play bow' });
  await button.click();

  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(figure(page)).toHaveAttribute('data-animation', 'bow');
  await expect(figure(page)).toHaveAttribute('aria-label', /animation: Bow/);
  // The bow lasts 1.8 s; afterwards nothing plays and the head is back at rest.
  await expect(figure(page)).not.toHaveAttribute('data-animation', /./, { timeout: 5000 });
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  expect(await frontHead(page).getAttribute('transform')).toBe(restHead);
});

test('starting swim stops the idle loop and shows the side figure', async ({ page }) => {
  await expect(figure(page)).toHaveAttribute('data-animation', 'idle');
  await page.getByRole('button', { name: 'Play swim' }).click();

  await expect(figure(page)).toHaveAttribute('data-animation', 'swim');
  await expect(figure(page)).toHaveAttribute('data-figure', 'side');
  await expect(page.getByRole('button', { name: 'Play idle' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('the scrub slider holds a moment still and draws it', async ({ page }) => {
  await page.getByRole('button', { name: 'Play dive' }).click();
  await scrub(page).fill('1.2');

  await expect(figure(page)).toHaveAttribute('data-animation', 'dive');
  await expect(figure(page)).toHaveAttribute('data-time', '1.20');
  await expect(page.locator('[data-scrub-value]')).toHaveText('1.20 s');
  // Held: time doesn't move on.
  expect(await timeAdvances(page)).toBe(false);
  // And the side figure is drawn at that moment: its body is turned (diving).
  const body = page.locator('[data-layers][data-figure="side"] [data-layer="body"]');
  await expect(body).not.toHaveAttribute('transform', /^matrix\(1 0 0 1 /);
});

test('lagging layers settle: the dive only ends once its tail is at rest', async ({ page }) => {
  await page.getByRole('switch', { name: /Idle when nothing else plays/ }).uncheck();
  const tail = page.locator('[data-layers][data-figure="side"] [data-layer="tail"]');
  const restTail = await tail.getAttribute('transform');
  const lastKeyframe = animations.find((a) => a.name === 'dive')?.keyframes.at(-1)?.at ?? 0;
  await page.getByRole('button', { name: 'Play dive' }).click();

  // The slider runs to the play length: past the last keyframe, by the tail's lag.
  const end = Number(await scrub(page).getAttribute('max'));
  expect(end).toBeGreaterThan(lastKeyframe);
  // At the last keyframe the body is at rest, but the tail is still catching up...
  await scrub(page).fill(String(lastKeyframe));
  await expect(figure(page)).toHaveAttribute('data-time', lastKeyframe.toFixed(2));
  expect(await tail.getAttribute('transform')).not.toBe(restTail);
  // ...and only at the end of the play length is it at rest too.
  await scrub(page).fill(String(end));
  await expect(figure(page)).toHaveAttribute('data-time', end.toFixed(2));
  expect(await tail.getAttribute('transform')).toBe(restTail);
});

test('head-follow turns the head towards the pointer', async ({ page }) => {
  const restHead = await frontHead(page).getAttribute('transform');
  await page.getByRole('button', { name: 'Play head-follow' }).click();
  await expect(figure(page)).toHaveAttribute('data-animation', 'head-follow');

  // On a phone the play button is below the figure, so clicking it scrolled the page down.
  await figure(page).scrollIntoViewIfNeeded();
  const box = await figure(page).boundingBox();
  if (box === null) throw new Error('The figure has no box.');
  await page.mouse.move(box.x + box.width - 5, box.y + box.height * 0.2, { steps: 5 });

  await expect(frontHead(page)).not.toHaveAttribute('transform', restHead ?? '', { timeout: 2000 });
});

test('the front/side switch shows the side figure with its own poses and sliders', async ({
  page,
}) => {
  await page.getByLabel('Side', { exact: true }).check();

  await expect(figure(page)).toHaveAttribute('data-figure', 'side');
  await expect(page.getByRole('button', { name: 'Stroke up' })).toBeVisible();
  await expect(page.getByLabel('Side: flipper')).toBeVisible();
  await expect(page.getByLabel('Left flipper')).toBeHidden();

  // A side pose from its button, and its JSON says it is a side pose.
  await page.getByRole('button', { name: 'Stroke up' }).click();
  const strokeUp = poses.find((p) => p.figure === 'side' && p.name === 'strokeUp');
  const flipper = (strokeUp?.layers as Record<string, { rotate?: number }> | undefined)?.[
    'flipper'
  ];
  await expect(page.getByLabel('Side: flipper')).toHaveValue(String(flipper?.rotate ?? 0));
  expect(JSON.parse(await page.getByLabel(/Pose JSON/).inputValue())).toMatchObject({
    name: 'strokeUp',
    figure: 'side',
  });
});

test('a hidden tab stops the animation until it is visible again', async ({ page }) => {
  await page.getByRole('button', { name: 'Play swim' }).click();
  // Pretend the tab is hidden: what the browser reports when another tab is in front.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await timeAdvances(page)).toBe(false);

  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expectTimeToAdvance(page);
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('nothing plays until a play button is pressed', async ({ page }) => {
    await page.goto('/playground/');
    await expect(
      page.getByRole('switch', { name: /Idle when nothing else plays/ }),
    ).not.toBeChecked();
    await expect(figure(page)).not.toHaveAttribute('data-animation', /./);

    await page.getByRole('button', { name: 'Play bow' }).click();
    await expect(figure(page)).toHaveAttribute('data-animation', 'bow');
  });
});
