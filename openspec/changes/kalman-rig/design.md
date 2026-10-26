# Design

## Context

See proposal.md for the why. On `main` today: a fallback-first site with an empty `aria-hidden` scene slot, a render-mode switch that still checks WebGL2, pure logic in `src/lib/`, an empty `src/scene/`, one 50 KB JavaScript budget over all of `dist/`, and e2e tests against the built site with the production headers applied (including a CSP that blocks inline scripts and styles). The paused branch `change/kalman-playground` has working, tested versions of the dev-only route flag, the production-build check and per-page budgets; those are carried over, the Three.js parts are not.

Constraints that shape this design:

- README §5.4: the rig is one config file; rig and pose maths are pure functions in `src/lib/`; the drawing code only applies what they compute.
- README §5.2: content stays in HTML, the fallback shows the same illustrations standing still, and reduced motion is respected.
- The real layer illustrations don't exist yet and will be raster images (PNG with transparency, later AVIF/WebP).
- No new dependencies without Raymond's approval; GSAP is not needed until the animations change.

## Goals / Non-Goals

**Goals:**
- A rig format that takes Raymond's real layers later by editing data only.
- Pose maths that are fully covered by unit tests, including the parent/child and pivot behaviour.
- A figure that is plain SVG in the HTML, so the fallback and no-JavaScript cases are the same code path as full mode.
- A production build that provably contains no preview code.

**Non-Goals:**
- Tweening between poses or any time-based motion (the animations change, with GSAP).
- Editing positions and pivots in the preview: they are tuned in the JSON when the real art arrives (see Open Questions).
- Remembering preview state across reloads: poses are short experiments, and "Copy pose" is how one is kept.
- Responsive image formats (AVIF/WebP, `srcset`): they matter for the real art on public pages, not for placeholders in a dev tool.

## Decisions

### 1. Where the code lives

| File | Kind | What |
|---|---|---|
| `src/lib/kalman-rig.ts` | pure | Types (`Rig`, `RigLayer`, `Pose`, `Mood`), `validateRig()`, `validatePose()`, the 2D matrix helpers and `resolvePose()`, which turns a rig, a pose and a mood into one drawing instruction per layer. |
| `src/scene/kalman/rig.json` | data | The rig: artboard size and the nine layers. |
| `src/scene/kalman/poses.json` | data | The named poses: rest, bow, flippers up, head tilt left, head tilt right. |
| `src/scene/kalman/KalmanFigure.astro` | component | Renders the SVG at build time in a given pose (rest by default). |
| `src/scene/kalman/kalman-figure-client.ts` | browser | `applyPose()`: writes the transforms and visibility from `resolvePose()` onto the existing SVG elements. |
| `src/assets/kalman/placeholder/*.svg` | images | One flat placeholder shape per layer. |
| `src/playground/` | page | `PreviewPage.astro`, `PreviewControls.astro` and `preview-client.ts`. |
| `src/lib/playground-flag.ts` | pure | `shouldIncludePlayground()`, carried over unchanged. |
| `scripts/lib/production-check.ts` | pure | Carried over, with the Three.js marker replaced by the preview's marker (see §6). |

The rig and poses are JSON, not TypeScript, so "Copy pose" output can be pasted in unchanged and a bad paste fails a unit test.

### 2. The rig format

One coordinate system for everything: the **artboard**, e.g. 1000 × 1400 units, origin top left, y pointing down, rotations in degrees clockwise. That's SVG's own convention, so no conversion layer.

Each layer:

```json
{
  "name": "head",
  "image": "placeholder/head.svg",
  "size": [420, 380],
  "position": [290, 120],
  "pivot": [210, 340],
  "parent": "body",
  "order": 60,
  "rotate": [-25, 25]
}
```

- `position` is where the image's top-left corner sits on the artboard **at rest**. Absolute artboard coordinates, not relative to the parent, because that's how Raymond will read them off the design sheet: "the head image starts here".
- `pivot` is in the layer's own image coordinates (the neck, for the head), so it stays right when the layer moves.
- `order` is the drawing order (higher = in front). Gaps of 10 leave room for new layers.
- `rotate` is the allowed range, used by validation and as the slider limits.
- The tie and glasses are marked `"accessory": true`.

*Alternative:* positions relative to the parent. More "correct" for a scene graph, but every number would depend on another layer's numbers, which makes tuning by hand much harder.

### 3. Pose maths: one matrix per layer

A pose gives per layer `{ "rotate": deg, "offset": [dx, dy] }`, both optional and relative to rest. `resolvePose()` computes, for each layer, a 2D affine matrix (the six numbers SVG's `matrix(a b c d e f)` takes):

1. **Local**: move to the rest position plus offset, then rotate around the pivot (translate to pivot, rotate, translate back).
2. **World**: the parent's *movement* (its world matrix relative to its own rest) applied to the local result. Because rest positions are absolute, a child is moved by "how far its parent moved from rest", not by the parent's full matrix.
3. Walk the layers parents-first (a topological order), so each parent's world matrix exists before its children need it.

It returns a list sorted by `order`: `{ name, matrix, visible, pivotOnArtboard }`. `visible` is false for accessories in the goofy mood; `pivotOnArtboard` feeds the pivot overlay and the tests.

In comments this gets the Python comparison it needs: the matrix is a 3 × 3 NumPy-style affine matrix with the last row `[0, 0, 1]` left out, and composing is `A @ B`.

*Alternative:* nested SVG `<g>` elements, one per parent, so the browser composes the transforms. Much less code, but in SVG a child is always drawn after (in front of) its parent, so the far flipper could never sit behind the body. That breaks the spec "Drawing order is independent of the hierarchy". A flat, sorted list with computed matrices avoids that and makes the maths testable.

### 4. Drawing: SVG built at build time

`KalmanFigure.astro` outputs one `<svg viewBox="0 0 1000 1400">` with one `<g data-layer="head" transform="matrix(…)">` per layer in drawing order, each containing an `<image href width height>`. The page HTML therefore already contains Kálmán in his rest pose: no JavaScript needed (spec "The figure is drawn without JavaScript"), and the fallback stills later are just this component with a different pose.

The client only calls `resolvePose()` and sets `transform` and `visibility` attributes on existing elements. Those are SVG attributes, not inline styles, so the CSP stays as it is.

Images go through Astro's asset pipeline (`import` of the file), so they get hashed file names and a missing file fails the build. The rig's `image` field is resolved with `import.meta.glob` over `src/assets/kalman/`; validation also checks the name exists in that glob, so a typo fails a unit test instead of only the build.

*Alternatives:* `<img>` elements with CSS transforms (needs inline styles or many classes under our CSP, and CSS transforms on HTML elements don't share one coordinate system as easily); canvas 2D (the figure would not be in the HTML, and hit areas and accessibility get harder).

### 5. Placeholders

Each placeholder is a small hand-written SVG: a flat shape in the design sheet's colours (navy back and head, cream belly, golden ear patch, grey feet, dark-red tie, silver glasses ring), with a thin dashed outline so it's obviously not final. They are sized to the rig's `size` and drawn so the rest pose roughly matches the design sheet's front view. The pivots go where the real joints will be (shoulder, neck, ankle, tail base), so the poses already look about right.

### 5b. The layer guide and prompts

`docs/kalman-layers.md` is written right after `rig.json`, so it can quote the rig's real numbers. It has three parts:

1. **The list**: one row per layer with its file name, its size on the artboard, where its pivot is ("the shoulder, top centre"), and which neighbouring layer it tucks under.
2. **The rules for every image**, so the parts fit together:
   - front view, rest pose, the same angle and lighting as the front view on the design sheet;
   - one part per image, nothing else in it, no cast shadow;
   - a plain flat background in one colour that isn't in Kálmán (bright green), because most AI image generators can't make real transparency; the background is removed afterwards, and the guide says how;
   - extra material where a part joins another (the top of a flipper, the bottom of the neck), hidden under the neighbouring layer, so no gap shows when it rotates;
   - the aspect ratio of the rig's `size`, exported as PNG at twice the artboard size.
3. **One prompt per layer**, ready to paste: a shared style block (taken from the design sheet: soft painted style, dark navy and cream, golden ear crescent, the colours and line weight) plus the part-specific text. The guide says to give the design sheet as a reference image with every prompt, which is what keeps the parts consistent.

Front view only in this change: the poses here are front-view poses. The side-view set for diving and swimming is added to the guide with the animations change, when it's clear which poses need it.

*Alternative:* asking the generator for the whole figure and cutting it up by hand. Possible, but parts hidden behind others (the far flipper, the top of the feet) would be missing, so it only works as a fallback; the guide mentions it.

### 6. The preview page and keeping it off production

Carried over from the 3D branch, adapted:

- An Astro integration in `astro.config.ts` adds the route `/playground/` → `src/playground/PreviewPage.astro` only when `shouldIncludePlayground({ command, flag })` says so: always in `astro dev`, in a build only with `PLAYGROUND=1`.
- `npm run build:playground` uses `node --env-file=.env.playground`, so the flag works on Windows without `cross-env`.
- `scripts/check-production-build.ts` fails when `dist/playground/` exists or any `.js` file contains the marker string `kalman-preview`, which the preview script uses as its root selector (`[data-kalman-preview]`). A string literal survives minifying; a function name might not.

Note that `KalmanFigure.astro` and `src/lib/kalman-rig.ts` are not preview code: they will be used by the public hero in Phase 2, so the check deliberately does not look for them.

The page uses `BaseLayout` with a new `showLanguageSwitcher={false}` prop and no `canonicalPath` (which already means `noindex` and no alternates). Layout: figure on top on phones, figure left and controls right from ~900 px.

Controls are plain HTML, rendered at build time from `rig.json` and `poses.json`:

- pose buttons with `aria-pressed`;
- a `role="switch"` checkbox for the professional mood and one for "Show pivots";
- one `<input type="range">` with an `<output>` per layer, `min`/`max` from `rotate`, step 1°;
- "Copy pose" with `navigator.clipboard.writeText()`, a read-only `<textarea>` with the same JSON, and a `role="status"` line for "Copied" or "Clipboard not available, copy the text below".

The figure gets `role="img"` and an `aria-label` like "Kálmán, pose: bow, mood: professional" in the preview. On public pages (Phase 2) it will be decorative.

### 7. Removing the WebGL2 check

`RenderSignals` loses `hasWebGL2`, `chooseRenderMode()` keeps the reduced-motion and Save-Data steps, and `detectWebGL2()` is deleted from `RenderModeSwitch.astro`. The e2e tests lose the `getContext` stub; the "capable browser" test now only sets reduced motion and Save-Data. Header comments that mention 3D are updated to say "animated scene".

### 8. Budgets per page

`scripts/check-bundle-size.ts` and `scripts/lib/budgets.ts` come over from the branch: the JavaScript each page loads, following the chunks' imports, gzipped, per page. Every page, the preview included, gets the 50 KB base budget for now; the preview is expected to be a few KB. GSAP's budget is decided in the animations change, when it is measured.

### 9. Testing

| Layer | Where | What |
|---|---|---|
| Logic | Vitest | Matrix helpers; `resolvePose()`: rest pose = rest positions, pivot stays put under rotation, glasses follow the head (through the chain), offsets, order sorting, accessories per mood; `validateRig()` and `validatePose()` for each failure in the specs; the repo's `rig.json` and every pose in `poses.json` validate; flag, budgets and production-check helpers. |
| Page | Playwright, all browsers | Preview present with the flag; `noindex`, `lang="en"`, no switcher or alternates; pose buttons set `aria-pressed` and change the layer transforms; sliders follow a pose and rotate a layer with the keyboard; mood switch shows and hides the accessories; pivot markers appear; Copy pose (clipboard in Chromium, visible text elsewhere); the figure is present with JavaScript disabled; 360 px width without horizontal scroll; axe; no console errors. |
| Snapshots | Playwright `visual` project (Linux) | The figure in rest (goofy) and bow (professional), with the pivot overlay off. These baselines will change when the real art arrives, which is intended. |
| Production | CI step | `check-production-build.ts` on the build without the flag. |

Tests compare transforms through `resolvePose()` output exposed as `data-` attributes rather than parsing pixel positions.

### 10. CI order

`npm ci` → lint → typecheck → unit tests → **build (production)** → **check production build** → **build (playground)** → bundle size → Playwright → Lighthouse (public pages only). `npm run check` follows the same order locally. Same as the order agreed on the 3D branch.

## Risks / Trade-offs

- [The real layers don't fit the rig's sizes or joints] → that's the point of the rig being data: sizes, positions and pivots change in `rig.json`; the pivot overlay shows mismatches. Positions are absolute artboard coordinates so they can be read straight off the design sheet.
- [Rotated cut-out layers show gaps at the joints] → a known cut-out issue; the illustrations need a little overlap under the neighbouring layer at each joint. Written into the layer guide's rules (§5b), and visible in the preview.
- [AI-generated parts don't match each other in style or scale] → the shared style block and the design sheet as a reference image in every prompt; the rig's `size` and `position` absorb small scale differences.
- [Matrix maths is new for Raymond] → small named helpers (`translate`, `rotateAround`, `multiply`), a glossary entry, and the NumPy comparison in the comments.
- [Placeholder snapshots churn when the art arrives] → expected; regenerate with the "Update visual baselines" workflow.
- [`import.meta.glob` over assets is less obvious than one `import` per file] → explained in a comment; it's what lets a JSON file name an image.

## Migration Plan

- No Cloudflare change: `PLAYGROUND=1` is already set for Preview only.
- New visual baselines via the "Update visual baselines" workflow.
- Rollback: revert the merge. Production never contained the preview; the only visitor-visible effect is that browsers without WebGL2 get full mode, which is reverted with it.

## Open Questions

- Whether the generator keeps the parts consistent enough with the prompts alone. Answered when Raymond tries the first two or three parts; if not, the guide's fallback (cutting up a whole figure) applies, and the rig doesn't change either way.
- Whether position and pivot sliders are worth adding to the preview once the real art is in. If tuning in JSON proves slow, it is a small follow-up on top of the same controls.
