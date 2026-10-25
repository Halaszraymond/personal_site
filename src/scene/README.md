# src/scene/

Everything 3D (Three.js), split into:

- `kalman/`: Kálmán's model, config and animations
- `school/`: the fish
- `environment/`: water, light and the southern lights
- `scroll/`: depth → scene

Three.js only *draws* here; the behaviour itself (depth mapping, boids, the personality state machine)
lives as pure, testable functions in `src/lib/` (README §5.4).

Empty in Phase 0: the page only has an empty scene slot. Kálmán arrives in Phase 1.
