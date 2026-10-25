/**
 * Decides whether a visitor gets the full 3D experience or the static fallback.
 *
 * Pure logic: the browser signals come in as values, so every combination is
 * unit-tested without a browser. The client script in RenderModeSwitch.astro
 * collects the signals and applies the result.
 *
 * The checks follow README §5.2, cheapest first. Step 3 (measuring the frame time
 * of the running scene) joins in Phase 1, when there is a scene to measure.
 */

/** The two ways a page can render. */
export type RenderMode = 'full' | 'fallback';

/** What the browser tells us about the visitor and the device. */
export interface RenderSignals {
  /** The system asks for less motion (`prefers-reduced-motion: reduce`). */
  prefersReducedMotion: boolean;
  /** The browser can create a WebGL2 context, which the 3D scene needs. */
  hasWebGL2: boolean;
  /** The visitor asked to save data. Only Chromium reports it; elsewhere this is `false`. */
  saveData: boolean;
}

/** Full mode only when every check passes; any single "no" means the fallback. */
export function chooseRenderMode(signals: RenderSignals): RenderMode {
  // Step 1: respect the visitor's wish for less motion.
  if (signals.prefersReducedMotion) {
    return 'fallback';
  }
  // Step 2: no WebGL2 means no 3D; Save-Data means don't download it.
  if (!signals.hasWebGL2 || signals.saveData) {
    return 'fallback';
  }
  return 'full';
}
