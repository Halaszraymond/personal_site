/**
 * Kálmán on the dive's stage, in full mode (spec: dive, "Kálmán dives along"; dive-scroll
 * design §4–§5, kalman-flow design §5–§6).
 *
 * Loaded by dive-client.ts only in full mode and only after the page has loaded (or at the
 * first scroll), so GSAP, the player and the side and swimming figures never hold up the first
 * paint, and the fallback never downloads them.
 *
 * The scroll never scrubs his animations: diveState() (src/lib/dive.ts) turns the zone and the
 * scroll direction into a state, and an animation only starts when the state changes; the player
 * flows from one into the next. A one-shot (the dive, the launch) hands over to the next state
 * when it finishes. While he swims, his tempo follows the scroll speed (swimTempo()). The
 * stage's figure says its state in `data-dive-state`, for the tests.
 */
import { gsap } from 'gsap';
import {
  afterOneShot,
  ANIMATION_OF,
  diveState,
  initialState,
  swimTempo,
  type Direction,
  type DiveState,
  type Zone,
} from '../../lib/dive';
import { loadDeferredImages } from '../kalman/kalman-figure-client';
import { createPlayer } from '../kalman/kalman-player';

/** How long an express dive takes, in seconds (dive-scroll design §5: about 0.8 s). */
const EXPRESS_DURATION = 0.8;
/** How much faster Kálmán moves during an express dive. */
const EXPRESS_SPEED = 2;
/** After this long without a scroll, the visitor is reading: he slows to his lazy tempo. */
const READING_AFTER = 0.3;

export interface DiveScene {
  /**
   * The visitor scrolled: follow the zone they are in, the way they are going, and how fast
   * (in px per second).
   */
  follow(zone: Zone, direction: Direction, speed: number): void;
  /** Takes the window to `top` (px) in a quick dive, with Kálmán at speed; resolves on arrival. */
  expressDive(top: number): Promise<void>;
  /** After an express dive: settle into the state that fits where the visitor arrived. */
  arrive(zone: Zone, direction: Direction): void;
}

export function startScene(figure: SVGSVGElement, startZone: Zone): DiveScene {
  loadDeferredImages(figure);
  // The dive is goofy for now; the mood by cursor side comes with the hero (README §2.3).
  const player = createPlayer(figure, () => 'goofy');
  let state: DiveState = initialState(startZone);
  let zone = startZone;
  let expressing = false;
  let readingTimer: gsap.core.Tween | undefined;

  /** Moves to `next` and plays its animation, unless it is already playing (or `force`). */
  function enter(next: DiveState, force = false): void {
    const changed = force || next !== state || player.current() === undefined;
    state = next;
    figure.dataset['diveState'] = state;
    if (changed) player.play(ANIMATION_OF[state]);
  }

  // A finished one-shot hands over: the dive becomes the swim, the launch standing on the ice.
  player.onFinish(() => {
    if (!expressing) enter(afterOneShot(state, zone));
  });

  enter(state);

  return {
    follow(zoneNow, direction, speed) {
      zone = zoneNow;
      if (expressing) return;
      const next = diveState(state, zoneNow, direction);
      if (next !== state) enter(next);
      if (state === 'swimming' && direction !== 'none') {
        // The swim follows the scroll, and slows to a lazy glide once the visitor stops.
        player.tempo(swimTempo(speed));
        readingTimer?.kill();
        readingTimer = gsap.delayedCall(READING_AFTER, () => {
          if (state === 'swimming') player.tempo(swimTempo(0));
        });
      }
    },
    expressDive(top) {
      expressing = true;
      // From the ice he dives in, anywhere else he swims; both at double speed.
      player.play(state === 'onIce' || state === 'ashore' ? 'dive' : 'swim', EXPRESS_SPEED);
      figure.dataset['diveState'] = 'express';
      // GSAP tweens a plain number and we scroll the window to it on every frame; no ScrollTo
      // plugin needed. A Promise is like an awaitable in Python's asyncio.
      const scroll = { top: window.scrollY };
      return new Promise((resolve) => {
        gsap.to(scroll, {
          top,
          duration: EXPRESS_DURATION,
          ease: 'power2.inOut',
          onUpdate: () => window.scrollTo(0, scroll.top),
          onComplete: () => resolve(),
        });
      });
    },
    arrive(zoneNow, direction) {
      expressing = false;
      zone = zoneNow;
      // He has been swimming at speed: from there, the state of where he arrived (arriving at
      // Contact launches him onto the ice). Always restarted, so the speed is back to normal,
      // and the player flows in from wherever he is.
      state = 'swimming';
      enter(diveState('swimming', zoneNow, direction), true);
    },
  };
}
