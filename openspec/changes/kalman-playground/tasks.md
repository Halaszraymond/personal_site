# Tasks

## 1. Foundation

- [x] 1.1 Install `three` and `@types/three` (versions matching each other) and verify `npm ci`, `npm run typecheck` and `npm audit` stay clean
- [x] 1.2 Move `detectWebGL2()` from `RenderModeSwitch.astro` into `src/scene/webgl.ts` and use it there; verify the existing render-mode e2e tests still pass unchanged

## 2. Kálmán's config

- [x] 2.1 Add the parameter table, the derived `KalmanConfig` type and `validateConfig()` in `src/lib/kalman-config.ts`; verify with Vitest that defaults validate and that out-of-range, wrong-type, missing and unknown parameters fail with every offending key named
- [x] 2.2 Add `exportConfig()` / `importConfig()` with a format version; verify with Vitest the round trip and the clear failure on an unknown version or invalid JSON
- [x] 2.3 Add `src/scene/kalman/kalman.config.json` with the starting proposal (equal to the defaults); verify with a Vitest test that the file in the repo validates
- [x] 2.4 Add the config terms to `docs/glossary.md` (config, parameter table, JSON schema version) and a "Kálmán's config" section to `docs/architecture.md`; verify every parameter group is described

## 3. Shape and model

- [x] 3.1 Implement `src/lib/kalman-shape.ts` (silhouette profile, ear-patch weight, bill-stripe colour, flipper stroke angle); verify with Vitest the profile stays closed and monotonic in height, the patch weight is 1 at the ear and fades to 0 down the chest according to the spread, the stripe runs from orange to pink, and the stroke angle stays within the amplitude and repeats with the speed
- [x] 3.2 Implement `buildKalman(config)` in `src/scene/kalman/build-kalman.ts` (lathe body and head with vertex colours and flat shading, bill, flippers, feet, eyes, optional tie and glasses); verify with Vitest that the same config gives identical geometry and that tie and glasses appear only when switched on
- [x] 3.3 Add the feature and budget tests for `buildKalman()`: at all-minimum and all-maximum configs the back stays dark, the belly white, the ear patch golden-orange and the bill striped; the worst case stays ≤ 8,000 triangles and ≤ 20 meshes; verify they pass
- [x] 3.4 Document how Kálmán is built in `docs/architecture.md` (lathe, vertex colours, faceting, the originality rules) and add 3D terms to `docs/glossary.md` (mesh, geometry, material, vertex colour, flat shading, lathe, draw call, triangle budget); verify the originality rules match design.md

## 4. Dev-only availability

- [x] 4.1 Add `shouldIncludePlayground()` in `src/lib/playground-flag.ts` and the Astro integration that injects `/playground/` only when it returns true, plus `.env.playground` and the `build:playground` script; verify with Vitest all combinations (dev, build with and without the flag) and that `npm run build` has no `dist/playground/` while `npm run build:playground` does
- [x] 4.2 Add `scripts/check-production-build.ts` with its leak check as a pure function in `scripts/lib/`; verify with Vitest (clean build passes; a playground folder or a Three.js marker fails) and that the script passes on `npm run build`
- [x] 4.3 Give `BaseLayout` a `showLanguageSwitcher` prop (default on) and render the playground page shell with it off, `lang="en"`, `noindex` and no alternates; verify with Playwright the playground has no switcher, no hreflang links and `noindex`, and that the 404 still has no alternates (the modified i18n-routing scenarios)
- [x] 4.4 Document the flag (local, CI, Cloudflare Preview only) in `docs/architecture.md`; verify the documented commands work as written

## 5. The playground

- [ ] 5.1 Implement `kalman-view.ts` (renderer with capped pixel ratio, camera, lights, `OrbitControls` with reset to the front, draw-on-demand loop, visibility pause, `data-frames` / `data-triangles` / `data-draw-calls` on the canvas); verify with a Playwright smoke test in Chromium with SwiftShader that the canvas draws within the triangle and draw-call budgets with no console errors
- [ ] 5.2 Render the controls from the parameter table in `Controls.astro` (fieldsets per group, labelled ranges with outputs, switches, the tie colour) with English labels from `src/i18n/playground.ts`; verify with Playwright in all four browsers that there is exactly one control per parameter, with matching min/max/step, and that the keyboard changes a slider by one step
- [ ] 5.3 Connect controls to the model: changes validate, rebuild and request one frame; verify with Playwright (Chromium) that moving a slider increases `data-frames` without a reload, and that idle adds no frames
- [ ] 5.4 Add the swim preview with play/pause, paused at start under reduced motion and stopped while the tab is hidden; verify with Playwright that frames advance while playing, stop when paused or hidden, and that reduced motion starts paused
- [ ] 5.5 Add Reset, Copy config (clipboard with a status message, plus the read-only JSON text) and storage of the current values; verify with Playwright Reset, the clipboard content validating in Chromium, the refused-clipboard message elsewhere, values surviving a reload, and outdated stored values falling back without errors
- [ ] 5.6 Show the WebGL2 explanation instead of the canvas when WebGL2 is missing, with the controls still working; verify with Playwright (WebGL2 stubbed off) the message, working Copy config and no console errors
- [ ] 5.7 Add axe and console-error checks for `/playground/` to the quality tests; verify zero violations in all four browsers

## 6. Budgets and CI

- [ ] 6.1 Change the bundle check to per-page budgets (`scriptsInHtml()`, `reachableChunks()` in `scripts/lib/budgets.ts`): public pages 50 KB each, the playground its own budget; verify with Vitest on a small fake chunk graph, measure the real playground size, set its budget just above it and log the number in `PLANNING_LOG.md`
- [ ] 6.2 Update `ci.yml` and `npm run check` to the new order (production build → production check → playground build → size → e2e → Lighthouse), with SwiftShader flags for the Chromium 3D tests; verify the CI run on this branch is green except for the missing 3D baseline
- [ ] 6.3 Add the 3D snapshot of the default Kálmán to the `visual` project (front view, preview paused, small tolerance), make the baseline with the "Update visual baselines" workflow, and verify the next CI run is fully green
- [ ] 6.4 Ask Raymond to add `PLAYGROUND=1` to the Cloudflare Pages project for the **Preview** environment only; verify `/playground/` works on the branch preview and that production still returns 404 for it
- [ ] 6.5 Update `docs/architecture.md` (CI order, per-page budgets, 3D test layers); verify every new npm script is documented

## 7. Review and wrap-up

- [ ] 7.1 Review the default Kálmán with Raymond on the branch preview, specifically checking that he does not resemble existing penguin characters or mascots; adjust the shape functions until Raymond agrees, and record the outcome in `PLANNING_LOG.md`
- [ ] 7.2 Add the Phase 1 playground session to `docs/making-of.md` with screenshots of the playground and of Kálmán at a few slider settings; verify the images are committed and linked
- [ ] 7.3 Run `npm run check` locally and confirm CI is green on the final branch state

## Workflow follow-up

- Raymond plays with the playground and pastes his "Copy config" JSON; committing it as `kalman.config.json` is a small follow-up PR (validated by the config test).
- Then the next change: the animations (idle, dive, swim, launch) and the fallback stills.
- Archive this change with `/opsx:archive` after merging.
