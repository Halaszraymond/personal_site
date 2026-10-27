# Proposal

## Why

Phase 1 made Kálmán; the public site is still one test sentence per language. Phase 2 (README §7) turns the page into the dive: scrolling is diving, from the ice down to 564 m and back up to the contact on the ice. Everything else in Phase 2 (the hero board, the fish school, fish turning into charts, the dive profile) builds on this foundation, so it comes first. Raymond chose this slice from the split of Phase 2.

## What Changes

- **The sections of the dive** in plain HTML, in NL, HU and EN with placeholder text: the ice (hero), Who I am, Work, Education, The catch, and Contact (the ascent), at the depths of README §2.3.
- **Scroll becomes depth:** a pure mapping from scroll position to depth, 0 m at the top, 564 m at the bottom of The catch, then counting back to 0 m during the ascent to Contact.
- **The depth gauge:** a fixed gauge at the side that follows the depth and is also the navigation (**express dive**): each section is a link; choosing one takes the visitor there quickly, with Kálmán diving at speed in full mode.
- **The water follows the depth:** the background goes from ice blue through deep-sea blue to ink black and back to the light at the ascent, with all text at WCAG AA contrast at every depth.
- **Kálmán dives along** in full mode: standing (idle) on the ice, diving at the first scroll, swimming during the dive, and launching out of the water onto the ice during the ascent, with his belly landing.
- **The static fallback** (reduced motion, Save-Data, no JavaScript): the same sections and gauge links, the water as a colour per section, and Kálmán as a still in a fitting pose per section, drawn from the front figure.
- **Lighter images:** Kálmán's layer images are served as WebP at the size they are shown; the turntable views stay in the dev preview only, and the side and swimming figures load after the first paint.
- Fonts stay a system font stack: the font choice (README §8) is a separate step with its own playground.

## Capabilities

### New Capabilities

- `dive`: the dive page: its sections and their depths, the mapping from scroll to depth, the depth gauge and express dive, the water colour by depth, Kálmán following the dive, and the still version of all of it.

### Modified Capabilities

- `render-fallback`: full mode now shows the dive scene instead of an empty scene slot.
- `kalman-rig`: the figure can be drawn without the turntable views and drawn poses it doesn't use, and its images are served as WebP at display size.

## Impact

- **Code:** new `src/lib/dive.ts` (depth mapping, sections, colours, which animation plays where), `src/components/DivePage.astro` replacing the Phase 0 content of `HomePage.astro`, a depth gauge component, a dive client script that drives the scroll, the gauge and the player; `KalmanFigure.astro` (optional turntable and drawn poses, WebP via Astro's image pipeline); `RenderModeSwitch.astro` (the scene instead of the empty slot); `src/i18n/ui.ts` (section texts in three languages).
- **Tests:** unit tests for the depth mapping, the colours (contrast) and the choice of animation; e2e tests for the sections, the gauge, express dive, both modes, three languages and 360 px; new visual baselines for the dive in both modes; Lighthouse on the real home pages.
- **Budget:** the home pages load GSAP and the player (now only the preview does): about 38 KB of the 50 KB budget, after the first paint.
- **Docs:** README §7 (Phase 2 progress), `docs/architecture.md` (the dive), `docs/glossary.md`, `docs/making-of.md`.
- **Dependencies:** none new; WebP conversion uses Astro's built-in image service (sharp is already installed).
