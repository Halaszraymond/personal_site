# Tasks

## 1. Setup and the side images

- [x] 1.1 Add `gsap@3.15` as a dependency (approved by Raymond); verify `npm ls gsap` shows 3.15 and `npm run build` still passes
- [x] 1.2 Add the side-view prompts to `docs/kalman-layers.md` (design §6: the goofy side view in rest pose, its professional edit and the edit without the near flipper); verify the prompts name the files `side-goofy.png`, `side-professional.png` and `side-no-flipper.png`
- [x] 1.3 Check Raymond's three side images (same size, pixel-aligned, no text) and save them in `docs/images/kalman-design/`; verify with the alignment check (best shift 0, 0) against `side-goofy.png`

## 2. Two figures: rigs and poses

- [x] 2.1 Add the `Figure` type and a `figure` field to poses in `src/lib/kalman-rig.ts`; `validatePose()` checks a pose against its own figure's rig; verify with unit tests for a front pose, a side pose and a pose naming the other figure's layer
- [x] 2.2 Add `polygonCoverage()` to `scripts/lib/kalman-cut.ts` with unit tests, and extend `scripts/cut-kalman-layers.ts` with the side settings and layer list (design §6: flipper along a traced outline, body from `side-no-flipper`), measured on Raymond's images, and write `rig.json` as `{ front, side }`; verify `npm run cut:kalman` writes both rigs, `check:kalman` passes, and the side layers line up at rest (screenshot)
- [x] 2.3 Load both rigs in `repo-rig.ts`, add `figure` to every pose in `poses.json` and the side poses rest, stroke up, stroke down and dive; update `tests/unit/kalman-rig-data.test.ts` for both layer sets; verify the tests pass
- [x] 2.4 Draw both figures in `KalmanFigure.astro` (`<g data-figure>` per figure, figure-scoped layer selectors) and pass the figure to `applyPose()`; verify the existing preview e2e tests still pass and the side figure shows in rest when switched to

## 3. Animation logic

- [x] 3.1 Write `src/lib/kalman-animation.ts` types and `validateAnimations()` (first keyframe at 0, increasing times, poses of the right figure, allowed eases, the six names) with one unit test per failure; verify the tests pass
- [x] 3.2 Implement `blendPoses()` and `samplePose()` with an injected easing function; unit tests at keyframes, halfway with a linear ease, with a fixed S-curve, and staying inside the rotation ranges; verify the tests pass
- [x] 3.3 Implement `headTurn()` with unit tests (straight above → 0, far left and right → the ends of the range, in between proportional); verify the tests pass
- [x] 3.4 Write `src/scene/kalman/animations.json` with the six animations (design §7) and a data test that it validates against the repo's poses; verify the test passes

## 4. The player

- [x] 4.1 Write `src/scene/kalman/kalman-player.ts`: one GSAP tween per animation driving `samplePose()` → `applyPose()`, one animation at a time, rest at the end of a non-looping animation, `data-animation` and `data-time` on the figure; verify by playing the bow in the preview
- [x] 4.2 Add the idle loop, scrubbing (`pause()` + `progress()`), pausing on `visibilitychange`, and no autoplay with reduced motion; verify by hand in the preview and with the e2e tests of task 5.3
- [x] 4.3 Add head-follow: pointer → artboard coordinates (`getScreenCTM().inverse()`), `headTurn()`, smoothed with `gsap.quickTo`, back to rest when the pointer leaves; verify by moving the pointer over the stage

## 5. The preview

- [x] 5.1 Add the front/side switch, and let the pose buttons and rotation sliders follow the chosen figure (Copy pose includes `figure`); verify with e2e tests for switching and for side poses
- [x] 5.2 Add the animation controls: a play button per animation, the idle loop switch, the scrub slider with its `<output>`; verify there is exactly one button per animation and the slider's range is the animation's duration
- [x] 5.3 Add e2e tests: playing the bow (marked while playing, rest afterwards), swim stops idle, idle on by default and off with reduced motion, scrubbing sets `data-time` and the layers, head-follow turns the head with the pointer, a hidden tab stops `data-time`; verify they pass in all four browsers
- [x] 5.4 Add the snapshots of key moments (bow at its deepest, dive halfway, swim at the top of a stroke, launch pointing up), held with the scrub slider, and make the baselines with "Update visual baselines"; verify the images look right and the `visual` project passes in CI

## 6. Docs and wrap-up

- [x] 6.1 Update `docs/architecture.md` (animations as data, the player, two figures), `docs/glossary.md` (keyframe, easing, timeline, interpolation, scrubbing), `src/scene/README.md` and `docs/kalman-layers.md` (the side figure); verify they match the code
- [x] 6.2 Measure the preview's JavaScript with `npm run size` and log it in `PLANNING_LOG.md`; verify it is within the 50 KB budget
- [ ] 6.3 Record the session in `docs/making-of.md` with screenshots of key moments, tick the animations in README §7 and mark Phase 1 done there once Raymond agrees; verify the files are updated
- [ ] 6.4 Run `npm run check` and check the preview on the Cloudflare branch preview with Raymond; verify everything is green and Raymond has judged the animations

## Workflow follow-up

- Raymond tunes the timings and poses in `animations.json` and `poses.json` in the preview.
- Run `/opsx:verify`, open the PR, then `/opsx:archive` after the merge.
- Then Phase 1 is done; Phase 2 (the dive) starts only with Raymond's go-ahead.
