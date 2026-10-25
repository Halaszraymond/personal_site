/**
 * A 3D view of Kálmán: renderer, camera, light, drag-to-turn, and the swim preview.
 *
 * It draws a frame only when something changes (a new config, the view being turned,
 * the swim preview playing), and stops while the tab is hidden (spec: kalman-playground,
 * "Draws only when needed"). A loop that draws 60 times per second for a still image
 * would drain a phone's battery for nothing.
 *
 * For the tests, the canvas carries data-frames, data-triangles and data-draw-calls,
 * read from Three.js's own counters after each frame.
 */
import {
  Color,
  DirectionalLight,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  type Group,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { KalmanConfig } from '../../lib/kalman-config';
import { strokeAngle } from '../../lib/kalman-shape';
import { buildKalman, disposeKalman, poseFlippers } from './build-kalman';

/** Sharper than this costs a lot of pixels on phones for no visible gain (README §5.4). */
const MAX_PIXEL_RATIO = 2;
/** Where the camera looks: about the middle of Kálmán's chest. */
const TARGET_HEIGHT = 0.5;
/** Ice white, the top of the dive's colour scale (README §2.6). */
const BACKGROUND = '#eef3f7';

export interface KalmanView {
  /** Shows Kálmán with a new config. */
  setConfig(config: KalmanConfig): void;
  /** Starts or stops the swim preview. */
  setSwimming(swimming: boolean): void;
  /** Turns the view back to the front. */
  resetView(): void;
  /** Stops drawing and frees the GPU memory. */
  dispose(): void;
}

/** Creates the view in a canvas element; the canvas takes the size of its parent. */
export function createKalmanView(canvas: HTMLCanvasElement, initial: KalmanConfig): KalmanView {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));

  const scene = new Scene();
  scene.background = new Color(BACKGROUND);
  // Soft light from the sky and the ice, plus one sun-like light for the facets.
  scene.add(new HemisphereLight('#ffffff', '#b8c4cc', 1.6));
  const sun = new DirectionalLight('#ffffff', 2.2);
  sun.position.set(1.5, 2.5, 2);
  scene.add(sun);

  const camera = new PerspectiveCamera(35, 1, 0.01, 20);
  // Slightly from his right, so the bill reads as a bill instead of pointing straight at you.
  camera.position.set(0.75, 0.68, 2.25);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, TARGET_HEIGHT, 0);
  controls.enablePan = false; // turning and zooming only, so he can't be lost off-screen
  controls.minDistance = 1.2;
  controls.maxDistance = 4;
  controls.update();
  controls.saveState(); // the front view that "Reset view" returns to

  let config = initial;
  let kalman: Group = buildKalman(config);
  scene.add(kalman);

  let swimming = false;
  let swimTime = 0; // seconds of swimming so far; only advances while playing
  let lastFrameTime: number | null = null;
  let frameRequested = false;
  let frames = 0;

  function draw(now: number): void {
    frameRequested = false;
    if (swimming) {
      // Advance the swim clock by the real time since the previous frame.
      swimTime += lastFrameTime === null ? 0 : (now - lastFrameTime) / 1000;
      lastFrameTime = now;
      poseFlippers(kalman, strokeAngle(swimTime, config.strokeAmplitude, config.strokeSpeed));
    }
    renderer.render(scene, camera);
    frames += 1;
    canvas.dataset['frames'] = String(frames);
    canvas.dataset['triangles'] = String(renderer.info.render.triangles);
    canvas.dataset['drawCalls'] = String(renderer.info.render.calls);
    if (swimming) requestFrame();
  }

  /** Asks for one new frame; several requests before it is drawn give just one frame. */
  function requestFrame(): void {
    if (!frameRequested && !document.hidden) {
      frameRequested = true;
      requestAnimationFrame(draw);
    }
  }

  function resize(): void {
    const { clientWidth, clientHeight } = canvas.parentElement ?? canvas;
    if (clientWidth === 0 || clientHeight === 0) return;
    renderer.setSize(clientWidth, clientHeight, false); // false: CSS controls the canvas size
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    requestFrame();
  }

  function onVisibilityChange(): void {
    // Hidden: requestFrame refuses and the loop ends by itself. Visible again: resume.
    lastFrameTime = null;
    if (!document.hidden) requestFrame();
  }

  controls.addEventListener('change', requestFrame);
  document.addEventListener('visibilitychange', onVisibilityChange);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas.parentElement ?? canvas);
  resize();

  return {
    setConfig(next) {
      config = next;
      scene.remove(kalman);
      disposeKalman(kalman);
      kalman = buildKalman(config);
      scene.add(kalman);
      requestFrame();
    },
    setSwimming(next) {
      swimming = next;
      lastFrameTime = null;
      if (!swimming) poseFlippers(kalman, 0);
      requestFrame();
    },
    resetView() {
      controls.reset();
      requestFrame();
    },
    dispose() {
      swimming = false;
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      controls.dispose();
      disposeKalman(kalman);
      renderer.dispose();
    },
  };
}
