# Tasks

## 1. Squash and stretch in the rig

- [ ] 1.1 Add `stretch?: number` to `LayerPose` and `stretch?: Pair` to `RigLayer` in `src/lib/kalman-rig.ts`, with a `scaleAround()` matrix helper, and stretch each layer around its pivot in `resolvePose()` (design §1, §5); verify with unit tests: stretch 0.9 is 10% shorter and 1/0.9 wider with the pivot in place, no stretch changes nothing, the stretch turns with the layer, and a child's pivot stays attached on a squashed parent
- [ ] 1.2 Validate stretch: `validateRig()` rejects a stretch range that is empty, inverted or without 1; `validatePose()` rejects a stretch outside the range, a stretch for a layer without a range, and a stretch that is not a finite number; verify with one unit test per message
- [ ] 1.3 Add `clampToRig(pose, rig)` (design §4), which keeps every rotation and stretch inside its range and leaves offsets alone; verify with unit tests at, inside and beyond both ends of a range
- [ ] 1.4 Add the stretch ranges to `scripts/cut-kalman-layers.ts` (body [0.85, 1.15] and head [0.92, 1.08] for both figures) and widen the side feet's rotation to ±30° (design §6); verify `npm run cut:kalman` writes them to `rig.json`, `check:kalman` passes, and the side feet at ±30° and the bodies at both stretch ends show no cut edge or seam in the preview (screenshots)
- [ ] 1.5 Update `docs/architecture.md` (stretch in the matrix chain), `docs/glossary.md` (squash and stretch) and `src/scene/README.md` (the `stretch` field in poses and the rig); verify they match the code

## 2. Lag, overshoot and length in the animations

- [ ] 2.1 Add `lag` to `Animation` in `src/lib/kalman-animation.ts`, and sample each lagging layer at `t − lag` in `samplePose()`: the first pose before the start of a non-looping animation, wrapped around the loop's length in a loop (design §2); verify with unit tests for "A trailing tail" and "Lag in a loop", and that a layer without lag is unchanged
- [ ] 2.2 Add `playLength()` (last keyframe + largest lag for a non-looping animation, the keyframe length for a loop) and blend `stretch` in `blendPoses()`; verify with unit tests for both lengths and for a stretch halfway between 1 and 0.9
- [ ] 2.3 Add `back.out` and `back.inOut` to `EASES` and the lag checks to `validateAnimations()` (negative, not a number, a layer the figure doesn't have); verify with unit tests, including "Lag for an unknown layer"
- [ ] 2.4 Use `playLength()` and `clampToRig()` in `src/scene/kalman/kalman-player.ts`: the tween, the scrub range and "finished" use the play length, and every sampled pose is clamped before it is drawn; verify with the e2e tests "Lagging layers settle" (the dive only finishes once the tail is at rest) and the existing bow and scrub tests, with the scrub range read from the data
- [ ] 2.5 Update `docs/architecture.md` (lag as a time shift, clamping, play length) and `docs/glossary.md` (anticipation, follow-through, overlap, overshoot, lag); verify they match the code

## 3. The preview: stretch sliders

- [ ] 3.1 Add a stretch slider (step 0.01) per layer with a stretch range to the preview, below the rotation sliders, following the chosen figure and the named poses, and include stretches other than 1 in the pose JSON and Copy pose (`src/playground/preview-client.ts`, `src/lib/preview-pose.ts`, `src/i18n/preview.ts` for the labels in NL, HU and EN); verify with unit tests for `preview-pose.ts` and e2e tests for "Squashing with the keyboard", "Stretch slider limits" and "Stretch in the copied pose", passing in all four browsers and at 360 px

## 4. The new poses and animations, tuned with Raymond

- [ ] 4.1 Add the poses and keyframes of design §7 to `poses.json` and `animations.json` (bow: `bowRise`, `bowDeep`; dive: `crouch` with squash, `diveRise`, stretched `dive`; swim and launch with stretch and lag; idle unchanged); verify the data tests pass, plus unit tests against the repo data for "The deepest moment" (head lowered by at least a quarter of its height, body squashed, flippers outwards), "Crouch before the jump", "Rising before the fall" and "Stretched in flight"
- [ ] 4.2 Tune the bow with Raymond in the preview (depth, timing, lag, settle) and put his values in the data; verify Raymond approves the bow and the tests of 4.1 still pass
- [ ] 4.3 Tune the dive with Raymond in the same way, then swim and launch; verify Raymond approves each animation and the tests of 4.1 still pass
- [ ] 4.4 Update the snapshots of key moments (bow at its deepest, crouch, dive halfway, swim at the top of a stroke, launch pointing up) and make the baselines with "Update visual baselines"; verify the images look right and the `visual` project passes in CI
- [ ] 4.5 Log the chosen values in `PLANNING_LOG.md` and record the session in `docs/making-of.md` (what made it look static, the animation principles, before/after screenshots); verify the files are updated

## 5. Wrap-up

- [ ] 5.1 Measure the preview's JavaScript with `npm run size`; verify it is still within the 50 KB budget and public pages are unchanged
- [ ] 5.2 Run `npm run check` (with no dev server on port 4321) and let CI pass on the branch; verify everything is green and Raymond has judged all animations

## Workflow follow-up

- Run `/opsx:verify`, open the PR to main, and archive the change with `/opsx:archive`.
