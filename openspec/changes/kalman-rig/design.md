# Design

## Context

See proposal.md for the why. On `main` today: a fallback-first site with an empty `aria-hidden` scene slot, a render-mode switch that still checks WebGL2, pure logic in `src/lib/`, an empty `src/scene/`, one 50 KB JavaScript budget over all of `dist/`, and e2e tests against the built site with the production headers applied (including a CSP that blocks inline scripts and styles). The paused branch `change/kalman-playground` has working, tested versions of the dev-only route flag, the production-build check and per-page budgets; those are carried over, the Three.js parts are not.

Constraints that shape this design:

- README §5.4: the rig is one config file; rig and pose maths are pure functions in `src/lib/`; the drawing code only applies what they compute.
- README §5.2: content stays in HTML, the fallback shows the same illustrations standing still, and reduced motion is respected.
- Raymond's final design exists as two front views made with Gemini (`docs/images/kalman-design/front-goofy.png` and `front-professional.png`, 687 × 1024 px, Kálmán about 918 px tall). The professional one is an edit of the goofy one, so the two line up pixel for pixel. More views (¾ front, side, ¾ back, back) arrive later in the same way.
- No new dependencies without Raymond's approval; GSAP is not needed until the animations change. `sharp` (already installed by Astro) is approved as a devDependency for the cutting script.

## Goals / Non-Goals

**Goals:**
- A rig format that takes Raymond's layers by editing data only, and a script that cuts those layers from his images, so better images later are one command away.
- Pose maths that are fully covered by unit tests, including the parent/child and pivot behaviour.
- A figure that is plain SVG in the HTML, so the fallback and no-JavaScript cases are the same code path as full mode.
- A production build that provably contains no preview code.

**Non-Goals:**
- Tweening between poses or any time-based motion (the animations change, with GSAP).
- Editing positions and pivots in the preview: they are tuned in the JSON when the real art arrives (see Open Questions).
- Remembering preview state across reloads: poses are short experiments, and "Copy pose" is how one is kept.
- Responsive image formats (AVIF/WebP, `srcset`): they matter on the public pages (Phase 2), not in a dev tool.
- A 3D model or true in-between angles: the turntable shows the drawn views only (Kálmán stays 2D, PLANNING_LOG).

## Decisions

### 1. Where the code lives

| File | Kind | What |
|---|---|---|
| `src/lib/kalman-rig.ts` | pure | Types (`Rig`, `RigLayer`, `Pose`, `Mood`), `validateRig()`, `validatePose()`, the 2D matrix helpers and `resolvePose()`, which turns a rig, a pose and a mood into one drawing instruction per layer. |
| `src/scene/kalman/rig.json` | data | The rig: artboard size and the nine layers. |
| `src/scene/kalman/poses.json` | data | The named poses: rest, bow, flippers up, head tilt left, head tilt right. |
| `src/scene/kalman/KalmanFigure.astro` | component | Renders the SVG at build time in a given pose (rest by default). |
| `src/scene/kalman/kalman-figure-client.ts` | browser | `applyPose()`, `applySpin()` and `applyTurn()`: write the transforms, visibility and opacity onto the existing SVG elements. |
| `src/assets/kalman/front/*.png` | images | The nine layers and the two front views, cut from the final design. Generated: never edited by hand. |
| `scripts/cut-kalman-layers.ts` | script | Reads the two front views, cuts the layers and the front views, writes them to `src/assets/kalman/front/` and writes `rig.json` and `turntable.json` (§5). Run with `npm run cut:kalman`. |
| `scripts/lib/kalman-cut.ts` | pure | The cutting logic on plain pixel arrays: background flood fill, soft edges, the difference mask for the accessories, the gap per row, the part masks with the neck fade, and turning pixel boxes into rig entries. |
| `src/lib/kalman-turntable.ts` | pure | `turntableFrame()` (which views show at an angle, how narrow, how faded), `viewMatrix()`, `normaliseAngle()` and the validation of `turntable.json`. |
| `src/scene/kalman/turntable.json` | data | The drawn views for turning around: name, angle and a placed image per mood. |
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

### 5. Cutting the layers from the design images

The script works on the two front views, both turned into plain pixel arrays by `sharp`; all decisions are pure functions in `scripts/lib/kalman-cut.ts`, so they are unit-tested on tiny made-up images.

1. **Background:** a flood fill from the image's edges through near-white pixels marks the background. The white belly stays, because it is enclosed by the darker edge of the body. Pixels next to the background get a soft alpha from how far they are from white, so the outline isn't jagged.
2. **The professional extras:** where the professional image differs from the goofy one, limited to the area of the glasses and of the tie. The glasses layer includes the calmer professional eyes behind them, so the goofy eyes are covered in the professional mood and come back in the goofy one. The script stops if the two images are not the same size.
3. **The parts:** head above the neck; body between two cut lines; flippers outside them; feet and tail below the body. Above row 553 the flippers merge with the body, so the cut follows the shoulder; below it Gemini drew a small gap, and the cut is that gap, found per row.
4. **The joints:**
   - Body and flippers meet exactly at the cut. Above the gap each flipper reaches 2 px under the body (it is drawn behind it), which hides the hairline seam that two exactly touching layers show; below the gap it stops at the gap, or it would take the body's outline along when it turns.
   - The head fades out over the top of the neck and the body fades in under it, so a tilt or a nod shows no hard edge. Above the shoulders the body covers the full width, so the neck sides are never only covered by the fading head.
5. **Placing:** 1.33 artboard units per image pixel, the figure's middle on x = 800 and his feet at y ≈ 1400, the same place as before. Each layer's box becomes its `size` and `position`, the joints on the image become the pivots.

The cut lines are tied to these two images. New images get their own numbers in the script's settings (one object at the top), checked with the pivot overlay.

### 5b. The image guide and prompts

`docs/kalman-layers.md` tells Raymond which images to make and how, for Gemini:

1. **The two front views:** the goofy front view (big round eyes, rest pose, flippers down with a small gap of background between flipper and body, plain white background, 2:3), then the professional one as an **edit** of it (add the tie, the glasses and the calmer eyes; change nothing else), so the two line up pixel for pixel.
2. **The turntable views:** ¾ front, side, ¾ back and back, each first goofy (made from the goofy front view as the reference, same height and place), then professional as an edit of that view. The other side is mirrored, so Raymond doesn't make it.
3. **The rules:** same image size, feet on the same ground line, no text, labels, logos or shadow.

It also explains what the script does with the images and how to run it.

*Alternative:* one image per layer (the earlier guide). Rejected: making nine separate parts that fit together is much more work than two whole views, and the difference trick gives the accessories for free.

### 5c. Spinning the whole figure

All layers (and the turntable views) sit in one `<g data-spin>` group. `spinMatrix()` turns it around `figureCentre()`, the middle of the box around all layers at rest, so he stays on the stage at every angle. Each layer's pose stays on top of the spin. It is a view setting: not part of a pose and not in "Copy pose". The SVG has `overflow: visible`, so raised flippers aren't cut off at the artboard's edge.

### 5d. Turning around: the turntable

- **Data:** `turntable.json`, a list of views with a name, an angle and a placed image per mood, validated on load (`turntableErrors()`). The front view is first; for now it is the only one.
- **Between two views** `turntableFrame()` works out the frame: the current view narrows (a sine hump, down to 65 % of its width halfway), and over a short band around halfway (12 % of the way) the next view fades in **on top**, with the outgoing view staying solid underneath, so the background never shows through two half-transparent drawings. The client moves the incoming view's group to the end of its parent, so it is drawn on top whatever the order in the HTML.
- **Mirrored views** for the other side: a view can be mirrored (`scaleX` −1 around the centre line), so four drawn views give eight angles.
- **Layers vs views:** facing front (exactly 0°) the posable layers show; at any other angle the views take over. Whole groups are hidden with `display`, not `visibility`, because a child with `visibility="visible"` (every layer has one) still shows inside a hidden SVG group. The pivot markers are hidden by CSS while he is turned.
- **The control:** a "Turn around" slider (0–359°) plus dragging sideways on the figure (pointer events, half a degree per pixel, `touch-action: pan-y` so vertical swipes still scroll). Left out of the page while there is only one view.

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
| Logic | Vitest | `kalman-cut.ts` (flood fill, soft edge, difference mask, gap per row, part masks and fades, rig entries) on tiny made-up images; `turntableFrame()`, `viewMatrix()`, mirroring and the turntable validation; `figureCentre()` and `spinMatrix()`; matrix helpers; `resolvePose()`: rest pose = rest positions, pivot stays put under rotation, glasses follow the head (through the chain), offsets, order sorting, accessories per mood; `validateRig()` and `validatePose()` for each failure in the specs; the repo's `rig.json`, every pose in `poses.json` and `turntable.json` validate, and every image they name exists; flag, budgets and production-check helpers. |
| Page | Playwright, all browsers | Preview present with the flag; `noindex`, `lang="en"`, no switcher or alternates; pose buttons set `aria-pressed` and change the layer transforms; sliders follow a pose and rotate a layer with the keyboard; mood switch shows and hides the accessories; pivot markers appear; Copy pose (clipboard in Chromium, visible text elsewhere); the spin slider; turning to a drawn view and back (skipped while there is only one view); the figure is present with JavaScript disabled; 360 px width without horizontal scroll; axe; no console errors. |
| Snapshots | Playwright `visual` project (Linux) | The figure in rest (goofy) and bow (professional), with the pivot overlay off, made again for the final design. |
| Production | CI step | `check-production-build.ts` on the build without the flag. |

Tests compare transforms through `resolvePose()` output exposed as `data-` attributes rather than parsing pixel positions.

### 10. CI order

`npm ci` → lint → typecheck → unit tests → **build (production)** → **check production build** → **build (playground)** → bundle size → Playwright → Lighthouse (public pages only). `npm run check` follows the same order locally. Same as the order agreed on the 3D branch.

## Risks / Trade-offs

- [New images need different cut lines] → the numbers live in one settings object at the top of the script; the pivot overlay and the flippers-up pose show mistakes straight away.
- [Rotated cut-out layers show gaps at the joints] → a known cut-out issue; the illustrations need a little overlap under the neighbouring layer at each joint. Written into the layer guide's rules (§5b), and visible in the preview.
- [AI-generated views don't match each other in style or scale, so the turn "jumps"] → every view is made from the goofy front view as the reference, with the same size and ground line; the script can scale and align a view that is a little off.
- [The images are smallish: Kálmán is about 918 px tall] → sharp enough for the preview and a phone-sized hero; if the public pages need more, Raymond makes larger images and the script runs again.
- [`sharp` is used directly] → it is the image library Astro already depends on, now declared as a devDependency at the same version, so Dependabot keeps it up to date.
- [Matrix maths is new for Raymond] → small named helpers (`translate`, `rotateAround`, `multiply`), a glossary entry, and the NumPy comparison in the comments.
- [Snapshots change whenever the images do] → expected; regenerate with the "Update visual baselines" workflow.
- [`import.meta.glob` over assets is less obvious than one `import` per file] → explained in a comment; it's what lets a JSON file name an image.

## Migration Plan

- No Cloudflare change: `PLAYGROUND=1` is already set for Preview only.
- New visual baselines via the "Update visual baselines" workflow.
- Rollback: revert the merge. Production never contained the preview; the only visitor-visible effect is that browsers without WebGL2 get full mode, which is reverted with it.

## Open Questions

- Whether position and pivot sliders are worth adding to the preview once the real art is in. If tuning in JSON proves slow, it is a small follow-up on top of the same controls.
