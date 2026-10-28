# Proposal

## Why

In the dive, Kálmán's animations look like separate clips: the dive ends with him standing upright again before the swim starts, the swim cuts to a standing launch with a wind-up crouch (on the ice, while he is under water), and every switch between his front, side and swimming drawings happens in a single frame. Raymond, after trying the dive: "they all look like separate animations while they should fade into each other and give Kálmán his own personality and natural movements". The dive was merged as a foundation; this change makes Kálmán move as one penguin through it.

## What Changes

- **Animations flow into each other.** Starting an animation no longer snaps him to rest first: on the same figure his pose blends from where he is into the new animation; between figures (front, side, swimming) the two drawings cross-fade, never see-through.
- **A finished animation holds its last pose** instead of jumping to rest, so the next one can pick up from there. **BREAKING** for the spec's "ends at rest": an animation now ends in its last keyframe's pose, which is rest for the bow and the launch.
- **The dive flows into the swim:** it ends gliding horizontally, lined up with the swimming figure, instead of standing back up.
- **The launch starts from the swim:** he turns upward from a glide and shoots out of the water, instead of crouching on the ice first; the flight and the belly landing stay.
- **Back up to the ice, he climbs out:** scrolling back up into The ice launches him out of the water onto it, instead of cutting from swimming to standing.
- **A first bit of personality:** his swimming tempo follows the visitor's scrolling, lazy when they read, a burst when they scroll fast.
- **Film strips first:** every transition is checked as a row of frames from the real page before Raymond judges it in the browser.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `kalman-animation`: transitions between animations and figures; ending in the last keyframe's pose; the dive ends gliding; the launch starts from swimming.
- `dive`: Kálmán climbs out onto the ice when the visitor scrolls back up; his swimming tempo follows the scroll.

## Impact

- **Code:** `src/lib/kalman-animation.ts` (transition and figure-fade maths), `src/scene/kalman/kalman-player.ts` (transitions, holding the last pose, tempo), `src/scene/kalman/kalman-figure-client.ts` (figure opacity), `src/scene/kalman/poses.json` and `animations.json` (a glide pose, new launch start, dive end), `src/lib/dive.ts` (states, swim tempo), `src/scene/scroll/dive-scene.ts`, `dive-client.ts` (scroll speed).
- **Tests:** unit tests for the transition maths, the dive and launch data, the states and the tempo; e2e for flowing transitions on the dive page; Kálmán's animation snapshots for the dive and the launch change (new baselines).
- **Docs:** `docs/architecture.md`, `docs/glossary.md`, `docs/making-of.md`.
- **Dependencies:** none.
