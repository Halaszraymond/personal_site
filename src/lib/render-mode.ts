/**
 * Decides whether a visitor gets the full animated experience or the static fallback.
 *
 * Pure logic: the browser signals come in as values, so every combination is
 * unit-tested without a browser. The client script in RenderModeSwitch.astro
 * collects the signals and applies the result.
 *
 * The checks follow README §5.2, cheapest first. Step 3 (measuring the frame time
 * of the running scene) joins once there is an animated scene to measure.
 * There is no WebGL check: the site is 2D (layered images, SVG and canvas 2D).
 */

/** The two ways a page can render. */
export type RenderMode = 'full' | 'fallback';

/** What the browser tells us about the visitor. */
export interface RenderSignals {
  /** The system asks for less motion (`prefers-reduced-motion: reduce`). */
  prefersReducedMotion: boolean;
  /** The visitor asked to save data. Only Chromium reports it; elsewhere this is `false`. */
  saveData: boolean;
}

/** Full mode only when every check passes; any single "no" means the fallback. */
export function chooseRenderMode(signals: RenderSignals): RenderMode {
  // Step 1: respect the visitor's wish for less motion.
  if (signals.prefersReducedMotion) {
    return 'fallback';
  }
  // Step 2: Save-Data means don't download the animation code and images.
  if (signals.saveData) {
    return 'fallback';
  }
  return 'full';
}
