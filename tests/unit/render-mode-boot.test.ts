/**
 * The early render-mode script (public/render-mode.js) must decide exactly like
 * chooseRenderMode() (src/lib/render-mode.ts). It is plain JavaScript served as-is, so this runs
 * the real file in a sandbox with a fake browser for every combination of the signals.
 */
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { chooseRenderMode } from '../../src/lib/render-mode';

const SCRIPT = readFileSync('public/render-mode.js', 'utf8');

/** Runs the script with these signals and returns the mode it writes on <html>. */
function runBootScript(prefersReducedMotion: boolean, connection: unknown): string | undefined {
  const dataset: Record<string, string> = {};
  // `runInNewContext` is like Python's `exec(code, globals)`: the script sees only these names.
  runInNewContext(SCRIPT, {
    window: { matchMedia: () => ({ matches: prefersReducedMotion }) },
    navigator: { connection },
    document: { documentElement: { dataset } },
    Boolean,
  });
  return dataset['renderMode'];
}

describe('public/render-mode.js', () => {
  for (const prefersReducedMotion of [false, true]) {
    for (const saveData of [false, true]) {
      it(`agrees with chooseRenderMode (reduced motion ${prefersReducedMotion}, Save-Data ${saveData})`, () => {
        expect(runBootScript(prefersReducedMotion, { saveData })).toBe(
          chooseRenderMode({ prefersReducedMotion, saveData }),
        );
      });
    }
  }

  it('treats a browser without navigator.connection as not saving data', () => {
    expect(runBootScript(false, undefined)).toBe('full');
  });
});
