/**
 * Kálmán on the dive's stage, in full mode (spec: dive, "Kálmán dives along"; design §4–§5).
 *
 * Loaded by dive-client.ts only in full mode and only after the page has loaded (or at the
 * first scroll), so GSAP, the player and the side and swimming figures never hold up the first
 * paint, and the fallback never downloads them.
 *
 * The scroll never scrubs his animations: diveState() (src/lib/dive.ts) turns the zone and the
 * scroll direction into a state, and an animation only starts when the state changes. A one-shot
 * (the dive, the launch) hands over to the next state when it finishes. The stage's figure says
 * its state in `data-dive-state`, for the tests.
 */
import { gsap } from 'gsap';
import {
  afterOneShot,
  ANIMATION_OF,
  diveState,
  initialState,
  type Direction,
  type DiveState,
  type Zone,
} from '../../lib/dive';
import { loadDeferredImages } from '../kalman/kalman-figure-client';
import { createPlayer } from '../kalman/kalman-player';

/** How long an express dive takes, in seconds (design §5: about 0.8 s). */
const EXPRESS_DURATION = 0.8;
/** How much faster Kálmán moves during an express dive. */
const EXPRESS_SPEED = 2;

export interface DiveScene {
  /** The visitor scrolled: follow the zone they are in and the way they are going. */
  follow(zone: Zone, direction: Direction): void;
  /** Takes the window to `top` (px) in a quick dive, with Kálmán at speed; resolves on arrival. */
  expressDive(top: number): Promise<void>;
  /** After an express dive: settle into the state that fits where the visitor arrived. */
  arrive(zone: Zone, direction: Direction): void;
}

export function startScene(figure: SVGSVGElement, zone: Zone): DiveScene {
  loadDeferredImages(figure);
  // The dive is goofy for now; the mood by cursor side comes with the hero (README §2.3).
  const player = createPlayer(figure, () => 'goofy');
  let state: DiveState = initialState(zone);
  let expressing = false;

  /** Moves to `next` and plays its animation, unless it is already playing. */
  function enter(next: DiveState): void {
    const changed = next !== state || player.current() === undefined;
    state = next;
    figure.dataset['diveState'] = state;
    if (changed) player.play(ANIMATION_OF[state]);
  }

  // A finished one-shot hands over: the dive becomes the swim, the launch standing ashore.
  player.onFinish(() => {
    if (!expressing) enter(afterOneShot(state));
  });

  enter(state);

  return {
    follow(zoneNow, direction) {
      if (expressing) return;
      const next = diveState(state, zoneNow, direction);
      if (next !== state) enter(next);
    },
    expressDive(top) {
      expressing = true;
      // From the ice he dives in, anywhere else he swims; both at double speed.
      player.play(state === 'onIce' ? 'dive' : 'swim', EXPRESS_SPEED);
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
      // He has been swimming at speed: from there, the state of where he arrived (arriving at
      // Contact still launches him onto the ice; arriving at The ice stands him on it).
      state = 'swimming';
      player.stop();
      enter(diveState('swimming', zoneNow, direction));
    },
  };
}
