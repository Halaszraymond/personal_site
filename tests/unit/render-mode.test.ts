/**
 * Unit tests for chooseRenderMode (spec: render-fallback).
 * Every combination of the three signals is checked: only "all checks pass" gives full mode.
 */
import { describe, expect, it } from 'vitest';
import { chooseRenderMode, type RenderSignals } from '../../src/lib/render-mode';

const CAPABLE: RenderSignals = {
  prefersReducedMotion: false,
  hasWebGL2: true,
  saveData: false,
};

describe('chooseRenderMode', () => {
  it('chooses full mode when every check passes', () => {
    expect(chooseRenderMode(CAPABLE)).toBe('full');
  });

  it('falls back when reduced motion is requested', () => {
    expect(chooseRenderMode({ ...CAPABLE, prefersReducedMotion: true })).toBe('fallback');
  });

  it('falls back without WebGL2', () => {
    expect(chooseRenderMode({ ...CAPABLE, hasWebGL2: false })).toBe('fallback');
  });

  it('falls back when Save-Data is on', () => {
    expect(chooseRenderMode({ ...CAPABLE, saveData: true })).toBe('fallback');
  });

  // All 8 combinations of three yes/no signals: like itertools.product([False, True], repeat=3).
  const flags = [false, true];
  for (const prefersReducedMotion of flags) {
    for (const hasWebGL2 of flags) {
      for (const saveData of flags) {
        const signals = { prefersReducedMotion, hasWebGL2, saveData };
        const expected = !prefersReducedMotion && hasWebGL2 && !saveData ? 'full' : 'fallback';

        it(`gives ${expected} for ${JSON.stringify(signals)}`, () => {
          expect(chooseRenderMode(signals)).toBe(expected);
        });
      }
    }
  }
});
