# Design

## Context

See proposal.md (Why). The player (`kalman-player.ts`) plays one animation at a time: `play()` calls `stop()`, which puts the figure that was playing back at rest, and a finished animation also ends with `stop()`. Each animation therefore starts and ends at rest, and switching figures (`applyFigure()`) shows one `[data-layers]` group and hides the others in one step. The dive page drives the player from `diveState()`; its swim loop always runs at the same speed.

Geometry (from `resolvePose()` on the repo's rigs): the swimming figure was drawn smaller than the side figure (its body 359 units thick against the side body's 481), so a hand-over between them would make him shrink. The cut script now places the swimming figure 15 % larger (`SWIM.scale`), and the side figure lying on his front (body −90°) lines up with it when its torso is at the swimming body's height and its bill where the swimming figure's bill is (the film strips showed that matching the whole outlines left the bellies 100 units apart).

## Goals / Non-Goals

**Goals:**
- No jump anywhere in the dive: every change of animation or figure is a short blend.
- Everything decided is a pure, unit-tested function: the blend between two poses over a transition, the figure cross-fade, the states, the tempo.
- Scrubbing in the preview stays exact (snapshots depend on it): transitions only happen when an animation is *played*, not when it is scrubbed.

**Non-Goals:**
- Kálmán swimming around the stage on paths, chasing fish, reacting to the pointer in the dive: a later change, after the fish school exists.
- New drawings from Raymond (a ¾ turn from front to side): the figure cross-fade covers it for now.

## Decisions

### 1. Transitions in the player, from the last drawn pose
The player remembers what it last drew: the figure and its pose. When `play()` starts a new animation it keeps that as the transition's start, and for the first `TRANSITION` seconds (0.35 s, `sine.inOut`):
- **Same figure:** the drawn pose is `blendPoses(from, sampled, eased)`: from the old pose into the new animation, which is already moving.
- **Another figure:** the old figure stays drawn in its last pose and the two cross-fade (§2).

Without a last pose (the first animation) or when scrubbing, there is no transition. `stop()` still puts him at rest (the preview's explicit stop).

- *Alternative:* designing every animation to start and end at rest. Rejected: that is what makes them look like separate clips.

### 2. Cross-fading figures without seeing through
Two drawings at 50 % each let the background show through (kalman-animation-feel). The rule from the drawn bow applies: whichever drawing lies underneath stays solid while the one on top fades. `figureFade(amount)` gives both opacities with the drawn bow's `crossFade()`: the incoming figure fades in during the first half while the old one stays solid, and the old one fades out during the second half while the new one is solid. At every moment one of the two is fully opaque, whichever is drawn on top, so he is never see-through.

### 3. Finishing holds the last pose
A finished non-looping animation leaves the figure in its last frame (its last keyframe's pose once the lags have settled) and clears `data-animation`; the next `play()` transitions from there. The bow and the launch end at rest, so they look the same as before; the dive now ends gliding.

### 4. The dive ends gliding, the launch starts from a glide
A new side pose `glide`: body −90°, offset (134, −78), the head turned up 60° so the bill points forward, the flipper laid along the body, feet and tail trailing. It lies where the (rescaled) swimming figure swims, measured by the torso's height and the bill (unit-tested). The dive's last keyframe becomes `glide` instead of `rest`, reached from the face-first entry as he levels out; the swim then cross-fades in at the same place. The launch starts by holding `glide` for 0.3 s, so the cross-fade from the swim happens while both drawings lie the same way, then `launchTurn` (body almost upright below the surface, stretched: swooping up) → `launchRise`; the wind-up crouch on the ice goes.

### 5. The states
`afterOneShot(state, zone)`: a launch that ends in The ice leaves him `onIce`, elsewhere `ashore`. `diveState()`: scrolling up into The ice from under water (`swimming`, `diving` cut short is still `onIce`) starts `launching`, so he climbs out; scrolling down from The ice dives from `onIce` and from `ashore` alike.

### 6. Tempo follows the scroll
`swimTempo(speed)` maps the scroll speed (px/s, from the probe's movement per frame) to the swim's playback speed: 0.7 when the visitor stops to read, 1 at an ordinary scroll (800 px/s), up to 1.8 when they fly. The player gets `tempo(factor)`, which glides GSAP's `timeScale` there in 0.5 s, so a change of tempo is never a jerk. The dive script sets it on every scroll frame and lets it fall back to the reading tempo 300 ms after the last scroll.

### 7. Film strips
A scratch Playwright script scrolls the real dive page and photographs the stage every 80 ms around each transition (ice → dive → swim, swim → launch → ashore, ice ← swim). The strips are checked for jumps, see-through moments and odd poses before Raymond looks; the best ones go into the making-of.

## Risks / Trade-offs

- [A blend between two very different poses passes through an odd in-between] → Short (0.35 s) and checked in the film strips; the animations are re-keyed so neighbours meet in similar poses.
- [Cross-fading front ↔ side looks like a dissolve, not a turn] → Short and accepted for now; a drawn ¾ view can replace it later.
- [Changing the dive and launch changes their animation snapshots] → New baselines via "Update visual baselines", checked by eye.
- [Tempo changes on every scroll frame cost work] → One GSAP tween per frame at most; measured in the e2e run, no layout reads.
- [A tempo glide wakes up a stopped animation] → Found in the film strips: changing a killed GSAP tween's `timeScale` restarts it, so two animations drew at once. Stopping an animation now kills its tempo glide first.

## Migration Plan

The player's public API only grows (`tempo()`); `play()` keeps its signature. The preview gets the transitions too, which Raymond can judge there as well. Rollback is reverting the branch.

## Open Questions

- The transition length (0.35 s), the glide and the tempo range are starting points for Raymond to judge.
