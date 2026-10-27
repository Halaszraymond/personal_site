# Tasks

## 1. Lighter images

- [ ] 1.1 Give `KalmanFigure.astro` the props `turntable` and `drawnPoses` (default off) and pass both on in the dev preview; verify the preview's e2e tests and Kálmán snapshots still pass, and a unit or e2e check that a page without them has no turntable or drawn-pose `<image>`
- [ ] 1.2 Build the figure's images as WebP through Astro's `getImage()` at twice their width on a 480 px stage (design §7); verify in the build output that the layer images are `.webp` and no wider than that, and that the existing Kálmán snapshots stay within their tolerance
- [ ] 1.3 Let a figure be drawn with deferred images (`data-href`, filled in after `load` or on demand) for the side and swimming figures; verify with an e2e test that on a home page their images only load after the page has loaded
- [ ] 1.4 Update `docs/architecture.md` (images per page, WebP, deferred figures) and `src/scene/README.md`; verify they match the code

## 2. The dive's logic

- [ ] 2.1 Write `src/lib/dive.ts` with the sections (ids, depths, order), `depthAt(probe, anchors)` and the ascent anchors (design §2); verify with unit tests for "At the start of a section", "The ascent", clamping above and below, and continuity
- [ ] 2.2 Add `waterAt(depth)` (OKLab blend between the colour stops) and `textFor(background)` (design §3); verify with unit tests for the stops, for "Deep down", and that text and accent keep at least 4.5:1 at every metre from 0 to 564 m
- [ ] 2.3 Add `diveState(previous, depth, zone, direction)` (design §4); verify with unit tests for "The first scroll", "The ascent", "Scrolling back up", and reversing during a one-shot animation
- [ ] 2.4 Update `docs/glossary.md` (depth mapping, express dive, OKLab, the dive's states); verify it matches the code

## 3. The page

- [ ] 3.1 Add the section texts (headings, placeholder text, gauge labels) to `src/i18n/ui.ts` in NL, HU and EN, written per language (design §8); verify the type check requires every key in every language
- [ ] 3.2 Render the six sections with their anchors and `data-depth` in `HomePage.astro`, replacing the Phase 0 test string, and move the tests that used it to the section headings; verify with e2e tests for "Sections in order" and "Linking to a section" in all three languages, and that the render-mode test "same text and links in both modes" still passes
- [ ] 3.3 Add the depth gauge component (a `<nav>` with the section links at their depths, the current depth and a marker; design §1) and the sticky stage layout; verify with e2e tests for "Following the depth", keyboard use, the accessible name, and "On a phone" at 360 px
- [ ] 3.4 Add the still dive (design §6): the build-time colours per section and a static front-figure still per section, hidden in full mode; verify with e2e tests for "Reduced motion" and "Without JavaScript"

## 4. Full mode: the moving dive

- [ ] 4.1 Write the dive client script: measure the anchors, follow the scroll (passive, once per frame), set the colours on `<html>` and update the gauge; verify with e2e tests that the gauge and the background follow the scroll, and "Contrast at every depth" on the page
- [ ] 4.2 Put Kálmán on the stage in `RenderModeSwitch.astro` (front, side and swimming figures, no turntable) and drive the player from `diveState()`; verify with e2e tests for "The dive scene", "The first scroll", "The ascent" and "Scrolling back up"
- [ ] 4.3 Add the express dive (design §5): the tween in full mode, instant with reduced motion and in the fallback, focus on the heading, the hash updated; verify with e2e tests for "Express dive to The catch" and "Express dive with reduced motion"
- [ ] 4.4 Tune with Raymond in the browser: the section heights, the stage size, the gauge on a phone, the colours; verify Raymond approves and the tests still pass

## 5. Wrap-up

- [ ] 5.1 Make new visual baselines for the home pages in both modes with "Update visual baselines"; verify the images look right and the `visual` project passes in CI
- [ ] 5.2 Measure with `npm run size` (home pages within 50 KB) and Lighthouse on the home pages (at least 90 on mobile for performance, "Lighthouse on mobile"); log both in `PLANNING_LOG.md`
- [ ] 5.3 Tick the dive in README §7 (Phase 2), update `docs/making-of.md`, and let CI pass on the branch; verify everything is green and Raymond has judged the dive

## Workflow follow-up

- Run `/opsx:verify`, open the PR to main, and archive the change with `/opsx:archive`.
