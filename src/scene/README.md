# src/scene/

Everything animated on the site, in 2D (README §5.1), split into:

- `kalman/`: Kálmán as a cut-out figure, from the front and from the side: his rigs
  (`rig.json`), his named poses (`poses.json`), his animations (`animations.json`), his
  turntable views (`turntable.json`), the SVG figure (`KalmanFigure.astro`), the script that
  changes his pose, spin and angle in the browser (`kalman-figure-client.ts`) and the player
  that runs the animations with GSAP (`kalman-player.ts`). `rig.json` and `turntable.json` are
  written by `npm run cut:kalman`; don't edit them by hand. `poses.json` and `animations.json`
  are for tuning by hand.
- `school/`: the fish (canvas 2D), Phase 2
- `environment/`: ice, water, light and the southern lights, Phase 2
- `scroll/`: depth → scene, Phase 2

The code here only *draws*; the maths and behaviour (rig, pose and animation maths, later
depth mapping, boids and the personality state machine) live as pure, testable functions in `src/lib/`
(README §5.4). Kálmán's images live in `src/assets/kalman/`; see `docs/kalman-layers.md`.
