# Proposal

## Why

Phase 1 has changed direction: Kálmán is now a 2D cut-out figure (README §2.1), not a 3D model, and the `kalman-playground` change will not be merged. The final layer illustrations don't exist yet, but everything that moves them can be built and tested now. Building the rig first means the art can drop in later as data, without code changes, and Raymond can judge poses before any animation work starts.

*Updated 2026-10-26:* Raymond's final design now exists as two large front views made with Gemini (`docs/images/kalman-design/front-goofy.png` and `front-professional.png`). A placeholder penguin drawn in code looked nothing like his design, so the layers are cut from his own images instead, and the preview also lets him spin Kálmán and turn him around.

## What Changes

- **Kálmán's rig as data**: one config file says which layers Kálmán has (body, head, both flippers, both feet, tail, tie, glasses), which image each one uses, where it sits, where it pivots, which layer it hangs from, its drawing order and how far it may rotate.
- **Poses as data**: a small set of named still poses (rest, bow, flippers up, head tilted left and right) stored as rotations and offsets per layer, plus a "professional" switch that shows or hides the tie and glasses.
- **Pose maths as pure functions** in `src/lib/`: turning a rig and a pose into one position per layer, with child layers following their parent (glasses follow the head). Unit-tested without a browser.
- **Kálmán drawn as plain SVG at build time** in his rest pose, so he works without JavaScript and the later fallback stills come for free. A small client script only changes the transforms when the pose changes.
- **Layers cut from Raymond's final design**: the nine layers come from his goofy front view; the tie, the glasses and the calmer professional eyes come from the difference with the professional version, which is the same image with only those added. A script in the repo does the cutting, so the layers can be made again from new or better images. The neck joint fades softly, so tilting and nodding show no hard edge.
- **Spinning and turning around in the preview**: a slider spins the whole figure as one piece, and a turntable (slider or dragging) shows Kálmán from the drawn views in `turntable.json`: at each view's own angle exactly that drawing, in between the view narrows and the next one fades in on top. Views arrive from Raymond one by one (¾ front, side, ¾ back, back; the other side is mirrored); with only the front view the control is hidden.
- **An image guide with ready-made prompts**: which images Raymond makes for Kálmán (the two front views, then the turntable views, each professional version as an edit of the goofy one), with prompts for Gemini and the rules each image must follow to fit (same size and place, plain white background, a small gap between flippers and body).
- **A dev-only animation preview at `/playground/`**: Kálmán with a button per pose, the professional switch, a slider per layer rotation to try new poses, a "show pivots" overlay, and "Copy pose" to turn a tried pose into JSON for the repo. English only, never on production, as already agreed for the dev-only playground.
- **The dev-only plumbing from the 3D branch, carried over**: the `PLAYGROUND` build flag, the production-build check, and bundle budgets measured per page.
- **BREAKING (internal)**: the WebGL2 check is removed from the render-mode switch. With a 2D site it no longer decides anything (README §7, Phase 1).
- Out of scope, each in a later change: the animations (idle, dive, swim, bow, head-follow, launch) with GSAP, Kálmán on the public pages (Phase 2 hero), the frame-time check (README §5.2 step 3), the side-view poses for swimming and other action poses (with the animations and sections), and a 3D model (considered and rejected: Kálmán stays 2D).

## Capabilities

### New Capabilities
- `kalman-rig`: Kálmán as a cut-out figure: the rig config, named poses, the professional accessories, how a pose becomes the drawn figure, where the layers come from, spinning the whole figure and the drawn views for turning around.
- `kalman-preview`: the dev-only page where Raymond views and tries Kálmán's poses, spins him and turns him around, and how it is kept off production.

### Modified Capabilities
- `render-fallback`: the WebGL2 requirement is removed; full mode depends only on reduced motion and Save-Data, and the spec no longer speaks of a 3D experience.
- `i18n-routing`: hreflang alternates and the language switcher apply to public, indexable pages only, so the dev-only preview is exempt.

## Impact

- **New code**: `src/lib/kalman-rig.ts` (types, validation, pose maths), `src/scene/kalman/` (rig and pose JSON, the SVG figure component, the client script), `src/assets/kalman/front/` (the layers and front views cut from the final design), `src/scene/kalman/turntable.json` and `src/lib/kalman-turntable.ts` (the turntable), `scripts/cut-kalman-layers.ts` with its pure logic in `scripts/lib/` (the cutting), `src/playground/` (the preview page), `src/lib/playground-flag.ts`, `scripts/check-production-build.ts` and its `scripts/lib/` helper.
- **Changed code**: `src/lib/render-mode.ts`, `src/components/RenderModeSwitch.astro`, `src/components/BaseLayout.astro` (optional language switcher), `astro.config.ts` (the dev-only route), `scripts/check-bundle-size.ts` and `scripts/lib/budgets.ts` (per page), the CI workflow and `package.json` scripts (second build with the flag).
- **Tests**: new unit tests for the rig, poses, flag, budgets and production check; new Playwright tests and two pose snapshots for the preview; the WebGL stubs in `tests/e2e/render-mode.spec.ts` go away.
- **Dependencies**: `sharp` is declared as a devDependency for the cutting script (approved by Raymond; it is already installed as part of Astro, so nothing new is downloaded). GSAP is added with the animations change, where it's needed.
- **Cloudflare**: `PLAYGROUND=1` already exists for Preview only; nothing to change.
- **Docs**: `docs/kalman-layers.md` (new: the image guide, the rules and the prompts), `docs/architecture.md`, `docs/glossary.md` (rig, pivot, pose, transform matrix, z-order, turntable), `docs/making-of.md`, `src/scene/README.md` (2D instead of Three.js), the `package.json` description (no longer "low-poly"), and the Phase 1 line in the README.
