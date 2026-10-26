# Tasks

## 1. Branch and WebGL2 removal

- [x] 1.1 Create the feature branch `change/kalman-rig` from `main`; verify with `git branch --show-current`
- [x] 1.2 Remove `hasWebGL2` from `src/lib/render-mode.ts` and `detectWebGL2()` from `src/components/RenderModeSwitch.astro`, update their header comments from "3D" to "animated scene", and update `tests/unit/render-mode.test.ts` and `tests/e2e/render-mode.spec.ts` (no WebGL stubs); verify unit and render-mode e2e tests pass
- [x] 1.3 Update the Purpose line of `openspec/specs/render-fallback/spec.md` (no longer "full 3D experience") and the `package.json` description (no longer "low-poly"); verify `openspec validate kalman-rig --strict` still passes

## 2. Dev-only route and production check (carried over)

- [x] 2.1 Bring over `src/lib/playground-flag.ts` and its unit test from `change/kalman-playground`; verify the test passes
- [x] 2.2 Add the integration in `astro.config.ts` that injects `/playground/` → `src/playground/PreviewPage.astro` (a minimal page for now), plus `.env.playground` and `npm run build:playground`; verify `npm run build` has no `dist/playground/` and `npm run build:playground` does
- [x] 2.3 Add `showLanguageSwitcher` to `BaseLayout.astro` and use it (with no `canonicalPath`) on the preview page; add `tests/e2e/preview-page.spec.ts` for `noindex`, `lang="en"`, no alternates, no switcher, and no alternates on the 404; verify it passes
- [x] 2.4 Bring over `scripts/lib/production-check.ts` with the `kalman-preview` marker instead of `__THREE__`, its unit test and `scripts/check-production-build.ts` as `npm run check:production`; verify it passes on the production build and fails on the playground build
- [x] 2.5 Bring over the per-page budgets (`scripts/lib/budgets.ts`, `scripts/check-bundle-size.ts`, `tests/unit/budgets.test.ts`), with the 50 KB base budget for every page; verify `npm run size` prints one line per page and passes
- [ ] 2.6 Update the CI workflow and `npm run check` to the order in design §10; verify by pushing the branch and seeing the CI `check` job green

## 3. Rig and pose logic

- [ ] 3.1 Write `src/lib/kalman-rig.ts` types and the matrix helpers (`translate`, `rotateAround`, `multiply`, `applyToPoint`) with unit tests, including the NumPy comparison in comments; verify the tests pass
- [ ] 3.2 Implement `validateRig()` for every failure in spec "An invalid rig fails the build checks" (duplicate name, unknown parent, loop, shared order, missing image, bad rotation range, not exactly one root) with one test each; verify the tests pass
- [ ] 3.3 Implement `resolvePose()` (parents first, child moved by its parent's movement from rest, sorted by `order`, accessories hidden in the goofy mood, pivot on the artboard) with tests for rest, pivot stays put, glasses follow the head, far flipper behind the body and partial poses; verify the tests pass
- [ ] 3.4 Implement `validatePose()` (unknown layer, non-finite value, rotation out of range) with tests; verify the tests pass

## 4. Placeholders, rig data and the figure

- [ ] 4.1 Draw the nine placeholder SVGs in `src/assets/kalman/placeholder/` in the design sheet's colours with a dashed outline; verify by opening them in the browser next to `docs/images/kalman-design/turnaround.png`
- [ ] 4.2 Write `src/scene/kalman/rig.json` and `poses.json` (rest, bow, flippers up, head tilt left and right), and a unit test that both validate and the rig has exactly the nine layers with the body as the only root; verify the test passes
- [ ] 4.3 Build `KalmanFigure.astro` (SVG, one `<g data-layer>` per layer, images via `import.meta.glob`, pose and mood props) and `kalman-figure-client.ts` (`applyPose()`); verify on the preview page that the figure shows in rest with JavaScript disabled
- [ ] 4.4 Write `docs/kalman-layers.md` (design §5b): the layer list with sizes and pivots from `rig.json`, the rules for every image, how to remove the flat background, and a ready-to-paste prompt per layer with the shared style block; verify every layer in `rig.json` has a row and a prompt, and hand it to Raymond so he can start on the art
- [ ] 4.5 Update `src/scene/README.md` for 2D, and add rig, pivot, pose, artboard, transform matrix and drawing order to `docs/glossary.md`; verify the terms used in the code comments all appear there

## 5. The preview page

- [ ] 5.1 Build `PreviewControls.astro` from `rig.json` and `poses.json` (pose buttons, mood switch, pivot switch, one slider per layer with an `<output>`); verify there is exactly one slider per layer with the layer's range
- [ ] 5.2 Write `preview-client.ts`: pose buttons with `aria-pressed`, sliders that rotate layers and follow named poses, mood switch, pivot markers, and the figure's `aria-label`; add e2e tests for each of these; verify they pass
- [ ] 5.3 Add "Copy pose" (clipboard, visible JSON, status line) with e2e tests for the clipboard (Chromium) and the refused-clipboard case; verify they pass and that copied JSON passes `validatePose()`
- [ ] 5.4 Lay out the preview mobile-first; add e2e tests for 360 px without horizontal scroll, axe and no console errors; verify they pass
- [ ] 5.5 Add the two pose snapshots (rest goofy, bow professional) to `tests/e2e/visual.spec.ts` and run "Update visual baselines" on the branch; verify the new images look right and the `visual` project passes

## 6. Docs and wrap-up

- [ ] 6.1 Update `docs/architecture.md` (rig data → `resolvePose()` → SVG, the dev-only route, the CI order); verify it matches the code
- [ ] 6.2 Record this session in `docs/making-of.md` with a screenshot of the preview, tick the relevant part of Phase 1 in README §7, and add the decisions to `PLANNING_LOG.md`; verify the files are updated
- [ ] 6.3 Run `npm run check` locally and check the preview on the Cloudflare branch preview (and that `/playground/` is a 404 on production); verify everything is green and Raymond has looked at the preview

## Workflow follow-up

- Raymond reviews the preview and the poses; open a pull request when he asks.
- Run `/opsx:verify`, then `/opsx:archive` after the merge.
- Next change: the animations (idle, dive, swim, bow, head-follow, launch) with GSAP.
