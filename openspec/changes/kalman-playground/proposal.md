# Proposal

## Why

Kálmán is the heart of the site, and his look is a choice Raymond has to make by eye, not on paper (README §2.1, CLAUDE.md: "we build the emperor together"). So Phase 1 starts with a playground: Kálmán drawn live from a config, with sliders for every part of his shape, until it feels right. The chosen values become the one config file the rest of the site (animations, the dive, the fallback stills) builds on, which is why this comes before everything else in Phase 1.

## What Changes

- **Three.js arrives**, with Kálmán as a **stylised low-poly 3D emperor penguin built entirely in code** (no purchased model): body, head, bill with the orange/pink stripe, the golden-orange ear patches fading towards the chest, flippers and feet, with visible facets (flat shading). Plus the two accessories of his professional side: a **tie** and **reading glasses**, switchable.
- **Kálmán is config-driven**: every shape and colour value lives in one validated config (`src/scene/kalman/config.ts`). One table of parameters (name, range, step, default) drives both the validation and the sliders, so they can never disagree.
- **The playground** at `/playground/`: Kálmán in a 3D view (drag to turn him), a slider per parameter grouped by body part, switches for the tie and glasses, a simple **swim preview** (flipper strokes), **Reset**, and **Copy config** (JSON). Values survive a reload in the browser. Slider changes redraw instantly.
- **Dev-only, as agreed**: the playground is built locally (`npm run dev`), in CI and on Cloudflare **branch previews** (a `PLAYGROUND` flag), and **never on production**. CI proves the production build has no playground and no Three.js.
- **English interface** for the playground while it is dev-only (a recorded exception to the three-languages rule); the texts already go through `src/i18n/`, so the public version later only needs translations.
- **Performance budgets get a second line**: the bundle check measures the JavaScript per page, so the public pages keep their 50 KB base budget and the playground gets its own budget for Three.js.
- **3D testing starts**: the shape logic is unit-tested without a browser, and Playwright checks that the canvas really draws, stays within triangle and draw-call budgets, and matches a 3D snapshot of the default Kálmán.
- **Two spec clarifications** in `i18n-routing` that this change brings to light: hreflang alternates are for indexable language pages only (the 404 already has none), and the language switcher is required on public pages, not on dev tools.

### New dependencies (for Raymond's approval)

| Package | Why |
|---|---|
| `three` | The 3D library from README §5.1: renderer, geometry, materials, lights. Also provides `OrbitControls` (drag to turn Kálmán) from its own `examples` folder, so no extra package for that. |
| `@types/three` | TypeScript descriptions for Three.js (Three.js itself ships plain JavaScript). Types only, no code. |

No slider library: the sliders are plain HTML `<input type="range">` with labels, which are accessible and keyboard-friendly by default.

### Not in this change

- The animations (idle, dive, swim, chase, bow, head-follow, launch) and the fallback stills: the next change, once Kálmán's shape is chosen.
- Kálmán on the public pages: the dive comes in Phase 2.
- The frame-time check and the lite-mode switch (render-fallback step 3): with the first 3D on a public page.
- Translations of the playground and the public `/playground/` route: with the "this website" case study.
- Choosing the final values: that is Raymond's job *with* the playground; the default config in this change is a starting proposal.

## Capabilities

### New Capabilities

- `kalman-config`: Kálmán's shape and colour parameters, their allowed ranges and defaults, how a config is validated, and the JSON format that moves between the playground and the repo.
- `kalman-playground`: where the playground is available, what it lets you change, how it shows Kálmán, how values are kept and exported, and how it behaves without WebGL2 or with reduced motion.

### Modified Capabilities

- `i18n-routing`: "Language alternates for search engines" applies to indexable language pages (not the 404 or dev tools); "Language switcher on every page" applies to public pages.

## Impact

- **New code:** `src/scene/kalman/` (model built from config), `src/lib/` (pure shape and validation logic), the playground page and its components, `tests/` for all of it.
- **Build:** a small Astro integration in `astro.config.ts` adds `/playground/` only when `PLAYGROUND=1` or in `astro dev`; a `build:playground` script. The bundle-size script learns per-page budgets.
- **CI:** builds production first (checks: no playground, no Three.js, base budget), then the playground build for the e2e tests and 3D checks.
- **Cloudflare:** one environment variable, `PLAYGROUND=1`, for **Preview** only (Raymond sets it in the dashboard).
- **Docs:** architecture (scene, playground, budgets), glossary (3D terms), making-of.
