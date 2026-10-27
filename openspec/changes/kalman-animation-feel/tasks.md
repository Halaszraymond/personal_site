# Tasks

## 1. Squash and stretch in the rig

- [x] 1.1 Add `stretch?: number` to `LayerPose` and `stretch?: Pair` to `RigLayer` in `src/lib/kalman-rig.ts`, with a `scaleAround()` matrix helper, and stretch each layer around its pivot in `resolvePose()` (design §1, §5); verify with unit tests: stretch 0.9 is 10% shorter and 1/0.9 wider with the pivot in place, no stretch changes nothing, the stretch turns with the layer, and a child's pivot stays attached on a squashed parent
- [x] 1.2 Validate stretch: `validateRig()` rejects a stretch range that is empty, inverted or without 1; `validatePose()` rejects a stretch outside the range, a stretch for a layer without a range, and a stretch that is not a finite number; verify with one unit test per message
- [x] 1.3 Add `clampToRig(pose, rig)` (design §4), which keeps every rotation and stretch inside its range and leaves offsets alone; verify with unit tests at, inside and beyond both ends of a range
- [x] 1.4 Add the stretch ranges to `scripts/cut-kalman-layers.ts` (body [0.85, 1.15] and head [0.92, 1.08] for both figures), widen the side body's rotation to [−150, 100] and the side feet's to ±20° with one shared pivot, cutting the side feet from their dark pixels with a soft ankle (design §6); verify `npm run cut:kalman` writes them to `rig.json`, `check:kalman` passes, unit tests for the new cut and a data test that both side feet turn together, and the side body at −150°, the side feet at ±20° and the bodies at both stretch ends show no cut edge or seam in the preview (screenshots)
- [x] 1.5 Update `docs/architecture.md` (stretch in the matrix chain), `docs/glossary.md` (squash and stretch) and `src/scene/README.md` (the `stretch` field in poses and the rig); verify they match the code

## 2. Lag, overshoot and length in the animations

- [x] 2.1 Add `lag` to `Animation` in `src/lib/kalman-animation.ts`, and sample each lagging layer at `t − lag` in `samplePose()`: the first pose before the start of a non-looping animation, wrapped around the loop's length in a loop (design §2); verify with unit tests for "A trailing tail" and "Lag in a loop", and that a layer without lag is unchanged
- [x] 2.2 Add `playLength()` (last keyframe + largest lag for a non-looping animation, the keyframe length for a loop) and blend `stretch` in `blendPoses()`; verify with unit tests for both lengths and for a stretch halfway between 1 and 0.9
- [x] 2.3 Add `back.out` and `back.inOut` to `EASES` and the lag checks to `validateAnimations()` (negative, not a number, a layer the figure doesn't have); verify with unit tests, including "Lag for an unknown layer"
- [x] 2.4 Use `playLength()` and `clampToRig()` in `src/scene/kalman/kalman-player.ts`: the tween, the scrub range and "finished" use the play length, and every sampled pose is clamped before it is drawn; verify with the e2e test "Lagging layers settle" (the dive only finishes once the tail is at rest) and the existing bow and scrub tests, with the scrub range read from the data
- [x] 2.5 Update `docs/architecture.md` (lag as a time shift, clamping, play length) and `docs/glossary.md` (anticipation, follow-through, overlap, overshoot, lag); verify they match the code

## 3. The drawn bow

- [x] 3.1 Add `references/` to `.gitignore` (design, Migration Plan); verify `git check-ignore references/x.png` reports it as ignored
- [x] 3.2 Add prompts 7 and 8 (the bowed head, goofy and professional, with the warmer eyes and the ear patches kept in place) to `docs/kalman-layers.md`; verify the prompts name the files `front-bow-goofy.png` and `front-bow-professional.png`
- [x] 3.3 Check Raymond's regenerated bow images (same size as `front-goofy.png`, the lower half lined up, white background, no text) and save them in `docs/images/kalman-design/`; verify with the alignment check (best shift 0, 0 against `front-goofy.png`) and a side-by-side screenshot for Raymond
- [x] 3.4 Cut the drawn bow in `scripts/cut-kalman-layers.ts` like a turntable view (plumage matched, feet on the front ground line, centred), stopping when the two bow images differ in size, and write `src/scene/kalman/drawn-poses.json` (design §7); verify `npm run cut:kalman` writes it, `check:kalman` passes, a unit test for the size check, and a data test for "The drawn bow in place"
- [x] 3.5 Draw the drawn poses hidden in `KalmanFigure.astro` per mood (as the turntable views), and add `drawn` and the fade to keyframes: `samplePose()` also returns the drawing's opacity, validation rejects an unknown drawn pose, and the player sets the opacity on the drawing and the opposite on the layers (design §8); verify with unit tests for "Holding the drawn pose" and "Halfway through the cross-fade" (opacity 1 and 0.5, the same when scrubbed), and that the drawn bow's images only load on pages that already show the figure
- [x] 3.6 Update `docs/architecture.md` (drawn poses next to the turntable), `docs/glossary.md` (drawn pose, cross-fade) and `src/scene/README.md` (`drawn-poses.json`, the `drawn` field); verify they match the code

## 4. The preview: stretch sliders

- [x] 4.1 Add a stretch slider (step 0.01) per layer with a stretch range to the preview, below the rotation sliders, following the chosen figure and the named poses, and include stretches other than 1 in the pose JSON and Copy pose (`src/playground/preview-client.ts`, `src/lib/preview-pose.ts`, `src/i18n/preview.ts` for the labels, in English only like the rest of the dev-only preview); verify with unit tests for `preview-pose.ts` and e2e tests for "Squashing with the keyboard", "Stretch slider limits" and "Stretch in the copied pose", passing in all four browsers and at 360 px

## 5. The new poses and animations, tuned with Raymond

- [x] 5.1 Add the poses and keyframes of design §10 to `poses.json` and `animations.json` (bow with `drawn: "bow"`; dive with lean, crouch, hop and face-first entry; horizontal swim with surge, drift and glance; launch with wind-up, rise, flight, landing, wobble and recovery; idle unchanged); verify the data tests pass, plus unit tests against the repo data for every scenario of "The bow is a deep, polite bow", "The dive moves like a dive", "The swim moves like a stroke" and "The launch is professional, the landing goofy"
- [ ] 5.2 Tune the bow with Raymond in the preview (depth, the moment of the cross-fade, the hold, the settle); verify Raymond approves the bow and the tests of 5.1 still pass
- [ ] 5.3 Tune the dive with Raymond (lean, crouch, hop, flailing flippers, face-first entry, trailing); verify Raymond approves the dive and the tests of 5.1 still pass
- [ ] 5.4 Tune the swim with Raymond (horizontal glide, surge, drift, the glance at a fish, loop without a jump); verify Raymond approves the swim and the tests of 5.1 still pass
- [ ] 5.5 Tune the launch with Raymond (wind-up, rocket rise, flight, landing, wobble, recovery); verify Raymond approves the launch and the tests of 5.1 still pass
- [ ] 5.6 Update the snapshots of key moments (bow halfway through the cross-fade and at the drawn bow, the dive's crouch and entry, the swim at the end of the down stroke, the launch rising, landing and wobbling) and make the baselines with "Update visual baselines"; verify the images look right and the `visual` project passes in CI
- [ ] 5.7 Log the chosen values in `PLANNING_LOG.md` and record the session in `docs/making-of.md` (what made it look static, the references in words, the animation principles, before/after screenshots of Kálmán only); verify the files are updated

## 6. Eyes that follow the pointer

- [x] 6.1 Add prompts 9 and 10 (the front views without pupils, goofy and professional) to `docs/kalman-layers.md`; verify the prompts name the files `front-goofy-no-pupils.png` and `front-professional-no-pupils.png`
- [x] 6.2 Check Raymond's two images without pupils (same size as `front-goofy.png`, only the pupils changed) and save them in `docs/images/kalman-design/`; verify with the alignment check (best shift 0, 0) and a difference map that shows only the pupils
- [x] 6.3 Add `shift` and `mood` to `RigLayer` in `src/lib/kalman-rig.ts`: validation of a shift range and of a pose's offset against it, `clampToRig()` clamping such offsets, and `resolvePose()` showing a layer with `mood` only in that mood (design §11); verify with unit tests, including "Pupil at the edge", "Professional mood" and "Goofy mood"
- [x] 6.4 Cut the head and the glasses from the images without pupils and the two pupil layers from the differences in `scripts/cut-kalman-layers.ts`, with their shift measured on the images; verify `npm run cut:kalman` and `check:kalman` pass, the data test for the eleven front layers, and screenshots of the pupils at the ends of their shift in both moods with no copy left behind
- [x] 6.5 Add `eyeShift()` with unit tests ("Pointer far to the right", "Pointer straight above the head", "Pointer below and to the left") and move the pupils in the player's head-follow, faster than the head; verify with e2e tests for "Pointer to the right" and "Eyes in the professional mood" in all four browsers
- [x] 6.6 Tune the eyes with Raymond in the preview (how far, how fast) and update `docs/architecture.md`, `docs/glossary.md` and `docs/kalman-layers.md` for the pupils; verify Raymond approves and the docs match the code

## 7. Second round: knees, a smoother bow, head-follow and the belly landing

- [x] 7.1 Add `plant` to `LayerPose` and to `resolvePose()` (a planted layer mixed between following its parent and staying at rest, design §12), blended in `blendPoses()` and validated as 0–1; verify with unit tests for "Crouching on planted feet" and "Feet that leave the ground", and that a foot's own rotation still applies
- [x] 7.2 Use planted feet in the dive's crouch and push-off, the launch's wind-up and stand-up, and the bow; verify with the scenario tests of 5.1 (updated) and film strips
- [ ] 7.3 Make the bow fold smoothly (shorter head on the way down, `fade` 0.5 s, earlier and overlapping cross-fade, `sine.inOut`); verify with the updated "On the way down" test and a film strip, and Raymond approves the bow
- [ ] 7.4 Let the body turn along during head-follow (a fraction of the head's angle, slower) and reduce the head's own turn; verify with unit tests for the body's share and an e2e test that the body leans with the pointer, and Raymond approves
- [ ] 7.5 Replace the launch's landing with the belly landing, slide and stand-up on planted feet; verify with the scenario tests "Landing on his belly" and "Standing up", a film strip, and Raymond approves

## 8. The drawn swim figure

- [x] 8.1 Add prompts 11–13 (swimming, goofy; its professional edit; without the near flipper) to `docs/kalman-layers.md`; verify the prompts name `swim-goofy.png`, `swim-professional.png` and `swim-no-flipper.png`
- [ ] 8.2 Check Raymond's three swim images (same size, lined up, white background) and save them; verify with the alignment check and a side-by-side
- [ ] 8.3 Add the `swim` figure (`Figure`, `FIGURES`, rigs, poses, the figure switch and the player) and cut its rig in `scripts/cut-kalman-layers.ts` (body from the edit without the flipper, flipper along a traced outline, tie and glasses); verify `cut:kalman`, `check:kalman`, the data test for its four layers, and "A stroking flipper" in a screenshot
- [ ] 8.4 Move the swim animation to the swimming figure with its own poses (body pitch, flipper strokes with lag, a glance by tipping the body); verify with the updated swim scenario tests, the e2e test "Showing the swimming figure", and Raymond approves the swim

## 9. Wrap-up

- [x] 9.1 Measure the preview's JavaScript with `npm run size`; verify it is still within the 50 KB budget and public pages are unchanged
- [ ] 9.2 Run `npm run check` (with no dev server on port 4321) and let CI pass on the branch; verify everything is green and Raymond has judged all animations

## Workflow follow-up

- Run `/opsx:verify`, open the PR to main, and archive the change with `/opsx:archive`.
