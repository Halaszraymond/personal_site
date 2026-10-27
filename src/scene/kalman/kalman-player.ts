/**
 * Plays Kálmán's animations on a drawn figure (spec: kalman-animation; design §4–§5).
 *
 * GSAP is only the clock here: one tween moves a plain `time` value from 0 to the animation's
 * play length (its keyframes plus the largest lag, `playLength()`), and on every frame `samplePose()` (src/lib/kalman-animation.ts) works out the pose at
 * that time from the keyframes in animations.json, and `applyPose()` draws it. GSAP also gives
 * the easing curves (`gsap.parseEase`) and the smooth pointer following (`gsap.quickTo`).
 *
 * The figure says what it is doing: `data-animation` (the playing animation, if any) and
 * `data-time` (seconds into it), so the preview and the tests can read the state.
 */
import { gsap } from 'gsap';
import {
  drawnFrame,
  headTurn,
  playLength,
  samplePose,
  type Animation,
  type EaseOf,
} from '../../lib/kalman-animation';
import {
  applyToPoint,
  clampToRig,
  resolvePose,
  type Figure,
  type Mood,
  type Pair,
  type Pose,
} from '../../lib/kalman-rig';
import { applyDrawn, applyFigure, applyPose } from './kalman-figure-client';
import { poseNamed, posesFor, REPO_ANIMATIONS, REPO_RIGS } from './repo-rig';

/** GSAP's own curves for the easing names in animations.json. */
const easeOf: EaseOf = (name) => gsap.parseEase(name);

/** How far the pointer must be to the side of the head for a full head turn (artboard units). */
const HEAD_REACH = 500;
/** How long the head takes to catch up with the pointer, in seconds: smooth, not jittery. */
const HEAD_LAG = 0.3;

/** What the player can do; created once per figure with `createPlayer()`. */
export interface Player {
  /** Plays an animation from the start; stops the one that was playing. */
  play(name: string): void;
  /** Stops whatever plays and puts the current figure at rest. */
  stop(): void;
  /** Holds the current (or the named) animation still at `progress` (0 = start, 1 = end). */
  scrub(progress: number, name?: string): void;
  /** The animation that is playing or held, if any. */
  current(): Animation | undefined;
  /** Called when a non-looping animation has finished. */
  onFinish(listener: (animation: Animation) => void): void;
  /** Called on every drawn frame, with the animation and the time in seconds. */
  onFrame(listener: (animation: Animation, time: number) => void): void;
}

/** The poses of one figure by name, like a Python dict, for `samplePose()`. */
function posesByName(figure: Figure): Map<string, Pose> {
  return new Map(posesFor(figure).map((pose) => [pose.name, pose]));
}

export function createPlayer(figure: SVGSVGElement, moodOf: () => Mood): Player {
  let playing: Animation | undefined;
  let tween: gsap.core.Tween | undefined;
  let pausedByHiddenTab = false;
  const finishListeners: ((animation: Animation) => void)[] = [];
  const frameListeners: ((animation: Animation, time: number) => void)[] = [];
  const clock = { time: 0 };

  /** Draws `animation` at `time` seconds, and writes the state on the figure. */
  function draw(animation: Animation, time: number): void {
    const rig = REPO_RIGS[animation.figure];
    // Clamped, because an overshooting easing may ask a layer for a little more than its range.
    const pose = clampToRig(
      samplePose(animation, posesByName(animation.figure), time, easeOf),
      rig,
    );
    applyFigure(figure, animation.figure);
    applyPose(figure, rig, pose, moodOf());
    applyDrawn(figure, animation.figure, drawnFrame(animation, time), moodOf());
    figure.dataset['animation'] = animation.name;
    figure.dataset['time'] = time.toFixed(2);
    for (const listener of frameListeners) listener(animation, time);
  }

  /** Stops the tween and head-follow, and puts the figure that was playing at rest. */
  function stop(): void {
    tween?.kill();
    tween = undefined;
    stopFollowing();
    if (playing !== undefined) {
      applyPose(figure, REPO_RIGS[playing.figure], poseNamed('rest', playing.figure), moodOf());
      applyDrawn(figure, playing.figure, undefined, moodOf());
    }
    playing = undefined;
    delete figure.dataset['animation'];
    delete figure.dataset['time'];
  }

  /** A paused or playing tween of the clock over `animation`, drawing every frame. */
  function tweenFor(animation: Animation, paused: boolean): gsap.core.Tween {
    clock.time = 0;
    const length = playLength(animation);
    return gsap.to(clock, {
      time: length,
      duration: length,
      ease: 'none',
      paused,
      repeat: animation.loop ? -1 : 0,
      onUpdate: () => draw(animation, clock.time),
      onComplete: () => {
        stop();
        for (const listener of finishListeners) listener(animation);
      },
    });
  }

  function animationNamed(name: string): Animation {
    const animation = REPO_ANIMATIONS.find((a) => a.name === name);
    if (animation === undefined) throw new Error(`Unknown animation "${name}".`);
    return animation;
  }

  // -------------------------------------------------------------------------------------
  // Head-follow: the head turns towards the pointer while it moves over the figure.
  // -------------------------------------------------------------------------------------

  const head = { rotate: 0 };
  const frontRig = REPO_RIGS.front;
  const headLayer = frontRig.layers.find((layer) => layer.name === 'head');
  const headPivot: Pair = resolvePose(frontRig, poseNamed('rest'), 'goofy').find(
    (l) => l.name === 'head',
  )?.pivotOnArtboard ?? [0, 0];
  const drawHead = () =>
    applyPose(
      figure,
      frontRig,
      {
        name: 'head-follow',
        label: 'Head-follow',
        figure: 'front',
        layers: { head: { rotate: head.rotate } },
      },
      moodOf(),
    );
  // `quickTo` makes one reusable tween: calling it with a new value glides there in HEAD_LAG s.
  const turnHeadTo = gsap.quickTo(head, 'rotate', {
    duration: HEAD_LAG,
    ease: 'power2.out',
    onUpdate: drawHead,
  });

  /** Where the pointer is on the artboard: the SVG's screen matrix, inverted. */
  function pointerOnArtboard(event: PointerEvent): Pair | undefined {
    const matrix = figure.getScreenCTM();
    if (matrix === null) return undefined;
    const inverse = matrix.inverse();
    const m = {
      a: inverse.a,
      b: inverse.b,
      c: inverse.c,
      d: inverse.d,
      e: inverse.e,
      f: inverse.f,
    };
    return applyToPoint(m, [event.clientX, event.clientY]);
  }

  const onPointerMove = (event: PointerEvent) => {
    const point = pointerOnArtboard(event);
    if (point === undefined || headLayer === undefined) return;
    turnHeadTo(headTurn(point, headPivot, headLayer.rotate, HEAD_REACH));
  };
  const onPointerLeave = () => turnHeadTo(0);
  let following = false;

  function startFollowing(): void {
    following = true;
    applyFigure(figure, 'front');
    figure.addEventListener('pointermove', onPointerMove);
    figure.addEventListener('pointerleave', onPointerLeave);
  }

  function stopFollowing(): void {
    if (!following) return;
    following = false;
    figure.removeEventListener('pointermove', onPointerMove);
    figure.removeEventListener('pointerleave', onPointerLeave);
    gsap.killTweensOf(head);
    head.rotate = 0;
  }

  // -------------------------------------------------------------------------------------
  // Hidden tab: pause, and continue where it was when the page is visible again.
  // -------------------------------------------------------------------------------------

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (tween !== undefined && !tween.paused()) {
        tween.pause();
        pausedByHiddenTab = true;
      }
    } else if (pausedByHiddenTab) {
      pausedByHiddenTab = false;
      tween?.resume();
    }
  });

  return {
    play(name) {
      const animation = animationNamed(name);
      stop();
      playing = animation;
      if (animation.follow === 'head') {
        figure.dataset['animation'] = animation.name;
        startFollowing();
        return;
      }
      tween = tweenFor(animation, false);
      draw(animation, 0);
    },
    stop,
    scrub(progress, name) {
      const animation = name === undefined ? playing : animationNamed(name);
      if (animation === undefined || animation.follow === 'head') return;
      if (animation !== playing || tween === undefined) {
        stop();
        playing = animation;
        tween = tweenFor(animation, true);
      }
      tween.pause();
      pausedByHiddenTab = false;
      // Setting the progress renders that moment, which calls onUpdate and so draws it.
      tween.progress(Math.min(1, Math.max(0, progress)));
      draw(animation, clock.time);
    },
    current: () => playing,
    onFrame(listener) {
      frameListeners.push(listener);
    },
    onFinish(listener) {
      finishListeners.push(listener);
    },
  };
}
