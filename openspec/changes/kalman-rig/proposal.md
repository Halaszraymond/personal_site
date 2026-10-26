# Proposal

## Why

Phase 1 has changed direction: Kálmán is now a 2D cut-out figure (README §2.1), not a 3D model, and the `kalman-playground` change will not be merged. The final layer illustrations don't exist yet, but everything that moves them can be built and tested now. Building the rig first means the art can drop in later as data, without code changes, and Raymond can judge poses before any animation work starts.

## What Changes

- **Kálmán's rig as data**: one config file says which layers Kálmán has (body, head, both flippers, both feet, tail, tie, glasses), which image each one uses, where it sits, where it pivots, which layer it hangs from, its drawing order and how far it may rotate.
- **Poses as data**: a small set of named still poses (rest, bow, flippers up, head tilted left and right) stored as rotations and offsets per layer, plus a "professional" switch that shows or hides the tie and glasses.
- **Pose maths as pure functions** in `src/lib/`: turning a rig and a pose into one position per layer, with child layers following their parent (glasses follow the head). Unit-tested without a browser.
- **Kálmán drawn as plain SVG at build time** in his rest pose, so he works without JavaScript and the later fallback stills come for free. A small client script only changes the transforms when the pose changes.
- **Placeholder layers**: simple flat shapes in the design sheet's colours (dark navy, cream, golden ear patch), one file per layer, so the rig can be seen and tested. Raymond's real illustrations replace them file by file later.
- **A layer guide with ready-made prompts**: the list of illustrations Raymond needs to make (one per layer, front view), with a prompt for each one for his AI image generator, and the rules each image must follow to fit the rig (size, transparent background, overlap at the joints). He can start on the art while the rig is built.
- **A dev-only animation preview at `/playground/`**: Kálmán with a button per pose, the professional switch, a slider per layer rotation to try new poses, a "show pivots" overlay, and "Copy pose" to turn a tried pose into JSON for the repo. English only, never on production, as already agreed for the dev-only playground.
- **The dev-only plumbing from the 3D branch, carried over**: the `PLAYGROUND` build flag, the production-build check, and bundle budgets measured per page.
- **BREAKING (internal)**: the WebGL2 check is removed from the render-mode switch. With a 2D site it no longer decides anything (README §7, Phase 1).
- Out of scope, each in a later change: the animations (idle, dive, swim, bow, head-follow, launch) with GSAP, Kálmán on the public pages (Phase 2 hero), the frame-time check (README §5.2 step 3), the side-view layers for swimming (with the animations), and putting the real illustrations into the rig (once Raymond has made them).

## Capabilities

### New Capabilities
- `kalman-rig`: Kálmán as a cut-out figure: the rig config, named poses, the professional accessories, and how a pose becomes the drawn figure.
- `kalman-preview`: the dev-only page where Raymond views and tries Kálmán's poses, and how it is kept off production.

### Modified Capabilities
- `render-fallback`: the WebGL2 requirement is removed; full mode depends only on reduced motion and Save-Data, and the spec no longer speaks of a 3D experience.
- `i18n-routing`: hreflang alternates and the language switcher apply to public, indexable pages only, so the dev-only preview is exempt.

## Impact

- **New code**: `src/lib/kalman-rig.ts` (types, validation, pose maths), `src/scene/kalman/` (rig and pose JSON, the SVG figure component, the client script), `src/assets/kalman/placeholder/` (placeholder SVGs), `src/playground/` (the preview page), `src/lib/playground-flag.ts`, `scripts/check-production-build.ts` and its `scripts/lib/` helper.
- **Changed code**: `src/lib/render-mode.ts`, `src/components/RenderModeSwitch.astro`, `src/components/BaseLayout.astro` (optional language switcher), `astro.config.ts` (the dev-only route), `scripts/check-bundle-size.ts` and `scripts/lib/budgets.ts` (per page), the CI workflow and `package.json` scripts (second build with the flag).
- **Tests**: new unit tests for the rig, poses, flag, budgets and production check; new Playwright tests and two pose snapshots for the preview; the WebGL stubs in `tests/e2e/render-mode.spec.ts` go away.
- **Dependencies**: none. GSAP is added with the animations change, where it's needed.
- **Cloudflare**: `PLAYGROUND=1` already exists for Preview only; nothing to change.
- **Docs**: `docs/kalman-layers.md` (new: the layer list, the rules and the prompts), `docs/architecture.md`, `docs/glossary.md` (rig, pivot, pose, transform matrix, z-order), `docs/making-of.md`, `src/scene/README.md` (2D instead of Three.js), the `package.json` description (no longer "low-poly"), and the Phase 1 line in the README.
