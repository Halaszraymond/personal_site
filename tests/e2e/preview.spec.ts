/**
 * End-to-end tests for the Kálmán preview's behaviour (specs: kalman-preview, and the
 * kalman-rig requirements that need a browser: the figure without JavaScript, accessories
 * per mood). The page basics (noindex, English, no switcher) are in preview-page.spec.ts,
 * axe and console errors in quality.spec.ts.
 *
 * The tests read what the figure draws from its SVG attributes (`transform`, `visibility`,
 * `data-pose`), not from pixels, so they work the same in every browser.
 */
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { validatePose, validateRig, type Rig } from '../../src/lib/kalman-rig';
import { expect, test } from './fixtures';

const figure = (page: Page) => page.locator('[data-kalman-figure]');
const layer = (page: Page, name: string) => page.locator(`[data-layer="${name}"]`);
const transformOf = (page: Page, name: string) => layer(page, name).getAttribute('transform');

/** Collects JavaScript errors and console errors. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

/** The repo rig, typed, for the slider limits and to validate copied poses. */
function repoRig(): Rig {
  // Read as text and parsed, because Playwright runs tests as plain Node modules, which can't
  // `import` a JSON file without an extra import attribute.
  const data: unknown = JSON.parse(readFileSync('src/scene/kalman/rig.json', 'utf8'));
  const result = validateRig(data, () => true);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return result.value;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/playground/');
});

test('a pose button changes the pose without a reload and is marked as pressed', async ({
  page,
}) => {
  const restHead = await transformOf(page, 'head');
  // A reload would clear this marker from the window object.
  await page.evaluate(() => Object.assign(window, { noReload: true }));

  await page.getByRole('button', { name: 'Head tilt left' }).click();

  await expect(figure(page)).toHaveAttribute('data-pose', 'headTiltLeft');
  expect(await transformOf(page, 'head')).not.toBe(restHead);
  await expect(page.getByRole('button', { name: 'Head tilt left' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Rest' })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => 'noReload' in window)).toBe(true);
});

test('the figure’s description names the pose and the mood', async ({ page }) => {
  await expect(figure(page)).toHaveAttribute('aria-label', 'Kálmán, pose: Rest, mood: goofy');
  await page.getByRole('button', { name: 'Bow' }).click();
  await page.getByRole('switch', { name: /Professional/ }).check();
  await expect(figure(page)).toHaveAttribute('aria-label', 'Kálmán, pose: Bow, mood: professional');
});

test('the sliders follow a named pose', async ({ page }) => {
  await page.getByRole('button', { name: 'Flippers up' }).click();
  await expect(page.getByLabel('Left flipper', { exact: true })).toHaveValue('120');
  await expect(page.getByLabel('Right flipper', { exact: true })).toHaveValue('-120');
  await expect(page.getByLabel('Head', { exact: true })).toHaveValue('0');
});

test('every slider’s limits are its layer’s rotation range', async ({ page }) => {
  for (const { name, rotate } of repoRig().layers) {
    const slider = page.locator(`[data-rotation="${name}"]`);
    await expect(slider).toHaveAttribute('min', String(rotate[0]));
    await expect(slider).toHaveAttribute('max', String(rotate[1]));
  }
  await expect(page.locator('[data-rotation]')).toHaveCount(repoRig().layers.length);
});

test('a slider rotates its layer with the keyboard, one step per key press', async ({ page }) => {
  const restHead = await transformOf(page, 'head');
  const head = page.getByLabel('Head', { exact: true });
  await head.focus();
  await page.keyboard.press('ArrowRight');

  await expect(head).toHaveValue('1');
  await expect(page.locator('[data-rotation-value="head"]')).toHaveText('1°');
  expect(await transformOf(page, 'head')).not.toBe(restHead);
  // The pose is no longer a named one, so no pose button is pressed.
  await expect(figure(page)).toHaveAttribute('data-pose', 'custom');
  await expect(page.locator('[data-pose-button][aria-pressed="true"]')).toHaveCount(0);
});

test('the professional switch shows the tie and glasses without changing the pose', async ({
  page,
}) => {
  await expect(layer(page, 'tie')).toHaveAttribute('visibility', 'hidden');
  await expect(layer(page, 'glasses')).toHaveAttribute('visibility', 'hidden');
  const head = await transformOf(page, 'head');

  await page.getByRole('switch', { name: /Professional/ }).check();

  await expect(layer(page, 'tie')).toHaveAttribute('visibility', 'visible');
  await expect(layer(page, 'glasses')).toHaveAttribute('visibility', 'visible');
  expect(await transformOf(page, 'head')).toBe(head);
});

test('the glasses follow the head', async ({ page }) => {
  await page.getByRole('switch', { name: /Professional/ }).check();
  const glasses = await transformOf(page, 'glasses');
  await page.getByRole('button', { name: 'Head tilt right' }).click();
  expect(await transformOf(page, 'glasses')).not.toBe(glasses);
});

test('show pivots marks every pivot, and the markers move with their layers', async ({ page }) => {
  const markers = page.locator('[data-pivots]');
  await expect(markers).toBeHidden();

  await page.getByRole('switch', { name: 'Show pivots' }).check();
  await expect(markers).toBeVisible();
  await expect(page.locator('[data-pivot]')).toHaveCount(repoRig().layers.length);

  // The head's pivot is its neck: tilting the body moves it.
  const neck = page.locator('[data-pivot="head"]');
  const before = await neck.getAttribute('cx');
  await page.getByLabel('Body', { exact: true }).fill('10');
  expect(await neck.getAttribute('cx')).not.toBe(before);
});

test('the pose JSON is always visible as text and valid', async ({ page }) => {
  await page.getByRole('button', { name: 'Bow' }).click();
  await page.getByLabel('Tail', { exact: true }).fill('12');
  const json = await page.getByLabel(/Pose JSON/).inputValue();
  const result = validatePose(JSON.parse(json), repoRig());
  expect(result.ok ? [] : result.errors).toEqual([]);
  expect(JSON.parse(json)).toMatchObject({ name: 'custom', layers: { tail: { rotate: 12 } } });
});

test('Copy pose puts valid pose JSON on the clipboard', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Only Chromium lets tests read the clipboard.');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Flippers up' }).click();

  await page.getByRole('button', { name: 'Copy pose' }).click();

  await expect(page.locator('[data-copy-status]')).toHaveText('Copied the pose to the clipboard.');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const result = validatePose(JSON.parse(copied), repoRig());
  expect(result.ok ? [] : result.errors).toEqual([]);
  expect(JSON.parse(copied)).toMatchObject({ name: 'flippersUp' });
});

test.describe('when the clipboard is refused', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) },
      });
    });
    await page.goto('/playground/');
  });

  test('says so, keeps the JSON selectable and logs no error', async ({ page }) => {
    const errors = collectErrors(page);
    await page.getByRole('button', { name: 'Copy pose' }).click();

    await expect(page.locator('[data-copy-status]')).toHaveText(
      'The clipboard is not available here: select and copy the text below.',
    );
    await expect(page.getByLabel(/Pose JSON/)).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('Kálmán is visible in the rest pose', async ({ page }) => {
    await page.goto('/playground/');
    await expect(figure(page)).toBeVisible();
    await expect(figure(page)).toHaveAttribute('data-pose', 'rest');
    await expect(layer(page, 'body')).toHaveAttribute('transform', /^matrix\(1 0 0 1 /);
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('everything fits at 360 px without horizontal scrolling', async ({ page }) => {
    await page.goto('/playground/');
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(360);
    // The last control can be scrolled to and is fully on screen, so nothing sticks out sideways.
    const copy = page.getByRole('button', { name: 'Copy pose' });
    await copy.scrollIntoViewIfNeeded();
    await expect(copy).toBeInViewport({ ratio: 1 });
  });
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('poses change the same way', async ({ page }) => {
    await page.goto('/playground/');
    await page.getByRole('button', { name: 'Bow' }).click();
    await expect(figure(page)).toHaveAttribute('data-pose', 'bow');
  });
});

test('the spin slider turns the whole figure without changing the pose', async ({ page }) => {
  const spin = page.locator('[data-spin]');
  const restSpin = await spin.getAttribute('transform');
  const json = await page.getByLabel(/Pose JSON/).inputValue();
  const head = await transformOf(page, 'head');

  const slider = page.getByLabel('Spin whole figure');
  await slider.focus();
  await page.keyboard.press('ArrowRight');

  await expect(slider).toHaveValue('1');
  await expect(page.locator('[data-spin-value]')).toHaveText('1°');
  expect(await spin.getAttribute('transform')).not.toBe(restSpin);
  // The pose itself is unchanged: same layer transforms and the same pose JSON.
  expect(await transformOf(page, 'head')).toBe(head);
  await expect(page.getByLabel(/Pose JSON/)).toHaveValue(json);
});
