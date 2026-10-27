# Proposal

## Why

Raymond judged the animations after Phase 1 was merged: the idle loop moves in a relaxed, natural way, but the bow is not deep enough, and the dive, the swim and the launch look stiff, "too static". The cause is in the data and the rig. All layers start and stop together on the same keyframes, nothing overshoots or settles, the anticipation before the dive is tiny, the dive slides in a straight line, the feet never move, he swims upright instead of lying in the water, and the bow from the front only slides the head down 26 px. Phase 2 (the dive) builds on these animations, so they should feel alive before it starts. Raymond supplied reference stills of real penguins and described the feeling of each animation (design.md, "References and feeling").

## What Changes

- **Follow-through and overlap:** an animation can give layers a small **lag** in seconds, so the head leads and the tail, feet and flippers trail behind and settle after the body stops.
- **Overshoot:** the easings `back.out` and `back.inOut` are allowed, so a movement can go slightly past its target and settle back. A blended pose is still clamped to each layer's allowed range.
- **Squash and stretch:** a layer can **stretch** (taller and thinner) or **squash** (shorter and wider) around its pivot, keeping its area the same. The rig gives each layer an allowed stretch range; children follow their parent's stretch.
- **Drawn poses:** a keyframe can show a whole drawing of Kálmán instead of his layers, cross-fading in and out, as the turntable views already do. The first one is the **drawn bow**, cut from two new images by Raymond (goofy and professional).
- **A polite, deep bow** (front): like a butler welcoming a guest. The head folds down, the body stays almost upright, the flippers stay at his sides, and at the deepest moment the drawn bow takes over and holds.
- **A dive that is a little goofy but natural:** lean forward, crouch with squash, a small hop with flailing flippers, and face first into the water with the tail and feet trailing.
- **An elegant swim:** horizontal like a torpedo, surging on the down stroke and gliding on the up stroke, trailing feet and tail, and a glance at a passing fish once per loop.
- **A professional launch with a goofy landing:** rising upright like a rocket with the flippers pressed to his body, flying out at an angle, landing on his feet with a squash, almost losing his balance with the flippers out, and straightening up.
- **Eyes that follow:** during head-follow his pupils look at the pointer too, a moment ahead of the head, in both moods. The pupils become their own layers, cut from two new images by Raymond without pupils (goofy and professional), and the rig limits how far a pupil may shift so it stays inside its eye. *(Added after the first round, at Raymond's request.)*
- **The idle loop** keeps its current keyframes, because Raymond likes how it moves.
- **Tempo and travel:** animations may get longer where the feeling needs it (bow ~2.4 s, dive ~2.2 s, swim loop ~3.6 s, launch ~2.8 s). He stays in his spot sideways and moves up and down only where the story asks for it.
- **The preview** gets a stretch slider for each layer that may stretch, and Copy pose includes stretch values, so Raymond can tune the new poses by eye.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `kalman-rig`: the front rig gets pupil layers, shown in their own mood and limited to a shift range; poses can stretch layers within a stretch range from the rig; validation rejects a stretch outside it; children follow their parent's stretch; drawn poses are cut from the design images and placed on the front figure's ground line.
- `kalman-animation`: head-follow moves the pupils towards the point as well; animations can give layers a lag and can show a drawn pose with a cross-fade; overshooting easings are allowed with the blended pose kept inside the rig's ranges; a non-looping animation ends at rest only once every lagging layer has settled; the bow, dive, swim and launch each get their own requirement for how they move.
- `kalman-preview`: head-follow on the stage moves the eyes too; a stretch slider per layer that may stretch; Copy pose includes stretch.

## Impact

- **Code:** `src/lib/kalman-rig.ts` (stretch in poses, rig layers, `resolvePose()` and validation), `src/lib/kalman-animation.ts` (lag, overshoot eases, clamping, play length, drawn-pose fades), `src/scene/kalman/kalman-player.ts` (play length, clamping, cross-fading drawn poses), `src/scene/kalman/KalmanFigure.astro` and `kalman-figure-client.ts` (drawing the drawn poses, hidden until used), `scripts/cut-kalman-layers.ts` (stretch ranges, the side body's wider range, cutting the drawn bow), `src/playground/preview-client.ts` and `src/lib/preview-pose.ts` (stretch sliders, Copy pose).
- **Data:** `rig.json` (regenerated), a new `drawn-poses.json` (generated, like `turntable.json`), `poses.json` and `animations.json`.
- **Art:** `front-bow-goofy.png` and `front-bow-professional.png` from Raymond (regenerated with warmer eyes), and `front-goofy-no-pupils.png` and `front-professional-no-pupils.png` for the eyes, in `docs/images/kalman-design/`.
- **Tests:** unit tests for stretch, lag, clamping, the new eases, the drawn-pose fade and each animation's scenarios against the repo data; e2e tests for the stretch sliders and the drawn bow; new snapshot baselines.
- **Docs:** `docs/architecture.md`, `docs/glossary.md` (anticipation, follow-through, overlap, overshoot, squash and stretch, lag, drawn pose), `docs/kalman-layers.md` (prompts 7 and 8), `docs/making-of.md`, `src/scene/README.md`.
- **Repo:** a `.gitignore` entry for a local `references/` folder, so reference stills of real penguins (other people's footage) never get committed.
- **Dependencies:** none. GSAP already has the `back` easings.
- **Budget:** the drawn bow adds two images (lazy, dev preview only for now) and a few hundred bytes of JavaScript; public pages are unchanged.
