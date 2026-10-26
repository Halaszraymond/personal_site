# src/scene/

Everything animated on the site, in 2D (README §5.1), split into:

- `kalman/`: Kálmán as a cut-out figure: his rig (`rig.json`), his named poses (`poses.json`),
  the SVG figure (`KalmanFigure.astro`) and the script that changes his pose in the browser.
  His animations (GSAP) follow in the next change.
- `school/`: the fish (canvas 2D), Phase 2
- `environment/`: ice, water, light and the southern lights, Phase 2
- `scroll/`: depth → scene, Phase 2

The code here only *draws*; the maths and behaviour (rig and pose maths, later depth mapping,
boids and the personality state machine) live as pure, testable functions in `src/lib/`
(README §5.4). Kálmán's images live in `src/assets/kalman/`; see `docs/kalman-layers.md`.
