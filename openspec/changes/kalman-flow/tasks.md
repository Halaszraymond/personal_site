# Tasks

## 1. Transition maths

- [x] 1.1 Add `figureFade(amount)` and `transitionPose()` (a blend from a held pose into a playing animation over `TRANSITION` seconds) to `src/lib/kalman-animation.ts` (design §1–§2); verify with unit tests for "Same figure", the cross-fade never being see-through, and the end of the transition
- [x] 1.2 Update `docs/glossary.md` (transition, figure cross-fade, holding the last pose, tempo); verify it matches the code

## 2. The player

- [x] 2.1 Make the player remember its last drawn figure and pose, transition from it on `play()` (same figure: blend; another figure: cross-fade), hold the last pose when an animation finishes, and keep scrubbing exact (design §1–§3); verify with the preview's e2e tests and an e2e test that playing swim after the dive draws both figures and then only the swimming one
- [x] 2.2 Add `tempo(factor)` to the player (a gradual change of GSAP's `timeScale`); verify with an e2e check that the swim's clock runs slower after a low tempo

## 3. The animations

- [x] 3.1 Add the side pose `glide` and end the dive in it (design §4); verify with unit tests for "Levelling out" (horizontal, within a few units of the swimming figure) and that the dive's other scenarios still pass
- [x] 3.2 Start the launch from `glide` through a new `launchTurn` pose instead of the wind-up crouch (design §4); verify with unit tests for "From the swim" and that the launch's other scenarios still pass

## 4. The dive

- [x] 4.1 Update `afterOneShot()` and `diveState()` for climbing out at The ice (design §5); verify with unit tests for "Scrolling back up" and the dive's other state tests
- [x] 4.2 Add `swimTempo(speed)` to `src/lib/dive.ts` and drive the player's tempo from the scroll speed in the dive scripts (design §6); verify with unit tests for "Reading" and "Scrolling fast" and the dive e2e tests
- [x] 4.3 Make film strips of every transition on the dive page (design §7) and fix what they show; verify no strip shows a jump or a see-through moment

## 5. Wrap-up

- [ ] 5.1 Update `docs/architecture.md`, `docs/making-of.md` (with a film strip) and `PLANNING_LOG.md`; run the full check (lint, type check, unit, build, size, e2e in four browsers, Lighthouse); verify everything is green
- [ ] 5.2 Make new animation baselines with "Update visual baselines", check them by eye, and let CI pass on the branch; verify the `visual` project passes
- [ ] 5.3 Raymond judges the flow in the browser (dive, swim, launch, climbing out, tempo); verify his approval before archiving
