/*
 * Full mode or the static fallback, decided before the page is drawn (spec: render-fallback).
 *
 * A classic script in <head> (not a module): the browser runs it before it paints the body,
 * so the page is drawn once, in the right layout. A module runs after parsing, often after the
 * first paint, and the dive would then jump from the fallback layout to the full one (a layout
 * shift that cost 20 Lighthouse points). It is its own file because the Content-Security-Policy
 * blocks inline scripts.
 *
 * Plain JavaScript, served as-is: it must mirror chooseRenderMode() in src/lib/render-mode.ts.
 * tests/unit/render-mode-boot.test.ts runs this file for every combination and checks that the
 * two agree. Without JavaScript, or if this throws, the page keeps `fallback` from the HTML.
 */
/* global window, navigator, document -- a browser script; tells ESLint these names exist. */
(function () {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // `navigator.connection` only exists in Chromium; missing means "not asked to save data".
  var connection = navigator.connection;
  var saveData = Boolean(connection && connection.saveData === true);
  document.documentElement.dataset.renderMode = reducedMotion || saveData ? 'fallback' : 'full';
})();
