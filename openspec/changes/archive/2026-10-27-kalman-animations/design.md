# Design

## Context

See proposal.md for the why. On `main` now (after `kalman-rig`):

- One rig (`rig.json`, the front figure, nine layers) and its poses (`poses.json`), validated by `src/lib/kalman-rig.ts` and loaded once in `src/scene/kalman/repo-rig.ts`.
- `KalmanFigure.astro` draws the figure as SVG at build time, with one flat `<g data-layer>` per layer inside a `<g data-layers>` and a `<g data-spin>`, plus the turntable views. `kalman-figure-client.ts` applies a pose, a spin or a turn by rewriting SVG attributes.
- `npm run cut:kalman` cuts the layers and views from Raymond's images; `check:kalman` proves the committed files match them.
- The dev-only preview at `/playground/`; per-page budget 50 KB of JavaScript (the preview uses about 6 KB); a CSP that blocks inline styles and scripts.

Constraints: README §5.4 (behaviour as pure functions in `src/lib/`, the drawing code only applies them; "logic outside the renderer"), §5.2 (reduced motion respected, no animating in hidden tabs), and the coding requirements (readable, *why* comments, Python comparisons).

## Goals / Non-Goals

**Goals:**
- Animations that are data, so Raymond can tune timing and poses without code.
- Blending, easing and head-follow maths that are unit-tested without a browser or GSAP.
- GSAP used for what it is good at (a clock, timelines, easing curves, smooth pointer following) and nothing else.
- A side figure built exactly like the front one: cut by the script, posable in the preview.

**Non-Goals:**
- Scroll-driven playback (GSAP ScrollTrigger is Phase 2) and Kálmán on public pages.
- The air-bubble trail, chasing a fish, and the water around him (Phase 2).
- Animating between the turntable views (they are single drawings).
- Lip-sync, blinking or other face animation (would need more layers).

## Decisions

### 1. Where the code lives

| File | Kind | What |
|---|---|---|
| `src/lib/kalman-animation.ts` | pure | Types (`Animation`, `Keyframe`, `Figure`), `validateAnimations()`, `samplePose()` (the pose at a moment, given an easing function), `blendPoses()` and `headTurn()` (pointer → head rotation). |
| `src/scene/kalman/animations.json` | data | The six animations. |
| `src/scene/kalman/kalman-player.ts` | browser | Plays an animation with GSAP on a figure: one tween of a time value, `samplePose()` on every frame, `applyPose()` to draw it; also the idle loop, head-follow, scrubbing and pausing in hidden tabs. |
| `src/lib/kalman-rig.ts` | pure | Gains the `Figure` type (`'front' \| 'side'`); poses get a `figure` field; `validatePose()` checks a pose against its own figure's rig. |
| `src/scene/kalman/rig.json` | data | Becomes `{ "front": <rig>, "side": <rig> }`, still written by `npm run cut:kalman`. |
| `src/scene/kalman/poses.json` | data | Every pose gets `"figure": "front"` or `"side"`; the side poses rest, stroke up, stroke down and dive are added. |
| `scripts/cut-kalman-layers.ts` | script | A second settings object and layer list for the side view; writes both rigs. |

### 2. Two figures in one SVG

The figure gets a group per figure: `<g data-figure="front">` and `<g data-figure="side">`, each with its own layer groups, inside the same spin group. Only one shows at a time (`display`, as for the turntable). Layer selectors become figure-scoped (`[data-figure="side"] [data-layer="head"]`), so both rigs can have a `head` and a `body`. `applyPose()` takes the figure as an argument; nothing else about it changes.

Both rigs share the 1600 × 1500 artboard and the same placement (scale 1.33, feet on y ≈ 1400, body centred on x = 800), so switching figures doesn't make him jump.

*Alternative:* two separate SVGs. Rejected: the spin, the description and the preview's controls would all have to be doubled.

### 3. Animations as keyframes of poses

```json
{
  "name": "bow",
  "label": "Bow",
  "figure": "front",
  "loop": false,
  "keyframes": [
    { "at": 0, "pose": "rest", "ease": "power2.inOut" },
    { "at": 0.6, "pose": "bow", "ease": "none" },
    { "at": 1.2, "pose": "bow", "ease": "power2.inOut" },
    { "at": 1.8, "pose": "rest" }
  ]
}
```

- `at` is in seconds; the last keyframe's `at` is the duration. `ease` is the easing from this keyframe to the next.
- **Blending:** between two keyframes, `t` goes from 0 to 1; `samplePose()` runs it through the easing function and `blendPoses(a, b, e)` gives each layer `rotate = a + (b − a) · e`, and the same for both offsets (layers a pose doesn't mention count as 0). Like `numpy.interp` with an S-curve on the input. Blending two valid poses with `e` from 0 to 1 can never leave a rotation range, because the result lies between two values that are both inside it. Eases that overshoot (`back.out`) are not on the allowed list, so this always holds.
- **Easing functions are passed in.** `samplePose(animation, posesByName, time, easeOf)` takes `easeOf(name) → (t) => number`. The player passes GSAP's own (`gsap.parseEase`); the unit tests pass simple ones (linear, and a fixed S-curve). So the maths is tested without GSAP, and the site uses GSAP's tuned curves.
- **Allowed eases:** `none`, `sine.in/out/inOut`, `power1`–`power3` `.in/out/inOut`. Validation rejects others, so a typo fails a unit test instead of silently becoming linear.
- **Head-follow** is an animation with one keyframe (rest) and `"follow": "head"`: it loops nothing and only turns the head towards the pointer (§5).

*Alternative:* writing each animation as GSAP code (`gsap.timeline().to(...)`). Shorter for a GSAP expert, but the animations would be hidden in code, untestable without a browser, and not tunable as data.

### 4. The player: GSAP as the clock

`playAnimation(figure, animation)` creates one tween: `gsap.to(clock, { time: duration, duration, ease: 'none', repeat: loop ? -1 : 0, onUpdate, onComplete })`. `onUpdate` samples the pose at `clock.time` and applies it. So GSAP only says *what time it is*; the poses come from our data and our functions.

- **One at a time:** starting an animation kills the previous tween. A finished non-looping animation applies the rest pose and clears `data-animation` on the figure.
- **Idle loop:** when nothing else plays and the switch is on, the idle animation runs (looped). It starts after the page is visible, and not at all with reduced motion.
- **Scrubbing:** the slider calls `tween.pause()` and `tween.progress(value)`; the tween's `onUpdate` draws that moment. The figure carries `data-animation` and `data-time` (rounded to 0.01 s), so tests read the state instead of guessing from pixels.
- **Hidden tab:** browsers already stop `requestAnimationFrame` (GSAP's ticker) in hidden tabs, and GSAP's lag smoothing stops a jump afterwards. On top of that the player listens to `visibilitychange` and pauses and resumes the tween itself, so the behaviour is explicit and testable.
- **Reduced motion:** the player never starts anything by itself when `prefers-reduced-motion: reduce` matches; play buttons still work (an explicit choice, which WCAG allows). The idle loop switch starts off.

### 5. Head-follow

`headTurn(pointer, headPivot, range, reach)` (pure): `dx = pointer.x − headPivot.x` in artboard units, `rotate = clamp(dx / reach · range.max, range.min, range.max)`, with `reach` ≈ 500 units (about a third of the artboard). The point straight above the head gives 0; far to either side gives the end of the range. The player turns screen coordinates into artboard coordinates with the SVG's `getScreenCTM().inverse()`, and smooths the head with `gsap.quickTo` (about 0.3 s), so it follows without jitter. When the pointer leaves the stage the head returns to rest.

### 6. The side figure

- **Images:** three, made by Raymond with Gemini (delivered): `side-goofy.png` (the side view in rest pose, bill to the left, feet flat), `side-professional.png` (an edit adding the tie, glasses and calm eye) and `side-no-flipper.png` (an edit with the near flipper removed and the body painted underneath). In a side view the flipper lies *on* the body, so there is no white gap to cut along; the flipper-less edit gives the body as it looks under the flipper instead. Prompts in `docs/kalman-layers.md`.
- **Layers:** `body`, `head`, `flipper` (the near one), `footFront`, `footBack`, `tail`, `tie`, `glasses`. The far flipper is behind the body in a side view, so it is part of the body.
- **Cutting:** the same library (`scripts/lib/kalman-cut.ts`): flood fill, the difference masks and the neck fade. The **flipper** is cut along its outline, traced once on `side-goofy.png` as a polygon in the script's settings and smoothed at the edge (a new pure function, `polygonCoverage()`). *(Changed during apply: the difference with `side-no-flipper` was tried first, but Gemini's edit also changed the feathers around the flipper, so the difference was noisy and the outline at the top didn't close.)* The **body** comes from `side-no-flipper`, so a swinging flipper shows painted body underneath instead of a ghost of itself. The tie and glasses come from `side-professional`, as for the front. The numbers (cut lines, pivots) are measured on the images with the same row-by-row outline as for the front.
- **Poses:** rest, stroke up and stroke down (the flipper at the top and bottom of a stroke, the body slightly tilted), and dive (the body tilted head-down, the flipper back). Swim loops between the stroke poses; dive and launch tilt and move the whole body.

### 7. The six animations

| Animation | Figure | Loop | Idea |
|---|---|---|---|
| idle | front | yes | ~4 s: a slow sway of the body (±2°), the head a little behind it, flippers barely moving; reads as breathing |
| bow | front | no | ~1.8 s: rest → bow → hold → rest |
| head-follow | front | (follows) | the head follows the pointer |
| dive | side | no | ~1.5 s: rest → crouch → dive (tilted head-down, moving down and forward) |
| swim | side | yes | ~0.8 s per stroke: stroke up ↔ stroke down, with a small bob |
| launch | side | no | ~1.6 s: swim → body points up → moves up fast → rest |

The timings are starting values for Raymond to tune in `animations.json`.

### 8. The preview

New controls, all plain HTML built from the data, like the existing ones:

- **Figure:** a front/side switch (two radio buttons). It switches the pose buttons and rotation sliders to that figure's poses and layers.
- **Animations:** one button per animation (`aria-pressed` while playing; for head-follow: while following, until another animation starts), the idle loop switch, and a scrub slider (0 to the animation's duration in 0.01 s steps, with an `<output>`).

### 9. Budgets

The preview loads GSAP core (3.15, about 27 KB gzipped) plus our code, about 35 KB in total: within the 50 KB page budget, so no separate budget is needed. Public pages don't load it yet. The size is measured and logged during the change.

### 10. Testing

| Layer | Where | What |
|---|---|---|
| Logic | Vitest | `validateAnimations()` for each failure in the spec; `samplePose()` at keyframes, halfway with a linear ease, and with a fixed S-curve; `blendPoses()` stays inside the ranges; `headTurn()` above, far left/right, clamped; the side rig and poses; `validatePose()` per figure. |
| Data | Vitest | The repo's `animations.json` validates against both rigs' poses and contains the six animations. |
| Page | Playwright | Play bow → `data-animation="bow"` while playing, rest and no `data-animation` afterwards; starting swim stops idle; the idle loop on by default, off with reduced motion; scrub slider sets `data-time` and the layers; the front/side switch; head-follow turns the head with the pointer; a hidden tab (stubbed `visibilityState` plus a `visibilitychange` event) stops `data-time` advancing. |
| Snapshots | Playwright `visual` | Key moments, held with the scrub slider: the bow at its deepest point, the dive halfway, the swim at the top of a stroke, the launch pointing up. |

## Risks / Trade-offs

- [The side images don't come out with a clear flipper gap] → the same fallback as the front: cut along the shoulder; and the prompt asks for the gap explicitly.
- [Cut-out animation looks stiff] → easing on every keyframe, overlapping motion (the head lags the body in idle), and Raymond tunes the data in the preview.
- [GSAP's ticker keeps the page busy] → nothing loops with reduced motion; the idle loop can be switched off; animations pause in hidden tabs.
- [The rig.json format changes (two rigs)] → it is generated by the script, validated on load and by unit tests; the turntable stays front-only.
- [Tests that wait for animations get slow or flaky] → tests hold moments with the scrub slider and read `data-time`/`data-animation`, instead of waiting for time to pass.

## Migration Plan

- `npm install gsap@3.15` (Raymond approved). New baselines with "Update visual baselines".
- Rollback: revert the merge; nothing on production uses the animations yet.

## Open Questions

- The exact timings and poses: starting values in `animations.json`, tuned by Raymond in the preview. This changes data, not the design.
