# Design

## Context

See proposal.md for the why. Phase 0 left a fallback-first site with an empty `aria-hidden` scene slot, pure logic in `src/lib/`, an empty `src/scene/`, a 50 KB gzipped JavaScript budget measured over all of `dist/`, and e2e tests against the built site with the production headers applied. Constraints that shape this design:

- README §5.4: Kálmán is config-driven; behaviour and shape logic live as pure functions in `src/lib/`, Three.js only draws; 3D is tested in layers (logic, smoke test with `renderer.info` budgets, a few 3D snapshots).
- CLAUDE.md: Kálmán must not resemble existing penguin characters or mascots; Raymond chooses the look.
- The playground must never reach production while it is dev-only, but must work on Cloudflare branch previews and in CI.
- Headless browsers in CI only have software WebGL (SwiftShader), and WebKit and Firefox headless may have none.

## Goals / Non-Goals

**Goals:**
- One table of parameter definitions that drives validation, sliders, defaults and the JSON format.
- A Kálmán that reads as a stylised emperor penguin at the default config, and keeps the emperor's features at every valid config.
- A production build that is byte-for-byte free of Three.js and the playground, proven in CI.
- 3D that is tested for real in CI (Chromium with SwiftShader), not only stubbed.

**Non-Goals:**
- Animations beyond the flipper stroke of the swim preview, and any scene or 3D on public pages.
- Choosing the final look: the defaults here are a starting proposal for Raymond to change.
- Translating the playground (it is English-only while dev-only, PLANNING_LOG).

## Decisions

### 1. Where the code lives

| File | Kind | What |
|---|---|---|
| `src/lib/kalman-config.ts` | pure | The parameter table (`KALMAN_PARAMETERS`), the `KalmanConfig` type derived from it, `validateConfig()`, `exportConfig()` / `importConfig()` (versioned JSON). |
| `src/lib/kalman-shape.ts` | pure | The numbers behind the shape: the body silhouette as 2D profile points, the ear-patch blend weight for a point on the head, the bill-stripe colour along the bill, and the flipper angle at time *t* for the swim preview. |
| `src/scene/kalman/kalman.config.json` | data | Kálmán's chosen config, exactly the JSON the playground's "Copy config" produces. |
| `src/scene/kalman/build-kalman.ts` | Three.js | Turns a config into a `THREE.Group`, using `kalman-shape.ts` for every number. No renderer, so it runs in Vitest under Node. |
| `src/scene/kalman/kalman-view.ts` | Three.js + browser | Renderer, camera, lights, `OrbitControls`, draw-on-demand loop, resize and visibility handling. |
| `src/scene/webgl.ts` | browser | `detectWebGL2()`, moved out of `RenderModeSwitch.astro` so the playground shares it. |
| `src/playground/` | page | `PlaygroundPage.astro` (the page, injected as a route), `Controls.astro` (renders one control per parameter from the table, at build time), and the client script that connects controls, storage and the view. |
| `src/i18n/playground.ts` | strings | The English labels, typed so the NL/HU translations later are just more entries. |

The JSON file is the config, not a TypeScript file, so Raymond's "Copy config" output can be pasted in unchanged. A unit test validates it, so a bad paste fails CI.

*Alternative:* the config as a `.ts` object. Nicer to read, but every paste would need hand-editing into TypeScript.

### 2. One parameter table drives everything

`KALMAN_PARAMETERS` is a list of definitions like `{ key: 'headSize', group: 'head', label: 'Head size', kind: 'range', min: 0.8, max: 1.3, step: 0.01, default: 1 }`, plus `kind: 'switch'` for on/off and `kind: 'colour'` for the tie colour. TypeScript derives the `KalmanConfig` type from the table (like generating a dataclass from a schema in Python), so adding a parameter is one line and the type, validation and controls follow.

Starting set (all ranges keep the emperor's features, spec "The emperor's features survive every valid config"):

| Group | Parameters |
|---|---|
| Body | height, girth, belly roundness |
| Head | head size |
| Bill | length, thickness, droop |
| Ear patch | hue (limited to golden-orange, 30–50°), intensity (minimum above zero), spread towards the chest |
| Facets | faceting level (0–3) |
| Flippers & feet | flipper length |
| Swim preview | stroke amplitude, stroke speed |
| Tie | on/off, colour, size |
| Glasses | on/off, size |

Colours of the body itself (black, white, the bill stripe) are fixed, not parameters: they are what makes him an emperor penguin.

### 3. How Kálmán is built

- **Body and head are one lathe**: a 2D silhouette (from `kalman-shape.ts`, shaped by height, girth, head size and belly) is spun around the vertical axis with few segments, which gives the faceted low-poly look. The front is pushed out for the belly. One mesh means no seam at the neck.
- **Colours are per vertex**, not textures: black where the back and head are, white on the belly, and the golden-orange patch blended in by `earPatchWeight()`, fading towards the chest by the spread parameter. One material with `vertexColors` and `flatShading`.
- **Bill**: a slender, slightly drooping cone with the orange-to-pink stripe along the lower mandible as vertex colours.
- **Flippers and feet**: flattened, tapered low-poly shapes; the flippers pivot at the shoulder for the swim preview.
- **Eyes**: small and dark, with no white or highlight. That avoids the big cartoon eyes most penguin mascots have.
- **Tie and glasses**: simple low-poly shapes (two flattened prisms; two rings and a bridge), added only when switched on.
- **Faceting level** maps to segment counts (e.g. 0 → 7 radial segments, 3 → 16). The budget test builds the worst case.

**Originality, by design:** realistic emperor proportions (tall, slender, a long thin bill), no big eyes, no smile, no yellow bill and feet (Tux), no round egg body with a short beak (Pingu, Pororo), no exaggerated features (Madagascar, Happy Feet). The final check is Raymond's eye, as a task.

*Alternative:* sculpting from separate spheres for head and body. Simpler, but gives the "snowman" look of many mascots and a visible seam.

### 4. Drawing on demand

`kalman-view.ts` draws a frame only when asked: a control change, an `OrbitControls` change, or the swim preview playing. Each request schedules one `requestAnimationFrame`; the swim preview keeps requesting frames while it plays. `visibilitychange` stops the loop while the tab is hidden. The pixel ratio is capped at 2.

For the tests, the canvas element carries `data-frames`, `data-triangles` and `data-draw-calls`, updated from `renderer.info` after each frame. Playwright reads these instead of guessing from pixels.

### 5. Keeping the playground off production

A small Astro integration in `astro.config.ts` calls `injectRoute('/playground', 'src/playground/PlaygroundPage.astro')` only when `shouldIncludePlayground({ command, flag })` (pure, unit-tested) says so: always in `astro dev`, and in a build only with `PLAYGROUND=1`. Without the route, nothing imports Three.js, so it never enters the production bundle.

- **Locally:** `npm run dev` includes it. `npm run build:playground` runs `node --env-file=.env.playground …astro build`; `.env.playground` holds only `PLAYGROUND=1`. Node's own `--env-file` sets the flag on Windows too, without a `cross-env` package.
- **Cloudflare:** `PLAYGROUND=1` as a **Preview-only** environment variable. Production gets nothing.
- **Proof in CI:** `scripts/check-production-build.ts` runs on the production build and fails if `dist/playground/` exists or any JavaScript file contains the Three.js revision marker. The search logic is pure and unit-tested.

*Alternatives:* a page that hides itself at runtime (Three.js would still ship); a separate Astro project (overkill for one page).

### 6. Budgets per page

`scripts/check-bundle-size.ts` changes from "all JS in `dist/`" to "the JS each page loads": it reads each built HTML page's `<script src>`, follows the chunks' `import` statements, and sums the gzipped sizes per page. Pure functions in `scripts/lib/budgets.ts` (`scriptsInHtml()`, `reachableChunks()`) get unit tests.

| Pages | Budget (gzipped) |
|---|---|
| Public pages (`/`, `/nl/`, `/hu/`, `/en/`, 404) | 50 KB each (README §5.4) |
| `/playground/` | 200 KB, mostly Three.js |

The 200 KB is a starting value. The real number is measured in the first build, and the budget is set just above it and logged.

### 7. Controls are HTML, built from the table

`Controls.astro` renders, at build time, one labelled `<input type="range">` with an `<output>` per range parameter, an `<input type="checkbox" role="switch">` per switch, and an `<input type="color">` for the tie colour, grouped in `<fieldset>`s with a `<legend>` per body part. All of it is plain HTML: keyboard support, labels and screen-reader output come from the browser. The client script reads the controls into a `KalmanConfig`, validates, rebuilds the affected model, and requests a frame.

**Without WebGL2** the view area shows the explanation instead of a canvas. The controls, Reset and Copy config keep working, so the JSON can still be edited and exported.

**Storage:** `localStorage` key `kalman.playground.v1`, read through `importConfig()` inside `try/catch`. Invalid or unreadable values fall back to the repo config without an error, like the language choice in Phase 0.

**Copy config:** `navigator.clipboard.writeText()`. If refused, a status message says so; the JSON is always shown in a read-only `<textarea>`.

### 8. Layout

The playground uses `BaseLayout` with two new props: `showLanguageSwitcher={false}` and no `canonicalPath`, which already means `noindex` and no hreflang alternates. The render-mode switch stays in the layout but doesn't apply here: reduced motion only pauses the swim preview, it doesn't hide Kálmán.

### 9. Testing 3D

| Layer | Where | What |
|---|---|---|
| Logic | Vitest | Parameter table, validation, JSON round trip, `kalman-shape.ts` (silhouette, patch weights, stripe, stroke), `shouldIncludePlayground`, budget graph, production-leak check. |
| Model | Vitest (Node, no renderer) | `buildKalman()`: same config → same geometry; extremes keep the features (vertex colours sampled at back, belly, patch and bill); worst case ≤ 8,000 triangles and ≤ 20 meshes; tie and glasses present only when on. |
| Smoke | Playwright, Chromium with SwiftShader | The canvas draws; `data-triangles` and `data-draw-calls` stay within budget; moving a slider increases `data-frames`; idle adds no frames; a hidden tab stops the swim loop; no console errors. |
| Functional | Playwright, all 4 browsers | Controls present per parameter, keyboard, Reset, Copy config (clipboard in Chromium, visible-text fallback elsewhere), reload keeps values, no-WebGL2 message (stubbed). |
| 3D snapshot | Playwright `visual` project (Linux only) | The default Kálmán from the front, swim preview paused, with a small tolerance (`maxDiffPixelRatio`). |
| Production | CI step | `check-production-build.ts` on the build without the flag. |

Chromium gets `--use-angle=swiftshader --enable-unsafe-swiftshader` for the 3D tests, because recent Chrome no longer falls back to software WebGL by itself.

### 10. CI order

`npm ci` → lint → typecheck → unit tests → **build (production)** → **check production build** → **build (playground)** → bundle size (both budgets) → Playwright → Lighthouse (public pages; the playground isn't in its list). `npm run check` follows the same order locally.

## Risks / Trade-offs

- [SwiftShader in CI renders slowly or differently than a GPU] → only a few 3D tests, with budgets read from `renderer.info` instead of pixels; the 3D snapshot has a tolerance and is Linux-only.
- [A lathe-based penguin looks too simple or too "vase-like"] → the silhouette has enough control points for shoulders, a neck dip and a belly; Raymond judges it in the playground, and the shape functions can grow without touching the playground.
- [Kálmán ends up resembling an existing mascot] → design rules above, plus an explicit review task with Raymond before the config is final.
- [Three.js is larger than the 200 KB starting budget] → measure in the first build, set the budget just above it, and log it; it never affects the public pages' 50 KB.
- [The flag is forgotten on Cloudflare previews] → the playground simply 404s on the preview; nothing leaks. The setup steps are documented in `docs/architecture.md`.
- [The playground diverges from the future animated Kálmán] → both use `buildKalman()` and the same config file; the animations change will only add motion on top.

## Migration Plan

- Raymond adds `PLAYGROUND=1` to the Cloudflare Pages project, **Preview** environment only.
- New visual baselines (the 3D snapshot) via the "Update visual baselines" workflow.
- Rollback: revert the merge; production never contained the playground, so nothing to clean up there.
