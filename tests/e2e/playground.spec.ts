/**
 * End-to-end tests for the playground's behaviour (spec: kalman-playground).
 *
 * Tests that need real 3D drawing run in Chromium only, which has software WebGL
 * (SwiftShader) in every environment. The rest runs in all four browsers, with or without
 * WebGL. The canvas reports its own counters (data-frames, data-triangles, data-draw-calls).
 */
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { importConfig, KALMAN_PARAMETERS, type KalmanConfig } from '../../src/lib/kalman-config';
import { PLAYGROUND_EN as TEXT } from '../../src/i18n/playground';
import { expect, test } from './fixtures';

const STORAGE_KEY = 'kalman.playground.v1';

/** The config stored in the repo: what the playground starts with and resets to. */
function repoConfig(): KalmanConfig {
  const result = importConfig(readFileSync('src/scene/kalman/kalman.config.json', 'utf8'));
  if (!result.ok) throw new Error(result.errors.join('; '));
  return result.config;
}

/** Collects JavaScript errors and console errors. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

const canvas = (page: Page) => page.locator('[data-view] canvas');

/** The canvas's frame counter. */
async function frames(page: Page): Promise<number> {
  return Number((await canvas(page).getAttribute('data-frames')) ?? 0);
}

/** Waits until at least one frame has been drawn. */
async function waitForFirstFrame(page: Page): Promise<void> {
  await expect.poll(() => frames(page)).toBeGreaterThan(0);
}

/** Makes WebGL2 unavailable before the page loads. */
async function disableWebGL2(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      return type === 'webgl2' ? null : original.call(this, type, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}

/** Moves a range slider by `presses` steps with the keyboard. */
async function nudge(page: Page, key: string, presses = 1): Promise<void> {
  const slider = page.locator(`#control-${key}`);
  await slider.focus();
  for (let press = 0; press < presses; press++) await page.keyboard.press('ArrowRight');
}

test.describe('3D view (Chromium)', () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Software WebGL is set up for Chromium only.');
  });

  test('draws Kálmán within the triangle and draw-call budget, without errors', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto('/playground/');
    await waitForFirstFrame(page);

    const triangles = Number(await canvas(page).getAttribute('data-triangles'));
    const drawCalls = Number(await canvas(page).getAttribute('data-draw-calls'));
    expect(triangles).toBeGreaterThan(0);
    expect(triangles).toBeLessThanOrEqual(8000);
    expect(drawCalls).toBeLessThanOrEqual(20);
    expect(errors).toEqual([]);
  });

  test('redraws after a slider change, without reloading', async ({ page }) => {
    await page.goto('/playground/');
    await waitForFirstFrame(page);
    await page.evaluate(() => {
      (window as Window & { notReloaded?: boolean }).notReloaded = true;
    });
    const before = await frames(page);

    await nudge(page, 'headSize', 5);

    await expect.poll(() => frames(page)).toBeGreaterThan(before);
    expect(
      await page.evaluate(() => (window as Window & { notReloaded?: boolean }).notReloaded),
    ).toBe(true);
  });

  test('dragging turns Kálmán and Reset view brings back the front view', async ({ page }) => {
    await page.goto('/playground/');
    await waitForFirstFrame(page);
    await page.waitForTimeout(200);
    const front = await canvas(page).screenshot();

    // Drag horizontally across the view, as a mouse or a finger would.
    const box = await canvas(page).boundingBox();
    if (box === null) throw new Error('The canvas has no size');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    expect((await canvas(page).screenshot()).equals(front)).toBe(false);

    await page.getByRole('button', { name: TEXT.resetView }).click();
    await page.waitForTimeout(200);
    expect((await canvas(page).screenshot()).equals(front)).toBe(true);
  });

  test('draws nothing while idle', async ({ page }) => {
    await page.goto('/playground/');
    await waitForFirstFrame(page);
    await page.waitForTimeout(300); // let the first frames settle
    const before = await frames(page);
    await page.waitForTimeout(700);
    expect(await frames(page)).toBe(before);
  });

  test('the swim preview draws while playing and stops when paused', async ({ page }) => {
    await page.goto('/playground/');
    await waitForFirstFrame(page);
    const swim = page.getByRole('button', { name: TEXT.swimPlay });

    await swim.click();
    await expect(page.locator('[data-action="swim"]')).toHaveAttribute('aria-pressed', 'true');
    const start = await frames(page);
    await expect.poll(() => frames(page)).toBeGreaterThan(start + 5);

    await page.getByRole('button', { name: TEXT.swimPause }).click();
    await page.waitForTimeout(200);
    const paused = await frames(page);
    await page.waitForTimeout(500);
    expect(await frames(page)).toBe(paused);
  });

  test('the swim preview stops drawing while the tab is hidden', async ({ page }) => {
    await page.goto('/playground/');
    await waitForFirstFrame(page);
    await page.getByRole('button', { name: TEXT.swimPlay }).click();
    await expect.poll(() => frames(page)).toBeGreaterThan(3);

    // Pretend the tab went to the background, as switching tabs does.
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(200);
    const hidden = await frames(page);
    await page.waitForTimeout(500);
    expect(await frames(page)).toBe(hidden);
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('the swim preview starts paused', async ({ page }) => {
      await page.goto('/playground/');
      await waitForFirstFrame(page);
      await expect(page.locator('[data-action="swim"]')).toHaveAttribute('aria-pressed', 'false');
      await page.waitForTimeout(300);
      const before = await frames(page);
      await page.waitForTimeout(500);
      expect(await frames(page)).toBe(before);
    });
  });

  test('Copy config puts valid JSON with the current values on the clipboard', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/playground/');
    await nudge(page, 'billLength', 3);
    await page.getByRole('button', { name: TEXT.copyConfig }).click();

    await expect(page.locator('[data-status]')).toHaveText(TEXT.copied);
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    const result = importConfig(clipboard);
    expect(result.ok).toBe(true);
    expect(result.ok && result.config.billLength).toBeCloseTo(repoConfig().billLength + 0.03);
  });
});

test.describe('controls (all browsers)', () => {
  test('there is exactly one control per parameter, matching its definition', async ({ page }) => {
    await page.goto('/playground/');
    await expect(page.locator('[data-param]')).toHaveCount(KALMAN_PARAMETERS.length);
    for (const parameter of KALMAN_PARAMETERS) {
      const control = page.locator(`#control-${parameter.key}`);
      await expect(control).toHaveCount(1);
      // Every control has a visible label.
      await expect(page.locator(`label[for="control-${parameter.key}"]`)).toBeVisible();
      if (parameter.kind === 'range') {
        await expect(control).toHaveAttribute('min', String(parameter.min));
        await expect(control).toHaveAttribute('max', String(parameter.max));
        await expect(control).toHaveAttribute('step', String(parameter.step));
      }
    }
  });

  test('the keyboard moves a slider one step per press and updates the shown value', async ({
    page,
  }) => {
    await page.goto('/playground/');
    const start = repoConfig().billLength;
    await nudge(page, 'billLength', 2);
    await expect(page.locator('#control-billLength')).toHaveValue(String(start + 0.02));
    await expect(page.locator('[data-output="billLength"]')).toHaveText((start + 0.02).toFixed(2));
  });

  test('Reset puts every control back to the repo config', async ({ page }) => {
    await page.goto('/playground/');
    await nudge(page, 'headSize', 4);
    await page.locator('#control-tieOn').check();
    await page.getByRole('button', { name: TEXT.reset }).click();

    await expect(page.locator('#control-headSize')).toHaveValue(String(repoConfig().headSize));
    await expect(page.locator('#control-tieOn')).not.toBeChecked();
  });

  test('the JSON is always visible and follows the controls', async ({ page }) => {
    await page.goto('/playground/');
    await page.locator('#control-glassesOn').check();
    const json = await page.locator('[data-config-json]').inputValue();
    const result = importConfig(json);
    expect(result.ok && result.config.glassesOn).toBe(true);
  });

  test('a refused clipboard shows a message and logs no error', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) },
      });
    });
    const errors = collectErrors(page);
    await page.goto('/playground/');
    await page.getByRole('button', { name: TEXT.copyConfig }).click();

    await expect(page.locator('[data-status]')).toHaveText(TEXT.copyRefused);
    expect(errors).toEqual([]);
  });

  test('values survive a reload', async ({ page }) => {
    await page.goto('/playground/');
    await nudge(page, 'headSize', 3);
    const changed = await page.locator('#control-headSize').inputValue();

    await page.reload();
    await expect(page.locator('#control-headSize')).toHaveValue(changed);
  });

  test('outdated stored values fall back to the repo config without errors', async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(key, JSON.stringify({ version: 99, values: {} }));
    }, STORAGE_KEY);
    const errors = collectErrors(page);
    await page.goto('/playground/');

    await expect(page.locator('#control-headSize')).toHaveValue(String(repoConfig().headSize));
    expect(errors).toEqual([]);
  });
});

test.describe('without WebGL2 (all browsers)', () => {
  test('explains the missing WebGL2, keeps the controls working and logs no error', async ({
    page,
  }) => {
    await disableWebGL2(page);
    const errors = collectErrors(page);
    await page.goto('/playground/');

    await expect(page.locator('[data-no-webgl]')).toBeVisible();
    await expect(page.locator('[data-no-webgl]')).toHaveText(TEXT.noWebGL);
    await expect(canvas(page)).toBeHidden();

    await page.locator('#control-tieOn').check();
    const result = importConfig(await page.locator('[data-config-json]').inputValue());
    expect(result.ok && result.config.tieOn).toBe(true);
    expect(errors).toEqual([]);
  });
});
