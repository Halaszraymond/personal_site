# Design

## Context

See proposal.md (Why). Today `HomePage.astro` renders one test sentence inside `BaseLayout`, which already has the language switcher, the `RenderModeSwitch` (fallback by default, `full` after the checks of `src/lib/render-mode.ts`) and an empty, `aria-hidden` scene slot. Kálmán exists as `KalmanFigure.astro` (three figures, layers as SVG `<image>`s, hidden turntable views and drawn poses) and `kalman-player.ts` (GSAP clock, `samplePose()`, drawn poses, head-follow), so far only used by the dev preview.

Two facts shape the design:
- **Weight.** Kálmán's images are PNGs: front 1.6 MB, side 0.7 MB, swim 0.4 MB, turntable views 3.3 MB, drawn poses 0.8 MB. `KalmanFigure` always draws all of them. That alone would sink Lighthouse on a phone.
- **No fonts yet.** The font choice is still open (README §8) and gets its own playground; this change uses a system font stack, so it doesn't block on it.

## Goals / Non-Goals

**Goals:**
- Native scrolling stays native: no scroll hijacking, no smooth-scroll libraries. The page is long HTML; scripts only read the scroll position and react.
- Everything that decides something is a pure function in `src/lib/dive.ts`, unit-tested: depth from scroll, colour from depth, Kálmán's state from depth and direction.
- The page works and reads fully without JavaScript; full mode only adds motion.

**Non-Goals:**
- The hero's "catch of the day" board, the CV fish and the mood by cursor side (Phase 2, next changes).
- The fish school, fish turning into charts, the dive profile line, the sonar (later Phase 2 and Phase 5).
- Real texts (Phase 3); the font choice; the "lite mode" footer switch and the frame-time check (README §5.2 step 3), which join when the scene is heavy enough to measure.

## Decisions

### 1. Layout: long sections, a sticky stage, a fixed gauge
The sections are ordinary `<section>`s in one column (max ~36 rem). Kálmán sits in the scene slot, which becomes a **sticky stage**: on desktop a column to the right of the text, on a phone a band at the top of the viewport (about 30 % of its height, `svh` units so mobile address bars don't make it jump), with the text scrolling below it, never under it. The **depth gauge** is a `<nav>` fixed to the right edge: a vertical scale with the section names at their depths, the current depth as a number, and a marker; on a phone it narrows to the scale and short labels. The ice section is the first screen; The catch is the longest (164 m of depth); an **ascent** block of about one screen sits between The catch and Contact.

- *Alternative:* a canvas or a scroll-snapped slideshow. Rejected: content must stay HTML (README §5.2), and snapping takes the scroll away from the visitor.

### 2. Depth from scroll: piecewise linear between measured anchors
The probe is the middle of the viewport. Each section start carries its depth (`data-depth`), plus two extra anchors: the bottom of The catch (564 m) and the start of Contact (0 m). On load and on resize the script measures their positions; on scroll (passive listener, at most once per animation frame) `depthAt(probe, anchors)` interpolates linearly between the two anchors around the probe and clamps outside them. So the mapping is continuous, each section starts exactly at its depth, and the ascent counts back down from 564 m to 0 m.

- *Alternative:* depth proportional to the whole page height. Rejected: sections have different lengths, and the README fixes their depths.

### 3. Colour from depth, with contrast built in
`waterAt(depth)` blends between colour stops (ice blue at 0 m, sunlit blue at 100 m, twilight blue at 250 m, deep blue at 400 m, ink black at 564 m), in a perceptual space (OKLab) so the gradient doesn't go muddy. `textFor(background)` picks the light or the dark text colour, whichever has the higher contrast; a unit test samples every metre and asserts at least 4.5:1, and the golden-orange accent (gauge, links) is checked the same way. The ascent uses the same function, so it lightens back to the ice naturally. In full mode the script sets the colours as CSS custom properties on `<html>`; in the fallback each section gets the colours of its own middle depth at build time, so the page is still a gradient of steps.

### 4. Kálmán's state from depth and direction
`diveState(previous, depth, zone, direction)` is a small state machine:
- `onIce` (idle) while in The ice at 0 m;
- leaving The ice downwards → `diving` (play `dive` once), then `swimming` (loop `swim`);
- entering the ascent → `launching` (play `launch` once, with its belly landing), then `ashore` (idle) at Contact;
- scrolling back up into The ice → `onIce` again; scrolling back up from Contact into the ascent → `swimming`.

The dive script only plays an animation when the state changes, through the existing player, so the scroll never scrubs or restarts animations frame by frame. A one-shot animation that is still playing finishes before the next one starts, unless the visitor reverses direction.

- *Alternative:* scrubbing the animations with the scroll position. Rejected: the dive and the launch are performances with their own timing; scrubbing them by hand looks mechanical and breaks the moment he lands.

### 5. Express dive
The gauge entries are plain `<a href="#work">` links, so they work without JavaScript. In full mode the script takes over the click: it tweens the window's scroll position to the section with GSAP (about 0.8 s, `power2.inOut`; no ScrollTo plugin needed), Kálmán plays `dive` or `swim` at speed during it, and the depth state is recomputed at the end, so arriving in Contact still lands him on the ice. In the fallback, and whenever reduced motion is requested, the jump is instant. Either way focus moves to the section's heading (`tabindex="-1"`), and the URL hash is updated without a second jump.

### 6. The still dive
In the fallback the scene slot stays hidden (as now). Instead each section has its own small, static `KalmanFigure` (front figure only) in a fitting pose: The ice and Contact `rest`, Who I am `headTiltRight`, Work `flippersUp`, Education `headTiltLeft`, The catch `bow`. They are plain inline SVG, so they show without JavaScript; in full mode CSS hides them and the stage shows instead. They share the front figure's images, so the fallback downloads nothing else.

### 7. Lighter images
`KalmanFigure` gets two props, `turntable` and `drawnPoses` (both default off; the dev preview turns both on), and builds every image it does draw through Astro's `getImage()` as **WebP**, at twice the width it has on a 480 px wide stage (so sharp on a 2× screen). The side and swimming figures, which the dive only needs after the first scroll, are emitted with their URL in `data-href` and get their `href` after the page's `load` event (or when the first scroll needs them, whichever comes first). The front figure loads eagerly: it's the first view.

### 8. Content in three languages
The section headings and placeholder texts live in `src/i18n/ui.ts` next to the existing strings (`dive.sections.<id>.heading` / `.text`, gauge labels, "depth" announcements), in NL, HU and EN, written per language, not translated. The section ids, depths and order live in `src/lib/dive.ts`, so the page, the gauge and the depth mapping can never disagree.

## Risks / Trade-offs

- [Scroll handlers make scrolling janky] → A passive listener that only schedules one `requestAnimationFrame`; measurements on load and resize only; no layout reads inside the frame callback except the cached anchors.
- [The sticky band takes too much of a small phone] → 30 % of the viewport at most, tuned with Raymond; the text column always gets the rest.
- [Colour changes make text hard to read mid-gradient] → The contrast test runs over every metre; text switches between light and dark at the depth where both are acceptable.
- [GSAP on the home pages pushes the budget] → Measured with `npm run size`; GSAP and the player load as a module after the first paint, and the fallback never loads them.
- [WebP looks different from the PNGs] → Quality set high (about 85); checked against the existing Kálmán snapshots, which must stay within their tolerance.
- [An express dive and the state machine disagree at the end] → The state is recomputed from the final depth when the tween ends, not from the animation that played.
- [Visual baselines for the home pages change completely] → New baselines through "Update visual baselines", checked by eye; the old Phase 0 home snapshots are replaced.

## Migration Plan

`HomePage.astro` keeps its role (one component per language) and renders the dive; the Phase 0 test string goes, and the tests that look for it move to the section headings. `KalmanFigure`'s new props default to off, and the preview passes them on, so the preview looks the same. Rollback is reverting the branch.

## Open Questions

- The exact section heights, the stage size and the gauge's look on a phone are tuned with Raymond in the browser; the numbers above are starting points.
