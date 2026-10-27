# Proposal

## Why

Kálmán can be posed, spun and turned around, but he doesn't move yet. The animations are the last part of Phase 1 (README §7): idle, dive, swim, bow, head-follow and launch, each judged by Raymond in the dev-only preview before Phase 2 builds the dive around them. Diving, swimming and launching read as movement from the side, so Kálmán also needs a posable side view.

## What Changes

- **Animations as data**: each animation is a list of keyframes (a pose at a moment in time, with an easing), for the front or the side figure, played once or looped. Six animations: idle (a gentle sway and breathing, looped), bow, head-follow, dive, swim (flipper strokes, looped) and launch.
- **The maths stays pure**: blending between two poses at a point in time, and turning a pointer position into a head turn, are tested functions in `src/lib/`. GSAP only drives the time and the easing; nothing about Kálmán is hidden inside it.
- **GSAP 3.15** as a dependency (approved by Raymond): timelines and easing, on the pages that animate Kálmán only. Free under GSAP's Standard no-charge licence.
- **A posable side view**: Raymond makes two Gemini images (a goofy side view with the flipper slightly away from the body, and its professional edit); `npm run cut:kalman` cuts them into a second rig with its own layers and poses. The figure shows the front or the side figure, depending on the animation or the preview's view switch.
- **The preview gets animation controls**: a play button per animation, an on/off switch that loops the idle animation, head-follow while the pointer moves over the stage, a slider to scrub through the chosen animation, and a front/side switch for posing. With reduced motion requested nothing plays by itself; an animation only plays when Raymond presses its button.
- **Considerate playback**: animations stop while the tab is hidden, and a finished animation returns Kálmán to rest.
- Out of scope, each later: the air-bubble trail of the launch and chasing a fish (they need the water and the fish of Phase 2), scroll-driven playback (Phase 2), the fallback stills per section (Phase 2) and the frame-time check (README §5.2 step 3, once a scene runs).

## Capabilities

### New Capabilities
- `kalman-animation`: Kálmán's animations as data, how they blend poses over time and follow the pointer, and how playback respects the visitor (reduced motion, hidden tab).

### Modified Capabilities
- `kalman-rig`: the rig and its layers come in two views (front and side), each cut from Raymond's images; the side figure has its own layers and poses.
- `kalman-preview`: play buttons, the idle loop switch, head-follow on the stage, the scrub slider, and the front/side switch.

## Impact

- **New code**: `src/lib/kalman-animation.ts` (keyframe validation, pose blending, head-follow maths), `src/scene/kalman/animations.json`, `src/scene/kalman/kalman-player.ts` (GSAP timelines that apply blended poses), side-view settings in `scripts/cut-kalman-layers.ts`.
- **Changed code**: `rig.json` and `poses.json` (per view), `src/lib/kalman-rig.ts` and `repo-rig.ts` (two rigs), `KalmanFigure.astro` and `kalman-figure-client.ts` (front and side layer groups), the preview controls and client.
- **Images**: two new Gemini images from Raymond (`side-goofy.png`, `side-professional.png`); prompts in `docs/kalman-layers.md`.
- **Tests**: unit tests for blending, keyframes and head-follow; e2e tests for the play buttons, loop, scrub, view switch, reduced motion and the hidden tab; a few snapshots of key moments of the animations.
- **Budgets**: the preview loads GSAP (about 25–30 KB gzipped), still within the 50 KB page budget; public pages are unchanged.
- **Dependencies**: `gsap` 3.15.
- **Docs**: README (§2.1 and §7), `docs/architecture.md`, `docs/glossary.md` (keyframe, easing, timeline, interpolation), `docs/kalman-layers.md`, `docs/making-of.md` and the planning log.
